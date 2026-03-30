---
title: 'Módulos'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflection Module

La clase `ReflectionModule` es una utilidad avanzada de introspección diseñada para analizar módulos de Python en tiempo de ejecución. Proporciona una API completa para inspeccionar clases, funciones, constantes e importaciones definidas en cualquier módulo importable del ecosistema Orionis.

A diferencia de las demás clases de reflexión que operan sobre clases o instancias, `ReflectionModule` trabaja a nivel de módulo, permitiendo descubrir y manipular los componentes internos de cualquier paquete o archivo Python. Esto la convierte en una herramienta esencial para la carga dinámica de servicios, el descubrimiento automático de clases y la inspección de la estructura interna del framework.

## Importación

```python
from orionis.services.introspection.modules.reflection import ReflectionModule
```

## Inicialización

La clase `ReflectionModule` recibe como parámetro el nombre completo del módulo a inspeccionar (como cadena de texto). El módulo se importa automáticamente durante la inicialización. Si el nombre no es una cadena válida o el módulo no puede importarse, se lanzará un `TypeError`.

```python
from orionis.services.introspection.modules.reflection import ReflectionModule

reflection = ReflectionModule("orionis.services.introspection.modules.reflection")
```

Si intentas pasar un valor no válido:

```python
# TypeError: no es una cadena
ReflectionModule(123)

# TypeError: cadena vacía
ReflectionModule("")

# TypeError: módulo inexistente
ReflectionModule("modulo.que.no.existe")
```

## Contrato

La clase `ReflectionModule` implementa el contrato `IReflectionModule`, que define la interfaz completa para la introspección de módulos:

```python
from orionis.services.introspection.modules.contracts.reflection import IReflectionModule
```

## Acceso al Módulo

### getModule

Retorna el objeto módulo importado durante la inicialización.

```python
mod = reflection.getModule()
# <module 'orionis.services.introspection.modules.reflection' from '...'>
```

## Clases

`ReflectionModule` ofrece un conjunto completo de métodos para descubrir, consultar, registrar y eliminar clases dentro del módulo reflejado. Todas las clases son detectadas como objetos que heredan de `object`.

### getClasses

Retorna un diccionario con todas las clases definidas en el módulo, organizadas por nombre.

```python
classes = reflection.getClasses()
# {"ReflectionModule": <class 'ReflectionModule'>, ...}
```

### getPublicClasses

Retorna únicamente las clases cuyo nombre no comienza con guion bajo (`_`).

```python
public = reflection.getPublicClasses()
# {"ReflectionModule": <class 'ReflectionModule'>}
```

### getProtectedClasses

Retorna las clases cuyo nombre comienza con un solo guion bajo (`_`) pero no con doble guion bajo.

```python
protected = reflection.getProtectedClasses()
# {"_InternalHelper": <class '_InternalHelper'>}
```

### getPrivateClasses

Retorna las clases cuyo nombre comienza con doble guion bajo (`__`) y no termina con doble guion bajo.

```python
private = reflection.getPrivateClasses()
# {"__SecretClass": <class '__SecretClass'>}
```

### hasClass

Verifica si existe una clase con el nombre especificado dentro del módulo.

```python
reflection.hasClass("ReflectionModule")
# True

reflection.hasClass("ClaseInexistente")
# False
```

### getClass

Obtiene una clase por su nombre. Retorna `None` si no existe.

```python
cls = reflection.getClass("ReflectionModule")
# <class 'ReflectionModule'>

cls = reflection.getClass("NoExiste")
# None
```

### setClass

Registra dinámicamente una nueva clase en el módulo. Valida que el nombre sea un identificador válido y que no sea una palabra reservada de Python. El valor debe ser un tipo (`type`).

```python
class CustomService:
    pass

reflection.setClass("CustomService", CustomService)
# True
```

Si los argumentos no son válidos:

```python
# TypeError: no es un tipo
reflection.setClass("nombre", "no es una clase")

# ValueError: identificador inválido
reflection.setClass("123invalid", CustomService)

# ValueError: palabra reservada
reflection.setClass("class", CustomService)
```

### removeClass

Elimina una clase del módulo por su nombre. Lanza `ValueError` si la clase no existe.

```python
reflection.removeClass("CustomService")
# True

# ValueError: clase inexistente
reflection.removeClass("NoExiste")
```

## Constantes

Las constantes se identifican como atributos del módulo cuyo nombre está en mayúsculas (`UPPER_CASE`), no son invocables y no son palabras reservadas de Python.

### getConstants

Retorna un diccionario con todas las constantes definidas en el módulo.

```python
constants = reflection.getConstants()
# {"MAX_RETRIES": 3, "DEFAULT_TIMEOUT": 30}
```

### getPublicConstants

Retorna constantes cuyo nombre no comienza con guion bajo.

```python
public_const = reflection.getPublicConstants()
# {"MAX_RETRIES": 3, "DEFAULT_TIMEOUT": 30}
```

### getProtectedConstants

Retorna constantes cuyo nombre comienza con un solo guion bajo.

```python
protected_const = reflection.getProtectedConstants()
# {"_INTERNAL_LIMIT": 100}
```

### getPrivateConstants

Retorna constantes cuyo nombre comienza con doble guion bajo y no termina con doble guion bajo.

```python
private_const = reflection.getPrivateConstants()
# {"__SECRET_KEY": "abc123"}
```

### getConstant

Obtiene el valor de una constante específica por nombre. Retorna `None` si no existe.

```python
value = reflection.getConstant("MAX_RETRIES")
# 3

value = reflection.getConstant("NO_EXISTE")
# None
```

## Funciones

`ReflectionModule` permite descubrir y clasificar todas las funciones definidas en el módulo, organizándolas por visibilidad (pública, protegida, privada) y naturaleza (síncrona, asíncrona).

Las funciones se detectan como atributos invocables que poseen el atributo `__code__`, lo que excluye clases y otros objetos callable.

### Tabla de Métodos de Funciones

| Método | Descripción |
|---|---|
| `getFunctions()` | Todas las funciones del módulo |
| `getPublicFunctions()` | Funciones públicas (sin prefijo `_`) |
| `getPublicSyncFunctions()` | Funciones públicas síncronas |
| `getPublicAsyncFunctions()` | Funciones públicas asíncronas |
| `getProtectedFunctions()` | Funciones protegidas (prefijo `_`) |
| `getProtectedSyncFunctions()` | Funciones protegidas síncronas |
| `getProtectedAsyncFunctions()` | Funciones protegidas asíncronas |
| `getPrivateFunctions()` | Funciones privadas (prefijo `__`) |
| `getPrivateSyncFunctions()` | Funciones privadas síncronas |
| `getPrivateAsyncFunctions()` | Funciones privadas asíncronas |

Cada método retorna un diccionario `dict[str, callable]` donde las claves son los nombres de las funciones y los valores son los objetos función correspondientes.

### Ejemplo de Uso

```python
# Obtener todas las funciones públicas
public_fns = reflection.getPublicFunctions()
# {"process_request": <function>, "validate_input": <function>}

# Filtrar solo funciones públicas asíncronas
async_fns = reflection.getPublicAsyncFunctions()
# {"process_request": <function>}

# Obtener funciones protegidas síncronas
protected_sync = reflection.getProtectedSyncFunctions()
# {"_internal_helper": <function>}
```

### Criterios de Clasificación

Las funciones se clasifican según las convenciones de nomenclatura de Python:

- **Públicas**: nombre sin prefijo de guion bajo
- **Protegidas**: nombre con prefijo `_` (un guion bajo), sin prefijo `__`
- **Privadas**: nombre con prefijo `__` (doble guion bajo), sin sufijo `__`

La distinción síncrona/asíncrona se determina mediante `inspect.iscoroutinefunction()`.

## Importaciones

### getImports

Retorna un diccionario con los módulos importados detectados a nivel del módulo. Solo identifica atributos cuyo tipo sea `ModuleType`.

```python
imports = reflection.getImports()
# {"os": <module 'os'>, "sys": <module 'sys'>}
```

## Código Fuente y Archivo

### getFile

Retorna la ruta absoluta del archivo donde está definido el módulo.

```python
path = reflection.getFile()
# "/path/to/orionis/services/introspection/modules/reflection.py"
```

### getSourceCode

Retorna el código fuente completo del módulo como cadena de texto. Lanza `ValueError` si el archivo no puede leerse.

```python
source = reflection.getSourceCode()
# "from __future__ import annotations\nimport importlib\n..."
```

## Caché

`ReflectionModule` implementa un sistema de caché interno que almacena los resultados de los métodos de descubrimiento. Esto optimiza el rendimiento en llamadas repetidas. La caché se invalida automáticamente al modificar clases con `setClass()` o `removeClass()`.

### clearCache

Elimina todas las entradas almacenadas en la caché, forzando una recomputación completa en las siguientes llamadas.

```python
reflection.clearCache()
```

La clase también expone el protocolo de caché mediante los métodos mágicos `__getitem__`, `__setitem__`, `__contains__` y `__delitem__`, aunque estos están destinados al uso interno del sistema de reflexión.