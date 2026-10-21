---
title: "Request and HTTP payloads"
description: "Explore the complete Request API and receive JSON, forms, files, MessagePack, XML, text, binary data, and streaming bodies with practical examples."
editUrl: true
lastUpdated: false
---

`Request` represents the current HTTP request. It provides access to its URL, parameters, headers, and cookies, and lets you read the body as bytes or through a parser. Import the class from `orionis.http` and receive it as a parameter of a route function or controller method; the container supplies the active request.

Reading or decoding the body does not validate its business rules. To receive a validated schema directly, see [HTTP validation](/en/http/requests-and-validation) and the [schema guide](/en/validation).

The readers do not depend on the HTTP verb: you can use them in `POST`, `PUT`, `PATCH`, or `QUERY` routes, depending on the endpoint. The examples use API routes; a WEB route also applies its session and CSRF controls.

## Preparing the examples

The following handlers are independent. Place the one you want to try in the configured API routes file, usually `routes/api.py`, together with its `Route.post(...)` registration. The examples use `http://localhost:8000`; replace it with the address reported by your server.

This example performs the same read from a controller:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.base import BaseController
from orionis.support.facades import Route


class PreviewPayloadController(BaseController):
    async def __call__(self, request: Request) -> JSONResponse:
        data = await request.data()
        return response.json({"name": data.get("name")})


Route.post("/payloads/preview", PreviewPayloadController)
```

```bash
curl -X POST http://localhost:8000/payloads/preview -H "Content-Type: application/json" --data-raw '{"name":"Ada"}'
```

It responds with `{"name":"Ada"}`. In PowerShell, use `curl.exe` if `curl` is an alias for another command.

## Choosing how to read the body

`Content-Type` describes the incoming body format; `Accept` indicates the response formats advertised by the client. They are not interchangeable. The parser separates parameters such as `charset` or `boundary` from the media type and normalizes the latter to lowercase.

| Reader | Result and use |
| --- | --- |
| `await request.data()` | Dictionary for a JSON object, URL encoded form, multipart form, or MessagePack map. Preserves repeated form fields as lists. |
| `await request.payload()` | Selects a parser using `Content-Type`; returns bytes if none exists. The result depends on the format. |
| `await request.json()` | Any JSON value: object, list, string, number, boolean, or `None`. |
| `await request.formUrlEncoded()` | Dictionary of URL encoded text values; keeps the last value for each name. |
| `await request.form()` | Multipart `FormData`, including repeated fields and files. |
| `await request.xml()` | Root element of an XML document. |
| `await request.msgpack()` | Decoded MessagePack value. |
| `await request.text()` | UTF-8 text, without checking `Content-Type`. |
| `await request.body()` / `await request.raw()` | Complete body as `bytes`; both use the same buffer. |
| `request.stream()` | Asynchronous iterator of `bytes` chunks, without gathering the entire body. |

### Automatic parser formats

The default `payload()` registry contains all of these media types. Multipart is processed separately through the streaming parser.

| `Content-Type` | `payload()` result |
| --- | --- |
| `application/json` | Python JSON value. |
| `application/x-www-form-urlencoded` | `dict[str, str]`; last repeated value. |
| `multipart/form-data; boundary=...` | `FormData`. |
| `application/msgpack` | Python MessagePack value. |
| `application/xml`, `text/xml` | `xml.etree.ElementTree.Element`. |
| `text/plain`, `text/html` | UTF-8 `str`. |
| `application/javascript`, `text/javascript` | UTF-8 `str`. |
| `application/octet-stream` | Unmodified `bytes`. |
| Missing or unregistered type | Unmodified `bytes`. |

The content is not sniffed. For example, a JSON body sent as `text/plain` is received as text by `payload()`.

:::note[JSON suffixes]
`json()` accepts `application/json` and media types ending in `+json`. In contrast, `payload()` looks for an exact match in its registry, and `data()` only recognizes `application/json`. A type such as `application/vnd.example+json` requires `json()` or an explicit registration for `payload()`; it does not enable `data()`.
:::

## JSON: objects, lists, and simple values

For an incoming JSON object, `data()` is useful when you need to access fields by name. It preserves nested dictionaries and lists; it does not flatten the structure.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_json_object(request: Request) -> JSONResponse:
    data = await request.data()
    return response.json({
        "name": data.get("name"),
        "address": data.get("address"),
        "tags": data.get("tags", []),
    })


Route.post("/payloads/json-object", preview_json_object)
```

```bash
curl -X POST http://localhost:8000/payloads/json-object -H "Content-Type: application/json" --data-raw '{"name":"Ada","address":{"city":"Bogota"},"tags":["python","api"]}'
```

To also accept a list or a simple value, use `json()`:

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_json_value(request: Request) -> JSONResponse:
    value = await request.json()
    return response.json({"value": value})


Route.post("/payloads/json-value", preview_json_value)
```

```bash
curl -X POST http://localhost:8000/payloads/json-value -H "Content-Type: application/json" --data-raw '[1,2,3]'
curl -X POST http://localhost:8000/payloads/json-value -H "Content-Type: application/json" --data-raw 'null'
curl -X POST http://localhost:8000/payloads/json-value -H "Content-Type: application/vnd.example+json" --data-raw '{"enabled":true}'
```

These return `{"value":[1,2,3]}`, `{"value":null}`, and `{"value":{"enabled":true}}`, respectively. JSON strings, numbers, and booleans are also accepted. An empty body is not equivalent to `null`.

`json()` checks the media type and caches the decoded value, including `None`. `data()` requires the JSON to be a `dict`: a list, scalar, or `null` raises `TypeError`.

## URL encoded forms

Use `application/x-www-form-urlencoded` to send text fields without files. Spaces and escaped characters are decoded; empty values are preserved.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_urlencoded(request: Request) -> JSONResponse:
    data = await request.data()
    last_values = await request.formUrlEncoded()
    return response.json({
        "all_values": data,
        "last_values": last_values,
    })


Route.post("/payloads/urlencoded", preview_urlencoded)
```

```bash
curl -X POST http://localhost:8000/payloads/urlencoded --data-urlencode "name=Ada Lovelace" --data-urlencode "tag=python" --data-urlencode "tag=api" --data-urlencode "empty="
```

The response lets you compare both readers:

```json
{
  "all_values": {"name": "Ada Lovelace", "tag": ["python", "api"], "empty": ""},
  "last_values": {"name": "Ada Lovelace", "tag": "api", "empty": ""}
}
```

`payload()` uses the same last-value behavior as `formUrlEncoded()`. `form()` is exclusively for multipart and rejects URL encoded input.

Values remain strings: `age=36` is received as `"36"`, not as an `int`. Names such as `user[name]` or `tags[]` are preserved literally; they do not build nested objects automatically.

## Multipart: repeated fields and files

Use `multipart/form-data` when you need files, repeated fields, or both. The client must include the `boundary` that matches the body. With `curl -F` or browser `FormData`, let the client generate that header.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def inspect_attachments(request: Request) -> JSONResponse:
    with await request.form() as form:
        uploads = form.files.get("attachment", [])
        return response.json({
            "title": form.get("title"),
            "labels": form.getAll("label"),
            "files": [
                {
                    "filename": upload.filename,
                    "content_type": upload.content_type,
                    "size": upload.size,
                    "extension": upload.extension,
                }
                for upload in uploads
            ],
        })


Route.post("/payloads/attachments", inspect_attachments)
```

Create two local test files and replace their paths in the command:

```bash
curl -X POST http://localhost:8000/payloads/attachments -F "title=Documents" -F "label=profile" -F "label=archive" -F "attachment=@./avatar.png" -F "attachment=@./notes.txt"
```

The response includes both files and `labels: ["profile", "archive"]`. The example inspects the attachments and closes their temporary storage; it does not retain the files.

The parser supports quoted boundaries, international names through `filename*`, and parts with `Content-Transfer-Encoding: base64` or `quoted-printable`. Text fields use their part's `charset`, or UTF-8 if none is specified. `form()` processes the transport in chunks, but returns `FormData` once it has finished parsing the form.

### FormData API

| Access | Behavior |
| --- | --- |
| `form.get(key, default=None)` | Last text or file value for the name; returns the default if missing. |
| `form[key]` | Last value; returns `None` if missing. |
| `form.getAll(key)` | List of all values for the name; `[]` if missing. |
| `form.fields` | `dict[str, list[str]]` grouping text values. |
| `form.files` | `dict[str, list[UploadedFile]]` grouping files. |
| `form.multiItems()` | Copy of all `(name, value)` pairs in order. |
| `form.allItems` | Internal list of pairs; do not modify it. |
| `key in form`, `for key in form`, `len(form)` | Membership, unique names, and the number of unique names. |
| `form.close()` | Closes all files in the form. |
| `with form:` | Closes files on exit; it is a synchronous context manager. |

`await request.payload()` also returns the multipart `FormData`. `await request.data()` provides another view: a name that occurs once contains its value; multiple occurrences produce a list. It includes both text and `UploadedFile` objects, even when they share a name. This mixture cannot be serialized directly as a JSON response: convert files to metadata or persist them first.

`form()` caches its result; closing the form does not allow it to be parsed again with newly opened files. The kernel calls `request.close()` when the response lifecycle ends, and the parser cleans up temporary files on failure. Do not use a closed attachment for later work: save what you need to retain first.

### UploadedFile API

File methods are synchronous. `filename` is already sanitized, but `content_type` comes from the client; neither proves that the content is valid.

| Access | Use |
| --- | --- |
| `upload.filename` | Name without separators, control characters, or leading dots; uses `"upload"` if the result is empty. |
| `upload.content_type` | MIME type declared for the part, or `None`. |
| `upload.size` | Accumulated size in bytes. |
| `upload.extension` | Lowercase extension, including the dot; `""` when there is no extension. |
| `upload.read()` | Reads all content as `bytes`. |
| `upload.chunks(size=65536)` | Iterates chunks from the beginning; avoids gathering a second complete copy. |
| `upload.save(path)` | Copies to a `str` or `Path` destination. |
| `upload.replace(data)` | Replaces the content with `bytes` and updates the size. |
| `upload.write(chunk)` | Appends `bytes`, `bytearray`, or `memoryview`. |
| `upload.requiresDiskWrite(size=0)` | Reports whether the file already uses disk or the next write would exceed its threshold. |
| `upload.close()` | Releases its temporary storage. |

`read()` and `chunks()` return to the beginning before reading. `save()` copies the file by opening the destination with `wb`: it overwrites an existing file and does not create parent directories. It does not move the temporary file or choose a unique name. `replace()` preserves the attachment's name and extension.

This handler saves one file through the `Storage` facade under an application-generated identifier:

```python
from uuid import uuid4

from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route, Storage


async def save_attachment(request: Request) -> JSONResponse:
    with await request.form() as form:
        uploads = form.files.get("attachment", [])
        if len(uploads) != 1:
            return response.json(
                {"message": "Send exactly one attachment."},
                status_code=422,
            )
        upload = uploads[0]
        storage_name = uuid4().hex
        await Storage.uploaded(upload).storeAs(
            "uploads", storage_name, disk="local",
        )
        return response.json({
            "id": storage_name,
            "original_name": upload.filename,
            "size": upload.size,
        }, status_code=201)


Route.post("/payloads/attachments/save", save_attachment)
```

```bash
curl -X POST http://localhost:8000/payloads/attachments/save -F "attachment=@./notes.txt"
```

`Storage.uploaded(upload)` adapts the multipart file to the asynchronous storage API. `storeAs()` streams its chunks to the `local` disk; `uploads` is a directory relative to the configured disk root. You do not need physical paths or manual parent-directory creation.

The write finishes before the form is closed. The storage name does not depend on the client, and the file is not published automatically. For the storage API and file rules, see [storage](/en/services/storage) and [file validation](/en/validation/constraints-and-reference#files-and-images).

To transform content before saving it, within the same `with` block read it with `await Storage.uploaded(upload).read()`, apply the transformation, and save the resulting bytes with `await Storage.disk("local").put(f"uploads/{storage_name}", transformed_bytes)` instead of `storeAs()`. This variant reads the entire file into memory. The streaming parser uses the configured threshold; a manually created `UploadedFile(...)` has a different default of 1 MiB.

## MessagePack: maps and other values

`await request.msgpack()` decodes MessagePack maps, lists, and simple values. It can also produce bytes or extension values: not all values can be returned directly as JSON without a domain-specific transformation. `data()` requires a Python map and the exact media type `application/msgpack`.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_msgpack(request: Request) -> JSONResponse:
    value = await request.msgpack()
    return response.json({"value": value})


Route.post("/payloads/msgpack", preview_msgpack)
```

This client uses `msgspec`, a framework dependency, and runs in the project's environment:

```python
from urllib.request import Request, urlopen

import msgspec

body = msgspec.msgpack.encode({"name": "Ada", "tags": ["python", "api"]})
request = Request(
    "http://localhost:8000/payloads/msgpack",
    data=body,
    headers={"Content-Type": "application/msgpack"},
    method="POST",
)
with urlopen(request) as response:
    print(response.read().decode("utf-8"))
```

It responds with `{"value":{"name":"Ada","tags":["python","api"]}}`. Change the value passed to `encode(...)` to `[1, 2]` to try an array; if the handler used `data()`, that array would be rejected. `msgpack()` does not check `Content-Type` itself; `payload()` uses the header to select this parser.

## XML: working with the root element

`xml()` returns an `Element`, not a dictionary. Use its XML operations to extract content:

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_xml(request: Request) -> JSONResponse:
    root = await request.xml()
    return response.json({
        "root": root.tag,
        "name": root.findtext("name"),
        "items": [item.text for item in root.findall("item")],
    })


Route.post("/payloads/xml", preview_xml)
```

```bash
curl -X POST http://localhost:8000/payloads/xml -H "Content-Type: application/xml" --data-raw '<user><name>Ada</name><item>python</item><item>api</item></user>'
```

It responds with `{"root":"user","name":"Ada","items":["python","api"]}`. `payload()` uses the same parser for `application/xml` and `text/xml`; `xml()` decodes without checking the header. `data()` does not convert XML into a dictionary.

The parser uses `defusedxml`: it rejects internal or external entity declarations and does not resolve external resources. A DTD without entity declarations may be accepted. Malformed XML raises `ParseError`; a forbidden entity raises `EntitiesForbidden`, which belongs to `DefusedXmlException`, not `ParseError`.

## Text, HTML, and JavaScript

`text()` decodes bytes as UTF-8. `payload()` applies the same decoding to `text/plain`, `text/html`, `application/javascript`, and `text/javascript`; it returns a string without interpreting HTML or executing JavaScript.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_text(request: Request) -> JSONResponse:
    text = await request.text()
    return response.json({"text": text, "characters": len(text)})


Route.post("/payloads/text", preview_text)
```

```bash
curl -X POST http://localhost:8000/payloads/text -H "Content-Type: text/plain; charset=utf-8" --data-raw 'Hola Orionis'
curl -X POST http://localhost:8000/payloads/text -H "Content-Type: text/html" --data-raw '<p>Hola</p>'
curl -X POST http://localhost:8000/payloads/text -H "Content-Type: application/javascript" --data-raw 'const ready = true;'
```

Decoding uses strict UTF-8, even if the header advertises another `charset`. For another encoding, use `(await request.body()).decode("latin-1")` explicitly. The `charset` parameter does not automatically reconfigure `text()` or the registry's text parser.

## Binary data and types without a parser

Use `body()` or its equivalent `raw()` to receive bytes without decoding, for example a binary signature or a file sent as the complete body instead of multipart.

```python
from hashlib import sha256

from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def inspect_binary(request: Request) -> JSONResponse:
    content = await request.body()
    return response.json({
        "size": len(content),
        "sha256": sha256(content).hexdigest(),
    })


Route.post("/payloads/binary", inspect_binary)
```

```bash
curl -X POST http://localhost:8000/payloads/binary -H "Content-Type: application/octet-stream" --data-binary "@./notes.txt"
```

No `UploadedFile` is created for this body. `payload()` also returns bytes for `application/octet-stream`, an unknown media type, or a missing header. In contrast, `data()` rejects those types.

## Streaming: processing chunks without gathering the entire body

`stream()` lets you consume payloads that exceed the complete-buffer budget while respecting the total request limit. The transport determines chunk boundaries: they do not represent lines, JSON objects, or multipart parts.

```python
from hashlib import sha256

from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def inspect_stream(request: Request) -> JSONResponse:
    digest = sha256()
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        digest.update(chunk)
    return response.json({"size": size, "sha256": digest.hexdigest()})


Route.post("/payloads/stream", inspect_stream)
```

```bash
curl -X POST http://localhost:8000/payloads/stream -H "Content-Type: application/octet-stream" --data-binary "@./notes.txt"
```

This handler produces the same size and hash as the binary example without retaining a complete copy of the content. There is no native NDJSON parser: if you need line-delimited messages, the consumer must retain fragments between chunks and separate the records.

### Repeated reads and consumption order

| First operation | What you can do afterward |
| --- | --- |
| `body()`, `raw()`, or a parser that gathers bytes | Read the buffer again using `body()`, other readers, or `stream()`, provided it does not exceed `max_buffer_size`. |
| `stream()` over the transport without a previous buffer | Consumes the body once; a later reader cannot recover it. |
| `form()` over the transport without a previous buffer | Multipart consumes the stream; you can reuse the cached `FormData`, but cannot read the bytes again. |
| `body()` followed by `form()` | Multipart can process the stored copy; the complete body had to fit in the buffer. |

A read after consuming an unbuffered stream raises `RuntimeError`. Reading everything with `body()` solely to enable a second read removes the benefit of streaming.

`json()`, `formUrlEncoded()`, `form()`, and `data()` store their parsed result. `xml()`, `msgpack()`, and `payload()` may run their parser again over the buffer; `payload()` reuses `FormData` for multipart. A buffer does not imply that all parsed results are shared. Returned dictionaries and forms belong to the request: avoid modifying them if another component needs their original content.

## URL, parameters, headers, and cookies

These sources are independent of the body. `data()` and `payload()` do not merge the query string, route parameters, headers, or cookies with submitted fields.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def inspect_request(item_id: int, request: Request) -> JSONResponse:
    request.state.inspection = "request-info"
    return response.json({
        "method": request.method,
        "scheme": request.scheme,
        "path": request.path,
        "url": request.url,
        "base_url": request.baseUrl,
        "http_version": request.httpVersion,
        "interface": str(request.interface),
        "item_id": request.routeParam("item_id"),
        "tags": request.queryParams.getAll("tag"),
        "page": request.queryParams.get("page", "1"),
        "client_header": request.headers.get("x-client"),
        "language": request.cookies.get("language", "es"),
        "ip": request.ip,
        "port": request.port,
        "bearer_present": request.bearerToken is not None,
        "label": request.state.inspection,
        "wants_json": request.wantsJson(),
        "wants_html": request.wantsHtml(),
        "wants_xml": request.wantsXml(),
        "accepts_xml": request.accepts("application/xml"),
        "ajax": request.isAjax(),
        "csrf_available": request.csrfToken() is not None,
    })


Route.get("/request-info/{item_id:int}", inspect_request)
```

```bash
curl "http://localhost:8000/request-info/42?tag=python&tag=api&page=2" -H "X-Client: documentation" -H "Authorization: Bearer example-token" --cookie "language=en"
```

`item_id` is the integer `42` converted by the router and passed as an action argument, so it must appear in the signature. `routeParam("item_id")` lets you read it from Request. `page` remains `"2"`, and `tags` contains `["python", "api"]`. See [route parameters](/en/http/routing) for their converters.

### QueryParams, Headers, and Cookies

| Structure | Operations |
| --- | --- |
| `request.queryParams` | `get(key, default=None)` and `[key]` select the last value; `getAll(key)` and its alias `getList(key)` preserve all values. `items()` and `multiItems()` copy repeated pairs. |
| `request.headers` | `get(key, default=None)` and `[key]` use case-insensitive lookup; `getAll(key)` returns all values for that header, and `getAll()` groups all headers by lowercase name. `count(key)` counts occurrences. `items()` copies pairs, `byteItems()` encodes them as UTF-8, and `hasInvalidFormat()` detects CR/LF in names or values. |
| `request.cookies` | `get(key, default=None)` and `[key]` look up cookies; `getAll()` returns a copy of the dictionary. Repeated names keep the last value. |

All three structures provide `keys()`, `values()`, and `items()`. In `QueryParams` and `Headers`, `keys()` returns a set of names, `values()` preserves values, and `len(...)` counts pairs, including duplicates. In `Cookies`, it counts names. You can use `key in structure`; direct iteration yields `(name, value)` pairs. Query and cookie lookups are case-sensitive. Accessing a missing name with `[key]` raises `KeyError` in these three structures, unlike `FormData`.

### Request properties

| Property | Content |
| --- | --- |
| `method` | HTTP method, such as `GET`, `POST`, or `QUERY`. |
| `scheme` | Transport scheme; `"http"` when the adapter does not provide one. |
| `path` | Path; `"/"` as a fallback. |
| `httpVersion` | HTTP version; `"1.1"` if absent from the scope. |
| `interface` | `Interface.ASGI` or `Interface.RSGI` enum. |
| `url` | URL with query string; uses `Host`, falling back to the scope's server. |
| `baseUrl` | Scheme and authority; includes `root_path` in ASGI when present. Its contract does not append a trailing slash. |
| `headers` | `Headers` structure. |
| `queryParams` | `QueryParams` structure with text values. |
| `cookies` | `Cookies` structure. |
| `ip`, `port` | Client IP and port available in the scope, or `None`. |
| `forwarded` | Normalized forwarding information in the scope; `{}` if missing. |
| `userAgent` | `User-Agent` header, or `None`. |
| `authorization` | `Authorization` header, or `None`. |
| `bearerToken` | Credential following `Bearer `, with surrounding whitespace removed; `None` if missing, empty, or there are multiple Authorization headers. |
| `apiKey` | `X-API-Key` value, or `None`. |
| `accept` | Original `Accept` header, or `None`. |
| `state` | Mutable `SimpleNamespace` for sharing data within this request. |
| `scope` | ASGI/RSGI transport dictionary; it is not the payload. |
| `csrf_token` | Property alias that calls `csrfToken()`. |

`bearerToken` recognizes the Bearer scheme without case sensitivity. These properties extract credentials; they do not authenticate the client. Forwarding data depends on the middleware and proxies configured as trusted; reading a client header directly does not provide a trusted IP. See [middleware](/en/http/middleware-and-security).

Use `request.state` for temporary data added by middleware, such as `request.state.actor_id`. It is not a persistent session, and its attributes do not exist until someone assigns them; you can read them using `getattr(request.state, "actor_id", None)`. `scope` and `routeParams()` expose dictionaries, but modifying cached data does not automatically recalculate all Request properties.

### Synchronous helpers

| Method | Behavior |
| --- | --- |
| `routeParam(key)` | Converted route parameter value, or `None` if missing. |
| `routeParams()` | Dictionary of all route parameters. |
| `wantsJson()` | `True` if Accept contains `application/json` or `+json`. |
| `wantsHtml()` | `True` if it contains `text/html` or `*/*`. |
| `wantsXml()` | `True` if it contains `application/xml` or `text/xml`. |
| `accepts(mime)` | Checks whether Accept contains the MIME text, without case sensitivity. |
| `isAjax()` | Checks `X-Requested-With: XMLHttpRequest` for that exact value. |
| `csrfToken()` | Token placed in `state.csrf_token` by CSRF middleware; `None` if unavailable. |
| `close()` | Closes the parsed multipart files; it can be called repeatedly. |

The `Accept` helpers perform text searches rather than preference negotiation with `q` priorities. `Accept: */*` makes `wantsHtml()` true, but not `wantsJson()` or `accepts("application/json")`. None of them validates the body's `Content-Type`.

The CSRF token is usually available in the WEB context where its middleware runs; the helper does not create one itself. See [WEB route layers](/en/http/routing#automatic-web-layers) and [view forms](/en/services/views/rendering-templates) for that context.

## Additional parsers for payload()

`MediaTypeRegistry` maps exact media types to synchronous `(bytes) -> object` functions. The kernel uses `DEFAULT_MEDIA_TYPES` for the Request objects it constructs. Register parsers during application startup, before serving requests.

This example adds a specific JSON type and receives its content through `payload()`:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.payload.media_types import DEFAULT_MEDIA_TYPES
from orionis.http.payload.parsers import parse_json
from orionis.support.facades import Route

DEFAULT_MEDIA_TYPES.register("application/vnd.example+json", parse_json)


async def preview_registered_payload(request: Request) -> JSONResponse:
    value = await request.payload()
    return response.json({"value": value})


Route.post("/payloads/registered", preview_registered_payload)
```

```bash
curl -X POST http://localhost:8000/payloads/registered -H "Content-Type: application/vnd.example+json" --data-raw '{"enabled":true}'
```

The registry also accepts a custom parser, such as a function that decodes CSV. The parser must be synchronous: `payload()` calls it directly and does not await a coroutine. It does not change the fixed formats supported by `data()`. `register(media_type, parser)` adds or replaces a parser; `get(media_type)` returns the parser or `None`; both normalize to lowercase. `extend(parsers)` returns another registry without modifying the original and only applies if you pass it to a manually constructed Request; it does not reconfigure the kernel automatically.

### Constructing Request in adapters

In application code, receive Request through injection. For transport integrations or tests, the constructor accepts `Request(interface, adapter, body_stream=None, *, registry=None, receive_or_protocol=None, params=None, body_limits=None)`:

| Argument | Purpose and default |
| --- | --- |
| `interface`, `adapter` | Required: ASGI/RSGI `Interface` and transport adapter. |
| `body_stream` | Preconstructed `IBodyStream` reader; `None` creates one when the body is accessed. |
| `registry` | `payload()` registry; `None` uses `DEFAULT_MEDIA_TYPES`. |
| `receive_or_protocol` | ASGI callable or RSGI protocol for the deferred reader; defaults to `None`. |
| `params` | Mapping of route parameters; `None` means none. |
| `body_limits` | `HTTPBodyLimits` instance; `None` uses its defaults. |

The infrastructure constructs these objects from the transport; you do not need to build an adapter to read the body in a controller.

## Body and multipart limits

`config/http.py` configures `body_limits` through `HTTPBodyLimits`. Values are bytes except for counts. The total limit and buffer limit are different: a payload may fit within the total but still exceed what `body()` or `json()` allows.

| Setting | Environment variable | Default |
| --- | --- | --- |
| `max_body_size` | `HTTP_MAX_BODY_SIZE` | 16 MiB |
| `max_buffer_size` | `HTTP_MAX_BUFFER_SIZE` | 2 MiB |
| `max_files` | `HTTP_MAX_FILES` | 32 |
| `max_fields` | `HTTP_MAX_FIELDS` | 128 |
| `max_part_size` | `HTTP_MAX_PART_SIZE` | 10 MiB |
| `max_field_size` | `HTTP_MAX_FIELD_SIZE` | 1 MiB |
| `max_header_size` | `HTTP_MAX_PART_HEADER_SIZE` | 16 KiB |
| `memory_threshold` | `HTTP_UPLOAD_MEMORY_THRESHOLD` | 256 KiB |
| `max_memory_size` | `HTTP_MAX_MULTIPART_MEMORY_SIZE` | 8 MiB |

`HTTPBodyLimits` also includes `max_concurrent_requests`, configured through `HTTP_MAX_CONCURRENT_REQUESTS`, with an initial value of `128` per kernel. It limits active requests, including response delivery, rather than payload size.

When this concurrency is exhausted, the kernel rejects new requests with `503` and `Retry-After: 1`. It also validates `Content-Length`: invalid values, duplicates, or combinations with `Transfer-Encoding` produce `400` before reading; a declared length exceeding the total produces `413`. The reader also counts actual bytes even when that header is missing.

All byte budgets must be positive. `max_files=0` and `max_fields=0` reject that kind of part; they do not mean unlimited. Part and field limits still apply when you increase the total.

The file threshold moves storage from memory to a temporary disk file. The total multipart budget counts retained text and files still in memory; it does not represent all process memory, transport buffers, or copies created by your code. Your choice of reader determines whether `max_buffer_size` also applies.

## Reading and validation errors

| Situation | Reader result |
| --- | --- |
| Total body, buffer, or multipart budget exceeded | `PayloadTooLargeException`. Default HTTP handling responds with `413`. |
| Media type incompatible with `json()`, `formUrlEncoded()`, `form()`, or `data()` | `UnsupportedMediaTypeException`; the base HTTP handler responds with `415`. |
| Empty or invalid JSON through `json()` or `data()` | `ValueError`. |
| Invalid MessagePack through `data()` | `ValueError`; the direct `msgpack()` reader may raise `msgspec.DecodeError`. |
| JSON non-object or MessagePack non-map through `data()` | `TypeError`. |
| Text that is not UTF-8 | `UnicodeDecodeError`. |
| Multipart without a boundary or malformed multipart | `ValueError` or the corresponding parsing/limit exception. |
| Stream consumed without a buffer | `RuntimeError`. |

The automatic `payload()` parser propagates exceptions from the registered function: for example, `msgspec.DecodeError` for invalid JSON. It does not wrap errors in the same way as `json()` or `data()`. Reading failures are not equivalent to `ValidationException` and do not generate its field errors by themselves.

If the endpoint must define its own responses for these cases, catch the specific exceptions. For example:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.request import UnsupportedMediaTypeException
from orionis.support.facades import Route


async def receive_json(request: Request) -> JSONResponse:
    try:
        value = await request.json()
    except UnsupportedMediaTypeException:
        return response.json(
            {"message": "Use application/json or a +json media type."},
            status_code=415,
        )
    except ValueError:
        return response.json({"message": "Send valid JSON."}, status_code=400)
    return response.json({"value": value})


Route.post("/payloads/checked-json", receive_json)
```

The handler defines its own `415` message for the incompatible type and explicitly converts `ValueError` into `400`. Although the base handler already recognizes `UnsupportedMediaTypeException`, there is no general conversion to `400` for invalid JSON, XML errors, or incorrect body value types; without specific handling, they follow general exception handling. Route policies and the application handler may change these responses.

For required fields, types, and rules, use [input schemas](/en/validation/controllers-and-http). To choose how to respond, continue with [HTTP responses](/en/http/responses).
