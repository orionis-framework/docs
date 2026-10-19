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

1. [HTTP controllers](/en/http/request-lifecycle): generation, actions, parameters and route integration.
2. [Routes, parameters and groups](/en/http/routing): design an API and organize access.
3. [HTTP validation with schemas](/en/http/requests-and-validation): receive validated controller input and return schemas as JSON.
4. [Forms and uploads](/en/http/forms-and-uploads): repeated input and temporary resources.
5. [Responses and cookies](/en/http/responses): JSON, views, redirects and downloads.
6. [Streaming and SSE](/en/http/streaming-and-sse): progressive delivery and cleanup.
7. [WebSocket](/en/http/websockets): connections, messages and middleware.
8. [HTTP middleware](/en/http/middleware-and-security): creation, registration and request/response processing.
9. [Default pages and routes](/en/http/default-responses): health, errors and optional authentication.

Continue with [sessions](/en/http/sessions), [authentication](/en/security/authentication), [schemas](/en/validation), [views](/en/services/views) and [Realtime hubs](/en/asynchronous/realtime).
