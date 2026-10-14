---
title: "Grupos, broadcasts y despliegue"
description: "Los grupos seleccionan conexiones de un Hub, por ejemplo participantes de una sala. No son roles de seguridad: comprueba que la identidad pueda acceder a la sala antes de…"
editUrl: true
lastUpdated: false
---

Los grupos seleccionan conexiones de un Hub, por ejemplo participantes de una sala. No son roles de seguridad: comprueba que la identidad pueda acceder a la sala antes de incorporarla. Las membresías se eliminan al desconectar y no constituyen una suscripción durable.

Guarda `RoomHub` en `app/realtime/room_hub.py` y regístralo con `Route.hub` como se muestra en [hubs](/es/asynchronous/realtime/hubs-and-methods). La operación `join` exige una identidad establecida por el pipeline de la conexión:

```python
from orionis.realtime import Hub, remote

class RoomHub(Hub):
    @remote
    async def join(self, room: str) -> None:
        if self.context.user is None:
            from orionis.realtime.errors import RPCError
            raise RPCError("unauthenticated", "Sign in first")
        await self.groups.join(room)
        await self.clients.group(room).send("joined", self.context.connection_id)
```

El ejemplo comprueba identidad, pero una sala privada necesita además una autorización de dominio para ese nombre. No admitas un nombre controlado por el cliente como prueba de pertenencia. `groups.leave(name)` permite salir. Identificadores y grupos se validan para acotar tamaño y contenido.

## Seleccionar destinatarios

`clients.all`, `.caller` y `.others` son propiedades; `.client(id)`, `.clients(ids)` y `.group(name)` son métodos. Todos los targets permiten `await target.send(event, *args)`. `.caller` y `.others` requieren una invocación con llamador. Para un evento desde un controlador o job usa `Realtime.hub(RoomHub).all.send(...)`, importando Realtime de `orionis.support.facades`; esa selección no tiene caller.

```python
from orionis.http import response
from orionis.support.facades import Realtime
from app.realtime.room_hub import RoomHub

async def notify_room():
    result = await Realtime.hub(RoomHub).group("lobby").send("refresh", {"version": 1})
    return response.json({"sent": result.sent, "failed": result.failed})
```

La función anterior es código de aplicación para un controlador o job ya autorizado. Necesita `RoomHub` registrado y el mismo worker en ejecución que sus oyentes. Sin miembros conectados, ambos contadores son cero. Registrar una ruta de difusión no autoriza por sí mismo al llamador para notificar una sala.

`BroadcastResult.sent` cuenta entregas al transporte y `failed` destinatarios fallidos; no confirma ejecución de código cliente. El broadcast toma snapshot de IDs y vuelve a comprobar disponibilidad antes de escribir. Desconexiones durante el envío pueden figurar como fallos.

## Presupuestos de ejecución

| Variable | Predeterminado |
|---|---:|
| `REALTIME_MAX_MESSAGE_SIZE` | 1 MiB |
| `REALTIME_MAX_CONCURRENT_INVOCATIONS` | 16 por conexión |
| `REALTIME_MAX_PENDING_CLIENT_INVOCATIONS` | 32 por conexión |
| `REALTIME_INVOCATION_TIMEOUT` | 30 segundos, scalar |
| `REALTIME_CLIENT_RESULT_TIMEOUT` | 30 segundos |
| `REALTIME_BROADCAST_CONCURRENCY` | 32 entregas concurrentes |
| `REALTIME_MAX_GROUPS_PER_CONNECTION` | 64 |

Los límites son enteros positivos y los timeouts finitos positivos. `config/realtime.py` construye `RealtimeConfig`; el provider lo registra como configuración inmutable. Combínalos con límites WebSocket HTTP de mensajes y conexiones. No asumas que elevar el límite Realtime eleva automáticamente el del transporte.

## Workers, orden y extensiones

`ConnectionManager` y grupos son locales al worker. Dos procesos no ven conexiones del otro; reiniciar pierde registro/membresías. Para difusión entre workers necesitas un backplane propio y una implementación compatible de `IConnectionManager`. No se entrega Redis pub/sub o almacenamiento offline automáticamente por configurar Redis en otro módulo.

Cada conexión serializa escrituras mediante lock y aplica backpressure; una escritura fallida cierra conexión y cancela su owner para evitar adelantamientos posteriores. El broadcast acota fan-out y codifica una vez por codec. Accede al manager en el event loop de la aplicación; no está diseñado como registry thread-safe global.

La metadata de un Hub se comparte, mientras sus instancias y scopes de dependencias se crean por invocación. No retengas recursos scoped en tareas que sobrevivan a la conexión; controla cancelación, join y cierre de cualquier tarea propia.
