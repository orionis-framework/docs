---
title: "Async execution"
description: "Loop centralizes loop creation, callable dispatch, and synchronous bridges. Start by deciding whether your code already runs inside an event loop: that determines which…"
editUrl: true
lastUpdated: false
---

Loop centralizes loop creation, callable dispatch, and synchronous bridges. Start by deciding whether your code already runs inside an event loop: that determines which operation to use.

## Learning path

1. [Connecting synchronous and asynchronous code](/en/asynchronous/event-loops/async-execution): prerequisites, progressive usage, configuration, integration, failures, and public reference.

## Use it at the right application boundary

`Loop` is a standalone utility: it needs no application bootstrap, facade, or provider. In an async Orionis controller, command, or job, the loop already runs; use `await` for async operations and `await Loop.execute(blocking_function, ...)` for a blocking library call. `Loop.run(main())` belongs at a standalone script entry point where no loop is active.

Prefer the [queues module](/en/asynchronous/queues) when work must survive a restart. Scheduling an asyncio task does not persist it.

Related: [background](/en/asynchronous/background-tasks) · [foundation](/en/getting-started)
