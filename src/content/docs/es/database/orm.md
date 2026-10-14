---
title: "ORM y consultas"
description: "El ORM de Orionis combina modelos Active Record, consultas fluidas, relaciones y factories. Los modelos describen atributos y comportamiento; Database administra conexiones,…"
editUrl: true
lastUpdated: false
---

El ORM de Orionis combina modelos Active Record, consultas fluidas, relaciones y factories. Los modelos describen atributos y comportamiento; [Database](/es/database) administra conexiones, compilación SQL y transacciones. El engine no forma parte de la API del modelo.

Las declaraciones y los builders son síncronos. Las operaciones que leen o escriben datos necesitan `await`. Antes de consultar, inicializa la aplicación y crea las tablas mediante migraciones; definir una clase no crea su tabla.

## Del modelo al registro guardado

El modelo pertenece al código de tu aplicación, normalmente `app/models`. Sus columnas deben coincidir con una tabla existente:

1. Define el modelo y su política `fillable` siguiendo [modelos y atributos](/es/database/orm/models-and-attributes).
2. Escribe una [migración](/es/database/migrations-and-seeders) con esas columnas y ejecuta `uv run python -B reactor migrate` desde la raíz del proyecto. Declarar columnas en el modelo no ejecuta este paso.
3. Usa el modelo desde un controlador, comando, job o servicio async después del arranque de la aplicación. Construye una instancia con datos confiables o validados y comprueba el booleano de `await instance.save()`.
4. Consulta con `await ClaseDelModelo.where(...).get()` o `await ClaseDelModelo.find(id)`. `find()` puede devolver `None`; resuelve ese caso antes de leer atributos.

Si solo necesitas filas y agregados, las [consultas de tabla](/es/database/orm/querying) con `DB.table()` evitan declarar un modelo. Usa consultas de modelo cuando necesites casts, eventos, relaciones o eliminación lógica.

1. [Modelos, atributos y persistencia](/es/database/orm/models-and-attributes): definir una entidad, proteger entrada y guardar cambios.
2. [Consultar, actualizar y paginar](/es/database/orm/querying): modelos frente a tablas, filtros, joins, agregados y escrituras masivas.
3. [Relacionar y cargar modelos](/es/database/orm/relationships): relaciones simples, eager loading y tablas pivot.
4. [Eventos, scopes y soft deletes](/es/database/orm/events-and-scopes): comportamiento de dominio, políticas de consulta y eliminación lógica.
5. [Factories y pruebas](/es/database/orm/factories-and-testing): datos reproducibles, estados, secuencias y persistencia controlada.
6. [Tipos y restricciones del esquema](/es/database/orm/schema-and-type-reference): catálogo de tipos, modificadores, claves compuestas y definiciones compartidas.

Los ejemplos que solo declaran modelos o construyen planes no acceden a una base. Los ejemplos async con facades requieren bootstrap y tablas compatibles; cada capítulo explica esas condiciones. Python 3.14 o posterior es obligatorio.

El provider database instala un gestor en `ConnectionResolver`; consultar sin ese puente produce `OrmConfigurationException`. El ORM consume la configuración `database`, sin un archivo de configuración separado. `QueryBuilderProvider` registra el gateway singleton de `DB`; cada llamada de consulta crea su propio builder.
