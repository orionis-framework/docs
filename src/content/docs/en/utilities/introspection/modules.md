---
title: "ReflectionModule"
description: "Inspect classes, constants, functions and imports in Python modules."
editUrl: true
lastUpdated: false
---

`ReflectionModule` imports a Python module and classifies the objects in its namespace: classes, constants, functions and imported modules. Use it to inspect extensions or build a catalog of loaded components. Unlike `ModuleInspector` file analysis, construction **can execute module code** through Python’s normal import system.

## Quick start

```python
from orionis.introspection import ReflectionModule

metadata = ReflectionModule("orionis.metadata.framework")
assert metadata.getConstant("NAME") == "orionis"
```

## Example module

Save this file as `app/plugins/catalog.py`. The following examples reuse that module and the `reflected` wrapper.

```python
import math
from pathlib import Path

PUBLIC_LIMIT = 10
_INTERNAL_LIMIT = 20
__PRIVATE_LIMIT = 30


class CatalogPlugin:
    def run(self) -> str:
        return "catalog"


class _InternalPlugin:
    pass


class __PrivatePlugin:
    pass


def list_items() -> list[str]:
    return ["book"]


async def refresh_items() -> int:
    return 1


def _prepare() -> bool:
    return True


async def _prepare_async() -> bool:
    return True


def __sign() -> str:
    return "signed"


async def __sign_async() -> str:
    return "signed"
```

```python
from orionis.introspection import ReflectionModule

reflected = ReflectionModule("app.plugins.catalog")
```

<a id="reflectionmodule-method-init"></a>

### `__init__`

```python
def __init__(self, module: str) -> None: ...
```

`module` is a required string containing an importable name, not a file path or module object. An empty string, whitespace-only string or another type raises `TypeError`. Any exception raised during import is wrapped in `TypeError`, preserving its original cause. This does not reload a module already present in `sys.modules`.

```python
reflected = ReflectionModule("app.plugins.catalog")
```

<a id="reflectionmodule-method-getmodule"></a>

### `getModule`

```python
def getModule(self) -> object: ...
```

Take no arguments. Return the imported module object (`object` in the signature), shared with other consumers of that module.

```python
import importlib

assert reflected.getModule() is importlib.import_module("app.plugins.catalog")
```

## Classes and class aliases

Any namespace value satisfying `isinstance(value, type)` is a class. Imported classes are included: `value.__module__` need not match the inspected module. Keys are variable names or aliases in that module; they need not equal `Class.__name__`.

<a id="reflectionmodule-method-getclasses"></a>

### `getClasses`

```python
def getClasses(self) -> dict: ...
```

With no arguments, return a `dict` of all classes and aliases, including names beginning with `_`.

```python
assert "CatalogPlugin" in reflected.getClasses()
assert "Path" in reflected.getClasses()
```

<a id="reflectionmodule-method-getpublicclasses"></a>

### `getPublicClasses`

```python
def getPublicClasses(self) -> dict: ...
```

With no arguments, return a `dict` whose names do not start with `_`.

```python
assert "CatalogPlugin" in reflected.getPublicClasses()
assert "_InternalPlugin" not in reflected.getPublicClasses()
```

<a id="reflectionmodule-method-getprotectedclasses"></a>

### `getProtectedClasses`

```python
def getProtectedClasses(self) -> dict: ...
```

With no arguments, return a `dict` whose names start with `_`, but not `__`.

```python
assert "_InternalPlugin" in reflected.getProtectedClasses()
```

<a id="reflectionmodule-method-getprivateclasses"></a>

### `getPrivateClasses`

```python
def getPrivateClasses(self) -> dict: ...
```

With no arguments, return a `dict` whose names start with `__` and do not end with `__`. These are module names, without class name mangling.

```python
assert "__PrivatePlugin" in reflected.getPrivateClasses()
```

<a id="reflectionmodule-method-hasclass"></a>

### `hasClass`

```python
def hasClass(self, class_name: str) -> bool: ...
```

`class_name` is required. Return `bool` indicating whether that name is in `getClasses()`.

```python
assert reflected.hasClass("CatalogPlugin")
assert not reflected.hasClass("missing")
```

<a id="reflectionmodule-method-getclass"></a>

### `getClass`

```python
def getClass(self, class_name: str) -> type | None: ...
```

`class_name` is required. Return the class object, or `None` when absent. This does not construct an instance.

```python
plugin_type = reflected.getClass("CatalogPlugin")
assert plugin_type().run() == "catalog"
assert reflected.getClass("missing") is None
```

## Constants

Any name satisfying `str.isupper()` whose value is not callable is classified as a constant. This does not check `Final` or enforce immutability. Methods return actual values, not copies; a constant can contain a list or another mutable object.

<a id="reflectionmodule-method-getconstant"></a>

### `getConstant`

```python
def getConstant(self, constant_name: str) -> object | None: ...
```

`constant_name` is required. Return its value (`object`), or `None` when absent; a constant set to `None` yields the same result.

```python
assert reflected.getConstant("PUBLIC_LIMIT") == 10
assert reflected.getConstant("missing") is None
```

<a id="reflectionmodule-method-getconstants"></a>

### `getConstants`

```python
def getConstants(self) -> dict: ...
```

With no arguments, return a `dict` of all recognized constants, including names beginning with underscores.

```python
assert reflected.getConstants()["__PRIVATE_LIMIT"] == 30
```

<a id="reflectionmodule-method-getpublicconstants"></a>

### `getPublicConstants`

```python
def getPublicConstants(self) -> dict: ...
```

With no arguments, return a `dict` of constants without an `_` prefix.

```python
assert reflected.getPublicConstants()["PUBLIC_LIMIT"] == 10
```

<a id="reflectionmodule-method-getprotectedconstants"></a>

### `getProtectedConstants`

```python
def getProtectedConstants(self) -> dict: ...
```

With no arguments, return a `dict` of constants starting with `_`, but not `__`.

```python
assert reflected.getProtectedConstants()["_INTERNAL_LIMIT"] == 20
```

<a id="reflectionmodule-method-getprivateconstants"></a>

### `getPrivateConstants`

```python
def getPrivateConstants(self) -> dict: ...
```

With no arguments, return a `dict` of constants starting with `__` but not ending with `__`.

```python
assert reflected.getPrivateConstants()["__PRIVATE_LIMIT"] == 30
```

## Sync and async functions

Filters include only `types.FunctionType` instances: locally defined or imported Python functions. Classes, bound methods, callable objects and built-in functions are excluded. Async classification uses `inspect.iscoroutinefunction`; it does not execute functions or inspect their potential return values. An async generator is not a coroutine function and remains in the sync filter.

All these methods take no arguments and return a `dict` mapping names to functions. To run an async function, invoke it and await its result in your asynchronous flow.

<a id="reflectionmodule-method-getfunctions"></a>

### `getFunctions`

```python
def getFunctions(self) -> dict: ...
```

Return all Python functions, of every visibility.

```python
assert "list_items" in reflected.getFunctions()
assert "__sign" in reflected.getFunctions()
```

<a id="reflectionmodule-method-getpublicfunctions"></a>

`getPublicFunctions(self) -> dict` — Return public functions, both sync and async.

```python
assert "list_items" in reflected.getPublicFunctions()
```

<a id="reflectionmodule-method-getpublicsyncfunctions"></a>

`getPublicSyncFunctions(self) -> dict` — Return public functions that are synchronous.

```python
assert "list_items" in reflected.getPublicSyncFunctions()
```

<a id="reflectionmodule-method-getpublicasyncfunctions"></a>

`getPublicAsyncFunctions(self) -> dict` — Return public functions that are asynchronous.

```python
assert "refresh_items" in reflected.getPublicAsyncFunctions()
```

<a id="reflectionmodule-method-getprotectedfunctions"></a>

`getProtectedFunctions(self) -> dict` — Return protected functions, both sync and async.

```python
assert "_prepare" in reflected.getProtectedFunctions()
```

<a id="reflectionmodule-method-getprotectedsyncfunctions"></a>

`getProtectedSyncFunctions(self) -> dict` — Return protected functions that are synchronous.

```python
assert "_prepare" in reflected.getProtectedSyncFunctions()
```

<a id="reflectionmodule-method-getprotectedasyncfunctions"></a>

`getProtectedAsyncFunctions(self) -> dict` — Return protected functions that are asynchronous.

```python
assert "_prepare_async" in reflected.getProtectedAsyncFunctions()
```

<a id="reflectionmodule-method-getprivatefunctions"></a>

`getPrivateFunctions(self) -> dict` — Return private functions, both sync and async.

```python
assert "__sign" in reflected.getPrivateFunctions()
```

<a id="reflectionmodule-method-getprivatesyncfunctions"></a>

`getPrivateSyncFunctions(self) -> dict` — Return private functions that are synchronous.

```python
assert "__sign" in reflected.getPrivateSyncFunctions()
```

<a id="reflectionmodule-method-getprivateasyncfunctions"></a>

`getPrivateAsyncFunctions(self) -> dict` — Return private functions that are asynchronous.

```python
assert "__sign_async" in reflected.getPrivateAsyncFunctions()
```

```python
async def inspect_and_refresh() -> int:
    functions = reflected.getPublicAsyncFunctions()
    return await functions["refresh_items"]()
```

## Imports and source code

<a id="reflectionmodule-method-getimports"></a>

### `getImports`

```python
def getImports(self) -> dict: ...
```

With no arguments, return a `dict` of names whose values are `ModuleType` objects. `import math` appears as `math`; `from pathlib import Path` is not a module-object import, although `Path` appears among classes. This does not analyze file statements.

```python
assert "math" in reflected.getImports()
assert "Path" not in reflected.getImports()
```

<a id="reflectionmodule-method-getfile"></a>

### `getFile`

```python
def getFile(self) -> str: ...
```

With no arguments, return `str` using `inspect.getfile` and memoize the path. `TypeError` propagates for modules without an inspectable file, such as some built-in or dynamically created modules.

```python
assert reflected.getFile().endswith("catalog.py")
```

<a id="reflectionmodule-method-getsourcecode"></a>

### `getSourceCode`

```python
def getSourceCode(self) -> str: ...
```

With no arguments, open `getFile()` as UTF-8, return the complete contents (`str`) and memoize them. File, decoding and inspection errors are wrapped in `ValueError`, preserving the cause.

```python
assert "class CatalogPlugin" in reflected.getSourceCode()
```

## Change the namespace

These operations modify the module object in memory for all its consumers. They do not edit the Python file or update references already imported into another module. Use them when an extension needs to register or remove a class alias during initialization.

<a id="reflectionmodule-method-setclass"></a>

### `setClass`

```python
def setClass(self, class_name: str, cls: type) -> bool: ...
```

`class_name: str` and `cls: type` are required. Require a class (`TypeError`) and a valid identifier that is not a keyword (`ValueError`). Assign or replace the alias and return `True`. Only the `classes` entry is invalidated; call `clearCache()` before reusing previously calculated visibility filters.

```python
plugin_type = reflected.getClass("CatalogPlugin")
assert reflected.setClass("ExtraPlugin", plugin_type) is True
reflected.clearCache()
assert reflected.getPublicClasses()["ExtraPlugin"] is plugin_type
```

<a id="reflectionmodule-method-removeclass"></a>

### `removeClass`

```python
def removeClass(self, class_name: str) -> bool: ...
```

`class_name` is required. Delete an existing class alias and return `True`. Names absent from `getClasses()` raise `ValueError`. Like `setClass`, only `classes` is invalidated; clear the cache to refresh other filters.

```python
assert reflected.removeClass("ExtraPlugin") is True
reflected.clearCache()
assert not reflected.hasClass("ExtraPlugin")
```

## Wrapper cache

Result dictionaries are memoized and returned by reference. Do not modify them as if they were independent copies. Each wrapper owns its cache; external module changes do not invalidate it. The dictionary protocol operates on this cache, not on module attributes. No files are written.

<a id="reflectionmodule-method-clearcache"></a>

### `clearCache`

```python
def clearCache(self) -> None: ...
```

With no arguments, remove all cached results and return `None`. This neither reloads the module through `importlib.reload` nor clears the `ModuleInspector` class cache.

```python
assert reflected.clearCache() is None
assert "CatalogPlugin" in reflected.getClasses()
```

<a id="reflectionmodule-method-setitem"></a>

### `__setitem__`

```python
def __setitem__(self, key: str, value: object) -> None: ...
```

Store `value` under `key: str` and return `None`.

```python
reflected["custom:catalog"] = "loaded"
```

<a id="reflectionmodule-method-getitem"></a>

### `__getitem__`

```python
def __getitem__(self, key: str) -> object | None: ...
```

Look up `key: str` and return the value or `None`; this does not raise `KeyError`.

```python
assert reflected["custom:catalog"] == "loaded"
assert reflected["custom:missing"] is None
```

<a id="reflectionmodule-method-contains"></a>

### `__contains__`

```python
def __contains__(self, key: str) -> bool: ...
```

Return whether `key: str` is present in the cache.

```python
assert "custom:catalog" in reflected
```

<a id="reflectionmodule-method-delitem"></a>

### `__delitem__`

```python
def __delitem__(self, key: str) -> None: ...
```

Remove `key: str` if present; return `None` and do not fail for an absent key.

```python
del reflected["custom:catalog"]
del reflected["custom:missing"]
```

Avoid writing internal keys such as `classes` or `functions`: they directly control wrapper reads.

## Use from injected components

The target module is application data. Encapsulate wrapper construction in a service and inject that service through Orionis. Do not register a generic `ReflectionModule` instance without a module name; reflection itself does not automatically register plugins.

```python
from orionis.http import JSONResponse
from orionis.introspection import ReflectionModule


class PluginCatalog:
    def names(self) -> list[str]:
        module = ReflectionModule("app.plugins.catalog")
        return sorted(module.getPublicClasses())


class PluginController:
    async def __call__(self, catalog: PluginCatalog) -> JSONResponse:
        return JSONResponse({"classes": catalog.names()})
```

The wrapper contract is `IReflectionModule`, importable from `orionis.introspection.modules.contracts.reflection`. To inject that contract, explicitly register an instance or factory constructing the wrapper for the chosen module name.

[Discover modules and load classes](/en/utilities/introspection/module-discovery).
