---
title: "Respuestas y contenido MCP"
description: "Texto, JSON validado, imágenes, audio, recursos y errores: cómo construir respuestas MCP y aplicar metadata, anotaciones y caché."
editUrl: true
lastUpdated: false
---

Los componentes MCP devuelven contenido mediante `McpResponse`, importado desde `orionis.mcp`. El dispatcher lo transforma en el resultado adecuado para una herramienta, un recurso o un prompt y lo envuelve en JSON-RPC. No devuelvas respuestas HTTP, strings ni diccionarios sin envolver desde `handle()`.

Un handler puede devolver un `McpResponse` o una lista/tupla de ellos. `withMeta()`, `withContentMeta()`, `withAnnotations()`, `asUser()` y `asAssistant()` construyen una nueva respuesta, sin modificar la original.

## Elegir la respuesta adecuada

| Constructor | Uso |
| --- | --- |
| `McpResponse.text(value)` | Una explicación, confirmación o mensaje de un prompt. |
| `McpResponse.structured(value)` | Datos JSON y su representación textual. |
| `McpResponse.image(value, mime_type)` | Bytes de imagen, codificados una vez en Base64. |
| `McpResponse.audio(value, mime_type)` | Bytes de audio, codificados una vez en Base64. |
| `McpResponse.resource(uri, value, mime_type=None)` | Contenido de un recurso incluido en la respuesta. |
| `McpResponse.resourceLink(uri, name, ...)` | Referencia a un recurso cuyo contenido se obtiene por separado. |
| `McpResponse.error(message)` | Fallo esperado de herramienta con `isError=True`. |
| `McpResponse.progress(current, total=None, message=None)` | Progreso emitido desde un generador: consulta [flujos avanzados](/es/mcp/advanced-workflows). |

El componente determina la forma final:

- Una **Tool** produce `result.content`, un posible `result.structuredContent` y `result.isError`.
- Un **Resource** produce `result.contents`, con recursos de texto o blobs. No admite devolver directamente bloques de imagen/audio: utiliza un recurso binario con su MIME.
- Un **Prompt** produce `result.messages`; cada bloque conserva el rol `user` o `assistant` de su respuesta.

## Texto y varios bloques

Esta herramienta devuelve una explicación y una referencia que el cliente puede leer posteriormente:

```python
from orionis.mcp import McpResponse, Tool


class ReportSummaryTool(Tool):
    name = "report-summary"
    description = "Describe the latest report and link to its source."

    async def handle(self) -> list[McpResponse]:
        return [
            McpResponse.text("The latest report contains 12 completed orders."),
            McpResponse.resourceLink(
                "reports://latest",
                "latest-report",
                title="Latest report",
                description="Read the complete report.",
                mime_type="application/json",
            ),
        ]
```

`resourceLink()` no registra ni lee el destino. Si este servidor debe resolver `reports://latest`, declara también el `Resource` en `Server.resources`. Consulta [recursos](/es/mcp/resources).

## JSON y esquemas de salida

Utiliza `structured()` para conservar tipos JSON: objetos, listas, strings, números finitos, booleanos o `None`. Incluye el valor en `structuredContent` y un bloque textual con su JSON serializado.

El siguiente ejemplo declara esquemas de entrada y salida. Orionis valida la salida antes de publicar un resultado correcto, incluidas las reglas asíncronas del esquema:

```python
from orionis.mcp import McpResponse, Tool
from orionis.schemas import Schema


class OrderSummaryInput(Schema):
    order_id: int


class OrderSummaryOutput(Schema):
    order_id: int
    status: str
    total: float


class OrderSummaryTool(Tool[OrderSummaryInput, OrderSummaryOutput]):
    name = "order-summary"
    description = "Return a typed order summary."

    async def handle(self, payload: OrderSummaryInput) -> McpResponse:
        return McpResponse.structured({
            "order_id": payload.order_id,
            "status": "ready",
            "total": 42.5,
        })
```

Para `order_id=42`, el resultado contiene:

```json
{
  "resultType": "complete",
  "content": [
    {
      "type": "text",
      "text": "{\"order_id\":42,\"status\":\"ready\",\"total\":42.5}"
    }
  ],
  "structuredContent": {
    "order_id": 42,
    "status": "ready",
    "total": 42.5
  },
  "isError": false
}
```

El fragmento omite la metadata del servidor y el sobre JSON-RPC. Declarar un esquema de salida exige contenido estructurado: un `text()` con aspecto de JSON no lo sustituye. Solo se permite **un** resultado estructurado por llamada; puedes acompañarlo de otros bloques. Un resultado marcado como error no se valida contra el esquema de salida de éxito.

`structured()` normaliza tipos compatibles con msgspec, incluidos `Schema`, `msgspec.Struct`, dataclasses, enums, fechas, UUID y `Decimal`, respetando aliases y opciones de serialización. Rechaza valores no finitos, claves JSON que no sean strings, binarios anidados y objetos no soportados.

## Imágenes y audio

Proporciona bytes originales y el MIME de su formato. Los builders aplican Base64; no pases un string ya codificado en Base64.

```python
import asyncio

from orionis.mcp import McpResponse, Tool
from orionis.support.facades import Storage


class BrandAssetsTool(Tool):
    name = "brand-assets"
    description = "Return the bundled logo and welcome audio."

    async def handle(self) -> list[McpResponse]:
        disk = Storage.disk("local")
        logo, audio = await asyncio.gather(
            disk.file("brand/logo.png").read(),
            disk.file("brand/welcome.wav").read(),
        )
        return [
            McpResponse.image(logo, "image/png"),
            McpResponse.audio(audio, "audio/wav"),
        ]
```

El ejemplo se ejecuta en la aplicación iniciada y requiere `brand/logo.png` y `brand/welcome.wav` en el disco `local`. Las rutas son relativas a la raíz configurada para ese disco, sin anteponer `storage/app`. Las lecturas utilizan la API asíncrona de `Storage` y se ejecutan en paralelo. Para otro disco configurado, cambia el nombre pasado a `disk()`; consulta [Storage](/es/storage).

`McpResponse.image()` y `audio()` reciben los bytes leídos; no buscan archivos ni descargan URLs. Estas lecturas reúnen cada archivo completo en memoria, por lo que debes respetar el límite de respuesta MCP.

## Recursos de texto, JSON y binarios

Un recurso embebido incluye su URI y contenido. El MIME selecciona la representación:

```python
import base64

import msgspec

from orionis.mcp import McpResponse


value = {"ready": True, "count": 2}
json_resource = McpResponse.resource(
    "reports://status", value, "application/json",
)
packed_resource = McpResponse.resource(
    "reports://status", value, "application/msgpack",
)
csv_resource = McpResponse.resource(
    "reports://orders.csv", "id,status\n42,ready\n", "text/csv",
)

assert msgspec.json.decode(json_resource.content[0].resource.text) == value
assert msgspec.msgpack.decode(
    base64.b64decode(packed_resource.content[0].resource.blob),
) == value
assert csv_resource.content[0].resource.text.startswith("id,status")
```

- Los datos estructurados sin MIME usan `application/json`.
- JSON y subtipos `application/*+json` se serializan como texto UTF-8.
- `application/msgpack`, `application/x-msgpack`, `application/vnd.msgpack` y subtipos `application/*+msgpack` se serializan como blob Base64.
- Para otros MIME, proporciona texto o bytes ya codificados. Un diccionario con `text/csv` no se convierte automáticamente en CSV.
- Un string JSON ya codificado se conserva como texto. Un string con MIME MessagePack se codifica como un valor string de MessagePack. Los buffers binarios se conservan como bytes antes de aplicar Base64.

La selección del codec ignora mayúsculas y parámetros, pero conserva el MIME declarado. Estos formatos afectan al contenido; el transporte sigue utilizando sobres JSON-RPC JSON.

Al implementar un `Resource`, `mime_type` se aplica a `text()` y `structured()`. Con MIME MessagePack, `structured()` conserva el valor original para codificarlo en binario. Un `resource()` explícito conserva su URI y MIME propios.

## Mensajes de prompts

El rol predeterminado es `user`. Utiliza `asAssistant()` para proporcionar un ejemplo de respuesta del asistente:

```python
from orionis.mcp import McpResponse, Prompt, PromptArgument


class ReviewOrderPrompt(Prompt):
    name = "review-order"
    arguments = (PromptArgument(name="summary", required=True),)

    async def handle(self, summary: str) -> list[McpResponse]:
        return [
            McpResponse.text("Summarize the order and identify missing data.")
            .asUser(),
            McpResponse.text("I will check totals, status and delivery details.")
            .asAssistant(),
            McpResponse.text(summary).asUser(),
        ]
```

Orionis genera un mensaje por bloque de contenido, en el orden devuelto. Estos métodos asignan roles al prompt; no ejecutan un modelo ni cambian permisos. Consulta [prompts](/es/mcp/prompts).

## Errores esperados y errores del protocolo

Devuelve `error()` cuando una herramienta pueda explicar un fallo de negocio de forma segura:

```python
from orionis.mcp import McpResponse, Tool
from orionis.schemas import Schema


class OrderLookupInput(Schema):
    order_id: int


class FindOrderTool(Tool[OrderLookupInput]):
    name = "find-order"

    async def handle(self, payload: OrderLookupInput) -> McpResponse:
        if payload.order_id != 42:
            return McpResponse.error("Order not found.")
        return McpResponse.structured({"order_id": 42, "status": "ready"})
```

La llamada sigue siendo un resultado JSON-RPC, con `result.isError=true` y el mensaje en `content`. El cliente debe comprobar ese campo además de la presencia de `error` en el sobre.

La validación fallida de argumentos de una herramienta produce `isError=true` con `Invalid tool arguments`. Una excepción inesperada durante su ejecución se reporta al manejador de excepciones de la aplicación y se presenta como `Tool execution failed`. En recursos y prompts, una excepción inesperada produce el error JSON-RPC `-32603`. Los parámetros de protocolo inválidos, los métodos desconocidos y el acceso denegado siguen sus propias rutas de error.

## Metadata y anotaciones de contenido

Utiliza claves con un namespace de tu aplicación. Distingue metadata del resultado y de cada bloque:

```python
from orionis.mcp import ContentAnnotations, McpResponse


original = McpResponse.structured({"order_id": 42, "status": "ready"})
annotated = (
    original
    .withMeta({"example.org/trace": "order-42"})
    .withContentMeta({"example.org/source": "orders"})
    .withAnnotations(ContentAnnotations(
        audience=("assistant",),
        priority=0.8,
        last_modified="2026-10-21T12:00:00Z",
    ))
)

assert original.meta == {}
assert annotated.meta["example.org/trace"] == "order-42"
assert annotated.content[0].meta["example.org/source"] == "orders"
```

`withMeta()` llega a `result._meta`. `withContentMeta()` añade `_meta` a cada bloque. `withAnnotations()` aplica `audience`, `priority` y `lastModified` a todos los bloques; `priority` está entre 0 y 1. Son indicaciones para el cliente; no reemplazan autorización ni validación.

Al combinar respuestas, sus metadatos de resultado se reúnen. Repetir una clave con valores diferentes provoca un error; utiliza el mismo valor o claves distintas. La metadata de aplicación no puede sobrescribir claves reservadas del protocolo. `MCP_MAX_METADATA_SIZE` limita la metadata del resultado y `MCP_MAX_RESPONSE_SIZE` la respuesta codificada completa.

## Anotaciones de herramientas, iconos y caché

Estas declaraciones describen una herramienta de consulta sin efectos y un recurso de catálogo público:

```python
from orionis.mcp import (
    CacheHint,
    Icon,
    McpResponse,
    Resource,
    Tool,
    ToolAnnotations,
)


class StoreHoursTool(Tool):
    name = "store-hours"
    annotations = ToolAnnotations(
        read_only=True,
        destructive=False,
        idempotent=True,
        open_world=False,
    )

    async def handle(self) -> McpResponse:
        return McpResponse.text("Monday to Friday, 09:00–17:00 UTC.")


class PublicCatalogResource(Resource):
    name = "public-catalog"
    uri = "catalog://public"
    mime_type = "application/json"
    cache = CacheHint(ttl_ms=30_000, scope="public")
    icons = (Icon(src="https://example.org/catalog.svg", mime_type="image/svg+xml"),)

    async def handle(self) -> McpResponse:
        return McpResponse.structured({"categories": ["books", "music"]})
```

`ToolAnnotations` expone `readOnlyHint`, `destructiveHint`, `idempotentHint` y `openWorldHint`. No impone esas propiedades durante la ejecución: la implementación y sus políticas deben cumplirlas. `Icon` acepta HTTPS o data URI; Orionis publica la referencia sin descargarla.

`CacheHint` informa al cliente mediante `ttlMs` y `cacheScope` en resultados que admiten caché: discovery, listados y lecturas de recursos. No crea una caché en el servidor ni añade esos campos a un resultado ordinario de `tools/call`. Sus valores predeterminados son `ttl_ms=0` y `scope="private"`; el TTL debe ser un entero no negativo.

Declara `public` únicamente si el contenido puede compartirse entre identidades. Orionis fuerza TTL cero y ámbito privado en lecturas de continuación con `inputResponses` o `requestState`, pero no deduce si otros datos dependen del usuario. Consulta [configuración y límites](/es/mcp/stdio-and-configuration).

## Resultados de protocolo explícitos

Para integraciones que ya construyan tipos del protocolo, el dispatcher también admite devolver directamente el resultado correspondiente al método: `CallToolResult` en herramientas, `ReadResourceResult` en recursos y `GetPromptResult` en prompts. Se importan desde `orionis.mcp.protocol.results` y siguen sujetos a validación y límites.

```python
from orionis.mcp import Tool
from orionis.mcp.protocol.content import TextContent
from orionis.mcp.protocol.results import CallToolResult


class ExplicitResultTool(Tool):
    name = "explicit-result"

    async def handle(self) -> CallToolResult:
        return CallToolResult(
            content=(TextContent(text="Ready"),),
            structuredContent={"ready": True},
            isError=False,
            meta={"example.org/source": "integration"},
        )
```

Este caso no permite devolver un diccionario con esos campos ni un tipo de resultado de otro método. Una herramienta con esquema de salida también debe aportar `structuredContent` válido al usar `CallToolResult`. Para código habitual de aplicación, `McpResponse` evita construir manualmente las estructuras específicas de cada operación. Las continuaciones con `InputRequiredResult` se explican en [flujos avanzados](/es/mcp/advanced-workflows).
