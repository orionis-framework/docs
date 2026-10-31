---
title: "Fachada DB"
description: "Los once métodos públicos del gateway DB: firmas, parámetros, resultados, errores y ejemplos."
editUrl: true
lastUpdated: false
---

`DB` resuelve `orionis.orm.contracts.query_builder.IQueryBuilder`, implementado por `QueryBuilder`. Es un gateway singleton sin estado de consulta: `connection()` devuelve otro gateway y `table()` crea un builder nuevo. No es `ConnectionManager`.

Esta página documenta todos sus métodos propios. Los métodos encadenables de `table()` pertenecen al [constructor de consultas](/es/database/query-builder). Los exclusivos de `IConnection` se documentan en [runtime](/es/database/runtime-api#connection).

```python
from orionis.support.facades import DB
```

## Selección de conexión y tabla

### connection()

```text
def connection(self, name: str | None = None) -> Self:
```

Devuelve otro `QueryBuilder` para el nombre seleccionado; `None` vuelve a la selección predeterminada. No muta el original, no abre una conexión física y no valida aún su existencia. La resolución posterior produce `ConnectionNotFoundException` para nombres desconocidos.

La prioridad de SQL y transacciones es: argumento `name` de la operación → nombre del gateway → conexión de migración activa → predeterminado del gestor. Una cadena vacía se trata como ausencia.

```python
async def reporting_notes():
    reporting = DB.connection("reporting")
    return await reporting.table("notes").orderBy("id").get()
```

### table()

```text
def table(self, name: str, *, alias: str | None = None,
          connection: str | None = None) -> IRawQueryBuilder:
```

`name` es la tabla lógica obligatoria: acepta `"products"` o `"sales.products"` para una tabla dentro de un esquema. El prefijo se aplica al nombre de tabla al compilar, conservando el esquema. `alias` es un alias SQL y `connection` sobrescribe el nombre del gateway para ese builder. Sin selección explícita se fija el nombre de la migración activa o el predeterminado **al construir**, no al ejecutar.

Por ejemplo, `DB.connection("reporting").table("sales.products", alias="p")` selecciona una conexión registrada, una tabla del esquema `sales` y el alias `p`. Las columnas se referencian como `p.id`. Consulta la [guía de consultas con esquemas](/es/database/query-builder) para ejecutar la cadena completa.

Devuelve un `RawQueryBuilder` nuevo sin E/S. Una tabla inexistente falla al ejecutar; identificadores/cláusulas inválidos pueden fallar al construir o compilar. `get()` produce una `Collection` de diccionarios y `first()` un diccionario o `None`.

```python
async def recent_notes():
    return await (
        DB.table("notes", alias="n", connection="sqlite")
        .select("n.id", "n.body")
        .orderBy("n.id", "desc")
        .limit(10)
        .get()
    )
```

### getDefaultName()

```text
def getDefaultName(self) -> str:
```

Devuelve el predeterminado global del gestor, incluso desde un gateway seleccionado con `connection("reporting")`; no necesariamente el destino de ese gateway.

```python
def default_name() -> str:
    return DB.getDefaultName()
```

### setDefaultName()

```text
def setDefaultName(self, name: str) -> None:
```

Cambia el predeterminado global a un nombre registrado o lanza `ConnectionNotFoundException`. No devuelve gateway ni redirige builders ya construidos. Úsalo al configurar la aplicación: cambiarlo por petición afecta a consumidores concurrentes.

```python
def choose_default() -> None:
    DB.setDefaultName("sqlite")
    assert DB.getDefaultName() == "sqlite"
```

## SQL parametrizado

### select()

```text
async def select(self, sql: str, bindings: dict[str, object] | None = None,
                 name: str | None = None) -> list[dict[str, object]]:
```

Materializa todas las filas como diccionarios por nombre/alias de columna; sin coincidencias devuelve `[]`. No devuelve cursor ni modelos.

`sql` es obligatorio; `bindings=None` permite proporcionar un diccionario de valores y `name=None` seleccionar la conexión. Son métodos async: ejecución/compilación SQL puede producir `QueryException`; resolución y arranque pueden producir `ConnectionNotFoundException`, `UnsupportedDriverException` o `MissingDatabaseDependencyException`. El SQL crudo no añade prefijos ni casts de modelos. Consulta [SQL y resultados](/es/database/raw-queries).

```python
async def find_by_body(body: str):
    return await DB.select(
        "SELECT id, body FROM notes WHERE body = :body", {"body": body}
    )
```

### execute()

```text
async def execute(self, sql: str, bindings: dict[str, object] | None = None,
                 name: str | None = None) -> int:
```

Devuelve el `rowcount` del driver, no una clave generada. Puede contar filas coincidentes en vez de valores modificados; un `-1` del driver se conserva.

`sql` es obligatorio; `bindings=None` permite proporcionar un diccionario de valores y `name=None` seleccionar la conexión. Son métodos async: ejecución/compilación SQL puede producir `QueryException`; resolución y arranque pueden producir `ConnectionNotFoundException`, `UnsupportedDriverException` o `MissingDatabaseDependencyException`. El SQL crudo no añade prefijos ni casts de modelos. Consulta [SQL y resultados](/es/database/raw-queries).

```python
async def rename_note(note_id: int, body: str) -> int:
    return await DB.execute(
        "UPDATE notes SET body = :body WHERE id = :id",
        {"body": body, "id": note_id},
    )
```

### statement()

```text
async def statement(self, sql: str, bindings: dict[str, object] | None = None,
                 name: str | None = None) -> bool:
```

Ejecuta DDL o mantenimiento y descarta el resultado. Devuelve `True` tras ejecución y limpieza correctas; no informa filas afectadas.

`sql` es obligatorio; `bindings=None` permite proporcionar un diccionario de valores y `name=None` seleccionar la conexión. Son métodos async: ejecución/compilación SQL puede producir `QueryException`; resolución y arranque pueden producir `ConnectionNotFoundException`, `UnsupportedDriverException` o `MissingDatabaseDependencyException`. El SQL crudo no añade prefijos ni casts de modelos. Consulta [SQL y resultados](/es/database/raw-queries).

```python
async def ensure_audit_table() -> bool:
    return await DB.statement(
        "CREATE TABLE IF NOT EXISTS audit_log (message TEXT NOT NULL)"
    )
```

## Control de transacciones

### transaction()

```text
def transaction(self, name: str | None = None) -> ITransaction:
```

Devuelve un contexto todavía no iniciado. Al entrar abre transacción/savepoint; al salir confirma si no escapa excepción y revierte si escapa. `as transaction` entrega el contexto, no una conexión. No suprime excepciones.

`name=None` sigue la selección del gateway; mantén el mismo nombre en toda la unidad. Fallos de control, anidamiento no soportado o uso desde otra tarea producen `TransactionException`. Fallos SQL internos producen `QueryException`. Redshift no permite anidamiento.

```python
async def record_note(body: str) -> None:
    async with DB.transaction():
        await DB.execute("INSERT INTO notes (body) VALUES (:body)", {"body": body})
        await DB.execute(
            "INSERT INTO audit_log (message) VALUES (:message)",
            {"message": "note created"},
        )
```

### beginTransaction()

```text
async def beginTransaction(self, name: str | None = None) -> None:
```

Inicia el primer nivel o un savepoint en la tarea actual. Volver de tu método no confirma automáticamente: todos los niveles deben cerrarse. Prefiere contextos.

`name=None` sigue la selección del gateway; mantén el mismo nombre en toda la unidad. Fallos de control, anidamiento no soportado o uso desde otra tarea producen `TransactionException`. Fallos SQL internos producen `QueryException`. Redshift no permite anidamiento.

```python
async def manual_insert(body: str) -> None:
    await DB.beginTransaction()
    try:
        await DB.execute("INSERT INTO notes (body) VALUES (:body)", {"body": body})
    except BaseException:
        await DB.rollback()
        raise
    else:
        await DB.commit()
```

### commit()

```text
async def commit(self, name: str | None = None) -> None:
```

Confirma sólo el nivel interno. Un savepoint confirmado sigue dependiendo del commit exterior; sólo al finalizar el último nivel se libera la conexión. Sin nivel activo lanza `TransactionException`.

`name=None` sigue la selección del gateway; mantén el mismo nombre en toda la unidad. Fallos de control, anidamiento no soportado o uso desde otra tarea producen `TransactionException`. Fallos SQL internos producen `QueryException`. Redshift no permite anidamiento.

```python
async def confirmed_insert(body: str) -> None:
    await DB.beginTransaction()
    try:
        await DB.execute("INSERT INTO notes (body) VALUES (:body)", {"body": body})
    except BaseException:
        await DB.rollback()
        raise
    else:
        await DB.commit()
```

### rollback()

```text
async def rollback(self, name: str | None = None) -> None:
```

Revierte sólo el nivel interno; en el nivel raíz descarta cambios y libera el recurso. No revierte un commit ya completado. Sin nivel activo produce `TransactionException`.

`name=None` sigue la selección del gateway; mantén el mismo nombre en toda la unidad. Fallos de control, anidamiento no soportado o uso desde otra tarea producen `TransactionException`. Fallos SQL internos producen `QueryException`. Redshift no permite anidamiento.

```python
async def preview_insert(body: str) -> None:
    await DB.beginTransaction()
    try:
        await DB.execute("INSERT INTO notes (body) VALUES (:body)", {"body": body})
    finally:
        await DB.rollback()
```

La [guía de transacciones](/es/database/transactions) explica cancelación y concurrencia. `DB` no expone `disconnect()`, `inTransaction()`, `scalar()` ni `raw()`: cierre/estado pertenecen a `IConnectionManager`/`IConnection`; utiliza builder o SQL para agregaciones.

## Inyección y construcción

### DB

La clase de fachada implementa `getFacadeAccessor(cls) -> type` como método de clase: `DB.getFacadeAccessor()` devuelve `IQueryBuilder`. Es metadato de resolución, no una consulta. Hereda `async resolve(*args, **kwargs) -> object`, `async pin() -> None` y `unpin() -> None` de la infraestructura de fachadas: resuelven el servicio de una aplicación ya arrancada, lo conservan para despacho o eliminan esa referencia. El provider los gestiona durante el arranque; no los uses para seleccionar tablas, cerrar conexiones o cambiar credenciales por petición.

### QueryBuilder

```python
from orionis.http import JSONResponse
from orionis.orm.contracts.query_builder import IQueryBuilder


class NoteController:
    def __init__(self, db: IQueryBuilder) -> None:
        self.db = db

    async def index(self) -> JSONResponse:
        return JSONResponse({"notes": (await self.db.table("notes").limit(20).get()).all()})

    async def show(self, note_id: int, db: IQueryBuilder) -> JSONResponse:
        return JSONResponse({"note": await db.table("notes").where("id", note_id).first()})
```

El contenedor admite constructor y método. La construcción explícita es `QueryBuilder(db_manager: IConnectionManager, connection_name: str | None = None)`; no es necesaria en controladores. Los builders utilizan el resolver instalado en el arranque del provider ORM.
