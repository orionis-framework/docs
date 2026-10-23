---
title: "Sentinel"
description: "Usa MISSING para distinguir valores omitidos de None, falso y otros valores explícitos."
editUrl: true
lastUpdated: false
---

`MISSING` es un objeto marcador exportado que representa un valor omitido. Distingue esa ausencia de `None`, `False`, `0` y cadenas vacías explícitos. El título «Sentinel» nombra este patrón; no existe una clase pública `Sentinel` para instanciar.

## Importación y uso directo

Utiliza la importación pública del paquete y compara por identidad. Tanto un argumento predeterminado como una consulta de diccionario pueden mantener la distinción entre datos ausentes y datos explícitamente vacíos.

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

## Inyección de dependencias

Importa y pasa `MISSING`, o úsalo como argumento predeterminado. Es un valor ya creado, no una clase concreta de servicio inyectable. No hay una dependencia `Sentinel` que resolver mediante un constructor y no se requiere iniciar el contenedor. El tipo de implementación `_MISSING_TYPE` es privado.

<a id="sentinel-method-repr"></a>

## `__repr__(self) -> str`

Devuelve exactamente la cadena `"<MISSING>"` sin modificar el marcador. El comportamiento heredado de `str()` también utiliza esta representación; el texto sirve para diagnóstico, no para serializar su identidad.

```python
from orionis.support.types import MISSING

assert repr(MISSING) == "<MISSING>"
assert str(MISSING) == "<MISSING>"
```

<a id="sentinel-method-bool"></a>

## `__bool__(self) -> bool`

Siempre devuelve `False`. `not MISSING` es `True` y las condiciones toman la rama falsa. Esto no hace que el marcador sea igual a `False`, `None` ni cero. Una comprobación booleana no distingue todos los valores ausentes de los valores falsos explícitos; utiliza `is MISSING`.

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

## Identidad, igualdad y hash

La clase privada de implementación no redefine la igualdad ni el hash. Sus instancias usan igualdad por identidad y el hash normal de objeto, por lo que el marcador importado puede ser una clave de diccionario o un miembro de un conjunto. Importar `MISSING` repetidamente devuelve el mismo objeto. La clase de implementación no impone una construcción singleton: crear una instancia con `type(MISSING)` produce un objeto diferente con la misma representación. El código de la aplicación debe importar el marcador exportado.

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

## Copia y serialización de Python

No se define `__copy__`, `__deepcopy__` ni una reducción personalizada de pickle. La copia superficial, la profunda y la reconstrucción mediante pickle crean cada una una instancia diferente: su resultado **no** es `MISSING` al comparar identidades. Evita copiar o guardar el marcador con pickle si el código posterior depende de `is MISSING`; conserva el objeto importado o codifica la ausencia explícitamente. JSON no lo serializa de forma predeterminada y produce `TypeError`.

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

El marcador no define otros métodos públicos, propiedades, operaciones de diccionario ni protocolo de iteración.
