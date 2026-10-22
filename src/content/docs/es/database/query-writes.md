---
title: "Escrituras y bloqueos"
description: "Inserta y modifica conjuntos de filas, interpreta InsertResult y controla el alcance real de filtros y bloqueos."
editUrl: true
lastUpdated: false
---

Las escrituras de un builder son operaciones sobre conjuntos de filas. Devuelven `InsertResult` o recuentos, y no equivalen a crear o guardar cada instancia de un [modelo](/es/database/orm/model-api).

`update()` y `delete()` construyen planes que contienen la tabla y sus `where`. No trasladan joins, orden, límites ni offset a esos planes. Un `limit(1).delete()` **no limita el borrado a una fila**. El plan también omite el alias de tabla: un WHERE calificado con ese alias puede fallar al escribir; usa la columna de la tabla destino sin alias. Selecciona explícitamente una clave o conjunto de claves en `where` para delimitar la escritura.

```python
from orionis.support.facades import DB

async def change_product_price(product_id: int, price: int) -> int:
    async with DB.transaction():
        return await DB.table("products").where("id", product_id).update({"price": price})
```

En tablas crudas no se aplican casts, timestamps, eliminación lógica, scopes ni eventos del modelo. El builder de modelos serializa dict/list/UUID para almacenamiento según el tipo de columna y `update()` añade su timestamp de actualización cuando corresponde. No ejecuta los casts de asignación de `Model.casts`, ni mutadores, `fillable` o eventos por instancia. `insert()` no aplica los scopes del modelo ni añade timestamps de creación automáticamente.

Cada escritura aislada se confirma según el ciclo de conexión. Para que varias formen una unidad usa [transacciones](/es/database/transactions). Un row lock expresa una petición al motor, no un mecanismo de bloqueo portátil para cualquier driver. SQL Server compila UPDATE como WITH(UPDLOCK,ROWLOCK) y SHARE como WITH(HOLDLOCK,ROWLOCK).

## Referencia por operación

<a id="api-lockforupdate"></a>

### `lockForUpdate()`

```text
lockForUpdate() -> Self
```

Solicita el modo de bloqueo UPDATE para un SELECT. No comienza una transacción.

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Redshift rechaza estos row locks con QueryException. SQLite omite FOR UPDATE y no aporta un bloqueo de fila. En motores compatibles, úsalo dentro de una transacción del mismo task.

```python
from orionis.support.facades import DB

query = DB.table("products").where("id", 1).lockForUpdate()
```

<a id="api-sharedlock"></a>

### `sharedLock()`

```text
sharedLock() -> Self
```

Solicita el modo de bloqueo SHARE para un SELECT. No comienza una transacción.

**Resultado:** el mismo builder mutable (`Self`); no ejecuta SQL.

Redshift rechaza estos row locks con QueryException. SQLite omite FOR UPDATE y no aporta un bloqueo de fila. En motores compatibles, úsalo dentro de una transacción del mismo task.

```python
from orionis.support.facades import DB

query = DB.table("products").where("id", 1).sharedLock()
```

<a id="api-insert"></a>

### `insert()`

```text
async insert(values: dict[str, Any] | list[dict[str, Any]]) -> InsertResult
```

Inserta un dict o una lista de dicts y devuelve InsertResult(last_insert_id, row_count). No aplica el filtro where ni genera modelos.

| Parámetro | Uso |
| --- | --- |
| `values` | Valores que se insertan/actualizan, o iterable/subconsulta en los filtros de pertenencia; consulta el comportamiento de esta operación. |

**Resultado:** `InsertResult`.

Una lista vacía produce InvalidQueryException. La clave generada depende del driver; una inserción múltiple no devuelve una lista de IDs. Model.query().insert() serializa dict/list/UUID según el tipo de columna, sin ejecutar Model.casts, save(), eventos, fillable o mutadores.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").insert({"name": "Orionis kit", "price": 20, "stock": 5, "reserved": 0, "active": True, "category_id": 1})
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-update"></a>

### `update()`

```text
async update(values: dict[str, Any]) -> int
```

Actualiza el conjunto de filas coincidentes y devuelve su recuento. Un dict vacío produce InvalidQueryException.

| Parámetro | Uso |
| --- | --- |
| `values` | Valores que se insertan/actualizan, o iterable/subconsulta en los filtros de pertenencia; consulta el comportamiento de esta operación. |

**Resultado:** `int`.

Sin where puede actualizar toda la tabla. El plan de escritura conserva los WHERE, no JOIN/ORDER/LIMIT/OFFSET. En modelos aplica scopes, visibilidad de eliminados y serialización de almacenamiento, sin Model.casts, fillable, mutadores ni eventos por instancia. Añade updated_at si corresponde y no está en values; un valor explícito, incluso None, se conserva.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("id", 1).update({"price": 25})
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

<a id="api-delete"></a>

### `delete()`

```text
async delete() -> int
```

Elimina físicamente las filas coincidentes de una tabla cruda y devuelve el recuento.

**Resultado:** `int`.

Sin where puede borrar toda la tabla; limit/offset no limitan el plan DELETE. El builder de modelos con SoftDeletes tiene su implementación específica; consulta eliminación lógica.

```python
from orionis.support.facades import DB

async def run_example():
    return await DB.table("products").where("id", 1).delete()
```

**Errores:** `QueryException` si la compilación o ejecución falla; la capa de conexión sanea el mensaje y suprime la causa encadenada del driver.

[Fachada DB](/es/database/db-facade) · [Consultas ORM](/es/database/orm/querying) · [Escenario de pruebas](/es/database/orm/testing)
