---
title: "StdClass"
description: "Dynamic attribute records, reserved names, conversion, equality and Python object protocols."
editUrl: true
lastUpdated: false
---

`StdClass` is a lightweight mutable object whose data live in instance attributes. Use it for dynamic in-memory records. Its `IStdClass` contract covers `toDict`, `update` and `remove`; there is no schema validation, recursive value conversion or mapping interface.

## Import and direct use

```python
from orionis.support.types import StdClass

record = StdClass(name="Orionis", enabled=True)
record.update(version=1)
assert record.toDict() == {"name": "Orionis", "enabled": True, "version": 1}
```

## Dependency injection

Direct construction needs no application bootstrap. Orionis can inject the concrete class and creates an empty record when no constructor data are supplied. The abstract `IStdClass` contract requires an explicit binding if you choose to inject that contract.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.types import StdClass

class Report:
    def __init__(self, record: StdClass) -> None:
        self.record = record

async def main() -> None:
    class LocalContainer(Container):
        pass

    report = await LocalContainer().make(Report)
    report.record.update(name="Orionis")
    assert report.record.name == "Orionis"

asyncio.run(main())
```

<a id="stdclass-method-init"></a>

## `__init__(self, **kwargs: object) -> None`

Creates an empty object or passes the keyword arguments to `update()`. There are no positional data parameters or value conversions. The constructor returns `None` after initialization. Reserved names raise `ValueError` through `update`; a positional data argument raises `TypeError`.

```python
from orionis.support.types import StdClass

record = StdClass(name="Orionis", config={"debug": True})
assert record.name == "Orionis"
assert type(record.config) is dict
assert StdClass().toDict() == {}
try:
    StdClass(update="conflict")
except ValueError:
    pass
```

<a id="stdclass-property-reserved"></a>

## `RESERVED: frozenset`

A class attribute containing names declared anywhere in the class MRO, plus `RESERVED` itself. Constructor initialization, `update()` and `fromDict()` reject these names, and also reject every string that both starts and ends with `__`. The set is rebuilt when a subclass is declared. Ordinary attribute assignment and direct edits of `__dict__` bypass this validation and can shadow methods.

```python
from orionis.support.types import StdClass

assert isinstance(StdClass.RESERVED, frozenset)
assert {"toDict", "update", "remove", "fromDict", "RESERVED"} <= StdClass.RESERVED
record = StdClass()
try:
    record.update(__private__=1)
except ValueError:
    pass
record.toDict = "shadowed"
assert record.toDict == "shadowed"
```

<a id="stdclass-method-todict"></a>

## `toDict(self) -> dict`

Returns a shallow copy of the instance's attribute dictionary without changing the object. Changing a top-level entry in the returned dictionary is independent; nested mutable objects remain shared. This method does not recursively serialize nested objects.

```python
from orionis.support.types import StdClass

record = StdClass(name="Orionis", tags=["python"])
result = record.toDict()
result["name"] = "Other"
result["tags"].append("async")
assert record.name == "Orionis"
assert record.tags == ["python", "async"]
```

<a id="stdclass-method-update"></a>

## `update(self, **kwargs: object) -> None`

Adds or replaces attributes in place and returns `None`. It checks names in keyword insertion order and raises `ValueError` at the first reserved name. Earlier assignments remain applied: the operation is not atomic. With no arguments it does nothing. Values are stored by reference, without validation or conversion. As with ordinary keyword calls, non-string keys expanded with `**` raise `TypeError`.

```python
from orionis.support.types import StdClass

record = StdClass(count=1)
assert record.update(count=2, enabled=True) is None
record.update()
assert record.count == 2
try:
    record.update(accepted=3, remove="conflict")
except ValueError:
    assert record.accepted == 3
    assert callable(record.remove)
```

<a id="stdclass-method-remove"></a>

## `remove(self, *attributes: str) -> None`

Deletes each named instance attribute in order and returns `None`. Missing names raise `AttributeError`, chained from `KeyError`; previously removed attributes remain removed. Calling with no names does nothing. It removes instance data, not class attributes or methods.

```python
from orionis.support.types import StdClass

record = StdClass(a=1, b=2, c=3)
assert record.remove("a", "b") is None
record.remove()
assert record.toDict() == {"c": 3}
try:
    record.remove("c", "missing")
except AttributeError as error:
    assert record.toDict() == {}
    assert isinstance(error.__cause__, KeyError)
```

<a id="stdclass-method-fromdict"></a>

## `fromDict(cls, dictionary: dict) -> StdClass`

This class method allocates a new instance of `cls` and copies dictionary entries into its attributes, applying the same reserved-name checks as `update()`. It returns the new instance and leaves the input unchanged. It stores values by reference and does not call `__init__`, including a subclass override. Reserved names raise `ValueError`. String keys are expected: an integer key raises `AttributeError` when its string methods are accessed. Objects without `.items()` also raise `AttributeError`.

```python
from orionis.support.types import StdClass

class Record(StdClass):
    def __init__(self) -> None:
        raise RuntimeError("fromDict bypasses this constructor")

tags = ["python"]
source = {"name": "Orionis", "tags": tags}
record = Record.fromDict(source)
assert type(record) is Record
assert record.name == "Orionis"
assert record.tags is tags
assert source == {"name": "Orionis", "tags": ["python"]}
try:
    StdClass.fromDict({"toDict": "conflict"})
except ValueError:
    pass
```

<a id="stdclass-method-init-subclass"></a>

## `__init_subclass__(cls, **kwargs: object) -> None`

Python calls this class method automatically when a subclass is defined. It forwards keyword arguments to the parent hook, then rebuilds that subclass's `RESERVED` set from its complete MRO. It returns `None`. The default parent chain does not accept arbitrary subclass keywords; those can raise `TypeError` unless another base consumes them.

```python
from orionis.support.types import StdClass

class Invoice(StdClass):
    category = "invoice"

    def total(self) -> int:
        return self.amount

invoice = Invoice(amount=200)
assert invoice.total() == 200
assert {"category", "total"} <= Invoice.RESERVED
assert "total" not in StdClass.RESERVED
try:
    invoice.update(total=0)
except ValueError:
    pass
```

<a id="stdclass-method-eq"></a>

## `__eq__(self, other: object) -> bool`

Returns `True` only when the concrete types match exactly and their attribute dictionaries compare equal. Instances of different subclasses compare unequal even when their data match; plain dictionaries also compare unequal. It does not change either object. Python's inherited inequality protocol follows this equality result.

```python
from orionis.support.types import StdClass

class Child(StdClass):
    pass

assert StdClass(x=1) == StdClass(x=1)
assert StdClass(x=1) != StdClass(x=2)
assert StdClass(x=1) != Child(x=1)
assert StdClass(x=1) != {"x": 1}
```

<a id="stdclass-method-hash"></a>

## `__hash__(self) -> int`

Returns the XOR of `hash((name, value))` for every instance attribute. Attribute order does not affect the result; an empty object hashes to `0`. Each value must be hashable, otherwise hashing raises `TypeError`. Since attribute mutations can change the hash, keep the object's attributes unchanged while it is a dictionary key or set member.

```python
from orionis.support.types import StdClass

first = StdClass(x=1, y=2)
second = StdClass(y=2, x=1)
assert hash(first) == hash(second)
assert hash(StdClass()) == 0
assert len({first, second}) == 1
try:
    hash(StdClass(tags=[]))
except TypeError:
    pass
```

<a id="stdclass-method-repr"></a>

## `__repr__(self) -> str`

Returns the concrete class name followed by the representation of its attribute dictionary: `StdClass({'x': 1})`. It is intended for inspection and does not serialize to JSON or reconstruct arbitrary values.

```python
from orionis.support.types import StdClass

class Record(StdClass):
    pass

assert repr(StdClass(x=1)) == "StdClass({'x': 1})"
assert repr(Record(x=1)) == "Record({'x': 1})"
```

<a id="stdclass-method-str"></a>

## `__str__(self) -> str`

Returns the string form of the instance's attribute dictionary, without the class name. It does not mutate data.

```python
from orionis.support.types import StdClass

assert str(StdClass(x=1)) == "{'x': 1}"
assert str(StdClass()) == "{}"
```

<a id="stdclass-protocol-attributes"></a>

## Native attribute behavior

Attributes use Python's normal object protocol: read with `record.name`, assign with `record.name = value` or `setattr`, and remove with `del` or `delattr`. Missing reads and deletions raise `AttributeError`; `hasattr` correctly returns `False` for absent attributes. `vars(record)` exposes the live `__dict__`; `toDict()` makes a shallow copy instead. The class supplies no mapping or iteration protocol: `record[key]`, `len(record)` and `iter(record)` raise `TypeError`. Without a length or boolean hook, even an empty `StdClass` is truthy.

```python
from orionis.support.types import StdClass

record = StdClass()
assert bool(record) is True
setattr(record, "name", "Orionis")
assert record.name == "Orionis"
assert vars(record) is record.__dict__
del record.name
assert not hasattr(record, "name")
try:
    print(record.name)
except AttributeError:
    pass
try:
    iter(record)
except TypeError:
    pass
```

<a id="stdclass-protocol-copy-serialization"></a>

## Python copy and serialization

The class defines no `copy`, `__copy__`, `__deepcopy__` or custom pickle hook. Python's standard copy and reduction protocols work for ordinary instance state: `copy.copy` shares nested values, while `copy.deepcopy` copies supported nested values. Pickle preserves the class and attributes when that class is importable and its values are serializable. JSON does not accept `StdClass` directly: use `toDict()` and ensure its remaining values are JSON-compatible. JSON decoding returns a dictionary; call `fromDict()` to rebuild a record.

```python
import copy
import json
import pickle
from orionis.support.types import StdClass

record = StdClass(tags=["python"])
shallow = copy.copy(record)
deep = copy.deepcopy(record)
assert shallow is not record and shallow.tags is record.tags
assert deep == record and deep.tags is not record.tags
restored = pickle.loads(pickle.dumps(record))
assert type(restored) is StdClass and restored == record
try:
    json.dumps(record)
except TypeError:
    pass
encoded = json.dumps(record.toDict())
assert StdClass.fromDict(json.loads(encoded)) == record
```
