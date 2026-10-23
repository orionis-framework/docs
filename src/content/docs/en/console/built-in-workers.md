---
title: "Worker and scheduler commands"
description: "Queue, scheduler and local MCP server command reference: flags, outcomes and errors."
editUrl: true
lastUpdated: false
---

`queue:work`, `schedule:work` and `mcp:start` are distinct consumer/service processes. Other commands inspect or change their records. Run each from the project root using `orionis` or the local `reactor` file.

Every signature supports `-h` / `--help`. Retry/persistence policies belong to Queues or the scheduler; do not infer flags from other worker systems.

<a id="command-mcp-list"></a>

## mcp:list

List HTTP and local MCP servers.

Takes no arguments or command-specific options; automatic help remains available.

Read `IMcpManager.servers()` and display transport, endpoint/handle and server class. An empty registry produces an informational message. It neither starts servers nor takes filters.

```shell
orionis mcp:list
python -B reactor mcp:list
```

<a id="command-mcp-start"></a>

## mcp:start

Start a local MCP server over STDIO.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

`name` is a required local MCP handle, not a URL or class. Check it exists and execute `IMcpManager.startLocal(name)`. A missing/invalid handle returns `1`; normal completion returns `0`. STDIN/STDOUT carry the protocol while startup/command/shutdown diagnostics are redirected to STDERR. This does not start HTTP and has no `--host`, `--port` or `--transport`. See the MCP guide for handle registration and the implemented protocol revision.

```shell
orionis mcp:start catalog
python -B reactor mcp:start catalog
```

<a id="command-queue-clear"></a>

## queue:clear

Clear a queue, including delayed or reserved jobs.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `connection` | str, optional | Default connection | Queue connection name. |
| `--queue` | str, optional | `default` | Queue name; queue:work accepts comma-separated names. |

`connection` is optional (`None`: default). `--queue` is a string with the literal default `default`, even if the connection configures another queue name; it does not take a comma-separated list. Remove ready, delayed and reserved jobs and display the count. There is no confirmation or `--force`; failure records are retained and side effects of an already running `handle()` cannot be undone. Return `0`, or `1` on `QueueError`.

```shell
orionis queue:clear database --queue reports
python -B reactor queue:clear database --queue reports
```

<a id="command-queue-failed"></a>

## queue:failed

List terminally failed jobs.

Takes no arguments or command-specific options; automatic help remains available.

Take no connection, pagination or flags. Read the SQL failure repository configured in `queue.failed`, including when jobs use Redis or sync. Display failure-record ID, job ID, connection/queue, attempts and exception. Use the first ID with retry/forget. Return `0` on successful querying or `1` on `QueueError`.

```shell
orionis queue:failed
python -B reactor queue:failed
```

<a id="command-queue-forget"></a>

## queue:forget

Remove a failure record.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `id` | str, required | — | Failure-record ID, rather than the job ID. |

`id` is a required positional string identifying a failure record. It neither retries the job nor deletes active queue work. Return `0` on deletion or `1` if absent or a `QueueError` occurs.

```shell
orionis queue:forget 866a127d-3185-4e5c-b21c-65eef9cd78a8
python -B reactor queue:forget 866a127d-3185-4e5c-b21c-65eef9cd78a8
```

<a id="command-queue-retry"></a>

## queue:retry

Requeue one identified failed job.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `id` | str, required | — | Failure-record ID, rather than the job ID. |

`id` is the required failure-record identifier displayed by `queue:failed`. Push the original envelope to its original connection/queue, preserve the job ID, then remove the failure record. An expired `retryUntil()` or absent failure returns `1` through `QueueError`. There is no `all`, `--all` or connection selector. Push and failure deletion are separate steps; see Queues for atomicity limits.

```shell
orionis queue:retry 866a127d-3185-4e5c-b21c-65eef9cd78a8
python -B reactor queue:retry 866a127d-3185-4e5c-b21c-65eef9cd78a8
```

<a id="command-queue-work"></a>

## queue:work

Consume persisted jobs from a queue connection.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `connection` | str, optional | Default connection | Queue connection name. |
| `--queue` | str, optional | Connection queue | Queue name; queue:work accepts comma-separated names. |
| `--concurrency` | int, optional | `queue.worker.concurrency` | Concurrent consumers; positive integer. |
| `--max-jobs` | int, optional | Unlimited | Maximum reserved attempts; positive integer. |
| `--stop-when-empty` | Flag, optional | `False` | Stop when polling finds no ready work. |

`connection` is an optional positional string (`None`: default connection). `--queue` takes comma-separated names, trimming surrounding whitespace and preserving priority order. Omission uses the connection's configured queue. `--concurrency` is an optional positive integer (default `queue.worker.concurrency`); `--max-jobs` limits reserved attempts using a positive integer, with no limit when omitted. Enable `--stop-when-empty` (default `False`) to stop when no work is ready at polling time: delayed or reserved jobs may remain.

The `sync` connection cannot create workers. Signal handlers request graceful shutdown. Successful completion prints the attempt count and returns `0`; `QueueError` returns `1`. This command has no `--tries`, `--timeout`, `--backoff`, `--sleep` or `--retry-after` options: these come from configuration and job policy.

```shell
orionis queue:work database --queue critical,default --concurrency 2 --max-jobs 100 --stop-when-empty
python -B reactor queue:work database --queue critical,default --concurrency 2 --max-jobs 100 --stop-when-empty
```

<a id="command-schedule-list"></a>

## schedule:list

Inspect tasks defined by the scheduler.

Takes no arguments or command-specific options; automatic help remains available.

Resolve `app.getScheduler()` and `ISchedule`, then invoke `tasks(schedule=...)` through the container before reading `info()`. Display signature, arguments, purpose, random delay, coalescing, maximum instances, misfire grace and dates. It does not call the service's `boot()` or process tasks. The application's `tasks()` method is evaluated, so keep it focused on schedule declarations.

```shell
orionis schedule:list
python -B reactor schedule:list
```

<a id="command-schedule-work"></a>

## schedule:work

Start the scheduler process.

Takes no arguments or command-specific options; automatic help remains available.

Load the registered scheduler, require a callable `tasks()`, register tasks and `onStarted`, `onPaused`, `onResumed` / `onShutdown` listeners, run `ISchedule.boot()` and await `wait()`. This is a persistent process rather than one tick or a command to launch every minute. There are no `--once`, `--queue` or driver flags: task configuration selects persistence.

After startup, `KeyboardInterrupt` or cancellation triggers `shutdown()` followed by a wait for closure. Recognized connection, persistence and filesystem errors are displayed with status `1`; other exceptions propagate. The scheduler guide covers scheduled-job exceptions and listeners.

```shell
orionis schedule:work
python -B reactor schedule:work
```

See [Queue workers](/en/queues/workers), [Retries and failures](/en/queues/failures-and-retries), [Task scheduling](/en/console/task-scheduling) and [MCP](/en/mcp) to configure services and components.
