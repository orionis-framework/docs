---
title: "Variables and typed configuration"
description: "Define and convert all ten environment value types supported by Orionis from configuration files."
editUrl: true
lastUpdated: false
---

Values in `.env` are stored as text, but `Env.get()` and `env()` can return Python types. Define the appropriate format in the file and read it **exclusively from `config/`**. During runtime, use resolved configuration as described in [Environment](/en/environment).

## A complete example

This `.env` uses all ten available prefixes:

```dotenv
REPORTS_NAME="str:Weekly report"
REPORTS_LIMIT=int:100
REPORTS_TIMEOUT=float:2.5
REPORTS_ENABLED=bool:on
REPORTS_RECIPIENTS="list:['team@example.test', 'ops@example.test']"
REPORTS_OPTIONS="dict:{'retries': 3, 'notify': True}"
REPORTS_WINDOW="tuple:(8, 18)"
REPORTS_TAGS="set:{'daily', 'internal'}"
REPORTS_DIRECTORY=path:storage/reports
REPORTS_BANNER=base64:SGVsbG8=
```

Create `config/reports.py` with the corresponding reads:

```python
from dataclasses import dataclass, field
from orionis.environment import env


@dataclass(frozen=True, kw_only=True)
class Reports:
    name: str = field(
        default_factory=lambda: env("REPORTS_NAME", "Weekly report"),
    )
    limit: int = field(
        default_factory=lambda: env("REPORTS_LIMIT", 100),
    )
    timeout: float = field(
        default_factory=lambda: env("REPORTS_TIMEOUT", 2.5),
    )
    enabled: bool = field(
        default_factory=lambda: env("REPORTS_ENABLED", False),
    )
    recipients: list[str] = field(
        default_factory=lambda: env("REPORTS_RECIPIENTS", []),
    )
    options: dict[str, object] = field(
        default_factory=lambda: env("REPORTS_OPTIONS", {}),
    )
    window: tuple[int, int] = field(
        default_factory=lambda: env("REPORTS_WINDOW", (8, 18)),
    )
    tags: set[str] = field(
        default_factory=lambda: env("REPORTS_TAGS", set()),
    )
    directory: str = field(
        default_factory=lambda: env("REPORTS_DIRECTORY", "storage/reports"),
    )
    banner: str | bytes = field(
        default_factory=lambda: env("REPORTS_BANNER", ""),
    )
```

The factories build values for each configuration instance. Once the application has been created, read keys such as `app.config("reports.limit")` and `app.config("reports.options")`; do not repeat environment reads from application components.

The results described on this page are those of environment reads. Review [compiled configuration serialization](/en/environment/compiled-configuration) before relying on preservation of types such as tuples, sets or bytes through JSON storage.

<a id="env-types"></a>
## Supported prefixes

Write the prefix in lowercase with no spaces before `:`. `int:100` is recognized; `INT:100` and `int :100` remain text when read with `Env.get()`.

| Prefix | Result type | Example result |
|---|---|---|
| `str:` | `str` | `"Weekly report"` |
| `int:` | `int` | `100` |
| `float:` | `float` | `2.5` |
| `bool:` | `bool` | `True` |
| `list:` | `list` | `["team@example.test", "ops@example.test"]` |
| `dict:` | `dict` | `{"retries": 3, "notify": True}` |
| `tuple:` | `tuple` | `(8, 18)` |
| `set:` | `set` | `{"daily", "internal"}` |
| `path:` | `str` | `"storage/reports"` |
| `base64:` | `str` or `bytes` | `"Hello"` |

<a id="env-type-str"></a>
### `str:`: preserve text

Use it for codes, identifiers or text that might be interpreted as another type:

```dotenv
ACCOUNT_CODE=str:00125
DISPLAY_FLAG=str:false
EMPTY_LABEL=str:
```

Reading these from `config/` produces `"00125"`, `"false"` and `""`. Dotenv quotes only delimit the value: `ACCOUNT_CODE="123"` still becomes the integer `123`. The `str:` prefix prevents this conversion.

Conversion removes leading whitespace from the content after the prefix. Do not use it to preserve that leading whitespace.

<a id="env-type-int"></a>
### `int:`: integers

Use it for ports, quantities or limits:

```dotenv
REPORTS_LIMIT=int:100
REPORTS_OFFSET=int:-5
```

These produce `100` and `-5`. Surrounding whitespace and formats supported by `int(text)` with its default base are accepted. `int:many` and `int:2.5` raise `ValueError`; the read default does not replace them.

<a id="env-type-float"></a>
### `float:`: floating-point numbers

Use it for timeouts or factors:

```dotenv
REPORTS_TIMEOUT=float:2.5
REPORTS_FACTOR=float:1e-3
```

These produce `2.5` and `0.001` through `float(text)`. The decimal separator is `.`; `float:2,5` raises `ValueError`.

<a id="env-type-bool"></a>
### `bool:`: boolean switches

Use it to enable or disable settings:

```dotenv
REPORTS_ENABLED=bool:on
REPORTS_NOTIFY=bool:disabled
```

`true`, `1`, `yes`, `on` and `enabled` produce `True`, ignoring case and surrounding whitespace. `false`, `0`, `no`, `off` and `disabled` produce `False`.

**`Env.get()` and `env()` treat any other content after `bool:` as `False`.** For example, `bool:treu` also returns `False`; it does not validate that the value is one of the negative spellings above. Use the documented representations to avoid disabling a setting through a typo. Explicit conversion with `EnvironmentCaster(...).get()` validates both groups, as explained below.

<a id="env-type-list"></a>
### `list:`: ordered lists

Use it for recipients, origins or values whose order matters:

```dotenv
REPORTS_RECIPIENTS="list:['team@example.test', 'ops@example.test']"
REPORTS_EMPTY_LIST=list:[]
```

These produce a list containing two strings and an empty list. The content must be a Python list literal; `list:team,ops` does not split comma-separated text. Elements are not automatically converted either: `list:['1', 2]` preserves a string and an integer.

<a id="env-type-dict"></a>
### `dict:`: named settings

Use it to group related settings:

```dotenv
REPORTS_OPTIONS="dict:{'retries': 3, 'notify': True}"
```

This produces `{"retries": 3, "notify": True}`. The inner syntax is a safe Python literal: use `True`, `False` and `None` for those values. This is not a JSON parser; `dict:{"notify": true}` fails because `true` is not a Python literal.

<a id="env-type-tuple"></a>
### `tuple:`: positional groups

Use it when values represent specific positions, such as a time window:

```dotenv
REPORTS_WINDOW="tuple:(8, 18)"
REPORTS_SINGLE_VALUE="tuple:('daily',)"
```

These produce `(8, 18)` and `("daily",)`. A single-item tuple requires the comma. `tuple:[8, 18]` is a list and is rejected; the prefix does not convert another collection type.

<a id="env-type-set"></a>
### `set:`: unique values

Use it for collections where membership matters rather than order:

```dotenv
REPORTS_TAGS="set:{'daily', 'internal', 'daily'}"
REPORTS_EMPTY_SET=set:set()
```

These produce `{"daily", "internal"}` and `set()`. Duplicates disappear and order is not guaranteed. `set:{}` does not create an empty set: `{}` is a dictionary and is rejected. Elements must be valid Python set members.

<a id="env-type-path"></a>
### `path:`: normalized paths

Use it for settings that contain file or directory paths:

```dotenv
REPORTS_DIRECTORY=path:storage/reports
REPORTS_WINDOWS_DIRECTORY='path:storage\reports'
```

Both reads return `"storage/reports"`. The result is a string with POSIX separators, not a `Path` object. Reading `path:` does not create the directory, check its existence or turn a relative path into an absolute one.

Explicit serialization with `EnvironmentCaster(value).to("path")` does prepend the working directory for relative values. This difference between reading and serialization matters when preparing `.env` values.

<a id="env-type-base64"></a>
### `base64:`: encoded content

Use it when a setting's format requires Base64-encoded content:

```dotenv
REPORTS_BANNER=base64:SGVsbG8=
REPORTS_BINARY=base64:/w==
```

The first read returns the string `"Hello"`; the second returns `b"\xff"` because the decoded content is not valid UTF-8 text. An invalid Base64 payload raises `ValueError`.

The component decodes this prefix on read. Base64 does not encrypt content or protect a secret.

## Unprefixed values

An unprefixed value is parsed in this order:

1. An empty string returns `None`.
2. `none`, `null`, `nan` and `nil`, ignoring case and surrounding whitespace, return `None`.
3. `true` and `false`, also ignoring case, return booleans.
4. A Python literal is attempted through `ast.literal_eval`: numbers, quoted strings and literal collections.
5. If it is not a valid literal, the original string is preserved.

```dotenv
AUTO_LIMIT=100
AUTO_ENABLED=true
AUTO_OPTIONS="{'notify': True, 'retries': 3}"
AUTO_URL=https://example.test/reports
AUTO_WORD=yes
```

The results are `100`, `True`, a dictionary, the URL as a string and `"yes"`. Without `bool:`, words such as `yes` and `off` are not boolean switches. An unknown prefix such as `json:{}` does not add a new type and normally remains text.

Literals are evaluated safely; arbitrary expressions and calls are not executed. The component does not validate collection element types against a dataclass annotation.

## When the default applies

The read signatures are:

```text
env(key: str, default: object | None = None) -> object
Env.get(key: str, default: object | None = None) -> object
```

Given these entries:

```dotenv
REPORTS_EMPTY=
REPORTS_NULL=null
REPORTS_EMPTY_TEXT=str:
REPORTS_ZERO=int:0
REPORTS_DISABLED=bool:false
```

| Read inside `config/` | Result |
|---|---|
| `env("REPORTS_MISSING", 100)` | `100`, if the key is absent from the process. |
| `env("REPORTS_EMPTY", 100)` | `None`. |
| `env("REPORTS_NULL", 100)` | `None`. |
| `env("REPORTS_EMPTY_TEXT", "fallback")` | `""`. |
| `env("REPORTS_ZERO", 100)` | `0`. |
| `env("REPORTS_DISABLED", True)` | `False`. |
| `env("REPORTS_MISSING", "int:100")` | `"int:100"`, with no conversion of the default. |

A line containing only a name without `=` appears as `None` in the `Env.all()` snapshot but publishes no process value. If that variable was not already defined by the system, `Env.get()` returns the default.

The default is neither validation nor a correction for an invalid prefix. Supply the Python value the configuration requires, such as `100`, `False` or `[]`, rather than a prefixed string.

## Explicit conversion in configuration

`EnvironmentCaster` is the utility for interpreting or serializing typed values. It implements `IEnvironmentCaster` from `orionis.environment.contracts.caster`, whose contract defines `get()` and `to()`. Its explicit use must also remain in configuration files. It does not need to be imported for ordinary `Env.get()` reads.

<a id="caster-construction"></a>
### Construction

```text
EnvironmentCaster(raw: str | object) -> None
```

It accepts an object or a string. If a prefix is recognized, it retains the content for interpretation by `get()`; otherwise, it keeps the value without conversion. Unlike prefix recognition in `Env.get()`, the constructor normalizes the prefix by removing surrounding whitespace and lowercasing it.

<a id="caster-options"></a>
<a id="caster-supported-types"></a>
### `OPTIONS` and `supportedTypes()`

`OPTIONS` and `supportedTypes() -> frozenset[str]` expose the same ten type names listed in the table above. `EnvironmentValueType` contains members `STR`, `INT`, `FLOAT`, `BOOL`, `LIST`, `DICT`, `TUPLE`, `SET`, `PATH` and `BASE64`, whose values are those lowercase names.

```python
# A configuration check inside config/reports.py.
from orionis.environment.dynamic.caster import EnvironmentCaster


SUPPORTED_REPORT_TYPES = EnvironmentCaster.supportedTypes()
assert "dict" in SUPPORTED_REPORT_TYPES
assert SUPPORTED_REPORT_TYPES == EnvironmentCaster.OPTIONS
```

<a id="caster-get"></a>
### `get() -> object`

Interprets the instance value. To validate a boolean explicitly, keep its input as text and convert it while constructing configuration. This alternative `config/reports.py` focuses on that case:

```dotenv
REPORTS_SWITCH=str:off
```

```python
from dataclasses import dataclass, field
from orionis.environment import env
from orionis.environment.dynamic.caster import EnvironmentCaster


def report_switch() -> bool:
    value = env("REPORTS_SWITCH", "off")
    return EnvironmentCaster(f"bool:{value}").get()


@dataclass(frozen=True, kw_only=True)
class Reports:
    enabled: bool = field(default_factory=report_switch)
```

`off` produces `False`; `str:unexpected` in `.env` makes this configuration raise `ValueError`. Keep `str:` on the entry so that its original value reaches validation: with `bool:unexpected`, the initial `env()` read would already have converted it to `False`.

`get()` preserves conversion errors as `ValueError` or `TypeError`, depending on the case, and wraps other failures as `ValueError`. The empty case `EnvironmentCaster("str:").get()` fails; ordinary `env()` reading takes a different path and does return `""`.

<a id="caster-parse-typed"></a>
### `parseTyped(value_str: str) -> object`

Directly interprets a string in `type:content` format. It normalizes the prefix and uses a fast conversion for `str`, `int`, `float` and `bool`; other types pass through a converter instance.

```python
# Conversion expressions while loading config/reports.py.
from orionis.environment.dynamic.caster import EnvironmentCaster


DEFAULT_LIMIT = EnvironmentCaster.parseTyped("int:100")
DEFAULT_OPTIONS = EnvironmentCaster.parseTyped("dict:{'retries': 3}")
```

`DEFAULT_LIMIT` is `100` and `DEFAULT_OPTIONS` is `{"retries": 3}`. A string without `:` raises `ValueError`. This path has the same permissive `bool:` behavior as `Env.get()`; to validate input spellings, use `get()` as shown above.

<a id="caster-to"></a>
### `to(type_hint: str | EnvironmentValueType) -> str`

Serializes the object to a `type:content` string. It does not save the result to `.env`; that operation belongs to [`Env.set()`](/en/environment/operations-and-reference). Use it when preparing typed values in configuration or a configuration integration:

```python
# Explicit serialization in a config/ file.
from orionis.environment.dynamic.caster import EnvironmentCaster
from orionis.environment.enums import EnvironmentValueType


LIMIT_LITERAL = EnvironmentCaster("12").to("int")
OPTIONS_LITERAL = EnvironmentCaster({"retries": 3}).to("dict")
ENABLED_LITERAL = EnvironmentCaster("yes").to(EnvironmentValueType.BOOL)
```

The results are `"int:12"`, `"dict:{'retries': 3}"` and `"bool:true"`.

| Requested type | Python value accepted for serialization | Behavior |
|---|---|---|
| `str` | String. | Adds the prefix; does not automatically convert other objects to text. |
| `int` | Integer or value convertible with `int()`. | Can convert numeric text; converting a Python float to integer can discard its fractional part. |
| `float` | Float or value convertible with `float()`. | Returns its floating-point representation with a prefix. |
| `bool` | Boolean, recognized boolean word or another object. | Validates words; for other objects, uses Python truthiness. |
| `list`, `dict`, `tuple`, `set` | A collection of the corresponding type. | Uses its literal representation; a string containing a collection is not a replacement for the actual collection. |
| `path` | String or `Path`. | Normalizes separators and makes relative paths absolute using the working directory. |
| `base64` | String or bytes decodable as UTF-8. | Preserves content that is already valid Base64; otherwise encodes it. |

`to()` accepts lowercase names or an enum member. An unknown name, incompatible collection or conversion failure results in `ValueError`. When serializing Base64, a string that is already valid Base64 is considered encoded and is not encoded again. Bytes that cannot be decoded as UTF-8 are not accepted by that operation, although they can be returned when decoding a `.env` value.

## Continue with the guide

See the [operations reference](/en/environment/operations-and-reference) for writing, reloading and name validation. The [compilation and persistence guide](/en/environment/compiled-configuration) explains what happens to these values when the application uses configuration stored in JSON.
