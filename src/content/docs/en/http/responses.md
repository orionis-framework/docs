---
title: "Responses, cookies and downloads"
description: "Build HTTP responses, return schemas, configure JSON, headers and cookies, render views, and deliver files, streams and SSE events."
editUrl: true
lastUpdated: false
---

A response defines the HTTP status, headers and body received by the client. Orionis provides specific classes and the `response` factory, imported directly from `orionis.http`. The controller prepares and returns the result; the kernel and ASGI/RSGI adapters deliver it.

`response` is a shared, stateless instance of `ResponseFactory`. Each call creates an independent response. Its methods are synchronous, except for the pending rendering returned by `view()`, which you must await.

## Your first response from a controller

This endpoint demonstrates how to control the status, JSON body and a header. The data is illustrative; it does not save products.

```python
from orionis.http import JSONResponse, response
from orionis.http.base import BaseController
from orionis.support.facades import Route


class CreateProductController(BaseController):
    async def __call__(self) -> JSONResponse:
        return response.json(
            {"id": 7, "name": "Notebook"},
            status_code=201,
            headers={"Location": "/products/7"},
        )


Route.post("/responses/products", CreateProductController)
```

Save the example in the configured API routes file, usually `routes/api.py`, or move the controller to `app/http/controllers` and import it from that file. In the following examples, register each handler alongside its `Route`.

```bash
curl -i -X POST http://localhost:8000/responses/products
```

The response has status `201`, `Content-Type: application/json; charset=utf-8`, `Location: /products/7` and body `{"id":7,"name":"Notebook"}`. Use the address reported by your server; in PowerShell, use `curl.exe` if `curl` is an alias.

You can also construct the class directly: `JSONResponse(content, status_code=201, headers=...)`. The factory lets you use a single import when working with different representations.

## What an action can return

For ordinary routes, the kernel examines the actual returned value, rather than its annotation:

| Returned value | Handling |
| --- | --- |
| `Response` or a subclass | Preserves its status, headers and body. |
| `dict` | Converts it to `JSONResponse` with status `200`. |
| `msgspec.Struct`, including `Schema` | Serializes it through `JSONResponse` with status `200`. |
| `list`, `str`, `bytes`, `None` or other objects | Unsupported as direct returns: wrap them in an appropriate response. |
| `PendingView` | The action must await it with `await` and return the rendered `HTMLResponse`. |
| `ResponseTemplate` | Return `template.make()` to obtain a `Response`. |

For example, `return {"ready": True}` is valid, but use `return response.json([1, 2, 3])` for a list, `return response.text("Ready")` for text, and `return response.noContent()` for an empty body.

Annotating `-> JSONResponse` or `-> ProductSchema` does not convert the returned value or validate its data. `HttpResponse` is a type alias for `Response`, useful for annotating actions that can return different responses; it is not used as a constructor or an argument to `isinstance()`.

[Fallback](/en/http/routing) handlers require an explicit `Response`: they do not receive the automatic dictionary or schema conversion available to ordinary routes.

## Response classes and factory

| Factory | Resulting class | Use |
| --- | --- | --- |
| `response.make(...)` | `Response` | Bytes or generic content with an explicit representation. |
| `response.json(...)` | `JSONResponse` | Data serialized to JSON. |
| `response.text(...)` | `PlainTextResponse` | Plain text or bytes. |
| `response.html(...)` | `HTMLResponse` | Already constructed HTML. |
| `response.view(...)` | `PendingView` → `HTMLResponse` | Asynchronous template rendering. |
| `response.redirect(...)` | `RedirectResponse` | A 3xx status and Location header. |
| `response.noContent(...)` | `Response` | An empty body, with an initial status of 204. |
| `response.stream(...)` | `StreamingResponse` | A sequence of byte chunks. |
| `response.eventStream(...)` | `EventStreamResponse` | Server events in SSE format. |
| `response.file(...)` | `FileResponse` | A local file, with an inferred or explicit MIME type. |
| `response.download(...)` | `FileResponse` | A file with attachment disposition. |

These classes, `ResponseFactory`, `ResponseTemplate`, `ServerSentEvent`, `HttpResponse` and `response` are exported from `orionis.http`. You do not need to import their internal files.

### Common arguments and defaults

| Argument | Behavior |
| --- | --- |
| `content` | Response content; required for JSON and streams. `make()` uses `None`; HTML and text use `""`. |
| `status_code` | An integer or `HTTPStatus` between 100 and 599. Defaults to `200`; redirect uses `302` and noContent uses `204`. |
| `headers` | A mapping of names to text values; defaults to `None`. Use `addHeader()` for repeated values. |
| `background` | `BackgroundTask` or `BackgroundTasks`; defaults to `None`. Awaited after successful delivery. |
| `media_type` | Available in make, stream and file; defaults to `None`. File infers it when omitted. |

`download()` does not expose `status_code` or `chunk_size`; use `file()` or `FileResponse` when you need to configure them. `view(template, **context)` receives template variables, rather than the common arguments above.

To use the framework's status constants, import `HTTPStatus` from `orionis.http.enums`, for example `status_code=HTTPStatus.CREATED`.

The base class `Response(content=None, status_code=200, headers=None, media_type=None, background=None)` accepts text, bytes or an asynchronous source. Its rendering converts `None` to `b""`, preserves bytes, converts `bytearray` and `memoryview` to bytes, encodes text as UTF-8, and converts other values through `str(...)`. Therefore, `Response({"ok": True})` does not produce JSON.

:::note[Media type and header]
In `Response`, `response.make()` and `ResponseTemplate`, `media_type` is metadata and **does not create a Content-Type header**. Set the header explicitly. Specialized JSON, HTML, text, file and streaming responses prepare their corresponding header.
:::

## JSON and serialization options

`response.json(content, ...)` and `JSONResponse(content, ...)` accept objects, lists, simple values and `None`, which serializes as `null`. Serialization occurs when the response is constructed.

```python
from orionis.http import JSONResponse, response
from orionis.support.facades import Route


async def product_list() -> JSONResponse:
    return response.json([
        {"id": 7, "name": "Notebook"},
        {"id": 8, "name": "Pen"},
    ])


Route.get("/responses/products", product_list)
```

```bash
curl -i http://localhost:8000/responses/products
```

### JSON-specific options

All are passed by name, after the common arguments:

| Option | Default | Purpose |
| --- | --- | --- |
| `indent` | `None` | Indentation for formatted JSON. |
| `ensure_ascii` | `False` | Escape non-ASCII characters when `True`. |
| `separators` | `None` | A tuple of item and key separators. |
| `default` | `None` | A function that converts types unsupported by the serializer; when omitted, uses the framework encoder. |

```python
from orionis.http import JSONResponse, response
from orionis.support.facades import Route


class ProductCode:
    def __init__(self, value: str) -> None:
        self.value = value


def encode_product_code(value: object) -> str:
    if isinstance(value, ProductCode):
        return value.value
    raise TypeError(f"Unsupported JSON value: {type(value).__name__}")


async def formatted_product() -> JSONResponse:
    return response.json(
        {"code": ProductCode("P-007"), "name": "Cuaderno"},
        indent=2,
        ensure_ascii=False,
        separators=(",", ": "),
        default=encode_product_code,
    )


Route.get("/responses/formatted-product", formatted_product)
```

The `default` function converts unsupported objects it receives; it does not transform every value in the document.

### Supported types and formatting differences

With `indent=None`, `ensure_ascii=False` and `separators=None`, Orionis uses `msgspec.json.encode`. This compact path supports schemas, Struct, dataclasses, dates/times, Decimal, UUID, Enum, sets and bytes; binary values are encoded as Base64.

Changing any of those three options uses `json.dumps`. The framework's default encoder converts dates/times through `isoformat()`, Decimal and UUID to text, Enum to its value, and sets to lists. It does not add support for Schema/Struct, dataclasses or bytes in that path.

Therefore, `response.json(schema)` works, but `response.json(schema, indent=2)` requires converting it first, for example with `response.json(schema.toDict(), indent=2)`. Fields that still contain bytes or other incompatible types need a conversion or a custom encoder. The two serialization paths do not guarantee identical textual representations for every type.

## Schemas as HTTP responses

An output schema defines the fields of the representation you return. You can return it directly for JSON 200 or wrap it in `response.json()` to control the status and headers.

The following example shows both alternatives and a third that explicitly validates the output data:

```python
from orionis.http import JSONResponse, response
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import MinLength
from orionis.schemas.fields import Field
from orionis.schemas.validator import Schema as Validator
from orionis.support.facades import Route


class ProductOutput(Schema):
    id: int
    name: Field[str, MinLength(2)]


class ProductController(BaseController):
    async def show(self, product_id: int) -> ProductOutput:
        return ProductOutput(id=product_id, name="Notebook")

    async def create(self) -> JSONResponse:
        product = ProductOutput(id=7, name="Notebook")
        return response.json(
            product,
            status_code=201,
            headers={"Location": "/products/7"},
        )

    async def checked(self) -> ProductOutput:
        produced_data = {"id": 7, "name": "Notebook"}
        return await Validator.validate(produced_data, ProductOutput)


Route.get("/responses/products/{product_id:int}", [ProductController, "show"])
Route.post("/responses/schema-product", [ProductController, "create"])
Route.get("/responses/checked-product", [ProductController, "checked"])
```

```bash
curl -i http://localhost:8000/responses/products/7
curl -i -X POST http://localhost:8000/responses/schema-product
curl -i http://localhost:8000/responses/checked-product
```

All three return `{"id":7,"name":"Notebook"}`; `create` uses status `201`. The data is fixed to demonstrate responses, without persistence.

Distinguish these mechanisms:

- The `ProductOutput(...)` constructor does not run the validation pipeline.
- Returning the instance allows serialization; the kernel does not check its rules again.
- `-> ProductOutput` describes the return, but does not validate or convert a dictionary.
- `await Validator.validate(datos, ProductOutput)` checks types, constraints and rules asynchronously before returning the instance.

Input and output schemas can be different classes. The [controller and schema guide](/en/validation/controllers-and-http) explains body injection and explicit validation; [other integrations](/en/validation/integrations) describe their differences from MCP and Realtime.

## Text, HTML and empty responses

`text()` produces `text/plain; charset=utf-8` and `html()` produces `text/html; charset=utf-8`. Both accept text or bytes, with an initial status of 200. A supplied Content-Type header is preserved.

```python
from orionis.http import HTMLResponse, PlainTextResponse, Response, response
from orionis.support.facades import Route


async def ready_text() -> PlainTextResponse:
    return response.text("Ready")


async def ready_html() -> HTMLResponse:
    return response.html("<h1>Ready</h1>")


async def remove_example() -> Response:
    return response.noContent()


Route.get("/responses/text", ready_text)
Route.get("/responses/html", ready_html)
Route.delete("/responses/example", remove_example)
```

```bash
curl -i http://localhost:8000/responses/text
curl -i http://localhost:8000/responses/html
curl -i -X DELETE http://localhost:8000/responses/example
```

The last endpoint returns status `204` and an empty body. `response.json(None)` is different: it produces JSON `null` and status 200 unless configured otherwise.

`html()` delivers already constructed HTML without escaping its values. To compose a page with dynamic data, use a template with the corresponding rendering.

## Generic responses: XML, MessagePack and binary data

For a format without a specialized class, serialize the content first and use `response.make()` or `Response` with an explicit Content-Type:

```python
from xml.etree.ElementTree import Element, SubElement, tostring

import msgspec

from orionis.http import Response, response
from orionis.support.facades import Route


async def xml_result() -> Response:
    root = Element("product")
    SubElement(root, "id").text = "7"
    content = tostring(root, encoding="utf-8", xml_declaration=True)
    return response.make(
        content,
        media_type="application/xml",
        headers={"Content-Type": "application/xml; charset=utf-8"},
    )


async def msgpack_result() -> Response:
    content = msgspec.msgpack.encode({"id": 7, "name": "Notebook"})
    return Response(
        content,
        media_type="application/msgpack",
        headers={"Content-Type": "application/msgpack"},
    )


async def binary_result() -> Response:
    return response.make(
        b"\x00\x01\x02",
        media_type="application/octet-stream",
        headers={"Content-Type": "application/octet-stream"},
    )


Route.get("/responses/xml", xml_result)
Route.get("/responses/msgpack", msgpack_result)
Route.get("/responses/binary", binary_result)
```

```bash
curl -i http://localhost:8000/responses/xml
curl http://localhost:8000/responses/msgpack --output result.msgpack
curl http://localhost:8000/responses/binary --output result.bin
```

The body is delivered in the selected format; no representation is selected automatically from `Accept`. If an endpoint offers several representations, inspect the request and explicitly construct the corresponding response.

## Render an HTML view

Create `resources/views/responses/preview.html` inside the configured views directory:

```html
<!doctype html>
<h1>{{ product.name }}</h1>
<p>Product #{{ product.id }}</p>
```

In the configured WEB routes file, usually `routes/web.py`:

```python
from orionis.http import HTMLResponse, response
from orionis.support.facades import Route


async def product_page() -> HTMLResponse:
    return await (
        response.view("responses.preview", product={"id": 7, "name": "Notebook"})
        .setHeader("Cache-Control", "no-store")
    )


Route.get("/responses/product-page", product_page)
```

`view(template, **context)` returns a `PendingView`, rather than a completed Response. Awaiting it renders the template and produces `HTMLResponse` with `X-Orionis-Render: SSR`. Mutations such as `setHeader()` or `withCookie()` are queued and applied to the rendered result.

Named arguments are context: `response.view("page", status_code=201)` passes a variable to the template; it does not configure the HTTP status. To change it, await the response and assign `result.status_code = 201` before returning it. Awaiting the same pending view twice renders it again.

See [views and rendering](/en/views/rendering-templates) for template names, configuration and form helpers.

## Redirects and flash data

`response.redirect(url, status_code=302, headers=None, background=None)` creates a `RedirectResponse`, writes `Location` and a text body of `Redirecting to ...`. The status must be between 300 and 399.

```python
from orionis.http import RedirectResponse, response
from orionis.support.facades import Route


async def go_to_product() -> RedirectResponse:
    return response.redirect("/responses/products/7", status_code=303)


Route.get("/responses/go-to-product", go_to_product)
```

```bash
curl -i http://localhost:8000/responses/go-to-product
```

The client decides whether to follow the redirect; `curl -L` follows it. Prepare an application destination or one that has already been validated.

### Preserve input and errors in WEB

Flash methods are inherited from `Response` and support chaining. On a WEB route with a session, this handler prepares the data displayed when returning to a form:

```python
from orionis.http import RedirectResponse, response
from orionis.support.facades import Route


async def review_profile() -> RedirectResponse:
    return (
        response.redirect("/profile", status_code=303)
        .withFlash("notice", "Review the submitted fields.")
        .withInput({"name": "Ada", "email": "invalid"})
        .withErrors({"email": ["Use a valid email address."]})
    )


Route.post("/responses/review-profile", review_profile)
```

Register it in `routes/web.py` and use your GET `/profile` route to display the form. The POST needs the CSRF token from the WEB flow.

| Method | Purpose |
| --- | --- |
| `withFlash(key, value=None)` | Stores flash data for the next request. |
| `withInput(values)` | Preserves a mapping of values for the `old()` helper. |
| `withErrors(errors)` | Normalizes errors from a mapping or a validation exception. |
| `getFlashData()` | Reads the queued dictionary, or `None` when there is no data. |

Session middleware applies the state before delivering the response; without that session cycle, flash data does not persist. `withInput()` excludes known sensitive names at the top level, such as `password`; it does not recursively filter every possible secret. See [sessions and flash data](/en/sessions/state-and-flash).

## Response headers and status

You can pass `headers` to the constructor or modify the instance before returning it:

```python
from orionis.http import JSONResponse, response
from orionis.support.facades import Route


async def response_metadata() -> JSONResponse:
    result = response.json({"ready": True})
    result.status_code = 202
    result.setHeader("X-Service", "catalog")
    result.addHeader("Vary", "Accept")
    result.addHeader("Vary", "Origin")
    result.removeHeader("X-Unused")
    return result


Route.get("/responses/metadata", response_metadata)
```

| Method or attribute | Behavior |
| --- | --- |
| `status_code` / `getStatusCode()` | Instance status. Range validation takes place during construction. |
| `media_type` / `getMediaType()` | Content type metadata. Changing it does not rewrite Content-Type. |
| `setHeader(key, value)` | Replaces all values for that header; returns `None`. |
| `addHeader(key, value)` | Adds a value without removing existing ones; returns `None`. |
| `getHeader(key)` | A list of values or `None`; never a single string under its contract. |
| `hasHeader(key)` | Checks presence. |
| `removeHeader(key)` | Removes the header; does not fail when absent. |
| `getStringHeaders()` | A list of text pairs, including repeated values. |
| `getRawHeaders()` | A list of `bytes` pairs encoded as Latin-1 for transport. |

Header lookups are case-insensitive. Use text names and values compatible with their encoding, without CR/LF. `setHeader()` and `addHeader()` are not fluent methods on Response: modify the variable, then return it, as in the example.

Specialized classes preserve the supplied Content-Type. `RedirectResponse` sets its own Location. Adapters also set `Server: Orionis ASGI` or `Orionis RSGI` during delivery.

## Cookies

`setCookie()` adds a `Set-Cookie` header and returns `None`. `withCookie()` accepts the same arguments and returns the response itself for chaining.

| Argument | Default | Use |
| --- | --- | --- |
| `key` | Required | Cookie name. |
| `value` | `""` | Text value, encoded using percent-encoding. |
| `max_age` | `None` | Lifetime in seconds. |
| `expires` | `None` | `datetime`, text or integer; a datetime is converted to a GMT date. Other values are converted literally to text. |
| `path` | `"/"` | Path; `None` omits the attribute. |
| `domain` | `None` | Domain; omitted when not provided. |
| `secure` | `False` | Emits the Secure attribute. |
| `http_only` | `False` | Emits HttpOnly. |
| `same_site` | `"lax"` | `"lax"`, `"strict"`, `"none"`, or `None` to omit it. |
| `partitioned` | `False` | Emits the Partitioned attribute. |

After `key` and `value`, all arguments are passed by name. For relative expiration, use `max_age`; an integer `expires` is not interpreted as that interval. A datetime without a timezone is treated as UTC. `same_site="none"` requires `secure=True`, or construction raises `ValueError`.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def set_preferences(request: Request) -> JSONResponse:
    return (
        response.json({"saved": True})
        .withCookie(
            "theme",
            "dark",
            max_age=3600,
            http_only=True,
            secure=request.scheme == "https",
            same_site="lax",
        )
        .withCookies({
            "language": "es",
            "layout": {"value": "compact", "path": "/", "max_age": 3600},
        })
        .withoutCookie("obsolete", path="/")
    )


Route.post("/responses/preferences", set_preferences)
```

```bash
curl -i -X POST http://localhost:8000/responses/preferences
```

`withCookies(mapping)` accepts a text value for each name or a mapping with `setCookie` options. Each cookie produces a separate header.

`deleteCookie(key, *, path="/", domain=None)` and its fluent variant `withoutCookie(...)` emit past expiration and `Max-Age=0`. Use the path and domain with which the cookie was created. The response emits the requested attributes; storage and acceptance rules belong to the client. For application state managed on the server, see [sessions](/en/sessions).

## Files and downloads

Use the `Storage` facade to obtain files from configured disks and deliver their content through `response.stream()`. The `reports/users.csv` path is relative to the `local` disk defined in `config/filesystems.py`; see [Storage](/en/storage).

The `prepare_report()` helper creates the demonstration file. Run `await prepare_report()` from a command or asynchronous method in the booted application before trying the routes:

```python
from orionis.http import StreamingResponse, response
from orionis.support.facades import Route
from orionis.support.facades import Storage

REPORT_PATH = "reports/users.csv"


async def prepare_report() -> None:
    await Storage.disk("local").put(REPORT_PATH, b"id,name\n1,Ada\n")


async def report_file() -> StreamingResponse:
    report = Storage.disk("local").file(REPORT_PATH)
    await report.size()
    return response.stream(report.readStream(), media_type="text/csv")


async def report_download() -> StreamingResponse:
    report = Storage.disk("local").file(REPORT_PATH)
    await report.size()
    return response.stream(
        report.readStream(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="users.csv"'},
    )


Route.get("/responses/report", report_file)
Route.get("/responses/report/download", report_download)
```

```bash
curl -i http://localhost:8000/responses/report
curl http://localhost:8000/responses/report/download --output users.csv
```

The handlers check metadata before starting the response and transmit chunks through `readStream()`, without reading the entire file into memory. The second route adds attachment disposition for downloading it.

This example uses `StreamingResponse`; the automatic range handling described below belongs to `FileResponse`. Storage paths are logical and must not be passed as physical paths to `response.file()`.

### FileResponse API for physical paths

`FileResponse` checks that the path exists and is a regular file, records its size and sets Content-Length. When `media_type` is omitted, it infers the MIME type from the path and uses `application/octet-stream` if inference fails.

| Option or method | Behavior |
| --- | --- |
| `path` | Required `str` or `Path`. |
| `media_type=None` | An explicit or inferred MIME type; text/* includes a UTF-8 charset. |
| `filename=None` | When provided in `file()`, sets `attachment` disposition with that name. |
| `chunk_size=65536` | Chunk size for `file()`; a positive integer. |
| `getPath()` | Returns the file's `Path`. |
| `getFileSize()` | Returns the recorded size in bytes. |

`file()` without filename does not add Content-Disposition. `download()` always uses attachment and takes the name from the path when filename is omitted. To control a download's status or chunk size, use `file(path, filename=..., status_code=..., chunk_size=...)`.

Resolve the path from application-controlled data or an authorized identifier. The file is opened during delivery and may become unavailable after the response is constructed.

### Ranges and ASGI/RSGI delivery

Adapters handle a single valid range, such as `bytes=0-1`, `bytes=4-` or `bytes=-3`. They return status `206` and adjust Content-Length, Content-Range and Accept-Ranges. An invalid, unsatisfiable or multiple range is ignored, and the complete file is delivered with its original status; it does not automatically produce `416`.

This flow does not generate ETag or Last-Modified, nor does it automatically evaluate If-None-Match, If-Modified-Since or If-Range to produce `304`. If your application needs that cache policy, implement it explicitly.

ASGI reads files through an executor. Full delivery uses FileResponse's chunk_size; ranges use 64 KiB chunks. RSGI delegates to the server through `response_file` or `response_file_range`.

## Byte streaming

`StreamingResponse` and `response.stream(content, ...)` accept a synchronous or asynchronous iterable of chunks. Delivery requests and sends each chunk without constructing a complete body.

```python
from orionis.http import StreamingResponse, response
from orionis.support.facades import Route


async def csv_rows():
    yield b"id,name\n"
    yield b"7,Notebook\n"


async def export_products() -> StreamingResponse:
    return response.stream(
        csv_rows(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="products.csv"'},
    )


Route.get("/responses/export", export_products)
```

```bash
curl -N http://localhost:8000/responses/export
```

A synchronous source can also produce chunks, for example `response.stream([b"one\n", b"two\n"], media_type="text/plain")`. It is iterated on the event loop: blocking I/O is not automatically moved to a thread.

Produce `bytes`; the synchronous-source wrapper also accepts `bytearray` and `memoryview`. To send text from a generator, encode each fragment. Keep the appropriate Content-Type and do not invent a length for a stream of unknown size.

Adapters attempt to close the iterator when it finishes, fails or is cancelled. Use `try/finally` when the producer owns resources. By the time iteration begins, headers and status have already been sent: a later exception cannot replace the response with another HTTP JSON body.

## Server-sent events: SSE

`EventStreamResponse` and `response.eventStream(...)` accept strings or `ServerSentEvent`. A string represents `data` content, rather than an already constructed SSE frame.

```python
import json

from orionis.http import EventStreamResponse, ServerSentEvent, response
from orionis.support.facades import Route


async def progress_events():
    yield ServerSentEvent(comment="Starting")
    for step in range(3):
        yield ServerSentEvent(
            event="progress",
            id=str(step),
            retry=1500,
            data=json.dumps({"step": step}),
        )


async def progress_response() -> EventStreamResponse:
    return response.eventStream(progress_events())


Route.get("/responses/progress", progress_response)
```

```bash
curl -N http://localhost:8000/responses/progress
```

`ServerSentEvent` accepts `data=None`, `event=None`, `id=None`, `retry=None` and `comment=None`, all by name. Text fields require strings; serialize JSON objects before passing them as data. `retry` is a nonnegative integer in milliseconds, excluding booleans. Event and id must be single-line; id also rejects NUL. `encode()` returns the UTF-8 frame terminated by an empty line.

Data and comment can span multiple lines: line endings are normalized, and a separate data or comment field is emitted for each line.

The response sets `text/event-stream; charset=utf-8` and, when absent, `Cache-Control: no-cache` and `X-Accel-Buffering: no`. It excludes Content-Length, even when added later. Events are encoded as the transport requests them.

SSE observes client disconnection, cancels delivery and awaits producer cleanup. In ASGI, it takes control of the receive channel during delivery: read any request data you need in the handler before returning the stream.

The example is finite. The id and retry fields do not themselves implement storage, replay or a heartbeat producer; comments can be used to emit those messages explicitly. See [streaming and SSE](/en/realtime/streaming-and-sse) for clients and cancellation.

## Work after sending the response

The `background` argument associates short work with a response. An asynchronous function is awaited directly; a synchronous function runs through an executor.

```python
from orionis.background import BackgroundTask, BackgroundTasks
from orionis.http import JSONResponse, response
from orionis.support.facades import Route


def record_delivery(label: str) -> None:
    print(f"Response delivered: {label}")


async def single_background() -> JSONResponse:
    task = BackgroundTask(record_delivery, "single")
    return response.json({"ready": True}, background=task)


async def multiple_background() -> JSONResponse:
    tasks = BackgroundTasks()
    tasks.addTask(record_delivery, "first")
    tasks.addTask(record_delivery, "second")
    return response.json({"ready": True}, background=tasks)


Route.get("/responses/background", single_background)
Route.get("/responses/background/multiple", multiple_background)
```

The adapter awaits the work after successful delivery and stream closure. `BackgroundTasks` executes its tasks in order and stops if one fails. Errors occurring after delivery do not change the status the client has already received.

The work remains inside the request cycle and delays its completion. It is not a persistent queue or a detached task: an SSE disconnection, delivery failure or process crash can prevent it from running. For persistent execution, see [queues and jobs](/en/queues).

The adapter calls `await result.runBackground()`; do not call it again inside the controller if you want to preserve that execution timing.

## Reuse content with ResponseTemplate

`ResponseTemplate` stores text or bytes encoded once and a snapshot of headers. It does not render HTML templates or validate schemas.

Its constructor accepts `content=b""`, `status_code=200`, `headers=None` and `media_type=None`. Create one response per request with `make()`:

```python
from orionis.http import Response, ResponseTemplate
from orionis.support.facades import Route

READY_TEMPLATE = ResponseTemplate(
    "Ready",
    headers={"Content-Type": "text/plain; charset=utf-8", "X-Service": "catalog"},
    media_type="text/plain",
)


async def cached_ready() -> Response:
    result = READY_TEMPLATE.make()
    result.setHeader("X-Example", "independent-response")
    return result


Route.get("/responses/template", cached_ready)
```

The template is immutable and exposes `body`, `status_code` and `media_type`. Each `make()` creates independent headers without flash, stream or background, sharing the immutable body. Do not reuse a mutable Response instance between requests.

## Inspect a response

Read methods let you check the result before delivery, for example from middleware or tests:

| Method | Result |
| --- | --- |
| `getBody()` | `bytes` for a materialized body; `None` for a stream. |
| `getStream()` | An asynchronous chunk source or `None`. |
| `hasStream()` | Indicates whether a streaming source exists. |
| `getStatusCode()`, `getMediaType()` | Status and content type metadata. |
| `getFlashData()` | Pending flash data or `None`. |
| `render(content)` | Encodes content and returns bytes; calling it does not replace the stored body. |
| `runBackground()` | An asynchronous method that executes the associated task when awaited by the adapter. |

Header and cookie operations are inherited by concrete classes. In FileResponse, `getBody()` does not read the file; use its metadata or the streaming mechanism. Avoid consuming the stream for inspection and then trying to deliver it again.

## From the controller to HTTP delivery

The flow is the same for functions and controllers:

1. The route executes the action and the kernel normalizes the return.
2. The response returns through middleware's subsequent logic, in reverse order.
3. In WEB, the session applies flash, persists its data and prepares its cookie. Endpoint policies and CORS also prepare the response before delivery.
4. The ASGI or RSGI adapter encodes the headers and delivers the body, file or stream.
5. After successful delivery and cleanup, it awaits the background work.
6. Finally, the kernel closes Request, leaves the container scope and releases the capacity for that request.

[Middleware options](/en/http/middleware) allow you to modify the response before sending it. Once delivery has started, the producer cannot replace its headers or status.

### HEAD and transport metadata

HEAD uses the GET route and executes its handler, but adapters send an empty body. When Content-Length is absent, they calculate it for materialized bodies or files; they do not invent a length for a stream.

HEAD is handled before Range is applied: it preserves metadata for the complete file. For SSE, it does not start the producer and closes its source; background work can run after successfully sending that HEAD response.

The base class does not itself add Content-Length to every response. The transport server also participates in framing. Construct the representation and headers in the handler, and leave delivery to the adapters.
