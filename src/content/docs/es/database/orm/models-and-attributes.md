---
title: "Definir modelos y atributos"
description: "Definir modelos y atributos en Orionis Framework."
editUrl: true
lastUpdated: false
---

## Generar y completar un modelo

```bash
orionis make:model Article
python -B reactor make:model Article
```

Son alternativas. El argumento obligatorio `name` determina archivo y clase; el generador utiliza la ruta `app_models` (normalmente `app/models`), snake case para el archivo y PascalCase para la clase. Admite subdirectorios, los crea si faltan y rechaza un archivo existente; no expone un flag de sobrescritura. La plantilla genera exactamente:

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

Ese punto de partida no descubre las columnas de una tabla existente. Define columnas inline o asigna una `TableDefinition` antes de usar persistencia/asignación masiva.

## Columnas inline y tabla por convención

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

`Article` resuelve `articles`. `Article.table` sigue siendo la opción declarada (`None`); el nombre resuelto está en `Article.__meta__.table_name`. Las declaraciones de columna se retiran de la clase y se consultan desde los atributos de instancia. Una columna no cargada devuelve `None`; un nombre desconocido produce `AttributeError`.

Los defaults de columna son defaults SQL: `Article({"title": "Guía"})` no añade automáticamente `status` o `published`. Los valores generados por la base, salvo la identidad, no se recargan tras INSERT; consulta de nuevo para obtenerlos. Las anotaciones Python solas tampoco declaran columnas.

## Definición compartida y tabla explícita

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

La definición se puede reutilizar en migraciones. Alternativamente conserva columnas inline y establece `table = "content_articles"`. No combines ambas formas. Una definición inválida, columnas propias junto a una compartida, o un nombre de tabla/PK contradictorio produce `OrmConfigurationException`. Configurar una tabla no ejecuta DDL.

## Opciones de configuración

Las opciones se leen al crear la clase. Configúralas en el cuerpo de la clase; modificar una lista de configuración después no reconstruye sus metadatos automáticamente.

<a id="model-option-table"></a>

### `table`

`table: ClassVar[str | None] = None`. Nombre explícito; si falta, snake case de la clase y pluralización inglesa sencilla. `Category` → `categories`; usa un nombre explícito para plurales irregulares.

<a id="model-option-table-definition"></a>

### `table_definition`

`table_definition: ClassVar[TableDefinition | None] = None`. Definición compartida y versionada; alternativa a columnas inline. No se combina con columnas propias ni con `table`/`primary_key` contradictorios.

<a id="model-option-connection"></a>

### `connection`

`connection: ClassVar[str | None] = None`. Nombre registrado en Database; `None` usa la predeterminada y respeta el contexto de conexión de migración.

<a id="model-option-fillable"></a>

### `fillable`

`fillable: ClassVar[list[str]] = []`. Lista permitida para constructor, `fill`, `update` y `create`. Si no está vacía, prevalece sobre `guarded`.

<a id="model-option-guarded"></a>

### `guarded`

`guarded: ClassVar[list[str]] = []`. Lista bloqueada cuando `fillable` está vacía; `"*"` bloquea toda asignación masiva. Ambas vacías permiten columnas declaradas.

<a id="model-option-hidden"></a>

### `hidden`

`hidden: ClassVar[list[str]] = []`. Omite claves de `toDict`, `serialize` y `toJson`; no las cifra ni modifica SELECT. `only` y `exclude` no aplican esta política.

<a id="model-option-casts"></a>

### `casts`

`casts: ClassVar[dict[str, str]] = {}`. Conversiones al asignar e hidratar; se fusionan desde ancestros. Cast no admitido: `OrmException` al declarar la clase.

<a id="model-option-primary-key"></a>

### `primary_key`

`primary_key: ClassVar[str | None] = None`. Nombre único de identidad: opción explícita, primera columna `.primary()` o `"id"`. Las operaciones de entidad no representan identidades compuestas.

<a id="model-option-incrementing"></a>

### `incrementing`

`incrementing: ClassVar[bool] = True`. Adopta `last_insert_id` del INSERT. Usa `False` para identidades cliente o claves no autoincrementales.

<a id="model-option-timestamps"></a>

### `timestamps`

`timestamps: ClassVar[bool] = True`. Mantiene solo las columnas de creación/actualización realmente declaradas. No añade columnas.

<a id="model-option-soft-deletes"></a>

### `soft_deletes`

`soft_deletes: ClassVar[bool] = False`. Activa el borrado lógico solo si existe la columna `DELETED_AT`. Ver su guía para consultas y restauración.

<a id="model-option-uuids"></a>

### `uuids`

`uuids: ClassVar[bool] = False`. Genera `newUniqueId()` antes de INSERT si falta la identidad. Configura también `incrementing=False` y el tipo de columna adecuado.

<a id="model-option-appends"></a>

### `appends`

`appends: ClassVar[list[str]] = []`. Accessors añadidos a la representación visible, salvo los ocultos. No son columnas ni campos para `fill`.

<a id="model-option-created-at"></a>

### `CREATED_AT`

`CREATED_AT: ClassVar[str] = "created_at"`. Nombre de la columna de creación. Se rellena al insertar solo si no se proporcionó.

<a id="model-option-updated-at"></a>

### `UPDATED_AT`

`UPDATED_AT: ClassVar[str] = "updated_at"`. Nombre de actualización. Se renueva en escrituras con cambios, salvo valor explícito.

<a id="model-option-deleted-at"></a>

### `DELETED_AT`

`DELETED_AT: ClassVar[str] = "deleted_at"`. Nombre de la marca de eliminación lógica; debe poder almacenar `None`.

## Casts nativos: los siete nombres admitidos

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

`int` y `float` llaman a las conversiones Python. `bool` acepta como verdaderas las cadenas `1`, `true`, `yes`, `on`, ignorando espacios y mayúsculas; otras cadenas son falsas. `datetime` acepta datetime, ISO o timestamp POSIX y `date` acepta date, datetime o ISO. `json` decodifica str/bytes/bytearray y conserva estructuras ya decodificadas. `uuid` conserva UUID o convierte su representación textual. `None` siempre permanece `None`. Una entrada inválida propaga el error de conversión (`ValueError`, `TypeError` o error JSON); esto no sustituye [validación](/es/validation).

Al persistir, dict/list en una columna que no es JSON/Pickle se convierten a texto JSON; UUID en otra columna se convierte a texto. La conversión de salida SQL no convierte arbitrariamente todos los tipos. Las escrituras masivas de builder no ejecutan mutadores ni el ciclo de asignación de instancia.

## Accessors, mutadores y herencia

`setTitleAttribute(value)` devuelve el valor almacenado; luego se aplica el cast. `getLabelAttribute(value)` recibe el valor almacenado o `None` y devuelve lo expuesto. Usa métodos síncronos. `appends=["label"]` incluye ese cálculo en `toDict`; no permite asignarlo con `fill`.

Una clase base con `__abstract__ = True` aplaza metadatos y columnas a sus descendientes concretos. Las columnas se heredan y una declaración hija con el mismo nombre las reemplaza; los casts se fusionan y los comportamientos se descubren por MRO. Las demás opciones usan la resolución normal de clase. Un `table` explícito se hereda: sobrescríbelo si la subclase debe usar otra tabla. No se implementa persistencia polimórfica por discriminador ni creación de tablas por herencia.

Consulta la [API de atributos y serialización](/es/database/orm/model-api) para `fill`, `getAttribute`, `only`, `exclude` y estado original.
