---
title: "Modificadores, claves e índices"
description: "Todos los modificadores de columna y las restricciones de tabla del blueprint."
editUrl: true
lastUpdated: false
---

Los tipos definen cómo almacenar un valor; los modificadores describen nulabilidad, generación, valores predeterminados y restricciones. Se comparten entre `Blueprint`, `Column` y los atributos de `Model`. Esta guía cubre todos los modificadores de `ColumnDefinition` y todas las operaciones de restricción del blueprint.

<a id="columndefinition-init"></a>

## Modificadores de columna

`ColumnDefinition`(column_type: `ColumnType`, options: `ColumnOptions` | None = None) inicia name="", sin clave, índice, unicidad, autoincremento, comentario ni default. nullable también comienza en False. Cada modificador devuelve **la misma instancia** de `ColumnDefinition` para encadenar; hasDefault devuelve bool. Las anotaciones no crean una copia.

<a id="columndefinition-primary"></a>

### primary

```text
primary() -> ColumnDefinition
```

Marca la columna como clave primaria. Inicialmente is_primary=False. La traducción SQL impone NOT NULL aunque también se llame nullable(). No genera valores: para una clave entera autogenerada combina autoIncrement o usa id().

```python
from orionis.orm import Integer, String


value = Integer().primary()
```

<a id="columndefinition-nullable"></a>

### nullable

```text
nullable() -> ColumnDefinition
```

Permite SQL NULL, inicialmente prohibido. No acepta un booleano ni permite volver a NOT NULL con nullable(False). El tipo JSON distingue SQL NULL de JSON null mediante none_as_null.

```python
from orionis.orm import Integer, String


value = String(120).nullable()
```

<a id="columndefinition-default"></a>

### default

```text
default(value: Any) -> ColumnDefinition
```

Registra un valor o un callable sin argumentos. Los valores estáticos no None también se convierten en server_default dentro del DDL; los callables se evalúan en inserciones tipadas y no generan un DEFAULT SQL. default(None) cuenta como default declarado, pero no produce DEFAULT NULL explícito. Un lambda que devuelve CURRENT_TIMESTAMP es un string, no una expresión SQL.

```python
from orionis.orm import Integer, String


value = String(36).default(lambda: "pending")
```

<a id="columndefinition-unique"></a>

### unique

```text
unique() -> ColumnDefinition
```

Marca una restricción UNIQUE individual. No recibe nombre ni columnas adicionales; usa table.unique para una restricción compuesta o con nombre. La aplicación efectiva depende del motor: Redshift no impone unicidad.

```python
from orionis.orm import Integer, String


value = String(160).unique()
```

<a id="columndefinition-index"></a>

### index

```text
index() -> ColumnDefinition
```

Marca la creación de un índice individual, inicialmente desactivada. Si también se llama unique(), el toolkit puede representar la unicidad mediante índice único. El soporte físico de índices depende del motor; Redshift no es un motor de índices secundarios tradicionales.

```python
from orionis.orm import Integer, String


value = String(80).index()
```

<a id="columndefinition-foreign"></a>

### foreign

```text
foreign(reference: str) -> ColumnDefinition
```

Acepta exactamente table.column, con dos segmentos no vacíos; cualquier otro formato produce `ValueError`. No acepta acciones de cascada, nombre ni opciones de actualización. Para un schema SQL utiliza ref_table calificado en `CompositeForeignKey`. No configura una relación ORM ni comprueba la existencia de datos referenciados en Python.

```python
from orionis.orm import Integer, String


value = Integer().foreign("users.id")
```

<a id="columndefinition-autoincrement"></a>

### autoIncrement

```text
autoIncrement() -> ColumnDefinition
```

Marca generación automática en una columna apropiada, normalmente primaria entera. No valida por sí mismo que el motor admita esa combinación. Oracle recibe Identity; SQL Server evita IDENTITY implícito para claves enteras sin este indicador. SQLite cambia BIGINT autogenerado primario por INTEGER. Redshift usa identity=(1,1), pero no devuelve el id generado al modelo.

```python
from orionis.orm import Integer, String


value = Integer().primary().autoIncrement()
```

<a id="columndefinition-comment"></a>

### comment

```text
comment(text: str) -> ColumnDefinition
```

Convierte text a string, recorta extremos y conserva el comentario. Su persistencia depende del motor: SQLite no almacena comentarios de columna mediante el DDL generado. No cambia el dato del registro.

```python
from orionis.orm import Integer, String


value = String(120).comment("Public display name")
```

<a id="columndefinition-hasdefault"></a>

### hasDefault

```text
hasDefault() -> bool
```

Devuelve bool sin modificar la definición. Distingue no haber llamado default de haber llamado default(None).

```python
from orionis.orm import Integer, String


value = String(120).default(None).hasDefault()
```

## Restricciones de tabla y timestamps

<a id="blueprint-timestamps"></a>

### `Blueprint.timestamps`

```text
timestamps(*, timezone: bool=False) -> None
```

Añade created_at y updated_at con `DateTime`(timezone=False) y nullable. El argumento timezone es solo por nombre y su default es False. Devuelve None. No programa actualización automática ni añade deleted_at.

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

Recoge nombres de clave primaria y devuelve `PrimaryKey`. Con dos o más columnas genera la restricción compuesta. **Límite actual:** con una sola columna solo fija `TableDefinition.primary_key` y no activa is_primary en esa columna; para generar PRIMARY KEY simple utiliza table.integer("code").primary() o table.id(). Proporciona al menos una columna real. No combines la llamada con id() ni columnas primary(): `Schema` rechaza definiciones primarias repetidas con `ValueError`. Una clave compuesta del esquema no implica soporte general de claves compuestas en `Model`.

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

Define UNIQUE sobre una o varias columnas y devuelve `Unique`. name=None deja el nombre al motor. Preserva el orden de columnas. En Redshift la restricción es informativa y no garantiza exclusión concurrente.

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

Define un índice de una o varias columnas y devuelve `Index`. unique=False por defecto; name=None produce `ix_<tabla_logica>_<columnas>`. El nombre automático usa la tabla lógica sin prefijo. No se exponen índices parciales, expresiones, métodos de índice ni opciones por dialecto.

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

Declara una referencia de una columna y devuelve `ForeignKey`, que contiene .foreign: `CompositeForeignKey`. Sus nombres de columna son posicionales; name es opcional y también puede pasarse por nombre. ref_table admite schema.table. Para varias columnas utiliza `TableDefinition.foreign_keys`. No hay onDelete/onUpdate/cascade fluido.

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

Adjunta un comentario de tabla y devuelve `Comment`. Normaliza `Unicode` NFC, reemplaza controles ASCII por espacios, colapsa espacios y recorta extremos. Si se declara varias veces prevalece el último. Almacenarlo depende del motor.

```python
from orionis.database.schema.blueprint import Blueprint


table = Blueprint()
table.comment("Team memberships")
```

## Tabla con claves e índices

Crea primero users y teams con las claves referenciadas. El ejemplo usa una clave compuesta física en memberships; no presupone que un modelo trate ambas columnas como primary_key.

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

La clave externa declarada solo referencia users.id. Si también quieres garantizar team_id, añade otra foreignKey hacia teams.id. Activar el enforcement es una capacidad del motor/configuración; una relación ORM por sí sola no añade la restricción. Los errores de columnas inexistentes, claves incompatibles, duplicados o sintaxis de DDL se propagan durante compilación o ejecución. El blueprint no valida todas estas combinaciones por anticipado.

## Objetos de definición equivalentes

Los wrappers públicos conservan los mismos datos utilizados por `Blueprint`. Sus constructores son síncronos y no ejecutan SQL:

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

`Comment.text` conserva el comentario normalizado; `PrimaryKey.columns` es la tupla de columnas; `ForeignKey.foreign` conserva `CompositeForeignKey`; `Index.constraint` conserva `TableIndex`; `Unique.constraint` conserva `UniqueConstraint`. `Timestamps`(timezone=True) tiene un default distinto de `Blueprint.timestamps`(timezone=False): el marcador conserva timezone pero no es una columna, y la ruta pública de uso es table.timestamps(). No intentes pasarlo como una factoría de columna.

La forma estructurada de esas restricciones, las propiedades de `ColumnOptions` y las claves compuestas se documentan en [definiciones del ORM](/es/database/orm/schema-and-type-reference). Para renombrar, eliminar o cambiar restricciones existentes consulta [alteraciones](/es/database/schema-alterations).
