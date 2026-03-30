---
title: Command Routing
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Command Routing

Orionis Framework allows you to register console commands as routes pointing to
classes and methods in your application. Instead of creating a full command class
for every case, you can expose existing logic through a command signature.

This approach is useful when:

- You already have services with reusable logic.
- You want to avoid boilerplate for simple tasks.
- You need to quickly and cleanly expose internal actions via the CLI.

## What Is Command Routing?

Command routing consists of mapping a console signature (for example, `app:test`)
to an executable target within your application.

In Orionis Framework, that target can be defined primarily in two ways:

- Class + specific method.
- Callable class via `__call__`.

Both options are registered with `Reactor.command(...)`, and can be enriched with
options such as description, timestamp, and arguments.

## Advantages of Using Command Routes

- Reduces boilerplate when you don't need a dedicated command class.
- Allows reusing existing services without duplicating logic.
- Simplifies maintenance by centralizing behavior in your domain layer.
- Speeds up the creation of operational or administrative tasks.

## Where Routes Are Defined

In the standard Orionis Framework skeleton, console routes are defined in:

`routes\console.py`

This file acts as the registration point for signatures and targets.

## General Structure of `Reactor.command`

The conceptual form is:

```python
Reactor.command("signature:command", target)...
```

Where:

- `"signature:command"` is the signature you will run from the terminal.
- `target` is the class or class+method combination that will be executed.

After registration, you can chain configuration:

- `.description("...")`
- `.timestamp()`
- `.arguments([...])`

## Registering as a Class + Method Route

This variant is used when you want to expose a specific method of a class.

**Registration example**

```python
from app.services.welcome_service import WelcomeService
from orionis.console.args.argument import Argument
from orionis.support.facades.reactor import Reactor

Reactor.command("app:test", [WelcomeService, "greetUser"])\
    .description("Test command defined as a route")\
    .timestamp()\
    .arguments([
        Argument(name_or_flags=["--name", "-n"], type_=str, required=True),
    ])
```

**What is happening?**

- A command signature called `app:test` is created.
- That signature points to the `greetUser` method of the `WelcomeService` class.
- A description visible in `reactor list` is added.
- Timestamp is enabled in the command output.
- The `--name` argument is defined as required.

**Expected target method signature**

```python
class WelcomeService:
    def greetUser(self, name: str) -> None:
        # method logic
        ...
```

**Terminal execution**

```bash
python -B reactor app:test --name="Orionis"
```

## Registering as a Callable Class Route (`__call__`)

This variant is used when your class defines `__call__` as its entry point.

**Registration example**

```python
from app.services.welcome_service import WelcomeService
from orionis.console.args.argument import Argument
from orionis.support.facades.reactor import Reactor

Reactor.command("app:test", WelcomeService)\
    .description("Test command with callable class")\
    .timestamp()\
    .arguments([
        Argument(name_or_flags=["--name", "-n"], type_=str, required=False),
    ])
```

**Expected target class**

```python
class WelcomeService:
    def __call__(self, name: str = "User") -> None:
        # method logic
        ...
```

**Behavior**

- If you pass `--name`, that value is injected into `__call__`.
- If you don't pass it, the default value (`"User"`) is used.

**Terminal execution**

With parameter:

```bash
python -B reactor app:test --name="Ana"
```

Without parameter:

```bash
python -B reactor app:test
```

## Differences Between Both Approaches

| Approach | Use when | Main advantage |
|----------|----------|----------------|
| Class + method | You want to expose a specific action of a class | Greater precision over the entry point |
| Callable class (`__call__`) | The class represents a single action | Shorter and cleaner registration |

## Design Recommendations

- Keep signatures descriptive (`module:action`), for example `user:sync`.
- Avoid routes that point to logic tightly coupled to infrastructure.
- Prioritize domain services with clear responsibilities.
- Define explicit arguments to improve the CLI experience.
- Always add `description(...)` to facilitate discovery in `reactor list`.

## Recommended Complete Example

```python
from app.services.user_sync_service import UserSyncService
from orionis.console.args.argument import Argument
from orionis.support.facades.reactor import Reactor

Reactor.command("user:sync", [UserSyncService, "run"])\
    .description("Synchronizes users with the external provider")\
    .timestamp()\
    .arguments([
        Argument(name_or_flags=["--source"], type_=str, required=True),
        Argument(name_or_flags=["--dry-run"], action="store_true", required=False),
    ])
```

Expected target signature:

```python
class UserSyncService:
    def run(self, source: str, dry_run: bool = False) -> None:
        # synchronization logic
        ...
```

Execution example:

```bash
python -B reactor user:sync --source="crm" --dry-run
```

## Common Errors and How to Avoid Them

**The signature does not appear in `reactor list`**

- Verify that the route is registered in `routes\console.py`.
- Check for import errors in the routes file.
- Confirm you are running the project with the correct Python environment.
- Run `python -B reactor optimize:clear` to clear stale bytecode.

**The method does not receive arguments**

- Verify that the argument name matches the expected parameter.
- Check types (`type_`) and required status (`required`) when declaring `Argument`.
- Ensure the value is being passed correctly in the CLI.

**Error resolving the target class**

- Confirm that the class is importable from `routes\console.py`.
- Check dependencies or initialization required by the class.
- If using DI, validate that the container can resolve the service.

## Operational Best Practices

- Use `python -B reactor list` after registering a new route to validate it.
- Keep the routes file readable by grouping commands by module.
- Avoid registering commands with ambiguous or overly generic signatures.
- Document within the team which signatures are internal and which are commonly used.

## Notes

Command routes in Orionis Framework allow you to expose application logic quickly,
maintainably, and without unnecessary boilerplate code. Choosing between
`[Class, "method"]` or a callable `Class` depends on the use case, but in both
scenarios the goal is the same: turn your business logic into clear, reusable, and
easy-to-operate console actions.