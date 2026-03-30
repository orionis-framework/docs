---
title: Custom Commands
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Custom Commands in Orionis Framework

Orionis Framework allows you to extend the console with application-defined
commands. These commands coexist with the framework's native ones and can be
discovered directly from the CLI via `reactor list`, without any manual
registration steps in the typical development workflow.

This guide covers:

- Why and when to create custom commands.
- How to generate them with `make:command`.
- How to structure their properties, arguments, and business logic.
- How to inject dependencies and emit console output.
- Best practices and common troubleshooting.

## Why Create Custom Commands?

The framework's native commands cover general operational tasks. However, in
projects with real business rules, recurring tasks arise that are worth
formalizing as custom commands, for example:

- Domain-specific cache clearing.
- Data synchronization with external services.
- Scheduled report generation.
- Seed data loading in development.
- System state validations or audits.

Modeling these operations as commands makes them reproducible, auditable, and
easy to invoke by both developers and automated CI/CD processes.

## Generation with `make:command`

The native `make:command` command generates the base structure for a new command,
including the class, its main properties, and the `handle` method ready for you
to implement the logic.

**Syntax**

```bash
python -B reactor make:command <name> [--signature="..."] [--description="..."]
```

**Accepted parameters**

- `name`: Name of the file and class to generate, in `snake_case` format.
- `--signature`: Signature used to invoke the command from the terminal.
- `--description`: Descriptive text that will appear when running `reactor list`.

**Usage example**

```bash
python -B reactor make:command clean_cache --signature="cache:clean" --description="Clears application cache"
```

This command generates the file `app/console/commands/clean_cache_command.py`, ready
for you to implement the specific logic.

**Naming convention**

| Element | Expected format | Example |
|---------|----------------|---------|
| `name` (CLI argument) | `snake_case` | `clean_cache` |
| Generated class | `PascalCase` + `Command` | `CleanCacheCommand` |
| `--signature` | `module:action` | `cache:clean` |

Using a module prefix in the signature (`cache:`, `user:`, `report:`) makes it
easier to classify commands as the project grows.

## Structure of a Custom Command

The template generated from the example above is equivalent to:

```python
from typing import ClassVar
from orionis.console.args.argument import Argument
from orionis.console.base.command import BaseCommand

class CleanCacheCommand(BaseCommand):

    # Signature used in the terminal to invoke the command
    signature: str = "cache:clean"

    # Description visible in `reactor list`
    description: str = "Clears application cache"

    # Arguments and options the command accepts
    arguments: ClassVar[list[Argument]] = []

    async def handle(self) -> None:
        # TODO: Implement command logic
        ...
```

**Main properties**

- `signature`: String that defines how the command will be invoked. It must be
  unique within the project.
- `description`: Brief text describing the command's purpose. It is displayed
  in `reactor list` and helps other developers understand its function.
- `arguments`: List of `Argument` instances that declare the parameters the
  command accepts when invoked. It can be empty if the command requires no
  input parameters.

## Defining Arguments

Command arguments are declared as `Argument` instances within the `arguments`
property. Each definition establishes the argument's name or flags, its type,
whether it is required, its default value, and help text.

**Example with multiple arguments**

```python
from typing import ClassVar
from orionis.console.args.argument import Argument
from orionis.console.base.command import BaseCommand

class ServeCommand(BaseCommand):

    signature: str = "app:serve"
    description: str = "Starts the application server"

    arguments: ClassVar[list[Argument]] = [
        Argument(
            name_or_flags=["--interface", "-i"],
            type_=str,
            help="Interface type: ASGI or RSGI.",
            choices=["rsgi", "asgi"],
            dest="interface",
            required=False,
        ),
        Argument(
            name_or_flags=["--port", "-p"],
            type_=int,
            help="Port on which the server will listen.",
            dest="port",
            required=False,
        ),
        Argument(
            name_or_flags=["--log"],
            type_=bool,
            help="Enables detailed server logs.",
            action="store_true",
            dest="log_enabled",
            default=False,
            required=False,
        ),
    ]

    async def handle(self) -> None:
        interface = self.getArgument("interface", default="rsgi")
        port = self.getArgument("port", default=8000)
        log = self.getArgument("log_enabled", default=False)
        self.info(f"Server starting on {interface}:{port} (log={log})")
```

## `Argument` Entity Reference

**Constructor signature**

```python
class Argument(
    *,
    name_or_flags: str | Iterable[str],
    action: str | ArgumentAction | None = None,
    nargs: int | str | None = None,
    const: Any = MISSING,
    default: Any = MISSING,
    type_: Callable[[str], Any] | None = None,
    choices: Iterable[Any] | None = None,
    required: bool = False,
    help: str | None = None,
    metavar: str | tuple[str, ...] | None = None,
    dest: str | None = None,
    version: str | None = None,
    extra: dict[str, Any] = dict,
)
```

**Configuration parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `name_or_flags` | `str \| Iterable[str]` | Name or flags for the argument, e.g. `["--file", "-f"]`. |
| `action` | `str \| None` | Action when the argument is encountered (`store_true`, `store_const`, etc.). |
| `nargs` | `int \| str \| None` | Number of values to consume (`?`, `*`, `+`, or an integer). |
| `const` | `Any` | Constant value used with actions like `store_const`. |
| `default` | `Any` | Default value when the argument is not provided. |
| `type_` | `Callable` | Function to convert the received value to the expected type. |
| `choices` | `Iterable` | Set of valid values for the argument. |
| `required` | `bool` | Indicates whether the argument is mandatory. |
| `help` | `str \| None` | Help text displayed in the console. |
| `metavar` | `str \| None` | Argument name in help messages. |
| `dest` | `str \| None` | Name of the attribute where the parsed value is stored. |
| `version` | `str \| None` | Version string, used with `action="version"`. |
| `extra` | `dict` | Additional parameters passed to argparse's `add_argument`. |

## Accessing Arguments in the `handle` Method

Within the `handle` method, you can read the received values using the following methods:

**Get a single argument**

```python
# Returns the argument value or None if not provided
value = self.getArgument('name')

# Returns the argument value or the specified default if not provided
value = self.getArgument('key', default='default_value')
```

**Get all arguments**

```python
# Returns a dictionary with all arguments and their values
all_args = self.getArguments()
```

**Combined usage example**

```python
async def handle(self) -> None:
    args = self.getArguments()
    self.info(f"Received arguments: {args}")

    mode = self.getArgument("mode", default="production")
    self.success(f"Running in mode: {mode}")
```

## The `handle` Method: Command Logic

The `handle` method is the entry point for command execution. It is defined as
`async`, so it can coordinate non-blocking I/O operations when the use case
requires it.

Within `handle`, you can orchestrate business operations such as database queries,
service invocations, file generation, or notification dispatching.

**Dependency injection**

Orionis Framework supports dependency injection directly in the `handle` method.
Simply declare the service type as a parameter and the container will resolve it
automatically:

```python
from app.services.cache_service import CacheService

async def handle(self, cache: CacheService) -> None:
    await cache.flush()
    self.success("Cache cleared successfully.")
```

**Using the constructor**

You can also initialize dependencies or state in the class constructor, which may
feel familiar if you come from other frameworks:

```python
from app.services.cache_service import CacheService

def __init__(self, cache: CacheService):
    super().__init__()
    self._cache = cache
```

The general recommendation is to keep `handle` as the use case coordinator and
delegate complex logic to specialized services.

## Console Output API

`BaseCommand` inherits from the `Console` class, which centralizes output utilities,
interactive input, debugging, and terminal rendering. This API is not limited to
displaying decorative messages: it also defines how the command reports progress,
signals failures, requests confirmations, and terminates its execution.

### Color-background Messages

These methods print a label with a colored background, followed by the message. By
default, they include a timestamp generated with `LocalDateTime.now()` and formatted
as `YYYY-MM-DD HH:MM:SS`.

| Method | Printed label | Style | Recommended use |
|--------|---------------|-------|-----------------|
| <span style="white-space:nowrap">`self.success`</span> | `SUCCESS` | Green background, white text | Confirm that an operation completed successfully. |
| <span style="white-space:nowrap">`self.info`</span> | `INFO` | Blue background, white text | Report progress, context, or intermediate steps. |
| <span style="white-space:nowrap">`self.warning`</span> | `WARNING` | Yellow background, white text | Warn about an anomalous situation that does not block the flow. |
| <span style="white-space:nowrap">`self.fail`</span> | `FAIL` | Red background, white text | Indicate a failed or unsatisfactory result within a still-controlled flow. |
| <span style="white-space:nowrap">`self.error`</span> | `ERROR` | Red background, white text | Report an actual error that typically precedes an exception or a failed exit. |

**Usage example**

```python
self.success("Operation completed.", timestamp=True)
self.info("Processing data...")
self.warning("Value X is not optimal, but the default will be used.")
self.fail("The operation did not produce the expected result, but execution will continue.")
self.error("The operation could not be completed due to an error.")
```

The `timestamp` parameter controls whether the date and time are printed before the
message. Set it to `False` when you want cleaner output or when the time does not
add value to the context.

### Correct Difference Between `fail` and `error`

This is the part most often documented incorrectly. Although both methods use a red
background, they do not mean exactly the same thing:

- `fail(...)` communicates that an operation failed or that the result was not as
  expected, but it does not necessarily require interrupting execution.
- `error(...)` communicates a stronger execution error, typically associated with
  an exception, a flow cancellation, or an exit with an error code.

Practical example:

```python
async def handle(self) -> None:
    profile = await self.profileService.findById(10)

    if profile is None:
        self.fail("The requested profile was not found.")
        return

    if not profile.is_valid:
        self.error("The profile exists but does not meet the required conditions.")
        raise ValueError("Invalid profile")

    self.success("Profile validated successfully.")
```

**Basic usage example**

```python
async def handle(self) -> None:
    self.info("Starting cleanup process...")

    try:
        # business logic
        self.success("Cache deleted successfully.")
    except Exception as exc:
        self.error(f"The operation could not be completed: {exc}")
        raise
```

### Plain Colored Text Messages

These methods print only colored text. They do not include a label or timestamp.
They are suitable for supplementing the command's main output.

**Available variants**

| Method | Color | Variant |
|--------|-------|---------|
| `self.textSuccess(message)` | Green | Normal text |
| `self.textSuccessBold(message)` | Green | Bold text |
| `self.textInfo(message)` | Blue | Normal text |
| `self.textInfoBold(message)` | Blue | Bold text |
| `self.textWarning(message)` | Yellow | Normal text |
| `self.textWarningBold(message)` | Yellow | Bold text |
| `self.textError(message)` | Red | Normal text |
| `self.textErrorBold(message)` | Red | Bold text |
| `self.textMuted(message)` | Gray | Normal text |
| `self.textMutedBold(message)` | Gray | Bold text |
| `self.textUnderline(message)` | Underline style | Underlined text |

There is no `textFail(...)` method. If you need to express a failure with the
framework's own semantics, use `fail(...)` or `error(...)` depending on the intent.

**Auxiliary text example**

```python
async def handle(self) -> None:
    self.textMuted("Reading configuration...")
    self.textInfoBold("Connection established.")
    self.textSuccessBold("Process completed.")
```

### Spacing and Screen Control

These methods help visually structure the terminal output.

| Method | Actual behavior |
|--------|-----------------|
| `self.line()` | Prints a blank line. Does not draw a horizontal rule. |
| `self.newLine(count=1)` | Prints `count` line breaks. Raises `ValueError` if `count <= 0`. |
| `self.clearLine()` | Clears the current line content using `\r \r`. |
| `self.clear()` | Clears the entire screen with `cls` on Windows or `clear` on Unix. |
| `self.writeLine(message)` | Prints a simple message followed by a newline. |
| `self.write(*values, sep, end, file, flush)` | Works like `print(...)` and allows more control over the output. |

**When to use `line`, `newLine`, `write`, and `writeLine`**

- Use `line()` when you only want to visually separate blocks with a blank line.
- Use `newLine(count)` when you need more than one consecutive line break.
- Use `writeLine(...)` to print a simple line without color or special formatting.
- Use `write(...)` when you need control over `sep`, `end`, `flush`, or the output stream.

**Spacing example**

```python
async def handle(self) -> None:
    self.info("Step 1 completed.")
    self.line()
    self.textMuted("Preparing step 2...")
    self.newLine(2)
    self.writeLine("Result: OK")
```

### Table Rendering

The `table(...)` method prints a table with Unicode borders, bold headers, and
column widths dynamically calculated from the content.

```python
self.table(
    headers=["ID", "Name", "Status"],
    rows=[
        [1, "Task Alpha", "Active"],
        [2, "Task Beta", "Pending"],
        [3, "Task Gamma", "Completed"],
    ],
)
```

Raises `ValueError` if `headers` or `rows` are empty. This is especially useful
for displaying listings, query results, comparisons, or administrative outputs.

### Progress Bar

The `progressBar` property returns a new `ProgressBar` instance each time it is
accessed.

```python
bar = self.progressBar
bar.start(total=100)
for _ in range(100):
    # processing
    bar.advance()
bar.finish()
```

This is useful for long-running operations such as imports, migrations,
synchronizations, or batch processing.

### Exception Printing

The `exception(...)` method uses `rich.traceback.Traceback` to render the exception
trace with enriched formatting.

```python
try:
    risky_operation()
except Exception as exc:
    self.exception(exc)
    raise
```

Raises `TypeError` if the received argument is not an `Exception` instance. This
is useful when you need to display a readable trace without relying on the
interpreter's default format.

### Exit with Status Code

These methods explicitly terminate the process:

| Method | Exit code | Behavior |
|--------|-----------|----------|
| `self.exitSuccess(message=None)` | `0` | Prints an optional success message and terminates cleanly. |
| `self.exitError(message=None)` | `1` | Prints an optional error message and terminates with an error. |

These are useful when you need to explicitly close the command without continuing
the rest of the flow.

```python
async def handle(self) -> None:
    if not self.confirm("Do you want to continue with the operation?"):
        self.exitError("Operation canceled by the user.")

    self.exitSuccess("Process completed successfully.")
```

**Exit code**

The framework determines the command's final result based on the execution flow:

- If `handle` finishes without exceptions, the process exits with code `0`.
- If `handle` raises an unhandled exception, the process exits with a non-`0` code.
- If you call `exitSuccess(...)`, the process exits with code `0`.
- If you call `exitError(...)`, the process exits with code `1`.

You do not need to return a value from `handle`. The command result is determined
by unhandled exceptions or explicit calls to the process exit methods.

## Console API: User Interaction

These methods allow you to request data from the terminal. All of them display the
prompt with the framework's informational color.

### `ask` — Free Input

```python
value = self.ask("What is the environment name?")
```

Returns the text entered by the user.

### `confirm` — Boolean Confirmation

```python
confirmed = self.confirm("Do you want to continue?", default=False)
```

Displays the question with the text `(Y/n)` and converts the response to uppercase.
Returns `True` when the user types `Y` or `YES`. If the user enters nothing, it
returns the value specified in `default`.

Although the visible prompt text is always `(Y/n)`, the actual default value
depends on the `default` parameter.

### `secret` — Hidden Input

```python
token = self.secret("Enter your access token:")
```

Uses `getpass.getpass(...)`, so the input is not visible in the console. This is
suitable for passwords, keys, or tokens.

### `choice` — Numbered Selection

```python
option = self.choice(
    "Select an environment:",
    choices=["development", "staging", "production"],
    default_index=0,
)
```

Prints a numbered list starting from `1` and prompts the user to choose a valid
option. If no value is entered, it returns the option at `default_index`. Raises
`ValueError` if the list is empty or if the index is out of range.

### `anticipate` — Prefix Autocompletion

```python
environment = self.anticipate(
    "Which environment do you want to use?",
    options=["development", "staging", "production"],
    default="development",
)
```

Compares the entered text against available options using prefix matching via
`startswith(...)`. If a match is found, it returns the first option that meets the
condition. If no match is found, it returns `default` or, failing that, the text
entered by the user.

## Best Practices

- **Descriptive and unique signatures**: Use the `module:action` pattern to avoid
  collisions and facilitate organization.
- **Always describe the command**: Provide a clear `description`; it will appear
  in `reactor list` and serves as the first source of documentation.
- **Delegate logic**: Keep `handle` clean and delegate complex operations to
  specialized services or repositories.
- **Validate input early**: If a required argument does not arrive with the expected
  value, notify with `self.error` and raise an exception to produce a clean exit
  code.
- **Leverage dependency injection**: Avoid manually instantiating services within
  the command; delegate that responsibility to the container.
- **Use the console with intent**: Reserve `success`, `warning`, `fail`, and `error`
  for flow states, and use `textInfo`, `textMuted`, or `table` for supplementary
  details.

## Common Troubleshooting

**The command does not appear in `reactor list`**

- Verify that the file is located in `app/console/commands/`.
- Confirm that the class inherits from `BaseCommand`.
- Check for import errors in the module.

**The argument always arrives as `None`**

- Verify that the `dest` in `Argument` matches exactly the key you use in
  `getArgument`.
- Make sure the argument is being passed correctly in the terminal.

**Dependency injection does not resolve the service**

- Confirm that the service is registered in the application's container.
- Verify the type declared in the `handle` parameter; it must match the registered
  binding.