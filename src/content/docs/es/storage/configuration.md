---
title: "Configuración de filesystems"
description: "Referencia de discos, entidades, variables de entorno, valores predeterminados y validación del almacenamiento."
editUrl: true
lastUpdated: false
---

`config/filesystems.py` define `BootstrapFilesystems`, una dataclass inmutable que hereda de `Filesystems`. El servicio de Storage lee esta configuración al resolverse; cada disco se construye y se conserva en caché al solicitarlo por primera vez.

<a id="filesystems"></a>

## Seleccionar el disco: Filesystems

| Campo | Tipo y predeterminado | Efecto |
|---|---|---|
| `default` | `DiskName \| str`; `FILESYSTEM_DISK`, por defecto `local`. | Disco utilizado por `Storage.disk()` y `Storage.default()`. |
| `disks` | `Disks \| dict`; fábrica `Disks(...)`. | Configuración de las cinco entradas de almacenamiento. |

<a id="diskname"></a>

### Nombres y normalización

`DiskName` contiene `LOCAL`, `PUBLIC`, `S3`, `AZURE` y `GCS`, con valores `local`, `public`, `s3`, `azure` y `gcs`. Una cadena en `default` se recorta y normaliza: `" S3 "` se convierte en `"s3"`. Otros nombres producen `ValueError`; un tipo distinto de cadena o `DiskName` produce `TypeError`.

```dotenv
FILESYSTEM_DISK=s3
```

Puedes seleccionar otro disco sin cambiar el predeterminado:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Storage


class ReportController:
    async def store(self) -> JSONResponse:
        disk = Storage.disk("local")
        report = await disk.put("reports/latest.csv", "id,total\n1,25\n")
        return JSONResponse({"disk": disk.name(), "path": report.path()})
```

La selección explícita usa el nombre tal como se recibe; utiliza `"s3"`, no `"S3"` ni `"aws"`. Un nombre no configurado produce `DiskNotFoundException`. `disk(None)` y `disk("")` usan el predeterminado. `disk()` y `default()` son síncronos; espera con `await` las operaciones de I/O del disco o archivo.

<a id="disks"></a>

## Entidades y entradas: Disks

El módulo público expone las entidades:

```python
from orionis.foundation.config.filesystems import (
    GCS, S3, Azure, DiskName, Disks, Filesystems, Local, Public,
)
```

| Campo de `Disks` | Valor admitido | Driver predeterminado |
|---|---|---|
| `local` | `Local \| dict` | `local` |
| `public` | `Public \| dict` | `local` |
| `s3` | `S3 \| dict` | `aws` |
| `azure` | `Azure \| dict` | `azure` |
| `gcs` | `GCS \| dict` | `gcs` |

Todos son opcionales en el constructor; los omitidos se crean mediante su fábrica. `Disks(local={...})` convierte ese diccionario en `Local(...)`, y lo mismo ocurre con las demás entradas. Un objeto de otro tipo, incluso `None`, produce `TypeError`. Las instancias no comparten las entidades generadas por sus fábricas.

La configuración estándar tiene cinco entradas fijas. Añadir una clave `archive` al diccionario no registra un disco y provoca `TypeError`. `Filesystems(default="archive")` también se rechaza. `extend()` amplía el registro de **drivers**, no el catálogo de discos. Para cambiar de implementación utiliza el campo `driver` de una entrada existente; una estructura más amplia exige extender las entidades y su validación de forma coherente.

<a id="local"></a>

## Disco privado: Local

| Campo | Variable y predeterminado | Tipo y efecto |
|---|---|---|
| `driver` | Sin variable; `"local"`. | `str` no vacía. Selecciona la implementación. |
| `path` | `LOCAL_PATH`; `"storage/app/private"`. | `str` no vacía. Raíz absoluta o relativa a la aplicación. |

`Local` no tiene un campo `url`. Si cambias `driver` a `memory`, la entidad sigue validando `path`, aunque ese driver no utilice la ruta.

<a id="public"></a>

## Disco público: Public

| Campo | Variable y predeterminado | Tipo y efecto |
|---|---|---|
| `driver` | Sin variable; `"local"`. | `str` no vacía. Selecciona la implementación. |
| `path` | `PUBLIC_PATH`; `"storage/app/public"`. | `str` no vacía. Raíz del disco público. |
| `url` | `PUBLIC_URL`; `"/static"`. | `str` no vacía. Base utilizada por `file.url()`. |

`Public.url` sigue siendo obligatorio para su entidad si seleccionas otro driver. Las entidades no crean directorios al validarse. El driver local crea la raíz al construirse y los padres necesarios al escribir. Configurar una URL tampoco registra una ruta estática: la aplicación o servidor debe publicar el directorio.

<a id="s3"></a>

## Amazon S3: S3

| Campo | Variable y predeterminado | Tipo y efecto |
|---|---|---|
| `driver` | Sin variable; `"aws"`. | `str` no vacía; aliases incorporados `aws` y `s3`. |
| `key` | `S3_KEY`; `""`. | `str`. Identificador de acceso; se utiliza con `secret`. |
| `secret` | `S3_SECRET`; `""`. | `str`. Clave de acceso; se utiliza con `key`. |
| `region` | `S3_REGION`; `"us-east-1"`. | `str` no vacía. Región del cliente y de la URL derivada. |
| `bucket` | `S3_BUCKET`; `""`. | `str`. Bucket de los objetos. |
| `url` | `S3_URL`; `None`. | `str \| None`. Base pública o CDN para generar URL. |
| `endpoint` | `S3_ENDPOINT`; `None`. | `str \| None`. Endpoint de la API para S3 o servicios compatibles. |
| `use_path_style_endpoint` | `S3_USE_PATH_STYLE_ENDPOINT`; `False`. | `bool`. Activa `addressing_style="path"` en boto3. |

Las credenciales y el bucket vacíos son aceptados por la entidad para permitir la configuración inicial. No demuestran que el servicio se pueda utilizar. Cuando no están presentes `key` **y** `secret`, boto3 resuelve sus propias credenciales. `url` y `endpoint` no son equivalentes: una base CDN no cambia el cliente de la API.

<a id="azure"></a>

## Azure Blob Storage: Azure

| Campo | Variable y predeterminado | Tipo y efecto |
|---|---|---|
| `driver` | Sin variable; `"azure"`. | `str` no vacía. Selecciona la implementación. |
| `connection_string` | `AZURE_CONNECTION_STRING`; `""`. | `str`. Tiene prioridad al crear el cliente si está presente. |
| `account_name` | `AZURE_ACCOUNT_NAME`; `""`. | `str`. Nombre de cuenta; se puede extraer de la cadena de conexión. |
| `account_key` | `AZURE_ACCOUNT_KEY`; `""`. | `str`. Clave de cuenta; se puede extraer de la cadena de conexión y se necesita para SAS. |
| `container` | `AZURE_CONTAINER`; `""`. | `str`. Contenedor de blobs. |
| `url` | `AZURE_URL`; `None`. | `str \| None`. Base pública que sustituye la dirección derivada. |

La entidad valida tipos, sin exigir que la cadena, cuenta o contenedor estén completos. El cliente y el servicio detectan errores de conexión o autorización al utilizarlos. `url` no sustituye el endpoint de conexión de Azure.

<a id="gcs"></a>

## Google Cloud Storage: GCS

| Campo | Variable y predeterminado | Tipo y efecto |
|---|---|---|
| `driver` | Sin variable; `"gcs"`. | `str` no vacía; aliases incorporados `gcs` y `google`. |
| `project_id` | `GCS_PROJECT_ID`; `""`. | `str`. Proyecto para el constructor sin archivo de clave. |
| `key_file` | `GCS_KEY_FILE`; `None`. | `str \| None`. Archivo JSON de cuenta de servicio, entregado directamente al SDK. |
| `bucket` | `GCS_BUCKET`; `""`. | `str`. Bucket de los objetos. |
| `url` | `GCS_URL`; `None`. | `str \| None`. Base pública que sustituye `storage.googleapis.com`. |

Si `key_file` está vacío o es `None`, el driver utiliza Application Default Credentials. Una ruta no vacía selecciona `Client.from_service_account_json(...)`; su existencia y contenido se comprueban al crear el cliente del SDK, no al construir la entidad.

## Personalizar config/filesystems.py

Conserva las fábricas con `Env.get(...)` para resolver valores del entorno. Puedes definir solo las entradas que cambian y dejar las demás con sus predeterminados. Este archivo completo personaliza las dos raíces locales:

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

Las entidades omitidas, como `S3` o `Azure`, mantienen sus fábricas de entorno. Para personalizarlas añádelas a `Disks(...)` utilizando sus campos documentados. Los campos `driver` se cambian en Python: el archivo incluido no define variables de entorno para ellos.

### Configuración con diccionarios

También se admite un diccionario equivalente. El manager convierte la raíz en `Filesystems`; esta convierte `disks` y cada entrada en sus entidades:

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

Los diccionarios no evitan la validación ni admiten claves arbitrarias. Una entidad existente se conserva; un diccionario se reconstruye mediante los constructores reales. En Python, utiliza un booleano para `use_path_style_endpoint`: `True`, no `"true"`. En `.env`, `Env.get(...)` lee el valor antes de validar la entidad.

## Validación y resolución

La validación comprueba los tipos de las tablas y rechaza cadenas obligatorias vacías o compuestas solo por espacios. Los campos cloud opcionales admiten `None` donde se indica; el driver interpreta sus cadenas vacías como ausencia. No comprueba formato de URL, buckets, credenciales ni conectividad.

Un `driver` no vacío puede ser una extensión, por lo que la entidad acepta un nombre aún no registrado. Si no existe implementación incorporada o fábrica, resolver el disco produce `DriverNotSupportedException`. Registra la fábrica con [`Storage.extend(...)`](/es/storage/disks-and-drivers#custom-drivers).

El manager conserva la configuración y el disco predeterminado resueltos. Cambiar una variable de entorno después de obtener el servicio no reconstruye los discos: ajusta la configuración antes del arranque. Las entidades son inmutables. `extend()` invalida la caché de discos para permitir nuevas resoluciones con la fábrica registrada, pero no vuelve a leer el entorno.

Continúa con [drivers y dependencias](/es/storage/disks-and-drivers) para autenticar cada backend y conocer sus diferencias de publicación y URL temporales.
