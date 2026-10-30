---
title: "Registrar eventos de aplicación"
description: "Registra eventos con Log o ILogger, consulta los canales y utiliza toda la API síncrona del servicio de logging."
editUrl: true
lastUpdated: false
---

La fachada `Log` y el contrato `ILogger` acceden al logger de la aplicación. Utilízalos desde controladores, comandos, jobs, servicios u otros componentes: el destino y el nivel de los registros los determina la [configuración de logging](/es/logging/configuration).

<a id="logger-facade"></a>

## Registrar con la fachada Log

Importa la fachada desde el módulo público. En el funcionamiento normal de la aplicación, sus métodos de escritura son **síncronos**, incluso cuando se utilizan dentro de una acción `async def`:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Log


class ImportStatusController:
    async def __call__(self, import_id: int) -> JSONResponse:
        Log.info(f"event=import-status-requested import_id={import_id}")
        return JSONResponse({"import_id": import_id, "status": "ready"})
```

Guarda el controlador en `app/http/controllers/import_status_controller.py` y registra su endpoint, por ejemplo en `routes/api.py`:

```python
from app.http.controllers.import_status_controller import ImportStatusController
from orionis.support.facades import Route

Route.get("/imports/{import_id:int}/status", ImportStatusController)
```

Con la configuración predeterminada, el evento de nivel `INFO` llega a `storage/logs/stack.log`. No añadas `await` a `Log.info(...)` después del arranque normal: el método devuelve `None`. La escritura y la rotación se ejecutan en el hilo que realiza la llamada; una acción asíncrona no convierte el acceso al archivo en I/O asíncrono.

<a id="logger-provider"></a>

### Cómo se obtiene el servicio

El proveedor nativo registra `ILogger → Logger` como **singleton**, con el alias `x-orionis-ILogger`. Su `boot()` asíncrono ejecuta `await Log.pin()`, que fija ese mismo servicio en la fachada. El arranque HTTP y CLI espera esta etapa antes de ejecutar los componentes de la aplicación; no necesitas registrar el proveedor manualmente.

`app.create()` puede dejar pendiente el boot asíncrono de los proveedores. Si integras Orionis mediante un punto de entrada propio, espera `await app.boot()` antes de utilizar la fachada como en el ejemplo. También puedes resolver e invocar directamente `ILogger`, como se muestra a continuación. El servicio mantiene métodos síncronos en ambos casos.

<a id="logger-injection"></a>

## Inyección por constructor y por método

El contrato se importa desde `orionis.logging.contracts.logger`. Utiliza inyección por constructor si varias acciones necesitan registrar eventos:

```python
from orionis.http import JSONResponse
from orionis.logging.contracts.logger import ILogger


class OrderAuditController:
    def __init__(self, logger: ILogger) -> None:
        self.logger = logger

    async def show(self, order_id: int) -> JSONResponse:
        self.logger.info(f"event=order-viewed order_id={order_id}")
        return JSONResponse({"order_id": order_id})
```

Si solo una acción necesita el servicio, decláralo en el método:

```python
from orionis.http import JSONResponse
from orionis.logging.contracts.logger import ILogger


class HealthLogController:
    async def __call__(self, logger: ILogger) -> JSONResponse:
        logger.debug("event=health-checked")
        return JSONResponse({"ok": True})
```

Registra estas acciones con la [API de rutas](/es/http/routing). El contenedor aporta `ILogger`; no es un campo del payload. El mismo contrato puede recibirse en servicios, comandos y demás componentes que el framework construya o invoque mediante su contenedor. Una llamada Python directa no inyecta argumentos automáticamente.

En un proveedor u otro componente con acceso a `IApplication`, la resolución explícita es asíncrona y el uso posterior es síncrono:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.logging.contracts.logger import ILogger


async def record_startup_check(app: IApplication) -> None:
    logger = await app.make(ILogger)
    logger.info("event=startup-check-completed")
```

La implementación devuelta es `Logger`, exportada por `orionis.logging`. Recibe **`ILogger` como dependencia** para reutilizar el singleton del proveedor. Inyectar la clase concreta `Logger` puede autoconstruir otro wrapper, porque el binding nativo está registrado por contrato. Ambos wrappers apuntan al logger estándar `__orionis__`: inicializar uno nuevo cierra y reemplaza los handlers del anterior. No construyas un logger por solicitud.

<a id="logger-write-methods"></a>

## Métodos de escritura

Estas son las cinco firmas públicas del servicio; la fachada fijada expone exactamente las mismas operaciones:

```text
debug(message: str) -> None
info(message: str) -> None
warning(message: str) -> None
error(message: str) -> None
critical(message: str) -> None
```

| Método | Cuándo utilizarlo |
| --- | --- |
| `debug` | Detalles de diagnóstico de una operación: identificadores, etapas o decisiones. |
| `info` | Eventos normales que interesa conservar, como la finalización de una importación. |
| `warning` | Una condición anómala de la que la aplicación todavía puede recuperarse. |
| `error` | Una operación fallida, aunque el proceso pueda seguir atendiendo otras. |
| `critical` | Un fallo grave que compromete una función esencial de la aplicación. |

```python
from orionis.support.facades import Log


def record_import_events(import_id: int, row_count: int) -> None:
    Log.debug(f"event=import-started import_id={import_id}")
    Log.info(f"event=import-completed import_id={import_id} rows={row_count}")
    Log.warning(f"event=import-retry-scheduled import_id={import_id}")
    Log.error(f"event=import-failed import_id={import_id}")
    Log.critical("event=import-storage-unavailable")
```

El fragmento ilustra los cinco niveles; selecciona el que corresponda al resultado real de tu operación. Un mensaje por debajo del umbral del canal se descarta. Devolver `None` no confirma que el registro se haya escrito: puede haber sido filtrado.

Cada método acepta **un único mensaje**. No admite los argumentos `*args`, `extra`, `exc_info` o `stack_info` del logger estándar. Forma la cadena antes de llamar, o utiliza [`getLogger()`](#logger-standard) si necesitas sus opciones avanzadas. No existen métodos nativos `Log.log()`, `Log.notice()` o `Log.exception()` en este contrato.

Los mensajes se reenvían sin recortar, sanear ni añadir contexto de solicitud automáticamente. La selección de campos y el tratamiento de información sensible corresponden al código que forma el mensaje. El formato incorporado es `fecha [NIVEL]: mensaje`, con fecha `%Y-%m-%d %H:%M:%S`.

<a id="logger-inspection"></a>

## Consultar nombres y canales

```text
name: str
getAvailableChannels() -> list[str]
getActiveChannels() -> list[str]
getActiveChannel() -> str | None
```

`name` vale `"__orionis__"`; es el identificador del logger estándar compartido, **no** el nombre del canal de archivos. `ILogger` lo declara como propiedad y `Logger` lo implementa mediante un atributo de clase.

| Consulta | Resultado y efecto |
| --- | --- |
| `getAvailableChannels()` | Lista nueva con las claves de `logging.channels`, en su orden de configuración. No comprueba que cada canal pueda construirse. |
| `getActiveChannels()` | Lista nueva con los nombres de los handlers registrados en el wrapper. Normalmente contiene un solo nombre. |
| `getActiveChannel()` | Primer nombre activo, o `None` si no hay handlers registrados. |

Estas consultas no inicializan el logger ni abren archivos. Justo después de construir el servicio pueden devolver canales disponibles y, a la vez, `[]` y `None` como estado activo. El primer mensaje o `getLogger()` realiza la inicialización. El fallback puede aparecer con el nombre `fallback`, aunque no exista en los canales configurados.

```python
from orionis.http import JSONResponse
from orionis.logging.contracts.logger import ILogger


class LoggingStatusController:
    async def __call__(self, logger: ILogger) -> JSONResponse:
        return JSONResponse({
            "logger": logger.name,
            "available": logger.getAvailableChannels(),
            "active": logger.getActiveChannel(),
            "active_channels": logger.getActiveChannels(),
        })
```

Es un ejemplo de inspección para una herramienta interna. El estado activo describe el wrapper; si modificas manualmente los handlers del logger estándar, esas modificaciones no actualizan su caché de nombres.

<a id="logger-switch-channel"></a>

## Cambiar el canal activo

```text
switchChannel(channel_name: str) -> bool
```

Recibe una clave exacta de `logging.channels`, por ejemplo `"daily"`. Si existe, inicializa el logger cuando sea necesario, cierra y retira los handlers actuales, y construye el del destino. Devuelve `True` si lo incorpora; además intenta registrar `Successfully switched to channel: daily` con nivel `INFO`, sujeto al filtro del nuevo canal.

```python
from orionis.support.facades import Log


def select_daily_logging() -> bool:
    if not Log.switchChannel("daily"):
        return False
    Log.info("event=logging-channel-selected channel=daily")
    return True
```

La selección afecta a **todas las operaciones que utilizan ese servicio en el proceso**, incluidas otras peticiones concurrentes. No crea un contexto de canal por solicitud y no se restaura al terminar una función. Tampoco cambia `logging.default`: `reloadConfiguration()` o la reconstrucción posterior a `close()` vuelven al predeterminado.

Si el nombre no está configurado, devuelve `False` antes de modificar el estado. Si falla la creación después de retirar los handlers, puede devolver `False` dejando el logger **sin canal activo**: no restaura el anterior automáticamente. Contiene `OSError`, `RuntimeError` y `ValueError`; no garantiza capturar cualquier tipo de error de una configuración manipulada. Comprueba el resultado y el estado antes de depender de un cambio operativo.

<a id="logger-reload"></a>

## Recargar la configuración

```text
reloadConfiguration() -> None
```

Cierra los handlers, vacía la caché de canales, vuelve a leer `app.config("logging")` y reconstruye el canal predeterminado. Finalmente emite `Logger configuration reloaded successfully` con nivel `INFO`; el umbral puede filtrarlo. Cualquier excepción durante el proceso se relanza como `RuntimeError`, conservando la causa original.

El método relee la **configuración runtime de la aplicación**. No vuelve a ejecutar `config/logging.py`, no recarga `.env` ni modifica la caché de bootstrap. Usa los mecanismos de [configuración de la aplicación](/es/application/api#application-config) para cambios de runtime deliberados:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.http import JSONResponse
from orionis.logging.contracts.logger import ILogger


class LoggingLevelController:
    async def __call__(self, app: IApplication, logger: ILogger) -> JSONResponse:
        app.config("logging.channels.stack.level", "WARNING")
        app.config("logging.default", "stack")
        logger.reloadConfiguration()
        logger.warning("event=logging-threshold-changed level=WARNING")
        return JSONResponse({"active": logger.getActiveChannel()})
```

Este ejemplo administrativo modifica el estado compartido del proceso y vuelve a `stack`. El cambio no se transmite a otros workers ni persiste por sí solo después de reiniciar la aplicación. Un fallo durante la recarga puede dejar los handlers desmontados; no es un reemplazo transaccional de la configuración.

<a id="logger-close"></a>

## Cerrar y liberar archivos

```text
close() -> None
async aclose() -> None
```

Retira y cierra los handlers, vacía la caché y elimina la referencia interna al logger. La limpieza ordinaria contiene `OSError`, `RuntimeError` y `ValueError`; los fallos de entrega de handlers con cola se recopilan y producen `LoggingDeliveryError` después de limpiar. Se puede invocar de nuevo. `__del__()` también intenta cerrar el wrapper al destruirlo, pero no sustituye una limpieza explícita cuando necesitas liberar archivos en un momento preciso.

`close()` no desregistra el singleton ni desfija `Log`. Un mensaje posterior o `getLogger()` reconstruye el canal predeterminado usando la configuración conservada por el wrapper. Por ello, no lo llames al final de cada petición.

Para cerrar explícitamente durante el ciclo de vida de una integración propia, puedes registrar un callback con DI en `bootstrap/lifespan.py`:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.foundation.enums.lifespan import Lifespan
from orionis.logging.contracts.logger import ILogger


async def close_application_logger(logger: ILogger) -> None:
    await logger.aclose()


def register_logger_shutdown(app: IApplication) -> None:
    app.on(Lifespan.SHUTDOWN, close_application_logger)
```

Llama a `register_logger_shutdown(app)` desde `bootstrap/app.py`. Los callbacks no tienen un orden de registro garantizado: otro callback que escriba después puede volver a abrir el logger. Consulta el [ciclo de vida](/es/application/lifecycle) al coordinar la limpieza de varios servicios.

<a id="logger-standard"></a>

## Acceder al logger estándar y registrar tracebacks

```text
getLogger() -> logging.Logger
```

Inicializa el servicio y devuelve el logger estándar configurado, no una copia. Úsalo para capacidades no incluidas en los cinco métodos simples, como guardar el traceback de una excepción capturada:

```python
from orionis.logging.contracts.logger import ILogger


class IntegerParser:
    def __init__(self, logger: ILogger) -> None:
        self.logger = logger

    def parse(self, raw_value: str) -> int:
        try:
            return int(raw_value)
        except ValueError:
            self.logger.getLogger().exception("event=integer-parse-failed")
            raise
```

`logger.error("...")` por sí solo no adjunta el traceback; `.exception(...)` pertenece al objeto devuelto por `getLogger()`. Capturar y registrar una excepción tampoco cambia su propagación: en este ejemplo se relanza con `raise`. Si además la registra el manejador global, habrá dos registros; decide qué componente debe responsabilizarse de reportarla.

También puedes utilizar la interpolación del logger estándar: `logger.getLogger().info("event=order-viewed order_id=%s", order_id)`. Sus handlers son los mismos que usa la fachada. El logger se configura en `DEBUG`, el handler aplica el nivel del canal y `propagate` es `False`; no reenvía automáticamente eventos a los handlers del root logger. Cambiar sus niveles o handlers afecta al resto de consumidores del proceso.

<a id="logger-constructor"></a>

## Construcción, inicialización y errores

```text
Logger(app: IApplication) -> None
```

El constructor captura `app.config("logging")`. No crea archivos todavía. La primera escritura o `getLogger()` inicializa el logger bajo un lock con doble comprobación, crea el directorio necesario y configura el handler y el formatter. La selección de archivos y sus políticas se explican en [rotación y ciclo de vida](/es/logging/rotation-and-lifecycle).

<a id="logger-errors"></a>

| Situación | Comportamiento |
| --- | --- |
| No se puede obtener la configuración al construir `Logger` | Se propaga la excepción de `app.config(...)`. |
| Falla la inicialización: directorio inaccesible, archivo bloqueado o datos inválidos | Las escrituras y `getLogger()` reciben `RuntimeError` con la causa original. |
| El nombre predeterminado no aparece en `channels` | Se crea `storage/logs/default.log` con nombre activo `fallback`. |
| El nombre existe, pero no tiene una implementación de canal | La inicialización puede terminar sin handlers; no se usa el fallback por ese motivo. |
| Falla un cambio de canal o una recarga | Se aplican las reglas de retorno y excepciones explicadas en cada método. |

La inicialización del servicio no garantiza que toda escritura posterior tenga éxito. Los handlers siguen sus propias reglas de emisión y manejo de errores de I/O; el servicio no ofrece una cola de reintentos ni una confirmación de entrega por mensaje.

<a id="logger-facade-api"></a>

## API propia e infraestructura de la fachada

`Log` expone los doce métodos de `ILogger` anteriores y `name` después de fijar la instancia. Además, conserva los métodos de infraestructura heredados de `Facade`:

| Firma | Uso y resultado |
| --- | --- |
| `Log.getFacadeAccessor() -> str` | Devuelve `"x-orionis-ILogger"`. No inicializa el logger. |
| `await Log.resolve(*args: object, **kwargs: object) -> object` | Resuelve el servicio registrado. Exige una aplicación creada; no fija por sí solo la instancia en la fachada. Los argumentos se reenvían al contenedor. |
| `await Log.pin() -> None` | Resuelve y conserva la instancia para llamadas directas; ya lo realiza el proveedor nativo. |
| `Log.unpin() -> None` | Retira la referencia fijada. No cierra archivos ni elimina el binding del servicio. |

**Sin instancia fijada**, `Log.info(...)` y los demás accesos al servicio producen una operación diferida: deben esperarse para ejecutarse. En ese estado, `await Log.info("...")` sí es válido; después de fijar la instancia debes usar la llamada síncrona. No cambies entre estos estados durante peticiones normales. Para código que deba funcionar independientemente del pinning, recibe `ILogger` o utiliza `logger = await Log.resolve()` y llama a `logger.info(...)`.

La resolución previa al estado de aplicación creada lanza `RuntimeError`; los errores de construcción o resolución del contenedor también pueden propagarse. El detalle general de este despacho está en [fachadas síncronas y asíncronas](/es/application/container/facades#facade-dispatch).

Utiliza `await logger.aclose()` al cerrar desde código async. Desde 1.1.0, la aplicación vacía automáticamente el logging configurado con cola después de los callbacks de apagado, incluso si alguno falla. No registres un callback adicional solo para ese comportamiento integrado. Los loggers independientes requieren que su propietario los cierre. Consulta [apagado del logging con cola](/es/logging/rotation-and-lifecycle#logging-async-close).
