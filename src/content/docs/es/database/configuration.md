---
title: "Configuración de bases de datos"
description: "Referencia completa de BootstrapDatabase, conexiones, variables de entorno, valores predeterminados y enums."
editUrl: true
lastUpdated: false
---

`config/database.py` define `BootstrapDatabase` como dataclass congelada con argumentos de palabra clave, heredada de `Database`. El archivo lee `Env.get(...)` y construye entidades validadas; las opciones de esta página corresponden a esa plantilla real.

Un campo existente no implica que el runtime aplique automáticamente todas sus opciones. Se indican expresamente los campos conservados pero no consumidos. La configuración no abre conexiones ni valida que el servidor contenga la base solicitada.

## Database

| Propiedad | Tipo | Entorno | Predeterminado | Efecto |
|---|---|---|---|---|
| `default` | `ConnectionName \| str` | `DB_CONNECTION` | `sqlite` | Nombre predeterminado normalizado a minúsculas; sólo acepta los seis miembros de `ConnectionName`. |
| `connections` | `Connections \| dict` | Sin variable única | `Connections(...)` con seis motores | Construye y valida cada entidad. Un diccionario se convierte con `Connections(**connections)`. |

Un `default` de tipo incorrecto produce `TypeError` y un nombre no admitido `ValueError`. Para nombres adicionales como `reporting` utiliza [registro mediante provider](/es/database/connections#registrar-una-segunda-conexión), no `DB_CONNECTION=reporting` en esta entidad.

## Connections

Los campos son `sqlite: SQLite | dict`, `mysql: MySQL | dict`, `pgsql: PGSQL | dict`, `oracle: Oracle | dict`, `sqlserver: SQLServer | dict` y `redshift: Redshift | dict`. Cada uno usa una entidad nueva del motor si se omite. Un diccionario se convierte a la entidad correspondiente y un tipo distinto produce `TypeError`. Campos desconocidos no forman parte del constructor.

La plantilla construye las seis entidades, incluso cuando sólo utilizas una. `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` y `DB_PREFIX` se comparten entre las entradas que los leen. `DB_CHARSET` se aplica sólo al driver activo entre MySQL, PostgreSQL y SQL Server; las otras entradas conservan su charset predeterminado. Para conexiones distintas configura cada entidad explícitamente.

## SQLite

| Propiedad y tipo | Variable | Predeterminado | Uso y efecto |
|---|---|---|---|
| `driver: str` | — | `'sqlite'` | Discriminador fijo del motor; un valor distinto al de la entidad produce ValueError. |
| `url: str \| None` | `DB_URL` | `None` | URL informativa SQLite. Si None se deriva como sqlite:/// + database. El runtime la ignora y construye su URL desde database. |
| `database: str` | `DB_DATABASE` | `'database/database.sqlite'` | Nombre de base en servidores; archivo o :memory: en SQLite. Debe ser texto no vacío. |
| `prefix: str` | `DB_PREFIX` | `''` | Prefijo de nombres lógicos de tablas al compilar planes/esquemas; no modifica SQL crudo. |
| `foreign_key_constraints: bool \| str \| SQLiteForeignKey` | `DB_FOREIGN_KEYS` | `'OFF'` | ON/OFF, bool o SQLiteForeignKey; instala PRAGMA foreign_keys en cada conexión. |
| `busy_timeout: int \| None` | `DB_BUSY_TIMEOUT` | `5000` | Milisegundos de PRAGMA busy_timeout. Acepta int no bool o None; el runtime sólo aplica valores mayores que cero. |
| `journal_mode: str \| SQLiteJournalMode` | `DB_JOURNAL_MODE` | `'DELETE'` | Modo de journal normalizado y aplicado mediante PRAGMA journal_mode. |
| `synchronous: str \| SQLiteSynchronous` | `DB_SYNCHRONOUS` | `'NORMAL'` | Nivel normalizado aplicado mediante PRAGMA synchronous. |

## MySQL

| Propiedad y tipo | Variable | Predeterminado | Uso y efecto |
|---|---|---|---|
| `driver: str` | — | `'mysql'` | Discriminador fijo del motor; un valor distinto al de la entidad produce ValueError. |
| `host: str` | `DB_HOST` | `'127.0.0.1'` | Dirección del servidor; se exige texto no vacío, salvo host opcional de Redshift. |
| `port: int` | `DB_PORT` | `3306` | Puerto entre 1 y 65535. PGSQL/Redshift también aceptan cadena decimal ASCII; otros motores exigen int y rechazan bool. |
| `database: str` | `DB_DATABASE` | `'orionis'` | Nombre de base en servidores; archivo o :memory: en SQLite. Debe ser texto no vacío. |
| `username: str` | `DB_USERNAME` | `'root'` | Usuario de conexión; no vacío cuando es str requerido. Redshift permite None para configuración del conector/IAM. |
| `password: str` | `DB_PASSWORD` | `''` | Contraseña; se permite cadena vacía. Redshift permite también None. No la expongas en diagnósticos. |
| `unix_socket: str \| None` | `DB_SOCKET` | `''` | Ruta de socket MySQL opcional; si no está vacía se añade a parámetros de URL. |
| `charset: str \| MySQLCharset` | `DB_CHARSET` | `'utf8mb4'` | Charset normalizado mediante enum del motor. MySQL aplica SET NAMES y URL; PGSQL lo pasa como client_encoding. SQLServer lo valida/conserva pero no lo envía al driver. |
| `collation: str \| MySQLCollation` | `DB_COLLATION` | `'utf8mb4_unicode_ci'` | Collation MySQL admitida por MySQLCollation; se aplica junto a SET NAMES por conexión. |
| `prefix: str \| None` | `DB_PREFIX` | `''` | Prefijo de nombres lógicos de tablas al compilar planes/esquemas; no modifica SQL crudo. |
| `prefix_indexes: bool` | `DB_PREFIX_INDEXES` | `True` | Booleano validado y conservado; el compilador/esquemas actual no lo consulta al generar nombres de índices. |
| `strict: bool` | `DB_STRICT` | `True` | True aplica ONLY_FULL_GROUP_BY, STRICT_TRANS_TABLES, NO_ZERO_IN_DATE, NO_ZERO_DATE, ERROR_FOR_DIVISION_BY_ZERO y NO_ENGINE_SUBSTITUTION. False aplica sólo NO_ENGINE_SUBSTITUTION. |
| `engine: str \| MySQLEngine \| None` | `DB_ENGINE` | `'InnoDB'` | Se valida contra MySQLEngine o None. Campo conservado: el runtime no lo aplica como ENGINE al crear tablas. |

## PGSQL

| Propiedad y tipo | Variable | Predeterminado | Uso y efecto |
|---|---|---|---|
| `driver: str` | — | `'pgsql'` | Discriminador fijo del motor; un valor distinto al de la entidad produce ValueError. |
| `host: str` | `DB_HOST` | `'127.0.0.1'` | Dirección del servidor; se exige texto no vacío, salvo host opcional de Redshift. |
| `port: str \| int` | `DB_PORT` | `5432` | Puerto entre 1 y 65535. PGSQL/Redshift también aceptan cadena decimal ASCII; otros motores exigen int y rechazan bool. |
| `database: str` | `DB_DATABASE` | `'orionis'` | Nombre de base en servidores; archivo o :memory: en SQLite. Debe ser texto no vacío. |
| `username: str` | `DB_USERNAME` | `'postgres'` | Usuario de conexión; no vacío cuando es str requerido. Redshift permite None para configuración del conector/IAM. |
| `password: str` | `DB_PASSWORD` | `''` | Contraseña; se permite cadena vacía. Redshift permite también None. No la expongas en diagnósticos. |
| `charset: str \| PGSQLCharset` | `DB_CHARSET` | `'UTF8'` | Charset normalizado mediante enum del motor. MySQL aplica SET NAMES y URL; PGSQL lo pasa como client_encoding. SQLServer lo valida/conserva pero no lo envía al driver. |
| `prefix: str` | `DB_PREFIX` | `''` | Prefijo de nombres lógicos de tablas al compilar planes/esquemas; no modifica SQL crudo. |
| `prefix_indexes: bool` | `DB_PREFIX_INDEXES` | `True` | Booleano validado y conservado; el compilador/esquemas actual no lo consulta al generar nombres de índices. |
| `search_path: str` | `DB_SEARCH_PATH` | `'public'` | Texto no vacío enviado al servidor PGSQL; la ruta sync lo traduce a options=-csearch_path=... conservando espacios escapados. |
| `sslmode: str \| PGSQLSSLMode` | `DB_SSLMODE` | `'prefer'` | Política TLS normalizada del enum correspondiente. PGSQL admite sus seis modos; Redshift sólo verify-ca/verify-full. |

## Oracle

| Propiedad y tipo | Variable | Predeterminado | Uso y efecto |
|---|---|---|---|
| `driver: str` | — | `'oracle'` | Discriminador fijo del motor; un valor distinto al de la entidad produce ValueError. |
| `username: str` | `DB_USERNAME` | `'sys'` | Usuario de conexión; no vacío cuando es str requerido. Redshift permite None para configuración del conector/IAM. |
| `password: str` | `DB_PASSWORD` | `''` | Contraseña; se permite cadena vacía. Redshift permite también None. No la expongas en diagnósticos. |
| `host: str` | `DB_HOST` | `'localhost'` | Dirección del servidor; se exige texto no vacío, salvo host opcional de Redshift. |
| `port: int` | `DB_PORT` | `1521` | Puerto entre 1 y 65535. PGSQL/Redshift también aceptan cadena decimal ASCII; otros motores exigen int y rechazan bool. |
| `service_name: str \| None` | `DB_SERVICE_NAME` | `'ORCL'` | Servicio Oracle cuando no se usa SID/DSN/TNS; si se proporciona SID, se omite service_name en la URL. |
| `sid: str \| None` | `DB_SID` | `None` | SID Oracle opcional, usado como componente database de la URL en vez de service_name. |
| `dsn: str \| None` | `DB_DSN` | `None` | DSN explícito; prioridad sobre TNS y direccionamiento host/puerto/servicio/SID. |
| `tns_name: str \| None` | `DB_TNS` | `None` | Alias TNS utilizado como connect_args.dsn si no existe DSN explícito. El conector debe resolver el alias. |
| `encoding: str \| OracleEncoding` | `DB_ENCODING` | `'AL32UTF8'` | Campo Oracle de compatibilidad validado contra OracleEncoding; no se pasa al conector actual. |
| `nencoding: str \| OracleNencoding` | `DB_NENCODING` | `'AL16UTF16'` | Campo Oracle de compatibilidad validado contra OracleNencoding; no se pasa al conector actual. |

Sin DSN/TNS exige host no vacío, puerto válido y al menos servicio o SID. Con DSN/TNS omite esa validación de direccionamiento. Los únicos valores de encoding/nencoding actuales figuran en el catálogo de enums.

## SQLServer

| Propiedad y tipo | Variable | Predeterminado | Uso y efecto |
|---|---|---|---|
| `driver: str` | — | `'sqlserver'` | Discriminador fijo del motor; un valor distinto al de la entidad produce ValueError. |
| `host: str` | `DB_HOST` | `'127.0.0.1'` | Dirección del servidor; se exige texto no vacío, salvo host opcional de Redshift. |
| `port: int` | `DB_PORT` | `1433` | Puerto entre 1 y 65535. PGSQL/Redshift también aceptan cadena decimal ASCII; otros motores exigen int y rechazan bool. |
| `database: str` | `DB_DATABASE` | `'orionis'` | Nombre de base en servidores; archivo o :memory: en SQLite. Debe ser texto no vacío. |
| `username: str` | `DB_USERNAME` | `'sa'` | Usuario de conexión; no vacío cuando es str requerido. Redshift permite None para configuración del conector/IAM. |
| `password: str` | `DB_PASSWORD` | `''` | Contraseña; se permite cadena vacía. Redshift permite también None. No la expongas en diagnósticos. |
| `charset: SQLServerCharset \| str` | `DB_CHARSET` | `'UTF-8'` | Charset normalizado mediante enum del motor. MySQL aplica SET NAMES y URL; PGSQL lo pasa como client_encoding. SQLServer lo valida/conserva pero no lo envía al driver. |
| `prefix: str` | `DB_PREFIX` | `''` | Prefijo de nombres lógicos de tablas al compilar planes/esquemas; no modifica SQL crudo. |
| `prefix_indexes: bool` | `DB_PREFIX_INDEXES` | `True` | Booleano validado y conservado; el compilador/esquemas actual no lo consulta al generar nombres de índices. |
| `encrypt: bool \| str` | `DB_ENCRYPT` | `'yes'` | bool o yes/no/true/false/on/off/1/0; normaliza Encrypt=yes/no en la URL ODBC. |
| `trust_server_certificate: bool` | `DB_TRUST_SERVER_CERTIFICATE` | `True` | Booleano que configura TrustServerCertificate; True omite verificación de la cadena del certificado. |
| `odbc_driver: str` | `DB_ODBC_DRIVER` | `'ODBC Driver 18 for SQL Server'` | Nombre no vacío del driver ODBC instalado en el sistema; se transmite como driver en la URL. |

## Redshift

| Propiedad y tipo | Variable | Predeterminado | Uso y efecto |
|---|---|---|---|
| `driver: str` | — | `'redshift'` | Discriminador fijo del motor; un valor distinto al de la entidad produce ValueError. |
| `host: str \| None` | `DB_HOST` | `'127.0.0.1'` | Dirección del servidor; se exige texto no vacío, salvo host opcional de Redshift. |
| `port: str \| int` | `DB_PORT` | `5439` | Puerto entre 1 y 65535. PGSQL/Redshift también aceptan cadena decimal ASCII; otros motores exigen int y rechazan bool. |
| `database: str` | `DB_DATABASE` | `'dev'` | Nombre de base en servidores; archivo o :memory: en SQLite. Debe ser texto no vacío. |
| `username: str \| None` | `DB_USERNAME` | `'awsuser'` | Usuario de conexión; no vacío cuando es str requerido. Redshift permite None para configuración del conector/IAM. |
| `password: str \| None` | `DB_PASSWORD` | `''` | Contraseña; se permite cadena vacía. Redshift permite también None. No la expongas en diagnósticos. |
| `prefix: str` | `DB_PREFIX` | `''` | Prefijo de nombres lógicos de tablas al compilar planes/esquemas; no modifica SQL crudo. |
| `ssl: bool` | `DB_REDSHIFT_SSL` | `True` | Booleano que activa TLS en redshift-connector. |
| `sslmode: str \| RedshiftSSLMode` | `DB_REDSHIFT_SSLMODE` | `'verify-full'` | Política TLS normalizada del enum correspondiente. PGSQL admite sus seis modos; Redshift sólo verify-ca/verify-full. |
| `timeout: int \| None` | `DB_REDSHIFT_TIMEOUT` | `30` | Timeout de socket Redshift en segundos: int >= 1 o None para no configurar límite de socket. |
| `iam: bool` | `DB_REDSHIFT_IAM` | `False` | Booleano enviado al conector para autenticación IAM; no obtiene ni guarda credenciales en config. |
| `region: str \| None` | `DB_REDSHIFT_REGION` | `None` | Región AWS opcional enviada al conector; texto no vacío o None. |
| `cluster_identifier: str \| None` | `DB_REDSHIFT_CLUSTER_IDENTIFIER` | `None` | Identificador de clúster provisionado para configuración IAM; texto no vacío o None. |
| `db_user: str \| None` | `DB_REDSHIFT_DB_USER` | `None` | Usuario de base de datos para IAM; texto no vacío o None. |
| `profile: str \| None` | `DB_REDSHIFT_PROFILE` | `None` | Perfil AWS opcional; si se omite el conector utiliza su resolución de credenciales. |
| `is_serverless: bool` | `DB_REDSHIFT_IS_SERVERLESS` | `False` | Booleano enviado al conector para seleccionar la configuración Serverless. |
| `serverless_work_group: str \| None` | `DB_REDSHIFT_SERVERLESS_WORK_GROUP` | `None` | Nombre del workgroup Serverless; texto no vacío o None. |
| `serverless_acct_id: str \| None` | `DB_REDSHIFT_SERVERLESS_ACCT_ID` | `None` | ID de cuenta AWS Serverless; texto no vacío o None. |

## Personalizar el archivo de configuración

Ejemplo completo para definir dos motores con credenciales independientes; las otras entradas de `Connections` conservan sus entidades predeterminadas:

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

Las variables `PRIMARY_DB_*` del ejemplo son una personalización de ese archivo, no variables nativas nuevas. Para configurar directamente una instancia de aplicación existe `app.withConfigDatabase(default=..., connections=...)`; utiliza la misma estructura validable.

Las entidades son congeladas y aceptan argumentos por nombre. `toDict()` proporciona la configuración que consumen el gestor y los dialectos. No la registres completa en logs: incluye contraseñas. La validación puede producir `TypeError`/`ValueError` durante el arranque; corregir tipos, nombres y enums es distinto de instalar un driver o reparar conectividad.

## Catálogo completo de enumeraciones

Puedes importar estas clases desde `orionis.foundation.config.database`. Las entidades normalizan las opciones admitidas; no aceptan cualquier texto sólo porque el servidor lo reconoce. Cada entrada muestra `MIEMBRO = valor`. `PGSQLCollation` es un catálogo público, pero `PGSQL` no tiene un campo `collation`.

`MySQLEngine`, `OracleEncoding`, `OracleNencoding` y `SQLServerCharset` no implican efecto runtime más allá de lo indicado en sus propiedades.

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

Consulta [drivers](/es/database/drivers) para instalación y ejemplos `.env`, y [conexiones](/es/database/connections) para registrar nombres adicionales. No hay variables nativas `DB_POOL_*`, URL genérica prioritaria ni opción de aislamiento global en esta plantilla.
