---
title: "Scopes locales y globales"
description: "Scopes locales y globales en Orionis Framework."
editUrl: true
lastUpdated: false
---

Los scopes reúnen filtros repetidos. Un scope local se aplica cuando lo invocas; uno global se incorpora antes de ejecutar todas las consultas de ese modelo, salvo exclusión explícita. No son una frontera de autorización ni una política SQL de seguridad.

## Declarar y componer scopes locales

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

`scopePublished` se expone como `published`; `scopeForTenant` como `forTenant`. El sufijo debe empezar por mayúscula. Decláralos con `@staticmethod` o `@classmethod`; reciben el builder seguido de tus argumentos, modifican ese objeto y no ejecutan SQL. Los valores de retorno no se encadenan. Una función async no sirve como scope porque no se espera su resultado.

Las condiciones se combinan con las existentes y la semántica del builder, incluyendo OR y grupos; agrupa expresamente cuando un OR deba permanecer dentro de una política.

## Registro global y exclusiones


<a id="model-addglobalscope"></a>

### `addGlobalScope`

```text
def addGlobalScope(cls, name: str, scope: Callable[[ModelQueryBuilder[Any]], None]) -> type[Model]
```

Registra/reemplaza por `name` un callback síncrono que modifica el builder; retorna la clase. Afecta futuras ejecuciones de todos sus consumidores. No valida el callback por anticipado. Regístralo una vez durante bootstrap/provider, no por petición.

```python
Document.addGlobalScope("published_only", lambda query: query.where("status", "published"))
```

<a id="model-removeglobalscope"></a>

### `removeGlobalScope`

```text
def removeGlobalScope(cls, name: str) -> type[Model]
```

Elimina el registro por nombre y devuelve la clase; nombre ausente no falla. Es una modificación global, no una excepción local a una consulta. No retira condiciones ya aplicadas a un builder ejecutado.

```python
Document.removeGlobalScope("published_only")
```

<a id="modelquerybuilder-withoutglobalscope"></a>

### `withoutGlobalScope`

```text
def withoutGlobalScope(self, name: str) -> Self
```

Marca un nombre para omitirlo en este builder. Devuelve el mismo builder; nombres desconocidos no fallan. Debe configurarse antes de ejecutar porque los filtros ya incorporados no se retiran.

```python
async def all_statuses():
    return await Document.withoutGlobalScope("published_only").get()
```

<a id="modelquerybuilder-withoutglobalscopes"></a>

### `withoutGlobalScopes`

```text
def withoutGlobalScopes(self, *names: str) -> Self
```

Con nombres omite esos registros; sin argumentos omite los que estén registrados en ese momento. Retorna el mismo builder. No desactiva automáticamente el filtro de soft deletes, que tiene su API independiente.

```python
query = Document.withoutGlobalScopes("published_only")
admin_query = Document.withoutGlobalScopes()
```

<a id="modelquerybuilder-scope"></a>

### `scope`

```text
def scope(self, name: str, *args: Any, **kwargs: Any) -> Self
```

Ejecuta el scope local por nombre, pasando argumentos posicionales y keyword; retorna el mismo builder e ignora el retorno del scope. Nombre ausente: `ScopeNotFoundException`. Debe ser síncrono; un método async no se espera. Usa esta forma si el nombre colisiona con una API del builder.

```python
async def tenant_documents(tenant_id: int):
    return await Document.query().scope("forTenant", tenant_id).published().get()
```

## Momento de aplicación y límites

El builder aplica scopes globales una sola vez antes de ejecutar; `toPlan()` por sí solo no garantiza incluir esos filtros aún. Configura exclusiones antes del primer terminal. Usa un builder nuevo para otra operación o modo de visibilidad: reutilizar uno ya ejecutado no recompone filtros aplicados.

Los registros globales se copian de ancestros al crear una subclase. Cambiar el registro de un padre después no reconstruye la copia del hijo. Una relación usa los scopes del modelo **relacionado**, no hereda automáticamente el tenant del padre.

`DB.table` no usa scopes de modelo. Tampoco los INSERT ni las actualizaciones por PK de una instancia convierten un scope de lectura en una validación de pertenencia. En una aplicación multiempresa, valida autorización y ownership antes de escribir y considera restricciones SQL. Para valores por petición, prefiere `forTenant(tenant_id)` con el dato validado; no reemplaces un callback global con un tenant capturado durante cada petición concurrente.
