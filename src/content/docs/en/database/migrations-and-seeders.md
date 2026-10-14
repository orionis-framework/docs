---
title: "Evolve and populate the database"
description: "Migrations describe ordered schema changes. Seeders insert initial data through separate classes. They are discovered through the application's database_migrations and…"
editUrl: true
lastUpdated: false
---

Migrations describe ordered schema changes. Seeders insert initial data through separate classes. They are discovered through the application's `database_migrations` and `database_seeders` paths, normally `database/migrations` and `database/seeders`.

## Write a reversible migration

Save the following class in `database/migrations/0001_create_flags.py` (choose a new prefix if `0001` is already used). Each file should contain one unambiguous local `Migration` subclass; zero-padded sequential prefixes preserve lexical ordering. [Console generators](/en/console/built-in-commands) create files following application conventions.

```python
from orionis.database import Migration
from orionis.support.facades import Schema


class CreateFlags(Migration):
    async def up(self) -> None:
        async with Schema.create("flags") as table:
            table.id()
            table.string("name", 80)
            table.unique("name")

    async def down(self) -> None:
        await Schema.drop("flags")
```

The migrator sets a contextual connection during each operation; `Schema` and `DB` honor it unless explicitly directed elsewhere. Each migration and its tracking record run in their own transaction. The `migrations` table stores names, batches, and timestamps. Effective DDL atomicity depends on the backend; failure is not a universal guarantee that schema changes were undone.

## Apply, inspect, and reverse

From the application root, inspect pending changes and then apply them. `uv run` uses the project environment, and Reactor boots the application for the command:

```shell
uv run python -B reactor migrate:status
uv run python -B reactor migrate
```

After successful migration, `flags` exists and its migration appears as applied in `migrate:status`. To deliberately reverse the latest batch in a development database, use the separate command below. Its `down()` removes the `flags` table and its data:

```shell
uv run python -B reactor migrate:rollback --step 1
```

`--step` counts **batches**, rather than files. One `migrate` invocation groups pending migrations into a new batch; rollback reverses the latest batches and their files in reverse order.

| Operation | Behavior |
|---|---|
| `migrate` | Apply pending migrations in filename order. |
| `migrate:status` | Show the state of discovered migrations. |
| `migrate:rollback --step N` | Reverse the latest N batches. |
| `migrate:reset` | Reverse all applied migrations through `down`. |
| `migrate:refresh` | Reverse and apply again; supports batch selection. |
| `migrate:fresh` | Reset through `down`, remove histories, and migrate again as the first batch. |

Service equivalents are `Migrator(app, manager).migrate(...)`, `.rollback(steps=1, ...)`, `.reset(...)`, `.refresh(steps=None, ...)`, `.fresh(...)`, and `.status(...)`; all are async. Pass `connection=` and `events=` by keyword where supported. Do not run reset/fresh/refresh against data that must survive without a tested recovery plan.

`fresh` is not a universal drop-all-tables command: it reverses recorded migrations through their own `down`, drops `migrations` and `seeders` history, and reapplies migrations. Unrelated tables are not automatically removed. Reversal exhausting all applied migrations also clears seeder history; partial reversal preserves it. After a full rebuild, `seed` can populate data again. The migrator does not automatically execute seeders.

## Add tracked initial data

After migrating `flags`, save this class in `database/seeders/0001_default_flags.py` with an unused prefix:

```python
from orionis.database import Seeder
from orionis.support.facades import DB


class DefaultFlags(Seeder):
    async def run(self) -> None:
        await DB.table("flags").insert({"name": "enabled"})
```

`uv run python -B reactor seed` and `uv run python -B reactor db:seed` execute pending seeders. The container builds each class, allowing constructor dependencies. `SeederRunner.seed(*, connection=None, events=None)` returns names completed by that invocation.

The runner records a unique seeder identity in `seeders`, claims execution, and commits data and tracking together. Concurrent processes should not execute the same tracked seeder twice. The current API accepts neither a class name nor a `force` argument: do not import these options from other frameworks or historical documentation. Add a new seeder for additional data; before regenerating development data, examine the effect of rebuilding its schema and history.

The recorded identity is the filename stem, rather than the class name. Files run in lexical order and must each define an unambiguous local subclass. Renaming an executed file can make it appear to be a new seeder: preserve deployed identities.

## Failures and deployment

Discovery validates local classes, duplicates, and files; a missing previously recorded migration can cause `MigrationNotFoundException` during reversal. Do not rename files already applied. `MigrationEvents` and `SeederEvents` report start, success, and failure without coupling data logic to console output.

Transactional tracking does not make email or external calls reversible. Keep those effects out of tracked seeders or make them idempotent. Redshift rejects `SeederRunner.seed()` before access because it does not enforce uniqueness. [Factories](/en/database/orm/factories-and-testing) generate models; they neither replace seeder history nor open a transaction for a batch.
