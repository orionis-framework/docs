---
title: "Logging"
description: "Record application events through Log so you can trace a request, investigate a job failure, or inspect an import. The built-in logger writes UTF-8 text files with severity…"
editUrl: true
lastUpdated: false
---

Record application events through `Log` so you can trace a request, investigate a job failure, or inspect an import. The built-in logger writes UTF-8 text files with severity filtering and one active channel.

## Record an event from your application

Configure `.env` before startup, for example:

```dotenv
LOG_CHANNEL=daily
LOG_LEVEL=INFO
LOG_RETENTION=7
```

The standard daily channel writes under `storage/logs` with names such as `daily_2026-10-14.log`. Ensure that directory is writable. Retention limits matching files; it is not a timer that deletes data at an exact age.

After bootstrap, in a controller, command, job, or service:

```python
from orionis.support.facades import Log


async def record_import(import_id: int, row_count: int) -> None:
    Log.info(f"event=import-completed import={import_id} rows={row_count}")
```

`Log.info()` is synchronous: do not add `await`. Messages below `LOG_LEVEL` are filtered. The wrapper accepts one string rather than a dictionary or interpolation arguments; structured JSON output and automatic secret redaction are not built in.

## Choose the next step

1. [Record application events](/en/services/logging/writing-logs): facade/injection, severity, standard-logger access, and tracebacks.
2. [Configure rotation and lifecycle](/en/services/logging/rotation-and-lifecycle): paths, retention, multiple workers, and configuration changes.

Use the application's singleton logger. Creating another `Logger` per request can replace the process-wide handlers. See [exception handling](/en/architecture/exception-handling) for reporting failures through the application policy.
