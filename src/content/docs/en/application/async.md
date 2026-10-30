---
title: "Connecting synchronous and asynchronous code"
description: "Loop centralizes loop creation, callable dispatch, and synchronous bridges. Start by deciding whether your code already runs inside an event loop: that determines which…"
editUrl: true
lastUpdated: false
---

Loop centralizes loop creation, callable dispatch, and synchronous bridges. Start by deciding whether your code already runs inside an event loop: that determines which operation to use.

Since Orionis 1.0.8, loop management uses the `asyncio` registration and `asyncio.Runner` for a predictable lifecycle on Python 3.14. When updating older code, `createTask()` is now synchronous, `runSync()` rejects calls from an active loop, and `KeyboardInterrupt` propagates to the caller.

## Requirements

- Python 3.14 or newer, as declared by the project.
- A normal Orionis installation. There is no `aio`-specific installation extra.
- On non-Windows platforms, the project declares `uvloop>=0.22.1`; `Loop` uses it when importable. On Windows, `uvloop` is not required and Orionis tries `asyncio.ProactorEventLoop` instead.
- No application bootstrap, container binding, configuration file, or external service is required to use `Loop` directly.
## Quick start

Run an async application entry point and move a blocking callable to the loop's default executor:

```python
import time

from orionis.aio import Loop


def blocking_label(value: int) -> str:
    time.sleep(0.01)
    return f"job-{value}"


async def main() -> str:
    label = await Loop.execute(blocking_label, 7)
    return label.upper()


result = Loop.run(main())
print(result)  # JOB-7
```

`Loop.run` creates and owns the entry-point loop. `Loop.execute` invokes `blocking_label` in the default executor, then returns its result to `main`.

## Choose the right entry point

| Situation | Operation | Result |
|---|---|---|
| Script or CLI with no active loop | `Loop.run(main())` | Runs the coroutine and returns its result. |
| Already inside an `async` function | `await main()` | Keeps the current loop and its resources. |
| Unknown sync or async callback | `await Loop.execute(callback, ...)` | Dispatches and awaits the result. |
| Concurrent work on the same loop | `task = Loop.createTask(work())` followed by `await task` | Creates an `asyncio.Task` immediately; await the task for its result. |
| Synchronous contract with no active loop requiring an async result | `Loop.runSync(work())` | Runs the coroutine in the calling thread and waits for its result. |

Inside an async controller, use `await` directly. Both `run()` and `runSync()` raise `RuntimeError` if a loop is already running in the calling thread. They do not create another thread to handle this situation. A rejected coroutine remains unconsumed: its caller must await or close it.

`execute()` accepts a function, not an already-created coroutine object. Sync callables run through `asyncio.to_thread`, which propagates the caller's `ContextVar` values to the worker. If one returns an awaitable, including a generator-based coroutine, that result is awaited back on the original loop.

### Resource ownership

`getEventLoop()` reuses the running loop or the open loop registered with `asyncio` in that thread. If it creates a loop, the caller owns its cleanup. `eventLoopContext()` borrows an already registered loop without cancelling tasks or closing it; when no open loop exists, it creates and manages its own loop through `asyncio.Runner`. `Loop.run()` also manages an owned loop and restores the previous registration on exit. Retain every task and await or cancel its result; task creation does not provide persistence, retries, or a supervisor.

Use [queues](/en/queues) when work must survive a restart; an asyncio task is not persisted. For work attached to an HTTP response, see [background tasks](/en/queues/background-tasks/response-tasks).

## Core concepts

### Entry-point loop versus the current loop

`Loop.run(coro)` is for a synchronous entry point where no event loop is running in the calling thread. Inside async code, use `await` normally. `Loop.getEventLoop()` returns the active loop when called inside async code; outside it, the method reuses the open loop registered with `asyncio` or creates and registers a new one. It keeps no cache separate from the `asyncio` registration.

### Callable bridge

`Loop.execute(func, *args, **kwargs)` accepts both kinds of callable. A coroutine function is called and awaited on the current loop. A synchronous callable is sent through `asyncio.to_thread` to that loop's default executor, preserving the caller's context. If it returns an awaitable, the returned object is subsequently awaited on the current loop.

### Synchronous coroutine bridge

`Loop.runSync(coro)` delegates to `Loop.run` in the same thread and waits for the coroutine to finish. It requires that no loop is running in the calling thread; from async code, use `await`. This method no longer uses a shared executor.

### Loop ownership and cleanup

`Loop.eventLoopContext()` borrows any open loop already registered, including one obtained earlier through `getEventLoop()`. On exit, it does not cancel its tasks or close it. Nested contexts borrow the outer context's loop.

When no open loop is registered on entry, the context creates its own loop. On exit, `asyncio.Runner` cancels and drains pending tasks, finalizes asynchronous generators, shuts down the default executor, and closes the loop. Do not close that loop manually or leave it running on exit.

## Common workflows

### Start a CLI or script

Define one top-level coroutine, create the coroutine object, and pass it to `Loop.run`. Do not call `Loop.run` from an async handler; that would attempt to nest event loops in one thread.

### Call blocking code from async code

Pass the synchronous function and its arguments to `await Loop.execute(...)`. The loop remains available to run other tasks while the default executor performs the blocking call. Coroutine functions can use the same entry point and are awaited directly.

### Schedule concurrent work

Inside a running loop, call `Loop.createTask(coro, name=...)` for each coroutine, without awaiting its creation. Save the returned tasks and later await them individually or with `asyncio.gather`.

### Adapt an async operation to a synchronous contract

Use `Loop.runSync(coro)` at a synchronous boundary whose thread has no running loop. The method preserves the caller's thread and context. If you control an async call chain, use `await` directly.

## Examples

### Dispatch sync and async callables through one interface

The same operation handles both callable styles while preserving keyword arguments:

```python
from orionis.aio import Loop


def sync_join(*, left: str, right: str) -> str:
    return f"{left}:{right}"


async def async_join(*, left: str, right: str) -> str:
    return f"{left}/{right}"


async def main() -> tuple[str, str]:
    sync_value = await Loop.execute(sync_join, left="a", right="b")
    async_value = await Loop.execute(async_join, left="a", right="b")
    return sync_value, async_value


print(Loop.run(main()))  # ('a:b', 'a/b')
```

The synchronous function runs in the loop's default executor; the coroutine function stays on the caller's loop.


### Create and identify a task

Task names are useful in diagnostics, while the task object retains the result:

```python
import asyncio

from orionis.aio import Loop


async def fetch_total() -> int:
    await asyncio.sleep(0)
    return 42


async def main() -> tuple[str, int]:
    task = Loop.createTask(fetch_total(), name="fetch-total")
    return task.get_name(), await task


print(Loop.run(main()))  # ('fetch-total', 42)
```

`createTask` schedules immediately; awaiting the returned task is what retrieves its result.


### Bridge an async operation into synchronous code

At a synchronous script boundary with no active loop, `runSync()` obtains the async result for the caller:

```python
from orionis.aio import Loop


async def lookup(code: str) -> str:
    return code.upper()


print(Loop.runSync(lookup("orionis")))  # ORIONIS
```

The synchronous caller waits until `lookup` finishes. In an async controller, command, or job, use `await lookup(...)` directly; calling `runSync` from that loop raises `RuntimeError`.


### Handle invalid entry-point usage

Pass the coroutine object returned by calling an async function, not the function itself:

```python
from orionis.aio import Loop


async def main() -> int:
    return 1


try:
    Loop.run(main)  # type: ignore[arg-type]
except TypeError as error:
    print(str(error))  # A coroutine object is required
```

Validation occurs before a loop is created.

## Configuration

This module consumes no Orionis configuration keys or environment variables. Factory selection follows the current platform and whether `uvloop` can be imported; there is no public setting to override that selection. The resolved factory is cached for the life of the process.

## Integration with Orionis

- `orionis.mail` uses `Loop.execute` to keep synchronous rendering, file storage, and SMTP work off the active event-loop thread.
- The `Unique` rule awaits its database query directly on the current loop, preserving its connection and transaction; it does not use `runSync`.
- The repository's `reactor` executable starts `app.handleCommand(sys.argv)` with `Loop.run`.
- `Loop` has no provider and is not resolved through the service container; importing it is sufficient.

These are direct consumers, not bootstrap side effects. Importing `orionis.aio` does not create a loop, executor, or application.

## Errors and edge cases

- `run` raises `TypeError("A coroutine object is required")` for a coroutine function, plain value, or other object that is not a native coroutine object.
- `run` and `runSync` raise `RuntimeError` when the calling thread already has a running loop. The supplied coroutine remains unconsumed and the caller must await or close it.
- `execute` raises `TypeError("The provided object is not callable")` before scheduling a non-callable. It is async: await its result from async code or run its coroutine with `Loop.run` at a synchronous entry point.
- Exceptions from invoked callables and coroutines propagate; the module does not wrap them.
- `run` and `runSync` propagate `KeyboardInterrupt` to the caller.
- `eventLoopContext` only cleans up and closes owned loops. Closing one manually or leaving it running on exit raises `RuntimeError`. Borrowed loops and their tasks remain their owner's responsibility.
- A registered loop that is already closed is discarded and replaced on the next `getEventLoop` call.

## Performance and concurrency

Loop-factory resolution and `uvloop` detection are process-wide caches guarded by a `threading.Lock` during first use. Repeated resolution uses an unlocked fast path.

The `asyncio` registration determines the thread's loop. `getEventLoop()` respects changes made with `asyncio.set_event_loop()` and reuses the registered open loop; a currently running loop takes precedence.

`execute` uses the current loop's default executor through `asyncio.to_thread`; its capacity and lifecycle belong to that event loop. `runSync` runs in the calling thread and has no global pool serializing calls made from different threads.

`runSync` rejects nested loops. `createTask` only schedules work; concurrency depends on the coroutine yielding control.

## Public API

### `Loop`

Recommended import:

```python
from orionis.aio import Loop
```

All public methods are static or class methods and operate on shared class state.

#### `getEventLoop()`

```text
Loop.getEventLoop() -> asyncio.AbstractEventLoop
```

Returns the loop currently running in the calling thread. If none is running, it reuses the open loop registered with `asyncio` or creates a new one and installs it with `asyncio.set_event_loop`. The caller must close a loop created by this method. For automatic cleanup, enter `eventLoopContext()` directly without registering an open loop first.

#### `run(coro)`

```text
Loop.run(coro: Coroutine[Any, Any, T]) -> T
```

Runs a native coroutine object to completion and returns its value. Factory selection is `uvloop.new_event_loop` when available outside Windows, then `asyncio.ProactorEventLoop` on Windows when exposed, then `asyncio.new_event_loop`. It always uses `asyncio.Runner` with a factory that registers the loop before running the coroutine. On exit it cleans up and closes the owned loop, then restores the previous loop if it remains open.

The method accepts a coroutine object, not a coroutine function or a general awaitable. It propagates exceptions, including `KeyboardInterrupt`, and rejects use from a thread that already has a running loop.

#### `execute(func, /, *args, **kwargs)`

```text
await Loop.execute(func, *args, **kwargs) -> Any
```

Invokes a coroutine function directly and awaits it. It offloads any other callable to the current loop's default executor using `asyncio.to_thread`, propagating the caller's `ContextVar` values. Arguments and return values pass through unchanged; an awaitable recognized by `inspect.isawaitable` is awaited on the original loop before returning the result. Original exceptions cross the await boundary unchanged.

Await this method from a running event loop. It creates no private executor.

#### `eventLoopContext()`

```python
from orionis.aio import Loop


with Loop.eventLoopContext() as loop:
    assert loop is Loop.getEventLoop()
```

If an open loop is already registered, it yields that borrowed loop without modifying it on exit. Otherwise it creates an owned loop through `asyncio.Runner`: on exit it cancels and drains tasks, finalizes asynchronous generators, shuts down the default executor, closes the loop, and clears its registration. Nested contexts borrow the outer loop. Manually closing an owned loop or leaving it running on exit raises `RuntimeError`.

#### `isLoopRunning()`

```text
Loop.isLoopRunning() -> bool
```

Reports whether an event loop is actively running in the calling thread. A registered but idle loop does not make this return `True`.

#### `createTask(coro, *, name=None)`

```text
Loop.createTask(coro, name=None) -> asyncio.Task[T]
```

Creates the task on the current running loop and returns it immediately. The method is synchronous: retain the task and use `await task` to observe its result and exceptions. The optional name is forwarded to `asyncio.create_task`. Without a running loop it raises `RuntimeError`.

#### `runSync(coro)`

```text
Loop.runSync(coro: Coroutine[Any, Any, T]) -> T
```

Delegates directly to `run` and waits for the coroutine in the calling thread. It preserves that thread's context and shares `run`'s requirements, cleanup, and exceptions. If the thread already has a running loop, it raises `RuntimeError` and leaves the coroutine unconsumed.

Reserve `runSync` for synchronous APIs running without an active loop. Async callers must use `await`.

## Implementation reference for extensions

| Path | Responsibility |
|---|---|
| `__init__.py` | Re-exports `Loop` as the package's only supported top-level symbol. |
| `loop.py` | Implements factory selection, per-thread loop reuse, task cleanup, callable dispatch, and sync/async bridges. |

---

[Index](/en/application/async) · [background](/en/queues/background-tasks) · [foundation](/en/getting-started)

For explicit admission limits on synchronous work in 1.1.0, use [`BoundedExecutor` or `@threaded`](/en/utilities/helpers/concurrency). They expose overload and wait for running native work during cancellation. `Loop.execute()` retains the default-executor behavior documented here; adding an async wrapper alone does not apply the new bounded budget.
