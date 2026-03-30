---
title: 'Instances'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Instance

The `ReflectionInstance` class is an introspection utility designed to analyze instantiated Python objects at runtime. It provides a comprehensive API for inspecting attributes, methods, properties, metadata, and dependencies of any instance of a user-defined concrete class.

Unlike `ReflectionConcrete`, which operates on the class definition (the type), `ReflectionInstance` works directly with an **already instantiated object**, allowing access to both class attributes and instance attributes assigned in the constructor or during execution.

## Import

```python
from orionis.services.introspection.instances.reflection import ReflectionInstance
```

## Initialization

The class receives an object instance as its parameter. It validates that it is a valid instance of a user-defined class — not a type, a built-in, or an abstract class.

```python
from orionis.services.introspection.instances.reflection import ReflectionInstance

class UserService:
    """Service for managing users."""

    public_attr: int

    def __init__(self, x: int = 10) -> None:
        self.public_attr = x
        self._protected_attr = "prot"
        self.__private_attr = "priv"

    def greet(self) -> str:
        return f"Hello, user #{self.public_attr}"

service = UserService(42)
reflection = ReflectionInstance(service)
```

### Rejected instances

The following object types are not accepted and will raise exceptions:

```python
# TypeError: a class, not an instance
ReflectionInstance(UserService)

# TypeError: built-in type instance
ReflectionInstance(42)
ReflectionInstance("hello")

# TypeError: None
ReflectionInstance(None)
```

:::note
Instances created in the `__main__` module are also rejected with a `ValueError`. This applies to objects created directly in scripts that run as the entry point.
:::

## Contract

The `ReflectionInstance` class implements the `IReflectionInstance` contract, which defines the complete interface for instance introspection:

```python
from orionis.services.introspection.instances.contracts.reflection import IReflectionInstance
```

## Identity

### getInstance

Returns the original object instance being reflected.

```python
instance = reflection.getInstance()
# Returns the same UserService object passed to the constructor
```

### getClass

Returns the class of the instantiated object.

```python
cls = reflection.getClass()
# <class 'UserService'>
```

### getClassName

Returns the class name as a string.

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

Returns the class docstring of the instance, or `None` if not defined.

```python
doc = reflection.getDocstring()
# "Service for managing users."
```

### getBaseClasses

Returns a tuple of direct base classes of the instance's class.

```python
bases = reflection.getBaseClasses()
# (<class 'object'>,)
```

### getSourceCode

Returns the source code of the entire class or a specific method. Returns `None` if not available.

```python
# Source code of the entire class
source = reflection.getSourceCode()

# Source code of a specific method
method_source = reflection.getSourceCode("greet")
```

### getFile

Returns the file path where the class is defined, or `None` if not determinable.

```python
path = reflection.getFile()
# "/app/services/user_service.py"
```

### getAnnotations

Returns a dictionary with the class type annotations. Automatically resolves name mangling for private attributes.

```python
annotations = reflection.getAnnotations()
# {"public_attr": <class 'int'>}
```

## Attributes

`ReflectionInstance` classifies instance attributes by visibility level. Unlike `ReflectionConcrete`, here the inspected attributes are those assigned on the **instance** (via `vars(instance)`), not those on the class dictionary.

### getAttributes

Returns all instance attributes, combining public, protected, private, and dunder.

```python
attrs = reflection.getAttributes()
# {"public_attr": 42, "_protected_attr": "prot", "__private_attr": "priv", ...}
```

### getPublicAttributes

Returns public instance attributes (no underscore prefix).

```python
public = reflection.getPublicAttributes()
# {"public_attr": 42}
```

### getProtectedAttributes

Returns protected instance attributes (`_` prefix).

```python
protected = reflection.getProtectedAttributes()
# {"_protected_attr": "prot"}
```

### getPrivateAttributes

Returns private instance attributes (`__` prefix). Names are returned without name mangling.

```python
private = reflection.getPrivateAttributes()
# {"__private_attr": "priv"}
```

### getDunderAttributes / getMagicAttributes

Returns dunder attributes of the instance. `getMagicAttributes` is an alias for `getDunderAttributes`.

```python
dunder = reflection.getDunderAttributes()
magic = reflection.getMagicAttributes()  # Equivalent
```

### hasAttribute

Checks whether an attribute exists on the instance.

```python
reflection.hasAttribute("public_attr")   # True
reflection.hasAttribute("missing")       # False
```

### getAttribute

Gets the value of an attribute, with support for a default value.

```python
value = reflection.getAttribute("public_attr")         # 42
value = reflection.getAttribute("missing", "default")   # "default"
```

### setAttribute

Sets an attribute on the instance. Only non-callable values are accepted.

```python
reflection.setAttribute("public_attr", 100)  # True
```

Validations:
- The name must be a valid Python identifier
- Cannot be a reserved keyword
- The value cannot be a callable (raises `TypeError`)

### removeAttribute

Removes an attribute from the instance. Raises `AttributeError` if the attribute does not exist.

```python
reflection.removeAttribute("public_attr")  # True
```

### getAttributeDocstring

Returns the docstring of a specific attribute, or `None` if not defined. Raises `AttributeError` if the attribute does not exist.

```python
doc = reflection.getAttributeDocstring("public_attr")
```

## Methods

`ReflectionInstance` offers the same granular API as `ReflectionConcrete` for inspecting methods, organized by **visibility** (public, protected, private), **type** (instance, class, static, dunder), and **nature** (synchronous, asynchronous).

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

All methods return `list[str]` with the matching method names. Private method names are returned without name mangling.

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

reflection = ReflectionInstance(MyService())

reflection.getPublicMethods()        # ["process", "fetch"]
reflection.getPublicSyncMethods()    # ["process"]
reflection.getPublicAsyncMethods()   # ["fetch"]
reflection.getProtectedMethods()     # ["_validate"]
reflection.getPublicClassMethods()   # ["create"]
reflection.getPublicStaticMethods()  # ["version"]
```

### hasMethod

Checks whether a method exists on the instance (searches across all categories).

```python
reflection.hasMethod("process")   # True
reflection.hasMethod("missing")   # False
```

### setMethod

Adds a new method to the instance. Raises `AttributeError` if the name is invalid, and `TypeError` if the value is not callable.

```python
def new_method(self) -> str:
    return "new"

reflection.setMethod("new_method", new_method)  # True
```

### removeMethod

Removes a method from the instance's class. Raises `AttributeError` if the method does not exist.

```python
reflection.removeMethod("new_method")
```

### getMethodSignature

Returns the `inspect.Signature` object for a specific method. Raises `AttributeError` if the method does not exist or is not callable.

```python
sig = reflection.getMethodSignature("process")
# (self) -> str
```

### getMethodDocstring

Returns the docstring of a method, or `None` if not defined. Raises `AttributeError` if the method does not exist.

```python
doc = reflection.getMethodDocstring("process")
# "Return the value of public_attr."
```

## Properties

### getProperties

Returns the names of all properties defined in the instance's class.

```python
class Config:
    @property
    def host(self) -> str:
        """Server hostname."""
        return "localhost"

    @property
    def _port(self) -> int:
        return 8080

reflection = ReflectionInstance(Config())
reflection.getProperties()  # ["host", "_port"]
```

### Properties by Visibility

| Method | Description |
|--------|-------------|
| `getPublicProperties()` | Public properties |
| `getProtectedProperties()` | Protected properties (`_`) |
| `getPrivateProperties()` | Private properties (`__`, without mangling) |

### getProperty

Retrieves the value of a property from the instance. Raises `AttributeError` if it does not exist.

```python
value = reflection.getProperty("host")  # "localhost"
```

### getPropertySignature

Returns the signature of a property's getter. Raises `AttributeError` if not found.

```python
sig = reflection.getPropertySignature("host")
# (self) -> str
```

### getPropertyDocstring

Returns the docstring of a property's getter, or an empty string if not defined. Raises `AttributeError` if not found.

```python
doc = reflection.getPropertyDocstring("host")
# "Server hostname."
```

## Dependencies

### constructorSignature

Analyzes the constructor dependencies of the instance's class, identifying resolved parameters (with default values or primitive types) and unresolved parameters (requiring injection).

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

`ReflectionInstance` implements an in-memory caching system that stores introspection operation results to avoid expensive recomputation.

### Cache Protocol

The instance supports dictionary-style access:

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