---
title: "Schedule tasks"
description: "The scheduler executes registered commands using APScheduler 3 triggers. It is not a job queue: it does not automatically add domain serialization, business retries, or Queues…"
editUrl: true
lastUpdated: false
---

The scheduler executes registered commands using APScheduler 3 triggers. It is not a job queue: it does not automatically add domain serialization, business retries, or [Queues](/en/asynchronous/queues) failure history.

## Configure the application schedule

The template uses `app/console/scheduler.py`, with a `BaseScheduler` subclass. Its `tasks` method receives `ISchedule` and registers existing commands. For example, with `reports:build` defined through [commands](/en/console/commands-and-arguments):

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

Keep the skeleton's scheduler registration in `bootstrap/app.py`. If you introduce a different class, import it there and call `app.withScheduler(Scheduler)` before `app.create()`. `schedule:list` should show `reports:build` with its configured daily trigger; `schedule:work` must remain running for scheduled commands to execute. Setting a schedule does not start that process automatically. This example runs daily at 02:30 in the configured application timezone.

`schedule:work` loads the agenda, registers listeners, starts the service, and waits for shutdown. `tasks` may be synchronous, as in the template, or async. Scheduling is separate from importing a command class: its signature must exist in the registry.

Trigger methods (`dailyAt`, `everySeconds`, `cron`, and others) are terminal and return `bool`. Configure `purpose`, `coalesce`, `misfireGraceTime`, `maxInstances`, `randomDelay`, dates, and listeners **before** the trigger. Do not chain methods after `dailyAt`.

## Dependencies in the scheduler and commands

The scheduler supports constructor and `tasks()` injection too. For example, this complete module can replace `app/console/scheduler.py`:

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

The application builds `Scheduler` through the container and resolves `ReportSchedulePolicy`. When loading the agenda, `schedule:list` and `schedule:work` supply `schedule` explicitly, while the container resolves `ReportScheduleLabel` for `tasks()`. Both concrete classes are constructed without additional bindings. This method configures the agenda when it is loaded; it does not run again to inject services at every scheduled execution.

When a trigger fires, Reactor dispatches the command signature. The command receives its own constructor and `handle()` dependencies as shown in [commands](/en/console/commands-and-arguments#constructor-and-method-injection). Scheduler event callbacks receive their event arguments through a direct call: do not add service parameters expecting the same injection as `tasks()`; use collaborators prepared in the constructor.

## Choose a trigger

| Requirement | Terminal |
|---|---|
| Short interval | `everySeconds(15)` |
| Combined intervals | `every(hours=1, minutes=30)` |
| Daily time | `dailyAt(2, 30, 0)` |
| Weekday | `everyMondayAt(...)` and equivalents. |
| One date | `onceAt(2027, 1, 10, 9, 0, 0)` |
| Cron calendar | `cron(day_of_week="mon-fri", hour="9", minute="0")` |

Minute, hour, day, and week helpers are also available, along with `startDate` and `endDate`. Use intervals for elapsed time and cron for calendar scheduling. Do not assume identical behavior around daylight-saving changes. Timezone comes from `app.timezone`, normally `APP_TIMEZONE`, defaulting to `UTC`.

Fluent tasks are stored by **command signature**. Registering the same signature again replaces its pending definition; this is not an API for independent schedules sharing one signature. Use distinct commands delegating to one service when separate schedules are needed.

## Persistence and defaults

The `scheduler` section in `config/scheduler.py` uses:

| Variable | Default / effect |
|---|---|
| `TASKS_STORE` | `memory`; alternatives are `redis`, `database`. |
| `TASKS_MAX_INSTANCES` | 1 concurrent instance per task within the scheduler. |
| `TASKS_COALESCE` | `True`, collapses missed executions. |
| `TASKS_MISFIRE_GRACE_TIME` | 30 seconds of lateness tolerance. |
| `TASKS_REPLACE_EXISTING` | `True`, replaces persisted tasks on restart. |
| `TASKS_JITTER` | 0 seconds of randomized delay. |

Redis uses `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, `REDIS_PASSWORD`, `REDIS_TASKS_KEY` (`scheduler:tasks`), and `REDIS_RUN_TIMES_KEY` (`scheduler:run_times`). Database uses `DB_TASK_CONNECTION` and `DB_TASK_TABLE` (`scheduler_tasks`). That store uses a **synchronous** SQLAlchemy path and needs the corresponding extra's sync driver; it does not share an async request transaction. Redshift is rejected because it lacks enforced uniqueness and indexes.

`memory` disappears when the process ends. A persistent store retains definitions, but does not itself establish a distributed leader or guarantee one execution across processes. Run one responsible scheduler per agenda unless an external architecture has been verified; `maxInstances(1)` is not a global mutex. Keep `replace_existing=True` to restart with already persisted identities.

## Events, state, and shutdown

`BaseScheduler` offers `onStarted`, `onPaused`, `onResumed`, and `onShutdown`. For task events use `.on(event, callback)` or `registerListener` with `BaseTaskListener`; enum `TaskEvent` and `SchedulerEvent` select events, while entities with the same names carry event data. Keep their imports distinct.

The service provides async `boot()` and `info()`; `state`, `isRunning`, `isPaused`, `isStopped`, `pauseTask`, `resumeTask`, `removeTask`, `removeAllTasks`, `pause`, and `resume` provide control. `shutdown()` requests stopping and `await wait()` waits for completion; managed listener coroutines are drained during shutdown. Adding tasks after startup raises `RuntimeError` from `command()`.

A misfire or interruption does not automatically create a business retry. Make commands idempotent, observe their exit codes, and use jobs when explicit leases and retries are required.
