---
title: Mandatory Syntax
editLink: true
outline: deep
---

# Mandatory Syntax

To ensure consistency in the development of test cases and allow the `Orionis` framework to identify and execute them correctly, it is essential to follow these rules:

## File Names

All files must be named using `snake_case` and start with the prefix `test_`.
**Examples:**
- `test_calculator.py`
- `test_user.py`

## Class Names

Classes containing test case methods must start with the prefix `Test`.
**Example:**
```python
from orionis.luminate.test.test_case import TestCase

class TestCalculator(TestCase):
    pass
```

## Method Names

Methods within the classes must start with the prefix `test` to be recognized by the `Orionis` test suite.
**Example:**
```python
from orionis.luminate.test.test_case import TestCase

class TestCalculator(TestCase):

    async def testAddition(self):
        pass

    async def testSubtraction(self):
        pass
```
