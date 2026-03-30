---
title: 'Clases Concretas'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Concrete

La clase `ReflectionConcrete` es una utilidad avanzada de introspección diseñada para analizar clases concretas de Python en tiempo de ejecución. Proporciona una API completa para inspeccionar atributos, métodos, propiedades, metadatos y dependencias de cualquier clase concreta (no abstracta) registrada en el framework Orionis.

A diferencia de `ReflectionAbstract`, que opera sobre clases base abstractas, `ReflectionConcrete` se enfoca exclusivamente en clases instanciables que tienen una implementación completa. Esto la convierte en la herramienta ideal para el análisis de servicios, controladores, modelos y cualquier componente concreto del framework.

## Importación

```python
from orionis.services.introspection.concretes.reflection import ReflectionConcrete
```

## Inicialización

La clase `ReflectionConcrete` recibe como parámetro una clase concreta válida. Si la clase proporcionada es abstracta, un tipo primitivo, un built-in o no es una clase, se lanzará un `TypeError`.

```python
from orionis.services.introspection.concretes.reflection import ReflectionConcrete

class UserService:
    """Service for managing users."""

    active: bool = True

    def __init__(self, name: str = "default") -> None:
        self.name = name

    def greet(self) -> str:
        return f"Hello, {self.name}"

reflection = ReflectionConcrete(UserService)
```

Si intentas pasar un tipo no válido:

```python
from abc import ABC, abstractmethod

class MyContract(ABC):
    @abstractmethod
    def execute(self) -> str: ...

# TypeError: clase abstracta
ReflectionConcrete(MyContract)

# TypeError: no es una clase
ReflectionConcrete(42)

# TypeError: built-in
ReflectionConcrete(len)
```

## Contrato

La clase `ReflectionConcrete` implementa el contrato `IReflectionConcrete`, que define la interfaz completa para la introspección de clases concretas:

```python
from orionis.services.introspection.concretes.contracts.reflection import IReflectionConcrete
```

## Identidad de la Clase

Estos métodos permiten obtener información básica de identificación sobre la clase reflejada.

### getClass

Retorna el tipo (la clase) asociado a la instancia de reflexión.

```python
cls = reflection.getClass()
# <class 'UserService'>
```

### getClassName

Retorna el nombre simple de la clase como cadena de texto.

```python
name = reflection.getClassName()
# "UserService"
```

### getModuleName

Retorna el nombre del módulo donde está definida la clase.

```python
module = reflection.getModuleName()
# "app.services.user_service"
```

### getModuleWithClassName

Retorna el nombre completamente cualificado (módulo + clase).

```python
fqn = reflection.getModuleWithClassName()
# "app.services.user_service.UserService"
```

## Metadatos

### getDocstring

Retorna el docstring de la clase, o `None` si no tiene.

```python
doc = reflection.getDocstring()
# "Service for managing users."
```

### getBaseClasses

Retorna la lista de clases base directas en el orden de resolución.

```python
bases = reflection.getBaseClasses()
# [<class 'object'>]
```

### getSourceCode

Retorna el código fuente de la clase completa o de un método específico. Retorna `None` si el código no está disponible.

```python
# Código fuente de toda la clase
source = reflection.getSourceCode()

# Código fuente de un método específico
method_source = reflection.getSourceCode("greet")
```

Para métodos privados con name mangling, utiliza el nombre sin prefijo:

```python
source = reflection.getSourceCode("__private_method")
```

### getFile

Retorna la ruta absoluta del archivo donde está definida la clase.

```python
path = reflection.getFile()
# "/app/services/user_service.py"
```

### getAnnotations

Retorna un diccionario con las anotaciones de tipo de la clase. Resuelve automáticamente el name mangling en atributos privados.

```python
annotations = reflection.getAnnotations()
# {"active": <class 'bool'>}
```

## Atributos

`ReflectionConcrete` clasifica los atributos de la clase por nivel de visibilidad, excluyendo métodos, propiedades, `staticmethod` y `classmethod`.

### getAttributes

Retorna todos los atributos de la clase, combinando públicos, protegidos, privados y dunder.

```python
attrs = reflection.getAttributes()
```

### getPublicAttributes

Retorna los atributos públicos (sin prefijo de guión bajo).

```python
public = reflection.getPublicAttributes()
# {"active": True}
```

### getProtectedAttributes

Retorna los atributos protegidos (prefijo `_`).

```python
protected = reflection.getProtectedAttributes()
# {"_internal_flag": False}
```

### getPrivateAttributes

Retorna los atributos privados (prefijo `__`). Los nombres se devuelven sin name mangling.

```python
private = reflection.getPrivateAttributes()
# {"__secret": "value"}  — no "_ClassName__secret"
```

### getDunderAttributes / getMagicAttributes

Retorna los atributos dunder personalizados de la clase, excluyendo los estándar de Python (`__dict__`, `__module__`, `__doc__`, etc.). `getMagicAttributes` es un alias de `getDunderAttributes`.

```python
dunder = reflection.getDunderAttributes()
magic = reflection.getMagicAttributes()  # Equivalente
```

### hasAttribute

Verifica si un atributo existe en la clase.

```python
reflection.hasAttribute("active")     # True
reflection.hasAttribute("missing")    # False
```

### getAttribute

Obtiene el valor de un atributo, con soporte para valor por defecto.

```python
value = reflection.getAttribute("active")           # True
value = reflection.getAttribute("missing", "N/A")   # "N/A"
```

### setAttribute

Establece un atributo en la clase. Solo valores no invocables son aceptados; para agregar métodos, utiliza `setMethod`.

```python
reflection.setAttribute("active", False)  # True
```

Validaciones:
- El nombre debe ser un identificador Python válido
- No puede ser una palabra reservada
- El valor no puede ser un callable (lanza `TypeError`)

### removeAttribute

Elimina un atributo de la clase. Lanza `ValueError` si el atributo no existe.

```python
reflection.removeAttribute("active")  # True
```

## Métodos

`ReflectionConcrete` ofrece una API granular para inspeccionar métodos organizados por tres ejes: **visibilidad** (público, protegido, privado), **tipo** (instancia, clase, estático, dunder) y **naturaleza** (síncrono, asíncrono).

### Resumen de Métodos de Inspección

| Método | Descripción |
|--------|-------------|
| `getMethods()` | Todos los métodos (instancia + clase + estáticos) |
| `getPublicMethods()` | Métodos de instancia públicos |
| `getPublicSyncMethods()` | Públicos síncronos |
| `getPublicAsyncMethods()` | Públicos asíncronos |
| `getProtectedMethods()` | Métodos de instancia protegidos (`_`) |
| `getProtectedSyncMethods()` | Protegidos síncronos |
| `getProtectedAsyncMethods()` | Protegidos asíncronos |
| `getPrivateMethods()` | Métodos de instancia privados (`__`) |
| `getPrivateSyncMethods()` | Privados síncronos |
| `getPrivateAsyncMethods()` | Privados asíncronos |
| `getPublicClassMethods()` | Class methods públicos |
| `getPublicClassSyncMethods()` | Class methods públicos síncronos |
| `getPublicClassAsyncMethods()` | Class methods públicos asíncronos |
| `getProtectedClassMethods()` | Class methods protegidos |
| `getProtectedClassSyncMethods()` | Class methods protegidos síncronos |
| `getProtectedClassAsyncMethods()` | Class methods protegidos asíncronos |
| `getPrivateClassMethods()` | Class methods privados |
| `getPrivateClassSyncMethods()` | Class methods privados síncronos |
| `getPrivateClassAsyncMethods()` | Class methods privados asíncronos |
| `getPublicStaticMethods()` | Static methods públicos |
| `getPublicStaticSyncMethods()` | Static methods públicos síncronos |
| `getPublicStaticAsyncMethods()` | Static methods públicos asíncronos |
| `getProtectedStaticMethods()` | Static methods protegidos |
| `getProtectedStaticSyncMethods()` | Static methods protegidos síncronos |
| `getProtectedStaticAsyncMethods()` | Static methods protegidos asíncronos |
| `getPrivateStaticMethods()` | Static methods privados |
| `getPrivateStaticSyncMethods()` | Static methods privados síncronos |
| `getPrivateStaticAsyncMethods()` | Static methods privados asíncronos |
| `getDunderMethods()` | Métodos dunder (`__init__`, `__repr__`, etc.) |
| `getMagicMethods()` | Alias de `getDunderMethods()` |

Todos los métodos retornan `list[str]` con los nombres de los métodos encontrados. Los métodos privados se retornan sin name mangling.

### Ejemplo de uso

```python
class MyService:

    def process(self) -> str:
        return "done"

    async def fetch(self) -> dict:
        return {}

    def _validate(self) -> bool:
        return True

    @classmethod
    def create(cls) -> "MyService":
        return cls()

    @staticmethod
    def version() -> str:
        return "1.0"

reflection = ReflectionConcrete(MyService)

reflection.getPublicMethods()        # ["process", "fetch"]
reflection.getPublicSyncMethods()    # ["process"]
reflection.getPublicAsyncMethods()   # ["fetch"]
reflection.getProtectedMethods()     # ["_validate"]
reflection.getPublicClassMethods()   # ["create"]
reflection.getPublicStaticMethods()  # ["version"]
```

### hasMethod

Verifica si un método existe en la clase (busca en todas las categorías).

```python
reflection.hasMethod("process")   # True
reflection.hasMethod("missing")   # False
```

### setMethod

Agrega un nuevo método a la clase. Lanza `ValueError` si el nombre ya existe o es inválido, y `TypeError` si el valor no es callable.

```python
def new_method(self) -> str:
    return "new"

reflection.setMethod("new_method", new_method)  # True
```

### removeMethod

Elimina un método de la clase. Lanza `ValueError` si el método no existe.

```python
reflection.removeMethod("new_method")  # True
```

### getMethodSignature

Retorna el objeto `inspect.Signature` de un método específico.

```python
sig = reflection.getMethodSignature("process")
# (self) -> str
```

## Propiedades

### getProperties

Retorna los nombres de todas las propiedades definidas en la clase.

```python
class Config:
    @property
    def host(self) -> str:
        """Server hostname."""
        return "localhost"

    @property
    def _port(self) -> int:
        return 8080

reflection = ReflectionConcrete(Config)
reflection.getProperties()  # ["host", "_port"]
```

### Propiedades por visibilidad

| Método | Descripción |
|--------|-------------|
| `getPublicProperties()` | Propiedades públicas |
| `getProtectedProperties()` | Propiedades protegidas (`_`) |
| `getPrivateProperties()` | Propiedades privadas (`__`, sin mangling) |

### getProperty

Obtiene el valor de una propiedad ejecutando su getter. Lanza `ValueError` si no existe o `TypeError` si no es una propiedad.

```python
value = reflection.getProperty("host")  # "localhost"
```

### getPropertySignature

Retorna la firma del getter de una propiedad.

```python
sig = reflection.getPropertySignature("host")
# (self) -> str
```

### getPropertyDocstring

Retorna el docstring del getter de una propiedad, o `None` si no tiene.

```python
doc = reflection.getPropertyDocstring("host")
# "Server hostname."
```

## Constructor y Dependencias

### getConstructorSignature

Retorna el objeto `inspect.Signature` del método `__init__`.

```python
sig = reflection.getConstructorSignature()
# (self, name: str = 'default') -> None
```

### constructorSignature

Analiza las dependencias del constructor, identificando parámetros resueltos (con valor por defecto o tipo primitivo) y no resueltos (que requieren inyección de dependencias).

```python
analysis = reflection.constructorSignature()
# Signature(resolved=[...], unresolved=[...])
```

### methodSignature

Analiza las dependencias de un método específico. Lanza `AttributeError` si el método no existe.

```python
analysis = reflection.methodSignature("process")
# Signature(resolved=[...], unresolved=[...])
```

## Caché Interno

`ReflectionConcrete` implementa un sistema de caché en memoria que almacena los resultados de las operaciones de introspección. Esto evita recalcular resultados costosos en llamadas repetidas.

### Protocolo de caché

La instancia soporta acceso tipo diccionario para el caché:

```python
# Verificar existencia
"key" in reflection

# Obtener valor (None si no existe)
reflection["key"]

# Establecer valor
reflection["key"] = value

# Eliminar entrada
del reflection["key"]
```

### clearCache

Limpia todas las entradas del caché. Las siguientes llamadas a métodos recalcularán sus resultados.

```python
reflection.clearCache()
```

:::note
El caché se limpia automáticamente cuando se utilizan operaciones de mutación como `setAttribute`, `removeAttribute`, `setMethod` o `removeMethod`, garantizando la consistencia de los datos.
:::