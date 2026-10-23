---
title: "ReflectionInstance"
description: "Inspeccionar datos, métodos, propiedades y firmas de un objeto existente."
editUrl: true
lastUpdated: false
---

`ReflectionInstance` inspecciona un objeto ya construido: sus datos actuales, la clase que lo define, métodos, propiedades y firmas. Es útil para herramientas de diagnóstico, adaptadores y extensiones que necesitan examinar un servicio sin crear otra instancia. No ejecuta los métodos descubiertos ni resuelve sus dependencias.

## Inicio rápido

Para examinar datos de una clase importada basta con construir el wrapper alrededor del objeto.

```python
from orionis.introspection import ReflectionInstance
from orionis.support.types import StdClass

record = StdClass(status="ready")
record_reflection = ReflectionInstance(record)
assert record_reflection.getPublicAttributes() == {"status": "ready"}
assert record_reflection.getInstance() is record
```

## Preparar un objeto importable

Guarda esta clase de ejemplo en `app/services/report_service.py`. Las secciones siguientes reutilizan `service` y `reflected`. La variedad de miembros permite comprobar cada filtro; en una aplicación normal basta con los miembros que necesites.

```python
class ReportBase:
    def inherited(self) -> str:
        return "base"

    @property
    def inherited_label(self) -> str:
        return "base label"


class ReportService(ReportBase):
    """Generate reports for an application."""

    title: str
    _token: str
    __secret: str

    def __init__(self, title: str = "Sales") -> None:
        self.title = title
        self._token = "internal"
        self.__secret = "private"
        self.__trace__ = "trace"

    def render(self, limit: int = 10) -> str:
        """Render the report."""
        return f"{self.title}: {limit}"

    async def refresh(self) -> str:
        return self.title

    def _prepare(self) -> str:
        return self._token

    async def _prepare_async(self) -> str:
        return self._token

    def __sign(self) -> str:
        return self.__secret

    async def __sign_async(self) -> str:
        return self.__secret

    @classmethod
    def category(cls) -> str:
        return cls.__name__

    @classmethod
    async def category_async(cls) -> str:
        return cls.__name__

    @classmethod
    def _category(cls) -> str:
        return cls.__name__

    @classmethod
    async def _category_async(cls) -> str:
        return cls.__name__

    @classmethod
    def __category(cls) -> str:
        return cls.__name__

    @classmethod
    async def __category_async(cls) -> str:
        return cls.__name__

    @staticmethod
    def valid() -> bool:
        return True

    @staticmethod
    async def valid_async() -> bool:
        return True

    @staticmethod
    def _valid() -> bool:
        return True

    @staticmethod
    async def _valid_async() -> bool:
        return True

    @staticmethod
    def __valid() -> bool:
        return True

    @staticmethod
    async def __valid_async() -> bool:
        return True

    @property
    def label(self) -> str:
        """Human-readable report label."""
        return self.title.upper()

    @property
    def _length(self) -> int:
        return len(self.title)

    @property
    def __label(self) -> str:
        return self.__secret

    def temporary(self) -> None:
        return None
```

```python
from app.services.report_service import ReportService
from orionis.introspection import ReflectionInstance

service = ReportService()
reflected = ReflectionInstance(service)
assert reflected.getInstance() is service
```

<a id="reflectioninstance-method-init"></a>

### `__init__`

```python
def __init__(self, instance: Any) -> None: ...
```

`instance` es obligatorio y debe ser un objeto, no una clase. Rechaza clases y objetos cuyo `instance.__class__.__module__` sea `builtins` o `abc` con `TypeError`; rechaza el módulo `__main__` con `ValueError`. No comprueba que el módulo indicado sea importable: una clase sintética con otro nombre de módulo también puede aceptarse. El ejemplo utiliza una clase definida en un archivo importable para poder recuperar su código fuente y evitar `__main__`. La construcción no realiza todavía los recorridos de atributos o métodos.

```python
reflected = ReflectionInstance(service)
```

## Identidad y metadatos

Estos métodos no requieren argumentos. Devuelven referencias o metadatos de la clase del objeto, no una copia del servicio.

`getClassName()`, `getModuleName()` y `getModuleWithClassName()` utilizan los nombres capturados al construir el wrapper. Si después cambias `__name__` o `__module__` de la clase, `clearCache()` no actualiza esos campos; construye otro wrapper para obtener los nuevos nombres.

<a id="reflectioninstance-method-getinstance"></a>

### `getInstance`

```python
def getInstance(self) -> Any: ...
```

Devuelve el mismo objeto reflejado (`Any`).

```python
assert reflected.getInstance() is service
```

<a id="reflectioninstance-method-getclass"></a>

### `getClass`

```python
def getClass(self) -> type: ...
```

Devuelve su clase (`type`).

```python
assert reflected.getClass() is ReportService
```

<a id="reflectioninstance-method-getclassname"></a>

### `getClassName`

```python
def getClassName(self) -> str: ...
```

Devuelve `__name__` de la clase como `str`.

```python
assert reflected.getClassName() == "ReportService"
```

<a id="reflectioninstance-method-getmodulename"></a>

### `getModuleName`

```python
def getModuleName(self) -> str: ...
```

Devuelve el módulo de la clase como `str`.

```python
assert reflected.getModuleName() == "app.services.report_service"
```

<a id="reflectioninstance-method-getmodulewithclassname"></a>

### `getModuleWithClassName`

```python
def getModuleWithClassName(self) -> str: ...
```

Concatena módulo y nombre simple de clase. No usa `__qualname__` para clases anidadas.

```python
assert reflected.getModuleWithClassName() == "app.services.report_service.ReportService"
```

<a id="reflectioninstance-method-getdocstring"></a>

### `getDocstring`

```python
def getDocstring(self) -> str | None: ...
```

Devuelve el `__doc__` de la clase, o `None`; no el docstring de `__init__`.

```python
assert reflected.getDocstring() == "Generate reports for an application."
```

<a id="reflectioninstance-method-getbaseclasses"></a>

### `getBaseClasses`

```python
def getBaseClasses(self) -> tuple[type, ...]: ...
```

Devuelve una tupla con las bases directas, no toda la jerarquía MRO.

```python
assert reflected.getBaseClasses()[0].__name__ == "ReportBase"
```

<a id="reflectioninstance-method-getannotations"></a>

### `getAnnotations`

```python
def getAnnotations(self) -> dict[str, type]: ...
```

Devuelve un diccionario de anotaciones de la clase. Los nombres privados propios se presentan sin el prefijo de mangling. No infiere tipos a partir de los valores ni convierte anotaciones en dependencias resueltas.

```python
assert "title" in reflected.getAnnotations()
assert "__secret" in reflected.getAnnotations()
```

<a id="reflectioninstance-method-getfile"></a>

### `getFile`

```python
def getFile(self) -> str | None: ...
```

Devuelve la ruta del archivo de la clase (`str`), memoizada, o `None` cuando `inspect` genera `TypeError` u `OSError`.

```python
assert reflected.getFile().endswith("report_service.py")
```

<a id="reflectioninstance-method-getsourcecode"></a>

### `getSourceCode`

```python
def getSourceCode(self, method: str | None=None) -> str | None: ...
```

Sin `method` o con un valor vacío devuelve el código de la clase. Con un nombre devuelve el código de un método clasificado en `getMethods()`, admitiendo nombres privados como `__sign`. Los dunder, incluido `__init__`, no pertenecen a esa lista y su consulta individual devuelve `None`. También devuelve `None` para un método ausente o si la fuente no se puede recuperar (`TypeError`/`OSError`). Cada variante se memoiza.

```python
assert "class ReportService" in reflected.getSourceCode()
assert "def render" in reflected.getSourceCode("render")
assert "def __sign" in reflected.getSourceCode("__sign")
assert reflected.getSourceCode("__init__") is None
assert reflected.getSourceCode("missing") is None
```

## Atributos del objeto

El recorrido usa `vars(instance)`: solo enumera entradas del `__dict__` de la instancia, sin incluir automáticamente variables de clase ni valores calculados de propiedades. Un objeto con `__slots__` y sin `__dict__` puede construirse, pero estos recorridos fallan con `TypeError`.

Los diccionarios se almacenan y devuelven por referencia. Los prefijos son una clasificación de nombres de Python, no un control de acceso. Un privado propio como `_ReportService__secret` aparece como `__secret`; un privado heredado con otro prefijo puede clasificarse como protegido.

<a id="reflectioninstance-method-getattributes"></a>

### `getAttributes`

```python
def getAttributes(self) -> dict[str, Any]: ...
```

Combina públicos, protegidos, privados propios y dunder en `dict[str, Any]`.

```python
assert reflected.getAttributes()["__secret"] == "private"
```

<a id="reflectioninstance-method-getpublicattributes"></a>

### `getPublicAttributes`

```python
def getPublicAttributes(self) -> dict[str, Any]: ...
```

Devuelve entradas que no empiezan con `_`.

```python
assert reflected.getPublicAttributes() == {"title": "Sales"}
```

<a id="reflectioninstance-method-getprotectedattributes"></a>

### `getProtectedAttributes`

```python
def getProtectedAttributes(self) -> dict[str, Any]: ...
```

Devuelve entradas con `_` que no fueron clasificadas como privadas propias o dunder.

```python
assert reflected.getProtectedAttributes()["_token"] == "internal"
```

<a id="reflectioninstance-method-getprivateattributes"></a>

### `getPrivateAttributes`

```python
def getPrivateAttributes(self) -> dict[str, Any]: ...
```

Devuelve privados propios con nombres desmangleados.

```python
assert reflected.getPrivateAttributes()["__secret"] == "private"
```

<a id="reflectioninstance-method-getdunderattributes"></a>

### `getDunderAttributes`

```python
def getDunderAttributes(self) -> dict[str, Any]: ...
```

Devuelve nombres que empiezan y terminan con `__`.

```python
assert reflected.getDunderAttributes()["__trace__"] == "trace"
```

<a id="reflectioninstance-method-getmagicattributes"></a>

### `getMagicAttributes`

```python
def getMagicAttributes(self) -> dict[str, Any]: ...
```

Alias de `getDunderAttributes()`; devuelve el mismo diccionario cacheado.

```python
assert reflected.getMagicAttributes() is reflected.getDunderAttributes()
```

<a id="reflectioninstance-method-hasattribute"></a>

### `hasAttribute`

```python
def hasAttribute(self, name: str) -> bool: ...
```

`name: str` es obligatorio. Comprueba el diccionario combinado o `hasattr(instance, name)` y devuelve `bool`; por ello también puede detectar variables de clase y propiedades. El recorrido del diccionario se ejecuta primero.

```python
assert reflected.hasAttribute("title")
assert reflected.hasAttribute("label")
assert not reflected.hasAttribute("missing")
```

<a id="reflectioninstance-method-getattribute"></a>

### `getAttribute`

```python
def getAttribute(self, name: str, default: Any=None) -> Any: ...
```

`name` es obligatorio; `default=None` se usa si no existe. Prioriza el diccionario cacheado y hace también una consulta `getattr`; esta consulta puede ejecutar descriptores. Para privados propios usa el nombre desmangleado. Las excepciones de un getter pueden propagarse.

```python
assert reflected.getAttribute("__secret") == "private"
assert reflected.getAttribute("missing", "fallback") == "fallback"
assert reflected.getAttribute("label") == "SALES"
```

<a id="reflectioninstance-method-getattributedocstring"></a>

### `getAttributeDocstring`

```python
def getAttributeDocstring(self, name: str) -> str | None: ...
```

Obtiene el `__doc__` del valor del atributo, o `None`; no extrae comentarios de la declaración. `name` es obligatorio y admite privados propios. Lanza `AttributeError` si no existe.

```python
assert reflected.getAttributeDocstring("title") == str.__doc__
```

<a id="reflectioninstance-method-setattribute"></a>

### `setAttribute`

```python
def setAttribute(self, name: str, value: Any) -> bool: ...
```

`name` y `value` son obligatorios. Valida un identificador Python que no sea palabra reservada (`AttributeError`); rechaza valores callable (`TypeError`). Aplica mangling a privados propios, llama a `setattr`, vacía toda la caché y devuelve `True`. Las restricciones de setters o slots se conservan.

```python
assert reflected.setAttribute("region", "EU") is True
assert service.region == "EU"
assert reflected.setAttribute("__secret", "updated") is True
assert reflected.getAttribute("__secret") == "updated"
```

<a id="reflectioninstance-method-removeattribute"></a>

### `removeAttribute`

```python
def removeAttribute(self, name: str) -> bool: ...
```

`name` es obligatorio. Elimina el atributo con `delattr`, invalida la caché y devuelve `True`. Considera ausente cualquier valor obtenido igual a `None`, así que también rechaza atributos existentes cuyo valor sea `None` con `AttributeError`. Puede fallar para propiedades sin deleter o atributos solo de clase.

```python
assert reflected.removeAttribute("region") is True
assert not reflected.hasAttribute("region")
```

## Filtrar métodos

El escaneo recorre `dir(type(instance))` con acceso estático a descriptores: incluye métodos heredados, distingue funciones de instancia, `classmethod` y `staticmethod`, y separa corrutinas mediante `inspect.iscoroutinefunction`. No invoca los métodos ni los getters de propiedades. Una función que devuelva un awaitable sin ser una función de corrutina sigue en el filtro sync.

Los privados propios se devuelven como `__sign`, sin el prefijo de clase. `getMethods()` excluye dunder y combina las categorías; no constituye un orden de ejecución. Los filtros no reciben argumentos y devuelven listas cacheadas de nombres, no métodos ligados.

<a id="reflectioninstance-method-getmethods"></a>

### `getMethods`

```python
def getMethods(self) -> list[str]: ...
```

Todos los métodos clasificados, sin dunder.

```python
assert "render" in reflected.getMethods()
assert "inherited" in reflected.getMethods()
```

<a id="reflectioninstance-method-getdundermethods"></a>

### `getDunderMethods`

```python
def getDunderMethods(self) -> list[str]: ...
```

Nombres dunder de la clase, incluidos heredados. El recorrido recoge cualquier nombre `__...__` de `dir(cls)` antes de comprobar si es callable; por ello puede incluir entradas como `__module__`.

```python
assert "__init__" in reflected.getDunderMethods()
```

<a id="reflectioninstance-method-getmagicmethods"></a>

### `getMagicMethods`

```python
def getMagicMethods(self) -> list[str]: ...
```

Alias de `getDunderMethods()`.

```python
assert reflected.getMagicMethods() is reflected.getDunderMethods()
```

### Métodos de instancia

<a id="reflectioninstance-method-getpublicmethods"></a>

`getPublicMethods(self) -> list[str]` — Devuelve métodos públicos, tanto sync como async.

```python
assert "render" in reflected.getPublicMethods()
```

<a id="reflectioninstance-method-getpublicsyncmethods"></a>

`getPublicSyncMethods(self) -> list[str]` — Devuelve métodos públicos síncronos.

```python
assert "render" in reflected.getPublicSyncMethods()
```

<a id="reflectioninstance-method-getpublicasyncmethods"></a>

`getPublicAsyncMethods(self) -> list[str]` — Devuelve métodos públicos asíncronos.

```python
assert "refresh" in reflected.getPublicAsyncMethods()
```

<a id="reflectioninstance-method-getprotectedmethods"></a>

`getProtectedMethods(self) -> list[str]` — Devuelve métodos protegidos, tanto sync como async.

```python
assert "_prepare" in reflected.getProtectedMethods()
```

<a id="reflectioninstance-method-getprotectedsyncmethods"></a>

`getProtectedSyncMethods(self) -> list[str]` — Devuelve métodos protegidos síncronos.

```python
assert "_prepare" in reflected.getProtectedSyncMethods()
```

<a id="reflectioninstance-method-getprotectedasyncmethods"></a>

`getProtectedAsyncMethods(self) -> list[str]` — Devuelve métodos protegidos asíncronos.

```python
assert "_prepare_async" in reflected.getProtectedAsyncMethods()
```

<a id="reflectioninstance-method-getprivatemethods"></a>

`getPrivateMethods(self) -> list[str]` — Devuelve métodos privados propios, tanto sync como async.

```python
assert "__sign" in reflected.getPrivateMethods()
```

<a id="reflectioninstance-method-getprivatesyncmethods"></a>

`getPrivateSyncMethods(self) -> list[str]` — Devuelve métodos privados propios síncronos.

```python
assert "__sign" in reflected.getPrivateSyncMethods()
```

<a id="reflectioninstance-method-getprivateasyncmethods"></a>

`getPrivateAsyncMethods(self) -> list[str]` — Devuelve métodos privados propios asíncronos.

```python
assert "__sign_async" in reflected.getPrivateAsyncMethods()
```

### Métodos de clase

<a id="reflectioninstance-method-getpublicclassmethods"></a>

`getPublicClassMethods(self) -> list[str]` — Devuelve métodos públicos, tanto sync como async.

```python
assert "category" in reflected.getPublicClassMethods()
```

<a id="reflectioninstance-method-getpublicclasssyncmethods"></a>

`getPublicClassSyncMethods(self) -> list[str]` — Devuelve métodos públicos síncronos.

```python
assert "category" in reflected.getPublicClassSyncMethods()
```

<a id="reflectioninstance-method-getpublicclassasyncmethods"></a>

`getPublicClassAsyncMethods(self) -> list[str]` — Devuelve métodos públicos asíncronos.

```python
assert "category_async" in reflected.getPublicClassAsyncMethods()
```

<a id="reflectioninstance-method-getprotectedclassmethods"></a>

`getProtectedClassMethods(self) -> list[str]` — Devuelve métodos protegidos, tanto sync como async.

```python
assert "_category" in reflected.getProtectedClassMethods()
```

<a id="reflectioninstance-method-getprotectedclasssyncmethods"></a>

`getProtectedClassSyncMethods(self) -> list[str]` — Devuelve métodos protegidos síncronos.

```python
assert "_category" in reflected.getProtectedClassSyncMethods()
```

<a id="reflectioninstance-method-getprotectedclassasyncmethods"></a>

`getProtectedClassAsyncMethods(self) -> list[str]` — Devuelve métodos protegidos asíncronos.

```python
assert "_category_async" in reflected.getProtectedClassAsyncMethods()
```

<a id="reflectioninstance-method-getprivateclassmethods"></a>

`getPrivateClassMethods(self) -> list[str]` — Devuelve métodos privados propios, tanto sync como async.

```python
assert "__category" in reflected.getPrivateClassMethods()
```

<a id="reflectioninstance-method-getprivateclasssyncmethods"></a>

`getPrivateClassSyncMethods(self) -> list[str]` — Devuelve métodos privados propios síncronos.

```python
assert "__category" in reflected.getPrivateClassSyncMethods()
```

<a id="reflectioninstance-method-getprivateclassasyncmethods"></a>

`getPrivateClassAsyncMethods(self) -> list[str]` — Devuelve métodos privados propios asíncronos.

```python
assert "__category_async" in reflected.getPrivateClassAsyncMethods()
```

### Métodos estáticos

<a id="reflectioninstance-method-getpublicstaticmethods"></a>

`getPublicStaticMethods(self) -> list[str]` — Devuelve métodos públicos, tanto sync como async.

```python
assert "valid" in reflected.getPublicStaticMethods()
```

<a id="reflectioninstance-method-getpublicstaticsyncmethods"></a>

`getPublicStaticSyncMethods(self) -> list[str]` — Devuelve métodos públicos síncronos.

```python
assert "valid" in reflected.getPublicStaticSyncMethods()
```

<a id="reflectioninstance-method-getpublicstaticasyncmethods"></a>

`getPublicStaticAsyncMethods(self) -> list[str]` — Devuelve métodos públicos asíncronos.

```python
assert "valid_async" in reflected.getPublicStaticAsyncMethods()
```

<a id="reflectioninstance-method-getprotectedstaticmethods"></a>

`getProtectedStaticMethods(self) -> list[str]` — Devuelve métodos protegidos, tanto sync como async.

```python
assert "_valid" in reflected.getProtectedStaticMethods()
```

<a id="reflectioninstance-method-getprotectedstaticsyncmethods"></a>

`getProtectedStaticSyncMethods(self) -> list[str]` — Devuelve métodos protegidos síncronos.

```python
assert "_valid" in reflected.getProtectedStaticSyncMethods()
```

<a id="reflectioninstance-method-getprotectedstaticasyncmethods"></a>

`getProtectedStaticAsyncMethods(self) -> list[str]` — Devuelve métodos protegidos asíncronos.

```python
assert "_valid_async" in reflected.getProtectedStaticAsyncMethods()
```

<a id="reflectioninstance-method-getprivatestaticmethods"></a>

`getPrivateStaticMethods(self) -> list[str]` — Devuelve métodos privados propios, tanto sync como async.

```python
assert "__valid" in reflected.getPrivateStaticMethods()
```

<a id="reflectioninstance-method-getprivatestaticsyncmethods"></a>

`getPrivateStaticSyncMethods(self) -> list[str]` — Devuelve métodos privados propios síncronos.

```python
assert "__valid" in reflected.getPrivateStaticSyncMethods()
```

<a id="reflectioninstance-method-getprivatestaticasyncmethods"></a>

`getPrivateStaticAsyncMethods(self) -> list[str]` — Devuelve métodos privados propios asíncronos.

```python
assert "__valid_async" in reflected.getPrivateStaticAsyncMethods()
```

## Firmas y edición de métodos

<a id="reflectioninstance-method-hasmethod"></a>

### `hasMethod`

```python
def hasMethod(self, name: str) -> bool: ...
```

Comprueba si `name` está en el conjunto de métodos clasificados de la clase. No consulta callables añadidos solamente al objeto ni incluye dunder.

```python
assert reflected.hasMethod("render")
assert reflected.hasMethod("__sign")
assert not reflected.hasMethod("__init__")
```

<a id="reflectioninstance-method-getmethodsignature"></a>

### `getMethodSignature`

```python
def getMethodSignature(self, name: str) -> inspect.Signature: ...
```

Con `name` obligatorio devuelve `inspect.Signature` del miembro callable de la clase, con mangling para privados propios. Admite dunder como `__init__`, sin depender de `hasMethod()`. Un método de instancia conserva `self` en esa firma; un classmethod ya ligado a la clase no conserva `cls`. Lanza `AttributeError` si no es callable; los errores de inspección se propagan.

```python
assert list(reflected.getMethodSignature("render").parameters) == ["self", "limit"]
assert list(reflected.getMethodSignature("__init__").parameters) == ["self", "title"]
assert list(reflected.getMethodSignature("__sign").parameters) == ["self"]
```

<a id="reflectioninstance-method-getmethoddocstring"></a>

### `getMethodDocstring`

```python
def getMethodDocstring(self, name: str) -> str | None: ...
```

Con `name` obligatorio devuelve el docstring del callable de la clase, o `None`. Admite privados propios y memoiza el resultado. Lanza `AttributeError` si el miembro no es callable o está ausente.

```python
assert reflected.getMethodDocstring("render") == "Render the report."
```

<a id="reflectioninstance-method-setmethod"></a>

### `setMethod`

```python
def setMethod(self, name: str, method: Callable) -> bool: ...
```

`name` y `method: Callable` son obligatorios. Valida el nombre como `setAttribute`, exige callable (`TypeError`), lo asigna al objeto y devuelve `True`, vaciando la caché. No lo liga automáticamente con `self` ni lo incorpora a los filtros de clase. Usa `types.MethodType` si la función requiere una instancia.

```python
from types import MethodType

assert reflected.setMethod("extra", lambda: "ready") is True
assert service.extra() == "ready"
assert not reflected.hasMethod("extra")

def describe(instance):
    return instance.title

reflected.setMethod("describe", MethodType(describe, service))
assert service.describe() == "Sales"
```

<a id="reflectioninstance-method-removemethod"></a>

### `removeMethod`

```python
def removeMethod(self, name: str) -> None: ...
```

Con `name` obligatorio primero exige que `hasMethod()` sea verdadero y luego elimina el miembro de la clase, no de la instancia. Devuelve `None`; afecta a todas las instancias de esa clase. Lanza `AttributeError` si falta. No elimina métodos solo heredados desde una subclase. Utilízalo para métodos propios públicos o protegidos: un método privado normal no puede eliminarse mediante esta API, porque la comprobación y la eliminación no aplican las mismas reglas de mangling. Tanto `__secret` como `_Class__secret` producen `AttributeError` para ese caso.

```python
assert reflected.removeMethod("temporary") is None
assert not hasattr(service, "temporary")
```

<a id="reflectioninstance-method-constructorsignature"></a>

### `constructorSignature`

```python
def constructorSignature(self) -> Signature: ...
```

Sin argumentos devuelve un `Signature` de Orionis para `__init__`. Sus mapas `resolved`, `unresolved` y `ordered` contienen objetos `Argument`; no son servicios ya construidos. Se memoiza. Consulta la guía de dependencias para la clasificación completa.

```python
dependencies = reflected.constructorSignature()
assert list(dependencies.ordered) == ["title"]
assert "title" in dependencies.resolved
```

<a id="reflectioninstance-method-methodsignature"></a>

### `methodSignature`

```python
def methodSignature(self, method_name: str) -> Signature: ...
```

Con `method_name` obligatorio devuelve un `Signature` de Orionis para el método ligado al objeto y omite `self`. Comprueba `hasMethod()`, admite privados propios y memoiza por nombre. Lanza `AttributeError` para un método no clasificado. No llama al contenedor ni ejecuta el método.

```python
dependencies = reflected.methodSignature("render")
assert list(dependencies.ordered) == ["limit"]
assert "limit" in dependencies.resolved
```

## Propiedades

La enumeración de `property` recorre solo `ReportService.__dict__`: no incluye propiedades heredadas ni nombres dunder `__...__`. Los getters no se ejecutan durante el recorrido. La consulta de una firma o docstring busca el descriptor con `getattr` sobre la clase y sí puede encontrar una propiedad heredada; `getProperty()` exige que aparezca en la lista propia.

<a id="reflectioninstance-method-getproperties"></a>

### `getProperties`

```python
def getProperties(self) -> list[str]: ...
```

Devuelve `list[str]` de propiedades propias de todas las visibilidades.

```python
assert reflected.getProperties() == ["label", "_length", "__label"]
assert "inherited_label" not in reflected.getProperties()
```

<a id="reflectioninstance-method-getpublicproperties"></a>

### `getPublicProperties`

```python
def getPublicProperties(self) -> list: ...
```

Devuelve una lista de nombres públicos propios.

```python
assert reflected.getPublicProperties() == ["label"]
```

<a id="reflectioninstance-method-getprotectedproperties"></a>

### `getProtectedProperties`

```python
def getProtectedProperties(self) -> list: ...
```

Devuelve una lista de nombres protegidos propios.

```python
assert reflected.getProtectedProperties() == ["_length"]
```

<a id="reflectioninstance-method-getprivateproperties"></a>

### `getPrivateProperties`

```python
def getPrivateProperties(self) -> list: ...
```

Devuelve una lista de privados propios desmangleados.

```python
assert reflected.getPrivateProperties() == ["__label"]
```

<a id="reflectioninstance-method-getproperty"></a>

### `getProperty`

```python
def getProperty(self, name: str) -> Any: ...
```

`name` es obligatorio. Ejecuta el getter y devuelve su valor (`Any`). Admite privados propios; lanza `AttributeError` para una propiedad fuera de la lista. Las excepciones del getter se propagan.

```python
assert reflected.getProperty("label") == "SALES"
assert reflected.getProperty("__label") == "updated"
```

<a id="reflectioninstance-method-getpropertysignature"></a>

### `getPropertySignature`

```python
def getPropertySignature(self, name: str) -> inspect.Signature: ...
```

`name` es obligatorio. Devuelve el `inspect.Signature` del getter `fget`, incluyendo `self`, sin ejecutarlo. Se memoiza; admite privados propios y lanza `AttributeError` si el miembro no es `property`. Un descriptor sin getter no puede inspeccionarse normalmente.

```python
assert list(reflected.getPropertySignature("label").parameters) == ["self"]
```

<a id="reflectioninstance-method-getpropertydocstring"></a>

### `getPropertyDocstring`

```python
def getPropertyDocstring(self, name: str) -> str: ...
```

`name` es obligatorio. Devuelve el docstring del getter como `str`, o `""` si no hay docstring. Se memoiza y admite privados propios. Lanza `AttributeError` si no es una propiedad.

```python
assert reflected.getPropertyDocstring("label") == "Human-readable report label."
assert reflected.getPropertyDocstring("_length") == ""
```

## Caché local y protocolo de diccionario

Las colecciones y las firmas son instantáneas memoizadas por wrapper. Una modificación externa del objeto o de su clase no refresca los resultados automáticamente. Las operaciones de escritura de este wrapper vacían su propia caché; otros wrappers del mismo objeto conservan sus instantáneas. No almacena nada en disco.

<a id="reflectioninstance-method-clearcache"></a>

### `clearCache`

```python
def clearCache(self) -> None: ...
```

Vacía todas las entradas y devuelve `None`; el próximo acceso vuelve a analizar los miembros.

```python
reflected.getAttributes()
service.title = "Revenue"
assert reflected.getAttribute("title") == "Sales"
reflected.clearCache()
assert reflected.getAttribute("title") == "Revenue"
```

<a id="reflectioninstance-method-setitem"></a>

### `__setitem__`

```python
def __setitem__(self, key: str, value: object) -> None: ...
```

Guarda `value` bajo `key` en la caché y devuelve `None`.

```python
reflected["custom:note"] = "diagnostic"
```

<a id="reflectioninstance-method-getitem"></a>

### `__getitem__`

```python
def __getitem__(self, key: str) -> object | None: ...
```

Devuelve una entrada, o `None` si no existe; no lanza `KeyError`.

```python
assert reflected["custom:note"] == "diagnostic"
assert reflected["custom:missing"] is None
```

<a id="reflectioninstance-method-contains"></a>

### `__contains__`

```python
def __contains__(self, key: str) -> bool: ...
```

Comprueba pertenencia de `key` en la caché, no la existencia de atributos.

```python
assert "custom:note" in reflected
```

<a id="reflectioninstance-method-delitem"></a>

### `__delitem__`

```python
def __delitem__(self, key: str) -> None: ...
```

Elimina la entrada si existe; un nombre ausente no falla. Devuelve `None`.

```python
del reflected["custom:note"]
del reflected["custom:missing"]
```

Usa prefijos propios para entradas auxiliares: escribir en claves internas como `attributes` o `methods` altera las lecturas del wrapper.

## Inyección de dependencias

No registres un wrapper genérico sin indicar qué objeto refleja. En un controlador u otro componente resuelto por Orionis puedes inyectar el servicio real y construir la reflexión con esa instancia. Las anotaciones de reflexión describen dependencias; no las inyectan por sí solas.

```python
from app.services.report_service import ReportService
from orionis.http import JSONResponse
from orionis.introspection import ReflectionInstance


class DiagnosticsController:
    async def __call__(self, reports: ReportService) -> JSONResponse:
        reflected = ReflectionInstance(reports)
        return JSONResponse({
            "class": reflected.getModuleWithClassName(),
            "methods": reflected.getPublicMethods(),
        })
```

El contrato de este wrapper es `IReflectionInstance`, importable desde `orionis.introspection.instances.contracts.reflection`. No elimina la necesidad de indicar el objeto objetivo: para inyectar un wrapper concreto debes proporcionar una instancia o una fábrica configurada para ese objetivo mediante tu proveedor.

[Firmas de dependencias](/es/utilities/introspection/dependencies-and-discovery) · [Reflexión de módulos](/es/utilities/introspection/modules).
