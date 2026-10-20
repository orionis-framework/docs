---
title: "HTTP exceptions and the diagnostic page"
description: "Understand error responses in the HTTP flow, the exception page in debug mode, and the information that helps locate a failure."
editUrl: true
lastUpdated: false
---

An exception can interrupt body reading, middleware, dependency resolution, or a controller action. The HTTP layers and kernel turn failures they can handle into a response for the client. The result depends on the exception type, debug mode, and when the failure occurs.

This page focuses on **HTTP requests and responses**. The [general exception guide](/en/architecture/exception-handling), under **Deployment, logs, and errors**, explains `app.withExceptionHandler(ExceptionHandler)`, the `failure` contracts, reporting, and the framework's other contexts.

## From an exception to an HTTP response

While processing a request, Orionis distinguishes between special responses in the HTTP flow and errors it must delegate to the application handler:

1. A layer can handle a case directly, such as validation errors.
2. For other errors, the exception system reports the failure and asks the handler for an HTTP response.
3. The ASGI/RSGI adapter delivers that response with its status, headers, and body.

In WEB, the session layer can also catch errors from its downstream components and delegate them while the session remains available. Conversion therefore does not happen exclusively in a single `except` at the end of the kernel.

An error response is not always a `500` and does not always show a traceback. An authorization failure can produce `403`; a missing route, `404`; and an invalid schema, `422` or a redirect depending on its context.

## When the exception page appears

The native handler preserves the statuses of known exceptions. For **unrecognized exceptions**, it checks `app.debug`:

| Mode | What the client requests | Native response to an unrecognized error |
| --- | --- | --- |
| Debug disabled | HTML or another Accept without JSON | Generic HTML page, status `500`. |
| Debug disabled | Accept containing JSON | JSON `500`: `{"message": "Internal Server Error"}`. |
| Debug enabled | HTML | Detailed HTML exception page, status `500`. |
| Debug enabled | Accept containing JSON | The same detailed HTML page, status `500`. |

**An API route does not guarantee JSON for an unexpected failure with debug enabled.** The detailed page helps debug that failure even when the endpoint normally returns JSON. Protocol policies, such as MCP, and custom handlers can apply a different response.

The setting is declared through `APP_DEBUG` and read from `config/app.py`. To inspect the diagnostic locally:

```dotenv
APP_DEBUG=bool:true
```

Restart the application to apply its startup configuration. If you use compilation, see the [registration and configuration considerations](/en/architecture/exception-handling#compiled-configuration-and-running-processes).

The environment name `APP_ENV` does not replace this setting: an environment named production with debug enabled still exposes the diagnostic.

## Triggering and recognizing an example failure

To test the flow in a local application, save this controller as `app/http/controllers/http_error_demo_controller.py`:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.base import BaseController


class HttpErrorDemoController(BaseController):
    async def __call__(self, request: Request) -> JSONResponse:
        quantity = int(request.queryParams.get("quantity", "invalid"))
        return response.json({"quantity": quantity})
```

Register it in the configured API routes file, normally `routes/api.py`:

```python
from app.http.controllers.http_error_demo_controller import HttpErrorDemoController
from orionis.support.facades import Route

Route.get("/http-error-demo", HttpErrorDemoController)
```

With the application running, open `/http-error-demo?quantity=invalid` or use:

```bash
curl -i "http://localhost:8000/http-error-demo?quantity=invalid" -H "Accept: text/html"
curl -i "http://localhost:8000/http-error-demo?quantity=invalid" -H "Accept: application/json"
```

`int("invalid")` raises `ValueError`. The native implementation does not automatically turn it into an input error with status `400`: with debug enabled, both requests receive the detailed `500` page. With `quantity=3`, the endpoint returns `{"quantity":3}`.

This endpoint demonstrates a programming error or missing validation. For real input, declare a [request schema](/en/http/requests-and-validation) or handle the conversion explicitly; keep this endpoint only as a local demonstration.

## What the page contains and how to read it

### Exception type and message

The heading identifies the class, such as `ValueError`, and its associated message. The class indicates which operation failed; the text supplies the specific detail, for example that a string cannot be converted to an integer.

A message alone does not identify the business cause. Compare it with the indicated line and the arguments that operation expected.

### Request method and path

The page shows the HTTP method and path being processed. They help distinguish endpoints with similar logic and reproduce the failure through the correct flow.

The diagnostic receives the request path, rather than a complete dump of the URL with all its parameters, the body, or the headers.

### Exception Details: file, line, and code

Each frame can show its file, line number, and a code snippet with the failing line highlighted. The window includes up to five lines: two preceding lines, the indicated line, and two following lines.

This places the operation in its immediate context. In the example above, start with the conversion to `int` and check whether the input was validated first.

If the source file cannot be read, the diagnostic keeps the available details and indicates that no code is available. This can happen when the code is not available as a readable file in that environment.

The editor link uses the `vscode://file/...` protocol. Opening it depends on the computer having an editor and browser that support that protocol and can access the displayed path.

### Stack Trace: the call sequence

The side panel lists the file, function, and line for each frame, ordered **from most recent to oldest**. Selecting one takes you to its code block.

Start at the failing frame and follow the calls that led to it. This helps identify whether the error originated in the controller, an invoked service, data conversion, or a framework dependency. Links and content remain available without JavaScript; the interaction improves navigation between frames.

### System Info: execution context

| Detail | Purpose |
| --- | --- |
| Orionis Framework | Identify the implementation being executed. |
| Python | Compare interpreter behavior between environments. |
| Environment | Recognize the configured environment. |
| Debug Mode | Confirm the diagnostic setting. |
| Timezone | Put date and time operations in context. |
| Interface | Identify whether HTTP delivery uses ASGI or RSGI. |

These details help compare a local reproduction with another deployment. The panel does not list all environment variables or configuration options.

## Copying the report and consulting resources

The page includes tools that use the diagnostic information:

| Action | Content and behavior |
| --- | --- |
| Copy report | Copies the type and message, method and path, file paths, lines, and code snippets. The button depends on the browser offering the Clipboard API. |
| Google | Searches for the Python exception type; the search does not include the full report. |
| ChatGPT | Opens a link with the diagnostic encoded in the URL. |
| Documentation | Opens the framework documentation. |

The ChatGPT URL is built locally; rendering the page does not send a query to the service. **Opening that link transmits the content included in the URL.** The implementation limits its length to 2048 characters: it can omit snippets, shorten fields, or discard older frames, indicating the truncation. That limit belongs to the Orionis generator.

Before sharing a report, review its message and code. Although the parser does not capture local variables, an exception message or source snippet can contain private information.

## HTTP exceptions with known statuses

The base handler walks the exception hierarchy to recognize these cases, including subclasses:

| Exception | Status | Native public message |
| --- | --- | --- |
| `AuthenticationException` | `401` | `Unauthenticated` |
| `AuthorizationException` | `403` | `This action is unauthorized` |
| `RouteNotFound` | `404` | `Route not found` |
| `MethodNotAllowed` | `405` | `Method not allowed` |
| `PayloadTooLargeException` | `413` | `Payload too large` |
| `UnsupportedMediaTypeException` | `415` | `Unsupported media type` |
| `CSRFTokenMismatchException` | `419` | `CSRF token mismatch` |

These cases keep their status and message with debug enabled or disabled. The handler chooses JSON or HTML through `request.wantsJson()`, which checks Accept, rather than the routes filename. If the authentication failure comes from the token guard, it adds `WWW-Authenticate: Bearer`.

The kernel can handle some cases earlier with its own response, so the exact message for a `413` depends on the layer handling it. Not every exception reaches the global handler.

## Validation, parsing, and other flow errors

| Situation | Default HTTP handling |
| --- | --- |
| Invalid schema in API | JSON `422` with field messages. |
| Invalid schema in WEB expecting JSON or using AJAX | JSON `422`. |
| Invalid schema in ordinary WEB navigation | `302` redirect with errors and input flashed to the session. |
| Body or buffer limit exceeded in the kernel | `413`; it can be handled before calling the global handler. |
| Invalid or duplicate Content-Length, or ambiguous framing with Transfer-Encoding | `400` built before reading the body. |
| Missing route with a configured fallback | Executes the corresponding fallback. |
| Application exception without specific handling | Application handler policy; by default, a generic `500` or diagnostic according to debug mode. |

Malformed JSON can raise `ValueError`; XML or MessagePack use their decoding exceptions. There is no universal rule turning every parsing exception into `400`. See [Request reading errors](/en/http/forms-and-uploads#reading-and-validation-errors) and [validation handling](/en/validation/controllers-and-http).

If a domain condition needs a response such as `409`, define that translation in the [application handler](/en/architecture/exception-handling/handling-exceptions). Catching an exception locally and returning a response is also valid when that component can handle the case.

## Development diagnostics and public responses

For an application exposed to users, disable debug:

```dotenv
APP_DEBUG=bool:false
```

With the native handler, an unrecognized error returns `Internal Server Error` without the traceback. The [general guide](/en/architecture/exception-handling) explains how to preserve internal reporting and define public messages for application errors.

Error templates escape HTML, and native responses include `Cache-Control: no-cache, no-store, must-revalidate`. Escaping prevents text from being interpreted as HTML; it does not remove secrets from messages or code.

The parser uses `capture_locals=False` and does not automatically include local variables or the request body, cookies, or headers. The page still displays file paths and source code, so it belongs in a controlled diagnostic context.

`DefaultResponses.exception()` is a renderer and does not apply the debug check itself. A direct call from application code can show the diagnostic even when debug is disabled; keep the exposure decision in the handling policy.

## If response delivery has already started

Conversion to an error page happens during request processing. Body delivery, streaming producers, and background tasks happen afterward.

If a producer fails after the headers have been sent, that response cannot be replaced with an exception page. The transport attempts to close resources and propagates the failure. Background errors also cannot change an HTTP status that has already been delivered.

See [HTTP responses and delivery](/en/http/responses), [streaming and SSE](/en/http/streaming-and-sse), and the [general exception guide](/en/architecture/exception-handling) for their respective boundaries.
