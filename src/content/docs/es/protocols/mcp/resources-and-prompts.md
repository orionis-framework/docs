---
title: "Recursos y plantillas URI"
description: "Crea recursos MCP de URI fija o parametrizada, devuelve texto, JSON o bytes, y controla lectura, completions y suscripciones."
editUrl: true
lastUpdated: false
---

Un recurso MCP permite leer contenido identificado por una URI: documentación, una representación de datos o un archivo proporcionado expresamente por la aplicación. A diferencia de una herramienta, su operación principal es `resources/read`. Declarar una URI no concede acceso automático al disco ni abre una URL externa.

## Generar un recurso

Ejecuta una de las alternativas:

```bash
orionis make:mcp-resource guide
python -B reactor make:mcp-resource guide
```

El argumento `name` es obligatorio y el archivo predeterminado es `app/mcp/resources/guide_resource.py`, con la clase `GuideResource`. `-h`/`--help` muestra la ayuda; no hay flags adicionales de generación. La plantilla real contiene:

```python
from orionis.mcp import McpResponse, Resource

class GuideResource(Resource):
    """Serve a resource chosen explicitly by the application."""

    uri = "docs://example/resource"
    description = "Application documentation."
    mime_type = "text/plain"

    async def handle(self) -> McpResponse:
        """
        Read authorized application data without deriving filesystem paths.

        Returns
        -------
        McpResponse
            Resource content with its URI and MIME type.
        """
        return McpResponse.resource(self.uri, "Resource content.", self.mime_type)
```

La URI inicial es un marcador explícito que debes cambiar. `Resource` no interpreta esa URI como una ruta de filesystem. El generador comparte las [reglas de nombres, subdirectorios y archivos existentes](/es/protocols/mcp/servers-and-tools#crear-la-declaración-del-servidor).

## Recurso de URI fija

Reemplaza `app/mcp/resources/guide_resource.py` por:

```python
from orionis.mcp import McpResponse, Resource


class GuideResource(Resource):
    name = "guide"
    uri = "demo://guide"
    title = "Greeting service guide"
    description = "How to use the greeting components."
    mime_type = "text/plain"

    async def handle(self) -> McpResponse:
        return McpResponse.resource(
            self.uri,
            "Use greet with a name; read demo://greetings/{name} for a greeting.",
            self.mime_type,
        )
```

El cliente descubre `demo://guide` con `resources/list` y solicita esa URI completa con `resources/read`. `name="guide"` es el identificador de catálogo; la lectura utiliza la **URI**, no el nombre. El handler no recibe variables de URI porque no existen en esta declaración.

## Plantillas URI y parámetros

Una plantilla describe una familia de recursos sin enumerar cada elemento. En `app/mcp/resources/greeting_resource.py`:

```python
from orionis.mcp import Completion, McpRequest, McpResponse, Resource


class GreetingResource(Resource):
    name = "greeting"
    uri_template = "demo://greetings/{name}"
    description = "A greeting for the name contained in the URI."
    mime_type = "text/plain"

    async def handle(self, name: str) -> McpResponse:
        return McpResponse.text(f"Hello, {name}!")

    def complete(self, request: McpRequest) -> Completion:
        argument = request.params["argument"]
        prefix = argument["value"].casefold()
        names = ("Ada", "Alan", "Grace")
        matches = tuple(name for name in names if name.casefold().startswith(prefix))
        return Completion(values=matches)
```

`demo://greetings/Ada` produce `Hello, Ada!`. Las variables simples se decodifican como strings y se entregan por nombre a `handle()`; usa `name: str` para este ejemplo. No son convertidores HTTP como `{id:int}`. Una anotación `int` por sí sola no convierte un segmento string a entero: valida y convierte el dato explícitamente cuando tu dominio lo requiera.

`McpResponse.text()` se normaliza a contenido del recurso con la URI solicitada y el MIME declarado. También puedes inyectar `McpRequest` para consultar `uri`, `uri_variables` y el contexto de identidad. Los servicios se resuelven por constructor o método, como muestra el [ejemplo de inyección de componentes](/es/protocols/mcp/tools#servicios-en-el-constructor-y-en-el-método).

Declara exactamente **uno** de `uri` o `uri_template`. Una URI fija debe ser absoluta, con un esquema válido; el compilador rechaza controles, escapes inválidos y otros caracteres no permitidos. No se puede declarar una URI y una plantilla simultáneamente.

### Completar una variable

El método `complete()` del ejemplo responde a `completion/complete` para la referencia `{"type": "ref/resource", "uri": "demo://greetings/{name}"}`. No recibe automáticamente un parámetro `name` incompleto: accede a `request.params["argument"]`, que contiene el nombre de argumento y el fragmento escrito. El ejemplo filtra nombres por ese fragmento.

Devuelve `Completion(values=(...))` o una lista/tupla de strings, con un máximo de 100 sugerencias. `Completion` también admite `total` y `hasMore`. El contexto opcional de otros argumentos está en `request.params["context"]["arguments"]` cuando el cliente lo envía. La referencia debe usar la plantilla literal y el argumento debe existir; la autorización se comprueba antes de calcular sugerencias. La [guía HTTP](/es/protocols/mcp/http-and-clients) muestra el sobre completo.

### Plantillas con operadores RFC 6570

Orionis admite sintaxis RFC 6570 de nivel 4 para expandir plantillas. Las expresiones simples, como `{name}`, tienen inversa automática cuando son inequívocas. Expresiones con operadores o formas ambiguas requieren un método `match(uri)` explícito que reconstruya las variables:

```python
from urllib.parse import parse_qsl, urlsplit

from orionis.mcp import McpResponse, Resource


class SearchResource(Resource):
    uri_template = "demo://search{?q}"
    mime_type = "text/plain"

    @staticmethod
    def match(uri: str) -> dict[str, object] | None:
        parts = urlsplit(uri)
        if (
            parts.scheme != "demo"
            or parts.netloc != "search"
            or parts.path
            or parts.fragment
        ):
            return None
        try:
            pairs = parse_qsl(parts.query, keep_blank_values=True, strict_parsing=True)
        except ValueError:
            return None
        if len(pairs) != 1 or pairs[0][0] != "q":
            return None
        return {"q": pairs[0][1]}

    async def handle(self, q: str) -> McpResponse:
        return McpResponse.text(f"Search term: {q}")
```

`demo://search?q=routing` se resuelve con `q="routing"`. El matcher debe ser `@staticmethod` o `@classmethod`, síncrono, recibir únicamente la URI y devolver un mapping de variables declaradas o `None`. No utiliza inyección de servicios. Después de ejecutarlo, Orionis vuelve a expandir la plantilla y exige que coincida con la URI recibida; un match parcial no basta. Los modificadores de prefijo solo admiten valores escalares.

## Texto, JSON y contenido binario

Para JSON, declara el MIME y devuelve un recurso serializable explícito. Por ejemplo, en `app/mcp/resources/greeting_json_resource.py`:

```python
from orionis.mcp import McpRequest, McpResponse, Resource


class GreetingJsonResource(Resource):
    name = "greeting-json"
    uri_template = "demo://greetings-json/{name}"
    mime_type = "application/json"

    async def handle(self, name: str, request: McpRequest) -> McpResponse:
        return McpResponse.resource(
            request.uri,
            {"name": name, "greeting": f"Hello, {name}!"},
            self.mime_type,
        )
```

El resultado de `resources/read` utiliza `contents`, con `uri`, `mimeType` y `text` que contiene el JSON serializado. No confundirlo con el `structuredContent` de una herramienta. `application/*+json` también selecciona el codificador JSON nativo.

Los bytes se transportan como contenido `blob` codificado en Base64:

```python
from orionis.mcp import McpResponse, Resource


class BinaryResource(Resource):
    uri = "demo://samples/binary"
    mime_type = "application/octet-stream"

    async def handle(self) -> McpResponse:
        return McpResponse.resource(self.uri, bytes([0, 1, 2]), self.mime_type)
```

`McpResponse.resource()` acepta strings, bytes o datos estructurados según el MIME. JSON produce texto; MessagePack, declarado con su MIME correspondiente, produce contenido binario. Un recurso debe devolver contenido textual o binario; imágenes y audio como bloques de herramienta no se convierten automáticamente en un resultado de lectura. Consulta [respuestas y contenido](/es/protocols/mcp/responses-and-content) para las variantes.

## Registrar y consultar los recursos

Para los archivos `guide_resource.py` y `greeting_resource.py` anteriores, crea `app/mcp/servers/directory_server.py`:

```python
from app.mcp.resources.greeting_resource import GreetingResource
from app.mcp.resources.guide_resource import GuideResource
from orionis.mcp import Server


class DirectoryServer(Server):
    name = "Directory"
    resources = (GuideResource, GreetingResource)
```

En `routes/ai.py`, registra ese servidor:

```python
from app.mcp.servers.directory_server import DirectoryServer
from orionis.support.facades import Mcp

Mcp.web("/mcp/directory", DirectoryServer)
```

También puedes añadir las clases a `DemoServer.resources` para mantener un único endpoint.

| Operación | Qué devuelve |
| --- | --- |
| `resources/list` | Catálogo de recursos con URI fija; no lee su contenido. |
| `resources/templates/list` | Catálogo de plantillas; no enumera cada URI que podría expandirse. |
| `resources/read` | Contenido de la URI fija o expandida solicitada. Se comprueban primero las URIs exactas y después las plantillas. |
| `completion/complete` | Sugerencias de una variable cuando la plantilla implementa `complete()`. |

Los listados están ordenados y paginados con cursores opacos. Utiliza `nextCursor` hasta que no aparezca; el cursor pertenece a su método y no se reutiliza entre catálogos. Los ejemplos JSON-RPC completos están en [HTTP y clientes](/es/protocols/mcp/http-and-clients).

## Acceso, errores y metadata

`shouldRegister()` y `authorize()` siguen las mismas reglas de [acceso de las herramientas](/es/protocols/mcp/tools#visibilidad-y-autorización), y aceptan contexto y servicios inyectados. Por ejemplo:

```python
from orionis.mcp import McpRequest, McpResponse, Resource


class PrivateGuideResource(Resource):
    uri = "demo://private-guide"
    mime_type = "text/plain"

    def authorize(self, request: McpRequest) -> bool:
        return request.identity is not None

    async def handle(self) -> McpResponse:
        return McpResponse.text("Authenticated application guidance.")
```

Leer una URI requiere autorización sobre el contenido concreto; conocer su identificador no otorga acceso. Durante un listado no hay una URI concreta expandida, de modo que no asumas que `request.uri_variables` ya contiene parámetros de una lectura.

Una URI desconocida o mal formada produce un error del protocolo. Un fallo inesperado del handler se reporta y responde como error interno saneado. Los errores de herramienta `isError` no son el contrato de una lectura de recurso.

Además de `uri` o `uri_template`, puedes declarar `name`, `title`, `description`, `icons`, `meta`, `cache`, `mime_type`, `size` y `annotations`. `size` debe ser un entero no negativo; es metadata, no un límite automático de lectura. `ContentAnnotations` acepta `audience`, `priority` entre 0 y 1, y `last_modified`. Las URIs exactas y las plantillas comparten nombres únicos dentro del servidor; las plantillas con inversas idénticas detectables también se rechazan al compilar.

## Cambios y suscripciones

Para anunciar cambios, configura explícitamente en el servidor:

```python
class DirectoryServer(Server):
    name = "Directory"
    resources = (GuideResource, GreetingResource)
    list_changed = True
    resource_subscriptions = True
```

Este fragmento sustituye la clase anterior conservando sus importaciones. Tras confirmar un cambio en los datos, tu operación de aplicación puede publicar la URI actualizada:

```python
from app.mcp.servers.directory_server import DirectoryServer
from orionis.support.facades import Mcp


async def publishGreetingChange(name: str) -> None:
    from urllib.parse import quote

    uri = f"demo://greetings/{quote(name, safe='')}"
    await Mcp.resourceUpdated(DirectoryServer, uri)
```

`Mcp.resourceUpdated()` notifica; no modifica el recurso ni envía su nuevo contenido. Para cambios del catálogo utiliza `await Mcp.resourcesChanged(DirectoryServer)`. Debes haber registrado ese servidor. No hay observación automática del filesystem o de la base de datos.

El cliente usa `subscriptions/listen` con `notifications.resourceSubscriptions` y las capacidades apropiadas. No utiliza los métodos históricos `resources/subscribe` ni `resources/unsubscribe`. La conexión del listener transporta las notificaciones y su cierre finaliza esa escucha; los eventos en memoria pertenecen al worker actual. Consulta los [flujos avanzados](/es/protocols/mcp/advanced-workflows) para filtros, cancelación y límites.

## Construir un prompt reutilizable

Los prompts tienen su propia [guía de generación, argumentos, mensajes y completions](/es/protocols/mcp/prompts). Se registran en `Server.prompts` y se consultan con `prompts/get`; no son recursos con URI.
