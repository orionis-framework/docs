---
title: "Service container"
description: "Use dependency injection to share application services across HTTP handlers, commands, and jobs. Register an interface-to-implementation binding in app/providers/, then…"
editUrl: true
lastUpdated: false
---

Use dependency injection to share application services across HTTP handlers, commands, and jobs. Register an interface-to-implementation binding in `app/providers/`, then type-hint that interface in the consumer. The existing `Application` owns the container; normal application code does not create a separate `Container`.

Begin with [Registering and invoking services](/en/architecture/service-container/bindings-and-invocation), then follow the complete [application provider example](/en/architecture/service-container/providers-and-facades). Choose `transient` for a new instance per resolution, `singleton` for reusable process state, and `scoped` for request or command state. A singleton is not shared between worker processes.

## Overview

The container maps contracts or aliases to implementations and creates object graphs from type annotations. It supports prebuilt instances, transient services, process-level singletons, and context-local scoped services. `build` constructs a class, `invoke` injects a function, and `call` injects a named instance method.

Application code usually interacts through `Application`, which extends the container, while application providers register your services and optional `Facade` entry points. Deferred providers postpone importing/registering services until a declared contract is requested. HTTP and console kernels create scopes so request/command-local dependencies cannot leak into one another.

## Requirements

- Python 3.14 or newer.
- No optional dependency or external service.
- Runtime type annotations on injectable constructor/function parameters.
- An active `beginScope()` context before resolving a `scoped` binding.
- Forward references must be import-resolvable in the callable's module context.

## Module learning path

- [Registering and invoking services](/en/architecture/service-container/bindings-and-invocation)
- [Service Providers, facades, and extension](/en/architecture/service-container/providers-and-facades)
- [Scopes, isolation, and concurrency](/en/architecture/service-container/scopes-and-concurrency)

Continue with: [foundation](/en/getting-started) · [schemas](/en/validation).
