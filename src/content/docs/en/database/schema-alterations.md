---
title: "Schema alterations and limits"
description: "Evolving existing tables with migrations and verified explicit SQL."
editUrl: true
lastUpdated: false
---

`Schema` exposes creation and dropping. There is no general ALTER TABLE builder: `Schema.table`/alter/rename, `Column.change`, dropColumn, renameColumn, dropIndex, and fluent onDelete/cascade are absent. Declaring another `TableDefinition` does not alter an existing table: conditional creation preserves it. This guide shows existing operations for changing tables while making portability explicit.

## Adding and removing columns

The example was checked with SQLite. users must already exist. ADD COLUMN adds a nullable column; the framework does not translate this SQL for other engines. Reversing with DROP COLUMN requires an installed SQLite version supporting that syntax and a column free of incompatible indexes or constraints.

```python
from orionis.database import Migration
from orionis.support.facades import DB


class AddNicknameToUsers(Migration):
    async def up(self) -> None:
        await DB.statement("ALTER TABLE users ADD COLUMN nickname VARCHAR(80)")

    async def down(self) -> None:
        await DB.statement("ALTER TABLE users DROP COLUMN nickname")
```

`DB.statement` receives SQL and value bindings, returns bool, and propagates `QueryException` for backend failures. Inside up/down it uses the migration contextual connection. Bound parameters represent **values**, never table names, column names, or DDL fragments. Use application controlled identifiers. Raw SQL must include physical table names when a connection has a prefix: no prefix is added automatically.

## Changing constraints or types on SQLite

When the backend cannot perform the required ALTER, create a new table, copy and transform data, then replace the old one. This example changes flags.name from nullable to NOT NULL; the sample tables have no foreign keys or external indexes and the connection has no prefix. up transforms NULL into unnamed: down restores the **structure**, but cannot reconstruct which rows originally contained NULL.

```python
from orionis.database import Migration
from orionis.support.facades import DB, Schema


class RequireFlagName(Migration):
    async def up(self) -> None:
        async with Schema.create("flags_new") as table:
            table.id()
            table.string("name", 80)
        await DB.statement(
            "INSERT INTO flags_new (id, name) "
            "SELECT id, COALESCE(name, 'unnamed') FROM flags",
        )
        await Schema.drop("flags")
        await DB.statement("ALTER TABLE flags_new RENAME TO flags")

    async def down(self) -> None:
        async with Schema.create("flags_old") as table:
            table.id()
            table.string("name", 80).nullable()
        await DB.statement(
            "INSERT INTO flags_old (id, name) SELECT id, name FROM flags",
        )
        await Schema.drop("flags")
        await DB.statement("ALTER TABLE flags_old RENAME TO flags")
```

If foreign keys, SQL views, triggers, or indexes exist, design a rebuild specific to that schema and explicitly restore them. The example does not automatically reconstruct external dependencies. Avoid reusing an index name while it still belongs to the previous table. Test up/down against representative copied data.

## Indexes, keys, and other operations

For new tables, use [primaryKey, unique, index, and foreignKey](/en/database/schema-modifiers), or [`TableDefinition`](/en/database/orm/schema-and-type-reference) for composite foreign keys. Existing tables need backend SQL for CREATE/DROP INDEX, ALTER CONSTRAINT, type changes, and referential actions. Orionis adds no API automatically checking compatibility.

Creation SQL uses types from the [catalog](/en/database/column-types); types without builders also fail during a rebuild. Key/unique enforcement and indexing differ between SQLite, traditional engines, and Redshift. A physical composite key also does not expand `Model.primary_key` capabilities.

## History and transactions

Add a new migration for every change. An existing table does not prove that its structure matches `TableDefinition`, and `Schema` exposes no reflection to compare them. Each file and its history share a transaction; actual DDL atomicity and locking depend on the backend. An exception following DDL with implicit commit may require manual repair even though the migration record was never committed.

See [migrations](/en/database/migrations-and-seeders) for batches, connection selection, and failures, and [testing](/en/database/orm/factories-and-testing) to verify evolution without touching real application databases.
