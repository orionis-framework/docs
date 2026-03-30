---
title: 'Instancias'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Instance

La clase `ReflectionInstance` es una utilidad de introspección diseñada para analizar objetos instanciados de Python en tiempo de ejecución. Proporciona una API completa para inspeccionar atributos, métodos, propiedades, metadatos y dependencias de cualquier instancia de una clase concreta definida por el usuario.

A diferencia de `ReflectionConcrete`, que opera sobre la definición de una clase (el tipo), `ReflectionInstance` trabaja directamente con un **objeto ya instanciado**, lo que permite acceder tanto a los atributos de la clase como a los atributos de instancia asignados en el constructor o durante la ejecución.

## Importación

```python
from orionis.services.introspection.instances.reflection import ReflectionInstance
```

## Inicialización

La clase recibe una instancia de un objeto como parámetro. Se valida que sea una instancia válida de una clase definida por el usuario, no un tipo, un built-in ni una clase abstracta.

```python
from orionis.services.introspection.instances.reflection import ReflectionInstance

class UserService:
    """Service for managing users."""

    public_attr: int

    def __init__(self, x: int = 10) -> None:
        self.public_attr = x
        self._protected_attr = "prot"
        self.__private_attr = "priv"

    def greet(self) -> str:
        return f"Hello, user #{self.public_attr}"

service = UserService(42)
reflection = ReflectionInstance(service)
```

### Instancias rechazadas

Los siguientes tipos de objetos no son aceptados y lanzarán excepciones:

```python
# TypeError: una clase, no una instancia
ReflectionInstance(UserService)

# TypeError: instancia de tipo built-in
ReflectionInstance(42)
ReflectionInstance("hello")

# TypeError: None
ReflectionInstance(None)
```

:::note
Las instancias creadas en el módulo `__main__` también son rechazadas con un `ValueError`. Esto aplica a objetos creados directamente en scripts que se ejecutan como punto de entrada.
:::

## Contrato

La clase `ReflectionInstance` implementa el contrato `IReflectionInstance`, que define la interfaz completa para la introspección de instancias:

```python
from orionis.services.introspection.instances.contracts.reflection import IReflectionInstance
```

## Identidad

### getInstance

Retorna la instancia original del objeto que se está reflejando.

```python
instance = reflection.getInstance()
# Retorna el mismo objeto UserService pasado al constructor
```

### getClass

Retorna la clase del objeto instanciado.

```python
cls = reflection.getClass()
# <class 'UserService'>
```

### getClassName

Retorna el nombre de la clase como cadena de texto.

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

Retorna el docstring de la clase de la instancia, o `None` si no tiene.

```python
doc = reflection.getDocstring()
# "Service for managing users."
```

### getBaseClasses

Retorna una tupla con las clases base directas de la clase de la instancia.

```python
bases = reflection.getBaseClasses()
# (<class 'object'>,)
```

### getSourceCode

Retorna el código fuente de la clase completa o de un método específico. Retorna `None` si no está disponible.

```python
# Código fuente de toda la clase
source = reflection.getSourceCode()

# Código fuente de un método específico
method_source = reflection.getSourceCode("greet")
```

### getFile

Retorna la ruta del archivo donde está definida la clase, o `None` si no es determinable.

```python
path = reflection.getFile()
# "/app/services/user_service.py"
```

### getAnnotations

Retorna un diccionario con las anotaciones de tipo de la clase. Resuelve automáticamente el name mangling en atributos privados.

```python
annotations = reflection.getAnnotations()
# {"public_attr": <class 'int'>}
```

## Atributos

`ReflectionInstance` clasifica los atributos de la instancia por nivel de visibilidad. A diferencia de `ReflectionConcrete`, aquí se inspeccionan los atributos asignados en la **instancia** (via `vars(instance)`), no los del diccionario de la clase.

### getAttributes

Retorna todos los atributos de la instancia, combinando públicos, protegidos, privados y dunder.

```python
attrs = reflection.getAttributes()
# {"public_attr": 42, "_protected_attr": "prot", "__private_attr": "priv", ...}
```

### getPublicAttributes

Retorna los atributos públicos de la instancia (sin prefijo de guión bajo).

```python
public = reflection.getPublicAttributes()
# {"public_attr": 42}
```

### getProtectedAttributes

Retorna los atributos protegidos de la instancia (prefijo `_`).

```python
protected = reflection.getProtectedAttributes()
# {"_protected_attr": "prot"}
```

### getPrivateAttributes

Retorna los atributos privados de la instancia (prefijo `__`). Los nombres se devuelven sin name mangling.

```python
private = reflection.getPrivateAttributes()
# {"__private_attr": "priv"}
```

### getDunderAttributes / getMagicAttributes

Retorna los atributos dunder de la instancia. `getMagicAttributes` es un alias de `getDunderAttributes`.

```python
dunder = reflection.getDunderAttributes()
magic = reflection.getMagicAttributes()  # Equivalente
```

### hasAttribute

Verifica si un atributo existe en la instancia.

```python
reflection.hasAttribute("public_attr")   # True
reflection.hasAttribute("missing")       # False
```

### getAttribute

Obtiene el valor de un atributo, con soporte para valor por defecto.

```python
value = reflection.getAttribute("public_attr")         # 42
value = reflection.getAttribute("missing", "default")   # "default"
```

### setAttribute

Establece un atributo en la instancia. Solo valores no invocables son aceptados.

```python
reflection.setAttribute("public_attr", 100)  # True
```

Validaciones:
- El nombre debe ser un identificador Python válido
- No puede ser una palabra reservada
- El valor no puede ser un callable (lanza `TypeError`)

### removeAttribute

Elimina un atributo de la instancia. Lanza `AttributeError` si el atributo no existe.

```python
reflection.removeAttribute("public_attr")  # True
```

### getAttributeDocstring

Retorna el docstring de un atributo específico, o `None` si no tiene. Lanza `AttributeError` si el atributo no existe.

```python
doc = reflection.getAttributeDocstring("public_attr")
```

## Métodos

`ReflectionInstance` ofrece la misma API granular que `ReflectionConcrete` para inspeccionar métodos, organizada por **visibilidad** (público, protegido, privado), **tipo** (instancia, clase, estático, dunder) y **naturaleza** (síncrono, asíncrono).

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

Todos los métodos retornan `list[str]` con los nombres encontrados. Los métodos privados se retornan sin name mangling.

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

reflection = ReflectionInstance(MyService())

reflection.getPublicMethods()        # ["process", "fetch"]
reflection.getPublicSyncMethods()    # ["process"]
reflection.getPublicAsyncMethods()   # ["fetch"]
reflection.getProtectedMethods()     # ["_validate"]
reflection.getPublicClassMethods()   # ["create"]
reflection.getPublicStaticMethods()  # ["version"]
```

### hasMethod

Verifica si un método existe en la instancia (busca en todas las categorías).

```python
reflection.hasMethod("process")   # True
reflection.hasMethod("missing")   # False
```

### setMethod

Agrega un nuevo método a la instancia. Lanza `AttributeError` si el nombre es inválido, y `TypeError` si el valor no es callable.

```python
def new_method(self) -> str:
    return "new"

reflection.setMethod("new_method", new_method)  # True
```

### removeMethod

Elimina un método de la clase de la instancia. Lanza `AttributeError` si el método no existe.

```python
reflection.removeMethod("new_method")
```

### getMethodSignature

Retorna el objeto `inspect.Signature` de un método específico. Lanza `AttributeError` si el método no existe o no es callable.

```python
sig = reflection.getMethodSignature("process")
# (self) -> str
```

### getMethodDocstring

Retorna el docstring de un método, o `None` si no tiene. Lanza `AttributeError` si el método no existe.

```python
doc = reflection.getMethodDocstring("process")
# "Return the value of public_attr."
```

## Propiedades

### getProperties

Retorna los nombres de todas las propiedades definidas en la clase de la instancia.

```python
class Config:
    @property
    def host(self) -> str:
        """Server hostname."""
        return "localhost"

    @property
    def _port(self) -> int:
        return 8080

reflection = ReflectionInstance(Config())
reflection.getProperties()  # ["host", "_port"]
```

### Propiedades por visibilidad

| Método | Descripción |
|--------|-------------|
| `getPublicProperties()` | Propiedades públicas |
| `getProtectedProperties()` | Propiedades protegidas (`_`) |
| `getPrivateProperties()` | Propiedades privadas (`__`, sin mangling) |

### getProperty

Obtiene el valor de una propiedad desde la instancia. Lanza `AttributeError` si no existe.

```python
value = reflection.getProperty("host")  # "localhost"
```

### getPropertySignature

Retorna la firma del getter de una propiedad. Lanza `AttributeError` si no existe.

```python
sig = reflection.getPropertySignature("host")
# (self) -> str
```

### getPropertyDocstring

Retorna el docstring del getter de una propiedad, o cadena vacía si no tiene. Lanza `AttributeError` si no existe.

```python
doc = reflection.getPropertyDocstring("host")
# "Server hostname."
```

## Dependencias

### constructorSignature

Analiza las dependencias del constructor de la clase de la instancia, identificando parámetros resueltos (con valor por defecto o tipo primitivo) y no resueltos (que requieren inyección).

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

`ReflectionInstance` implementa un sistema de caché en memoria que almacena los resultados de las operaciones de introspección para evitar recálculos costosos.

### Protocolo de caché

La instancia soporta acceso tipo diccionario:

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