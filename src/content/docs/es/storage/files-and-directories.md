---
title: "Guardar archivos y recorrer directorios"
description: "Referencia práctica de Disk, File y Directory: contenido, rutas, listados, metadatos, visibilidad y URLs."
editUrl: true
lastUpdated: false
---

Obtén un disco configurado mediante `Storage` y trabaja con sus objetos de archivo y directorio. Las rutas son relativas a ese disco: el código de aplicación puede utilizar almacenamiento local, memoria o un backend cloud.

```python
from orionis.support.facades import Storage


class ReportStorage:
    async def save(self, report_id: int, contents: str) -> dict[str, object]:
        disk = Storage.disk("local")
        report = await disk.put(
            f"reports/{report_id}/summary.txt",
            contents,
            visibility="private",
        )
        return {
            "disk": disk.name(),
            "path": report.path(),
            "bytes": await report.size(),
        }
```

Los ejemplos se ejecutan dentro de una aplicación Orionis iniciada. `local` debe estar configurado; `Storage.disk()` selecciona el disco predeterminado. Importa siempre la fachada con `from orionis.support.facades import Storage`. Consulta la [configuración de discos](/es/storage/disks-and-drivers) para elegir el backend.

`disk()`, `name()`, `file()`, `directory()` y `path()` son síncronos. Las operaciones de almacenamiento utilizan `await`; `readStream()` devuelve un iterador asíncrono y `open()` un administrador de contexto asíncrono. Estas dos fábricas no se esperan con `await`.

## Referencias y rutas

| Objeto | Responsabilidad | Contrato |
| --- | --- | --- |
| `Disk` | Backend nombrado y fábricas de archivos/directorios. | `IDisk` |
| `File` | Operaciones sobre una ruta de archivo normalizada y no vacía. | `IFile` |
| `Directory` | Operaciones sobre un directorio o la raíz del disco. | `IDirectory` |

Los contratos se exponen desde `orionis.storage.contracts`. Crear una referencia no crea ni comprueba su destino. La referencia conserva su ruta y driver; no almacena en caché el contenido ni los metadatos.

<a id="path-normalization"></a>

### Normalización de rutas

`normalize_path(path: str) -> str` y `normalize_file_path(path: str) -> str`, disponibles en `orionis.storage.paths`, implementan las reglas aplicadas por las fábricas:

- Convierten las barras invertidas en `/` y eliminan separadores iniciales, finales y repetidos.
- Eliminan segmentos `.` y resuelven los segmentos `..` internos.
- Rechazan ascensos por encima de la raíz, bytes nulos y `:` en cualquier segmento mediante `StoragePathException`.
- Devuelven `""` para la raíz; el normalizador de archivos también rechaza ese resultado.

| Entrada | Ruta canónica / resultado |
| --- | --- |
| `"/reports//annual.txt/"` | `"reports/annual.txt"` |
| `r"reports\drafts\..\annual.txt"` | `"reports/annual.txt"` |
| `"reports/.."` | Raíz de directorio `""`; inválida para un archivo. |
| `"../annual.txt"`, `"reports/a:stream"` | `StoragePathException` |

Una barra inicial significa la **raíz del disco de Storage**, no la raíz del sistema operativo. Las rutas son claves lógicas, no URLs, nombres de disco ni rutas absolutas del servidor.

```python
from orionis.support.facades import Storage


class ReportReferences:
    async def inspect(self) -> dict[str, object]:
        disk = Storage.disk("local")
        report = disk.file(r"reports\drafts\..\annual.txt")
        folder = disk.directory("/reports//")
        return {
            "file": report.path(),       # reports/annual.txt
            "directory": folder.path(),  # reports
            "exists": await report.exists(),
        }
```

La normalización es léxica. El driver local une la clave normalizada con su raíz; no verifica que el destino permanezca dentro de ella después de seguir enlaces simbólicos. Mantén esa raíz y sus enlaces bajo control de la aplicación.

## Referencia de Disk

<a id="disk-construction"></a>

### Construcción y resolución

El constructor de la implementación es `Disk(name: str, driver: IStorageDriver) -> None` y conserva ambos argumentos. El código de aplicación normalmente utiliza `Storage.disk(name)` en lugar de construir drivers.

Todos los parámetros de ruta siguientes son cadenas. Una ruta lógica inválida produce `StoragePathException`. Los errores nativos del sistema de archivos y del SDK pueden propagarse: las operaciones no convierten cualquier fallo en `False`.

<a id="disk-name"></a>

### `name() -> str`

Devuelve el nombre configurado del disco sin I/O. Ejemplo: `disk_name = Storage.disk("local").name()`.

<a id="disk-file"></a>

### `file(path: str) -> IFile`

Crea una referencia de archivo normalizada. La ruta es obligatoria y no puede resolverse a la raíz. Ejemplo: `report = disk.file("reports/annual.txt")`. La ausencia del archivo no genera un error por el mero hecho de construir esta referencia.

<a id="disk-directory"></a>

### `directory(path: str = "") -> IDirectory`

Crea una referencia de directorio; omite la ruta para representar la raíz. Ejemplos: `reports = disk.directory("reports")` y `root = disk.directory()`. Ninguna llamada crea directorios.

<a id="disk-put"></a>

### `async put(path: str, contents: bytes | str, visibility: str | None = None) -> IFile`

Crea o reemplaza contenido mediante `file(path).write(contents, visibility)` y devuelve la referencia escrita. Las cadenas se codifican en UTF-8; `None` delega la visibilidad al backend. Ejemplo: `report = await disk.put("reports/annual.txt", "Annual report", "private")`.

<a id="disk-exists"></a>

### `async exists(path: str) -> bool`

Comprueba un **archivo** y devuelve `False` si está ausente. Ejemplo: `available = await disk.exists("reports/annual.txt")`. Para directorios utiliza su método `exists()`.

<a id="disk-delete"></a>

### `async delete(path: str) -> bool`

Elimina un archivo: `True` si se retiró y `False` si estaba ausente. Ejemplo: `removed = await disk.delete("reports/obsolete.txt")`. No elimina directorios recursivamente.

<a id="disk-copy"></a>

### `async copy(source: str, target: str) -> IFile`

Copia dentro del mismo disco y devuelve la referencia de destino, conservando el origen. Ejemplo: `backup = await disk.copy("reports/annual.txt", "backups/annual.txt")`. Un origen ausente produce `StorageFileNotFoundException`; ambas rutas se normalizan.

<a id="disk-move"></a>

### `async move(source: str, target: str) -> IFile`

Mueve dentro del mismo disco y devuelve la nueva referencia. Ejemplo: `archived = await disk.move("reports/annual.txt", "archive/annual.txt")`. Un origen ausente produce `StorageFileNotFoundException`. La atomicidad y conservación de metadatos dependen del driver; consulta [reubicación](#file-copyto).

```python
from orionis.support.facades import Storage


class ReportArchive:
    async def archive(self, report_id: int) -> dict[str, str]:
        disk = Storage.disk("local")
        source = f"reports/{report_id}.txt"
        backup = await disk.copy(source, f"backups/{report_id}.txt")
        archived = await disk.move(source, f"archive/{report_id}.txt")
        return {"backup": backup.path(), "archive": archived.path()}

    async def remove_backup(self, report_id: int) -> bool:
        return await Storage.disk("local").delete(f"backups/{report_id}.txt")
```

## Contenido de File

<a id="file-construction"></a>

### Construcción

`File(driver: IStorageDriver, path: str) -> None` normaliza su ruta inmediatamente. Obtenlo mediante `Storage.disk().file(path)` o conserva el `IFile` que devuelve `put()`.

<a id="file-path"></a>

### `path() -> str`

Devuelve la clave relativa canónica sin I/O. Ejemplo: `key = report.path()`. Guarda el nombre del disco junto a esa clave si necesitas resolverlo después en un disco concreto.

<a id="file-read"></a>

### `async read() -> bytes`

Lee el contenido completo en memoria. Ejemplo: `contents = await report.read()`; decodifica el texto explícitamente con `contents.decode("utf-8")`. Un archivo ausente produce `StorageFileNotFoundException`.

<a id="file-write"></a>

### `async write(contents: bytes | str, visibility: str | None = None) -> IFile`

Crea o reemplaza el contenido y devuelve la **misma** referencia. Ejemplo: `await report.write("Updated report", visibility="private")`. Local crea los directorios padre necesarios; los object stores aceptan claves anidadas. Reemplaza, no añade al final. `None` no garantiza visibilidad privada ni conservación de permisos anteriores en todos los backends.

```python
from orionis.support.facades import Storage


class ReportText:
    async def replace(self, report_id: int, contents: str) -> str:
        report = Storage.disk("local").file(f"reports/{report_id}.txt")
        await report.write(contents, visibility="private")
        return (await report.read()).decode("utf-8")
```

<a id="file-readstream"></a>

### `readStream(chunk_size: int = 65536) -> AsyncIterator[bytes]`

Consume el resultado con `async for`, sin esperar la fábrica con `await`. Ejemplo: `async for chunk in report.readStream(131072): ...`. El error de archivo ausente puede producirse durante la iteración. Utiliza un tamaño positivo: los valores cero/negativos no tienen validación común ni comportamiento uniforme entre drivers.

<a id="file-writestream"></a>

### `async writeStream(stream: AsyncIterable[bytes], visibility: str | None = None) -> IFile`

Consume chunks de bytes asíncronos, reemplaza el contenido y devuelve la misma referencia. Ejemplo: `await target.writeStream(source.readStream(), visibility="private")`. Transfiere contenido, no la visibilidad ni los metadatos del origen. Memoria acumula los chunks; local utiliza un archivo intermedio; los drivers cloud pueden utilizar un spool antes de subirlos.

```python
from orionis.support.facades import Storage


class ReportTransfer:
    async def copy_contents(self, source_disk: str, target_disk: str) -> str:
        source = Storage.disk(source_disk).file("reports/annual.csv")
        target = Storage.disk(target_disk).file("imports/annual.csv")
        await target.writeStream(source.readStream(), visibility="private")
        return target.path()
```

Pasa nombres de discos configurados y claves de origen/destino diferentes. No existe una transacción que abarque ambos discos. Consulta [streams y uploads](/es/storage/streaming-and-uploads) para buffering y transferencias grandes.

<a id="file-open"></a>

### `open(mode: str = "rb") -> IStorageStream`

Devuelve un stream binario de apertura diferida: utiliza `async with`, sin esperar `open()` con `await`. Los modos son `rb`, `wb`, `ab`, `rb+`, `wb+` y `ab+`; los modos de texto producen `UnsupportedStorageOperationException`. Un destino de lectura ausente produce `StorageFileNotFoundException` al entrar en el contexto. Los modos de escritura crean/reemplazan datos; los de append conservan el prefijo existente.

```python
from orionis.support.facades import Storage


class AuditLog:
    async def append(self, message: str) -> None:
        log = Storage.disk("local").file("logs/business.log")
        async with log.open("ab") as stream:
            await stream.write((message + "\n").encode("utf-8"))
```

La [guía de streams](/es/storage/streaming-and-uploads) explica los cursores, el flush y las diferencias entre backends.

<a id="file-exists"></a>

### `async exists() -> bool`

Comprueba el estado almacenado actual. Ejemplo: `available = await report.exists()`. La ausencia devuelve `False`; los errores de permisos/conectividad no significan ausencia. Otra operación puede eliminar el archivo después de comprobarlo.

<a id="file-delete"></a>

### `async delete() -> bool`

Elimina el archivo e indica si existía. Ejemplo: `removed = await report.delete()`. Una segunda eliminación normalmente devuelve `False`. La referencia conserva su ruta; una escritura posterior puede crear de nuevo ese destino.

```python
from orionis.storage.exceptions import StorageFileNotFoundException
from orionis.support.facades import Storage


class StoredReportReader:
    async def read_if_available(self, report_id: int) -> bytes | None:
        report = Storage.disk("local").file(f"reports/{report_id}.txt")
        try:
            return await report.read()
        except StorageFileNotFoundException:
            return None

    async def delete(self, report_id: int) -> bool:
        return await Storage.disk("local").file(f"reports/{report_id}.txt").delete()
```

## Copiar, mover y renombrar

<a id="file-copyto"></a>

### `async copyTo(target: str) -> IFile`

Copia a una ruta de archivo normalizada en el **mismo disco**, devuelve una nueva referencia y conserva el origen. Ejemplo: `backup = await report.copyTo("backups/annual.txt")`. Los destinos inválidos producen `StoragePathException` y los orígenes ausentes `StorageFileNotFoundException`.

<a id="file-moveto"></a>

### `async moveTo(target: str) -> IFile`

Mueve dentro del mismo disco. Ejemplo: `archived = await report.moveTo("archive/annual.txt")`. Devuelve una nueva referencia; la original sigue apuntando a su ruta anterior. Trabaja después con el objeto devuelto. Las rutas inválidas y los orígenes ausentes tienen los mismos errores que en una copia.

<a id="file-rename"></a>

### `async rename(name: str) -> IFile`

Construye el destino a partir del directorio padre actual y el nuevo nombre, y llama a `moveTo()`. Ejemplo: `renamed = await archived.rename("annual-final.txt")`. Los nombres vacíos y los separadores de directorio producen `StoragePathException`. Utiliza un nombre de archivo concreto, no `.` ni `..`: la normalización de rutas también se aplica al destino construido. Un origen ausente produce `StorageFileNotFoundException`.

```python
from orionis.support.facades import Storage


class ReportRelocation:
    async def finalize(self) -> dict[str, str]:
        report = Storage.disk("local").file("drafts/annual.txt")
        backup = await report.copyTo("backups/annual.txt")
        moved = await report.moveTo("published/annual.txt")
        renamed = await moved.rename("annual-final.txt")
        return {
            "old_reference": report.path(),
            "backup": backup.path(),
            "published": renamed.path(),
        }
```

Elige origen y destino diferentes. La API no rechaza rutas iguales; mover a la misma clave en memoria elimina la entrada. En una copia local utiliza un archivo de destino, no un directorio existente, que la operación subyacente interpreta como contenedor.

Los movimientos cloud copian y después eliminan; no son renombrados atómicos. Si falla la eliminación, pueden quedar ambas copias. Se pueden sobrescribir destinos existentes; conservar fechas, visibilidad y metadatos del proveedor depende del backend. Reaplica la visibilidad requerida cuando esté soportado.

## Metadatos y visibilidad

<a id="file-size"></a>

### `async size() -> int`

Devuelve bytes, no caracteres de texto. Ejemplo: `byte_count = await report.size()`. Un archivo ausente produce `StorageFileNotFoundException`.

<a id="file-mimetype"></a>

### `async mimeType() -> str | None`

Devuelve un tipo MIME o `None` si se desconoce. Ejemplo: `content_type = await report.mimeType()`. Local/memoria lo deducen de la extensión sin comprobar existencia; los drivers cloud consultan metadatos y pueden producir `StorageFileNotFoundException`. No inspecciona el contenido ni valida uploads.

<a id="file-lastmodified"></a>

### `async lastModified() -> datetime`

Devuelve la fecha de modificación. Ejemplo: `modified = (await report.lastModified()).isoformat()`. El contrato utiliza fechas con zona horaria; local/memoria generan fechas UTC y los drivers cloud devuelven metadatos del SDK. Un archivo ausente produce `StorageFileNotFoundException`.

<a id="file-hash"></a>

### `async hash(algorithm: str = "sha256") -> str`

Lee el contenido y devuelve un digest hexadecimal. Ejemplo: `digest = await report.hash("sha512")`; si se omite el argumento utiliza SHA-256. Los algoritmos desconocidos producen `UnsupportedStorageOperationException`; los archivos ausentes, `StorageFileNotFoundException`. Utiliza algoritmos de salida fija aceptados por `hashlib.new`: no existe un argumento de longitud para digests SHAKE. Calcular el hash de un archivo cloud transfiere su contenido a la aplicación.

<a id="visibility"></a>

### Valores de visibilidad

`Visibility`, expuesto desde `orionis.storage`, es un `StrEnum` con `Visibility.PUBLIC = "public"` y `Visibility.PRIVATE = "private"`. Puedes pasar los miembros o sus cadenas a la API. La visibilidad no crea una ruta HTTP ni expone por sí misma un medio de almacenamiento mediante una URL.

<a id="file-visibility"></a>

### `async visibility() -> str`

Devuelve la interpretación del backend sobre acceso público/privado. Ejemplo: `level = await report.visibility()`. Requiere un archivo existente; de lo contrario produce `StorageFileNotFoundException`. También pueden propagarse errores del SDK.

<a id="file-setvisibility"></a>

### `async setVisibility(visibility: str) -> IFile`

Cambia la visibilidad y devuelve la misma referencia. Ejemplo: `await report.setVisibility("private")`. Local, memoria, S3 y GCS rechazan niveles no soportados con `UnsupportedStorageOperationException`; los destinos ausentes producen `StorageFileNotFoundException`. Azure siempre rechaza esta operación porque Orionis no implementa visibilidad individual por blob.

| Driver | Comportamiento real |
| --- | --- |
| Local | Los niveles explícitos private/public utilizan `0600`/`0644`; la lectura de grupo/otros se clasifica como pública. Sin nivel explícito se aplican los permisos predeterminados del SO. Depende del soporte de permisos de la plataforma. |
| Memoria | Los archivos nuevos son privados; reescribir con `None` conserva el nivel existente. Es un metadato almacenado, no un control de acceso de red. |
| S3 | Los niveles explícitos utilizan ACL del objeto; al omitirlos no se envía una ACL. La lectura consulta concesiones de lectura pública, no todas las políticas del bucket/IAM. |
| GCS | Los niveles explícitos utilizan ACL predefinidas; los cambios posteriores usan las operaciones public/private del SDK. Las políticas de acceso pueden rechazarlos. |
| Azure | La escritura ignora la visibilidad. La lectura utiliza la política de acceso público del contenedor; cambiar un blob individual no está soportado. |

Utiliza public/private de forma deliberada. No hay un validador común que trate otros valores de manera idéntica en todas las implementaciones de escritura. Que una operación falle no garantiza que su escritura de contenido se haya revertido.

<a id="file-info"></a>

### `async info() -> FileInfo`

Devuelve un snapshot inmutable; un archivo ausente produce `StorageFileNotFoundException`. Ejemplo: `snapshot = await report.info()`. `FileInfo` es una dataclass frozen, con slots y campos exclusivamente por nombre. Los cuatro primeros campos siguientes son obligatorios; los demás tienen `None` como valor predeterminado.

| Campo | Tipo | Significado |
| --- | --- | --- |
| `path` | `str` | Ruta canónica de almacenamiento. |
| `size` | `int` | Bytes de contenido. |
| `lastModified` | `datetime` | Última modificación. |
| `visibility` | `str` | Nivel de acceso informado por el backend. |
| `mimeType` | `str \| None` | Tipo de contenido según metadatos/extensión. |
| `createdAt` | `datetime \| None` | Creación cuando está disponible. |
| `etag` | `str \| None` | Entity tag; no siempre es un MD5. |
| `checksum` | `str \| None` | Checksum del driver; el algoritmo varía. |
| `url` | `str \| None` | URL pública construida cuando está disponible. |

| Driver | `createdAt` | `etag` | `checksum` |
| --- | --- | --- | --- |
| Local | Fecha de nacimiento del archivo cuando existe; de lo contrario `None`. | MD5 calculado. | SHA-256 calculado. |
| Memoria | Fecha de creación en memoria. | MD5 calculado. | SHA-256 calculado. |
| S3 | `None`. | ETag del proveedor. | `None`. |
| Azure | Fecha de creación del SDK. | ETag del proveedor. | MD5 del contenido almacenado, hexadecimal, cuando se informa. |
| GCS | Fecha de creación del SDK. | ETag del proveedor. | MD5 almacenado decodificado a hexadecimal, cuando se informa. |

`info()` calcula digests en local/memoria; para un archivo local grande se lee todo su contenido. Solicita `size()` o `lastModified()` cuando sean suficientes. El snapshot no se actualiza después de escribir, copiar o cambiar visibilidad.

```python
from orionis.support.facades import Storage


class ReportMetadata:
    async def inspect(self) -> dict[str, object]:
        report = Storage.disk("local").file("reports/annual.txt")
        await report.setVisibility("private")
        snapshot = await report.info()
        return {
            "path": snapshot.path,
            "bytes": await report.size(),
            "mime": await report.mimeType(),
            "modified": (await report.lastModified()).isoformat(),
            "visibility": await report.visibility(),
            "sha256": await report.hash(),
            "etag": snapshot.etag,
        }
```

## URLs y descargas locales

<a id="file-url"></a>

### `async url() -> str`

Construye una URL sin firma. Ejemplo: `url = await report.url()`. Local/memoria requieren una URL base; si falta producen `UnsupportedStorageOperationException`. Los drivers cloud utilizan la configuración del proveedor. Los caracteres reservados se codifican para URL y las barras conservan su papel de separador.

No comprueba existencia, concede acceso público, sube un archivo ni configura el servicio de archivos estáticos. La URL base de un disco de memoria no sirve su contenido por HTTP. Un objeto cloud privado puede tener una URL sin firma que rechace acceso anónimo.

<a id="file-temporaryurl"></a>

### `async temporaryUrl(expires_in: int = 3600) -> str`

Construye una URL firmada con duración en segundos. Ejemplo: `url = await report.temporaryUrl(expires_in=300)`. Local/memoria siempre producen `UnsupportedStorageOperationException`. S3 firma URLs GET; Azure genera URLs SAS de lectura y requiere la clave de cuenta; GCS solicita firmas GET V4 con credenciales capaces de firmar. Los errores del SDK pueden propagarse. No hay una comprobación de rango común para la duración; generar la firma no comprueba existencia.

```python
from orionis.support.facades import Storage


class ReportLinks:
    async def public_link(self, disk_name: str) -> str:
        return await Storage.disk(disk_name).file("reports/public.pdf").url()

    async def private_link(self, disk_name: str) -> str:
        report = Storage.disk(disk_name).file("reports/private.pdf")
        return await report.temporaryUrl(expires_in=300)
```

Llama a `private_link()` con un disco cloud configurado y capaz de firmar, después de autorizar el acceso al reporte.

<a id="file-download"></a>

### `async download(destination: str | Path) -> Path`

Copia al **sistema de archivos del servidor de aplicación** y devuelve la ruta local absoluta. Ejemplo: `saved = await report.download(destination)`. Un directorio existente recibe el nombre original del archivo; cualquier otro destino se interpreta como ruta de archivo. Crea los directorios padre necesarios y puede reemplazar contenido existente. Un origen ausente produce `StorageFileNotFoundException`; los errores de destino/permisos pueden conservar su tipo nativo.

El destino es una ruta del servidor, fuera de la normalización de Storage. Utiliza uno controlado por la aplicación. El método no envía un adjunto HTTP al navegador.

```python
from tempfile import TemporaryDirectory
from orionis.support.facades import Storage


class ReportExport:
    async def inspect_download(self) -> str:
        report = Storage.disk("local").file("reports/annual.csv")
        with TemporaryDirectory() as destination:
            saved = await report.download(destination)
            return saved.name
```

El directorio temporal se elimina al salir del contexto. Consulta [streams y uploads](/es/storage/streaming-and-uploads) para la entrega por HTTP.

## Operaciones de Directory

<a id="directory-construction"></a>

### Construcción

`Directory(driver: IStorageDriver, path: str = "") -> None` normaliza su ruta. Obtén referencias mediante `disk.directory(path)`. Pueden apuntar a directorios ausentes: crearlos es una operación separada.

<a id="directory-path"></a>

### `path() -> str`

Devuelve la clave canónica sin I/O. Ejemplo: `key = reports.path()`. La raíz es `""`, no una barra.

<a id="directory-create"></a>

### `async create() -> IDirectory`

Crea el directorio y los padres aplicables, y devuelve la misma referencia. Ejemplo: `reports = await disk.directory("reports/2026").create()`. Local crea directorios físicos; cloud escribe marcadores de prefijo vacíos; memoria conserva entradas explícitas. Un archivo local que ocupe esa ruta puede provocar un error nativo del sistema de archivos.

<a id="directory-exists"></a>

### `async exists() -> bool`

Comprueba existencia según el backend. Ejemplo: `available = await reports.exists()`. Los prefijos cloud existen si contienen marcadores u objetos descendientes. Memoria/cloud informan que la raíz está presente; local comprueba su raíz física, que puede quedar ausente después de eliminarla.

<a id="directory-files"></a>

### `async files() -> list[IFile]`

Lista referencias de archivos hijos directos, ordenadas por ruta. Ejemplo: `names = [item.path() for item in await reports.files()]`. Excluye archivos anidados y marcadores cloud de directorio. Los resultados son objetos, no cadenas ni bytes de contenido.

Los listados locales también excluyen nombres terminados en `.tmp`, incluidos archivos creados por la aplicación con ese sufijo. El filtro se aplica asimismo a los listados recursivos; esos archivos se pueden acceder directamente mediante `file(path)`.

<a id="directory-allfiles"></a>

### `async allFiles() -> list[IFile]`

Lista referencias de archivos de todo el subárbol, ordenadas por ruta. Ejemplo: `keys = [item.path() for item in await reports.allFiles()]`. Materializa la lista completa: no existe parámetro público de paginación/cursor. Los errores de listado del backend se propagan.

<a id="directory-directories"></a>

### `async directories() -> list[IDirectory]`

Lista referencias de directorios hijos directos, ordenadas por ruta. Ejemplo: `folders = [item.path() for item in await reports.directories()]`. Los object stores los deducen de marcadores y prefijos de claves.

<a id="directory-alldirectories"></a>

### `async allDirectories() -> list[IDirectory]`

Lista referencias de directorios en todos los niveles descendientes, sin incluir el directorio consultado. Ejemplo: `folders = [item.path() for item in await reports.allDirectories()]`. Los drivers nativos devuelven listas vacías para árboles vacíos/inexistentes; los errores de autorización/conectividad no se suprimen.

```python
from orionis.support.facades import Storage


class ReportFolders:
    async def prepare(self) -> bool:
        reports = await Storage.disk("local").directory("reports/2026").create()
        return await reports.exists()

    async def inventory(self) -> dict[str, object]:
        reports = Storage.disk("local").directory("reports")
        return {
            "path": reports.path(),
            "files": [item.path() for item in await reports.files()],
            "all_files": [item.path() for item in await reports.allFiles()],
            "directories": [item.path() for item in await reports.directories()],
            "all_directories": [
                item.path() for item in await reports.allDirectories()
            ],
        }
```

Para `reports/summary.txt` y `reports/2026/annual.txt`, `files()` lista sólo el primero y `allFiles()` lista ambos. Las rutas devueltas siguen siendo relativas a la **raíz del disco**, no al directorio consultado.

<a id="directory-delete"></a>

### `async delete() -> bool`

Elimina recursivamente el directorio y sus descendientes. Ejemplo: `removed = await disk.directory("reports/obsolete").delete()`. Un destino ausente o prefijo cloud sin objetos devuelve `False`. Los fallos cloud pueden dejar trabajo parcial. No existe un parámetro de simulación ni otro para activar recursividad.

:::caution[La raíz es un destino válido]
`await disk.directory().delete()` apunta al disco completo. Local elimina su directorio raíz; memoria vacía el contenido y los directorios explícitos; cloud retira los objetos del ámbito de bucket/contenedor configurado y conserva el bucket/contenedor. No hay confirmación ni protección de raíz. Elimina un subárbol explícito y controlado por la aplicación al retirar un recurso de negocio.
:::

```python
from orionis.support.facades import Storage


class ReportCleanup:
    async def remove_obsolete(self) -> bool:
        obsolete = Storage.disk("local").directory("reports/obsolete")
        return await obsolete.delete()
```

## Manejar errores en la operación

`StoragePathException` identifica rutas lógicas rechazadas; `StorageFileNotFoundException`, archivos ausentes; `UnsupportedStorageOperationException`, capacidades, modos, niveles de visibilidad o algoritmos de hash no soportados cuando se validan. Todas heredan de `StorageException`.

Captura el fallo pertinente en vez de tratar `exists()` como una garantía. Los permisos del SO, las colisiones entre archivos/directorios y los fallos del SDK pueden conservar sus excepciones nativas. Un archivo almacenado y una fila de base de datos no comparten transacción: coordina su ciclo de vida en la aplicación.

Continúa con [configuración y drivers](/es/storage/disks-and-drivers), [streams y uploads](/es/storage/streaming-and-uploads) o la [introducción a Storage](/es/storage).
