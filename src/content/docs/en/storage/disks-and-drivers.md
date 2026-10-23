---
title: "Disks, drivers, and dependencies"
description: "Choose local, in-memory, S3, Azure Blob, or Google Cloud storage and understand their actual capabilities and requirements."
editUrl: true
lastUpdated: false
---

A **disk** is an entry in `config/filesystems.py`: it identifies the configuration selected through `Storage.disk("s3")`. A **driver** implements its operations, determining where files live and how they are read, written, or published. Multiple disks can share a driver; `local` and `public` use `local` with different roots.

## Available drivers

| Configuration driver | Implementation | Additional dependency |
|---|---|---|
| `local` | `LocalStorageDriver`: operating-system files. | None. |
| `memory` | `MemoryStorageDriver`: contents in the instance's memory. | None. |
| `aws` or `s3` | `S3StorageDriver`: Amazon S3 and API-compatible services. | Extra `s3`: `boto3`. |
| `azure` | `AzureStorageDriver`: Azure Blob Storage. | Extra `azure`: `azure-storage-blob`. |
| `gcs` or `google` | `GoogleStorageDriver`: Google Cloud Storage. | Extra `gcs`: `google-cloud-storage`. |

Aliases belong to the **driver**: the S3 disk is named `s3`, although its entity uses `driver="aws"`. `Storage.disk("aws")` does not automatically select that disk. Driver names are compared literally; use the lowercase values above.

The included disk entries are `local`, `public`, `s3`, `azure`, and `gcs`. `memory` is a driver you can assign to one of them, rather than a predefined disk. [Filesystem configuration](/en/storage/configuration) covers every field, environment variable, and validation rule.

<a id="packages"></a>

## Install dependencies with Reactor

From your application root, using its environment's Python:

```bash
python -B reactor packages
```

The direct alternative is:

```bash
orionis packages
```

The command reads dependency extras and groups from the Orionis manifest, displays a numbered catalog, and accepts names or numbers separated by spaces or commas. It then asks for confirmation; `0` cancels selection. It prefers the framework's bundled or source manifest and falls back to the application's `pyproject.toml` if neither exists.

```text
packages [options ...] [--list] [--yes | -y]
```

| Argument or option | Default | Purpose |
|---|---|---|
| `options` | No selection. | Zero or more names, numbers, or `extra:NAME` / `group:NAME` keys. A bare name must identify exactly one option. |
| `--list` | `False` | Display the catalog and exit without installing. |
| `--yes`, `-y` | `False` | Confirm selected options without prompting. |
| `-h`, `--help` | — | Display command help. |

```bash
python -B reactor packages --list
python -B reactor packages s3 --yes
python -B reactor packages azure --yes
python -B reactor packages gcs --yes
```

You can install multiple extras together. `storage` includes all three cloud SDKs:

```bash
python -B reactor packages extra:s3 extra:gcs -y
python -B reactor packages storage --yes
orionis packages storage --yes
```

Non-interactive installations require explicit options and `--yes`. With no selection, the command only displays the catalog; with options but no confirmation, it fails. It also rejects unknown names, numbers outside the catalog, and ambiguous bare names. Prefer names over numeric positions in automation.

`uv` must be available on `PATH`. Reactor executes `uv pip install --python <Reactor interpreter> -- <requirements>`: it targets the environment of the Python running the command and deduplicates requirements. It does not change the application's declared dependencies or update `uv.lock`. To declare an extra in a uv-managed project, use the corresponding alternative:

```bash
uv add "orionis[s3]"
uv add "orionis[azure]"
uv add "orionis[gcs]"
uv add "orionis[storage]"
```

Installing an extra does not change `FILESYSTEM_DISK`, configure credentials, or create buckets or containers.

<a id="driver-local"></a>

## Local storage

`local` resolves relative roots from the application root and preserves absolute roots. The driver creates its root directory when first constructed. Configuration entities themselves do not create directories.

```dotenv
FILESYSTEM_DISK=local
LOCAL_PATH=storage/app/private
PUBLIC_PATH=storage/app/public
PUBLIC_URL=/static
```

```python
from orionis.http import JSONResponse
from orionis.support.facades import Storage


class ManifestController:
    async def publish(self) -> JSONResponse:
        manifest = await Storage.disk("public").put(
            "build/manifest.json",
            '{"ready": true}',
            visibility="public",
        )
        return JSONResponse({"url": await manifest.url()})
```

`url()` joins `PUBLIC_URL` and the encoded path; it does not register a static route or check file existence. Your application or server must expose the corresponding directory. The included `local` entry has no base URL: `file.url()` raises `UnsupportedStorageOperationException`.

Visibility applies POSIX permissions to the file: `public` uses `0644` and `private` uses `0600`. Directories use the operating system's default permissions; file visibility does not change their parents. The effect depends on the operating system and does not replace HTTP configuration. Signed URLs are unsupported.

<a id="driver-memory"></a>

## In-memory storage

Assign `memory` to an existing entry in the `disks` factory:

```python
from orionis.foundation.config.filesystems import Disks, Local


def memory_disks() -> Disks:
    return Disks(local=Local(driver="memory", path="storage/app/private"))
```

Use `memory_disks` as the `default_factory` of `BootstrapFilesystems.disks`. `Local` still validates `path`, although this driver does not use it.

Each instance owns its files: data is neither shared between processes nor persisted after restart. Streaming writes are assembled in memory. Visibility is metadata rather than an operating-system permission. URLs require an entry exposing `url`, such as `public`; that address does not publish the bytes. Signed URLs are unsupported.

<a id="driver-s3"></a>

## Amazon S3 and compatible services

Install the `s3` extra and configure:

```dotenv
FILESYSTEM_DISK=s3
S3_BUCKET=example-media
S3_REGION=us-east-1
S3_KEY=replace-with-access-key
S3_SECRET=replace-with-secret
```

The driver passes explicit credentials to boto3 only when **both** are present; otherwise, it uses the SDK credential chain. For a compatible endpoint, you can add:

```dotenv
S3_ENDPOINT=http://localhost:9000
S3_USE_PATH_STYLE_ENDPOINT=true
```

`endpoint` configures the API; `url` only overrides the generated public address. `url()` prefers `S3_URL`, then builds `<endpoint>/<bucket>/<file>`, or `https://<bucket>.s3.<region>.amazonaws.com/<file>` when neither is configured. Building it does not use the SDK.

Explicit visibility maps to `public-read` or `private` ACLs; with `None`, writes omit the ACL. Bucket policies must permit those operations. `visibility()` inspects the object's ACL grants, rather than every possible access policy. `temporaryUrl()` signs a `get_object` operation.

<a id="driver-azure"></a>

## Azure Blob Storage

Install the `azure` extra and use a connection string:

```dotenv
FILESYSTEM_DISK=azure
AZURE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=exampleaccount;AccountKey=replace-with-key;EndpointSuffix=core.windows.net"
AZURE_CONTAINER=documents
```

Alternatively, leave `AZURE_CONNECTION_STRING` empty and configure `AZURE_ACCOUNT_NAME`, `AZURE_ACCOUNT_KEY`, and `AZURE_CONTAINER`. The connection string takes precedence when creating the client. The driver extracts its account name and key when the corresponding fields are empty.

`url()` prefers `AZURE_URL`; otherwise it builds `https://<account>.blob.core.windows.net/<container>/<file>`. Without a connection string, the client uses the account endpoint and provided key, or `None` if absent.

Writes ignore `visibility`: this implementation does not provide per-blob visibility. `visibility()` checks container access, and `setVisibility()` raises `UnsupportedStorageOperationException`. Configure container access in Azure. `temporaryUrl()` generates a read-only SAS and requires an account key, including a key extracted from the connection string.

<a id="driver-gcs"></a>

## Google Cloud Storage

Install the `gcs` extra and configure:

```dotenv
FILESYSTEM_DISK=gcs
GCS_PROJECT_ID=example-project
GCS_BUCKET=example-media
GCS_KEY_FILE=/secure/service-account.json
```

With `GCS_KEY_FILE`, the SDK creates its client from the service-account file. Otherwise, it uses `storage.Client(project=...)` and Application Default Credentials. The driver passes the path directly to the SDK; it does not resolve it from the Storage root. The file-based constructor takes project information from that file rather than receiving `project_id` as an argument.

`url()` prefers `GCS_URL`, falling back to `https://storage.googleapis.com/<bucket>/<file>`. Writes with explicit visibility use `publicRead` or `private` predefined ACLs; `setVisibility()` calls `make_public()` or `make_private()`. `visibility()` checks the `allUsers` ACL. Bucket policies and credentials must allow these operations. `temporaryUrl()` requests a V4 read signature: credentials must support signing.

## Backend differences

| Capability | Behavior |
|---|---|
| Directories | Local uses physical directories. Memory tracks entries and implicit parents. Cloud uses prefixes and empty objects ending in `/` for explicit directories. |
| Public URL | Local and memory require a base URL; cloud derives a provider address. URL construction does not check access or existence. |
| Temporary URL | S3, Azure, and GCS only. The file method takes `expires_in=3600`, in seconds. |
| Metadata | Dates, ETags, and checksums vary by backend. An ETag is not necessarily a content hash; `hash()` reads bytes to calculate one. |
| Cloud I/O | SDKs load on first use requiring them, and blocking calls run on worker threads. Network, credential, and permission errors from the SDK may propagate. |

Cloud constructors do not connect or provision resources. Disk resolution can succeed while its first I/O fails due to a missing SDK (`MissingStorageDependencyException`), incomplete configuration, or permissions. Orionis adds no common retry, failover, or multi-file transaction policy; the SDKs retain their own behavior.

<a id="custom-drivers"></a>

## Register a driver from a provider

`Storage.extend(driver, factory)` registers a synchronous factory receiving the configuration entity and returning an `IStorageDriver`. A new implementation must implement the [complete driver contract](/en/storage/api-reference). You can also register an alias for an existing implementation.

Change the `driver` of the `local` entry using this factory for `BootstrapFilesystems.disks`:

```python
from orionis.foundation.config.filesystems import Disks, Local


def scratch_disks() -> Disks:
    return Disks(local=Local(driver="scratch", path="storage/app/private"))
```

Set `default_factory=scratch_disks` when declaring that field. The entity accepts `scratch` as a driver name; the provider below registers its implementation.

Register the factory in an application provider:

```python
from orionis.container.providers import ServiceProvider
from orionis.storage import MemoryStorageDriver
from orionis.storage.contracts import IStorageManager


class StorageDriversProvider(ServiceProvider):
    async def boot(self) -> None:
        storage: IStorageManager = await self.app.make(IStorageManager)
        storage.extend("scratch", lambda config: MemoryStorageDriver())
```

Add `StorageDriversProvider` to the existing `app.withProviders(...)` call in `bootstrap/app.py`. `Storage.disk("local")` then uses memory through this alias; registering `scratch` does not create a disk named `scratch`.

The factory is not a coroutine and receives no application argument; it can capture dependencies resolved in `boot()`. Providers receive `boot(self)` without injected arguments, so use `await self.app.make(...)`.

Factories take precedence over built-in drivers, even when reusing an existing name. `extend()` clears the disk cache for subsequent resolutions; previously retained disk or file references keep their earlier driver. Register extensions during startup, before serving requests.

Continue with [complete configuration](/en/storage/configuration) and [file and directory operations](/en/storage/files-and-directories).
