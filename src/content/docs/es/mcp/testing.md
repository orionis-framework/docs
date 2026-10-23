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

## Referencia y próximos pasos

[mcp.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/test/clients/mcp.py) · [case.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/test/cases/case.py)

[Volver al índice del módulo](/es/testing).
