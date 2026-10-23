---
title: "DotDict"
description: "Acceso a diccionarios mediante atributos, operaciones heredadas, copias y serialización."
editUrl: true
lastUpdated: false
---

`DotDict` amplía el `dict` de Python con consulta, asignación y eliminación mediante atributos. Úsalo para registros dinámicos pequeños cuando sigas necesitando las operaciones de diccionario. Conserva los valores recibidos; no valida datos ni convierte tipos escalares.

## Importación y uso directo

```python
from orionis.support.types import DotDict

settings = DotDict({"server": {"port": 8000}})
assert settings.server.port == 8000
settings.server.port = 9000
assert settings["server"]["port"] == 9000
```

## Inyección de dependencias

La clase no depende de servicios del framework. Basta con construirla directamente. Orionis también puede inyectar un `DotDict` vacío en el constructor de otra clase; llénalo explícitamente para la operación que lo necesite. La construcción automática no carga datos de peticiones ni configuraciones de la aplicación.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.types import DotDict

class Report:
    def __init__(self, values: DotDict) -> None:
        self.values = values

async def main() -> None:
    class LocalContainer(Container):
        pass

    report = await LocalContainer().make(Report)
    report.values.name = "Orionis"
    assert report.values["name"] == "Orionis"

asyncio.run(main())
```

<a id="dotdict-method-init"></a>

## Construcción: constructor heredado de `dict`

`DotDict()`, `DotDict(mapping, /, **kwargs)` y `DotDict(iterable, /, **kwargs)` crean un diccionario mutable. Los argumentos de palabra clave sobrescriben las claves repetidas del origen. La construcción no envuelve anticipadamente los diccionarios anidados ni los que están dentro de listas. Las entradas inválidas siguen a `dict`: por ejemplo, pares de clave/valor mal formados producen `ValueError` y claves no hashables producen `TypeError`.

```python
from orionis.support.types import DotDict

data = DotDict([("name", "old")], name="Orionis", config={"debug": True})
assert data["name"] == "Orionis"
assert type(data["config"]) is dict
assert DotDict() == {}
```

<a id="dotdict-method-getattr"></a>

## `__getattr__(self, key: str) -> object | None`

El acceso por atributo utiliza este método cuando la búsqueda normal de Python no encuentra el nombre. Devuelve `None` si falta la clave. Un valor de tipo exacto `dict` se convierte en `DotDict` y el reemplazo se guarda en el padre. Los demás valores, incluidas las subclases de diccionario y los diccionarios dentro de listas, permanecen sin cambios. Los métodos existentes, como `items`, tienen prioridad sobre las claves; accede a esas claves con corchetes. Como los atributos ausentes devuelven `None`, `hasattr(data, "missing")` es `True`; comprueba la pertenencia de la clave.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True}, items="stored value")
assert data.config.debug is True
assert data["config"] is data.config
assert data.missing is None
assert hasattr(data, "missing") is True
assert "missing" not in data
assert callable(data.items)
assert data["items"] == "stored value"
```

<a id="dotdict-method-setattr"></a>

## `__setattr__(self, key: str, value: object) -> None`

`data.name = value` guarda una entrada del diccionario y el método devuelve `None`. Un `dict` exacto se envuelve una vez; los niveles internos se envuelven cuando se accede a ellos por atributo. La operación reemplaza una entrada existente. No crea un atributo de instancia independiente.

```python
from orionis.support.types import DotDict

data = DotDict()
data.config = {"nested": {"enabled": True}}
assert type(data["config"]) is DotDict
assert type(data["config"]["nested"]) is dict
data.name = "Orionis"
data.name = "Updated"
assert data["name"] == "Updated"
```

<a id="dotdict-method-delattr"></a>

## `__delattr__(self, key: str) -> None`

`del data.name` elimina la entrada correspondiente. El método devuelve `None` y produce `AttributeError` si la clave no existe, encadenando el `KeyError` original.

```python
from orionis.support.types import DotDict

data = DotDict(name="Orionis")
del data.name
assert "name" not in data
try:
    del data.name
except AttributeError as error:
    assert isinstance(error.__cause__, KeyError)
```

<a id="dotdict-method-get"></a>

## `get(self, key: str, default: object | None = None) -> object | None`

Devuelve el valor almacenado o `default` (`None` por defecto). Si el resultado es un `dict` exacto, lo envuelve y lo guarda bajo `key`. Esto también se aplica a un diccionario usado como valor predeterminado: consultar una clave ausente con ese valor **inserta** el diccionario envuelto. Los demás valores predeterminados no insertan entradas. No hay conversión de los valores.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True})
assert data.get("config").debug is True
assert data.get("absent") is None
assert "absent" not in data
fallback = data.get("created", {"port": 8000})
assert isinstance(fallback, DotDict)
assert data["created"] is fallback
assert fallback.port == 8000
```

<a id="dotdict-method-export"></a>

## `export(self) -> dict[str, Any]`

Devuelve un nuevo diccionario estándar y convierte recursivamente los valores que son diccionarios. No modifica el origen. Solo recorre valores de diccionario: listas, tuplas, objetos personalizados y su contenido conservan sus referencias. Las subclases de diccionario se normalizan. No hay caché de ciclos; un ciclo alcanzado a través de valores de diccionario produce `RecursionError`.

```python
from orionis.support.types import DotDict

rows = [DotDict(id=1)]
data = DotDict(config=DotDict(debug=True), rows=rows)
result = data.export()
assert type(result) is dict
assert type(result["config"]) is dict
assert result["rows"] is rows
assert type(result["rows"][0]) is DotDict
result["config"]["debug"] = False
assert data.config.debug is True
```

<a id="dotdict-method-copy"></a>

## `copy(self) -> DotDict`

Devuelve un nuevo `DotDict` y copia recursivamente los valores de diccionario a nuevos objetos `DotDict`. Aunque el docstring lo denomina “copia profunda”, este método comparte los valores que no son diccionarios, incluidas las listas mutables. No modifica el origen ni conserva la identidad compartida de los diccionarios. Los ciclos entre diccionarios producen `RecursionError`. Usa `copy.deepcopy` de Python cuando también debas copiar listas y otros valores compatibles.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True}, rows=[1])
result = data.copy()
assert type(result) is DotDict
assert type(result["config"]) is DotDict
result.config.debug = False
assert data.config.debug is True
result.rows.append(2)
assert data.rows == [1, 2]
```

<a id="dotdict-method-clear"></a>

## Heredado: `clear(self) -> None`

Elimina todas las entradas y devuelve `None`.

```python
from orionis.support.types import DotDict

data = DotDict(a=1)
assert data.clear() is None
assert data == {}
```

<a id="dotdict-method-fromkeys"></a>

## Heredado: `fromkeys(iterable, value=None, /)`

El método de clase heredado devuelve un nuevo `DotDict` y asigna la misma referencia de `value` a todas las claves. Su valor predeterminado es `None`; no envuelve diccionarios. Las claves no hashables producen `TypeError`.

```python
from orionis.support.types import DotDict

shared = []
data = DotDict.fromkeys(["first", "second"], shared)
assert type(data) is DotDict
data["first"].append(1)
assert data["second"] == [1]
assert DotDict.fromkeys(["unset"])["unset"] is None
```

<a id="dotdict-method-items"></a>

## Heredado: `items(self)`

Devuelve una vista dinámica de pares `(clave, valor)` sin envolver valores anidados. No modifica el diccionario. Cambiar su tamaño durante la iteración puede producir `RuntimeError`.

```python
from orionis.support.types import DotDict

data = DotDict(a=1)
view = data.items()
data["b"] = 2
assert list(view) == [("a", 1), ("b", 2)]
```

<a id="dotdict-method-keys"></a>

## Heredado: `keys(self)`

Devuelve una vista dinámica de claves en orden de inserción, sin modificar el diccionario. Iterar mientras cambia su tamaño puede producir `RuntimeError`.

```python
from orionis.support.types import DotDict

data = DotDict(a=1)
view = data.keys()
data["b"] = 2
assert list(view) == ["a", "b"]
```

<a id="dotdict-method-values"></a>

## Heredado: `values(self)`

Devuelve una vista dinámica de los valores almacenados sin envolver diccionarios ni modificar el origen. Iterar mientras cambia su tamaño puede producir `RuntimeError`.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True})
view = data.values()
assert type(next(iter(view))) is dict
data["count"] = 2
assert len(view) == 2
```

<a id="dotdict-method-pop"></a>

## Heredado: `pop(self, key, /, [default])`

Elimina y devuelve una entrada sin convertir su valor. Si la clave está ausente, devuelve el valor predeterminado indicado; si no se indicó ninguno, produce `KeyError`. No hay un valor predeterminado implícito de `None`.

```python
from orionis.support.types import DotDict

data = DotDict(config={"debug": True})
assert type(data.pop("config")) is dict
assert data.pop("missing", None) is None
try:
    data.pop("missing")
except KeyError:
    assert data == {}
```

<a id="dotdict-method-popitem"></a>

## Heredado: `popitem(self)`

Elimina y devuelve el par `(clave, valor)` insertado más recientemente. Produce `KeyError` si está vacío y no envuelve el valor devuelto.

```python
from orionis.support.types import DotDict

data = DotDict(a=1, b=2)
assert data.popitem() == ("b", 2)
assert data == {"a": 1}
```

<a id="dotdict-method-setdefault"></a>

## Heredado: `setdefault(self, key, default=None, /)`

Devuelve un valor existente o inserta y devuelve `default` si la clave no existe. Ninguna ruta envuelve valores de diccionario. El valor predeterminado es `None`. Las claves no hashables producen `TypeError`.

```python
from orionis.support.types import DotDict

data = DotDict()
fallback = {"debug": True}
assert data.setdefault("config", fallback) is fallback
assert type(data["config"]) is dict
assert data.setdefault("config", {"debug": False}) is fallback
assert data.setdefault("unset") is None
```

<a id="dotdict-method-update"></a>

## Heredado: `update(self, [mapping_or_iterable], /, **kwargs) -> None`

Añade o reemplaza entradas y devuelve `None`. Los argumentos de palabra clave tienen prioridad sobre el origen posicional. No envuelve diccionarios. Las entradas inválidas pueden producir `TypeError` o `ValueError`; las entradas procesadas antes del error pueden quedar guardadas.

```python
from orionis.support.types import DotDict

data = DotDict(a=1)
assert data.update({"a": 2, "config": {"debug": True}}, a=3) is None
assert data["a"] == 3
assert type(data["config"]) is dict
```

<a id="dotdict-protocol-dictionary"></a>

## Protocolos de diccionario

Estas operaciones se heredan de `dict` y de sus protocolos de objeto, sin conversión específica de valores de DotDict. La tabla muestra sus puntos de entrada de Python. Los cambios de tamaño durante la iteración pueden producir `RuntimeError`; las operaciones por clave exigen claves hashables.

| Protocolo | Comportamiento |
| --- | --- |
| <a id="dotdict-method-getitem"></a>`__getitem__(self, key, /)` | `data[key]` devuelve el valor almacenado sin envolverlo; una clave ausente produce `KeyError`. |
| <a id="dotdict-method-setitem"></a>`__setitem__(self, key, value, /) -> None` | La asignación con corchetes guarda el valor sin envolver diccionarios. |
| <a id="dotdict-method-delitem"></a>`__delitem__(self, key, /) -> None` | La eliminación con corchetes modifica el diccionario; una clave ausente produce `KeyError`. |
| <a id="dotdict-method-iter"></a>`__iter__(self)` | La iteración produce claves en orden de inserción. |
| <a id="dotdict-method-reversed"></a>`__reversed__(self)` | `reversed(data)` produce claves en orden inverso al de inserción. |
| <a id="dotdict-method-len"></a>`__len__(self) -> int` | `len(data)` cuenta las entradas; un diccionario vacío es falso en un contexto booleano mediante este protocolo. |
| <a id="dotdict-method-contains"></a>`__contains__(self, key, /) -> bool` | La pertenencia comprueba claves; las claves no hashables producen `TypeError`. |
| <a id="dotdict-method-eq"></a>`__eq__(self, other, /)` | La igualdad compara el contenido, incluso con diccionarios estándar. |
| <a id="dotdict-method-ne"></a>`__ne__(self, other, /)` | La desigualdad sigue la comparación del contenido del diccionario. |
| <a id="dotdict-method-or"></a>`__or__(self, other, /)` | La unión con otro diccionario devuelve un `dict` estándar; prevalecen los valores de la derecha. |
| <a id="dotdict-method-ror"></a>`__ror__(self, other, /)` | La unión inversa también devuelve un `dict` estándar. |
| <a id="dotdict-method-ior"></a>`__ior__(self, other, /)` | La unión en sitio actualiza y devuelve el mismo `DotDict`, aceptando entradas como las de `update`. |
| <a id="dotdict-method-repr"></a>`__repr__(self) -> str` | `repr(data)` utiliza la representación de un diccionario. |
| <a id="dotdict-method-str"></a>`__str__(self) -> str` | `str(data)` también muestra el contenido del diccionario. |


```python
from orionis.support.types import DotDict

data = DotDict(a=1, b=2)
data["config"] = {"debug": True}
assert type(data["config"]) is dict
assert data["a"] == 1
del data["config"]
assert list(data) == ["a", "b"]
assert list(reversed(data)) == ["b", "a"]
assert len(data) == 2 and bool(data)
assert "a" in data
assert data == {"a": 1, "b": 2}
assert data != {"a": 9}
merged = data | {"b": 3}
assert type(merged) is dict and merged["b"] == 3
reverse_merged = {"b": 0} | data
assert type(reverse_merged) is dict and reverse_merged["b"] == 2
original = data
data |= [("c", 3)]
assert data is original and data.c == 3
assert repr(data) == "{'a': 1, 'b': 2, 'c': 3}"
assert str(data) == repr(data)
try:
    data["missing"]
except KeyError:
    pass
```

<a id="dotdict-method-hash"></a>

## `__hash__ = None`

`DotDict` es mutable y no es hashable. Llamar a `hash(data)` o usar una instancia como clave de diccionario produce `TypeError`.

```python
from orionis.support.types import DotDict

try:
    hash(DotDict(a=1))
except TypeError:
    pass
```

<a id="dotdict-protocol-copy-serialization"></a>

## Copia y serialización de Python

No se define `__copy__`, `__deepcopy__` ni un hook de serialización personalizado. `copy.copy` de Python usa el protocolo de reducción heredado y crea un `DotDict` superficial; `copy.deepcopy` copia recursivamente el contenido compatible. Un recorrido de pickle conserva el tipo `DotDict` para valores serializables normales. JSON lo acepta como diccionario y su decodificación devuelve un `dict` estándar; se aplican las restricciones normales de JSON sobre claves, valores y ciclos. `export()` no codifica JSON.

```python
import copy
import json
import pickle
from orionis.support.types import DotDict

data = DotDict(rows=[1])
shallow = copy.copy(data)
deep = copy.deepcopy(data)
restored = pickle.loads(pickle.dumps(data))
assert type(shallow) is DotDict and shallow["rows"] is data["rows"]
assert type(deep) is DotDict and deep["rows"] is not data["rows"]
assert type(restored) is DotDict and restored == data
assert json.loads(json.dumps(data)) == {"rows": [1]}
```
