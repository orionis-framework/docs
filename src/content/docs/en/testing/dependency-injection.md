---
title: "Dependency injection and isolation"
description: "Receive services in test methods, resolve them in fixtures and control scopes and external resources."
editUrl: true
lastUpdated: false
---

## Dependency injection

Orionis wraps the selected test method and calls it through `Application.invoke()`. Annotated parameters receive registered services or classes the container can construct. This works for synchronous and asynchronous methods; it does not allow a synchronous method to use asynchronous services without `await`.

This example is self-contained: the test receives `PriceCalculator`, whose constructor receives another resolvable dependency:

```python
from decimal import Decimal

from orionis.test import TestCase


class TaxPolicy:
    def rate(self) -> Decimal:
        return Decimal("0.20")


class PriceCalculator:
    def __init__(self, policy: TaxPolicy) -> None:
        self.policy = policy

    def total(self, net: Decimal) -> Decimal:
        return net * (Decimal("1") + self.policy.rate())


class TestPrices(TestCase):
    def testTaxIncluded(self, calculator: PriceCalculator) -> None:
        self.assertEqual(calculator.total(Decimal("10")), Decimal("12.00"))
```

For abstract contracts, register an implementation in a [container provider](/en/application/container/providers). You can also receive `IApplication` and use `app.config(...)`, `await app.make(...)` or `await app.invoke(...)`. Helpers called directly by your code receive the arguments you supply; belonging to the test case does not give them automatic injection.

### Resolving scoped services

The runner does not create a container scope for each method. An isolated loop does not clear singletons, caches or databases either. To test a scoped service's lifetime, open the scope before resolving it:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.test import TestCase


class TestScopeState:
    def __init__(self) -> None:
        self.values: list[str] = []


class TestScopedServices(TestCase):
    async def testFreshState(self, app: IApplication) -> None:
        app.scoped(None, TestScopeState, override=True)

        async with app.beginScope():
            first = await app.make(TestScopeState)
            first.values.append("created")
            self.assertIs(await app.make(TestScopeState), first)

        async with app.beginScope():
            second = await app.make(TestScopeState)
            self.assertIsNot(first, second)
            self.assertEqual(second.values, [])
```

The example registers a class used only by the test. In an application, the binding normally belongs in a provider. Do not request `state: TestScopeState` as a method parameter before opening the scope: injection happens before the method body starts. Exiting clears the scope's state; any resources the instance opened still need explicit closing.


## Resolve dependencies from hooks and helpers

Hooks do not take service parameters. When you need the application from `asyncSetUp`, resolve its facade explicitly and keep that test's resources. This is a complete module:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.support.facades import Application
from orionis.test import TestCase


class TestConfiguration(TestCase):
    async def asyncSetUp(self) -> None:
        self.app = await Application.resolve()

    async def _readName(self, app: IApplication) -> str:
        return app.config("app.name")

    async def testName(self) -> None:
        name = await self.app.invoke(self._readName)
        self.assertEqual(name, self.app.config("app.name"))
```

`_readName` is a helper, not a discovered case. `await self.app.invoke(...)` requests resolution of its parameter; `await self._readName(self.app)` is the equivalent explicit call. Annotating a helper does not automatically provide arguments to an ordinary call.

To obtain a service directly, use `await self.app.make(ContractOrClass)`. If your fixture opens connections or resources, register cleanup when acquiring them with `addCleanup` or `addAsyncCleanup`; see [fixtures and cleanup](/en/testing/cases-and-decorators). Do not add injected parameters to the `TestCase` constructor, `setUp`, `asyncSetUp` or teardown hooks.

## What the runner isolates

| Element | Actual scope |
| --- | --- |
| `TestCase` instance and event loop | Created for the selected method. |
| Application and singleton bindings | May be reused during the suite; they are not reset per case. |
| Scoped services | Require an active scope in the context resolving them. |
| Databases, files, queues and cache | Retain changes unless your test arranges cleanup. |

The engine runs the synchronous suite in an executor. It does not automatically propagate the CLI scope context to that thread; do not depend on it inside the case. Open the scope in the test method or fixture before resolving scoped services. The container does resolve constructors of **services** needed by the method; the test loader creates the `TestCase` instance.

A pure-rule test does not need to replace the complete application. For integrations use exclusive data, stores intended for testing and explicit cleanup. Inheriting from `TestCase` does not automatically roll back a database; [Database and ORM testing](/en/orm/testing) explains the relevant mechanisms.

## Choose the environment before running

`reactor test` does not change `APP_ENV`, replace connections or activate another `.env` file based on the command name. Configure test services before application creation; for example, in the `.env` used for that run:

```dotenv
APP_ENV=testing
APP_DEBUG=bool:false
```

This selects the application environment; it does not automatically turn a production database into a test database. Configure connections, disks and services for your project. Variables are read in `config/`; receive `IApplication` in the test and use `app.config(...)`.

If you retain compiled bootstrap cache between runs, review its [paths and invalidation](/en/application/paths-and-caching) when changing configuration. Do not reuse another environment's cache without reviewing it. To replace collaborators during a test, use `unittest.mock` and patch contexts; see [test doubles](/en/testing/cases-and-decorators#test-doubles).

The runner does not create an HTTP request or load a payload for case parameters. To test a rule or schema, invoke it with fixture data; for MCP requests use [the MCP test client](/en/mcp/testing), whose per-request scope belongs to that integration.
