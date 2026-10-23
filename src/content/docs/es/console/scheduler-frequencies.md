---
title: "Frecuencias y calendario de tareas"
description: "Referencia completa de Task: intervalos, calendarios cron, fechas, políticas, listeners y ejemplos de cada frecuencia."
editUrl: true
lastUpdated: false
---

`Schedule.command()` devuelve una tarea fluida que implementa `ITask`. Sus configuradores devuelven la misma instancia (`Self`); los **93 métodos de frecuencia** establecen un trigger y devuelven `bool`, normalmente `True`. Elegir otra frecuencia en la misma instancia sustituye la anterior; no añade un segundo horario.

Los ejemplos de frecuencia de esta página son **alternativas**, para el cuerpo de `tasks()` de este scheduler, después de registrar `reports:build` como se muestra en [Programar tareas](/es/console/task-scheduling):

```python
from orionis.console.base import BaseScheduler
from orionis.console.contracts import ISchedule


class Scheduler(BaseScheduler):
    def tasks(self, schedule: ISchedule) -> None:
        schedule.command("reports:build").dailyAt(2, 30)
```

No pegues todas las alternativas juntas con la misma firma: la agenda usa la firma como clave y la última definición reemplaza la anterior. Todos los horarios usan la zona de `DateTime.getZoneInfo()`, que proviene de la configuración de la aplicación; no existe un setter de zona horaria por tarea en esta API.

## Construcción y configuración

<a id="task-construction"></a>

### `Task(signature: str, args: list[str] | None, kwargs: dict | None = None, purpose: str | None = None) -> None`

Clase concreta exportada por `orionis.console.fluent`. `args` es obligatorio en el constructor directo, aunque acepta `None`, que se convierte en `[]`; `kwargs=None` se convierte en `{}`. Normalmente no necesitas construirla: `schedule.command(signature, args=None, purpose=None)` valida los argumentos y la registra.

`kwargs` pertenece a la entidad y a la salida informativa. El ejecutor programado de Orionis pasa a Reactor **la firma y `args`**, no ese diccionario; usa tokens CLI en `args` para suministrar argumentos u opciones al comando.

```python
from orionis.console.fluent import Task


task = Task("reports:build", args=[], purpose="Daily report")
task.dailyAt(2, 30)
metadata = task.entity()
assert metadata.signature == "reports:build"
```

Construir una tarea directamente no la registra en un scheduler. La referencia siguiente permite inspeccionar sus entidades; para ejecutar tareas utiliza `schedule.command()`.


## Políticas y metadatos


<a id="task-entity"></a>

### `entity()`

```text
entity(random_delay: int | None=0, max_instances: int | None=1, misfire_grace_time: int | None=0, *, coalesce: bool | None=True) -> TaskEntity
```

Construye una entidad `Task` sin registrar ni ejecutar nada. Exige firma y trigger o lanza `ValueError`. Cada configuración explícita prevalece sobre el valor recibido aquí; `coalesce` es exclusivamente por nombre. El valor predeterminado directo de `misfire_grace_time` es `0`, mientras `Schedule` le pasa el default validado de su configuración (normalmente `30`). Para usar la entidad con el scheduler utiliza una tolerancia positiva o `None`.


```python
task = schedule.command("reports:build")
task.dailyAt(2, 30)
metadata = task.entity(random_delay=0, max_instances=1, misfire_grace_time=30, coalesce=True)
assert metadata.max_instances == 1
```


<a id="task-coalesce"></a>

### `coalesce()`

```text
coalesce(*, coalesce: bool=True) -> Self
```

Agrupa (`True`) o conserva (`False`) las ejecuciones atrasadas que el trigger entregue. Útil tras retrasos del proceso; no es un reintento de una ejecución fallida. El parámetro es solo por nombre y el método no añade validación de tipo propia.


```python
schedule.command("reports:build").coalesce(coalesce=False).dailyAt(2, 30)
```


<a id="task-misfiregracetime"></a>

### `misfireGraceTime()`

```text
misfireGraceTime(seconds: int=60) -> Self
```

Define cuántos segundos puede llegar tarde una ejecución antes de considerarse perdida. Exige un entero positivo; `None` no está admitido por este setter, aunque sí por la configuración global.


```python
schedule.command("reports:build").misfireGraceTime(60).dailyAt(2, 30)
```


<a id="task-purpose"></a>

### `purpose()`

```text
purpose(purpose: str) -> Self
```

Etiqueta la tarea para su inspección y nombre del job. Exige una cadena no vacía y conserva el texto recortado; no cambia la firma del comando.


```python
schedule.command("reports:build").purpose("Build the daily report").dailyAt(2, 30)
```


<a id="task-startdate"></a>

### `startDate()`

```text
startDate(year: int, month: int, day: int, hour: int=0, minute: int=0, second: int=0) -> Self
```

Establece el límite inicial en la zona de la aplicación. Debe configurarse antes del trigger. Los componentes deben ser enteros; una fecha inexistente o una hora fuera de rango falla. No cambia el horario de `dailyAt()` a un intervalo contado desde esta fecha.


```python
schedule.command("reports:build").startDate(2030, 1, 1, 8, 0, 0).dailyAt(2, 30)
```


<a id="task-enddate"></a>

### `endDate()`

```text
endDate(year: int, month: int, day: int, hour: int=0, minute: int=0, second: int=0) -> Self
```

Establece el límite final en la zona de la aplicación; configúralo antes del trigger. Usa un fin posterior al inicio. Cuando el horario ya no tiene otra fecha, el scheduler puede retirar la tarea y emitir `REMOVED`.


```python
schedule.command("reports:build").endDate(2030, 12, 31, 23, 59, 59).dailyAt(2, 30)
```


<a id="task-randomdelay"></a>

### `randomDelay()`

```text
randomDelay(max_seconds: int=10) -> Self
```

Muestrea con `secrets.randbelow(max_seconds + 1)` un entero entre `0` y el máximo, y lo usa como límite de jitter del trigger. Exige entero entre `0` y `120`; `0` lo desactiva. El máximo del setter y el valor muestreado no son necesariamente iguales. Los triggers compatibles aplican después su propio retraso aleatorio hasta ese valor.


```python
schedule.command("reports:build").randomDelay(10).dailyAt(2, 30)
```


<a id="task-maxinstances"></a>

### `maxInstances()`

```text
maxInstances(max_instances: int) -> Self
```

Limita las ejecuciones simultáneas de esta firma dentro del scheduler. Exige un entero positivo. Si se alcanza el límite se emite `MAX_INSTANCES`; no crea una cola ni una exclusión mutua entre procesos.


```python
schedule.command("reports:build").maxInstances(1).dailyAt(2, 30)
```


<a id="task-on"></a>

### `on()`

```text
on(event: TaskEvent, callback: Callable) -> Self
```

Registra un callback para un miembro individual del enum `TaskEvent`. Exige enum y callable. El callback recibe una entidad de evento; puede ser sync o `async def`. El builder conserva los registros en orden; al arrancar, el último callback del mismo evento sustituye al anterior con un aviso. Consulta [Listeners y eventos](/es/console/scheduler-listeners).


```python
from orionis.console.entities import TaskEvent as TaskEventData
from orionis.console.enums.events import TaskEvent


async def record_execution(event: TaskEventData) -> None:
    print(f"{event.signature}: exit code {event.retval}")


schedule.command("reports:build").on(TaskEvent.EXECUTED, record_execution).dailyAt(2, 30)
```


<a id="task-registerlistener"></a>

### `registerListener()`

```text
registerListener(listener: BaseTaskListener) -> Self
```

Registra los siete hooks de una **instancia** de `BaseTaskListener`, incluidos los heredados. No acepta la clase sin construir. No incluye un hook `onTaskModified`; para `MODIFIED` usa `on()`. La construcción e inyección se muestran en [listeners](/es/console/scheduler-listeners). El contrato `ITask` anota `IBaseTaskListener`, pero la implementación concreta comprueba `BaseTaskListener`: implementar solo el contrato sin heredar esa base no pasa la comprobación.


```python
from orionis.console.base import BaseTaskListener


listener = BaseTaskListener()
schedule.command("reports:build").registerListener(listener).dailyAt(2, 30)
```


## Fecha única


<a id="task-onceat"></a>

### `onceAt()`

```text
onceAt(year: int, month: int, day: int, hour: int=0, minute: int=0, second: int=0) -> bool
```

Una ejecución en la fecha indicada, con un horario de fecha única. Fija inicio y fin a esa fecha y fuerza una instancia máxima. Rechaza un jitter positivo configurado previamente. Utilízalo para una fecha concreta; un reinicio que vuelva a declarar esa fecha pasada no garantiza repetirla.


```python
schedule.command("reports:build").onceAt(2030, 6, 10, 9, 30)
```


## Segundos


<a id="task-everyseconds"></a>

### `everySeconds()`

```text
everySeconds(seconds: int) -> bool
```

Intervalo de segundos transcurridos, no alineado al reloj del minuto. Exige entero positivo. La selección rechaza un jitter positivo establecido previamente. Útil para comprobaciones frecuentes.


```python
schedule.command("reports:build").everySeconds(15)
```


<a id="task-everyfiveseconds"></a>

### `everyFiveSeconds()`

```text
everyFiveSeconds() -> bool
```

Atajo exacto de `everySeconds(5)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiveSeconds()
```


<a id="task-everytenseconds"></a>

### `everyTenSeconds()`

```text
everyTenSeconds() -> bool
```

Atajo exacto de `everySeconds(10)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTenSeconds()
```


<a id="task-everyfifteenseconds"></a>

### `everyFifteenSeconds()`

```text
everyFifteenSeconds() -> bool
```

Atajo exacto de `everySeconds(15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFifteenSeconds()
```


<a id="task-everytwentyseconds"></a>

### `everyTwentySeconds()`

```text
everyTwentySeconds() -> bool
```

Atajo exacto de `everySeconds(20)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwentySeconds()
```


<a id="task-everytwentyfiveseconds"></a>

### `everyTwentyFiveSeconds()`

```text
everyTwentyFiveSeconds() -> bool
```

Atajo exacto de `everySeconds(25)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwentyFiveSeconds()
```


<a id="task-everythirtyseconds"></a>

### `everyThirtySeconds()`

```text
everyThirtySeconds() -> bool
```

Atajo exacto de `everySeconds(30)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThirtySeconds()
```


<a id="task-everythirtyfiveseconds"></a>

### `everyThirtyFiveSeconds()`

```text
everyThirtyFiveSeconds() -> bool
```

Atajo exacto de `everySeconds(35)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThirtyFiveSeconds()
```


<a id="task-everyfortyseconds"></a>

### `everyFortySeconds()`

```text
everyFortySeconds() -> bool
```

Atajo exacto de `everySeconds(40)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFortySeconds()
```


<a id="task-everyfortyfiveseconds"></a>

### `everyFortyFiveSeconds()`

```text
everyFortyFiveSeconds() -> bool
```

Atajo exacto de `everySeconds(45)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFortyFiveSeconds()
```


<a id="task-everyfiftyseconds"></a>

### `everyFiftySeconds()`

```text
everyFiftySeconds() -> bool
```

Atajo exacto de `everySeconds(50)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiftySeconds()
```


<a id="task-everyfiftyfiveseconds"></a>

### `everyFiftyFiveSeconds()`

```text
everyFiftyFiveSeconds() -> bool
```

Atajo exacto de `everySeconds(55)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiftyFiveSeconds()
```


## Minutos


<a id="task-everyminutes"></a>

### `everyMinutes()`

```text
everyMinutes(minutes: int) -> bool
```

Intervalo de minutos transcurridos. Exige entero positivo. Puede cruzar horas sin reiniciar su cuenta; útil para sondeos cada cierto tiempo.


```python
schedule.command("reports:build").everyMinutes(7)
```


<a id="task-everyminuteat"></a>

### `everyMinuteAt()`

```text
everyMinuteAt(seconds: int) -> bool
```

Calendario cron: cada minuto en el segundo indicado (`0..59`). A diferencia de `everySeconds(60)`, alinea el momento con el reloj. Este constructor no pasa jitter al trigger.


```python
schedule.command("reports:build").everyMinuteAt(15)
```


<a id="task-everyminutesat"></a>

### `everyMinutesAt()`

```text
everyMinutesAt(minutes: int, seconds: int) -> bool
```

Calendario cron con `minute="*/minutes"` y segundo fijo (`0..59`). `minutes` debe ser positivo y su paso debe ser válido para el campo cron; se reinicia dentro de cada hora. Por ejemplo, un paso de `25` produce minutos `00`, `25` y `50`, no intervalos continuos de 25 minutos. Este constructor no pasa jitter al trigger.


```python
schedule.command("reports:build").everyMinutesAt(10, 15)
```


<a id="task-everyfiveminutes"></a>

### `everyFiveMinutes()`

```text
everyFiveMinutes() -> bool
```

Atajo exacto de `everyMinutes(5)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiveMinutes()
```


<a id="task-everyfiveminutesat"></a>

### `everyFiveMinutesAt()`

```text
everyFiveMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(5, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiveMinutesAt(15)
```


<a id="task-everytenminutes"></a>

### `everyTenMinutes()`

```text
everyTenMinutes() -> bool
```

Atajo exacto de `everyMinutes(10)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTenMinutes()
```


<a id="task-everytenminutesat"></a>

### `everyTenMinutesAt()`

```text
everyTenMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(10, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTenMinutesAt(15)
```


<a id="task-everyfifteenminutes"></a>

### `everyFifteenMinutes()`

```text
everyFifteenMinutes() -> bool
```

Atajo exacto de `everyMinutes(15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFifteenMinutes()
```


<a id="task-everyfifteenminutesat"></a>

### `everyFifteenMinutesAt()`

```text
everyFifteenMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(15, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFifteenMinutesAt(15)
```


<a id="task-everytwentyminutes"></a>

### `everyTwentyMinutes()`

```text
everyTwentyMinutes() -> bool
```

Atajo exacto de `everyMinutes(20)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwentyMinutes()
```


<a id="task-everytwentyminutesat"></a>

### `everyTwentyMinutesAt()`

```text
everyTwentyMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(20, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwentyMinutesAt(15)
```


<a id="task-everytwentyfiveminutes"></a>

### `everyTwentyFiveMinutes()`

```text
everyTwentyFiveMinutes() -> bool
```

Atajo exacto de `everyMinutes(25)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwentyFiveMinutes()
```


<a id="task-everytwentyfiveminutesat"></a>

### `everyTwentyFiveMinutesAt()`

```text
everyTwentyFiveMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(25, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwentyFiveMinutesAt(15)
```


<a id="task-everythirtyminutes"></a>

### `everyThirtyMinutes()`

```text
everyThirtyMinutes() -> bool
```

Atajo exacto de `everyMinutes(30)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThirtyMinutes()
```


<a id="task-everythirtyminutesat"></a>

### `everyThirtyMinutesAt()`

```text
everyThirtyMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(30, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThirtyMinutesAt(15)
```


<a id="task-everythirtyfiveminutes"></a>

### `everyThirtyFiveMinutes()`

```text
everyThirtyFiveMinutes() -> bool
```

Atajo exacto de `everyMinutes(35)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThirtyFiveMinutes()
```


<a id="task-everythirtyfiveminutesat"></a>

### `everyThirtyFiveMinutesAt()`

```text
everyThirtyFiveMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(35, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThirtyFiveMinutesAt(15)
```


<a id="task-everyfortyminutes"></a>

### `everyFortyMinutes()`

```text
everyFortyMinutes() -> bool
```

Atajo exacto de `everyMinutes(40)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFortyMinutes()
```


<a id="task-everyfortyminutesat"></a>

### `everyFortyMinutesAt()`

```text
everyFortyMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(40, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFortyMinutesAt(15)
```


<a id="task-everyfortyfiveminutes"></a>

### `everyFortyFiveMinutes()`

```text
everyFortyFiveMinutes() -> bool
```

Atajo exacto de `everyMinutes(45)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFortyFiveMinutes()
```


<a id="task-everyfortyfiveminutesat"></a>

### `everyFortyFiveMinutesAt()`

```text
everyFortyFiveMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(45, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFortyFiveMinutesAt(15)
```


<a id="task-everyfiftyminutes"></a>

### `everyFiftyMinutes()`

```text
everyFiftyMinutes() -> bool
```

Atajo exacto de `everyMinutes(50)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiftyMinutes()
```


<a id="task-everyfiftyminutesat"></a>

### `everyFiftyMinutesAt()`

```text
everyFiftyMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(50, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiftyMinutesAt(15)
```


<a id="task-everyfiftyfiveminutes"></a>

### `everyFiftyFiveMinutes()`

```text
everyFiftyFiveMinutes() -> bool
```

Atajo exacto de `everyMinutes(55)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiftyFiveMinutes()
```


<a id="task-everyfiftyfiveminutesat"></a>

### `everyFiftyFiveMinutesAt()`

```text
everyFiftyFiveMinutesAt(seconds: int) -> bool
```

Atajo exacto de `everyMinutesAt(55, 15)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiftyFiveMinutesAt(15)
```


## Horas


<a id="task-hourly"></a>

### `hourly()`

```text
hourly() -> bool
```

Intervalo transcurrido de una hora. No significa necesariamente la hora en punto; usa `hourlyAt(0)` para alinear las ejecuciones con el reloj.


```python
schedule.command("reports:build").hourly()
```


<a id="task-hourlyat"></a>

### `hourlyAt()`

```text
hourlyAt(minute: int, second: int=0) -> bool
```

Calendario cron: cada hora en el minuto (`0..59`) y segundo (`0..59`) indicados. Por ejemplo, el minuto 30 de cada hora.


```python
schedule.command("reports:build").hourlyAt(30, 0)
```


<a id="task-everyoddhours"></a>

### `everyOddHours()`

```text
everyOddHours() -> bool
```

Calendario cron para horas `1, 3, 5, …, 23`, en minuto y segundo cero. Útil para alternar horarios civiles, no para medir un intervalo desde el arranque.


```python
schedule.command("reports:build").everyOddHours()
```


<a id="task-everyevenhours"></a>

### `everyEvenHours()`

```text
everyEvenHours() -> bool
```

Calendario cron para horas `0, 2, 4, …, 22`, en minuto y segundo cero.


```python
schedule.command("reports:build").everyEvenHours()
```


<a id="task-everyhours"></a>

### `everyHours()`

```text
everyHours(hours: int) -> bool
```

Intervalo de horas transcurridas; exige un entero positivo. El inicio y los cambios de hora civil no deben interpretarse como un calendario de horas fijas.


```python
schedule.command("reports:build").everyHours(3)
```


<a id="task-everyhoursat"></a>

### `everyHoursAt()`

```text
everyHoursAt(hours: int, minute: int, second: int=0) -> bool
```

Calendario cron con `hour="*/hours"`, minuto y segundo fijos (`0..59`). Se reinicia cada día y no cuenta horas desde el arranque; por ejemplo, paso `3` selecciona `00`, `03`, `06`, …, `21`. El paso debe ser válido para el campo cron.


```python
schedule.command("reports:build").everyHoursAt(3, 20, 0)
```


<a id="task-everytwohours"></a>

### `everyTwoHours()`

```text
everyTwoHours() -> bool
```

Atajo exacto de `everyHours(2)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwoHours()
```


<a id="task-everytwohoursat"></a>

### `everyTwoHoursAt()`

```text
everyTwoHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(2, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwoHoursAt(30, 0)
```


<a id="task-everythreehours"></a>

### `everyThreeHours()`

```text
everyThreeHours() -> bool
```

Atajo exacto de `everyHours(3)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThreeHours()
```


<a id="task-everythreehoursat"></a>

### `everyThreeHoursAt()`

```text
everyThreeHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(3, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThreeHoursAt(30, 0)
```


<a id="task-everyfourhours"></a>

### `everyFourHours()`

```text
everyFourHours() -> bool
```

Atajo exacto de `everyHours(4)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFourHours()
```


<a id="task-everyfourhoursat"></a>

### `everyFourHoursAt()`

```text
everyFourHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(4, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFourHoursAt(30, 0)
```


<a id="task-everyfivehours"></a>

### `everyFiveHours()`

```text
everyFiveHours() -> bool
```

Atajo exacto de `everyHours(5)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiveHours()
```


<a id="task-everyfivehoursat"></a>

### `everyFiveHoursAt()`

```text
everyFiveHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(5, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiveHoursAt(30, 0)
```


<a id="task-everysixhours"></a>

### `everySixHours()`

```text
everySixHours() -> bool
```

Atajo exacto de `everyHours(6)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everySixHours()
```


<a id="task-everysixhoursat"></a>

### `everySixHoursAt()`

```text
everySixHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(6, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everySixHoursAt(30, 0)
```


<a id="task-everysevenhours"></a>

### `everySevenHours()`

```text
everySevenHours() -> bool
```

Atajo exacto de `everyHours(7)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everySevenHours()
```


<a id="task-everysevenhoursat"></a>

### `everySevenHoursAt()`

```text
everySevenHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(7, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everySevenHoursAt(30, 0)
```


<a id="task-everyeighthours"></a>

### `everyEightHours()`

```text
everyEightHours() -> bool
```

Atajo exacto de `everyHours(8)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyEightHours()
```


<a id="task-everyeighthoursat"></a>

### `everyEightHoursAt()`

```text
everyEightHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(8, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyEightHoursAt(30, 0)
```


<a id="task-everyninehours"></a>

### `everyNineHours()`

```text
everyNineHours() -> bool
```

Atajo exacto de `everyHours(9)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyNineHours()
```


<a id="task-everyninehoursat"></a>

### `everyNineHoursAt()`

```text
everyNineHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(9, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyNineHoursAt(30, 0)
```


<a id="task-everytenhours"></a>

### `everyTenHours()`

```text
everyTenHours() -> bool
```

Atajo exacto de `everyHours(10)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTenHours()
```


<a id="task-everytenhoursat"></a>

### `everyTenHoursAt()`

```text
everyTenHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(10, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTenHoursAt(30, 0)
```


<a id="task-everyelevenhours"></a>

### `everyElevenHours()`

```text
everyElevenHours() -> bool
```

Atajo exacto de `everyHours(11)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyElevenHours()
```


<a id="task-everyelevenhoursat"></a>

### `everyElevenHoursAt()`

```text
everyElevenHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(11, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyElevenHoursAt(30, 0)
```


<a id="task-everytwelvehours"></a>

### `everyTwelveHours()`

```text
everyTwelveHours() -> bool
```

Atajo exacto de `everyHours(12)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwelveHours()
```


<a id="task-everytwelvehoursat"></a>

### `everyTwelveHoursAt()`

```text
everyTwelveHoursAt(minute: int, second: int=0) -> bool
```

Atajo exacto de `everyHoursAt(12, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwelveHoursAt(30, 0)
```


## Días


<a id="task-daily"></a>

### `daily()`

```text
daily() -> bool
```

Calendario cron todos los días a `00:00:00` en la zona de la aplicación.


```python
schedule.command("reports:build").daily()
```


<a id="task-dailyat"></a>

### `dailyAt()`

```text
dailyAt(hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron diario con hora `0..23`, minuto y segundo `0..59`. Útil para procesos nocturnos o informes diarios.


```python
schedule.command("reports:build").dailyAt(2, 30, 0)
```


<a id="task-everydays"></a>

### `everyDays()`

```text
everyDays(days: int) -> bool
```

Intervalo de días transcurridos; exige un entero positivo. No es el calendario por días del mes que crea `everyDaysAt()`.


```python
schedule.command("reports:build").everyDays(3)
```


<a id="task-everydaysat"></a>

### `everyDaysAt()`

```text
everyDaysAt(days: int, hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron con `day="*/days"`, hora `0..23`, minuto y segundo `0..59`. Cuenta posiciones dentro del mes: paso `3` selecciona días `1, 4, 7, …`; se reinicia al cambiar el mes. No garantiza separaciones constantes de tres días entre meses. El paso debe ser válido para el campo cron.


```python
schedule.command("reports:build").everyDaysAt(3, 2, 30, 0)
```


<a id="task-everytwodays"></a>

### `everyTwoDays()`

```text
everyTwoDays() -> bool
```

Atajo exacto de `everyDays(2)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwoDays()
```


<a id="task-everytwodaysat"></a>

### `everyTwoDaysAt()`

```text
everyTwoDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Atajo exacto de `everyDaysAt(2, 2, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyTwoDaysAt(2, 30, 0)
```


<a id="task-everythreedays"></a>

### `everyThreeDays()`

```text
everyThreeDays() -> bool
```

Atajo exacto de `everyDays(3)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThreeDays()
```


<a id="task-everythreedaysat"></a>

### `everyThreeDaysAt()`

```text
everyThreeDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Atajo exacto de `everyDaysAt(3, 2, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyThreeDaysAt(2, 30, 0)
```


<a id="task-everyfourdays"></a>

### `everyFourDays()`

```text
everyFourDays() -> bool
```

Atajo exacto de `everyDays(4)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFourDays()
```


<a id="task-everyfourdaysat"></a>

### `everyFourDaysAt()`

```text
everyFourDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Atajo exacto de `everyDaysAt(4, 2, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFourDaysAt(2, 30, 0)
```


<a id="task-everyfivedays"></a>

### `everyFiveDays()`

```text
everyFiveDays() -> bool
```

Atajo exacto de `everyDays(5)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiveDays()
```


<a id="task-everyfivedaysat"></a>

### `everyFiveDaysAt()`

```text
everyFiveDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Atajo exacto de `everyDaysAt(5, 2, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everyFiveDaysAt(2, 30, 0)
```


<a id="task-everysixdays"></a>

### `everySixDays()`

```text
everySixDays() -> bool
```

Atajo exacto de `everyDays(6)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everySixDays()
```


<a id="task-everysixdaysat"></a>

### `everySixDaysAt()`

```text
everySixDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Atajo exacto de `everyDaysAt(6, 2, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everySixDaysAt(2, 30, 0)
```


<a id="task-everysevendays"></a>

### `everySevenDays()`

```text
everySevenDays() -> bool
```

Atajo exacto de `everyDays(7)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everySevenDays()
```


<a id="task-everysevendaysat"></a>

### `everySevenDaysAt()`

```text
everySevenDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Atajo exacto de `everyDaysAt(7, 2, 30, 0)`. Comparte su trigger, validación y reglas de calendario; úsalo cuando este intervalo fijo describa mejor la intención de la tarea.


```python
schedule.command("reports:build").everySevenDaysAt(2, 30, 0)
```


## Semanas y días de semana


<a id="task-everymondayat"></a>

### `everyMondayAt()`

```text
everyMondayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron los lunes a la hora indicada. Hora `0..23`, minuto y segundo `0..59`. Útil para procesos semanales con un día civil concreto.


```python
schedule.command("reports:build").everyMondayAt(9, 30, 0)
```


<a id="task-everytuesdayat"></a>

### `everyTuesdayAt()`

```text
everyTuesdayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron los martes a la hora indicada. Hora `0..23`, minuto y segundo `0..59`. Útil para procesos semanales con un día civil concreto.


```python
schedule.command("reports:build").everyTuesdayAt(9, 30, 0)
```


<a id="task-everywednesdayat"></a>

### `everyWednesdayAt()`

```text
everyWednesdayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron los miércoles a la hora indicada. Hora `0..23`, minuto y segundo `0..59`. Útil para procesos semanales con un día civil concreto.


```python
schedule.command("reports:build").everyWednesdayAt(9, 30, 0)
```


<a id="task-everythursdayat"></a>

### `everyThursdayAt()`

```text
everyThursdayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron los jueves a la hora indicada. Hora `0..23`, minuto y segundo `0..59`. Útil para procesos semanales con un día civil concreto.


```python
schedule.command("reports:build").everyThursdayAt(9, 30, 0)
```


<a id="task-everyfridayat"></a>

### `everyFridayAt()`

```text
everyFridayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron los viernes a la hora indicada. Hora `0..23`, minuto y segundo `0..59`. Útil para procesos semanales con un día civil concreto.


```python
schedule.command("reports:build").everyFridayAt(9, 30, 0)
```


<a id="task-everysaturdayat"></a>

### `everySaturdayAt()`

```text
everySaturdayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron los sábados a la hora indicada. Hora `0..23`, minuto y segundo `0..59`. Útil para procesos semanales con un día civil concreto.


```python
schedule.command("reports:build").everySaturdayAt(9, 30, 0)
```


<a id="task-everysundayat"></a>

### `everySundayAt()`

```text
everySundayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Calendario cron los domingos a la hora indicada. Hora `0..23`, minuto y segundo `0..59`. Útil para procesos semanales con un día civil concreto.


```python
schedule.command("reports:build").everySundayAt(9, 30, 0)
```


<a id="task-weekly"></a>

### `weekly()`

```text
weekly() -> bool
```

Calendario cron los domingos a `00:00:00`. Para otra hora o día usa el helper de día de semana correspondiente.


```python
schedule.command("reports:build").weekly()
```


<a id="task-everyweeks"></a>

### `everyWeeks()`

```text
everyWeeks(weeks: int) -> bool
```

Intervalo de semanas transcurridas; exige un entero positivo. Para un día civil fijo de la semana utiliza los helpers `everyMondayAt()` y equivalentes.


```python
schedule.command("reports:build").everyWeeks(2)
```


## Intervalo compuesto y cron


<a id="task-every"></a>

### `every()`

```text
every(weeks: int=0, days: int=0, hours: int=0, minutes: int=0, seconds: int=0) -> bool
```

Combina semanas, días, horas, minutos y segundos en un único intervalo. Todos deben ser enteros no negativos y al menos uno debe ser mayor que cero; no crea cinco horarios separados.


```python
schedule.command("reports:build").every(days=1, hours=2, minutes=30)
```


<a id="task-cron"></a>

### `cron()`

```text
cron(year: str | None=None, month: str | None=None, day: str | None=None, week: str | None=None, day_of_week: str | None=None, hour: str | None=None, minute: str | None=None, second: str | None=None) -> bool
```

Calendario cron por campos independientes. Al menos un campo debe ser distinto de `None`; cada campo debe ser válido para el calendario cron. No recibe una expresión cron completa como primer argumento: ese argumento es `year`. Consulta los campos debajo.


```python
schedule.command("reports:build").cron(day_of_week="mon-fri", hour="9", minute="0", second="0")
```


## Campos de cron y validación

Los parámetros de `cron()` aceptan cadenas o `None`: `year` (año), `month` (`1..12` o abreviaturas), `day` (`1..31`), `week` (semana ISO), `day_of_week` (`0..6`, lunes primero, o `mon..sun`), `hour` (`0..23`), `minute` y `second` (`0..59`). Los campos admiten expresiones del trigger como `"*"`, `"*/5"`, `"9-17"` y `"mon,wed,fri"`; los valores proporcionados deben cumplirse conjuntamente. No es la firma de un cron de cinco columnas ni una API `from_crontab` de Orionis.

Para evitar ambigüedades, especifica los campos de hora, minuto y segundo relevantes. Los campos omitidos usan las reglas del calendario cron: los de menor precisión que el último campo indicado pueden tomar sus mínimos. Por ejemplo, `cron(hour="9")` usa minuto y segundo cero; para todos los minutos de esa hora escribe `cron(hour="9", minute="*", second="0")`.

### Expresiones de calendario

| Campo | Valores del trigger |
|---|---|
| `year` | `1970..9999`. |
| `month` | `1..12` o `jan..dec`. |
| `day` | `1..31`, `last` o una posición de día de semana, como `2nd mon`. |
| `week` | Semana ISO `1..53`. |
| `day_of_week` | `0..6`, de lunes a domingo, o `mon..sun`. |
| `hour` | `0..23`. |
| `minute`, `second` | `0..59`. |

Cada ejemplo siguiente es otra alternativa dentro de `tasks()`. Estos patrones configuran el calendario cron de Orionis:

```python
# Valor fijo: día 15 de cada mes a las 09:00.
schedule.command("reports:build").cron(day="15", hour="9", minute="0")
```

```python
# Lista: lunes, miércoles y viernes a las 09:00.
schedule.command("reports:build").cron(day_of_week="mon,wed,fri", hour="9")
```

```python
# Rango: cada hora de 09:00 a 17:00, de lunes a viernes.
schedule.command("reports:build").cron(day_of_week="mon-fri", hour="9-17")
```

```python
# Paso desde el mínimo del campo: cada 10 minutos, segundo cero.
schedule.command("reports:build").cron(minute="*/10", second="0")
```

```python
# Paso dentro de un rango: 09:00, 11:00, 13:00, 15:00 y 17:00.
schedule.command("reports:build").cron(hour="9-17/2", minute="0")
```

```python
# Paso desde un valor hasta el máximo del campo: minutos 5, 20, 35 y 50.
schedule.command("reports:build").cron(minute="5/15", second="0")
```

```python
# Rango de meses por nombre: primer día de enero a marzo.
schedule.command("reports:build").cron(month="jan-mar", day="1", hour="9")
```

```python
# Último día de cada mes, aunque tenga 28, 29, 30 o 31 días.
schedule.command("reports:build").cron(day="last", hour="18")
```

```python
# Segundo lunes de cada mes.
schedule.command("reports:build").cron(day="2nd mon", hour="9")
```

```python
# Último viernes de cada mes.
schedule.command("reports:build").cron(day="last fri", hour="18")
```

Las posiciones admitidas en `day` son `1st`, `2nd`, `3rd`, `4th`, `5th` y `last`, seguidas de un nombre de día. Si una fecha no existe, el calendario no inventa otra: por ejemplo, un día 31 no se ejecuta en febrero. Combinar `day` y `day_of_week` exige **ambas condiciones**, no la regla OR de algunos crontabs del sistema.

Los intervalos positivos rechazan cero o negativos. Las selecciones de hora y fecha verifican sus rangos; los campos y pasos cron también pueden producir `ValueError` desde el trigger. No supongas que un intervalo válido como `everyMinutes(90)` sea válido como paso de minuto en `everyMinutesAt(90, 0)`.

Las fechas usan la zona de la aplicación y deben representar días existentes. Los calendarios civiles y los intervalos transcurridos pueden comportarse de forma distinta en cambios de zona u horario estacional; elige el trigger por la intención del negocio.

### Límites y jitter

`startDate()` y `endDate()` deben preceder al método de frecuencia: el trigger captura esas fechas al construirse. No se reconstruye automáticamente por cambiar después la entidad informativa. `randomDelay()` sí actualiza un trigger existente si tiene atributo `jitter`, pero no vuelve a ejecutar las validaciones del selector; configura las opciones antes de la frecuencia para obtener el comportamiento validado.

`onceAt()` y `everySeconds()` rechazan un jitter positivo que ya esté establecido. `everyMinuteAt()` y `everyMinutesAt()` no pasan jitter al crear el trigger. Los restantes constructores de intervalo y cron lo reciben cuando está configurado. El default global de `jitter` no modifica el trigger, como se explica en [configuración](/es/console/scheduler-configuration#alcance-real-de-jitter).

<a id="task-entity-data"></a>

## Entidad de una tarea

`orionis.console.entities.Task` es una dataclass por nombre, diferente del builder `orionis.console.fluent.Task`. Es el resultado de `entity()` y conserva estos campos:

| Campo | Tipo y valor inicial |
|---|---|
| `signature` | `str`, obligatorio. Identidad del comando y del job. |
| `args` | `list[str] \| None`, lista nueva `[]`. Tokens para Reactor. |
| `kwargs` | `dict \| None`, diccionario nuevo `{}`. Metadato; el ejecutor no lo envía al comando. |
| `purpose` | `str \| None = None`. Etiqueta. |
| `random_delay` | `int \| None = None`. Jitter informativo o configurado en la tarea. |
| `start_date`, `end_date` | `datetime \| None = None`. Límites temporales. |
| `trigger` | Objeto de calendario cron, fecha única o intervalo; inicialmente `None`. Permite calcular las próximas ejecuciones. |
| `details` | `str \| None = None`. Descripción generada por el selector. |
| `max_instances` | `int \| None = 1`. Concurrencia por firma. |
| `misfire_grace_time` | `int \| None = None`. Tolerancia. |
| `coalesce` | `bool \| None = True`. Agrupación de ejecuciones atrasadas. |
| `listeners` | Lista nueva `[]`. La anotación pública es `list[Callable[..., None]]`; el builder guarda realmente pares `(TaskEvent, callback)`, que consume `Schedule.boot()`. |

Estos son los valores de la **entidad directa**. La entidad creada por el builder puede contener los defaults de `entity()` o los valores que `Schedule` le proporciona desde la configuración. `entity()` no es una copia profunda: listas de argumentos y listeners siguen siendo los objetos del builder. Termina la configuración antes de iniciar el scheduler.
