---
title: Lifespan Events
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Lifespan Events

Orionis Framework provides a lifespan event system that lets you register functions to execute during application **startup** and **shutdown** in the CLI runtime. This gives you a clean entry point for initialization and teardown logic that runs before and after every console command.

---

## What Are Lifespan Events

A lifespan event is a hook that fires at one of two critical moments in the application's lifecycle:

| Event | When It Fires |
|---|---|
| **Startup** | Immediately after the application boots and before any command is processed. |
| **Shutdown** | Immediately after the command logic completes and before the process exits. |

These events are represented by the `Lifespan` enum:

```python
from orionis.foundation.enums.lifespan import Lifespan

Lifespan.STARTUP   # "lifespan.startup"
Lifespan.SHUTDOWN   # "lifespan.shutdown"
```

---

---

## Registering Lifespan Callbacks

Callbacks are registered on the `Application` instance using the `on()` method in the `bootstrap/app.py` file. You can register multiple callbacks for the same event in a single call, and both synchronous and asynchronous functions are supported.

### Basic Registration

```python
from orionis.foundation.enums.lifespan import Lifespan
from orionis.foundation.enums.runtimes import Runtime

def on_startup():
    print("Application is starting up...")

def on_shutdown():
    print("Application is shutting down...")

app.on(
    Lifespan.STARTUP,
    on_startup,
    runtime=Runtime.CLI,  # Scoped to the CLI runtime context
)

app.on(
    Lifespan.SHUTDOWN,
    on_shutdown,
    runtime=Runtime.CLI,
)
```

### Multiple Callbacks

Pass multiple functions in a single call. They will all execute during the specified event:

```python
def init_cache():
    print("Initializing cache...")

def init_connections():
    print("Opening database connections...")

app.on(
    Lifespan.STARTUP,
    init_cache, init_connections,
    runtime=Runtime.CLI,
)
```

### Lambda Callbacks

Lambdas are valid callbacks for concise, inline logic:

```python
app.on(
    Lifespan.SHUTDOWN,
    lambda: print("Goodbye!"),
    runtime=Runtime.CLI,
)
```

### Async Callbacks

Asynchronous functions are fully supported and awaited during execution:

```python
async def warm_up_cache():
    # Async initialization logic
    ...

app.on(
    Lifespan.STARTUP,
    warm_up_cache,
    runtime=Runtime.CLI,
)
```

---

## Execution Flow

When a CLI command is executed (e.g., `python -B reactor list`), the framework follows this sequence:

```
1. Application boots and loads configuration
2. CLI kernel is initialized
3. ✅ STARTUP callbacks execute
4. Command logic runs
5. ✅ SHUTDOWN callbacks execute
6. Process exits
```

Every command invocation triggers the full startup → execute → shutdown cycle. This ensures resources are properly initialized and released for each operation.

---

## Lifespan Events vs. Scheduler Events

The task scheduler in Orionis has its own event system with `onStarted` and `onShutdown` listeners. Although the names are similar, they operate at different layers:

| Aspect | Lifespan Events | Scheduler Events |
|---|---|---|
| **Scope** | Entire application lifecycle | Scheduler service lifecycle |
| **Registration** | `app.on(Lifespan.STARTUP, ...)` | Scheduler listener class |
| **STARTUP fires** | Before any application logic | When the scheduler starts its cycle, before any task runs |
| **SHUTDOWN fires** | After all application logic completes | When the scheduler is gracefully stopped, before returning control |

When combining both, the execution order for a scheduled task run is:

```
1. Lifespan STARTUP callbacks
2. Scheduler onStarted listener
3. Scheduled tasks execute...
4. Scheduler onShutdown listener
5. Lifespan SHUTDOWN callbacks
```

This layered design lets you separate **application-level** concerns (database connections, environment setup) from **scheduler-level** concerns (task state logging, resource pooling for jobs).

---

## Practical Example

A typical `bootstrap/app.py` configuration combining lifespan events with other application setup:

```python
from pathlib import Path
from orionis.foundation.application import Application
from orionis.foundation.enums.lifespan import Lifespan
from orionis.foundation.enums.runtimes import Runtime
from app.providers.app_service_provider import AppServiceProvider

app = Application(
    base_path=Path(__file__).parent.parent,
)

# Configure routing
app.withRouting(
    console="routes/console.py",
)

# Register providers
app.withProviders(
    AppServiceProvider,
)

# CLI lifespan events
def on_startup():
    print("Initializing CLI resources...")

app.on(
    Lifespan.STARTUP,
    on_startup,
    runtime=Runtime.CLI,
)

app.on(
    Lifespan.SHUTDOWN,
    lambda: print("CLI resources released."),
    runtime=Runtime.CLI,
)

# Boot the application
app.create()
```

---

## Method Reference

### `app.on()`

Register one or more callbacks for a lifespan event.

**Signature:**

```python
app.on(
    lifespan: Lifespan,
    *callbacks: Callable,
    runtime: Runtime | None = None,
) -> Self
```

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `lifespan` | `Lifespan` | The event to attach callbacks to (`STARTUP` or `SHUTDOWN`). |
| `*callbacks` | `Callable` | One or more functions (sync or async) to execute. |
| `runtime` | `Runtime \| None` | Runtime context. Use `Runtime.CLI` for console commands. |

**Raises:**

| Exception | Condition |
|---|---|
| `TypeError` | `lifespan` is not a `Lifespan` enum member, or a callback is not callable. |
| `ValueError` | No callbacks are provided. |

**Returns:** The application instance (`Self`) for method chaining.
