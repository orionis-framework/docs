---
title: "Application lifecycle and resource ownership"
description: "The skeleton already creates and exports the application. For a normal web request, the server starts its providers and HTTP kernel, the router selects your handler, and…"
editUrl: true
lastUpdated: false
---

The skeleton already creates and exports the application. For a normal web request, the server starts its providers and HTTP kernel, the router selects your handler, and request-scoped services are available until the request finishes. Reactor performs the equivalent setup for each command. Use this page when adding startup resources, providers, or a process that runs without an HTTP server.

Register startup configuration and callbacks in `bootstrap/app.py` **before its existing `app.create()` call**. Do not import the already-created instance and then try to register callbacks.

## Core concepts

### Bootstrap versus runtime state

Before `create()`, fluent `with...` methods build mutable bootstrap metadata. Creation loads configuration and providers, freezes the bootstrap snapshot, registers the application, and exposes a separate mutable runtime-config copy. `config(key, value)` changes only runtime config; `resetRuntimeConfig()` restores it from the frozen snapshot.

### Creation and readiness stages

`create()` completes configuration and provider registration. `boot()` also awaits eager provider boot methods for headless use, but intentionally does not run HTTP/CLI hooks or kernels. `isCreated`/`isBooted`, `areProvidersBooted`, and `isHttpReady` distinguish these stages.

### Runtime ownership

ASGI `http`, `websocket`, and `lifespan` scopes dispatch through `Application.__call__`; RSGI uses the protocol hooks. `handleCommand()` owns CLI startup, command execution, and guaranteed shutdown. HTTP startup publishes both ASGI and RSGI handlers before readiness is reported.

## Common workflows

### Bootstrap a web application

Construct `Application`, optionally enable compilation, register lifecycle callbacks, routing, scheduler, exception handler, providers, and middleware, then call `create()`. Export that instance from `bootstrap.app`; the server invokes it through ASGI or RSGI.

### Run headless services

Use `await app.boot()` when a worker needs registered and fully booted eager providers without starting a kernel. Concurrent calls share an async lock; a failed provider remains pending so a later call can retry.

### Change request-time configuration

Read with dot notation (`app.config("http.cors.allowed_origins")`) and set with a second argument. Missing or unreachable keys return `None`; writes create intermediate dictionaries. Reset when a test or worker must discard runtime overrides.

### Enter maintenance mode

The configured `app.maintenance` is the fallback. The shared `storage/framework/maintenance` marker overrides it with `down` or `up`; each worker refreshes the marker at most every 100 ms and fails closed on read/decoding errors.

## Integration with Orionis

Foundation loads 20 core providers in deterministic order, auto-discovers concrete providers under `app/providers`, registers eager providers, and publishes deferred-provider metadata before eager registration. Synchronous provider `boot` runs during creation; async boot runs during `boot()` or a runtime startup.

It resolves the CLI and HTTP kernels from metadata, validates route-file facade imports, injects the configured scheduler/exception handler, and exposes itself as `IApplication` with alias `x-orionis-IApplication`. All service modules ultimately consume its config, container, paths, scopes, or lifecycle.

## Examples

### Register lifecycle callbacks

This is a fragment for `bootstrap/app.py`; `app` is the instance already constructed there. Replace the callback bodies with the actual opening and closing of resources you own.

```python
from orionis.foundation.enums import Lifespan, Runtime


async def open_resources() -> None:
    pass


async def close_resources() -> None:
    pass


app.on(Lifespan.STARTUP, open_resources, runtime=Runtime.HTTP)
app.on(Lifespan.SHUTDOWN, close_resources, runtime=Runtime.HTTP)
```

## Choose the correct stage

| Operation | What it prepares | What to expect afterward |
|---|---|---|
| `Application(root)` | Container identity and root | Configuration cannot yet be read with `config()`. |
| `app.create()` | Configuration and provider registration | `isCreated` and its historical alias `isBooted` are true. |
| `await app.boot()` | Also completes eager provider boot | `areProvidersBooted` is true; no hooks or kernels are started. |
| Server HTTP startup | HTTP hooks and kernel | `isHttpReady` means handlers are published, not that sockets or external dependencies are healthy. |
| `await app.handleCommand(args)` | CLI kernel and hooks | Runs shutdown in `finally` after entering kernel execution. |

Global and runtime hooks are stored in sets. Do not rely on registration order to initialize dependent resources: put that sequence into one callback that performs both steps. A deferred provider registers and boots when one of its services is resolved; `areProvidersBooted` describes eager providers only.

## Resources in a headless process

Save this as a standalone program. The provider registers a dependency and its `boot` performs initialization requiring an event loop. The temporary application does not discover checkout providers. Close your own resources afterward: `boot()` alone does not run a kernel's shutdown sequence.

```python
import asyncio
from pathlib import Path
from tempfile import TemporaryDirectory
from orionis import Application
from orionis.environment.core.dot_env import DotEnv
from orionis.container.providers import ServiceProvider

class Catalog:
    def __init__(self) -> None:
        self.ready = False

class CatalogProvider(ServiceProvider):
    def register(self) -> None:
        self.app.singleton(None, Catalog)

    async def boot(self) -> None:
        catalog = await self.app.make(Catalog)
        catalog.ready = True

async def main() -> None:
    with TemporaryDirectory() as directory:
        DotEnv(str(Path(directory) / ".env"))
        app = Application(Path(directory))
        app.withConfigApp(key=b"x" * 32, debug=False, env="testing")
        app.withProviders(CatalogProvider)
        app.create()
        assert app.isCreated
        await app.boot()
        assert app.areProvidersBooted
        assert not app.isHttpReady
        assert (await app.make(Catalog)).ready

asyncio.run(main())
```

## Reference and next steps

[application.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/application.py) · [lifespan.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/enums/lifespan.py) · [runtimes.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/enums/runtimes.py)

[Return to the module index](/en/getting-started).
