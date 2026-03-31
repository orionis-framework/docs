---
title: Environment Variables
---

Orionis provides a comprehensive environment variable management system that goes far beyond simple string reading. While most frameworks are limited to reading `.env` values as raw strings, Orionis incorporates **type hints**, **dynamic casting**, **bidirectional serialization**, and **strict key validation**, turning environment variables into first-class citizens of the Python type system.

---

## Module Architecture

The environment module is composed of several collaborating layers:

| Component | Responsibility |
|---|---|
| `Env` | High-level static facade — main entry point |
| `DotEnv` | Singleton engine that reads, writes, and manages the `.env` file |
| `EnvironmentCaster` | Dynamic casting engine with 10 supported types |
| `ValidateKeyName` | Key name validator (`^[A-Z][A-Z0-9_]*$`) |
| `ValidateTypes` | Type hint validator and inferrer |
| `EnvironmentValueType` | Enum with the 10 supported types |
| `SecureKeyGenerator` | Cryptographic key generator compatible with `APP_KEY` |
| `env()` | Global helper function for quick access |

---

## The Env Facade

The `Env` class is the main entry point for interacting with environment variables. All its methods are `@classmethod`, so no instantiation is required.

```python
from orionis.services.environment.env import Env
```

Internally, `Env` delegates all operations to a singleton instance of `DotEnv`, created automatically on the first call.

### Contract

`Env` implements the abstract contract `IEnv`, which defines the public interface:

```python
from orionis.services.environment.contracts.env import IEnv
```

| Method | Signature | Return |
|---|---|---|
| `get` | `(key, default=None)` | `object` |
| `set` | `(key, value, type_hint=None, *, only_os=False)` | `bool` |
| `unset` | `(key, *, only_os=False)` | `bool` |
| `all` | `()` | `dict[str, Any]` |
| `reload` | `()` | `bool` |

---

## Reading Variables

### The `get` Method

Retrieves the value of an environment variable. If the key exists, the value is **automatically parsed** to the corresponding Python type. If not, it returns the default value.

```python
# simple read
db_host = Env.get("DB_HOST")

# with default value
db_port = Env.get("DB_PORT", 5432)
```

#### Automatic Value Parsing

Unlike other frameworks where `get()` always returns a `str`, Orionis **detects and converts** stored values automatically:

| Value in `.env` | Python Type Returned |
|---|---|
| `true` / `false` | `bool` |
| `null`, `none`, `nan`, `nil` | `None` |
| `42` | `int` |
| `3.14` | `float` |
| `[1, 2, 3]` | `list` |
| `{'key': 'val'}` | `dict` |
| `(1, 2)` | `tuple` |
| `{1, 2, 3}` | `set` |
| `int:42` | `int` (via type hint) |
| `base64:SGVsbG8=` | `str` (decoded) |
| `path:/usr/local` | `str` (POSIX path) |
| `Hello World` | `str` |

The parsing engine follows this resolution sequence:

1. If the value is `None`, returns `None`
2. If it is already a basic Python type (`bool`, `int`, `float`, etc.), returns it directly
3. If it is an empty string or matches `null`, `none`, `nan`, or `nil`, returns `None`
4. If it is `true` or `false` (case-insensitive), returns `bool`
5. If it starts with a supported type prefix (e.g., `int:`, `list:`), delegates to `EnvironmentCaster`
6. Attempts evaluation with `ast.literal_eval` for Python literals
7. If all else fails, returns the original string

---

## Writing Variables

### The `set` Method

Sets or updates an environment variable. By default, it writes to both the `.env` file and `os.environ`.

```python
# simple write
Env.set("APP_NAME", "Orionis")

# with explicit type hint
Env.set("APP_PORT", "8000", type_hint="int")

# process memory only (not persisted to .env)
Env.set("TEMP_TOKEN", "abc123", only_os=True)
```

#### Parameters

| Parameter | Type | Description |
|---|---|---|
| `key` | `str` | Variable name (must match `^[A-Z][A-Z0-9_]*$`) |
| `value` | `str \| float \| bool \| list \| dict \| tuple \| set` | Value to assign |
| `type_hint` | `str \| EnvironmentValueType \| None` | Explicit type for serialization |
| `only_os` | `bool` | If `True`, only sets in `os.environ` |

#### Value Serialization

When writing a value, the engine serializes it automatically:

| Python Type | Representation in `.env` |
|---|---|
| `None` | `null` |
| `bool` | `true` / `false` |
| `int` / `float` | String representation (`"42"`, `"3.14"`) |
| `list` / `dict` / `tuple` / `set` | `repr()` representation |
| `str` | Text with whitespace trimmed |

When a `type_hint` is provided, the value is stored with a type prefix:

```python
Env.set("PORT", 8080, type_hint="int")
# In .env: PORT="int:8080"

Env.set("HOSTS", ["a", "b"], type_hint="list")
# In .env: HOSTS="list:['a', 'b']"
```

---

## Removing Variables

### The `unset` Method

Removes an environment variable from the `.env` file and from `os.environ`.

```python
# complete removal
Env.unset("OLD_KEY")

# only remove from os.environ (keep in .env)
Env.unset("CACHED_KEY", only_os=True)
```

The operation always returns `True`, even if the key did not exist.

---

## Querying and Reloading

### The `all` Method

Returns all variables from the `.env` file as a dictionary with parsed values:

```python
config = Env.all()
# {'DB_HOST': 'localhost', 'DB_PORT': 5432, 'DEBUG': True}
```

### The `reload` Method

Reloads variables from the `.env` file. Useful when the file has been modified externally:

```python
Env.reload()
```

Internally, it destroys the `DotEnv` singleton instance and creates a new one, ensuring a completely clean state.

---

## Type Hints — The Type System

One of the most distinctive features of Orionis is the **type hints** system for environment variables. It allows storing and retrieving values with explicit types using the `type:value` format directly in the `.env` file.

### Supported Types

The `EnvironmentValueType` enum defines the 10 available types:

```python
from orionis.services.environment.enums.value_type import EnvironmentValueType
```

| Member | Value | Example in `.env` | Python Type |
|---|---|---|---|
| `STR` | `str` | `str:hello` | `str` |
| `INT` | `int` | `int:42` | `int` |
| `FLOAT` | `float` | `float:3.14` | `float` |
| `BOOL` | `bool` | `bool:true` | `bool` |
| `LIST` | `list` | `list:[1, 2, 3]` | `list` |
| `DICT` | `dict` | `dict:{'a': 1}` | `dict` |
| `TUPLE` | `tuple` | `tuple:(1, 2)` | `tuple` |
| `SET` | `set` | `set:{1, 2, 3}` | `set` |
| `BASE64` | `base64` | `base64:SGVsbG8=` | `str` |
| `PATH` | `path` | `path:/usr/local/bin` | `str` |

### Writing with Type Hints

```python
from orionis.services.environment.enums.value_type import EnvironmentValueType

# using string
Env.set("API_PORT", 3000, type_hint="int")

# using enum
Env.set("API_PORT", 3000, type_hint=EnvironmentValueType.INT)
```

### Reading with Type Hints

When reading a variable that has a type prefix, the `EnvironmentCaster` converts it automatically:

```python
# If in .env: API_PORT="int:3000"
port = Env.get("API_PORT")
print(type(port))  # <class 'int'>
print(port)        # 3000
```

### Bool Type Special Behavior

The boolean caster recognizes multiple representations:

| Truthy | Falsy |
|---|---|
| `true` | `false` |
| `1` | `0` |
| `yes` | `no` |
| `on` | `off` |
| `enabled` | `disabled` |

### Path Type Special Behavior

Paths are normalized to POSIX format and resolved as absolute:

```python
Env.set("UPLOAD_DIR", "./uploads", type_hint="path")
# Stores: path:/absolute/path/to/uploads
```

### Base64 Type Special Behavior

If the value is already valid Base64, it is preserved. Otherwise, it is encoded automatically:

```python
Env.set("SECRET", "my-secret", type_hint="base64")
# Stores: base64:bXktc2VjcmV0
```

---

## Key Validation

All environment variable keys are validated against the strict pattern `^[A-Z][A-Z0-9_]*$`:

| Key | Valid | Reason |
|---|---|---|
| `DB_HOST` | ✅ | Uppercase, underscores, correct |
| `VAR123` | ✅ | Digits after first letter |
| `A__B` | ✅ | Multiple underscores allowed |
| `myVar` | ❌ | Contains lowercase |
| `1VAR` | ❌ | Starts with digit |
| `_VAR` | ❌ | Starts with underscore |
| `MY-VAR` | ❌ | Contains hyphen |

```python
# TypeError if not a string
Env.set(123, "value")  # raises TypeError

# ValueError if pattern not matched
Env.set("my_var", "value")  # raises ValueError
```

---

## The DotEnv Engine

`DotEnv` is the internal layer that directly manages the `.env` file. It implements the **Singleton** pattern and is **thread-safe** via `threading.RLock`.

```python
from orionis.services.environment.core.dot_env import DotEnv
```

### Features

- **Singleton**: A single shared instance across the entire application
- **Thread-safe**: All operations use `threading.RLock`
- **Auto-creation**: If the `.env` file does not exist, it is created automatically
- **Configurable path**: Accepts a custom path in the constructor
- **Dual persistence**: Writes to both the `.env` file and `os.environ` simultaneously

### Initialization

```python
# uses .env in the current directory (default behavior)
dotenv = DotEnv()

# custom path
dotenv = DotEnv(path="/config/.env.production")
```

---

## Secure Key Generator

The module includes `SecureKeyGenerator` for generating cryptographic keys compatible with the `APP_KEY` format (`base64:<payload>`):

```python
from orionis.services.environment.key.key_generator import SecureKeyGenerator
```

### Supported Ciphers

| Cipher | Key Size |
|---|---|
| `AES-128-CBC` | 16 bytes |
| `AES-256-CBC` | 32 bytes |
| `AES-128-GCM` | 16 bytes |
| `AES-256-GCM` | 32 bytes |

### Usage

```python
# default cipher: AES-256-CBC
key = SecureKeyGenerator.generate()
# "base64:xK9m2..."

# specific cipher with string
key = SecureKeyGenerator.generate("AES-128-GCM")

# specific cipher with enum
from orionis.foundation.config.app.enums.ciphers import Cipher
key = SecureKeyGenerator.generate(Cipher.AES_256_GCM)
```

Each call produces a cryptographically unique key generated with `os.urandom()`.

---

## The `env()` Helper Function

For quick access from anywhere in the application, Orionis provides the global `env()` function:

```python
from orionis.services.environment.helpers.functions import env

# equivalent to Env.get("DB_HOST")
host = env("DB_HOST")

# with default value
port = env("DB_PORT", 3306)
```

The function simply delegates to `Env.get()`, accepting the same `key` and `default` parameters.

---

## Integrated Example

```python
from orionis.services.environment.env import Env
from orionis.services.environment.helpers.functions import env
from orionis.services.environment.key.key_generator import SecureKeyGenerator

# Generate and set an application key
app_key = SecureKeyGenerator.generate()
Env.set("APP_KEY", app_key, type_hint="base64")

# Configure variables with explicit types
Env.set("APP_DEBUG", True, type_hint="bool")
Env.set("APP_PORT", 8080, type_hint="int")
Env.set("ALLOWED_HOSTS", ["localhost", "127.0.0.1"], type_hint="list")
Env.set("DB_CONFIG", {"host": "localhost", "port": 5432}, type_hint="dict")

# Reads with automatic casting
debug = Env.get("APP_DEBUG")       # bool: True
port = Env.get("APP_PORT")         # int: 8080
hosts = env("ALLOWED_HOSTS")       # list: ['localhost', '127.0.0.1']
db = env("DB_CONFIG")              # dict: {'host': 'localhost', 'port': 5432}

# Query all configuration
all_vars = Env.all()

# Temporary variable in memory only
Env.set("REQUEST_ID", "abc-123", only_os=True)

# Reload after external change
Env.reload()
```