---
title: "Realtime: hubs over WebSocket"
description: "Realtime adds typed RPC and bidirectional events to WebSocket routes. A Hub declares explicit remote methods; Orionis compiles argument/dependency plans and constructs an…"
editUrl: true
lastUpdated: false
---

Realtime adds typed RPC and bidirectional events to WebSocket routes. A Hub declares explicit remote methods; Orionis compiles argument/dependency plans and constructs an instance per invocation. The default registry knows only connections within the current worker.

Use Realtime for chat-room events, live dashboards or operations that need a result over an open connection. RPC means the client names a server method and sends its arguments; Orionis validates them, invokes the method and correlates the result with the call ID. For a one-way feed use [SSE](/en/http/streaming-and-sse); for raw messages use [WebSocket](/en/http/websockets).

1. [Building hubs and remote methods](/en/asynchronous/realtime/hubs-and-methods).
2. [Protocol, streams and client results](/en/asynchronous/realtime/protocol-and-streaming).
3. [Groups, broadcasts and deployment](/en/asynchronous/realtime/groups-and-deployment).

Requires Python 3.14+, a booted application and WebSocket-capable ASGI/RSGI serving. Read [WebSocket](/en/http/websockets), [authentication](/en/security/authentication) and [container](/en/architecture/service-container). Orionis Realtime v1 requires a client implementing its envelopes; SignalR compatibility is not promised.
