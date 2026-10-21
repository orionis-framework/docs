---
title: "Programar tareas"
description: "El scheduler ejecuta comandos registrados con triggers de APScheduler 3. No es una cola de jobs: no añade automáticamente serialización de dominio, reintentos de negocio ni…"
editUrl: true
lastUpdated: false
---

El scheduler ejecuta comandos registrados con triggers de APScheduler 3. No es una cola de jobs: no añade automáticamente serialización de dominio, reintentos de negocio ni historial de fallos de [Queues](/es/asynchronous/queues).

## Configurar la agenda de la aplicación

La plantilla usa `app/console/scheduler.py`, con una clase que hereda `BaseScheduler`. Su método `tasks` recibe `ISchedule` y registra comandos existentes. Por ejemplo, con `reports:build` definido mediante [comandos](/es/console/commands-and-arguments):

```python
from orionis.console.base import BaseScheduler
from orionis.console.contracts import ISchedule


class Scheduler(BaseScheduler):
    def tasks(self, schedule: ISchedule) -> None:
        (
            schedule.command("reports:build", purpose="Daily reports")
            .coalesce()
            .misfireGraceTime(60)
            .maxInstances(1)
            .dailyAt(2, 30)
        )
```

```shell
uv run python -B reactor schedule:list
uv run python -B reactor schedule:work
```

Conserva el registro del scheduler del esqueleto en `bootstrap/app.py`. Si introduces otra clase, impórtala allí y llama a `app.withScheduler(Scheduler)` antes de `app.create()`. `schedule:list` debe mostrar `reports:build` con el horario diario configurado; `schedule:work` debe permanecer activo para ejecutar las tareas. Declarar una agenda no inicia ese proceso automáticamente. Este ejemplo se ejecuta cada día a las 02:30 en la zona horaria configurada.

`schedule:work` carga la agenda, registra listeners, inicia el servicio y espera hasta la parada. `tasks` puede ser síncrono, como en la plantilla, o async. Es distinto de importar una clase de comando: la firma debe existir en el registro.

La selección temporal (`dailyAt`, `everySeconds`, `cron`, etc.) es terminal y devuelve `bool`. Configura `purpose`, `coalesce`, `misfireGraceTime`, `maxInstances`, `randomDelay`, fechas y listeners **antes** del trigger. No encadenes otro método después de `dailyAt`.

## Dependencias en el scheduler y en los comandos

El scheduler también admite inyección en el constructor y en `tasks()`. Por ejemplo, este módulo completo puede reemplazar `app/console/scheduler.py`:

```python
from orionis.console.base import BaseScheduler
from orionis.console.contracts import ISchedule


class ReportSchedulePolicy:
    def hour(self) -> int:
        return 2


class ReportScheduleLabel:
    def purpose(self) -> str:
        return "Daily reports"


class Scheduler(BaseScheduler):
    def __init__(self, policy: ReportSchedulePolicy) -> None:
        self.policy = policy

    def tasks(
        self,
        schedule: ISchedule,
        labels: ReportScheduleLabel,
    ) -> None:
        (
            schedule.command("reports:build", purpose=labels.purpose())
            .maxInstances(1)
            .dailyAt(self.policy.hour(), 30)
        )
```

La aplicación construye `Scheduler` mediante el contenedor y resuelve `ReportSchedulePolicy`. Al cargar la agenda, `schedule:list` y `schedule:work` proporcionan `schedule` explícitamente y el contenedor resuelve `ReportScheduleLabel` para `tasks()`. Las dos clases concretas se construyen sin bindings adicionales. Este método configura la agenda al cargarla; no se invoca nuevamente para inyectar servicios en cada ejecución programada.

Cuando vence un horario, se despacha la firma mediante Reactor. El comando obtiene sus propias dependencias de constructor y `handle()` como se muestra en [comandos](/es/console/commands-and-arguments#inyección-por-constructor-y-por-método). Los callbacks de eventos del scheduler reciben sus argumentos de evento mediante una llamada directa: no añadas parámetros de servicios esperando la misma inyección de `tasks()`; usa colaboradores preparados en el constructor.

## Elegir un trigger

| Necesidad | Terminal |
|---|---|
| Intervalo breve | `everySeconds(15)` |
| Intervalos combinados | `every(hours=1, minutes=30)` |
| Hora diaria | `dailyAt(2, 30, 0)` |
| Día de semana | `everyMondayAt(...)`, y equivalentes |
| Fecha única | `onceAt(2027, 1, 10, 9, 0, 0)` |
| Calendario cron | `cron(day_of_week="mon-fri", hour="9", minute="0")` |

Existen helpers de minutos, horas, días y semanas, además de `startDate` y `endDate`. Usa intervalos para tiempo transcurrido y cron para calendario. No asumas que ambos responden igual a cambios de horario estacional. La zona viene de `app.timezone`, normalmente `APP_TIMEZONE`, con default `UTC`.

La agenda fluida guarda tareas por **firma de comando**. Registrar otra vez la misma firma reemplaza esa definición pendiente; no es una API para crear dos horarios independientes para una firma. Usa comandos con identidades distintas que deleguen al mismo servicio si necesitas agendas separadas.

## Persistencia y valores predeterminados

La sección `scheduler` de `config/scheduler.py` usa:

| Variable | Default / efecto |
|---|---|
| `TASKS_STORE` | `memory`; alternativas `redis`, `database`. |
| `TASKS_MAX_INSTANCES` | 1 instancia concurrente por tarea en el scheduler. |
| `TASKS_COALESCE` | `True`, agrupa ejecuciones atrasadas. |
| `TASKS_MISFIRE_GRACE_TIME` | 30 segundos de tolerancia. |
| `TASKS_REPLACE_EXISTING` | `True`, reemplaza tareas persistidas al reiniciar. |
| `TASKS_JITTER` | 0 segundos de dispersión aleatoria. |

Redis utiliza `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_PASSWORD`, `REDIS_TASKS_KEY` (`scheduler:tasks`) y `REDIS_RUN_TIMES_KEY` (`scheduler:run_times`). Database utiliza `DB_TASK_CONNECTION` y `DB_TASK_TABLE` (`scheduler_tasks`). Ese store crea una ruta SQLAlchemy **síncrona**, por lo que necesita el driver sync del extra correspondiente; no comparte la transacción async de una petición. Redshift se rechaza por falta de unicidad impuesta e índices.

`memory` se pierde al terminar el proceso. Un store persistente conserva definiciones, pero no establece por sí mismo un líder distribuido ni una garantía de ejecución única entre procesos. Opera una instancia responsable de cada agenda salvo arquitectura externa probada; `maxInstances(1)` no es un mutex global. Mantén `replace_existing=True` para reiniciar con identidades ya persistidas.

## Eventos, estado y apagado

`BaseScheduler` ofrece `onStarted`, `onPaused`, `onResumed` y `onShutdown`. Para eventos de tarea usa `.on(event, callback)` o `registerListener` con `BaseTaskListener`; los tipos `TaskEvent` y `SchedulerEvent` de enums seleccionan eventos, mientras entidades del mismo nombre transportan datos. No confundas ambos imports.

El servicio expone `boot()` e `info()` async; `state`, `isRunning`, `isPaused`, `isStopped`, `pauseTask`, `resumeTask`, `removeTask`, `removeAllTasks`, `pause` y `resume` permiten control. `shutdown()` solicita la parada y `await wait()` espera su finalización; las coroutines de listeners se gestionan y drenan durante el apagado. No se permiten nuevas tareas después de iniciar: `command()` produce `RuntimeError`.

Una interrupción/misfire no genera automáticamente un retry de negocio. Diseña comandos idempotentes, observa sus códigos de salida y utiliza jobs cuando necesites leases y reintentos explícitos.
