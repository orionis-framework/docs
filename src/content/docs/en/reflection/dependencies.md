---
title: 'Dependencies'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflect Dependencies

The `ReflectDependencies` class is the dependency analysis engine of the Orionis reflection system. Its purpose is to inspect the signatures of constructors, methods, and callable functions to automatically categorize their parameters as **resolved** or **unresolved**, providing the information needed for the dependency injection container (IoC) to automatically resolve and inject services.

This component is fundamental to the framework's internal functionality, as it allows the service container to determine which dependencies can be resolved automatically and which require explicit configuration by the developer.

## Import

```python
from orionis.services.introspection.dependencies.reflection import ReflectDependencies
```

## Initialization

The `ReflectDependencies` class receives a target object that can be a class, a function, or `None`. Dependency analysis is performed on demand when inspection methods are invoked.

```python
from orionis.services.introspection.dependencies.reflection import ReflectDependencies

class UserService:
    def __init__(self, repo: UserRepository, name: str, retries: int = 3) -> None:
        self.repo = repo
        self.name = name
        self.retries = retries

reflection = ReflectDependencies(UserService)
```

It also accepts functions and callables:

```python
def process_data(data: list, mode: str = "fast") -> str:
    return f"{len(data)}-{mode}"

reflection = ReflectDependencies(process_data)
```

## Contract

The `ReflectDependencies` class implements the `IReflectDependencies` contract, which defines three abstract inspection methods:

```python
from orionis.services.introspection.dependencies.contracts.reflection import IReflectDependencies
```

## Entities

The system uses two immutable entities (frozen dataclasses) to represent analysis results.

### Argument

Represents an individual parameter with all its type metadata and resolution status.

```python
from orionis.services.introspection.dependencies.entities.argument import Argument
```

| Field | Type | Description |
|---|---|---|
| `name` | `str` | Parameter name |
| `resolved` | `bool` | Whether the dependency was resolved |
| `module_name` | `str` | Module where the type is defined |
| `class_name` | `str` | Type/class name of the parameter |
| `type` | `type` | Python type object for the parameter |
| `full_class_path` | `str` | Complete path to the type (`module.Class`) |
| `is_keyword_only` | `bool` | Whether it is a keyword-only parameter |
| `default` | `Any \| None` | Default value, if any |

`Argument` is a frozen dataclass (`frozen=True`), making it immutable and hashable.

### Signature

Groups analysis results into three categorized dictionaries.

```python
from orionis.services.introspection.dependencies.entities.signature import Signature
```

| Field | Type | Description |
|---|---|---|
| `resolved` | `dict[str, Argument]` | Automatically resolved parameters |
| `unresolved` | `dict[str, Argument]` | Parameters that could not be resolved |
| `ordered` | `dict[str, Argument]` | All parameters in declaration order |

## Resolution Logic

The system classifies each parameter according to the following rules, evaluated in priority order:

1. **Skipped parameters**: `self`, `cls`, `*args`, and `**kwargs` are excluded from analysis.
2. **No annotation and no default value**: classified as **unresolved** — the container lacks sufficient information to inject them.
3. **Has a default value**: classified as **resolved** — the container can use the provided value.
4. **Annotated with a builtin type** (`str`, `int`, `float`, etc.) **without a default value**: classified as **unresolved** — primitive types cannot be automatically resolved.
5. **Annotated with a non-builtin type**: classified as **resolved** — the container can resolve the dependency by type through the IoC.

```python
class PaymentService:
    def __init__(
        self,
        gateway: PaymentGateway,   # Resolved (non-builtin type)
        currency: str,             # Unresolved (builtin without default)
        retries: int = 3,          # Resolved (has default value)
    ) -> None: ...

rd = ReflectDependencies(PaymentService)
sig = rd.constructorSignature()

sig.resolved    # {"gateway": Argument(...), "retries": Argument(...)}
sig.unresolved  # {"currency": Argument(...)}
sig.ordered     # {"gateway": ..., "currency": ..., "retries": ...}
```

## Constructor Inspection

### constructorSignature

Analyzes the `__init__` method of a class and categorizes its parameters.

```python
class EmailService:
    def __init__(self, mailer: Mailer, subject: str, max_retries: int = 5) -> None:
        ...

rd = ReflectDependencies(EmailService)
sig = rd.constructorSignature()

# Dependency resolved by type
sig.resolved["mailer"].class_name      # "Mailer"
sig.resolved["mailer"].resolved        # True

# Dependency resolved by default value
sig.resolved["max_retries"].default    # 5
sig.resolved["max_retries"].resolved   # True

# Unresolved dependency
sig.unresolved["subject"].class_name   # "str"
sig.unresolved["subject"].resolved     # False
```

## Method Inspection

### methodSignature

Analyzes the signature of a specific method on the target class.

```python
class DataProcessor:
    def process(self, value: int, mode: str = "fast") -> str:
        return f"{value}-{mode}"

rd = ReflectDependencies(DataProcessor)
sig = rd.methodSignature("process")

sig.unresolved["value"].class_name  # "int"
sig.resolved["mode"].default        # "fast"
```

If the method does not exist, an `AttributeError` is raised:

```python
rd.methodSignature("nonexistent")
# AttributeError
```

## Callable Inspection

### callableSignature

Analyzes the signature of a function or callable passed as the target.

```python
def calculate(a: int, b: str = "hello") -> str:
    return f"{a}-{b}"

rd = ReflectDependencies(calculate)
sig = rd.callableSignature()

sig.unresolved["a"].class_name  # "int"
sig.resolved["b"].default       # "hello"
```

If the target is not callable, a `TypeError` is raised:

```python
rd = ReflectDependencies("not callable")
rd.callableSignature()
# TypeError
```

## Signature Methods

The `Signature` entity provides methods for querying and filtering analysis results.

| Method | Return | Description |
|---|---|---|
| `noArgumentsRequired()` | `bool` | `True` if there are no dependencies |
| `hasUnresolvedArguments()` | `bool` | `True` if unresolved dependencies exist |
| `arguments()` | `dict_items` | `(name, Argument)` pairs in order |
| `items()` | `dict_items` | Alias for `arguments()` |
| `getAllOrdered()` | `dict[str, Argument]` | All dependencies in order |
| `getResolved()` | `dict[str, Argument]` | Resolved dependencies only |
| `getUnresolved()` | `dict[str, Argument]` | Unresolved dependencies only |
| `getPositionalOnly()` | `dict[str, Argument]` | Positional dependencies |
| `getKeywordOnly()` | `dict[str, Argument]` | Keyword-only dependencies |
| `toDict()` | `dict[str, dict]` | All dependencies as dictionaries |
| `resolvedToDict()` | `dict[str, dict]` | Resolved as dictionaries |
| `unresolvedToDict()` | `dict[str, dict]` | Unresolved as dictionaries |
| `positionalOnlyToDict()` | `dict[str, dict]` | Positional as dictionaries |
| `keywordOnlyToDict()` | `dict[str, dict]` | Keyword-only as dictionaries |

### Query Example

```python
sig = rd.constructorSignature()

# Check if arguments are required
if sig.noArgumentsRequired():
    print("No dependencies required")

# Check for unresolved dependencies
if sig.hasUnresolvedArguments():
    for name, arg in sig.getUnresolved().items():
        print(f"  {name}: {arg.class_name} (unresolved)")

# Iterate over all dependencies in order
for name, arg in sig.items():
    status = "resolved" if arg.resolved else "unresolved"
    print(f"{name}: {arg.class_name} [{status}]")
```

## Keyword-Only Parameters

The system correctly detects keyword-only parameters (defined after `*` in the signature) and marks them with `is_keyword_only=True` in the `Argument`.

```python
class Config:
    def __init__(self, *, label: str, count: int = 0) -> None:
        self.label = label
        self.count = count

rd = ReflectDependencies(Config)
sig = rd.constructorSignature()

# Filter keyword-only
keyword_args = sig.getKeywordOnly()
# {"label": Argument(..., is_keyword_only=True), "count": Argument(..., is_keyword_only=True)}

# Filter positional only
positional_args = sig.getPositionalOnly()
# {} (empty, since all are keyword-only)
```