---
title: "Error policies and reference"
description: "Contracts, reporting, presentation, Throwable, and the actual scope of exception handling across HTTP, CLI, MCP, tasks, and connections."
editUrl: true
lastUpdated: false
---

This reference covers `orionis.failure` and the entry points that use it. Start with [Exception handling](/en/architecture/exception-handling) to register the handler class; see [Reporting and handling exceptions](/en/architecture/exception-handling/handling-exceptions) to implement it. The [HTTP exceptions guide](/en/http/exceptions) explains the diagnostic page and the responses visible in a browser.

## Module responsibilities

The module separates three operations:

1. Convert an exception into a structured record.
2. Report the failure through the logger.
3. Present it according to the context that caught it.

`Catch` coordinates these operations; the handler provides the policy. Registering a handler does not install a `sys.excepthook` or automatically catch every task or exception in the process. Each entry point decides which errors it intercepts and which handler methods it uses.

The `Catch.exception()` flow is:

```text
Exception delivered to Catch
  → Resolve the handler on first use
  → Obtain the active scope and its kernel value
  → await app.call(handler, "report", exception=exception)
  → CONSOLE: await app.call(handler, "handleCLI", ...)
  → HTTP: await app.call(handler, "handleHTTP", ..., request=request)
  → Another non-null context: finish after reporting
```

Methods execute in order: reporting must finish before presentation begins. The value returned by `report()` does not become the input of `handleHTTP()` or `handleCLI()`: both receive the original exception.

## Public imports

Use the facade to access the registered service in a booted application:

```python
from orionis.support.facades import Catch
```

These imports are available when implementing or receiving the contracts:

```python
from orionis.failure.base import BaseExceptionHandler
from orionis.failure.contracts import ICatch
from orionis.failure.contracts.handler import IBaseExceptionHandler
from orionis.failure.entities import Throwable
from orionis.failure.enums import KernelContext
```

`from orionis.failure import Catch` imports the concrete service class. It is distinct from the facade and requires an application in its constructor. Direct construction is mainly intended for infrastructure and tests.

`orionis.failure` exports only `Catch`; `orionis.failure.contracts` exports `ICatch`. Import `IBaseExceptionHandler` from its defining `contracts.handler` module.

## Catch and ICatch

### Constructor and signature

The concrete implementation is constructed with `Catch(app: IApplication)`. Its public operation is asynchronous:

```python
async def exception(
    self,
    exception: BaseException,
    request: Request | TransportAdapter | None = None,
) -> Response | None:
    ...
```

`ICatch` declares this same operation. Receiving the contract through dependency injection uses the configured service without constructing another coordinator.

| Argument | Purpose |
|---|---|
| `exception` | Original exception instance to report and present. |
| `request` | HTTP request or transport adapter; required for the HTTP context. |
| Return value | HTTP handler response; normally `None` in CLI or another context. |

`request=None` supports the CLI flow. It does not turn an HTTP failure into an error without a request: the default HTTP policy calls `request.wantsJson()` and requires a compatible object.

### Scope and context

`Catch` calls `app.getCurrentScope()` and then `await scope.get("kernel")` for each operation.

| Situation | Result |
|---|---|
| No active scope exists. | `RuntimeError("No active scope found for context retrieval.")`. |
| The scope has no usable `kernel` value. | `RuntimeError("No kernel found in the current scope for context retrieval.")`. |
| `kernel is KernelContext.CONSOLE`. | Reporting and CLI presentation. |
| `kernel is KernelContext.HTTP`. | Reporting and HTTP presentation. |
| Another non-null value. | Reporting, followed by `None`. |

`KernelContext` defines only `CONSOLE` and `HTTP`; it has no separate queue, MCP, or Realtime contexts. Dispatch compares enum members, rather than the strings `"HTTP"` or `"CONSOLE"`.

Do not invent a context to force a particular presentation. Use the appropriate entry point, or call `report()` directly through the container when reporting alone is required.

### Resolution and caching

`CatchProvider` registers `ICatch` as a singleton under the `x-orionis-ICatch` alias and pins the facade during boot.

The first `Catch.exception()` call obtains the handler through `await app.getExceptionHandler()`. An `asyncio.Lock` prevents duplicate resolution when the initial calls overlap. Later calls reuse that instance.

The service cache does not hold the current request or exception. Both belong to each call and can coexist across coroutines.

`app.getExceptionHandler()` has a different cache: it retains the resolved class and asks the container to build it on each call. This alone does not guarantee that all direct calls return the same instance. This distinction matters for integrations such as MCP, which call it directly.

## BaseExceptionHandler and IBaseExceptionHandler

`BaseExceptionHandler` implements the abstract `IBaseExceptionHandler` contract and supplies the default policy. Its constructor receives `DefaultResponses` and `IApplication` through the container.

The contract exposes five methods:

| Method | Kind | Result |
|---|---|---|
| `toThrowable(exception)` | Synchronous. | `Throwable`. |
| `isExceptionIgnored(exception)` | Synchronous. | `bool`. |
| `report(exception, log)` | Asynchronous. | `Throwable \| None`. |
| `handleCLI(exception, console)` | Asynchronous. | `None`. |
| `handleHTTP(exception, request)` | Asynchronous. | `Response \| None`. |

An implementation of the interface must provide all abstract methods. Extending the base class lets you change only the relevant part while keeping the others.

The actual `app.withExceptionHandler()` check requires a **class inheriting from `IBaseExceptionHandler`**; a `BaseExceptionHandler` subclass satisfies that contract. It accepts neither an instance nor an unrelated class.

### toThrowable()

`toThrowable(exception: BaseException) -> Throwable` preserves the original type and traceback, and converts the arguments to strings.

When `exception.args` is empty, it uses `("",)`. `message` is the first argument converted to text, which is not necessarily the full `str(exception)` representation.

```python
from orionis.foundation.contracts.application import IApplication


async def describe_failure(
    app: IApplication,
    exception: BaseException,
) -> dict[str, object]:
    handler = await app.getExceptionHandler()
    failure = handler.toThrowable(exception)
    return {
        "type": failure.classtype.__name__,
        "message": failure.message,
        "arguments": failure.args,
        "has_traceback": failure.traceback is not None,
    }
```

This helper receives an explicit exception inside a booted application. It does not catch or report it. Avoid returning that diagnostic information directly from a public endpoint.

### isExceptionIgnored()

`isExceptionIgnored(exception: BaseException) -> bool` verifies that the argument is a `BaseException` instance. Any other object raises `TypeError`.

It then compares `type(exception)` against `dont_catch`: matching uses the exact class.

### report()

```python
async def report(
    self,
    exception: BaseException,
    log: ILogger,
) -> Throwable | None:
    ...
```

The base implementation skips ignored classes. For the others, it converts the exception into a `Throwable`, calls `log.error()`, and returns the record.

The message format is:

```text
[ExceptionClass] first_argument_as_text
```

Base reporting does not automatically send every `Throwable` field or the traceback to the logger. A custom reporting policy can do so deliberately.

The `log` parameter is resolved because `Catch` invokes the method through `app.call()`. A direct `handler.report()` call must supply it or also use the container.

### handleCLI()

`async handleCLI(exception: BaseException, console: Console) -> None` skips ignored classes and calls `console.exception(exception)`.

The console displays the type, message, and traceback using Rich, without local variables. This presentation does not use `app.debug` to hide CLI errors.

Although the handler contract accepts `BaseException`, `Console.exception()` checks for an `Exception` instance. The broad signature does not guarantee presentation of `KeyboardInterrupt`, `SystemExit`, or cancellations.

### handleHTTP()

`async handleHTTP(exception, request) -> Response | None` checks ignored classes first, then the JSON preference and known error mapping. Only the remaining errors consult `app.debug`.

| Known exception | Status | Public message |
|---|---|---|
| `AuthenticationException` | 401 | `Unauthenticated` |
| `AuthorizationException` | 403 | `This action is unauthorized` |
| `RouteNotFound` | 404 | `Route not found` |
| `MethodNotAllowed` | 405 | `Method not allowed` |
| `PayloadTooLargeException` | 413 | `Payload too large` |
| `UnsupportedMediaTypeException` | 415 | `Unsupported media type` |
| `CSRFTokenMismatchException` | 419 | `CSRF token mismatch` |

Mapping walks the exception MRO, so subclasses are also recognized. An authentication failure under the active `token` guard adds `WWW-Authenticate: Bearer`.

These are the **base handler's** mappings. The HTTP kernel also provides its own validation, body limit, and fallback responses; they do not all pass through this table. See [the HTTP flow](/en/http/exceptions).

## Ignored exceptions and reporting policy

`dont_catch` is a class attribute whose default value is `frozenset()`:

```python
from orionis.failure.base import BaseExceptionHandler


class QuietError(Exception):
    pass


class SpecializedQuietError(QuietError):
    pass


class QuietHandler(BaseExceptionHandler):
    dont_catch = frozenset({QuietError})
```

`QuietError` is ignored; `SpecializedQuietError` keeps the normal policy because it is not listed. This differs from HTTP mapping, which does consider ancestor classes.

:::caution[This does not silence only the log]
The base `report()`, `handleCLI()`, and `handleHTTP()` methods consult `dont_catch`. For HTTP, an ignored class returns `None` instead of a response. Do not list an exception here if it still needs a JSON response or error page. Override `report()` to suppress only its log while retaining presentation.
:::

The module does not turn `None` into a safe fallback response. Kernel components expecting a `Response` can fail when the handler does not supply one.

## Throwable

`Throwable` is a dataclass with `frozen=True`, `kw_only=True`, and `slots=True`. It groups failure data without presenting or serializing it.

| Field | Contents |
|---|---|
| `classtype` | Original class, such as `ValueError`. |
| `message` | First argument converted to text; an empty string if there were no arguments. |
| `args` | Tuple of arguments converted to text by `toThrowable()`. |
| `traceback` | Native traceback or `None`. |

Construction uses keyword arguments. The dataclass does not automatically convert its values: `BaseExceptionHandler.toThrowable()` performs that normalization.

A traceback is not a JSON string. If an integration requires text, format it explicitly and choose where to store it; do not add it to public responses without reviewing the contents.

## Actual scope by entry point

### HTTP

The kernel catches `Exception` during response construction and delivers the relevant failures to `Catch`. The web session can also present an error while it remains available to persist the response.

Already constructed responses, delivery failures, and special protocols have their own boundaries. Registering a handler does not extend those boundaries.

### Commands and scheduled tasks

Reactor sets `KernelContext.CONSOLE`. When a command raises `Exception`, it logs the failure, calls `Catch.exception()`, and returns exit code `1`.

When the target is known, Reactor adds `[ClassName.method]` to the exception argument before delegating it. The handler's report can coexist with that command log.

Scheduler commands execute through Reactor and keep this flow. Scheduler listeners can also delegate errors to `ICatch`; presentation depends on the active scope. A failure in listener error handling is logged as an additional problem.

### MCP

The MCP dispatcher uses the configured handler's `report()` method for internal errors while preserving protocol responses. It does not call `handleHTTP()` or `handleCLI()` to turn a tool failure into HTML or console output.

A failed tool can return `isError: true` with `Tool execution failed`; other internal failures become JSON-RPC errors. Argument failures receive their own treatment rather than becoming HTTP 422 field error responses.

The MCP HTTP transport policy also reports failures and presents safe protocol responses. Even with debug enabled, it avoids the native HTML presenter. Failures in reporting itself are contained to preserve the original public error.

### WebSockets and Realtime

The WebSocket kernel handles handler exceptions with a generic log message, closure when applicable, and propagation. It does not use the HTML exception page.

Realtime invocations present protocol errors such as `validation_error`, `unauthorized`, `forbidden`, `timeout`, or `internal_error`. The runtime does not deliver all of these exceptions to `Catch`, even though its scopes use the HTTP marker.

The transport and protocol determine the error channel. The scope marker alone does not mean that every failure reaches the HTTP handler.

### Queues and work after the response

The queue worker logs failures and applies its retry or failed job recording policy. It does not automatically call `Catch.exception()` for every job. The `sync` queue connection propagates the exception to its caller, which might be inside HTTP or CLI execution.

`BackgroundTask` logs failures through `Log.error()` and raises them again. Response adapters execute this work after the corresponding successful delivery. A failure there cannot replace an already sent response with a 500 page.

File, streaming, and transport delivery errors can also propagate outside the response construction block. See [HTTP responses](/en/http/responses).

## Security, secondary failures, and cancellation

### Debug and content negotiation

For known errors, the handler uses `request.wantsJson()` to choose HTML or JSON. Unknown errors behave as follows:

| `app.debug` | Default presentation |
|---|---|
| `False` | Sanitized 500: `Internal Server Error`, with HTML/JSON negotiation. |
| `True` | HTML diagnostic page containing the exception and request context. |

With debug enabled, `Accept: application/json` **does not prevent an HTML diagnostic page** for an unknown exception. Do not use that header as a protection mechanism.

The `DefaultResponses.exception()` presenter does not check debug itself. Calling it directly can generate diagnostics independently of the handler policy. Make that decision before invoking it.

### Failures inside the policy

`Catch` does not wrap `report()`, `handleHTTP()`, or `handleCLI()` in another fallback handler. Resolution, logger, or renderer failures propagate.

A failure in `report()` prevents presentation. Returning `None` from `report()` does not: the coordinator does not use its return value to decide whether to proceed.

Avoid calling `Catch.exception()` from `report()` or a renderer: this would reenter the same policy. When integrating an external observability service, explicitly decide how to contain its failures.

### Cancellation and BaseException

The HTTP kernel and Reactor catch `Exception`, rather than all `BaseException` subclasses. `asyncio.CancelledError`, `KeyboardInterrupt`, and `SystemExit` should not be described as ordinary failures that always become 500 responses.

`Catch.exception()` accepts `BaseException` when explicitly supplied, but it does not catch cancellation by itself. It also does not shield reporting or presentation from cancellation.

Preserve cancellation propagation in custom policies. Resource cleanup blocks can handle `BaseException` to release resources without turning it into an HTTP response.

## Concurrency and lifecycle

Keep request state in local variables. The instance retained by `Catch` can handle simultaneous exceptions; attributes such as `self.current_request` or `self.exception` would mix data from separate calls.

Configure the handler before boot. [Exception handling](/en/architecture/exception-handling) covers class registration and bootstrap compilation.

Restart processes to apply code or startup configuration changes. Do not treat `withExceptionHandler()` as a way to change policies dynamically during active requests.

## Verifying a policy

Test reporting separately from presentation. Useful checks cover the observable contract:

| Case | Check |
|---|---|
| Custom domain error. | Expected status, JSON, and headers. |
| Unknown error in production. | 500 without internal message or traceback. |
| Unknown debug error with a JSON preference. | Current diagnostic presentation; do not assume JSON. |
| Known error and its subclass. | Same public mapping through the MRO. |
| Ignored class and an unlisted subclass. | Exact matching and consequences for the response. |
| Failing logger. | Error propagation and no renderer execution. |
| Concurrent initial Catch calls. | One resolution of the retained handler instance. |
| CLI, MCP, or Realtime. | Entry point presentation, without assuming HTML. |
| Already sent response. | Subsequent failure does not change what the client received. |

HTTP integration tests should verify delivery as well as the `handleHTTP()` return value. MCP tests should inspect the tool result or JSON-RPC error. Queue tests should check attempts and failed job persistence.

Continue with [customization examples](/en/architecture/exception-handling/handling-exceptions) or return to [HTTP exceptions](/en/http/exceptions).
