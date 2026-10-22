---
title: "Joins and subqueries"
description: "Join tables, configure ON clauses, correlated subqueries, derived tables and result unions."
editUrl: true
lastUpdated: false
---

Joins relate SQL sources and return rows from one query. [ORM relationships](/en/database/orm/relationships) describe model associations and loading; they are distinct APIs.

Use aliases and qualified names for unambiguous resolution. A subquery accepts a builder, `SelectPlan` or synchronous callback configuring a fresh builder. `selectSub`, `whereExists`, `whereIn`, `joinSub` and `union` share normalization. Plans are incorporated by reference; finish configuring or clone them before reuse.

```python
from orionis.support.facades import DB

async def product_categories():
    return await (
        DB.table("products", alias="p")
        .leftJoin("categories", "p.category_id", "=", "c.id", alias="c")
        .select("p.id", "p.name")
        .selectRaw("c.name", alias="category_name")
        .orderBy("p.id")
        .get()
    )
```

The example avoids two `name` columns with the same result key. Selecting identically named columns without aliases may produce ambiguous mapping keys. Retain necessary keys for models that will later save changes or load relationships.

RIGHT/FULL JOIN availability depends on the server. Unsupported joins are not emulated or sent to another engine. Each terminal uses one connection: subqueries compile on the outer query’s engine even if the embedded builder selected another connection.

## Operation reference

<a id="api-selectsub"></a>

### `selectSub()`

```text
selectSub(query: Any, alias: str) -> Self
```

Appends an aliased scalar subquery. The database requires one column and scalar cardinality; the builder does not turn several rows into a list.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("id").selectSub(DB.table("products").selectRaw("MAX(price)").toPlan(), "highest_price")
```

<a id="api-whereexists"></a>

### `whereExists()`

```text
whereExists(query: Any) -> Self
```

Adds AND EXISTS. Filter by related-row existence without hydrating models.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").whereExists(DB.table("categories", alias="c").select("c.id").whereColumn("c.id", "=", "p.category_id"))
```

<a id="api-orwhereexists"></a>

### `orWhereExists()`

```text
orWhereExists(query: Any) -> Self
```

Adds OR EXISTS. Filter by related-row existence without hydrating models.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").orWhereExists(DB.table("categories", alias="c").select("c.id").whereColumn("c.id", "=", "p.category_id"))
```

<a id="api-wherenotexists"></a>

### `whereNotExists()`

```text
whereNotExists(query: Any) -> Self
```

Adds AND NOT EXISTS. Filter by related-row existence without hydrating models.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").whereNotExists(DB.table("categories", alias="c").select("c.id").whereColumn("c.id", "=", "p.category_id"))
```

<a id="api-orwherenotexists"></a>

### `orWhereNotExists()`

```text
orWhereNotExists(query: Any) -> Self
```

Adds OR NOT EXISTS. Filter by related-row existence without hydrating models.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").orWhereNotExists(DB.table("categories", alias="c").select("c.id").whereColumn("c.id", "=", "p.category_id"))
```

<a id="api-join"></a>

### `join()`

```text
join(table: str | TableDefinition, first: Any=None, operator: str | None=None, second: str | None=None, *, alias: str | None=None) -> Self
```

Adds a INNER JOIN. Accepts a column condition or a JoinClause callback combining conditions.

| Parameter | Use |
| --- | --- |
| `table` | Logical table name or TableDefinition. Separate a schema with a dot and use explicit aliases in joins. |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

An incomplete condition raises InvalidQueryException. Both ON operands must be columns; JOIN-type support depends on the engine.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").join("categories", "p.category_id", "=", "c.id", alias="c").select("p.id", "c.name")
```

<a id="api-leftjoin"></a>

### `leftJoin()`

```text
leftJoin(table: str | TableDefinition, first: Any=None, operator: str | None=None, second: str | None=None, *, alias: str | None=None) -> Self
```

Adds a LEFT OUTER JOIN. Accepts a column condition or a JoinClause callback combining conditions.

| Parameter | Use |
| --- | --- |
| `table` | Logical table name or TableDefinition. Separate a schema with a dot and use explicit aliases in joins. |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

An incomplete condition raises InvalidQueryException. Both ON operands must be columns; JOIN-type support depends on the engine.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").leftJoin("categories", "p.category_id", "=", "c.id", alias="c").select("p.id", "c.name")
```

<a id="api-rightjoin"></a>

### `rightJoin()`

```text
rightJoin(table: str | TableDefinition, first: Any=None, operator: str | None=None, second: str | None=None, *, alias: str | None=None) -> Self
```

Adds a RIGHT OUTER JOIN. Accepts a column condition or a JoinClause callback combining conditions.

| Parameter | Use |
| --- | --- |
| `table` | Logical table name or TableDefinition. Separate a schema with a dot and use explicit aliases in joins. |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

An incomplete condition raises InvalidQueryException. Both ON operands must be columns; JOIN-type support depends on the engine.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").rightJoin("categories", "p.category_id", "=", "c.id", alias="c").select("p.id", "c.name")
```

<a id="api-fulljoin"></a>

### `fullJoin()`

```text
fullJoin(table: str | TableDefinition, first: Any=None, operator: str | None=None, second: str | None=None, *, alias: str | None=None) -> Self
```

Adds a FULL OUTER JOIN. Accepts a column condition or a JoinClause callback combining conditions.

| Parameter | Use |
| --- | --- |
| `table` | Logical table name or TableDefinition. Separate a schema with a dot and use explicit aliases in joins. |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

An incomplete condition raises InvalidQueryException. Both ON operands must be columns; JOIN-type support depends on the engine.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").fullJoin("categories", "p.category_id", "=", "c.id", alias="c").select("p.id", "c.name")
```

<a id="api-crossjoin"></a>

### `crossJoin()`

```text
crossJoin(table: str | TableDefinition, *, alias: str | None=None) -> Self
```

Adds a Cartesian product without ON. The number of combinations can grow as left_rows * right_rows.

| Parameter | Use |
| --- | --- |
| `table` | Logical table name or TableDefinition. Separate a schema with a dot and use explicit aliases in joins. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").crossJoin("categories", alias="c").select("p.id", "c.id")
```

<a id="api-joinsub"></a>

### `joinSub()`

```text
joinSub(query: Any, alias: str, first: Any=None, operator: str | None=None, second: str | None=None) -> Self
```

Adds a derived table with INNER JOIN; alias is required and projected columns must be addressable.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Accepts a builder, SelectPlan or synchronous callback. This API has no fullJoinSub.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").joinSub(DB.table("categories").select("id", "name"), "c", "p.category_id", "=", "c.id").select("p.id", "c.name")
```

<a id="api-leftjoinsub"></a>

### `leftJoinSub()`

```text
leftJoinSub(query: Any, alias: str, first: Any=None, operator: str | None=None, second: str | None=None) -> Self
```

Adds a derived table with LEFT OUTER JOIN; alias is required and projected columns must be addressable.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Accepts a builder, SelectPlan or synchronous callback. This API has no fullJoinSub.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").leftJoinSub(DB.table("categories").select("id", "name"), "c", "p.category_id", "=", "c.id").select("p.id", "c.name")
```

<a id="api-rightjoinsub"></a>

### `rightJoinSub()`

```text
rightJoinSub(query: Any, alias: str, first: Any=None, operator: str | None=None, second: str | None=None) -> Self
```

Adds a derived table with RIGHT OUTER JOIN; alias is required and projected columns must be addressable.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Accepts a builder, SelectPlan or synchronous callback. This API has no fullJoinSub.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").rightJoinSub(DB.table("categories").select("id", "name"), "c", "p.category_id", "=", "c.id").select("p.id", "c.name")
```

<a id="api-union"></a>

### `union()`

```text
union(query: Any) -> Self
```

Combines results with UNION removing duplicates.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Both queries must have projections compatible in count and type; final validation belongs to the engine.

```python
from orionis.support.facades import DB

query = DB.table("products").select("name").union(DB.table("categories").select("name"))
```

<a id="api-unionall"></a>

### `unionAll()`

```text
unionAll(query: Any) -> Self
```

Combines results with UNION ALL preserving duplicates.

| Parameter | Use |
| --- | --- |
| `query` | Builder, SelectPlan or synchronous callback configuring a fresh builder. A coroutine is not awaited. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Both queries must have projections compatible in count and type; final validation belongs to the engine.

```python
from orionis.support.facades import DB

query = DB.table("products").select("name").unionAll(DB.table("categories").select("name"))
```

<a id="api-join-on"></a>

### `on()`

```text
on(first: str, operator: str, second: str) -> Self
```

Appends an AND-combined column comparison.

| Parameter | Use |
| --- | --- |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The first/second arguments are column references. For a bound value use a filter outside ON; JoinClause has no where().

```python
from orionis.orm.query.join_clause import JoinClause

query = JoinClause().on("p.category_id", "=", "c.id")
```

<a id="api-join-oron"></a>

### `orOn()`

```text
orOn(first: str, operator: str, second: str) -> Self
```

Appends an OR-combined column comparison.

| Parameter | Use |
| --- | --- |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The first/second arguments are column references. For a bound value use a filter outside ON; JoinClause has no where().

```python
from orionis.orm.query.join_clause import JoinClause

query = JoinClause().on("p.category_id", "=", "c.id").orOn("p.category_id", "=", "c.parent_id")
```

<a id="api-join-conditions"></a>

### `conditions()`

```text
conditions() -> list[JoinCondition]
```

Returns the live ON-condition list in order. Does not execute SQL or copy the list.

**Result:** `list[JoinCondition]`.

The first/second arguments are column references. For a bound value use a filter outside ON; JoinClause has no where().

```python
from orionis.orm.query.join_clause import JoinClause

query = JoinClause().on("p.category_id", "=", "c.id").conditions()
```

[DB facade](/en/database/db-facade) · [ORM queries](/en/database/orm/querying) · [Testing scenario](/en/database/orm/testing)
