---
title: "SQL parametrizado y resultados"
description: "Bindings, resultados materializados, filas afectadas, identidades y manejo de errores SQL."
editUrl: true
lastUpdated: false
---

`DB.select()`, `DB.execute()` y `DB.statement()` comparten conexiones y transacciones con el ORM. Utilízalos para SQL que necesite expresar directamente. Las [firmas completas](/es/database/db-facade#select) están en la referencia de DB.

## Valores enlazados

```python
from orionis.http import JSONResponse
from orionis.support.facades import DB


class NoteController:
    async def search(self, body: str) -> JSONResponse:
        rows = await DB.select(
            "SELECT id, body FROM notes WHERE body = :body ORDER BY id",
            {"body": body},
        )
        return JSONResponse({"notes": rows})

    async def update(self, note_id: int, body: str) -> JSONResponse:
        affected = await DB.execute(
            "UPDATE notes SET body = :body WHERE id = :id",
            {"body": body, "id": note_id},
        )
        return JSONResponse({"affected": affected})
```

Los marcadores `:body` y `:id` se utilizan en todos los drivers; la capa de ejecución adapta su formato. No rodees marcadores de comillas ni insertes valores externos con f-strings o concatenación. Los valores deben ser serializables por el driver; `None` representa SQL `NULL`. No se ejecutan casts ni reglas de atributos de modelos.

Los nombres de tabla/columna, direcciones de orden y palabras clave no se enlazan como valores. Selecciona identificadores de un catálogo controlado o utiliza el constructor de consultas. El SQL crudo tampoco añade `DB_PREFIX`: escribe nombres físicos completos.

## Elegir el resultado correcto

| Operación | Resultado | Qué no significa |
|---|---|---|
| `await DB.select(...)` | `list[dict]`; `[]` si no hay filas | No es cursor ni lista de modelos. |
| `await DB.execute(...)` | `int` del driver | No es la clave insertada; puede ser `-1` si el recuento es desconocido. |
| `await DB.statement(...)` | `True` tras ejecución y limpieza | No indica filas modificadas. |
| `await connection.insert(InsertPlan(...))` | `InsertResult(last_insert_id, row_count)` | No garantiza identidad en lotes ni en Redshift. |

El recuento de un update puede representar filas coincidentes, no sólo valores que cambiaron. Un resultado `0` no es una excepción.

## DDL y consultas de mantenimiento

```python
from orionis.support.facades import DB


async def prepare_demo() -> dict[str, object]:
    await DB.statement(
        "CREATE TABLE IF NOT EXISTS notes "
        "(id INTEGER PRIMARY KEY, body TEXT NOT NULL)"
    )
    affected = await DB.execute(
        "INSERT INTO notes (body) VALUES (:body)", {"body": "First note"}
    )
    rows = await DB.select("SELECT id, body FROM notes ORDER BY id")
    return {"affected": affected, "rows": rows}
```

El ejemplo de DDL utiliza SQLite. Para tablas de la aplicación utiliza [esquemas y migraciones](/es/database/schema), con tipos e identidades del motor. `statement()` no convierte una sentencia en portátil ni ofrece una API general de múltiples sentencias.

La caché LRU de 256 textos reutiliza el análisis de SQL crudo. No guarda resultados ni evita ejecutar llamadas repetidas. `select()` materializa todas las filas antes de liberar la conexión: filtra, proyecta y limita el volumen. No presupongas streaming de cursor. Los valores conservan tipos del driver; adapta fechas, decimales u otros tipos al formato externo cuando haga falta.

## Manejar errores

```python
from orionis.database import QueryException
from orionis.http import JSONResponse
from orionis.support.facades import DB


class NoteLookupController:
    async def show(self, note_id: int) -> JSONResponse:
        try:
            rows = await DB.select(
                "SELECT id, body FROM notes WHERE id = :id", {"id": note_id}
            )
        except QueryException:
            return JSONResponse({"error": "Database operation failed"}, status_code=503)
        if not rows:
            return JSONResponse({"error": "Note not found"}, status_code=404)
        return JSONResponse(rows[0])
```

Los errores SQLAlchemy se presentan como `QueryException` con nombre de conexión y tipo de error, sin SQL, bindings ni mensaje del driver. Los fallos de configuración y dependencias tienen [excepciones distintas](/es/database/runtime-api#excepciones). No expongas `configFor()` ni credenciales al cliente.

También puedes propagar el fallo al [manejador HTTP](/es/http/exceptions). Captura fuera de una transacción cuando quieras revertir toda la unidad. No hay política general de reintentos: una escritura con resultado de commit incierto necesita idempotencia antes de repetirse.
