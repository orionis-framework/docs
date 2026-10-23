---
title: "Database commands"
description: "All inspection, migration and seeding signatures with their actual options and differences."
editUrl: true
lastUpdated: false
---

These eleven commands operate on Database. They all accept optional string `--database` / `-d`; omission uses the application's default SQL connection. This selects a connection from `config/database.py`, rather than a filename or queue driver.

Migration/seeding commands display progress and let service errors reach Reactor's exception flow. There is no general migration `--force`. Rollback and wiping can remove data: select the connection explicitly when distinguishing development, testing or another database.

<a id="command-db-seed"></a>

## db:seed

Run pending seeders.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |

Use the same implementation as `seed` under another signature. Run pending seeders for the selected connection and display per-seeder progress. It takes no positional class name or `--class` flag and does not rerun seeders already recorded.

```shell
orionis db:seed --database sqlite
python -B reactor db:seed --database sqlite
```

<a id="command-db-show"></a>

## db:show

Inspect a database and summarize its tables.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |
| `--counts` | Flag, optional | `False` | Count rows in each table. |
| `--views` | Flag, optional | `False` | Include ordinary/materialized view listings. |

Display connection, driver, database name, size, open connections and object counts. `--counts` computes per-table row counts and may be expensive; `--views` adds ordinary/materialized view listings. Both flags are optional and disabled by default. Engine information unavailable to the inspector is shown as `N/A`.

```shell
orionis db:show --database sqlite --counts --views
python -B reactor db:show --database sqlite --counts --views
```

<a id="command-db-table"></a>

## db:table

Show a table's structure.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `table` | str, required | — | Name of the table to inspect. |
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |

`table` is a required positional string. Show rows, size, columns, types, nullability, defaults, primary key, indexes and foreign keys. This inspection counts rows without requiring another flag. An invalid name or missing table reported as `ValueError` is displayed with status `1`; successful inspection returns `0`.

```shell
orionis db:table products --database sqlite
python -B reactor db:table products --database sqlite
```

<a id="command-db-wipe"></a>

## db:wipe

Drop database user objects.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |
| `--force` | Flag, optional | `False` | Bypass confirmation (db:wipe) or replace APP_KEY (key:generate). |

`--database` / `-d` selects a connection (the configured default when omitted). `--force` is a flag, default `False`. Without it, ask for confirmation with a negative default; without a TTY return `1` and require `--force`. Declining returns `0` without deleting anything. Confirmed execution drops user tables, views and types using engine-specific flows, including materialized views/domains where applicable. SQLite, MySQL, PostgreSQL, Redshift, SQL Server and Oracle flows are implemented; other drivers are rejected.

This removes user objects, including those outside migration history. DDL rollback behavior varies between engines. There are no `--drop-views`, `--drop-types` or `--dry-run` flags. Successful execution returns `0`; SQL errors or object dependency failures may propagate.

```shell
orionis db:wipe --database sqlite
python -B reactor db:wipe --database sqlite
```

<a id="command-migrate"></a>

## migrate

Apply pending migrations and optionally seeders.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |
| `--seed` | Flag, optional | `False` | Run pending seeders after successful migration. |

`--seed` is an optional flag (`False`). First run `Migrator.migrate()` and, only after successful completion, call `SeederRunner.seed()` when requested. Recorded migrations are not reapplied. Each operation reports progress/errors through its callbacks; a failure prevents normal continuation.

```shell
orionis migrate --database sqlite --seed
python -B reactor migrate --database sqlite --seed
```

<a id="command-migrate-fresh"></a>

## migrate:fresh

Rebuild history and reapply migrations.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |

Reset recorded migrations, drop migration/seeder history tables and run migrations again. This is not `db:wipe`: it does not indiscriminately enumerate and drop all user tables. Data removed by `down()` operations may be lost and recorded migration files must be present. It has no `--seed`, `--force` or interactive confirmation.

```shell
orionis migrate:fresh --database sqlite
python -B reactor migrate:fresh --database sqlite
```

<a id="command-migrate-refresh"></a>

## migrate:refresh

Roll back batches and rerun pending migrations.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |
| `--step` / `-s` | int, optional | All batches | Positive number of complete batches. |

`--step` / `-s` is an optional integer; omission rolls back all batches, while a supplied value must be positive. Then call `migrate()`. The unit is batches rather than files. Rollback operations may remove data; there is no confirmation or `--seed` option.

```shell
orionis migrate:refresh --database sqlite --step 1
python -B reactor migrate:refresh --database sqlite --step 1
```

<a id="command-migrate-reset"></a>

## migrate:reset

Roll back every applied migration.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |

Invoke `down()` in reverse order for all recorded migrations. It does not subsequently migrate and takes no `--step`. A missing recorded migration file raises `MigrationNotFoundException`. There is no confirmation prompt.

```shell
orionis migrate:reset --database sqlite
python -B reactor migrate:reset --database sqlite
```

<a id="command-migrate-rollback"></a>

## migrate:rollback

Roll back the latest batch or several batches.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |
| `--step` / `-s` | int, optional | `1` | Positive number of complete batches. |

`--step` / `-s` is an optional integer with effective default `1` and must be positive. Count complete migration batches rather than individual files. It neither reapplies migrations nor requests confirmation. Reverting the final applied migration also clears seeder history.

```shell
orionis migrate:rollback --database sqlite --step 2
python -B reactor migrate:rollback --database sqlite --step 2
```

<a id="command-migrate-status"></a>

## migrate:status

Show applied and pending migrations.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |

Discover migration files, read history and show name, status (`Ran` / `Pending`) and batch. The history table may be created when absent: inspecting status does not execute `up()`, but requires a connection and permissions to initialize history.

```shell
orionis migrate:status --database sqlite
python -B reactor migrate:status --database sqlite
```

<a id="command-seed"></a>

## seed

Run pending seeders.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--database` / `-d` | str, optional | Default connection | Named SQL connection; omission selects the default. |

Delegate to `SeederRunner.seed(connection=...)` with progress callbacks. If none remain, report that the database is up to date. It has no `--force` or `--class` option; `db:seed` is the other signature for this operation.

```shell
orionis seed --database sqlite
python -B reactor seed --database sqlite
```

Migration, schema, seeder and factory generators are covered in [Code generators](/en/console/built-in-generators). See the [Database command reference](/en/database/commands) and [Migrations and seeders](/en/database/migrations) for file/table/data design.
