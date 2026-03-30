---
title: Task Scheduler
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Task Scheduler

### Overview

Orionis Framework provides a built-in task scheduling system that allows you to run console commands automatically on a defined schedule. This component is especially useful for automating recurring processes such as cache clearing, report generation, data synchronization, or any operation that needs to run periodically without manual intervention.

The task scheduler is inspired by patterns from well-established and battle-tested industry frameworks, combining the best of these solutions with an intuitive and flexible API. It offers advanced capabilities such as:

- **Flexible schedule configuration**: from simple executions to complex CRON-based rules.
- **Concurrency management**: precise control over simultaneous task instances.
- **Event and listener system**: react to changes in task state.
- **Lifecycle management**: pause, resume, and control the executor.
- **Failure recovery**: tolerance for missed executions and automatic adjustments.

### Initial Setup

To start using the task scheduler, navigate to the `app\console\scheduler.py` file in your project's standard structure. In this file you will find the `Scheduler` class that extends `BaseScheduler`. This class is the central point where all scheduled tasks for your application are defined.

The `Scheduler` class contains a `tasks` method whose signature includes the parameter `schedule: ISchedule`. This parameter is a contract imported from `orionis.console.contracts.schedule` that exposes fundamental methods for configuring schedules such as `daily()`, `weekly()`, `cron()`, `every()`, and many other specialized ones.

### First Example: Defining Scheduled Tasks

```python
from orionis.console.base.scheduler import BaseScheduler
from orionis.console.contracts.schedule import ISchedule
from orionis.console.entities.scheduler_event import SchedulerEvent
from app.console.listeners.inspire_task_listener import InspireTaskListener

class Scheduler(BaseScheduler):

    def tasks(self, schedule: ISchedule) -> None:

        # Register a test command that runs every ten seconds
        schedule.command("app:test", ["--name=Raul"])\
            .purpose("Routing test command")\
            .maxInstances(1)\
            .everyTenSeconds()

        # Register the inspire command that runs every fifteen seconds with a listener
        schedule.command("app:inspire")\
            .purpose("Inspire test command")\
            .maxInstances(1)\
            .registerListener(InspireTaskListener())\
            .everySeconds(15)
```

In the example above, two scheduled tasks are defined:

1. **First task**: Executes the `app:test` command every ten seconds, passing the argument `--name=Raul`. This task is limited to a single concurrent instance via `maxInstances(1)`.

2. **Second task**: Executes the `app:inspire` command every fifteen seconds with a registered listener. The listener is a fully initialized instance of `InspireTaskListener`, not the class itself.

**Important note**: The `registerListener()` parameter must receive a fully initialized and ready-to-use listener instance, not the listener class.

The Orionis Framework task scheduler is highly configurable and versatile, allowing you to manage complex scenarios such as concurrent executions, error handling, custom notifications, and much more. This versatility makes it a robust and powerful tool for automating critical processes within your application.

## General Control Configuration Methods

The following methods allow you to control general aspects of a task's execution and lifecycle:

- **`purpose(text)`**: Sets a readable and meaningful description for the task. This description is useful for documentation, monitoring, and debugging purposes.
- **`startDate(year, month, day, hour=0, minute=0, second=0)`**: Defines the date and time from which the task can begin executing. All scheduled executions before this date will be ignored.
- **`endDate(year, month, day, hour=0, minute=0, second=0)`**: Specifies the deadline date and time for task execution. After this date, the task will not execute under any circumstances.
- **`maxInstances(int)`**: Defines the maximum number of concurrent instances allowed for this task. Prevents concurrency issues by limiting simultaneous executors (recommended value: 1 for critical tasks).
- **`misfireGraceTime(seconds)`**: Sets the tolerance period in seconds for recovering from missed executions. If the scheduler was unavailable at the scheduled time and resumes within this period, the task will execute automatically.
- **`coalesce(coalesce=True)`**: Controls behavior when there are multiple pending executions:
  - `True`: Consolidates all pending executions into a single execution.
  - `False`: Attempts to execute all pending executions individually.
- **`randomDelay(max_seconds=10)`**: Adds a random delay (between 0 and the specified value, maximum 120 seconds) before executing the task. Useful for avoiding load spikes when multiple tasks run simultaneously.

**General Control Configuration Example:**

```python
schedule.command("app:cleanup")\
    .purpose("Clean up temporary system files")\
    .startDate(2026, 1, 1, 0, 0, 0)\
    .endDate(2026, 12, 31, 23, 59, 59)\
    .maxInstances(1)\
    .misfireGraceTime(120)\
    .coalesce(True)\
    .daily()
```

In this example, you can see how multiple methods are chained together to achieve a complete and expressive configuration.

## Task Events and Listeners System

**General Concept**

The events and listeners system provides a robust mechanism for reacting to changes in the state of scheduled tasks. Through listeners, you can implement custom logic that executes at specific moments in a task's lifecycle.

**Registering Listeners**

To register a complete listener for a task, use the method:

- **`registerListener(listener)`**: Registers a fully initialized `BaseTaskListener` instance. The framework automatically maps all listener methods (such as `onTaskExecuted`, `onTaskError`, etc.) to the corresponding task events.

### Listener Structure

A listener is a class that extends `BaseTaskListener` and implements methods to react to specific events in the task lifecycle. Below is an example of the complete structure of a listener:

```python
from orionis.console.base.listener import BaseTaskListener
from orionis.console.entities.task_event import TaskEvent

class MyTaskListener(BaseTaskListener):

    async def onTaskAdded(self, event: TaskEvent) -> None:
        """Invoked when the task is added to the scheduler."""
        pass

    async def onTaskRemoved(self, event: TaskEvent) -> None:
        """Invoked when the task is removed from the scheduler."""
        pass

    async def onTaskExecuted(self, event: TaskEvent) -> None:
        """Invoked each time the task executes successfully."""
        pass

    async def onTaskError(self, event: TaskEvent) -> None:
        """Invoked when an error occurs during task execution."""
        pass

    async def onTaskMissed(self, event: TaskEvent) -> None:
        """Invoked when the task fails to execute at the scheduled time."""
        pass

    async def onTaskSubmitted(self, event: TaskEvent) -> None:
        """Invoked each time the task is submitted for execution."""
        pass

    async def onTaskMaxInstances(self, event: TaskEvent) -> None:
        """Invoked when the task attempts to execute but the concurrent instance limit has been reached."""
        pass
```

### Available Events

Each event is triggered at a specific moment in the task lifecycle:

| <span style="white-space: nowrap;">Event</span> | Trigger Moment | Description |
|---|---|---|
| <span style="white-space: nowrap;"><code>onTaskAdded</code></span> | When the task is added to the scheduler | Useful for initializing resources associated with the task. |
| <span style="white-space: nowrap;"><code>onTaskRemoved</code></span> | When the task is removed from the scheduler | Ideal for cleaning up resources and performing shutdown actions. |
| <span style="white-space: nowrap;"><code>onTaskExecuted</code></span> | On each successful execution | Perfect for logging, updating metrics, or sending notifications. |
| <span style="white-space: nowrap;"><code>onTaskError</code></span> | When an error occurs | Allows implementing recovery logic, automatic retries, or alerts. |
| <span style="white-space: nowrap;"><code>onTaskMissed</code></span> | When the scheduled execution fails | Triggered if the server was down during the scheduled execution. |
| <span style="white-space: nowrap;"><code>onTaskSubmitted</code></span> | Before each execution | Allows validating preconditions or preparing state. |
| <span style="white-space: nowrap;"><code>onTaskMaxInstances</code></span> | When the concurrent limit is reached | Useful for alerts or logging overload situations. |

### Practical Listener Example

```python
from orionis.console.base.listener import BaseTaskListener
from orionis.console.entities.task_event import TaskEvent
from orionis.services.log.contracts.log_service import ILogger

class ReportTaskListener(BaseTaskListener):

    # Inject the logger through the constructor
    def __int__(self, logger: ILogger) -> None:
        self.logger = logger

    # Implement the method for when the task executes successfully
    async def onTaskExecuted(self, event: TaskEvent) -> None:
        self.logger.info(f"Report generated successfully: {event.signature}")

    # Implement the method for when an error occurs during task execution
    async def onTaskError(self, event: TaskEvent) -> None:
        self.logger.error(f"Error generating report: {event.signature} - {event.exception}")

```

## Task Scheduling

### One-Time Execution

To execute a task once at a specific date and time, use the following method:

- **`onceAt(year, month, day, hour=0, minute=0, second=0)`**: Schedules the task to execute once and only once at the specified date and time. This is especially useful for one-off tasks or migrations.

**One-Time Execution Example:**

```python
# Execute the closing of operations on April 1st, 2026 at 22:00
schedule.command("app:close-window").onceAt(2026, 4, 1, 22, 0, 0)

# Another task that executes only once
schedule.command("app:migration").purpose("Initial data migration").onceAt(2026, 6, 15, 3, 0, 0)
```

**Important note**: The `onceAt()` method is not compatible with `randomDelay()`. If you need to execute a task once, do not attempt to apply random delays.

### Scheduling by Second Intervals

The following methods allow you to schedule tasks at second-based intervals:

- **`everySeconds(seconds)`**: Executes the task every N seconds.
- **Predefined shortcuts:**
    - Every 5 seconds: `everyFiveSeconds()`
    - Every 10 seconds: `everyTenSeconds()`
    - Every 15 seconds: `everyFifteenSeconds()`
    - Every 20 seconds: `everyTwentySeconds()`
    - Every 25 seconds: `everyTwentyFiveSeconds()`
    - Every 30 seconds: `everyThirtySeconds()`
    - Every 35 seconds: `everyThirtyFiveSeconds()`
    - Every 40 seconds: `everyFortySeconds()`
    - Every 45 seconds: `everyFortyFiveSeconds()`
    - Every 50 seconds: `everyFiftySeconds()`
    - Every 55 seconds: `everyFiftyFiveSeconds()`

**Second-Based Scheduling Example:**

```python
# Monitor that checks status every 30 seconds
schedule.command("app:heartbeat").purpose("Status monitoring").everySeconds(30)

# Quick tasks every 5 seconds using shortcut
schedule.command("app:quick-sync").everyFiveSeconds()

# Critical task every 15 seconds
schedule.command("app:critical-check").everyFifteenSeconds()
```

### Scheduling by Minute Intervals

The following methods allow you to schedule tasks at minute-based intervals:

- **`everyMinutes(minutes)`**: Executes the task every N minutes.
- **`everyMinuteAt(seconds)`**: Executes the task every minute at a specific second.
- **`everyMinutesAt(minutes, seconds)`**: Executes the task every N minutes, starting at a specific second.
- **Available shortcuts:**
  - Every 5 minutes: `everyFiveMinutes()` / `everyFiveMinutesAt(seconds)`
  - Every 10 minutes: `everyTenMinutes()` / `everyTenMinutesAt(seconds)`
  - Every 15 minutes: `everyFifteenMinutes()` / `everyFifteenMinutesAt(seconds)`
  - Every 20 minutes: `everyTwentyMinutes()` / `everyTwentyMinutesAt(seconds)`
  - Every 25 minutes: `everyTwentyFiveMinutes()` / `everyTwentyFiveMinutesAt(seconds)`
  - Every 30 minutes: `everyThirtyMinutes()` / `everyThirtyMinutesAt(seconds)`
  - Every 35 minutes: `everyThirtyFiveMinutes()` / `everyThirtyFiveMinutesAt(seconds)`
  - Every 40 minutes: `everyFortyMinutes()` / `everyFortyMinutesAt(seconds)`
  - Every 45 minutes: `everyFortyFiveMinutes()` / `everyFortyFiveMinutesAt(seconds)`
  - Every 50 minutes: `everyFiftyMinutes()` / `everyFiftyMinutesAt(seconds)`
  - Every 55 minutes: `everyFiftyFiveMinutes()` / `everyFiftyFiveMinutesAt(seconds)`

**Minute-Based Scheduling Example:**

```python
# Synchronization every 10 minutes at the 10th second
schedule.command("app:sync")\
    .purpose("Synchronize data with external server")\
    .everyTenMinutesAt(10)

# Session cleanup every 30 minutes
schedule.command("app:clean-sessions")\
    .everyThirtyMinutes()

# Cache update every 5 minutes exactly at second 0
schedule.command("app:update-cache")\
    .purpose("Update application cache")\
    .everyFiveMinutesAt(0)
```

### Scheduling by Hour Intervals

The following methods allow you to schedule tasks at hour-based intervals:

- **`hourly()`**: Executes the task every hour exactly.
- **`hourlyAt(minute, second=0)`**: Executes the task every hour at a specific minute and second.
- **`everyOddHours()`**: Executes the task on odd hours (1, 3, 5, ..., 23).
- **`everyEvenHours()`**: Executes the task on even hours (0, 2, 4, ..., 22).
- **`everyHours(hours)`**: Executes the task every N hours.
- **`everyHoursAt(hours, minute, second=0)`**: Executes the task every N hours at a specific minute and second.
- **Interval shortcuts:**
    - Every 2 hours: `everyTwoHours()`
    - Every 3 hours: `everyThreeHours()`
    - Every 4 hours: `everyFourHours()`
    - Every 5 hours: `everyFiveHours()`
    - Every 6 hours: `everySixHours()`
    - Every 7 hours: `everySevenHours()`
    - Every 8 hours: `everyEightHours()`
    - Every 9 hours: `everyNineHours()`
    - Every 10 hours: `everyTenHours()`
    - Every 11 hours: `everyElevenHours()`
    - Every 12 hours: `everyTwelveHours()`
- **Shortcuts with fixed time:**
    - Every 2 hours at fixed minute/second: `everyTwoHoursAt(minute, second=0)`
    - Every 3 hours at fixed minute/second: `everyThreeHoursAt(minute, second=0)`
    - Every 4 hours at fixed minute/second: `everyFourHoursAt(minute, second=0)`
    - Every 5 hours at fixed minute/second: `everyFiveHoursAt(minute, second=0)`
    - Every 6 hours at fixed minute/second: `everySixHoursAt(minute, second=0)`
    - Every 7 hours at fixed minute/second: `everySevenHoursAt(minute, second=0)`
    - Every 8 hours at fixed minute/second: `everyEightHoursAt(minute, second=0)`
    - Every 9 hours at fixed minute/second: `everyNineHoursAt(minute, second=0)`
    - Every 10 hours at fixed minute/second: `everyTenHoursAt(minute, second=0)`
    - Every 11 hours at fixed minute/second: `everyElevenHoursAt(minute, second=0)`
    - Every 12 hours at fixed minute/second: `everyTwelveHoursAt(minute, second=0)`

**Hour-Based Scheduling Example:**

```python
# Indexing every 4 hours at minute 15
schedule.command("app:index")\
    .purpose("Search indexing")\
    .everyFourHoursAt(15, 0)

# Exact hourly synchronization
schedule.command("app:hourly-sync").hourly()

# Report every 6 hours at minute 30
schedule.command("app:report")\
    .purpose("Generate hourly report")\
    .everySixHoursAt(30, 0)

# Task on even hours (0, 2, 4, ...)
schedule.command("app:even-hours-task").everyEvenHours()
```

### Daily Scheduling

The following methods allow you to schedule tasks to run daily or at day-based intervals:

- **`daily()`**: Executes the task every day at 00:00:00 (midnight).
- **`dailyAt(hour, minute=0, second=0)`**: Executes the task every day at the specified hour, minute, and second.
- **`everyDays(days)`**: Executes the task every N days at 00:00:00.
- **`everyDaysAt(days, hour, minute=0, second=0)`**: Executes the task every N days at the specified time.
- **Interval shortcuts:**
    - Every 2 days: `everyTwoDays()`
    - Every 3 days: `everyThreeDays()`
    - Every 4 days: `everyFourDays()`
    - Every 5 days: `everyFiveDays()`
    - Every 6 days: `everySixDays()`
    - Every 7 days: `everySevenDays()`
- **Shortcuts with fixed time:**
    - Every 2 days at fixed time: `everyTwoDaysAt(hour, minute=0, second=0)`
    - Every 3 days at fixed time: `everyThreeDaysAt(hour, minute=0, second=0)`
    - Every 4 days at fixed time: `everyFourDaysAt(hour, minute=0, second=0)`
    - Every 5 days at fixed time: `everyFiveDaysAt(hour, minute=0, second=0)`
    - Every 6 days at fixed time: `everySixDaysAt(hour, minute=0, second=0)`
    - Every 7 days at fixed time: `everySevenDaysAt(hour, minute=0, second=0)`

**Daily Scheduling Example:**

```python
# Daily backup at 02:00 AM
schedule.command("app:backup")\
    .purpose("Daily backup")\
    .dailyAt(2, 0, 0)

# Old log cleanup every day at 03:00 AM
schedule.command("app:cleanup-old-logs")\
    .purpose("Delete old log records")\
    .dailyAt(3, 0, 0)

# Task every 3 days at 10:30 AM
schedule.command("app:maintenance")\
    .purpose("Periodic maintenance")\
    .everyThreeDaysAt(10, 30, 0)

# Daily execution at midnight
schedule.command("app:daily-report").daily()
```

### Weekly Scheduling

The following methods allow you to schedule tasks to run weekly or on specific days of the week:

- **`weekly()`**: Executes the task every Sunday at 00:00:00.
- **`everyWeeks(weeks)`**: Executes the task every N weeks at 00:00:00 on Sunday.
- **Specific days of the week:**
  - Monday: `everyMondayAt(hour, minute=0, second=0)`
  - Tuesday: `everyTuesdayAt(hour, minute=0, second=0)`
  - Wednesday: `everyWednesdayAt(hour, minute=0, second=0)`
  - Thursday: `everyThursdayAt(hour, minute=0, second=0)`
  - Friday: `everyFridayAt(hour, minute=0, second=0)`
  - Saturday: `everySaturdayAt(hour, minute=0, second=0)`
  - Sunday: `everySundayAt(hour, minute=0, second=0)`

**Weekly Scheduling Example:**

```python
# Weekly report every Monday at 08:30 AM
schedule.command("app:weekly-report")\
    .purpose("Weekly operations report")\
    .everyMondayAt(8, 30)

# Maintenance every Friday at 22:00 (10 PM)
schedule.command("app:maintenance-window")\
    .purpose("Weekly maintenance window")\
    .everyFridayAt(22, 0)

# Synchronization task every Tuesday and Thursday at 09:00 AM
schedule.command("app:sync-tuesday").everyTuesdayAt(9, 0)
schedule.command("app:sync-thursday").everyThursdayAt(9, 0)

# Weekly execution on Sunday at midnight
schedule.command("app:weekly-cleanup").weekly()
```

### Custom Interval Scheduling

The `every()` method allows you to combine multiple time units into a single rule, providing flexibility for specific cases:

- **`every(weeks=0, days=0, hours=0, minutes=0, seconds=0)`**: Executes the task each time all combined intervals are met.

**Custom Interval Example:**

```python
# Execute every 1 hour and 30 minutes
schedule.command("app:poll")\
    .purpose("Data polling")\
    .every(hours=1, minutes=30)

# Execute every 2 days, 3 hours, and 15 minutes
schedule.command("app:complex-task")\
    .every(days=2, hours=3, minutes=15)

# Execute every 1 week and 2 days
schedule.command("app:weekly-extended")\
    .every(weeks=1, days=2)

# Execute every 45 seconds
schedule.command("app:quick-check").every(seconds=45)
```

### CRON Expression Scheduling

For more advanced and complex cases, the `cron()` method provides full compatibility with standard CRON expressions:

- **`cron(year, month, day, week, day_of_week, hour, minute, second)`**: Allows defining custom CRON rules for granular schedule control.

This is the most flexible and powerful option for advanced expressions, suitable for complex execution patterns.

**CRON Parameters**

| Parameter | Values | Description |
|-----------|--------|-------------|
| `year` | 1970-3000 | Specific year or range |
| `month` | 1-12 | Specific month, range, or asterisk (*) |
| `day` | 1-31 | Specific day of the month, range, or asterisk (*) |
| `week` | 0-53 | Specific week of the year |
| `day_of_week` | mon-sun, 0-6 | Day of the week (mon, tue, wed, thu, fri, sat, sun) |
| `hour` | 0-23 | Specific hour, range, or asterisk (*) |
| `minute` | 0-59 | Specific minute, range, or asterisk (*) |
| `second` | 0-59 | Specific second, range, or asterisk (*) |

**CRON Expression Examples**

```python
# Monday through Friday at 09:15:00 (business hours)
schedule.command("app:open-market")\
    .purpose("Market opening")\
    .cron(day_of_week="mon-fri", hour="9", minute="15", second="0")

# Every 15 minutes
schedule.command("app:frequent-task")\
    .cron(minute="*/15")

# First day of every month at 00:00
schedule.command("app:monthly-report")\
    .purpose("Monthly report")\
    .cron(day="1", hour="0", minute="0", second="0")

# Every quarter (January 1st, April, July, October)
schedule.command("app:quarterly-task")\
    .cron(month="1,4,7,10", day="1", hour="0", minute="0")

# Monday, Wednesday, and Friday at 18:00
schedule.command("app:three-days-task")\
    .cron(day_of_week="mon,wed,fri", hour="18", minute="0")

# Last day of the month at 23:59
schedule.command("app:end-of-month")\
    .cron(day="L", hour="23", minute="59")
```

## Important Validations and Restrictions

The framework applies automatic validations to task configurations to prevent unexpected behavior. It is important to be aware of these restrictions:

**Value Restrictions**

- **Time intervals**: All intervals (`seconds`, `minutes`, `hours`, `days`, `weeks`) must be positive integers greater than zero.
- **Hours**: The `hour` value must be in the range `0` to `23` (24-hour format).
- **Minutes and seconds**: The `minute` and `second` values must be in the range `0` to `59`.

**Combination Restrictions**

- **`onceAt()` + `randomDelay()`**: It is not possible to combine one-time execution (`onceAt()`) with random delay (`randomDelay()`). The framework will throw an exception if attempted.
- **CRON validation**: If you use `cron()`, at least one field/parameter other than `None` must be specified.

**Validation Examples:**

```python
# ❌ INCORRECT: hour out of range
schedule.command("app:invalid").dailyAt(25, 0, 0)  # Will throw an exception

# ✅ CORRECT: valid hour
schedule.command("app:valid").dailyAt(23, 59, 59)

# ❌ INCORRECT: disallowed combination
schedule.command("app:error").randomDelay(10).onceAt(2026, 6, 15, 10, 0, 0)

# ✅ CORRECT: compatible methods
schedule.command("app:ok").purpose("One-time task").onceAt(2026, 6, 15, 10, 0, 0)
```

## Timezone Considerations

**Default Timezone Configuration**

The scheduler uses the application's default timezone, obtained from the `config\app.py` configuration file in the `timezone` property. All dates, times, and comparisons are performed using this timezone.

**Importance of Configuration**

It is essential to correctly configure your application's timezone to ensure that:

- Tasks execute at the desired time.
- Logs and event records reflect the correct time.
- There is no confusion in interpreting schedules specified in local times.

## Global Scheduler Listeners

In addition to individual task listeners, the scheduler provides global events that are triggered when the state of the entire executor changes. These are defined within the `Scheduler` class in the `app\console\scheduler.py` file:

**Available Global Events**

```python
class Scheduler(BaseScheduler):

    async def onStarted(self, event: SchedulerEvent) -> None:
        """Invoked when the scheduler starts its execution cycle."""
        pass

    async def onPaused(self, event: SchedulerEvent) -> None:
        """Invoked when the scheduler is paused."""
        pass

    async def onResumed(self, event: SchedulerEvent) -> None:
        """Invoked when the scheduler resumes after a pause."""
        pass

    async def onShutdown(self, event: SchedulerEvent) -> None:
        """
        Invoked when the scheduler shuts down gracefully.
        (Not triggered in cases of forced shutdown or crash)
        """
        pass

```

**Detailed Description of Global Events**

| <span style="white-space: nowrap;">Event</span> | Trigger Moment | Use Case |
|---|---|---|
| <span style="white-space: nowrap;"><code>onStarted</code></span> | When the scheduler starts its cycle | Initialize connections, configure global resources, log that the scheduler is active. |
| <span style="white-space: nowrap;"><code>onPaused</code></span> | When the scheduler is manually paused | Notify administrators, update database state, pause associated operations. |
| <span style="white-space: nowrap;"><code>onResumed</code></span> | When the scheduler resumes from pause | Resume paused operations, update state, synchronize pending tasks. |
| <span style="white-space: nowrap;"><code>onShutdown</code></span> | When the scheduler shuts down | Clean up resources, close connections, finalize in-progress operations, save state. |

**Global Listener Implementation Example:**

```python
from orionis.console.base.scheduler import BaseScheduler
from orionis.console.contracts.schedule import ISchedule
from orionis.console.entities.scheduler_event import SchedulerEvent
from orionis.support.facades.logger import Log

class Scheduler(BaseScheduler):

    async def onStarted(self, event: SchedulerEvent) -> None:
        Log.info("📅 Scheduler started successfully")

    async def onPaused(self, event: SchedulerEvent) -> None:
        Log.warning("⏸️  Scheduler paused by administrator")

    async def onResumed(self, event: SchedulerEvent) -> None:
        Log.info("▶️  Scheduler resumed")

    async def onShutdown(self, event: SchedulerEvent) -> None:
        Log.info("🛑 Scheduler shut down")
```

## Scheduler Actions from Commands

**General Concept**

It is possible to create console commands that perform actions on the scheduler itself. This allows you to control the task executor's behavior programmatically from the command line or from internal application operations.

**Common Use Cases**

- **Pause the scheduler**: Temporarily stop task execution during maintenance.
- **Resume the scheduler**: Reactivate execution after a pause.
- **Remove specific tasks**: Deactivate a task without stopping the entire scheduler.
- **Query information**: Obtain task status and execution details.

**Example Command to Pause the Scheduler:**

```python
from orionis.console.base.command import Command
from orionis.console.contracts.schedule import ISchedule

class PauseSchedulerCommand(Command):
    """Command to pause the scheduler"""

    signature = "scheduler:pause"
    description = "Temporarily pauses the scheduler"

    # Inject the scheduler directly into the handle method
    async def handle(self, scheduler: ISchedule) -> int:
        try:
            scheduler.pause()
            self.exitSuccess("✅ Scheduler paused successfully")
        except RuntimeError as e:
            self.exitError(f"❌ Error pausing: {e}")
```

**Example Command to Resume the Scheduler:**

```python
from orionis.console.base.command import Command
from orionis.console.contracts.schedule import ISchedule

class ResumeSchedulerCommand(Command):
    """Command to resume the scheduler"""

    signature = "scheduler:resume"
    description = "Resumes the scheduler after a pause"

    # Inject the scheduler directly into the handle method
    async def handle(self, scheduler: ISchedule) -> int:
        try:
            scheduler.resume()
            self.exitSuccess("✅ Scheduler resumed successfully")
        except RuntimeError as e:
            self.exitError(f"❌ Error resuming: {e}")
```

## Scheduler Class Methods

The following methods are available on the `Scheduler` class for querying and controlling the state and behavior of the scheduled task executor.
They can be used both from custom commands and from any part of the application that has access to a scheduler instance.

### State Query Methods

#### `state() -> str`

Returns the current state of the scheduler as a string.

```python
status = scheduler.state()
# Returned value: "RUNNING", "PAUSED", or "STOPPED"
```

#### `isRunning() -> bool`

Determines whether the scheduler is currently running.

```python
if scheduler.isRunning():
    self.info("The scheduler is executing tasks")
```

#### `isPaused() -> bool`

Determines whether the scheduler is currently paused.

```python
if scheduler.isPaused():
    self.info("The scheduler is temporarily paused")
```

#### `isStopped() -> bool`

Determines whether the scheduler has been stopped.

```python
if scheduler.isStopped():
    self.info("The scheduler is completely stopped")
```

#### `info() -> list[dict]` (Asynchronous)

Retrieves detailed information about all tasks loaded in the scheduler.

```python
tasks = await scheduler.info()

# Returns a list of dictionaries with details for each task
for task in tasks:
    self.info(task["signature"])
    self.info(task["args"])
    self.info(task["purpose"])
    self.info(task["random_delay"])
    self.info(task["coalesce"])
    self.info(task["max_instances"])
    self.info(task["misfire_grace_time"])
    self.info(task["start_date"])
    self.info(task["end_date"])
    self.info(task["details"])
```

### Individual Task Control Methods

#### `pauseTask(signature: str) -> bool`

Pauses the execution of a specific task without affecting other tasks.

```python
try:
    scheduler.pauseTask("app:sync")
    self.info("Task paused successfully")
except ValueError:
    self.info("The task does not exist")
except RuntimeError:
    self.info("The scheduler has not been started")
```

**Parameters:**
- `signature` (str): Unique identifier of the task to pause.

**Exceptions:**
- `RuntimeError`: If the scheduler has not been started.
- `ValueError`: If the specified task does not exist.

#### `resumeTask(signature: str) -> bool`

Resumes the execution of a paused task.

```python
try:
    scheduler.resumeTask("app:sync")
    self.info("Task resumed successfully")
except ValueError:
    self.info("The task does not exist")
except RuntimeError:
    self.info("The scheduler is not in a paused state for this task")
```

#### `removeTask(signature: str) -> bool`

Completely removes a task from the scheduler.

```python
try:
    scheduler.removeTask("app:old-task")
    self.info("Task removed from the scheduler")
except ValueError:
    self.info("The task does not exist")
except RuntimeError:
    self.info("The scheduler has not been started")
```

**Note:** This action is permanent for the current scheduler session.

#### `removeAllTasks() -> bool`

Removes all tasks from the scheduler at once.

```python
try:
    scheduler.removeAllTasks()
    self.info("All tasks have been removed")
except RuntimeError:
    self.info("Error removing tasks")
```

### Full Scheduler Control Methods

#### `pause() -> bool`

Pauses the scheduler completely, stopping the execution of new tasks without terminating those already in progress.

```python
try:
    scheduler.pause()
    self.info("Scheduler paused")
except RuntimeError:
    self.info("The scheduler is not in a running state")
```

**Behavior:**
- Tasks will not execute at the scheduled time.
- Tasks already in progress will continue until completion.
- The scheduler remains loaded in memory.

#### `resume() -> bool`

Resumes the scheduler's execution after a pause.

```python
try:
    scheduler.resume()
    self.info("Scheduler resumed")
except RuntimeError:
    self.info("The scheduler is not paused")
```

#### `shutdown(wait: int | None = None) -> None`

Shuts down the scheduler safely and cleanly.

```python
# Shut down without waiting
scheduler.shutdown()

# Shut down with wait time
# Wait a maximum of 30 seconds for in-progress tasks
# to finish before forcing shutdown
scheduler.shutdown(wait=30)
```

**Parameters:**
- `wait` (int | None, optional): Time in seconds to wait for completion. If `None`, does not wait.

**Behavior:**
- Stops accepting new tasks.
- Allows in-progress tasks to continue (without waiting for completion if `wait` is None).
- Releases scheduler resources.
- Cleans up connections and internal state.

**Note:** Ideal for console environments where the process terminates immediately afterward.

### Method Summary by Category

| Category | Method | Type | Description |
|----------|--------|------|-------------|
| **Query** | `state()` | Synchronous | Gets current state |
| **Query** | `isRunning()` | Synchronous | Checks if running |
| **Query** | `isPaused()` | Synchronous | Checks if paused |
| **Query** | `isStopped()` | Synchronous | Checks if stopped |
| **Query** | `info()` | Asynchronous | Gets task info |
| **Individual Control** | `pauseTask()` | Synchronous | Pauses a task |
| **Individual Control** | `resumeTask()` | Synchronous | Resumes a task |
| **Individual Control** | `removeTask()` | Synchronous | Removes a task |
| **Individual Control** | `removeAllTasks()` | Synchronous | Removes all tasks |
| **Global Control** | `pause()` | Synchronous | Pauses the scheduler |
| **Global Control** | `resume()` | Synchronous | Resumes the scheduler |
| **Global Control** | `shutdown()` | Synchronous | Shuts down the scheduler |

## Best Practices and Recommended Patterns

### 1. Limit Concurrent Instances

Always use `maxInstances(1)` for tasks that access shared resources or databases, avoiding race conditions:

```python
schedule.command("app:backup")\
    .purpose("Database backup")\
    .maxInstances(1)\ # Critical to avoid deadlocks
    .dailyAt(2, 0, 0)
```

### 2. Implement Listeners for Monitoring

Register listeners for critical tasks and monitor their execution:

```python
from app.console.listeners.critical_task_listener import CriticalTaskListener

schedule.command("app:process-payments")\
    .purpose("Process pending payments")\
    .registerListener(CriticalTaskListener())\
    .maxInstances(1)\
    .everyTenMinutes()
```

### 3. Use Descriptive Purposes

Always provide a clear description of the task's purpose:

```python
schedule.command("app:clean-db")\
    .purpose("Clean audit records older than 90 days")\
    .dailyAt(3, 0, 0)
```

### 4. Configure Tolerance for Interruptions

Configure `misfireGraceTime()` to automatically recover from interruptions:

```python
schedule.command("app:sync")\
    .misfireGraceTime(300)\ # 5-minute tolerance
    .coalesce(True)\ # Consolidate pending executions
    .everyTenMinutes()
```

### 5. Use Random Delays to Distribute Load

When multiple servers are running the same scheduler, add variability:

```python
schedule.command("app:health-check")\
    .randomDelay(30)\ # Random delay of 0-30 seconds
    .everyMinutes(5)
```

### 6. Use CRON for Complex Patterns

For complex schedules, prefer CRON over multiple combinations:

```python
# ✅ BETTER: Clear and expressive
schedule.command("app:business-hours").cron(
    day_of_week="mon-fri",
    hour="9-17",
    minute="*/15"
)

# ❌ AVOID: Multiple identical definitions
schedule.command("app:task").everyMondayAt(9, 0)
schedule.command("app:task").everyTuesdayAt(9, 0)
# ... repeat for each day
```

## Notes

The Orionis Framework task scheduler provides a robust, flexible, and easy-to-use system for automating recurring processes within your application. With:

- **Intuitive configuration**: Fluent and expressive API
- **Extreme flexibility**: From simple scheduling to complex CRON rules
- **Advanced monitoring**: Listeners and events for every aspect
- **Precise control**: Methods to pause, resume, and manage tasks
- **Automatic recovery**: Tolerance for failures and interruptions

You have at your disposal a professional tool capable of handling the most demanding task automation requirements. Leverage these capabilities to keep your application running reliably and standing out within the modern frameworks ecosystem.