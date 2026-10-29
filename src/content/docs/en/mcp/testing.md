---
title: "Testing MCP tools in process"
description: "Save the complete module below as tests/integration/test_greeting_mcp.py in your generated project (create the directories if necessary). Its server declaration is local to the…"
editUrl: true
lastUpdated: false
---

Save the complete module below as `tests/integration/test_greeting_mcp.py` in your generated project (create the directories if necessary). Its server declaration is local to the test: it does not require adding an HTTP route or running a separate MCP server.

The MCP client sends encoded JSON-RPC through the real dispatcher and opens a new scope for each call. It integrates the protocol and container without sockets. It does not replace testing an HTTP proxy, allowed origin, or stdio transport. The following server declaration belongs in the test module and runs through the Orionis runner.

## Examples

### Exercise a real MCP tool

```python
from orionis.mcp import McpResponse, Server, Tool
from orionis.schemas import Schema
from orionis.test import TestCase

class GreetingInput(Schema):
    name: str

class HelloTool(Tool[GreetingInput]):
    name = "hello"

    def handle(self, payload: GreetingInput) -> McpResponse:
        return McpResponse.text(f"Hello, {payload.name}")

class GreetingServer(Server):
    name = "greetings"
    tools = (HelloTool,)

class TestGreetingServer(TestCase):
    async def testHello(self) -> None:
        client = await self.mcp(GreetingServer)
        response = await client.tool("hello", {"name": "Ada"})
        response.assertOk()
        response.assertTextContains("Hello, Ada")
```

## Run and interpret the test

```shell
uv run python -B reactor test --start-dir tests/integration --file-pattern "test_greeting_mcp.py"
```

Expect one passing test and exit code 0. `assertOk()` rejects JSON-RPC errors and tool results marked `isError=True`; `assertTextContains()` checks the returned text content. The tool must return `McpResponse`, not a raw Python dictionary or string. To test an existing application tool, import its real server class instead of declaring the example server and call the tool with representative input.

## Inspect an HTTP server in the browser

Use [Orionis MCP Inspector](https://inspector.orionis-framework.com/) to check a deployed HTTP endpoint alongside your in-process tests. The inspector runs entirely in your browser and sends requests directly to the endpoint you choose, without an intermediary proxy. It supports stateless MCP `2026-07-28`; it does not launch STDIO processes.

1. Publish your server using the [HTTP transport](/en/mcp/http-and-clients).
2. Check that MCP's `allowed_origins` includes `https://inspector.orionis-framework.com`. The editable `config/mcp.py` in 1.0.16 supplies this default only when `CORS_ALLOW_ORIGINS` is unset. In an existing application, update that local configuration or set the environment variable as shown below; upgrading the package does not rewrite your editable file.
3. Configure [HTTP CORS](/en/http/middleware#http-cors) to allow the same origin, `POST`, and the headers required by your requests, including MCP headers and authentication when used. The browser handles the `OPTIONS` preflight; the server must answer it without requiring the POST's credentials.
4. Open the inspector, enter your endpoint, configure authentication if needed, and connect to discover the server's capabilities.
5. Run **Run All Safe Tests** to collect protocol and schema diagnostics, coverage, and observed request latency. This action does not automatically call tools. Execute a tool manually only after reviewing its arguments and possible effects.
6. Inspect request and response details, then export a JSON, HTML, or PDF report generated locally in the browser.

To select the inspector explicitly through the shared environment variable:

```dotenv
CORS_ALLOW_ORIGINS=["https://inspector.orionis-framework.com"]
```

This replaces the default list; include any other trusted browser origins you need. Use only the origin, without a trailing slash or `/es/` path, regardless of the inspector's language. HTTP CORS accepts `"*"`, but MCP rejects that wildcard as invalid configuration. An explicit `[]` rejects every MCP request carrying `Origin`; requests without that header remain allowed by the origin check. See [MCP configuration](/en/mcp/stdio-and-configuration) for defaults and validation.

A browser network error can indicate CORS, DNS, TLS, or another connectivity problem; it does not establish that the MCP server is invalid. A successful cURL request also does not verify CORS. Review the coverage and production readiness status: **Not Verified** means there is insufficient evidence, even if some checks passed. Browser latency includes the network and client, not only server processing.

## Reference and next steps

[mcp.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/test/clients/mcp.py) · [case.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/test/cases/case.py)

[Return to the module index](/en/testing).
