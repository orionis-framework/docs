---
title: "Tasks after the response"
description: "A background task belongs to the serving process and runs after response delivery. Use it for short side effects whose loss is acceptable; the queues module covers work…"
editUrl: true
lastUpdated: false
---

A background task belongs to the serving process and runs after response delivery. Use it for short side effects whose loss is acceptable; the queues module covers work requiring persistence and retries.

## Return a response with a short follow-up action

Use this response-producing function in an initialized application's controller. The log entry is written after response delivery:

```python
from orionis.background import BackgroundTask
from orionis.http.responses import Response
from orionis.support.facades import Log


def record_delivery(message_id: int) -> None:
    Log.info(f"event=response-delivered message={message_id}")


async def acknowledge(message_id: int) -> Response:
    return Response(
        {"message_id": message_id},
        background=BackgroundTask(record_delivery, message_id),
    )
```

Call and return `await acknowledge(message_id)` from your controller flow. Creating the response alone does not run the task; the active HTTP adapter does. The task still occupies the serving process, and a restart or delivery failure can prevent it from running. Use a [persistent queue](/en/queues) for notifications or processing that must survive those events.

## Learning path

1. [Running actions after responding](/en/queues/background-tasks/response-tasks): prerequisites, progressive usage, configuration, integration, failures, and public reference.

`BackgroundTask` has no provider or configuration of its own. Execution needs the active event loop and the application logger; any additional requirements belong to the callback.

Related: [http](/en/http) · [queues](/en/queues) · [logging](/en/logging)
