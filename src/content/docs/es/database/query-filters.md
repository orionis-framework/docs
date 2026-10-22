---
title: "Filtros y condiciones"
description: "Combina condiciones, grupos lógicos, NULL, rangos, patrones y SQL enlazado sin interpolar valores de usuario."
editUrl: true
lastUpdated: false
---

Los valores se enlazan como parámetros; las columnas y los fragmentos SQL son elegidos por la aplicación. Una lista permitida de columnas evita convertir nombres recibidos del cliente en SQL arbitrario. Los métodos de esta página añaden cláusulas sin ejecutar consultas.

La [referencia del builder](/es/database/query-builder) explica el escenario `products`. En un callback utiliza métodos síncronos: el retorno no se espera. Las condiciones se combinan de izquierda a derecha: A OR B AND C produce `(A OR B) AND C`. Agrupa alternativas para controlar la asociación; `A AND (B OR C)` es distinto de `A AND B OR C`.

```python
from orionis.support.facades import DB

async def available_products():
    return await (
        DB.table("products")
        .where("active", True)
        .where(lambda group: group.where("stock", ">", 0).orWhere("reserved", 0))
        .orderBy("id")
        .get()
    )
```

Un callback agrupado vacío se convierte en true: `orWhere(lambda group: None)` puede ampliar la consulta a todas las filas. No generes un grupo OR vacío a partir de filtros opcionales; `where({})` no agrega condiciones.

Las variantes `orWhere...` cambian el conector lógico de esa cláusula; no crean un grupo automáticamente. `having` filtra después de agrupar y comparte las formas de condiciones básicas. No existe una variante OR para cada método especializado: cuando no está documentada, combina `orWhere()` con un callback agrupado.

## Referencia por operación

<a id="api-where"></a>

### `where()`

```text
where(column: Any, *args: Any) -> Self
```

Añade condiciones con AND. Admite igualdad, operador explícito, dict de igualdades y callback agrupado.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `args` | Un valor para igualdad o dos argumentos (operador, valor). Las formas dict y callback no necesitan estos argumentos. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Operadores admitidos: =, ==, !=, <>, <, <=, >, >=, like, not like, ilike y not ilike. Un operador no admitido o aridad incorrecta produce InvalidQueryException. Con None, sólo =/== se convierten en IS NULL y !=/<> en IS NOT NULL. Los demás operadores no reciben esa conversión y pueden fallar al compilar.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).where("stock", ">", 0)
```

<a id="api-orwhere"></a>

### `orWhere()`

```text
orWhere(column: Any, *args: Any) -> Self
```

Añade condiciones con OR. Admite igualdad, operador explícito, dict de igualdades y callback agrupado.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `args` | Un valor para igualdad o dos argumentos (operador, valor). Las formas dict y callback no necesitan estos argumentos. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Operadores admitidos: =, ==, !=, <>, <, <=, >, >=, like, not like, ilike y not ilike. Un operador no admitido o aridad incorrecta produce InvalidQueryException. Con None, sólo =/== se convierten en IS NULL y !=/<> en IS NOT NULL. Los demás operadores no reciben esa conversión y pueden fallar al compilar.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhere("stock", ">", 0)
```

<a id="api-wherein"></a>

### `whereIn()`

```text
whereIn(column: str, values: Any) -> Self
```

Filtra por pertenencia a un iterable o subconsulta, combinado con AND.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `values` | Valores que se insertan/actualizan, o iterable/subconsulta en los filtros de pertenencia; consulta el comportamiento de esta operación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El iterable se materializa al configurar la cláusula; una Collection se desempaqueta. IN([]) no coincide con filas y NOT IN([]) no excluye filas, incluso si la columna es NULL. None no es un iterable vacío: produce TypeError al construir la cláusula.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).whereIn("id", [1, 2, 3])
```

<a id="api-orwherein"></a>

### `orWhereIn()`

```text
orWhereIn(column: str, values: Any) -> Self
```

Filtra por pertenencia a un iterable o subconsulta, combinado con OR.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `values` | Valores que se insertan/actualizan, o iterable/subconsulta en los filtros de pertenencia; consulta el comportamiento de esta operación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El iterable se materializa al configurar la cláusula; una Collection se desempaqueta. IN([]) no coincide con filas y NOT IN([]) no excluye filas, incluso si la columna es NULL. None no es un iterable vacío: produce TypeError al construir la cláusula.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhereIn("id", [1, 2, 3])
```

<a id="api-wherenotin"></a>

### `whereNotIn()`

```text
whereNotIn(column: str, values: Any) -> Self
```

Filtra por exclusión a un iterable o subconsulta, combinado con AND.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `values` | Valores que se insertan/actualizan, o iterable/subconsulta en los filtros de pertenencia; consulta el comportamiento de esta operación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El iterable se materializa al configurar la cláusula; una Collection se desempaqueta. IN([]) no coincide con filas y NOT IN([]) no excluye filas, incluso si la columna es NULL. None no es un iterable vacío: produce TypeError al construir la cláusula.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).whereNotIn("id", [1, 2, 3])
```

<a id="api-orwherenotin"></a>

### `orWhereNotIn()`

```text
orWhereNotIn(column: str, values: Any) -> Self
```

Filtra por exclusión a un iterable o subconsulta, combinado con OR.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `values` | Valores que se insertan/actualizan, o iterable/subconsulta en los filtros de pertenencia; consulta el comportamiento de esta operación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El iterable se materializa al configurar la cláusula; una Collection se desempaqueta. IN([]) no coincide con filas y NOT IN([]) no excluye filas, incluso si la columna es NULL. None no es un iterable vacío: produce TypeError al construir la cláusula.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhereNotIn("id", [1, 2, 3])
```

<a id="api-wherenull"></a>

### `whereNull()`

```text
whereNull(column: str) -> Self
```

Añade IS NULL con AND; comprueba ausencia SQL, no una cadena vacía.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).whereNull("description")
```

<a id="api-orwherenull"></a>

### `orWhereNull()`

```text
orWhereNull(column: str) -> Self
```

Añade IS NULL con OR; comprueba ausencia SQL, no una cadena vacía.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhereNull("description")
```

<a id="api-wherenotnull"></a>

### `whereNotNull()`

```text
whereNotNull(column: str) -> Self
```

Añade IS NOT NULL con AND; comprueba ausencia SQL, no una cadena vacía.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).whereNotNull("description")
```

<a id="api-orwherenotnull"></a>

### `orWhereNotNull()`

```text
orWhereNotNull(column: str) -> Self
```

Añade IS NOT NULL con OR; comprueba ausencia SQL, no una cadena vacía.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").where("active", True).orWhereNotNull("description")
```

<a id="api-wherebetween"></a>

### `whereBetween()`

```text
whereBetween(column: str, bounds: Iterable[Any]) -> Self
```

Añade BETWEEN con dos límites inclusivos.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `bounds` | Iterable de exactamente dos límites, inferior y superior, incluidos por BETWEEN. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Una cantidad distinta de dos límites produce InvalidQueryException al construir la cláusula.

```python
from orionis.support.facades import DB

query = DB.table("products").whereBetween("price", [10, 100])
```

<a id="api-wherenotbetween"></a>

### `whereNotBetween()`

```text
whereNotBetween(column: str, bounds: Iterable[Any]) -> Self
```

Añade NOT BETWEEN con dos límites inclusivos.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `bounds` | Iterable de exactamente dos límites, inferior y superior, incluidos por BETWEEN. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Una cantidad distinta de dos límites produce InvalidQueryException al construir la cláusula.

```python
from orionis.support.facades import DB

query = DB.table("products").whereNotBetween("price", [10, 100])
```

<a id="api-wherelike"></a>

### `whereLike()`

```text
whereLike(column: str, pattern: str) -> Self
```

Añade el patrón LIKE. % y _ mantienen su significado de comodines.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `pattern` | Patrón del operador LIKE/ILIKE o de expresión regular del motor; se enlaza como valor. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

La sensibilidad a mayúsculas depende del operador, dialecto y collation. El compilador adapta ILIKE mediante SQLAlchemy; no promete idéntica collation entre motores.

```python
from orionis.support.facades import DB

query = DB.table("products").whereLike("name", "%orionis%")
```

<a id="api-wherenotlike"></a>

### `whereNotLike()`

```text
whereNotLike(column: str, pattern: str) -> Self
```

Añade el patrón NOT LIKE. % y _ mantienen su significado de comodines.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `pattern` | Patrón del operador LIKE/ILIKE o de expresión regular del motor; se enlaza como valor. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

La sensibilidad a mayúsculas depende del operador, dialecto y collation. El compilador adapta ILIKE mediante SQLAlchemy; no promete idéntica collation entre motores.

```python
from orionis.support.facades import DB

query = DB.table("products").whereNotLike("name", "%orionis%")
```

<a id="api-whereilike"></a>

### `whereILike()`

```text
whereILike(column: str, pattern: str) -> Self
```

Añade el patrón ILIKE. % y _ mantienen su significado de comodines.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `pattern` | Patrón del operador LIKE/ILIKE o de expresión regular del motor; se enlaza como valor. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

La sensibilidad a mayúsculas depende del operador, dialecto y collation. El compilador adapta ILIKE mediante SQLAlchemy; no promete idéntica collation entre motores.

```python
from orionis.support.facades import DB

query = DB.table("products").whereILike("name", "%orionis%")
```

<a id="api-wherenotilike"></a>

### `whereNotILike()`

```text
whereNotILike(column: str, pattern: str) -> Self
```

Añade el patrón NOT ILIKE. % y _ mantienen su significado de comodines.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `pattern` | Patrón del operador LIKE/ILIKE o de expresión regular del motor; se enlaza como valor. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

La sensibilidad a mayúsculas depende del operador, dialecto y collation. El compilador adapta ILIKE mediante SQLAlchemy; no promete idéntica collation entre motores.

```python
from orionis.support.facades import DB

query = DB.table("products").whereNotILike("name", "%orionis%")
```

<a id="api-wherestartswith"></a>

### `whereStartsWith()`

```text
whereStartsWith(column: str, value: str) -> Self
```

Busca texto que empieza por el valor literal; el compilador usa LIKE con el prefijo/sufijo correspondiente.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `value` | Valor de la opción o texto literal del filtro. Los límites/offsets deben ser enteros no negativos y no bool. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

No se activa autoescape: los caracteres % y _ dentro del valor conservan semántica de comodín.

```python
from orionis.support.facades import DB

query = DB.table("products").whereStartsWith("name", "Orionis")
```

<a id="api-whereendswith"></a>

### `whereEndsWith()`

```text
whereEndsWith(column: str, value: str) -> Self
```

Busca texto que termina en el valor literal; el compilador usa LIKE con el prefijo/sufijo correspondiente.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `value` | Valor de la opción o texto literal del filtro. Los límites/offsets deben ser enteros no negativos y no bool. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

No se activa autoescape: los caracteres % y _ dentro del valor conservan semántica de comodín.

```python
from orionis.support.facades import DB

query = DB.table("products").whereEndsWith("name", "kit")
```

<a id="api-wherecontains"></a>

### `whereContains()`

```text
whereContains(column: str, value: str) -> Self
```

Busca texto que contiene el valor literal; el compilador usa LIKE con el prefijo/sufijo correspondiente.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `value` | Valor de la opción o texto literal del filtro. Los límites/offsets deben ser enteros no negativos y no bool. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

No se activa autoescape: los caracteres % y _ dentro del valor conservan semántica de comodín.

```python
from orionis.support.facades import DB

query = DB.table("products").whereContains("name", "pro")
```

<a id="api-whereregexpmatch"></a>

### `whereRegexpMatch()`

```text
whereRegexpMatch(column: str, pattern: str) -> Self
```

Busca coincidencia de expresión regular usando la operación regexp_match del dialecto.

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `pattern` | Patrón del operador LIKE/ILIKE o de expresión regular del motor; se enlaza como valor. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El lenguaje regex y su disponibilidad dependen del motor. Una expresión compilable no garantiza soporte del servidor.

```python
from orionis.support.facades import DB

query = DB.table("products").whereRegexpMatch("name", "^Orionis")
```

<a id="api-wherecolumn"></a>

### `whereColumn()`

```text
whereColumn(first: str, operator: str, second: str) -> Self
```

Compara dos referencias de columna con AND; el segundo operando no es un valor enlazado.

| Parámetro | Uso |
| --- | --- |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El operador se valida contra SUPPORTED_OPERATORS; los nombres de columnas deben proceder de la aplicación.

```python
from orionis.support.facades import DB

query = DB.table("products").whereColumn("stock", ">=", "reserved")
```

<a id="api-orwherecolumn"></a>

### `orWhereColumn()`

```text
orWhereColumn(first: str, operator: str, second: str) -> Self
```

Compara dos referencias de columna con OR; el segundo operando no es un valor enlazado.

| Parámetro | Uso |
| --- | --- |
| `first` | Columna izquierda del ON, o callback síncrono que recibe JoinClause. |
| `operator` | Operador de comparación. En condiciones básicas se valida contra SUPPORTED_OPERATORS. |
| `second` | Referencia de columna derecha, no un valor de usuario. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El operador se valida contra SUPPORTED_OPERATORS; los nombres de columnas deben proceder de la aplicación.

```python
from orionis.support.facades import DB

query = DB.table("products").orWhereColumn("stock", ">=", "reserved")
```

<a id="api-whereraw"></a>

### `whereRaw()`

```text
whereRaw(sql: str, bindings: dict[str, Any] | None=None) -> Self
```

Añade una expresión SQL confiable con AND, manteniendo separados los parámetros nombrados.

| Parámetro | Uso |
| --- | --- |
| `sql` | Fragmento SQL escrito por el desarrollador; los valores variables se pasan mediante bindings. |
| `bindings` | Diccionario de parámetros nombrados :nombre. None equivale a no añadir bindings. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El builder copia el diccionario de bindings. La sintaxis SQL del fragmento sigue siendo responsabilidad del desarrollador.

```python
from orionis.support.facades import DB

query = DB.table("products").whereRaw("price >= :minimum", {"minimum": 10})
```

<a id="api-orwhereraw"></a>

### `orWhereRaw()`

```text
orWhereRaw(sql: str, bindings: dict[str, Any] | None=None) -> Self
```

Añade una expresión SQL confiable con OR, manteniendo separados los parámetros nombrados.

| Parámetro | Uso |
| --- | --- |
| `sql` | Fragmento SQL escrito por el desarrollador; los valores variables se pasan mediante bindings. |
| `bindings` | Diccionario de parámetros nombrados :nombre. None equivale a no añadir bindings. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

El builder copia el diccionario de bindings. La sintaxis SQL del fragmento sigue siendo responsabilidad del desarrollador.

```python
from orionis.support.facades import DB

query = DB.table("products").orWhereRaw("price >= :minimum", {"minimum": 10})
```

<a id="api-having"></a>

### `having()`

```text
having(column: Any, *args: Any) -> Self
```

Añade un filtro posterior al agrupamiento con AND. Comparte las formas de llamada de where().

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `args` | Un valor para igualdad o dos argumentos (operador, valor). Las formas dict y callback no necesitan estos argumentos. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Un callback recoge sus condiciones where en un grupo HAVING; no añade una subconsulta.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").groupBy("category_id").having("category_id", ">", 0)
```

<a id="api-orhaving"></a>

### `orHaving()`

```text
orHaving(column: Any, *args: Any) -> Self
```

Añade un filtro posterior al agrupamiento con OR. Comparte las formas de llamada de where().

| Parámetro | Uso |
| --- | --- |
| `column` | Columna de la operación; en where/having también admite un dict de igualdades o un callback de agrupación. |
| `args` | Un valor para igualdad o dos argumentos (operador, valor). Las formas dict y callback no necesitan estos argumentos. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Un callback recoge sus condiciones where en un grupo HAVING; no añade una subconsulta.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").groupBy("category_id").orHaving("category_id", ">", 0)
```

<a id="api-havingraw"></a>

### `havingRaw()`

```text
havingRaw(sql: str, bindings: dict[str, Any] | None=None) -> Self
```

Añade una condición HAVING con SQL confiable y bindings nombrados; se combina mediante AND.

| Parámetro | Uso |
| --- | --- |
| `sql` | Fragmento SQL escrito por el desarrollador; los valores variables se pasan mediante bindings. |
| `bindings` | Diccionario de parámetros nombrados :nombre. None equivale a no añadir bindings. |

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

```python
from orionis.support.facades import DB

query = DB.table("products").select("category_id").groupBy("category_id").havingRaw("COUNT(*) > :minimum", {"minimum": 1})
```

[Fachada DB](/es/database/db-facade) · [Consultas ORM](/es/database/orm/querying) · [Escenario de pruebas](/es/database/orm/testing)
