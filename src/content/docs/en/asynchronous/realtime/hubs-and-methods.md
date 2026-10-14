---
title: "Building a hub with typed operations"
description: "Use a Hub to group operations sharing an audience and protocol. Only ordinary instance methods marked @remote are callable remotely. A public method without the decorator…"
editUrl: true
lastUpdated: false
---

Use a Hub to group operations sharing an audience and protocol. Only ordinary instance methods marked `@remote` are callable remotely. A public method without the decorator remains outside the remote surface.

```python
from orionis.realtime import Hub, remote

class MathHub(Hub):
    @remote(name="sum")
    async def add(self, first: int, second: int = 2) -> int:
        return first + second
```

Save the class in `app/realtime/math_hub.py` (create the importable package if needed). In `routes/websocket.py` register it:

```python
from app.realtime.math_hub import MathHub
from orionis.support.facades import Route

Route.hub("/realtime/math", MathHub)
```

Ensure the existing `app.withRouting(...)` call in `bootstrap/app.py` includes `websocket="routes/websocket.py"`, preserving its other route arguments. Start the application with WebSocket support. A client invokes the public alias `sum`, not the Python method name `add`; with arguments `[3]` the default second argument is `2` and the result is `5`. The next chapter shows the complete browser exchange. `protocol="msgpack"` selects binary MessagePack for the whole connection; JSON text is default. Codecs are not negotiated per message.

## Data and services

Annotate every remote argument. Msgspec-compatible data types convert client arguments; service types resolve through the container and cannot be replaced by payload values. Nested Orionis schemas also run their rules. Defaults and keyword-only parameters are supported.

For an importable application `Calculator` service, a method can declare `async def add(self, first: int, calculator: Calculator, second: int = 2) -> int`. Register/resolve Calculator normally. Keep imports available at runtime when reflection requires them; do not hide every injectable annotation under `TYPE_CHECKING` without a resolution strategy.

Compilation rejects private names, duplicate aliases, class/static methods, positional-only parameters, variadics and ambiguous annotations. Aliases must be public Python identifiers of at most 128 characters. A registration failure is preferable to exposing a signature with unclear input ownership.

## Context and lifecycle

Each invocation receives a fresh instance with `context`, `clients` and `groups`. `context.connection_id` identifies the connection, `.socket` exposes WebSocket and `.user` contains the pipeline-established identity. Do not use instance attributes to retain state between calls; use domain services or an appropriate registry.

`onConnect()` runs after registration and before readiness; it may join groups or reject setup. `onDisconnect(code, reason)` runs after owned work is cancelled and registration removed. Release application resources idempotently. The decorator controls exposure rather than permission; authorize individual operations as well as the handshake where needed.

## Deliberate failures

For a client-visible business condition, import `RPCError` from `orionis.realtime.errors` and raise `RPCError("conflict", "Operation is no longer available")`. The runtime sanitizes internal, validation, authorization, timeout and cancellation failures into stable codes. Do not expose tracebacks or provider errors as public messages.
