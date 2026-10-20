---
title: "Schemas across HTTP, MCP, and Realtime"
description: "Reuse schemas in HTTP requests, MCP tools, Realtime methods, and other asynchronous entry points, with the verified scope of validation."
editUrl: true
lastUpdated: false
---

A schema describes data and validation rules; its use is not limited to controllers. HTTP, MCP, and Realtime integrate these contracts with different input sources. A service or another adapter can also validate explicitly inside an asynchronous method.

## A shared contract

In `app/http/schemas/contact_schema.py`:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import Email
from orionis.schemas.fields import Field


class ContactSchema(Schema):
    email: Field[str, Email(message="Use a valid email address.")]
```

This location follows the HTTP generator convention; it does not prevent importing the same contract from a tool, hub, or service. `{"email": "ada@example.com"}` is valid, while `{"email": "invalid"}` fails `Email`.

## What each entry point integrates

| Context | Input and validation | Schema output |
| --- | --- | --- |
| HTTP function or controller | Body from `Request.data()`; the container validates and injects the Schema parameter. | The instance serializes as JSON; the return annotation does not validate output. |
| MCP tool | The `arguments` object is validated against the input declared by `Tool`. | Use `McpResponse.structured(schema)`; the declared output validates structured content. |
| Realtime `@remote` method | Invocation `args` and `kwargs`; typed conversion and Schema rules. | Serializes inside the protocol result; its return annotation does not validate output. |
| Plain WebSocket | The handler receives the message and explicitly calls the validator. | `sendJson(schema)` serializes the instance. |
| Service, command, or task | The method obtains data from its source and executes `await Validator.validate(...)`. | The consumer decides how to use the validated instance. |

Injection depends on the adapter. An annotation in a direct Python call neither reads data nor activates validation. It also does not imply that every framework component automatically looks for an HTTP request.

## HTTP: functions and controllers

In `app/http/controllers/contact_controller.py`:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.http.base import BaseController


class ContactController(BaseController):
    async def preview(self, payload: ContactSchema) -> ContactSchema:
        return payload
```

In the configured API routes file, commonly `routes/api.py`:

```python
from app.http.controllers.contact_controller import ContactController
from app.http.schemas.contact_schema import ContactSchema
from orionis.support.facades import Route


async def preview_contact(payload: ContactSchema) -> ContactSchema:
    return payload


Route.post("/contacts/preview", [ContactController, "preview"])
Route.post("/contacts/function-preview", preview_contact)
```

Both routes receive the typed contract before their function or action executes. They do not need to call the validator manually. The Schema represents the body: URL parameters, query values, and headers are not merged automatically. You may also receive `Request` when you need those elements.

The returned instance becomes JSON with status `200`. Declaring `-> ContactSchema` does not check the result or convert a dictionary by itself. See [controllers, responses, and HTTP errors](/en/validation/controllers-and-http) for explicit output validation and the differences between API and WEB errors.

## MCP: tool input and output

In `app/mcp/servers/contact_server.py`:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.mcp import McpResponse, Server, Tool


class ContactTool(Tool[ContactSchema, ContactSchema]):
    name = "contact-preview"

    async def handle(self, payload: ContactSchema) -> McpResponse:
        return McpResponse.structured(payload)


class ContactServer(Server):
    name = "Contact validation"
    tools = (ContactTool,)
```

`Tool[InputSchema, OutputSchema]` declares both contracts. Input comes only from the tool's `arguments` object, not the entire JSON-RPC envelope or a conventional HTTP request body. The `payload` parameter matches the declared input type; annotating a different Schema in `handle` does not register it automatically.

During application boot, register the transport you need:

```python
from app.mcp.servers.contact_server import ContactServer
from orionis.support.facades import Mcp

Mcp.web("/mcp/contacts", ContactServer)
```

To register a local server, use `Mcp.local` instead of the preceding web registration, or register both if you need both transports:

```python
from app.mcp.servers.contact_server import ContactServer
from orionis.support.facades import Mcp

Mcp.local("contacts", ContactServer)
```

A client calls `contact-preview` with `arguments` such as `{"email": "ada@example.com"}`. The tool receives a `ContactSchema` and produces `structuredContent` containing those data. It does not return a bare Schema: `McpResponse.structured` normalizes it as MCP content.

See [MCP servers and tools](/en/protocols/mcp/servers-and-tools) and [transports and configuration](/en/protocols/mcp/transports-and-configuration) to integrate this registration with application boot and connect a client.

When the input and output are Orionis Schema classes, both conversions await asynchronous rules. The declared output is checked before a successful result is published. Errors appear in the MCP result:

| Situation | Default behavior |
| --- | --- |
| Invalid input | `isError: true` and text `Invalid tool arguments`; `handle` does not execute. |
| Invalid output | `isError: true` and text `Tool execution failed`. |

These results do not use the HTTP `422` error map. The return annotation of `handle` also does not replace the `Tool` output declaration.

### Collections and other MCP types

MCP calls the Orionis validator when the declared root type is a `Schema` class. For a root type such as `list[ContactSchema]` or an ordinary `msgspec.Struct`, it applies msgspec conversion and constraints but does not execute contained Orionis rules such as `Email`. To preserve these rules for a collection, use a root Schema:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.mcp import McpResponse, Tool
from orionis.schemas import Schema


class ContactsSchema(Schema):
    contacts: list[ContactSchema]


class ContactsTool(Tool[ContactSchema, ContactsSchema]):
    name = "contacts-preview"

    async def handle(self, payload: ContactSchema) -> McpResponse:
        return McpResponse.structured(ContactsSchema(contacts=[payload]))
```

Add `ContactsTool` to `ContactServer.tools` to expose it. When validating `ContactsSchema`, the validator also traverses the schemas in `contacts` and applies their rules.

MCP prompts declare text arguments with `PromptArgument`; resources receive variables from their URIs. Neither automatically injects an input Schema like a tool. You can validate those data explicitly.

Use `McpResponse.resource(uri, schema)` to serialize a Schema as resource content. In a prompt, for example, `McpResponse.resource(uri, schema).asAssistant()` includes it in an assistant message. A JSON resource may also return `McpResponse.structured(schema)` with `mime_type = "application/json"`. These operations serialize content without establishing an automatic output validation contract.

## Realtime: typed hub parameters

In `app/http/hubs/contact_hub.py`:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.realtime import Hub, remote


class ContactHub(Hub):
    @remote
    async def preview(self, payload: ContactSchema) -> ContactSchema:
        return payload
```

In the configured WebSocket routes file:

```python
from app.http.hubs.contact_hub import ContactHub
from orionis.support.facades import Route

Route.hub("/realtime/contacts", ContactHub)
```

The client sends a Realtime protocol message over that connection:

```json
{
  "type": "invoke",
  "id": "preview-1",
  "target": "preview",
  "args": [{"email": "ada@example.com"}]
}
```

The binder converts `args` or `kwargs` according to the method parameters and awaits their Schema rules, including schemas inside collections. It does not read `Request.data()`. Service dependencies belong to the container and resolve separately from client data.

A valid result contains `{"type": "completion", "id": "preview-1", "result": {"email": "ada@example.com"}}`. If Email is invalid, the invocation fails with code `validation_error` and message `Invocation failed`. The HTTP error dictionary is not exposed to the client.

A Schema result is serializable through the connection codec, but `-> ContactSchema` does not activate output validation. If you need to check data produced by the method, validate explicitly before returning them.

See [hubs and methods](/en/asynchronous/realtime/hubs-and-methods) and [protocol and streaming](/en/asynchronous/realtime/protocol-and-streaming) for connection setup and the rest of the message exchange.

## WebSocket: validate the message explicitly

A plain WebSocket handler controls message reception. This function handles one message and returns its validated data or errors:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.http import WebSocket, WebSocketDisconnected
from orionis.schemas.exceptions.validation import ValidationException
from orionis.schemas.validator import Schema as Validator


async def contact_socket(socket: WebSocket) -> None:
    await socket.accept()
    try:
        data = await socket.receiveJson()
        try:
            payload = await Validator.validate(data, ContactSchema)
        except ValidationException as exc:
            await socket.sendJson({"errors": exc.errors})
        else:
            await socket.sendJson(payload)
    except WebSocketDisconnected:
        return
    finally:
        await socket.close()
```

Register it with `Route.websocket("/ws/contacts", contact_socket)` in the same module, importing `Route` from `orionis.support.facades`. The message contains `{"email": "ada@example.com"}` directly: this handler does not use the Realtime `invoke` envelope.

## Services and other asynchronous adapters

When your code has already obtained data from a command, task, or external system, use the validator from that method:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.schemas.validator import Schema as Validator


class ContactService:
    async def preview(self, data: object) -> ContactSchema:
        return await Validator.validate(data, ContactSchema)
```

From another asynchronous method, execute `payload = await ContactService().preview(data)`. The same API applies constraints, awaits rules, and returns an instance, or raises `ValidationException`. See [validation errors](/en/validation/validation-and-errors).

Orionis persistent jobs serialize primitive state and its collections, not Schema instances. Keep data compatible with that serializer and validate explicitly in `handle` when you need a contract. Container HTTP injection requires an active HTTP request; it does not turn job state or command arguments into a Schema by itself.
