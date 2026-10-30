---
title: "Cache facade and injection"
description: "Use Cache and ICacheManager in controllers and services and explore the complete manager API."
editUrl: true
lastUpdated: false
---

The `Cache` facade and `ICacheManager` contract access the same application singleton. The manager selects repositories; each repository applies the prefix and delegates operations to its backend.

<a id="facade"></a>

## Facade and deferred resolution

Always import `from orionis.support.facades import Cache`. Asynchronous methods may be your first operation: awaiting them resolves the deferred service.

```python
from orionis.http import JSONResponse
from orionis.support.facades import Cache


class CachedBannerController:
    async def __call__(self) -> JSONResponse:
        banner = await Cache.remember(
            "home:banner:v1", 300, lambda: {"message": "Welcome"},
        )
        return JSONResponse(banner)
```

`store()` and `lock()` are **synchronous** factories on the resolved service. To obtain the manager explicitly and chain repository methods from your first operation, resolve it first:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Cache


class StoreExampleController:
    async def __call__(self) -> JSONResponse:
        cache = await Cache.resolve()
        repository = cache.store("memory")
        await repository.set("example:status", {"ready": True}, ttl=60)
        return JSONResponse(await repository.get("example:status"))
```

The native provider is deferred. Before resolution, a synchronous facade call produces a dispatcher, not a repository on which you can chain `.get()`. After `await Cache.resolve()`, you can also use `Cache.store(...)` or `Cache.lock(...)`. The dispatcher also supports `async with Cache.lock(...)`, resolving the service when entering the context. You do not need to resolve before every operation or register the native provider yourself.

<a id="injection"></a>

## Constructor injection

Use `ICacheManager`, exported from `orionis.cache.contracts`, when several actions need caching. Save this example in `app/http/controllers/catalog_cache_controller.py`:

```python
from orionis.cache.contracts import ICacheManager
from orionis.http import JSONResponse


class CatalogCacheController:
    def __init__(self, cache: ICacheManager) -> None:
        self.cache = cache

    async def show(self, product_id: int) -> JSONResponse:
        key = f"catalog:product:{product_id}:v1"
        value = await self.cache.remember(
            key, 120, lambda: {"id": product_id, "label": "Example"},
        )
        return JSONResponse(value)

    async def invalidate(self, product_id: int) -> JSONResponse:
        deleted = await self.cache.delete(f"catalog:product:{product_id}:v1")
        return JSONResponse({"deleted": deleted})
```

Register the actions in your API route file:

```python
from app.http.controllers.catalog_cache_controller import CatalogCacheController
from orionis.support.facades import Route

Route.get("/catalog-cache/{product_id:int}", [CatalogCacheController, "show"])
Route.delete("/catalog-cache/{product_id:int}", [CatalogCacheController, "invalidate"])
```

The container constructs the controller, resolves the contract and supplies `product_id` from the route. The example resolver returns demonstration data; an application can use an asynchronous function calling its catalog service. The resolver receives no arguments: capture the values it needs in its closure.

## Method injection

If only one action needs caching, receive it in that action:

```python
from orionis.cache.contracts import ICacheManager
from orionis.http import JSONResponse


class VisitCounterController:
    async def __call__(self, cache: ICacheManager) -> JSONResponse:
        visits = await cache.store("memory").increment("demo:visits")
        return JSONResponse({"visits_in_this_store": visits})
```

Register the class as an invokable controller following the [controllers guide](/en/http/controllers). This counter belongs to this application's memory backend; other processes have their own. `cache` is a server dependency, not a payload parameter. Calling a Python method directly does not activate injection: provide its argument or let the container invoke it.

## Services and providers

The contract also works in constructors of services built by the container, consumed by HTTP, commands, jobs, MCP or other components supporting injection:

```python
from orionis.cache.contracts import ICacheManager


class CachedSettings:
    def __init__(self, cache: ICacheManager) -> None:
        self.cache = cache

    async def read(self) -> dict:
        return await self.cache.remember(
            "settings:public:v1", 60, lambda: {"signup_enabled": True},
        )
```

In a provider with access to `self.app`, resolve `cache = await self.app.make(ICacheManager)` explicitly. The `register()` and `boot()` hooks do not receive automatic method dependencies. See [providers and facades](/en/application/container/providers). Use `ICacheManager` as the general dependency: `ICacheRepository` and `IFileBasedCache` define contracts, but the native provider does not bind instances for them.

<a id="manager-construction"></a>

## Construction and lifecycle

```text
CacheManager(app: IApplication) -> None
```

Reads `app.basePath` and `app.config("cache")`; converts a dictionary into the `Cache` configuration entity and keeps an existing entity. Retains `default`, `prefix` and an initially empty repository cache. Configuration is captured when constructing the singleton: changing environment variables later does not rebuild its repositories.

The native `CacheProvider` binds `ICacheManager → CacheManager` as a singleton and pins the facade during its asynchronous `boot()` on deferred resolution. It does not construct all backends at startup. The manager exposes no public method for closing resources, purging its references or registering additional drivers.

<a id="manager-store"></a>

## store(name: str | None = None) → CacheRepository

Returns the named repository; `None` and `""` select the default (`name or default`). Keeps one instance per name, returning that same repository on later calls. Accepts the lowercase names `file`, `memory`, `redis`, `memcached` and `database`, without normalizing the argument.

```python
from orionis.cache.contracts import ICacheManager


class CacheStores:
    def __init__(self, cache: ICacheManager) -> None:
        self.cache = cache

    async def example(self) -> bool:
        repository = self.cache.store("memory")
        assert repository is self.cache.store("memory")
        return await repository.set("demo:ready", True, ttl=30)
```

The fixed name selects the implementation; an entity's `driver` field does not create an arbitrarily named store. `file` resolves relative paths against `app.basePath` and creates the directory on backend construction. `database` resolves an ORM connection; tables are prepared when operating. Selecting Redis or Memcached does not test connectivity yet.

An unknown name or missing required Redis, Memcached or Database configuration raises `CacheStoreException`. Configuration, permission, connection and engine restriction errors can also propagate. See [drivers](/en/cache/stores-and-drivers) and [configuration](/en/cache/configuration).

<a id="manager-proxies"></a>

## All delegated operations

These methods call the default repository. Their parameters, return values and errors follow the [value API](/en/cache/caching-values); the manager does not add another storage layer. `Callable` denotes a zero-argument synchronous or asynchronous resolver.

| Manager signature | Purpose and result |
| --- | --- |
| `async get(key: str) -> Any` | [Read](/en/cache/caching-values#repository-get); value or `None`. |
| `async set(key: str, value: Any, ttl: float \| None = None) -> bool` | [Store](/en/cache/caching-values#repository-set) with optional TTL. |
| `async has(key: str) -> bool` | [Check existence](/en/cache/caching-values#repository-has). |
| `async delete(key: str) -> bool` | [Delete one entry](/en/cache/caching-values#repository-delete). |
| `async clear() -> bool` | [Clear the backend](/en/cache/caching-values#repository-clear), without restricting to the prefix. |
| `async getMany(keys: list[str]) -> dict[str, Any]` | [Read a batch](/en/cache/caching-values#repository-getmany). |
| `async setMany(values: dict[str, Any], ttl: float \| None = None) -> bool` | [Write a batch](/en/cache/caching-values#repository-setmany). |
| `async remember(key: str, ttl: float \| None, resolver: Callable) -> Any` | [Calculate on a miss](/en/cache/caching-values#repository-remember). |
| `async rememberOnce(key, ttl, resolver, *, wait_timeout=10, lease=None) -> Any` | [Share overlapping misses](/en/cache/caching-values#repository-rememberonce). |
| `async rememberForever(key: str, resolver: Callable) -> Any` | [Calculate without TTL](/en/cache/caching-values#repository-rememberforever). |
| `async pull(key: str) -> Any` | [Read, then delete](/en/cache/caching-values#repository-pull); not atomic. |
| `async add(key: str, value: Any, ttl: float \| None = None) -> bool` | [Add if missing](/en/cache/caching-values#repository-add). |
| `async increment(key: str, amount: int = 1) -> int` | [Increment](/en/cache/caching-values#repository-increment). |
| `async decrement(key: str, amount: int = 1) -> int` | [Decrement](/en/cache/caching-values#repository-decrement). |
| `lock(key: str, timeout: float \| None = None) -> Any` | Create a [CacheLock context](/en/cache/locks). Synchronous; actually returns `CacheLock`. |

`replace()` belongs to the repository: call `cache.store().replace(...)`. There is no `Cache.replace(...)` proxy. `lock()` exists on the concrete manager and repository implementations, although their current abstract contracts do not declare it; the locks guide accesses it through the resolved facade.

## Keeping permanent data coherent

Use keys identifying the resource, its ID and, where necessary, its authorized identity or scope. After confirming a permanent change, delete or replace its entry. The manager does not listen for ORM changes or invalidate keys automatically; `remember()` does not coordinate simultaneous calculations either. Define that policy in the service responsible for the operation and check the [lock guarantees](/en/cache/locks) before relying on them.
