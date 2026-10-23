---
title: "Ejecución y API del scheduler"
description: "API completa de Schedule e ISchedule, inyección, ejecución programática, pausas, eliminación de tareas y apagado."
editUrl: true
lastUpdated: false
---

La clase `Scheduler` de `app/console/scheduler.py` describe la agenda. El **servicio** que la ejecuta es `Schedule`, implementación de `ISchedule`, y la fachada pública se llama **`Schedule`**, no `Scheduler`:

```python
from orionis.console.contracts import ISchedule
from orionis.support.facades import Schedule
```

<a id="schedule-command"></a>

## Schedule.command(): programar un comando

`Schedule.command()` **registra un comando en la agenda** y devuelve su configurador de tarea; no lo ejecuta en ese momento. Es un método síncrono, por lo que no lleva `await`. La misma operación está disponible como `schedule.command()` cuando recibes el servicio `ISchedule` por inyección.

La clase `Scheduler` de tu aplicación implementa `tasks()`; el método de registro pertenece a la fachada **`Schedule`** y al servicio `ISchedule`.

```text
command(
    signature: str,
    args: list[str] | None = None,
    purpose: str | None = None,
) -> ITask
```

| Parámetro | Uso |
|---|---|
| `signature` | Obligatorio. Firma exacta de un comando registrado en Reactor, por ejemplo `reports:export`. No es una clase, ruta de archivo ni línea de shell. |
| `args` | Opcional, `None` por defecto; equivale a `[]`. Cada elemento es un token CLI de tipo `str`, incluidos argumentos y opciones que declare el comando. |
| `purpose` | Opcional, `None` por defecto. Etiqueta para identificar la tarea en `schedule:list`; no se entrega al comando como argumento. |

### Un comando que recibe argumentos y opciones

Guarda este ejemplo en `app/console/commands/export_report_command.py`. Permite comprobar exactamente qué valores recibe el comando programado:

```python
from typing import ClassVar

from orionis.console import Argument
from orionis.console.base import BaseCommand


class ExportReportCommand(BaseCommand):
    signature = "reports:export"
    description = "Inspect a scheduled report export request."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="period", type_=str),
        Argument(
            name_or_flags="--format",
            type_=str,
            choices=["csv", "json"],
            default="csv",
        ),
    ]

    async def handle(self) -> int:
        period = self.getArgument("period")
        output_format = self.getArgument("format")
        self.writeLine(f"Export requested: {period}, format: {output_format}")
        return 0
```

### Registrar la tarea desde BaseScheduler.tasks()

En `app/console/scheduler.py`, el contenedor entrega `ISchedule` al método `tasks()`:

```python
from orionis.console.base import BaseScheduler
from orionis.console.contracts import ISchedule


class Scheduler(BaseScheduler):
    def tasks(self, schedule: ISchedule) -> None:
        (
            schedule.command(
                "reports:export",
                args=["2026-10", "--format", "json"],
                purpose="Daily report export",
            )
            .maxInstances(1)
            .dailyAt(2, 30)
        )
```

Cada día a las 02:30, el comando recibe `period="2026-10"` y `format="json"` en la zona de la aplicación. Los tokens equivalen a ejecutar `orionis reports:export 2026-10 --format json`. No pases una cadena como `"2026-10 --format json"`: el servicio exige una lista y no tokeniza líneas de shell. Un valor con espacios se representa como un solo elemento, por ejemplo `"Ada Lovelace"`, sin comillas de shell dentro del texto.

Después de `command()` puedes configurar concurrencia, fechas, listeners y demás [opciones de la tarea](/es/console/scheduler-frequencies), y finalizar con un método de frecuencia. Esos métodos terminales, como `dailyAt()`, devuelven `True`, por lo que no debes encadenar otros configuradores después de ellos.

### Utilizar la fachada Schedule

Si prefieres la fachada, conserva la misma clase y método `tasks()` del ejemplo anterior, importa `Schedule` y sustituye la declaración de la tarea por:

```python
from orionis.support.facades import Schedule

# Dentro de tasks(), como alternativa a schedule.command(...):
(
    Schedule.command(
        "reports:export",
        args=["2026-10", "--format", "json"],
        purpose="Daily report export",
    )
    .maxInstances(1)
    .dailyAt(2, 30)
)
```

La fachada se importa siempre desde `orionis.support.facades`. Después del arranque de la aplicación delega en el mismo singleton `ISchedule`; utilizarla no crea otra agenda. El [apartado de inyección](#inyección-de-dependencias) muestra cómo recibir ese servicio por constructor o método en otros componentes.

### Registrar la clase e iniciar el proceso

En `bootstrap/app.py`, antes de `app.create()`, registra la clase que declara la agenda:

```python
from app.console.scheduler import Scheduler

app.withScheduler(Scheduler)
```

Comprueba el comando, inspecciona la agenda y después mantén el scheduler ejecutándose:

```shell
orionis reports:export 2026-10 --format json
orionis schedule:list
orionis schedule:work
```

Las alternativas mediante el archivo local son:

```shell
python -B reactor reports:export 2026-10 --format json
python -B reactor schedule:list
python -B reactor schedule:work
```

`withScheduler()` registra la clase; `command()` declara una tarea; `schedule:work` inicia el proceso que cumple sus horarios. [La guía de tareas](/es/console/task-scheduling#scheduler-registration) detalla el registro de la aplicación.

### Identidad, validación y restricciones

La agenda identifica las tareas por **firma del comando**. Una segunda llamada a `command()` con la misma firma sustituye su definición pendiente, incluidos argumentos y horario; no crea dos tareas independientes. Si necesitas agendas distintas que compartan lógica, registra comandos con firmas diferentes y delega esa lógica a un servicio común.

La firma debe ser una cadena no vacía; no se recorta al registrarla. `args` debe ser una lista formada únicamente por cadenas o `None`. Los valores incompatibles producen `TypeError`. La existencia de la firma y la presencia de un horario se comprueban al consultar `info()` o iniciar con `boot()`; una tarea inválida produce `ValueError`.

Declara las tareas mientras el servicio esté en su estado inicial `STOPPED`. `command()` produce `RuntimeError` después de iniciar o pausar el scheduler. No es un método para añadir tareas dinámicamente a un proceso que ya está ejecutando la agenda, ni ejecuta automáticamente un worker de colas.

## Formas de ejecución

| Forma | Comportamiento |
|---|---|
| `orionis reports:build` o `python -B reactor reports:build` | Ejecuta inmediatamente un comando; no carga un reloj ni aplica su horario. |
| `orionis schedule:list` o `python -B reactor schedule:list` | Carga las declaraciones y muestra su información; no inicia el scheduler ni enumera un historial persistido de ejecuciones. |
| `orionis schedule:work` o `python -B reactor schedule:work` | Carga la clase registrada, tareas y hooks; inicia el scheduler y espera su apagado. |
| `await Reactor.call("reports:build", [])` | Ejecuta inmediatamente el comando dentro del proceso mediante Reactor. |
| Servicio `ISchedule` o fachada `Schedule` | Permiten declarar y controlar una agenda desde código async; tú administras su carga, listeners, arranque y apagado. |
| Comando programado que despacha `Queue.dispatch(...)` | El scheduler decide cuándo enviar el job; el backend y worker de Queues deciden cómo procesarlo. |

Las tareas de este componente son **comandos registrados**. `command()` no acepta una función arbitraria, una clase `BaseJob` ni un fragmento de shell. Los procesos externos que un comando decida invocar pertenecen a la lógica de ese comando.

<a id="scheduler-provider"></a>
<a id="schedule-facade"></a>

## Registro del servicio y fachada

`ScheduleProvider.register() -> None` registra `IScheduleStore → ScheduleStore` e `ISchedule → Schedule` como singletons. Su `async boot() -> None` fija la fachada, pero **no inicia la agenda**. No necesitas registrar nuevamente el provider nativo ni iniciar el reloj para consultar configuración.

`Schedule.getFacadeAccessor() -> type` retorna `ISchedule`. Los 16 métodos públicos del servicio descritos debajo también están disponibles a través de la fachada después del arranque normal de Orionis. Los métodos async necesitan `await`; los síncronos se llaman directamente. `Schedule.command(...)` no ejecuta el comando al declarar la tarea.

Ejemplo de inspección usando la fachada en un comando:

```python
from orionis.console.base import BaseCommand
from orionis.support.facades import Schedule


class SchedulerStateCommand(BaseCommand):
    signature = "scheduler:state"
    description = "Inspect this process's scheduler state."

    async def handle(self) -> int:
        self.writeLine(Schedule.state())
        return 0
```

Un comando CLI ejecutado en otro proceso obtiene **su propio singleton**: `scheduler:state` no administra remotamente un `schedule:work` ya activo en otra terminal. Lo mismo ocurre con una petición web de otro proceso. Un store compartido no convierte las instancias de `Schedule` en un canal de control remoto.

<a id="schedule-construction"></a>

## Inyección de dependencias

La firma de la implementación es:

```text
Schedule(reactor: IReactor, exception_handler: ICatch, stores: IScheduleStore) -> None
```

El contenedor resuelve esos servicios. En tus componentes solicita `ISchedule`; no construyas un `Schedule` sin sus colaboradores.

Este ejemplo combina inyección por constructor en un servicio y por método en un comando:

```python
from orionis.console.base import BaseCommand
from orionis.console.contracts import ISchedule


class SchedulerInspector:
    def __init__(self, schedule: ISchedule) -> None:
        self.schedule = schedule

    def state(self) -> str:
        return self.schedule.state()


class InspectSchedulerCommand(BaseCommand):
    signature = "scheduler:inspect"
    description = "Inspect the scheduler service in this process."

    async def handle(
        self,
        inspector: SchedulerInspector,
        schedule: ISchedule,
    ) -> int:
        self.writeLine(f"State: {inspector.state()}")
        self.writeLine(f"Running: {schedule.isRunning()}")
        self.writeLine(f"Paused: {schedule.isPaused()}")
        self.writeLine(f"Stopped: {schedule.isStopped()}")
        return 0
```

Los dos colaboradores reciben el mismo singleton dentro de la aplicación. Este ejemplo inspecciona la instancia del proceso; no declara tareas ni inicia el scheduler.

## Cargar la agenda de la aplicación desde código

Cuando utilices `schedule:work`, Orionis realiza estos pasos. En una integración propia tienes que realizarlos explícitamente:

```python
from orionis.console.contracts import ISchedule
from orionis.console.enums.events import SchedulerEvent
from orionis.foundation.contracts.application import IApplication


async def load_agenda(app: IApplication, schedule: ISchedule) -> None:
    definition = await app.getScheduler()
    await app.call(definition, "tasks", schedule=schedule)

    callbacks = (
        (SchedulerEvent.STARTED, "onStarted"),
        (SchedulerEvent.PAUSED, "onPaused"),
        (SchedulerEvent.RESUMED, "onResumed"),
        (SchedulerEvent.SHUTDOWN, "onShutdown"),
    )
    for event, method_name in callbacks:
        callback = getattr(definition, method_name, None)
        if callable(callback):
            schedule.on(event, callback)

    await schedule.boot()
```

Esta función requiere una aplicación arrancada y un event loop activo. `app.call()` admite el método `tasks()` sync o async e inyecta sus dependencias restantes. `boot()` por sí solo no busca la clase de agenda de la aplicación ni invoca sus hooks.

## API completa de `ISchedule` y `Schedule`

Los métodos de control son locales al proceso y devuelven `True` al completar la operación indicada; los errores no se representan con `False`, sino con excepciones.

<a id="schedule-info"></a>

### `async info() -> list[dict]`

Carga las firmas de Reactor, valida las tareas y construye sus entidades con los defaults configurados. No inicia el scheduler ni ejecuta comandos. Una firma no registrada o una tarea sin trigger produce `ValueError`.

```python
tasks = await schedule.info()
for task in tasks:
    print(task["signature"], task["details"], task["max_instances"])
```

Cada diccionario contiene `signature`, `args`, `kwargs`, `purpose`, `random_delay`, `coalesce`, `max_instances`, `misfire_grace_time`, `start_date`, `end_date` y `details`. Las fechas se formatean como `YYYY-MM-DD HH:mm:ss` o `None`, sin incluir el offset en ese texto. No incluye resultados históricos ni próximos horarios obtenidos del store.

<a id="schedule-boot"></a>

### `async boot() -> None`

Valida firmas y tareas, prepara el planificador en el loop actual y zona de la aplicación, añade los stores, conecta eventos y registra jobs con identidad igual a la firma. Cada job invoca Reactor con su firma y tokens. Finalmente inicia el reloj y marca el wrapper como `RUNNING`.

```python
await schedule.boot()
```

Necesita un loop activo y acceso al backend seleccionado. Errores de configuración, firmas, conexión, serialización o identidades persistidas pueden interrumpir el arranque. Usa una sola llamada de arranque por instancia; esta API no ofrece un reinicio transaccional ni un guard que haga repetidos `boot()` idempotentes.

<a id="schedule-on"></a>

### `on(event: SchedulerEvent, listener: Callable) -> Self`

Registra antes del arranque un callback para un miembro individual del enum global. Devuelve el mismo servicio y reemplaza el callback anterior de ese evento. Tipo de evento o callable inválido produce `TypeError`; después del arranque produce `RuntimeError`.

```python
from orionis.console.enums.events import SchedulerEvent


async def log_start(event) -> None:
    print(event.description)


schedule.on(SchedulerEvent.STARTED, log_start)
```

Para eventos de una tarea, usa `schedule.command(...).on(TaskEvent.EXECUTED, callback)`; [los listeners](/es/console/scheduler-listeners) explican su payload y orden.

<a id="schedule-state"></a>

### `state() -> str`

Devuelve `"STOPPED"`, `"RUNNING"` o `"PAUSED"` según el estado conservado por el wrapper. Inicialmente es `STOPPED`; no consulta el backend.

```python
print(schedule.state())
```

<a id="schedule-isrunning"></a>

### `isRunning() -> bool`

Comprueba si ese estado es `RUNNING`.

```python
if schedule.isRunning():
    print("The scheduler is running in this process")
```

<a id="schedule-ispaused"></a>

### `isPaused() -> bool`

Comprueba si ese estado es `PAUSED`.

```python
if schedule.isPaused():
    print("Dispatch is paused")
```

<a id="schedule-isstopped"></a>

### `isStopped() -> bool`

Comprueba si ese estado es `STOPPED`. Sirve para comprobar la instancia inicial, pero el apagado actual no actualiza ese estado: no lo uses para esperar una parada.

```python
if schedule.isStopped():
    print("This scheduler has not started")
```

<a id="schedule-pause"></a>

### `pause() -> bool`

Pausa el despacho global y marca `PAUSED`. Requiere un scheduler iniciado y en estado `RUNNING`; en otro caso produce `RuntimeError`. No cancela comandos que ya están ejecutándose.

```python
schedule.pause()
```

<a id="schedule-resume"></a>

### `resume() -> bool`

Reanuda el despacho global y marca `RUNNING`. Exige estado `PAUSED`; en otro caso produce `RuntimeError`. Los horarios atrasados quedan sujetos a coalescing y tolerancia.

```python
schedule.resume()
```

<a id="schedule-pausetask"></a>

### `pauseTask(signature: str) -> bool`

Pausa futuras ejecuciones de una tarea registrada. Requiere que esté en el conjunto local de tareas activas y que el scheduler se haya iniciado. No cancela su ejecución actual.

```python
schedule.pauseTask("reports:build")
```

No iniciada o no activa produce `RuntimeError`; si la contabilidad local la conoce pero el job ya no existe, produce `ValueError`. Los errores del motor al pausar se registran y se convierten en `RuntimeError` con la causa original.

<a id="schedule-resumetask"></a>

### `resumeTask(signature: str) -> bool`

Reanuda una tarea que esta instancia haya pausado. Las condiciones y errores equivalen a los de `pauseTask()`, pero exige su presencia en el conjunto de tareas pausadas.

```python
schedule.resumeTask("reports:build")
```

<a id="schedule-removetask"></a>

### `removeTask(signature: str) -> bool`

Elimina el job y lo retira de los conjuntos de tareas activas/pausadas. Necesita una tarea conocida por esta instancia; no es un buscador universal de entradas persistidas ajenas a la agenda cargada.

```python
schedule.removeTask("reports:build")
```

Una firma no conocida o servicio sin iniciar produce `RuntimeError`; un job ausente después de la comprobación local produce `ValueError`. Fallos del motor se registran y se convierten en `RuntimeError`. Retirar el job no revierte efectos ni cancela automáticamente una ejecución ya enviada; si permanece declarado en código, el siguiente arranque lo volverá a crear.

<a id="schedule-removealltasks"></a>

### `removeAllTasks() -> bool`

Elimina todos los jobs de los stores del scheduler, limpia los conjuntos locales de activas/pausadas y marca las definiciones conocidas como retiradas. Tiene efecto destructivo sobre la agenda persistida; no elimina el código de `tasks()`.

```python
schedule.removeAllTasks()
```

Sin iniciar o ante un fallo del backend produce `RuntimeError`. Los jobs ya ejecutándose no se revierten.

<a id="schedule-shutdown"></a>

### `shutdown(wait: int | None = None) -> None`

Solicita el apagado como tarea async administrada y retorna inmediatamente. `wait` es un retraso previo en segundos, no un timeout de jobs: admite entero no negativo, rechaza booleanos y otros tipos con `TypeError`. `None` conserva el retraso actual, inicialmente `0.5` segundos; `0` lo elimina.

```python
schedule.shutdown(wait=0)
await schedule.wait()
```

Llámalo después de un arranque correcto y una sola vez por ciclo. Tras el retraso se esperan los listeners ya pendientes y se solicita el cierre del planificador. El ejecutor asyncio puede cancelar comandos aún activos: `wait=True` interno no garantiza que sus efectos hayan terminado ni que el comando haya retornado éxito. El wrapper no cambia su estado a `STOPPED` ni restablece automáticamente el evento de apagado para reutilizarlo como un ciclo nuevo.

<a id="schedule-wait"></a>

### `async wait() -> None`

Espera el evento interno que se activa después de solicitar el cierre del scheduler. Si nadie solicita `shutdown()`, puede esperar indefinidamente. No devuelve el resultado de los comandos ni un informe de sus errores.

```python
await schedule.wait()
```

## Integración acotada desde un comando

Este comando registra una sola tarea y ejecuta el scheduler durante tres segundos. Necesita el comando `reports:build` de [la guía inicial](/es/console/task-scheduling) y una instancia de `ISchedule` que todavía no haya arrancado:

```python
import asyncio

from orionis.console.base import BaseCommand
from orionis.console.contracts import ISchedule


class SchedulerDemoCommand(BaseCommand):
    signature = "scheduler:demo"
    description = "Run a bounded scheduler demonstration."

    async def handle(self, schedule: ISchedule) -> int:
        schedule.command("reports:build").everySeconds(1)
        await schedule.boot()
        try:
            await asyncio.sleep(3)
        finally:
            schedule.shutdown(wait=0)
            await schedule.wait()
        return 0
```

No llama a `app.getScheduler()`: declara su propia tarea en ese proceso. Para cargar la agenda normal usa `schedule:work` o la función `load_agenda()` anterior. En producción, el proceso que aloja la agenda debe permanecer activo durante sus horarios; arrancar un scheduler breve dentro de una petición no sustituye ese proceso.

## Errores de operación y arranque

`schedule:work` informa errores conocidos del backend —del acceso SQL, Redis u `OSError`— y retorna `1`. Si ya había iniciado, solicita el apagado antes de terminar. Los errores inesperados se propagan hacia Reactor y su manejador de excepciones; `KeyboardInterrupt` y cancelación solicitan la parada si el servicio había arrancado.

Las excepciones de los comandos se manejan mediante Reactor y pueden convertirse en códigos de salida. Para reaccionar, examina tanto `EXECUTED.retval` como `ERROR.exception`; [Listeners y eventos](/es/console/scheduler-listeners#excepciones-y-códigos-de-salida) desarrolla la diferencia. Un error de listener se registra y pasa a `ICatch`; no detiene ni reintenta automáticamente todos los comandos futuros.
