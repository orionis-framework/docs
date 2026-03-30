---
title: Exceptions & Error Handling
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Exception Handler

The Orionis Framework Exception Handler is the component responsible for centralizing error management during application execution.

Its primary goal is to standardize exception handling across three fronts:

- Converting native exceptions into a uniform structure.
- Reporting errors to observability mechanisms (e.g., logs).
- Presenting errors consistently in the console environment.

This approach reduces logic duplication, improves failure traceability, and facilitates the evolution of error handling strategies in medium and large projects.

## General Architecture

The framework's base implementation is composed of two levels:

- Base layer: `BaseExceptionHandler` class (core shared behavior).
- Application layer: `ExceptionHandler` class in `app\exceptions\handler.py` (project customization point).

The application class inherits from the base class and allows you to extend, replace, or complement the default behavior without modifying internal framework code.

### Key Components

- `BaseExceptionHandler`: contains the logic for conversion, exclusion, reporting, and console output.
- `Throwable`: structured entity that represents an exception in a uniform format.
- `ILogger`: logging contract for recording errors in a decoupled manner.
- `Console`: output service for rendering errors in CLI commands.

## Exception Handling Flow

When an exception occurs, the recommended flow is as follows:

1. The caught exception is received.
2. It is validated whether it should be ignored via `dont_catch`.
3. It is transformed into a `Throwable` to normalize its content.
4. It is reported to the logger (if applicable).
5. It is rendered in the console when the error originates from CLI execution.

This flow ensures uniformity across the entire application and prevents each module from implementing its own handling logic.

## Location and Configuration

In an Orionis Framework application, the entry point for customizing error handling is located at:

- `app\exceptions\handler.py`

This file defines the `ExceptionHandler` class, which extends `BaseExceptionHandler`.

A typical implementation skeleton is:

```python
from typing import ClassVar
from orionis.console.output.console import Console
from orionis.failure.base.handler import BaseExceptionHandler
from orionis.failure.entities.throwable import Throwable
from orionis.services.log.contracts.log_service import ILogger


class ExceptionHandler(BaseExceptionHandler):

dont_catch: ClassVar[list[type[BaseException]]] = [
# Exceptions to exclude from centralized handling
]

async def report(
self,
exception: Exception,
log: ILogger,
) -> Throwable | None:
return await super().report(exception, log)

async def handleCLI(
self,
exception: Exception,
console: Console,
) -> None:
await super().handleCLI(exception, console)
```

## Main Methods

### `toThrowable(exception)`

Converts a native exception into a `Throwable` instance, including:

- Exception type.
- Primary message.
- Serialized arguments.
- Trace information.

This normalization allows the rest of the pipeline to work with a stable format, regardless of the original error type.

### `isExceptionIgnored(exception)`

Determines whether an exception should be ignored based on the `dont_catch` property.

Expected behavior:

- If the exception type is in `dont_catch`, returns `True`.
- If it is not listed, returns `False`.
- If the received object is not a valid exception, raises `TypeError`.

### `report(exception, log)`

Responsible for reporting the exception for observability purposes.

Default behavior:

- If the exception is in `dont_catch`, it does not report and returns `None`.
- If it is not excluded, it creates a `Throwable`, logs the error, and returns the generated structure.

This method is ideal for integrating external monitoring, alerting, or distributed tracing systems.

### `handleCLI(exception, console)`

Manages error presentation during console command execution.

Default behavior:

- Skips exceptions excluded by `dont_catch`.
- Prints the error with readable formatting and a trace to facilitate debugging.

## Controlling Ignored Exceptions with `dont_catch`

The `dont_catch` property allows you to exclude specific exceptions from centralized handling.

Configuration example:

```python
from typing import ClassVar


class ExceptionHandler(BaseExceptionHandler):
dont_catch: ClassVar[list[type[BaseException]]] = [
KeyboardInterrupt,
SystemExit,
]
```

This is useful when you want certain exceptions to follow their natural flow and not be intercepted by the global handler.

**Recommendations for `dont_catch`**

- Include only exceptions that truly need to propagate.
- Avoid adding business exceptions without a clear architectural reason.
- Internally document why each exception was excluded.

## Error Handling in Console

In CLI commands, diagnostic quality is critical. Therefore, `handleCLI` should ensure:

- Clear and actionable messages.
- Consistent output across commands.
- Trace visibility in development environments.

A recommended implementation pattern is to delegate to the base and add gradual customization:

```python
async def handleCLI(
self,
exception: Exception,
console: Console,
) -> None:
# Example: additional pre-processing logic
# console.warning("An exception was detected in CLI")

await super().handleCLI(exception, console)

# Example: additional post-processing logic
# console.info("Check the logs for more details")
```

## Integration with Logging

The `report` method integrates with the `ILogger` contract, allowing you to substitute the concrete logger implementation without modifying the handler.

Example of an observability-oriented extension:

```python
async def report(
self,
exception: Exception,
log: ILogger,
) -> Throwable | None:
throwable = await super().report(exception, log)

if throwable is None:
return None

# You can add context metadata here
# log.error(f"[request_id=...] [{throwable.classtype.__name__}] {throwable.message}")

return throwable
```

## Custom Implementation Example

The following example shows a common customization strategy in real-world projects:

```python
from typing import ClassVar
from orionis.console.output.console import Console
from orionis.failure.base.handler import BaseExceptionHandler
from orionis.failure.entities.throwable import Throwable
from orionis.services.log.contracts.log_service import ILogger


class ExceptionHandler(BaseExceptionHandler):

dont_catch: ClassVar[list[type[BaseException]]] = [
KeyboardInterrupt,
SystemExit,
]

async def report(
self,
exception: Exception,
log: ILogger,
) -> Throwable | None:
throwable = await super().report(exception, log)

if throwable is None:
return None

# Integration point for external systems (APM, alerts, etc.)
# await notify_monitoring_service(throwable)

return throwable

async def handleCLI(
self,
exception: Exception,
console: Console,
) -> None:
await super().handleCLI(exception, console)
```

## Best Practices

**1. Keep the Handler Thin**

Centralize orchestration in the handler, but delegate complex rules to dedicated services.

**2. Do Not Silence Errors Without Justification**

Every exception included in `dont_catch` should have an explicit technical reason.

**3. Avoid Leaking Sensitive Information**

Do not print secrets, tokens, or private data in logs or console output.

**4. Preserve Traceability**

Ensure that all relevant errors are recorded with sufficient context for diagnosis.

**5. Standardize Messages**

Use consistent formats to facilitate searches, alerts, and event correlation.

## Common Mistakes and How to Avoid Them

**Mistake: not returning `Throwable | None` in `report`**

If you override `report`, always respect the return contract to avoid inconsistencies in upper layers.

**Mistake: catching everything in `dont_catch`**

Adding too many exceptions can defeat the purpose of the centralized handler.

**Mistake: depending on the concrete logger type**

Couple to the `ILogger` contract, not to specific implementations.

**Mistake: mixing business logic in the handler**

The handler should coordinate error handling, not execute domain rules.

## Production Checklist

Before deploying, validate the following:

- The `ExceptionHandler` class exists and extends `BaseExceptionHandler`.
- `dont_catch` contains only justified exceptions.
- `report` logs relevant errors consistently.
- `handleCLI` displays readable output for operators.
- No sensitive data is exposed in logs or console output.
- The team understands the error flow and its observability strategy.

## Notes

The Orionis Framework Exception Handler provides a solid foundation for managing errors with modern architectural principles: consistency, extensibility, and traceability.

By properly customizing `ExceptionHandler`, you get an error handling system ready for growth, efficient diagnosis, and reliable operation in real-world environments.