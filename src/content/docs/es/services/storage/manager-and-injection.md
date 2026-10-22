---
title: "Fachada e inyección de Storage"
description: "Utiliza Storage o IStorageManager desde controladores y servicios y conoce todos los métodos del manager."
editUrl: true
lastUpdated: false
---

La fachada y la inyección acceden al mismo servicio registrado por la aplicación. Importa la fachada con `from orionis.support.facades import Storage`. Para inyección, anota la dependencia con `IStorageManager`, exportado por `orionis.storage.contracts`.

<a id="facade"></a>

## Uso de la fachada

```python
from orionis.http import JSONResponse
from orionis.support.facades import Storage


class SaveReportController:
    async def __call__(self) -> JSONResponse:
        disk = Storage.disk("local")
        file = await disk.put("reports/42.txt", "Report ready")
        return JSONResponse({"disk": disk.name(), "path": file.path()})
```

El manager selecciona discos; las operaciones de archivos pertenecen al disco y sus referencias. Usa `await Storage.disk().put(...)`, no `Storage.put(...)`. `disk()` y `default()` son síncronos después de que el provider nativo haya iniciado y fijado la fachada. Importar el módulo por sí solo no inicia el contenedor; utiliza los ejemplos dentro del flujo de la aplicación.

Si utilizas un arranque personalizado y el provider diferido todavía no se ha resuelto, obtén primero `storage = await Storage.resolve()` y continúa con `storage.disk(...)`. Esta llamada asíncrona resuelve el servicio y completa su provider; evita tratar el dispatcher inicial de la fachada como si ya fuera un disco. La inyección de `IStorageManager` también realiza esa resolución. Los ejemplos de fachada de esta sección parten del arranque asíncrono completo de la aplicación.

## Inyección en el constructor

Utiliza el constructor cuando varias acciones necesitan almacenamiento. Guarda este ejemplo en `app/http/controllers/report_controller.py`:

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

Registra ambas acciones en el archivo de rutas API configurado:

```python
from app.http.controllers.report_controller import ReportController
from orionis.support.facades import Route

Route.post("/reports/{report_id:int}", [ReportController, "store"])
Route.get("/reports/{report_id:int}", [ReportController, "show"])
```

El contenedor construye el controlador, resuelve `IStorageManager` y aporta el parámetro de ruta a la acción. Un `POST /reports/42` seguido de `GET /reports/42` comprueba escritura y lectura. Los errores, como un archivo ausente, se propagan al flujo HTTP si no los manejas.

## Inyección en un método

Si solo una acción necesita Storage, recíbelo en esa acción:

```python
from orionis.http import JSONResponse
from orionis.storage.contracts import IStorageManager


class StoreExportController:
    async def __call__(self, storage: IStorageManager) -> JSONResponse:
        file = await storage.disk("local").put("exports/latest.txt", "Export")
        return JSONResponse({"path": file.path()})
```

Registra la clase como un controlador invokable según la guía de [controladores](/es/http/request-lifecycle). `storage` es una dependencia del servidor, no un campo que envía el cliente. Una llamada Python directa a `controller.__call__()` no activa inyección: el contenedor debe invocarlo o debes aportar el argumento.

## Servicios y otros componentes

El mismo contrato sirve en los constructores de servicios que el contenedor construya. Puedes consumirlos desde HTTP, comandos o componentes MCP:

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

Recibe `ReportArchive` en el componente consumidor. Para resolver explícitamente desde un provider que dispone de `self.app`, usa `storage = await self.app.make(IStorageManager)`. Los hooks `register()` y `boot()` se llaman sin parámetros adicionales: no utilizan la inyección de una acción HTTP. Consulta [providers y fachadas](/es/architecture/service-container/providers-and-facades).

## API completa del manager

<a id="manager-construction"></a>

### Construcción y registro

`StorageManager(app: IApplication) -> None` lee `app.basePath` y `app.config("filesystems")`. Convierte un diccionario a `Filesystems` y conserva entidades ya construidas. No abre todos los discos ni contacta a proveedores durante esa lectura.

El `StorageProvider` nativo registra `IStorageManager → StorageManager` como singleton y fija la fachada durante su `boot()` asíncrono. No necesitas registrar ese provider ni crear managers por petición. El singleton y su caché pertenecen a la instancia de aplicación.

<a id="manager-disk"></a>

### disk(name: str | None = None) → IDisk

Resuelve y conserva un disco por nombre. `None` y la cadena vacía seleccionan el predeterminado (`name or self._default`). La primera resolución construye el driver; las siguientes devuelven el mismo `IDisk`. La inicialización cloud es lazy: construir el disco no verifica todavía conectividad o credenciales.

```python
from orionis.support.facades import Storage


class SaveOnSelectedDisk:
    async def save(self, contents: bytes) -> str:
        disk = Storage.disk("local")
        assert disk is Storage.disk("local")
        return (await disk.put("documents/latest.bin", contents)).path()
```

Un nombre no configurado produce `DiskNotFoundException`; un driver sin implementación, `DriverNotSupportedException`. También pueden existir errores al validar la configuración antes de resolver discos. Los nombres de disco y driver no son intercambiables: `Storage.disk("memory")` no funciona sin un disco con ese nombre. La configuración nativa expone los cinco slots de [filesystems](/es/services/storage/configuration).

<a id="manager-default"></a>

### default() → IDisk

Equivale a `disk()`. Utiliza `Filesystems.default`, que el bootstrap obtiene de `FILESYSTEM_DISK` con fallback `local`. No cambia el disco predeterminado.

```python
from orionis.support.facades import Storage


class SaveOnDefaultDisk:
    async def save(self) -> str:
        file = await Storage.default().put("notes/latest.txt", "Saved")
        return file.path()
```

<a id="manager-extend"></a>

### extend(driver: str, factory: Callable[[object], IStorageDriver]) → None

Registra una factoría **síncrona** que recibe la entidad de configuración del disco y devuelve un `IStorageDriver`. Tiene prioridad sobre un driver nativo del mismo nombre. No agrega por sí misma discos a la configuración.

```python
from orionis.storage import MemoryStorageDriver
from orionis.storage.contracts import IStorageManager


class IsolatedStorageSetup:
    def configure(self, storage: IStorageManager) -> None:
        storage.extend("local", lambda config: MemoryStorageDriver())
```

El ejemplo reemplaza el driver `local` en futuras resoluciones: tanto el disco `local` como `public` se vuelven efímeros. Es una configuración para una aplicación de prueba; no la ejecutes por petición. Una llamada directa a `configure()` requiere aportar `storage`.

`extend()` vacía **toda** la caché de discos. Las referencias existentes conservan su driver anterior; no se migran datos ni se cierran recursos antiguos. Registra extensiones antes de que otros componentes conserven discos. La guía de [drivers personalizados](/es/services/storage/disks-and-drivers#custom-drivers) muestra su uso en un provider.

<a id="manager-uploaded"></a>

### uploaded(source: IHttpUploadedFile) → IUploadedFile

Adapta un archivo multipart HTTP para guardarlo en los discos de este manager. Conserva su origen; construir el adaptador no lee, guarda ni valida contenido.

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

El resultado usa el contrato de uploads de **Storage**, distinto del payload HTTP original. Consulta [uploads](/es/services/storage/streaming-and-uploads) para `store`, `storeAs`, `copy`, `move`, metadatos y cierre.
