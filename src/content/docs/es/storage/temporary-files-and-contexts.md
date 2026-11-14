---
title: "Archivos temporales y contextos"
description: "Comprende los buffers y staging de cada driver, cierra los streams y administra archivos de trabajo con Storage."
editUrl: true
lastUpdated: false
---

Una operación puede utilizar un temporal interno sin crear un archivo temporal visible para tu aplicación. Storage también permite guardar un archivo de trabajo en una ruta lógica y eliminarlo cuando termines. Son ciclos de vida distintos: cerrar un stream libera su handle, pero no elimina el archivo guardado en el disco.

No existe una API pública `Storage.temporaryFile()`, `tempfile()` ni un contexto temporal sobre `IFile`. `temporaryUrl()` genera una URL de acceso con vencimiento cuando el driver lo admite; no elimina el objeto al vencer. Para un archivo de trabajo utiliza las operaciones reales `file()`, `write()`/`writeStream()`, `open()` y `delete()`.

## Dónde viven los temporales

| Origen | Almacenamiento intermedio | Cuándo se libera o publica |
| --- | --- | --- |
| Escritura local con `write()`/`writeStream()` | Archivo hermano con nombre `<destino>.<16 hex>.tmp`. | Se reemplaza el destino al terminar la escritura; el staging deja de existir después del reemplazo. |
| `open()` local | El propio archivo de destino. | Se cierra su handle; el archivo y sus cambios permanecen. |
| `writeStream()` de S3, Azure o GCS | `SpooledTemporaryFile`: primero memoria, después archivo temporal del sistema al superar 8 MiB. | El SDK recibe el buffer completo y después se intenta cerrar en `finally`, también si falla la carga. |
| `open()` de S3, Azure o GCS | `SpooledTemporaryFile` con umbral de 8 MiB. | Los modos de escritura cargan todo el contenido al cerrar; el buffer se cierra en `finally`, también si falla la carga. |
| Memory | `bytes` almacenados por el driver; `bytearray` durante `writeStream()` y `BytesIO` durante `open()`. | Cerrar el stream persiste el buffer en el driver; el archivo permanece hasta `delete()` o hasta perder esa instancia/proceso. |
| Upload multipart HTTP | `SpooledTemporaryFile` con umbral configurado para la petición. | Se cierra al finalizar la petición o antes mediante `move()`; cerrar elimina su temporal físico si había pasado a disco. |

Los temporales de `tempfile` se ubican según la configuración del sistema operativo/Python; no se guardan necesariamente dentro de `storage/app`. La API de Storage no expone su ruta física ni el umbral cloud como argumentos de `open()` o `writeStream()`.

### Staging local y publicación

Local utiliza nombres únicos para que dos escritores no compartan su staging. `write()` crea el temporal, escribe y ejecuta un reemplazo del destino; elimina el temporal si esa secuencia produce un `OSError`. `writeStream()` escribe cada bloque en su temporal y solo reemplaza el destino cuando el productor termina normalmente.

`writeStream()` intenta eliminar el staging en `finally`, también cuando falla el productor, la publicación o la operación de visibilidad. Las operaciones nativas terminan antes de propagar la cancelación y ejecutar la limpieza. Un fallo posterior a publicar no revierte el destino, y un error de limpieza del sistema operativo aún puede impedir la eliminación.

Los listados locales solo omiten nombres internos terminados en `.<16 caracteres hexadecimales minúsculos>.tmp`. Los archivos de la aplicación como `report.tmp` se listan. No hay una operación pública para inspeccionar el staging ni un recolector automático tras terminar el proceso.

El reemplazo evita publicar los bloques incompletos durante una escritura que falla antes del commit; no es una transacción con otras operaciones ni una garantía de durabilidad ante una interrupción del equipo. `open("wb")` no utiliza este staging: abre y trunca directamente el destino al entrar o realizar la primera operación.

### Buffers cloud

S3, Azure y GCS consumen primero todo el productor de `writeStream()` en un buffer. Este conserva los primeros 8 MiB en memoria y pasa a disco si se supera ese umbral; después se rebobina y el SDK realiza la carga. Si falla el productor, se intenta cerrar el spool antes de propagar el error. Si falla la carga, el `finally` intenta cerrarlo igualmente.

Para `open("rb")` y `open("rb+")` se descarga el objeto completo antes de entregar el handle. `ab` y `ab+` también descargan el contenido existente y sitúan el cursor al final; toleran un objeto ausente. `wb` y `wb+` comienzan con un buffer vacío. Cualquier modo distinto de `rb` vuelve a cargar el buffer completo al cerrar, incluso si no escribiste ningún byte adicional. Para lectura incremental utiliza `readStream()`.

Estas llamadas no exponen una transacción remota, una operación `abort()` de Storage ni un cambio de visibilidad mediante `open()`. Si necesitas visibilidad explícita al publicar, usa `write()`/`writeStream()` o las operaciones del archivo documentadas en la [referencia de API](/es/storage/api-reference).

## Un contexto administra un handle

`file.open(mode="rb")` es síncrono y lazy. Los drivers devuelven `AsyncStream`, que implementa `IStorageStream`; sus métodos `read`, `write`, `seek`, `close` y su contexto son asíncronos. Consulta sus [firmas y modos](/es/storage/streaming-and-uploads#stream-construction).

```mermaid
flowchart TD
    A["file.open(mode): construye AsyncStream"] --> B["async with / primera operación"]
    B --> C["opener en hilo: obtiene el handle"]
    C --> D["await read / write / seek"]
    D --> E["Salida normal o excepción del bloque"]
    E --> F["close(): separa el handle"]
    F --> G{"¿Callback on_close?"}
    G -->|No| H["Cierra el handle"]
    G -->|Sí| I["Persiste el buffer en hilo"]
    I -->|Éxito| H
    I -->|Fallo| H
    H --> K["Conserva el error del bloque o propaga el de limpieza"]
```

`async with` llama a `close()` al abandonar el bloque, tanto con éxito como con una excepción. En memory/cloud esa salida puede **publicar los bytes ya escritos aunque tu lógica haya fallado**. En local ya se modificó directamente el archivo. El contexto no interpreta la excepción como una orden de rollback.

Este ejemplo permite observar esa diferencia desde un servicio async. Tras la excepción, el archivo contiene `b"partial"`:

```python
from orionis.support.facades import Storage


async def inspect_failed_write() -> bytes:
    file = Storage.disk("local").file("work/failed-report.bin")
    try:
        async with file.open("wb") as stream:
            await stream.write(b"partial")
            raise ValueError("Report validation failed")
    except ValueError:
        return await file.read()
```

Cuando administras el stream manualmente, utiliza `try/finally` alrededor de las operaciones. `close()` es idempotente entre cierres, pero una lectura posterior puede volver a abrirlo. No hay un estado público `closed` ni un método público `flush()` para adelantar la publicación cloud.

```python
from orionis.support.facades import Storage


async def read_report_signature() -> bytes:
    stream = Storage.disk("local").file("reports/stock.csv").open("rb")
    try:
        return await stream.read(8)
    finally:
        await stream.close()
```

`AsyncStream` serializa lecturas, escrituras, seeks, apertura y cierre nativos con un lock asíncrono. Una secuencia de operaciones no es atómica y la iteración por bloques libera el lock entre lecturas. Usa contextos separados para consumidores independientes en lugar de compartir una posición de archivo mutable.

## Crear un archivo de trabajo y eliminarlo

Este es un helper de tu aplicación, no una función incorporada por el framework. Guárdalo en `app/services/temporary_files.py`. Usa un nombre aleatorio bajo `work/`, un disco local privado y las operaciones públicas de Storage:

```python
from collections.abc import AsyncIterable, AsyncIterator
from contextlib import asynccontextmanager
from uuid import uuid4
from orionis.storage.contracts.file import IFile
from orionis.support.facades import Storage


@asynccontextmanager
async def temporary_csv(chunks: AsyncIterable[bytes]) -> AsyncIterator[IFile]:
    file = Storage.disk("local").file(f"work/export-{uuid4().hex}.csv")
    try:
        await file.writeStream(chunks, visibility="private")
        yield file
    finally:
        await file.delete()
```

La ruta es relativa al disco; no crea un `Path` fuera de Storage. El `try` incluye la escritura y el uso del archivo. Si la escritura devuelve correctamente, el consumidor recibe un `IFile` normal; al salir, `delete()` elimina ese archivo y devuelve `False` si ya no existe. Si la escritura o el consumidor lanzan una excepción, se intenta la misma eliminación. Si `delete()` falla, su excepción también se propaga.

Puedes consumirlo desde un servicio o controlador:

```python
from app.services.temporary_files import temporary_csv


async def inspect_temporary_export() -> dict[str, int | str]:
    async def rows():
        yield b"product,quantity\n"
        yield b"keyboard,4\n"

    async with temporary_csv(rows()) as file:
        async with file.open("rb") as stream:
            header = await stream.read(16)
        return {"header": header.decode("utf-8"), "bytes": await file.size()}
```

Al devolver el resultado, primero se cierra el handle y después se elimina el archivo. No devuelvas ese `IFile` para usarlo más tarde: su contexto ya habrá terminado. Este patrón elimina la ruta lógica elegida por tu aplicación; la limpieza del staging corresponde al driver.

### Mantener el temporal durante una descarga HTTP

`StreamingResponse` consume sus bloques después de que la acción devuelve el objeto de respuesta. Por eso el contexto debe estar **dentro del generador de contenido**, no alrededor de la construcción de la respuesta en el controlador:

```python
from collections.abc import AsyncIterator
from contextlib import aclosing
from app.services.temporary_files import temporary_csv
from orionis.http import StreamingResponse


class CsvExportController:
    async def download(self) -> StreamingResponse:
        async def rows() -> AsyncIterator[bytes]:
            yield b"product,quantity\n"
            yield b"keyboard,4\n"

        async def content() -> AsyncIterator[bytes]:
            async with temporary_csv(rows()) as file:
                async with aclosing(file.readStream(chunk_size=65536)) as chunks:
                    async for chunk in chunks:
                        yield chunk

        return StreamingResponse(
            content(),
            media_type="text/csv",
            headers={"Content-Disposition": 'attachment; filename="export.csv"'},
        )
```

Guarda el controlador en `app/http/controllers/csv_export_controller.py` y asocia una ruta GET a `download`, como en [streams y uploads](/es/storage/streaming-and-uploads). Los adaptadores HTTP cierran el iterador de la respuesta en su limpieza. Al cerrarse `content()`, sus contextos intentan cerrar la lectura y eliminar el archivo. No elimines el temporal justo después de `return StreamingResponse(...)`, ni abras un handle en un contexto que termine antes de transmitirlo.

Para este informe pequeño podrías producir las filas directamente en `StreamingResponse`; el archivo intermedio es útil cuando un consumidor necesita releer, buscar posiciones o comprobar el resultado antes de entregarlo.

## Excepciones, cancelación y limpieza

Distingue las garantías de cada operación:

- `AsyncStream` siempre intenta cerrar el handle después del callback de persistencia. Durante una salida excepcional, observa los fallos secundarios de limpieza y conserva el error original del bloque. Esto no implica rollback.
- Local, S3 y GCS cierran los lectores nativos en `finally`; Azure cierra el iterador del SDK cuando dispone de `close()`. Agota o cierra explícitamente el generador; usa `aclosing()` si sales antes del final.
- Storage espera el I/O nativo que posee antes de propagar la cancelación y liberar sus buffers. Cancelar no detiene forzosamente un hilo ni revierte una carga del SDK; una escritura puede completarse mientras se gestiona la cancelación. Configura timeouts finitos de SDK/red.
- El helper de aplicación anterior aún utiliza un `finally` normal para eliminar su archivo de trabajo. Un fallo de limpieza, cancelaciones repetidas de ese código o terminar abruptamente el proceso pueden dejar un archivo; diseña recuperación al reiniciar si la necesitas.

Mantén cada operación y su limpieza bajo el control de la misma tarea; espera su finalización antes de reutilizar/eliminar sus archivos. Si tu servicio necesita recuperación tras reinicios, conserva un registro de sus archivos de trabajo y aplica una política propia de limpieza de rutas que pertenezcan a ese servicio. Storage no les asigna un TTL ni proporciona un recolector automático.

Las excepciones de I/O o del SDK se propagan. La limpieza de streams nativos conserva una excepción de operación existente y observa los fallos secundarios mediante el [sistema de excepciones](/es/exceptions). El `delete()` independiente del helper aún puede fallar y requiere una política de aplicación. Ni la limpieza ni el helper hacen transaccionales varias operaciones.

## Vida útil del upload HTTP

`Request.form()` recibe los archivos a través del parser multipart. Su umbral de spool procede de `HTTPBodyLimits.memory_threshold`, configurado mediante `HTTP_UPLOAD_MEMORY_THRESHOLD` y con valor predeterminado de **256 KiB por archivo**. Crear directamente `orionis.http.payload.uploaded_file.UploadedFile(...)` utiliza un valor predeterminado distinto: **1 MiB**. Ninguno de esos umbrales es el tamaño máximo permitido de una carga.

El parser limita por separado los bytes recibidos, tamaño de cada parte y memoria multipart. Cuando escribir un archivo utiliza disco, su helper espera al hilo incluso ante cancelación antes de continuar con la limpieza. Si el parsing falla o se cancela, intenta cerrar las partes de archivo actuales y las ya acumuladas.

Una vez creado `FormData`, `Request.close()` cierra sus archivos mediante `FormData.close()`. El kernel lo ejecuta en `finally` después de la entrega de respuesta en los flujos ASGI y RSGI. El contexto síncrono `with form:` también los cierra al salir; no lo termines mientras otro consumidor necesite el upload.

El adaptador `Storage.uploaded(source)` referencia el mismo buffer: no prolonga su vida. `store()`, `storeAs()` y `copy()` lo mantienen abierto; `move()` guarda y después lo cierra. Persiste dentro de la petición y pasa a trabajos posteriores la ruta lógica del archivo guardado, no el objeto HTTP. Consulta [Request y payloads](/es/http/requests) y la [referencia del adaptador de uploads](/es/storage/streaming-and-uploads#upload-construction).
