---
title: File-Based Cache
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# File-Based Cache

Orionis Framework includes a file-based caching system that goes beyond simple key-value storage. Unlike conventional caching solutions that reduce everything to plain strings, Orionis **preserves Python types across serialization boundaries** — a `Path` is restored as a `Path`, a `Decimal` as a `Decimal`, and a `datetime` as a `datetime`. Combined with **automatic invalidation driven by source-file monitoring**, the cache provides a reliable, zero-configuration mechanism for persisting and recovering structured data.

---

## FileBasedCache

`FileBasedCache` provides a dictionary-oriented cache backed by a single JSON file on disk. It supports **automatic invalidation** when monitored files or directories change, so you never serve stale data.

```python
from pathlib import Path
from orionis.services.cache.file_based_cache import FileBasedCache
```

### Creating a Cache

```python
cache = FileBasedCache(
    path=Path("storage/cache"),
    filename="app_cache.json",
    monitored_dirs=[Path("app/models"), Path("app/services")],
    monitored_files=[Path("config/app.py")],
)
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `path` | `Path` | Yes | Directory where the cache file will be stored. Created automatically if it does not exist. |
| `filename` | `str` | Yes | Name of the cache file inside `path`. |
| `monitored_dirs` | `list[Path] \| None` | No | Directories whose `.py` files are watched for changes. |
| `monitored_files` | `list[Path] \| None` | No | Individual files watched for changes. |

> **Note:** The `path` parameter must be a `Path` object. Passing a raw string raises `TypeError`.

### Saving Data

The `save()` method writes a dictionary to disk:

```python
version, sources_hash = cache.save({
    "routes": ["/api/users", "/api/posts"],
    "compiled_at": "2026-03-31T10:00:00",
})
```

**Return value:** a tuple of `(cache_version, sources_hash)` — useful for logging or debugging.

The cache applies a **skip-on-unchanged** optimization: if the existing cache already contains the same data and no monitored source has changed, the file is **not rewritten**. This avoids unnecessary disk I/O.

```python
cache.save({"key": "value"})  # writes to disk
cache.save({"key": "value"})  # no-op — file untouched
cache.save({"key": "new"})    # writes to disk — data changed
```

> Only `dict` values are accepted. Passing any other type raises `TypeError`.

### Retrieving Data

The `get()` method returns the cached dictionary only if the cache is still valid:

```python
data = cache.get()
if data is not None:
    print(data["routes"])
```

`get()` returns `None` in any of these situations:

- The cache file does not exist (first run or after clearing).
- A monitored file or directory has changed since the last save.
- The cache was created by an incompatible version of the framework.

When `None` is returned, you simply recompute and save the data — the cache handles the rest.

### Clearing the Cache

The `clear()` method removes the cache file from disk:

```python
removed = cache.clear()
# True  → file existed and was removed
# False → file did not exist
```

Calling `clear()` twice is safe — the second call returns `False` without raising an error.

---

## Automatic Invalidation

The most distinctive feature of `FileBasedCache` is its **source-aware invalidation**. The cache automatically detects when monitored dependencies change and invalidates itself — no manual intervention required.

### How It Works

When you call `save()`, the cache takes a fingerprint of all monitored sources. On every `get()`, this fingerprint is recalculated and compared. If anything has changed, the cache is treated as stale and `None` is returned.

| Source | What Is Watched |
|---|---|
| `monitored_dirs` | All `*.py` files recursively inside each directory |
| `monitored_files` | Each file individually |

**Key behaviors:**

- Non-existent directories and files are silently ignored — they do not cause errors.
- The fingerprint is temporarily cached for rapid successive calls, avoiding redundant computation on high-frequency reads.

### Example — Configuration Cache

```python
from pathlib import Path
from orionis.services.cache.file_based_cache import FileBasedCache

config_cache = FileBasedCache(
    path=Path("storage/cache"),
    filename="config.json",
    monitored_files=[Path("config/app.py"), Path("config/database.py")],
)

# First run: no cache → compute and save
data = config_cache.get()
if data is None:
    data = expensive_config_computation()
    config_cache.save(data)

# Subsequent runs: cache is valid → instant retrieval
# If config/app.py or config/database.py changes → cache auto-invalidates
```

---

## Serializer

Orionis includes a standalone `Serializer` utility that you can use independently of `FileBasedCache`. It converts Python objects to JSON strings and back, **preserving their original types** through the round-trip.

```python
from orionis.services.cache.serializer import Serializer
```

### Supported Types

The serializer natively supports more than 18 Python types with full round-trip fidelity:

| Python Type | Preservation |
|---|---|
| `str`, `int`, `float`, `bool`, `None` | Exact |
| `Path` | Restored as `Path` |
| `bytes` | Encoded and restored |
| `datetime`, `date`, `time` | ISO 8601 round-trip |
| `timedelta` | Full precision |
| `Decimal` | Full precision |
| `UUID` | Canonical form |
| `tuple` | Restored as `tuple` (not `list`) |
| `set`, `frozenset` | Restored with correct type |
| `complex` | Full precision |
| `type` | Restored via qualified module path |
| `dict`, `list` | Recursive — nested types are also preserved |

> Unsupported types raise `TypeError` during serialization. Corrupted payloads raise `ValueError` on deserialization.

### In-Memory Serialization

```python
from pathlib import Path
from orionis.services.cache.serializer import Serializer

# Serialize to JSON string
raw = Serializer.dumps({"path": Path("/etc/config"), "count": 42})

# Deserialize back to Python — types are preserved
data = Serializer.loads(raw)
print(type(data["path"]))  # <class 'pathlib.PosixPath'>
```

The optional `indent` parameter produces human-readable output:

```python
raw = Serializer.dumps({"key": "value"}, indent=2)
```

### File I/O

The `Serializer` also provides direct file operations with **safe write semantics** — the target file is never left in a partial or corrupted state, even during unexpected process termination:

```python
from pathlib import Path
from orionis.services.cache.serializer import Serializer

file = Path("storage/data.json")

# Write safely to file
Serializer.dumpToFile({"version": 1, "active": True}, file)

# Read from file — returns None if the file is missing or empty
data = Serializer.loadFromFile(file)
```

| Method | Signature | Description |
|---|---|---|
| `dumps` | `(data, indent=None) → str` | Serialize to JSON string |
| `loads` | `(raw: str) → Any` | Deserialize from JSON string |
| `dumpToFile` | `(data, file_path: Path) → None` | Safe write to file |
| `loadFromFile` | `(file_path: Path) → Any \| None` | Read from file; `None` if missing/empty |

### Nested Structures

The serializer handles arbitrarily nested structures. Every element is recursively processed, preserving types at every level:

```python
import decimal
from datetime import datetime
from pathlib import Path
from orionis.services.cache.serializer import Serializer

original = {
    "timestamp": datetime(2026, 3, 31, 12, 0, 0),
    "amount": decimal.Decimal("99.99"),
    "files": [Path("/tmp/a.txt"), Path("/tmp/b.txt")],
    "flags": (True, False, None),
}

raw = Serializer.dumps(original)
restored = Serializer.loads(raw)

assert restored["timestamp"] == original["timestamp"]
assert isinstance(restored["amount"], decimal.Decimal)
assert isinstance(restored["flags"], tuple)
```

---

## Complete Usage Example

The following example demonstrates a typical workflow: creating a cache with file monitoring, saving computed data, and retrieving it with automatic invalidation.

```python
from pathlib import Path
from orionis.services.cache.file_based_cache import FileBasedCache

# Define the cache with source monitoring
cache = FileBasedCache(
    path=Path("storage/cache"),
    filename="routes.json",
    monitored_dirs=[Path("app/http/controllers")],
    monitored_files=[Path("routes/web.py"), Path("routes/api.py")],
)

# Try to load from cache
routes = cache.get()

if routes is None:
    # Cache miss or invalidated — recompute
    routes = discover_routes()
    cache.save(routes)

# Use the routes
register(routes)

# When needed, clear explicitly
cache.clear()
```

**Lifecycle:**

1. **First run** — no cache exists → `get()` returns `None` → routes are computed and saved.
2. **Subsequent runs** — cache is valid, sources unchanged → `get()` returns cached data instantly.
3. **Source changes** — a controller in `app/http/controllers/` is modified → `get()` returns `None` → routes are recomputed automatically.
