---
title: "Write and dispatch jobs"
description: "Generate async jobs, declare persistent state, inject execution-time services, and configure submissions through PendingDispatch."
editUrl: true
lastUpdated: false
---

A job represents a unit of work with its own data and an asynchronous `handle()` method. The producer constructs the instance and submits its data; the consumer restores that state and invokes `handle()` through the container. The connection determines whether this happens during submission (`sync`) or in a separate worker (`database` or `redis`).

<a id="generator"></a>

## Create a job with the CLI

From the project root, either alternative generates the same file:

```shell
orionis make:job send_welcome
```

```shell
python -B reactor make:job send_welcome
```

The syntax is `make:job name`. `name` is the only command-specific argument, required and typed `str`; `-h` / `--help` displays help. There is no overwrite or template-selection option.

The destination uses the application's `app_jobs` path, which defaults to `app/jobs`. The generator appends `Job` to the class and `_job` to the filename when the supplied name does not already end in `job`.

| Input | File under `app/jobs` | Class |
| --- | --- | --- |
| `send_welcome` | `send_welcome_job.py` | `SendWelcomeJob` |
| `send_welcome_job` | `send_welcome_job.py` | `SendWelcomeJob` |
| `emails/send_welcome` | `emails/send_welcome_job.py` | `SendWelcomeJob` |
| `SendWelcome` | `sendwelcome_job.py` | `SendWelcomeJob` |

Prefer `snake_case`: filenames become lowercase, but the generator does not insert underscores between words in CamelCase input. Directories also become lowercase. Both `/` and `\` separators are accepted, and a final extension is removed before generating `.py`. Every component must start with an ASCII letter and contain only letters, digits, or `_`. Absolute paths, empty components, `.`, and `..` are rejected.

Missing directories are created automatically. An existing file reports an error and keeps its contents: creation is exclusive, and there is no `--force`.

### Generated code

For `send_welcome`, `app/jobs/send_welcome_job.py` contains this template with only the class name substituted:

```python
from typing import ClassVar
from orionis.logging.contracts.logger import ILogger
from orionis.queues import BaseJob

class SendWelcomeJob(BaseJob):
    """Log processing of the stored record identifier."""

    __slots__ = ("record_id",)

    record_id: int
    tries: ClassVar[int] = 3
    timeout: ClassVar[float] = 30.0
    backoff: ClassVar[tuple[float, ...]] = (1.0, 5.0)

    def __init__(self, record_id: int) -> None:
        """
        Store the persistent record identifier.

        Parameters
        ----------
        record_id : int
            Record identifier restored when the job is executed.
        """
        self.record_id = record_id

    async def handle(self, logger: ILogger) -> None:
        """
        Log the record identifier through an injected application service.

        Parameters
        ----------
        logger : ILogger
            Application logger resolved for this job execution.
        """
        message = f"Queue job processed record {self.record_id}."
        logger.info(message)
```

The requested name adds no business behavior: this generated example logs its record identifier; it does not send a welcome email yet. Replace `handle()` with your application's work.

<a id="job-construction"></a>

## Job structure and policy

Import `BaseJob` from `orionis.queues` and extend it with a concrete, importable class defined outside local functions. `BaseJob` declares no constructor arguments of its own; each job defines `__init__()` to retain the data it needs later.

`__slots__` declares instance fields and avoids an instance attribute dictionary when the hierarchy does not provide one either. Public annotations also declare persistent fields; inherited slots and annotations are collected together. `ClassVar` identifies class data that must stay outside the message.

| Class option | Value on `BaseJob` | Purpose |
| --- | --- | --- |
| `tries: ClassVar[int \| None]` | `None` | Maximum reservations/attempts. A positive integer; `True` and `False` are invalid. |
| `timeout: ClassVar[float \| None]` | `None` | Positive, finite execution duration in seconds. |
| `backoff: ClassVar[tuple[float, ...] \| None]` | `None` | Nonempty tuple of finite, nonnegative delays between attempts. |

`None` selects the corresponding `queue.worker` option during dispatch. Worker defaults are `tries=3`, `timeout=60.0`, and `backoff=(0.0,)`; the generated template sets timeout to `30.0` and backoff to `(1.0, 5.0)` for that class.

These options become part of the envelope when submission starts. Later changes to the class or `config/queue.py` do not rewrite persisted messages. Do not declare `tries`, `timeout`, or `backoff` as instance slots.

<a id="job-handle"></a>

### `async handle(...) -> None`

This is the required entry point. The base contract declares `async handle(self) -> None`; your implementation may add typed parameters that the container resolves during execution, such as `ILogger` in the template.

The worker waits for `handle()` to finish. Its return value is not a retrievable queue result: successful completion acknowledges and removes the job unless `JobContext` already performed another transition. Raise an exception to apply the worker's error policy, or use the explicit [`JobContext` controls](/en/queues/workers).

<a id="job-retryuntil"></a>

### `retryUntil() -> float | None`

Return an absolute Unix timestamp in seconds, or `None` for no additional deadline. The manager calls this method during submission and persists its result. The worker checks the deadline before execution and before scheduling a retry.

A deadline does not replace `tries`: both constraints apply. An expired value may prevent even the first attempt. Store the deadline as persistent data when it should represent a limit decided at job creation, as in the following example. It must be a finite number, not a relative duration, `datetime`, or boolean.

### Timeout, backoff, and reservation

The effective timeout must be shorter than the connection's `retry_after`. Submission rejects an equal or greater timeout. During execution, the worker also caps it at 95% of the reservation's remaining lifetime; dependency resolution is included in this duration.

The first exception uses the first backoff entry; subsequent failures advance through the tuple and reuse its last value when no more entries remain. `tries` counts reservations, including the first, rather than retries alone. See [retries and failures](/en/queues/failures-and-retries) for the full decision process.

## Constructor data and `handle()` dependencies

The producer calls the job constructor normally. During consumption, the serializer creates an instance through `object.__new__` and restores its fields: **it does not call `__init__()` or inject services into the job constructor**.

Instead, `handle()` is invoked through `app.call(job, "handle")` inside an isolated execution scope. The services it receives can themselves use constructor injection.

This complete example combines both mechanisms. Save it as `app/jobs/write_report_job.py`:

```python
from typing import ClassVar
from orionis.queues import BaseJob, JobContext
from orionis.storage.contracts.manager import IStorageManager


class ReportWriter:
    def __init__(self, storage: IStorageManager) -> None:
        self._storage = storage

    async def write(self, record_id: int, text: str) -> None:
        await self._storage.disk("local").put(
            f"reports/{record_id}.txt",
            text,
            visibility="private",
        )


class WriteReportJob(BaseJob):
    __slots__ = ("record_id", "text", "deadline")

    record_id: int
    text: str
    deadline: float | None
    tries: ClassVar[int] = 3
    timeout: ClassVar[float] = 30.0
    backoff: ClassVar[tuple[float, ...]] = (1.0, 5.0)

    def __init__(
        self,
        record_id: int,
        text: str,
        deadline: float | None = None,
    ) -> None:
        self.record_id = record_id
        self.text = text
        self.deadline = deadline

    def retryUntil(self) -> float | None:
        return self.deadline

    async def handle(
        self,
        writer: ReportWriter,
        context: JobContext,
    ) -> None:
        await writer.write(self.record_id, self.text)
```

Only `record_id`, `text`, and `deadline` travel in the message. The container constructs `ReportWriter` and injects `IStorageManager` at execution time; the worker supplies that reservation's `JobContext`. The concrete `ReportWriter` class needs no additional binding.

The `local` disk must be configured and writable. Repeating the job with the same data writes the same path with the same content instead of creating a different file per attempt. This makes redelivery easier to tolerate. The `context` parameter demonstrates injection; release, acknowledgement, and failure controls are covered in the [worker guide](/en/queues/workers).

Do not store `Request`, connections, network clients, services, or live models in job fields. Submit identifiers and retrieve what is needed through services in `handle()`. Do not rely on `__init__()` effects unless their resulting state is declared and persisted. Calling `job.handle(...)` manually is an ordinary Python call; it does not activate the worker, scopes, or retries.

## Dispatch from a controller

With the `database` connection configured, this method submits the previous job to the logical `reports` queue:

```python
from app.jobs.write_report_job import WriteReportJob
from orionis.http import JSONResponse
from orionis.support.facades import DateTime, Queue


class ReportController:
    async def store(self) -> JSONResponse:
        deadline = DateTime.now().timestamp() + 600.0
        job = WriteReportJob(42, "Report ready", deadline)

        job_id = await (
            Queue.dispatch(job)
            .onConnection("database")
            .onQueue("reports")
            .delay(5.0)
        )

        return JSONResponse({"job_id": job_id}, status_code=202)
```

The returned identifier is the job UUID. For a persistent connection it confirms submission was accepted, not that the report is ready. A worker for that connection must listen to `reports`; a worker listening only to `default` does not consume it:

```shell
orionis queue:work database --queue reports
```

```shell
python -B reactor queue:work database --queue reports
```

Import the facade from `orionis.support.facades`. Its native provider resolves and pins it during application startup; no custom provider is required.

### Dispatch with an injected service

The same submission works without the facade. The container can supply `IQueueManager` to a service constructor or to a controller/command method invoked through DI:

```python
from app.jobs.write_report_job import WriteReportJob
from orionis.queues.contracts.manager import IQueueManager


class ReportRequests:
    def __init__(self, queues: IQueueManager) -> None:
        self._queues = queues

    async def submit(self, record_id: int) -> str:
        return await (
            self._queues.dispatch(WriteReportJob(record_id, "Report ready"))
            .onConnection("database")
            .onQueue("reports")
        )
```

See [service and injection](/en/queues/manager-and-injection) for native registration and method-injection examples.

<a id="pending-construction"></a>

## `PendingDispatch` reference

`Queue.dispatch(job: BaseJob) -> PendingDispatch` is synchronous: it retains the instance and returns the configurable operation. Construction does not serialize the job, open a backend, or submit anything. An instance that does not extend `BaseJob` raises `QueueConfigurationError` immediately.

The technical constructor is `PendingDispatch(submit: DispatchCallback, job: BaseJob) -> None`. `submit` is the manager's async callback with signature `(job, connection, queue, delay) -> Awaitable[str]`. Normally obtain this object through `dispatch()`.

<a id="pending-onconnection"></a>

### `onConnection(name: str) -> PendingDispatch`

Select a **configured connection**, rather than a driver directly. Returns the same object for chaining. When omitted, submission uses `queue.default`. Connection existence is checked during submission; syntactically invalid names are rejected when setting the option.

<a id="pending-onqueue"></a>

### `onQueue(name: str) -> PendingDispatch`

Select a logical channel within the connection. No advance queue registration is required. When omitted, the selected connection's `queue` property applies.

Connection and queue names contain 1–128 characters, start with an ASCII letter or digit, and allow ASCII letters, digits, `.`, `_`, and `-` afterward. Names are neither trimmed nor lowercased. For example, `reports.high` is valid; `reports:high`, `../reports`, and `monthly reports` are not.

<a id="pending-delay"></a>

### `delay(seconds: float) -> PendingDispatch`

Set a finite, nonnegative delay relative to submission time. Accepts `int` or `float`, but not booleans. The initial value is `0.0`; subsequent calls replace it.

For `database` and `redis` this controls when a message becomes available; it does not guarantee execution at that exact instant. `sync` rejects nonzero delays with `QueueDispatchError`. Zero means immediately available; only `sync` executes it during that submission.

<a id="pending-__await__"></a>

### `__await__() -> Generator[object, None, str]`

Use `await pending`: the protocol calls the callback once and returns the `str` identifier. There is no terminal `send()` method or automatic dispatch destructor.

```python
from app.jobs.write_report_job import WriteReportJob
from orionis.support.facades import Queue


async def submit_once() -> str:
    pending = (
        Queue.dispatch(WriteReportJob(42, "Report ready"))
        .onConnection("database")
        .onQueue("reports")
    )

    first_id = await pending
    same_id = await pending
    assert same_id == first_id
    return first_id
```

Repeated awaiters, including concurrent ones, share the result or error of one submission. Once the first `await` starts, changing connection, queue, or delay raises `QueueDispatchError`; an error does not make the object mutable again. Create another operation to submit another message.

The job is retained by reference until submission starts: do not mutate it while it is being submitted. Cancelling a later awaiter does not cancel the initial submission; cancelling the initiator leaves that operation cancelled without an automatic second push. If cancellation interrupts persistence, the producer may not know whether the backend accepted it; creating a new submission requires accounting for duplicates.

<a id="serializer"></a>

## Supported persistent state

`JobSerializer` stores explicit data and registered types, rather than arbitrary Python objects. Each producer and consumer needs the same importable class and field definitions.

### Supported fields and types

- Public fields declared through `__slots__` or public annotations, including inherited fields.
- `str`, `bytes`, `int`, finite `float`, `bool`, and `None`.
- Nested `list`, `tuple`, and `dict` containers of those values; dictionary keys must be `str`.
- Annotations using these types, their parameterized forms, and `|` unions, such as `list[int]` or `float | None`. Slot-only fields need no annotation, but their values remain subject to the same restrictions.

Annotations are checked strictly: `"42"` does not satisfy an `int` field. Unsupported objects include `datetime`, `UUID`, models, services, sets, subclasses of allowed containers, nonfinite numbers, and dictionaries with non-string keys. Convert such objects to identifiers or primitive data before dispatch.

Keep evaluated annotations as shown in the template. Field inspection does not evaluate string annotations: `from __future__ import annotations` and `"int"` are not supported persistent annotations. `Any` is unsupported as well. Use concrete types and, for a nullable field, for example `int | None`.

Private fields, slots named `tries` / `timeout` / `backoff`, and undeclared instance attributes are rejected. All persistent fields must exist during encoding. `ClassVar` stays outside the payload.

### Format, size, and discovery

State uses **MessagePack**, preserving tuples through a custom extension. The outer envelope uses **JSON**, representing its `bytes` field as base64. Neither format is pickle. Both encoded state and the complete envelope are limited to **1 MiB**; envelope metadata and base64 require headroom below that limit. Maximum state nesting depth is **32**.

During startup, the provider discovers modules under `app_jobs` and registers their concrete job classes. The stable identity is `module:Class`, using `__qualname__` for the complete class name. A type defined inside a local function is rejected. Module imports must work in workers and should not execute business operations on import.

Submitting a job also registers its class in the producer. This does not register it in other processes or permit importing a module specified by external payload data: the consumer restores only identities already present in its registry. Moving or renaming classes, or changing fields while messages remain pending, requires preserving compatibility with the code that will consume them.

Store large documents in [Storage](/en/storage) and send a path or identifier. Support for `bytes` does not remove the envelope size limit.

## Serializer API

The native service binds `IJobSerializer` to a singleton `JobSerializer`. The manager normally uses it; its methods are available for integrations that inspect the format without changing its trust policy.

<a id="serializer-construction"></a>

### `JobSerializer()`

Creates reusable codecs and an empty registry. Does not automatically import application jobs or open connections.

<a id="serializer-register"></a>

### `register(job_type: type[BaseJob]) -> None`

Registers a concrete class with `async handle()` and inspects its fields. Re-registering the same class is valid. Abstract classes, types defined in local functions, synchronous handlers, unsupported annotations, and identities occupied by another class raise `QueueConfigurationError`.

<a id="serializer-encode"></a>

### `encode(job: BaseJob) -> tuple[str, bytes]`

Registers the type when necessary and returns `(identity, MessagePack_state)`. Checks every field and the size limit. Invalid state raises `QueuePayloadError`.

<a id="serializer-decode"></a>

### `decode(identity: str, payload: bytes) -> BaseJob`

Restores a registered identity only. Requires exactly the expected fields, creates the object without running its constructor, and assigns restored state. An unknown identity raises `UnknownJobError`; corrupt, incompatible, or oversized data raises `QueuePayloadError`.

This inspection can run within an async application component; it neither submits nor executes the job:

```python
from app.jobs.write_report_job import WriteReportJob
from orionis.queues.contracts.serializer import IJobSerializer


class JobPayloadInspector:
    async def inspect(self, serializer: IJobSerializer) -> dict[str, object]:
        original = WriteReportJob(42, "Report ready")
        identity, payload = serializer.encode(original)
        restored = serializer.decode(identity, payload)

        assert isinstance(restored, WriteReportJob)
        return {
            "identity": identity,
            "state_bytes": len(payload),
            "record_id": restored.record_id,
        }
```

<a id="serializer-encodeenvelope"></a>

### `encodeEnvelope(envelope: JobEnvelope) -> bytes`

Encodes the immutable envelope as JSON and checks the 1 MiB limit. Does not submit or reserve work.

<a id="serializer-decodeenvelope"></a>

### `decodeEnvelope(payload: bytes) -> JobEnvelope`

Validates JSON bytes and envelope fields without resolving the job class. Unknown fields, malformed data, or an unsupported format version raise `QueuePayloadError`.

<a id="job-envelope"></a>

## Dispatch envelope

The manager constructs `JobEnvelope` with keyword arguments. It is an immutable structure that forbids extra fields:

| Field | Type and default | Content |
| --- | --- | --- |
| `id` | `str`, required | Job UUID. |
| `job` | `str`, required | Registered `module:Class` identity. |
| `payload` | `bytes`, required | MessagePack state. |
| `connection` | `str`, required | Selected connection name. |
| `queue` | `str`, required | Logical channel name. |
| `max_tries` | `int`, required | Positive maximum attempt count. |
| `timeout` | `float \| None`, required | Execution duration; the manager always supplies a positive number. |
| `backoff` | `tuple[float, ...]`, required | Nonnegative delays; must not be empty. |
| `retry_until` | `float \| None = None` | Finite absolute deadline. |
| `version` | `int = 1` | Internal envelope format version. |

The constructor accepts `timeout=None` at the format level, but the worker rejects it when validating a reservation. Normal dispatch policy prevents this case. The envelope version describes its storage format, not a framework version you must pin in application code.

## Submission errors

Catch errors around `await Queue.dispatch(...)`: serialization and connection resolution happen when awaited, although some options are validated earlier.

| Error | Cause in this flow |
| --- | --- |
| `QueueConfigurationError` | Invalid job type, destination, annotations, or policy. |
| `QueuePayloadError` | Unsupported fields, values, depth, format, or size. |
| `UnknownJobError` | The consumer has not registered the persisted identity. |
| `QueueDispatchError` | Mutating a started operation or delaying the `sync` driver. |
| Backend error | Submission to storage could not complete. |

An exception from `handle()` is observed during dispatch only with `sync`. Persistent connections execute afterward in workers: use [failure and exception handling](/en/queues/failures-and-retries). Message acknowledgement and external effects do not form one automatic transaction; design work to tolerate repetition.
