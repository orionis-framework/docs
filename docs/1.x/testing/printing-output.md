---
title: Printing Output
editLink: true
outline: deep
---

# Printing Output

When running tests within the context of the testing suite, the standard `print` function cannot be used to display information in the console. This limitation arises because the suite manages its own execution context. Instead, you should use the `self.print()` method provided by the `TestCase` class.

## Why Use `self.print()`?

The `self.print()` method is specifically designed to integrate seamlessly with the testing framework. It ensures that any output is properly logged and displayed in the context of the test execution. This approach provides better traceability and debugging capabilities compared to using the standard `print` function.

## Practical Example

Below is a practical example of how to use `self.print()` within a test class:

```python
from orionis.luminate.test.test_case import TestCase

class TestsExample(TestCase):

    async def testExampleOutput(self):
        # Use self.print() to display information in the console
        self.print("Example Output")
```

### Explanation of the Code

1. **Importing the TestCase Class**: Ensure you import the `TestCase` class from the `orionis.luminate.test.test_case` module.
2. **Defining the Test Method**: The `testExampleOutput` method is defined as an asynchronous test case.
3. **Using `self.print()`**: The `self.print()` method is used to output a message to the console in a structured and traceable format.

## Expected Output

When the above code is executed, the console will display output in the following format:

```bash
[Printout] File: tests\subfolder\test_example.py, Line: 7, Method: testExampleOutput
Example Output
```

### Breakdown of the Output

- **File**: The file path where the test is located.
- **Line**: The line number in the file where the `self.print()` method is called.
- **Method**: The name of the test method being executed.
- **Message**: The actual message passed to `self.print()`.

## Additional Notes

- The `self.print()` method is tightly integrated with the testing system, ensuring that all output is properly contextualized and logged.
- Always ensure that the `TestCase` class is correctly imported from the `orionis.luminate.test.test_case` module before using it.
- This method is particularly useful for debugging and logging information during test execution, as it provides a structured and consistent output format.

## Best Practices

- **Use Descriptive Messages**: When using `self.print()`, ensure that the messages are clear and descriptive to aid in debugging.
- **Avoid Overuse**: While `self.print()` is a powerful tool, avoid overusing it to prevent cluttering the test output.
- **Combine with Assertions**: Use `self.print()` in conjunction with assertions to provide context for test failures.

By adopting this approach, you can effectively debug and log information while running your tests in the Orionis framework.
