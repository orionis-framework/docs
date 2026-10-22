---
title: "Connection and compilation API"
description: "Contracts and complete Connection, InsertResult, SQLCompiler, dialect, adapter and error reference."
editUrl: true
lastUpdated: false
---

This reference covers lower-level components. Applications normally use [DB](/en/database/db-facade), the [builder](/en/database/query-builder) and [Schema](/en/database/schema). These APIs serve isolated tests, integrations and tools requiring explicit plans.

`IConnection`, `IConnectionManager` and `ITransaction` are abstract contracts for components described here and in [connection management](/en/database/connections). Do not instantiate them. They declare the same connection/control operations without owning physical connections or state.

## Connection

```text
Connection(name: str, config: dict[str, Any]) -> None
```

Import with `from orionis.database import Connection`. Copies settings, validates the driver and creates a compiler without opening resources. The name identifies errors and manager connections. Settings require `driver` and backend-specific options; use a validated entity for full configurations.

This controller runs every step against in-memory SQLite without modifying the application's connection. It declares explicit columns and uses native plans:

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

The following signatures retain `self` to show instance methods. Examples receiving `table` use `demo_table()` above. Import `IConnection` from `orionis.database.contracts.connection` and use the plan imports from the complete example.

All execution operations may raise `QueryException` for compilation, execution or cleanup failures; engine creation may raise `MissingDatabaseDependencyException`. Operations using another task's inherited transaction may raise `TransactionException`. Driver bindings do not undergo model attribute conversion.

### getName()

```text
def getName(self) -> str:
```

Returns the registered name as str, without I/O or connectivity checks.

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

Returns False for Redshift and True for the other five drivers. It is a backend capability, not inspection of a table's constraints.

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

Accepts SelectPlan or SQL str. Optional Mapping bindings apply only to SQL and are ignored for plans. Returns list[dict[str, Any]], empty without rows. Buffers results before release.

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

Requires an InsertPlan with one or more rows; returns InsertResult. A single row may expose its first primary-key value when supported; batches omit keys. PostgreSQL counts batch RETURNING rows; SQL Server adapts OUTPUT when rowcount is negative. Empty plans raise QueryException.

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

Requires UpdatePlan with nonempty values; returns driver int. Without wheres updates the whole table. Counts can include unchanged matches; there is no full-table-update guard.

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

Requires DeletePlan; returns driver int. Without wheres deletes the entire table. Dispatches no model events and performs no model soft delete.

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

Accepts SelectPlan, not raw SQL. Returns the first column of the first row or None; does not automatically count or limit the plan.

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

SQL str and optional Mapping bindings; returns rowcount as int (including -1). Does not return INSERT identities.

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

SQL str and optional Mapping bindings; discards results and returns True after successful execution and cleanup.

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

Requires TableDefinition and keyword-only if_not_exists=True. Applies the prefix. Creation checks existence; checkfirst retains an existing table. Returns True. Does not migrate an existing table to the new definition. SQLite uses BEGIN IMMEDIATE only for its own temporary transaction.

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

Logical str name, optional schema=None and keyword-only if_exists=True. Applies prefix and requests DROP protection; compatible syntax depends on backend support. Returns True on completion. Does not delete migration files.

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

No arguments. Begins a root transaction or savepoint in the current task. Returns None. Redshift rejects nesting; another task's inherited active state raises TransactionException.

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

No arguments; commits the innermost level and returns None. Releases the connection after the final level. No transaction or control failure raises TransactionException; release failures may raise QueryException.

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

No arguments; rolls back the innermost level and returns None. No active level raises TransactionException. Cannot undo completed commits.

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

No arguments and no I/O until entry; returns ITransaction for async with. The context commits or rolls back without suppressing exceptions. See Transactions.

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

Returns bool for the current task: True only for an owner with active levels. No I/O; not a server isolation check.

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

No arguments, async. Removes the cached engine and awaits dispose(); no engine is a no-op. Later use can recreate it. Dispose does not replace commit/rollback or safely terminate active concurrent work.

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

Frozen slotted dataclass. `last_insert_id` is the first generated key or `None`; `row_count` is the observed count. Does not contain every key in a batch or retain a cursor. The complete example reads both fields. Redshift does not return an omitted generated identity; supply a client-generated key when models need it immediately.

## SQLCompiler

```text
SQLCompiler(prefix: str = "", *, driver: str | None = None) -> None
```

Translates definitions/plans into executable SQLAlchemy objects without I/O. Maintains instance-local table metadata, applies prefixes and uses driver selection for types, identities and lock restrictions. It does not query server catalogs or require executing compiled statements.

These examples receive `table = demo_table()`. Reuse a compiler to share metadata caching; a new compiler starts without cached tables.

### compileSelect()

```text
def compileSelect(self, plan: SelectPlan) -> Select[Any] | CompoundSelect:
```

Returns Select[Any] or CompoundSelect from SelectPlan, including joins, subqueries, groups and unions. COUNT(*) over distinct/groups/unions uses a derived query. Invalid sources, columns, clauses or locks raise QueryException.

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

Static method. True only for multiple rows with equal keys, compatible shape and no ClauseElement values. False for one row or unsuitable shapes. Checks shape, not connectivity or backend parameter limits.

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

Requires a nonempty InsertPlan. parameterized=False attaches values to the statement object; True leaves values for execution bindings. Parameterized PostgreSQL adds RETURNING 1 to count actual batch rows. No execution or generated identity occurs during compilation.

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

Requires nonempty values or raises QueryException. Builds UPDATE with filters; absent filters affect the whole table. Returns Update.

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

Builds Delete with filters; without filters deletes the whole table. No soft delete or events. Invalid references raise QueryException.

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

Requires TableDefinition; if_not_exists=True requests existence protection. Returns Executable with types, PK/unique/FK and index metadata. Unknown types raise QueryException; optional dependencies can raise MissingDatabaseDependencyException. Final compatibility depends on the dialect.

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

Logical name, schema=None and if_exists=True; returns a DROP Executable with prefix applied. Does not delete persisted metadata or migration records.

```python
from orionis.database import SQLCompiler
from orionis.orm.query.expressions import DeletePlan, InsertPlan, SelectPlan, UpdatePlan, WhereClause
from orionis.orm.schema.table import TableDefinition


def compile_example(table: TableDefinition):
    compiler = SQLCompiler(driver="sqlite")
    return compiler.compileDropTable("items", if_exists=True)
```

## Dialect functions

Located in `orionis.database.dialect`. These serve integrations; normal connections apply them for you. `sync=False` selects the query path and `sync=True` selects its blocking connector equivalent.

### resolve_driver()

```text
def resolve_driver(config: dict[str, Any]) -> str:
```

Reads driver, strips whitespace and lowercases it; returns one of six backend strings or raises UnsupportedDriverException. Does not validate other fields.

```python
from orionis.database.dialect import resolve_driver


driver = resolve_driver({"driver": " SQLITE "})
assert driver == "sqlite"
```

### missing_dependency_error()

```text
def missing_dependency_error(driver: str, cause: ImportError | NoSuchModuleError, *, sync: bool=False) -> MissingDatabaseDependencyException:
```

Returns a MissingDatabaseDependencyException instance (does not raise it) with missing package and uv guidance. cause is ImportError/NoSuchModuleError; sync selects blocking-connector guidance.

```python
from orionis.database.dialect import missing_dependency_error


error = missing_dependency_error("pgsql", ImportError("asyncpg"))
assert "orionis[pgsql]" in str(error)
```

### build_engine_url()

```text
def build_engine_url(config: dict[str, Any], *, sync: bool=False) -> URL:
```

Returns sqlalchemy.URL for config. Uses SQLite database and ignores url; applies Oracle DSN/TNS/SID/service precedence and server parameters. Opens no sockets. Invalid drivers raise UnsupportedDriverException. URLs can contain credentials: do not publish them.

```python
from orionis.database.dialect import build_engine_url


url = build_engine_url({"driver": "sqlite", "database": ":memory:"})
assert url.drivername == "sqlite+aiosqlite"
```

### engine_options()

```text
def engine_options(config: dict[str, Any], *, sync: bool=False) -> dict[str, Any]:
```

Returns a dict with echo=False, future=True, hide_parameters=True and backend options: exclusive in-memory SQLite pool, PGSQL settings, Oracle DSN or Redshift connector settings. Does not forward arbitrary config keys as pool options.

```python
from orionis.database.dialect import engine_options


options = engine_options({"driver": "sqlite", "database": ":memory:"})
assert options["pool_size"] == 1
```

### configure_engine()

```text
def configure_engine(engine: AsyncEngine | ThreadedEngine, config: dict[str, Any]) -> None:
```

Returns None; installs session hooks on an existing engine. SQLite applies PRAGMAs and explicit BEGIN; MySQL configures charset/collation/SQL mode; native Oracle and aioodbc paths protect opening against cancellation. Does not create or return the engine.

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

## Blocking-connector adapters

These components implement the Redshift path without turning its connector into a native async driver. Each checkout reserves one worker thread; independent connections use separate workers. Opening, transactions, execution, fetching and cleanup are awaited without blocking the event loop. Cancellation drains work and cleanup.

They do not replace the `DB` business API. The final example uses the adapter with synchronous SQLite to demonstrate the mechanism without an AWS account.

### ThreadedEngine

`ThreadedEngine(engine: sqlalchemy.engine.Engine, name: str = "redshift")` retains `sync_engine` without opening connections. `connect()` opens a checkout with a worker; `begin()` is an async context yielding `ThreadedConnection` with commit/rollback and release; `dispose()` disposes idle connections on a temporary worker. SQLAlchemy failures are sanitized as `QueryException`.

```text
async def connect(self) -> ThreadedConnection:
async def begin(self) -> AsyncIterator[ThreadedConnection]:
async def dispose(self) -> None:
```

### ThreadedConnection

`ThreadedConnection(connection: sqlalchemy.engine.Connection, worker: ThreadedWorker)` retains an open connection and its worker. Async classmethod `open(cls, engine)` constructs both and collects late-opened resources after cancellation. `begin()` opens a root transaction; `execute(statement, parameters=None)` accepts a SQLAlchemy Executable with Mapping or sequence-of-mapping bindings and returns buffered results. `runSync(callback, *args, **kwargs)` passes the Core connection as callback's first argument. `invalidate()` discards the DBAPI handle; idempotent `close()` releases checkout and worker. No savepoints.

```text
async def open(cls, engine: Engine) -> Self:
async def begin(self) -> ThreadedTransaction:
async def execute(self, statement: Executable, parameters: Mapping[str, Any] | Sequence[Mapping[str, Any]] | None=None) -> ThreadedResult:
async def runSync[T](self, callback: Callable[..., T], *args: object, **kwargs: object) -> T:
async def close(self) -> None:
async def invalidate(self) -> None:
```

### ThreadedTransaction

`ThreadedTransaction(transaction: sqlalchemy.engine.Transaction, worker: ThreadedWorker)` retains transaction and worker. `await commit()` and `await rollback()` settle blocking control on that same thread and return `None`. No independent transaction or savepoint API.

```text
async def commit(self) -> None:
async def rollback(self) -> None:
```

### ThreadedResult

`ThreadedResult(result: CursorResult[Any])` buffers and closes the original cursor on the worker. Public attributes are `rowcount` and `inserted_primary_key`; the latter is a tuple for single-row inserts or `None`. `mappings()` exposes buffered rows and `scalar()` a first value or `None`. No new driver calls or live cursor are exposed.

```text
def mappings(self) -> Iterable[Mapping[str, Any]]:
def scalar(self) -> object:
```

### ThreadedWorker

`ThreadedWorker()` prepares a lazy single-thread executor. `run(operation, *, on_cancel=None)` awaits a no-argument callable, returns its value and copies context. Optional cleanup receives a late result on the same worker after caller cancellation. `close()` waits for work/shutdown, returns `None` and is idempotent; `run()` after closure raises `RuntimeError`.

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

Subclass of the official dialect, loaded when `sqlalchemy-redshift` is installed; the symbol is `None` without that package. Connection URL construction registers it for Redshift.

Own flags are `insert_returning=False`, `update_returning=False`, `delete_returning=False`, `preexecute_autoincrement_sequences=False`, `postfetch_lastrowid=False`, `supports_statement_cache=False` and `use_insertmanyvalues_wo_returning=True`. Generated IDENTITY keys are not promised.

`has_table(self, connection: sqlalchemy.engine.Connection, table_name: str, schema: str | None = None, **_kw: object) -> bool` queries `svv_tables` by current database, explicit/current schema and exact name. Schema/name are bound values and SQLAlchemy reflection caching applies. It does not interpolate identifiers or enumerate the entire catalog.

## ConnectionManagerProvider

`register(self) -> None` registers `IConnectionManager → ConnectionManager` as a singleton. `async boot(self) -> None` resolves it and calls `ConnectionResolver.setManager(manager)` so builders/models use the same service. Database settings alone do not pin `DB`: the ORM provider registers `IQueryBuilder` and pins the facade.

Controllers do not call these methods; normal application boot does. Install a resolver deliberately for isolated builder tools, avoiding global replacement inside concurrent requests.

## SchemaProvider

`SchemaProvider` (`orionis.database.schema_provider`) implements `register(self) -> None`, registering `ISchema → Schema` with **transient** lifetime. Each resolution gets a new instance because `Schema` retains explicit connection selection. This lifetime prevents one schema consumer's selection from leaking to another. Registration neither runs migrations nor creates tables.

## QueryBuilderProvider

`QueryBuilderProvider` (`orionis.orm.provider`) implements `register(self) -> None`, registering singleton `IQueryBuilder → QueryBuilder`, and `async boot(self) -> None`, awaiting `DB.pin()` to bind the gateway to the facade. Shared gateway selection is safe because `connection()` returns another gateway and `table()` a fresh builder; this does not make mutable builders safe to share between tasks. Normal application boot runs these methods: do not invoke them per request.

## Exceptions

All derive from `DatabaseException(Exception)` and can be imported from `orionis.database`.

| Class | Trigger | Useful action |
|---|---|---|
| `ConnectionNotFoundException` | Unregistered name. | Check selection and provider registration. |
| `UnsupportedDriverException` | Missing/unknown driver. | Use one of the six actual identifiers. |
| `MissingDatabaseDependencyException` | Optional package/dialect missing. | Install the indicated extra in the same environment. |
| `QueryException` | Invalid plan, failed SQL or engine cleanup. | Check query/schema and context; never expose values. |
| `TransactionException` | No level, wrong task, unsupported nesting or control failure. | Correct task/levels; verify outcomes before retrying. |
| `MigrationNotFoundException` | Recorded migration has no matching file. | Restore the file and review migration history. |

Sanitized SQL errors retain the connection name and SQLAlchemy exception class, omitting SQL, bindings and driver messages. Configuration entities can also raise `TypeError` or `ValueError` before database access. Cancellation retains `asyncio.CancelledError` and does not prove server-side commit rollback.
