---
title: "Debug"
description: "Inspect values with Debug.dump() and Debug.dd(), using console output or an HTTP diagnostic page."
editUrl: true
lastUpdated: false
---

Since Orionis **1.0.12**, the `Debug` facade provides access to the built-in dumper service to inspect one or more values:

```python
from orionis.support.facades import Debug

data = {"report_id": 7, "status": "ready"}
Debug.dump(data)
Debug.dd(data)
```

`dump()` prints values and continues. `dd()` displays values and interrupts execution according to the context. Neither returns the inspected data or a response that your controller should return.

## Availability and synchronous calls

Use `Debug` after the application has completed booting. The built-in `DumperProvider` registers `IDumper` as a singleton and pins the facade during `boot()`: you do not need a custom provider or a call to `Debug.pin()` in your application.

Both methods are **synchronous**, including inside an `async` controller. Call them without `await`:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Debug


class ReportController:
    async def show(self) -> JSONResponse:
        data = {"report_id": 7, "status": "ready"}
        Debug.dump(data, show_types=True)
        return JSONResponse(data)
```

The client receives the usual JSON response; the dump appears in the server console. Before boot, use the standalone helper described below. See [Synchronous and asynchronous facades](/en/application/container/facades) for general facade dispatch rules.

## `dump()`: inspect and continue

<a id="debug-method-dump"></a>

`Debug.dump(*args, ...) -> None` accepts multiple positional values, prints their representation to the console and returns `None`. The command or HTTP request continues, and its response remains unchanged.

```python
from orionis.support.facades import Debug

Debug.dump(
    {"report_id": 7},
    ["api", "web"],
    show_types=True,
    show_index=True,
    max_depth=3,
)
```

## `dd()`: inspect and stop

<a id="debug-method-dd"></a>

`Debug.dd(*args, ...) -> None` accepts the same values and options as `dump()`. Its effect depends on the context:

| Context | Result |
| --- | --- |
| HTTP dispatch with `app.debug=True` | Interrupts the request and the kernel returns an HTML page containing the values. The server continues handling other requests. Works with ASGI and RSGI. |
| HTTP dispatch with `app.debug=False` | The kernel rejects the dump as a `RuntimeError` and sends it to the ordinary error handler, without rendering the values. |
| Console or execution outside the HTTP context | Prints to the console and terminates the process with exit code `1`. |

For example, during a development request:

```python
from orionis.support.facades import Debug


class ReportController:
    async def show(self) -> None:
        data = {"report_id": 7, "status": "ready"}
        Debug.dd(data, show_types=True)
```

The diagnostic page includes the caller's file and line, and uses `Cache-Control: no-store`. You do not need `return Debug.dd(...)`: the kernel handles the interruption and HTML response. Let that interruption reach the kernel if your code catches exceptions.

An HTTP dump must happen during request dispatch, before response sending begins. Do not use it inside a streaming generator once the body is being transmitted. Outside the HTTP exception boundary, it propagates as a runtime error.

In the standard configuration, `APP_DEBUG` supplies `app.debug`. Disabling debug mode blocks the HTML page from `dd()`; `dump()` still writes to the console. Use these calls temporarily with data appropriate for their destination.

## Shared options

Pass every option by name to `dump()` or `dd()`:

| Option | Default | Effect |
| --- | --- | --- |
| `show_types: bool` | `False` | Includes each value's type. |
| `show_index: bool` | `False` | Numbers the supplied values. |
| `expand_all: bool` | `True` | Expands nested structures. |
| `max_depth: int \| None` | `None` | Limits depth; `None` imposes no limit. |
| `module_path: str \| None` | `None` | Overrides the file or module shown in the header. HTTP `dd()` detects the caller's file when omitted. |
| `line_number: int \| None` | `None` | Overrides the displayed line. HTTP `dd()` detects the call's line when omitted. |
| `redirect_output: bool` | `False` | Enables handling of the original console streams. Does not change the HTML destination of HTTP `dd()`. |
| `insert_line: bool` | `False` | Adds spacing around the dump. |

For `dd()` outside HTTP, `redirect_output=False` terminates through `sys.exit(1)` and `redirect_output=True` uses `os._exit(1)`, which ends the process immediately.

## Scripts and debugging during boot

The `Dumper` helper retains the same synchronous API and can be used directly without initializing the container:

```python
from orionis.console import Dumper

Dumper.dump({"phase": "bootstrap"})
```

`Dumper` remains exported from `orionis.console`; the new export from `orionis.support.facades` is named `Debug`. To integrate the service through injection, use the `orionis.console.debug.contracts.dumper.IDumper` contract.

The template global [`dump(*values)`](/en/views/globals#dumpvalues) returns HTML to insert into a view; it is a different API from `Debug.dump()`, which writes to the console.

Implementation: [Debug](https://github.com/orionis-framework/framework/blob/64fd20a92/orionis/support/facades/debug.py), [Dumper](https://github.com/orionis-framework/framework/blob/64fd20a92/orionis/console/debug/dumper.py) and [DumperProvider](https://github.com/orionis-framework/framework/blob/64fd20a92/orionis/console/debug/provider.py).
