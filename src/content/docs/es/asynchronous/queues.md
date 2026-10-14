---
title: "Colas y jobs"
description: "Usa una cola cuando tu aplicación deba registrar trabajo ahora y ejecutarlo mediante un proceso consumidor separado, por ejemplo para preparar un reporte. Un job transporta…"
editUrl: true
lastUpdated: false
---

Usa una cola cuando tu aplicación deba registrar trabajo ahora y ejecutarlo mediante un proceso consumidor separado, por ejemplo para preparar un reporte. Un job transporta datos serializables; su `handle()` async se ejecuta con los servicios de la aplicación disponibles.

## Completar la primera tarea en cola

### 1. Elegir almacenamiento persistente

El driver `sync`, predeterminado, ejecuta durante `await Queue.dispatch(...)`. Para usar un consumidor separado, configura el `.env` de tu aplicación antes del arranque:

```dotenv
QUEUE_CONNECTION=database
DB_CONNECTION=sqlite
```

Revisa la ubicación de SQLite y sus permisos en `config/database.py`. El driver crea `jobs` y `failed_jobs` cuando se necesitan, por lo que requiere permisos para crear tablas. Redis es una alternativa, pero su repositorio de fallos también necesita SQL. Consulta la [configuración de drivers](/es/asynchronous/queues/drivers-and-configuration).

### 2. Añadir un job importable

Guarda esta clase en `app/jobs/write_report.py`. Manténla a nivel de módulo para que el productor y el consumidor puedan descubrir la misma clase:

```python
from uuid import UUID
from orionis.queues import BaseJob
from orionis.storage.contracts.manager import IStorageManager


class WriteReport(BaseJob):
    __slots__ = ("report_id", "text")
    report_id: str
    text: str
    tries = 3
    timeout = 30.0

    def __init__(self, report_id: str, text: str) -> None:
        self.report_id = str(UUID(report_id))
        self.text = text

    async def handle(self, storage: IStorageManager) -> None:
        await storage.disk("local").put(
            f"reports/{self.report_id}.txt", self.text, visibility="private",
        )
```

El consumidor inyecta `IStorageManager` en `handle()`. El job escribe en el disco `local` configurado, que debe ser escribible. Repetirlo con el mismo `report_id` reemplaza el mismo archivo con el mismo contenido; el ejemplo evita deliberadamente crear otro reporte al reintentar. Guarda documentos grandes en storage en lugar de superar el límite de 1 MiB de la carga de la cola.

### 3. Enviar desde la aplicación

Usa esta función en un controlador o comando async después del arranque:

```python
from uuid import uuid4
from app.jobs.write_report import WriteReport
from orionis.support.facades import Queue


async def request_report() -> dict[str, str]:
    report_id = str(uuid4())
    job_id = await Queue.dispatch(WriteReport(report_id, "Report ready"))
    return {"job_id": job_id, "report_id": report_id}
```

Llama `await request_report()` desde ese flujo de aplicación. El resultado contiene la identidad del job y la del reporte. Un envío correcto indica que se presentó el mensaje; el reporte todavía puede estar pendiente. `await` es obligatorio: construir y descartar un `PendingDispatch` no envía nada.

### 4. Arrancar el consumidor

En otra terminal situada en la misma raíz de aplicación, con el mismo código y configuración:

```shell
uv run python -B reactor queue:work database --queue default
```

El proceso consume el job y escribe `storage/app/private/reports/<report_id>.txt` con la configuración local predeterminada. Déjalo activo para los siguientes mensajes y detenlo con la señal habitual de interrupción. En producción, configura supervisión de procesos y revisa los [fallos](/es/asynchronous/queues/workers-and-failures).

## Continuar con las guías completas

1. [Escribir y enviar jobs](/es/asynchronous/queues/jobs-and-dispatch): dependencias tipadas, datos permitidos, destinos y ejecución diferida.
2. [Elegir y configurar un backend](/es/asynchronous/queues/drivers-and-configuration): almacenamiento, separación por entorno, transacciones SQL y requisitos Redis.
3. [Workers, reintentos y fallos](/es/asynchronous/queues/workers-and-failures): reservas, tiempos límite, recuperación y decisiones de reintento.

La persistencia del mensaje no garantiza que un efecto externo ocurra exactamente una vez. Diseña cada operación de negocio para poder repetirse. Python 3.14+ y las dependencias Python de colas forman parte de la instalación normal; el servidor Redis solo se necesita al elegir ese driver.
