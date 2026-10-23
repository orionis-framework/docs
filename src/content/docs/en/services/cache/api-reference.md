---
title: "Cache technical reference"
description: "Contracts, backend factories, serialization, provider and cache errors."
editUrl: true
lastUpdated: false
---

For application operations, use the [facade or ICacheManager](/en/services/cache/manager-and-injection) and the [complete value API](/en/services/cache/caching-values). This reference covers contracts and lower-level components. Backends receive complete keys: using them directly does not add the configured prefix.

## Contracts and exports

`orionis.cache` exports `CacheManager`, `CacheRepository` and `FileBasedCache`. `orionis.cache.contracts` exports `ICacheManager`, `ICacheRepository` and `IFileBasedCache`.

| Contract | Public surface |
| --- | --- |
| `ICacheManager` | `store()` and the thirteen asynchronous value proxies in the [manager guide](/en/services/cache/manager-and-injection#manager-proxies). `store()` annotates `ICacheRepository`, while the implementation returns `CacheRepository`. |
| `ICacheRepository` | Fourteen asynchronous operations: the thirteen value proxies plus `replace()`. |
| `IFileBasedCache` | Synchronous `get() -> dict \| None`, `save(data: dict) -> tuple[int, str]` and `clear() -> bool`. |

`lock()` exists on `CacheManager` and `CacheRepository`, but their abstract contracts do not declare it. The native provider only binds `ICacheManager`; it does not automatically supply a repository or artifact instance for the other contracts. Annotations do not replace real driver differences.

<a id="backend-file"></a>

## FileCacheBackend

```text
from orionis.cache.stores.file import FileCacheBackend
FileCacheBackend(path: Path) -> None
```

Resolves `path`, creates its directories and prepares internal file locks. Its asynchronous methods delegate filesystem I/O to threads. It does not use the Storage disk contract: this is the internal cache backend, configured through `config/cache.py`.

<a id="backend-locknamespace"></a>

`lockNamespace` is a read-only **property** returning the absolute directory as a `Path`. `CacheLock` uses it to distinguish stores. Do not call it as a method. Internal file locks coordinate entry operations across processes; the business context `repository.lock()` has a [different scope](/en/services/cache/locks).

<a id="backend-database"></a>

## DatabaseCacheBackend and its factory

```text
from orionis.cache.stores.database import DatabaseCacheBackend, build
DatabaseCacheBackend(connection: IConnection, table: str, lock_table: str | None = None) -> None
build(connection: IConnection, table: str, lock_table: str | None = None) -> DatabaseCacheBackend
```

`build()` only constructs the backend. The connection must enforce unique constraints; otherwise construction raises `QueryException`. The first operation needing a schema prepares entry and lock tables, defaulting `lock_table` to `cache_locks`. Keys and owner tokens use length-255 columns. Use distinct table names and grant creation permissions; direct construction does not run configuration-entity validation.

Normally use `cache.store("database")`, which resolves the ORM connection and applies the prefix. See [Database configuration](/en/services/cache/configuration#config-database).

## Common File and Database backend API

The following signatures exist on both implementations. Methods are asynchronous and accept `str` keys. `value`, `default` and batch elements are `Any`; content must be encodable by msgspec JSON. The return values of `delete()` and batch reads differ from repository methods.

<a id="backend-get"></a>

### get(key: str, default: Any = None) → Any

Returns the value or `default` when absent or expired. A stored `None` remains a present value. Expiration is cleaned on read; File uses a monotonic clock and Database uses wall time. File treats read/JSON errors as a miss; Database propagates SQL errors and converts invalid stored JSON to `None`.

<a id="backend-set"></a>

### set(key: str, value: Any, ttl: float | None = None) → bool

Stores or replaces a value and its expiration, returning `True` on completion. `None` removes the TTL; zero expires immediately. File publishes through a temporary file and rename under its file lock. Database attempts an update, then an insert when no rows were affected; on insertion conflict it attempts another update. This is not a transaction covering multiple operations.

<a id="backend-replace"></a>

### replace(key: str, value: Any, ttl: float | None = None) → bool

Replaces only a live entry and returns whether it was updated. File checks and publishes under the same file lock. Database performs an `UPDATE` conditioned on key and expiration. It does not recreate a missing or expired entry. Available through `CacheRepository`, without a manager proxy.

<a id="backend-exists"></a>

### exists(key: str) → bool

Reads using a sentinel, distinguishing a stored `None` from a miss. May remove an expired entry during the check.

<a id="backend-delete"></a>

### delete(key: str) → int

File returns `1` when removing a file, or `0` when absent; Database returns affected rows. Deletion does not first check whether the value is still live. The repository converts the count to `bool`.

<a id="backend-clear"></a>

### clear() → bool

File removes `*.json` entries and `*.tmp` staging files in its directory, keeping internal lock files. Database deletes every row in the entry table, retaining the lock table. Both return `True` on completion. They do not filter by prefix or globally coordinate all writers.

<a id="backend-multiget"></a>

### multiGet(keys: list[str], default: Any = None) → list[Any]

Reads keys sequentially and returns a list in the same order, using `default` for each miss. Both backends expose the public alias `multi_get = multiGet`; the repository calls this alias and builds a dictionary.

<a id="backend-multiset"></a>

### multiSet(pairs: list[tuple[str, Any]], ttl: float | None = None) → bool

Calls `set()` sequentially for each pair with the common TTL and returns `True`. There is no batch rollback: an exception may leave earlier writes published. `multi_set = multiSet` is the alias used by the repository.

<a id="backend-add"></a>

### add(key: str, value: Any, ttl: float | None = None) → bool

Returns `True` when creating an entry. Raises `ValueError` if a live entry exists; the repository converts that error to `False`. File uses exclusive creation and retries after evicting an expired entry. Database first removes an expired row and attempts insertion under its unique constraint. If SQL fails and the key does not exist, it propagates the SQL error.

<a id="backend-increment"></a>

### increment(key: str, delta: int = 1) → int

Adds `delta` to the stored integer; creates the counter at `delta` when absent. Negative deltas are allowed. Preserves the expiration of an existing entry. File protects reading, `int()` conversion and writing under its file lock; Database attempts up to 25 compare-and-swap updates against the previous payload. Exhausting contention raises `QueryException`. Non-convertible values raise conversion errors. Repository subtraction calls this method with `-amount`.

Example of composing the File backend in a component receiving `IApplication`; its directory comes from project paths:

```python
from orionis.cache import CacheRepository
from orionis.cache.stores.file import FileCacheBackend
from orionis.foundation.contracts.application import IApplication


class FileCacheProbe:
    def __init__(self, app: IApplication) -> None:
        backend = FileCacheBackend(app.path("storage") / "cache-probe")
        self.repository = CacheRepository(backend, prefix="probe")

    async def check(self) -> dict:
        await self.repository.setMany({"a": 1, "b": 2}, ttl=30)
        await self.repository.replace("a", 3, ttl=30)
        return await self.repository.getMany(["a", "b"])
```

This explicitly constructs an instance separate from the manager. For normal application code, select the configured store through `ICacheManager`.

<a id="backend-acquirelock"></a>

## acquireLock(key: str, owner: str, lease: float) → bool

An asynchronous `DatabaseCacheBackend` method performing **one attempt**, without waiting. Inserts a row expiring at `time.time() + lease`; on conflict it attempts an update only if the row expired or already belongs to the same `owner`. Returns whether it acquired the row. Use a unique owner token per logical acquisition. Update errors may propagate; not every insertion failure represents legitimate contention.

<a id="backend-releaselock"></a>

## releaseLock(key: str, owner: str) → None

Asynchronously deletes the row only when key and owner match. Does not return a status or renew the lease. `CacheLock` manages tokens, waiting, retries and release; use its [context](/en/services/cache/locks) instead of repeating those details in every consumer.

<a id="backend-memory"></a>

## memory factory

```text
from orionis.cache.stores.memory import build
build() -> SimpleMemoryCache
```

Constructs `aiocache.SimpleMemoryCache(serializer=MsgspecSerializer())`. Each call creates an independent backend; the manager provides reuse by name. Its `clear()` only clears that instance. Its methods belong to aiocache; the application API documented here is the Orionis repository.

<a id="backend-redis"></a>

## redis factory

```text
from orionis.cache.stores.redis import build
build(endpoint: str = "127.0.0.1", port: int = 6379, db: int = 0, password: str | None = None) -> RedisCache
```

Constructs `aiocache.RedisCache` with `MsgspecSerializer`, converts `port` and `db` through `int()`, normalizes an empty password to `None` and forces Redis protocol 2 through `connection_pool_kwargs`. No Orionis parameters expose TLS, cluster, username or Unix sockets. `clear()` reaches `FLUSHDB`, without restricting to a prefix.

<a id="backend-memcached"></a>

## memcached factory

```text
from orionis.cache.stores.memcached import build
build(endpoint: str = "127.0.0.1", port: int = 11211) -> MemcachedCache
```

Constructs `aiocache.MemcachedCache` with `MsgspecSerializer`, converting `port` to an integer. Adds no authentication or TLS options. `clear()` runs `flush_all` on the shared service. TTL is passed as `exptime`: use integers and consider the [specific limits](/en/services/cache/stores-and-locks#driver-memcached).

<a id="msgspec-serializer"></a>

## MsgspecSerializer

Extends `aiocache.serializers.BaseSerializer`. `DEFAULT_ENCODING = None` retains bytes without an additional UTF-8 decode. Used by the three factories above; File and Database encode directly with msgspec. This is different from the enriched `Serializer` used by [artifacts](/en/services/cache/source-artifacts).

<a id="msgspec-dumps"></a>

### dumps(value: Any) → bytes

Calls `msgspec.json.encode(value)`. Accepts types supported by that encoder, without guaranteeing reconstruction of their original Python type identity. Unsupported objects raise encoding errors.

<a id="msgspec-loads"></a>

### loads(data: bytes | str | float | None) → Any

Returns `None` unchanged; converts strings to bytes and decodes bytes, bytearray or memoryview as JSON. Other native values pass through, supporting memory counters bypassing `dumps()`. Invalid JSON raises a decoding error.

```python
from orionis.cache.serializers.json import MsgspecSerializer

serializer = MsgspecSerializer()
payload = serializer.dumps({"ready": True, "count": 3})
assert isinstance(payload, bytes)
assert serializer.loads(payload) == {"ready": True, "count": 3}
assert serializer.loads(None) is None
```

<a id="provider"></a>

## CacheProvider

The class method `provides() -> list[type]` returns `[ICacheManager]`. `register() -> None` binds that contract as a singleton to `CacheManager`. `async boot() -> None` runs `await CacheFacade.pin()` to pin the facade to the resolved service. The provider is included in native registration and is deferred; its lifecycle does not open every store or test external servers.

<a id="facade-accessor"></a>

## Cache.getFacadeAccessor() → type

This class method returns `ICacheManager`. It links the facade to the container, rather than reading cache values, and requires no manual invocation. Its base class provides `resolve()` and call resolution; see [facade usage](/en/services/cache/manager-and-injection#facade).

<a id="exceptions"></a>

## Errors and contract limits

`CacheException` extends `Exception`; `CacheStoreException` extends it for unknown stores, missing configuration or a custom backend without atomic replacement. External errors are not universally converted to these types: file permissions, timeouts, Redis/Memcached connection failures, JSON errors, numeric conversion errors and `QueryException` may retain their original types.

The manager does not fall back automatically to memory if a server fails. Explicitly define how your application responds when it cannot read, compute or store an entry; do not indiscriminately catch resolver errors as if they were ordinary cache misses.

## Verifiable inventory

The [downloadable inventory](/downloads/cache-api-inventory.json) maps every own public declaration to its signature, file, line, checksum and documentation destination. Includes contracts, implementations, configuration fields, constructors, context protocols and all four batch aliases. Excludes private implementation, dataclass-generated methods and inherited aiocache API; relevant dependency differences are explained in the driver, value and lock guides.
