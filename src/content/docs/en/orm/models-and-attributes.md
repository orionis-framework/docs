---
title: "Defining models and attributes"
description: "Defining models and attributes in Orionis Framework."
editUrl: true
lastUpdated: false
---

## Generating and completing a model

```bash
orionis make:model Article
python -B reactor make:model Article
```

These are alternatives. Required `name` determines file and class; the generator uses `app_models` (normally `app/models`), snake case for the filename and PascalCase for the class. Subdirectories are supported and created when missing; existing files are rejected and no overwrite flag is exposed. The template generates exactly:

```python
from typing import ClassVar
from orionis.orm import Model
from orionis.orm.schema import TableDefinition

class Article(Model):
    """
    Represent a database record managed by the application.

    Define the table mapping and model metadata when the database schema is
    ready. Mass assignment, hidden fields, casts and appended values start
    empty so each model can declare only its own behavior.
    """

    fillable: ClassVar[list[str]] = []
    guarded: ClassVar[list[str]] = []
    hidden: ClassVar[list[str]] = []
    casts: ClassVar[dict[str, str]] = {}
    appends: ClassVar[list[str]] = []

    # Assign a TableDefinition when the model's schema is ready.
    table_definition: ClassVar[TableDefinition | None] = None
```

This starting point does not discover columns from an existing table. Declare inline columns or assign a `TableDefinition` before persistence or mass assignment.

## Inline columns and conventional tables

```python
from typing import ClassVar
from orionis.orm import Boolean, DateTime, Integer, Model, String


class Article(Model):
    id = Integer().primary().autoIncrement()
    title = String(180)
    status = String(30).default("draft")
    internal_token = String(80).nullable()
    published = Boolean().default(False)
    created_at = DateTime()
    updated_at = DateTime()
    fillable: ClassVar[list[str]] = ["title", "status", "published"]
    hidden: ClassVar[list[str]] = ["internal_token"]
    casts: ClassVar[dict[str, str]] = {"published": "bool"}
    appends: ClassVar[list[str]] = ["label"]

    def setTitleAttribute(self, value: str) -> str:
        return value.strip()

    def getLabelAttribute(self, value=None) -> str:
        return (self.title or "").upper()
```

`Article` resolves to `articles`. `Article.table` remains the declared setting (`None`); the resolved name is `Article.__meta__.table_name`. Column declarations are removed from the class and served through instance attributes. An unloaded declared column returns `None`; an unknown name raises `AttributeError`.

Column defaults are SQL defaults: `Article({"title": "Guide"})` does not automatically populate `status` or `published`. Database-generated values other than the identity are not reloaded after INSERT; query again to retrieve them. Python annotations alone do not declare columns either.

## Shared definitions and explicit tables

```python
from typing import ClassVar
from orionis.orm import Integer, Model, String
from orionis.orm.schema import TableDefinition


articles_v1 = TableDefinition(
    name="content_articles",
    columns={
        "id": Integer().primary().autoIncrement(),
        "title": String(180),
    },
)


class SharedArticle(Model):
    table_definition: ClassVar[TableDefinition] = articles_v1
    timestamps = False
    fillable: ClassVar[list[str]] = ["title"]
```

Reuse the definition in migrations. Alternatively keep inline columns and set `table = "content_articles"`. Do not combine the approaches. Invalid definitions, own columns alongside a shared definition, or conflicting table/PK settings raise `OrmConfigurationException`. Configuring a table does not execute DDL.

<a id="schema-table"></a>

## Model for a table inside a schema

To query `sales.products` through a model, declare `name="products"` and `schema="sales"` in a `TableDefinition`. Assign that definition to the model's `table_definition`. This example assumes the table already exists with the listed columns on the default connection:

```python
from typing import ClassVar
from orionis.orm import Boolean, Integer, Model, String
from orionis.orm.schema import TableDefinition


class SalesProduct(Model):
    table_definition: ClassVar[TableDefinition] = TableDefinition(
        name="products",
        schema="sales",
        columns={
            "id": Integer().primary().autoIncrement(),
            "name": String(180),
            "active": Boolean(),
        },
        primary_key="id",
    )
    timestamps = False
    fillable: ClassVar[list[str]] = ["name", "active"]


async def active_sales_products():
    products = await SalesProduct.where("active", True).orderBy("id").get()
    return [product.toDict() for product in products]
```

`SalesProduct.where(...)` creates a fresh builder, just like `SalesProduct.query().where(...)`, and `get()` returns models. Add `connection = "reporting"` to the class body if the table belongs to that registered connection. `timestamps = False` matches this example table, which declares neither `created_at` nor `updated_at`.

In model configuration, `table = "sales.products"` does not separate the schema from the name: use `TableDefinition(schema="sales", name="products", ...)`. The `"schema.table"` shorthand is interpreted by `DB.table()` and joins accepting table names. Do not combine a shared definition with inline columns. Defining the model does not create the schema or table.

## Configuration options

Options are read when the class is created. Set them in the class body; changing a configuration list later does not automatically rebuild metadata.

<a id="model-option-table"></a>

### `table`

`table: ClassVar[str | None] = None`. Explicit name; otherwise snake case of the class and a simple English pluralization. `Category` → `categories`; specify irregular plurals yourself.

<a id="model-option-table-definition"></a>

### `table_definition`

`table_definition: ClassVar[TableDefinition | None] = None`. Shared versioned definition; an alternative to inline columns. It cannot be combined with own inline columns or conflicting `table`/`primary_key` settings.

<a id="model-option-connection"></a>

### `connection`

`connection: ClassVar[str | None] = None`. Name registered in Database; `None` uses the default and respects an active migration connection context.

<a id="model-option-fillable"></a>

### `fillable`

`fillable: ClassVar[list[str]] = []`. Allowlist for construction, `fill`, `update` and `create`. A nonempty list takes precedence over `guarded`.

<a id="model-option-guarded"></a>

### `guarded`

`guarded: ClassVar[list[str]] = []`. Blocklist when `fillable` is empty; `"*"` blocks all mass assignment. Both empty allow declared columns.

<a id="model-option-hidden"></a>

### `hidden`

`hidden: ClassVar[list[str]] = []`. Omits keys from `toDict`, `serialize` and `toJson`; neither encrypts them nor changes SELECT. `only` and `exclude` bypass this policy.

<a id="model-option-casts"></a>

### `casts`

`casts: ClassVar[dict[str, str]] = {}`. Conversions on assignment and hydration; merged from ancestors. Unsupported casts raise `OrmException` at class declaration.

<a id="model-option-primary-key"></a>

### `primary_key`

`primary_key: ClassVar[str | None] = None`. Single identity column: explicit setting, first `.primary()` column or `"id"`. Entity operations do not represent composite identities.

<a id="model-option-incrementing"></a>

### `incrementing`

`incrementing: ClassVar[bool] = True`. Adopts INSERT `last_insert_id`. Use `False` for client-generated or nonincrementing identities.

<a id="model-option-timestamps"></a>

### `timestamps`

`timestamps: ClassVar[bool] = True`. Maintains only creation/update columns actually declared. It does not add columns.

<a id="model-option-soft-deletes"></a>

### `soft_deletes`

`soft_deletes: ClassVar[bool] = False`. Enables soft deletion only when the `DELETED_AT` column exists. See its guide for queries and restoration.

<a id="model-option-uuids"></a>

### `uuids`

`uuids: ClassVar[bool] = False`. Generates `newUniqueId()` before INSERT when identity is absent. Also configure `incrementing=False` and a matching column type.

<a id="model-option-appends"></a>

### `appends`

`appends: ClassVar[list[str]] = []`. Accessors added to visible output unless hidden. They are not columns or `fill` fields.

<a id="model-option-created-at"></a>

### `CREATED_AT`

`CREATED_AT: ClassVar[str] = "created_at"`. Creation column name. Filled on insert only when not supplied.

<a id="model-option-updated-at"></a>

### `UPDATED_AT`

`UPDATED_AT: ClassVar[str] = "updated_at"`. Update column name. Refreshed on writes with changes unless explicitly supplied.

<a id="model-option-deleted-at"></a>

### `DELETED_AT`

`DELETED_AT: ClassVar[str] = "deleted_at"`. Soft deletion column name; it must support `None`.

## Native casts: all seven supported names

```python
from datetime import date, datetime
from uuid import UUID
from orionis.orm import Integer, Model, String, Text


class ImportRow(Model):
    id = Integer().primary().autoIncrement()
    quantity = Integer()
    price = String(30)
    active = String(10)
    occurred_at = String(60)
    day = String(30)
    metadata = Text()
    external_id = String(36)
    timestamps = False
    casts = {
        "quantity": "int", "price": "float", "active": "bool",
        "occurred_at": "datetime", "day": "date", "metadata": "json",
        "external_id": "uuid",
    }


row = ImportRow({
    "quantity": "3", "price": "9.5", "active": "yes",
    "occurred_at": "2026-01-15T10:00:00+00:00", "day": "2026-01-15",
    "metadata": '{"source":"import"}',
    "external_id": "12345678-1234-5678-1234-567812345678",
})
assert row.quantity == 3 and row.price == 9.5 and row.active is True
assert isinstance(row.occurred_at, datetime) and isinstance(row.day, date)
assert row.metadata == {"source": "import"}
assert isinstance(row.external_id, UUID)
```

`int` and `float` call Python conversions. `bool` treats strings `1`, `true`, `yes`, `on` as true, ignoring whitespace and case; other strings are false. `datetime` accepts datetime, ISO or POSIX timestamps; `date` accepts date, datetime or ISO. `json` decodes str/bytes/bytearray and preserves already decoded structures. `uuid` keeps UUID instances or converts text. `None` always stays `None`. Invalid input propagates conversion errors (`ValueError`, `TypeError` or JSON errors); this does not replace [validation](/en/validation).

On persistence, dict/list in non-JSON/Pickle columns are encoded as JSON text; UUID values in other columns become text. SQL serialization does not arbitrarily convert every type. Mass builder writes do not run mutators or the instance assignment lifecycle.

## Accessors, mutators and inheritance

`setTitleAttribute(value)` returns the stored value; its cast runs afterwards. `getLabelAttribute(value)` receives the stored value or `None` and returns the exposed value. Use synchronous methods. `appends=["label"]` includes that calculation in `toDict`; it does not make it a mass assignable column.

A base with `__abstract__ = True` defers columns and metadata to concrete descendants. Columns are inherited and replaced by same-named child declarations; casts are merged and behaviors follow the MRO. Other settings use normal class resolution. An explicit `table` is inherited: override it when a subclass needs another table. Discriminator-based polymorphic persistence and inheritance-based table creation are not implemented.

See the [attribute and serialization API](/en/orm/model-api) for `fill`, `getAttribute`, `only`, `exclude` and original state.
