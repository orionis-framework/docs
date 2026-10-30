---
title: "Concurrencia limitada"
description: "Ejecuta callbacks bloqueantes con threaded y BoundedExecutor, conserva la inyección y controla saturación, cancelación y cierre."
editUrl: true
lastUpdated: false
---

Desde **1.1.0**, `orionis.support.concurrency` ofrece ejecución en hilos con capacidad limitada para I/O síncrono. Estas utilidades funcionan sin contenedor; la inyección de dependencias está disponible cuando Orionis invoca el callable decorado.

```python
from orionis.support.concurrency import (
    BoundedExecutor,
    WorkQueueFullError,
    complete_on_cancel,
    threaded,
)
```

## Decorar un callable bloqueante

`@threaded` convierte un callable síncrono en un wrapper esperable con `await`. Conserva su firma original para la inyección y copia las variables de contexto al hilo worker. Los handlers síncronos habituales conservan su ejecución existente cuando no se decoran.

```python
from pathlib import Path

from orionis.support.concurrency import threaded


@threaded
def read_report(path: Path) -> str:
    return path.read_text(encoding="utf-8")


async def load_report(path: Path) -> str:
    return await read_report(path)
```

Pasa un archivo existente y legible a `load_report()`. En una aplicación arrancada, `await app.invoke(read_report, path=path)` también utiliza la firma conservada. Las dependencias se resuelven antes de ejecutar en el worker, por lo que los objetos recibidos deben admitir el uso desde ese hilo. No accedas a recursos ligados al event loop desde el callback síncrono.

Decorar un `async def` produce `TypeError`. El trabajo de CPU en Python sigue compitiendo por el GIL en un intérprete estándar. Un pool de hilos sirve para I/O bloqueante; no sustituye el aislamiento en procesos para trabajo intensivo de CPU.

## Administrar un límite de workers

```text
BoundedExecutor(max_workers: int = 4, *, max_pending: int = 32,
                name: str = "orionis-worker")
async run(callback, /, *args, **kwargs) -> resultado del callback
close() -> None
async aclose() -> None
```

La construcción es diferida: los hilos se crean cuando son necesarios. `max_workers` debe ser un entero positivo y `max_pending` un entero no negativo; los booleanos no son válidos. La capacidad pertenece a la instancia del ejecutor, incluidos consumidores desde distintos event loops del mismo proceso.

```python
from pathlib import Path

from orionis.support.concurrency import BoundedExecutor


async def read_with_budget(path: Path) -> bytes:
    pool = BoundedExecutor(2, max_pending=8, name="report-io")
    try:
        return await pool.run(path.read_bytes)
    finally:
        await pool.aclose()
```

Para un servicio con muchas llamadas, conserva un pool durante su ciclo de vida en lugar de crear uno por petición. `run()` recibe un callback síncrono y retorna su resultado; propaga las excepciones del callback. Si se ocupan todas las plazas activas y pendientes, produce `WorkQueueFullError` inmediatamente, sin esperar espacio. Define explícitamente la respuesta de la aplicación ante saturación.

Usa `await aclose()` en código async. `close()` bloquea hasta que termine el trabajo en ejecución y cancela el que todavía no comenzó; `aclose()` realiza ese cierre fuera del event loop de la aplicación. Las nuevas solicitudes fallan después del cierre. El consumidor es responsable de cerrar los ejecutores personalizados durante el apagado.

## Cancelación y propiedad de recursos

Cancelar trabajo pendiente impide que comience. Cancelar trabajo nativo en ejecución espera su finalización antes de liberar la plaza y propagar la cancelación. Solicitar cancelación no demuestra que una escritura, transacción SMTP u otro efecto externo no ocurrió. Configura timeouts finitos en el cliente de I/O.

`await complete_on_cancel(awaitable, on_cancel=None)` aplica esta espera antes de propagar la cancelación a un awaitable cuyo ciclo de vida controlas. El callback síncrono opcional puede solicitar que se cancele trabajo aún no iniciado. Es una herramienta de limpieza, no un timeout ni un planificador de tareas; no detiene hilos nativos por la fuerza.

<a id="framework-worker-budgets"></a>

## Límites de workers del framework

Estos valores predeterminados se comparten **por proceso**, no entre todos los workers del servidor:

| Trabajo | Workers activos | Llamadas pendientes adicionales | Admisión |
| --- | --- | --- | --- |
| Callbacks con `@threaded` | 4 | 32 | `WorkQueueFullError` al llenarse. |
| Argon2 y bcrypt combinados | 2 | 14 | [Límite compartido de hashing](/es/cryptography/hashing/password-storage#hashing-worker-budget); admite ejecutores propios. |
| Carga superior de plantillas y warmup | 2 | 64 | [Pool de plantillas](/es/views/configuration-and-cache#view-warmup) compartido. |
| Lotes SMTP con `sendMany()` | 4 | 16 | [Pool de lotes](/es/mail/transports-and-extensions#smtp-batches) compartido; hasta 100 mensajes preparados por lote. |

El `send()` individual de SMTP conserva su ejecutor habitual. Logging utiliza un listener independiente por handler con [`queue_capacity`](/es/logging/configuration#logging-queue-capacity), no uno de estos límites. El número de workers no limita la memoria retenida por argumentos, resultados, buffers del SDK o código de la aplicación. Multiplica cada límite por el número de procesos desplegados al dimensionar el host.
