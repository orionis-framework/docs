---
title: "Schemas en HTTP, MCP y Realtime"
description: "Reutiliza schemas en peticiones HTTP, tools MCP, métodos Realtime y otros puntos de entrada asíncronos, con el alcance real de su validación."
editUrl: true
lastUpdated: false
---

Un schema describe datos y reglas de validación; su uso no está limitado a los controladores. HTTP, MCP y Realtime integran esos contratos con fuentes de entrada diferentes. En un servicio u otro adaptador también puedes validar explícitamente dentro de un método asíncrono.

## Un contrato compartido

En `app/http/schemas/contact_schema.py`:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import Email
from orionis.schemas.fields import Field


class ContactSchema(Schema):
    email: Field[str, Email(message="Use a valid email address.")]
```

Esta ubicación sigue la convención del generador HTTP; no impide importar el mismo contrato desde un tool, un hub o un servicio. `{"email": "ada@example.com"}` es válido y `{"email": "invalid"}` incumple `Email`.

## Qué integra cada punto de entrada

| Contexto | Datos de entrada y validación | Salida de tipo Schema |
| --- | --- | --- |
| Función o controlador HTTP | Cuerpo de `Request.data()`; el contenedor valida e inyecta el parámetro Schema. | La instancia se serializa como JSON; la anotación de retorno no valida la salida. |
| Tool MCP | Objeto `arguments` validado contra el input declarado por `Tool`. | Usa `McpResponse.structured(schema)`; el output declarado valida el contenido estructurado. |
| Método `@remote` de Realtime | `args` y `kwargs` de la invocación; conversión tipada y reglas del Schema. | Se serializa dentro del resultado del protocolo; no se valida por su anotación de retorno. |
| WebSocket simple | El handler recibe el mensaje y llama explícitamente al validador. | `sendJson(schema)` serializa la instancia. |
| Servicio, comando o tarea | El método obtiene los datos de su fuente y ejecuta `await Validator.validate(...)`. | El consumidor decide cómo utilizar la instancia validada. |

La inyección depende del adaptador. Una anotación en una llamada Python directa no lee datos ni activa validación. Tampoco implica que todos los componentes del marco busquen automáticamente una petición HTTP.

## HTTP: funciones y controladores

En `app/http/controllers/contact_controller.py`:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.http.base import BaseController


class ContactController(BaseController):
    async def preview(self, payload: ContactSchema) -> ContactSchema:
        return payload
```

En el archivo de rutas API configurado, normalmente `routes/api.py`:

```python
from app.http.controllers.contact_controller import ContactController
from app.http.schemas.contact_schema import ContactSchema
from orionis.support.facades import Route


async def preview_contact(payload: ContactSchema) -> ContactSchema:
    return payload


Route.post("/contacts/preview", [ContactController, "preview"])
Route.post("/contacts/function-preview", preview_contact)
```

Ambas rutas reciben el contrato tipado antes de ejecutar su función o acción. No necesitan llamar al validador manualmente. El Schema representa el cuerpo: no incorpora automáticamente parámetros de URL, query ni encabezados. Puedes recibir también `Request` cuando necesites acceder a esos elementos.

La instancia devuelta se convierte en JSON con estado `200`. Declarar `-> ContactSchema` no comprueba el resultado ni convierte por sí solo un diccionario. Consulta [controladores, respuestas y errores HTTP](/es/validation/controllers-and-http) para la validación explícita de salida y las diferencias entre errores API y WEB.

## MCP: input y output de un tool

En `app/mcp/servers/contact_server.py`:

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

`Tool[InputSchema, OutputSchema]` declara ambos contratos. El input procede únicamente del objeto `arguments` del tool, no del sobre JSON-RPC completo ni del cuerpo de una petición HTTP convencional. El parámetro `payload` coincide con el tipo de input declarado; anotar un Schema distinto en `handle` no lo registra automáticamente.

Durante el arranque, registra el transporte necesario:

```python
from app.mcp.servers.contact_server import ContactServer
from orionis.support.facades import Mcp

Mcp.web("/mcp/contacts", ContactServer)
```

Para registrarlo como servidor local, utiliza `Mcp.local` en lugar del registro web anterior, o registra ambos si necesitas los dos transportes:

```python
from app.mcp.servers.contact_server import ContactServer
from orionis.support.facades import Mcp

Mcp.local("contacts", ContactServer)
```

Un cliente llama a `contact-preview` con `arguments` como `{"email": "ada@example.com"}`. El tool recibe un `ContactSchema` y produce `structuredContent` con esos datos. No devuelve un Schema directamente: `McpResponse.structured` lo normaliza como contenido MCP.

Consulta [servidores y tools MCP](/es/mcp/servers-and-routes) y [transportes y configuración](/es/mcp/stdio-and-configuration) para integrar este registro con el arranque y conectar un cliente.

Cuando el input y el output son clases Orionis Schema, ambas conversiones esperan las reglas asíncronas. El output declarado se comprueba antes de publicar un resultado exitoso. Los errores se expresan en el resultado MCP:

| Situación | Comportamiento predeterminado |
| --- | --- |
| Input inválido | `isError: true` y texto `Invalid tool arguments`; no se ejecuta `handle`. |
| Output inválido | `isError: true` y texto `Tool execution failed`. |

Estos resultados no utilizan el mapa de errores HTTP `422`. Las anotaciones de retorno de `handle` tampoco sustituyen la declaración del output de `Tool`.

### Colecciones y otros tipos de MCP

MCP llama al validador Orionis cuando el tipo raíz declarado es una clase `Schema`. Para un tipo raíz como `list[ContactSchema]` o un `msgspec.Struct` ordinario, aplica conversión msgspec y sus restricciones, pero no ejecuta las reglas Orionis contenidas, como `Email`. Para conservar esas reglas en una colección, utiliza un Schema raíz:

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

Añade `ContactsTool` a `ContactServer.tools` para exponerlo. Al validar `ContactsSchema`, el validador también recorre los schemas de `contacts` y aplica sus reglas.

Los prompts MCP declaran argumentos de texto mediante `PromptArgument`; los recursos reciben las variables de sus URI. Ninguno inyecta automáticamente un input Schema como un tool. Puedes validar esos datos explícitamente.

Para serializar un Schema como contenido de recurso utiliza `McpResponse.resource(uri, schema)`. En un prompt, por ejemplo, `McpResponse.resource(uri, schema).asAssistant()` lo incluye en un mensaje del asistente. Un recurso JSON también puede devolver `McpResponse.structured(schema)` con `mime_type = "application/json"`. Estas operaciones serializan contenido, sin establecer un contrato automático de validación de salida.

## Realtime: parámetros tipados de un hub

En `app/http/hubs/contact_hub.py`:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.realtime import Hub, remote


class ContactHub(Hub):
    @remote
    async def preview(self, payload: ContactSchema) -> ContactSchema:
        return payload
```

En el archivo de rutas configurado para WebSocket:

```python
from app.http.hubs.contact_hub import ContactHub
from orionis.support.facades import Route

Route.hub("/realtime/contacts", ContactHub)
```

El cliente envía por esa conexión un mensaje del protocolo Realtime:

```json
{
  "type": "invoke",
  "id": "preview-1",
  "target": "preview",
  "args": [{"email": "ada@example.com"}]
}
```

El binder convierte `args` o `kwargs` según los parámetros del método y espera las reglas de sus schemas, incluso cuando aparecen dentro de colecciones. No lee `Request.data()`. Las dependencias de servicio pertenecen al contenedor y se resuelven aparte de los datos del cliente.

Un resultado válido contiene `{"type": "completion", "id": "preview-1", "result": {"email": "ada@example.com"}}`. Si el Email es inválido, la invocación falla con código `validation_error` y mensaje `Invocation failed`. No se entrega al cliente el diccionario de errores HTTP.

El retorno Schema es serializable mediante el codec de la conexión, pero `-> ContactSchema` no activa validación de salida. Si necesitas comprobar datos producidos por el método, valida explícitamente antes de devolverlos.

Consulta [hubs y métodos](/es/realtime/hubs-and-methods) y [protocolo y streaming](/es/realtime/protocol-and-streaming) para el montaje de la conexión y el resto del intercambio de mensajes.

## WebSocket: validar el mensaje explícitamente

Un handler WebSocket simple controla la recepción de mensajes. La siguiente función atiende un mensaje y devuelve sus datos validados o sus errores:

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

Regístrala con `Route.websocket("/ws/contacts", contact_socket)` en el mismo módulo, importando `Route` desde `orionis.support.facades`. El mensaje contiene `{"email": "ada@example.com"}` directamente: este handler no utiliza el sobre `invoke` de Realtime.

## Servicios y otros adaptadores asíncronos

Cuando tu código ya obtuvo los datos de un comando, una tarea o un sistema externo, utiliza el validador desde ese método:

```python
from app.http.schemas.contact_schema import ContactSchema
from orionis.schemas.validator import Schema as Validator


class ContactService:
    async def preview(self, data: object) -> ContactSchema:
        return await Validator.validate(data, ContactSchema)
```

Desde otro método asíncrono puedes ejecutar `payload = await ContactService().preview(data)`. La misma API aplica las restricciones, espera las reglas y devuelve la instancia, o lanza `ValidationException`. Consulta [errores de validación](/es/validation/validation-and-errors).

Los jobs persistentes de Orionis serializan estado primitivo y sus colecciones, no instancias Schema. Conserva datos compatibles con ese serializador y valídalos explícitamente en `handle` si necesitas aplicar un contrato. La inyección HTTP del contenedor requiere una petición HTTP activa; no convierte por sí sola el estado de un job o los argumentos de un comando en un Schema.
