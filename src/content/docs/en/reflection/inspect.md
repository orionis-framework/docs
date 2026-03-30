---
title: 'Inspection'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection

The `Reflection` class is the central entry point of the Orionis introspection system. It acts as a static facade that unifies access to all framework reflection tools, providing two fundamental capabilities:

1. **Factory methods**: create specialized reflection objects for inspecting abstract classes, concrete classes, instances, modules, and callables.
2. **Type checking methods**: determine the nature of any Python object through precise boolean checks.

This centralized design allows both developers and the service container (IoC) to analyze any system component without needing to import each individual reflection class directly.

## Import

```python
from orionis.services.introspection.reflection import Reflection
```

## Factory Methods

Factory methods create instances of specialized reflection classes. Each one validates the type of the received object and raises `TypeError` if it is not compatible.

### instance

Creates a `ReflectionInstance` object for inspecting a class instance.

```python
class UserService:
    def __init__(self, name: str = "default") -> None:
        self.name = name

obj = UserService()
ri = Reflection.instance(obj)

ri.getClassName()       # "UserService"
ri.getPublicAttributes() # {"name": "default"}
```

Rejects built-in type instances and primitives:

```python
# TypeError: built-in instances are not valid
Reflection.instance("hello")
Reflection.instance(42)
Reflection.instance([1, 2, 3])
```

### abstract

Creates a `ReflectionAbstract` object for inspecting an abstract class (ABC).

```python
from abc import ABC, abstractmethod

class Repository(ABC):
    @abstractmethod
    def find(self, id: int) -> dict: ...

ra = Reflection.abstract(Repository)
ra.getClassName()  # "Repository"
```

Rejects concrete classes:

```python
class ConcreteService:
    pass

# TypeError: not an abstract class
Reflection.abstract(ConcreteService)
```

### concrete

Creates a `ReflectionConcrete` object for inspecting a concrete class.

```python
class PaymentService:
    def process(self) -> bool:
        return True

rc = Reflection.concrete(PaymentService)
rc.getClassName()  # "PaymentService"
```

Rejects abstract classes:

```python
# TypeError: not a concrete class
Reflection.concrete(Repository)
```

### module

Creates a `ReflectionModule` object for inspecting a module by its name.

```python
rm = Reflection.module("os")
rm.getClasses()    # classes in the os module
rm.getFunctions()  # functions in the os module
```

Rejects invalid module names:

```python
# TypeError: non-existent module
Reflection.module("nonexistent.module")

# TypeError: empty string
Reflection.module("")
```

### callable

Creates a `ReflectionCallable` object for inspecting a function or method.

```python
def process_data(items: list, mode: str = "fast") -> str:
    return f"{len(items)}-{mode}"

rc = Reflection.callable(process_data)
```

Rejects classes (which, although callable, are not functions):

```python
# TypeError: classes are not functions
Reflection.callable(PaymentService)
```

## Type Checking

The `Reflection` class provides an extensive set of static boolean methods to determine the nature of any Python object. Internally, most delegate to the standard library `inspect` module, while some implement custom logic to cover framework-specific cases.

### Type Checking Methods Table

| Method | Description | Base |
|---|---|---|
| `isAbstract(obj)` | Abstract base class with abstract methods | `inspect.isabstract` |
| `isConcreteClass(obj)` | User-defined concrete class | Custom logic |
| `isClass(obj)` | Any type of class | `inspect.isclass` |
| `isInstance(obj)` | Instance of a user-defined class | Custom logic |
| `isModule(obj)` | Module object | `inspect.ismodule` |
| `isFunction(obj)` | Python function (includes async) | `inspect.isfunction` |
| `isMethod(obj)` | Method bound to an instance | `inspect.ismethod` |
| `isRoutine(obj)` | Function or method (user-defined or built-in) | `inspect.isroutine` |
| `isBuiltIn(obj)` | Built-in function or method | `inspect.isbuiltin` |
| `isCoroutine(obj)` | Running coroutine object | `inspect.iscoroutine` |
| `isCoroutineFunction(obj)` | Function defined with `async def` | `inspect.iscoroutinefunction` |
| `isAwaitable(obj)` | Object that can be awaited | `inspect.isawaitable` |
| `isGenerator(obj)` | Running generator object | `inspect.isgenerator` |
| `isGeneratorFunction(obj)` | Generator function (`yield`) | `inspect.isgeneratorfunction` |
| `isAsyncGen(obj)` | Running asynchronous generator | `inspect.isasyncgen` |
| `isAsyncGenFunction(obj)` | Asynchronous generator function | `inspect.isasyncgenfunction` |
| `isGeneric(obj)` | Generic type (`List[int]`, `TypeVar`) | Custom logic |
| `isProtocol(obj)` | Subclass of `typing.Protocol` | Custom logic |
| `isTypingConstruct(obj)` | Construct from the `typing` module | Custom logic |
| `isCode(obj)` | Python code object | `inspect.iscode` |
| `isDataDescriptor(obj)` | Data descriptor (e.g., `property`) | `inspect.isdatadescriptor` |
| `isFrame(obj)` | Execution frame object | `inspect.isframe` |
| `isTraceback(obj)` | Exception traceback object | `inspect.istraceback` |
| `isGetSetDescriptor(obj)` | Getset descriptor | `inspect.isgetsetdescriptor` |
| `isMemberDescriptor(obj)` | Member descriptor | `inspect.ismemberdescriptor` |
| `isMethodDescriptor(obj)` | Method descriptor | `inspect.ismethoddescriptor` |

### Custom Logic Checks

The following methods implement framework-specific logic that goes beyond what `inspect` provides.

#### isConcreteClass

Determines whether an object is a user-defined concrete class. Excludes: built-in types, abstract classes, generics, protocols, typing constructs, and classes that directly inherit from `ABC`.

```python
class MyService:
    pass

Reflection.isConcreteClass(MyService)    # True
Reflection.isConcreteClass(int)          # True (not a builtin function)
Reflection.isConcreteClass(Repository)   # False (abstract)
Reflection.isConcreteClass(list[int])    # False (generic)
Reflection.isConcreteClass("hello")      # False (not a class)
```

#### isInstance

Determines whether an object is an instance of a user-defined class. Excludes instances from the `builtins` and `abc` modules.

```python
obj = MyService()
Reflection.isInstance(obj)       # True
Reflection.isInstance("hello")   # False (builtin)
Reflection.isInstance(42)        # False (builtin)
Reflection.isInstance(MyService) # False (it is a class, not an instance)
```

#### isGeneric

Detects generic types from the typing system, including generic aliases (`List[int]`), types with `__origin__`, `_GenericAlias`, and `TypeVar`.

```python
from typing import TypeVar

T = TypeVar("T")

Reflection.isGeneric(list[int])  # True
Reflection.isGeneric(dict[str, int])  # True
Reflection.isGeneric(T)         # True
Reflection.isGeneric(MyService) # False
```

#### isProtocol

Checks whether an object is a subclass of `typing.Protocol` (but not `Protocol` itself).

```python
from typing import Protocol

class Greeter(Protocol):
    def greet(self) -> str: ...

Reflection.isProtocol(Greeter)   # True
Reflection.isProtocol(Protocol)  # False (is Protocol itself)
Reflection.isProtocol(MyService) # False
```

#### isTypingConstruct

Identifies constructs from the `typing` module by comparing the object's type name against a known list that includes: `Any`, `Union`, `Optional`, `List`, `Dict`, `Set`, `Tuple`, `Callable`, `TypeVar`, `Generic`, `Protocol`, `Literal`, `Final`, `TypedDict`, `NewType`, `Deque`, `DefaultDict`, `Counter`, and `ChainMap`.

```python
from typing import TypeVar

T = TypeVar("T")

Reflection.isTypingConstruct(T)         # True
Reflection.isTypingConstruct(MyService) # False
Reflection.isTypingConstruct(42)        # False
```

## Integrated Usage Example

```python
from orionis.services.introspection.reflection import Reflection

class Logger:
    def log(self, message: str) -> None:
        print(message)

# Check the type before creating the reflection object
if Reflection.isConcreteClass(Logger):
    rc = Reflection.concrete(Logger)
    print(rc.getClassName())        # "Logger"
    print(rc.getPublicMethods())    # ["log"]

# Inspect an instance
logger = Logger()
if Reflection.isInstance(logger):
    ri = Reflection.instance(logger)
    print(ri.getClass())            # <class 'Logger'>
    print(ri.hasMethod("log"))      # True

# Check the nature of functions
async def fetch_data() -> dict:
    return {}

Reflection.isCoroutineFunction(fetch_data)  # True
Reflection.isFunction(fetch_data)           # True
Reflection.isBuiltIn(fetch_data)            # False
```