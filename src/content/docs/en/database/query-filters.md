---
title: "Filters and conditions"
description: "Combine conditions, logical groups, NULL, ranges, patterns and bound SQL without interpolating user values."
editUrl: true
lastUpdated: false
---

Values are bound as parameters; columns and SQL fragments are chosen by the application. An allowlist prevents client-supplied column names from becoming arbitrary SQL. These methods append clauses without executing queries.

The [builder reference](/en/database/query-builder) explains the `products` scenario. Use synchronous methods inside callbacks: their return is not awaited. Conditions combine left to right: A OR B AND C produces `(A OR B) AND C`. Group alternatives to control association; `A AND (B OR C)` differs from `A AND B OR C`.

```python
from orionis.support.facades import DB

async def available_products():
    return await (
        DB.table("products")
        .where("active", True)
        .where(lambda group: group.where("stock", ">", 0).orWhere("reserved", 0))
        .orderBy("id")
        .get()
    )
```

An empty grouped callback becomes true: `orWhere(lambda group: None)` can widen the query to all rows. Do not generate an empty OR group from optional filters; `where({})` adds no conditions.

`orWhere...` variants change that clause’s connector; they do not automatically form a group. `having` filters after grouping and shares basic-condition calling forms. Not every specialized method has an OR variant: where none is documented, combine `orWhere()` with a grouped callback.

## Operation reference

<a id="api-where"></a>

### `where()`

```text
where(column: Any, *args: Any) -> Self
```

Adds AND conditions. Supports equality, explicit operator, equality dictionary and grouped callback.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `args` | One value for equality, or two arguments (operator, value). Dictionary and callback forms need neither. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Supported operators: =, ==, !=, <>, <, <=, >, >=, like, not like, ilike and not ilike. An unsupported operator or wrong arity raises InvalidQueryException. With None, only =/== become IS NULL and !=/<> become IS NOT NULL. Other operators are not converted and may fail compilation.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).where("stock", ">", 0)
```

<a id="api-orwhere"></a>

### `orWhere()`

```text
orWhere(column: Any, *args: Any) -> Self
```

Adds OR conditions. Supports equality, explicit operator, equality dictionary and grouped callback.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `args` | One value for equality, or two arguments (operator, value). Dictionary and callback forms need neither. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Supported operators: =, ==, !=, <>, <, <=, >, >=, like, not like, ilike and not ilike. An unsupported operator or wrong arity raises InvalidQueryException. With None, only =/== become IS NULL and !=/<> become IS NOT NULL. Other operators are not converted and may fail compilation.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhere("stock", ">", 0)
```

<a id="api-wherein"></a>

### `whereIn()`

```text
whereIn(column: str, values: Any) -> Self
```

Filters by membership in an iterable or subquery, combined with AND.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `values` | Values to insert/update, or iterable/subquery in membership filters; see this operation’s behavior. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The iterable is materialized when configuring the clause; a Collection is unwrapped. IN([]) matches no rows and NOT IN([]) excludes none, including NULL columns. None is not an empty iterable: it raises TypeError while constructing the clause.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).whereIn("id", [1, 2, 3])
```

<a id="api-orwherein"></a>

### `orWhereIn()`

```text
orWhereIn(column: str, values: Any) -> Self
```

Filters by membership in an iterable or subquery, combined with OR.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `values` | Values to insert/update, or iterable/subquery in membership filters; see this operation’s behavior. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The iterable is materialized when configuring the clause; a Collection is unwrapped. IN([]) matches no rows and NOT IN([]) excludes none, including NULL columns. None is not an empty iterable: it raises TypeError while constructing the clause.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhereIn("id", [1, 2, 3])
```

<a id="api-wherenotin"></a>

### `whereNotIn()`

```text
whereNotIn(column: str, values: Any) -> Self
```

Filters by exclusion from an iterable or subquery, combined with AND.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `values` | Values to insert/update, or iterable/subquery in membership filters; see this operation’s behavior. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The iterable is materialized when configuring the clause; a Collection is unwrapped. IN([]) matches no rows and NOT IN([]) excludes none, including NULL columns. None is not an empty iterable: it raises TypeError while constructing the clause.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).whereNotIn("id", [1, 2, 3])
```

<a id="api-orwherenotin"></a>

### `orWhereNotIn()`

```text
orWhereNotIn(column: str, values: Any) -> Self
```

Filters by exclusion from an iterable or subquery, combined with OR.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `values` | Values to insert/update, or iterable/subquery in membership filters; see this operation’s behavior. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The iterable is materialized when configuring the clause; a Collection is unwrapped. IN([]) matches no rows and NOT IN([]) excludes none, including NULL columns. None is not an empty iterable: it raises TypeError while constructing the clause.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhereNotIn("id", [1, 2, 3])
```

<a id="api-wherenull"></a>

### `whereNull()`

```text
whereNull(column: str) -> Self
```

Adds IS NULL with AND; checks SQL absence, not an empty string.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).whereNull("description")
```

<a id="api-orwherenull"></a>

### `orWhereNull()`

```text
orWhereNull(column: str) -> Self
```

Adds IS NULL with OR; checks SQL absence, not an empty string.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhereNull("description")
```

<a id="api-wherenotnull"></a>

### `whereNotNull()`

```text
whereNotNull(column: str) -> Self
```

Adds IS NOT NULL with AND; checks SQL absence, not an empty string.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).whereNotNull("description")
```

<a id="api-orwherenotnull"></a>

### `orWhereNotNull()`

```text
orWhereNotNull(column: str) -> Self
```

Adds IS NOT NULL with OR; checks SQL absence, not an empty string.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhereNotNull("description")
```

<a id="api-wherebetween"></a>

### `whereBetween()`

```text
whereBetween(column: str, bounds: Iterable[Any]) -> Self
```

Adds BETWEEN with two inclusive bounds.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `bounds` | Iterable of exactly two bounds, lower and upper, included by BETWEEN. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Any number of bounds other than two raises InvalidQueryException while constructing the clause.

```python
from orionis.support.facades import DB

query = DB.table("products").whereBetween("price", [10, 100])
```

<a id="api-wherenotbetween"></a>

### `whereNotBetween()`

```text
whereNotBetween(column: str, bounds: Iterable[Any]) -> Self
```

Adds NOT BETWEEN with two inclusive bounds.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `bounds` | Iterable of exactly two bounds, lower and upper, included by BETWEEN. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Any number of bounds other than two raises InvalidQueryException while constructing the clause.

```python
from orionis.support.facades import DB

query = DB.table("products").whereNotBetween("price", [10, 100])
```

<a id="api-wherelike"></a>

### `whereLike()`

```text
whereLike(column: str, pattern: str) -> Self
```

Adds the LIKE pattern. % and _ retain wildcard meaning.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `pattern` | LIKE/ILIKE or engine regular-expression pattern; bound as a value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Case sensitivity depends on operator, dialect and collation. The compiler adapts ILIKE through SQLAlchemy; it does not promise identical collation across engines.

```python
from orionis.support.facades import DB

query = DB.table("products").whereLike("name", "%orionis%")
```

<a id="api-wherenotlike"></a>

### `whereNotLike()`

```text
whereNotLike(column: str, pattern: str) -> Self
```

Adds the NOT LIKE pattern. % and _ retain wildcard meaning.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `pattern` | LIKE/ILIKE or engine regular-expression pattern; bound as a value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Case sensitivity depends on operator, dialect and collation. The compiler adapts ILIKE through SQLAlchemy; it does not promise identical collation across engines.

```python
from orionis.support.facades import DB

query = DB.table("products").whereNotLike("name", "%orionis%")
```

<a id="api-whereilike"></a>

### `whereILike()`

```text
whereILike(column: str, pattern: str) -> Self
```

Adds the ILIKE pattern. % and _ retain wildcard meaning.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `pattern` | LIKE/ILIKE or engine regular-expression pattern; bound as a value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Case sensitivity depends on operator, dialect and collation. The compiler adapts ILIKE through SQLAlchemy; it does not promise identical collation across engines.

```python
from orionis.support.facades import DB

query = DB.table("products").whereILike("name", "%orionis%")
```

<a id="api-wherenotilike"></a>

### `whereNotILike()`

```text
whereNotILike(column: str, pattern: str) -> Self
```

Adds the NOT ILIKE pattern. % and _ retain wildcard meaning.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `pattern` | LIKE/ILIKE or engine regular-expression pattern; bound as a value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Case sensitivity depends on operator, dialect and collation. The compiler adapts ILIKE through SQLAlchemy; it does not promise identical collation across engines.

```python
from orionis.support.facades import DB

query = DB.table("products").whereNotILike("name", "%orionis%")
```

<a id="api-wherestartswith"></a>

### `whereStartsWith()`

```text
whereStartsWith(column: str, value: str) -> Self
```

Finds text that starts with the literal value; the compiler uses LIKE with the corresponding prefix/suffix.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `value` | Option value or literal filter text. Limits/offsets must be nonnegative integers and cannot be bool. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Autoescape is not enabled: % and _ within the value retain wildcard semantics.

```python
from orionis.support.facades import DB

query = DB.table("products").whereStartsWith("name", "Orionis")
```

<a id="api-whereendswith"></a>

### `whereEndsWith()`

```text
whereEndsWith(column: str, value: str) -> Self
```

Finds text that ends with the literal value; the compiler uses LIKE with the corresponding prefix/suffix.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `value` | Option value or literal filter text. Limits/offsets must be nonnegative integers and cannot be bool. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Autoescape is not enabled: % and _ within the value retain wildcard semantics.

```python
from orionis.support.facades import DB

query = DB.table("products").whereEndsWith("name", "kit")
```

<a id="api-wherecontains"></a>

### `whereContains()`

```text
whereContains(column: str, value: str) -> Self
```

Finds text that contains the literal value; the compiler uses LIKE with the corresponding prefix/suffix.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `value` | Option value or literal filter text. Limits/offsets must be nonnegative integers and cannot be bool. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Autoescape is not enabled: % and _ within the value retain wildcard semantics.

```python
from orionis.support.facades import DB

query = DB.table("products").whereContains("name", "pro")
```

<a id="api-whereregexpmatch"></a>

### `whereRegexpMatch()`

```text
whereRegexpMatch(column: str, pattern: str) -> Self
```

Matches a regular expression using the dialect’s regexp_match operation.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `pattern` | LIKE/ILIKE or engine regular-expression pattern; bound as a value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

Regex language and availability depend on the engine. Compilable syntax does not guarantee server support.

```python
from orionis.support.facades import DB

query = DB.table("products").whereRegexpMatch("name", "^Orionis")
```

<a id="api-wherecolumn"></a>

### `whereColumn()`

```text
whereColumn(first: str, operator: str, second: str) -> Self
```

Compares two column references with AND; the second operand is not a bound value.

| Parameter | Use |
| --- | --- |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The operator is validated against SUPPORTED_OPERATORS; column names must come from the application.

```python
from orionis.support.facades import DB

query = DB.table("products").whereColumn("stock", ">=", "reserved")
```

<a id="api-orwherecolumn"></a>

### `orWhereColumn()`

```text
orWhereColumn(first: str, operator: str, second: str) -> Self
```

Compares two column references with OR; the second operand is not a bound value.

| Parameter | Use |
| --- | --- |
| `first` | Left ON column, or synchronous callback receiving JoinClause. |
| `operator` | Comparison operator. Basic conditions validate it against SUPPORTED_OPERATORS. |
| `second` | Right-hand column reference, not a user value. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The operator is validated against SUPPORTED_OPERATORS; column names must come from the application.

```python
from orionis.support.facades import DB

query = DB.table("products").orWhereColumn("stock", ">=", "reserved")
```

<a id="api-whereraw"></a>

### `whereRaw()`

```text
whereRaw(sql: str, bindings: dict[str, Any] | None=None) -> Self
```

Adds a trusted SQL expression with AND, keeping named parameters separate.

| Parameter | Use |
| --- | --- |
| `sql` | Developer-authored SQL fragment; variable values go through bindings. |
| `bindings` | Dictionary of named :name parameters. None adds no bindings. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The builder copies the bindings dictionary. SQL fragment syntax remains the developer’s responsibility.

```python
from orionis.support.facades import DB

query = DB.table("products").whereRaw("price >= :minimum", {"minimum": 10})
```

<a id="api-orwhereraw"></a>

### `orWhereRaw()`

```text
orWhereRaw(sql: str, bindings: dict[str, Any] | None=None) -> Self
```

Adds a trusted SQL expression with OR, keeping named parameters separate.

| Parameter | Use |
| --- | --- |
| `sql` | Developer-authored SQL fragment; variable values go through bindings. |
| `bindings` | Dictionary of named :name parameters. None adds no bindings. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

The builder copies the bindings dictionary. SQL fragment syntax remains the developer’s responsibility.

```python
from orionis.support.facades import DB

query = DB.table("products").orWhereRaw("price >= :minimum", {"minimum": 10})
```

<a id="api-having"></a>

### `having()`

```text
having(column: Any, *args: Any) -> Self
```

Adds a post-grouping AND filter. Shares where() calling forms.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `args` | One value for equality, or two arguments (operator, value). Dictionary and callback forms need neither. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

A callback collects its where conditions into a HAVING group; it does not add a subquery.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").groupBy("category_id").having("category_id", ">", 0)
```

<a id="api-orhaving"></a>

### `orHaving()`

```text
orHaving(column: Any, *args: Any) -> Self
```

Adds a post-grouping OR filter. Shares where() calling forms.

| Parameter | Use |
| --- | --- |
| `column` | Operation column; where/having also accept an equality dictionary or grouping callback. |
| `args` | One value for equality, or two arguments (operator, value). Dictionary and callback forms need neither. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

A callback collects its where conditions into a HAVING group; it does not add a subquery.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").groupBy("category_id").orHaving("category_id", ">", 0)
```

<a id="api-havingraw"></a>

### `havingRaw()`

```text
havingRaw(sql: str, bindings: dict[str, Any] | None=None) -> Self
```

Adds a HAVING condition with trusted SQL and named bindings; combined with AND.

| Parameter | Use |
| --- | --- |
| `sql` | Developer-authored SQL fragment; variable values go through bindings. |
| `bindings` | Dictionary of named :name parameters. None adds no bindings. |

**Result:** the same mutable builder (`Self`); does not execute SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").groupBy("category_id").havingRaw("COUNT(*) > :minimum", {"minimum": 1})
```

[DB facade](/en/database/db-facade) · [ORM queries](/en/orm/querying) · [Testing scenario](/en/orm/testing)
