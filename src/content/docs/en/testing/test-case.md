---
title: TestCase
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# TestCase

`TestCase` is the base class that every test in an Orionis application must extend. It inherits from `unittest.IsolatedAsyncioTestCase`, which means it supports both synchronous and asynchronous test methods out of the box. Its key addition over standard `unittest` is **automatic application-context injection** — every test method runs inside the full Orionis application context, with the service container, configuration, and all bootstrapped providers available.

## Import

```python
from orionis.test import TestCase
```

This is the only import needed to start writing tests. `TestCase` is the sole public export of the `orionis.test` package.

---

## How It Works

When the test runner calls a test method, `TestCase` intercepts the attribute access through a custom `__getattribute__` hook. If the accessed name matches the configured method pattern (default `test*`) and is a callable (method or function), `TestCase` wraps it in an asynchronous function that calls `Application.invoke()`. This ensures:

1. **Service container is live** — you can type-hint dependencies on your test methods and have them resolved automatically, exactly as you would in a controller or service.
2. **Configuration is loaded** — all values from `config/*.py` are accessible via the application instance.
3. **Providers are bootstrapped** — every registered service provider has been `register()`ed and `boot()`ed before your test code runs.
4. **Async support is native** — both `def test...` and `async def test...` methods work. Synchronous methods are awaited through the same wrapper transparently.

Private attributes (names starting with `_`) and non-callable attributes bypass the wrapping entirely and are returned as-is.

---

## Writing Your First Test

### Basic Synchronous Test

```python
from orionis.test import TestCase

class TestMathOperations(TestCase):

    def testAddition(self):
        self.assertEqual(1 + 1, 2)

    def testSubtraction(self):
        result = 10 - 3
        self.assertGreater(result, 0)
        self.assertEqual(result, 7)
```

### Asynchronous Test

```python
from orionis.test import TestCase

class TestAsyncService(TestCase):

    async def testFetchData(self):
        # Async operations are awaited automatically
        data = await some_async_service.fetch()
        self.assertIsNotNone(data)
        self.assertIn("key", data)

    async def testAsyncExceptionHandling(self):
        with self.assertRaises(ValueError):
            await some_async_service.validate(invalid_input)
```

Since `TestCase` extends `IsolatedAsyncioTestCase`, each async test method gets its own event loop. There is no need to manage the loop manually.

### Testing with the Service Container

Because every test method is invoked through `Application.invoke()`, the service container resolves dependencies automatically. Type-hint a contract or a concrete class as a method parameter and the framework injects the registered implementation — exactly as it does for controllers or service classes:

```python
from orionis.test import TestCase
from app.contracts.user_service import IUserService

class TestUserService(TestCase):

    async def testUserCreation(self, user_service: IUserService):
        user = await user_service.create(name="John", email="john@example.com")
        self.assertIsNotNone(user.id)
        self.assertEqual(user.name, "John")
```

You can inject as many dependencies as needed:

```python
from orionis.test import TestCase
from app.contracts.user_service import IUserService
from app.contracts.notification_service import INotificationService

class TestNotifications(TestCase):

    async def testWelcomeEmailIsSent(
        self,
        user_service: IUserService,
        notifications: INotificationService,
    ):
        user = await user_service.create(name="Jane", email="jane@example.com")
        result = await notifications.sendWelcome(user)
        self.assertTrue(result)
```

:::tip[Contracts over concretes]
Prefer injecting contracts (interfaces) instead of concrete classes. This keeps your tests decoupled from specific implementations and ensures they exercise the same resolution path the application uses at runtime.
:::

---

## Assertions

`TestCase` inherits the complete assertion library from `unittest.TestCase`. Every standard assertion method is available:

### Equality

```python
self.assertEqual(a, b)           # a == b
self.assertNotEqual(a, b)        # a != b
self.assertAlmostEqual(a, b)     # round(a - b, 7) == 0
self.assertNotAlmostEqual(a, b)  # round(a - b, 7) != 0
```

### Truthiness

```python
self.assertTrue(expr)     # bool(expr) is True
self.assertFalse(expr)    # bool(expr) is False
```

### Identity and Type

```python
self.assertIs(a, b)            # a is b
self.assertIsNot(a, b)         # a is not b
self.assertIsNone(value)       # value is None
self.assertIsNotNone(value)    # value is not None
self.assertIsInstance(obj, cls)     # isinstance(obj, cls)
self.assertNotIsInstance(obj, cls)  # not isinstance(obj, cls)
```

### Membership

```python
self.assertIn(item, container)       # item in container
self.assertNotIn(item, container)    # item not in container
```

### Comparison

```python
self.assertGreater(a, b)        # a > b
self.assertGreaterEqual(a, b)   # a >= b
self.assertLess(a, b)           # a < b
self.assertLessEqual(a, b)      # a <= b
```

### Exceptions

```python
# As a context manager
with self.assertRaises(ValueError):
    function_that_raises()

# With message matching
with self.assertRaisesRegex(ValueError, "invalid"):
    function_that_raises()
```

### String Matching

```python
self.assertRegex(text, pattern)       # re.search(pattern, text)
self.assertNotRegex(text, pattern)    # not re.search(pattern, text)
```

### Collection Comparison

```python
self.assertCountEqual(a, b)     # same elements, regardless of order
self.assertSequenceEqual(a, b)  # same elements in the same order
self.assertListEqual(a, b)      # specifically for lists
self.assertDictEqual(a, b)      # specifically for dicts
self.assertSetEqual(a, b)       # specifically for sets
```

---

## Skipping Tests

Use the standard `unittest` decorators to conditionally skip tests. Skipped tests receive the `SKIPPED` status and do not count as failures.

### Unconditional Skip

```python
import unittest
from orionis.test import TestCase

class TestFeature(TestCase):

    @unittest.skip("Not implemented yet")
    def testPendingFeature(self):
        pass
```

### Conditional Skip

```python
import sys
import unittest
from orionis.test import TestCase

class TestPlatformSpecific(TestCase):

    @unittest.skipIf(sys.platform == "win32", "Not supported on Windows")
    def testLinuxOnlyFeature(self):
        pass

    @unittest.skipUnless(sys.platform.startswith("linux"), "Linux required")
    def testLinuxBehavior(self):
        pass
```

### Programmatic Skip

```python
from orionis.test import TestCase

class TestConditional(TestCase):

    def testMaybeSkip(self):
        if not some_precondition():
            self.skipTest("Precondition not met")
        # Test logic continues here...
```

---

## Setup and Teardown

`TestCase` supports all standard `unittest` setup and teardown hooks. These run **outside** the application context wrapper — only test methods matching the method pattern are wrapped.

### Per-Test Hooks

```python
from orionis.test import TestCase

class TestWithSetup(TestCase):

    def setUp(self):
        """Runs before each test method."""
        self.data = {"key": "value"}

    def tearDown(self):
        """Runs after each test method, even if it failed."""
        self.data = None

    def testDataIsAvailable(self):
        self.assertIn("key", self.data)
```

### Per-Class Hooks

```python
from orionis.test import TestCase

class TestWithClassSetup(TestCase):

    @classmethod
    def setUpClass(cls):
        """Runs once before any test in the class."""
        cls.shared_resource = create_expensive_resource()

    @classmethod
    def tearDownClass(cls):
        """Runs once after all tests in the class."""
        cls.shared_resource.close()

    def testUsesSharedResource(self):
        self.assertIsNotNone(self.shared_resource)
```

### Async Setup and Teardown

Since `TestCase` extends `IsolatedAsyncioTestCase`, async variants are also supported:

```python
from orionis.test import TestCase

class TestAsyncSetup(TestCase):

    async def asyncSetUp(self):
        """Async setup — runs before each async test."""
        self.connection = await create_async_connection()

    async def asyncTearDown(self):
        """Async teardown — runs after each async test."""
        await self.connection.close()

    async def testAsyncOperation(self):
        result = await self.connection.query("SELECT 1")
        self.assertIsNotNone(result)
```

---

## Method Pattern

By default, only methods whose name matches the glob pattern `test*` are recognized as test methods and wrapped with the application context. This follows the standard `unittest` convention.

### Changing the Pattern

The pattern can be changed at the class level via the `setMethodPattern` class method:

```python
from orionis.test.cases.case import TestCase

# Now only methods starting with "check" will be treated as tests
TestCase.setMethodPattern("check*")
```

:::caution[Global effect]
`setMethodPattern` modifies a class-level attribute. Changing it affects **all** `TestCase` subclasses for the remainder of the process. In practice, this is managed by the `TestingEngine` based on the `method_pattern` configuration, so you rarely need to call it manually.
:::

The pattern uses `fnmatch` glob syntax:

| Pattern | Matches |
|---|---|
| `test*` | `testCreate`, `testUpdate`, `test_delete` |
| `test_user*` | `test_user_create`, `test_user_delete` |
| `check*` | `checkValid`, `checkInvalid` |
| `*` | Every public method |

---

## Test Organization

### Recommended Directory Structure

```
tests/
├── __init__.py
├── unit/
│   ├── __init__.py
│   ├── test_user_service.py
│   └── test_order_service.py
├── integration/
│   ├── __init__.py
│   ├── test_database.py
│   └── test_api.py
└── feature/
    ├── __init__.py
    └── test_checkout_flow.py
```

### File Naming Convention

The default file pattern `test_*.py` expects files to start with `test_`. All files in the `start_dir` (and its subdirectories) matching this pattern are loaded. Each file should contain one or more classes extending `TestCase`.

### Method Naming Convention

Test methods should start with `test` (matching the default `test*` pattern). Use descriptive camelCase names that convey what is being tested:

```python
class TestPaymentService(TestCase):

    def testChargeSucceedsWithValidCard(self):
        ...

    def testChargeFailsWithExpiredCard(self):
        ...

    def testRefundReturnsFullAmount(self):
        ...
```

---

## Method Reference

| Method / Feature | Type | Description |
|---|---|---|
| `setMethodPattern(pattern)` | `classmethod` | Replaces the glob pattern used to identify which methods are test methods. Default is `test*` |
| `setUp()` / `tearDown()` | instance | Standard per-test setup and teardown hooks |
| `setUpClass()` / `tearDownClass()` | `classmethod` | Hooks that run once per class |
| `asyncSetUp()` / `asyncTearDown()` | instance | Async per-test setup and teardown hooks |
| All `self.assert*()` methods | instance | Full `unittest.TestCase` assertion library |
| `self.skipTest(reason)` | instance | Programmatically skip the current test |
| Sync and async test methods | instance | Both `def test...` and `async def test...` are supported natively |
| Application context injection | automatic | Every matched test method is wrapped to run inside the Orionis application context |
