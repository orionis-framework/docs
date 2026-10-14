---
title: "Protocol, streams and bidirectional results"
description: "Protocol v1 uses envelopes with a type field. Clients must await ready, correlate identifiers and distinguish ordinary results from streams and events. JSON uses WebSocket…"
editUrl: true
lastUpdated: false
---

Protocol v1 uses envelopes with a `type` field. Clients must await `ready`, correlate identifiers and distinguish ordinary results from streams and events. JSON uses WebSocket text; MessagePack uses bytes. Sending the wrong frame type is a protocol error.

With the `MathHub` endpoint from [the previous chapter](/en/asynchronous/realtime/hubs-and-methods) running, execute this client from a page served by the same application:

```javascript
const scheme = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${scheme}//${location.host}/realtime/math`);
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.type === "ready") {
    socket.send(JSON.stringify({
      type: "invoke", id: "call-1", target: "sum", args: [2, 3], kwargs: {}
    }));
  } else if (message.type === "completion" && message.id === "call-1") {
    console.log(message.result); // 5
    socket.close();
  }
});
```

An open WebSocket alone does not mean the Hub is ready. Send invocations only after the server emits `{"type":"ready","version":1,"connection_id":"..."}`. The example receives `{"type":"completion","id":"call-1","result":5}`. A production client also needs error, disconnect, timeout and reconnect handling.

## Calling and cancelling

```json
{"type":"invoke","id":"call-1","target":"sum","args":[2,3],"kwargs":{}}
```

Responses with a single result arrive as `completion` with the same ID and a result or error. Cancel an active call with:

```json
{"type":"cancel","id":"call-1"}
```

IDs are printable ASCII without spaces, at most 128 characters. Args and kwargs are each limited to 64 entries. Do not reuse an active ID. Client completions must contain exactly one result or error; an explicit `null` result is valid. Unknown and duplicate completions are not retained.

## Producing a sequence

```python
from collections.abc import AsyncIterator
from orionis.realtime import Hub, remote
from orionis.realtime.errors import RPCError

class FeedHub(Hub):
    @remote
    async def updates(self, count: int) -> AsyncIterator[int]:
        if not 1 <= count <= 100:
            raise RPCError("invalid_count", "Count must be between 1 and 100")
        for value in range(count):
            yield value
```

Register `FeedHub` with `Route.hub("/realtime/feed", FeedHub)` in the WebSocket route file. After `ready`, invoke `updates` with `args: [3]`. The server sends three `stream_item` messages with values `0`, `1`, `2`, then a `stream_complete` for that invocation ID.

The runtime delivers `stream_item` followed by `stream_complete`. Iteration follows socket pace. Use `try/finally` in resource-owning generators; cancellation/disconnection must close the iterator before releasing its scope. Streams have no default lifetime timeout; an explicit invoke `timeout` limits the operation. Scalar calls use `REALTIME_INVOCATION_TIMEOUT` unless overridden.

## Requesting a client result

Within a hub, `await self.clients.caller.invoke("confirm", payload, timeout=5.0)` sends an invocation and awaits its correlated completion; `payload` must be a serializable value prepared by your method. This also works on `clients.client(id)`. Multi-recipient targets cannot `invoke` because there is no single result to correlate. Use `send` for events without a returned result.

The connection reader remains available while awaiting results, which may arrive out of order. Pending calls have bounded capacity and deadlines. Client errors become sanitized `ClientInvocationError`; arbitrary peer text is not copied into internal diagnostics.

## Closing and compatibility

Invalid protocol closes with 1002, wrong frame type with 1003 and excessive size with 1009. Application ping/pong is available; it provides neither persistence nor an automatic heartbeat task. Clients should release pending callbacks on disconnect and reconcile state on reconnect: automatic replay is not provided.
