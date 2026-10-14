---
title: "Native MCP servers"
description: "Orionis declares tools, resources and prompts as Python classes and compiles their contract once for HTTP, STDIO and tests. The supported MCP protocol is 2026-07-28, the only…"
editUrl: true
lastUpdated: false
---

Orionis declares tools, resources and prompts as Python classes and compiles their contract once for HTTP, STDIO and tests. The supported MCP protocol is `2026-07-28`, the only value in `SUPPORTED_VERSIONS`; check compatibility with your intended client.

MCP (Model Context Protocol) lets compatible clients discover and call your application's tools, read declared resources and obtain reusable prompts. Orionis provides the server side; your business services still perform the work and enforce access. Start with one read-only tool, verify its result locally, then choose HTTP for a remote client or STDIO for a local process integration.

1. [Your first server and typed tools](/en/protocols/mcp/servers-and-tools).
2. [Resources, URI templates and prompts](/en/protocols/mcp/resources-and-prompts).
3. [Content, serialization and metadata](/en/protocols/mcp/responses-and-content).
4. [HTTP, STDIO and configuration](/en/protocols/mcp/transports-and-configuration).
5. [Progress, continuation, subscriptions and extensions](/en/protocols/mcp/advanced-workflows).

Requires Python 3.14+, schemas/msgspec for typed contracts and a booted application for transport registration. Examples using `compile_server` and `McpTestClient(Container(), ServerClass)` work without a server or external data. RFC 6570 expansion uses the declared `uritemplate` dependency; publishing resources does not implicitly grant filesystem access.

Each call has independent context. Descriptive annotations never replace [authentication/authorization](/en/security/authentication). Web endpoints use the [HTTP kernel](/en/http) and handlers use the [container](/en/architecture/service-container).
