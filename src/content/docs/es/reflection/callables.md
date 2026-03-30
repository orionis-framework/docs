---
title: 'Invocables'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Callable

La clase `ReflectionCallable` es una utilidad de introspección diseñada para analizar funciones, métodos y lambdas de Python en tiempo de ejecución. Proporciona una API limpia y consistente para extraer metadatos, código fuente, firmas y dependencias de cualquier callable válido.

A diferencia de `ReflectionAbstract` que opera sobre clases abstractas, `ReflectionCallable` se enfoca exclusivamente en objetos invocables individuales: funciones regulares, métodos de instancia (bound methods), métodos estáticos y expresiones lambda.

## Importación

```python
from orionis.services.introspection.callables.reflection import ReflectionCallable
```

## Inicialización

La clase recibe un callable como parámetro. Se aceptan funciones regulares, métodos bound, métodos estáticos y lambdas. Si el argumento no es un callable válido con atributo `__code__`, se lanzará un `TypeError`.

```python
from orionis.services.introspection.callables.reflection import ReflectionCallable

def my_function(x: int, y: str = "hello") -> bool:
    """Return whether x is positive."""
    return x > 0

reflection = ReflectionCallable(my_function)
```

### Callables aceptados

```python
# Función regular
reflection = ReflectionCallable(my_function)

# Lambda
reflection = ReflectionCallable(lambda a, b: a + b)

# Método bound (de instancia)
class MyClass:
    def process(self, value: int) -> int:
        return value * 2

obj = MyClass()
reflection = ReflectionCallable(obj.process)

# Método estático (accedido desde la clase)
class Utils:
    @staticmethod
    def compute(n: int) -> int:
        return n ** 2

reflection = ReflectionCallable(Utils.compute)
```

### Callables rechazados

Los siguientes tipos no son aceptados y lanzarán `TypeError`:

```python
# Entero (no callable)
ReflectionCallable(42)
# TypeError: Expected a function, method, or lambda, got int

# Clase (sin __code__)
ReflectionCallable(MyClass)
# TypeError: Expected a function, method, or lambda, got type

# Built-in (sin __code__)
ReflectionCallable(len)
# TypeError: Expected a function, method, or lambda, got builtin_function_or_method
```

## Contrato

La clase implementa el contrato `IReflectionCallable`, que define la interfaz completa de introspección para callables:

```python
from orionis.services.introspection.callables.contracts.reflection import IReflectionCallable
```

Los métodos abstractos definidos en el contrato son: `getCallable`, `getName`, `getModuleName`, `getModuleWithCallableName`, `getDocstring`, `getSourceCode`, `getFile`, `getSignature`, `getDependencies` y `clearCache`.

## Identidad

Métodos para obtener información de identificación del callable.

### getCallable

Retorna el objeto callable original pasado al constructor.

```python
fn = reflection.getCallable()
# <function my_function at 0x...>
```

### getName

Retorna el nombre del callable tal como fue definido en su declaración.

```python
name = reflection.getName()
# "my_function"
```

Para lambdas, el nombre será `"<lambda>"`.

### getModuleName

Retorna el nombre del módulo donde está definido el callable.

```python
module = reflection.getModuleName()
# "app.services.processor"
```

### getModuleWithCallableName

Retorna el nombre completamente cualificado, combinando el módulo y el nombre del callable separados por un punto.

```python
fqn = reflection.getModuleWithCallableName()
# "app.services.processor.my_function"
```

## Metadatos

### getDocstring

Retorna el docstring del callable. Si no tiene docstring definido, retorna una cadena vacía.

```python
doc = reflection.getDocstring()
# "Return whether x is positive."

# Función sin docstring
def no_doc():
    pass

rc = ReflectionCallable(no_doc)
rc.getDocstring()
# ""
```

### getSourceCode

Recupera el código fuente completo del callable como cadena de texto. El resultado se almacena en caché automáticamente. Lanza `AttributeError` si el código fuente no está disponible.

```python
source = reflection.getSourceCode()
# "def my_function(x: int, y: str = \"hello\") -> bool:\n    ..."
```

### getFile

Retorna la ruta absoluta del archivo donde está definido el callable. El resultado se almacena en caché. Lanza `TypeError` si la ruta no puede determinarse (por ejemplo, para built-ins).

```python
path = reflection.getFile()
# "/path/to/app/services/processor.py"
```

## Firma y Parámetros

### getSignature

Retorna un objeto `inspect.Signature` que describe los parámetros del callable, incluyendo nombres, valores por defecto y anotaciones de tipo.

```python
import inspect

sig = reflection.getSignature()
# <Signature (x: int, y: str = 'hello') -> bool>

# Acceder a los parámetros individuales
params = sig.parameters
print(params["x"].annotation)
# <class 'int'>

print(params["y"].default)
# "hello"
```

Para métodos bound, el parámetro `self` se excluye automáticamente de la firma.

```python
class MyClass:
    def process(self, value: int) -> int:
        return value * 2

obj = MyClass()
rc = ReflectionCallable(obj.process)
sig = rc.getSignature()
# <Signature (value: int) -> int>
# 'self' no aparece en la firma
```

## Dependencias

### getDependencies

Analiza la firma del callable y retorna un objeto `Signature` que contiene las dependencias resueltas (parámetros con anotación de tipo) y no resueltas (parámetros sin anotación ni valor por defecto).

Este método es fundamental para el sistema de inyección de dependencias del framework, ya que permite determinar qué servicios necesita un callable para ser ejecutado.

```python
from orionis.services.introspection.callables.reflection import ReflectionCallable

def create_user(name: str, db: DatabaseService, logger: Logger = None) -> User:
    ...

rc = ReflectionCallable(create_user)
deps = rc.getDependencies()
# Signature(resolved=[...], unresolved=[...])
```

Para una función sin parámetros, las listas de dependencias estarán vacías:

```python
def simple():
    pass

rc = ReflectionCallable(simple)
deps = rc.getDependencies()
```

## Sistema de Caché

`ReflectionCallable` implementa un sistema de caché interno que almacena automáticamente los resultados de operaciones costosas como `getSourceCode`, `getFile`, `getSignature` y `getDependencies`. Esto evita recalcular valores en llamadas sucesivas.

### Protocolo de Caché

La clase implementa los métodos especiales `__getitem__`, `__setitem__`, `__contains__` y `__delitem__`, permitiendo interactuar con la caché interna como un diccionario:

```python
# Verificar si una clave existe en caché
"source_code" in reflection

# Obtener un valor cacheado
value = reflection["source_code"]

# Almacenar un valor personalizado
reflection["custom_key"] = "custom_value"

# Eliminar una entrada de caché
del reflection["custom_key"]

# Obtener una clave inexistente retorna None
reflection["absent_key"]  # None
```

:::note
Eliminar una clave que no existe no genera ningún error; la operación se ignora silenciosamente.
:::

### clearCache

Limpia toda la caché de reflexión, forzando que las llamadas posteriores recalculen los resultados desde cero.

```python
# Forzar recálculo del código fuente
reflection.getSourceCode()  # se computa y cachea
reflection.clearCache()     # se limpia toda la caché
reflection.getSourceCode()  # se recomputa
```

## Ejemplo Completo

```python
from orionis.services.introspection.callables.reflection import ReflectionCallable

def process_payment(amount: float, currency: str = "USD") -> bool:
    """Process a payment transaction and return success status."""
    return amount > 0

# Crear instancia de reflexión
rc = ReflectionCallable(process_payment)

# Identidad
print(rc.getName())
# "process_payment"

print(rc.getModuleName())
# "__main__"

print(rc.getModuleWithCallableName())
# "__main__.process_payment"

# Metadatos
print(rc.getDocstring())
# "Process a payment transaction and return success status."

print(rc.getFile())
# "/path/to/script.py"

# Firma
sig = rc.getSignature()
print(sig)
# (amount: float, currency: str = 'USD') -> bool

for name, param in sig.parameters.items():
    print(f"  {name}: annotation={param.annotation}, default={param.default}")
# amount: annotation=<class 'float'>, default=<class 'inspect._empty'>
# currency: annotation=<class 'str'>, default=USD

# Dependencias
deps = rc.getDependencies()
print(deps)

# Caché
rc.clearCache()
```

## Referencia de la API

| Método | Retorno | Descripción |
|--------|---------|-------------|
| `getCallable()` | `callable` | Retorna el callable original |
| `getName()` | `str` | Nombre del callable |
| `getModuleName()` | `str` | Módulo donde está definido |
| `getModuleWithCallableName()` | `str` | Nombre completo `modulo.callable` |
| `getDocstring()` | `str` | Docstring o cadena vacía |
| `getSourceCode()` | `str` | Código fuente completo |
| `getFile()` | `str` | Ruta absoluta del archivo |
| `getSignature()` | `inspect.Signature` | Firma con parámetros y tipos |
| `getDependencies()` | `Signature` | Dependencias resueltas y no resueltas |
| `clearCache()` | `None` | Limpia toda la caché interna |