---
title: "Streaming y eventos del servidor"
description: "Un stream evita construir un cuerpo completo en memoria y permite entregar resultados a medida que se producen. Úsalo para exportaciones o progreso. No elimina el costo de…"
editUrl: true
lastUpdated: false
---

Un stream evita construir un cuerpo completo en memoria y permite entregar resultados a medida que se producen. Úsalo para exportaciones o progreso. No elimina el costo de producir datos, la capacidad de conexiones ni los límites del servicio remoto.

## Entregar bytes progresivamente

Coloca esta demostración local en `routes/api.py`. `GET /exports/users` devuelve un cuerpo CSV con el encabezado `id,name` y la fila `1,Ada`:

```python
from orionis.http import response
from orionis.support.facades import Route

async def export_rows():
    yield b"id,name\n"
    yield b"1,Ada\n"

async def export():
    return response.stream(export_rows(), media_type="text/csv")

Route.get("/exports/users", export)
```

`stream()` admite iterables síncronos y asíncronos de bytes. Un generador que produce `str` es inválido para esta API. Codifica cada fragmento con la codificación escogida. Un generador síncrono puede necesitar ejecución delegada durante el envío: mantén claro dónde ocurre el trabajo bloqueante.

## Publicar progreso como SSE

```python
from orionis.http import ServerSentEvent, response

async def progress_events():
    for step in range(3):
        yield ServerSentEvent(event="progress", id=str(step), data=str(step))

async def progress():
    return response.eventStream(progress_events())

frame = ServerSentEvent(event="progress", id="7", retry=1500, data="ready").encode()
assert b"event: progress\n" in frame
assert frame.endswith(b"\n\n")
```

Registra `Route.get("/progress", progress)` en el mismo archivo de rutas. Un cliente en el navegador puede escuchar así:

```javascript
const events = new EventSource("/progress");
events.addEventListener("progress", (event) => console.log(event.data));
```

El ejemplo emite `0`, `1` y `2`, y termina la respuesta. Cierra el cliente con `events.close()` al finalizar; EventSource suele reconectar cuando una respuesta termina, por lo que esta demostración finita comenzaría de nuevo. Aplica la política de acceso de tu aplicación cuando publiques el progreso de trabajo real.

`eventStream()` acepta strings y `ServerSentEvent`. El tipo configura `text/event-stream` y encabezados para evitar buffering incompatible; no necesitas construir manualmente el framing. `data` multilineal produce una línea `data:` por línea. `event` e `id` rechazan saltos de línea; `retry` requiere entero no negativo. `comment` permite un comentario/keepalive.

Un `id` identifica un evento; este módulo no guarda eventos ni reconstruye automáticamente el historial al reconectar. Si necesitas reanudación, conserva una secuencia en un servicio durable y valida el cursor recibido. No confundas `retry` con un reintento del productor en el servidor.

## Cancelación y cierre

La lectura es perezosa y se ajusta al ritmo de envío. Usa `try/finally` en productores que abren cursores, archivos o suscripciones. Los adaptadores cierran los iteradores al finalizar la entrega o desconectarse el cliente. No absorbas `CancelledError` y dejes el productor ejecutándose. Si el recurso tiene `aclose()`, su limpieza debe completarse antes de liberar el scope.

`HTTP_MONITOR_DISCONNECTS` controla monitoreo adicional para solicitudes HTTP ordinarias; SSE/WebSocket y políticas de endpoint pueden tener mecanismos propios. Verifica el adapter utilizado y la configuración de tu despliegue. Un proxy puede seguir agrupando salida aun cuando la aplicación entregue chunks; prueba el flujo completo.

Los errores previos al envío pueden convertirse en una respuesta normal. Tras enviar encabezados, comunica un error mediante el protocolo del stream o termina la conexión; no prometas cambiar a un JSON 500. El trabajo de fondo no debe depender de mantener objetos del request después de su limpieza.
