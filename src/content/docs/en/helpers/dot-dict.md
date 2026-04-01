---
title: DotDict
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# DotDict

`DotDict` is a dictionary subclass that enables **attribute-style access** to dictionary keys. Instead of writing `config["database"]["host"]`, you can write `config.database.host`. Nested plain dictionaries are automatically converted to `DotDict` instances on access, making the entire tree navigable with dot notation.

This utility is especially useful when working with configuration data, API responses, or any deeply nested dictionary structure where bracket notation becomes verbose and hard to read.

## Import

```python
from orionis.support.wrapper.dot_dict import DotDict
```

## Creating an Instance

`DotDict` supports the same initialization signatures as a standard `dict`:

```python
# From a dictionary
config = DotDict({"database": {"host": "localhost", "port": 5432}})

# From keyword arguments
settings = DotDict(debug=True, version="1.0")

# Empty instance
data = DotDict()
```

---

## Attribute Access

### Reading Values

Access dictionary keys as object attributes. Nested dictionaries are automatically wrapped in `DotDict`:

```python
config = DotDict({
    "app": {
        "name": "Orionis",
        "settings": {
            "debug": True
        }
    }
})

config.app.name                # "Orionis"
config.app.settings.debug      # True
```

Accessing a key that does not exist returns `None` instead of raising an exception:

```python
config = DotDict({"a": 1})
config.missing_key  # None
```

### Setting Values

Assign values using attribute syntax. Plain dictionaries are automatically converted to `DotDict`:

```python
config = DotDict()

config.name = "Orionis"
config.database = {"host": "localhost", "port": 5432}

config.database.host   # "localhost" — auto-converted to DotDict
```

### Deleting Values

Remove keys using the `del` statement:

```python
config = DotDict({"key": "value"})
del config.key
```

Raises `AttributeError` if the key does not exist:

```python
config = DotDict()
del config.nonexistent  # AttributeError: 'DotDict' has no attribute 'nonexistent'
```

---

## Methods

### get

Retrieve a value by key with an optional default. Like attribute access, nested dicts are auto-converted:

```python
config = DotDict({"timeout": 30, "retry": {"max": 3}})

config.get("timeout")          # 30
config.get("missing", 60)      # 60
config.get("missing")          # None
config.get("retry").max        # 3
```

### export

Convert the entire `DotDict` tree back to standard Python dictionaries — useful for serialization or passing data to libraries that expect plain dicts:

```python
config = DotDict({"app": DotDict({"name": "Orionis", "meta": DotDict({"v": 1})})})

result = config.export()
# {"app": {"name": "Orionis", "meta": {"v": 1}}}

type(result)               # dict (not DotDict)
type(result["app"])        # dict (not DotDict)
```

### copy

Create a **deep copy** of the `DotDict`. Modifications to the copy do not affect the original:

```python
original = DotDict({"nested": {"value": 10}})
cloned = original.copy()

cloned.nested.value = 99
original.nested.value      # 10 — unchanged
```

---

## Standard Dict Compatibility

`DotDict` inherits from `dict`, so all standard dictionary operations remain available:

```python
config = DotDict({"a": 1, "b": 2, "c": 3})

# Bracket access
config["a"]                # 1

# Membership test
"a" in config              # True
"z" in config              # False

# Iteration
list(config)               # ["a", "b", "c"]

# Length
len(config)                # 3

# Update
config.update({"d": 4})
config.d                   # 4

# Repr
repr(config)               # "{'a': 1, 'b': 2, 'c': 3, 'd': 4}"
```

---

## Deep Nesting

Attribute access works seamlessly through any number of nesting levels. All intermediate plain dicts are automatically converted and cached:

```python
data = DotDict({
    "level1": {
        "level2": {
            "level3": {
                "value": "deep"
            }
        }
    }
})

data.level1.level2.level3.value  # "deep"

# Mutation at any depth
data.level1.level2.level3.value = "modified"
data.level1.level2.level3.value  # "modified"
```

---

## Conversion Behavior

Understanding when and how plain dicts are converted to `DotDict` is key to using this class effectively:

| Operation | Plain `dict` auto-converted? | Cached in-place? |
|---|---|---|
| `d.key` (attribute read) | Yes | Yes |
| `d.key = {...}` (attribute write) | Yes | — |
| `d.get("key")` | Yes | Yes |
| `d["key"]` (bracket read) | No | No |
| `d.copy()` | Yes (deep) | — |
| `d.export()` | Reverse — converts `DotDict` → `dict` | — |

Bracket-style access (`d["key"]`) does **not** auto-convert nested values. Use attribute access or `get()` when you need recursive `DotDict` behavior.
