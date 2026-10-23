---
title: "Configure bootstrap/app.py"
description: "Constructor, compile, callbacks, routes, providers, middleware, scheduler and every withConfig setter."
editUrl: true
lastUpdated: false
---

`bootstrap/app.py` constructs and exports the application. Keep one instance, configure its registrations, and finish with `app.create()`. The server imports that object; Reactor uses the same bootstrap in its own process.

<a id="bootstrap-order"></a>
## File order

The distributed project constructs the application, optionally enables compilation, registers lifespan callbacks, defines routes, selects the scheduler and exception handler, declares providers and middleware, and calls `create()`.

The `with...` methods return `Self`. `compile()` returns `None`: call it as a separate statement. A valid snapshot restored by `compile()` makes the `with...` methods reuse the bootstrap and return without applying changes. Without that snapshot, changing these registrations after they are frozen raises `RuntimeError`.

Callbacks registered through `on()` remain in memory and are not serialized. Register them before their event; the code does not require registration before `create()`.

<a id="bootstrap-construction"></a>
## Constructor and root

In `bootstrap/app.py`:

```python
from pathlib import Path
from orionis import Application

app = Application(base_path=Path(__file__).parent.parent)
```

The root resolves configuration, routes, providers, and storage. The instance is retained per class and process. See [IApplication](/en/getting-started/application-api#application-construction) for its signature and properties.

<a id="bootstrap-compile"></a>
## compile(): persistence

```text
compile(path: str | None = None,
        invalidation_paths: list[str] | None = None) -> None
```

```python
app.compile(
    path="storage/framework/bootstrap",
    invalidation_paths=["app", "bootstrap", "config", "routes", ".env"],
)
```

The default location is `storage/framework/cache`; the generated project selects `storage/framework/bootstrap`. Paths that do not exist when registered are ignored; create them before including them in the watch list. Directories contribute Python files; include `.env` explicitly. The call can restore metadata immediately from the `config` file.

[Directories and cache](/en/getting-started/paths-and-caching) explains scope per process, server, and Fargate task. [Environment](/en/architecture/environment/compiled-configuration) covers JSON, invalidation, and variable changes.

<a id="bootstrap-on"></a>
## on(): callbacks

```text
on(lifespan: Lifespan, *callbacks: Callable[..., Any] |
   Callable[..., Awaitable[Any]], runtime: Runtime | None = None) -> Self
```

Accepts `Lifespan.STARTUP` and `Lifespan.SHUTDOWN`; use `Runtime.HTTP`, `Runtime.CLI`, or `None` for both. Requires at least one callable. An incompatible event or callback raises `TypeError`; no callbacks raises `ValueError`. A hashable runtime outside the registry is treated as global: use the enum to avoid that fallback.

```python
from orionis.foundation.enums import Lifespan, Runtime
from orionis.foundation.contracts.application import IApplication


async def prepare_http(app: IApplication) -> None:
    # Initialize application-owned resources here.
    pass


app.on(Lifespan.STARTUP, prepare_http, runtime=Runtime.HTTP)
```

Callbacks are invoked through DI and stored in sets: execution order is not guaranteed, and the same callable is not duplicated within a set. [Application lifecycle](/en/getting-started/application-lifecycle) explains execution and errors.

<a id="bootstrap-routing"></a>
## withRouting(): all contexts

```text
withRouting(
    api: str | list[str] | None = None,
    web: str | list[str] | None = None,
    console: str | list[str] | None = None,
    health: str | None = None,
    ai: str | list[str] | None = None,
    *, websocket: str | list[str] | None = None,
) -> Self
```

| Argument | Purpose |
|---|---|
| `api` | HTTP route files without the default web state. |
| `web` | HTTP route files with their web layer. |
| `console` | Reactor command route registrations. |
| `ai` | MCP registration files. |
| `websocket` | WebSocket and Realtime routes; keyword-only. |
| `health` | Health URL, not a file. Without an effective value, `routeHealthCheck` uses `/up`. |

Lists preserve order. `None` produces an empty list; tuples are not accepted. Each call replaces **all** contexts: successive partial calls do not accumulate options.

```python
app.withRouting(
    api=["routes/api.py", "routes/admin.py"],
    web="routes/web.py",
    console="routes/console.py",
    ai="routes/ai.py",
    websocket="routes/websocket.py",
    health="/up",
)
```

Create `routes/admin.py` before using it. Files are resolved against `basePath`, must exist, and must pass the `orionis.support.facades` import validation, or be an accepted empty file. An incompatible type raises `TypeError`; a missing file raises `FileNotFoundError`. Bootstrap repair commands can temporarily allow the repaired context's file to be missing.

Registration syntax is covered in [HTTP routes](/en/http/routing), [console](/en/console/command-routing), [MCP](/en/protocols/mcp), and [Realtime](/en/asynchronous/realtime).

<a id="bootstrap-providers"></a>
## withProviders(): services

```text
withProviders(*providers: type[IServiceProvider]) -> Self
```

Accepts compatible classes, not instances. The application also loads native providers and discovers concrete classes in `app_providers`. Eager and deferred providers differ in construction and boot timing; see [Providers](/en/architecture/service-container/providers-and-facades) for creation, ordering, and DI.

```python
from app.providers.app_service_provider import AppServiceProvider

app.withProviders(AppServiceProvider)
```

<a id="bootstrap-middleware"></a>
## withMiddleware(): global HTTP middleware

```text
withMiddleware(*middleware: type[IBaseMiddleware]) -> Self
getMiddleware() -> list[type[IBaseMiddleware]]
```

Adds classes in order and avoids duplicates by module/class. Rejects instances and classes outside the contract with `TypeError`. Does not start the chain or configure CLI command middleware.

```python
from app.http.middleware.global_middleware import GlobalMiddleware

app.withMiddleware(GlobalMiddleware)
```

[Middleware](/en/http/middleware-and-security) explains how the kernel combines this registration with its native layer and route middleware.

<a id="bootstrap-exceptions"></a>
## withExceptionHandler(): global handler

```text
withExceptionHandler(handler: type[IBaseExceptionHandler]) -> Self
```

Replaces the descriptor with the selected class; incompatible types or classes raise `TypeError`.

```python
from app.exceptions.handler import ExceptionHandler

app.withExceptionHandler(ExceptionHandler)
```

`await app.getExceptionHandler()` builds it through DI after application creation. See [Exception handling](/en/architecture/exception-handling) for customization.

<a id="bootstrap-scheduler"></a>
## withScheduler(): schedule class

```text
withScheduler(scheduler: type[IBaseScheduler]) -> Self
```

Replaces the schedule class. Requires a subclass of `IBaseScheduler`; otherwise it raises `TypeError`.

```python
from app.console.scheduler import Scheduler

app.withScheduler(Scheduler)
```

`await app.getScheduler()` builds its instance. Registration or application creation does not start a clock: [Schedule and tasks](/en/console/task-scheduling) explains `tasks()`, `Schedule.command()`, and `schedule:work`.

<a id="bootstrap-config-setters"></a>
## withConfig...(): section values

All these signatures are synchronous and return `Self`:

| Signature | Section |
|---|---|
| `withConfigApp(**app_config: object) -> Self` | `app` |
| `withConfigAuth(**auth_config: object) -> Self` | `auth` |
| `withConfigMcp(**mcp_config: object) -> Self` | `mcp` |
| `withConfigCache(**cache_config: object) -> Self` | `cache` |
| `withConfigHttp(**http_config: object) -> Self` | `http` |
| `withConfigDatabase(**database_config: object) -> Self` | `database` |
| `withConfigFilesystems(**filesystems_config: object) -> Self` | `filesystems` |
| `withConfigLogging(**logging_config: object) -> Self` | `logging` |
| `withConfigMail(**mail_config: object) -> Self` | `mail` |
| `withConfigQueue(**queue_config: object) -> Self` | `queue` |
| `withConfigSession(**session_config: object) -> Self` | `session` |
| `withConfigTesting(**testing_config: object) -> Self` | `testing` |

Another call to the same setter replaces its pending dictionary. Loading combines native defaults, overrides, and discovered `config/` dataclasses, in that order. Project files can replace values supplied in bootstrap. The setter does not immediately construct an entity or guarantee validation of arbitrary keywords: use the subsystem's fields.

```python
app.withConfigApp(name="Reports", debug=False)
```

This override takes effect if no dataclass replaces it; in a generated project, normally edit `config/app.py`. The `hashing`, `realtime`, `scheduler`, and `view` sections have no dedicated setter in this API: configure their files.

<a id="bootstrap-paths"></a>
## withConfigPaths(): directories

```text
withConfigPaths(**paths: str | Path | None) -> Self
```

Use actual keys such as `app_http_controllers` or `resources_views`. A relative string resolves against `basePath`; a relative `Path` resolves against the working directory. `None` and unhandled types use the default; unknown keys are not included. `root` always comes from `basePath`.

```python
app.withConfigPaths(
    resources_views="resources/templates",
    app_http_controllers="app/http/handlers",
)
```

Rebuilds the entire registry: another partial call can reset other paths to their defaults. Changing `app` does not relocate other independently defined keys. Does not create directories. [Directory](/en/getting-started/paths-and-caching) lists the complete registry.

<a id="bootstrap-create"></a>
## create(), boot() and execution

`create() -> Self` completes configuration and registration. `await boot() -> Self` additionally awaits eager asynchronous initialization for integrations without a server; it does not execute hooks or kernels. [Entry points](/en/getting-started/server-entrypoints) and [Application lifecycle](/en/getting-started/application-lifecycle) cover HTTP and CLI startup/shutdown.

Default kernels come from native metadata. There is no `withKernel()` method or constructor protocol option: ASGI/RSGI is selected by the server.
