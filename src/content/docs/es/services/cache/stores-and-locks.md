---
title: "Drivers y almacenes de caché"
description: "Elige entre file, memory, Redis, Memcached y database según el alcance, la expiración y la coordinación que necesitas."
editUrl: true
lastUpdated: false
---

Un **store** es el repositorio que seleccionas mediante `manager.store("redis")`. Su **backend** implementa las operaciones sobre archivos, memoria, Redis, Memcached o tablas de la base de datos. En la configuración incluida los cinco nombres corresponden a implementaciones fijas; el campo `driver` de cada entidad confirma su tipo, no permite convertir arbitrariamente un store en otro.

## Elegir según el alcance

| Store | Dónde se comparte | Cuándo utilizarlo y qué considerar |
|---|---|---|
| `file` | Procesos que acceden al mismo directorio del sistema de archivos. | No necesita un servidor de caché. Introduce I/O y archivos de coordinación; sus expiraciones monotónicas no son persistencia duradera. |
| `memory` | Únicamente los usuarios de la misma instancia de backend. | Pruebas y datos efímeros de un proceso. No comparte resultados entre workers ni sobrevive a la pérdida de esa instancia. |
| `redis` | Clientes de la misma base de datos Redis. | Caché compartida entre procesos y servidores. Requiere servicio accesible; el ciclo de vida y capacidad dependen de su configuración. |
| `memcached` | Clientes del mismo servicio Memcached. | Caché compartida con almacenamiento temporal administrado por el servidor. No ofrece aislamiento de borrado por prefijo. |
| `database` | Clientes de las mismas tablas en una conexión Database. | Permite reutilizar una conexión existente. Añade consultas y tablas; requiere restricciones únicas efectivas. |

Todos almacenan datos regenerables. Orionis no hace failover automático entre ellos: un fallo de Redis no redirige la escritura a `file` o `memory`. Los errores del backend, serialización, red o base de datos pueden propagarse.

## Dependencias incluidas y servicios externos

El framework declara `aiocache[redis,memcached]`, `redis[hiredis]`, `msgspec` y `filelock` entre sus dependencias normales. El cliente `aiomcache` llega mediante el soporte Memcached de aiocache. **No necesitas instalar extras de Orionis para estos stores** ni ejecutar `reactor packages` para habilitar Redis o Memcached.

Los clientes Python no incluyen los servidores. Antes de usar `redis` o `memcached`, proporciona el servicio correspondiente y sus parámetros en [config/cache.py](/es/services/cache/configuration). El backend `database` utiliza el sistema Database; si eliges un motor con un driver de base de datos opcional, aplica los [requisitos de ese motor](/es/database/drivers).

## Seleccionar un store desde un componente

Este servicio utiliza inyección de `ICacheManager`. `store()` devuelve el repositorio de forma síncrona; las operaciones de datos son asíncronas:

```python
from orionis.cache.contracts import ICacheManager


class CatalogCache:
    def __init__(self, cache: ICacheManager) -> None:
        self.cache = cache

    async def save_snapshot(self) -> dict:
        store = self.cache.store("file")
        snapshot = {"published_products": 42}
        await store.set("catalog:summary", snapshot, ttl=60)
        return await store.get("catalog:summary")
```

Sustituye `"file"` por otro nombre configurado para utilizarlo en esa operación. `self.cache.store()` sin argumento selecciona `CACHE_STORE`. El manager reutiliza el repositorio de cada nombre; no construyas uno nuevo por petición para representar el mismo store de memoria.

También puedes resolver el manager mediante la fachada, dentro de un controlador:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Cache


class CacheStatusController:
    async def index(self) -> JSONResponse:
        manager = await Cache.resolve()
        store = manager.store("memory")
        await store.set("status:ready", {"ready": True}, ttl=30)
        return JSONResponse(await store.get("status:ready"))
```

La resolución explícita devuelve el servicio antes de llamar al método síncrono `store()`; funciona con el provider diferido. El [inicio de la guía](/es/services/cache) explica la fachada y los puntos de integración con la aplicación.

<a id="driver-file"></a>

## File: archivos locales

Configuración mínima:

```dotenv
CACHE_STORE=file
CACHE_FILE_PATH=storage/framework/cache/data
```

El manager resuelve las rutas relativas desde la raíz de la aplicación. Al construirse, el backend normaliza la ruta y crea el directorio. Cada clave completa —incluido el prefijo— se transforma con SHA-256 en un nombre `<digest>.json`; no se utiliza directamente como ruta de archivo.

Cada JSON contiene el valor y su expiración. El backend lee y escribe mediante threads, utiliza locks de archivo por franjas para coordinar accesos al mismo directorio y publica escrituras mediante temporales únicos y reemplazo. Los incrementos coordinan su lectura y escritura bajo el lock del archivo. Estas garantías de una operación no convierten varias llamadas en una transacción.

Los errores de lectura o JSON ilegible se interpretan como ausencia; las entradas expiradas se eliminan al consultarlas. Las escrituras pueden propagar errores de permisos, serialización o I/O. `clear()` elimina los `.json` y `.tmp` del directorio, no solo las claves del prefijo actual. Reserva una carpeta exclusiva para este backend.

### Expiración y persistencia

Los TTL se almacenan usando `time.monotonic()`, en segundos. `ttl=None` no añade vencimiento; `ttl=0` deja la entrada inmediatamente expirada. El reloj monotónico no representa una fecha de calendario y no define una expiración duradera que puedas trasladar entre máquinas o reinicios del sistema. Utiliza este store como caché local regenerable.

No hay un proceso de limpieza periódica ni un límite de tamaño configurado. Una entrada que expire puede permanecer físicamente hasta que se consulte o limpies el store. El [lock público de caché](/es/services/cache/locks) tiene otro alcance: coordina el mismo event loop, directorio y clave, no todas las solicitudes de procesos distintos.

<a id="driver-memory"></a>

## Memory: datos del proceso

```dotenv
CACHE_STORE=memory
```

El builder crea un `SimpleMemoryCache` de aiocache con el serializer JSON de Orionis. No necesita conexión externa y evita I/O de disco o red, aunque sigue serializando los valores.

El manager conserva una instancia por store; otro manager o backend de memoria no comparte esos datos. Cada worker tiene su propia caché y sus propias regeneraciones. No hay persistencia al reiniciar ni un límite de capacidad configurado por Orionis. Los TTL positivos usan temporizadores del event loop; `None` y `0` no programan expiración.

Es apropiado para datos prescindibles de un proceso y para pruebas sin servidores. Para un resultado compartido entre workers, elige un backend compartido.

<a id="driver-redis"></a>

## Redis: caché compartida

```dotenv
CACHE_STORE=redis
CACHE_PREFIX=shop
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
```

Añade `REDIS_PASSWORD` si el servicio lo exige. Orionis construye `RedisCache` de aiocache con endpoint, puerto, base de datos, contraseña y su serializer JSON. El cliente se configura con RESP 2. La configuración incorporada no expone URL de conexión, TLS, usuario ACL, Sentinel o Cluster; no supongas soporte a esas opciones añadiendo campos al diccionario.

Seleccionar el store construye el cliente; no demuestra que la conexión o credenciales sean válidas. Las operaciones de red pueden fallar. La compartición, persistencia del servidor y políticas de memoria dependen del Redis que administres, no de `CACHE_STORE`.

Los TTL fraccionarios de una escritura se convierten a milisegundos para el cliente; los enteros se envían como segundos. Utiliza `None` para una entrada sin expiración y TTL positivos para duración limitada. Orionis no uniforma todos los casos de TTL `0`: el camino de escritura individual y el de escritura múltiple de aiocache utilizan comandos diferentes.

`clear()` ejecuta el vaciado de la base de datos Redis seleccionada; el prefijo de Orionis no limita su alcance. Utiliza una base o servicio apropiado para ese borrado y no compartas esa política de limpieza con datos ajenos.

<a id="driver-memcached"></a>

## Memcached: caché compartida temporal

```dotenv
CACHE_STORE=memcached
CACHE_PREFIX=shop
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11211
```

Orionis construye `MemcachedCache` de aiocache con endpoint, puerto y su serializer JSON. Debes disponer del servicio. La entidad no expone autenticación, TLS ni varios endpoints.

Utiliza TTL en segundos enteros para este backend: su cliente valida `exptime` como entero. `None` y `0` se envían como ausencia de expiración; un TTL fraccionario no se convierte automáticamente y puede producir `TypeError`. El servidor conserva sus límites de claves, tamaños y capacidad; Orionis no los elimina ni proporciona persistencia.

La construcción de claves de aiocache reemplaza espacios por guiones bajos. Evita claves que solo difieran por esos caracteres: podrían referirse al mismo elemento. El prefijo tampoco ofrece aislamiento para `clear()`, que llama a `flush_all` en el servicio.

<a id="driver-database"></a>

## Database: tablas de caché y locks

```dotenv
CACHE_STORE=database
DB_CACHE_TABLE=cache
DB_CACHE_LOCK_TABLE=cache_locks
```

Sin `DB_CACHE_CONNECTION`, el store utiliza la resolución predeterminada de conexiones de Orionis. Para una conexión específica, indica un nombre declarado en `config/database.py`. El backend recibe la conexión a través de `ConnectionResolver`; no crea una configuración de conexión independiente.

La primera operación de I/O crea de forma diferida las tablas de entradas y locks mediante el sistema de esquemas. La conexión debe tener permisos para crear las tablas que falten. Si existen, se conservan; no se migran estructuras incompatibles. Los nombres son lógicos y reciben el prefijo de tablas de la conexión Database.

| Tabla | Columnas generadas | Finalidad |
|---|---|---|
| Entradas: `table` | `cache_key`: String(255), clave primaria; `cache_value`: Text nullable; `expiration`: Double nullable. | Clave completa, JSON y vencimiento. |
| Locks: `lock_table` | `cache_key`: String(255), clave primaria; `owner`: String(255) nullable; `expiration`: Double nullable. | Reserva temporal por clave y propietario. |

Las tablas deben tener nombres diferentes y exclusivos de esta caché. La conexión debe imponer claves únicas realmente: el constructor rechaza motores como Amazon Redshift mediante `QueryException`. Entradas y locks utilizan la misma conexión; no existe una opción separada para la conexión de locks.

Las expiraciones usan `time.time()` y almacenan segundos con parte fraccionaria. `None` significa sin vencimiento; `0` expira de inmediato. La lectura elimina una fila expirada de forma diferida. No hay un barrido periódico de todas las filas. Las operaciones múltiples recorren las entradas; no representan una única transacción de lote. Los incrementos usan comparación y actualización con reintentos acotados ante concurrencia.

Este store permite compartir datos sin desplegar un servidor de caché específico, a cambio de consultas y escrituras en tu base de datos. `clear()` elimina todas las filas de la tabla de entradas, conserva la tabla y no elimina los locks. Los fallos de conexión, esquema o consultas pueden propagarse.

<a id="namespace"></a>

## Prefijos, namespace y serialización

`CACHE_PREFIX` transforma la clave que recibe el backend: `prefix:key` cuando hay prefijo, o `key` cuando está vacío. No crea un namespace separado en el cliente Redis/Memcached, un subdirectorio file ni una tabla distinta database.

| Backend | Alcance de `clear()` |
|---|---|
| File | Archivos JSON y temporales de su directorio. |
| Memory | Todos los datos de esa instancia de backend. |
| Redis | La base de datos Redis seleccionada. |
| Memcached | El servicio Memcached mediante `flush_all`. |
| Database | Todas las filas de la tabla de entradas. |

Los cinco backends utilizan JSON de msgspec: el serializer `MsgspecSerializer` en memory/Redis/Memcached y codificación JSON directa en file/database. Una tupla se recupera como lista y las fechas pueden recuperarse como texto; no se conserva necesariamente el tipo Python original. Los objetos no serializables fallan al escribir.

Para resultados compartidos, prefiere contratos de datos JSON explícitos: diccionarios, listas, cadenas, números, booleanos y `None`. El `Serializer` enriquecido de [artefactos de caché](/es/services/cache/source-artifacts) no participa en estos backends.

### Comparar la coordinación

| Store | Alcance del lock público |
|---|---|
| File | Misma clave, directorio y event loop; no coordina procesos mediante ese contexto. |
| Memory | RedLock sobre la misma instancia del backend. |
| Redis | Lease RedLock sobre el servicio compartido. |
| Memcached | Lease RedLock con las garantías específicas del backend. |
| Database | Reserva mediante filas y propietario en la tabla de locks. |

Consulta [locks y regeneración](/es/services/cache/locks) para el significado de `timeout`, la expiración de leases y ejemplos completos. Un lock de caché no sustituye transacciones o restricciones del sistema de datos definitivo.

## Backends propios y fallos

El manager reconoce los cinco nombres incorporados y reutiliza cada repositorio. No incluye `extend()` para registrar un nuevo nombre o un mecanismo de reintento/fallback común. Redis, Memcached o database sin configuración producen `CacheStoreException`; un servicio inaccesible conserva los errores de su backend.

Puedes construir `CacheRepository(backend, prefix)` con un backend compatible o sustituir `ICacheManager` mediante un provider. Debes implementar las operaciones reales que utiliza el repositorio, incluidas las de concurrencia que necesites; cambiar solo un campo `driver` no registra esa implementación. La [referencia técnica](/es/services/cache/api-reference) detalla los contratos y builders.
