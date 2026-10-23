---
title: "Configurar bootstrap/app.py"
description: "Constructor, compile, callbacks, rutas, proveedores, middleware, scheduler y todos los setters withConfig."
editUrl: true
lastUpdated: false
---

`bootstrap/app.py` construye y exporta la aplicación. Conserva una sola instancia, configura sus registros y termina con `app.create()`. El servidor importa ese objeto; Reactor usa el mismo bootstrap en su propio proceso.

<a id="bootstrap-order"></a>
## Orden del archivo

El proyecto distribuido construye la aplicación, activa opcionalmente compilación, registra callbacks de lifespan, define rutas, selecciona scheduler y handler, declara proveedores y middleware, y llama a `create()`.

Los `with...` devuelven `Self`. `compile()` devuelve `None`: úsalo en una instrucción independiente. Una instantánea válida restaurada por `compile()` hace que los `with...` reutilicen el bootstrap y retornen sin aplicar cambios. Sin esa instantánea, modificar estos registros después de congelarlos produce `RuntimeError`.

Los callbacks `on()` permanecen en memoria y no se serializan. Regístralos antes de su evento; el código no exige que sea antes de `create()`.

<a id="bootstrap-construction"></a>
## Constructor y raíz

En `bootstrap/app.py`:

```python
from pathlib import Path
from orionis import Application

app = Application(base_path=Path(__file__).parent.parent)
```

La raíz permite resolver configuración, rutas, proveedores y almacenamiento. La instancia se conserva por clase y proceso. La firma y sus propiedades están en [IApplication](/es/application/api#application-construction).

<a id="bootstrap-compile"></a>
## compile(): persistencia

```text
compile(path: str | None = None,
        invalidation_paths: list[str] | None = None) -> None
```

```python
app.compile(
    path="storage/framework/bootstrap",
    invalidation_paths=["app", "bootstrap", "config", "routes", ".env"],
)
```

Por omisión usa `storage/framework/cache`; el proyecto generado selecciona `storage/framework/bootstrap`. Las rutas que no existen al registrarse se ignoran; créalas antes de incluirlas en la vigilancia. Los directorios aportan archivos Python; `.env` debe incluirse explícitamente. Puede restaurar inmediatamente los metadatos desde el archivo `config`.

[Directorios y caché](/es/application/paths-and-caching) explica su alcance por proceso, servidor y tarea de Fargate. [Entorno](/es/environment/compiled-configuration) detalla JSON, invalidación y cambios de variables.

<a id="bootstrap-on"></a>
## on(): callbacks

```text
on(lifespan: Lifespan, *callbacks: Callable[..., Any] |
   Callable[..., Awaitable[Any]], runtime: Runtime | None = None) -> Self
```

Acepta `Lifespan.STARTUP` y `Lifespan.SHUTDOWN`; `Runtime.HTTP`, `Runtime.CLI` o `None` para ambos. Exige al menos un callable. Un evento o callback incompatible produce `TypeError`; ningún callback, `ValueError`. Un runtime hashable ajeno al registro se trata como global: utiliza el enum para evitar ese fallback.

```python
from orionis.foundation.enums import Lifespan, Runtime
from orionis.foundation.contracts.application import IApplication


async def prepare_http(app: IApplication) -> None:
    # Initialize application-owned resources here.
    pass


app.on(Lifespan.STARTUP, prepare_http, runtime=Runtime.HTTP)
```

Se invocan mediante DI y se almacenan en conjuntos: el orden no está garantizado y un mismo callable no se duplica dentro del conjunto. [Ciclo de vida](/es/application/lifecycle) explica su ejecución y los errores.

<a id="bootstrap-routing"></a>
## withRouting(): todos los contextos

```text
withRouting(
    api: str | list[str] | None = None,
    web: str | list[str] | None = None,
    console: str | list[str] | None = None,
    health: str | None = None,
    ai: str | list[str] | None = None,
    *, websocket: str | list[str] | None = None,
) -> Self
```

| Argumento | Propósito |
|---|---|
| `api` | Archivos de rutas HTTP sin el estado web predeterminado. |
| `web` | Archivos de rutas HTTP con su capa web. |
| `console` | Registros de comandos por rutas de Reactor. |
| `ai` | Archivos de registros MCP. |
| `websocket` | Rutas WebSocket y Realtime; solo por nombre. |
| `health` | URL de salud, no archivo. Sin valor efectivo, `routeHealthCheck` utiliza `/up`. |

Las listas conservan el orden. `None` produce una lista vacía; no se admiten tuplas. Cada llamada sustituye **todos** los contextos: llamadas parciales sucesivas no acumulan opciones.

```python
app.withRouting(
    api=["routes/api.py", "routes/admin.py"],
    web="routes/web.py",
    console="routes/console.py",
    ai="routes/ai.py",
    websocket="routes/websocket.py",
    health="/up",
)
```

Crea `routes/admin.py` antes de utilizarlo. Los archivos se resuelven respecto a `basePath`, deben existir y cumplir la validación de imports de `orionis.support.facades`, o ser un archivo vacío admitido. Un tipo incompatible produce `TypeError`; un archivo ausente, `FileNotFoundError`. Las órdenes de reparación bootstrap pueden permitir temporalmente el archivo ausente del contexto reparado.

La sintaxis de los registros se documenta en [Rutas HTTP](/es/http/routing), [consola](/es/console/command-routing), [MCP](/es/mcp) y [Realtime](/es/realtime).

<a id="bootstrap-providers"></a>
## withProviders(): servicios

```text
withProviders(*providers: type[IServiceProvider]) -> Self
```

Recibe clases compatibles, no instancias. La aplicación carga además proveedores nativos y descubre clases concretas en `app_providers`. Eager y deferred tienen distintos tiempos de construcción y boot; consulta [Proveedores](/es/application/container/providers) para creación, orden y DI.

```python
from app.providers.app_service_provider import AppServiceProvider

app.withProviders(AppServiceProvider)
```

<a id="bootstrap-middleware"></a>
## withMiddleware(): middleware global HTTP

```text
withMiddleware(*middleware: type[IBaseMiddleware]) -> Self
getMiddleware() -> list[type[IBaseMiddleware]]
```

Añade clases conservando el orden y evitando duplicados por módulo/clase. Rechaza instancias y clases ajenas al contrato con `TypeError`. No inicia la cadena ni configura middleware de comandos CLI.

```python
from app.http.middleware.global_middleware import GlobalMiddleware

app.withMiddleware(GlobalMiddleware)
```

[Middlewares](/es/http/middleware) explica cómo el kernel combina este registro con su capa nativa y los middleware de rutas.

<a id="bootstrap-exceptions"></a>
## withExceptionHandler(): manejador global

```text
withExceptionHandler(handler: type[IBaseExceptionHandler]) -> Self
```

Sustituye el descriptor por la clase elegida; tipos o clases incompatibles producen `TypeError`.

```python
from app.exceptions.handler import ExceptionHandler

app.withExceptionHandler(ExceptionHandler)
```

`await app.getExceptionHandler()` lo construye mediante DI después de crear la aplicación. Consulta [Manejo de excepciones](/es/exceptions) para personalizarlo.

<a id="bootstrap-scheduler"></a>
## withScheduler(): clase de agenda

```text
withScheduler(scheduler: type[IBaseScheduler]) -> Self
```

Sustituye la clase de agenda. Requiere una subclase de `IBaseScheduler`; en otro caso produce `TypeError`.

```python
from app.console.scheduler import Scheduler

app.withScheduler(Scheduler)
```

`await app.getScheduler()` construye su instancia. Registrarla o crear la aplicación no inicia un reloj: [Schedule y tareas](/es/console/task-scheduling) explica `tasks()`, `Schedule.command()` y `schedule:work`.

<a id="bootstrap-config-setters"></a>
## withConfig...(): valores por sección

Todas estas firmas son síncronas y devuelven `Self`:

| Firma | Sección |
|---|---|
| `withConfigApp(**app_config: object) -> Self` | `app` |
| `withConfigAuth(**auth_config: object) -> Self` | `auth` |
| `withConfigMcp(**mcp_config: object) -> Self` | `mcp` |
| `withConfigCache(**cache_config: object) -> Self` | `cache` |
| `withConfigHttp(**http_config: object) -> Self` | `http` |
| `withConfigDatabase(**database_config: object) -> Self` | `database` |
| `withConfigFilesystems(**filesystems_config: object) -> Self` | `filesystems` |
| `withConfigLogging(**logging_config: object) -> Self` | `logging` |
| `withConfigMail(**mail_config: object) -> Self` | `mail` |
| `withConfigQueue(**queue_config: object) -> Self` | `queue` |
| `withConfigSession(**session_config: object) -> Self` | `session` |
| `withConfigTesting(**testing_config: object) -> Self` | `testing` |

Otra llamada al mismo setter reemplaza su diccionario pendiente. Al cargar se combinan defaults nativos, overrides y dataclasses descubiertas de `config/`, en ese orden. Los archivos de proyecto pueden reemplazar lo pasado en bootstrap. El setter no construye inmediatamente una entidad ni garantiza validar cualquier keyword: usa los campos del subsistema.

```python
app.withConfigApp(name="Reports", debug=False)
```

Este override resulta efectivo si ninguna dataclass lo reemplaza; en un proyecto generado normalmente edita `config/app.py`. Las secciones `hashing`, `realtime`, `scheduler` y `view` no tienen un setter específico en esta API: configura sus archivos.

<a id="bootstrap-paths"></a>
## withConfigPaths(): directorios

```text
withConfigPaths(**paths: str | Path | None) -> Self
```

Usa claves reales como `app_http_controllers` o `resources_views`. Un string relativo se resuelve respecto a `basePath`; un `Path` relativo, respecto al directorio de trabajo. `None` y tipos no tratados utilizan el predeterminado; las claves desconocidas no se incorporan. `root` siempre procede de `basePath`.

```python
app.withConfigPaths(
    resources_views="resources/templates",
    app_http_controllers="app/http/handlers",
)
```

Reconstruye el registro entero: otra llamada parcial puede devolver otros paths a sus defaults. Cambiar `app` no relocaliza las demás claves, definidas independientemente. No crea carpetas. [Directory](/es/application/paths-and-caching) enumera el registro completo.

<a id="bootstrap-create"></a>
## create(), boot() y ejecución

`create() -> Self` completa configuración y registro. `await boot() -> Self` añade la espera de eager async para integraciones sin servidor; no ejecuta hooks ni kernels. Los [puntos de entrada](/es/application/server-entrypoints) y el [ciclo de vida](/es/application/lifecycle) explican startup/shutdown HTTP y CLI.

Los kernels predeterminados provienen de metadatos nativos. No existe un método `withKernel()` ni una opción de protocolo en el constructor: ASGI/RSGI se seleccionan en el servidor.
