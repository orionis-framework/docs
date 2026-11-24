---
title: "Colecciones y paginación"
description: "Paginar consultas de modelos, leer lotes ordenados y trabajar con colecciones de modelos hidratados."
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
    async def __call__(self, number: int) -> JSONResponse:
        if number < 1:
            return JSONResponse({"error": "Page must be positive"}, status_code=400)
        query = Article.where("published", True).orderBy("id")
        page = await query.paginate(page=number, per_page=20)
        return JSONResponse(page.toDict())
```

Guarda el controlador en `app/http/controllers/article_list_controller.py` y regístralo en tu archivo de rutas. Una petición a `/articles/page/2` consulta los siguientes 20 artículos publicados.

```python
from app.http.controllers.article_list_controller import ArticleListController
from orionis.support.facades import Route

Route.get("/articles/page/{number:int}", ArticleListController)
```

<a id="query-chunks"></a>

## Leer resultados de base de datos por lotes

Los constructores de consultas exponen `chunks(size: int = 1000) -> AsyncIterator[Collection]`. Consúmelo con `async for`; no apliques `await` al iterador. Funciona en consultas de modelos y en `DB.table(...)`:

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

Guardar todos los lotes en una lista elimina la ventaja de memoria. Las relaciones pueden consumir memoria adicional al número de filas. `get()` sigue materializando su resultado, mientras que [`Collection.chunk()`](/es/utilities/helpers/collection#collection-method-chunk) solo divide datos ya cargados en memoria.

## Paginación de consultas


<a id="modelquerybuilder-paginate"></a>

### `paginate`

```text
async def paginate(self, page: int = 1, per_page: int = 15) -> Paginator[TModel]
```

Terminal async con `page=1`, `per_page=15`: exige enteros positivos sin bool, o `InvalidQueryException`. Aplica OFFSET/LIMIT al builder, ejecuta COUNT y recuperación y devuelve `Paginator`. Dentro de transacción ejecuta ambas consultas secuencialmente en la conexión transaccional; fuera las ejecuta con gather usando conexiones del pool. No garantiza snapshot consistente entre ambas fuera de una transacción.

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
def __init__(self, items: Collection[TItem], total: int, page: int, per_page: int) -> None
```

Envuelve `Collection` sin consultar SQL. `page` y `per_page` deben ser int positivos, excluyendo bool (`ValueError`). `total` se convierte a int y se limita a cero mínimo. No ajusta una página superior a lastPage.

```python
from orionis.orm import Collection, Paginator

page = Paginator(Collection([{"id": 1}]), total=11, page=1, per_page=10)
```

<a id="paginator-items"></a>

### `items`

```text
page.items: Collection[TItem]
```

Propiedad de solo lectura: la misma Collection de la página; sus métodos mutadores sí pueden modificarla.

```python
items = page.items
```

<a id="paginator-total"></a>

### `total`

```text
page.total: int
```

Propiedad int: filas totales del recuento, no longitud de la página.

```python
assert page.total == 11
```

<a id="paginator-page"></a>

### `page`

```text
page.page: int
```

Propiedad int: página actual, empezando por 1.

```python
assert page.page == 1
```

<a id="paginator-perpage"></a>

### `perPage`

```text
page.perPage: int
```

Propiedad int: tamaño configurado, aunque la última página contenga menos filas.

```python
assert page.perPage == 10
```

<a id="paginator-lastpage"></a>

### `lastPage`

```text
page.lastPage: int
```

Propiedad int: ceil(total/perPage), al menos 1 incluso con total=0.

```python
assert page.lastPage == 2
```

<a id="paginator-hasnext"></a>

### `hasNext`

```text
page.hasNext: bool
```

Propiedad bool: page*perPage < total. No crea enlaces ni consulta otra página.

```python
assert page.hasNext is True
```

<a id="paginator-hasprevious"></a>

### `hasPrevious`

```text
page.hasPrevious: bool
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

<a id="api-completa-de-collection-utilizada-por-orm"></a>

## Trabajar con modelos hidratados

Para un índice de artículos publicados, selecciona en SQL los campos necesarios. Tras `get()`, puedes usar el ID como clave o extraer una lista de títulos en memoria.

```python
from app.models.article import Article


async def titles_by_id() -> dict:
    articles = await (
        Article.where("published", True)
        .select("id", "title")
        .orderBy("id")
        .get()
    )
    return articles.pluck("title", "id").all()
```

Con una clave, `pluck("title", "id").all()` devuelve un diccionario. Sin ella, `pluck("title").all()` devuelve una lista. Los cambios en la colección quedan en memoria. Usa `await article.save()` para persistir un modelo editado. Para una respuesta JSON, `articles.serialize()` llama al serializador de cada modelo y respeta sus atributos ocultos.

| Tarea | Métodos de Collection |
| --- | --- |
| Construir y leer | <a id="collection---init--"></a><a id="__init__-1"></a>[`__init__`](/es/utilities/helpers/collection#collection-method-init), <a id="collection-get"></a><a id="get"></a>[`get`](/es/utilities/helpers/collection#collection-method-get), <a id="collection-all"></a><a id="all"></a>[`all`](/es/utilities/helpers/collection#collection-method-all), <a id="collection-first"></a><a id="first"></a>[`first`](/es/utilities/helpers/collection#collection-method-first), <a id="collection-last"></a><a id="last"></a>[`last`](/es/utilities/helpers/collection#collection-method-last), <a id="collection-take"></a><a id="take"></a>[`take`](/es/utilities/helpers/collection#collection-method-take), <a id="collection-count"></a><a id="count"></a>[`count`](/es/utilities/helpers/collection#collection-method-count), <a id="collection-contains"></a><a id="contains"></a>[`contains`](/es/utilities/helpers/collection#collection-method-contains), <a id="collection-isempty"></a><a id="isempty"></a>[`isEmpty`](/es/utilities/helpers/collection#collection-method-isempty), <a id="collection-every"></a><a id="every"></a>[`every`](/es/utilities/helpers/collection#collection-method-every) |
| Filtrar y proyectar | <a id="collection-where"></a><a id="where"></a>[`where`](/es/utilities/helpers/collection#collection-method-where), <a id="collection-wherein"></a><a id="wherein"></a>[`whereIn`](/es/utilities/helpers/collection#collection-method-wherein), <a id="collection-wherenotin"></a><a id="wherenotin"></a>[`whereNotIn`](/es/utilities/helpers/collection#collection-method-wherenotin), <a id="collection-filter"></a><a id="filter"></a>[`filter`](/es/utilities/helpers/collection#collection-method-filter), <a id="collection-pluck"></a><a id="pluck"></a>[`pluck`](/es/utilities/helpers/collection#collection-method-pluck), <a id="collection-map"></a><a id="map"></a>[`map`](/es/utilities/helpers/collection#collection-method-map), <a id="collection-mapinto"></a><a id="mapinto"></a>[`mapInto`](/es/utilities/helpers/collection#collection-method-mapinto), <a id="collection-unique"></a><a id="unique"></a>[`unique`](/es/utilities/helpers/collection#collection-method-unique) |
| Dividir y combinar | <a id="collection-chunk"></a><a id="chunk"></a>[`chunk`](/es/utilities/helpers/collection#collection-method-chunk), <a id="collection-forpage"></a><a id="forpage"></a>[`forPage`](/es/utilities/helpers/collection#collection-method-forpage), <a id="collection-groupby"></a><a id="groupby"></a>[`groupBy`](/es/utilities/helpers/collection#collection-method-groupby), <a id="collection-collapse"></a><a id="collapse"></a>[`collapse`](/es/utilities/helpers/collection#collection-method-collapse), <a id="collection-flatten"></a><a id="flatten"></a>[`flatten`](/es/utilities/helpers/collection#collection-method-flatten), <a id="collection-diff"></a><a id="diff"></a>[`diff`](/es/utilities/helpers/collection#collection-method-diff), <a id="collection-zip"></a><a id="zip"></a>[`zip`](/es/utilities/helpers/collection#collection-method-zip) |
| Calcular valores | <a id="collection-sum"></a><a id="sum"></a>[`sum`](/es/utilities/helpers/collection#collection-method-sum), <a id="collection-avg"></a><a id="avg"></a>[`avg`](/es/utilities/helpers/collection#collection-method-avg), <a id="collection-min"></a><a id="min"></a>[`min`](/es/utilities/helpers/collection#collection-method-min), <a id="collection-max"></a><a id="max"></a>[`max`](/es/utilities/helpers/collection#collection-method-max), <a id="collection-reduce"></a><a id="reduce"></a>[`reduce`](/es/utilities/helpers/collection#collection-method-reduce), <a id="collection-implode"></a><a id="implode"></a>[`implode`](/es/utilities/helpers/collection#collection-method-implode) |
| Cambiar elementos u orden | <a id="collection-each"></a><a id="each"></a>[`each`](/es/utilities/helpers/collection#collection-method-each), <a id="collection-merge"></a><a id="merge"></a>[`merge`](/es/utilities/helpers/collection#collection-method-merge), <a id="collection-push"></a><a id="push"></a>[`push`](/es/utilities/helpers/collection#collection-method-push), <a id="collection-put"></a><a id="put"></a>[`put`](/es/utilities/helpers/collection#collection-method-put), <a id="collection-forget"></a><a id="forget"></a>[`forget`](/es/utilities/helpers/collection#collection-method-forget), <a id="collection-reject"></a><a id="reject"></a>[`reject`](/es/utilities/helpers/collection#collection-method-reject), <a id="collection-transform"></a><a id="transform"></a>[`transform`](/es/utilities/helpers/collection#collection-method-transform), <a id="collection-prepend"></a><a id="prepend"></a>[`prepend`](/es/utilities/helpers/collection#collection-method-prepend), <a id="collection-pop"></a><a id="pop"></a>[`pop`](/es/utilities/helpers/collection#collection-method-pop), <a id="collection-pull"></a><a id="pull"></a>[`pull`](/es/utilities/helpers/collection#collection-method-pull), <a id="collection-shift"></a><a id="shift"></a>[`shift`](/es/utilities/helpers/collection#collection-method-shift), <a id="collection-sort"></a><a id="sort"></a>[`sort`](/es/utilities/helpers/collection#collection-method-sort), <a id="collection-reverse"></a><a id="reverse"></a>[`reverse`](/es/utilities/helpers/collection#collection-method-reverse), <a id="collection-random"></a><a id="random"></a>[`random`](/es/utilities/helpers/collection#collection-method-random) |
| Preparar la salida | <a id="collection-serialize"></a><a id="serialize"></a>[`serialize`](/es/utilities/helpers/collection#collection-method-serialize), <a id="collection-tojson"></a><a id="tojson-1"></a>[`toJson`](/es/utilities/helpers/collection#collection-method-tojson), <a id="collection-setappends"></a><a id="setappends"></a>[`setAppends`](/es/utilities/helpers/collection#collection-method-setappends), <a id="collection-addrelation"></a><a id="addrelation"></a>[`addRelation`](/es/utilities/helpers/collection#collection-method-addrelation) |

<a id="collection-python-protocol"></a>
<a id="protocolo-python"></a>

Al iterar una colección respaldada por una lista obtienes los modelos. Un segmento devuelve otra colección que conserva esas mismas instancias. Operaciones con claves como `groupBy` producen colecciones respaldadas por diccionarios y la iteración recorre sus claves. [Referencia de Collection](/es/utilities/helpers/collection)
