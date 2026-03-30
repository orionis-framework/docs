---
title: 'Modules'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Module

The `ReflectionModule` class is an advanced introspection utility designed to analyze Python modules at runtime. It provides a comprehensive API for inspecting classes, functions, constants, and imports defined in any importable module within the Orionis ecosystem.

Unlike other reflection classes that operate on classes or instances, `ReflectionModule` works at the module level, enabling discovery and manipulation of the internal components of any Python package or file. This makes it an essential tool for dynamic service loading, automatic class discovery, and inspection of the framework's internal structure.

## Import

```python
from orionis.services.introspection.modules.reflection import ReflectionModule
```

## Initialization

The `ReflectionModule` class receives the fully qualified module name as a string parameter. The module is automatically imported during initialization. If the name is not a valid string or the module cannot be imported, a `TypeError` will be raised.

```python
from orionis.services.introspection.modules.reflection import ReflectionModule

reflection = ReflectionModule("orionis.services.introspection.modules.reflection")
```

If you pass an invalid value:

```python
# TypeError: not a string
ReflectionModule(123)

# TypeError: empty string
ReflectionModule("")

# TypeError: non-existent module
ReflectionModule("module.that.does.not.exist")
```

## Contract

The `ReflectionModule` class implements the `IReflectionModule` contract, which defines the complete interface for module introspection:

```python
from orionis.services.introspection.modules.contracts.reflection import IReflectionModule
```

## Module Access

### getModule

Returns the module object imported during initialization.

```python
mod = reflection.getModule()
# <module 'orionis.services.introspection.modules.reflection' from '...'>
```

## Classes

`ReflectionModule` offers a comprehensive set of methods for discovering, querying, registering, and removing classes within the reflected module. All classes are detected as objects inheriting from `object`.

### getClasses

Returns a dictionary with all classes defined in the module, organized by name.

```python
classes = reflection.getClasses()
# {"ReflectionModule": <class 'ReflectionModule'>, ...}
```

### getPublicClasses

Returns only classes whose names do not start with an underscore (`_`).

```python
public = reflection.getPublicClasses()
# {"ReflectionModule": <class 'ReflectionModule'>}
```

### getProtectedClasses

Returns classes whose names start with a single underscore (`_`) but not with a double underscore.

```python
protected = reflection.getProtectedClasses()
# {"_InternalHelper": <class '_InternalHelper'>}
```

### getPrivateClasses

Returns classes whose names start with a double underscore (`__`) and do not end with a double underscore.

```python
private = reflection.getPrivateClasses()
# {"__SecretClass": <class '__SecretClass'>}
```

### hasClass

Checks whether a class with the specified name exists within the module.

```python
reflection.hasClass("ReflectionModule")
# True

reflection.hasClass("NonExistentClass")
# False
```

### getClass

Retrieves a class by its name. Returns `None` if it does not exist.

```python
cls = reflection.getClass("ReflectionModule")
# <class 'ReflectionModule'>

cls = reflection.getClass("DoesNotExist")
# None
```

### setClass

Dynamically registers a new class in the module. Validates that the name is a valid identifier and is not a Python reserved keyword. The value must be a type (`type`).

```python
class CustomService:
    pass

reflection.setClass("CustomService", CustomService)
# True
```

If the arguments are invalid:

```python
# TypeError: not a type
reflection.setClass("name", "not a class")

# ValueError: invalid identifier
reflection.setClass("123invalid", CustomService)

# ValueError: reserved keyword
reflection.setClass("class", CustomService)
```

### removeClass

Removes a class from the module by its name. Raises `ValueError` if the class does not exist.

```python
reflection.removeClass("CustomService")
# True

# ValueError: non-existent class
reflection.removeClass("DoesNotExist")
```

## Constants

Constants are identified as module attributes whose names are uppercase (`UPPER_CASE`), are not callable, and are not Python reserved keywords.

### getConstants

Returns a dictionary with all constants defined in the module.

```python
constants = reflection.getConstants()
# {"MAX_RETRIES": 3, "DEFAULT_TIMEOUT": 30}
```

### getPublicConstants

Returns constants whose names do not start with an underscore.

```python
public_const = reflection.getPublicConstants()
# {"MAX_RETRIES": 3, "DEFAULT_TIMEOUT": 30}
```

### getProtectedConstants

Returns constants whose names start with a single underscore.

```python
protected_const = reflection.getProtectedConstants()
# {"_INTERNAL_LIMIT": 100}
```

### getPrivateConstants

Returns constants whose names start with a double underscore and do not end with a double underscore.

```python
private_const = reflection.getPrivateConstants()
# {"__SECRET_KEY": "abc123"}
```

### getConstant

Retrieves the value of a specific constant by name. Returns `None` if it does not exist.

```python
value = reflection.getConstant("MAX_RETRIES")
# 3

value = reflection.getConstant("DOES_NOT_EXIST")
# None
```

## Functions

`ReflectionModule` enables discovery and classification of all functions defined in the module, organized by visibility (public, protected, private) and nature (synchronous, asynchronous).

Functions are detected as callable attributes that have the `__code__` attribute, which excludes classes and other callable objects.

### Function Methods Table

| Method | Description |
|---|---|
| `getFunctions()` | All functions in the module |
| `getPublicFunctions()` | Public functions (no `_` prefix) |
| `getPublicSyncFunctions()` | Public synchronous functions |
| `getPublicAsyncFunctions()` | Public asynchronous functions |
| `getProtectedFunctions()` | Protected functions (`_` prefix) |
| `getProtectedSyncFunctions()` | Protected synchronous functions |
| `getProtectedAsyncFunctions()` | Protected asynchronous functions |
| `getPrivateFunctions()` | Private functions (`__` prefix) |
| `getPrivateSyncFunctions()` | Private synchronous functions |
| `getPrivateAsyncFunctions()` | Private asynchronous functions |

Each method returns a `dict[str, callable]` dictionary where keys are function names and values are the corresponding function objects.

### Usage Example

```python
# Get all public functions
public_fns = reflection.getPublicFunctions()
# {"process_request": <function>, "validate_input": <function>}

# Filter only public asynchronous functions
async_fns = reflection.getPublicAsyncFunctions()
# {"process_request": <function>}

# Get protected synchronous functions
protected_sync = reflection.getProtectedSyncFunctions()
# {"_internal_helper": <function>}
```

### Classification Criteria

Functions are classified according to Python naming conventions:

- **Public**: name without an underscore prefix
- **Protected**: name with a `_` prefix (single underscore), without a `__` prefix
- **Private**: name with a `__` prefix (double underscore), without a `__` suffix

The synchronous/asynchronous distinction is determined using `inspect.iscoroutinefunction()`.

## Imports

### getImports

Returns a dictionary with imported modules detected at the module level. Only identifies attributes whose type is `ModuleType`.

```python
imports = reflection.getImports()
# {"os": <module 'os'>, "sys": <module 'sys'>}
```

## Source Code and File

### getFile

Returns the absolute path of the file where the module is defined.

```python
path = reflection.getFile()
# "/path/to/orionis/services/introspection/modules/reflection.py"
```

### getSourceCode

Returns the complete source code of the module as a string. Raises `ValueError` if the file cannot be read.

```python
source = reflection.getSourceCode()
# "from __future__ import annotations\nimport importlib\n..."
```

## Cache

`ReflectionModule` implements an internal caching system that stores the results of discovery methods. This optimizes performance on repeated calls. The cache is automatically invalidated when modifying classes with `setClass()` or `removeClass()`.

### clearCache

Removes all entries stored in the cache, forcing a complete recomputation on subsequent calls.

```python
reflection.clearCache()
```

The class also exposes the cache protocol through the magic methods `__getitem__`, `__setitem__`, `__contains__`, and `__delitem__`, although these are intended for internal use by the reflection system.