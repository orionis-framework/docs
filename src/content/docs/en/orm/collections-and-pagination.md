---
title: "Collections and pagination"
description: "Paginate model queries, stream ordered batches and work with collections of hydrated models."
editUrl: true
lastUpdated: false
---

<a id="collection-alias"></a>

<a id="paginator-python-protocol"></a>

`get()` returns the framework-wide `Collection`. `from orionis.orm import Collection, ModelCollection` exports two names for the **same type**. Operations work in memory: `collection.where(...)` does not add SQL WHERE and `collection.count()` does not issue COUNT. Filter and paginate in the builder before loading large tables.

## Controller example

```python
from orionis.http import JSONResponse
from app.models.article import Article


class ArticleListController:
    async def __call__(self, number: int) -> JSONResponse:
        if number < 1:
            return JSONResponse({"error": "Page must be positive"}, status_code=400)
        query = Article.where("published", True).orderBy("id")
        page = await query.paginate(page=number, per_page=20)
        return JSONResponse(page.toDict())
```

Save the controller in `app/http/controllers/article_list_controller.py` and register it in your routing file. A request to `/articles/page/2` reads the next 20 published articles.

```python
from app.http.controllers.article_list_controller import ArticleListController
from orionis.support.facades import Route

Route.get("/articles/page/{number:int}", ArticleListController)
```

<a id="query-chunks"></a>

## Read database results in batches

Query builders expose `chunks(size: int = 1000) -> AsyncIterator[Collection]`. Consume it with `async for`; do not await the iterator itself. It works on model queries and `DB.table(...)`:

```python
from orionis.support.facades import DB


async def count_export_rows() -> int:
    total = 0
    query = DB.table("articles").orderBy("id")
    async for batch in query.chunks(500):
        total += len(batch)
    return total
```

Run this inside a booted application with an `articles` table. For model batches, use `Article.query().orderBy("id").chunks(500)` with the model from the querying guide. Every batch follows `get()`, including casts, global scopes, retrieved events and eager loading.

- `size` must be a positive integer, excluding booleans; invalid sizes raise `ValueError`.
- Supply an explicit, deterministic order, preferably ending in a unique key. Without an order, iteration raises `InvalidQueryException`.
- Existing `limit()` and `offset()` are honored; iteration clones the query and leaves its original plan unchanged.
- This uses LIMIT/OFFSET pagination, not a server-side cursor. Concurrent inserts or deletes can shift rows; use an appropriate transaction snapshot when consistency is required.
- The query releases its cursor before yielding. A caller-owned transaction still owns its connection. Close an iterator with `contextlib.aclosing()` if exiting early.

Keeping batches in a list defeats the memory benefit. Relations may add memory beyond the batch's row count. `get()` still materializes its result, while [`Collection.chunk()`](/en/utilities/helpers/collection#collection-method-chunk) only splits data already loaded into memory.

## Query pagination


<a id="modelquerybuilder-paginate"></a>

### `paginate`

```text
async def paginate(self, page: int = 1, per_page: int = 15) -> Paginator[TModel]
```

Async terminal with `page=1`, `per_page=15`: requires positive integers excluding bool, otherwise `InvalidQueryException`. Applies OFFSET/LIMIT to the builder, counts/retrieves rows and returns `Paginator`. Inside a transaction runs both sequentially on the transactional connection; outside runs them through gather with pooled connections. No consistent snapshot between the two is guaranteed outside a transaction.

```python
async def article_page(page_number: int = 1):
    page = await Article.orderBy("id").paginate(page=page_number, per_page=20)
    return page.toDict()
```

Order by a deterministic key, especially across pages. Pagination uses offset, not cursor/keyset. Out-of-range pages return empty items and keep the requested page number. COUNT and items can observe concurrent changes; use a transaction with appropriate engine isolation when a consistent view is required.

## Paginator API

Property examples assume `page = Paginator(Collection([{"id": 1}]), total=11, page=1, per_page=10)`. `len(page)` is the current item count, not `total`; repr shows page/perPage/total. It is neither a builder nor a Response.


<a id="paginator---init--"></a>

### `__init__`

```text
def __init__(self, items: Collection[TItem], total: int, page: int, per_page: int) -> None
```

Wraps a `Collection` without querying SQL. `page` and `per_page` must be positive int values excluding bool (`ValueError`). `total` is converted to int and clamped to zero. Does not clamp a page above lastPage.

```python
from orionis.orm import Collection, Paginator

page = Paginator(Collection([{"id": 1}]), total=11, page=1, per_page=10)
```

<a id="paginator-items"></a>

### `items`

```text
page.items: Collection[TItem]
```

Read-only property: the same page Collection; its mutators can still change it.

```python
items = page.items
```

<a id="paginator-total"></a>

### `total`

```text
page.total: int
```

Int property: total counted rows, not current page length.

```python
assert page.total == 11
```

<a id="paginator-page"></a>

### `page`

```text
page.page: int
```

Int property: current page starting at 1.

```python
assert page.page == 1
```

<a id="paginator-perpage"></a>

### `perPage`

```text
page.perPage: int
```

Int property: configured size even if the last page contains fewer rows.

```python
assert page.perPage == 10
```

<a id="paginator-lastpage"></a>

### `lastPage`

```text
page.lastPage: int
```

Int property: ceil(total/perPage), at least 1 even for total=0.

```python
assert page.lastPage == 2
```

<a id="paginator-hasnext"></a>

### `hasNext`

```text
page.hasNext: bool
```

Bool property: page*perPage < total. Does not build links or retrieve another page.

```python
assert page.hasNext is True
```

<a id="paginator-hasprevious"></a>

### `hasPrevious`

```text
page.hasPrevious: bool
```

Bool property: page > 1, including when the current page is out of range.

```python
assert page.hasPrevious is False
```

<a id="paginator-todict"></a>

### `toDict`

```text
def toDict(self) -> dict[str, Any]
```

Returns a dict with serialized items and total, page, perPage, lastPage, hasNext, hasPrevious. Does not include URLs or cursors.

```python
assert page.toDict()["items"] == [{"id": 1}]
```

<a id="paginator-tojson"></a>

### `toJson`

```text
def toJson(self, **kwargs: Any) -> str
```

Serializes toDict with json.dumps and default=str unless overridden in kwargs. Returns JSON text.

```python
text = page.toJson(indent=2, ensure_ascii=False)
```

<a id="complete-collection-api-used-by-orm"></a>

## Working with hydrated models

For a published-article index, project only the fields you need in SQL. After `get()`, you can index the models by ID or extract a list of titles without another query.

```python
from app.models.article import Article


async def titles_by_id() -> dict:
    articles = await (
        Article.where("published", True)
        .select("id", "title")
        .orderBy("id")
        .get()
    )
    return articles.pluck("title", "id").all()
```

With a key, `pluck("title", "id").all()` returns a dictionary. Without a key, `pluck("title").all()` returns a list. Changes to the collection stay in memory. Use `await article.save()` to persist an edited model. For JSON output, `articles.serialize()` calls each model’s serializer and respects its hidden attributes.

| Task | Collection methods |
| --- | --- |
| Construct and read | <a id="collection---init--"></a><a id="__init__-1"></a>[`__init__`](/en/utilities/helpers/collection#collection-method-init), <a id="collection-get"></a><a id="get"></a>[`get`](/en/utilities/helpers/collection#collection-method-get), <a id="collection-all"></a><a id="all"></a>[`all`](/en/utilities/helpers/collection#collection-method-all), <a id="collection-first"></a><a id="first"></a>[`first`](/en/utilities/helpers/collection#collection-method-first), <a id="collection-last"></a><a id="last"></a>[`last`](/en/utilities/helpers/collection#collection-method-last), <a id="collection-take"></a><a id="take"></a>[`take`](/en/utilities/helpers/collection#collection-method-take), <a id="collection-count"></a><a id="count"></a>[`count`](/en/utilities/helpers/collection#collection-method-count), <a id="collection-contains"></a><a id="contains"></a>[`contains`](/en/utilities/helpers/collection#collection-method-contains), <a id="collection-isempty"></a><a id="isempty"></a>[`isEmpty`](/en/utilities/helpers/collection#collection-method-isempty), <a id="collection-every"></a><a id="every"></a>[`every`](/en/utilities/helpers/collection#collection-method-every) |
| Filter and project | <a id="collection-where"></a><a id="where"></a>[`where`](/en/utilities/helpers/collection#collection-method-where), <a id="collection-wherein"></a><a id="wherein"></a>[`whereIn`](/en/utilities/helpers/collection#collection-method-wherein), <a id="collection-wherenotin"></a><a id="wherenotin"></a>[`whereNotIn`](/en/utilities/helpers/collection#collection-method-wherenotin), <a id="collection-filter"></a><a id="filter"></a>[`filter`](/en/utilities/helpers/collection#collection-method-filter), <a id="collection-pluck"></a><a id="pluck"></a>[`pluck`](/en/utilities/helpers/collection#collection-method-pluck), <a id="collection-map"></a><a id="map"></a>[`map`](/en/utilities/helpers/collection#collection-method-map), <a id="collection-mapinto"></a><a id="mapinto"></a>[`mapInto`](/en/utilities/helpers/collection#collection-method-mapinto), <a id="collection-unique"></a><a id="unique"></a>[`unique`](/en/utilities/helpers/collection#collection-method-unique) |
| Split and combine | <a id="collection-chunk"></a><a id="chunk"></a>[`chunk`](/en/utilities/helpers/collection#collection-method-chunk), <a id="collection-forpage"></a><a id="forpage"></a>[`forPage`](/en/utilities/helpers/collection#collection-method-forpage), <a id="collection-groupby"></a><a id="groupby"></a>[`groupBy`](/en/utilities/helpers/collection#collection-method-groupby), <a id="collection-collapse"></a><a id="collapse"></a>[`collapse`](/en/utilities/helpers/collection#collection-method-collapse), <a id="collection-flatten"></a><a id="flatten"></a>[`flatten`](/en/utilities/helpers/collection#collection-method-flatten), <a id="collection-diff"></a><a id="diff"></a>[`diff`](/en/utilities/helpers/collection#collection-method-diff), <a id="collection-zip"></a><a id="zip"></a>[`zip`](/en/utilities/helpers/collection#collection-method-zip) |
| Calculate values | <a id="collection-sum"></a><a id="sum"></a>[`sum`](/en/utilities/helpers/collection#collection-method-sum), <a id="collection-avg"></a><a id="avg"></a>[`avg`](/en/utilities/helpers/collection#collection-method-avg), <a id="collection-min"></a><a id="min"></a>[`min`](/en/utilities/helpers/collection#collection-method-min), <a id="collection-max"></a><a id="max"></a>[`max`](/en/utilities/helpers/collection#collection-method-max), <a id="collection-reduce"></a><a id="reduce"></a>[`reduce`](/en/utilities/helpers/collection#collection-method-reduce), <a id="collection-implode"></a><a id="implode"></a>[`implode`](/en/utilities/helpers/collection#collection-method-implode) |
| Change items or order | <a id="collection-each"></a><a id="each"></a>[`each`](/en/utilities/helpers/collection#collection-method-each), <a id="collection-merge"></a><a id="merge"></a>[`merge`](/en/utilities/helpers/collection#collection-method-merge), <a id="collection-push"></a><a id="push"></a>[`push`](/en/utilities/helpers/collection#collection-method-push), <a id="collection-put"></a><a id="put"></a>[`put`](/en/utilities/helpers/collection#collection-method-put), <a id="collection-forget"></a><a id="forget"></a>[`forget`](/en/utilities/helpers/collection#collection-method-forget), <a id="collection-reject"></a><a id="reject"></a>[`reject`](/en/utilities/helpers/collection#collection-method-reject), <a id="collection-transform"></a><a id="transform"></a>[`transform`](/en/utilities/helpers/collection#collection-method-transform), <a id="collection-prepend"></a><a id="prepend"></a>[`prepend`](/en/utilities/helpers/collection#collection-method-prepend), <a id="collection-pop"></a><a id="pop"></a>[`pop`](/en/utilities/helpers/collection#collection-method-pop), <a id="collection-pull"></a><a id="pull"></a>[`pull`](/en/utilities/helpers/collection#collection-method-pull), <a id="collection-shift"></a><a id="shift"></a>[`shift`](/en/utilities/helpers/collection#collection-method-shift), <a id="collection-sort"></a><a id="sort"></a>[`sort`](/en/utilities/helpers/collection#collection-method-sort), <a id="collection-reverse"></a><a id="reverse"></a>[`reverse`](/en/utilities/helpers/collection#collection-method-reverse), <a id="collection-random"></a><a id="random"></a>[`random`](/en/utilities/helpers/collection#collection-method-random) |
| Prepare output | <a id="collection-serialize"></a><a id="serialize"></a>[`serialize`](/en/utilities/helpers/collection#collection-method-serialize), <a id="collection-tojson"></a><a id="tojson-1"></a>[`toJson`](/en/utilities/helpers/collection#collection-method-tojson), <a id="collection-setappends"></a><a id="setappends"></a>[`setAppends`](/en/utilities/helpers/collection#collection-method-setappends), <a id="collection-addrelation"></a><a id="addrelation"></a>[`addRelation`](/en/utilities/helpers/collection#collection-method-addrelation) |

<a id="collection-python-protocol"></a>
<a id="python-protocol"></a>

Iteration over a list-backed collection yields the models. Slicing returns a collection that shares those model instances. Keyed operations such as `groupBy` produce dictionary-backed collections and iteration yields their keys. [Collection reference](/en/utilities/helpers/collection)
