---
title: "Drivers y dependencias"
description: "SQLite, MySQL, PostgreSQL, Oracle, SQL Server y Redshift: drivers reales, instalación y configuración."
editUrl: true
lastUpdated: false
---

Orionis reconoce exactamente seis identificadores de driver. El extra Python instala conectores, no crea un servidor ni una base de datos. SQLite forma parte de las dependencias base. Los ejemplos siguientes no fijan versiones: el catálogo del framework determina los requisitos instalados.

| Driver Orionis | Ruta de consultas | Paquetes del extra |
|---|---|---|
| `sqlite` | `sqlite+aiosqlite` | `aiosqlite` en instalación base; `sqlite3` para consumidores sync. |
| `mysql` | `mysql+aiomysql` | `aiomysql` y `pymysql`. |
| `pgsql` | `postgresql+asyncpg` | `asyncpg` y `psycopg2-binary`. |
| `oracle` | `oracle+oracledb_async` | `oracledb`. |
| `sqlserver` | `mssql+aioodbc` | `aioodbc` y `pyodbc`. |
| `redshift` | `redshift+redshift_connector` | `redshift-connector` y `sqlalchemy-redshift`. |

Los drivers síncronos se utilizan cuando un consumidor necesita un engine bloqueante, como el almacén persistente del scheduler. Redshift usa el conector oficial bloqueante mediante un worker reservado por conexión adquirida; no se conecta con `asyncpg`.

## Instalar con Reactor

```bash
python -B reactor packages
orionis packages
```

El comando carga extras de `project.optional-dependencies` y grupos de `dependency-groups` desde el manifiesto incluido con Orionis; prefiere el manifiesto del paquete, luego el checkout del framework y finalmente el de la aplicación. Muestra catálogo, intérprete destino y propósito de cada opción.

En una terminal interactiva puedes seleccionar nombres o números, separados por espacios o comas; `0` cancela. Las opciones repetidas y requisitos duplicados se eliminan conservando el orden. Después solicita confirmación, predeterminada a no.

### Opciones de packages

```text
packages [options ...] [--list] [--yes | -y]
```

| Argumento u opción | Predeterminado | Comportamiento |
|---|---|---|
| `options` | `[]` | Cero o más nombres, números o claves `extra:NAME`/`group:NAME`. Sin selección intenta preguntar sólo en terminal interactiva. |
| `--list` | `False` | Lista sin instalar; termina antes de resolver la selección. |
| `--yes`, `-y` | `False` | Confirma automáticamente las opciones seleccionadas. |
| `-h`, `--help` | — | Ayuda del CLI. |

Un nombre simple funciona si es inequívoco. Si coincide con un extra y un grupo, utiliza su namespace. Los números dependen del catálogo mostrado; para automatizar utiliza nombres.

```bash
python -B reactor packages --list
python -B reactor packages extra:mysql --yes
python -B reactor packages extra:pgsql --yes
python -B reactor packages extra:oracle --yes
python -B reactor packages extra:sqlserver --yes
python -B reactor packages extra:redshift --yes
python -B reactor packages extra:database --yes
orionis packages extra:mysql extra:pgsql -y
```

Cada línea es una alternativa: instala sólo los motores necesarios; `extra:database` agrupa todos los conectores opcionales. Sin terminal interactiva necesitas selección explícita y `--yes` para instalar. `--yes` por sí solo no selecciona todo.

El comando ejecuta `uv pip install --python <intérprete actual> -- <requisitos>`. Requiere `uv` en `PATH` e instala en el entorno que ejecuta Reactor. No utiliza `uv add` ni actualiza por sí mismo las dependencias declaradas o el lockfile del proyecto. Si quieres que el gestor de paquetes reproduzca el extra, decláralo también en tu proyecto:

```bash
uv add "orionis[pgsql]"
```

El código de salida es `0` en éxito, cancelación voluntaria o selección vacía; `130` en interrupción; `1` en validación inválida, falta de `uv` o confirmación no interactiva ausente. Un fallo del instalador conserva su código positivo. El comando no comprueba acceso al servidor.

## SQLite

No necesita servidor separado ni extra adicional. El archivo se interpreta respecto al directorio de trabajo; ejecuta Reactor desde la raíz. El directorio padre debe existir. Activa claves foráneas si tu aplicación depende de ellas; el valor de la plantilla es `OFF`. En memoria la conexión usa checkout exclusivo para conservar una única base.

```dotenv
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
DB_FOREIGN_KEYS=ON
DB_BUSY_TIMEOUT=5000
DB_JOURNAL_MODE=WAL
DB_SYNCHRONOUS=NORMAL
```

## MySQL

El mismo extra se presenta para MySQL y MariaDB; el identificador sigue siendo `mysql`. Configura host/puerto o `DB_SOCKET`. Se aplica `SET NAMES` con charset/collation y el modo SQL estricto configurado en cada conexión. `DB_ENGINE` se valida pero no se aplica al crear tablas en esta implementación.

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=orionis
DB_USERNAME=app_user
DB_PASSWORD=replace-with-secret
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
DB_STRICT=true
```

## PostgreSQL

El identificador es `pgsql`, no `postgresql`. La ruta async pasa `charset` y `search_path` como ajustes de servidor y `sslmode` al conector; la ruta sync equivalente utiliza libpq. El valor predeterminado de TLS es `prefer`; elige conscientemente la política necesaria.

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=orionis
DB_USERNAME=app_user
DB_PASSWORD=replace-with-secret
DB_CHARSET=UTF8
DB_SEARCH_PATH=public
DB_SSLMODE=verify-full
```

## Oracle

Utiliza `oracledb` en su ruta async nativa. Selecciona servicio o SID; un DSN explícito tiene prioridad, seguido de TNS. Con DSN/TNS no se valida host/puerto/servicio como direccionamiento. `encoding`/`nencoding` son campos validados de compatibilidad y no se envían al conector.

```dotenv
DB_CONNECTION=oracle
DB_HOST=127.0.0.1
DB_PORT=1521
DB_USERNAME=app_user
DB_PASSWORD=replace-with-secret
DB_SERVICE_NAME=ORCL
```

## SQL Server

Además del extra Python, debe estar instalado el driver ODBC del sistema con el nombre configurado. La plantilla usa ODBC Driver 18. `DB_TRUST_SERVER_CERTIFICATE=true` acepta el certificado sin verificar su cadena: configura `false` y certificados adecuados cuando necesites validación. `charset` se valida pero no se transmite como parámetro ODBC.

```dotenv
DB_CONNECTION=sqlserver
DB_HOST=127.0.0.1
DB_PORT=1433
DB_DATABASE=orionis
DB_USERNAME=app_user
DB_PASSWORD=replace-with-secret
DB_ENCRYPT=yes
DB_TRUST_SERVER_CERTIFICATE=false
DB_ODBC_DRIVER="ODBC Driver 18 for SQL Server"
```

## Amazon Redshift

Conector oficial AWS mediante engine Core y worker dedicado por checkout. Su configuración incluye TLS, IAM y Serverless. No soporta savepoints, locks de fila SELECT, DML RETURNING ni índices tradicionales. Las restricciones PK/unique/FK son informativas. Consulta [limitaciones de dialecto](/es/database/dialects-and-production#amazon-redshift).

```dotenv
DB_CONNECTION=redshift
DB_HOST=warehouse.example.test
DB_PORT=5439
DB_DATABASE=dev
DB_USERNAME=app_user
DB_PASSWORD=replace-with-secret
DB_REDSHIFT_SSL=true
DB_REDSHIFT_SSLMODE=verify-full
DB_REDSHIFT_TIMEOUT=30
```

## Verificar el entorno

### InstallCommand

El comando está implementado por `InstallCommand` en `orionis.console.commands.support.install`. Sus metadatos son `signature="packages"`, `timestamps=False`, `arguments: ClassVar[list[Argument]]` con las opciones anteriores y `description="Install optional Orionis features and development tools."`. `__init__(self) -> None` prepara argumentos y consola; `async handle(self, app: IApplication) -> int` ejecuta selección e instalación y devuelve los códigos descritos. En uso normal invoca Reactor; no construyas el comando para instalar dependencias desde peticiones HTTP.

Una construcción de `Connection` valida el identificador sin abrir sockets. La primera consulta comprueba realmente acceso al servidor. Si falta un paquete o dialecto opcional, `MissingDatabaseDependencyException` incluye la instalación necesaria. Un motor no registrado produce `UnsupportedDriverException`.

Las [opciones de configuración](/es/database/configuration) incluyen todos los tipos y valores; la [guía de conexiones](/es/database/connections) muestra una comprobación desde controlador e inyección.
