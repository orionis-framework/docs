---
title: "Transmitir contenido y guardar uploads"
description: "Lee y escribe por bloques, utiliza AsyncStream y persiste archivos multipart desde controladores y servicios."
editUrl: true
lastUpdated: false
---

Storage ofrece dos formas de procesar contenido progresivamente: iteradores de bloques con `readStream()`/`writeStream()` y un handle binario con `open()`. Para archivos recibidos por HTTP, `Storage.uploaded()` adapta el payload multipart y lo guarda mediante la misma API de archivos.

Los ejemplos se ejecutan dentro de una aplicación iniciada, con el disco `local` configurado. Importa la fachada desde `from orionis.support.facades import Storage`. Para configurar otro disco o inyectar el manager, consulta [configuración](/es/storage/configuration) y [manager e inyección](/es/storage/manager-and-injection).

<a id="stream-file-operations"></a>
## Elegir cómo procesar el contenido

| Operación de `IFile` | Resultado y uso |
| --- | --- |
| `async read() -> bytes` | Carga el archivo completo en memoria. |
| `async write(contents: bytes \| str, visibility: str \| None = None) -> IFile` | Reemplaza el contenido; los textos se codifican en UTF-8. Devuelve el mismo archivo. |
| `readStream(chunk_size: int = 65536) -> AsyncIterator[bytes]` | Devuelve un iterador; se consume con `async for`, sin `await` al construirlo. |
| `async writeStream(stream: AsyncIterable[bytes], visibility: str \| None = None) -> IFile` | Consume un productor asíncrono de bloques binarios y devuelve el mismo archivo cuando termina. |
| `open(mode: str = "rb") -> IStorageStream` | Construye un handle lazy; sus operaciones y su contexto son asíncronos. |

`visibility=None` delega en el backend: local conserva el comportamiento del sistema operativo, memory conserva la visibilidad existente o crea con `private`, S3/GCS utilizan su configuración remota y Azure no aplica visibilidad por blob. Los valores explícitos habituales son `"private"` y `"public"`; el soporte depende del [driver](/es/storage/disks-and-drivers).

### Generar un archivo y descargarlo desde un controlador

Guarda este controlador en `app/http/controllers/report_controller.py`. El generador entrega una fila cada vez; `writeStream()` espera cada escritura antes de solicitar la siguiente. La descarga entrega el iterador a `StreamingResponse`, sin reunir todos sus bloques en una lista.

```python
from collections.abc import AsyncIterator
from orionis.http import JSONResponse, Response, StreamingResponse
from orionis.support.facades import Storage


class ReportController:
    async def create(self) -> JSONResponse:
        async def rows() -> AsyncIterator[bytes]:
            yield b"product,quantity\n"
            for product, quantity in (("keyboard", 4), ("monitor", 2)):
                yield f"{product},{quantity}\n".encode("utf-8")

        file = Storage.disk("local").file("reports/stock.csv")
        stored = await file.writeStream(rows(), visibility="private")
        return JSONResponse({"path": stored.path(), "bytes": await stored.size()})

    async def download(self) -> Response:
        file = Storage.disk("local").file("reports/stock.csv")
        if not await file.exists():
            return JSONResponse({"error": "Report not found"}, status_code=404)

        return StreamingResponse(
            file.readStream(chunk_size=65536),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="stock.csv"'},
        )
```

Registra las acciones en un archivo de rutas cargado por la aplicación, por ejemplo `routes/api.py`:

```python
from app.http.controllers.report_controller import ReportController
from orionis.support.facades import Route

Route.post("/reports/stock", [ReportController, "create"])
Route.get("/reports/stock", [ReportController, "download"])
```

Primero ejecuta `POST /reports/stock`; después descarga con `GET /reports/stock`. La comprobación `exists()` permite responder 404 antes de iniciar la transmisión, aunque otro proceso todavía podría eliminar el archivo entre ambas operaciones. Un error después de enviar las cabeceras no puede convertirse en una nueva respuesta JSON.

### Leer solo una parte y liberar el iterador

Usa un `chunk_size` entero positivo. No existe una validación uniforme de tamaños no positivos entre drivers. Si abandonas una lectura antes del final, cierra explícitamente el generador con `aclosing()`; un `break` no sustituye el cierre.

```python
from contextlib import aclosing
from orionis.support.facades import Storage


async def first_report_block() -> bytes:
    file = Storage.disk("local").file("reports/stock.csv")
    async with aclosing(file.readStream(chunk_size=128)) as chunks:
        async for chunk in chunks:
            return chunk
    return b""
```

Los iteradores nativos de local, S3 y GCS liberan su handle en `finally`. Azure utiliza el iterador de bloques del SDK; no añade un handle de Storage ni un cierre explícito del downloader. Memory recorre contenido ya residente en el proceso.

## Referencia de AsyncStream

`open()` devuelve el contrato `IStorageStream`; las implementaciones nativas utilizan `AsyncStream`, exportado por `orionis.storage`. No hay que escribir `await file.open(...)`: entra con `async with file.open(...) as stream`.

<a id="stream-construction"></a>
### Construcción lazy

```text
AsyncStream(
    opener: Callable[[], BinaryIO],
    on_close: Callable[[BinaryIO], None] | None = None,
) -> None
```

Esta es la firma del constructor para adaptadores propios. Los drivers proporcionan ambas funciones; en el uso habitual obtienes el objeto mediante `file.open()`. Construirlo no abre el handle. La primera operación o `__aenter__()` ejecuta `opener` en un hilo y conserva el handle para las operaciones siguientes. `on_close`, si existe, es una función síncrona que también se ejecuta en un hilo.

<a id="stream-read"></a>
### read(size: int = -1) -> bytes

`await stream.read(size)` lee desde la posición actual. `-1` consume hasta EOF; devuelve `b""` cuando no quedan datos. A diferencia de `UploadedFile.read()`, no rebobina automáticamente.

<a id="stream-write"></a>
### write(data: bytes) -> int

`await stream.write(data)` escribe bytes y devuelve el número escrito por el handle subyacente. No codifica textos: usa `text.encode("utf-8")`. No equivale a publicar un objeto remoto; memory y cloud guardan su buffer al cerrar.

<a id="stream-seek"></a>
### seek(offset: int, whence: int = 0) -> int

`await stream.seek(offset, whence)` devuelve la posición absoluta resultante. `whence=0` toma como origen el principio, `1` la posición actual y `2` el final. Los desplazamientos deben ser válidos para el handle binario. No existen métodos públicos `tell()`, `truncate()` ni `flush()` en este contrato.

<a id="stream-close"></a>
### close() -> None

`await stream.close()` separa el handle del objeto, ejecuta `on_close` y después cierra el handle. Cerrar un stream aún no abierto o cerrarlo dos veces seguidas no hace nada. Si vuelves a leer/escribir después, la apertura lazy puede crear otro handle: no reutilices un stream cerrado como si tuviera un estado terminal, especialmente con `wb`, que volvería a truncar el archivo local.

Si el callback falla, la excepción se propaga y la llamada posterior a `handle.close()` no se alcanza. El contrato no ofrece un mecanismo de rollback ni garantiza la liberación inmediata del buffer en ese fallo. Consulta [contextos, errores y cancelación](/es/storage/temporary-files-and-contexts).

<a id="stream-context"></a>
### Contexto asíncrono

Las firmas son `async __aenter__() -> IStorageStream` y `async __aexit__(exc_type: type[BaseException] | None, exc: BaseException | None, traceback: TracebackType | None) -> None`. La entrada abre el handle; la salida llama a `close()` también cuando el bloque lanza una excepción. No suprime la excepción del bloque y no utiliza sus argumentos para descartar las escrituras.

Este servicio utiliza `write`, las tres referencias de `seek`, `read` y cierre automático. Debe invocarse desde una acción o servicio async de la aplicación:

```python
from orionis.support.facades import Storage


async def build_binary_report() -> dict[str, int | str]:
    file = Storage.disk("local").file("reports/sample.bin")
    async with file.open("wb+") as stream:
        written = await stream.write(b"HEADER:data")
        await stream.seek(7)
        prefix = await stream.read(2)
        await stream.seek(-2, 1)
        same_prefix = await stream.read(2)
        end = await stream.seek(0, 2)
        assert prefix == same_prefix == b"da"

    return {"path": file.path(), "written": written, "size": end}
```

### Modos binarios

| Modo | Contenido inicial y posición | Uso |
| --- | --- | --- |
| `rb` | Archivo existente; posición inicial 0. | Lectura. |
| `wb` | Contenido vacío; posición inicial 0. | Reemplazar o crear. |
| `ab` | Contenido existente si lo hay; posición inicial al final. | Añadir o crear. |
| `rb+` | Archivo existente; posición inicial 0. | Leer y modificar. |
| `wb+` | Contenido vacío; posición inicial 0. | Crear/reemplazar y leer el resultado. |
| `ab+` | Contenido existente si lo hay; posición inicial al final. | Añadir y leer tras un `seek`. |

Los modos de texto, `r+b`, `w+b`, `a+b`, `x` y otros valores no incluidos en la tabla generan `UnsupportedStorageOperationException`. Usa `rb+`, `wb+` y `ab+` con ese orden exacto.

Local abre directamente el archivo y aplica los permisos de acceso del modo. Memory utiliza `BytesIO` y cloud un temporal binario: estos buffers no implementan la misma restricción de lectura/escritura que un archivo local. El modo decide cómo inicializar y persistir el buffer; utiliza solo las operaciones previstas por el modo para mantener la portabilidad. En append no rebobines para sobrescribir: local fuerza las escrituras al final, mientras los buffers remotos permiten cambiar la posición antes de su posterior carga completa.

## Persistir archivos recibidos por HTTP

Hay dos tipos con el mismo nombre:

- `orionis.http.payload.uploaded_file.UploadedFile`: payload multipart con metadatos y operaciones síncronas sobre su buffer.
- `orionis.storage.UploadedFile`: adaptador async que referencia ese payload y lo persiste en un disco.

<a id="upload-construction"></a>
### Obtener el adaptador con Storage.uploaded()

La firma del manager es `uploaded(source: IHttpUploadedFile) -> IUploadedFile`. El constructor concreto es `UploadedFile(source: IHttpUploadedFile, manager: IStorageManager) -> None`. Utiliza `Storage.uploaded(source)` para asociarlo al manager configurado; no copia ni guarda el contenido al construirlo y no cambia quién es dueño del buffer HTTP.

El siguiente controlador recibe un campo multipart llamado `document`. Rechaza archivos vacíos o mayores de 2 MiB antes de persistir y conserva solo una ruta lógica en la respuesta:

```python
from orionis.http import JSONResponse, Request
from orionis.http.payload.uploaded_file import UploadedFile as HttpUploadedFile
from orionis.support.facades import Storage


class DocumentController:
    async def store(self, request: Request) -> JSONResponse:
        form = await request.form()
        source = form.get("document")
        if not isinstance(source, HttpUploadedFile):
            return JSONResponse({"error": "document must be a file"}, status_code=422)

        upload = Storage.uploaded(source)
        if upload.size() == 0 or upload.size() > 2 * 1024 * 1024:
            return JSONResponse({"error": "Invalid file size"}, status_code=422)

        stored = await upload.store("documents", disk="local", visibility="private")
        return JSONResponse(
            {
                "path": stored.path(),
                "original_name": upload.originalName(),
                "bytes": upload.size(),
            },
            status_code=201,
        )
```

Guárdalo en `app/http/controllers/document_controller.py` y registra `Route.post("/documents", [DocumentController, "store"])` después de importar el controlador y `Route` desde la fachada. Un cliente puede enviar `curl -F "document=@report.pdf" http://localhost:8000/documents` si esa es la dirección que muestra tu servidor.

La comprobación del controlador ocurre después del parsing multipart; los límites del parser protegen la recepción antes de llegar a esta acción. Para reglas de archivo, MIME, imagen y otras validaciones del contenido utiliza el payload HTTP original con [schemas](/es/validation), además de la autorización apropiada para tu ruta. La extensión y el MIME declarados por el cliente no demuestran el formato real.

### Metadatos y nombre de almacenamiento

<a id="upload-originalname"></a>
`originalName() -> str` devuelve el nombre del cliente, sanitizado por HTTP: se eliminan componentes de ruta, caracteres prohibidos y puntos iniciales. Un nombre vacío se sustituye por `"upload"`. Consérvalo como metadato de presentación si tu aplicación lo necesita.

<a id="upload-extension"></a>
`extension() -> str` devuelve el sufijo en minúsculas con el punto (`".pdf"`) o `""` si no hay extensión.

<a id="upload-size"></a>
`size() -> int` devuelve los bytes del payload; no es una consulta al archivo de destino.

<a id="upload-mimetype"></a>
`mimeType() -> str | None` devuelve el `Content-Type` declarado por el cliente; puede faltar.

<a id="upload-hashname"></a>
`hashName() -> str` genera `secrets.token_hex(20) + extension()`: 40 caracteres hexadecimales más el sufijo. Se calcula una vez por adaptador. Adaptar nuevamente el mismo payload crea otro adaptador con un nombre aleatorio independiente. No reserva la ruta ni garantiza una escritura exclusiva.

```python
from orionis.http.payload.uploaded_file import UploadedFile as HttpUploadedFile
from orionis.support.facades import Storage


async def describe_upload(source: HttpUploadedFile) -> dict[str, str | int | None]:
    upload = Storage.uploaded(source)
    return {
        "original": upload.originalName(),
        "extension": upload.extension(),
        "bytes": upload.size(),
        "declared_type": upload.mimeType(),
        "storage_name": upload.hashName(),
    }
```

<a id="upload-read"></a>
### read() -> bytes

`await upload.read()` ejecuta el `read()` del payload HTTP en un hilo. Ese payload rebobina y devuelve **todo** el archivo, incluso si antes se había leído una parte. Úsalo cuando el contenido sea suficientemente pequeño; para persistir no necesitas materializarlo antes.

```python
from orionis.http.payload.uploaded_file import UploadedFile as HttpUploadedFile
from orionis.support.facades import Storage


async def read_small_text_upload(source: HttpUploadedFile) -> str:
    upload = Storage.uploaded(source)
    if upload.size() > 64 * 1024:
        raise ValueError("Text upload exceeds 64 KiB")
    return (await upload.read()).decode("utf-8")
```

<a id="upload-store"></a>
### store(directory: str = "", disk: str | None = None, visibility: str | None = None) -> IFile

`await upload.store(...)` utiliza `hashName()`. `directory=""` escribe en la raíz lógica; `disk=None` selecciona el disco predeterminado. Devuelve un `IFile`, no una ruta ni un booleano. Puedes obtener su ruta con `stored.path()` y continuar con su [API](/es/storage/api-reference). El controlador anterior muestra su uso con disco y visibilidad explícitos.

<a id="upload-storeas"></a>
### storeAs(directory: str, name: str, disk: str | None = None, visibility: str | None = None) -> IFile

Usa un nombre determinado por tu aplicación, por ejemplo para reemplazar un documento identificado. `directory` y `name` son obligatorios, aunque el directorio puede ser `""`. Un nombre vacío o que contenga `/` o `\\` genera `StoragePathException`; la ruta resultante también pasa por la validación de Storage. Los directorios pertenecen a `directory`, no a `name`.

```python
from orionis.http.payload.uploaded_file import UploadedFile as HttpUploadedFile
from orionis.support.facades import Storage


async def replace_approved_document(source: HttpUploadedFile, document_id: int) -> str:
    stored = await Storage.uploaded(source).storeAs(
        "approved", f"document-{document_id}.pdf", disk="local", visibility="private",
    )
    return stored.path()
```

Este ejemplo presupone que ya validaste el contenido como PDF y autorizaste reemplazar ese documento. `storeAs()` no convierte el formato ni impide sobrescribir un destino existente.

<a id="upload-copy"></a>
### copy(directory: str, name: str | None = None, disk: str | None = None) -> IFile

Persiste otra copia y conserva abierto el payload. `name=None` o `name=""` utiliza `hashName()`. No acepta un argumento `visibility`; para indicarlo utiliza `store()` o `storeAs()`.

<a id="upload-move"></a>
### move(directory: str, name: str | None = None, disk: str | None = None) -> IFile

Primero ejecuta `storeAs()` y, únicamente si termina correctamente, cierra el payload en un hilo. Es una persistencia seguida de cierre del buffer; no renombra un archivo local de origen. Si falla el guardado, no llega a cerrar el origen. Si falla el cierre, la escritura ya puede haberse completado y la excepción se propaga. No acepta `visibility`.

El siguiente servicio conserva primero una copia de recepción y después guarda una segunda copia cerrando el origen. Ambos nombres explícitos son conocidos por la aplicación:

```python
from orionis.http.payload.uploaded_file import UploadedFile as HttpUploadedFile
from orionis.support.facades import Storage


async def archive_then_release(source: HttpUploadedFile, document_id: int) -> dict[str, str]:
    upload = Storage.uploaded(source)
    received = await upload.copy("received", f"document-{document_id}.pdf", disk="local")
    archived = await upload.move("archived", f"document-{document_id}.pdf", disk="local")
    return {"received": received.path(), "archived": archived.path()}
```

Después de `move()`, no vuelvas a leer o guardar ese payload, incluso desde otro adaptador creado con el mismo origen. Las copias persistidas continúan disponibles. Las dos escrituras del ejemplo son independientes; si falla la segunda, la primera permanece.

### La misma operación mediante inyección

El contenedor proporciona `IStorageManager`. Este servicio usa el mismo manager que la fachada; no necesita construirlo ni configurar un provider adicional:

```python
from orionis.http.payload.uploaded_file import UploadedFile as HttpUploadedFile
from orionis.storage.contracts.manager import IStorageManager


class DocumentStorage:
    def __init__(self, storage: IStorageManager) -> None:
        self.storage = storage

    async def save(self, source: HttpUploadedFile) -> str:
        stored = await self.storage.uploaded(source).store(
            "documents", disk="local", visibility="private",
        )
        return stored.path()
```

Puedes inyectar `DocumentStorage` en el constructor o la acción de un controlador. Para el flujo completo del contenedor, consulta [manager e inyección](/es/storage/manager-and-injection).

<a id="stream-driver-behavior"></a>
## Memoria, publicación y errores

`writeStream()` del adaptador consume `source.chunks()` en bloques de 64 KiB, avanzando el iterador síncrono en un hilo. El origen ya fue recibido y almacenado en un buffer por el parser: guardar el upload no transmite directamente los bytes del socket a la nube.

| Backend | Lectura con `readStream()` | Escritura con `writeStream()` y uso de `open()` |
| --- | --- | --- |
| Local | Lecturas del archivo por bloques; cierre en `finally`. | `writeStream()` prepara un `.tmp` y reemplaza al terminar. `open()` utiliza directamente el destino. |
| Memory | Fragmenta un `bytes` ya almacenado. | Acumula todos los bloques; `open()` usa `BytesIO` y persiste al cerrar. |
| S3 | Lee el `Body` remoto por bloques. | Spool completo antes de `upload_fileobj`; `open()` descarga para lectura/append y vuelve a cargar al cerrar modos de escritura. |
| Azure | Bloques decididos por el SDK; `chunk_size` se ignora. | Spool completo antes de `upload_blob(overwrite=True)`; `open()` también usa un spool completo. |
| GCS | Lee con el handle de `blob.open("rb")`. | Spool completo antes de `upload_from_file`; `open()` también usa un spool completo. |

Los buffers cloud pasan a disco al superar 8 MiB; no es un límite máximo del archivo ni una garantía de memoria constante para todo el proceso/SDK. Para vida útil, cancelación y limpieza, continúa con [archivos temporales y contextos](/es/storage/temporary-files-and-contexts).

Una ruta inválida genera `StoragePathException`; un disco desconocido, `DiskNotFoundException`; abrir en un modo no soportado, `UnsupportedStorageOperationException`. Un archivo ausente puede generar `StorageFileNotFoundException` al empezar a leer, no al construir el iterador/handle. Los SDK opcionales pueden generar `MissingStorageDependencyException`; otros errores de sistema operativo, SDK, red, productores o buffers cerrados se propagan. El adaptador no los convierte en `False` ni coordina rollback con la base de datos.

`store()`, `storeAs()` y `copy()` conservan abierto el origen. El kernel HTTP cierra los uploads al finalizar la entrega de la respuesta; no conserves el payload para una tarea desligada de la petición. Guarda el archivo antes y entrega a esa tarea su disco y ruta lógica. Consulta [Request y payloads](/es/http/requests) para el parsing y [archivos temporales y contextos](/es/storage/temporary-files-and-contexts) para el ciclo de vida completo.
