---
title: "Referencia técnica de Storage"
description: "Contratos, constructores, helpers, excepciones e inventario verificable de Storage."
editUrl: true
lastUpdated: false
---

Esta referencia complementa los ejemplos de las guías; la aplicación utiliza normalmente la fachada `Storage` o `IStorageManager`, no el driver directamente.

## Superficie pública e inventario

El [inventario descargable](/downloads/storage-api-inventory.json) registra las declaraciones propias públicas del módulo, sus contratos, implementaciones de drivers, configuración y fachada. Incluye firmas extraídas del AST, archivo, línea, hash de fuente y destino documental sin prefijo de idioma. Los contratos y overrides se cuentan separadamente: no representan funcionalidades distintas.

Se incluyen constructores y protocolos de contexto asíncrono. Se excluyen implementación privada, resolución interna de exports y métodos heredados de otros módulos; los métodos generados por dataclasses se explican mediante sus campos, sin contarlos como declaraciones fuente. Los aliases de compatibilidad se enumeran al final de esta referencia. El inventario no afirma haber probado todas las combinaciones contra servicios cloud externos.

| API | Referencia práctica |
| --- | --- |
| `Storage / IStorageManager / StorageManager` | [Fachada e inyección](/es/services/storage/manager-and-injection) |
| `Disk / IDisk; File / IFile; Directory / IDirectory; FileInfo; Visibility` | [Archivos y directorios](/es/services/storage/files-and-directories) |
| `AsyncStream / IStorageStream; UploadedFile / IUploadedFile` | [Streams y uploads](/es/services/storage/streaming-and-uploads) |
| `Filesystems; Disks; Local; Public; S3; Azure; GCS; DiskName` | [Configuración](/es/services/storage/configuration) |
| `LocalStorageDriver; MemoryStorageDriver; S3StorageDriver; AzureStorageDriver; GoogleStorageDriver` | [Drivers](/es/services/storage/disks-and-drivers) |

<a id="driver-contract"></a>

## IStorageDriver

Contrato de bajo nivel para integrar drivers. Cada método recibe una ruta relativa a la raíz y devuelve el resultado indicado en su firma; `File`, `Directory` y `Disk` ofrecen las referencias de aplicación y normalizan sus rutas. Los cinco drivers nativos implementan los 24 métodos siguientes. Sus `readStream` son generadores async y los defaults `_CHUNK_SIZE` de sus firmas equivalen a `65536`. `open()` devuelve concretamente `AsyncStream`, compatible con `IStorageStream`.

Las expresiones de ejemplo muestran el equivalente de alto nivel en un método async de la aplicación, con `from orionis.support.facades import Storage`. `chunks` representa un `AsyncIterable[bytes]` del ejemplo de streaming; `destination` es una ruta local controlada por la aplicación. Los casos completos están en las guías enlazadas.

<a id="driver-read"></a>

### read

```text
async read(path: str) -> bytes
```

Lee el contenido completo; devuelve bytes y puede lanzar StorageFileNotFoundException.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").read()`.

<a id="driver-readstream"></a>

### readStream

```text
readStream(path: str, chunk_size: int=65536) -> AsyncIterator[bytes]
```

Produce bloques mediante un iterador async. No se espera el iterador con await. El tamaño lo aplica el driver; Azure utiliza los bloques del SDK.

Equivalente de aplicación: `Storage.disk().file("exports/data.bin").readStream(chunk_size=65536)`.

<a id="driver-write"></a>

### write

```text
async write(path: str, contents: bytes | str, visibility: str | None=None) -> None
```

Escribe bytes o texto UTF-8, reemplazando contenido; retorna None en el driver, a diferencia de File.write, que devuelve IFile.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").write("Report ready")`.

<a id="driver-writestream"></a>

### writeStream

```text
async writeStream(path: str, stream: AsyncIterable[bytes], visibility: str | None=None) -> None
```

Consume AsyncIterable[bytes] y guarda contenido. La memoria, el staging y la publicación dependen del driver.

Equivalente de aplicación: `await Storage.disk().file("exports/data.bin").writeStream(chunks)`.

<a id="driver-delete"></a>

### delete

```text
async delete(path: str) -> bool
```

Elimina un archivo y devuelve si existía. No elimina directorios recursivamente.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").delete()`.

<a id="driver-exists"></a>

### exists

```text
async exists(path: str) -> bool
```

Comprueba un archivo; no es una operación atómica con una lectura posterior.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").exists()`.

<a id="driver-copy"></a>

### copy

```text
async copy(source: str, target: str) -> None
```

Copia entre dos rutas del mismo driver y devuelve None; la capa Disk devuelve IFile.

Equivalente de aplicación: `await Storage.disk().copy("reports/42.txt", "archive/42.txt")`.

<a id="driver-move"></a>

### move

```text
async move(source: str, target: str) -> None
```

Mueve dentro del mismo driver. En cloud puede implementar copia y borrado, sin transacción global.

Equivalente de aplicación: `await Storage.disk().move("reports/42.txt", "archive/42.txt")`.

<a id="driver-size"></a>

### size

```text
async size(path: str) -> int
```

Consulta tamaño en bytes; un archivo ausente puede producir StorageFileNotFoundException.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").size()`.

<a id="driver-mimetype"></a>

### mimeType

```text
async mimeType(path: str) -> str | None
```

Obtiene o infiere MIME según el driver; puede ser None. No valida por sí mismo que el contenido sea seguro ni coincida con una extensión.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").mimeType()`.

<a id="driver-lastmodified"></a>

### lastModified

```text
async lastModified(path: str) -> datetime
```

Obtiene la fecha de modificación consciente de zona horaria UTC.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").lastModified()`.

<a id="driver-createdirectory"></a>

### createDirectory

```text
async createDirectory(path: str) -> None
```

Crea un directorio y padres; en object storage puede escribir un marcador de prefijo.

Equivalente de aplicación: `await Storage.disk().directory("reports").create()`.

<a id="driver-deletedirectory"></a>

### deleteDirectory

```text
async deleteDirectory(path: str) -> bool
```

Elimina recursivamente y devuelve si existía. La ruta vacía representa la raíz.

Equivalente de aplicación: `await Storage.disk().directory("reports").delete()`.

<a id="driver-directoryexists"></a>

### directoryExists

```text
async directoryExists(path: str) -> bool
```

Comprueba una ruta de directorio; en cloud puede deducirse de objetos bajo un prefijo.

Equivalente de aplicación: `await Storage.disk().directory("reports").exists()`.

<a id="driver-files"></a>

### files

```text
async files(path: str='', *, recursive: bool=False) -> list[str]
```

Devuelve rutas de archivos ordenadas. recursive es keyword-only; el listado se materializa como una lista.

Equivalente de aplicación: `await Storage.disk().directory("reports").files()`.

<a id="driver-directories"></a>

### directories

```text
async directories(path: str='', *, recursive: bool=False) -> list[str]
```

Devuelve directorios ordenados, directos o recursivos, según recursive.

Equivalente de aplicación: `await Storage.disk().directory("reports").directories()`.

<a id="driver-url"></a>

### url

```text
async url(path: str) -> str
```

Construye la URL del archivo; no concede permisos. Sin URL disponible puede lanzar UnsupportedStorageOperationException.

Equivalente de aplicación: `await Storage.disk("public").file("images/logo.png").url()`.

<a id="driver-temporaryurl"></a>

### temporaryUrl

```text
async temporaryUrl(path: str, expires_in: int) -> str
```

Genera una URL firmada durante expires_in segundos. Local y Memory rechazan la operación; los SDK cloud necesitan capacidad de firma.

Equivalente de aplicación: `await Storage.disk("s3").file("reports/42.txt").temporaryUrl(300)`.

<a id="driver-visibility"></a>

### visibility

```text
async visibility(path: str) -> str
```

Consulta public/private según el medio; en Azure el valor describe el contenedor.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").visibility()`.

<a id="driver-setvisibility"></a>

### setVisibility

```text
async setVisibility(path: str, visibility: str) -> None
```

Cambia visibilidad donde se soporte; Azure rechaza cambios por archivo. Puede lanzar UnsupportedStorageOperationException.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").setVisibility("private")`.

<a id="driver-download"></a>

### download

```text
async download(path: str, destination: str | Path) -> Path
```

Copia a una ubicación física del servidor y devuelve Path. No genera una respuesta HTTP ni limita el destino a la raíz del disco.

Equivalente de aplicación: `await file.download(destination)`.

<a id="driver-hash"></a>

### hash

```text
async hash(path: str, algorithm: str='sha256') -> str
```

Calcula un digest hexadecimal con hashlib. Un algoritmo no admitido genera UnsupportedStorageOperationException; algoritmos que exigen una longitud, como SHAKE, pueden producir TypeError al finalizar. No confundas este método con FileInfo.checksum o etag.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").hash("sha256")`.

<a id="driver-info"></a>

### info

```text
async info(path: str) -> FileInfo
```

Devuelve un snapshot FileInfo. Sus checksums, ETag, timestamps y URL dependen del driver; consulta la tabla de metadatos de la guía de archivos.

Equivalente de aplicación: `await Storage.disk().file("reports/42.txt").info()`.

<a id="driver-open"></a>

### open

```text
open(path: str, mode: str='rb') -> IStorageStream
```

Devuelve un IStorageStream lazy y binario; úsalo con async with. No es una transacción ni un generador de archivos temporales públicos.

Equivalente de aplicación: `Storage.disk().file("reports/42.txt").open("rb")`.

## Constructores de drivers

No son servicios para inyectar sin configuración. El manager los construye desde el disco; estos constructores son útiles para extensiones y pruebas aisladas.

| Constructor | Argumentos |
| --- | --- |
| `LocalStorageDriver(root: Path, base_url: str \| None = None)` | Raíz física; URL opcional. La raíz relativa del manager se ancla a app.basePath. |
| `MemoryStorageDriver(base_url: str \| None = None)` | URL opcional; datos por instancia en RAM. |
| `S3StorageDriver(config: object)` | Entidad S3; campos en configuración. |
| `AzureStorageDriver(config: object)` | Entidad Azure; campos en configuración. |
| `GoogleStorageDriver(config: object)` | Entidad GCS; campos en configuración. |

<a id="provider"></a>

## StorageProvider

Provider nativo diferido, incluido en los core providers. `provides() -> list[type]` devuelve `[IStorageManager]`; `register() -> None` registra el singleton; `async boot() -> None` ejecuta `await StorageFacade.pin()`. Hereda el constructor de `ServiceProvider(app)`. No lo registres de nuevo para utilizar Storage.

<a id="facade-accessor"></a>

### Storage.getFacadeAccessor() → type

Es el classmethod que devuelve `IStorageManager` al mecanismo de fachadas. No selecciona un disco ni realiza E/S; utiliza `Storage.disk()` o la inyección para operaciones de aplicación.

<a id="exceptions"></a>

## Excepciones y errores

| Excepción | Cuándo aparece |
| --- | --- |
| `StorageException` | Base de las seis excepciones específicas de Storage. |
| `DiskNotFoundException` | Disco ausente en la configuración resuelta. |
| `DriverNotSupportedException` | Nombre de driver sin implementación nativa ni extend. |
| `MissingStorageDependencyException` | Importación de un SDK opcional no disponible; incluye comando de instalación. |
| `StoragePathException` | Ruta mal formada, ruta de archivo vacía o escape lógico de raíz. |
| `StorageFileNotFoundException` | Una operación necesita un archivo ausente. |
| `UnsupportedStorageOperationException` | Modo, visibilidad u operación que el backend no admite. |

No todas las excepciones de E/S se convierten a `StorageException`: también pueden propagarse errores de permisos/OS y errores de los SDK. Captura la condición que sabes manejar; no interpretes cualquier error cloud como «archivo ausente».

```python
from orionis.http import JSONResponse
from orionis.storage.exceptions import StorageFileNotFoundException
from orionis.support.facades import Storage


class ReadReportController:
    async def __call__(self, report_id: int) -> JSONResponse:
        file = Storage.disk("local").file(f"reports/{report_id}.txt")
        try:
            content = await file.read()
        except StorageFileNotFoundException:
            return JSONResponse({"error": "Report not found"}, status_code=404)
        return JSONResponse({"content": content.decode("utf-8")})
```

## Helpers de integración

No se necesitan en el uso habitual de la fachada. Viven en `orionis.storage.drivers.functions` y ayudan a implementar drivers. Los normalizadores públicos `normalize_path(path: str) -> str` y `normalize_file_path(path: str) -> str` se explican en la guía de archivos.

<a id="helper-import-driver-dependency"></a>

### import_driver_dependency

```text
import_driver_dependency(module: str, package: str, extra: str) -> ModuleType
```

Importa perezosamente el módulo; convierte ImportError en MissingStorageDependencyException con instrucciones.

<a id="helper-assert-binary-mode"></a>

### assert_binary_mode

```text
assert_binary_mode(mode: str) -> None
```

Acepta rb, wb, ab, rb+, wb+, ab+; otros modos generan UnsupportedStorageOperationException.

<a id="helper-resolve-download-target"></a>

### resolve_download_target

```text
resolve_download_target(normalized: str, destination: str | Path) -> Path
```

Si destination es un directorio existente, agrega el nombre del archivo; crea padres y devuelve Path, sin exigir que sea absoluto ni crear el archivo de contenido.

<a id="helper-filter-files"></a>

### filter_files

```text
filter_files(keys: Iterable[str], base: str, *, recursive: bool) -> list[str]
```

Filtra claves bajo base, excluye marcadores terminados en / y ordena los archivos.

<a id="helper-derive-directories"></a>

### derive_directories

```text
derive_directories(keys: Iterable[str], base: str, *, recursive: bool) -> list[str]
```

Deriva prefijos de directorio, elimina duplicados, filtra hijos directos si corresponde y ordena.

```python
from orionis.storage.drivers.functions import (
    assert_binary_mode, derive_directories, filter_files,
)

assert_binary_mode("rb+")
keys = ["reports/", "reports/42.txt", "reports/year/summary.txt"]
assert filter_files(keys, "reports", recursive=False) == ["reports/42.txt"]
assert derive_directories(keys, "reports", recursive=True) == ["reports/year"]
```

```python
from pathlib import Path
from tempfile import TemporaryDirectory
from orionis.storage.drivers.functions import resolve_download_target

with TemporaryDirectory() as workspace:
    target = resolve_download_target("reports/42.txt", Path(workspace))
    assert target.name == "42.txt"
    assert target.parent.is_dir()
    assert not target.exists()
```

```python
from orionis.storage.drivers.functions import import_driver_dependency
from orionis.storage.exceptions import MissingStorageDependencyException

try:
    sdk = import_driver_dependency("boto3", "boto3", "s3")
except MissingStorageDependencyException as error:
    installation_hint = str(error)
```

Los módulos conservan aliases de compatibilidad: `normalizePath`, `normalizeFilePath`, `importDriverDependency`, `assertBinaryMode`, `resolveDownloadTarget`, `filterFiles` y `deriveDirectories`. Apuntan a las funciones snake_case correspondientes; los ejemplos nuevos utilizan sus nombres canónicos.
