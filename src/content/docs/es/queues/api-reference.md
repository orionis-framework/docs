---
title: "Referencia técnica de colas"
description: "Contratos, métodos de drivers, utilidades públicas y excepciones del sistema de colas."
editUrl: true
lastUpdated: false
---

Esta referencia complementa las guías de uso. Para enviar trabajo utiliza la [fachada o `IQueueManager`](/es/queues/manager-and-injection); los drivers son la interfaz de almacenamiento sobre la que opera el worker.

<a id="contracts"></a>

## Mapa de contratos

| Contrato | Implementación y referencia |
| --- | --- |
| `IQueueManager` | `QueueManager`: [todos sus métodos](/es/queues/manager-and-injection#manager-construction), incluido [`migrate()`](/es/queues/manager-and-injection#manager-migrate) para preparar el almacenamiento SQL. |
| `IJob` | `BaseJob`: [`handle()`](/es/queues/jobs-and-dispatch#job-handle). |
| `IJobSerializer` | `JobSerializer`: [registro, estado y envelopes](/es/queues/jobs-and-dispatch#serializer). |
| `IQueueDriver` | `SyncQueueDriver`, `DatabaseQueueDriver`, `RedisQueueDriver`: API de esta página. |
| `IWorker` | `Worker`: [`run()`, `stop()` y `execute()`](/es/queues/workers#worker-construction). |
| `IFailedJobRepository` | `DatabaseFailedJobRepository`: [registro, consulta y borrado](/es/queues/failures-and-retries#failed-repository). |

Los contratos están en `orionis.queues.contracts`, en los módulos `manager`, `job`, `serializer`, `driver`, `worker` y `failed_repository`, respectivamente. Las firmas de las guías corresponden a las implementaciones. El contrato del manager anota `worker()` con `IWorker`; el concreto devuelve `Worker`. El repositorio tiene diferencias de nombre y anotación que se detallan [en su referencia](/es/queues/failures-and-retries#failed-repository).

<a id="driver-construction"></a>

## Construcción de drivers

```text
SyncQueueDriver(
    app: IApplication,
    serializer: IJobSerializer,
    connection: str,
    failed_resolver: FailedResolver,
    retry_after: float = 90.0,
) -> None

DatabaseQueueDriver(connection: IConnection, table: str = "jobs") -> None

RedisQueueDriver(
    config: RedisConfig | None = None,
    *,
    client: Redis | None = None,
) -> None
```

Estas son firmas de referencia, no instrucciones de construcción para copiar como una llamada. Importa las clases desde `orionis.queues.drivers.sync`, `.database` o `.redis`. `RedisConfig` es `orionis.foundation.config.queue.Redis` y `Redis` es el cliente `redis.asyncio.Redis`. El administrador construye cada driver por ti a partir de [la configuración](/es/queues/configuration).

`SyncQueueDriver` necesita el contenedor, el serializador, el nombre de conexión y un resolver async de fallos. Database necesita una conexión SQL compartida con soporte de restricciones únicas; valida el nombre lógico de tabla y crea su esquema al necesitarlo. Redis acepta una configuración o usa sus valores predeterminados; si recibe `client`, no es propietario del cliente y no lo cierra. Un nombre lógico de tabla inválido produce `QueueConfigurationError`. Database sin restricciones únicas y Redis con un tipo de configuración o namespace inválidos producen `QueueStorageError`; las entidades de configuración también pueden lanzar `TypeError` o `ValueError`.

Las variantes difieren en durabilidad y reservas: consulta [`sync`](/es/queues/drivers-and-configuration#driver-sync), [Database](/es/queues/drivers-and-configuration#driver-database) y [Redis](/es/queues/drivers-and-configuration#driver-redis).

<a id="driver-push"></a>

## Guardar: push()

```python
async def push(self, envelope: JobEnvelope, delay: float = 0) -> str: ...
```

El valor predeterminado de `delay` es `0.0` en Sync y `0` en el contrato, Database y Redis. Acepta segundos finitos no negativos. Guarda el envelope y devuelve su ID; los backends persistentes inician `attempts` en cero. No sustituye el registro y la validación que realiza el administrador antes de enviar.

En Sync, ejecuta y espera un único intento; una demora distinta de cero produce `QueueDispatchError`. Los errores de `handle()` pueden propagarse. Database y Redis serializan el envelope y almacenan su disponibilidad; Redis traduce errores de su cliente a `QueueStorageError`. Database puede propagar excepciones de su conexión SQL. Un ID repetido puede ser rechazado según el almacenamiento; no uses `push()` como una API de deduplicación de negocio.

Para construir envelopes válidos consulta [`JobEnvelope`](/es/queues/jobs-and-dispatch#job-envelope). En código habitual utiliza `await Queue.dispatch(job)`.

<a id="driver-reserve"></a>

## Reservar: reserve()

```python
async def reserve(
    self, queues: tuple[str, ...], retry_after: float,
) -> ReservedJob | None: ...
```

Examina canales en orden de prioridad y devuelve una reserva del primer mensaje elegible, o `None`. `retry_after` es el plazo positivo en segundos para retenerla. Database utiliza una actualización condicional y Redis scripts Lua; la reserva incluye un token nuevo y aumenta `attempts`. Mensajes demorados o con una reserva vigente no son elegibles. Sync siempre devuelve `None`.

Database rechaza reservar dentro de una transacción activa de la conexión en el contexto actual: necesita publicar inmediatamente la reserva. No mantiene un bloqueo SQL durante todo `handle()`. No existe renovación automática del plazo. La [reserva](/es/queues/workers#reserved-job) describe todos sus campos y el [worker](/es/queues/workers) administra su ejecución.

<a id="driver-release"></a>

## Liberar: release()

```python
async def release(self, reserved: ReservedJob, delay: float = 0) -> bool: ...
```

Sync declara `delay=0.0`; el contrato y los drivers persistentes, `delay=0`. Una liberación conserva el mensaje y los intentos, elimina la reserva y establece una nueva disponibilidad. Devuelve `True` únicamente si el token aún pertenece a una reserva vigente; un token antiguo o plazo vencido devuelve `False`. Los segundos deben ser finitos y no negativos. Sync lanza `QueueDispatchError` porque no puede devolver un mensaje a una cola persistente.

Desde un job utiliza [`JobContext.release()`](/es/queues/failures-and-retries#job-context-release), que actualiza también el estado del intento; hacerlo directamente sobre el driver no marca el contexto como finalizado.

<a id="driver-delete"></a>

## Confirmar: delete()

```python
async def delete(self, reserved: ReservedJob) -> bool: ...
```

Database y Redis eliminan únicamente el mensaje cuya reserva sigue vigente y coincide con el token. Devuelven `False` si el job fue recuperado por otro consumidor, borrado o venció. Sync devuelve `True`. No revierte un efecto externo que ya haya ocurrido en `handle()`.

En ejecución normal el worker confirma automáticamente un job correcto. Dentro de `handle()` utiliza [`JobContext.delete()`](/es/queues/failures-and-retries#job-context-delete) para mantener coordinado su estado.

<a id="driver-size"></a>

## Contar: size()

```python
async def size(self, queue: str) -> int: ...
```

Cuenta todos los mensajes del canal, incluidos demorados y reservados. Database crea el esquema si hace falta y consulta la tabla; Redis cuenta el hash de payloads. No es una consulta únicamente de mensajes listos ni garantiza un valor estable mientras otros procesos trabajan. Sync devuelve cero.

```python
from orionis.support.facades import Queue


async def queue_size() -> int:
    driver = await Queue.connection("database")
    return await driver.size("records")
```

<a id="driver-clear"></a>

## Vaciar: clear()

```python
async def clear(self, queue: str) -> int: ...
```

Elimina todos los mensajes del canal y devuelve su número: listos, demorados y **también reservas activas**. No detiene el código que ya se está ejecutando; ese consumidor puede terminar un efecto externo y fallar después al confirmar. No elimina los registros del repositorio de fallos. Sync devuelve cero.

```python
from orionis.support.facades import Queue


async def clear_stopped_queue() -> int:
    # Ejecutar cuando los consumidores de este canal estén detenidos.
    driver = await Queue.connection("database")
    return await driver.clear("records")
```

Los nombres de canal deben ser válidos. En Redis las operaciones de modificación utilizan scripts y traducen fallos de almacenamiento; en Database pueden propagarse los errores SQL. El [comando `queue:clear`](/es/queues/workers#command-clear) permite hacer esta operación desde consola.

<a id="driver-close"></a>

## Cerrar: close()

```python
async def close(self) -> None: ...
```

Sync solicita la parada de su worker interno. Database reinicia su indicador de esquema preparado, conservando la conexión SQL compartida. Redis cierra su cliente únicamente si lo creó el propio driver. Ninguno elimina mensajes como parte del cierre. Normalmente el administrador realiza esta operación al apagarse la aplicación.

<a id="eligible-clauses"></a>

## Predicados de elegibilidad SQL

```python
def eligible_clauses(queue: str, now: float) -> list[WhereClause]: ...
```

Esta función de `orionis.queues.drivers.database` construye los filtros para el canal, `available_at <= now` y reserva ausente o vencida. Devuelve objetos de planificación del ORM; no ejecuta SQL, no adquiere una reserva ni valida por sí sola los argumentos. Es una utilidad para construir el plan que utiliza Database, no un filtro que debas agregar a tus tablas de negocio.

```python
from orionis.queues.drivers.database import eligible_clauses
from orionis.queues.functions import current_time


def inspect_eligibility() -> int:
    clauses = eligible_clauses("records", current_time())
    return len(clauses)
```

## Esquemas y entidades

Las funciones públicas [`validate_table_name()`, `build_jobs_table()` y `build_failed_jobs_table()`](/es/queues/drivers-and-configuration#schema-functions) exponen la validación y los esquemas utilizados por los repositorios. Consulta sus columnas, índices y firmas en esa guía.

Los contratos de datos son [`JobEnvelope`](/es/queues/jobs-and-dispatch#job-envelope), [`ReservedJob`](/es/queues/workers#reserved-job) y [`FailedJob`](/es/queues/failures-and-retries#failed-job). No intercambies el ID de un fallo con el ID de su job ni construyas una reserva inventando un token.

<a id="helper-validate-name"></a>

## Validar nombres

```python
def validate_name(value: str, label: str) -> str: ...
```

De `orionis.queues.functions`. Acepta un nombre ASCII de 1 a 128 caracteres, que empieza por letra o dígito y continúa con letras, dígitos, `_`, `.` o `-`. Conserva mayúsculas y no recorta espacios. `label` identifica el campo en el error; un valor inválido produce `QueueConfigurationError`.

```python
from orionis.queues.functions import validate_name

channel = validate_name("reports.email", "queue")
```

<a id="helper-validate-seconds"></a>

## Validar segundos

```python
def validate_seconds(value: float, label: str, *, positive: bool = False) -> float: ...
```

Acepta `int` o `float` finitos, excluye `bool` y devuelve `float`. Por defecto permite cero; con `positive=True` exige un valor mayor que cero. No acepta cadenas numéricas. Los valores inválidos producen `QueueConfigurationError`.

```python
from orionis.queues.functions import validate_seconds

delay = validate_seconds(5, "delay")
lease = validate_seconds(90.0, "retry_after", positive=True)
```

<a id="helper-current-time"></a>

## Obtener tiempo epoch

```python
def current_time() -> float: ...
```

Utiliza `DateTime.now().timestamp()` de la aplicación y devuelve segundos epoch. Se usa para disponibilidad, vencimientos y políticas de reintento; no es un reloj monotónico ni una duración. Ejecútalo con los servicios del framework inicializados.

```python
from orionis.queues.functions import current_time


def retry_deadline() -> float:
    return current_time() + 300.0
```

<a id="queue-types"></a>

## Tipos de callbacks

| Alias público | Firma y función |
| --- | --- |
| `orionis.queues.types.DispatchCallback` | `Callable[[BaseJob, str \| None, str \| None, float], Awaitable[str]]`: job, conexión, canal y demora; usado por `PendingDispatch`. |
| `orionis.queues.context.FailureCallback` | `Callable[[ReservedJob, Exception], Awaitable[bool]]`: registra el fallo y finaliza una reserva. |
| `orionis.queues.worker.FailedResolver` | `Callable[[], Awaitable[IFailedJobRepository]]`: obtiene el repositorio de fallos cuando se necesita. |

El administrador y el worker construyen estos callbacks en el uso normal. Si construyes `PendingDispatch`, `JobContext` o un driver manualmente, respeta tanto la firma como el significado de su resultado; un callback que devuelve `True` sin guardar el fallo y finalizar la reserva rompe el contrato del worker.

<a id="exceptions"></a>

## Excepciones públicas

Todas se importan de `orionis.queues.exceptions` y derivan de `QueueError`, que extiende `RuntimeError`:

| Excepción | Cuándo es relevante |
| --- | --- |
| `QueueError` | Captura común de errores propios del subsistema. |
| `QueueConfigurationError` | Destino, nombres, tiempos o configuración de runtime inválidos. |
| `QueuePayloadError` | Estado o envelope inválido, tipo no permitido o tamaño excesivo. |
| `UnknownJobError` | Identidad no registrada; extiende `QueuePayloadError`. |
| `QueueStorageError` | Fallos de operaciones de almacenamiento que el driver envuelve. |
| `QueueLeaseError` | El contexto ya finalizó o no puede completar una transición con una reserva válida. |
| `QueueDispatchError` | Operación pendiente ya iniciada o función incompatible con Sync. |
| `QueueRetryError` | Reintento manual inválido o política/plazo que impide continuar. |

No todos los errores externos se convierten a `QueueError`: también pueden propagarse excepciones SQL, de validación y del propio job. El [flujo de excepciones y reintentos](/es/queues/failures-and-retries) distingue estos casos.

<a id="provider"></a>

## Proveedor nativo

```python
def register(self) -> None: ...
async def boot(self) -> None: ...
```

Estos métodos de `orionis.queues.provider.QueueProvider` registran `IQueueManager` y `IJobSerializer` como singletons. Durante `boot()` descubre jobs, registra el cierre del manager en `Lifespan.SHUTDOWN` y fija la fachada. Un módulo de job inválido puede impedir el arranque; no se oculta para dejar que el consumidor intente importar código arbitrario del mensaje.

<a id="facade-accessor"></a>

## Accesor de la fachada

```python
@classmethod
def getFacadeAccessor(cls) -> type[IQueueManager]: ...
```

`Queue.getFacadeAccessor()` devuelve `IQueueManager`. Es el enlace entre la fachada y el contenedor; para enviar utiliza los métodos del servicio. Importa `Queue` desde `orionis.support.facades`.
