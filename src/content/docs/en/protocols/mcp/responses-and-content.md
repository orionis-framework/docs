---
title: "MCP responses and content"
description: "Text, validated JSON, images, audio, resources and errors: build MCP responses with metadata, annotations and cache hints."
editUrl: true
lastUpdated: false
---

MCP components return content through `McpResponse`, imported from `orionis.mcp`. The dispatcher transforms it into the appropriate result for a tool, resource or prompt, then wraps it in JSON-RPC. Do not return HTTP responses, bare strings or bare dictionaries from `handle()`.

A handler can return one `McpResponse` or a list/tuple of them. `withMeta()`, `withContentMeta()`, `withAnnotations()`, `asUser()` and `asAssistant()` construct new responses without modifying the original.

## Choosing a response

| Constructor | Purpose |
| --- | --- |
| `McpResponse.text(value)` | An explanation, confirmation or prompt message. |
| `McpResponse.structured(value)` | JSON data and its textual representation. |
| `McpResponse.image(value, mime_type)` | Image bytes encoded once as Base64. |
| `McpResponse.audio(value, mime_type)` | Audio bytes encoded once as Base64. |
| `McpResponse.resource(uri, value, mime_type=None)` | Resource content embedded in the response. |
| `McpResponse.resourceLink(uri, name, ...)` | Reference to a resource retrieved separately. |
| `McpResponse.error(message)` | Expected tool failure with `isError=True`. |
| `McpResponse.progress(current, total=None, message=None)` | Progress yielded from a generator: see [advanced workflows](/en/protocols/mcp/advanced-workflows). |

The component determines the final shape:

- A **Tool** produces `result.content`, optional `result.structuredContent` and `result.isError`.
- A **Resource** produces `result.contents` containing text or blob resources. It cannot directly return image/audio blocks: use a binary resource with its MIME type.
- A **Prompt** produces `result.messages`; each block retains its response's `user` or `assistant` role.

## Text and multiple blocks

This tool returns an explanation and a reference the client can read later:

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

`resourceLink()` neither registers nor reads its destination. If this server should resolve `reports://latest`, also declare the `Resource` in `Server.resources`. See [resources](/en/protocols/mcp/resources-and-prompts).

## JSON and output schemas

Use `structured()` to preserve JSON types: objects, lists, strings, finite numbers, booleans or `None`. It includes the value in `structuredContent` and a text block containing serialized JSON.

The following example declares input and output schemas. Orionis validates output before publishing a successful result, including asynchronous schema rules:

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

For `order_id=42`, the result contains:

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

This fragment omits server metadata and the JSON-RPC envelope. Declaring an output schema requires structured content: a `text()` containing JSON does not replace it. Only **one** structured result is allowed per call; additional blocks can accompany it. A result marked as an error is not validated against the successful output schema.

`structured()` normalizes msgspec-compatible types, including `Schema`, `msgspec.Struct`, dataclasses, enums, dates, UUIDs and `Decimal`, honoring aliases and serialization options. It rejects nonfinite values, non-string JSON keys, nested binary values and unsupported objects.

## Images and audio

Supply original bytes and the MIME type of their format. Builders apply Base64; do not supply an already encoded Base64 string.

```python
import asyncio
from pathlib import Path

from orionis.mcp import McpResponse, Tool


class BrandAssetsTool(Tool):
    name = "brand-assets"
    description = "Return the bundled logo and welcome audio."

    async def handle(self) -> list[McpResponse]:
        logo, audio = await asyncio.gather(
            asyncio.to_thread(Path("storage/app/brand/logo.png").read_bytes),
            asyncio.to_thread(Path("storage/app/brand/welcome.wav").read_bytes),
        )
        return [
            McpResponse.image(logo, "image/png"),
            McpResponse.audio(audio, "audio/wav"),
        ]
```

This example requires those files in your project and delegates their reads to threads to avoid blocking the event loop. The application chooses paths: MCP builders do not search for files or download URLs. For remote storage, obtain bytes through your storage service. This API does not automatically chunk large files; respect the configured response limit.

## Text, JSON and binary resources

An embedded resource includes its URI and content. The MIME type selects its representation:

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

- Structured data without a MIME type uses `application/json`.
- JSON and `application/*+json` subtypes become UTF-8 text.
- `application/msgpack`, `application/x-msgpack`, `application/vnd.msgpack` and `application/*+msgpack` subtypes become Base64 blobs.
- Other MIME types require already encoded text or bytes. A dictionary with `text/csv` is not automatically converted to CSV.
- Already encoded JSON strings remain text. A string with a MessagePack MIME type is encoded as a MessagePack string value. Binary buffers remain bytes before Base64 encoding.

Codec selection ignores case and parameters while retaining the declared MIME type. These formats affect content; transport envelopes remain JSON-RPC JSON.

When implementing a `Resource`, `mime_type` applies to `text()` and `structured()`. With MessagePack MIME, `structured()` preserves the original value for binary encoding. An explicit `resource()` retains its own URI and MIME type.

## Prompt messages

The default role is `user`. Use `asAssistant()` to provide an example assistant reply:

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

Orionis creates one message per content block, preserving order. These methods assign prompt roles; they do not invoke a model or change permissions. See [prompts](/en/protocols/mcp/prompts).

## Expected failures and protocol errors

Return `error()` when a tool can safely explain a business failure:

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

The call remains a JSON-RPC result, with `result.isError=true` and the message in `content`. Clients must check that field as well as an envelope-level `error`.

Failed tool argument validation produces `isError=true` with `Invalid tool arguments`. Unexpected exceptions during tool execution are reported to the application's exception handler and presented as `Tool execution failed`. Unexpected resource or prompt exceptions produce JSON-RPC error `-32603`. Invalid protocol parameters, unknown methods and denied access follow their own error paths.

## Metadata and content annotations

Use keys namespaced to your application. Distinguish result metadata from per-block metadata:

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

`withMeta()` becomes `result._meta`. `withContentMeta()` adds `_meta` to each block. `withAnnotations()` applies `audience`, `priority` and `lastModified` to every block; `priority` ranges from 0 to 1. These are hints for clients and do not replace authorization or validation.

Result metadata is merged when combining responses. Repeating a key with different values fails; use the same value or distinct keys. Application metadata cannot overwrite reserved protocol keys. `MCP_MAX_METADATA_SIZE` bounds result metadata and `MCP_MAX_RESPONSE_SIZE` bounds the complete encoded response.

## Tool annotations, icons and caching

These declarations describe a query tool without side effects and a public catalog resource:

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

`ToolAnnotations` exposes `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. It does not enforce those properties at runtime: implementation and policies must uphold them. `Icon` accepts HTTPS or data URIs; Orionis publishes the reference without downloading it.

`CacheHint` informs clients through `ttlMs` and `cacheScope` on cacheable results: discovery, listings and resource reads. It neither creates a server cache nor adds those fields to an ordinary `tools/call` result. Defaults are `ttl_ms=0` and `scope="private"`; TTL must be a nonnegative integer.

Declare `public` only when content can be shared between identities. Orionis forces zero TTL and private scope on continuation reads with `inputResponses` or `requestState`, but it does not infer whether other data depends on the user. See [configuration and limits](/en/protocols/mcp/transports-and-configuration).

## Explicit protocol results

For integrations that already construct protocol types, the dispatcher also accepts a direct result matching the method: `CallToolResult` for tools, `ReadResourceResult` for resources and `GetPromptResult` for prompts. Import them from `orionis.mcp.protocol.results`; validation and limits still apply.

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

This does not permit returning a dictionary with those fields or a different method's result type. A tool declaring an output schema must also supply valid `structuredContent` when using `CallToolResult`. For ordinary application code, `McpResponse` avoids manually constructing operation-specific structures. Continuations using `InputRequiredResult` are explained in [advanced workflows](/en/protocols/mcp/advanced-workflows).
