---
title: Logging
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Logging

Orionis Framework provides a **multi-channel logging system** with built-in rotation, automatic file management, and lazy initialization. Unlike basic logging setups that write everything to a single file, Orionis lets you define independent channels — each with its own rotation strategy, retention policy, and log level — and switch between them at runtime without restarting the application.

The default channel is read from the `LOG_CHANNEL` environment variable, making it easy to use different strategies per environment (e.g., `stack` in development, `daily` in production) with zero code changes.

---

## Quick Start

The logging service is accessed through the `Log` facade. **You should not import the service class directly** — the facade resolves it from the service container automatically and provides a clean, static-style API:

```python
from orionis.support.facades.logger import Log

# Log at different severity levels
Log.info("Application started successfully")
Log.debug("Processing request payload")
Log.warning("Disk usage above 80%")
Log.error("Failed to connect to database")
Log.critical("Unrecoverable system failure")
```

The logger initializes itself lazily on the first call — no explicit setup is required.

---

## Log Levels

Every channel accepts a `level` parameter that controls the minimum severity recorded. Messages below this threshold are silently discarded.

| Level | Value | Purpose |
|---|---|---|
| `DEBUG` | 10 | Detailed diagnostic information for development |
| `INFO` | 20 | Confirmation that operations are working as expected |
| `WARNING` | 30 | Indication of a potential issue or unexpected behavior |
| `ERROR` | 40 | A failure in a specific operation |
| `CRITICAL` | 50 | A severe failure that may compromise the application |

The level can be specified as a string (`"DEBUG"`), an integer (`10`), or via the `Level` enum:

```python
from orionis.foundation.config.logging.enums.levels import Level

# All three forms are equivalent
level = Level.WARNING
level = "WARNING"
level = 30
```

---

## Channels

A channel is a named logging destination with its own file path, rotation strategy, and retention policy. Orionis ships with **six built-in channels**:

| Channel | Rotation | Suffix Format | Retention Setting |
|---|---|---|---|
| `stack` | None — single file | *(none)* | — |
| `hourly` | Every hour | `YYYY-MM-DD_HH` | `retention_hours` |
| `daily` | Every day | `YYYY-MM-DD` | `retention_days` |
| `weekly` | Every Monday | `YYYY-weekWW` | `retention_weeks` |
| `monthly` | First day of month | `YYYY-MM` | `retention_months` |
| `chunked` | When file reaches size limit | `YYYYMMDD_HHMMSS_NNNN` | `files` |

Only **one channel is active** at any time. The active channel is determined by the `default` setting in the logging configuration.

### stack

The simplest channel. Writes all log entries to a single file with no rotation. Ideal for development or low-traffic applications.

```
storage/logs/stack.log
```

**Default configuration:**

| Parameter | Default |
|---|---|
| `path` | `storage/logs/stack.log` |
| `level` | `INFO` |

### hourly

Creates a new log file every hour. Previous files are automatically cleaned up after the retention period.

```
storage/logs/hourly_2026-03-31_14.log
storage/logs/hourly_2026-03-31_15.log
```

| Parameter | Default | Description |
|---|---|---|
| `path` | `storage/logs/hourly_{suffix}.log` | `{suffix}` is replaced automatically |
| `level` | `INFO` | Minimum severity |
| `retention_hours` | `24` | Number of hourly files to keep |

### daily

Creates a new log file every day. Supports an optional `at` parameter to control the exact rotation time.

```
storage/logs/daily_2026-03-31.log
storage/logs/daily_2026-04-01.log
```

| Parameter | Default | Description |
|---|---|---|
| `path` | `storage/logs/daily_{suffix}.log` | `{suffix}` is replaced automatically |
| `level` | `INFO` | Minimum severity |
| `retention_days` | `7` | Number of daily files to keep |
| `at` | `00:00` | Time of day when rotation occurs |

### weekly

Creates a new log file every Monday. Also supports the `at` parameter.

```
storage/logs/weekly_2026-week14.log
storage/logs/weekly_2026-week15.log
```

| Parameter | Default | Description |
|---|---|---|
| `path` | `storage/logs/weekly_{suffix}.log` | `{suffix}` is replaced automatically |
| `level` | `INFO` | Minimum severity |
| `retention_weeks` | `4` | Number of weekly files to keep |
| `at` | `00:00` | Time on Monday when rotation occurs |

### monthly

Creates a new log file on the first day of each month. Also supports the `at` parameter.

```
storage/logs/monthly_2026-03.log
storage/logs/monthly_2026-04.log
```

| Parameter | Default | Description |
|---|---|---|
| `path` | `storage/logs/monthly_{suffix}.log` | `{suffix}` is replaced automatically |
| `level` | `INFO` | Minimum severity |
| `retention_months` | `4` | Number of monthly files to keep |
| `at` | `00:00` | Time on the first day when rotation occurs |

### chunked

Rotates based on **file size** rather than time. When the active log file reaches the configured size limit, a new chunk is created and the old one is automatically **compressed with gzip**. Ideal for high-throughput applications where logs grow rapidly.

```
storage/logs/chunked_20260331_140523_0001.log
storage/logs/chunked_20260331_140523_0001.log.gz   ← compressed after rotation
storage/logs/chunked_20260331_142107_0002.log
```

| Parameter | Default | Description |
|---|---|---|
| `path` | `storage/logs/chunked_{suffix}.log` | `{suffix}` is replaced automatically |
| `level` | `INFO` | Minimum severity |
| `mb_size` | `10` | Maximum file size in megabytes before rotation |
| `files` | `5` | Maximum number of chunk files to retain |

---

## Configuration

All logging configuration lives in the `config/logging.py` file at the root of your project. This file exports a `BootstrapLogging` dataclass that the framework reads during startup.

### Environment Variable

The default channel is controlled by the `LOG_CHANNEL` environment variable:

```ini
# .env
LOG_CHANNEL=daily
```

If not set, the default channel is `stack`.

### The `config/logging.py` File

To customize channels, retention policies, or rotation times, edit `config/logging.py` directly. This is the **only place** where logging behavior should be configured:

```python
# config/logging.py
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import time
from orionis.foundation.config.logging.entities.channels import Channels
from orionis.foundation.config.logging.entities.daily import Daily
from orionis.foundation.config.logging.entities.stack import Stack
from orionis.foundation.config.logging.entities.chunked import Chunked
from orionis.foundation.config.logging.entities.logging import Logging
from orionis.foundation.config.logging.enums.levels import Level
from orionis.services.environment.env import Env

@dataclass(frozen=True, kw_only=True)
class BootstrapLogging(Logging):

    default: str = field(
        default_factory=lambda: Env.get("LOG_CHANNEL", "stack"),
    )

    channels: Channels | dict = field(
        default_factory=lambda: Channels(
            stack=Stack(
                path="storage/logs/app.log",
                level=Level.DEBUG,
            ),
            daily=Daily(
                path="storage/logs/daily_{suffix}.log",
                level=Level.WARNING,
                retention_days=14,
                at=time(2, 0),  # Rotate at 2:00 AM
            ),
            chunked=Chunked(
                path="storage/logs/chunked_{suffix}.log",
                level=Level.INFO,
                mb_size=20,
                files=10,
            ),
        ),
    )
```

Each channel entity validates its parameters on construction — invalid paths, unsupported log levels, or incorrect types raise descriptive errors immediately.

> **Important:** You only need to declare the channels you want to use. Channels not included in the `Channels(...)` constructor will not be available.

### Path Templates

Channels with rotation use the `{suffix}` placeholder in their path. This placeholder is automatically replaced with a timestamp or identifier when the log file is created. You only need to define the template:

```python
# The framework handles suffix replacement internally
path = "storage/logs/daily_{suffix}.log"
# → storage/logs/daily_2026-03-31.log
```

> **Note:** The `stack` channel does not use `{suffix}` — it writes to a fixed file path.

---

## Switching Channels at Runtime

You can switch the active logging channel without restarting the application using `switchChannel()`:

```python
from orionis.support.facades.logger import Log

# Start with the default channel
Log.info("Using default channel")

# Switch to daily rotation
success = Log.switchChannel("daily")
if success:
    Log.info("Now logging to daily channel")
```

`switchChannel()` returns `True` if the switch was successful, or `False` if the channel name is not present in the configuration. The previous channel's handlers are properly closed before the new one is activated.

---

## Reloading Configuration

If you modify `config/logging.py` or change the `LOG_CHANNEL` variable while the application is running, you can reload the configuration dynamically:

```python
Log.reloadConfiguration()
```

This closes all current handlers, re-reads the configuration from the application, and reinitializes the logger. It is thread-safe and can be called from any context.

---

## Inspecting Channels

The `Log` facade provides methods to inspect the current state of channels:

```python
from orionis.support.facades.logger import Log

# Get the name of the currently active channel
active = Log.getActiveChannel()
# → "daily"

# Get a list of all active channel names
active_list = Log.getActiveChannels()
# → ["daily"]

# Get all channels defined in config/logging.py
available = Log.getAvailableChannels()
# → ["stack", "daily", "chunked"]
```

---

## Advanced Access

For scenarios that require direct access to the underlying `logging.Logger` instance — such as integrating with third-party libraries or adding custom handlers — use `getLogger()`:

```python
import logging
from orionis.support.facades.logger import Log

stdlib_logger = Log.getLogger()
stdlib_logger.addHandler(logging.StreamHandler())
```

> Use this escape hatch sparingly. In most cases, the five severity methods (`info`, `debug`, `warning`, `error`, `critical`) are sufficient.

---

## Releasing Resources

When the logger is no longer needed, call `close()` to release all file handles and system resources:

```python
Log.close()
```

All handlers are closed and the internal state is reset. The logger can be reused — it will reinitialize lazily on the next log call.

---

## Key Behaviors

- **Lazy initialization:** The logger does nothing until the first message is logged. This keeps application startup fast.
- **Thread safety:** All operations — logging, switching channels, reloading — are protected by locks and safe for concurrent use.
- **Empty message filtering:** Blank or whitespace-only messages are silently discarded.
- **Automatic directory creation:** Log directories are created on demand — no manual setup required.
- **Automatic cleanup:** Rotated files beyond the retention limit are automatically deleted.
- **Graceful fallback:** If the configured default channel cannot be found, the logger falls back to `storage/logs/default.log`.

---

## Complete Example

```python
from orionis.support.facades.logger import Log

# Log informational messages (uses the default channel from .env)
Log.info("Application boot complete")
Log.debug("Loaded 42 routes")

# Check current channel
print(Log.getActiveChannel())   # → "stack"
print(Log.getAvailableChannels())  # → ["stack", "daily", "chunked"]

# Switch to daily rotation for production logging
Log.switchChannel("daily")
Log.warning("Switching to daily log rotation")

# After a configuration change, reload without restarting
Log.reloadConfiguration()

# When shutting down, release resources
logger.close()
```
