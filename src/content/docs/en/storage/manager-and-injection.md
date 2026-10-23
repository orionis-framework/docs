---
title: "Storage facade and injection"
description: "Use Storage or IStorageManager from controllers and services and understand every manager method."
editUrl: true
lastUpdated: false
---

The facade and injection access the same service registered by the application. Import the facade with `from orionis.support.facades import Storage`. For injection, annotate the dependency with `IStorageManager`, exported by `orionis.storage.contracts`.

<a id="facade"></a>

## Using the facade

```python
from orionis.http import JSONResponse
from orionis.support.facades import Storage


class SaveReportController:
    async def __call__(self) -> JSONResponse:
        disk = Storage.disk("local")
        file = await disk.put("reports/42.txt", "Report ready")
        return JSONResponse({"disk": disk.name(), "path": file.path()})
```

The manager selects disks; file operations belong to a disk and its references. Use `await Storage.disk().put(...)`, not `Storage.put(...)`. `disk()` and `default()` are synchronous after the native provider has booted and pinned the facade. Importing the module alone does not start the container; run these examples within the application flow.

With a custom bootstrap where the deferred provider has not resolved yet, first obtain `storage = await Storage.resolve()` and continue with `storage.disk(...)`. This asynchronous call resolves the service and completes its provider; it avoids treating the facade's initial dispatcher as an already-resolved disk. Injecting `IStorageManager` also performs that resolution. Facade examples here assume the application's full asynchronous startup has completed.

## Constructor injection

Use the constructor when several actions need storage. Save this example as `app/http/controllers/report_controller.py`:

```python
from orionis.http import JSONResponse
from orionis.storage.contracts import IStorageManager


class ReportController:
    def __init__(self, storage: IStorageManager) -> None:
        self.storage = storage

    async def store(self, report_id: int) -> JSONResponse:
        file = await self.storage.disk("local").put(
            f"reports/{report_id}.txt", "Report ready",
        )
        return JSONResponse({"path": file.path()})

    async def show(self, report_id: int) -> JSONResponse:
        file = self.storage.disk("local").file(f"reports/{report_id}.txt")
        return JSONResponse({"content": (await file.read()).decode("utf-8")})
```

Register both actions in your configured API routing file:

```python
from app.http.controllers.report_controller import ReportController
from orionis.support.facades import Route

Route.post("/reports/{report_id:int}", [ReportController, "store"])
Route.get("/reports/{report_id:int}", [ReportController, "show"])
```

The container builds the controller, resolves `IStorageManager`, and supplies the route parameter to its action. A `POST /reports/42` followed by `GET /reports/42` exercises writing and reading. Errors such as a missing file propagate to the HTTP flow unless you handle them.

## Method injection

When only one action needs Storage, receive it in that action:

```python
from orionis.http import JSONResponse
from orionis.storage.contracts import IStorageManager


class StoreExportController:
    async def __call__(self, storage: IStorageManager) -> JSONResponse:
        file = await storage.disk("local").put("exports/latest.txt", "Export")
        return JSONResponse({"path": file.path()})
```

Register the class as an invokable controller following the [controller guide](/en/http/controllers). `storage` is a server dependency, not a field the client sends. Calling `controller.__call__()` directly in Python does not activate injection: the container must invoke it or you must supply its argument.

## Services and other components

The same contract works in constructors of services built by the container. Consume them from HTTP, commands, or MCP components:

```python
from orionis.storage.contracts import IStorageManager


class ReportArchive:
    def __init__(self, storage: IStorageManager) -> None:
        self.storage = storage

    async def save(self, report_id: int, contents: bytes) -> str:
        file = await self.storage.disk("local").put(
            f"archive/{report_id}.bin", contents,
        )
        return file.path()
```

Receive `ReportArchive` in the consuming component. To resolve explicitly from a provider with `self.app`, use `storage = await self.app.make(IStorageManager)`. Provider `register()` and `boot()` hooks are called without extra arguments: they do not use HTTP action injection. See [providers and facades](/en/application/container/providers).

## Complete manager API

<a id="manager-construction"></a>

### Construction and registration

`StorageManager(app: IApplication) -> None` reads `app.basePath` and `app.config("filesystems")`. It converts a dictionary to `Filesystems` and retains existing entities. Reading configuration does not open every disk or contact providers.

The native `StorageProvider` registers `IStorageManager → StorageManager` as a singleton and pins the facade during its asynchronous `boot()`. You do not need to register this provider or construct managers per request. The singleton and cache belong to the application instance.

<a id="manager-disk"></a>

### disk(name: str | None = None) → IDisk

Resolves and caches a disk by name. `None` and the empty string select the default (`name or self._default`). The first resolution builds the driver; subsequent resolutions return the same `IDisk`. Cloud initialization is lazy: constructing a disk does not check connectivity or credentials yet.

```python
from orionis.support.facades import Storage


class SaveOnSelectedDisk:
    async def save(self, contents: bytes) -> str:
        disk = Storage.disk("local")
        assert disk is Storage.disk("local")
        return (await disk.put("documents/latest.bin", contents)).path()
```

An unconfigured name raises `DiskNotFoundException`; a driver without an implementation raises `DriverNotSupportedException`. Configuration validation can also fail before any disk is resolved. Disk and driver names are not interchangeable: `Storage.disk("memory")` requires a disk of that name. Native configuration exposes the five [filesystem slots](/en/storage/configuration).

<a id="manager-default"></a>

### default() → IDisk

Equivalent to `disk()`. Uses `Filesystems.default`, which the bootstrap reads from `FILESYSTEM_DISK` with a `local` fallback. It does not change the default disk.

```python
from orionis.support.facades import Storage


class SaveOnDefaultDisk:
    async def save(self) -> str:
        file = await Storage.default().put("notes/latest.txt", "Saved")
        return file.path()
```

<a id="manager-extend"></a>

### extend(driver: str, factory: Callable[[object], IStorageDriver]) → None

Registers a **synchronous** factory receiving a disk configuration entity and returning an `IStorageDriver`. It takes precedence over a native driver with the same name. It does not add disks to configuration by itself.

```python
from orionis.storage import MemoryStorageDriver
from orionis.storage.contracts import IStorageManager


class IsolatedStorageSetup:
    def configure(self, storage: IStorageManager) -> None:
        storage.extend("local", lambda config: MemoryStorageDriver())
```

This replaces the `local` driver on future resolutions: both the `local` and `public` disks become ephemeral. It is test-application setup; do not run it per request. A direct call to `configure()` requires you to supply `storage`.

`extend()` clears the **entire** disk cache. Existing references retain their previous driver; data is not migrated and old resources are not closed. Register extensions before other components retain disks. The [custom driver guide](/en/storage/disks-and-drivers#custom-drivers) shows provider integration.

<a id="manager-uploaded"></a>

### uploaded(source: IHttpUploadedFile) → IUploadedFile

Adapts an HTTP multipart file for storage on this manager's disks. It retains the source; construction does not read, save, or validate content.

```python
from orionis.http.payload.uploaded_file import UploadedFile
from orionis.storage.contracts import IStorageManager


class UploadArchive:
    def __init__(self, storage: IStorageManager) -> None:
        self.storage = storage

    async def save(self, source: UploadedFile) -> str:
        file = await self.storage.uploaded(source).store("incoming", disk="local")
        return file.path()
```

The result uses the **Storage** upload contract, distinct from the original HTTP payload. See [uploads](/en/storage/streaming-and-uploads) for `store`, `storeAs`, `copy`, `move`, metadata, and closing behavior.
