---
title: "Conectar código síncrono y asíncrono"
description: "Loop reúne la creación de loops, el despacho de callables y los puentes síncronos. Empieza por distinguir si tu código ya está dentro de un loop: esa decisión determina qué…"
editUrl: true
lastUpdated: false
---

Loop reúne la creación de loops, el despacho de callables y los puentes síncronos. Empieza por distinguir si tu código ya está dentro de un loop: esa decisión determina qué operación usar.

Desde Orionis 1.0.8, la gestión del loop usa el registro de `asyncio` y `asyncio.Runner` para garantizar un ciclo de vida predecible en Python 3.14. Si actualizas código anterior, `createTask()` ahora es síncrono, `runSync()` rechaza las llamadas desde un loop activo y `KeyboardInterrupt` se propaga al llamador.

## Requisitos

- Python 3.14 o posterior, según declara el proyecto.
- Una instalación normal de Orionis. No existe un extra de instalación específico para `aio`.
- En plataformas distintas de Windows, el proyecto declara `uvloop>=0.22.1`; `Loop` lo utiliza cuando se puede importar. En Windows, `uvloop` no es necesario y Orionis intenta usar `asyncio.ProactorEventLoop`.
- No se requiere iniciar la aplicación, registrar un binding en el contenedor, preparar un archivo de configuración ni disponer de un servicio externo para usar `Loop` directamente.
## Inicio rápido

Ejecuta el punto de entrada async de una aplicación y mueve un callable bloqueante al ejecutor predeterminado del loop:

```python
import time

from orionis.aio import Loop


def blocking_label(value: int) -> str:
    time.sleep(0.01)
    return f"job-{value}"


async def main() -> str:
    label = await Loop.execute(blocking_label, 7)
    return label.upper()


result = Loop.run(main())
print(result)  # JOB-7
```

`Loop.run` crea y posee el loop del punto de entrada. `Loop.execute` invoca `blocking_label` en el ejecutor predeterminado y devuelve después su resultado a `main`.

## Elegir el punto de entrada correcto

| Situación | Operación | Resultado |
|---|---|---|
| Script o CLI sin loop activo | `Loop.run(main())` | Ejecuta la corrutina y devuelve su resultado. |
| Ya estás en una función `async` | `await main()` | Conserva el loop y los recursos actuales. |
| Callback sync o async desconocido | `await Loop.execute(callback, ...)` | Despacha y espera el resultado. |
| Trabajo concurrente en el mismo loop | `task = Loop.createTask(work())` y después `await task` | Crea inmediatamente una `asyncio.Task`; espera la tarea para obtener su resultado. |
| Contrato síncrono sin loop activo que exige resultado async | `Loop.runSync(work())` | Ejecuta la corrutina en el hilo llamador y espera su resultado. |

En un controlador async, llama directamente con `await`. Tanto `run()` como `runSync()` lanzan `RuntimeError` si ya hay un loop activo en el hilo llamador. No crean otro hilo para resolver esa situación. La corrutina rechazada queda sin consumir: el llamador debe esperarla o cerrarla.

`execute()` acepta una función, no el objeto corrutina ya creado. Los callables síncronos se ejecutan mediante `asyncio.to_thread`, que propaga los valores de `ContextVar` del llamador al worker. Si devuelven un awaitable, incluido uno basado en generadores, ese resultado se espera de vuelta en el loop original.

### Propiedad de recursos

`getEventLoop()` reutiliza el loop activo o el loop abierto registrado con `asyncio` en ese hilo. Si debe crear uno, su cierre queda a cargo del llamador. `eventLoopContext()` toma prestado un loop ya registrado sin cancelar tareas ni cerrarlo; si no existe uno abierto, crea y administra su propio loop mediante `asyncio.Runner`. `Loop.run()` también administra un loop propio y restaura el registro anterior al terminar. Conserva una referencia a cada tarea y espera o cancela su resultado; crear una tarea no añade persistencia, reintentos ni un supervisor.

Usa [colas](/es/queues) cuando el trabajo deba sobrevivir a un reinicio; una tarea de asyncio no se persiste. Para trabajo ligado a una respuesta HTTP, consulta las [tareas en segundo plano](/es/queues/background-tasks/response-tasks).

## Conceptos principales

### Loop de punto de entrada frente al loop actual

`Loop.run(coro)` está destinado a un punto de entrada síncrono donde no haya un event loop en ejecución en el hilo que llama. Dentro de código async, utiliza `await` de forma normal. `Loop.getEventLoop()` devuelve el loop activo cuando se llama desde código async; fuera de él, reutiliza el loop abierto registrado con `asyncio` o crea y registra uno nuevo. No mantiene una caché independiente del registro de `asyncio`.

### Puente de callables

`Loop.execute(func, *args, **kwargs)` acepta ambos tipos de callable. Una función corrutina se llama y espera en el loop actual. Un callable síncrono se envía con `asyncio.to_thread` al ejecutor predeterminado de ese loop, preservando el contexto del llamador. Si devuelve un awaitable, el objeto devuelto se espera después en el loop actual.

### Puente síncrono de corrutinas

`Loop.runSync(coro)` delega en `Loop.run` en el mismo hilo y espera hasta que termina la corrutina. Requiere que no haya un loop activo en el hilo llamador; desde código async, usa `await`. Este método ya no utiliza un ejecutor compartido.

### Propiedad y limpieza del loop

`Loop.eventLoopContext()` toma prestado cualquier loop abierto ya registrado, incluido uno obtenido antes con `getEventLoop()`. Al salir no cancela sus tareas ni lo cierra. Los contextos anidados toman prestado el loop del contexto exterior.

Si no hay un loop abierto registrado al entrar, el contexto crea uno propio. Al salir, `asyncio.Runner` cancela y espera las tareas pendientes, finaliza los generadores asíncronos, cierra el ejecutor predeterminado y cierra el loop. No cierres manualmente ese loop ni lo dejes ejecutándose al salir.

## Flujos de trabajo comunes

### Iniciar una CLI o un script

Define una corrutina de nivel superior, crea el objeto corrutina y pásalo a `Loop.run`. No llames `Loop.run` desde un manejador async; se intentaría anidar event loops en un mismo hilo.

### Llamar código bloqueante desde código async

Pasa la función síncrona y sus argumentos a `await Loop.execute(...)`. El loop permanece disponible para ejecutar otras tareas mientras el ejecutor predeterminado realiza la llamada bloqueante. Las funciones corrutina pueden usar el mismo punto de entrada y se esperan directamente.

### Programar trabajo concurrente

Dentro de un loop activo, llama `Loop.createTask(coro, name=...)` para cada corrutina, sin `await` al crearla. Conserva las tareas devueltas y después espéralas individualmente o con `asyncio.gather`.

### Adaptar una operación async a un contrato síncrono

Usa `Loop.runSync(coro)` en un límite síncrono cuyo hilo no tenga un loop activo. El método conserva el hilo y el contexto del llamador. Si controlas una cadena de llamadas async, usa `await` directamente.

## Ejemplos

### Despachar callables sync y async mediante una sola interfaz

La misma operación maneja ambos estilos de callable y conserva los argumentos con nombre:

```python
from orionis.aio import Loop


def sync_join(*, left: str, right: str) -> str:
    return f"{left}:{right}"


async def async_join(*, left: str, right: str) -> str:
    return f"{left}/{right}"


async def main() -> tuple[str, str]:
    sync_value = await Loop.execute(sync_join, left="a", right="b")
    async_value = await Loop.execute(async_join, left="a", right="b")
    return sync_value, async_value


print(Loop.run(main()))  # ('a:b', 'a/b')
```

La función síncrona se ejecuta en el ejecutor predeterminado del loop; la función corrutina permanece en el loop del llamador.


### Crear e identificar una tarea

Los nombres de tareas son útiles en diagnósticos, mientras el objeto de tarea conserva el resultado:

```python
import asyncio

from orionis.aio import Loop


async def fetch_total() -> int:
    await asyncio.sleep(0)
    return 42


async def main() -> tuple[str, int]:
    task = Loop.createTask(fetch_total(), name="fetch-total")
    return task.get_name(), await task


print(Loop.run(main()))  # ('fetch-total', 42)
```

`createTask` programa la ejecución inmediatamente; esperar la tarea devuelta es lo que recupera su resultado.


### Llevar una operación async a código síncrono

En el punto de entrada síncrono de un script sin loop activo, `runSync()` obtiene el resultado async para quien llama:

```python
from orionis.aio import Loop


async def lookup(code: str) -> str:
    return code.upper()


print(Loop.runSync(lookup("orionis")))  # ORIONIS
```

El llamador síncrono espera hasta que termina `lookup`. En un controlador, comando o job async, usa directamente `await lookup(...)`; invocar `runSync` desde ese loop lanza `RuntimeError`.


### Manejar un uso inválido del punto de entrada

Pasa el objeto corrutina que devuelve la llamada a una función async, no la propia función:

```python
from orionis.aio import Loop


async def main() -> int:
    return 1


try:
    Loop.run(main)  # type: ignore[arg-type]
except TypeError as error:
    print(str(error))  # A coroutine object is required
```

La validación ocurre antes de crear un loop.

## Configuración

Este módulo no consume claves de configuración ni variables de entorno de Orionis. La selección de factoría depende de la plataforma actual y de si `uvloop` se puede importar; no existe una opción pública para reemplazar esa selección. La factoría resuelta se almacena durante toda la vida del proceso.

## Integración con Orionis

- `orionis.mail` usa `Loop.execute` para mantener fuera del hilo del event loop activo el renderizado síncrono, almacenamiento en archivos y trabajo SMTP.
- La regla `Unique` espera la consulta de base de datos directamente en el loop actual, conservando su conexión y transacción; no usa `runSync`.
- El ejecutable `reactor` del repositorio inicia `app.handleCommand(sys.argv)` con `Loop.run`.
- `Loop` no tiene provider y no se resuelve mediante el contenedor de servicios; basta con importarlo.

Estos son consumidores directos, no efectos secundarios del bootstrap. Importar `orionis.aio` no crea un loop, ejecutor ni aplicación.

## Errores y casos límite

- `run` lanza `TypeError("A coroutine object is required")` para una función corrutina, valor simple u otro objeto que no sea un objeto corrutina nativo.
- `run` y `runSync` lanzan `RuntimeError` cuando el hilo que llama ya tiene un loop en ejecución. La corrutina proporcionada queda sin consumir y debe esperarse o cerrarse por el llamador.
- `execute` lanza `TypeError("The provided object is not callable")` antes de programar un objeto que no sea callable. Es un método async: espera su resultado desde código async o ejecuta la corrutina con `Loop.run` en un punto de entrada síncrono.
- Las excepciones de los callables y corrutinas invocados se propagan; el módulo no las envuelve.
- `run` y `runSync` propagan `KeyboardInterrupt` al llamador.
- `eventLoopContext` solo limpia y cierra loops propios. Si cierras uno de ellos manualmente o lo dejas ejecutándose al salir, lanza `RuntimeError`. Los loops prestados y sus tareas permanecen bajo responsabilidad de su propietario.
- Un loop registrado que ya esté cerrado se descarta y reemplaza en la siguiente llamada a `getEventLoop`.

## Rendimiento y concurrencia

La resolución de la factoría de loops y la detección de `uvloop` se almacenan para todo el proceso y están protegidas por un `threading.Lock` durante el primer uso. Las resoluciones posteriores usan una ruta rápida sin adquirir el lock.

El registro de `asyncio` determina el loop del hilo. `getEventLoop()` respeta los cambios realizados con `asyncio.set_event_loop()` y reutiliza el loop abierto registrado; un loop actualmente en ejecución tiene prioridad.

`execute` usa el ejecutor predeterminado del loop actual mediante `asyncio.to_thread`; su capacidad y ciclo de vida pertenecen a ese event loop. `runSync` se ejecuta en el hilo llamador y no tiene un pool global que serialice las llamadas realizadas desde hilos distintos.

`runSync` rechaza los loops anidados. `createTask` solo programa trabajo; la concurrencia depende de que la corrutina ceda el control.

## API pública

### `Loop`

Import recomendado:

```python
from orionis.aio import Loop
```

Todos los métodos públicos son estáticos o de clase y operan sobre estado compartido de la clase.

#### `getEventLoop()`

```text
Loop.getEventLoop() -> asyncio.AbstractEventLoop
```

Devuelve el loop que se está ejecutando en el hilo que llama. Si ninguno está activo, reutiliza el loop abierto registrado con `asyncio` o crea uno nuevo y lo instala con `asyncio.set_event_loop`. El llamador debe cerrar un loop creado por este método. Para obtener limpieza automática, entra directamente en `eventLoopContext()` sin registrar antes un loop abierto.

#### `run(coro)`

```text
Loop.run(coro: Coroutine[Any, Any, T]) -> T
```

Ejecuta un objeto corrutina nativo hasta completarlo y devuelve su valor. La selección de factoría es `uvloop.new_event_loop` cuando está disponible fuera de Windows, después `asyncio.ProactorEventLoop` en Windows cuando se expone y, por último, `asyncio.new_event_loop`. Siempre usa `asyncio.Runner` con una factoría que registra el loop antes de ejecutar la corrutina. Al salir limpia y cierra el loop propio y restaura el loop anterior si sigue abierto.

El método acepta un objeto corrutina, no una función corrutina ni un awaitable general. Propaga las excepciones, incluido `KeyboardInterrupt`, y rechaza su uso desde un hilo que ya tenga un loop en ejecución.

#### `execute(func, /, *args, **kwargs)`

```text
await Loop.execute(func, *args, **kwargs) -> Any
```

Invoca directamente una función corrutina y la espera. Mueve cualquier otro callable al ejecutor predeterminado del loop actual mediante `asyncio.to_thread`, propagando los `ContextVar` del llamador. Los argumentos y valores de retorno pasan sin alteración; si el callable devuelve un awaitable reconocido por `inspect.isawaitable`, este se espera en el loop original antes de devolver el resultado. Las excepciones originales atraviesan sin cambios el límite de `await`.

Espera este método desde un event loop activo. No crea un ejecutor privado.

#### `eventLoopContext()`

```python
from orionis.aio import Loop


with Loop.eventLoopContext() as loop:
    assert loop is Loop.getEventLoop()
```

Si existe un loop abierto registrado, lo entrega como préstamo y no lo modifica al salir. Si no existe, crea uno propio mediante `asyncio.Runner`: al salir cancela y espera tareas, finaliza generadores asíncronos, cierra el ejecutor predeterminado y el loop, y limpia su registro. Los contextos anidados toman prestado el loop exterior. Cerrar manualmente un loop propio o dejarlo ejecutándose al salir produce `RuntimeError`.

#### `isLoopRunning()`

```text
Loop.isLoopRunning() -> bool
```

Indica si un event loop se está ejecutando activamente en el hilo que llama. Tener un loop registrado pero inactivo no hace que devuelva `True`.

#### `createTask(coro, *, name=None)`

```text
Loop.createTask(coro, name=None) -> asyncio.Task[T]
```

Crea la tarea en el loop actual en ejecución y la devuelve inmediatamente. El método es síncrono: conserva la tarea y usa `await task` para observar su resultado y excepciones. El nombre opcional se reenvía a `asyncio.create_task`. Sin un loop activo, lanza `RuntimeError`.

#### `runSync(coro)`

```text
Loop.runSync(coro: Coroutine[Any, Any, T]) -> T
```

Delega directamente en `run` y espera la corrutina en el hilo llamador. Conserva su contexto y comparte los requisitos, limpieza y excepciones de `run`. Si el hilo ya tiene un loop activo, lanza `RuntimeError` y deja la corrutina sin consumir.

Reserva `runSync` para APIs síncronas ejecutadas sin un loop activo. Quienes llaman desde async deben usar `await`.

## Referencia de implementación para extensiones

| Ruta | Responsabilidad |
|---|---|
| `__init__.py` | Reexporta `Loop` como único símbolo de nivel superior soportado por el paquete. |
| `loop.py` | Implementa la selección de factoría, reutilización de loops por hilo, limpieza de tareas, despacho de callables y puentes sync/async. |

---

[Índice](/es/application/async) · [background](/es/queues/background-tasks) · [foundation](/es/getting-started)
