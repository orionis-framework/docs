---
title: "Queue technical reference"
description: "Contracts, driver methods and public helpers for queue processing."
editUrl: true
lastUpdated: false
---

This reference complements the usage guides. Submit work through [the facade or `IQueueManager`](/en/queues/manager-and-injection); drivers provide the storage interface used by the worker.

<a id="contracts"></a>

## Contract map

| Contract | Implementation and reference |
| --- | --- |
| `IQueueManager` | `QueueManager`: [all its methods](/en/queues/manager-and-injection#manager-construction). |
| `IJob` | `BaseJob`: [`handle()`](/en/queues/jobs-and-dispatch#job-handle). |
| `IJobSerializer` | `JobSerializer`: [registration, state, and envelopes](/en/queues/jobs-and-dispatch#serializer). |
| `IQueueDriver` | `SyncQueueDriver`, `DatabaseQueueDriver`, `RedisQueueDriver`: the API on this page. |
| `IWorker` | `Worker`: [`run()`, `stop()`, and `execute()`](/en/queues/workers#worker-construction). |
| `IFailedJobRepository` | `DatabaseFailedJobRepository`: [recording, querying, and deletion](/en/queues/failures-and-retries#failed-repository). |

Contracts live under `orionis.queues.contracts`, in the `manager`, `job`, `serializer`, `driver`, `worker`, and `failed_repository` modules, respectively. Guide signatures describe the implementations. The manager contract annotates `worker()` with `IWorker`; its concrete implementation returns `Worker`. The repository has naming and annotation differences detailed [in its reference](/en/queues/failures-and-retries#failed-repository).

<a id="driver-construction"></a>

## Driver construction

```text
SyncQueueDriver(
    app: IApplication,
    serializer: IJobSerializer,
    connection: str,
    failed_resolver: FailedResolver,
    retry_after: float = 90.0,
) -> None

DatabaseQueueDriver(connection: IConnection, table: str = "jobs") -> None

RedisQueueDriver(
    config: RedisConfig | None = None,
    *,
    client: Redis | None = None,
) -> None
```

These are reference signatures, not construction statements to copy as calls. Import classes from `orionis.queues.drivers.sync`, `.database`, or `.redis`. `RedisConfig` is `orionis.foundation.config.queue.Redis`, and `Redis` is the `redis.asyncio.Redis` client. The manager constructs each driver for you from [configuration](/en/queues/configuration).

`SyncQueueDriver` requires the container, serializer, connection name, and an async failure resolver. Database requires a shared SQL connection with unique-constraint support; it validates the logical table name and creates its schema when needed. Redis accepts configuration or uses its defaults; when supplied with `client`, it does not own or close that client. An invalid logical table name raises `QueueConfigurationError`. Database without unique constraints and Redis with an invalid configuration type or namespace raise `QueueStorageError`; configuration entities may also raise `TypeError` or `ValueError`.

Durability and reservation behavior differ: see [`sync`](/en/queues/drivers-and-configuration#driver-sync), [Database](/en/queues/drivers-and-configuration#driver-database), and [Redis](/en/queues/drivers-and-configuration#driver-redis).

<a id="driver-push"></a>

## Store: push()

```python
async def push(self, envelope: JobEnvelope, delay: float = 0) -> str: ...
```

The `delay` default is `0.0` in Sync and `0` in the contract, Database, and Redis. Accepts finite, nonnegative seconds. Stores the envelope and returns its ID; persistent backends initialize `attempts` to zero. It does not replace registration and validation performed by the manager before submission.

Sync executes and awaits a single attempt; nonzero delay raises `QueueDispatchError`. Errors from `handle()` may propagate. Database and Redis serialize the envelope and store its availability; Redis translates client errors into `QueueStorageError`. Database may propagate SQL connection exceptions. Duplicate IDs may be rejected depending on storage; do not use `push()` as a business deduplication API.

To construct valid envelopes, see [`JobEnvelope`](/en/queues/jobs-and-dispatch#job-envelope). In ordinary code, use `await Queue.dispatch(job)`.

<a id="driver-reserve"></a>

## Reserve: reserve()

```python
async def reserve(
    self, queues: tuple[str, ...], retry_after: float,
) -> ReservedJob | None: ...
```

Checks channels in priority order and returns a reservation for the first eligible message, or `None`. `retry_after` is a positive duration in seconds for retaining it. Database uses a conditional update and Redis uses Lua scripts; a reservation includes a new token and increments `attempts`. Delayed messages and messages with an active reservation are ineligible. Sync always returns `None`.

Database rejects reservation inside an active transaction on the connection in the current context: it must publish the reservation immediately. It does not hold a SQL lock throughout `handle()`. There is no automatic lease renewal. The [reservation](/en/queues/workers#reserved-job) reference describes every field, and the [worker](/en/queues/workers) manages execution.

<a id="driver-release"></a>

## Release: release()

```python
async def release(self, reserved: ReservedJob, delay: float = 0) -> bool: ...
```

Sync declares `delay=0.0`; the contract and persistent drivers use `delay=0`. Release keeps the message and attempt count, removes its reservation, and sets a new availability time. Returns `True` only while the token still owns an active reservation; an old token or expired lease returns `False`. Seconds must be finite and nonnegative. Sync raises `QueueDispatchError` because it cannot return a message to a persistent queue.

Inside a job, use [`JobContext.release()`](/en/queues/failures-and-retries#job-context-release), which also updates the attempt's state; calling the driver directly does not mark the context as finished.

<a id="driver-delete"></a>

## Acknowledge: delete()

```python
async def delete(self, reserved: ReservedJob) -> bool: ...
```

Database and Redis delete only a message whose reservation remains active and matches the token. Return `False` if another consumer recovered the job, it was deleted, or its lease expired. Sync returns `True`. This does not reverse an external effect already performed by `handle()`.

During normal execution, the worker automatically acknowledges a successful job. Inside `handle()`, use [`JobContext.delete()`](/en/queues/failures-and-retries#job-context-delete) to keep its state coordinated.

<a id="driver-size"></a>

## Count: size()

```python
async def size(self, queue: str) -> int: ...
```

Counts every message in the channel, including delayed and reserved ones. Database creates its schema if needed and queries the table; Redis counts the payload hash. This is not a ready-message-only query, and its value is not guaranteed to remain stable while other processes work. Sync returns zero.

```python
from orionis.support.facades import Queue


async def queue_size() -> int:
    driver = await Queue.connection("database")
    return await driver.size("records")
```

<a id="driver-clear"></a>

## Clear: clear()

```python
async def clear(self, queue: str) -> int: ...
```

Removes every message in the channel and returns the count: ready, delayed, and **active reservations as well**. It does not stop code already executing; that consumer may complete an external effect and then fail to acknowledge it. Failure repository records are not deleted. Sync returns zero.

```python
from orionis.support.facades import Queue


async def clear_stopped_queue() -> int:
    # Run after consumers for this channel have stopped.
    driver = await Queue.connection("database")
    return await driver.clear("records")
```

Channel names must be valid. Redis modification operations use scripts and translate storage failures; Database may propagate SQL errors. The [`queue:clear` command](/en/queues/workers#command-clear) exposes this operation through the console.

<a id="driver-close"></a>

## Close: close()

```python
async def close(self) -> None: ...
```

Sync requests a stop for its internal worker. Database resets its schema-ready flag while retaining the shared SQL connection. Redis closes its client only when the driver created it. None of these operations deletes messages during closure. Normally, the manager performs this operation at application shutdown.

<a id="eligible-clauses"></a>

## SQL eligibility predicates

```python
def eligible_clauses(queue: str, now: float) -> list[WhereClause]: ...
```

This function from `orionis.queues.drivers.database` builds filters for the channel, `available_at <= now`, and an absent or expired reservation. Returns ORM planning objects; it does not execute SQL, acquire a reservation, or validate arguments itself. It is a helper for the plan used by Database, rather than a filter to add to business tables.

```python
from orionis.queues.drivers.database import eligible_clauses
from orionis.queues.functions import current_time


def inspect_eligibility() -> int:
    clauses = eligible_clauses("records", current_time())
    return len(clauses)
```

## Schemas and entities

The public [`validate_table_name()`, `build_jobs_table()`, and `build_failed_jobs_table()` functions](/en/queues/drivers-and-configuration#schema-functions) expose validation and schemas used by the repositories. See that guide for their columns, indexes, and signatures.

Data contracts are [`JobEnvelope`](/en/queues/jobs-and-dispatch#job-envelope), [`ReservedJob`](/en/queues/workers#reserved-job), and [`FailedJob`](/en/queues/failures-and-retries#failed-job). Do not confuse a failure ID with its job ID or construct a reservation with an invented token.

<a id="helper-validate-name"></a>

## Validate names

```python
def validate_name(value: str, label: str) -> str: ...
```

From `orionis.queues.functions`. Accepts an ASCII name of 1–128 characters, starting with a letter or digit and continuing with letters, digits, `_`, `.`, or `-`. Preserves case and does not trim spaces. `label` identifies the field in an error; invalid input raises `QueueConfigurationError`.

```python
from orionis.queues.functions import validate_name

channel = validate_name("reports.email", "queue")
```

<a id="helper-validate-seconds"></a>

## Validate seconds

```python
def validate_seconds(value: float, label: str, *, positive: bool = False) -> float: ...
```

Accepts finite `int` or `float` values, excludes `bool`, and returns `float`. Zero is allowed by default; `positive=True` requires a value greater than zero. Numeric strings are not accepted. Invalid values raise `QueueConfigurationError`.

```python
from orionis.queues.functions import validate_seconds

delay = validate_seconds(5, "delay")
lease = validate_seconds(90.0, "retry_after", positive=True)
```

<a id="helper-current-time"></a>

## Get epoch time

```python
def current_time() -> float: ...
```

Uses the application's `DateTime.now().timestamp()` and returns epoch seconds. Used for availability, expiration, and retry policies; it is neither a monotonic clock nor a duration. Run it with framework services initialized.

```python
from orionis.queues.functions import current_time


def retry_deadline() -> float:
    return current_time() + 300.0
```

<a id="queue-types"></a>

## Callback types

| Public alias | Signature and purpose |
| --- | --- |
| `orionis.queues.types.DispatchCallback` | `Callable[[BaseJob, str \| None, str \| None, float], Awaitable[str]]`: job, connection, channel, and delay; used by `PendingDispatch`. |
| `orionis.queues.context.FailureCallback` | `Callable[[ReservedJob, Exception], Awaitable[bool]]`: records a failure and finishes a reservation. |
| `orionis.queues.worker.FailedResolver` | `Callable[[], Awaitable[IFailedJobRepository]]`: obtains the failure repository when needed. |

The manager and worker construct these callbacks during normal use. If you construct `PendingDispatch`, `JobContext`, or a driver manually, follow both the signature and the meaning of its result; a callback returning `True` without recording the failure and finishing the reservation breaks the worker contract.

<a id="exceptions"></a>

## Public exceptions

All are imported from `orionis.queues.exceptions` and derive from `QueueError`, which extends `RuntimeError`:

| Exception | When it matters |
| --- | --- |
| `QueueError` | Common base for subsystem-specific errors. |
| `QueueConfigurationError` | Invalid destination, names, durations, or runtime configuration. |
| `QueuePayloadError` | Invalid state or envelope, unsupported type, or excessive size. |
| `UnknownJobError` | Unregistered identity; extends `QueuePayloadError`. |
| `QueueStorageError` | Storage operation errors wrapped by the driver. |
| `QueueLeaseError` | The context already finished or cannot complete a transition with a valid reservation. |
| `QueueDispatchError` | A pending operation already started, or an unsupported Sync operation. |
| `QueueRetryError` | Invalid manual retry, or a policy/deadline that prevents continuation. |

Not every external error becomes `QueueError`: SQL, validation, and job exceptions may also propagate. The [exception and retry flow](/en/queues/failures-and-retries) distinguishes these cases.

<a id="provider"></a>

## Native provider

```python
def register(self) -> None: ...
async def boot(self) -> None: ...
```

These methods on `orionis.queues.provider.QueueProvider` register `IQueueManager` and `IJobSerializer` as singletons. During `boot()`, it discovers jobs, registers manager closure with `Lifespan.SHUTDOWN`, and pins the facade. An invalid job module may prevent startup; it is not hidden to let the consumer import arbitrary code from a message.

<a id="facade-accessor"></a>

## Facade accessor

```python
@classmethod
def getFacadeAccessor(cls) -> type[IQueueManager]: ...
```

`Queue.getFacadeAccessor()` returns `IQueueManager`. This links the facade to the container; use service methods to submit work. Import `Queue` from `orionis.support.facades`.
