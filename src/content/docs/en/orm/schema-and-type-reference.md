---
title: "Table and type definitions"
description: "TableDefinition, ColumnOptions, composite constraints, and shared metadata."
editUrl: true
lastUpdated: false
---

`Model`, `Schema`, and the compiler share a backend independent table representation: `TableDefinition`. `Integer`, `String`, and the other types are `ColumnDefinition` objects; structured constraints complete the physical schema. This reference covers public metadata. The [type catalog](/en/database/column-types) contains all 39 logical types, their 40 factories, constructors, arguments, and examples; [modifiers](/en/database/schema-modifiers) explain every fluent operation.

```python
from orionis.database.schema.column import Column
from orionis.orm import Model
from orionis.orm.schema import TableDefinition
from orionis.orm.schema.constraints import TableIndex, UniqueConstraint


class ProjectsV1Schema:
    table_definition = TableDefinition(
        name="projects",
        columns={
            "id": Column.id(),
            "name": Column.string("name", 120),
            "slug": Column.string("slug", 160),
        },
        primary_key="id",
        unique_constraints=(UniqueConstraint(("slug",), name="uq_project_slug"),),
        indexes=(TableIndex(("name",), name="ix_project_name"),),
    )


class Project(Model):
    table_definition = ProjectsV1Schema.table_definition
    timestamps = False
    fillable = ("name", "slug")
```

The definition executes no DDL. A migration must call await `Schema.createFromDefinition`(ProjectsV1Schema.table_definition); Project can be used once its table exists. Preserve V1 and introduce a new definition for future changes to keep history reproducible. [`Model` definitions](/en/orm/models-and-attributes) explain how inline columns and explicit metadata are integrated.

<a id="tabledefinition-init"></a>

## `TableDefinition`

A dataclass with frozen=True, slots=True, eq=False. Fields accept positional or keyword arguments in this order. Frozen prevents field reassignment but **does not deeply freeze** the columns dictionary or its `ColumnDefinition` values: do not mutate a version used by historical migrations.

<a id="tabledefinition-name"></a>

### name

```text
name: str
```

Logical name without the connection prefix. Required.

<a id="tabledefinition-columns"></a>

### columns

```text
columns: dict[str, ColumnDefinition] = field(default_factory=dict)
```

A fresh, initially empty name → `ColumnDefinition` dictionary. Insertion order determines column order. The dictionary key is the SQL name used by the compiler.

<a id="tabledefinition-primary_key"></a>

### primary_key

```text
primary_key: str = 'id'
```

Single key name, default id. This neither creates a missing column nor marks an arbitrary definition as primary by itself: declare primary() on the column, or use composite_primary_key for a composite constraint.

<a id="tabledefinition-schema"></a>

### schema

```text
schema: str | None = None
```

Owning SQL schema; None uses the default. This does not create the schema automatically.

<a id="tabledefinition-comment"></a>

### comment

```text
comment: str | None = None
```

Table comment or None; storage is backend dependent.

<a id="tabledefinition-composite_primary_key"></a>

### composite_primary_key

```text
composite_primary_key: tuple[str, ...] | None = None
```

Ordered tuple or None; translated to PrimaryKeyConstraint. Takes precedence over the simple key representation for the schema. This does not turn `Model.primary_key` into a supported tuple.

<a id="tabledefinition-unique_constraints"></a>

### unique_constraints

```text
unique_constraints: tuple[UniqueConstraint, ...] = ()
```

Tuple of `UniqueConstraint` values, default (). Supports simple or composite constraints with optional names.

<a id="tabledefinition-foreign_keys"></a>

### foreign_keys

```text
foreign_keys: tuple[CompositeForeignKey, ...] = ()
```

Tuple of `CompositeForeignKey` values, default (). Aligns local and referenced columns by position.

<a id="tabledefinition-indexes"></a>

### indexes

```text
indexes: tuple[TableIndex, ...] = ()
```

Tuple of `TableIndex` values, default (). Retains each index column order, name, and uniqueness.

<a id="tabledefinition-columnnames"></a>

### columnNames

```text
columnNames() -> tuple[str, ...]
```

columnNames returns an ordered name tuple; hasColumn checks membership and returns bool. Both read metadata and do not inspect the database.

<a id="tabledefinition-hascolumn"></a>

### hasColumn

```text
hasColumn(name: str) -> bool
```

columnNames returns an ordered name tuple; hasColumn checks membership and returns bool. Both read metadata and do not inspect the database.

```python
definition = ProjectsV1Schema.table_definition
names = definition.columnNames()
contains_slug = definition.hasColumn("slug")
```

## Structured constraints

These are frozen/slotted dataclasses with no SQL access. Required arguments have no default; optional defaults appear in the signatures. There is no comprehensive early validation of lengths, columns, or server compatibility. Supply nonempty tuples, existing columns, and equal counts of local and referenced columns.

<a id="uniqueconstraint-init"></a>

### `UniqueConstraint`

```text
UniqueConstraint(columns: tuple[str, ...], name: str | None = None)
```

columns identifies jointly unique columns; name leaves naming to the backend when None.

<a id="tableindex-init"></a>

### `TableIndex`

```text
TableIndex(columns: tuple[str, ...], name: str | None = None, unique: bool = False)
```

columns preserves order; name=None produces `ix_<logical_table>_<columns>`; unique requests uniqueness.

<a id="compositeforeignkey-init"></a>

### `CompositeForeignKey`

```text
CompositeForeignKey(columns: tuple[str, ...], ref_table: str, ref_columns: tuple[str, ...], name: str | None = None)
```

ref_table accepts schema.table. columns and ref_columns align by position. No ondelete, onupdate, or deferrable arguments exist.

<a id="foreignreference-init"></a>

### `ForeignReference`

```text
ForeignReference(table: str, column: str)
```

Contains a single column reference. Its constructor stores values; parse validates table.column syntax.

<a id="foreignreference-parse"></a>

```text
ForeignReference.parse(reference: str) -> ForeignReference
ForeignReference.qualified() -> str
```

```python
from orionis.orm.schema.constraints import ForeignReference


reference = ForeignReference.parse("users.id")
assert reference.table == "users"
assert reference.column == "id"
assert reference.qualified() == "users.id"
```

parse is a classmethod requiring exactly two nonempty segments; schema.table.column, incomplete strings, or nonstrings raise `ValueError`. qualified is an instance method returning table.column. Use `CompositeForeignKey` for schema qualified targets.

### Composite key example

The articles table must exist with a compatible UNIQUE or PRIMARY KEY over (tenant_id, id). Enable foreign keys on SQLite to enforce references.

```python
from orionis.database.schema.column import Column
from orionis.orm.schema import TableDefinition
from orionis.orm.schema.constraints import CompositeForeignKey


TRANSLATIONS_V1 = TableDefinition(
    name="article_translations",
    columns={
        "tenant_id": Column.integer("tenant_id"),
        "article_id": Column.integer("article_id"),
        "locale": Column.string("locale", 10),
        "title": Column.string("title", 120),
    },
    composite_primary_key=("tenant_id", "article_id", "locale"),
    foreign_keys=(
        CompositeForeignKey(
            columns=("tenant_id", "article_id"),
            ref_table="articles",
            ref_columns=("tenant_id", "id"),
            name="fk_translation_article",
        ),
    ),
)
```

<a id="columnoptions-init"></a>

## `ColumnOptions`

A frozen=True/slots=True dataclass. Its constructor accepts all fields below, positionally or by keyword, with the displayed defaults. `ColumnDefinition` copies each option onto its own attributes; prefer concrete constructors from the [catalog](/en/database/column-types).

<a id="columnoptions-length"></a>

### length

```text
length: int | None = None
```

`Text`/binary length.

<a id="columnoptions-precision"></a>

### precision

```text
precision: int | None = None
```

`Numeric` precision.

<a id="columnoptions-scale"></a>

### scale

```text
scale: int | None = None
```

Decimal scale.

<a id="columnoptions-decimal_return_scale"></a>

### decimal_return_scale

```text
decimal_return_scale: int | None = None
```

Scale for Decimal conversion.

<a id="columnoptions-as_decimal"></a>

### as_decimal

```text
as_decimal: bool = True
```

Decimal conversion; public type constructors call this asdecimal. `Float`/`Double` change it to False.

<a id="columnoptions-enum_values"></a>

### enum_values

```text
enum_values: tuple[str, ...] = ()
```

`Enum` string members.

<a id="columnoptions-enum_name"></a>

### enum_name

```text
enum_name: str | None = None
```

`Enum` type name; constructors call this name.

<a id="columnoptions-native_enum"></a>

### native_enum

```text
native_enum: bool = True
```

Request native ENUM.

<a id="columnoptions-validate_strings"></a>

### validate_strings

```text
validate_strings: bool = False
```

`Enum` string validation.

<a id="columnoptions-create_constraint"></a>

### create_constraint

```text
create_constraint: bool = False
```

CHECK for emulated booleans/enums.

<a id="columnoptions-constraint_name"></a>

### constraint_name

```text
constraint_name: str | None = None
```

`Boolean` CHECK name.

<a id="columnoptions-timezone"></a>

### timezone

```text
timezone: bool = False
```

`Date`/time timezone support where available.

<a id="columnoptions-collation"></a>

### collation

```text
collation: str | None = None
```

`Text` collation.

<a id="columnoptions-as_uuid"></a>

### as_uuid

```text
as_uuid: bool = True
```

Convert to uuid.UUID objects.

<a id="columnoptions-native_uuid"></a>

### native_uuid

```text
native_uuid: bool = True
```

Native UUID representation where available.

<a id="columnoptions-item_type"></a>

### item_type

```text
item_type: ColumnDefinition | None = None
```

ARRAY element type; retained but has no SQL builder.

<a id="columnoptions-dimensions"></a>

### dimensions

```text
dimensions: int | None = None
```

ARRAY dimensions; retained but not materializable.

<a id="columnoptions-as_tuple"></a>

### as_tuple

```text
as_tuple: bool = False
```

ARRAY results as tuples; retained without SQL support.

<a id="columnoptions-zero_indexes"></a>

### zero_indexes

```text
zero_indexes: bool = False
```

ARRAY index conversion; retained without SQL support.

<a id="columnoptions-none_as_null"></a>

### none_as_null

```text
none_as_null: bool = False
```

JSON None as SQL NULL instead of JSON null.

<a id="columnoptions-native"></a>

### native

```text
native: bool = True
```

Native INTERVAL where available.

<a id="columnoptions-second_precision"></a>

### second_precision

```text
second_precision: int | None = None
```

INTERVAL second precision.

<a id="columnoptions-day_precision"></a>

### day_precision

```text
day_precision: int | None = None
```

INTERVAL day precision.

<a id="columnoptions-protocol"></a>

### protocol

```text
protocol: int = 5
```

Pickle protocol; the literal default is 5.

<a id="columnoptions-pickler"></a>

### pickler

```text
pickler: object | None = None
```

Custom pickler retained; SQLCompiler does not forward it.

<a id="columnoptions-comparator"></a>

### comparator

```text
comparator: Callable[[object, object], bool] | None = None
```

Comparator retained; SQLCompiler does not use it. No concrete type constructor exposes it.

<a id="columnoptions-impl"></a>

### impl

```text
impl: object | None = None
```

Custom binary implementation retained; SQLCompiler does not forward it.

```python
from orionis.orm.schema.column import ColumnDefinition, ColumnOptions
from orionis.orm import ColumnType


column = ColumnDefinition(
    ColumnType.STRING,
    ColumnOptions(length=120),
).nullable()
column.name = "title"
```

<a id="column-definition-state"></a>

### Additional public `ColumnDefinition` state

In addition to the options above, available properties are name (initially empty string), column_type (required `ColumnType`), is_primary/is_nullable/is_unique/has_index/is_auto_increment (False), comment_text (None), foreign_ref (None or `ForeignReference`), and default_value (a private absence sentinel). Use hasDefault rather than comparing that sentinel. Configure these properties through fluent methods. These metadata expose neither business data validation nor direct backend access.

<a id="columntype"></a>

## `ColumnType`

A StrEnum with 39 identifiers. Values are logical metadata, not a promise of available native storage. ARRAY, MATCH_TYPE, NUMERIC_COMMON, and SCHEMA_TYPE translation is not registered; creating tables with them raises `QueryException`.

| Member | Value |
|---|---|
| `BIG_INTEGER` | `big_integer` |
| `BOOLEAN` | `boolean` |
| `DATE` | `date` |
| `DATETIME` | `datetime` |
| `DOUBLE` | `double` |
| `ENUM` | `enum` |
| `FLOAT` | `float` |
| `INTEGER` | `integer` |
| `INTERVAL` | `interval` |
| `LARGE_BINARY` | `large_binary` |
| `MATCH_TYPE` | `match_type` |
| `NUMERIC` | `numeric` |
| `NUMERIC_COMMON` | `numeric_common` |
| `PICKLE_TYPE` | `pickle_type` |
| `SCHEMA_TYPE` | `schema_type` |
| `SMALL_INTEGER` | `small_integer` |
| `STRING` | `string` |
| `TEXT` | `text` |
| `TIME` | `time` |
| `UNICODE` | `unicode` |
| `UNICODE_TEXT` | `unicode_text` |
| `UUID` | `uuid` |
| `ARRAY` | `array` |
| `BIGINT` | `bigint` |
| `BINARY` | `binary` |
| `BLOB` | `blob` |
| `CHAR` | `char` |
| `CLOB` | `clob` |
| `DECIMAL` | `decimal` |
| `DOUBLE_PRECISION` | `double_precision` |
| `INT` | `int` |
| `JSON` | `json` |
| `NCHAR` | `nchar` |
| `NVARCHAR` | `nvarchar` |
| `REAL` | `real` |
| `SMALLINT` | `smallint` |
| `TIMESTAMP` | `timestamp` |
| `VARBINARY` | `varbinary` |
| `VARCHAR` | `varchar` |

<a id="definitionbucket-init"></a>

## Internal objects visible from modules

`DefinitionBucket`() is an implementation accumulator, not an alternative table creation API. Its public containers columns={}, primary_columns=[], unique_constraints=[], foreign_keys=[], indexes=[], and kwargs={} group definitions while `Schema` processes a blueprint. `Schema._createTable` has a reserved prefix and is not public facade API. Use the five documented [`Schema`](/en/database/schema) operations to create tables.
