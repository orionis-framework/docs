---
title: "Filesystem configuration"
description: "Reference for disks, entities, environment variables, defaults, and storage configuration validation."
editUrl: true
lastUpdated: false
---

`config/filesystems.py` defines `BootstrapFilesystems`, an immutable dataclass extending `Filesystems`. The Storage service reads this configuration when resolved; it constructs and caches each disk on first selection.

<a id="filesystems"></a>

## Select a disk: Filesystems

| Field | Type and default | Effect |
|---|---|---|
| `default` | `DiskName \| str`; `FILESYSTEM_DISK`, default `local`. | Disk selected by `Storage.disk()` and `Storage.default()`. |
| `disks` | `Disks \| dict`; `Disks(...)` factory. | Configuration for the five storage entries. |

<a id="diskname"></a>

### Names and normalization

`DiskName` contains `LOCAL`, `PUBLIC`, `S3`, `AZURE`, and `GCS`, with values `local`, `public`, `s3`, `azure`, and `gcs`. Strings in `default` are trimmed and normalized: `" S3 "` becomes `"s3"`. Other names raise `ValueError`; types other than a string or `DiskName` raise `TypeError`.

```dotenv
FILESYSTEM_DISK=s3
```

Select a different disk without changing the default:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Storage


class ReportController:
    async def store(self) -> JSONResponse:
        disk = Storage.disk("local")
        report = await disk.put("reports/latest.csv", "id,total\n1,25\n")
        return JSONResponse({"disk": disk.name(), "path": report.path()})
```

Explicit selection uses the name as received; use `"s3"`, rather than `"S3"` or `"aws"`. An unconfigured name raises `DiskNotFoundException`. `disk(None)` and `disk("")` use the default. `disk()` and `default()` are synchronous; await the disk or file's I/O operations.

<a id="disks"></a>

## Entities and entries: Disks

The public module exports these entities:

```python
from orionis.foundation.config.filesystems import (
    GCS, S3, Azure, DiskName, Disks, Filesystems, Local, Public,
)
```

| `Disks` field | Accepted value | Default driver |
|---|---|---|
| `local` | `Local \| dict` | `local` |
| `public` | `Public \| dict` | `local` |
| `s3` | `S3 \| dict` | `aws` |
| `azure` | `Azure \| dict` | `azure` |
| `gcs` | `GCS \| dict` | `gcs` |

All constructor fields are optional; omitted entries use their factories. `Disks(local={...})` converts that dictionary to `Local(...)`, and the same applies to the other entries. Other object types, including `None`, raise `TypeError`. Instances do not share the entities created by their factories.

The standard configuration has five fixed entries. Adding an `archive` dictionary key does not register a disk and raises `TypeError`. `Filesystems(default="archive")` is also rejected. `extend()` expands the **driver** registry rather than the disk catalog. Change an existing entry's `driver` to use another implementation; a wider configuration structure requires consistent extensions to its entities and validation.

<a id="local"></a>

## Private disk: Local

| Field | Variable and default | Type and effect |
|---|---|---|
| `driver` | No variable; `"local"`. | Nonempty `str`. Selects the implementation. |
| `path` | `LOCAL_PATH`; `"storage/app/private"`. | Nonempty `str`. Absolute root or path relative to the application. |

`Local` has no `url` field. Changing `driver` to `memory` still validates `path`, although that driver does not use the path.

<a id="public"></a>

## Public disk: Public

| Field | Variable and default | Type and effect |
|---|---|---|
| `driver` | No variable; `"local"`. | Nonempty `str`. Selects the implementation. |
| `path` | `PUBLIC_PATH`; `"storage/app/public"`. | Nonempty `str`. Public disk root. |
| `url` | `PUBLIC_URL`; `"/static"`. | Nonempty `str`. Base used by `file.url()`. |

`Public.url` remains required by its entity when selecting another driver. Configuration validation does not create directories. The local driver creates its root when constructed and required parents when writing. A URL does not register a static route: the application or server must publish the directory.

<a id="s3"></a>

## Amazon S3: S3

| Field | Variable and default | Type and effect |
|---|---|---|
| `driver` | No variable; `"aws"`. | Nonempty `str`; built-in aliases `aws` and `s3`. |
| `key` | `S3_KEY`; `""`. | `str`. Access identifier, used with `secret`. |
| `secret` | `S3_SECRET`; `""`. | `str`. Access secret, used with `key`. |
| `region` | `S3_REGION`; `"us-east-1"`. | Nonempty `str`. Client and derived URL region. |
| `bucket` | `S3_BUCKET`; `""`. | `str`. Object bucket. |
| `url` | `S3_URL`; `None`. | `str \| None`. Public base or CDN used to generate URLs. |
| `endpoint` | `S3_ENDPOINT`; `None`. | `str \| None`. S3 or compatible service API endpoint. |
| `use_path_style_endpoint` | `S3_USE_PATH_STYLE_ENDPOINT`; `False`. | `bool`. Enables boto3 `addressing_style="path"`. |

The entity accepts empty credentials and bucket strings to allow initial configuration. This does not demonstrate a usable service. If `key` **and** `secret` are not both present, boto3 resolves its own credentials. `url` and `endpoint` are different: a CDN base does not change the API client.

<a id="azure"></a>

## Azure Blob Storage: Azure

| Field | Variable and default | Type and effect |
|---|---|---|
| `driver` | No variable; `"azure"`. | Nonempty `str`. Selects the implementation. |
| `connection_string` | `AZURE_CONNECTION_STRING`; `""`. | `str`. Takes precedence when creating the client if present. |
| `account_name` | `AZURE_ACCOUNT_NAME`; `""`. | `str`. Account name, also extracted from the connection string. |
| `account_key` | `AZURE_ACCOUNT_KEY`; `""`. | `str`. Account key, also extracted from the connection string; required for SAS. |
| `container` | `AZURE_CONTAINER`; `""`. | `str`. Blob container. |
| `url` | `AZURE_URL`; `None`. | `str \| None`. Public base overriding the derived address. |

The entity validates types without requiring a complete connection string, account, or container. The client and service detect connection or authorization errors on use. `url` does not override the Azure connection endpoint.

<a id="gcs"></a>

## Google Cloud Storage: GCS

| Field | Variable and default | Type and effect |
|---|---|---|
| `driver` | No variable; `"gcs"`. | Nonempty `str`; built-in aliases `gcs` and `google`. |
| `project_id` | `GCS_PROJECT_ID`; `""`. | `str`. Project for the constructor without a key file. |
| `key_file` | `GCS_KEY_FILE`; `None`. | `str \| None`. Service-account JSON file, passed directly to the SDK. |
| `bucket` | `GCS_BUCKET`; `""`. | `str`. Object bucket. |
| `url` | `GCS_URL`; `None`. | `str \| None`. Public base overriding `storage.googleapis.com`. |

An empty or `None` `key_file` selects Application Default Credentials. A nonempty path selects `Client.from_service_account_json(...)`; its existence and contents are checked when creating the SDK client, rather than when constructing the entity.

## Customize config/filesystems.py

Keep factories using `Env.get(...)` to resolve environment values. You can specify only changed entries and leave the rest at their defaults. This complete file customizes the two local roots:

```python
from dataclasses import dataclass, field
from orionis.environment import Env
from orionis.foundation.config.filesystems import (
    DiskName, Disks, Filesystems, Local, Public,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapFilesystems(Filesystems):
    default: DiskName | str = field(
        default_factory=lambda: Env.get("FILESYSTEM_DISK", DiskName.LOCAL),
    )
    disks: Disks | dict = field(
        default_factory=lambda: Disks(
            local=Local(path=Env.get("LOCAL_PATH", "storage/app/private")),
            public=Public(
                path=Env.get("PUBLIC_PATH", "storage/app/public"),
                url=Env.get("PUBLIC_URL", "/static"),
            ),
        ),
    )
```

Omitted entities such as `S3` or `Azure` retain their environment factories. To customize them, add their documented fields to `Disks(...)`. Change `driver` fields in Python: the included file defines no environment variables for them.

### Dictionary configuration

Equivalent dictionaries are supported. The manager converts the root to `Filesystems`; that entity converts `disks` and its entries to their corresponding entities:

```python
from orionis.foundation.config.filesystems import Filesystems


settings = Filesystems(
    default="public",
    disks={
        "local": {"driver": "local", "path": "storage/app/private"},
        "public": {
            "driver": "local",
            "path": "storage/app/public",
            "url": "/static",
        },
    },
)
```

Dictionaries retain validation and do not accept arbitrary keys. Existing entities are retained; dictionaries are reconstructed using the real constructors. In Python, use a boolean for `use_path_style_endpoint`: `True`, rather than `"true"`. In `.env`, `Env.get(...)` reads the value before entity validation.

## Validation and resolution

Validation checks the types listed above and rejects required strings that are empty or contain only whitespace. Optional cloud fields accept `None` where indicated; drivers treat their empty strings as absent. Validation does not check URL formats, buckets, credentials, or connectivity.

A nonempty `driver` can be an extension, so the entity accepts a name not yet registered. If no built-in implementation or factory resolves it, disk selection raises `DriverNotSupportedException`. Register its factory with [`Storage.extend(...)`](/en/services/storage/disks-and-drivers#custom-drivers).

The manager retains its resolved configuration and default disk. Changing an environment variable after obtaining the service does not rebuild disks; configure them before startup. Entities are immutable. `extend()` invalidates the disk cache so later resolutions use the registered factory, but does not reread the environment.

Continue with [drivers and dependencies](/en/services/storage/disks-and-drivers) for backend authentication and differences in publishing and temporary URLs.
