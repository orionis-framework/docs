---
title: "Cache drivers and stores"
description: "Choose file, memory, Redis, Memcached, or database according to the sharing, expiration, and coordination you need."
editUrl: true
lastUpdated: false
---

A **store** is the repository selected through `manager.store("redis")`. Its **backend** implements operations using files, memory, Redis, Memcached, or database tables. The included configuration maps five fixed names to implementations; each entity's `driver` field confirms its type rather than arbitrarily converting one store into another.

## Choose by scope

| Store | Where data is shared | Uses and considerations |
|---|---|---|
| `file` | Processes accessing the same filesystem directory. | Requires no cache server. Adds I/O and coordination files; monotonic expirations are not durable persistence. |
| `memory` | Only consumers of the same backend instance. | Tests and ephemeral process-local data. Does not share results across workers or survive loss of the instance. |
| `redis` | Clients of the same Redis database. | Shared cache across processes and servers. Requires an accessible service; lifecycle and capacity depend on its configuration. |
| `memcached` | Clients of the same Memcached service. | Shared cache with server-managed temporary storage. Prefixes do not isolate clearing. |
| `database` | Clients of the same tables in a Database connection. | Reuses an existing connection. Adds queries and tables; requires enforced unique constraints. |

All stores hold regenerable data. Orionis provides no automatic failover between them: Redis failure does not redirect writes to `file` or `memory`. Backend, serialization, network, and database errors may propagate.

## Included dependencies and external services

The framework declares `aiocache[redis,memcached]`, `redis[hiredis]`, `msgspec`, and `filelock` as normal dependencies. The `aiomcache` client is included through aiocache's Memcached support. **No Orionis extras are required for these stores**; you do not need `reactor packages` to enable Redis or Memcached.

Python clients do not include their servers. Before using `redis` or `memcached`, provide the corresponding service and configure it in [config/cache.py](/en/services/cache/configuration). The `database` backend uses the Database system; when choosing an engine with an optional database driver, apply [that engine's requirements](/en/database/drivers).

## Select a store from a component

This service receives `ICacheManager` through injection. `store()` returns a repository synchronously; data operations are asynchronous:

```python
from orionis.cache.contracts import ICacheManager


class CatalogCache:
    def __init__(self, cache: ICacheManager) -> None:
        self.cache = cache

    async def save_snapshot(self) -> dict:
        store = self.cache.store("file")
        snapshot = {"published_products": 42}
        await store.set("catalog:summary", snapshot, ttl=60)
        return await store.get("catalog:summary")
```

Replace `"file"` with another configured name to use it for that operation. `self.cache.store()` without an argument selects `CACHE_STORE`. The manager reuses each named repository; do not create a new repository per request to represent the same memory store.

You can also resolve the manager through the facade inside a controller:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Cache


class CacheStatusController:
    async def index(self) -> JSONResponse:
        manager = await Cache.resolve()
        store = manager.store("memory")
        await store.set("status:ready", {"ready": True}, ttl=30)
        return JSONResponse(await store.get("status:ready"))
```

Explicit resolution returns the service before calling the synchronous `store()` method and supports its deferred provider. The [guide introduction](/en/services/cache) explains facades and application integration.

<a id="driver-file"></a>

## File: local files

Minimal configuration:

```dotenv
CACHE_STORE=file
CACHE_FILE_PATH=storage/framework/cache/data
```

The manager resolves relative paths from the application root. The backend normalizes its path and creates the directory when constructed. Each complete key, including its prefix, becomes a SHA-256 `<digest>.json` filename rather than being used directly as a file path.

Each JSON entry contains its value and expiration. The backend moves reads and writes to worker threads, uses striped file locks to coordinate access to the same directory, and publishes writes through unique temporary files and replacement. Increments coordinate the read and write under a file lock. These single-operation guarantees do not turn several calls into a transaction.

Read errors or unreadable JSON are treated as a miss; expired entries are removed when read. Writes can propagate permission, serialization, and I/O errors. `clear()` deletes `.json` and `.tmp` files from that directory, rather than only the current prefix's keys. Reserve a dedicated directory for this backend.

### Expiration and persistence

TTLs use `time.monotonic()`, in seconds. `ttl=None` means no expiration; `ttl=0` makes the entry immediately expired. The monotonic clock is not a calendar date and does not define a durable expiration that you can move between machines or system restarts. Treat this store as regenerable local cache.

There is no periodic cleanup worker or configured size limit. An expired entry can remain physically present until read or until you clear the store. The [public cache lock](/en/services/cache/locks) has a different scope: it coordinates the same event loop, directory, and key rather than all requests from separate processes.

<a id="driver-memory"></a>

## Memory: process-local data

```dotenv
CACHE_STORE=memory
```

The builder creates aiocache's `SimpleMemoryCache` with Orionis's JSON serializer. It requires no external connection and avoids disk or network I/O, although values are still serialized.

The manager retains one instance per store; another manager or memory backend does not share its data. Each worker has its own cache and regenerations. There is no restart persistence or Orionis-configured capacity limit. Positive TTLs use event-loop timers; `None` and `0` do not schedule expiration.

Use it for disposable process-local data and tests without servers. Choose a shared backend for results that workers must share.

<a id="driver-redis"></a>

## Redis: shared cache

```dotenv
CACHE_STORE=redis
CACHE_PREFIX=shop
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
```

Set `REDIS_PASSWORD` when required. Orionis builds aiocache's `RedisCache` with endpoint, port, database, password, and its JSON serializer. The client uses RESP 2. The included configuration exposes no connection URL, TLS, ACL username, Sentinel, or Cluster; adding dictionary fields does not enable those options.

Selecting the store constructs the client; it does not prove connectivity or valid credentials. Network operations can fail. Sharing, server persistence, and memory policies depend on your Redis deployment rather than `CACHE_STORE`.

Fractional TTLs for individual writes are converted to milliseconds for the client; integer TTLs are passed as seconds. Use `None` for no expiration and positive TTLs for limited lifetimes. Orionis does not normalize every `0` TTL case: aiocache's single-write and batch-write paths use different commands.

`clear()` flushes the selected Redis database; the Orionis prefix does not restrict its scope. Use a database or service suitable for that clearing policy rather than sharing it with unrelated data.

<a id="driver-memcached"></a>

## Memcached: shared temporary cache

```dotenv
CACHE_STORE=memcached
CACHE_PREFIX=shop
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11211
```

Orionis constructs aiocache's `MemcachedCache` with endpoint, port, and its JSON serializer. Provide the service separately. The entity exposes no authentication, TLS, or multiple endpoints.

Use whole-second TTLs for this backend: its client validates `exptime` as an integer. `None` and `0` are sent as no expiration; fractional TTLs are not automatically converted and may raise `TypeError`. Server key, value-size, and capacity limits still apply; Orionis neither removes them nor provides persistence.

Aiocache's key builder replaces spaces with underscores. Avoid keys differing only by these characters, as they can identify the same item. Prefixes also provide no isolation for `clear()`, which invokes the service's `flush_all`.

<a id="driver-database"></a>

## Database: cache and lock tables

```dotenv
CACHE_STORE=database
DB_CACHE_TABLE=cache
DB_CACHE_LOCK_TABLE=cache_locks
```

Without `DB_CACHE_CONNECTION`, the store uses Orionis's default connection resolution. For a specific connection, supply a name declared in `config/database.py`. The backend receives its connection from `ConnectionResolver`; it does not create an independent connection configuration.

The first I/O operation lazily creates the entry and lock tables through the schema system. The connection must be able to create missing tables. Existing tables are retained rather than migrated to compatible structures. Names are logical names, so the Database connection's table prefix applies.

| Table | Generated columns | Purpose |
|---|---|---|
| Entries: `table` | `cache_key`: String(255), primary key; `cache_value`: nullable Text; `expiration`: nullable Double. | Complete key, JSON, and expiration. |
| Locks: `lock_table` | `cache_key`: String(255), primary key; `owner`: nullable String(255); `expiration`: nullable Double. | Temporary reservation by key and owner. |

Tables must have different names dedicated to this cache. The connection must actually enforce unique keys; the constructor rejects engines such as Amazon Redshift with `QueryException`. Entries and locks use the same connection, with no separate lock-connection option.

Expirations use `time.time()` and store fractional seconds. `None` means no expiration; `0` expires immediately. Reads lazily remove expired rows. There is no periodic scan of all rows. Batch operations iterate over entries rather than forming one batch transaction. Increments use compare-and-update with bounded retries under concurrency.

This store shares data without a dedicated cache server at the cost of database reads and writes. `clear()` deletes every row in the entry table, preserving the table and lock rows. Connection, schema, and query errors may propagate.

<a id="namespace"></a>

## Prefixes, namespaces, and serialization

`CACHE_PREFIX` transforms the backend key to `prefix:key` when nonempty, or leaves it as `key` otherwise. It creates neither a separate Redis/Memcached client namespace, a file subdirectory, nor a database table.

| Backend | Scope of `clear()` |
|---|---|
| File | JSON and temporary files in its directory. |
| Memory | Every entry in that backend instance. |
| Redis | The selected Redis database. |
| Memcached | The Memcached service through `flush_all`. |
| Database | Every row in the entry table. |

All five backends use msgspec JSON: `MsgspecSerializer` for memory/Redis/Memcached and direct JSON encoding for file/database. A tuple returns as a list, and dates can return as text; the original Python type is not necessarily preserved. Unsupported objects fail on write.

For shared results, prefer explicit JSON data contracts: dictionaries, lists, strings, numbers, booleans, and `None`. The rich `Serializer` described under [cache artifacts](/en/services/cache/source-artifacts) is not used by these backends.

### Compare coordination

| Store | Public lock scope |
|---|---|
| File | Same key, directory, and event loop; this context does not coordinate processes. |
| Memory | RedLock on the same backend instance. |
| Redis | RedLock lease on the shared service. |
| Memcached | RedLock lease with backend-specific guarantees. |
| Database | Row reservation and owner in the lock table. |

See [locks and regeneration](/en/services/cache/locks) for `timeout` semantics, lease expiration, and complete examples. A cache lock does not replace transactions or constraints in the authoritative data system.

## Custom backends and failures

The manager recognizes five built-in names and reuses their repositories. It has no `extend()` registry for new names or common retry/fallback mechanism. Unconfigured Redis, Memcached, or database stores raise `CacheStoreException`; inaccessible services retain their backend's errors.

You can construct `CacheRepository(backend, prefix)` using a compatible backend or replace `ICacheManager` through a provider. Implement the operations the repository actually uses, including the concurrency features you require; changing only a `driver` field does not register an implementation. The [technical reference](/en/services/cache/api-reference) documents contracts and builders.
