---
title: "Entities and data structures"
description: "Use a dataclass for an application result with known fields; BaseEntity adds recursive serialization and metadata. Use DotDict or StdClass when keys are determined at runtime.…"
editUrl: true
lastUpdated: false
---

See the [DotDict](/en/utilities/helpers/dot-dict), [StdClass](/en/utilities/helpers/std-class), [Sentinel](/en/utilities/helpers/sentinel) and [FreezeThaw](/en/utilities/helpers/freeze-thaw) references for all methods and limitations. This page retains entity integration examples.

Use a dataclass for an application result with known fields; `BaseEntity` adds recursive serialization and metadata. Use `DotDict` or `StdClass` when keys are determined at runtime. These utilities do not validate untrusted input like a Schema. The examples are independent of one another.

## Common workflows

### Define a serializable entity

```python
from dataclasses import dataclass, field
from enum import Enum

from orionis.support.entities import BaseEntity

class Status(Enum):
    ACTIVE = "active"

@dataclass
class Account(BaseEntity):
    name: str
    status: Status = Status.ACTIVE
    tags: list[str] = field(default_factory=list)

account = Account("Ada", tags=["admin"])
assert account.toDict() == {
    "name": "Ada",
    "status": "active",
    "tags": ["admin"],
}
assert [item["name"] for item in account.getFields()] == ["name", "status", "tags"]
```

### Keep application-specific attributes

Use `@dataclass(init=False)` to inherit the keyword-only `BaseEntity` constructor. Declared fields receive their defaults or factories, then the constructor stores public extras and calls `__post_init__()`. A dataclass with its own generated constructor accepts only the fields in that constructor.

```python
from dataclasses import dataclass
from orionis.support.entities import BaseEntity

@dataclass(init=False, frozen=True)
class Report(BaseEntity):
    name: str

report = Report(name="inventory", region="north")
assert report.toDict() == {"name": "inventory", "region": "north"}
assert [f["name"] for f in report.getFields()] == ["name"]
assert report.getFields(include_dynamic=True)[-1] == {
    "name": "region", "types": ["str"], "default": None, "metadata": {"dynamic": True}
}
```

A missing required field, an explicit value for a field declared with `init=False`, a reserved extra name or an extra on an instance without `__dict__` raises `TypeError`. Validate types in your subclass. `toDict()` recursively copies ordinary dataclasses, entities and containers and converts enum members to their values. Use acyclic data.

### Use attribute-oriented data

```python
from orionis.support.types import DotDict, StdClass

settings = DotDict({"mail": {"driver": "smtp"}})
assert settings.mail.driver == "smtp"
assert settings.unknown is None

user = StdClass(name="Ada", active=True)
user.update(role="admin")
assert user.toDict()["role"] == "admin"
assert settings.export() == {"mail": {"driver": "smtp"}}
```

### Freeze configuration snapshots

```python
from types import MappingProxyType

from orionis.support.structures.freezer import FreezeThaw

source = {"hosts": ["a.example", "b.example"], "options": {"tls": True}}
frozen = FreezeThaw.freeze(source)

assert isinstance(frozen, MappingProxyType)
assert frozen["hosts"] == ("a.example", "b.example")
assert FreezeThaw.thaw(frozen) == source
```

## Reference and next steps

[base.py](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/support/entities/base.py) · [dot_dict.py](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/support/types/dot_dict.py) · [std.py](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/support/types/std.py) · [freezer.py](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/support/structures/freezer.py)

[Return to the module index](/en/utilities).
