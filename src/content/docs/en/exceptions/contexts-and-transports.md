---
title: "Exceptions by context and transport"
description: "Distinguish HTTP and CLI handling from WebSocket, Realtime and MCP protocol errors, and from task and job failure policies."
editUrl: true
lastUpdated: false
---

## Runtime boundaries

Orionis observes failures after the corresponding runtime starts successfully and throughout its shutdown. `create()` and provider registration are not that boundary. Failure-handler preparation occurs before activation, outside request and operation scopes.

| Runtime | Activation |
| --- | --- |
| ASGI with lifespan | Startup callbacks and kernel initialization finish, then `lifespan.startup.complete` is successfully sent. |
| HTTP without lifespan | Lazy kernel initialization, endpoint metadata, and handler preparation finish before the first request dispatch. This path does not run omitted lifespan hooks. |
| RSGI | `__rsgi_init__` completes startup before serving requests. |
| CLI | Kernel initialization and startup callbacks finish before executing the command. Concurrent commands keep separate ownership tokens. |
| Headless and direct workers | `await app.boot()` completes; the owner opens an explicit `operation(...)` around supervised work and eventually calls `await app.aclose()`. |

Construction, configuration, and bootstrap failures before activation remain outside automatic observation. Arbitrary external tasks, threads, processes, and code that consumes errors without notifying an owner are not automatically covered.

## One observation, owner-controlled outcomes

The execution owner supplies the original exception to `capture` or declares a failed value through `capture_result`. The coordinator invokes `handleFailure(exception, context)` or `handleResult(value, context)` once for the incident. A returned `FailureHandling` selects deferred effects: the coordinator completes logging, and an HTTP or CLI owner may request presentation from that same plan through `Catch.exception()`.

| Integration | Observation and retained outcome |
| --- | --- |
| HTTP ASGI/RSGI | Request execution, validation, rejected results, streams, send failures, and background cleanup notify at their ownership boundaries. Native statuses and responses remain owned by HTTP. A late failure after sending starts cannot initiate a second HTTP response. |
| WebSocket | Adapters observe operational accept, receive, send, and close failures; disconnects and protocol close decisions retain their meanings. |
| CLI | Exceptions and declared nonzero outcomes are distinct. Observation does not change the command's exit status. The command's original exception survives a secondary shutdown failure. |
| MCP HTTP/STDIO | Dispatch, tools, streams, delivery, and cleanup preserve JSON-RPC envelopes and protocol-owned responses. `isError` is a failed result without an invented traceback. Emergency diagnostics use stderr, never protocol stdout. |
| Realtime | Invocation, listeners, broadcasts, delivery, and cleanup keep their protocol completion or close behavior. Failed delivery is observed without inventing a successful completion. |
| Queues | Each attempt owns its failure, retry, acknowledgment, and failed-job decision. Independent attempts are separate incidents even when an exception object is reused. |
| Scheduler and background work | Scheduled callbacks, managed tasks, futures, and their drains notify before consuming operational errors. Cancellation remains a control signal. |
| Internal services | Recoveries in cache, session, mail, storage, authorization, and views observe operational failures before returning their existing fallback. Normal absence is not automatically an exception. |
| Shutdown | Observation remains active through callbacks, supervised work, and resource closure. All independent shutdown callbacks are attempted after ordinary failures. Closing logging resources disables ordinary logging while retaining bounded emergency diagnostics. |

These integrations do not require one catch in every method. Errors that propagate intact are observed by the owning boundary. A recovery or failed result that consumes the error must notify before discarding it. An incident already observed must be transferred explicitly when a task or callback hands it to another owner.

## Explicit headless observation

```python
from orionis.failure.runtime import capture, operation

await app.boot()
try:
    with operation(app, flow="worker", operation="import", isolated=True):
        try:
            await service.run()
        except Exception as error:
            await capture(error, phase="execution")
            raise
finally:
    await app.aclose()
```

`operation` binds context and deduplication; it does not capture errors automatically. Keep streaming consumption within the operation. Use managed `Loop.createTask` work or provide an explicit owner for external tasks. A shared handler must not store request-scoped dependencies, incident plans, requests, or exceptions in singleton state.

## Context, cancellation, and cleanup

`FailureContext` records flow, phase, operation, correlation/event identifiers, expected status, reporting permission, and bounded scalar metadata. Receipts contain delivery status without retaining the request or exception. The operation releases its incident ledger when it ends; independent operations do not share deduplication merely because they reuse the same exception object.

Original exception identity, tracebacks, causes, and exception groups remain available. Secondary reporting, sending, or cleanup failures cannot silently replace the primary incident. Cooperative reporting timeouts do not interrupt synchronous code that blocks the event loop. A real caller cancellation propagates after owned cleanup; it is distinct from a callback raising an internal `CancelledError`.

Do not invoke either application hook directly as an emergency reporter, and do not call `complete()` or `present()` inside a hook. Return the selected plan to the coordinator. Reentry, duplicate notification, or retrying a partially completed effect cannot serve as a fallback strategy.

See [handler customization](/en/exceptions/handling-exceptions), [policies and reference](/en/exceptions/policies-and-reference), and [HTTP exceptions](/en/http/exceptions).
