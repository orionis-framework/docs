---
title: "Tareas después de la respuesta"
description: "Adjunta una tarea breve a una respuesta HTTP y decide cuándo enviarla a una cola persistente."
editUrl: true
lastUpdated: false
---

Una tarea de background pertenece al mismo proceso y se ejecuta después de entregar la respuesta. Úsala para efectos secundarios cortos cuya pérdida sea aceptable; el módulo queues cubre los flujos que necesitan persistencia y reintentos.

## Devolver una respuesta con una acción breve posterior

Usa esta función que construye respuestas desde un controlador de la aplicación iniciada. El registro se escribe después de entregar la respuesta:

```python
from orionis.background import BackgroundTask
from orionis.http.responses import Response
from orionis.support.facades import Log


def record_delivery(message_id: int) -> None:
    Log.info(f"event=response-delivered message={message_id}")


async def acknowledge(message_id: int) -> Response:
    return Response(
        {"message_id": message_id},
        background=BackgroundTask(record_delivery, message_id),
    )
```

Invoca y devuelve `await acknowledge(message_id)` desde el flujo del controlador. Construir la respuesta no ejecuta por sí solo la tarea: lo hace el adaptador HTTP activo. La tarea sigue ocupando el proceso que sirve la solicitud, y un reinicio o fallo de entrega puede impedir su ejecución. Usa una [cola persistente](/es/queues) para notificaciones o procesamiento que deban sobrevivir a esos eventos.

## Recorrido

1. [Ejecutar acciones después de responder](/es/queues/background-tasks/response-tasks): requisitos, uso progresivo, configuración, integración, errores y referencia pública.

`BackgroundTask` no tiene proveedor ni configuración propios. Ejecuta la tarea con `await` en un bucle de eventos activo. Una aplicación iniciada proporciona el registro de ejecuciones y fallos.

Relacionados: [http](/es/http) · [queues](/es/queues) · [logging](/es/logging)
