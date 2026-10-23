---
title: "PerformanceCounter"
description: "Measure synchronous and asynchronous intervals with contexts, unit conversion and dependency injection."
editUrl: true
lastUpdated: false
---

`PerformanceCounter` measures elapsed time between a start and a stop using `time.perf_counter()`. Use it to measure a query, transformation or service operation. It measures elapsed duration, including waits; it does not represent CPU time alone.

## Construct and measure

<a id="performancecounter-method-init"></a>

```python
from orionis.support.performance import PerformanceCounter

counter = PerformanceCounter()
counter.start()
total = sum(range(100))
counter.stop()

assert total == 4950
assert counter.getMilliseconds() >= 0
```

`__init__(self) -> None` takes no configuration. Each instance stores a start, a result and the measurement mode. Importing the class from `orionis.support.performance.counter` is also supported. Direct use does not require booting an application.

## Start, stop and restart

All these methods take no additional arguments and return **the same instance** for chaining. The following signatures preserve implementation names and return types.

<a id="performancecounter-method-start"></a>
<a id="performancecounter-method-stop"></a>
<a id="performancecounter-method-restart"></a>

### Synchronous measurement

```python
def start(self) -> PerformanceCounter: ...
def stop(self) -> PerformanceCounter: ...
def restart(self) -> PerformanceCounter: ...
```

`start()` records a new start in synchronous mode and clears the previous result. `stop()` calculates the difference from that start. `restart()` discards the previous measurement and starts another in synchronous mode; it also works on an instance that has never been started.

```python
from orionis.support.performance import PerformanceCounter

counter = PerformanceCounter().start()
first_total = sum(range(100))
assert counter.stop() is counter
first_seconds = counter.elapsedTime()

assert counter.restart() is counter
second_total = sum(range(200))
counter.stop()
assert first_total == 4950 and second_total == 19900
assert first_seconds >= 0 and counter.elapsedTime() >= 0
```

`stop()` before starting raises `ValueError`. After `astart()` or `arestart()`, it raises `RuntimeError`: use `astop()` instead. Calling `stop()` again recalculates the difference from the same start; it does not freeze the first result. Start again for a separate measurement.

<a id="performancecounter-method-astart"></a>
<a id="performancecounter-method-astop"></a>
<a id="performancecounter-method-arestart"></a>

### Asynchronous measurement

```python
async def astart(self) -> PerformanceCounter: ...
async def astop(self) -> PerformanceCounter: ...
async def arestart(self) -> PerformanceCounter: ...
```

Use these with `await`. `astart()` records the start and clears the previous result in asynchronous mode. `astop()` stores the duration; `arestart()` discards the previous interval and starts another in that mode. These methods perform no I/O: their asynchronous signatures allow integration with asynchronous flows.

```python
from orionis.http import JSONResponse
from orionis.support.performance import PerformanceCounter

class MeasurementController:
    async def __call__(self) -> JSONResponse:
        counter = PerformanceCounter()
        await counter.astart()
        first_total = sum(range(100))
        await counter.astop()
        first_seconds = await counter.aelapsedTime()

        await counter.arestart()
        second_total = sum(range(200))
        await counter.astop()
        return JSONResponse({
            "totals": [first_total, second_total],
            "first_seconds": first_seconds,
            "second_seconds": await counter.agetSeconds(),
        })
```

On a new instance, or after a synchronous start, `astop()` raises `RuntimeError` because the mode is not asynchronous. Keep the `start()/stop()` and `astart()/astop()` pairs consistent. A new start or restart can explicitly switch modes.

## Read results and convert units

The ten readers take no arguments and return a `float`. All require an interval that has **started and stopped**: before stopping, or after restarting without stopping again, they raise `ValueError`. They cannot read an ongoing measurement.

<a id="performancecounter-method-elapsedtime"></a>
<a id="performancecounter-method-getmicroseconds"></a>
<a id="performancecounter-method-getmilliseconds"></a>
<a id="performancecounter-method-getseconds"></a>
<a id="performancecounter-method-getminutes"></a>

### Synchronous readers

```python
def elapsedTime(self) -> float: ...
def getMicroseconds(self) -> float: ...
def getMilliseconds(self) -> float: ...
def getSeconds(self) -> float: ...
def getMinutes(self) -> float: ...
```

| Method | Result from the stored interval |
| --- | --- |
| `elapsedTime()` | Seconds, without conversion. |
| `getMicroseconds()` | Seconds multiplied by `1_000_000`. |
| `getMilliseconds()` | Seconds multiplied by `1_000`. |
| `getSeconds()` | Seconds, equal to `elapsedTime()`. |
| `getMinutes()` | Seconds divided by `60`. |

```python
from orionis.support.performance import PerformanceCounter

with PerformanceCounter() as counter:
    result = sum(range(100))

seconds = counter.elapsedTime()
assert counter.getSeconds() == seconds
assert counter.getMicroseconds() == seconds * 1_000_000
assert counter.getMilliseconds() == seconds * 1_000
assert counter.getMinutes() == seconds / 60
```

<a id="performancecounter-method-aelapsedtime"></a>
<a id="performancecounter-method-agetmicroseconds"></a>
<a id="performancecounter-method-agetmilliseconds"></a>
<a id="performancecounter-method-agetseconds"></a>
<a id="performancecounter-method-agetminutes"></a>

### Asynchronous readers

```python
async def aelapsedTime(self) -> float: ...
async def agetMicroseconds(self) -> float: ...
async def agetMilliseconds(self) -> float: ...
async def agetSeconds(self) -> float: ...
async def agetMinutes(self) -> float: ...
```

They use the same units and conversions as their synchronous counterparts. Await each result. The mode restricts the start/stop pair, not the readers: a stopped measurement can be read with either family.

```python
from orionis.http import JSONResponse
from orionis.support.performance import PerformanceCounter

class TimingController:
    async def __call__(self) -> JSONResponse:
        async with PerformanceCounter() as counter:
            total = sum(range(100))

        return JSONResponse({
            "total": total,
            "elapsed": await counter.aelapsedTime(),
            "microseconds": await counter.agetMicroseconds(),
            "milliseconds": await counter.agetMilliseconds(),
            "seconds": await counter.agetSeconds(),
            "minutes": await counter.agetMinutes(),
        })
```

## Context managers

<a id="performancecounter-method-enter"></a>
<a id="performancecounter-method-exit"></a>
<a id="performancecounter-method-aenter"></a>
<a id="performancecounter-method-aexit"></a>

```python
def __enter__(self) -> Self: ...
def __exit__(
    self,
    exc_type: type[BaseException] | None,
    exc_val: BaseException | None,
    exc_tb: TracebackType | None,
) -> None: ...
async def __aenter__(self) -> Self: ...
async def __aexit__(
    self,
    exc_type: type[BaseException] | None,
    exc_val: BaseException | None,
    exc_tb: TracebackType | None,
) -> None: ...
```

`with` calls `start()` on entry and `stop()` on exit. `async with` awaits `astart()` and `astop()`. Both entry methods return the same instance. Python supplies the exception type, value and traceback to the exit methods, or three `None` values for normal completion; you do not need to invoke them manually.

The exit methods return `None`: they **do not suppress exceptions**. The duration is recorded on exit even if the block fails, provided its mode was not changed inside the context.

```python
from orionis.support.performance import PerformanceCounter

counter = PerformanceCounter()
try:
    with counter:
        raise ValueError("Invalid import")
except ValueError:
    assert counter.getSeconds() >= 0
```

Use one instance per measurement. Nested contexts or concurrent measurements sharing one counter overwrite its start and result.

## Dependency injection

The container can construct the concrete class without arguments and inject it into a constructor or action. This controller receives the dependency through its constructor and uses an asynchronous context:

```python
from orionis.http import JSONResponse
from orionis.support.performance import PerformanceCounter

class ReportController:
    def __init__(self, counter: PerformanceCounter) -> None:
        self.counter = counter

    async def __call__(self) -> JSONResponse:
        async with self.counter:
            total = sum(range(100))
        return JSONResponse({
            "total": total,
            "duration_ms": self.counter.getMilliseconds(),
        })
```

To depend on `IPerformanceCounter`, explicitly declare your binding:

```python
from orionis.container.providers import ServiceProvider
from orionis.support.performance import PerformanceCounter
from orionis.support.performance.contracts.counter import IPerformanceCounter

class TimingProvider(ServiceProvider):
    def register(self) -> None:
        self.app.transient(IPerformanceCounter, PerformanceCounter)
```

Register `TimingProvider` with `app.withProviders(TimingProvider)` in `bootstrap/app.py`; you can then annotate the dependency with `IPerformanceCounter`. There is no automatic native binding for that contract. A transient lifetime avoids sharing measurement state between distinct consumers. A single instance still cannot support simultaneous measurements.

See [injection and lifetimes](/en/architecture/service-container/bindings-and-invocation) to register alternative implementations. The counter does not print results, persist metrics or aggregate samples; use its return values to implement that behavior in your application.
