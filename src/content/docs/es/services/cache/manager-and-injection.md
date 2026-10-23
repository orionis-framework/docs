---
title: "Fachada e inyección de Cache"
description: "Utiliza Cache e ICacheManager en controladores y servicios y conoce toda la API del manager."
editUrl: true
lastUpdated: false
---

La fachada `Cache` y el contrato `ICacheManager` acceden al mismo singleton de la aplicación. El manager selecciona repositorios; cada repositorio aplica el prefijo y ejecuta las operaciones en su backend.

<a id="facade"></a>

## Fachada y resolución diferida

Importa siempre `from orionis.support.facades import Cache`. Los métodos asíncronos pueden ser la primera operación: su `await` resuelve el servicio diferido.

```python
from orionis.http import JSONResponse
from orionis.support.facades import Cache


class CachedBannerController:
    async def __call__(self) -> JSONResponse:
        banner = await Cache.remember(
            "home:banner:v1", 300, lambda: {"message": "Welcome"},
        )
        return JSONResponse(banner)
```

`store()` y `lock()` son factorías **síncronas** del servicio ya resuelto. Para disponer explícitamente del manager y encadenar métodos del repositorio desde la primera operación, resuélvelo antes:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Cache


class StoreExampleController:
    async def __call__(self) -> JSONResponse:
        cache = await Cache.resolve()
        repository = cache.store("memory")
        await repository.set("example:status", {"ready": True}, ttl=60)
        return JSONResponse(await repository.get("example:status"))
```

El provider nativo es diferido. Hasta resolverlo, una llamada síncrona a través de la fachada produce un dispatcher, no un repositorio con el que puedas encadenar `.get()`. Después de `await Cache.resolve()` puedes usar también `Cache.store(...)` o `Cache.lock(...)`. El dispatcher también soporta `async with Cache.lock(...)` con resolución diferida al entrar al contexto. No necesitas llamar a `resolve()` antes de cada operación ni registrar el provider manualmente.

<a id="injection"></a>

## Inyección por constructor

Utiliza `ICacheManager`, exportado por `orionis.cache.contracts`, cuando varias acciones del componente consuman caché. Guarda el ejemplo en `app/http/controllers/catalog_cache_controller.py`:

```python
from orionis.cache.contracts import ICacheManager
from orionis.http import JSONResponse


class CatalogCacheController:
    def __init__(self, cache: ICacheManager) -> None:
        self.cache = cache

    async def show(self, product_id: int) -> JSONResponse:
        key = f"catalog:product:{product_id}:v1"
        value = await self.cache.remember(
            key, 120, lambda: {"id": product_id, "label": "Example"},
        )
        return JSONResponse(value)

    async def invalidate(self, product_id: int) -> JSONResponse:
        deleted = await self.cache.delete(f"catalog:product:{product_id}:v1")
        return JSONResponse({"deleted": deleted})
```

Registra las acciones en tu archivo de rutas API:

```python
from app.http.controllers.catalog_cache_controller import CatalogCacheController
from orionis.support.facades import Route

Route.get("/catalog-cache/{product_id:int}", [CatalogCacheController, "show"])
Route.delete("/catalog-cache/{product_id:int}", [CatalogCacheController, "invalidate"])
```

El contenedor construye el controlador, resuelve el contrato y aporta `product_id` desde la ruta. El resolver del ejemplo devuelve datos de demostración; en una aplicación puede ser una función asíncrona que consulte tu servicio de catálogo. No recibe argumentos: captura los que necesites en su cierre.

## Inyección por método

Si solo una acción necesita caché, recíbela en el método:

```python
from orionis.cache.contracts import ICacheManager
from orionis.http import JSONResponse


class VisitCounterController:
    async def __call__(self, cache: ICacheManager) -> JSONResponse:
        visits = await cache.store("memory").increment("demo:visits")
        return JSONResponse({"visits_in_this_store": visits})
```

Registra la clase como controlador invokable según la guía de [controladores](/es/http/request-lifecycle). El contador del ejemplo es local al backend en memoria de esta aplicación; otros procesos tienen el suyo. `cache` es una dependencia del servidor, no un parámetro del payload. La llamada Python directa a un método no activa inyección: debes proporcionar el argumento o dejar que lo invoque el contenedor.

## Servicios y providers

El contrato funciona también en constructores de servicios que construya el contenedor, consumidos por HTTP, comandos, jobs, MCP u otros componentes con inyección:

```python
from orionis.cache.contracts import ICacheManager


class CachedSettings:
    def __init__(self, cache: ICacheManager) -> None:
        self.cache = cache

    async def read(self) -> dict:
        return await self.cache.remember(
            "settings:public:v1", 60, lambda: {"signup_enabled": True},
        )
```

En un provider con acceso a `self.app`, resuelve explícitamente `cache = await self.app.make(ICacheManager)`. Los hooks `register()` y `boot()` no reciben automáticamente dependencias de método. Consulta [providers y fachadas](/es/architecture/service-container/providers-and-facades). Usa `ICacheManager` como dependencia general: `ICacheRepository` y `IFileBasedCache` definen contratos, pero el provider nativo no registra instancias para ellos.

<a id="manager-construction"></a>

## Construcción y ciclo de vida

```text
CacheManager(app: IApplication) -> None
```

Lee `app.basePath` y `app.config("cache")`; convierte un diccionario a la entidad `Cache` y conserva una entidad ya construida. Retiene `default`, `prefix` y una caché de repositorios inicialmente vacía. La configuración se captura al crear el singleton: cambiar variables de entorno después no reconstruye sus repositorios.

El `CacheProvider` nativo registra `ICacheManager → CacheManager` como singleton y fija la fachada al ejecutarse su `boot()` asíncrono durante la resolución diferida. No crea todos los backends al iniciar. El manager no expone un método público para cerrar, purgar sus referencias o registrar drivers adicionales.

<a id="manager-store"></a>

## store(name: str | None = None) → CacheRepository

Devuelve el repositorio del nombre indicado; `None` y `""` eligen el predeterminado (`name or default`). Conserva una instancia por nombre: llamadas posteriores devuelven el mismo repositorio. Acepta `file`, `memory`, `redis`, `memcached` y `database`, en minúsculas y sin normalizar el argumento.

```python
from orionis.cache.contracts import ICacheManager


class CacheStores:
    def __init__(self, cache: ICacheManager) -> None:
        self.cache = cache

    async def example(self) -> bool:
        repository = self.cache.store("memory")
        assert repository is self.cache.store("memory")
        return await repository.set("demo:ready", True, ttl=30)
```

El driver se elige por ese nombre fijo; el campo `driver` de una entidad no crea un almacén con un nombre arbitrario. `file` resuelve las rutas relativas contra `app.basePath` y crea el directorio al construir el backend. `database` resuelve una conexión del ORM; sus tablas se preparan al operar. Redis y Memcached no verifican conectividad al seleccionar el repositorio.

Un nombre desconocido o la ausencia de configuración necesaria para Redis, Memcached o Database produce `CacheStoreException`. También se propagan errores de configuración, permisos, conexión o restricciones del motor. Consulta [drivers](/es/services/cache/stores-and-locks) y [configuración](/es/services/cache/configuration).

<a id="manager-proxies"></a>

## Todas las operaciones delegadas

Estos métodos llaman al repositorio predeterminado. Sus parámetros, retornos y errores son los de la [API de valores](/es/services/cache/caching-values); el manager no agrega otra capa de almacenamiento. `Callable` representa un resolver sin argumentos, síncrono o asíncrono.

| Firma del manager | Propósito y resultado |
| --- | --- |
| `async get(key: str) -> Any` | [Leer](/es/services/cache/caching-values#repository-get); valor o `None`. |
| `async set(key: str, value: Any, ttl: float \| None = None) -> bool` | [Guardar](/es/services/cache/caching-values#repository-set) con TTL opcional. |
| `async has(key: str) -> bool` | [Comprobar existencia](/es/services/cache/caching-values#repository-has). |
| `async delete(key: str) -> bool` | [Eliminar una entrada](/es/services/cache/caching-values#repository-delete). |
| `async clear() -> bool` | [Vaciar el backend](/es/services/cache/caching-values#repository-clear), sin limitarse al prefijo. |
| `async getMany(keys: list[str]) -> dict[str, Any]` | [Leer un lote](/es/services/cache/caching-values#repository-getmany). |
| `async setMany(values: dict[str, Any], ttl: float \| None = None) -> bool` | [Guardar un lote](/es/services/cache/caching-values#repository-setmany). |
| `async remember(key: str, ttl: float \| None, resolver: Callable) -> Any` | [Calcular ante una ausencia](/es/services/cache/caching-values#repository-remember). |
| `async rememberForever(key: str, resolver: Callable) -> Any` | [Calcular sin TTL](/es/services/cache/caching-values#repository-rememberforever). |
| `async pull(key: str) -> Any` | [Leer y luego eliminar](/es/services/cache/caching-values#repository-pull); no es atómico. |
| `async add(key: str, value: Any, ttl: float \| None = None) -> bool` | [Agregar si falta](/es/services/cache/caching-values#repository-add). |
| `async increment(key: str, amount: int = 1) -> int` | [Incrementar](/es/services/cache/caching-values#repository-increment). |
| `async decrement(key: str, amount: int = 1) -> int` | [Decrementar](/es/services/cache/caching-values#repository-decrement). |
| `lock(key: str, timeout: float \| None = None) -> Any` | Crear un [contexto CacheLock](/es/services/cache/locks). Síncrono; el retorno real es `CacheLock`. |

`replace()` pertenece al repositorio: utiliza `cache.store().replace(...)`. No existe un proxy `Cache.replace(...)`. `lock()` existe en las implementaciones concretas del manager y del repositorio, aunque no figura en sus contratos abstractos actuales; la guía de bloqueos utiliza la fachada resuelta para acceder a él.

## Mantener coherencia con los datos permanentes

Utiliza claves que incluyan el recurso, su identificador y, cuando sea necesario, la identidad o el ámbito autorizado. Después de confirmar una modificación permanente, elimina o reemplaza su entrada. El manager no escucha cambios del ORM ni invalida claves automáticamente; `remember()` tampoco coordina cálculos simultáneos. Define esa política en el servicio que conoce la operación y consulta las garantías de [locks](/es/services/cache/locks) antes de apoyarte en ellos.
