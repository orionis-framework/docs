---
title: "Comandos de bases de datos"
description: "Todas las firmas de inspección, migraciones y seeders con sus opciones y diferencias reales."
editUrl: true
lastUpdated: false
---

Estos once comandos operan sobre Database. Todos aceptan `--database` / `-d` como cadena opcional; al omitirla usan la conexión SQL predeterminada de la aplicación. La selección es una conexión de `config/database.py`, no un nombre de archivo ni un driver de colas.

Los comandos de migración y seeding imprimen el progreso y dejan propagar los errores del servicio al flujo de excepciones de Reactor. No hay un `--force` general para las migraciones. Las operaciones de reversión y borrado pueden eliminar datos: elige la conexión expresamente cuando necesites distinguir desarrollo, pruebas u otra base.

<a id="command-db-seed"></a>

## db:seed

Ejecuta los seeders pendientes.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |

Es la misma implementación que `seed`, con su propia firma. Usa el historial de seeders de la conexión elegida y muestra el progreso de cada seeder; no acepta un nombre de clase posicional ni `--class`. No vuelve a ejecutar seeders ya registrados.

```shell
orionis db:seed --database sqlite
python -B reactor db:seed --database sqlite
```

<a id="command-db-show"></a>

## db:show

Inspecciona la base y resume sus tablas.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |
| `--counts` | Bandera, opcional | `False` | Calcular las filas de cada tabla. |
| `--views` | Bandera, opcional | `False` | Incluir el listado de vistas/materializadas. |

Muestra conexión, driver, nombre, tamaño, conexiones abiertas y conteos de objetos. `--counts` calcula filas por tabla y puede ser costoso; `--views` añade el listado de vistas/materializadas. Ambas son banderas opcionales, desactivadas por defecto. La información que un motor no permite obtener se presenta como `N/A`.

```shell
orionis db:show --database sqlite --counts --views
python -B reactor db:show --database sqlite --counts --views
```

<a id="command-db-table"></a>

## db:table

Muestra la estructura de una tabla.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `table` | str, obligatorio | — | Nombre de la tabla a inspeccionar. |
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |

`table` es una cadena posicional obligatoria. Muestra filas, tamaño, columnas, tipos, nulabilidad, defaults, clave primaria, índices y claves foráneas. El conteo de filas se realiza en esta inspección sin bandera adicional. Un nombre inválido o una tabla inexistente detectada como `ValueError` se informa y devuelve `1`; una inspección exitosa devuelve `0`.

```shell
orionis db:table products --database sqlite
python -B reactor db:table products --database sqlite
```

<a id="command-db-wipe"></a>

## db:wipe

Elimina los objetos de usuario de una base de datos.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |
| `--force` | Bandera, opcional | `False` | Omitir confirmación (db:wipe) o reemplazar APP_KEY (key:generate). |

`--database` / `-d` elige la conexión (por defecto la configurada). `--force` es una bandera, `False` por defecto. Sin ella pide confirmación con respuesta inicial negativa; sin TTY devuelve `1` y exige `--force`. Cancelar la pregunta devuelve `0` sin borrar. La operación confirmada elimina tablas, vistas y tipos de usuario según el motor; también contempla vistas materializadas/dominios donde existen. Implementa los flujos de SQLite, MySQL, PostgreSQL, Redshift, SQL Server y Oracle y rechaza otros drivers.

Tiene efectos destructivos sobre objetos de usuario, incluso los ajenos al historial de migraciones. El rollback de DDL no es uniforme entre motores. No admite `--drop-views`, `--drop-types` ni `--dry-run`. Una ejecución correcta devuelve `0`; errores de SQL o dependencias de objetos pueden propagarse.

```shell
orionis db:wipe --database sqlite
python -B reactor db:wipe --database sqlite
```

<a id="command-migrate"></a>

## migrate

Aplica migraciones pendientes y puede ejecutar seeders.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |
| `--seed` | Bandera, opcional | `False` | Ejecutar seeders pendientes después de migrar correctamente. |

`--seed` es una bandera opcional (`False`). Primero ejecuta `Migrator.migrate()` y, solo después de que finalice correctamente, `SeederRunner.seed()` cuando se solicitó. Migraciones ya registradas no se vuelven a aplicar. Cada operación informa progreso y errores mediante sus eventos; un fallo impide continuar el flujo normal.

```shell
orionis migrate --database sqlite --seed
python -B reactor migrate --database sqlite --seed
```

<a id="command-migrate-fresh"></a>

## migrate:fresh

Reconstruye el historial y vuelve a aplicar migraciones.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |

Ejecuta el reset de las migraciones registradas, elimina las tablas de historial de migraciones/seeders y migra de nuevo. No equivale a `db:wipe`: no hace un barrido indiscriminado de todas las tablas de usuario. Puede perder los datos que las operaciones `down()` eliminan y necesita los archivos de las migraciones registradas. No tiene `--seed`, `--force` ni confirmación interactiva.

```shell
orionis migrate:fresh --database sqlite
python -B reactor migrate:fresh --database sqlite
```

<a id="command-migrate-refresh"></a>

## migrate:refresh

Revierte lotes y aplica de nuevo las migraciones pendientes.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |
| `--step` / `-s` | int, opcional | Todos los lotes | Número positivo de lotes completos. |

`--step` / `-s` es un entero opcional; omitido revierte todos los lotes, y si se proporciona debe ser positivo. Después llama a `migrate()`. La unidad son lotes, no archivos. Las operaciones de reversión pueden eliminar datos; no hay confirmación ni opción `--seed`.

```shell
orionis migrate:refresh --database sqlite --step 1
python -B reactor migrate:refresh --database sqlite --step 1
```

<a id="command-migrate-reset"></a>

## migrate:reset

Revierte todas las migraciones aplicadas.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |

Invoca `down()` en orden inverso para todo el historial registrado. No aplica migraciones después ni acepta `--step`. Un archivo faltante de una migración registrada produce `MigrationNotFoundException`. No hay confirmación previa.

```shell
orionis migrate:reset --database sqlite
python -B reactor migrate:reset --database sqlite
```

<a id="command-migrate-rollback"></a>

## migrate:rollback

Revierte el lote más reciente o varios lotes.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |
| `--step` / `-s` | int, opcional | `1` | Número positivo de lotes completos. |

`--step` / `-s` es un entero opcional con valor efectivo `1`; debe ser positivo. Cuenta lotes completos de migraciones, no una cantidad de archivos. No aplica de nuevo las migraciones ni solicita confirmación. Al revertir la última migración aplicada se limpia también el historial de seeders.

```shell
orionis migrate:rollback --database sqlite --step 2
python -B reactor migrate:rollback --database sqlite --step 2
```

<a id="command-migrate-status"></a>

## migrate:status

Muestra migraciones aplicadas y pendientes.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |

Descubre los archivos de migración, consulta el historial y presenta nombre, estado (`Ran` / `Pending`) y lote. Puede crear la tabla de historial si todavía no existe: inspeccionar el estado no ejecuta `up()`, pero sí requiere acceso a la conexión y permisos para inicializar ese historial.

```shell
orionis migrate:status --database sqlite
python -B reactor migrate:status --database sqlite
```

<a id="command-seed"></a>

## seed

Ejecuta los seeders pendientes.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--database` / `-d` | str, opcional | Conexión predeterminada | Nombre de conexión SQL; omitido usa la predeterminada. |

Delega en `SeederRunner.seed(connection=...)`, con eventos de progreso. Si no hay pendientes informa que la base ya está actualizada. No recibe opciones `--force` ni `--class`; `db:seed` es la otra firma de la misma operación.

```shell
orionis seed --database sqlite
python -B reactor seed --database sqlite
```

Los generadores de migraciones, schemas, seeders y factories están en [Generadores de código](/es/console/built-in-generators). Para diseñar archivos, tablas y datos consulta la [referencia de comandos Database](/es/database/commands) y [Migraciones y seeders](/es/database/migrations-and-seeders).
