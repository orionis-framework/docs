---
title: "Inventario y cobertura de Database y ORM"
description: "Alcance, referencias por componente y comprobaciones reproducibles de la API pública auditada."
editUrl: true
lastUpdated: false
---

El inventario permite comprobar qué implementación respalda cada sección. Incluye el componente, su archivo fuente, la declaración o firma cuando corresponde y el destino en ambos idiomas. Los métodos heredados enlazan a su clase de origen; los contratos enlazan a la referencia de la implementación y no se presentan como capacidades adicionales.

[Descargar el inventario completo en JSON](/downloads/database-orm-api-inventory.json).

## Alcance contrastado

| Grupo | Entradas verificadas |
| --- | ---: |
| Declaraciones públicas de Database y ORM con destino documental | 971 |
| Exclusiones de implementación justificadas individualmente | 7 |
| Entradas adicionales: constructores generados, configuración, comandos y colecciones | 437 |
| Comandos CLI de Database con referencia individual | 14 |
| Proveedores Faker tipados | 675 |
| Utilidades dinámicas adicionales de Faker | 7 |
| Archivos fuente contrastados | 190 |

La extracción AST identifica 978 declaraciones léxicas en los dos módulos; 971 tienen referencia y las otras 7 son detalles internos identificados expresamente. No hay declaraciones pendientes dentro de ese alcance. Las entradas adicionales no se suman como “métodos nuevos”: también incluyen propiedades, enum, parámetros de comandos, tipos y contratos. El catálogo Faker contrasta sus 675 nombres tipados, incluidas sus sobrecargas, con proveedores disponibles en 110 locales.

## Referencias por componente

La tabla agrupa las declaraciones por archivo; el JSON contiene el destino individual de cada símbolo.

| Componente fuente | Entradas | Referencias |
| --- | ---: | --- |
| `config/database.py` | 3 | [configuration](/es/database/configuration) |
| `orionis/console/commands/db/seed.py` | 2 | [commands](/es/database/commands) · [seeders](/es/database/seeders) |
| `orionis/console/commands/db/show.py` | 1 | [commands](/es/database/commands) |
| `orionis/console/commands/db/table.py` | 1 | [commands](/es/database/commands) |
| `orionis/console/commands/db/wipe.py` | 1 | [commands](/es/database/commands) |
| `orionis/console/commands/make/database_migration.py` | 2 | [commands](/es/database/commands) · [migrations-and-seeders](/es/database/migrations) |
| `orionis/console/commands/make/database_schema.py` | 2 | [commands](/es/database/commands) · [schema](/es/database/schema) |
| `orionis/console/commands/make/database_seeder.py` | 2 | [commands](/es/database/commands) · [seeders](/es/database/seeders) |
| `orionis/console/commands/make/factory.py` | 1 | [commands](/es/database/commands) |
| `orionis/console/commands/make/test.py` | 1 | [testing](/es/orm/testing) |
| `orionis/console/commands/migrate/fresh.py` | 2 | [commands](/es/database/commands) · [migrations-and-seeders](/es/database/migrations) |
| `orionis/console/commands/migrate/migrate.py` | 2 | [commands](/es/database/commands) · [migrations-and-seeders](/es/database/migrations) |
| `orionis/console/commands/migrate/refresh.py` | 2 | [commands](/es/database/commands) · [migrations-and-seeders](/es/database/migrations) |
| `orionis/console/commands/migrate/reset.py` | 2 | [commands](/es/database/commands) · [migrations-and-seeders](/es/database/migrations) |
| `orionis/console/commands/migrate/rollback.py` | 2 | [commands](/es/database/commands) · [migrations-and-seeders](/es/database/migrations) |
| `orionis/console/commands/migrate/status.py` | 2 | [commands](/es/database/commands) · [migrations-and-seeders](/es/database/migrations) |
| `orionis/console/commands/seed/seed.py` | 1 | [seeders](/es/database/seeders) |
| `orionis/console/commands/support/install.py` | 7 | [drivers](/es/database/drivers) |
| `orionis/console/commands/test/test.py` | 1 | [testing](/es/orm/testing) |
| `orionis/database/compiler.py` | 9 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/connection.py` | 19 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/connection_manager.py` | 9 | [connections](/es/database/connections) |
| `orionis/database/contracts/connection.py` | 18 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/contracts/connection_manager.py` | 8 | [connections](/es/database/connections) |
| `orionis/database/contracts/migration.py` | 3 | [migrations-and-seeders](/es/database/migrations) |
| `orionis/database/contracts/migrator.py` | 7 | [migrations-and-seeders](/es/database/migrations) |
| `orionis/database/contracts/schema.py` | 6 | [schema](/es/database/schema) |
| `orionis/database/contracts/transaction.py` | 3 | [transactions](/es/database/transactions) |
| `orionis/database/dialect.py` | 5 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/entities/result.py` | 3 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/exceptions.py` | 7 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/migrations/context.py` | 2 | [migrations-and-seeders](/es/database/migrations) |
| `orionis/database/migrations/events.py` | 9 | [migrations-and-seeders](/es/database/migrations) |
| `orionis/database/migrations/migrator.py` | 8 | [migrations-and-seeders](/es/database/migrations) |
| `orionis/database/provider.py` | 3 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/redshift.py` | 9 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/schema/blueprint.py` | 10 | [schema](/es/database/schema) · [schema-modifiers](/es/database/schema-modifiers) |
| `orionis/database/schema/column.py` | 41 | [column-types](/es/database/column-types) |
| `orionis/database/schema/comment.py` | 3 | [schema-modifiers](/es/database/schema-modifiers) |
| `orionis/database/schema/definition_bucket.py` | 8 | [schema-and-type-reference](/es/orm/schema-and-type-reference) |
| `orionis/database/schema/definitions.py` | 1 | [schema](/es/database/schema) |
| `orionis/database/schema/foreign.py` | 3 | [schema-modifiers](/es/database/schema-modifiers) |
| `orionis/database/schema/index.py` | 3 | [schema-modifiers](/es/database/schema-modifiers) |
| `orionis/database/schema/primary.py` | 3 | [schema-modifiers](/es/database/schema-modifiers) |
| `orionis/database/schema/schema.py` | 7 | [schema](/es/database/schema) |
| `orionis/database/schema/table_creation.py` | 4 | [schema](/es/database/schema) |
| `orionis/database/schema/timestamp.py` | 3 | [schema-modifiers](/es/database/schema-modifiers) |
| `orionis/database/schema/unique.py` | 3 | [schema-modifiers](/es/database/schema-modifiers) |
| `orionis/database/schema_provider.py` | 2 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/seeders/events.py` | 1 | [seeders](/es/database/seeders) |
| `orionis/database/seeders/runner.py` | 3 | [seeders](/es/database/seeders) |
| `orionis/database/seeders/seeder.py` | 2 | [seeders](/es/database/seeders) |
| `orionis/database/threaded/connection.py` | 8 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/threaded/engine.py` | 6 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/threaded/result.py` | 6 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/threaded/transaction.py` | 4 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/threaded/worker.py` | 4 | [runtime-api](/es/database/runtime-api) |
| `orionis/database/transaction.py` | 4 | [transactions](/es/database/transactions) |
| `orionis/foundation/config/database/entities/connections.py` | 7 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/entities/database.py` | 3 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/entities/mysql.py` | 14 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/entities/oracle.py` | 12 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/entities/pgsql.py` | 12 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/entities/redshift.py` | 19 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/entities/sqlite.py` | 9 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/entities/sqlserver.py` | 13 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/connection_name.py` | 7 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/mysql_charsets.py` | 30 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/mysql_collations.py` | 15 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/mysql_engine.py` | 2 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/oracle_encoding.py` | 2 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/oracle_nencoding.py` | 3 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/pgsql_charsets.py` | 34 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/pgsql_collations.py` | 3 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/pgsql_mode.py` | 7 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/redshift_mode.py` | 3 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/sqlite_foreign_key.py` | 3 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/sqlite_journal.py` | 7 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/sqlite_synchronous.py` | 5 | [configuration](/es/database/configuration) |
| `orionis/foundation/config/database/enums/sqlserver_charset.py` | 29 | [configuration](/es/database/configuration) |
| `orionis/orm/attributes.py` | 12 | [model-api](/es/orm/model-api) |
| `orionis/orm/collections/collection.py` | 1 | [collections-and-pagination](/es/orm/collections-and-pagination) |
| `orionis/orm/collections/paginator.py` | 13 | [collections-and-pagination](/es/orm/collections-and-pagination) |
| `orionis/orm/contracts/base_builder.py` | 70 | [joins-and-subqueries](/es/database/joins-and-subqueries) · [query-builder](/es/database/query-builder) · [query-filters](/es/database/query-filters) · [query-writes](/es/database/query-writes) |
| `orionis/orm/contracts/belongs_to_many_relation.py` | 6 | [relationship-operations](/es/orm/relationship-operations) |
| `orionis/orm/contracts/builder.py` | 11 | [collections-and-pagination](/es/orm/collections-and-pagination) · [eager-loading](/es/orm/eager-loading) · [model-api](/es/orm/model-api) |
| `orionis/orm/contracts/query_builder.py` | 12 | [db-facade](/es/database/db-facade) |
| `orionis/orm/contracts/raw_builder.py` | 8 | [query-builder](/es/database/query-builder) |
| `orionis/orm/contracts/relation.py` | 6 | [relationship-operations](/es/orm/relationship-operations) |
| `orionis/orm/events.py` | 5 | [events](/es/orm/events) |
| `orionis/orm/exceptions/__init__.py` | 7 | [model-api](/es/orm/model-api) |
| `orionis/orm/factories/exceptions.py` | 6 | [factories-and-testing](/es/orm/factories) |
| `orionis/orm/factories/factory.py` | 14 | [factories-and-testing](/es/orm/factories) |
| `orionis/orm/factories/fake.py` | 18 | [faker](/es/faker) |
| `orionis/orm/factories/sequence.py` | 4 | [factories-and-testing](/es/orm/factories) |
| `orionis/orm/metaclass.py` | 29 | [orm](/es/orm) · [events](/es/orm/events) · [model-api](/es/orm/model-api) |
| `orionis/orm/model.py` | 37 | [model-api](/es/orm/model-api) · [models-and-attributes](/es/orm/models-and-attributes) · [scopes](/es/orm/scopes) |
| `orionis/orm/provider.py` | 3 | [runtime-api](/es/database/runtime-api) |
| `orionis/orm/query/base_builder.py` | 73 | [joins-and-subqueries](/es/database/joins-and-subqueries) · [query-builder](/es/database/query-builder) · [query-filters](/es/database/query-filters) · [query-plans](/es/database/query-plans) · [query-writes](/es/database/query-writes) |
| `orionis/orm/query/builder.py` | 22 | [collections-and-pagination](/es/orm/collections-and-pagination) · [eager-loading](/es/orm/eager-loading) · [model-api](/es/orm/model-api) · [scopes](/es/orm/scopes) · [soft-deletes](/es/orm/soft-deletes) |
| `orionis/orm/query/expressions.py` | 111 | [query-plans](/es/database/query-plans) |
| `orionis/orm/query/join_clause.py` | 5 | [joins-and-subqueries](/es/database/joins-and-subqueries) · [query-plans](/es/database/query-plans) |
| `orionis/orm/query/raw_builder.py` | 8 | [query-builder](/es/database/query-builder) |
| `orionis/orm/query_builder.py` | 13 | [db-facade](/es/database/db-facade) |
| `orionis/orm/relations/belongs_to.py` | 6 | [relationship-operations](/es/orm/relationship-operations) |
| `orionis/orm/relations/belongs_to_many.py` | 18 | [relationship-operations](/es/orm/relationship-operations) |
| `orionis/orm/relations/has_many.py` | 3 | [relationship-operations](/es/orm/relationship-operations) |
| `orionis/orm/relations/has_one.py` | 3 | [relationship-operations](/es/orm/relationship-operations) |
| `orionis/orm/relations/has_one_or_many.py` | 5 | [relationship-operations](/es/orm/relationship-operations) |
| `orionis/orm/relations/mixin.py` | 8 | [relationship-operations](/es/orm/relationship-operations) · [relationships](/es/orm/relationships) |
| `orionis/orm/relations/relation.py` | 9 | [relationship-operations](/es/orm/relationship-operations) |
| `orionis/orm/resolver.py` | 5 | [model-api](/es/orm/model-api) |
| `orionis/orm/schema/column/definition.py` | 48 | [schema-and-type-reference](/es/orm/schema-and-type-reference) · [schema-modifiers](/es/database/schema-modifiers) |
| `orionis/orm/schema/column/options.py` | 29 | [schema-and-type-reference](/es/orm/schema-and-type-reference) |
| `orionis/orm/schema/constraints/composite_foreign_key.py` | 6 | [schema-and-type-reference](/es/orm/schema-and-type-reference) |
| `orionis/orm/schema/constraints/foreign_reference.py` | 6 | [schema-and-type-reference](/es/orm/schema-and-type-reference) |
| `orionis/orm/schema/constraints/table_index.py` | 5 | [schema-and-type-reference](/es/orm/schema-and-type-reference) |
| `orionis/orm/schema/constraints/unique_constraint.py` | 4 | [schema-and-type-reference](/es/orm/schema-and-type-reference) |
| `orionis/orm/schema/table.py` | 13 | [schema-and-type-reference](/es/orm/schema-and-type-reference) |
| `orionis/orm/schema/types/big_integer.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/boolean.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/column_type.py` | 40 | [schema-and-type-reference](/es/orm/schema-and-type-reference) |
| `orionis/orm/schema/types/date.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/date_time.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/double.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/enum_type.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/float_type.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/integer.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/interval.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/large_binary.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/match_type.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/numeric.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/numeric_common.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/pickle_type.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/schema_type.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/small_integer.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_array.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_big_int.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_binary.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_blob.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_char.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_clob.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_decimal.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_double_precision.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_int.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_json.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_nchar.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_nvarchar.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_real.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_small_int.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_timestamp.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_var_binary.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/strict_varchar.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/string_type.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/text.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/time_type.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/unicode.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/unicode_text.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/schema/types/uuid_type.py` | 2 | [column-types](/es/database/column-types) |
| `orionis/orm/soft_deletes.py` | 4 | [soft-deletes](/es/orm/soft-deletes) |
| `orionis/orm/state.py` | 8 | [model-api](/es/orm/model-api) |
| `orionis/support/facades/db.py` | 2 | [db-facade](/es/database/db-facade) |
| `orionis/support/types/collection.py` | 61 | [collections-and-pagination](/es/orm/collections-and-pagination) |
| `orionis/test/cases/case.py` | 3 | [testing](/es/orm/testing) |
| `orionis/test/contracts/engine.py` | 8 | [testing](/es/orm/testing) |
| `orionis/test/core/engine.py` | 9 | [testing](/es/orm/testing) |

## Validar y mantener el inventario

Desde el repositorio de documentación:

```bash
npm run docs:coverage
python -B scripts/audit-database-orm-source.py --framework-root ../framework
```

La primera comprobación valida unicidad y destinos de todas las entradas en ambos idiomas, sin requerir el checkout del framework. La segunda extrae nuevamente las declaraciones y los nombres Faker del código y contrasta los hashes normalizados de los archivos auditados. Si aparece una API nueva, desaparece una declaración o cambia una fuente, falla para exigir una revisión; no da por cubierta una API nueva por tener un nombre parecido.

Actualiza la explicación, los ejemplos y el destino del símbolo al cambiar el framework, y después vuelve a contrastar el inventario. Un hash es evidencia del código revisado, no una promesa de compatibilidad futura.

## Límites documentados y verificación

- Seis drivers configurables; disponibilidad, dependencias y opciones reales en [drivers](/es/database/drivers).
- Cuatro tipos de columna declarados sin builder de compilación: StrictArray, MatchType, NumericCommon y SchemaType; diferencias de tipos por motor en [column-types](/es/database/column-types).
- Transacciones por tarea, savepoints, cancelación y alcance real de bloqueos en [transactions](/es/database/transactions).
- Operaciones masivas sin eventos por instancia, límites de escritura y serialización en [query-writes](/es/database/query-writes).
- Cuatro relaciones soportadas; asociaciones y limitaciones de pivots en [relationship-operations](/es/orm/relationship-operations).
- Factories sin transacción implícita y Faker con disponibilidad por locale en [faker](/es/faker).

Los ejemplos y pruebas usan SQLite temporal y los componentes reales del framework. La compilación DDL se contrastó con cinco dialectos; eso no sustituye ejecutar cada servidor externo. El catálogo Faker ejecuta cada ejemplo en un locale disponible y documenta las dependencias opcionales de image y xml. La [guía de pruebas](/es/orm/testing) permite reproducir los escenarios de persistencia, relaciones, transacciones, migraciones y seeders.
