---
title: "Collection"
description: "Complete reference for the in-memory Collection: construction, transformations, filtering, mutation, aggregation, serialization, and Python protocols."
editUrl: true
lastUpdated: false
---

`Collection` wraps data already loaded in memory. Import it from `orionis.support.types`; `orionis.support.types.collection.Collection` is the same class. Filtering a collection does not execute SQL.

## Construction and data ownership

<a id="collection-method-init"></a>

### `Collection(items: list[Any] | None = None)` — `__init__`

The initializer `__init__(self, items: list[Any] | None = None) -> None` creates an instance with an empty appends list. `None`, an omitted argument, or any falsy input becomes a fresh empty list. A nonempty list is stored by reference, without copying or validating its elements. The implementation also retains other truthy inputs unchanged; this does not make every operation compatible with their type. In particular, `pluck(value, key)` and `groupBy(key)` intentionally produce dictionary-backed collections. Read their results through `all()` or dictionary key access; iteration then yields dictionary keys, and list-only methods such as `push`, `sort`, `first`, slicing, and `pop` cannot be used as general dictionary operations. Empty dictionary results become `[]` because of the constructor's falsy-input rule.

```python
from orionis.support.types import Collection

assert Collection().all() == []
assert Collection(None).all() == []
source = [{"price": 8, "active": True}, {"price": 3, "active": False}]
products = Collection(source)
assert products.all() is source
total = products.where("active", True).sum("price")
assert total == 8
assert products.count() == 2
assert Collection({}).all() == []
empty = []
assert Collection(empty).all() is not empty
selected = products.filter(lambda product: product["active"])
assert selected is not products and selected[0] is source[0]
```

Use explicit construction when supplying application data: `Collection(payload)`. A constructor parameter annotated as `Collection` does not load request data, database rows, or another payload automatically. Pass the populated instance to your service explicitly, or configure its provider in your application's container.

Operations described as **new** allocate a collection but do not deep-copy nested objects. Most use `self.__class__`; `groupBy` explicitly returns the base `Collection`. New collections start with no serialization appends. **Same instance** means the method mutates and returns `self`.

| Result or effect | Methods |
| --- | --- |
| New collection | `take`, `chunk`, `collapse`, `diff`, `filter`, `flatten`, `forPage`, `map`, `mapInto`, `pluck`, `groupBy`, `where`, `whereIn`, `whereNotIn`, `zip`, slices; normally `unique` |
| Same instance | `each`, `forget`, `merge`, `prepend`, `push`, `put`, `reject`, `reverse`, `sort`, `transform`, `setAppends`, `addRelation`; `random(count)` when `count > 0` |
| Removes and returns an item | `pop`, `pull`, `shift` |
| Exposes the backing data | `all` |

`each`, `forget`, `merge`, `prepend`, `push`, `put`, `reverse`, `sort`, and bracket writes modify existing backing data. `reject`, `transform`, and positive-count `random` replace the instance's backing list, so an earlier `all()` reference no longer follows those replacements. `setAppends` changes serialization metadata; `addRelation` changes supported element objects.

## Explicit constructor injection

When a service needs a fixed, populated dataset, bind that exact instance before resolving the service. This isolated container example deliberately shares the same mutable collection across its resolutions. The binding supplies the values; the parameter annotation does not load a request payload automatically.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.types import Collection

class SalesContainer(Container):
    pass

class SalesReport:
    def __init__(self, rows: Collection) -> None:
        self.rows = rows

    def total(self) -> int:
        return self.rows.sum("price")

async def main() -> None:
    populated = Collection([{"price": 8}, {"price": 3}])
    container = SalesContainer()
    container.instance(Collection, populated)
    report = await container.make(SalesReport)
    assert report.rows is populated
    assert report.total() == 11

asyncio.run(main())
```

## Reading and testing items

<a id="collection-method-all"></a>

### `all() -> list[Any]`

Returns the actual backing structure, not a copy. Although annotated as a list, a dictionary-backed collection returns its dictionary.

<a id="collection-method-count"></a>

### `count() -> int`

Returns its length; this takes no value or predicate argument.

<a id="collection-method-isempty"></a>

### `isEmpty() -> bool`

Returns `not bool(collection)` through the length protocol.

```python
from orionis.support.types import Collection

items = Collection(["a", "b"])
items.all().append("c")
assert items.count() == 3
assert not items.isEmpty()
assert Collection().isEmpty()
```

<a id="collection-method-first"></a>

### `first(callback: Callable | None = None) -> object`

Returns the first item, or the first for which `callback(item)` is truthy. Stops after the first match. Returns `None` on an empty list or no match.

<a id="collection-method-last"></a>

### `last(callback: Callable | None = None) -> object`

Returns the last item or last matching item, otherwise `None`. With a callback it traverses all items. A matching `None` is indistinguishable from no match.

```python
from orionis.support.types import Collection

items = Collection([1, 2, 3, 4])
assert items.first() == 1
assert items.first(lambda item: item > 2) == 3
assert items.last() == 4
assert items.last(lambda item: item < 4) == 3
assert items.first(lambda item: item > 9) is None
assert items.last(lambda item: item > 9) is None
assert Collection().first() is None
assert Collection().last() is None
```

<a id="collection-method-get"></a>

### `get(key: int | str, default: object = None) -> object`

Reads through bracket access. Missing indices or dictionary keys (`IndexError`, `KeyError`) return the default; a callable default is invoked with no arguments only when missing. Negative list indices work. It does not interpret nested paths. Invalid list key types still raise `TypeError`; a slice works at runtime and returns a new collection.

```python
from orionis.support.types import Collection

items = Collection([10, 20])
assert items.get(0) == 10
assert items.get(-1) == 20
assert items.get(9) is None
assert items.get(9, "missing") == "missing"
assert items.get(9, lambda: "computed") == "computed"
assert items.get(slice(0, 1)).all() == [10]
assert Collection({"name": "Ada"}).get("name") == "Ada"
```

<a id="collection-method-contains"></a>

### `contains(key: str | Callable, value: object = None) -> bool`

Three forms: `contains(item)` uses ordinary membership; `contains(predicate)` tests `predicate(item)` until a truthy match; `contains(path, value)` compares the extracted value using Python equality. The third form is selected only when `value is not None`: to search for a `None` field, use a predicate. A callable first argument is always treated as a predicate when no non-`None` second value is supplied.

<a id="collection-method-every"></a>

### `every(callback: Callable) -> bool`

Evaluates `callback(item)` until a falsy result. An empty collection returns `True`.

```python
from orionis.support.types import Collection

assert Collection([1, 2, 3]).contains(2)
assert Collection([1, 2, 3]).contains(lambda item: item > 2)
rows = Collection([{"name": "Ada", "note": None}])
assert rows.contains("name", "Ada")
assert rows.contains(lambda row: row["note"] is None)
assert not rows.contains("note", None)
assert Collection([2, 4]).every(lambda item: item % 2 == 0)
assert Collection().every(lambda item: False)
```

## Callbacks and transformations

`first`, `last`, `each`, `every`, `filter`, `map`, `reject`, and `transform` validate callbacks and raise `ValueError` for a non-callable. Their callback receives **one item**, never an index/key. Exceptions raised inside it propagate. They call synchronously and do not await async callbacks. `reduce` has its own two-argument contract below.

<a id="collection-method-map"></a>

### `map(callback: Callable) -> Collection`

**New.** Stores every `callback(item)` result, including falsy values.

<a id="collection-method-filter"></a>

### `filter(callback: Callable) -> Collection`

**New.** Keeps items with a truthy `callback(item)` result. The callback is required; there is no parameterless truthiness filter.

<a id="collection-method-reject"></a>

### `reject(callback: Callable) -> Collection`

**Same instance.** Replaces the list with items whose callback result is falsy.

<a id="collection-method-transform"></a>

### `transform(callback: Callable) -> Collection`

**Same instance.** Replaces the list with all callback results, including `0`, `False`, and `None`.

<a id="collection-method-each"></a>

### `each(callback: Callable) -> Collection`

**Same instance.** Replaces each visited item with the callback's truthy result. A falsy result stops iteration **before replacing that item**; later items remain unchanged. A side-effect-only callback returning `None` therefore stops on the first item.

```python
from orionis.support.types import Collection

items = Collection([1, 2, 3])
assert items.map(lambda item: item - 1).all() == [0, 1, 2]
assert items.filter(lambda item: item > 1).all() == [2, 3]
assert items.all() == [1, 2, 3]
assert items.reject(lambda item: item == 2) is items
assert items.all() == [1, 3]
assert items.transform(lambda item: None) is items
assert items.all() == [None, None]
items = Collection([1, 2, 3])
assert items.each(lambda item: item * 10 if item < 2 else 0) is items
assert items.all() == [10, 2, 3]
```

<a id="collection-method-mapinto"></a>

### `mapInto(cls: type, method: str | None = None, **kwargs: object) -> Collection`

**New.** Without a truthy `method`, calls `cls(item)`; supplied `kwargs` are ignored in this constructor form. With a method name, resolves it on the class and calls `method(item, **kwargs)`: use a suitable static/class method rather than an ordinary instance method requiring `self`. A non-type `cls` raises `TypeError`. A missing method produces one `None` per item. A per-item `TypeError`, `AttributeError`, or `ValueError` also becomes `None`; other exceptions propagate.

```python
from orionis.support.types import Collection

class Label:
    def __init__(self, value):
        self.value = str(value)

    @staticmethod
    def format(value, prefix=""):
        return prefix + str(value)

    @classmethod
    def tagged(cls, value):
        return cls.__name__ + ":" + str(value)

assert Collection([1]).mapInto(Label, ignored=True)[0].value == "1"
assert Collection([1, 2]).mapInto(Label, "format", prefix="#").all() == ["#1", "#2"]
assert Collection([1]).mapInto(Label, "tagged").all() == ["Label:1"]
assert Collection(["3", "bad"]).mapInto(int).all() == [3, None]
assert Collection([1]).mapInto(Label, "missing").all() == [None]
```

## Keys, projection, and conditions

The field readers used by `pluck`, `contains(path, value)`, `where`, `whereIn`, `whereNotIn`, `sort(key)`, `groupBy`, and keyed `unique` support plain dictionary keys, dictionary dot paths, wildcard paths (`*` is translated into a `dotty_dict` slice), numeric string indices on list/tuple items, and direct object attributes. Missing or invalid access becomes `None`; object attribute paths are not traversed recursively. Numeric indices must satisfy `str.isdigit()`, so `"-1"` does not select the last nested item. Wildcards return lists rather than automatically expanding results. Aggregates use a different field reader, described later.

<a id="collection-method-pluck"></a>

### `pluck(value: str, key: str | None = None) -> Collection`

**New.** With a falsy/omitted `key`, returns a list of extracted values, omitting `None` but keeping other falsy values. With a truthy `key`, builds a dictionary indexed by that extracted field: `None` values/keys are retained, duplicate keys overwrite earlier values, and unhashable keys raise `TypeError`. The result may be dictionary-backed; an empty result becomes `[]`.

```python
from types import SimpleNamespace
from orionis.support.types import Collection

rows = Collection([
    {"id": 1, "name": "Ada"}, {"id": 2, "name": None},
    {"id": 1, "name": "Grace"}, {"id": 3},
])
assert rows.pluck("name").all() == ["Ada", "Grace"]
assert rows.pluck("name", "id").all() == {1: "Grace", 2: None, 3: None}
assert Collection([{"profile": {"name": "Ada"}}]).pluck("profile.name").all() == ["Ada"]
assert Collection([["Ada", 8], ("Grace", 9)]).pluck("0").all() == ["Ada", "Grace"]
assert Collection([SimpleNamespace(name="Ada")]).pluck("name").all() == ["Ada"]
assert Collection([{"users": [{"name": "Ada"}, {"name": "Grace"}]}]).pluck("users.*.name").all() == [["Ada", "Grace"]]
```

<a id="collection-method-where"></a>

### `where(key: str, *args: object) -> Collection`

**New.** `where(key, value)` uses `==`; `where(key, operator, value)` accepts `<`, `<=`, `==`, `!=`, `>`, `>=`. No value raises `ValueError`. Extra arguments beyond operator/value are ignored. Comparisons first use native Python operations; a `TypeError` retries with both operands converted to strings, which can produce lexicographic ordering. Unsupported operators and comparison `TypeError`/`ValueError` cause that item to be skipped, usually producing an empty collection rather than raising. Missing fields compare as `None`.

```python
from orionis.support.types import Collection

rows = Collection([{"v": 1}, {"v": 2}, {"v": 3}])
assert rows.where("v", 2).all() == [{"v": 2}]
expected = {"<": [1], "<=": [1, 2], "==": [2], "!=": [1, 3], ">": [3], ">=": [2, 3]}
for operator, values in expected.items():
    assert rows.where("v", operator, 2).pluck("v").all() == values
assert rows.where("v", "unsupported", 2).isEmpty()
assert rows.where("v", "==", 2, "ignored").count() == 1
assert Collection([{"v": 10}]).where("v", "<", "2").count() == 1
assert Collection([{}]).where("missing", None).count() == 1
```

<a id="collection-method-wherein"></a>

### `whereIn(key: str, values: list[Any] | Collection) -> Collection`

**New.** Keeps items whose extracted value equals a member of `values` **or has the same `str()` representation**. Supports unhashable values through an equality fallback.

<a id="collection-method-wherenotin"></a>

### `whereNotIn(key: str, values: list[Any] | Collection) -> Collection`

**New.** Excludes the same matches. Both methods accept a list or collection as their documented input; they do not provide strict-type matching. Other runtime inputs are not type-validated and must be iterable/reusable for the implementation's multiple passes.

```python
from orionis.support.types import Collection

rows = Collection([{"id": 1}, {"id": "2"}, {"id": 3}])
assert rows.whereIn("id", [1, 2]).all() == [{"id": 1}, {"id": "2"}]
assert rows.whereNotIn("id", Collection([1, 2])).all() == [{"id": 3}]
nested = Collection([{"v": [1]}, {"v": [2]}])
assert nested.whereIn("v", Collection([[2]])).all() == [{"v": [2]}]
assert nested.whereNotIn("v", [[2]]).all() == [{"v": [1]}]
```

## Slicing, grouping, and combining

<a id="collection-method-take"></a>

### `take(number: int) -> Collection`

**New.** A positive number takes the first items, a negative number takes the last `abs(number)` items, and zero returns an empty collection. Ordinary slice bounds clamp to the available length.

<a id="collection-method-chunk"></a>

### `chunk(size: int) -> Collection`

**New.** Returns a collection of collections of up to `size` items. `size <= 0` raises `ValueError`; a non-integer size cannot be used by `range` and raises `TypeError`.

<a id="collection-method-forpage"></a>

### `forPage(page: int, number: int) -> Collection`

**New.** Returns an in-memory page of `number` items, normalizing `page < 1` to 1. `number <= 0` raises `ValueError`; usable slice indices must be integers. An out-of-range page is empty. It has no database total, query, or paginator metadata.

```python
from orionis.support.types import Collection

items = Collection([1, 2, 3, 4, 5])
assert items.take(2).all() == [1, 2]
assert items.take(-2).all() == [4, 5]
assert items.take(0).all() == []
assert items.take(99).all() == items.all()
assert items.chunk(2).map(lambda chunk: chunk.all()).all() == [[1, 2], [3, 4], [5]]
assert Collection().chunk(2).all() == []
assert items.forPage(2, 2).all() == [3, 4]
assert items.forPage(0, 2).all() == [1, 2]
assert items.forPage(9, 2).all() == []
```

<a id="collection-method-collapse"></a>

### `collapse() -> Collection`

**New.** Extends a list with each nested item, unwrapping nested collections first. Flattens one iterable level: dictionaries contribute keys, strings contribute characters, and noniterable scalars raise `TypeError`.

<a id="collection-method-flatten"></a>

### `flatten() -> Collection`

**New.** Recursively traverses lists and dictionary **values**. Tuples, strings, nested `Collection` instances, and other objects remain leaf values. There is no depth argument; cyclic lists/dictionaries eventually raise `RecursionError`.

```python
from orionis.support.types import Collection

assert Collection([[1, 2], Collection([3]), [4, [5]]]).collapse().all() == [1, 2, 3, 4, [5]]
assert Collection([{"a": 1}, "bc"]).collapse().all() == ["a", "b", "c"]
nested = Collection([7])
flat = Collection([1, [2, {"a": [3]}], (4, 5), "hi", nested]).flatten()
assert flat.all() == [1, 2, 3, (4, 5), "hi", nested]
assert flat[-1] is nested
```

<a id="collection-method-diff"></a>

### `diff(items: list[Any] | Collection) -> Collection`

**New.** Keeps source items absent from the supplied data, preserving source order and duplicates. Tries a set for membership and falls back to equality-based list membership when values are unhashable. It unwraps a `Collection` without enforcing list input; incompatible/noniterable arguments can raise `TypeError`.

<a id="collection-method-zip"></a>

### `zip(items: list[Any] | Collection) -> Collection`

**New.** Returns two-element **lists** up to the shorter input's length. Other input types raise `TypeError`; it accepts one other sequence, not arbitrary additional arguments.

```python
from orionis.support.types import Collection

assert Collection([1, 2, 1, 3]).diff([2]).all() == [1, 1, 3]
assert Collection([1, 2]).diff(Collection([1])).all() == [2]
assert Collection([[1], [2]]).diff([[1]]).all() == [[2]]
assert Collection([1, 2, 3]).zip(["a", "b"]).all() == [[1, "a"], [2, "b"]]
assert Collection([1]).zip(Collection(["a"])).all() == [[1, "a"]]
```

<a id="collection-method-groupby"></a>

### `groupBy(key: str) -> Collection`

**New base `Collection`.** Extracts and sorts grouping keys, then builds `{group_key: [original_items]}`. Key values must be mutually orderable and hashable; incompatible sorting or unhashable dictionary keys raise `TypeError`. Order within each group remains stable. It accepts a field name/path, not a callback. Missing fields become `None`, which can make sorting fail alongside other key types.

<a id="collection-method-unique"></a>

<a id="collection-unique-performance"></a>

### `unique(key: str | Callable | None = None) -> Collection`

Without a truthy key, returns a **new** collection through `list(set(items))` for hashable items, with no promised order. Unhashable items retain their first occurrence using equality-compatible deduplication. With a string key or synchronous callable selector, list-backed collections keep the first item for each selected value, including equal lists and dictionaries; missing fields count as `None`. A truthy key on a dictionary-backed collection still returns `self`; omitting the key deduplicates dictionary keys.

In **1.1.0**, built-in nested value trees use structural indexing when suitable. Small unhashable inputs, custom equality and cycles retain an equality-based fallback. A selector returning a hashable business identity avoids repeated comparisons for custom objects, for example `rows.unique(lambda item: item["id"])`. This also fixes the previous behavior that retained duplicates for unhashable selected fields.

```python
from orionis.support.types import Collection

rows = Collection([{"team": "b", "id": 1}, {"team": "a", "id": 2}, {"team": "b", "id": 3}])
assert rows.groupBy("team").all() == {
    "a": [{"team": "a", "id": 2}],
    "b": [{"team": "b", "id": 1}, {"team": "b", "id": 3}],
}
assert Collection().groupBy("team").all() == []
assert sorted(Collection([2, 1, 2]).unique().all()) == [1, 2]
assert Collection([[1], [1], [2]]).unique().all() == [[1], [2]]
assert rows.unique("team").pluck("id").all() == [1, 2]
assert rows.unique(lambda item: item["team"]).pluck("id").all() == [1, 2]
assert Collection([{"v": [1]}, {"v": [1]}]).unique("v").count() == 1
indexed = Collection({"a": 1, "b": 1})
assert indexed.unique("anything") is indexed
assert sorted(indexed.unique().all()) == ["a", "b"]
```

## Mutating items and order

<a id="collection-method-push"></a>

### `push(value: object) -> Collection`

**Same instance.** Appends one value to a list; a list argument is one nested item.

<a id="collection-method-prepend"></a>

### `prepend(value: object) -> Collection`

**Same instance.** Inserts one value at index zero. There is no key parameter.

<a id="collection-method-put"></a>

### `put(key: int | str, value: object) -> Collection`

**Same instance.** Delegates to bracket assignment. For a list it replaces an existing index (including negative indices); it cannot append beyond the end. Dictionary backing supports dictionary keys. Invalid index/key types propagate the underlying errors.

<a id="collection-method-merge"></a>

### `merge(items: list[Any] | Collection) -> Collection`

**Same instance.** Extends the current list using `+=`. Other input types raise `TypeError`. It does not merge nested dictionaries or overwrite dictionary keys. A dictionary-backed `Collection` is accepted by the type check but contributes its keys when merged into a list.

```python
from orionis.support.types import Collection

items = Collection([2])
assert items.push([3, 4]) is items
assert items.prepend(1) is items
assert items.put(1, 9) is items
assert items.merge([5]) is items
assert items.merge(Collection([6])) is items
assert items.all() == [1, 9, [3, 4], 5, 6]
indexed = Collection({"a": 1})
assert indexed.put("b", 2).all() == {"a": 1, "b": 2}
```

<a id="collection-method-forget"></a>

### `forget(*keys: int | str) -> Collection`

**Same instance.** Sorts keys in descending order, then deletes each key/index. With no keys it changes nothing. Use distinct nonnegative list indices to avoid shifting surprises; negative/duplicate indices follow sequential Python deletion semantics. Mixing unsortable keys raises `TypeError`; missing indices/keys raise `IndexError`/`KeyError`, and earlier deletions can already have happened.

<a id="collection-method-pop"></a>

### `pop() -> object`

Removes and returns the last list item; an empty collection returns `None`. Takes no index argument.

<a id="collection-method-pull"></a>

### `pull(key: int | str) -> object`

Reads with `get`, then deletes with `forget`, and returns the removed value. A missing list index or dictionary key **raises** during deletion, despite `get` returning `None` first. There is no default argument.

<a id="collection-method-shift"></a>

### `shift() -> object`

Removes and returns the first list item through `pull(0)`. **An empty list raises `IndexError`**; check `isEmpty()` when needed.

```python
from orionis.support.types import Collection

items = Collection([10, 20, 30, 40])
assert items.forget(0, 2) is items
assert items.all() == [20, 40]
assert items.forget() is items
assert items.pop() == 40
assert items.pull(0) == 20
assert items.pop() is None
assert Collection([7, 8]).shift() == 7
indexed = Collection({"a": 1, "b": 2})
assert indexed.pull("a") == 1
assert indexed.forget("b").all() == {}
for operation in (lambda: Collection().shift(), lambda: Collection([1]).pull(9)):
    try:
        operation()
    except IndexError:
        pass
    else:
        raise AssertionError("Expected IndexError")
```

<a id="collection-method-reverse"></a>

### `reverse() -> Collection`

**Same instance.** Reverses the backing list.

<a id="collection-method-sort"></a>

### `sort(key: str | None = None) -> Collection`

**Same instance.** Sorts the backing list ascending, directly or by the extracted field for a truthy key. No reverse flag or callback parameter is supported. Use `.sort().reverse()` for descending order. Values must be mutually orderable; Python sorting exceptions propagate.

```python
from orionis.support.types import Collection

items = Collection([3, 1, 2])
assert items.sort() is items
assert items.all() == [1, 2, 3]
assert items.reverse() is items
assert items.all() == [3, 2, 1]
rows = Collection([{"v": 3}, {"v": 1}])
assert rows.sort("v").all() == [{"v": 1}, {"v": 3}]
```

<a id="collection-method-random"></a>

### `random(count: int | None = None) -> object | Collection | None`

On an empty collection returns `None` before validating `count`. With no count, `None`, **or zero**, returns one random item without changing the collection. With a positive count, samples positions without replacement, replaces the backing list, and returns **the same instance**. Duplicate values can still occur when the source has duplicates. A negative count or count exceeding a nonempty collection's length raises `ValueError`; positive non-integer counts fail in `random.sample` with `TypeError`. The resulting order is random.

```python
from orionis.support.types import Collection

items = Collection([1, 2, 3])
assert items.random() in [1, 2, 3]
assert items.random(None) in [1, 2, 3]
assert items.random(0) in [1, 2, 3]
assert items.count() == 3
assert items.random(2) is items
assert items.count() == 2
assert len(set(items.all())) == 2
assert Collection().random(-1) is None
for count in (-1, 4):
    try:
        Collection([1, 2, 3]).random(count)
    except ValueError:
        pass
    else:
        raise AssertionError("Expected ValueError")
```

## Aggregation and string output

`sum`, `avg`, `min`, and `max` accept `key=None`, a direct string attribute/dictionary key, or at runtime a `callback(item)`. Unlike projection, string keys do **not** traverse dot paths. Object attributes take precedence over dictionary entries; missing fields are omitted. Callback results are included only when truthy, so callback-produced zeros are omitted (this changes an average's denominator). If no values are extracted, these methods fall back to the original items. Their annotations do not force numeric conversion; actual results depend on Python's operations.

<a id="collection-method-sum"></a>

### `sum(key: str | None = None) -> float`

Returns Python's sum, often an `int`; empty input or a summation `TypeError` returns `0`.

<a id="collection-method-avg"></a>

### `avg(key: str | None = None) -> float`

Returns `sum(values) / len(values)`. Empty input or a calculation `TypeError` returns integer `0`.

<a id="collection-method-min"></a>

### `min(key: str | None = None) -> object`

Returns the smallest extracted/raw value; empty input, `TypeError`, or `ValueError` during selection returns `0`.

<a id="collection-method-max"></a>

### `max(key: str | None = None) -> object`

Returns the largest value with the same fallback as `min`. Strings can be selected lexicographically; these methods do not enforce numeric elements. Errors from field access/callback evaluation occur before the aggregation exception handling and propagate.

```python
from types import SimpleNamespace
from orionis.support.types import Collection

numbers = Collection([2, 4, 6])
assert (numbers.sum(), numbers.avg(), numbers.min(), numbers.max()) == (12, 4.0, 2, 6)
rows = Collection([{"v": 2}, {"v": 4}, {}])
assert (rows.sum("v"), rows.avg("v"), rows.min("v"), rows.max("v")) == (6, 3.0, 2, 4)
objects = Collection([SimpleNamespace(v=2), SimpleNamespace(v=4)])
assert objects.sum("v") == 6
assert (numbers.sum(lambda item: item * 2), numbers.avg(lambda item: item * 2),
        numbers.min(lambda item: item * 2), numbers.max(lambda item: item * 2)) == (24, 8.0, 4, 12)
assert Collection([0, 2]).avg(lambda item: item) == 2.0
for items in (Collection(), Collection(["invalid", 1])):
    assert (items.sum(), items.avg(), items.min(), items.max()) == (0, 0, 0, 0)
```

<a id="collection-method-reduce"></a>

### `reduce(callback: Callable, initial: object = 0) -> object`

Calls `callback(accumulator, item)` through `functools.reduce`, starting with `initial`. Empty input returns `initial`. This method does not use Collection's callback validator; invalid callbacks raise native errors when invoked (a non-callable on an empty input can return the initial value). Callback errors propagate.

<a id="collection-method-implode"></a>

### `implode(glue: str = ',', key: str | None = None) -> str`

Converts items with `str` and joins using `glue`. If the first item is not a string and `key` is truthy, first calls `pluck(key)`; otherwise ignores `key`. Empty input returns `""`. A nonempty collection needs a string separator; invalid separators/element string conversions raise their native errors.

```python
from orionis.support.types import Collection

assert Collection([1, 2, 3]).reduce(lambda total, item: total + item) == 6
assert Collection(["a", "b"]).reduce(lambda total, item: total + item, "#") == "#ab"
assert Collection().reduce(lambda total, item: total + item, 7) == 7
assert Collection([1, 2]).implode() == "1,2"
assert Collection(["a", "b"]).implode("-", "ignored") == "a-b"
assert Collection([{"name": "Ada"}, {"name": "Grace"}]).implode(" / ", "name") == "Ada / Grace"
assert Collection().implode() == ""
```

## Serialization and element integration

<a id="collection-method-serialize"></a>

### `serialize() -> list[Any]`

Creates a list by serializing each item: calls `item.serialize()` when present; otherwise `item.to_dict()` when present; otherwise keeps the original object. This is not a general recursive serializer for nested lists/dictionaries and does not guarantee JSON-compatible output. Dictionary-backed collections serialize their **keys**, because they iterate keys. Serializer attributes are called without a callability check, so invalid attributes or serializer errors propagate.

<a id="collection-method-tojson"></a>

### `toJson(**kwargs: object) -> str`

Returns `json.dumps(self.serialize(), **kwargs)`, forwarding options such as `ensure_ascii`, `indent`, `sort_keys`, and `default`. Native JSON errors, including `TypeError` for unsupported values and `ValueError` for circular data, propagate.

```python
import json
from orionis.support.types import Collection

class Record:
    def serialize(self):
        return {"name": "José"}

class Legacy:
    def to_dict(self):
        return {"id": 2}

items = Collection([Record(), Legacy(), 3])
assert items.serialize() == [{"name": "José"}, {"id": 2}, 3]
assert json.loads(items.toJson(ensure_ascii=False, indent=2)) == items.serialize()
assert Collection([1, 2]).toJson() == "[1, 2]"
assert json.loads(Collection([object()]).toJson(default=lambda item: "custom")) == ["custom"]
assert Collection({"a": 1}).serialize() == ["a"]
```

<a id="collection-method-setappends"></a>

### `setAppends(appends: list[str]) -> Collection`

**Same instance.** Extends `__appends__`; repeated calls accumulate and do not replace/deduplicate entries. During serialization, calls an item's `set_appends(appends)` if present, suppressing only `AttributeError` from that call. When `serialize()` returns a dictionary and the item has callable `getAttribute`, appends each named attribute unless listed in `type(item).__meta__.hidden`. Appended values can replace existing serializer keys. Ordinary dictionaries have neither hook and gain no fields. Malformed appends or other hook errors propagate.

<a id="collection-method-addrelation"></a>

### `addRelation(relation_data: dict[str, Any]) -> Collection`

**Same instance.** For each item exposing `setRelation`, calls `item.setRelation(name, value)` for every dictionary entry. Items without that attribute are skipped. It does not create dictionary keys, load relations, or query a database. A non-callable hook, invalid mapping, or hook error propagates.

```python
from types import SimpleNamespace
from orionis.support.types import Collection

class Record:
    __meta__ = SimpleNamespace(hidden=["secret"])

    def __init__(self):
        self.relations = {}
        self.appends = []

    def set_appends(self, appends):
        self.appends = list(appends)

    def serialize(self):
        return {"id": 1}

    def getAttribute(self, name):
        return {"label": "Ada", "secret": "hidden"}[name]

    def setRelation(self, name, value):
        self.relations[name] = value

record = Record()
items = Collection([record, {"id": 2}])
assert items.setAppends(["label"]) is items
items.setAppends(["secret"])
assert items.serialize() == [{"id": 1, "label": "Ada"}, {"id": 2}]
assert record.appends == ["label", "secret"]
assert items.addRelation({"team": "research", "manager": None}) is items
assert record.relations == {"team": "research", "manager": None}
```

## Python protocols

<a id="collection-method-iter"></a>

### `__iter__() -> Iterator[Any]`

`iter(collection)`, loops, `list(collection)`, and membership (`item in collection`) traverse backing data. There is no custom `__contains__`; membership uses iteration. Dictionary backing yields keys.

<a id="collection-method-len"></a>

### `__len__() -> int`

`len(collection)` reads backing length. `bool(collection)` uses this protocol because there is no custom `__bool__`.

<a id="collection-method-getitem"></a>

### `__getitem__(item: int | slice) -> object | Collection`

`collection[index]` returns an item; list indices can be negative. `collection[start:stop:step]` returns a new collection with Python slice semantics. A zero step raises `ValueError`, and invalid indices/missing keys propagate the backing structure's exceptions. Dictionary backing also accepts its actual keys despite the annotation.

<a id="collection-method-setitem"></a>

### `__setitem__(key: int | str, value: object) -> None`

`collection[key] = value` writes to backing data. List slice assignment also works at runtime and requires an iterable; extended slices require matching lengths. It does not expand an out-of-range integer index.

<a id="collection-method-delitem"></a>

### `__delitem__(key: int | str) -> None`

`del collection[key]` deletes from backing data, including list slices at runtime. Invalid/missing keys or indices propagate native exceptions.

```python
from orionis.support.types import Collection

items = Collection([10, 20, 30, 40])
assert list(iter(items)) == [10, 20, 30, 40]
assert len(items) == 4 and bool(items)
assert not bool(Collection())
assert 20 in items and 99 not in items
assert items[-1] == 40
assert items[1:3].all() == [20, 30]
assert items[::-1].all() == [40, 30, 20, 10]
items[0] = 1
items[1:3] = [2, 3]
del items[-1]
del items[1:2]
assert items.all() == [1, 3]
indexed = Collection({"a": 1})
assert list(indexed) == ["a"]
assert indexed["a"] == 1
indexed["b"] = 2
del indexed["a"]
assert indexed.all() == {"b": 2}
```

<a id="collection-method-eq"></a>
<a id="collection-method-ne"></a>

### `__eq__(other: object) -> bool` and `__ne__(other: object) -> bool`

`==` and `!=` compare backing data with another collection's backing data, or with the other object directly. They do not require the same collection subclass; lists can compare equal to collections. Dictionary backing follows dictionary equality.

<a id="collection-method-lt"></a>
<a id="collection-method-le"></a>
<a id="collection-method-gt"></a>
<a id="collection-method-ge"></a>

### `__lt__(other: object) -> bool`, `__le__(other: object) -> bool`, `__gt__(other: object) -> bool`, `__ge__(other: object) -> bool` — ordering

`<`, `<=`, `>`, `>=` unwrap a collection operand, then use Python list lexicographic comparison. Results are `bool` for ordinary data. Unsupported operand types, dictionary ordering, or incompatible element types raise `TypeError`.

<a id="collection-method-hash"></a>

### `__hash__() -> int`

`hash(collection)` returns `hash(tuple(backing_data))`. Unhashable list elements raise `TypeError`; dictionary backing hashes its keys. Because collections are mutable and compare by their data, changing data can change the hash: do not mutate a collection while it is used as a dictionary key or set member.

```python
from orionis.support.types import Collection

left = Collection([1, 2])
right = Collection([1, 3])
assert left == Collection([1, 2])
assert left == [1, 2]
assert left != right
assert left < right and left <= [1, 2]
assert right > left and right >= [1, 3]
assert hash(left) == hash((1, 2))
try:
    hash(Collection([[1]]))
except TypeError:
    pass
else:
    raise AssertionError("Expected TypeError")
```

## Reference scope

This page covers the 48 public methods and 13 declared Python special methods, including the constructor, in `orionis/support/types/collection.py`. The nine implementation helpers `_getUniqueItemsWithoutKey`, `_getUniqueItemsByKey`, `_addUniqueItem`, `__getValue`, `__dataGet`, `__value`, `__checkIsCallable`, `__makeComparison`, and `__getItems` are internal and excluded from the public API; their observable effects are documented above.

[Return to the module index](/en/utilities).
