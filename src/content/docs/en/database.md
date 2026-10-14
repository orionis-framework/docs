---
title: "Database"
description: "Orionis separates query construction from execution. The database module manages named SQL connections, compiles ORM plans, executes parameterized SQL, and controls…"
editUrl: true
lastUpdated: false
---

Orionis separates query construction from execution. The `database` module manages named SQL connections, compiles [ORM](/en/database/orm) plans, executes parameterized SQL, and controls transactions, schemas, migrations, and seeders. Models are optional when querying a table.

Start with SQLite, included in the base installation. Database I/O is asynchronous; declaring columns, selecting a connection, and composing a query are synchronous operations. Python 3.14 or later is required.

## Build your first data-backed feature

In an installed application, begin with these steps:

1. Set `DB_CONNECTION=sqlite` in `.env` and check the location selected by `DB_DATABASE` in `config/database.py`. SQLite needs no separate database server.
2. Add a migration under `database/migrations` to create your tables. Run `uv run python -B reactor migrate` from the application root; the command boots the application before applying changes.
3. In an async controller, command, or service, import `DB` from `orionis.support.facades`, compose a query, and await its terminal operation. For example, `await DB.table("notes").where("id", note_id).first()` returns a dictionary or `None` once the `notes` table exists.
4. Add a [transaction](/en/database/transactions) when several writes must succeed together. Introduce [models](/en/database/orm/models-and-attributes) when the feature needs domain behavior or relationships.

The [connections guide](/en/database/connections) also includes a complete in-memory SQLite program. Use it to learn SQL execution without changing your application's database.

1. [Configure connections and execute SQL](/en/database/connections): driver installation, connection selection, bindings, and results.
2. [Transactions and concurrency](/en/database/transactions): atomicity, savepoints, task ownership, and cancellation.
3. [Create schemas](/en/database/schema): blueprints, constraints, and versioned definitions.
4. [Evolve and populate the database](/en/database/migrations-and-seeders): migrations, batches, reversal, and tracked seeder execution.
5. [Backends and production operation](/en/database/dialects-and-production): dialect differences, Redshift, security, and troubleshooting.

A booted application receives services through providers and can use the `DB` and `Schema` facades. Examples constructing `Connection` directly are standalone programs and close the resources they own. Facade fragments require [Foundation](/en/getting-started) bootstrap.
