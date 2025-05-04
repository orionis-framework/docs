---
title: Getting Started
editLink: true
outline: deep
---

# Getting Started

## Introduction

The Orionis Framework leverages Python's `unittest` module to provide a simple and elegant way to create test cases. This ensures the quality and robustness of your applications through a well-defined set of tests.

With native support for asynchronous operations, Orionis makes it easy to execute both synchronous and asynchronous tests, adapting to the needs of your project.

## Running Tests

In the default structure of an Orionis project, you will find a folder named `tests`, which is intended to store your test cases. To maintain proper organization, you can divide your tests into subfolders as needed.

Example of a typical directory structure:

```
| tests/
|    __init__.py
|___ folder_one/...
|___ folder_two/...
|... test_custom.py
```

Place your test files in the appropriate subfolders, and the framework will handle a clean and organized testing environment for you.

## Creating a Basic Test Case

To create a test case, import the `TestCase` module, which allows you to execute both synchronous and asynchronous methods.

Example:

```python
from orionis.luminate.test.test_case import TestCase

class TestStdClass(TestCase):

    async def test_sum(self):
        result = 2 + 2
        self.assertEqual(result, 4)
```

## Executing Tests

To run test cases in the Orionis Framework, use the built-in CLI:

```bash
python -B reactor test
```

The console will provide a clear and detailed output of the test execution.

## Console Output

The console output includes a summary in table format with the following values:

- **Total**: Total number of tests executed.
- **Passed**: Number of tests that passed.
- **Failed**: Number of tests that failed.
- **Errors**: Number of errors encountered.
- **Skipped**: Number of tests skipped.
- **Duration**: Total execution time.
- **Success Rate**: Percentage of successful tests.

Example of a successful output:

```bash
Orionis Framework - Test Suite

INFO  2025-05-03 19:27:55 🚀 Starting Test Execution...

┌───────┬────────┬────────┬────────┬─────────┬───────────────┬──────────────┐
│ Total │ Passed │ Failed │ Errors │ Skipped │ Duration      │ Success Rate │
├───────┼────────┼────────┼────────┼─────────┼───────────────┼──────────────┤
│ 1     │ 1      │ 0      │ 0      │ 0       │ 0.001 seconds │ 100.0%       │
└───────┴────────┴────────┴────────┴─────────┴───────────────┴──────────────┘

SUCCESS  2025-05-03 19:27:55 ✅ All tests passed successfully!
```

Example of an output with failures:

```bash
FAIL  2025-05-03 19:30:21 ❌ test_std.TestStdClass.test_initialization_and_access (*_case.py)
```

The message will indicate the file and the specific test case that failed. At the end of the execution, a general summary will be displayed:

```bash
ERROR  2025-05-03 19:30:21 ❌ 1 test(s) failed (Success Rate: 0.0%)
```

With this information, you can quickly identify and resolve issues in your code.
