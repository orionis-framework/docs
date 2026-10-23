---
title: "Reportar y gestionar excepciones"
description: "Personaliza el handler global, separa reporte y presentación, conserva la inyección de dependencias y gestiona fallos desde HTTP, consola y servicios."
editUrl: true
lastUpdated: false
---

Una excepción comunica que una operación no pudo completarse. Puedes capturarla cuando dispones de una recuperación concreta; si dejas que se propague, el punto de entrada de Orionis decide cómo reportarla y cómo representar el fallo.

El handler de aplicación reúne esa política. No sustituye la validación de datos ni convierte todos los errores del proceso en una respuesta HTTP. Su uso depende del componente que entrega la excepción: un comando, una petición HTTP o un protocolo con su propia presentación.

Esta guía desarrolla la personalización del handler. Para la página que aparece durante una petición y las diferencias entre desarrollo y producción, consulta [Excepciones HTTP](/es/http/exceptions). El [índice general](/es/architecture/exception-handling) explica el registro y la arquitectura del módulo.

<a id="handler-application"></a>

## Partir del handler de la aplicación

El proyecto utiliza `app/exceptions/handler.py`. Heredar de `BaseExceptionHandler` permite modificar una parte de la política y delegar las demás mediante `super()`:

```python
from typing import ClassVar

from orionis.console import Console
from orionis.failure.base import BaseExceptionHandler
from orionis.failure.entities import Throwable
from orionis.http import Request, Response
from orionis.http.adapters.request.contracts.transport import TransportAdapter
from orionis.logging.contracts import ILogger


class ExceptionHandler(BaseExceptionHandler):
    dont_catch: ClassVar[frozenset[type[BaseException]]] = frozenset()

    async def report(
        self,
        exception: BaseException,
        log: ILogger,
    ) -> Throwable | None:
        return await super().report(exception, log)

    async def handleCLI(
        self,
        exception: BaseException,
        console: Console,
    ) -> None:
        await super().handleCLI(exception, console)

    async def handleHTTP(
        self,
        exception: BaseException,
        request: Request | TransportAdapter,
    ) -> Response | None:
        return await super().handleHTTP(exception, request)
```

Este ejemplo conserva la política nativa. Los tres métodos son asíncronos y deben esperarse cuando se delega en ellos. Los métodos auxiliares `toThrowable()` e `isExceptionIgnored()` son síncronos.

El archivo base del proyecto anota `exception: Exception` y `request: Request`. El contrato acepta `BaseException` y, para HTTP, también un `TransportAdapter`: puede ocurrir un error antes de que el kernel termine de construir el objeto `Request`. La unión del ejemplo conserva ambos casos.

Registra la clase en `bootstrap/app.py` antes de llamar a `app.create()`:

```python
from app.exceptions.handler import ExceptionHandler

app.withExceptionHandler(ExceptionHandler)
```

La variable `app` es la instancia ya creada en ese archivo. Se registra una **clase**, no `ExceptionHandler()`. El contenedor construye el handler con sus dependencias; la clase base necesita `DefaultResponses` e `IApplication`.

No hace falta sobrescribir todos los métodos: puedes conservar únicamente el método que cambies. Si defines tu propio constructor, conserva las dependencias que requiere la clase base y llama a `super().__init__(...)`.

<a id="handler-contract"></a>

### Contrato y puntos de extensión

Estas son las firmas de `BaseExceptionHandler`. El contrato `IBaseExceptionHandler` declara los mismos cinco métodos; en `handleCLI()` anota el servicio de salida como `IConsole`, mientras que la implementación recibe `Console`.

```python
def __init__(
    self,
    default_responses: DefaultResponses,
    application: IApplication,
) -> None: ...

def toThrowable(self, exception: BaseException) -> Throwable: ...

def isExceptionIgnored(self, exception: BaseException) -> bool: ...

async def report(
    self, exception: BaseException, log: ILogger,
) -> Throwable | None: ...

async def handleCLI(
    self, exception: BaseException, console: Console,
) -> None: ...

async def handleHTTP(
    self, exception: BaseException, request: Request | TransportAdapter,
) -> Response | None: ...
```

Este bloque es una referencia de firmas, no otro handler para copiar. Ninguno de estos parámetros tiene valor predeterminado. Sobrescribe `report()` para cambiar el registro, los métodos `handle...()` para cambiar la presentación y los dos auxiliares para modificar la conversión o la política de exclusión.

<a id="handler-injection"></a>

### Inyectar dependencias en el constructor y los métodos

La aplicación construye el handler mediante `await app.build(...)`: puede resolver dependencias anotadas en su constructor. Por ejemplo, define un servicio concreto en `app/services/failure_messages.py`:

```python
class FailureMessages:
    def orderConflict(self) -> str:
        return "The order has already been processed."
```

Esta variante de `app/exceptions/handler.py` recibe ese servicio junto con las dependencias de la clase base:

```python
from app.services.failure_messages import FailureMessages
from orionis.failure.base import BaseExceptionHandler
from orionis.foundation.contracts.application import IApplication
from orionis.http.default.responses import DefaultResponses


class ExceptionHandler(BaseExceptionHandler):
    def __init__(
        self,
        default_responses: DefaultResponses,
        application: IApplication,
        messages: FailureMessages,
    ) -> None:
        super().__init__(default_responses, application)
        self.messages = messages
```

`FailureMessages` es una clase concreta sin dependencias y se puede construir automáticamente. Para una interfaz o una implementación con configuración propia, registra el servicio en un [proveedor](/es/architecture/service-container/providers-and-facades). No añadas argumentos obligatorios sin tipo esperando que el contenedor adivine su valor.

Los métodos también admiten dependencias adicionales anotadas: por ejemplo, puedes añadir `messages: FailureMessages` a `handleCLI()` y usar `messages.orderConflict()`. `Catch` invoca los métodos mediante `app.call()`, por lo que la inyección ocurre en cada llamada. Una invocación directa como `await handler.handleCLI(error, console)` no inyecta argumentos adicionales: debes proporcionarlos tú.

<a id="handler-dispatch"></a>

## Separar reporte y presentación

Cuando `Catch.exception()` recibe una excepción en un scope válido, ejecuta:

1. `report(exception, log)`.
2. `handleCLI(exception, console)` para el kernel de consola, o `handleHTTP(exception, request)` para HTTP.
3. Devuelve el resultado de la presentación. En un contexto diferente de esos dos, solo reporta.

El resultado de `report()` no controla el segundo paso. Retornar `None` desde ese método **no impide** que se llame a `handleHTTP()` o `handleCLI()`.

La implementación predeterminada obtiene el logger estándar con `log.getLogger()` y escribe un único registro de nivel error con el formato `[ExceptionClass] message`. Entrega además `exc_info=(type(exception), exception, throwable.traceback)`: conserva el traceback original, las excepciones encadenadas y las notas incluso fuera del bloque `except` que recibió el error. El formato final y la conservación del archivo corresponden a [Logs](/es/services/logging).

El logging y la presentación son operaciones distintas: un log no es la respuesta del cliente, y generar una respuesta no garantiza por sí mismo que se haya registrado el fallo. Las anotaciones de retorno describen el contrato; `Catch` no verifica que tu sobrescritura haya devuelto realmente un `Throwable` o un `Response`.

El contenedor invoca estos métodos mediante `app.call(...)`. Proporciona `exception` y, en HTTP, `request` explícitamente; las anotaciones de `ILogger` y `Console` permiten resolver los demás argumentos. Usa esas firmas en tus sobrescrituras y pasa las dependencias explícitamente cuando llames a `super()`.

<a id="handler-domain-policy"></a>

## Convertir un conflicto de dominio en una respuesta

Una excepción de dominio expresa un fallo propio de la aplicación. Por ejemplo, una orden ya procesada puede necesitar una respuesta 409 sin exponer detalles internos.

Define la excepción en `app/exceptions/order_conflict.py`:

```python
class OrderConflict(Exception):
    pass
```

Personaliza `app/exceptions/handler.py`:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.failure.base import BaseExceptionHandler
from orionis.http import JSONResponse, Request, Response
from orionis.http.adapters.request.contracts.transport import TransportAdapter


class ExceptionHandler(BaseExceptionHandler):
    async def handleHTTP(
        self,
        exception: BaseException,
        request: Request | TransportAdapter,
    ) -> Response | None:
        if self.isExceptionIgnored(exception):
            return None

        if isinstance(exception, OrderConflict):
            return JSONResponse(
                {"message": "Order already processed"},
                status_code=409,
            )

        return await super().handleHTTP(exception, request)
```

El mensaje enviado al cliente se define deliberadamente en el handler. La respuesta no incluye los argumentos internos ni el traceback de `OrderConflict`. El resto de las excepciones conserva los estados y la presentación nativos.

Un controlador puede lanzar la excepción sin construir la respuesta:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.http import JSONResponse


class OrderController:
    async def confirm(self, order_id: int) -> JSONResponse:
        if order_id == 42:
            raise OrderConflict("Order 42 has already been processed")

        return JSONResponse({"order_id": order_id, "confirmed": True})
```

Registra la acción en `routes/api.py`:

```python
from app.http.controllers.order_controller import OrderController
from orionis.support.facades import Route

Route.post("/orders/{order_id:int}/confirm", [OrderController, "confirm"])
```

En este ejemplo didáctico, `POST /orders/42/confirm` devuelve 409 y `{"message": "Order already processed"}`. Para otros identificadores devuelve 200. El handler heredado todavía reporta el conflicto antes de construir el JSON.

<a id="handler-reporting"></a>

## Cambiar el reporte conservando la respuesta

Para tratar un conflicto esperado como advertencia, sobrescribe `report()`. Esta variante sustituye el reporte del caso conocido y delega el resto:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.failure.base import BaseExceptionHandler
from orionis.failure.entities import Throwable
from orionis.logging.contracts import ILogger


class ExceptionHandler(BaseExceptionHandler):
    async def report(
        self,
        exception: BaseException,
        log: ILogger,
    ) -> Throwable | None:
        if self.isExceptionIgnored(exception):
            return None

        if isinstance(exception, OrderConflict):
            throwable = self.toThrowable(exception)
            log.warning(f"[{throwable.classtype.__name__}] {throwable.message}")
            return throwable

        return await super().report(exception, log)
```

Integra este método en el handler anterior si quieres conservar su respuesta 409. Evita llamar a `super().report()` para el mismo caso después de escribir tu propio log, salvo que busques registrar dos entradas.

También puedes omitir únicamente el log de una excepción esperada: retorna `None` en su rama de `report()` y conserva `handleHTTP()`. La presentación continuará. Esto difiere de añadir la excepción a `dont_catch`.

`ILogger.error(message)` y `ILogger.warning(message)` son métodos síncronos; no llevan `await` ni aceptan un diccionario de contexto como segundo argumento. El destino y el nivel efectivo dependen de la [configuración de logging](/es/services/logging), no de `app.debug`.

El ejemplo de advertencia anterior escribe solo un mensaje. Si necesitas conservar el traceback también en esa rama, utiliza el logger estándar que expone el servicio:

```python
log.getLogger().warning(
    "[%s] %s",
    throwable.classtype.__name__,
    throwable.message,
    exc_info=(type(exception), exception, throwable.traceback),
)
```

Sustituye la llamada `log.warning(...)` dentro de la rama que ya define `throwable`; el resto de `report()` permanece igual. El mismo logger se puede obtener con `Log.getLogger()` importando la fachada desde `orionis.support.facades`. No cambies el canal compartido para una sola excepción: eso altera el logger utilizado por otras operaciones.

Si `report()` lanza otra excepción, `Catch` no alcanza la presentación. Cuando agregues un servicio externo de observabilidad, define qué hacer si ese servicio falla; no permitas que sustituya involuntariamente el error original.

<a id="handler-cli"></a>

## Personalizar la salida de consola

El mismo error de dominio puede tener una representación breve en consola:

```python
from app.exceptions.order_conflict import OrderConflict
from app.services.failure_messages import FailureMessages
from orionis.console import Console
from orionis.failure.base import BaseExceptionHandler


class ExceptionHandler(BaseExceptionHandler):
    async def handleCLI(
        self,
        exception: BaseException,
        console: Console,
        messages: FailureMessages,
    ) -> None:
        if self.isExceptionIgnored(exception):
            return

        if isinstance(exception, OrderConflict):
            console.warning(messages.orderConflict())
            return

        await super().handleCLI(exception, console)
```

Combina este método con los anteriores en una sola clase si necesitas las tres políticas. `handleCLI()` presenta el error; no transforma una ejecución fallida en exitosa.

Por ejemplo, un comando en `app/console/commands/check_order_command.py` puede propagar el conflicto:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.console.base import BaseCommand


class CheckOrderCommand(BaseCommand):
    signature = "orders:check"
    description = "Demonstrate an order conflict."

    async def handle(self) -> None:
        raise OrderConflict("Order 42 has already been processed")
```

`orionis orders:check` y `python -B reactor orders:check` ejecutan ese comando. Reactor registra que la ejecución falló, llama al servicio `Catch` y devuelve código 1. El reporte general del handler puede producir otra entrada además del mensaje propio de Reactor.

La implementación base de `handleCLI()` utiliza `Console.exception()` para mostrar tipo, mensaje y contexto del traceback; configura un máximo de un frame, una línea adicional de código y no muestra variables locales. Los errores controlados por tu rama personalizada pueden tener una presentación distinta.

Aunque el contrato del handler acepta `BaseException`, `Console.exception()` exige una instancia de `Exception`. Una llamada manual con `SystemExit`, `KeyboardInterrupt` u otra subclase directa de `BaseException` no obtiene por ello una presentación CLI válida: puede producir `TypeError`. La captura del flujo habitual de comandos usa `except Exception`.

<a id="handler-ignore"></a>

## Excluir un tipo o una familia de excepciones

`dont_catch` es un atributo de clase cuyo valor inicial es `frozenset()`. La implementación de `isExceptionIgnored()` valida que recibió una instancia de `BaseException` y consulta **la clase exacta**:

```python
from typing import ClassVar

from app.exceptions.order_conflict import OrderConflict
from orionis.failure.base import BaseExceptionHandler


class ExceptionHandler(BaseExceptionHandler):
    dont_catch: ClassVar[frozenset[type[BaseException]]] = frozenset({
        OrderConflict,
    })
```

Con esta clase, los métodos heredados omiten tanto el reporte como la presentación de `OrderConflict`. `report()` y `handleHTTP()` devuelven `None`; `handleCLI()` termina sin imprimir. Una subclase de `OrderConflict` **no queda excluida** automáticamente.

Esto no vuelve a lanzar la excepción ni modifica los bloques `except` del kernel. Tampoco garantiza una respuesta HTTP exitosa: el componente que llamó a `Catch` decide cómo trata el retorno `None`. Úsalo cuando conozcas el comportamiento de ese límite de ejecución; para omitir solo el log, personaliza únicamente `report()`.

Si deliberadamente quieres excluir una familia completa, sobrescribe el auxiliar en lugar de depender de la pertenencia exacta:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.failure.base import BaseExceptionHandler


class ExceptionHandler(BaseExceptionHandler):
    def isExceptionIgnored(self, exception: BaseException) -> bool:
        return (
            super().isExceptionIgnored(exception)
            or isinstance(exception, OrderConflict)
        )
```

Esta variante conserva la validación de entrada y las exclusiones exactas de la clase base, y añade las subclases de `OrderConflict`. Las ramas personalizadas de `report()` y `handle...()` deben llamar al auxiliar si quieres que respeten esa política: `Catch` no aplica un filtro externo antes de invocarlas.

La búsqueda de estados HTTP nativos tiene una regla diferente: recorre el MRO y admite subclases de las excepciones reconocidas. Por eso heredar de una excepción nativa puede conservar su estado HTTP sin quedar excluido por un `dont_catch` que solo contiene la clase padre.

<a id="handler-throwable"></a>

## Trabajar con Throwable

`toThrowable(exception)` crea un registro estructurado. No reporta ni presenta la excepción por sí mismo.

| Campo | Contenido |
| --- | --- |
| `classtype` | Clase concreta de la excepción. |
| `message` | Primer argumento convertido a texto; cadena vacía si no hay argumentos. |
| `args` | Tupla de todos los argumentos convertidos a texto. |
| `traceback` | Traceback nativo de Python, o `None` si no existe. |

La dataclass es congelada, usa slots y requiere argumentos por nombre. `traceback` no es una cadena JSON ni se formatea automáticamente. `Throwable.message` puede diferir de `str(exception)` cuando la excepción tiene varios argumentos o personaliza su representación.

```python
from orionis.failure.base import BaseExceptionHandler
from orionis.failure.entities import Throwable


class ExceptionHandler(BaseExceptionHandler):
    def toThrowable(self, exception: BaseException) -> Throwable:
        original = super().toThrowable(exception)
        return Throwable(
            classtype=original.classtype,
            message=f"Application failure: {original.message}",
            args=original.args,
            traceback=original.traceback,
        )
```

Esta variante cambia el resumen que usa el reporte heredado; no cambia la excepción original ni la respuesta HTTP o CLI que se construye a partir de ella. Tampoco es un mecanismo de anonimización: el traceback y los argumentos originales pueden seguir conteniendo información interna.

Puedes usar la conversión desde un servicio para preparar tu propio resumen:

```python
from orionis.foundation.contracts.application import IApplication


class FailureSummaryService:
    async def summarize(
        self,
        exception: BaseException,
        app: IApplication,
    ) -> dict[str, object]:
        handler = await app.getExceptionHandler()
        throwable = handler.toThrowable(exception)

        return {
            "type": throwable.classtype.__name__,
            "message": throwable.message,
            "arguments": list(throwable.args),
            "has_traceback": throwable.traceback is not None,
        }
```

Invoca este método mediante el contenedor, o pasa `app` explícitamente. Para `ValueError("invalid value", 7)`, el resumen contiene `message="invalid value"` y `arguments=["invalid value", "7"]`. Conserva esos datos para diagnósticos internos: convertirlos no elimina información sensible.

<a id="handler-recovered-errors"></a>

## Reportar un error ya recuperado

Cuando tu código ya resolvió un fallo y solo necesita notificarlo, llama únicamente a `report()` mediante el contenedor:

```python
from orionis.foundation.contracts.application import IApplication


class FailureReporter:
    async def report(
        self,
        exception: BaseException,
        app: IApplication,
    ) -> None:
        handler = await app.getExceptionHandler()
        await app.call(handler, "report", exception=exception)
```

Esto requiere la aplicación iniciada y sus dependencias disponibles, pero no selecciona un renderer ni consulta el valor `kernel`. Resulta útil en un servicio con recuperación local. No vuelvas a reportar el mismo error si luego vas a propagarlo hacia otro componente que ya lo reporta.

<a id="handler-concurrency"></a>

## Mantener el handler seguro entre operaciones

`await app.getExceptionHandler()` conserva la clase resuelta y construye una nueva instancia con cada llamada. En cambio, el servicio `Catch` es singleton y conserva el primer handler que obtiene; utiliza un lock para evitar construir varios durante su primera resolución concurrente.

Por eso el handler utilizado por el flujo normal puede atender varias peticiones o comandos concurrentes. Mantén la excepción, la petición y los resultados de cada operación en variables locales. No asignes `self.request`, `self.exception` o un `Throwable` por operación a una instancia compartida. Las dependencias guardadas en el constructor también deben ser adecuadas para ese tiempo de vida; recibir una dependencia scoped en el constructor no vuelve scoped al handler retenido por `Catch`.

Usa inyección en los métodos para dependencias que deben resolverse en el scope de la llamada actual. Pasar directamente `exception` y `request` evita conservar datos de otra petición. No hay un reinicio automático de los atributos personalizados entre errores.

<a id="handler-boundaries"></a>

## Decidir dónde gestionar el fallo

Captura una excepción cerca de la operación cuando puedes recuperarte, aplicar una alternativa o añadir contexto antes de relanzarla. Deja la presentación transversal al handler cuando no existe recuperación local.

Las extensiones verificadas son `report()`, `handleCLI()`, `handleHTTP()`, `toThrowable()` e `isExceptionIgnored()`. No hay un método genérico `render()` ni hooks `shouldReport()` o `shouldRender()` en este contrato.

La [API de Catch y las políticas de errores](/es/architecture/exception-handling/policies-and-reference) incluye la delegación manual, los requisitos de scope y el inventario de clases. Consulta [Contextos y transportes](/es/architecture/exception-handling/contexts-and-transports) para las diferencias entre HTTP, CLI, WebSocket, Realtime, MCP y trabajos en segundo plano. [Excepciones HTTP](/es/http/exceptions) desarrolla los errores de petición y la página de diagnóstico sin extender esas reglas a otros transportes.
