---
title: "Local and global scopes"
description: "Local and global scopes in Orionis Framework."
editUrl: true
lastUpdated: false
---

Scopes combine reusable filters. Local scopes apply when called; global scopes are incorporated before executing every model query unless explicitly excluded. They are neither an authorization boundary nor an SQL security policy.

## Declaring and composing local scopes

```python
from orionis.orm import DateTime, Integer, Model, String


class Document(Model):
    id = Integer().primary().autoIncrement()
    title = String(180)
    status = String(30)
    tenant_id = Integer()
    deleted_at = DateTime().nullable()
    timestamps = False
    soft_deletes = True
    fillable = ["title", "status", "tenant_id"]

    @staticmethod
    def scopePublished(query):
        query.where("status", "published")

    @classmethod
    def scopeForTenant(cls, query, tenant_id: int):
        query.where("tenant_id", tenant_id)


async def published_for(tenant_id: int):
    return await Document.forTenant(tenant_id).published().orderBy("id").get()
```

`scopePublished` becomes `published`; `scopeForTenant` becomes `forTenant`. The suffix must start uppercase. Declare scopes as `@staticmethod` or `@classmethod`; they receive the builder followed by custom arguments, mutate it and do not issue SQL. Their return values are not chained. Async functions are unsuitable because results are not awaited.

Conditions combine with existing clauses according to builder semantics, including OR and nested groups; explicitly group an OR that must remain inside a policy.

## Global registration and exclusions


<a id="model-addglobalscope"></a>

### `addGlobalScope`

```text
def addGlobalScope(cls, name: str, scope: Callable[[ModelQueryBuilder[Any]], None]) -> type[Model]
```

Registers/replaces a synchronous builder-mutating callback under `name`; returns the class. Affects subsequent execution for every consumer. Does not validate the callback upfront. Register once during bootstrap/provider, not per request.

```python
Document.addGlobalScope("published_only", lambda query: query.where("status", "published"))
```

<a id="model-removeglobalscope"></a>

### `removeGlobalScope`

```text
def removeGlobalScope(cls, name: str) -> type[Model]
```

Removes the named registration and returns the class; missing names are ignored. This is a global change, not a query-local exemption. It does not remove conditions already folded into an executed builder.

```python
Document.removeGlobalScope("published_only")
```

<a id="modelquerybuilder-withoutglobalscope"></a>

### `withoutGlobalScope`

```text
def withoutGlobalScope(self, name: str) -> Self
```

Marks one name to omit for this builder. Returns the same builder; unknown names are harmless. Configure before executing because already incorporated filters are not removed.

```python
async def all_statuses():
    return await Document.withoutGlobalScope("published_only").get()
```

<a id="modelquerybuilder-withoutglobalscopes"></a>

### `withoutGlobalScopes`

```text
def withoutGlobalScopes(self, *names: str) -> Self
```

With names omits those registrations; without arguments omits scopes registered at that moment. Returns the same builder. Does not automatically remove the separate soft deletion filter.

```python
query = Document.withoutGlobalScopes("published_only")
admin_query = Document.withoutGlobalScopes()
```

<a id="modelquerybuilder-scope"></a>

### `scope`

```text
def scope(self, name: str, *args: Any, **kwargs: Any) -> Self
```

Runs the named local scope with positional/keyword arguments; returns the same builder and ignores the scope return value. Missing names raise `ScopeNotFoundException`. Scopes must be synchronous; async methods are not awaited. Use this form for names colliding with builder APIs.

```python
async def tenant_documents(tenant_id: int):
    return await Document.query().scope("forTenant", tenant_id).published().get()
```

## Application timing and boundaries

The builder applies global scopes once before execution; `toPlan()` alone does not guarantee those filters have been incorporated yet. Configure exclusions before the first terminal. Use a new builder for another operation or visibility mode: reusing an executed builder does not rebuild applied filters.

Global registrations are copied from ancestors when a subclass is created. Later parent changes do not rebuild the child's copy. A relationship uses the **related model's** scopes rather than automatically inheriting the parent's tenant.

`DB.table` does not apply model scopes. INSERTs and instance PK updates do not turn read scopes into ownership validation either. In multitenant applications, validate authorization and ownership before writing and consider SQL constraints. For request-dependent values, prefer `forTenant(tenant_id)` with validated data; do not replace a global callback with a captured tenant during every concurrent request.
