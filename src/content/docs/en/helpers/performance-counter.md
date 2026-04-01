---
title: PerformanceCounter
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# PerformanceCounter

`PerformanceCounter` is a high-resolution timer for measuring code execution time. It wraps Python's `time.perf_counter` (sync) and the event loop clock (async) behind a clean, fluent API. Every method returns the instance itself, enabling method chaining, and the class doubles as both a synchronous and asynchronous context manager.

Use it to benchmark functions, profile critical paths, or collect timing telemetry anywhere in your application.

## Import

```python
from orionis.support.performance.counter import PerformanceCounter
```

---

## Synchronous Usage

### Start and Stop

Call `start()` to begin a measurement and `stop()` to end it. Then read the result with any of the unit-conversion methods:

```python
counter = PerformanceCounter()

counter.start()
# ... code to measure ...
counter.stop()

counter.elapsedTime()      # seconds (float)
counter.getMilliseconds()  # milliseconds
counter.getMicroseconds()  # microseconds
counter.getSeconds()       # seconds (alias)
counter.getMinutes()       # minutes
```

All methods return `self`, so calls can be chained:

```python
elapsed = PerformanceCounter().start().stop().elapsedTime()
```

### Context Manager

The simplest way to measure a block of code is the `with` statement. The counter starts on entry and stops on exit — even if an exception is raised inside the block:

```python
with PerformanceCounter() as counter:
    # ... code to measure ...

print(counter.getMilliseconds(), "ms")
```

### Restart

`restart()` resets all internal state and immediately starts a new measurement, without creating a new instance:

```python
counter = PerformanceCounter()

counter.start()
# ... first operation ...
counter.stop()
first = counter.getMilliseconds()

counter.restart()
# ... second operation ...
counter.stop()
second = counter.getMilliseconds()
```

---

## Asynchronous Usage

Every synchronous method has an async counterpart prefixed with `a`. The async variants use the event loop's high-resolution clock instead of `time.perf_counter`.

### Async Start and Stop

```python
counter = PerformanceCounter()

await counter.astart()
# ... async code to measure ...
await counter.astop()

await counter.aelapsedTime()      # seconds
await counter.agetMilliseconds()  # milliseconds
await counter.agetMicroseconds()  # microseconds
await counter.agetSeconds()       # seconds
await counter.agetMinutes()       # minutes
```

### Async Context Manager

```python
async with PerformanceCounter() as counter:
    await some_async_operation()

print(counter.getMilliseconds(), "ms")
```

The counter stops automatically on exit, including when an exception propagates.

### Async Restart

```python
counter = PerformanceCounter()

await counter.astart()
await counter.astop()
first = counter.getMilliseconds()

await counter.arestart()
await counter.astop()
second = counter.getMilliseconds()
```

---

## Mode Safety

Synchronous and asynchronous modes **cannot be mixed** within a single measurement cycle. The counter tracks which mode was used to start and enforces consistency:

| Started with | Stopped with | Result |
|---|---|---|
| `start()` | `stop()` | Works |
| `astart()` | `astop()` | Works |
| `start()` | `astop()` | `RuntimeError` |
| `astart()` | `stop()` | `RuntimeError` |

Calling `elapsedTime()` (or any unit method) before completing a start/stop cycle raises `ValueError`.

---

## Unit Conversions

All conversion methods read the same elapsed measurement and apply a constant factor:

| Method | Unit | Formula |
|---|---|---|
| `elapsedTime()` / `getSeconds()` | Seconds | raw value |
| `getMilliseconds()` | Milliseconds | `elapsed × 1,000` |
| `getMicroseconds()` | Microseconds | `elapsed × 1,000,000` |
| `getMinutes()` | Minutes | `elapsed ÷ 60` |

The async counterparts (`aelapsedTime`, `agetMilliseconds`, etc.) return the same values.

---

## Method Reference

| Method | Async variant | Returns | Description |
|---|---|---|---|
| `start()` | `astart()` | `self` | Begins a new measurement |
| `stop()` | `astop()` | `self` | Ends the measurement and records elapsed time |
| `restart()` | `arestart()` | `self` | Resets state and starts a new measurement |
| `elapsedTime()` | `aelapsedTime()` | `float` | Elapsed time in seconds |
| `getSeconds()` | `agetSeconds()` | `float` | Elapsed time in seconds (alias) |
| `getMilliseconds()` | `agetMilliseconds()` | `float` | Elapsed time in milliseconds |
| `getMicroseconds()` | `agetMicroseconds()` | `float` | Elapsed time in microseconds |
| `getMinutes()` | `agetMinutes()` | `float` | Elapsed time in minutes |
