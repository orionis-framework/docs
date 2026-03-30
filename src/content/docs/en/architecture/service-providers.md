---
title: Service Providers
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Service Providers

Service providers are the central configuration mechanism in Orionis. Through them, services are registered, contracts are bound to concrete implementations, and initialization tasks are executed during application startup.

Every provider extends the `ServiceProvider` class, which automatically receives the application instance (`self.app`) and exposes two lifecycle methods: `register` and `boot`. Orionis handles invoking these methods in the correct order during the startup process.

Providers are located in the `app/providers` directory. The default provider is `app/providers/app_service_provider.py`, but you can create as many providers as needed to organize service registration in a modular fashion.

## Creating a Service Provider

To generate a new provider, use the Reactor CLI `make:provider` command:

```bash
python -B reactor make:provider riak_service_provider
```

This command creates the file `app/providers/riak_service_provider.py` with the following structure:

```python
from orionis.container.providers.service_provider import ServiceProvider

class RiakServiceProvider(ServiceProvider):

    def register(self) -> None:
        # Register services in the container here.
        ...

    async def boot(self) -> None:
        # Execute asynchronous initialization tasks here.
        ...
```

The `register` method is used to bind services to the container, while `boot` allows executing initialization logic once all providers have been registered.

## Creating a Deferred Provider

A deferred provider is not loaded during application startup — it is only loaded when one of the services it declares is requested for the first time. This improves performance by avoiding the initialization of services that may not be needed on every request.

To generate a deferred provider, add the `--deferred` option:

```bash
python -B reactor make:provider neo4j_service_provider --deferred
```

This generates a class that inherits from both `ServiceProvider` and `DeferrableProvider`:

```python
from orionis.container.providers.deferrable_provider import DeferrableProvider
from orionis.container.providers.service_provider import ServiceProvider

class Neo4jServiceProvider(ServiceProvider, DeferrableProvider):

    def register(self) -> None:
        # Register services in the container here.
        ...

    async def boot(self) -> None:
        # Execute asynchronous initialization tasks here.
        ...

    @classmethod
    def provides(cls) -> list[type]:
        return []
```

The key difference from a standard provider is the `DeferrableProvider` inheritance and the implementation of the `provides` class method, which must return the list of types (contracts) that this provider offers.

## Standard vs. Deferred Providers

Orionis automatically classifies each provider based on its inheritance hierarchy:

| Feature | Standard Provider | Deferred Provider |
|---|---|---|
| **Inheritance** | `ServiceProvider` | `ServiceProvider` + `DeferrableProvider` |
| **Load time** | During application startup | When a declared service is requested |
| **`provides` method** | Not applicable | Required |
| **Use case** | Services that are always needed | Optional or infrequently used services |

Internally, when `withProviders` is called, Orionis inspects whether the class is a subclass of `DeferrableProvider`. If so, it registers the provider in a deferred registry indexed by the types returned by `provides()`. Otherwise, it registers it as an eager (immediately loaded) provider.

When the application needs to resolve a service that is not yet bound in the container, it consults the deferred registry. If it finds a provider that declares it, it instantiates the provider, executes its `register`/`boot` cycle at that point, and resolves the service.

## Lifecycle Methods

Every service provider has two methods that define its lifecycle: `register` and `boot`. Understanding when and how each one executes is essential for properly structuring application services.

### The `register` Method

The `register` method is **synchronous** and is invoked during the application's registration phase. Its sole purpose is to bind services to the dependency injection container. It should not execute business logic or depend on other services, as there is no guarantee they will be available at this point.

Within `register`, the container's binding methods are used to define the lifecycle of each service:

| Method | Lifecycle | Description |
|---|---|---|
| `self.app.singleton(abstract, concrete)` | **Singleton** | A single shared instance throughout the entire application lifetime. |
| `self.app.transient(abstract, concrete)` | **Transient** | A new instance every time the service is requested. |
| `self.app.scoped(abstract, concrete)` | **Scoped** | A shared instance within a defined scope. |

Each binding method accepts the following parameters:

- `abstract` — The contract type (interface). Can be `None` to use the concrete type directly.
- `concrete` — The concrete implementation class.
- `alias` *(optional)* — A `str` alias to resolve the service by name.
- `override` *(optional)* — If `True`, replaces an existing registration for the same contract.

Example of registration with a singleton service:

```python
from app.services.database_service import DatabaseService
from app.services.contracts.database_service import IDatabaseService
from orionis.container.providers.service_provider import ServiceProvider

class DatabaseServiceProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(IDatabaseService, DatabaseService)
```

Example with multiple lifecycles:

```python
from orionis.container.providers.service_provider import ServiceProvider
from app.services.contracts.cache_service import ICacheService
from app.services.contracts.logger_service import ILoggerService
from app.services.contracts.request_context import IRequestContext
from app.services.cache_service import CacheService
from app.services.logger_service import LoggerService
from app.services.request_context import RequestContext

class AppServiceProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(ICacheService, CacheService)
        self.app.transient(ILoggerService, LoggerService)
        self.app.scoped(IRequestContext, RequestContext)
```

### The `boot` Method

The `boot` method is **asynchronous** (`async def`) and executes after all providers have completed their registration phase. At this point, all registered services are available in the container, allowing initialization tasks that depend on other services.

Typical use cases for the `boot` method:

- Establishing connections to databases or external services.
- Configuring event listeners.
- Initializing caches or loading configuration from external sources.

```python
from app.services.event_service import EventService
from app.services.contracts.event_service import IEventService
from orionis.container.providers.service_provider import ServiceProvider

class EventServiceProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(IEventService, EventService)

    async def boot(self) -> None:
        event_service = await self.app.make(IEventService)
        await event_service.initialize()
```

:::note
The container's `make` method is asynchronous. It must be called with `await` to correctly resolve dependencies.
:::

### The `provides` Method

The `provides` method is exclusive to deferred providers. It is a **class method** (`@classmethod`) that must return a list of service types (contracts) the provider offers. Orionis uses this information to determine which provider to instantiate when a service that has not yet been registered is requested.

If a deferred provider does not implement `provides`, a `NotImplementedError` will be raised at runtime.

```python
from app.services.neo4j_service import Neo4jService
from app.services.contracts.neo4j_service import INeo4jService
from orionis.container.providers.deferrable_provider import DeferrableProvider
from orionis.container.providers.service_provider import ServiceProvider

class Neo4jServiceProvider(ServiceProvider, DeferrableProvider):

    def register(self) -> None:
        self.app.singleton(INeo4jService, Neo4jService)

    async def boot(self) -> None:
        neo4j_service = await self.app.make(INeo4jService)
        await neo4j_service.initialize()

    @classmethod
    def provides(cls) -> list[type]:
        return [INeo4jService]
```

In this example, when the application attempts to resolve `INeo4jService` for the first time, Orionis will detect that `Neo4jServiceProvider` declares it in `provides`, instantiate the provider, execute `register` and `boot`, and finally return the service instance.

## Registering Providers in the Application

For Orionis to load a provider during startup, it must be declared in the `bootstrap/app.py` file via the `withProviders` method:

```python
from app.providers.app_service_provider import AppServiceProvider
from app.providers.database_service_provider import DatabaseServiceProvider
from app.providers.event_service_provider import EventServiceProvider
from app.providers.neo4j_service_provider import Neo4jServiceProvider

# ...

app.withProviders(
    AppServiceProvider,
    DatabaseServiceProvider,
    EventServiceProvider,
    Neo4jServiceProvider,
    # Add more custom providers here
)

# ...
```

The `withProviders` method accepts a variable number of classes that inherit from `ServiceProvider`. Each class is automatically validated and classified as either a standard or deferred provider based on its inheritance hierarchy. If any class is not a subclass of `IServiceProvider`, a `TypeError` will be raised.

The method returns the application instance.

## Startup Flow

The following diagram summarizes the order in which Orionis processes service providers during startup:

1. **Classification** — `withProviders` receives the provider classes and classifies them into the *eager* (standard) or *deferred* registry.
2. **Registration** — Orionis instantiates each standard provider by passing it the application (`self.app`) and invokes its `register` method.
3. **Boot** — Once all standard providers have been registered, Orionis invokes the `boot` method of each one (respecting its asynchronous nature).
4. **Deferred resolution** — Deferred providers remain inactive until the application attempts to resolve an unregistered service. At that point, Orionis consults the deferred registry, instantiates the corresponding provider, and executes its `register`/`boot` cycle on demand.