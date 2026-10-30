---
title: "Bounded concurrency"
description: "Run blocking callbacks with threaded and BoundedExecutor, preserve dependency injection, and handle overload, cancellation and shutdown."
editUrl: true
lastUpdated: false
---

Since **1.1.0**, `orionis.support.concurrency` provides bounded thread execution for synchronous I/O. These utilities work without an application container; dependency injection is available when Orionis invokes the decorated callable.

```python
from orionis.support.concurrency import (
    BoundedExecutor,
    WorkQueueFullError,
    complete_on_cancel,
    threaded,
)
```

## Decorate a blocking callable

`@threaded` turns a synchronous callable into an awaitable wrapper. It preserves its original signature for dependency injection and copies context variables into the worker thread. Ordinary synchronous handlers retain their existing execution behavior unless decorated.

```python
from pathlib import Path

from orionis.support.concurrency import threaded


@threaded
def read_report(path: Path) -> str:
    return path.read_text(encoding="utf-8")


async def load_report(path: Path) -> str:
    return await read_report(path)
```

Pass an existing readable file to `load_report()`. In a booted application, `await app.invoke(read_report, path=path)` also uses the preserved signature. Dependencies are resolved before execution crosses into the worker, so objects passed to the function must support use from that thread. Do not use event-loop-bound resources from a synchronous callback.

Decorating an `async def` raises `TypeError`. Python CPU work still competes for the GIL in a standard interpreter. A thread pool is useful for blocking I/O; it does not replace process isolation for CPU-intensive work.

## Own a worker budget

```text
BoundedExecutor(max_workers: int = 4, *, max_pending: int = 32,
                name: str = "orionis-worker")
async run(callback, /, *args, **kwargs) -> callback result
close() -> None
async aclose() -> None
```

Construction is lazy: it does not start worker threads until needed. `max_workers` must be a positive integer and `max_pending` a nonnegative integer; booleans are invalid. The capacity belongs to the executor instance, including callers from different event loops in the same process.

```python
from pathlib import Path

from orionis.support.concurrency import BoundedExecutor


async def read_with_budget(path: Path) -> bytes:
    pool = BoundedExecutor(2, max_pending=8, name="report-io")
    try:
        return await pool.run(path.read_bytes)
    finally:
        await pool.aclose()
```

For a service receiving many calls, keep one pool for its lifetime rather than constructing a pool per request. `run()` accepts a synchronous callback and returns its result; callback exceptions propagate. If all running and pending slots are occupied, it raises `WorkQueueFullError` immediately instead of waiting for space. Choose the application's overload response explicitly.

Use `await aclose()` from async code. `close()` blocks until running work ends and cancels work that has not started; `aclose()` performs that cleanup away from the application loop. Submissions after close fail. The caller owns custom executors and must close them during shutdown.

## Cancellation and resource ownership

Cancelling queued work prevents it from starting. Cancelling already running work waits for native completion before releasing its slot and propagating cancellation. A cancellation request does not prove that a file write, SMTP transaction or other external effect did not happen. Configure finite timeouts in the underlying I/O client.

`await complete_on_cancel(awaitable, on_cancel=None)` applies this wait-before-propagation behavior to an owned awaitable. The optional synchronous callback can request cancellation of work not yet started. It is a cleanup tool, not a timeout or background-task scheduler; it does not forcibly stop native threads.

<a id="framework-worker-budgets"></a>

## Framework worker budgets

These defaults are shared **per process**, not across all server workers:

| Work | Active workers | Additional pending calls | Admission behavior |
| --- | --- | --- | --- |
| `@threaded` callbacks | 4 | 32 | `WorkQueueFullError` when full. |
| Argon2 and bcrypt combined | 2 | 14 | Shared [hashing budget](/en/cryptography/hashing/password-storage#hashing-worker-budget); custom executors are supported. |
| Top-level template loading and warmup | 2 | 64 | Shared [template pool](/en/views/configuration-and-cache#view-warmup). |
| SMTP `sendMany()` batches | 4 | 16 | Shared [batch pool](/en/mail/transports-and-extensions#smtp-batches); up to 100 prepared messages per batch. |

The framework's ordinary SMTP `send()` retains its existing executor path. Logging uses a separate listener per queued handler with [`queue_capacity`](/en/logging/configuration#logging-queue-capacity), not one of these executor budgets. Worker counts do not limit the memory retained by arguments, results, SDK buffers or application code. Multiply each process budget by the number of deployed worker processes when sizing the host.
