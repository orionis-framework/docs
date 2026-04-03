---
title: SonarQube & Ruff Specifications
---

# Static Analysis Configuration for Orionis Applications

Orionis Framework adopts naming conventions and design patterns inspired by **modern web frameworks** (Laravel, NestJS, etc.), which generates false positives in static analysis tools with default configuration. This document describes the rules that **must be configured** in both **SonarQube/SonarLint** and **Ruff** when working on Orionis applications.

---

## SonarQube / SonarLint

### Required `settings.json` configuration

```json
"sonarlint.rules": {
    "python:S100": {
        "level": "on",
        "parameters": {
            "format": "^_{0,2}[a-z][a-zA-Z0-9_]*_{0,2}$"
        }
    },
    "python:S2638": {
        "level": "off"
    },
    "python:S1542": {
        "level": "on",
        "parameters": {
            "format": "^_{0,2}[a-z][a-zA-Z0-9_]*_{0,2}$"
        }
    }
},
"sonarlint.automaticAnalysis": true
```

### Rule descriptions

| Rule | Action | Reason |
|---|---|---|
| `python:S100` | Reconfigure format | Orionis allows method names with underscore prefixes and camelCase structure (`_method`, `myMethod`), following the style of modern web frameworks. The pattern `^_{0,2}[a-z][a-zA-Z0-9_]*_{0,2}$` enables this convention. |
| `python:S2638` | Disable | This rule does not recognize the framework's implicit dependency injection syntax, generating false positives on valid method signatures. |
| `python:S1542` | Reconfigure format | Applies the same naming pattern as `S100` but for functions defined with `def`, ensuring consistency across the entire codebase. |

### Cognitive complexity handling (`python:S3776`)

Some framework methods, due to the nature of the problem they solve, may exceed the default cognitive complexity threshold (**15**).

**Do not disable the rule globally.** Instead, use `# NOSONAR` only on the affected method:

```python
def complex_method(...):  # NOSONAR
    # Logic that justifies the specific exception
    ...
```

> Use `# NOSONAR` judiciously and only when complexity is structurally unavoidable. For multiple cases, consider increasing the complexity threshold in the project configuration.

---

## Ruff

### Required global configuration in `ruff.toml`

```toml
[lint]
select = ["ALL"]
ignore = [
    "N818",
    "D100",
    "N802",
    "D104",
    "D101",
    "I001",
    "I002",
    "TRY301",
    "TRY300",
    "INP001"
]
exclude = [
    "test/*"
]

[lint.pydocstyle]
convention = "numpy"
```

#### Globally ignored rules

| Rule | Reason |
|---|---|
| `N818` | Orionis defines exceptions with custom suffixes (`*Exception`, `*Failure`), not forced to end in `Error`. |
| `D100` | Modules do not require module-level docstrings; documentation is managed at the class and method level. |
| `N802` | Orionis uses camelCase for function and method names (`myMethod`, `handleRequest`), a core convention of the framework. |
| `D104` | Packages (`__init__.py`) do not require their own docstring. |
| `D101` | Not all contexts require class-level docstrings. |
| `I001` | Import ordering is managed manually to respect the framework's loading logic. |
| `I002` | No globally forced imports exist; each module imports only what it needs. |
| `TRY301` | The framework intentionally raises exceptions within `try` blocks to control error flow. |
| `TRY300` | Orionis does not use the `else` block pattern in `try/except`; success logic may reside within the same `try`. |
| `INP001` | Some parts of the framework operate as implicit namespace packages without `__init__.py`, valid in modern Python. |

---

### Required inline suppressions (`# ruff: noqa`)

The following rules **are not globally ignored** in `ruff.toml`, but appear suppressed via `# ruff: noqa` in specific framework files. When developing an Orionis application, these same patterns will recur and require the same suppressions.

#### Structural complexity

| Rule | Reason |
|---|---|
| `C901` | High cyclomatic complexity (McCabe) in parsing, dependency resolution, and entity configuration methods. |
| `PLR0912` | Excessive branches in validation and entity configuration methods (`__post_init__`). |
| `PLR0913` | Methods with more than 5 arguments, common in the public API of console commands, logging, and HTTP. |
| `PLR0915` | Excessive statements in initialization and argument parsing methods. |
| `PLR0911` | Multiple return points in type resolvers, factories, and environment helpers. |

#### Types and annotations

| Rule | Reason |
|---|---|
| `ANN401` | The framework uses `Any` explicitly in dependency injection contracts, facades, reflection, and the service container. Prohibiting it would generate false alerts on deliberately dynamic APIs. |
| `ANN002` | Typing of `*args` is not always applicable in variable argument pass-through methods of the container. |
| `ANN003` | Typing of `**kwargs` in generic container and facade methods is not always applicable. |
| `TC001` | Project-internal type imports are kept outside the `TYPE_CHECKING` block to allow runtime resolution (dependency injection pattern). |
| `TC002` | Same as `TC001` but for third-party imports used as types in dynamically resolved method signatures. |

#### Framework behavior

| Rule | Reason |
|---|---|
| `SLF001` | The service container, facades, and console output intentionally access private members of other framework classes. |
| `FBT001` | Positional boolean arguments present in public framework APIs to maintain compatibility with the user's calling style. |
| `FBT002` | Positional boolean default values in configuration and environment methods. |
| `ARG004` | Unused static method arguments in base implementations that define interface contracts. |
| `BLE001` | Blind `Exception` catch intentionally used in the console reactor and scheduled tasks to prevent a single error from halting the process. |
| `TRY400` | `logging.error` is used instead of `logging.exception` deliberately to control the level of stacktrace detail recorded. |
| `PLC0415` | Imports performed outside the module's top level conditionally (optional imports: `orjson`, `uvloop`, `msgpack`). |
| `ASYNC240` | Uses `pathlib.Path.open` instead of `anyio.Path.open` in contexts where file IO is managed in a controlled manner outside the async loop. |
| `PGH003` | `# type: ignore` suppressions without specific code for untyped optional imports (`orjson`, `uvloop`, `msgpack`). |
| `PLW0108` | Lambdas deemed "unnecessary" by Ruff but that are part of entity configuration contracts with dynamic validators. |
| `PLW2901` | Reassignment of iteration variable in test result and collection processing loops. |

#### Security (intentional suppressions)

| Rule | Reason |
|---|---|
| `S104` | The development server explicitly binds to `0.0.0.0` to allow local network access; this is documented as development-only behavior. |
| `S311` | Standard pseudo-random generators are used for non-cryptographic operations (shuffling inspirational quotes, task ID generation). |
| `S324` | MD5/SHA1 is used for computing file cache hashes (integrity fingerprint, not cryptographic security). |
| `S605` | Process start with shell enabled in framework console commands (`console.py`). |
| `S606` | Process start without shell in development server commands. |
| `S314` | XML parsing in controlled contexts within the HTTP resource system. |

#### Style and code quality

| Rule | Reason |
|---|---|
| `T201` | Use of `print()` in the console output module and system runtime importer, where it is the intended output mechanism. |
| `G004` | Logging with f-strings in the framework's error handler to improve log message readability. |
| `RUF012` | Mutable class attributes without `ClassVar` in command registration, routing, and introspection modules where mutability is part of the design. |
| `RUF001` | Ambiguous Unicode characters in the inspirational quotes module (`quotes.py`), which contains legitimate text in multiple languages. |
| `PLR2004` | Magic values in routing comparisons, type resolution, and logging logic where literalness improves readability. |
| `PERF401` | List construction with explicit `for` instead of list comprehension in introspection methods. |
| `PERF403` | Dictionary construction with explicit `for` in reflection modules. |
| `B905` | `zip()` without `strict` parameter in console output (`zip_longest` pattern). |
| `E501` | Lines exceeding 88 characters in the routing module (`params_types.py`) and inspirational quotes. |
| `N801` | The sentinel type `_MISSING_TYPE` does not follow CapWords because it is part of an internal non-exported value pattern. |
| `DTZ007` | `datetime` parsing with format without explicit timezone in the URL parameter routing module. |
| `D205` | Docstrings with free format in the system runtime importer where strict NumPy structure does not apply. |
| `A002` | Argument that shadows a Python builtin (`type`, `format`) in public framework APIs for naming compatibility. |

---

### Docstring convention (`pydocstyle`)

The **NumPy** convention (`convention = "numpy"`) is used for writing docstrings throughout the framework. This convention defines the expected format for parameters, returns, and exceptions in function and class documentation.

### Analysis exclusions

The `test/*` directory is excluded from Ruff analysis since tests may require different styles (use of fixtures, mocks, long descriptive names, etc.) that would conflict with production rules.
