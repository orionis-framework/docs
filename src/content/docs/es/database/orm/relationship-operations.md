---
title: "Consultar y modificar relaciones"
description: "Consultar y modificar relaciones en Orionis Framework."
editUrl: true
lastUpdated: false
---

<a id="relation-python-protocol"></a>

Los ejemplos usan los modelos y tablas de [definir relaciones](/es/database/orm/relationships). `team`, `player` y `tag` representan instancias persistidas; importa sus clases desde los módulos de tu aplicación. Cada invocación del método de relación crea un builder nuevo.

## Consultas y escrituras sobre relacionados

```python
async def roster(team_id: int):
    team = await Team.findOrFail(team_id)
    players = await team.players().where("name", "like", "A%").orderBy("id").get()
    count = await team.players().count()
    return {"team": team.toDict(), "players": players.serialize(), "count": count}
```

Las relaciones heredan [la API fluida del builder](/es/database/orm/querying): filtros, proyecciones, orden, agregados y paginación. `get()` devuelve colección incluso en `hasOne`; usa `getResults()`/`await relation` para su cardinalidad natural. `await team.players()` equivale a `getResults()` y ejecuta una consulta, no lee automáticamente el caché de eager loading.

`where(...).update(...)` y `delete()` afectan filas relacionadas, sin ciclo por instancia. En una inversa `player.team().delete()` borra el equipo: para desvincular cambia `player.team_id` y guarda. No hay `saveMany`, `createMany`, `associate`, `withPivot` ni `updateExistingPivot` en estas relaciones.

El `insert(values)` heredado también apunta a la tabla relacionada y devuelve `InsertResult`, pero **no rellena la FK ni añade filas pivot**. Para crear un hijo vinculado utiliza `hasOne/hasMany.create`; para muchos a muchos crea primero el modelo y después llama a `attach`. Una lectura filtrada no convierte un INSERT en una operación de asociación.

## Crear en hasOne y hasMany


<a id="hasoneormanyrelation-create"></a>

### `create`

```text
async def create(self, attributes: dict[str, Any]) -> TRelated
```

Solo `hasOne`/`hasMany`: copia `attributes`, sobrescribe la FK con la clave del padre y llama a `Related.create`. La FK también debe ser fillable. Devuelve modelo incluso si un listener veta `save`. Un padre sin clave no se guarda automáticamente: guarda primero el padre. Filtros adicionales de lectura no se copian al payload.

```python
async def recruit(team: Team):
    return await team.players().create({"name": "Ada"})
```

## Resultados cargados


<a id="relationsmixin-setrelation"></a>

### `setRelation`

```text
def setRelation(self, name: str, value: Any) -> Model
```

Guarda un resultado resuelto bajo `name` y devuelve el mismo modelo. No consulta ni valida el tipo de `value`. Sustituye el valor anterior, incluso por `None`.

```python
from orionis.orm import Collection

team.setRelation("players", Collection())
```

<a id="relationsmixin-getrelation"></a>

### `getRelation`

```text
def getRelation(self, name: str, default: Any=None) -> Any
```

Lee el resultado cargado sin SQL; si falta devuelve `default=None`. Un `None` cargado es distinto de no cargado: compruébalo con `relationLoaded`.

```python
players = team.getRelation("players")
```

<a id="relationsmixin-relationloaded"></a>

### `relationLoaded`

```text
def relationLoaded(self, name: str) -> bool
```

Comprueba presencia en el almacén local, aunque el valor sea `None` o una colección vacía. Otra consulta/escritura no invalida automáticamente este caché.

```python
if team.relationLoaded("players"):
    cached_players = team.getRelation("players")
```

Una relación cargada no forma parte automáticamente de `model.toDict()`. Construye una respuesta explícita:

```python
async def team_details(team_id: int):
    team = await Team.withRelations("players").findOrFail(team_id)
    return {**team.toDict(), "players": team.getRelation("players").serialize()}
```

## Operaciones de muchos a muchos

El padre y los relacionados deben existir antes de vincularlos. Los errores SQL, FK y UNIQUE se propagan como errores de consulta. Define unicidad pivot, valida ids y usa una [transacción](/es/database/transactions) de la misma conexión si varios pasos deben ser atómicos. `sync` y `toggle` no proporcionan atomicidad por sí solos ni coordinan escritores concurrentes.


<a id="belongstomanyrelation-getresults"></a>

### `getResults`

```text
async def getResults(self) -> Collection
```

Equivale a `get`: devuelve `Collection` de modelos relacionados. Para un padre sin clave o sin vínculos devuelve colección vacía.

```python
async def related_tags(team: Team):
    return await team.tags().getResults()
```

<a id="belongstomanyrelation-clone"></a>

### `clone`

```text
def clone(self) -> Self
```

Devuelve copia independiente del plan y lista de filtros pivot; usa un lock de preparación propio. No clona el padre ni los modelos relacionados.

```python
relation = team.tags().wherePivot("featured", 1)
copy = relation.clone()
```

<a id="belongstomanyrelation-get"></a>

### `get`

```text
async def get(self) -> Collection
```

Resuelve pivot y ejecuta SELECT de modelos; devuelve `Collection`. La primera resolución pivot se reutiliza en ese builder, hasta cambiar filtros pivot o mutar vínculos mediante él. Usa una relación nueva para observar cambios externos.

```python
async def tags_ordered(team: Team):
    return await team.tags().orderBy("name").get()
```

<a id="belongstomanyrelation-first"></a>

### `first`

```text
async def first(self) -> TRelated | None
```

Resuelve pivot y devuelve el primer modelo o `None`. Añade orden explícito si necesitas un primer resultado determinista.

```python
async def first_tag(team: Team):
    return await team.tags().orderBy("id").first()
```

<a id="belongstomanyrelation-update"></a>

### `update`

```text
async def update(self, values: dict[str, Any]) -> int
```

Actualiza **registros relacionados**, no atributos pivot; devuelve recuento. Respeta filtros y pertenencia resuelta, sin eventos por instancia. Propaga `QueryException`.

```python
async def rename_tag(team: Team, tag_id: int) -> int:
    return await team.tags().where("id", tag_id).update({"name": "Featured"})
```

<a id="belongstomanyrelation-delete"></a>

### `delete`

```text
async def delete(self) -> int
```

Elimina/borra lógicamente registros relacionados según su modelo, sin desvincular automáticamente pivot. Devuelve recuento. No equivale a `detach`; las FK SQL pueden rechazar la eliminación o ejecutar sus acciones declaradas.

```python
async def delete_tag_records(team: Team, tag_id: int) -> int:
    return await team.tags().where("id", tag_id).delete()
```

<a id="belongstomanyrelation-forcedelete"></a>

### `forceDelete`

```text
async def forceDelete(self) -> int
```

Elimina físicamente registros relacionados, incluyendo soft-deleted, según pertenencia pivot. Devuelve recuento, sin eventos de instancia. Las restricciones SQL siguen vigentes.

```python
async def permanently_delete_tag(team: Team, tag_id: int) -> int:
    return await team.tags().where("id", tag_id).forceDelete()
```

<a id="belongstomanyrelation-exists"></a>

### `exists`

```text
async def exists(self) -> bool
```

Resuelve pivot y comprueba existencia de registros relacionados, devolviendo bool. No basta con que exista una fila pivot si el modelo relacionado no pasa sus scopes/soft deletes.

```python
async def has_tags(team: Team) -> bool:
    return await team.tags().exists()
```

<a id="belongstomanyrelation-wherepivot"></a>

### `wherePivot`

```text
def wherePivot(self, column: str, *args: Any) -> BelongsToManyRelation[TRelated]
```

Añade un filtro sobre columnas pivot: `(column, value)` o `(column, operator, value)`. Retorna la misma relación e invalida su resolución anterior. Afecta lecturas/pertenencia, **no limita** `attach`, `detach`, `sync` o `toggle`; esos métodos mutan por padre e ids.

```python
async def featured_tags(team: Team):
    return await team.tags().wherePivot("featured", 1).get()
```

<a id="belongstomanyrelation-attach"></a>

### `attach`

```text
async def attach(self, ids: Any, attributes: dict[str, Any] | None=None) -> int
```

Inserta vínculos y devuelve número de filas pivot. `ids` acepta identidad, modelo, iterable de ambos o mapping identidad/modelo→dict extra. `attributes=None` aplica extras comunes cuando `ids` no es mapping. No crea modelos ni comprueba duplicados/padre persistido. Extras se mezclan después de claves; no incluyas claves de enlace en extras.

```python
async def add_tag(team: Team, tag: Tag) -> int:
    return await team.tags().attach(tag, attributes={"featured": 1})
```

<a id="belongstomanyrelation-detach"></a>

### `detach`

```text
async def detach(self, ids: Any=None) -> int
```

Elimina filas pivot para el padre y los ids indicados; `ids=None` elimina todos sus vínculos y lista vacía devuelve `0`. Acepta identidad/modelo/iterable. Devuelve recuento y conserva los modelos relacionados.

```python
async def unlink_tag(team: Team, tag_id: int) -> int:
    return await team.tags().detach(tag_id)
```

<a id="belongstomanyrelation-sync"></a>

### `sync`

```text
async def sync(self, ids: Iterable[Any]) -> dict[str, list[Any]]
```

Deja exactamente los ids/modelos del iterable: lee vínculos actuales, elimina sobrantes e inserta faltantes. Devuelve `{"attached": [...], "detached": [...]}` con listas ordenadas por representación textual. No actualiza extras pivot ni abre transacción; lista vacía desvincula todo.

```python
async def replace_tags(team: Team, tag_ids: list[int]):
    return await team.tags().sync(tag_ids)
```

<a id="belongstomanyrelation-toggle"></a>

### `toggle`

```text
async def toggle(self, ids: Iterable[Any]) -> dict[str, list[Any]]
```

Invierte los vínculos de ids/modelos del iterable y devuelve `attached`/`detached`. Las listas conservan el orden de entrada; no deduplica repetidos. No abre transacción; evita ids duplicados y usa restricción única en pivot.

```python
async def toggle_tags(team: Team, tag_ids: list[int]):
    return await team.tags().toggle(tag_ids)
```

## Protocolo avanzado de relaciones

La aplicación normalmente usa los métodos anteriores. La siguiente referencia cubre el contrato público para implementar/adaptar relaciones y entender el eager loader; no exige llamadas manuales en controladores. `Relation` es awaitable mediante `__await__`, que delega en `getResults()`; los métodos abstractos de la base lanzan `NotImplementedError`.


<a id="relation---init--"></a>

### `__init__`

```text
def __init__(self, parent: Model, related: type[TRelated]) -> None
```

Constructor de infraestructura; utiliza normalmente `hasOne`/`hasMany`/`belongsTo`/`belongsToMany` para aplicar sus valores predeterminados. `parent` es instancia y `related` clase; las claves sin default en esta firma deben pasarse explícitamente como nombre o `None`. `Relation` base no se instancia: sus operaciones abstractas lanzan `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
```

<a id="relation-addconstraints"></a>

### `addConstraints`

```text
def addConstraints(self) -> None
```

Añade el filtro del padre actual; se llama automáticamente al construir una relación normal. Para claves nulas fuerza resultado vacío; muchos a muchos captura la clave y difiere la consulta pivot. No lo repitas en una relación ya restringida. La clase base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
relation.addConstraints()
```

<a id="relation-addeagerconstraints"></a>

### `addEagerConstraints`

```text
def addEagerConstraints(self, models: list[Model]) -> None
```

Prepara pertenencia de todo el lote usando claves distintas no nulas. No ejecuta SQL; establece si el lote tiene claves y añade filtro IN (o captura claves pivot). Se usa en el protocolo de eager loading, no sobre una relación ya limitada a un solo padre. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
relation.addEagerConstraints([team])
```

<a id="relation-getresults"></a>

### `getResults`

```text
async def getResults(self) -> Any
```

Ejecuta la consulta con la cardinalidad de la relación: HasOne/BelongsTo devuelve modelo o `None`; HasMany devuelve `Collection`. Con clave nula devuelve ausencia sin consultar. La implementación base `Relation` es un contrato que lanza `NotImplementedError`; utiliza una clase concreta.

```python
from orionis.orm import Relation

async def resolve_relation(relation: Relation):
    return await relation.getResults()
```

<a id="relation-geteager"></a>

### `getEager`

```text
async def getEager(self) -> Collection
```

Devuelve `Collection` para el lote preparado, sin SQL cuando no hay claves; en otro caso reutiliza `get`. No asigna por sí solo resultados a los padres.

```python
from orionis.orm import Relation

async def load_players(teams: list[Team]):
    if not teams:
        return []
    relation = Relation.noConstraints(teams[0].players)
    relation.addEagerConstraints(teams)
    return await relation.getEager()
```

<a id="relation-match"></a>

### `match`

```text
def match(self, models: list[Model], results: Collection, name: str) -> None
```

Agrupa/asigna resultados mediante `setRelation(name, value)` y retorna `None`. Uno a uno/inversa guardan modelo o `None`; uno a muchos/muchos a muchos guardan `Collection`. HasOne toma la primera coincidencia; BelongsTo usa la clave propietaria; ManyToMany usa el mapa pivot previamente resuelto. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

async def load_related(parents: list[Team]):
    if not parents:
        return parents
    relation = Relation.noConstraints(parents[0].players)
    relation.addEagerConstraints(parents)
    results = await relation.getEager()
    relation.match(parents, results, "players")
    return parents
```

<a id="relation-noconstraints"></a>

### `noConstraints`

```text
def noConstraints(cls, callback: Callable[[], Relation[Any]]) -> Relation[Any]
```

Método de clase que ejecuta un callback síncrono sin argumentos para construir una relación sin filtro de padre individual. Restaura el ajuste mediante `finally`, aislado con `ContextVar`. Herramienta avanzada del eager loader: puede leer todos los relacionados si se ejecuta sin añadir restricciones después.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
```

<a id="hasoneormanyrelation---init--"></a>

### `__init__`

```text
def __init__(self, parent: Model, related: type[TRelated], foreign_key: str | None, local_key: str | None) -> None
```

Constructor de infraestructura; utiliza normalmente `hasOne`/`hasMany`/`belongsTo`/`belongsToMany` para aplicar sus valores predeterminados. `parent` es instancia y `related` clase; las claves sin default en esta firma deben pasarse explícitamente como nombre o `None`. `Relation` base no se instancia: sus operaciones abstractas lanzan `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
```

<a id="hasoneormanyrelation-addconstraints"></a>

### `addConstraints`

```text
def addConstraints(self) -> None
```

Añade el filtro del padre actual; se llama automáticamente al construir una relación normal. Para claves nulas fuerza resultado vacío; muchos a muchos captura la clave y difiere la consulta pivot. No lo repitas en una relación ya restringida. La clase base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
relation.addConstraints()
```

<a id="hasoneormanyrelation-addeagerconstraints"></a>

### `addEagerConstraints`

```text
def addEagerConstraints(self, models: list[Model]) -> None
```

Prepara pertenencia de todo el lote usando claves distintas no nulas. No ejecuta SQL; establece si el lote tiene claves y añade filtro IN (o captura claves pivot). Se usa en el protocolo de eager loading, no sobre una relación ya limitada a un solo padre. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
relation.addEagerConstraints([team])
```

<a id="hasonerelation-getresults"></a>

### `getResults`

```text
async def getResults(self) -> TRelated | None
```

Ejecuta la consulta con la cardinalidad de la relación: HasOne/BelongsTo devuelve modelo o `None`; HasMany devuelve `Collection`. Con clave nula devuelve ausencia sin consultar. La implementación base `Relation` es un contrato que lanza `NotImplementedError`; utiliza una clase concreta.

```python
from orionis.orm import Relation

async def resolve_relation(relation: Relation):
    return await relation.getResults()
```

<a id="hasonerelation-match"></a>

### `match`

```text
def match(self, models: list[Model], results: Collection, name: str) -> None
```

Agrupa/asigna resultados mediante `setRelation(name, value)` y retorna `None`. Uno a uno/inversa guardan modelo o `None`; uno a muchos/muchos a muchos guardan `Collection`. HasOne toma la primera coincidencia; BelongsTo usa la clave propietaria; ManyToMany usa el mapa pivot previamente resuelto. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

async def load_related(parents: list[Team]):
    if not parents:
        return parents
    relation = Relation.noConstraints(parents[0].profile)
    relation.addEagerConstraints(parents)
    results = await relation.getEager()
    relation.match(parents, results, "profile")
    return parents
```

<a id="hasmanyrelation-getresults"></a>

### `getResults`

```text
async def getResults(self) -> Collection
```

Ejecuta la consulta con la cardinalidad de la relación: HasOne/BelongsTo devuelve modelo o `None`; HasMany devuelve `Collection`. Con clave nula devuelve ausencia sin consultar. La implementación base `Relation` es un contrato que lanza `NotImplementedError`; utiliza una clase concreta.

```python
from orionis.orm import Relation

async def resolve_relation(relation: Relation):
    return await relation.getResults()
```

<a id="hasmanyrelation-match"></a>

### `match`

```text
def match(self, models: list[Model], results: Collection, name: str) -> None
```

Agrupa/asigna resultados mediante `setRelation(name, value)` y retorna `None`. Uno a uno/inversa guardan modelo o `None`; uno a muchos/muchos a muchos guardan `Collection`. HasOne toma la primera coincidencia; BelongsTo usa la clave propietaria; ManyToMany usa el mapa pivot previamente resuelto. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

async def load_related(parents: list[Team]):
    if not parents:
        return parents
    relation = Relation.noConstraints(parents[0].players)
    relation.addEagerConstraints(parents)
    results = await relation.getEager()
    relation.match(parents, results, "players")
    return parents
```

<a id="belongstorelation---init--"></a>

### `__init__`

```text
def __init__(self, parent: Model, related: type[TRelated], foreign_key: str | None, owner_key: str | None) -> None
```

Constructor de infraestructura; utiliza normalmente `hasOne`/`hasMany`/`belongsTo`/`belongsToMany` para aplicar sus valores predeterminados. `parent` es instancia y `related` clase; las claves sin default en esta firma deben pasarse explícitamente como nombre o `None`. `Relation` base no se instancia: sus operaciones abstractas lanzan `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(player.team)
```

<a id="belongstorelation-addconstraints"></a>

### `addConstraints`

```text
def addConstraints(self) -> None
```

Añade el filtro del padre actual; se llama automáticamente al construir una relación normal. Para claves nulas fuerza resultado vacío; muchos a muchos captura la clave y difiere la consulta pivot. No lo repitas en una relación ya restringida. La clase base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(player.team)
relation.addConstraints()
```

<a id="belongstorelation-addeagerconstraints"></a>

### `addEagerConstraints`

```text
def addEagerConstraints(self, models: list[Model]) -> None
```

Prepara pertenencia de todo el lote usando claves distintas no nulas. No ejecuta SQL; establece si el lote tiene claves y añade filtro IN (o captura claves pivot). Se usa en el protocolo de eager loading, no sobre una relación ya limitada a un solo padre. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(player.team)
relation.addEagerConstraints([player])
```

<a id="belongstorelation-getresults"></a>

### `getResults`

```text
async def getResults(self) -> TRelated | None
```

Ejecuta la consulta con la cardinalidad de la relación: HasOne/BelongsTo devuelve modelo o `None`; HasMany devuelve `Collection`. Con clave nula devuelve ausencia sin consultar. La implementación base `Relation` es un contrato que lanza `NotImplementedError`; utiliza una clase concreta.

```python
from orionis.orm import Relation

async def resolve_relation(relation: Relation):
    return await relation.getResults()
```

<a id="belongstorelation-match"></a>

### `match`

```text
def match(self, models: list[Model], results: Collection, name: str) -> None
```

Agrupa/asigna resultados mediante `setRelation(name, value)` y retorna `None`. Uno a uno/inversa guardan modelo o `None`; uno a muchos/muchos a muchos guardan `Collection`. HasOne toma la primera coincidencia; BelongsTo usa la clave propietaria; ManyToMany usa el mapa pivot previamente resuelto. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

async def load_related(parents: list[Player]):
    if not parents:
        return parents
    relation = Relation.noConstraints(parents[0].team)
    relation.addEagerConstraints(parents)
    results = await relation.getEager()
    relation.match(parents, results, "team")
    return parents
```

<a id="belongstomanyrelation---init--"></a>

### `__init__`

```text
def __init__(self, parent: Model, related: type[TRelated], table: str | None, foreign_pivot_key: str | None, related_pivot_key: str | None, parent_key: str | None, related_key: str | None) -> None
```

Constructor de infraestructura; utiliza normalmente `hasOne`/`hasMany`/`belongsTo`/`belongsToMany` para aplicar sus valores predeterminados. `parent` es instancia y `related` clase; las claves sin default en esta firma deben pasarse explícitamente como nombre o `None`. `Relation` base no se instancia: sus operaciones abstractas lanzan `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.tags)
```

<a id="belongstomanyrelation-addconstraints"></a>

### `addConstraints`

```text
def addConstraints(self) -> None
```

Añade el filtro del padre actual; se llama automáticamente al construir una relación normal. Para claves nulas fuerza resultado vacío; muchos a muchos captura la clave y difiere la consulta pivot. No lo repitas en una relación ya restringida. La clase base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.tags)
relation.addConstraints()
```

<a id="belongstomanyrelation-addeagerconstraints"></a>

### `addEagerConstraints`

```text
def addEagerConstraints(self, models: list[Model]) -> None
```

Prepara pertenencia de todo el lote usando claves distintas no nulas. No ejecuta SQL; establece si el lote tiene claves y añade filtro IN (o captura claves pivot). Se usa en el protocolo de eager loading, no sobre una relación ya limitada a un solo padre. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.tags)
relation.addEagerConstraints([team])
```

<a id="belongstomanyrelation-match"></a>

### `match`

```text
def match(self, models: list[Model], results: Collection, name: str) -> None
```

Agrupa/asigna resultados mediante `setRelation(name, value)` y retorna `None`. Uno a uno/inversa guardan modelo o `None`; uno a muchos/muchos a muchos guardan `Collection`. HasOne toma la primera coincidencia; BelongsTo usa la clave propietaria; ManyToMany usa el mapa pivot previamente resuelto. La base lanza `NotImplementedError`.

```python
from orionis.orm import Relation

async def load_related(parents: list[Team]):
    if not parents:
        return parents
    relation = Relation.noConstraints(parents[0].tags)
    relation.addEagerConstraints(parents)
    results = await relation.getEager()
    relation.match(parents, results, "tags")
    return parents
```
