---
title: "Cache"
description: "Cache application results that can be rebuilt, such as catalog summaries, lookup data, or expensive calculations. Keep the permanent data in your database; decide how long a…"
editUrl: true
lastUpdated: false
---

Cache application results that can be rebuilt, such as catalog summaries, lookup data, or expensive calculations. Keep the permanent data in your database; decide how long a cached result may be stale and when to invalidate it.

## Use the configured cache in your application

Start with the file store included in a normal installation. Set these values in your application's `.env` before bootstrap:

```dotenv
CACHE_STORE=file
CACHE_PREFIX=my-app
```

The default directory is `storage/framework/cache/data` and must be writable by the application process. You do not need Redis or a separate cache package for this store. `config/cache.py` defines the configured stores and their options.

Call the `Cache` facade from an async controller, command, job, or service after the application has booted:

```python
from orionis.support.facades import Cache


async def remember_preferences(user_id: int, preferences: dict) -> dict:
    key = f"user:{user_id}:preferences:v1"
    await Cache.set(key, preferences, ttl=300)
    return await Cache.get(key)


async def invalidate_preferences(user_id: int) -> None:
    await Cache.delete(f"user:{user_id}:preferences:v1")
```

The first function stores a JSON-compatible dictionary for 300 seconds and immediately returns it. After expiry or invalidation, `get()` returns `None`. Authorize the user and persist preference changes before caching them; this example only demonstrates cache operations.

For cache-aside, use `await Cache.remember(key, 300, resolver)`: the zero-argument resolver runs only on a miss and may be async. Concurrent misses can still invoke it more than once. Use the [regeneration guidance](/en/services/cache/stores-and-locks) when duplicate computation matters.

## Choose the next step

1. [Store and regenerate values](/en/services/cache/caching-values): keys, TTL in seconds, cache-aside, batches, and counters.
2. [Configure stores and locks](/en/services/cache/stores-and-locks): choose memory, file, Redis, Memcached, or database according to sharing requirements.
3. [Cache source-derived artifacts](/en/services/cache/source-artifacts): the separate synchronous `FileBasedCache` API for dictionaries compiled from source files.

`FileBasedCache` is for compiled artifacts; use the `Cache` facade for everyday application values. The two APIs have different serialization and invalidation rules.
