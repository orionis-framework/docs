---
title: "Servidores MCP nativos"
description: "Orionis declara herramientas, recursos y prompts como clases Python y compila su contrato una vez para HTTP, STDIO y pruebas. La versión del protocolo MCP admitida es…"
editUrl: true
lastUpdated: false
---

Orionis declara herramientas, recursos y prompts como clases Python y compila su contrato una vez para HTTP, STDIO y pruebas. La versión del protocolo MCP admitida es `2026-07-28`, único valor de `SUPPORTED_VERSIONS`; verifica esa compatibilidad con el cliente que conectarás.

MCP (Model Context Protocol) permite que clientes compatibles descubran e invoquen herramientas de tu aplicación, lean recursos declarados y obtengan prompts reutilizables. Orionis proporciona el servidor; tus servicios de negocio realizan el trabajo y controlan el acceso. Empieza con una herramienta de solo lectura, comprueba su resultado local y elige HTTP para un cliente remoto o STDIO para integrar un proceso local.

1. [Tu primer servidor y herramientas tipadas](/es/protocols/mcp/servers-and-tools).
2. [Recursos, plantillas URI y prompts](/es/protocols/mcp/resources-and-prompts).
3. [Contenido, serialización y metadata](/es/protocols/mcp/responses-and-content).
4. [HTTP, STDIO y configuración](/es/protocols/mcp/transports-and-configuration).
5. [Progreso, continuación, suscripciones y extensiones](/es/protocols/mcp/advanced-workflows).

Requiere Python 3.14+, schemas/msgspec para contratos tipados y una aplicación inicializada para registro de transportes. Los ejemplos con `compile_server` y `McpTestClient(Container(), ServerClass)` funcionan sin servidor ni datos externos. La expansión RFC 6570 utiliza la dependencia declarada `uritemplate`; publicar recursos no otorga acceso implícito al filesystem.

El contexto de cada llamada es independiente. Ninguna anotación descriptiva de una herramienta sustituye [autenticación/autorización](/es/security/authentication). Los endpoints web usan el [kernel HTTP](/es/http) y los handlers usan el [contenedor](/es/architecture/service-container).
