---
title: "Queue facade and injection"
description: "Complete queue manager API, Queue facade, dependency injection, and service lifecycle."
editUrl: true
lastUpdated: false
---

<a id="facade"></a>

## One service, two access patterns

Import the facade from the public module:

```python
from app.jobs.process_record_job import ProcessRecordJob
from orionis.support.facades import Queue


async def submit_record(record_id: int) -> str:
    return await Queue.dispatch(ProcessRecordJob(record_id))
```

`Queue` delegates to the `IQueueManager` singleton. The native provider registers it together with `IJobSerializer`, discovers job classes under `app/jobs` during startup, and pins the facade before use. No additional provider is needed for normal use. Startup does not launch workers or open every connection: each driver and the failure repository are resolved when requested.

The examples run inside a controller, command, or another async component of a booted application. `dispatch()` constructs a pending operation; **submission happens when you `await` it**. See [the example job](/en/asynchronous/queues).

## Constructor and method injection

For a service used by several actions, receive `IQueueManager` through the constructor. For example, save this class in `app/http/controllers/record_controller.py`:

```python
from app.jobs.process_record_job import ProcessRecordJob
from orionis.http import JSONResponse
from orionis.queues.contracts.manager import IQueueManager


class RecordController:
    def __init__(self, queue: IQueueManager) -> None:
        self.queue = queue

    async def store(self, record_id: int) -> JSONResponse:
        job_id = await self.queue.dispatch(ProcessRecordJob(record_id))
        return JSONResponse({"job_id": job_id}, status_code=202)
```

You can also request it only in the action that needs it:

```python
from app.jobs.process_record_job import ProcessRecordJob
from orionis.http import JSONResponse
from orionis.queues.contracts.manager import IQueueManager


class RecordController:
    async def store(
        self, record_id: int, queue: IQueueManager,
    ) -> JSONResponse:
        job_id = await queue.dispatch(ProcessRecordJob(record_id))
        return JSONResponse({"job_id": job_id}, status_code=202)
```

In either case, register the action with a route parameter of the same name:

```python
from app.http.controllers.record_controller import RecordController
from orionis.support.facades import Route

Route.post("/records/{record_id:int}/process", [RecordController, "store"])
```

The container resolves the annotated contract; the router supplies `record_id`. The example's `202` response states that you accepted the work. To execute it later, select a persistent driver: with `sync`, the action waits for the job to finish before returning that response.

The same service injection works in components invoked through the container, including commands and job `handle()` methods. **A restored job constructor does not receive dependencies**: the job is rebuilt from serialized state without running `__init__`. Inject its services into `handle()`; see [job data and injection](/en/asynchronous/queues/jobs-and-dispatch).

<a id="manager-construction"></a>

## Manager construction

```text
QueueManager(app: IApplication, serializer: IJobSerializer) -> None
```

The implementation is `orionis.queues.manager.QueueManager`. Its constructor obtains `app.config("queue")` as a dictionary, validates it through the configuration entity, and retains the serializer. It does not open SQL or Redis. Unknown fields and incorrect types may raise `TypeError`; invalid values or relationships raise `ValueError`. In a normal application, use the facade or contract instead of constructing another manager.

<a id="manager-boot"></a>

## Discover jobs: boot()

```python
async def boot(self) -> None: ...
```

Imports modules from the `app_jobs` application path, finds concrete `BaseJob` classes defined in those modules, and registers them with the serializer. The path must be a `Path`; an import failure becomes `QueueConfigurationError`. Classes must also satisfy the serializer's requirements. The producer registers a class during dispatch, but a separate consumer must discover or register it in its own process.

The provider calls this method automatically. For an application that explicitly manages startup:

```python
from orionis.queues.manager import QueueManager


async def discover_jobs(manager: QueueManager) -> None:
    await manager.boot()
```

It does not reread configuration or start consumers. Avoid job modules with import-time side effects: discovery imports them during each process's startup.

<a id="manager-dispatch"></a>

## Prepare and submit: dispatch()

```python
def dispatch(self, job: BaseJob) -> PendingDispatch: ...
```

Accepts a `BaseJob` **instance**; passing a class or another object raises `QueueConfigurationError`. Returns a configurable operation without I/O. When awaited, it registers and serializes the class, applies job policy or worker defaults, and sends the envelope to the driver. The result is a `str` containing the job ID.

```python
from app.jobs.process_record_job import ProcessRecordJob
from orionis.support.facades import Queue


async def enqueue_record(record_id: int) -> str:
    return await (
        Queue.dispatch(ProcessRecordJob(record_id))
        .onConnection("database")
        .onQueue("records")
        .delay(5.0)
    )
```

`onConnection()` selects a configured connection, `onQueue()` a logical channel, and `delay()` the seconds before availability. The `sync` driver rejects nonzero delay. Configuration, serialization, or storage errors occur while preparing or awaiting the operation, depending on the validation. With `sync`, an exception from `handle()` may also propagate; persistent drivers handle it later in the worker.

<a id="manager-connection"></a>

## Get a driver: connection()

```python
async def connection(self, name: str | None = None) -> IQueueDriver: ...
```

`None` selects `queue.default`; an empty string is invalid. Valid names contain 1–128 ASCII characters: they start with a letter or digit and continue with letters, digits, `_`, `.`, or `-`. An unknown connection raises `QueueConfigurationError`. Creation is protected by an async lock, and the manager reuses the driver.

```python
from orionis.support.facades import Queue


async def pending_records() -> int:
    driver = await Queue.connection("database")
    return await driver.size("records")
```

`size()` includes ready, delayed, and reserved messages; it does not count only those available for a worker to reserve now. `clear()` removes all these states and must be used according to [each driver's semantics](/en/asynchronous/queues/api-reference#driver-clear). There is no native `extend()` method for registering additional drivers.

<a id="manager-worker"></a>

## Create a worker: worker()

```python
async def worker(
    self,
    connection: str | None = None,
    queues: tuple[str, ...] | None = None,
    concurrency: int | None = None,
) -> Worker: ...
```

`IQueueManager` annotates its return as `IWorker`; the implementation returns `Worker`. `None` arguments use, respectively, the default connection, its configured channel, and `queue.worker.concurrency`. `queues` must be a nonempty tuple of valid names in priority order; `concurrency` must be a positive integer other than `bool`. `sync` does not support consuming workers.

```python
from orionis.queues.contracts.manager import IQueueManager


async def process_batch(queue: IQueueManager) -> int:
    worker = await queue.worker(
        connection="database", queues=("urgent", "records"), concurrency=2,
    )
    return await worker.run(stop_when_empty=True, max_jobs=100)
```

Creating a worker does not run it. `run()` returns the number of processed reservations, including failed or released attempts; it does not certify business success. Invalid configuration may raise `QueueConfigurationError` or `WorkerOptions` validation errors. See [workers and their limits](/en/asynchronous/queues/workers-and-failures).

<a id="manager-failed"></a>

## Get failures: failed()

```python
async def failed(self) -> IFailedJobRepository: ...
```

Resolves and retains the SQL repository defined by `queue.failed`. It may use a database connection different from the message store. It is also required when the primary backend is Redis or `sync`. Resolution does not turn a SQL failure into an in-memory record.

```python
from orionis.support.facades import Queue


async def inspect_failures() -> tuple[tuple[str, str], ...]:
    repository = await Queue.failed()
    failures = await repository.all()
    return tuple((item.id, item.exception_message) for item in failures)
```

The failure record ID differs from the job ID. The [failure repository](/en/asynchronous/queues/failures-and-retries#failed-repository) documents query and deletion methods, their errors, and traceback data.

<a id="manager-retryfailed"></a>

## Requeue a failure: retryFailed()

```python
async def retryFailed(self, failed_id: str) -> str: ...
```

Finds the record, decodes its envelope, checks `retry_until`, submits to the original connection and channel, and then deletes the failure. Returns the requeued job ID, preserving the same envelope, policy, and ID; the backend resets its attempts. A missing record or expired deadline raises `QueueRetryError`; invalid payload data or backend errors may also prevent the operation.

```python
from orionis.support.facades import Queue


async def retry_failure(failed_id: str) -> str:
    return await Queue.retryFailed(failed_id)
```

Submission and failure deletion do not form a shared transaction. If submission succeeds and deletion fails, the job may already be queued while the record remains visible. Keep business operations repeatable and inspect the state before manually retrying again.

<a id="manager-close"></a>

## Release resources: close()

```python
async def close(self) -> None: ...
```

Sequentially awaits closure of created drivers and the failure repository, clearing their cached references. Closes Redis clients owned by the driver; it does not destroy shared SQL connections. If a close operation raises an exception, the sequence stops: continuing with later resources is not guaranteed.

The provider registers `close()` for application shutdown. **Do not call it after each request**. It also does not automatically stop and wait for every worker it created: request their stop and await their tasks before closing services still used by `handle()`.

```python
from orionis.queues.manager import QueueManager


async def close_owned_manager(manager: QueueManager) -> None:
    # Only for a manager whose lifecycle this component owns.
    await manager.close()
```
