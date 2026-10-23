---
title: "Scheduler configuration and persistence"
description: "Every config/scheduler.py setting, memory, database and Redis stores, requirements, and restart behavior."
editUrl: true
lastUpdated: false
---

The scheduler maintains task definitions and their next run times. Configure that storage in `config/scheduler.py`. [Queues configuration](/en/queues/configuration) is separate: queue jobs, reservations, and failures are not stored in scheduler stores.

## General configuration

<a id="config-scheduler"></a>

`BootstrapScheduler` extends the `Scheduler` entity exported by `orionis.foundation.config.scheduler`. Its fields are keyword parameters; the entity is immutable and validates values at construction.

| Property | Environment variable | Default and effect |
|---|---|---|
| `store: Drivers \| str` | `TASKS_STORE` | `memory`. Selects `memory`, `database`, or `redis`. Strings are trimmed, compared without case sensitivity, and normalized to lowercase. |
| `stores: Stores \| dict` | — | Configuration for all three stores; dictionaries become `Stores`. The selected store must be configured. |
| `max_instances: int` | `TASKS_MAX_INSTANCES` | `1`. Maximum simultaneous executions of one signature within this scheduler; integer at least one. |
| `coalesce: bool` | `TASKS_COALESCE` | `True`. Collapses multiple pending overdue runs into one. |
| `misfire_grace_time: int \| None` | `TASKS_MISFIRE_GRACE_TIME` | `30`. Allowed lateness in seconds; positive integer or `None` for no lateness limit. |
| `replace_existing: bool` | `TASKS_REPLACE_EXISTING` | `True`. Replaces persisted definitions sharing a signature at startup. |
| `jitter: int` | `TASKS_JITTER` | `0`. Default `random_delay` metadata in the task entity; nonnegative integer. Read the trigger limitation below. |

Python configuration requires actual booleans; general integer settings reject `bool`. Unknown drivers, a selected store set to `None`, a maximum below one, and a nonpositive grace time raise `ValueError`; incompatible types raise `TypeError`.

### Actual jitter behavior

Currently, `Schedule.info()` applies `jitter` to `Task.random_delay` metadata when the task has no override. That global value **is not copied into the trigger already constructed by the task**. Use the task's `.randomDelay(...)` to apply timing dispersion; do not assume that `TASKS_JITTER` alone changes upcoming run times. [The reference](/en/console/scheduler-frequencies#task-randomdelay) explains sampling and supported frequencies.

### Stores and driver enumeration

<a id="config-stores"></a>
<a id="config-drivers"></a>

`Stores` contains `memory: Memory | dict | None`, `redis: Redis | dict | None`, and `database: Database | dict | None`. Each field defaults to a new matching entity; dictionaries are normalized to entities. Set unused stores to `None` as long as the selected store remains configured.

`Drivers` exposes `MEMORY = "memory"`, `REDIS = "redis"`, and `DATABASE = "database"`. Individual entity `driver` fields require their exact name. The service has no custom driver registration mechanism.

```python
from orionis.foundation.config.scheduler import (
    Database,
    Drivers,
    Memory,
    Scheduler,
    Stores,
)

settings = Scheduler(
    store=Drivers.DATABASE,
    stores=Stores(
        memory=Memory(),
        redis=None,
        database=Database(connection="sqlite", table="scheduler_tasks"),
    ),
    max_instances=1,
    coalesce=True,
    misfire_grace_time=60,
    replace_existing=True,
    jitter=0,
)
```

This constructs a complete configuration entity to illustrate its shape. In an application, edit the corresponding fields of `BootstrapScheduler` in `config/scheduler.py`, retaining other settings from that file. Configuration loads from that module; constructing `settings` elsewhere does not automatically replace application configuration. Selecting the store through `.env` does not require replacing the file.

## Memory

<a id="config-memory"></a>

`Memory` has one field: `driver: str = "memory"`. It has no filesystem path or connection settings.

```dotenv
TASKS_STORE=memory
```

Task definitions and next run times live in the process and disappear when it terminates. Starting `schedule:work` again recreates the agenda from `tasks()`. This suits development and agendas that can be rebuilt without recovering their previous timing state.

Startup always adds a store with alias `memory`, even when a persistent store is selected. Orionis task declarations use the alias selected by `store`.

## Database

<a id="config-database"></a>

`Database` configures the scheduler’s SQL task store:

| Field | Variable | Default / validation |
|---|---|---|
| `driver: str` | — | `"database"`; requires that value. |
| `connection: str \| None` | `DB_TASK_CONNECTION` | `None`: Database's default connection. A string selects a named Database connection. |
| `table: str` | `DB_TASK_TABLE` | `"scheduler_tasks"`; lowercase letters and `_` only, pattern `[a-z_]+`. Numbers, dots, and qualified names are rejected. |

```dotenv
TASKS_STORE=database
DB_TASK_CONNECTION=sqlite
DB_TASK_TABLE=scheduler_tasks
TASKS_REPLACE_EXISTING=True
```

The `sqlite` connection must exist in [Database configuration](/en/database/configuration). The store uses its credentials and engine options but creates a **separate synchronous SQL connection engine**. It does not share an async connection or request transaction. With SQLite `:memory:`, that engine has its own in-memory database; it is not durable storage and does not automatically share another connection's data.

On startup, the store creates its table if necessary. Its integrated implementation uses:

| Column | Stored information |
|---|---|
| `id` | Command signature, primary key up to 191 characters. |
| `next_run_time` | Indexed next-run timestamp; `NULL` when paused. |
| `job_state` | Serialized job state: executor reference, trigger, arguments, and policies. |

This is not an execution log or failed-jobs table. The scheduler does not generate an Orionis migration for it. The database user needs initial table-creation privileges and subsequent read, insert, update, and delete privileges.

### Synchronous engine dependencies

The scheduler components, SQL access, and Redis client are already Orionis dependencies. SQLite uses Python's `sqlite3` for this store. Optional database extras provide the clients required by the synchronous path:

| Database engine | Store client | Extra |
|---|---|---|
| `sqlite` | `sqlite3` | Included in Python. |
| `mysql` | `pymysql` | `orionis[mysql]` |
| `pgsql` | `psycopg2` | `orionis[pgsql]` |
| `oracle` | `oracledb` | `orionis[oracle]` |
| `sqlserver` | `pyodbc` | `orionis[sqlserver]`; also requires the system ODBC driver. |

Install optional packages through the project's selector:

```shell
orionis packages
python -B reactor packages
```

Select the extra for the engine you use; [Database drivers](/en/database/drivers) explains their requirements. Redshift is explicitly rejected because this store requires enforced unique keys and indexes. Oracle receives a dialect-specific precision adjustment for `next_run_time`.

## Redis

<a id="config-redis"></a>

| Field | Variable | Default / validation |
|---|---|---|
| `driver: str` | — | `"redis"`; requires that value. |
| `host: str` | `REDIS_HOST` | `"127.0.0.1"`; nonempty string. |
| `port: int` | `REDIS_PORT` | `6379`; 1 through 65535, not boolean. |
| `db: int` | `REDIS_DB` | `0`; nonnegative integer, not boolean. |
| `password: str \| None` | `REDIS_PASSWORD` | `None`; an empty string is allowed. |
| `key: str` | `REDIS_TASKS_KEY` | `"scheduler:tasks"`; nonempty hash key containing serialized jobs. |
| `run_times_key: str` | `REDIS_RUN_TIMES_KEY` | `"scheduler:run_times"`; nonempty sorted-set key of next run times, different from `key`. |

```dotenv
TASKS_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_TASKS_KEY=reports:scheduler:tasks
REDIS_RUN_TIMES_KEY=reports:scheduler:run_times
```

A reachable Redis server is required. Another Python client installation is unnecessary: Orionis already includes it. Durability across server restarts depends on Redis persistence configuration; Orionis does not enable AOF or snapshots for you.

This store uses the **synchronous** Redis client. Its two keys belong to the scheduler, separately from queue Redis prefixes and Cache keys. Use dedicated keys for independent agendas. Public configuration does not expose username, TLS, cluster, or a connection URL; adding such fields to these entities does not apply them.

## Recovery after restart

The implementation persists an importable reference to the framework executor, passing a **command signature and argument list**. Reactor resolves the command and dependencies again at execution time. It does not persist the container, a command object, a request scope, or Python event listeners.

Persistent scheduler stores use internal pickle serialization. Their tables and keys must remain application-owned and trusted; they are not an interchange format for accepting work from clients. Normal `Schedule.command()` declarations avoid serializing methods bound to the container.

With `replace_existing=True`, each startup declares the code's tasks again and replaces entries sharing their signature. This may recalculate the next run time from the trigger; it does not replay every schedule that elapsed while the process was stopped. `coalesce` and `misfire_grace_time` apply to overdue executions ultimately supplied by the trigger and store.

With `replace_existing=False`, an already-persisted signature can raise `ConflictingIdError` at startup. Removing a declaration from code **does not automatically delete** an old persistent entry; arrange its removal before retiring it and inspect existing entries. `info()` and `schedule:list` describe loaded declarations, rather than a complete store history.

`max_instances` limits executions within one scheduler; it is not a distributed lock across processes. These stores provide no leader election or Queue-style work reservations. Keep one process responsible for an agenda unless you implement external coordination.

## Store service

<a id="store-construction"></a>

`ScheduleStore(app: IApplication, db_manager: IConnectionManager) -> None` implements `IScheduleStore`. Its provider registers a singleton; construction validates `app.config("scheduler")`. The following synchronous methods create store objects; they do not start a clock or dispatch commands.

<a id="store-store"></a>

### `store -> str`

Read-only normalized selected store name: `"memory"`, `"database"`, or `"redis"`.

<a id="store-config"></a>

### `config -> ConfigScheduler`

Read-only validated `Scheduler` entity, including its policies and connection entities.

<a id="store-database"></a>

### `database()`: create the SQL store

Returns the scheduler’s SQL storage object built from the selected connection, table, and engine options. The object is not cached across calls. `database=None` raises `RuntimeError`; missing or invalid Database connections fail while resolving configuration. Redshift raises `RuntimeError`; a missing optional client becomes the appropriate Database dependency error.

<a id="store-redis"></a>

### `redis()`: create the Redis store

Returns an uncached scheduler Redis storage object using the configured task and run-time keys, host, port, database, and password. `redis=None` raises `RuntimeError`; connection errors can surface later when Redis is accessed.

Inspect configuration through injection without constructing extra stores:

```python
from orionis.console.base import BaseCommand
from orionis.console.contracts.store import IScheduleStore


class SchedulerSettingsCommand(BaseCommand):
    signature = "scheduler:settings"
    description = "Show scheduler settings."

    async def handle(self, stores: IScheduleStore) -> int:
        self.writeLine(f"Store: {stores.store}")
        self.writeLine(f"Max instances: {stores.config.max_instances}")
        self.writeLine(f"Replace existing: {stores.config.replace_existing}")
        return 0
```

Normally leave store creation and closing to `Schedule`. Calling `database()` or `redis()` directly is an integration API, not a prerequisite for using the agenda.
