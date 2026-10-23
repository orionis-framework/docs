---
title: "Sentinel"
description: "Use MISSING to distinguish omitted values from None, false and other explicit values."
editUrl: true
lastUpdated: false
---

`MISSING` is an exported marker object representing an omitted value. It distinguishes omission from explicit `None`, `False`, `0` and empty strings. The page title “Sentinel” names this pattern; there is no public `Sentinel` class to instantiate.

## Import and direct use

Use the canonical public package import and compare by identity. A default argument and a dictionary lookup can both retain the distinction between missing and explicitly empty data.

```python
from orionis.support.types import MISSING

def describe(value=MISSING) -> str:
    return "omitted" if value is MISSING else "supplied"

assert describe() == "omitted"
assert describe(None) == "supplied"
assert describe(False) == "supplied"
assert describe(0) == "supplied"
assert describe("") == "supplied"

payload = {"name": None}
assert payload.get("name", MISSING) is None
assert payload.get("email", MISSING) is MISSING
```

## Dependency injection

Import and pass `MISSING`, or use it as a default argument. It is an already-created value, not a concrete injectable service class. There is no constructor-based `Sentinel` dependency to resolve and no container initialization is required. The implementation type `_MISSING_TYPE` is private.

<a id="sentinel-method-repr"></a>

## `__repr__(self) -> str`

Returns the exact string `"<MISSING>"` without changing the marker. The inherited `str()` behavior also uses this representation; the text is diagnostic output, not a serialized identity.

```python
from orionis.support.types import MISSING

assert repr(MISSING) == "<MISSING>"
assert str(MISSING) == "<MISSING>"
```

<a id="sentinel-method-bool"></a>

## `__bool__(self) -> bool`

Always returns `False`. `not MISSING` is `True`, and conditions take the false branch. This does not make the marker equal to `False`, `None` or zero. A truthiness test cannot distinguish all absent and explicit falsy values; use `is MISSING`.

```python
from orionis.support.types import MISSING

assert bool(MISSING) is False
assert not MISSING
assert ("present" if MISSING else "absent") == "absent"
assert MISSING is not False
assert MISSING != 0
assert MISSING is not None
```

<a id="sentinel-protocol-identity"></a>

## Identity, equality and hashing

The private implementation class defines no equality or hash override. Its instances use ordinary identity equality and object hashing, so the imported marker can be a dictionary key or set member. Importing `MISSING` repeatedly returns the same object. The implementation class does not enforce singleton construction: a new instance made from `type(MISSING)` is a different object with the same representation. Application code should import the exported marker.

```python
from orionis.support.types import MISSING
from orionis.support.types.sentinel import MISSING as SAME_MARKER

assert SAME_MARKER is MISSING
assert MISSING == SAME_MARKER
assert {MISSING: "absent"}[SAME_MARKER] == "absent"
assert MISSING in {MISSING}
another = type(MISSING)()
assert another is not MISSING
assert another != MISSING
assert repr(another) == repr(MISSING)
```

<a id="sentinel-protocol-copy-serialization"></a>

## Python copy and serialization

No `__copy__`, `__deepcopy__` or custom pickle reduction is defined. Standard shallow copy, deep copy and pickle reconstruction each create a different marker instance: their result is **not** `MISSING` under identity comparison. Do not copy or pickle the marker when later code relies on `is MISSING`; preserve the imported object or encode absence explicitly. JSON does not serialize it by default and raises `TypeError`.

```python
import copy
import json
import pickle
from orionis.support.types import MISSING

for result in (
    copy.copy(MISSING),
    copy.deepcopy(MISSING),
    pickle.loads(pickle.dumps(MISSING)),
):
    assert result is not MISSING
    assert repr(result) == "<MISSING>"
    assert bool(result) is False

try:
    json.dumps({"value": MISSING})
except TypeError:
    pass
```

The marker defines no other public methods, properties, mapping operations or iteration protocol.
