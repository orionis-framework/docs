---
title: 'Abstract Classes'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Abstract

The `ReflectionAbstract` class is an advanced introspection utility designed to analyze Python abstract base classes (ABCs) at runtime. It provides a comprehensive API for inspecting attributes, methods, properties, metadata, and dependencies of any abstract class registered in the Orionis Framework.

This tool is especially useful for building dependency injection systems, generating automatic documentation, validating interface contracts, and performing runtime static analysis.

## Import

```python
from orionis.services.introspection.abstract.reflection import ReflectionAbstract
```

## Initialization

The `ReflectionAbstract` class receives a valid abstract class that inherits from `abc.ABC` as its parameter. If the provided class is not abstract, a `TypeError` will be raised.

```python
from abc import ABC, abstractmethod
from orionis.services.introspection.abstract.reflection import ReflectionAbstract

class MyContract(ABC):

    @abstractmethod
    def execute(self) -> str:
        """Execute the operation."""
        ...

reflection = ReflectionAbstract(MyContract)
```

If you attempt to pass a non-abstract class:

```python
class RegularClass:
    pass

# This will raise TypeError:
# "The class 'RegularClass' is not an abstract base class."
reflection = ReflectionAbstract(RegularClass)
```

## Contract

The `ReflectionAbstract` class implements the `IReflectionAbstract` contract, which defines the complete interface for abstract class introspection:

```python
from orionis.services.introspection.abstract.contracts.reflection import IReflectionAbstract
```

## Class Identity

These methods provide basic identification information about the reflected abstract class.

### getClass

Returns the type (the class) associated with the reflection instance.

```python
cls = reflection.getClass()
# <class 'MyContract'>
```

### getClassName

Returns the name of the abstract class as a string.

```python
name = reflection.getClassName()
# "MyContract"
```

### getModuleName

Returns the fully qualified module name where the class is defined.

```python
module = reflection.getModuleName()
# "app.contracts.my_contract"
```

### getModuleWithClassName

Returns the full module path along with the class name, separated by a dot.

```python
full_name = reflection.getModuleWithClassName()
# "app.contracts.my_contract.MyContract"
```

## Metadata

These methods extract descriptive information about the abstract class.

### getDocstring

Returns the class docstring, or `None` if one is not defined.

```python
doc = reflection.getDocstring()
# "Execute the operation." or None
```

### getBaseClasses

Returns a list of the direct base classes of the abstract class.

```python
bases = reflection.getBaseClasses()
# [<class 'abc.ABC'>]
```

### getSourceCode

Retrieves the complete source code of the class as a string. Raises `ValueError` if it cannot be obtained.

```python
source = reflection.getSourceCode()
```

### getFile

Returns the absolute file path where the class is defined. Raises `ValueError` if it cannot be determined.

```python
file_path = reflection.getFile()
# "/path/to/app/contracts/my_contract.py"
```

### getAnnotations

Returns a dictionary with the type annotations of the class attributes. Private attribute names are normalized by removing the name mangling prefix.

```python
from abc import ABC, abstractmethod

class Configurable(ABC):
    name: str
    __timeout: int

    @abstractmethod
    def configure(self) -> None:
        ...

reflection = ReflectionAbstract(Configurable)
annotations = reflection.getAnnotations()
# {"name": <class 'str'>, "__timeout": <class 'int'>}
```

## Attributes

The class provides a complete set of methods for inspecting and manipulating class-level attributes, organized by visibility level.

### hasAttribute

Checks whether the class has a specific attribute.

```python
exists = reflection.hasAttribute("my_attr")
# True or False
```

### getAttribute

Gets the value of a class attribute. Returns `None` if the attribute does not exist.

```python
value = reflection.getAttribute("my_attr")
```

### setAttribute

Sets the value of an attribute on the class. The name must be a valid Python identifier and cannot be a reserved keyword. The value cannot be callable.

```python
reflection.setAttribute("max_retries", 3)
# True
```

:::caution
This method directly modifies the reflected abstract class. Attributes with private names (starting with `__`) are automatically processed with name mangling.
:::

### removeAttribute

Removes an attribute from the class. Raises `ValueError` if the attribute does not exist.

```python
reflection.removeAttribute("max_retries")
# True
```

### getAttributes

Returns a dictionary with all class-level attributes, combining public, protected, private, and dunder attributes. Excludes callables, static/class methods, and properties.

```python
all_attrs = reflection.getAttributes()
# {"public_attr": 1, "_protected": 2, "__private": 3, "__custom__": 4}
```

### getPublicAttributes

Returns only public attributes (no underscore prefix).

```python
public = reflection.getPublicAttributes()
# {"public_attr": 1}
```

### getProtectedAttributes

Returns protected attributes (single leading underscore, not dunder or private).

```python
protected = reflection.getProtectedAttributes()
# {"_protected": 2}
```

### getPrivateAttributes

Returns private attributes (with name mangling). Names are normalized by removing the `_ClassName` prefix.

```python
private = reflection.getPrivateAttributes()
# {"__private": 3}
```

### getDunderAttributes

Returns custom dunder attributes (double underscores at the beginning and end). Automatically excludes Python built-in dunder attributes such as `__class__`, `__dict__`, `__module__`, etc.

```python
dunder = reflection.getDunderAttributes()
# {"__custom__": 4}
```

### getMagicAttributes

Alias for `getDunderAttributes()`. Returns the same magic attributes.

```python
magic = reflection.getMagicAttributes()
```

## Methods

The method introspection API is one of the most comprehensive features of `ReflectionAbstract`. It allows querying methods organized by visibility (public, protected, private), type (instance, class, static), and nature (synchronous, asynchronous).

### hasMethod

Checks whether the class contains a method with the given name.

```python
exists = reflection.hasMethod("execute")
# True or False
```

### removeMethod

Removes a method from the abstract class. Raises `ValueError` if the method does not exist.

```python
reflection.removeMethod("execute")
# True
```

### getMethodSignature

Retrieves the signature (`inspect.Signature`) of a specific method. Raises `ValueError` if the method does not exist or is not callable.

```python
import inspect

sig = reflection.getMethodSignature("execute")
# <Signature (self) -> str>
```

### getMethods

Returns a list with the names of all methods defined in the class, including public, protected, private, class, and static methods.

```python
all_methods = reflection.getMethods()
# ["execute", "validate", "_prepare", "__internal", "from_config", ...]
```

### Instance Methods

#### getPublicMethods

Returns the names of all public instance methods. Excludes dunder, protected, private, static, class methods, and properties.

```python
public = reflection.getPublicMethods()
# ["execute", "validate"]
```

#### getPublicSyncMethods

Returns only public synchronous methods (not coroutines).

```python
sync = reflection.getPublicSyncMethods()
```

#### getPublicAsyncMethods

Returns only public asynchronous methods (coroutine functions).

```python
async_methods = reflection.getPublicAsyncMethods()
```

#### getProtectedMethods

Returns protected instance methods (single leading underscore).

```python
protected = reflection.getProtectedMethods()
# ["_prepare", "_validate_input"]
```

#### getProtectedSyncMethods

Returns protected synchronous methods.

```python
sync = reflection.getProtectedSyncMethods()
```

#### getProtectedAsyncMethods

Returns protected asynchronous methods.

```python
async_methods = reflection.getProtectedAsyncMethods()
```

#### getPrivateMethods

Returns private instance methods (with name mangling). Names are normalized by removing the `_ClassName` prefix.

```python
private = reflection.getPrivateMethods()
# ["__internal_process"]
```

#### getPrivateSyncMethods

Returns private synchronous methods.

```python
sync = reflection.getPrivateSyncMethods()
```

#### getPrivateAsyncMethods

Returns private asynchronous methods.

```python
async_methods = reflection.getPrivateAsyncMethods()
```

### Class Methods

#### getPublicClassMethods

Returns public class methods (decorated with `@classmethod`).

```python
class_methods = reflection.getPublicClassMethods()
# ["from_config"]
```

#### getPublicClassSyncMethods

Returns public synchronous class methods.

```python
sync = reflection.getPublicClassSyncMethods()
```

#### getPublicClassAsyncMethods

Returns public asynchronous class methods.

```python
async_methods = reflection.getPublicClassAsyncMethods()
```

#### getProtectedClassMethods

Returns protected class methods.

```python
protected = reflection.getProtectedClassMethods()
```

#### getProtectedClassSyncMethods

Returns protected synchronous class methods.

```python
sync = reflection.getProtectedClassSyncMethods()
```

#### getProtectedClassAsyncMethods

Returns protected asynchronous class methods.

```python
async_methods = reflection.getProtectedClassAsyncMethods()
```

#### getPrivateClassMethods

Returns private class methods. Names are normalized by removing the name mangling prefix.

```python
private = reflection.getPrivateClassMethods()
```

#### getPrivateClassSyncMethods

Returns private synchronous class methods.

```python
sync = reflection.getPrivateClassSyncMethods()
```

#### getPrivateClassAsyncMethods

Returns private asynchronous class methods.

```python
async_methods = reflection.getPrivateClassAsyncMethods()
```

### Static Methods

#### getPublicStaticMethods

Returns public static methods (decorated with `@staticmethod`).

```python
static_methods = reflection.getPublicStaticMethods()
# ["utility_method"]
```

#### getPublicStaticSyncMethods

Returns public synchronous static methods.

```python
sync = reflection.getPublicStaticSyncMethods()
```

#### getPublicStaticAsyncMethods

Returns public asynchronous static methods.

```python
async_methods = reflection.getPublicStaticAsyncMethods()
```

#### getProtectedStaticMethods

Returns protected static methods.

```python
protected = reflection.getProtectedStaticMethods()
```

#### getProtectedStaticSyncMethods

Returns protected synchronous static methods.

```python
sync = reflection.getProtectedStaticSyncMethods()
```

#### getProtectedStaticAsyncMethods

Returns protected asynchronous static methods.

```python
async_methods = reflection.getProtectedStaticAsyncMethods()
```

#### getPrivateStaticMethods

Returns private static methods. Names are normalized by removing the name mangling prefix.

```python
private = reflection.getPrivateStaticMethods()
```

#### getPrivateStaticSyncMethods

Returns private synchronous static methods.

```python
sync = reflection.getPrivateStaticSyncMethods()
```

#### getPrivateStaticAsyncMethods

Returns private asynchronous static methods.

```python
async_methods = reflection.getPrivateStaticAsyncMethods()
```

### Dunder and Magic Methods

#### getDunderMethods

Returns all dunder methods (double underscores at the beginning and end) defined in the class. Excludes static methods, class methods, and properties.

```python
dunder = reflection.getDunderMethods()
# ["__init__", "__str__", "__repr__"]
```

#### getMagicMethods

Alias for `getDunderMethods()`.

```python
magic = reflection.getMagicMethods()
```

## Properties

Methods for inspecting properties (decorated with `@property`) defined in the abstract class.

### getProperties

Returns a list with the names of all properties. Private property names are normalized by removing the name mangling prefix.

```python
props = reflection.getProperties()
# ["name", "_status", "__secret"]
```

### getPublicProperties

Returns public properties (no underscore prefix).

```python
public = reflection.getPublicProperties()
# ["name"]
```

### getProtectedProperties

Returns protected properties (single leading underscore).

```python
protected = reflection.getProtectedProperties()
# ["_status"]
```

### getPrivateProperties

Returns private properties. Names are normalized by removing the `_ClassName` prefix.

```python
private = reflection.getPrivateProperties()
# ["__secret"]
```

### getPropertySignature

Retrieves the signature of a property's getter method. Raises `ValueError` if the property does not exist.

```python
sig = reflection.getPropertySignature("name")
# <Signature (self) -> str>
```

### getPropertyDocstring

Retrieves the docstring of a property's getter method. Returns `None` if there is no docstring.

```python
doc = reflection.getPropertyDocstring("name")
# "The name of the entity." or None
```

## Dependencies

These methods analyze constructor and method signatures to determine their dependencies, which is fundamental for the framework's dependency injection systems.

### constructorSignature

Returns a `Signature` object containing the constructor dependencies, including resolved dependencies (with annotated types) and unresolved dependencies (parameters without annotations or default values).

```python
sig = reflection.constructorSignature()
# Signature(resolved=[...], unresolved=[...])
```

### methodSignature

Returns a `Signature` object with the dependencies of a specific method. Raises `AttributeError` if the method does not exist.

```python
sig = reflection.methodSignature("execute")
# Signature(resolved=[...], unresolved=[...])
```

## Cache System

`ReflectionAbstract` implements an internal cache system to optimize performance. The results of introspection operations are automatically stored and reused in subsequent calls.

### Cache Protocol

The class implements the special methods `__getitem__`, `__setitem__`, `__contains__`, and `__delitem__`, allowing you to interact with the cache as if it were a dictionary:

```python
# Check if a key exists in the cache
"source_code" in reflection

# Get a cached value
value = reflection["source_code"]

# Set a cache value
reflection["custom_key"] = "custom_value"

# Delete a cache entry
del reflection["custom_key"]
```

### clearCache

Clears all reflection cache, forcing subsequent calls to recompute results.

```python
reflection.clearCache()
```

:::tip
The cache is automatically invalidated when attributes or methods are modified using `setAttribute`, `removeAttribute`, or `removeMethod`. You only need to call `clearCache()` manually if you make direct modifications to the class outside of the reflection API.
:::

## Complete Example

```python
from abc import ABC, abstractmethod
from orionis.services.introspection.abstract.reflection import ReflectionAbstract

class PaymentGateway(ABC):
    """Abstract payment gateway interface."""

    gateway_name: str
    _timeout: int = 30
    __retries: int = 3

    @abstractmethod
    def process_payment(self, amount: float, currency: str) -> bool:
        """Process a payment transaction."""
        ...

    @abstractmethod
    async def refund(self, transaction_id: str) -> bool:
        """Refund a transaction."""
        ...

    @classmethod
    def from_config(cls, config: dict) -> 'PaymentGateway':
        ...

    @staticmethod
    def supported_currencies() -> list:
        ...

    @property
    def name(self) -> str:
        """The gateway display name."""
        ...

# Create reflection instance
reflection = ReflectionAbstract(PaymentGateway)

# Identity
print(reflection.getClassName())
# "PaymentGateway"

# Metadata
print(reflection.getDocstring())
# "Abstract payment gateway interface."

print(reflection.getBaseClasses())
# [<class 'abc.ABC'>]

# Attributes by visibility
print(reflection.getPublicAttributes())
# {"gateway_name": <class 'str'>} or attributes with assigned values

print(reflection.getProtectedAttributes())
# {"_timeout": 30}

print(reflection.getPrivateAttributes())
# {"__retries": 3}

# Methods
print(reflection.getPublicMethods())
# ["process_payment", "refund"]

print(reflection.getPublicSyncMethods())
# ["process_payment"]

print(reflection.getPublicAsyncMethods())
# ["refund"]

print(reflection.getPublicClassMethods())
# ["from_config"]

print(reflection.getPublicStaticMethods())
# ["supported_currencies"]

# Properties
print(reflection.getPublicProperties())
# ["name"]

print(reflection.getPropertyDocstring("name"))
# "The gateway display name."

# Method dependencies
sig = reflection.methodSignature("process_payment")
print(sig)
```

## API Reference

| Method | Return | Description |
|--------|--------|-------------|
| `getClass()` | `type` | Returns the reflected abstract class |
| `getClassName()` | `str` | Class name |
| `getModuleName()` | `str` | Module where it is defined |
| `getModuleWithClassName()` | `str` | Full path `module.Class` |
| `getDocstring()` | `str \| None` | Class docstring |
| `getBaseClasses()` | `list[type]` | Direct base classes |
| `getSourceCode()` | `str` | Complete source code |
| `getFile()` | `str` | Absolute file path |
| `getAnnotations()` | `dict` | Type annotations |
| `hasAttribute(name)` | `bool` | Checks attribute existence |
| `getAttribute(name)` | `object \| None` | Attribute value |
| `setAttribute(name, value)` | `bool` | Sets an attribute |
| `removeAttribute(name)` | `bool` | Removes an attribute |
| `getAttributes()` | `dict` | All attributes |
| `getPublicAttributes()` | `dict` | Public attributes |
| `getProtectedAttributes()` | `dict` | Protected attributes |
| `getPrivateAttributes()` | `dict` | Private attributes |
| `getDunderAttributes()` | `dict` | Dunder attributes |
| `getMagicAttributes()` | `dict` | Alias for getDunderAttributes |
| `hasMethod(name)` | `bool` | Checks method existence |
| `removeMethod(name)` | `bool` | Removes a method |
| `getMethodSignature(name)` | `Signature` | Method signature |
| `getMethods()` | `list[str]` | All methods |
| `getPublicMethods()` | `list[str]` | Public methods |
| `getPublicSyncMethods()` | `list[str]` | Public synchronous methods |
| `getPublicAsyncMethods()` | `list[str]` | Public asynchronous methods |
| `getProtectedMethods()` | `list[str]` | Protected methods |
| `getProtectedSyncMethods()` | `list[str]` | Protected synchronous methods |
| `getProtectedAsyncMethods()` | `list[str]` | Protected asynchronous methods |
| `getPrivateMethods()` | `list[str]` | Private methods |
| `getPrivateSyncMethods()` | `list[str]` | Private synchronous methods |
| `getPrivateAsyncMethods()` | `list[str]` | Private asynchronous methods |
| `getPublicClassMethods()` | `list[str]` | Public class methods |
| `getPublicClassSyncMethods()` | `list[str]` | Public synchronous class methods |
| `getPublicClassAsyncMethods()` | `list[str]` | Public asynchronous class methods |
| `getProtectedClassMethods()` | `list[str]` | Protected class methods |
| `getProtectedClassSyncMethods()` | `list[str]` | Protected synchronous class methods |
| `getProtectedClassAsyncMethods()` | `list[str]` | Protected asynchronous class methods |
| `getPrivateClassMethods()` | `list[str]` | Private class methods |
| `getPrivateClassSyncMethods()` | `list[str]` | Private synchronous class methods |
| `getPrivateClassAsyncMethods()` | `list[str]` | Private asynchronous class methods |
| `getPublicStaticMethods()` | `list[str]` | Public static methods |
| `getPublicStaticSyncMethods()` | `list[str]` | Public synchronous static methods |
| `getPublicStaticAsyncMethods()` | `list[str]` | Public asynchronous static methods |
| `getProtectedStaticMethods()` | `list[str]` | Protected static methods |
| `getProtectedStaticSyncMethods()` | `list[str]` | Protected synchronous static methods |
| `getProtectedStaticAsyncMethods()` | `list[str]` | Protected asynchronous static methods |
| `getPrivateStaticMethods()` | `list[str]` | Private static methods |
| `getPrivateStaticSyncMethods()` | `list[str]` | Private synchronous static methods |
| `getPrivateStaticAsyncMethods()` | `list[str]` | Private asynchronous static methods |
| `getDunderMethods()` | `list[str]` | Dunder methods |
| `getMagicMethods()` | `list[str]` | Alias for getDunderMethods |
| `getProperties()` | `list[str]` | All properties |
| `getPublicProperties()` | `list[str]` | Public properties |
| `getProtectedProperties()` | `list[str]` | Protected properties |
| `getPrivateProperties()` | `list[str]` | Private properties |
| `getPropertySignature(name)` | `Signature` | Property getter signature |
| `getPropertyDocstring(name)` | `str \| None` | Getter docstring |
| `constructorSignature()` | `Signature` | Constructor dependencies |
| `methodSignature(name)` | `Signature` | Method dependencies |
| `clearCache()` | `None` | Clears all cache |