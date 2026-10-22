---
title: "Database commands"
description: "Reference for all 14 commands: inspection, generators, migrations, seeders and wiping, with options and examples."
editUrl: true
lastUpdated: false
---

This reference brings together Database inspection, generation, migration, seeding and cleanup commands. Run them from the project root with the Python environment and connection configured.

Each example pair shows **two alternatives**: `orionis` and `python -B reactor`. Run one of them. When managing the environment with uv, you can prefix the Python command with `uv run`.

## Shared options and connection selection

| Option | Available on | Default and effect |
| --- | --- | --- |
| `-h`, `--help` | All 14 commands | Displays help without performing the operation or generating files. |
| `--database NAME`, `-d NAME` | This page's `db:*` and `migrate*` commands | `None`: uses the default connection. `NAME` is a registered connection name, not a URL, file or table name. |

The `make:*` generators do not accept `--database`: they create files using [application paths](/en/getting-started/architecture-and-lifecycle). Configure the connection under [Database configuration](/en/database/configuration); examples using `--database sqlite` assume that connection is registered. An unknown connection, missing driver dependency or invalid credentials produces a resolution or execution error rather than automatically creating a different connection.

To inspect specific help:

```bash
orionis db:show --help
python -B reactor db:show --help
```

## Choose a command

| Command | Purpose |
| --- | --- |
| [`db:show`](#db-show) | Shows a connection summary and its visible tables. Use it to confirm the target and understand its contents before migrating or inspecting a table. |
| [`db:table`](#db-table) | Inspects an existing physical table: connection, resolved name, row count, size, columns, indexes and foreign keys. |
| [`db:wipe`](#db-wipe) | Removes discovered user objects from the selected connection. Use it to empty a development or test database when tables outside migration history must also be removed. |
| [`db:seed`](#db-seed) | Runs pending seeders in discovery order. Use it after creating the tables required by their inserts. |
| [`make:database-migration`](#make-database-migration) | Generates a migration file with empty async up() and down() methods. It neither runs the migration nor creates a table. |
| [`make:database-schema`](#make-database-schema) | Generates a reusable table schema definition. It is a Python file usable by migrations; generation does not execute DDL. |
| [`make:database-seeder`](#make-database-seeder) | Generates a seeder with an empty async run() for initial data. It neither executes the seeder nor creates its table. |
| [`make:factory`](#make-factory) | Generates a factory for an existing model. Its file defines sample attributes; the command does not generate records. |
| [`migrate`](#migrate) | Applies all pending migrations on the selected connection. This is the normal command after implementing a new migration. |
| [`migrate:status`](#migrate-status) | Shows each discovered migration, whether it ran, and its batch. Use it to check state before or after migrating. |
| [`migrate:rollback`](#migrate-rollback) | Reverts the latest applied migration batches through their down() methods. It does not reapply them. |
| [`migrate:reset`](#migrate-reset) | Reverts all migrations recorded as applied on the connection, calling down() in reverse order. |
| [`migrate:refresh`](#migrate-refresh) | Reverts selected migrations, then applies all pending migrations. Use it to rebuild changes through the down()/up() cycle. |
| [`migrate:fresh`](#migrate-fresh) | Reverts all applied migrations, removes migration and seeder history tables, and applies discovered migrations again. |

<a id="db-show"></a>

## `db:show`

```text
db:show [--database NAME] [--counts] [--views]
```

Shows a connection summary and its visible tables. Use it to confirm the target and understand its contents before migrating or inspecting a table.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--counts` | `bool` | False | Adds a COUNT(*) for each table; this may be expensive on large databases. |
| `--views` | `bool` | False | Adds a list of available regular and materialized views. |

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis db:show
python -B reactor db:show
```

```bash
orionis db:show --database sqlite --counts --views
python -B reactor db:show --database sqlite --counts --views
```

The first table displays Connection, Driver, Database, Size, Open connections, Tables, Views and Materialized views. Table names and sizes follow; `--counts` adds Rows. Without `--views`, view **totals** still appear in the summary, but their names are not listed.

Sizes use B/KiB/MiB/GiB/TiB. `N/A` means a metric is unavailable, rather than zero. There is no JSON output or table-filter flag. An empty catalog is reported without creating application tables.

<a id="db-table"></a>

## `db:table`

```text
db:table table [--database NAME]
```

Inspects an existing physical table: connection, resolved name, row count, size, columns, indexes and foreign keys.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `table` | `str` | Required | Table name shown by db:show; this is not a model class name. |

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis db:table products --database sqlite
python -B reactor db:table products --database sqlite
```

Columns show name, type, nullable, default and primary-key membership. Indexes include name, columns, uniqueness and a primary-key marker; foreign keys include column, reference and ON DELETE. Missing indexes or foreign keys produce explicit messages.

`db:table` **always counts rows**: it has neither `--counts` nor a flag to skip that count. This can be expensive on a large table. DB_PREFIX is not automatically added to the supplied name.

On PostgreSQL, Redshift and SQL Server use `schema.table` when an unqualified name is ambiguous: for example `public.products` or `dbo.products`, if they exist. Oracle resolves names from its user catalog. Object names containing additional periods cannot be represented unambiguously on the three schema-qualified engines.

A missing table or ambiguous/invalid name produces an error message and exit `1`; successful inspection returns `0`. Connection or permission failures propagate from Database. This command does not inspect views. Redshift lists no indexes, and displayed PK/FK declarations are informational rather than a guarantee of engine enforcement.

<a id="db-wipe"></a>

## `db:wipe`

```text
db:wipe [--database NAME] [--force]
```

Removes discovered user objects from the selected connection. Use it to empty a development or test database when tables outside migration history must also be removed.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--force` | `bool` | False | Skips interactive confirmation. Required when stdin is not a terminal. |

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis db:wipe --database sqlite
python -B reactor db:wipe --database sqlite
```

:::caution[Object and data removal]
Verify the connection before running this command. It removes tables and their data, regular/materialized views and types/domains where exposed by the engine. This includes `migrations` and `seeders` if present; it does not call `down()`, rerun migrations or seed data. It does not remove application Python files or the SQLite file.
:::

Without `--force`, confirmation defaults to **no**. Declining returns `0` and reports cancellation. Without a terminal, it returns `1` without deleting anything and explains that `--force` is required. Success returns `0` and displays removed table, view and type counts.

For automation deliberately intended to empty **that connection**, the non-interactive form is:

```bash
python -B reactor db:wipe --database sqlite --force
```

`--force` does not validate the environment or guarantee rollback; it only skips the prompt. The command has no additional `APP_ENV` protection. Catalog visibility and database-user permissions determine which objects it can discover and remove. Removal is not limited to the framework table prefix.

### Engine-specific removal

| Engine | Behavior verified in the implementation |
| --- | --- |
| SQLite | Views and tables within a transaction; defers foreign keys until commit to allow cyclic references. Does not enumerate internal sqlite_ objects as targets and retains the database file. |
| MySQL / MariaDB | Views and tables; reserves the same physical connection, temporarily disables FOREIGN_KEY_CHECKS and restores its prior value in finally. DDL commits implicitly, so the entire wipe cannot be guaranteed to roll back. |
| PostgreSQL | Materialized views, views, tables, domains and user types; uses a transaction and CASCADE where applicable. Dependent objects may also be affected. |
| Redshift | Materialized views, views and tables through its specific catalog; uses a transaction and CASCADE where applicable. Its catalog is not treated as PostgreSQL's. |
| SQL Server | Orders view/type dependencies, disables SYSTEM_VERSIONING on temporal tables and removes foreign keys before tables; uses a transaction. Unresolvable dependencies may stop the operation. |
| Oracle | User materialized views, views, tables and types; checks type dependencies before removal and refreshes the table list after dropping materialized views. DDL commits implicitly, so failure may leave a partial wipe. |

On Oracle, external dependencies or type cycles may prevent wiping. `--force` does not bypass these restrictions: `DROP TYPE FORCE` is not used.

This command does not drop the database or server user, nor guarantee removing every object category offered by each engine. Summary counts describe discovered categories; CASCADE may affect additional dependencies.

<a id="db-seed"></a>

## `db:seed`

```text
db:seed [--database NAME]
```

Runs pending seeders in discovery order. Use it after creating the tables required by their inserts.

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis db:seed --database sqlite
python -B reactor db:seed --database sqlite
```

This is an alias of `seed`, with the same options and behavior. Completed seeders are recorded in `seeders`; invoking it again does not repeat recorded files. It displays per-file progress or a message indicating nothing is pending.

Each seeder uses its own transaction. Failure rolls back its changes and history record; earlier seeders may already be committed. Redshift rejects the runner because it cannot guarantee its UNIQUE claim. The command accepts neither a class name nor `--class`, `--force` or `--count`. See [Seeders](/en/database/seeders) for ordering, history and complete examples.

<a id="make-database-migration"></a>

## `make:database-migration`

```text
make:database-migration name
```

Generates a migration file with empty async up() and down() methods. It neither runs the migration nor creates a table.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `name` | `str` | Required | Descriptive name, optionally including subdirectories. |

Also accepts `--help`/`-h`.

```bash
orionis make:database-migration create_products
python -B reactor make:database-migration create_products
```

With default paths it creates `database/migrations/m<YYYYmmddHHMMSS>_create_products.py`, containing class `CreateProducts`. The timestamp uses the application timezone; do not type `<YYYYmmddHHMMSS>` literally in the command.

It also accepts `catalog/create_products`. Implement `up()` and `down()` before running `migrate`; the generator does not infer operations from the name. It has no `--create`, `--table`, `--database` or `--force` flags. See [Migrations](/en/database/migrations-and-seeders) for the full workflow.

<a id="make-database-schema"></a>

## `make:database-schema`

```text
make:database-schema name
```

Generates a reusable table schema definition. It is a Python file usable by migrations; generation does not execute DDL.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `name` | `str` | Required | File and class name; appends Schema when absent. |

Also accepts `--help`/`-h`.

```bash
orionis make:database-schema products
python -B reactor make:database-schema products
```

With default paths it generates `database/schemas/products_schema.py` and `ProductsSchema`, using the actual schema template. Subdirectories such as `catalog/products` are also supported.

Complete `ProductsSchema.table_definition` and apply it from a migration with `await Schema.createFromDefinition(ProductsSchema.table_definition)`. It neither generates an ORM model nor automatically applies the schema. Only `name` and help are supported. See [Creating schemas and tables](/en/database/schema).

<a id="make-database-seeder"></a>

## `make:database-seeder`

```text
make:database-seeder name
```

Generates a seeder with an empty async run() for initial data. It neither executes the seeder nor creates its table.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `name` | `str` | Required | File and class name; appends Seeder when absent. |

Also accepts `--help`/`-h`.

```bash
orionis make:database-seeder initial_products
python -B reactor make:database-seeder initial_products
```

With default paths it creates `database/seeders/initial_products_seeder.py` and `InitialProductsSeeder`. Nested names such as `catalog/initial_products` are accepted.

Implement `run()` and execute `db:seed` once the tables exist. Only `name` and help are supported; there are no model, overwrite or count flags. See [Seeders](/en/database/seeders).

<a id="make-factory"></a>

## `make:factory`

```text
make:factory name [--model MODEL]
```

Generates a factory for an existing model. Its file defines sample attributes; the command does not generate records.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `name` | `str` | Required | Factory name, optionally nested; appends Factory when absent. |
| `--model, -m` | `str` | None | Model relative to app/models. When omitted, derived by removing Factory and retaining subdirectories. |

Also accepts `--help`/`-h`.

```bash
orionis make:factory ProductFactory --model Product
python -B reactor make:factory ProductFactory --model Product
```

```bash
orionis make:factory catalog/ProductFactory --model catalog/Product
python -B reactor make:factory catalog/ProductFactory --model catalog/Product
```

The first example creates `database/factories/product_factory.py`, class `ProductFactory`, and an import of `app.models.product.Product`. The second uses the corresponding `catalog` directories. Targets are resolved through configured `database_factories` and `app_models` paths.

The generator does not check whether the model module exists: a syntactically valid name may create an import that fails later if the file is missing. The stub includes `model = Product` and synchronous `definition()` returning `{}`. Implement the attributes: the command does not generate the model or create its table, and accepts neither `--count` nor `--force`. Build or persist data later through `make()`/`create()` in code; see [Factories](/en/database/orm/factories-and-testing).

<a id="migrate"></a>

## `migrate`

```text
migrate [--database NAME] [--seed]
```

Applies all pending migrations on the selected connection. This is the normal command after implementing a new migration.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--seed` | `bool` | False | Runs pending seeders after migrations complete successfully. |

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis migrate --database sqlite
python -B reactor migrate --database sqlite
```

```bash
orionis migrate --database sqlite --seed
python -B reactor migrate --database sqlite --seed
```

Pending migrations in one invocation share a batch; each file uses its own transaction. The CLI displays RUNNING/DONE/FAIL lines with timings, or indicates there is nothing pending.

`--seed` also runs seeders when migrations were already up to date. Seeder failure does not undo previously committed migrations. There are no `--step`, `--force` or `--pretend` flags. See [Migrations](/en/database/migrations-and-seeders) for history, discovery and transactions.

<a id="migrate-status"></a>

## `migrate:status`

```text
migrate:status [--database NAME]
```

Shows each discovered migration, whether it ran, and its batch. Use it to check state before or after migrating.

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis migrate:status --database sqlite
python -B reactor migrate:status --database sqlite
```

The table contains Migration, Status (`Ran` or `Pending`) and Batch (`-` for pending files). If no files are discovered, it reports that explicitly.

It does not execute `up()` or `down()`, but may create the `migrations` history table if absent. It is therefore not strictly write-free and does not inspect tables outside migration history. Use `db:show` for that purpose.

<a id="migrate-rollback"></a>

## `migrate:rollback`

```text
migrate:rollback [--database NAME] [--step N]
```

Reverts the latest applied migration batches through their down() methods. It does not reapply them.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--step, -s` | `int` | 1 effective | Positive batch count. When omitted, the command uses 1. |

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis migrate:rollback --database sqlite
python -B reactor migrate:rollback --database sqlite
```

```bash
orionis migrate:rollback --database sqlite --step 2
python -B reactor migrate:rollback --database sqlite --step 2
```

`--step` counts **batches, not files**. If N exceeds the available count, all available batches are selected. Migrations revert in reverse application order, with one transaction per file. Nonpositive counts are rejected; a failure stops execution, and previously committed reversions are not undone as one unit.

When reversal removes the last applied migration, the runner also drops that connection's seeder history table. Partial rollback preserves it. There is no seeder `down()` automatically undoing seeded data. Actual data removal depends on each migration's `down()`.

<a id="migrate-reset"></a>

## `migrate:reset`

```text
migrate:reset [--database NAME]
```

Reverts all migrations recorded as applied on the connection, calling down() in reverse order.

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis migrate:reset --database sqlite
python -B reactor migrate:reset --database sqlite
```

It does not apply migrations after reverting. It does not remove unrelated tables by catalog discovery; each `down()` may perform its own operations, so its implementation determines removed objects. When reverting the last applied migration, it drops the seeder history table. The migrations table remains empty. If there were no applied migrations, it does not perform that additional cleanup.

Only connection selection and help are supported. It accepts neither `--step` nor `--seed`, and does not ask for specific confirmation before running `down()`. Use `migrate:rollback` for partial reversal.

<a id="migrate-refresh"></a>

## `migrate:refresh`

```text
migrate:refresh [--database NAME] [--step N]
```

Reverts selected migrations, then applies all pending migrations. Use it to rebuild changes through the down()/up() cycle.

| Argument or specific option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--step, -s` | `int` | None | When omitted, reverts all applied migrations. When supplied, reverts the latest N batches; N must be positive. |

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis migrate:refresh --database sqlite
python -B reactor migrate:refresh --database sqlite
```

```bash
orionis migrate:refresh --database sqlite --step 1
python -B reactor migrate:refresh --database sqlite --step 1
```

The apply phase is not limited to just-reverted files: it executes every migration pending at that point. There is no global transaction spanning both phases. `--seed` is unsupported; use `db:seed` afterwards.

It may delete data because it runs `down()`. It has neither its own confirmation nor `--force`. It does not rebuild history infrastructure as `migrate:fresh` does: the migrations table remains and reverted records are removed. Reverting the last applied migration also drops the seeders table.

<a id="migrate-fresh"></a>

## `migrate:fresh`

```text
migrate:fresh [--database NAME]
```

Reverts all applied migrations, removes migration and seeder history tables, and applies discovered migrations again.

Also accepts `--database`/`-d` and `--help`/`-h`.

```bash
orionis migrate:fresh --database sqlite
python -B reactor migrate:fresh --database sqlite
```

The new migration history starts at batch 1. **It is not equivalent to `db:wipe`**: it uses migration `down()` methods rather than dropping every catalog table. An unrelated table remains unless those methods remove it.

It accepts neither `--seed`, `--step` nor `--force`, asks for no dedicated confirmation and does not run seeders. Execute `db:seed` explicitly afterwards when required. A failing `down()` or new migration interrupts execution; there is no global rollback spanning all phases.

## Generator conventions

All four `make:*` commands require `name`, create necessary directories and do not overwrite an existing file. They accept nested relative names using `/` or `\` and validate Python module names; absolute paths and traversal components such as `..` are rejected. Module names are normalized and Schema/Seeder/Factory suffixes are appended only when absent. Use snake_case for migrations and consistent file/class names.

Displayed paths are defaults: `database_migrations`, `database_schemas`, `database_seeders` and `database_factories` may point elsewhere in the application. File generation does not record execution in `migrations` or `seeders`; the corresponding runner does that.

## Interpret output and errors

| Result | Observed CLI exit code |
| --- | --- |
| Help or successful operation | `0` |
| Declining db:wipe confirmation | `0`, without deleting |
| Missing table, wipe without a terminal when --force is omitted, or runner exception | `1` |
| Missing required argument, unknown flag or unparseable value | `2` |
| Generator error caught by MakeStubCommand | May return `0` despite displaying an error |

Generators catch and print `OSError`, `TypeError` and `ValueError`; their return does not distinguish these failures from success. In automation, verify the creation message and expected file, rather than relying only on exit `0`. Existing files are not overwritten. Defaults in the tables above describe effective behavior: an internal missing-value marker displayed by help is not a value to pass.

Migrations use per-file transactions, but DDL rollback depends on the [engine](/en/database/dialects-and-production); MySQL and Oracle have implicit commits. The CLI does not turn an entire refresh/fresh operation into a global transaction.

## Choose reversal, rebuilding or wiping

| Command | Runs down() | Applies pending migrations afterwards | Removes complete history | Discovers and removes unrelated tables |
| --- | --- | --- | --- | --- |
| `migrate:rollback` | Latest N batches | No | Removes reverted records; clears seeders when empty | No; depends on down() contents |
| `migrate:reset` | All applied migrations | No | Retains empty migrations; drops seeders when reverting the last applied migration | No; depends on down() contents |
| `migrate:refresh` | All or latest N batches | Yes | Retains migrations; drops seeders if reversal removes every applied migration | No; depends on down() contents |
| `migrate:fresh` | All applied migrations | Yes | Removes migrations and seeders tables; new batch 1 | No; depends on down() contents |
| `db:wipe` | No | No | Removes those tables if discovered in the catalog | Yes, within the visible catalog |

The four `migrate:*` commands running `down()` do not request the interactive confirmation used by `db:wipe`. Their data effects depend on migrations. These commands have no `--force` flag: do not add it based on another CLI's conventions.

Read more under [Migrations](/en/database/migrations-and-seeders), [Seeders](/en/database/seeders), [Factories](/en/database/orm/factories-and-testing), [transactions](/en/database/transactions) and [isolated database testing](/en/database/orm/testing).
