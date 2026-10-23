---
title: "IApplication: servicios y referencia"
description: "Inyecta la aplicación y consulta configuración, directorios, readiness, middleware y servicios registrados."
editUrl: true
lastUpdated: false
---

<a id="application-contract"></a>
## Recibir IApplication

Importa el contrato desde `orionis.foundation.contracts.application`. `Application` lo implementa y extiende el contenedor. Durante `create()` registra su propia instancia con el alias `x-orionis-IApplication`. Recibir el contrato no inicia otra aplicación.

Puedes inyectarlo en el constructor de un componente construido por el contenedor o en un método que Orionis invoque mediante DI. Una llamada Python directa a un método no inyecta sus parámetros automáticamente.

```python
from orionis.foundation.contracts.application import IApplication
from orionis.http import JSONResponse


class ApplicationName:
    def __init__(self, app: IApplication) -> None:
        self.app = app

    def get(self) -> str:
        return str(self.app.config("app.name"))


class RuntimeInfoController:
    async def __call__(
        self,
        app: IApplication,
        name: ApplicationName,
    ) -> JSONResponse:
        return JSONResponse({
            "name": name.get(),
            "http_ready": app.isHttpReady,
            "production": app.isProduction(),
        })
```

La aplicación inyectada en el servicio y en el controlador es la misma. Para la ruta utiliza el patrón de [la introducción](/es/application). En comandos, el mismo contrato puede declararse en `handle()`; en proveedores, consulta los límites de sus [constructores y hooks](/es/application/container/providers).

<a id="application-construction"></a>
## Application y current()

```text
Application(base_path: Path = _CWD) -> None
Application.current() -> Self | None
```

`_CWD` es el directorio capturado al importar el módulo. En `bootstrap/app.py` se pasa una raíz explícita, normalmente `Path(__file__).parent.parent`. El constructor resuelve la raíz, registra la hora inicial y prepara estados, locks y metadatos; no completa por sí solo la configuración.

El contenedor conserva una instancia por clase en cada proceso. Construir de nuevo la misma clase no crea una aplicación independiente ni cambia su raíz. `current()` devuelve la ya existente para esa clase, o `None`, sin crearla ni arrancarla; puede devolver una instancia todavía sin configuración. Prefiere `IApplication` inyectada en los componentes.

<a id="application-properties"></a>
## Propiedades de estado e identidad

Todas son de solo lectura; se consultan sin paréntesis.

| Propiedad y tipo | Resultado y alcance |
|---|---|
| `isCreated: bool` | `True` cuando termina `create()`. No significa que hayan terminado los boots async. |
| `isBooted: bool` | Alias histórico de esa misma etapa de creación. |
| `areProvidersBooted: bool` | Creación terminada y ningún eager pendiente. No incluye proveedores deferred sin resolver. |
| `isHttpReady: bool` | Eager completados y handlers ASGI/RSGI publicados. No comprueba sockets, base de datos ni salud de otros servicios. |
| `startAt: int` | Timestamp Unix en nanosegundos tomado en la primera inicialización. |
| `basePath: Path` | Raíz absoluta de la aplicación. |
| `entryPoint: str \| None` | Entrada inferida del archivo que llamó a `create()`, normalmente `bootstrap.app:app`; `None` antes de registrarla. No busca el nombre real de una variable distinta de `app`. |
| `routeHealthCheck: str` | Ruta configurada; utiliza `/up` si no se fijó o es vacía. |
| `compiled: bool` | Se activó `compile()`. **No indica que el arranque haya encontrado un archivo válido**. |
| `compiledPath: Path \| None` | Directorio de compilación, o `None` sin activarla. |
| `compiledInvalidationPathsDirs: list[Path]` | Copia de los directorios monitorizados; no se garantiza el orden de registro. |
| `compiledInvalidationPathsFiles: list[Path]` | Copia de los archivos monitorizados; modificarla no cambia el registro interno. |

Lee [ciclo de vida](/es/application/lifecycle) para distinguir creación, boot eager e inicio de un runtime.

<a id="application-config"></a>
## config(): leer y modificar valores del proceso

```text
config(key: str | None = None, value: object = _SENTINEL) -> object
resetRuntimeConfig() -> bool
```

`config()` necesita configuración inicializada; en otro caso lanza `RuntimeError`. `_SENTINEL` distingue un segundo argumento omitido de `None`: no lo importes ni lo pases manualmente. `resetRuntimeConfig()` no aplica ese guard, pero usarlo antes de crear la aplicación no sustituye su arranque ni inicializa sus servicios.

| Llamada | Efecto |
|---|---|
| `app.config()` | Devuelve el diccionario completo runtime. Es la referencia mutable del proceso, no una copia defensiva. |
| `app.config("app.name")` | Lee segmentos separados con puntos. Una clave ausente o un segmento que no sea un diccionario devuelve `None`. |
| `app.config("reports.limit", 100)` | Escribe `100` y lo devuelve; **no significa leer con default**. |
| `app.config("reports.limit", None)` | Escribe un `None` explícito. |
| `app.resetRuntimeConfig()` | Rehace una copia mutable desde el bootstrap y devuelve `True`. No recarga `.env`. |

Los nombres se separan literalmente por `.`; evita segmentos vacíos. Al escribir se crean o reemplazan diccionarios intermedios cuando hace falta. El primer acceso descongela el bootstrap: las tuplas pasan a listas; conjuntos y bytes conservan su tipo. Los conjuntos y otros objetos no tratados conservan también su identidad: `resetRuntimeConfig()` no revierte sus mutaciones internas.

La configuración es compartida por las solicitudes de la misma aplicación. **No guardes identidad del usuario, estado de una petición ni valores temporales de un comando en ella.** Tampoco modifica `.env`, `config/*.py`, el archivo compilado ni otros procesos. Un servicio construido puede haber capturado sus opciones anteriores. Usa [servicios scoped](/es/application/container/scopes-and-concurrency) para estado de una operación.

Un componente puede leer un valor opcional sin usar accidentalmente el setter:

```python
from orionis.foundation.contracts.application import IApplication


class ReportPolicy:
    def limit(self, app: IApplication) -> int:
        value = app.config("reports.limit")
        return 100 if value is None else int(value)
```

El contenedor debe invocar `limit()` para inyectar `app`. Si ya tienes la aplicación, puedes entregarla explícitamente. Define valores mediante [configuración tipada](/es/application/configuration), leyendo el entorno solo en `config/`.

<a id="application-path"></a>
## path() y routingPaths()

```text
path(key: str | None = None) -> Path | Mapping[str, Path] | None
routingPaths(key: str | None = None) -> list[Path] | dict | None
```

Ambos requieren configuración inicializada y rechazan claves distintas de `str` con `TypeError` cuando no se omiten. `path()` devuelve el mapa congelado de directorios; `path("resources_views")` devuelve una ruta y una clave desconocida, `None`. No crea ni escribe archivos.

`routingPaths()` devuelve una copia descongelada del registro de archivos. Sin clave incluye los contextos; para `api`, `web`, `console`, `ai` o `websocket` devuelve su lista de `Path`. La salud se consulta mediante `routeHealthCheck`, no `routingPaths("health")`. Cambiar la lista devuelta no registra rutas nuevas. [Directorios](/es/application/paths-and-caching) enumera todas las claves y métodos de `Directory`.

<a id="application-runtime-flags"></a>
## Entorno, debug y mantenimiento

```text
isProduction() -> bool
isDebug() -> bool
underMaintenance() -> bool
```

Requieren que termine `create()`; antes lanzan `RuntimeError`.

- `isProduction()` conserva si `"prod"` aparece en el texto de `app.env` durante creación. No es una comprobación dinámica ni una comparación exacta con un solo nombre.
- `isDebug()` conserva si `app.debug is True` durante creación. Cambiar configuración runtime no recalcula estos indicadores.
- `underMaintenance()` consulta `storage/framework/maintenance`, o `app.maintenance` como fallback. `down` lo activa y `up` lo desactiva; texto desconocido usa el fallback. Cachea el resultado hasta 100 ms en cada worker. Errores de lectura o decodificación activan mantenimiento; no es un lock distribuido.

Usa los [comandos up/down](/es/console/built-in-application) para administrar el marcador; el alcance entre procesos depende de que compartan ese archivo.

<a id="application-components"></a>
## Recuperar middleware, handler y scheduler

```text
getMiddleware() -> list[type[IBaseMiddleware]]
async getExceptionHandler() -> IBaseExceptionHandler
async getScheduler() -> IBaseScheduler
```

`getMiddleware()` devuelve las clases globales, no la cadena ya ejecutándose. Los getters async requieren la aplicación creada. Importan y conservan la **clase** configurada, pero cada llamada utiliza `build()` para crear una instancia mediante DI; no garantizan la misma instancia repetida ni inician el scheduler.

```python
from orionis.foundation.contracts.application import IApplication


class BootstrapInspector:
    async def inspect(self, app: IApplication) -> dict:
        handler = await app.getExceptionHandler()
        scheduler = await app.getScheduler()
        return {
            "middleware": [cls.__name__ for cls in app.getMiddleware()],
            "handler": type(handler).__name__,
            "scheduler": type(scheduler).__name__,
        }
```

## Configurar, arrancar y resolver

| Métodos | Referencia |
|---|---|
| `create()`, `boot()`, `on()`, `handleCommand()` | [Ciclo de vida](/es/application/lifecycle). |
| `__call__`, `__rsgi__`, `__rsgi_init__`, `__rsgi_del__` | [ASGI y RSGI](/es/application/server-entrypoints): puntos usados por el servidor. |
| `compile()` y todos los `with...` | [Opciones de bootstrap](/es/application/bootstrap). |
| `instance`, `transient`, `singleton`, `scoped`, `bound`, `make`, `build`, `invoke`, `call` | [Registro e invocación](/es/application/container/bindings-and-invocation): heredados de Container. |
| `beginScope`, `getCurrentScope` | [Scopes](/es/application/container/scopes-and-concurrency). |

<a id="foundation-core-metadata"></a>
## Mapas de componentes nativos

Estos módulos describen defaults del bootstrap; normalmente no necesitas llamarlos ni modificarlos.

| Módulo de `orionis.foundation` | API y contenido |
|---|---|
| `core_config` | `get_core_config_mapping() -> MappingProxyType` construye defaults independientes de 16 secciones. `CORE_CONFIG` es el export de compatibilidad creado al accederlo; el arranque usa la función. |
| `core_kernels` | `get_core_kernels_mapping() -> MappingProxyType`, `CORE_KERNELS`: módulo y clase de los kernels HTTP/CLI. |
| `core_providers` | `get_core_providers_mapping() -> tuple[type[IServiceProvider], ...]`, `CORE_PROVIDER_METADATA` y `CORE_PROVIDERS`: referencias y clases de proveedores nativos. |
| `core_exception_handler` | `get_core_exception_handler_mapping() -> MappingProxyType`, `CORE_EXCEPTION_HANDLER`: handler predeterminado. |
| `core_scheduler` | `get_core_scheduler_mapping() -> MappingProxyType`, `CORE_SCHEDULER`: clase base del scheduler. |
| `core_paths` | `CORE_APP_PATHS`: rutas relativas predeterminadas, enumeradas en [Directorios](/es/application/paths-and-caching). |

Los mapas de solo lectura protegen su nivel externo; no infieras inmutabilidad profunda de todas sus estructuras. Una instantánea de disco conserva metadatos compatibles, no servicios vivos.

<a id="application-api-coverage"></a>
## Cobertura verificable

El [inventario de Aplicación y Contenedor](/downloads/application-container-api-inventory.json) relaciona la API propia con sus guías. Las entidades de configuración de cada subsistema se citan desde [configuración](/es/application/configuration), manteniendo sus opciones junto al componente que las utiliza.
