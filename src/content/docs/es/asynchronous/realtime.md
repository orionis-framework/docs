---
title: "Realtime: hubs sobre WebSocket"
description: "Realtime añade RPC tipado y eventos bidireccionales a rutas WebSocket. Un Hub declara métodos remotos explícitos; Orionis compila argumentos y dependencias y construye una…"
editUrl: true
lastUpdated: false
---

Realtime añade RPC tipado y eventos bidireccionales a rutas WebSocket. Un Hub declara métodos remotos explícitos; Orionis compila argumentos y dependencias y construye una instancia por invocación. El registro predeterminado conoce únicamente conexiones del worker actual.

Utiliza Realtime para eventos de salas de chat, paneles en vivo u operaciones que necesiten un resultado sobre una conexión abierta. RPC significa que el cliente indica un método del servidor y envía sus argumentos; Orionis los valida, invoca el método y relaciona el resultado con el ID de la llamada. Para un flujo en una sola dirección utiliza [SSE](/es/http/streaming-and-sse); para mensajes sin este contrato utiliza [WebSocket](/es/http/websockets).

1. [Crear hubs y métodos remotos](/es/asynchronous/realtime/hubs-and-methods).
2. [Protocolo, streams y resultados de clientes](/es/asynchronous/realtime/protocol-and-streaming).
3. [Grupos, broadcasts y despliegue](/es/asynchronous/realtime/groups-and-deployment).

Requiere Python 3.14+, una aplicación inicializada y servidor ASGI/RSGI con WebSocket. Lee [WebSocket](/es/http/websockets), [autenticación](/es/security/authentication) y [contenedor](/es/architecture/service-container). El protocolo Orionis Realtime v1 requiere un cliente que implemente sus envelopes; no promete compatibilidad con SignalR.
