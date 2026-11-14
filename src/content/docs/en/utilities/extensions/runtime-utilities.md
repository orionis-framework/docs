---
title: "Facades, dates, and runtime utilities"
description: "A facade is a class-level proxy to an object resolved by the Orionis service container. Imports are lazy, so importing orionis.support.facades does not eagerly load every…"
editUrl: true
lastUpdated: false
---

The detailed [Workers](/en/utilities/helpers/workers) and [PerformanceCounter](/en/utilities/helpers/performance-counter) references cover signatures, contexts and injection. Other services retain their module guides.

## Core concepts

### Facades

A facade is a class-level proxy to an object resolved by the Orionis service container. Imports are lazy, so importing `orionis.support.facades` does not eagerly load every subsystem. Runtime implementations are intentionally small, while adjacent `.pyi` files expose the proxied API to type checkers and editors.

Most facades are process-wide. `Session` is scoped, so its resolution follows the active request or execution scope. Do not retain resolved request services across scopes.

### Utility values

`Collection` provides fluent transformations around a list. Most query operations return a new collection; explicitly mutating methods such as `push`, `put`, `forget`, `merge`, and `transform` update the current object. `DotDict` enables recursive attribute access, `StdClass` stores validated dynamic attributes, `Stringable` is an immutable `str` subclass with fluent text operations, and `MISSING` distinguishes an omitted value from `None`.

### Entities and structures

`BaseEntity` is meant to be combined with `@dataclass`. It serializes nested dataclasses and enum fields through `toDict()` and describes field types, defaults, and metadata through `getFields()`. `FreezeThaw` converts dictionaries to read-only mapping proxies and sequences to tuples, with the cycle and shared-reference limits described in its reference.

### Cross-cutting helpers

`Singleton` implements one instance per concrete class with a lock-protected initialization path. `Final` prevents subclassing. `PerformanceCounter` measures synchronous or asynchronous intervals. `Workers` chooses a process count from cached logical CPU and total-memory limits. `Parser.exception()` creates a cached structured representation of an exception. `Inspire` returns a cryptographically selected quote.

## Public API

### Facades

Import facades from `orionis.support.facades`:

| Facade | Service area |
| --- | --- |
| `Application` | Application container and lifecycle. |
| `Auth` | Authentication manager. |
| `Cache` | Cache stores and operations. |
| `Catch` | Exception-reporting service. |
| `Crypt` | Encryption and decryption. |
| `DateTime` | Standalone date, time-zone, duration, and interval helpers. |
| `DB` | Database query builder. |
| [`Debug`](/en/utilities/helpers/debug) | Value inspection through `dump()` and `dd()`. |
| `Hash` | Password and value hashing. |
| `Lang` | Translation. |
| `Log` | Text event logging with severity filtering. |
| `Mail` | Mail construction and delivery. |
| `Mcp` | MCP server registration and notifications. |
| `Queue` | Queue dispatch, connections, workers, and failed jobs. |
| `Reactor` | Console command execution. |
| `Realtime` | Realtime hub clients and connections. |
| `Route` | HTTP, WebSocket, MCP, and view routing. |
| `Schedule` | Scheduled commands and callbacks. |
| `Schema` | Database schema operations. |
| `Session` | Scope-local session state. |
| `Storage` | Configured filesystem disks. |
| `Test` | Framework testing engine. |
| `View` | View factory and rendering. |

Except for `DateTime`, these classes obtain their target from the container. Consult the owning module documentation for the complete proxied contract.

### Types and helpers

- `Collection(items=None)`: fluent selection, mapping, grouping, aggregation, pagination, serialization, and list-like protocols.
- `DotDict(mapping)`: key and attribute access; `export()` recursively restores dictionaries and `copy()` deeply copies mutable contents.
- `StdClass(**kwargs)`: dynamic attributes with reserved method and dunder names rejected; supports `fromDict`, `toDict`, `update`, and `remove`.
- `Stringable(value)`: immutable fluent text wrapper with casing, matching, replacement, encoding, hashing, parsing, truncation, and validation helpers.
- `MISSING`: falsey sentinel whose representation is `<MISSING>`.
- `BaseEntity`: `toDict()` and `getFields()` for dataclass entities.
- `FreezeThaw.freeze()` / `thaw()`: recursive immutable/mutable conversions.
- `PerformanceCounter`: `start`/`stop`, `astart`/`astop`, context-manager APIs, and duration conversions.
- `Workers.setRamPerWorker()` / `calculate()`: process capacity calculation.
- `Parser.exception(error)`: produces an `ExceptionParser`; call `toDict()` for `error_type`, `error_message`, `error_code`, and `stack_trace`.
- `Inspire.random()`: returns a `{"quote": ..., "author": ...}` mapping.
- `Final` and `Singleton`: metaclasses for final and singleton classes.

## Examples

### Measure an operation

```python
from orionis.support.performance import PerformanceCounter

with PerformanceCounter() as counter:
    total = sum(range(100))

assert total == 4950
assert counter.getSeconds() >= 0
assert counter.getMilliseconds() >= 0
```

### Work with dates without bootstrapping the container

```python
from orionis.support.facades import DateTime

instant = DateTime.parse("2026-10-06T12:30:00Z")
later = DateTime.addDays(instant, 2)

assert instant.timezone_name == "UTC"
assert later.to_date_string() == "2026-10-08"
assert DateTime.diffInDays(instant, later) == 2
```

### Call a container-backed facade

```python
from orionis.support.facades import Cache, Log, Storage

# Run after the Orionis application has booted and bound these services.
async def completed_import() -> None:
    Log.info("Import completed")
    await Cache.set("imports:last", "customers.csv", ttl=300)
    await Storage.disk("local").put("imports/customers.txt", b"done")
```



## Date and time API

`DateTime` is usable without the container. The application configures its timezone and locale during boot; read them with `getTimezone()` and `getLocale()`. An omitted `tz` uses that configured zone, except `local()` (the operating system zone) and `naive()` (no zone). Calendar boundaries preserve an explicit `dt` and use `tz` only when they create the current datetime.

`formatLocal()` converts the instant before formatting and applies the configured locale. `isToday()` compares local calendar dates. `diffInDays()` and `diffInHours()` return absolute truncated elapsed-time differences, so a calendar day crossing a daylight-saving transition need not be 24 hours. `fromFormat()` and `formatLocal()` use Pendulum tokens; `Stringable.toDate()` uses Python strptime tokens. Invalid dates, units, locales and zones propagate their validation errors.

```python
from orionis.support.facades import DateTime

instant = DateTime.parse("2026-10-06T12:30:00Z", tz="UTC")
month_start = DateTime.startOfMonth(instant)
deadline = DateTime.add(instant, days=2, hours=3)
assert month_start.to_iso8601_string() == "2026-10-01T00:00:00Z"
assert DateTime.diffInHours(instant, deadline) == 51
assert DateTime.fromFormat("06/10/2026", "DD/MM/YYYY", tz="UTC").day == 6
```

| Signature | Result |
| --- | --- |
| `getTimezone() -> str` | Return the configured timezone. |
| `getLocale() -> str` | Return the configured locale. |
| `getZoneInfo() -> ZoneInfo` | Return the ZoneInfo object for the configured timezone. |
| `now(tz: str \| None=None) -> pendulum.DateTime` | Get the current date and time. |
| `today(tz: str \| None=None) -> pendulum.DateTime` | Return the current date at midnight in the selected timezone. |
| `tomorrow(tz: str \| None=None) -> pendulum.DateTime` | Return tomorrow's date in the specified or default timezone. |
| `yesterday(tz: str \| None=None) -> pendulum.DateTime` | Return the date for yesterday in the specified or default timezone. |
| `parse(date_string: str, tz: str \| None=None, *, strict: bool=True) -> pendulum.DateTime` | Parse a date string and convert it to the configured timezone. |
| `fromFormat(date_string: str, fmt: str, tz: str \| None=None, locale: str \| None=None) -> pendulum.DateTime` | Parse a date string using explicit format tokens. |
| `local(year: int, month: int=1, day: int=1, hour: int=0, minute: int=0, second: int=0, microsecond: int=0) -> pendulum.DateTime` | Create a datetime object in the local system timezone. |
| `naive(year: int, month: int=1, day: int=1, hour: int=0, minute: int=0, second: int=0, microsecond: int=0) -> pendulum.DateTime` | Create a timezone-naive datetime object. |
| `fromTimestamp(timestamp: float, tz: str \| None=None) -> pendulum.DateTime` | Convert a Unix timestamp to a datetime in the configured timezone. |
| `fromDatetime(dt: stdlib_datetime \| pendulum.DateTime, tz: str \| None=None) -> pendulum.DateTime` | Convert a standard datetime object to the configured timezone. |
| `datetime(year: int, month: int=1, day: int=1, hour: int=0, minute: int=0, second: int=0, microsecond: int=0, tz: str \| None=None) -> pendulum.DateTime` | Create a datetime object in the configured timezone. |
| `duration(*, days: float=0, seconds: float=0, microseconds: float=0, milliseconds: float=0, minutes: float=0, hours: float=0, weeks: float=0, years: float=0, months: float=0) -> pendulum.Duration` | Create a Duration instance representing a span of time. |
| `interval(start: pendulum.DateTime, end: pendulum.DateTime, *, absolute: bool=False) -> pendulum.Interval` | Create an Interval instance between two datetimes. |
| `startOf(unit: str, dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the start of the given unit of time (e.g. 'hour', 'decade'). |
| `endOf(unit: str, dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the end of the given unit of time (e.g. 'hour', 'decade'). |
| `startOfDay(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the start of the day (00:00:00). |
| `endOfDay(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the end of the day (23:59:59). |
| `convertToLocal(dt: str \| stdlib_datetime \| pendulum.DateTime) -> pendulum.DateTime` | Convert a date to the configured local timezone. |
| `formatLocal(dt: str \| stdlib_datetime \| pendulum.DateTime \| None=None, format_string: str='YYYY-MM-DD HH:mm:ss') -> str` | Format a date in the configured timezone and locale. |
| `startOfWeek(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the start of the week (Monday 00:00:00). |
| `endOfWeek(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the end of the week (Sunday 23:59:59). |
| `startOfMonth(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the start of the month (first day at 00:00:00). |
| `endOfMonth(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the end of the month (last day at 23:59:59). |
| `startOfYear(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the start of the year (January 1st at 00:00:00). |
| `endOfYear(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Return the end of the year (December 31st at 23:59:59). |
| `addDays(dt: pendulum.DateTime, days: int) -> pendulum.DateTime` | Add days to a given date. |
| `addHours(dt: pendulum.DateTime, hours: int) -> pendulum.DateTime` | Add hours to a given datetime. |
| `addMinutes(dt: pendulum.DateTime, minutes: int) -> pendulum.DateTime` | Add minutes to a given datetime. |
| `diffInDays(dt1: pendulum.DateTime, dt2: pendulum.DateTime) -> int` | Calculate the difference in days between two dates. |
| `diffInHours(dt1: pendulum.DateTime, dt2: pendulum.DateTime) -> int` | Compute the difference in hours between two dates. |
| `isWeekend(dt: pendulum.DateTime \| None=None) -> bool` | Determine if the given date falls on a weekend. |
| `isToday(dt: pendulum.DateTime) -> bool` | Check whether the date is today in the configured timezone. |
| `isFuture(dt: pendulum.DateTime) -> bool` | Determine if the given date is in the future. |
| `isPast(dt: pendulum.DateTime) -> bool` | Determine if the given date is in the past. |
| `isLeapYear(dt: pendulum.DateTime \| None=None) -> bool` | Determine if the year of the given date is a leap year. |
| `isBirthday(dt: pendulum.DateTime, other: pendulum.DateTime \| None=None) -> bool` | Determine if the given date shares month and day with another date. |
| `closest(dt: pendulum.DateTime, *others: pendulum.DateTime) -> pendulum.DateTime` | Return the datetime closest to the given one among the candidates. |
| `farthest(dt: pendulum.DateTime, *others: pendulum.DateTime) -> pendulum.DateTime` | Return the datetime farthest from the given one among the candidates. |
| `add(dt: pendulum.DateTime, *, years: int=0, months: int=0, weeks: int=0, days: int=0, hours: int=0, minutes: int=0, seconds: float=0, microseconds: int=0) -> pendulum.DateTime` | Add a combination of time units to a given date. |
| `subtract(dt: pendulum.DateTime, *, years: int=0, months: int=0, weeks: int=0, days: int=0, hours: int=0, minutes: int=0, seconds: float=0, microseconds: int=0) -> pendulum.DateTime` | Subtract a combination of time units from a given date. |
| `diff(dt1: pendulum.DateTime, dt2: pendulum.DateTime \| None=None, *, absolute: bool=True) -> pendulum.Interval` | Return the full Interval between two dates. |
| `diffForHumans(dt: pendulum.DateTime, other: pendulum.DateTime \| None=None, *, absolute: bool=False, locale: str \| None=None) -> str` | Return a human-readable difference between two dates. |
| `next(dt: pendulum.DateTime, day_of_week: int \| None=None, *, keep_time: bool=False) -> pendulum.DateTime` | Move to the next occurrence of the given day of the week. |
| `previous(dt: pendulum.DateTime, day_of_week: int \| None=None, *, keep_time: bool=False) -> pendulum.DateTime` | Move to the previous occurrence of the given day of the week. |
| `average(dt1: pendulum.DateTime, dt2: pendulum.DateTime \| None=None) -> pendulum.DateTime` | Return the middle datetime between two dates. |
| `firstOf(dt: pendulum.DateTime, unit: str, day_of_week: int \| None=None) -> pendulum.DateTime` | Return the first day of the given unit, optionally on a weekday. |
| `lastOf(dt: pendulum.DateTime, unit: str, day_of_week: int \| None=None) -> pendulum.DateTime` | Return the last day of the given unit, optionally on a weekday. |
| `nthOf(dt: pendulum.DateTime, unit: str, nth: int, day_of_week: int) -> pendulum.DateTime` | Return the n-th occurrence of a weekday within the given unit. |

## Console quotes

`Inspire(quotes=None)` uses the built-in catalog. A custom nonempty list is retained by reference and its entries must provide `quote` and `author`. `random()` returns a quote mapping; `printQuote(console)` prints it through the supplied `Console` and returns `None`. If the retained list later becomes empty, selection uses the fallback quote.

```python
from orionis.console import Console
from orionis.support.inspirational.inspire import Inspire

quotes = Inspire([{"quote": "Keep examples executable.", "author": "Documentation team"}])
assert quotes.random()["author"] == "Documentation team"
quotes.printQuote(Console())
```

## Configuration

Facade targets are configured by their owning modules and resolved from the current Orionis container. `DateTime` receives the application timezone and locale through its internal configuration loader during boot; explicit `tz` arguments override its default for individual operations.

`Workers` defaults to 0.5 GiB per worker. `setRamPerWorker()` changes a class-level process-wide budget. `Inspire` accepts a custom list of mappings with mandatory `quote` and `author` keys. The other helper types require no global configuration.

## Integration with Orionis

Use facades at application boundaries—controllers, commands, jobs, listeners, and providers—where concise access to a configured service is useful. Prefer constructor injection inside reusable domain services when explicit dependencies and isolated tests matter.

The lazy facade package avoids importing all subsystems at startup. Service type stubs keep static completion aligned with the actual manager contracts. `BaseEntity`, `Collection`, and `Stringable` are also used throughout Orionis to provide consistent serialization and fluent value operations.

## Errors and edge cases

- A service-backed facade fails when its binding is unavailable or no required scope is active.
- `DotDict.missing` returns `None`; use membership testing when `None` is a meaningful stored value.
- `StdClass` rejects dunder names and names that collide with its class API.
- `Collection.chunk()` and `forPage()` reject non-positive sizes; callback-based operations require callables.
- `FreezeThaw.freeze()` transforms dictionaries/lists/tuples, retaining existing mapping proxies unchanged. Sequence-only cycles raise `ValueError`; other objects retain identity.
- `PerformanceCounter` rejects reading before a completed measurement and rejects mixing synchronous and asynchronous start/stop methods.
- `Final` rejects inheritance at class creation time. `Singleton` ignores constructor arguments after the first instance exists.
- Invalid time zones and incompatible date inputs raise validation errors from `DateTime`/`pendulum`.
- `Workers.setRamPerWorker()` requires a finite positive value large enough to represent at least one byte.

## Performance and concurrency

Facade imports and root facade exports are lazy and cached. `BaseEntity` caches normalized field metadata per entity class. `ExceptionParser` parses once and returns its cached dictionary on subsequent calls. `DateTime` caches `ZoneInfo` instances until its timezone changes.

`Singleton` serializes first construction with a per-class lock. Its async access method uses the same synchronous constructor, so keep construction short. Recursive construction of the same singleton raises `RuntimeError`; failed construction can be retried. `FreezeThaw` traverses containers iteratively. `Workers` caches CPU count and total RAM at import.

`Collection` and the mutable helpers are not synchronized. Do not mutate one instance concurrently without application-level coordination.

## Compatibility

These utilities require Python 3.14 or newer. Public names use Orionis's camelCase method convention. The facade `.pyi` files provide completion and type checking for the methods available on the underlying services. Date formatting tokens passed to `DateTime.fromFormat()` follow Pendulum conventions, which differ from `datetime.strptime()` tokens.

## Module structure

| Path | Responsibility |
| --- | --- |
| `entities/` | Dataclass-oriented `BaseEntity` serialization and field metadata. |
| `facades/` | Lazy service proxies and their `.pyi` public contracts. |
| `formatter/` | Exception-to-dictionary formatting. |
| `inspirational/` | Quote provider and quote catalog. |
| `patterns/final/` | `Final` metaclass. |
| `patterns/singleton/` | Thread-safe `Singleton` metaclass. |
| `performance/` | Sync/async `PerformanceCounter`. |
| `structures/` | Recursive `FreezeThaw` conversions. |
| `system/` | CPU/RAM-aware worker calculation. |
| `types/` | `Collection`, `DotDict`, `StdClass`, `Stringable`, and `MISSING`. |

## Reference and next steps

[__init__.py](https://github.com/orionis-framework/framework/blob/1e905f4f103d47c61789d877eba472a5bd97681b/orionis/support/facades/__init__.py) · [datetime.py](https://github.com/orionis-framework/framework/blob/1e905f4f103d47c61789d877eba472a5bd97681b/orionis/support/facades/datetime.py) · [counter.py](https://github.com/orionis-framework/framework/blob/1e905f4f103d47c61789d877eba472a5bd97681b/orionis/support/performance/counter.py) · [workers.py](https://github.com/orionis-framework/framework/blob/1e905f4f103d47c61789d877eba472a5bd97681b/orionis/support/system/workers.py)

[Return to the module index](/en/utilities).
