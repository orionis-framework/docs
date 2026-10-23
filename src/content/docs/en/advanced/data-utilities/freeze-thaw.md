---
title: "FreezeThaw"
description: "Convert dictionary and sequence containers between frozen and mutable forms, with their reference boundaries."
editUrl: true
lastUpdated: false
---

`FreezeThaw` converts supported container structures for read-only access or later editing. Its two public operations are static: use `FreezeThaw.freeze(value)` and `FreezeThaw.thaw(value)` without constructing a helper. Only dictionaries, lists, tuples and mapping proxies participate in traversal; arbitrary Python objects are not frozen.

## Import and direct use

Import the defining module: `orionis.support.structures` does not re-export `FreezeThaw`.

```python
from orionis.support.structures.freezer import FreezeThaw

frozen = FreezeThaw.freeze({"items": [1, 2]})
editable = FreezeThaw.thaw(frozen)
editable["items"].append(3)
assert editable == {"items": [1, 2, 3]}
assert frozen["items"] == (1, 2)
```

## Dependency injection

Static calls need no container or application bootstrap. If an application constructor explicitly depends on the helper class, Orionis can inject a stateless instance and the same static operations remain available. There is no corresponding service contract or configuration to resolve.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.structures.freezer import FreezeThaw

class Snapshot:
    def __init__(self, converter: FreezeThaw) -> None:
        self.converter = converter

async def main() -> None:
    class LocalContainer(Container):
        pass

    snapshot = await LocalContainer().make(Snapshot)
    assert snapshot.converter.freeze([1, 2]) == (1, 2)

asyncio.run(main())
```

<a id="freezethaw-method-freeze"></a>

## `freeze(obj: object) -> object`

This static method copies supported containers and returns `dict` values as `MappingProxyType`, and `list`/`tuple` values as tuples. Empty dictionaries become empty proxies; empty lists and tuples become `()`. It traverses container values and sequence elements, leaving dictionary keys unchanged. It does not mutate the input. Non-container objects are returned by identity, including sets and custom mutable objects. An existing `MappingProxyType` is returned unchanged without traversing its contents.

For ordinary container trees, nested supported containers are converted recursively. This is not a universal deep immutability guarantee: existing proxies and unsupported mutable values may still expose changes. The method declares no custom validation exception. Assigning to the resulting proxy or tuple raises Python's `TypeError`.

```python
from types import MappingProxyType
from orionis.support.structures.freezer import FreezeThaw

source = {"items": [1, {"enabled": True}], "pair": (2, 3)}
frozen = FreezeThaw.freeze(source)
assert isinstance(frozen, MappingProxyType)
assert isinstance(frozen["items"], tuple)
assert isinstance(frozen["items"][1], MappingProxyType)
assert frozen["items"][1]["enabled"] is True
source["items"].append(4)
assert len(frozen["items"]) == 2
try:
    frozen["new"] = 1
except TypeError:
    pass

mutable = []
proxy = MappingProxyType({"items": mutable})
assert FreezeThaw.freeze(proxy) is proxy
mutable.append(1)
assert proxy["items"] == [1]
unsupported = {1, 2}
assert FreezeThaw.freeze(unsupported) is unsupported
```

<a id="freezethaw-method-thaw"></a>

## `thaw(obj: object) -> object`

This static method returns mutable copies: dictionaries and `MappingProxyType` become plain dictionaries; lists and tuples become lists. It recursively traverses their values/elements, preserves repeated supported-container references with an identity cache, and reconnects container cycles. Empty mappings become `{}` and empty sequences become `[]`. Dictionary keys are not converted. The source is unchanged; unsupported objects are returned by identity, so nested sets and custom mutable objects remain shared. It declares no custom validation exception.

A freeze/thaw round-trip normalizes tuples to lists and dictionary subclasses to plain dictionaries; it does not reconstruct the original container classes.

```python
from types import MappingProxyType
from orionis.support.structures.freezer import FreezeThaw

shared = (1, 2)
source = MappingProxyType({"first": shared, "second": shared})
mutable = FreezeThaw.thaw(source)
assert type(mutable) is dict
assert type(mutable["first"]) is list
assert mutable["first"] is mutable["second"]
mutable["first"].append(3)
assert source["first"] == (1, 2)

cycle = {}
cycle["self"] = cycle
copied_cycle = FreezeThaw.thaw(cycle)
assert copied_cycle is not cycle
assert copied_cycle["self"] is copied_cycle

assert FreezeThaw.thaw(FreezeThaw.freeze({"pair": (1, 2)})) == {
    "pair": [1, 2]
}
```

<a id="freezethaw-boundaries"></a>

## Shared graphs and cycles when freezing

`freeze()` visits objects with a stack, then converts cached copies in reverse discovery order. This ordering works for container trees but is not a complete dependency ordering for arbitrary shared graphs. Some shared arrangements can retain a mutable intermediate copy; a cycle can also retain mutable dictionary/list intermediates instead of pointing to the final frozen root. Do not rely on full recursive immutability or preservation of all aliases for such inputs. The example shows an actual ordering-dependent boundary of the implementation.

```python
from orionis.support.structures.freezer import FreezeThaw

shared = [1]
source = {"outer": {"shared": shared}, "direct": shared}
frozen = FreezeThaw.freeze(source)
assert type(frozen["outer"]["shared"]) is list
assert type(frozen["direct"]) is tuple
assert frozen["outer"]["shared"] is not frozen["direct"]

cycle = {}
cycle["self"] = cycle
frozen_cycle = FreezeThaw.freeze(cycle)
assert type(frozen_cycle["self"]) is dict
assert frozen_cycle["self"] is not frozen_cycle
```

<a id="freezethaw-protocol-serialization"></a>

## Python protocols and serialization

`FreezeThaw` defines no custom constructor, equality, hashing, copy, deep-copy or serialization dunders. It is a stateless holder of static operations; its results have the native protocols of `MappingProxyType`, `tuple`, `dict` or `list`.

A frozen mapping proxy is not directly JSON-serializable or picklable, and `copy.copy`/`copy.deepcopy` cannot copy that proxy through the ordinary reduction path. Use `thaw()` before encoding when the remaining keys and values fit the chosen format. `thaw()` is a container conversion, not a serializer: arbitrary remaining objects may still fail encoding. JSON changes tuples to arrays and does not preserve Python object identity.

```python
import copy
import json
import pickle
from orionis.support.structures.freezer import FreezeThaw

frozen = FreezeThaw.freeze({"items": [1, 2]})
for encode in (json.dumps, pickle.dumps, copy.copy, copy.deepcopy):
    try:
        encode(frozen)
    except TypeError:
        pass
    else:
        raise AssertionError("Mapping proxies are not supported directly")

mutable = FreezeThaw.thaw(frozen)
assert json.loads(json.dumps(mutable)) == {"items": [1, 2]}
assert pickle.loads(pickle.dumps(mutable)) == mutable
```

The `_isContainer` static method is an internal traversal predicate, not a public conversion operation.
