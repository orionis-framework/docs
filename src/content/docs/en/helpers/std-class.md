---
title: StdClass
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# StdClass

`StdClass` is a lightweight, generic container that turns keyword arguments into object attributes. It provides a simple way to create structured data objects on the fly without defining a formal class — similar to an anonymous object or a plain data-transfer object.

Use `StdClass` when you need a quick, flexible container for passing grouped values around your application — configuration bundles, intermediate results, or any scenario where a full class definition would be overkill.

## Import

```python
from orionis.support.standard.std import StdClass
```

## Creating an Instance

Pass any keyword arguments to the constructor. Each key becomes an attribute on the resulting object:

```python
obj = StdClass(name="Orionis", version=1, debug=True)

obj.name      # "Orionis"
obj.version   # 1
obj.debug     # True
```

An empty instance has no attributes:

```python
obj = StdClass()
obj.toDict()   # {}
```

### From a Dictionary

The class method `fromDict` creates an instance from an existing dictionary:

```python
data = {"host": "localhost", "port": 5432}

config = StdClass.fromDict(data)
config.host   # "localhost"
config.port   # 5432
```

A `fromDict` → `toDict` roundtrip preserves the original data:

```python
original = {"a": 1, "b": "hello"}
StdClass.fromDict(original).toDict() == original   # True
```

---

## Managing Attributes

### Reading Attributes

Access attributes with standard dot notation. Use `hasattr` to check for existence:

```python
obj = StdClass(color="blue", count=5)

obj.color                # "blue"
hasattr(obj, "color")    # True
hasattr(obj, "missing")  # False
```

### Adding and Updating Attributes

The `update` method adds new attributes or overwrites existing ones:

```python
obj = StdClass(x=1)

obj.update(y=2, z=3)    # add new attributes
obj.update(x=99)         # overwrite existing

obj.toDict()   # {"x": 99, "y": 2, "z": 3}
```

Multiple `update` calls accumulate attributes:

```python
obj = StdClass()
obj.update(a=1)
obj.update(b=2)
obj.update(c=3)
obj.toDict()   # {"a": 1, "b": 2, "c": 3}
```

You can also set attributes directly:

```python
obj = StdClass(x=1)
obj.x = 99
obj.x   # 99
```

#### Protected Names

`update` rejects attribute names that conflict with the class interface:

- **Dunder names** (`__name__`, `__init__`, etc.) — raises `ValueError`
- **Existing method names** (`toDict`, `update`, `remove`, `fromDict`) — raises `ValueError`

```python
obj = StdClass()

obj.update(__reserved__="bad")   # ValueError
obj.update(toDict="conflict")   # ValueError
obj.update(remove="conflict")   # ValueError
```

### Removing Attributes

The `remove` method deletes one or more attributes by name. Raises `AttributeError` if any attribute does not exist:

```python
obj = StdClass(a=1, b=2, c=3)

obj.remove("a")
obj.toDict()   # {"b": 2, "c": 3}

obj.remove("b", "c")
obj.toDict()   # {}
```

```python
obj = StdClass()
obj.remove("missing")   # AttributeError: Attribute 'missing' not found
```

---

## Converting to Dictionary

`toDict` returns a **shallow copy** of all attributes as a plain `dict`. Mutating the returned dictionary does not affect the original object:

```python
obj = StdClass(x=1, flag=True)

d = obj.toDict()    # {"x": 1, "flag": True}
d["x"] = 999
obj.x               # 1 — unchanged
```

---

## Equality and Hashing

Two `StdClass` instances are equal when they have the same attributes with the same values:

```python
a = StdClass(x=1, y=2)
b = StdClass(x=1, y=2)

a == b   # True
```

Different values, different keys, or comparison with non-`StdClass` objects all produce `False`:

```python
StdClass(x=1) == StdClass(x=2)    # False
StdClass(x=1) == StdClass(y=1)    # False
StdClass(x=1) == {"x": 1}         # False
```

`StdClass` instances are **hashable**, so they can be used as dictionary keys or in sets. Instances with identical attributes produce the same hash:

```python
a = StdClass(x=1)
b = StdClass(x=1)

{a, b}           # set with 1 element
{a: "value"}     # works as dict key
```

Modifying attributes changes the hash value.

---

## String Representation

`repr()` includes the class name and all attributes — useful for debugging:

```python
obj = StdClass(name="Orionis", v=3)

repr(obj)   # "StdClass({'name': 'Orionis', 'v': 3})"
str(obj)    # "{'name': 'Orionis', 'v': 3}"
```

---

## Method Reference

| Method | Signature | Description |
|---|---|---|
| `__init__` | `StdClass(**kwargs)` | Creates an instance with keyword arguments as attributes |
| `fromDict` | `StdClass.fromDict(dict) → StdClass` | Class method — creates an instance from a dictionary |
| `update` | `update(**kwargs) → None` | Adds or overwrites attributes. Rejects dunder and method names |
| `remove` | `remove(*names) → None` | Deletes attributes by name. Raises `AttributeError` if missing |
| `toDict` | `toDict() → dict` | Returns a shallow copy of all attributes as a dictionary |
