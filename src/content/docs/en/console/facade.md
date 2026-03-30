---
title: Console Facade
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Introduction

The `Reactor` facade is the high-level interface that Orionis Framework exposes for
interacting with the CLI command system from any layer of the application. It acts
as an abstraction layer that decouples the command invocation point from its
internal implementation, allowing you to execute any command registered in the
framework with a single asynchronous call.

Unlike invoking a command by directly instantiating its class, the facade delegates
resolution, configuration, and execution to the application container, ensuring
that dependency injection and the command lifecycle are respected in all usage
contexts.

## When to Use the Console Facade?

The facade is especially useful in the following scenarios:

- **Reusing business logic**: when the operation is already encapsulated in a
  command and you want to invoke it from a service, controller, or scheduled task
  without duplicating code.
- **Internal automation**: when a system process needs to trigger another command
  as part of a broader workflow.
- **HTTP integration**: when an application endpoint needs to launch a console
  operation in response to a client request.
- **Command composition**: when a command needs to delegate part of its work to
  another command already registered in the framework.

For processes that do not require an immediate response, refer to the background
tasks documentation available in the HTTP section, where you will find how to
launch commands asynchronously without blocking the request cycle.

## Import

The facade is imported from the framework's support module:

```python
from orionis.support.facades.reactor import Reactor
```

There is no need to instantiate the class or manually resolve dependencies. The
facade directly exposes the available class methods for immediate use.

## Facade API

### `Reactor.call`

Executes a command registered in the framework asynchronously.

```python
await Reactor.call(signature: str, arguments: list[str] = []) -> None
```

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| <span style="white-space:nowrap">`signature`</span> | <span style="white-space:nowrap">`str`</span> | Signature of the command to execute, as defined in its `signature` property. |
| <span style="white-space:nowrap">`arguments`</span> | <span style="white-space:nowrap">`list[str]`</span> | List of arguments and options in CLI format (`--flag=value`, `--flag`). |

**Notes**

- The method is `async` and must be awaited with `await` in an asynchronous context.
- Arguments are passed in the same format as they would be used from the terminal.
- If the command does not exist or fails during execution, the framework will
  propagate the corresponding exception.

## Executing a Command

The following example shows how to invoke the `sync:users` command with a set of
arguments from any application class:

```python
# Ensure the facade is imported
from orionis.support.facades.reactor import Reactor

class UserController(BaseController):

    async def syncUsers(self) -> None:
        await Reactor.call("sync:users", [
            "--category=admin",
            "--force",
            "--verbose",
        ])
```

In this case, the `sync:users` command will receive the `--category`, `--force`,
and `--verbose` arguments exactly as if they had been provided from the terminal.

## Usage from an HTTP Controller

The facade can be invoked without restrictions from HTTP controllers, allowing
you to reuse business logic already encapsulated in a command without needing
to extract it into a separate service.

```python
# Ensure the facade is imported
from orionis.support.facades.reactor import Reactor

class ReportController(BaseController):

    async def generate(self, request: Request) -> dict:

        # Validation and data preparation logic here...

        await Reactor.call("report:generate", [
            f"--period={period}",
            "--format=pdf",
        ])

        # HTTP response logic here...
```

For long-running operations where the client should not wait for the process to
complete, refer to the background tasks documentation in the HTTP session section.

## Best Practices

- **Prefer the facade over direct instantiation**: invoking a command through
  `Reactor.call` ensures that the container resolves all command dependencies
  correctly.
- **Pass only the necessary arguments**: avoid sending empty or redundant arguments;
  the command will use the default values defined in its configuration for
  parameters that are not provided.
- **Handle exceptions at the caller**: if the command can fail, wrap the call in a
  `try/except` block to control the flow from the invoking context.
- **Do not use the facade for critical synchronous logic**: since `Reactor.call` is
  asynchronous, make sure you are in a context that supports `await`; otherwise,
  use a background task.

## Considerations

- The facade resolves the command based on its `signature`, so it must be registered
  and unique within the project.
- Any console output generated by the command during execution will be visible in
  the context from which it is invoked (terminal, server log, etc.).
- Optional arguments that are not declared will simply be ignored by the command
  parser; they do not generate errors.