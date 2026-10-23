---
title: "StdClass"
description: "Registros dinámicos de atributos, nombres reservados, conversión, igualdad y protocolos de Python."
editUrl: true
lastUpdated: false
---

`StdClass` es un objeto mutable ligero cuyos datos se guardan en atributos de instancia. Úsalo para registros dinámicos en memoria. Su contrato `IStdClass` cubre `toDict`, `update` y `remove`; no hay validación por esquema, conversión recursiva de valores ni interfaz de diccionario.

## Importación y uso directo

```python
from orionis.support.types import StdClass

record = StdClass(name="Orionis", enabled=True)
record.update(version=1)
assert record.toDict() == {"name": "Orionis", "enabled": True, "version": 1}
```

## Inyección de dependencias

La construcción directa no necesita iniciar la aplicación. Orionis puede inyectar la clase concreta y crea un registro vacío si no se proporcionan datos al constructor. El contrato abstracto `IStdClass` requiere un enlace explícito si eliges inyectar ese contrato.

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

Crea un objeto vacío o pasa los argumentos de palabra clave a `update()`. No hay parámetros posicionales de datos ni conversiones de valores. El constructor devuelve `None` al terminar. Los nombres reservados producen `ValueError` mediante `update`; pasar datos como argumento posicional produce `TypeError`.

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

Es un atributo de clase que contiene los nombres declarados en todo el MRO, además de `RESERVED`. La inicialización, `update()` y `fromDict()` rechazan estos nombres y cualquier cadena que empiece y termine con `__`. El conjunto se reconstruye al declarar una subclase. La asignación normal de atributos y las modificaciones directas de `__dict__` omiten esta validación y pueden ocultar métodos.

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

Devuelve una copia superficial del diccionario de atributos, sin modificar el objeto. Cambiar una entrada de primer nivel en el diccionario devuelto es independiente; los objetos mutables anidados siguen compartidos. Este método no serializa objetos anidados recursivamente.

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

Añade o reemplaza atributos y devuelve `None`. Comprueba los nombres en el orden de inserción de los argumentos y produce `ValueError` en el primer nombre reservado. Las asignaciones anteriores permanecen aplicadas: la operación no es atómica. Sin argumentos no hace cambios. Guarda los valores por referencia, sin validarlos ni convertirlos. Como en cualquier llamada con palabras clave, las claves no textuales expandidas con `**` producen `TypeError`.

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

Elimina los atributos de instancia indicados en orden y devuelve `None`. Los nombres ausentes producen `AttributeError`, encadenado desde `KeyError`; los atributos eliminados antes del error siguen eliminados. Sin nombres no hace cambios. Elimina datos de instancia, no atributos de clase ni métodos.

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

Este método de clase reserva una nueva instancia de `cls` y copia las entradas del diccionario a sus atributos, aplicando las mismas comprobaciones de nombres reservados de `update()`. Devuelve la nueva instancia y deja intacto el origen. Guarda los valores por referencia y no llama a `__init__`, ni siquiera a una implementación de una subclase. Los nombres reservados producen `ValueError`. Se esperan claves de texto: una clave entera produce `AttributeError` al acceder a sus métodos de cadena. Los objetos sin `.items()` también producen `AttributeError`.

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

Python llama automáticamente a este método de clase al definir una subclase. Reenvía los argumentos de palabra clave al hook padre y reconstruye el conjunto `RESERVED` de la subclase a partir de su MRO completo. Devuelve `None`. La cadena padre predeterminada no admite palabras clave arbitrarias al declarar subclases; pueden producir `TypeError` si otra base no las consume.

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

Devuelve `True` solo cuando los tipos concretos coinciden exactamente y sus diccionarios de atributos son iguales. Las instancias de subclases diferentes no son iguales aunque tengan los mismos datos; tampoco son iguales a diccionarios estándar. No modifica ninguno de los objetos. El protocolo heredado de desigualdad de Python sigue este resultado.

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

Devuelve el XOR de `hash((nombre, valor))` para cada atributo de instancia. El orden de los atributos no afecta el resultado; el hash de un objeto vacío es `0`. Cada valor debe ser hashable; de lo contrario, el cálculo produce `TypeError`. Como modificar atributos puede cambiar el hash, conserva sus atributos mientras el objeto sea una clave de diccionario o un miembro de un conjunto.

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

Devuelve el nombre de la clase concreta seguido de la representación de su diccionario de atributos: `StdClass({'x': 1})`. Sirve para inspección; no serializa a JSON ni reconstruye valores arbitrarios.

```python
from orionis.support.types import StdClass

class Record(StdClass):
    pass

assert repr(StdClass(x=1)) == "StdClass({'x': 1})"
assert repr(Record(x=1)) == "Record({'x': 1})"
```

<a id="stdclass-method-str"></a>

## `__str__(self) -> str`

Devuelve la forma textual del diccionario de atributos de la instancia, sin el nombre de la clase. No modifica los datos.

```python
from orionis.support.types import StdClass

assert str(StdClass(x=1)) == "{'x': 1}"
assert str(StdClass()) == "{}"
```

<a id="stdclass-protocol-attributes"></a>

## Comportamiento nativo de atributos

Los atributos usan el protocolo normal de objetos de Python: lee con `record.name`, asigna con `record.name = value` o `setattr`, y elimina con `del` o `delattr`. Las lecturas y eliminaciones ausentes producen `AttributeError`; `hasattr` devuelve correctamente `False` para atributos ausentes. `vars(record)` expone el `__dict__` activo; `toDict()` crea una copia superficial. La clase no implementa protocolos de diccionario ni de iteración: `record[key]`, `len(record)` e `iter(record)` producen `TypeError`. Al no tener un hook de longitud ni de conversión booleana, incluso un `StdClass` vacío es verdadero en un contexto booleano.

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

## Copia y serialización de Python

La clase no define `copy`, `__copy__`, `__deepcopy__` ni un hook de pickle propio. Los protocolos estándar de copia y reducción de Python funcionan para el estado habitual de la instancia: `copy.copy` comparte valores anidados y `copy.deepcopy` copia los valores anidados compatibles. Pickle conserva la clase y los atributos cuando la clase es importable y sus valores son serializables. JSON no acepta `StdClass` directamente: utiliza `toDict()` y comprueba que los valores restantes sean compatibles con JSON. La decodificación de JSON devuelve un diccionario; llama a `fromDict()` para reconstruir el registro.

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
