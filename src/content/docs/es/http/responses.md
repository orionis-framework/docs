---
title: "Respuestas, cookies y descargas"
description: "Construye respuestas HTTP, devuelve schemas, configura JSON, cabeceras y cookies, renderiza vistas y entrega archivos, streams y eventos SSE."
editUrl: true
lastUpdated: false
---

Una respuesta define el estado HTTP, las cabeceras y el cuerpo que recibe el cliente. Orionis ofrece clases específicas y la fábrica `response`, importadas directamente desde `orionis.http`. El controlador prepara el resultado y lo devuelve; el kernel y los adaptadores ASGI/RSGI realizan la entrega.

`response` es una instancia compartida y sin estado de `ResponseFactory`. Cada llamada construye una respuesta independiente. Sus métodos son síncronos, salvo el renderizado pendiente de `view()`, que debes esperar.

## Primera respuesta desde un controlador

Este endpoint demuestra cómo controlar el estado, el cuerpo JSON y una cabecera. Los datos son de ejemplo; no guarda productos.

```python
from orionis.http import JSONResponse, response
from orionis.http.base import BaseController
from orionis.support.facades import Route


class CreateProductController(BaseController):
    async def __call__(self) -> JSONResponse:
        return response.json(
            {"id": 7, "name": "Notebook"},
            status_code=201,
            headers={"Location": "/products/7"},
        )


Route.post("/responses/products", CreateProductController)
```

Guarda el ejemplo en el archivo de rutas API configurado, normalmente `routes/api.py`, o separa el controlador en `app/http/controllers` e impórtalo desde ese archivo. En los siguientes ejemplos, registra cada handler junto a su `Route`.

```bash
curl -i -X POST http://localhost:8000/responses/products
```

La respuesta tiene estado `201`, `Content-Type: application/json; charset=utf-8`, `Location: /products/7` y cuerpo `{"id":7,"name":"Notebook"}`. Usa la dirección que indique tu servidor; en PowerShell puedes utilizar `curl.exe` si `curl` es un alias.

También puedes construir la clase directamente: `JSONResponse(content, status_code=201, headers=...)`. La fábrica permite mantener una única importación al trabajar con diferentes representaciones.

## Qué puede devolver una acción

El kernel de rutas normales examina el valor real devuelto, no su anotación:

| Valor devuelto | Tratamiento |
| --- | --- |
| `Response` o una subclase | Conserva su estado, cabeceras y cuerpo. |
| `dict` | Lo convierte en `JSONResponse` con estado `200`. |
| `msgspec.Struct`, incluido `Schema` | Lo serializa mediante `JSONResponse` con estado `200`. |
| `list`, `str`, `bytes`, `None` u otros objetos | No son retornos directos admitidos: envuélvelos en una respuesta apropiada. |
| `PendingView` | La acción debe esperarlo con `await` y devolver el `HTMLResponse` renderizado. |
| `ResponseTemplate` | Devuelve `template.make()` para obtener un `Response`. |

Por ejemplo, `return {"ready": True}` es válido, pero para una lista utiliza `return response.json([1, 2, 3])`; para texto, `return response.text("Ready")`, y para un cuerpo vacío, `return response.noContent()`.

Anotar `-> JSONResponse` o `-> ProductSchema` no convierte el valor retornado ni valida sus datos. `HttpResponse` es un alias de tipo de `Response` útil para anotar acciones que pueden devolver distintas respuestas; no se utiliza como constructor ni como argumento de `isinstance()`.

Los handlers de [fallback](/es/http/routing) requieren un `Response` explícito: no reciben la conversión automática de diccionarios o schemas de las rutas normales.

## Clases y fábrica de respuestas

| Fábrica | Clase resultante | Uso |
| --- | --- | --- |
| `response.make(...)` | `Response` | Bytes o contenido genérico con representación explícita. |
| `response.json(...)` | `JSONResponse` | Datos serializados a JSON. |
| `response.text(...)` | `PlainTextResponse` | Texto plano o bytes. |
| `response.html(...)` | `HTMLResponse` | HTML ya construido. |
| `response.view(...)` | `PendingView` → `HTMLResponse` | Renderizado asíncrono de una plantilla. |
| `response.redirect(...)` | `RedirectResponse` | Estado 3xx y cabecera Location. |
| `response.noContent(...)` | `Response` | Cuerpo vacío, estado inicial 204. |
| `response.stream(...)` | `StreamingResponse` | Secuencia de bloques de bytes. |
| `response.eventStream(...)` | `EventStreamResponse` | Eventos de servidor con formato SSE. |
| `response.file(...)` | `FileResponse` | Archivo local, con MIME inferido o explícito. |
| `response.download(...)` | `FileResponse` | Archivo con disposición attachment. |

Estas clases, `ResponseFactory`, `ResponseTemplate`, `ServerSentEvent`, `HttpResponse` y `response` se exponen desde `orionis.http`. No necesitas importar sus archivos internos.

### Argumentos comunes y valores predeterminados

| Argumento | Comportamiento |
| --- | --- |
| `content` | Contenido de la respuesta; obligatorio en JSON y streams. `make()` usa `None`; HTML y texto usan `""`. |
| `status_code` | Entero o `HTTPStatus` entre 100 y 599. Predeterminado `200`; redirect usa `302` y noContent, `204`. |
| `headers` | Mapping de nombres a valores de texto; `None` por defecto. Para valores repetidos, utiliza `addHeader()`. |
| `background` | `BackgroundTask` o `BackgroundTasks`; `None` por defecto. Se espera después de una entrega correcta. |
| `media_type` | Disponible en make, stream y file; `None` por defecto. File lo infiere si falta. |

`download()` no expone `status_code` ni `chunk_size`; utiliza `file()` o `FileResponse` si necesitas configurarlos. `view(template, **context)` recibe variables de plantilla, no los argumentos comunes anteriores.

Si prefieres constantes de estado, importa `HTTPStatus` desde `orionis.http.enums`, por ejemplo `status_code=HTTPStatus.CREATED`.

La clase base `Response(content=None, status_code=200, headers=None, media_type=None, background=None)` acepta texto, bytes o una fuente asíncrona. Su renderizado convierte `None` en `b""`, conserva bytes, convierte `bytearray` y `memoryview` a bytes, codifica texto como UTF-8 y convierte los demás valores mediante `str(...)`. Por eso `Response({"ok": True})` no genera JSON.

:::note[Media type y cabecera]
En `Response`, `response.make()` y `ResponseTemplate`, `media_type` es metadato y **no crea una cabecera Content-Type**. Establécela explícitamente. Las respuestas especializadas de JSON, HTML, texto, archivos y streaming sí preparan su cabecera correspondiente.
:::

## JSON y opciones de serialización

`response.json(content, ...)` y `JSONResponse(content, ...)` admiten objetos, listas, valores simples y `None`, que se serializa como `null`. La serialización ocurre al construir la respuesta.

```python
from orionis.http import JSONResponse, response
from orionis.support.facades import Route


async def product_list() -> JSONResponse:
    return response.json([
        {"id": 7, "name": "Notebook"},
        {"id": 8, "name": "Pen"},
    ])


Route.get("/responses/products", product_list)
```

```bash
curl -i http://localhost:8000/responses/products
```

### Opciones específicas de JSON

Todas se pasan por nombre, después de los argumentos comunes:

| Opción | Predeterminado | Propósito |
| --- | --- | --- |
| `indent` | `None` | Sangría para JSON formateado. |
| `ensure_ascii` | `False` | Escapar caracteres no ASCII cuando es `True`. |
| `separators` | `None` | Tupla de separadores de elementos y claves. |
| `default` | `None` | Función para convertir tipos que el serializador no soporte; si falta, utiliza el encoder del framework. |

```python
from orionis.http import JSONResponse, response
from orionis.support.facades import Route


class ProductCode:
    def __init__(self, value: str) -> None:
        self.value = value


def encode_product_code(value: object) -> str:
    if isinstance(value, ProductCode):
        return value.value
    raise TypeError(f"Unsupported JSON value: {type(value).__name__}")


async def formatted_product() -> JSONResponse:
    return response.json(
        {"code": ProductCode("P-007"), "name": "Cuaderno"},
        indent=2,
        ensure_ascii=False,
        separators=(",", ": "),
        default=encode_product_code,
    )


Route.get("/responses/formatted-product", formatted_product)
```

La función `default` convierte los objetos no admitidos que recibe; no transforma todos los valores del documento.

### Tipos compatibles y diferencias de formato

Con `indent=None`, `ensure_ascii=False` y `separators=None`, Orionis utiliza `msgspec.json.encode`. Este camino compacto admite schemas, Struct, dataclasses, fechas/horas, Decimal, UUID, Enum, conjuntos y bytes; los valores binarios se codifican como Base64.

Cambiar cualquiera de esas tres opciones utiliza `json.dumps`. El encoder predeterminado del framework convierte fechas/horas mediante `isoformat()`, Decimal y UUID a texto, Enum a su valor y conjuntos a listas. No añade soporte para Schema/Struct, dataclasses ni bytes en ese camino.

Por tanto, `response.json(schema)` funciona, pero `response.json(schema, indent=2)` requiere convertirlo primero, por ejemplo `response.json(schema.toDict(), indent=2)`. Los campos que sigan conteniendo bytes u otros tipos incompatibles necesitarán una conversión o un encoder propio. Las dos rutas de serialización tampoco garantizan una representación textual idéntica de todos los tipos.

## Schemas como respuesta HTTP

Un schema de salida define los campos de la representación que devuelves. Puedes retornarlo directamente para JSON 200 o envolverlo en `response.json()` para controlar estado y cabeceras.

El siguiente ejemplo muestra ambas alternativas y una tercera que valida expresamente los datos de salida:

```python
from orionis.http import JSONResponse, response
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import MinLength
from orionis.schemas.fields import Field
from orionis.schemas.validator import Schema as Validator
from orionis.support.facades import Route


class ProductOutput(Schema):
    id: int
    name: Field[str, MinLength(2)]


class ProductController(BaseController):
    async def show(self, product_id: int) -> ProductOutput:
        return ProductOutput(id=product_id, name="Notebook")

    async def create(self) -> JSONResponse:
        product = ProductOutput(id=7, name="Notebook")
        return response.json(
            product,
            status_code=201,
            headers={"Location": "/products/7"},
        )

    async def checked(self) -> ProductOutput:
        produced_data = {"id": 7, "name": "Notebook"}
        return await Validator.validate(produced_data, ProductOutput)


Route.get("/responses/products/{product_id:int}", [ProductController, "show"])
Route.post("/responses/schema-product", [ProductController, "create"])
Route.get("/responses/checked-product", [ProductController, "checked"])
```

```bash
curl -i http://localhost:8000/responses/products/7
curl -i -X POST http://localhost:8000/responses/schema-product
curl -i http://localhost:8000/responses/checked-product
```

Los tres devuelven `{"id":7,"name":"Notebook"}`; `create` utiliza estado `201`. Los datos son fijos para mostrar las respuestas, sin persistencia.

Distingue estos mecanismos:

- El constructor `ProductOutput(...)` no ejecuta el pipeline de validación.
- Devolver la instancia permite serializarla; el kernel no comprueba sus reglas de nuevo.
- `-> ProductOutput` describe el retorno, pero no valida ni convierte un diccionario.
- `await Validator.validate(datos, ProductOutput)` sí comprueba tipos, restricciones y reglas de forma asíncrona antes de devolver la instancia.

Los schemas de entrada y de salida pueden ser clases distintas. La [guía de controladores y schemas](/es/validation/controllers-and-http) explica la inyección del cuerpo y la validación explícita; las [otras integraciones](/es/validation/integrations) detallan sus diferencias con MCP y Realtime.

## Texto, HTML y respuestas vacías

`text()` genera `text/plain; charset=utf-8` y `html()` genera `text/html; charset=utf-8`. Ambos aceptan texto o bytes, con estado inicial 200. Si proporcionas una cabecera Content-Type propia, se conserva.

```python
from orionis.http import HTMLResponse, PlainTextResponse, Response, response
from orionis.support.facades import Route


async def ready_text() -> PlainTextResponse:
    return response.text("Ready")


async def ready_html() -> HTMLResponse:
    return response.html("<h1>Ready</h1>")


async def remove_example() -> Response:
    return response.noContent()


Route.get("/responses/text", ready_text)
Route.get("/responses/html", ready_html)
Route.delete("/responses/example", remove_example)
```

```bash
curl -i http://localhost:8000/responses/text
curl -i http://localhost:8000/responses/html
curl -i -X DELETE http://localhost:8000/responses/example
```

La última devuelve estado `204` y cuerpo vacío. `response.json(None)` es diferente: produce JSON `null` y estado 200, salvo que lo configures.

`html()` entrega HTML ya construido y no escapa sus valores. Para componer una página con datos dinámicos, utiliza una plantilla con el renderizado correspondiente.

## Respuestas genéricas: XML, MessagePack y binarios

Para un formato sin clase especializada, serializa primero el contenido y utiliza `response.make()` o `Response` con su Content-Type explícito:

```python
from xml.etree.ElementTree import Element, SubElement, tostring

import msgspec

from orionis.http import Response, response
from orionis.support.facades import Route


async def xml_result() -> Response:
    root = Element("product")
    SubElement(root, "id").text = "7"
    content = tostring(root, encoding="utf-8", xml_declaration=True)
    return response.make(
        content,
        media_type="application/xml",
        headers={"Content-Type": "application/xml; charset=utf-8"},
    )


async def msgpack_result() -> Response:
    content = msgspec.msgpack.encode({"id": 7, "name": "Notebook"})
    return Response(
        content,
        media_type="application/msgpack",
        headers={"Content-Type": "application/msgpack"},
    )


async def binary_result() -> Response:
    return response.make(
        b"\x00\x01\x02",
        media_type="application/octet-stream",
        headers={"Content-Type": "application/octet-stream"},
    )


Route.get("/responses/xml", xml_result)
Route.get("/responses/msgpack", msgpack_result)
Route.get("/responses/binary", binary_result)
```

```bash
curl -i http://localhost:8000/responses/xml
curl http://localhost:8000/responses/msgpack --output result.msgpack
curl http://localhost:8000/responses/binary --output result.bin
```

El cuerpo se entrega en el formato elegido; no hay una selección automática de representación según `Accept`. Si un endpoint ofrece varias, consulta la petición y construye explícitamente la respuesta correspondiente.

## Renderizar una vista HTML

Crea `resources/views/responses/preview.html`, dentro del directorio de vistas configurado:

```html
<!doctype html>
<h1>{{ product.name }}</h1>
<p>Product #{{ product.id }}</p>
```

En el archivo de rutas WEB configurado, normalmente `routes/web.py`:

```python
from orionis.http import HTMLResponse, response
from orionis.support.facades import Route


async def product_page() -> HTMLResponse:
    return await (
        response.view("responses.preview", product={"id": 7, "name": "Notebook"})
        .setHeader("Cache-Control", "no-store")
    )


Route.get("/responses/product-page", product_page)
```

`view(template, **context)` devuelve un `PendingView`, no un Response terminado. Esperarlo renderiza la plantilla y produce `HTMLResponse` con `X-Orionis-Render: SSR`. Las mutaciones, como `setHeader()` o `withCookie()`, se encolan y se aplican al resultado renderizado.

Los argumentos con nombre son contexto: `response.view("page", status_code=201)` pasa una variable a la plantilla; no configura el estado HTTP. Para cambiarlo, espera la respuesta y asigna `result.status_code = 201` antes de devolverla. Esperar dos veces el mismo pendiente vuelve a renderizarlo.

Consulta [vistas y renderizado](/es/views/rendering-templates) para nombres de plantilla, configuración y helpers de formularios.

## Redirecciones y datos flash

`response.redirect(url, status_code=302, headers=None, background=None)` crea un `RedirectResponse`, escribe `Location` y un cuerpo de texto `Redirecting to ...`. El estado debe estar entre 300 y 399.

```python
from orionis.http import RedirectResponse, response
from orionis.support.facades import Route


async def go_to_product() -> RedirectResponse:
    return response.redirect("/responses/products/7", status_code=303)


Route.get("/responses/go-to-product", go_to_product)
```

```bash
curl -i http://localhost:8000/responses/go-to-product
```

El cliente decide seguir la redirección; `curl -L` permite hacerlo. Prepara un destino de la aplicación o uno previamente validado.

### Conservar input y errores en WEB

Los métodos flash se heredan de `Response` y se pueden encadenar. En una ruta WEB con sesión, este handler prepara los datos que se mostrarán al volver a un formulario:

```python
from orionis.http import RedirectResponse, response
from orionis.support.facades import Route


async def review_profile() -> RedirectResponse:
    return (
        response.redirect("/profile", status_code=303)
        .withFlash("notice", "Review the submitted fields.")
        .withInput({"name": "Ada", "email": "invalid"})
        .withErrors({"email": ["Use a valid email address."]})
    )


Route.post("/responses/review-profile", review_profile)
```

Regístralo en `routes/web.py` y utiliza tu ruta GET `/profile` para presentar el formulario. El POST necesita el token CSRF del flujo WEB.

| Método | Propósito |
| --- | --- |
| `withFlash(key, value=None)` | Guarda un dato flash para la siguiente petición. |
| `withInput(values)` | Conserva un mapping de valores para el helper `old()`. |
| `withErrors(errors)` | Normaliza errores de un mapping o de una excepción de validación. |
| `getFlashData()` | Consulta el diccionario encolado, o `None` si no hay datos. |

El middleware de sesión aplica el estado antes de entregar la respuesta; sin ese ciclo de sesión no hay persistencia flash. `withInput()` excluye nombres sensibles conocidos de primer nivel, como `password`; no filtra recursivamente todos los secretos posibles. Consulta [sesión y datos flash](/es/sessions/state-and-flash).

## Cabeceras y estado de la respuesta

Puedes pasar `headers` al constructor o modificar la instancia antes de devolverla:

```python
from orionis.http import JSONResponse, response
from orionis.support.facades import Route


async def response_metadata() -> JSONResponse:
    result = response.json({"ready": True})
    result.status_code = 202
    result.setHeader("X-Service", "catalog")
    result.addHeader("Vary", "Accept")
    result.addHeader("Vary", "Origin")
    result.removeHeader("X-Unused")
    return result


Route.get("/responses/metadata", response_metadata)
```

| Método o atributo | Comportamiento |
| --- | --- |
| `status_code` / `getStatusCode()` | Estado de la instancia. La validación de rango se realiza al construirla. |
| `media_type` / `getMediaType()` | Metadato del tipo de contenido. Cambiarlo no reescribe Content-Type. |
| `setHeader(key, value)` | Reemplaza todos los valores de esa cabecera; devuelve `None`. |
| `addHeader(key, value)` | Añade un valor sin eliminar los anteriores; devuelve `None`. |
| `getHeader(key)` | Lista de valores o `None`; nunca un único texto por contrato. |
| `hasHeader(key)` | Comprueba presencia. |
| `removeHeader(key)` | Elimina la cabecera; si falta, no falla. |
| `getStringHeaders()` | Lista de pares de texto, incluidos los valores repetidos. |
| `getRawHeaders()` | Lista de pares `bytes` codificados en Latin-1 para el transporte. |

Las búsquedas de cabeceras no distinguen mayúsculas. Utiliza nombres y valores de texto compatibles con su codificación, sin CR/LF. `setHeader()` y `addHeader()` no son métodos fluidos del Response: modifica la variable y después devuélvela, como en el ejemplo.

Las clases especializadas conservan el Content-Type suministrado. `RedirectResponse` establece su propio Location. Los adaptadores también establecen `Server: Orionis ASGI` o `Orionis RSGI` durante la entrega.

## Cookies

`setCookie()` agrega un `Set-Cookie` y devuelve `None`. `withCookie()` recibe los mismos argumentos y devuelve la propia respuesta para encadenar.

| Argumento | Predeterminado | Uso |
| --- | --- | --- |
| `key` | Obligatorio | Nombre de la cookie. |
| `value` | `""` | Valor de texto, codificado mediante percent-encoding. |
| `max_age` | `None` | Duración en segundos. |
| `expires` | `None` | `datetime`, texto o entero; un datetime se convierte a fecha GMT. Los demás se convierten literalmente a texto. |
| `path` | `"/"` | Ruta; `None` omite el atributo. |
| `domain` | `None` | Dominio; se omite si no se proporciona. |
| `secure` | `False` | Emite el atributo Secure. |
| `http_only` | `False` | Emite HttpOnly. |
| `same_site` | `"lax"` | `"lax"`, `"strict"`, `"none"` o `None` para omitirlo. |
| `partitioned` | `False` | Emite el atributo Partitioned. |

Después de `key` y `value`, todos los argumentos se pasan por nombre. Para expiración relativa usa `max_age`; un `expires` entero no se interpreta como ese intervalo. Un datetime sin zona se considera UTC. `same_site="none"` requiere `secure=True` o la construcción lanza `ValueError`.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def set_preferences(request: Request) -> JSONResponse:
    return (
        response.json({"saved": True})
        .withCookie(
            "theme",
            "dark",
            max_age=3600,
            http_only=True,
            secure=request.scheme == "https",
            same_site="lax",
        )
        .withCookies({
            "language": "es",
            "layout": {"value": "compact", "path": "/", "max_age": 3600},
        })
        .withoutCookie("obsolete", path="/")
    )


Route.post("/responses/preferences", set_preferences)
```

```bash
curl -i -X POST http://localhost:8000/responses/preferences
```

`withCookies(mapping)` acepta un valor de texto por nombre o un mapping con las opciones de `setCookie`. Cada cookie produce una cabecera independiente.

`deleteCookie(key, *, path="/", domain=None)` y su variante fluida `withoutCookie(...)` emiten expiración pasada y `Max-Age=0`. Usa el path y domain con los que se creó la cookie. La respuesta emite los atributos solicitados; el almacenamiento y las reglas de aceptación corresponden al cliente. Para estado de aplicación gestionado en el servidor, consulta [sesiones](/es/sessions).

## Archivos y descargas

Utiliza la fachada `Storage` para obtener los archivos desde los discos configurados y entregar su contenido mediante `response.stream()`. La ruta `reports/users.csv` es relativa al disco `local`, definido en `config/filesystems.py`; consulta [Storage](/es/storage).

El helper `prepare_report()` crea el archivo de demostración. Ejecútalo con `await prepare_report()` desde un comando o método asíncrono de la aplicación iniciada antes de probar las rutas:

```python
from orionis.http import StreamingResponse, response
from orionis.support.facades import Route
from orionis.support.facades import Storage

REPORT_PATH = "reports/users.csv"


async def prepare_report() -> None:
    await Storage.disk("local").put(REPORT_PATH, b"id,name\n1,Ada\n")


async def report_file() -> StreamingResponse:
    report = Storage.disk("local").file(REPORT_PATH)
    await report.size()
    return response.stream(report.readStream(), media_type="text/csv")


async def report_download() -> StreamingResponse:
    report = Storage.disk("local").file(REPORT_PATH)
    await report.size()
    return response.stream(
        report.readStream(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="users.csv"'},
    )


Route.get("/responses/report", report_file)
Route.get("/responses/report/download", report_download)
```

```bash
curl -i http://localhost:8000/responses/report
curl http://localhost:8000/responses/report/download --output users.csv
```

Los handlers consultan los metadatos antes de comenzar la respuesta y transmiten los bloques con `readStream()`, sin leer todo el archivo en memoria. La segunda ruta añade la disposición attachment para descargarlo.

Este ejemplo utiliza `StreamingResponse`; el procesamiento automático de rangos descrito a continuación corresponde a `FileResponse`. Las rutas de Storage son lógicas y no deben pasarse como rutas físicas a `response.file()`.

### API de FileResponse para rutas físicas

`FileResponse` comprueba que la ruta exista y sea un archivo regular, registra su tamaño y establece Content-Length. Si no proporcionas `media_type`, infiere el MIME por la ruta y utiliza `application/octet-stream` cuando no puede inferirlo.

| Opción o método | Comportamiento |
| --- | --- |
| `path` | `str` o `Path` obligatorio. |
| `media_type=None` | MIME explícito o inferido; text/* incorpora charset UTF-8. |
| `filename=None` | Si se proporciona en `file()`, establece disposición `attachment` con ese nombre. |
| `chunk_size=65536` | Tamaño de bloque de `file()`; entero positivo. |
| `getPath()` | Devuelve el `Path` del archivo. |
| `getFileSize()` | Devuelve el tamaño registrado en bytes. |

`file()` sin filename no añade Content-Disposition. `download()` siempre utiliza attachment y, si omites filename, toma el nombre de la ruta. Para controlar estado o tamaño de bloque de una descarga, utiliza `file(path, filename=..., status_code=..., chunk_size=...)`.

Resuelve la ruta desde datos controlados de la aplicación o un identificador autorizado. El archivo se abre durante la entrega y puede dejar de estar disponible después de construir la respuesta.

### Rangos y entrega ASGI/RSGI

Los adaptadores atienden un único rango válido, como `bytes=0-1`, `bytes=4-` o `bytes=-3`. Devuelven estado `206` y ajustan Content-Length, Content-Range y Accept-Ranges. Un rango inválido, no satisfacible o múltiple se ignora y se entrega el archivo completo con su estado original; no genera automáticamente `416`.

Este flujo no genera ETag ni Last-Modified y no evalúa automáticamente If-None-Match, If-Modified-Since o If-Range para producir `304`. Si tu aplicación necesita esa política de caché, debe implementarla explícitamente.

ASGI lee archivos mediante un executor. Para la entrega completa utiliza el chunk_size de FileResponse; los rangos usan bloques de 64 KiB. RSGI delega al servidor mediante `response_file` o `response_file_range`.

## Streaming de bytes

`StreamingResponse` y `response.stream(content, ...)` reciben un iterable síncrono o asíncrono de bloques. La entrega solicita y envía cada bloque sin construir un cuerpo completo.

```python
from orionis.http import StreamingResponse, response
from orionis.support.facades import Route


async def csv_rows():
    yield b"id,name\n"
    yield b"7,Notebook\n"


async def export_products() -> StreamingResponse:
    return response.stream(
        csv_rows(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="products.csv"'},
    )


Route.get("/responses/export", export_products)
```

```bash
curl -N http://localhost:8000/responses/export
```

Una fuente síncrona también puede producir bloques, por ejemplo `response.stream([b"one\n", b"two\n"], media_type="text/plain")`. Su iteración ocurre en el event loop: no traslada automáticamente I/O bloqueante a un hilo.

Produce `bytes`; el wrapper de fuentes síncronas admite también `bytearray` y `memoryview`. Para enviar texto desde un generador, codifica cada fragmento. Mantén el Content-Type apropiado y no inventes una longitud para un stream de tamaño desconocido.

Los adaptadores intentan cerrar el iterador al terminar, fallar o cancelarse. Usa `try/finally` si el productor posee recursos. Cuando se empieza a iterar, las cabeceras y el estado ya se enviaron: una excepción posterior no puede reemplazar la respuesta con otro JSON HTTP.

## Eventos del servidor: SSE

`EventStreamResponse` y `response.eventStream(...)` reciben cadenas o `ServerSentEvent`. Una cadena representa contenido `data`, no un frame SSE ya construido.

```python
import json

from orionis.http import EventStreamResponse, ServerSentEvent, response
from orionis.support.facades import Route


async def progress_events():
    yield ServerSentEvent(comment="Starting")
    for step in range(3):
        yield ServerSentEvent(
            event="progress",
            id=str(step),
            retry=1500,
            data=json.dumps({"step": step}),
        )


async def progress_response() -> EventStreamResponse:
    return response.eventStream(progress_events())


Route.get("/responses/progress", progress_response)
```

```bash
curl -N http://localhost:8000/responses/progress
```

`ServerSentEvent` admite `data=None`, `event=None`, `id=None`, `retry=None` y `comment=None`, todos por nombre. Los campos de texto requieren cadenas; serializa los objetos JSON antes de pasarlos como data. `retry` es un entero no negativo en milisegundos, sin booleanos. Event e id son de una sola línea; id tampoco admite NUL. `encode()` devuelve el frame UTF-8 terminado por una línea vacía.

Data y comment admiten varias líneas: el encoder normaliza sus saltos y genera una línea de campo por cada una.

La respuesta configura `text/event-stream; charset=utf-8` y, si no existen, `Cache-Control: no-cache` y `X-Accel-Buffering: no`. Excluye Content-Length, incluso si se añade después. Los eventos se codifican según los pide el transporte.

SSE observa la desconexión del cliente, cancela la entrega y espera la limpieza del productor. En ASGI toma control del canal receive durante el envío: lee en el handler los datos de petición que necesites antes de devolver el stream.

El ejemplo es finito. Los campos id y retry no implementan por sí mismos almacenamiento, replay ni un productor de heartbeat; los comentarios pueden utilizarse para emitir esos mensajes explícitamente. Consulta [streaming y SSE](/es/realtime/streaming-and-sse) para clientes y cancelación.

## Trabajo después de enviar la respuesta

El argumento `background` permite asociar trabajo breve a una respuesta. Una función asíncrona se espera directamente; una síncrona se ejecuta mediante executor.

```python
from orionis.background import BackgroundTask, BackgroundTasks
from orionis.http import JSONResponse, response
from orionis.support.facades import Route


def record_delivery(label: str) -> None:
    print(f"Response delivered: {label}")


async def single_background() -> JSONResponse:
    task = BackgroundTask(record_delivery, "single")
    return response.json({"ready": True}, background=task)


async def multiple_background() -> JSONResponse:
    tasks = BackgroundTasks()
    tasks.addTask(record_delivery, "first")
    tasks.addTask(record_delivery, "second")
    return response.json({"ready": True}, background=tasks)


Route.get("/responses/background", single_background)
Route.get("/responses/background/multiple", multiple_background)
```

El adaptador espera el trabajo después de una entrega correcta y del cierre del stream. `BackgroundTasks` ejecuta sus tareas en orden y se detiene si una falla. Los errores ocurridos después del envío no cambian el estado que ya recibió el cliente.

El trabajo sigue dentro del ciclo de la petición y retrasa su finalización. No es una cola persistente ni una tarea desvinculada: una desconexión SSE, un envío fallido o la caída del proceso pueden impedirlo. Para ejecución persistente, consulta [colas y jobs](/es/queues).

El adaptador llama a `await result.runBackground()`; no lo invoques de nuevo dentro del controlador si quieres conservar ese momento de ejecución.

## Reutilizar contenido con ResponseTemplate

`ResponseTemplate` conserva texto o bytes codificados una sola vez y una instantánea de cabeceras. No renderiza HTML de plantillas ni valida schemas.

Su constructor recibe `content=b""`, `status_code=200`, `headers=None` y `media_type=None`. Crea una respuesta por petición con `make()`:

```python
from orionis.http import Response, ResponseTemplate
from orionis.support.facades import Route

READY_TEMPLATE = ResponseTemplate(
    "Ready",
    headers={"Content-Type": "text/plain; charset=utf-8", "X-Service": "catalog"},
    media_type="text/plain",
)


async def cached_ready() -> Response:
    result = READY_TEMPLATE.make()
    result.setHeader("X-Example", "independent-response")
    return result


Route.get("/responses/template", cached_ready)
```

La plantilla es inmutable y expone `body`, `status_code` y `media_type`. Cada `make()` crea cabeceras independientes, sin flash, stream ni background, compartiendo el cuerpo inmutable. No reutilices una instancia mutable de Response entre peticiones.

## Inspeccionar una respuesta

Los métodos de lectura permiten comprobar el resultado antes de entregarlo, por ejemplo desde middleware o pruebas:

| Método | Resultado |
| --- | --- |
| `getBody()` | `bytes` para un cuerpo materializado; `None` para un stream. |
| `getStream()` | Fuente asíncrona de bloques o `None`. |
| `hasStream()` | Indica si existe una fuente de streaming. |
| `getStatusCode()`, `getMediaType()` | Estado y metadato de tipo de contenido. |
| `getFlashData()` | Datos flash pendientes o `None`. |
| `render(content)` | Codifica contenido y devuelve bytes; llamarlo no reemplaza el cuerpo almacenado. |
| `runBackground()` | Método asíncrono que ejecuta la tarea asociada cuando el adaptador lo espera. |

Las operaciones de cabeceras y cookies se heredan en las clases concretas. En FileResponse, `getBody()` no lee el archivo; utiliza sus metadatos o el mecanismo de streaming. Evita consumir el stream para inspeccionarlo y después intentar entregarlo otra vez.

## Del controlador a la entrega HTTP

El flujo es el mismo para funciones y controladores:

1. La ruta ejecuta la acción y el kernel normaliza el retorno.
2. La respuesta vuelve por la lógica posterior de los middleware, en orden inverso.
3. En WEB, la sesión aplica flash, persiste sus datos y prepara su cookie. Las políticas del endpoint y CORS también preparan la respuesta antes del envío.
4. El adaptador ASGI o RSGI codifica las cabeceras y entrega el cuerpo, el archivo o el stream.
5. Tras una entrega correcta y su limpieza, espera el background.
6. Finalmente, el kernel cierra Request, sale del scope del contenedor y libera la capacidad de esa petición.

Las [opciones de middleware](/es/http/middleware) permiten modificar la respuesta antes de enviarla. Después de iniciar el envío, no se pueden sustituir sus cabeceras o estado desde el productor.

### HEAD y metadatos de transporte

HEAD utiliza la ruta GET y ejecuta su handler, pero los adaptadores envían un cuerpo vacío. Si falta Content-Length, lo calculan para cuerpos materializados o archivos; no inventan una longitud para un stream.

HEAD se resuelve antes de aplicar Range: conserva los metadatos del archivo completo. En SSE no inicia el productor y cierra su fuente; el trabajo background puede ejecutarse después de enviar correctamente esa respuesta HEAD.

La clase base no añade por sí sola Content-Length para todas las respuestas. El servidor de transporte también interviene en su framing. Construye la representación y sus cabeceras en el handler y deja la entrega a los adaptadores.
