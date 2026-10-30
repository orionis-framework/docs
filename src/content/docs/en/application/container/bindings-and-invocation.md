---
title: "Registering and invoking services"
description: "Container registration and resolution reference: instances, lifetimes, aliases, construction, functions and methods with dependency injection."
editUrl: true
lastUpdated: false
---

The application implements `IContainer`. Register services through `self.app` in `ServiceProvider.register()` and receive the same application as `app: IApplication` in components that require explicit resolution. Ordinary actions can request their services directly through type annotations.

## Prepare the example services

Save the following classes and functions in `app/services/catalog.py`. The examples on this page refer to that module:

```python
from abc import ABC, abstractmethod


class ICatalog(ABC):

    @abstractmethod
    def names(self) -> list[str]:
        raise NotImplementedError


class Catalog(ICatalog):

    def names(self) -> list[str]:
        return ["Notebook", "Pencil"]


class CatalogPresenter:

    def __init__(self, catalog: ICatalog) -> None:
        self._catalog = catalog

    def render(self, prefix: str = "Products") -> str:
        return f"{prefix}: {', '.join(self._catalog.names())}"


def render_catalog(catalog: ICatalog, *, prefix: str = "Products") -> str:
    return f"{prefix}: {', '.join(catalog.names())}"


async def create_catalog() -> Catalog:
    return Catalog()
```

A provider publishes the contract:

```python
from app.services.catalog import Catalog, ICatalog
from orionis.container.providers import ServiceProvider


class CatalogProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(ICatalog, Catalog, alias="catalog")
```

Register or discover the provider as described in [Providers and facades](/en/application/container/providers).

## Registration reference

These operations are synchronous and return `True` after successful registration. `abstract` is a required argument: pass `None` to use the service class as its contract.

<a id="container-instance"></a>

### `instance()` — publish an existing object

```text
instance(abstract: type[Any] | None, instance: object, *,
         alias: str | None = None, override: bool = False) -> bool
```

`instance` must be an initialized object; supplying a class raises `TypeError`. With an explicit contract, the object must satisfy `isinstance(object, contract)`.

Outside an active scope it registers an already-created singleton. Inside a scope it publishes the object only there and rejects an `alias`, because aliases are registered globally. `override=True` replaces an entry for the same contract in the corresponding destination.

```python
from app.services.catalog import Catalog, ICatalog
from orionis.foundation.contracts.application import IApplication


async def publish_for_work(app: IApplication) -> list[str]:
    async with app.beginScope():
        app.instance(ICatalog, Catalog())
        catalog = await app.make(ICatalog)
        return catalog.names()
```

This example assumes `ICatalog` has no materialized global singleton. The singleton cache is checked before the scope: publishing a local object does not replace an existing global singleton. See [precedence and scopes](/en/application/container/scopes-and-concurrency#scope-precedence).

<a id="container-transient"></a>

### `transient()` — create on every resolution

```text
transient(abstract: type[Any] | None, concrete: type[Any], *,
          alias: str | None = None, override: bool = False) -> bool
```

`concrete` must be a class. If you supply `abstract`, it must be a base class of `concrete`. Registration stores the relationship; construction happens through `make()`.

In `CatalogProvider.register()`, choose `self.app.transient(ICatalog, Catalog)` instead of `singleton`. Each resolution receives another `Catalog`; its constructor dependencies retain their own lifetimes.

<a id="container-singleton"></a>

### `singleton()` — reuse inside the container

```text
singleton(abstract: type[Any] | None, concrete: type[Any], *,
          alias: str | None = None, override: bool = False) -> bool
```

The first resolution builds and stores the object; subsequent resolutions return the same identity. Explicit constructor values only affect its initial construction. Reuse is local to the container and process, without exchanging objects between workers.

With the provider above, `await app.make(ICatalog)` and `await app.make("catalog")` retrieve the same singleton.

<a id="container-scoped"></a>

### `scoped()` — reuse within a unit of work

```text
scoped(abstract: type[Any] | None, concrete: type[Any], *,
       alias: str | None = None, override: bool = False) -> bool
```

The binding is global, but its instance is created and stored separately in each scope. Resolution requires an active `async with app.beginScope()`; otherwise it raises `RuntimeError`. HTTP requests and Reactor calls already delimit their own scopes.

```python
from orionis.container.providers import ServiceProvider


class WorkState:

    def __init__(self) -> None:
        self.visited: list[str] = []


class WorkProvider(ServiceProvider):

    def register(self) -> None:
        self.app.scoped(None, WorkState)
```

The [scope guide](/en/application/container/scopes-and-concurrency) shows how to share `WorkState` within an execution and isolate it from the next.

<a id="container-lifetime"></a>

### `Lifetime`

`orionis.container.enums.lifetimes.Lifetime` contains `TRANSIENT`, `SINGLETON`, and `SCOPED`. The methods above select the value for you. `instance()` does not add a fourth enum member: it stores an existing object globally or in the scope.

### Aliases, contracts and replacements

An alias must be a nonempty `str`. Registration strips leading and trailing whitespace; resolution uses the exact registered key. The alias points to the contract and shares its lifetime.

Duplicate contracts and aliases raise `ValueError` unless `override=True`. Incompatible contracts, invalid classes, or nonstring aliases raise `TypeError`.

Replacing a binding evicts that contract's cached singleton. It does not modify previously returned objects, clear instances in active scopes, or automatically remove previous aliases. Register services during bootstrap; avoid changing bindings while requests are being processed.

<a id="container-bound"></a>

### `bound()` — check a registration

```text
bound(key: type[Any] | str) -> bool
```

Checks the global alias and the contract's presence in the current scope, bindings, or singleton cache. It does not build the service or activate a deferred provider. Therefore, `False` does not mean `make()` will fail: a concrete class can be built automatically, and a deferred provider can register its contract during resolution.

```python
from app.services.catalog import ICatalog
from orionis.foundation.contracts.application import IApplication


async def catalog_status(app: IApplication) -> dict[str, bool]:
    return {
        "contract": app.bound(ICatalog),
        "alias": app.bound("catalog"),
    }
```

## Resolve, build and invoke

Await these four operations even when the final constructor or function is synchronous.

<a id="container-make"></a>

### `make()` — resolve a contract or alias

```text
async make(key: type[Any] | str, *args: tuple[Any, ...],
           **kwargs: dict[str, Any]) -> Any
```

Respects the binding's lifetime. Without a registration, it attempts to activate a deferred provider and, for a concrete class, build it automatically. A string identifies an alias; it does not arbitrarily import a class from its module path. An unknown alias raises `ValueError`.

`*args` and `**kwargs` are passed to the constructor when the object needs to be created; they do not reconfigure an already-cached instance.

```python
from app.services.catalog import ICatalog
from orionis.foundation.contracts.application import IApplication


async def names(app: IApplication) -> list[str]:
    catalog = await app.make(ICatalog)
    by_alias = await app.make("catalog")
    assert catalog is by_alias
    return catalog.names()
```

The result is the service object. Resolving a callable instance does not execute its `__call__`.

<a id="container-build"></a>

### `build()` — construct a concrete class

```text
async build(type_: Callable[..., Any], *args: tuple[Any, ...],
            **kwargs: dict[str, Any]) -> Any
```

Although the annotation uses `Callable`, the implementation requires a class and rejects functions or objects with `TypeError`. It constructs that class directly with recursive `__init__` injection; it does not substitute the target's contract binding or retrieve its singleton instance. Its dependencies are resolved through `make()`.

```python
from app.services.catalog import CatalogPresenter
from orionis.foundation.contracts.application import IApplication


async def present(app: IApplication) -> str:
    first = await app.build(CatalogPresenter)
    second = await app.build(CatalogPresenter)
    assert first is not second
    return first.render()
```

Reflection rejects abstract or otherwise nonconstructible classes. An exception raised by a constructor propagates to the caller.

<a id="container-invoke"></a>

### `invoke()` — execute a function

```text
async invoke(fn: Callable[..., Any], *args: tuple[Any, ...],
             **kwargs: dict[str, Any]) -> Any
```

Supports inspectable Python functions, asynchronous functions, lambdas, and bound methods. Classes and noncallable values raise `TypeError`. Reflection does not accept every object merely because it implements `__call__`; use `call(object, "__call__", ...)` in that case.

```python
from app.services.catalog import render_catalog
from orionis.foundation.contracts.application import IApplication


async def present_function(app: IApplication) -> str:
    return await app.invoke(render_catalog, prefix="Available")
```

Returns the function's result. It awaits functions declared with `async def`; a synchronous function runs directly on the current thread, without a thread pool. If a synchronous function returns a coroutine, the result remains that coroutine and must be awaited explicitly.

<a id="container-call"></a>

### `call()` — execute a method

```text
async call(instance: object, method_name: str,
           *args: object, **kwargs: object) -> Any
```

Retrieves the object's attribute, checks that it is callable, and executes it with the same injection rules as `invoke()`. A missing method raises `AttributeError`; a noncallable attribute raises `TypeError`.

```python
from app.services.catalog import CatalogPresenter
from orionis.foundation.contracts.application import IApplication


async def present_method(app: IApplication) -> str:
    presenter = await app.build(CatalogPresenter)
    return await app.call(presenter, "render", prefix="Available")
```

An invokable controller uses the same mechanism with `"__call__"`. Instance, static, and class methods retain their normal Python descriptor behavior.

## Classes, functions and factories

`transient()`, `singleton()`, and `scoped()` register classes, not factories. To create a service through a function, execute it with `invoke()` and publish its initialized result:

```python
from app.services.catalog import ICatalog, create_catalog
from orionis.container.providers import ServiceProvider


class FactoryCatalogProvider(ServiceProvider):

    def register(self) -> None:
        pass

    async def boot(self) -> None:
        catalog = await self.app.invoke(create_catalog)
        self.app.instance(ICatalog, catalog)
```

This alternative replaces the first provider; do not register both for the same contract. When run outside a scope, `instance()` publishes the object globally. Do not pass an unawaited coroutine to `instance()`: ordinary container resolution does not turn that object into the factory's result.

For a synchronous factory, `await app.invoke(factory)` returns its immediate result. For an `async def` factory, it awaits the function and returns the final result. Resource creation and cleanup remain the responsibility of the service or [application hooks](/en/application).

<a id="container-arguments"></a>

## How parameters are resolved

The container walks the parameters in declaration order and applies these rules:

1. Preserve an explicit positional value or matching keyword, including `None`.
2. For a missing parameter, activate the corresponding deferred provider.
3. For a schema parameter, validate the active HTTP `Request` data.
4. Resolve a binding using the parameter's recognized type.
5. Use its default value or build a concrete class automatically; raise an error if resolution is impossible.

Keyword-only parameters participate in injection. Remaining `*args` and `**kwargs` values are forwarded to the callable; variadic parameters do not generate dependencies themselves.

```python
from app.services.catalog import Catalog, CatalogPresenter
from orionis.foundation.contracts.application import IApplication


async def explicit_values(app: IApplication) -> str:
    custom = Catalog()
    presenter = await app.build(CatalogPresenter, catalog=custom)
    return await app.call(presenter, "render", prefix="Selected")
```

The explicit object takes precedence over a binding and skips resolution of that parameter, including activation of its deferred provider. Annotations do not automatically convert or validate explicitly supplied values.

### Types, defaults and forward references

A required parameter such as `limit: int` needs an explicit value or a suitable registration; the container does not invent an integer. Use `limit: int = 20` for an ordinary default.

When a default exists, metadata uses that value's type. Consequently, `service: ICatalog | None = None` is not a request to inject `ICatalog`: it normally remains `None`. For mandatory injection, declare `service: ICatalog` without a default. A registration for the default's recognized type can take precedence over its default value.

Import the necessary classes at runtime. Resolvable module-level forward references are recognized, and constructors also handle references to their own class. An unavailable name raises `TypeError` during injection; importing only under `TYPE_CHECKING` does not provide the class at runtime.

### HTTP payloads and other entry points

In the general container, a missing schema parameter reads `Request.data()` and performs asynchronous validation. It needs the `Request` published by the HTTP flow in the active scope. An explicitly supplied schema skips that read.

MCP, Realtime, and other components can prepare their own arguments before invoking the container. Do not assume an HTTP request exists in a command or worker. See [Schemas and validation](/en/validation), [Controllers](/en/http/controllers), [MCP](/en/mcp), and [Console](/en/console) for their specific rules.

<a id="container-errors"></a>

## Resolution errors

| Situation | Result |
|---|---|
| Duplicate contract or alias without `override=True`. | `ValueError`. |
| Class or object incompatible with its contract; invalid target. | `TypeError` or reflection rejection for nonconstructible classes. |
| Unknown alias. | `ValueError`. |
| Required parameter that cannot be resolved. | `TypeError`. |
| Scoped binding without a scope, or publication into a closed scope. | `RuntimeError`. |
| Missing method or noncallable attribute. | `AttributeError` or `TypeError`, respectively. |
| Circular dependencies. | `CircularDependencyException`. |
| Constructor, function, validation, or provider failure. | The corresponding exception propagates. |

Import `CircularDependencyException` from `orionis.container.exceptions`. The container detects construction cycles in the task's context and restores that state even when resolution fails. It does not itself convert these exceptions into HTTP responses or CLI exit codes; the invoking flow handles that.

<a id="container-binding"></a>

## Binding metadata

`orionis.container.entities.binding.Binding` is an immutable entity with keyword-only arguments:

```text
Binding(*, contract: type | None = None, concrete: type | None = None,
        instance: object | None = None, lifetime: Lifetime = Lifetime.TRANSIENT,
        alias: str | None = None)
```

Describes the contract, implementation, optional instance field, lifetime, and alias. It validates that `lifetime` is a `Lifetime` member, otherwise raising `TypeError`. Registration also checks class and object compatibility. Creating a `Binding` directly does not register it in the application; use the public registration methods.

<a id="container-invocation-plan"></a>

## Invocation plans

Plans avoid repeated signature analysis. They are in-memory metadata and do not store controllers or their dependencies. A warmed plan still checks current bindings during resolution.

The utilities in `orionis.container.entities.invocation` can help when integrating a new dispatcher:

| Utility | Signature and result |
|---|---|
| `InvocationPlan` | `InvocationPlan(arguments: tuple[Argument, ...], is_async: bool)`: immutable dataclass containing ordered parameters and coroutine metadata. |
| `callable_plan()` | `callable_plan(target: Callable) -> InvocationPlan`: analyzes a function or method without retaining a bound receiver. |
| `constructor_plan()` | `constructor_plan(target: type, constructor: object) -> InvocationPlan`: analyzes and validates the class and constructor. |
| `warm_controller_plan()` | `warm_controller_plan(target: type, method_name: str) -> None`: prepares ordinary constructor and action descriptors without creating a controller. |

Since 1.1.0, `InvocationPlan.has_keyword_only` is a computed read-only field, not a constructor parameter. The container uses this cached shape for positional calls while continuing to resolve current transient, singleton and scoped bindings. Callable or constructor replacements select new metadata. Use [`@threaded`](/en/utilities/helpers/concurrency) to opt a blocking synchronous callable into worker execution; signature caching alone does not move work off the event loop.

Plan caches are limited to 1,024 entries per cached function. Custom descriptors remain lazy. These utilities propagate signature or reflection errors and do not execute the action. Use `build()`, `invoke()`, and `call()` to construct or invoke application services.

Continue with [Providers and facades](/en/application/container/providers) and [Scopes, isolation and concurrency](/en/application/container/scopes-and-concurrency).
