---
title: "Storage"
description: "Use Storage to save reports, persist validated uploads, read files, and manage local or cloud content through one async API. A disk is a named storage configuration; a file…"
editUrl: true
lastUpdated: false
---

Use `Storage` to save reports, persist validated uploads, read files, and manage local or cloud content through one async API. A disk is a named storage configuration; a file path is relative to that disk's root.

## Save a private application file

The `local` disk is available without a cloud SDK or credentials. In your application's `.env`, before startup:

```dotenv
FILESYSTEM_DISK=local
LOCAL_PATH=storage/app/private
```

Ensure the process can write to that directory. `config/filesystems.py` owns the disk definitions. After bootstrap, call the facade from an async controller, command, or service:

```python
from uuid import UUID
from orionis.support.facades import Storage


async def save_report(report_id: UUID, content: bytes) -> str:
    file = await Storage.disk("local").put(
        f"reports/{report_id}.txt", content, visibility="private",
    )
    return file.path()
```

The result is a logical path such as `reports/550e8400-e29b-41d4-a716-446655440000.txt`, not an HTTP URL. Save that path with the report's metadata. To read later, obtain the authorized report record, then use `await Storage.disk("local").file(saved_path).read()`; the result is `bytes`.

`put()` replaces content at the same path. The default private disk is not publicly served. Returning a path does not authorize a download or publish the directory; implement that policy in your application.

## Choose the next step

1. [Files and directories](/en/services/storage/files-and-directories): save, read, inspect, copy, move, list, and delete.
2. [Streams and uploads](/en/services/storage/streaming-and-uploads): validate HTTP uploads and process larger files without assuming unlimited memory.
3. [Disks and drivers](/en/services/storage/disks-and-drivers): local/public disks, optional S3/Azure/GCS dependencies, credentials, URLs, and extensions.

Examples with `MemoryStorageDriver` or temporary directories are standalone demonstrations. Application code normally uses the configured `Storage` facade and lets the application own disk resources.
