---
title: Custom Suite
editLink: true
outline: deep
---

# Custom Suite

Orionis provides a standard for structuring your tests, but it is also flexible enough to adapt to your needs if you decide to customize the structure. While maintaining a standard facilitates collaboration and project understanding, you can choose to create your own test organization.

## Custom Structure

### Base Folder (`Base Path`)

The base folder is the main directory where test cases will be located. By default, this folder is named `tests`, but you can define any other name. In this example, we will use a folder named `testings`:

```
|__ testings
|   __init__.py
```

### Subdirectories (`Folder Path`)

Subdirectories within the base folder allow you to organize test cases by categories. While not mandatory, it is a recommended practice to maintain a clear and organized structure.

### File Pattern (`Pattern`)

The pattern defines the naming convention for test files. For example, if you use the pattern `case_*.py`, all test files must start with `case_`:

```
case_something.py
case_another.py
```

## Orionis Configuration

To run tests from the command line with:

```
python -B reactor test
```

you need to configure the `config/tests.py` file by adjusting the values according to your custom structure:

```python
class Config(IConfig):

    config = Testing(

        # Base folder where subdirectories or test cases are located.
        base_path='testings',

        # Subfolders to track. Use '*' to include all or provide a specific list.
        folder_path=[
            'unit/helpers',
            'integration',
            'functional'
        ],

        # Pattern that test files must follow.
        pattern='case_*.py'
    )
```

With this configuration, Orionis will adapt to your custom structure, allowing you to efficiently run and organize your tests.

## Using Orionis as a Dependency

If you decide to use Orionis as a dependency in your project, you can fully customize your test structure. For example:

- `base_path = 'testings'`
- `folder_path = 'subfolder_one'`
- `pattern = 'case_*.py'`

You can install Orionis as a dependency and instantiate the test suite wherever needed.

### Static Execution

Orionis offers a quick and static way to run your tests. This is useful if you prefer a concise approach:

```python
from orionis.luminate.test.test_suite import Tests

dict_result = Tests.execute(
    folders=[
        {'base_path': 'testings', 'folder_path': 'subfolder_one', 'pattern': 'case_*.py'},
        {'base_path': 'testings', 'folder_path': 'subfolder_two/another_folder', 'pattern': 'case_*.py'},
    ],
    print_result=True,
    throw_exception=False
)
```

### Dynamic Execution

If you need more control, you can use an instance of the test suite:

```python
from orionis.luminate.test.test_unit import UnitTest

# Create an instance of the test suite
suite = UnitTest()

# Add test folders
suite.addFolder(
    base_path='testings',
    folder_path='subfolder_one',
    pattern='case_*.py'
)

# Run tests
dict_result = suite.run(print_result=True, throw_exception=False)
```

### `print_result` Parameter

This parameter is a boolean. If set to `True`, the test execution results will be printed to the console. If set to `False`, no information will be displayed in the console.

### `throw_exception` Parameter

This parameter is a boolean. If set to `True`, an `OrionisTestFailureException` will be raised if a test fails. If set to `False`, no exceptions will be raised, and a dictionary with the results will be returned.

### Return Value

The test execution returns a dictionary with the following structure:

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

With these options, you can integrate Orionis into your testing workflow in a flexible and efficient manner.
