---
title: "Writing and running tests"
description: "Generate a TestCase with make:test, replace the skipped placeholder with assertions and run sync or async cases through Reactor."
editUrl: true
lastUpdated: false
---

## Create a case with `make:test`

From the application root, choose one alternative:

```shell
orionis make:test unit/price
```

```shell
python -B reactor make:test unit/price
```

If you prefer uv to select the project environment, use `uv run python -B reactor make:test unit/price`. All three commands generate the same file; do not run them consecutively to create one case.

The generator takes **one required `name` argument** and supports `-h`/`--help`. It has no flags for choosing another base class or overwriting files. The destination comes from `app.path("tests")`, normally `tests/`:

| Supplied name | Default file | Generated class |
| --- | --- | --- |
| `price` | `tests/test_price.py` | `TestPrice` |
| `unit/price` | `tests/unit/test_price.py` | `TestPrice` |
| `feature/test_order` | `tests/feature/test_order.py` | `TestOrder` |

It adds `test_` to the filename when missing, lowercases filenames and directories, and builds the class name from `_`-separated segments. It does not automatically convert CamelCase to snake_case: prefer names such as `order_total`. It creates required directories and rejects absolute paths, empty components, `.`/`..` and invalid module names. If the file exists, it reports the error and preserves it; edit the file directly or choose another name.

## Understand the generated template

For `unit/price`, the stub produces this class:

```python
from orionis.test import TestCase

class TestPrice(TestCase):
    """Describe the application behavior covered by this test case."""

    async def testExample(self) -> None:
        """
        Describe one expected behavior and add its assertions.

        Returns
        -------
        None
            The test completes after its assertions pass.
        """
        self.skipTest("Replace this placeholder with assertions.")
```

**All Orionis test cases must inherit from `TestCase`, imported with `from orionis.test import TestCase`.** The template creates an asynchronous method with an explicit skip; it does not yet check behavior. Replace `skipTest(...)` with application operations and assertions before treating that functionality as covered.

Filenames match `test_*.py` by default; method names must start with `test`. Class names do not have to use that prefix, although the generator uses it for a clear convention.

## Write a complete first test

Replace `tests/unit/test_price.py` with this module. The function represents an example rule; in your application, import the service or function being tested.

```python
from orionis.test import TestCase


def final_price(cents: int) -> int:
    if cents < 0:
        raise ValueError("Price cannot be negative")
    return cents + cents // 5


class TestPrice(TestCase):
    def testTotal(self) -> None:
        self.assertEqual(final_price(1000), 1200)

    async def testRejectsNegative(self) -> None:
        with self.assertRaisesRegex(ValueError, "cannot be negative"):
            final_price(-1)
```

The first method is synchronous and the second asynchronous: both are supported. Inside an `async` method, use `await` when the called service requires it; you do not need `asyncio.run()`. Test methods finish without returning a business result: assertions determine whether they pass or fail.

## Run and select cases

With the project environment active, choose the direct command or Reactor:

```shell
orionis test
```

```shell
python -B reactor test
```

Run only the preceding file from the same root:

```shell
python -B reactor test --start-dir tests/unit --file-pattern "test_price.py" --no-panel --verbosity 1
```

It should run two passing methods. To select one:

```shell
python -B reactor test --start-dir tests/unit --file-pattern "test_price.py" --method-pattern "testRejects*" --fail-fast 1
```

`--method-pattern` filters the `test*` candidates found by the loader; it does not enable methods named `checkSomething`. `--fail-fast` takes an integer value; it is not a valueless switch. See all options, defaults and JSON output in [Results and configuration](/en/testing/results-and-reference).

## Organize tests

You can separate rules without I/O under `tests/unit` and integrations under `tests/integration` or `tests/feature`. These are project conventions, not special engine categories. Discovery traverses subdirectories; the starting directory should be inside the project and importable from its root. Keep the working directory at that root when running Reactor.

The command uses application providers and configuration. It does not automatically change `APP_ENV`, database connections or drivers to an isolated environment. Configure test resources before bootstrap; review [injection and isolation](/en/testing/dependency-injection) before testing persistence.

Continue with [lifecycle and decorators](/en/testing/cases-and-decorators). MCP component tests have their [own guide](/en/testing/mcp-testing).
