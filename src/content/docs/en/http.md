---
title: "HTTP: from routes to responses"
description: "Orionis provides a common HTTP API over ASGI and RSGI. The same controller can receive a normalized request, validate input and return JSON, HTML, a file, a stream or SSE.…"
editUrl: true
lastUpdated: false
---

Orionis provides a common HTTP API over ASGI and RSGI. The same controller can receive a normalized request, validate input and return JSON, HTML, a file, a stream or SSE. WebSocket connections use a separate connection API within the same routing system.

You need Python 3.14+, the framework's declared dependencies and a booted application to use facades and container services. Function examples are application code executed when the kernel handles a request. Examples that only construct responses can run without starting a server.

Create an Orionis project first using [installation](/en/getting-started/installation). The paths below are relative to that application, not to the installed framework package. Route declarations run during application boot; handlers run when a request matches a route.

Check the existing `app.withRouting(...)` call in `bootstrap/app.py`: it must register the route files you use, commonly `web="routes/web.py"` and `api="routes/api.py"`. Creating an unregistered route file does not expose its endpoints. Keep existing arguments when adding another file.

## Recommended path

1. [Routes](/en/http/routing): methods, parameters, groups and endpoint registration.
2. [Middlewares](/en/http/middleware): creation, registration and request/response processing.
3. [Controllers](/en/http/controllers): generation, actions, parameters and route integration.
4. [Validation](/en/http/validation): receive validated controller input and return schemas as JSON.
5. [Request and HTTP payloads](/en/http/requests): request access, body formats and uploaded files.
6. [Responses](/en/http/responses): JSON, schemas, views, redirects and downloads.
7. [HTTP exceptions](/en/http/exceptions): error responses and the diagnostic page.

For other HTTP flows and services, see [streaming and SSE](/en/realtime/streaming-and-sse), [WebSocket](/en/realtime/websocket) and [default pages and routes](/en/deployment/health-and-default-responses).

Continue with [sessions](/en/sessions), [authentication](/en/authentication), [schemas](/en/validation), [views](/en/views) and [Realtime hubs](/en/realtime).
