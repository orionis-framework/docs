---
title: "Code generators"
description: "Reference for all 24 built-in make: commands: files, arguments, options and generation behavior."
editUrl: true
lastUpdated: false
---

Generators create files from Orionis's packaged stubs. Run them from the application root; configured application paths take precedence over the framework defaults shown in this guide.

Every generator takes a required positional string `name` and supports `-h` / `--help`. Only the commands listed with additional flags provide them. **None supports overwriting or `--force`**: exclusive creation reports an error if the destination exists.

The common stub accepts `/` and `\` separators, creates subdirectories and lowercases directory/filename components. Underscore-separated words form the class name, with each generator's prefix/suffix applied when needed. For example, `sales/report_export` with `make:console-command` creates `app/console/commands/sales/report_export_command.py` containing `ReportExportCommand`. **CamelCase is not split into snake_case**: `ReportExport` produces `reportexport_command.py`. Factory generation uses its own normalization, described below.

Absolute names, empty components, `.` / `..`, hyphens and components outside the accepted module-name pattern are rejected. Filesystem/name errors are printed. The common generator and `make:console-command` catch these errors and return `None` from `handle()`, so the exit code may be `0` even when generation failed. Check the message and generated file before continuing.

<a id="command-make-console-command"></a>

## make:console-command

Create a command with a unique signature and description.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |
| `--signature` / `-s` | str, required | — | Unique registered command signature. |
| `--description` / `-d` | str, optional | `A custom console command.` | Short help description. |

`--signature` / `-s` is required and must match the CLI signature format; Reactor is also checked for an existing signature. `--description` / `-d` is optional and defaults to `A custom console command.` in the generated source. The file uses `console_command.stub`; `handle()` is its entry point.

**Default destination:** `app/console/commands`. Class/file suffix: `Command`.

```shell
orionis make:console-command reports/export --signature reports:export --description "Export reports"
python -B reactor make:console-command reports/export --signature reports:export --description "Export reports"
```

<a id="command-make-console-listener"></a>

## make:console-listener

Create a console task listener.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Generate the command-execution event listener structure. Creation does not automatically attach it to a task.

**Default destination:** `app/console/listeners`. Class/file suffix: `Listener`.

```shell
orionis make:console-listener report_events
python -B reactor make:console-listener report_events
```

<a id="command-make-contract"></a>

## make:contract

Generate a service contract.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Apply the `I` class prefix when it is not already present; the prefix is not added to the filename. `report_store` produces `report_store.py` containing `IReportStore`.

**Default destination:** `app/contracts`. Class/file suffix: none.

```shell
orionis make:contract report_store
python -B reactor make:contract report_store
```

<a id="command-make-database-migration"></a>

## make:database-migration

Create a timestamped migration.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Prefix the filename with `mYYYYMMDDHHMMSS_` using `DateTime.now()` and derive the class from the original stem. Subdirectories are accepted. This does not execute the migration or provide table flags; operations belong in `up()` / `down()`. Generating the same name within one second may encounter an existing file.

**Default destination:** `database/migrations`. Class/file suffix: none.

```shell
orionis make:database-migration create_products
python -B reactor make:database-migration create_products
```

<a id="command-make-database-schema"></a>

## make:database-schema

Generate a reusable table definition.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | Module name; supports nested directories. |

Uses `database_schema.stub` and appends the `Schema` suffix to the filename. Since 1.0.10 it generates a module with `TABLE: Final[TableDefinition | None] = None`, without a holder class. Replace `None` with the complete definition and import `TABLE` in a migration or schema API call; file generation does not create a table. See [the stub and its usage](/en/database/schema#schema-generator).

**Default destination:** `database/schemas`. Filename suffix: `Schema`; exported constant: `TABLE`.

```shell
orionis make:database-schema products
python -B reactor make:database-schema products
```

<a id="command-make-database-seeder"></a>

## make:database-seeder

Generate a database seeder.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `database_seeder.stub` and the `Seeder` suffix; it does not execute it. `seed` / `db:seed` run pending seeders.

**Default destination:** `database/seeders`. Class/file suffix: `Seeder`.

```shell
orionis make:database-seeder catalog
python -B reactor make:database-seeder catalog
```

<a id="command-make-facade"></a>

## make:facade

Generate a facade and its typing interface.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |
| `--accessor` / `-a` | str, required | — | Container service identifier. |

`--accessor` / `-a` is a required string identifying the container service. Two files sharing a stem are written: `.py` and `.pyi`. The generator does not register the service. Writes are sequential: if the second file fails, the first may already exist.

**Default destination:** `app/facades`. Class/file suffix: none.

```shell
orionis make:facade reporting --accessor app.reporting
python -B reactor make:facade reporting --accessor app.reporting
```

<a id="command-make-factory"></a>

## make:factory

Generate a model factory.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |
| `--model` / `-m` | str, optional | Inferred from name | Factory model, relative to the models directory. |

`--model` / `-m` is optional. When omitted, infer the model by removing `Factory` from the class name and preserving subdirectories. Unlike the common stub, CamelCase/acronyms are separated into snake_case modules. `sales/OrderFactory` generates `sales/order_factory.py`. Python identifiers and keywords are validated; the model path must form an importable package within the project. The imported model is not generated.

**Default destination:** `database/factories`. Class/file suffix: `Factory`.

```shell
orionis make:factory sales/OrderFactory --model sales/Order
python -B reactor make:factory sales/OrderFactory --model sales/Order
```

<a id="command-make-http-controller"></a>

## make:http-controller

Create a resource or invokable controller.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |
| `--invoke` | Flag, optional | `False` | Generate one __call__ action. |
| `--api` | Flag, optional | `False` | Use the JSONResponse import and annotations. |

Generate `index`, `create`, `store`, `show`, `edit`, `update` and `destroy` by default. Enabling `--invoke` (default `False`) replaces these with one `__call__` action. `--api` (default `False`) changes the import and return annotations from `HttpResponse` to `JSONResponse`; both flags can be combined. Generated actions contain documentation and still need implementation: an annotation neither constructs a response nor converts values by itself.

**Default destination:** `app/http/controllers`. Class/file suffix: `Controller`.

```shell
orionis make:http-controller user --invoke --api
python -B reactor make:http-controller user --invoke --api
```

<a id="command-make-http-middleware"></a>

## make:http-middleware

Generate HTTP middleware.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `http_middleware.stub`, with `BaseMiddleware` and `handle(request, call_next)`. The generated file is not automatically assigned to routes or global middleware.

**Default destination:** `app/http/middleware`. Class/file suffix: `Middleware`.

```shell
orionis make:http-middleware measure_latency
python -B reactor make:http-middleware measure_latency
```

<a id="command-make-http-schema"></a>

## make:http-schema

Create an HTTP validation schema.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `http_schema.stub`. Define its fields and rules before injecting it into an action.

**Default destination:** `app/http/schemas`. Class/file suffix: `Schema`.

```shell
orionis make:http-schema create_order
python -B reactor make:http-schema create_order
```

<a id="command-make-http-schema-rule"></a>

## make:http-schema-rule

Generate a custom validation rule.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `http_schema_rule.stub` and the `Rule` suffix. Implement `enforce(field, value, instance)`; the stub uses a synchronous method and only produces the rule scaffold.

**Default destination:** `app/http/schemas/rules`. Class/file suffix: `Rule`.

```shell
orionis make:http-schema-rule valid_reference
python -B reactor make:http-schema-rule valid_reference
```

<a id="command-make-job"></a>

## make:job

Create an asynchronous queue job.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `job.stub` and the `Job` suffix. It neither dispatches the job nor starts a worker; implement its serializable state and `handle()` before dispatching.

**Default destination:** `app/jobs`. Class/file suffix: `Job`.

```shell
orionis make:job generate_report
python -B reactor make:job generate_report
```

<a id="command-make-mail"></a>

## make:mail

Create a reusable mail class.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `mail.stub` under the notifications directory. File generation does not send mail.

**Default destination:** `app/notifications`. Class/file suffix: `Mail`.

```shell
orionis make:mail welcome
python -B reactor make:mail welcome
```

<a id="command-make-mcp-prompt"></a>

## make:mcp-prompt

Generate an MCP prompt.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `mcp_prompt.stub` and the `Prompt` suffix. Define its arguments/messages and register it with a server.

**Default destination:** `app/mcp/prompts`. Class/file suffix: `Prompt`.

```shell
orionis make:mcp-prompt summarize_catalog
python -B reactor make:mcp-prompt summarize_catalog
```

<a id="command-make-mcp-resource"></a>

## make:mcp-resource

Generate an MCP resource.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `mcp_resource.stub` and the `Resource` suffix. The file is not exposed until registered with a server.

**Default destination:** `app/mcp/resources`. Class/file suffix: `Resource`.

```shell
orionis make:mcp-resource catalog
python -B reactor make:mcp-resource catalog
```

<a id="command-make-mcp-server"></a>

## make:mcp-server

Generate an MCP server.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `mcp_server.stub` and the `Server` suffix. The server must subsequently be registered with its components and transport.

**Default destination:** `app/mcp/servers`. Class/file suffix: `Server`.

```shell
orionis make:mcp-server catalog
python -B reactor make:mcp-server catalog
```

<a id="command-make-mcp-tool"></a>

## make:mcp-tool

Generate an MCP tool.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `mcp_tool.stub` and the `Tool` suffix. Implement the tool and add it to the corresponding server.

**Default destination:** `app/mcp/tools`. Class/file suffix: `Tool`.

```shell
orionis make:mcp-tool search_catalog
python -B reactor make:mcp-tool search_catalog
```

<a id="command-make-model"></a>

## make:model

Create an ORM model.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `model.stub`, without appending a class suffix. It does not automatically create migrations, tables or factories.

**Default destination:** `app/models`. Class/file suffix: none.

```shell
orionis make:model product
python -B reactor make:model product
```

<a id="command-make-provider"></a>

## make:provider

Create an eager or deferred provider.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |
| `--deferred` | Flag, optional | `False` | Select the deferred-provider stub. |

`--deferred` is an optional flag, defaulting to `False`. It selects `provider_deferred.stub` instead of `provider_eager.stub`. Writing the file does not by itself add it to the application's provider list.

**Default destination:** `app/providers`. Class/file suffix: `Provider`.

```shell
orionis make:provider reporting --deferred
python -B reactor make:provider reporting --deferred
```

<a id="command-make-realtime-hub"></a>

## make:realtime-hub

Create a remote-method hub.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `realtime_hub.stub` and the `Hub` suffix. It neither opens connections nor automatically registers the hub at an endpoint.

**Default destination:** `app/realtime/hubs`. Class/file suffix: `Hub`.

```shell
orionis make:realtime-hub chat
python -B reactor make:realtime-hub chat
```

<a id="command-make-realtime-socket"></a>

## make:realtime-socket

Create a Realtime WebSocket handler.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `realtime_socket.stub` and the `Socket` suffix. The handler still needs registration in the application's WebSocket routes.

**Default destination:** `app/realtime/sockets`. Class/file suffix: `Socket`.

```shell
orionis make:realtime-socket chat
python -B reactor make:realtime-socket chat
```

<a id="command-make-service"></a>

## make:service

Generate a service class.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Use `service.stub`. Container bindings and contract registration depend on application configuration; this command only creates the file.

**Default destination:** `app/services`. Class/file suffix: none.

```shell
orionis make:service report_service
python -B reactor make:service report_service
```

<a id="command-make-test"></a>

## make:test

Create an application test case.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `name` | str, required | — | File/class name; generators support nested directories. |

Add `test_` to the filename when absent and allow subdirectories: `services/report` creates `tests/services/test_report.py`. It does not run the generated test.

**Default destination:** `tests`. Class/file suffix: none.

```shell
orionis make:test services/report
python -B reactor make:test services/report
```

Generation produces scaffolding; it does not register providers, create tables, publish endpoints or run jobs. See [Controllers](/en/http/controllers), [Middleware](/en/http/middleware), [Schemas](/en/validation), [ORM](/en/orm), [Mail](/en/mail), [Queues](/en/queues), [Realtime](/en/realtime) and [MCP](/en/mcp) for component implementation.
