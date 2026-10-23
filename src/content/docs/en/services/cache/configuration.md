---
title: "Cache configuration"
description: "Reference for config/cache.py: stores, drivers, prefixes, environment variables, and validation for every backend."
editUrl: true
lastUpdated: false
---

`config/cache.py` defines `BootstrapCache`, an immutable dataclass extending `Cache`. It selects the default store, key prefix, and parameters for the five built-in backends. The manager reads this configuration when constructed and builds each repository on first selection.

<a id="config-cache"></a>

## General configuration: Cache

| Field | Type and default | Effect |
|---|---|---|
| `default` | `Drivers \| str`; `CACHE_STORE`, default `file`. | Repository used by manager operations and `store()` without a name. |
| `prefix` | `str`; `CACHE_PREFIX`, default `""` in `BootstrapCache`. | Prepends `<prefix>:` to each key when nonempty. |
| `stores` | `Stores \| dict`; `Stores(...)` factory. | Options for each backend. Dictionaries are converted into entities. |

The base `Cache` entity defaults to the `"orionis"` prefix when constructed directly. The included `BootstrapCache` overrides that with `""`. In both cases, a value defined in `CACHE_PREFIX` takes precedence.

```dotenv
CACHE_STORE=file
CACHE_PREFIX=shop
```

With this prefix, `products:featured` reaches the backend as `shop:products:featured`. The prefix is not trimmed and no alternative separator is added: `prefix="shop:"` produces `shop::products:featured`. An empty string is valid; other types raise `TypeError`.

The prefix separates key names but **does not restrict `clear()`**. That operation receives no prefix and clears the selected backend's data. Redis affects the configured database; Memcached affects the instance. Review [scope and isolation](/en/services/cache/stores-and-locks#namespace) before sharing a backend.

<a id="config-drivers"></a>

### Store names

`Drivers` exports `FILE`, `MEMORY`, `REDIS`, `MEMCACHED`, and `DATABASE`, with values `file`, `memory`, `redis`, `memcached`, and `database`.

`default` accepts an enum member or a string. Strings are trimmed and normalized: `" REDIS "` becomes `"redis"`. Unknown names raise `ValueError`; types other than strings or `Drivers` raise `TypeError`.

Explicit selection through `manager.store("redis")` does not apply that normalization; use canonical names. `store(None)` and `store("")` select the default. Unknown names raise `CacheStoreException` without switching to `file`.

<a id="config-stores"></a>

## Stores entries

Import entities from the public module:

```python
from orionis.foundation.config.cache import (
    Cache, Database, Drivers, File, Memcached, Memory, Redis, Stores,
)
```

| Field | Accepted value | When omitted |
|---|---|---|
| `file` | `File \| dict`. | New `File()` entity. Does not accept `None`. |
| `memory` | `Memory \| dict \| None`. | New `Memory()` entity. |
| `redis` | `Redis \| dict \| None`. | New `Redis()` entity. |
| `memcached` | `Memcached \| dict \| None`. | New `Memcached()` entity. |
| `database` | `Database \| dict \| None`. | New `Database()` entity. |

Each dictionary is converted into its entity and validated. Factories create independent instances rather than sharing mutable configuration.

`Stores(redis=None)`, `Stores(memcached=None)`, and `Stores(database=None)` leave those entries unconfigured; selecting them raises `CacheStoreException`. `memory=None` is accepted by the entity, but the manager builds its memory backend without reading that field; it does not disable `store("memory")`.

Entries are fixed. Adding a name such as `secondary` raises `TypeError` when constructing `Stores`. The manager has no `extend()` registry for stores. An entry's `driver` field cannot redirect it arbitrarily: the manager chooses the implementation by the requested store name.

<a id="config-file"></a>

## Files: File

| Field | Variable and default | Type and validation |
|---|---|---|
| `driver` | No variable; `"file"`. | Must be exactly `"file"`; other values raise `TypeError`. |
| `path` | `CACHE_FILE_PATH`; `"storage/framework/cache/data"`. | Nonempty `str`, not whitespace-only. Wrong type: `TypeError`; empty path: `ValueError`. |

Relative paths resolve from `app.basePath`; absolute paths are preserved and normalized by the backend using `resolve()`. The directory is created when constructing the backend, rather than when constructing `File(...)`.

```dotenv
CACHE_STORE=file
CACHE_FILE_PATH=storage/framework/cache/data
```

Use a dedicated cache directory. Entries are JSON files named from their keys; `clear()` deletes the directory's `.json` and `.tmp` files. The path also identifies the file-cache lock namespace within the same event loop.

<a id="config-memory"></a>

## Memory: Memory

| Field | Variable and default | Type and validation |
|---|---|---|
| `driver` | No variable; `"memory"`. | Must be exactly `"memory"`; other values raise `TypeError`. |

This entity exposes no connection parameters, capacity limit, or eviction policy. Each backend owns its in-memory data.

```dotenv
CACHE_STORE=memory
```

<a id="config-redis"></a>

## Redis: Redis

| Field | Variable and default | Type and validation |
|---|---|---|
| `driver` | No variable; `"redis"`. | Must be exactly `"redis"`; other values raise `ValueError`. |
| `endpoint` | `REDIS_HOST`; `"127.0.0.1"`. | `str \| None`. `None` or `""` resolves to `127.0.0.1` when constructing the backend. |
| `port` | `REDIS_PORT`; `6379`. | `int` from 1 to 65535; booleans and numeric strings are rejected. |
| `db` | `REDIS_DB`; `0`. | Nonnegative `int`; booleans are rejected. |
| `password` | `REDIS_PASSWORD`; `None`. | `str \| None`; an empty string reaches the client as `None`. |

Invalid types raise `TypeError`; out-of-range ports or a negative `db` raise `ValueError`. Validation checks the type of `endpoint`, rather than connectivity. Whitespace-only strings are not normalized to localhost.

```dotenv
CACHE_STORE=redis
CACHE_PREFIX=shop
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
```

Set `REDIS_PASSWORD` if the server requires it. Exposed options do not include an ACL username, connection URL, TLS, Sentinel, or Cluster. The built-in constructor passes the listed options to the client and configures RESP 2. A server with different requirements needs an appropriate backend integration; unknown dictionary keys do not extend this entity.

<a id="config-memcached"></a>

## Memcached: Memcached

| Field | Variable and default | Type and validation |
|---|---|---|
| `driver` | No variable; `"memcached"`. | Must be exactly `"memcached"`; other values raise `ValueError`. |
| `endpoint` | `MEMCACHED_HOST`; `"127.0.0.1"`. | `str \| None`. `None` or `""` resolves to `127.0.0.1`. |
| `port` | `MEMCACHED_PORT`; `11211`. | `int` from 1 to 65535; booleans and numeric strings are rejected. |

Wrong types raise `TypeError`; out-of-range ports raise `ValueError`. The entity exposes no authentication, TLS, server list, or separate client namespace.

```dotenv
CACHE_STORE=memcached
CACHE_PREFIX=shop
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11211
```

<a id="config-database"></a>

## Database: Database

| Field | Variable and default | Type and validation |
|---|---|---|
| `driver` | No variable; `"database"`. | Must be exactly `"database"`; other values raise `ValueError`. |
| `connection` | `DB_CACHE_CONNECTION`; `None`. | `str \| None`. Connection name from the Database system. `None` uses default connection resolution. |
| `table` | `DB_CACHE_TABLE`; `"cache"`. | `str` matching `[a-z_]+`: lowercase ASCII letters and underscores only, without digits or spaces. |
| `lock_table` | `DB_CACHE_LOCK_TABLE`; `"cache_locks"`. | The same name format or `None`; the backend uses `cache_locks` when receiving `None`. |

Wrong types raise `TypeError`; invalid table names raise `ValueError`. Use **different names** for entries and locks. Although the entity does not reject matching names, the tables require different columns and cannot validly serve both purposes.

```dotenv
CACHE_STORE=database
CACHE_PREFIX=shop
DB_CACHE_TABLE=application_cache
DB_CACHE_LOCK_TABLE=application_cache_locks
```

Set `DB_CACHE_CONNECTION` to a name declared in `config/database.py` to use a specific connection. Entries and locks share that connection; there is no `lock_connection` field.

Tables are created lazily on the first I/O operation, preserving existing tables. The connection must be able to create missing tables. The backend does not migrate incompatible existing structures; reserve dedicated names with the structure described under [the database driver](/en/services/cache/stores-and-locks#driver-database). It requires enforced unique keys and rejects connections such as Amazon Redshift that do not provide that guarantee.

## Customize the complete file

This example retains typed entities and environment reads, changes the default to memory, and keeps factories for the other entries:

```python
from dataclasses import dataclass, field
from orionis.environment import Env
from orionis.foundation.config.cache import (
    Cache, Drivers, File, Memory, Stores,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapCache(Cache):
    default: Drivers | str = field(
        default_factory=lambda: Env.get("CACHE_STORE", Drivers.MEMORY),
    )
    prefix: str = field(
        default_factory=lambda: Env.get("CACHE_PREFIX", "shop"),
    )
    stores: Stores | dict = field(
        default_factory=lambda: Stores(
            file=File(path=Env.get("CACHE_FILE_PATH", "storage/framework/cache/data")),
            memory=Memory(),
        ),
    )
```

Omitted entries retain their defaults and environment variables. Pass `redis=None` explicitly to disable Redis, for example. The manager retains constructed repositories: changing the environment later does not rebuild them or change their prefixes.

### Equivalent dictionaries

```python
from orionis.foundation.config.cache import Cache


settings = Cache(
    default="memory",
    prefix="shop",
    stores={
        "file": {"driver": "file", "path": "storage/framework/cache/data"},
        "memory": {"driver": "memory"},
        "redis": None,
        "memcached": None,
        "database": None,
    },
)
```

Nested conversions retain validation and reject unknown fields. Use actual integers for ports and `db` in Python dictionaries; in `.env`, `Env.get(...)` reads values before entity construction. Credentials, available database connections, and service connectivity are checked when resolving or using them, rather than during type validation.

See [drivers and stores](/en/services/cache/stores-and-locks) to choose a scope and [facades and injection](/en/services/cache) to use them from your application components.
