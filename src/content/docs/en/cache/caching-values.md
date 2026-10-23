---
title: "Storing and regenerating values"
description: "The complete CacheRepository API: reads, writes, cache-aside, counters, TTL, invalidation, and the default-store facade."
editUrl: true
lastUpdated: false
---

Use a cache for values that can be regenerated from a persistent source: catalog summaries, calculated reports, or configuration assembled for a request. Define the key, lifetime, and invalidation together. Updating a model does not automatically invalidate its cached representations.

The examples below run inside an Orionis application, in asynchronous services that controllers or other components can call. Import the facade from its public module:

```python
from orionis.support.facades import Cache


class CatalogCache:

    async def publish(self, tenant_id: int, products: list[dict]) -> bool:
        key = f"catalog:{tenant_id}:v1"
        return await Cache.set(key, products, ttl=60)

    async def read(self, tenant_id: int) -> list[dict] | None:
        return await Cache.get(f"catalog:{tenant_id}:v1")

    async def invalidate(self, tenant_id: int) -> bool:
        return await Cache.delete(f"catalog:{tenant_id}:v1")
```

After committing a change to the source, invalidate the affected keys. Include inputs such as tenant, locale, filters, and representation format in the key when they affect the result. A prefix separates names; it does not enforce authorization.

## Choose the default store or a repository

`await Cache.get(...)` and the other asynchronous facade operations use `cache.default`. To select a store explicitly, resolve the deferred facade before calling the synchronous `store()` factory:

```python
from orionis.support.facades import Cache


class ReportCache:

    async def publish(self, report_id: str, content: dict) -> bool:
        manager = await Cache.resolve()
        repository = manager.store("memory")
        return await repository.set(f"report:{report_id}", content, ttl=30)
```

`Cache.resolve()` returns the manager and pins it for subsequent calls. The cache service can remain unresolved after application boot; do not rely on `Cache.store("memory")` being a repository on its first use. `(await Cache.resolve()).store()` selects the default store; an empty name also selects the default. The recognized names are `memory`, `file`, `database`, `redis`, and `memcached`. An unsupported name raises `CacheStoreException`.

A manager reuses its repository for each store name. Repositories selected from different stores do not share their contents. See [manager and dependency injection](/en/cache/manager-and-injection) for configuration resolution and injection.

<a id="repository-construction"></a>

## Repository, prefixes, and supported values

```text
CacheRepository(backend: Any, prefix: str = "") -> None
```

The manager constructs this wrapper automatically. `backend` supplies storage primitives such as `get`, `set`, `multi_get`, and `increment`. The constructor only retains the backend and prefix; it does not validate the complete backend interface.

A nonempty prefix transforms `report:42` into `<prefix>:report:42` for key-based operations. An empty prefix leaves the key unchanged. Callers always supply the unprefixed name. The repository does not trim names or normalize paths. `clear()` is the exception to key prefixing: it receives no key and flushes the backend.

For an isolated repository outside the manager, provide a concrete backend:

```python
from orionis.cache import CacheRepository
from orionis.cache.stores.memory import build


class IsolatedReportCache:

    def __init__(self) -> None:
        self.repository = CacheRepository(build(), prefix="reports")

    async def publish(self) -> bool:
        return await self.repository.set("daily", {"total": 12}, ttl=60)
```

Its physical key is `reports:daily`. Each new memory backend has its own contents; creating this service repeatedly also creates separate caches.

### JSON is a storage boundary

The native value stores encode values as JSON using `msgspec`, including the memory store. Prefer dictionaries, lists, strings, numbers, booleans, and `None`. Values are decoded from storage; there is no object identity guarantee, and a tuple is read back as a list.

The `Any` annotation does not promise preservation of arbitrary Python objects or classes. Unsupported values can raise serialization errors. The separate enriched `Serializer` helper is not automatically applied to repository values.

### Lifetime in seconds

`set`, `setMany`, `add`, and `replace` default to `ttl=None`. `remember` requires its `ttl` argument, which can also be `None`.

| TTL | Effect |
| --- | --- |
| `None` | The new write has no configured expiry. Deletion, eviction, restarts, or backend maintenance can still remove it. |
| Positive seconds | Expiry is established by the write. Reads and cache hits do not renew it. |
| `0` | Not portable: file/database entries expire immediately; memory and Memcached use no expiry. Redis `set`/`add`/`replace` send a zero-expiry command that is invalid, while Redis `setMany` writes without an expiry. |

Use `None` or a positive duration for portable code. There is no common TTL range validator. Fractional seconds work with memory, file, database, and Redis; Memcached requires integer expiry values. Redis converts fractional seconds to integer milliseconds.

Overwriting with `set(..., ttl=None)` or `replace(..., ttl=None)` removes an earlier expiry. A `rememberForever` hit leaves the existing entry and its original TTL untouched.

## Reading and writing

All signatures below describe `CacheRepository` methods with `self` omitted. Asynchronous methods require `await`. Backend/network/serialization errors can propagate unless a section identifies a specific return or suppression.

<a id="repository-get"></a>

### `get`: retrieve a value

```text
async get(key: str) -> Any
```

`key` is required. Returns the decoded value, or `None` for a miss or expired entry. There is no `default=` parameter. A stored JSON null also reads as `None`; do not use truthiness to distinguish a cached `0`, `False`, or empty string from a miss.

```python
from orionis.support.facades import Cache


class DashboardCache:

    async def total(self) -> int:
        value = await Cache.get("dashboard:total")
        return value if value is not None else 0
```

<a id="repository-set"></a>

### `set`: store or overwrite

```text
async set(key: str, value: Any, ttl: float | None = None) -> bool
```

Stores `value` under the required `key`, replacing an existing entry and applying the new TTL. Returns the backend result converted to `bool`. A `False` result is not a successful write, even if no exception was raised.

```python
from orionis.support.facades import Cache


class DashboardCache:

    async def publish(self, total: int) -> bool:
        return await Cache.set("dashboard:total", total, ttl=60)
```

<a id="repository-has"></a>

### `has`: test existence

```text
async has(key: str) -> bool
```

Returns whether a live entry exists, including an entry whose value is `None`. This is a separate operation from `get` or `set`: the entry can expire or change between calls. For conditional creation, use `add` instead of `has` followed by `set`.

```python
from orionis.support.facades import Cache


class ExportCache:

    async def is_ready(self, export_id: str) -> bool:
        return await Cache.has(f"export:{export_id}")
```

<a id="repository-delete"></a>

### `delete`: invalidate one entry

```text
async delete(key: str) -> bool
```

Returns `True` if an entry was removed and `False` when none was removed. The operation applies the repository prefix. A cached value of `None` can still be deleted successfully.

```python
from orionis.support.facades import Cache


class ProfileCache:

    async def invalidate(self, user_id: int) -> bool:
        return await Cache.delete(f"profile:{user_id}")
```

### Batch operations

<a id="repository-getmany"></a>

#### `getMany`: retrieve several keys

```text
async getMany(keys: list[str]) -> dict[str, Any]
```

The required list contains unprefixed names. Returns a dictionary with those names and their decoded values; misses are `None`. Duplicate requested names collapse to one dictionary entry. A custom backend returning a different number of results triggers `ValueError` because the mapping uses strict pairing.

```python
from orionis.support.facades import Cache


class DashboardCache:

    async def read(self) -> dict:
        return await Cache.getMany(["dashboard:users", "dashboard:orders"])
```

<a id="repository-setmany"></a>

#### `setMany`: write a mapping

```text
async setMany(values: dict[str, Any], ttl: float | None = None) -> bool
```

`values` maps unprefixed keys to values. One TTL applies to the entire request. Returns the backend result converted to `bool`. This is not a portable transaction: file and database backends iterate over entries, so a failure can leave preceding writes in place. Batch reads likewise do not promise a consistent snapshot across stores.

```python
from orionis.support.facades import Cache


class DashboardCache:

    async def publish(self, users: int, orders: int) -> bool:
        return await Cache.setMany(
            {"dashboard:users": users, "dashboard:orders": orders},
            ttl=30,
        )
```

## Generate a value only when needed

<a id="repository-remember"></a>

### `remember`: cache-aside

```text
async remember(key: str, ttl: float | None, resolver: Callable) -> Any
```

All three arguments are required. `resolver` must be a callable receiving no arguments. On a hit, the cached value is returned without calling it or refreshing the TTL. On a miss:

1. Invoke `resolver()`.
2. Await its result when it is awaitable.
3. Store that result using the supplied TTL.
4. Return the computed value.

Pass the callable, not the result of calling it. A synchronous resolver runs directly on the event loop; use asynchronous I/O or explicitly offload blocking work.

```python
from orionis.support.facades import Cache


class PriceCache:

    async def quote(self, product_id: int, amount: int, unit_price: float) -> dict:
        key = f"quote:{product_id}:{amount}:{unit_price}"

        def calculate() -> dict:
            return {"total": round(amount * unit_price, 2)}

        return await Cache.remember(key, 30, calculate)
```

An async resolver follows the same API; this service receives an actual application function rather than depending on an undeclared example model:

```python
from collections.abc import Awaitable, Callable

from orionis.support.facades import Cache


class ReportCache:

    async def read(
        self,
        report_id: str,
        load_report: Callable[[str], Awaitable[dict]],
    ) -> dict:
        async def resolve() -> dict:
            return await load_report(report_id)

        return await Cache.remember(f"report:{report_id}", 60, resolve)
```

There is no automatic coalescing of concurrent misses. Several requests can compute and overwrite the same key. See [locks](/en/cache/locks) for the available coordination mechanisms and their backend-specific limits.

A resolver exception propagates before the write. A backend exception also propagates. The method awaits `set` but does not inspect its boolean result: if the backend reports `False` without raising, `remember` still returns the freshly computed value.

<a id="repository-rememberforever"></a>

### `rememberForever`: resolve without a new expiry

```text
async rememberForever(key: str, resolver: Callable) -> Any
```

Equivalent to `remember(key, None, resolver)`, including callable handling, errors, and concurrency limits. The name means a miss is stored without an expiry; it does not guarantee permanent storage or remove an existing hit's TTL.

```python
from orionis.support.facades import Cache


class NavigationCache:

    async def items(self) -> list[dict]:
        return await Cache.rememberForever(
            "navigation:public:v1",
            lambda: [{"label": "Home", "url": "/"}],
        )
```

### Cache a missing result portably

The handling of a stored `None` differs between native backends:

| Operation on a live entry containing `None` | file / database | memory / Redis / Memcached |
| --- | --- | --- |
| `get` | Returns `None`. | Returns `None`. |
| `has` | `True`. | `True`. |
| `remember` / `rememberForever` | Treats it as a hit. | Re-runs the resolver because the aiocache read substitutes its default for a decoded `None`. |
| `pull` | Returns `None` and deletes the entry. | Returns `None` without deleting it. |

Cache an envelope when a missing record must itself be remembered across all stores:

```python
from collections.abc import Awaitable, Callable

from orionis.support.facades import Cache


class CustomerLookupCache:

    async def find(
        self,
        customer_id: int,
        lookup: Callable[[int], Awaitable[dict | None]],
    ) -> dict | None:
        async def resolve() -> dict:
            customer = await lookup(customer_id)
            return {"found": customer is not None, "value": customer}

        result = await Cache.remember(f"customer:{customer_id}", 60, resolve)
        return result["value"] if result["found"] else None
```

The dictionary itself is never `None`, so a negative lookup does not repeatedly call the source during its TTL.

## Conditional writes and read-then-delete

<a id="repository-add"></a>

### `add`: create only when absent

```text
async add(key: str, value: Any, ttl: float | None = None) -> bool
```

Uses the backend's conditional-add primitive instead of a separate existence check. Returns `True` if the backend call completes; returns `False` when that call raises `ValueError`, conventionally because a live key already exists. The repository catches all `ValueError` instances from this call; other exceptions propagate. It does not inspect a custom backend's returned boolean.

```python
from orionis.support.facades import Cache


class NotificationCache:

    async def mark_seen(self, notification_id: str) -> bool:
        return await Cache.add(f"notification:seen:{notification_id}", True, ttl=300)
```

A conflict on an existing key leaves its value unchanged. Atomic insertion still depends on the selected backend; it is not an exactly-once guarantee for a following email, database write, or other side effect.

<a id="repository-replace"></a>

### `replace`: update only a live entry

```text
async replace(key: str, value: Any, ttl: float | None = None) -> bool
```

Returns `True` when an existing entry accepts the replacement, or `False` when it is absent or the optimistic comparison loses a race. The new TTL replaces the previous expiry. It does not create a missing key.

**This method belongs to `CacheRepository`; `CacheManager` has no `replace` proxy.** Obtain a repository explicitly:

```python
from orionis.support.facades import Cache


class ReportCache:

    async def update_existing(self, report_id: str, report: dict) -> bool:
        repository = (await Cache.resolve()).store()
        return await repository.replace(f"report:{report_id}", report, ttl=60)
```

The repository uses a backend-provided `replace` when present. Otherwise, aiocache backends use `OptimisticLock` and a compare-and-set operation; a detected modification returns `False`. This protects the write operation, not an earlier read performed separately by application code. A custom backend without either mechanism raises `CacheStoreException`. Other backend or serialization errors propagate.

<a id="repository-pull"></a>

### `pull`: read, then remove

```text
async pull(key: str) -> Any
```

Returns the cached value, or `None` when absent. A hit is read first and then deleted; a miss skips deletion. The two steps are separate operations. Concurrent readers can receive the same value, and an intervening writer's value can be deleted. Do not use `pull` as an exclusive job claim or payment-consumption primitive. The stored-`None` difference is described above.

```python
from orionis.support.facades import Cache


class DraftPreviewCache:

    async def take(self, preview_id: str) -> dict | None:
        return await Cache.pull(f"draft-preview:{preview_id}")
```

If deletion raises, the exception propagates instead of returning the read value.

## Counters

<a id="repository-increment"></a>

### `increment`: add an integer delta

```text
async increment(key: str, amount: int = 1) -> int
```

`key` is required; `amount` defaults to `1`. Native implementations initialize an absent counter from the delta and preserve an existing counter's TTL. There is no TTL parameter. To start with an expiry, conditionally create an integer first:

```python
from orionis.support.facades import Cache


class DownloadCounter:

    async def record(self, day: str) -> int:
        key = f"downloads:{day}"
        await Cache.add(key, 0, ttl=86400)
        return await Cache.increment(key)
```

The initialization and increment are separate operations; a deletion or expiry between them can create a new counter without an expiry. Use integer values, rather than JSON strings containing digits, for consistent behavior.

<a id="repository-decrement"></a>

### `decrement`: subtract an integer delta

```text
async decrement(key: str, amount: int = 1) -> int
```

Delegates to the same backend increment primitive with `-amount`. Negative amounts reverse the operation; the repository does not validate the sign. An absent key is initialized from the negative delta when the backend supports it.

```python
from orionis.support.facades import Cache


class RetryBudgetCache:

    async def consume(self, job_id: str) -> int:
        key = f"retry-budget:{job_id}"
        await Cache.add(key, 5, ttl=300)
        return await Cache.decrement(key, 1)
```

### Counter boundaries by backend

| Backend | Relevant behavior |
| --- | --- |
| memory | Updates the in-process backend instance. It does not coordinate separate processes or separate memory backends. |
| file | Serializes a counter's read/modify/write with backend file locks. An existing expiry is preserved. |
| database | Uses conditional SQL updates and retries competing writes up to 25 times; exhausted contention raises `QueryException`. |
| Redis | Delegates to the native integer increment command. Nonnumeric stored values are rejected. |
| Memcached | Uses native increment/decrement for existing entries. Missing initialization is a separate write, and the adapter returns the delta when the SDK result is zero. |

In the current Memcached adapter, a decrement reaching zero can return `-amount` instead of the stored zero; a zero-valued increment result similarly falls back to `amount`. Read the stored value if that boundary matters, and do not make durable accounting depend on these cache return values.

Invalid counter values can raise backend errors, `TypeError`, or `ValueError`; coercion and numeric bounds are backend-specific. Cache counters do not participate automatically in the transaction that updates the source database.

<a id="repository-clear"></a>

## `clear`: flush a backend

```text
async clear() -> bool
```

Takes no arguments and returns the backend result converted to `bool`. **It does not apply the repository prefix.** Prefixes in other repositories do not protect their entries from this operation.

| Store | Scope of `clear` |
| --- | --- |
| memory | All entries in that backend instance. |
| file | Cache entry files in the configured directory, including entries from other prefixes. |
| database | Entries in the configured cache table; not the separate lock table. |
| Redis | `FLUSHDB` for the selected Redis database. |
| Memcached | `flush_all` for the selected service. |

Use this deliberately during maintenance; use `delete` for specific invalidation.

```python
from orionis.support.facades import Cache


class CacheMaintenance:

    async def reset_memory_store(self) -> bool:
        repository = (await Cache.resolve()).store("memory")
        return await repository.clear()
```

<a id="repository-lock"></a>

## `lock`: construct a coordination context

```text
lock(key: str, timeout: float | None = None) -> CacheLock
```

This factory is synchronous: do not `await repository.lock(...)`. It applies the prefix and returns an asynchronous context manager. `key` is required; `timeout` defaults to `None`. Its meaning and locking guarantees depend on the backend; the default is not a universal guarantee of an unlimited exclusive lock.

```python
from orionis.support.facades import Cache


class SummaryCache:

    async def read(self) -> dict:
        repository = (await Cache.resolve()).store()
        async with repository.lock("summary:build", timeout=5):
            return await repository.remember(
                "summary:value",
                30,
                lambda: {"total": 42},
            )
```

See [locks and concurrent regeneration](/en/cache/locks) before using this to coordinate expensive work across requests or processes.

## Default-store proxies

`CacheManager` delegates the thirteen asynchronous value operations above, excluding `replace`, to `store()`. Their arguments, defaults, results, and errors are unchanged. It also exposes the synchronous factory `lock(key: str, timeout: float | None = None) -> Any`, whose concrete result is `CacheLock`.

The [complete proxy map](/en/cache/manager-and-injection#manager-proxies) lists every manager signature and links to the corresponding operation here. A proxy does not add retries, fallback, or a transaction.

For the synchronous lock factory through the facade, use `manager = await Cache.resolve()` followed by `manager.lock(...)`. The asynchronous operations can be awaited directly through `Cache`.

`replace` is available on `ICacheRepository` and `CacheRepository`, not on `CacheManager`. The concrete `lock` factories are not declared by `ICacheManager` or `ICacheRepository`; account for that distinction when typing an injected contract. The [API reference](/en/cache/api-reference) lists the contracts and other public components.

## Errors, concurrency, and invalidation

- There is no automatic cache-to-database transaction or model-event invalidation. Coordinate persistent writes and invalidation in your service.
- A `has/get/set` sequence, `pull`, `remember`, and a batch write do not become one atomic operation by being called from the same coroutine.
- `add` catches backend `ValueError`; `replace` converts optimistic conflicts to `False`. Other errors generally propagate. File reads can treat unreadable or malformed entries as misses; the database backend decodes invalid cached JSON as `None`. That database row still exists: `has` can return `True` and `remember` can reuse the decoded `None` until expiry or deletion.
- Backend availability, serialization, and counter errors do not trigger an automatic switch to another store. Decide which read failures can be regenerated from the source and which writes must fail the request.
- A `False` write result is distinct from an exception. `remember` returns its computed value even when `set` reports `False`; it does not certify that another request can read the value afterward.

Continue with [configuration and stores](/en/cache/stores-and-drivers), [locks](/en/cache/locks), or the [cache overview](/en/cache).
