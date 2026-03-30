---
title: Native Commands
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Orionis Framework Native Commands

Orionis Framework includes a command console designed to accelerate development, maintenance, and operational tasks. This guide covers the most important native commands, their purpose, and usage examples so you can quickly incorporate them into your workflow.

In this section you will find:
- What native commands are and when to use them.
- General execution syntax.
- Details on key framework commands.
- Recommendations for development and production.

## What Are Native Commands?

Native commands are utilities built into Orionis Framework that you can run from the terminal to perform common actions without writing additional scripts.

They allow you to, for example:
- Inspect the framework's state.
- List and execute scheduled tasks.
- Generate base structures to extend functionality.
- Start the development server.
- Run automated tests.

## General Syntax

The standard way to run a command is:

```bash
python reactor <command> <arguments/options>
```

You can also use the `-B` flag to prevent the generation of `.pyc` files:

```bash
python -B reactor <command> <arguments/options>
```

## Recommendation for Using `-B`

During development, using `python -B` helps keep the project cleaner and reduces unwanted side effects from stale bytecode.

In production, evaluate your deployment strategy:
- If your pipeline prepares clean images (e.g., Docker), you can clear caches during the build.
- If you prioritize startup performance, you may allow bytecode to be generated at runtime.

## Quick Command Reference

- `list`: Displays all available commands.
- `about`: Shows version and environment information.
- `optimize:clear`: Clears bytecode and optimization artifacts.
- `schedule:list`: Lists scheduled tasks and their configuration.
- `schedule:work`: Starts and keeps the scheduler running.
- `make:command`: Generates a custom command.
- `make:provider`: Generates a service provider.
- `make:task:listener`: Generates a listener for task events.
- `serve`: Starts the development server.
- `test`: Runs project tests.

## The `list` Command

**Purpose**

Displays all available commands, both native and custom.

**Usage**

```bash
python -B reactor list
```

**When to use it**

- When onboarding to an existing project.
- After creating custom commands.
- To verify the exact signature of a command before running it.

## The `about` Command

**Purpose**

Displays Orionis Framework version information and runtime environment details.

**Usage**

```bash
python -B reactor about
```

**When to use it**

- To validate the installed version.
- To share environment information with the team during support.
- To confirm context before debugging issues.

## The `optimize:clear` Command

**Purpose**

Removes bytecode files and optimization artifacts generated during the application's bootstrapping process.

**Usage**

```bash
python -B reactor optimize:clear
```

**When to use it**

- After significant configuration changes.
- When detecting inconsistent behavior after refactoring.
- In build or deployment processes to ensure a clean startup.

**Operational note**

In production environments, running this on every startup is usually unnecessary. The recommended approach is to incorporate it into your pipeline when aiming for a reproducible, clean deployment.

## The `schedule:list` Command

**Purpose**

Displays a detailed view of all scheduled tasks registered in the project.

**Usage**

```bash
python -B reactor schedule:list
```

**Information displayed**

- `Signature`: Task name.
- `Arguments`: Configured arguments.
- `Purpose`: Descriptive purpose.
- `Random Delay (Calculated Result)`: Calculated random delay.
- `Coalesce`: Coalescence state.
- `Max Instances`: Simultaneous instance limit.
- `Misfire Grace Time`: Misfire tolerance margin.
- `Start Date - End Date`: Execution date range.
- `Details`: Execution frequency or interval.

**When to use it**

- Before going to production.
- During operational audits.
- To verify that a new task was registered correctly.

## The `schedule:work` Command

**Purpose**

Starts the process that keeps the scheduler active and executes tasks in the background according to their schedule.

**Usage**

```bash
python -B reactor schedule:work
```

**Expected behavior**

- Reads tasks defined in `app\console\scheduler.py`.
- Evaluates execution times and triggers tasks as appropriate.
- Publishes associated events for listeners to respond to.
- Maintains a persistent process for recurring tasks.

**Recommendations by environment**

In development:
- Run this command in a separate terminal.
- Leave it running while testing periodic tasks.

In production:
- Manage the process with operating system tools.
- Ensure automatic restart on failures.

On Unix:
- You can use `systemd`, `supervisord`, or equivalent strategies.

On Windows:
- You can use Task Scheduler or a dedicated service.

**Direct execution without the scheduler**

If you don't need the scheduler and only want to run a specific command at intervals, you can rely on system tools:
- Linux: `cron`.
- Windows: Task Scheduler.

Example on Linux with `cron`:

1. Open the crontab editor:

```bash
crontab -e
```

2. Add a rule to run a command every 5 minutes:

```bash
*/5 * * * * cd /path/to/your/project && python -B reactor <signature>
```

3. Save the changes and verify the task is registered:

```bash
crontab -l
```

Target command:

```bash
python -B reactor <signature>
```

## The `make:command` Command

**Purpose**

Generates the base structure for a custom command to extend your project's console.

**Usage**

```bash
python -B reactor make:command <name_of_command> [--options]
```

**Common options**

- `--signature`: The signature used to invoke the command.
- `--description`: Description visible in `reactor list`.

**Example**

```bash
python -B reactor make:command clean_cache --signature="cache:clean" --description="Clears application cache"
```

**Best practice**

Use consistent signatures following the `module:action` format to facilitate discovery and maintenance.

## The `make:provider` Command

**Purpose**

Generates the base structure for a service provider to register bindings, configurations, or startup logic in the application's service container.

**Usage**

```bash
python -B reactor make:provider <name> [--deferred]
```

**Arguments and options**

- `name` (required): Name of the provider file and class. Must follow `snake_case` format (only lowercase letters, numbers, and underscores, starting with a letter).
- `--deferred` (optional): If specified, the provider will be deferred and only loaded when needed, optimizing startup performance.

**Examples**

Create a standard (eager) provider:

```bash
python -B reactor make:provider cache
```

Create a deferred provider:

```bash
python -B reactor make:provider billing --deferred
```

Create a provider with a compound name:

```bash
python -B reactor make:provider payment_gateway --deferred
```

**Expected behavior**

- Validates that the `name` argument follows `snake_case` format.
- Generates the class name by capitalizing each underscore-separated segment and appending the `Provider` suffix if not present (e.g., `payment_gateway` → `PaymentGatewayProvider`).
- Creates the file in the `app/providers/` directory with the `_provider.py` suffix if not included (e.g., `cache` → `cache_provider.py`).
- If the file already exists, reports the error without overwriting it.

**Eager vs. deferred providers**

- **Eager** (default): The provider is loaded and registered during application startup. Ideal for services that need to be available from the start.
- **Deferred** (`--deferred`): The provider is loaded only when the container resolves one of the bindings it provides. Useful for heavy or infrequently used services, as it reduces startup time.

**Best practice**

Name your providers descriptively and aligned with the module or functionality they register. Use the `--deferred` flag for providers that encapsulate external integrations or sporadically used services.

## The `make:task:listener` Command

**Purpose**

Generates a listener to react to lifecycle events of scheduled tasks.

**Usage**

```bash
python -B reactor make:task:listener <name_of_listener>
```

**Location and relationship with the scheduler**

- Listeners are placed in `app\console\listeners`.
- They connect to tasks defined in `app\console\scheduler.py`, within the `tasks` method.

**Common task events**

- `onTaskAdded`: A task is added to the scheduler.
- `onTaskRemoved`: A task is removed.
- `onTaskExecuted`: The task completes successfully.
- `onTaskError`: An error occurs during task execution.
- `onTaskMissed`: The task does not execute at the expected time.
- `onTaskSubmitted`: The task is submitted for execution.
- `onTaskMaxInstances`: The maximum allowed instances is reached.

**When to use listeners**

- To record operational auditing.
- To emit notifications after critical executions.
- To trigger compensations or alternative flows on failures.

## The `serve` Command

**Purpose**

Starts the development server to run the application locally.

Basic **usage**

```bash
python -B reactor serve
```

**Options**

- `--interface`: Defines the server interface.
- `--port`: Sets the listening port.
- `--log`: Enables detailed server logs.

**Common values**

- `--interface="rsgi"`: default interface.
- `--interface="asgi"`: useful for compatible ASGI servers.
- `--port="8000"`: default port.

**Examples**

```bash
python -B reactor serve --interface="rsgi" --port="8000" --log
```

```bash
python -B reactor serve --interface="asgi" --port="8080" --log
```

**Recommendation**

Enable `--log` when debugging startup issues, occupied ports, or web server behavior.

## The `test` Command

**Purpose**

Runs project tests to validate application behavior.

**Usage**

```bash
python -B test
```

**Available options**

- `--verbosity, -v`: Output detail level.
- `--fail-fast, -f`: Stops execution on first failure (`1`) or continues (`0`).
- `--start-dir, -s`: Test search directory.
- `--file-pattern`: Test file pattern.
- `--method-pattern`: Test method pattern.

**Default values**

- Verbosity: `2`.
- Fail fast: `0`.
- Test directory: `tests`.
- File pattern: `test_*.py`.
- Method pattern: `test*`.

**Useful examples**

Run all tests with detailed output:

```bash
python -B test -v 2
```

Stop on first failure:

```bash
python -B test -f 1
```

Run tests from a different directory:

```bash
python -B test --start-dir="custom_tests"
```

Filter by method:

```bash
python -B test --method-pattern="test_auth*"
```

## Recommended Workflow

For a more stable development routine, you can follow this order:

1. Run `python -B reactor list` to check available commands.
2. If you changed configuration or bootstrap, run `python -B reactor optimize:clear`.
3. Start the application with `python -B reactor serve`.
4. If you use scheduled tasks, start `python -B reactor schedule:work` in another terminal.
5. Run `python -B test` before integrating changes.

## General Best Practices

- Keep custom command signatures clear and consistent.
- Always document `--description` when creating new commands.
- Periodically review `schedule:list` to detect invalid configurations.
- Record critical events through listeners on high-impact tasks.
- Integrate test execution into your CI/CD pipeline.

## Troubleshooting Common Issues

**A command does not appear in `list`**

- Verify the command is correctly registered.
- Check for import errors in console modules.
- Confirm you are using the correct Python environment.
- Run `python -B reactor optimize:clear` to clear stale bytecode.

**A scheduled task does not execute**

- Confirm `schedule:work` is active.
- Check restrictions such as `start_date`, `end_date`, or `max_instances`.
- Review listener logs to identify failures.
- Check the Orionis Framework general log for related errors.

**Tests do not detect expected cases**

- Check `--start-dir` and `--file-pattern`.
- Verify that methods follow the `test*` pattern.
- Increase verbosity with `-v` for more diagnostic detail.

## Note

The native commands of Orionis Framework are a key operational layer for developing with greater speed and control. Mastering these commands will allow you to automate tasks, improve system observability, and maintain more predictable operations in both development and production.