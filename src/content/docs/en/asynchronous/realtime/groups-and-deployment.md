---
title: "Groups, broadcasts and deployment"
description: "Groups select connections belonging to a Hub, such as room participants. They are not security roles: authorize access before joining. Membership disappears on disconnect and…"
editUrl: true
lastUpdated: false
---

Groups select connections belonging to a Hub, such as room participants. They are not security roles: authorize access before joining. Membership disappears on disconnect and is not a durable subscription.

Save `RoomHub` in `app/realtime/room_hub.py` and register it with `Route.hub` as shown in [hubs](/en/asynchronous/realtime/hubs-and-methods). Its `join` operation requires an identity established by the connection pipeline:

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

This example checks identity, but private rooms also need domain authorization for the requested name. A client-controlled name is not proof of membership. `groups.leave(name)` leaves a group. Identifiers/groups are validated for bounded size and content.

## Selecting recipients

`clients.all`, `.caller` and `.others` are properties; `.client(id)`, `.clients(ids)` and `.group(name)` are methods. Every target supports `await target.send(event, *args)`. `.caller` and `.others` require an invocation caller. From controllers/jobs use `Realtime.hub(RoomHub).all.send(...)`, importing Realtime from `orionis.support.facades`; that selection has no caller.

```python
from orionis.http import response
from orionis.support.facades import Realtime
from app.realtime.room_hub import RoomHub

async def notify_room():
    result = await Realtime.hub(RoomHub).group("lobby").send("refresh", {"version": 1})
    return response.json({"sent": result.sent, "failed": result.failed})
```

The function above is application code for an already authorized controller or job. It requires the registered `RoomHub` and the same running worker as its listeners. With no connected members, both counts are zero. Registering a broadcast endpoint does not itself authorize the caller to notify a room.

`BroadcastResult.sent` counts transport delivery and `failed` counts failed recipients; it does not acknowledge client code execution. Broadcasts snapshot IDs and recheck availability before writing. Concurrent disconnects may appear as failures.

## Execution budgets

| Variable | Default |
|---|---:|
| `REALTIME_MAX_MESSAGE_SIZE` | 1 MiB |
| `REALTIME_MAX_CONCURRENT_INVOCATIONS` | 16 per connection |
| `REALTIME_MAX_PENDING_CLIENT_INVOCATIONS` | 32 per connection |
| `REALTIME_INVOCATION_TIMEOUT` | 30 seconds, scalar |
| `REALTIME_CLIENT_RESULT_TIMEOUT` | 30 seconds |
| `REALTIME_BROADCAST_CONCURRENCY` | 32 concurrent deliveries |
| `REALTIME_MAX_GROUPS_PER_CONNECTION` | 64 |

Budgets are positive integers and timeouts are finite positive values. `config/realtime.py` constructs `RealtimeConfig`; the provider registers immutable configuration. Combine them with HTTP WebSocket message/connection limits. Raising a Realtime limit does not automatically raise the transport limit.

## Workers, ordering and extension

`ConnectionManager` and groups are worker-local. Processes do not see each other's connections; restart loses registrations/membership. Cross-worker delivery needs an application backplane and compatible `IConnectionManager` implementation. Configuring Redis elsewhere does not automatically add pub/sub or offline storage.

Connections serialize writes under a lock and apply backpressure; a failed write closes the connection and cancels its owner to prevent later writes overtaking it. Broadcasts bound fan-out and encode once per codec. Access the manager on the application's event loop; it is not a globally thread-safe registry.

Hub metadata is shared, while instances and dependency scopes are created per invocation. Do not retain scoped resources in tasks that outlive connections; manage cancellation, joining and closure of your own tasks.
