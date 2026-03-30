---
title: 'Callables'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Callable

The `ReflectionCallable` class is an introspection utility designed to analyze Python functions, methods, and lambdas at runtime. It provides a clean and consistent API for extracting metadata, source code, signatures, and dependencies from any valid callable.

Unlike `ReflectionAbstract`, which operates on abstract classes, `ReflectionCallable` focuses exclusively on individual callable objects: regular functions, bound instance methods, static methods, and lambda expressions.

## Import

```python
from orionis.services.introspection.callables.reflection import ReflectionCallable
```

## Initialization

The class receives a callable as its parameter. Regular functions, bound methods, static methods, and lambdas are accepted. If the argument is not a valid callable with a `__code__` attribute, a `TypeError` will be raised.

```python
from orionis.services.introspection.callables.reflection import ReflectionCallable

def my_function(x: int, y: str = "hello") -> bool:
    """Return whether x is positive."""
    return x > 0

reflection = ReflectionCallable(my_function)
```

### Accepted Callables

```python
# Regular function
reflection = ReflectionCallable(my_function)

# Lambda
reflection = ReflectionCallable(lambda a, b: a + b)

# Bound method (instance method)
class MyClass:
    def process(self, value: int) -> int:
        return value * 2

obj = MyClass()
reflection = ReflectionCallable(obj.process)

# Static method (accessed from the class)
class Utils:
    @staticmethod
    def compute(n: int) -> int:
        return n ** 2

reflection = ReflectionCallable(Utils.compute)
```

### Rejected Callables

The following types are not accepted and will raise `TypeError`:

```python
# Integer (not callable)
ReflectionCallable(42)
# TypeError: Expected a function, method, or lambda, got int

# Class (no __code__)
ReflectionCallable(MyClass)
# TypeError: Expected a function, method, or lambda, got type

# Built-in (no __code__)
ReflectionCallable(len)
# TypeError: Expected a function, method, or lambda, got builtin_function_or_method
```

## Contract

The class implements the `IReflectionCallable` contract, which defines the complete introspection interface for callables:

```python
from orionis.services.introspection.callables.contracts.reflection import IReflectionCallable
```

The abstract methods defined in the contract are: `getCallable`, `getName`, `getModuleName`, `getModuleWithCallableName`, `getDocstring`, `getSourceCode`, `getFile`, `getSignature`, `getDependencies`, and `clearCache`.

## Identity

Methods for obtaining identification information about the callable.

### getCallable

Returns the original callable object passed to the constructor.

```python
fn = reflection.getCallable()
# <function my_function at 0x...>
```

### getName

Returns the name of the callable as defined in its declaration.

```python
name = reflection.getName()
# "my_function"
```

For lambdas, the name will be `"<lambda>"`.

### getModuleName

Returns the name of the module where the callable is defined.

```python
module = reflection.getModuleName()
# "app.services.processor"
```

### getModuleWithCallableName

Returns the fully qualified name, combining the module and callable name separated by a dot.

```python
fqn = reflection.getModuleWithCallableName()
# "app.services.processor.my_function"
```

## Metadata

### getDocstring

Returns the callable's docstring. If no docstring is defined, returns an empty string.

```python
doc = reflection.getDocstring()
# "Return whether x is positive."

# Function without docstring
def no_doc():
    pass

rc = ReflectionCallable(no_doc)
rc.getDocstring()
# ""
```

### getSourceCode

Retrieves the complete source code of the callable as a string. The result is automatically cached. Raises `AttributeError` if the source code is not available.

```python
source = reflection.getSourceCode()
# "def my_function(x: int, y: str = \"hello\") -> bool:\n    ..."
```

### getFile

Returns the absolute file path where the callable is defined. The result is cached. Raises `TypeError` if the path cannot be determined (e.g., for built-ins).

```python
path = reflection.getFile()
# "/path/to/app/services/processor.py"
```

## Signature and Parameters

### getSignature

Returns an `inspect.Signature` object describing the callable's parameters, including names, default values, and type annotations.

```python
import inspect

sig = reflection.getSignature()
# <Signature (x: int, y: str = 'hello') -> bool>

# Access individual parameters
params = sig.parameters
print(params["x"].annotation)
# <class 'int'>

print(params["y"].default)
# "hello"
```

For bound methods, the `self` parameter is automatically excluded from the signature.

```python
class MyClass:
    def process(self, value: int) -> int:
        return value * 2

obj = MyClass()
rc = ReflectionCallable(obj.process)
sig = rc.getSignature()
# <Signature (value: int) -> int>
# 'self' does not appear in the signature
```

## Dependencies

### getDependencies

Analyzes the callable's signature and returns a `Signature` object containing resolved dependencies (parameters with type annotations) and unresolved dependencies (parameters without annotations or default values).

This method is fundamental for the framework's dependency injection system, as it determines which services a callable needs in order to be executed.

```python
from orionis.services.introspection.callables.reflection import ReflectionCallable

def create_user(name: str, db: DatabaseService, logger: Logger = None) -> User:
    ...

rc = ReflectionCallable(create_user)
deps = rc.getDependencies()
# Signature(resolved=[...], unresolved=[...])
```

For a function without parameters, the dependency lists will be empty:

```python
def simple():
    pass

rc = ReflectionCallable(simple)
deps = rc.getDependencies()
```

## Cache System

`ReflectionCallable` implements an internal cache system that automatically stores the results of expensive operations such as `getSourceCode`, `getFile`, `getSignature`, and `getDependencies`. This prevents recalculating values on successive calls.

### Cache Protocol

The class implements the special methods `__getitem__`, `__setitem__`, `__contains__`, and `__delitem__`, allowing you to interact with the internal cache as a dictionary:

```python
# Check if a key exists in the cache
"source_code" in reflection

# Get a cached value
value = reflection["source_code"]

# Store a custom value
reflection["custom_key"] = "custom_value"

# Delete a cache entry
del reflection["custom_key"]

# Getting a non-existent key returns None
reflection["absent_key"]  # None
```

:::note
Deleting a key that does not exist does not raise any error; the operation is silently ignored.
:::

### clearCache

Clears all reflection cache, forcing subsequent calls to recompute results from scratch.

```python
# Force source code recomputation
reflection.getSourceCode()  # computed and cached
reflection.clearCache()     # all cache cleared
reflection.getSourceCode()  # recomputed
```

## Complete Example

```python
from orionis.services.introspection.callables.reflection import ReflectionCallable

def process_payment(amount: float, currency: str = "USD") -> bool:
    """Process a payment transaction and return success status."""
    return amount > 0

# Create reflection instance
rc = ReflectionCallable(process_payment)

# Identity
print(rc.getName())
# "process_payment"

print(rc.getModuleName())
# "__main__"

print(rc.getModuleWithCallableName())
# "__main__.process_payment"

# Metadata
print(rc.getDocstring())
# "Process a payment transaction and return success status."

print(rc.getFile())
# "/path/to/script.py"

# Signature
sig = rc.getSignature()
print(sig)
# (amount: float, currency: str = 'USD') -> bool

for name, param in sig.parameters.items():
    print(f"  {name}: annotation={param.annotation}, default={param.default}")
# amount: annotation=<class 'float'>, default=<class 'inspect._empty'>
# currency: annotation=<class 'str'>, default=USD

# Dependencies
deps = rc.getDependencies()
print(deps)

# Cache
rc.clearCache()
```

## API Reference

| Method | Return | Description |
|--------|--------|-------------|
| `getCallable()` | `callable` | Returns the original callable |
| `getName()` | `str` | Callable name |
| `getModuleName()` | `str` | Module where it is defined |
| `getModuleWithCallableName()` | `str` | Full name `module.callable` |
| `getDocstring()` | `str` | Docstring or empty string |
| `getSourceCode()` | `str` | Complete source code |
| `getFile()` | `str` | Absolute file path |
| `getSignature()` | `inspect.Signature` | Signature with parameters and types |
| `getDependencies()` | `Signature` | Resolved and unresolved dependencies |
| `clearCache()` | `None` | Clears all internal cache |