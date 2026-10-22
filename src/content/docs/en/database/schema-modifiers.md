---
title: "Modifiers, keys, and indexes"
description: "Every column modifier and blueprint table constraint."
editUrl: true
lastUpdated: false
---

Types define value storage; modifiers describe nullability, generation, defaults, and constraints. These are shared by `Blueprint`, `Column`, and `Model` attributes. This guide covers every `ColumnDefinition` modifier and every blueprint constraint operation.

<a id="columndefinition-init"></a>

## `Column` modifiers

`ColumnDefinition`(column_type: `ColumnType`, options: `ColumnOptions` | None = None) initializes name="" with no key, index, uniqueness, autoincrement, comment, or default. nullable also starts False. Every modifier returns **the same instance** of `ColumnDefinition` for chaining; hasDefault returns bool. Annotations do not create a copy.

<a id="columndefinition-primary"></a>

### primary

```text
primary() -> ColumnDefinition
```

Mark a primary key column. is_primary initially equals False. SQL translation enforces NOT NULL even when nullable() was also called. This does not generate values: combine autoIncrement for generated integer keys, or use id().

```python
from orionis.orm import Integer, String


value = Integer().primary()
```

<a id="columndefinition-nullable"></a>

### nullable

```text
nullable() -> ColumnDefinition
```

Allow SQL NULL, initially disallowed. This accepts no boolean and cannot switch back to NOT NULL using nullable(False). JSON distinguishes SQL NULL from JSON null with none_as_null.

```python
from orionis.orm import Integer, String


value = String(120).nullable()
```

<a id="columndefinition-default"></a>

### default

```text
default(value: Any) -> ColumnDefinition
```

Register a value or a zero argument callable. Static non-None values also become DDL server_default values; callables execute for typed inserts and create no SQL DEFAULT. default(None) counts as a declared default but emits no explicit DEFAULT NULL. A lambda returning CURRENT_TIMESTAMP is a string, not a SQL expression.

```python
from orionis.orm import Integer, String


value = String(36).default(lambda: "pending")
```

<a id="columndefinition-unique"></a>

### unique

```text
unique() -> ColumnDefinition
```

Mark a single column UNIQUE constraint. No name or additional columns are accepted; use table.unique for named or composite uniqueness. Actual enforcement depends on the backend: Redshift does not enforce uniqueness.

```python
from orionis.orm import Integer, String


value = String(160).unique()
```

<a id="columndefinition-index"></a>

### index

```text
index() -> ColumnDefinition
```

Request a single column index, initially disabled. Combining unique() may represent uniqueness as a unique index through the toolkit. Physical support is backend dependent; Redshift does not provide traditional secondary indexes.

```python
from orionis.orm import Integer, String


value = String(80).index()
```

<a id="columndefinition-foreign"></a>

### foreign

```text
foreign(reference: str) -> ColumnDefinition
```

Accept exactly table.column with two nonempty segments; other formats raise `ValueError`. No cascade actions, name, or update options are accepted. For a database schema, use a qualified ref_table on `CompositeForeignKey`. This configures neither an ORM relationship nor a Python check for referenced data.

```python
from orionis.orm import Integer, String


value = Integer().foreign("users.id")
```

<a id="columndefinition-autoincrement"></a>

### autoIncrement

```text
autoIncrement() -> ColumnDefinition
```

Request automatic generation on an appropriate column, normally an integer primary key. This does not validate backend support for every combination. Oracle receives Identity; SQL Server disables implicit IDENTITY for integer keys without this marker. SQLite changes generated primary BIGINT into INTEGER. Redshift uses identity=(1,1) but does not return the generated identifier to the model.

```python
from orionis.orm import Integer, String


value = Integer().primary().autoIncrement()
```

<a id="columndefinition-comment"></a>

### comment

```text
comment(text: str) -> ColumnDefinition
```

Convert text to a string, trim its ends, and retain the comment. Persistence depends on the backend: SQLite does not store column comments through generated DDL. This changes no record data.

```python
from orionis.orm import Integer, String


value = String(120).comment("Public display name")
```

<a id="columndefinition-hasdefault"></a>

### hasDefault

```text
hasDefault() -> bool
```

Return bool without modifying the definition. Distinguishes no default call from default(None).

```python
from orionis.orm import Integer, String


value = String(120).default(None).hasDefault()
```

## Table constraints and timestamps

<a id="blueprint-timestamps"></a>

### `Blueprint.timestamps`

```text
timestamps(*, timezone: bool=False) -> None
```

Add nullable created_at and updated_at using `DateTime`(timezone=False). timezone is keyword only and defaults to False. Returns None. This schedules no automatic updates and adds no deleted_at.

```python
from orionis.database.schema.blueprint import Blueprint


table = Blueprint()
table.timestamps(timezone=True)
```

<a id="blueprint-primarykey"></a>

### `Blueprint.primaryKey`

```text
primaryKey(*columns: str) -> PrimaryKey
```

Collect primary key names and return `PrimaryKey`. Two or more columns generate the composite constraint. **Current limit:** a single column only sets `TableDefinition.primary_key` and does not activate its is_primary flag; use table.integer("code").primary() or table.id() to generate a single column PRIMARY KEY. Supply at least one real column. Do not combine this with id() or primary() columns: `Schema` rejects duplicate primary definitions with `ValueError`. A schema composite primary key does not imply general composite key support in `Model`.

```python
from orionis.database.schema.blueprint import Blueprint


table = Blueprint()
table.primaryKey("team_id", "user_id")
```

<a id="blueprint-unique"></a>

### `Blueprint.unique`

```text
unique(*columns: str, name: str | None=None) -> Unique
```

Define UNIQUE over one or more columns and return `Unique`. name=None leaves naming to the backend. `Column` order is preserved. Redshift treats the constraint as informational and does not guarantee concurrent exclusion.

```python
from orionis.database.schema.blueprint import Blueprint


table = Blueprint()
table.unique("team_id", "email", name="uq_team_email")
```

<a id="blueprint-index"></a>

### `Blueprint.index`

```text
index(*columns: str, name: str | None=None, unique: bool=False) -> Index
```

Define a single or composite index and return `Index`. unique defaults to False; name=None produces `ix_<logical_table>_<columns>`. Automatic naming uses the unprefixed logical table. Partial indexes, expression indexes, index methods, and dialect options are not exposed.

```python
from orionis.database.schema.blueprint import Blueprint


table = Blueprint()
table.index("team_id", "active", name="ix_team_active")
```

<a id="blueprint-foreignkey"></a>

### `Blueprint.foreignKey`

```text
foreignKey(column: str, ref_table: str, ref_column: str, name: str | None=None) -> ForeignKey
```

Declare a single column reference and return `ForeignKey`, carrying .foreign: `CompositeForeignKey`. `Column` arguments are positional; optional name may also be supplied by keyword. ref_table accepts schema.table. Use `TableDefinition.foreign_keys` for multiple columns. No fluent onDelete/onUpdate/cascade is available.

```python
from orionis.database.schema.blueprint import Blueprint


table = Blueprint()
table.foreignKey("user_id", "users", "id", name="fk_membership_user")
```

<a id="blueprint-comment"></a>

### `Blueprint.comment`

```text
comment(text: str) -> Comment
```

Attach a table comment and return `Comment`. `Unicode` NFC is normalized, ASCII control characters become spaces, repeated whitespace collapses, and ends are trimmed. The last declaration wins if repeated. Storage depends on the backend.

```python
from orionis.database.schema.blueprint import Blueprint


table = Blueprint()
table.comment("Team memberships")
```

## Table with keys and indexes

Create users and teams with their referenced keys first. This example uses a physical composite key on memberships and does not assume that a model treats both columns as primary_key.

```python
from orionis.database import Migration
from orionis.support.facades import Schema


class CreateMemberships(Migration):
    async def up(self) -> None:
        async with Schema.create("memberships") as table:
            table.integer("team_id")
            table.integer("user_id")
            table.string("email", 160)
            table.boolean("active").default(True)
            table.primaryKey("team_id", "user_id")
            table.unique("team_id", "email", name="uq_membership_email")
            table.index("team_id", "active", name="ix_membership_active")
            table.foreignKey("user_id", "users", "id")
            table.comment("Team memberships")

    async def down(self) -> None:
        await Schema.drop("memberships")
```

The declared foreign key references only users.id. Add another foreignKey toward teams.id to enforce team_id too. Enforcement depends on backend/configuration capabilities; an ORM relationship by itself adds no constraint. Unknown columns, incompatible keys, duplicates, and DDL syntax failures propagate during compilation or execution. The blueprint does not validate every combination in advance.

## Equivalent definition objects

The public wrappers retain the same data used by `Blueprint`. Their constructors are synchronous and execute no SQL:

<a id="comment-init"></a>

```text
Comment(text: str) -> None
```

<a id="foreignkey-init"></a>

```text
ForeignKey(column: str, ref_table: str, ref_column: str, name: str | None=None) -> None
```

<a id="index-init"></a>

```text
Index(*columns: str, name: str | None=None, unique: bool=False) -> None
```

<a id="primarykey-init"></a>

```text
PrimaryKey(*columns: str) -> None
```

<a id="unique-init"></a>

```text
Unique(*columns: str, name: str | None=None) -> None
```

<a id="timestamps-init"></a>

```text
Timestamps(*, timezone: bool=True) -> None
```

`Comment.text` retains the normalized comment; `PrimaryKey.columns` is the column tuple; `ForeignKey.foreign` retains `CompositeForeignKey`; `Index.constraint` retains `TableIndex`; `Unique.constraint` retains `UniqueConstraint`. `Timestamps`(timezone=True) has a different default from `Blueprint.timestamps`(timezone=False): the marker retains timezone but is not a column, and the public usage route is table.timestamps(). Do not pass it as a column factory.

Structured constraints, `ColumnOptions` properties, and composite foreign keys are covered in [ORM definitions](/en/database/orm/schema-and-type-reference). See [alterations](/en/database/schema-alterations) to rename, remove, or change existing constraints.
