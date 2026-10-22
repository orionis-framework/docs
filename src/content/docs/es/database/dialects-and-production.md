---
title: "Dialectos y producción"
description: "Compatibilidad real entre motores, Redshift, restricciones operativas y diagnóstico de Database."
editUrl: true
lastUpdated: false
---

Una API común no convierte todos los motores en equivalentes. Verifica tipos, DDL, identidades, locks y errores en una base de pruebas del motor de destino. SQLite valida numerosos ejemplos funcionales, pero no demuestra semántica de PostgreSQL, MySQL, Oracle, SQL Server o Redshift.

## Configuración efectiva

El runtime aplica PRAGMA SQLite, charset/collation/modo SQL MySQL, ajustes de sesión/TLS PGSQL, direccionamiento Oracle, TLS ODBC y opciones del conector Redshift. El [catálogo de configuración](/es/database/configuration) diferencia campos aplicados de campos conservados sin consumo.

En particular, `SQLite.url` no sobrescribe `database`; `MySQL.engine` y `prefix_indexes` no se aplican a creación de tablas/índices; Oracle no envía `encoding`/`nencoding` al conector y SQL Server no usa `charset` como parámetro ODBC. No supongas que cambiar esos campos altera el servidor.

Las conexiones no reciben indiscriminadamente todas las claves de configuración como opciones SQLAlchemy. No hay variables nativas `DB_POOL_*` ni ajustes generales de aislamiento/reintento en la plantilla.

## Amazon Redshift

Utiliza `redshift-connector` y `sqlalchemy-redshift` mediante un engine Core y un worker reservado por checkout. No es PostgreSQL a través de `asyncpg`. Cada conexión física conserva su thread durante una transacción; las independientes pueden usar workers distintos. Las filas se materializan en ese worker antes de devolver resultados a Python.

| Capacidad | Comportamiento real |
|---|---|
| Savepoints | No soportados; anidamiento produce `TransactionException`. |
| Locks de fila SELECT | `lockForUpdate()` y `sharedLock()` producen `QueryException`, incluso en planes anidados/agregados. |
| DML `RETURNING` | Desactivado; no se devuelve identidad omitida. |
| `IDENTITY(1,1)` | Puede compilarse desde autoincremento; si el modelo necesita su clave inmediata, proporciona una desde el cliente. |
| Índices tradicionales | No soportados; no los declares como si fueran PostgreSQL. |
| PK/unique/FK | Declaraciones informativas, sin enforcement de unicidad/referencia. |
| `supportsUniqueConstraints()` | `False`. |

Cache database, sesiones database, cola database, seeders registrados y almacén database del scheduler rechazan Redshift porque requieren unicidad impuesta y/o índices. Esto no impide sus consultas analíticas ni modelos compatibles.

### IAM y Serverless

```dotenv
DB_CONNECTION=redshift
DB_HOST=warehouse.example.test
DB_PORT=5439
DB_DATABASE=dev
DB_REDSHIFT_SSL=true
DB_REDSHIFT_SSLMODE=verify-full
DB_REDSHIFT_TIMEOUT=30
DB_REDSHIFT_IAM=true
DB_REDSHIFT_REGION=us-east-1
DB_REDSHIFT_CLUSTER_IDENTIFIER=example-cluster
DB_REDSHIFT_DB_USER=app_user
```

El conector recibe `iam`, `region`, `cluster_identifier`, `db_user` y `profile` opcional. Sin perfil explícito utiliza su resolución de credenciales. Serverless añade `is_serverless`, `serverless_work_group` y `serverless_acct_id`. Estos campos se validan y transmiten; Orionis no crea recursos AWS ni obtiene permisos de cuenta por ti.

TLS predetermina `ssl=True` y `sslmode=verify-full`; también admite `verify-ca`. `timeout=None` permite no fijar límite de socket. La [tabla de configuración](/es/database/configuration#redshift) documenta variables, tipos y defaults.

## Identidades y lotes

Un insert de una fila puede informar su primera clave primaria según el driver. Un lote no garantiza claves. PostgreSQL parametrizado utiliza `RETURNING 1` para contar filas reales, incluidas filas omitidas por un trigger; SQL Server utiliza filas OUTPUT cuando el driver devuelve recuento negativo. Oracle preserva el recuento antes de cerrar resultados de lotes.

No confundas el entero de `DB.execute("INSERT...")` con el `InsertResult` que devuelve `DB.table(...).insert(...)` o `Connection.insert(plan)`. Obtén la identidad disponible desde `result.last_insert_id`; no existe `insertGetId()` en esta API. No infieras éxito de cada entrada sólo por la longitud enviada.

## Recursos, cancelación y diagnóstico

Los engines son perezosos. Las operaciones temporales liberan su checkout después de materializar resultados y completar control transaccional; una transacción explícita lo retiene hasta cerrar su último nivel. No desconectes servicios compartidos en mitad de peticiones.

La [cancelación](/es/database/transactions#aislamiento-y-cancelación) espera trabajo sensible y limpieza; no promete detener SQL instantáneamente. Un commit puede completarse aunque el consumidor sea cancelado. Reintenta sólo cuando conozcas el resultado o tengas idempotencia.

Todas las lecturas materializan datos completos: filtra, selecciona columnas, pagina y divide lotes. No presupongas cursores en streaming. Para observar producción registra operación de negocio, nombre de conexión, latencia y recuento sin credenciales ni bindings. Los errores SQL se sanitizan y no hay reintentos automáticos generales.

`db:show`, `db:table` y `db:wipe` disponen de introspección de catálogos, incluido Redshift. Sus métricas Redshift utilizan bloques asignados de 1 MB; tablas vacías/permisos limitados pueden dejar tamaño desconocido. Las restricciones mostradas son declaraciones, no prueba de enforcement.
