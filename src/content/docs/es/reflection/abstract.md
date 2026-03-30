---
title: 'Clases Abstractas'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Abstract

La clase `ReflectionAbstract` es una utilidad avanzada de introspección diseñada para analizar clases base abstractas (ABC) de Python en tiempo de ejecución. Proporciona una API completa para inspeccionar atributos, métodos, propiedades, metadatos y dependencias de cualquier clase abstracta registrada en el framework Orionis.

Esta herramienta es especialmente útil para construir sistemas de inyección de dependencias, generar documentación automática, validar contratos de interfaces y realizar análisis estático en tiempo de ejecución.

## Importación

```python
from orionis.services.introspection.abstract.reflection import ReflectionAbstract
```

## Inicialización

La clase `ReflectionAbstract` recibe como parámetro una clase abstracta válida que herede de `abc.ABC`. Si la clase proporcionada no es abstracta, se lanzará un `TypeError`.

```python
from abc import ABC, abstractmethod
from orionis.services.introspection.abstract.reflection import ReflectionAbstract

class MyContract(ABC):

    @abstractmethod
    def execute(self) -> str:
        """Execute the operation."""
        ...

reflection = ReflectionAbstract(MyContract)
```

Si intentas pasar una clase que no es abstracta:

```python
class RegularClass:
    pass

# Esto lanzará TypeError:
# "The class 'RegularClass' is not an abstract base class."
reflection = ReflectionAbstract(RegularClass)
```

## Contrato

La clase `ReflectionAbstract` implementa el contrato `IReflectionAbstract`, que define la interfaz completa para la introspección de clases abstractas:

```python
from orionis.services.introspection.abstract.contracts.reflection import IReflectionAbstract
```

## Identidad de la Clase

Estos métodos permiten obtener información básica de identificación sobre la clase abstracta reflejada.

### getClass

Retorna el tipo (la clase) asociado a la instancia de reflexión.

```python
cls = reflection.getClass()
# <class 'MyContract'>
```

### getClassName

Retorna el nombre de la clase abstracta como cadena de texto.

```python
name = reflection.getClassName()
# "MyContract"
```

### getModuleName

Retorna el nombre completo del módulo donde está definida la clase.

```python
module = reflection.getModuleName()
# "app.contracts.my_contract"
```

### getModuleWithClassName

Retorna la ruta completa del módulo junto con el nombre de la clase, separados por un punto.

```python
full_name = reflection.getModuleWithClassName()
# "app.contracts.my_contract.MyContract"
```

## Metadatos

Estos métodos extraen información descriptiva sobre la clase abstracta.

### getDocstring

Retorna el docstring de la clase, o `None` si no tiene uno definido.

```python
doc = reflection.getDocstring()
# "Execute the operation." o None
```

### getBaseClasses

Retorna una lista con las clases base directas de la clase abstracta.

```python
bases = reflection.getBaseClasses()
# [<class 'abc.ABC'>]
```

### getSourceCode

Recupera el código fuente completo de la clase como cadena de texto. Lanza `ValueError` si no se puede obtener.

```python
source = reflection.getSourceCode()
```

### getFile

Retorna la ruta absoluta del archivo donde está definida la clase. Lanza `ValueError` si no se puede determinar.

```python
file_path = reflection.getFile()
# "/path/to/app/contracts/my_contract.py"
```

### getAnnotations

Retorna un diccionario con las anotaciones de tipo de los atributos de la clase. Los nombres de atributos privados se normalizan eliminando el prefijo de name mangling.

```python
from abc import ABC, abstractmethod

class Configurable(ABC):
    name: str
    __timeout: int

    @abstractmethod
    def configure(self) -> None:
        ...

reflection = ReflectionAbstract(Configurable)
annotations = reflection.getAnnotations()
# {"name": <class 'str'>, "__timeout": <class 'int'>}
```

## Atributos

La clase proporciona un conjunto completo de métodos para inspeccionar y manipular atributos a nivel de clase, organizados por nivel de visibilidad.

### hasAttribute

Verifica si la clase tiene un atributo específico.

```python
exists = reflection.hasAttribute("my_attr")
# True o False
```

### getAttribute

Obtiene el valor de un atributo de clase. Retorna `None` si el atributo no existe.

```python
value = reflection.getAttribute("my_attr")
```

### setAttribute

Establece el valor de un atributo en la clase. El nombre debe ser un identificador Python válido y no puede ser una palabra reservada. El valor no puede ser callable.

```python
reflection.setAttribute("max_retries", 3)
# True
```

:::caution
Este método modifica directamente la clase abstracta reflejada. Los atributos con nombre privado (que inician con `__`) son automáticamente procesados con name mangling.
:::

### removeAttribute

Elimina un atributo de la clase. Lanza `ValueError` si el atributo no existe.

```python
reflection.removeAttribute("max_retries")
# True
```

### getAttributes

Retorna un diccionario con todos los atributos a nivel de clase, combinando atributos públicos, protegidos, privados y dunder. Excluye callables, métodos estáticos/de clase y propiedades.

```python
all_attrs = reflection.getAttributes()
# {"public_attr": 1, "_protected": 2, "__private": 3, "__custom__": 4}
```

### getPublicAttributes

Retorna solo los atributos públicos (sin prefijo de guion bajo).

```python
public = reflection.getPublicAttributes()
# {"public_attr": 1}
```

### getProtectedAttributes

Retorna los atributos protegidos (un guion bajo inicial, sin ser dunder ni privado).

```python
protected = reflection.getProtectedAttributes()
# {"_protected": 2}
```

### getPrivateAttributes

Retorna los atributos privados (con name mangling). Los nombres se normalizan eliminando el prefijo `_ClassName`.

```python
private = reflection.getPrivateAttributes()
# {"__private": 3}
```

### getDunderAttributes

Retorna los atributos dunder personalizados (doble guion bajo al inicio y al final). Excluye automáticamente los atributos dunder incorporados de Python como `__class__`, `__dict__`, `__module__`, etc.

```python
dunder = reflection.getDunderAttributes()
# {"__custom__": 4}
```

### getMagicAttributes

Alias de `getDunderAttributes()`. Retorna los mismos atributos mágicos.

```python
magic = reflection.getMagicAttributes()
```

## Métodos

La API de introspección de métodos es una de las características más completas de `ReflectionAbstract`. Permite consultar métodos organizados por visibilidad (público, protegido, privado), tipo (instancia, clase, estático) y naturaleza (síncrono, asíncrono).

### hasMethod

Verifica si la clase contiene un método con el nombre dado.

```python
exists = reflection.hasMethod("execute")
# True o False
```

### removeMethod

Elimina un método de la clase abstracta. Lanza `ValueError` si el método no existe.

```python
reflection.removeMethod("execute")
# True
```

### getMethodSignature

Recupera la firma (`inspect.Signature`) de un método específico. Lanza `ValueError` si el método no existe o no es callable.

```python
import inspect

sig = reflection.getMethodSignature("execute")
# <Signature (self) -> str>
```

### getMethods

Retorna una lista con los nombres de todos los métodos definidos en la clase, incluyendo públicos, protegidos, privados, de clase y estáticos.

```python
all_methods = reflection.getMethods()
# ["execute", "validate", "_prepare", "__internal", "from_config", ...]
```

### Métodos de Instancia

#### getPublicMethods

Retorna los nombres de todos los métodos de instancia públicos. Excluye dunder, protegidos, privados, estáticos, de clase y propiedades.

```python
public = reflection.getPublicMethods()
# ["execute", "validate"]
```

#### getPublicSyncMethods

Retorna solo los métodos públicos síncronos (no son coroutines).

```python
sync = reflection.getPublicSyncMethods()
```

#### getPublicAsyncMethods

Retorna solo los métodos públicos asíncronos (funciones coroutine).

```python
async_methods = reflection.getPublicAsyncMethods()
```

#### getProtectedMethods

Retorna los métodos de instancia protegidos (un guion bajo inicial).

```python
protected = reflection.getProtectedMethods()
# ["_prepare", "_validate_input"]
```

#### getProtectedSyncMethods

Retorna los métodos protegidos síncronos.

```python
sync = reflection.getProtectedSyncMethods()
```

#### getProtectedAsyncMethods

Retorna los métodos protegidos asíncronos.

```python
async_methods = reflection.getProtectedAsyncMethods()
```

#### getPrivateMethods

Retorna los métodos de instancia privados (con name mangling). Los nombres se normalizan eliminando el prefijo `_ClassName`.

```python
private = reflection.getPrivateMethods()
# ["__internal_process"]
```

#### getPrivateSyncMethods

Retorna los métodos privados síncronos.

```python
sync = reflection.getPrivateSyncMethods()
```

#### getPrivateAsyncMethods

Retorna los métodos privados asíncronos.

```python
async_methods = reflection.getPrivateAsyncMethods()
```

### Métodos de Clase

#### getPublicClassMethods

Retorna los métodos de clase públicos (decorados con `@classmethod`).

```python
class_methods = reflection.getPublicClassMethods()
# ["from_config"]
```

#### getPublicClassSyncMethods

Retorna los métodos de clase públicos síncronos.

```python
sync = reflection.getPublicClassSyncMethods()
```

#### getPublicClassAsyncMethods

Retorna los métodos de clase públicos asíncronos.

```python
async_methods = reflection.getPublicClassAsyncMethods()
```

#### getProtectedClassMethods

Retorna los métodos de clase protegidos.

```python
protected = reflection.getProtectedClassMethods()
```

#### getProtectedClassSyncMethods

Retorna los métodos de clase protegidos síncronos.

```python
sync = reflection.getProtectedClassSyncMethods()
```

#### getProtectedClassAsyncMethods

Retorna los métodos de clase protegidos asíncronos.

```python
async_methods = reflection.getProtectedClassAsyncMethods()
```

#### getPrivateClassMethods

Retorna los métodos de clase privados. Los nombres se normalizan eliminando el prefijo de name mangling.

```python
private = reflection.getPrivateClassMethods()
```

#### getPrivateClassSyncMethods

Retorna los métodos de clase privados síncronos.

```python
sync = reflection.getPrivateClassSyncMethods()
```

#### getPrivateClassAsyncMethods

Retorna los métodos de clase privados asíncronos.

```python
async_methods = reflection.getPrivateClassAsyncMethods()
```

### Métodos Estáticos

#### getPublicStaticMethods

Retorna los métodos estáticos públicos (decorados con `@staticmethod`).

```python
static_methods = reflection.getPublicStaticMethods()
# ["utility_method"]
```

#### getPublicStaticSyncMethods

Retorna los métodos estáticos públicos síncronos.

```python
sync = reflection.getPublicStaticSyncMethods()
```

#### getPublicStaticAsyncMethods

Retorna los métodos estáticos públicos asíncronos.

```python
async_methods = reflection.getPublicStaticAsyncMethods()
```

#### getProtectedStaticMethods

Retorna los métodos estáticos protegidos.

```python
protected = reflection.getProtectedStaticMethods()
```

#### getProtectedStaticSyncMethods

Retorna los métodos estáticos protegidos síncronos.

```python
sync = reflection.getProtectedStaticSyncMethods()
```

#### getProtectedStaticAsyncMethods

Retorna los métodos estáticos protegidos asíncronos.

```python
async_methods = reflection.getProtectedStaticAsyncMethods()
```

#### getPrivateStaticMethods

Retorna los métodos estáticos privados. Los nombres se normalizan eliminando el prefijo de name mangling.

```python
private = reflection.getPrivateStaticMethods()
```

#### getPrivateStaticSyncMethods

Retorna los métodos estáticos privados síncronos.

```python
sync = reflection.getPrivateStaticSyncMethods()
```

#### getPrivateStaticAsyncMethods

Retorna los métodos estáticos privados asíncronos.

```python
async_methods = reflection.getPrivateStaticAsyncMethods()
```

### Métodos Dunder y Mágicos

#### getDunderMethods

Retorna todos los métodos dunder (doble guion bajo al inicio y al final) definidos en la clase. Excluye métodos estáticos, de clase y propiedades.

```python
dunder = reflection.getDunderMethods()
# ["__init__", "__str__", "__repr__"]
```

#### getMagicMethods

Alias de `getDunderMethods()`.

```python
magic = reflection.getMagicMethods()
```

## Propiedades

Métodos para inspeccionar las propiedades (decoradas con `@property`) definidas en la clase abstracta.

### getProperties

Retorna una lista con los nombres de todas las propiedades. Los nombres de propiedades privadas se normalizan eliminando el prefijo de name mangling.

```python
props = reflection.getProperties()
# ["name", "_status", "__secret"]
```

### getPublicProperties

Retorna las propiedades públicas (sin prefijo de guion bajo).

```python
public = reflection.getPublicProperties()
# ["name"]
```

### getProtectedProperties

Retorna las propiedades protegidas (un guion bajo inicial).

```python
protected = reflection.getProtectedProperties()
# ["_status"]
```

### getPrivateProperties

Retorna las propiedades privadas. Los nombres se normalizan eliminando el prefijo `_ClassName`.

```python
private = reflection.getPrivateProperties()
# ["__secret"]
```

### getPropertySignature

Recupera la firma del método getter de una propiedad. Lanza `ValueError` si la propiedad no existe.

```python
sig = reflection.getPropertySignature("name")
# <Signature (self) -> str>
```

### getPropertyDocstring

Recupera el docstring del método getter de una propiedad. Retorna `None` si no tiene docstring.

```python
doc = reflection.getPropertyDocstring("name")
# "The name of the entity." o None
```

## Dependencias

Estos métodos analizan las firmas de constructores y métodos para determinar sus dependencias, lo cual es fundamental para los sistemas de inyección de dependencias del framework.

### constructorSignature

Retorna un objeto `Signature` que contiene las dependencias del constructor, incluyendo dependencias resueltas (con tipo anotado) y no resueltas (parámetros sin anotación ni valor por defecto).

```python
sig = reflection.constructorSignature()
# Signature(resolved=[...], unresolved=[...])
```

### methodSignature

Retorna un objeto `Signature` con las dependencias de un método específico. Lanza `AttributeError` si el método no existe.

```python
sig = reflection.methodSignature("execute")
# Signature(resolved=[...], unresolved=[...])
```

## Sistema de Caché

`ReflectionAbstract` implementa un sistema de caché interno para optimizar el rendimiento. Los resultados de las operaciones de introspección se almacenan automáticamente y se reutilizan en llamadas posteriores.

### Protocolo de Caché

La clase implementa los métodos especiales `__getitem__`, `__setitem__`, `__contains__` y `__delitem__`, lo que permite interactuar con la caché como si fuera un diccionario:

```python
# Verificar si existe una clave en caché
"source_code" in reflection

# Obtener un valor cacheado
value = reflection["source_code"]

# Establecer un valor en caché
reflection["custom_key"] = "custom_value"

# Eliminar una entrada de caché
del reflection["custom_key"]
```

### clearCache

Limpia toda la caché de reflexión, forzando que las llamadas posteriores recalculen los resultados.

```python
reflection.clearCache()
```

:::tip
La caché se invalida automáticamente cuando se modifican atributos o métodos usando `setAttribute`, `removeAttribute` o `removeMethod`. Solo necesitas llamar a `clearCache()` manual si realizas modificaciones directas a la clase fuera de la API de reflexión.
:::

## Ejemplo Completo

```python
from abc import ABC, abstractmethod
from orionis.services.introspection.abstract.reflection import ReflectionAbstract

class PaymentGateway(ABC):
    """Abstract payment gateway interface."""

    gateway_name: str
    _timeout: int = 30
    __retries: int = 3

    @abstractmethod
    def process_payment(self, amount: float, currency: str) -> bool:
        """Process a payment transaction."""
        ...

    @abstractmethod
    async def refund(self, transaction_id: str) -> bool:
        """Refund a transaction."""
        ...

    @classmethod
    def from_config(cls, config: dict) -> 'PaymentGateway':
        ...

    @staticmethod
    def supported_currencies() -> list:
        ...

    @property
    def name(self) -> str:
        """The gateway display name."""
        ...

# Crear instancia de reflexión
reflection = ReflectionAbstract(PaymentGateway)

# Identidad
print(reflection.getClassName())
# "PaymentGateway"

# Metadatos
print(reflection.getDocstring())
# "Abstract payment gateway interface."

print(reflection.getBaseClasses())
# [<class 'abc.ABC'>]

# Atributos por visibilidad
print(reflection.getPublicAttributes())
# {"gateway_name": <class 'str'>} o atributos con valor asignado

print(reflection.getProtectedAttributes())
# {"_timeout": 30}

print(reflection.getPrivateAttributes())
# {"__retries": 3}

# Métodos
print(reflection.getPublicMethods())
# ["process_payment", "refund"]

print(reflection.getPublicSyncMethods())
# ["process_payment"]

print(reflection.getPublicAsyncMethods())
# ["refund"]

print(reflection.getPublicClassMethods())
# ["from_config"]

print(reflection.getPublicStaticMethods())
# ["supported_currencies"]

# Propiedades
print(reflection.getPublicProperties())
# ["name"]

print(reflection.getPropertyDocstring("name"))
# "The gateway display name."

# Dependencias del método
sig = reflection.methodSignature("process_payment")
print(sig)
```

## Referencia de la API

| Método | Retorno | Descripción |
|--------|---------|-------------|
| `getClass()` | `type` | Retorna la clase abstracta reflejada |
| `getClassName()` | `str` | Nombre de la clase |
| `getModuleName()` | `str` | Módulo donde está definida |
| `getModuleWithClassName()` | `str` | Ruta completa `modulo.Clase` |
| `getDocstring()` | `str \| None` | Docstring de la clase |
| `getBaseClasses()` | `list[type]` | Clases base directas |
| `getSourceCode()` | `str` | Código fuente completo |
| `getFile()` | `str` | Ruta absoluta del archivo |
| `getAnnotations()` | `dict` | Anotaciones de tipo |
| `hasAttribute(name)` | `bool` | Verifica existencia de atributo |
| `getAttribute(name)` | `object \| None` | Valor del atributo |
| `setAttribute(name, value)` | `bool` | Establece un atributo |
| `removeAttribute(name)` | `bool` | Elimina un atributo |
| `getAttributes()` | `dict` | Todos los atributos |
| `getPublicAttributes()` | `dict` | Atributos públicos |
| `getProtectedAttributes()` | `dict` | Atributos protegidos |
| `getPrivateAttributes()` | `dict` | Atributos privados |
| `getDunderAttributes()` | `dict` | Atributos dunder |
| `getMagicAttributes()` | `dict` | Alias de getDunderAttributes |
| `hasMethod(name)` | `bool` | Verifica existencia de método |
| `removeMethod(name)` | `bool` | Elimina un método |
| `getMethodSignature(name)` | `Signature` | Firma del método |
| `getMethods()` | `list[str]` | Todos los métodos |
| `getPublicMethods()` | `list[str]` | Métodos públicos |
| `getPublicSyncMethods()` | `list[str]` | Métodos públicos síncronos |
| `getPublicAsyncMethods()` | `list[str]` | Métodos públicos asíncronos |
| `getProtectedMethods()` | `list[str]` | Métodos protegidos |
| `getProtectedSyncMethods()` | `list[str]` | Métodos protegidos síncronos |
| `getProtectedAsyncMethods()` | `list[str]` | Métodos protegidos asíncronos |
| `getPrivateMethods()` | `list[str]` | Métodos privados |
| `getPrivateSyncMethods()` | `list[str]` | Métodos privados síncronos |
| `getPrivateAsyncMethods()` | `list[str]` | Métodos privados asíncronos |
| `getPublicClassMethods()` | `list[str]` | Métodos de clase públicos |
| `getPublicClassSyncMethods()` | `list[str]` | Métodos de clase públicos síncronos |
| `getPublicClassAsyncMethods()` | `list[str]` | Métodos de clase públicos asíncronos |
| `getProtectedClassMethods()` | `list[str]` | Métodos de clase protegidos |
| `getProtectedClassSyncMethods()` | `list[str]` | Métodos de clase protegidos síncronos |
| `getProtectedClassAsyncMethods()` | `list[str]` | Métodos de clase protegidos asíncronos |
| `getPrivateClassMethods()` | `list[str]` | Métodos de clase privados |
| `getPrivateClassSyncMethods()` | `list[str]` | Métodos de clase privados síncronos |
| `getPrivateClassAsyncMethods()` | `list[str]` | Métodos de clase privados asíncronos |
| `getPublicStaticMethods()` | `list[str]` | Métodos estáticos públicos |
| `getPublicStaticSyncMethods()` | `list[str]` | Métodos estáticos públicos síncronos |
| `getPublicStaticAsyncMethods()` | `list[str]` | Métodos estáticos públicos asíncronos |
| `getProtectedStaticMethods()` | `list[str]` | Métodos estáticos protegidos |
| `getProtectedStaticSyncMethods()` | `list[str]` | Métodos estáticos protegidos síncronos |
| `getProtectedStaticAsyncMethods()` | `list[str]` | Métodos estáticos protegidos asíncronos |
| `getPrivateStaticMethods()` | `list[str]` | Métodos estáticos privados |
| `getPrivateStaticSyncMethods()` | `list[str]` | Métodos estáticos privados síncronos |
| `getPrivateStaticAsyncMethods()` | `list[str]` | Métodos estáticos privados asíncronos |
| `getDunderMethods()` | `list[str]` | Métodos dunder |
| `getMagicMethods()` | `list[str]` | Alias de getDunderMethods |
| `getProperties()` | `list[str]` | Todas las propiedades |
| `getPublicProperties()` | `list[str]` | Propiedades públicas |
| `getProtectedProperties()` | `list[str]` | Propiedades protegidas |
| `getPrivateProperties()` | `list[str]` | Propiedades privadas |
| `getPropertySignature(name)` | `Signature` | Firma del getter de propiedad |
| `getPropertyDocstring(name)` | `str \| None` | Docstring del getter |
| `constructorSignature()` | `Signature` | Dependencias del constructor |
| `methodSignature(name)` | `Signature` | Dependencias de un método |
| `clearCache()` | `None` | Limpia toda la caché |