---
title: "Reportar y gestionar excepciones"
description: "Personaliza el handler global, separa reporte y presentación, conserva la inyección de dependencias y gestiona fallos desde HTTP, consola y servicios."
editUrl: true
lastUpdated: false
---

Una excepción comunica que una operación no pudo completarse. Puedes capturarla cuando dispones de una recuperación concreta; si dejas que se propague, el punto de entrada de Orionis decide cómo reportarla y cómo representar el fallo.

El handler de aplicación reúne esa política. No sustituye la validación de datos ni convierte todos los errores del proceso en una respuesta HTTP. Su uso depende del componente que entrega la excepción: un comando, una petición HTTP o un protocolo con su propia presentación.

Esta guía desarrolla la personalización del handler. Para la página que aparece durante una petición y las diferencias entre desarrollo y producción, consulta [Excepciones HTTP](/es/http/exceptions). El [índice general](/es/architecture/exception-handling) explica el registro y la arquitectura del módulo.

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

## Separar reporte y presentación

Cuando `Catch.exception()` recibe una excepción en un scope válido, ejecuta:

1. `report(exception, log)`.
2. `handleCLI(exception, console)` para el kernel de consola, o `handleHTTP(exception, request)` para HTTP.
3. Devuelve el resultado de la presentación. En un contexto diferente de esos dos, solo reporta.

El resultado de `report()` no controla el segundo paso. Retornar `None` desde ese método **no impide** que se llame a `handleHTTP()` o `handleCLI()`.

La implementación predeterminada registra un mensaje de nivel error con el formato `[ExceptionClass] message`. El logging y la presentación son operaciones distintas: un log no es la respuesta del cliente, y generar una respuesta no garantiza por sí mismo que se haya registrado el fallo.

El contenedor invoca estos métodos mediante `app.call(...)`. Proporciona `exception` y, en HTTP, `request` explícitamente; las anotaciones de `ILogger` y `Console` permiten resolver los demás argumentos. Usa esas firmas en tus sobrescrituras y pasa las dependencias explícitamente cuando llames a `super()`.

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

Si `report()` lanza otra excepción, `Catch` no alcanza la presentación. Cuando agregues un servicio externo de observabilidad, define qué hacer si ese servicio falla; no permitas que sustituya involuntariamente el error original.

## Personalizar la salida de consola

El mismo error de dominio puede tener una representación breve en consola:

```python
from app.exceptions.order_conflict import OrderConflict
from orionis.console import Console
from orionis.failure.base import BaseExceptionHandler


class ExceptionHandler(BaseExceptionHandler):
    async def handleCLI(
        self,
        exception: BaseException,
        console: Console,
    ) -> None:
        if self.isExceptionIgnored(exception):
            return

        if isinstance(exception, OrderConflict):
            console.warning("The order has already been processed.")
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

La implementación base de `handleCLI()` utiliza `Console.exception()` para mostrar tipo, mensaje y contexto de traceback con Rich; no muestra variables locales. Los errores controlados por tu rama personalizada pueden tener una presentación distinta.

## Trabajar con Throwable

`toThrowable(exception)` crea un registro estructurado. No reporta ni presenta la excepción por sí mismo.

| Campo | Contenido |
| --- | --- |
| `classtype` | Clase concreta de la excepción. |
| `message` | Primer argumento convertido a texto; cadena vacía si no hay argumentos. |
| `args` | Tupla de todos los argumentos convertidos a texto. |
| `traceback` | Traceback nativo de Python, o `None` si no existe. |

La dataclass es congelada, usa slots y requiere argumentos por nombre. `traceback` no es una cadena JSON ni se formatea automáticamente. `Throwable.message` puede diferir de `str(exception)` cuando la excepción tiene varios argumentos o personaliza su representación.

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

## Delegar manualmente en Catch

Normalmente basta con dejar que el error alcance el kernel. Si estás implementando un límite de ejecución propio dentro de una petición, puedes delegar una excepción al servicio mediante su contrato:

```python
from orionis.failure.contracts import ICatch
from orionis.http import Request, Response


class FailureBoundary:
    async def respond(
        self,
        exception: Exception,
        request: Request,
        catch: ICatch,
    ) -> Response:
        response = await catch.exception(exception, request)
        if response is None:
            raise exception
        return response
```

Orionis inyecta `ICatch` cuando invoca `respond()` mediante el contenedor. `exception` y `request` deben ser los del fallo actual. El retorno `None` no es una respuesta HTTP válida; la rama del ejemplo vuelve a propagar el error en ese caso.

La fachada ofrece el mismo servicio en una aplicación iniciada:

```python
from orionis.http import Request, Response
from orionis.support.facades import Catch


async def present_failure(
    exception: Exception,
    request: Request,
) -> Response | None:
    return await Catch.exception(exception, request)
```

Importa la fachada desde `orionis.support.facades`. El símbolo `Catch` de `orionis.failure` es la implementación concreta y requiere la aplicación en su constructor.

Ambas variantes de `exception()` requieren un scope activo con contexto `kernel`. En HTTP, proporciona siempre un `Request` o `TransportAdapter` utilizable. La fachada no crea por sí sola ese contexto ni instala un capturador global de Python.

El servicio reutiliza el handler resuelto. Mantén la excepción, la petición y cualquier dato por operación en variables locales; almacenarlos en atributos del handler puede mezclar peticiones concurrentes.

## Decidir dónde gestionar el fallo

Captura una excepción cerca de la operación cuando puedes recuperarte, aplicar una alternativa o añadir contexto antes de relanzarla. Deja la presentación transversal al handler cuando no existe recuperación local.

Las extensiones verificadas son `report()`, `handleCLI()`, `handleHTTP()`, `toThrowable()` e `isExceptionIgnored()`. No hay un método genérico `render()` ni hooks `shouldReport()` o `shouldRender()` en este contrato.

Consulta [Políticas de errores y referencia](/es/architecture/exception-handling/policies-and-reference) para `dont_catch`, límites de captura, contextos de protocolo y el inventario de clases. [Excepciones HTTP](/es/http/exceptions) desarrolla los errores de petición y la página de diagnóstico sin extender esas reglas a otros transportes.
