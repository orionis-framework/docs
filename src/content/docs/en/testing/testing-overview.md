---
title: Overview
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Testing Overview

Orionis ships with a fully integrated testing subsystem that removes the friction of setting up a test environment. Instead of booting the application manually or mocking framework internals, every test method executes inside the real application context — the service container is live, configuration values are loaded, and all registered providers have been bootstrapped. This lets you verify behavior exactly as it will run in production.

The subsystem is composed of four main pieces:

| Component | Responsibility |
|---|---|
| `TestCase` | Base class that every test extends. Provides async support and automatic application-context injection |
| `TestingEngine` | Coordinates discovery, filtering, execution, console output, and result caching |
| `TestResult` | Immutable dataclass holding the full outcome of a single test method |
| `TestStatus` | String enumeration representing the four possible outcomes of a test |

---

## Architecture

At the highest level, the flow is:

1. The `TestingEngine` reads its defaults from the application configuration (`config/testing.py`).
2. It scans the configured directory for test files matching a glob pattern.
3. Within those files, it filters individual methods by a second glob pattern.
4. The engine hands the resulting test suite to the `TestRunner`, which executes each test inside the application context.
5. As each test finishes, the `TestResultProcessor` records an immutable `TestResult` and renders it to the console according to the configured verbosity.
6. After all tests complete, the runner displays a summary table with counts per status and total execution time.
7. If caching is enabled, the full list of results is persisted as a timestamped JSON file.

The entire run is asynchronous — the engine offloads test execution to a thread pool so that the event loop remains unblocked.

---

## Configuration

All testing defaults are declared in the `BootstrapTesting` dataclass at `config/testing.py`. The framework reads these values during bootstrapping and passes them to the `TestingEngine` constructor automatically.

```python
from orionis.foundation.config.testing.entities.testing import Testing
from orionis.foundation.config.testing.enums import VerbosityMode

class BootstrapTesting(Testing):
    verbosity: int | VerbosityMode = VerbosityMode.DETAILED
    fail_fast: bool = False
    start_dir: str = "tests"
    file_pattern: str = "test_*.py"
    method_pattern: str = "test*"
    cache_results: bool = False
```

### Option Reference

| Option | Type | Default | Description |
|---|---|---|---|
| `verbosity` | `int \| VerbosityMode` | `DETAILED` (2) | Controls the amount of detail printed per test. See the **Verbosity Levels** section below |
| `fail_fast` | `bool` | `False` | When `True`, execution halts immediately after the first failure or error. Remaining tests are not collected |
| `start_dir` | `str` | `"tests"` | Relative path to the root directory where the engine begins scanning for test files |
| `file_pattern` | `str` | `"test_*.py"` | Glob pattern applied against file names in the start directory (and subdirectories). Only files matching this pattern are loaded |
| `method_pattern` | `str` | `"test*"` | Glob pattern applied against method names inside each discovered test class. Only methods matching this pattern are executed |
| `cache_results` | `bool` | `False` | When `True`, the engine serializes all `TestResult` objects to a JSON file after execution completes |

:::tip[Override at runtime]
Every option can also be overridden programmatically through the `TestingEngine` fluent API without touching the configuration file. This is useful for running a quick subset of tests during development.
:::

### VerbosityMode Enum

The `VerbosityMode` enumeration provides named constants for the three verbosity levels:

| Member | Value | Behavior |
|---|---|---|
| `VerbosityMode.SILENT` | `0` | No per-test output. Only the summary table is displayed after all tests finish |
| `VerbosityMode.MINIMAL` | `1` | One compact line per test: status badge, fully qualified name, dot filler, and execution time |
| `VerbosityMode.DETAILED` | `2` | A Rich panel per test with full metadata. Failures and errors include the exception message and the source code surrounding the offending line |

---

## Verbosity Levels in Detail

### Silent — `VerbosityMode.SILENT` (0)

The engine runs all tests without printing individual results. After the suite finishes, only the summary table appears. This mode is useful in CI pipelines where you only care about the final pass/fail signal.

### Minimal — `VerbosityMode.MINIMAL` (1)

Each test produces a single line that fits the terminal width:

```
 PASSED  • tests.unit.test_user.TestUserService.testCreatesUser ............. • ~ 0.003s
 FAILED  • tests.unit.test_user.TestUserService.testBadLogic ................ • ~ 0.012s
 SKIPPED • tests.unit.test_user.TestUserService.testPending ................. • ~ 0.000s
```

The status badge is color-coded: green for passed, magenta for failed, red for errored, and yellow for skipped. If the test name is too long for the terminal, it is truncated with an ellipsis to prevent line wrapping.

### Detailed — `VerbosityMode.DETAILED` (2)

Each test renders a bordered Rich panel containing:

- **ID** — the Python object ID of the test instance
- **Name** — fully qualified test identifier (`module.class.method`)
- **Class** — the test class name
- **Method** — the test method name
- **Module** — the module path
- **File path** — absolute path to the source file

For tests that **pass** or are **skipped**, the panel shows the above metadata with the execution time in the subtitle.

For tests that **fail** or **error**, the panel additionally includes:

- The exception class name and the error message
- A snippet of the source code around the offending line (typically 3–4 lines), with the exact line highlighted using a `*|` marker

:::danger[FAILED ~ 0.012s]
🔑 **ID:** 140234821907 | 📌 **Name:** tests.test_user.TestUserService.testBadLogic

📁 **Class:** TestUserService | 🔧 **Method:** testBadLogic | 📦 **Module:** tests.test_user

📄 **Path:** /app/tests/test_user.py:25

❌ **AssertionError:** 1 != 2

```python
  | 23:     def testBadLogic(self):
  | 24:         result = 1
 *| 25:         self.assertEqual(result, 2)
```
:::

Errored tests display the `💥` icon instead of `❌` and use a red border.

---

## Console Output

Regardless of the verbosity level, the engine always renders two panels that frame the test run:

### Start Panel

Displayed before the first test executes. Contains:

- **Suite title** — `🚀 Orionis TestSuite`
- **Started at** — timestamp in `YYYY-MM-DD HH:MM:SS` format, using the configured application timezone
- **PID** — process ID of the running Python process
- **Reactor Loop Policy** — name of the active asyncio event loop policy (e.g. `DefaultEventLoopPolicy`)
- **Stop instruction** — a reminder to press `Ctrl+C` to interrupt

### Summary Table

Displayed after the last test finishes. A tabular view with five columns:

| Total | Passed | Failed | Errored | Skipped |
|:---:|:---:|:---:|:---:|:---:|
| 42 | 40 | 1 | 0 | 1 |

The table caption shows the total execution time in seconds with millisecond precision.

---

## Result Caching

When `cache_results` is set to `True` in `config/testing.py`, the engine writes a JSON file after every run. The file is stored at:

```
storage/framework/cache/testing/<unix_timestamp>.json
```

### File Format

The JSON file contains an array of objects, one per executed test. Each object includes every field from the `TestResult` dataclass, with `TestStatus` values serialized as their string representation:

```json
[
    {
        "id": 140234821907,
        "name": "tests.test_user.TestUserService.testCreatesUser",
        "status": "PASSED",
        "execution_time": 0.003,
        "error_message": null,
        "traceback": null,
        "class_name": "TestUserService",
        "method": "testCreatesUser",
        "module": "tests.test_user",
        "file_path": "/app/tests/test_user.py",
        "doc_string": "Create a user and persist it.",
        "exception": null,
        "line_no": null,
        "source_code": []
    }
]
```

### Use Cases

- **CI/CD integration** — parse the JSON file in your pipeline to extract pass/fail counts, identify flaky tests, or generate reports
- **Historical tracking** — accumulate timestamped files over time to detect performance regressions or increasing failure rates
- **Custom dashboards** — feed the results into a monitoring tool or database for visualization

The cache folder is created automatically if it does not exist. Each run produces a new file; old files are not overwritten or rotated.

---

## Test Statuses

Every executed test receives exactly one of four possible statuses, defined in the `TestStatus` enumeration:

| Status | String Value | When Assigned |
|---|---|---|
| `TestStatus.PASSED` | `"PASSED"` | The test method completed without raising any exception and all assertions succeeded |
| `TestStatus.FAILED` | `"FAILED"` | An `AssertionError` was raised — typically from a `self.assert*` call that did not hold |
| `TestStatus.ERRORED` | `"ERRORED"` | An unexpected exception (anything other than `AssertionError`) was raised during execution |
| `TestStatus.SKIPPED` | `"SKIPPED"` | The test was marked to be skipped, either via `@unittest.skip`, `@unittest.skipIf`, or `@unittest.skipUnless` |

`TestStatus` extends `StrEnum`, which means each member is simultaneously a string. You can compare members against plain strings, use them as dictionary keys, serialize them directly to JSON, or embed them in formatted strings without any conversion:

```python
from orionis.test.enums.status import TestStatus

status = TestStatus.PASSED

# String comparison
status == "PASSED"          # True

# Use as dictionary key
counts = {TestStatus.PASSED: 0, TestStatus.FAILED: 0}

# Direct string interpolation
print(f"Test result: {status}")   # "Test result: PASSED"
```

The enumeration contains exactly four members — no others exist or will be added.
