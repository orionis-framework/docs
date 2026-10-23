---
title: "Configuración de colas"
description: "Referencia completa de config/queue.py: conexiones, drivers, canales, fallos, workers, variables de entorno y validaciones."
editUrl: true
lastUpdated: false
---

La configuración se declara en `config/queue.py`, mediante la clase `BootstrapQueue`, que extiende `orionis.foundation.config.queue.Queue`. El manager toma esa configuración, valida sus entidades y conserva una representación normalizada antes de resolver los backends.

<a id="config-queue"></a>

## Estructura principal

```python
from dataclasses import dataclass, field

from orionis.environment import Env
from orionis.foundation.config.queue import (
    Connections,
    Database,
    Failed,
    Queue,
    Redis,
    Sync,
    Worker,
)


@dataclass(frozen=True, kw_only=True, slots=True)
class BootstrapQueue(Queue):

    default: str = field(
        default_factory=lambda: Env.get("QUEUE_CONNECTION", "sync"),
    )

    connections: Connections | dict[str, Sync | Database | Redis | dict] = field(
        default_factory=Connections,
    )

    failed: Failed | dict = field(default_factory=Failed)

    worker: Worker | dict = field(default_factory=Worker)
```

Esta definición usa los mismos valores de entorno y defaults de las entidades nativas. El archivo distribuido por Orionis hace explícitos también los campos de cada conexión para facilitar su edición.

| Campo | Tipo admitido | Predeterminado | Efecto |
|---|---|---|---|
| `default` | `str`. | `QUEUE_CONNECTION`, o `"sync"`. | Nombre de la conexión de colas utilizada cuando el dispatch o el worker no seleccionan otra. Debe existir en `connections`. |
| `connections` | `Connections` o diccionario de nombres a `Sync`, `Database`, `Redis` o sus diccionarios de configuración. | `Connections()` con `sync`, `database` y `redis`. | Define los backends disponibles. Cada uno puede albergar varios canales lógicos. |
| `failed` | `Failed` o `dict`. | `Failed()`. | Selecciona la conexión SQL y la tabla compartidas para guardar fallos terminales. |
| `worker` | `Worker` o `dict`. | `Worker()`. | Define concurrencia, espera de sondeo y valores de ejecución heredados por los jobs. |

Las entidades son dataclasses inmutables con argumentos de construcción por nombre. Los diccionarios anidados se convierten en entidades y se validan; los campos desconocidos producen `TypeError`. `toDict()` devuelve una copia recursiva y serializa los miembros de `Drivers` como sus valores de texto; `getFields()` permite inspeccionar sus campos y metadatos.

<a id="config-connections"></a>

## Conexiones y nombres de colas

`Connections(sync=..., database=..., redis=...)` agrupa los tres nombres convencionales y acepta una entidad o un diccionario para cada uno. Si necesitas nombres propios o varios backends del mismo tipo, utiliza un diccionario en `BootstrapQueue.connections`.

El nombre de la conexión de colas, por ejemplo `reports`, no tiene que ser el driver `database`, ni el nombre de la conexión SQL `analytics`. El canal se selecciona con `.onQueue("exports")` y no necesita otra entrada en la configuración.

Para conexiones con nombre propio, indica siempre `driver` en su diccionario. Si falta, Orionis intenta inferirlo del nombre de esa entrada; esto solo funciona directamente con `sync`, `database` o `redis`.

```python
from dataclasses import dataclass, field

from orionis.foundation.config.queue import Database, Failed, Queue, Redis, Sync, Worker


@dataclass(frozen=True, kw_only=True, slots=True)
class BootstrapQueue(Queue):

    default: str = "reports"

    connections: dict[str, Sync | Database | Redis | dict] = field(
        default_factory=lambda: {
            "inline": Sync(),
            "reports": Database(table="report_jobs", queue="exports"),
            "notifications": Redis(
                prefix="example:notifications",
                queue="mail",
            ),
        },
    )

    failed: Failed | dict = field(
        default_factory=lambda: Failed(table="failed_jobs"),
    )

    worker: Worker | dict = field(
        default_factory=lambda: Worker(timeout=30.0, tries=3, backoff=(1.0, 5.0)),
    )
```

Este ejemplo sustituye `config/queue.py`. Usa la conexión SQL predeterminada para `reports` y los fallos; Redis conserva el host, puerto y credenciales del entorno. Los jobs pueden seleccionar `reports` con `.onConnection("reports")`; el worker debe consumir esa misma conexión y el canal correspondiente.

Los nombres de conexión y de cola aceptan de 1 a 128 caracteres ASCII: el primero debe ser una letra o un dígito; después se admiten letras, dígitos, `.`, `_` y `-`. Los nombres se conservan tal como se escriben: no se recortan ni se convierten a minúsculas. Las tablas aceptan identificadores SQL ASCII sin esquema: `[A-Za-z_]\w*`, por ejemplo `report_jobs`.

### Aislamiento de conexiones persistentes

Dos conexiones `database` con el mismo valor de `connection` deben utilizar tablas diferentes. Dos conexiones Redis con el mismo host, puerto y base de datos deben usar prefijos distintos. Cambiar solo el canal `queue` no convierte esos backends en dos almacenamientos independientes y la configuración lo rechaza.

La comparación Redis incluye `endpoint`, `port`, `db` y `prefix`; la contraseña no crea otro namespace. La comprobación SQL compara los nombres de conexión configurados y las tablas. Si dos nombres SQL apuntan realmente al mismo almacenamiento, debes mantener también la separación física: la validación no descubre alias de infraestructura.

<a id="config-drivers"></a>

## Driver y enumeración

`Drivers` es un `StrEnum` con `SYNC="sync"`, `DATABASE="database"` y `REDIS="redis"`. Cada entidad de conexión valida que su campo `driver` coincida con el que implementa.

Los valores se comparan exactamente: `"REDIS"`, `" redis "` o un driver desconocido no se normalizan a `"redis"`. No existe un mecanismo de configuración nativo para registrar otros drivers por nombre; consulta la [comparación de backends](/es/asynchronous/queues/drivers-and-configuration).

<a id="config-sync"></a>

## Conexión `sync`

| Campo | Tipo | Entorno | Predeterminado | Uso y validación |
|---|---|---|---|---|
| `driver` | `Drivers` o `str`. | Sin variable propia. | `Drivers.SYNC` (`"sync"`). | Debe ser `sync`. |
| `queue` | `str`. | `QUEUE_SYNC_QUEUE`. | `"default"`. | Canal usado si el dispatch no especifica `.onQueue()`. Debe ser un nombre válido. |
| `retry_after` | `float`; también admite `int`. | `QUEUE_SYNC_RETRY_AFTER`. | `90.0`. | Duración positiva y finita de la reserva del intento inmediato; no habilita un reintento persistente. |

Aunque `sync` no almacena pendientes, su reserva se valida contra el timeout igual que las de los drivers persistentes.

<a id="config-database"></a>

## Conexión `database`

| Campo | Tipo | Entorno | Predeterminado | Uso y validación |
|---|---|---|---|---|
| `driver` | `Drivers` o `str`. | Sin variable propia. | `Drivers.DATABASE`. | Debe ser `database`. |
| `connection` | `str` o `None`. | `QUEUE_DB_CONNECTION`. | `None`. | Nombre de una conexión del servicio Database; `None` selecciona su predeterminada. Si es texto, debe ser un nombre válido. |
| `table` | `str`. | `QUEUE_TABLE`. | `"jobs"`. | Nombre lógico de tabla, sin esquema y antes del prefijo SQL. |
| `queue` | `str`. | `QUEUE_DB_QUEUE`. | `"default"`. | Canal lógico predeterminado. |
| `retry_after` | `float` o `int`. | `QUEUE_DB_RETRY_AFTER`. | `90.0`. | Segundos positivos y finitos de propiedad de una reserva. Un job sin confirmación vuelve a ser elegible al vencerla. |

La tabla se crea en la primera operación que necesita el esquema. Su clave primaria debe imponer unicidad; una conexión sin restricciones únicas impuestas es rechazada por el driver. Más información en [persistencia SQL](/es/asynchronous/queues/drivers-and-configuration#driver-database).

<a id="config-redis"></a>

## Conexión `redis`

| Campo | Tipo | Entorno | Predeterminado | Uso y validación |
|---|---|---|---|---|
| `driver` | `Drivers` o `str`. | Sin variable propia. | `Drivers.REDIS`. | Debe ser `redis`. |
| `endpoint` | `str`. | `REDIS_HOST`. | `"127.0.0.1"`. | Host no vacío ni compuesto solo por espacios; se conserva sin recortar. |
| `port` | `int`. | `REDIS_PORT`. | `6379`. | Puerto entre 1 y 65535, ambos incluidos. |
| `db` | `int`. | `REDIS_DB`. | `0`. | Índice de base de datos mayor o igual que cero. |
| `password` | `str` o `None`. | `REDIS_PASSWORD`. | `None`. | Contraseña opcional; la entidad también admite una cadena vacía. |
| `prefix` | `str`. | `QUEUE_REDIS_PREFIX`. | `"orionis:queues"`. | Namespace no vacío. Además, el driver rechaza `{` y `}`. |
| `queue` | `str`. | `QUEUE_REDIS_QUEUE`. | `"default"`. | Canal lógico predeterminado. |
| `retry_after` | `float` o `int`. | `QUEUE_REDIS_RETRY_AFTER`. | `90.0`. | Segundos positivos y finitos de propiedad de una reserva. |

`REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` y `REDIS_PASSWORD` también pueden ser utilizados por otros servicios del proyecto. El prefijo de colas aísla sus claves. Esta entidad no expone `url`, TLS, username, Sentinel ni opciones de Redis Cluster. El cliente Python necesario ya está incluido; el servidor Redis debe existir y ser accesible.

<a id="config-failed"></a>

## Almacenamiento de fallos

| Campo | Tipo | Entorno | Predeterminado | Uso y validación |
|---|---|---|---|---|
| `connection` | `str` o `None`. | `QUEUE_FAILED_DB_CONNECTION`. | `None`. | Conexión SQL para los diagnósticos terminales; `None` utiliza la predeterminada de Database. |
| `table` | `str`. | `QUEUE_FAILED_TABLE`. | `"failed_jobs"`. | Identificador SQL válido sin esquema. Debe ser distinto de la tabla de jobs cuando la conexión configurada coincide. |

`Failed` no tiene un campo `driver`: el repositorio incluido es SQL. Se resuelve de manera perezosa y se comparte entre las conexiones de colas. Utilizar Redis no elimina la necesidad de configurar una conexión SQL para conservar fallos terminales.

La tabla contiene el envelope recuperable y los datos de la excepción. Consulta [fallos y reintentos](/es/asynchronous/queues/failures-and-retries) para inspeccionar, reintentar y eliminar esos registros.

<a id="config-worker"></a>

## Opciones de worker y ejecución

| Campo | Tipo | Entorno | Predeterminado | Efecto y validación |
|---|---|---|---|---|
| `concurrency` | `int`. | `QUEUE_WORKER_CONCURRENCY`. | `1`. | Máximo de jobs concurrentes del worker; entero mayor o igual que uno. `Queue.worker()` puede sustituirlo para una instancia. |
| `sleep` | `float` o `int`. | `QUEUE_WORKER_SLEEP`. | `1.0`. | Pausa de sondeo cuando no hay trabajo, en segundos positivos y finitos. |
| `timeout` | `float` o `int`. | `QUEUE_WORKER_TIMEOUT`. | `60.0`. | Tiempo de ejecución predeterminado por job, positivo y finito. Se captura en el envelope al enviar el job. |
| `tries` | `int`. | `QUEUE_WORKER_TRIES`. | `3`. | Máximo de intentos, contando el primero; entero mayor o igual que uno. Se captura al enviar el job. |
| `backoff` | `tuple[float, ...]` o `list[float]`. | `QUEUE_WORKER_BACKOFF`. | `(0.0,)`. | Secuencia no vacía de esperas entre intentos. Cada número debe ser finito y mayor o igual que cero; se copia a una tupla. |

Las opciones `tries`, `timeout` y `backoff` de `BaseJob` sustituyen estos defaults cuando no son `None`. Por eso, cambiar los defaults no reescribe el presupuesto de ejecución de los envelopes que ya están guardados.

`worker.timeout` debe ser **estrictamente menor** que el `retry_after` de **todas** las conexiones declaradas, incluida `sync`, incluso si no es la predeterminada. Además, el manager comprueba la misma relación con el timeout efectivo de cada job en el momento del envío. Aumenta la reserva si un job necesita un timeout mayor; una reserva no se renueva automáticamente mientras el job trabaja.

Un ejemplo de entorno con tipos válidos:

```dotenv
QUEUE_CONNECTION=database
QUEUE_DB_RETRY_AFTER=120.0
QUEUE_SYNC_RETRY_AFTER=120.0
QUEUE_REDIS_RETRY_AFTER=120.0
QUEUE_WORKER_CONCURRENCY=4
QUEUE_WORKER_SLEEP=0.5
QUEUE_WORKER_TIMEOUT=60.0
QUEUE_WORKER_TRIES=4
QUEUE_WORKER_BACKOFF="(1.0, 5.0, 15.0)"
```

`Env` interpreta números y literales de colección. La secuencia debe convertirse en una lista o tupla real, no en una cadena separada por comas sin sintaxis de colección. Si quedan valores de tipo incorrecto, la configuración no los fuerza: rechaza booleanos como enteros o duraciones, puertos escritos como cadenas y tiempos `NaN` o infinitos.

## Errores de configuración

La construcción de las entidades produce `TypeError` ante tipos o campos no admitidos y `ValueError` ante nombres, rangos, drivers o relaciones inválidos. La validación ocurre antes de iniciar las operaciones del backend.

Por ejemplo, `Worker(timeout=90.0)` es válido por sí solo, pero `Queue(worker=Worker(timeout=90.0))` se rechaza con las conexiones predeterminadas, cuyas reservas duran 90 segundos. Una conexión nombrada no declarada, un nombre de cola incorrecto o un delay inválido durante el uso de la API producen `QueueConfigurationError`.

La validación estática no prueba credenciales, accesibilidad del servidor ni permisos SQL. Esos problemas aparecen al realizar la operación correspondiente. La [guía de drivers](/es/asynchronous/queues/drivers-and-configuration) detalla qué recursos se crean y cuándo, y la [referencia de API](/es/asynchronous/queues/api-reference) recoge los contratos públicos.
