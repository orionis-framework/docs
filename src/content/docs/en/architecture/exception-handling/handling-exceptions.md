---
title: "Reporting and handling exceptions"
description: "Customize the global handler, separate reporting from presentation, preserve dependency injection, and handle failures from HTTP, console, and services."
editUrl: true
lastUpdated: false
---

An exception signals that an operation could not complete. Catch it when you can provide a concrete recovery; if you let it propagate, the Orionis entry point decides how to report and present the failure.

The application handler brings that policy together. It does not replace data validation or turn every process error into an HTTP response. Its role depends on the component delivering the exception: a command, an HTTP request, or a protocol with its own presentation.

This guide develops handler customization. For the page displayed during a request and the differences between development and production, see [HTTP exceptions](/en/http/exceptions). The [general index](/en/architecture/exception-handling) explains registration and the module architecture.

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

## Separate reporting from presentation

When `Catch.exception()` receives an exception inside a valid scope, it runs:

1. `report(exception, log)`.
2. `handleCLI(exception, console)` for the console kernel, or `handleHTTP(exception, request)` for HTTP.
3. It returns the presentation result. A context other than these two only reports.

The result of `report()` does not control the second step. Returning `None` from that method **does not prevent** `handleHTTP()` or `handleCLI()` from being called.

The default implementation logs an error-level message formatted as `[ExceptionClass] message`. Logging and presentation are separate operations: a log is not the client's response, and generating a response does not itself guarantee the failure was logged.

The container invokes these methods through `app.call(...)`. It supplies `exception` and, for HTTP, `request` explicitly; the `ILogger` and `Console` annotations resolve the remaining arguments. Keep these signatures in overrides and pass dependencies explicitly when calling `super()`.

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

If `report()` raises another exception, `Catch` never reaches presentation. When adding an external observability service, define how to handle that service's own failures so they do not inadvertently replace the original exception.

## Customize console output

The same domain error can have a brief console presentation:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.console import Console
from orionis.failure.base import BaseExceptionHandler


class ExceptionHandler(BaseExceptionHandler):
    async def handleCLI(
        self,
        exception: BaseException,
        console: Console,
    ) -> None:
        if self.isExceptionIgnored(exception):
            return

        if isinstance(exception, OrderConflict):
            console.warning("The order has already been processed.")
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

The base `handleCLI()` implementation uses `Console.exception()` to display the exception type, message, and traceback context with Rich; it does not show local variables. Errors handled by your custom branch can have a different presentation.

## Work with Throwable

`toThrowable(exception)` creates a structured record. It does not report or present the exception itself.

| Field | Contents |
| --- | --- |
| `classtype` | Concrete exception class. |
| `message` | First argument converted to text; an empty string when there are no arguments. |
| `args` | Tuple of all arguments converted to text. |
| `traceback` | Native Python traceback, or `None` if none exists. |

The dataclass is frozen, uses slots, and requires keyword arguments. `traceback` is not a JSON string and is not formatted automatically. `Throwable.message` may differ from `str(exception)` when the exception has multiple arguments or customizes its representation.

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

## Delegate manually to Catch

Normally, letting the error reach the kernel is enough. If you are implementing your own execution boundary inside a request, you can delegate an exception to the service through its contract:

```python
from orionis.failure.contracts import ICatch
from orionis.http import Request, Response


class FailureBoundary:
    async def respond(
        self,
        exception: Exception,
        request: Request,
        catch: ICatch,
    ) -> Response:
        response = await catch.exception(exception, request)
        if response is None:
            raise exception
        return response
```

Orionis injects `ICatch` when it invokes `respond()` through the container. `exception` and `request` must belong to the current failure. A `None` return value is not a valid HTTP response; the example propagates the error again in that case.

The facade provides the same service in a booted application:

```python
from orionis.http import Request, Response
from orionis.support.facades import Catch


async def present_failure(
    exception: Exception,
    request: Request,
) -> Response | None:
    return await Catch.exception(exception, request)
```

Import the facade from `orionis.support.facades`. The `Catch` symbol from `orionis.failure` is the concrete implementation and requires the application in its constructor.

Both `exception()` variants require an active scope with a `kernel` context. For HTTP, always supply a usable `Request` or `TransportAdapter`. The facade does not create that context or install a global Python exception hook.

The service reuses the resolved handler. Keep the exception, request, and per-operation data in local variables; storing them in handler attributes can mix concurrent requests.

## Decide where to handle a failure

Catch an exception close to the operation when you can recover, apply an alternative, or add context before raising it again. Leave shared presentation to the handler when there is no local recovery.

The supported extension points are `report()`, `handleCLI()`, `handleHTTP()`, `toThrowable()`, and `isExceptionIgnored()`. This contract has no generic `render()` method or `shouldReport()` and `shouldRender()` hooks.

See [Error policies and reference](/en/architecture/exception-handling/policies-and-reference) for `dont_catch`, capture boundaries, protocol contexts, and the class inventory. [HTTP exceptions](/en/http/exceptions) develops request errors and the diagnostic page without extending those rules to other transports.
