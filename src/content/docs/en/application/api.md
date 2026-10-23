---
title: "IApplication: services and reference"
description: "Inject the application and inspect configuration, directories, readiness, middleware and registered services."
editUrl: true
lastUpdated: false
---

<a id="application-contract"></a>
## Receive IApplication

Import the contract from `orionis.foundation.contracts.application`. `Application` implements it and extends the container. During `create()`, it registers its own instance with alias `x-orionis-IApplication`. Receiving the contract does not start another application.

You can inject it into a component's constructor when the container builds it, or into a method Orionis invokes through DI. An ordinary Python call to a method does not inject its parameters automatically.

```python
from orionis.foundation.contracts.application import IApplication
from orionis.http import JSONResponse


class ApplicationName:
    def __init__(self, app: IApplication) -> None:
        self.app = app

    def get(self) -> str:
        return str(self.app.config("app.name"))


class RuntimeInfoController:
    async def __call__(
        self,
        app: IApplication,
        name: ApplicationName,
    ) -> JSONResponse:
        return JSONResponse({
            "name": name.get(),
            "http_ready": app.isHttpReady,
            "production": app.isProduction(),
        })
```

The service and controller receive the same application. Use the route pattern in the [introduction](/en/application). Commands can declare the same contract in `handle()`; for providers, review the limits of their [constructors and hooks](/en/application/container/providers).

<a id="application-construction"></a>
## Application and current()

```text
Application(base_path: Path = _CWD) -> None
Application.current() -> Self | None
```

`_CWD` is the directory captured when importing the module. `bootstrap/app.py` supplies an explicit root, normally `Path(__file__).parent.parent`. The constructor resolves that root, records the initial timestamp and prepares state, locks and metadata; it does not complete configuration on its own.

The container retains one instance per class in each process. Constructing the same class again does not create an independent application or change its root. `current()` returns that class's existing instance, or `None`, without creating or booting it; it can return an instance without configuration yet. Prefer injected `IApplication` in components.

<a id="application-properties"></a>
## State and identity properties

All are read-only and accessed without parentheses.

| Property and type | Result and scope |
|---|---|
| `isCreated: bool` | `True` when `create()` finishes. Does not mean async boot methods have finished. |
| `isBooted: bool` | Historical alias for the same creation stage. |
| `areProvidersBooted: bool` | Creation finished and no eager provider pending. Does not include unresolved deferred providers. |
| `isHttpReady: bool` | Eager providers completed and ASGI/RSGI handlers published. Does not check sockets, databases or other service health. |
| `startAt: int` | Unix timestamp in nanoseconds recorded during first initialization. |
| `basePath: Path` | Absolute application root. |
| `entryPoint: str \| None` | Entry inferred from the file calling `create()`, normally `bootstrap.app:app`; `None` before recording it. Does not discover another variable name instead of `app`. |
| `routeHealthCheck: str` | Configured route; uses `/up` when absent or empty. |
| `compiled: bool` | `compile()` was enabled. **Does not indicate that startup found a valid file**. |
| `compiledPath: Path \| None` | Compilation directory, or `None` when not enabled. |
| `compiledInvalidationPathsDirs: list[Path]` | Copy of monitored directories; registration order is not guaranteed. |
| `compiledInvalidationPathsFiles: list[Path]` | Copy of monitored files; modifying it does not change the internal registry. |

Read the [lifecycle guide](/en/application/lifecycle) to distinguish creation, eager boot and runtime startup.

<a id="application-config"></a>
## config(): read and modify process values

```text
config(key: str | None = None, value: object = _SENTINEL) -> object
resetRuntimeConfig() -> bool
```

`config()` needs initialized configuration; otherwise it raises `RuntimeError`. `_SENTINEL` distinguishes an omitted second argument from `None`: do not import or pass it manually.

| Call | Effect |
|---|---|
| `app.config()` | Returns the entire runtime dictionary. This is the process's mutable reference, not a defensive copy. |
| `app.config("app.name")` | Reads dot-separated segments. A missing key or a non-dictionary intermediate segment returns `None`. |
| `app.config("reports.limit", 100)` | Writes `100` and returns it; **this is not a read with a default**. |
| `app.config("reports.limit", None)` | Writes an explicit `None`. |
| `app.resetRuntimeConfig()` | Rebuilds a mutable copy from bootstrap and returns `True`. Does not reload `.env`. |

Names are split literally at `.`; avoid empty segments. Writes create or replace intermediate dictionaries when needed. The first access thaws bootstrap: tuples become lists; sets and bytes keep their type. Sets and other unhandled objects also retain their identity: `resetRuntimeConfig()` does not undo their internal mutations.

Configuration is shared by requests handled by the same application. **Do not store user identity, request state or temporary command values in it.** Changes do not modify `.env`, `config/*.py`, the compiled file or other processes either. A constructed service may already have captured earlier options. Use [scoped services](/en/application/container/scopes-and-concurrency) for operation state.

A component can read an optional value without accidentally invoking the setter:

```python
from orionis.foundation.contracts.application import IApplication


class ReportPolicy:
    def limit(self, app: IApplication) -> int:
        value = app.config("reports.limit")
        return 100 if value is None else int(value)
```

The container must invoke `limit()` to inject `app`. If you already have the application, you can pass it explicitly. Define values through [typed configuration](/en/application/configuration), reading the environment only in `config/`.

<a id="application-path"></a>
## path() and routingPaths()

```text
path(key: str | None = None) -> Path | Mapping[str, Path] | None
routingPaths(key: str | None = None) -> list[Path] | dict | None
```

Both require initialized configuration and reject non-`str` keys with `TypeError` when not omitted. `path()` returns the frozen directory map; `path("resources_views")` returns a path, and an unknown key returns `None`. It does not create or write files.

`routingPaths()` returns a thawed copy of the file registry. Without a key it includes the contexts; for `api`, `web`, `console`, `ai` or `websocket`, it returns the corresponding `Path` list. Access health through `routeHealthCheck`, not `routingPaths("health")`. Changing the returned list does not register new routes. [Directories](/en/application/paths-and-caching) lists every key and `Directory` method.

<a id="application-runtime-flags"></a>
## Environment, debug and maintenance

```text
isProduction() -> bool
isDebug() -> bool
underMaintenance() -> bool
```

These methods require completed `create()`; otherwise they raise `RuntimeError`.

- `isProduction()` retains whether `"prod"` appears in the text of `app.env` during creation. It is neither a dynamic check nor an exact comparison with one name.
- `isDebug()` retains whether `app.debug is True` during creation. Changing runtime configuration does not recompute these flags.
- `underMaintenance()` reads `storage/framework/maintenance`, with `app.maintenance` as fallback. `down` enables it and `up` disables it; unknown text uses the fallback. The result is cached for up to 100 ms in each worker. Read or decoding errors enable maintenance; this is not a distributed lock.

Use [up/down commands](/en/console/built-in-application) to manage the marker; cross-process scope depends on sharing that file.

<a id="application-components"></a>
## Retrieve middleware, handler and scheduler

```text
getMiddleware() -> list[type[IBaseMiddleware]]
async getExceptionHandler() -> IBaseExceptionHandler
async getScheduler() -> IBaseScheduler
```

`getMiddleware()` returns global classes, not the running chain. Async getters require a created application. They import and retain the configured **class**, but each call uses `build()` to create an instance through DI; they do not guarantee reuse of the same instance or start the scheduler.

```python
from orionis.foundation.contracts.application import IApplication


class BootstrapInspector:
    async def inspect(self, app: IApplication) -> dict:
        handler = await app.getExceptionHandler()
        scheduler = await app.getScheduler()
        return {
            "middleware": [cls.__name__ for cls in app.getMiddleware()],
            "handler": type(handler).__name__,
            "scheduler": type(scheduler).__name__,
        }
```

## Configure, start and resolve

| Methods | Reference |
|---|---|
| `create()`, `boot()`, `on()`, `handleCommand()` | [Lifecycle](/en/application/lifecycle). |
| `__call__`, `__rsgi__`, `__rsgi_init__`, `__rsgi_del__` | [ASGI and RSGI](/en/application/server-entrypoints): entries used by the server. |
| `compile()` and every `with...` method | [Bootstrap options](/en/application/bootstrap). |
| `instance`, `transient`, `singleton`, `scoped`, `bound`, `make`, `build`, `invoke`, `call` | [Registration and invocation](/en/application/container/bindings-and-invocation): inherited from Container. |
| `beginScope`, `getCurrentScope` | [Scopes](/en/application/container/scopes-and-concurrency). |

<a id="foundation-core-metadata"></a>
## Native component maps

These modules describe bootstrap defaults; normally you do not need to call or modify them.

| `orionis.foundation` module | API and contents |
|---|---|
| `core_config` | `get_core_config_mapping() -> MappingProxyType` builds independent defaults for 16 sections. `CORE_CONFIG` is the compatibility export created on access; startup uses the function. |
| `core_kernels` | `get_core_kernels_mapping() -> MappingProxyType`, `CORE_KERNELS`: modules and classes of the HTTP/CLI kernels. |
| `core_providers` | `get_core_providers_mapping() -> tuple[type[IServiceProvider], ...]`, `CORE_PROVIDER_METADATA` and `CORE_PROVIDERS`: native provider references and classes. |
| `core_exception_handler` | `get_core_exception_handler_mapping() -> MappingProxyType`, `CORE_EXCEPTION_HANDLER`: default handler. |
| `core_scheduler` | `get_core_scheduler_mapping() -> MappingProxyType`, `CORE_SCHEDULER`: scheduler base class. |
| `core_paths` | `CORE_APP_PATHS`: default relative paths, listed under [Directories](/en/application/paths-and-caching). |

Read-only maps protect their outer level; do not infer deep immutability of every nested structure. A disk snapshot retains compatible metadata, not live services.

<a id="application-api-coverage"></a>
## Verifiable coverage

The [Application and Container inventory](/downloads/application-container-api-inventory.json) maps the components' own API to its guides. Configuration entities for each subsystem are linked from [configuration](/en/application/configuration), keeping their options with the component using them.
