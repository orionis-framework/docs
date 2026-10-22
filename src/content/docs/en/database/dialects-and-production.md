---
title: "Dialects and production"
description: "Actual backend compatibility, Redshift, operational boundaries and Database diagnosis."
editUrl: true
lastUpdated: false
---

A shared API does not make backends equivalent. Test types, DDL, identities, locks and failures on the target backend. SQLite verifies many functional examples but does not prove PostgreSQL, MySQL, Oracle, SQL Server or Redshift semantics.

## Effective settings

Runtime applies SQLite PRAGMAs, MySQL charset/collation/SQL mode, PGSQL session/TLS settings, Oracle addressing, ODBC TLS and Redshift connector options. The [configuration catalog](/en/database/configuration) distinguishes applied fields from retained but unconsumed settings.

Specifically, `SQLite.url` does not override `database`; `MySQL.engine` and `prefix_indexes` do not control table/index creation; Oracle does not forward `encoding`/`nencoding` and SQL Server does not use `charset` as an ODBC parameter. Changing those fields does not imply server changes.

Connections do not indiscriminately forward every configuration key as an SQLAlchemy option. The template has no native `DB_POOL_*` variables or generic isolation/retry settings.

## Amazon Redshift

Uses `redshift-connector` and `sqlalchemy-redshift` through a Core engine and reserved checkout worker. It is not PostgreSQL through `asyncpg`. Each physical connection retains its thread during a transaction; independent connections can use distinct workers. Rows are buffered on that worker before returning Python results.

| Capability | Actual behavior |
|---|---|
| Savepoints | Unsupported; nesting raises `TransactionException`. |
| SELECT row locks | `lockForUpdate()` and `sharedLock()` raise `QueryException`, including nested/aggregate plans. |
| DML `RETURNING` | Disabled; omitted generated identities are not returned. |
| `IDENTITY(1,1)` | Can be compiled from autoincrement; supply a client-generated key if a model immediately needs it. |
| Traditional indexes | Unsupported; do not declare them as if using PostgreSQL. |
| PK/unique/FK | Informational declarations without uniqueness/reference enforcement. |
| `supportsUniqueConstraints()` | `False`. |

Database cache, database sessions, database queues, tracked seeders and database scheduler stores reject Redshift because they require enforced uniqueness and/or indexes. Analytical queries and compatible models remain available.

### IAM and Serverless

```dotenv
DB_CONNECTION=redshift
DB_HOST=warehouse.example.test
DB_PORT=5439
DB_DATABASE=dev
DB_REDSHIFT_SSL=true
DB_REDSHIFT_SSLMODE=verify-full
DB_REDSHIFT_TIMEOUT=30
DB_REDSHIFT_IAM=true
DB_REDSHIFT_REGION=us-east-1
DB_REDSHIFT_CLUSTER_IDENTIFIER=example-cluster
DB_REDSHIFT_DB_USER=app_user
```

The connector receives `iam`, `region`, `cluster_identifier`, `db_user` and optional `profile`. Without a profile it uses its credential resolution. Serverless adds `is_serverless`, `serverless_work_group` and `serverless_acct_id`. Fields are validated and forwarded; Orionis does not provision AWS resources or grant account permissions.

TLS defaults to `ssl=True` and `sslmode=verify-full`; `verify-ca` is also accepted. `timeout=None` leaves socket timeout unset. The [configuration table](/en/database/configuration#redshift) lists variables, types and defaults.

## Identities and batches

A single-row insert may report its first primary-key value depending on the driver. A batch does not guarantee keys. Parameterized PostgreSQL uses `RETURNING 1` to count actual rows, including trigger-skipped entries; SQL Server uses OUTPUT rows when driver counts are negative. Oracle preserves batch row counts before results close.

Distinguish the integer from `DB.execute("INSERT...")` from the `InsertResult` returned by `DB.table(...).insert(...)` or `Connection.insert(plan)`. Read the available identity from `result.last_insert_id`; this API has no `insertGetId()`. Submitted batch length alone does not prove every entry was inserted.

## Resources, cancellation and diagnosis

Engines are lazy. Temporary operations release checkouts after buffering results and settling transaction control; explicit transactions retain them until their final level settles. Do not dispose shared services midway through requests.

[Cancellation](/en/database/transactions#isolation-and-cancellation) drains sensitive work and cleanup; immediate SQL cancellation is not promised. Commit may complete despite consumer cancellation. Retry only with a known outcome or idempotency.

All reads buffer complete results: filter, select columns, paginate and split batches. Do not assume streaming cursors. Record business operation, connection name, latency and counts without credentials or bindings. SQL errors are sanitized and there are no general automatic retries.

`db:show`, `db:table` and `db:wipe` inspect catalogs including Redshift. Redshift size metrics use allocated 1 MB blocks; empty tables or limited permissions can leave size unknown. Displayed constraints are declarations, not proof of enforcement.
