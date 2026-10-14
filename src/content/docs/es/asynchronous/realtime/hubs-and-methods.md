---
title: "Crear un hub con operaciones tipadas"
description: "Usa un Hub para agrupar operaciones que comparten audiencia y protocolo. Solo métodos de instancia ordinarios marcados con @remote son invocables. Un método público sin ese…"
editUrl: true
lastUpdated: false
---

Usa un Hub para agrupar operaciones que comparten audiencia y protocolo. Solo métodos de instancia ordinarios marcados con `@remote` son invocables. Un método público sin ese decorador permanece fuera de la superficie remota.

```python
from orionis.realtime import Hub, remote

class MathHub(Hub):
    @remote(name="sum")
    async def add(self, first: int, second: int = 2) -> int:
        return first + second
```

Guarda la clase en `app/realtime/math_hub.py` (crea el paquete importable si hace falta). Regístrala en `routes/websocket.py`:

```python
from app.realtime.math_hub import MathHub
from orionis.support.facades import Route

Route.hub("/realtime/math", MathHub)
```

Comprueba que la llamada existente `app.withRouting(...)` de `bootstrap/app.py` incluya `websocket="routes/websocket.py"`, conservando sus demás argumentos de rutas. Inicia la aplicación con soporte WebSocket. El cliente invoca el alias público `sum`, no el nombre Python `add`; con argumentos `[3]`, el segundo argumento predeterminado es `2` y el resultado es `5`. El capítulo siguiente muestra el intercambio completo desde un navegador. `protocol="msgpack"` selecciona MessagePack binario para toda la conexión; el default es JSON texto. La selección no se negocia por cada mensaje.

## Datos y servicios

Anota cada argumento remoto. Tipos de datos compatibles con msgspec se convierten desde argumentos del cliente; tipos de servicios se resuelven con el contenedor y no pueden ser suplantados por un valor del payload. Los schemas Orionis anidados ejecutan además sus reglas. Se admiten defaults y parámetros keyword-only.

Para un servicio de aplicación importable `Calculator`, un método puede declarar `async def add(self, first: int, calculator: Calculator, second: int = 2) -> int`. Registra/resuelve Calculator normalmente en el contenedor. Mantén el import disponible en runtime cuando la reflexión lo requiera; no escondas todas las anotaciones de inyección en `TYPE_CHECKING` sin una estrategia de resolución.

La compilación rechaza nombres privados, aliases duplicados, classmethods/staticmethods, posicionales exclusivos, variádicos y anotaciones ambiguas. Un alias debe ser identificador público Python de hasta 128 caracteres. Un fallo en registro es preferible a exponer una firma cuya propiedad de datos no está clara.

## Contexto y ciclo de vida

Cada invocación recibe una instancia fresca con `context`, `clients` y `groups`. `context.connection_id` identifica conexión, `.socket` da acceso a WebSocket y `.user` contiene la identidad establecida por el pipeline. No uses atributos de la instancia para conservar estado entre invocaciones. Usa servicios de dominio o el registro adecuado.

`onConnect()` corre tras registrar conexión y antes de anunciar disponibilidad; puede unirse a grupos o rechazar preparación. `onDisconnect(code, reason)` corre después de cancelar trabajo propio y retirar el registro. Libera recursos de aplicación de forma idempotente. El decorador controla exposición, no permisos; comprueba autorización de operaciones además de proteger handshake cuando corresponda.

## Fallos deliberados

Para una condición de negocio visible al cliente importa `RPCError` desde `orionis.realtime.errors` y lanza `RPCError("conflict", "Operation is no longer available")`. El runtime sanea fallos internos, validación, autorización, timeout y cancelación a códigos estables. No envíes tracebacks o errores del proveedor como mensajes públicos.
