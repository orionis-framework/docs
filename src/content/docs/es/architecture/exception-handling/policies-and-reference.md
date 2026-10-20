---
title: "Políticas de errores y referencia"
description: "Contratos, reporte, renderizado, Throwable y alcance real del manejador de excepciones en HTTP, consola, MCP, tareas y conexiones."
editUrl: true
lastUpdated: false
---

Esta referencia describe el módulo `orionis.failure` y los puntos que lo utilizan. Para configurar la clase del manejador, comienza con [Gestión de excepciones](/es/architecture/exception-handling); para implementarla, consulta [Reportar y gestionar excepciones](/es/architecture/exception-handling/handling-exceptions). La [guía de excepciones HTTP](/es/http/exceptions) explica la página de diagnóstico y las respuestas visibles desde el navegador.

## Responsabilidades del módulo

El módulo separa tres operaciones:

1. Convertir una excepción en un registro estructurado.
2. Reportar el fallo mediante el logger.
3. Presentarlo según el contexto que lo haya capturado.

`Catch` coordina esas operaciones; el manejador aporta la política. Registrar un manejador no instala un `sys.excepthook` ni captura automáticamente cualquier tarea o excepción del proceso. Cada punto de entrada decide qué errores intercepta y qué métodos del manejador utiliza.

El flujo de `Catch.exception()` es:

```text
Excepción entregada a Catch
  → Resolver el manejador en el primer uso
  → Obtener el scope activo y su valor kernel
  → await app.call(handler, "report", exception=exception)
  → CONSOLE: await app.call(handler, "handleCLI", ...)
  → HTTP: await app.call(handler, "handleHTTP", ..., request=request)
  → Otro contexto no nulo: terminar después del reporte
```

Los métodos se ejecutan en orden: el reporte debe finalizar antes de comenzar la presentación. El valor devuelto por `report()` no se utiliza como entrada de `handleHTTP()` o `handleCLI()`: ambos reciben la excepción original.

## Importaciones públicas

Utiliza la fachada para acceder al servicio registrado en una aplicación iniciada:

```python
from orionis.support.facades import Catch
```

Para implementar o recibir los contratos, estas son las importaciones disponibles:

```python
from orionis.failure.base import BaseExceptionHandler
from orionis.failure.contracts import ICatch
from orionis.failure.contracts.handler import IBaseExceptionHandler
from orionis.failure.entities import Throwable
from orionis.failure.enums import KernelContext
```

`from orionis.failure import Catch` importa la clase concreta del servicio. No es la fachada y necesita una aplicación en su constructor. La construcción directa corresponde principalmente a infraestructura y pruebas.

`orionis.failure` exporta únicamente `Catch`; `orionis.failure.contracts` exporta `ICatch`. El contrato `IBaseExceptionHandler` se importa desde su módulo `contracts.handler`.

## Catch e ICatch

### Constructor y firma

La implementación concreta se construye con `Catch(app: IApplication)`. Su operación pública es asíncrona:

```python
async def exception(
    self,
    exception: BaseException,
    request: Request | TransportAdapter | None = None,
) -> Response | None:
    ...
```

`ICatch` declara esta misma operación. Recibir el contrato por inyección permite utilizar el servicio configurado sin construir otro coordinador.

| Argumento | Propósito |
|---|---|
| `exception` | Instancia original de la excepción que debe reportarse y presentarse. |
| `request` | Petición HTTP o adaptador de transporte; necesario cuando el contexto es HTTP. |
| Retorno | Respuesta del manejador HTTP; normalmente `None` en consola o en otro contexto. |

`request=None` permite el flujo de consola. No convierte un error HTTP en un error sin petición: la política HTTP predeterminada consulta `request.wantsJson()` y necesita un objeto compatible.

### Scope y contexto

`Catch` consulta `app.getCurrentScope()` y después `await scope.get("kernel")` en cada operación.

| Situación | Resultado |
|---|---|
| No existe scope activo. | `RuntimeError("No active scope found for context retrieval.")`. |
| El scope no tiene un valor `kernel` utilizable. | `RuntimeError("No kernel found in the current scope for context retrieval.")`. |
| `kernel is KernelContext.CONSOLE`. | Reporte y presentación CLI. |
| `kernel is KernelContext.HTTP`. | Reporte y presentación HTTP. |
| Otro valor no nulo. | Reporte y retorno `None`. |

`KernelContext` define solo `CONSOLE` y `HTTP`; no contiene contextos separados para colas, MCP o Realtime. La comparación se hace con los miembros del enum, no con las cadenas `"HTTP"` o `"CONSOLE"`.

No crees un contexto ficticio para forzar una presentación. Usa el punto de entrada adecuado o llama directamente a `report()` mediante el contenedor cuando necesites exclusivamente reporte.

### Resolución y caché

`CatchProvider` registra `ICatch` como singleton con el alias `x-orionis-ICatch` y fija la fachada durante su arranque.

La primera llamada a `Catch.exception()` obtiene el manejador con `await app.getExceptionHandler()`. Un `asyncio.Lock` evita resolverlo varias veces cuando coinciden las primeras llamadas concurrentes. Después se reutiliza esa instancia.

La caché del servicio no contiene la petición ni la excepción actual. Ambas pertenecen a cada llamada y pueden coexistir entre corrutinas.

`app.getExceptionHandler()` tiene una caché distinta: conserva la clase resuelta y solicita su construcción al contenedor en cada llamada. No garantiza por sí mismo que todas las llamadas directas devuelvan la misma instancia. Esto importa en integraciones como MCP, que lo consultan directamente.

## BaseExceptionHandler e IBaseExceptionHandler

`BaseExceptionHandler` implementa el contrato abstracto `IBaseExceptionHandler` y aporta la política predeterminada. Su constructor recibe `DefaultResponses` y `IApplication` mediante el contenedor.

El contrato expone cinco métodos:

| Método | Tipo | Resultado |
|---|---|---|
| `toThrowable(exception)` | Síncrono. | `Throwable`. |
| `isExceptionIgnored(exception)` | Síncrono. | `bool`. |
| `report(exception, log)` | Asíncrono. | `Throwable \| None`. |
| `handleCLI(exception, console)` | Asíncrono. | `None`. |
| `handleHTTP(exception, request)` | Asíncrono. | `Response \| None`. |

Al implementar directamente la interfaz debes proporcionar todos sus métodos abstractos. Extender la clase base permite cambiar solo la parte necesaria y conservar las demás.

La comprobación real de `app.withExceptionHandler()` exige una **clase que herede de `IBaseExceptionHandler`**; una subclase de `BaseExceptionHandler` satisface ese contrato. No acepta una instancia ni una clase sin relación con la interfaz.

### toThrowable()

`toThrowable(exception: BaseException) -> Throwable` conserva el tipo y el traceback original, y transforma los argumentos a texto.

Cuando `exception.args` está vacío, utiliza `("",)`. `message` corresponde al primer argumento convertido a texto, no necesariamente a toda la representación de `str(exception)`.

```python
from orionis.foundation.contracts.application import IApplication


async def describe_failure(
    app: IApplication,
    exception: BaseException,
) -> dict[str, object]:
    handler = await app.getExceptionHandler()
    failure = handler.toThrowable(exception)
    return {
        "type": failure.classtype.__name__,
        "message": failure.message,
        "arguments": failure.args,
        "has_traceback": failure.traceback is not None,
    }
```

Este ayudante recibe una excepción explícita dentro de una aplicación iniciada. No la captura ni la reporta. Evita devolver ese diagnóstico directamente desde un endpoint público.

### isExceptionIgnored()

`isExceptionIgnored(exception: BaseException) -> bool` verifica que el argumento sea una instancia de `BaseException`. Para otro objeto lanza `TypeError`.

Después compara `type(exception)` con `dont_catch`: la coincidencia es por clase exacta.

### report()

```python
async def report(
    self,
    exception: BaseException,
    log: ILogger,
) -> Throwable | None:
    ...
```

La implementación base omite las clases ignoradas. Para las demás, convierte a `Throwable`, llama a `log.error()` y devuelve el registro.

El formato del mensaje es:

```text
[ExceptionClass] first_argument_as_text
```

El reporte base no envía automáticamente todos los campos de `Throwable` ni el traceback al logger. Una política de reporte propia puede hacerlo de forma deliberada.

El parámetro `log` se resuelve porque `Catch` invoca el método mediante `app.call()`. Si llamas directamente a `handler.report()`, debes suministrarlo o utilizar también el contenedor.

### handleCLI()

`async handleCLI(exception: BaseException, console: Console) -> None` omite las clases ignoradas y llama a `console.exception(exception)`.

La consola muestra el tipo, el mensaje y la traza mediante Rich, sin variables locales. Esta presentación no utiliza `app.debug` como interruptor para ocultar errores CLI.

Aunque el contrato del manejador acepta `BaseException`, `Console.exception()` valida que reciba una instancia de `Exception`. No uses la firma amplia como garantía de presentación de `KeyboardInterrupt`, `SystemExit` o cancelaciones.

### handleHTTP()

`async handleHTTP(exception, request) -> Response | None` evalúa primero las clases ignoradas, después la preferencia JSON y el mapeo de errores conocidos. Solo los errores restantes consultan `app.debug`.

| Excepción conocida | Estado | Mensaje público |
|---|---|---|
| `AuthenticationException` | 401 | `Unauthenticated` |
| `AuthorizationException` | 403 | `This action is unauthorized` |
| `RouteNotFound` | 404 | `Route not found` |
| `MethodNotAllowed` | 405 | `Method not allowed` |
| `PayloadTooLargeException` | 413 | `Payload too large` |
| `UnsupportedMediaTypeException` | 415 | `Unsupported media type` |
| `CSRFTokenMismatchException` | 419 | `CSRF token mismatch` |

El mapeo recorre el MRO de la excepción, por lo que también reconoce subclases. Ante un error de autenticación con el guard activo `token`, añade `WWW-Authenticate: Bearer`.

Estos son los estados del **manejador base**. El kernel HTTP también tiene respuestas propias para validación, límites del cuerpo y rutas fallback; no pasan todos por esta tabla. Consulta [el flujo HTTP](/es/http/exceptions).

## Excepciones ignoradas y política de reporte

`dont_catch` es un atributo de clase cuya forma predeterminada es `frozenset()`:

```python
from orionis.failure.base import BaseExceptionHandler


class QuietError(Exception):
    pass


class SpecializedQuietError(QuietError):
    pass


class QuietHandler(BaseExceptionHandler):
    dont_catch = frozenset({QuietError})
```

`QuietError` se ignora; `SpecializedQuietError` conserva la política normal porque no está enumerada. Esto difiere del mapeo HTTP, que sí considera las clases antecesoras.

:::caution[No es una opción para silenciar solamente el log]
Los métodos base `report()`, `handleCLI()` y `handleHTTP()` consultan `dont_catch`. En HTTP, una clase ignorada devuelve `None` en lugar de una respuesta. No añadas aquí una excepción que deba conservar un JSON o una página de error. Para omitir solo su log, personaliza `report()` y conserva la presentación.
:::

El módulo no transforma `None` en una respuesta segura alternativa. Los puntos del kernel que esperan un `Response` pueden fallar si el manejador no lo proporciona.

## Throwable

`Throwable` es una dataclass con `frozen=True`, `kw_only=True` y `slots=True`. Reúne los datos del fallo sin presentarlos ni serializarlos.

| Campo | Contenido |
|---|---|
| `classtype` | Clase original, por ejemplo `ValueError`. |
| `message` | Primer argumento convertido a texto; cadena vacía si no había argumentos. |
| `args` | Tupla de argumentos convertidos a texto por `toThrowable()`. |
| `traceback` | Traceback nativo o `None`. |

Se construye con argumentos nombrados. La dataclass no convierte automáticamente los valores: esa normalización la realiza `BaseExceptionHandler.toThrowable()`.

Un traceback no es una cadena JSON. Si tu integración necesita una representación textual, formatéalo explícitamente y decide dónde almacenarlo; no lo incorpores sin revisión a una respuesta pública.

## Alcance real por punto de entrada

### HTTP

El kernel intercepta `Exception` durante la construcción de la respuesta y entrega los errores correspondientes a `Catch`. La sesión web también puede presentar un error mientras permanece disponible para persistir la respuesta.

Las respuestas ya generadas, los errores durante la entrega y los protocolos especiales tienen límites propios. Registrar un manejador no amplía esas fronteras.

### Comandos y tareas programadas

Reactor establece `KernelContext.CONSOLE`. Si la ejecución de un comando lanza `Exception`, registra el fallo, llama a `Catch.exception()` y devuelve código de salida `1`.

Cuando conoce el destino, Reactor incorpora `[ClassName.method]` al argumento de la excepción antes de delegarla. El reporte del manejador puede coexistir con ese registro del comando.

Los comandos del scheduler se ejecutan mediante Reactor y conservan ese flujo. Los listeners del scheduler también pueden delegar errores a `ICatch`; su presentación depende del scope activo. Si el propio manejo del listener falla, se registra ese segundo problema.

### MCP

El dispatcher MCP utiliza el método `report()` del manejador configurado para errores internos, pero conserva las respuestas del protocolo. No llama a `handleHTTP()` ni `handleCLI()` para convertir el fallo de una herramienta en HTML o salida de consola.

Una herramienta fallida puede devolver `isError: true` con `Tool execution failed`; otros errores internos se convierten en errores JSON-RPC. Los fallos de argumentos tienen su tratamiento específico, sin convertirse en el formulario de errores HTTP 422.

La política de transporte HTTP de MCP también reporta y presenta respuestas seguras del protocolo. Incluso con debug activo, evita el presenter HTML nativo. Los fallos del propio reporte se contienen para no sustituir el error público original.

### WebSockets y Realtime

El kernel de WebSockets gestiona las excepciones del handler con un mensaje de log genérico, cierre cuando corresponde y propagación. No utiliza la página HTML de excepciones.

Las invocaciones Realtime presentan errores de protocolo como `validation_error`, `unauthorized`, `forbidden`, `timeout` o `internal_error`. El runtime no envía todas esas excepciones a `Catch`, aunque sus scopes usen el marcador HTTP.

El transporte y el protocolo determinan el canal de error. El marcador del scope por sí solo no implica que cada fallo recorra el manejador HTTP.

### Colas y trabajo posterior a la respuesta

El worker de colas registra los fallos y aplica su política de reintentos o registro de trabajos fallidos. No llama automáticamente a `Catch.exception()` para cada job. La conexión de cola `sync` propaga la excepción al llamador; este puede encontrarse dentro de HTTP o consola.

`BackgroundTask` registra el fallo mediante `Log.error()` y vuelve a lanzarlo. Los adaptadores de respuesta ejecutan este trabajo después de la entrega satisfactoria correspondiente. Un error allí no permite reemplazar una respuesta ya enviada por una página 500.

Los errores de entrega de archivos, streaming o del transporte también pueden propagarse fuera del bloque que construye la respuesta. Consulta [Respuestas HTTP](/es/http/responses).

## Seguridad, errores secundarios y cancelación

### Debug y negociación de contenido

Para errores conocidos, el manejador usa `request.wantsJson()` al elegir la representación HTML o JSON. Para errores desconocidos, el comportamiento es:

| `app.debug` | Presentación predeterminada |
|---|---|
| `False` | 500 saneado: `Internal Server Error`, con negociación HTML/JSON. |
| `True` | Página HTML de diagnóstico con excepción y contexto de la petición. |

Con debug activo, `Accept: application/json` **no evita la página HTML de diagnóstico** para una excepción desconocida. No utilices esa cabecera como mecanismo de protección.

El presenter `DefaultResponses.exception()` tampoco comprueba debug por sí mismo. Una llamada directa puede generar el diagnóstico independientemente de la política del manejador. La decisión debe tomarse antes de invocarlo.

### Fallos dentro de la política

`Catch` no envuelve `report()`, `handleHTTP()` o `handleCLI()` en otro manejador de respaldo. Si fallan la resolución, el logger o el renderer, ese nuevo error se propaga.

Un fallo en `report()` impide ejecutar la presentación. Devolver `None` desde `report()` no la impide: el coordinador no usa su retorno para decidir si continúa.

Evita llamar a `Catch.exception()` desde el propio `report()` o renderer: entrarías de nuevo en la misma política. Si integras un servicio externo de observabilidad, decide explícitamente cómo contener sus fallos.

### Cancelación y BaseException

El kernel HTTP y Reactor capturan `Exception`, no todas las subclases de `BaseException`. `asyncio.CancelledError`, `KeyboardInterrupt` y `SystemExit` no deben describirse como errores ordinarios que siempre se convierten en 500.

`Catch.exception()` acepta `BaseException` cuando se le entrega explícitamente, pero no captura por sí mismo una cancelación. Tampoco protege su reporte o renderer frente a ella.

Conserva la propagación de cancelaciones en políticas propias. Los bloques de limpieza de recursos pueden tratar `BaseException` para liberar recursos sin convertirla en una respuesta HTTP.

## Concurrencia y ciclo de vida

Mantén el estado de una petición en variables locales. La instancia conservada por `Catch` puede atender excepciones simultáneas; atributos como `self.current_request` o `self.exception` mezclarían datos de llamadas distintas.

La configuración del manejador se realiza antes del arranque. El almacenamiento de su clase y la compilación del bootstrap se explican en [Gestión de excepciones](/es/architecture/exception-handling).

Un reinicio debe aplicar cambios de código o de configuración de arranque. No trates `withExceptionHandler()` como un cambio dinámico de la política durante peticiones activas.

## Verificación de una política

Prueba por separado el reporte y la presentación. Las comprobaciones útiles cubren el contrato observable:

| Caso | Comprobar |
|---|---|
| Error de dominio personalizado. | Estado, JSON y cabeceras esperados. |
| Error desconocido en producción. | 500 sin mensaje interno ni traceback. |
| Error desconocido en debug con preferencia JSON. | Presentación de diagnóstico actual; no asumir JSON. |
| Error conocido y subclase. | Mismo mapeo público por MRO. |
| Clase ignorada y subclase no enumerada. | Coincidencia exacta y consecuencias para la respuesta. |
| Logger que falla. | El error se propaga y el renderer no se ejecuta. |
| Primeras llamadas concurrentes a Catch. | Una única resolución de la instancia conservada. |
| CLI, MCP o Realtime. | Presentación propia del punto de entrada, sin asumir HTML. |
| Respuesta ya enviada. | El fallo posterior no modifica lo recibido por el cliente. |

En pruebas de integración HTTP verifica también el envío de la respuesta, no solo el valor de `handleHTTP()`. Para MCP comprueba el resultado de herramienta o el error JSON-RPC. Para colas comprueba los intentos y el repositorio de fallidos.

Continúa con [ejemplos de personalización](/es/architecture/exception-handling/handling-exceptions) o vuelve a [Excepciones HTTP](/es/http/exceptions).
