---
title: "Entidades y estructuras de datos"
description: "Usa una dataclass para representar un resultado de aplicación con campos conocidos; BaseEntity añade serialización recursiva y metadatos. Usa DotDict o StdClass cuando las…"
editUrl: true
lastUpdated: false
---

Consulta las referencias de [DotDict](/es/utilities/helpers/dot-dict), [StdClass](/es/utilities/helpers/std-class), [Sentinel](/es/utilities/helpers/sentinel) y [FreezeThaw](/es/utilities/helpers/freeze-thaw) para conocer todos sus métodos y límites. Esta página conserva los ejemplos de integración con entidades.

Usa una dataclass para representar un resultado de aplicación con campos conocidos; `BaseEntity` añade serialización recursiva y metadatos. Usa `DotDict` o `StdClass` cuando las claves se conocen durante la ejecución. Estas utilidades no validan datos externos como un Schema. Los ejemplos son independientes entre sí.

## Flujos de trabajo comunes

### Definir una entidad serializable

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

### Conservar atributos propios de la aplicación

Usa `@dataclass(init=False)` para heredar el constructor de `BaseEntity`, que recibe argumentos por nombre. Inicializa los campos declarados con sus valores o fábricas, guarda los atributos públicos adicionales y llama a `__post_init__()`. Una dataclass con constructor generado acepta los campos de ese constructor.

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

Omitir un campo obligatorio, pasar un campo declarado con `init=False`, usar un nombre reservado o añadir un atributo a una instancia sin `__dict__` produce `TypeError`. Valida los tipos en tu subclase. `toDict()` copia recursivamente entidades, dataclasses y contenedores, y convierte los miembros de enum en sus valores. Usa datos sin ciclos.

### Usar datos orientados a atributos

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

### Congelar instantáneas de configuración

```python
from types import MappingProxyType

from orionis.support.structures.freezer import FreezeThaw

source = {"hosts": ["a.example", "b.example"], "options": {"tls": True}}
frozen = FreezeThaw.freeze(source)

assert isinstance(frozen, MappingProxyType)
assert frozen["hosts"] == ("a.example", "b.example")
assert FreezeThaw.thaw(frozen) == source
```

## Referencia y próximos pasos

[base.py](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/support/entities/base.py) · [dot_dict.py](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/support/types/dot_dict.py) · [std.py](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/support/types/std.py) · [freezer.py](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/support/structures/freezer.py)

[Volver al índice del módulo](/es/utilities).
