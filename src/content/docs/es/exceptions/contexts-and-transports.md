---
title: "Excepciones por contexto y transporte"
description: "Distingue la captura HTTP y CLI de los errores de protocolo en WebSocket, Realtime y MCP, y del tratamiento de tareas y jobs."
editUrl: true
lastUpdated: false
---

## Fronteras del runtime

Orionis observa fallos después del inicio exitoso del runtime correspondiente y durante su cierre. `create()` y el registro de proveedores no representan esa frontera. El handler se prepara antes de la activación, fuera de scopes de request y operación.

| Runtime | Activación |
| --- | --- |
| ASGI con lifespan | Terminan los callbacks de startup y la inicialización del kernel; después se envía correctamente `lifespan.startup.complete`. |
| HTTP sin lifespan | Terminan la inicialización perezosa del kernel, sus metadatos y la preparación del handler antes del primer despacho. Esta ruta no ejecuta los hooks de lifespan omitidos. |
| RSGI | `__rsgi_init__` completa el startup antes de servir solicitudes. |
| CLI | Terminan la inicialización del kernel y los callbacks de startup antes del comando. Los comandos concurrentes mantienen tokens de propiedad separados. |
| Headless y workers directos | Termina `await app.boot()`; el propietario abre una `operation(...)` explícita alrededor del trabajo supervisado y finalmente llama a `await app.aclose()`. |

Los fallos de construcción, configuración y bootstrap anteriores a la activación quedan fuera de la observación automática. Tampoco se cubren automáticamente tareas, threads y procesos externos ni código que consume errores sin notificar a un propietario.

## Una observación y resultados decididos por su propietario

El propietario entrega la excepción original a `capture` o declara un valor fallido con `capture_result`. El coordinador invoca `handleFailure(exception, context)` o `handleResult(value, context)` una vez por incidente. Un `FailureHandling` selecciona efectos diferidos: el coordinador completa el logging, y un propietario HTTP o CLI puede solicitar presentación desde ese mismo plan mediante `Catch.exception()`.

| Integración | Observación y resultado conservado |
| --- | --- |
| HTTP ASGI/RSGI | Ejecución, validación, resultados rechazados, streams, envío y limpieza de background notifican en sus fronteras. HTTP conserva estados y respuestas. Un fallo tardío después de iniciar el envío no inicia una segunda respuesta. |
| WebSocket | Los adaptadores observan fallos operativos de aceptación, recepción, envío y cierre; las desconexiones y decisiones de cierre conservan su semántica. |
| CLI | Excepciones y resultados no cero son hechos distintos. Observar no cambia el código de salida. La excepción original del comando se conserva frente a un fallo secundario de shutdown. |
| MCP HTTP/STDIO | Dispatcher, tools, streams, entrega y limpieza conservan envelopes JSON-RPC y respuestas del protocolo. `isError` es un resultado fallido sin traceback inventado. Los diagnósticos de emergencia usan stderr y nunca stdout del protocolo. |
| Realtime | Invocaciones, listeners, broadcasts, entrega y limpieza mantienen su respuesta o cierre. Un envío fallido se observa sin inventar una finalización exitosa. |
| Colas | Cada intento posee su fallo, reintento, acknowledgment y decisión de job fallido. Los intentos independientes son incidentes distintos aunque reutilicen una excepción. |
| Scheduler y background | Callbacks, tareas administradas, futures y drenajes notifican antes de consumir fallos operativos. La cancelación conserva su función de control. |
| Servicios internos | Las recuperaciones de cache, sesión, correo, storage, autorización y vistas observan fallos operativos antes de retornar su fallback existente. La ausencia normal no se convierte automáticamente en excepción. |
| Shutdown | La observación sigue activa durante callbacks, tareas y cierre de recursos. Se intentan todos los callbacks de cierre independientes después de fallos ordinarios. El cierre del logger desactiva el logging ordinario y conserva diagnósticos de emergencia acotados. |

Estas integraciones no requieren un catch en cada método. Los errores que se propagan íntegros llegan a su propietario. Una recuperación o resultado fallido que consume el error notifica antes de descartarlo. Un incidente observado debe transferirse explícitamente cuando una tarea o callback lo entrega a otro propietario.

## Observación explícita en headless

```python
from orionis.failure.runtime import capture, operation

await app.boot()
try:
    with operation(app, flow="worker", operation="import", isolated=True):
        try:
            await service.run()
        except Exception as error:
            await capture(error, phase="execution")
            raise
finally:
    await app.aclose()
```

`operation` vincula contexto y deduplicación; no captura errores por sí misma. Mantén el consumo de streams dentro de la operación. Usa tareas administradas por `Loop.createTask` o proporciona un propietario explícito para tareas externas. El handler compartido no debe almacenar dependencias de request, planes, requests ni excepciones en estado singleton.

## Contexto, cancelación y limpieza

`FailureContext` registra flow, phase, operación, identificadores de correlación/evento, clasificación esperada, permiso de reporte y metadatos escalares acotados. Los recibos contienen el estado de entrega sin retener request ni excepción. La operación libera su registro de incidentes al finalizar; las operaciones independientes no comparten deduplicación por reutilizar una excepción.

Se conservan identidad, traceback, causas y grupos de excepciones originales. Los fallos secundarios de reporte, envío o limpieza no sustituyen silenciosamente el incidente primario. Los timeouts cooperativos no interrumpen código síncrono que bloquea el event loop. Una cancelación real del caller se propaga después de completar la limpieza propia; es distinta de un callback que lanza `CancelledError` internamente.

No invoques directamente los hooks como reporter de emergencia ni ejecutes `complete()` o `present()` dentro del hook. Retorna el plan seleccionado al coordinador. La reentrada, una notificación duplicada o reintentar un efecto parcialmente completado no son estrategias de fallback.

Consulta [personalización del handler](/es/exceptions/handling-exceptions), [políticas y referencia](/es/exceptions/policies-and-reference) y [excepciones HTTP](/es/http/exceptions).
