---
title: TestResult
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# TestResult

`TestResult` is an immutable dataclass that captures the complete outcome of a single test method execution. After the `TestingEngine` finishes a run, it returns a list of `TestResult` objects — one per test method — containing all metadata needed to inspect, report, or persist the outcome.

## Import

```python
from orionis.test.entities.result import TestResult
from orionis.test.enums.status import TestStatus
```

---

## Characteristics

`TestResult` is defined with `@dataclass(frozen=True, kw_only=True)`, which gives it three important properties:

### Immutability

Once created, no field can be modified or deleted. Any attempt to assign to or delete an attribute raises `FrozenInstanceError`:

```python
result = results[0]

result.name = "modified"   # raises FrozenInstanceError
del result.status          # raises FrozenInstanceError
```

This guarantees that result data remains consistent from the moment it is recorded until it is consumed — there is no risk of accidental mutation between recording and reporting.

### Keyword-Only Construction

All fields must be passed as keyword arguments. Positional arguments are rejected:

```python
# Correct
result = TestResult(
    id=1,
    name="tests.test_user.TestUser.testCreate",
    status=TestStatus.PASSED,
    execution_time=0.012,
)

# TypeError — positional arguments not allowed
result = TestResult(1, "tests.test_user.TestUser.testCreate", TestStatus.PASSED, 0.012)
```

### Hashability

Because the dataclass is frozen, Python automatically generates a `__hash__` method. This means `TestResult` instances can be:

- Used as dictionary keys
- Stored in sets
- Deduplicated

```python
result_set = set(results)
result_map = {result: "analyzed" for result in results}
```

---

## Fields

### Required Fields

These four fields must always be provided. They are populated automatically by the framework's test result processor.

#### id

```python
id: Any
```

The unique identifier for the test instance. The framework uses Python's built-in `id()` function, which returns the memory address of the test object. This guarantees uniqueness within a single run.

#### name

```python
name: str
```

The fully qualified test name, as returned by `unittest.TestCase.id()`. This typically follows the format `module.ClassName.methodName`:

```
tests.unit.test_user.TestUserService.testCreatesUser
```

#### status

```python
status: TestStatus
```

The outcome of the execution. One of the four `TestStatus` members:

| Value | Meaning |
|---|---|
| `TestStatus.PASSED` | All assertions succeeded, no exceptions raised |
| `TestStatus.FAILED` | An `AssertionError` was raised |
| `TestStatus.ERRORED` | An unexpected exception (not `AssertionError`) was raised |
| `TestStatus.SKIPPED` | The test was skipped via a `@unittest.skip*` decorator or `self.skipTest()` |

#### execution_time

```python
execution_time: float
```

The wall-clock time taken to execute the test method, in seconds. Measured using `time.perf_counter()` for high-resolution timing. Includes any `setUp` and `tearDown` hooks that ran as part of the test.

---

### Optional Fields

All optional fields default to `None` when not provided. The framework populates them when the information is available.

#### error_message

```python
error_message: str | None = None
```

The string representation of the exception that caused the failure or error. For a failing assertion, this is typically the assertion message:

```
"1 != 2"
"'admin' not found in ['user', 'guest']"
```

`None` for passed or skipped tests.

#### traceback

```python
traceback: str | None = None
```

The full formatted traceback as produced by `traceback.format_exception()`. This is a list of strings that, when joined, form the complete stack trace. `None` for passed or skipped tests.

#### class_name

```python
class_name: str | None = None
```

The name of the test class (e.g., `"TestUserService"`). Extracted via the framework's reflection utilities.

#### method

```python
method: str | None = None
```

The name of the specific test method (e.g., `"testCreatesUser"`). This is the value of `_testMethodName` on the `unittest.TestCase` instance.

#### module

```python
module: str | None = None
```

The Python module path containing the test class (e.g., `"tests.unit.test_user"`).

#### file_path

```python
file_path: str | None = None
```

The absolute filesystem path to the source file containing the test (e.g., `"/app/tests/unit/test_user.py"`).

#### doc_string

```python
doc_string: str | None = None
```

The docstring of the test method, if one is defined. This is useful for generating human-readable reports where each test has a description:

```python
def testCreatesUser(self):
    """Create a new user and persist it to the database."""
    ...
```

In this case, `doc_string` would be `"Create a new user and persist it to the database."`.

#### exception

```python
exception: str | None = None
```

The class name of the exception that was raised (e.g., `"AssertionError"`, `"ValueError"`, `"TypeError"`). This is extracted from `exc_info[0].__name__`. `None` for passed or skipped tests.

#### line_no

```python
line_no: int | None = None
```

The line number in the source file where the failure or error occurred. The framework inspects the traceback frames and identifies the frame that corresponds to the test file. `None` for passed or skipped tests.

#### source_code

```python
source_code: list[tuple[int, str]] | None = None
```

A list of `(line_number, code_line)` tuples representing the source code surrounding the failure point. Typically includes 2 lines before and 1 line after the offending line. This is the data used by the Detailed verbosity mode to render the code snippet:

```python
[
    (23, "    def testBadLogic(self):"),
    (24, "        result = 1"),
    (25, "        self.assertEqual(result, 2)"),
    (26, ""),
]
```

`None` (or an empty list) for passed or skipped tests.

---

## Serialization

### toDict

Converts the `TestResult` to a plain Python dictionary. Enum values (like `TestStatus`) are serialized to their string representation:

```python
result = results[0]
data = result.toDict()

# data is a dict with string keys and serializable values
print(data["name"])       # "tests.test_user.TestUser.testCreate"
print(data["status"])     # "PASSED" (string, not TestStatus)
print(data["execution_time"])  # 0.012
```

This method is used internally by the `TestingEngine` when persisting results to JSON cache, and is available for any custom reporting or integration.

### getFields

Returns a list of dictionaries describing every field in the dataclass, including name, types, default value, and metadata:

```python
fields = result.getFields()

for field in fields:
    print(field["name"], field["types"], field["default"])
```

Each entry has the structure:

```python
{
    "name": "status",
    "types": ["TestStatus"],
    "default": None,
    "metadata": {"description": "Status of the test execution (e.g., passed, failed)."}
}
```

---

## Equality and Comparison

Two `TestResult` instances are considered equal if all their fields have identical values. This is the standard `dataclass` `__eq__` behavior:

```python
r1 = TestResult(id=1, name="test", status=TestStatus.PASSED, execution_time=0.5)
r2 = TestResult(id=1, name="test", status=TestStatus.PASSED, execution_time=0.5)

r1 == r2   # True

r3 = TestResult(id=1, name="test", status=TestStatus.FAILED, execution_time=0.5)
r1 == r3   # False — status differs
```

---

## Working with Results

### Filtering by Status

```python
results = await engine.run()

passed  = [r for r in results if r.status == TestStatus.PASSED]
failed  = [r for r in results if r.status == TestStatus.FAILED]
errored = [r for r in results if r.status == TestStatus.ERRORED]
skipped = [r for r in results if r.status == TestStatus.SKIPPED]

print(f"{len(passed)} passed, {len(failed)} failed, {len(errored)} errors, {len(skipped)} skipped")
```

### Extracting Failure Details

```python
for result in failed:
    print(f"\n--- {result.name} ---")
    print(f"Class:     {result.class_name}")
    print(f"Method:    {result.method}")
    print(f"File:      {result.file_path}:{result.line_no}")
    print(f"Exception: {result.exception}: {result.error_message}")

    if result.source_code:
        print("Source:")
        for line_no, code in result.source_code:
            marker = " *" if line_no == result.line_no else "  "
            print(f"  {marker}| {line_no}: {code}")
```

### Generating a Custom Report

```python
import json

results = await engine.run()

report = {
    "total": len(results),
    "passed": sum(1 for r in results if r.status == TestStatus.PASSED),
    "failed": sum(1 for r in results if r.status == TestStatus.FAILED),
    "errored": sum(1 for r in results if r.status == TestStatus.ERRORED),
    "skipped": sum(1 for r in results if r.status == TestStatus.SKIPPED),
    "total_time": sum(r.execution_time for r in results),
    "slowest": max(results, key=lambda r: r.execution_time).name if results else None,
    "details": [r.toDict() for r in results],
}

print(json.dumps(report, indent=2, default=str))
```

### Collecting into Sets or Dictionaries

Because `TestResult` is hashable, you can deduplicate results or use them as dictionary keys:

```python
unique_failures = {r for r in results if r.status == TestStatus.FAILED}

annotations = {}
for result in results:
    annotations[result] = analyze(result)
```

---

## TestStatus Enum

The `TestStatus` enumeration defines the four possible outcomes. It extends `StrEnum`, meaning each member is simultaneously a `str`:

```python
from orionis.test.enums.status import TestStatus

# Members
TestStatus.PASSED    # "PASSED"
TestStatus.FAILED    # "FAILED"
TestStatus.ERRORED   # "ERRORED"
TestStatus.SKIPPED   # "SKIPPED"
```

### String Behavior

Because `TestStatus` members are strings, they support all string operations without conversion:

```python
status = TestStatus.PASSED

# Comparison
status == "PASSED"                  # True
status in ["PASSED", "SKIPPED"]     # True

# String methods
status.lower()                      # "passed"
f"Result: {status}"                 # "Result: PASSED"

# JSON serialization
import json
json.dumps({"status": status})      # '{"status": "PASSED"}'
```

### Enum Membership

The enumeration contains exactly four members. You can iterate over them:

```python
for status in TestStatus:
    print(status.name, status.value)

# PASSED PASSED
# FAILED FAILED
# ERRORED ERRORED
# SKIPPED SKIPPED
```

---

## Field Reference

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `Any` | Yes | — | Unique identifier (Python `id()` of the test instance) |
| `name` | `str` | Yes | — | Fully qualified test name (`module.Class.method`) |
| `status` | `TestStatus` | Yes | — | Outcome: `PASSED`, `FAILED`, `ERRORED`, or `SKIPPED` |
| `execution_time` | `float` | Yes | — | Duration in seconds (high-resolution) |
| `error_message` | `str \| None` | No | `None` | Error or assertion message |
| `traceback` | `str \| None` | No | `None` | Full formatted traceback |
| `class_name` | `str \| None` | No | `None` | Name of the test class |
| `method` | `str \| None` | No | `None` | Name of the test method |
| `module` | `str \| None` | No | `None` | Module path of the test |
| `file_path` | `str \| None` | No | `None` | Absolute path to the test file |
| `doc_string` | `str \| None` | No | `None` | Docstring of the test method |
| `exception` | `str \| None` | No | `None` | Exception class name |
| `line_no` | `int \| None` | No | `None` | Line number of the failure |
| `source_code` | `list \| None` | No | `None` | Source code lines near the failure as `(line_no, code)` tuples |
