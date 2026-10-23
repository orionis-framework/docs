---
title: "ReflectionCallable"
description: "Inspect functions and methods: identity, source, signatures, dependencies and wrapper cache."
editUrl: true
lastUpdated: false
---

`ReflectionCallable` wraps a function without executing it. Use it to build a handler catalog, read arguments or generate diagnostic information. It has ten public methods and five special methods of its own, including its constructor.

## Construction and imports

<a id="reflectioncallable-method-init"></a>

**`__init__(self, fn: callable) -> None`** takes a required target and returns `None` when initializing the wrapper. Import the class from `orionis.introspection`; its defining module is `orionis.introspection.callables.reflection`.

Accepts Python functions, lambdas and bound methods. It also accepts a callable object with `__code__`, but then reads `__name__`, `__module__` and `__doc__`: those attributes must exist. Implementing `__call__` alone is insufficient. An ordinary class without `__code__`, a builtin function or a callable without `__code__` raises `TypeError`; an object accepted by that filter but lacking the required metadata can raise `AttributeError`.

```python
from orionis.introspection import Reflection, ReflectionCallable

def quote(units: int, *, currency: str = "USD") -> str:
    """Build a quote label."""
    return f"{units} {currency}"

reflected = ReflectionCallable(quote)
assert reflected.getCallable() is quote
assert Reflection.callable(quote).getCallable() is quote
assert ReflectionCallable(lambda item: item).getName() == "<lambda>"

class Action:
    def __call__(self, value: int) -> int:
        return value

action = Action()
assert ReflectionCallable(action.__call__).getCallable() == action.__call__
for invalid in (len, Action, action, 42):
    try:
        ReflectionCallable(invalid)
    except TypeError:
        pass
    else:
        raise AssertionError("The target should not have been accepted")
```

`Reflection.callable(fn)` constructs the same wrapper type. The component has no global configuration or provider of its own.

## Identity and documentation

These methods take no additional arguments. The constructor captures the name, module and docstring; those three values are construction-time snapshots.

<a id="reflectioncallable-method-getcallable"></a>

**`getCallable(self) -> callable`** returns the exact original target, retaining identity and the binding of a bound method.

<a id="reflectioncallable-method-getname"></a>

**`getName(self) -> str`** returns the captured `__name__`, not `__qualname__`.

<a id="reflectioncallable-method-getmodulename"></a>

**`getModuleName(self) -> str`** returns `__module__` captured at construction.

<a id="reflectioncallable-method-getmodulewithcallablename"></a>

**`getModuleWithCallableName(self) -> str`** concatenates `module + "." + name`. For methods it does not include the class name or reconstruct a complete import path; do not treat it as a globally unique identifier for every handler.

<a id="reflectioncallable-method-getdocstring"></a>

**`getDocstring(self) -> str`** returns the original `__doc__` without normalizing indentation, or `""` if there was no docstring.

```python
from orionis.introspection import ReflectionCallable

def label(value: str) -> str:
    """Format a label."""
    return value.upper()

reflected = ReflectionCallable(label)
assert reflected.getCallable() is label
assert reflected.getName() == "label"
assert reflected.getModuleName() == label.__module__
assert reflected.getModuleWithCallableName() == f"{label.__module__}.label"
assert reflected.getDocstring() == "Format a label."

class Catalog:
    def update(self) -> None:
        pass

method = ReflectionCallable(Catalog().update)
assert method.getModuleWithCallableName() == f"{Catalog.__module__}.update"
assert method.getDocstring() == ""
```

## File and source code

<a id="reflectioncallable-method-getsourcecode"></a>

**`getSourceCode(self) -> str`** reads `inspect.getsource(fn)` and caches the text, including indentation. Converts a retrieval `OSError` into `AttributeError`, preserving the cause. Other inspection errors can propagate.

<a id="reflectioncallable-method-getfile"></a>

**`getFile(self) -> str`** returns and caches `inspect.getfile(fn)`. This is the path Python associates with the code; the method does not normalize it further or guarantee a synthetic file exists. It propagates inspection errors, such as `TypeError` when a file cannot be determined.

Save and execute this example in a `.py` file. Interactive sessions or dynamically generated code may have readable signatures without retrievable source.

```python
from orionis.introspection import ReflectionCallable

def calculate(value: int) -> int:
    return value * 2

reflected = ReflectionCallable(calculate)
assert "def calculate(" in reflected.getSourceCode()
assert reflected.getFile() == calculate.__code__.co_filename
assert reflected.getSourceCode() == reflected.getSourceCode()
```

## Python signature and Orionis dependencies

<a id="reflectioncallable-method-getsignature"></a>

**`getSignature(self) -> inspect.Signature`** returns and caches `inspect.signature(fn)`: parameters, types, defaults and return annotation. It does not manually remove parameters from an unbound function; Python applies binding when the target is a bound method. Propagates `inspect.signature()` errors.

<a id="reflectioncallable-method-getdependencies"></a>

**`getDependencies(self) -> Signature`** delegates to `ReflectDependencies(fn).callableSignature()` and caches the result. `Signature` here is the Orionis entity, not `inspect.Signature`. It classifies resolved/unresolved arguments and their order; it does not construct services, validate payloads or invoke the target.

```python
import inspect
from orionis.introspection import ReflectionCallable

class TaxService:
    pass

def invoice(tax: TaxService, subtotal: float, *, currency: str = "USD") -> float:
    return subtotal

reflected = ReflectionCallable(invoice)
python_signature = reflected.getSignature()
assert isinstance(python_signature, inspect.Signature)
assert python_signature.parameters["currency"].default == "USD"
assert python_signature.return_annotation is float

dependencies = reflected.getDependencies()
assert dependencies.getResolved()["tax"].type is TaxService
assert dependencies.getResolved()["currency"].default == "USD"
assert "subtotal" in dependencies.getUnresolved()
assert list(dependencies.getAllOrdered()) == ["tax", "subtotal", "currency"]
assert reflected.getSignature() is python_signature
assert reflected.getDependencies() is dependencies
```

Forward references, defaults, schemas, variadic parameters and errors are detailed in [Dependencies and signatures](/en/advanced/introspection/dependencies-and-discovery). Use the [container](/en/architecture/service-container/bindings-and-invocation) to execute a service with those arguments.

## Cache protocol and clearing

The wrapper has a cache shared by its calculations and values stored through brackets. `key` arguments address that cache, not function attributes. The special methods add no validation beyond the underlying dictionary.

<a id="reflectioncallable-method-getitem"></a>

**`__getitem__(self, key: str) -> object | None`** returns the stored value or `None` for an absent key; absence does not raise `KeyError`.

<a id="reflectioncallable-method-setitem"></a>

**`__setitem__(self, key: str, value: object) -> None`** stores any value in the wrapper cache. Does not modify the function.

<a id="reflectioncallable-method-contains"></a>

**`__contains__(self, key: str) -> bool`** checks key existence even when its stored value is `None`.

<a id="reflectioncallable-method-delitem"></a>

**`__delitem__(self, key: str) -> None`** removes an entry if present; deleting an absent key is harmless.

<a id="reflectioncallable-method-clearcache"></a>

**`clearCache(self) -> None`** removes every entry, whether calculated or added by the application. Deferred reads recompute afterward; it does not modify the target, refresh the captured name/module/docstring or clear `ReflectDependencies` internal LRU caches.

```python
from orionis.introspection import ReflectionCallable

def run(value: int = 1) -> int:
    """Original documentation."""
    return value

reflected = ReflectionCallable(run)
reflected["app.note"] = None
assert "app.note" in reflected
assert reflected["app.note"] is None
assert reflected["app.missing"] is None
del reflected["app.note"]
del reflected["app.missing"]
assert "app.note" not in reflected

before = reflected.getSignature()
run.__name__ = "renamed"
run.__doc__ = "Changed documentation."
reflected["app.note"] = "reviewed"
reflected.clearCache()
assert "app.note" not in reflected
assert reflected.getSignature() is not before
assert reflected.getName() == "run"
assert reflected.getDocstring() == "Original documentation."
fresh = ReflectionCallable(run)
assert fresh.getName() == "renamed"
assert fresh.getDocstring() == "Changed documentation."
```

Use application keys such as `app.note`. The `source_code`, `file`, `signature` and `dependencies` keys belong to internal calculations: overwriting them can replace a result with an incompatible value. Maps and entities returned by dependency analysis can share references; check their cache rules before modifying them.

## Integration and dependency injection

There is no implicit target for the container to inspect. Construct `ReflectionCallable(handler)` where the handler is known, or inject an application service that receives it explicitly:

```python
from orionis.http import JSONResponse
from orionis.introspection import ReflectionCallable

class HandlerCatalog:
    def describe(self, handler) -> dict:
        reflected = ReflectionCallable(handler)
        return {
            "name": reflected.getName(),
            "parameters": list(reflected.getSignature().parameters),
        }

class DiagnosticsController:
    def __init__(self, catalog: HandlerCatalog) -> None:
        self.catalog = catalog

    async def __call__(self) -> JSONResponse:
        return JSONResponse(self.catalog.describe(self.__call__))
```

The container can construct `HandlerCatalog` and inject it into the controller. To deliberately inject a prepared wrapper, bind that instance with `app.instance(ReflectionCallable, wrapper)`; this binds a particular target and shares its cache according to the binding. `IReflectionCallable` requires an explicit binding if you choose that contract. No native registration determines which function to wrap.
