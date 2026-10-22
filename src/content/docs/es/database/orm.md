---
title: "Introducción al ORM"
description: "Introducción al ORM en Orionis Framework."
editUrl: true
lastUpdated: false
---

El ORM implementa Active Record: una clase describe una tabla y una instancia representa una fila. Reúne atributos, casts, consultas, relaciones y eventos. [Database](/es/database) administra las conexiones, los drivers, SQL y las transacciones; el ORM construye planes sobre esa misma infraestructura.

## Arquitectura y ciclo de vida

```mermaid
flowchart TD
    C["Controller / service / command"] --> M["Model: attributes and lifecycle"]
    M --> Q["ModelQueryBuilder: query plan"]
    Q --> R["ConnectionResolver"]
    R --> D["Database connection manager"]
    D --> S["SQL compiler and driver"]
    S --> B[(Database)]
    B --> H["Rows → casts → model hydration"]
    H --> C
```

Al declarar una clase, `ModelMeta` recoge columnas, resuelve tabla y clave primaria y prepara casts, accessors, scopes y listeners. **Declarar un modelo no crea ni modifica tablas**: eso corresponde a las [migraciones](/es/database/migrations-and-seeders).

1. `Article({...})` construye una instancia nueva en memoria y aplica la política de asignación masiva.
2. `await article.save()` genera un INSERT, mantiene los timestamps declarados, recupera la identidad generada y sincroniza el estado original.
3. `await Article.find(id)` recupera una fila, aplica casts y crea una instancia persistida. Si no existe, devuelve `None`.
4. Cambiar atributos marca diferencias respecto al original. Otro `save()` escribe esas diferencias mediante UPDATE.
5. `delete()` elimina la fila o estampa su marca de [borrado lógico](/es/database/orm/soft-deletes).

Las declaraciones y los builders son síncronos; los terminales que acceden a datos son asíncronos. Utiliza estos ejemplos desde un controlador, servicio, comando o tarea después del arranque. El provider de Database instala `ConnectionResolver`; sin ese arranque las consultas lanzan `OrmConfigurationException`.

## Elegir el nivel adecuado

| Necesidad | API |
| --- | --- |
| Fila con política de atributos, estado y eventos | Instancia de `Model` |
| Consulta de entidades y relaciones | `Article.query()` o un acceso delegado como `Article.where(...)` |
| Filas de tablas, agregados y escrituras sin ciclo de entidad | `DB.table(...)` |
| Conexiones, SQL y transacciones | Database y `DB` |

`DB.table()` no ejecuta casts, accessors, eventos ni scopes de un modelo. Un builder de modelo sí hidrata entidades, pero sus escrituras masivas tampoco ejecutan el ciclo de cada instancia. Elige conscientemente cuando una regla depende de eventos.

## Recorrido de aprendizaje

- [Definir modelos y atributos](/es/database/orm/models-and-attributes): generador, columnas, opciones y serialización.
- [Persistencia y estado](/es/database/orm/model-api): API completa de clase e instancia.
- [Consultas](/es/database/orm/querying): lenguaje fluido, agregados y operaciones masivas.
- [Relaciones](/es/database/orm/relationships), [operaciones](/es/database/orm/relationship-operations) y [N+1](/es/database/orm/eager-loading).
- [Scopes](/es/database/orm/scopes), [eventos](/es/database/orm/events) y [soft deletes](/es/database/orm/soft-deletes).
- [Colecciones y paginación](/es/database/orm/collections-and-pagination).
- [Factories y pruebas](/es/database/orm/factories-and-testing) y [tipos de esquema](/es/database/orm/schema-and-type-reference).

El ORM utiliza la configuración `database`; no tiene un archivo de conexión independiente. Una operación de modelo no abre una transacción de varias acciones por sí sola: delimita la unidad con [transacciones](/es/database/transactions). El estado de Python no se revierte automáticamente si una transacción SQL termina en rollback; recupera una instancia nueva después de revertir.
