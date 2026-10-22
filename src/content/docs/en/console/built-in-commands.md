---
title: "Built-in commands"
description: "Run these commands from your generated project root:"
editUrl: true
lastUpdated: false
---

## Find a command for your task

Run these commands from your generated project root:

| Task | Command | Result |
|---|---|---|
| List commands | `uv run python -B reactor list` | Registry and descriptions. |
| Inspect routes | `uv run python -B reactor route:list` | Registered route metadata. |
| Start development HTTP | `uv run python -B reactor serve` | Long-running server. |
| Inspect migration state | `uv run python -B reactor migrate:status` | Applied and pending migrations. |
| Run application tests | `uv run python -B reactor test` | Results and process exit status. |
| Inspect the schedule | `uv run python -B reactor schedule:list` | Registered scheduled tasks. |
| See one command's options | `uv run python -B reactor serve --help` | Help without starting HTTP. |

Commands with persistent effects require the relevant application configuration and dependencies. The examples ending in `--help` display help; remove that flag only when you intend to create or modify a component.

The built-in registry lives in `orionis/console/core/commands.py`; applications can add commands. Inspect `uv run python -B reactor list` and each signature's help before persistent operations. This guide groups the catalog by task rather than replacing individual argument help.

## Generate components

`make:console-command`, `make:model`, `make:factory`, `make:job`, `make:mail`, HTTP generators, providers, facades, services, contracts, tests, and MCP generators use stubs and application paths. Consult `list` for each signature instead of inferring options from similarly named commands in other frameworks.

```shell
uv run python -B reactor make:job SendWelcomeEmail --help
uv run python -B reactor make:factory ProductFactory --help
```

Generating a model does not migrate its table; generating a job does not start workers. Review generated imports, dependencies, and configuration before use.

## Evolve data

See the [Database command reference](/en/database/commands) for all arguments, defaults and examples for inspection, generators, migrations, seeding and wiping.

`migrate`, `migrate:status`, `migrate:rollback`, `migrate:reset`, `migrate:refresh`, `migrate:fresh`, `seed`, and `db:seed` are covered in [migrations and seeders](/en/database/migrations-and-seeders). They share `--database`/`-d` connection selection. Rollback `--step` counts batches. `db:show` displays database information; `db:table` inspects tables; `db:wipe` removes schema data through its workflow and requires operational care.

```shell
uv run python -B reactor migrate:status --database sqlite
uv run python -B reactor db:show --help
uv run python -B reactor db:table --help
```

Do not schedule `migrate:fresh`, `db:wipe`, or `queue:clear` as routine production housekeeping. They remove data or pending work, rather than cleaning completed-job records.

## Serve, inspect, and test

`serve` starts the development server with its supported options; see [HTTP](/en/http) for the web lifecycle. `route:list` inspects registered routes. `test` runs Orionis testing; selection and modes belong to [Testing](/en/testing). Development servers and workers are long-running processes and need supervision in operational environments.

`schedule:list` and `schedule:work` belong to the [scheduler](/en/console/task-scheduling). `queue:work`, `queue:failed`, `queue:retry`, `queue:forget`, and `queue:clear` operate [queues](/en/asynchronous/queues/workers-and-failures). MCP commands are covered under [MCP](/en/protocols/mcp).

## Optimize and maintain

- `optimize` validates Python source syntax in memory; it does not prewarm caches, run tests, or write bytecode.
- `optimize:clear` removes compiled configuration, route, and command caches, Python bytecode, and project `build`/`dist` artifacts. Review these locations before clearing them.
- `about` and `env` display application/runtime information.
- `down` and `up` set the shared maintenance marker; they do not stop worker processes.
- `clear:cache`, `clear:logs`, `clear:views`, and `clear:testing` clear their respective artifacts; consult command help and service configuration.
- `key:generate` creates an application encryption key. Coordinate changes for an existing application with [encryption](/en/security/encryption), because already encrypted data depends on the previous key.

## Install extras from the catalog

The public signature is `packages`, although its implementation class is named `InstallCommand`:

```shell
uv run python -B reactor packages --list
uv run python -B reactor packages s3 redshift --yes
uv run python -B reactor packages group:dev --yes
```

`--list` only displays the catalog; the other examples install packages using `uv` for the interpreter running Orionis. `--yes` bypasses interactive confirmation.

The command first uses bundled `orionis/pyproject.toml`, then the framework root manifest for source/editable installations, and finally the application root manifest as fallback. Purpose text comes from `[tool.orionis.packages]`, using keys such as `extra:s3` or `group:dev`. Extras, markers, groups, and deduplication are preserved; the application manifest and lockfile are not rewritten. If expected catalog entries are absent, check the available manifest and active Python environment.

For reproducible project dependencies, also declare the required Orionis extras in the application's `pyproject.toml` and update its lockfile. `packages` changes the running environment only; a later project synchronization follows the manifest and lockfile, not that manual installation.
