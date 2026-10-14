---
title: "Transportes HTTP, STDIO y configuración"
description: "Registra una clase Server durante el boot con la facade Mcp. web(path, server) crea una ruta POST API nativa y devuelve su builder; admite paths fijos sin parámetros, query ni…"
editUrl: true
lastUpdated: false
---

Registra una clase Server durante el boot con la facade `Mcp`. `web(path, server)` crea una ruta POST API nativa y devuelve su builder; admite paths fijos sin parámetros, query ni fragmento. `local(name, server)` registra un handle explícito con letras, dígitos, punto, guion o underscore. No permite iniciar módulos arbitrarios por nombre proporcionado por un cliente.

Utiliza `DemoServer` de [servidores y herramientas](/es/protocols/mcp/servers-and-tools). Crea `routes/ai.py` con estos registros y añade `ai="routes/ai.py"` a la llamada existente `app.withRouting(...)` de `bootstrap/app.py`, conservando sus demás argumentos. Este archivo se carga tanto para HTTP como para los comandos Reactor:

```python
from app.mcp.servers.demo_server import DemoServer
from orionis.support.facades import Mcp

Mcp.web("/mcp/application", DemoServer)
Mcp.local("application", DemoServer)
```

Este bloque necesita una aplicación inicializada. Añade middleware API de autenticación al builder web cuando todo el servidor deba estar protegido. La resolución de identidad no exige automáticamente credenciales; los hooks `authorize` siguen protegiendo operaciones.

Para un servidor HTTP privado, adjunta autenticación mediante token al registro:

```python
from orionis.auth.middleware import AuthenticateTokenMiddleware

Mcp.web("/mcp/private", DemoServer).middleware(AuthenticateTokenMiddleware)
```

Esto crea un endpoint protegido distinto. El cliente debe enviar `Authorization: Bearer <token>` con una credencial válida; la autorización de cada herramienta sigue decidiendo qué registros o acciones puede acceder esa identidad. STDIO no recibe por defecto una petición de navegador con token: define una política confiable de ejecución local para esa integración.

## Contrato HTTP real

El transporte exige POST, un único `Content-Type: application/json` y Accept que incluya explícitamente `application/json` y `text/event-stream` con calidad positiva. Una respuesta finita utiliza JSON; progreso/suscripción puede usar SSE. El protocolo refleja metadata del envelope en cabeceras:

```http
POST /mcp/application HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
MCP-Method: tools/call
MCP-Name: greet
```

El cuerpo correspondiente reutiliza la herramienta del [primer capítulo](/es/protocols/mcp/servers-and-tools):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "greet",
    "arguments": {
      "name": "Ada"
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

En esta llamada de saludo, la respuesta JSON-RPC conserva `id: 1` e incluye el resultado de la herramienta con el valor estructurado `"Hello, Ada!"`. El cliente debe admitir esta versión del protocolo y su contrato de cabeceras; un POST JSON genérico que las omita no basta.

El protocolo exige coincidencia entre cabeceras y cuerpo para versión, método y nombre/URI de primitivas. Los parámetros anotados `x-mcp-header` requieren además cabeceras `MCP-Param-<name>` compatibles; solo se permiten propiedades primitivas alcanzables estáticamente. Datos binarios/MIME de un recurso no cambian el Content-Type JSON del envelope.

Una cabecera Origin ausente está permitida. Si aparece debe coincidir exactamente con `allowed_origins`, lista de orígenes HTTP(S) validados. No hay wildcard ni excepción implícita de mismo origen. Bootstrap utiliza `CORS_ALLOW_ORIGINS`; CORS HTTP o WebSocket pueden tener reglas diferentes. Se rechaza origen, método o media type antes de leer un cuerpo grande.

## STDIO y consola

Inicia un handle registrado con `python -B reactor mcp:start application`; `python -B reactor mcp:list` muestra servidores. Los generadores son `make:mcp-server`, `make:mcp-tool`, `make:mcp-resource` y `make:mcp-prompt`. Los comandos se ejecutan en el contexto de la aplicación configurada.

STDIO usa mensajes JSON por línea; stdout se reserva exclusivamente para frames y diagnósticos van a stderr. El transporte acota lectura y concurrencia, admite cancelación por notificación y usa el mismo dispatcher que HTTP. No imprimas logging convencional en stdout dentro de handlers.

## Presupuestos

| Variable | Predeterminado |
|---|---:|
| `MCP_MAX_REQUEST_SIZE` | `HTTP_MAX_BODY_SIZE` o 1 MiB |
| `MCP_MAX_CONCURRENT_REQUESTS` | `HTTP_MAX_CONCURRENT_REQUESTS` o 32 |
| `MCP_DEFAULT_PAGE_SIZE`, `MCP_MAX_PAGE_SIZE` | 50, 100 |
| `MCP_MAX_RESPONSE_SIZE`, `MCP_MAX_METADATA_SIZE` | 4 MiB, 64 KiB |
| `MCP_SUBSCRIPTION_BUFFER_SIZE`, `MCP_MAX_SUBSCRIPTIONS` | 64, 1024 |
| `MCP_MAX_RESOURCE_SUBSCRIPTIONS` | 64 |
| `MCP_SUBSCRIPTION_KEEPALIVE` | 15 segundos |
| `MCP_TOOL_SEARCH_MAX_RESULTS`, `MCP_TOOL_SEARCH_MAX_CALLS` | 20, 5 |
| `MCP_TOOL_SEARCH_MAX_OUTPUT_BYTES` | 256 KiB |

Todos los presupuestos numéricos son positivos y página default no puede superar máximo. La admisión del transporte incluye streams hasta cerrarlos. El manager ofrece `getWebServer`, `getLocalServer`, `servers`, `dispatchHttp`, `startLocal` y `shutdown`; normalmente la integración administra dispatch/cierre. Sobrecarga, request inválido y respuesta demasiado grande fallan de forma explícita, sin cola ilimitada.
