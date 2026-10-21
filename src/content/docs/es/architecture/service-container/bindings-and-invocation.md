---
title: "Registrar e invocar servicios"
description: "Los primeros ejemplos son programas independientes para aprender los ciclos de vida de los servicios. En una aplicación generada, registra los mismos servicios en…"
editUrl: true
lastUpdated: false
---

Los primeros ejemplos son programas independientes para aprender los ciclos de vida de los servicios. En una aplicación generada, registra los mismos servicios en `ServiceProvider.register()` y deja que controladores o comandos soliciten dependencias mediante anotaciones de tipo. La [guía de proveedores](/es/architecture/service-container/providers-and-facades) muestra dónde guardar y registrar ese código.

## Inicio rápido

Registra un contrato y deja que las anotaciones construyan el grafo:

```python
import asyncio
from abc import ABC, abstractmethod

from orionis.container.container import Container


class Greeter(ABC):
    @abstractmethod
    def greet(self, name: str) -> str:
        raise NotImplementedError


class EnglishGreeter(Greeter):
    def greet(self, name: str) -> str:
        return f"Hello, {name}!"


class WelcomeService:
    def __init__(self, greeter: Greeter) -> None:
        self.greeter = greeter


class DocsContainer(Container):
    pass


async def main() -> None:
    container = DocsContainer()
    container.singleton(Greeter, EnglishGreeter)
    service = await container.build(WelcomeService)
    print(service.greeter.greet("Orionis"))  # Hello, Orionis!


asyncio.run(main())
```

`WelcomeService` se autoconstruye y su dependencia `Greeter` resuelve el singleton.

## Inyección en una aplicación Orionis

La aplicación existente es también el contenedor. En el código de aplicación utiliza el `IApplication` que Orionis ya resuelve para el componente actual y conserva los bindings de sus proveedores.

Guarda este ejemplo en `app/services/di_examples.py`. `demo()` recibe esa aplicación; no crea ni arranca otra:

```python
from orionis.foundation.contracts.application import IApplication


class TextFormatter:

    __slots__ = ()

    def format(self, text: str) -> str:
        return text.strip()


class MessagePresenter:

    __slots__ = ("_formatter",)

    def __init__(self, formatter: TextFormatter) -> None:
        self._formatter = formatter

    def from_constructor(self, text: str) -> str:
        return self._formatter.format(text)

    def from_method(self, text: str, formatter: TextFormatter) -> str:
        return formatter.format(text)


def format_message(text: str, formatter: TextFormatter) -> str:
    return formatter.format(text)


async def demo(app: IApplication) -> dict[str, str]:
    presenter = await app.build(MessagePresenter)
    return {
        "constructor": presenter.from_constructor("  Orionis  "),
        "method": await app.call(presenter, "from_method", text="  Orionis  "),
        "function": await app.invoke(format_message, text="  Orionis  "),
    }
```

Las tres entradas devuelven `"Orionis"`. `build()` construye `MessagePresenter` e inyecta `TextFormatter` en su constructor. `call()` recibe una instancia y el nombre del método; `invoke()` recibe una función. Estos últimos conservan el `text` que proporcionas y resuelven el parámetro `formatter` que falta.

Puedes ejecutar `await demo(app)` desde un componente que ya reciba `app: IApplication`, como un comando. No hace falta registrar estas clases concretas: son autoconstruibles. Un contrato abstracto necesita un binding a una implementación; registra esos bindings en `ServiceProvider.register()` mediante `self.app.transient(...)`, `singleton(...)` o `scoped(...)` según el ciclo de vida necesario. Consulta [proveedores y fachadas](/es/architecture/service-container/providers-and-facades).

La anotación describe qué resolver; **la llamada a través del contenedor o del punto de ejecución del framework activa la inyección**. Una llamada Python directa a `presenter.from_method(...)` o `format_message(...)` exige que tú pases `formatter`. `from_constructor()` sí puede llamarse directamente porque su objeto ya recibió esa dependencia durante `build()`.

Utiliza el constructor cuando varias acciones necesiten un servicio y el parámetro del método cuando la dependencia corresponda a una acción concreta. La identidad del servicio depende de su registro: dos resoluciones de una clase concreta sin binding no tienen por qué devolver el mismo objeto. No conviertas esa coincidencia en una condición de funcionamiento; elige un binding `singleton` o `scoped` cuando corresponda compartirlo.

### Dónde aplica la inyección automática

Estos son los puntos de entrada que utilizan los distintos flujos de Orionis. Cada capítulo contiene ejemplos adaptados a su API:

| Punto de ejecución | Constructor | Método o función |
|---|---|---|
| [Controlador HTTP](/es/http/request-lifecycle) | Sí. | Acción resuelta por el router; también las funciones de ruta. |
| [Streaming y SSE](/es/http/streaming-and-sse) | Sí, en el controlador HTTP. | La acción recibe servicios. El iterador o generador del stream se consume directamente; no inyecta sus propios parámetros. |
| [WebSocket](/es/http/websockets) | Sí, en el controlador. | Acción o función de ruta; incluye los valores de parámetros de ruta. |
| [Hub Realtime](/es/asynchronous/realtime/hubs-and-methods) | Sí, al construir cada hub. | Métodos `@remote`. Los hooks `onConnect` y `onDisconnect` tienen argumentos fijos y no añaden DI por método. |
| [MCP](/es/protocols/mcp/servers-and-tools) | Sí, en la definición de la primitiva. | `handle()` recibe servicios y los datos/contexto declarados para esa primitiva. |
| [Comando CLI](/es/console/commands-and-arguments) | Sí. | `handle()` recibe servicios. Con `BaseCommand`, lee los argumentos CLI mediante `getArgument()`. |
| [Scheduler](/es/console/task-scheduling) | Sí. | `tasks(schedule: ISchedule, ...)` recibe la agenda y puede solicitar servicios adicionales. |
| [Job de cola](/es/asynchronous/queues/jobs-and-dispatch) | El constructor corresponde a los datos serializados del job; no es un punto de DI. | El worker inyecta los servicios de `handle()`. |
| [Middleware HTTP](/es/http/middleware-and-security) | Sí; las instancias de los stacks pueden reutilizarse entre peticiones. | `handle(request, call_next)` se llama directamente, sin DI de parámetros adicionales. |
| [Middleware WebSocket](/es/http/websockets#middleware-de-conexión-y-grupos) | Sí; los middleware de ruta se construyen para la conexión. | `handle(socket, call_next)` tiene argumentos fijos; no recibe DI adicional por método. |
| [BackgroundTask](/es/asynchronous/background-tasks/response-tasks) | Pasa los valores al crear la tarea. | El callback se ejecuta con los argumentos que entregaste; sus anotaciones no activan DI automática. |

Los objetos de la petición, conexión o ejecución actual solo están disponibles cuando su flujo los ha registrado en el scope activo. No presupongas que un `Request` HTTP existe en un comando, un job o una conexión Realtime. Tampoco guardes esos objetos en servicios globales ni en middleware HTTP reutilizados entre peticiones; solicita el contexto en el punto que lo proporciona. [Scopes y concurrencia](/es/architecture/service-container/scopes-and-concurrency) explica el aislamiento.

## Conceptos principales

### Contrato, concreto, alias y binding

Un binding relaciona contrato con clase compatible y `Lifetime`. El contrato usa la clase concreta si `abstract=None`. Un alias no vacío resuelve el mismo contrato. Duplicados se rechazan salvo `override=True`.

### Lifetimes

- `TRANSIENT`: construye en cada resolución.
- `SINGLETON`: construye una vez por contenedor y reutiliza globalmente.
- `SCOPED`: construye una vez en el scope activo y descarta al cerrar.
- `instance`: publica objeto preparado globalmente o en el scope activo.

### Resolución e invocación automática

El contenedor almacena planes de reflexión, combina valores aportados con dependencias/defaults, construye parámetros recursivamente y espera awaitables. Esquemas Orionis y requests HTTP reciben tratamiento especializado.

### Propagación de scopes

`ScopeManager` se coloca en un `ContextVar`. Tareas hijas heredan referencia, pero al salir se marca cerrado y limpia instancias, impidiendo resolver servicios obsoletos.

### Fachadas

Una `Facade` asigna accesos a un accessor del contenedor. Providers pueden fijar un singleton. `ScopedFacade` no usa caché global: lee el servicio del scope activo.

## Ejemplos

### Comparar transient y singleton

```python
import asyncio

from orionis.container.container import Container


class Service:
    pass


class LifetimeContainer(Container):
    pass


async def main() -> None:
    container = LifetimeContainer()
    container.transient(None, Service)
    first = await container.make(Service)
    second = await container.make(Service)
    print(first is second)  # False

    container.singleton(None, Service, override=True)
    first = await container.make(Service)
    second = await container.make(Service)
    print(first is second)  # True


asyncio.run(main())
```

### Inyectar parámetro de función

```python
import asyncio

from orionis.container.container import Container


class Formatter:
    def format(self, value: int) -> str:
        return f"value={value}"


def render(value: int, formatter: Formatter) -> str:
    return formatter.format(value)


class InvokeContainer(Container):
    pass


async def main() -> None:
    container = InvokeContainer()
    container.singleton(None, Formatter)
    print(await container.invoke(render, 7))  # value=7


asyncio.run(main())
```

### Rechazar dependencia circular

```python
import asyncio

from orionis.container.container import Container
from orionis.container.exceptions import CircularDependencyException


class First:
    def __init__(self, second: "Second") -> None:
        self.second = second


class Second:
    def __init__(self, first: First) -> None:
        self.first = first


# Resolve the one forward reference after both classes exist.
First.__init__.__annotations__["second"] = Second


class CycleContainer(Container):
    pass


async def main() -> None:
    try:
        await CycleContainer().build(First)
    except CircularDependencyException:
        print("cycle detected")


asyncio.run(main())
```

## Referencia y próximos pasos

[container.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/container/container.py) · [binding.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/container/entities/binding.py) · [invocation.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/container/entities/invocation.py)

[Volver al índice del módulo](/es/architecture/service-container).
