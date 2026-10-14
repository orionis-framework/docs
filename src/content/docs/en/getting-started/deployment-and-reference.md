---
title: "Deployment, diagnostics, and Application reference"
description: "Use the generated project root, retain uv.lock, and provide the production .env and existing private APP_KEY. Configure APP_ENV=production and APP_DEBUG=bool:false through the…"
editUrl: true
lastUpdated: false
---

## Prepare an application release

Use the generated project root, retain `uv.lock`, and provide the production `.env` and existing private `APP_KEY`. Configure `APP_ENV=production` and `APP_DEBUG=bool:false` through the application configuration. Make the configured storage and log directories writable by the application process, and review database migrations before applying them.

```shell
uv sync --frozen --python 3.14
uv run python -B reactor about
uv run python -B reactor route:list
uv run python -B reactor serve --export
```

`serve --export` prints the resolved Granian command without starting the server. It reflects the current environment, protocol, platform, and port; review that output when configuring your process supervisor. `serve` uses `127.0.0.1` in development and `0.0.0.0` in production, with port 8000 unless specified. In production, place the server behind the application's configured TLS/proxy setup and supervise HTTP workers, queue workers, and the scheduler as separate processes.

The default `/up` route confirms that the application's HTTP path responds. Add an application-specific check when deployment readiness also depends on a database or external service. After changing code or startup configuration, refresh affected bootstrap caches and restart every long-running process; [Realtime groups](/en/asynchronous/realtime/groups-and-deployment), [sessions](/en/http/sessions/stores-and-concurrency), and [MCP events](/en/protocols/mcp/advanced-workflows) have explicit worker-local limits.

## Public API

### `Application(base_path=Path.cwd())`

`orionis.Application` is a thread-safe singleton per concrete subclass. `Application.current()` returns an existing instance without creating it. Properties expose base/entry paths, start time, compiled-cache state, health route, creation/provider/HTTP readiness, debug/production flags, and maintenance state.

### Bootstrap methods

- `compile(path=None, invalidation_paths=None)` enables cached bootstrap state.
- `withRouting(api, web, console, health, ai, websocket=...)` registers validated route files.
- `withProviders(*classes)` and `withMiddleware(*classes)` register extension classes.
- `withExceptionHandler(cls)` and `withScheduler(cls)` replace defaults.
- `withConfigApp/Auth/Cache/Http/Database/Filesystems/Logging/Mail/Mcp/Queue/Session/Testing(**values)` supplies section overrides.
- `withConfigPaths(**paths)` resolves the full application directory map.
- `on(lifespan, *callbacks, runtime=None)` registers global or runtime-specific hooks.

`with...` and `on(...)` return the application for chaining and reject mutation after creation. `compile(...)` returns `None` and must be a separate statement. On a valid compiled-cache hit, cached bootstrap metadata wins and registration/configuration methods intentionally become no-ops.

### Runtime methods

`create()` is synchronous registration/configuration. `boot()` is async provider readiness for headless processes. `handleCommand(args=None)` executes the CLI kernel within CLI lifecycle hooks. `config()`, `path()`, and `routingPaths()` expose runtime configuration, immutable bootstrap paths, and thawed route lists.

`getExceptionHandler()` and `getScheduler()` lazily build configured application classes after creation. Container methods inherited by `Application` provide binding, resolution, scopes, and invocation.

### `Directory`

`Directory(app)` snapshots `app.path()` once and exposes typed methods such as `root()`, `appModels()`, `databaseMigrations()`, `resourcesViews()`, and `storageLogs()`. Later path-map replacement does not change that snapshot.

## Errors and edge cases

- `config`, `path`, environment flags, handler, and scheduler access reject use before creation where applicable.
- Bootstrap mutation after creation raises `RuntimeError`; invalid provider, middleware, handler, or scheduler classes raise `TypeError`.
- Routing rejects missing files, invalid argument types, and files without an allowed facade import.
- Invalid config entities fail creation with their original validation error, wrapped only where discovery requires it.
- Application construction is singleton per subclass: later constructor arguments do not reinitialize an existing instance.
- Runtime config is mutable and returned mappings are live; call `resetRuntimeConfig()` to restore the frozen baseline.
- Unknown `path`/routing keys return `None`; `routeHealthCheck` defaults to `/up`.
- A corrupt/unreadable maintenance marker deliberately reports maintenance mode.

## Performance and concurrency

Compiled mode stores bootstrap state in `FileBasedCache` and invalidates it from monitored files/directories. Core providers and config entities use lazy imports. Dot-notation config keys use an LRU capped at 256, and frequently queried production/debug flags are precomputed at creation.

Provider boot, CLI kernel initialization, and HTTP kernel initialization each use async locks so concurrent callers share one successful startup. Maintenance refresh uses a thread lock. Request scopes and container resolution are context-local, but the application explicitly does not promise mutable-state safety across event loops or arbitrary threads.

Optional HTTP disconnect monitoring uses a bounded ASGI queue (eight queued messages plus one producer-held message) or an RSGI watcher and cancels request work on client disconnect. WebSockets bypass that body-monitoring path.

## Compatibility

Orionis foundation targets Python 3.14+ and implements ASGI HTTP/WebSocket/lifespan plus Granian RSGI integration and CLI Reactor dispatch. Path resolution uses `pathlib`; locale/timezone application remains platform-dependent and unsupported locales are ignored after config validation.

## Module structure

| Area | Responsibility |
|---|---|
| `application.py` | Bootstrap, protocols, kernels, providers, routing, config, paths, maintenance. |
| `contracts/` | `IApplication` and `IDirectory` interfaces. |
| `directory.py`, `core_paths.py` | Snapshot path access and default application tree. |
| `config/` | Native frozen entities, enums, normalization, shared environment helpers. |
| `core_config.py` | Lazy construction of independent core defaults. |
| `core_providers.py`, `core_kernels.py` | Lazy provider classes and kernel metadata. |
| `core_exception_handler.py`, `core_scheduler.py` | Default extension metadata. |
| `enums/` | `Lifespan` and `Runtime`. |
| `lifespan/` | Debug startup/shutdown panels and uptime summary. |

## Reference and next steps

[application.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/application.py) · [application.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/contracts/application.py) · [core_providers.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/core_providers.py)

[Return to the module index](/en/getting-started).
