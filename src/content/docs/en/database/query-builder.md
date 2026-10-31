---
title: "Query Builder: selection and results"
description: "Build model-less queries, project columns, order, paginate and retrieve aggregates through the shared ORM API."
editUrl: true
lastUpdated: false
---

`DB.table("products")` creates a fresh `RawQueryBuilder`. `Model.query()` creates a `ModelQueryBuilder` sharing its clauses; hydration, serialization and model policies differ. Clauses are synchronous and return the same builder: await only asynchronous terminals.

Reference examples require a booted application and existing tables. Use the [Product model](/en/orm/factories#complete-model-and-factory) columns for `products`; joins also require `categories` with `id` and `name`. The [testing guide](/en/orm/testing) shows how to prepare an isolated database with its own sample models. Blocks are service/controller functions or queries you can run inside an `async` action. Write examples modify those sample tables.

Do not share a mutable builder across requests or tasks. The `DB` gateway itself is shared: create a builder for every query and use `clone()` to branch.

## Building and executing a query

The chain follows the [Laravel Query Builder](https://laravel.com/docs/12.x/queries) style: table, selection, filters, ordering and a final operation. Orionis uses Python, dots between methods and `await` for execution:

```python
from orionis.support.facades import DB


async def available_products():
    products = await (
        DB.table("products")
        .select("id", "name", "price")
        .where("active", True)
        .where("stock", ">", 0)
        .orderBy("price", "desc")
        .orderBy("id")
        .limit(20)
        .get()
    )
    return products.all()
```

`where("active", True)` expresses equality; the three-argument form `where("stock", ">", 0)` specifies the operator. Both filters are combined with AND. Parentheses allow the chain to span multiple lines. `get()` executes the query; `all()` converts the resulting collection into a list of dictionaries.

| Need | Expression inside an `async` function |
| --- | --- |
| First row or `None` | `await DB.table("products").where("id", product_id).first()` |
| One value or `None` | `await DB.table("products").where("id", product_id).value("name")` |
| Collection of values | `await DB.table("products").orderBy("id").pluck("name")` |
| Count matches | `await DB.table("products").where("active", True).count()` |
| Page with metadata | `await DB.table("products").orderBy("id").paginate(page=1, per_page=20)` |

`product_id` represents an argument to your function. Write pagination argument names explicitly: the first argument in Orionis is `page`. Select columns with `select("id", "name").get()`; `get()` does not accept a column list. Keep API camelCase names such as `orderBy` and `whereIn`, and Python values `True`, `False` and `None`.

## Querying a table inside a schema

Pass the qualified name as one string: `DB.table("sales.products")` queries the `products` table in the `sales` schema. The schema and table must exist and be accessible to the connection. This additional example assumes an engine with that schema, such as PostgreSQL; the unqualified tables in the testing scenario do not create it.

```python
from orionis.support.facades import DB


async def schema_products():
    return await (
        DB.table("sales.products")
        .select("id", "name")
        .where("active", True)
        .orderBy("id")
        .get()
    )


async def reporting_products():
    return await (
        DB.connection("reporting")
        .table("sales.products", alias="p")
        .select("p.id", "p.name")
        .where("p.active", True)
        .orderBy("p.id")
        .get()
    )
```

`reporting` is the connection name registered in `config/database.py`; `sales` is the schema within that database; `p` is this query's alias. You can also write `DB.table("sales.products", connection="reporting", alias="p")`. Choosing a schema neither selects another connection nor creates the schema.

Reference columns as `id`, `products.id` without an alias, or `p.id` when declaring `alias="p"`. The compiler resolves columns by table name or alias, so do not use `sales.products.id`. Declare aliases through the `alias` argument, not inside the string `"sales.products as p"`. With a connection prefix of `app_`, the physical table is `sales.app_products`; keep passing the logical name `sales.products`.

The qualifier's meaning depends on the engine: a schema in PostgreSQL, a database in MySQL, and a database such as `main` or an attached database available on the physical connection in SQLite. To combine tables, see [joins across schemas](/en/database/joins-and-subqueries#schema-joins); for models, configure a [TableDefinition with schema](/en/orm/models-and-attributes#schema-table).

## Table and model results

`get()` returns `Collection`, not a Python list. Raw tables contain dictionaries; model queries contain models. `first()` returns a row/model or `None`. `value()` may return `None` for either a missing row or SQL NULL. `pluck()` returns a value collection. See [collections and pagination](/en/orm/collections-and-pagination) for their structures.

Continue with [conditions](/en/database/query-filters), [joins](/en/database/joins-and-subqueries) and [writes](/en/database/query-writes).

## Operation reference

<a id="api-toplan"></a>

### `toPlan()`

```text
toPlan() -> SelectPlan
```

Returns the live SelectPlan without compiling or executing SQL. Inspect filters, projection and limits.

**Result:** `SelectPlan`.

Mutating the returned object changes the query; it is not a snapshot.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).toPlan()
```

<a id="api-clone"></a>

### `clone()`

```text
clone() -> Self
```

Copies plan lists to branch a query. Existing clauses, the table and nested plans retain shared references; this is not a deep copy.

**Result:** a new builder (`Self`) with copied plan lists; does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).clone().where("stock", ">", 0)
```

<a id="api-adoptplan"></a>

### `adoptPlan()`

```text
adoptPlan(plan: SelectPlan) -> Self
```

Replaces the complete builder plan and returns the same instance. Does not execute or validate table existence.

| Parameter | Use |
| --- | --- |
| `plan` | SelectPlan becoming the builder’s live plan; clone first when independence is needed. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Shares that plan: use plan.clone() to detach it.

```python
from orionis.support.facades import DB

query = DB.table("products").adoptPlan(DB.table("products").where("stock", ">", 0).toPlan())
```

<a id="api-adoptconnection"></a>

### `adoptConnection()`

```text
adoptConnection(name: str | None) -> Self
```

Selects this builder’s connection. None returns to the default; does not change global configuration.

| Parameter | Use |
| --- | --- |
| `name` | Name of a connection registered in `config/database.py`. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").adoptConnection("sqlite")
```

<a id="api-select"></a>

### `select()`

```text
select(*columns: str) -> Self
```

Replaces the projection with the given columns. select() selects all; missing columns fail during compilation or execution.

| Parameter | Use |
| --- | --- |
| `columns` | Column names as separate arguments, optionally qualified by table or alias. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("id", "name")
```

<a id="api-addselect"></a>

### `addSelect()`

```text
addSelect(*columns: str) -> Self
```

Appends columns to the current projection without removing earlier entries. Does not deduplicate names.

| Parameter | Use |
| --- | --- |
| `columns` | Column names as separate arguments, optionally qualified by table or alias. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("id").addSelect("name")
```

<a id="api-selectraw"></a>

### `selectRaw()`

```text
selectRaw(sql: str, bindings: dict[str, Any] | None=None, alias: str | None=None) -> Self
```

Appends a trusted SQL expression and its bindings. alias makes the result addressable in a derived table.

| Parameter | Use |
| --- | --- |
| `sql` | Developer-authored SQL fragment; variable values go through bindings. |
| `bindings` | Dictionary of named :name parameters. None adds no bindings. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("id").selectRaw("price * :factor", {"factor": 2}, alias="double_price")
```

<a id="api-distinct"></a>

### `distinct()`

```text
distinct() -> Self
```

Requests SELECT DISTINCT over the complete projection. Accepts no column names and does not implement DISTINCT ON.

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").distinct()
```

<a id="api-orderby"></a>

### `orderBy()`

```text
orderBy(column: str, direction: str='asc') -> Self
```

Appends ascending or descending ordering. Retains earlier ordering rules; an invalid direction raises InvalidQueryException.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |
| `direction` | asc or desc; whitespace is trimmed and case normalized. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("price", "desc").orderBy("id")
```

<a id="api-latest"></a>

### `latest()`

```text
latest(column: str | None=None) -> Self
```

Orders newest first. Without a column uses created_at for raw tables and the configured creation timestamp for models.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Does not create the column; specify an appropriate column when it is absent.

```python
from orionis.support.facades import DB

query = DB.table("products").latest("id")
```

<a id="api-oldest"></a>

### `oldest()`

```text
oldest(column: str | None=None) -> Self
```

Orders oldest first. Without a column uses created_at for raw tables and the configured creation timestamp for models.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Does not create the column; specify an appropriate column when it is absent.

```python
from orionis.support.facades import DB

query = DB.table("products").oldest("id")
```

<a id="api-groupby"></a>

### `groupBy()`

```text
groupBy(*columns: str) -> Self
```

Appends grouping columns. Projections and aggregates must satisfy GROUP BY rules of the selected engine.

| Parameter | Use |
| --- | --- |
| `columns` | Column names as separate arguments, optionally qualified by table or alias. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").selectRaw("COUNT(*)", alias="total").groupBy("category_id")
```

<a id="api-limit"></a>

### `limit()`

```text
limit(value: int) -> Self
```

Sets maximum number of rows; accepts zero. Replaces the previous value of this option.

| Parameter | Use |
| --- | --- |
| `value` | Option value or literal filter text. Limits/offsets must be nonnegative integers and cannot be bool. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Rejects negative values, bool and non-int types with InvalidQueryException.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").limit(10)
```

<a id="api-take"></a>

### `take()`

```text
take(value: int) -> Self
```

Sets maximum number of rows (limit alias); accepts zero. Replaces the previous value of this option.

| Parameter | Use |
| --- | --- |
| `value` | Option value or literal filter text. Limits/offsets must be nonnegative integers and cannot be bool. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Rejects negative values, bool and non-int types with InvalidQueryException.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").take(10)
```

<a id="api-offset"></a>

### `offset()`

```text
offset(value: int) -> Self
```

Sets rows to skip; accepts zero. Replaces the previous value of this option.

| Parameter | Use |
| --- | --- |
| `value` | Option value or literal filter text. Limits/offsets must be nonnegative integers and cannot be bool. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Rejects negative values, bool and non-int types with InvalidQueryException.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").offset(10)
```

<a id="api-skip"></a>

### `skip()`

```text
skip(value: int) -> Self
```

Sets rows to skip (offset alias); accepts zero. Replaces the previous value of this option.

| Parameter | Use |
| --- | --- |
| `value` | Option value or literal filter text. Limits/offsets must be nonnegative integers and cannot be bool. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Rejects negative values, bool and non-int types with InvalidQueryException.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").skip(10)
```

<a id="api-forpage"></a>

### `forPage()`

```text
forPage(page: int, per_page: int=15) -> Self
```

Sets limit=per_page and offset=(page-1)*per_page without executing a query.

| Parameter | Use |
| --- | --- |
| `page` | Page number, integer >=1, excluding bool. |
| `per_page` | Page size, integer >=1; default 15. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Page and size must be positive integers; does not return a Paginator.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").forPage(2, 20)
```

<a id="api-count"></a>

### `count()`

```text
async count(column: str='*') -> int
```

Counts matching rows; column="*" counts all and a column counts non-NULL values.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** `int`.

Aggregates clone the plan and remove ordering, limit and offset; retain filters, grouping, HAVING and unions. With GROUP BY, scalar terminals other than count("*") return the first calculated value, rather than one result per group. count("*") counts derived-result rows when groups, DISTINCT or UNION are present. For per-group aggregates use selectRaw(...).groupBy(...).get(). exists() clears offset, sets limit=1 and does not load the complete collection.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).count()
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-exists"></a>

### `exists()`

```text
async exists() -> bool
```

Checks existence with a SELECT limited to one row.

**Result:** `bool`.

Aggregates clone the plan and remove ordering, limit and offset; retain filters, grouping, HAVING and unions. With GROUP BY, scalar terminals other than count("*") return the first calculated value, rather than one result per group. count("*") counts derived-result rows when groups, DISTINCT or UNION are present. For per-group aggregates use selectRaw(...).groupBy(...).get(). exists() clears offset, sets limit=1 and does not load the complete collection.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).exists()
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-doesntexist"></a>

### `doesntExist()`

```text
async doesntExist() -> bool
```

Negates exists().

**Result:** `bool`.

Aggregates clone the plan and remove ordering, limit and offset; retain filters, grouping, HAVING and unions. With GROUP BY, scalar terminals other than count("*") return the first calculated value, rather than one result per group. count("*") counts derived-result rows when groups, DISTINCT or UNION are present. For per-group aggregates use selectRaw(...).groupBy(...).get(). exists() clears offset, sets limit=1 and does not load the complete collection.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).doesntExist()
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-max"></a>

### `max()`

```text
async max(column: str) -> Any
```

Returns the maximum; returns None without values.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** `Any`.

Aggregates clone the plan and remove ordering, limit and offset; retain filters, grouping, HAVING and unions. With GROUP BY, scalar terminals other than count("*") return the first calculated value, rather than one result per group. count("*") counts derived-result rows when groups, DISTINCT or UNION are present. For per-group aggregates use selectRaw(...).groupBy(...).get(). exists() clears offset, sets limit=1 and does not load the complete collection.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).max("price")
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-min"></a>

### `min()`

```text
async min(column: str) -> Any
```

Returns the minimum; returns None without values.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** `Any`.

Aggregates clone the plan and remove ordering, limit and offset; retain filters, grouping, HAVING and unions. With GROUP BY, scalar terminals other than count("*") return the first calculated value, rather than one result per group. count("*") counts derived-result rows when groups, DISTINCT or UNION are present. For per-group aggregates use selectRaw(...).groupBy(...).get(). exists() clears offset, sets limit=1 and does not load the complete collection.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).min("price")
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-avg"></a>

### `avg()`

```text
async avg(column: str) -> float | None
```

Returns the average converted to float, or None without values.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** `float | None`.

Aggregates clone the plan and remove ordering, limit and offset; retain filters, grouping, HAVING and unions. With GROUP BY, scalar terminals other than count("*") return the first calculated value, rather than one result per group. count("*") counts derived-result rows when groups, DISTINCT or UNION are present. For per-group aggregates use selectRaw(...).groupBy(...).get(). exists() clears offset, sets limit=1 and does not load the complete collection.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).avg("price")
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-sum"></a>

### `sum()`

```text
async sum(column: str) -> Any
```

Returns the sum; returns 0 without values.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** `Any`.

Aggregates clone the plan and remove ordering, limit and offset; retain filters, grouping, HAVING and unions. With GROUP BY, scalar terminals other than count("*") return the first calculated value, rather than one result per group. count("*") counts derived-result rows when groups, DISTINCT or UNION are present. For per-group aggregates use selectRaw(...).groupBy(...).get(). exists() clears offset, sets limit=1 and does not load the complete collection.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).sum("price")
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-raw-connection"></a>

### `connection()`

```text
connection(name: str) -> Self
```

Selects a registered connection for this builder without altering the shared DB gateway.

| Parameter | Use |
| --- | --- |
| `name` | Name of a connection registered in `config/database.py`. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Terminals require a selected table and a booted application. Query errors propagate; paginate needs positive integers and uses two queries, not an atomic snapshot.

```python
from orionis.support.facades import DB

query = DB.table("products").connection("sqlite")
```

<a id="api-raw-table"></a>

### `table()`

```text
table(name: str, *, alias: str | None=None) -> Self
```

Replaces the table and alias while retaining existing clauses.

| Parameter | Use |
| --- | --- |
| `name` | Logical table name, such as `products` or `sales.products`; this is not a connection name. |
| `alias` | SQL alias for the projection or derived table, used to address its result. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Terminals require a selected table and a booted application. Query errors propagate; paginate needs positive integers and uses two queries, not an atomic snapshot.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).table("products", alias="p")
```

<a id="api-raw-get"></a>

### `get()`

```text
async get() -> Collection
```

Executes SELECT and returns a Collection of dictionaries. Does not hydrate models or apply their events, scopes or casts.

**Result:** `Collection`.

Terminals require a selected table and a booted application. Query errors propagate; paginate needs positive integers and uses two queries, not an atomic snapshot.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").orderBy("id").get()
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-raw-first"></a>

### `first()`

```text
async first() -> dict[str, Any] | None
```

Queries a clone with limit=1 and returns a dictionary or None, leaving the original builder limit unchanged.

**Result:** `dict[str, Any] | None`.

Terminals require a selected table and a booted application. Query errors propagate; paginate needs positive integers and uses two queries, not an atomic snapshot.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").orderBy("id").first()
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-raw-value"></a>

### `value()`

```text
async value(column: str) -> Any
```

Selects one column on a clone and returns its first value or None. None may also represent SQL NULL.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** `Any`.

Terminals require a selected table and a booted application. Query errors propagate; paginate needs positive integers and uses two queries, not an atomic snapshot.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("id", 1).value("name")
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-raw-pluck"></a>

### `pluck()`

```text
async pluck(column: str) -> Collection
```

Selects one column and returns a Collection of its values in query order.

| Parameter | Use |
| --- | --- |
| `column` | Column name, optionally qualified by table or alias. |

**Result:** `Collection`.

Terminals require a selected table and a booted application. Query errors propagate; paginate needs positive integers and uses two queries, not an atomic snapshot.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").orderBy("id").pluck("name")
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

<a id="api-raw-paginate"></a>

### `paginate()`

```text
async paginate(page: int=1, per_page: int=15) -> Paginator
```

Configures the page and executes count followed by get to build a dictionary Paginator.

| Parameter | Use |
| --- | --- |
| `page` | Page number, integer >=1, excluding bool. |
| `per_page` | Page size, integer >=1; default 15. |

**Result:** `Paginator`.

Terminals require a selected table and a booted application. Query errors propagate; paginate needs positive integers and uses two queries, not an atomic snapshot.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").orderBy("id").paginate(page=1, per_page=15)
```

**Errors:** `QueryException` on compilation/execution failure; the connection layer sanitizes messages and suppresses chained driver causes.

[DB facade](/en/database/db-facade) · [ORM queries](/en/orm/querying) · [Testing scenario](/en/orm/testing)
