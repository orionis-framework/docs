---
title: "Results, configuration, and reference"
description: "reactor test options, discovery, verbosity, configuration, JSON reports, and the testing engine API."
editUrl: true
lastUpdated: false
---

Run tests from the application root, where `reactor` lives. All cases must extend `TestCase`, imported with `from orionis.test import TestCase`; see [creation and dependency injection](/en/testing/writing-and-running-tests) to prepare the first one.

## Run the suite

Both entry points execute the same command:

```bash
orionis test
python -B reactor test
```

With uv, use `uv run python -B reactor test`. The command starts the application and resolves its registered testing engine. Running `python -m unittest` directly skips that startup: `TestCase` methods that delegate to the application require it to be initialized already.

Inspect the options installed in your project:

```bash
orionis test --help
python -B reactor test --help
```

### Execution options

The command has no positional arguments. All these options are optional:

| Option | Value and effect |
| --- | --- |
| `--verbosity N`, `-v N` | Integer `0`, `1`, or `2`. Overrides `testing.verbosity`; configured default: `2`. |
| `--fail-fast N`, `-f N` | Integer: `1` stops at the first failure or error; `0` continues. Overrides `testing.fail_fast`, including with `0`. Configured default: `False`. |
| `--start-dir PATH`, `-s PATH` | Discovery directory. Configured default: `tests`. |
| `--file-pattern PATTERN` | Filename glob, initially `test_*.py`. |
| `--method-pattern PATTERN` | Glob filtering discovered methods, initially `test*`. |
| `--panel` | Enables the start and summary panels; the CLI default. |
| `--no-panel` | Disables start and summary panels and prevents clearing the console. Does not change per-result verbosity. |
| `--help`, `-h` | Shows help without executing tests. |

`--fail-fast` requires a value: write `--fail-fast 1`, rather than only `--fail-fast`. Although the parser accepts other integers, only `1` enables this CLI option; use `0` or `1`. Verbosity outside `0`, `1`, and `2` raises `ValueError`.

```bash
# Select a directory and a family of cases.
python -B reactor test --start-dir tests/unit --file-pattern "test_invoice*.py" --method-pattern "testCalculate*"

# Stop at the first failed or errored result.
orionis test --fail-fast 1 --verbosity 2

# Continue even when general configuration enables fail-fast.
python -B reactor test --fail-fast 0 --no-panel --verbosity 1
```

### Discovery and filters

The engine walks the starting directory and its subdirectories, even without `__init__.py`. It converts matching files into module names and imports them through the `unittest` loader. Keep the conventional `test_*.py` filenames and `test...` methods.

Patterns are globs evaluated with `fnmatch`, such as `test_user*.py`, `testCreate*`, or `test*Permission*`; they are not regular expressions. Method filtering applies to candidates discovered by the loader: it does not turn arbitrarily named methods into tests. Case sensitivity follows the platform.

A relative `start_dir` resolves from the process working directory. The application root determines module names and is added to the import path. Run from the project root and select its subdirectories, or provide an absolute path inside that project.

A missing directory or filters matching nothing produce an empty suite. The command returns `0` in that case; confirm that the summary contains the expected number of tests. Import failures represented by the loader remain errors even when the method filter does not match. Other exceptions during discovery, such as certain syntax errors, propagate and do not necessarily become a per-case result.

## Testing configuration

`config/testing.py` defines `BootstrapTesting(Testing)`, an immutable configuration with keyword-only arguments. Its six properties can be set in that file or through the environment variables it already reads:

| Property | Type and default | Environment variable |
| --- | --- | --- |
| `verbosity` | `int \| VerbosityMode`, `VerbosityMode.DETAILED` → `2` | `TESTING_VERBOSITY` |
| `fail_fast` | `bool`, `False` | `TESTING_FAIL_FAST` |
| `start_dir` | `str`, `"tests"` | `TESTING_START_DIR` |
| `file_pattern` | `str`, `"test_*.py"` | `TESTING_FILE_PATTERN` |
| `method_pattern` | `str`, `"test*"` | `TESTING_METHOD_PATTERN` |
| `cache_results` | `bool`, `False` | `TESTING_CACHE_RESULTS` |

For example, in `.env`:

```dotenv
TESTING_VERBOSITY=int:1
TESTING_FAIL_FAST=bool:false
TESTING_START_DIR=tests
TESTING_FILE_PATTERN=test_*.py
TESTING_METHOD_PATTERN=test*
TESTING_CACHE_RESULTS=bool:true
```

The prefixes produce actual types when configuration is constructed. Use `Env` in configuration files; at runtime, read these values through `IApplication.config()`. See [Environment](/en/environment) to configure loading and persistence.

To fix options directly in `config/testing.py`, retain the class and replace the appropriate fields:

```python
from dataclasses import dataclass

from orionis.foundation.config.testing import Testing, VerbosityMode


@dataclass(frozen=True, kw_only=True)
class BootstrapTesting(Testing):
    verbosity: int | VerbosityMode = VerbosityMode.MINIMAL
    fail_fast: bool = True
    start_dir: str = "tests/unit"
    file_pattern: str = "test_*.py"
    method_pattern: str = "test*"
    cache_results: bool = True
```

### Validation and precedence

`Testing` normalizes `VerbosityMode` to its integer. Only `0`, `1`, and `2` are allowed; a boolean is not valid verbosity. `fail_fast` and `cache_results` must be actual booleans, rather than `1` or strings. The other three fields must be nonempty strings containing more than whitespace. Invalid types raise `TypeError`; out-of-range verbosity or blank strings raise `ValueError`. This validation does not check that the directory exists.

Normal precedence is **CLI option → application configuration → engine default**. Omitting an option retains configuration; explicit `--verbosity 0` and `--fail-fast 0` win. An empty CLI string for a directory or pattern falls back to configuration.

The engine supports applications missing individual keys: its fallbacks are `2`, `False`, `tests`, `test_*.py`, `test*`, and `False`, respectively. Panels are controlled by the CLI or `withoutPanel()`; `Testing` has no `with_panel` field.

## Verbosity and panels

| Value | Enum | Per-result output |
| --- | --- | --- |
| `0` | `VerbosityMode.SILENT` | Does not print each result. |
| `1` | `VerbosityMode.MINIMAL` | Compact line with status, identifier, and duration. Long names may be visually truncated. |
| `2` | `VerbosityMode.DETAILED` | Panel with name, class, method, module, and file. Failures and errors add the exception, message, and available source context. |

Outer panels are independent: startup shows the date, PID, and loop information; the summary shows totals by status and duration. `--verbosity 0` retains both unless you also supply `--no-panel`.

```bash
# No runner presentation; tests can still print their own output.
python -B reactor test --verbosity 0 --no-panel

# One line per result, without clearing the terminal or showing outer panels.
python -B reactor test --verbosity 1 --no-panel
```

`--no-panel` does not disable individual verbosity-`2` panels. The command does not expose flags for stdout capture, parallel execution, coverage, or JSON on standard output.

## Statuses and exit code

`TestStatus` is a string enum:

| Status | Meaning |
| --- | --- |
| `PASSED` | The case completed without a failure or error. |
| `FAILED` | An assertion failed. Includes an unexpected success marked with `expectedFailure`. |
| `ERRORED` | An exception other than an assertion failure occurred. |
| `SKIPPED` | Skipped case or expected failure. |

The CLI returns **`1` for any `FAILED` or `ERRORED` result, and `0` otherwise**, including an empty list. Preserve this code in continuous integration. Fail-fast stops subsequent cases after a failure, error, or unexpected success; it also applies to failing subtests. It is not a timeout and does not skip case cleanup.

A failing subtest exports its identity with `subTest()` parameters. Successful subtests do not generate separate entries. Totals count recorded outcomes and can differ from the method count when several subtests fail or additional lifecycle errors occur.

## JSON results

Enable `cache_results=True` in configuration or `TESTING_CACHE_RESULTS=bool:true` in `.env`, then run normally:

```bash
python -B reactor test --verbosity 1 --no-panel
```

The engine creates the directory and writes a JSON list at:

```text
storage/framework/cache/testing/<timestamp-in-seconds>.json
```

Its actual base is `app.path("storage_framework")`; customizing that path changes the destination. **There is no `--json` option**: JSON is a file independent of console presentation. It is saved after the runner, including failed results or an empty list. An exception preventing discovery or the runner from completing can prevent that write; file-writing errors propagate.

Example structure for a successful result; identifiers, paths, and durations vary by run:

```json
[
  {
    "id": 123456,
    "name": "tests.unit.test_totals.TotalTest.testTotal",
    "status": "PASSED",
    "execution_time": 0.002,
    "error_message": null,
    "traceback": null,
    "class_name": "TotalTest",
    "method": "testTotal",
    "module": "tests.unit.test_totals",
    "file_path": "/srv/project/tests/unit/test_totals.py",
    "doc_string": null,
    "exception": null,
    "line_no": null,
    "source_code": []
  }
]
```

Each entry corresponds to an immutable `TestResult`:

| Field | Content |
| --- | --- |
| `id` | Python identity of the case or subtest object during that run; not persistent. |
| `name` | Full `test.id()` or subtest name; useful for comparing reports. |
| `status` | One of the four `TestStatus` strings. |
| `execution_time` | Seconds from case startup until recording the outcome. |
| `error_message` | Exception text, or `None`. |
| `traceback` | List of formatted traceback fragments, or `None`. |
| `class_name`, `method`, `module` | Case metadata. |
| `file_path` | Class source file when inspectable, or `None`. |
| `doc_string` | Method docstring, or `None`. |
| `exception` | Exception class name, or `None`. |
| `line_no` | Line associated with detected error context, or `None`. |
| `source_code` | `(line_number, code)` pairs; two-element lists in JSON. May be empty. |

The first four fields are required when constructing `TestResult`; the others accept `None`. The processor uses `[]` when it extracts no code. `toDict()` returns the representation used by the engine. An ordinary skip does not retain its reason in a separate field; an expected failure preserves diagnostics despite exporting `SKIPPED`.

Filenames have one-second resolution: two executions in that second use the same path, and the last can overwrite the first. There is no automatic retention or filename selector. These files are reports; they do not prevent tests from running again. With compiled configuration, follow [application caching](/en/application/paths-and-caching) to update it.

## Engine and Test facade

Within an initialized application, resolve the contract and configure execution:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.test.contracts.engine import ITestingEngine
from orionis.test.entities.result import TestResult


async def runSelectedTests(app: IApplication) -> list[TestResult]:
    engine = await app.make(ITestingEngine)
    engine.setStartDir("tests/unit")
    engine.setFilePattern("test_*.py")
    engine.setMethodPattern("testCalculate*")
    engine.setVerbosity(0)
    engine.setFailFast(fail_fast=True)
    engine.withoutPanel()
    return await engine.run()
```

You can also declare `engine: ITestingEngine` as a parameter of a container-invoked component. Import the facade from `orionis.support.facades`; after resolving that service, its instance is pinned:

```python
from orionis.support.facades import Test


async def runUnitSuite():
    engine = await Test.resolve()
    engine.setStartDir("tests/unit").setVerbosity(1).withoutPanel()
    return await Test.run()
```

The provider registers `ITestingEngine → TestingEngine` as a deferred singleton and pins the facade instance when starting that service. Explicit resolution allows synchronous configuration without depending on whether the facade was already pinned. Do not recursively execute a suite from a test included in that suite.

| Actual signature | Operation |
| --- | --- |
| `setVerbosity(verbosity: int) -> Self` | Presentation level. Use `0`, `1`, or `2`; the setter does not validate the range like the CLI does. |
| `setFailFast(*, fail_fast: bool) -> Self` | First-failure stopping; keyword-only argument. |
| `setStartDir(start_dir: str) -> Self` | Discovery directory. |
| `setFilePattern(file_pattern: str) -> Self` | Filename glob. |
| `setMethodPattern(method_pattern: str) -> Self` | Method glob and `TestCase` context-local pattern. |
| `withoutPanel() -> Self` | Disables startup and summary. The contract has no inverse setter. |
| `discover() -> unittest.TestSuite` | New suite, without execution or JSON. |
| `async run() -> list[TestResult]` | Discovers, executes, saves JSON when enabled, and returns outcomes. |

`TestingEngine(app: IApplication)` reads configuration and paths at construction. Setters return the same instance and retain changes: subsequent in-process runs inherit them. `run()` moves the runner to a thread to avoid blocking the caller's loop; it does not run cases in parallel. Each `TestCase` has an isolated loop; databases and services need their own isolation strategy.

## Runner and result processing

Normally use the CLI or `ITestingEngine`. For an integration with an already initialized application, the runner exposes:

```text
TestRunner(
    verbosity: int = 0,
    failfast: bool = False,
    buffer: bool = False,
    warnings: str | None = None,
    with_panel: bool = True,
    **kwargs: dict,
)
```

`run(test: unittest.suite.TestSuite) -> unittest.result.TestResult` executes a prepared suite and returns `TestResultProcessor` by default. It does not discover tests or write JSON. `buffer` controls standard capture during cases; `warnings` controls the warning filter. Additional arguments pass through to `unittest.TextTestRunner`, including `stream`, `descriptions`, `tb_locals`, and `durations`. Rich uses its own console: `stream` alone does not redirect its panels. Orionis summaries do not add a duration ranking.

`TestResultProcessor(stream=None, descriptions=None, verbosity=None, **kwargs)` retains outcomes and exposes `getTestResults() -> list[TestResult]`. It integrates with `unittest` callbacks:

| Callback | Orionis behavior |
| --- | --- |
| `startTest(test)` | Starts case timing. |
| `addSuccess(test)` | Records and prints `PASSED`. |
| `addFailure(test, err)` | Records `FAILED` with diagnostics. |
| `addError(test, err)` | Records `ERRORED` with diagnostics. |
| `addSkip(test, reason)` | Records `SKIPPED`. |
| `addSubTest(test, subtest, err)` | Adds a result on failure; retains parameterized identity. |
| `addExpectedFailure(test, err)` | Exports `SKIPPED` with the expected exception. |
| `addUnexpectedSuccess(test)` | Exports `FAILED` with an explanatory `AssertionError`. |

The runner calls `startTestRun()` and guarantees `stopTestRun()` through `finally` when that protocol is available. Ordinary case exceptions become results; an exception from the suite object itself can propagate. Processor storage is per-instance, and `getTestResults()` returns its list rather than a copy.

Class preparation errors have a limitation: if `setUpClass()` fails before the first case starts, the processor has no timer yet and can raise `AttributeError` rather than produce an `ERRORED` result. Do not rely on receiving a complete JSON report in that scenario; retain the process exit code and output too. This does not prevent using `setUpClass()` for successful preparation.

Continue with [cases and decorators](/en/testing/cases-and-decorators), or return to [Tests](/en/testing).
