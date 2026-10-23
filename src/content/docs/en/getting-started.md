---
title: "Orionis foundations"
description: "Build your application from the official skeleton, then add the features your project needs. You do not need to implement Application, a kernel, or a container to start…"
editUrl: true
lastUpdated: false
---

Build your application from the official skeleton, then add the features your project needs. You do not need to implement `Application`, a kernel, or a container to start developing: the generated `bootstrap/app.py` connects those components.

## Your first development session

1. [Install and create a project](/en/getting-started/installation): prepare uv and Git, choose a stack, and create the application's environment.
2. [Start the application](/en/getting-started/getting-started): run the server from the project root and open the URL shown in the console.
3. [Configure the application](/en/getting-started/configuration): use `.env` for deployment values and `config/` for typed settings.
4. [Add your first HTTP route](/en/http/routing), then choose [templates](/en/services/views) or a JSON API.
5. [Write and run a test](/en/testing/writing-and-running-tests) before adding persistence, authentication, background jobs, Realtime, or MCP.

Commands in the application guides use `uv run python -B reactor ...` from the generated project root. This selects that project's environment. The separate `uvx --from orionis-installer ...` invocation creates a new project.

## Overview

`Application` extends the dependency-injection `Container` and is the object exported from `orionis`. It is simultaneously the bootstrap coordinator, ASGI/RSGI entry point, CLI dispatcher, configuration repository, path registry, provider loader, and lifecycle owner.

Foundation also defines frozen configuration entities for every major subsystem, immutable core metadata, the `Directory` path service, runtime/lifespan enums, and startup/shutdown presentation. Most applications configure it in `bootstrap/app.py`, call `create()`, and let the HTTP server or Reactor drive runtime startup.

## Requirements

- Python 3.14 or newer; construction rejects older interpreters.
- An application root represented by `str` or `pathlib.Path`.
- Valid frozen dataclass configuration modules under the configured `config` path.
- Route files that exist and import their required facade when registered.
- One event loop per application worker; mutable runtime state is not designed for cross-loop or cross-thread sharing.

## Module learning path

- [Application architecture and lifecycle](/en/getting-started/architecture-and-lifecycle)
- [Application lifecycle and resource ownership](/en/getting-started/application-lifecycle)
- [Typed configuration and runtime values](/en/getting-started/configuration)
- [Prepare a deployment](/en/getting-started/deployment-and-reference)
- [Creating and starting an application](/en/getting-started/getting-started)
- [Directories and bootstrap caching](/en/getting-started/paths-and-caching)

Continue with: [environment](/en/architecture/environment) · [container](/en/architecture/service-container) · [http](/en/http) · [console](/en/console).


- [Installation and your first project](/en/getting-started/installation)

