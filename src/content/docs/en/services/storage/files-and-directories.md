---
title: "Saving files and listing directories"
description: "Practical reference for Disk, File and Directory: content, paths, listings, metadata, visibility and URLs."
editUrl: true
lastUpdated: false
---

Use `Storage` to obtain a configured disk, then work with its file and directory objects. Paths are relative to that disk, so application code can use local storage, memory or a cloud backend.

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

Examples run inside a booted Orionis application. `local` must be configured; `Storage.disk()` selects the default. Always import the facade with `from orionis.support.facades import Storage`. See [disk configuration](/en/services/storage/disks-and-drivers) for backend selection.

`disk()`, `name()`, `file()`, `directory()` and `path()` are synchronous. Storage operations use `await`; `readStream()` returns an asynchronous iterator and `open()` an asynchronous context manager. Do not await those two factories themselves.

## References and paths

| Object | Responsibility | Contract |
| --- | --- | --- |
| `Disk` | Named backend and factories for files/directories. | `IDisk` |
| `File` | Operations on one normalized, nonempty file path. | `IFile` |
| `Directory` | Operations on a directory or the disk root. | `IDirectory` |

The contracts are exported from `orionis.storage.contracts`. Creating a reference does not create or check its target. References keep their path and driver; they do not cache contents or metadata.

<a id="path-normalization"></a>

### Path normalization

`normalize_path(path: str) -> str` and `normalize_file_path(path: str) -> str`, from `orionis.storage.paths`, implement the rules applied by object factories:

- Convert backslashes to `/`; remove leading, trailing and repeated separators.
- Remove `.` segments and resolve internal `..` segments.
- Reject traversal above the disk root, null bytes and `:` in any segment with `StoragePathException`.
- Return `""` for the root; the file normalizer additionally rejects that result.

| Input | Canonical path / result |
| --- | --- |
| `"/reports//annual.txt/"` | `"reports/annual.txt"` |
| `r"reports\drafts\..\annual.txt"` | `"reports/annual.txt"` |
| `"reports/.."` | Directory root `""`; invalid for a file. |
| `"../annual.txt"`, `"reports/a:stream"` | `StoragePathException` |

A leading slash means the **storage root**, not the host filesystem root. Paths are logical keys, not URLs, disk names or absolute operating-system paths.

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

Normalization is lexical. The local driver joins the normalized key to its root; it does not verify containment after following symbolic links. Keep that root and its links under application control.

## Disk reference

<a id="disk-construction"></a>

### Construction and resolution

The implementation constructor is `Disk(name: str, driver: IStorageDriver) -> None`; it stores both arguments. Application code normally uses `Storage.disk(name)` rather than constructing drivers.

All path parameters below are strings. Invalid logical paths raise `StoragePathException`. Native filesystem and SDK errors can propagate: operations do not convert every failure into `False`.

<a id="disk-name"></a>

### `name() -> str`

Returns the configured disk name without I/O. Example: `disk_name = Storage.disk("local").name()`.

<a id="disk-file"></a>

### `file(path: str) -> IFile`

Creates a normalized file reference. The required path cannot resolve to the root. Example: `report = disk.file("reports/annual.txt")`. An absent target does not raise merely because this reference was created.

<a id="disk-directory"></a>

### `directory(path: str = "") -> IDirectory`

Creates a directory reference; omit the path for the root. Example: `reports = disk.directory("reports")`; `root = disk.directory()`. Neither call creates directories.

<a id="disk-put"></a>

### `async put(path: str, contents: bytes | str, visibility: str | None = None) -> IFile`

Creates or replaces contents through `file(path).write(contents, visibility)` and returns the written reference. Strings use UTF-8; `None` delegates visibility to the backend. Example: `report = await disk.put("reports/annual.txt", "Annual report", "private")`.

<a id="disk-exists"></a>

### `async exists(path: str) -> bool`

Checks for a **file**, returning `False` when absent. Example: `available = await disk.exists("reports/annual.txt")`. For a directory, use its `exists()` method.

<a id="disk-delete"></a>

### `async delete(path: str) -> bool`

Deletes one file: `True` if removed, `False` if absent. Example: `removed = await disk.delete("reports/obsolete.txt")`. This is not recursive directory deletion.

<a id="disk-copy"></a>

### `async copy(source: str, target: str) -> IFile`

Copies within this disk and returns the target reference, retaining the source. Example: `backup = await disk.copy("reports/annual.txt", "backups/annual.txt")`. A missing source raises `StorageFileNotFoundException`; both paths are normalized.

<a id="disk-move"></a>

### `async move(source: str, target: str) -> IFile`

Moves within this disk and returns the new reference. Example: `archived = await disk.move("reports/annual.txt", "archive/annual.txt")`. A missing source raises `StorageFileNotFoundException`. Atomicity and metadata preservation depend on the driver; see [relocation](#file-copyto).

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

## File content

<a id="file-construction"></a>

### Construction

`File(driver: IStorageDriver, path: str) -> None` normalizes its path immediately. Obtain it with `Storage.disk().file(path)` or retain the `IFile` returned by `put()`.

<a id="file-path"></a>

### `path() -> str`

Returns the canonical relative key without I/O. Example: `key = report.path()`. Persist the disk name with the key when a specific disk must be resolved later.

<a id="file-read"></a>

### `async read() -> bytes`

Reads the complete contents into memory. Example: `contents = await report.read()`; decode text explicitly with `contents.decode("utf-8")`. A missing file raises `StorageFileNotFoundException`.

<a id="file-write"></a>

### `async write(contents: bytes | str, visibility: str | None = None) -> IFile`

Creates or replaces contents and returns the **same** reference. Example: `await report.write("Updated report", visibility="private")`. Local creates missing parents; object stores accept nested keys. This replaces rather than appends. `None` does not guarantee private visibility or preservation of earlier permissions on every backend.

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

Consume its result with `async for`, without awaiting the factory. Example: `async for chunk in report.readStream(131072): ...`. Missing-file errors can occur during iteration. Supply a positive chunk size: zero/negative values have no shared validation or uniform driver behavior.

<a id="file-writestream"></a>

### `async writeStream(stream: AsyncIterable[bytes], visibility: str | None = None) -> IFile`

Consumes asynchronous byte chunks, replaces contents and returns the same reference. Example: `await target.writeStream(source.readStream(), visibility="private")`. It transfers contents, not source visibility or metadata. Memory collects the chunks, local uses an intermediate file, and cloud drivers can spool before uploading.

```python
from orionis.support.facades import Storage


class ReportTransfer:
    async def copy_contents(self, source_disk: str, target_disk: str) -> str:
        source = Storage.disk(source_disk).file("reports/annual.csv")
        target = Storage.disk(target_disk).file("imports/annual.csv")
        await target.writeStream(source.readStream(), visibility="private")
        return target.path()
```

Pass configured disk names and distinct source/destination keys. No transaction spans both disks. See [streams and uploads](/en/services/storage/streaming-and-uploads) for buffering and large transfers.

<a id="file-open"></a>

### `open(mode: str = "rb") -> IStorageStream`

Returns a lazily opened binary stream: use `async with`, without awaiting `open()`. Modes are `rb`, `wb`, `ab`, `rb+`, `wb+` and `ab+`; text modes raise `UnsupportedStorageOperationException`. A missing read target raises `StorageFileNotFoundException` when entering the context. Write modes create/replace data; append modes preserve the prefix.

```python
from orionis.support.facades import Storage


class AuditLog:
    async def append(self, message: str) -> None:
        log = Storage.disk("local").file("logs/business.log")
        async with log.open("ab") as stream:
            await stream.write((message + "\n").encode("utf-8"))
```

The [stream guide](/en/services/storage/streaming-and-uploads) explains cursors, flushing and backend differences.

<a id="file-exists"></a>

### `async exists() -> bool`

Checks the current stored state. Example: `available = await report.exists()`. Absence returns `False`; permission/connectivity errors do not mean absence. Another operation can remove the file after the check.

<a id="file-delete"></a>

### `async delete() -> bool`

Deletes the file and reports whether it existed. Example: `removed = await report.delete()`. A second deletion normally returns `False`. The reference keeps its path; a later write can create that target again.

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

## Copy, move and rename

<a id="file-copyto"></a>

### `async copyTo(target: str) -> IFile`

Copies to a normalized file target on the **same disk**, returning a new reference and keeping the source. Example: `backup = await report.copyTo("backups/annual.txt")`. Invalid targets raise `StoragePathException`; missing sources raise `StorageFileNotFoundException`.

<a id="file-moveto"></a>

### `async moveTo(target: str) -> IFile`

Moves within the same disk. Example: `archived = await report.moveTo("archive/annual.txt")`. Returns a new reference; the original still points to its old path. Use the returned object afterwards. Invalid paths and missing sources have the same errors as copying.

<a id="file-rename"></a>

### `async rename(name: str) -> IFile`

Builds a target from the current parent and new name, then calls `moveTo()`. Example: `renamed = await archived.rename("annual-final.txt")`. Empty names and directory separators raise `StoragePathException`. Use a concrete filename, not `.` or `..`: normal path normalization still applies. Missing sources raise `StorageFileNotFoundException`.

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

Choose a different source and destination. Equal paths are not rejected; a memory move to the same key removes the entry. For local copies, target a file rather than an existing directory, which the underlying copy operation treats as a container.

Cloud moves copy then delete, so they are not atomic renames. If deletion fails, both copies can remain. Existing targets can be overwritten; preservation of timestamps, visibility and provider metadata is backend-specific. Reapply required visibility where supported.

## Metadata and visibility

<a id="file-size"></a>

### `async size() -> int`

Returns bytes, not text characters. Example: `byte_count = await report.size()`. A missing file raises `StorageFileNotFoundException`.

<a id="file-mimetype"></a>

### `async mimeType() -> str | None`

Returns a MIME type or `None` when unknown. Example: `content_type = await report.mimeType()`. Local/memory guess from the extension without checking existence; cloud drivers consult metadata and can raise `StorageFileNotFoundException`. This is not content inspection or upload validation.

<a id="file-lastmodified"></a>

### `async lastModified() -> datetime`

Returns the modification timestamp. Example: `modified = (await report.lastModified()).isoformat()`. The contract uses timezone-aware dates; local/memory create UTC dates and cloud drivers return SDK metadata. Missing files raise `StorageFileNotFoundException`.

<a id="file-hash"></a>

### `async hash(algorithm: str = "sha256") -> str`

Reads contents and returns a hexadecimal digest. Example: `digest = await report.hash("sha512")`; omission selects SHA-256. Unknown algorithms raise `UnsupportedStorageOperationException`; missing files raise `StorageFileNotFoundException`. Use fixed-output algorithms accepted by `hashlib.new`: no output-length argument exists for SHAKE digests. Hashing a cloud file transfers its contents to the application.

<a id="visibility"></a>

### Visibility values

`Visibility`, exported by `orionis.storage`, is a `StrEnum` with `Visibility.PUBLIC = "public"` and `Visibility.PRIVATE = "private"`. Members or their strings can be passed to the API. Visibility does not create an HTTP route or make a storage medium accessible through a URL.

<a id="file-visibility"></a>

### `async visibility() -> str`

Returns the backend's interpretation of public/private access. Example: `level = await report.visibility()`. Requires an existing file and otherwise raises `StorageFileNotFoundException`; SDK errors can also propagate.

<a id="file-setvisibility"></a>

### `async setVisibility(visibility: str) -> IFile`

Changes visibility and returns the same reference. Example: `await report.setVisibility("private")`. Local, memory, S3 and GCS reject unsupported levels with `UnsupportedStorageOperationException`; missing targets raise `StorageFileNotFoundException`. Azure always rejects this operation because Orionis has no per-blob implementation.

| Driver | Actual behavior |
| --- | --- |
| Local | Explicit private/public levels use `0600`/`0644`; group/other readability is classified as public. Without a level, permissions follow OS defaults. Platform permission support matters. |
| Memory | New files default to private; rewriting with `None` preserves the existing level. This is stored metadata, not network access control. |
| S3 | Explicit levels use object ACLs; omission sends no ACL. Reads check public read grants, not every bucket/IAM policy. |
| GCS | Explicit levels use predefined object ACLs; subsequent changes use SDK public/private operations. Access policies can reject them. |
| Azure | Writes ignore visibility. Reads use the container's public access policy; changing one blob is unsupported. |

Use public/private deliberately. There is no shared validator enforcing identical treatment of other values across all write implementations. An operation that fails does not guarantee that its content write was rolled back.

<a id="file-info"></a>

### `async info() -> FileInfo`

Returns an immutable snapshot; missing files raise `StorageFileNotFoundException`. Example: `snapshot = await report.info()`. `FileInfo` is a frozen, slotted dataclass with keyword-only fields. The first four fields below are required; the others default to `None`.

| Field | Type | Meaning |
| --- | --- | --- |
| `path` | `str` | Canonical storage path. |
| `size` | `int` | Bytes of content. |
| `lastModified` | `datetime` | Last modification. |
| `visibility` | `str` | Backend-reported access level. |
| `mimeType` | `str \| None` | Metadata/extension-derived content type. |
| `createdAt` | `datetime \| None` | Creation time when available. |
| `etag` | `str \| None` | Entity tag; not universally an MD5. |
| `checksum` | `str \| None` | Driver-provided checksum; algorithm varies. |
| `url` | `str \| None` | Constructed public URL when available. |

| Driver | `createdAt` | `etag` | `checksum` |
| --- | --- | --- | --- |
| Local | Filesystem birth time when available; otherwise `None`. | Calculated MD5. | Calculated SHA-256. |
| Memory | In-memory creation time. | Calculated MD5. | Calculated SHA-256. |
| S3 | `None`. | Provider ETag. | `None`. |
| Azure | SDK creation time. | Provider ETag. | Stored content MD5 in hexadecimal, when supplied. |
| GCS | SDK creation time. | Provider ETag. | Stored MD5 decoded to hexadecimal, when supplied. |

Local/memory `info()` calculates digests; a large local file is read entirely for that calculation. Request `size()` or `lastModified()` when sufficient. A snapshot does not update after writes, copies or visibility changes.

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

## URLs and local downloads

<a id="file-url"></a>

### `async url() -> str`

Builds an unsigned URL. Example: `url = await report.url()`. Local/memory require a base URL, otherwise raising `UnsupportedStorageOperationException`; cloud drivers use provider configuration. Reserved characters are URL-encoded while slashes remain separators.

It does not check existence, grant public access, upload a file or configure static serving. A memory disk's base URL does not serve its contents through HTTP. A private cloud object can have an unsigned URL that denies anonymous access.

<a id="file-temporaryurl"></a>

### `async temporaryUrl(expires_in: int = 3600) -> str`

Builds a signed URL with a lifetime in seconds. Example: `url = await report.temporaryUrl(expires_in=300)`. Local/memory always raise `UnsupportedStorageOperationException`. S3 signs GET URLs; Azure creates read SAS URLs and requires the account key; GCS requests V4 GET signatures with signing-capable credentials. SDK errors can propagate. No common framework range check exists for the lifetime; signing does not check existence.

```python
from orionis.support.facades import Storage


class ReportLinks:
    async def public_link(self, disk_name: str) -> str:
        return await Storage.disk(disk_name).file("reports/public.pdf").url()

    async def private_link(self, disk_name: str) -> str:
        report = Storage.disk(disk_name).file("reports/private.pdf")
        return await report.temporaryUrl(expires_in=300)
```

Call `private_link()` with a configured signing-capable cloud disk, after authorizing access to the report.

<a id="file-download"></a>

### `async download(destination: str | Path) -> Path`

Copies to the **application server's filesystem**, returning the absolute local path. Example: `saved = await report.download(destination)`. An existing directory receives the original basename; any other destination is treated as a file path. Missing parents are created and target contents can be replaced. Missing sources raise `StorageFileNotFoundException`; destination/permission errors can remain native.

The destination is a host path, outside storage normalization. Supply an application-controlled target. This method does not send an HTTP attachment.

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

The temporary directory is removed when the context exits. See [streams and uploads](/en/services/storage/streaming-and-uploads) for HTTP delivery.

## Directory operations

<a id="directory-construction"></a>

### Construction

`Directory(driver: IStorageDriver, path: str = "") -> None` normalizes its path. Obtain references through `disk.directory(path)`. They can target absent directories; creation is a separate operation.

<a id="directory-path"></a>

### `path() -> str`

Returns the canonical key without I/O. Example: `key = reports.path()`. The root is `""`, not a slash.

<a id="directory-create"></a>

### `async create() -> IDirectory`

Creates the directory and applicable parents, returning the same reference. Example: `reports = await disk.directory("reports/2026").create()`. Local creates physical directories; cloud writes empty prefix markers; memory keeps explicit entries. A colliding local file can cause a native filesystem error.

<a id="directory-exists"></a>

### `async exists() -> bool`

Checks backend-specific existence. Example: `available = await reports.exists()`. Cloud prefixes exist through markers or descendant objects. Memory/cloud report the root as present; local checks its physical root, which can become absent after deletion.

<a id="directory-files"></a>

### `async files() -> list[IFile]`

Lists sorted file references for direct children. Example: `names = [item.path() for item in await reports.files()]`. Excludes nested files and cloud directory markers. Results are objects, not strings or content bytes.

Local listings also exclude filenames ending in `.tmp`, including application-created files with that suffix. This filter applies to recursive listings too; such a file can still be accessed directly through `file(path)`.

<a id="directory-allfiles"></a>

### `async allFiles() -> list[IFile]`

Lists sorted file references throughout the subtree. Example: `keys = [item.path() for item in await reports.allFiles()]`. The complete list is materialized: no public pagination/cursor parameter exists. Backend list failures propagate.

<a id="directory-directories"></a>

### `async directories() -> list[IDirectory]`

Lists sorted direct-child directory references. Example: `folders = [item.path() for item in await reports.directories()]`. Object stores derive them from markers and key prefixes.

<a id="directory-alldirectories"></a>

### `async allDirectories() -> list[IDirectory]`

Lists sorted directory references at every descendant depth, excluding the queried directory itself. Example: `folders = [item.path() for item in await reports.allDirectories()]`. Built-in drivers return empty lists for empty/nonexistent trees; authorization/connectivity failures are not suppressed.

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

For `reports/summary.txt` and `reports/2026/annual.txt`, `files()` lists only the first; `allFiles()` lists both. Returned paths remain relative to the **disk root**, not the queried directory.

<a id="directory-delete"></a>

### `async delete() -> bool`

Recursively deletes the directory and descendants. Example: `removed = await disk.directory("reports/obsolete").delete()`. An absent target/cloud prefix with no objects returns `False`. Cloud failures can leave partial work. No dry-run or recursive parameter exists.

:::caution[The root is a valid target]
`await disk.directory().delete()` targets the entire disk. Local removes its root directory; memory clears contents and explicit directories; cloud removes objects from the configured bucket/container scope, retaining the bucket/container. There is no confirmation or root protection. Delete an explicit, application-controlled subtree when removing a business resource.
:::

```python
from orionis.support.facades import Storage


class ReportCleanup:
    async def remove_obsolete(self) -> bool:
        obsolete = Storage.disk("local").directory("reports/obsolete")
        return await obsolete.delete()
```

## Handle failures at the operation boundary

`StoragePathException` identifies rejected logical paths; `StorageFileNotFoundException` identifies missing files; `UnsupportedStorageOperationException` identifies unsupported capabilities, modes, visibility levels or hash algorithms where validated. All inherit from `StorageException`.

Catch the relevant failure rather than treating `exists()` as a guarantee. OS permissions, file/directory collisions and SDK failures can remain native exceptions. A stored file and a database row do not share a transaction: coordinate their lifecycle in application code.

Continue with [disk configuration and drivers](/en/services/storage/disks-and-drivers), [streams and uploads](/en/services/storage/streaming-and-uploads), or the [Storage overview](/en/services/storage).
