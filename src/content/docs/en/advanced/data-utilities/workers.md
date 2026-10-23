---
title: "Workers"
description: "Estimate a process count from CPU, total memory and a per-worker RAM budget."
editUrl: true
lastUpdated: false
---

`Workers` estimates a process count using the CPU available to the process and total memory detected when its module is imported. It provides a starting point for concurrency settings; it does not create workers, execute jobs or supervise processes.

## Import and direct use

```python
from orionis.support.system import Workers

recommended = Workers.calculate()
assert isinstance(recommended, int)
assert recommended >= 1
```

Importing from `orionis.support.system.workers` is also supported. Both public methods are class methods, so no instance is needed.

## Memory budget

<a id="workers-method-setramperworker"></a>

### `setRamPerWorker`

```python
@classmethod
def setRamPerWorker(cls, ram_per_worker: float) -> None: ...
```

`ram_per_worker` is required. It specifies the memory budget per process. Although the source describes it as GB, conversion uses `1024 ** 3` bytes: the effective unit is **GiB**. The default is **0.5 GiB**. The budget is converted to an integer number of bytes.

The method returns `None` and changes the class setting used by subsequent `calculate()` calls. All consumers of that same class within the process share the change; creating another instance does not isolate it.

```python
from orionis.support.system import Workers

# Budget 1 GiB per process before calculating the recommendation.
Workers.setRamPerWorker(1.0)
recommended = Workers.calculate()
assert recommended >= 1

# Restore the helper's default budget.
Workers.setRamPerWorker(0.5)
```

It raises `ValueError` when the number is not finite, not positive, or represents less than one byte after conversion. Non-numeric inputs may raise `TypeError`; strings such as `"0.5"` are not converted.

```python
from orionis.support.system import Workers

for invalid in (0, -1, float("inf"), float("nan"), 1e-12):
    try:
        Workers.setRamPerWorker(invalid)
    except ValueError:
        pass
    else:
        raise AssertionError("The budget should have been rejected")
```

## Calculation and limits

<a id="workers-method-calculate"></a>

### `calculate`

```python
@classmethod
def calculate(cls) -> int: ...
```

Takes no arguments and returns an integer of at least one. Its calculation is equivalent to:

```text
CPU = process_cpu_count() or cpu_count() or 1
RAM = total memory detected when the module was imported
budget_bytes = int(budget_GiB * 1024 ** 3)
recommendation = min(CPU, RAM // budget_bytes) or 1
```

CPU and RAM are cached at module import. Updating the budget does not query hardware again. Memory is the total reported by the system, not current free memory. The helper also performs no additional container quota adjustment.

The minimum of one applies even when estimated memory cannot accommodate one worker. The result is therefore a **capacity heuristic**, not a guarantee that a workload will fit in memory. Compare it with your application's measured consumption and execution environment limits.

A subclass can keep a separate budget without changing `Workers`; it still uses the module's cached CPU and RAM measurements:

```python
from orionis.support.system import Workers

class ImportWorkers(Workers):
    __slots__ = ()

ImportWorkers.setRamPerWorker(1.5)
import_processes = ImportWorkers.calculate()
general_processes = Workers.calculate()
assert import_processes >= 1
assert general_processes >= 1
```

## Dependency injection

The concrete `Workers` class requires no constructor arguments and can be resolved by the container. For example, in a controller:

```python
from orionis.http import JSONResponse
from orionis.support.system import Workers

class CapacityController:
    async def __call__(self, workers: Workers) -> JSONResponse:
        return JSONResponse({"recommended_workers": workers.calculate()})
```

Injection makes the dependency explicit, but its methods still use class-level configuration. Direct access is usually sufficient for this helper with no instance state.

If your service depends on `IWorkers`, explicitly register the contract in a [provider](/en/architecture/service-container/providers-and-facades):

```python
from orionis.container.providers import ServiceProvider
from orionis.support.system import Workers
from orionis.support.system.contracts.workers import IWorkers

class CapacityProvider(ServiceProvider):
    def register(self) -> None:
        self.app.transient(IWorkers, Workers)
```

This binding belongs to your application; the module includes no provider that registers it automatically. Register the provider through `app.withProviders(CapacityProvider)` in `bootstrap/app.py` before requesting `IWorkers`.

The recommendation does not configure HTTP server or [queue](/en/asynchronous/queues) workers by itself. Use the result wherever the relevant component's API accepts a process count.
