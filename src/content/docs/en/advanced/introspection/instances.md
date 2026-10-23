---
title: "ReflectionInstance"
description: "Inspect the data, methods, properties and signatures of an existing object."
editUrl: true
lastUpdated: false
---

`ReflectionInstance` inspects an already constructed object: its current data, defining class, methods, properties and signatures. Use it for diagnostics, adapters and extensions that need to examine a service without constructing another instance. It does not execute discovered methods or resolve their dependencies.

## Quick start

For data belonging to an imported class, construct a wrapper around the object.

```python
from orionis.introspection import ReflectionInstance
from orionis.support.types import StdClass

record = StdClass(status="ready")
record_reflection = ReflectionInstance(record)
assert record_reflection.getPublicAttributes() == {"status": "ready"}
assert record_reflection.getInstance() is record
```

## Prepare an importable object

Save this example class in `app/services/report_service.py`. Later sections reuse `service` and `reflected`. The range of members lets you verify every filter; an application only needs the members it actually uses.

```python
class ReportBase:
    def inherited(self) -> str:
        return "base"

    @property
    def inherited_label(self) -> str:
        return "base label"


class ReportService(ReportBase):
    """Generate reports for an application."""

    title: str
    _token: str
    __secret: str

    def __init__(self, title: str = "Sales") -> None:
        self.title = title
        self._token = "internal"
        self.__secret = "private"
        self.__trace__ = "trace"

    def render(self, limit: int = 10) -> str:
        """Render the report."""
        return f"{self.title}: {limit}"

    async def refresh(self) -> str:
        return self.title

    def _prepare(self) -> str:
        return self._token

    async def _prepare_async(self) -> str:
        return self._token

    def __sign(self) -> str:
        return self.__secret

    async def __sign_async(self) -> str:
        return self.__secret

    @classmethod
    def category(cls) -> str:
        return cls.__name__

    @classmethod
    async def category_async(cls) -> str:
        return cls.__name__

    @classmethod
    def _category(cls) -> str:
        return cls.__name__

    @classmethod
    async def _category_async(cls) -> str:
        return cls.__name__

    @classmethod
    def __category(cls) -> str:
        return cls.__name__

    @classmethod
    async def __category_async(cls) -> str:
        return cls.__name__

    @staticmethod
    def valid() -> bool:
        return True

    @staticmethod
    async def valid_async() -> bool:
        return True

    @staticmethod
    def _valid() -> bool:
        return True

    @staticmethod
    async def _valid_async() -> bool:
        return True

    @staticmethod
    def __valid() -> bool:
        return True

    @staticmethod
    async def __valid_async() -> bool:
        return True

    @property
    def label(self) -> str:
        """Human-readable report label."""
        return self.title.upper()

    @property
    def _length(self) -> int:
        return len(self.title)

    @property
    def __label(self) -> str:
        return self.__secret

    def temporary(self) -> None:
        return None
```

```python
from app.services.report_service import ReportService
from orionis.introspection import ReflectionInstance

service = ReportService()
reflected = ReflectionInstance(service)
assert reflected.getInstance() is service
```

<a id="reflectioninstance-method-init"></a>

### `__init__`

```python
def __init__(self, instance: Any) -> None: ...
```

`instance` is required and must be an object, not a class. Classes and objects whose `instance.__class__.__module__` is `builtins` or `abc` raise `TypeError`; the `__main__` module raises `ValueError`. Importability is not checked: a synthetic class with another module name can also be accepted. The example uses a class defined in an importable file so its source can be retrieved and `__main__` is avoided. Construction does not yet scan attributes or methods.

```python
reflected = ReflectionInstance(service)
```

## Identity and metadata

These methods take no arguments. They return references or metadata for the object’s class, not a copy of the service.

`getClassName()`, `getModuleName()` and `getModuleWithClassName()` use names captured when the wrapper is constructed. If you later change the class `__name__` or `__module__`, `clearCache()` does not refresh those fields; construct another wrapper to obtain the new names.

<a id="reflectioninstance-method-getinstance"></a>

### `getInstance`

```python
def getInstance(self) -> Any: ...
```

Return the reflected object itself (`Any`).

```python
assert reflected.getInstance() is service
```

<a id="reflectioninstance-method-getclass"></a>

### `getClass`

```python
def getClass(self) -> type: ...
```

Return its class (`type`).

```python
assert reflected.getClass() is ReportService
```

<a id="reflectioninstance-method-getclassname"></a>

### `getClassName`

```python
def getClassName(self) -> str: ...
```

Return the class `__name__` as `str`.

```python
assert reflected.getClassName() == "ReportService"
```

<a id="reflectioninstance-method-getmodulename"></a>

### `getModuleName`

```python
def getModuleName(self) -> str: ...
```

Return the class module as `str`.

```python
assert reflected.getModuleName() == "app.services.report_service"
```

<a id="reflectioninstance-method-getmodulewithclassname"></a>

### `getModuleWithClassName`

```python
def getModuleWithClassName(self) -> str: ...
```

Join the module and simple class name. Nested classes do not use `__qualname__` here.

```python
assert reflected.getModuleWithClassName() == "app.services.report_service.ReportService"
```

<a id="reflectioninstance-method-getdocstring"></a>

### `getDocstring`

```python
def getDocstring(self) -> str | None: ...
```

Return the class `__doc__`, or `None`; this is not the `__init__` docstring.

```python
assert reflected.getDocstring() == "Generate reports for an application."
```

<a id="reflectioninstance-method-getbaseclasses"></a>

### `getBaseClasses`

```python
def getBaseClasses(self) -> tuple[type, ...]: ...
```

Return a tuple of direct bases, not the entire MRO hierarchy.

```python
assert reflected.getBaseClasses()[0].__name__ == "ReportBase"
```

<a id="reflectioninstance-method-getannotations"></a>

### `getAnnotations`

```python
def getAnnotations(self) -> dict[str, type]: ...
```

Return a dictionary of class annotations. Its own private names omit the mangling prefix. This does not infer types from values or convert annotations into resolved dependencies.

```python
assert "title" in reflected.getAnnotations()
assert "__secret" in reflected.getAnnotations()
```

<a id="reflectioninstance-method-getfile"></a>

### `getFile`

```python
def getFile(self) -> str | None: ...
```

Return the class file path (`str`), memoized, or `None` when `inspect` raises `TypeError` or `OSError`.

```python
assert reflected.getFile().endswith("report_service.py")
```

<a id="reflectioninstance-method-getsourcecode"></a>

### `getSourceCode`

```python
def getSourceCode(self, method: str | None=None) -> str | None: ...
```

With no `method`, or an empty value, return the class source. With a name, return source for a method classified in `getMethods()`, accepting private names such as `__sign`. Dunder names, including `__init__`, do not belong to that list and return `None` when requested individually. Also return `None` for a missing method or unavailable source (`TypeError`/`OSError`). Each variant is memoized.

```python
assert "class ReportService" in reflected.getSourceCode()
assert "def render" in reflected.getSourceCode("render")
assert "def __sign" in reflected.getSourceCode("__sign")
assert reflected.getSourceCode("__init__") is None
assert reflected.getSourceCode("missing") is None
```

## Object attributes

Scanning uses `vars(instance)`: it enumerates the instance `__dict__`, without automatically including class variables or computed property values. An object with `__slots__` and no `__dict__` can be constructed, but these scans raise `TypeError`.

The dictionaries are cached and returned by reference. Prefixes classify Python names; they do not enforce access control. A private member such as `_ReportService__secret` appears as `__secret`; an inherited private member with another class prefix can be classified as protected.

<a id="reflectioninstance-method-getattributes"></a>

### `getAttributes`

```python
def getAttributes(self) -> dict[str, Any]: ...
```

Combine public, protected, own private and dunder entries in `dict[str, Any]`.

```python
assert reflected.getAttributes()["__secret"] == "private"
```

<a id="reflectioninstance-method-getpublicattributes"></a>

### `getPublicAttributes`

```python
def getPublicAttributes(self) -> dict[str, Any]: ...
```

Return entries whose names do not begin with `_`.

```python
assert reflected.getPublicAttributes() == {"title": "Sales"}
```

<a id="reflectioninstance-method-getprotectedattributes"></a>

### `getProtectedAttributes`

```python
def getProtectedAttributes(self) -> dict[str, Any]: ...
```

Return entries beginning with `_` that were not classified as own private or dunder entries.

```python
assert reflected.getProtectedAttributes()["_token"] == "internal"
```

<a id="reflectioninstance-method-getprivateattributes"></a>

### `getPrivateAttributes`

```python
def getPrivateAttributes(self) -> dict[str, Any]: ...
```

Return own private entries with unmangled names.

```python
assert reflected.getPrivateAttributes()["__secret"] == "private"
```

<a id="reflectioninstance-method-getdunderattributes"></a>

### `getDunderAttributes`

```python
def getDunderAttributes(self) -> dict[str, Any]: ...
```

Return names beginning and ending with `__`.

```python
assert reflected.getDunderAttributes()["__trace__"] == "trace"
```

<a id="reflectioninstance-method-getmagicattributes"></a>

### `getMagicAttributes`

```python
def getMagicAttributes(self) -> dict[str, Any]: ...
```

Alias of `getDunderAttributes()`; return the same cached dictionary.

```python
assert reflected.getMagicAttributes() is reflected.getDunderAttributes()
```

<a id="reflectioninstance-method-hasattribute"></a>

### `hasAttribute`

```python
def hasAttribute(self, name: str) -> bool: ...
```

`name: str` is required. Check the combined dictionary or `hasattr(instance, name)` and return `bool`; this can also detect class variables and properties. Dictionary scanning runs first.

```python
assert reflected.hasAttribute("title")
assert reflected.hasAttribute("label")
assert not reflected.hasAttribute("missing")
```

<a id="reflectioninstance-method-getattribute"></a>

### `getAttribute`

```python
def getAttribute(self, name: str, default: Any=None) -> Any: ...
```

`name` is required; `default=None` is used when absent. Prefer the cached dictionary and also evaluate a `getattr` lookup; that lookup can execute descriptors. Use unmangled names for own private entries. Getter exceptions can propagate.

```python
assert reflected.getAttribute("__secret") == "private"
assert reflected.getAttribute("missing", "fallback") == "fallback"
assert reflected.getAttribute("label") == "SALES"
```

<a id="reflectioninstance-method-getattributedocstring"></a>

### `getAttributeDocstring`

```python
def getAttributeDocstring(self, name: str) -> str | None: ...
```

Read the attribute value’s `__doc__`, or `None`; this does not extract declaration comments. `name` is required and accepts own private names. Missing attributes raise `AttributeError`.

```python
assert reflected.getAttributeDocstring("title") == str.__doc__
```

<a id="reflectioninstance-method-setattribute"></a>

### `setAttribute`

```python
def setAttribute(self, name: str, value: Any) -> bool: ...
```

`name` and `value` are required. Require a valid Python identifier that is not a keyword (`AttributeError`); reject callable values (`TypeError`). Mangle own private names, call `setattr`, clear the entire cache and return `True`. Setter and slot restrictions still apply.

```python
assert reflected.setAttribute("region", "EU") is True
assert service.region == "EU"
assert reflected.setAttribute("__secret", "updated") is True
assert reflected.getAttribute("__secret") == "updated"
```

<a id="reflectioninstance-method-removeattribute"></a>

### `removeAttribute`

```python
def removeAttribute(self, name: str) -> bool: ...
```

`name` is required. Delete through `delattr`, invalidate the cache and return `True`. Any lookup result equal to `None` is treated as absent, so an existing attribute set to `None` also raises `AttributeError`. Properties without deleters and class-only attributes can fail.

```python
assert reflected.removeAttribute("region") is True
assert not reflected.hasAttribute("region")
```

## Filter methods

Scanning traverses `dir(type(instance))` using static descriptor access: it includes inherited methods, distinguishes instance functions, `classmethod` and `staticmethod`, and separates coroutines with `inspect.iscoroutinefunction`. It does not invoke methods or property getters. A function returning an awaitable without being a coroutine function remains in the sync filter.

Own private members appear as `__sign`, without the class prefix. `getMethods()` excludes dunder names and combines the categories; it is not an execution order. Filters take no arguments and return cached lists of names, not bound methods.

<a id="reflectioninstance-method-getmethods"></a>

### `getMethods`

```python
def getMethods(self) -> list[str]: ...
```

All classified methods, excluding dunder names.

```python
assert "render" in reflected.getMethods()
assert "inherited" in reflected.getMethods()
```

<a id="reflectioninstance-method-getdundermethods"></a>

### `getDunderMethods`

```python
def getDunderMethods(self) -> list[str]: ...
```

Class dunder names, including inherited names. Scanning collects every `__...__` name from `dir(cls)` before checking callability, so entries such as `__module__` can appear.

```python
assert "__init__" in reflected.getDunderMethods()
```

<a id="reflectioninstance-method-getmagicmethods"></a>

### `getMagicMethods`

```python
def getMagicMethods(self) -> list[str]: ...
```

Alias of `getDunderMethods()`.

```python
assert reflected.getMagicMethods() is reflected.getDunderMethods()
```

### Instance methods

<a id="reflectioninstance-method-getpublicmethods"></a>

`getPublicMethods(self) -> list[str]` — Return public methods, both sync and async.

```python
assert "render" in reflected.getPublicMethods()
```

<a id="reflectioninstance-method-getpublicsyncmethods"></a>

`getPublicSyncMethods(self) -> list[str]` — Return public methods that are synchronous.

```python
assert "render" in reflected.getPublicSyncMethods()
```

<a id="reflectioninstance-method-getpublicasyncmethods"></a>

`getPublicAsyncMethods(self) -> list[str]` — Return public methods that are asynchronous.

```python
assert "refresh" in reflected.getPublicAsyncMethods()
```

<a id="reflectioninstance-method-getprotectedmethods"></a>

`getProtectedMethods(self) -> list[str]` — Return protected methods, both sync and async.

```python
assert "_prepare" in reflected.getProtectedMethods()
```

<a id="reflectioninstance-method-getprotectedsyncmethods"></a>

`getProtectedSyncMethods(self) -> list[str]` — Return protected methods that are synchronous.

```python
assert "_prepare" in reflected.getProtectedSyncMethods()
```

<a id="reflectioninstance-method-getprotectedasyncmethods"></a>

`getProtectedAsyncMethods(self) -> list[str]` — Return protected methods that are asynchronous.

```python
assert "_prepare_async" in reflected.getProtectedAsyncMethods()
```

<a id="reflectioninstance-method-getprivatemethods"></a>

`getPrivateMethods(self) -> list[str]` — Return own private methods, both sync and async.

```python
assert "__sign" in reflected.getPrivateMethods()
```

<a id="reflectioninstance-method-getprivatesyncmethods"></a>

`getPrivateSyncMethods(self) -> list[str]` — Return own private methods that are synchronous.

```python
assert "__sign" in reflected.getPrivateSyncMethods()
```

<a id="reflectioninstance-method-getprivateasyncmethods"></a>

`getPrivateAsyncMethods(self) -> list[str]` — Return own private methods that are asynchronous.

```python
assert "__sign_async" in reflected.getPrivateAsyncMethods()
```

### Class methods

<a id="reflectioninstance-method-getpublicclassmethods"></a>

`getPublicClassMethods(self) -> list[str]` — Return public methods, both sync and async.

```python
assert "category" in reflected.getPublicClassMethods()
```

<a id="reflectioninstance-method-getpublicclasssyncmethods"></a>

`getPublicClassSyncMethods(self) -> list[str]` — Return public methods that are synchronous.

```python
assert "category" in reflected.getPublicClassSyncMethods()
```

<a id="reflectioninstance-method-getpublicclassasyncmethods"></a>

`getPublicClassAsyncMethods(self) -> list[str]` — Return public methods that are asynchronous.

```python
assert "category_async" in reflected.getPublicClassAsyncMethods()
```

<a id="reflectioninstance-method-getprotectedclassmethods"></a>

`getProtectedClassMethods(self) -> list[str]` — Return protected methods, both sync and async.

```python
assert "_category" in reflected.getProtectedClassMethods()
```

<a id="reflectioninstance-method-getprotectedclasssyncmethods"></a>

`getProtectedClassSyncMethods(self) -> list[str]` — Return protected methods that are synchronous.

```python
assert "_category" in reflected.getProtectedClassSyncMethods()
```

<a id="reflectioninstance-method-getprotectedclassasyncmethods"></a>

`getProtectedClassAsyncMethods(self) -> list[str]` — Return protected methods that are asynchronous.

```python
assert "_category_async" in reflected.getProtectedClassAsyncMethods()
```

<a id="reflectioninstance-method-getprivateclassmethods"></a>

`getPrivateClassMethods(self) -> list[str]` — Return own private methods, both sync and async.

```python
assert "__category" in reflected.getPrivateClassMethods()
```

<a id="reflectioninstance-method-getprivateclasssyncmethods"></a>

`getPrivateClassSyncMethods(self) -> list[str]` — Return own private methods that are synchronous.

```python
assert "__category" in reflected.getPrivateClassSyncMethods()
```

<a id="reflectioninstance-method-getprivateclassasyncmethods"></a>

`getPrivateClassAsyncMethods(self) -> list[str]` — Return own private methods that are asynchronous.

```python
assert "__category_async" in reflected.getPrivateClassAsyncMethods()
```

### Static methods

<a id="reflectioninstance-method-getpublicstaticmethods"></a>

`getPublicStaticMethods(self) -> list[str]` — Return public methods, both sync and async.

```python
assert "valid" in reflected.getPublicStaticMethods()
```

<a id="reflectioninstance-method-getpublicstaticsyncmethods"></a>

`getPublicStaticSyncMethods(self) -> list[str]` — Return public methods that are synchronous.

```python
assert "valid" in reflected.getPublicStaticSyncMethods()
```

<a id="reflectioninstance-method-getpublicstaticasyncmethods"></a>

`getPublicStaticAsyncMethods(self) -> list[str]` — Return public methods that are asynchronous.

```python
assert "valid_async" in reflected.getPublicStaticAsyncMethods()
```

<a id="reflectioninstance-method-getprotectedstaticmethods"></a>

`getProtectedStaticMethods(self) -> list[str]` — Return protected methods, both sync and async.

```python
assert "_valid" in reflected.getProtectedStaticMethods()
```

<a id="reflectioninstance-method-getprotectedstaticsyncmethods"></a>

`getProtectedStaticSyncMethods(self) -> list[str]` — Return protected methods that are synchronous.

```python
assert "_valid" in reflected.getProtectedStaticSyncMethods()
```

<a id="reflectioninstance-method-getprotectedstaticasyncmethods"></a>

`getProtectedStaticAsyncMethods(self) -> list[str]` — Return protected methods that are asynchronous.

```python
assert "_valid_async" in reflected.getProtectedStaticAsyncMethods()
```

<a id="reflectioninstance-method-getprivatestaticmethods"></a>

`getPrivateStaticMethods(self) -> list[str]` — Return own private methods, both sync and async.

```python
assert "__valid" in reflected.getPrivateStaticMethods()
```

<a id="reflectioninstance-method-getprivatestaticsyncmethods"></a>

`getPrivateStaticSyncMethods(self) -> list[str]` — Return own private methods that are synchronous.

```python
assert "__valid" in reflected.getPrivateStaticSyncMethods()
```

<a id="reflectioninstance-method-getprivatestaticasyncmethods"></a>

`getPrivateStaticAsyncMethods(self) -> list[str]` — Return own private methods that are asynchronous.

```python
assert "__valid_async" in reflected.getPrivateStaticAsyncMethods()
```

## Method signatures and editing

<a id="reflectioninstance-method-hasmethod"></a>

### `hasMethod`

```python
def hasMethod(self, name: str) -> bool: ...
```

Check whether required `name` belongs to the classified class method set. This does not inspect instance-only attached callables or include dunder names.

```python
assert reflected.hasMethod("render")
assert reflected.hasMethod("__sign")
assert not reflected.hasMethod("__init__")
```

<a id="reflectioninstance-method-getmethodsignature"></a>

### `getMethodSignature`

```python
def getMethodSignature(self, name: str) -> inspect.Signature: ...
```

With required `name`, return an `inspect.Signature` for a callable class member, mangling own private names. Dunder names such as `__init__` are supported independently of `hasMethod()`. An instance method retains `self` in this signature; a classmethod already bound to its class does not retain `cls`. Non-callables raise `AttributeError`; inspection errors propagate.

```python
assert list(reflected.getMethodSignature("render").parameters) == ["self", "limit"]
assert list(reflected.getMethodSignature("__init__").parameters) == ["self", "title"]
assert list(reflected.getMethodSignature("__sign").parameters) == ["self"]
```

<a id="reflectioninstance-method-getmethoddocstring"></a>

### `getMethodDocstring`

```python
def getMethodDocstring(self, name: str) -> str | None: ...
```

With required `name`, return the class callable docstring, or `None`. Own private names are supported and results are memoized. Missing or non-callable members raise `AttributeError`.

```python
assert reflected.getMethodDocstring("render") == "Render the report."
```

<a id="reflectioninstance-method-setmethod"></a>

### `setMethod`

```python
def setMethod(self, name: str, method: Callable) -> bool: ...
```

`name` and `method: Callable` are required. Validate the name as in `setAttribute`, require a callable (`TypeError`), assign it to the object and return `True`, clearing the cache. This neither binds `self` automatically nor adds it to class filters. Use `types.MethodType` when the function expects an instance.

```python
from types import MethodType

assert reflected.setMethod("extra", lambda: "ready") is True
assert service.extra() == "ready"
assert not reflected.hasMethod("extra")

def describe(instance):
    return instance.title

reflected.setMethod("describe", MethodType(describe, service))
assert service.describe() == "Sales"
```

<a id="reflectioninstance-method-removemethod"></a>

### `removeMethod`

```python
def removeMethod(self, name: str) -> None: ...
```

With required `name`, first require `hasMethod()` to be true, then delete the class member, not the instance member. Return `None`; this affects every instance of that class. Missing members raise `AttributeError`. It cannot remove a merely inherited method from a subclass. Use it for directly declared public or protected methods: ordinary private methods cannot be removed through this API because lookup and deletion do not apply the same mangling rules. Both `__secret` and `_Class__secret` raise `AttributeError` in that case.

```python
assert reflected.removeMethod("temporary") is None
assert not hasattr(service, "temporary")
```

<a id="reflectioninstance-method-constructorsignature"></a>

### `constructorSignature`

```python
def constructorSignature(self) -> Signature: ...
```

With no arguments, return an Orionis `Signature` for `__init__`. Its `resolved`, `unresolved` and `ordered` maps contain `Argument` objects; they are not constructed services. Results are memoized. See the dependencies guide for the complete classification.

```python
dependencies = reflected.constructorSignature()
assert list(dependencies.ordered) == ["title"]
assert "title" in dependencies.resolved
```

<a id="reflectioninstance-method-methodsignature"></a>

### `methodSignature`

```python
def methodSignature(self, method_name: str) -> Signature: ...
```

With required `method_name`, return an Orionis `Signature` for the method bound to the object, omitting `self`. Check `hasMethod()`, support own private names and memoize by name. Unclassified methods raise `AttributeError`. This does not call the container or execute the method.

```python
dependencies = reflected.methodSignature("render")
assert list(dependencies.ordered) == ["limit"]
assert "limit" in dependencies.resolved
```

## Properties

Enumerating `property` descriptors scans only `ReportService.__dict__`: inherited properties and dunder names `__...__` are omitted. Scanning does not execute getters. Signature and docstring lookups use `getattr` on the class and can find inherited property descriptors; `getProperty()` requires membership in the directly declared property list.

<a id="reflectioninstance-method-getproperties"></a>

### `getProperties`

```python
def getProperties(self) -> list[str]: ...
```

Return `list[str]` of directly declared properties of every visibility.

```python
assert reflected.getProperties() == ["label", "_length", "__label"]
assert "inherited_label" not in reflected.getProperties()
```

<a id="reflectioninstance-method-getpublicproperties"></a>

### `getPublicProperties`

```python
def getPublicProperties(self) -> list: ...
```

Return a list of directly declared public property names.

```python
assert reflected.getPublicProperties() == ["label"]
```

<a id="reflectioninstance-method-getprotectedproperties"></a>

### `getProtectedProperties`

```python
def getProtectedProperties(self) -> list: ...
```

Return a list of directly declared protected property names.

```python
assert reflected.getProtectedProperties() == ["_length"]
```

<a id="reflectioninstance-method-getprivateproperties"></a>

### `getPrivateProperties`

```python
def getPrivateProperties(self) -> list: ...
```

Return a list of unmangled, directly declared private property names.

```python
assert reflected.getPrivateProperties() == ["__label"]
```

<a id="reflectioninstance-method-getproperty"></a>

### `getProperty`

```python
def getProperty(self, name: str) -> Any: ...
```

`name` is required. Execute the getter and return its value (`Any`). Own private names are supported; a property outside the list raises `AttributeError`. Getter exceptions propagate.

```python
assert reflected.getProperty("label") == "SALES"
assert reflected.getProperty("__label") == "updated"
```

<a id="reflectioninstance-method-getpropertysignature"></a>

### `getPropertySignature`

```python
def getPropertySignature(self, name: str) -> inspect.Signature: ...
```

`name` is required. Return the getter `fget` `inspect.Signature`, including `self`, without executing it. Results are memoized; own private names are supported and non-property members raise `AttributeError`. A descriptor without a getter cannot normally be inspected.

```python
assert list(reflected.getPropertySignature("label").parameters) == ["self"]
```

<a id="reflectioninstance-method-getpropertydocstring"></a>

### `getPropertyDocstring`

```python
def getPropertyDocstring(self, name: str) -> str: ...
```

`name` is required. Return the getter docstring as `str`, or `""` when undocumented. Results are memoized and own private names are supported. Non-property members raise `AttributeError`.

```python
assert reflected.getPropertyDocstring("label") == "Human-readable report label."
assert reflected.getPropertyDocstring("_length") == ""
```

## Local cache and dictionary protocol

Collections and signatures are memoized snapshots per wrapper. External object or class changes do not refresh results automatically. This wrapper’s write operations clear its own cache; other wrappers for the same object retain their snapshots. Nothing is written to disk.

<a id="reflectioninstance-method-clearcache"></a>

### `clearCache`

```python
def clearCache(self) -> None: ...
```

Remove all entries and return `None`; subsequent access scans members again.

```python
reflected.getAttributes()
service.title = "Revenue"
assert reflected.getAttribute("title") == "Sales"
reflected.clearCache()
assert reflected.getAttribute("title") == "Revenue"
```

<a id="reflectioninstance-method-setitem"></a>

### `__setitem__`

```python
def __setitem__(self, key: str, value: object) -> None: ...
```

Store `value` under `key` in the cache and return `None`.

```python
reflected["custom:note"] = "diagnostic"
```

<a id="reflectioninstance-method-getitem"></a>

### `__getitem__`

```python
def __getitem__(self, key: str) -> object | None: ...
```

Return an entry, or `None` when absent; this does not raise `KeyError`.

```python
assert reflected["custom:note"] == "diagnostic"
assert reflected["custom:missing"] is None
```

<a id="reflectioninstance-method-contains"></a>

### `__contains__`

```python
def __contains__(self, key: str) -> bool: ...
```

Test cache key membership, not object attribute existence.

```python
assert "custom:note" in reflected
```

<a id="reflectioninstance-method-delitem"></a>

### `__delitem__`

```python
def __delitem__(self, key: str) -> None: ...
```

Remove an entry when present; absent keys do not fail. Return `None`.

```python
del reflected["custom:note"]
del reflected["custom:missing"]
```

Use your own prefixes for auxiliary entries: writing internal keys such as `attributes` or `methods` changes wrapper reads.

## Dependency injection

Do not register a generic wrapper without specifying its target object. In a controller or another Orionis-resolved component, inject the actual service and construct reflection around that instance. Reflection annotations describe dependencies; they do not inject them themselves.

```python
from app.services.report_service import ReportService
from orionis.http import JSONResponse
from orionis.introspection import ReflectionInstance


class DiagnosticsController:
    async def __call__(self, reports: ReportService) -> JSONResponse:
        reflected = ReflectionInstance(reports)
        return JSONResponse({
            "class": reflected.getModuleWithClassName(),
            "methods": reflected.getPublicMethods(),
        })
```

The wrapper contract is `IReflectionInstance`, importable from `orionis.introspection.instances.contracts.reflection`. It does not remove the need to specify the target object: injecting a particular wrapper requires an instance or factory configured for that target through your provider.

[Dependency signatures](/en/advanced/introspection/dependencies-and-discovery) · [Module reflection](/en/advanced/introspection/modules).
