---
title: Testing Methods
editLink: true
outline: deep
---

# Testing Methods

## Required Imports

```python
from orionis.luminate.test.test_case import TestCase
```

## Example Test Class

```python
class TestExample(TestCase):
    ...
```

## Common Assertion Methods (`assert*`)

### `assertEqual(a, b)`

Checks that `a == b`.

```python
def testAssertEqual(self):
    self.assertEqual(1 + 1, 2)
```

### `assertNotEqual(a, b)`

Checks that `a != b`.

```python
def testAssertNotEqual(self):
    self.assertNotEqual(1 + 1, 3)
```

### `assertTrue(x)`

Checks that `x` is `True`.

```python
def testAssertTrue(self):
    self.assertTrue(1 < 2)
```

### `assertFalse(x)`

Checks that `x` is `False`.

```python
def testAssertFalse(self):
    self.assertFalse(1 > 2)
```

### `assertIs(a, b)`

Checks that `a` and `b` are the **same object** (same memory identity).

```python
def testAssertIs(self):
    a = b = [1, 2, 3]
    self.assertIs(a, b)
```

### `assertIsNot(a, b)`

Checks that `a` and `b` are **not** the same object.

```python
def testAssertIsNot(self):
    a = [1, 2, 3]
    b = [1, 2, 3]
    self.assertIsNot(a, b)
```

### `assertIsNone(x)`

Checks that `x is None`.

```python
def testAssertIsNone(self):
    self.assertIsNone(None)
```

### `assertIsNotNone(x)`

Checks that `x is not None`.

```python
def testAssertIsNotNone(self):
    self.assertIsNotNone(1)
```

### `assertIn(a, b)`

Checks that `a` is contained in `b`.

```python
def testAssertIn(self):
    self.assertIn(1, [1, 2, 3])
```

### `assertNotIn(a, b)`

Checks that `a` is **not** contained in `b`.

```python
def testAssertNotIn(self):
    self.assertNotIn(4, [1, 2, 3])
```

### `assertIsInstance(obj, cls)`

Checks that `obj` is an instance of `cls`.

```python
def testAssertIsInstance(self):
    self.assertIsInstance(1, int)
```

### `assertNotIsInstance(obj, cls)`

Checks that `obj` is **not** an instance of `cls`.

```python
def testAssertNotIsInstance(self):
    self.assertNotIsInstance(1, str)
```

## Assertions for Approximate Values (Floats)

### `assertAlmostEqual(a, b, places=7)`

Checks that `a` and `b` are approximately equal up to `places` decimal places.

```python
def testAssertAlmostEqual(self):
    self.assertAlmostEqual(0.1 + 0.2, 0.3, places=7)
```

### `assertNotAlmostEqual(a, b, places=7)`

Checks that `a` and `b` are **not** approximately equal up to `places` decimal places.

```python
def testAssertNotAlmostEqual(self):
    self.assertNotAlmostEqual(0.1 + 0.2, 0.4, places=7)
```

## Relational Comparisons

### `assertGreater(a, b)`

Checks that `a > b`.

```python
def testAssertGreater(self):
    self.assertGreater(3, 2)
```

### `assertGreaterEqual(a, b)`

Checks that `a >= b`.

```python
def testAssertGreaterEqual(self):
    self.assertGreaterEqual(3, 3)
```

### `assertLess(a, b)`

Checks that `a < b`.

```python
def testAssertLess(self):
    self.assertLess(2, 3)
```

### `assertLessEqual(a, b)`

Checks that `a <= b`.

```python
def testAssertLessEqual(self):
    self.assertLessEqual(2, 2)
```

## Assertions with Exceptions

### `assertRaises(exc, callable, *args, **kwargs)`

Checks that a specific exception is raised.

```python
def testAssertRaises(self):
    with self.assertRaises(ZeroDivisionError):
        1 / 0
```

### `assertRaisesRegex(exc, regex)`

Checks that an exception is raised with a message matching a regular expression.

```python
def testAssertRaisesRegex(self):
    with self.assertRaisesRegex(ValueError, "invalid literal"):
        int("a")
```

## Verifying Logs

### `assertLogs(logger=None, level)`

Checks that a block of code generates log messages.

```python
def testAssertLogs(self):
    with self.assertLogs(level='INFO') as log:
        logging.info("Test message")
        self.assertIn("Test message", log.output[0])
```

## Running Tests

```python
python -B reactor test
```