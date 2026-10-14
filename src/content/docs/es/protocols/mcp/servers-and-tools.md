---
title: "Crear un servidor con herramientas tipadas"
description: "Una herramienta recibe datos definidos por un contrato y devuelve contenido o un valor tipado. Usa servicios inyectados para realizar trabajo; las declaraciones Server/Tool…"
editUrl: true
lastUpdated: false
---

Una herramienta recibe datos definidos por un contrato y devuelve contenido o un valor tipado. Usa servicios inyectados para realizar trabajo; las declaraciones `Server`/`Tool` guardan metadata estática, no estado mutable de llamadas anteriores.

## Declarar tu primera herramienta

Guarda este módulo importable en `app/mcp/servers/demo_server.py`. El ejemplo mantiene herramienta y servidor juntos; después puedes separar las herramientas en `app/mcp/tools` sin cambiar sus nombres públicos.

```python
from orionis.mcp import McpResponse, Server, Tool, ToolAnnotations
from orionis.schemas import Schema

class GreetInput(Schema):
    name: str

class GreetTool(Tool[GreetInput, str]):
    name = "greet"
    description = "Return a greeting."
    annotations = ToolAnnotations(read_only=True, destructive=False)

    def handle(self, payload: GreetInput) -> McpResponse:
        return McpResponse.structured(f"Hello, {payload.name}!")

class DemoServer(Server):
    name = "Demo"
    version = "1.0.0"
    tools = (GreetTool,)
```

Los nombres inferidos eliminan el sufijo de primitiva y usan kebab-case. Fija `name` para un contrato estable. Los nombres explícitos admiten `[A-Za-z0-9_.-]{1,128}`; duplicados y metadata inválida fallan al compilar. `Tool` se subclase: no se configura como `Tool(name=..., handler=...)`.

## Comprobar el saludo sin servidor de red

Guarda este programa separado en `check_greet.py` y ejecuta `uv run python check_greet.py` desde la raíz de la aplicación después de instalar sus dependencias:

```python
import asyncio
from app.mcp.servers.demo_server import DemoServer
from orionis.container.container import Container
from orionis.test import McpTestClient

async def main():
    client = McpTestClient(Container(), DemoServer)
    result = await client.tool("greet", {"name": "Ada"})
    result.assertOk()
    result.assertTextContains("Hello, Ada!")
    print("Hello, Ada!")

if __name__ == "__main__":
    asyncio.run(main())
```

El programa imprime `Hello, Ada!`. El dispatcher rechaza entrada inválida antes de ejecutar el handler. Esta comprobación verifica el contrato de la herramienta; no prueba autenticación HTTP ni compatibilidad del cliente.

## Entrada, salida e inyección

`Tool[Input, Output]` declara validación y JSON Schema; también existen atributos `input` y `output`. El handler puede ser síncrono o asíncrono. Orionis convierte payload, valida schemas y resuelve por separado parámetros de servicios y `McpRequest`. El cliente no puede reemplazar un servicio inyectado usando una clave con el mismo nombre.

Una salida declarada se valida antes de serializar. Devuelve `McpResponse.structured(value)` con un valor compatible; los handlers deben devolver `McpResponse` o secuencias de respuestas, no un string/dict crudo. Los errores de contrato se convierten en fallos del protocolo. No prometas una estructura de respuesta incompatible con el tipo genérico. El test client pasa bytes por el dispatcher, de modo que prueba serialización real, no solo llamada directa al método.

## Disponibilidad y autorización

Añade `shouldRegister(self, request: McpRequest) -> bool` para visibilidad por petición y `authorize(...) -> bool` para acceso. El nombre real del hook es **shouldRegister**, no `available`. Ambos se revisan al listar y al invocar directamente; ocultar una herramienta no deja una vía directa sin comprobar.

Por ejemplo, coloca este hook dentro de una herramienta que deba exigir identidad:

```python
from orionis.mcp import McpRequest

def authorize(self, request: McpRequest) -> bool:
    return request.identity is not None
```

Esto solo exige una identidad autenticada. Utiliza además tus servicios de autorización si la herramienta lee una cuenta concreta o modifica datos protegidos.

`request.identity` y `request.authentication` exponen la identidad del contexto; `client_capabilities` contiene únicamente lo declarado por esta llamada. Es un snapshot inmutable: mappings anidados son de solo lectura. Los servicios inyectados conservan sus propias reglas de concurrencia, así que evita guardar una llamada en servicios singleton.

`ToolAnnotations` describe read-only, destructive, idempotent y open-world. Son hints de cliente; no autorizan acciones ni hacen una transacción idempotente. Para errores de negocio previstos devuelve `McpResponse.error(message)`; fallos inesperados se sanea antes de presentarlos al cliente.

## Registro de aplicación

Desde el boot de tu aplicación usa `Mcp.web("/mcp/demo", DemoServer)` o `Mcp.local("demo", DemoServer)`, importando Mcp de `orionis.support.facades`. El manager compila una vez por clase y mantiene definiciones inmutables; construye handlers en scopes de llamada. Consulta [transportes](/es/protocols/mcp/transports-and-configuration) para encabezados y protección del endpoint.
