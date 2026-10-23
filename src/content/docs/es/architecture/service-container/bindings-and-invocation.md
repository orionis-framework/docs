---
title: "Registrar e invocar servicios"
description: "Referencia de registro y resolución del contenedor: instancias, lifetimes, alias, construcción, funciones y métodos con inyección de dependencias."
editUrl: true
lastUpdated: false
---

La aplicación implementa `IContainer`. Registra servicios en `ServiceProvider.register()` con `self.app` y utiliza la misma aplicación mediante `app: IApplication` en los componentes que necesiten resolución explícita. Las acciones habituales pueden pedir directamente sus servicios mediante anotaciones.

## Preparar servicios para los ejemplos

Guarda las siguientes clases y funciones en `app/services/catalog.py`. Las referencias de esta página utilizan ese módulo:

```python
from abc import ABC, abstractmethod


class ICatalog(ABC):

    @abstractmethod
    def names(self) -> list[str]:
        raise NotImplementedError


class Catalog(ICatalog):

    def names(self) -> list[str]:
        return ["Notebook", "Pencil"]


class CatalogPresenter:

    def __init__(self, catalog: ICatalog) -> None:
        self._catalog = catalog

    def render(self, prefix: str = "Products") -> str:
        return f"{prefix}: {', '.join(self._catalog.names())}"


def render_catalog(catalog: ICatalog, *, prefix: str = "Products") -> str:
    return f"{prefix}: {', '.join(catalog.names())}"


async def create_catalog() -> Catalog:
    return Catalog()
```

Un proveedor publica el contrato:

```python
from app.services.catalog import Catalog, ICatalog
from orionis.container.providers import ServiceProvider


class CatalogProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(ICatalog, Catalog, alias="catalog")
```

Registra o descubre el proveedor según [Proveedores y fachadas](/es/architecture/service-container/providers-and-facades).

## Referencia de registro

Estas operaciones son síncronas y devuelven `True` al completar el registro. `abstract` es un argumento requerido: pasa `None` para utilizar como contrato la clase del servicio.

<a id="container-instance"></a>

### `instance()` — publicar un objeto existente

```text
instance(abstract: type[Any] | None, instance: object, *,
         alias: str | None = None, override: bool = False) -> bool
```

`instance` debe ser un objeto inicializado; pasar una clase produce `TypeError`. Con un contrato explícito, el objeto debe cumplir `isinstance(objeto, contrato)`.

Fuera de un scope activo registra un singleton ya creado. Dentro del scope publica el objeto únicamente allí y rechaza un `alias`, porque los alias solo se registran globalmente. `override=True` sustituye una entrada con el mismo contrato en el destino correspondiente.

```python
from app.services.catalog import Catalog, ICatalog
from orionis.foundation.contracts.application import IApplication


async def publish_for_work(app: IApplication) -> list[str]:
    async with app.beginScope():
        app.instance(ICatalog, Catalog())
        catalog = await app.make(ICatalog)
        return catalog.names()
```

Este ejemplo presupone que `ICatalog` no tiene un singleton global ya materializado. La caché de singletons se consulta antes del scope: publicar un objeto local no reemplaza un singleton global existente. Consulta [precedencia y scopes](/es/architecture/service-container/scopes-and-concurrency#scope-precedence).

<a id="container-transient"></a>

### `transient()` — crear en cada resolución

```text
transient(abstract: type[Any] | None, concrete: type[Any], *,
          alias: str | None = None, override: bool = False) -> bool
```

`concrete` debe ser una clase. Si proporcionas `abstract`, debe ser una clase base de `concrete`. El registro guarda la relación; la construcción sucede con `make()`.

En `CatalogProvider.register()` puedes elegir `self.app.transient(ICatalog, Catalog)` en lugar de `singleton`. Cada resolución obtiene otro `Catalog`; las dependencias del constructor conservan sus propios ciclos de vida.

<a id="container-singleton"></a>

### `singleton()` — reutilizar en el contenedor

```text
singleton(abstract: type[Any] | None, concrete: type[Any], *,
          alias: str | None = None, override: bool = False) -> bool
```

La primera resolución construye y conserva el objeto; las siguientes devuelven su identidad. Los valores explícitos del constructor solo influyen en la primera construcción. La reutilización es local al contenedor y al proceso, sin intercambio de objetos entre workers.

En el proveedor anterior, `await app.make(ICatalog)` y `await app.make("catalog")` recuperan el mismo singleton.

<a id="container-scoped"></a>

### `scoped()` — reutilizar en una unidad de trabajo

```text
scoped(abstract: type[Any] | None, concrete: type[Any], *,
       alias: str | None = None, override: bool = False) -> bool
```

El binding se registra globalmente, pero su instancia se crea y guarda en cada scope. Debe existir un `async with app.beginScope()` activo al resolverlo; fuera de él se lanza `RuntimeError`. Las solicitudes HTTP y las llamadas a Reactor ya delimitan sus propios ámbitos.

```python
from orionis.container.providers import ServiceProvider


class WorkState:

    def __init__(self) -> None:
        self.visited: list[str] = []


class WorkProvider(ServiceProvider):

    def register(self) -> None:
        self.app.scoped(None, WorkState)
```

La [guía de scopes](/es/architecture/service-container/scopes-and-concurrency) muestra cómo compartir `WorkState` dentro de una ejecución y aislarlo de la siguiente.

<a id="container-lifetime"></a>

### `Lifetime`

`orionis.container.enums.lifetimes.Lifetime` contiene `TRANSIENT`, `SINGLETON` y `SCOPED`. Los métodos anteriores seleccionan ese valor por ti. `instance()` no añade un cuarto miembro: almacena un objeto preparado globalmente o en el scope.

### Alias, contratos y reemplazos

Un alias debe ser un `str` no vacío. El registro elimina espacios al principio y al final; la resolución utiliza la clave exacta registrada. El alias apunta al contrato y comparte su ciclo de vida.

Los contratos y alias duplicados producen `ValueError` salvo `override=True`. Los contratos incompatibles, clases inválidas o alias que no sean texto producen `TypeError`.

Reemplazar un binding elimina el singleton cacheado de ese contrato. No modifica objetos ya entregados, ni borra las instancias de scopes activos, ni elimina automáticamente alias anteriores. Registra los servicios durante el bootstrap; evita cambiar bindings mientras se procesan peticiones.

<a id="container-bound"></a>

### `bound()` — consultar un registro

```text
bound(key: type[Any] | str) -> bool
```

Comprueba el alias global y la presencia del contrato en el scope actual, los bindings o la caché singleton. No construye el servicio ni activa un proveedor diferido. Por eso `False` no significa que `make()` vaya a fallar: una clase concreta puede autoconstruirse y un proveedor diferido puede registrar su contrato al resolverlo.

```python
from app.services.catalog import ICatalog
from orionis.foundation.contracts.application import IApplication


async def catalog_status(app: IApplication) -> dict[str, bool]:
    return {
        "contract": app.bound(ICatalog),
        "alias": app.bound("catalog"),
    }
```

## Resolver, construir e invocar

Estas cuatro operaciones se esperan con `await`, incluso cuando el constructor o la función final son síncronos.

<a id="container-make"></a>

### `make()` — resolver por contrato o alias

```text
async make(key: type[Any] | str, *args: tuple[Any, ...],
           **kwargs: dict[str, Any]) -> Any
```

Respeta el lifetime del binding. Sin registro, intenta activar un proveedor diferido y, para una clase concreta, autoconstruirla. Una cadena representa un alias; no importa arbitrariamente una clase por su ruta de módulo. Un alias desconocido produce `ValueError`.

`*args` y `**kwargs` se entregan al constructor cuando necesita crearse el objeto; no reconfiguran una instancia ya cacheada.

```python
from app.services.catalog import ICatalog
from orionis.foundation.contracts.application import IApplication


async def names(app: IApplication) -> list[str]:
    catalog = await app.make(ICatalog)
    by_alias = await app.make("catalog")
    assert catalog is by_alias
    return catalog.names()
```

El resultado es el objeto del servicio. Resolver una instancia callable no ejecuta su `__call__`.

<a id="container-build"></a>

### `build()` — construir una clase concreta

```text
async build(type_: Callable[..., Any], *args: tuple[Any, ...],
            **kwargs: dict[str, Any]) -> Any
```

Aunque la anotación utiliza `Callable`, la implementación exige una clase y rechaza funciones u objetos con `TypeError`. Construye esa clase directamente, con inyección recursiva en `__init__`; no sustituye el target por el binding de su contrato ni recupera su instancia singleton. Sus dependencias sí se resuelven mediante `make()`.

```python
from app.services.catalog import CatalogPresenter
from orionis.foundation.contracts.application import IApplication


async def present(app: IApplication) -> str:
    first = await app.build(CatalogPresenter)
    second = await app.build(CatalogPresenter)
    assert first is not second
    return first.render()
```

Las clases abstractas o no construibles son rechazadas por la reflexión. Una excepción lanzada por un constructor se propaga al llamador.

<a id="container-invoke"></a>

### `invoke()` — ejecutar una función

```text
async invoke(fn: Callable[..., Any], *args: tuple[Any, ...],
             **kwargs: dict[str, Any]) -> Any
```

Admite funciones Python, funciones asíncronas, lambdas y métodos enlazados que puedan inspeccionarse. Rechaza clases y valores no callable con `TypeError`. La reflexión no acepta cualquier objeto únicamente por implementar `__call__`; utiliza `call(objeto, "__call__", ...)` en ese caso.

```python
from app.services.catalog import render_catalog
from orionis.foundation.contracts.application import IApplication


async def present_function(app: IApplication) -> str:
    return await app.invoke(render_catalog, prefix="Available")
```

Devuelve el resultado de la función. Espera las funciones declaradas con `async def`; una función síncrona se ejecuta directamente en el hilo actual, sin enviarla a un thread pool. Si una función síncrona devuelve una coroutine, el resultado sigue siendo esa coroutine y debes esperarla explícitamente.

<a id="container-call"></a>

### `call()` — ejecutar un método

```text
async call(instance: object, method_name: str,
           *args: object, **kwargs: object) -> Any
```

Busca el atributo del objeto, comprueba que sea callable y lo ejecuta con las mismas reglas de inyección que `invoke()`. Un método inexistente produce `AttributeError`; un atributo no callable produce `TypeError`.

```python
from app.services.catalog import CatalogPresenter
from orionis.foundation.contracts.application import IApplication


async def present_method(app: IApplication) -> str:
    presenter = await app.build(CatalogPresenter)
    return await app.call(presenter, "render", prefix="Available")
```

Un controlador invokable utiliza el mismo mecanismo con `"__call__"`. Los métodos de instancia, estáticos y de clase conservan el comportamiento normal de sus descriptores Python.

## Clases, funciones y factories

`transient()`, `singleton()` y `scoped()` registran clases, no factories. Para construir un servicio mediante una función, ejecútala con `invoke()` y publica su resultado inicializado:

```python
from app.services.catalog import ICatalog, create_catalog
from orionis.container.providers import ServiceProvider


class FactoryCatalogProvider(ServiceProvider):

    def register(self) -> None:
        pass

    async def boot(self) -> None:
        catalog = await self.app.invoke(create_catalog)
        self.app.instance(ICatalog, catalog)
```

Esta alternativa reemplaza al proveedor del primer ejemplo; no registres los dos para el mismo contrato. Al ejecutarse fuera de un scope, `instance()` publica el objeto globalmente. No pases una coroutine sin esperar a `instance()`: la resolución ordinaria del contenedor no convierte ese objeto en el resultado de la factory.

Para una factory síncrona, `await app.invoke(factory)` devuelve su resultado inmediato. Para una factory `async def`, espera la función y devuelve el resultado final. La creación de recursos y su cierre siguen siendo responsabilidad del servicio o de los [hooks de la aplicación](/es/getting-started/application-overview).

<a id="container-arguments"></a>

## Cómo se resuelven los parámetros

El contenedor recorre los parámetros en orden y aplica estas reglas:

1. Conserva un valor posicional explícito o el keyword correspondiente, incluido `None`.
2. Para un parámetro pendiente, activa el proveedor diferido que corresponda.
3. Si es un schema, valida los datos del `Request` HTTP activo.
4. Resuelve un binding por el tipo reconocido del parámetro.
5. Utiliza el valor predeterminado o autoconstruye una clase concreta; si no puede hacerlo, lanza un error.

Los parámetros keyword-only participan en la inyección. Los valores restantes de `*args` y `**kwargs` se entregan al callable; los parámetros variádicos no generan por sí mismos dependencias.

```python
from app.services.catalog import Catalog, CatalogPresenter
from orionis.foundation.contracts.application import IApplication


async def explicit_values(app: IApplication) -> str:
    custom = Catalog()
    presenter = await app.build(CatalogPresenter, catalog=custom)
    return await app.call(presenter, "render", prefix="Selected")
```

El objeto explícito tiene prioridad sobre un binding y evita resolver ese parámetro, incluso si habría activado un proveedor diferido. Las anotaciones no convierten ni validan automáticamente esos valores explícitos.

### Tipos, defaults y referencias adelantadas

Un parámetro requerido como `limit: int` necesita un valor explícito o un registro adecuado; el contenedor no inventa un entero. Utiliza `limit: int = 20` para un valor predeterminado normal.

Cuando existe un default, la metainformación toma el tipo de ese valor. Por tanto, `service: ICatalog | None = None` no es una petición de inyección de `ICatalog`: normalmente conserva `None`. Para inyección obligatoria declara `service: ICatalog` sin default. Un registro del tipo reconocido del default puede tener prioridad sobre el valor predeterminado.

Importa las clases necesarias en runtime. Las referencias adelantadas que pueden resolverse en el módulo se reconocen, y los constructores también contemplan referencias a su propia clase. Un nombre no disponible produce `TypeError` al intentar inyectarlo; un import bajo `TYPE_CHECKING` no proporciona esa clase durante la ejecución.

### Payloads HTTP y otros puntos de entrada

En el contenedor general, un parámetro schema pendiente lee `Request.data()` y ejecuta la validación asíncrona. Necesita el `Request` que el flujo HTTP publicó en el scope. Un schema proporcionado explícitamente evita esa lectura.

MCP, Realtime y otros componentes pueden preparar sus propios argumentos antes de invocar el contenedor. No presupongas que una solicitud HTTP existe en un comando o worker. Consulta [Schemas y validación](/es/validation), [Controladores](/es/http/request-lifecycle), [MCP](/es/protocols/mcp) y [Consola](/es/console) para sus reglas concretas.

<a id="container-errors"></a>

## Errores de resolución

| Situación | Resultado |
|---|---|
| Contrato o alias duplicado, sin `override=True`. | `ValueError`. |
| Clase u objeto incompatible con el contrato; target inválido. | `TypeError` o rechazo de reflexión para clases no construibles. |
| Alias desconocido. | `ValueError`. |
| Parámetro requerido que no puede resolverse. | `TypeError`. |
| Binding scoped sin scope o intentando publicar en uno cerrado. | `RuntimeError`. |
| Método ausente o atributo no callable. | `AttributeError` o `TypeError`, respectivamente. |
| Dependencias circulares. | `CircularDependencyException`. |
| Constructor, función, validación o proveedor falla. | Se propaga la excepción correspondiente. |

`CircularDependencyException` se importa desde `orionis.container.exceptions`. El contenedor detecta ciclos de construcción en el contexto de la tarea y restaura ese estado aunque la resolución falle. No convierte por sí mismo estas excepciones en respuestas HTTP o códigos CLI; ese manejo corresponde al flujo que lo invocó.

<a id="container-binding"></a>

## Metadatos de bindings

`orionis.container.entities.binding.Binding` es una entidad inmutable, con argumentos keyword-only:

```text
Binding(*, contract: type | None = None, concrete: type | None = None,
        instance: object | None = None, lifetime: Lifetime = Lifetime.TRANSIENT,
        alias: str | None = None)
```

Describe el contrato, la implementación, un campo opcional de instancia, el lifetime y el alias. Valida que `lifetime` sea un miembro de `Lifetime`, o lanza `TypeError`. La API de registro hace además las comprobaciones de compatibilidad. Crear un `Binding` directamente no lo registra en la aplicación; utiliza sus métodos públicos de registro.

<a id="container-invocation-plan"></a>

## Planes de invocación

Los planes evitan repetir el análisis de firmas. Son metadatos en memoria y no almacenan los controladores ni sus dependencias. Un plan precalentado sigue consultando los bindings actuales al resolver una llamada.

Las utilidades de `orionis.container.entities.invocation` son útiles al integrar un nuevo despachador:

| Utilidad | Firma y resultado |
|---|---|
| `InvocationPlan` | `InvocationPlan(arguments: tuple[Argument, ...], is_async: bool)`: dataclass inmutable con los parámetros ordenados y el carácter asíncrono. |
| `callable_plan()` | `callable_plan(target: Callable) -> InvocationPlan`: analiza una función o método, sin retener el receptor enlazado. |
| `constructor_plan()` | `constructor_plan(target: type, constructor: object) -> InvocationPlan`: analiza y valida la clase y su constructor. |
| `warm_controller_plan()` | `warm_controller_plan(target: type, method_name: str) -> None`: prepara los descriptores habituales de constructor y acción sin crear un controlador. |

Los cachés de planes están limitados a 1.024 entradas por función cacheada. Los descriptores personalizados permanecen bajo análisis diferido. Las utilidades propagan errores de firma o reflexión y no ejecutan la acción. Para construir o invocar servicios de aplicación utiliza `build()`, `invoke()` y `call()`.

Continúa con [Proveedores y fachadas](/es/architecture/service-container/providers-and-facades) y [Scopes, aislamiento y concurrencia](/es/architecture/service-container/scopes-and-concurrency).
