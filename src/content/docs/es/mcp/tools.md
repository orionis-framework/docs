---
title: "Herramientas MCP"
description: "Genera tools con schemas, salida tipada, inyección, hooks de acceso y respuestas de error comprobadas por el dispatcher."
editUrl: true
lastUpdated: false
---

Una herramienta MCP expone una operación de tu aplicación con argumentos definidos por un contrato. El cliente descubre su nombre, descripción y JSON Schema mediante `tools/list`, y la ejecuta con `tools/call`. Una herramienta puede consultar datos o realizar acciones: el efecto depende de tu implementación y de sus comprobaciones de acceso.

## Generar una herramienta

Ejecuta una de estas alternativas desde la raíz de la aplicación:

```bash
orionis make:mcp-tool echo
python -B reactor make:mcp-tool echo
```

El argumento obligatorio es `name`; `-h`/`--help` muestra la ayuda. Se crea `app/mcp/tools/echo_tool.py`, con `EchoToolInput` y `EchoTool`. No hay opciones adicionales del generador. La plantilla real es:

```python
from orionis.mcp import McpResponse, Tool
from orionis.schemas import Schema

class EchoToolInput(Schema):
    """Arguments controlled by the MCP client."""

    message: str

class EchoTool(Tool[EchoToolInput]):
    """Describe the work performed by this tool."""

    description = "Echo the provided message."
    input = EchoToolInput

    async def handle(self, payload: EchoToolInput) -> McpResponse:
        """
        Process the validated input message.

        Parameters
        ----------
        payload : EchoToolInput
            Validated arguments supplied by the MCP client.

        Returns
        -------
        McpResponse
            Text response containing the input message.
        """
        return McpResponse.text(payload.message)
```

`EchoToolInput` declara los argumentos controlados por el cliente. `input` identifica el contrato, que también aparece en `Tool[EchoToolInput]`. `handle()` recibe el payload ya validado y devuelve un `McpResponse`. La salida del stub es texto, sin contrato de salida tipada.

Se admiten nombres anidados como `support/find_ticket`; consulta las [reglas de generación y sobrescritura](/es/mcp/servers-and-routes#crear-la-declaración-del-servidor). Crear un archivo no publica la herramienta: añade su clase a `Server.tools`.

## Definir un contrato de entrada y salida

En `app/mcp/tools/greet_tool.py`, este ejemplo completo devuelve una salida tipada `str`:

```python
from orionis.mcp import McpResponse, Tool, ToolAnnotations
from orionis.schemas import Schema


class GreetInput(Schema):
    name: str


class GreetTool(Tool[GreetInput, str]):
    name = "greet"
    title = "Greet a user"
    description = "Return a friendly greeting for the supplied name."
    annotations = ToolAnnotations(
        read_only=True,
        destructive=False,
        idempotent=True,
        open_world=False,
    )

    async def handle(self, payload: GreetInput) -> McpResponse:
        if not payload.name.strip():
            return McpResponse.error("Provide a nonempty name.")
        return McpResponse.structured(f"Hello, {payload.name}!")
```

Registra `GreetTool` en la tupla `tools` de tu servidor. El [servidor de ejemplo](/es/mcp/servers-and-routes#primera-aplicación-mcp-completa) incluye ese registro y el endpoint HTTP.

| Declaración | Efecto |
| --- | --- |
| `Tool[Input]` | Declara entrada validada; no exige una salida estructurada tipada. |
| `Tool[Input, Output]` | Declara entrada y salida. Las llamadas exitosas deben aportar `structuredContent` compatible. |
| `input = Input` / `output = Output` | Forma explícita de declarar los contratos. Los atributos no nulos prevalecen sobre los genéricos. |
| `Tool` sin entrada | Solo admite un objeto de argumentos vacío; el handler no recibe payload. |

La entrada se procesa con los schemas nativos y las [reglas de validación](/es/validation). Un handler puede ser síncrono o `async`; utiliza `async` cuando espere servicios asíncronos. `async` por sí solo no evita que una operación bloqueante dentro del método bloquee el event loop.

### Respuestas estructuradas

`McpResponse.structured(value)` incluye el valor JSON en `structuredContent` y su representación JSON como texto en `content`. Puede ser un string, un objeto, una lista u otro valor JSON permitido. Para devolver un objeto con un contrato de salida:

```python
from orionis.mcp import McpResponse, Tool
from orionis.schemas import Schema


class SummaryInput(Schema):
    values: list[float]


class SummaryOutput(Schema):
    count: int
    total: float


class SummaryTool(Tool[SummaryInput, SummaryOutput]):
    name = "summarize"

    async def handle(self, payload: SummaryInput) -> McpResponse:
        return McpResponse.structured({
            "count": len(payload.values),
            "total": sum(payload.values, 0.0),
        })
```

Una llamada con `{"values": [2.5, 3.5]}` devuelve `{"count": 2, "total": 6.0}` como contenido estructurado. El dispatcher valida esa salida antes de serializarla. Anotar el retorno como `McpResponse` no convierte un `dict` devuelto directamente en una respuesta: devuelve el objeto de respuesta explícito. Si declaras salida tipada, una respuesta exitosa de solo texto no cumple ese contrato.

Los handlers ordinarios devuelven `McpResponse` o una lista/tupla de esos objetos; las respuestas completas del protocolo también se admiten cuando cumplen el método y sus validaciones. Solo puede haber un resultado estructurado entre los contenidos. Consulta [respuestas y contenido](/es/mcp/responses-and-content) para imágenes, audio, enlaces, metadata y progreso.

## Servicios en el constructor y en el método

El dispatcher construye una instancia de la herramienta con el contenedor y resuelve por separado las dependencias tipadas de `handle()`. Este módulo completo puede sustituir `app/mcp/servers/demo_server.py` del inicio rápido:

```python
from orionis.mcp import (
    McpResponse, Prompt, PromptArgument, Resource, Server, Tool,
)
from orionis.schemas import Schema


class GreetingService:
    def greet(self, name: str) -> str:
        return f"Hello, {name}!"


class NameFormatter:
    def normalize(self, name: str) -> str:
        return name.strip()


class GreetInput(Schema):
    name: str


class GreetTool(Tool[GreetInput, str]):
    name = "greet"
    description = "Return a greeting."

    def __init__(self, greetings: GreetingService) -> None:
        self.greetings = greetings

    async def handle(
        self,
        payload: GreetInput,
        names: NameFormatter,
    ) -> McpResponse:
        name = names.normalize(payload.name)
        return McpResponse.structured(self.greetings.greet(name))


class GreetingResource(Resource):
    name = "greeting"
    uri_template = "demo://greetings/{name}"
    mime_type = "text/plain"

    def __init__(self, greetings: GreetingService) -> None:
        self.greetings = greetings

    def handle(self, name: str, names: NameFormatter) -> McpResponse:
        return McpResponse.text(self.greetings.greet(names.normalize(name)))


class GreetingPrompt(Prompt):
    name = "greeting"
    arguments = (PromptArgument(name="name", required=True),)

    def __init__(self, greetings: GreetingService) -> None:
        self.greetings = greetings

    async def handle(self, name: str, names: NameFormatter) -> McpResponse:
        greeting = self.greetings.greet(names.normalize(name))
        return McpResponse.text(greeting).asUser()


class DemoServer(Server):
    name = "Demo"
    tools = (GreetTool,)
    resources = (GreetingResource,)
    prompts = (GreetingPrompt,)
```

`greetings` se resuelve al construir el componente; `names`, al invocar el método. Estas clases concretas no necesitan un binding adicional. El cliente solo envía `{"name": "Ada"}`: `names` no pertenece al payload ni al JSON Schema. Una clave del payload no puede reemplazar un servicio inyectado con el mismo nombre.

El recurso y el prompt muestran la misma inyección por constructor y método. Sus variables URI y argumentos se reciben por nombre; no son schemas de entrada de herramienta. También puedes inyectar servicios y `McpRequest` en los hooks tipados. Para contratos abstractos y ciclos de vida compartidos, consulta el [contenedor de servicios](/es/application/container/bindings-and-invocation).

### Contexto de la llamada

`McpRequest` expone `id`, `method`, `server_id`, `transport`, `arguments`, `params`, `meta`, `uri`, `uri_variables`, `input_responses`, `request_state`, `identity`, `authentication` y `client_capabilities`. Los mappings del contexto son snapshots inmutables, incluidos sus valores anidados. Las capacidades pertenecen a la petición actual y no a una sesión recordada.

Un parámetro `Request` HTTP solo puede resolverse en el transporte HTTP; utiliza `McpRequest` para componentes reutilizables en STDIO. Los parámetros sin una fuente válida fallan al compilar. No se admiten `*args` ni `**kwargs` en los handlers. Los valores predeterminados de parámetros ordinarios se usan como tales; no representan argumentos de herramienta adicionales fuera del contrato declarado.

Las instancias se construyen también durante los listados para comprobar visibilidad. Evita efectos de negocio en el constructor y estado de llamadas anteriores en servicios singleton.

## Visibilidad y autorización

Los hooks opcionales se llaman `shouldRegister()` y `authorize()`. El primero decide si el componente está disponible; el segundo si la identidad puede acceder. Ambos se evalúan al listar y al invocar directamente:

```python
from orionis.mcp import McpRequest, McpResponse, Tool
from orionis.schemas import Schema


class PrivateInput(Schema):
    message: str


class PrivateTool(Tool[PrivateInput]):
    name = "private-message"

    def shouldRegister(self, request: McpRequest) -> bool:
        return request.identity is not None

    async def authorize(self, request: McpRequest) -> bool:
        return request.identity is not None

    async def handle(self, payload: PrivateInput) -> McpResponse:
        return McpResponse.text(payload.message)
```

Añade `PrivateTool` al servidor y configura la autenticación real del transporte para obtener una identidad. El ejemplo exige identidad, pero una operación sobre cuentas o documentos debe comprobar también el permiso específico mediante los servicios de la aplicación.

Si `shouldRegister()` devuelve falso, el componente desaparece del listado y la invocación responde como desconocido o no disponible. Si `authorize()` devuelve falso, también se omite del listado, pero una invocación directa se rechaza por autorización. Ocultar una herramienta no deja una vía de acceso directo sin comprobar.

## Metadata y anotaciones

| Campo | Uso |
| --- | --- |
| `name` | Identificador público estable. Si falta, se elimina `Tool` del nombre de clase y se convierte a kebab-case. |
| `title`, `description` | Nombre visible y explicación de la operación para el cliente. |
| `icons`, `meta`, `cache` | Iconos, metadata adicional y frescura declarada; `cache` no memoriza resultados en el servidor. |
| `annotations` | `ToolAnnotations` con `title`, `read_only`, `destructive`, `idempotent` y `open_world`. |

Los nombres explícitos admiten `[A-Za-z0-9_.-]{1,128}`. Los nombres duplicados en el catálogo de herramientas fallan al compilar. Las anotaciones son indicaciones al cliente: `read_only=True` no impide escrituras y `idempotent=True` no implementa deduplicación. Aplica esas garantías en tus servicios.

## Errores y validación

- Argumentos que no cumplen el contrato devuelven un resultado de herramienta con `isError: true` y el mensaje seguro `Invalid tool arguments`; no se ejecuta `handle()`.
- Para un fallo de negocio previsto, devuelve `McpResponse.error("mensaje seguro")`. No se exige el schema de salida de éxito en un resultado de error.
- Un fallo inesperado del handler o de su salida se reporta y produce `isError: true` con `Tool execution failed`, sin exponer el traceback al cliente.
- Un nombre desconocido, un problema de autorización o un sobre JSON-RPC inválido pertenece a la capa del protocolo; no es el mismo caso que un resultado de herramienta con `isError`.

La [guía HTTP](/es/mcp/http-and-clients) muestra cómo distinguir `error` de `result.isError` en el cliente.

## Comprobar el contrato sin red

Guarda este programa en `check_greet.py`, usando el `DemoServer` de cualquiera de los dos ejemplos, y ejecútalo con `python -B check_greet.py` en el entorno del proyecto:

```python
import asyncio

from app.mcp.servers.demo_server import DemoServer
from orionis.container.container import Container
from orionis.test import McpTestClient


async def main() -> None:
    client = McpTestClient(Container(), DemoServer)
    result = await client.tool("greet", {"name": "Ada"})
    result.assertOk()
    assert result.message["result"]["structuredContent"] == "Hello, Ada!"
    result.assertTextContains("Hello, Ada!")


if __name__ == "__main__":
    asyncio.run(main())
```

`asyncio.run()` se usa aquí como punto de entrada de un programa de comprobación; no debe añadirse dentro de un handler asíncrono. `McpTestClient` atraviesa decodificación, scopes, invocación y serialización JSON-RPC. El contenedor aislado es suficiente para estos servicios concretos; para comprobar bindings de tu aplicación, utiliza su contenedor y la [guía de pruebas MCP](/es/mcp/testing). Esta prueba no verifica autenticación HTTP ni compatibilidad de un cliente externo.
