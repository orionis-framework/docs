---
title: "Query Builder: selección y resultados"
description: "Construye consultas sin modelos, proyecta columnas, ordena, pagina y obtiene agregados con la API compartida del ORM."
editUrl: true
lastUpdated: false
---

`DB.table("products")` crea un `RawQueryBuilder` nuevo. `Model.query()` crea un `ModelQueryBuilder` que comparte sus cláusulas; cambia cómo hidrata, serializa y aplica políticas del modelo. Las cláusulas devuelven el mismo builder y son síncronas: espera únicamente los terminales asíncronos.

Los ejemplos de esta referencia requieren una aplicación iniciada y las tablas `products` y `categories` del escenario de [testing](/es/database/orm/testing). Los bloques son funciones de servicio/controlador o consultas que puedes ejecutar dentro de una acción `async`. Los ejemplos de escritura modifican esas tablas de ejemplo.

No compartas un builder mutable entre peticiones o tareas. El gateway `DB` sí es compartido: crea un builder para cada consulta y usa `clone()` para ramificar.

## Resultados de tablas y modelos

`get()` devuelve `Collection`, no una lista Python. Las tablas crudas contienen diccionarios; las consultas de modelo contienen modelos. `first()` devuelve una fila/modelo o `None`. `value()` puede devolver `None` tanto por ausencia de fila como por un valor NULL. `pluck()` devuelve una colección de valores. Consulta [colecciones y paginación](/es/database/orm/collections-and-pagination) para interpretar sus estructuras.

Para filtrar, unir y escribir continúa con [condiciones](/es/database/query-filters), [joins](/es/database/joins-and-subqueries) y [escrituras](/es/database/query-writes).

## Referencia por operación

<a id="api-toplan"></a>

### `toPlan()`

```text
toPlan() -> SelectPlan
```

Devuelve el SelectPlan vivo, sin compilar ni ejecutar SQL. Permite inspeccionar filtros, proyección y límites.

**Resultado:** `SelectPlan`.

Cambiar el objeto devuelto cambia la consulta; no es un snapshot.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).toPlan()
```

<a id="api-clone"></a>

### `clone()`

```text
clone() -> Self
```

Copia las listas del plan para ramificar una consulta. Las cláusulas existentes, la tabla y los planes anidados conservan referencias compartidas; no es una copia profunda.

**Resultado:** un builder nuevo (`Self`), con listas de plan copiadas; no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).clone().where("stock", ">", 0)
```

<a id="api-adoptplan"></a>

### `adoptPlan()`

```text
adoptPlan(plan: SelectPlan) -> Self
```

Sustituye el plan completo del builder y devuelve la misma instancia. No ejecuta ni valida la existencia de tablas.

| Parámetro | Uso |
| --- | --- |
| `plan` | SelectPlan que pasa a ser el plan vivo del builder; clónalo antes si necesitas independencia. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Comparte ese plan: para separarlo usa plan.clone().

```python
from orionis.support.facades import DB

query = DB.table("products").adoptPlan(DB.table("products").where("stock", ">", 0).toPlan())
```

<a id="api-adoptconnection"></a>

### `adoptConnection()`

```text
adoptConnection(name: str | None) -> Self
```

Selecciona la conexión de este builder. None vuelve a la predeterminada; no cambia la configuración global.

| Parámetro | Uso |
| --- | --- |
| `name` | Nombre de conexión o de tabla según el método. La conexión debe estar registrada. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").adoptConnection("sqlite")
```

<a id="api-select"></a>

### `select()`

```text
select(*columns: str) -> Self
```

Reemplaza la proyección por las columnas indicadas. select() selecciona todas; las columnas inexistentes fallan al compilar o ejecutar.

| Parámetro | Uso |
| --- | --- |
| `columns` | Nombres de columnas; pueden estar calificados por tabla o alias. Vacío conserva la selección de todas las columnas. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("id", "name")
```

<a id="api-addselect"></a>

### `addSelect()`

```text
addSelect(*columns: str) -> Self
```

Añade columnas a la proyección actual, conservando las anteriores. No elimina duplicados de nombres.

| Parámetro | Uso |
| --- | --- |
| `columns` | Nombres de columnas; pueden estar calificados por tabla o alias. Vacío conserva la selección de todas las columnas. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("id").addSelect("name")
```

<a id="api-selectraw"></a>

### `selectRaw()`

```text
selectRaw(sql: str, bindings: dict[str, Any] | None=None, alias: str | None=None) -> Self
```

Añade una expresión SQL confiable y sus bindings. alias permite referenciar el resultado en una tabla derivada.

| Parámetro | Uso |
| --- | --- |
| `sql` | Fragmento SQL escrito por el desarrollador; los valores variables se pasan mediante bindings. |
| `bindings` | Diccionario de parámetros nombrados :nombre. None equivale a no añadir bindings. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("id").selectRaw("price * :factor", {"factor": 2}, alias="double_price")
```

<a id="api-distinct"></a>

### `distinct()`

```text
distinct() -> Self
```

Solicita SELECT DISTINCT sobre la proyección completa. No recibe nombres de columnas ni implementa DISTINCT ON.

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").distinct()
```

<a id="api-orderby"></a>

### `orderBy()`

```text
orderBy(column: str, direction: str='asc') -> Self
```

Añade ordenación ascendente o descendente. Conserva las reglas anteriores; una dirección inválida produce InvalidQueryException.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `direction` | asc o desc; se recortan espacios y se normaliza a minúsculas. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("price", "desc").orderBy("id")
```

<a id="api-latest"></a>

### `latest()`

```text
latest(column: str | None=None) -> Self
```

Ordena por más recientes primero. Sin columna usa created_at en tablas crudas y el timestamp de creación configurado en modelos.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

No crea la columna; si no existe, indica una columna apropiada.

```python
from orionis.support.facades import DB

query = DB.table("products").latest("id")
```

<a id="api-oldest"></a>

### `oldest()`

```text
oldest(column: str | None=None) -> Self
```

Ordena por más antiguos primero. Sin columna usa created_at en tablas crudas y el timestamp de creación configurado en modelos.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

No crea la columna; si no existe, indica una columna apropiada.

```python
from orionis.support.facades import DB

query = DB.table("products").oldest("id")
```

<a id="api-groupby"></a>

### `groupBy()`

```text
groupBy(*columns: str) -> Self
```

Añade columnas de agrupación. Las proyecciones y los agregados deben ser compatibles con GROUP BY en el motor utilizado.

| Parámetro | Uso |
| --- | --- |
| `columns` | Nombres de columnas; pueden estar calificados por tabla o alias. Vacío conserva la selección de todas las columnas. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").selectRaw("COUNT(*)", alias="total").groupBy("category_id")
```

<a id="api-limit"></a>

### `limit()`

```text
limit(value: int) -> Self
```

Establece máximo de filas; admite cero. Reemplaza el valor previo de esa opción.

| Parámetro | Uso |
| --- | --- |
| `value` | Valor de la opción o texto literal del filtro. Los límites/offsets deben ser enteros no negativos y no bool. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Rechaza negativos, bool y tipos distintos de int con InvalidQueryException.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").limit(10)
```

<a id="api-take"></a>

### `take()`

```text
take(value: int) -> Self
```

Establece máximo de filas (alias de limit); admite cero. Reemplaza el valor previo de esa opción.

| Parámetro | Uso |
| --- | --- |
| `value` | Valor de la opción o texto literal del filtro. Los límites/offsets deben ser enteros no negativos y no bool. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Rechaza negativos, bool y tipos distintos de int con InvalidQueryException.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").take(10)
```

<a id="api-offset"></a>

### `offset()`

```text
offset(value: int) -> Self
```

Establece filas a omitir; admite cero. Reemplaza el valor previo de esa opción.

| Parámetro | Uso |
| --- | --- |
| `value` | Valor de la opción o texto literal del filtro. Los límites/offsets deben ser enteros no negativos y no bool. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Rechaza negativos, bool y tipos distintos de int con InvalidQueryException.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").offset(10)
```

<a id="api-skip"></a>

### `skip()`

```text
skip(value: int) -> Self
```

Establece filas a omitir (alias de offset); admite cero. Reemplaza el valor previo de esa opción.

| Parámetro | Uso |
| --- | --- |
| `value` | Valor de la opción o texto literal del filtro. Los límites/offsets deben ser enteros no negativos y no bool. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Rechaza negativos, bool y tipos distintos de int con InvalidQueryException.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").skip(10)
```

<a id="api-forpage"></a>

### `forPage()`

```text
forPage(page: int, per_page: int=15) -> Self
```

Configura limit=per_page y offset=(page-1)*per_page sin ejecutar consultas.

| Parámetro | Uso |
| --- | --- |
| `page` | Número de página, entero >=1, sin aceptar bool. |
| `per_page` | Tamaño de página, entero >=1; predeterminado 15. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Página y tamaño deben ser enteros positivos; no devuelve Paginator.

```python
from orionis.support.facades import DB

query = DB.table("products").orderBy("id").forPage(2, 20)
```

<a id="api-count"></a>

### `count()`

```text
async count(column: str='*') -> int
```

Cuenta filas coincidentes; column="*" cuenta todas y una columna cuenta sus valores no NULL.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** `int`.

Los agregados clonan el plan y quitan orden, limit y offset; conservan filtros, grupos, HAVING y uniones. Con GROUP BY, salvo count("*"), el terminal escalar devuelve el primer valor calculado, no un resultado por grupo. count("*") cuenta las filas del resultado derivado cuando hay grupos, DISTINCT o UNION. Para agregados por grupo usa selectRaw(...).groupBy(...).get(). exists() quita el offset, establece limit=1 y no carga toda la colección.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).count()
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-exists"></a>

### `exists()`

```text
async exists() -> bool
```

Comprueba existencia mediante SELECT limitado a una fila.

**Resultado:** `bool`.

Los agregados clonan el plan y quitan orden, limit y offset; conservan filtros, grupos, HAVING y uniones. Con GROUP BY, salvo count("*"), el terminal escalar devuelve el primer valor calculado, no un resultado por grupo. count("*") cuenta las filas del resultado derivado cuando hay grupos, DISTINCT o UNION. Para agregados por grupo usa selectRaw(...).groupBy(...).get(). exists() quita el offset, establece limit=1 y no carga toda la colección.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).exists()
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-doesntexist"></a>

### `doesntExist()`

```text
async doesntExist() -> bool
```

Invierte el resultado de exists().

**Resultado:** `bool`.

Los agregados clonan el plan y quitan orden, limit y offset; conservan filtros, grupos, HAVING y uniones. Con GROUP BY, salvo count("*"), el terminal escalar devuelve el primer valor calculado, no un resultado por grupo. count("*") cuenta las filas del resultado derivado cuando hay grupos, DISTINCT o UNION. Para agregados por grupo usa selectRaw(...).groupBy(...).get(). exists() quita el offset, establece limit=1 y no carga toda la colección.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).doesntExist()
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-max"></a>

### `max()`

```text
async max(column: str) -> Any
```

Devuelve el máximo; sin valores devuelve None.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** `Any`.

Los agregados clonan el plan y quitan orden, limit y offset; conservan filtros, grupos, HAVING y uniones. Con GROUP BY, salvo count("*"), el terminal escalar devuelve el primer valor calculado, no un resultado por grupo. count("*") cuenta las filas del resultado derivado cuando hay grupos, DISTINCT o UNION. Para agregados por grupo usa selectRaw(...).groupBy(...).get(). exists() quita el offset, establece limit=1 y no carga toda la colección.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).max("price")
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-min"></a>

### `min()`

```text
async min(column: str) -> Any
```

Devuelve el mínimo; sin valores devuelve None.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** `Any`.

Los agregados clonan el plan y quitan orden, limit y offset; conservan filtros, grupos, HAVING y uniones. Con GROUP BY, salvo count("*"), el terminal escalar devuelve el primer valor calculado, no un resultado por grupo. count("*") cuenta las filas del resultado derivado cuando hay grupos, DISTINCT o UNION. Para agregados por grupo usa selectRaw(...).groupBy(...).get(). exists() quita el offset, establece limit=1 y no carga toda la colección.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).min("price")
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-avg"></a>

### `avg()`

```text
async avg(column: str) -> float | None
```

Devuelve la media convertida a float, o None sin valores.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** `float | None`.

Los agregados clonan el plan y quitan orden, limit y offset; conservan filtros, grupos, HAVING y uniones. Con GROUP BY, salvo count("*"), el terminal escalar devuelve el primer valor calculado, no un resultado por grupo. count("*") cuenta las filas del resultado derivado cuando hay grupos, DISTINCT o UNION. Para agregados por grupo usa selectRaw(...).groupBy(...).get(). exists() quita el offset, establece limit=1 y no carga toda la colección.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).avg("price")
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-sum"></a>

### `sum()`

```text
async sum(column: str) -> Any
```

Devuelve la suma; sin valores devuelve 0.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** `Any`.

Los agregados clonan el plan y quitan orden, limit y offset; conservan filtros, grupos, HAVING y uniones. Con GROUP BY, salvo count("*"), el terminal escalar devuelve el primer valor calculado, no un resultado por grupo. count("*") cuenta las filas del resultado derivado cuando hay grupos, DISTINCT o UNION. Para agregados por grupo usa selectRaw(...).groupBy(...).get(). exists() quita el offset, establece limit=1 y no carga toda la colección.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("active", True).sum("price")
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-raw-connection"></a>

### `connection()`

```text
connection(name: str) -> Self
```

Selecciona una conexión registrada en este builder sin alterar el gateway DB compartido.

| Parámetro | Uso |
| --- | --- |
| `name` | Nombre de conexión o de tabla según el método. La conexión debe estar registrada. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Los terminales requieren una tabla seleccionada y la aplicación iniciada. Los errores de consulta se propagan; paginate necesita enteros positivos y utiliza dos consultas, no una instantánea atómica.

```python
from orionis.support.facades import DB

query = DB.table("products").connection("sqlite")
```

<a id="api-raw-table"></a>

### `table()`

```text
table(name: str, *, alias: str | None=None) -> Self
```

Reemplaza la tabla y el alias conservando las cláusulas existentes.

| Parámetro | Uso |
| --- | --- |
| `name` | Nombre de conexión o de tabla según el método. La conexión debe estar registrada. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Los terminales requieren una tabla seleccionada y la aplicación iniciada. Los errores de consulta se propagan; paginate necesita enteros positivos y utiliza dos consultas, no una instantánea atómica.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).table("products", alias="p")
```

<a id="api-raw-get"></a>

### `get()`

```text
async get() -> Collection
```

Ejecuta SELECT y devuelve Collection de diccionarios. No hidrata modelos ni aplica sus eventos, scopes o casts.

**Resultado:** `Collection`.

Los terminales requieren una tabla seleccionada y la aplicación iniciada. Los errores de consulta se propagan; paginate necesita enteros positivos y utiliza dos consultas, no una instantánea atómica.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").orderBy("id").get()
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-raw-first"></a>

### `first()`

```text
async first() -> dict[str, Any] | None
```

Consulta una copia con limit=1 y devuelve un dict o None, sin cambiar el límite del builder original.

**Resultado:** `dict[str, Any] | None`.

Los terminales requieren una tabla seleccionada y la aplicación iniciada. Los errores de consulta se propagan; paginate necesita enteros positivos y utiliza dos consultas, no una instantánea atómica.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").orderBy("id").first()
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-raw-value"></a>

### `value()`

```text
async value(column: str) -> Any
```

Selecciona una columna en una copia y devuelve su primer valor o None. None también puede ser un valor SQL NULL.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** `Any`.

Los terminales requieren una tabla seleccionada y la aplicación iniciada. Los errores de consulta se propagan; paginate necesita enteros positivos y utiliza dos consultas, no una instantánea atómica.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("id", 1).value("name")
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-raw-pluck"></a>

### `pluck()`

```text
async pluck(column: str) -> Collection
```

Selecciona una columna y devuelve una Collection de sus valores, conservando el orden de la consulta.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** `Collection`.

Los terminales requieren una tabla seleccionada y la aplicación iniciada. Los errores de consulta se propagan; paginate necesita enteros positivos y utiliza dos consultas, no una instantánea atómica.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").orderBy("id").pluck("name")
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-raw-paginate"></a>

### `paginate()`

```text
async paginate(page: int=1, per_page: int=15) -> Paginator
```

Configura la página y ejecuta count seguido de get para construir un Paginator de diccionarios.

| Parámetro | Uso |
| --- | --- |
| `page` | Número de página, entero >=1, sin aceptar bool. |
| `per_page` | Tamaño de página, entero >=1; predeterminado 15. |

**Resultado:** `Paginator`.

Los terminales requieren una tabla seleccionada y la aplicación iniciada. Los errores de consulta se propagan; paginate necesita enteros positivos y utiliza dos consultas, no una instantánea atómica.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").orderBy("id").paginate(page=1, per_page=15)
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

[Fachada DB](/es/database/db-facade) · [Consultas ORM](/es/database/orm/querying) · [Escenario de pruebas](/es/database/orm/testing)
