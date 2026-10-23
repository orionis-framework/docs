---
title: "Reporting and handling exceptions"
description: "Customize the global handler, separate reporting from presentation, preserve dependency injection, and handle failures from HTTP, console, and services."
editUrl: true
lastUpdated: false
---

An exception signals that an operation could not complete. Catch it when you can provide a concrete recovery; if you let it propagate, the Orionis entry point decides how to report and present the failure.

The application handler brings that policy together. It does not replace data validation or turn every process error into an HTTP response. Its role depends on the component delivering the exception: a command, an HTTP request, or a protocol with its own presentation.

This guide develops handler customization. For the page displayed during a request and the differences between development and production, see [HTTP exceptions](/en/http/exceptions). The [general index](/en/architecture/exception-handling) explains registration and the module architecture.

<a id="handler-application"></a>

## Start with the application handler

The project uses `app/exceptions/handler.py`. Extending `BaseExceptionHandler` lets you change one part of the policy and delegate the rest through `super()`:

```python
from typing import ClassVar

from orionis.console import Console
from orionis.failure.base import BaseExceptionHandler
from orionis.failure.entities import Throwable
from orionis.http import Request, Response
from orionis.http.adapters.request.contracts.transport import TransportAdapter
from orionis.logging.contracts import ILogger


class ExceptionHandler(BaseExceptionHandler):
    dont_catch: ClassVar[frozenset[type[BaseException]]] = frozenset()

    async def report(
        self,
        exception: BaseException,
        log: ILogger,
    ) -> Throwable | None:
        return await super().report(exception, log)

    async def handleCLI(
        self,
        exception: BaseException,
        console: Console,
    ) -> None:
        await super().handleCLI(exception, console)

    async def handleHTTP(
        self,
        exception: BaseException,
        request: Request | TransportAdapter,
    ) -> Response | None:
        return await super().handleHTTP(exception, request)
```

This example preserves native policy. All three methods are asynchronous and must be awaited when you delegate to them. The `toThrowable()` and `isExceptionIgnored()` helpers are synchronous.

The project's initial handler annotates `exception: Exception` and `request: Request`. The contract accepts `BaseException` and, for HTTP, also a `TransportAdapter`: a failure can occur before the kernel finishes constructing the `Request` object. The union in this example preserves both cases.

Register the class in `bootstrap/app.py` before calling `app.create()`:

```python
from app.exceptions.handler import ExceptionHandler

app.withExceptionHandler(ExceptionHandler)
```

The `app` variable is the instance already created in that file. Register a **class**, not `ExceptionHandler()`. The container constructs the handler with its dependencies; the base class needs `DefaultResponses` and `IApplication`.

You do not need to override every method: keep only the method you change. If you define a constructor, preserve the dependencies required by the base class and call `super().__init__(...)`.

<a id="handler-contract"></a>

### Contract and extension points

These are the signatures of `BaseExceptionHandler`. The `IBaseExceptionHandler` contract declares the same five methods; its `handleCLI()` annotates the output service as `IConsole`, while the implementation receives `Console`.

```python
def __init__(
    self,
    default_responses: DefaultResponses,
    application: IApplication,
) -> None: ...

def toThrowable(self, exception: BaseException) -> Throwable: ...

def isExceptionIgnored(self, exception: BaseException) -> bool: ...

async def report(
    self, exception: BaseException, log: ILogger,
) -> Throwable | None: ...

async def handleCLI(
    self, exception: BaseException, console: Console,
) -> None: ...

async def handleHTTP(
    self, exception: BaseException, request: Request | TransportAdapter,
) -> Response | None: ...
```

This block is a signature reference, rather than another handler to copy. None of these parameters has a default value. Override `report()` to change logging, the `handle...()` methods to change presentation, and the two helpers to change conversion or exclusion policy.

<a id="handler-injection"></a>

### Inject dependencies into the constructor and methods

The application constructs the handler through `await app.build(...)`, which resolves annotated constructor dependencies. For example, define a concrete service in `app/services/failure_messages.py`:

```python
class FailureMessages:
    def orderConflict(self) -> str:
        return "The order has already been processed."
```

This variant of `app/exceptions/handler.py` receives that service alongside the base class dependencies:

```python
from app.services.failure_messages import FailureMessages
from orionis.failure.base import BaseExceptionHandler
from orionis.foundation.contracts.application import IApplication
from orionis.http.default.responses import DefaultResponses


class ExceptionHandler(BaseExceptionHandler):
    def __init__(
        self,
        default_responses: DefaultResponses,
        application: IApplication,
        messages: FailureMessages,
    ) -> None:
        super().__init__(default_responses, application)
        self.messages = messages
```

`FailureMessages` is a concrete class without dependencies and can be constructed automatically. For an interface or an implementation with custom configuration, register the service in a [provider](/en/architecture/service-container/providers-and-facades). Do not add required untyped arguments expecting the container to infer their values.

Methods also accept additional annotated dependencies: for example, add `messages: FailureMessages` to `handleCLI()` and use `messages.orderConflict()`. `Catch` invokes methods through `app.call()`, so injection happens on each invocation. A direct call such as `await handler.handleCLI(error, console)` does not inject extra arguments: supply them explicitly.

<a id="handler-dispatch"></a>

## Separate reporting from presentation

When `Catch.exception()` receives an exception inside a valid scope, it runs:

1. `report(exception, log)`.
2. `handleCLI(exception, console)` for the console kernel, or `handleHTTP(exception, request)` for HTTP.
3. It returns the presentation result. A context other than these two only reports.

The result of `report()` does not control the second step. Returning `None` from that method **does not prevent** `handleHTTP()` or `handleCLI()` from being called.

The default implementation obtains the standard logger through `log.getLogger()` and writes one error-level record formatted as `[ExceptionClass] message`. It also passes `exc_info=(type(exception), exception, throwable.traceback)`, preserving the original traceback, chained exceptions, and notes even outside the `except` block that received the error. Final formatting and file retention belong to [Logs](/en/services/logging).

Logging and presentation are separate operations: a log is not the client's response, and generating a response does not itself guarantee the failure was logged. Return annotations describe the contract; `Catch` does not validate that your override actually returned a `Throwable` or a `Response`.

The container invokes these methods through `app.call(...)`. It supplies `exception` and, for HTTP, `request` explicitly; the `ILogger` and `Console` annotations resolve the remaining arguments. Keep these signatures in overrides and pass dependencies explicitly when calling `super()`.

<a id="handler-domain-policy"></a>

## Turn a domain conflict into a response

A domain exception expresses a failure specific to the application. For example, an already processed order may need a 409 response without exposing implementation details.

Define the exception in `app/exceptions/order_conflict.py`:

```python
class OrderConflict(Exception):
    pass
```

Customize `app/exceptions/handler.py`:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.failure.base import BaseExceptionHandler
from orionis.http import JSONResponse, Request, Response
from orionis.http.adapters.request.contracts.transport import TransportAdapter


class ExceptionHandler(BaseExceptionHandler):
    async def handleHTTP(
        self,
        exception: BaseException,
        request: Request | TransportAdapter,
    ) -> Response | None:
        if self.isExceptionIgnored(exception):
            return None

        if isinstance(exception, OrderConflict):
            return JSONResponse(
                {"message": "Order already processed"},
                status_code=409,
            )

        return await super().handleHTTP(exception, request)
```

The client-facing message is deliberately defined in the handler. The response contains neither internal arguments nor the `OrderConflict` traceback. Other exceptions retain their native statuses and presentation.

A controller can raise the exception without building the response:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.http import JSONResponse


class OrderController:
    async def confirm(self, order_id: int) -> JSONResponse:
        if order_id == 42:
            raise OrderConflict("Order 42 has already been processed")

        return JSONResponse({"order_id": order_id, "confirmed": True})
```

Register the action in `routes/api.py`:

```python
from app.http.controllers.order_controller import OrderController
from orionis.support.facades import Route

Route.post("/orders/{order_id:int}/confirm", [OrderController, "confirm"])
```

In this teaching example, `POST /orders/42/confirm` returns 409 and `{"message": "Order already processed"}`. Other identifiers return 200. The inherited handler still reports the conflict before building the JSON response.

<a id="handler-reporting"></a>

## Change reporting while preserving the response

Override `report()` to treat an expected conflict as a warning. This variant replaces reporting for the known case and delegates the rest:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.failure.base import BaseExceptionHandler
from orionis.failure.entities import Throwable
from orionis.logging.contracts import ILogger


class ExceptionHandler(BaseExceptionHandler):
    async def report(
        self,
        exception: BaseException,
        log: ILogger,
    ) -> Throwable | None:
        if self.isExceptionIgnored(exception):
            return None

        if isinstance(exception, OrderConflict):
            throwable = self.toThrowable(exception)
            log.warning(f"[{throwable.classtype.__name__}] {throwable.message}")
            return throwable

        return await super().report(exception, log)
```

Merge this method into the previous handler to retain its 409 response. Avoid calling `super().report()` for the same case after writing your own log unless you intentionally want two entries.

You can also skip only the log for an expected exception: return `None` in its `report()` branch and keep `handleHTTP()`. Presentation continues. This differs from adding the exception to `dont_catch`.

`ILogger.error(message)` and `ILogger.warning(message)` are synchronous methods; they take neither `await` nor a context dictionary as a second argument. Their destination and effective level depend on [logging configuration](/en/services/logging), not `app.debug`.

The warning example above writes only a message. To preserve the traceback in that branch as well, use the standard logger exposed by the service:

```python
log.getLogger().warning(
    "[%s] %s",
    throwable.classtype.__name__,
    throwable.message,
    exc_info=(type(exception), exception, throwable.traceback),
)
```

Replace the `log.warning(...)` call inside the branch that already defines `throwable`; the rest of `report()` stays the same. You can also obtain this logger through `Log.getLogger()`, importing the facade from `orionis.support.facades`. Do not switch the shared channel for a single exception: that changes the logger used by other operations.

If `report()` raises another exception, `Catch` never reaches presentation. When adding an external observability service, define how to handle that service's own failures so they do not inadvertently replace the original exception.

<a id="handler-cli"></a>

## Customize console output

The same domain error can have a brief console presentation:

```python
from app.exceptions.order_conflict import OrderConflict
from app.services.failure_messages import FailureMessages
from orionis.console import Console
from orionis.failure.base import BaseExceptionHandler


class ExceptionHandler(BaseExceptionHandler):
    async def handleCLI(
        self,
        exception: BaseException,
        console: Console,
        messages: FailureMessages,
    ) -> None:
        if self.isExceptionIgnored(exception):
            return

        if isinstance(exception, OrderConflict):
            console.warning(messages.orderConflict())
            return

        await super().handleCLI(exception, console)
```

Combine this method with the previous ones in a single class when you need all three policies. `handleCLI()` presents the error; it does not turn a failed execution into a successful one.

For example, a command in `app/console/commands/check_order_command.py` can propagate the conflict:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.console.base import BaseCommand


class CheckOrderCommand(BaseCommand):
    signature = "orders:check"
    description = "Demonstrate an order conflict."

    async def handle(self) -> None:
        raise OrderConflict("Order 42 has already been processed")
```

`orionis orders:check` and `python -B reactor orders:check` run this command. Reactor logs the execution failure, calls the `Catch` service, and returns exit code 1. The handler's general reporting can produce another entry in addition to Reactor's own message.

The base `handleCLI()` implementation uses `Console.exception()` to display the exception type, message, and traceback context; it configures a maximum of one frame, one extra source line, and hides local variables. Errors handled by your custom branch can have a different presentation.

Although the handler contract accepts `BaseException`, `Console.exception()` requires an `Exception` instance. A manual call with `SystemExit`, `KeyboardInterrupt`, or another direct subclass of `BaseException` does not therefore receive a valid CLI presentation: it may raise `TypeError`. The normal command flow catches errors with `except Exception`.

<a id="handler-ignore"></a>

## Exclude one exception type or a family

`dont_catch` is a class attribute initialized to `frozenset()`. The `isExceptionIgnored()` implementation validates that it received a `BaseException` instance and checks the **exact class**:

```python
from typing import ClassVar

from app.exceptions.order_conflict import OrderConflict
from orionis.failure.base import BaseExceptionHandler


class ExceptionHandler(BaseExceptionHandler):
    dont_catch: ClassVar[frozenset[type[BaseException]]] = frozenset({
        OrderConflict,
    })
```

With this class, inherited methods skip both reporting and presentation for `OrderConflict`. `report()` and `handleHTTP()` return `None`; `handleCLI()` finishes without printing. A subclass of `OrderConflict` is **not excluded** automatically.

This does not raise the exception again or change the kernel's `except` blocks. It also does not guarantee a successful HTTP response: the component calling `Catch` decides how to treat a `None` result. Use it when you understand that execution boundary; to skip only the log, customize `report()` alone.

If you deliberately want to exclude an entire family, override the helper instead of relying on exact membership:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.failure.base import BaseExceptionHandler


class ExceptionHandler(BaseExceptionHandler):
    def isExceptionIgnored(self, exception: BaseException) -> bool:
        return (
            super().isExceptionIgnored(exception)
            or isinstance(exception, OrderConflict)
        )
```

This variant preserves input validation and the base class's exact exclusions, then adds subclasses of `OrderConflict`. Custom `report()` and `handle...()` branches must call the helper to honor that policy: `Catch` does not apply an outer filter before invoking them.

Native HTTP status lookup follows a different rule: it walks the MRO and supports subclasses of recognized exceptions. Extending a native exception can therefore preserve its HTTP status without being excluded by a `dont_catch` containing only its parent class.

<a id="handler-throwable"></a>

## Work with Throwable

`toThrowable(exception)` creates a structured record. It does not report or present the exception itself.

| Field | Contents |
| --- | --- |
| `classtype` | Concrete exception class. |
| `message` | First argument converted to text; an empty string when there are no arguments. |
| `args` | Tuple of all arguments converted to text. |
| `traceback` | Native Python traceback, or `None` if none exists. |

The dataclass is frozen, uses slots, and requires keyword arguments. `traceback` is not a JSON string and is not formatted automatically. `Throwable.message` may differ from `str(exception)` when the exception has multiple arguments or customizes its representation.

```python
from orionis.failure.base import BaseExceptionHandler
from orionis.failure.entities import Throwable


class ExceptionHandler(BaseExceptionHandler):
    def toThrowable(self, exception: BaseException) -> Throwable:
        original = super().toThrowable(exception)
        return Throwable(
            classtype=original.classtype,
            message=f"Application failure: {original.message}",
            args=original.args,
            traceback=original.traceback,
        )
```

This variant changes the summary used by inherited reporting; it does not change the original exception or the HTTP or CLI presentation built from it. It is also not an anonymization mechanism: the original traceback and arguments may still contain internal information.

You can use conversion from a service to prepare a summary:

```python
from orionis.foundation.contracts.application import IApplication


class FailureSummaryService:
    async def summarize(
        self,
        exception: BaseException,
        app: IApplication,
    ) -> dict[str, object]:
        handler = await app.getExceptionHandler()
        throwable = handler.toThrowable(exception)

        return {
            "type": throwable.classtype.__name__,
            "message": throwable.message,
            "arguments": list(throwable.args),
            "has_traceback": throwable.traceback is not None,
        }
```

Invoke this method through the container or pass `app` explicitly. For `ValueError("invalid value", 7)`, the summary contains `message="invalid value"` and `arguments=["invalid value", "7"]`. Keep these details for internal diagnostics: conversion does not remove sensitive information.

<a id="handler-recovered-errors"></a>

## Report an already recovered error

When your code has already recovered from a failure and only needs to notify the handler, invoke `report()` alone through the container:

```python
from orionis.foundation.contracts.application import IApplication


class FailureReporter:
    async def report(
        self,
        exception: BaseException,
        app: IApplication,
    ) -> None:
        handler = await app.getExceptionHandler()
        await app.call(handler, "report", exception=exception)
```

This requires a booted application and available dependencies, but does not select a renderer or inspect the `kernel` value. It is useful in a service with local recovery. Avoid reporting the same error again if you will then propagate it to another component that already reports it.

<a id="handler-concurrency"></a>

## Keep the handler safe between operations

`await app.getExceptionHandler()` retains the resolved class and constructs a new instance on every call. In contrast, the `Catch` service is a singleton and retains the first handler it obtains; a lock prevents duplicate construction during its initial concurrent resolution.

The handler used by the normal flow may therefore serve concurrent requests or commands. Keep the exception, request, and per-operation results in local variables. Do not assign `self.request`, `self.exception`, or a per-operation `Throwable` to a shared instance. Constructor dependencies must also be suitable for that lifetime; receiving a scoped dependency in the constructor does not make the handler retained by `Catch` scoped.

Use method injection for dependencies that must resolve in the current invocation's scope. Passing `exception` and `request` directly avoids retaining another request's data. Custom attributes are not reset automatically between failures.

<a id="handler-boundaries"></a>

## Decide where to handle a failure

Catch an exception close to the operation when you can recover, apply an alternative, or add context before raising it again. Leave shared presentation to the handler when there is no local recovery.

The supported extension points are `report()`, `handleCLI()`, `handleHTTP()`, `toThrowable()`, and `isExceptionIgnored()`. This contract has no generic `render()` method or `shouldReport()` and `shouldRender()` hooks.

The [Catch API and error policies](/en/architecture/exception-handling/policies-and-reference) cover manual delegation, scope requirements, and the class inventory. See [Contexts and transports](/en/architecture/exception-handling/contexts-and-transports) for HTTP, CLI, WebSocket, Realtime, MCP, and background jobs. [HTTP exceptions](/en/http/exceptions) develops request errors and the diagnostic page without extending those rules to other transports.
