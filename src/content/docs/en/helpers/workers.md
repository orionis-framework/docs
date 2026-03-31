---
title: Workers
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Workers

Orionis includes a resource-aware utility that calculates the maximum number of worker processes your application can safely run in parallel. Instead of relying on a hardcoded value or a simple CPU count, the `Workers` calculator evaluates **both CPU cores and available RAM**, ensuring that neither resource is overcommitted.

This value is used during the application bootstrap to validate the `APP_WORKERS` configuration, and is also available for direct use whenever you need to determine safe parallelism limits — task queues, batch processors, scheduled jobs, etc.

---

## Quick Start

```python
from orionis.services.system.workers import Workers

calculator = Workers()
max_workers = calculator.calculate()

print(f"This machine can safely run up to {max_workers} workers.")
```

---

## How It Works

The calculation follows a simple but effective formula:

```text
workers = min(CPU cores, ⌊ Total RAM (GB) / RAM per worker (GB) ⌋)
```

The result is always an integer. This approach prevents two common deployment problems:

| Problem | Cause | How Workers Prevents It |
|---|---|---|
| CPU saturation | More processes than cores | Caps result at the physical core count |
| Memory exhaustion | Processes competing for RAM | Caps result based on available memory |

---

## Creating an Instance

```python
from orionis.services.system.workers import Workers

# Default: 0.5 GB per worker
calculator = Workers()

# Custom: 2 GB per worker (e.g., ML workloads)
calculator = Workers(ram_per_worker=2.0)
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `ram_per_worker` | `float` | `0.5` | Amount of RAM in gigabytes allocated per worker process. |

The constructor automatically detects the number of CPU cores and total system RAM at instantiation time.

---

## API Reference

### `calculate`

Returns the maximum number of workers that can run safely in parallel.

```python
max_workers = calculator.calculate()
```

| Returns | Type | Description |
|---|---|---|
| Maximum workers | `int` | The lesser of CPU-based and RAM-based limits. |

#### Examples

```python
from orionis.services.system.workers import Workers

# On a machine with 4 cores and 8 GB RAM

# Default (0.5 GB/worker): min(4, floor(8/0.5)) = min(4, 16) = 4
Workers().calculate()  # 4

# Heavy workloads (4 GB/worker): min(4, floor(8/4)) = min(4, 2) = 2
Workers(ram_per_worker=4.0).calculate()  # 2

# Lightweight tasks (0.1 GB/worker): min(4, floor(8/0.1)) = min(4, 80) = 4
Workers(ram_per_worker=0.1).calculate()  # 4
```

### `setRamPerWorker`

Updates the RAM allocation per worker without creating a new instance.

```python
calculator.setRamPerWorker(2.0)
new_max = calculator.calculate()
```

| Parameter | Type | Description |
|---|---|---|
| `ram_per_worker` | `float` | New RAM allocation in GB per worker. |

This is useful when you need to recalculate the limit for different workload profiles within the same process.

---

## Integration with Application Configuration

The primary way most applications interact with worker limits is through the `config/app.py` configuration file and the `APP_WORKERS` environment variable.

### Environment Variable

Set the desired number of workers in your `.env` file:

```ini
APP_WORKERS=4
```

:::tip[Automatic type casting]
Orionis reads `APP_WORKERS` through its environment system, which **automatically casts** the value to `int` — no manual conversion needed. This is part of Orionis' dynamic casting engine, which goes far beyond simple string reading.
:::

### Configuration File

In `config/app.py`, the worker count is declared as a field that reads from the environment:

```python
from orionis.services.environment.env import Env

workers: int = field(
    default_factory=lambda: Env.get("APP_WORKERS", 1),
)
```

If `APP_WORKERS` is not defined, the default is **1 worker**.

### Bootstrap Validation

During application bootstrap, Orionis **automatically validates** that the configured number of workers does not exceed the system's capacity. If you set `APP_WORKERS=16` on a machine that can only handle 4 workers, the framework raises a `ValueError`:

```
ValueError: The 'workers' attribute must be between 1 and 4.
```

This validation uses `Workers().calculate()` internally to determine the safe upper bound, protecting you from accidental resource overcommitment in production.

---

## Practical Use Cases

### Scaling a Task Queue

```python
from orionis.services.system.workers import Workers

calculator = Workers(ram_per_worker=1.0)
pool_size = calculator.calculate()

# Use pool_size to configure your task queue concurrency
```

### Conditional Resource Allocation

```python
from orionis.services.system.workers import Workers

calculator = Workers()

# Light tasks
calculator.setRamPerWorker(0.25)
light_workers = calculator.calculate()

# Heavy tasks
calculator.setRamPerWorker(4.0)
heavy_workers = calculator.calculate()

print(f"Light pool: {light_workers}, Heavy pool: {heavy_workers}")
```

### Environment-Aware Deployment

Combine `Workers` with environment detection to adapt automatically:

```python
from orionis.services.system.workers import Workers
from orionis.services.environment.env import Env

env = Env.get("APP_ENV", "development")

ram_allocation = 0.25 if env == "development" else 1.0
max_workers = Workers(ram_per_worker=ram_allocation).calculate()
```
