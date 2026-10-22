---
title: "Soft deletes"
description: "Soft deletes in Orionis Framework."
editUrl: true
lastUpdated: false
---

Soft deletion preserves a row and writes a deletion date. Enable **both** `soft_deletes = True` and a declared date column, normally `deleted_at`. Use the complete `Document` from [scopes](/en/database/orm/scopes), which includes that setup.

## Column, identity and SQL

`DELETED_AT = "removed_at"` changes the expected name; declare and migrate that column. Inline columns are normalized to nullable by the metaclass; a shared `table_definition` with a nonnullable stamp raises `OrmConfigurationException`. The flag alone without a column does not enable soft deletion: deletion would be physical.

```python
async def archive_document(document_id: int):
    document = await Document.findOrFail(document_id)
    if not await document.delete():
        raise ValueError("Deletion was rejected")
    return document.trashed()
```

`delete()` writes UTC and maintains the update timestamp when declared; the instance keeps its identity and persisted state. Model queries add `deleted_at IS NULL` by default. `DB.table("documents")` does not add that filter.

## Instance API


<a id="softdeletesmixin-trashed"></a>

### `trashed`

```text
def trashed(self) -> bool
```

Checks the in-memory deletion stamp and returns a bool; models without an active deletion column return `False`. Does not query SQL or prove row existence.

```python
is_deleted = document.trashed()
```

<a id="softdeletesmixin-restore"></a>

### `restore`

```text
async def restore(self) -> bool
```

Instance: returns `False` without a deletion column or persistence. Runs `restoring`, sets `None`, performs the dirty UPDATE and emits `restored`; a veto returns `False`. Does not fire `saving/updating/saved`. May return `True` when already restored with no changes.

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

Instance: runs `deleting`, physically removes by original PK and emits `deleted`, including for models without soft deletion. Returns bool; unsaved instances/veto return `False`. There is no separate `forceDeleted` event.

```python
async def permanently_remove(document_id: int) -> bool:
    document = await Document.withTrashed().findOrFail(document_id)
    return await document.forceDelete()
```

## Visibility and mass operations


<a id="modelquerybuilder-withtrashed"></a>

### `withTrashed`

```text
def withTrashed(self) -> Self
```

Includes live and deleted rows in this builder; returns the same builder. Does not disable other scopes. Configure before execution.

```python
async def every_document():
    return await Document.withTrashed().get()
```

<a id="modelquerybuilder-onlytrashed"></a>

### `onlyTrashed`

```text
def onlyTrashed(self) -> Self
```

Selects only rows with nonnull deletion stamps on execution. Without an active soft deletion column it adds no such filter.

```python
async def deleted_documents():
    return await Document.onlyTrashed().get()
```

<a id="modelquerybuilder-withouttrashed"></a>

### `withoutTrashed`

```text
def withoutTrashed(self) -> Self
```

Restores default exclusion before execution; does not remove filters already materialized in a used builder.

```python
async def live_documents():
    return await Document.withTrashed().withoutTrashed().get()
```

<a id="modelquerybuilder-restore"></a>

### `restore`

```text
async def restore(self) -> int
```

Builder: returns `0` without a deletion column; otherwise restricts to deleted rows and clears the stamp. Returns a count without per-row `restoring/restored`. Use a new builder for this operation.

```python
async def restore_tenant(tenant_id: int) -> int:
    return await Document.where("tenant_id", tenant_id).restore()
```

<a id="modelquerybuilder-forcedelete"></a>

### `forceDelete`

```text
async def forceDelete(self) -> int
```

Builder: includes deleted rows and sends permanent DELETE with filters/scopes; returns a count. No events or ORM child/link deletion are performed.

```python
async def purge_tenant(tenant_id: int) -> int:
    return await Document.where("tenant_id", tenant_id).forceDelete()
```

<a id="modelquerybuilder-delete"></a>

### `delete`

```text
async def delete(self) -> int
```

Builder: with soft deletion updates the stamp and update timestamp; otherwise sends DELETE. Returns a count; does not hydrate or dispatch individual listeners.

```python
async def archive_tenant(tenant_id: int) -> int:
    return await Document.where("tenant_id", tenant_id).delete()
```

## Relationships, events and edge cases

Relationships query related models with their ordinary visibility. Include deleted rows through the related builder (`team.players().withTrashed()` if Player enables soft deletion), or define a direct variant for eager loading. Soft deleting a parent neither deletes children nor triggers SQL deletion cascades because it is UPDATE rather than DELETE.

Instance events are `deleting → deleted` or `restoring → restored`. There are no separate “soft deleted” events or `saving/updating` emissions for these operations. Vetoes stop writes; exceptions propagate. Mass methods do not execute these listeners.

SQL UNIQUE constraints still see deleted rows: archiving does not free a unique email/name. Restoration can conflict with schema constraints. `trashed()` only reflects memory, not another writer's restore/purge. A physical deletion marks that instance unsaved; saving it afterwards may attempt a new INSERT. Filter permanent cleanup deliberately and use transactions when several related changes are involved.
