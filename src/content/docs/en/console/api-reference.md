---
title: "Console technical reference"
description: "API and contract map, CLI kernel, metadata, templates and integration utilities."
editUrl: true
lastUpdated: false
---

This page connects the complete references and describes integration tools you do not need to construct when writing a normal command.

## Public API map

| Component | Reference |
| --- | --- |
| `BaseCommand` / `IBaseCommand` | [Structure, constructor and handle](/en/console/creating-commands#base-command); [getArgument, getArguments and setArguments](/en/console/commands-and-arguments#base-getargument). |
| `Argument` / `ArgumentAction` | [Declaring arguments, actions and reading values](/en/console/commands-and-arguments). |
| Reactor / `IReactor` | [command, hasCommand, info and call](/en/console/reactor-and-injection). |
| Loader / `ILoader` | [Discovery, persistence and four methods](/en/console/command-cache#loader-api). |
| Command builder / `ICommand` | [timestamp, description, arguments and get](/en/console/command-routing#fluent-api). |
| `Console` / `IConsole` | [Output](/en/console/console-output), [questions](/en/console/interactive-input) and [progress](/en/console/progress). |
| Output helpers and contracts | [Executor and HelpCommand](/en/console/console-output); [ProgressBar](/en/console/progress). |
| `BaseScheduler`, Schedule / `ISchedule` | [Registration](/en/console/task-scheduling), [Schedule.command()](/en/console/scheduler-execution#schedule-command) and [complete API](/en/console/scheduler-execution). |
| Task builder / `ITask` | [Configuration and all frequencies](/en/console/scheduler-frequencies). |
| `ScheduleStore` / `IScheduleStore` | [Stores, drivers and configuration](/en/console/scheduler-configuration). |
| Listeners, events and states | [Hooks, entities and enums](/en/console/scheduler-listeners). |

Contracts describe API intent; guide examples follow the implementation. For example, `IReactor.call()` lists exceptions in its docstring, but Reactor catches `Exception` within its execution flow and normally returns `1`. Broad handler annotations do not enable import strings either. Each guide explains verified limits.

<a id="command-entity"></a>

## Command metadata entity

Import it from `orionis.console.entities.command`; this is distinct from the builder in `orionis.console.fluent.command`.

```text
Command(
    *,
    obj: type,
    method: str = "handle",
    timestamps: bool = True,
    signature: str,
    description: str,
    args: list[Argument] | argparse.ArgumentParser | None = None,
)
```

This is a mutable dataclass. `obj` references the class the container will construct, `method` selects the action, `signature` identifies it and `description` supplies help text. `timestamps` configures executor messages. `args` is a declarative list while the builder prepares the command, and a constructed parser after loader materialization.

The builder returns this entity through `get()`; `Loader.get()` and `Loader.all()` expose materialized entities. Do not edit their fields to update a persistent registry: the cache stores a different metadata representation.

<a id="kernel-cli"></a>

## KernelCLI and IKernelCLI

The implementation is in `orionis.console.kernel`; its contract is in `orionis.console.contracts.kernel`. The application uses them to connect CLI input to Reactor.

```text
async boot(application: IApplication) -> None
async handle(args: list[str] | None = None) -> int
```

`boot()` resolves `IReactor`. `handle()` requires that initialization, checks explicit arguments are a list and normalizes the executable prefix. With no remaining signature, or global help, it calls `list`. Otherwise, the first token becomes the signature and the remainder is passed to `Reactor.call()`.

The method may mutate the supplied list when removing prefixes; pass a fresh list to preserve the original. `None` does not read `sys.argv` automatically: it represents an argument-free invocation for this kernel. The application and entry points supply arguments.

The public `IGNORE_FLAGS` constant contains `reactor`, `-c`, `-m`, `-`, `-i`, `-q`, `-B`, `-O`, `-OO`, `-v`, `-vv`, `-d`, `-x`, `-E`, `-s`, `-S`, `-u`, `-I` and `-W`. It removes initial tokens; these do not become global options for every command, and this is not a complete Python invocation parser.

Normally, integrate execution through the application:

```python
from orionis.foundation.contracts.application import IApplication


class ConsoleEntrypoint:
    async def run(self, app: IApplication) -> int:
        return await app.handleCommand(["reactor", "list"])
```

`Application.handleCommand()` coordinates the application lifecycle. To call a command from an already booted component, `IReactor.call()` is usually sufficient; a second kernel is unnecessary.

<a id="reactor-provider"></a>

## Reactor provider and accessor

```text
ReactorProvider.register() -> None
async ReactorProvider.boot() -> None
Reactor.getFacadeAccessor() -> str
```

`orionis.console.reactor_provider.ReactorProvider` registers `IReactor -> Reactor` as a singleton with alias `x-orionis-IReactor`. Its `boot()` pins the facade; `getFacadeAccessor()` returns that alias. It does not automatically bind every helper contract as an interchangeable service: for example, Reactor receives the concrete Loader class rather than `ILoader`.

The [Schedule provider](/en/console/scheduler-execution#scheduler-provider) registers the scheduler service. Import the `Reactor` and `Schedule` facades from `orionis.support.facades`.

<a id="core-commands"></a>

## Native command catalog

```text
get_core_commands_mapping() -> tuple[type, ...]
CORE_COMMANDS: tuple
```

In `orionis.console.core.commands`, the function returns the framework's 67 registered classes and `CORE_COMMANDS` retains the result for the loader. These are not command instances executed during catalog import. The [complete catalog](/en/console/built-in-commands) documents every signature, argument and option; finding another class in a source file does not make it a registered CLI command.

<a id="stub-construction"></a>

## Render and create code with Stub

`orionis.console.templates.stub.Stub` uses templates distributed with the framework. [CLI generators](/en/console/built-in-generators) provide the usual interface; this API lets you inspect or reuse rendering.

```text
Stub(
    template_name: str,
    class_name: str,
    prefix: str | None = None,
    postfix: str | None = None,
    replacements: dict[str, str] | None = None,
) -> None
render() -> str
create(
    directory: Path,
    relative_to: Path | None = None,
    extension: str = "py",
) -> str
```

The constructor stores the template name without `.stub`, base name and replacements. `render()` derives filename/class names, loads the template and returns source as a string without writing. Invalid names or replacements with non-string keys/values are rejected; an absent template raises `FileNotFoundError`.

`create()` renders, creates subdirectories and opens the destination exclusively. An existing file raises `FileExistsError`. A leading extension dot is removed and the extension is lowercased, but it must match a valid extension identifier. Return an absolute path string, or a path relative to `relative_to` when supplied. This relationship is calculated after file creation; choose a destination inside the expected root.

This example previews a command without writing it:

```python
from orionis.console.templates.stub import Stub


class CommandTemplatePreview:
    def render(self) -> str:
        return Stub(
            template_name="console_command",
            class_name="sample",
            postfix="Command",
            replacements={
                "signature_literal": repr("app:sample"),
                "description_literal": repr("Example command."),
            },
        ).render()
```

To create it from a component explicitly responsible for that file:

```python
from orionis.console.templates.stub import Stub
from orionis.foundation.contracts.application import IApplication


class CommandFileGenerator:
    async def create(self, app: IApplication) -> str:
        template = Stub(
            "console_command", "sample", postfix="Command",
            replacements={
                "signature_literal": repr("app:sample"),
                "description_literal": repr("Example command."),
            },
        )
        return template.create(
            app.path("app_console_commands"), relative_to=app.basePath,
        )
```

Creation remains synchronous when called from this async method; use an appropriate execution strategy for many files. The built-in CLI generator delegates writes to a thread. This template API does not replace Storage for business files.

<a id="startup-contexts"></a>

## CLI entry contexts

These infrastructure functions coordinate startup and restore their context on exit. In a normal project, the entry point calls them; do not wrap every application command in them.

| Module and function | Result and effect |
| --- | --- |
| `orionis.console.cli.main() -> int` | Synchronous `orionis` entry point: select the current root, import `bootstrap.app` and execute `app.handleCommand()` through Loop. It does not start another process. |
| `startup.startup_feedback(arguments: Sequence[str] \| None) -> Generator[None]` | Synchronous context manager for transient feedback. Display it only on suitable interactive terminals; clear it at first output or before the handler. Include the recovery context. |
| `startup.stop_startup_feedback() -> None` | Clear active feedback and restore streams; do nothing when inactive. |
| `bootstrap.bootstrap_recovery(arguments: Sequence[str] \| None) -> Generator[None]` | Enable repair only for an exact supported `bootstrap:*` invocation outside help, and restore the previous context on exit. |
| `bootstrap.recovering_route(context: str) -> bool` | Report whether that route context is being repaired (`api`, `ai`, `console`, `web` or `websocket`). |
| `bootstrap.bootstrap_recovery_active() -> bool` | Report whether a supported recovery context is active, including configuration and lifespan. |
| `stdio.protocol_stdio(arguments: Sequence[str] \| None) -> Generator[None]` | For `mcp:start`, redirect diagnostic stdout to stderr while retaining the first binary protocol writer; keep normal output for other commands. |
| `stdio.protocol_stdout() -> BinaryIO \| None` | Return the original binary writer within that context, or `None`. |

Feedback is omitted for redirection/pipes, CI, unsuitable terminals and MCP. Protocol contexts do not turn other commands into MCP servers. See [transport commands](/en/console/built-in-workers) and [MCP servers](/en/mcp) for that integration.

<a id="coverage"></a>

## Source-verified coverage

The [Console inventory](/downloads/console-api-inventory.json) maps the public declarations included in this guide, their signatures and fields to references in both languages. Agreed editorial exclusions are recorded separately so they are not counted as documented features. It maintains a separate catalog of the 67 CLI signatures and their real arguments. Native commands' internal implementation details are not counted as another application API.

The `scripts/audit-console-source.py` auditor compares the inventory against the framework checkout. Site validation checks destinations, anchors and catalog coverage without requiring that checkout in CI. Private methods, exports, inherited dependency APIs and automatically generated methods are excluded from the own-declaration count.
