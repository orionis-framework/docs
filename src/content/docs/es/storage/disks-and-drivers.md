---
title: "Discos, drivers y dependencias"
description: "Elige almacenamiento local, en memoria, S3, Azure Blob o Google Cloud y conoce sus capacidades y requisitos reales."
editUrl: true
lastUpdated: false
---

Un **disco** es una entrada de `config/filesystems.py`: identifica la configuración que seleccionas con `Storage.disk("s3")`. Un **driver** implementa sus operaciones: decide dónde viven los archivos y cómo se leen, escriben o publican. Varios discos pueden utilizar el mismo driver; `local` y `public` usan `local` con raíces diferentes.

## Drivers disponibles

| Driver en la configuración | Implementación | Dependencia adicional |
|---|---|---|
| `local` | `LocalStorageDriver`: archivos del sistema operativo. | Ninguna. |
| `memory` | `MemoryStorageDriver`: contenido en memoria de la instancia. | Ninguna. |
| `aws` o `s3` | `S3StorageDriver`: Amazon S3 y servicios compatibles con su API. | Extra `s3`: `boto3`. |
| `azure` | `AzureStorageDriver`: Azure Blob Storage. | Extra `azure`: `azure-storage-blob`. |
| `gcs` o `google` | `GoogleStorageDriver`: Google Cloud Storage. | Extra `gcs`: `google-cloud-storage`. |

Los aliases pertenecen al **driver**: el disco para S3 se llama `s3`, aunque su entidad utiliza `driver="aws"`. `Storage.disk("aws")` no selecciona automáticamente ese disco. Los drivers se comparan literalmente: utiliza los valores en minúsculas.

Las entradas incluidas son `local`, `public`, `s3`, `azure` y `gcs`. `memory` es un driver que puedes asignar a una de ellas, no un disco predefinido. La [configuración de filesystems](/es/storage/configuration) detalla todos sus campos, variables de entorno y validación.

<a id="packages"></a>

## Instalar dependencias con Reactor

Desde la raíz de tu aplicación, con el Python de su entorno:

```bash
python -B reactor packages
```

Su alternativa directa es:

```bash
orionis packages
```

El comando lee los extras y grupos de dependencias del manifiesto de Orionis, muestra un catálogo numerado y permite seleccionar nombres o números separados por espacios o comas. Después solicita confirmación; `0` cancela. Prioriza el manifiesto incluido con el framework o su repositorio y utiliza el `pyproject.toml` de la aplicación como alternativa si aquellos no existen.

```text
packages [options ...] [--list] [--yes | -y]
```

| Argumento u opción | Predeterminado | Uso |
|---|---|---|
| `options` | Sin selección. | Cero o más nombres, números o claves `extra:NAME` / `group:NAME`. Un nombre simple debe identificar una única opción. |
| `--list` | `False` | Muestra el catálogo y termina sin instalar. |
| `--yes`, `-y` | `False` | Confirma las opciones seleccionadas sin preguntar. |
| `-h`, `--help` | — | Muestra la ayuda del comando. |

```bash
python -B reactor packages --list
python -B reactor packages s3 --yes
python -B reactor packages azure --yes
python -B reactor packages gcs --yes
```

Puedes instalar varios extras juntos. `storage` reúne los tres SDK cloud:

```bash
python -B reactor packages extra:s3 extra:gcs -y
python -B reactor packages storage --yes
orionis packages storage --yes
```

En una terminal no interactiva debes indicar las opciones y `--yes`. Sin selección, el comando solo muestra el catálogo; con opciones pero sin confirmación termina con error. También rechaza nombres desconocidos, números fuera del catálogo y nombres ambiguos. Para automatizar, utiliza nombres en vez de posiciones numéricas.

`uv` debe estar disponible en `PATH`. Reactor ejecuta `uv pip install --python <intérprete de Reactor> -- <dependencias>`: instala en el entorno del Python que ejecuta el comando y elimina requisitos duplicados. No modifica las dependencias declaradas de la aplicación ni actualiza `uv.lock`. Para declarar el extra en un proyecto administrado con uv, utiliza la alternativa correspondiente:

```bash
uv add "orionis[s3]"
uv add "orionis[azure]"
uv add "orionis[gcs]"
uv add "orionis[storage]"
```

Instalar un extra no cambia `FILESYSTEM_DISK`, no configura credenciales ni crea buckets o contenedores.

<a id="driver-local"></a>

## Almacenamiento local

`local` resuelve raíces relativas desde la raíz de la aplicación y conserva las absolutas. El driver crea su directorio raíz al construirse por primera vez. Las entidades de configuración no crean directorios.

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

`url()` une `PUBLIC_URL` y la ruta codificada; no registra una ruta estática ni comprueba la existencia del archivo. Tu aplicación o servidor debe exponer el directorio correspondiente. La entrada `local` incluida no tiene URL base: `file.url()` lanza `UnsupportedStorageOperationException`.

La visibilidad aplica permisos POSIX al archivo: `public` utiliza `0644` y `private`, `0600`. Los directorios se crean con los permisos predeterminados del sistema; la visibilidad del archivo no cambia los de sus padres. El efecto depende del sistema operativo y no sustituye la configuración HTTP. No admite URL firmadas.

<a id="driver-memory"></a>

## Almacenamiento en memoria

Puedes asignar `memory` a una entrada existente en la fábrica de `disks`:

```python
from orionis.foundation.config.filesystems import Disks, Local


def memory_disks() -> Disks:
    return Disks(local=Local(driver="memory", path="storage/app/private"))
```

Utiliza `memory_disks` como `default_factory` del campo `disks` de `BootstrapFilesystems`. `path` sigue siendo validado por `Local`, aunque este driver no lo utiliza.

Cada instancia mantiene sus propios archivos: no comparte datos entre procesos ni persiste al reiniciar. Los flujos de escritura se reúnen en memoria. La visibilidad es metadato, sin permisos de sistema. Solo genera URL si la entrada expone `url`, como `public`; esa dirección no publica los bytes. No admite URL firmadas.

<a id="driver-s3"></a>

## Amazon S3 y servicios compatibles

Instala el extra `s3` y configura:

```dotenv
FILESYSTEM_DISK=s3
S3_BUCKET=example-media
S3_REGION=us-east-1
S3_KEY=replace-with-access-key
S3_SECRET=replace-with-secret
```

El driver entrega credenciales explícitas a boto3 únicamente cuando **ambas** están presentes; en caso contrario utiliza la cadena de credenciales del SDK. Para un endpoint compatible puedes añadir:

```dotenv
S3_ENDPOINT=http://localhost:9000
S3_USE_PATH_STYLE_ENDPOINT=true
```

`endpoint` configura la API; `url` cambia únicamente la dirección pública generada. `url()` prioriza `S3_URL`, después compone `<endpoint>/<bucket>/<archivo>` y, sin ambos, `https://<bucket>.s3.<region>.amazonaws.com/<archivo>`. Construirla no utiliza el SDK.

La visibilidad explícita se traduce a ACL `public-read` o `private`; con `None` la escritura omite la ACL. Las políticas del bucket deben admitirlas. `visibility()` inspecciona los permisos ACL del objeto, no todas las políticas de acceso posibles. `temporaryUrl()` firma una operación `get_object`.

<a id="driver-azure"></a>

## Azure Blob Storage

Instala el extra `azure` y utiliza una cadena de conexión:

```dotenv
FILESYSTEM_DISK=azure
AZURE_CONNECTION_STRING="DefaultEndpointsProtocol=https;AccountName=exampleaccount;AccountKey=replace-with-key;EndpointSuffix=core.windows.net"
AZURE_CONTAINER=documents
```

También puedes dejar vacía `AZURE_CONNECTION_STRING` y configurar `AZURE_ACCOUNT_NAME`, `AZURE_ACCOUNT_KEY` y `AZURE_CONTAINER`. La cadena tiene prioridad para crear el cliente. El driver extrae su nombre y clave de cuenta si los campos correspondientes están vacíos.

`url()` prioriza `AZURE_URL`; sin ella compone `https://<cuenta>.blob.core.windows.net/<contenedor>/<archivo>`. Sin cadena de conexión el cliente utiliza el endpoint de cuenta y la clave indicada, o `None` si falta.

La escritura ignora `visibility`: Azure no tiene visibilidad por blob en esta implementación. `visibility()` consulta el acceso del contenedor y `setVisibility()` lanza `UnsupportedStorageOperationException`. Configura el contenedor en Azure. `temporaryUrl()` genera un SAS de lectura y exige una clave de cuenta, incluida la que se extraiga de la cadena de conexión.

<a id="driver-gcs"></a>

## Google Cloud Storage

Instala el extra `gcs` y configura:

```dotenv
FILESYSTEM_DISK=gcs
GCS_PROJECT_ID=example-project
GCS_BUCKET=example-media
GCS_KEY_FILE=/secure/service-account.json
```

Con `GCS_KEY_FILE`, el SDK crea el cliente desde el archivo de cuenta de servicio. Sin él, utiliza `storage.Client(project=...)` y Application Default Credentials. El driver entrega la ruta directamente al SDK; no la resuelve contra la raíz de Storage. El constructor con archivo toma la información del proyecto desde ese archivo, en lugar de recibir `project_id` como argumento.

`url()` prioriza `GCS_URL` y, en su ausencia, compone `https://storage.googleapis.com/<bucket>/<archivo>`. La escritura con visibilidad explícita utiliza las ACL predefinidas `publicRead` o `private`; `setVisibility()` llama a `make_public()` o `make_private()`. `visibility()` revisa la ACL `allUsers`. Las políticas y credenciales del bucket deben permitir estas operaciones. `temporaryUrl()` solicita una firma V4 de lectura: las credenciales deben poder firmar.

## Diferencias entre backends

| Capacidad | Comportamiento |
|---|---|
| Directorios | Local usa directorios físicos. Memory mantiene entradas y padres implícitos. Cloud usa prefijos y objetos vacíos terminados en `/` como directorios explícitos. |
| URL pública | Local y memory necesitan una URL base; cloud deriva una dirección del proveedor. No comprueba acceso ni existencia. |
| URL temporal | Solo S3, Azure y GCS. El método del archivo recibe `expires_in=3600`, en segundos. |
| Metadatos | Fechas, ETags y checksums varían por backend. Un ETag no es necesariamente un hash del contenido; `hash()` lee los bytes para calcularlo. |
| I/O cloud | Los SDK se importan al primer uso que los necesita y sus llamadas bloqueantes se ejecutan en threads. Pueden propagarse errores del SDK de red, credenciales o permisos. |

Los constructores cloud no se conectan ni aprovisionan recursos. Resolver un disco puede funcionar y su primer I/O fallar por falta del SDK (`MissingStorageDependencyException`), configuración incompleta o permisos. Orionis no añade una política común de reintentos, failover ni transacciones entre archivos; los SDK conservan su comportamiento propio.

<a id="custom-drivers"></a>

## Registrar un driver desde un provider

`Storage.extend(driver, factory)` registra una fábrica síncrona que recibe la entidad de configuración y devuelve un `IStorageDriver`. Para una implementación nueva, implementa el [contrato completo de drivers](/es/storage/api-reference). También puedes registrar un alias de una implementación existente.

Cambia el `driver` de la entrada `local` usando esta fábrica para el campo `disks` de `BootstrapFilesystems`:

```python
from orionis.foundation.config.filesystems import Disks, Local


def scratch_disks() -> Disks:
    return Disks(local=Local(driver="scratch", path="storage/app/private"))
```

Asigna `default_factory=scratch_disks` al definir ese campo. La entidad acepta `scratch` como nombre de driver; el provider siguiente registra su implementación.

Registra la fábrica en un provider de la aplicación:

```python
from orionis.container.providers import ServiceProvider
from orionis.storage import MemoryStorageDriver
from orionis.storage.contracts import IStorageManager


class StorageDriversProvider(ServiceProvider):
    async def boot(self) -> None:
        storage: IStorageManager = await self.app.make(IStorageManager)
        storage.extend("scratch", lambda config: MemoryStorageDriver())
```

Añade `StorageDriversProvider` a la llamada existente a `app.withProviders(...)` en `bootstrap/app.py`. Después, `Storage.disk("local")` utiliza memoria con ese alias; registrar `scratch` no crea un disco llamado `scratch`.

La fábrica no es una corrutina ni recibe la aplicación; puede capturar dependencias resueltas en `boot()`. Los providers reciben `boot(self)` sin inyección de argumentos: utiliza `await self.app.make(...)`.

La fábrica tiene prioridad sobre los drivers incorporados, incluso si reutiliza un nombre existente. `extend()` vacía la caché para resoluciones posteriores; referencias a discos o archivos ya conservadas mantienen el driver anterior. Registra extensiones durante el arranque, antes de atender peticiones.

Continúa con la [configuración completa](/es/storage/configuration) y las [operaciones sobre archivos y directorios](/es/storage/files-and-directories).
