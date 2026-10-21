---
title: "Registering and invoking services"
description: "The first examples are standalone programs for learning service lifetimes. In a generated application, register the same bindings in a ServiceProvider.register() method and let…"
editUrl: true
lastUpdated: false
---

The first examples are standalone programs for learning service lifetimes. In a generated application, register the same bindings in a `ServiceProvider.register()` method and let controllers or commands request dependencies through type annotations. The [provider guide](/en/architecture/service-container/providers-and-facades) shows where to save and register that code.

## Quick start

Register a contract and let constructor annotations build the graph:

```python
import asyncio
from abc import ABC, abstractmethod

from orionis.container.container import Container


class Greeter(ABC):
    @abstractmethod
    def greet(self, name: str) -> str:
        raise NotImplementedError


class EnglishGreeter(Greeter):
    def greet(self, name: str) -> str:
        return f"Hello, {name}!"


class WelcomeService:
    def __init__(self, greeter: Greeter) -> None:
        self.greeter = greeter


class DocsContainer(Container):
    pass


async def main() -> None:
    container = DocsContainer()
    container.singleton(Greeter, EnglishGreeter)
    service = await container.build(WelcomeService)
    print(service.greeter.greet("Orionis"))  # Hello, Orionis!


asyncio.run(main())
```

The unbound `WelcomeService` is auto-built; its annotated `Greeter` dependency resolves through the singleton binding.

## Injection in an Orionis application

The existing application is also the container. In application code, use the `IApplication` that Orionis already resolves for the current component, retaining its provider bindings.

Save this example in `app/services/di_examples.py`. `demo()` receives that application; it does not create or start another one:

```python
from orionis.foundation.contracts.application import IApplication


class TextFormatter:

    __slots__ = ()

    def format(self, text: str) -> str:
        return text.strip()


class MessagePresenter:

    __slots__ = ("_formatter",)

    def __init__(self, formatter: TextFormatter) -> None:
        self._formatter = formatter

    def from_constructor(self, text: str) -> str:
        return self._formatter.format(text)

    def from_method(self, text: str, formatter: TextFormatter) -> str:
        return formatter.format(text)


def format_message(text: str, formatter: TextFormatter) -> str:
    return formatter.format(text)


async def demo(app: IApplication) -> dict[str, str]:
    presenter = await app.build(MessagePresenter)
    return {
        "constructor": presenter.from_constructor("  Orionis  "),
        "method": await app.call(presenter, "from_method", text="  Orionis  "),
        "function": await app.invoke(format_message, text="  Orionis  "),
    }
```

All three entries return `"Orionis"`. `build()` constructs `MessagePresenter` and injects `TextFormatter` into its constructor. `call()` accepts an instance and a method name; `invoke()` accepts a function. The latter two retain the `text` you supply and resolve the missing `formatter` parameter.

You can execute `await demo(app)` from a component that already receives `app: IApplication`, such as a command. These concrete classes need no registration: they can be automatically constructed. An abstract contract needs a binding to an implementation; register those bindings in `ServiceProvider.register()` with `self.app.transient(...)`, `singleton(...)`, or `scoped(...)` according to the required lifetime. See [providers and facades](/en/architecture/service-container/providers-and-facades).

An annotation describes what to resolve; **calling through the container or a framework entry point activates injection**. A direct Python call to `presenter.from_method(...)` or `format_message(...)` requires you to supply `formatter`. You can call `from_constructor()` directly because its object already received that dependency during `build()`.

Use constructor injection when several actions need a service, and method injection when a dependency belongs to one action. Service identity depends on its registration: two resolutions of an unbound concrete class need not return the same object. Do not make that coincidence a requirement; choose a `singleton` or `scoped` binding when the service should be shared.

### Where automatic injection applies

These are the entry points used by Orionis execution flows. Each chapter includes examples adapted to its API:

| Entry point | Constructor | Method or function |
|---|---|---|
| [HTTP controller](/en/http/request-lifecycle) | Yes. | Action resolved by the router; route functions are supported too. |
| [Streaming and SSE](/en/http/streaming-and-sse) | Yes, on the HTTP controller. | The action receives services. The stream iterator or generator is consumed directly; its own parameters are not injected. |
| [WebSocket](/en/http/websockets) | Yes, on the controller. | Route action or function; includes route parameter values. |
| [Realtime hub](/en/asynchronous/realtime/hubs-and-methods) | Yes, when each hub is built. | `@remote` methods. The `onConnect` and `onDisconnect` hooks have fixed arguments and do not add method injection. |
| [MCP](/en/protocols/mcp/servers-and-tools) | Yes, on the primitive definition. | `handle()` receives services and the data/context declared for that primitive. |
| [CLI command](/en/console/commands-and-arguments) | Yes. | `handle()` receives services. With `BaseCommand`, read CLI arguments through `getArgument()`. |
| [Scheduler](/en/console/task-scheduling) | Yes. | `tasks(schedule: ISchedule, ...)` receives the schedule and can request additional services. |
| [Queue job](/en/asynchronous/queues/jobs-and-dispatch) | The constructor represents the serialized job data; it is not an injection entry point. | The worker injects services into `handle()`. |
| [HTTP middleware](/en/http/middleware-and-security) | Yes; stack instances may be reused across requests. | `handle(request, call_next)` is called directly, without injection of additional parameters. |
| [WebSocket middleware](/en/http/websockets#connection-middleware-and-groups) | Yes; route middleware is constructed for the connection. | `handle(socket, call_next)` has fixed arguments; it does not receive additional method injection. |
| [BackgroundTask](/en/asynchronous/background-tasks/response-tasks) | Supply values when creating the task. | The callback runs with the arguments you supplied; its annotations do not enable automatic injection. |

Objects belonging to the current request, connection, or execution are only available when their flow has registered them in the active scope. Do not assume an HTTP `Request` exists in a command, job, or Realtime connection. Do not retain these objects in global services or HTTP middleware reused across requests; obtain context at the entry point that provides it. [Scopes and concurrency](/en/architecture/service-container/scopes-and-concurrency) explains isolation.

## Core concepts

### Contract, concrete, alias, and binding

A binding relates a contract to a compatible concrete class and a `Lifetime`. The contract defaults to the concrete class when `abstract=None`. An optional non-empty alias resolves to that same contract. Registration refuses duplicates unless `override=True`.

### Service lifetimes

- `TRANSIENT`: construct on every resolution.
- `SINGLETON`: construct once per container instance and reuse globally.
- `SCOPED`: construct once in the active scope and discard when the scope closes.
- `instance`: publish an already initialized object globally, or into the active scope when called inside one.

### Automatic resolution and invocation

The container caches reflection plans, combines supplied positional/keyword values with annotated dependencies/defaults, recursively builds class parameters, and awaits returned awaitables. Orionis schema and HTTP request parameters receive specialized handling during callable injection.

### Scope propagation

`ScopeManager` places itself in a `ContextVar`. Child asyncio tasks inherit the context reference, but the manager marks itself closed and clears instances on exit, preventing inherited tasks from resolving stale scoped services afterward.

### Facades

A `Facade` class maps attribute access to a container accessor. Providers may `pin` a resolved singleton for direct calls. `ScopedFacade` never uses the global pinned cache; it reads the service already present in the active scope.

## Examples

### Compare transient and singleton lifetimes

```python
import asyncio

from orionis.container.container import Container


class Service:
    pass


class LifetimeContainer(Container):
    pass


async def main() -> None:
    container = LifetimeContainer()
    container.transient(None, Service)
    first = await container.make(Service)
    second = await container.make(Service)
    print(first is second)  # False

    container.singleton(None, Service, override=True)
    first = await container.make(Service)
    second = await container.make(Service)
    print(first is second)  # True


asyncio.run(main())
```

### Inject a function parameter

```python
import asyncio

from orionis.container.container import Container


class Formatter:
    def format(self, value: int) -> str:
        return f"value={value}"


def render(value: int, formatter: Formatter) -> str:
    return formatter.format(value)


class InvokeContainer(Container):
    pass


async def main() -> None:
    container = InvokeContainer()
    container.singleton(None, Formatter)
    print(await container.invoke(render, 7))  # value=7


asyncio.run(main())
```

### Reject a circular dependency

```python
import asyncio

from orionis.container.container import Container
from orionis.container.exceptions import CircularDependencyException


class First:
    def __init__(self, second: "Second") -> None:
        self.second = second


class Second:
    def __init__(self, first: First) -> None:
        self.first = first


# Resolve the one forward reference after both classes exist.
First.__init__.__annotations__["second"] = Second


class CycleContainer(Container):
    pass


async def main() -> None:
    try:
        await CycleContainer().build(First)
    except CircularDependencyException:
        print("cycle detected")


asyncio.run(main())
```

## Reference and next steps

[container.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/container/container.py) · [binding.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/container/entities/binding.py) · [invocation.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/container/entities/invocation.py)

[Return to the module index](/en/architecture/service-container).
