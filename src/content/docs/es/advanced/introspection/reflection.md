---
title: "Reflection: clasificación y selección"
description: "Selecciona wrappers y distingue clases, funciones, coroutines, generadores, descriptores y objetos de Python."
editUrl: true
lastUpdated: false
---

`Reflection` agrupa **31 métodos estáticos**: cinco fábricas de wrappers y 26 predicados. No analiza automáticamente un objeto al llamar `Reflection(obj)`, no resuelve dependencias y no necesita una aplicación iniciada.

```python
from orionis.introspection import Reflection

def handler(value: int) -> int:
    return value * 2

assert Reflection.isFunction(handler)
assert Reflection.callable(handler).getCallable() is handler
```

Todos los argumentos de los métodos siguientes son obligatorios y se usan directamente. Las anotaciones `Any` y `Callable` son tipos de firma; los retornos `IReflection*` son contratos implementados por los wrappers concretos exportados por el paquete.

## Crear el wrapper adecuado

<a id="reflection-method-instance"></a>

**`instance(instance: Any) -> IReflectionInstance`** crea un [ReflectionInstance](/es/advanced/introspection/instances) sobre un objeto existente. No construye la instancia objetivo. El wrapper rechaza clases e instancias de módulos `builtins`, `abc` y `__main__` según sus reglas.

<a id="reflection-method-abstract"></a>

**`abstract(abstract: type) -> IReflectionAbstract`** crea un [ReflectionAbstract](/es/advanced/introspection/abstract-classes) para una clase que `inspect.isabstract()` reconozca como abstracta. No instancia la clase.

<a id="reflection-method-concrete"></a>

**`concrete(concrete: type) -> IReflectionConcrete`** crea un [ReflectionConcrete](/es/advanced/introspection/concrete-classes), cuyo constructor utiliza `isConcreteClass()` para validar la entrada. No crea una instancia del servicio reflejado.

<a id="reflection-method-module"></a>

**`module(module: str) -> IReflectionModule`** crea un [ReflectionModule](/es/advanced/introspection/modules) a partir de un nombre importable, como `"app.services.catalog"`. Importa el módulo; no recibe una ruta de archivo ni un objeto `ModuleType`.

<a id="reflection-method-callable"></a>

**`callable(fn: Callable) -> IReflectionCallable`** crea un [ReflectionCallable](/es/advanced/introspection/callables) sobre una función, método o lambda aceptada por su constructor. No ejecuta la función.

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

Las fábricas no comparten un registro global de wrappers: cada llamada construye uno. Propagan los errores del constructor correspondiente. Consulta esas referencias para la validación de objetivos, los miembros disponibles y la recuperación de fuente.

## Funciones, métodos y objetos

Cada predicado recibe `obj: Any` y devuelve `bool`; no llama al objeto inspeccionado.

<a id="reflection-method-isfunction"></a>

**`isFunction(obj: Any) -> bool`** utiliza `inspect.isfunction`. Reconoce funciones Python, lambdas y funciones `async def`, pero no funciones builtin.

<a id="reflection-method-ismethod"></a>

**`isMethod(obj: Any) -> bool`** utiliza `inspect.ismethod`. Un método ligado a una instancia es diferente de la función obtenida desde su clase.

<a id="reflection-method-isbuiltin"></a>

**`isBuiltIn(obj: Any) -> bool`** utiliza `inspect.isbuiltin`: reconoce funciones o métodos builtin, no todas las clases ni todas las instancias del módulo `builtins`.

<a id="reflection-method-isroutine"></a>

**`isRoutine(obj: Any) -> bool`** utiliza `inspect.isroutine` para funciones y métodos Python o builtin. No significa «cualquier objeto callable».

<a id="reflection-method-isclass"></a>

**`isClass(obj: Any) -> bool`** utiliza `inspect.isclass`; incluye clases builtin como `int`.

<a id="reflection-method-isinstance"></a>

**`isInstance(obj: Any) -> bool`** requiere un objeto que no sea una clase y cuyo tipo no pertenezca a `builtins` o `abc`. No comprueba toda la validación de `ReflectionInstance`: una instancia de una clase de `__main__` puede dar `True` aquí y ser rechazada por ese wrapper.

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

## Abstracción, genéricos y typing

<a id="reflection-method-isabstract"></a>

**`isAbstract(obj: Any) -> bool`** delega en `inspect.isabstract`; heredar de `ABC` sin métodos abstractos pendientes no implica necesariamente que sea abstracta.

<a id="reflection-method-isconcreteclass"></a>

**`isConcreteClass(obj: Any) -> bool`** requiere una clase con `__init__` y descarta objetos reconocidos como builtin por `isBuiltIn`, abstractos, genéricos, subclases de `Protocol`, construcciones reconocidas por `isTypingConstruct` y clases con `ABC` entre sus bases **directas**.

Este filtro es el comportamiento concreto de Orionis, no una prueba general de que una clase sea instanciable o de usuario. `int`, `typing.Any` y el propio `typing.Protocol` pueden devolver `True`: el detector builtin no clasifica clases y `isProtocol` excluye al propio `Protocol`.

<a id="reflection-method-isgeneric"></a>

**`isGeneric(obj: Any) -> bool`** devuelve `True` si `typing.get_origin(obj)` no es `None`, si el objeto tiene `__origin__` o si es un `TypeVar`. Incluye un objeto personalizado con `__origin__`; no exige que sea una declaración genérica estándar.

<a id="reflection-method-isprotocol"></a>

**`isProtocol(obj: Any) -> bool`** requiere una clase que sea subclase de `typing.Protocol`, excluyendo el objeto `Protocol` mismo.

<a id="reflection-method-istypingconstruct"></a>

**`isTypingConstruct(obj: Any) -> bool`** compara `type(obj).__name__` con una lista interna de nombres: `Any`, `Union`, `Optional`, `List`, `Dict`, `Set`, `Tuple`, `Callable`, `TypeVar`, `Generic`, `Protocol`, `Literal`, `Final`, `TypedDict`, `NewType`, `Deque`, `DefaultDict`, `Counter` y `ChainMap`. No reconoce exhaustivamente todos los objetos del módulo `typing`; `typing.Any` o `typing.Literal[1]` dan `False` con el runtime comprobado, mientras un `TypeVar` da `True`.

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

## Coroutines, awaitables y generadores

Estas comprobaciones distinguen **la función** de **su resultado**. No esperan coroutines ni consumen generadores.

<a id="reflection-method-iscoroutinefunction"></a>

**`isCoroutineFunction(obj: Any) -> bool`** delega en `inspect.iscoroutinefunction`: comprueba la función coroutine.

<a id="reflection-method-iscoroutine"></a>

**`isCoroutine(obj: Any) -> bool`** delega en `inspect.iscoroutine`: comprueba un objeto coroutine ya creado.

<a id="reflection-method-isawaitable"></a>

**`isAwaitable(obj: Any) -> bool`** delega en `inspect.isawaitable`; un objeto esperable no tiene que ser una coroutine nativa.

<a id="reflection-method-isgeneratorfunction"></a>

**`isGeneratorFunction(obj: Any) -> bool`** utiliza `inspect.isgeneratorfunction` para funciones que generan mediante `yield`.

<a id="reflection-method-isgenerator"></a>

**`isGenerator(obj: Any) -> bool`** utiliza `inspect.isgenerator` para el objeto generador creado.

<a id="reflection-method-isasyncgenfunction"></a>

**`isAsyncGenFunction(obj: Any) -> bool`** utiliza `inspect.isasyncgenfunction` para funciones generadoras asíncronas.

<a id="reflection-method-isasyncgen"></a>

**`isAsyncGen(obj: Any) -> bool`** utiliza `inspect.isasyncgen` para sus objetos generadores asíncronos. Una función `async def` con `yield` no es una función coroutine ordinaria.

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
# El generador no se ha iniciado y no conserva recursos de un bloque activo.
assert Reflection.isAwaitable(Immediate())
assert not Reflection.isCoroutine(Immediate())
```

Al crear objetos coroutine solo para inspeccionarlos, ciérralos o ejecútalos correctamente. En una aplicación puedes analizar la función antes de invocarla y evitar crear resultados que no vas a consumir.

## Código, módulos, frames y tracebacks

<a id="reflection-method-iscode"></a>

**`isCode(obj: Any) -> bool`** utiliza `inspect.iscode` para objetos de código como `function.__code__`.

<a id="reflection-method-ismodule"></a>

**`isModule(obj: Any) -> bool`** utiliza `inspect.ismodule`. El objeto módulo y la cadena con su nombre son entradas distintas.

<a id="reflection-method-isframe"></a>

**`isFrame(obj: Any) -> bool`** utiliza `inspect.isframe` para frames de ejecución.

<a id="reflection-method-istraceback"></a>

**`isTraceback(obj: Any) -> bool`** utiliza `inspect.istraceback` para el traceback de una excepción.

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

## Descriptores

Los predicados examinan el descriptor obtenido desde la clase, no necesariamente el valor producido al acceder a ese atributo en una instancia.

<a id="reflection-method-isdatadescriptor"></a>

**`isDataDescriptor(obj: Any) -> bool`** utiliza `inspect.isdatadescriptor`; una propiedad Python es un ejemplo.

<a id="reflection-method-isgetsetdescriptor"></a>

**`isGetSetDescriptor(obj: Any) -> bool`** utiliza `inspect.isgetsetdescriptor` para descriptores get/set reconocidos por el intérprete.

<a id="reflection-method-ismemberdescriptor"></a>

**`isMemberDescriptor(obj: Any) -> bool`** utiliza `inspect.ismemberdescriptor`; un atributo definido en `__slots__` es un ejemplo en el runtime de Orionis.

<a id="reflection-method-ismethoddescriptor"></a>

**`isMethodDescriptor(obj: Any) -> bool`** utiliza `inspect.ismethoddescriptor`, como el descriptor `str.upper`.

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

## Uso mediante un servicio

No necesitas inyectar `Reflection` para llamar a métodos estáticos. Puedes inyectar una herramienta propia y conservar dentro de ella la decisión de qué analizar:

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

El contenedor construye `HandlerInfo` y el controlador, como cualquier servicio concreto sin configuración adicional. La reflexión continúa recibiendo explícitamente el handler. Estas utilidades no tienen caché de clasificación ni estado por solicitud; las cachés de resultados pertenecen a los wrappers y al analizador de dependencias.
