---
title: DateTime
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# DateTime

`DateTime` is a class-level utility that provides a consistent, timezone-aware API for all date and time operations in the framework. It manages a configurable default timezone and locale so that every method — from creating instants to formatting output — produces results in the expected context without requiring you to pass timezone arguments everywhere.

All methods are class methods. There is no need to instantiate `DateTime`; call methods directly on the class.

## Import

```python
from orionis.support.time.datetime import DateTime
```

:::tip[Recommended for all date operations]
Always use the `DateTime` class for any date and time operation in your application. During bootstrapping, the framework reads the `timezone` and `locale` values from your application configuration (`config/app.py`) and applies them automatically to `DateTime`. This means every method — `now()`, `parse()`, `formatLocal()`, and so on — already returns results in the correct timezone without any extra arguments. Using standard-library primitives directly bypasses this configuration and can lead to inconsistent datetime handling across your codebase.
:::

---

## Internal Methods

The class exposes three prefixed methods that are reserved for the framework's internal bootstrap process:

| Method | Effect |
|---|---|
| `_loadConfig(timezone?, locale?)` | Overwrites the default timezone **and** locale for every subsequent call |
| `_setTimezone(name)` | Replaces the default timezone globally |
| `_setLocale(code)` | Replaces the default locale globally |

:::caution[Do not call these methods in application code]
These methods mutate **class-level** state. Invoking them outside the bootstrapping phase changes the timezone or locale for **every** part of the application that relies on `DateTime`, including middleware, background tasks, and scheduled jobs. This can produce silent data inconsistencies — for example, timestamps stored in a database may suddenly shift to an unexpected timezone. The framework calls these methods once during startup; there is no reason to call them manually.
:::

---

## Configuration

### getZoneinfo

Returns a standard-library `ZoneInfo` object for the configured timezone, useful when interfacing with code that expects `zoneinfo` types:

```python
from zoneinfo import ZoneInfo

zi = DateTime.getZoneinfo()   # ZoneInfo(key='Europe/Berlin')
```

---

## Creating Instants

Every instant method accepts an optional `tz` parameter. When omitted, the configured default timezone is used.

### now

Returns the current date and time:

```python
DateTime.now()                        # current moment in default tz
DateTime.now(tz="Asia/Singapore")     # current moment in Singapore
```

### today

Returns today's date at midnight (00:00:00):

```python
DateTime.today()
DateTime.today(tz="Australia/Sydney")
```

### tomorrow / yesterday

Return the date one day ahead or behind, respectively:

```python
DateTime.tomorrow()
DateTime.yesterday(tz="Pacific/Auckland")
```

### datetime

Factory method that creates a specific datetime with individual components. Only `year` is required; all other components default to their minimum:

```python
DateTime.datetime(2024, 6, 15, 10, 30, 45)
# 2024-06-15 10:30:45 in the default timezone

DateTime.datetime(2024, tz="Europe/Madrid")
# 2024-01-01 00:00:00 in Madrid
```

---

## Parsing and Conversion

### parse

Parses an ISO 8601 date string and converts it to the target timezone:

```python
dt = DateTime.parse("2024-06-15T12:00:00+00:00")
# Converted to the default timezone

dt = DateTime.parse("2024-01-01T00:00:00+00:00", tz="Asia/Tokyo")
# Converted to Tokyo
```

### fromTimestamp

Converts a Unix timestamp to a datetime:

```python
dt = DateTime.fromTimestamp(0.0)
# 1970-01-01 00:00:00 UTC

dt = DateTime.fromTimestamp(1718400000, tz="America/Chicago")
```

### fromDatetime

Converts a standard-library `datetime` or an existing `DateTime` instance to the target timezone. Raises `TypeError` for unsupported types:

```python
from datetime import datetime, timezone

# Naive datetime — assumed to be in the configured timezone
dt = DateTime.fromDatetime(datetime(2024, 3, 15, 10, 30))

# Aware datetime — converted to the configured timezone
aware = datetime(2024, 3, 15, 10, 30, tzinfo=timezone.utc)
dt = DateTime.fromDatetime(aware)

# With explicit target timezone
dt = DateTime.fromDatetime(aware, tz="Asia/Seoul")
```

### convertToLocal

Accepts a string, standard-library `datetime`, or `DateTime` instance and converts it to the configured timezone:

```python
dt = DateTime.convertToLocal("2024-06-15T12:00:00+00:00")
dt = DateTime.convertToLocal(datetime(2024, 6, 15, 12, 0, 0))
```

---

## Formatting

### formatLocal

Formats a datetime as a string. Defaults to `YYYY-MM-DD HH:mm:ss`. When no datetime is provided, formats the current moment:

```python
dt = DateTime.datetime(2024, 6, 15, 10, 30, 45, tz="UTC")

DateTime.formatLocal(dt)
# "2024-06-15 10:30:45"

DateTime.formatLocal(dt, format_string="YYYY/MM/DD")
# "2024/06/15"

DateTime.formatLocal()
# current datetime formatted with the default pattern
```

---

## Boundaries

Boundary methods snap a datetime to the start or end of a time period. When called without a `dt` argument, they use the current datetime.

### Day

```python
ref = DateTime.datetime(2024, 6, 12, 14, 30, 45, tz="UTC")

DateTime.startOfDay(ref)   # 2024-06-12 00:00:00
DateTime.endOfDay(ref)     # 2024-06-12 23:59:59

DateTime.startOfDay()      # today at 00:00:00
DateTime.endOfDay()        # today at 23:59:59
```

### Week

Weeks start on Monday and end on Sunday:

```python
DateTime.startOfWeek(ref)   # Monday 00:00:00
DateTime.endOfWeek(ref)     # Sunday 23:59:59
```

### Month

```python
DateTime.startOfMonth(ref)   # 2024-06-01 00:00:00
DateTime.endOfMonth(ref)     # 2024-06-30 23:59:59
```

### Year

```python
DateTime.startOfYear(ref)   # 2024-01-01 00:00:00
DateTime.endOfYear(ref)     # 2024-12-31 23:59:59
```

---

## Arithmetic

Arithmetic methods accept negative values to move backward in time.

### addDays

```python
ref = DateTime.datetime(2024, 1, 1, 12, 0, 0, tz="UTC")

DateTime.addDays(ref, 5)     # 2024-01-06
DateTime.addDays(ref, -3)    # 2023-12-29
```

### addHours

```python
DateTime.addHours(ref, 3)    # 15:00
DateTime.addHours(ref, 14)   # next day 02:00
```

### addMinutes

```python
DateTime.addMinutes(ref, 30)   # 12:30
DateTime.addMinutes(ref, 90)   # 13:30
```

### diffInDays

Returns the absolute day difference between two datetimes:

```python
a = DateTime.datetime(2024, 1, 1, tz="UTC")
b = DateTime.datetime(2024, 1, 11, tz="UTC")

DateTime.diffInDays(a, b)   # 10
```

### diffInHours

Returns the absolute hour difference:

```python
a = DateTime.datetime(2024, 1, 1, 12, 0, 0, tz="UTC")
b = DateTime.addHours(a, 6)

DateTime.diffInHours(a, b)   # 6
```

---

## Predicates

### isWeekend

Returns `True` for Saturday or Sunday. Without arguments, checks the current date:

```python
saturday = DateTime.datetime(2024, 6, 8, tz="UTC")
monday   = DateTime.datetime(2024, 6, 10, tz="UTC")

DateTime.isWeekend(saturday)   # True
DateTime.isWeekend(monday)     # False
DateTime.isWeekend()           # depends on the current day
```

### isToday

```python
DateTime.isToday(DateTime.now())         # True
DateTime.isToday(DateTime.yesterday())   # False
```

### isFuture / isPast

```python
future = DateTime.addDays(DateTime.now(), 100)
past   = DateTime.addDays(DateTime.now(), -100)

DateTime.isFuture(future)   # True
DateTime.isPast(past)        # True
```

---

## Method Reference

| Method | Returns | Description |
|---|---|---|
| `getZoneinfo()` | `ZoneInfo` | Returns a `ZoneInfo` for the current timezone |
| `now(tz?)` | `DateTime` | Current date and time |
| `today(tz?)` | `DateTime` | Today at midnight |
| `tomorrow(tz?)` | `DateTime` | Tomorrow at midnight |
| `yesterday(tz?)` | `DateTime` | Yesterday at midnight |
| `datetime(year, ...)` | `DateTime` | Constructs a specific datetime |
| `parse(string, tz?)` | `DateTime` | Parses a date string |
| `fromTimestamp(ts, tz?)` | `DateTime` | Converts a Unix timestamp |
| `fromDatetime(dt, tz?)` | `DateTime` | Converts a stdlib or framework datetime |
| `convertToLocal(dt)` | `DateTime` | Converts any date input to the configured timezone |
| `formatLocal(dt?, fmt?)` | `str` | Formats a datetime as a string |
| `startOfDay(dt?)` | `DateTime` | Snaps to 00:00:00 of the day |
| `endOfDay(dt?)` | `DateTime` | Snaps to 23:59:59 of the day |
| `startOfWeek(dt?)` | `DateTime` | Monday at 00:00:00 |
| `endOfWeek(dt?)` | `DateTime` | Sunday at 23:59:59 |
| `startOfMonth(dt?)` | `DateTime` | First day at 00:00:00 |
| `endOfMonth(dt?)` | `DateTime` | Last day at 23:59:59 |
| `startOfYear(dt?)` | `DateTime` | January 1st at 00:00:00 |
| `endOfYear(dt?)` | `DateTime` | December 31st at 23:59:59 |
| `addDays(dt, n)` | `DateTime` | Adds n days |
| `addHours(dt, n)` | `DateTime` | Adds n hours |
| `addMinutes(dt, n)` | `DateTime` | Adds n minutes |
| `diffInDays(dt1, dt2)` | `int` | Absolute day difference |
| `diffInHours(dt1, dt2)` | `int` | Absolute hour difference |
| `isWeekend(dt?)` | `bool` | True if Saturday or Sunday |
| `isToday(dt)` | `bool` | True if the date is today |
| `isFuture(dt)` | `bool` | True if after the current moment |
| `isPast(dt)` | `bool` | True if before the current moment |

---

## Working with the Underlying DateTime Instance

Every method that returns a `DateTime` actually returns an enriched datetime object. You can call any method from the underlying library directly on the returned instance, giving you access to the full range of operations beyond what this class exposes:

```python
# Obtain an instance through any DateTime method
dt = DateTime.now()

# Access extended properties
dt.day_of_week        # 0 (Monday) to 6 (Sunday)
dt.day_of_year        # 1–366
dt.week_of_year       # 1–53
dt.days_in_month      # 28–31
dt.timezone_name      # 'America/Bogota'

# Use extended arithmetic
dt.add(months=2, weeks=1)
dt.subtract(years=1)

# Difference helpers
dt.diff(DateTime.yesterday()).in_hours()   # hours between two instants

# Human-readable difference
dt.diff_for_humans()   # e.g. "2 hours ago"

# ISO 8601 output
dt.to_iso8601_string()   # '2024-06-15T10:30:45-05:00'
dt.to_date_string()      # '2024-06-15'
dt.to_time_string()      # '10:30:45'
```

:::tip[Tip]
Combine the convenience of `DateTime` for timezone-aware creation with the full API of the returned instance for advanced formatting, difference calculations, or calendar introspection.
:::
