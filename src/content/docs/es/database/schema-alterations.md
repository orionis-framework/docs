---
title: "Alteraciones y límites del esquema"
description: "Evolución de tablas existentes mediante migraciones y SQL explícito verificado."
editUrl: true
lastUpdated: false
---

`Schema` expone creación y eliminación. No hay un constructor general de ALTER TABLE: no existen `Schema.table`/alter/rename, `Column.change`, dropColumn, renameColumn, dropIndex ni onDelete/cascade fluidos. Declarar otra `TableDefinition` no altera una tabla existente: la creación condicional la conserva. Esta guía muestra cómo realizar cambios existentes con operaciones reales y explicitar su portabilidad.

## Añadir y eliminar columnas

El ejemplo se comprobó con SQLite. Debe existir users antes de ejecutarlo. ADD COLUMN admite una columna nullable; no se asume que el framework traduzca este SQL para otros motores. La reversión DROP COLUMN requiere una versión del SQLite instalado que soporte esa sintaxis y una columna que no participe en índices/restricciones incompatibles.

```python
from orionis.database import Migration
from orionis.support.facades import DB


class AddNicknameToUsers(Migration):
    async def up(self) -> None:
        await DB.statement("ALTER TABLE users ADD COLUMN nickname VARCHAR(80)")

    async def down(self) -> None:
        await DB.statement("ALTER TABLE users DROP COLUMN nickname")
```

`DB.statement` recibe SQL y parámetros de valores, devuelve bool y propaga `QueryException` ante errores del motor. Dentro de up/down usa la conexión contextual del migrador. Los parámetros enlazados representan **valores**, nunca nombres de tablas, columnas ni fragmentos de DDL. Usa identificadores de aplicación controlados. El SQL manual debe incluir el nombre físico si la conexión tiene prefix: no se le antepone automáticamente.

## Cambiar restricciones o tipos en SQLite

Cuando el motor no permite el ALTER necesario, crea una tabla nueva, copia datos con la transformación deseada y reemplaza la anterior. Este ejemplo modifica flags.name de nullable a NOT NULL; las tablas de ejemplo no tienen claves externas ni índices externos y la conexión no usa prefijo. up transforma NULL en unnamed: down restaura la **estructura**, pero no puede reconstruir cuáles filas originalmente tenían NULL.

```python
from orionis.database import Migration
from orionis.support.facades import DB, Schema


class RequireFlagName(Migration):
    async def up(self) -> None:
        async with Schema.create("flags_new") as table:
            table.id()
            table.string("name", 80)
        await DB.statement(
            "INSERT INTO flags_new (id, name) "
            "SELECT id, COALESCE(name, 'unnamed') FROM flags",
        )
        await Schema.drop("flags")
        await DB.statement("ALTER TABLE flags_new RENAME TO flags")

    async def down(self) -> None:
        async with Schema.create("flags_old") as table:
            table.id()
            table.string("name", 80).nullable()
        await DB.statement(
            "INSERT INTO flags_old (id, name) SELECT id, name FROM flags",
        )
        await Schema.drop("flags")
        await DB.statement("ALTER TABLE flags_old RENAME TO flags")
```

Si existen claves externas, vistas SQL, triggers o índices, diseña la reconstrucción específica de ese esquema y restablécelos expresamente. El ejemplo no pretende reconstruir automáticamente dependencias ajenas. Evita reutilizar un mismo nombre de índice mientras todavía exista en la tabla anterior. Prueba up/down sobre una copia representativa de los datos.

## Índices, claves y otras operaciones

En tablas nuevas utiliza [primaryKey, unique, index y foreignKey](/es/database/schema-modifiers), o [`TableDefinition`](/es/orm/schema-and-type-reference) para claves externas compuestas. En tablas existentes CREATE/DROP INDEX, ALTER CONSTRAINT, cambio de tipo y acciones referenciales requieren SQL propio del motor. Orionis no añade una API que compruebe automáticamente su compatibilidad.

El SQL de creación usa tipos del [catálogo](/es/database/column-types); tipos sin builder no funcionan tampoco en una reconstrucción. El enforcement de claves/unique e índices varía entre SQLite, motores tradicionales y Redshift. Una clave compuesta física tampoco amplía las capacidades de `Model.primary_key`.

## Historial y transacciones

Añade una migración nueva por cambio. Una tabla existente no es evidencia de que su estructura coincida con `TableDefinition`, y no hay reflexión pública desde `Schema` para comparar ambas. Cada archivo y su historial se ejecutan en una transacción; la atomicidad real de DDL y los bloqueos dependen del motor. Una excepción posterior a un DDL con commit implícito puede requerir reparación manual aunque el registro de migración no se haya confirmado.

Consulta [migraciones](/es/database/migrations) para lotes, selección de conexión y errores, y [testing](/es/orm/factories) para probar la evolución sin tocar bases de uso real.
