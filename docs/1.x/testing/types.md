---
title: Types of Testing
editLink: true
outline: deep
---

# Types of Testing

Orionis provides a variety of testing types designed to meet different project needs and structures. Below, you'll find descriptions of the available testing types, along with practical examples and their benefits.


## Asynchronous Testing

Asynchronous testing allows tests to run non-blocking, which is especially useful for applications utilizing asynchronous programming. This approach optimizes performance and ensures that tests do not interfere with the natural flow of the application.

### How to Create an Asynchronous Test

1. Declare test methods using `async def` instead of `def`.
2. If all methods in your test class are asynchronous, use the `AsyncTestCase` class instead of `TestCase` to avoid unnecessary event loop creation.

### Code Example

```python
from orionis.luminate.test.test_case import AsyncTestCase

class TestAsyncExample(AsyncTestCase):
    async def testAsyncMethod(self):
        result = await some_async_function()
        self.assertEqual(result, expected_value)
```

### Benefits of Asynchronous Testing

- **Efficiency:** Reduces execution time by avoiding unnecessary blocking.
- **Compatibility:** Ideal for applications relying on asynchronous operations, such as API calls or background processing.
- **Simplicity:** The `AsyncTestCase` class simplifies the setup and execution of asynchronous tests.


## Synchronous Testing

Synchronous testing is the traditional approach, where tests run sequentially and blockingly. It is suitable for applications with linear workflows or those that do not require asynchronous operations.

### How to Create a Synchronous Test

1. Declare test methods using `def`.
2. Use the `SyncTestCase` class to structure your tests.

### Code Example

```python
from orionis.luminate.test.test_case import SyncTestCase

class TestSyncExample(SyncTestCase):
    def testSyncMethod(self):
        result = some_sync_function()
        self.assertEqual(result, expected_value)
```

### Benefits of Synchronous Testing

- **Simplicity:** Easy to understand and configure, ideal for small or simple projects.
- **Compatibility:** Works well with applications that do not require asynchronous operations.
- **Lower Complexity:** Does not require managing event loops or callbacks.


## Mixed Testing

Mixed testing combines asynchronous and synchronous tests within the same test class. It is useful for applications with both types of components, offering flexibility and broader test coverage.

### How to Create a Mixed Test

1. Combine `def` and `async def` methods as needed.
2. Use the `TestCase` class to handle both types of tests.

### Code Example

```python
from orionis.luminate.test.test_case import TestCase

class TestMixedExample(TestCase):
    def testSyncMethod(self):
        result = some_sync_function()
        self.assertEqual(result, expected_value)

    async def testAsyncMethod(self):
        result = await some_async_function()
        self.assertEqual(result, expected_value)
```

### Benefits of Mixed Testing

- **Flexibility:** Allows testing of both synchronous and asynchronous components in one place.
- **Comprehensive Coverage:** Ensures all aspects of the application are thoroughly tested.
- **Efficiency:** Eliminates the need to separate tests into different classes.


With these tools and approaches, you can ensure your applications are reliable, efficient, and well-tested, regardless of their complexity or architecture.