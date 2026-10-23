---
title: "ReflectionCallable"
description: "Inspecciona funciones y métodos: identidad, fuente, firmas, dependencias y caché del wrapper."
editUrl: true
lastUpdated: false
---

`ReflectionCallable` envuelve una función sin ejecutarla. Úsalo para construir un catálogo de handlers, consultar sus argumentos o generar información de diagnóstico. Tiene diez métodos públicos y cinco métodos especiales propios, incluido el constructor.

## Construcción e importación

<a id="reflectioncallable-method-init"></a>

**`__init__(self, fn: callable) -> None`** recibe un objetivo obligatorio y devuelve `None` al inicializar el wrapper. Importa la clase desde `orionis.introspection`; su módulo de definición es `orionis.introspection.callables.reflection`.

Admite funciones Python, lambdas y métodos ligados. También admite un objeto callable con `__code__`, pero después lee `__name__`, `__module__` y `__doc__`: esos atributos deben existir. No acepta cualquier objeto por el solo hecho de implementar `__call__`. Una clase ordinaria sin `__code__`, una función builtin o un callable sin `__code__` produce `TypeError`; un objeto admitido por ese filtro pero sin sus metadatos puede producir `AttributeError`.

```python
from orionis.introspection import Reflection, ReflectionCallable

def quote(units: int, *, currency: str = "USD") -> str:
    """Build a quote label."""
    return f"{units} {currency}"

reflected = ReflectionCallable(quote)
assert reflected.getCallable() is quote
assert Reflection.callable(quote).getCallable() is quote
assert ReflectionCallable(lambda item: item).getName() == "<lambda>"

class Action:
    def __call__(self, value: int) -> int:
        return value

action = Action()
assert ReflectionCallable(action.__call__).getCallable() == action.__call__
for invalid in (len, Action, action, 42):
    try:
        ReflectionCallable(invalid)
    except TypeError:
        pass
    else:
        raise AssertionError("El objetivo no debía aceptarse")
```

`Reflection.callable(fn)` crea el mismo tipo de wrapper. No existe configuración global ni un proveedor propio del componente.

## Identidad y documentación

Todos estos métodos carecen de argumentos adicionales. El constructor captura el nombre, el módulo y el docstring; esos tres valores son una instantánea de construcción.

<a id="reflectioncallable-method-getcallable"></a>

**`getCallable(self) -> callable`** devuelve exactamente el objetivo original, conservando la identidad y el binding de un método ligado.

<a id="reflectioncallable-method-getname"></a>

**`getName(self) -> str`** devuelve el `__name__` capturado, no `__qualname__`.

<a id="reflectioncallable-method-getmodulename"></a>

**`getModuleName(self) -> str`** devuelve el `__module__` capturado al construir el wrapper.

<a id="reflectioncallable-method-getmodulewithcallablename"></a>

**`getModuleWithCallableName(self) -> str`** concatena `módulo + "." + nombre`. Para métodos no incorpora el nombre de su clase ni reconstruye una ruta importable completa; no lo uses como identificador global único de todos los handlers.

<a id="reflectioncallable-method-getdocstring"></a>

**`getDocstring(self) -> str`** devuelve el `__doc__` original sin normalizar su indentación, o `""` si no tenía docstring.

```python
from orionis.introspection import ReflectionCallable

def label(value: str) -> str:
    """Format a label."""
    return value.upper()

reflected = ReflectionCallable(label)
assert reflected.getCallable() is label
assert reflected.getName() == "label"
assert reflected.getModuleName() == label.__module__
assert reflected.getModuleWithCallableName() == f"{label.__module__}.label"
assert reflected.getDocstring() == "Format a label."

class Catalog:
    def update(self) -> None:
        pass

method = ReflectionCallable(Catalog().update)
assert method.getModuleWithCallableName() == f"{Catalog.__module__}.update"
assert method.getDocstring() == ""
```

## Archivo y código fuente

<a id="reflectioncallable-method-getsourcecode"></a>

**`getSourceCode(self) -> str`** obtiene `inspect.getsource(fn)` y cachea el texto, incluida su indentación. Convierte un `OSError` de recuperación en `AttributeError`, conservando la causa. Otros errores de inspección pueden propagarse.

<a id="reflectioncallable-method-getfile"></a>

**`getFile(self) -> str`** devuelve y cachea `inspect.getfile(fn)`. Es la ruta que Python asocia al código; no realiza una normalización adicional ni garantiza que un archivo sintético exista. Propaga errores de inspección, como `TypeError` cuando no puede determinarse un archivo.

Guarda este ejemplo en un archivo `.py` y ejecútalo. Una consola interactiva o código generado dinámicamente puede tener una firma legible y aun así no disponer de fuente recuperable.

```python
from orionis.introspection import ReflectionCallable

def calculate(value: int) -> int:
    return value * 2

reflected = ReflectionCallable(calculate)
assert "def calculate(" in reflected.getSourceCode()
assert reflected.getFile() == calculate.__code__.co_filename
assert reflected.getSourceCode() == reflected.getSourceCode()
```

## Firma Python y dependencias Orionis

<a id="reflectioncallable-method-getsignature"></a>

**`getSignature(self) -> inspect.Signature`** devuelve y cachea `inspect.signature(fn)`: parámetros, tipos, valores predeterminados y anotación de retorno. No elimina parámetros de una función no ligada manualmente; Python aplica el binding cuando el objetivo es un método ligado. Propaga errores de `inspect.signature()`.

<a id="reflectioncallable-method-getdependencies"></a>

**`getDependencies(self) -> Signature`** delega en `ReflectDependencies(fn).callableSignature()` y cachea el resultado. `Signature` aquí es la entidad de Orionis, no `inspect.Signature`. Clasifica los argumentos resueltos/no resueltos y su orden; no construye servicios, valida payloads ni invoca el objetivo.

```python
import inspect
from orionis.introspection import ReflectionCallable

class TaxService:
    pass

def invoice(tax: TaxService, subtotal: float, *, currency: str = "USD") -> float:
    return subtotal

reflected = ReflectionCallable(invoice)
python_signature = reflected.getSignature()
assert isinstance(python_signature, inspect.Signature)
assert python_signature.parameters["currency"].default == "USD"
assert python_signature.return_annotation is float

dependencies = reflected.getDependencies()
assert dependencies.getResolved()["tax"].type is TaxService
assert dependencies.getResolved()["currency"].default == "USD"
assert "subtotal" in dependencies.getUnresolved()
assert list(dependencies.getAllOrdered()) == ["tax", "subtotal", "currency"]
assert reflected.getSignature() is python_signature
assert reflected.getDependencies() is dependencies
```

Las referencias futuras, valores predeterminados, schemas, parámetros variádicos y errores se detallan en [Dependencias y firmas](/es/utilities/introspection/dependencies-and-discovery). Para ejecutar un servicio con estos argumentos utiliza el [contenedor](/es/application/container/bindings-and-invocation).

## Protocolo de caché y limpieza

El wrapper tiene una caché compartida entre sus cálculos y los valores guardados con corchetes. Los argumentos `key` son claves de esa caché, no nombres de atributos de la función. Los métodos especiales no añaden validación sobre el diccionario subyacente.

<a id="reflectioncallable-method-getitem"></a>

**`__getitem__(self, key: str) -> object | None`** devuelve el valor almacenado o `None` si falta la clave; no lanza `KeyError` por ausencia.

<a id="reflectioncallable-method-setitem"></a>

**`__setitem__(self, key: str, value: object) -> None`** guarda cualquier valor en la caché del wrapper. No modifica la función.

<a id="reflectioncallable-method-contains"></a>

**`__contains__(self, key: str) -> bool`** comprueba si existe una clave, aunque su valor almacenado sea `None`.

<a id="reflectioncallable-method-delitem"></a>

**`__delitem__(self, key: str) -> None`** elimina una entrada si existe; eliminar una clave ausente no produce error.

<a id="reflectioncallable-method-clearcache"></a>

**`clearCache(self) -> None`** elimina todas las entradas, tanto calculadas como agregadas por la aplicación. Las lecturas diferidas se recalculan después; no modifica el objetivo, no renueva nombre/módulo/docstring capturados ni vacía las cachés LRU internas de `ReflectDependencies`.

```python
from orionis.introspection import ReflectionCallable

def run(value: int = 1) -> int:
    """Original documentation."""
    return value

reflected = ReflectionCallable(run)
reflected["app.note"] = None
assert "app.note" in reflected
assert reflected["app.note"] is None
assert reflected["app.missing"] is None
del reflected["app.note"]
del reflected["app.missing"]
assert "app.note" not in reflected

before = reflected.getSignature()
run.__name__ = "renamed"
run.__doc__ = "Changed documentation."
reflected["app.note"] = "reviewed"
reflected.clearCache()
assert "app.note" not in reflected
assert reflected.getSignature() is not before
assert reflected.getName() == "run"
assert reflected.getDocstring() == "Original documentation."
fresh = ReflectionCallable(run)
assert fresh.getName() == "renamed"
assert fresh.getDocstring() == "Changed documentation."
```

Usa claves propias como `app.note`. Las claves `source_code`, `file`, `signature` y `dependencies` pertenecen a los cálculos internos: sobrescribirlas puede sustituir su resultado por un valor incompatible. Los mapas y entidades devueltos por el análisis de dependencias pueden compartir referencias; consulta sus reglas de caché antes de modificarlos.

## Integración e inyección de dependencias

No existe un objetivo implícito que el contenedor deba inspeccionar. Construye `ReflectionCallable(handler)` cuando conozcas el handler o inyecta un servicio propio que lo reciba explícitamente:

```python
from orionis.http import JSONResponse
from orionis.introspection import ReflectionCallable

class HandlerCatalog:
    def describe(self, handler) -> dict:
        reflected = ReflectionCallable(handler)
        return {
            "name": reflected.getName(),
            "parameters": list(reflected.getSignature().parameters),
        }

class DiagnosticsController:
    def __init__(self, catalog: HandlerCatalog) -> None:
        self.catalog = catalog

    async def __call__(self) -> JSONResponse:
        return JSONResponse(self.catalog.describe(self.__call__))
```

El contenedor puede construir `HandlerCatalog` e inyectarlo en el controlador. Si deliberadamente necesitas inyectar un wrapper preparado, registra esa instancia con `app.instance(ReflectionCallable, wrapper)`; eso liga un objetivo concreto y comparte su caché según ese binding. El contrato `IReflectionCallable` requiere un binding explícito si eliges utilizarlo. No hay registro nativo que determine qué función debe envolver.
