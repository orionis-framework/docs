---
title: "Release notes"
description: "Orionis 1.0.8 through 1.0.15: HTTP CORS, schema validation, serve --host, performance, queues, and the Debug facade."
editUrl: true
lastUpdated: false
---

These notes cover **versions 1.0.8 through 1.0.15** and link to the updated usage guides. Run Reactor examples from the application root using its Python environment.

<a id="v1-0-15"></a>

## 1.0.15: HTTP CORS for debugging tools

This release completes the allowed-origin change introduced in [1.0.13](#v1-0-13). HTTP CORS now defaults to `["*"]` for origins, methods, and headers:

```dotenv
CORS_ALLOW_ORIGINS=["*"]
CORS_ALLOW_METHODS=["*"]
CORS_ALLOW_HEADERS=["*"]
```

These values allow requests and their `OPTIONS` preflight checks to use the methods and headers needed to test the API from browser debugging tools such as Postman, EchoAPI, or Hoppscotch, provided the browser can reach the endpoint. You do not need to list each method or header for these tests.

The values correspond to `allow_origins`, `allow_methods`, and `allow_headers` in the HTTP `Cors` configuration. Set explicit lists to restrict them. `allow_credentials` remains `False` and `expose_headers` remains `[]`; enabling credentials requires explicit origins. See [HTTP CORS](/en/http/middleware#http-cors).

<a id="v1-0-14"></a>

## 1.0.14: schema validation

This release improves `orionis.schemas` validation for input data and schemas returned by HTTP controllers.

### Structured errors and multiple failures per field

Each entry in `ValidationException.errors[field]` now contains `rule` and `message`. Custom rules retain their `__code__` identifier; native constraints report codes such as `ge`, `gt`, `multiple_of`, or `min_length`.

The validator collects applicable constraints and rules that fail on the same field. For example, a negative odd quantity can violate both `GreaterThanOrEqual(1)` and `MultipleOf(2)`. With custom messages supplied through `message=`, the result can be:

```json
{
  "message": "Quantity must be positive. (and 1 more error)",
  "errors": {
    "quantity": [
      {"rule": "ge", "message": "Quantity must be positive."},
      {"rule": "multiple_of", "message": "Quantity must be even."}
    ]
  }
}
```

The summary counts failures, not fields. An incompatible type produces a type error and skips rules that require the converted value. Nested schemas and collection errors retain paths such as `items[0].quantity`. When updating API consumers, read `error["message"]` where you previously received a string; `error["rule"]` identifies the failed condition. WEB forms retain text messages in the flash error bag. See [validation and errors](/en/validation/validation-and-errors).

### Automatic HTTP output validation

When an action returns a `Schema` instance directly, the framework checks its types, constraints, and rules before serialization. This also revalidates modified instances and nested schemas. Invalid output follows server error handling and produces `500` with the default configuration.

The check depends on the returned value: a return annotation does not convert or validate a dictionary. `dict` and `Response` results retain their paths without running output validation. Returning the same schema received as input runs its rules again; use an appropriate output contract when rules call external services. See [schemas in HTTP controllers](/en/validation/controllers-and-http).

### Compilation, performance, and rule generation

Native constraints also compile inside collections and unions, such as `list[Field[int, GreaterThanOrEqual(1)]]` and `Nullable[Field[int, GreaterThanOrEqual(1)]]`. Custom messages and renamed fields are preserved. The [schema declaration guide](/en/validation/declaring-schemas) includes executable examples of all seven type aliases.

Successful conversion keeps native checks in C through `msgspec`, using prepared, reusable plans. Detailed collection runs on invalid input, and Python traversal skips children without custom rules. Asynchronous rules and their I/O operations retain their own cost.

The `make:http-schema-rule` generator uses the updated stub with `async def enforce(...)`, `__code__`, and `__message__`. See [custom rules](/en/validation/application-rules) to implement the asynchronous contract.

<a id="v1-0-13"></a>

## 1.0.13: serve --host and HTTP CORS

The `serve` command adds `--host` to select the listening address explicitly:

```bash
python reactor serve --host 0.0.0.0 --port 8000
```

`0.0.0.0` listens on all IPv4 interfaces. Omitting `--host` preserves `127.0.0.1` in development and `0.0.0.0` in production; the default port is `8000`. See [server entry points](/en/application/server-entrypoints).

The **HTTP** CORS configuration changes the default `allow_origins` value to `["*"]`. This allows external browser origins and makes it easier to test endpoints with web clients such as Postman or Hoppscotch without installing a desktop client, provided the browser can reach the API. An empty list is also normalized to `["*"]`; configure explicit origins to restrict access by origin.

In 1.0.13, the change concerns allowed origins: requests requiring preflight also need methods and headers permitted through `allow_methods` and `allow_headers`. [Version 1.0.15](#v1-0-15) completes this configuration by also defaulting methods and headers to `["*"]`. `allow_credentials` remains `False`; enabling credentials requires explicit origins instead of `"*"`. See [HTTP CORS](/en/http/middleware). WebSocket and MCP origin policies are configured separately.

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
