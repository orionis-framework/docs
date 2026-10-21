---
title: "Resources and URI templates"
description: "Create fixed or parameterized MCP resources, return text, JSON or bytes, and control reads, completions and subscriptions."
editUrl: true
lastUpdated: false
---

An MCP resource exposes readable content identified by a URI: documentation, a data representation or a file explicitly provided by the application. Unlike a tool, its main operation is `resources/read`. Declaring a URI does not automatically grant disk access or open an external URL.

## Generate a resource

Run either alternative:

```bash
orionis make:mcp-resource guide
python -B reactor make:mcp-resource guide
```

The `name` argument is required. The default file is `app/mcp/resources/guide_resource.py`, containing `GuideResource`. `-h`/`--help` displays help; there are no additional generation flags. The actual template contains:

```python
from orionis.mcp import McpResponse, Resource

class GuideResource(Resource):
    """Serve a resource chosen explicitly by the application."""

    uri = "docs://example/resource"
    description = "Application documentation."
    mime_type = "text/plain"

    async def handle(self) -> McpResponse:
        """
        Read authorized application data without deriving filesystem paths.

        Returns
        -------
        McpResponse
            Resource content with its URI and MIME type.
        """
        return McpResponse.resource(self.uri, "Resource content.", self.mime_type)
```

The initial URI is an explicit placeholder to replace. `Resource` does not interpret it as a filesystem path. The generator shares the [naming, nested-directory and existing-file rules](/en/protocols/mcp/servers-and-tools#generate-a-server-declaration).

## A fixed-URI resource

Replace `app/mcp/resources/guide_resource.py` with:

```python
from orionis.mcp import McpResponse, Resource


class GuideResource(Resource):
    name = "guide"
    uri = "demo://guide"
    title = "Greeting service guide"
    description = "How to use the greeting components."
    mime_type = "text/plain"

    async def handle(self) -> McpResponse:
        return McpResponse.resource(
            self.uri,
            "Use greet with a name; read demo://greetings/{name} for a greeting.",
            self.mime_type,
        )
```

Clients discover `demo://guide` through `resources/list` and request that complete URI with `resources/read`. `name="guide"` is the catalog identifier; reading uses the **URI**, not the name. The handler receives no URI variables because this declaration has none.

## URI templates and parameters

A template describes a resource family without listing every member. In `app/mcp/resources/greeting_resource.py`:

```python
from orionis.mcp import Completion, McpRequest, McpResponse, Resource


class GreetingResource(Resource):
    name = "greeting"
    uri_template = "demo://greetings/{name}"
    description = "A greeting for the name contained in the URI."
    mime_type = "text/plain"

    async def handle(self, name: str) -> McpResponse:
        return McpResponse.text(f"Hello, {name}!")

    def complete(self, request: McpRequest) -> Completion:
        argument = request.params["argument"]
        prefix = argument["value"].casefold()
        names = ("Ada", "Alan", "Grace")
        matches = tuple(name for name in names if name.casefold().startswith(prefix))
        return Completion(values=matches)
```

`demo://greetings/Ada` produces `Hello, Ada!`. Simple variables are decoded as strings and supplied by name to `handle()`; use `name: str` in this example. They are not HTTP converters such as `{id:int}`. An `int` annotation alone does not coerce a string segment to an integer: validate and convert explicitly when your domain requires it.

`McpResponse.text()` is normalized into resource content using the requested URI and declared MIME type. You can also inject `McpRequest` for `uri`, `uri_variables` and identity context. Constructor and method services work as shown by the [component injection example](/en/protocols/mcp/tools#services-in-the-constructor-and-method).

Declare exactly **one** of `uri` or `uri_template`. A fixed URI must be absolute with a valid scheme; compilation rejects controls, invalid escapes and other forbidden characters. A resource cannot declare both a URI and a template.

### Complete a variable

The example's `complete()` responds to `completion/complete` with `{"type": "ref/resource", "uri": "demo://greetings/{name}"}` as its reference. It does not automatically receive an incomplete `name` parameter: read `request.params["argument"]`, containing the argument name and entered fragment. The example filters names by that fragment.

Return `Completion(values=(...))` or a list/tuple of strings, with at most 100 suggestions. `Completion` also accepts `total` and `hasMore`. Optional context for other arguments is at `request.params["context"]["arguments"]` when supplied by the client. References must use the literal template and an existing argument; authorization is checked before suggestions are computed. The [HTTP guide](/en/protocols/mcp/http-and-clients) shows the full envelope.

### Templates with RFC 6570 operators

Orionis supports RFC 6570 level 4 template expansion. Unambiguous simple expressions such as `{name}` have an automatic inverse. Operator expressions or ambiguous forms require an explicit `match(uri)` method reconstructing variables:

```python
from urllib.parse import parse_qsl, urlsplit

from orionis.mcp import McpResponse, Resource


class SearchResource(Resource):
    uri_template = "demo://search{?q}"
    mime_type = "text/plain"

    @staticmethod
    def match(uri: str) -> dict[str, object] | None:
        parts = urlsplit(uri)
        if (
            parts.scheme != "demo"
            or parts.netloc != "search"
            or parts.path
            or parts.fragment
        ):
            return None
        try:
            pairs = parse_qsl(parts.query, keep_blank_values=True, strict_parsing=True)
        except ValueError:
            return None
        if len(pairs) != 1 or pairs[0][0] != "q":
            return None
        return {"q": pairs[0][1]}

    async def handle(self, q: str) -> McpResponse:
        return McpResponse.text(f"Search term: {q}")
```

`demo://search?q=routing` resolves with `q="routing"`. The matcher must be a synchronous `@staticmethod` or `@classmethod`, accept only the URI and return a mapping of declared variables or `None`. It does not use service injection. Orionis then expands the template again and requires it to match the supplied URI; a partial match is insufficient. Prefix modifiers accept only scalar values.

## Text, JSON and binary content

For JSON, declare the MIME type and return an explicit serializable resource. For example, in `app/mcp/resources/greeting_json_resource.py`:

```python
from orionis.mcp import McpRequest, McpResponse, Resource


class GreetingJsonResource(Resource):
    name = "greeting-json"
    uri_template = "demo://greetings-json/{name}"
    mime_type = "application/json"

    async def handle(self, name: str, request: McpRequest) -> McpResponse:
        return McpResponse.resource(
            request.uri,
            {"name": name, "greeting": f"Hello, {name}!"},
            self.mime_type,
        )
```

The `resources/read` result uses `contents`, containing `uri`, `mimeType` and `text` with serialized JSON. This differs from a tool's `structuredContent`. `application/*+json` also selects the native JSON encoder.

Bytes are carried as Base64-encoded `blob` content:

```python
from orionis.mcp import McpResponse, Resource


class BinaryResource(Resource):
    uri = "demo://samples/binary"
    mime_type = "application/octet-stream"

    async def handle(self) -> McpResponse:
        return McpResponse.resource(self.uri, bytes([0, 1, 2]), self.mime_type)
```

`McpResponse.resource()` accepts strings, bytes or structured values according to the MIME type. JSON produces text; MessagePack with its corresponding MIME type produces binary content. A resource must return text or binary content; tool image/audio blocks do not automatically become readable resource results. See [responses and content](/en/protocols/mcp/responses-and-content) for the variants.

## Register and query resources

For the preceding `guide_resource.py` and `greeting_resource.py` files, create `app/mcp/servers/directory_server.py`:

```python
from app.mcp.resources.greeting_resource import GreetingResource
from app.mcp.resources.guide_resource import GuideResource
from orionis.mcp import Server


class DirectoryServer(Server):
    name = "Directory"
    resources = (GuideResource, GreetingResource)
```

In `routes/ai.py`, register that server:

```python
from app.mcp.servers.directory_server import DirectoryServer
from orionis.support.facades import Mcp

Mcp.web("/mcp/directory", DirectoryServer)
```

You can instead add the classes to `DemoServer.resources` to retain one endpoint.

| Operation | Result |
| --- | --- |
| `resources/list` | Fixed-URI resource catalog; does not read content. |
| `resources/templates/list` | Template catalog; does not enumerate every URI that could expand. |
| `resources/read` | Content for the requested fixed or expanded URI. Exact URIs are checked before templates. |
| `completion/complete` | Variable suggestions when a template implements `complete()`. |

Listings are ordered and paginated with opaque cursors. Follow `nextCursor` until absent; a cursor belongs to its method and is not reused across catalogs. Complete JSON-RPC examples are in [HTTP and clients](/en/protocols/mcp/http-and-clients).

## Access, errors and metadata

`shouldRegister()` and `authorize()` follow the same [tool access rules](/en/protocols/mcp/tools#visibility-and-authorization), accepting injected context and services. For example:

```python
from orionis.mcp import McpRequest, McpResponse, Resource


class PrivateGuideResource(Resource):
    uri = "demo://private-guide"
    mime_type = "text/plain"

    def authorize(self, request: McpRequest) -> bool:
        return request.identity is not None

    async def handle(self) -> McpResponse:
        return McpResponse.text("Authenticated application guidance.")
```

Reading a URI requires authorization for the specific content; knowing its identifier does not grant access. During listing there is no concrete expanded URI, so do not assume `request.uri_variables` already contains read parameters.

An unknown or malformed URI produces a protocol error. Unexpected handler failures are reported and return a sanitized internal error. Tool `isError` results are not the resource-read contract.

Besides `uri` or `uri_template`, you can declare `name`, `title`, `description`, `icons`, `meta`, `cache`, `mime_type`, `size` and `annotations`. `size` must be a nonnegative integer; it is metadata, not an automatic read limit. `ContentAnnotations` accepts `audience`, `priority` between 0 and 1, and `last_modified`. Exact URIs and templates share unique names within a server; templates with detectably identical inverse patterns are also rejected during compilation.

## Changes and subscriptions

To advertise changes, explicitly configure the server:

```python
class DirectoryServer(Server):
    name = "Directory"
    resources = (GuideResource, GreetingResource)
    list_changed = True
    resource_subscriptions = True
```

This fragment replaces the earlier class while retaining its imports. After committing a data change, your application operation can publish the updated URI:

```python
from app.mcp.servers.directory_server import DirectoryServer
from orionis.support.facades import Mcp


async def publishGreetingChange(name: str) -> None:
    from urllib.parse import quote

    uri = f"demo://greetings/{quote(name, safe='')}"
    await Mcp.resourceUpdated(DirectoryServer, uri)
```

`Mcp.resourceUpdated()` notifies; it neither changes the resource nor sends its new content. Use `await Mcp.resourcesChanged(DirectoryServer)` for catalog changes. The server must already be registered. There is no automatic filesystem or database observation.

Clients use `subscriptions/listen` with `notifications.resourceSubscriptions` and appropriate capabilities, not the historical `resources/subscribe` or `resources/unsubscribe` methods. The listener connection carries notifications and closing it ends that listener; in-memory events belong to the current worker. See [advanced workflows](/en/protocols/mcp/advanced-workflows) for filters, cancellation and limits.

## Build a reusable prompt

Prompts have a separate [generation, arguments, messages and completions guide](/en/protocols/mcp/prompts). They are registered in `Server.prompts` and requested through `prompts/get`; they are not URI resources.
