---
title: "Release notes"
description: "Orionis 1.0.8 through 1.5.0: core authorization storage, password recovery, validation, and upgrade notes."
editUrl: true
lastUpdated: false
---

These notes cover **versions 1.0.8 through 1.5.0** and link to the updated usage guides. Run Reactor examples from the application root using its Python environment.

<a id="v1-5-0"></a>

## 1.5.0: authorization and recovery storage in the core

Version **1.5.0** moves the technical schema for roles, permissions, their relationships, and password recovery into the core. `auth:migrate`, which has prepared personal access tokens since 1.3.0, now creates all seven internal authentication and authorization tables. Python **3.14+** remains required.

### Prepare authentication tables

| Tables | Responsibility |
| --- | --- |
| `permissions` and `roles` | Store capabilities and roles with unique names. |
| `model_has_permissions`, `model_has_roles`, and `role_has_permissions` | Link identities to capabilities and roles, and roles to permissions. |
| `auth.tokens.table` (`AUTH_TOKEN_TABLE`, default `personal_access_tokens`) | Store personal access tokens. |
| `auth.passwords.table` (`AUTH_PASSWORD_RESET_TABLE`, default `password_reset_tokens`) | Store password recovery credentials. |

The command uses the default SQL connection and its table prefix, requires enforced unique constraints, and accepts no `--database`. Configured personal access token and recovery table names must differ from each other and from the five authorization tables, ignoring case. A collision is rejected before any tables are created.

For a new database, apply identity and business migrations, prepare auth storage, then run application seeders:

```bash
python -B reactor migrate
python -B reactor auth:migrate
python -B reactor seed
```

`auth:migrate` creates missing storage from framework definitions without importing files from `database/`, executing seeders, or recording entries in `migrations`. The `User` model, its `users` table, and its migration remain in the application, as do business role and permission names, their assignments, and policies. Preparing tables does not create accounts or grant administrator privileges. See [roles and permissions](/en/authentication/authorization), [account recovery](/en/authentication/account-recovery), and the [`auth:migrate` reference](/en/database/commands#auth-migrate).

### Upgrade to 1.5.0

```bash
uv add "orionis==1.5.0"
uv sync
```

For pip-managed environments, use `python -m pip install --upgrade "orionis==1.5.0"`. Review the default connection, `AUTH_TOKEN_TABLE`, and `AUTH_PASSWORD_RESET_TABLE`; if you use [compiled configuration](/en/environment/compiled-configuration), regenerate it before running `python -B reactor auth:migrate`. Restart application processes and workers with the updated version.

Rerunning `auth:migrate` preserves existing tables and records, including assignments, tokens, and recovery requests. It does not run `DROP` or `ALTER`, relocate data when a table name changes, or rewrite migration history. An incompatible existing schema needs an explicit application migration.

The reference application removes the six authorization and recovery migrations and schemas now provided by the core. **Keep already-applied migrations and the schemas they import in existing projects**: deleting them can prevent rollback of their recorded batches. Do not renumber files or clear history to adopt the command. Updating the package does not automatically modify your application's or skeleton's migrations. See the [auth storage upgrade guide](/en/database/migrations#auth-storage-1-5-0).

<a id="v1-4-0"></a>

## 1.4.0: field coercion and empty-value rules

Version **1.4.0** adds optional conversion before validation with `Coerce()`, plus the complementary rules `Empty()` and `NoEmpty()`. Fields without coercion remain strict. Python **3.14+** remains required.

### Convert before validating with `Coerce()`

Import `Coerce` from `orionis.schemas.metadata` and attach it to a field's declared type:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import GreaterThan
from orionis.schemas.fields import Field
from orionis.schemas.metadata import Coerce


class QuantityInput(Schema):
    quantity: Field[int, Coerce(), GreaterThan(0)]
```

When the validator processes this schema, it converts the marked value before checking its type, constraints, and rules:

| Input | Result |
| --- | --- |
| `"12"` or `"12.0"` | Becomes the integer `12` and passes. |
| `"0"` | Becomes `0` and fails `GreaterThan(0)` with code `gt`. |
| `"abc"` or `"1.5"` | Fails with code `type`; no truncation or replacement with zero. |

Other supported destinations include `float`, `bool`, and `Decimal`, according to the declared type's conversion rules. The marker works with nested schemas, collections, renamed fields, and nullable types. Marking a collection or schema enables conversion of its descendant values and fields; dictionary keys remain strict, and unmarked sibling fields are unaffected.

Validation preserves the original payload. Directly constructing a schema instance does not run coercion. See [field coercion](/en/validation/declaring-schemas#field-coercion) and [form input](/en/validation/controllers-and-http#form-field-coercion).

### Define emptiness with `Empty()` and `NoEmpty()`

Both rules share one definition and are exact opposites. Empty values include `None`, empty or whitespace-only strings, numeric zeros, `False`, collections with length zero, and uploaded files with zero bytes. File contents are not read.

The string `"0"` is present; after coercion to `int`, its value is an empty numeric zero. `[None]` and `{"key": None}` are present because they contain elements. The rules neither trim strings nor consume iterators without a length; those iterators are treated as present. A missing field still follows the schema's required-field rules, and a value must satisfy its declared type before an emptiness rule can apply.

Import both rules from `orionis.schemas.rules`. Each accepts `message=`; failure codes are `empty` and `no_empty`. Nested failures preserve paths such as `items[0].name` and their custom messages. See the [rule reference](/en/validation/application-rules#empty-and-no-empty) and the [complete order-validation example](/en/validation/validation-and-errors#coercion-and-empty-rules), including the rejection cases.

### Validation and quality

The release adds **38 tests: 22 for coercion and 16 for emptiness**, covering a real multipart request, nesting, custom messages, conversions, and payload preservation. Release validation passed **561 schema tests** and **3 HTTP response tests**. Shared validation logic reduced duplication and complexity; Ruff and SonarLint reported no warnings, with targeted suppressions documented. Framework documentation was updated in English and Spanish.

### Upgrade to 1.4.0

```bash
uv add "orionis==1.4.0"
uv sync
```

For pip-managed environments, use `python -m pip install --upgrade "orionis==1.4.0"`. Adopt coercion explicitly on fields that should accept convertible input. Use `NoEmpty()` when zero and `False` must also be rejected; it is not a substitute for declaring a required field. Review the [validation sequence and errors](/en/validation/validation-and-errors) before changing existing contracts.

<a id="v1-3-0"></a>

## 1.3.0: internal storage commands and API documentation

Version **1.3.0** adds commands to prepare framework-owned storage, aligns method names with the framework convention, and corrects the generated API documentation. Python **3.14+** remains required.

### Prepare internal storage

The new `auth:migrate`, `cache:migrate`, `schedule:migrate`, and `session:migrate` commands join the existing `queue:migrate`. Each creates missing tables from the framework's definitions using the corresponding configuration. Run the commands for the storage your application needs:

```bash
python -B reactor auth:migrate
python -B reactor cache:migrate
python -B reactor queue:migrate
python -B reactor schedule:migrate
python -B reactor session:migrate
```

These commands preserve existing records and do not drop or alter existing tables. They do not create application migration files or write entries to the migration history. They do not accept `--database`: configure each storage connection before running them. See [database commands](/en/database/commands#internal-storage-commands) and [migration ownership and upgrades](/en/database/migrations#framework-storage-tables).

The framework's reference application removes five redundant migrations and their five schema definitions for scheduler tasks, cache values, cache locks, sessions, and personal access tokens. In 1.3.0 it retained users, permissions, roles, their relationships, and password recovery without renumbering the remaining files; [1.5.0](#v1-5-0) expands auth storage managed by the core. This cleanup does not automatically remove files from existing applications or from every skeleton. Review your own migrations before adopting the commands; preserve existing migration history and use an explicit application migration for any required schema change. The release changes did not modify existing databases or their migration history.

### Method names and generated reference

Class methods use `camelCase`, `_camelCase`, or `__camelCase`; functions outside classes use `snake_case`. Python special methods such as `__init__` retain their required names. When upgrading, review custom subclasses, overrides, and calls to renamed methods against the [API reference](https://api.orionis-framework.com/) and the [naming convention](/en/contribute/guide#naming-conventions).

Framework docstrings were corrected and completed in NumPy style for Pydoctor. The API reference is generated from the framework's docstrings and published at [api.orionis-framework.com](https://api.orionis-framework.com/). The [contribution guide](/en/contribute/guide#api-docstrings) explains the format and documentation requirements. In `tests/test_http_compare.py`, all **57 functions and methods** now use NumPy docstrings with imperative summaries and no `Examples` sections; that last restriction applies to this test file, not to every API docstring.

<a id="http-benchmark-1-3-0"></a>

### HTTP benchmark correction

The benchmark launcher now enables `TCP_NODELAY` on Uvicorn's listening socket before sharing it with multiple workers. This removes the TCP penalty observed for small responses in that setup. The correction was validated on Linux and belongs to the benchmark launcher, not to Orionis's production `serve` command.

**The published benchmark graphs are still pending regeneration with this fix.** Do not treat the existing graphs as measurements of the corrected launcher or infer new throughput figures from this release. A new comparison requires rerunning the benchmark with the corrected launcher and the same workload and worker counts.

Tests and documentation were updated, and the checks run for the release passed, including Ruff and diagnostics.

### Upgrade to 1.3.0

From the application root:

```bash
uv add "orionis==1.3.0"
uv sync
```

For pip-managed environments, use `python -m pip install --upgrade "orionis==1.3.0"`. Updating the package does not rewrite application configuration, replace the skeleton, or execute storage commands. Review method names and storage configuration, regenerate [compiled configuration](/en/environment/compiled-configuration) if used, and restart application and worker processes. Run the storage commands explicitly when the corresponding tables are needed.

<a id="v1-2-0"></a>

## 1.2.0: inspect SQL without executing a query

Model queries and `DB.table()` now expose synchronous `toSql(*, literal_binds=False) -> str`. The default output uses the selected dialect's placeholders. Use `literal_binds=True` to render supported values as SQL literals for debugging:

```python
from orionis.support.facades import DB

query = DB.table("users").where("active", True)
sql = query.toSql()
debug_sql = query.toSql(literal_binds=True)
```

SQL compilation respects the connection's dialect and table prefix. For model queries it also includes applicable global scopes and the soft-delete filter. It works on a copy without executing the query or changing the original builder, so the builder can still be used afterward. A bootstrapped application or configured connection resolver is required to resolve the connection settings.

Literal rendering is intended for inspection and may expose sensitive values; some types cannot be rendered and raise `QueryException`. Keep parameterized execution for application queries. See [`DB.table().toSql()`](/en/database/query-builder#api-tosql) and [model SQL inspection](/en/orm/querying#query-to-sql) for examples and limitations.

<a id="v1-1-0"></a>

## 1.1.0: bounded execution and batch APIs

Version **1.1.0** adds optional APIs for concurrent cache misses, query batches, SMTP batches, template preparation and blocking application work. It also bounds internal caches and worker admission. Python **3.14+** remains required.

| Area | Change and usage guide |
| --- | --- |
| Blocking callbacks | [`@threaded` and `BoundedExecutor`](/en/utilities/helpers/concurrency) preserve DI signatures and context variables while applying explicit worker limits. |
| Cache | [`rememberOnce()`](/en/cache/caching-values#repository-rememberonce) shares overlapping resolutions; an optional backend lease coordinates additional callers. File batch operations reduce worker transitions. |
| ORM and SQL builder | [`chunks(size=1000)`](/en/orm/collections-and-pagination#query-chunks) yields collections using a deterministic order without materializing the full result. |
| SMTP | [`SmtpTransport.sendMany()`](/en/mail/transports-and-extensions#smtp-batches) sends up to 100 prepared messages through one connection and reports partial outcomes. |
| Logging | [`queue_capacity`](/en/logging/configuration#logging-queue-capacity) enables bounded background delivery; [`aclose()`](/en/logging/rotation-and-lifecycle#logging-async-close) drains running logging resources. The default remains synchronous. |
| Hashing | [Argon2 and bcrypt](/en/cryptography/hashing/password-storage#hashing-worker-budget) share a dedicated worker budget, with unchanged cryptographic parameters. |
| Views | [`warmup()`](/en/views/configuration-and-cache#view-warmup) prepares templates; cold top-level loading and reload checks run in a dedicated pool. |
| Storage | [`stream.chunks()`](/en/storage/streaming-and-uploads#stream-chunks) and buffered native reads retain explicit ownership and bounded consumption. |
| Retained state | [Translation maps](/en/localization/messages-and-locales#locale-cache-limits) and [schema plans](/en/validation/validation-and-errors#validation-plan-cache) now have bounded caches. |

Other internal changes reduce repeated dependency-injection inspection, model hydration setup, request-header conversion and collection equality work. Native token authentication can combine token and owner retrieval while retaining the final revocation/expiration check. Redis queue transitions use cached script identifiers with `NOSCRIPT` recovery. See [token authentication](/en/authentication/personal-access-tokens#token-lookup-performance), [Redis queues](/en/queues/drivers-and-configuration#redis-script-cache) and [collection uniqueness](/en/utilities/helpers/collection#collection-unique-performance). These changes do not establish a universal throughput improvement for every application.

### Upgrade an existing application

From the application root, select the new runtime version and synchronize the environment:

```bash
uv add "orionis==1.1.0"
uv sync
```

For an environment managed directly with pip, use `python -m pip install --upgrade "orionis==1.1.0"`. This updates the framework package; it does not regenerate application configuration or install a new project skeleton. Review and regenerate any compiled configuration through the existing [configuration workflow](/en/environment/compiled-configuration), then restart application and worker processes.

Existing `remember()`, `get()`, single-message mail delivery and synchronous callbacks retain their APIs. Adopt the new batch and threaded APIs explicitly. Before enabling them, define how the application handles `WorkQueueFullError`, logging `queue.Full`, admission timeouts and partial SMTP delivery. Cancellation can wait for an already running native operation; configure finite I/O timeouts. The [worker budget table](/en/utilities/helpers/concurrency#framework-worker-budgets) lists the limits per process.

<a id="v1-0-16"></a>

## 1.0.16: MCP origin lists and Inspector configuration

MCP `allowed_origins` now uses `list[str]`, consistent with HTTP configuration. Lists and tuples remain accepted as input; each configuration instance stores an independent list.

The editable `BootstrapMcp` configuration in `config/mcp.py` supplies `["https://inspector.orionis-framework.com"]` when `CORS_ALLOW_ORIGINS` is unset. Core `McpConfig` defaults to `[]` when that variable is unset and does not embed the Inspector URL. An explicit `CORS_ALLOW_ORIGINS` list replaces the editable default, including an empty list.

For an existing application, update the `allowed_origins` field in its `config/mcp.py` to adopt this default; updating the installed framework alone does not rewrite your configuration. The field uses `field` from `dataclasses` and `Env` from `orionis.environment`:

```python
allowed_origins: list[str] = field(
    default_factory=lambda: Env.get(
        "CORS_ALLOW_ORIGINS", ["https://inspector.orionis-framework.com"],
    ),
)
```

Alternatively, configure the allowed origins explicitly through the environment:

```dotenv
CORS_ALLOW_ORIGINS=["https://inspector.orionis-framework.com"]
```

MCP accepts requests without `Origin`. A present `Origin` must exactly match a configured HTTP(S) origin; otherwise, the transport returns `403`. Entries contain only the scheme, host, and optional port, without a path or trailing slash. Wildcards and implicit same-origin access remain unsupported; `[]` rejects every present `Origin`.

The environment variable is shared with HTTP CORS, but MCP keeps its stricter validation. In particular, the `["*"]` HTTP CORS setting shown for [1.0.15](#v1-0-15) is invalid for MCP. Use explicit origins when sharing this variable, and configure HTTP CORS to allow the browser's methods, headers, and preflight requests. See [MCP configuration](/en/mcp/stdio-and-configuration#allowed-http-origins) and [browser testing](/en/mcp/testing#inspect-an-http-server-in-the-browser).

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
