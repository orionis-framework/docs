---
title: "Arguments and options"
description: "Declare arguments and options, actions, optional values, converters and read CLI data."
editUrl: true
lastUpdated: false
---

CLI values are defined with `Argument` and processed through `argparse`. The signature identifies the command; it does not incorporate an additional syntax such as `{name}`. Declare arguments in `BaseCommand.arguments` or `.arguments([...])` when registering a [console route](/en/console/command-routing).

<a id="argument-construction"></a>

## Declare arguments with Argument

Import `Argument` from `orionis.console`. It is an immutable dataclass with keyword-only construction. Only `name_or_flags` is required:

| Field | Type and default | Purpose |
| --- | --- | --- |
| `name_or_flags` | `str` or `Iterable[str]`, required. | Positional name or flags such as `("-n", "--count")`; normalized to a tuple. |
| `action` | `str \| ArgumentAction \| None = None`. | Parser action; `None` uses ordinary value storage. |
| `nargs` | `int \| str \| None = None`. | Number of values: an integer, `?`, `*` or `+`. |
| `const` | `Any = MISSING`. | Value used by constant actions or an option present without a value. |
| `default` | `Any = MISSING`. | Value when the argument is omitted. The sentinel preserves the distinction between absence and `None`. |
| `type_` | `Callable[[str], Any] \| None = None`. | Converts each value, for example `int` or an importable converter. |
| `choices` | `Iterable[Any] \| None = None`. | Allowed values after conversion. A string cannot be used as the collection. |
| `required` | `bool = False`. | Requires an option with flags to be present. Does not configure positional cardinality. |
| `help` | `str \| None = None`. | Description shown in help. |
| `metavar` | `str \| tuple[str, ...] \| None = None`. | Display label for values; a tuple supports distinct labels for fixed cardinality. |
| `dest` | `str \| None = None`. | Key name in resolved arguments. |
| `version` | `str \| None = None`. | Required text when `action="version"`. |

`-h` and `--help` are reserved by Orionis. Empty iterables and non-string elements are rejected; flag/name/action combinations must also be valid for `argparse`.

Fields are validated during entity construction. Some incompatibilities appear only when constructing the parser or parsing an invocation. Values must be compatible with [metadata serialization](/en/console/command-cache).

<a id="argument-cardinality"></a>

## Positionals, cardinality and missing values

| Definition | Example input | Result |
| --- | --- | --- |
| `Argument(name_or_flags="name")` | `Ada` | One required string. |
| `Argument(name_or_flags="name", nargs="?", default="guest")` | No value, or `Ada`. | `"guest"` or `"Ada"`. |
| `Argument(name_or_flags="pair", nargs=2, type_=int)` | `10 20` | `[10, 20]`; exactly two values required. |
| `Argument(name_or_flags="files", nargs="*", default=[])` | No values, or `a.csv b.csv`. | A list that can be empty. |
| `Argument(name_or_flags="ids", nargs="+", type_=int)` | `10 20` | A nonempty list; omission is a parsing error. |

Each row is an independent definition. This command demonstrates an **option** with an optional value. Save it in `app/console/commands/inspect_mode_command.py`:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand


class InspectModeCommand(BaseCommand):
    signature = "app:inspect-mode"
    description = "Show the selected execution mode."
    arguments: ClassVar[list[Argument]] = [
        Argument(
            name_or_flags="--mode", nargs="?",
            default="normal", const="fast", choices=("normal", "fast", "safe"),
        ),
    ]

    async def handle(self) -> int:
        self.writeLine(self.getArgument("mode"))
        return 0
```

```shell
python -B reactor app:inspect-mode
python -B reactor app:inspect-mode --mode
python -B reactor app:inspect-mode --mode safe
```

These invocations print `normal`, `fast` and `safe`, respectively. You can replace `python -B reactor` with `orionis`.

Use `required=True` for a required option. Use `nargs="?"` for an optional positional; `required=False` alone does not make it optional. A list produced by `nargs` groups values from one occurrence; `append` accumulates occurrences of an option.

`MISSING` is not `None`. The parser receives this sentinel as its default, and Reactor removes dictionary entries whose value is still exactly `MISSING`. With `default=None`, the key remains present with `None`. Declare explicit defaults when your code always needs a list, counter or boolean.

<a id="argument-actions"></a>

## The enum's nine actions

Import `ArgumentAction` from `orionis.console.enums.actions`. Use its members or their equivalent strings:

| Member | Action | Use |
| --- | --- | --- |
| `STORE` | `store` | Store a value. |
| `STORE_CONST` | `store_const` | Store `const` when the flag occurs. |
| `STORE_TRUE` | `store_true` | Enable a boolean. |
| `STORE_FALSE` | `store_false` | Disable a boolean. |
| `APPEND` | `append` | Append each occurrence to a list. |
| `APPEND_CONST` | `append_const` | Append a constant per occurrence. |
| `COUNT` | `count` | Count occurrences. |
| `HELP` | `help` | Print help and terminate with `SystemExit(0)`. |
| `VERSION` | `version` | Print `version` and terminate with `SystemExit(0)`. |

This complete command demonstrates the seven actions that produce values. Save it as `app/console/commands/inspect_options_command.py`:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand
from orionis.console.enums.actions import ArgumentAction


class InspectOptionsCommand(BaseCommand):
    signature = "app:inspect-options"
    description = "Inspect parsed command options."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="--format", action=ArgumentAction.STORE,
                 choices=("json", "csv"), default="json"),
        Argument(name_or_flags="--preview", action="store_const",
                 const="preview", default="write", dest="mode"),
        Argument(name_or_flags="--verbose", action="store_true", default=False),
        Argument(name_or_flags="--no-color", action="store_false",
                 default=True, dest="color"),
        Argument(name_or_flags="--tag", action="append", default=[]),
        Argument(name_or_flags="--email", action="append_const",
                 const="email", default=[], dest="channels"),
        Argument(name_or_flags=("-v", "--verbosity"), action="count", default=0),
    ]

    async def handle(self) -> int:
        self.table(
            ["Key", "Value"],
            [[key, repr(value)] for key, value in self.getArguments().items()],
        )
        return 0
```

```shell
orionis app:inspect-options --format csv --preview --verbose --no-color --tag urgent --tag paid --email --email -vv
```

```shell
python -B reactor app:inspect-options --format csv --preview --verbose --no-color --tag urgent --tag paid --email --email -vv
```

Results are `format="csv"`, `mode="preview"`, `verbose=True`, `color=False`, `tag=["urgent", "paid"]`, `channels=["email", "email"]` and `verbosity=2`.

Use `default=[]` for `append` and `append_const`, and `default=0` for `count`. In this implementation, the default sentinel cannot serve as an accumulator: without those defaults, the first occurrence can raise `AttributeError` or `TypeError`. Constant and boolean actions do not accept `type_`: Orionis rejects it before parser construction. Do not use `type_=bool` to interpret the text `"false"`.

Help and version actions can use names different from the reserved flags:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand
from orionis.console.enums.actions import ArgumentAction


class ApplicationInfoCommand(BaseCommand):
    signature = "app:info"
    description = "Show application CLI information."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="--usage", action=ArgumentAction.HELP),
        Argument(
            name_or_flags="--release", action=ArgumentAction.VERSION,
            version="Example application CLI",
        ),
    ]

    async def handle(self) -> int:
        self.writeLine("Use --usage or --release for CLI information.")
        return 0
```

Save it in `app/console/commands/application_info_command.py` and run:

```shell
orionis app:info --usage
python -B reactor app:info --release
```

`--usage` prints command help; `--release` prints the configured text. Both terminate with code `0` before executing `handle()`. Native `--help` remains available on every command.

<a id="argument-conversion"></a>

## Conversion, choices, aliases and dest

Define custom converters at module level so the loader can import them when reconstructing metadata. For example, in `app/console/types.py`:

```python
import argparse


def positive_integer(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("Expected an integer.") from error
    if number < 1:
        raise argparse.ArgumentTypeError("Expected a positive integer.")
    return number
```

In your command's argument list:

```python
from app.console.types import positive_integer
from orionis.console import Argument

arguments = [
    Argument(
        name_or_flags=("-l", "--limit"), type_=positive_integer,
        choices=(10, 50, 100), default=10, dest="row_limit", metavar="ROWS",
        help="Maximum number of rows.",
    ),
]
```

`--limit 50` and `-l 50` produce `row_limit=50`. `--limit 0` fails in the converter; `--limit 25` fails the `choices` check. Choices are integers because they are compared after conversion. Use a tuple or list of flags for short and long aliases, rather than a string containing them separated by spaces.

The loader uses `allow_abbrev=False`: write `--limit`, not `--lim`. You can pass `--limit=50` or `--limit 50`; use the parser's `--` separator for a positional value beginning with a hyphen when the command structure permits it.

<a id="base-getargument"></a>

## Read one value: getArgument()

```text
getArgument(key: str, default: Any | None = None) -> Any | None
```

Looks up the exact parser key, determined by `dest` or the option name. A missing key returns `default`; a present `None` is preserved. A non-string key raises `TypeError`. Do not use flag text with its hyphens: the usual key for `--row-limit` is `row_limit`.

<a id="base-getarguments"></a>

## Read all values: getArguments()

```text
getArguments() -> dict[str, Any]
```

Returns a shallow copy of the instance dictionary. Changing its keys does not change the original, but nested objects remain shared. Values have already been converted by the parser.

<a id="base-setarguments"></a>

## Assign values: setArguments()

```text
setArguments(args: dict[str, Any]) -> None
```

Reactor calls it before `handle()`. It merges the dictionary through `update`, without deleting earlier keys or running the parser. A non-dictionary value raises `TypeError`. It is also useful for isolated command tests:

```python
from orionis.console.base import BaseCommand

command = BaseCommand()
command.setArguments({"limit": 10, "optional": None})
command.setArguments({"limit": 20})
assert command.getArgument("limit") == 20
assert command.getArgument("optional", "fallback") is None
assert command.getArgument("missing", "fallback") == "fallback"
copy = command.getArguments()
copy["limit"] = 99
assert command.getArgument("limit") == 20
```

This example inspects state without invoking the base class's unimplemented `handle()`. For normal execution, do not call `setArguments()` manually: use Reactor and a list of CLI tokens.
