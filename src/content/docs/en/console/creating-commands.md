---
title: "Create commands and inject services"
description: "Generate a command, understand BaseCommand and receive services through constructors or methods."
editUrl: true
lastUpdated: false
---

A command exposes an operation through a CLI signature, its arguments and a `handle()` method. Use it to coordinate operational tasks; keep reusable logic in services so that HTTP, jobs and other components can also invoke it.

<a id="generator"></a>

## Generate the file

From the project root, use either alternative:

```shell
orionis make:console-command greet --signature app:greet --description "Print a greeting."
```

```shell
python -B reactor make:console-command greet --signature app:greet --description "Print a greeting."
```

`name` is required, as is `--signature` / `-s`. `--description` / `-d` is optional; when omitted, the template receives `A custom console command.`. The generator checks the signature format and whether it is already registered.

By default, it creates `app/console/commands/greet_command.py` with class `GreetCommand`. The location depends on `app_console_commands`; subdirectories such as `reports/export` are supported. Prefer `snake_case` names: `BuildReport` becomes `buildreport_command.py`, whereas `build_report` produces `build_report_command.py`. It adds `Command` and `_command` suffixes when absent, creates directories and does not overwrite existing files. See [all generators](/en/console/built-in-generators).

The template imports `ClassVar`, `Argument` and `BaseCommand`, and declares the signature, description and an empty argument list. Its `async handle(self) -> None` raises `NotImplementedError("Implement the command logic.")`: replace this body before using the command.

## Complete and run the command

This complete module can replace the generated file:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand


class GreetCommand(BaseCommand):
    signature = "app:greet"
    description = "Print a greeting."
    timestamps = False
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="name", type_=str, help="Name to greet."),
        Argument(name_or_flags=("-n", "--times"), type_=int, default=1),
        Argument(name_or_flags="--quiet", action="store_true", default=False),
    ]

    async def handle(self) -> int:
        count = self.getArgument("times")
        if count < 1:
            self.error("--times must be positive", timestamp=False)
            return 2
        if not self.getArgument("quiet"):
            for _ in range(count):
                self.writeLine(f"Hello, {self.getArgument('name')}!")
        return 0
```

```shell
orionis app:greet Ada --times 2
python -B reactor app:greet Ada --quiet
python -B reactor app:greet --help
```

The first invocation prints two greetings. `--times 0` returns `2`; a valid invocation returns `0`. `--quiet` belongs to this example; it is not a framework-wide flag. Each command declares its own options.

<a id="base-command"></a>

## Structure and discovery

Import `BaseCommand` from `orionis.console.base`. It extends `Console` and the `IBaseCommand` contract: inside a command, use `self.writeLine()`, `self.table()`, `self.ask()` and the other [output](/en/console/console-output) and [question](/en/console/interactive-input) methods. For [progress](/en/console/progress), the inherited `self.progressBar` property provides a bar; retain that instance before updating it. You do not need another `Console` instance or a `ProgressBar` import inside a command.

| Member | Type and default | Purpose |
| --- | --- | --- |
| `signature` | `str`, no value in the base class. | Command identity; does not contain argument definitions in braces. |
| `description` | `str`, no value in the base class. | Help text. The loader permits omission and uses `No description provided.`; an explicitly empty description is rejected. |
| `timestamps` | `bool = True`. | Enables executor messages when starting and finishing. Does not configure timestamps on individual `self.info()` calls. |
| `arguments` | `ClassVar[list[Argument]] = []`. | Definitions used to construct the parser. Declare a separate list on each command. |

The loader discovers modules in `app_console_commands` and subclasses of `BaseCommand` **defined in each module**. Importing a class from another file does not register it again. The directory must be importable within the application; there is no central registry to edit for every command.

Class signatures are stripped and validated against `[a-z][a-z0-9]*(?::[a-z][a-z0-9]*(?:-[a-z0-9]+)*)?`. `greet`, `app:greet` and `reports:build-daily` are valid; `my-command`, `reports:daily:build` and `App:Greet` are not. Declare arguments with `Argument`, not inside `signature`.

Sources load in order: native commands, application classes and route registrations. The final registry is a dictionary keyed by signature: a later definition can replace an earlier one. Choose distinct application signatures; the generator rejects those it already knows. See [cache and discovery](/en/console/command-cache) when a change does not appear.

<a id="base-construction"></a>

### Constructor and handle()

```python
def __init__(self) -> None: ...
async def handle(self) -> None: ...
```

The constructor initializes the internal argument dictionary. Call `super().__init__()` when overriding it. The base `handle()` performs no work and raises `NotImplementedError`; your class must replace it. The container can invoke synchronous handlers, but use `async def` when performing async operations.

Return an integer to control the exit code. A successful return of another type, including `None`, is normalized to `0`; Reactor does not return a structured business result. `bool` is an `int` subtype, so returning `True` is not an appropriate way to indicate success: return `0` explicitly.

<a id="dependency-injection"></a>

## Constructor and method injection

Save this module as `app/console/commands/build_report_command.py`:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand
from orionis.storage.contracts.manager import IStorageManager


class ReportBuilder:
    def __init__(self, storage: IStorageManager) -> None:
        self.storage = storage

    async def build(self, report_id: int) -> None:
        await self.storage.disk("local").put(
            f"reports/{report_id}.txt", f"Report {report_id}\n",
        )


class ReportPresenter:
    def format(self, report_id: int) -> str:
        return f"Report {report_id} is ready."


class BuildReportCommand(BaseCommand):
    signature = "reports:build-one"
    description = "Build a report with injected services."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="report_id", type_=int),
    ]

    def __init__(self, builder: ReportBuilder) -> None:
        super().__init__()
        self.builder = builder

    async def handle(self, presenter: ReportPresenter) -> int:
        report_id = self.getArgument("report_id")
        await self.builder.build(report_id)
        self.success(presenter.format(report_id), timestamp=False)
        return 0
```

```shell
orionis reports:build-one 42
python -B reactor reports:build-one 42
```

Reactor constructs the command through `app.build()`, resolving `ReportBuilder` and its `IStorageManager` through constructors. It then invokes `handle()` through `app.call()`, injecting `ReportPresenter`. Concrete classes can resolve without custom bindings; contracts require their provider, such as the native Storage provider. The `local` disk must be configured and writable.

**CLI arguments of a BaseCommand class are not injected as `handle()` parameters**: Reactor assigns them to the instance, where `getArgument()` reads them. [Console route](/en/console/command-routing) handlers that do not extend `BaseCommand` do receive these values by name.

Every Reactor call opens a scope marked as console. Inject the required service instead of retaining objects from a previous HTTP request. A direct Python call to `command.handle()` does not activate automatic resolution.

<a id="command-exceptions"></a>

## Errors and exit codes

Use `try/except` when you can recover or return a business-specific code. Let the exception propagate when the global catcher should record and display it:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand


class ParseCountCommand(BaseCommand):
    signature = "app:parse-count"
    description = "Validate a positive record count."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="value", type_=str),
    ]

    async def handle(self) -> int:
        try:
            count = int(self.getArgument("value"))
        except ValueError:
            self.error("Count must contain decimal digits.", timestamp=False)
            return 2
        if count < 1:
            raise ValueError("Count must be positive.")
        self.writeLine(f"Accepted: {count}")
        return 0
```

```shell
python -B reactor app:parse-count invalid
python -B reactor app:parse-count 0
```

The first invocation returns `2` from the command. The second reaches Reactor's exception flow: it logs, delegates to `ICatch` and returns `1` if that handling completes successfully. Catching an error without returning a nonzero code can make the command appear successful.

For ordinary command completion, return the code from `handle()`; `exitSuccess()` and `exitError()` are [process termination operations](/en/console/console-output) with different effects. Help and parser errors use `SystemExit`; see [programmatic execution](/en/console/reactor-and-injection) before handling them from another component.
