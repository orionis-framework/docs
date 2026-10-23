---
title: "Reflection: classification and selection"
description: "Select wrappers and distinguish Python classes, functions, coroutines, generators, descriptors and objects."
editUrl: true
lastUpdated: false
---

`Reflection` groups **31 static methods**: five wrapper factories and 26 predicates. It does not automatically analyze an object through `Reflection(obj)`, resolve dependencies or require a booted application.

```python
from orionis.introspection import Reflection

def handler(value: int) -> int:
    return value * 2

assert Reflection.isFunction(handler)
assert Reflection.callable(handler).getCallable() is handler
```

All arguments below are required and used directly. `Any` and `Callable` are signature annotations; `IReflection*` return types are contracts implemented by the concrete wrappers exported by the package.

## Create the appropriate wrapper

<a id="reflection-method-instance"></a>

**`instance(instance: Any) -> IReflectionInstance`** creates a [ReflectionInstance](/en/advanced/introspection/instances) over an existing object. It does not construct the target. The wrapper rejects classes and instances from `builtins`, `abc` and `__main__` according to its rules.

<a id="reflection-method-abstract"></a>

**`abstract(abstract: type) -> IReflectionAbstract`** creates a [ReflectionAbstract](/en/advanced/introspection/abstract-classes) for a class recognized as abstract by `inspect.isabstract()`. It does not instantiate the class.

<a id="reflection-method-concrete"></a>

**`concrete(concrete: type) -> IReflectionConcrete`** creates a [ReflectionConcrete](/en/advanced/introspection/concrete-classes), whose constructor validates input with `isConcreteClass()`. It does not create an instance of the reflected service.

<a id="reflection-method-module"></a>

**`module(module: str) -> IReflectionModule`** creates a [ReflectionModule](/en/advanced/introspection/modules) from an importable name such as `"app.services.catalog"`. It imports the module; it does not accept a file path or a `ModuleType` object.

<a id="reflection-method-callable"></a>

**`callable(fn: Callable) -> IReflectionCallable`** creates a [ReflectionCallable](/en/advanced/introspection/callables) over a function, method or lambda accepted by its constructor. It does not execute the function.

```python
from abc import ABC, abstractmethod
from orionis.introspection import Reflection
from orionis.support.types import StdClass

class CatalogSource(ABC):
    @abstractmethod
    def load(self) -> list:
        pass

class CatalogService:
    def total(self, prices: list[int]) -> int:
        return sum(prices)

assert Reflection.abstract(CatalogSource).getClass() is CatalogSource
assert Reflection.concrete(CatalogService).getClass() is CatalogService
record = StdClass(name="Ada")
assert Reflection.instance(record).getInstance() is record
assert Reflection.module("orionis.metadata.framework").getModule().__name__ == (
    "orionis.metadata.framework"
)
assert Reflection.callable(CatalogService.total).getCallable() is CatalogService.total
```

Factories do not share a global wrapper registry: each call constructs a wrapper. They propagate the corresponding constructor's errors. See those references for target validation, available members and source retrieval.

## Functions, methods and objects

Each predicate takes `obj: Any` and returns `bool`; it does not call the inspected object.

<a id="reflection-method-isfunction"></a>

**`isFunction(obj: Any) -> bool`** uses `inspect.isfunction`. Recognizes Python functions, lambdas and `async def` functions, but not builtin functions.

<a id="reflection-method-ismethod"></a>

**`isMethod(obj: Any) -> bool`** uses `inspect.ismethod`. A method bound to an instance differs from the function obtained through its class.

<a id="reflection-method-isbuiltin"></a>

**`isBuiltIn(obj: Any) -> bool`** uses `inspect.isbuiltin`: recognizes builtin functions or methods, not every class or instance in the `builtins` module.

<a id="reflection-method-isroutine"></a>

**`isRoutine(obj: Any) -> bool`** uses `inspect.isroutine` for Python or builtin functions and methods. It does not mean “any callable object”.

<a id="reflection-method-isclass"></a>

**`isClass(obj: Any) -> bool`** uses `inspect.isclass`; includes builtin classes such as `int`.

<a id="reflection-method-isinstance"></a>

**`isInstance(obj: Any) -> bool`** requires an object that is not a class and whose type does not belong to `builtins` or `abc`. It does not perform the full `ReflectionInstance` validation: an instance of a `__main__` class can return `True` here and still be rejected by that wrapper.

```python
from orionis.introspection import Reflection

class Action:
    def run(self) -> None:
        pass

action = Action()
assert Reflection.isFunction(Action.run)
assert Reflection.isMethod(action.run)
assert Reflection.isBuiltIn(len)
assert not Reflection.isBuiltIn(int)
assert Reflection.isRoutine(len)
assert not Reflection.isRoutine(Action)
assert Reflection.isClass(Action) and Reflection.isClass(int)
assert not Reflection.isClass(action)
assert Reflection.isInstance(action)
assert not Reflection.isInstance(42)
```

## Abstract classes, generics and typing

<a id="reflection-method-isabstract"></a>

**`isAbstract(obj: Any) -> bool`** delegates to `inspect.isabstract`; inheriting from `ABC` without outstanding abstract methods does not necessarily make a class abstract.

<a id="reflection-method-isconcreteclass"></a>

**`isConcreteClass(obj: Any) -> bool`** requires a class with `__init__`. It excludes objects recognized as builtin by `isBuiltIn`, abstract classes, generics, `Protocol` subclasses, constructs recognized by `isTypingConstruct`, and classes with `ABC` among their **direct** bases.

This filter implements Orionis's particular rules, not a general guarantee that a class is instantiable or user-defined. `int`, `typing.Any` and `typing.Protocol` itself can return `True`: builtin detection does not classify classes, and `isProtocol` excludes `Protocol` itself.

<a id="reflection-method-isgeneric"></a>

**`isGeneric(obj: Any) -> bool`** returns `True` if `typing.get_origin(obj)` is not `None`, the object has `__origin__`, or it is a `TypeVar`. A custom object with `__origin__` also qualifies; a standard generic declaration is not required.

<a id="reflection-method-isprotocol"></a>

**`isProtocol(obj: Any) -> bool`** requires a class that subclasses `typing.Protocol`, excluding the `Protocol` object itself.

<a id="reflection-method-istypingconstruct"></a>

**`isTypingConstruct(obj: Any) -> bool`** compares `type(obj).__name__` against an internal list: `Any`, `Union`, `Optional`, `List`, `Dict`, `Set`, `Tuple`, `Callable`, `TypeVar`, `Generic`, `Protocol`, `Literal`, `Final`, `TypedDict`, `NewType`, `Deque`, `DefaultDict`, `Counter` and `ChainMap`. It does not exhaustively recognize the `typing` module; `typing.Any` and `typing.Literal[1]` return `False` in the verified runtime, while a `TypeVar` returns `True`.

```python
from abc import ABC, abstractmethod
from typing import Any, Literal, Protocol, TypeVar
from orionis.introspection import Reflection

class Source(ABC):
    @abstractmethod
    def read(self) -> str:
        pass

class EmptyBase(ABC):
    pass

class Readable(Protocol):
    def read(self) -> str: ...

T = TypeVar("T")
assert Reflection.isAbstract(Source)
assert not Reflection.isAbstract(EmptyBase)
assert not Reflection.isConcreteClass(EmptyBase)
assert Reflection.isConcreteClass(int)
assert Reflection.isConcreteClass(Any)
assert Reflection.isGeneric(list[int]) and Reflection.isGeneric(T)
assert not Reflection.isGeneric(int)
assert Reflection.isProtocol(Readable)
assert not Reflection.isProtocol(Protocol)
assert Reflection.isTypingConstruct(T)
assert not Reflection.isTypingConstruct(Any)
assert not Reflection.isTypingConstruct(Literal[1])
```

## Coroutines, awaitables and generators

These checks distinguish **the function** from **its result**. They do not await coroutines or consume generators.

<a id="reflection-method-iscoroutinefunction"></a>

**`isCoroutineFunction(obj: Any) -> bool`** delegates to `inspect.iscoroutinefunction`: checks the coroutine function.

<a id="reflection-method-iscoroutine"></a>

**`isCoroutine(obj: Any) -> bool`** delegates to `inspect.iscoroutine`: checks an already-created coroutine object.

<a id="reflection-method-isawaitable"></a>

**`isAwaitable(obj: Any) -> bool`** delegates to `inspect.isawaitable`; an awaitable need not be a native coroutine.

<a id="reflection-method-isgeneratorfunction"></a>

**`isGeneratorFunction(obj: Any) -> bool`** uses `inspect.isgeneratorfunction` for functions that generate through `yield`.

<a id="reflection-method-isgenerator"></a>

**`isGenerator(obj: Any) -> bool`** uses `inspect.isgenerator` for the created generator object.

<a id="reflection-method-isasyncgenfunction"></a>

**`isAsyncGenFunction(obj: Any) -> bool`** uses `inspect.isasyncgenfunction` for asynchronous generator functions.

<a id="reflection-method-isasyncgen"></a>

**`isAsyncGen(obj: Any) -> bool`** uses `inspect.isasyncgen` for asynchronous generator objects. An `async def` function containing `yield` is not an ordinary coroutine function.

```python
from orionis.introspection import Reflection

async def fetch() -> int:
    return 1

def rows():
    yield 1

async def events():
    yield "ready"

class Immediate:
    def __await__(self):
        if False:
            yield
        return 1

assert Reflection.isCoroutineFunction(fetch)
coroutine = fetch()
try:
    assert Reflection.isCoroutine(coroutine)
    assert Reflection.isAwaitable(coroutine)
    assert not Reflection.isCoroutineFunction(coroutine)
finally:
    coroutine.close()

generator = rows()
try:
    assert Reflection.isGeneratorFunction(rows)
    assert Reflection.isGenerator(generator)
finally:
    generator.close()

async_generator = events()
assert Reflection.isAsyncGenFunction(events)
assert Reflection.isAsyncGen(async_generator)
assert not Reflection.isCoroutineFunction(events)
# The generator has not started and holds no active block resources.
assert Reflection.isAwaitable(Immediate())
assert not Reflection.isCoroutine(Immediate())
```

When creating coroutine objects solely to inspect them, close or execute them correctly. In an application you can analyze the function before invoking it and avoid creating results you will not consume.

## Code, modules, frames and tracebacks

<a id="reflection-method-iscode"></a>

**`isCode(obj: Any) -> bool`** uses `inspect.iscode` for code objects such as `function.__code__`.

<a id="reflection-method-ismodule"></a>

**`isModule(obj: Any) -> bool`** uses `inspect.ismodule`. A module object differs from the string containing its name.

<a id="reflection-method-isframe"></a>

**`isFrame(obj: Any) -> bool`** uses `inspect.isframe` for execution frames.

<a id="reflection-method-istraceback"></a>

**`isTraceback(obj: Any) -> bool`** uses `inspect.istraceback` for an exception's traceback.

```python
import inspect
from orionis.introspection import Reflection

def work() -> None:
    pass

assert Reflection.isCode(work.__code__)
assert not Reflection.isCode(work)
assert Reflection.isModule(inspect)
assert not Reflection.isModule("inspect")
frame = inspect.currentframe()
try:
    assert Reflection.isFrame(frame)
finally:
    del frame

try:
    raise ValueError("invalid example")
except ValueError as error:
    assert Reflection.isTraceback(error.__traceback__)
assert not Reflection.isTraceback(None)
```

## Descriptors

These predicates inspect the descriptor obtained through the class, which may differ from the value produced by accessing the attribute on an instance.

<a id="reflection-method-isdatadescriptor"></a>

**`isDataDescriptor(obj: Any) -> bool`** uses `inspect.isdatadescriptor`; a Python property is an example.

<a id="reflection-method-isgetsetdescriptor"></a>

**`isGetSetDescriptor(obj: Any) -> bool`** uses `inspect.isgetsetdescriptor` for interpreter-recognized get/set descriptors.

<a id="reflection-method-ismemberdescriptor"></a>

**`isMemberDescriptor(obj: Any) -> bool`** uses `inspect.ismemberdescriptor`; a `__slots__` attribute is an example in the Orionis runtime.

<a id="reflection-method-ismethoddescriptor"></a>

**`isMethodDescriptor(obj: Any) -> bool`** uses `inspect.ismethoddescriptor`, such as the `str.upper` descriptor.

```python
import types
from orionis.introspection import Reflection

class Slotted:
    __slots__ = ("name",)

class Product:
    @property
    def price(self) -> int:
        return 5

assert Reflection.isDataDescriptor(Product.price)
assert Reflection.isGetSetDescriptor(types.FunctionType.__dict__["__dict__"])
assert Reflection.isMemberDescriptor(Slotted.__dict__["name"])
assert Reflection.isMethodDescriptor(str.upper)
assert not Reflection.isMethodDescriptor(Product.price)
```

## Use through a service

You do not need to inject `Reflection` to call its static methods. You can inject an application tool that decides what to inspect:

```python
from orionis.http import JSONResponse
from orionis.introspection import Reflection

class HandlerInfo:
    def describe(self, handler) -> dict:
        reflected = Reflection.callable(handler)
        return {
            "name": reflected.getName(),
            "async": Reflection.isCoroutineFunction(handler),
            "parameters": list(reflected.getSignature().parameters),
        }

class StatusController:
    def __init__(self, info: HandlerInfo) -> None:
        self.info = info

    async def __call__(self) -> JSONResponse:
        return JSONResponse(self.info.describe(self.__call__))
```

The container constructs `HandlerInfo` and the controller like any other concrete service requiring no additional configuration. Reflection still receives the handler explicitly. These utilities have no classification cache or request state; result caches belong to the wrappers and dependency analyzer.
