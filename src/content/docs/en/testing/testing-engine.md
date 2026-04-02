---
title: TestingEngine
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# TestingEngine

The `TestingEngine` is the central coordinator of the testing subsystem. It reads configuration from the application, discovers test files and methods, executes them asynchronously, manages console output, and optionally persists results to a JSON cache. All setter methods return `self`, enabling a fully fluent configuration style.

## Import

```python
from orionis.test.core.engine import TestingEngine
```

---

## Creating an Engine Instance

The engine is constructed from the application instance. During construction, it reads every testing-related configuration value (`verbosity`, `fail_fast`, `start_dir`, `file_pattern`, `method_pattern`, `cache_results`) and uses them as defaults for the current run:

```python
from orionis.test.core.engine import TestingEngine

engine = TestingEngine(app)
```

The constructor also initializes:

- An internal `unittest.TestSuite` that will hold discovered tests
- The **cache folder** path at `storage/framework/cache/testing/` (derived from the application's `storage` path)

---

## Fluent Configuration

Every setter returns `self`, so you can chain multiple configuration changes in a single expression. These overrides apply **only to the current engine instance** — they do not modify `config/testing.py`.

```python
engine = (
    TestingEngine(app)
    .setVerbosity(1)
    .setFailFast(fail_fast=True)
    .setStartDir("tests/unit")
    .setFilePattern("test_*.py")
    .setMethodPattern("check*")
)
```

### setVerbosity

Controls the amount of output printed per test during execution.

```python
engine.setVerbosity(0)   # Silent — only the summary table
engine.setVerbosity(1)   # Minimal — one line per test
engine.setVerbosity(2)   # Detailed — Rich panel per test
```

| Parameter | Type | Description |
|---|---|---|
| `verbosity` | `int` | `0` for silent, `1` for minimal, `2` for detailed |

**Returns:** `Self` — the same engine instance for chaining.

### setFailFast

Determines whether the engine stops execution as soon as the first failure or error occurs. Remaining tests are not executed.

```python
engine.setFailFast(fail_fast=True)    # Stop on first failure
engine.setFailFast(fail_fast=False)   # Run all tests regardless of failures
```

| Parameter | Type | Description |
|---|---|---|
| `fail_fast` | `bool` | `True` to halt on first failure, `False` to run all tests. Must be passed as a keyword argument |

**Returns:** `Self`

:::note[Keyword-only parameter]
`fail_fast` is a keyword-only parameter — `engine.setFailFast(True)` will raise a `TypeError`. Always use `engine.setFailFast(fail_fast=True)`.
:::

### setStartDir

Sets the root directory where test discovery begins. The engine scans this directory and all its subdirectories recursively.

```python
engine.setStartDir("tests")           # Default — scan the entire tests/ tree
engine.setStartDir("tests/unit")      # Only unit tests
engine.setStartDir("tests/feature")   # Only feature tests
```

| Parameter | Type | Description |
|---|---|---|
| `start_dir` | `str` | Relative path to the directory to scan |

**Returns:** `Self`

### setFilePattern

Sets the glob pattern used to match test file names. Only files matching this pattern are loaded by the discovery process.

```python
engine.setFilePattern("test_*.py")       # Default — files starting with test_
engine.setFilePattern("*_test.py")       # Files ending with _test
engine.setFilePattern("test_user*.py")   # Only user-related test files
```

| Parameter | Type | Description |
|---|---|---|
| `file_pattern` | `str` | Glob pattern, matched against the filename (not the full path) |

**Returns:** `Self`

### setMethodPattern

Sets the glob pattern used to identify test methods inside discovered classes. This method has a **dual effect**: it updates both the engine's internal filter and the `TestCase.setMethodPattern()` class-level pattern, ensuring consistency between discovery and the application-context wrapping performed by `TestCase.__getattribute__`.

```python
engine.setMethodPattern("test*")      # Default — methods starting with test
engine.setMethodPattern("check*")     # Methods starting with check
engine.setMethodPattern("test_user*") # Only user-related test methods
```

| Parameter | Type | Description |
|---|---|---|
| `method_pattern` | `str` | Glob pattern, matched against method names using `fnmatch` |

**Returns:** `Self`

:::caution[Side effect]
Calling `setMethodPattern` also calls `TestCase.setMethodPattern()`, which modifies a class-level attribute affecting all test classes. This synchronization is intentional — it ensures that the `TestCase.__getattribute__` hook wraps the same methods the engine discovers.
:::

---

## Test Discovery

### How Discovery Works

The `discover()` method performs a two-stage filtering process:

**Stage 1 — File discovery:** Uses `unittest.defaultTestLoader.discover()` to scan the `start_dir` recursively for files matching the `file_pattern`. Each matching file is imported, and all `TestCase` subclasses inside it are collected into a `unittest.TestSuite`.

**Stage 2 — Method filtering:** The engine iterates over every test case in the suite and checks whether its `_testMethodName` matches the `method_pattern` glob. Only matching methods are included in the final suite.

```python
suite = engine.discover()

# suite is a unittest.TestSuite containing only tests that match both filters
print(suite.countTestCases())   # Number of matched tests
```

### Discovery Examples

```python
# Discover all tests in the default directory with default patterns
engine = TestingEngine(app)
suite = engine.discover()

# Discover only test files for the user module
engine.setStartDir("tests/unit").setFilePattern("test_user*.py")
suite = engine.discover()

# Discover tests using a custom method naming convention
engine.setMethodPattern("verify*")
suite = engine.discover()

# Combine directory, file, and method filters
suite = (
    TestingEngine(app)
    .setStartDir("tests/integration")
    .setFilePattern("test_api*.py")
    .setMethodPattern("test_get*")
    .discover()
)
```

### Empty Suites

If no files match the file pattern in the given directory, `discover()` returns an empty `unittest.TestSuite` with zero test cases. The same happens if files are found but none of their methods match the method pattern. The engine does not raise an error in either case.

---

## Running Tests

The `run()` method is an asynchronous method that orchestrates the entire test execution lifecycle:

1. Calls `discover()` and adds all matched tests to the internal suite
2. Configures the verbosity on the `TestResultProcessor`
3. Creates a `TestRunner` with the current `fail_fast` setting
4. Executes the suite in a thread pool via `asyncio.run_in_executor()` to avoid blocking the event loop
5. Collects all `TestResult` objects from the result processor
6. If caching is enabled, writes the results to a JSON file asynchronously
7. Returns the list of `TestResult` objects

```python
results = await engine.run()

# results is a list[TestResult]
for result in results:
    print(f"{result.name}: {result.status} ({result.execution_time:.3f}s)")
```

### Complete Example

```python
from orionis.test.core.engine import TestingEngine

async def run_tests(app):
    results = await (
        TestingEngine(app)
        .setVerbosity(2)
        .setFailFast(fail_fast=False)
        .setStartDir("tests")
        .setFilePattern("test_*.py")
        .setMethodPattern("test*")
        .run()
    )

    # Process results programmatically
    passed = [r for r in results if r.status == "PASSED"]
    failed = [r for r in results if r.status == "FAILED"]

    print(f"\n{len(passed)} passed, {len(failed)} failed")

    # Return exit code for CI
    return 0 if not failed else 1
```

### Thread Pool Execution

Test execution is offloaded to the default executor via `asyncio.get_event_loop().run_in_executor()`. This means the tests themselves run in a separate thread, keeping the event loop free. The runner, console output, and result processing all happen in that worker thread. Only the final result collection and JSON caching return to the async context.

---

## Console Output During Execution

The engine delegates console rendering to the `TestRunner`, which uses the Rich library to produce styled terminal output.

### Before Tests

A **start panel** appears with:

| Field | Content |
|---|---|
| Title | `🚀 Orionis TestSuite` |
| Started at | Current timestamp in `YYYY-MM-DD HH:MM:SS` format |
| PID | Process ID of the running Python process |
| Reactor Loop Policy | Name of the active asyncio event loop policy |
| Stop instruction | `Ctrl+C` reminder |

### During Tests

Each test produces output according to the verbosity level (see **Testing Overview** for details on the three levels).

### After Tests

A **summary table** appears with five columns:

| Total | Passed | Failed | Errored | Skipped |
|:---:|:---:|:---:|:---:|:---:|
| 42 | 40 | 1 | 0 | 1 |

The caption shows the total execution time with millisecond precision.

---

## Method Reference

| Method | Parameter | Returns | Description |
|---|---|---|---|
| `__init__(app)` | `IApplication` | — | Constructs the engine from the application instance, reading all testing configuration values |
| `setVerbosity(verbosity)` | `int` | `Self` | Override the output detail level (0, 1, or 2) |
| `setFailFast(*, fail_fast)` | `bool` | `Self` | Enable or disable fail-fast mode. Keyword-only |
| `setStartDir(start_dir)` | `str` | `Self` | Set the root directory for test file discovery |
| `setFilePattern(file_pattern)` | `str` | `Self` | Set the glob pattern for matching test file names |
| `setMethodPattern(method_pattern)` | `str` | `Self` | Set the glob pattern for matching test method names (also updates `TestCase`) |
| `discover()` | — | `TestSuite` | Scan the directory and return a filtered test suite |
| `run()` | — | `list[TestResult]` | Execute all discovered tests asynchronously and return the results |
