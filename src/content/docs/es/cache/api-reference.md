---
title: "Referencia técnica de caché"
description: "Contratos, factorías de backends, serialización, provider y errores de caché."
editUrl: true
lastUpdated: false
---

Para operaciones de aplicación utiliza la [fachada o ICacheManager](/es/cache/manager-and-injection) y la [API completa de valores](/es/cache/caching-values). Esta referencia reúne los contratos y componentes de nivel inferior. Los backends reciben claves completas: si los utilizas directamente, no agregan el prefijo configurado.

## Contratos y exports

`orionis.cache` exporta `CacheManager`, `CacheRepository` y `FileBasedCache`. `orionis.cache.contracts` exporta `ICacheManager`, `ICacheRepository` e `IFileBasedCache`.

| Contrato | Superficie pública |
| --- | --- |
| `ICacheManager` | `store()` y los catorce proxies asíncronos de valores de la [guía del manager](/es/cache/manager-and-injection#manager-proxies). `store()` anota `ICacheRepository`, mientras que la implementación retorna `CacheRepository`. |
| `ICacheRepository` | Quince operaciones asíncronas: los catorce proxies de valores y `replace()`. |
| `IFileBasedCache` | `get() -> dict \| None`, `save(data: dict) -> tuple[int, str]` y `clear() -> bool`, todos síncronos. |

`lock()` existe en `CacheManager` y `CacheRepository`, pero no está declarado en estos contratos abstractos. El provider nativo solo registra `ICacheManager`; no proporciona automáticamente un repositorio o artefacto para los otros contratos. Las anotaciones no sustituyen las diferencias reales entre drivers.

<a id="backend-file"></a>

## FileCacheBackend

```text
from orionis.cache.stores.file import FileCacheBackend
FileCacheBackend(path: Path) -> None
```

Resuelve `path`, crea sus directorios y prepara los locks internos por archivos. El I/O de sus métodos asíncronos se delega a hilos. No utiliza el contrato de discos de Storage: es el backend interno de caché y su configuración vive en `config/cache.py`.

<a id="backend-locknamespace"></a>

`lockNamespace` es una **propiedad** de solo lectura que retorna el directorio absoluto como `Path`. `CacheLock` la utiliza para distinguir almacenes. No la invoques como un método. Los locks de archivo internos coordinan operaciones sobre entradas entre procesos; el contexto de negocio `repository.lock()` tiene un [alcance diferente](/es/cache/locks).

<a id="backend-database"></a>

## DatabaseCacheBackend y su factoría

```text
from orionis.cache.stores.database import DatabaseCacheBackend, build
DatabaseCacheBackend(connection: IConnection, table: str, lock_table: str | None = None) -> None
build(connection: IConnection, table: str, lock_table: str | None = None) -> DatabaseCacheBackend
```

`build()` solo construye el backend. La conexión debe ofrecer restricciones únicas efectivas; de lo contrario se lanza `QueryException`. La primera operación que necesita esquema prepara las tablas de entradas y locks, con fallback `cache_locks` para `lock_table`. Las claves y los tokens owner usan columnas de longitud 255. Se requieren nombres de tabla distintos y permisos de creación; el constructor directo no aplica las validaciones de las entidades de configuración.

La ruta habitual para usarlo es `cache.store("database")`, que resuelve la conexión del ORM y aplica el prefijo. Consulta la [configuración de Database](/es/cache/configuration#config-database).

## API común de los backends File y Database

Las firmas siguientes existen en ambas implementaciones. Son asíncronas y reciben claves `str`. `value`, `default` y los elementos de lotes son `Any`; el contenido debe poder codificarse mediante JSON de msgspec. Los retornos de `delete()` y los lotes son distintos de los métodos del repositorio.

<a id="backend-get"></a>

### get(key: str, default: Any = None) → Any

Devuelve el valor o `default` si la entrada falta o expiró. Un `None` guardado se conserva como valor presente. La expiración se limpia al leer; File usa reloj monotónico y Database reloj de pared. File trata errores de lectura/JSON como ausencia; Database propaga errores SQL y convierte un payload JSON inválido a `None`.

<a id="backend-set"></a>

### set(key: str, value: Any, ttl: float | None = None) → bool

Guarda o reemplaza el valor y su expiración, devolviendo `True` al completar. `None` elimina el TTL; cero vence inmediatamente. File publica mediante archivo temporal y renombrado bajo su lock. Database intenta actualizar y, si no afectó filas, insertar; ante un conflicto de inserción intenta actualizar otra vez. No ofrece una transacción de varias operaciones.

<a id="backend-replace"></a>

### replace(key: str, value: Any, ttl: float | None = None) → bool

Reemplaza solamente una entrada vigente y devuelve si se actualizó. File comprueba y publica bajo el mismo lock por archivo. Database ejecuta un `UPDATE` condicionado a clave y expiración. No crea una entrada eliminada o vencida. Esta operación se expone en `CacheRepository`, no como proxy del manager.

<a id="backend-exists"></a>

### exists(key: str) → bool

Consulta con un sentinel; distingue un `None` almacenado de una ausencia. Puede eliminar una entrada expirada durante la consulta.

<a id="backend-delete"></a>

### delete(key: str) → int

File retorna `1` si eliminó el archivo y `0` si faltaba; Database retorna las filas eliminadas. La eliminación no comprueba primero que el valor siga vigente. El repositorio convierte este número a `bool`.

<a id="backend-clear"></a>

### clear() → bool

File elimina los `*.json` y temporales `*.tmp` de su directorio; conserva los archivos internos de locks. Database elimina todas las filas de la tabla de entradas, sin borrar la tabla de locks. Devuelven `True` al completar. No filtran por prefijo ni coordinan globalmente todos los escritores.

<a id="backend-multiget"></a>

### multiGet(keys: list[str], default: Any = None) → list[Any]

Lee secuencialmente las claves y devuelve una lista en el mismo orden, utilizando `default` por ausencia. `multi_get = multiGet` es un alias público en ambos backends; el repositorio utiliza ese alias y construye un diccionario.

<a id="backend-multiset"></a>

### multiSet(pairs: list[tuple[str, Any]], ttl: float | None = None) → bool

Escribe cada par secuencialmente con un TTL común y devuelve `True`. File realiza sus escrituras síncronas en una invocación al worker; Database llama a `set()` para cada par. No hay rollback del lote: una excepción puede dejar escrituras anteriores publicadas. `multi_set = multiSet` es el alias que consume el repositorio.

<a id="backend-add"></a>

### add(key: str, value: Any, ttl: float | None = None) → bool

Devuelve `True` si creó la entrada. Si ya existe una vigente lanza `ValueError`; el repositorio convierte ese error a `False`. File utiliza creación exclusiva y permite reintentar tras limpiar una entrada expirada. Database elimina primero una fila vencida e intenta insertar bajo la restricción única. Si falla el SQL y la clave no existe, propaga el error SQL.

<a id="backend-increment"></a>

### increment(key: str, delta: int = 1) → int

Suma `delta` al entero almacenado; crea el contador con ese valor si falta. Admite un delta negativo. Mantiene la expiración de una entrada existente. File protege lectura, conversión con `int()` y escritura bajo su lock; Database realiza hasta 25 intentos de comparar y actualizar el payload anterior. Si agota esa contención lanza `QueryException`. Los valores no convertibles a entero producen errores de conversión. Para restar, el repositorio invoca este mismo método con `-amount`.

Ejemplo de composición sobre el backend File dentro de un componente que recibe `IApplication`; el directorio se obtiene de las rutas del proyecto:

```python
from orionis.cache import CacheRepository
from orionis.cache.stores.file import FileCacheBackend
from orionis.foundation.contracts.application import IApplication


class FileCacheProbe:
    def __init__(self, app: IApplication) -> None:
        backend = FileCacheBackend(app.path("storage") / "cache-probe")
        self.repository = CacheRepository(backend, prefix="probe")

    async def check(self) -> dict:
        await self.repository.setMany({"a": 1, "b": 2}, ttl=30)
        await self.repository.replace("a", 3, ttl=30)
        return await self.repository.getMany(["a", "b"])
```

Este ejemplo crea una instancia explícita y separada del manager. Para código de aplicación habitual, selecciona el almacén configurado mediante `ICacheManager`.

<a id="backend-acquirelock"></a>

## acquireLock(key: str, owner: str, lease: float) → bool

Método asíncrono exclusivo de `DatabaseCacheBackend`: realiza **un intento**, sin esperar. Inserta una fila con expiración `time.time() + lease`; ante un conflicto intenta actualizar solo si expiró o ya pertenece al mismo `owner`. Retorna si consiguió la fila. Utiliza un token de propietario único por intento lógico. El código captura cualquier `QueryException` de la inserción y prueba esa actualización; no clasifica su causa. Los errores de la actualización pueden propagarse.

<a id="backend-releaselock"></a>

## releaseLock(key: str, owner: str) → None

Elimina asíncronamente la fila solo cuando coinciden clave y owner. No retorna un indicador ni renueva el lease. `CacheLock` administra token, espera, reintentos y liberación; utiliza su [contexto](/es/cache/locks) en vez de implementar estos detalles en cada consumidor.

<a id="backend-memory"></a>

## Factoría memory

```text
from orionis.cache.stores.memory import build
build() -> SimpleMemoryCache
```

Construye `aiocache.SimpleMemoryCache(serializer=MsgspecSerializer())`. Cada llamada crea un backend independiente; la reutilización por nombre la aporta el manager. Su `clear()` solo vacía esa instancia. Sus métodos pertenecen a aiocache; la API estable de aplicación explicada aquí es la del repositorio de Orionis.

<a id="backend-redis"></a>

## Factoría redis

```text
from orionis.cache.stores.redis import build
build(endpoint: str = "127.0.0.1", port: int = 6379, db: int = 0, password: str | None = None) -> RedisCache
```

Construye `aiocache.RedisCache` con `MsgspecSerializer`, convierte `port` y `db` mediante `int()`, normaliza una contraseña vacía a `None` y fuerza protocolo Redis 2 mediante `connection_pool_kwargs`. No ofrece parámetros Orionis de TLS, cluster, username o socket Unix. `clear()` termina en `FLUSHDB`, sin restringirse a un prefijo.

<a id="backend-memcached"></a>

## Factoría memcached

```text
from orionis.cache.stores.memcached import build
build(endpoint: str = "127.0.0.1", port: int = 11211) -> MemcachedCache
```

Construye `aiocache.MemcachedCache` con `MsgspecSerializer` y convierte `port` a entero. No agrega opciones de autenticación o TLS. `clear()` ejecuta `flush_all` sobre el servicio compartido. Los TTL se trasladan a `exptime`: utiliza enteros y considera sus [límites específicos](/es/cache/stores-and-drivers#driver-memcached).

<a id="msgspec-serializer"></a>

## MsgspecSerializer

Extiende `aiocache.serializers.BaseSerializer`. `DEFAULT_ENCODING = None` conserva bytes sin decodificación UTF-8 adicional. Lo usan las tres factorías anteriores; File y Database codifican directamente con msgspec. Esta clase no es el `Serializer` enriquecido de [artefactos](/es/cache/source-artifacts).

<a id="msgspec-dumps"></a>

### dumps(value: Any) → bytes

Ejecuta `msgspec.json.encode(value)`. Admite los tipos que ese codificador puede representar; no garantiza reconstruir tipos Python con identidad original. Un objeto no soportado produce un error de codificación.

<a id="msgspec-loads"></a>

### loads(data: bytes | str | float | None) → Any

`None` permanece `None`; convierte `str` a bytes y decodifica bytes, bytearray o memoryview como JSON. Otros valores nativos se retornan directamente, para contadores de memoria que evitan `dumps()`. JSON inválido genera error de decodificación.

```python
from orionis.cache.serializers.json import MsgspecSerializer

serializer = MsgspecSerializer()
payload = serializer.dumps({"ready": True, "count": 3})
assert isinstance(payload, bytes)
assert serializer.loads(payload) == {"ready": True, "count": 3}
assert serializer.loads(None) is None
```

<a id="provider"></a>

## CacheProvider

`provides() -> list[type]` es un método de clase que retorna `[ICacheManager]`. `register() -> None` enlaza ese contrato como singleton a `CacheManager`. `async boot() -> None` ejecuta `await CacheFacade.pin()` para fijar la fachada al servicio resuelto. El provider se incluye en el registro nativo y es diferido; su ciclo no supone abrir todos los almacenes ni comprobar servidores externos.

<a id="facade-accessor"></a>

## Cache.getFacadeAccessor() → type

Este método de clase retorna `ICacheManager`. Es el punto de enlace de la fachada con el contenedor; no es un método de acceso a valores ni requiere invocación manual. La clase base aporta `resolve()` y la resolución de llamadas; consulta el [uso de la fachada](/es/cache/manager-and-injection#facade).

<a id="exceptions"></a>

## Errores y límites del contrato

`CacheException` hereda de `Exception`; `CacheStoreException` hereda de ella y señala almacenes desconocidos, configuración ausente o un backend personalizado sin reemplazo atómico. No existe una conversión universal de errores externos a estas clases: permisos de archivo, timeouts, conexión Redis/Memcached, errores de JSON, conversión numérica y `QueryException` pueden propagarse con su tipo original.

El manager no implementa un fallback automático a memoria si un servidor falla. Define explícitamente cómo debe responder tu aplicación si no puede leer, calcular o guardar una entrada; no captures indiscriminadamente errores del resolver como si fueran simples ausencias de caché.

## Ejecución por lotes de File en 1.1.0

`FileCacheBackend.multiGet()` y `multiSet()` ejecutan el lote completo mediante una invocación al worker. Conservan el orden de las claves, duplicados en lecturas, valores predeterminados, bloqueos por archivo y TTL por clave. Las escrituras siguen siendo secuenciales y sin rollback; la cancelación se detiene entre entradas después de completar la operación nativa en curso. El backend de base de datos conserva su ejecución secuencial. Estos métodos retornan listas o booleanos; `getMany()` del repositorio sigue retornando un diccionario.
