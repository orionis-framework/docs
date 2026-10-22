---
title: "API de conexiones y compilación"
description: "Contratos y referencia completa de Connection, InsertResult, SQLCompiler, dialectos, adaptadores y errores."
editUrl: true
lastUpdated: false
---

Esta referencia cubre componentes de nivel inferior. En la aplicación utiliza normalmente [DB](/es/database/db-facade), [builder](/es/database/query-builder) y [Schema](/es/database/schema). Estas APIs permiten pruebas aisladas, integraciones y herramientas que necesitan planes explícitos.

`IConnection`, `IConnectionManager` e `ITransaction` son contratos abstractos de los componentes descritos aquí y en [gestión de conexiones](/es/database/connections). No se instancian directamente. Los contratos exponen las mismas operaciones de conexión/control, sin una conexión física ni estado propio.

## Connection

```text
Connection(name: str, config: dict[str, Any]) -> None
```

Importable con `from orionis.database import Connection`. Copia la configuración, valida el driver y crea un compilador, pero no abre recursos. El nombre identifica errores y conexiones del gestor. La configuración exige `driver` y los ajustes del backend; usa una entidad validada para configuraciones completas.

Este controlador ejecuta todos los pasos contra SQLite en memoria, sin modificar la conexión de la aplicación. El ejemplo declara columnas explícitas y usa planes nativos:

```python
from orionis.database import Connection
from orionis.http import JSONResponse
from orionis.orm.query.expressions import (
    DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause,
)
from orionis.orm.schema.table import TableDefinition
from orionis.orm.schema.types import Integer, String


def demo_table() -> TableDefinition:
    columns = {"id": Integer().primary().autoIncrement(), "name": String(100)}
    for name, column in columns.items():
        column.name = name
    return TableDefinition(name="items", columns=columns, primary_key="id")


class ConnectionExampleController:
    async def index(self) -> JSONResponse:
        connection = Connection("demo", {"driver": "sqlite", "database": ":memory:"})
        table = demo_table()
        try:
            await connection.createTable(table)
            async with connection.transaction():
                inserted = await connection.insert(
                    InsertPlan(table=table, values=[{"name": "first"}])
                )
                condition = [WhereClause(column="id", value=inserted.last_insert_id)]
                changed = await connection.update(
                    UpdatePlan(table=table, values={"name": "updated"}, wheres=condition)
                )
                value = await connection.scalar(
                    SelectPlan(table=table, columns=("name",), wheres=condition)
                )
            rows = await connection.select(SelectPlan(table=table))
            deleted = await connection.delete(DeletePlan(table=table, wheres=condition))
            await connection.dropTable("items")
            return JSONResponse({
                "connection": connection.getName(),
                "unique_constraints": connection.supportsUniqueConstraints(),
                "active_transaction": connection.inTransaction(),
                "inserted_id": inserted.last_insert_id,
                "inserted_count": inserted.row_count,
                "changed": changed,
                "value": value,
                "rows": rows,
                "deleted": deleted,
            })
        finally:
            await connection.disconnect()
```

Las siguientes firmas usan `self` para mostrar su carácter de instancia. Los ejemplos que reciben `table` utilizan `demo_table()` de arriba. Importa `IConnection` desde `orionis.database.contracts.connection` y los tipos de plan mostrados en el ejemplo completo.

Todas las operaciones de ejecución pueden producir `QueryException` por compilación, ejecución o limpieza; crear el engine puede producir `MissingDatabaseDependencyException`. Las operaciones dentro de una transacción heredada por otra tarea pueden producir `TransactionException`. Los valores de bindings pertenecen al driver: no se convierten como atributos de modelos.

### getName()

```text
def getName(self) -> str:
```

Devuelve el nombre registrado como str, sin E/S ni validación de conectividad.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def name(connection: IConnection) -> str:
    return connection.getName()
```

### supportsUniqueConstraints()

```text
def supportsUniqueConstraints(self) -> bool:
```

Devuelve False para Redshift y True para los otros cinco drivers. Es una capacidad del backend, no una inspección de restricciones de una tabla.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def supports_unique(connection: IConnection) -> bool:
    return connection.supportsUniqueConstraints()
```

### select()

```text
async def select(self, query: SelectPlan | str, bindings: Mapping[str, Any] | None=None) -> list[dict[str, Any]]:
```

Acepta SelectPlan o SQL str. bindings es un Mapping opcional sólo para SQL; se ignora con planes. Devuelve list[dict[str, Any]], vacía sin filas. Consume resultados antes de liberar la conexión.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def read(connection: IConnection):
    return await connection.select("SELECT :value AS value", {"value": 7})
```

### insert()

```text
async def insert(self, plan: InsertPlan) -> InsertResult:
```

Requiere InsertPlan con una o varias filas y devuelve InsertResult. Una fila puede devolver la primera clave primaria si el driver la proporciona; lotes no devuelven clave. PostgreSQL cuenta RETURNING del lote; SQL Server adapta OUTPUT cuando rowcount es negativo. Plan sin filas produce QueryException.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def insert_one(connection: IConnection, table: TableDefinition):
    return await connection.insert(InsertPlan(table=table, values=[{"name": "one"}]))
```

### update()

```text
async def update(self, plan: UpdatePlan) -> int:
```

Requiere UpdatePlan con values no vacío; devuelve int del driver. Sin wheres actualiza toda la tabla. El recuento puede incluir coincidencias sin cambios; no es un guard contra updates masivos.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def update_one(connection: IConnection, table: TableDefinition):
    return await connection.update(UpdatePlan(
        table=table, values={"name": "new"}, wheres=[WhereClause(column="id", value=1)]
    ))
```

### delete()

```text
async def delete(self, plan: DeletePlan) -> int:
```

Requiere DeletePlan y devuelve int del driver. Sin wheres elimina toda la tabla. No dispara eventos ni realiza soft delete de modelos.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def delete_one(connection: IConnection, table: TableDefinition):
    return await connection.delete(DeletePlan(
        table=table, wheres=[WhereClause(column="id", value=1)]
    ))
```

### scalar()

```text
async def scalar(self, plan: SelectPlan) -> Any:
```

Acepta SelectPlan, no SQL crudo. Devuelve primera columna de primera fila o None; no transforma automáticamente en count ni limita el plan.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def first_name(connection: IConnection, table: TableDefinition):
    return await connection.scalar(SelectPlan(table=table, columns=("name",)))
```

### execute()

```text
async def execute(self, sql: str, bindings: Mapping[str, Any] | None=None) -> int:
```

SQL str y bindings Mapping opcional; devuelve rowcount como int (incluido -1). No devuelve identidad de INSERT.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def write(connection: IConnection):
    return await connection.execute(
        "INSERT INTO items (name) VALUES (:name)", {"name": "raw"}
    )
```

### statement()

```text
async def statement(self, sql: str, bindings: Mapping[str, Any] | None=None) -> bool:
```

SQL str y bindings Mapping opcional; descarta resultados y devuelve True después de ejecución y limpieza correctas.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def maintenance(connection: IConnection):
    return await connection.statement("CREATE TABLE IF NOT EXISTS audit_log (message TEXT)")
```

### createTable()

```text
async def createTable(self, table: TableDefinition, *, if_not_exists: bool=True) -> bool:
```

Requiere TableDefinition y acepta if_not_exists=True sólo por palabra clave. Aplica prefijo. Comprueba existencia al crear; si ya existe y checkfirst está activo la conserva. Devuelve True. No convierte una tabla existente a la definición nueva. SQLite usa BEGIN IMMEDIATE sólo en su transacción temporal propia.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def create(connection: IConnection, table: TableDefinition):
    return await connection.createTable(table, if_not_exists=True)
```

### dropTable()

```text
async def dropTable(self, name: str, schema: str | None=None, *, if_exists: bool=True) -> bool:
```

Nombre lógico str, schema=None opcional e if_exists=True por palabra clave. Aplica prefijo y genera DROP con protección solicitada; la sintaxis compatible depende del motor. Devuelve True al terminar. No elimina archivos de migración.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def drop(connection: IConnection):
    return await connection.dropTable("items", if_exists=True)
```

### begin()

```text
async def begin(self) -> None:
```

Sin argumentos. Abre transacción raíz o savepoint en la tarea actual. Devuelve None. Redshift rechaza anidamiento; estado activo heredado por otra tarea produce TransactionException.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def begin_preview(connection: IConnection):
    await connection.begin()
    try:
        assert connection.inTransaction()
    finally:
        await connection.rollback()
```

### commit()

```text
async def commit(self) -> None:
```

Sin argumentos; confirma el nivel interno y devuelve None. Libera la conexión al terminar el último nivel. Sin transacción activa o ante error de control produce TransactionException; fallo al liberar puede producir QueryException.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def commit_work(connection: IConnection):
    await connection.begin()
    await connection.commit()
```

### rollback()

```text
async def rollback(self) -> None:
```

Sin argumentos; revierte nivel interno y devuelve None. Sin nivel activo produce TransactionException. No revierte commits terminados.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def discard_work(connection: IConnection):
    await connection.begin()
    await connection.rollback()
```

### transaction()

```text
def transaction(self) -> ITransaction:
```

Sin argumentos, sin E/S hasta entrar; devuelve ITransaction para async with. El contexto confirma o revierte y no suprime excepciones. Se explica en Transacciones.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def atomic_work(connection: IConnection):
    async with connection.transaction():
        await connection.select("SELECT 1 AS ready")
```

### inTransaction()

```text
def inTransaction(self) -> bool:
```

Devuelve bool para la tarea actual: True sólo si es propietaria y quedan niveles activos. No tiene E/S ni es un chequeo de aislamiento del servidor.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def transaction_status(connection: IConnection) -> bool:
    return connection.inTransaction()
```

### disconnect()

```text
async def disconnect(self) -> None:
```

Sin argumentos, async. Descarta el engine cacheado y espera dispose(); sin engine es no-op. Un uso posterior puede reconstruirlo. Dispose no sustituye commit/rollback ni cierra de forma segura trabajo concurrente activo.

```python
from orionis.database.contracts.connection import IConnection
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


async def close_owned_connection(connection: IConnection):
    await connection.disconnect()
```

## InsertResult

```text
InsertResult(last_insert_id: Any, row_count: int)
```

Dataclass congelada con slots. `last_insert_id` es la primera clave generada o `None`; `row_count` es el recuento observado. No contiene todas las claves de un lote ni conserva cursor. El ejemplo completo obtiene ambos campos. Una identidad omitida en Redshift no se devuelve; proporciona una clave desde el cliente si tu modelo necesita conocerla inmediatamente.

## SQLCompiler

```text
SQLCompiler(prefix: str = "", *, driver: str | None = None) -> None
```

Traduce definiciones/planes a objetos ejecutables SQLAlchemy, sin hacer E/S. Mantiene metadatos y tablas por instancia, aplica prefijos y utiliza el driver para tipos, identidades y restricciones de lock. No es una consulta contra el catálogo del servidor ni requiere ejecutar cada sentencia compilada.

Estos ejemplos reciben `table = demo_table()`. Utiliza el mismo compilador para que comparta su caché de metadatos; un constructor nuevo empieza sin tablas cacheadas.

### compileSelect()

```text
def compileSelect(self, plan: SelectPlan) -> Select[Any] | CompoundSelect:
```

Devuelve Select[Any] o CompoundSelect a partir de SelectPlan, incluidos joins, subconsultas, agrupaciones y uniones. COUNT(*) sobre distinct/grupos/uniones utiliza una consulta derivada. Fuentes, columnas, cláusulas o locks no válidos producen QueryException.

```python
from orionis.database import SQLCompiler
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def compile_example(table: TableDefinition):
    compiler = SQLCompiler(driver="sqlite")
    return compiler.compileSelect(SelectPlan(table=table, columns=("name",)))
```

### supportsBatchInsert()

```text
def supportsBatchInsert(plan: InsertPlan) -> bool:
```

Método estático. True sólo para varias filas con las mismas claves, formas compatibles y sin valores ClauseElement. False para una sola fila o formas no aptas. Es una comprobación de forma, no de conectividad ni de límites de parámetros del servidor.

```python
from orionis.database import SQLCompiler
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def compile_example(table: TableDefinition):
    compiler = SQLCompiler(driver="sqlite")
    return SQLCompiler.supportsBatchInsert(InsertPlan(
            table=table, values=[{"name": "one"}, {"name": "two"}]
        ))
```

### compileInsert()

```text
def compileInsert(self, plan: InsertPlan, *, parameterized: bool=False) -> Insert:
```

Requiere InsertPlan no vacío. parameterized=False incorpora valores al objeto de sentencia; True deja valores para bindings de ejecución. PostgreSQL parametrizado añade RETURNING 1 para contar filas reales de lotes. No hay ejecución ni identidad hasta ejecutar.

```python
from orionis.database import SQLCompiler
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def compile_example(table: TableDefinition):
    compiler = SQLCompiler(driver="sqlite")
    return compiler.compileInsert(InsertPlan(table=table, values=[{"name": "one"}]))
```

### compileUpdate()

```text
def compileUpdate(self, plan: UpdatePlan) -> Update:
```

Requiere values no vacío o produce QueryException. Construye UPDATE con condiciones; sin condiciones modifica toda la tabla. Devuelve Update.

```python
from orionis.database import SQLCompiler
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def compile_example(table: TableDefinition):
    compiler = SQLCompiler(driver="sqlite")
    return compiler.compileUpdate(UpdatePlan(
            table=table, values={"name": "new"}, wheres=[WhereClause(column="id", value=1)]
        ))
```

### compileDelete()

```text
def compileDelete(self, plan: DeletePlan) -> Delete:
```

Construye Delete con condiciones; sin condiciones elimina toda la tabla. No hace soft delete ni eventos. Referencias inválidas producen QueryException.

```python
from orionis.database import SQLCompiler
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def compile_example(table: TableDefinition):
    compiler = SQLCompiler(driver="sqlite")
    return compiler.compileDelete(DeletePlan(
            table=table, wheres=[WhereClause(column="id", value=1)]
        ))
```

### compileCreateTable()

```text
def compileCreateTable(self, definition: TableDefinition, *, if_not_exists: bool=True) -> Executable:
```

Requiere TableDefinition; if_not_exists=True solicita protección de existencia. Devuelve Executable con definición de tipos, PK/unique/FK e índices. Los tipos desconocidos producen QueryException y dependencias opcionales pueden producir MissingDatabaseDependencyException. La compatibilidad final depende del dialecto.

```python
from orionis.database import SQLCompiler
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def compile_example(table: TableDefinition):
    compiler = SQLCompiler(driver="sqlite")
    return compiler.compileCreateTable(table, if_not_exists=True)
```

### compileDropTable()

```text
def compileDropTable(self, name: str, schema: str | None=None, *, if_exists: bool=True) -> Executable:
```

Nombre lógico, schema=None e if_exists=True; devuelve Executable para DROP aplicando prefijo. No elimina metadatos persistidos ni registros de migraciones.

```python
from orionis.database import SQLCompiler
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def compile_example(table: TableDefinition):
    compiler = SQLCompiler(driver="sqlite")
    return compiler.compileDropTable("items", if_exists=True)
```

## Funciones de dialecto

Se encuentran en `orionis.database.dialect`. Se documentan para integraciones; la conexión las aplica normalmente por ti. `sync=False` selecciona la ruta de consultas y `sync=True` su conector bloqueante correspondiente.

### resolve_driver()

```text
def resolve_driver(config: dict[str, Any]) -> str:
```

Lee driver, recorta espacios y normaliza minúsculas; devuelve str de uno de los seis motores o lanza UnsupportedDriverException. No valida el resto de campos.

```python
from orionis.database.dialect import resolve_driver


driver = resolve_driver({"driver": " SQLITE "})
assert driver == "sqlite"
```

### missing_dependency_error()

```text
def missing_dependency_error(driver: str, cause: ImportError | NoSuchModuleError, *, sync: bool=False) -> MissingDatabaseDependencyException:
```

Devuelve una instancia de MissingDatabaseDependencyException (no la lanza) con paquete faltante e instrucción uv. cause es ImportError/NoSuchModuleError; sync selecciona el hint del conector bloqueante.

```python
from orionis.database.dialect import missing_dependency_error


error = missing_dependency_error("pgsql", ImportError("asyncpg"))
assert "orionis[pgsql]" in str(error)
```

### build_engine_url()

```text
def build_engine_url(config: dict[str, Any], *, sync: bool=False) -> URL:
```

Devuelve sqlalchemy.URL para config. Usa database en SQLite e ignora url; aplica prioridades DSN/TNS/SID/servicio de Oracle y parámetros de servidor. No abre sockets. Driver inválido produce UnsupportedDriverException. URL puede contener credenciales: no la publiques.

```python
from orionis.database.dialect import build_engine_url


url = build_engine_url({"driver": "sqlite", "database": ":memory:"})
assert url.drivername == "sqlite+aiosqlite"
```

### engine_options()

```text
def engine_options(config: dict[str, Any], *, sync: bool=False) -> dict[str, Any]:
```

Devuelve dict con echo=False, future=True, hide_parameters=True y opciones de backend: pool exclusivo para SQLite en memoria, ajustes PGSQL, DSN Oracle o configuración Redshift. No toma cualquier clave arbitraria del config como opción de pool.

```python
from orionis.database.dialect import engine_options


options = engine_options({"driver": "sqlite", "database": ":memory:"})
assert options["pool_size"] == 1
```

### configure_engine()

```text
def configure_engine(engine: AsyncEngine | ThreadedEngine, config: dict[str, Any]) -> None:
```

Devuelve None; instala hooks de sesión sobre el engine construido. SQLite aplica PRAGMA y BEGIN explícito; MySQL configura charset/collation/modo SQL; las rutas nativas de Oracle y aioodbc protegen apertura frente a cancelación. No construye ni devuelve el engine.

```python
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from orionis.database.dialect import build_engine_url, configure_engine, engine_options


async def native_engine_check() -> int:
    settings = {
        "driver": "sqlite", "database": ":memory:",
        "foreign_key_constraints": True, "busy_timeout": 5000,
    }
    engine = create_async_engine(build_engine_url(settings), **engine_options(settings))
    configure_engine(engine, settings)
    try:
        async with engine.begin() as connection:
            result = await connection.execute(text("SELECT 1"))
            return result.scalar_one()
    finally:
        await engine.dispose()
```

## Adaptadores para el conector bloqueante

Estos componentes implementan la ruta Redshift, sin convertir su conector en un driver async nativo. Cada checkout reserva un worker de un thread; conexiones independientes tienen workers distintos. Conexión, transacciones, ejecución, lectura y cierre se esperan sin bloquear el event loop. Una cancelación espera el trabajo y su limpieza.

No sustituyen el API de negocio de `DB`. El ejemplo final usa el mismo adaptador con SQLite síncrono para demostrar el mecanismo sin una cuenta AWS.

### ThreadedEngine

`ThreadedEngine(engine: sqlalchemy.engine.Engine, name: str = "redshift")` conserva `sync_engine` sin abrir conexiones. `connect()` abre un checkout con worker; `begin()` es un contexto async que entrega `ThreadedConnection`, confirma/revierte y libera; `dispose()` cierra conexiones inactivas en worker temporal. Los fallos SQLAlchemy se sanitizan como `QueryException`.

```text
async def connect(self) -> ThreadedConnection:
async def begin(self) -> AsyncIterator[ThreadedConnection]:
async def dispose(self) -> None:
```

### ThreadedConnection

`ThreadedConnection(connection: sqlalchemy.engine.Connection, worker: ThreadedWorker)` conserva una conexión abierta y su worker. `open(cls, engine)` es async de clase, construye ambos y recoge aperturas que terminan después de cancelar. `begin()` abre transacción raíz; `execute(statement, parameters=None)` acepta Executable SQLAlchemy y Mapping o secuencia de mappings, devolviendo resultados ya materializados. `runSync(callback, *args, **kwargs)` invoca el callback con la conexión Core como primer argumento. `invalidate()` descarta el handle del driver; `close()` libera checkout y worker, y es idempotente. No ofrece savepoints.

```text
async def open(cls, engine: Engine) -> Self:
async def begin(self) -> ThreadedTransaction:
async def execute(self, statement: Executable, parameters: Mapping[str, Any] | Sequence[Mapping[str, Any]] | None=None) -> ThreadedResult:
async def runSync[T](self, callback: Callable[..., T], *args: object, **kwargs: object) -> T:
async def close(self) -> None:
async def invalidate(self) -> None:
```

### ThreadedTransaction

`ThreadedTransaction(transaction: sqlalchemy.engine.Transaction, worker: ThreadedWorker)` retiene transacción y worker. `await commit()` y `await rollback()` completan el control bloqueante en el mismo thread; devuelven `None`. No implementa transacción independiente ni API de savepoints.

```text
async def commit(self) -> None:
async def rollback(self) -> None:
```

### ThreadedResult

`ThreadedResult(result: CursorResult[Any])` materializa y cierra el cursor original en el worker. Sus atributos públicos son `rowcount` e `inserted_primary_key`; este último es una tupla para insert de una fila o `None`. `mappings()` expone filas ya en memoria y `scalar()` primera columna o `None`. No realiza nuevas llamadas al driver ni expone cursor en vivo.

```text
def mappings(self) -> Iterable[Mapping[str, Any]]:
def scalar(self) -> object:
```

### ThreadedWorker

`ThreadedWorker()` crea un executor perezoso de un thread. `run(operation, *, on_cancel=None)` espera una función sin argumentos y devuelve su valor; copia contexto. El callback opcional de limpieza recibe el resultado tardío en el mismo worker cuando se canceló al llamador. `close()` espera trabajos y shutdown, devuelve `None` y es idempotente; `run()` después de cerrar produce `RuntimeError`.

```text
async def run[T](self, operation: Callable[[], T], *, on_cancel: Callable[[T], None] | None=None) -> T:
async def close(self) -> None:
```

```python
from sqlalchemy import create_engine, text
from orionis.database.dialect import build_engine_url, engine_options
from orionis.database.threaded.engine import ThreadedEngine
from orionis.database.threaded.worker import ThreadedWorker


async def threaded_example() -> dict[str, object]:
    settings = {"driver": "sqlite", "database": ":memory:"}
    engine = ThreadedEngine(
        create_engine(build_engine_url(settings, sync=True),
                      **engine_options(settings, sync=True)),
        name="demo",
    )
    try:
        async with engine.begin() as connection:
            scalar = (await connection.execute(text("SELECT 7"))).scalar()
            rows = list((await connection.execute(text("SELECT 8 AS value"))).mappings())
            dialect = await connection.runSync(lambda raw: raw.dialect.name)
        connection = await engine.connect()
        try:
            transaction = await connection.begin()
            await transaction.rollback()
            await connection.invalidate()
        finally:
            await connection.close()
        return {"scalar": scalar, "rows": [dict(row) for row in rows], "dialect": dialect}
    finally:
        await engine.dispose()


async def worker_example() -> int:
    worker = ThreadedWorker()
    try:
        return await worker.run(lambda: sum(range(10)))
    finally:
        await worker.close()
```

## RedshiftDialect

Subclase del dialecto oficial cargada cuando está instalado `sqlalchemy-redshift`; sin ese paquete el símbolo vale `None`. La conexión la registra al construir la URL Redshift.

Sus flags propios son `insert_returning=False`, `update_returning=False`, `delete_returning=False`, `preexecute_autoincrement_sequences=False`, `postfetch_lastrowid=False`, `supports_statement_cache=False` y `use_insertmanyvalues_wo_returning=True`. No promete recuperar claves de IDENTITY.

`has_table(self, connection: sqlalchemy.engine.Connection, table_name: str, schema: str | None = None, **_kw: object) -> bool` consulta `svv_tables` por base actual, esquema explícito/actual y nombre exacto. Enlaza esquema/nombre como valores y usa la caché de reflexión SQLAlchemy. No escapa identificadores por interpolación ni enumera todo el catálogo.

## ConnectionManagerProvider

`register(self) -> None` registra `IConnectionManager → ConnectionManager` como singleton. `async boot(self) -> None` resuelve el gestor y llama `ConnectionResolver.setManager(manager)` para que los builders/modelos lleguen al mismo servicio. La configuración por sí sola no pinnea `DB`: el provider ORM registra `IQueryBuilder` y vincula la fachada.

No necesitas invocar estos métodos desde un controlador. El arranque normal los ejecuta. Para herramientas aisladas con builders instala deliberadamente un resolver, evitando reemplazarlo globalmente dentro de peticiones concurrentes.

## SchemaProvider

`SchemaProvider` (`orionis.database.schema_provider`) implementa `register(self) -> None`: registra `ISchema → Schema` con duración **transient**. Cada resolución obtiene una instancia nueva porque `Schema` conserva la selección de conexión explícita. Esa duración evita que una selección del esquema se filtre a otros consumidores. El provider no ejecuta migraciones ni crea tablas al registrarse.

## QueryBuilderProvider

`QueryBuilderProvider` (`orionis.orm.provider`) implementa `register(self) -> None`, que registra `IQueryBuilder → QueryBuilder` como singleton, y `async boot(self) -> None`, que espera `DB.pin()` para vincular el gateway a la fachada. El gateway compartido es seguro respecto a selección porque `connection()` devuelve otro gateway y `table()` un builder nuevo; no compartas por ello un builder mutable entre tareas. El arranque normal ejecuta estos métodos: no los invoques por petición.

## Excepciones

Todas derivan de `DatabaseException(Exception)` y son importables desde `orionis.database`.

| Clase | Cuándo aparece | Acción útil |
|---|---|---|
| `ConnectionNotFoundException` | Nombre no registrado. | Revisa selección y registro del provider. |
| `UnsupportedDriverException` | Driver ausente/no reconocido. | Usa uno de los seis identificadores reales. |
| `MissingDatabaseDependencyException` | Paquete o dialecto opcional no instalado. | Instala el extra indicado en el mismo entorno. |
| `QueryException` | Plan inválido, SQL fallido o limpieza del engine. | Revisa consulta/esquema y contexto; no expongas valores. |
| `TransactionException` | Control sin nivel, tarea ajena, anidamiento no soportado o fallo de control. | Corrige tarea/niveles; verifica resultado antes de reintentar. |
| `MigrationNotFoundException` | Migración registrada sin archivo correspondiente. | Restaura archivo y revisa el historial de migraciones. |

El saneamiento de errores SQL conserva nombre de conexión y clase del error SQLAlchemy; elimina SQL, bindings y mensaje del driver. Las entidades de configuración además pueden producir `TypeError` o `ValueError` antes de tocar la base. Cancelación conserva `asyncio.CancelledError` y no significa que el servidor haya revertido el commit.
