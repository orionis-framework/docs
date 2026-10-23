---
title: "Fachada e inyección de Queue"
description: "API completa del administrador de colas, fachada Queue, inyección de dependencias y ciclo de vida."
editUrl: true
lastUpdated: false
---

<a id="facade"></a>

## Un servicio, dos formas de acceso

Importa la fachada desde el módulo público:

```python
from app.jobs.process_record_job import ProcessRecordJob
from orionis.support.facades import Queue


async def submit_record(record_id: int) -> str:
    return await Queue.dispatch(ProcessRecordJob(record_id))
```

`Queue` delega en el singleton `IQueueManager`. El proveedor nativo lo registra junto con `IJobSerializer`, descubre las clases de jobs en `app/jobs` durante el arranque y fija la fachada antes de utilizarla. No necesitas registrar otro proveedor para el uso habitual. Este arranque no inicia workers ni abre todas las conexiones: cada driver y el repositorio de fallos se resuelven cuando se solicitan.

Los ejemplos se ejecutan dentro de un controlador, comando u otro componente async de una aplicación arrancada. `dispatch()` construye un objeto pendiente; **el envío ocurre al esperarlo con `await`**. Consulta [el job del ejemplo](/es/queues).

## Inyección por constructor y por método

Para un servicio utilizado por varias acciones, recibe `IQueueManager` por constructor. Por ejemplo, guarda esta clase en `app/http/controllers/record_controller.py`:

```python
from app.jobs.process_record_job import ProcessRecordJob
from orionis.http import JSONResponse
from orionis.queues.contracts.manager import IQueueManager


class RecordController:
    def __init__(self, queue: IQueueManager) -> None:
        self.queue = queue

    async def store(self, record_id: int) -> JSONResponse:
        job_id = await self.queue.dispatch(ProcessRecordJob(record_id))
        return JSONResponse({"job_id": job_id}, status_code=202)
```

También puedes solicitarlo únicamente en la acción que lo necesita:

```python
from app.jobs.process_record_job import ProcessRecordJob
from orionis.http import JSONResponse
from orionis.queues.contracts.manager import IQueueManager


class RecordController:
    async def store(
        self, record_id: int, queue: IQueueManager,
    ) -> JSONResponse:
        job_id = await queue.dispatch(ProcessRecordJob(record_id))
        return JSONResponse({"job_id": job_id}, status_code=202)
```

En ambos casos registra la acción con un parámetro de ruta del mismo nombre:

```python
from app.http.controllers.record_controller import RecordController
from orionis.support.facades import Route

Route.post("/records/{record_id:int}/process", [RecordController, "store"])
```

El contenedor resuelve el contrato anotado; el router proporciona `record_id`. El código de respuesta `202` del ejemplo expresa que aceptaste el trabajo. Para ejecutarlo posteriormente debes seleccionar un driver persistente: con `sync`, la acción espera a que termine el job antes de devolver esa respuesta.

La misma inyección de servicio funciona en componentes invocados por el contenedor, incluidos comandos y métodos `handle()` de jobs. **El constructor de un job recuperado no recibe dependencias**: se reconstruye desde su estado serializado sin ejecutar `__init__`. Inyecta sus servicios en `handle()`; véase [datos e inyección del job](/es/queues/jobs-and-dispatch).

<a id="manager-construction"></a>

## Construcción del administrador

```text
QueueManager(app: IApplication, serializer: IJobSerializer) -> None
```

La implementación es `orionis.queues.manager.QueueManager`. Su constructor obtiene `app.config("queue")` como diccionario, lo valida mediante la entidad de configuración y conserva el serializador. No abre SQL ni Redis. Los campos desconocidos y tipos incorrectos pueden producir `TypeError`; las relaciones o valores inválidos, `ValueError`. En la aplicación normal utiliza la fachada o el contrato en lugar de construir otro administrador.

<a id="manager-boot"></a>

## Descubrir jobs: boot()

```python
async def boot(self) -> None: ...
```

Importa los módulos de la ruta de aplicación `app_jobs`, identifica clases concretas de `BaseJob` definidas en esos módulos y las registra en el serializador. La ruta debe ser un `Path`; un error de importación se presenta como `QueueConfigurationError`. Las clases también deben cumplir las restricciones del serializador. El productor registra la clase al enviarla, pero un consumidor separado necesita descubrirla o registrarla en su propio proceso.

El proveedor llama a este método automáticamente. Para una aplicación que administra explícitamente su arranque:

```python
from orionis.queues.manager import QueueManager


async def discover_jobs(manager: QueueManager) -> None:
    await manager.boot()
```

No vuelve a leer la configuración ni arranca consumidores. Evita importar módulos de jobs con efectos secundarios: el descubrimiento los importa durante el inicio de cada proceso.

<a id="manager-dispatch"></a>

## Preparar y enviar: dispatch()

```python
def dispatch(self, job: BaseJob) -> PendingDispatch: ...
```

Recibe una **instancia** de `BaseJob`; pasar una clase u otro objeto produce `QueueConfigurationError`. Devuelve una operación configurable sin E/S. Al esperarla, registra y serializa la clase, aplica la política del job o los valores del worker y envía el envelope al driver. El resultado es un `str` con el ID del job.

```python
from app.jobs.process_record_job import ProcessRecordJob
from orionis.support.facades import Queue


async def enqueue_record(record_id: int) -> str:
    return await (
        Queue.dispatch(ProcessRecordJob(record_id))
        .onConnection("database")
        .onQueue("records")
        .delay(5.0)
    )
```

`onConnection()` selecciona una conexión configurada, `onQueue()` un canal lógico y `delay()` los segundos antes de estar disponible. El driver `sync` rechaza una demora distinta de cero. Los errores de configuración, serialización o almacenamiento se producen al preparar o esperar la operación, según la validación. Con `sync` también puede propagarse la excepción de `handle()`; con un driver persistente se gestiona después en el worker.

<a id="manager-connection"></a>

## Obtener un driver: connection()

```python
async def connection(self, name: str | None = None) -> IQueueDriver: ...
```

`None` selecciona `queue.default`; una cadena vacía es inválida. Los nombres válidos tienen entre 1 y 128 caracteres ASCII: comienzan con letra o dígito y continúan con letras, dígitos, `_`, `.` o `-`. Una conexión inexistente produce `QueueConfigurationError`. La creación está protegida por un lock async y el driver se reutiliza dentro del administrador.

```python
from orionis.support.facades import Queue


async def pending_records() -> int:
    driver = await Queue.connection("database")
    return await driver.size("records")
```

`size()` incluye mensajes listos, demorados y reservados; no cuenta únicamente los que un worker puede tomar ahora. `clear()` elimina todos esos estados y debe usarse con la [semántica de cada driver](/es/queues/api-reference#driver-clear). No existe un método nativo `extend()` para registrar drivers adicionales.

<a id="manager-worker"></a>

## Crear un worker: worker()

```python
async def worker(
    self,
    connection: str | None = None,
    queues: tuple[str, ...] | None = None,
    concurrency: int | None = None,
) -> Worker: ...
```

En `IQueueManager`, el retorno está anotado como `IWorker`; la implementación devuelve `Worker`. Los argumentos `None` usan, respectivamente, la conexión predeterminada, su canal configurado y `queue.worker.concurrency`. `queues` debe ser una tupla no vacía de nombres válidos, en orden de prioridad; `concurrency`, un entero positivo distinto de `bool`. `sync` no admite workers de consumo.

```python
from orionis.queues.contracts.manager import IQueueManager


async def process_batch(queue: IQueueManager) -> int:
    worker = await queue.worker(
        connection="database", queues=("urgent", "records"), concurrency=2,
    )
    return await worker.run(stop_when_empty=True, max_jobs=100)
```

Crear el worker no lo ejecuta. `run()` devuelve el número de reservas procesadas, incluidos intentos fallidos o liberados; no certifica el éxito de negocio. La configuración inválida puede producir `QueueConfigurationError` o los errores de validación de `WorkerOptions`. Consulta [workers y sus límites](/es/queues/workers).

<a id="manager-failed"></a>

## Obtener los fallos: failed()

```python
async def failed(self) -> IFailedJobRepository: ...
```

Resuelve y conserva el repositorio SQL definido por `queue.failed`. Puede utilizar una conexión de base de datos diferente de la de los mensajes. También se necesita cuando el backend principal es Redis o `sync`. La resolución no convierte un fallo de SQL en un registro en memoria.

```python
from orionis.support.facades import Queue


async def inspect_failures() -> tuple[tuple[str, str], ...]:
    repository = await Queue.failed()
    failures = await repository.all()
    return tuple((item.id, item.exception_message) for item in failures)
```

El ID del registro fallido y el del job son diferentes. El [repositorio de fallos](/es/queues/failures-and-retries#failed-repository) documenta los métodos de consulta y eliminación, sus errores y los datos del traceback.

<a id="manager-retryfailed"></a>

## Reencolar un fallo: retryFailed()

```python
async def retryFailed(self, failed_id: str) -> str: ...
```

Busca el registro, decodifica su envelope, comprueba `retry_until`, envía a la conexión y canal originales y, después, elimina el fallo. Devuelve el ID del job reencolado, conservando el mismo envelope, política e ID; el backend reinicia sus intentos. Un registro inexistente o un plazo vencido produce `QueueRetryError`; una carga inválida o un fallo del backend también puede impedirlo.

```python
from orionis.support.facades import Queue


async def retry_failure(failed_id: str) -> str:
    return await Queue.retryFailed(failed_id)
```

El envío y el borrado del fallo no forman una transacción común. Si el envío funciona y el borrado falla, el job ya puede estar en cola aunque el registro siga visible. Conserva operaciones de negocio repetibles y revisa el estado antes de volver a reintentar manualmente.

<a id="manager-close"></a>

## Liberar recursos: close()

```python
async def close(self) -> None: ...
```

Espera secuencialmente el cierre de los drivers creados y del repositorio de fallos, vaciando sus referencias. Cierra los clientes Redis que pertenecen al driver; no destruye conexiones SQL compartidas. Si un cierre lanza una excepción, se interrumpe la secuencia: no garantiza continuar con los siguientes recursos.

El proveedor registra `close()` en el apagado de la aplicación. **No lo llames al terminar cada petición**. Tampoco detiene ni espera automáticamente todos los workers creados: solicita su parada y espera su tarea antes de cerrar servicios que aún utiliza `handle()`.

```python
from orionis.queues.manager import QueueManager


async def close_owned_manager(manager: QueueManager) -> None:
    # Solo para un administrador cuyo ciclo de vida controla este componente.
    await manager.close()
```
