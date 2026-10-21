---
title: "MCP tools"
description: "Generate tools with schemas, typed output, injection, access hooks and dispatcher-validated error responses."
editUrl: true
lastUpdated: false
---

An MCP tool exposes an application operation with contract-defined arguments. Clients discover its name, description and JSON Schema through `tools/list`, then execute it with `tools/call`. A tool may read data or perform actions: its effect depends on your implementation and access checks.

## Generate a tool

Run either alternative from the application root:

```bash
orionis make:mcp-tool echo
python -B reactor make:mcp-tool echo
```

The required argument is `name`; `-h`/`--help` displays help. It creates `app/mcp/tools/echo_tool.py` with `EchoToolInput` and `EchoTool`. There are no additional generator options. The actual template is:

```python
from orionis.mcp import McpResponse, Tool
from orionis.schemas import Schema

class EchoToolInput(Schema):
    """Arguments controlled by the MCP client."""

    message: str

class EchoTool(Tool[EchoToolInput]):
    """Describe the work performed by this tool."""

    description = "Echo the provided message."
    input = EchoToolInput

    async def handle(self, payload: EchoToolInput) -> McpResponse:
        """
        Process the validated input message.

        Parameters
        ----------
        payload : EchoToolInput
            Validated arguments supplied by the MCP client.

        Returns
        -------
        McpResponse
            Text response containing the input message.
        """
        return McpResponse.text(payload.message)
```

`EchoToolInput` declares client-controlled arguments. `input` identifies the contract, also expressed by `Tool[EchoToolInput]`. `handle()` receives the validated payload and returns an `McpResponse`. The stub returns text, without a typed output contract.

Nested names such as `support/find_ticket` are supported; see the [generation and overwrite rules](/en/protocols/mcp/servers-and-tools#generate-a-server-declaration). Creating a file does not publish the tool: add its class to `Server.tools`.

## Define input and output contracts

In `app/mcp/tools/greet_tool.py`, this complete example returns a typed `str` output:

```python
from orionis.mcp import McpResponse, Tool, ToolAnnotations
from orionis.schemas import Schema


class GreetInput(Schema):
    name: str


class GreetTool(Tool[GreetInput, str]):
    name = "greet"
    title = "Greet a user"
    description = "Return a friendly greeting for the supplied name."
    annotations = ToolAnnotations(
        read_only=True,
        destructive=False,
        idempotent=True,
        open_world=False,
    )

    async def handle(self, payload: GreetInput) -> McpResponse:
        if not payload.name.strip():
            return McpResponse.error("Provide a nonempty name.")
        return McpResponse.structured(f"Hello, {payload.name}!")
```

Register `GreetTool` in your server's `tools` tuple. The [example server](/en/protocols/mcp/servers-and-tools#a-complete-first-mcp-application) includes that registration and its HTTP endpoint.

| Declaration | Effect |
| --- | --- |
| `Tool[Input]` | Declares validated input; does not require a typed structured output. |
| `Tool[Input, Output]` | Declares input and output. Successful calls must provide compatible `structuredContent`. |
| `input = Input` / `output = Output` | Explicit contract declarations. Non-null attributes take precedence over generics. |
| `Tool` without input | Only accepts an empty arguments object; the handler receives no payload. |

Input is processed using native schemas and [validation rules](/en/validation). Handlers may be synchronous or `async`; use `async` when awaiting asynchronous services. Declaring `async` does not by itself prevent blocking work inside the method from blocking the event loop.

### Structured responses

`McpResponse.structured(value)` includes the JSON value in `structuredContent` and its JSON representation as text in `content`. It may be a string, object, list or another allowed JSON value. To return an object with an output contract:

```python
from orionis.mcp import McpResponse, Tool
from orionis.schemas import Schema


class SummaryInput(Schema):
    values: list[float]


class SummaryOutput(Schema):
    count: int
    total: float


class SummaryTool(Tool[SummaryInput, SummaryOutput]):
    name = "summarize"

    async def handle(self, payload: SummaryInput) -> McpResponse:
        return McpResponse.structured({
            "count": len(payload.values),
            "total": sum(payload.values, 0.0),
        })
```

A call with `{"values": [2.5, 3.5]}` returns `{"count": 2, "total": 6.0}` as structured content. The dispatcher validates that output before serialization. A `McpResponse` return annotation does not convert a directly returned `dict` into a response: return an explicit response object. A successful text-only response does not satisfy a declared typed output contract.

Ordinary handlers return `McpResponse` or a list/tuple of those objects; complete protocol responses are also accepted when they satisfy the method and its validation. At most one structured result may be present among the contents. See [responses and content](/en/protocols/mcp/responses-and-content) for images, audio, links, metadata and progress.

## Services in the constructor and method

The dispatcher builds a tool instance through the container and separately resolves typed `handle()` dependencies. This complete module can replace the quick start's `app/mcp/servers/demo_server.py`:

```python
from orionis.mcp import (
    McpResponse, Prompt, PromptArgument, Resource, Server, Tool,
)
from orionis.schemas import Schema


class GreetingService:
    def greet(self, name: str) -> str:
        return f"Hello, {name}!"


class NameFormatter:
    def normalize(self, name: str) -> str:
        return name.strip()


class GreetInput(Schema):
    name: str


class GreetTool(Tool[GreetInput, str]):
    name = "greet"
    description = "Return a greeting."

    def __init__(self, greetings: GreetingService) -> None:
        self.greetings = greetings

    async def handle(
        self,
        payload: GreetInput,
        names: NameFormatter,
    ) -> McpResponse:
        name = names.normalize(payload.name)
        return McpResponse.structured(self.greetings.greet(name))


class GreetingResource(Resource):
    name = "greeting"
    uri_template = "demo://greetings/{name}"
    mime_type = "text/plain"

    def __init__(self, greetings: GreetingService) -> None:
        self.greetings = greetings

    def handle(self, name: str, names: NameFormatter) -> McpResponse:
        return McpResponse.text(self.greetings.greet(names.normalize(name)))


class GreetingPrompt(Prompt):
    name = "greeting"
    arguments = (PromptArgument(name="name", required=True),)

    def __init__(self, greetings: GreetingService) -> None:
        self.greetings = greetings

    async def handle(self, name: str, names: NameFormatter) -> McpResponse:
        greeting = self.greetings.greet(names.normalize(name))
        return McpResponse.text(greeting).asUser()


class DemoServer(Server):
    name = "Demo"
    tools = (GreetTool,)
    resources = (GreetingResource,)
    prompts = (GreetingPrompt,)
```

`greetings` is resolved while constructing the component; `names` is resolved when invoking the method. These concrete classes require no additional binding. The client sends only `{"name": "Ada"}`: `names` is not part of the payload or JSON Schema. A payload key cannot replace an injected service with the same name.

The resource and prompt demonstrate the same constructor and method injection. URI variables and prompt arguments are supplied by name; they are not tool input schemas. Services and `McpRequest` can also be injected into typed hooks. For abstract contracts and shared lifetimes, see the [service container](/en/architecture/service-container/bindings-and-invocation).

### Request context

`McpRequest` exposes `id`, `method`, `server_id`, `transport`, `arguments`, `params`, `meta`, `uri`, `uri_variables`, `input_responses`, `request_state`, `identity`, `authentication` and `client_capabilities`. Context mappings are immutable snapshots, including nested values. Capabilities belong to the current request, not a remembered session.

An HTTP `Request` parameter resolves only on the HTTP transport; use `McpRequest` for components shared with STDIO. Parameters without a valid source fail during compilation. Handlers cannot accept `*args` or `**kwargs`. Defaults on ordinary parameters are used as defaults; they do not declare additional tool arguments outside the input contract.

Instances are also built during listings to check visibility. Avoid business side effects in constructors and previous-call state in singleton services.

## Visibility and authorization

The optional hooks are `shouldRegister()` and `authorize()`. The first decides whether a component is available; the second decides whether the identity may access it. Both run during listing and direct invocation:

```python
from orionis.mcp import McpRequest, McpResponse, Tool
from orionis.schemas import Schema


class PrivateInput(Schema):
    message: str


class PrivateTool(Tool[PrivateInput]):
    name = "private-message"

    def shouldRegister(self, request: McpRequest) -> bool:
        return request.identity is not None

    async def authorize(self, request: McpRequest) -> bool:
        return request.identity is not None

    async def handle(self, payload: PrivateInput) -> McpResponse:
        return McpResponse.text(payload.message)
```

Add `PrivateTool` to the server and configure real transport authentication to obtain an identity. This example requires an identity, but an operation on accounts or documents must also check the specific permission through application services.

When `shouldRegister()` returns false, the component is omitted from listings and direct invocation reports unknown or unavailable. When `authorize()` returns false, it is also omitted from listings, but direct invocation is rejected for authorization. Hiding a tool does not leave an unchecked direct-access path.

## Metadata and annotations

| Field | Use |
| --- | --- |
| `name` | Stable public identifier. If omitted, the class name loses its `Tool` suffix and becomes kebab-case. |
| `title`, `description` | Display name and operation description for clients. |
| `icons`, `meta`, `cache` | Icons, additional metadata and declared freshness; `cache` does not memoize server results. |
| `annotations` | `ToolAnnotations` with `title`, `read_only`, `destructive`, `idempotent` and `open_world`. |

Explicit names accept `[A-Za-z0-9_.-]{1,128}`. Duplicate names in a tool catalog fail compilation. Annotations are client hints: `read_only=True` does not prevent writes and `idempotent=True` does not implement deduplication. Enforce those guarantees in your services.

## Errors and validation

- Arguments violating the contract return a tool result with `isError: true` and the safe message `Invalid tool arguments`; `handle()` is not executed.
- For an expected business failure, return `McpResponse.error("safe message")`. Error results do not have to satisfy the success output schema.
- An unexpected handler or output failure is reported and returns `isError: true` with `Tool execution failed`, without exposing a traceback.
- An unknown name, authorization problem or invalid JSON-RPC envelope belongs to the protocol layer; it differs from a tool result with `isError`.

The [HTTP guide](/en/protocols/mcp/http-and-clients) shows how clients distinguish `error` from `result.isError`.

## Check the contract without a network server

Save this program as `check_greet.py`, using `DemoServer` from either complete example, then run `python -B check_greet.py` in the project environment:

```python
import asyncio

from app.mcp.servers.demo_server import DemoServer
from orionis.container.container import Container
from orionis.test import McpTestClient


async def main() -> None:
    client = McpTestClient(Container(), DemoServer)
    result = await client.tool("greet", {"name": "Ada"})
    result.assertOk()
    assert result.message["result"]["structuredContent"] == "Hello, Ada!"
    result.assertTextContains("Hello, Ada!")


if __name__ == "__main__":
    asyncio.run(main())
```

`asyncio.run()` is used here as the entry point of a verification program; do not add it inside an asynchronous handler. `McpTestClient` traverses decoding, scopes, invocation and JSON-RPC serialization. An isolated container is sufficient for these concrete services; to check your application's bindings, use its container and the [MCP testing guide](/en/testing/mcp-testing). This test does not verify HTTP authentication or external client compatibility.
