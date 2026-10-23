---
title: "Progress"
description: "Display progress through inherited BaseCommand methods and perform asynchronous pauses."
editUrl: true
lastUpdated: false
---

<a id="console-progressbar"></a>
<a id="progress-bar"></a>
## Create a progress bar

`BaseCommand` already exposes the inherited `self.progressBar` property: **inside a command, you do not need to import or construct `ProgressBar`**. Each access returns a new instance, annotated as `IProgressBar`. Keep it once and use that same bar throughout the operation.

This command sets its public `total` and `bar_width` attributes before starting:

```python
from orionis.console.base import BaseCommand


class ProcessBatchCommand(BaseCommand):
    signature = "app:process-batch"
    description = "Process a small batch with progress output."

    async def handle(self) -> int:
        records = ["customer-1", "customer-2", "customer-3"]
        if not records:
            self.writeLine("No records to process")
            return 0
        bar = self.progressBar
        bar.total = len(records)
        bar.bar_width = 24
        bar.start()
        for record in records:
            # Replace this pause with the actual asynchronous operation.
            await self.sleep(0.01)
            bar.advance()
        bar.finish()
        self.writeLine(f"Processed {len(records)} records")
        return 0
```

Without changing its attributes, `self.progressBar` uses `total=100` and `bar_width=50`. Repeating `self.progressBar.advance()` constructs another bar on every iteration; always use the saved `bar` reference.

<a id="progress-bar-start"></a>
<a id="progress-bar-advance"></a>
<a id="progress-bar-finish"></a>
## Advance and finish

| Signature | Effect and result |
| --- | --- |
| `start() -> None` | Sets progress to `0` and renders the bar. |
| `advance(increment: int = 1) -> None` | Adds `increment`, limits the upper result to `total` and redraws. |
| `finish() -> None` | Sets progress to `total`, redraws, adds a newline and flushes. |

All three return `None`. Advance in batches with, for example, `bar.advance(25)`. `finish()` displays 100% even when not all work has been advanced; call it when the operation actually completes, rather than unconditionally indicating success from a `finally` block.

<a id="progress-bar-fields"></a>
### Public state

| Attribute | Initial value | Meaning |
| --- | --- | --- |
| `total` | The `total` argument, default `100`. | Total work used as the divisor. |
| `bar_width` | The `width` argument, default `50`. | Rendering width in characters. |
| `progress` | `0`. | Accumulated work; `start()` resets it. |

Use positive integers for `total` and `width`, and nonnegative increments. **The implementation does not enforce these restrictions**: `total=0` raises `ZeroDivisionError` when rendering; negative increments can produce negative progress, with no lower bound. Incompatible types and stream errors propagate. The bar uses carriage returns and Unicode blocks without checking `isatty()`, so redirected logs may retain these characters. Avoid interleaving messages with updates to the same bar when clean output is required.

<a id="console-sleep"></a>
## Cooperative pauses

```text
async sleep(seconds: float) -> None
```

`await self.sleep(seconds)` delegates to `asyncio.sleep(seconds)`, yields to the event loop and returns `None`. `await self.sleep(0)` yields without a positive delay. It adds no validation or policy of its own; argument errors and cancellation follow asyncio behavior. It does not make prompts or printing asynchronous.

<a id="progress-bar-construction"></a>
## Use ProgressBar outside a command

A component that does not extend `BaseCommand` can explicitly import and construct the bar. This is the alternative for independent usage; inside a command, keep the `bar = self.progressBar` pattern.

```text
ProgressBar(total: int = 100, width: int = 50) -> None
```

`total` is the work representing 100%; `width` is the number of characters. The constructor captures the write and flush methods of the current stdout. It does not create a background task, persist progress or validate arguments.

```python
from orionis.console import ProgressBar

bar = ProgressBar(total=3, width=24)
bar.start()
for _ in range(3):
    bar.advance()
bar.finish()
```

Use inherited [text and table](/en/console/console-output) methods to display command results; see [questions and interactive input](/en/console/interactive-input) to request user input.
