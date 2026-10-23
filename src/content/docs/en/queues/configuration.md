---
title: "Queue configuration"
description: "Complete config/queue.py reference: connections, drivers, channels, failures, workers, environment variables, and validation."
editUrl: true
lastUpdated: false
---

Declare configuration in `config/queue.py` using `BootstrapQueue`, which extends `orionis.foundation.config.queue.Queue`. The manager reads these settings, validates their entities, and retains a normalized representation before resolving backends.

<a id="config-queue"></a>

## Main structure

```python
from dataclasses import dataclass, field

from orionis.environment import Env
from orionis.foundation.config.queue import (
    Connections,
    Database,
    Failed,
    Queue,
    Redis,
    Sync,
    Worker,
)


@dataclass(frozen=True, kw_only=True, slots=True)
class BootstrapQueue(Queue):

    default: str = field(
        default_factory=lambda: Env.get("QUEUE_CONNECTION", "sync"),
    )

    connections: Connections | dict[str, Sync | Database | Redis | dict] = field(
        default_factory=Connections,
    )

    failed: Failed | dict = field(default_factory=Failed)

    worker: Worker | dict = field(default_factory=Worker)
```

This definition uses the native entities' environment values and defaults. Orionis's distributed file also spells out individual connection fields to make them easier to customize.

| Field | Accepted type | Default | Effect |
|---|---|---|---|
| `default` | `str`. | `QUEUE_CONNECTION`, or `"sync"`. | Queue connection used when dispatch or worker selects no explicit connection. Must exist in `connections`. |
| `connections` | `Connections`, or dictionary mapping names to `Sync`, `Database`, `Redis`, or their configuration dictionaries. | `Connections()` containing `sync`, `database`, and `redis`. | Available backends. Each may contain multiple logical channels. |
| `failed` | `Failed` or `dict`. | `Failed()`. | Shared SQL connection and table for terminal failures. |
| `worker` | `Worker` or `dict`. | `Worker()`. | Concurrency, polling pause, and execution defaults inherited by jobs. |

Entities are frozen dataclasses with keyword-only construction arguments. Nested dictionaries are converted to validated entities; unknown fields raise `TypeError`. `toDict()` returns a recursive copy and serializes `Drivers` members to their string values; `getFields()` describes fields and metadata.

<a id="config-connections"></a>

## Connections and queue names

`Connections(sync=..., database=..., redis=...)` groups the three conventional names, accepting an entity or dictionary for each. Use a dictionary for `BootstrapQueue.connections` when you need custom names or multiple backends of the same type.

A queue connection name such as `reports` need not equal driver `database` or SQL connection `analytics`. Select a channel with `.onQueue("exports")`; channels do not require separate configuration entries.

Always specify `driver` in dictionaries for custom connection names. If omitted, Orionis tries to infer it from that entry's name, which works directly only for `sync`, `database`, and `redis`.

```python
from dataclasses import dataclass, field

from orionis.foundation.config.queue import Database, Failed, Queue, Redis, Sync, Worker


@dataclass(frozen=True, kw_only=True, slots=True)
class BootstrapQueue(Queue):

    default: str = "reports"

    connections: dict[str, Sync | Database | Redis | dict] = field(
        default_factory=lambda: {
            "inline": Sync(),
            "reports": Database(table="report_jobs", queue="exports"),
            "notifications": Redis(
                prefix="example:notifications",
                queue="mail",
            ),
        },
    )

    failed: Failed | dict = field(
        default_factory=lambda: Failed(table="failed_jobs"),
    )

    worker: Worker | dict = field(
        default_factory=lambda: Worker(timeout=30.0, tries=3, backoff=(1.0, 5.0)),
    )
```

This example replaces `config/queue.py`. It uses the default SQL connection for `reports` and failures; Redis keeps host, port, and credentials from the environment. Jobs can select `reports` with `.onConnection("reports")`; workers must consume that same connection and the corresponding channel.

Connection and queue names accept 1–128 ASCII characters: a letter or digit first, followed by letters, digits, `.`, `_`, or `-`. Names are retained as supplied, without trimming or lowercasing. Tables accept unqualified ASCII SQL identifiers matching `[A-Za-z_]\w*`, such as `report_jobs`.

### Isolate persistent connections

Two `database` connections with the same `connection` value must use different tables. Two Redis connections using the same host, port, and database must use distinct prefixes. Changing only `queue` does not create independent storage and configuration rejects that overlap.

Redis comparison includes `endpoint`, `port`, `db`, and `prefix`; credentials do not create a different namespace. SQL validation compares configured connection names and tables. If two SQL names actually point to the same storage, preserve physical separation yourself: validation does not discover infrastructure aliases.

<a id="config-drivers"></a>

## Drivers and enumeration

`Drivers` is a `StrEnum` containing `SYNC="sync"`, `DATABASE="database"`, and `REDIS="redis"`. Each connection entity requires its `driver` to match the implementation it represents.

Values are compared exactly: `"REDIS"`, `" redis "`, or unknown drivers are not normalized to `"redis"`. Native configuration has no mechanism to register other driver names; see the [backend comparison](/en/queues/drivers-and-configuration).

<a id="config-sync"></a>

## `sync` connection

| Field | Type | Environment | Default | Purpose and validation |
|---|---|---|---|---|
| `driver` | `Drivers` or `str`. | No dedicated variable. | `Drivers.SYNC` (`"sync"`). | Must equal `sync`. |
| `queue` | `str`. | `QUEUE_SYNC_QUEUE`. | `"default"`. | Channel used when dispatch does not call `.onQueue()`. Must be a valid name. |
| `retry_after` | `float`; also accepts `int`. | `QUEUE_SYNC_RETRY_AFTER`. | `90.0`. | Positive finite lifetime of the immediate attempt's reservation; does not enable persistent retries. |

Although `sync` stores no pending work, its reservation is validated against timeout just like persistent drivers' reservations.

<a id="config-database"></a>

## `database` connection

| Field | Type | Environment | Default | Purpose and validation |
|---|---|---|---|---|
| `driver` | `Drivers` or `str`. | No dedicated variable. | `Drivers.DATABASE`. | Must equal `database`. |
| `connection` | `str` or `None`. | `QUEUE_DB_CONNECTION`. | `None`. | Database service connection name; `None` selects its default. A string must be a valid name. |
| `table` | `str`. | `QUEUE_TABLE`. | `"jobs"`. | Logical table name without a schema, before the SQL prefix. |
| `queue` | `str`. | `QUEUE_DB_QUEUE`. | `"default"`. | Default logical channel. |
| `retry_after` | `float` or `int`. | `QUEUE_DB_RETRY_AFTER`. | `90.0`. | Positive finite reservation ownership seconds. An unacknowledged job becomes eligible again when they expire. |

The table is created by the first operation needing its schema. Its primary key must enforce uniqueness; the driver rejects a connection without enforced unique constraints. See [SQL persistence](/en/queues/drivers-and-configuration#driver-database).

<a id="config-redis"></a>

## `redis` connection

| Field | Type | Environment | Default | Purpose and validation |
|---|---|---|---|---|
| `driver` | `Drivers` or `str`. | No dedicated variable. | `Drivers.REDIS`. | Must equal `redis`. |
| `endpoint` | `str`. | `REDIS_HOST`. | `"127.0.0.1"`. | Nonblank host, retained without trimming. |
| `port` | `int`. | `REDIS_PORT`. | `6379`. | Port between 1 and 65535, inclusive. |
| `db` | `int`. | `REDIS_DB`. | `0`. | Database index greater than or equal to zero. |
| `password` | `str` or `None`. | `REDIS_PASSWORD`. | `None`. | Optional password; the entity also permits an empty string. |
| `prefix` | `str`. | `QUEUE_REDIS_PREFIX`. | `"orionis:queues"`. | Nonblank namespace. The driver additionally rejects `{` and `}`. |
| `queue` | `str`. | `QUEUE_REDIS_QUEUE`. | `"default"`. | Default logical channel. |
| `retry_after` | `float` or `int`. | `QUEUE_REDIS_RETRY_AFTER`. | `90.0`. | Positive finite reservation ownership seconds. |

Other project services may also use `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB`, and `REDIS_PASSWORD`. The queue prefix isolates its keys. This entity exposes no `url`, TLS, username, Sentinel, or Redis Cluster options. The Python client is already included; a reachable Redis server is required.

<a id="config-failed"></a>

## Failure storage

| Field | Type | Environment | Default | Purpose and validation |
|---|---|---|---|---|
| `connection` | `str` or `None`. | `QUEUE_FAILED_DB_CONNECTION`. | `None`. | SQL connection for terminal diagnostics; `None` uses the Database default. |
| `table` | `str`. | `QUEUE_FAILED_TABLE`. | `"failed_jobs"`. | Valid unqualified SQL identifier. Must differ from the jobs table when their configured connection names match. |

`Failed` has no `driver` field: the included repository uses SQL. It resolves lazily and is shared by queue connections. Using Redis does not remove the SQL connection requirement for preserving terminal failures.

The table stores the recoverable envelope and exception diagnostics. See [failures and retries](/en/queues/failures-and-retries) to inspect, retry, and remove those records.

<a id="config-worker"></a>

## Worker and execution options

| Field | Type | Environment | Default | Effect and validation |
|---|---|---|---|---|
| `concurrency` | `int`. | `QUEUE_WORKER_CONCURRENCY`. | `1`. | Maximum concurrent worker jobs; integer greater than or equal to one. `Queue.worker()` can override it for one instance. |
| `sleep` | `float` or `int`. | `QUEUE_WORKER_SLEEP`. | `1.0`. | Polling pause when no work is available, in positive finite seconds. |
| `timeout` | `float` or `int`. | `QUEUE_WORKER_TIMEOUT`. | `60.0`. | Default per-job execution limit, positive and finite. Captured in the envelope on dispatch. |
| `tries` | `int`. | `QUEUE_WORKER_TRIES`. | `3`. | Maximum attempts, including the first; integer greater than or equal to one. Captured on dispatch. |
| `backoff` | `tuple[float, ...]` or `list[float]`. | `QUEUE_WORKER_BACKOFF`. | `(0.0,)`. | Nonempty retry delay schedule. Each value must be finite and nonnegative; copied into a tuple. |

`BaseJob.tries`, `timeout`, and `backoff` override these defaults when not `None`. Consequently, changing defaults does not rewrite execution budgets in previously stored envelopes.

`worker.timeout` must be **strictly below** `retry_after` for **every** declared connection, including `sync`, even when it is not the default. The manager also checks that relationship against each job's effective timeout during submission. Increase reservation duration when a job needs a longer timeout; reservations are not renewed automatically during execution.

An environment example with valid types:

```dotenv
QUEUE_CONNECTION=database
QUEUE_DB_RETRY_AFTER=120.0
QUEUE_SYNC_RETRY_AFTER=120.0
QUEUE_REDIS_RETRY_AFTER=120.0
QUEUE_WORKER_CONCURRENCY=4
QUEUE_WORKER_SLEEP=0.5
QUEUE_WORKER_TIMEOUT=60.0
QUEUE_WORKER_TRIES=4
QUEUE_WORKER_BACKOFF="(1.0, 5.0, 15.0)"
```

`Env` interprets numbers and collection literals. The schedule must become an actual list or tuple, rather than an arbitrary comma-separated string. Configuration does not coerce incorrect values left after environment parsing: it rejects booleans as integers or durations, string-valued ports, and `NaN` or infinite durations.

## Configuration errors

Entity construction raises `TypeError` for unsupported types or fields and `ValueError` for invalid names, ranges, drivers, or relationships. Validation happens before backend operations start.

For example, `Worker(timeout=90.0)` is valid alone, but `Queue(worker=Worker(timeout=90.0))` is rejected with default connections whose reservations last 90 seconds. Selecting an undeclared connection, an invalid queue name, or an invalid delay through the runtime API raises `QueueConfigurationError`.

Static validation does not test credentials, server reachability, or SQL permissions; those errors appear when the corresponding operation runs. The [drivers guide](/en/queues/drivers-and-configuration) explains resources and their creation time; the [API reference](/en/queues/api-reference) covers public contracts.
