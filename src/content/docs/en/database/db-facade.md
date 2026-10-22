---
title: "DB facade"
description: "All eleven DB gateway methods: signatures, parameters, results, errors and examples."
editUrl: true
lastUpdated: false
---

`DB` resolves `orionis.orm.contracts.query_builder.IQueryBuilder`, implemented by `QueryBuilder`. It is a singleton gateway without query state: `connection()` returns another gateway and `table()` creates a fresh builder. It is not `ConnectionManager`.

This page documents all gateway methods. Methods chained after `table()` belong to the [query builder](/en/database/query-builder). Methods exclusive to `IConnection` are documented in [runtime](/en/database/runtime-api#connection).

```python
from orionis.support.facades import DB
```

## Connection and table selection

### connection()

```text
def connection(self, name: str | None = None) -> Self:
```

Returns another `QueryBuilder` for the selected name; `None` returns to default selection. Does not mutate the original, open a physical connection or yet check registration. Later resolution raises `ConnectionNotFoundException` for unknown names.

SQL and transaction precedence is: operation `name` argument → gateway name → active migration connection → manager default. Empty strings are treated as absent.

```python
async def reporting_notes():
    reporting = DB.connection("reporting")
    return await reporting.table("notes").orderBy("id").get()
```

### table()

```text
def table(self, name: str, *, alias: str | None = None,
          connection: str | None = None) -> IRawQueryBuilder:
```

`name` is the required logical table; compilation applies the configured prefix. `alias` is an SQL alias and `connection` overrides gateway selection for that builder. Without explicit selection, it captures the migration connection or default **at construction**, not execution.

Returns a fresh `RawQueryBuilder` without I/O. A missing table fails on execution; invalid identifiers/clauses may fail during construction or compilation. `get()` returns a `Collection` of dictionaries; `first()` returns a dictionary or `None`.

```python
async def recent_notes():
    return await (
        DB.table("notes", alias="n", connection="sqlite")
        .select("n.id", "n.body")
        .orderBy("n.id", "desc")
        .limit(10)
        .get()
    )
```

### getDefaultName()

```text
def getDefaultName(self) -> str:
```

Returns the manager's global default, even from a gateway selected with `connection("reporting")`; not necessarily that gateway's target.

```python
def default_name() -> str:
    return DB.getDefaultName()
```

### setDefaultName()

```text
def setDefaultName(self, name: str) -> None:
```

Changes the global default to a registered name or raises `ConnectionNotFoundException`. Returns no gateway and does not retarget existing builders. Use during setup: per-request changes affect concurrent consumers.

```python
def choose_default() -> None:
    DB.setDefaultName("sqlite")
    assert DB.getDefaultName() == "sqlite"
```

## Parameterized SQL

### select()

```text
async def select(self, sql: str, bindings: dict[str, object] | None = None,
                 name: str | None = None) -> list[dict[str, object]]:
```

Buffers every row as dictionaries keyed by column name/alias; no matches returns `[]`. Does not return cursors or models.

`sql` is required; `bindings=None` accepts a value dictionary and `name=None` selects a connection. These are async methods: SQL execution/compilation can raise `QueryException`; resolution/startup can raise `ConnectionNotFoundException`, `UnsupportedDriverException` or `MissingDatabaseDependencyException`. Raw SQL adds neither prefixes nor model casts. See [SQL and results](/en/database/raw-queries).

```python
async def find_by_body(body: str):
    return await DB.select(
        "SELECT id, body FROM notes WHERE body = :body", {"body": body}
    )
```

### execute()

```text
async def execute(self, sql: str, bindings: dict[str, object] | None = None,
                 name: str | None = None) -> int:
```

Returns driver `rowcount`, not a generated key. It may count matched rows rather than changed values; driver `-1` is preserved.

`sql` is required; `bindings=None` accepts a value dictionary and `name=None` selects a connection. These are async methods: SQL execution/compilation can raise `QueryException`; resolution/startup can raise `ConnectionNotFoundException`, `UnsupportedDriverException` or `MissingDatabaseDependencyException`. Raw SQL adds neither prefixes nor model casts. See [SQL and results](/en/database/raw-queries).

```python
async def rename_note(note_id: int, body: str) -> int:
    return await DB.execute(
        "UPDATE notes SET body = :body WHERE id = :id",
        {"body": body, "id": note_id},
    )
```

### statement()

```text
async def statement(self, sql: str, bindings: dict[str, object] | None = None,
                 name: str | None = None) -> bool:
```

Executes DDL or maintenance and discards its result. Returns `True` after execution and cleanup succeed; does not report affected rows.

`sql` is required; `bindings=None` accepts a value dictionary and `name=None` selects a connection. These are async methods: SQL execution/compilation can raise `QueryException`; resolution/startup can raise `ConnectionNotFoundException`, `UnsupportedDriverException` or `MissingDatabaseDependencyException`. Raw SQL adds neither prefixes nor model casts. See [SQL and results](/en/database/raw-queries).

```python
async def ensure_audit_table() -> bool:
    return await DB.statement(
        "CREATE TABLE IF NOT EXISTS audit_log (message TEXT NOT NULL)"
    )
```

## Transaction control

### transaction()

```text
def transaction(self, name: str | None = None) -> ITransaction:
```

Returns an unentered context. Entry starts a transaction/savepoint; exit commits on success and rolls back if an exception escapes. `as transaction` yields the context, not a connection. Exceptions are not suppressed.

`name=None` follows gateway selection; keep the same name throughout the unit. Control failures, unsupported nesting and cross-task use raise `TransactionException`. Internal SQL failures raise `QueryException`. Redshift does not support nesting.

```python
async def record_note(body: str) -> None:
    async with DB.transaction():
        await DB.execute("INSERT INTO notes (body) VALUES (:body)", {"body": body})
        await DB.execute(
            "INSERT INTO audit_log (message) VALUES (:message)",
            {"message": "note created"},
        )
```

### beginTransaction()

```text
async def beginTransaction(self, name: str | None = None) -> None:
```

Begins the first level or a savepoint in the current task. Returning from your method does not automatically commit: settle every level. Prefer contexts.

`name=None` follows gateway selection; keep the same name throughout the unit. Control failures, unsupported nesting and cross-task use raise `TransactionException`. Internal SQL failures raise `QueryException`. Redshift does not support nesting.

```python
async def manual_insert(body: str) -> None:
    await DB.beginTransaction()
    try:
        await DB.execute("INSERT INTO notes (body) VALUES (:body)", {"body": body})
    except BaseException:
        await DB.rollback()
        raise
    else:
        await DB.commit()
```

### commit()

```text
async def commit(self, name: str | None = None) -> None:
```

Commits only the innermost level. A released savepoint still depends on the outer commit; only settling the final level releases the connection. No active level raises `TransactionException`.

`name=None` follows gateway selection; keep the same name throughout the unit. Control failures, unsupported nesting and cross-task use raise `TransactionException`. Internal SQL failures raise `QueryException`. Redshift does not support nesting.

```python
async def confirmed_insert(body: str) -> None:
    await DB.beginTransaction()
    try:
        await DB.execute("INSERT INTO notes (body) VALUES (:body)", {"body": body})
    except BaseException:
        await DB.rollback()
        raise
    else:
        await DB.commit()
```

### rollback()

```text
async def rollback(self, name: str | None = None) -> None:
```

Rolls back only the innermost level; at root level discards changes and releases the resource. Cannot undo completed commits. No active level raises `TransactionException`.

`name=None` follows gateway selection; keep the same name throughout the unit. Control failures, unsupported nesting and cross-task use raise `TransactionException`. Internal SQL failures raise `QueryException`. Redshift does not support nesting.

```python
async def preview_insert(body: str) -> None:
    await DB.beginTransaction()
    try:
        await DB.execute("INSERT INTO notes (body) VALUES (:body)", {"body": body})
    finally:
        await DB.rollback()
```

The [transaction guide](/en/database/transactions) covers cancellation and concurrency. `DB` does not expose `disconnect()`, `inTransaction()`, `scalar()` or `raw()`: disposal/state belong to `IConnectionManager`/`IConnection`; use the builder or SQL for aggregates.

## Injection and construction

### DB

The facade class implements classmethod `getFacadeAccessor(cls) -> type`: `DB.getFacadeAccessor()` returns `IQueryBuilder`. This is resolution metadata, not a query. It inherits `async resolve(*args, **kwargs) -> object`, `async pin() -> None` and `unpin() -> None` from facade infrastructure: they resolve a booted application's service, retain it for dispatch or clear the retained reference. Providers manage these during boot; do not use them for table selection, connection disposal or per-request credential changes.

### QueryBuilder

```python
from orionis.http import JSONResponse
from orionis.orm.contracts.query_builder import IQueryBuilder


class NoteController:
    def __init__(self, db: IQueryBuilder) -> None:
        self.db = db

    async def index(self) -> JSONResponse:
        return JSONResponse({"notes": (await self.db.table("notes").limit(20).get()).all()})

    async def show(self, note_id: int, db: IQueryBuilder) -> JSONResponse:
        return JSONResponse({"note": await db.table("notes").where("id", note_id).first()})
```

The container supports constructor and method injection. Explicit construction uses `QueryBuilder(db_manager: IConnectionManager, connection_name: str | None = None)`; controllers do not need it. Builders use the resolver installed by ORM provider boot.
