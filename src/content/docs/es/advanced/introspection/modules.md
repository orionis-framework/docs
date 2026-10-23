---
title: "ReflectionModule"
description: "Inspeccionar clases, constantes, funciones e imports de módulos Python."
editUrl: true
lastUpdated: false
---

`ReflectionModule` importa un módulo Python y clasifica los objetos presentes en su espacio de nombres: clases, constantes, funciones y módulos importados. Úsalo para inspeccionar extensiones o construir un catálogo de componentes cargados. A diferencia del análisis de archivos de `ModuleInspector`, su construcción **puede ejecutar el código del módulo** mediante el sistema normal de importación de Python.

## Inicio rápido

```python
from orionis.introspection import ReflectionModule

metadata = ReflectionModule("orionis.metadata.framework")
assert metadata.getConstant("NAME") == "orionis"
```

## Módulo de ejemplo

Guarda este archivo como `app/plugins/catalog.py`. Todos los ejemplos siguientes reutilizan este módulo y el wrapper `reflected`.

```python
import math
from pathlib import Path

PUBLIC_LIMIT = 10
_INTERNAL_LIMIT = 20
__PRIVATE_LIMIT = 30


class CatalogPlugin:
    def run(self) -> str:
        return "catalog"


class _InternalPlugin:
    pass


class __PrivatePlugin:
    pass


def list_items() -> list[str]:
    return ["book"]


async def refresh_items() -> int:
    return 1


def _prepare() -> bool:
    return True


async def _prepare_async() -> bool:
    return True


def __sign() -> str:
    return "signed"


async def __sign_async() -> str:
    return "signed"
```

```python
from orionis.introspection import ReflectionModule

reflected = ReflectionModule("app.plugins.catalog")
```

<a id="reflectionmodule-method-init"></a>

### `__init__`

```python
def __init__(self, module: str) -> None: ...
```

`module` es una cadena obligatoria con el nombre importable, no una ruta de archivo ni un objeto módulo. Una cadena vacía, solo espacios o un valor de otro tipo genera `TypeError`. Cualquier excepción producida durante la importación se envuelve en `TypeError`, conservando la causa original. No recarga un módulo ya presente en `sys.modules`.

```python
reflected = ReflectionModule("app.plugins.catalog")
```

<a id="reflectionmodule-method-getmodule"></a>

### `getModule`

```python
def getModule(self) -> object: ...
```

No recibe argumentos. Devuelve el objeto módulo importado (`object` en la firma), compartido con otros consumidores de ese módulo.

```python
import importlib

assert reflected.getModule() is importlib.import_module("app.plugins.catalog")
```

## Clases y alias de clases

Se considera clase cualquier valor `isinstance(value, type)` presente en el módulo. Incluye clases importadas: no exige que `value.__module__` coincida con el módulo inspeccionado. Las claves son los nombres de sus variables o alias en ese módulo; no necesariamente `Class.__name__`.

<a id="reflectionmodule-method-getclasses"></a>

### `getClasses`

```python
def getClasses(self) -> dict: ...
```

Sin argumentos devuelve `dict` de todas las clases y sus alias, incluidos nombres con `_`.

```python
assert "CatalogPlugin" in reflected.getClasses()
assert "Path" in reflected.getClasses()
```

<a id="reflectionmodule-method-getpublicclasses"></a>

### `getPublicClasses`

```python
def getPublicClasses(self) -> dict: ...
```

Sin argumentos devuelve `dict` con nombres que no comienzan con `_`.

```python
assert "CatalogPlugin" in reflected.getPublicClasses()
assert "_InternalPlugin" not in reflected.getPublicClasses()
```

<a id="reflectionmodule-method-getprotectedclasses"></a>

### `getProtectedClasses`

```python
def getProtectedClasses(self) -> dict: ...
```

Sin argumentos devuelve `dict` con nombres que empiezan con `_`, pero no con `__`.

```python
assert "_InternalPlugin" in reflected.getProtectedClasses()
```

<a id="reflectionmodule-method-getprivateclasses"></a>

### `getPrivateClasses`

```python
def getPrivateClasses(self) -> dict: ...
```

Sin argumentos devuelve `dict` con nombres que empiezan con `__` y no terminan con `__`. Son nombres de módulo, sin mangling de clase.

```python
assert "__PrivatePlugin" in reflected.getPrivateClasses()
```

<a id="reflectionmodule-method-hasclass"></a>

### `hasClass`

```python
def hasClass(self, class_name: str) -> bool: ...
```

`class_name` es obligatorio. Devuelve `bool` indicando si ese nombre está en `getClasses()`.

```python
assert reflected.hasClass("CatalogPlugin")
assert not reflected.hasClass("missing")
```

<a id="reflectionmodule-method-getclass"></a>

### `getClass`

```python
def getClass(self, class_name: str) -> type | None: ...
```

`class_name` es obligatorio. Devuelve el objeto clase o `None` si no existe. No construye una instancia.

```python
plugin_type = reflected.getClass("CatalogPlugin")
assert plugin_type().run() == "catalog"
assert reflected.getClass("missing") is None
```

## Constantes

La clasificación considera constante cualquier nombre que cumpla `str.isupper()` y cuyo valor no sea callable. No verifica `Final` ni impide modificarlo. Los métodos devuelven los valores reales, no copias; una constante puede contener una lista u otro objeto mutable.

<a id="reflectionmodule-method-getconstant"></a>

### `getConstant`

```python
def getConstant(self, constant_name: str) -> object | None: ...
```

`constant_name` es obligatorio. Devuelve el valor (`object`) o `None` si falta; una constante cuyo valor sea `None` produce el mismo resultado.

```python
assert reflected.getConstant("PUBLIC_LIMIT") == 10
assert reflected.getConstant("missing") is None
```

<a id="reflectionmodule-method-getconstants"></a>

### `getConstants`

```python
def getConstants(self) -> dict: ...
```

Sin argumentos devuelve `dict` con todas las constantes reconocidas, incluidas las que empiezan con guiones bajos.

```python
assert reflected.getConstants()["__PRIVATE_LIMIT"] == 30
```

<a id="reflectionmodule-method-getpublicconstants"></a>

### `getPublicConstants`

```python
def getPublicConstants(self) -> dict: ...
```

Sin argumentos devuelve `dict` de constantes sin prefijo `_`.

```python
assert reflected.getPublicConstants()["PUBLIC_LIMIT"] == 10
```

<a id="reflectionmodule-method-getprotectedconstants"></a>

### `getProtectedConstants`

```python
def getProtectedConstants(self) -> dict: ...
```

Sin argumentos devuelve `dict` de constantes con un `_` inicial y sin `__` inicial.

```python
assert reflected.getProtectedConstants()["_INTERNAL_LIMIT"] == 20
```

<a id="reflectionmodule-method-getprivateconstants"></a>

### `getPrivateConstants`

```python
def getPrivateConstants(self) -> dict: ...
```

Sin argumentos devuelve `dict` de constantes con `__` inicial y sin `__` final.

```python
assert reflected.getPrivateConstants()["__PRIVATE_LIMIT"] == 30
```

## Funciones sync y async

Los filtros incluyen solamente instancias de `types.FunctionType`: funciones Python propias o importadas. No incluyen clases, métodos ligados, callables de objeto ni funciones builtin. La separación async usa `inspect.iscoroutinefunction`; no ejecuta las funciones ni inspecciona el valor que devolverían. Un generador asíncrono no es una función de corrutina y queda en el filtro sync.

Todos estos métodos no reciben argumentos y devuelven `dict` de nombre a función. Para ejecutar una función async debes invocarla y esperar su resultado en tu flujo asíncrono.

<a id="reflectionmodule-method-getfunctions"></a>

### `getFunctions`

```python
def getFunctions(self) -> dict: ...
```

Devuelve todas las funciones Python, de cualquier visibilidad.

```python
assert "list_items" in reflected.getFunctions()
assert "__sign" in reflected.getFunctions()
```

<a id="reflectionmodule-method-getpublicfunctions"></a>

`getPublicFunctions(self) -> dict` — Devuelve funciones públicas, sync y async.

```python
assert "list_items" in reflected.getPublicFunctions()
```

<a id="reflectionmodule-method-getpublicsyncfunctions"></a>

`getPublicSyncFunctions(self) -> dict` — Devuelve funciones públicas síncronas.

```python
assert "list_items" in reflected.getPublicSyncFunctions()
```

<a id="reflectionmodule-method-getpublicasyncfunctions"></a>

`getPublicAsyncFunctions(self) -> dict` — Devuelve funciones públicas asíncronas.

```python
assert "refresh_items" in reflected.getPublicAsyncFunctions()
```

<a id="reflectionmodule-method-getprotectedfunctions"></a>

`getProtectedFunctions(self) -> dict` — Devuelve funciones protegidas, sync y async.

```python
assert "_prepare" in reflected.getProtectedFunctions()
```

<a id="reflectionmodule-method-getprotectedsyncfunctions"></a>

`getProtectedSyncFunctions(self) -> dict` — Devuelve funciones protegidas síncronas.

```python
assert "_prepare" in reflected.getProtectedSyncFunctions()
```

<a id="reflectionmodule-method-getprotectedasyncfunctions"></a>

`getProtectedAsyncFunctions(self) -> dict` — Devuelve funciones protegidas asíncronas.

```python
assert "_prepare_async" in reflected.getProtectedAsyncFunctions()
```

<a id="reflectionmodule-method-getprivatefunctions"></a>

`getPrivateFunctions(self) -> dict` — Devuelve funciones privadas, sync y async.

```python
assert "__sign" in reflected.getPrivateFunctions()
```

<a id="reflectionmodule-method-getprivatesyncfunctions"></a>

`getPrivateSyncFunctions(self) -> dict` — Devuelve funciones privadas síncronas.

```python
assert "__sign" in reflected.getPrivateSyncFunctions()
```

<a id="reflectionmodule-method-getprivateasyncfunctions"></a>

`getPrivateAsyncFunctions(self) -> dict` — Devuelve funciones privadas asíncronas.

```python
assert "__sign_async" in reflected.getPrivateAsyncFunctions()
```

```python
async def inspect_and_refresh() -> int:
    functions = reflected.getPublicAsyncFunctions()
    return await functions["refresh_items"]()
```

## Imports y código fuente

<a id="reflectionmodule-method-getimports"></a>

### `getImports`

```python
def getImports(self) -> dict: ...
```

Sin argumentos devuelve `dict` de nombres cuyo valor es un objeto `ModuleType`. `import math` aparece como `math`; `from pathlib import Path` no aparece como import de módulo, aunque `Path` sí aparece en las clases. No analiza sentencias del archivo.

```python
assert "math" in reflected.getImports()
assert "Path" not in reflected.getImports()
```

<a id="reflectionmodule-method-getfile"></a>

### `getFile`

```python
def getFile(self) -> str: ...
```

Sin argumentos devuelve `str` mediante `inspect.getfile` y memoiza la ruta. Propaga `TypeError` para módulos sin archivo inspeccionable, como algunos módulos builtin o creados dinámicamente.

```python
assert reflected.getFile().endswith("catalog.py")
```

<a id="reflectionmodule-method-getsourcecode"></a>

### `getSourceCode`

```python
def getSourceCode(self) -> str: ...
```

Sin argumentos abre `getFile()` como UTF-8, devuelve el contenido completo (`str`) y lo memoiza. Los errores de archivo, decodificación o inspección se envuelven en `ValueError` conservando la causa.

```python
assert "class CatalogPlugin" in reflected.getSourceCode()
```

## Modificar el espacio de nombres

Estas operaciones modifican el objeto módulo en memoria para todos sus consumidores. No editan el archivo Python ni actualizan referencias que otro módulo ya haya importado. Úsalas cuando una extensión realmente necesite registrar o retirar un alias de clase durante su inicialización.

<a id="reflectionmodule-method-setclass"></a>

### `setClass`

```python
def setClass(self, class_name: str, cls: type) -> bool: ...
```

`class_name: str` y `cls: type` son obligatorios. Exige una clase (`TypeError`) y un identificador válido que no sea palabra reservada (`ValueError`). Asigna o reemplaza el alias y devuelve `True`. Solo invalida la entrada `classes`; llama a `clearCache()` antes de volver a consultar filtros de visibilidad ya calculados.

```python
plugin_type = reflected.getClass("CatalogPlugin")
assert reflected.setClass("ExtraPlugin", plugin_type) is True
reflected.clearCache()
assert reflected.getPublicClasses()["ExtraPlugin"] is plugin_type
```

<a id="reflectionmodule-method-removeclass"></a>

### `removeClass`

```python
def removeClass(self, class_name: str) -> bool: ...
```

`class_name` es obligatorio. Elimina un alias de clase existente y devuelve `True`. Lanza `ValueError` si no está en `getClasses()`. Igual que `setClass`, solo invalida `classes`; vacía la caché para refrescar otros filtros.

```python
assert reflected.removeClass("ExtraPlugin") is True
reflected.clearCache()
assert not reflected.hasClass("ExtraPlugin")
```

## Caché del wrapper

Los diccionarios de resultados se memoizan y se devuelven por referencia. No los modifiques como si fueran copias independientes. Cada wrapper tiene su caché; los cambios externos del módulo no la invalidan. El protocolo de diccionario maneja esta caché, no los atributos del módulo. No escribe archivos.

<a id="reflectionmodule-method-clearcache"></a>

### `clearCache`

```python
def clearCache(self) -> None: ...
```

Sin argumentos elimina todos los resultados cacheados y devuelve `None`. No recarga el módulo con `importlib.reload` ni vacía la caché de clases de `ModuleInspector`.

```python
assert reflected.clearCache() is None
assert "CatalogPlugin" in reflected.getClasses()
```

<a id="reflectionmodule-method-setitem"></a>

### `__setitem__`

```python
def __setitem__(self, key: str, value: object) -> None: ...
```

Guarda `value` bajo `key: str` y devuelve `None`.

```python
reflected["custom:catalog"] = "loaded"
```

<a id="reflectionmodule-method-getitem"></a>

### `__getitem__`

```python
def __getitem__(self, key: str) -> object | None: ...
```

Consulta `key: str` y devuelve el valor o `None`; no lanza `KeyError`.

```python
assert reflected["custom:catalog"] == "loaded"
assert reflected["custom:missing"] is None
```

<a id="reflectionmodule-method-contains"></a>

### `__contains__`

```python
def __contains__(self, key: str) -> bool: ...
```

Devuelve si `key: str` está en la caché.

```python
assert "custom:catalog" in reflected
```

<a id="reflectionmodule-method-delitem"></a>

### `__delitem__`

```python
def __delitem__(self, key: str) -> None: ...
```

Elimina `key: str` si existe; devuelve `None` y no falla para una clave ausente.

```python
del reflected["custom:catalog"]
del reflected["custom:missing"]
```

Evita escribir claves internas como `classes` o `functions`: intervienen directamente en las lecturas del wrapper.

## Uso desde componentes con inyección

El módulo objetivo es un dato de tu aplicación. Puedes encapsular la construcción del wrapper en un servicio e inyectar ese servicio mediante Orionis. No hay que registrar una instancia genérica de `ReflectionModule` sin un nombre de módulo, ni la reflexión constituye un registro automático de plugins.

```python
from orionis.http import JSONResponse
from orionis.introspection import ReflectionModule


class PluginCatalog:
    def names(self) -> list[str]:
        module = ReflectionModule("app.plugins.catalog")
        return sorted(module.getPublicClasses())


class PluginController:
    async def __call__(self, catalog: PluginCatalog) -> JSONResponse:
        return JSONResponse({"classes": catalog.names()})
```

El contrato del wrapper es `IReflectionModule`, importable desde `orionis.introspection.modules.contracts.reflection`. Si deseas inyectar ese contrato, registra explícitamente una instancia o fábrica que construya el wrapper para el nombre de módulo elegido.

[Descubrir módulos y cargar clases](/es/advanced/introspection/module-discovery).
