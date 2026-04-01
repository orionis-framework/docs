---
title: Collection
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Collection

`Collection` is a fluent wrapper around Python lists that provides a rich set of methods for filtering, transforming, aggregating, and paginating data. Instead of chaining built-in functions or writing repetitive loops, you can express data operations in a readable, declarative style.

Collections accept any list of items — scalars, dictionaries, objects — and expose a consistent API that covers the most common data manipulation needs in application development.

## Import

```python
from orionis.support.structures.collection import Collection
```

## Creating an Instance

```python
# From a list
users = Collection([1, 2, 3])

# Empty collection
empty = Collection()

# None is treated as empty
also_empty = Collection(None)
```

---

## Retrieving Items

### first

Returns the first item, or `None` if the collection is empty. An optional callback filters items before selecting:

```python
c = Collection([1, 2, 3, 4])

c.first()                      # 1
c.first(lambda x: x > 2)       # 3
c.first(lambda x: x > 10)      # None
```

### last

Returns the last item, with the same optional callback behavior:

```python
c = Collection([1, 2, 3, 4])

c.last()                       # 4
c.last(lambda x: x < 4)        # 3
```

### get

Retrieves an item by index. Returns a default value (`None` by default) when the index is out of range:

```python
c = Collection([10, 20, 30])

c.get(1)              # 20
c.get(99)             # None
c.get(99, "missing")  # "missing"
```

### random

Returns one or more random items. Without arguments returns a single value; with a count returns a `Collection`:

```python
c = Collection([1, 2, 3, 4, 5])

c.random()       # single random item
c.random(3)      # Collection with 3 random items
```

Returns `None` for empty collections. Raises `ValueError` if the count exceeds the collection size.

---

## Adding and Removing Items

### push

Appends a value to the end:

```python
c = Collection([1, 2])
c.push(3)
c.all()   # [1, 2, 3]
```

### prepend

Inserts a value at the beginning:

```python
c = Collection([2, 3])
c.prepend(1)
c.all()   # [1, 2, 3]
```

### pop

Removes and returns the last item. Returns `None` if the collection is empty:

```python
c = Collection([1, 2, 3])
c.pop()    # 3
c.all()    # [1, 2]
```

### shift

Removes and returns the first item:

```python
c = Collection([10, 20, 30])
c.shift()   # 10
c.all()     # [20, 30]
```

### pull

Removes and returns the item at a given index:

```python
c = Collection([10, 20, 30])
c.pull(1)   # 20
c.all()     # [10, 30]
```

### put

Replaces the value at a specific index:

```python
c = Collection([1, 2, 3])
c.put(1, 99)
c.all()   # [1, 99, 3]
```

### forget

Removes items by one or more indices:

```python
c = Collection([10, 20, 30, 40])
c.forget(0, 2)
c.all()   # [20, 40]
```

### merge

Appends items from a list or another `Collection`. Raises `TypeError` for incompatible types:

```python
c = Collection([1, 2])
c.merge([3, 4])
c.all()   # [1, 2, 3, 4]
```

---

## Filtering

### filter

Returns a new collection with items that pass a truth test:

```python
c = Collection([1, 2, 3, 4, 5])
c.filter(lambda x: x > 3).all()   # [4, 5]
```

### reject

The inverse of `filter` — removes items that match the callback. Modifies the collection in place:

```python
c = Collection([1, 2, 3, 4])
c.reject(lambda x: x > 2)
c.all()   # [1, 2]
```

### where

Filters dictionary items by a key-value condition. Supports comparison operators:

```python
items = Collection([{"v": 1}, {"v": 5}, {"v": 10}])

items.where("v", 5).all()         # [{"v": 5}]
items.where("v", ">", 3).all()    # [{"v": 5}, {"v": 10}]
```

Supported operators: `==`, `!=`, `<`, `<=`, `>`, `>=`.

### whereIn / whereNotIn

Filters items whose key value is (or is not) in a given list:

```python
c = Collection([{"id": 1}, {"id": 2}, {"id": 3}])

c.whereIn("id", [1, 3]).count()      # 2
c.whereNotIn("id", [2]).count()      # 2
```

### unique

Returns a new collection with duplicate values removed. Pass a key for dict-based uniqueness:

```python
Collection([1, 2, 2, 3]).unique().count()   # 3

items = Collection([
    {"id": 1, "v": "a"},
    {"id": 2, "v": "b"},
    {"id": 1, "v": "c"},
])
items.unique("id").count()   # 2
```

### contains

Checks whether a value — or a value matching a callback or key-value pair — exists in the collection:

```python
c = Collection([1, 2, 3])

c.contains(2)                    # True
c.contains(99)                   # False
c.contains(lambda x: x > 2)      # True

items = Collection([{"name": "a"}, {"name": "b"}])
items.contains("name", "a")      # True
```

### diff

Returns items not present in the given list or collection:

```python
c = Collection([1, 2, 3, 4])
c.diff([2, 4]).all()   # [1, 3]
```

---

## Transformation

### map

Applies a callback to every item and returns a **new** collection:

```python
c = Collection([1, 2, 3])
c.map(lambda x: x * 10).all()   # [10, 20, 30]
```

### transform

Like `map`, but modifies the collection **in place**:

```python
c = Collection([1, 2, 3])
c.transform(lambda x: x * 2)
c.all()   # [2, 4, 6]
```

### each

Iterates and applies a callback to each item in place. Stops iteration if the callback returns a falsy value:

```python
c = Collection([1, 2, 3])
c.each(lambda x: x * 2)
c.all()   # [2, 4, 6]
```

### mapInto

Creates instances of a given class from each item:

```python
c = Collection([1, 2, 3])
c.mapInto(str).all()   # ["1", "2", "3"]
```

Raises `TypeError` if the argument is not a type.

### flatten

Recursively flattens nested lists and dictionary values into a single-level collection:

```python
Collection([1, [2, [3, 4]], 5]).flatten().all()
# [1, 2, 3, 4, 5]

Collection([{"a": 1, "b": 2}]).flatten().all()
# [1, 2]
```

### collapse

Merges one level of nested lists into a flat collection:

```python
Collection([[1, 2], [3, 4]]).collapse().all()
# [1, 2, 3, 4]
```

### reverse

Reverses the item order in place:

```python
c = Collection([1, 2, 3])
c.reverse()
c.all()   # [3, 2, 1]
```

### sort

Sorts items in ascending order. Pass a key name to sort dictionaries by a specific field:

```python
c = Collection([3, 1, 2])
c.sort()
c.all()   # [1, 2, 3]

items = Collection([{"v": 3}, {"v": 1}, {"v": 2}])
items.sort("v")
items.all()   # [{"v": 1}, {"v": 2}, {"v": 3}]
```

---

## Aggregation

### count

Returns the number of items. Also available via `len()`:

```python
c = Collection([1, 2, 3])
c.count()   # 3
len(c)      # 3
```

### sum

Computes the total. Pass a key to sum a specific field from dicts:

```python
Collection([1, 2, 3]).sum()                          # 6
Collection([{"v": 10}, {"v": 20}]).sum("v")          # 30
```

Returns `0` for empty collections.

### avg

Computes the arithmetic mean:

```python
Collection([2, 4, 6]).avg()                          # 4.0
Collection([{"v": 10}, {"v": 20}]).avg("v")          # 15.0
```

Returns `0` for empty collections.

### max / min

Return the largest and smallest values respectively:

```python
c = Collection([3, 1, 4, 1, 5])
c.max()   # 5
c.min()   # 1
```

Both return `0` for empty collections.

### reduce

Accumulates all items into a single value using a callback:

```python
c = Collection([1, 2, 3])
c.reduce(lambda acc, x: acc + x, 0)   # 6
```

### every

Returns `True` only if **all** items satisfy the callback:

```python
Collection([2, 4, 6]).every(lambda x: x % 2 == 0)   # True
Collection([2, 3, 6]).every(lambda x: x % 2 == 0)   # False
```

### isEmpty

Returns `True` when the collection has no items:

```python
Collection().isEmpty()       # True
Collection([1]).isEmpty()    # False
```

---

## Extraction

### pluck

Extracts values for a given key from a collection of dictionaries. An optional second key serves as the index for the result:

```python
c = Collection([{"n": "a"}, {"n": "b"}, {"n": "c"}])
c.pluck("n").all()   # ["a", "b", "c"]

users = Collection([
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
])
users.pluck("name", "id").all()   # {1: "Alice", 2: "Bob"}
```

### take

Takes items from the beginning (positive) or end (negative) of the collection:

```python
c = Collection([1, 2, 3, 4, 5])

c.take(3).all()    # [1, 2, 3]
c.take(-2).all()   # [4, 5]
c.take(0).all()    # []
```

### groupBy

Groups items by a specified key, producing a collection whose items are a dictionary mapping group keys to lists:

```python
c = Collection([
    {"type": "a", "v": 1},
    {"type": "b", "v": 2},
    {"type": "a", "v": 3},
])
groups = c.groupBy("type")
# {"a": [...], "b": [...]}
```

---

## Pagination

### forPage

Returns a slice of items for a given page number and page size:

```python
c = Collection([1, 2, 3, 4, 5, 6])

c.forPage(1, 2).all()   # [1, 2]
c.forPage(2, 2).all()   # [3, 4]
c.forPage(3, 2).all()   # [5, 6]
```

Raises `ValueError` if the page size is zero or negative.

### chunk

Splits the collection into smaller collections of the given size:

```python
c = Collection([1, 2, 3, 4, 5])
chunks = c.chunk(2)

chunks[0].all()   # [1, 2]
chunks[1].all()   # [3, 4]
chunks[2].all()   # [5]
```

Raises `ValueError` if the chunk size is zero or negative.

---

## Serialization

### toJson

Returns a JSON string representation:

```python
Collection([1, 2, 3]).toJson()   # "[1, 2, 3]"
```

### serialize

Returns the underlying items as a plain list. For items that implement a `serialize` or `to_dict` method, those methods are called automatically:

```python
Collection([1, "a", None]).serialize()   # [1, "a", None]
```

### implode

Joins all items into a string with a separator (default `,`):

```python
Collection(["a", "b", "c"]).implode("-")   # "a-b-c"
Collection(["x", "y"]).implode()           # "x,y"
```

---

## Combining Collections

### zip

Pairs items from the collection with items from another list or collection by index:

```python
c = Collection([1, 2, 3])
c.zip([4, 5, 6]).all()
# [[1, 4], [2, 5], [3, 6]]
```

Raises `TypeError` if the argument is not a list or `Collection`.

---

## Bracket Notation and Iteration

`Collection` supports standard Python bracket access, slicing, assignment, and iteration:

```python
c = Collection([10, 20, 30])

c[0]         # 10
c[1] = 99    # sets index 1 to 99
c[0:2]       # Collection([10, 99])

for item in c:
    print(item)
```

Slicing returns a new `Collection`. The `len()` function returns the item count.

---

## Comparison Operators

Collections support `==`, `!=`, `<`, `<=`, `>`, `>=` using standard list comparison semantics:

```python
a = Collection([1, 2, 3])
b = Collection([1, 2, 3])
c = Collection([1, 3])

a == b   # True
a < c    # True
```

Collections with identical items also produce the same `hash()` value.

---

## Method Reference

| Method | Returns | Mutates | Description |
|---|---|---|---|
| `all()` | `list` | No | Returns all items as a plain list |
| `avg(key?)` | `float` | No | Arithmetic mean of items or key values |
| `chunk(size)` | `Collection` | No | Splits into sub-collections of given size |
| `collapse()` | `Collection` | No | Flattens one level of nested lists |
| `contains(key, value?)` | `bool` | No | Checks for value, callback match, or key-value pair |
| `count()` | `int` | No | Number of items |
| `diff(items)` | `Collection` | No | Items not in the given list |
| `each(callback)` | `Collection` | Yes | Applies callback in place, stops on falsy return |
| `every(callback)` | `bool` | No | True if all items pass the test |
| `filter(callback)` | `Collection` | No | Items passing the callback test |
| `flatten()` | `Collection` | No | Recursively flattens nested structures |
| `forPage(page, size)` | `Collection` | No | Paginated slice |
| `forget(*keys)` | `Collection` | Yes | Removes items by index |
| `first(callback?)` | `object` | No | First item, optionally filtered |
| `get(index, default?)` | `object` | No | Item by index with default fallback |
| `groupBy(key)` | `Collection` | No | Groups items by a key field |
| `implode(glue?, key?)` | `str` | No | Joins items into a string |
| `isEmpty()` | `bool` | No | True if collection has no items |
| `last(callback?)` | `object` | No | Last item, optionally filtered |
| `map(callback)` | `Collection` | No | New collection with transformed items |
| `mapInto(cls)` | `Collection` | No | Maps items into class instances |
| `max(key?)` | `object` | No | Maximum value |
| `merge(items)` | `Collection` | Yes | Appends items from list or Collection |
| `min(key?)` | `object` | No | Minimum value |
| `pluck(value, key?)` | `Collection` | No | Extracts values by key |
| `pop()` | `object` | Yes | Removes and returns the last item |
| `prepend(value)` | `Collection` | Yes | Inserts item at the beginning |
| `pull(index)` | `object` | Yes | Removes and returns item by index |
| `push(value)` | `Collection` | Yes | Appends item to the end |
| `put(index, value)` | `Collection` | Yes | Replaces value at index |
| `random(count?)` | `object\|Collection` | No | Random item(s) |
| `reduce(callback, initial)` | `object` | No | Accumulates to a single value |
| `reject(callback)` | `Collection` | Yes | Removes items matching callback |
| `reverse()` | `Collection` | Yes | Reverses item order |
| `serialize()` | `list` | No | Items as a plain serialized list |
| `shift()` | `object` | Yes | Removes and returns the first item |
| `sort(key?)` | `Collection` | Yes | Sorts items in ascending order |
| `sum(key?)` | `float` | No | Sum of items or key values |
| `take(n)` | `Collection` | No | First n or last n items |
| `toJson()` | `str` | No | JSON string representation |
| `transform(callback)` | `Collection` | Yes | Transforms items in place |
| `unique(key?)` | `Collection` | No | Removes duplicate items |
| `where(key, ...)` | `Collection` | No | Filters by key-value comparison |
| `whereIn(key, values)` | `Collection` | No | Filters where key is in values |
| `whereNotIn(key, values)` | `Collection` | No | Filters where key is not in values |
| `zip(items)` | `Collection` | No | Pairs items by index |
