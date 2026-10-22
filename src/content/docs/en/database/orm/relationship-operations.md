---
title: "Querying and modifying relationships"
description: "Querying and modifying relationships in Orionis Framework."
editUrl: true
lastUpdated: false
---

<a id="relation-python-protocol"></a>

Examples use the models and tables from [defining relationships](/en/database/orm/relationships). `team`, `player` and `tag` represent persisted instances; import their classes from application modules. Every relationship method call creates a new builder.

## Queries and related-record writes

```python
async def roster(team_id: int):
    team = await Team.findOrFail(team_id)
    players = await team.players().where("name", "like", "A%").orderBy("id").get()
    count = await team.players().count()
    return {"team": team.toDict(), "players": players.serialize(), "count": count}
```

Relations inherit the [fluent builder API](/en/database/orm/querying): filters, projections, sorting, aggregates and pagination. `get()` returns a collection even for `hasOne`; use `getResults()`/`await relation` for natural cardinality. `await team.players()` delegates to `getResults()` and queries rather than automatically reading the eager-loading cache.

`where(...).update(...)` and `delete()` affect related records without individual lifecycles. For an inverse, `player.team().delete()` deletes the team: change `player.team_id` and save to unlink instead. These relations have no `saveMany`, `createMany`, `associate`, `withPivot` or `updateExistingPivot` methods.

Inherited `insert(values)` also targets the related table and returns `InsertResult`, but **does not supply the FK or add pivot rows**. Use `hasOne/hasMany.create` for linked children; for many-to-many, create the model first and then call `attach`. A filtered read does not turn INSERT into an association operation.

## Creating through hasOne and hasMany


<a id="hasoneormanyrelation-create"></a>

### `create`

```text
async def create(self, attributes: dict[str, Any]) -> TRelated
```

Only `hasOne`/`hasMany`: copies `attributes`, replaces the FK with the parent key and calls `Related.create`. The FK must also be fillable. Returns a model even when a listener vetoes `save`. An unsaved parent is not automatically persisted: save the parent first. Additional read filters are not copied into the payload.

```python
async def recruit(team: Team):
    return await team.players().create({"name": "Ada"})
```

## Loaded results


<a id="relationsmixin-setrelation"></a>

### `setRelation`

```text
def setRelation(self, name: str, value: Any) -> Model
```

Stores a resolved result under `name` and returns the same model. Does not query or validate `value` type. Replaces any earlier value, including with `None`.

```python
from orionis.orm import Collection

team.setRelation("players", Collection())
```

<a id="relationsmixin-getrelation"></a>

### `getRelation`

```text
def getRelation(self, name: str, default: Any=None) -> Any
```

Reads a loaded result without SQL; returns `default=None` when absent. Loaded `None` differs from not loaded: check `relationLoaded`.

```python
players = team.getRelation("players")
```

<a id="relationsmixin-relationloaded"></a>

### `relationLoaded`

```text
def relationLoaded(self, name: str) -> bool
```

Checks presence in the local store even for `None` or an empty collection. Another query/write does not automatically invalidate this cache.

```python
if team.relationLoaded("players"):
    cached_players = team.getRelation("players")
```

Loaded relations are not automatically part of `model.toDict()`. Build an explicit response:

```python
async def team_details(team_id: int):
    team = await Team.withRelations("players").findOrFail(team_id)
    return {**team.toDict(), "players": team.getRelation("players").serialize()}
```

## Many-to-many operations

Persist parents and related records before linking them. SQL, FK and UNIQUE errors propagate as query errors. Define pivot uniqueness, validate ids and use a [transaction](/en/database/transactions) on the same connection when several steps must be atomic. `sync` and `toggle` neither supply atomicity themselves nor coordinate concurrent writers.


<a id="belongstomanyrelation-getresults"></a>

### `getResults`

```text
async def getResults(self) -> Collection
```

Equivalent to `get`: returns a `Collection` of related models. Parents without a key or links produce an empty collection.

```python
async def related_tags(team: Team):
    return await team.tags().getResults()
```

<a id="belongstomanyrelation-clone"></a>

### `clone`

```text
def clone(self) -> Self
```

Returns a copy with an independent plan and pivot-filter list and its own preparation lock. Does not clone the parent or related models.

```python
relation = team.tags().wherePivot("featured", 1)
copy = relation.clone()
```

<a id="belongstomanyrelation-get"></a>

### `get`

```text
async def get(self) -> Collection
```

Resolves the pivot then selects models, returning `Collection`. First pivot resolution is reused by that builder until its pivot filters or links change through it. Use a new relationship to observe external changes.

```python
async def tags_ordered(team: Team):
    return await team.tags().orderBy("name").get()
```

<a id="belongstomanyrelation-first"></a>

### `first`

```text
async def first(self) -> TRelated | None
```

Resolves pivot and returns the first model or `None`. Specify ordering for a deterministic first result.

```python
async def first_tag(team: Team):
    return await team.tags().orderBy("id").first()
```

<a id="belongstomanyrelation-update"></a>

### `update`

```text
async def update(self, values: dict[str, Any]) -> int
```

Updates **related records**, not pivot attributes; returns an affected count. Honors filters and resolved membership, without per-instance events. Propagates `QueryException`.

```python
async def rename_tag(team: Team, tag_id: int) -> int:
    return await team.tags().where("id", tag_id).update({"name": "Featured"})
```

<a id="belongstomanyrelation-delete"></a>

### `delete`

```text
async def delete(self) -> int
```

Deletes/soft deletes related records according to their model without automatically unlinking pivot rows. Returns a count. Unlike `detach`; SQL FKs may reject deletion or apply configured actions.

```python
async def delete_tag_records(team: Team, tag_id: int) -> int:
    return await team.tags().where("id", tag_id).delete()
```

<a id="belongstomanyrelation-forcedelete"></a>

### `forceDelete`

```text
async def forceDelete(self) -> int
```

Physically deletes related records including soft-deleted ones, constrained by pivot membership. Returns a count without instance events. SQL constraints still apply.

```python
async def permanently_delete_tag(team: Team, tag_id: int) -> int:
    return await team.tags().where("id", tag_id).forceDelete()
```

<a id="belongstomanyrelation-exists"></a>

### `exists`

```text
async def exists(self) -> bool
```

Resolves pivot and returns whether a related row exists. A pivot row alone is insufficient if the related model fails its scopes/soft deletion visibility.

```python
async def has_tags(team: Team) -> bool:
    return await team.tags().exists()
```

<a id="belongstomanyrelation-wherepivot"></a>

### `wherePivot`

```text
def wherePivot(self, column: str, *args: Any) -> BelongsToManyRelation[TRelated]
```

Adds a pivot-column filter: `(column, value)` or `(column, operator, value)`. Returns the same relation and invalidates previous resolution. Affects reads/membership, **not** `attach`, `detach`, `sync` or `toggle`; those mutate by parent and ids.

```python
async def featured_tags(team: Team):
    return await team.tags().wherePivot("featured", 1).get()
```

<a id="belongstomanyrelation-attach"></a>

### `attach`

```text
async def attach(self, ids: Any, attributes: dict[str, Any] | None=None) -> int
```

Inserts links and returns the pivot row count. `ids` accepts an identity, model, iterable of either, or identity/model→extra-dict mapping. `attributes=None` supplies common extras when `ids` is not a mapping. Does not create models or check duplicates/persisted parent. Extras are merged after keys; never put linking keys in extras.

```python
async def add_tag(team: Team, tag: Tag) -> int:
    return await team.tags().attach(tag, attributes={"featured": 1})
```

<a id="belongstomanyrelation-detach"></a>

### `detach`

```text
async def detach(self, ids: Any=None) -> int
```

Deletes pivot rows for the parent and supplied ids; `ids=None` removes all its links and an empty list returns `0`. Accepts an identity/model/iterable. Returns a count and preserves related models.

```python
async def unlink_tag(team: Team, tag_id: int) -> int:
    return await team.tags().detach(tag_id)
```

<a id="belongstomanyrelation-sync"></a>

### `sync`

```text
async def sync(self, ids: Iterable[Any]) -> dict[str, list[Any]]
```

Leaves exactly the supplied iterable of ids/models: reads existing links, removes extras and inserts missing ones. Returns `{"attached": [...], "detached": [...]}` sorted by text representation. Does not update pivot extras or open a transaction; an empty list unlinks everything.

```python
async def replace_tags(team: Team, tag_ids: list[int]):
    return await team.tags().sync(tag_ids)
```

<a id="belongstomanyrelation-toggle"></a>

### `toggle`

```text
async def toggle(self, ids: Iterable[Any]) -> dict[str, list[Any]]
```

Toggles supplied ids/models and returns `attached`/`detached`. Lists preserve input order; repeated inputs are not deduplicated. No transaction is opened; avoid duplicates and enforce pivot uniqueness.

```python
async def toggle_tags(team: Team, tag_ids: list[int]):
    return await team.tags().toggle(tag_ids)
```

## Advanced relationship protocol

Applications normally use the previous methods. This reference covers the public protocol for implementing/adapting relationships and understanding the eager loader; it does not require manual controller calls. `Relation` is awaitable through `__await__`, delegating to `getResults()`; base template methods raise `NotImplementedError`.


<a id="relation---init--"></a>

### `__init__`

```text
def __init__(self, parent: Model, related: type[TRelated]) -> None
```

Infrastructure constructor; normally use `hasOne`/`hasMany`/`belongsTo`/`belongsToMany` to supply defaults. `parent` is an instance and `related` a class; key arguments without defaults in this signature must be supplied as a name or `None`. Do not instantiate base `Relation`: its template operations raise `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
```

<a id="relation-addconstraints"></a>

### `addConstraints`

```text
def addConstraints(self) -> None
```

Adds the current parent restriction, automatically during ordinary construction. Null keys force empty results; many-to-many captures keys and defers pivot SQL. Do not repeat it on an already constrained relation. The base raises `NotImplementedError`.

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

Prepares membership for the whole batch using distinct nonnull keys. Does not issue SQL; records whether keys exist and adds IN (or captures pivot keys). Used by eager loading, not on a relationship already limited to one parent. The base raises `NotImplementedError`.

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

Executes the query with natural cardinality: HasOne/BelongsTo return a model or `None`; HasMany returns `Collection`. A null key produces absence without SQL. The base `Relation` implementation raises `NotImplementedError`; use a concrete kind.

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

Returns a `Collection` for the prepared batch, skipping SQL when no keys exist; otherwise reuses `get`. Does not assign results to parents by itself.

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

Groups/assigns results through `setRelation(name, value)` and returns `None`. One-to-one/inverse store a model or `None`; one-to-many/many-to-many store `Collection`. HasOne chooses the first match; BelongsTo uses the owner key; ManyToMany uses its resolved pivot map. The base raises `NotImplementedError`.

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

Class method running a synchronous zero-argument callback to build a relationship without its individual parent filter. Restores the setting in `finally` using isolated `ContextVar` state. Advanced eager loader tool: querying it without later restrictions can read all related records.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
```

<a id="hasoneormanyrelation---init--"></a>

### `__init__`

```text
def __init__(self, parent: Model, related: type[TRelated], foreign_key: str | None, local_key: str | None) -> None
```

Infrastructure constructor; normally use `hasOne`/`hasMany`/`belongsTo`/`belongsToMany` to supply defaults. `parent` is an instance and `related` a class; key arguments without defaults in this signature must be supplied as a name or `None`. Do not instantiate base `Relation`: its template operations raise `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.players)
```

<a id="hasoneormanyrelation-addconstraints"></a>

### `addConstraints`

```text
def addConstraints(self) -> None
```

Adds the current parent restriction, automatically during ordinary construction. Null keys force empty results; many-to-many captures keys and defers pivot SQL. Do not repeat it on an already constrained relation. The base raises `NotImplementedError`.

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

Prepares membership for the whole batch using distinct nonnull keys. Does not issue SQL; records whether keys exist and adds IN (or captures pivot keys). Used by eager loading, not on a relationship already limited to one parent. The base raises `NotImplementedError`.

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

Executes the query with natural cardinality: HasOne/BelongsTo return a model or `None`; HasMany returns `Collection`. A null key produces absence without SQL. The base `Relation` implementation raises `NotImplementedError`; use a concrete kind.

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

Groups/assigns results through `setRelation(name, value)` and returns `None`. One-to-one/inverse store a model or `None`; one-to-many/many-to-many store `Collection`. HasOne chooses the first match; BelongsTo uses the owner key; ManyToMany uses its resolved pivot map. The base raises `NotImplementedError`.

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

Executes the query with natural cardinality: HasOne/BelongsTo return a model or `None`; HasMany returns `Collection`. A null key produces absence without SQL. The base `Relation` implementation raises `NotImplementedError`; use a concrete kind.

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

Groups/assigns results through `setRelation(name, value)` and returns `None`. One-to-one/inverse store a model or `None`; one-to-many/many-to-many store `Collection`. HasOne chooses the first match; BelongsTo uses the owner key; ManyToMany uses its resolved pivot map. The base raises `NotImplementedError`.

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

Infrastructure constructor; normally use `hasOne`/`hasMany`/`belongsTo`/`belongsToMany` to supply defaults. `parent` is an instance and `related` a class; key arguments without defaults in this signature must be supplied as a name or `None`. Do not instantiate base `Relation`: its template operations raise `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(player.team)
```

<a id="belongstorelation-addconstraints"></a>

### `addConstraints`

```text
def addConstraints(self) -> None
```

Adds the current parent restriction, automatically during ordinary construction. Null keys force empty results; many-to-many captures keys and defers pivot SQL. Do not repeat it on an already constrained relation. The base raises `NotImplementedError`.

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

Prepares membership for the whole batch using distinct nonnull keys. Does not issue SQL; records whether keys exist and adds IN (or captures pivot keys). Used by eager loading, not on a relationship already limited to one parent. The base raises `NotImplementedError`.

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

Executes the query with natural cardinality: HasOne/BelongsTo return a model or `None`; HasMany returns `Collection`. A null key produces absence without SQL. The base `Relation` implementation raises `NotImplementedError`; use a concrete kind.

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

Groups/assigns results through `setRelation(name, value)` and returns `None`. One-to-one/inverse store a model or `None`; one-to-many/many-to-many store `Collection`. HasOne chooses the first match; BelongsTo uses the owner key; ManyToMany uses its resolved pivot map. The base raises `NotImplementedError`.

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

Infrastructure constructor; normally use `hasOne`/`hasMany`/`belongsTo`/`belongsToMany` to supply defaults. `parent` is an instance and `related` a class; key arguments without defaults in this signature must be supplied as a name or `None`. Do not instantiate base `Relation`: its template operations raise `NotImplementedError`.

```python
from orionis.orm import Relation

relation = Relation.noConstraints(team.tags)
```

<a id="belongstomanyrelation-addconstraints"></a>

### `addConstraints`

```text
def addConstraints(self) -> None
```

Adds the current parent restriction, automatically during ordinary construction. Null keys force empty results; many-to-many captures keys and defers pivot SQL. Do not repeat it on an already constrained relation. The base raises `NotImplementedError`.

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

Prepares membership for the whole batch using distinct nonnull keys. Does not issue SQL; records whether keys exist and adds IN (or captures pivot keys). Used by eager loading, not on a relationship already limited to one parent. The base raises `NotImplementedError`.

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

Groups/assigns results through `setRelation(name, value)` and returns `None`. One-to-one/inverse store a model or `None`; one-to-many/many-to-many store `Collection`. HasOne chooses the first match; BelongsTo uses the owner key; ManyToMany uses its resolved pivot map. The base raises `NotImplementedError`.

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
