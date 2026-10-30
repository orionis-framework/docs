---
title: "Storage technical reference"
description: "Storage contracts, constructors, helpers and exceptions."
editUrl: true
lastUpdated: false
---

This reference complements the guide examples; application code normally uses the `Storage` facade or `IStorageManager` rather than a driver directly.

## Public API

This reference covers contracts, driver implementations, configuration, the facade, constructors and asynchronous context protocols. Compatibility aliases are listed at the end.

| API | Practical reference |
| --- | --- |
| `Storage / IStorageManager / StorageManager` | [Facade and injection](/en/storage/manager-and-injection) |
| `Disk / IDisk; File / IFile; Directory / IDirectory; FileInfo; Visibility` | [Files and directories](/en/storage/files-and-directories) |
| `AsyncStream / IStorageStream; UploadedFile / IUploadedFile` | [Streams and uploads](/en/storage/streaming-and-uploads) |
| `Filesystems; Disks; Local; Public; S3; Azure; GCS; DiskName` | [Configuration](/en/storage/configuration) |
| `LocalStorageDriver; MemoryStorageDriver; S3StorageDriver; AzureStorageDriver; GoogleStorageDriver` | [Drivers](/en/storage/disks-and-drivers) |

<a id="driver-contract"></a>

## IStorageDriver

Low-level contract for driver integrations. Each method receives a root-relative path and returns the result in its signature; `File`, `Directory`, and `Disk` provide application references and normalize paths. The five native drivers implement all 24 methods below. Their `readStream` implementations are async generators and their `_CHUNK_SIZE` signature defaults equal `65536`. `open()` concretely returns `AsyncStream`, compatible with `IStorageStream`.

Examples show the high-level equivalent inside an async application method using `from orionis.support.facades import Storage`. `chunks` denotes an `AsyncIterable[bytes]` from the streaming example; `destination` is an application-controlled local path. Linked guides provide complete examples.

<a id="driver-read"></a>

### read

```text
async read(path: str) -> bytes
```

Reads the entire content as bytes; may raise StorageFileNotFoundException.

Application equivalent: `await Storage.disk().file("reports/42.txt").read()`.

<a id="driver-readstream"></a>

### readStream

```text
readStream(path: str, chunk_size: int=65536) -> AsyncIterator[bytes]
```

Produces chunks through an async iterator. Do not await the iterator itself. Chunk size is driver-specific; Azure uses SDK chunks.

Application equivalent: `Storage.disk().file("exports/data.bin").readStream(chunk_size=65536)`.

<a id="driver-write"></a>

### write

```text
async write(path: str, contents: bytes | str, visibility: str | None=None) -> None
```

Writes bytes or UTF-8 text, replacing content; returns None at driver level, unlike File.write, which returns IFile.

Application equivalent: `await Storage.disk().file("reports/42.txt").write("Report ready")`.

<a id="driver-writestream"></a>

### writeStream

```text
async writeStream(path: str, stream: AsyncIterable[bytes], visibility: str | None=None) -> None
```

Consumes AsyncIterable[bytes] and stores content. Memory, staging, and publication depend on the driver.

Application equivalent: `await Storage.disk().file("exports/data.bin").writeStream(chunks)`.

<a id="driver-delete"></a>

### delete

```text
async delete(path: str) -> bool
```

Deletes a file and returns whether it existed. Does not recursively delete directories.

Application equivalent: `await Storage.disk().file("reports/42.txt").delete()`.

<a id="driver-exists"></a>

### exists

```text
async exists(path: str) -> bool
```

Checks a file; the check is not atomic with a subsequent read.

Application equivalent: `await Storage.disk().file("reports/42.txt").exists()`.

<a id="driver-copy"></a>

### copy

```text
async copy(source: str, target: str) -> None
```

Copies between two paths on the same driver and returns None; the Disk layer returns IFile.

Application equivalent: `await Storage.disk().copy("reports/42.txt", "archive/42.txt")`.

<a id="driver-move"></a>

### move

```text
async move(source: str, target: str) -> None
```

Moves within the same driver. Cloud implementations may copy and delete without a global transaction.

Application equivalent: `await Storage.disk().move("reports/42.txt", "archive/42.txt")`.

<a id="driver-size"></a>

### size

```text
async size(path: str) -> int
```

Returns byte size; a missing file may raise StorageFileNotFoundException.

Application equivalent: `await Storage.disk().file("reports/42.txt").size()`.

<a id="driver-mimetype"></a>

### mimeType

```text
async mimeType(path: str) -> str | None
```

Obtains or guesses MIME according to the driver; may return None. Does not validate that content is safe or matches an extension.

Application equivalent: `await Storage.disk().file("reports/42.txt").mimeType()`.

<a id="driver-lastmodified"></a>

### lastModified

```text
async lastModified(path: str) -> datetime
```

Returns the timezone-aware UTC modification timestamp.

Application equivalent: `await Storage.disk().file("reports/42.txt").lastModified()`.

<a id="driver-createdirectory"></a>

### createDirectory

```text
async createDirectory(path: str) -> None
```

Creates a directory and parents; object storage may write a prefix marker.

Application equivalent: `await Storage.disk().directory("reports").create()`.

<a id="driver-deletedirectory"></a>

### deleteDirectory

```text
async deleteDirectory(path: str) -> bool
```

Deletes recursively and returns whether it existed. An empty path denotes the root.

Application equivalent: `await Storage.disk().directory("reports").delete()`.

<a id="driver-directoryexists"></a>

### directoryExists

```text
async directoryExists(path: str) -> bool
```

Checks a directory path; cloud storage may infer it from objects under a prefix.

Application equivalent: `await Storage.disk().directory("reports").exists()`.

<a id="driver-files"></a>

### files

```text
async files(path: str='', *, recursive: bool=False) -> list[str]
```

Returns sorted file paths. recursive is keyword-only; results are materialized as a list.

Application equivalent: `await Storage.disk().directory("reports").files()`.

<a id="driver-directories"></a>

### directories

```text
async directories(path: str='', *, recursive: bool=False) -> list[str]
```

Returns sorted direct or recursive directories according to recursive.

Application equivalent: `await Storage.disk().directory("reports").directories()`.

<a id="driver-url"></a>

### url

```text
async url(path: str) -> str
```

Builds the file URL without granting access. May raise UnsupportedStorageOperationException when URLs are unavailable.

Application equivalent: `await Storage.disk("public").file("images/logo.png").url()`.

<a id="driver-temporaryurl"></a>

### temporaryUrl

```text
async temporaryUrl(path: str, expires_in: int) -> str
```

Generates a signed URL for expires_in seconds. Local and Memory reject it; cloud SDKs need signing capability.

Application equivalent: `await Storage.disk("s3").file("reports/42.txt").temporaryUrl(300)`.

<a id="driver-visibility"></a>

### visibility

```text
async visibility(path: str) -> str
```

Returns public/private according to the medium; Azure reports container-level access.

Application equivalent: `await Storage.disk().file("reports/42.txt").visibility()`.

<a id="driver-setvisibility"></a>

### setVisibility

```text
async setVisibility(path: str, visibility: str) -> None
```

Changes visibility where supported; Azure rejects per-file changes. May raise UnsupportedStorageOperationException.

Application equivalent: `await Storage.disk().file("reports/42.txt").setVisibility("private")`.

<a id="driver-download"></a>

### download

```text
async download(path: str, destination: str | Path) -> Path
```

Copies to a physical server location and returns Path. Does not create an HTTP response or restrict the destination to the disk root.

Application equivalent: `await file.download(destination)`.

<a id="driver-hash"></a>

### hash

```text
async hash(path: str, algorithm: str='sha256') -> str
```

Computes a hexadecimal hashlib digest. An unsupported algorithm raises UnsupportedStorageOperationException; algorithms requiring a length, such as SHAKE, may raise TypeError when finalizing. This differs from FileInfo.checksum or etag.

Application equivalent: `await Storage.disk().file("reports/42.txt").hash("sha256")`.

<a id="driver-info"></a>

### info

```text
async info(path: str) -> FileInfo
```

Returns a FileInfo snapshot. Checksums, ETag, timestamps, and URL depend on the driver; see the file guide metadata table.

Application equivalent: `await Storage.disk().file("reports/42.txt").info()`.

<a id="driver-open"></a>

### open

```text
open(path: str, mode: str='rb') -> IStorageStream
```

Returns a lazy binary IStorageStream; use async with. It is neither a transaction nor a public temporary-file generator.

Application equivalent: `Storage.disk().file("reports/42.txt").open("rb")`.

## Driver constructors

They are not services to inject without configuration. The manager builds them from a disk; these constructors support extensions and isolated tests.

| Constructor | Arguments |
| --- | --- |
| `LocalStorageDriver(root: Path, base_url: str \| None = None)` | Physical root; optional URL. The manager anchors relative roots to app.basePath. |
| `MemoryStorageDriver(base_url: str \| None = None)` | Optional URL; per-instance RAM data. |
| `S3StorageDriver(config: object)` | S3 entity; fields in configuration. |
| `AzureStorageDriver(config: object)` | Azure entity; fields in configuration. |
| `GoogleStorageDriver(config: object)` | GCS entity; fields in configuration. |

<a id="provider"></a>

## StorageProvider

Native deferred provider included in core providers. `provides() -> list[type]` returns `[IStorageManager]`; `register() -> None` registers the singleton; `async boot() -> None` runs `await StorageFacade.pin()`. It inherits `ServiceProvider(app)` construction. Do not register it again just to use Storage.

<a id="facade-accessor"></a>

### Storage.getFacadeAccessor() → type

This classmethod returns `IStorageManager` to the facade mechanism. It does not select a disk or perform I/O; use `Storage.disk()` or injection for application operations.

<a id="exceptions"></a>

## Exceptions and errors

| Exception | When it occurs |
| --- | --- |
| `StorageException` | Base of the six specific Storage exceptions. |
| `DiskNotFoundException` | Disk absent from resolved configuration. |
| `DriverNotSupportedException` | Driver name without a native or extended implementation. |
| `MissingStorageDependencyException` | An optional SDK import is unavailable; includes installation instructions. |
| `StoragePathException` | Malformed path, empty file path, or logical root traversal. |
| `StorageFileNotFoundException` | An operation needs a missing file. |
| `UnsupportedStorageOperationException` | Mode, visibility, or operation unsupported by the backend. |

Not every I/O exception becomes `StorageException`: OS/permission errors and SDK errors can propagate too. Catch conditions you can handle; do not interpret every cloud error as a missing file.

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

## Integration helpers

Ordinary facade use does not need them. They live in `orionis.storage.drivers.functions` and support driver implementations. The public normalizers `normalize_path(path: str) -> str` and `normalize_file_path(path: str) -> str` are explained in the file guide.

<a id="helper-import-driver-dependency"></a>

### import_driver_dependency

```text
import_driver_dependency(module: str, package: str, extra: str) -> ModuleType
```

Lazily imports the module; converts ImportError into MissingStorageDependencyException with installation instructions.

<a id="helper-assert-binary-mode"></a>

### assert_binary_mode

```text
assert_binary_mode(mode: str) -> None
```

Accepts rb, wb, ab, rb+, wb+, ab+; other modes raise UnsupportedStorageOperationException.

<a id="helper-resolve-download-target"></a>

### resolve_download_target

```text
resolve_download_target(normalized: str, destination: str | Path) -> Path
```

If destination is an existing directory, appends the file name; creates parents and returns Path without requiring an absolute path or creating the content file.

<a id="helper-filter-files"></a>

### filter_files

```text
filter_files(keys: Iterable[str], base: str, *, recursive: bool) -> list[str]
```

Filters keys under base, excludes markers ending in /, and sorts file paths.

<a id="helper-derive-directories"></a>

### derive_directories

```text
derive_directories(keys: Iterable[str], base: str, *, recursive: bool) -> list[str]
```

Derives directory prefixes, deduplicates, optionally filters direct children, and sorts.

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

The modules retain compatibility aliases: `normalizePath`, `normalizeFilePath`, `importDriverDependency`, `assertBinaryMode`, `resolveDownloadTarget`, `filterFiles`, and `deriveDirectories`. They point to the corresponding snake_case functions; new examples use canonical names.

Since 1.1.0, `IStorageStream.chunks(size=65536, *, buffer_size=1048576)` returns an async byte iterator. See [buffered handle iteration](/en/storage/streaming-and-uploads#stream-chunks) for validation, ownership and native read budgets.
