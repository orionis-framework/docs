---
title: "ReflectionConcrete"
description: "Inspección, clasificación, firmas y modificación de clases concretas."
editUrl: true
lastUpdated: false
---

`ReflectionConcrete` inspecciona una clase **sin crear una instancia**. Permite construir catálogos de acciones, verificar convenciones y consultar firmas para herramientas de desarrollo. También puede modificar datos y eliminar métodos de la clase original.

Los ejemplos siguientes forman un recorrido ejecutable: guarda el bloque inicial y los fragmentos posteriores, en orden, en un archivo `.py`. La recuperación de código fuente necesita ese archivo; una clase creada en la consola interactiva puede no tener fuente recuperable.

## Construcción y caso de ejemplo

<a id="reflectionconcrete-method-init"></a>

```text
__init__(self, concrete: type) -> None
```

`concrete` es obligatorio y debe satisfacer `Reflection.isConcreteClass()`. Rechaza instancias, callables que no sean clases, clases abstractas y las otras categorías que excluye ese predicado. No basta con decir «no abstracta»: una clase que hereda directamente de `ABC` también se rechaza. Algunas clases incorporadas, como `int`, pasan la comprobación; su código fuente puede no estar disponible.

```python
from orionis.introspection import ReflectionConcrete

class Parent:
    inherited = "base"

    def inheritedMethod(self) -> str:
        return "base"

class ReportService(Parent):
    """Report endpoint metadata."""

    format: str = "json"
    _label: str = "reports"
    __token: str = "secret"
    __feature__ = "reports"
    declared_only: str

    def __init__(self, limit: int = 10) -> None:
        self.instance_only = limit

    def render(self, item_id: int, mode: str = "brief") -> str:
        return f"{item_id}:{mode}"

    def summary(self) -> str:
        return "summary"

    async def fetch(self) -> str:
        return "data"

    def _check(self) -> bool:
        return True

    async def _fetch(self) -> str:
        return "data"

    def __sign(self) -> str:
        return "signature"

    async def __fetch(self) -> str:
        return "data"

    @staticmethod
    def normalize() -> str:
        return "json"

    @staticmethod
    async def normalizeAsync() -> str:
        return "json"

    @classmethod
    def build(cls) -> str:
        return cls.__name__

    @classmethod
    async def buildAsync(cls) -> str:
        return cls.__name__

    @staticmethod
    def _normalize() -> str:
        return "json"

    @staticmethod
    async def _normalizeAsync() -> str:
        return "json"

    @classmethod
    def _build(cls) -> str:
        return cls.__name__

    @classmethod
    async def _buildAsync(cls) -> str:
        return cls.__name__

    @staticmethod
    def __normalize() -> str:
        return "json"

    @staticmethod
    async def __normalizeAsync() -> str:
        return "json"

    @classmethod
    def __build(cls) -> str:
        return cls.__name__

    @classmethod
    async def __buildAsync(cls) -> str:
        return cls.__name__

    @property
    def title(self) -> str:
        """Report title."""
        return self.format

    @property
    def _title(self) -> str:
        """Report title."""
        return self.format

    @property
    def __title(self) -> str:
        """Report title."""
        return self.format

    def __repr__(self) -> str:
        return "Report"

r = ReflectionConcrete(ReportService)
```

Importa desde `orionis.introspection`; también existe la ruta directa `orionis.introspection.concretes.reflection`. Los métodos de consulta son síncronos, aunque los miembros inspeccionados puedan ser `async`.

## Alcance de la clasificación

El escaneo recorre **solo `Clase.__dict__`**, no la MRO. Los getters de colecciones excluyen miembros heredados; `getBaseClasses()` permite visitar las bases explícitamente. Un campo creado con `self.campo` no es un dato de clase, y una anotación sin valor no aparece entre los atributos.

La separación distingue datos, `property`, `staticmethod`, `classmethod` y otros callables. No comprueba que todo callable sea una función de instancia convencional. Para decidir async utiliza `inspect.iscoroutinefunction()`, no ejecuta el miembro: un generador asíncrono o una función síncrona que devuelve un awaitable no se convierten por eso en corrutinas.

Los nombres públicos no comienzan con `_`; los protegidos usan `_`; los privados se reconocen por el prefijo de mangling de la clase y se presentan como `__nombre`. Los dunder terminan también en `__` y se consultan aparte. La normalización reproduce el prefijo que Python genera al quitar los `_` iniciales del nombre de la clase.

Usa nombres privados tal como están escritos en el código (`"__sign"`), no `"_ReportService__sign"`. La clasificación compara prefijos, no aplica un control de acceso ni impide usar un miembro privado.

## Identidad, documentación y fuente

<a id="reflectionconcrete-method-getclass"></a>

**`getClass`**

```text
getClass(self) -> type
```

Devuelve el objeto de clase original (`type`), sin construirlo.

```python
assert r.getClass() is ReportService
```

<a id="reflectionconcrete-method-getclassname"></a>

**`getClassName`**

```text
getClassName(self) -> str
```

Devuelve el `__name__` capturado al construir el wrapper como `str`, no `__qualname__`. `clearCache()` no vuelve a capturarlo.

```python
assert r.getClassName() == "ReportService"
```

<a id="reflectionconcrete-method-getmodulename"></a>

**`getModuleName`**

```text
getModuleName(self) -> str
```

Devuelve el nombre del módulo declarado por la clase como `str`.

```python
assert r.getModuleName() == ReportService.__module__
```

<a id="reflectionconcrete-method-getmodulewithclassname"></a>

**`getModuleWithClassName`**

```text
getModuleWithClassName(self) -> str
```

Devuelve `modulo.NombreClase` como `str`, con el nombre de clase capturado al construir el wrapper y el módulo leído al calcular este resultado. Lo almacena en caché. No agrega los ámbitos de una clase anidada.

```python
assert r.getModuleWithClassName() == f"{ReportService.__module__}.ReportService"
```

<a id="reflectionconcrete-method-getdocstring"></a>

**`getDocstring`**

```text
getDocstring(self) -> str | None
```

Devuelve `__doc__` o `None`; no aplica limpieza ni hereda la documentación de otra clase.

```python
assert r.getDocstring() == "Report endpoint metadata."
```

<a id="reflectionconcrete-method-getbaseclasses"></a>

**`getBaseClasses`**

```text
getBaseClasses(self) -> list[type]
```

Devuelve una lista de bases directas (`type`); no recorre la MRO completa.

```python
assert Parent in r.getBaseClasses()
```

<a id="reflectionconcrete-method-getsourcecode"></a>

**`getSourceCode`**

```text
getSourceCode(self, method: str | None = None) -> str | None
```

Sin `method` (predeterminado `None`), devuelve el código de la clase. Con un nombre de método propio, devuelve su fuente; admite privados. Devuelve `None` si falta el método, si es dunder (queda fuera de `hasMethod()`) o si `inspect.getsource()` lanza `TypeError`/`OSError`. No ejecuta el método.

```python
assert "class ReportService" in r.getSourceCode()
assert "def render" in r.getSourceCode("render")
assert "def __sign" in r.getSourceCode("__sign")
assert r.getSourceCode("missing") is None
assert r.getSourceCode("__repr__") is None
```

<a id="reflectionconcrete-method-getfile"></a>

**`getFile`**

```text
getFile(self) -> str
```

Devuelve la ruta del archivo de la clase como `str`. Convierte el `TypeError` de `inspect.getfile()` en `ValueError`; no garantiza que el archivo siga existiendo.

```python
assert r.getFile().endswith(".py")
```

<a id="reflectionconcrete-method-getannotations"></a>

**`getAnnotations`**

```text
getAnnotations(self) -> dict
```

Devuelve un `dict` de anotaciones de la clase, incluso campos anotados sin valor. Quita el prefijo de clase de los nombres privados y no analiza las anotaciones de métodos.

```python
assert "declared_only" in r.getAnnotations()
assert "__token" in r.getAnnotations()
```

## Datos de clase

<a id="reflectionconcrete-method-hasattribute"></a>

**`hasAttribute`**

```text
hasAttribute(self, attribute: str) -> bool
```

`attribute` es el nombre obligatorio de un dato declarado en la clase. Devuelve `bool`; no incluye métodos, propiedades, miembros heredados ni valores creados únicamente por el constructor.

```python
assert r.hasAttribute("format")
assert not r.hasAttribute("declared_only")
assert not r.hasAttribute("inherited")
assert not r.hasAttribute("instance_only")
```

<a id="reflectionconcrete-method-getattribute"></a>

**`getAttribute`**

```text
getAttribute(self, name: str, default: Any = None) -> Any
```

`name` es obligatorio; `default` vale `None`. Primero busca en datos propios normalizados y utiliza `getattr(Clase, name, default)` como respaldo: puede devolver miembros heredados, métodos o descriptores aunque `hasAttribute()` sea `False`. Ese respaldo se evalúa incluso si hay un dato en caché, por lo que un descriptor personalizado puede tener efectos o lanzar excepciones.

```python
assert r.getAttribute("format") == "json"
assert r.getAttribute("missing", "fallback") == "fallback"
assert r.getAttribute("inherited") == "base"
assert not r.hasAttribute("inherited")
```

<a id="reflectionconcrete-method-getattributes"></a>

**`getAttributes`**

```text
getAttributes(self) -> dict
```

Devuelve un `dict` con datos públicos, protegidos, privados normalizados y dunder no excluidos, en ese orden de combinación. No contiene campos de instancias ni anotaciones sin valor.

```python
attributes = r.getAttributes()
assert attributes["format"] == "json"
assert attributes["__token"] == "secret"
```

<a id="reflectionconcrete-method-getpublicattributes"></a>

**`getPublicAttributes`**

```text
getPublicAttributes(self) -> dict
```

Devuelve un `dict` de datos cuyos nombres no comienzan con `_`.

```python
assert r.getPublicAttributes()["format"] == "json"
```

<a id="reflectionconcrete-method-getprotectedattributes"></a>

**`getProtectedAttributes`**

```text
getProtectedAttributes(self) -> dict
```

Devuelve un `dict` de datos con `_` inicial que no son privados ni dunder.

```python
assert r.getProtectedAttributes()["_label"] == "reports"
```

<a id="reflectionconcrete-method-getprivateattributes"></a>

**`getPrivateAttributes`**

```text
getPrivateAttributes(self) -> dict
```

Devuelve un `dict` de datos privados. Sus claves conservan `__` pero omiten el prefijo de clase que introduce Python.

```python
assert r.getPrivateAttributes()["__token"] == "secret"
```

<a id="reflectionconcrete-method-getdunderattributes"></a>

**`getDunderAttributes`**

```text
getDunderAttributes(self) -> dict
```

Devuelve un `dict` de datos `__nombre__` personalizados. La implementación excluye metadatos de Python como `__dict__`, `__module__`, `__doc__` y `__annotations__`.

```python
assert r.getDunderAttributes()["__feature__"] == "reports"
assert "__module__" not in r.getDunderAttributes()
```

<a id="reflectionconcrete-method-getmagicattributes"></a>

**`getMagicAttributes`**

```text
getMagicAttributes(self) -> dict
```

Alias de `getDunderAttributes()`; devuelve el mismo diccionario almacenado.

```python
assert r.getMagicAttributes() is r.getDunderAttributes()
```

<a id="reflectionconcrete-method-setattribute"></a>

**`setAttribute`**

```text
setAttribute(self, name: str, value: object) -> bool
```

`name` debe ser un identificador Python válido que no sea palabra reservada (`ValueError` en caso contrario). `value` es obligatorio y no puede ser callable (`TypeError`). Modifica la clase original y devuelve `True`; admite `__privados`. No valida anotaciones ni actualiza `__abstractmethods__`.

```python
assert r.setAttribute("extra_label", "export") is True
assert ReportService.extra_label == "export"
assert r.removeAttribute("extra_label") is True
```

<a id="reflectionconcrete-method-removeattribute"></a>

**`removeAttribute`**

```text
removeAttribute(self, name: str) -> bool
```

`name` identifica un dato propio, usando su nombre original si es privado. Elimina el atributo real y devuelve `True`. Si no está en la clasificación de datos, lanza `ValueError`; las restricciones del metatipo pueden propagarse.

```python
r.setAttribute("__temporary", 20)
assert r.removeAttribute("__temporary") is True
assert not r.hasAttribute("__temporary")
```

## Métodos de instancia

<a id="reflectionconcrete-method-getmethods"></a>

**`getMethods`**

```text
getMethods(self) -> list[str]
```

Devuelve `list[str]`: métodos de instancia, de clase y estáticos, cada categoría ordenada por visibilidad pública, protegida y privada. Excluye propiedades y dunder; no ordena alfabéticamente.

```python
methods = r.getMethods()
assert "render" in methods and "build" in methods and "normalize" in methods
assert "title" not in methods and "__repr__" not in methods
```

<a id="reflectionconcrete-method-getpublicmethods"></a>

**`getPublicMethods`**

```text
getPublicMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia públicos, incluyendo síncronos y asíncronos. No ejecuta los métodos. No recibe argumentos.

```python
assert "summary" in r.getPublicMethods()
```

<a id="reflectionconcrete-method-getpublicsyncmethods"></a>

**`getPublicSyncMethods`**

```text
getPublicSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia públicos que no son funciones de corrutina. No ejecuta los métodos. No recibe argumentos.

```python
assert "summary" in r.getPublicSyncMethods()
assert "fetch" not in r.getPublicSyncMethods()
```

<a id="reflectionconcrete-method-getpublicasyncmethods"></a>

**`getPublicAsyncMethods`**

```text
getPublicAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia públicos que cumplen `inspect.iscoroutinefunction()`. No ejecuta los métodos. No recibe argumentos.

```python
assert "fetch" in r.getPublicAsyncMethods()
assert "summary" not in r.getPublicAsyncMethods()
```

<a id="reflectionconcrete-method-getprotectedmethods"></a>

**`getProtectedMethods`**

```text
getProtectedMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia protegidos, incluyendo síncronos y asíncronos. No ejecuta los métodos. No recibe argumentos.

```python
assert "_check" in r.getProtectedMethods()
```

<a id="reflectionconcrete-method-getprotectedsyncmethods"></a>

**`getProtectedSyncMethods`**

```text
getProtectedSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia protegidos que no son funciones de corrutina. No ejecuta los métodos. No recibe argumentos.

```python
assert "_check" in r.getProtectedSyncMethods()
assert "_fetch" not in r.getProtectedSyncMethods()
```

<a id="reflectionconcrete-method-getprotectedasyncmethods"></a>

**`getProtectedAsyncMethods`**

```text
getProtectedAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia protegidos que cumplen `inspect.iscoroutinefunction()`. No ejecuta los métodos. No recibe argumentos.

```python
assert "_fetch" in r.getProtectedAsyncMethods()
assert "_check" not in r.getProtectedAsyncMethods()
```

<a id="reflectionconcrete-method-getprivatemethods"></a>

**`getPrivateMethods`**

```text
getPrivateMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia privados, incluyendo síncronos y asíncronos. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__sign" in r.getPrivateMethods()
```

<a id="reflectionconcrete-method-getprivatesyncmethods"></a>

**`getPrivateSyncMethods`**

```text
getPrivateSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia privados que no son funciones de corrutina. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__sign" in r.getPrivateSyncMethods()
assert "__fetch" not in r.getPrivateSyncMethods()
```

<a id="reflectionconcrete-method-getprivateasyncmethods"></a>

**`getPrivateAsyncMethods`**

```text
getPrivateAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de instancia privados que cumplen `inspect.iscoroutinefunction()`. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__fetch" in r.getPrivateAsyncMethods()
assert "__sign" not in r.getPrivateAsyncMethods()
```

## Métodos de clase

<a id="reflectionconcrete-method-getpublicclassmethods"></a>

**`getPublicClassMethods`**

```text
getPublicClassMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) públicos, incluyendo síncronos y asíncronos. No ejecuta los métodos. No recibe argumentos.

```python
assert "build" in r.getPublicClassMethods()
```

<a id="reflectionconcrete-method-getpublicclasssyncmethods"></a>

**`getPublicClassSyncMethods`**

```text
getPublicClassSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) públicos que no son funciones de corrutina. No ejecuta los métodos. No recibe argumentos.

```python
assert "build" in r.getPublicClassSyncMethods()
assert "buildAsync" not in r.getPublicClassSyncMethods()
```

<a id="reflectionconcrete-method-getpublicclassasyncmethods"></a>

**`getPublicClassAsyncMethods`**

```text
getPublicClassAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) públicos que cumplen `inspect.iscoroutinefunction()`. No ejecuta los métodos. No recibe argumentos.

```python
assert "buildAsync" in r.getPublicClassAsyncMethods()
assert "build" not in r.getPublicClassAsyncMethods()
```

<a id="reflectionconcrete-method-getprotectedclassmethods"></a>

**`getProtectedClassMethods`**

```text
getProtectedClassMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) protegidos, incluyendo síncronos y asíncronos. No ejecuta los métodos. No recibe argumentos.

```python
assert "_build" in r.getProtectedClassMethods()
```

<a id="reflectionconcrete-method-getprotectedclasssyncmethods"></a>

**`getProtectedClassSyncMethods`**

```text
getProtectedClassSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) protegidos que no son funciones de corrutina. No ejecuta los métodos. No recibe argumentos.

```python
assert "_build" in r.getProtectedClassSyncMethods()
assert "_buildAsync" not in r.getProtectedClassSyncMethods()
```

<a id="reflectionconcrete-method-getprotectedclassasyncmethods"></a>

**`getProtectedClassAsyncMethods`**

```text
getProtectedClassAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) protegidos que cumplen `inspect.iscoroutinefunction()`. No ejecuta los métodos. No recibe argumentos.

```python
assert "_buildAsync" in r.getProtectedClassAsyncMethods()
assert "_build" not in r.getProtectedClassAsyncMethods()
```

<a id="reflectionconcrete-method-getprivateclassmethods"></a>

**`getPrivateClassMethods`**

```text
getPrivateClassMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) privados, incluyendo síncronos y asíncronos. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__build" in r.getPrivateClassMethods()
```

<a id="reflectionconcrete-method-getprivateclasssyncmethods"></a>

**`getPrivateClassSyncMethods`**

```text
getPrivateClassSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) privados que no son funciones de corrutina. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__build" in r.getPrivateClassSyncMethods()
assert "__buildAsync" not in r.getPrivateClassSyncMethods()
```

<a id="reflectionconcrete-method-getprivateclassasyncmethods"></a>

**`getPrivateClassAsyncMethods`**

```text
getPrivateClassAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos de clase (`@classmethod`) privados que cumplen `inspect.iscoroutinefunction()`. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__buildAsync" in r.getPrivateClassAsyncMethods()
assert "__build" not in r.getPrivateClassAsyncMethods()
```

## Métodos estáticos

<a id="reflectionconcrete-method-getpublicstaticmethods"></a>

**`getPublicStaticMethods`**

```text
getPublicStaticMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) públicos, incluyendo síncronos y asíncronos. No ejecuta los métodos. No recibe argumentos.

```python
assert "normalize" in r.getPublicStaticMethods()
```

<a id="reflectionconcrete-method-getpublicstaticsyncmethods"></a>

**`getPublicStaticSyncMethods`**

```text
getPublicStaticSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) públicos que no son funciones de corrutina. No ejecuta los métodos. No recibe argumentos.

```python
assert "normalize" in r.getPublicStaticSyncMethods()
assert "normalizeAsync" not in r.getPublicStaticSyncMethods()
```

<a id="reflectionconcrete-method-getpublicstaticasyncmethods"></a>

**`getPublicStaticAsyncMethods`**

```text
getPublicStaticAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) públicos que cumplen `inspect.iscoroutinefunction()`. No ejecuta los métodos. No recibe argumentos.

```python
assert "normalizeAsync" in r.getPublicStaticAsyncMethods()
assert "normalize" not in r.getPublicStaticAsyncMethods()
```

<a id="reflectionconcrete-method-getprotectedstaticmethods"></a>

**`getProtectedStaticMethods`**

```text
getProtectedStaticMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) protegidos, incluyendo síncronos y asíncronos. No ejecuta los métodos. No recibe argumentos.

```python
assert "_normalize" in r.getProtectedStaticMethods()
```

<a id="reflectionconcrete-method-getprotectedstaticsyncmethods"></a>

**`getProtectedStaticSyncMethods`**

```text
getProtectedStaticSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) protegidos que no son funciones de corrutina. No ejecuta los métodos. No recibe argumentos.

```python
assert "_normalize" in r.getProtectedStaticSyncMethods()
assert "_normalizeAsync" not in r.getProtectedStaticSyncMethods()
```

<a id="reflectionconcrete-method-getprotectedstaticasyncmethods"></a>

**`getProtectedStaticAsyncMethods`**

```text
getProtectedStaticAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) protegidos que cumplen `inspect.iscoroutinefunction()`. No ejecuta los métodos. No recibe argumentos.

```python
assert "_normalizeAsync" in r.getProtectedStaticAsyncMethods()
assert "_normalize" not in r.getProtectedStaticAsyncMethods()
```

<a id="reflectionconcrete-method-getprivatestaticmethods"></a>

**`getPrivateStaticMethods`**

```text
getPrivateStaticMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) privados, incluyendo síncronos y asíncronos. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__normalize" in r.getPrivateStaticMethods()
```

<a id="reflectionconcrete-method-getprivatestaticsyncmethods"></a>

**`getPrivateStaticSyncMethods`**

```text
getPrivateStaticSyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) privados que no son funciones de corrutina. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__normalize" in r.getPrivateStaticSyncMethods()
assert "__normalizeAsync" not in r.getPrivateStaticSyncMethods()
```

<a id="reflectionconcrete-method-getprivatestaticasyncmethods"></a>

**`getPrivateStaticAsyncMethods`**

```text
getPrivateStaticAsyncMethods(self) -> list[str]
```

Devuelve `list[str]` de métodos estáticos (`@staticmethod`) privados que cumplen `inspect.iscoroutinefunction()`. Los resultados usan `__nombre`, sin el prefijo de clase. No ejecuta los métodos. No recibe argumentos.

```python
assert "__normalizeAsync" in r.getPrivateStaticAsyncMethods()
assert "__normalize" not in r.getPrivateStaticAsyncMethods()
```

## Existencia, cambios y métodos dunder

<a id="reflectionconcrete-method-hasmethod"></a>

**`hasMethod`**

```text
hasMethod(self, name: str) -> bool
```

`name` es obligatorio; devuelve `bool` para métodos propios de instancia, clase o estáticos. Usa nombres privados sin mangling. Los dunder se consultan por separado y aquí devuelven `False`.

```python
assert r.hasMethod("render")
assert r.hasMethod("__sign")
assert not r.hasMethod("__repr__")
assert not r.hasMethod("inheritedMethod")
```

<a id="reflectionconcrete-method-setmethod"></a>

**`setMethod`**

```text
setMethod(self, name: str, method: Callable) -> bool
```

`name` y `method` son obligatorios. Añade un callable a la clase y devuelve `True`; admite `__privados`. Rechaza nombres ya clasificados o identificadores inválidos con `ValueError`, y valores no callable con `TypeError`. Para reemplazar un método reconocido, elimínalo primero. El chequeo de duplicados no incluye heredados, datos, propiedades ni dunder: no lo uses para garantizar que cualquier miembro sea nuevo. El callable se guarda tal como se recibe; una función normal pasa a ser método de instancia, sin crear automáticamente decoradores.

```python
def export(self, prefix: str = "report") -> str:
    return f"{prefix}:{self.format}"

assert r.setMethod("export", export) is True
assert ReportService().export() == "report:json"
assert r.removeMethod("export") is True
```

Un descriptor `staticmethod` es callable y puede conservarse al registrarlo. Un descriptor `classmethod` no es callable y `setMethod()` lo rechaza con `TypeError`; no es una API general para instalar cualquier descriptor.

```python
def download() -> str:
    return "report.csv"

assert r.setMethod("download", staticmethod(download)) is True
assert "download" in r.getPublicStaticMethods()
assert ReportService.download() == "report.csv"
r.removeMethod("download")

try:
    r.setMethod("buildAgain", classmethod(lambda cls: cls.__name__))
except TypeError:
    pass
else:
    raise AssertionError("A classmethod descriptor is not callable")
```

<a id="reflectionconcrete-method-removemethod"></a>

**`removeMethod`**

```text
removeMethod(self, name: str) -> bool
```

Elimina de la clase el método propio `name` y devuelve `True`; si no aparece en `hasMethod()`, lanza `ValueError`. Admite privados y descriptores estáticos/de clase. No sirve para borrar dunder ni métodos heredados.

```python
original_summary = ReportService.__dict__["summary"]
assert r.removeMethod("summary") is True
assert not r.hasMethod("summary")
setattr(ReportService, "summary", original_summary)
r.clearCache()
```

<a id="reflectionconcrete-method-getdundermethods"></a>

**`getDunderMethods`**

```text
getDunderMethods(self) -> list[str]
```

Devuelve `list[str]` de callables propios `__nombre__` que no son properties, staticmethods ni classmethods. Incluye `__init__` si se declaró en la clase.

```python
assert "__repr__" in r.getDunderMethods()
assert "__init__" in r.getDunderMethods()
```

<a id="reflectionconcrete-method-getmagicmethods"></a>

**`getMagicMethods`**

```text
getMagicMethods(self) -> list[str]
```

Alias de `getDunderMethods()`; devuelve la misma lista almacenada.

```python
assert r.getMagicMethods() is r.getDunderMethods()
```

## Propiedades sin construir la clase

<a id="reflectionconcrete-method-getproperties"></a>

**`getProperties`**

```text
getProperties(self) -> list[str]
```

Devuelve `list[str]` de descriptores `property` propios. Conserva el orden de declaración, normaliza los privados y no ejecuta los getters.

```python
assert r.getProperties() == ["title", "_title", "__title"]
```

<a id="reflectionconcrete-method-getpublicproperties"></a>

**`getPublicProperties`**

```text
getPublicProperties(self) -> list[str]
```

Devuelve `list[str]` de propiedades públicas.

```python
assert r.getPublicProperties() == ["title"]
```

<a id="reflectionconcrete-method-getprotectedproperties"></a>

**`getProtectedProperties`**

```text
getProtectedProperties(self) -> list[str]
```

Devuelve `list[str]` de propiedades protegidas.

```python
assert r.getProtectedProperties() == ["_title"]
```

<a id="reflectionconcrete-method-getprivateproperties"></a>

**`getPrivateProperties`**

```text
getPrivateProperties(self) -> list[str]
```

Devuelve `list[str]` de propiedades privadas usando su nombre original.

```python
assert r.getPrivateProperties() == ["__title"]
```

<a id="reflectionconcrete-method-getproperty"></a>

**`getProperty`**

```text
getProperty(self, name: str) -> Any
```

`name` es obligatorio. Ejecuta `fget(Clase)` y devuelve el resultado (`Any`): **el getter recibe la clase, no una instancia**. Funciona si solo necesita datos de clase, como `title` en el ejemplo. Una propiedad que usa campos creados por `__init__` puede lanzar `AttributeError`; los errores y efectos del getter se propagan. No es una forma de construir ni de consultar una instancia. Admite privados y propiedades heredadas; lanza `ValueError` si falta y `TypeError` si no es `property`.

```python
assert r.getProperty("title") == "json"
assert r.getProperty("__title") == "json"
```

Una propiedad de instancia no debe evaluarse de esta manera:

```python
class StatefulReport:
    def __init__(self, label: str) -> None:
        self.label = label

    @property
    def title(self) -> str:
        return self.label

stateful = ReflectionConcrete(StatefulReport)
try:
    stateful.getProperty("title")
except AttributeError:
    pass
else:
    raise AssertionError("The class has no instance label")

assert StatefulReport("Daily report").title == "Daily report"
```

<a id="reflectionconcrete-method-getpropertysignature"></a>

**`getPropertySignature`**

```text
getPropertySignature(self, name: str) -> inspect.Signature
```

`name` es obligatorio. Devuelve `inspect.Signature` del getter `fget`, incluido `self`, sin ejecutarlo. Admite privados e incluso propiedades heredadas accesibles por `getattr()`. Lanza `ValueError` si falta y `TypeError` si no es `property` o no puede inspeccionarse su getter.

```python
assert list(r.getPropertySignature("title").parameters) == ["self"]
assert list(r.getPropertySignature("__title").parameters) == ["self"]
```

<a id="reflectionconcrete-method-getpropertydocstring"></a>

**`getPropertyDocstring`**

```text
getPropertyDocstring(self, name: str) -> str | None
```

`name` es obligatorio. Devuelve `str | None` con el docstring de `fget`; sin getter devuelve `None`. Admite privados y propiedades heredadas. Lanza `ValueError` si falta y `TypeError` si el atributo no es `property`.

```python
assert r.getPropertyDocstring("title") == "Report title."
assert r.getPropertyDocstring("__title") == "Report title."
```

## Firmas e información para dependencias

<a id="reflectionconcrete-method-getmethodsignature"></a>

**`getMethodSignature`**

```text
getMethodSignature(self, name: str) -> inspect.Signature
```

`name` es obligatorio. Devuelve `inspect.Signature` sin invocar el método: conserva `self` en métodos de instancia y omite `cls` al obtener un classmethod ligado. Lanza `ValueError` si el nombre no está clasificado, `TypeError` si dejó de ser callable; también pueden propagarse errores de inspección.

```python
signature = r.getMethodSignature("render")
assert list(signature.parameters) == ["self", "item_id", "mode"]
assert "cls" not in r.getMethodSignature("build").parameters
assert "self" not in r.getMethodSignature("normalize").parameters
```

<a id="reflectionconcrete-method-getconstructorsignature"></a>

**`getConstructorSignature`**

```text
getConstructorSignature(self) -> inspect.Signature
```

No recibe argumentos. Devuelve el `inspect.Signature` de `Clase.__init__`, con `self`. No crea el objeto ni clasifica sus dependencias. Los errores de `inspect.signature()` se propagan.

```python
signature = r.getConstructorSignature()
assert list(signature.parameters) == ["self", "limit"]
assert signature.parameters["limit"].default == 10
```

<a id="reflectionconcrete-method-constructorsignature"></a>

**`constructorSignature`**

```text
constructorSignature(self) -> Signature
```

Devuelve el `Signature` de Orionis para las dependencias de `__init__`, sin construir la clase. Sus mapas `resolved`, `unresolved` y `ordered` contienen `Argument`. No es `inspect.Signature` ni resuelve instancias de servicios.

```python
analysis = r.constructorSignature()
assert list(analysis.ordered) == ["limit"]
assert analysis.resolved["limit"].default == 10
```

<a id="reflectionconcrete-method-methodsignature"></a>

**`methodSignature`**

```text
methodSignature(self, method_name: str) -> Signature
```

`method_name` es obligatorio. Devuelve el `Signature` de dependencias de un método propio; quita `self`/`cls` y clasifica sus argumentos sin ejecutarlo. Lanza `AttributeError` si `hasMethod()` es falso; los errores del analizador se propagan. Admite privados.

```python
analysis = r.methodSignature("render")
assert list(analysis.ordered) == ["item_id", "mode"]
assert "item_id" in analysis.unresolved
assert analysis.resolved["mode"].default == "brief"
```

Estos dos últimos métodos delegan en [ReflectDependencies](/es/advanced/introspection/dependencies-and-discovery). `resolved` significa que existe información suficiente de tipo o valor predeterminado; no implica que se haya creado o registrado un servicio. El argumento requerido builtin `item_id: int` permanece sin resolver, mientras que `mode="brief"` tiene un valor predeterminado conocido.

## Caché local y operadores de acceso

El primer getter de miembros realiza el escaneo; las listas y diccionarios devueltos son los objetos almacenados, no copias defensivas. No los modifiques para «editar» la clase: eso altera la vista en caché y puede producir resultados incoherentes. Usa los métodos de modificación o crea una copia de la respuesta.

`setAttribute()`, `removeAttribute()`, `setMethod()` y `removeMethod()` limpian toda la caché de este wrapper. Los cambios hechos directamente sobre la clase o mediante otro wrapper requieren `clearCache()` en cada reflector afectado.

El nombre de clase y el prefijo privado se capturan en el constructor; `clearCache()` no los actualiza. `getModuleName()` y `getDocstring()` leen directamente la clase. `getModuleWithClassName()` conserva su resultado hasta limpiar la caché. Si modificas `__name__`, crea otro wrapper.

Los operadores siguientes acceden a **la caché del wrapper**, no a los atributos de la clase. Usa claves propias que no coincidan con las internas (`attributes`, `methods`, etc.); sobrescribir o borrar claves internas puede romper la consistencia del escaneo.

<a id="reflectionconcrete-method-setitem"></a>

**`__setitem__`**

```text
__setitem__(self, key: str, value: object) -> None
```

Guarda `value` bajo la clave obligatoria `key`; devuelve `None`. No modifica la clase.

```python
r["app:note"] = "reviewed"
assert r["app:note"] == "reviewed"
```

<a id="reflectionconcrete-method-getitem"></a>

**`__getitem__`**

```text
__getitem__(self, key: str) -> object | None
```

Devuelve el valor bajo `key` o `None` si no existe; no lanza `KeyError`. Una clave guardada con `None` se distingue usando `in`.

```python
assert r["app:note"] == "reviewed"
assert r["app:absent"] is None
```

<a id="reflectionconcrete-method-contains"></a>

**`__contains__`**

```text
__contains__(self, key: str) -> bool
```

Devuelve `bool` indicando si `key` está almacenada, incluso cuando su valor es `None`.

```python
r["app:empty"] = None
assert "app:empty" in r
assert "app:absent" not in r
```

<a id="reflectionconcrete-method-delitem"></a>

**`__delitem__`**

```text
__delitem__(self, key: str) -> None
```

Elimina `key`, devuelve `None` e ignora claves inexistentes.

```python
del r["app:note"]
del r["app:absent"]
assert "app:note" not in r
```

<a id="reflectionconcrete-method-clearcache"></a>

**`clearCache`**

```text
clearCache(self) -> None
```

Devuelve `None`. Descarta todos los datos almacenados en este wrapper, incluidas las claves añadidas con corchetes. La siguiente consulta vuelve a inspeccionar; no deshace cambios de la clase ni vacía la caché global de dependencias.

```python
r["app:note"] = "cached"
assert r.clearCache() is None
assert "app:note" not in r
assert "render" in r.getPublicMethods()
```

## Integración con inyección de dependencias

El wrapper necesita saber **qué clase inspeccionar**. No supongas que anotar un parámetro como `ReflectionConcrete` selecciona automáticamente el contrato o componente de tu aplicación. Construye el reflector cuando conoces la clase, o encapsúlalo en un servicio propio que el contenedor pueda resolver. No existe un binding nativo que elija esa clase por ti.

```python
from orionis.http import JSONResponse

class ReportCatalog:
    def __init__(self) -> None:
        self.reflection = ReflectionConcrete(ReportService)

    def actions(self) -> list[str]:
        return list(self.reflection.getPublicMethods())

class ReportExporter:
    def __init__(self, catalog: ReportCatalog) -> None:
        self.catalog = catalog

    def actions(self) -> list[str]:
        return self.catalog.actions()

class MetadataController:
    async def __call__(self, catalog: ReportCatalog) -> JSONResponse:
        return JSONResponse({"actions": catalog.actions()})
```

Aquí se inyecta `ReportCatalog`, un servicio de la aplicación con constructor sin argumentos. El catálogo crea explícitamente el reflector y devuelve una copia de la lista. La inyección en el constructor de otro servicio funciona con la misma anotación `catalog: ReportCatalog`. El acceso directo sigue siendo válido fuera de controladores. Consulta [el contenedor](/es/architecture/service-container) para los registros, ciclos de vida y contratos personalizados.

## Errores y límites que conviene conocer

Las consultas no ejecutan acciones ni aplican anotaciones como validación de datos. Los cambios son reales y afectan a todos los usuarios de la clase dentro del proceso; no crean una copia y no se revierten al borrar el reflector. Una operación puede fallar por restricciones de descriptores o metaclases, y esas excepciones se propagan.

Para consultar propiedades que dependen de una instancia, crea o recibe esa instancia y usa [ReflectionInstance](/es/advanced/introspection/instances). `getProperty()` de este wrapper solo pasa la clase al getter.

Un nombre que `getDunderMethods()` devuelve no es válido automáticamente para `hasMethod()`, `removeMethod()`, `getMethodSignature()` ni `methodSignature()`: esas operaciones usan la lista de métodos no dunder. Las propiedades se consultan mediante sus APIs específicas.

Si cambias funciones dinámicamente, limpiar este wrapper no vacía las cachés compartidas de `ReflectDependencies`. Las funciones nuevas se analizan por su identidad, pero modificar anotaciones o valores predeterminados de la misma función puede conservar un análisis anterior; revisa la [guía de dependencias](/es/advanced/introspection/dependencies-and-discovery).
