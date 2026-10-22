---
title: "Parameterized SQL and results"
description: "Bindings, buffered results, affected rows, generated identities and SQL error handling."
editUrl: true
lastUpdated: false
---

`DB.select()`, `DB.execute()` and `DB.statement()` share connections and transactions with the ORM. Use them when you need to express SQL directly. [Complete signatures](/en/database/db-facade#select) are in the DB reference.

## Bound values

```python
from orionis.http import JSONResponse
from orionis.support.facades import DB


class NoteController:
    async def search(self, body: str) -> JSONResponse:
        rows = await DB.select(
            "SELECT id, body FROM notes WHERE body = :body ORDER BY id",
            {"body": body},
        )
        return JSONResponse({"notes": rows})

    async def update(self, note_id: int, body: str) -> JSONResponse:
        affected = await DB.execute(
            "UPDATE notes SET body = :body WHERE id = :id",
            {"body": body, "id": note_id},
        )
        return JSONResponse({"affected": affected})
```

Use `:body` and `:id` placeholders across drivers; the execution layer adapts their format. Do not quote placeholders or interpolate external values with f-strings or concatenation. Values must be serializable by the driver; `None` represents SQL `NULL`. Model casts and attribute rules are not applied.

Table/column names, ordering directions and keywords cannot be bound as values. Choose identifiers from a controlled catalog or use the query builder. Raw SQL does not add `DB_PREFIX` either: use complete physical names.

## Choosing the correct result

| Operation | Result | What it does not mean |
|---|---|---|
| `await DB.select(...)` | `list[dict]`; `[]` for no rows | Not a cursor or list of models. |
| `await DB.execute(...)` | Driver `int` | Not the generated key; may be `-1` when count is unknown. |
| `await DB.statement(...)` | `True` after execution and cleanup | Does not report affected rows. |
| `await connection.insert(InsertPlan(...))` | `InsertResult(last_insert_id, row_count)` | Does not guarantee identities for batches or Redshift. |

Update counts can represent matched rows rather than changed values. A `0` result is not an exception.

## DDL and maintenance queries

```python
from orionis.support.facades import DB


async def prepare_demo() -> dict[str, object]:
    await DB.statement(
        "CREATE TABLE IF NOT EXISTS notes "
        "(id INTEGER PRIMARY KEY, body TEXT NOT NULL)"
    )
    affected = await DB.execute(
        "INSERT INTO notes (body) VALUES (:body)", {"body": "First note"}
    )
    rows = await DB.select("SELECT id, body FROM notes ORDER BY id")
    return {"affected": affected, "rows": rows}
```

The DDL example targets SQLite. Use [schemas and migrations](/en/database/schema) for application tables, with backend-appropriate types and identities. `statement()` does not make a statement portable or provide a general multi-statement API.

A 256-text LRU cache reuses parsed raw SQL. It does not cache results or skip repeated executions. `select()` buffers every row before releasing the connection: filter, project and limit volume. Do not assume cursor streaming. Values retain driver types; adapt dates, decimals and other values to external formats when needed.

## Handling errors

```python
from orionis.database import QueryException
from orionis.http import JSONResponse
from orionis.support.facades import DB


class NoteLookupController:
    async def show(self, note_id: int) -> JSONResponse:
        try:
            rows = await DB.select(
                "SELECT id, body FROM notes WHERE id = :id", {"id": note_id}
            )
        except QueryException:
            return JSONResponse({"error": "Database operation failed"}, status_code=503)
        if not rows:
            return JSONResponse({"error": "Note not found"}, status_code=404)
        return JSONResponse(rows[0])
```

SQLAlchemy failures become `QueryException` with connection name and error type, without SQL, bindings or driver messages. Configuration and dependency failures have [separate exceptions](/en/database/runtime-api#exceptions). Never expose `configFor()` or credentials to clients.

You can also propagate failures to the [HTTP handler](/en/http/exceptions). Catch outside a transaction when the entire unit must roll back. There is no general retry policy: writes with uncertain commit outcomes require idempotency before retrying.
