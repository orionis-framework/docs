---
title: "Drivers and dependencies"
description: "SQLite, MySQL, PostgreSQL, Oracle, SQL Server and Redshift: actual drivers, installation and configuration."
editUrl: true
lastUpdated: false
---

Orionis recognizes exactly six driver identifiers. Python extras install connectors, not a server or database. SQLite is included in core dependencies. Examples do not pin versions: the framework catalog determines installed requirements.

| Orionis driver | Query path | Extra packages |
|---|---|---|
| `sqlite` | `sqlite+aiosqlite` | Core `aiosqlite`; `sqlite3` for sync consumers. |
| `mysql` | `mysql+aiomysql` | `aiomysql` and `pymysql`. |
| `pgsql` | `postgresql+asyncpg` | `asyncpg` and `psycopg2-binary`. |
| `oracle` | `oracle+oracledb_async` | `oracledb`. |
| `sqlserver` | `mssql+aioodbc` | `aioodbc` and `pyodbc`. |
| `redshift` | `redshift+redshift_connector` | `redshift-connector` and `sqlalchemy-redshift`. |

Sync drivers serve consumers requiring a blocking engine, such as the persistent scheduler store. Redshift uses the official blocking connector through a reserved worker per checkout; it does not connect through `asyncpg`.

## Installing through Reactor

```bash
python -B reactor packages
orionis packages
```

The command loads `project.optional-dependencies` extras and `dependency-groups` groups from Orionis' manifest, preferring the bundled package manifest, then framework source and finally the application manifest. It displays the catalog, target interpreter and each option's purpose.

In an interactive terminal select names or numbers, separated by spaces or commas; `0` cancels. Duplicate selections and requirements are removed in order. It then asks for confirmation, defaulting to no.

### packages options

```text
packages [options ...] [--list] [--yes | -y]
```

| Argument or option | Default | Behavior |
|---|---|---|
| `options` | `[]` | Zero or more names, numbers or `extra:NAME`/`group:NAME` keys. Without selection prompts only in an interactive terminal. |
| `--list` | `False` | Lists without installing; exits before resolving selections. |
| `--yes`, `-y` | `False` | Confirms selected options automatically. |
| `-h`, `--help` | — | CLI help. |

Plain names work when unambiguous. If a name matches both an extra and a group, use its namespace. Numbers depend on the displayed catalog; use names in automation.

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

Each line is an alternative: install only needed backends; `extra:database` groups all optional connectors. Without an interactive terminal, installation requires explicit selection and `--yes`. `--yes` alone does not select everything.

The command runs `uv pip install --python <current interpreter> -- <requirements>`. It requires `uv` on `PATH` and targets the environment running Reactor. It does not use `uv add` or update project declarations/lockfiles itself. Declare the extra in your project as well when package-manager reproducibility is needed:

```bash
uv add "orionis[pgsql]"
```

Exit status is `0` for success, voluntary cancellation or empty selection; `130` for interruption; `1` for invalid configuration, missing `uv` or missing noninteractive confirmation. Installer failures retain positive exit codes. The command does not check server access.

## SQLite

Needs neither a separate server nor an extra. File paths are relative to the working directory; run Reactor from the project root. The parent directory must exist. Enable foreign keys when your application depends on them; the template defaults to `OFF`. In-memory connections use exclusive checkout to retain one database.

```dotenv
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
DB_FOREIGN_KEYS=ON
DB_BUSY_TIMEOUT=5000
DB_JOURNAL_MODE=WAL
DB_SYNCHRONOUS=NORMAL
```

## MySQL

The same extra is advertised for MySQL and MariaDB; the identifier remains `mysql`. Configure host/port or `DB_SOCKET`. Each connection applies `SET NAMES` with charset/collation and the configured strict SQL mode. `DB_ENGINE` is validated but not applied to table creation in this implementation.

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

The identifier is `pgsql`, not `postgresql`. Async connections pass `charset` and `search_path` as server settings and `sslmode` to the connector; the sync equivalent uses libpq. TLS defaults to `prefer`; choose the required policy deliberately.

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

Uses the native async `oracledb` path. Select service or SID; explicit DSN takes priority, followed by TNS. DSN/TNS bypass host/port/service addressing validation. `encoding`/`nencoding` are validated compatibility fields and are not passed to the connector.

```dotenv
DB_CONNECTION=oracle
DB_HOST=127.0.0.1
DB_PORT=1521
DB_USERNAME=app_user
DB_PASSWORD=replace-with-secret
DB_SERVICE_NAME=ORCL
```

## SQL Server

The system ODBC driver must be installed under the configured name in addition to the Python extra. The template uses ODBC Driver 18. `DB_TRUST_SERVER_CERTIFICATE=true` accepts certificates without validating the chain: set `false` with suitable certificates when validation is required. `charset` is validated but not forwarded as an ODBC parameter.

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

Official AWS connector through a Core engine and dedicated checkout worker. Settings include TLS, IAM and Serverless. No savepoints, SELECT row locks, DML RETURNING or traditional indexes. PK/unique/FK declarations are informational. See [dialect limitations](/en/database/dialects-and-production#amazon-redshift).

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

## Checking the environment

### InstallCommand

The implementation is `InstallCommand` in `orionis.console.commands.support.install`. Its metadata is `signature="packages"`, `timestamps=False`, `arguments: ClassVar[list[Argument]]` for the options above and `description="Install optional Orionis features and development tools."`. `__init__(self) -> None` prepares arguments and console; `async handle(self, app: IApplication) -> int` performs selection/installation and returns the documented statuses. Normal use goes through Reactor; do not construct this command to install dependencies from HTTP requests.

Constructing `Connection` validates the identifier without opening sockets. The first query actually checks server access. Missing optional packages or dialects raise `MissingDatabaseDependencyException` with installation guidance. Unregistered drivers raise `UnsupportedDriverException`.

[Configuration options](/en/database/configuration) lists every type and default; [connection management](/en/database/connections) shows controller-based checks and injection.
