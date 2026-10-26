---
title: "Env reference and configuration operations"
description: "Env API, file and process values, reloads, validators and key generation while preparing configuration."
editUrl: true
lastUpdated: false
---

Use the environment component **only in configuration files**. This reference explains its operations for preparing those values; do not call `Env`, `env()` or `DotEnv` from controllers, middleware, commands, jobs or services at runtime. During application execution, consume the resolved configuration through `IApplication.config()`, as shown in [Bootstrap and JSON files](/en/environment/compiled-configuration#runtime-configuration).

For ordinary settings, edit `.env` and read it from a dataclass in `config/`: [Variables and types](/en/environment/typed-configuration). You do not need to write or reload the file through Python on every startup.

<a id="env-api"></a>
## Imports and contract

```python
from orionis.environment import Env, env
```

These are the two exports of the root package. `Env` implements `IEnv` through class methods and delegates to the same `DotEnv` singleton; you do not need `Env()` or a container binding. All its operations are synchronous and do not use `await`. `IEnv`, available in `orionis.environment.contracts.env`, declares the same five methods; it does not provide another source of values.

<a id="env-get"></a>
<a id="env-helper"></a>
## Read: Env.get() and env()

```text
Env.get(key: str, default: object | None = None) -> object
env(key: str, default: object | None = None) -> object
```

`key` is the exact variable name. Both validate the name, read `os.environ` and convert the text according to the [typing rules](/en/environment/typed-configuration). The helper delegates directly to `Env.get()` and accepts the same two arguments; it has no third conversion argument.

You can use either form in the fields of your configuration file:

```python
# config/reports.py
from dataclasses import dataclass, field
from orionis.environment import Env, env


@dataclass(frozen=True, kw_only=True)
class Reports:
    limit: int = field(default_factory=lambda: Env.get("REPORT_LIMIT", 100))
    region: str = field(default_factory=lambda: env("REPORT_REGION", "eu"))
```

With `REPORT_LIMIT=int:50`, `limit` receives the integer `50`. The default is returned exactly as supplied **only when the key does not exist in the process**; it does not convert an incompatible value, replace an already stored `None` or empty string, or validate the field annotation by itself. An invalid name raises `TypeError` or `ValueError`; a recognized prefix with invalid content can raise conversion errors instead of returning the default.

<a id="env-set"></a>
## Write: Env.set()

The declared signature is:

```text
Env.set(
    key: str,
    value: str | float | bool | list | dict | tuple | set,
    type_hint: str | EnvironmentValueType | None = None,
    *,
    only_os: bool = False,
) -> bool
```

| Parameter | Effect |
|---|---|
| `key` | Required. Name validated with the same format as `get()`. |
| `value` | Required. Value serialized before storage. |
| `type_hint` | Optional, `None`. A type name or an `EnvironmentValueType` member selects explicit serialization with a prefix. |
| `only_os` | Keyword-only, `False`. With `True`, updates only `os.environ`; it does not write the file or the `all()` snapshot. |

Without `type_hint`, strings are trimmed with `strip()`, booleans are written as `true`/`false`, numbers as text and collections through `repr()`. Although the annotation does not list `int` or `None`, the actual serializer accepts integers and converts `None` to `null` when no hint is supplied. Other objects fall back to `str()`; do not assume that reading them will preserve their type.

With a hint, `ValidateTypes` accepts `str`, `int`, `float`, `bool`, `list`, `dict`, `tuple` and `set` values. For example, `"INT"` is normalized to `"int"`; spaces in the name are not removed. That validator rejects `None`, `Path` or `bytes` when a hint is supplied, even though the lower-level converter has other capabilities. For `path` or `base64`, use compatible text. The [ten types and the converter](/en/environment/typed-configuration) describe their restrictions.

This helper illustrates an explicit write while preparing configuration; **defining it does not execute it**. Do not call it from business code or add it as an unconditional write on every startup:

```python
# config/reports.py: preparation helper, separate from the previous dataclass.
from orionis.environment import Env
from orionis.environment.enums import EnvironmentValueType


def persist_report_limit(value: int) -> bool:
    return Env.set("REPORT_LIMIT", value, EnvironmentValueType.INT)
```

Calling it with `50` during that preparation stores a value equivalent to `REPORT_LIMIT='int:50'`, updates the file snapshot and updates the process environment. With `only_os=True`, `Env.get()` would see the new value, but `Env.all()` would retain the previous one.

It returns `True` if the flow completes; this is not a transaction between the file, snapshot and process. An unknown hint raises `RuntimeError`, an incompatible hint or value type can raise `TypeError`, and failed conversion can raise `ValueError`. Access and write failures propagate. It provides neither locking between processes nor rollback of partial changes.

<a id="env-unset"></a>
## Remove: Env.unset()

```text
Env.unset(key: str, *, only_os: bool = False) -> bool
```

Removes the entry from `.env`, the snapshot and `os.environ`. With `only_os=True`, it only removes the process entry: a later `all()` call can still show the file entry, and reloading can restore it to the process. A valid absent key also returns `True`; this does not indicate whether an entry previously existed. Invalid names raise `TypeError` or `ValueError`, and file errors propagate.

An explicit cleanup helper within configuration can be:

```python
from orionis.environment import Env


def remove_obsolete_report_option() -> bool:
    return Env.unset("REPORT_LEGACY_OPTION")
```

The function acts only when deliberately called during configuration preparation; it is not a cleanup mechanism for each request.

<a id="env-all"></a>
## Inspect the file: Env.all()

```text
Env.all() -> dict[str, Any]
```

Returns a new dictionary containing entries from the **file snapshot** and their converted values. It does not enumerate all of `os.environ`, read the disk again or include a variable created only with `only_os=True`. Collections are parsed again, so they do not reference the internal snapshot.

To check for keys while preparing configuration without printing their values:

```python
from orionis.environment import Env


def has_report_configuration() -> bool:
    names = Env.all().keys()
    return "REPORT_LIMIT" in names and "REPORT_REGION" in names
```

An invalid file value can make conversion of the whole mapping fail. `all()` can also contain keys with `None` when they appear without an assignment in the file. Do not dump its result into logs: it includes credential values present in `.env`.

<a id="env-reload"></a>
## Reload: Env.reload()

```text
Env.reload() -> bool
```

Loads the same file again with precedence over process values and rebuilds the snapshot; it retains the instance and selected path. A successful operation returns `True`. If reloading fails, `DotEnv.reload()` wraps the error in `RuntimeError`, which the facade allows to propagate. The facade returns `False` only if obtaining or constructing the singleton fails with `OSError` or `ValueError` before its reload is called.

```python
from orionis.environment import Env


def refresh_configuration_source() -> bool:
    return Env.reload()
```

This helper belongs exclusively to configuration preparation. Reloading **does not rebuild** previously instantiated dataclasses, services or compiled configuration files. It also does not remove process keys that you manually deleted from the file: they can disappear from `all()` and remain visible through `get()`. To apply changes to the application, follow [the invalidation and restart workflow](/en/environment/compiled-configuration#refresh-compiled-configuration).

<a id="dotenv-service"></a>
## DotEnv and file selection

```text
DotEnv(path: str | None = None) -> None
```

The implementation lives in `orionis.environment.core.dot_env`. The first access creates one instance per process. Without a path it uses `.env` in the working directory; an explicit path is expanded and resolved. If the file is absent, it attempts to create it; it does not automatically create its parent directories.

It loads the file with `override=True` and prepares its snapshot. Later calls reuse the instance: passing another path does not select a second file. `Env` and `env()` share that selection. The facade does not expose an argument for choosing different files per lookup; keep the process in the project root while preparing its configuration.

`DotEnv` provides the same five methods: `get`, `set`, `unset`, `all` and `reload`; their parameters and effects match those described above. Its `all()` is annotated as `dict`, and its `reload()` propagates `RuntimeError` without the facade's additional handling. A `threading.Lock` serializes these operations within the process; it is not a distributed lock. The component provides no HTTP API, async API, per-request injection API or reloadable runtime configuration system.

<a id="environment-validators"></a>
## Key and hint validators

Both callables are exported from `orionis.environment.validators`:

```text
ValidateKeyName(key: str) -> str
ValidateTypes(
    *,
    value: str | float | bool | list | dict | tuple | set,
    type_hint: str | EnvironmentValueType | None = None,
) -> str
```

`ValidateKeyName` is a function alias: it returns the name unchanged if it matches `[A-Z][A-Z0-9_]*`. It does not convert it to uppercase or remove spaces. It rejects types other than `str` and invalid formats.

`ValidateTypes` is a callable instance. It checks accepted Python types and returns the normalized hint, or the inferred type name when omitted. **It does not perform conversion or check whether a string is a valid integer**. A hint such as `"unknown"` raises `RuntimeError`; an unsupported value or hint type raises `TypeError`.

```python
# Auxiliary checks while preparing config/.
from orionis.environment.validators import ValidateKeyName, ValidateTypes

assert ValidateKeyName("REPORT_LIMIT") == "REPORT_LIMIT"
assert ValidateTypes(value="50", type_hint="INT") == "int"
assert ValidateTypes(value=["eu", "us"]) == "list"
```

To convert content, use [EnvironmentCaster](/en/environment/typed-configuration#caster-construction); for ordinary reads, use `Env.get()` or `env()`.

<a id="environment-key-generator"></a>
## APP_KEY generation

```text
SecureKeyGenerator.generate(cipher: str | Cipher = Cipher.AES_256_CBC) -> str
```

`SecureKeyGenerator`, in `orionis.environment.key.key_generator`, generates random bytes with `os.urandom` and returns text with the `base64:` prefix. `KEY_SIZES` maps the four options to their size:

| Cipher or exact text | Bytes generated |
|---|---|
| `Cipher.AES_128_CBC` / `"AES-128-CBC"` | 16 |
| `Cipher.AES_256_CBC` / `"AES-256-CBC"` | 32 |
| `Cipher.AES_128_GCM` / `"AES-128-GCM"` | 16 |
| `Cipher.AES_256_GCM` / `"AES-256-GCM"` | 32 |

An unknown algorithm string raises `ValueError`; its case is not normalized. Generating a key does not persist it by itself. The native `App` configuration entity uses this generator when the key is absent and writes `APP_KEY` during validation.

Do not generate a new key whenever your configuration is constructed: retain the existing key so previously encrypted data can still be decrypted. For an explicit operation, use the [key:generate command](/en/console/built-in-application#command-key-generate) and see [Hashing and encryption](/en/cryptography/encryption).
