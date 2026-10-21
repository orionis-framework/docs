---
title: "MCP prompts"
description: "Generate MCP prompts with text arguments, role-based messages, injection, access checks and completions."
editUrl: true
lastUpdated: false
---

An MCP prompt constructs reusable conversation messages. It exposes a name, description and text arguments that clients request through `prompts/get`. Getting a prompt does not call a model or execute its instructions: it returns messages that the client application decides how to use.

## Generate a prompt

From the project root, run either alternative:

```bash
orionis make:mcp-prompt greeting
python -B reactor make:mcp-prompt greeting
```

The required argument is `name`; `-h`/`--help` displays help and there are no additional generator-specific flags. It creates `app/mcp/prompts/greeting_prompt.py` with `GreetingPrompt`. The actual template is:

```python
from orionis.mcp import McpResponse, Prompt

class GreetingPrompt(Prompt):
    """Return application-defined messages for an MCP prompt."""

    description = "An application prompt."

    async def handle(self) -> McpResponse:
        """
        Build the messages for this prompt.

        Returns
        -------
        McpResponse
            Messages returned to the MCP client.
        """
        return McpResponse.text("Describe what the user should ask.")
```

The stub declares no arguments. Its asynchronous `handle()` returns a text block with the default `user` role. Start from that behavior and add arguments as needed. Nested names, directories and file conflicts follow the [generation rules](/en/protocols/mcp/servers-and-tools#generate-a-server-declaration). The generated file still needs adding to `Server.prompts`.

## Required and optional arguments

Replace `app/mcp/prompts/greeting_prompt.py` with:

```python
from orionis.mcp import Completion, McpRequest, McpResponse, Prompt, PromptArgument


class GreetingPrompt(Prompt):
    name = "greeting"
    title = "Prepare a greeting"
    description = "Create a greeting request for the conversation."
    arguments = (
        PromptArgument(name="name", description="Person to greet.", required=True),
        PromptArgument(name="style", description="Greeting style.", required=False),
    )

    async def handle(self, name: str, style: str = "friendly") -> McpResponse:
        return McpResponse.text(f"Greet {name} in a {style} way.").asUser()

    def complete(self, request: McpRequest) -> Completion:
        argument = request.params["argument"]
        values = (
            ("friendly", "formal", "brief")
            if argument["name"] == "style"
            else ("Ada", "Alan", "Grace")
        )
        prefix = argument["value"].casefold()
        matches = tuple(value for value in values if value.casefold().startswith(prefix))
        return Completion(values=matches)
```

This preserves the quick start's `greeting` identifier and adds an optional `style` argument. Clients may send these `prompts/get` parameters:

```json
{
  "name": "greeting",
  "arguments": {
    "name": "Ada",
    "style": "formal"
  }
}
```

The resulting message has the `user` role and text `Greet Ada in a formal way.`. Omitting `style` uses the Python default `friendly`.

| Part | Purpose |
| --- | --- |
| `PromptArgument.name` | Public argument name; must be unique and nonempty. |
| `title`, `description` | Argument presentation help for clients. |
| `required` | Requires presence when `True`; defaults to `False`. |
| `name: str` parameter | Receives the declared argument with the same name. |
| `style: str = "friendly"` parameter | Supplies a value when an optional argument is omitted. `required=False` alone does not create that value. |

Prompt argument values are **strings**. They are not arbitrary payloads or a `Tool[Input]` schema: use a tool for complex operation data. Unknown arguments, nontext values or missing required arguments produce invalid parameters. Declare every public argument in `arguments`; adding a primitive method parameter alone is insufficient.

## Construct messages and preserve roles

`McpResponse.text()` produces text; `asUser()` and `asAssistant()` select the role. To return multiple conversation messages, create `app/mcp/prompts/review_prompt.py`:

```python
from orionis.mcp import McpResponse, Prompt, PromptArgument


class ReviewPrompt(Prompt):
    name = "review"
    arguments = (PromptArgument(name="code", required=True),)

    async def handle(self, code: str) -> tuple[McpResponse, ...]:
        return (
            McpResponse.text("Help me review this Python code.").asUser(),
            McpResponse.text("I will examine correctness and clarity.").asAssistant(),
            McpResponse.text(code).asUser(),
        )
```

Register `ReviewPrompt` in the server to publish it. Normalization preserves order, roles and content-block boundaries. An `McpResponse` containing several blocks becomes separate messages sharing its role. The available roles are `user` and `assistant`; these helpers do not declare a `system` role.

The result uses `messages`, not a tool call's `content` or a resource's `contents`. Clients can display the prompt description and decide which messages to add to a conversation.

## Complete arguments

The greeting example's `complete()` suggests values through `completion/complete`. Clients reference `{"type": "ref/prompt", "name": "greeting"}` and send an `argument` with `name` and its partial `value`.

The hook reads those fields from `McpRequest.params` and returns `Completion(values=(...))`. A list or tuple of strings is also accepted. At most 100 suggestions are allowed; `total` and `hasMore` are optional `Completion` fields. Other previously selected arguments supplied by the client appear at `request.params["context"]["arguments"]`.

Primitive authorization is checked before `complete()` executes. Unknown references or argument names are rejected. A server without resource or prompt completion hooks does not advertise completions. See the [HTTP completion example](/en/protocols/mcp/http-and-clients) for a complete JSON-RPC envelope.

## Register and query prompts

With the preceding `greeting_prompt.py`, create `app/mcp/servers/greeting_server.py`:

```python
from app.mcp.prompts.greeting_prompt import GreetingPrompt
from orionis.mcp import Server


class GreetingServer(Server):
    name = "Greeting"
    prompts = (GreetingPrompt,)
```

In `routes/ai.py`, register that server:

```python
from app.mcp.servers.greeting_server import GreetingServer
from orionis.support.facades import Mcp

Mcp.web("/mcp/greeting", GreetingServer)
```

Alternatively, add `GreetingPrompt` to `DemoServer.prompts` to use the quick start's `/mcp/demo` endpoint.

`prompts/list` returns descriptors and arguments without executing `handle()`. Listings are ordered, access-filtered and paginated: follow `nextCursor` without creating it yourself or reusing it for another method. `prompts/get` constructs messages for a particular name and arguments. Both use HTTP JSON-RPC POST requests, as shown by [HTTP and clients](/en/protocols/mcp/http-and-clients).

## Injection, hooks and errors

Prompts support constructor and `handle()` services, plus `McpRequest` context and services in `shouldRegister()`, `authorize()` and `complete()`. The [complete injection example](/en/protocols/mcp/tools#services-in-the-constructor-and-method) includes `GreetingPrompt` with both mechanisms. Declared client arguments remain separate from dependencies; a dependency does not become a prompt argument.

`shouldRegister()` controls availability and `authorize()` access during listing, message retrieval and argument completion. Identity comes from trusted transport context rather than a client-supplied `user_id` argument. If you need the native HTTP request, remember that `Request` is unavailable over STDIO.

Invalid arguments and authorization failures produce protocol errors. Unexpected failures are reported and return a sanitized internal error. `McpResponse.error()` expresses a tool error; it does not replace the `prompts/get` error contract.

## Metadata and catalog changes

Prompts share `name`, `title`, `description`, `icons`, `meta` and `cache` with other primitives. If `name` is omitted, the class loses its `Prompt` suffix and becomes kebab-case. Explicit names accept `[A-Za-z0-9_.-]{1,128}` and must be unique in the server's prompt catalog.

To advertise changes, declare `list_changed = True` on the server and publish `await Mcp.promptsChanged(GreetingServer)` after the application change. The notification does not rewrite compiled tuples or automatically observe files. A client listening for that change receives `notifications/prompts/list_changed`; see [advanced workflows](/en/protocols/mcp/advanced-workflows).

Treat external content interpolated into prompts as data retaining its original provenance. Returning it through an MCP server does not make it trusted instructions for the consuming system.
