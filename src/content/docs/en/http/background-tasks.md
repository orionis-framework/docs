---
title: Background Tasks
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Background Tasks

The `BackgroundTask` and `BackgroundTasks` classes provide a simple mechanism for deferring work that should run **after** a response has been sent to the client. Typical use cases include sending emails, writing audit logs, pushing analytics events, or any operation that doesn't need to block the response.

Both synchronous and asynchronous callables are supported. Synchronous functions are automatically offloaded to a thread-pool executor so they never block the event loop.

## Import

```python
from orionis.support.background.task import BackgroundTask
from orionis.support.background.tasks import BackgroundTasks
```

---

## BackgroundTask

`BackgroundTask` wraps a single callable — sync or async — together with its arguments. When awaited, it executes the callable with the captured arguments.

### Creating a Task

Pass the callable and its arguments to the constructor:

```python
# Synchronous function
def send_email(to: str, subject: str):
    ...

task = BackgroundTask(send_email, "user@example.com", subject="Welcome")

# Asynchronous function
async def notify(channel: str, message: str):
    ...

task = BackgroundTask(notify, "general", message="Deployed!")
```

### Executing a Task

Await the task instance directly or call its `run()` method — both are equivalent:

```python
await task()
# or
await task.run()
```

- **Async callables** are awaited directly.
- **Sync callables** are executed in a thread-pool executor via `loop.run_in_executor`, ensuring they don't block the event loop.

### Practical Example

```python
from orionis.support.background.task import BackgroundTask

results = []

def log_access(path: str):
    results.append(f"accessed {path}")

task = BackgroundTask(log_access, "/api/users")
await task()
# results == ["accessed /api/users"]
```

---

## BackgroundTasks

`BackgroundTasks` manages an ordered collection of tasks and executes them **sequentially** when invoked. It extends `BackgroundTask`, so it can be used anywhere a single task is expected.

### Creating the Collection

Create an empty collection, or pass existing `BackgroundTask` instances:

```python
# Empty — add tasks later
tasks = BackgroundTasks()

# Pre-populated
tasks = BackgroundTasks([
    BackgroundTask(send_email, "a@example.com", subject="Hi"),
    BackgroundTask(send_email, "b@example.com", subject="Hi"),
])
```

### Adding Tasks

Use `addTask` to append a new task. It accepts the same signature as the `BackgroundTask` constructor — a callable followed by its arguments:

```python
tasks = BackgroundTasks()

tasks.addTask(send_email, "user@example.com", subject="Welcome")
tasks.addTask(notify, "general", message="New signup")
tasks.addTask(lambda: print("done"))
```

You can continue adding tasks after initialization, including to a pre-populated collection:

```python
tasks = BackgroundTasks([BackgroundTask(send_email, "a@example.com")])
tasks.addTask(send_email, "b@example.com")
```

### Executing All Tasks

Await the collection or call `run()` — both execute every task in insertion order:

```python
await tasks()
# or
await tasks.run()
```

Tasks run one at a time in the order they were added. Both sync and async callables can be mixed freely within the same collection.

### Practical Example

```python
from orionis.support.background.task import BackgroundTask
from orionis.support.background.tasks import BackgroundTasks

results = []

async def audit(action: str):
    results.append(action)

def log(message: str):
    results.append(message)

tasks = BackgroundTasks()
tasks.addTask(audit, "user.created")
tasks.addTask(log, "email.sent")
tasks.addTask(audit, "webhook.fired")

await tasks()
# results == ["user.created", "email.sent", "webhook.fired"]
```

---

## Sync vs Async Handling

The execution strategy is chosen automatically based on the callable type:

| Callable type | Execution method |
|---|---|
| `async def` (coroutine function) | Awaited directly |
| Regular `def` / `lambda` | Offloaded to `run_in_executor` (thread pool) |

This is transparent to the caller — you always `await` the task regardless of whether the underlying function is sync or async.

---

## Method Reference

### BackgroundTask

| Method | Signature | Description |
|---|---|---|
| `__init__` | `BackgroundTask(func, *args, **kwargs)` | Wraps a callable with its arguments |
| `__call__` | `await task()` | Executes the callable |
| `run` | `await task.run()` | Alias for `__call__` |

### BackgroundTasks

| Method | Signature | Description |
|---|---|---|
| `__init__` | `BackgroundTasks(tasks?)` | Creates the collection, optionally pre-populated |
| `addTask` | `addTask(func, *args, **kwargs)` | Appends a new task to the collection |
| `__call__` | `await tasks()` | Executes all tasks sequentially |
| `run` | `await tasks.run()` | Alias for `__call__` |
