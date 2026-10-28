---
title: "Probar herramientas MCP dentro del proceso"
description: "Guarda el módulo completo siguiente en tests/integration/test_greeting_mcp.py del proyecto generado (crea los directorios si hacen falta). La declaración de servidor es local a…"
editUrl: true
lastUpdated: false
---

Guarda el módulo completo siguiente en `tests/integration/test_greeting_mcp.py` del proyecto generado (crea los directorios si hacen falta). La declaración de servidor es local a la prueba: no requiere añadir una ruta HTTP ni ejecutar otro servidor MCP.

El cliente MCP envía JSON-RPC codificado al dispatcher real y abre un scope nuevo por llamada. Es una prueba de integración del protocolo y del contenedor, sin sockets. No sustituye una prueba de un proxy HTTP, origen autorizado o transporte stdio. La declaración del servidor siguiente pertenece al módulo de prueba y se ejecuta bajo el runner de Orionis.

## Ejemplos

### Ejercitar una herramienta MCP real

```python
from orionis.mcp import McpResponse, Server, Tool
from orionis.schemas import Schema
from orionis.test import TestCase

class GreetingInput(Schema):
    name: str

class HelloTool(Tool[GreetingInput]):
    name = "hello"

    def handle(self, payload: GreetingInput) -> McpResponse:
        return McpResponse.text(f"Hello, {payload.name}")

class GreetingServer(Server):
    name = "greetings"
    tools = (HelloTool,)

class TestGreetingServer(TestCase):
    async def testHello(self) -> None:
        client = await self.mcp(GreetingServer)
        response = await client.tool("hello", {"name": "Ada"})
        response.assertOk()
        response.assertTextContains("Hello, Ada")
```

## Ejecutar e interpretar la prueba

```shell
uv run python -B reactor test --start-dir tests/integration --file-pattern "test_greeting_mcp.py"
```

El resultado esperado es una prueba aprobada y código de salida 0. `assertOk()` rechaza errores JSON-RPC y resultados de herramienta marcados `isError=True`; `assertTextContains()` comprueba el texto devuelto. La herramienta debe devolver `McpResponse`, no un diccionario ni string de Python sin envolver. Para probar una herramienta de tu aplicación, importa su servidor real en vez de declarar el servidor del ejemplo y llámala con entradas representativas.

## Inspeccionar un servidor HTTP desde el navegador

Utiliza [Orionis MCP Inspector](https://inspector.orionis-framework.com/es/) para comprobar un endpoint HTTP publicado junto con tus pruebas dentro del proceso. El inspector se ejecuta íntegramente en tu navegador y envía peticiones directamente al endpoint que elijas, sin un proxy intermediario. Admite MCP `2026-07-28` stateless; no inicia procesos STDIO.

1. Publica tu servidor mediante el [transporte HTTP](/es/mcp/http-and-clients).
2. Configura CORS en ese servidor para permitir `https://inspector.orionis-framework.com`, `POST` y las cabeceras necesarias para tus peticiones, incluidas las cabeceras MCP y de autenticación cuando correspondan. El navegador gestiona el preflight `OPTIONS`; el servidor debe responderlo sin exigir las credenciales del POST.
3. Abre el inspector, introduce tu endpoint, configura la autenticación si corresponde y conecta para descubrir las capacidades del servidor.
4. Ejecuta **Ejecutar pruebas seguras** para obtener diagnósticos de protocolo y schemas, cobertura y latencia observada de las peticiones. Esta acción no invoca herramientas automáticamente. Ejecuta una herramienta manualmente solo después de revisar sus argumentos y posibles efectos.
5. Inspecciona los detalles de peticiones y respuestas y exporta un informe JSON, HTML o PDF generado localmente en el navegador.

Un error de red del navegador puede deberse a CORS, DNS, TLS u otro problema de conectividad; no demuestra que el servidor MCP sea inválido. Una petición cURL correcta tampoco verifica CORS. Revisa la cobertura y el estado de preparación para producción: **Sin verificar** significa que faltan evidencias, aunque algunas comprobaciones se hayan aprobado. La latencia del navegador incluye la red y el cliente, no solo el procesamiento del servidor.

## Referencia y próximos pasos

[mcp.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/test/clients/mcp.py) · [case.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/test/cases/case.py)

[Volver al índice del módulo](/es/testing).
