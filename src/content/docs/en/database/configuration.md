---
title: "Database configuration"
description: "Complete BootstrapDatabase, connection, environment-variable, default-value and enum reference."
editUrl: true
lastUpdated: false
---

`config/database.py` defines `BootstrapDatabase` as a frozen keyword-only dataclass extending `Database`. It reads `Env.get(...)` and constructs validated entities; this page documents the actual template.

A declared field does not imply runtime automatically applies it. Retained but unconsumed settings are explicitly identified. Configuration does not open connections or verify the server contains the requested database.

## Database

| Property | Type | Environment | Default | Effect |
|---|---|---|---|---|
| `default` | `ConnectionName \| str` | `DB_CONNECTION` | `sqlite` | Default name normalized to lowercase; accepts only the six `ConnectionName` members. |
| `connections` | `Connections \| dict` | No single variable | `Connections(...)` with six backends | Constructs and validates each entity. A dictionary becomes `Connections(**connections)`. |

An invalid `default` type raises `TypeError`; an unsupported name raises `ValueError`. For names such as `reporting` use [provider registration](/en/database/connections#registering-a-second-connection), rather than `DB_CONNECTION=reporting` in this entity.

## Connections

Fields are `sqlite: SQLite | dict`, `mysql: MySQL | dict`, `pgsql: PGSQL | dict`, `oracle: Oracle | dict`, `sqlserver: SQLServer | dict` and `redshift: Redshift | dict`. Omitted fields create new backend entities. Dictionaries are converted to their corresponding entity; other types raise `TypeError`. Unknown fields are not constructor arguments.

The template constructs all six entities even when only one is used. `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` and `DB_PREFIX` are shared by entries reading them. `DB_CHARSET` applies only to the active MySQL, PostgreSQL or SQL Server driver; other entries retain their default charset. Configure entities explicitly for distinct connections.

## SQLite

| Property and type | Variable | Default | Usage and effect |
|---|---|---|---|
| `driver: str` | — | `'sqlite'` | Fixed backend discriminator; a value differing from the entity raises ValueError. |
| `url: str \| None` | `DB_URL` | `None` | Informational SQLite URL. None derives sqlite:/// + database. Runtime ignores it and builds its URL from database. |
| `database: str` | `DB_DATABASE` | `'database/database.sqlite'` | Server database name; file or :memory: for SQLite. Requires nonempty text. |
| `prefix: str` | `DB_PREFIX` | `''` | Prefix for logical table names when compiling plans/schemas; does not modify raw SQL. |
| `foreign_key_constraints: bool \| str \| SQLiteForeignKey` | `DB_FOREIGN_KEYS` | `'OFF'` | ON/OFF, bool or SQLiteForeignKey; installs PRAGMA foreign_keys on every connection. |
| `busy_timeout: int \| None` | `DB_BUSY_TIMEOUT` | `5000` | PRAGMA busy_timeout milliseconds. Accepts non-bool int or None; runtime applies only values greater than zero. |
| `journal_mode: str \| SQLiteJournalMode` | `DB_JOURNAL_MODE` | `'DELETE'` | Normalized journal mode applied through PRAGMA journal_mode. |
| `synchronous: str \| SQLiteSynchronous` | `DB_SYNCHRONOUS` | `'NORMAL'` | Normalized level applied through PRAGMA synchronous. |

## MySQL

| Property and type | Variable | Default | Usage and effect |
|---|---|---|---|
| `driver: str` | — | `'mysql'` | Fixed backend discriminator; a value differing from the entity raises ValueError. |
| `host: str` | `DB_HOST` | `'127.0.0.1'` | Server address; requires nonempty text, except Redshift's optional host. |
| `port: int` | `DB_PORT` | `3306` | Port from 1 to 65535. PGSQL/Redshift also accept an ASCII decimal string; other backends require int and reject bool. |
| `database: str` | `DB_DATABASE` | `'orionis'` | Server database name; file or :memory: for SQLite. Requires nonempty text. |
| `username: str` | `DB_USERNAME` | `'root'` | Connection username; nonempty when required. Redshift permits None for connector/IAM configuration. |
| `password: str` | `DB_PASSWORD` | `''` | Password; empty strings are allowed. Redshift also accepts None. Never expose in diagnostics. |
| `unix_socket: str \| None` | `DB_SOCKET` | `''` | Optional MySQL socket path; nonempty values are added to URL parameters. |
| `charset: str \| MySQLCharset` | `DB_CHARSET` | `'utf8mb4'` | Charset normalized through the backend enum. MySQL applies SET NAMES and URL settings; PGSQL forwards client_encoding. SQLServer validates/retains it without forwarding to the driver. |
| `collation: str \| MySQLCollation` | `DB_COLLATION` | `'utf8mb4_unicode_ci'` | MySQL collation accepted by MySQLCollation; applied with SET NAMES per connection. |
| `prefix: str \| None` | `DB_PREFIX` | `''` | Prefix for logical table names when compiling plans/schemas; does not modify raw SQL. |
| `prefix_indexes: bool` | `DB_PREFIX_INDEXES` | `True` | Validated retained boolean; current compiler/schema code does not read it when generating index names. |
| `strict: bool` | `DB_STRICT` | `True` | True applies ONLY_FULL_GROUP_BY, STRICT_TRANS_TABLES, NO_ZERO_IN_DATE, NO_ZERO_DATE, ERROR_FOR_DIVISION_BY_ZERO and NO_ENGINE_SUBSTITUTION. False applies only NO_ENGINE_SUBSTITUTION. |
| `engine: str \| MySQLEngine \| None` | `DB_ENGINE` | `'InnoDB'` | Validated against MySQLEngine or None. Retained field: runtime does not apply it as table ENGINE. |

## PGSQL

| Property and type | Variable | Default | Usage and effect |
|---|---|---|---|
| `driver: str` | — | `'pgsql'` | Fixed backend discriminator; a value differing from the entity raises ValueError. |
| `host: str` | `DB_HOST` | `'127.0.0.1'` | Server address; requires nonempty text, except Redshift's optional host. |
| `port: str \| int` | `DB_PORT` | `5432` | Port from 1 to 65535. PGSQL/Redshift also accept an ASCII decimal string; other backends require int and reject bool. |
| `database: str` | `DB_DATABASE` | `'orionis'` | Server database name; file or :memory: for SQLite. Requires nonempty text. |
| `username: str` | `DB_USERNAME` | `'postgres'` | Connection username; nonempty when required. Redshift permits None for connector/IAM configuration. |
| `password: str` | `DB_PASSWORD` | `''` | Password; empty strings are allowed. Redshift also accepts None. Never expose in diagnostics. |
| `charset: str \| PGSQLCharset` | `DB_CHARSET` | `'UTF8'` | Charset normalized through the backend enum. MySQL applies SET NAMES and URL settings; PGSQL forwards client_encoding. SQLServer validates/retains it without forwarding to the driver. |
| `prefix: str` | `DB_PREFIX` | `''` | Prefix for logical table names when compiling plans/schemas; does not modify raw SQL. |
| `prefix_indexes: bool` | `DB_PREFIX_INDEXES` | `True` | Validated retained boolean; current compiler/schema code does not read it when generating index names. |
| `search_path: str` | `DB_SEARCH_PATH` | `'public'` | Nonempty text sent to PGSQL; the sync path translates it to options=-csearch_path=... with escaped spaces. |
| `sslmode: str \| PGSQLSSLMode` | `DB_SSLMODE` | `'prefer'` | TLS policy normalized through the corresponding enum. PGSQL accepts its six modes; Redshift only verify-ca/verify-full. |

## Oracle

| Property and type | Variable | Default | Usage and effect |
|---|---|---|---|
| `driver: str` | — | `'oracle'` | Fixed backend discriminator; a value differing from the entity raises ValueError. |
| `username: str` | `DB_USERNAME` | `'sys'` | Connection username; nonempty when required. Redshift permits None for connector/IAM configuration. |
| `password: str` | `DB_PASSWORD` | `''` | Password; empty strings are allowed. Redshift also accepts None. Never expose in diagnostics. |
| `host: str` | `DB_HOST` | `'localhost'` | Server address; requires nonempty text, except Redshift's optional host. |
| `port: int` | `DB_PORT` | `1521` | Port from 1 to 65535. PGSQL/Redshift also accept an ASCII decimal string; other backends require int and reject bool. |
| `service_name: str \| None` | `DB_SERVICE_NAME` | `'ORCL'` | Oracle service when SID/DSN/TNS is unused; supplying SID omits service_name from the URL. |
| `sid: str \| None` | `DB_SID` | `None` | Optional Oracle SID, used as URL database component instead of service_name. |
| `dsn: str \| None` | `DB_DSN` | `None` | Explicit DSN; takes precedence over TNS and host/port/service/SID addressing. |
| `tns_name: str \| None` | `DB_TNS` | `None` | TNS alias used as connect_args.dsn when explicit DSN is absent. The connector must resolve it. |
| `encoding: str \| OracleEncoding` | `DB_ENCODING` | `'AL32UTF8'` | Oracle compatibility field validated against OracleEncoding; not passed to the current connector. |
| `nencoding: str \| OracleNencoding` | `DB_NENCODING` | `'AL16UTF16'` | Oracle compatibility field validated against OracleNencoding; not passed to the current connector. |

Without DSN/TNS requires nonempty host, valid port and at least a service or SID. DSN/TNS bypass that addressing validation. Current encoding/nencoding choices appear in the enum catalog.

## SQLServer

| Property and type | Variable | Default | Usage and effect |
|---|---|---|---|
| `driver: str` | — | `'sqlserver'` | Fixed backend discriminator; a value differing from the entity raises ValueError. |
| `host: str` | `DB_HOST` | `'127.0.0.1'` | Server address; requires nonempty text, except Redshift's optional host. |
| `port: int` | `DB_PORT` | `1433` | Port from 1 to 65535. PGSQL/Redshift also accept an ASCII decimal string; other backends require int and reject bool. |
| `database: str` | `DB_DATABASE` | `'orionis'` | Server database name; file or :memory: for SQLite. Requires nonempty text. |
| `username: str` | `DB_USERNAME` | `'sa'` | Connection username; nonempty when required. Redshift permits None for connector/IAM configuration. |
| `password: str` | `DB_PASSWORD` | `''` | Password; empty strings are allowed. Redshift also accepts None. Never expose in diagnostics. |
| `charset: SQLServerCharset \| str` | `DB_CHARSET` | `'UTF-8'` | Charset normalized through the backend enum. MySQL applies SET NAMES and URL settings; PGSQL forwards client_encoding. SQLServer validates/retains it without forwarding to the driver. |
| `prefix: str` | `DB_PREFIX` | `''` | Prefix for logical table names when compiling plans/schemas; does not modify raw SQL. |
| `prefix_indexes: bool` | `DB_PREFIX_INDEXES` | `True` | Validated retained boolean; current compiler/schema code does not read it when generating index names. |
| `encrypt: bool \| str` | `DB_ENCRYPT` | `'yes'` | bool or yes/no/true/false/on/off/1/0; normalizes to Encrypt=yes/no in the ODBC URL. |
| `trust_server_certificate: bool` | `DB_TRUST_SERVER_CERTIFICATE` | `True` | Boolean configuring TrustServerCertificate; True skips certificate-chain validation. |
| `odbc_driver: str` | `DB_ODBC_DRIVER` | `'ODBC Driver 18 for SQL Server'` | Nonempty name of the system-installed ODBC driver; forwarded as URL driver. |

## Redshift

| Property and type | Variable | Default | Usage and effect |
|---|---|---|---|
| `driver: str` | — | `'redshift'` | Fixed backend discriminator; a value differing from the entity raises ValueError. |
| `host: str \| None` | `DB_HOST` | `'127.0.0.1'` | Server address; requires nonempty text, except Redshift's optional host. |
| `port: str \| int` | `DB_PORT` | `5439` | Port from 1 to 65535. PGSQL/Redshift also accept an ASCII decimal string; other backends require int and reject bool. |
| `database: str` | `DB_DATABASE` | `'dev'` | Server database name; file or :memory: for SQLite. Requires nonempty text. |
| `username: str \| None` | `DB_USERNAME` | `'awsuser'` | Connection username; nonempty when required. Redshift permits None for connector/IAM configuration. |
| `password: str \| None` | `DB_PASSWORD` | `''` | Password; empty strings are allowed. Redshift also accepts None. Never expose in diagnostics. |
| `prefix: str` | `DB_PREFIX` | `''` | Prefix for logical table names when compiling plans/schemas; does not modify raw SQL. |
| `ssl: bool` | `DB_REDSHIFT_SSL` | `True` | Boolean enabling TLS in redshift-connector. |
| `sslmode: str \| RedshiftSSLMode` | `DB_REDSHIFT_SSLMODE` | `'verify-full'` | TLS policy normalized through the corresponding enum. PGSQL accepts its six modes; Redshift only verify-ca/verify-full. |
| `timeout: int \| None` | `DB_REDSHIFT_TIMEOUT` | `30` | Redshift socket timeout in seconds: int >= 1 or None for no configured socket timeout. |
| `iam: bool` | `DB_REDSHIFT_IAM` | `False` | Boolean forwarded for IAM authentication; config itself does not fetch or store IAM credentials. |
| `region: str \| None` | `DB_REDSHIFT_REGION` | `None` | Optional AWS region passed to the connector; nonempty text or None. |
| `cluster_identifier: str \| None` | `DB_REDSHIFT_CLUSTER_IDENTIFIER` | `None` | Provisioned cluster identifier for IAM settings; nonempty text or None. |
| `db_user: str \| None` | `DB_REDSHIFT_DB_USER` | `None` | Database user for IAM; nonempty text or None. |
| `profile: str \| None` | `DB_REDSHIFT_PROFILE` | `None` | Optional AWS profile; omitted values leave credential resolution to the connector. |
| `is_serverless: bool` | `DB_REDSHIFT_IS_SERVERLESS` | `False` | Boolean forwarded to select Serverless configuration. |
| `serverless_work_group: str \| None` | `DB_REDSHIFT_SERVERLESS_WORK_GROUP` | `None` | Serverless workgroup name; nonempty text or None. |
| `serverless_acct_id: str \| None` | `DB_REDSHIFT_SERVERLESS_ACCT_ID` | `None` | Serverless AWS account ID; nonempty text or None. |

## Customizing the configuration file

Complete example defining two backends with independent credentials; other `Connections` entries retain default entities:

```python
from dataclasses import dataclass, field
from orionis.environment import Env
from orionis.foundation.config.database import (
    Connections, Database, PGSQL, SQLite,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapDatabase(Database):
    default: str = "pgsql"
    connections: Connections = field(
        default_factory=lambda: Connections(
            sqlite=SQLite(
                database="database/local.sqlite",
                foreign_key_constraints=True,
            ),
            pgsql=PGSQL(
                host=Env.get("PRIMARY_DB_HOST", "127.0.0.1"),
                port=5432,
                database="orionis",
                username=Env.get("PRIMARY_DB_USERNAME", "app_user"),
                password=Env.get("PRIMARY_DB_PASSWORD", ""),
                search_path="public",
                sslmode="verify-full",
            ),
        )
    )
```

The example's `PRIMARY_DB_*` variables are customizations of that file, not additional native environment variables. An application instance can also use `app.withConfigDatabase(default=..., connections=...)` with the same validatable structure.

Entities are frozen and accept keyword arguments. `toDict()` provides settings consumed by the manager and dialect helpers. Do not log the full dictionary: it contains passwords. Validation can raise `TypeError`/`ValueError` during startup; fixing types, names and enums differs from installing a driver or repairing connectivity.

## Complete enumeration catalog

Import these classes from `orionis.foundation.config.database`. Entities normalize supported options; arbitrary server-recognized strings are not necessarily accepted. Entries show `MEMBER = value`. `PGSQLCollation` is public, but `PGSQL` has no `collation` field.

`MySQLEngine`, `OracleEncoding`, `OracleNencoding` and `SQLServerCharset` imply no runtime effects beyond those stated for their properties.

### ConnectionName

`SQLITE = 'sqlite'`, `MYSQL = 'mysql'`, `PGSQL = 'pgsql'`, `ORACLE = 'oracle'`, `SQLSERVER = 'sqlserver'`, `REDSHIFT = 'redshift'`.

### MySQLCharset

`ASCII = 'ascii'`, `BIG5 = 'big5'`, `CP1250 = 'cp1250'`, `CP1251 = 'cp1251'`, `CP1256 = 'cp1256'`, `CP1257 = 'cp1257'`, `CP850 = 'cp850'`, `CP852 = 'cp852'`, `CP866 = 'cp866'`, `CP932 = 'cp932'`, `EUCKR = 'euckr'`, `GB18030 = 'gb18030'`, `GB2312 = 'gb2312'`, `GBK = 'gbk'`, `GREEK = 'greek'`, `HEBREW = 'hebrew'`, `KOI8R = 'koi8r'`, `KOI8U = 'koi8u'`, `LATIN1 = 'latin1'`, `LATIN2 = 'latin2'`, `LATIN5 = 'latin5'`, `LATIN7 = 'latin7'`, `MACROMAN = 'macroman'`, `SJIS = 'sjis'`, `TIS620 = 'tis620'`, `UJIS = 'ujis'`, `UTF8 = 'utf8'`, `UTF8MB3 = 'utf8mb3'`, `UTF8MB4 = 'utf8mb4'`.

### MySQLCollation

`UTF8_GENERAL_CI = 'utf8_general_ci'`, `UTF8_UNICODE_CI = 'utf8_unicode_ci'`, `UTF8_BIN = 'utf8_bin'`, `UTF8MB4_GENERAL_CI = 'utf8mb4_general_ci'`, `UTF8MB4_UNICODE_CI = 'utf8mb4_unicode_ci'`, `UTF8MB4_BIN = 'utf8mb4_bin'`, `LATIN1_SWEDISH_CI = 'latin1_swedish_ci'`, `LATIN1_GENERAL_CI = 'latin1_general_ci'`, `LATIN1_BIN = 'latin1_bin'`, `ASCII_GENERAL_CI = 'ascii_general_ci'`, `ASCII_BIN = 'ascii_bin'`, `GB18030_CHINESE_CI = 'gb18030_chinese_ci'`, `GB18030_BIN = 'gb18030_bin'`, `GB18030_UNICODE_520_CI = 'gb18030_unicode_520_ci'`.

### MySQLEngine

`INNODB = 'InnoDB'`.

### OracleEncoding

`AL32UTF8 = 'AL32UTF8'`.

### OracleNencoding

`AL16UTF16 = 'AL16UTF16'`, `UTF8 = 'UTF8'`.

### PGSQLCharset

`EUC_CN = 'EUC_CN'`, `EUC_JP = 'EUC_JP'`, `EUC_JIS_2004 = 'EUC_JIS_2004'`, `EUC_KR = 'EUC_KR'`, `EUC_TW = 'EUC_TW'`, `ISO_8859_5 = 'ISO_8859_5'`, `ISO_8859_6 = 'ISO_8859_6'`, `ISO_8859_7 = 'ISO_8859_7'`, `ISO_8859_8 = 'ISO_8859_8'`, `KOI8R = 'KOI8R'`, `KOI8U = 'KOI8U'`, `LATIN1 = 'LATIN1'`, `LATIN2 = 'LATIN2'`, `LATIN3 = 'LATIN3'`, `LATIN4 = 'LATIN4'`, `LATIN5 = 'LATIN5'`, `LATIN6 = 'LATIN6'`, `LATIN7 = 'LATIN7'`, `LATIN8 = 'LATIN8'`, `LATIN9 = 'LATIN9'`, `LATIN10 = 'LATIN10'`, `UTF8 = 'UTF8'`, `WIN866 = 'WIN866'`, `WIN874 = 'WIN874'`, `WIN1250 = 'WIN1250'`, `WIN1251 = 'WIN1251'`, `WIN1252 = 'WIN1252'`, `WIN1253 = 'WIN1253'`, `WIN1254 = 'WIN1254'`, `WIN1255 = 'WIN1255'`, `WIN1256 = 'WIN1256'`, `WIN1257 = 'WIN1257'`, `WIN1258 = 'WIN1258'`.

### PGSQLCollation

`C = 'C'`, `POSIX = 'POSIX'`.

### PGSQLSSLMode

`DISABLE = 'disable'`, `ALLOW = 'allow'`, `PREFER = 'prefer'`, `REQUIRE = 'require'`, `VERIFY_CA = 'verify-ca'`, `VERIFY_FULL = 'verify-full'`.

### RedshiftSSLMode

`VERIFY_CA = 'verify-ca'`, `VERIFY_FULL = 'verify-full'`.

### SQLiteForeignKey

`ON = 'ON'`, `OFF = 'OFF'`.

### SQLiteJournalMode

`DELETE = 'DELETE'`, `TRUNCATE = 'TRUNCATE'`, `PERSIST = 'PERSIST'`, `MEMORY = 'MEMORY'`, `WAL = 'WAL'`, `OFF = 'OFF'`.

### SQLiteSynchronous

`FULL = 'FULL'`, `NORMAL = 'NORMAL'`, `EXTRA = 'EXTRA'`, `OFF = 'OFF'`.

### SQLServerCharset

`UTF8 = 'UTF-8'`, `CP437 = 'CP437'`, `CP850 = 'CP850'`, `CP874 = 'CP874'`, `CP932 = 'CP932'`, `CP936 = 'CP936'`, `CP949 = 'CP949'`, `CP950 = 'CP950'`, `CP1250 = 'CP1250'`, `CP1251 = 'CP1251'`, `CP1252 = 'CP1252'`, `CP1253 = 'CP1253'`, `CP1254 = 'CP1254'`, `CP1255 = 'CP1255'`, `CP1256 = 'CP1256'`, `CP1257 = 'CP1257'`, `CP1258 = 'CP1258'`, `ISO_8859_1 = 'ISO-8859-1'`, `ISO_8859_2 = 'ISO-8859-2'`, `ISO_8859_3 = 'ISO-8859-3'`, `ISO_8859_4 = 'ISO-8859-4'`, `ISO_8859_5 = 'ISO-8859-5'`, `ISO_8859_6 = 'ISO-8859-6'`, `ISO_8859_7 = 'ISO-8859-7'`, `ISO_8859_8 = 'ISO-8859-8'`, `ISO_8859_9 = 'ISO-8859-9'`, `ISO_8859_13 = 'ISO-8859-13'`, `ISO_8859_15 = 'ISO-8859-15'`.

```python
from orionis.foundation.config.database import (
    MySQL, MySQLCharset, MySQLCollation, SQLite, SQLiteJournalMode,
)


mysql = MySQL(
    charset=MySQLCharset.UTF8MB4,
    collation=MySQLCollation.UTF8MB4_UNICODE_CI,
)
sqlite = SQLite(journal_mode=SQLiteJournalMode.WAL, foreign_key_constraints=True)
```

See [drivers](/en/database/drivers) for installation and `.env` examples, and [connections](/en/database/connections) for additional names. This template has no native `DB_POOL_*` variables, generic overriding URL or global isolation option.
