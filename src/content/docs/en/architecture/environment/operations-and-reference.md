---
title: "Persistence, reloads, and Env reference"
description: "Use this reference when you need to update or reload environment values programmatically. The usual application workflow is to edit .env, read values from config/, and restart…"
editUrl: true
lastUpdated: false
---

Use this reference when you need to update or reload environment values programmatically. The usual application workflow is to edit `.env`, read values from `config/`, and restart the application. `Env.set()` persists by default, so an HTTP handler or command using it changes the project's file as well as the current process; use `only_os=True` for a deliberately process-local override.

## Public API

### `Env.get(key, default=None)` and `env(key, default=None)`

Validate the uppercase key and return its parsed process value, or the exact default when absent. `env()` is a thin one-call delegate to `Env.get`.

### `Env.set(key, value, type_hint=None, *, only_os=False)`

Serializes the value, optionally with an explicit typed prefix. By default it updates `.env`, the file cache, and `os.environ`; `only_os=True` updates only the current process. Success returns `True`.

### `Env.unset(key, *, only_os=False)`

Removes the entry from file/cache and process, or from the process only. Missing valid keys are treated as successfully absent and return `True`; `python-dotenv` may emit an informational message for a missing file entry.

### `Env.all()` and `Env.reload()`

`all()` returns a new dictionary containing parsed file-backed cache values. `reload()` loads the file again with override enabled and rebuilds that cache. A reload failure is wrapped by `DotEnv` as `RuntimeError` and propagates.

### Advanced components

`EnvironmentCaster`, `EnvironmentValueType`, `DotEnv`, and `SecureKeyGenerator` live in their respective subpackages. They are useful for framework integration and tests, but only `Env` and `env` are exported by `orionis.environment`.

## Integration with Orionis

Framework configuration dataclasses call `Env.get` in their default factories, so environment parsing happens before providers consume normalized config. Application key validation also uses `SecureKeyGenerator` and persists a generated `APP_KEY` through `Env.set` when absent.

Console, HTTP, database, cache, queue, session, mail, logging, view, MCP, and testing configuration all depend on this module. It has no service provider because its singleton facade is usable during early bootstrap.

## Errors and edge cases

- Keys must be uppercase and may contain only uppercase letters, digits, and underscores; invalid keys raise `TypeError` or `ValueError`.
- Unknown explicit type hints passed to `Env.set` raise `RuntimeError`; incompatible values raise `TypeError` or `ValueError`.
- Empty stored strings parse as `None`, which differs from explicit `str:` behavior.
- `base64:` uses strict validation; malformed payloads fail instead of returning undecoded text.
- `only_os=True` does not update the file cache, so `get()` can see the value while `all()` does not.
- Values returned by `all()` are newly collected, but nested mutable values are newly parsed rather than shared cache objects.
- The module stores secrets as plain `.env` text; Base64 is encoding, not encryption.

## Performance and concurrency

All `DotEnv` operations use one class-level `threading.Lock`, protecting process/file/cache consistency but serializing reads and writes across threads. Async callers should avoid frequent persistent writes on an event-loop hot path because file access is synchronous.

File entries are cached for `all()`, typed primitive parsing has a fast path, key validation uses an LRU of 512 names, and type-hint normalization uses an LRU of 64 entries. `get()` still reads `os.environ` so process-only updates remain visible immediately.

## Compatibility

Orionis declares Python 3.14+ and `python-dotenv` 1.2.3+. Persisted path strings use POSIX separators across platforms; collection syntax is Python-literal based rather than JSON.

## Module structure

| Path | Responsibility |
|---|---|
| `facade.py`, `functions.py` | Public `Env` class methods and `env()` helper. |
| `core/dot_env.py` | File lifecycle, process synchronization, cache, parsing, and locking. |
| `dynamic/caster.py` | Typed serialization and deserialization. |
| `enums/value_type.py` | Supported `EnvironmentValueType` values. |
| `validators/` | Variable-name and type-hint validation with bounded caches. |
| `key/key_generator.py` | Random Laravel-compatible AES application keys. |
| `contracts/` | Abstract environment and caster interfaces. |

## Reference and next steps

[dot_env.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/environment/core/dot_env.py) · [key_name.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/environment/validators/key_name.py) · [key_generator.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/environment/key/key_generator.py)

[Return to the module index](/en/architecture/environment).
