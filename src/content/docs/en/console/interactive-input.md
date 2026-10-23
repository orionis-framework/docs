---
title: "Questions and interactive input"
description: "Read text, secrets, confirmations and selections from an Orionis command."
editUrl: true
lastUpdated: false
---

`BaseCommand` inherits input methods from `Console` / `IConsole`. Inside a command, call `self.ask()`, `self.confirm()`, `self.secret()`, `self.choice()` or `self.anticipate()` directly; you do not need to import or instantiate `Console`. These are synchronous stdin calls: they block while waiting for the user, even inside `async handle()`. They provide no business validation or global non-interactive mode. For automation, expose arguments or options and prompt only when the user has not supplied them.

<a id="console-ask"></a>
## Text: `ask()`

```text
ask(question: str) -> str
```

Displays `question.strip()` in the informational color and returns the result of `input()` as `str`. The input newline is removed, but other whitespace remains. Empty input is accepted. It does not convert numbers, repeat prompts or accept a default value.

```python
from orionis.console.base import BaseCommand


class GreetCommand(BaseCommand):
    signature = "app:greet-interactively"
    description = "Ask for a name and greet the user."

    async def handle(self) -> int:
        name = self.ask("Your name:").strip()
        if not name:
            self.error("A name is required")
            return 1
        self.writeLine(f"Hello, {name}!")
        return 0
```

The command is responsible for normalizing and validating `name`. An `EOFError` caused by closed input or a `KeyboardInterrupt` is not caught by `ask()`.

<a id="console-confirm"></a>
## Confirmations: `confirm()`

```text
confirm(question: str, *, default: bool = False) -> bool
```

Returns `default` when Enter is pressed without text. Otherwise it converts the response to uppercase and returns `True` only for `Y` or `YES`; any other input returns `False`. It does not repeat the prompt. Whitespace is not trimmed: `" yes "` is not affirmative. The displayed indicator is always `(Y/n)`, even with `default=False`; use the argument to determine the actual default behavior.

```python
from orionis.console.base import BaseCommand


class ConfirmReportCommand(BaseCommand):
    signature = "app:confirm-report"
    description = "Confirm whether to prepare a report."

    async def handle(self) -> int:
        if not self.confirm("Prepare the report?", default=False):
            self.writeLine("No report was requested")
            return 0
        self.writeLine("Report preparation confirmed")
        return 0
```

Use text for `question` and a boolean for `default`; there is no additional type validation. Stdin errors propagate.

<a id="console-secret"></a>
## Hidden input: `secret()`

```text
secret(question: str) -> str
```

Builds a prompt from `question.strip()` and delegates to `getpass.getpass()`. Returns the input text without length validation or a default value. Use it to read a credential without explicitly writing it to command output.

```python
from orionis.console.base import BaseCommand


class CheckCredentialCommand(BaseCommand):
    signature = "app:check-credential"
    description = "Check whether a credential was provided."

    async def handle(self) -> int:
        credential = self.secret("API credential:")
        if not credential:
            self.error("A credential is required")
            return 1
        self.success("Credential received")
        return 0
```

Hiding input depends on the terminal and `getpass`: if echo cannot be disabled, it may warn and fall back to ordinary input. Orionis adds no encryption, persistence or automatic redaction of the resulting string. Read errors and user interruption propagate.

<a id="console-choice"></a>
## Select an item: `choice()`

```text
choice(question: str, choices: list, default_index: int = 0) -> str
```

`choices` contains the text options. `default_index` is the **zero-based** index selected by Enter; the visible menu numbers items **from one**. The function returns the selected element, not its index.

When input is not a valid number in range, it repeats `Please select a valid number:` until a valid selection is entered. Only the initial empty response selects the default; empty input during the retry loop remains invalid. It does not support multiple selection or selecting by name.

```python
from orionis.console.base import BaseCommand


class ChooseReportCommand(BaseCommand):
    signature = "app:choose-report"
    description = "Choose an output format."

    async def handle(self) -> int:
        output_format = self.choice(
            "Report format",
            ["csv", "json", "html"],
            default_index=1,
        )
        self.writeLine(f"Selected format: {output_format}")
        return 0
```

Raises `ValueError` when `choices` is empty or `default_index` is outside its range. Incompatible types and stdin errors propagate. Although annotated `str`, the implementation returns the list element directly; use strings to preserve that contract.

<a id="console-anticipate"></a>
## Complete a prefix: `anticipate()`

```text
anticipate(question: str, options: list, default: None = None) -> str
```

Reads a string and returns the **first** option whose `startswith(input)` is true, preserving order and case. If there is no match, returns `default or input`. It provides no dynamic menu while typing, does not check uniqueness and does not restrict the response to the list.

The signature declares `default: None`, although the implementation uses that value as a fallback. With the default `None`, unmatched input is returned unchanged. Empty input matches any string: a nonempty list therefore returns its first element.

```python
from orionis.console.base import BaseCommand


class SuggestRegionCommand(BaseCommand):
    signature = "app:suggest-region"
    description = "Complete a region name from its prefix."

    async def handle(self) -> int:
        regions = ["europe", "europe-west", "america"]
        region = self.anticipate("Region prefix:", regions)
        if region not in regions:
            self.error("Choose a supported region")
            return 1
        self.writeLine(f"Selected region: {region}")
        return 0
```

`eu` selects `europe` without asking for disambiguation; `America` does not match `america`. With `options=[]`, it returns the input or fallback. Options must support `.startswith(str)`; type and input errors propagate.

<a id="input-testing"></a>
## Input tests outside a command

Outside a command, a test can explicitly construct `Console` to verify the input component. Replace stdin and `getpass` to avoid real interaction. This example checks the difference between empty input, affirmative input and surrounding whitespace:

```python
from unittest import TestCase
from unittest.mock import patch
from orionis.console import Console


class InputTest(TestCase):
    def test_confirm(self) -> None:
        console = Console()
        with patch("builtins.input", return_value=""):
            self.assertFalse(console.confirm("Continue?", default=False))
        with patch("builtins.input", return_value="yes"):
            self.assertTrue(console.confirm("Continue?"))
        with patch("builtins.input", return_value=" yes "):
            self.assertFalse(console.confirm("Continue?"))

    def test_secret(self) -> None:
        with patch("getpass.getpass", return_value="example-secret"):
            self.assertEqual(Console().secret("Credential:"), "example-secret")
```

Use [arguments and options](/en/console/commands-and-arguments) for non-interactive processes. See [text and tables](/en/console/console-output) to display results.
