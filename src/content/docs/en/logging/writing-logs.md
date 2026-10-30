---
title: "Recording application events"
description: "Record events with Log or ILogger, inspect channels, and use the logging service's complete synchronous API."
editUrl: true
lastUpdated: false
---

The `Log` facade and `ILogger` contract access the application logger. Use them from controllers, commands, jobs, services, or other components: [logging configuration](/en/logging/configuration) determines where records go and which levels are accepted.

<a id="logger-facade"></a>

## Record events with the Log facade

Import the facade from the public module. During normal application operation, its writing methods are **synchronous**, including inside an `async def` action:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Log


class ImportStatusController:
    async def __call__(self, import_id: int) -> JSONResponse:
        Log.info(f"event=import-status-requested import_id={import_id}")
        return JSONResponse({"import_id": import_id, "status": "ready"})
```

Save the controller in `app/http/controllers/import_status_controller.py` and register its endpoint, for example in `routes/api.py`:

```python
from app.http.controllers.import_status_controller import ImportStatusController
from orionis.support.facades import Route

Route.get("/imports/{import_id:int}/status", ImportStatusController)
```

With the default configuration, the `INFO` event reaches `storage/logs/stack.log`. Do not add `await` to `Log.info(...)` after normal startup: the method returns `None`. Writing and rotation run in the calling thread; an asynchronous action does not turn file access into asynchronous I/O.

<a id="logger-provider"></a>

### How the service is obtained

The native provider registers `ILogger → Logger` as a **singleton**, with the `x-orionis-ILogger` alias. Its asynchronous `boot()` executes `await Log.pin()`, retaining that same service on the facade. HTTP and CLI startup await this stage before executing application components; you do not need to register the provider manually.

`app.create()` can leave asynchronous provider boot pending. If you integrate Orionis through a custom entry point, await `app.boot()` before using the facade as above. You can also resolve and call `ILogger` directly, as shown below. The service methods remain synchronous in both cases.

<a id="logger-injection"></a>

## Constructor and method injection

Import the contract from `orionis.logging.contracts.logger`. Use constructor injection when several actions need to record events:

```python
from orionis.http import JSONResponse
from orionis.logging.contracts.logger import ILogger


class OrderAuditController:
    def __init__(self, logger: ILogger) -> None:
        self.logger = logger

    async def show(self, order_id: int) -> JSONResponse:
        self.logger.info(f"event=order-viewed order_id={order_id}")
        return JSONResponse({"order_id": order_id})
```

If only one action needs the service, declare it on the method:

```python
from orionis.http import JSONResponse
from orionis.logging.contracts.logger import ILogger


class HealthLogController:
    async def __call__(self, logger: ILogger) -> JSONResponse:
        logger.debug("event=health-checked")
        return JSONResponse({"ok": True})
```

Register these actions through the [routing API](/en/http/routing). The container supplies `ILogger`; it is not a payload field. The same contract works in services, commands, and other components that the framework constructs or invokes through its container. A direct Python call does not inject arguments automatically.

In a provider or another component with access to `IApplication`, explicit resolution is asynchronous and subsequent use is synchronous:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.logging.contracts.logger import ILogger


async def record_startup_check(app: IApplication) -> None:
    logger = await app.make(ILogger)
    logger.info("event=startup-check-completed")
```

The returned implementation is `Logger`, exported by `orionis.logging`. Receive **`ILogger` as your dependency** to reuse the provider singleton. Injecting the concrete `Logger` class can autoconstruct a different wrapper because the native binding is registered by contract. Both wrappers target the standard logger `__orionis__`: initializing a new one closes and replaces the previous instance's handlers. Do not construct a logger per request.

<a id="logger-write-methods"></a>

## Writing methods

These are the service's five public writing signatures; the pinned facade exposes the same operations:

```text
debug(message: str) -> None
info(message: str) -> None
warning(message: str) -> None
error(message: str) -> None
critical(message: str) -> None
```

| Method | When to use it |
| --- | --- |
| `debug` | Diagnostic details about an operation: identifiers, stages, or decisions. |
| `info` | Normal events worth retaining, such as a completed import. |
| `warning` | An unusual condition from which the application can still recover. |
| `error` | An operation failed, although the process can continue handling others. |
| `critical` | A serious failure compromises an essential application function. |

```python
from orionis.support.facades import Log


def record_import_events(import_id: int, row_count: int) -> None:
    Log.debug(f"event=import-started import_id={import_id}")
    Log.info(f"event=import-completed import_id={import_id} rows={row_count}")
    Log.warning(f"event=import-retry-scheduled import_id={import_id}")
    Log.error(f"event=import-failed import_id={import_id}")
    Log.critical("event=import-storage-unavailable")
```

The snippet illustrates all five levels; select the one matching the actual outcome of your operation. Records below the channel threshold are discarded. A `None` result does not confirm a record was written: it might have been filtered.

Each method accepts **one message only**. It does not accept the standard logger's `*args`, `extra`, `exc_info`, or `stack_info` arguments. Build the string before calling, or use [`getLogger()`](#logger-standard) for advanced options. This contract has no native `Log.log()`, `Log.notice()`, or `Log.exception()` methods.

Messages are forwarded without trimming, sanitization, or automatic request context. The caller is responsible for selecting fields and handling sensitive information while constructing the message. The built-in format is `date [LEVEL]: message`, with the date format `%Y-%m-%d %H:%M:%S`.

<a id="logger-inspection"></a>

## Inspect names and channels

```text
name: str
getAvailableChannels() -> list[str]
getActiveChannels() -> list[str]
getActiveChannel() -> str | None
```

`name` is `"__orionis__"`: the shared standard logger identifier, **not** the file channel name. `ILogger` declares a property; `Logger` implements it with a class attribute.

| Query | Result and effect |
| --- | --- |
| `getAvailableChannels()` | A new list of keys from `logging.channels`, in configuration order. Does not check whether each channel can be constructed. |
| `getActiveChannels()` | A new list containing the names of handlers registered in the wrapper. Normally contains one name. |
| `getActiveChannel()` | The first active name, or `None` when no handlers are registered. |

These queries do not initialize the logger or open files. A newly constructed service can report available channels while also returning `[]` and `None` for active state. The first message or `getLogger()` performs initialization. A fallback can appear as `fallback` even though it is absent from configured channels.

```python
from orionis.http import JSONResponse
from orionis.logging.contracts.logger import ILogger


class LoggingStatusController:
    async def __call__(self, logger: ILogger) -> JSONResponse:
        return JSONResponse({
            "logger": logger.name,
            "available": logger.getAvailableChannels(),
            "active": logger.getActiveChannel(),
            "active_channels": logger.getActiveChannels(),
        })
```

This inspection example is intended for an internal tool. Active state describes the wrapper; manually changing standard logger handlers does not update its cache of names.

<a id="logger-switch-channel"></a>

## Change the active channel

```text
switchChannel(channel_name: str) -> bool
```

Accepts an exact key from `logging.channels`, such as `"daily"`. When present, it initializes the logger if needed, closes and removes current handlers, then constructs the target handler. Returns `True` when the new handler is attached; it also attempts to record `Successfully switched to channel: daily` at `INFO`, subject to the new channel filter.

```python
from orionis.support.facades import Log


def select_daily_logging() -> bool:
    if not Log.switchChannel("daily"):
        return False
    Log.info("event=logging-channel-selected channel=daily")
    return True
```

Selection affects **every operation using the service in that process**, including concurrent requests. It does not create a request-local channel context and is not restored when a function exits. It also leaves `logging.default` unchanged: `reloadConfiguration()` or reconstruction after `close()` returns to the default.

An unconfigured name returns `False` before changing state. A construction failure after handlers were removed can return `False` and leave the logger **without an active channel**: the previous handler is not restored automatically. The method contains `OSError`, `RuntimeError`, and `ValueError`; it does not guarantee catching every error type from modified configuration. Check the result and state before depending on an operational channel change.

<a id="logger-reload"></a>

## Reload configuration

```text
reloadConfiguration() -> None
```

Closes handlers, clears the channel cache, rereads `app.config("logging")`, and reconstructs the default channel. Finally emits `Logger configuration reloaded successfully` at `INFO`; the threshold may filter it. Any exception during this process is raised as `RuntimeError`, preserving its original cause.

The method rereads **application runtime configuration**. It does not execute `config/logging.py` again, reload `.env`, or change bootstrap cache. Use [application configuration](/en/application/api#application-config) mechanisms for deliberate runtime changes:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.http import JSONResponse
from orionis.logging.contracts.logger import ILogger


class LoggingLevelController:
    async def __call__(self, app: IApplication, logger: ILogger) -> JSONResponse:
        app.config("logging.channels.stack.level", "WARNING")
        app.config("logging.default", "stack")
        logger.reloadConfiguration()
        logger.warning("event=logging-threshold-changed level=WARNING")
        return JSONResponse({"active": logger.getActiveChannel()})
```

This administrative example changes shared process state and returns to `stack`. The change is not sent to other workers and does not persist by itself after an application restart. A failed reload can leave handlers detached; configuration replacement is not transactional.

<a id="logger-close"></a>

## Close and release files

```text
close() -> None
async aclose() -> None
```

Removes and closes handlers, clears the cache, and resets the internal logger reference. Ordinary cleanup contains `OSError`, `RuntimeError` and `ValueError`; queued-handler delivery failures are collected and raised as `LoggingDeliveryError` after cleanup. It may be called repeatedly. `__del__()` also attempts to close a destroyed wrapper, but does not replace explicit cleanup when resources must be released at a particular time.

`close()` does not unregister the singleton or unpin `Log`. A later message or `getLogger()` reconstructs the default channel using the configuration retained by the wrapper. Consequently, do not call it after every request.

To close explicitly during the lifecycle of a custom integration, register a callback with DI in `bootstrap/lifespan.py`:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.foundation.enums.lifespan import Lifespan
from orionis.logging.contracts.logger import ILogger


async def close_application_logger(logger: ILogger) -> None:
    await logger.aclose()


def register_logger_shutdown(app: IApplication) -> None:
    app.on(Lifespan.SHUTDOWN, close_application_logger)
```

Call `register_logger_shutdown(app)` from `bootstrap/app.py`. Callback registration order is not guaranteed: another callback writing afterward can reopen the logger. See the [application lifecycle](/en/application/lifecycle) when coordinating cleanup across services.

<a id="logger-standard"></a>

## Access the standard logger and record tracebacks

```text
getLogger() -> logging.Logger
```

Initializes the service and returns the configured standard logger, not a copy. Use it for capabilities outside the five simple writing methods, such as recording the traceback of a caught exception:

```python
from orionis.logging.contracts.logger import ILogger


class IntegerParser:
    def __init__(self, logger: ILogger) -> None:
        self.logger = logger

    def parse(self, raw_value: str) -> int:
        try:
            return int(raw_value)
        except ValueError:
            self.logger.getLogger().exception("event=integer-parse-failed")
            raise
```

`logger.error("...")` alone does not attach the traceback; `.exception(...)` belongs to the object returned by `getLogger()`. Catching and recording an exception does not alter its propagation: this example raises it again. If the global handler also records it, there will be two records; choose which component is responsible for reporting it.

You can also use standard logger interpolation: `logger.getLogger().info("event=order-viewed order_id=%s", order_id)`. Its handlers are the same ones used by the facade. The logger is set to `DEBUG`, the handler applies the channel threshold, and `propagate` is `False`; records are not automatically forwarded to root logger handlers. Changing its levels or handlers affects other consumers in the process.

<a id="logger-constructor"></a>

## Construction, initialization, and errors

```text
Logger(app: IApplication) -> None
```

The constructor captures `app.config("logging")`. It does not create files yet. The first writing call or `getLogger()` initializes the logger using a double-checked lock, creates the required directory, and configures its handler and formatter. File selection and policies are explained in [rotation and lifecycle](/en/logging/rotation-and-lifecycle).

<a id="logger-errors"></a>

| Situation | Behavior |
| --- | --- |
| Configuration cannot be obtained when constructing `Logger` | The exception from `app.config(...)` propagates. |
| Initialization fails: inaccessible directory, locked file, or invalid data | Writing methods and `getLogger()` receive `RuntimeError` with the original cause. |
| The default name is absent from `channels` | Creates `storage/logs/default.log` with active name `fallback`. |
| The name exists but has no channel implementation | Initialization can finish without handlers; this does not trigger fallback. |
| A channel change or reload fails | Return and exception rules are explained with each method. |

Service initialization does not guarantee every subsequent writing operation succeeds. Handlers follow their own emission and I/O error rules; the service does not provide a retry queue or per-message delivery acknowledgment.

<a id="logger-facade-api"></a>

## Facade API and infrastructure

`Log` exposes the twelve `ILogger` methods above and `name` after an instance is pinned. It also retains infrastructure methods inherited from `Facade`:

| Signature | Use and result |
| --- | --- |
| `Log.getFacadeAccessor() -> str` | Returns `"x-orionis-ILogger"`. Does not initialize the logger. |
| `await Log.resolve(*args: object, **kwargs: object) -> object` | Resolves the registered service. Requires a created application; does not itself pin the instance on the facade. Arguments are forwarded to the container. |
| `await Log.pin() -> None` | Resolves and retains the instance for direct calls; the native provider already does this. |
| `Log.unpin() -> None` | Removes the pinned reference. Does not close files or remove the service binding. |

**Without a pinned instance**, `Log.info(...)` and other service accesses return a deferred operation: they must be awaited to execute. In that state, `await Log.info("...")` is valid; after pinning, use the synchronous call. Do not switch between these states during normal requests. For code that must work independently of pinning, receive `ILogger` or use `logger = await Log.resolve()` followed by `logger.info(...)`.

Resolution before application creation raises `RuntimeError`; container construction and resolution errors can also propagate. General dispatch behavior is explained in [synchronous and asynchronous facades](/en/application/container/facades#facade-dispatch).

Use `await logger.aclose()` when closing from async code. Since 1.1.0, the application automatically drains configured queued logging after shutdown callbacks, even if a callback fails. Do not register an extra callback solely for that default behavior. Custom standalone loggers still require an owner to close them. See [queued logging shutdown](/en/logging/rotation-and-lifecycle#logging-async-close).
