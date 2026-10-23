---
title: "Definiciones de tabla y tipos"
description: "TableDefinition, ColumnOptions, restricciones compuestas y metadatos compartidos."
editUrl: true
lastUpdated: false
---

`Model`, `Schema` y el compilador comparten una representación de tabla independiente del motor: `TableDefinition`. Las clases `Integer`, `String` y demás son `ColumnDefinition`; las restricciones estructuradas completan el esquema físico. Esta referencia cubre los metadatos públicos. El [catálogo de tipos](/es/database/column-types) contiene los 39 tipos lógicos, sus 40 factorías, constructores, argumentos y ejemplos; los [modificadores](/es/database/schema-modifiers) explican cada operación fluida.

## Compartir un esquema y un modelo

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

La definición no ejecuta DDL. Una migración debe llamar await `Schema.createFromDefinition`(ProjectsV1Schema.table_definition); la clase Project puede utilizarse después de crear su tabla. Para una historia reproducible conserva V1 y crea una nueva definición para cambios futuros. El [ciclo de los modelos](/es/orm/models-and-attributes) explica cómo se integran columnas declaradas en la clase y metadatos explícitos.

<a id="tabledefinition-init"></a>

## `TableDefinition`

Dataclass frozen=True, slots=True, eq=False. Sus campos se pasan por posición o nombre en este orden. Frozen impide reasignar un campo, pero **no congela profundamente** el diccionario columns ni cada `ColumnDefinition`: no modifiques una versión usada por migraciones históricas.

<a id="tabledefinition-name"></a>

### name

```text
name: str
```

Nombre lógico sin prefijo de conexión. Obligatorio.

<a id="tabledefinition-columns"></a>

### columns

```text
columns: dict[str, ColumnDefinition] = field(default_factory=dict)
```

Diccionario nombre → `ColumnDefinition`, inicialmente nuevo y vacío. El orden define el orden de columnas. La clave del diccionario es el nombre SQL que usa el compilador.

<a id="tabledefinition-primary_key"></a>

### primary_key

```text
primary_key: str = 'id'
```

Nombre de la clave simple, default id. No crea una columna ausente ni marca por sí solo una definición arbitraria como primaria: declara primary() en la columna, o utiliza composite_primary_key para la restricción compuesta.

<a id="tabledefinition-schema"></a>

### schema

```text
schema: str | None = None
```

Esquema SQL propietario; None usa el predeterminado. No crea ese esquema automáticamente.

<a id="tabledefinition-comment"></a>

### comment

```text
comment: str | None = None
```

Comentario de tabla o None; almacenamiento dependiente del motor.

<a id="tabledefinition-composite_primary_key"></a>

### composite_primary_key

```text
composite_primary_key: tuple[str, ...] | None = None
```

Tupla ordenada o None; se convierte en PrimaryKeyConstraint. Tiene prioridad sobre la representación de clave simple para el esquema. No convierte `Model.primary_key` en una tupla soportada.

<a id="tabledefinition-unique_constraints"></a>

### unique_constraints

```text
unique_constraints: tuple[UniqueConstraint, ...] = ()
```

Tupla de `UniqueConstraint`, default (). Permite restricciones simples o compuestas con nombre opcional.

<a id="tabledefinition-foreign_keys"></a>

### foreign_keys

```text
foreign_keys: tuple[CompositeForeignKey, ...] = ()
```

Tupla de `CompositeForeignKey`, default (). Alinea columnas locales y referenciadas por posición.

<a id="tabledefinition-indexes"></a>

### indexes

```text
indexes: tuple[TableIndex, ...] = ()
```

Tupla de `TableIndex`, default (). Conserva orden, nombre y unique de cada índice.

<a id="tabledefinition-columnnames"></a>

### columnNames

```text
columnNames() -> tuple[str, ...]
```

columnNames devuelve una tupla de nombres en orden; hasColumn consulta pertenencia por nombre y devuelve bool. Ambas leen metadatos y no inspeccionan la base de datos.

<a id="tabledefinition-hascolumn"></a>

### hasColumn

```text
hasColumn(name: str) -> bool
```

columnNames devuelve una tupla de nombres en orden; hasColumn consulta pertenencia por nombre y devuelve bool. Ambas leen metadatos y no inspeccionan la base de datos.

```python
definition = ProjectsV1Schema.table_definition
names = definition.columnNames()
contains_slug = definition.hasColumn("slug")
```

## Restricciones estructuradas

Son dataclasses frozen/slots sin acceso SQL. Los argumentos obligatorios no tienen default; los defaults opcionales se indican en sus firmas. No hay validación anticipada completa de longitudes, columnas ni compatibilidad del servidor. Utiliza tuplas no vacías, columnas existentes y el mismo número de columnas locales/referenciadas.

<a id="uniqueconstraint-init"></a>

### `UniqueConstraint`

```text
UniqueConstraint(columns: tuple[str, ...], name: str | None = None)
```

columns identifica columnas únicas conjuntamente; name deja el nombre al motor si es None.

<a id="tableindex-init"></a>

### `TableIndex`

```text
TableIndex(columns: tuple[str, ...], name: str | None = None, unique: bool = False)
```

columns conserva orden; name=None produce `ix_<tabla_lógica>_<columnas>`; unique solicita unicidad.

<a id="compositeforeignkey-init"></a>

### `CompositeForeignKey`

```text
CompositeForeignKey(columns: tuple[str, ...], ref_table: str, ref_columns: tuple[str, ...], name: str | None = None)
```

ref_table admite schema.table. columns y ref_columns se alinean por posición. No hay parámetros ondelete, onupdate ni deferrable.

<a id="foreignreference-init"></a>

### `ForeignReference`

```text
ForeignReference(table: str, column: str)
```

Contiene referencia individual. El constructor almacena valores; parse valida el formato table.column.

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

parse es classmethod, exige dos segmentos no vacíos y produce `ValueError` para schema.table.column, strings incompletos o valores no string. qualified es de instancia y devuelve table.column. Para referencias con esquema usa `CompositeForeignKey`.

### Ejemplo de clave compuesta

La tabla articles debe existir con UNIQUE o PRIMARY KEY compatible sobre (tenant_id, id). En SQLite configura claves externas para imponerlas.

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

Dataclass frozen=True/slots=True. Su constructor acepta todos estos campos, por posición o nombre, con los defaults mostrados. `ColumnDefinition` copia cada opción a atributos propios; utiliza preferentemente los constructores concretos del [catálogo](/es/database/column-types).

<a id="columnoptions-length"></a>

### length

```text
length: int | None = None
```

Longitud de texto/binario.

<a id="columnoptions-precision"></a>

### precision

```text
precision: int | None = None
```

Precisión numérica.

<a id="columnoptions-scale"></a>

### scale

```text
scale: int | None = None
```

Escala decimal.

<a id="columnoptions-decimal_return_scale"></a>

### decimal_return_scale

```text
decimal_return_scale: int | None = None
```

Escala de conversión a Decimal.

<a id="columnoptions-as_decimal"></a>

### as_decimal

```text
as_decimal: bool = True
```

Conversión a Decimal; los constructores públicos lo llaman asdecimal. `Float`/`Double` lo cambian a False.

<a id="columnoptions-enum_values"></a>

### enum_values

```text
enum_values: tuple[str, ...] = ()
```

Miembros string de `Enum`.

<a id="columnoptions-enum_name"></a>

### enum_name

```text
enum_name: str | None = None
```

Nombre del tipo `Enum`; los constructores lo llaman name.

<a id="columnoptions-native_enum"></a>

### native_enum

```text
native_enum: bool = True
```

Solicitar ENUM nativo.

<a id="columnoptions-validate_strings"></a>

### validate_strings

```text
validate_strings: bool = False
```

Validación de strings del tipo `Enum`.

<a id="columnoptions-create_constraint"></a>

### create_constraint

```text
create_constraint: bool = False
```

CHECK para booleanos/enum emulados.

<a id="columnoptions-constraint_name"></a>

### constraint_name

```text
constraint_name: str | None = None
```

Nombre del CHECK de booleano.

<a id="columnoptions-timezone"></a>

### timezone

```text
timezone: bool = False
```

Soporte de zona de fecha/hora cuando exista.

<a id="columnoptions-collation"></a>

### collation

```text
collation: str | None = None
```

Intercalación de texto.

<a id="columnoptions-as_uuid"></a>

### as_uuid

```text
as_uuid: bool = True
```

Conversión a objetos uuid.UUID.

<a id="columnoptions-native_uuid"></a>

### native_uuid

```text
native_uuid: bool = True
```

Representación UUID nativa donde exista.

<a id="columnoptions-item_type"></a>

### item_type

```text
item_type: ColumnDefinition | None = None
```

Tipo de elementos ARRAY; conservado pero sin builder SQL.

<a id="columnoptions-dimensions"></a>

### dimensions

```text
dimensions: int | None = None
```

Dimensiones ARRAY; conservadas pero no materializables.

<a id="columnoptions-as_tuple"></a>

### as_tuple

```text
as_tuple: bool = False
```

Resultados ARRAY como tuple; conservado sin soporte SQL.

<a id="columnoptions-zero_indexes"></a>

### zero_indexes

```text
zero_indexes: bool = False
```

Conversión de índices ARRAY; conservada sin soporte SQL.

<a id="columnoptions-none_as_null"></a>

### none_as_null

```text
none_as_null: bool = False
```

None de JSON como SQL NULL en lugar de JSON null.

<a id="columnoptions-native"></a>

### native

```text
native: bool = True
```

INTERVAL nativo donde exista.

<a id="columnoptions-second_precision"></a>

### second_precision

```text
second_precision: int | None = None
```

Precisión de segundos de INTERVAL.

<a id="columnoptions-day_precision"></a>

### day_precision

```text
day_precision: int | None = None
```

Precisión de días de INTERVAL.

<a id="columnoptions-protocol"></a>

### protocol

```text
protocol: int = 5
```

Protocolo de pickle; el default literal es 5.

<a id="columnoptions-pickler"></a>

### pickler

```text
pickler: object | None = None
```

Pickler personalizado conservado; SQLCompiler no lo reenvía.

<a id="columnoptions-comparator"></a>

### comparator

```text
comparator: Callable[[object, object], bool] | None = None
```

Comparador conservado; SQLCompiler no lo utiliza. Ningún constructor concreto de tipo lo expone.

<a id="columnoptions-impl"></a>

### impl

```text
impl: object | None = None
```

Implementación binaria personalizada conservada; SQLCompiler no la reenvía.

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

### Estado público adicional de `ColumnDefinition`

Además de las opciones anteriores, están disponibles name (string inicialmente vacío), column_type (`ColumnType` obligatorio), is_primary/is_nullable/is_unique/has_index/is_auto_increment (False), comment_text (None), foreign_ref (None o `ForeignReference`) y default_value (sentinela privado de ausencia). Consulta hasDefault en lugar de comparar la sentinela. Los métodos fluidos son la forma de configurar esas propiedades. No se ofrece conversión, validación de datos de negocio ni acceso al motor desde estos metadatos.

<a id="columntype"></a>

## `ColumnType`

StrEnum con 39 identificadores. Sus valores son metadatos lógicos, no una promesa de tipo nativo disponible. La traducción de ARRAY, MATCH_TYPE, NUMERIC_COMMON y SCHEMA_TYPE no está registrada; crear tablas con ellos produce `QueryException`.

| Miembro | Valor |
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

## Objetos internos expuestos por módulo

`DefinitionBucket`() es un acumulador de implementación, no una forma alternativa de crear tablas. Sus contenedores públicos columns={}, primary_columns=[], unique_constraints=[], foreign_keys=[], indexes=[] y kwargs={} agrupan definiciones mientras `Schema` procesa el blueprint. `Schema._createTable` tiene prefijo reservado y no forma parte de la fachada pública. Para crear tablas utiliza las cinco operaciones documentadas en [`Schema`](/es/database/schema).
