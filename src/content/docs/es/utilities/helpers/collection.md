---
title: "Collection"
description: "Referencia completa de Collection en memoria: construcción, transformaciones, filtros, mutación, agregación, serialización y protocolos de Python."
editUrl: true
lastUpdated: false
---

`Collection` envuelve datos ya cargados en memoria. Impórtala desde `orionis.support.types`; `orionis.support.types.collection.Collection` es la misma clase. Filtrar una colección no ejecuta SQL.

## Construcción y propiedad de los datos

<a id="collection-method-init"></a>

### `Collection(items: list[Any] | None = None)` — `__init__`

El inicializador `__init__(self, items: list[Any] | None = None) -> None` crea una instancia con una lista vacía de atributos adicionales para serialización. `None`, un argumento omitido o cualquier entrada falsy se convierte en una lista vacía nueva. Una lista no vacía se conserva por referencia, sin copiarla ni validar sus elementos. La implementación también conserva otras entradas truthy sin modificarlas; esto no hace que todas las operaciones sean compatibles con su tipo. En particular, `pluck(value, key)` y `groupBy(key)` producen intencionalmente colecciones respaldadas por diccionarios. Lee esos resultados mediante `all()` o sus claves de diccionario; la iteración entrega claves y los métodos exclusivos de listas, como `push`, `sort`, `first`, los slices y `pop`, no sirven como operaciones generales de diccionario. Los resultados de diccionario vacíos se convierten en `[]` por la regla del constructor para entradas falsy.

```python
from orionis.support.types import Collection

assert Collection().all() == []
assert Collection(None).all() == []
source = [{"price": 8, "active": True}, {"price": 3, "active": False}]
products = Collection(source)
assert products.all() is source
total = products.where("active", True).sum("price")
assert total == 8
assert products.count() == 2
assert Collection({}).all() == []
empty = []
assert Collection(empty).all() is not empty
selected = products.filter(lambda product: product["active"])
assert selected is not products and selected[0] is source[0]
```

Construye explícitamente la colección al proporcionar datos de la aplicación: `Collection(payload)`. Un parámetro de constructor anotado como `Collection` no carga automáticamente datos de la solicitud, filas de una base de datos ni otro payload. Pasa la instancia poblada a tu servicio de forma explícita o configura su proveedor en el contenedor de la aplicación.

Las operaciones descritas como **nueva** crean una colección, pero no copian profundamente los objetos anidados. La mayoría usa `self.__class__`; `groupBy` devuelve explícitamente la clase base `Collection`. Las colecciones nuevas comienzan sin atributos adicionales de serialización. **Misma instancia** significa que el método modifica y devuelve `self`.

| Resultado o efecto | Métodos |
| --- | --- |
| Colección nueva | `take`, `chunk`, `collapse`, `diff`, `filter`, `flatten`, `forPage`, `map`, `mapInto`, `pluck`, `groupBy`, `where`, `whereIn`, `whereNotIn`, `zip`, slices; normalmente `unique` |
| Misma instancia | `each`, `forget`, `merge`, `prepend`, `push`, `put`, `reject`, `reverse`, `sort`, `transform`, `setAppends`, `addRelation`; `random(count)` cuando `count > 0` |
| Extrae y devuelve un elemento | `pop`, `pull`, `shift` |
| Expone los datos de respaldo | `all` |

`each`, `forget`, `merge`, `prepend`, `push`, `put`, `reverse`, `sort` y las escrituras con corchetes modifican los datos de respaldo existentes. `reject`, `transform` y `random` con un conteo positivo sustituyen la lista de la instancia; una referencia obtenida antes con `all()` deja de seguir esas sustituciones. `setAppends` modifica metadatos de serialización; `addRelation` modifica los objetos que implementan el hook correspondiente.

## Inyección explícita mediante constructor

Cuando un servicio necesita datos fijos ya cargados, registra esa instancia antes de resolverlo. Este ejemplo con un contenedor aislado comparte deliberadamente la misma colección mutable entre sus resoluciones. El binding proporciona los valores; la anotación del parámetro no carga automáticamente el payload de una solicitud.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.types import Collection

class SalesContainer(Container):
    pass

class SalesReport:
    def __init__(self, rows: Collection) -> None:
        self.rows = rows

    def total(self) -> int:
        return self.rows.sum("price")

async def main() -> None:
    populated = Collection([{"price": 8}, {"price": 3}])
    container = SalesContainer()
    container.instance(Collection, populated)
    report = await container.make(SalesReport)
    assert report.rows is populated
    assert report.total() == 11

asyncio.run(main())
```

## Lectura y comprobación de elementos

<a id="collection-method-all"></a>

### `all() -> list[Any]`

Devuelve la estructura de respaldo real, sin copiarla. Aunque la anotación indica una lista, una colección respaldada por un diccionario devuelve ese diccionario.

<a id="collection-method-count"></a>

### `count() -> int`

Devuelve su longitud; no acepta un valor ni un predicado como argumento.

<a id="collection-method-isempty"></a>

### `isEmpty() -> bool`

Devuelve `not bool(collection)` mediante el protocolo de longitud.

```python
from orionis.support.types import Collection

items = Collection(["a", "b"])
items.all().append("c")
assert items.count() == 3
assert not items.isEmpty()
assert Collection().isEmpty()
```

<a id="collection-method-first"></a>

### `first(callback: Callable | None = None) -> object`

Devuelve el primer elemento o el primero para el que `callback(item)` sea truthy. Se detiene al encontrar la primera coincidencia. Devuelve `None` si la lista está vacía o no hay coincidencias.

<a id="collection-method-last"></a>

### `last(callback: Callable | None = None) -> object`

Devuelve el último elemento o la última coincidencia; en otro caso, `None`. Con callback recorre todos los elementos. Un `None` coincidente no se distingue de la ausencia de coincidencias.

```python
from orionis.support.types import Collection

items = Collection([1, 2, 3, 4])
assert items.first() == 1
assert items.first(lambda item: item > 2) == 3
assert items.last() == 4
assert items.last(lambda item: item < 4) == 3
assert items.first(lambda item: item > 9) is None
assert items.last(lambda item: item > 9) is None
assert Collection().first() is None
assert Collection().last() is None
```

<a id="collection-method-get"></a>

### `get(key: int | str, default: object = None) -> object`

Lee mediante acceso con corchetes. Si falta el índice o la clave (`IndexError`, `KeyError`), devuelve el valor predeterminado; si este es callable, lo invoca sin argumentos únicamente cuando falta el dato. Admite índices negativos de lista. No interpreta rutas anidadas. Un tipo de clave inválido para una lista sigue produciendo `TypeError`; un slice funciona en ejecución y devuelve una colección nueva.

```python
from orionis.support.types import Collection

items = Collection([10, 20])
assert items.get(0) == 10
assert items.get(-1) == 20
assert items.get(9) is None
assert items.get(9, "missing") == "missing"
assert items.get(9, lambda: "computed") == "computed"
assert items.get(slice(0, 1)).all() == [10]
assert Collection({"name": "Ada"}).get("name") == "Ada"
```

<a id="collection-method-contains"></a>

### `contains(key: str | Callable, value: object = None) -> bool`

Tiene tres formas: `contains(item)` usa pertenencia ordinaria; `contains(predicate)` evalúa `predicate(item)` hasta encontrar una coincidencia truthy; `contains(path, value)` compara el dato extraído usando igualdad de Python. La tercera forma solo se selecciona cuando `value is not None`: para buscar un campo `None`, usa un predicado. Un primer argumento callable siempre se interpreta como predicado si no se suministra un segundo valor distinto de `None`.

<a id="collection-method-every"></a>

### `every(callback: Callable) -> bool`

Evalúa `callback(item)` hasta obtener un resultado falsy. Una colección vacía devuelve `True`.

```python
from orionis.support.types import Collection

assert Collection([1, 2, 3]).contains(2)
assert Collection([1, 2, 3]).contains(lambda item: item > 2)
rows = Collection([{"name": "Ada", "note": None}])
assert rows.contains("name", "Ada")
assert rows.contains(lambda row: row["note"] is None)
assert not rows.contains("note", None)
assert Collection([2, 4]).every(lambda item: item % 2 == 0)
assert Collection().every(lambda item: False)
```

## Callbacks y transformaciones

`first`, `last`, `each`, `every`, `filter`, `map`, `reject` y `transform` validan los callbacks y producen `ValueError` si no son invocables. El callback recibe **un elemento**, nunca un índice o una clave. Las excepciones que genere se propagan. La llamada es síncrona y no espera callbacks async. `reduce` tiene su propio contrato de dos argumentos, explicado más adelante.

<a id="collection-method-map"></a>

### `map(callback: Callable) -> Collection`

**Nueva.** Conserva todos los resultados de `callback(item)`, incluidos los valores falsy.

<a id="collection-method-filter"></a>

### `filter(callback: Callable) -> Collection`

**Nueva.** Conserva los elementos cuyo resultado de `callback(item)` sea truthy. El callback es obligatorio; no existe una forma sin parámetros que filtre por truthiness.

<a id="collection-method-reject"></a>

### `reject(callback: Callable) -> Collection`

**Misma instancia.** Sustituye la lista por los elementos cuyo callback devuelva un resultado falsy.

<a id="collection-method-transform"></a>

### `transform(callback: Callable) -> Collection`

**Misma instancia.** Sustituye la lista por todos los resultados del callback, incluidos `0`, `False` y `None`.

<a id="collection-method-each"></a>

### `each(callback: Callable) -> Collection`

**Misma instancia.** Sustituye cada elemento visitado por el resultado truthy del callback. Un resultado falsy detiene el recorrido **antes de sustituir ese elemento**; los posteriores quedan intactos. Un callback que solo tenga efectos secundarios y devuelva `None` se detiene, por tanto, en el primer elemento.

```python
from orionis.support.types import Collection

items = Collection([1, 2, 3])
assert items.map(lambda item: item - 1).all() == [0, 1, 2]
assert items.filter(lambda item: item > 1).all() == [2, 3]
assert items.all() == [1, 2, 3]
assert items.reject(lambda item: item == 2) is items
assert items.all() == [1, 3]
assert items.transform(lambda item: None) is items
assert items.all() == [None, None]
items = Collection([1, 2, 3])
assert items.each(lambda item: item * 10 if item < 2 else 0) is items
assert items.all() == [10, 2, 3]
```

<a id="collection-method-mapinto"></a>

### `mapInto(cls: type, method: str | None = None, **kwargs: object) -> Collection`

**Nueva.** Sin un `method` truthy, invoca `cls(item)`; los `kwargs` suministrados se ignoran en esta forma de constructor. Con nombre de método, lo resuelve sobre la clase e invoca `method(item, **kwargs)`: usa un método estático/de clase adecuado, no un método de instancia ordinario que requiera `self`. Un `cls` que no sea un tipo produce `TypeError`. Un método inexistente genera un `None` por elemento. Los errores por elemento `TypeError`, `AttributeError` o `ValueError` también se convierten en `None`; otras excepciones se propagan.

```python
from orionis.support.types import Collection

class Label:
    def __init__(self, value):
        self.value = str(value)

    @staticmethod
    def format(value, prefix=""):
        return prefix + str(value)

    @classmethod
    def tagged(cls, value):
        return cls.__name__ + ":" + str(value)

assert Collection([1]).mapInto(Label, ignored=True)[0].value == "1"
assert Collection([1, 2]).mapInto(Label, "format", prefix="#").all() == ["#1", "#2"]
assert Collection([1]).mapInto(Label, "tagged").all() == ["Label:1"]
assert Collection(["3", "bad"]).mapInto(int).all() == [3, None]
assert Collection([1]).mapInto(Label, "missing").all() == [None]
```

## Claves, proyección y condiciones

Los lectores de campos usados por `pluck`, `contains(path, value)`, `where`, `whereIn`, `whereNotIn`, `sort(key)`, `groupBy` y `unique` con clave admiten claves simples de diccionario, rutas con puntos en diccionarios, comodines (`*` se traduce a un slice de `dotty_dict`), índices numéricos en texto sobre listas/tuplas y atributos directos de objetos. Un acceso inválido o ausente se convierte en `None`; las rutas de atributos de objetos no se recorren recursivamente. Los índices numéricos deben cumplir `str.isdigit()`, de modo que `"-1"` no selecciona el último elemento anidado. Los comodines devuelven listas y no expanden automáticamente el resultado. Las agregaciones usan otro lector, descrito más adelante.

<a id="collection-method-pluck"></a>

### `pluck(value: str, key: str | None = None) -> Collection`

**Nueva.** Con `key` omitido o falsy, devuelve una lista de valores extraídos que omite `None`, pero conserva otros valores falsy. Con `key` truthy, construye un diccionario indexado por ese campo: conserva valores y claves `None`, las claves duplicadas sobrescriben valores anteriores y las claves no hashables producen `TypeError`. El resultado puede quedar respaldado por un diccionario; un resultado vacío se convierte en `[]`.

```python
from types import SimpleNamespace
from orionis.support.types import Collection

rows = Collection([
    {"id": 1, "name": "Ada"}, {"id": 2, "name": None},
    {"id": 1, "name": "Grace"}, {"id": 3},
])
assert rows.pluck("name").all() == ["Ada", "Grace"]
assert rows.pluck("name", "id").all() == {1: "Grace", 2: None, 3: None}
assert Collection([{"profile": {"name": "Ada"}}]).pluck("profile.name").all() == ["Ada"]
assert Collection([["Ada", 8], ("Grace", 9)]).pluck("0").all() == ["Ada", "Grace"]
assert Collection([SimpleNamespace(name="Ada")]).pluck("name").all() == ["Ada"]
assert Collection([{"users": [{"name": "Ada"}, {"name": "Grace"}]}]).pluck("users.*.name").all() == [["Ada", "Grace"]]
```

<a id="collection-method-where"></a>

### `where(key: str, *args: object) -> Collection`

**Nueva.** `where(key, value)` usa `==`; `where(key, operator, value)` admite `<`, `<=`, `==`, `!=`, `>`, `>=`. Omitir el valor produce `ValueError`. Los argumentos posteriores al operador/valor se ignoran. Primero intenta comparar con las operaciones nativas de Python; un `TypeError` reintenta convirtiendo ambos operandos a texto, lo que puede producir orden lexicográfico. Los operadores no admitidos y los `TypeError`/`ValueError` de comparación hacen que se omita el elemento, normalmente generando una colección vacía en lugar de lanzar una excepción. Los campos ausentes se comparan como `None`.

```python
from orionis.support.types import Collection

rows = Collection([{"v": 1}, {"v": 2}, {"v": 3}])
assert rows.where("v", 2).all() == [{"v": 2}]
expected = {"<": [1], "<=": [1, 2], "==": [2], "!=": [1, 3], ">": [3], ">=": [2, 3]}
for operator, values in expected.items():
    assert rows.where("v", operator, 2).pluck("v").all() == values
assert rows.where("v", "unsupported", 2).isEmpty()
assert rows.where("v", "==", 2, "ignored").count() == 1
assert Collection([{"v": 10}]).where("v", "<", "2").count() == 1
assert Collection([{}]).where("missing", None).count() == 1
```

<a id="collection-method-wherein"></a>

### `whereIn(key: str, values: list[Any] | Collection) -> Collection`

**Nueva.** Conserva elementos cuyo valor extraído sea igual a un miembro de `values` **o tenga la misma representación `str()`**. Admite valores no hashables mediante comparación por igualdad.

<a id="collection-method-wherenotin"></a>

### `whereNotIn(key: str, values: list[Any] | Collection) -> Collection`

**Nueva.** Excluye las mismas coincidencias. Ambos métodos admiten una lista o colección como entrada documentada; no proporcionan comparación estricta de tipos. Otras entradas en ejecución no se validan por tipo y deben ser iterables y reutilizables para los múltiples recorridos de la implementación.

```python
from orionis.support.types import Collection

rows = Collection([{"id": 1}, {"id": "2"}, {"id": 3}])
assert rows.whereIn("id", [1, 2]).all() == [{"id": 1}, {"id": "2"}]
assert rows.whereNotIn("id", Collection([1, 2])).all() == [{"id": 3}]
nested = Collection([{"v": [1]}, {"v": [2]}])
assert nested.whereIn("v", Collection([[2]])).all() == [{"v": [2]}]
assert nested.whereNotIn("v", [[2]]).all() == [{"v": [1]}]
```

## Segmentación, agrupación y combinación

<a id="collection-method-take"></a>

### `take(number: int) -> Collection`

**Nueva.** Un número positivo toma los primeros elementos; uno negativo, los últimos `abs(number)`; cero devuelve una colección vacía. Los límites de slice se ajustan a la longitud disponible.

<a id="collection-method-chunk"></a>

### `chunk(size: int) -> Collection`

**Nueva.** Devuelve una colección de colecciones de hasta `size` elementos. `size <= 0` produce `ValueError`; un tamaño no entero no puede usarse con `range` y produce `TypeError`.

<a id="collection-method-forpage"></a>

### `forPage(page: int, number: int) -> Collection`

**Nueva.** Devuelve una página en memoria de `number` elementos, normalizando `page < 1` a 1. `number <= 0` produce `ValueError`; los índices usados para el slice deben ser enteros. Una página fuera de rango queda vacía. No incluye total de base de datos, consulta ni metadatos de paginador.

```python
from orionis.support.types import Collection

items = Collection([1, 2, 3, 4, 5])
assert items.take(2).all() == [1, 2]
assert items.take(-2).all() == [4, 5]
assert items.take(0).all() == []
assert items.take(99).all() == items.all()
assert items.chunk(2).map(lambda chunk: chunk.all()).all() == [[1, 2], [3, 4], [5]]
assert Collection().chunk(2).all() == []
assert items.forPage(2, 2).all() == [3, 4]
assert items.forPage(0, 2).all() == [1, 2]
assert items.forPage(9, 2).all() == []
```

<a id="collection-method-collapse"></a>

### `collapse() -> Collection`

**Nueva.** Extiende una lista con cada elemento anidado, extrayendo primero los datos de las colecciones anidadas. Aplana un nivel iterable: los diccionarios aportan claves, las cadenas aportan caracteres y los escalares no iterables producen `TypeError`.

<a id="collection-method-flatten"></a>

### `flatten() -> Collection`

**Nueva.** Recorre recursivamente listas y **valores** de diccionarios. Las tuplas, cadenas, instancias anidadas de `Collection` y otros objetos permanecen como valores hoja. No tiene argumento de profundidad; las listas/diccionarios cíclicos terminan produciendo `RecursionError`.

```python
from orionis.support.types import Collection

assert Collection([[1, 2], Collection([3]), [4, [5]]]).collapse().all() == [1, 2, 3, 4, [5]]
assert Collection([{"a": 1}, "bc"]).collapse().all() == ["a", "b", "c"]
nested = Collection([7])
flat = Collection([1, [2, {"a": [3]}], (4, 5), "hi", nested]).flatten()
assert flat.all() == [1, 2, 3, (4, 5), "hi", nested]
assert flat[-1] is nested
```

<a id="collection-method-diff"></a>

### `diff(items: list[Any] | Collection) -> Collection`

**Nueva.** Conserva los elementos de origen ausentes de los datos recibidos, respetando orden y duplicados del origen. Intenta usar un set para pertenencia y recurre a pertenencia por igualdad si hay valores no hashables. Extrae los datos de una `Collection` sin exigir que la entrada sea una lista; argumentos incompatibles o no iterables pueden producir `TypeError`.

<a id="collection-method-zip"></a>

### `zip(items: list[Any] | Collection) -> Collection`

**Nueva.** Devuelve **listas** de dos elementos hasta la longitud de la entrada más corta. Otros tipos de entrada producen `TypeError`; admite una sola secuencia adicional, no una cantidad arbitraria de argumentos.

```python
from orionis.support.types import Collection

assert Collection([1, 2, 1, 3]).diff([2]).all() == [1, 1, 3]
assert Collection([1, 2]).diff(Collection([1])).all() == [2]
assert Collection([[1], [2]]).diff([[1]]).all() == [[2]]
assert Collection([1, 2, 3]).zip(["a", "b"]).all() == [[1, "a"], [2, "b"]]
assert Collection([1]).zip(Collection(["a"])).all() == [[1, "a"]]
```

<a id="collection-method-groupby"></a>

### `groupBy(key: str) -> Collection`

**Nueva instancia base de `Collection`.** Extrae y ordena las claves de agrupación y construye `{group_key: [original_items]}`. Los valores de clave deben ser ordenables entre sí y hashables; una ordenación incompatible o claves de diccionario no hashables producen `TypeError`. El orden dentro de cada grupo es estable. Admite un nombre/ruta de campo, no un callback. Los campos ausentes se convierten en `None`, lo que puede hacer fallar la ordenación junto con otros tipos de clave.

<a id="collection-method-unique"></a>

### `unique(key: str | None = None) -> Collection`

Sin clave truthy, devuelve una colección **nueva** mediante `list(set(items))`, sin garantizar el orden. Si algún elemento no es hashable, conserva la primera aparición mediante igualdad. Con clave y respaldo de lista, conserva el primer elemento por cada valor extraído hashable; los campos ausentes cuentan como `None`. **Limitación actual:** los valores extraídos no hashables no se registran en el set de valores vistos, por lo que pueden permanecer duplicados los campos de lista/diccionario repetidos. Con clave truthy y respaldo de diccionario, devuelve `self` sin cambios; sin clave, elimina duplicados entre las claves del diccionario.

```python
from orionis.support.types import Collection

rows = Collection([{"team": "b", "id": 1}, {"team": "a", "id": 2}, {"team": "b", "id": 3}])
assert rows.groupBy("team").all() == {
    "a": [{"team": "a", "id": 2}],
    "b": [{"team": "b", "id": 1}, {"team": "b", "id": 3}],
}
assert Collection().groupBy("team").all() == []
assert sorted(Collection([2, 1, 2]).unique().all()) == [1, 2]
assert Collection([[1], [1], [2]]).unique().all() == [[1], [2]]
assert rows.unique("team").pluck("id").all() == [1, 2]
assert Collection([{"v": [1]}, {"v": [1]}]).unique("v").count() == 2
indexed = Collection({"a": 1, "b": 1})
assert indexed.unique("anything") is indexed
assert sorted(indexed.unique().all()) == ["a", "b"]
```

## Modificación de elementos y orden

<a id="collection-method-push"></a>

### `push(value: object) -> Collection`

**Misma instancia.** Agrega un valor al final de una lista; una lista como argumento se agrega como un solo elemento anidado.

<a id="collection-method-prepend"></a>

### `prepend(value: object) -> Collection`

**Misma instancia.** Inserta un valor en el índice cero. No tiene parámetro de clave.

<a id="collection-method-put"></a>

### `put(key: int | str, value: object) -> Collection`

**Misma instancia.** Delega en la asignación con corchetes. En una lista sustituye un índice existente, incluidos los negativos; no puede agregar más allá del final. El respaldo de diccionario admite claves de diccionario. Los tipos de índice/clave inválidos propagan los errores subyacentes.

<a id="collection-method-merge"></a>

### `merge(items: list[Any] | Collection) -> Collection`

**Misma instancia.** Extiende la lista actual mediante `+=`. Otros tipos de entrada producen `TypeError`. No combina diccionarios anidados ni sobrescribe claves de diccionario. Una `Collection` respaldada por diccionario supera la validación de tipo, pero al combinarla con una lista aporta sus claves.

```python
from orionis.support.types import Collection

items = Collection([2])
assert items.push([3, 4]) is items
assert items.prepend(1) is items
assert items.put(1, 9) is items
assert items.merge([5]) is items
assert items.merge(Collection([6])) is items
assert items.all() == [1, 9, [3, 4], 5, 6]
indexed = Collection({"a": 1})
assert indexed.put("b", 2).all() == {"a": 1, "b": 2}
```

<a id="collection-method-forget"></a>

### `forget(*keys: int | str) -> Collection`

**Misma instancia.** Ordena las claves de forma descendente y elimina cada clave/índice. Sin claves no cambia nada. Usa índices de lista no negativos y distintos para evitar sorpresas por desplazamiento; los índices negativos/duplicados siguen la eliminación secuencial de Python. Mezclar claves no ordenables produce `TypeError`; los índices/claves ausentes producen `IndexError`/`KeyError` y pueden haberse efectuado eliminaciones anteriores.

<a id="collection-method-pop"></a>

### `pop() -> object`

Extrae y devuelve el último elemento de lista; una colección vacía devuelve `None`. No acepta un índice como argumento.

<a id="collection-method-pull"></a>

### `pull(key: int | str) -> object`

Lee con `get`, elimina con `forget` y devuelve el valor extraído. Un índice de lista o clave de diccionario ausente **produce una excepción** al eliminar, aunque antes `get` haya devuelto `None`. No tiene argumento de valor predeterminado.

<a id="collection-method-shift"></a>

### `shift() -> object`

Extrae y devuelve el primer elemento de lista mediante `pull(0)`. **Una lista vacía produce `IndexError`**; comprueba `isEmpty()` cuando sea necesario.

```python
from orionis.support.types import Collection

items = Collection([10, 20, 30, 40])
assert items.forget(0, 2) is items
assert items.all() == [20, 40]
assert items.forget() is items
assert items.pop() == 40
assert items.pull(0) == 20
assert items.pop() is None
assert Collection([7, 8]).shift() == 7
indexed = Collection({"a": 1, "b": 2})
assert indexed.pull("a") == 1
assert indexed.forget("b").all() == {}
for operation in (lambda: Collection().shift(), lambda: Collection([1]).pull(9)):
    try:
        operation()
    except IndexError:
        pass
    else:
        raise AssertionError("Expected IndexError")
```

<a id="collection-method-reverse"></a>

### `reverse() -> Collection`

**Misma instancia.** Invierte la lista de respaldo.

<a id="collection-method-sort"></a>

### `sort(key: str | None = None) -> Collection`

**Misma instancia.** Ordena ascendentemente la lista de respaldo, directamente o por el campo extraído si la clave es truthy. No admite indicador de orden inverso ni callback. Usa `.sort().reverse()` para obtener orden descendente. Los valores deben ser ordenables entre sí; las excepciones de ordenación de Python se propagan.

```python
from orionis.support.types import Collection

items = Collection([3, 1, 2])
assert items.sort() is items
assert items.all() == [1, 2, 3]
assert items.reverse() is items
assert items.all() == [3, 2, 1]
rows = Collection([{"v": 3}, {"v": 1}])
assert rows.sort("v").all() == [{"v": 1}, {"v": 3}]
```

<a id="collection-method-random"></a>

### `random(count: int | None = None) -> object | Collection | None`

Una colección vacía devuelve `None` antes de validar `count`. Sin conteo, con `None` **o con cero**, devuelve un elemento aleatorio sin modificar la colección. Con un conteo positivo, muestrea posiciones sin reemplazo, sustituye la lista de respaldo y devuelve **la misma instancia**. Pueden aparecer valores duplicados si el origen ya los contiene. Un conteo negativo o superior a la longitud de una colección no vacía produce `ValueError`; los conteos positivos no enteros fallan en `random.sample` con `TypeError`. El orden resultante es aleatorio.

```python
from orionis.support.types import Collection

items = Collection([1, 2, 3])
assert items.random() in [1, 2, 3]
assert items.random(None) in [1, 2, 3]
assert items.random(0) in [1, 2, 3]
assert items.count() == 3
assert items.random(2) is items
assert items.count() == 2
assert len(set(items.all())) == 2
assert Collection().random(-1) is None
for count in (-1, 4):
    try:
        Collection([1, 2, 3]).random(count)
    except ValueError:
        pass
    else:
        raise AssertionError("Expected ValueError")
```

## Agregación y salida de texto

`sum`, `avg`, `min` y `max` aceptan `key=None`, un nombre directo de atributo/clave de diccionario o, en ejecución, un `callback(item)`. A diferencia de la proyección, las claves de texto **no** recorren rutas con puntos. Los atributos de objeto tienen precedencia sobre las entradas de diccionario; los campos ausentes se omiten. Los resultados de callback solo se incluyen si son truthy, por lo que los ceros generados por callback se omiten; esto cambia el denominador de un promedio. Si no se extrae ningún valor, estos métodos vuelven a usar los elementos originales. Sus anotaciones no fuerzan conversión numérica; los resultados reales dependen de las operaciones de Python.

<a id="collection-method-sum"></a>

### `sum(key: str | None = None) -> float`

Devuelve la suma de Python, frecuentemente un `int`; una entrada vacía o un `TypeError` al sumar devuelve `0`.

<a id="collection-method-avg"></a>

### `avg(key: str | None = None) -> float`

Devuelve `sum(values) / len(values)`. Una entrada vacía o un `TypeError` al calcular devuelve el entero `0`.

<a id="collection-method-min"></a>

### `min(key: str | None = None) -> object`

Devuelve el menor valor extraído/original; una entrada vacía, un `TypeError` o un `ValueError` durante la selección devuelve `0`.

<a id="collection-method-max"></a>

### `max(key: str | None = None) -> object`

Devuelve el mayor valor con el mismo comportamiento de respaldo que `min`. Las cadenas se pueden seleccionar lexicográficamente; estos métodos no exigen elementos numéricos. Los errores al acceder al campo/evaluar el callback ocurren antes del manejo de excepciones de la agregación y se propagan.

```python
from types import SimpleNamespace
from orionis.support.types import Collection

numbers = Collection([2, 4, 6])
assert (numbers.sum(), numbers.avg(), numbers.min(), numbers.max()) == (12, 4.0, 2, 6)
rows = Collection([{"v": 2}, {"v": 4}, {}])
assert (rows.sum("v"), rows.avg("v"), rows.min("v"), rows.max("v")) == (6, 3.0, 2, 4)
objects = Collection([SimpleNamespace(v=2), SimpleNamespace(v=4)])
assert objects.sum("v") == 6
assert (numbers.sum(lambda item: item * 2), numbers.avg(lambda item: item * 2),
        numbers.min(lambda item: item * 2), numbers.max(lambda item: item * 2)) == (24, 8.0, 4, 12)
assert Collection([0, 2]).avg(lambda item: item) == 2.0
for items in (Collection(), Collection(["invalid", 1])):
    assert (items.sum(), items.avg(), items.min(), items.max()) == (0, 0, 0, 0)
```

<a id="collection-method-reduce"></a>

### `reduce(callback: Callable, initial: object = 0) -> object`

Invoca `callback(accumulator, item)` mediante `functools.reduce`, comenzando con `initial`. Una entrada vacía devuelve `initial`. No usa el validador de callbacks de Collection; los callbacks inválidos producen errores nativos al invocarse; en una entrada vacía, un valor no callable puede devolver el inicial. Los errores del callback se propagan.

<a id="collection-method-implode"></a>

### `implode(glue: str = ',', key: str | None = None) -> str`

Convierte los elementos mediante `str` y los une usando `glue`. Si el primer elemento no es una cadena y `key` es truthy, primero llama a `pluck(key)`; en otro caso ignora `key`. Una entrada vacía devuelve `""`. Una colección no vacía necesita un separador de texto; los separadores inválidos o los errores al convertir elementos a texto producen sus excepciones nativas.

```python
from orionis.support.types import Collection

assert Collection([1, 2, 3]).reduce(lambda total, item: total + item) == 6
assert Collection(["a", "b"]).reduce(lambda total, item: total + item, "#") == "#ab"
assert Collection().reduce(lambda total, item: total + item, 7) == 7
assert Collection([1, 2]).implode() == "1,2"
assert Collection(["a", "b"]).implode("-", "ignored") == "a-b"
assert Collection([{"name": "Ada"}, {"name": "Grace"}]).implode(" / ", "name") == "Ada / Grace"
assert Collection().implode() == ""
```

## Serialización e integración con elementos

<a id="collection-method-serialize"></a>

### `serialize() -> list[Any]`

Crea una lista al serializar cada elemento: llama a `item.serialize()` si existe; en su defecto, a `item.to_dict()` si existe; en otro caso conserva el objeto original. No es un serializador recursivo general para listas/diccionarios anidados ni garantiza una salida compatible con JSON. Las colecciones respaldadas por diccionarios serializan sus **claves**, porque iteran claves. Los atributos de serialización se invocan sin comprobar si son callable; los atributos inválidos y errores del serializador se propagan.

<a id="collection-method-tojson"></a>

### `toJson(**kwargs: object) -> str`

Devuelve `json.dumps(self.serialize(), **kwargs)`, reenviando opciones como `ensure_ascii`, `indent`, `sort_keys` y `default`. Los errores nativos de JSON se propagan, incluidos `TypeError` para valores no admitidos y `ValueError` para datos circulares.

```python
import json
from orionis.support.types import Collection

class Record:
    def serialize(self):
        return {"name": "José"}

class Legacy:
    def to_dict(self):
        return {"id": 2}

items = Collection([Record(), Legacy(), 3])
assert items.serialize() == [{"name": "José"}, {"id": 2}, 3]
assert json.loads(items.toJson(ensure_ascii=False, indent=2)) == items.serialize()
assert Collection([1, 2]).toJson() == "[1, 2]"
assert json.loads(Collection([object()]).toJson(default=lambda item: "custom")) == ["custom"]
assert Collection({"a": 1}).serialize() == ["a"]
```

<a id="collection-method-setappends"></a>

### `setAppends(appends: list[str]) -> Collection`

**Misma instancia.** Extiende `__appends__`; las llamadas repetidas acumulan entradas, sin sustituirlas ni eliminar duplicados. Al serializar, invoca `set_appends(appends)` de cada elemento si existe y suprime únicamente `AttributeError` de esa llamada. Cuando `serialize()` devuelve un diccionario y el elemento tiene un `getAttribute` callable, agrega cada atributo nombrado salvo los incluidos en `type(item).__meta__.hidden`. Los atributos agregados pueden sustituir claves que el serializador ya devolvió. Los diccionarios ordinarios no tienen estos hooks y no reciben campos nuevos. Los appends mal formados u otros errores de hooks se propagan.

<a id="collection-method-addrelation"></a>

### `addRelation(relation_data: dict[str, Any]) -> Collection`

**Misma instancia.** Por cada elemento que exponga `setRelation`, invoca `item.setRelation(name, value)` para cada entrada del diccionario. Omite los elementos sin ese atributo. No crea claves en diccionarios, carga relaciones ni consulta una base de datos. Un hook no callable, una estructura de entrada inválida o un error del hook se propaga.

```python
from types import SimpleNamespace
from orionis.support.types import Collection

class Record:
    __meta__ = SimpleNamespace(hidden=["secret"])

    def __init__(self):
        self.relations = {}
        self.appends = []

    def set_appends(self, appends):
        self.appends = list(appends)

    def serialize(self):
        return {"id": 1}

    def getAttribute(self, name):
        return {"label": "Ada", "secret": "hidden"}[name]

    def setRelation(self, name, value):
        self.relations[name] = value

record = Record()
items = Collection([record, {"id": 2}])
assert items.setAppends(["label"]) is items
items.setAppends(["secret"])
assert items.serialize() == [{"id": 1, "label": "Ada"}, {"id": 2}]
assert record.appends == ["label", "secret"]
assert items.addRelation({"team": "research", "manager": None}) is items
assert record.relations == {"team": "research", "manager": None}
```

## Protocolos de Python

<a id="collection-method-iter"></a>

### `__iter__() -> Iterator[Any]`

`iter(collection)`, los bucles, `list(collection)` y la pertenencia (`item in collection`) recorren los datos de respaldo. No hay un `__contains__` propio; la pertenencia usa la iteración. Un respaldo de diccionario entrega claves.

<a id="collection-method-len"></a>

### `__len__() -> int`

`len(collection)` lee la longitud del respaldo. `bool(collection)` usa este protocolo porque no existe un `__bool__` propio.

<a id="collection-method-getitem"></a>

### `__getitem__(item: int | slice) -> object | Collection`

`collection[index]` devuelve un elemento; los índices de lista pueden ser negativos. `collection[start:stop:step]` devuelve una colección nueva con semántica de slice de Python. Un paso cero produce `ValueError`; los índices inválidos y claves ausentes propagan las excepciones de la estructura de respaldo. Un respaldo de diccionario también admite sus claves reales, aunque no aparezcan en la anotación.

<a id="collection-method-setitem"></a>

### `__setitem__(key: int | str, value: object) -> None`

`collection[key] = value` escribe en los datos de respaldo. La asignación a slices de lista también funciona en ejecución y requiere un iterable; los slices extendidos requieren longitudes coincidentes. No expande un índice entero fuera de rango.

<a id="collection-method-delitem"></a>

### `__delitem__(key: int | str) -> None`

`del collection[key]` elimina datos del respaldo, incluidos slices de lista en ejecución. Los índices o claves inválidos/ausentes propagan excepciones nativas.

```python
from orionis.support.types import Collection

items = Collection([10, 20, 30, 40])
assert list(iter(items)) == [10, 20, 30, 40]
assert len(items) == 4 and bool(items)
assert not bool(Collection())
assert 20 in items and 99 not in items
assert items[-1] == 40
assert items[1:3].all() == [20, 30]
assert items[::-1].all() == [40, 30, 20, 10]
items[0] = 1
items[1:3] = [2, 3]
del items[-1]
del items[1:2]
assert items.all() == [1, 3]
indexed = Collection({"a": 1})
assert list(indexed) == ["a"]
assert indexed["a"] == 1
indexed["b"] = 2
del indexed["a"]
assert indexed.all() == {"b": 2}
```

<a id="collection-method-eq"></a>
<a id="collection-method-ne"></a>

### `__eq__(other: object) -> bool` y `__ne__(other: object) -> bool`

`==` y `!=` comparan los datos de respaldo con los de otra colección o directamente con el otro objeto. No exigen la misma subclase de colección; las listas pueden compararse como iguales a las colecciones. El respaldo de diccionario sigue la igualdad de diccionarios.

<a id="collection-method-lt"></a>
<a id="collection-method-le"></a>
<a id="collection-method-gt"></a>
<a id="collection-method-ge"></a>

### `__lt__(other: object) -> bool`, `__le__(other: object) -> bool`, `__gt__(other: object) -> bool`, `__ge__(other: object) -> bool` — ordenación

`<`, `<=`, `>` y `>=` extraen el respaldo de un operando Collection y usan la comparación lexicográfica de listas de Python. Con datos ordinarios devuelven `bool`. Los tipos de operando no admitidos, la ordenación de diccionarios o los tipos de elemento incompatibles producen `TypeError`.

<a id="collection-method-hash"></a>

### `__hash__() -> int`

`hash(collection)` devuelve `hash(tuple(backing_data))`. Los elementos no hashables de una lista producen `TypeError`; con respaldo de diccionario se calculan las claves. Como las colecciones son mutables y se comparan por sus datos, cambiarlos puede alterar el hash: no modifiques una colección mientras se use como clave de diccionario o miembro de set.

```python
from orionis.support.types import Collection

left = Collection([1, 2])
right = Collection([1, 3])
assert left == Collection([1, 2])
assert left == [1, 2]
assert left != right
assert left < right and left <= [1, 2]
assert right > left and right >= [1, 3]
assert hash(left) == hash((1, 2))
try:
    hash(Collection([[1]]))
except TypeError:
    pass
else:
    raise AssertionError("Expected TypeError")
```

## Alcance de la referencia

Esta página cubre los 48 métodos públicos y 13 métodos especiales de Python declarados, incluido el constructor, en `orionis/support/types/collection.py`. Los nueve helpers de implementación `_getUniqueItemsWithoutKey`, `_getUniqueItemsByKey`, `_addUniqueItem`, `__getValue`, `__dataGet`, `__value`, `__checkIsCallable`, `__makeComparison` y `__getItems` son internos y quedan fuera de la API pública; sus efectos observables se documentan arriba.

[Volver al índice del módulo](/es/utilities).
