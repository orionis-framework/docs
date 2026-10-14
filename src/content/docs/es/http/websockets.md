---
title: "Conexiones WebSocket"
description: "WebSocket proporciona la misma API sobre ASGI y RSGI. Registra un handler con Route.websocket(path, action); la conexión tiene parámetros convertidos, encabezados y estado…"
editUrl: true
lastUpdated: false
---

`WebSocket` proporciona la misma API sobre ASGI y RSGI. Registra un handler con `Route.websocket(path, action)`; la conexión tiene parámetros convertidos, encabezados y estado propios. Una ruta HTTP GET con el mismo path no sustituye una ruta WebSocket.

## Un eco JSON

```python
from orionis.http import WebSocket, WebSocketDisconnected

async def echo(socket: WebSocket) -> None:
    await socket.accept()
    try:
        while True:
            value = await socket.receiveJson()
            await socket.sendJson({"echo": value})
    except WebSocketDisconnected:
        return
    finally:
        await socket.close()
```

En un archivo de rutas importa `Route` de `orionis.support.facades` y declara `Route.websocket("/ws/echo", echo)`. El handler necesita un servidor con soporte de upgrade; importarlo no abre conexiones. `receiveJson()` espera mensajes de texto JSON. Para datos binarios usa `receiveBytes()`/`sendBytes()`, para texto `receiveText()`/`sendText()`, o `receive()` para inspeccionar `WebSocketMessage` y su tipo.

Coloca el handler y su registro en `routes/websocket.py`. Crea el archivo si hace falta y comprueba que la llamada existente `app.withRouting(...)` de `bootstrap/app.py` incluya `websocket="routes/websocket.py"`, conservando sus demás argumentos. Desde una página servida por la misma aplicación, este cliente de navegador imprime `{"echo":{"message":"hello"}}`:

```javascript
const scheme = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${scheme}//${location.host}/ws/echo`);
socket.addEventListener("open", () => {
  socket.send(JSON.stringify({ message: "hello" }));
});
socket.addEventListener("message", (event) => console.log(event.data));
```

Cierra la conexión de navegador con `socket.close()` al terminar. Este eco solo demuestra el transporte; protege las operaciones privadas antes de aceptar la conexión.

## Estado y handshake

Antes de enviar/recibir datos llama `accept()`. Puedes seleccionar un subprotocolo y encabezados de handshake mediante sus argumentos keyword. Para rechazar antes de aceptar usa `await socket.reject(status_code=403)`. Después de aceptar se termina con `close(code=1000, reason="...")`, no con una respuesta HTTP.

`accepted`, `closed` y `connectionState` exponen el estado. `supportsCloseDetails` permite reconocer diferencias de transporte al informar razón/código. Las operaciones fuera de estado y mensajes de tipo inesperado producen errores; no ignores esos fallos y sigas escribiendo en un socket cerrado.

## Middleware y autenticación

El middleware WebSocket deriva de `WebSocketMiddleware` y recibe la conexión y un continuation sin argumentos. No adjuntes middleware HTTP de respuesta a una ruta de socket. Valida acceso antes del `accept`; un origen permitido no demuestra identidad. El kernel configura contexto de conexión, y los hubs pueden usar esa identidad. El estado de una conexión larga no sustituye la validación de permiso por operación cuando la aplicación lo requiere.

`socket.routeParams()` conserva convertidores de ruta; `socket.headers` y `.state` son accesos síncronos. No hay cuerpo HTTP de formulario que leer desde esta API. Para RPC tipado, grupos y resultados correlacionados continúa con [Realtime](/es/asynchronous/realtime).

## Límites y desconexiones

`WEBSOCKET_MAX_CONNECTIONS` vale 128 por worker y `WEBSOCKET_MAX_MESSAGE_SIZE` 1 MiB en bootstrap. La política de orígenes se alimenta de `CORS_ALLOW_ORIGINS`; sin lista explícita la política de WebSocket usa comprobaciones de mismo origen. MCP tiene reglas distintas. El kernel rechaza capacidad excesiva y cancela conexiones en shutdown.

Gestiona `WebSocketDisconnected`, cancela trabajo creado por el handler y espera su cierre en `finally`. El transporte puede perder detalles de cierre según servidor; no bases la seguridad en el texto de razón del peer. Los límites de conexión se multiplican por workers y no constituyen control distribuido.
