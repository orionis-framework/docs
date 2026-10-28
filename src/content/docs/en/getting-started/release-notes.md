---
title: "Release notes"
description: "Orionis 1.0.8 through 1.0.12: Loop on Python 3.14, tests, schema generation, queue migration, HTTP performance, and the Debug facade."
editUrl: true
lastUpdated: false
---

These notes cover **versions 1.0.8 through 1.0.12** and link to the updated usage guides. Run Reactor examples from the application root using its Python environment.

<a id="v1-0-12"></a>

## 1.0.12: Debug facade

The new `Debug` facade provides access to the debugging service:

```python
from orionis.support.facades import Debug

data = {"ready": True, "items": [1, 2, 3]}
Debug.dump(data)
Debug.dd(data)
```

`Debug.dump()` prints values to the console and allows execution to continue. `Debug.dd()` displays values and stops execution: in HTTP with debugging enabled, it interrupts the request with an HTML diagnostic response; in the console, it terminates the process. Both calls are synchronous and require an initialized application. See [Debug](/en/utilities/helpers/debug) for options, return values, and behavior outside debug mode.

<a id="v1-0-11"></a>

## 1.0.11: HTTP and response performance

The HTTP path uses fewer locks and redundant calls. ASGI/RSGI request admission uses a per-kernel counter on the worker event loop; public routes without middleware skip unnecessary steps, and endpoint policy lookups are skipped when no policies are registered.

HTML, JSON, redirect, streaming, SSE, and file responses prepare standard headers with fewer calls. Each response keeps independent mutable headers; precedence rules, subclass hooks, serialization behavior, and stream behavior are preserved. See [request limits](/en/http/requests) and [response headers](/en/http/responses).

### Local time estimates

The local validation reported for this release recorded **320 passing tests**. The overall estimate is **approximately 10–15% less time per request along the measured Python path**, without networking. Each measurement has its own scope:

| Area or response | Estimated time reduction | What was measured |
| --- | ---: | --- |
| HTTP ASGI | **≈15%** | Per-request path, without networking. |
| HTTP RSGI | **≈13%** | Per-request path, without networking. |
| HTML | **≈10%** | Small response construction. |
| Compact JSON | **≈23%** | Small payload construction and serialization. |
| Redirects | **≈11%** | Construction and headers. |
| Streaming | **≈19%** | Construction, not transfer. |
| SSE | **≈24%** | Construction, not stream duration. |
| Formatted JSON | **No stable improvement** | Variable results. |
| Files and downloads | **No stable improvement** | Results vary with I/O. |

:::caution[Scope of these figures]
Construction figures are indicative and showed considerable variability. **They cannot be added together and do not equal the same increase in requests per second (RPS).** They do not guarantee an RPS improvement in your application; files and downloads have no stable percentage. Measure the complete workload, including networking, database access, and I/O, before extrapolating these results.
:::

These figures describe the reported local validation of 1.0.11; they are not a new benchmark of each later release. Behavioral tests cover, among other cases, [execution resources](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_execution_resources.py), [request limits](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_request_limits.py), and [response construction](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_response_performance.py).

<a id="v1-0-10"></a>

## 1.0.10: table schemas and queue migration

The table schema creation stub used by `make:database-schema` has been updated: generated modules declare `TABLE: Final[TableDefinition | None] = None` instead of a wrapper class. Replace `None` with the table definition and import that constant in migrations and models. Review the [generated schema example](/en/database/schema) and the [generator reference](/en/database/commands).

A new command explicitly prepares tables for database-backed queues:

```bash
python reactor queue:migrate
```

If you use uv to select the project environment, the equivalent invocation used in these guides is:

```bash
uv run python -B reactor queue:migrate
```

See [queue drivers and preparation](/en/queues/drivers-and-configuration) to select the connection and review which tables are prepared. This command handles queue infrastructure; application migrations run through `reactor migrate`.

<a id="v1-0-9"></a>

## 1.0.9: tests and benchmarking application

This release corrects details in the `uvloop` integration tests and the Orionis application used in HTTP comparisons. That application's periodic readiness check changes from `0.01` to `0.1` seconds. This adjusts benchmark startup; it does not establish per-request latency or an RPS improvement.

The [HTTP comparison application](https://github.com/orionis-framework/framework/blob/cd986045b/benchmarks/http_compare/apps/orionis.py) belongs to the framework development repository. For your own application tests, continue using the [testing guide](/en/testing/writing-and-running-tests).

<a id="v1-0-8"></a>

## 1.0.8: Loop and Python 3.14

`Loop` has been refactored to make event loop registration, ownership, and cleanup predictable on Python 3.14. Synchronous entry points reject calls from an active loop, synchronous work delegated to threads preserves context, and owned loops are closed through `asyncio.Runner` without closing borrowed loops.

When updating code that uses these utilities, review `Loop.runSync()`, `Loop.createTask()`, and `Loop.eventLoopContext()` in particular. `createTask()` is synchronous and returns the task that you can subsequently await. The [asynchronous execution guide](/en/application/async) contains current signatures and examples.
