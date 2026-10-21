---
title: "Request y payloads HTTP"
description: "Consulta toda la API de Request y recibe JSON, formularios, archivos, MessagePack, XML, texto, binarios y cuerpos en streaming con ejemplos prácticos."
editUrl: true
lastUpdated: false
---

`Request` representa la petición HTTP actual. Permite consultar su URL, parámetros, cabeceras y cookies, además de leer el cuerpo como bytes o mediante un parser. Importa la clase desde `orionis.http` y recíbela como parámetro de una función de ruta o de un método de controlador; el contenedor entrega la petición activa.

Leer o decodificar el cuerpo no valida sus reglas de negocio. Para recibir un schema validado directamente, consulta [Validación HTTP](/es/http/requests-and-validation) y la [guía de schemas](/es/validation).

Los lectores no dependen del verbo: se pueden usar en rutas `POST`, `PUT`, `PATCH` o `QUERY`, según el endpoint. Los ejemplos utilizan rutas API; una ruta WEB también aplica sus controles de sesión y CSRF.

## Preparar los ejemplos

Los siguientes handlers son independientes. Coloca el que quieras probar en el archivo de rutas API configurado, normalmente `routes/api.py`, junto a su registro `Route.post(...)`. Se usa `http://localhost:8000`; sustituye la dirección por la indicada por tu servidor.

Este ejemplo muestra la misma lectura desde un controlador:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.base import BaseController
from orionis.support.facades import Route


class PreviewPayloadController(BaseController):
    async def __call__(self, request: Request) -> JSONResponse:
        data = await request.data()
        return response.json({"name": data.get("name")})


Route.post("/payloads/preview", PreviewPayloadController)
```

```bash
curl -X POST http://localhost:8000/payloads/preview -H "Content-Type: application/json" --data-raw '{"name":"Ada"}'
```

Responde `{"name":"Ada"}`. En PowerShell, utiliza `curl.exe` si `curl` es un alias de otro comando.

## Elegir cómo leer el cuerpo

`Content-Type` describe el formato del cuerpo recibido; `Accept` indica los formatos de respuesta que anuncia el cliente. No son intercambiables. El parser separa parámetros como `charset` o `boundary` del media type y normaliza este último a minúsculas.

| Lector | Resultado y uso |
| --- | --- |
| `await request.data()` | Diccionario para JSON objeto, URL encoded, multipart o MessagePack mapa. Conserva campos repetidos de formularios como listas. |
| `await request.payload()` | Selecciona un parser por `Content-Type`; si no existe, devuelve bytes. Su resultado depende del formato. |
| `await request.json()` | Cualquier valor JSON: objeto, lista, cadena, número, booleano o `None`. |
| `await request.formUrlEncoded()` | Diccionario de textos URL encoded; conserva el último valor de cada nombre. |
| `await request.form()` | `FormData` multipart, con campos repetidos y archivos. |
| `await request.xml()` | Elemento raíz de un documento XML. |
| `await request.msgpack()` | Valor MessagePack decodificado. |
| `await request.text()` | Texto UTF-8, sin comprobar `Content-Type`. |
| `await request.body()` / `await request.raw()` | Cuerpo completo en `bytes`; ambos usan el mismo buffer. |
| `request.stream()` | Iterador asíncrono de bloques `bytes`, sin reunir el cuerpo completo. |

### Formatos del parser automático

El registro predeterminado de `payload()` contiene todos estos media types. Multipart se procesa por separado mediante el parser de streaming.

| `Content-Type` | Resultado de `payload()` |
| --- | --- |
| `application/json` | Valor JSON Python. |
| `application/x-www-form-urlencoded` | `dict[str, str]`; último valor repetido. |
| `multipart/form-data; boundary=...` | `FormData`. |
| `application/msgpack` | Valor MessagePack Python. |
| `application/xml`, `text/xml` | `xml.etree.ElementTree.Element`. |
| `text/plain`, `text/html` | `str` UTF-8. |
| `application/javascript`, `text/javascript` | `str` UTF-8. |
| `application/octet-stream` | `bytes` sin transformar. |
| Tipo ausente o sin registrar | `bytes` sin transformar. |

No se realiza detección del contenido. Por ejemplo, un cuerpo JSON enviado como `text/plain` se recibe como texto con `payload()`.

:::note[JSON con sufijo]
`json()` admite `application/json` y media types terminados en `+json`. En cambio, `payload()` busca una coincidencia exacta en su registro y `data()` sólo reconoce `application/json`. Un tipo como `application/vnd.example+json` requiere `json()` o un registro explícito para `payload()`; no activa `data()`.
:::

## JSON: objetos, listas y valores simples

Para un objeto JSON de entrada, `data()` resulta útil cuando necesitas acceder a campos por nombre. Mantiene los diccionarios y listas anidados; no aplana la estructura.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_json_object(request: Request) -> JSONResponse:
    data = await request.data()
    return response.json({
        "name": data.get("name"),
        "address": data.get("address"),
        "tags": data.get("tags", []),
    })


Route.post("/payloads/json-object", preview_json_object)
```

```bash
curl -X POST http://localhost:8000/payloads/json-object -H "Content-Type: application/json" --data-raw '{"name":"Ada","address":{"city":"Bogota"},"tags":["python","api"]}'
```

Para aceptar también una lista o un valor simple, utiliza `json()`:

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_json_value(request: Request) -> JSONResponse:
    value = await request.json()
    return response.json({"value": value})


Route.post("/payloads/json-value", preview_json_value)
```

```bash
curl -X POST http://localhost:8000/payloads/json-value -H "Content-Type: application/json" --data-raw '[1,2,3]'
curl -X POST http://localhost:8000/payloads/json-value -H "Content-Type: application/json" --data-raw 'null'
curl -X POST http://localhost:8000/payloads/json-value -H "Content-Type: application/vnd.example+json" --data-raw '{"enabled":true}'
```

Devuelven, respectivamente, `{"value":[1,2,3]}`, `{"value":null}` y `{"value":{"enabled":true}}`. También se admiten cadenas, números y booleanos JSON. Un cuerpo vacío no equivale a `null`.

`json()` comprueba el media type y guarda el valor decodificado en caché, incluido `None`. `data()` exige que el JSON sea un `dict`: una lista, un escalar o `null` producen `TypeError`.

## Formularios URL encoded

Utiliza `application/x-www-form-urlencoded` para enviar campos de texto sin archivos. Los espacios y caracteres escapados se decodifican; los valores vacíos se conservan.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_urlencoded(request: Request) -> JSONResponse:
    data = await request.data()
    last_values = await request.formUrlEncoded()
    return response.json({
        "all_values": data,
        "last_values": last_values,
    })


Route.post("/payloads/urlencoded", preview_urlencoded)
```

```bash
curl -X POST http://localhost:8000/payloads/urlencoded --data-urlencode "name=Ada Lovelace" --data-urlencode "tag=python" --data-urlencode "tag=api" --data-urlencode "empty="
```

La respuesta permite comparar ambos lectores:

```json
{
  "all_values": {"name": "Ada Lovelace", "tag": ["python", "api"], "empty": ""},
  "last_values": {"name": "Ada Lovelace", "tag": "api", "empty": ""}
}
```

`payload()` utiliza el mismo comportamiento de último valor que `formUrlEncoded()`. `form()` es exclusivo de multipart y rechaza URL encoded.

Los valores siguen siendo cadenas: `age=36` se recibe como `"36"`, no como `int`. Nombres como `user[name]` o `tags[]` se conservan literalmente; no construyen objetos anidados automáticamente.

## Multipart: campos repetidos y archivos

Usa `multipart/form-data` cuando necesites archivos, campos repetidos o ambos. El cliente debe incluir el `boundary` que corresponde al cuerpo. Con `curl -F` o `FormData` del navegador, deja que el cliente genere esa cabecera.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def inspect_attachments(request: Request) -> JSONResponse:
    with await request.form() as form:
        uploads = form.files.get("attachment", [])
        return response.json({
            "title": form.get("title"),
            "labels": form.getAll("label"),
            "files": [
                {
                    "filename": upload.filename,
                    "content_type": upload.content_type,
                    "size": upload.size,
                    "extension": upload.extension,
                }
                for upload in uploads
            ],
        })


Route.post("/payloads/attachments", inspect_attachments)
```

Crea dos archivos locales de prueba y sustituye sus rutas en el comando:

```bash
curl -X POST http://localhost:8000/payloads/attachments -F "title=Documents" -F "label=profile" -F "label=archive" -F "attachment=@./avatar.png" -F "attachment=@./notes.txt"
```

La respuesta incluye los dos archivos y `labels: ["profile", "archive"]`. El ejemplo inspecciona los adjuntos y cierra sus temporales; no conserva los archivos.

El parser admite boundary entre comillas, nombres internacionales mediante `filename*` y partes con `Content-Transfer-Encoding: base64` o `quoted-printable`. Los campos de texto usan el `charset` de su parte, o UTF-8 si no se especifica. `form()` procesa el transporte por bloques, pero entrega el `FormData` cuando termina de parsear el formulario.

### API de FormData

| Acceso | Comportamiento |
| --- | --- |
| `form.get(key, default=None)` | Último texto o archivo del nombre; devuelve el valor predeterminado si falta. |
| `form[key]` | Último valor; si falta, devuelve `None`. |
| `form.getAll(key)` | Lista de todos los valores del nombre; `[]` si falta. |
| `form.fields` | `dict[str, list[str]]` con los textos agrupados. |
| `form.files` | `dict[str, list[UploadedFile]]` con los archivos agrupados. |
| `form.multiItems()` | Copia de todos los pares `(nombre, valor)` en orden. |
| `form.allItems` | Lista interna de pares; no la modifiques. |
| `key in form`, `for key in form`, `len(form)` | Presencia, nombres únicos y cantidad de nombres únicos. |
| `form.close()` | Cierra todos los archivos del formulario. |
| `with form:` | Cierra los archivos al salir; es un context manager síncrono. |

`await request.payload()` también devuelve el `FormData` multipart. `await request.data()` ofrece otra vista: un nombre con una aparición contiene su valor; con varias apariciones, una lista. Incluye tanto textos como objetos `UploadedFile`, incluso si comparten nombre. Esa mezcla no es directamente una respuesta JSON serializable: transforma los archivos en metadatos o persístelos primero.

`form()` conserva su resultado en caché; cerrar el formulario no permite volver a parsearlo con nuevos archivos abiertos. El kernel llama a `request.close()` al terminar el ciclo de respuesta, y el parser limpia temporales cuando falla. No utilices un adjunto cerrado para un trabajo posterior: guarda antes lo que necesites conservar.

### API de UploadedFile

Los métodos de archivo son síncronos. `filename` ya está saneado, pero `content_type` procede del cliente; ninguno demuestra que el contenido sea válido.

| Acceso | Uso |
| --- | --- |
| `upload.filename` | Nombre sin separadores, controles ni prefijos de puntos; usa `"upload"` si queda vacío. |
| `upload.content_type` | MIME declarado para la parte, o `None`. |
| `upload.size` | Tamaño acumulado en bytes. |
| `upload.extension` | Extensión en minúsculas, incluido el punto; `""` cuando no hay extensión. |
| `upload.read()` | Lee todo el contenido como `bytes`. |
| `upload.chunks(size=65536)` | Itera bloques desde el inicio; evita reunir una segunda copia completa. |
| `upload.save(path)` | Copia al destino `str` o `Path`. |
| `upload.replace(data)` | Reemplaza el contenido por `bytes` y actualiza el tamaño. |
| `upload.write(chunk)` | Añade `bytes`, `bytearray` o `memoryview` al final. |
| `upload.requiresDiskWrite(size=0)` | Indica si el archivo ya usa disco o si la próxima escritura superaría su umbral. |
| `upload.close()` | Libera su almacenamiento temporal. |

`read()` y `chunks()` vuelven al inicio antes de leer. `save()` copia el archivo abriendo el destino con `wb`: sobrescribe si existe y no crea los directorios padre. No mueve su temporal ni decide un nombre único. `replace()` conserva el nombre y la extensión del adjunto.

Este handler guarda un único archivo mediante la fachada `Storage`, bajo un identificador generado por la aplicación:

```python
from uuid import uuid4

from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route, Storage


async def save_attachment(request: Request) -> JSONResponse:
    with await request.form() as form:
        uploads = form.files.get("attachment", [])
        if len(uploads) != 1:
            return response.json(
                {"message": "Send exactly one attachment."},
                status_code=422,
            )
        upload = uploads[0]
        storage_name = uuid4().hex
        await Storage.uploaded(upload).storeAs(
            "uploads", storage_name, disk="local",
        )
        return response.json({
            "id": storage_name,
            "original_name": upload.filename,
            "size": upload.size,
        }, status_code=201)


Route.post("/payloads/attachments/save", save_attachment)
```

```bash
curl -X POST http://localhost:8000/payloads/attachments/save -F "attachment=@./notes.txt"
```

`Storage.uploaded(upload)` adapta el archivo multipart a la API asíncrona de almacenamiento. `storeAs()` transmite sus bloques al disco `local`; `uploads` es un directorio relativo a la raíz configurada del disco. No necesitas construir rutas físicas ni crear los directorios padre manualmente.

La escritura termina antes de cerrar el formulario. El nombre de almacenamiento no depende del cliente y el archivo no se publica automáticamente. Para la API de almacenamiento y las reglas de archivos, consulta [storage](/es/services/storage) y [validación de archivos](/es/validation/constraints-and-reference#archivos-e-imágenes).

Si necesitas transformar el contenido antes de guardarlo, dentro del mismo `with` puedes leerlo con `await Storage.uploaded(upload).read()`, aplicar la transformación y guardar los bytes resultantes con `await Storage.disk("local").put(f"uploads/{storage_name}", transformed_bytes)` en lugar de `storeAs()`. Esta variante lee el archivo completo en memoria. El streaming del parser usa el umbral configurado; un `UploadedFile(...)` creado manualmente tiene un valor predeterminado distinto, de 1 MiB.

## MessagePack: mapas y otros valores

`await request.msgpack()` decodifica mapas, listas y valores simples MessagePack. También puede producir bytes o valores de extensión: no todos pueden devolverse directamente como JSON sin una transformación de dominio. `data()` exige un mapa Python y el media type exacto `application/msgpack`.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_msgpack(request: Request) -> JSONResponse:
    value = await request.msgpack()
    return response.json({"value": value})


Route.post("/payloads/msgpack", preview_msgpack)
```

Este cliente utiliza `msgspec`, dependencia del framework, y se ejecuta con el entorno del proyecto:

```python
from urllib.request import Request, urlopen

import msgspec

body = msgspec.msgpack.encode({"name": "Ada", "tags": ["python", "api"]})
request = Request(
    "http://localhost:8000/payloads/msgpack",
    data=body,
    headers={"Content-Type": "application/msgpack"},
    method="POST",
)
with urlopen(request) as response:
    print(response.read().decode("utf-8"))
```

Responde `{"value":{"name":"Ada","tags":["python","api"]}}`. Cambia el valor de `encode(...)` por `[1, 2]` para probar un array; si el handler utilizara `data()`, ese array se rechazaría. `msgpack()` no comprueba por sí mismo `Content-Type`; `payload()` sí usa la cabecera para elegir este parser.

## XML: trabajar con el elemento raíz

`xml()` devuelve un `Element`, no un diccionario. Usa sus operaciones XML para extraer el contenido:

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_xml(request: Request) -> JSONResponse:
    root = await request.xml()
    return response.json({
        "root": root.tag,
        "name": root.findtext("name"),
        "items": [item.text for item in root.findall("item")],
    })


Route.post("/payloads/xml", preview_xml)
```

```bash
curl -X POST http://localhost:8000/payloads/xml -H "Content-Type: application/xml" --data-raw '<user><name>Ada</name><item>python</item><item>api</item></user>'
```

Responde `{"root":"user","name":"Ada","items":["python","api"]}`. `payload()` usa el mismo parser para `application/xml` y `text/xml`; `xml()` decodifica sin comprobar la cabecera. `data()` no convierte XML en un diccionario.

El parser utiliza `defusedxml`: rechaza declaraciones de entidades internas o externas y no resuelve recursos externos. Una DTD sin declaraciones de entidades puede aceptarse. XML mal formado produce `ParseError`; una entidad prohibida produce `EntitiesForbidden`, que pertenece a `DefusedXmlException` y no a `ParseError`.

## Texto, HTML y JavaScript

`text()` decodifica bytes como UTF-8. `payload()` aplica esa misma decodificación a `text/plain`, `text/html`, `application/javascript` y `text/javascript`; devuelve una cadena, sin interpretar HTML ni ejecutar JavaScript.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def preview_text(request: Request) -> JSONResponse:
    text = await request.text()
    return response.json({"text": text, "characters": len(text)})


Route.post("/payloads/text", preview_text)
```

```bash
curl -X POST http://localhost:8000/payloads/text -H "Content-Type: text/plain; charset=utf-8" --data-raw 'Hola Orionis'
curl -X POST http://localhost:8000/payloads/text -H "Content-Type: text/html" --data-raw '<p>Hola</p>'
curl -X POST http://localhost:8000/payloads/text -H "Content-Type: application/javascript" --data-raw 'const ready = true;'
```

La decodificación es UTF-8 estricta, aunque la cabecera anuncie otro `charset`. Para otra codificación, utiliza `(await request.body()).decode("latin-1")` explícitamente. El parámetro `charset` no reconfigura automáticamente `text()` ni el parser de texto del registro.

## Binarios y tipos sin parser

Usa `body()` o su equivalente `raw()` para recibir bytes sin decodificar, por ejemplo una firma binaria o un archivo enviado como cuerpo completo en lugar de multipart.

```python
from hashlib import sha256

from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def inspect_binary(request: Request) -> JSONResponse:
    content = await request.body()
    return response.json({
        "size": len(content),
        "sha256": sha256(content).hexdigest(),
    })


Route.post("/payloads/binary", inspect_binary)
```

```bash
curl -X POST http://localhost:8000/payloads/binary -H "Content-Type: application/octet-stream" --data-binary "@./notes.txt"
```

No se crea un `UploadedFile` para este cuerpo. `payload()` también devuelve bytes para `application/octet-stream`, un media type desconocido o una cabecera ausente. En cambio, `data()` rechaza esos tipos.

## Streaming: procesar bloques sin reunir todo el cuerpo

`stream()` permite consumir cargas que superan el presupuesto del buffer completo, respetando el límite total de la petición. Los límites de cada bloque los determina el transporte: no representan líneas, objetos JSON ni partes multipart.

```python
from hashlib import sha256

from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def inspect_stream(request: Request) -> JSONResponse:
    digest = sha256()
    size = 0
    async for chunk in request.stream():
        size += len(chunk)
        digest.update(chunk)
    return response.json({"size": size, "sha256": digest.hexdigest()})


Route.post("/payloads/stream", inspect_stream)
```

```bash
curl -X POST http://localhost:8000/payloads/stream -H "Content-Type: application/octet-stream" --data-binary "@./notes.txt"
```

Este handler produce el mismo tamaño y hash que el ejemplo binario sin conservar una copia completa del contenido. No hay un parser NDJSON nativo: si necesitas mensajes por líneas, el consumidor debe conservar fragmentos entre bloques y separar los registros.

### Lecturas repetidas y orden de consumo

| Primera operación | Qué puedes hacer después |
| --- | --- |
| `body()`, `raw()` o un parser que reúne bytes | Releer el buffer con `body()`, otros lectores o `stream()`, mientras no exceda `max_buffer_size`. |
| `stream()` sobre el transporte sin buffer previo | Consume el cuerpo una vez; un lector posterior no puede recuperarlo. |
| `form()` sobre el transporte sin buffer previo | Multipart consume el stream; puedes reutilizar el `FormData` en caché, pero no releer los bytes. |
| `body()` y luego `form()` | Multipart puede procesar la copia ya almacenada; el cuerpo completo tuvo que caber en el buffer. |

Una lectura después de consumir un stream sin buffer produce `RuntimeError`. Leer todo con `body()` sólo para facilitar una segunda lectura elimina la ventaja de streaming.

`json()`, `formUrlEncoded()`, `form()` y `data()` guardan su resultado parseado. `xml()`, `msgpack()` y `payload()` pueden volver a ejecutar su parser sobre el buffer; `payload()` reutiliza el `FormData` en multipart. El buffer no implica que todos los resultados parseados se compartan. Los diccionarios y formularios devueltos son objetos de la petición: evita modificarlos si otro componente necesita su contenido original.

## URL, parámetros, cabeceras y cookies

Estas fuentes son independientes del cuerpo. `data()` y `payload()` no mezclan query string, parámetros de ruta, cabeceras ni cookies con los campos recibidos.

```python
from orionis.http import JSONResponse, Request, response
from orionis.support.facades import Route


async def inspect_request(item_id: int, request: Request) -> JSONResponse:
    request.state.inspection = "request-info"
    return response.json({
        "method": request.method,
        "scheme": request.scheme,
        "path": request.path,
        "url": request.url,
        "base_url": request.baseUrl,
        "http_version": request.httpVersion,
        "interface": str(request.interface),
        "item_id": request.routeParam("item_id"),
        "tags": request.queryParams.getAll("tag"),
        "page": request.queryParams.get("page", "1"),
        "client_header": request.headers.get("x-client"),
        "language": request.cookies.get("language", "es"),
        "ip": request.ip,
        "port": request.port,
        "bearer_present": request.bearerToken is not None,
        "label": request.state.inspection,
        "wants_json": request.wantsJson(),
        "wants_html": request.wantsHtml(),
        "wants_xml": request.wantsXml(),
        "accepts_xml": request.accepts("application/xml"),
        "ajax": request.isAjax(),
        "csrf_available": request.csrfToken() is not None,
    })


Route.get("/request-info/{item_id:int}", inspect_request)
```

```bash
curl "http://localhost:8000/request-info/42?tag=python&tag=api&page=2" -H "X-Client: documentation" -H "Authorization: Bearer example-token" --cookie "language=en"
```

`item_id` es el entero `42` convertido por el router y también llega como argumento de la acción; por eso se declara en su firma. `routeParam("item_id")` permite consultarlo desde Request. `page` sigue siendo `"2"` y `tags` contiene `["python", "api"]`. Consulta [parámetros de ruta](/es/http/routing) para sus convertidores.

### QueryParams, Headers y Cookies

| Estructura | Operaciones |
| --- | --- |
| `request.queryParams` | `get(key, default=None)` y `[key]` seleccionan el último valor; `getAll(key)` y su alias `getList(key)` conservan todos. `items()` y `multiItems()` copian los pares repetidos. |
| `request.headers` | `get(key, default=None)` y `[key]` buscan sin distinguir mayúsculas; `getAll(key)` devuelve todos los valores de esa cabecera y `getAll()` agrupa todas por nombre en minúsculas. `count(key)` cuenta apariciones. `items()` copia pares, `byteItems()` los codifica en UTF-8 y `hasInvalidFormat()` detecta CR/LF en nombres o valores. |
| `request.cookies` | `get(key, default=None)` y `[key]` consultan cookies; `getAll()` devuelve una copia del diccionario. Si un nombre se repite, conserva el último valor. |

Las tres estructuras ofrecen `keys()`, `values()` e `items()`. En `QueryParams` y `Headers`, `keys()` devuelve un conjunto de nombres, `values()` conserva los valores y `len(...)` cuenta pares, incluidos duplicados. En `Cookies` cuenta nombres. Puedes usar `key in estructura`; la iteración directa produce pares `(nombre, valor)`. En query y cookies la búsqueda distingue mayúsculas. El acceso `[key]` a un nombre ausente en estas tres estructuras produce `KeyError`, a diferencia de `FormData`.

### Propiedades de Request

| Propiedad | Contenido |
| --- | --- |
| `method` | Método HTTP, como `GET`, `POST` o `QUERY`. |
| `scheme` | Esquema del transporte; `"http"` cuando el adaptador no lo proporciona. |
| `path` | Ruta; `"/"` como valor alternativo. |
| `httpVersion` | Versión HTTP; `"1.1"` si no está en el scope. |
| `interface` | Enum `Interface.ASGI` o `Interface.RSGI`. |
| `url` | URL con query string; usa `Host` y, si falta, el servidor del scope. |
| `baseUrl` | Esquema y autoridad; en ASGI incluye `root_path` si existe. No añade una barra final por contrato. |
| `headers` | Estructura `Headers`. |
| `queryParams` | Estructura `QueryParams`, con valores de texto. |
| `cookies` | Estructura `Cookies`. |
| `ip`, `port` | IP y puerto del cliente disponibles en el scope, o `None`. |
| `forwarded` | Información normalizada de forwarding en el scope; `{}` si falta. |
| `userAgent` | Cabecera `User-Agent` o `None`. |
| `authorization` | Cabecera `Authorization` o `None`. |
| `bearerToken` | Credencial tras `Bearer `, sin espacios exteriores; `None` si falta, está vacía o hay varias cabeceras Authorization. |
| `apiKey` | Valor de `X-API-Key` o `None`. |
| `accept` | Cabecera `Accept` original o `None`. |
| `state` | `SimpleNamespace` mutable para compartir datos de esta petición. |
| `scope` | Diccionario del transporte ASGI/RSGI; no es el payload. |
| `csrf_token` | Alias de la propiedad que llama a `csrfToken()`. |

`bearerToken` reconoce el esquema Bearer sin distinguir mayúsculas. Estas propiedades extraen credenciales; no autentican al cliente. Los datos de forwarding dependen del middleware y de los proxies configurados como confiables; no se obtiene una IP confiable leyendo directamente una cabecera del cliente. Consulta [middleware](/es/http/middleware-and-security).

Usa `request.state` para datos temporales añadidos por middleware, por ejemplo `request.state.actor_id`. No es una sesión persistente y sus atributos no existen hasta que alguien los asigna; puedes consultarlos con `getattr(request.state, "actor_id", None)`. `scope` y `routeParams()` exponen diccionarios, pero modificar datos ya almacenados en caché no recalcula automáticamente todas las propiedades de Request.

### Helpers síncronos

| Método | Comportamiento |
| --- | --- |
| `routeParam(key)` | Valor convertido del parámetro de ruta, o `None` si no existe. |
| `routeParams()` | Diccionario de todos los parámetros de ruta. |
| `wantsJson()` | `True` si Accept contiene `application/json` o `+json`. |
| `wantsHtml()` | `True` si contiene `text/html` o `*/*`. |
| `wantsXml()` | `True` si contiene `application/xml` o `text/xml`. |
| `accepts(mime)` | Comprueba si Accept contiene el texto MIME, sin distinguir mayúsculas. |
| `isAjax()` | Comprueba `X-Requested-With: XMLHttpRequest` con ese valor exacto. |
| `csrfToken()` | Token puesto en `state.csrf_token` por el middleware CSRF; `None` si no está disponible. |
| `close()` | Cierra los archivos del multipart parseado; se puede llamar varias veces. |

Los helpers de `Accept` realizan búsquedas de texto, no una negociación de preferencias con prioridades `q`. `Accept: */*` hace verdadero `wantsHtml()`, pero no `wantsJson()` ni `accepts("application/json")`. Ninguno valida el `Content-Type` del cuerpo.

El token CSRF suele estar disponible en el contexto WEB donde se ejecuta su middleware; el helper no crea uno por sí mismo. Consulta las [capas de rutas WEB](/es/http/routing#capas-automáticas-de-web) y los [formularios de vistas](/es/services/views/rendering-templates) para ese contexto.

## Parsers adicionales para payload()

`MediaTypeRegistry` relaciona media types exactos con funciones síncronas `(bytes) -> object`. El kernel usa `DEFAULT_MEDIA_TYPES` para los Request que construye. Registra parsers al arrancar la aplicación, antes de atender peticiones.

Este ejemplo añade un tipo JSON concreto y recibe su contenido mediante `payload()`:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.payload.media_types import DEFAULT_MEDIA_TYPES
from orionis.http.payload.parsers import parse_json
from orionis.support.facades import Route

DEFAULT_MEDIA_TYPES.register("application/vnd.example+json", parse_json)


async def preview_registered_payload(request: Request) -> JSONResponse:
    value = await request.payload()
    return response.json({"value": value})


Route.post("/payloads/registered", preview_registered_payload)
```

```bash
curl -X POST http://localhost:8000/payloads/registered -H "Content-Type: application/vnd.example+json" --data-raw '{"enabled":true}'
```

El registro también admite un parser propio, como una función que decodifique CSV. El parser debe ser síncrono: `payload()` lo llama directamente y no espera una corrutina. No cambia los formatos fijos de `data()`. `register(media_type, parser)` añade o reemplaza; `get(media_type)` devuelve el parser o `None`; ambos normalizan a minúsculas. `extend(parsers)` devuelve otro registro sin modificar el original y sólo se aplica si lo pasas al Request construido manualmente; no reconfigura el kernel automáticamente.

### Construcción de Request en adaptadores

En código de aplicación, recibe Request por inyección. Para integraciones de transporte o pruebas, el constructor admite `Request(interface, adapter, body_stream=None, *, registry=None, receive_or_protocol=None, params=None, body_limits=None)`:

| Argumento | Propósito y valor predeterminado |
| --- | --- |
| `interface`, `adapter` | Obligatorios: `Interface` ASGI/RSGI y adaptador de transporte. |
| `body_stream` | Lector `IBodyStream` ya construido; `None` lo crea al acceder al cuerpo. |
| `registry` | Registro de `payload()`; `None` utiliza `DEFAULT_MEDIA_TYPES`. |
| `receive_or_protocol` | Callable ASGI o protocolo RSGI para el lector diferido; `None` por defecto. |
| `params` | Mapping de parámetros de ruta; `None` equivale a ninguno. |
| `body_limits` | Instancia `HTTPBodyLimits`; `None` utiliza sus valores predeterminados. |

La infraestructura construye estos objetos a partir del transporte; no necesitas fabricar un adaptador para leer el body de un controlador.

## Límites del cuerpo y de multipart

`config/http.py` configura `body_limits` mediante `HTTPBodyLimits`. Los valores son bytes salvo los contadores. El límite total y el límite del buffer son distintos: una carga puede caber en el total y aun así superar lo permitido por `body()` o `json()`.

| Configuración | Variable de entorno | Predeterminado |
| --- | --- | --- |
| `max_body_size` | `HTTP_MAX_BODY_SIZE` | 16 MiB |
| `max_buffer_size` | `HTTP_MAX_BUFFER_SIZE` | 2 MiB |
| `max_files` | `HTTP_MAX_FILES` | 32 |
| `max_fields` | `HTTP_MAX_FIELDS` | 128 |
| `max_part_size` | `HTTP_MAX_PART_SIZE` | 10 MiB |
| `max_field_size` | `HTTP_MAX_FIELD_SIZE` | 1 MiB |
| `max_header_size` | `HTTP_MAX_PART_HEADER_SIZE` | 16 KiB |
| `memory_threshold` | `HTTP_UPLOAD_MEMORY_THRESHOLD` | 256 KiB |
| `max_memory_size` | `HTTP_MAX_MULTIPART_MEMORY_SIZE` | 8 MiB |

`HTTPBodyLimits` también incluye `max_concurrent_requests`, configurado con `HTTP_MAX_CONCURRENT_REQUESTS`, con valor inicial `128` por kernel. Limita peticiones activas, incluida la entrega de respuestas, y no el tamaño de una carga.

Al agotarse esa concurrencia, el kernel rechaza nuevas peticiones con `503` y `Retry-After: 1`. También valida `Content-Length`: valores inválidos, duplicados o combinados con `Transfer-Encoding` producen `400` antes de leer; una longitud declarada que supera el total produce `413`. El lector cuenta además los bytes reales aunque falte esa cabecera.

Todos los presupuestos de bytes deben ser positivos. `max_files=0` y `max_fields=0` rechazan esa clase de parte; no significan ilimitado. Los límites de parte y campo siguen aplicándose aunque aumentes el total.

El umbral de archivo pasa de memoria a disco temporal. El presupuesto multipart total cuenta textos retenidos y archivos que siguen en memoria; no representa toda la memoria del proceso, los buffers del transporte ni las copias de tu código. La forma de lectura elegida determina si interviene también `max_buffer_size`.

## Errores de lectura y validación

| Situación | Resultado del lector |
| --- | --- |
| Cuerpo total, buffer o presupuesto multipart excedido | `PayloadTooLargeException`. El manejo HTTP predeterminado responde `413`. |
| Media type incompatible con `json()`, `formUrlEncoded()`, `form()` o `data()` | `UnsupportedMediaTypeException`; el manejador base HTTP responde `415`. |
| JSON vacío o inválido mediante `json()` o `data()` | `ValueError`. |
| MessagePack inválido mediante `data()` | `ValueError`; el lector directo `msgpack()` puede lanzar `msgspec.DecodeError`. |
| JSON no objeto o MessagePack no mapa mediante `data()` | `TypeError`. |
| Texto que no es UTF-8 | `UnicodeDecodeError`. |
| Multipart sin boundary o mal formado | `ValueError` o excepción de parseo/límite correspondiente. |
| Stream consumido sin buffer | `RuntimeError`. |

El parser automático `payload()` propaga las excepciones de la función registrada: por ejemplo, `msgspec.DecodeError` para JSON inválido. No tiene el mismo envoltorio de errores que `json()` o `data()`. Los fallos de lectura no equivalen a `ValidationException` ni generan por sí solos sus errores por campo.

Si el endpoint debe definir sus propias respuestas para estos casos, captura las excepciones concretas. Por ejemplo:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.request import UnsupportedMediaTypeException
from orionis.support.facades import Route


async def receive_json(request: Request) -> JSONResponse:
    try:
        value = await request.json()
    except UnsupportedMediaTypeException:
        return response.json(
            {"message": "Use application/json or a +json media type."},
            status_code=415,
        )
    except ValueError:
        return response.json({"message": "Send valid JSON."}, status_code=400)
    return response.json({"value": value})


Route.post("/payloads/checked-json", receive_json)
```

El handler define su mensaje `415` para el tipo incompatible y transforma explícitamente el `ValueError` en `400`. Aunque el manejador base ya reconoce `UnsupportedMediaTypeException`, no existe una traducción general a `400` para JSON inválido, errores XML o tipos de cuerpo incorrectos; sin tratamiento específico siguen el manejo general de excepciones. Las políticas de rutas y el manejador de la aplicación pueden modificar estas respuestas.

Para campos obligatorios, tipos y reglas, utiliza [schemas de entrada](/es/validation/controllers-and-http). Para elegir la forma de responder, continúa con [respuestas HTTP](/es/http/responses).
