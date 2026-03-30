---
title: 'Inspección'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection

La clase `Reflection` es el punto de entrada central del sistema de introspección de Orionis. Actúa como una fachada estática que unifica el acceso a todas las herramientas de reflexión del framework, proporcionando dos capacidades fundamentales:

1. **Métodos factoría**: crean objetos de reflexión especializados para inspeccionar clases abstractas, concretas, instancias, módulos y callables.
2. **Métodos de verificación de tipo**: permiten determinar la naturaleza de cualquier objeto Python mediante comprobaciones booleanas precisas.

Este diseño centralizado permite al desarrollador y al contenedor de servicios (IoC) analizar cualquier componente del sistema sin necesidad de importar directamente cada clase de reflexión individual.

## Importación

```python
from orionis.services.introspection.reflection import Reflection
```

## Métodos Factoría

Los métodos factoría crean instancias de las clases de reflexión especializadas. Cada uno valida el tipo del objeto recibido y lanza `TypeError` si no es compatible.

### instance

Crea un objeto `ReflectionInstance` para inspeccionar una instancia de clase.

```python
class UserService:
    def __init__(self, name: str = "default") -> None:
        self.name = name

obj = UserService()
ri = Reflection.instance(obj)

ri.getClassName()       # "UserService"
ri.getPublicAttributes() # {"name": "default"}
```

Rechaza instancias de tipos built-in y primitivos:

```python
# TypeError: instancias built-in no son válidas
Reflection.instance("hello")
Reflection.instance(42)
Reflection.instance([1, 2, 3])
```

### abstract

Crea un objeto `ReflectionAbstract` para inspeccionar una clase abstracta (ABC).

```python
from abc import ABC, abstractmethod

class Repository(ABC):
    @abstractmethod
    def find(self, id: int) -> dict: ...

ra = Reflection.abstract(Repository)
ra.getClassName()  # "Repository"
```

Rechaza clases concretas:

```python
class ConcreteService:
    pass

# TypeError: no es una clase abstracta
Reflection.abstract(ConcreteService)
```

### concrete

Crea un objeto `ReflectionConcrete` para inspeccionar una clase concreta.

```python
class PaymentService:
    def process(self) -> bool:
        return True

rc = Reflection.concrete(PaymentService)
rc.getClassName()  # "PaymentService"
```

Rechaza clases abstractas:

```python
# TypeError: no es una clase concreta
Reflection.concrete(Repository)
```

### module

Crea un objeto `ReflectionModule` para inspeccionar un módulo por su nombre.

```python
rm = Reflection.module("os")
rm.getClasses()    # clases del módulo os
rm.getFunctions()  # funciones del módulo os
```

Rechaza nombres de módulo inválidos:

```python
# TypeError: módulo inexistente
Reflection.module("modulo.inexistente")

# TypeError: cadena vacía
Reflection.module("")
```

### callable

Crea un objeto `ReflectionCallable` para inspeccionar una función o método.

```python
def process_data(items: list, mode: str = "fast") -> str:
    return f"{len(items)}-{mode}"

rc = Reflection.callable(process_data)
```

Rechaza clases (que aunque son callable, no son funciones):

```python
# TypeError: las clases no son funciones
Reflection.callable(PaymentService)
```

## Verificación de Tipos

La clase `Reflection` ofrece un conjunto extenso de métodos estáticos booleanos para determinar la naturaleza de cualquier objeto Python. Internamente, la mayoría delegan en el módulo `inspect` de la librería estándar, mientras que algunos implementan lógica personalizada para cubrir casos específicos del framework.

### Tabla de Métodos de Verificación

| Método | Descripción | Base |
|---|---|---|
| `isAbstract(obj)` | Clase base abstracta con métodos abstractos | `inspect.isabstract` |
| `isConcreteClass(obj)` | Clase concreta definida por el usuario | Lógica personalizada |
| `isClass(obj)` | Cualquier tipo de clase | `inspect.isclass` |
| `isInstance(obj)` | Instancia de clase definida por el usuario | Lógica personalizada |
| `isModule(obj)` | Objeto módulo | `inspect.ismodule` |
| `isFunction(obj)` | Función de Python (incluye async) | `inspect.isfunction` |
| `isMethod(obj)` | Método enlazado a una instancia | `inspect.ismethod` |
| `isRoutine(obj)` | Función o método (user-defined o built-in) | `inspect.isroutine` |
| `isBuiltIn(obj)` | Función o método built-in | `inspect.isbuiltin` |
| `isCoroutine(obj)` | Objeto coroutine en ejecución | `inspect.iscoroutine` |
| `isCoroutineFunction(obj)` | Función definida con `async def` | `inspect.iscoroutinefunction` |
| `isAwaitable(obj)` | Objeto que puede ser awaited | `inspect.isawaitable` |
| `isGenerator(obj)` | Objeto generador en ejecución | `inspect.isgenerator` |
| `isGeneratorFunction(obj)` | Función generadora (`yield`) | `inspect.isgeneratorfunction` |
| `isAsyncGen(obj)` | Generador asíncrono en ejecución | `inspect.isasyncgen` |
| `isAsyncGenFunction(obj)` | Función generadora asíncrona | `inspect.isasyncgenfunction` |
| `isGeneric(obj)` | Tipo genérico (`List[int]`, `TypeVar`) | Lógica personalizada |
| `isProtocol(obj)` | Subclase de `typing.Protocol` | Lógica personalizada |
| `isTypingConstruct(obj)` | Constructo del módulo `typing` | Lógica personalizada |
| `isCode(obj)` | Objeto code de Python | `inspect.iscode` |
| `isDataDescriptor(obj)` | Descriptor de datos (ej. `property`) | `inspect.isdatadescriptor` |
| `isFrame(obj)` | Objeto frame de ejecución | `inspect.isframe` |
| `isTraceback(obj)` | Objeto traceback de excepción | `inspect.istraceback` |
| `isGetSetDescriptor(obj)` | Descriptor getset | `inspect.isgetsetdescriptor` |
| `isMemberDescriptor(obj)` | Descriptor de miembro | `inspect.ismemberdescriptor` |
| `isMethodDescriptor(obj)` | Descriptor de método | `inspect.ismethoddescriptor` |

### Verificaciones con Lógica Personalizada

Los siguientes métodos implementan lógica específica del framework que va más allá de lo que ofrece `inspect`.

#### isConcreteClass

Determina si un objeto es una clase concreta definida por el usuario. Excluye: tipos built-in, clases abstractas, genéricos, protocolos, constructos de typing y clases que heredan directamente de `ABC`.

```python
class MyService:
    pass

Reflection.isConcreteClass(MyService)    # True
Reflection.isConcreteClass(int)          # True (no es builtin function)
Reflection.isConcreteClass(Repository)   # False (abstracta)
Reflection.isConcreteClass(list[int])    # False (genérico)
Reflection.isConcreteClass("hello")      # False (no es una clase)
```

#### isInstance

Determina si un objeto es una instancia de una clase definida por el usuario. Excluye instancias de módulos `builtins` y `abc`.

```python
obj = MyService()
Reflection.isInstance(obj)       # True
Reflection.isInstance("hello")   # False (builtin)
Reflection.isInstance(42)        # False (builtin)
Reflection.isInstance(MyService) # False (es una clase, no instancia)
```

#### isGeneric

Detecta tipos genéricos del sistema de typing, incluyendo alias genéricos (`List[int]`), tipos con `__origin__`, `_GenericAlias` y `TypeVar`.

```python
from typing import TypeVar

T = TypeVar("T")

Reflection.isGeneric(list[int])  # True
Reflection.isGeneric(dict[str, int])  # True
Reflection.isGeneric(T)         # True
Reflection.isGeneric(MyService) # False
```

#### isProtocol

Verifica si un objeto es una subclase de `typing.Protocol` (pero no `Protocol` en sí mismo).

```python
from typing import Protocol

class Greeter(Protocol):
    def greet(self) -> str: ...

Reflection.isProtocol(Greeter)   # True
Reflection.isProtocol(Protocol)  # False (es Protocol mismo)
Reflection.isProtocol(MyService) # False
```

#### isTypingConstruct

Identifica constructos del módulo `typing` comparando el nombre del tipo del objeto con una lista conocida que incluye: `Any`, `Union`, `Optional`, `List`, `Dict`, `Set`, `Tuple`, `Callable`, `TypeVar`, `Generic`, `Protocol`, `Literal`, `Final`, `TypedDict`, `NewType`, `Deque`, `DefaultDict`, `Counter` y `ChainMap`.

```python
from typing import TypeVar

T = TypeVar("T")

Reflection.isTypingConstruct(T)         # True
Reflection.isTypingConstruct(MyService) # False
Reflection.isTypingConstruct(42)        # False
```

## Ejemplo de Uso Integrado

```python
from orionis.services.introspection.reflection import Reflection

class Logger:
    def log(self, message: str) -> None:
        print(message)

# Verificar el tipo antes de crear el objeto de reflexión
if Reflection.isConcreteClass(Logger):
    rc = Reflection.concrete(Logger)
    print(rc.getClassName())        # "Logger"
    print(rc.getPublicMethods())    # ["log"]

# Inspeccionar una instancia
logger = Logger()
if Reflection.isInstance(logger):
    ri = Reflection.instance(logger)
    print(ri.getClass())            # <class 'Logger'>
    print(ri.hasMethod("log"))      # True

# Verificar naturaleza de funciones
async def fetch_data() -> dict:
    return {}

Reflection.isCoroutineFunction(fetch_data)  # True
Reflection.isFunction(fetch_data)           # True
Reflection.isBuiltIn(fetch_data)            # False
```