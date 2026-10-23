---
title: "Task frequencies and calendars"
description: "Complete Task reference: intervals, cron calendars, dates, policies, listeners, and an example for every frequency."
editUrl: true
lastUpdated: false
---

`Schedule.command()` returns a fluent task implementing `ITask`. Configuration methods return the same instance (`Self`); the **93 frequency methods** set a trigger and return `bool`, normally `True`. Selecting another frequency on the same instance replaces the previous trigger rather than adding a second schedule.

Frequency examples on this page are **alternatives** for the body of this scheduler's `tasks()`, after registering `reports:build` as shown in [Schedule tasks](/en/console/task-scheduling):

```python
from orionis.console.base import BaseScheduler
from orionis.console.contracts import ISchedule


class Scheduler(BaseScheduler):
    def tasks(self, schedule: ISchedule) -> None:
        schedule.command("reports:build").dailyAt(2, 30)
```

Do not paste all alternatives together with the same signature: the agenda keys tasks by command signature, so the last declaration replaces the previous one. All calendars use `DateTime.getZoneInfo()` from application configuration; this API has no per-task timezone setter.

## Construction and configuration

<a id="task-construction"></a>

### `Task(signature: str, args: list[str] | None, kwargs: dict | None = None, purpose: str | None = None) -> None`

The concrete class is exported by `orionis.console.fluent`. Direct construction requires `args`, although `None` is accepted and becomes `[]`; `kwargs=None` becomes `{}`. Normally use `schedule.command(signature, args=None, purpose=None)`, which validates arguments and registers the task.

`kwargs` belongs to the entity and informational output. Orionis's scheduled executor passes **the signature and `args`** to Reactor, not that dictionary; provide command arguments and options as CLI tokens in `args`.

```python
from orionis.console.fluent import Task


task = Task("reports:build", args=[], purpose="Daily report")
task.dailyAt(2, 30)
metadata = task.entity()
assert metadata.signature == "reports:build"
```

Direct construction does not register a task with a scheduler. This reference supports entity inspection; use `schedule.command()` to schedule execution.


## Policies and metadata


<a id="task-entity"></a>

### `entity()`

```text
entity(random_delay: int | None=0, max_instances: int | None=1, misfire_grace_time: int | None=0, *, coalesce: bool | None=True) -> TaskEntity
```

Builds a `Task` entity without registering or executing it. Requires a signature and trigger or raises `ValueError`. Explicit task settings override these fallback arguments; `coalesce` is keyword-only. Direct `misfire_grace_time` defaults to `0`, whereas `Schedule` supplies its validated configuration default (normally `30`). Use a positive grace time or `None` for scheduling.


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

Collapses (`True`) or retains (`False`) overdue runs supplied by the trigger. Useful after process delays; this is not a retry of a failed execution. The argument is keyword-only and the setter adds no type validation.


```python
schedule.command("reports:build").coalesce(coalesce=False).dailyAt(2, 30)
```


<a id="task-misfiregracetime"></a>

### `misfireGraceTime()`

```text
misfireGraceTime(seconds: int=60) -> Self
```

Sets the allowed lateness in seconds before a run is considered missed. Requires a positive integer; this setter does not accept `None`, although global configuration does.


```python
schedule.command("reports:build").misfireGraceTime(60).dailyAt(2, 30)
```


<a id="task-purpose"></a>

### `purpose()`

```text
purpose(purpose: str) -> Self
```

Labels the task for inspection and as the job name. Requires a nonempty string and trims it; it does not change the command signature.


```python
schedule.command("reports:build").purpose("Build the daily report").dailyAt(2, 30)
```


<a id="task-startdate"></a>

### `startDate()`

```text
startDate(year: int, month: int, day: int, hour: int=0, minute: int=0, second: int=0) -> Self
```

Sets the lower date bound in the application timezone. Configure it before selecting the trigger. Components must be integers; invalid dates and out-of-range times fail. It does not turn a `dailyAt()` calendar into an interval measured from this date.


```python
schedule.command("reports:build").startDate(2030, 1, 1, 8, 0, 0).dailyAt(2, 30)
```


<a id="task-enddate"></a>

### `endDate()`

```text
endDate(year: int, month: int, day: int, hour: int=0, minute: int=0, second: int=0) -> Self
```

Sets the upper date bound in the application timezone; configure it before the trigger. Use an end after the start. When the schedule has no further run times, the scheduler can remove the task and emit `REMOVED`.


```python
schedule.command("reports:build").endDate(2030, 12, 31, 23, 59, 59).dailyAt(2, 30)
```


<a id="task-randomdelay"></a>

### `randomDelay()`

```text
randomDelay(max_seconds: int=10) -> Self
```

Samples an integer between `0` and the maximum using `secrets.randbelow(max_seconds + 1)`, then uses that sampled value as the trigger jitter limit. Requires an integer from `0` through `120`; `0` disables it. The supplied maximum and sampled limit can differ. Compatible triggers then apply their own random delay up to that limit.


```python
schedule.command("reports:build").randomDelay(10).dailyAt(2, 30)
```


<a id="task-maxinstances"></a>

### `maxInstances()`

```text
maxInstances(max_instances: int) -> Self
```

Limits simultaneous executions of this signature within the scheduler. Requires a positive integer. Reaching the limit emits `MAX_INSTANCES`; it does not create a queue or cross-process mutex.


```python
schedule.command("reports:build").maxInstances(1).dailyAt(2, 30)
```


<a id="task-on"></a>

### `on()`

```text
on(event: TaskEvent, callback: Callable) -> Self
```

Registers a callback for an individual `TaskEvent` enum member. Requires an enum and callable. The callback receives an event entity and can be synchronous or `async def`. The builder retains registrations in order; startup replaces an earlier callback for the same event with the last one and logs a warning. See [Listeners and events](/en/console/scheduler-listeners).


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

Registers the seven hooks of a **`BaseTaskListener` instance**, including inherited hooks. It does not accept the unconstructed class. There is no `onTaskModified` hook; use `on()` for `MODIFIED`. See [listeners](/en/console/scheduler-listeners) for construction and injection. The `ITask` contract annotates `IBaseTaskListener`, but the concrete implementation checks `BaseTaskListener`; implementing only the contract without extending that base fails the check.


```python
from orionis.console.base import BaseTaskListener


listener = BaseTaskListener()
schedule.command("reports:build").registerListener(listener).dailyAt(2, 30)
```


## One date


<a id="task-onceat"></a>

### `onceAt()`

```text
onceAt(year: int, month: int, day: int, hour: int=0, minute: int=0, second: int=0) -> bool
```

One run on the supplied date using a one-date schedule. Sets both bounds to that date and forces one maximum instance. Rejects previously configured positive jitter. Use it for a specific date; redeclaring a past date after restart does not guarantee replay.


```python
schedule.command("reports:build").onceAt(2030, 6, 10, 9, 30)
```


## Seconds


<a id="task-everyseconds"></a>

### `everySeconds()`

```text
everySeconds(seconds: int) -> bool
```

Elapsed-second interval, not aligned to the clock minute. Requires a positive integer. Selecting it rejects previously configured positive jitter. Suitable for frequent checks.


```python
schedule.command("reports:build").everySeconds(15)
```


<a id="task-everyfiveseconds"></a>

### `everyFiveSeconds()`

```text
everyFiveSeconds() -> bool
```

Exact shortcut for `everySeconds(5)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiveSeconds()
```


<a id="task-everytenseconds"></a>

### `everyTenSeconds()`

```text
everyTenSeconds() -> bool
```

Exact shortcut for `everySeconds(10)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTenSeconds()
```


<a id="task-everyfifteenseconds"></a>

### `everyFifteenSeconds()`

```text
everyFifteenSeconds() -> bool
```

Exact shortcut for `everySeconds(15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFifteenSeconds()
```


<a id="task-everytwentyseconds"></a>

### `everyTwentySeconds()`

```text
everyTwentySeconds() -> bool
```

Exact shortcut for `everySeconds(20)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwentySeconds()
```


<a id="task-everytwentyfiveseconds"></a>

### `everyTwentyFiveSeconds()`

```text
everyTwentyFiveSeconds() -> bool
```

Exact shortcut for `everySeconds(25)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwentyFiveSeconds()
```


<a id="task-everythirtyseconds"></a>

### `everyThirtySeconds()`

```text
everyThirtySeconds() -> bool
```

Exact shortcut for `everySeconds(30)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThirtySeconds()
```


<a id="task-everythirtyfiveseconds"></a>

### `everyThirtyFiveSeconds()`

```text
everyThirtyFiveSeconds() -> bool
```

Exact shortcut for `everySeconds(35)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThirtyFiveSeconds()
```


<a id="task-everyfortyseconds"></a>

### `everyFortySeconds()`

```text
everyFortySeconds() -> bool
```

Exact shortcut for `everySeconds(40)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFortySeconds()
```


<a id="task-everyfortyfiveseconds"></a>

### `everyFortyFiveSeconds()`

```text
everyFortyFiveSeconds() -> bool
```

Exact shortcut for `everySeconds(45)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFortyFiveSeconds()
```


<a id="task-everyfiftyseconds"></a>

### `everyFiftySeconds()`

```text
everyFiftySeconds() -> bool
```

Exact shortcut for `everySeconds(50)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiftySeconds()
```


<a id="task-everyfiftyfiveseconds"></a>

### `everyFiftyFiveSeconds()`

```text
everyFiftyFiveSeconds() -> bool
```

Exact shortcut for `everySeconds(55)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiftyFiveSeconds()
```


## Minutes


<a id="task-everyminutes"></a>

### `everyMinutes()`

```text
everyMinutes(minutes: int) -> bool
```

Elapsed-minute interval. Requires a positive integer. It can cross hour boundaries without resetting its count; suitable for periodic polling.


```python
schedule.command("reports:build").everyMinutes(7)
```


<a id="task-everyminuteat"></a>

### `everyMinuteAt()`

```text
everyMinuteAt(seconds: int) -> bool
```

Cron calendar: every minute at the supplied second (`0..59`). Unlike `everySeconds(60)`, it aligns with the clock. This constructor does not pass jitter to the trigger.


```python
schedule.command("reports:build").everyMinuteAt(15)
```


<a id="task-everyminutesat"></a>

### `everyMinutesAt()`

```text
everyMinutesAt(minutes: int, seconds: int) -> bool
```

Cron calendar with `minute="*/minutes"` and a fixed second (`0..59`). `minutes` must be positive and the step valid for the cron field; it resets within each hour. For example, a step of `25` means minutes `00`, `25`, and `50`, not continuous 25-minute intervals. This constructor does not pass jitter to the trigger.


```python
schedule.command("reports:build").everyMinutesAt(10, 15)
```


<a id="task-everyfiveminutes"></a>

### `everyFiveMinutes()`

```text
everyFiveMinutes() -> bool
```

Exact shortcut for `everyMinutes(5)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiveMinutes()
```


<a id="task-everyfiveminutesat"></a>

### `everyFiveMinutesAt()`

```text
everyFiveMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(5, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiveMinutesAt(15)
```


<a id="task-everytenminutes"></a>

### `everyTenMinutes()`

```text
everyTenMinutes() -> bool
```

Exact shortcut for `everyMinutes(10)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTenMinutes()
```


<a id="task-everytenminutesat"></a>

### `everyTenMinutesAt()`

```text
everyTenMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(10, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTenMinutesAt(15)
```


<a id="task-everyfifteenminutes"></a>

### `everyFifteenMinutes()`

```text
everyFifteenMinutes() -> bool
```

Exact shortcut for `everyMinutes(15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFifteenMinutes()
```


<a id="task-everyfifteenminutesat"></a>

### `everyFifteenMinutesAt()`

```text
everyFifteenMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(15, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFifteenMinutesAt(15)
```


<a id="task-everytwentyminutes"></a>

### `everyTwentyMinutes()`

```text
everyTwentyMinutes() -> bool
```

Exact shortcut for `everyMinutes(20)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwentyMinutes()
```


<a id="task-everytwentyminutesat"></a>

### `everyTwentyMinutesAt()`

```text
everyTwentyMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(20, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwentyMinutesAt(15)
```


<a id="task-everytwentyfiveminutes"></a>

### `everyTwentyFiveMinutes()`

```text
everyTwentyFiveMinutes() -> bool
```

Exact shortcut for `everyMinutes(25)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwentyFiveMinutes()
```


<a id="task-everytwentyfiveminutesat"></a>

### `everyTwentyFiveMinutesAt()`

```text
everyTwentyFiveMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(25, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwentyFiveMinutesAt(15)
```


<a id="task-everythirtyminutes"></a>

### `everyThirtyMinutes()`

```text
everyThirtyMinutes() -> bool
```

Exact shortcut for `everyMinutes(30)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThirtyMinutes()
```


<a id="task-everythirtyminutesat"></a>

### `everyThirtyMinutesAt()`

```text
everyThirtyMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(30, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThirtyMinutesAt(15)
```


<a id="task-everythirtyfiveminutes"></a>

### `everyThirtyFiveMinutes()`

```text
everyThirtyFiveMinutes() -> bool
```

Exact shortcut for `everyMinutes(35)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThirtyFiveMinutes()
```


<a id="task-everythirtyfiveminutesat"></a>

### `everyThirtyFiveMinutesAt()`

```text
everyThirtyFiveMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(35, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThirtyFiveMinutesAt(15)
```


<a id="task-everyfortyminutes"></a>

### `everyFortyMinutes()`

```text
everyFortyMinutes() -> bool
```

Exact shortcut for `everyMinutes(40)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFortyMinutes()
```


<a id="task-everyfortyminutesat"></a>

### `everyFortyMinutesAt()`

```text
everyFortyMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(40, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFortyMinutesAt(15)
```


<a id="task-everyfortyfiveminutes"></a>

### `everyFortyFiveMinutes()`

```text
everyFortyFiveMinutes() -> bool
```

Exact shortcut for `everyMinutes(45)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFortyFiveMinutes()
```


<a id="task-everyfortyfiveminutesat"></a>

### `everyFortyFiveMinutesAt()`

```text
everyFortyFiveMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(45, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFortyFiveMinutesAt(15)
```


<a id="task-everyfiftyminutes"></a>

### `everyFiftyMinutes()`

```text
everyFiftyMinutes() -> bool
```

Exact shortcut for `everyMinutes(50)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiftyMinutes()
```


<a id="task-everyfiftyminutesat"></a>

### `everyFiftyMinutesAt()`

```text
everyFiftyMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(50, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiftyMinutesAt(15)
```


<a id="task-everyfiftyfiveminutes"></a>

### `everyFiftyFiveMinutes()`

```text
everyFiftyFiveMinutes() -> bool
```

Exact shortcut for `everyMinutes(55)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiftyFiveMinutes()
```


<a id="task-everyfiftyfiveminutesat"></a>

### `everyFiftyFiveMinutesAt()`

```text
everyFiftyFiveMinutesAt(seconds: int) -> bool
```

Exact shortcut for `everyMinutesAt(55, 15)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiftyFiveMinutesAt(15)
```


## Hours


<a id="task-hourly"></a>

### `hourly()`

```text
hourly() -> bool
```

Elapsed one-hour interval. It does not necessarily mean the top of the hour; use `hourlyAt(0)` for clock alignment.


```python
schedule.command("reports:build").hourly()
```


<a id="task-hourlyat"></a>

### `hourlyAt()`

```text
hourlyAt(minute: int, second: int=0) -> bool
```

Cron calendar: every hour at the supplied minute (`0..59`) and second (`0..59`), such as half past each hour.


```python
schedule.command("reports:build").hourlyAt(30, 0)
```


<a id="task-everyoddhours"></a>

### `everyOddHours()`

```text
everyOddHours() -> bool
```

Cron calendar at hours `1, 3, 5, …, 23`, minute and second zero. Useful for alternating civil-time slots, not measuring an interval from startup.


```python
schedule.command("reports:build").everyOddHours()
```


<a id="task-everyevenhours"></a>

### `everyEvenHours()`

```text
everyEvenHours() -> bool
```

Cron calendar at hours `0, 2, 4, …, 22`, minute and second zero.


```python
schedule.command("reports:build").everyEvenHours()
```


<a id="task-everyhours"></a>

### `everyHours()`

```text
everyHours(hours: int) -> bool
```

Elapsed-hour interval requiring a positive integer. Its start and civil-time changes should not be interpreted as fixed calendar hours.


```python
schedule.command("reports:build").everyHours(3)
```


<a id="task-everyhoursat"></a>

### `everyHoursAt()`

```text
everyHoursAt(hours: int, minute: int, second: int=0) -> bool
```

Cron calendar using `hour="*/hours"` with fixed minute and second (`0..59`). It resets each day rather than counting hours from startup; a step of `3` selects `00`, `03`, `06`, …, `21`. The step must be valid for the cron field.


```python
schedule.command("reports:build").everyHoursAt(3, 20, 0)
```


<a id="task-everytwohours"></a>

### `everyTwoHours()`

```text
everyTwoHours() -> bool
```

Exact shortcut for `everyHours(2)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwoHours()
```


<a id="task-everytwohoursat"></a>

### `everyTwoHoursAt()`

```text
everyTwoHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(2, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwoHoursAt(30, 0)
```


<a id="task-everythreehours"></a>

### `everyThreeHours()`

```text
everyThreeHours() -> bool
```

Exact shortcut for `everyHours(3)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThreeHours()
```


<a id="task-everythreehoursat"></a>

### `everyThreeHoursAt()`

```text
everyThreeHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(3, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThreeHoursAt(30, 0)
```


<a id="task-everyfourhours"></a>

### `everyFourHours()`

```text
everyFourHours() -> bool
```

Exact shortcut for `everyHours(4)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFourHours()
```


<a id="task-everyfourhoursat"></a>

### `everyFourHoursAt()`

```text
everyFourHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(4, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFourHoursAt(30, 0)
```


<a id="task-everyfivehours"></a>

### `everyFiveHours()`

```text
everyFiveHours() -> bool
```

Exact shortcut for `everyHours(5)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiveHours()
```


<a id="task-everyfivehoursat"></a>

### `everyFiveHoursAt()`

```text
everyFiveHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(5, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiveHoursAt(30, 0)
```


<a id="task-everysixhours"></a>

### `everySixHours()`

```text
everySixHours() -> bool
```

Exact shortcut for `everyHours(6)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everySixHours()
```


<a id="task-everysixhoursat"></a>

### `everySixHoursAt()`

```text
everySixHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(6, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everySixHoursAt(30, 0)
```


<a id="task-everysevenhours"></a>

### `everySevenHours()`

```text
everySevenHours() -> bool
```

Exact shortcut for `everyHours(7)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everySevenHours()
```


<a id="task-everysevenhoursat"></a>

### `everySevenHoursAt()`

```text
everySevenHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(7, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everySevenHoursAt(30, 0)
```


<a id="task-everyeighthours"></a>

### `everyEightHours()`

```text
everyEightHours() -> bool
```

Exact shortcut for `everyHours(8)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyEightHours()
```


<a id="task-everyeighthoursat"></a>

### `everyEightHoursAt()`

```text
everyEightHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(8, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyEightHoursAt(30, 0)
```


<a id="task-everyninehours"></a>

### `everyNineHours()`

```text
everyNineHours() -> bool
```

Exact shortcut for `everyHours(9)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyNineHours()
```


<a id="task-everyninehoursat"></a>

### `everyNineHoursAt()`

```text
everyNineHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(9, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyNineHoursAt(30, 0)
```


<a id="task-everytenhours"></a>

### `everyTenHours()`

```text
everyTenHours() -> bool
```

Exact shortcut for `everyHours(10)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTenHours()
```


<a id="task-everytenhoursat"></a>

### `everyTenHoursAt()`

```text
everyTenHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(10, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTenHoursAt(30, 0)
```


<a id="task-everyelevenhours"></a>

### `everyElevenHours()`

```text
everyElevenHours() -> bool
```

Exact shortcut for `everyHours(11)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyElevenHours()
```


<a id="task-everyelevenhoursat"></a>

### `everyElevenHoursAt()`

```text
everyElevenHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(11, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyElevenHoursAt(30, 0)
```


<a id="task-everytwelvehours"></a>

### `everyTwelveHours()`

```text
everyTwelveHours() -> bool
```

Exact shortcut for `everyHours(12)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwelveHours()
```


<a id="task-everytwelvehoursat"></a>

### `everyTwelveHoursAt()`

```text
everyTwelveHoursAt(minute: int, second: int=0) -> bool
```

Exact shortcut for `everyHoursAt(12, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwelveHoursAt(30, 0)
```


## Days


<a id="task-daily"></a>

### `daily()`

```text
daily() -> bool
```

Cron calendar every day at `00:00:00` in the application timezone.


```python
schedule.command("reports:build").daily()
```


<a id="task-dailyat"></a>

### `dailyAt()`

```text
dailyAt(hour: int, minute: int=0, second: int=0) -> bool
```

Daily cron calendar with hour `0..23`, minute and second `0..59`. Suitable for nightly processing or daily reports.


```python
schedule.command("reports:build").dailyAt(2, 30, 0)
```


<a id="task-everydays"></a>

### `everyDays()`

```text
everyDays(days: int) -> bool
```

Elapsed-day interval requiring a positive integer. This differs from the day-of-month calendar created by `everyDaysAt()`.


```python
schedule.command("reports:build").everyDays(3)
```


<a id="task-everydaysat"></a>

### `everyDaysAt()`

```text
everyDaysAt(days: int, hour: int, minute: int=0, second: int=0) -> bool
```

Cron calendar using `day="*/days"`, hour `0..23`, minute and second `0..59`. It counts positions within each month: step `3` selects days `1, 4, 7, …` and resets next month. It does not guarantee constant three-day gaps across month boundaries. The step must be valid for the cron field.


```python
schedule.command("reports:build").everyDaysAt(3, 2, 30, 0)
```


<a id="task-everytwodays"></a>

### `everyTwoDays()`

```text
everyTwoDays() -> bool
```

Exact shortcut for `everyDays(2)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwoDays()
```


<a id="task-everytwodaysat"></a>

### `everyTwoDaysAt()`

```text
everyTwoDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Exact shortcut for `everyDaysAt(2, 2, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyTwoDaysAt(2, 30, 0)
```


<a id="task-everythreedays"></a>

### `everyThreeDays()`

```text
everyThreeDays() -> bool
```

Exact shortcut for `everyDays(3)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThreeDays()
```


<a id="task-everythreedaysat"></a>

### `everyThreeDaysAt()`

```text
everyThreeDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Exact shortcut for `everyDaysAt(3, 2, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyThreeDaysAt(2, 30, 0)
```


<a id="task-everyfourdays"></a>

### `everyFourDays()`

```text
everyFourDays() -> bool
```

Exact shortcut for `everyDays(4)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFourDays()
```


<a id="task-everyfourdaysat"></a>

### `everyFourDaysAt()`

```text
everyFourDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Exact shortcut for `everyDaysAt(4, 2, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFourDaysAt(2, 30, 0)
```


<a id="task-everyfivedays"></a>

### `everyFiveDays()`

```text
everyFiveDays() -> bool
```

Exact shortcut for `everyDays(5)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiveDays()
```


<a id="task-everyfivedaysat"></a>

### `everyFiveDaysAt()`

```text
everyFiveDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Exact shortcut for `everyDaysAt(5, 2, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everyFiveDaysAt(2, 30, 0)
```


<a id="task-everysixdays"></a>

### `everySixDays()`

```text
everySixDays() -> bool
```

Exact shortcut for `everyDays(6)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everySixDays()
```


<a id="task-everysixdaysat"></a>

### `everySixDaysAt()`

```text
everySixDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Exact shortcut for `everyDaysAt(6, 2, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everySixDaysAt(2, 30, 0)
```


<a id="task-everysevendays"></a>

### `everySevenDays()`

```text
everySevenDays() -> bool
```

Exact shortcut for `everyDays(7)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everySevenDays()
```


<a id="task-everysevendaysat"></a>

### `everySevenDaysAt()`

```text
everySevenDaysAt(hour: int, minute: int=0, second: int=0) -> bool
```

Exact shortcut for `everyDaysAt(7, 2, 30, 0)`. Shares that method's trigger, validation, and calendar rules; use it when this fixed interval expresses the task's intent clearly.


```python
schedule.command("reports:build").everySevenDaysAt(2, 30, 0)
```


## Weeks and weekdays


<a id="task-everymondayat"></a>

### `everyMondayAt()`

```text
everyMondayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Cron calendar on Monday at the supplied time. Hour `0..23`, minute and second `0..59`. Suitable for weekly work on a fixed calendar day.


```python
schedule.command("reports:build").everyMondayAt(9, 30, 0)
```


<a id="task-everytuesdayat"></a>

### `everyTuesdayAt()`

```text
everyTuesdayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Cron calendar on Tuesday at the supplied time. Hour `0..23`, minute and second `0..59`. Suitable for weekly work on a fixed calendar day.


```python
schedule.command("reports:build").everyTuesdayAt(9, 30, 0)
```


<a id="task-everywednesdayat"></a>

### `everyWednesdayAt()`

```text
everyWednesdayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Cron calendar on Wednesday at the supplied time. Hour `0..23`, minute and second `0..59`. Suitable for weekly work on a fixed calendar day.


```python
schedule.command("reports:build").everyWednesdayAt(9, 30, 0)
```


<a id="task-everythursdayat"></a>

### `everyThursdayAt()`

```text
everyThursdayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Cron calendar on Thursday at the supplied time. Hour `0..23`, minute and second `0..59`. Suitable for weekly work on a fixed calendar day.


```python
schedule.command("reports:build").everyThursdayAt(9, 30, 0)
```


<a id="task-everyfridayat"></a>

### `everyFridayAt()`

```text
everyFridayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Cron calendar on Friday at the supplied time. Hour `0..23`, minute and second `0..59`. Suitable for weekly work on a fixed calendar day.


```python
schedule.command("reports:build").everyFridayAt(9, 30, 0)
```


<a id="task-everysaturdayat"></a>

### `everySaturdayAt()`

```text
everySaturdayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Cron calendar on Saturday at the supplied time. Hour `0..23`, minute and second `0..59`. Suitable for weekly work on a fixed calendar day.


```python
schedule.command("reports:build").everySaturdayAt(9, 30, 0)
```


<a id="task-everysundayat"></a>

### `everySundayAt()`

```text
everySundayAt(hour: int, minute: int=0, second: int=0) -> bool
```

Cron calendar on Sunday at the supplied time. Hour `0..23`, minute and second `0..59`. Suitable for weekly work on a fixed calendar day.


```python
schedule.command("reports:build").everySundayAt(9, 30, 0)
```


<a id="task-weekly"></a>

### `weekly()`

```text
weekly() -> bool
```

Cron calendar on Sundays at `00:00:00`. Choose a weekday helper for another day or time.


```python
schedule.command("reports:build").weekly()
```


<a id="task-everyweeks"></a>

### `everyWeeks()`

```text
everyWeeks(weeks: int) -> bool
```

Elapsed-week interval requiring a positive integer. Use `everyMondayAt()` or its peers for a fixed civil weekday.


```python
schedule.command("reports:build").everyWeeks(2)
```


## Composite interval and cron


<a id="task-every"></a>

### `every()`

```text
every(weeks: int=0, days: int=0, hours: int=0, minutes: int=0, seconds: int=0) -> bool
```

Combines weeks, days, hours, minutes, and seconds into one interval. All values must be nonnegative integers with at least one greater than zero; this does not create five separate schedules.


```python
schedule.command("reports:build").every(days=1, hours=2, minutes=30)
```


<a id="task-cron"></a>

### `cron()`

```text
cron(year: str | None=None, month: str | None=None, day: str | None=None, week: str | None=None, day_of_week: str | None=None, hour: str | None=None, minute: str | None=None, second: str | None=None) -> bool
```

Cron calendar expressed as separate fields. At least one must differ from `None`; each field must be valid for the cron calendar. It does not accept a complete cron expression as its first argument: that argument is `year`. See the fields below.


```python
schedule.command("reports:build").cron(day_of_week="mon-fri", hour="9", minute="0", second="0")
```


## Cron fields and validation

`cron()` parameters accept strings or `None`: `year`, `month` (`1..12` or abbreviations), `day` (`1..31`), `week` (ISO week), `day_of_week` (`0..6`, Monday first, or `mon..sun`), `hour` (`0..23`), `minute`, and `second` (`0..59`). Trigger expressions include `"*"`, `"*/5"`, `"9-17"`, and `"mon,wed,fri"`; supplied fields must all match. This is neither a five-column crontab signature nor an Orionis `from_crontab` API.

Specify relevant hour, minute, and second fields explicitly. Omitted fields follow cron calendar rules: fields below the last supplied field can take their minimum values. For example, `cron(hour="9")` uses minute and second zero; for every minute within that hour use `cron(hour="9", minute="*", second="0")`.

### Calendar expressions

| Field | Trigger values |
|---|---|
| `year` | `1970..9999`. |
| `month` | `1..12` or `jan..dec`. |
| `day` | `1..31`, `last`, or a weekday position such as `2nd mon`. |
| `week` | ISO week `1..53`. |
| `day_of_week` | `0..6`, Monday through Sunday, or `mon..sun`. |
| `hour` | `0..23`. |
| `minute`, `second` | `0..59`. |

Each following snippet is another alternative inside `tasks()`. These expressions configure Orionis’s cron calendar:

```python
# Fixed value: the 15th of each month at 09:00.
schedule.command("reports:build").cron(day="15", hour="9", minute="0")
```

```python
# List: Monday, Wednesday, and Friday at 09:00.
schedule.command("reports:build").cron(day_of_week="mon,wed,fri", hour="9")
```

```python
# Range: hourly from 09:00 through 17:00 on weekdays.
schedule.command("reports:build").cron(day_of_week="mon-fri", hour="9-17")
```

```python
# Step from the field minimum: every ten minutes, at second zero.
schedule.command("reports:build").cron(minute="*/10", second="0")
```

```python
# Range step: 09:00, 11:00, 13:00, 15:00, and 17:00.
schedule.command("reports:build").cron(hour="9-17/2", minute="0")
```

```python
# Step from a value to the field maximum: minutes 5, 20, 35, and 50.
schedule.command("reports:build").cron(minute="5/15", second="0")
```

```python
# Named month range: first day of January through March.
schedule.command("reports:build").cron(month="jan-mar", day="1", hour="9")
```

```python
# Last day of every month, whether it has 28, 29, 30, or 31 days.
schedule.command("reports:build").cron(day="last", hour="18")
```

```python
# Second Monday of each month.
schedule.command("reports:build").cron(day="2nd mon", hour="9")
```

```python
# Last Friday of each month.
schedule.command("reports:build").cron(day="last fri", hour="18")
```

Allowed weekday positions in `day` are `1st`, `2nd`, `3rd`, `4th`, `5th`, and `last`, followed by a weekday name. Nonexistent dates are not replaced with another date: a day-31 calendar does not run in February. Combining `day` and `day_of_week` requires **both conditions**, unlike OR behavior in some system crontabs.

Positive intervals reject zero and negative values. Time and date selectors validate ranges; invalid cron expressions and steps can also raise `ValueError` from the trigger. An elapsed interval such as `everyMinutes(90)` need not be a valid minute-field step for `everyMinutesAt(90, 0)`.

Dates use the application timezone and must name existing calendar dates. Civil calendars and elapsed intervals can behave differently around timezone or daylight-saving changes; choose a trigger that matches the business requirement.

### Bounds and jitter

Call `startDate()` and `endDate()` before selecting a frequency: the trigger captures those bounds at construction and does not rebuild automatically after a metadata change. `randomDelay()` can update an existing trigger's `jitter` attribute, but does not rerun the frequency selector's validation. Set options before selecting a frequency for validated behavior.

`onceAt()` and `everySeconds()` reject previously configured positive jitter. `everyMinuteAt()` and `everyMinutesAt()` do not pass jitter when constructing their trigger. Other interval and cron constructors receive configured task jitter. The global `jitter` default does not change the trigger, as explained in [configuration](/en/console/scheduler-configuration#actual-jitter-behavior).

<a id="task-entity-data"></a>

## Task entity

`orionis.console.entities.Task` is a keyword-only dataclass, distinct from the `orionis.console.fluent.Task` builder. It is returned by `entity()` and contains:

| Field | Type and initial value |
|---|---|
| `signature` | Required `str`. Command and job identity. |
| `args` | `list[str] \| None`, new `[]`. Reactor tokens. |
| `kwargs` | `dict \| None`, new `{}`. Metadata; the executor does not pass it to the command. |
| `purpose` | `str \| None = None`. Label. |
| `random_delay` | `int \| None = None`. Informational or task-specific jitter. |
| `start_date`, `end_date` | `datetime \| None = None`. Date bounds. |
| `trigger` | Cron, one-date, or interval calendar object; initially `None`. Calculates upcoming run times. |
| `details` | `str \| None = None`. Selector-generated description. |
| `max_instances` | `int \| None = 1`. Per-signature concurrency. |
| `misfire_grace_time` | `int \| None = None`. Lateness tolerance. |
| `coalesce` | `bool \| None = True`. Overdue-run grouping. |
| `listeners` | New `[]`. The public annotation is `list[Callable[..., None]]`; the builder actually stores `(TaskEvent, callback)` pairs consumed by `Schedule.boot()`. |

These are defaults for a **directly constructed entity**. Builder results can instead use `entity()` defaults or configuration defaults supplied by `Schedule`. `entity()` is not a deep copy: argument and listener lists remain shared with the builder. Finish configuring tasks before starting the scheduler.
