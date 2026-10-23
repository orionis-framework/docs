---
title: "DotDict"
description: "Dictionary access through attributes, inherited mapping operations, copy behavior and serialization."
editUrl: true
lastUpdated: false
---

`DotDict` extends Python's `dict` with attribute lookup, assignment and deletion. Use it for small dynamic records when dictionary semantics are still useful. It preserves the supplied values; it does not validate data or coerce scalar types.

## Import and direct use

```python
from orionis.support.types import DotDict

settings = DotDict({"server": {"port": 8000}})
assert settings.server.port == 8000
settings.server.port = 9000
assert settings["server"]["port"] == 9000
```

## Dependency injection

The class has no framework service dependency. Direct construction is sufficient. Orionis can also inject an empty `DotDict` into a class constructor; populate it explicitly for the operation that needs it. Automatic construction does not load request data or application settings.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.types import DotDict

class Report:
    def __init__(self, values: DotDict) -> None:
        self.values = values

async def main() -> None:
    class LocalContainer(Container):
        pass

    report = await LocalContainer().make(Report)
    report.values.name = "Orionis"
    assert report.values["name"] == "Orionis"

asyncio.run(main())
```

<a id="dotdict-method-init"></a>

## Construction: inherited `dict` constructor

`DotDict()`, `DotDict(mapping, /, **kwargs)` and `DotDict(iterable, /, **kwargs)` create a mutable dictionary. Keyword values overwrite duplicate source keys. Construction does not eagerly wrap nested dictionaries or dictionaries inside lists. Invalid input follows `dict`: for example, malformed key/value pairs raise `ValueError` and unhashable keys raise `TypeError`.

```python
from orionis.support.types import DotDict

data = DotDict([("name", "old")], name="Orionis", config={"debug": True})
assert data["name"] == "Orionis"
assert type(data["config"]) is dict
assert DotDict() == {}
```

<a id="dotdict-method-getattr"></a>

## `__getattr__(self, key: str) -> object | None`

Attribute lookup uses this fallback when normal Python attribute lookup finds nothing. It returns `None` for an absent key. An exact plain `dict` value becomes a `DotDict`, and that replacement is stored in the parent. Other values, including dictionary subclasses and dictionaries inside lists, remain unchanged. Existing method names such as `items` take precedence over keys; use brackets for those keys. Because missing attributes return `None`, `hasattr(data, "missing")` is `True`; test key membership instead.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True}, items="stored value")
assert data.config.debug is True
assert data["config"] is data.config
assert data.missing is None
assert hasattr(data, "missing") is True
assert "missing" not in data
assert callable(data.items)
assert data["items"] == "stored value"
```

<a id="dotdict-method-setattr"></a>

## `__setattr__(self, key: str, value: object) -> None`

`data.name = value` stores a dictionary entry and returns `None` through the method. An exact `dict` is wrapped once; nested wrapping happens during later attribute access. The operation replaces an existing entry. It does not create an independent instance attribute.

```python
from orionis.support.types import DotDict

data = DotDict()
data.config = {"nested": {"enabled": True}}
assert type(data["config"]) is DotDict
assert type(data["config"]["nested"]) is dict
data.name = "Orionis"
data.name = "Updated"
assert data["name"] == "Updated"
```

<a id="dotdict-method-delattr"></a>

## `__delattr__(self, key: str) -> None`

`del data.name` deletes the matching entry in place. It returns `None` through the method and raises `AttributeError` when the key is absent, chaining the original `KeyError`.

```python
from orionis.support.types import DotDict

data = DotDict(name="Orionis")
del data.name
assert "name" not in data
try:
    del data.name
except AttributeError as error:
    assert isinstance(error.__cause__, KeyError)
```

<a id="dotdict-method-get"></a>

## `get(self, key: str, default: object | None = None) -> object | None`

Returns the stored value or `default` (`None` by default). An exact `dict` result is wrapped and stored under `key`. This also applies to a dictionary supplied as the default: reading an absent key with that default **inserts** the wrapped default. Other defaults do not insert an entry. Values are not coerced.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True})
assert data.get("config").debug is True
assert data.get("absent") is None
assert "absent" not in data
fallback = data.get("created", {"port": 8000})
assert isinstance(fallback, DotDict)
assert data["created"] is fallback
assert fallback.port == 8000
```

<a id="dotdict-method-export"></a>

## `export(self) -> dict[str, Any]`

Returns a new plain dictionary, recursively converting dictionary values to plain dictionaries. It does not mutate the source. Traversal follows dictionary values only: lists, tuples, custom objects and their contents keep their references. Dictionary subclasses are normalized. There is no cycle cache; a cycle reached through dictionary values raises `RecursionError`.

```python
from orionis.support.types import DotDict

rows = [DotDict(id=1)]
data = DotDict(config=DotDict(debug=True), rows=rows)
result = data.export()
assert type(result) is dict
assert type(result["config"]) is dict
assert result["rows"] is rows
assert type(result["rows"][0]) is DotDict
result["config"]["debug"] = False
assert data.config.debug is True
```

<a id="dotdict-method-copy"></a>

## `copy(self) -> DotDict`

Returns a new `DotDict`, recursively copying dictionary values into new `DotDict` objects. Despite the source docstring's term “deep copy”, this method shares non-dictionary values, including mutable lists. It neither mutates the source nor preserves shared dictionary identity. Dictionary cycles raise `RecursionError`. Use Python's `copy.deepcopy` when lists and other supported values must also be copied.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True}, rows=[1])
result = data.copy()
assert type(result) is DotDict
assert type(result["config"]) is DotDict
result.config.debug = False
assert data.config.debug is True
result.rows.append(2)
assert data.rows == [1, 2]
```

<a id="dotdict-method-clear"></a>

## Inherited `clear(self) -> None`

Removes every entry in place and returns `None`.

```python
from orionis.support.types import DotDict

data = DotDict(a=1)
assert data.clear() is None
assert data == {}
```

<a id="dotdict-method-fromkeys"></a>

## Inherited `fromkeys(iterable, value=None, /)`

The inherited class method returns a new `DotDict`, assigning the same `value` reference to every key. Its default is `None`; it does not wrap dictionary values. Unhashable keys raise `TypeError`.

```python
from orionis.support.types import DotDict

shared = []
data = DotDict.fromkeys(["first", "second"], shared)
assert type(data) is DotDict
data["first"].append(1)
assert data["second"] == [1]
assert DotDict.fromkeys(["unset"])["unset"] is None
```

<a id="dotdict-method-items"></a>

## Inherited `items(self)`

Returns a dynamic dictionary view of `(key, value)` pairs without wrapping nested values. It does not mutate the dictionary. Changing its size during iteration may raise `RuntimeError`.

```python
from orionis.support.types import DotDict

data = DotDict(a=1)
view = data.items()
data["b"] = 2
assert list(view) == [("a", 1), ("b", 2)]
```

<a id="dotdict-method-keys"></a>

## Inherited `keys(self)`

Returns a dynamic view of keys in insertion order without mutation. Iterating while the dictionary changes size may raise `RuntimeError`.

```python
from orionis.support.types import DotDict

data = DotDict(a=1)
view = data.keys()
data["b"] = 2
assert list(view) == ["a", "b"]
```

<a id="dotdict-method-values"></a>

## Inherited `values(self)`

Returns a dynamic view of the stored values without wrapping dictionaries or mutating the source. Iterating while its size changes may raise `RuntimeError`.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True})
view = data.values()
assert type(next(iter(view))) is dict
data["count"] = 2
assert len(view) == 2
```

<a id="dotdict-method-pop"></a>

## Inherited `pop(self, key, /, [default])`

Removes and returns an entry without converting its value. For an absent key it returns the supplied default; if no default was supplied it raises `KeyError`. There is no implicit `None` default.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True})
assert type(data.pop("config")) is dict
assert data.pop("missing", None) is None
try:
    data.pop("missing")
except KeyError:
    assert data == {}
```

<a id="dotdict-method-popitem"></a>

## Inherited `popitem(self)`

Removes and returns the most recently inserted `(key, value)` pair. It raises `KeyError` when empty and does not wrap the returned value.

```python
from orionis.support.types import DotDict

data = DotDict(a=1, b=2)
assert data.popitem() == ("b", 2)
assert data == {"a": 1}
```

<a id="dotdict-method-setdefault"></a>

## Inherited `setdefault(self, key, default=None, /)`

Returns an existing value, or inserts and returns `default` when absent. Neither path wraps dictionary values. The default is `None`. Unhashable keys raise `TypeError`.

```python
from orionis.support.types import DotDict

data = DotDict()
fallback = {"debug": True}
assert data.setdefault("config", fallback) is fallback
assert type(data["config"]) is dict
assert data.setdefault("config", {"debug": False}) is fallback
assert data.setdefault("unset") is None
```

<a id="dotdict-method-update"></a>

## Inherited `update(self, [mapping_or_iterable], /, **kwargs) -> None`

Adds or replaces entries in place and returns `None`. Keyword arguments take precedence over the positional source. It does not wrap dictionaries. Invalid inputs can raise `TypeError` or `ValueError`; entries processed before an error may already be stored.

```python
from orionis.support.types import DotDict

data = DotDict(a=1)
assert data.update({"a": 2, "config": {"debug": True}}, a=3) is None
assert data["a"] == 3
assert type(data["config"]) is dict
```

<a id="dotdict-protocol-dictionary"></a>

## Dictionary protocols

These operations are inherited from `dict` (and its object protocols), without DotDict-specific value conversion. The following table gives their Python entry points. Dictionary size changes during iteration can raise `RuntimeError`; item operations require hashable keys.

| Protocol | Behavior |
| --- | --- |
| <a id="dotdict-method-getitem"></a>`__getitem__(self, key, /)` | `data[key]` returns the raw stored value; an absent key raises `KeyError`. |
| <a id="dotdict-method-setitem"></a>`__setitem__(self, key, value, /) -> None` | Bracket assignment stores a raw value without wrapping dictionaries. |
| <a id="dotdict-method-delitem"></a>`__delitem__(self, key, /) -> None` | Bracket deletion mutates the dictionary; an absent key raises `KeyError`. |
| <a id="dotdict-method-iter"></a>`__iter__(self)` | Iteration yields keys in insertion order. |
| <a id="dotdict-method-reversed"></a>`__reversed__(self)` | `reversed(data)` yields keys in reverse insertion order. |
| <a id="dotdict-method-len"></a>`__len__(self) -> int` | `len(data)` counts entries; an empty dictionary is falsy through this protocol. |
| <a id="dotdict-method-contains"></a>`__contains__(self, key, /) -> bool` | Membership checks keys; unhashable keys raise `TypeError`. |
| <a id="dotdict-method-eq"></a>`__eq__(self, other, /)` | Equality compares mapping contents, including against plain dictionaries. |
| <a id="dotdict-method-ne"></a>`__ne__(self, other, /)` | Inequality follows dictionary content comparison. |
| <a id="dotdict-method-or"></a>`__or__(self, other, /)` | Union with another dictionary returns a plain `dict`; right-hand values win. |
| <a id="dotdict-method-ror"></a>`__ror__(self, other, /)` | Reverse union also returns a plain `dict`. |
| <a id="dotdict-method-ior"></a>`__ior__(self, other, /)` | In-place union updates and returns the same `DotDict`, accepting update-style input. |
| <a id="dotdict-method-repr"></a>`__repr__(self) -> str` | `repr(data)` uses the dictionary representation. |
| <a id="dotdict-method-str"></a>`__str__(self) -> str` | `str(data)` also displays its dictionary contents. |


```python
from orionis.support.types import DotDict

data = DotDict(a=1, b=2)
data["config"] = {"debug": True}
assert type(data["config"]) is dict
assert data["a"] == 1
del data["config"]
assert list(data) == ["a", "b"]
assert list(reversed(data)) == ["b", "a"]
assert len(data) == 2 and bool(data)
assert "a" in data
assert data == {"a": 1, "b": 2}
assert data != {"a": 9}
merged = data | {"b": 3}
assert type(merged) is dict and merged["b"] == 3
reverse_merged = {"b": 0} | data
assert type(reverse_merged) is dict and reverse_merged["b"] == 2
original = data
data |= [("c", 3)]
assert data is original and data.c == 3
assert repr(data) == "{'a': 1, 'b': 2, 'c': 3}"
assert str(data) == repr(data)
try:
    data["missing"]
except KeyError:
    pass
```

<a id="dotdict-method-hash"></a>

## `__hash__ = None`

`DotDict` is mutable and unhashable. Calling `hash(data)` or using an instance as a dictionary key raises `TypeError`.

```python
from orionis.support.types import DotDict

try:
    hash(DotDict(a=1))
except TypeError:
    pass
```

<a id="dotdict-protocol-copy-serialization"></a>

## Python copy and serialization

No `__copy__`, `__deepcopy__` or custom serialization hook is defined. Python's standard `copy.copy` uses the inherited reduction protocol and makes a shallow `DotDict`; `copy.deepcopy` recursively copies supported contents. Pickle round-trips preserve the `DotDict` type for ordinary serializable values. JSON accepts it as a dictionary and decoding returns a plain `dict`; JSON's normal restrictions on keys, values and cycles apply. `export()` is not JSON encoding.

```python
import copy
import json
import pickle
from orionis.support.types import DotDict

data = DotDict(rows=[1])
shallow = copy.copy(data)
deep = copy.deepcopy(data)
restored = pickle.loads(pickle.dumps(data))
assert type(shallow) is DotDict and shallow["rows"] is data["rows"]
assert type(deep) is DotDict and deep["rows"] is not data["rows"]
assert type(restored) is DotDict and restored == data
assert json.loads(json.dumps(data)) == {"rows": [1]}
```
