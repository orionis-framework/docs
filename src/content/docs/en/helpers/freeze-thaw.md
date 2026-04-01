---
title: FreezeThaw
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# FreezeThaw

`FreezeThaw` is a utility class that converts mutable Python containers into deeply immutable equivalents and back. Calling `freeze` turns dictionaries into `MappingProxyType` instances and lists into tuples, recursively through the entire structure. Calling `thaw` reverses the process, restoring full mutability.

This is particularly useful when you need to expose configuration data, cached results, or shared state that **must not be modified** by consumers, yet still needs to be editable when the time comes to update it.

## Import

```python
from orionis.support.structures.freezer import FreezeThaw
```

---

## Freezing Data

The `freeze` method accepts any object. If the object is a supported container (`dict`, `list`, or `tuple`), it is recursively converted to its immutable counterpart. Non-container values — strings, numbers, `None`, booleans — pass through unchanged.

### Conversion Rules

| Input type | Frozen type |
|---|---|
| `dict` | `MappingProxyType` |
| `list` | `tuple` |
| `tuple` | `tuple` (preserved) |
| `MappingProxyType` | returned as-is |
| Scalar (`int`, `str`, `None`, …) | returned as-is |

### Freezing a Dictionary

```python
config = {"database": {"host": "localhost", "port": 5432}}

frozen = FreezeThaw.freeze(config)

frozen["database"]["host"]   # "localhost"
frozen["database"]["port"]   # 5432
```

The result is a `MappingProxyType`. Any attempt to modify it raises a `TypeError`:

```python
frozen["database"] = "other"   # TypeError
```

### Freezing a List

```python
items = [1, 2, [3, 4]]

frozen = FreezeThaw.freeze(items)
# (1, 2, (3, 4))
```

Lists become tuples, including nested lists.

### Freezing Nested Structures

`freeze` walks the entire object graph, converting every container it encounters:

```python
data = {
    "users": ["alice", "bob"],
    "meta": {
        "version": 3,
        "tags": ["admin", "staff"]
    }
}

frozen = FreezeThaw.freeze(data)

frozen["users"]          # ("alice", "bob")
frozen["meta"]["tags"]   # ("admin", "staff")
```

### Scalars and Already-Frozen Objects

Non-container values are returned unchanged:

```python
FreezeThaw.freeze(42)       # 42
FreezeThaw.freeze("text")   # "text"
FreezeThaw.freeze(None)     # None
```

If the input is already a `MappingProxyType`, it is returned as-is without re-wrapping:

```python
from types import MappingProxyType

proxy = MappingProxyType({"key": "value"})
FreezeThaw.freeze(proxy) is proxy   # True
```

---

## Thawing Data

The `thaw` method is the inverse of `freeze`. It recursively converts immutable containers back to their mutable equivalents.

### Conversion Rules

| Input type | Thawed type |
|---|---|
| `MappingProxyType` | `dict` |
| `dict` | `dict` (deep copy) |
| `tuple` | `list` |
| `list` | `list` (deep copy) |
| Scalar (`int`, `str`, `None`, …) | returned as-is |

### Thawing a Frozen Dictionary

```python
from types import MappingProxyType

frozen = MappingProxyType({"host": "localhost", "port": 5432})

config = FreezeThaw.thaw(frozen)

config["host"]          # "localhost"
config["port"] = 3306   # works — the result is fully mutable
```

### Thawing a Tuple

```python
frozen_items = (1, 2, 3)

items = FreezeThaw.thaw(frozen_items)
# [1, 2, 3]

items.append(4)   # works
```

### Thawing Nested Structures

Every level of the structure is converted:

```python
frozen = MappingProxyType({
    "items": (1, 2),
    "meta": MappingProxyType({"key": "value"})
})

data = FreezeThaw.thaw(frozen)

type(data)              # dict
type(data["items"])     # list
type(data["meta"])      # dict
```

### Scalars

Just like `freeze`, non-container values pass through unchanged:

```python
FreezeThaw.thaw(42)       # 42
FreezeThaw.thaw("text")   # "text"
FreezeThaw.thaw(None)     # None
```

---

## Roundtrip Integrity

A `freeze` followed by `thaw` returns a structure **equal** to the original, with all containers fully mutable again:

```python
original = {
    "a": 1,
    "b": [2, 3],
    "c": {"d": 4}
}

frozen = FreezeThaw.freeze(original)
restored = FreezeThaw.thaw(frozen)

restored == original         # True
restored["b"].append(5)      # works
restored["c"]["e"] = 6       # works
```

This roundtrip guarantee makes `FreezeThaw` safe for scenarios where you need to temporarily lock data and later unlock it without data loss.

---

## Method Reference

| Method | Signature | Description |
|---|---|---|
| `freeze` | `freeze(obj) → object` | Recursively converts mutable containers to immutable equivalents. Returns non-containers unchanged. |
| `thaw` | `thaw(obj) → object` | Recursively converts immutable containers to mutable equivalents. Returns non-containers unchanged. |
