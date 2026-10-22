---
title: "Writes and locks"
description: "Insert and modify row sets, interpret InsertResult and control the actual scope of filters and locks."
editUrl: true
lastUpdated: false
---

Builder writes operate on row sets. They return `InsertResult` or counts and do not create or save each [model instance](/en/database/orm/model-api).

`update()` and `delete()` construct plans containing the table and its `where` conditions. Joins, ordering, limits and offset are not transferred. `limit(1).delete()` **does not restrict deletion to one row**. The plan also omits the table alias: a WHERE qualified with that alias may fail during a write; use an unaliased target-table column. Select an explicit key or key set in `where` to delimit a write.

```python
from orionis.support.facades import DB

async def change_product_price(product_id: int, price: int) -> int:
    async with DB.transaction():
        return await DB.table("products").where("id", product_id).update({"price": price})
```

Raw tables do not apply model casts, timestamps, soft deletion, scopes or events. Model builders serialize dict/list/UUID for storage according to column types, and `update()` adds the update timestamp when applicable. They do not run assignment casts from `Model.casts`, mutators, `fillable` or per-instance events. `insert()` does not apply model scopes or automatically add creation timestamps.

Isolated writes commit according to the connection lifecycle. Use [transactions](/en/database/transactions) to group writes. A row lock requests an engine capability rather than a portable locking mechanism for every driver. SQL Server compiles UPDATE as WITH(UPDLOCK,ROWLOCK) and SHARE as WITH(HOLDLOCK,ROWLOCK).

## Operation reference

<a id="api-lockforupdate"></a>

### `lockForUpdate()`

```text
lockForUpdate() -> Self
```

Requests UPDATE locking for a SELECT. Does not begin a transaction.

**Result:** the same mutable builder (`Self`); does not execute SQL.

Redshift rejects these row locks with QueryException. SQLite omits FOR UPDATE and provides no row lock. On compatible engines, use inside a transaction owned by the same task.

```python
from orionis.support.facades import DB

query = DB.table("products").where("id", 1).lockForUpdate()
```

<a id="api-sharedlock"></a>

### `sharedLock()`

```text
sharedLock() -> Self
```

Requests SHARE locking for a SELECT. Does not begin a transaction.

**Result:** the same mutable builder (`Self`); does not execute SQL.

Redshift rejects these row locks with QueryException. SQLite omits FOR UPDATE and provides no row lock. On compatible engines, use inside a transaction owned by the same task.

```python
from orionis.support.facades import DB

query = DB.table("products").where("id", 1).sharedLock()
```

<a id="api-insert"></a>

### `insert()`

```text
async insert(values: dict[str, Any] | list[dict[str, Any]]) -> InsertResult
```

Inserts a dictionary or list of dictionaries and returns InsertResult(last_insert_id, row_count). Does not apply where filters or build models.

| Parameter | Use |
| --- | --- |
| `values` | Values to insert/update, or iterable/subquery in membership filters; see this operation’s behavior. |

**Result:** `InsertResult`.

An empty list raises InvalidQueryException. Generated keys depend on the driver; multi-row inserts do not return a list of IDs. Model.query().insert() serializes dict/list/UUID according to column types, without running Model.casts, save(), events, fillable or mutators.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").insert({"name": "Orionis kit", "price": 20, "stock": 5, "reserved": 0, "active": True, "category_id": 1})
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-update"></a>

### `update()`

```text
async update(values: dict[str, Any]) -> int
```

Updates the matching row set and returns its count. An empty dictionary raises InvalidQueryException.

| Parameter | Use |
| --- | --- |
| `values` | Values to insert/update, or iterable/subquery in membership filters; see this operation’s behavior. |

**Result:** `int`.

Without where it can update the whole table. The write plan retains WHERE, not JOIN/ORDER/LIMIT/OFFSET. For models it applies scopes, deleted visibility and storage serialization, without Model.casts, fillable, mutators or per-instance events. Adds updated_at where configured and absent from values; an explicit value, even None, is retained.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("id", 1).update({"price": 25})
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-delete"></a>

### `delete()`

```text
async delete() -> int
```

Physically deletes matching raw-table rows and returns their count.

**Result:** `int`.

Without where it can delete the whole table; limit/offset do not limit the DELETE plan. Model builders with SoftDeletes override this behavior; see soft deletes.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("id", 1).delete()
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

[DB facade](/en/database/db-facade) · [ORM queries](/en/database/orm/querying) · [Testing scenario](/en/database/orm/testing)
