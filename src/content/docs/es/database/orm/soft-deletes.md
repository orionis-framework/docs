---
title: "Eliminación lógica"
description: "Eliminación lógica en Orionis Framework."
editUrl: true
lastUpdated: false
---

El borrado lógico conserva la fila y escribe una fecha de eliminación. Actívalo con **ambos** `soft_deletes = True` y una columna de fecha declarada, normalmente `deleted_at`. Utiliza el `Document` completo de [scopes](/es/database/orm/scopes), que ya incluye esa configuración.

## Columna, identidad y SQL

`DELETED_AT = "removed_at"` cambia el nombre esperado; declara esa columna y migra la tabla. En columnas inline el metaclass normaliza la marca a nullable; una `table_definition` compartida con marca no anulable se rechaza con `OrmConfigurationException`. El flag sin columna no activa borrado lógico: la eliminación sería física.

```python
async def archive_document(document_id: int):
    document = await Document.findOrFail(document_id)
    if not await document.delete():
        raise ValueError("Deletion was rejected")
    return document.trashed()
```

`delete()` escribe la fecha UTC y mantiene el timestamp de actualización cuando está declarado; la instancia conserva identidad y estado persistido. Las consultas de modelo añaden `deleted_at IS NULL` por defecto. `DB.table("documents")` no incorpora ese filtro.

## API de instancia


<a id="softdeletesmixin-trashed"></a>

### `trashed`

```text
def trashed(self) -> bool
```

Comprueba la marca de borrado en memoria, devolviendo bool; si el modelo no tiene columna activa devuelve `False`. No consulta SQL ni prueba existencia de la fila.

```python
is_deleted = document.trashed()
```

<a id="softdeletesmixin-restore"></a>

### `restore`

```text
async def restore(self) -> bool
```

Instancia: si no tiene columna de borrado o no está persistida, retorna `False`. Ejecuta `restoring`, asigna `None`, usa el UPDATE de diferencias y emite `restored`; un veto devuelve `False`. No dispara `saving/updating/saved`. Puede retornar `True` si ya estaba restaurada y no hay cambios.

```python
async def restore_document(document_id: int) -> bool:
    document = await Document.withTrashed().findOrFail(document_id)
    return await document.restore()
```

<a id="softdeletesmixin-forcedelete"></a>

### `forceDelete`

```text
async def forceDelete(self) -> bool
```

Instancia: ejecuta `deleting`, elimina físicamente por PK original y emite `deleted`, incluso para modelos sin soft deletes. Retorna bool; instancia nueva/veto devuelve `False`. No existe un evento separado `forceDeleted`.

```python
async def permanently_remove(document_id: int) -> bool:
    document = await Document.withTrashed().findOrFail(document_id)
    return await document.forceDelete()
```

## Visibilidad y operaciones masivas


<a id="modelquerybuilder-withtrashed"></a>

### `withTrashed`

```text
def withTrashed(self) -> Self
```

Incluye filas vivas y eliminadas en este builder; retorna el mismo builder. No desactiva otros scopes. Configura antes de ejecutar.

```python
async def every_document():
    return await Document.withTrashed().get()
```

<a id="modelquerybuilder-onlytrashed"></a>

### `onlyTrashed`

```text
def onlyTrashed(self) -> Self
```

Añade visibilidad de solo filas con marca no nula al ejecutar. Sin una columna de soft delete activa no introduce ese filtro.

```python
async def deleted_documents():
    return await Document.onlyTrashed().get()
```

<a id="modelquerybuilder-withouttrashed"></a>

### `withoutTrashed`

```text
def withoutTrashed(self) -> Self
```

Restablece el modo de exclusión (predeterminado) antes de ejecutar; no elimina filtros ya materializados en un builder usado.

```python
async def live_documents():
    return await Document.withTrashed().withoutTrashed().get()
```

<a id="modelquerybuilder-restore"></a>

### `restore`

```text
async def restore(self) -> int
```

Builder: sin columna de borrado retorna `0`; de otro modo restringe a eliminados y actualiza la marca a `None`. Devuelve recuento sin `restoring/restored` por fila. Usa un builder nuevo para esta operación.

```python
async def restore_tenant(tenant_id: int) -> int:
    return await Document.where("tenant_id", tenant_id).restore()
```

<a id="modelquerybuilder-forcedelete"></a>

### `forceDelete`

```text
async def forceDelete(self) -> int
```

Builder: incluye también eliminados y envía DELETE permanente con sus filtros/scopes; retorna recuento. No dispara eventos ni elimina vínculos o hijos por lógica ORM.

```python
async def purge_tenant(tenant_id: int) -> int:
    return await Document.where("tenant_id", tenant_id).forceDelete()
```

<a id="modelquerybuilder-delete"></a>

### `delete`

```text
async def delete(self) -> int
```

Builder: con soft delete actualiza la marca y timestamp de actualización; sin él envía DELETE. Retorna recuento; no hidrata ni ejecuta listeners individuales.

```python
async def archive_tenant(tenant_id: int) -> int:
    return await Document.where("tenant_id", tenant_id).delete()
```

## Relaciones, eventos y casos límite

Las relaciones consultan el modelo relacionado con su visibilidad habitual. Para incluir eliminados utiliza su builder (`team.players().withTrashed()` si Player tiene soft deletes) o define una variante directa de relación para eager loading. Borrar lógicamente un padre no borra sus hijos ni dispara cascadas SQL porque es UPDATE, no DELETE.

Los eventos de instancia son `deleting → deleted` o `restoring → restored`. No se emiten eventos separados para “soft deleted” ni `saving/updating` en estas operaciones. Un veto detiene la escritura; excepciones se propagan. Los métodos masivos no ejecutan estos listeners.

Una restricción UNIQUE sigue viendo filas eliminadas: archivar no libera un correo/nombre único en SQL. Restaurar puede colisionar con restricciones según el esquema. `trashed()` solo refleja memoria y no comprueba si otro escritor ya restauró o purgó la fila. Un borrado físico marca esa instancia como no persistida; guardarla después puede intentar un INSERT nuevo. Para tareas de limpieza permanentes filtra deliberadamente y usa transacciones cuando haya varios cambios relacionados.
