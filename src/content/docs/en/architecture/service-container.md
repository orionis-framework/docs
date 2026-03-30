---
title: Service Container
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Introduction

The **Service Container** is the core of Orionis Framework's architecture. It implements an **Inversion of Control** (IoC) system that centralizes the registration, resolution, and lifecycle management of all application dependencies.

Instead of manually instantiating classes or explicitly propagating dependencies through each layer, the container automatically resolves them from type annotations declared in constructors and methods. This decouples components from one another and facilitates maintenance, extensibility, and testing.

The container is a **thread-safe singleton**: a single shared instance exists throughout the entire process lifetime, regardless of whether the context is an HTTP request, a CLI command, or a scheduled task. The implementation uses a **double-checked locking** pattern with `threading.RLock` to ensure safety in concurrent environments.

---

## Core Concepts

### Inversion of Control (IoC)

Inversion of Control is the principle by which the responsibility for building and wiring objects is transferred from business code to a centralized component: the container. The developer declares *what* is needed; the container decides *how* to create it and *when* to deliver it.

### Dependency Injection (DI)

Dependency Injection is the concrete mechanism the container uses to satisfy each class's requirements. When a class declares typed parameters in its constructor or a method, the container inspects those types via reflection, locates the registered bindings, and delivers the correct instances without developer intervention.

The container supports injection in both positional and keyword-only arguments, and can transparently invoke both synchronous functions and `async def` coroutines.

### Contract and Implementation

The recommended pattern in Orionis Framework is to register services by binding a **contract** (interface or abstract class) to an **implementation** (concrete class). This separation provides three direct advantages:

- It allows swapping implementations without modifying the consuming code.
- It simplifies the creation of test doubles (*mocks*) for unit testing.
- It naturally applies the Dependency Inversion Principle (DIP).

```python
# Contract (app/contracts/email.py)
from abc import ABC, abstractmethod

class IEmailService(ABC):

    @abstractmethod
    def configure(self, subject: str, body: str, to: str) -> None: ...

    @abstractmethod
    def send(self) -> bool: ...


# Implementation (app/services/email.py)
from app.contracts.email import IEmailService

class EmailService(IEmailService):

    def configure(self, subject: str, body: str, to: str) -> None:
        self._subject = subject
        self._body    = body
        self._to      = to

    def send(self) -> bool:
        # actual SMTP sending logic
        return True
```

> If the implementation does not fully satisfy the contract (i.e., `concrete` is not a subclass of `abstract`), the container will raise a `TypeError` during registration, before the application processes any request.

---

## Lifecycles

The container offers three lifecycles, defined in the `Lifetime` enum (`orionis.container.enums.lifetimes`). Choosing the correct lifecycle is one of the most important design decisions when registering a service.

```python
from orionis.container.enums.lifetimes import Lifetime

# Lifetime.SINGLETON — one instance for the entire process
# Lifetime.SCOPED    — one instance per active scope
# Lifetime.TRANSIENT — a new instance per resolution
```

### Singleton

A single instance is created the first time the service is resolved and stored in an internal container cache. It is reused throughout the entire process lifetime: across HTTP requests, CLI commands, and scheduled tasks.

**When to use:** configuration services, database clients, logging services, in-memory caches, or any resource whose initialization is expensive and whose state can be safely shared.

### Scoped

A new instance is created at the beginning of each **active scope** and reused within that scope. In an HTTP context, the framework opens a scope per request; in CLI, per command execution. When the scope ends, scoped instances are automatically discarded.

If a scoped service is resolved without an active scope, the container raises `RuntimeError` with the message `"No active scope for scoped service. Use 'beginScope()' to create a scope."`.

**When to use:** services that need to maintain state bound to a single request, such as the current user's authentication context, a transactional Unit of Work, or a per-request stateful repository.

### Transient

Each time the service is requested, the container creates a new independent instance. No reference is stored or shared between resolutions.

**When to use:** lightweight stateless objects, calculation or transformation helpers, builders, or any component that should not be shared across calls.

---

## Service Registration

Service registration can be performed directly on the application instance in `bootstrap/app.py`, or within a `ServiceProvider` to keep code organized by module (recommended).

### Common Signature

The `singleton`, `scoped`, and `transient` methods share the same signature:

```python
def method(
    abstract: type | None,
    concrete: type,
    *,
    alias: str | None = None,
    override: bool = False,
) -> bool
```

| Parameter  | Type           | Description |
|------------|----------------|-------------|
| `abstract` | `type \| None` | Contract that identifies the service. If `None`, `concrete` itself is used as the registration key. |
| `concrete` | `type`         | Concrete class that implements the contract. Must be a class (`inspect.isclass`). |
| `alias`    | `str \| None`  | Alternative string name for resolving the service. Must be passed as a keyword-only argument. |
| `override` | `bool`         | If `True`, allows overwriting an existing binding. Defaults to `False`. |

All methods return `True` if the binding was registered successfully. If any constraint is violated, they raise the corresponding exception:

- `TypeError` — if `concrete` is not a class, or does not implement `abstract`.
- `ValueError` — if the alias is empty, or if the contract/alias is already registered and `override` is `False`.

### `singleton`

Registers a service with the Singleton lifecycle.

```python
app.singleton(IEmailService, EmailService)

# With string alias
app.singleton(IEmailService, EmailService, alias="mailer")
```

### `scoped`

Registers a service with the Scoped lifecycle.

```python
app.scoped(IAuthContext, AuthContext)

# With alias
app.scoped(IAuthContext, AuthContext, alias="auth")
```

### `transient`

Registers a service with the Transient lifecycle.

```python
app.transient(IReportBuilder, PdfReportBuilder)

# With alias
app.transient(IReportBuilder, PdfReportBuilder, alias="report.pdf")
```

### `instance`

Registers an already-constructed object as an effective singleton. Unlike `singleton`, the container does not build the class: it simply stores and returns the provided reference. Useful when you need to pre-initialize a service with specific parameters before the application fully starts up.

```python
mailer = EmailService()

app.instance(IEmailService, mailer)
app.instance(IEmailService, mailer, alias="mailer")
```

The `instance` method signature receives an object instead of a concrete type:

```python
def instance(
    abstract: type | None,
    instance: object,
    *,
    alias: str | None = None,
    override: bool = False,
) -> bool
```

If `abstract` is `None`, the container uses `type(instance)` as the registration key. If the value passed is a class instead of an instance, a `TypeError` is raised (`"instance() expects an initialized object, not a class."`).

#### Behavior Within a Scope

When `instance` is called within an active scope, the instance is registered in the local scope and **not** globally. In this context:

- The instance is bound to the scope's lifecycle and is discarded when the scope closes.
- The `alias` parameter is **not allowed** and raises `ValueError` (`"Alias registration is only allowed globally."`) if provided.
- The `override` validation applies against the local scope, not against global bindings.

---

## Binding Verification

### `bound`

Checks whether a contract or alias is registered in the container or in the current active scope.

```python
# Check by contract type
is_registered: bool = app.bound(IEmailService)

# Check by string alias
is_registered: bool = app.bound("mailer")
```

The method evaluates the following sources in order:

1. If `key` is a string, it resolves the alias to the corresponding abstract type. If the alias does not exist, it returns `False`.
2. Searches in the **active scope** (if one exists).
3. Searches in **global bindings** and in the **singleton cache**.

Returns `True` if the service is found in any of these sources. Returns `False` otherwise.

---

## Service Resolution

The container exposes several resolution mechanisms suited to different scenarios. The preferred approach is always **automatic injection via constructor**; explicit methods are intended for infrastructure code or specific situations.

### Constructor Injection

The primary and recommended mechanism. When the container builds a class, it inspects its `__init__` via reflection (`ReflectionConcrete`) and injects each typed parameter that matches a registered binding. Parameters without a type, without a registered binding, and without a default value cause a `TypeError`.

```python
class UserController(BaseController):

    def __init__(
        self,
        email: IEmailService,
        logger: ILoggerService,
    ) -> None:
        self._email  = email
        self._logger = logger

    async def register(self, user_email: str) -> bool:
        self._email.configure("Welcome", "Thanks for signing up.", user_email)
        result = self._email.send()
        self._logger.info(f"Registration completed for {user_email}")
        return result
```

The container resolves `IEmailService` and `ILoggerService` automatically when building `UserController`. Built-in types (`str`, `int`, etc.) and types from the `typing` module are **not** auto-resolved: they must have a default value or be provided explicitly.

### Method Parameter Injection

Dependencies can also be declared in method parameters. The container injects them when the method is invoked through `call` or `invoke`. Parameters that do not correspond to registered services must be passed explicitly by the caller.

```python
class ReportController(BaseController):

    async def generate(
        self,
        builder: IReportBuilder,   # resolved by the container
        period: str,               # passed explicitly
    ) -> bytes:
        return await builder.build(period)
```

### `make`

Resolves and returns the instance of a service from a contract type or a string alias. It is an asynchronous method (`async`) because it may trigger the loading of deferred providers.

```python
from orionis.support.facades.application import Application

# By contract type
email: IEmailService = await Application.make(IEmailService)

# By string alias
email: IEmailService = await Application.make("mailer")
```

It can also be called directly on the application instance:

```python
from bootstrap.app import app

email: IEmailService = await app.make(IEmailService)
```

**Internal resolution order:**

1. If the service is not registered, attempts to load an associated deferred provider.
2. If after step 1 the service is still not registered:
   - If `key` is a **class type**, it is built automatically with dependency injection (equivalent to `build`).
   - If `key` is a **string alias**, raises `ValueError` (`"Service '{key}' is not registered."`).
3. If the service exists in the **active scope**, returns the scope instance.
4. If the service exists in the **singleton cache**, returns the cached instance.
5. Otherwise, resolves the binding according to its lifecycle.

### `build`

Builds an instance of any class with automatic dependency injection, without requiring the class to be registered in the container. Before instantiating, it attempts to load deferred providers associated with the type.

```python
controller: UserController = await app.build(UserController)
```

`build` always creates a new instance. If the class is registered as a singleton or scoped, that binding is ignored: `build` directly constructs the concrete class. If the argument is not a class, it raises `TypeError` (`"build() expects a class type to instantiate."`).

### `invoke`

Executes a function (not an instance method or a class) injecting its typed parameters automatically. Parameters without a binding must be provided as positional or keyword arguments. Supports both synchronous functions and `async def` coroutines.

```python
async def notify(logger: ILoggerService, message: str) -> None:
    logger.info(message)

await app.invoke(notify, message="Process completed.")
```

If a class or type is passed as the argument, the method raises `TypeError` (`"invoke() expects a non-class callable as the first argument."`).

### `call`

Invokes a method on an existing instance with automatic dependency injection for its parameters. The first argument is the instance; the second is the method name as a string.

```python
controller = UserController.__new__(UserController)

await app.call(controller, "register", user_email="user@domain.com")
```

| Exception         | Condition |
|-------------------|-----------|
| `AttributeError`  | The method does not exist on the instance. |
| `TypeError`        | The attribute exists but is not callable. |

---

## Scopes

Scopes are the mechanism that allows Scoped services to maintain state within a bounded context — typically an HTTP request or a CLI command execution — without sharing it with other concurrent contexts.

### Internal Architecture

The container manages scopes through two classes:

- **`ScopeManager`** (`orionis.container.context.manager`): an asynchronous context manager that maintains a dictionary of instances per scope. Supports storage of coroutines and `asyncio.Task`, resolving them automatically via `await` on first read.
- **`ScopedContext`** (`orionis.container.context.scope`): stores the active scope using `contextvars.ContextVar`, which ensures isolation between concurrent requests without explicit locks.

### Automatic Management

Under normal conditions, the framework manages scopes transparently:

- **HTTP:** one scope per incoming request, opened before dispatch and closed after the response.
- **CLI:** one scope per command execution.

### Manual Management with `beginScope`

In advanced scenarios — background tasks, custom workers, integration tests — you can manage scopes manually:

```python
async with app.beginScope():
    # An active scope exists within this block.
    # Scoped services receive an instance shared within the scope.
    auth: IAuthContext = await app.make(IAuthContext)

    # When exiting the block, the scope is closed and
    # scoped instances are automatically discarded.
```

`beginScope()` returns a `ScopeManager` usable as an asynchronous context manager (`async with`). Upon exiting the block, the scope invokes `clear()` on its instances and restores the `ContextVar` to its previous state via a token.

### Active Scope Inspection

```python
current_scope = app.getCurrentScope()
# Returns the active ScopeManager, or None if no scope is open.
```

---

## Circular Dependency Detection

The container detects circular dependencies at resolution time. It maintains an internal set (`__resolution_cache`) with the keys of the types currently being resolved in the chain. If during the construction of a service the same type is detected as already being resolved, the container raises `CircularDependencyException`:

```
orionis.container.exceptions.CircularDependencyException:
Circular dependency detected while resolving argument 'app.services.foo.FooService'.
```

Detection uses the full module path (`module.ClassName`) as the tracking key, and the service is removed from the set upon completion of its resolution (in a `finally` block), regardless of whether the construction was successful.

Circular dependencies are a clear indicator of a design problem. Common solutions include:

- Splitting responsibility into less coupled services.
- Introducing a level of indirection through a mediator service or an event.
- Converting one of the dependencies into a method parameter instead of a constructor dependency.

---

## Service Providers

A `ServiceProvider` is the recommended organizational unit for grouping related registrations. The base `ServiceProvider` class exposes `self.app` (the container instance) and requires implementing two methods differentiated by their execution phase:

```python
from orionis.foundation.providers.service_provider import ServiceProvider

class MailServiceProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(IEmailService, EmailService)
        self.app.singleton(IMailQueue, RedisMailQueue)

    async def boot(self) -> None:
        # Asynchronous initialization logic that requires
        # all services to already be registered.
        mailer: IEmailService = await self.app.make(IEmailService)
        await mailer.verify_connection()
```

| Method     | Sync/Async  | Purpose |
|------------|-------------|---------|
| <span style="white-space: nowrap;">`register`</span> | Synchronous | Register bindings in the container. During this phase, other services should not be resolved because the provider processing order is not guaranteed. |
| <span style="white-space: nowrap;">`boot`</span>     | Asynchronous | Execute initialization logic. During this phase, all providers have completed `register` and services are available for resolution. |

### Deferred Providers

Deferred providers (`DeferrableProvider`) delay their registration until one of their services is requested for the first time. The container stores metadata for deferred providers (module and class) in an internal dictionary (`_deferred_providers`), and when `make` or `build` requires an unregistered service, the container:

1. Checks if a deferred provider associated with the requested type exists.
2. Dynamically imports the provider's module via `importlib.import_module`.
3. Builds the provider instance with `build`.
4. Executes the provider's `register()` and `boot()`.
5. Marks the provider as resolved in an internal cache to avoid duplicate processing.

This mechanism reduces application startup time in environments with many services that are not used in every context.

Refer to the [Service Providers](/en/architecture/service-providers) documentation for the complete lifecycle and `DeferrableProvider` implementation.

---

## Best Practices

**Name contracts with the `I` prefix:** `IEmailService`, `IUserRepository`. This improves readability, distinguishes contracts from implementations, and facilitates static type analysis.

**Declare dependencies by contract, not by implementation:** constructors and methods should receive interfaces, never concrete classes. This is what makes the design truly decoupled and substitutable.

**Register in service providers:** group related bindings in a dedicated `ServiceProvider` rather than concentrating them in `bootstrap/app.py`. One provider per module or functional domain is a good organizational guideline.

**Choose the correct lifecycle:** misuse of lifecycles is a common source of hard-to-track bugs. As a general rule: `singleton` for expensive resources or global state; `scoped` for per-request state; `transient` for stateless objects.

**Do not resolve services in `register`:** during the registration phase, the provider processing order is not guaranteed. Attempting to resolve a service in `register` may cause an exception.

**Reserve `make` for specific cases:** automatic injection via constructor is always preferable to manual resolution. Use `make` only when strictly necessary: dynamic factories, infrastructure code, or conditional resolution at runtime.

**Avoid circular dependencies by design:** if two services need each other, it is a signal that responsibility should be redistributed. The container will detect and raise the corresponding exception, but the correct solution is to redesign, not work around the error.