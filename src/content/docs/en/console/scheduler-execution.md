---
title: "Scheduler execution and API"
description: "Complete Schedule and ISchedule API, injection, programmatic execution, task controls, removal, and shutdown."
editUrl: true
lastUpdated: false
---

The `Scheduler` class in `app/console/scheduler.py` describes the agenda. Its execution **service** is `Schedule`, implementing `ISchedule`; the public facade is named **`Schedule`**, not `Scheduler`:

```python
from orionis.console.contracts import ISchedule
from orionis.support.facades import Schedule
```

<a id="schedule-command"></a>

## Schedule.command(): schedule a command

`Schedule.command()` **registers a command in the agenda** and returns its task builder; it does not execute the command immediately. This synchronous method takes no `await`. The same operation is available as `schedule.command()` when you receive the `ISchedule` service through injection.

Your application's `Scheduler` class implements `tasks()`; the registration method belongs to the **`Schedule`** facade and the `ISchedule` service.

```text
command(
    signature: str,
    args: list[str] | None = None,
    purpose: str | None = None,
) -> ITask
```

| Parameter | Usage |
|---|---|
| `signature` | Required. Exact signature of a command registered in Reactor, such as `reports:export`. This is not a class, file path, or shell line. |
| `args` | Optional, defaults to `None`, equivalent to `[]`. Every element is a `str` CLI token, including arguments and options declared by the command. |
| `purpose` | Optional, defaults to `None`. Label identifying the task in `schedule:list`; it is not passed to the command as an argument. |

### A command accepting arguments and options

Save this example as `app/console/commands/export_report_command.py`. It shows exactly which values a scheduled command receives:

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

### Register the task in BaseScheduler.tasks()

In `app/console/scheduler.py`, the container supplies `ISchedule` to `tasks()`:

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

Daily at 02:30 in the application timezone, the command receives `period="2026-10"` and `format="json"`. Tokens match running `orionis reports:export 2026-10 --format json`. Do not pass a string such as `"2026-10 --format json"`: the service requires a list and does not tokenize shell lines. A value containing spaces belongs in one element, such as `"Ada Lovelace"`, without shell quotes inside that text.

After `command()`, configure concurrency, dates, listeners, and other [task options](/en/console/scheduler-frequencies), then select a frequency. Terminal methods such as `dailyAt()` return `True`; do not chain further configuration after them.

### Use the Schedule facade

To use the facade, keep the class and `tasks()` method above, import `Schedule`, and replace its task declaration with:

```python
from orionis.support.facades import Schedule

# Inside tasks(), as an alternative to schedule.command(...):
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

Always import the facade from `orionis.support.facades`. After application boot it delegates to the same `ISchedule` singleton; it does not create a separate agenda. The [injection section](#dependency-injection) shows how to receive that service by constructor or method in other components.

### Register the class and start processing

In `bootstrap/app.py`, before `app.create()`, register the class declaring your agenda:

```python
from app.console.scheduler import Scheduler

app.withScheduler(Scheduler)
```

Check the command, inspect the agenda, then keep the scheduler running:

```shell
orionis reports:export 2026-10 --format json
orionis schedule:list
orionis schedule:work
```

Equivalent project-local commands are:

```shell
python -B reactor reports:export 2026-10 --format json
python -B reactor schedule:list
python -B reactor schedule:work
```

`withScheduler()` registers the class; `command()` declares a task; `schedule:work` starts the process that follows its timing. [The task guide](/en/console/task-scheduling#scheduler-registration) details application registration.

### Identity, validation, and restrictions

The agenda identifies tasks by **command signature**. Calling `command()` again with the same signature replaces its pending definition, including arguments and timing; it does not create two independent tasks. Use distinct command signatures delegating to a shared service when separate agendas require the same business logic.

The signature must be a nonempty string and is not trimmed during registration. `args` must be `None` or a list containing only strings. Invalid values raise `TypeError`. Command existence and a configured frequency are checked by `info()` or `boot()`; an invalid task raises `ValueError`.

Declare tasks while the service remains in its initial `STOPPED` state. `command()` raises `RuntimeError` after scheduler startup or pause. It does not dynamically add tasks to an already-running agenda or automatically start queue workers.

## Execution forms

| Form | Behavior |
|---|---|
| `orionis reports:build` or `python -B reactor reports:build` | Runs a command immediately; no clock is loaded and its schedule is not applied. |
| `orionis schedule:list` or `python -B reactor schedule:list` | Loads declarations and displays metadata; it does not start scheduling or enumerate persisted execution history. |
| `orionis schedule:work` or `python -B reactor schedule:work` | Loads the registered class, tasks, and hooks; starts the scheduler and waits for shutdown. |
| `await Reactor.call("reports:build", [])` | Executes the command immediately in the current process through Reactor. |
| `ISchedule` service or `Schedule` facade | Declares and controls an agenda from async code; your integration owns loading, listeners, startup, and shutdown. |
| Scheduled command dispatching `Queue.dispatch(...)` | The scheduler decides when to submit a job; the Queue backend and worker determine processing. |

These tasks are **registered commands**. `command()` does not accept arbitrary functions, `BaseJob` classes, or shell snippets. External processes invoked by a command belong to that command's implementation.

<a id="scheduler-provider"></a>
<a id="schedule-facade"></a>

## Service registration and facade

`ScheduleProvider.register() -> None` binds `IScheduleStore → ScheduleStore` and `ISchedule → Schedule` as singletons. Its `async boot() -> None` pins the facade but **does not start the agenda**. There is no need to register the native provider again or start a clock merely to inspect configuration.

`Schedule.getFacadeAccessor() -> type` returns `ISchedule`. All 16 public service methods below are available through the facade after normal application boot. Await asynchronous methods and call synchronous methods directly. Declaring a task with `Schedule.command(...)` does not execute its command.

Inspect the facade from a command:

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

A CLI command in another process receives **its own singleton**: `scheduler:state` does not remotely administer `schedule:work` in another terminal. The same applies to web requests in another process. Sharing a store does not turn `Schedule` instances into a remote control channel.

<a id="schedule-construction"></a>

## Dependency injection

The concrete constructor is:

```text
Schedule(reactor: IReactor, exception_handler: ICatch, stores: IScheduleStore) -> None
```

The container resolves those services. Request `ISchedule` in your components rather than building a `Schedule` without its collaborators.

This example combines constructor injection into a service with method injection into a command:

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

Both collaborators receive the same application singleton. This example inspects the current process without registering tasks or starting scheduling.

## Load the application agenda programmatically

`schedule:work` performs the following integration steps. Manage them explicitly in a custom host:

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

This requires a booted application and active event loop. `app.call()` supports synchronous or async `tasks()` and injects its remaining dependencies. Calling `boot()` alone does not locate the application's agenda class or attach its lifecycle hooks.

## Complete `ISchedule` and `Schedule` API

Control methods operate locally and return `True` on completion. They represent failures with exceptions, rather than `False`.

<a id="schedule-info"></a>

### `async info() -> list[dict]`

Loads Reactor signatures, validates tasks, and constructs entities using configuration defaults. It starts no scheduler and executes no command. Unknown command signatures and tasks without triggers raise `ValueError`.

```python
tasks = await schedule.info()
for task in tasks:
    print(task["signature"], task["details"], task["max_instances"])
```

Each dictionary contains `signature`, `args`, `kwargs`, `purpose`, `random_delay`, `coalesce`, `max_instances`, `misfire_grace_time`, `start_date`, `end_date`, and `details`. Dates use `YYYY-MM-DD HH:mm:ss` or `None`, without a timezone offset in that text. Results do not include execution history or next run times read from the store.

<a id="schedule-boot"></a>

### `async boot() -> None`

Validates commands and tasks, prepares scheduling on the current loop and application timezone, adds stores, connects events, and registers jobs identified by command signature. Each job invokes Reactor with its signature and tokens. Finally starts the clock and sets wrapper state to `RUNNING`.

```python
await schedule.boot()
```

Requires an active loop and reachable backend. Configuration, signatures, connections, serialization, and persisted identity conflicts can interrupt startup. Start each instance once; repeated `boot()` calls have no idempotence guard or transactional restart guarantee.

<a id="schedule-on"></a>

### `on(event: SchedulerEvent, listener: Callable) -> Self`

Registers a callback for an individual global enum member before startup. Returns the same service and replaces its previous callback for that event. Invalid event/callable types raise `TypeError`; registration after startup raises `RuntimeError`.

```python
from orionis.console.enums.events import SchedulerEvent


async def log_start(event) -> None:
    print(event.description)


schedule.on(SchedulerEvent.STARTED, log_start)
```

For task events, use `schedule.command(...).on(TaskEvent.EXECUTED, callback)`; [listeners](/en/console/scheduler-listeners) explains payloads and callback ordering.

<a id="schedule-state"></a>

### `state() -> str`

Returns `"STOPPED"`, `"RUNNING"`, or `"PAUSED"` from wrapper state. Starts as `STOPPED`; it does not query the backend.

```python
print(schedule.state())
```

<a id="schedule-isrunning"></a>

### `isRunning() -> bool`

Tests whether that state is `RUNNING`.

```python
if schedule.isRunning():
    print("The scheduler is running in this process")
```

<a id="schedule-ispaused"></a>

### `isPaused() -> bool`

Tests whether that state is `PAUSED`.

```python
if schedule.isPaused():
    print("Dispatch is paused")
```

<a id="schedule-isstopped"></a>

### `isStopped() -> bool`

Tests whether that state is `STOPPED`. Useful for inspecting an initial instance, but shutdown currently does not update the state; do not use it to wait for shutdown.

```python
if schedule.isStopped():
    print("This scheduler has not started")
```

<a id="schedule-pause"></a>

### `pause() -> bool`

Pauses global dispatch and sets `PAUSED`. Requires a started scheduler in `RUNNING` state; otherwise raises `RuntimeError`. Existing command executions are not cancelled.

```python
schedule.pause()
```

<a id="schedule-resume"></a>

### `resume() -> bool`

Resumes global dispatch and sets `RUNNING`. Requires `PAUSED`, otherwise raises `RuntimeError`. Overdue run times remain subject to coalescing and grace time.

```python
schedule.resume()
```

<a id="schedule-pausetask"></a>

### `pauseTask(signature: str) -> bool`

Pauses future runs of a registered task. Requires a started scheduler and membership in its local active-task set; it does not cancel a current execution.

```python
schedule.pauseTask("reports:build")
```

An unstarted scheduler or inactive task raises `RuntimeError`; a locally known task missing from the engine raises `ValueError`. Engine errors are logged and wrapped in `RuntimeError` with their original cause.

<a id="schedule-resumetask"></a>

### `resumeTask(signature: str) -> bool`

Resumes a task paused by this instance. Preconditions and errors mirror `pauseTask()`, except the signature must belong to the paused-task set.

```python
schedule.resumeTask("reports:build")
```

<a id="schedule-removetask"></a>

### `removeTask(signature: str) -> bool`

Removes a job and clears it from active/paused sets. Requires a task known to this instance; it does not universally discover unrelated persisted entries outside the loaded agenda.

```python
schedule.removeTask("reports:build")
```

Unknown signatures or an unstarted service raise `RuntimeError`; disappearance after the local check raises `ValueError`. Engine failures are logged and wrapped in `RuntimeError`. Removal does not undo effects or automatically cancel a submitted execution. If the code still declares it, the next startup creates it again.

<a id="schedule-removealltasks"></a>

### `removeAllTasks() -> bool`

Deletes all jobs from scheduler stores, clears active/paused sets, and marks known definitions removed. This destructively changes a persisted agenda; it does not delete `tasks()` code.

```python
schedule.removeAllTasks()
```

An unstarted service or backend failure raises `RuntimeError`. Existing command effects are not rolled back.

<a id="schedule-shutdown"></a>

### `shutdown(wait: int | None = None) -> None`

Requests shutdown through a managed async task and returns immediately. `wait` is a preceding delay in seconds, not a job timeout. It accepts nonnegative integers; booleans and other types raise `TypeError`. `None` retains the current delay, initially `0.5` seconds; `0` removes it.

```python
schedule.shutdown(wait=0)
await schedule.wait()
```

Call after successful startup, once per lifecycle. After the delay, already-pending listeners are awaited and scheduler closure is requested. Its asyncio executor can cancel active commands: internal `wait=True` does not guarantee completed effects or successful command results. The wrapper does not change state to `STOPPED` or reset its shutdown event for another lifecycle.

<a id="schedule-wait"></a>

### `async wait() -> None`

Waits for the internal event set after requesting scheduler closure. Without a `shutdown()` request it can wait indefinitely. It returns neither command results nor an error report.

```python
await schedule.wait()
```

## Bounded command integration

This command registers one task and runs scheduling for three seconds. It requires `reports:build` from [the introductory guide](/en/console/task-scheduling) and an `ISchedule` instance that has not started:

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

It does not call `app.getScheduler()`: it declares its own task in this process. Use `schedule:work` or `load_agenda()` above to load the normal agenda. A production host must remain alive for scheduled runs; briefly starting a scheduler inside a request does not replace that process.

## Startup and operation errors

`schedule:work` reports known backend errors —SQL access, Redis, or `OSError`— and returns `1`. If already started, it requests shutdown first. Unexpected errors propagate to Reactor and its exception handler; `KeyboardInterrupt` and cancellation request shutdown when startup completed.

Reactor handles command exceptions and can convert them to exit codes. Observe both `EXECUTED.retval` and `ERROR.exception`; [Listeners and events](/en/console/scheduler-listeners#exceptions-and-exit-codes) explains the distinction. Listener errors are logged and passed to `ICatch`; they do not automatically stop or retry every future command.
