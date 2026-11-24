---
title: "Orionis foundations"
description: "Install Orionis Framework 1.9.0, run your first HTTP endpoint and find the guides for configuration, services and testing."
editUrl: true
lastUpdated: false
---

Build your application from the official skeleton, then add the features your project needs. You do not need to implement `Application`, a kernel, or a container to start developing: the generated `bootstrap/app.py` connects those components.

This manual covers **Orionis Framework 1.9.0** and requires Python 3.14 or newer. From the application root, check which framework your project runs:

```bash
uv run python -c "from orionis.metadata import VERSION; print(VERSION)"
```

## Your first development session

1. [Install and create a project](/en/getting-started/installation): prepare uv and Git, choose a stack, and create the application's environment.
2. [Start the application](/en/getting-started/quick-start): run the server from the project root and open the URL shown in the console.
3. [Configure the application](/en/application/configuration): use `.env` for deployment values and `config/` for typed settings.
4. [Add your first HTTP route](/en/http/routing), then choose [templates](/en/views) or a JSON API.
5. [Write and run a test](/en/testing/writing-and-running-tests) before adding persistence, authentication, background jobs, Realtime, or MCP.

Commands in the application guides use `uv run python -B reactor ...` from the generated project root. This selects that project's environment. The separate `uvx --from orionis-installer ...` invocation creates a new project.

## Overview

`Application` extends the dependency-injection `Container` and is the object exported from `orionis`. It is simultaneously the bootstrap coordinator, ASGI/RSGI entry point, CLI dispatcher, configuration repository, path registry, provider loader, and lifecycle owner.

Foundation also defines frozen configuration entities for every major subsystem, immutable core metadata, the `Directory` path service, runtime/lifespan enums, and startup/shutdown presentation. Most applications configure it in `bootstrap/app.py`, call `create()`, and let the HTTP server or Reactor drive runtime startup.

<a id="requirements"></a>

## Project layout

The generated project supplies the application root, bootstrap module and route files. Orionis builds its native configuration defaults and applies the frozen dataclasses it discovers under `config/`. Add your own dataclass there to [define a configuration section](/en/application/configuration#configuration-own).

A route file you register in `bootstrap/app.py` must exist. It may be empty. When you add routes, import the facade through `orionis.support.facades`, as shown in the [first controller example](/en/getting-started/quick-start).

## Module learning path

- [API reference: classes, methods, and signatures](https://api.orionis-framework.com/)
- [Application architecture and lifecycle](/en/getting-started/architecture-and-lifecycle)
- [Application lifecycle and resource ownership](/en/application/lifecycle)
- [Typed configuration and runtime values](/en/application/configuration)
- [Prepare a deployment](/en/deployment)
- [Creating and starting an application](/en/getting-started/quick-start)
- [Directories and bootstrap caching](/en/application/paths-and-caching)

See also [environment variables](/en/environment), [dependency injection](/en/application/container), [HTTP](/en/http) and [console commands](/en/console).
