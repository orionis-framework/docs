---
title: "Database and ORM inventory and coverage"
description: "Scope, component references and reproducible checks for the audited public API."
editUrl: true
lastUpdated: false
---

The inventory makes the implementation behind each reference traceable. It includes the component, source file, declaration or signature where applicable, and destinations in both languages. Inherited methods link to their declaring class; contracts link to implementation references and are not presented as additional capabilities.

[Download the complete JSON inventory](/downloads/database-orm-api-inventory.json).

## Audited scope

| Group | Verified entries |
| --- | ---: |
| Mapped public Database and ORM declarations | 971 |
| Individually justified internal implementation exclusions | 7 |
| Additional entries: generated constructors, configuration, commands and collections | 423 |
| Typed Faker providers | 675 |
| Additional dynamic Faker helpers | 7 |
| Audited source files | 183 |

AST extraction identifies 978 lexical declarations in the two modules; 971 have a reference and the other 7 are explicitly identified internals. No declarations remain unmapped within this scope. Additional entries are not counted as “new methods”: they also include properties, enums, command arguments, types and contracts. The Faker catalog compares its 675 typed names, including overloads, against providers available across 110 locales.

## Component references

This table groups declarations by source file; the JSON contains every symbol’s individual destination.

| Source component | Entries | References |
| --- | ---: | --- |
| `config/database.py` | 3 | [configuration](/en/database/configuration) |
| `orionis/console/commands/db/seed.py` | 1 | [seeders](/en/database/seeders) |
| `orionis/console/commands/make/database_migration.py` | 1 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/console/commands/make/database_schema.py` | 1 | [schema](/en/database/schema) |
| `orionis/console/commands/make/database_seeder.py` | 1 | [seeders](/en/database/seeders) |
| `orionis/console/commands/make/test.py` | 1 | [testing](/en/database/orm/testing) |
| `orionis/console/commands/migrate/fresh.py` | 1 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/console/commands/migrate/migrate.py` | 1 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/console/commands/migrate/refresh.py` | 1 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/console/commands/migrate/reset.py` | 1 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/console/commands/migrate/rollback.py` | 1 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/console/commands/migrate/status.py` | 1 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/console/commands/seed/seed.py` | 1 | [seeders](/en/database/seeders) |
| `orionis/console/commands/support/install.py` | 7 | [drivers](/en/database/drivers) |
| `orionis/console/commands/test/test.py` | 1 | [testing](/en/database/orm/testing) |
| `orionis/database/compiler.py` | 9 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/connection.py` | 19 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/connection_manager.py` | 9 | [connections](/en/database/connections) |
| `orionis/database/contracts/connection.py` | 18 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/contracts/connection_manager.py` | 8 | [connections](/en/database/connections) |
| `orionis/database/contracts/migration.py` | 3 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/database/contracts/migrator.py` | 7 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/database/contracts/schema.py` | 6 | [schema](/en/database/schema) |
| `orionis/database/contracts/transaction.py` | 3 | [transactions](/en/database/transactions) |
| `orionis/database/dialect.py` | 5 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/entities/result.py` | 3 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/exceptions.py` | 7 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/migrations/context.py` | 2 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/database/migrations/events.py` | 9 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/database/migrations/migrator.py` | 8 | [migrations-and-seeders](/en/database/migrations-and-seeders) |
| `orionis/database/provider.py` | 3 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/redshift.py` | 9 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/schema/blueprint.py` | 10 | [schema](/en/database/schema) · [schema-modifiers](/en/database/schema-modifiers) |
| `orionis/database/schema/column.py` | 41 | [column-types](/en/database/column-types) |
| `orionis/database/schema/comment.py` | 3 | [schema-modifiers](/en/database/schema-modifiers) |
| `orionis/database/schema/definition_bucket.py` | 8 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) |
| `orionis/database/schema/definitions.py` | 1 | [schema](/en/database/schema) |
| `orionis/database/schema/foreign.py` | 3 | [schema-modifiers](/en/database/schema-modifiers) |
| `orionis/database/schema/index.py` | 3 | [schema-modifiers](/en/database/schema-modifiers) |
| `orionis/database/schema/primary.py` | 3 | [schema-modifiers](/en/database/schema-modifiers) |
| `orionis/database/schema/schema.py` | 7 | [schema](/en/database/schema) |
| `orionis/database/schema/table_creation.py` | 4 | [schema](/en/database/schema) |
| `orionis/database/schema/timestamp.py` | 3 | [schema-modifiers](/en/database/schema-modifiers) |
| `orionis/database/schema/unique.py` | 3 | [schema-modifiers](/en/database/schema-modifiers) |
| `orionis/database/schema_provider.py` | 2 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/seeders/events.py` | 1 | [seeders](/en/database/seeders) |
| `orionis/database/seeders/runner.py` | 3 | [seeders](/en/database/seeders) |
| `orionis/database/seeders/seeder.py` | 2 | [seeders](/en/database/seeders) |
| `orionis/database/threaded/connection.py` | 8 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/threaded/engine.py` | 6 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/threaded/result.py` | 6 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/threaded/transaction.py` | 4 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/threaded/worker.py` | 4 | [runtime-api](/en/database/runtime-api) |
| `orionis/database/transaction.py` | 4 | [transactions](/en/database/transactions) |
| `orionis/foundation/config/database/entities/connections.py` | 7 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/entities/database.py` | 3 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/entities/mysql.py` | 14 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/entities/oracle.py` | 12 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/entities/pgsql.py` | 12 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/entities/redshift.py` | 19 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/entities/sqlite.py` | 9 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/entities/sqlserver.py` | 13 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/connection_name.py` | 7 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/mysql_charsets.py` | 30 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/mysql_collations.py` | 15 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/mysql_engine.py` | 2 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/oracle_encoding.py` | 2 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/oracle_nencoding.py` | 3 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/pgsql_charsets.py` | 34 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/pgsql_collations.py` | 3 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/pgsql_mode.py` | 7 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/redshift_mode.py` | 3 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/sqlite_foreign_key.py` | 3 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/sqlite_journal.py` | 7 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/sqlite_synchronous.py` | 5 | [configuration](/en/database/configuration) |
| `orionis/foundation/config/database/enums/sqlserver_charset.py` | 29 | [configuration](/en/database/configuration) |
| `orionis/orm/attributes.py` | 12 | [model-api](/en/database/orm/model-api) |
| `orionis/orm/collections/collection.py` | 1 | [collections-and-pagination](/en/database/orm/collections-and-pagination) |
| `orionis/orm/collections/paginator.py` | 13 | [collections-and-pagination](/en/database/orm/collections-and-pagination) |
| `orionis/orm/contracts/base_builder.py` | 70 | [joins-and-subqueries](/en/database/joins-and-subqueries) · [query-builder](/en/database/query-builder) · [query-filters](/en/database/query-filters) · [query-writes](/en/database/query-writes) |
| `orionis/orm/contracts/belongs_to_many_relation.py` | 6 | [relationship-operations](/en/database/orm/relationship-operations) |
| `orionis/orm/contracts/builder.py` | 11 | [collections-and-pagination](/en/database/orm/collections-and-pagination) · [eager-loading](/en/database/orm/eager-loading) · [model-api](/en/database/orm/model-api) |
| `orionis/orm/contracts/query_builder.py` | 12 | [db-facade](/en/database/db-facade) |
| `orionis/orm/contracts/raw_builder.py` | 8 | [query-builder](/en/database/query-builder) |
| `orionis/orm/contracts/relation.py` | 6 | [relationship-operations](/en/database/orm/relationship-operations) |
| `orionis/orm/events.py` | 5 | [events](/en/database/orm/events) |
| `orionis/orm/exceptions/__init__.py` | 7 | [model-api](/en/database/orm/model-api) |
| `orionis/orm/factories/exceptions.py` | 6 | [factories-and-testing](/en/database/orm/factories-and-testing) |
| `orionis/orm/factories/factory.py` | 14 | [factories-and-testing](/en/database/orm/factories-and-testing) |
| `orionis/orm/factories/fake.py` | 18 | [faker](/en/database/orm/faker) |
| `orionis/orm/factories/sequence.py` | 4 | [factories-and-testing](/en/database/orm/factories-and-testing) |
| `orionis/orm/metaclass.py` | 29 | [orm](/en/database/orm) · [events](/en/database/orm/events) · [model-api](/en/database/orm/model-api) |
| `orionis/orm/model.py` | 37 | [model-api](/en/database/orm/model-api) · [models-and-attributes](/en/database/orm/models-and-attributes) · [scopes](/en/database/orm/scopes) |
| `orionis/orm/provider.py` | 3 | [runtime-api](/en/database/runtime-api) |
| `orionis/orm/query/base_builder.py` | 73 | [joins-and-subqueries](/en/database/joins-and-subqueries) · [query-builder](/en/database/query-builder) · [query-filters](/en/database/query-filters) · [query-plans](/en/database/query-plans) · [query-writes](/en/database/query-writes) |
| `orionis/orm/query/builder.py` | 22 | [collections-and-pagination](/en/database/orm/collections-and-pagination) · [eager-loading](/en/database/orm/eager-loading) · [model-api](/en/database/orm/model-api) · [scopes](/en/database/orm/scopes) · [soft-deletes](/en/database/orm/soft-deletes) |
| `orionis/orm/query/expressions.py` | 111 | [query-plans](/en/database/query-plans) |
| `orionis/orm/query/join_clause.py` | 5 | [joins-and-subqueries](/en/database/joins-and-subqueries) · [query-plans](/en/database/query-plans) |
| `orionis/orm/query/raw_builder.py` | 8 | [query-builder](/en/database/query-builder) |
| `orionis/orm/query_builder.py` | 13 | [db-facade](/en/database/db-facade) |
| `orionis/orm/relations/belongs_to.py` | 6 | [relationship-operations](/en/database/orm/relationship-operations) |
| `orionis/orm/relations/belongs_to_many.py` | 18 | [relationship-operations](/en/database/orm/relationship-operations) |
| `orionis/orm/relations/has_many.py` | 3 | [relationship-operations](/en/database/orm/relationship-operations) |
| `orionis/orm/relations/has_one.py` | 3 | [relationship-operations](/en/database/orm/relationship-operations) |
| `orionis/orm/relations/has_one_or_many.py` | 5 | [relationship-operations](/en/database/orm/relationship-operations) |
| `orionis/orm/relations/mixin.py` | 8 | [relationship-operations](/en/database/orm/relationship-operations) · [relationships](/en/database/orm/relationships) |
| `orionis/orm/relations/relation.py` | 9 | [relationship-operations](/en/database/orm/relationship-operations) |
| `orionis/orm/resolver.py` | 5 | [model-api](/en/database/orm/model-api) |
| `orionis/orm/schema/column/definition.py` | 48 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) · [schema-modifiers](/en/database/schema-modifiers) |
| `orionis/orm/schema/column/options.py` | 29 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) |
| `orionis/orm/schema/constraints/composite_foreign_key.py` | 6 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) |
| `orionis/orm/schema/constraints/foreign_reference.py` | 6 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) |
| `orionis/orm/schema/constraints/table_index.py` | 5 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) |
| `orionis/orm/schema/constraints/unique_constraint.py` | 4 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) |
| `orionis/orm/schema/table.py` | 13 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) |
| `orionis/orm/schema/types/big_integer.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/boolean.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/column_type.py` | 40 | [schema-and-type-reference](/en/database/orm/schema-and-type-reference) |
| `orionis/orm/schema/types/date.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/date_time.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/double.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/enum_type.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/float_type.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/integer.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/interval.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/large_binary.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/match_type.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/numeric.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/numeric_common.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/pickle_type.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/schema_type.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/small_integer.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_array.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_big_int.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_binary.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_blob.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_char.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_clob.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_decimal.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_double_precision.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_int.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_json.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_nchar.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_nvarchar.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_real.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_small_int.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_timestamp.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_var_binary.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/strict_varchar.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/string_type.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/text.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/time_type.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/unicode.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/unicode_text.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/schema/types/uuid_type.py` | 2 | [column-types](/en/database/column-types) |
| `orionis/orm/soft_deletes.py` | 4 | [soft-deletes](/en/database/orm/soft-deletes) |
| `orionis/orm/state.py` | 8 | [model-api](/en/database/orm/model-api) |
| `orionis/support/facades/db.py` | 2 | [db-facade](/en/database/db-facade) |
| `orionis/support/types/collection.py` | 61 | [collections-and-pagination](/en/database/orm/collections-and-pagination) |
| `orionis/test/cases/case.py` | 3 | [testing](/en/database/orm/testing) |
| `orionis/test/contracts/engine.py` | 8 | [testing](/en/database/orm/testing) |
| `orionis/test/core/engine.py` | 9 | [testing](/en/database/orm/testing) |

## Validate and maintain the inventory

From the documentation repository:

```bash
npm run docs:coverage
python -B scripts/audit-database-orm-source.py --framework-root ../framework
```

The first check validates uniqueness and every destination in both languages without requiring a framework checkout. The second extracts declarations and Faker names again from source and compares normalized hashes of audited files. New APIs, removed declarations or changed source fail the audit and require review; a similar name does not automatically establish coverage.

Update the explanation, examples and symbol destination when the framework changes, then audit the inventory again. A hash identifies the reviewed source, rather than promising future compatibility.

## Documented limits and verification

- Six configurable drivers; availability, dependencies and actual options under [drivers](/en/database/drivers).
- Four declared column types without a compiler builder: StrictArray, MatchType, NumericCommon and SchemaType; engine-specific type differences under [column-types](/en/database/column-types).
- Task-owned transactions, savepoints, cancellation and actual locking scope under [transactions](/en/database/transactions).
- Bulk operations without per-instance events, write limits and serialization under [query-writes](/en/database/query-writes).
- Four supported relationships; associations and pivot limitations under [relationship-operations](/en/database/orm/relationship-operations).
- Factories without implicit transactions and locale-specific Faker availability under [faker](/en/database/orm/faker).

Examples and tests use temporary SQLite databases and actual framework components. DDL compilation was checked against five dialects; this does not replace running every external server. The Faker catalog runs every example in an available locale and documents optional image and xml dependencies. The [testing guide](/en/database/orm/testing) reproduces persistence, relationship, transaction, migration and seeder scenarios.
