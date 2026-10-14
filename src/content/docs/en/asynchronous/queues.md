---
title: "Queues and jobs"
description: "Use a queue when your application must record work now and execute it in a separate worker, such as preparing a report. A job carries serializable data; its async handle() runs…"
editUrl: true
lastUpdated: false
---

Use a queue when your application must record work now and execute it in a separate worker, such as preparing a report. A job carries serializable data; its async `handle()` runs with application services available.

## Complete a first queued task

### 1. Select persistent storage

The default `sync` driver executes during `await Queue.dispatch(...)`. To use a separate worker, configure your application's `.env` before startup:

```dotenv
QUEUE_CONNECTION=database
DB_CONNECTION=sqlite
```

Check the SQLite location and permissions in `config/database.py`. The database driver creates `jobs` and `failed_jobs` lazily and therefore needs table-creation permissions. Redis is an alternative; its failed-job repository still needs SQL. See [driver configuration](/en/asynchronous/queues/drivers-and-configuration).

### 2. Add an importable job

Save this class in `app/jobs/write_report.py`. Keep it at module scope so the producer and worker can discover the same class:

```python
from uuid import UUID
from orionis.queues import BaseJob
from orionis.storage.contracts.manager import IStorageManager


class WriteReport(BaseJob):
    __slots__ = ("report_id", "text")
    report_id: str
    text: str
    tries = 3
    timeout = 30.0

    def __init__(self, report_id: str, text: str) -> None:
        self.report_id = str(UUID(report_id))
        self.text = text

    async def handle(self, storage: IStorageManager) -> None:
        await storage.disk("local").put(
            f"reports/{self.report_id}.txt", self.text, visibility="private",
        )
```

The worker injects `IStorageManager` into `handle()`. The job writes to the configured `local` disk, so that disk must be writable. Repeating this job for the same `report_id` replaces the same file with the same content; this example deliberately avoids creating a second report on retry. Keep larger documents in storage rather than exceeding the queue's 1 MiB payload limit.

### 3. Dispatch from the application

Use the following function in an async controller or command after bootstrap:

```python
from uuid import uuid4
from app.jobs.write_report import WriteReport
from orionis.support.facades import Queue


async def request_report() -> dict[str, str]:
    report_id = str(uuid4())
    job_id = await Queue.dispatch(WriteReport(report_id, "Report ready"))
    return {"job_id": job_id, "report_id": report_id}
```

Call `await request_report()` from that application flow. The result includes a job identity and report identity. Successful dispatch means the message was submitted, not that the report exists yet. `await` is required: building a `PendingDispatch` and discarding it submits nothing.

### 4. Run the consumer

In a separate terminal at the same application root, with the same code and configuration:

```shell
uv run python -B reactor queue:work database --queue default
```

The worker consumes the job and writes `storage/app/private/reports/<report_id>.txt` with the default local disk configuration. Leave the worker running for subsequent jobs; stop it with the normal interrupt signal. In production, use process supervision and monitor [failures](/en/asynchronous/queues/workers-and-failures).

## Continue with the complete guides

1. [Write and dispatch jobs](/en/asynchronous/queues/jobs-and-dispatch): typed dependencies, allowed payloads, destinations, and delayed work.
2. [Choose and configure a backend](/en/asynchronous/queues/drivers-and-configuration): storage, namespaces, SQL transactions, and Redis requirements.
3. [Workers, retries, and failures](/en/asynchronous/queues/workers-and-failures): leases, timeouts, recovery, and safe retry decisions.

Durability of a message does not guarantee an external effect happens exactly once. Design each business operation for repeated execution. Python 3.14+ and the queue Python dependencies are included in the normal framework installation; a Redis server is required only when selecting the Redis driver.
