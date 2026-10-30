---
title: "Colecciones y paginación"
description: "Colecciones y paginación en Orionis Framework."
editUrl: true
lastUpdated: false
---

<a id="collection-alias"></a>

<a id="paginator-python-protocol"></a>

`get()` devuelve `Collection`, compartida por todo el framework. `from orionis.orm import Collection, ModelCollection` expone dos nombres del **mismo tipo**. Sus operaciones trabajan sobre memoria: `collection.where(...)` no añade WHERE SQL, y `collection.count()` no ejecuta COUNT. Filtra y pagina en el builder antes de cargar una tabla grande.

## Ejemplo desde un controlador

```python
from orionis.http import JSONResponse
from app.models.article import Article


class ArticleListController:
    async def __call__(self) -> JSONResponse:
        page = await Article.where("published", True).orderBy("id").paginate(per_page=20)
        return JSONResponse(page.toDict())
```

<a id="query-chunks"></a>

## Leer resultados de base de datos por lotes

Desde **1.1.0**, los constructores de consultas exponen `chunks(size: int = 1000) -> AsyncIterator[Collection]`. Consúmelo con `async for`; no apliques `await` al iterador. Funciona en consultas de modelos y en `DB.table(...)`:

```python
from orionis.support.facades import DB


async def count_export_rows() -> int:
    total = 0
    query = DB.table("articles").orderBy("id")
    async for batch in query.chunks(500):
        total += len(batch)
    return total
```

Ejecuta el ejemplo en una aplicación arrancada con una tabla `articles`. Para lotes de modelos, utiliza `Article.query().orderBy("id").chunks(500)` con el modelo de la guía de consultas. Cada lote pasa por `get()`, incluidos casts, scopes globales, eventos `retrieved` y carga anticipada de relaciones.

- `size` debe ser un entero positivo, excluidos booleanos; un tamaño inválido produce `ValueError`.
- Define un orden explícito y determinista, preferiblemente terminado en una clave única. Sin orden, la iteración produce `InvalidQueryException`.
- Se respetan `limit()` y `offset()` existentes; el iterador clona la consulta y conserva su plan original.
- Utiliza paginación LIMIT/OFFSET, no un cursor del servidor. Las inserciones o eliminaciones simultáneas pueden desplazar filas; usa una transacción con el aislamiento adecuado cuando necesites una vista consistente.
- La consulta libera su cursor antes de entregar el lote. Una transacción del consumidor mantiene su conexión. Cierra el iterador con `contextlib.aclosing()` si terminas antes de agotarlo.

Guardar todos los lotes en una lista elimina la ventaja de memoria. Las relaciones pueden consumir memoria adicional al número de filas. `get()` sigue materializando su resultado, mientras que [`Collection.chunk()`](#collection-chunk) solo divide datos ya cargados en memoria.

## Paginación de consultas


<a id="modelquerybuilder-paginate"></a>

### `paginate`

```text
async def paginate(self, page: int=1, per_page: int=_DEFAULT_PER_PAGE) -> Paginator
```

Terminal async con `page=1`, `per_page=15` (`_DEFAULT_PER_PAGE` en fuente): exige enteros positivos sin bool, o `InvalidQueryException`. Aplica OFFSET/LIMIT al builder, ejecuta COUNT y recuperación y devuelve `Paginator`. Dentro de transacción ejecuta ambas consultas secuencialmente en la conexión transaccional; fuera las ejecuta con gather usando conexiones del pool. No garantiza snapshot consistente entre ambas fuera de una transacción.

```python
async def article_page(page_number: int = 1):
    page = await Article.orderBy("id").paginate(page=page_number, per_page=20)
    return page.toDict()
```

Ordena por una clave determinista, especialmente al cambiar de página. Paginación usa offset, no cursor/keyset. Una página posterior al final devuelve items vacíos y conserva el número solicitado. El COUNT y las filas pueden observar cambios concurrentes; para una vista consistente usa una transacción con el aislamiento adecuado de tu motor.

## API de Paginator

Los ejemplos de propiedades suponen `page = Paginator(Collection([{"id": 1}]), total=11, page=1, per_page=10)`. `len(page)` devuelve cantidad de items actuales, no `total`; repr muestra page/perPage/total. No es un builder ni un objeto Response.


<a id="paginator---init--"></a>

### `__init__`

```text
def __init__(self, items: Collection, total: int, page: int, per_page: int) -> None
```

Envuelve `Collection` sin consultar SQL. `page` y `per_page` deben ser int positivos, excluyendo bool (`ValueError`). `total` se convierte a int y se limita a cero mínimo. No ajusta una página superior a lastPage.

```python
from orionis.orm import Collection, Paginator

page = Paginator(Collection([{"id": 1}]), total=11, page=1, per_page=10)
```

<a id="paginator-items"></a>

### `items`

```text
def items(self) -> Collection
```

Propiedad de solo lectura: la misma Collection de la página; sus métodos mutadores sí pueden modificarla.

```python
items = page.items
```

<a id="paginator-total"></a>

### `total`

```text
def total(self) -> int
```

Propiedad int: filas totales del recuento, no longitud de la página.

```python
assert page.total == 11
```

<a id="paginator-page"></a>

### `page`

```text
def page(self) -> int
```

Propiedad int: página actual, empezando por 1.

```python
assert page.page == 1
```

<a id="paginator-perpage"></a>

### `perPage`

```text
def perPage(self) -> int
```

Propiedad int: tamaño configurado, aunque la última página contenga menos filas.

```python
assert page.perPage == 10
```

<a id="paginator-lastpage"></a>

### `lastPage`

```text
def lastPage(self) -> int
```

Propiedad int: ceil(total/perPage), al menos 1 incluso con total=0.

```python
assert page.lastPage == 2
```

<a id="paginator-hasnext"></a>

### `hasNext`

```text
def hasNext(self) -> bool
```

Propiedad bool: page*perPage < total. No crea enlaces ni consulta otra página.

```python
assert page.hasNext is True
```

<a id="paginator-hasprevious"></a>

### `hasPrevious`

```text
def hasPrevious(self) -> bool
```

Propiedad bool: page > 1, incluso si esa página actual está fuera de rango.

```python
assert page.hasPrevious is False
```

<a id="paginator-todict"></a>

### `toDict`

```text
def toDict(self) -> dict[str, Any]
```

Devuelve dict con items serializados y claves total, page, perPage, lastPage, hasNext, hasPrevious. No incluye URL ni cursor.

```python
assert page.toDict()["items"] == [{"id": 1}]
```

<a id="paginator-tojson"></a>

### `toJson`

```text
def toJson(self, **kwargs: Any) -> str
```

Serializa toDict con json.dumps y default=str salvo override en kwargs. Retorna texto JSON.

```python
text = page.toJson(indent=2, ensure_ascii=False)
```

## API completa de Collection utilizada por ORM

Todos los ejemplos son operaciones en memoria. `Article` y `Team` se definen en las guías de modelos/relaciones. Los callbacks son síncronos: map/filter/each no esperan corutinas.

Operaciones mutadoras como `merge`, `push`, `forget`, `put`, `sort`, `reverse`, `reject`, `transform`, `each` y `random(count>0)` cambian la misma colección; si contiene modelos, estos también siguen siendo las mismas instancias. No guardan cambios SQL automáticamente. Las nuevas colecciones son copias superficiales de sus elementos.


<a id="collection---init--"></a>

### `__init__`

```text
def __init__(self, items: list[Any] | None=None) -> None
```

Construye colección en memoria; `items=None` crea vacía. Con una lista no vacía conserva la referencia: pasa `.copy()` si necesitas aislarla. `ModelCollection` es el mismo tipo, no una subclase con persistencia.

```python
values = Collection([1, 2, 3])
```

<a id="collection-take"></a>

### `take`

```text
def take(self, number: int) -> Collection
```

Colección nueva con los primeros `number` elementos; si es negativo toma desde el final y si es cero devuelve vacía. No consulta ni limita SQL.

```python
assert Collection([1, 2, 3]).take(-2).all() == [2, 3]
```

<a id="collection-first"></a>

### `first`

```text
def first(self, callback: Callable | None=None) -> object
```

Primer elemento o `None`; con callback devuelve la primera coincidencia. Callback no callable produce `ValueError`; excepciones internas se propagan.

```python
assert Collection([1, 2, 3]).first(lambda n: n > 1) == 2
```

<a id="collection-last"></a>

### `last`

```text
def last(self, callback: Callable | None=None) -> object
```

Último elemento/coincidencia o `None`. Con callback recorre los elementos en orden para recordar el último que cumple.

```python
assert Collection([1, 2, 3]).last(lambda n: n < 3) == 2
```

<a id="collection-all"></a>

### `all`

```text
def all(self) -> list[Any]
```

Devuelve la lista subyacente, no una copia ni serialización. Si proviene de `pluck(..., key)`/`groupBy`, devuelve el mapping almacenado aunque la anotación indique list.

```python
raw = Collection([1, 2]).all()
assert raw == [1, 2]
```

<a id="collection-avg"></a>

### `avg`

```text
def avg(self, key: str | None=None) -> float
```

Promedio numérico en memoria, con clave opcional de dict/atributo; vacío o TypeError devuelve `0`. No es un agregado SQL y no carga columnas ausentes.

```python
assert Collection([{"score": 2}, {"score": 4}]).avg("score") == 3
```

<a id="collection-max"></a>

### `max`

```text
def max(self, key: str | None=None) -> object
```

Máximo en memoria, opcionalmente por clave; vacío o comparación incompatible devuelve `0`.

```python
assert Collection([2, 4]).max() == 4
```

<a id="collection-min"></a>

### `min`

```text
def min(self, key: str | None=None) -> object
```

Mínimo en memoria, opcionalmente por clave; vacío o comparación incompatible devuelve `0`.

```python
assert Collection([2, 4]).min() == 2
```

<a id="collection-chunk"></a>

### `chunk`

```text
def chunk(self, size: int) -> Collection
```

Nueva colección de subcolecciones de tamaño `size`; tamaño no positivo produce `ValueError`. Divide resultados ya cargados, no consulta por lotes SQL.

```python
chunks = Collection([1, 2, 3]).chunk(2)
assert chunks[0].all() == [1, 2]
```

<a id="collection-collapse"></a>

### `collapse`

```text
def collapse(self) -> Collection
```

Aplana un nivel de listas o colecciones; devuelve colección nueva. Entradas escalares no iterables pueden producir `TypeError`; para anidación profunda de listas/dicts usa `flatten`.

```python
assert Collection([[1, 2], [3]]).collapse().all() == [1, 2, 3]
```

<a id="collection-contains"></a>

### `contains`

```text
def contains(self, key: str | Callable, value: object=None) -> bool
```

Bool de pertenencia con valor directo, callback o clave/valor. `value=None` se interpreta como ausencia del segundo argumento; usa callback para buscar un atributo nulo.

```python
assert Collection([{"id": 2}]).contains("id", 2)
```

<a id="collection-count"></a>

### `count`

```text
def count(self) -> int
```

Número de elementos ya cargados. No ejecuta COUNT SQL.

```python
assert Collection([1, 2]).count() == 2
```

<a id="collection-diff"></a>

### `diff`

```text
def diff(self, items: list[Any] | Collection) -> Collection
```

Nueva colección de elementos que no están en lista/colección comparada. Usa igualdad; soporta elementos no hashables mediante comparación secuencial.

```python
assert Collection([1, 2]).diff([2]).all() == [1]
```

<a id="collection-each"></a>

### `each`

```text
def each(self, callback: Callable) -> Collection
```

**Modifica** cada posición con el retorno truthy del callback y se detiene en el primer retorno falsy, sin sustituir esa posición. Retorna self. No es un iterador de efectos secundarios con callbacks que devuelven None.

```python
values = Collection([1, 2, 3])
assert values.each(lambda n: n * 2).all() == [2, 4, 6]
```

<a id="collection-every"></a>

### `every`

```text
def every(self, callback: Callable) -> bool
```

Bool indicando si todos cumplen callback; en vacía devuelve `True`. Callback inválido: `ValueError`.

```python
assert Collection([2, 4]).every(lambda n: n % 2 == 0)
```

<a id="collection-filter"></a>

### `filter`

```text
def filter(self, callback: Callable) -> Collection
```

Colección nueva con elementos cuyo callback sea truthy. Callback obligatorio; inválido produce `ValueError`.

```python
assert Collection([1, 2, 3]).filter(lambda n: n > 1).all() == [2, 3]
```

<a id="collection-flatten"></a>

### `flatten`

```text
def flatten(self) -> Collection
```

Colección nueva: aplana recursivamente listas y valores de diccionarios. Tuplas/Collection internas se conservan como elementos, no se expanden por esta función.

```python
assert Collection([1, [2, {"x": 3}]]).flatten().all() == [1, 2, 3]
```

<a id="collection-forget"></a>

### `forget`

```text
def forget(self, *keys: int | str) -> Collection
```

Borra índices/claves en orden descendente y retorna self. Índices/claves inexistentes propagan `IndexError`/`KeyError`; una lista usa índices enteros.

```python
assert Collection([1, 2, 3]).forget(0, 2).all() == [2]
```

<a id="collection-forpage"></a>

### `forPage`

```text
def forPage(self, page: int, number: int) -> Collection
```

Nueva colección por slice: normaliza `page` a al menos 1 y exige `number>0` (`ValueError`). No produce metadatos ni consulta filas adicionales.

```python
assert Collection([1, 2, 3]).forPage(2, 2).all() == [3]
```

<a id="collection-get"></a>

### `get`

```text
def get(self, key: int | str, default: object=None) -> object
```

Lee índice/clave o default; si default es callable lo evalúa sin argumentos solo al faltar. Captura `IndexError`/`KeyError`, no un tipo de índice inválido.

```python
assert Collection([1]).get(7, lambda: "missing") == "missing"
```

<a id="collection-implode"></a>

### `implode`

```text
def implode(self, glue: str=',', key: str | None=None) -> str
```

Une representaciones str con `glue=","`; `key=None` usa elementos completos. Con objetos/dicts y clave extrae esa columna. Vacía devuelve `""`.

```python
assert Collection([{"name": "A"}, {"name": "B"}]).implode(" / ", "name") == "A / B"
```

<a id="collection-isempty"></a>

### `isEmpty`

```text
def isEmpty(self) -> bool
```

Bool basado en longitud; no consulta existencia SQL.

```python
assert Collection().isEmpty()
```

<a id="collection-map"></a>

### `map`

```text
def map(self, callback: Callable) -> Collection
```

Colección nueva con cada retorno del callback, incluyendo None y valores falsos; no modifica la lista original.

```python
assert Collection([1, 2]).map(lambda n: n * 3).all() == [3, 6]
```

<a id="collection-mapinto"></a>

### `mapInto`

```text
def mapInto(self, cls: type, method: str | None=None, **kwargs: object) -> Collection
```

Mapea con `cls(item)` o `cls.method(item, **kwargs)`; kwargs solo se pasan cuando hay método. `cls` debe ser tipo (`TypeError`); método ausente o TypeError/AttributeError/ValueError por elemento se convierten en None. No persiste modelos.

```python
assert Collection(["1", "bad"]).mapInto(int).all() == [1, None]
```

<a id="collection-merge"></a>

### `merge`

```text
def merge(self, items: list[Any] | Collection) -> Collection
```

Añade lista/Collection al mismo objeto y devuelve self; no hace unión por PK ni deduplica. Tipo no admitido: `TypeError`.

```python
assert Collection([1]).merge([1, 2]).all() == [1, 1, 2]
```

<a id="collection-pluck"></a>

### `pluck`

```text
def pluck(self, value: str, key: str | None=None) -> Collection
```

Extrae por ruta de dict/atributo; sin `key` devuelve lista omitiendo None. Con `key` devuelve Collection respaldada por dict, sobreescribe claves repetidas y conserva valores nulos. Para leer ese mapping usa `.all()`/`.get()`.

```python
assert Collection([{"id": 1, "name": "A"}]).pluck("name", "id").all() == {1: "A"}
```

<a id="collection-pop"></a>

### `pop`

```text
def pop(self) -> object
```

Extrae y elimina el último elemento; vacía devuelve None.

```python
values = Collection([1, 2])
assert values.pop() == 2
```

<a id="collection-prepend"></a>

### `prepend`

```text
def prepend(self, value: object) -> Collection
```

Inserta al principio del mismo objeto y retorna self.

```python
assert Collection([2]).prepend(1).all() == [1, 2]
```

<a id="collection-pull"></a>

### `pull`

```text
def pull(self, key: int | str) -> object
```

Obtiene y elimina un índice/clave. Aunque primero usa `get`, el borrado posterior de una clave ausente lanza IndexError/KeyError; comprueba existencia antes.

```python
values = Collection([1, 2])
assert values.pull(0) == 1
```

<a id="collection-push"></a>

### `push`

```text
def push(self, value: object) -> Collection
```

Añade al final del mismo objeto y retorna self. No guarda entidades.

```python
assert Collection([1]).push(2).all() == [1, 2]
```

<a id="collection-put"></a>

### `put`

```text
def put(self, key: int | str, value: object) -> Collection
```

Sustituye índice/clave del mismo objeto y retorna self. En lista no amplía un índice fuera de rango: produce IndexError.

```python
assert Collection([1]).put(0, 2).all() == [2]
```

<a id="collection-random"></a>

### `random`

```text
def random(self, count: int | None=None) -> object | Collection | None
```

Vacía devuelve None. Sin count o con `0`, devuelve un elemento usando secrets.choice. Count positivo reemplaza la lista por una muestra y retorna self; negativo o mayor que longitud produce ValueError. No lo utilices como fuente de identidades persistidas únicas.

```python
sample = Collection([1, 2, 3]).random(2)
assert len(sample) == 2
```

<a id="collection-reduce"></a>

### `reduce`

```text
def reduce(self, callback: Callable, initial: object=0) -> object
```

Reduce con callback(acumulado, elemento) e initial=0. Devuelve valor escalar/objeto; errores del callback se propagan.

```python
assert Collection([1, 2, 3]).reduce(lambda total, n: total + n, 0) == 6
```

<a id="collection-reject"></a>

### `reject`

```text
def reject(self, callback: Callable) -> Collection
```

Elimina del mismo objeto elementos cuyo callback es truthy y retorna self. A diferencia de filter, modifica la colección original.

```python
assert Collection([1, 2, 3]).reject(lambda n: n == 2).all() == [1, 3]
```

<a id="collection-reverse"></a>

### `reverse`

```text
def reverse(self) -> Collection
```

Invierte en el mismo objeto y retorna self.

```python
assert Collection([1, 2]).reverse().all() == [2, 1]
```

<a id="collection-serialize"></a>

### `serialize`

```text
def serialize(self) -> list[Any]
```

Devuelve lista de salidas de item.serialize(), o to_dict(), o el propio elemento. En modelos respeta hidden y appends; no incluye automáticamente relaciones. Para colecciones respaldadas por dict itera claves: usa all() para obtener el mapping.

```python
assert Collection([{"id": 1}]).serialize() == [{"id": 1}]
```

<a id="collection-shift"></a>

### `shift`

```text
def shift(self) -> object
```

Extrae índice 0 usando pull. En colección vacía puede lanzar IndexError; comprueba isEmpty primero.

```python
values = Collection([1, 2])
assert values.shift() == 1
```

<a id="collection-sort"></a>

### `sort`

```text
def sort(self, key: str | None=None) -> Collection
```

Ordena ascendentemente el mismo objeto, por clave opcional o elementos completos. Retorna self; valores no comparables propagan TypeError. No hay argumento descending.

```python
assert Collection([3, 1, 2]).sort().all() == [1, 2, 3]
```

<a id="collection-sum"></a>

### `sum`

```text
def sum(self, key: str | None=None) -> float
```

Suma en memoria, opcionalmente por clave; ante TypeError devuelve 0. Si la extracción de una clave no produce valores usa los elementos completos como fallback, por eso evita claves ausentes.

```python
assert Collection([{"points": 2}, {"points": 4}]).sum("points") == 6
```

<a id="collection-tojson"></a>

### `toJson`

```text
def toJson(self, **kwargs: object) -> str
```

json.dumps(serialize(), **kwargs); no añade default=str automáticamente. Pasa default=str para datetime/UUID o provee encoder; errores estándar se propagan.

```python
text = Collection([{"id": 1}]).toJson(ensure_ascii=False, default=str)
```

<a id="collection-groupby"></a>

### `groupBy`

```text
def groupBy(self, key: str) -> Collection
```

Ordena por clave y devuelve Collection respaldada por mapping valor→lista. No es GROUP BY SQL. Valores no comparables durante ordenación o no hashables como clave pueden producir TypeError; usa all() para consumir los grupos.

```python
groups = Collection([{"kind": "a", "id": 1}]).groupBy("kind").all()
assert groups["a"][0]["id"] == 1
```

<a id="collection-transform"></a>

### `transform`

```text
def transform(self, callback: Callable) -> Collection
```

Reemplaza todos los elementos por resultados del callback y retorna self, conservando también None. map crea otra colección; transform modifica esta.

```python
assert Collection([1, 2]).transform(lambda n: n + 1).all() == [2, 3]
```

<a id="collection-unique"></a>

### `unique`

```text
def unique(self, key: str | Callable | None=None) -> Collection
```

Con campo o selector callable, conserva el primer representante, incluidos valores seleccionados no hashables iguales. Sin clave, los elementos hashables usan un set sin garantía de orden. Una colección respaldada por dict con clave truthy retorna la misma instancia. Consulta la [semántica de valores únicos](/es/utilities/helpers/collection#collection-unique-performance).

```python
assert sorted(Collection([1, 1, 2]).unique().all()) == [1, 2]
```

<a id="collection-where"></a>

### `where`

```text
def where(self, key: str, *args: object) -> Collection
```

Filtro en memoria: (key,value) o (key,operator,value), operadores <, <=, ==, !=, >, >=. Sin valor produce ValueError; operadores no admitidos se omiten al capturar el error por elemento. No equivale al operador SQL "=". Comparaciones incompatibles intentan texto.

```python
assert Collection([{"id": 1}, {"id": 2}]).where("id", ">", 1).count() == 1
```

<a id="collection-wherein"></a>

### `whereIn`

```text
def whereIn(self, key: str, values: list[Any] | Collection) -> Collection
```

Colección nueva por pertenencia de clave en lista/Collection. Además de igualdad compara representación str, por lo que 1 puede coincidir con "1". No es comparación SQL estricta.

```python
assert Collection([{"id": 1}]).whereIn("id", ["1"]).count() == 1
```

<a id="collection-wherenotin"></a>

### `whereNotIn`

```text
def whereNotIn(self, key: str, values: list[Any] | Collection) -> Collection
```

Complemento de whereIn, incluyendo su comparación textual; devuelve colección nueva.

```python
assert Collection([{"id": 1}, {"id": 2}]).whereNotIn("id", [1]).count() == 1
```

<a id="collection-zip"></a>

### `zip`

```text
def zip(self, items: list[Any] | Collection) -> Collection
```

Colección nueva de pares hasta la longitud menor. Solo lista/Collection, otro tipo produce TypeError.

```python
assert Collection([1, 2]).zip(["a"]).all() == [[1, "a"]]
```

<a id="collection-setappends"></a>

### `setAppends`

```text
def setAppends(self, appends: list[str]) -> Collection
```

Agrega nombres a la serialización de elementos sin modificar appends de la clase. Retorna self; en modelos usa getAttribute y respeta hidden. No calcula ni consulta relaciones.

```python
rows = Collection([Article({"title": "Guide"})]).setAppends(["label"])
assert rows.serialize()[0]["label"] == "GUIDE"
```

<a id="collection-addrelation"></a>

### `addRelation`

```text
def addRelation(self, relation_data: dict[str, Any]) -> Collection
```

Por cada elemento que tenga setRelation, guarda todos los pares del dict y retorna self. No ejecuta eager loading ni incorpora esas relaciones a toDict automáticamente.

```python
rows = Collection([Team({"name": "A"})])
rows.addRelation({"players": Collection()})
assert rows[0].relationLoaded("players")
```

<a id="collection-python-protocol"></a>

## Protocolo Python

Puedes iterar con `for`, usar `len`, comparar colecciones/listas, leer índices negativos y slices (`rows[:10]` crea Collection nueva), asignar con `rows[0] = value` y borrar con `del rows[0]`. Indexación/asignación/borrado propagan errores de la lista/dict subyacente. Las comparaciones de orden usan orden lexicográfico de elementos, no PK ni orden SQL. `hash(rows)` solo funciona cuando todos los elementos son hashables; no uses una colección mutable como clave que después vas a modificar.

`groupBy` y `pluck(value, key)` pueden producir un almacén dict pese a la anotación de constructor/lista; sus iteraciones son claves. Usa `.all()` para ese mapping y no lo trates como una lista de modelos ni como el resultado de `serialize()` de un queryset.
