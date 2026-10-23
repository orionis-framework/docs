---
title: "Comandos de Database"
description: "Referencia de los 14 comandos: inspección, generadores, migraciones, seeders y borrado, con opciones y ejemplos."
editUrl: true
lastUpdated: false
---

Esta referencia reúne los comandos de inspección, generación, migración, carga de datos y limpieza de Database. Ejecútalos desde la raíz del proyecto, con el entorno Python y la conexión configurados.

Cada par de ejemplos muestra **dos alternativas**: `orionis` y `python -B reactor`. Ejecuta una de ellas. Si utilizas uv para administrar el entorno, puedes anteponer `uv run` al comando Python.

## Opciones comunes y selección de conexión

| Opción | Disponible en | Predeterminado y efecto |
| --- | --- | --- |
| `-h`, `--help` | Los 14 comandos | Muestra la ayuda; no ejecuta la operación ni genera archivos. |
| `--database NAME`, `-d NAME` | `db:*` y `migrate*` de esta página | `None`: usa la conexión predeterminada. `NAME` es el nombre registrado de una conexión, no una URL, archivo o nombre de tabla. |

Los generadores `make:*` no admiten `--database`: crean archivos y utilizan las [rutas de aplicación](/es/getting-started/architecture-and-lifecycle). Configura la conexión en [Database](/es/database/configuration); los ejemplos con `--database sqlite` presuponen esa conexión registrada. Una conexión inexistente, un driver sin dependencias o credenciales incorrectas producen errores al resolver o ejecutar la operación, no crean otra conexión automáticamente.

Para consultar una ayuda concreta:

```bash
orionis db:show --help
python -B reactor db:show --help
```

## Elegir el comando

| Comando | Propósito |
| --- | --- |
| [`db:show`](#db-show) | Muestra un resumen de la conexión y las tablas visibles. Úsalo para confirmar el destino y conocer su contenido antes de migrar o inspeccionar una tabla. |
| [`db:table`](#db-table) | Inspecciona una tabla física existente: conexión, nombre resuelto, cantidad de filas, tamaño, columnas, índices y claves externas. |
| [`db:wipe`](#db-wipe) | Elimina los objetos de usuario descubiertos en la conexión seleccionada. Sirve para vaciar una base de desarrollo o pruebas cuando se desea retirar también las tablas ajenas al historial de migraciones. |
| [`db:seed`](#db-seed) | Ejecuta los seeders pendientes, en el orden de descubrimiento. Usa este comando después de crear las tablas que necesitan sus inserciones. |
| [`make:database-migration`](#make-database-migration) | Genera el archivo de una migración con métodos async up() y down() vacíos. No ejecuta la migración ni crea una tabla. |
| [`make:database-schema`](#make-database-schema) | Genera una definición de esquema reutilizable para una tabla. Es un archivo Python de soporte para migraciones; generarlo no ejecuta DDL. |
| [`make:database-seeder`](#make-database-seeder) | Genera un seeder con async run() vacío para definir datos iniciales. No lo ejecuta ni genera su tabla. |
| [`make:factory`](#make-factory) | Genera una factory para un modelo existente. El archivo permite definir atributos simulados; el comando no genera registros. |
| [`migrate`](#migrate) | Aplica todas las migraciones pendientes en la conexión seleccionada. Es el comando habitual después de implementar una nueva migración. |
| [`migrate:status`](#migrate-status) | Muestra cada migración descubierta, si ya fue aplicada y su lote. Úsalo para comprobar el estado antes o después de migrar. |
| [`migrate:rollback`](#migrate-rollback) | Revierte los últimos lotes de migraciones aplicadas mediante sus métodos down(). No vuelve a aplicar los cambios. |
| [`migrate:reset`](#migrate-reset) | Revierte todas las migraciones registradas como aplicadas en la conexión. Utiliza sus métodos down() en orden inverso. |
| [`migrate:refresh`](#migrate-refresh) | Revierte las migraciones seleccionadas y después aplica todas las pendientes. Úsalo para reconstruir cambios mediante el ciclo down()/up(). |
| [`migrate:fresh`](#migrate-fresh) | Revierte todas las migraciones aplicadas, elimina las tablas de historial de migraciones y seeders, y vuelve a aplicar las migraciones descubiertas. |

<a id="db-show"></a>

## `db:show`

```text
db:show [--database NAME] [--counts] [--views]
```

Muestra un resumen de la conexión y las tablas visibles. Úsalo para confirmar el destino y conocer su contenido antes de migrar o inspeccionar una tabla.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `--counts` | `bool` | False | Añade un COUNT(*) por tabla; puede ser costoso en bases grandes. |
| `--views` | `bool` | False | Añade el listado de vistas normales y materializadas disponibles. |

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis db:show
python -B reactor db:show
```

```bash
orionis db:show --database sqlite --counts --views
python -B reactor db:show --database sqlite --counts --views
```

La primera tabla muestra Connection, Driver, Database, Size, Open connections, Tables, Views y Materialized views. Después aparecen los nombres y tamaños de las tablas; `--counts` añade Rows. Sin `--views` igualmente se muestran los **totales** de vistas en el resumen, pero no su listado.

Los tamaños se expresan en B/KiB/MiB/GiB/TiB. `N/A` significa que la métrica no está disponible; no significa cero. No existe salida JSON ni un flag para filtrar tablas. Si no hay tablas, lo informa sin crear tablas de aplicación.

<a id="db-table"></a>

## `db:table`

```text
db:table table [--database NAME]
```

Inspecciona una tabla física existente: conexión, nombre resuelto, cantidad de filas, tamaño, columnas, índices y claves externas.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `table` | `str` | Obligatorio | Nombre de la tabla mostrado por db:show; no es el nombre de una clase de modelo. |

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis db:table products --database sqlite
python -B reactor db:table products --database sqlite
```

Las columnas muestran nombre, tipo, nullable, default y si forman parte de la clave primaria. Los índices incluyen nombre, columnas, unicidad y marca de PK; las claves externas incluyen columna, referencia y ON DELETE. Si no hay índices o claves externas, aparece un mensaje específico.

`db:table` **siempre cuenta las filas**: no tiene `--counts` ni una opción para omitir ese recuento. El coste puede ser relevante en una tabla grande. No se añade automáticamente DB_PREFIX al nombre proporcionado.

En PostgreSQL, Redshift y SQL Server utiliza `schema.table` cuando el nombre sin schema sea ambiguo: por ejemplo `public.products` o `dbo.products`, si existen. Oracle resuelve nombres de su catálogo de usuario. Los nombres de objeto con puntos adicionales no se pueden representar sin ambigüedad en los tres motores con nombre calificado.

Una tabla ausente o un nombre ambiguo/inválido produce un mensaje de error y salida `1`; una inspección correcta devuelve `0`. Los errores de conexión o permisos se propagan desde Database. No se utiliza este comando para inspeccionar vistas. En Redshift no se listan índices y las PK/FK mostradas son declaraciones informativas, no una garantía de enforcement del motor.

<a id="db-wipe"></a>

## `db:wipe`

```text
db:wipe [--database NAME] [--force]
```

Elimina los objetos de usuario descubiertos en la conexión seleccionada. Sirve para vaciar una base de desarrollo o pruebas cuando se desea retirar también las tablas ajenas al historial de migraciones.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `--force` | `bool` | False | Omite la confirmación interactiva. Es necesario si stdin no es una terminal. |

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis db:wipe --database sqlite
python -B reactor db:wipe --database sqlite
```

:::caution[Eliminación de objetos y datos]
Verifica la conexión antes de ejecutar este comando. Retira tablas y sus datos, vistas, vistas materializadas y tipos/domains cuando el motor los expone. Incluye `migrations` y `seeders` si existen; no llama a `down()`, no vuelve a migrar y no vuelve a sembrar. No elimina los archivos Python de la aplicación ni el archivo SQLite.
:::

Sin `--force`, pide confirmación con respuesta predeterminada **no**. Rechazarla devuelve `0` y muestra que se canceló. Sin terminal, devuelve `1` sin borrar y explica que falta `--force`. Con éxito devuelve `0` y muestra las cantidades de tablas, vistas y tipos retirados.

Para una automatización que deliberadamente deba vaciar **esa conexión**, la forma no interactiva es:

```bash
python -B reactor db:wipe --database sqlite --force
```

`--force` no valida el entorno ni garantiza rollback; sólo omite la pregunta. El comando no contiene una protección adicional basada en `APP_ENV`. El catálogo visible y los permisos del usuario de base de datos determinan qué objetos puede descubrir y eliminar. La operación no está limitada al prefijo de tablas del framework.

### Diferencias de borrado por motor

| Motor | Comportamiento verificado en la implementación |
| --- | --- |
| SQLite | Vistas y tablas en una transacción; difiere claves externas hasta commit para poder retirar ciclos. No enumera objetos internos sqlite_ como objetivos y conserva el archivo de base de datos. |
| MySQL / MariaDB | Vistas y tablas; conserva la misma conexión física, desactiva FOREIGN_KEY_CHECKS temporalmente y restaura su valor previo en finally. El DDL hace commits implícitos: no hay garantía de revertir todo el borrado. |
| PostgreSQL | Vistas materializadas, vistas, tablas, domains y tipos de usuario; utiliza una transacción y CASCADE en las operaciones pertinentes. Los objetos dependientes también pueden verse afectados. |
| Redshift | Vistas materializadas, vistas y tablas mediante su catálogo específico; utiliza transacción y CASCADE donde corresponde. No confunde el catálogo con el de PostgreSQL. |
| SQL Server | Ordena dependencias de vistas/tipos, desactiva SYSTEM_VERSIONING en las tablas temporales y retira claves externas antes de las tablas; ejecuta el conjunto en una transacción. Dependencias no resolubles pueden detener la operación. |
| Oracle | Vistas materializadas, vistas, tablas y tipos del usuario; comprueba dependencias de tipos antes de borrar y vuelve a consultar tablas después de retirar vistas materializadas. El DDL confirma implícitamente, por lo que puede quedar un borrado parcial si falla. |

En Oracle, dependencias externas o ciclos entre tipos pueden impedir el borrado. `--force` no elimina esas restricciones: no se utiliza `DROP TYPE FORCE`.

No es un comando para eliminar la base o el usuario del servidor, ni garantiza retirar toda clase de objeto que exista en cada motor. Las cantidades del resumen corresponden a las categorías descubiertas; CASCADE puede afectar dependencias adicionales.

<a id="db-seed"></a>

## `db:seed`

```text
db:seed [--database NAME]
```

Ejecuta los seeders pendientes, en el orden de descubrimiento. Usa este comando después de crear las tablas que necesitan sus inserciones.

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis db:seed --database sqlite
python -B reactor db:seed --database sqlite
```

Es un alias de `seed`, con las mismas opciones y comportamiento. Cada seeder completado queda registrado en `seeders`; ejecutarlo de nuevo no repite los ya registrados. Muestra progreso por archivo o un mensaje indicando que no hay pendientes.

Cada seeder utiliza su propia transacción. Si falla, sus cambios y su registro se revierten; los seeders anteriores pueden estar confirmados. Redshift rechaza el runner porque no puede garantizar su reclamación mediante UNIQUE. No acepta un nombre de clase ni `--class`, `--force` o `--count`. Consulta [Seeders](/es/database/seeders) para orden, historial y ejemplos completos.

<a id="make-database-migration"></a>

## `make:database-migration`

```text
make:database-migration name
```

Genera el archivo de una migración con métodos async up() y down() vacíos. No ejecuta la migración ni crea una tabla.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `name` | `str` | Obligatorio | Nombre descriptivo, con subdirectorios opcionales. |

También acepta `--help`/`-h`.

```bash
orionis make:database-migration create_products
python -B reactor make:database-migration create_products
```

Con las rutas predeterminadas crea `database/migrations/m<YYYYmmddHHMMSS>_create_products.py`, con clase `CreateProducts`. La marca temporal usa la zona horaria de la aplicación; no se introduce literalmente `<YYYYmmddHHMMSS>` en el comando.

También admite `catalog/create_products`. Completa `up()` y `down()` antes de ejecutar `migrate`; el generador no añade operaciones a partir del nombre. No admite `--create`, `--table`, `--database` ni `--force`. El flujo completo está en [Migraciones](/es/database/migrations).

<a id="make-database-schema"></a>

## `make:database-schema`

```text
make:database-schema name
```

Genera una definición de esquema reutilizable para una tabla. Es un archivo Python de soporte para migraciones; generarlo no ejecuta DDL.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `name` | `str` | Obligatorio | Nombre de archivo y clase; añade el sufijo Schema si falta. |

También acepta `--help`/`-h`.

```bash
orionis make:database-schema products
python -B reactor make:database-schema products
```

Con las rutas predeterminadas genera `database/schemas/products_schema.py` y `ProductsSchema`, utilizando el template real de schema. También admite subdirectorios, como `catalog/products`.

Completa `ProductsSchema.table_definition` y aplícala desde una migración con `await Schema.createFromDefinition(ProductsSchema.table_definition)`. No crea el modelo ORM ni aplica el esquema automáticamente. Sólo admite `name` y ayuda. Consulta [Crear esquemas y tablas](/es/database/schema).

<a id="make-database-seeder"></a>

## `make:database-seeder`

```text
make:database-seeder name
```

Genera un seeder con async run() vacío para definir datos iniciales. No lo ejecuta ni genera su tabla.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `name` | `str` | Obligatorio | Nombre de archivo y clase; añade el sufijo Seeder si falta. |

También acepta `--help`/`-h`.

```bash
orionis make:database-seeder initial_products
python -B reactor make:database-seeder initial_products
```

Con las rutas predeterminadas crea `database/seeders/initial_products_seeder.py` y `InitialProductsSeeder`. Admite nombres con subdirectorios, por ejemplo `catalog/initial_products`.

Completa `run()` y ejecuta `db:seed` cuando las tablas existan. Sólo admite `name` y ayuda; no incorpora flags para modelo, sobrescritura ni cantidad. Consulta [Seeders](/es/database/seeders).

<a id="make-factory"></a>

## `make:factory`

```text
make:factory name [--model MODEL]
```

Genera una factory para un modelo existente. El archivo permite definir atributos simulados; el comando no genera registros.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `name` | `str` | Obligatorio | Nombre de la factory, con subdirectorios opcionales; añade Factory si falta. |
| `--model, -m` | `str` | None | Modelo relativo a app/models. Si se omite, se deriva quitando Factory y conservando subdirectorios. |

También acepta `--help`/`-h`.

```bash
orionis make:factory ProductFactory --model Product
python -B reactor make:factory ProductFactory --model Product
```

```bash
orionis make:factory catalog/ProductFactory --model catalog/Product
python -B reactor make:factory catalog/ProductFactory --model catalog/Product
```

El primer ejemplo crea `database/factories/product_factory.py`, clase `ProductFactory`, e import de `app.models.product.Product`. El segundo utiliza las carpetas `catalog` correspondientes. Los destinos se resuelven mediante las rutas configuradas `database_factories` y `app_models`.

El generador no comprueba que exista el módulo del modelo: un nombre sintácticamente válido puede crear un import que falle después si falta ese archivo. El stub incluye `model = Product` y `definition()` síncrono que devuelve `{}`. Debes completar los atributos: el comando no genera el modelo ni crea su tabla, ni acepta `--count` o `--force`. Para construir o persistir datos utiliza después `make()`/`create()` en código; consulta [Factories](/es/orm/factories).

<a id="migrate"></a>

## `migrate`

```text
migrate [--database NAME] [--seed]
```

Aplica todas las migraciones pendientes en la conexión seleccionada. Es el comando habitual después de implementar una nueva migración.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `--seed` | `bool` | False | Ejecuta seeders pendientes después de finalizar correctamente las migraciones. |

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis migrate --database sqlite
python -B reactor migrate --database sqlite
```

```bash
orionis migrate --database sqlite --seed
python -B reactor migrate --database sqlite --seed
```

Las migraciones pendientes de una ejecución comparten un batch; cada archivo utiliza su propia transacción. El CLI muestra líneas RUNNING/DONE/FAIL con tiempos o indica que no hay pendientes.

`--seed` también ejecuta seeders si la base ya estaba migrada. Un error de seeder no deshace migraciones que ya se confirmaron. No admite `--step`, `--force` ni `--pretend`. Consulta [Migraciones](/es/database/migrations) para historial, descubrimiento y transacciones.

<a id="migrate-status"></a>

## `migrate:status`

```text
migrate:status [--database NAME]
```

Muestra cada migración descubierta, si ya fue aplicada y su lote. Úsalo para comprobar el estado antes o después de migrar.

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis migrate:status --database sqlite
python -B reactor migrate:status --database sqlite
```

La tabla contiene Migration, Status (`Ran` o `Pending`) y Batch (`-` si está pendiente). Si no descubre archivos, muestra un mensaje específico.

No ejecuta `up()` ni `down()`, pero puede crear la tabla de historial `migrations` si falta. Por ello no es estrictamente una operación sin escrituras ni sirve como inspección completa de tablas ajenas a las migraciones. Para ese caso utiliza `db:show`.

<a id="migrate-rollback"></a>

## `migrate:rollback`

```text
migrate:rollback [--database NAME] [--step N]
```

Revierte los últimos lotes de migraciones aplicadas mediante sus métodos down(). No vuelve a aplicar los cambios.

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `--step, -s` | `int` | 1 efectivo | Número positivo de lotes. Si se omite, el comando utiliza 1. |

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis migrate:rollback --database sqlite
python -B reactor migrate:rollback --database sqlite
```

```bash
orionis migrate:rollback --database sqlite --step 2
python -B reactor migrate:rollback --database sqlite --step 2
```

`--step` cuenta **lotes, no archivos**. Si N supera la cantidad disponible, selecciona todos los lotes disponibles. Se revierte en orden inverso de aplicación, con una transacción por archivo. Un número no positivo se rechaza; un fallo detiene el proceso y las reversiones ya confirmadas no se deshacen como un único conjunto.

Cuando la reversión retira la última migración aplicada, el runner elimina también la tabla de historial de seeders de esa conexión. Una reversión parcial lo conserva. No hay un `down()` de seeder que retire automáticamente sus datos. El efecto real sobre datos depende del `down()` de cada migración.

<a id="migrate-reset"></a>

## `migrate:reset`

```text
migrate:reset [--database NAME]
```

Revierte todas las migraciones registradas como aplicadas en la conexión. Utiliza sus métodos down() en orden inverso.

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis migrate:reset --database sqlite
python -B reactor migrate:reset --database sqlite
```

No aplica migraciones después de revertirlas. No elimina por catálogo las tablas ajenas al historial; un `down()` puede ejecutar operaciones propias, por lo que su implementación determina qué objetos desaparecen. Cuando revierte la última aplicada elimina la tabla de historial de seeders. La tabla migrations permanece vacía. Si no había migraciones aplicadas, no hace esa limpieza adicional.

Sólo admite selección de conexión y ayuda. No acepta `--step` ni `--seed`, y no solicita una confirmación específica antes de ejecutar los `down()`. Si necesitas reversiones parciales utiliza `migrate:rollback`.

<a id="migrate-refresh"></a>

## `migrate:refresh`

```text
migrate:refresh [--database NAME] [--step N]
```

Revierte las migraciones seleccionadas y después aplica todas las pendientes. Úsalo para reconstruir cambios mediante el ciclo down()/up().

| Argumento u opción propia | Tipo | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `--step, -s` | `int` | None | Si se omite, revierte todas las aplicadas. Si se indica, revierte los últimos N lotes; N debe ser positivo. |

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis migrate:refresh --database sqlite
python -B reactor migrate:refresh --database sqlite
```

```bash
orionis migrate:refresh --database sqlite --step 1
python -B reactor migrate:refresh --database sqlite --step 1
```

La fase de aplicación no se limita a los archivos recién revertidos: ejecuta todas las migraciones que estén pendientes en ese momento. No existe una transacción global que envuelva ambas fases. No acepta `--seed`; para poblar después utiliza `db:seed`.

Puede borrar datos porque ejecuta `down()`. No tiene confirmación propia ni `--force`. No reinicia el historial como `migrate:fresh`: conserva la tabla migrations y retira los registros revertidos. Si revierte la última aplicada, también elimina la tabla seeders.

<a id="migrate-fresh"></a>

## `migrate:fresh`

```text
migrate:fresh [--database NAME]
```

Revierte todas las migraciones aplicadas, elimina las tablas de historial de migraciones y seeders, y vuelve a aplicar las migraciones descubiertas.

También acepta `--database`/`-d` y `--help`/`-h`.

```bash
orionis migrate:fresh --database sqlite
python -B reactor migrate:fresh --database sqlite
```

La nueva ejecución comienza el historial de migraciones en batch 1. **No equivale a `db:wipe`**: usa los métodos `down()` de las migraciones, no un borrado por catálogo de todas las tablas. Si una tabla ajena no se retira por esos métodos, permanece.

No acepta `--seed`, `--step` ni `--force`, no pide una confirmación propia y no ejecuta seeders. Después de reconstruir puedes ejecutar `db:seed` explícitamente. Si `down()` o una migración nueva falla, el proceso se interrumpe y no existe un rollback global de todas sus fases.

## Convenciones de los generadores

Los cuatro `make:*` de esta página exigen `name`, crean los directorios necesarios y no sobrescriben un archivo existente. Admiten rutas relativas anidadas con `/` o `\` y validan que produzcan módulos Python; no se aceptan rutas absolutas ni componentes de traversal como `..`. Los nombres de módulo se normalizan y los sufijos Schema/Seeder/Factory sólo se añaden cuando faltan. Usa snake_case para migraciones y nombres coherentes para archivos y clases.

Las rutas mostradas son las predeterminadas: `database_migrations`, `database_schemas`, `database_seeders` y `database_factories` pueden apuntar a otros directorios de la aplicación. Generar un archivo no registra una ejecución en las tablas `migrations` o `seeders`; eso ocurre al ejecutar el runner correspondiente.

## Interpretar salidas y errores

| Resultado | Código observado en el CLI |
| --- | --- |
| Ayuda u operación correcta | `0` |
| Cancelar la confirmación de db:wipe | `0`, sin borrar |
| Tabla inexistente, wipe sin terminal y sin --force, o excepción del runner | `1` |
| Argumento obligatorio ausente, flag desconocido o valor no parseable | `2` |
| Error de generación capturado por MakeStubCommand | Puede devolver `0` aunque haya mostrado un error |

Los generadores capturan `OSError`, `TypeError` y `ValueError` y los imprimen; su retorno no distingue esos fallos del éxito. En una automatización verifica el mensaje de creación y la existencia del archivo esperado; no basta con comprobar el código `0`. Un archivo existente no se sobrescribe. Los defaults de las tablas anteriores describen el comportamiento efectivo: un marcador interno de ausencia que aparezca en la ayuda no es un valor que debas pasar.

Las migraciones utilizan transacciones por archivo, pero la posibilidad de revertir DDL depende del [motor](/es/database/dialects-and-production); MySQL y Oracle tienen commits implícitos. El CLI no convierte toda una operación refresh/fresh en una transacción global.

## Elegir entre reversión, reconstrucción y borrado

| Comando | Ejecuta down() | Aplica pendientes después | Elimina historial completo | Descubre y elimina tablas ajenas |
| --- | --- | --- | --- | --- |
| `migrate:rollback` | Últimos N lotes | No | Retira registros revertidos; si queda vacío, limpia seeders | No; depende del contenido de down() |
| `migrate:reset` | Todas las aplicadas | No | Conserva migrations vacía; elimina seeders al revertir la última aplicada | No; depende del contenido de down() |
| `migrate:refresh` | Todas o últimos N lotes | Sí | Conserva migrations; elimina seeders si la reversión agota las aplicadas | No; depende del contenido de down() |
| `migrate:fresh` | Todas las aplicadas | Sí | Elimina tablas migrations y seeders; nuevo batch 1 | No; depende del contenido de down() |
| `db:wipe` | No | No | Retira esas tablas si el catálogo las descubre | Sí, dentro del catálogo visible |

Los cuatro comandos `migrate:*` que ejecutan `down()` no solicitan la confirmación interactiva de `db:wipe`. Su efecto sobre los datos depende de las migraciones. No existe `--force` en esos comandos: no lo añadas copiando convenciones de otro CLI.

Para profundizar: [Migraciones](/es/database/migrations), [Seeders](/es/database/seeders), [Factories](/es/orm/factories), [transacciones](/es/database/transactions) y [pruebas con una base aislada](/es/orm/testing).
