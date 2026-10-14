---
title: "ORM and queries"
description: "Orionis combines Active Record models, fluent queries, relationships, and factories. Models describe attributes and behavior; Database owns connections, SQL compilation, and…"
editUrl: true
lastUpdated: false
---

Orionis combines Active Record models, fluent queries, relationships, and factories. Models describe attributes and behavior; [Database](/en/database) owns connections, SQL compilation, and transactions. The engine is not part of the model API.

Declarations and builders are synchronous. Reading or writing data requires `await`. Bootstrap the application and create tables through migrations before querying; declaring a class does not create its table.

## From a model to a persisted record

A model belongs in your application's code, normally `app/models`. Its declared columns must match an existing table:

1. Define the model and its `fillable` policy following [models and attributes](/en/database/orm/models-and-attributes).
2. Create a matching [migration](/en/database/migrations-and-seeders), then run `uv run python -B reactor migrate` from the application root. Column declarations on the model alone do not execute this step.
3. Use the model from an async controller, command, job, or service after application bootstrap. Construct an instance with trusted or validated data, then check the boolean returned by `await instance.save()`.
4. Retrieve data with `await ModelClass.where(...).get()` or `await ModelClass.find(id)`. `find()` can return `None`; handle that case before accessing attributes.

When you only need rows and aggregates, [raw table queries](/en/database/orm/querying) through `DB.table()` avoid defining a model. Use model queries when you need casts, events, relationships, or soft deletes.

1. [Models, attributes, and persistence](/en/database/orm/models-and-attributes): define an entity, protect input, and save changes.
2. [Query, update, and paginate](/en/database/orm/querying): models versus tables, filters, joins, aggregates, and bulk writes.
3. [Relate and load models](/en/database/orm/relationships): direct relationships, eager loading, and pivot tables.
4. [Events, scopes, and soft deletes](/en/database/orm/events-and-scopes): domain behavior, query policies, and logical deletion.
5. [Factories and testing](/en/database/orm/factories-and-testing): reproducible data, states, sequences, and controlled persistence.
6. [Schema types and constraints](/en/database/orm/schema-and-type-reference): type catalog, modifiers, composite keys, and shared definitions.

Examples that only declare models or compose plans perform no database access. Async facade examples require bootstrap and matching tables; each chapter explains its prerequisites. Python 3.14 or later is required.

The database provider installs a manager in `ConnectionResolver`; querying without that bridge raises `OrmConfigurationException`. The ORM consumes `database` configuration without a separate configuration file. `QueryBuilderProvider` registers the `DB` singleton gateway; each query call creates its own builder.
