---
title: "Write and dispatch jobs"
description: "Workers discover jobs under app_jobs, normally app/jobs. Keep classes at module scope: the persisted identity is module:qualname and must remain available when another process…"
editUrl: true
lastUpdated: false
---

## Declare an importable class

Workers discover jobs under `app_jobs`, normally `app/jobs`. Keep classes at module scope: the persisted identity is `module:qualname` and must remain available when another process consumes the message.

Save the following class as `app/jobs/generate_report.py`.

```python
from orionis.queues import BaseJob


class GenerateReport(BaseJob):
    __slots__ = ("report_id",)
    report_id: str
    tries = 3
    timeout = 30.0
    backoff = (1.0, 5.0)

    def __init__(self, report_id: str) -> None:
        self.report_id = report_id

    async def handle(self) -> None:
        print(f"Generate report {self.report_id}")


job = GenerateReport("report-42")
assert job.report_id == "report-42"
```

This program only constructs a job. In a real application replace printing with a report service. `handle` may request services through typed parameters: the worker opens a scope, registers `JobContext`, and invokes the method through the container. Pass primitive identities to the constructor and resolve services/models during execution; do not serialize an HTTP client, connection, request, or live model.

## Inject services when the job executes

A job constructor receives **data to serialize**, rather than injected services. The worker restores its fields without running `__init__()`, then invokes `handle()` through the container. To extend the example, replace `app/jobs/generate_report.py` with:

```python
from orionis.queues import BaseJob, JobContext


class ReportService:
    async def generate(self, report_id: str) -> str:
        return f"Report {report_id} ready"


class GenerateReport(BaseJob):
    __slots__ = ("report_id",)
    report_id: str
    tries = 3
    timeout = 30.0
    backoff = (1.0, 5.0)

    def __init__(self, report_id: str) -> None:
        self.report_id = report_id

    async def handle(
        self,
        reports: ReportService,
        context: JobContext,
    ) -> None:
        result = await reports.generate(self.report_id)
        print(f"{context.id}: {result} (attempt {context.attempts})")
```

Dispatch remains `await Queue.dispatch(GenerateReport("report-42"))`. Only `report_id` is stored in the message; the worker resolves `ReportService` in its execution scope and supplies that reservation's `JobContext`. This concrete service class needs no additional binding. Put real database or external API work in the service and resolve its typed dependencies there.

Do not add an injected network client or connection to a job constructor: the producer calls it explicitly, and such an object is not serializable state. `ReportService` can itself receive other services through constructor injection. Method injection happens when the worker executes `handle()`, not when Python code calls `job.handle()` directly.

## Persistent state and security

The serializer collects public slots and non-`ClassVar` annotations across the hierarchy. `tries`, `timeout`, and `backoff` are class policy, rather than state. Supported values are strings, bytes, integers, finite floats, booleans, `None`, and nested lists/tuples/dictionaries with string keys. Arbitrary objects, private fields, and undeclared instance state are rejected.

Payloads are limited to 1 MiB and state depth to 32. Store large documents separately and send a key. State uses MessagePack and preserves tuples through an extension; it neither loads pickle nor imports classes from an untrusted identity. Only registered classes can be decoded. The outer envelope uses JSON; version 1 carries identity, routing, and execution policy.

The provider discovers classes during boot; the manager also registers the type during dispatch. Producer registration does not replace discovery in the consumer. Moving/renaming a class may leave pending messages with unknown identities; preserve compatibility or drain/migrate them during deployment.

## Dispatch and select a destination

Inside a booted application with the job installed in its module:

```python
from app.jobs.generate_report import GenerateReport
from orionis.support.facades import Queue


async def enqueue_report() -> str:
    return await (
        Queue.dispatch(GenerateReport("report-42"))
        .onConnection("database")
        .onQueue("reports")
        .delay(5.0)
    )
```

The connection selects a backend/storage namespace; the queue is a logical channel within it; delay is measured in seconds. Defaults apply without explicit selection. Zero delay means immediately available, rather than inline execution except on `sync`. That driver rejects nonzero delay.

`PendingDispatch` does not dispatch from a destructor: dropping it without `await` submits nothing. Repeated awaiters share the result of one submission; options are mutable only before the first await. Do not reuse it as a second message or mutate the job while another consumer awaits submission.

`QueueConfigurationError` identifies invalid policy/routing; `QueuePayloadError` identifies unsupported state; `UnknownJobError` rejects unregistered identities; `QueueDispatchError` covers invalid pending operations and sync-driver restrictions. Catch errors around `await`: constructing a pending dispatch does not validate the entire payload yet.
