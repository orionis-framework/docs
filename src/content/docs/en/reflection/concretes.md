---
title: 'Concrete Classes'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Concrete

The `ReflectionConcrete` class is an advanced introspection utility designed to analyze concrete Python classes at runtime. It provides a comprehensive API for inspecting attributes, methods, properties, metadata, and dependencies of any concrete (non-abstract) class registered in the Orionis framework.

Unlike `ReflectionAbstract`, which operates on abstract base classes, `ReflectionConcrete` focuses exclusively on instantiable classes with complete implementations. This makes it the ideal tool for analyzing services, controllers, models, and any concrete framework component.

## Import

```python
from orionis.services.introspection.concretes.reflection import ReflectionConcrete
```

## Initialization

The `ReflectionConcrete` class receives a valid concrete class as its parameter. If the provided class is abstract, a primitive type, a built-in, or not a class at all, a `TypeError` will be raised.

```python
from orionis.services.introspection.concretes.reflection import ReflectionConcrete

class UserService:
    """Service for managing users."""

    active: bool = True

    def __init__(self, name: str = "default") -> None:
        self.name = name

    def greet(self) -> str:
        return f"Hello, {self.name}"

reflection = ReflectionConcrete(UserService)
```

If you pass an invalid type:

```python
from abc import ABC, abstractmethod

class MyContract(ABC):
    @abstractmethod
    def execute(self) -> str: ...

# TypeError: abstract class
ReflectionConcrete(MyContract)

# TypeError: not a class
ReflectionConcrete(42)

# TypeError: built-in
ReflectionConcrete(len)
```

## Contract

The `ReflectionConcrete` class implements the `IReflectionConcrete` contract, which defines the complete interface for concrete class introspection:

```python
from orionis.services.introspection.concretes.contracts.reflection import IReflectionConcrete
```

## Class Identity

These methods provide basic identification information about the reflected class.

### getClass

Returns the type (class) associated with the reflection instance.

```python
cls = reflection.getClass()
# <class 'UserService'>
```

### getClassName

Returns the simple name of the class as a string.

```python
name = reflection.getClassName()
# "UserService"
```

### getModuleName

Returns the module name where the class is defined.

```python
module = reflection.getModuleName()
# "app.services.user_service"
```

### getModuleWithClassName

Returns the fully qualified name (module + class).

```python
fqn = reflection.getModuleWithClassName()
# "app.services.user_service.UserService"
```

## Metadata

### getDocstring

Returns the class docstring, or `None` if not defined.

```python
doc = reflection.getDocstring()
# "Service for managing users."
```

### getBaseClasses

Returns the list of direct base classes in resolution order.

```python
bases = reflection.getBaseClasses()
# [<class 'object'>]
```

### getSourceCode

Returns the source code of the entire class or a specific method. Returns `None` if the source is not available.

```python
# Source code of the entire class
source = reflection.getSourceCode()

# Source code of a specific method
method_source = reflection.getSourceCode("greet")
```

For private methods with name mangling, use the name without the prefix:

```python
source = reflection.getSourceCode("__private_method")
```

### getFile

Returns the absolute path of the file where the class is defined.

```python
path = reflection.getFile()
# "/app/services/user_service.py"
```

### getAnnotations

Returns a dictionary with the class type annotations. Automatically resolves name mangling for private attributes.

```python
annotations = reflection.getAnnotations()
# {"active": <class 'bool'>}
```

## Attributes

`ReflectionConcrete` classifies class attributes by visibility level, excluding methods, properties, `staticmethod`, and `classmethod`.

### getAttributes

Returns all class attributes, combining public, protected, private, and dunder.

```python
attrs = reflection.getAttributes()
```

### getPublicAttributes

Returns public attributes (no underscore prefix).

```python
public = reflection.getPublicAttributes()
# {"active": True}
```

### getProtectedAttributes

Returns protected attributes (`_` prefix).

```python
protected = reflection.getProtectedAttributes()
# {"_internal_flag": False}
```

### getPrivateAttributes

Returns private attributes (`__` prefix). Names are returned without name mangling.

```python
private = reflection.getPrivateAttributes()
# {"__secret": "value"}  — not "_ClassName__secret"
```

### getDunderAttributes / getMagicAttributes

Returns custom dunder attributes of the class, excluding Python standard ones (`__dict__`, `__module__`, `__doc__`, etc.). `getMagicAttributes` is an alias for `getDunderAttributes`.

```python
dunder = reflection.getDunderAttributes()
magic = reflection.getMagicAttributes()  # Equivalent
```

### hasAttribute

Checks whether an attribute exists in the class.

```python
reflection.hasAttribute("active")     # True
reflection.hasAttribute("missing")    # False
```

### getAttribute

Gets the value of an attribute, with support for a default value.

```python
value = reflection.getAttribute("active")           # True
value = reflection.getAttribute("missing", "N/A")   # "N/A"
```

### setAttribute

Sets an attribute on the class. Only non-callable values are accepted; to add methods, use `setMethod`.

```python
reflection.setAttribute("active", False)  # True
```

Validations:
- The name must be a valid Python identifier
- Cannot be a reserved keyword
- The value cannot be a callable (raises `TypeError`)

### removeAttribute

Removes an attribute from the class. Raises `ValueError` if the attribute does not exist.

```python
reflection.removeAttribute("active")  # True
```

## Methods

`ReflectionConcrete` offers a granular API for inspecting methods organized along three axes: **visibility** (public, protected, private), **type** (instance, class, static, dunder), and **nature** (synchronous, asynchronous).

### Inspection Methods Summary

| Method | Description |
|--------|-------------|
| `getMethods()` | All methods (instance + class + static) |
| `getPublicMethods()` | Public instance methods |
| `getPublicSyncMethods()` | Public synchronous |
| `getPublicAsyncMethods()` | Public asynchronous |
| `getProtectedMethods()` | Protected instance methods (`_`) |
| `getProtectedSyncMethods()` | Protected synchronous |
| `getProtectedAsyncMethods()` | Protected asynchronous |
| `getPrivateMethods()` | Private instance methods (`__`) |
| `getPrivateSyncMethods()` | Private synchronous |
| `getPrivateAsyncMethods()` | Private asynchronous |
| `getPublicClassMethods()` | Public class methods |
| `getPublicClassSyncMethods()` | Public synchronous class methods |
| `getPublicClassAsyncMethods()` | Public asynchronous class methods |
| `getProtectedClassMethods()` | Protected class methods |
| `getProtectedClassSyncMethods()` | Protected synchronous class methods |
| `getProtectedClassAsyncMethods()` | Protected asynchronous class methods |
| `getPrivateClassMethods()` | Private class methods |
| `getPrivateClassSyncMethods()` | Private synchronous class methods |
| `getPrivateClassAsyncMethods()` | Private asynchronous class methods |
| `getPublicStaticMethods()` | Public static methods |
| `getPublicStaticSyncMethods()` | Public synchronous static methods |
| `getPublicStaticAsyncMethods()` | Public asynchronous static methods |
| `getProtectedStaticMethods()` | Protected static methods |
| `getProtectedStaticSyncMethods()` | Protected synchronous static methods |
| `getProtectedStaticAsyncMethods()` | Protected asynchronous static methods |
| `getPrivateStaticMethods()` | Private static methods |
| `getPrivateStaticSyncMethods()` | Private synchronous static methods |
| `getPrivateStaticAsyncMethods()` | Private asynchronous static methods |
| `getDunderMethods()` | Dunder methods (`__init__`, `__repr__`, etc.) |
| `getMagicMethods()` | Alias for `getDunderMethods()` |

All methods return `list[str]` with the names of the matching methods. Private method names are returned without name mangling.

### Usage Example

```python
class MyService:

    def process(self) -> str:
        return "done"

    async def fetch(self) -> dict:
        return {}

    def _validate(self) -> bool:
        return True

    @classmethod
    def create(cls) -> "MyService":
        return cls()

    @staticmethod
    def version() -> str:
        return "1.0"

reflection = ReflectionConcrete(MyService)

reflection.getPublicMethods()        # ["process", "fetch"]
reflection.getPublicSyncMethods()    # ["process"]
reflection.getPublicAsyncMethods()   # ["fetch"]
reflection.getProtectedMethods()     # ["_validate"]
reflection.getPublicClassMethods()   # ["create"]
reflection.getPublicStaticMethods()  # ["version"]
```

### hasMethod

Checks whether a method exists in the class (searches across all categories).

```python
reflection.hasMethod("process")   # True
reflection.hasMethod("missing")   # False
```

### setMethod

Adds a new method to the class. Raises `ValueError` if the name already exists or is invalid, and `TypeError` if the value is not callable.

```python
def new_method(self) -> str:
    return "new"

reflection.setMethod("new_method", new_method)  # True
```

### removeMethod

Removes a method from the class. Raises `ValueError` if the method does not exist.

```python
reflection.removeMethod("new_method")  # True
```

### getMethodSignature

Returns the `inspect.Signature` object for a specific method.

```python
sig = reflection.getMethodSignature("process")
# (self) -> str
```

## Properties

### getProperties

Returns the names of all properties defined in the class.

```python
class Config:
    @property
    def host(self) -> str:
        """Server hostname."""
        return "localhost"

    @property
    def _port(self) -> int:
        return 8080

reflection = ReflectionConcrete(Config)
reflection.getProperties()  # ["host", "_port"]
```

### Properties by Visibility

| Method | Description |
|--------|-------------|
| `getPublicProperties()` | Public properties |
| `getProtectedProperties()` | Protected properties (`_`) |
| `getPrivateProperties()` | Private properties (`__`, without mangling) |

### getProperty

Retrieves the value of a property by executing its getter. Raises `ValueError` if it does not exist, or `TypeError` if it is not a property.

```python
value = reflection.getProperty("host")  # "localhost"
```

### getPropertySignature

Returns the signature of a property's getter.

```python
sig = reflection.getPropertySignature("host")
# (self) -> str
```

### getPropertyDocstring

Returns the docstring of a property's getter, or `None` if not defined.

```python
doc = reflection.getPropertyDocstring("host")
# "Server hostname."
```

## Constructor and Dependencies

### getConstructorSignature

Returns the `inspect.Signature` object for the `__init__` method.

```python
sig = reflection.getConstructorSignature()
# (self, name: str = 'default') -> None
```

### constructorSignature

Analyzes the constructor dependencies, identifying resolved parameters (with default values or primitive types) and unresolved parameters (requiring dependency injection).

```python
analysis = reflection.constructorSignature()
# Signature(resolved=[...], unresolved=[...])
```

### methodSignature

Analyzes the dependencies of a specific method. Raises `AttributeError` if the method does not exist.

```python
analysis = reflection.methodSignature("process")
# Signature(resolved=[...], unresolved=[...])
```

## Internal Cache

`ReflectionConcrete` implements an in-memory caching system that stores the results of introspection operations. This avoids recomputing expensive results on repeated calls.

### Cache Protocol

The instance supports dictionary-style access for the cache:

```python
# Check existence
"key" in reflection

# Get value (None if not found)
reflection["key"]

# Set value
reflection["key"] = value

# Delete entry
del reflection["key"]
```

### clearCache

Clears all cache entries. Subsequent method calls will recompute their results.

```python
reflection.clearCache()
```

:::note
The cache is automatically cleared when mutation operations such as `setAttribute`, `removeAttribute`, `setMethod`, or `removeMethod` are used, ensuring data consistency.
:::