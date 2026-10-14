---
title: "Console and task scheduling"
description: "Run application commands from the generated project root so uv run uses its .venv and Reactor loads bootstrap.app. Start with:"
editUrl: true
lastUpdated: false
---

Run application commands from the generated project root so `uv run` uses its `.venv` and Reactor loads `bootstrap.app`. Start with:

```shell
uv run python -B reactor list
uv run python -B reactor app:greet --help
```

The first command lists the available commands. The second assumes you have created the [greeting command](/en/console/commands-and-arguments). Application commands use Reactor; project creation uses the separate `orionis-installer` distribution. If a global executable named `orionis` belongs to the installer, it will not dispatch your application's commands.

The console provides application commands, validated arguments, terminal output, and an APScheduler 3 scheduler. The same commands can run through the CLI, the `Reactor` facade, or scheduled tasks.

1. [Create commands and arguments](/en/console/commands-and-arguments): discovery, parsing, dependencies, and exit codes.
2. [Output and programmatic execution](/en/console/output-and-programmatic-execution): prompts, tables, progress, and calls from services.
3. [Schedule tasks](/en/console/task-scheduling): triggers, timezone, stores, listeners, and operation.
4. [Built-in commands](/en/console/built-in-commands): generators, data operations, maintenance, and workers.

Run `uv run python -B reactor list` from the application root to inspect its actual registry. The framework's project-local entry point, for example `uv run orionis list`, imports `bootstrap.app` from the current directory and accepts the same arguments without requiring a local `reactor` file. Both application entry points need a valid project. Python 3.14+, Rich 15, and APScheduler `>=3.11.3,<4.0` are declared dependencies.

The scheduler executes commands, while [Queues](/en/asynchronous/queues) processes serialized jobs with reservations and retries. They serve different purposes and can work together.
