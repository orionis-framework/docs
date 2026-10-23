---
title: "Console route commands"
description: "Register class and method handlers in routes/console.py with arguments and dependency injection."
editUrl: true
lastUpdated: false
---

A console route registers a CLI signature through `Reactor.command()`. It exposes a class and method without extending `BaseCommand`. It is not an HTTP route or a URL endpoint: it runs through the same CLI and uses the same exit codes as class commands.

<a id="console-routes"></a>

## Where to register routes

The distributed application includes this in `bootstrap/app.py`:

```python
app.withRouting(console="routes/console.py")
```

This fragment replaces only the `console` argument of your complete configuration. A list of files is also accepted:

```python
app.withRouting(console=["routes/console.py", "routes/reports.py"])
```

Create these files inside the project and configure them before `app.create()`. The loader imports their modules when constructing the command registry. Do not perform business I/O at module level: declare the operation there and perform it inside the handler. A valid metadata cache can skip route imports for command registration.

<a id="fluent-construction"></a>

## Register an invokable class

Save this module as `routes/console.py`:

```python
from orionis.console import Argument, Console
from orionis.support.facades import Reactor


class GreetHandler:
    async def __call__(self, name: str, console: Console) -> int:
        console.writeLine(f"Hello, {name}!")
        return 0


Reactor.command("app:greet-route", GreetHandler).description(
    "Greet through a console route."
).arguments([
    Argument(name_or_flags="name", type_=str),
]).timestamp(enabled=False)
```

```shell
orionis app:greet-route Ada
python -B reactor app:greet-route Ada
```

Passing the class directly selects `__call__`. Although the service annotation mentions `str`, **the current validation does not support an import string as a handler**: use an actual class reference. A free function is not supported as a direct substitute for this class-and-method contract.

## Select a method and combine arguments with DI

You can separate the operation from the route file. For example, in `app/services/report_runner.py`:

```python
from orionis.storage.contracts.manager import IStorageManager
from orionis.console import Console


class ReportRunner:
    def __init__(self, storage: IStorageManager) -> None:
        self.storage = storage

    async def run(self, report_id: int, console: Console) -> int:
        await self.storage.disk("local").put(
            f"reports/{report_id}.txt", f"Report {report_id}\n",
        )
        console.success(f"Report {report_id} created.", timestamp=False)
        return 0
```

In `routes/reports.py`:

```python
from app.services.report_runner import ReportRunner
from orionis.console import Argument
from orionis.support.facades import Reactor

Reactor.command("reports:run", [ReportRunner, "run"]).description(
    "Write one report."
).arguments([
    Argument(name_or_flags="report_id", type_=int),
])
```

```shell
orionis reports:run 42
python -B reactor reports:run 42
```

Reactor constructs `ReportRunner` through the container and invokes `run(report_id=42, ...)`. Parser names must match method parameters; other annotated dependencies resolve through DI. CLI values are passed by name because the class **does not** implement `IBaseCommand`. A registered class that does implement it uses `getArgument()`, like a conventional command.

<a id="fluent-api"></a>

## Fluent builder API

`Reactor.command(signature, handler)` returns `ICommand`, implemented by `orionis.console.fluent.command.Command`. Options mutate the same builder and return `Self`, except `get()`.

```text
Command(signature: str, concrete: Callable[..., Any], method: str = "handle")
```

The technical constructor defaults to `handle`. The Reactor service normalizes that to `__call__` when passed a class directly or a list without a method. It verifies that `concrete` is callable, `method` is a `str` and a callable method with that name exists; otherwise it raises `TypeError` or `AttributeError`. The loader also requires a callable with `__name__`. Use importable classes whose module/class names can be reconstructed from metadata.

<a id="fluent-timestamp"></a>

### timestamp(*, enabled: bool = True) -> Self

Enables or disables executor messages for the command. The builder starts at `True`; a nonboolean value raises `TypeError`. The argument is keyword-only: `.timestamp(enabled=False)`.

<a id="fluent-description"></a>

### description(desc: str) -> Self

Replaces help text, initially `No description provided.`. Rejects non-string values. It does not apply the same signature and description checks as `BaseCommand` subclass discovery: retain consistent names and useful descriptions.

<a id="fluent-arguments"></a>

### arguments(args: list[Argument]) -> Self

Replaces the entire argument list rather than appending to it. The initial list is empty. A non-list value or a list containing other types raises `TypeError`. See [arguments and options](/en/console/commands-and-arguments).

<a id="fluent-get"></a>

### get() -> tuple[str, CommandEntity]

Returns the signature and metadata entity containing class, method, timestamps, description and arguments. It does not execute the command. The loader consumes this result and constructs the parser. Normal usage only needs the registration chain; you do not need to call `get()`.

```python
from orionis.console.fluent.command import Command


class HealthHandler:
    async def handle(self) -> int:
        return 0


builder = Command("app:health", HealthHandler)
builder.description("Check application command wiring.")
signature, metadata = builder.get()
assert signature == "app:health"
assert metadata.method == "handle"
```

Do not add registrations after materializing the loader registry or calling `Reactor.info()` and expect an automatic reload. The [cache](/en/console/command-cache) retains both persistent metadata and in-memory objects throughout the service lifetime.
