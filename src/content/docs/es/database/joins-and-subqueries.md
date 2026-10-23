---
title: "Joins y subconsultas"
description: "Relaciona tablas, configura ON, subconsultas correlacionadas, tablas derivadas y uniones de resultados."
editUrl: true
lastUpdated: false
---

Los joins relacionan fuentes SQL y devuelven filas de una consulta. Las [relaciones ORM](/es/orm/relationships) describen asociaciones entre modelos y su carga; son APIs distintas.

Usa alias y nombres calificados para resolver columnas inequívocamente. Una subconsulta acepta un builder, `SelectPlan` o un callback síncrono que configura un builder nuevo. `selectSub`, `whereExists`, `whereIn`, `joinSub` y `union` reutilizan esta normalización. Los planes se incorporan por referencia; termina de configurarlos o clónalos antes de reutilizarlos.

```python
from orionis.support.facades import DB

async def product_categories():
    return await (
        DB.table("products", alias="p")
        .leftJoin("categories", "p.category_id", "=", "c.id", alias="c")
        .select("p.id", "p.name")
        .selectRaw("c.name", alias="category_name")
        .orderBy("p.id")
        .get()
    )
```

El ejemplo evita dos columnas `name` con la misma clave de resultado. Seleccionar columnas homónimas sin alias puede producir claves ambiguas al recuperar diccionarios. Para un modelo que luego guarde cambios o cargue relaciones conserva sus claves necesarias.

La disponibilidad de RIGHT/FULL JOIN depende del servidor. No se emula un JOIN no admitido ni se consulta otro motor automáticamente. Cada terminal mantiene una sola conexión: las subconsultas se compilan en el motor de la consulta exterior, aunque el builder incrustado haya elegido otra conexión.

## Referencia por operación

<a id="api-selectsub"></a>

### `selectSub()`

```text
selectSub(query: Any, alias: str) -> Self
```

Añade una subconsulta escalar con alias. El motor exige una columna y cardinalidad escalar; el builder no convierte varias filas en una lista.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("id").selectSub(DB.table("products").selectRaw("MAX(price)").toPlan(), "highest_price")
```

<a id="api-whereexists"></a>

### `whereExists()`

```text
whereExists(query: Any) -> Self
```

Añade EXISTS con AND. Úsalo para filtrar por la existencia de filas relacionadas sin hidratar modelos.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").whereExists(DB.table("categories", alias="c").select("c.id").whereColumn("c.id", "=", "p.category_id"))
```

<a id="api-orwhereexists"></a>

### `orWhereExists()`

```text
orWhereExists(query: Any) -> Self
```

Añade EXISTS con OR. Úsalo para filtrar por la existencia de filas relacionadas sin hidratar modelos.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").orWhereExists(DB.table("categories", alias="c").select("c.id").whereColumn("c.id", "=", "p.category_id"))
```

<a id="api-wherenotexists"></a>

### `whereNotExists()`

```text
whereNotExists(query: Any) -> Self
```

Añade NOT EXISTS con AND. Úsalo para filtrar por la existencia de filas relacionadas sin hidratar modelos.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").whereNotExists(DB.table("categories", alias="c").select("c.id").whereColumn("c.id", "=", "p.category_id"))
```

<a id="api-orwherenotexists"></a>

### `orWhereNotExists()`

```text
orWhereNotExists(query: Any) -> Self
```

Añade NOT EXISTS con OR. Úsalo para filtrar por la existencia de filas relacionadas sin hidratar modelos.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").orWhereNotExists(DB.table("categories", alias="c").select("c.id").whereColumn("c.id", "=", "p.category_id"))
```

<a id="api-join"></a>

### `join()`

```text
join(table: str | TableDefinition, first: Any=None, operator: str | None=None, second: str | None=None, *, alias: str | None=None) -> Self
```

Añade un JOIN INNER. Admite una condición de columnas o un callback JoinClause para combinar condiciones.

| Parámetro | Uso |
| --- | --- |
| `table` | Nombre de tabla lógico o TableDefinition. Separa un esquema con un punto y usa alias explícitos en joins. |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Una condición incompleta produce InvalidQueryException. Cada lado del ON debe ser una columna; el soporte del tipo de JOIN depende del motor.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").join("categories", "p.category_id", "=", "c.id", alias="c").select("p.id", "c.name")
```

<a id="api-leftjoin"></a>

### `leftJoin()`

```text
leftJoin(table: str | TableDefinition, first: Any=None, operator: str | None=None, second: str | None=None, *, alias: str | None=None) -> Self
```

Añade un JOIN LEFT OUTER. Admite una condición de columnas o un callback JoinClause para combinar condiciones.

| Parámetro | Uso |
| --- | --- |
| `table` | Nombre de tabla lógico o TableDefinition. Separa un esquema con un punto y usa alias explícitos en joins. |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Una condición incompleta produce InvalidQueryException. Cada lado del ON debe ser una columna; el soporte del tipo de JOIN depende del motor.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").leftJoin("categories", "p.category_id", "=", "c.id", alias="c").select("p.id", "c.name")
```

<a id="api-rightjoin"></a>

### `rightJoin()`

```text
rightJoin(table: str | TableDefinition, first: Any=None, operator: str | None=None, second: str | None=None, *, alias: str | None=None) -> Self
```

Añade un JOIN RIGHT OUTER. Admite una condición de columnas o un callback JoinClause para combinar condiciones.

| Parámetro | Uso |
| --- | --- |
| `table` | Nombre de tabla lógico o TableDefinition. Separa un esquema con un punto y usa alias explícitos en joins. |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Una condición incompleta produce InvalidQueryException. Cada lado del ON debe ser una columna; el soporte del tipo de JOIN depende del motor.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").rightJoin("categories", "p.category_id", "=", "c.id", alias="c").select("p.id", "c.name")
```

<a id="api-fulljoin"></a>

### `fullJoin()`

```text
fullJoin(table: str | TableDefinition, first: Any=None, operator: str | None=None, second: str | None=None, *, alias: str | None=None) -> Self
```

Añade un JOIN FULL OUTER. Admite una condición de columnas o un callback JoinClause para combinar condiciones.

| Parámetro | Uso |
| --- | --- |
| `table` | Nombre de tabla lógico o TableDefinition. Separa un esquema con un punto y usa alias explícitos en joins. |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Una condición incompleta produce InvalidQueryException. Cada lado del ON debe ser una columna; el soporte del tipo de JOIN depende del motor.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").fullJoin("categories", "p.category_id", "=", "c.id", alias="c").select("p.id", "c.name")
```

<a id="api-crossjoin"></a>

### `crossJoin()`

```text
crossJoin(table: str | TableDefinition, *, alias: str | None=None) -> Self
```

Añade un producto cartesiano sin condición ON. El número de combinaciones puede crecer como filas_izquierda * filas_derecha.

| Parámetro | Uso |
| --- | --- |
| `table` | Nombre de tabla lógico o TableDefinition. Separa un esquema con un punto y usa alias explícitos en joins. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").crossJoin("categories", alias="c").select("p.id", "c.id")
```

<a id="api-joinsub"></a>

### `joinSub()`

```text
joinSub(query: Any, alias: str, first: Any=None, operator: str | None=None, second: str | None=None) -> Self
```

Añade una tabla derivada con JOIN INNER; alias es obligatorio y las columnas proyectadas deben ser direccionables.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Acepta un builder, un SelectPlan o un callback síncrono. No existe fullJoinSub en esta API.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").joinSub(DB.table("categories").select("id", "name"), "c", "p.category_id", "=", "c.id").select("p.id", "c.name")
```

<a id="api-leftjoinsub"></a>

### `leftJoinSub()`

```text
leftJoinSub(query: Any, alias: str, first: Any=None, operator: str | None=None, second: str | None=None) -> Self
```

Añade una tabla derivada con JOIN LEFT OUTER; alias es obligatorio y las columnas proyectadas deben ser direccionables.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Acepta un builder, un SelectPlan o un callback síncrono. No existe fullJoinSub en esta API.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").leftJoinSub(DB.table("categories").select("id", "name"), "c", "p.category_id", "=", "c.id").select("p.id", "c.name")
```

<a id="api-rightjoinsub"></a>

### `rightJoinSub()`

```text
rightJoinSub(query: Any, alias: str, first: Any=None, operator: str | None=None, second: str | None=None) -> Self
```

Añade una tabla derivada con JOIN RIGHT OUTER; alias es obligatorio y las columnas proyectadas deben ser direccionables.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |
| `alias` | Alias SQL de la proyección o tabla derivada; se utiliza para referenciar su resultado. |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Acepta un builder, un SelectPlan o un callback síncrono. No existe fullJoinSub en esta API.

```python
from orionis.support.facades import DB

query = DB.table("products", alias="p").rightJoinSub(DB.table("categories").select("id", "name"), "c", "p.category_id", "=", "c.id").select("p.id", "c.name")
```

<a id="api-union"></a>

### `union()`

```text
union(query: Any) -> Self
```

Combina resultados mediante UNION eliminando duplicados.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Ambas consultas deben tener proyecciones compatibles en número y tipo; la validación final pertenece al motor.

```python
from orionis.support.facades import DB

query = DB.table("products").select("name").union(DB.table("categories").select("name"))
```

<a id="api-unionall"></a>

### `unionAll()`

```text
unionAll(query: Any) -> Self
```

Combina resultados mediante UNION ALL conservando duplicados.

| Parámetro | Uso |
| --- | --- |
| `query` | Builder, SelectPlan o callback síncrono que configura un builder nuevo. No se espera una coroutine. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Ambas consultas deben tener proyecciones compatibles en número y tipo; la validación final pertenece al motor.

```python
from orionis.support.facades import DB

query = DB.table("products").select("name").unionAll(DB.table("categories").select("name"))
```

<a id="api-join-on"></a>

### `on()`

```text
on(first: str, operator: str, second: str) -> Self
```

Añade una comparación de columnas unida con AND.

| Parámetro | Uso |
| --- | --- |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Los argumentos first/second son referencias de columna. Para un valor enlazado usa un filtro fuera del ON; JoinClause no ofrece where().

```python
from orionis.orm.query.join_clause import JoinClause

query = JoinClause().on("p.category_id", "=", "c.id")
```

<a id="api-join-oron"></a>

### `orOn()`

```text
orOn(first: str, operator: str, second: str) -> Self
```

Añade una comparación de columnas unida con OR.

| Parámetro | Uso |
| --- | --- |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Los argumentos first/second son referencias de columna. Para un valor enlazado usa un filtro fuera del ON; JoinClause no ofrece where().

```python
from orionis.orm.query.join_clause import JoinClause

query = JoinClause().on("p.category_id", "=", "c.id").orOn("p.category_id", "=", "c.parent_id")
```

<a id="api-join-conditions"></a>

### `conditions()`

```text
conditions() -> list[JoinCondition]
```

Devuelve la lista viva de condiciones ON en orden. No ejecuta SQL ni la copia.

**Resultado:** `list[JoinCondition]`.

Los argumentos first/second son referencias de columna. Para un valor enlazado usa un filtro fuera del ON; JoinClause no ofrece where().

```python
from orionis.orm.query.join_clause import JoinClause

query = JoinClause().on("p.category_id", "=", "c.id").conditions()
```

[Fachada DB](/es/database/db-facade) · [Consultas ORM](/es/orm/querying) · [Escenario de pruebas](/es/orm/testing)
