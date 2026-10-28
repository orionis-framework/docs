---
title: "Built-in commands"
description: "Complete catalog of Orionis's 68 native commands, grouped by task and linked to argument/option references."
editUrl: true
lastUpdated: false
---

Reactor's native registry includes **68 commands**. These references cover their arguments, options, defaults, effects and execution examples. Applications can add signatures through classes and [console routes](/en/console/command-routing).

Run commands from the project root. The direct command and local file share the same registry and execution lifecycle:

```shell
orionis list
python -B reactor list

orionis make:console-command --help
python -B reactor make:console-command --help
```

`list` displays registered signatures; `COMMAND --help` inspects a signature's parser without executing the operation. `-h` is its short form. Each page lists the actual declared options/aliases, including inherited generator and Database options. Long options cannot be abbreviated.

## Choose a reference

| Family | Count | Coverage |
|---|---|---|
| [Code generators](/en/console/built-in-generators) | 24 | Create all 24 available component types from stubs. |
| [Application and maintenance commands](/en/console/built-in-application) | 16 | Server, tests, inspection, clearing, keys and packages. |
| [Database commands](/en/console/built-in-database) | 11 | Inspection, migrations, rollback, seeding and wiping. |
| [Worker and scheduler commands](/en/console/built-in-workers) | 10 | Queue table preparation, workers, failure operations, scheduler and MCP. |
| [Project bootstrap and recovery](/en/console/built-in-bootstrap) | 7 | Enable contexts and restore missing configuration. |

## Signature index

Each link opens the complete options and examples for that command.

| Command | Purpose |
|---|---|
| [`about`](/en/console/built-in-application#command-about) | Show installed framework metadata. |
| [`bootstrap:ai`](/en/console/built-in-bootstrap#command-bootstrap-ai) | Enable MCP server routes. |
| [`bootstrap:api`](/en/console/built-in-bootstrap#command-bootstrap-api) | Enable API routing. |
| [`bootstrap:config`](/en/console/built-in-bootstrap#command-bootstrap-config) | Restore missing official configuration files. |
| [`bootstrap:console`](/en/console/built-in-bootstrap#command-bootstrap-console) | Enable console routes and directories. |
| [`bootstrap:lifespan`](/en/console/built-in-bootstrap#command-bootstrap-lifespan) | Create and integrate lifecycle callbacks. |
| [`bootstrap:web`](/en/console/built-in-bootstrap#command-bootstrap-web) | Enable web routing. |
| [`bootstrap:websocket`](/en/console/built-in-bootstrap#command-bootstrap-websocket) | Enable WebSocket routing. |
| [`clear:cache`](/en/console/built-in-application#command-clear-cache) | Clear the default cache store. |
| [`clear:logs`](/en/console/built-in-application#command-clear-logs) | Remove framework log files. |
| [`clear:testing`](/en/console/built-in-application#command-clear-testing) | Remove cached test results. |
| [`clear:views`](/en/console/built-in-application#command-clear-views) | Remove compiled view bytecode. |
| [`db:seed`](/en/console/built-in-database#command-db-seed) | Run pending seeders. |
| [`db:show`](/en/console/built-in-database#command-db-show) | Inspect a database and summarize its tables. |
| [`db:table`](/en/console/built-in-database#command-db-table) | Show a table's structure. |
| [`db:wipe`](/en/console/built-in-database#command-db-wipe) | Drop database user objects. |
| [`down`](/en/console/built-in-application#command-down) | Enable the HTTP maintenance state. |
| [`env`](/en/console/built-in-application#command-env) | Show the application environment. |
| [`key:generate`](/en/console/built-in-application#command-key-generate) | Generate and persist the application encryption key. |
| [`list`](/en/console/built-in-application#command-list) | List Reactor's loaded command registry. |
| [`make:console-command`](/en/console/built-in-generators#command-make-console-command) | Create a command with a unique signature and description. |
| [`make:console-listener`](/en/console/built-in-generators#command-make-console-listener) | Create a console task listener. |
| [`make:contract`](/en/console/built-in-generators#command-make-contract) | Generate a service contract. |
| [`make:database-migration`](/en/console/built-in-generators#command-make-database-migration) | Create a timestamped migration. |
| [`make:database-schema`](/en/console/built-in-generators#command-make-database-schema) | Generate a reusable table definition. |
| [`make:database-seeder`](/en/console/built-in-generators#command-make-database-seeder) | Generate a database seeder. |
| [`make:facade`](/en/console/built-in-generators#command-make-facade) | Generate a facade and its typing interface. |
| [`make:factory`](/en/console/built-in-generators#command-make-factory) | Generate a model factory. |
| [`make:http-controller`](/en/console/built-in-generators#command-make-http-controller) | Create a resource or invokable controller. |
| [`make:http-middleware`](/en/console/built-in-generators#command-make-http-middleware) | Generate HTTP middleware. |
| [`make:http-schema`](/en/console/built-in-generators#command-make-http-schema) | Create an HTTP validation schema. |
| [`make:http-schema-rule`](/en/console/built-in-generators#command-make-http-schema-rule) | Generate a custom validation rule. |
| [`make:job`](/en/console/built-in-generators#command-make-job) | Create an asynchronous queue job. |
| [`make:mail`](/en/console/built-in-generators#command-make-mail) | Create a reusable mail class. |
| [`make:mcp-prompt`](/en/console/built-in-generators#command-make-mcp-prompt) | Generate an MCP prompt. |
| [`make:mcp-resource`](/en/console/built-in-generators#command-make-mcp-resource) | Generate an MCP resource. |
| [`make:mcp-server`](/en/console/built-in-generators#command-make-mcp-server) | Generate an MCP server. |
| [`make:mcp-tool`](/en/console/built-in-generators#command-make-mcp-tool) | Generate an MCP tool. |
| [`make:model`](/en/console/built-in-generators#command-make-model) | Create an ORM model. |
| [`make:provider`](/en/console/built-in-generators#command-make-provider) | Create an eager or deferred provider. |
| [`make:realtime-hub`](/en/console/built-in-generators#command-make-realtime-hub) | Create a remote-method hub. |
| [`make:realtime-socket`](/en/console/built-in-generators#command-make-realtime-socket) | Create a Realtime WebSocket handler. |
| [`make:service`](/en/console/built-in-generators#command-make-service) | Generate a service class. |
| [`make:test`](/en/console/built-in-generators#command-make-test) | Create an application test case. |
| [`mcp:list`](/en/console/built-in-workers#command-mcp-list) | List HTTP and local MCP servers. |
| [`mcp:start`](/en/console/built-in-workers#command-mcp-start) | Start a local MCP server over STDIO. |
| [`migrate`](/en/console/built-in-database#command-migrate) | Apply pending migrations and optionally seeders. |
| [`migrate:fresh`](/en/console/built-in-database#command-migrate-fresh) | Rebuild history and reapply migrations. |
| [`migrate:refresh`](/en/console/built-in-database#command-migrate-refresh) | Roll back batches and rerun pending migrations. |
| [`migrate:reset`](/en/console/built-in-database#command-migrate-reset) | Roll back every applied migration. |
| [`migrate:rollback`](/en/console/built-in-database#command-migrate-rollback) | Roll back the latest batch or several batches. |
| [`migrate:status`](/en/console/built-in-database#command-migrate-status) | Show applied and pending migrations. |
| [`optimize`](/en/console/built-in-application#command-optimize) | Validate project Python syntax. |
| [`optimize:clear`](/en/console/built-in-application#command-optimize-clear) | Remove compiled application artifacts. |
| [`packages`](/en/console/built-in-application#command-packages) | Install optional Orionis extras and dependency groups. |
| [`queue:clear`](/en/console/built-in-workers#command-queue-clear) | Clear a queue, including delayed or reserved jobs. |
| [`queue:failed`](/en/console/built-in-workers#command-queue-failed) | List terminally failed jobs. |
| [`queue:forget`](/en/console/built-in-workers#command-queue-forget) | Remove a failure record. |
| [`queue:migrate`](/en/console/built-in-workers#command-queue-migrate) | Create missing SQL queue and failure tables while preserving data. |
| [`queue:retry`](/en/console/built-in-workers#command-queue-retry) | Requeue one identified failed job. |
| [`queue:work`](/en/console/built-in-workers#command-queue-work) | Consume persisted jobs from a queue connection. |
| [`route:list`](/en/console/built-in-application#command-route-list) | Inspect registered HTTP routes. |
| [`schedule:list`](/en/console/built-in-workers#command-schedule-list) | Inspect tasks defined by the scheduler. |
| [`schedule:work`](/en/console/built-in-workers#command-schedule-work) | Start the scheduler process. |
| [`seed`](/en/console/built-in-database#command-seed) | Run pending seeders. |
| [`serve`](/en/console/built-in-application#command-serve) | Start the application's Granian HTTP server. |
| [`test`](/en/console/built-in-application#command-test) | Run application tests. |
| [`up`](/en/console/built-in-application#command-up) | Disable the HTTP maintenance state. |

## Interpret outcomes

Reactor returns the integer returned by `handle()`; a non-integer return is converted to `0`. An uncaught exception reaches the console failure handler and produces `1`. The parser exits with `0` for help or `2` for invalid arguments.

Not every command converts internal failures into an exception or status `1`: common generators print certain errors and return `None`. Their pages explain this limitation and command-specific statuses for `packages`, `test`, `db:wipe` and workers. Consider command output, exit status and the expected result together.

For calling commands from code and injecting services, see [Reactor and programmatic execution](/en/console/reactor-and-injection).
