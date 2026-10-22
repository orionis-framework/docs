---
title: "Collections and pagination"
description: "Collections and pagination in Orionis Framework."
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
    async def __call__(self) -> JSONResponse:
        page = await Article.where("published", True).orderBy("id").paginate(per_page=20)
        return JSONResponse(page.toDict())
```

## Query pagination


<a id="modelquerybuilder-paginate"></a>

### `paginate`

```text
async def paginate(self, page: int=1, per_page: int=_DEFAULT_PER_PAGE) -> Paginator
```

Async terminal with `page=1`, `per_page=15` (`_DEFAULT_PER_PAGE` in source): requires positive integers excluding bool, otherwise `InvalidQueryException`. Applies OFFSET/LIMIT to the builder, counts/retrieves rows and returns `Paginator`. Inside a transaction runs both sequentially on the transactional connection; outside runs them through gather with pooled connections. No consistent snapshot between the two is guaranteed outside a transaction.

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
def __init__(self, items: Collection, total: int, page: int, per_page: int) -> None
```

Wraps a `Collection` without querying SQL. `page` and `per_page` must be positive int values excluding bool (`ValueError`). `total` is converted to int and clamped to zero. Does not clamp a page above lastPage.

```python
from orionis.orm import Collection, Paginator

page = Paginator(Collection([{"id": 1}]), total=11, page=1, per_page=10)
```

<a id="paginator-items"></a>

### `items`

```text
def items(self) -> Collection
```

Read-only property: the same page Collection; its mutators can still change it.

```python
items = page.items
```

<a id="paginator-total"></a>

### `total`

```text
def total(self) -> int
```

Int property: total counted rows, not current page length.

```python
assert page.total == 11
```

<a id="paginator-page"></a>

### `page`

```text
def page(self) -> int
```

Int property: current page starting at 1.

```python
assert page.page == 1
```

<a id="paginator-perpage"></a>

### `perPage`

```text
def perPage(self) -> int
```

Int property: configured size even if the last page contains fewer rows.

```python
assert page.perPage == 10
```

<a id="paginator-lastpage"></a>

### `lastPage`

```text
def lastPage(self) -> int
```

Int property: ceil(total/perPage), at least 1 even for total=0.

```python
assert page.lastPage == 2
```

<a id="paginator-hasnext"></a>

### `hasNext`

```text
def hasNext(self) -> bool
```

Bool property: page*perPage < total. Does not build links or retrieve another page.

```python
assert page.hasNext is True
```

<a id="paginator-hasprevious"></a>

### `hasPrevious`

```text
def hasPrevious(self) -> bool
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

## Complete Collection API used by ORM

All examples operate in memory. `Article` and `Team` are defined in the model/relationship guides. Callbacks are synchronous: map/filter/each do not await coroutines.

Mutators such as `merge`, `push`, `forget`, `put`, `sort`, `reverse`, `reject`, `transform`, `each` and `random(count>0)` change the same collection; contained models remain the same instances. They do not automatically persist SQL changes. New collections are shallow copies of their elements.


<a id="collection---init--"></a>

### `__init__`

```text
def __init__(self, items: list[Any] | None=None) -> None
```

Builds an in-memory collection; `items=None` makes it empty. A nonempty list is retained by reference: pass `.copy()` to isolate it. `ModelCollection` is the same type, not a persistence subclass.

```python
values = Collection([1, 2, 3])
```

<a id="collection-take"></a>

### `take`

```text
def take(self, number: int) -> Collection
```

Returns a new collection of the first `number` items; a negative value takes from the end and zero returns empty. Does not query or limit SQL.

```python
assert Collection([1, 2, 3]).take(-2).all() == [2, 3]
```

<a id="collection-first"></a>

### `first`

```text
def first(self, callback: Callable | None=None) -> object
```

First item or `None`; with a callback returns the first match. Noncallable callbacks raise `ValueError`; callback exceptions propagate.

```python
assert Collection([1, 2, 3]).first(lambda n: n > 1) == 2
```

<a id="collection-last"></a>

### `last`

```text
def last(self, callback: Callable | None=None) -> object
```

Last item/match or `None`. With a callback scans in order and remembers the last matching item.

```python
assert Collection([1, 2, 3]).last(lambda n: n < 3) == 2
```

<a id="collection-all"></a>

### `all`

```text
def all(self) -> list[Any]
```

Returns the underlying list, not a copy or serialization. For `pluck(..., key)`/`groupBy`, returns the stored mapping despite the list annotation.

```python
raw = Collection([1, 2]).all()
assert raw == [1, 2]
```

<a id="collection-avg"></a>

### `avg`

```text
def avg(self, key: str | None=None) -> float
```

In-memory numeric average with an optional dict/attribute key; empty input or TypeError returns `0`. Not an SQL aggregate and does not load absent columns.

```python
assert Collection([{"score": 2}, {"score": 4}]).avg("score") == 3
```

<a id="collection-max"></a>

### `max`

```text
def max(self, key: str | None=None) -> object
```

In-memory maximum, optionally by key; empty input or incompatible comparison returns `0`.

```python
assert Collection([2, 4]).max() == 4
```

<a id="collection-min"></a>

### `min`

```text
def min(self, key: str | None=None) -> object
```

In-memory minimum, optionally by key; empty input or incompatible comparison returns `0`.

```python
assert Collection([2, 4]).min() == 2
```

<a id="collection-chunk"></a>

### `chunk`

```text
def chunk(self, size: int) -> Collection
```

New collection of subcollections of `size`; nonpositive sizes raise `ValueError`. Splits loaded results, not SQL batches.

```python
chunks = Collection([1, 2, 3]).chunk(2)
assert chunks[0].all() == [1, 2]
```

<a id="collection-collapse"></a>

### `collapse`

```text
def collapse(self) -> Collection
```

Flattens one level of lists/collections into a new collection. Noniterable scalar entries may raise `TypeError`; use `flatten` for deeply nested lists/dicts.

```python
assert Collection([[1, 2], [3]]).collapse().all() == [1, 2, 3]
```

<a id="collection-contains"></a>

### `contains`

```text
def contains(self, key: str | Callable, value: object=None) -> bool
```

Membership bool for a direct value, callback or key/value. `value=None` means no second argument; use a callback to match a null attribute.

```python
assert Collection([{"id": 2}]).contains("id", 2)
```

<a id="collection-count"></a>

### `count`

```text
def count(self) -> int
```

Count of already loaded items. Does not issue SQL COUNT.

```python
assert Collection([1, 2]).count() == 2
```

<a id="collection-diff"></a>

### `diff`

```text
def diff(self, items: list[Any] | Collection) -> Collection
```

New collection of items absent from the compared list/collection. Uses equality; handles unhashable values through sequential comparison.

```python
assert Collection([1, 2]).diff([2]).all() == [1]
```

<a id="collection-each"></a>

### `each`

```text
def each(self, callback: Callable) -> Collection
```

**Replaces** each position with the callback's truthy return and stops at its first falsy return without replacing that position. Returns self. It is not a side-effect loop for callbacks returning None.

```python
values = Collection([1, 2, 3])
assert values.each(lambda n: n * 2).all() == [2, 4, 6]
```

<a id="collection-every"></a>

### `every`

```text
def every(self, callback: Callable) -> bool
```

Bool indicating every item satisfies the callback; empty input returns `True`. Invalid callbacks raise `ValueError`.

```python
assert Collection([2, 4]).every(lambda n: n % 2 == 0)
```

<a id="collection-filter"></a>

### `filter`

```text
def filter(self, callback: Callable) -> Collection
```

New collection of items with truthy callback results. Callback is required; invalid callbacks raise `ValueError`.

```python
assert Collection([1, 2, 3]).filter(lambda n: n > 1).all() == [2, 3]
```

<a id="collection-flatten"></a>

### `flatten`

```text
def flatten(self) -> Collection
```

New collection recursively flattening lists and dictionary values. Nested tuples/Collections remain items rather than being expanded.

```python
assert Collection([1, [2, {"x": 3}]]).flatten().all() == [1, 2, 3]
```

<a id="collection-forget"></a>

### `forget`

```text
def forget(self, *keys: int | str) -> Collection
```

Deletes indices/keys in descending order and returns self. Missing indices/keys propagate `IndexError`/`KeyError`; lists require integer indices.

```python
assert Collection([1, 2, 3]).forget(0, 2).all() == [2]
```

<a id="collection-forpage"></a>

### `forPage`

```text
def forPage(self, page: int, number: int) -> Collection
```

New sliced collection: clamps `page` to at least 1 and requires `number>0` (`ValueError`). Does not produce metadata or query extra rows.

```python
assert Collection([1, 2, 3]).forPage(2, 2).all() == [3]
```

<a id="collection-get"></a>

### `get`

```text
def get(self, key: int | str, default: object=None) -> object
```

Reads an index/key or default; callable defaults are called with no arguments only when missing. Catches `IndexError`/`KeyError`, not invalid index types.

```python
assert Collection([1]).get(7, lambda: "missing") == "missing"
```

<a id="collection-implode"></a>

### `implode`

```text
def implode(self, glue: str=',', key: str | None=None) -> str
```

Joins string representations using `glue=","`; `key=None` uses complete items. With objects/dicts and a key extracts that value. Empty returns `""`.

```python
assert Collection([{"name": "A"}, {"name": "B"}]).implode(" / ", "name") == "A / B"
```

<a id="collection-isempty"></a>

### `isEmpty`

```text
def isEmpty(self) -> bool
```

Length-based bool; does not query SQL existence.

```python
assert Collection().isEmpty()
```

<a id="collection-map"></a>

### `map`

```text
def map(self, callback: Callable) -> Collection
```

New collection with every callback result, including None/falsy values; does not mutate the original list.

```python
assert Collection([1, 2]).map(lambda n: n * 3).all() == [3, 6]
```

<a id="collection-mapinto"></a>

### `mapInto`

```text
def mapInto(self, cls: type, method: str | None=None, **kwargs: object) -> Collection
```

Maps through `cls(item)` or `cls.method(item, **kwargs)`; kwargs are passed only for a method. `cls` must be a type (`TypeError`); missing methods or per-item TypeError/AttributeError/ValueError become None. Does not persist models.

```python
assert Collection(["1", "bad"]).mapInto(int).all() == [1, None]
```

<a id="collection-merge"></a>

### `merge`

```text
def merge(self, items: list[Any] | Collection) -> Collection
```

Appends a list/Collection to the same object and returns self; no PK merge or deduplication. Unsupported types raise `TypeError`.

```python
assert Collection([1]).merge([1, 2]).all() == [1, 1, 2]
```

<a id="collection-pluck"></a>

### `pluck`

```text
def pluck(self, value: str, key: str | None=None) -> Collection
```

Extracts a dict path/attribute; without `key` returns a list omitting None. With `key` returns a dict-backed Collection, overwriting duplicate keys and preserving null values. Read that mapping with `.all()`/`.get()`.

```python
assert Collection([{"id": 1, "name": "A"}]).pluck("name", "id").all() == {1: "A"}
```

<a id="collection-pop"></a>

### `pop`

```text
def pop(self) -> object
```

Removes and returns the last item; empty returns None.

```python
values = Collection([1, 2])
assert values.pop() == 2
```

<a id="collection-prepend"></a>

### `prepend`

```text
def prepend(self, value: object) -> Collection
```

Prepends to the same object and returns self.

```python
assert Collection([2]).prepend(1).all() == [1, 2]
```

<a id="collection-pull"></a>

### `pull`

```text
def pull(self, key: int | str) -> object
```

Reads then removes an index/key. Although it starts with `get`, removing an absent key subsequently raises IndexError/KeyError; check presence first.

```python
values = Collection([1, 2])
assert values.pull(0) == 1
```

<a id="collection-push"></a>

### `push`

```text
def push(self, value: object) -> Collection
```

Appends to the same object and returns self. Does not save entities.

```python
assert Collection([1]).push(2).all() == [1, 2]
```

<a id="collection-put"></a>

### `put`

```text
def put(self, key: int | str, value: object) -> Collection
```

Replaces an index/key on the same object and returns self. Does not extend a list past its range: raises IndexError.

```python
assert Collection([1]).put(0, 2).all() == [2]
```

<a id="collection-random"></a>

### `random`

```text
def random(self, count: int | None=None) -> object | Collection | None
```

Empty returns None. Omitted count or `0` returns one item using secrets.choice. Positive count replaces items with a sample and returns self; negative or oversized count raises ValueError. Do not use it for unique persisted identities.

```python
sample = Collection([1, 2, 3]).random(2)
assert len(sample) == 2
```

<a id="collection-reduce"></a>

### `reduce`

```text
def reduce(self, callback: Callable, initial: object=0) -> object
```

Reduces with callback(accumulator, item) and initial=0. Returns a scalar/object; callback errors propagate.

```python
assert Collection([1, 2, 3]).reduce(lambda total, n: total + n, 0) == 6
```

<a id="collection-reject"></a>

### `reject`

```text
def reject(self, callback: Callable) -> Collection
```

Removes items with truthy callback results from the same object and returns self. Unlike filter, mutates the original.

```python
assert Collection([1, 2, 3]).reject(lambda n: n == 2).all() == [1, 3]
```

<a id="collection-reverse"></a>

### `reverse`

```text
def reverse(self) -> Collection
```

Reverses the same object and returns self.

```python
assert Collection([1, 2]).reverse().all() == [2, 1]
```

<a id="collection-serialize"></a>

### `serialize`

```text
def serialize(self) -> list[Any]
```

Returns a list of item.serialize(), otherwise to_dict(), otherwise the original item. Models honor hidden/appends; relationships are not automatically included. Dict-backed collections iterate keys: use all() to obtain the mapping.

```python
assert Collection([{"id": 1}]).serialize() == [{"id": 1}]
```

<a id="collection-shift"></a>

### `shift`

```text
def shift(self) -> object
```

Removes index 0 through pull. Empty collections can raise IndexError; check isEmpty first.

```python
values = Collection([1, 2])
assert values.shift() == 1
```

<a id="collection-sort"></a>

### `sort`

```text
def sort(self, key: str | None=None) -> Collection
```

Sorts the same object ascending by optional key or complete items. Returns self; incomparable values propagate TypeError. No descending argument exists.

```python
assert Collection([3, 1, 2]).sort().all() == [1, 2, 3]
```

<a id="collection-sum"></a>

### `sum`

```text
def sum(self, key: str | None=None) -> float
```

In-memory sum, optionally by key; TypeError returns 0. An empty key extraction falls back to full items, so avoid missing keys.

```python
assert Collection([{"points": 2}, {"points": 4}]).sum("points") == 6
```

<a id="collection-tojson"></a>

### `toJson`

```text
def toJson(self, **kwargs: object) -> str
```

json.dumps(serialize(), **kwargs); does not automatically add default=str. Supply default=str for datetime/UUID or an encoder; standard errors propagate.

```python
text = Collection([{"id": 1}]).toJson(ensure_ascii=False, default=str)
```

<a id="collection-groupby"></a>

### `groupBy`

```text
def groupBy(self, key: str) -> Collection
```

Sorts by key and returns a dict-backed Collection mapping value→list. Not SQL GROUP BY. Incomparable grouping values or unhashable keys may raise TypeError; use all() to consume groups.

```python
groups = Collection([{"kind": "a", "id": 1}]).groupBy("kind").all()
assert groups["a"][0]["id"] == 1
```

<a id="collection-transform"></a>

### `transform`

```text
def transform(self, callback: Callable) -> Collection
```

Replaces every item with callback results and returns self, including None. map creates another collection; transform mutates this one.

```python
assert Collection([1, 2]).transform(lambda n: n + 1).all() == [2, 3]
```

<a id="collection-unique"></a>

### `unique`

```text
def unique(self, key: str | None=None) -> Collection
```

New collection of unique values, optionally by key; preserves first occurrences and handles unhashable items. A dict-backed collection with key returns self unfiltered.

```python
assert Collection([1, 1, 2]).unique().all() == [1, 2]
```

<a id="collection-where"></a>

### `where`

```text
def where(self, key: str, *args: object) -> Collection
```

In-memory filter: (key,value) or (key,operator,value), operators <, <=, ==, !=, >, >=. Missing values raise ValueError; unsupported operators skip items as per-item errors are caught. SQL "=" is not equivalent. Incompatible comparisons attempt text.

```python
assert Collection([{"id": 1}, {"id": 2}]).where("id", ">", 1).count() == 1
```

<a id="collection-wherein"></a>

### `whereIn`

```text
def whereIn(self, key: str, values: list[Any] | Collection) -> Collection
```

New collection by key membership in list/Collection. Also compares str representations, so 1 may match "1". Not strict SQL comparison.

```python
assert Collection([{"id": 1}]).whereIn("id", ["1"]).count() == 1
```

<a id="collection-wherenotin"></a>

### `whereNotIn`

```text
def whereNotIn(self, key: str, values: list[Any] | Collection) -> Collection
```

Complement of whereIn including its text comparison; returns a new collection.

```python
assert Collection([{"id": 1}, {"id": 2}]).whereNotIn("id", [1]).count() == 1
```

<a id="collection-zip"></a>

### `zip`

```text
def zip(self, items: list[Any] | Collection) -> Collection
```

New collection of pairs up to the shorter length. Only list/Collection is accepted; other types raise TypeError.

```python
assert Collection([1, 2]).zip(["a"]).all() == [[1, "a"]]
```

<a id="collection-setappends"></a>

### `setAppends`

```text
def setAppends(self, appends: list[str]) -> Collection
```

Adds names to item serialization without changing class appends. Returns self; models use getAttribute and honor hidden. Does not calculate or query relationships.

```python
rows = Collection([Article({"title": "Guide"})]).setAppends(["label"])
assert rows.serialize()[0]["label"] == "GUIDE"
```

<a id="collection-addrelation"></a>

### `addRelation`

```text
def addRelation(self, relation_data: dict[str, Any]) -> Collection
```

For each item exposing setRelation, stores all supplied mapping pairs and returns self. Neither executes eager loading nor automatically adds those relations to toDict.

```python
rows = Collection([Team({"name": "A"})])
rows.addRelation({"players": Collection()})
assert rows[0].relationLoaded("players")
```

<a id="collection-python-protocol"></a>

## Python protocol

Iterate with `for`, use `len`, compare collections/lists, read negative indices and slices (`rows[:10]` makes a new Collection), assign with `rows[0] = value` and delete with `del rows[0]`. Index/read/write/delete propagate underlying list/dict errors. Ordering comparisons use element lexicographic order, not PKs or SQL order. `hash(rows)` only works when every element is hashable; do not use a mutable collection as a key and subsequently change it.

`groupBy` and `pluck(value, key)` can create dict-backed storage despite list constructor/type annotations; iteration produces keys. Use `.all()` for that mapping rather than treating it as a model list or queryset `serialize()` result.
