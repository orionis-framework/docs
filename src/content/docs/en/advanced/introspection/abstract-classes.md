---
title: "ReflectionAbstract"
description: "Inspect, classify, analyze signatures and modify abstract classes."
editUrl: true
lastUpdated: false
---

`ReflectionAbstract` inspects a class **without creating an instance**. Use it to build action catalogs, verify conventions and inspect signatures for development tools. It can also mutate data and remove methods on the original class.

The following examples form an executable walkthrough: save the initial block and subsequent snippets, in order, to a `.py` file. Source retrieval requires this file; a class created in an interactive console may not have retrievable source.

## Construction and example class

<a id="reflectionabstract-method-init"></a>

```text
__init__(self, abstract: type) -> None
```

Required `abstract` must satisfy `inspect.isabstract()`: inheriting from `ABC` with no remaining abstract methods is insufficient. A non-abstract class raises `TypeError`; an invalid input lacking `__name__` can also raise `AttributeError` while constructing the error message. The contract is never instantiated.

```python
from abc import ABC, abstractmethod
from orionis.introspection import ReflectionAbstract

class Parent:
    inherited = "base"

    def inheritedMethod(self) -> str:
        return "base"

class ReportContract(Parent, ABC):
    """Report endpoint metadata."""

    format: str = "json"
    _label: str = "reports"
    __token: str = "secret"
    __feature__ = "reports"
    declared_only: str

    def __init__(self, limit: int = 10) -> None:
        self.instance_only = limit

    @abstractmethod
    def render(self, item_id: int, mode: str = "brief") -> str:
        return f"{item_id}:{mode}"

    def summary(self) -> str:
        return "summary"

    async def fetch(self) -> str:
        return "data"

    def _check(self) -> bool:
        return True

    async def _fetch(self) -> str:
        return "data"

    def __sign(self) -> str:
        return "signature"

    async def __fetch(self) -> str:
        return "data"

    @staticmethod
    def normalize() -> str:
        return "json"

    @staticmethod
    async def normalizeAsync() -> str:
        return "json"

    @classmethod
    def build(cls) -> str:
        return cls.__name__

    @classmethod
    async def buildAsync(cls) -> str:
        return cls.__name__

    @staticmethod
    def _normalize() -> str:
        return "json"

    @staticmethod
    async def _normalizeAsync() -> str:
        return "json"

    @classmethod
    def _build(cls) -> str:
        return cls.__name__

    @classmethod
    async def _buildAsync(cls) -> str:
        return cls.__name__

    @staticmethod
    def __normalize() -> str:
        return "json"

    @staticmethod
    async def __normalizeAsync() -> str:
        return "json"

    @classmethod
    def __build(cls) -> str:
        return cls.__name__

    @classmethod
    async def __buildAsync(cls) -> str:
        return cls.__name__

    @property
    def title(self) -> str:
        """Report title."""
        return self.format

    @property
    def _title(self) -> str:
        """Report title."""
        return self.format

    @property
    def __title(self) -> str:
        """Report title."""
        return self.format

    def __repr__(self) -> str:
        return "Report"

r = ReflectionAbstract(ReportContract)
```

Import from `orionis.introspection`; the direct `orionis.introspection.abstract.reflection` path is also available. Query methods are synchronous even when inspected members are `async`.

## Classification rules

The scan traverses **only `Class.__dict__`**, not the MRO. Collection getters exclude inherited members; use `getBaseClasses()` to visit bases explicitly. A field created as `self.field` is not class data, and an annotation without a value is absent from attributes.

Classification distinguishes data, `property`, `staticmethod`, `classmethod` and other callables. It does not require every callable to be a conventional instance function. Async detection uses `inspect.iscoroutinefunction()` without execution: an async generator or a synchronous function returning an awaitable is not automatically classified as a coroutine function.

Public names do not start with `_`; protected names use `_`; private names are recognized through the class mangling prefix and exposed as `__name`. Dunder names also end in `__` and are queried separately. Normalization follows the prefix Python generates after removing leading underscores from the class name.

Use private names as written in source (`"__sign"`), rather than `"_ReportContract__sign"`. Classification compares prefixes; it is not access control and does not prevent private member access.

## Identity, documentation and source

<a id="reflectionabstract-method-getclass"></a>

**`getClass`**

```text
getClass(self) -> type
```

Returns the original class object (`type`) without constructing it.

```python
assert r.getClass() is ReportContract
```

<a id="reflectionabstract-method-getclassname"></a>

**`getClassName`**

```text
getClassName(self) -> str
```

Returns the `__name__` captured when constructing the wrapper as `str`, rather than `__qualname__`. `clearCache()` does not capture it again.

```python
assert r.getClassName() == "ReportContract"
```

<a id="reflectionabstract-method-getmodulename"></a>

**`getModuleName`**

```text
getModuleName(self) -> str
```

Returns the module name captured when constructing the wrapper as `str`. `clearCache()` does not capture it again.

```python
assert r.getModuleName() == ReportContract.__module__
```

<a id="reflectionabstract-method-getmodulewithclassname"></a>

**`getModuleWithClassName`**

```text
getModuleWithClassName(self) -> str
```

Returns `module.ClassName` as `str`, using names captured when constructing the wrapper. It does not add the enclosing scopes of a nested class.

```python
assert r.getModuleWithClassName() == f"{ReportContract.__module__}.ReportContract"
```

<a id="reflectionabstract-method-getdocstring"></a>

**`getDocstring`**

```text
getDocstring(self) -> str | None
```

Returns `__doc__` or `None`; it neither cleans the text nor inherits another class docstring.

```python
assert r.getDocstring() == "Report endpoint metadata."
```

<a id="reflectionabstract-method-getbaseclasses"></a>

**`getBaseClasses`**

```text
getBaseClasses(self) -> list[type]
```

Returns a list of direct base classes (`type`); it does not traverse the complete MRO.

```python
assert Parent in r.getBaseClasses()
```

<a id="reflectionabstract-method-getsourcecode"></a>

**`getSourceCode`**

```text
getSourceCode(self) -> str
```

Accepts no arguments. Returns the complete class source as `str` using `inspect.getsource()`. Converts `OSError` and `TypeError` to `ValueError` when unavailable. It does not accept a method selector.

```python
assert "class ReportContract" in r.getSourceCode()
```

<a id="reflectionabstract-method-getfile"></a>

**`getFile`**

```text
getFile(self) -> str
```

Returns the class file path as `str`. It converts a `TypeError` from `inspect.getfile()` into `ValueError`; it does not guarantee the file still exists.

```python
assert r.getFile().endswith(".py")
```

<a id="reflectionabstract-method-getannotations"></a>

**`getAnnotations`**

```text
getAnnotations(self) -> dict
```

Returns a `dict` of class annotations, including fields annotated without a value. It removes the class prefix from private names and does not inspect method annotations.

```python
assert "declared_only" in r.getAnnotations()
assert "__token" in r.getAnnotations()
```

## Class data

<a id="reflectionabstract-method-hasattribute"></a>

**`hasAttribute`**

```text
hasAttribute(self, attribute: str) -> bool
```

`attribute` is the required name of a class data attribute. Returns `bool`; methods, properties, inherited members and values only created by the constructor are excluded.

```python
assert r.hasAttribute("format")
assert not r.hasAttribute("declared_only")
assert not r.hasAttribute("inherited")
assert not r.hasAttribute("instance_only")
```

<a id="reflectionabstract-method-getattribute"></a>

**`getAttribute`**

```text
getAttribute(self, attribute: str) -> object | None
```

Required `attribute` is looked up only in classified data. Returns its value or `None` if missing. No `default` argument is supported. Use `hasAttribute()` to distinguish a stored `None` from missing data.

```python
assert r.getAttribute("format") == "json"
assert r.getAttribute("missing") is None
assert r.getAttribute("inherited") is None
```

<a id="reflectionabstract-method-getattributes"></a>

**`getAttributes`**

```text
getAttributes(self) -> dict
```

Returns a `dict` combining public, protected, normalized private and non-excluded dunder data, in that order. Instance fields and annotations without a value are excluded.

```python
attributes = r.getAttributes()
assert attributes["format"] == "json"
assert attributes["__token"] == "secret"
```

<a id="reflectionabstract-method-getpublicattributes"></a>

**`getPublicAttributes`**

```text
getPublicAttributes(self) -> dict
```

Returns a `dict` of data whose names do not begin with `_`.

```python
assert r.getPublicAttributes()["format"] == "json"
```

<a id="reflectionabstract-method-getprotectedattributes"></a>

**`getProtectedAttributes`**

```text
getProtectedAttributes(self) -> dict
```

Returns a `dict` of data starting with `_` that are neither private nor dunder.

```python
assert r.getProtectedAttributes()["_label"] == "reports"
```

<a id="reflectionabstract-method-getprivateattributes"></a>

**`getPrivateAttributes`**

```text
getPrivateAttributes(self) -> dict
```

Returns a `dict` of private data. Keys retain `__` while omitting the class prefix introduced by Python.

```python
assert r.getPrivateAttributes()["__token"] == "secret"
```

<a id="reflectionabstract-method-getdunderattributes"></a>

**`getDunderAttributes`**

```text
getDunderAttributes(self) -> dict
```

Returns a `dict` of custom `__name__` data. The implementation excludes Python metadata such as `__dict__`, `__module__`, `__doc__` and `__annotations__`.

```python
assert r.getDunderAttributes()["__feature__"] == "reports"
assert "__module__" not in r.getDunderAttributes()
```

<a id="reflectionabstract-method-getmagicattributes"></a>

**`getMagicAttributes`**

```text
getMagicAttributes(self) -> dict
```

Alias of `getDunderAttributes()`; returns the same cached dictionary.

```python
assert r.getMagicAttributes() is r.getDunderAttributes()
```

<a id="reflectionabstract-method-setattribute"></a>

**`setAttribute`**

```text
setAttribute(self, name: str, value: object) -> bool
```

`name` must be a valid Python identifier that is not a keyword (otherwise `ValueError`). Required `value` must not be callable (`TypeError`). Mutates the original class and returns `True`; private `__names` are supported. It neither validates annotations nor updates `__abstractmethods__`.

```python
assert r.setAttribute("extra_label", "export") is True
assert ReportContract.extra_label == "export"
assert r.removeAttribute("extra_label") is True
```

<a id="reflectionabstract-method-removeattribute"></a>

**`removeAttribute`**

```text
removeAttribute(self, name: str) -> bool
```

`name` identifies an own data attribute, using its original name when private. Removes the actual attribute and returns `True`. Raises `ValueError` when absent from the data classification; metaclass restrictions may propagate.

```python
r.setAttribute("__temporary", 20)
assert r.removeAttribute("__temporary") is True
assert not r.hasAttribute("__temporary")
```

Although the callable error from `setAttribute()` mentions `setMethod`, **`ReflectionAbstract` does not implement `setMethod()`**. This wrapper provides no method for adding functions.

## Instance methods

<a id="reflectionabstract-method-getmethods"></a>

**`getMethods`**

```text
getMethods(self) -> list[str]
```

Returns `list[str]`: instance, class and static methods, each category ordered by public, protected and private visibility. Properties and dunder methods are excluded; names are not alphabetically sorted.

```python
methods = r.getMethods()
assert "render" in methods and "build" in methods and "normalize" in methods
assert "title" not in methods and "__repr__" not in methods
```

<a id="reflectionabstract-method-getpublicmethods"></a>

**`getPublicMethods`**

```text
getPublicMethods(self) -> list[str]
```

Returns `list[str]` of public instance methods, including synchronous and asynchronous functions. It does not execute methods. No arguments are accepted.

```python
assert "summary" in r.getPublicMethods()
```

<a id="reflectionabstract-method-getpublicsyncmethods"></a>

**`getPublicSyncMethods`**

```text
getPublicSyncMethods(self) -> list[str]
```

Returns `list[str]` of public instance methods that are not coroutine functions. It does not execute methods. No arguments are accepted.

```python
assert "summary" in r.getPublicSyncMethods()
assert "fetch" not in r.getPublicSyncMethods()
```

<a id="reflectionabstract-method-getpublicasyncmethods"></a>

**`getPublicAsyncMethods`**

```text
getPublicAsyncMethods(self) -> list[str]
```

Returns `list[str]` of public instance methods recognized by `inspect.iscoroutinefunction()`. It does not execute methods. No arguments are accepted.

```python
assert "fetch" in r.getPublicAsyncMethods()
assert "summary" not in r.getPublicAsyncMethods()
```

<a id="reflectionabstract-method-getprotectedmethods"></a>

**`getProtectedMethods`**

```text
getProtectedMethods(self) -> list[str]
```

Returns `list[str]` of protected instance methods, including synchronous and asynchronous functions. It does not execute methods. No arguments are accepted.

```python
assert "_check" in r.getProtectedMethods()
```

<a id="reflectionabstract-method-getprotectedsyncmethods"></a>

**`getProtectedSyncMethods`**

```text
getProtectedSyncMethods(self) -> list[str]
```

Returns `list[str]` of protected instance methods that are not coroutine functions. It does not execute methods. No arguments are accepted.

```python
assert "_check" in r.getProtectedSyncMethods()
assert "_fetch" not in r.getProtectedSyncMethods()
```

<a id="reflectionabstract-method-getprotectedasyncmethods"></a>

**`getProtectedAsyncMethods`**

```text
getProtectedAsyncMethods(self) -> list[str]
```

Returns `list[str]` of protected instance methods recognized by `inspect.iscoroutinefunction()`. It does not execute methods. No arguments are accepted.

```python
assert "_fetch" in r.getProtectedAsyncMethods()
assert "_check" not in r.getProtectedAsyncMethods()
```

<a id="reflectionabstract-method-getprivatemethods"></a>

**`getPrivateMethods`**

```text
getPrivateMethods(self) -> list[str]
```

Returns `list[str]` of private instance methods, including synchronous and asynchronous functions. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__sign" in r.getPrivateMethods()
```

<a id="reflectionabstract-method-getprivatesyncmethods"></a>

**`getPrivateSyncMethods`**

```text
getPrivateSyncMethods(self) -> list[str]
```

Returns `list[str]` of private instance methods that are not coroutine functions. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__sign" in r.getPrivateSyncMethods()
assert "__fetch" not in r.getPrivateSyncMethods()
```

<a id="reflectionabstract-method-getprivateasyncmethods"></a>

**`getPrivateAsyncMethods`**

```text
getPrivateAsyncMethods(self) -> list[str]
```

Returns `list[str]` of private instance methods recognized by `inspect.iscoroutinefunction()`. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__fetch" in r.getPrivateAsyncMethods()
assert "__sign" not in r.getPrivateAsyncMethods()
```

## Class methods

<a id="reflectionabstract-method-getpublicclassmethods"></a>

**`getPublicClassMethods`**

```text
getPublicClassMethods(self) -> list[str]
```

Returns `list[str]` of public class (`@classmethod`) methods, including synchronous and asynchronous functions. It does not execute methods. No arguments are accepted.

```python
assert "build" in r.getPublicClassMethods()
```

<a id="reflectionabstract-method-getpublicclasssyncmethods"></a>

**`getPublicClassSyncMethods`**

```text
getPublicClassSyncMethods(self) -> list[str]
```

Returns `list[str]` of public class (`@classmethod`) methods that are not coroutine functions. It does not execute methods. No arguments are accepted.

```python
assert "build" in r.getPublicClassSyncMethods()
assert "buildAsync" not in r.getPublicClassSyncMethods()
```

<a id="reflectionabstract-method-getpublicclassasyncmethods"></a>

**`getPublicClassAsyncMethods`**

```text
getPublicClassAsyncMethods(self) -> list[str]
```

Returns `list[str]` of public class (`@classmethod`) methods recognized by `inspect.iscoroutinefunction()`. It does not execute methods. No arguments are accepted.

```python
assert "buildAsync" in r.getPublicClassAsyncMethods()
assert "build" not in r.getPublicClassAsyncMethods()
```

<a id="reflectionabstract-method-getprotectedclassmethods"></a>

**`getProtectedClassMethods`**

```text
getProtectedClassMethods(self) -> list[str]
```

Returns `list[str]` of protected class (`@classmethod`) methods, including synchronous and asynchronous functions. It does not execute methods. No arguments are accepted.

```python
assert "_build" in r.getProtectedClassMethods()
```

<a id="reflectionabstract-method-getprotectedclasssyncmethods"></a>

**`getProtectedClassSyncMethods`**

```text
getProtectedClassSyncMethods(self) -> list[str]
```

Returns `list[str]` of protected class (`@classmethod`) methods that are not coroutine functions. It does not execute methods. No arguments are accepted.

```python
assert "_build" in r.getProtectedClassSyncMethods()
assert "_buildAsync" not in r.getProtectedClassSyncMethods()
```

<a id="reflectionabstract-method-getprotectedclassasyncmethods"></a>

**`getProtectedClassAsyncMethods`**

```text
getProtectedClassAsyncMethods(self) -> list[str]
```

Returns `list[str]` of protected class (`@classmethod`) methods recognized by `inspect.iscoroutinefunction()`. It does not execute methods. No arguments are accepted.

```python
assert "_buildAsync" in r.getProtectedClassAsyncMethods()
assert "_build" not in r.getProtectedClassAsyncMethods()
```

<a id="reflectionabstract-method-getprivateclassmethods"></a>

**`getPrivateClassMethods`**

```text
getPrivateClassMethods(self) -> list[str]
```

Returns `list[str]` of private class (`@classmethod`) methods, including synchronous and asynchronous functions. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__build" in r.getPrivateClassMethods()
```

<a id="reflectionabstract-method-getprivateclasssyncmethods"></a>

**`getPrivateClassSyncMethods`**

```text
getPrivateClassSyncMethods(self) -> list[str]
```

Returns `list[str]` of private class (`@classmethod`) methods that are not coroutine functions. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__build" in r.getPrivateClassSyncMethods()
assert "__buildAsync" not in r.getPrivateClassSyncMethods()
```

<a id="reflectionabstract-method-getprivateclassasyncmethods"></a>

**`getPrivateClassAsyncMethods`**

```text
getPrivateClassAsyncMethods(self) -> list[str]
```

Returns `list[str]` of private class (`@classmethod`) methods recognized by `inspect.iscoroutinefunction()`. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__buildAsync" in r.getPrivateClassAsyncMethods()
assert "__build" not in r.getPrivateClassAsyncMethods()
```

## Static methods

<a id="reflectionabstract-method-getpublicstaticmethods"></a>

**`getPublicStaticMethods`**

```text
getPublicStaticMethods(self) -> list[str]
```

Returns `list[str]` of public static (`@staticmethod`) methods, including synchronous and asynchronous functions. It does not execute methods. No arguments are accepted.

```python
assert "normalize" in r.getPublicStaticMethods()
```

<a id="reflectionabstract-method-getpublicstaticsyncmethods"></a>

**`getPublicStaticSyncMethods`**

```text
getPublicStaticSyncMethods(self) -> list[str]
```

Returns `list[str]` of public static (`@staticmethod`) methods that are not coroutine functions. It does not execute methods. No arguments are accepted.

```python
assert "normalize" in r.getPublicStaticSyncMethods()
assert "normalizeAsync" not in r.getPublicStaticSyncMethods()
```

<a id="reflectionabstract-method-getpublicstaticasyncmethods"></a>

**`getPublicStaticAsyncMethods`**

```text
getPublicStaticAsyncMethods(self) -> list[str]
```

Returns `list[str]` of public static (`@staticmethod`) methods recognized by `inspect.iscoroutinefunction()`. It does not execute methods. No arguments are accepted.

```python
assert "normalizeAsync" in r.getPublicStaticAsyncMethods()
assert "normalize" not in r.getPublicStaticAsyncMethods()
```

<a id="reflectionabstract-method-getprotectedstaticmethods"></a>

**`getProtectedStaticMethods`**

```text
getProtectedStaticMethods(self) -> list[str]
```

Returns `list[str]` of protected static (`@staticmethod`) methods, including synchronous and asynchronous functions. It does not execute methods. No arguments are accepted.

```python
assert "_normalize" in r.getProtectedStaticMethods()
```

<a id="reflectionabstract-method-getprotectedstaticsyncmethods"></a>

**`getProtectedStaticSyncMethods`**

```text
getProtectedStaticSyncMethods(self) -> list[str]
```

Returns `list[str]` of protected static (`@staticmethod`) methods that are not coroutine functions. It does not execute methods. No arguments are accepted.

```python
assert "_normalize" in r.getProtectedStaticSyncMethods()
assert "_normalizeAsync" not in r.getProtectedStaticSyncMethods()
```

<a id="reflectionabstract-method-getprotectedstaticasyncmethods"></a>

**`getProtectedStaticAsyncMethods`**

```text
getProtectedStaticAsyncMethods(self) -> list[str]
```

Returns `list[str]` of protected static (`@staticmethod`) methods recognized by `inspect.iscoroutinefunction()`. It does not execute methods. No arguments are accepted.

```python
assert "_normalizeAsync" in r.getProtectedStaticAsyncMethods()
assert "_normalize" not in r.getProtectedStaticAsyncMethods()
```

<a id="reflectionabstract-method-getprivatestaticmethods"></a>

**`getPrivateStaticMethods`**

```text
getPrivateStaticMethods(self) -> list[str]
```

Returns `list[str]` of private static (`@staticmethod`) methods, including synchronous and asynchronous functions. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__normalize" in r.getPrivateStaticMethods()
```

<a id="reflectionabstract-method-getprivatestaticsyncmethods"></a>

**`getPrivateStaticSyncMethods`**

```text
getPrivateStaticSyncMethods(self) -> list[str]
```

Returns `list[str]` of private static (`@staticmethod`) methods that are not coroutine functions. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__normalize" in r.getPrivateStaticSyncMethods()
assert "__normalizeAsync" not in r.getPrivateStaticSyncMethods()
```

<a id="reflectionabstract-method-getprivatestaticasyncmethods"></a>

**`getPrivateStaticAsyncMethods`**

```text
getPrivateStaticAsyncMethods(self) -> list[str]
```

Returns `list[str]` of private static (`@staticmethod`) methods recognized by `inspect.iscoroutinefunction()`. Results use `__name`, without the class prefix. It does not execute methods. No arguments are accepted.

```python
assert "__normalizeAsync" in r.getPrivateStaticAsyncMethods()
assert "__normalize" not in r.getPrivateStaticAsyncMethods()
```

## Existence, mutations and dunder methods

<a id="reflectionabstract-method-hasmethod"></a>

**`hasMethod`**

```text
hasMethod(self, name: str) -> bool
```

Required `name` is checked against own instance, class and static methods. Returns `bool`; private names use their unmangled spelling. Dunder methods are separate and return `False` here.

```python
assert r.hasMethod("render")
assert r.hasMethod("__sign")
assert not r.hasMethod("__repr__")
assert not r.hasMethod("inheritedMethod")
```

<a id="reflectionabstract-method-removemethod"></a>

**`removeMethod`**

```text
removeMethod(self, name: str) -> bool
```

Removes own method `name` from the class and returns `True`; raises `ValueError` when `hasMethod()` is false. Private names and static/class descriptors are supported. It cannot remove dunder or inherited methods.

```python
original_summary = ReportContract.__dict__["summary"]
assert r.removeMethod("summary") is True
assert not r.hasMethod("summary")
setattr(ReportContract, "summary", original_summary)
r.clearCache()
```

<a id="reflectionabstract-method-getdundermethods"></a>

**`getDunderMethods`**

```text
getDunderMethods(self) -> list[str]
```

Returns `list[str]` of own `__name__` callables that are not properties, staticmethods or classmethods. Includes `__init__` when defined on the class.

```python
assert "__repr__" in r.getDunderMethods()
assert "__init__" in r.getDunderMethods()
```

<a id="reflectionabstract-method-getmagicmethods"></a>

**`getMagicMethods`**

```text
getMagicMethods(self) -> list[str]
```

Alias of `getDunderMethods()`; returns the same cached list.

```python
assert r.getMagicMethods() is r.getDunderMethods()
```

## Properties without constructing the class

<a id="reflectionabstract-method-getproperties"></a>

**`getProperties`**

```text
getProperties(self) -> list[str]
```

Returns `list[str]` of own `property` descriptors. It preserves declaration order, normalizes private names and does not execute getters.

```python
assert r.getProperties() == ["title", "_title", "__title"]
```

<a id="reflectionabstract-method-getpublicproperties"></a>

**`getPublicProperties`**

```text
getPublicProperties(self) -> list[str]
```

Returns `list[str]` of public properties.

```python
assert r.getPublicProperties() == ["title"]
```

<a id="reflectionabstract-method-getprotectedproperties"></a>

**`getProtectedProperties`**

```text
getProtectedProperties(self) -> list[str]
```

Returns `list[str]` of protected properties.

```python
assert r.getProtectedProperties() == ["_title"]
```

<a id="reflectionabstract-method-getprivateproperties"></a>

**`getPrivateProperties`**

```text
getPrivateProperties(self) -> list[str]
```

Returns `list[str]` of private properties using their original spelling.

```python
assert r.getPrivateProperties() == ["__title"]
```

<a id="reflectionabstract-method-getpropertysignature"></a>

**`getPropertySignature`**

```text
getPropertySignature(self, name: str) -> inspect.Signature
```

Required `name` returns `inspect.Signature` for the `fget` getter, including `self`, without executing it. Supports private and inherited properties accessible through `getattr()`. Raises `ValueError` when missing, and `TypeError` for non-properties or uninspectable getters.

```python
assert list(r.getPropertySignature("title").parameters) == ["self"]
assert list(r.getPropertySignature("__title").parameters) == ["self"]
```

<a id="reflectionabstract-method-getpropertydocstring"></a>

**`getPropertyDocstring`**

```text
getPropertyDocstring(self, name: str) -> str | None
```

Required `name` returns `str | None` containing the `fget` docstring; a missing getter yields `None`. Supports private and inherited properties. Raises `ValueError` when absent and `TypeError` when the attribute is not a `property`.

```python
assert r.getPropertyDocstring("title") == "Report title."
assert r.getPropertyDocstring("__title") == "Report title."
```

## Signatures and dependency metadata

<a id="reflectionabstract-method-getmethodsignature"></a>

**`getMethodSignature`**

```text
getMethodSignature(self, name: str) -> inspect.Signature
```

Required `name` returns `inspect.Signature` without invoking the method: instance signatures retain `self`, whereas bound classmethods omit `cls`. Raises `ValueError` if not classified and `TypeError` if no longer callable; inspection errors can also propagate.

```python
signature = r.getMethodSignature("render")
assert list(signature.parameters) == ["self", "item_id", "mode"]
assert "cls" not in r.getMethodSignature("build").parameters
assert "self" not in r.getMethodSignature("normalize").parameters
```

<a id="reflectionabstract-method-constructorsignature"></a>

**`constructorSignature`**

```text
constructorSignature(self) -> Signature
```

Returns the Orionis `Signature` describing `__init__` dependencies without constructing the class. Its `resolved`, `unresolved` and `ordered` maps contain `Argument` objects. This is neither `inspect.Signature` nor service instance resolution.

```python
analysis = r.constructorSignature()
assert list(analysis.ordered) == ["limit"]
assert analysis.resolved["limit"].default == 10
```

<a id="reflectionabstract-method-methodsignature"></a>

**`methodSignature`**

```text
methodSignature(self, method_name: str) -> Signature
```

Required `method_name` returns a dependency `Signature` for an own method, omitting `self`/`cls` and classifying arguments without execution. Raises `AttributeError` when `hasMethod()` is false; analyzer errors propagate. Private names are supported.

```python
analysis = r.methodSignature("render")
assert list(analysis.ordered) == ["item_id", "mode"]
assert "item_id" in analysis.unresolved
assert analysis.resolved["mode"].default == "brief"
```

The last two methods delegate to [ReflectDependencies](/en/advanced/introspection/dependencies-and-discovery). `resolved` means sufficient type or default-value metadata exists; it does not mean a service has been created or registered. Required built-in `item_id: int` remains unresolved, whereas `mode="brief"` has a known default.

## Local cache and access operators

The first member getter performs the scan. Returned lists and dictionaries are the cached objects rather than defensive copies. Do not modify them to “edit” the class: that alters the cached view and may make queries inconsistent. Use mutation methods or copy returned results.

`setAttribute()`, `removeAttribute()` and `removeMethod()` invalidate member classifications but can retain previously computed signatures and other results. Call `clearCache()` after changing signatures, annotations or metadata. Direct changes to the class are not detected automatically either.

The class name, module name and private prefix are captured during construction and do not change after `clearCache()`. Construct another wrapper after changing `__name__` or `__module__`. The docstring is read directly on each call.

The following operators access **the wrapper cache**, rather than class attributes. Use custom keys distinct from internal keys (`attributes`, `methods`, etc.); overwriting or deleting internal keys can break scan consistency.

<a id="reflectionabstract-method-setitem"></a>

**`__setitem__`**

```text
__setitem__(self, key: str, value: object) -> None
```

Stores required `value` under required `key`; returns `None`. It does not change the class.

```python
r["app:note"] = "reviewed"
assert r["app:note"] == "reviewed"
```

<a id="reflectionabstract-method-getitem"></a>

**`__getitem__`**

```text
__getitem__(self, key: str) -> object | None
```

Returns the value under required `key`, or `None` when absent; it does not raise `KeyError`. Use `in` to distinguish a key storing `None`.

```python
assert r["app:note"] == "reviewed"
assert r["app:absent"] is None
```

<a id="reflectionabstract-method-contains"></a>

**`__contains__`**

```text
__contains__(self, key: str) -> bool
```

Returns `bool` indicating whether required `key` is stored, including when its value is `None`.

```python
r["app:empty"] = None
assert "app:empty" in r
assert "app:absent" not in r
```

<a id="reflectionabstract-method-delitem"></a>

**`__delitem__`**

```text
__delitem__(self, key: str) -> None
```

Removes required `key`, returns `None` and ignores missing keys.

```python
del r["app:note"]
del r["app:absent"]
assert "app:note" not in r
```

<a id="reflectionabstract-method-clearcache"></a>

**`clearCache`**

```text
clearCache(self) -> None
```

Returns `None`. Discards all data cached in this wrapper, including custom bracket keys. The next query recomputes reflection; this neither reverses class mutations nor empties the global dependency cache.

```python
r["app:note"] = "cached"
assert r.clearCache() is None
assert "app:note" not in r
assert "render" in r.getPublicMethods()
```

## Dependency injection integration

The wrapper must know **which class to inspect**. Annotating a parameter as `ReflectionAbstract` does not automatically select your application contract or component. Construct the reflector when the target is known, or encapsulate it in your own resolvable service. No native binding chooses that target for you.

```python
from orionis.http import JSONResponse

class ReportCatalog:
    def __init__(self) -> None:
        self.reflection = ReflectionAbstract(ReportContract)

    def actions(self) -> list[str]:
        return list(self.reflection.getPublicMethods())

class ReportExporter:
    def __init__(self, catalog: ReportCatalog) -> None:
        self.catalog = catalog

    def actions(self) -> list[str]:
        return self.catalog.actions()

class MetadataController:
    async def __call__(self, catalog: ReportCatalog) -> JSONResponse:
        return JSONResponse({"actions": catalog.actions()})
```

Here, `ReportCatalog` is an application service with a no-argument constructor. The catalog explicitly creates the reflector and returns a list copy. Constructor injection into another service uses the same `catalog: ReportCatalog` annotation. Direct access remains valid outside controllers. See [the container](/en/architecture/service-container) for registrations, lifetimes and custom contracts.

## Errors and practical limits

Queries do not execute actions or turn annotations into data validation. Mutations are real and affect every consumer of the class in the process; no class copy is created, and deleting the reflector does not undo changes. Descriptor or metaclass restrictions can make an operation fail; those exceptions propagate.

Method getters do not separate abstract declarations from concrete implementations: both appear according to visibility and descriptor type. The wrapper does not call `abc.update_abstractmethods()` after a mutation.

A name returned by `getDunderMethods()` is not automatically valid for `hasMethod()`, `removeMethod()`, `getMethodSignature()` or `methodSignature()`: these operations use the non-dunder method list. Properties have their own APIs.

Clearing this wrapper does not empty the shared `ReflectDependencies` caches after dynamic function changes. New functions are analyzed by identity, whereas editing annotations or defaults on the same function can leave earlier analysis cached; see [the dependency guide](/en/advanced/introspection/dependencies-and-discovery).
