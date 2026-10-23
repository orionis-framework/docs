---
title: "Text, tables and output"
description: "Console reference: text, styles, tables, diagnostics and CLI output helpers."
editUrl: true
lastUpdated: false
---

<a id="console"></a>
## Output inherited by a command

`BaseCommand` inherits `Console`, which implements `IConsole`. Inside a command, use `self.writeLine()`, `self.table()` and the other inherited methods directly: **you do not need to import or instantiate `Console`**. Use this as the main pattern:

```python
from orionis.console.base import BaseCommand

class ImportSummaryCommand(BaseCommand):
    signature = 'app:import-summary'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.writeLine('Import summary')
        self.table(['Status', 'Rows'], [['created', 12], ['skipped', 3]])
        self.success('Finished', timestamp=False)
        return 0
```

Inherited methods are synchronous except [`sleep()`](/en/console/progress-and-debugging#console-sleep). Calling them inside `async handle()` does not make output or prompts asynchronous. Text methods write to stdout; `error()` does not automatically use stderr or change the exit code.

Status messages with `timestamp=True` obtain the time through the `DateTime` facade, available in a booted application. Use `timestamp=False` in standalone utilities. Styled methods emit ANSI codes; they do not interpret Rich markup such as `[bold]`.

<a id="console-write"></a>
<a id="console-writeline"></a>
## Write values and lines

```text
write(*values: object, sep: str | None = " ", end: str | None = "\n",
      file: SupportsWrite[str] | None = None, flush: bool = False) -> None
writeLine(message: str) -> None
```

`write()` delegates to `print()`: it converts values to text, places `sep` between them and appends `end`. `file=None` selects stdout; `flush=True` flushes the buffer. `sep=None` and `end=None` use the defaults of `print`. `SupportsWrite[str]` describes an object with `write(str)`, not a filename. `writeLine()` prints one message followed by a newline. Both return `None`; conversion errors, invalid `print()` arguments and stream errors propagate.

```python
from io import StringIO
from orionis.console.base import BaseCommand

class WriteValuesCommand(BaseCommand):
    signature = 'app:write-values'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.write('Processed', 24, 'rows', sep=' | ', flush=True)
        self.writeLine('Import complete')
        buffer = StringIO()
        self.write('created', 24, sep=',', end='', file=buffer)
        assert buffer.getvalue() == 'created,24'
        return 0
```

<a id="console-success"></a>
<a id="console-info"></a>
<a id="console-warning"></a>
<a id="console-fail"></a>
<a id="console-error"></a>
## Status messages

| Signature | Appearance and use |
| --- | --- |
| `success(message: str, *, timestamp: bool = True) -> None` | `SUCCESS`, green background: operation completed successfully. |
| `info(message: str, *, timestamp: bool = True) -> None` | `INFO`, blue background: process information. |
| `warning(message: str, *, timestamp: bool = True) -> None` | `WARNING`, yellow background: a condition requiring attention. |
| `fail(message: str, *, timestamp: bool = True) -> None` | `FAIL`, ANSI 256 background index `166` (orange): a failed operation. |
| `error(message: str, *, timestamp: bool = True) -> None` | `ERROR`, red background: an error diagnostic. |

`message` is the text to print. Keyword-only `timestamp` controls the date and time; no global `Console` option replaces this argument. All return `None`, do not raise because of the displayed status and do not stop the command. Date service and stdout errors propagate.

```python
from orionis.console.base import BaseCommand

class StatusMessagesCommand(BaseCommand):
    signature = 'app:status-messages'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.info('Reading input', timestamp=False)
        self.warning('Two rows were skipped', timestamp=False)
        self.fail('Import could not be completed', timestamp=False)
        self.error('The supplied file has an invalid format', timestamp=False)
        self.success('Summary saved', timestamp=False)
        return 0
```

<a id="console-textsuccess"></a>
<a id="console-textsuccessbold"></a>
<a id="console-textinfo"></a>
<a id="console-textinfobold"></a>
<a id="console-textwarning"></a>
<a id="console-textwarningbold"></a>
<a id="console-texterror"></a>
<a id="console-texterrorbold"></a>
<a id="console-textmuted"></a>
<a id="console-textmutedbold"></a>
<a id="console-textunderline"></a>
## Styled text

Each method accepts only `message: str`, prints a line and returns `None`. They add no label or timestamp. There is no additional validation; stream errors propagate.

| Signature | Style |
| --- | --- |
| `textSuccess(message: str) -> None` | Green. |
| `textSuccessBold(message: str) -> None` | Bold green. |
| `textInfo(message: str) -> None` | Blue. |
| `textInfoBold(message: str) -> None` | Bold blue. |
| `textWarning(message: str) -> None` | Yellow. |
| `textWarningBold(message: str) -> None` | Bold yellow. |
| `textError(message: str) -> None` | Red. |
| `textErrorBold(message: str) -> None` | Bold red. |
| `textMuted(message: str) -> None` | Gray. |
| `textMutedBold(message: str) -> None` | Bold gray. |
| `textUnderline(message: str) -> None` | Underlined. |

```python
from orionis.console.base import BaseCommand

class StyledTextCommand(BaseCommand):
    signature = 'app:styled-text'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.textSuccess('Created')
        self.textSuccessBold('All records created')
        self.textInfo('Reading configuration')
        self.textInfoBold('Selected connection: sqlite')
        self.textWarning('Skipped an existing record')
        self.textWarningBold('Review the skipped records')
        self.textError('Invalid row')
        self.textErrorBold('Import failed')
        self.textMuted('Elapsed: 0.2 seconds')
        self.textMutedBold('Import details')
        self.textUnderline('Summary')
        return 0
```

<a id="console-line"></a>
<a id="console-newline"></a>
<a id="console-clear"></a>
<a id="console-clearline"></a>
## Spacing and terminal control

```text
line() -> None
newLine(count: int = 1) -> None
clear() -> None
clearLine() -> None
```

`line()` writes a newline; it does not draw a horizontal rule. `newLine()` writes `count` newlines and raises `ValueError` if `count <= 0`. Use a positive integer; other types can cause `TypeError` during comparison or multiplication.

`clear()` clears the screen and moves the cursor home using ANSI **only when stdout is a terminal** (`isatty()`); it writes nothing to redirected output. `clearLine()` writes `\r \r` and flushes: it returns to the start and overwrites one character, without guaranteeing that an entire long line is erased. All return `None`; stream errors propagate.

```python
from orionis.console.base import BaseCommand

class TerminalOutputCommand(BaseCommand):
    signature = 'app:terminal-output'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.clear()
        self.write('Preparing...', end='', flush=True)
        self.clearLine()
        self.writeLine('Ready')
        self.line()
        self.newLine(2)
        return 0
```

<a id="console-table"></a>
## Tables

```text
table(headers: list, rows: list) -> None
```

`headers` contains column names and `rows` contains rows. It converts cells to text, calculates the maximum width of each column and draws borders with bold headers. Returns `None`. Empty headers or rows raise `ValueError`.

Provide text headers and the same number of cells in every row: width calculation uses `zip()`, so short rows truncate the columns and extra cells are not displayed. There is no automatic wrapping to terminal width, alignment option or pagination.

```python
from orionis.console.base import BaseCommand

class TableOutputCommand(BaseCommand):
    signature = 'app:table-output'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        rows = [['customers', 120], ['orders', 48]]
        if rows:
            self.table(['Resource', 'Imported'], rows)
        else:
            self.writeLine('No rows to display')
        return 0
```

<a id="console-exception"></a>
## Display an exception

```text
exception(exception: Exception) -> None
```

Accepts an `Exception` instance and displays its type, message and a Rich traceback with `max_frames=1`, one context line and no local variables. Returns `None`; an argument not derived from `Exception` raises `TypeError`. Displaying it does not rethrow it, record an event or mark the command as failed.

```python
from orionis.console.base import BaseCommand


class CheckInputCommand(BaseCommand):
    signature = "app:check-input"
    description = "Validate an import quantity."

    async def handle(self) -> int:
        try:
            int("invalid")
        except ValueError as error:
            self.exception(error)
            return 1
        return 0
```

<a id="console-exitsuccess"></a>
<a id="console-exiterror"></a>
## Terminate the process

```text
exitSuccess(message: str | None = None) -> None
exitError(message: str | None = None) -> None
```

When `message` contains text, the method first calls `success()` or `error()` with timestamps enabled. It then requests exit with code `0` or `1`. **The implementation catches `SystemExit` and calls `os._exit()`**, terminating the process immediately. These methods do not return a result to Reactor; `finally` blocks and application lifecycle cleanup cannot be relied on.

For ordinary commands, return an integer from `handle()`, as in the previous example. Use these methods only when the entire process running the command, including its other tasks, must terminate:

```python
from orionis.console.base import BaseCommand

class ProcessExitCommand(BaseCommand):
    signature = 'app:process-exit'
    description = 'Demonstrate inherited command output.'

    def terminate_process(self, success: bool) -> None:
        if success:
            self.exitSuccess()
        else:
            self.exitError()
```

Defining the class does not run the `terminate_process()` helper; it terminates the process only when called. Optional messages require the same booted application as other timestamped output. Do not call these methods from a programmatically invoked command when the calling process must continue.

<a id="executor"></a>
<a id="executor-running"></a>
<a id="executor-done"></a>
<a id="executor-fail"></a>
## Execution status helpers

`Executor` implements `IExecutor`. **It does not execute processes and is not inherited by `BaseCommand`**: it displays execution status. Its constructor accepts no arguments, and all three methods return `None`:

```text
running(program: str, time: str = "") -> None
done(program: str, time: str = "") -> None
fail(program: str, time: str = "") -> None
```

`program` is a label; `time` is text already calculated by the caller, not a timer. It prints a timestamp, dot padding and `RUNNING`, `DONE` or `FAIL`, flushing stdout. `done()` and `fail()` prepend ` ~ ` to the time text. It uses `DateTime`, so this example belongs in a booted application command. Date and stream errors propagate; displaying `FAIL` does not raise an exception.

```python
from time import perf_counter
from orionis.console.base import BaseCommand
from orionis.console.output.executor import Executor


class MeasureCommand(BaseCommand):
    signature = "app:measure"
    description = "Show execution status."

    async def handle(self) -> int:
        output = Executor()
        output.running("Inventory summary")
        started = perf_counter()
        try:
            total = sum(range(100))
        except Exception as error:
            output.fail("Inventory summary", f"{perf_counter() - started:.3f}s")
            self.exception(error)
            return 1
        output.done("Inventory summary", f"{perf_counter() - started:.3f}s")
        self.writeLine(f"Total: {total}")
        return 0
```

<a id="help-command"></a>
<a id="help-command-parseactions"></a>
<a id="help-command-printactions"></a>
## Inspect and display help

`HelpCommand` implements `IHelpCommand`. It is a static parser helper, not a command superclass:

```text
HelpCommand.parseActions(actions: list[argparse.Action]) -> dict[str, Any]
HelpCommand.printActions(command_name: str, actions: list[argparse.Action],
                         *, is_error: bool = False) -> None
```

`parseActions()` classifies argparse actions. Returns `help` (`dict` or `None`), `positionals` (`list`), `optionals` (`list`) and `subcommands` (`dict`). Each argument contains `action_class`, `dest`, `flags`, `nargs`, `const`, `default`, `type`, `choices`, `required`, `help` and `metavar`. Subcommands include their description and recursively classified arguments. It does not execute commands or automatically convert these values to JSON: `choices` and `default` can contain Python objects.

`printActions()` displays a panel and tables for arguments, options and subcommands. `is_error=True` adds an invalid-usage diagnostic; it still returns `None`, without raising a parsing error or changing the exit code itself. It accepts previously constructed actions; invalid-object and rendering errors propagate.

```python
import argparse
from orionis.console.output.help_command import HelpCommand

parser = argparse.ArgumentParser(prog="app:report")
parser.add_argument("name", help="Report name")
parser.add_argument("--format", choices=["csv", "json"], default="csv")

metadata = HelpCommand.parseActions(parser._actions)
assert metadata["positionals"][0]["dest"] == "name"
HelpCommand.printActions("app:report", parser._actions)
HelpCommand.printActions("app:report", parser._actions, is_error=True)
```

The example accesses `parser._actions` because this API specifically accepts argparse actions; let Reactor construct and display help for application commands.

<a id="ansi-colors"></a>
## Available ANSI codes

`ANSIColors` is an `Enum`; each member exposes its sequence as `.value`. The `Console` methods above already select these codes. The following 24 members are available for custom presentation; exact color reproduction depends on the terminal:

| Member | Sequence (`ESC` means `\x1b`) | Purpose |
| --- | --- | --- |
| `DEFAULT` | `ESC[0m` | Reset styles and colors. |
| `BG_INFO` | `ESC[44m` | Blue background. |
| `BG_ERROR` | `ESC[41m` | Red background. |
| `BG_FAIL` | `ESC[48;5;166m` | 256-color background, index 166. |
| `BG_WARNING` | `ESC[43m` | Yellow background. |
| `BG_SUCCESS` | `ESC[42m` | Green background. |
| `TEXT_INFO` | `ESC[34m` | Blue text. |
| `TEXT_ERROR` | `ESC[91m` | Bright red text. |
| `TEXT_WARNING` | `ESC[33m` | Yellow text. |
| `TEXT_SUCCESS` | `ESC[32m` | Green text. |
| `TEXT_WHITE` | `ESC[97m` | Bright white text. |
| `TEXT_MUTED` | `ESC[90m` | Gray text. |
| `TEXT_BOLD_INFO` | `ESC[1;34m` | Bold blue text. |
| `TEXT_BOLD_ERROR` | `ESC[1;91m` | Bold bright red text. |
| `TEXT_BOLD_WARNING` | `ESC[1;33m` | Bold yellow text. |
| `TEXT_BOLD_SUCCESS` | `ESC[1;32m` | Bold green text. |
| `TEXT_BOLD_WHITE` | `ESC[1;97m` | Bold bright white text. |
| `TEXT_BOLD_MUTED` | `ESC[1;90m` | Bold gray text. |
| `TEXT_BOLD` | `ESC[1m` | Bold. |
| `TEXT_STYLE_UNDERLINE` | `ESC[4m` | Underline. |
| `CYAN` | `ESC[36m` | Cyan text. |
| `DIM` | `ESC[2m` | Dim intensity. |
| `MAGENTA` | `ESC[35m` | Magenta text. |
| `ITALIC` | `ESC[3m` | Italic. |

```python
from orionis.console.enums.styles import ANSIColors
from orionis.console.base import BaseCommand

class AnsiOutputCommand(BaseCommand):
    signature = 'app:ansi-output'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.writeLine(f'{ANSIColors.CYAN.value}Report details{ANSIColors.DEFAULT.value}')
        return 0
```

Continue with [interactive questions](/en/console/interactive-input), [progress](/en/console/progress-and-debugging) or [programmatic execution](/en/console/output-and-programmatic-execution).

<a id="console-outside-commands"></a>
## Use Console outside a command

In a utility that does not extend `BaseCommand`, you can import and construct `Console`. This is an independent use; inside a command, use inherited methods through `self`. `Console()` takes no arguments.

```python
from orionis.console import Console

console = Console()
console.writeLine("Import summary")
console.table(["Status", "Rows"], [["created", 12], ["skipped", 3]])
console.success("Finished", timestamp=False)
```
