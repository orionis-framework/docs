---
title: "Streaming content and saving uploads"
description: "Read and write chunks, use AsyncStream, and persist multipart uploads from controllers and services."
editUrl: true
lastUpdated: false
---

Storage provides two ways to process content progressively: chunk iterators with `readStream()`/`writeStream()` and a binary handle with `open()`. For files received over HTTP, `Storage.uploaded()` adapts the multipart payload and saves it through the same file API.

These examples run inside a booted application with the `local` disk configured. Import the facade with `from orionis.support.facades import Storage`. For another disk or manager injection, see [configuration](/en/storage/configuration) and [manager and injection](/en/storage/manager-and-injection).

<a id="stream-file-operations"></a>
## Choose how to process content

| `IFile` operation | Result and purpose |
| --- | --- |
| `async read() -> bytes` | Loads the complete file into memory. |
| `async write(contents: bytes \| str, visibility: str \| None = None) -> IFile` | Replaces content; strings use UTF-8. Returns the same file. |
| `readStream(chunk_size: int = 65536) -> AsyncIterator[bytes]` | Returns an iterator consumed with `async for`; do not await its construction. |
| `async writeStream(stream: AsyncIterable[bytes], visibility: str \| None = None) -> IFile` | Consumes an asynchronous producer of binary chunks and returns the same file on completion. |
| `open(mode: str = "rb") -> IStorageStream` | Constructs a lazy handle with asynchronous operations and context management. |

`visibility=None` delegates to the backend: local retains operating-system behavior, memory keeps existing visibility or creates with `private`, S3/GCS use remote configuration, and Azure does not apply per-blob visibility. The usual explicit values are `"private"` and `"public"`; support depends on the [driver](/en/storage/disks-and-drivers).

### Generate and download a file from a controller

Save this controller in `app/http/controllers/report_controller.py`. Its producer yields one row at a time; `writeStream()` awaits each write before requesting the next. The download passes the iterator to `StreamingResponse` without gathering all chunks into a list.

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

Register the actions in a route file loaded by your application, such as `routes/api.py`:

```python
from app.http.controllers.report_controller import ReportController
from orionis.support.facades import Route

Route.post("/reports/stock", [ReportController, "create"])
Route.get("/reports/stock", [ReportController, "download"])
```

First send `POST /reports/stock`, then download with `GET /reports/stock`. Checking `exists()` allows a 404 response before transmission starts, although another process could still remove the file between those operations. An error after headers have been sent cannot become a new JSON response.

### Read only part of a file and release the iterator

Use a positive integer `chunk_size`. Drivers do not share uniform validation for nonpositive sizes. If you stop before exhausting a reader, explicitly close the generator with `aclosing()`; `break` does not replace closure.

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

Native local, S3, and GCS iterators release their handle in `finally`. Azure uses the SDK chunk iterator; it does not add a Storage handle or explicitly close the downloader. Memory traverses content already held by the process.

## AsyncStream reference

`open()` returns the `IStorageStream` contract; native implementations use `AsyncStream`, exported by `orionis.storage`. Do not write `await file.open(...)`: enter with `async with file.open(...) as stream`.

<a id="stream-construction"></a>
### Lazy construction

```text
AsyncStream(
    opener: Callable[[], BinaryIO],
    on_close: Callable[[BinaryIO], None] | None = None,
) -> None
```

This is the constructor signature for custom adapters. Drivers supply both functions; normally you obtain the object through `file.open()`. Construction does not open a handle. The first operation or `__aenter__()` runs `opener` on a worker thread and retains the handle for subsequent operations. An optional `on_close` is also a synchronous function run on a worker thread.

<a id="stream-read"></a>
### read(size: int = -1) -> bytes

`await stream.read(size)` reads from the current position. `-1` reads through EOF; `b""` means no data remains. Unlike `UploadedFile.read()`, it does not rewind automatically.

<a id="stream-write"></a>
### write(data: bytes) -> int

`await stream.write(data)` writes bytes and returns the count reported by the underlying handle. It does not encode strings: use `text.encode("utf-8")`. Writing is not equivalent to publishing a remote object; memory and cloud save their buffer on close.

<a id="stream-seek"></a>
### seek(offset: int, whence: int = 0) -> int

`await stream.seek(offset, whence)` returns the resulting absolute position. `whence=0` anchors at the beginning, `1` at the current position, and `2` at the end. Offsets must be valid for the binary handle. This contract has no public `tell()`, `truncate()`, or `flush()` methods.

<a id="stream-close"></a>
### close() -> None

`await stream.close()` detaches the handle, runs `on_close`, then closes the handle. Closing an unopened stream or closing it twice in succession does nothing. Reading/writing again can lazily open another handle: do not treat a closed stream as having terminal state, especially with `wb`, which would truncate the local file again.

If the callback fails, its exception propagates and the subsequent `handle.close()` call is not reached. The contract provides no rollback mechanism and does not guarantee immediate buffer release on that failure. See [contexts, errors, and cancellation](/en/storage/temporary-files-and-contexts).

<a id="stream-context"></a>
### Asynchronous context

The signatures are `async __aenter__() -> IStorageStream` and `async __aexit__(exc_type: type[BaseException] | None, exc: BaseException | None, traceback: TracebackType | None) -> None`. Entry opens the handle; exit calls `close()` even if the block raises. It does not suppress the block exception or use its arguments to discard writes.

This service uses `write`, all three `seek` anchors, `read`, and automatic closure. Invoke it from an asynchronous application action or service:

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

### Binary modes

| Mode | Initial content and position | Purpose |
| --- | --- | --- |
| `rb` | Existing file; initial position 0. | Read. |
| `wb` | Empty content; initial position 0. | Replace or create. |
| `ab` | Existing content when present; initial position at the end. | Append or create. |
| `rb+` | Existing file; initial position 0. | Read and modify. |
| `wb+` | Empty content; initial position 0. | Create/replace and read the result. |
| `ab+` | Existing content when present; initial position at the end. | Append and read after seeking. |

Text modes, `r+b`, `w+b`, `a+b`, `x`, and other values outside this table raise `UnsupportedStorageOperationException`. Use `rb+`, `wb+`, and `ab+` in precisely that order.

Local opens the actual file and enforces the mode's access permissions. Memory uses `BytesIO` and cloud uses a temporary binary buffer: these do not enforce the same read/write restrictions as a local file. The mode controls buffer initialization and persistence; use only the operations intended for that mode to remain portable. Do not rewind an append stream to overwrite: local forces writes to the end, whereas remote buffers let you reposition before their later complete upload.

## Persist files received over HTTP

Two types share the same name:

- `orionis.http.payload.uploaded_file.UploadedFile`: the multipart payload with metadata and synchronous buffer operations.
- `orionis.storage.UploadedFile`: the asynchronous adapter referencing that payload and persisting it on a disk.

<a id="upload-construction"></a>
### Obtain the adapter with Storage.uploaded()

The manager signature is `uploaded(source: IHttpUploadedFile) -> IUploadedFile`. The concrete constructor is `UploadedFile(source: IHttpUploadedFile, manager: IStorageManager) -> None`. Use `Storage.uploaded(source)` to attach it to the configured manager; construction does not copy or save content, and does not change ownership of the HTTP buffer.

This controller accepts a multipart field named `document`. It rejects empty files or files larger than 2 MiB before persistence and returns a logical path:

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

Save it in `app/http/controllers/document_controller.py` and register `Route.post("/documents", [DocumentController, "store"])` after importing the controller and the `Route` facade. A client can send `curl -F "document=@report.pdf" http://localhost:8000/documents` if that is the address printed by your server.

The controller check happens after multipart parsing; parser limits protect reception before this action runs. For file, MIME, image, and other content rules, use the original HTTP payload with [schemas](/en/validation), alongside appropriate route authorization. The client-supplied extension and declared MIME type do not prove the actual format.

### Metadata and storage name

<a id="upload-originalname"></a>
`originalName() -> str` returns the client name sanitized by HTTP: directory components, forbidden characters, and leading dots are removed. An empty result becomes `"upload"`. Retain it as display metadata when needed.

<a id="upload-extension"></a>
`extension() -> str` returns the lowercase suffix including its dot (`".pdf"`), or `""` when absent.

<a id="upload-size"></a>
`size() -> int` returns payload bytes; it does not query the destination file.

<a id="upload-mimetype"></a>
`mimeType() -> str | None` returns the client-declared `Content-Type`, which may be absent.

<a id="upload-hashname"></a>
`hashName() -> str` generates `secrets.token_hex(20) + extension()`: 40 hexadecimal characters plus the suffix. It is computed once per adapter. Adapting the same payload again creates another adapter with an independent random name. It does not reserve the path or guarantee an exclusive write.

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

`await upload.read()` runs the HTTP payload's `read()` on a worker thread. That payload rewinds and returns the **complete** file, including after a partial read. Use it for sufficiently small content; persistence does not require materializing the file first.

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

`await upload.store(...)` uses `hashName()`. `directory=""` writes to the logical root; `disk=None` selects the default disk. It returns an `IFile`, not a path or boolean. Obtain its path with `stored.path()` and continue with its [API](/en/storage/api-reference). The controller above demonstrates an explicit disk and visibility.

<a id="upload-storeas"></a>
### storeAs(directory: str, name: str, disk: str | None = None, visibility: str | None = None) -> IFile

Use an application-selected name, for example when replacing an identified document. `directory` and `name` are required, although the directory may be `""`. An empty name or one containing `/` or `\\` raises `StoragePathException`; the resulting path also passes Storage validation. Directories belong in `directory`, not `name`.

```python
from orionis.http.payload.uploaded_file import UploadedFile as HttpUploadedFile
from orionis.support.facades import Storage


async def replace_approved_document(source: HttpUploadedFile, document_id: int) -> str:
    stored = await Storage.uploaded(source).storeAs(
        "approved", f"document-{document_id}.pdf", disk="local", visibility="private",
    )
    return stored.path()
```

This example assumes that you already validated the content as PDF and authorized replacing that document. `storeAs()` does not convert formats or prevent overwriting an existing destination.

<a id="upload-copy"></a>
### copy(directory: str, name: str | None = None, disk: str | None = None) -> IFile

Persists another copy while retaining the open payload. `name=None` or `name=""` uses `hashName()`. It has no `visibility` argument; use `store()` or `storeAs()` to supply one.

<a id="upload-move"></a>
### move(directory: str, name: str | None = None, disk: str | None = None) -> IFile

First executes `storeAs()` and closes the payload on a worker thread **only after** successful persistence. It saves content then closes the buffer; it does not rename a local source file. A failed save does not reach source closure. If closing fails, the write may already have completed and the exception propagates. It has no `visibility` argument.

This service first keeps a received copy, then saves a second copy while closing the source. Both explicit names are known to the application:

```python
from orionis.http.payload.uploaded_file import UploadedFile as HttpUploadedFile
from orionis.support.facades import Storage


async def archive_then_release(source: HttpUploadedFile, document_id: int) -> dict[str, str]:
    upload = Storage.uploaded(source)
    received = await upload.copy("received", f"document-{document_id}.pdf", disk="local")
    archived = await upload.move("archived", f"document-{document_id}.pdf", disk="local")
    return {"received": received.path(), "archived": archived.path()}
```

After `move()`, do not read or save that payload again, even through another adapter referencing the same source. Persisted copies remain available. The two writes are independent: if the second fails, the first remains.

### The same operation with injection

The container provides `IStorageManager`. This service uses the same manager as the facade; it does not need to construct it or configure another provider:

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

Inject `DocumentStorage` into a controller constructor or action. For the container flow, see [manager and injection](/en/storage/manager-and-injection).

<a id="stream-driver-behavior"></a>
## Memory, publication, and errors

The upload adapter's `writeStream()` consumes `source.chunks()` in 64 KiB chunks, advancing the synchronous iterator on a worker thread. The parser already received and buffered the source: saving an upload does not directly relay socket bytes to cloud storage.

| Backend | Reading with `readStream()` | Writing with `writeStream()` and using `open()` |
| --- | --- | --- |
| Local | Chunked file reads; closure in `finally`. | `writeStream()` stages a `.tmp` and replaces on completion. `open()` accesses the destination directly. |
| Memory | Slices a stored `bytes` value. | Accumulates all chunks; `open()` uses `BytesIO` and persists on close. |
| S3 | Reads the remote `Body` in chunks. | Complete spool before `upload_fileobj`; `open()` downloads for reading/appending and uploads again when writable modes close. |
| Azure | SDK-selected chunks; `chunk_size` is ignored. | Complete spool before `upload_blob(overwrite=True)`; `open()` also uses a complete spool. |
| GCS | Reads through the `blob.open("rb")` handle. | Complete spool before `upload_from_file`; `open()` also uses a complete spool. |

Cloud buffers spill to disk above 8 MiB; this is not a maximum file size or a constant-memory guarantee for the entire process/SDK. Continue with [temporary files and contexts](/en/storage/temporary-files-and-contexts) for lifetime, cancellation, and cleanup.

An invalid path raises `StoragePathException`; an unknown disk raises `DiskNotFoundException`; an unsupported opening mode raises `UnsupportedStorageOperationException`. A missing file can raise `StorageFileNotFoundException` when reading begins, rather than when constructing the iterator/handle. Optional SDKs can raise `MissingStorageDependencyException`; other operating-system, SDK, network, producer, or closed-buffer errors propagate. The adapter does not turn them into `False` or coordinate database rollback.

`store()`, `storeAs()`, and `copy()` retain the open source. The HTTP kernel closes uploads after response delivery finishes; do not retain a payload for a task detached from its request. Save the file first and give that task its disk and logical path. See [Request and payloads](/en/http/requests) for parsing, and [temporary files and contexts](/en/storage/temporary-files-and-contexts) for the complete lifecycle.
