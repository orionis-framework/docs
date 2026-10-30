---
title: "Log channels and configuration"
description: "Complete config/logging.py reference: six channels, levels, paths, environment variables and configuration entity validation."
editUrl: true
lastUpdated: false
---

`config/logging.py` defines `BootstrapLogging`, an immutable dataclass extending `Logging`. It selects the default channel and configures the six built-in channels. The service obtains the resolved configuration from `app.config("logging")`; it does not read `.env` for each message.

<a id="logging-configuration"></a>
## General configuration

Import the entities from their public module:

```python
from orionis.foundation.config.logging import (
    Channels, Chunked, Daily, Hourly, Level, Logging,
    Monthly, Stack, Weekly,
)
```

| Entity and field | Type and default | Behavior |
|---|---|---|
| `Logging.default` | `str`; `LOG_CHANNEL`, or `"stack"`. | Channel selected when the logger initializes. Accepts only the six exact names in the next table. |
| `Logging.channels` | `Channels \| dict`; a new `Channels()`. | A dictionary is converted into `Channels(**value)`, validating its entries. |
| `Logging.queue_capacity` | `int`; `LOG_QUEUE_CAPACITY`, or `0`. | Pending records per handler; zero keeps synchronous delivery. |
| `BootstrapLogging.default` | `str`; the same environment value. | The project file makes the channel selection explicit. |
| `BootstrapLogging.channels` | `Channels \| dict`; a factory creating all six entities. | Exposes the environment reads and conditions you can customize in this file. |

`default=" DAILY "`, `default="Daily"` and an unknown name raise `ValueError`: channel names are not stripped or normalized. A `channels` value other than `Channels` or `dict` raises `TypeError`.

<a id="logging-queue-capacity"></a>

## Enable bounded background logging

Since **1.1.0**, `Logging.queue_capacity: int` controls the pending-record budget **per handler**. The default `0` retains synchronous delivery. Set a positive value in configuration or through `Application(...).withConfigLogging(queue_capacity=1024)` before creating the application:

```dotenv
LOG_QUEUE_CAPACITY=int:1024
```

Both the framework `Logging` entity and the current editable `BootstrapLogging` read this variable. Existing configuration classes inheriting the field obtain that behavior; if your application explicitly replaces the field or builds configuration dictionaries, include the value in that configuration. A negative value, boolean or non-integer raises `ValueError`.

The queue moves emission, rotation and compression to a listener thread. Saturation raises `queue.Full` at every severity, including `CRITICAL`; it does not silently discard messages or switch to blocking disk writes. Background sink failures surface as `LoggingDeliveryError` from `orionis.logging.handlers.queued` during a subsequent emission, flush or close. See [shutdown and ownership](/en/logging/rotation-and-lifecycle#logging-async-close).

<a id="logging-channels"></a>
## The six available channels

Each field in `Channels` accepts its corresponding entity or a `dict`, converted when the configuration is constructed. All are created and validated, even when only one is active. They do not accept `None`; an unknown entry such as `audit` raises `TypeError` when constructing `Channels`.

| `Channels` field | Entity | Default path | Built-in policy |
|---|---|---|---|
| `stack` | `Stack` | `storage/logs/stack.log` | One file without rotation. The name does not represent a combination of channels. |
| `hourly` | `Hourly` | `storage/logs/hourly_{suffix}.log` | Hour-based suffix. |
| `daily` | `Daily` | `storage/logs/daily_{suffix}.log` | Date-based suffix. |
| `weekly` | `Weekly` | `storage/logs/weekly_{suffix}.log` | ISO week-based suffix. |
| `monthly` | `Monthly` | `storage/logs/monthly_{suffix}.log` | Year and month suffix. |
| `chunked` | `Chunked` | `storage/logs/chunked_{suffix}.log` | Date and counter suffix; gzip compression of closed files. |

The names select concrete implementations; these entities do not have a `driver` field or an `extend()` channel registry. The included system writes UTF-8 files and requires no additional Orionis extras. SMTP, Redis, remote services and JSON output are not channel options in this configuration.

For writing messages and inspecting the active channel, see [facade and logger injection](/en/logging/writing-logs). The service maintains **one active channel**; declaring six configurations does not send every message to six files.

<a id="logging-levels"></a>
## Channel levels

All six entities expose `level: int | str | Level`. They all read `LOG_LEVEL`, default to `Level.INFO`, and store the validated level as an integer.

| `Level` member | Value | When to use it |
|---|---|---|
| `DEBUG` | `10` | Diagnostic details during an investigation. |
| `INFO` | `20` | Expected events, such as a completed import. |
| `WARNING` | `30` | Unexpected conditions that still allow execution to continue. |
| `ERROR` | `40` | An operation could not complete. |
| `CRITICAL` | `50` | Serious failures compromising service continuity. |

The level sets the handler threshold: `WARNING` admits `WARNING`, `ERROR` and `CRITICAL`. It does not change the severity of a message sent through `info()`.

```python
from orionis.foundation.config.logging import Daily, Level


daily = Daily(level=Level.WARNING)
assert daily.level == 30
assert Daily(level=" warning ").level == 30
assert Daily(level=30).level == 30
```

Level names are stripped and converted to uppercase. Only the five names or values above are accepted: `"WARN"`, `"FATAL"`, `"30"`, `0` and `25` raise `ValueError`; `True`, `None` and a `float` raise `TypeError`. `Level` does not contain `notice`, `alert` or `emergency`.

<a id="logging-paths"></a>
## File locations and path validation

Every entity has `path: str`. It must be a nonempty string ending exactly in `.log`; `.LOG`, a path with trailing spaces and a directory path fail validation. The string is not stripped or transformed. Rotating entities additionally require the literal `{suffix}` placeholder; it is optional for `Stack`.

```python
from orionis.foundation.config.logging import Daily, Stack


single_file = Stack(path="storage/logs/application.log")
daily_files = Daily(path="storage/logs/application_{suffix}.log")
```

Use paths relative to the project root for consistent configuration. Handlers create parent directories when preparing their file, not during `path` validation. Creating a directory does not imply that the process can write every subsequent file.

There is a concrete difference with absolute paths: rotating handlers and the `stack` handler created by `switchChannel()` use `Path(app_root) / path`, which preserves an absolute path. Initialization of `stack` as the default channel joins the root and `path` as text; it therefore **does not interpret absolute paths consistently**. Configure a relative path for `stack`.

The usual directory is `storage/logs`, but it does not come from the default `Storage` disk. The logger writes directly to the filesystem using its channel's `path`. See [locations, names and concurrency](/en/logging/rotation-and-lifecycle#log-files) for the scope of these files across processes.

<a id="logging-retention-options"></a>
## Retention and rotation options

In addition to `path` and `level`, these entities expose the following fields:

| Entity and field | Type and default | Accepted values |
|---|---|---|
| `Hourly.retention_hours` | `int`; `24`. | From `1` to `168`. |
| `Daily.retention_days` | `int`; `7`. | From `1` to `90`. |
| `Daily.at` | `datetime.time \| str`; `time(0, 0, 0)`. | A Python time or a string accepted by `time.fromisoformat()`, such as `"00:00:00"`. Stored as `time`. |
| `Weekly.retention_weeks` | `int`; `4`. | From `1` to `12`. |
| `Monthly.retention_months` | `int`; `4`. | From `1` to `12`. |
| `Chunked.mb_size` | `int`; `10`. | From `1` to `1000`; the factory calculates `mb_size * 1024 * 1024` bytes. |
| `Chunked.files` | `int`; `5`. | At least `1`, with no additional maximum in the entity. |

Numeric fields reject booleans and numeric strings. Incorrect types raise `TypeError`; values outside the interval raise `ValueError`. For `Hourly`, a negative integer raises `TypeError`; zero or an integer greater than `168` raises `ValueError`. An invalid time string raises `ValueError`; another `at` type raises `TypeError`.

**The names `retention_hours`, `retention_days`, `retention_weeks` and `retention_months` do not implement expiration by age.** The factory passes their value as `backup_count`: the handler counts matching files, orders them by modification time and cleans them up during rotation. There is no task deleting each file once it reaches that number of hours, days, weeks or months.

`Daily.at` is passed to the resolver and allows it to calculate a theoretical next rotation time; the built-in handler decides by date suffix changes without consulting that calculation. Do not assume that `Chunked.mb_size` groups messages until reaching the limit either: its resolver changes the suffix on every emission, causing rotations before that threshold. Review the exact examples and effects in [rotation and retention](/en/logging/rotation-and-lifecycle#time-rotation) before choosing a policy.

`Stack` has no rotation or retention fields. `Weekly` and `Monthly` do not expose an `at` field in their entities, although the low-level factory can read a dictionary key with that name.

<a id="logging-environment"></a>
## Project environment variables

These are all the environment reads in `config/logging.py`:

| Variable | Default | Actual scope |
|---|---|---|
| `LOG_CHANNEL` | `stack` | Selects `Logging.default` and determines which entity receives `LOG_PATH` and `LOG_RETENTION`. |
| `LOG_QUEUE_CAPACITY` | `0` | Enables a bounded background queue per handler when positive. |
| `LOG_LEVEL` | `INFO` | Initial level of **all six channels**, including inactive ones. |
| `LOG_PATH` | Path from the channel table. | Replaces only the path of the channel named by `LOG_CHANNEL`. |
| `LOG_RETENTION` | `24`, `7`, `4` or `4`. | Replaces only `retention_hours`, `retention_days`, `retention_weeks` or `retention_months` of the selected time-based channel. Does not configure `stack` or `chunked`. |
| `LOG_ROTATION_TIME` | `00:00:00`. | Configures `Daily.at`, even when another channel is active. |
| `LOG_MB_SIZE` | `10`. | Configures `Chunked.mb_size`, even when another channel is active. |
| `LOG_FILES` | `5`. | Configures `Chunked.files`, even when another channel is active. |

For example, this `.env` selects `daily` and changes only its path and retention count:

```dotenv
LOG_CHANNEL=daily
LOG_LEVEL=INFO
LOG_PATH=storage/logs/application_{suffix}.log
LOG_RETENTION=int:14
```

`hourly`, `weekly`, `monthly` and `chunked` keep their standard paths; `stack` keeps `storage/logs/stack.log`. If you later switch channels at runtime with `switchChannel("hourly")`, the already resolved `hourly` configuration is used; shared environment variables are not reapplied to that channel.

To select `chunked`, the corresponding configuration would be:

```dotenv
LOG_CHANNEL=chunked
LOG_LEVEL=WARNING
LOG_PATH=storage/logs/worker_{suffix}.log
LOG_MB_SIZE=int:20
LOG_FILES=int:8
```

These values configure the `Chunked` fields; its rotation per record remains as described above. `LOG_RETENTION` does not change `files`.

Use the [Environment](/en/environment) component **only in configuration files**. In controllers, commands and services, use the application's configuration or the injected logger. An invalid inactive channel value can also prevent `Channels` construction: for example, `LOG_FILES=int:0` is invalid even with `LOG_CHANNEL=stack`.

<a id="logging-custom-configuration"></a>
## Configuring channels independently

Edit `config/logging.py` to give each channel its own path, level and policy. This complete replacement shows every supported field and avoids relying on a shared environment variable:

```python
from dataclasses import dataclass, field
from datetime import time
from orionis.foundation.config.logging import (
    Channels, Chunked, Daily, Hourly, Level, Logging,
    Monthly, Stack, Weekly,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapLogging(Logging):
    queue_capacity: int = 0
    default: str = "daily"
    channels: Channels | dict = field(
        default_factory=lambda: Channels(
            stack=Stack(
                path="storage/logs/application.log",
                level=Level.WARNING,
            ),
            hourly=Hourly(
                path="storage/logs/hourly_{suffix}.log",
                level=Level.DEBUG,
                retention_hours=48,
            ),
            daily=Daily(
                path="storage/logs/daily_{suffix}.log",
                level=Level.INFO,
                retention_days=14,
                at=time(0, 0, 0),
            ),
            weekly=Weekly(
                path="storage/logs/weekly_{suffix}.log",
                level=Level.INFO,
                retention_weeks=8,
            ),
            monthly=Monthly(
                path="storage/logs/monthly_{suffix}.log",
                level=Level.WARNING,
                retention_months=6,
            ),
            chunked=Chunked(
                path="storage/logs/chunked_{suffix}.log",
                level=Level.ERROR,
                mb_size=20,
                files=8,
            ),
        ),
    )
```

You can also use dictionaries for the same entities:

```python
from orionis.foundation.config.logging import Logging


settings = Logging(
    default="daily",
    channels={
        "daily": {
            "path": "storage/logs/application_{suffix}.log",
            "level": "INFO",
            "retention_days": 14,
            "at": "00:00:00",
        },
    },
)
assert settings.channels.daily.level == 20
```

The five omitted `Channels` fields construct their default entities; they are not disabled. A key unsupported by an entity, such as `daily={"files": 8}`, raises `TypeError`.

The entities are immutable: make these changes before creating the application. To modify the resolved configuration of an already running application, see [reloading and channel selection](/en/logging/rotation-and-lifecycle#logger-lifecycle); changing `.env` or the Python file does not reconfigure existing handlers by itself.

<a id="logging-validators"></a>
## Public configuration validators

The entities apply these validators automatically. They are also available for validating your own configurations:

```python
from orionis.foundation.config.logging.validators import (
    IsValidLevel, IsValidPath,
)


assert IsValidLevel(" info ") is None
assert IsValidLevel.normalize(" info ") == 20
assert IsValidPath("storage/logs/application.log") is None
assert IsValidPath(
    "storage/logs/application_{suffix}.log",
    suffix=True,
) is None
```

`IsValidLevel(value: Level | int | str) -> None` validates without returning an integer; `IsValidLevel.normalize(value: Level | int | str) -> int` validates and returns the numeric level. Both share the types, names and errors described in [levels](#logging-levels).

`IsValidPath(value: str, *, suffix: bool = False) -> None` checks the string, the placeholder when required, and the `.log` ending. It does not create files, check permissions or restrict the path to `storage/logs`. Incorrect types raise `TypeError`; an empty string, missing placeholder or incorrect ending raises `ValueError`.
