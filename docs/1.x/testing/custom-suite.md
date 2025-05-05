---
title: Custom Suite
editLink: true
outline: deep
---

# Custom Suite

Orionis provides a robust yet flexible framework for structuring your tests. While adhering to a standard structure promotes collaboration and clarity, Orionis allows you to customize your test organization to suit your specific needs.

## Custom Structure

### Base Folder (`base_path`)

The base folder is the root directory where your test cases reside. By default, this folder is named `tests`, but you can rename it to fit your project. For example, you might use a folder named `testings`:

```
|__ testings
|   __init__.py
```

### Subdirectories (`folder_path`)

Subdirectories within the base folder help you categorize your test cases. While optional, organizing tests into subdirectories is a best practice for maintaining clarity and scalability.

### File Pattern (`pattern`)

The file pattern defines the naming convention for your test files. For instance, using the pattern `case_*.py` ensures all test files start with `case_`:

```
case_example.py
case_another_test.py
```

## Configuring Orionis

To execute tests from the command line using:

```
python -B reactor test
```

you need to configure the `config/tests.py` file. Adjust the configuration to match your custom structure:

```python
class Config(IConfig):

    config = Testing(

        # Base folder containing test cases or subdirectories.
        base_path='testings',

        # Subdirectories to include. Use '*' for all or specify a list.
        folder_path=[
            'unit/helpers',
            'integration',
            'functional'
        ],

        # Naming pattern for test files.
        pattern='case_*.py'
    )
```

This configuration enables Orionis to adapt to your custom structure, ensuring seamless test execution.

## Using Orionis as a Dependency

When using Orionis as a dependency, you can fully customize your test structure. For example:

- `base_path = 'testings'`
- `folder_path = ['subfolder_one']`
- `pattern = 'case_*.py'`

You can install Orionis as a dependency and instantiate the test suite programmatically.

### Static Execution

For a quick and straightforward approach, use static execution:

```python
from orionis.luminate.test.test_suite import TestSuite

# Load and execute the test suite
dict_result = TestSuite.load(
    base_path='testings',
    folder_path=[
        'subfolder_one',
        # 'subfolder_two',
        # ...
    ],
    pattern='case_*.py'
).run(
    print_result=True,
    throw_exception=False
)
```

### Dynamic Execution

For greater control, use dynamic execution with an instance of the test suite:

```python
from orionis.luminate.test.test_unit import UnitTest

# Create a test suite instance
suite = UnitTest()

# Discover tests in specific folders
suite.discoverTestsInFolder(base_path='testings', folder_path='subfolder_one', pattern='case_*.py')
suite.discoverTestsInFolder(base_path='testings', folder_path='subfolder_two', pattern='case_*.py')

# Execute tests
dict_result = suite.run(print_result=True, throw_exception=False)
```

### Parameters

- **`print_result`**: A boolean that determines whether test results are printed to the console. Set to `True` to display results or `False` to suppress output.
- **`throw_exception`**: A boolean that controls whether an exception (`OrionisTestFailureException`) is raised on test failure. Set to `True` to raise exceptions or `False` to return a results dictionary.

### Return Value

Test execution returns a dictionary with the following structure:

```python
{
    "total_tests": 10,
    "passed": 10,
    "failed": 0,
    "errors": 0,
    "skipped": 0,
    "total_time": "0.01 seconds",
    "success_rate": "100%",
    "test_details": None
}
```

## Summary

Orionis offers a flexible and efficient testing framework that adapts to your project's needs. Whether you prefer a standard structure or a custom organization, Orionis provides the tools to streamline your testing workflow. With options for static and dynamic execution, you can integrate Orionis seamlessly into your development process.
