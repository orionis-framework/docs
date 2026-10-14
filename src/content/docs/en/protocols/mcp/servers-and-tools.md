---
title: "Building a server with typed tools"
description: "Tools receive contract-defined data and return content or typed values. Perform work through injected services; Server/Tool declarations hold static metadata, not mutable state…"
editUrl: true
lastUpdated: false
---

Tools receive contract-defined data and return content or typed values. Perform work through injected services; `Server`/`Tool` declarations hold static metadata, not mutable state from earlier calls.

## Declare your first tool

Save this importable module as `app/mcp/servers/demo_server.py`. The example keeps the tool and server together; you can later split tools into `app/mcp/tools` without changing their public names.

```python
from orionis.mcp import McpResponse, Server, Tool, ToolAnnotations
from orionis.schemas import Schema

class GreetInput(Schema):
    name: str

class GreetTool(Tool[GreetInput, str]):
    name = "greet"
    description = "Return a greeting."
    annotations = ToolAnnotations(read_only=True, destructive=False)

    def handle(self, payload: GreetInput) -> McpResponse:
        return McpResponse.structured(f"Hello, {payload.name}!")

class DemoServer(Server):
    name = "Demo"
    version = "1.0.0"
    tools = (GreetTool,)
```

Inferred names remove primitive suffixes and use kebab-case. Set `name` for a stable contract. Explicit names match `[A-Za-z0-9_.-]{1,128}`; duplicate names and invalid metadata fail compilation. Subclass `Tool`; it is not configured through `Tool(name=..., handler=...)`.

## Verify the greeting without a network server

Save this separate program as `check_greet.py` and run `uv run python check_greet.py` from the application root after installing its dependencies:

```python
import asyncio
from app.mcp.servers.demo_server import DemoServer
from orionis.container.container import Container
from orionis.test import McpTestClient

async def main():
    client = McpTestClient(Container(), DemoServer)
    result = await client.tool("greet", {"name": "Ada"})
    result.assertOk()
    result.assertTextContains("Hello, Ada!")
    print("Hello, Ada!")

if __name__ == "__main__":
    asyncio.run(main())
```

The program prints `Hello, Ada!`. Invalid input is rejected by the dispatcher before the handler runs. This checks the tool contract; it does not test HTTP authentication or client compatibility.

## Input, output and injection

`Tool[Input, Output]` declares validation and JSON Schema; `input` and `output` attributes are also available. Handlers may be synchronous or asynchronous. Orionis converts payloads, validates schemas and separately resolves services and `McpRequest`. Client keys cannot replace injected services with matching names.

Declared output is validated before serialization. Return `McpResponse.structured(value)` containing a compatible value; handlers must return `McpResponse` or response sequences rather than raw strings/dicts. Contract failures become protocol failures. Do not promise a response structure incompatible with the generic output type. The test client passes bytes through the dispatcher, exercising actual serialization rather than calling the method directly.

## Availability and authorization

Add `shouldRegister(self, request: McpRequest) -> bool` for request-specific visibility and `authorize(...) -> bool` for access. The actual hook name is **shouldRegister**, not `available`. Both run during listing and direct invocation; hiding a tool does not leave an unchecked direct path.

For example, place this hook inside a tool that must require identity:

```python
from orionis.mcp import McpRequest

def authorize(self, request: McpRequest) -> bool:
    return request.identity is not None
```

This only requires an authenticated identity. Use your authorization services as well when the tool reads a particular account or changes protected data.

`request.identity` and `request.authentication` expose context identity; `client_capabilities` contains only this call's declarations. Requests are immutable snapshots, including nested mappings. Injected services retain their own concurrency rules; do not retain calls in singleton services.

`ToolAnnotations` describes read-only, destructive, idempotent and open-world behavior. These are client hints: they do not authorize actions or make transactions idempotent. Return `McpResponse.error(message)` for expected business failures; unexpected failures are sanitized before reaching clients.

## Application registration

During application boot use `Mcp.web("/mcp/demo", DemoServer)` or `Mcp.local("demo", DemoServer)`, importing Mcp from `orionis.support.facades`. The manager compiles once per class and retains immutable definitions; handlers are constructed in call scopes. Read [transports](/en/protocols/mcp/transports-and-configuration) for headers and endpoint protection.
