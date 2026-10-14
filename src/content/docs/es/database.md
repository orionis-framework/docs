---
title: "Bases de datos"
description: "Orionis separa la construcción de consultas de su ejecución. El módulo database administra conexiones SQL con nombre, compila los planes del ORM, ejecuta SQL parametrizado y…"
editUrl: true
lastUpdated: false
---

Orionis separa la construcción de consultas de su ejecución. El módulo `database` administra conexiones SQL con nombre, compila los planes del [ORM](/es/database/orm), ejecuta SQL parametrizado y controla transacciones, esquemas, migraciones y seeders. No es necesario utilizar modelos para consultar una tabla.

Empieza con SQLite, incluido en la instalación base. Las operaciones que acceden a la base de datos son asíncronas; declarar columnas, elegir una conexión y construir una consulta son operaciones síncronas. Python 3.14 o posterior es obligatorio.

## Crear tu primera funcionalidad con datos

En una aplicación instalada, sigue estos pasos:

1. Configura `DB_CONNECTION=sqlite` en `.env` y revisa la ubicación que selecciona `DB_DATABASE` en `config/database.py`. SQLite no necesita un servidor de base de datos separado.
2. Añade una migración en `database/migrations` para crear tus tablas. Ejecuta `uv run python -B reactor migrate` desde la raíz del proyecto; el comando inicia la aplicación antes de aplicar los cambios.
3. En un controlador, comando o servicio async, importa `DB` desde `orionis.support.facades`, construye la consulta y espera su operación final. Por ejemplo, `await DB.table("notes").where("id", note_id).first()` devuelve un diccionario o `None` cuando ya existe la tabla `notes`.
4. Usa una [transacción](/es/database/transactions) cuando varias escrituras deban completarse juntas. Añade [modelos](/es/database/orm/models-and-attributes) cuando necesites comportamiento de dominio o relaciones.

La [guía de conexiones](/es/database/connections) incluye además un programa completo con SQLite en memoria. Úsalo para aprender a ejecutar SQL sin modificar la base de datos de tu aplicación.

1. [Configurar conexiones y ejecutar SQL](/es/database/connections): instalación de drivers, selección de conexión, parámetros y resultados.
2. [Transacciones y concurrencia](/es/database/transactions): atomicidad, savepoints, propiedad de tareas y cancelación.
3. [Crear esquemas](/es/database/schema): blueprints, restricciones y definiciones versionadas.
4. [Evolucionar y poblar la base de datos](/es/database/migrations-and-seeders): migraciones, lotes, reversión y ejecución registrada de seeders.
5. [Motores y operación en producción](/es/database/dialects-and-production): diferencias de dialecto, Redshift, seguridad y diagnóstico.

Una aplicación inicializada recibe los servicios mediante providers y puede usar las facades `DB` y `Schema`. Los ejemplos que construyen `Connection` directamente son programas independientes y cierran sus propios recursos. Los fragmentos con facades necesitan el arranque de [Foundation](/es/getting-started).
