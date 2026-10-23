---
title: "Configuración de caché"
description: "Referencia de config/cache.py: stores, drivers, prefijos, variables de entorno y validación de cada backend."
editUrl: true
lastUpdated: false
---

`config/cache.py` define `BootstrapCache`, una dataclass inmutable que hereda de `Cache`. Esta configuración selecciona el almacén predeterminado, el prefijo de las claves y los parámetros de los cinco backends incorporados. El manager lee la configuración al construirse y crea cada repositorio cuando se solicita por primera vez.

<a id="config-cache"></a>

## Configuración general: Cache

| Campo | Tipo y predeterminado | Efecto |
|---|---|---|
| `default` | `Drivers \| str`; `CACHE_STORE`, por defecto `file`. | Selecciona el repositorio utilizado por las operaciones del manager y por `store()` sin nombre. |
| `prefix` | `str`; `CACHE_PREFIX`, por defecto `""` en `BootstrapCache`. | Antepone `<prefix>:` a cada clave cuando no está vacío. |
| `stores` | `Stores \| dict`; fábrica `Stores(...)`. | Define las opciones de cada backend. Los diccionarios se convierten en entidades. |

La entidad base `Cache`, si la construyes directamente, usa `"orionis"` como prefijo por defecto. El archivo incluido `BootstrapCache` lo sustituye por `""`. En ambos casos, un valor definido en `CACHE_PREFIX` tiene prioridad.

```dotenv
CACHE_STORE=file
CACHE_PREFIX=shop
```

Con este prefijo, `products:featured` se entrega al backend como `shop:products:featured`. No se recorta ni se añade un separador distinto: `prefix="shop:"` produciría `shop::products:featured`. Se admite la cadena vacía; otros tipos producen `TypeError`.

El prefijo separa nombres de claves, pero **no limita `clear()`**. Esa operación no recibe el prefijo: limpia todos los datos del backend seleccionado. En Redis afecta a la base de datos configurada y en Memcached a la instancia. Revisa [alcance y aislamiento](/es/cache/stores-and-drivers#namespace) antes de compartir un backend.

<a id="config-drivers"></a>

### Nombres de almacén

`Drivers` expone `FILE`, `MEMORY`, `REDIS`, `MEMCACHED` y `DATABASE`, con valores `file`, `memory`, `redis`, `memcached` y `database`.

El campo `default` acepta un miembro de ese enum o una cadena. La cadena se recorta y normaliza: `" REDIS "` se convierte en `"redis"`. Un nombre desconocido produce `ValueError`; un tipo distinto de cadena o `Drivers` produce `TypeError`.

La selección explícita mediante `manager.store("redis")` no aplica esa normalización; utiliza los nombres canónicos. `store(None)` y `store("")` seleccionan el predeterminado. Un nombre desconocido produce `CacheStoreException`, sin cambiar al store `file`.

<a id="config-stores"></a>

## Entradas de Stores

Importa las entidades desde el módulo público:

```python
from orionis.foundation.config.cache import (
    Cache, Database, Drivers, File, Memcached, Memory, Redis, Stores,
)
```

| Campo | Valor admitido | Valor omitido |
|---|---|---|
| `file` | `File \| dict`. | Nueva entidad `File()`. No admite `None`. |
| `memory` | `Memory \| dict \| None`. | Nueva entidad `Memory()`. |
| `redis` | `Redis \| dict \| None`. | Nueva entidad `Redis()`. |
| `memcached` | `Memcached \| dict \| None`. | Nueva entidad `Memcached()`. |
| `database` | `Database \| dict \| None`. | Nueva entidad `Database()`. |

Cada diccionario se convierte en su entidad y pasa por su validación. Las fábricas crean instancias independientes; no se comparte una configuración mutable entre construcciones.

`Stores(redis=None)`, `Stores(memcached=None)` y `Stores(database=None)` dejan esas entradas sin configurar: seleccionarlas produce `CacheStoreException`. `memory=None` es aceptado por la entidad, pero el manager construye el backend de memoria sin consultar ese campo; no desactiva `store("memory")`.

Las entradas son fijas. Un nombre adicional como `secondary` produce `TypeError` al construir `Stores`. El manager no incluye un registro `extend()` de stores. Tampoco utiliza el atributo `driver` para redirigir arbitrariamente una entrada: elige la implementación por el nombre solicitado.

<a id="config-file"></a>

## Archivos: File

| Campo | Variable y predeterminado | Tipo y validación |
|---|---|---|
| `driver` | Sin variable; `"file"`. | Debe ser exactamente `"file"`; otro valor produce `TypeError`. |
| `path` | `CACHE_FILE_PATH`; `"storage/framework/cache/data"`. | `str` no vacía ni compuesta solo por espacios. Tipo incorrecto: `TypeError`; ruta vacía: `ValueError`. |

Una ruta relativa se resuelve contra `app.basePath`; una absoluta se conserva y el backend la normaliza con `resolve()`. El directorio se crea al construir el backend, no al construir `File(...)`.

```dotenv
CACHE_STORE=file
CACHE_FILE_PATH=storage/framework/cache/data
```

Utiliza un directorio dedicado a caché. Sus entradas son archivos JSON cuyo nombre deriva de la clave; `clear()` elimina los archivos `.json` y `.tmp` del directorio. El path también identifica el espacio de los locks de archivo dentro del mismo event loop.

<a id="config-memory"></a>

## Memoria: Memory

| Campo | Variable y predeterminado | Tipo y validación |
|---|---|---|
| `driver` | Sin variable; `"memory"`. | Debe ser exactamente `"memory"`; otro valor produce `TypeError`. |

No tiene parámetros de conexión, límite de capacidad ni política de expulsión configurables en esta entidad. Cada backend mantiene sus propios datos en memoria.

```dotenv
CACHE_STORE=memory
```

<a id="config-redis"></a>

## Redis: Redis

| Campo | Variable y predeterminado | Tipo y validación |
|---|---|---|
| `driver` | Sin variable; `"redis"`. | Debe ser exactamente `"redis"`; otro valor produce `ValueError`. |
| `endpoint` | `REDIS_HOST`; `"127.0.0.1"`. | `str \| None`. `None` o `""` se resuelven a `127.0.0.1` al construir el backend. |
| `port` | `REDIS_PORT`; `6379`. | `int` entre 1 y 65535; no acepta booleanos ni cadenas numéricas. |
| `db` | `REDIS_DB`; `0`. | `int` mayor o igual que cero; no acepta booleanos. |
| `password` | `REDIS_PASSWORD`; `None`. | `str \| None`; la cadena vacía se entrega al cliente como `None`. |

Los tipos inválidos producen `TypeError`; puertos fuera de rango o `db` negativo, `ValueError`. Se valida el tipo de `endpoint`, no que sea una dirección accesible. Las cadenas compuestas por espacios no se normalizan a localhost.

```dotenv
CACHE_STORE=redis
CACHE_PREFIX=shop
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
```

Define `REDIS_PASSWORD` si el servidor exige contraseña. Las opciones expuestas no incluyen usuario ACL, URL de conexión, TLS, Sentinel ni Cluster. El constructor incorporado entrega al cliente las opciones de la tabla y configura el protocolo RESP 2. Un servidor con requisitos distintos necesita una integración de backend adecuada; añadir claves desconocidas al diccionario no amplía esta entidad.

<a id="config-memcached"></a>

## Memcached: Memcached

| Campo | Variable y predeterminado | Tipo y validación |
|---|---|---|
| `driver` | Sin variable; `"memcached"`. | Debe ser exactamente `"memcached"`; otro valor produce `ValueError`. |
| `endpoint` | `MEMCACHED_HOST`; `"127.0.0.1"`. | `str \| None`. `None` o `""` se resuelven a `127.0.0.1`. |
| `port` | `MEMCACHED_PORT`; `11211`. | `int` entre 1 y 65535; no acepta booleanos ni cadenas numéricas. |

Tipo incorrecto: `TypeError`; puerto fuera de rango: `ValueError`. La entidad no expone autenticación, TLS, una lista de servidores ni un namespace propio del cliente.

```dotenv
CACHE_STORE=memcached
CACHE_PREFIX=shop
MEMCACHED_HOST=127.0.0.1
MEMCACHED_PORT=11211
```

<a id="config-database"></a>

## Base de datos: Database

| Campo | Variable y predeterminado | Tipo y validación |
|---|---|---|
| `driver` | Sin variable; `"database"`. | Debe ser exactamente `"database"`; otro valor produce `ValueError`. |
| `connection` | `DB_CACHE_CONNECTION`; `None`. | `str \| None`. Nombre de una conexión del sistema Database. `None` utiliza la resolución de conexión predeterminada. |
| `table` | `DB_CACHE_TABLE`; `"cache"`. | `str` que coincide con `[a-z_]+`: solo minúsculas ASCII y guiones bajos, sin dígitos ni espacios. |
| `lock_table` | `DB_CACHE_LOCK_TABLE`; `"cache_locks"`. | El mismo formato de nombre o `None`; el backend utiliza `cache_locks` si recibe `None`. |

Un tipo incorrecto produce `TypeError`; un nombre de tabla inválido, `ValueError`. Utiliza **nombres distintos** para entradas y locks. Aunque la entidad no rechaza que sean iguales, sus tablas requieren columnas diferentes y no constituyen una configuración válida para utilizar ambos componentes.

```dotenv
CACHE_STORE=database
CACHE_PREFIX=shop
DB_CACHE_TABLE=application_cache
DB_CACHE_LOCK_TABLE=application_cache_locks
```

Para una conexión específica, define `DB_CACHE_CONNECTION` con un nombre declarado en `config/database.py`. Entradas y locks utilizan esa misma conexión; no existe un campo `lock_connection`.

Las tablas se crean de forma diferida en la primera operación de I/O, con protección para conservar las existentes. La conexión debe poder crear las que falten. El backend no modifica tablas incompatibles ya existentes: reserva nombres exclusivos con la estructura que describe [el driver database](/es/cache/stores-and-drivers#driver-database). Requiere claves únicas efectivas y rechaza conexiones como Amazon Redshift, que no ofrecen esa garantía.

## Personalizar el archivo completo

Este ejemplo conserva las entidades y las lecturas de entorno, cambia el predeterminado a memoria y mantiene las otras entradas con sus fábricas:

```python
from dataclasses import dataclass, field
from orionis.environment import Env
from orionis.foundation.config.cache import (
    Cache, Drivers, File, Memory, Stores,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapCache(Cache):
    default: Drivers | str = field(
        default_factory=lambda: Env.get("CACHE_STORE", Drivers.MEMORY),
    )
    prefix: str = field(
        default_factory=lambda: Env.get("CACHE_PREFIX", "shop"),
    )
    stores: Stores | dict = field(
        default_factory=lambda: Stores(
            file=File(path=Env.get("CACHE_FILE_PATH", "storage/framework/cache/data")),
            memory=Memory(),
        ),
    )
```

Las entradas omitidas se crean con sus valores y variables de entorno. Para desactivar Redis, por ejemplo, pasa `redis=None` explícitamente. El manager conserva los repositorios ya construidos: cambiar el entorno después no los reconstruye ni cambia su prefijo.

### Diccionarios equivalentes

```python
from orionis.foundation.config.cache import Cache


settings = Cache(
    default="memory",
    prefix="shop",
    stores={
        "file": {"driver": "file", "path": "storage/framework/cache/data"},
        "memory": {"driver": "memory"},
        "redis": None,
        "memcached": None,
        "database": None,
    },
)
```

Las conversiones anidadas conservan la validación y rechazan campos desconocidos. En diccionarios Python utiliza enteros reales para puertos y `db`; en `.env`, `Env.get(...)` lee los valores antes de construir la entidad. Las credenciales, conexiones disponibles y accesibilidad de los servicios se comprueban al resolverlos o utilizarlos, no al validar esos tipos.

Consulta [drivers y almacenes](/es/cache/stores-and-drivers) para elegir su alcance y [fachada e inyección](/es/cache/manager-and-injection) para utilizarlos desde tus componentes.
