---
title: "Prompts MCP"
description: "Genera prompts MCP con argumentos de texto, mensajes con roles, inyección, acceso y completions."
editUrl: true
lastUpdated: false
---

Un prompt MCP construye mensajes reutilizables para una conversación. Expone un nombre, una descripción y argumentos de texto que el cliente puede solicitar con `prompts/get`. Obtener un prompt no llama a un modelo ni ejecuta sus instrucciones: devuelve mensajes que la aplicación cliente decide cómo utilizar.

## Generar un prompt

Desde la raíz del proyecto, ejecuta una alternativa:

```bash
orionis make:mcp-prompt greeting
python -B reactor make:mcp-prompt greeting
```

El argumento obligatorio es `name`; `-h`/`--help` muestra ayuda y no existen flags propios adicionales. Se crea `app/mcp/prompts/greeting_prompt.py` con `GreetingPrompt`. La plantilla real es:

```python
from orionis.mcp import McpResponse, Prompt

class GreetingPrompt(Prompt):
    """Return application-defined messages for an MCP prompt."""

    description = "An application prompt."

    async def handle(self) -> McpResponse:
        """
        Build the messages for this prompt.

        Returns
        -------
        McpResponse
            Messages returned to the MCP client.
        """
        return McpResponse.text("Describe what the user should ask.")
```

El stub no declara argumentos. Su `handle()` asíncrono devuelve un bloque textual, cuyo rol predeterminado es `user`. Puedes empezar con ese comportamiento y añadir argumentos según tu caso de uso. Los nombres anidados, directorios y conflictos de archivos siguen las [reglas de generación](/es/mcp/servers-and-routes#crear-la-declaración-del-servidor). El archivo generado todavía debe añadirse a `Server.prompts`.

## Argumentos obligatorios y opcionales

Reemplaza `app/mcp/prompts/greeting_prompt.py` por:

```python
from orionis.mcp import Completion, McpRequest, McpResponse, Prompt, PromptArgument


class GreetingPrompt(Prompt):
    name = "greeting"
    title = "Prepare a greeting"
    description = "Create a greeting request for the conversation."
    arguments = (
        PromptArgument(name="name", description="Person to greet.", required=True),
        PromptArgument(name="style", description="Greeting style.", required=False),
    )

    async def handle(self, name: str, style: str = "friendly") -> McpResponse:
        return McpResponse.text(f"Greet {name} in a {style} way.").asUser()

    def complete(self, request: McpRequest) -> Completion:
        argument = request.params["argument"]
        values = (
            ("friendly", "formal", "brief")
            if argument["name"] == "style"
            else ("Ada", "Alan", "Grace")
        )
        prefix = argument["value"].casefold()
        matches = tuple(value for value in values if value.casefold().startswith(prefix))
        return Completion(values=matches)
```

Este ejemplo conserva el identificador `greeting` del inicio rápido y añade el argumento opcional `style`. El cliente puede enviar estos parámetros de `prompts/get`:

```json
{
  "name": "greeting",
  "arguments": {
    "name": "Ada",
    "style": "formal"
  }
}
```

El mensaje resultante tiene rol `user` y texto `Greet Ada in a formal way.`. Si omite `style`, se utiliza el valor predeterminado Python `friendly`.

| Parte | Propósito |
| --- | --- |
| `PromptArgument.name` | Nombre de argumento público; debe ser único y no vacío. |
| `title`, `description` | Ayuda de presentación del argumento para el cliente. |
| `required` | Exige presencia cuando es `True`; su valor predeterminado es `False`. |
| Parámetro `name: str` | Recibe el argumento declarado con el mismo nombre. |
| Parámetro `style: str = "friendly"` | Proporciona el valor al omitir un argumento opcional. `required=False` por sí solo no crea ese valor. |

Los valores de argumentos de prompt son **strings**. No son un payload arbitrario ni un schema `Tool[Input]`: para datos complejos de una operación utiliza una herramienta. Un argumento desconocido, no textual o requerido ausente produce parámetros inválidos. Declara todos los argumentos públicos en `arguments`; no basta con añadir un parámetro primitivo al método.

## Construir mensajes y conservar sus roles

`McpResponse.text()` produce texto; `asUser()` y `asAssistant()` seleccionan el rol. Para devolver una conversación de varios mensajes, puedes crear `app/mcp/prompts/review_prompt.py`:

```python
from orionis.mcp import McpResponse, Prompt, PromptArgument


class ReviewPrompt(Prompt):
    name = "review"
    arguments = (PromptArgument(name="code", required=True),)

    async def handle(self, code: str) -> tuple[McpResponse, ...]:
        return (
            McpResponse.text("Help me review this Python code.").asUser(),
            McpResponse.text("I will examine correctness and clarity.").asAssistant(),
            McpResponse.text(code).asUser(),
        )
```

Registra `ReviewPrompt` en el servidor para publicarlo. El normalizador conserva el orden, los roles y los límites de los bloques de contenido. Un `McpResponse` con varios bloques se representa como mensajes separados del mismo rol. Los roles disponibles son `user` y `assistant`; no se declara un rol `system` mediante estos helpers.

El resultado utiliza `messages`, no el campo `content` de una llamada de herramienta ni `contents` de un recurso. El cliente puede mostrar la descripción del prompt y decidir qué mensajes incorporar a la conversación.

## Completar argumentos

El `complete()` del ejemplo de saludo permite sugerir valores mediante `completion/complete`. El cliente referencia `{"type": "ref/prompt", "name": "greeting"}` y envía un `argument` con `name` y el fragmento `value`.

El hook obtiene esos datos de `McpRequest.params` y devuelve `Completion(values=(...))`. También se admite una lista o tupla de strings. Hay un máximo de 100 sugerencias; `total` y `hasMore` son campos opcionales de `Completion`. Si el cliente proporciona otros argumentos ya elegidos, aparecen en `request.params["context"]["arguments"]`.

La autorización de la primitiva se comprueba antes de ejecutar `complete()`. Una referencia o un nombre de argumento desconocido se rechaza. Si el servidor no tiene ningún recurso o prompt con completion, no anuncia la capacidad. Consulta el [ejemplo HTTP de completions](/es/mcp/http-and-clients) para el sobre JSON-RPC completo.

## Registrar y consultar prompts

Con el archivo `greeting_prompt.py` anterior, crea `app/mcp/servers/greeting_server.py`:

```python
from app.mcp.prompts.greeting_prompt import GreetingPrompt
from orionis.mcp import Server


class GreetingServer(Server):
    name = "Greeting"
    prompts = (GreetingPrompt,)
```

En `routes/ai.py`, registra ese servidor:

```python
from app.mcp.servers.greeting_server import GreetingServer
from orionis.support.facades import Mcp

Mcp.web("/mcp/greeting", GreetingServer)
```

También puedes incorporar `GreetingPrompt` a `DemoServer.prompts` para utilizar `/mcp/demo` del inicio rápido.

`prompts/list` devuelve descriptores con sus argumentos, sin ejecutar `handle()`. Los listados están ordenados, filtrados por acceso y paginados: sigue `nextCursor` sin fabricarlo ni reutilizarlo en otro método. `prompts/get` construye los mensajes para un nombre y argumentos concretos. Ambos se consultan mediante POST JSON-RPC en HTTP, como muestra [HTTP y clientes](/es/mcp/http-and-clients).

## Inyección, hooks y errores

Los prompts admiten servicios en el constructor y en `handle()`, y contexto `McpRequest` y servicios en `shouldRegister()`, `authorize()` y `complete()`. El [ejemplo completo de inyección](/es/mcp/tools#servicios-en-el-constructor-y-en-el-método) incluye `GreetingPrompt` con ambos mecanismos. Los argumentos declarados del cliente se mantienen separados de las dependencias; una dependencia no se convierte en argumento del prompt.

`shouldRegister()` controla disponibilidad y `authorize()` acceso, tanto al listar como al obtener mensajes o completar argumentos. La identidad se obtiene del contexto confiable del transporte, no de un argumento `user_id` enviado por el cliente. Si necesitas la petición HTTP nativa, recuerda que `Request` no está disponible en STDIO.

Los argumentos inválidos y los fallos de autorización producen errores de protocolo. Un fallo inesperado se reporta y devuelve un error interno saneado. `McpResponse.error()` expresa un error de herramienta; no reemplaza el contrato de errores de `prompts/get`.

## Metadata y cambios del catálogo

El prompt comparte `name`, `title`, `description`, `icons`, `meta` y `cache` con las demás primitivas. Si omites `name`, se elimina el sufijo `Prompt` y se deriva kebab-case del nombre de clase. Los nombres explícitos admiten `[A-Za-z0-9_.-]{1,128}` y deben ser únicos dentro del catálogo de prompts del servidor.

Para anunciar modificaciones, declara `list_changed = True` en el servidor y publica `await Mcp.promptsChanged(GreetingServer)` después del cambio de aplicación. La notificación no reescribe las tuplas compiladas ni observa archivos automáticamente. El cliente recibe `notifications/prompts/list_changed` si ha solicitado esa escucha; consulta [flujos avanzados](/es/mcp/advanced-workflows).

Trata el contenido externo interpolado en un prompt como datos de su procedencia original. Devolverlo desde un servidor MCP no lo convierte en instrucciones de confianza del sistema consumidor.
