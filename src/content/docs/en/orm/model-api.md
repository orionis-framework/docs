---
title: "Model persistence and state"
description: "Model persistence and state in Orionis Framework."
editUrl: true
lastUpdated: false
---

This reference uses `Article` from [models and attributes](/en/orm/models-and-attributes), after its table is migrated and the application booted. Fragments with `article` assume an instance of that class; SQL access appears in async functions suitable for controllers or services.

## Class, instance and builder methods

`Article.query()` and delegated entries such as `Article.where(...)` create queries. `Article.create(...)` belongs to the class; `article.update(...)` and `article.delete()` belong to an instance. `Article.query().update(...)` and `.delete()` are mass writes returning counts, without assignment policy or per-row events. `Article.update(...)` is not a static update entry: use `query()` explicitly.

```python
from orionis.http import JSONResponse
from app.models.article import Article


class ArticleController:
    async def rename(self, article_id: int) -> JSONResponse:
        article = await Article.findOrFail(article_id)
        original_title = article.getOriginal("title")
        article.title = "Updated title"
        if not await article.save():
            return JSONResponse({"error": "Update rejected"}, status_code=409)
        return JSONResponse({"before": original_title, "article": article.toDict()})
```

This changes the title to a known value. Use an [input schema](/en/validation) for client-provided values. Route parameters are typed controller arguments.

## Construction, retrieval and persistence


<a id="model---init--"></a>

### `__init__`

```text
def __init__(self, attributes: dict[str, Any] | None=None) -> None
```

Builds an unsaved instance. `attributes=None` assigns nothing; a dict uses `fill` and may raise `MassAssignmentException` or cast errors. It neither queries SQL nor fills column defaults.

```python
article = Article({"title": "  First article  ", "status": "draft"})
```

<a id="model-query"></a>

### `query`

```text
def query(cls) -> ModelQueryBuilder[Any]
```

Synchronous class method: creates a fresh `ModelQueryBuilder` for the model table and connection without querying yet. Use a separate builder for each concurrent task.

```python
query = Article.query().where("published", True)
```

<a id="model-getconnection"></a>

### `getConnection`

```text
def getConnection(cls) -> IConnection
```

Resolves `IConnection` from `connection`. This is not a builder. Propagates `OrmConfigurationException` before bootstrap and `ConnectionNotFoundException` for unknown names.

```python
connection = Article.getConnection()
assert connection is not None
```

<a id="model-all"></a>

### `all`

```text
async def all(cls) -> Collection
```

Async class method: returns a possibly empty `Collection` of models, honoring scopes and soft deletes. It hydrates every result; filter or paginate large tables.

```python
async def list_articles():
    return (await Article.all()).serialize()
```

<a id="model-find"></a>

### `find`

```text
async def find(cls, key: Any) -> Model | None
```

Looks up a scalar identity with default filters and returns a model or `None`. A list is not a multiple-identity lookup API; use `whereIn` instead.

```python
async def optional_article(article_id: int):
    article = await Article.find(article_id)
    return article.toDict() if article is not None else None
```

<a id="model-findorfail"></a>

### `findOrFail`

```text
async def findOrFail(cls, key: Any) -> Model
```

Like `find`, but absence raises `ModelNotFoundException`. SQL, configuration and cast failures remain independent errors.

```python
async def require_article(article_id: int):
    return await Article.findOrFail(article_id)
```

<a id="model-first"></a>

### `first`

```text
async def first(cls) -> Model | None
```

Returns the first model or `None`. Without `orderBy`, which row comes first is unspecified; use `Article.orderBy(...).first()` when ordering matters.

```python
async def first_article():
    return await Article.first()
```

<a id="model-firstorfail"></a>

### `firstOrFail`

```text
async def firstOrFail(cls) -> Model
```

No-argument class variant raising `ModelNotFoundException` if no row exists. Chain the builder variant to apply filters.

```python
async def require_any_article():
    return await Article.firstOrFail()
```

<a id="model-create"></a>

### `create`

```text
async def create(cls, attributes: dict[str, Any]) -> Model
```

Constructs, mass assigns and calls `save`; returns the model. Important: it returns that instance even when a listener vetoes `save`. To require a successful write, construct the instance and check the `save` boolean. SQL defaults are not reloaded.

```python
async def create_article():
    return await Article.create({"title": "Guide", "status": "draft", "published": False})
```

<a id="model-destroy"></a>

### `destroy`

```text
async def destroy(cls, *keys: Any) -> int
```

Mass deletion by identities; no keys returns `0`. Returns the affected row count, honors scopes/soft deletes and does not hydrate or run per-instance events.

```python
async def delete_articles(ids: list[int]) -> int:
    return await Article.destroy(*ids)
```

<a id="model-save"></a>

### `save`

```text
async def save(self) -> bool
```

Inserts a new instance; otherwise updates only differences against the original snapshot. Returns `False` for a before-event veto or an UPDATE matching no row, and `True` for insertion, update or no changes. Maintains declared timestamps. SQL/listener errors propagate; no transaction wraps the whole lifecycle.

```python
async def persist_article():
    article = Article({"title": "Guide", "status": "draft", "published": False})
    if not await article.save():
        raise ValueError("The article was not saved")
    return article
```

<a id="model-update"></a>

### `update`

```text
async def update(self, attributes: dict[str, Any]) -> bool
```

Instance method: applies `fill(attributes)` then `save`. Returns a boolean, unlike `builder.update`, which returns a count. Assignment can be partial if a later key fails.

```python
async def publish(article: Article) -> bool:
    return await article.update({"status": "published", "published": True})
```

<a id="model-delete"></a>

### `delete`

```text
async def delete(self) -> bool
```

Returns `False` for an unsaved instance or a `deleting` veto. Targets its original identity; soft deletion stamps the delete column. Physical deletion marks the instance unsaved even when SQL matched no row; other instances and loaded relationships are not automatically synchronized.

```python
async def remove_article(article_id: int) -> bool:
    article = await Article.findOrFail(article_id)
    return await article.delete()
```

<a id="model-freshtimestamp"></a>

### `freshTimestamp`

```text
def freshTimestamp(cls) -> datetime
```

Generates UTC. Returns a naive datetime when the first available update, creation or deletion column does not declare `timezone=True`; without any such column it returns aware UTC. May be overridden as a classmethod.

```python
timestamp = Article.freshTimestamp()
```

<a id="model-newuniqueid"></a>

### `newUniqueId`

```text
def newUniqueId(cls) -> Any
```

Generates `uuid.uuid4()`; used automatically only with `uuids=True` and a missing insertion identity. Override the classmethod for another policy; it does not query database uniqueness.

```python
identity = Article.newUniqueId()
```

## Attributes and serialization


<a id="attributesmixin-fill"></a>

### `fill`

```text
def fill(self, attributes: dict[str, Any]) -> Any
```

Assigns each declared, permitted key in order and returns the same instance. A nonempty `fillable` overrides `guarded`; both empty allow every column. Unknown/disallowed keys raise `MassAssignmentException`. An error does not undo earlier assignments.

```python
article.fill({"title": "Updated title", "status": "draft"})
```

<a id="attributesmixin-setattribute"></a>

### `setAttribute`

```text
def setAttribute(self, key: str, value: Any) -> None
```

Assigns without checking `fillable` or column membership; runs a mutator then cast when present. Returns `None`. Use trusted data: an arbitrary key can later reach SQL and fail.

```python
article.setAttribute("title", "  Trimmed title  ")
assert article.title == "Trimmed title"
```

<a id="attributesmixin-getattribute"></a>

### `getAttribute`

```text
def getAttribute(self, key: str, default: Any=None) -> Any
```

Reads the value or `default=None`, applying its accessor when present. An accessor also receives the default when the value is absent. Does not query the database or load relationships.

```python
title = article.getAttribute("title", "Untitled")
label = article.getAttribute("label")
```

<a id="attributesmixin-hasaccessor"></a>

### `hasAccessor`

```text
def hasAccessor(self, key: str) -> bool
```

Returns whether a `get<Name>Attribute` method is registered for the key; does not execute the calculation.

```python
assert article.hasAccessor("label") is True
```

<a id="attributesmixin-todict"></a>

### `toDict`

```text
def toDict(self) -> dict[str, Any]
```

Returns a dict of currently loaded attributes with accessors, `hidden` and `appends`. Preserves Python values such as datetime/UUID. **Does not include relationships stored with `setRelation`**; serialize them explicitly.

```python
visible = article.toDict()
assert "internal_token" not in visible
```

<a id="attributesmixin-serialize"></a>

### `serialize`

```text
def serialize(self) -> dict[str, Any]
```

Functional alias of `toDict`, used by `Collection.serialize` and `Paginator.toDict`. Returns a dict honoring hidden attributes; does not automatically include relationships.

```python
data = article.serialize()
assert data == article.toDict()
```

<a id="attributesmixin-tojson"></a>

### `toJson`

```text
def toJson(self, **kwargs: Any) -> str
```

Calls `json.dumps(toDict(), **kwargs)`, supplying `default=str` when omitted. Returns JSON text; kwargs may trigger standard serialization errors.

```python
text = article.toJson(ensure_ascii=False, indent=2)
```

<a id="attributesmixin-only"></a>

### `only`

```text
def only(self, *keys: str) -> dict[str, Any]
```

Returns existing requested keys from the **raw** attribute store. Does not run accessors or apply `hidden`/`appends`. May expose secrets: select from `toDict()` for public output.

```python
raw_title = article.only("title", "status")
public_title = {k: v for k, v in article.toDict().items() if k in {"title", "label"}}
```

<a id="attributesmixin-exclude"></a>

### `exclude`

```text
def exclude(self, *keys: str) -> dict[str, Any]
```

Returns raw attributes except named keys. This is not safe serialization: it does not apply `hidden` or accessors or add computed attributes.

```python
internal_data = article.exclude("internal_token")
```

## Original state and changes

`getAttribute()`, `toDict()`, `only()` and `exclude()` do not deep-copy nested values. If an attribute contains a dict/list, changing that value can change entity state; make an explicit copy when transforming a separate representation. Snapshots returned by `getOriginal()` and `getChanges()` are deep copies.


<a id="statemixin-getdirty"></a>

### `getDirty`

```text
def getDirty(self) -> dict[str, Any]
```

Returns current values differing from the snapshot, including newly assigned keys whose value is `None`. Python equality detects nested dict/list changes because the original was deep-copied. Does not issue SQL.

```python
pending = article.getDirty()
```

<a id="statemixin-isdirty"></a>

### `isDirty`

```text
def isDirty(self, *attributes: str) -> bool
```

Without names checks any change; with `*attributes` reports whether at least one changed. An unloaded key is not treated as changed.

```python
article.title = "Changed"
assert article.isDirty("title")
```

<a id="statemixin-isclean"></a>

### `isClean`

```text
def isClean(self, *attributes: str) -> bool
```

Negates `isDirty` for the same names. It does not guarantee that the database still contains those values after concurrent writes.

```python
clean = article.isClean("published", "status")
```

<a id="statemixin-waschanged"></a>

### `wasChanged`

```text
def wasChanged(self, *attributes: str) -> bool
```

Checks keys recorded by the last successful persistence, not pending changes. Without names checks any recorded change. A no-change `save` clears it; failures or vetoes do not necessarily replace an older record.

```python
async def rename(article: Article):
    saved = await article.update({"title": "New title"})
    return saved, article.wasChanged("title")
```

<a id="statemixin-getchanges"></a>

### `getChanges`

```text
def getChanges(self) -> dict[str, Any]
```

Returns a deep copy of changes recorded by the last successful INSERT/UPDATE. Includes identity and timestamps when written.

```python
changes = article.getChanges()
```

<a id="statemixin-getoriginal"></a>

### `getOriginal`

```text
def getOriginal(self, key: str | None=None, default: Any=None) -> Any
```

Without `key` returns a deep copy of the whole snapshot; with a key returns its deep-copied value or `default=None`. Does not retrieve the current database version.

```python
before = article.getOriginal("title", "Untitled")
original = article.getOriginal()
```

<a id="statemixin-syncoriginal"></a>

### `syncOriginal`

```text
def syncOriginal(self) -> Any
```

Replaces the original snapshot with current values and returns the same instance, **without persistence** and without clearing `getChanges`. Advanced use: calling it before saving hides those changes from the next UPDATE.

```python
snapshot_only = Article({"title": "Baseline"})
snapshot_only.syncOriginal()
assert snapshot_only.isClean()
```

## Model builder retrieval terminals

These methods preserve filters, scopes and soft deletion visibility. SQL queries may raise `QueryException`. See the [shared query language](/en/orm/querying) for filters and writes, and [pagination](/en/orm/collections-and-pagination) for `paginate`.


<a id="modelquerybuilder-get"></a>

### `get`

```text
async def get(self) -> Collection
```

Executes the plan, hydrates each row with casts, fires `retrieved` in order, then loads requested relationships. Returns `Collection`; propagates `QueryException`, cast/listener errors and `RelationNotFoundException`.

```python
async def published_articles():
    return await Article.where("published", True).orderBy("id").get()
```

<a id="modelquerybuilder-first"></a>

### `first`

```text
async def first(self) -> TModel | None
```

Executes a copy of the plan with limit 1 and returns a model or `None`; the original limit is unchanged. Runs retrieved/eager loading when a row exists.

```python
async def oldest_article():
    return await Article.orderBy("id").first()
```

<a id="modelquerybuilder-firstorfail"></a>

### `firstOrFail`

```text
async def firstOrFail(self) -> TModel
```

Like `first`, raising `ModelNotFoundException` for absence.

```python
async def require_published():
    return await Article.where("published", True).firstOrFail()
```

<a id="modelquerybuilder-find"></a>

### `find`

```text
async def find(self, key: Any) -> TModel | None
```

Adds a primary-key condition to the same builder then calls `first`; preserves previous filters and returns a model or `None`. Reusing it with another identity accumulates conditions.

```python
async def find_published(article_id: int):
    return await Article.where("published", True).find(article_id)
```

<a id="modelquerybuilder-findorfail"></a>

### `findOrFail`

```text
async def findOrFail(self, key: Any) -> TModel
```

Like `find`, raising `ModelNotFoundException` when absent. Accepts one required scalar identity.

```python
async def require_published_id(article_id: int):
    return await Article.where("published", True).findOrFail(article_id)
```

<a id="modelquerybuilder-value"></a>

### `value`

```text
async def value(self, column: str) -> Any
```

Projects one column on a clone, retrieves a model and returns its attribute (with accessor when present) or `None`. The result alone cannot distinguish an absent row from a null value.

```python
async def title_of(article_id: int):
    return await Article.where("id", article_id).value("title")
```

<a id="modelquerybuilder-pluck"></a>

### `pluck`

```text
async def pluck(self, column: str) -> Collection
```

Projects a column on a clone and returns a `Collection` of values, preserving `None`. Runs hydration/retrieved. Retain needed keys when combining projections and relationships; this does not accept Collection.pluck's second `key` argument.

```python
async def all_titles():
    return (await Article.orderBy("id").pluck("title")).all()
```

<a id="modelquerybuilder-clone"></a>

### `clone`

```text
def clone(self) -> Self
```

Clones the builder with an independent plan and eager-loading list. Model class and connection remain the same; it does not turn an executed query into a database snapshot.

```python
base = Article.where("published", True)
first_page = base.clone().limit(10)
assert first_page is not base
```

<a id="model-metadata-fields"></a>

<a id="model-python-protocol"></a>

## Metadata and advanced integration

`__meta__` is `None` for abstract models. Concrete models have `ModelMetadata` containing `table_name`, `table`, `columns`, `primary_key`, `casts`, `cast_lookup`, `fillable`, `guarded`, `hidden`, `timestamps`, `incrementing`, `connection`, `created_column`, `updated_column`, `deleted_column`, `uses_unique_ids`, `accessors`, `mutators`, `appends`, `scopes`, `global_scopes` and `events`. This is compiled class metadata; declare ordinary options on the class rather than mutating internal registries per request.



<a id="modelmetadata-isfillable"></a>

### `isFillable`

```text
def isFillable(self, key: str) -> bool
```

Inspects compiled assignment policy without assigning; a nonempty `fillable` has priority. A `True` result alone does not confirm column existence; `fill` checks both.

```python
assert Article.__meta__.isFillable("title")
```

<a id="modelmetadata-applycasts"></a>

### `applyCasts`

```text
def applyCasts(self, attributes: dict[str, Any]) -> dict[str, Any]
```

Applies casts to the supplied dict **in place** and returns it. An advanced hydration operation; does not run mutators, assignment policy or validation. Conversion errors propagate.

```python
raw = {"published": "yes"}
assert Article.__meta__.applyCasts(raw) is raw
assert raw["published"] is True
```

<a id="connectionresolver-setmanager"></a>

### `setManager`

```text
def setManager(cls, manager: IConnectionManager) -> None
```

Installs an application-wide `IConnectionManager` for ORM consumers. The provider performs this during bootstrap; isolated tests can supply their own manager. Do not change this global registry per request.

```python
from orionis.orm import ConnectionResolver

manager = ConnectionResolver.manager()
ConnectionResolver.setManager(manager)
```

<a id="connectionresolver-manager"></a>

### `manager`

```text
def manager(cls) -> IConnectionManager
```

Returns the installed manager or raises `OrmConfigurationException`.

```python
from orionis.orm import ConnectionResolver

manager = ConnectionResolver.manager()
```

<a id="connectionresolver-connection"></a>

### `connection`

```text
def connection(cls, name: str | None=None) -> IConnection
```

Returns a named or default connection. With `name=None`, an active migration context supplies its connection; an explicit name takes precedence. Manager/configuration errors propagate.

```python
from orionis.orm import ConnectionResolver

connection = ConnectionResolver.connection()
```

<a id="connectionresolver-clear"></a>

### `clear`

```text
def clear(cls) -> None
```

Clears the bridge for test isolation; does not close manager connections and leaves future queries unconfigured until reinstallation.

```python
from orionis.orm import ConnectionResolver

manager = ConnectionResolver.manager()
try:
    ConnectionResolver.clear()
finally:
    ConnectionResolver.setManager(manager)
```

## Persistence boundaries

There are no instance `refresh()`/`fresh()` methods or public `exists` property here. Query again to check existence, or use the write boolean and identity. Partial projection does not populate the rest of an entity: do not persist values you merely assumed were loaded. Instance update/delete targets the original PK directly without reapplying global scopes or version checks. There is no implicit optimistic locking. Discard or retrieve an object again after errors or rollback when it must reflect database state.

A no-change `save()` still runs `saving`, `updating`, `updated`, `saved`, but sends no UPDATE. When SQL affects zero rows, after-events still execute even though the boolean is `False`. See [events](/en/orm/events).

<a id="orm-exceptions"></a>

## Public exceptions

`OrmException` is the base. `OrmConfigurationException` denotes wiring/configuration; `MassAssignmentException`, disallowed assignment; `ModelNotFoundException`, OrFail absence; `InvalidQueryException`, invalid query arguments; `RelationNotFoundException`, invalid eager loading; `ScopeNotFoundException`, missing local scope. Import the last one from `orionis.orm.exceptions`; the others are also exposed by `orionis.orm`. Driver errors belong to Database (`QueryException`) rather than being converted to ModelNotFoundException.

The model protocol routes column reads/writes through attributes and repr shows class/PK. It does not provide identity-based comparison or replace SQL reloading.

## Integration helpers

These are public functions from specialized modules; applications normally use Model, its settings and the builder.

<a id="orm-helper-get-cast-handler"></a>

### `get_cast_handler`

```text
def get_cast_handler(cast: str) -> Callable[[Any], Any]
```

Returns a native cast callable, normalizing whitespace/case; unsupported names raise OrmException.

```python
from orionis.orm.attributes import get_cast_handler

assert get_cast_handler(" BOOL ")("on") is True
```

<a id="orm-helper-serialize-for-storage"></a>

### `serialize_for_storage`

```text
def serialize_for_storage(meta: ModelMetadata, values: dict[str, Any]) -> dict[str, Any]
```

Returns a values copy with dict/list or UUID converted when the target column does not store those types natively. Does not apply input casts, mutators or mass assignment.

```python
from orionis.orm.attributes import serialize_for_storage

values = serialize_for_storage(Article.__meta__, {"title": "Guide"})
```

<a id="orm-helper-snake-case"></a>

### `snake_case`

```text
def snake_case(name: str) -> str
```

Transforms CamelCase by separating each uppercase character and strips leading underscores; a simple heuristic, not an acronym parser.

```python
from orionis.orm.metaclass import snake_case

assert snake_case("UserRole") == "user_role"
```

<a id="orm-helper-pluralize"></a>

### `pluralize`

```text
def pluralize(word: str) -> str
```

Applies the English plural heuristic (consonant y→ies; s/x/z/ch/sh→es; otherwise→s), without an irregular dictionary.

```python
from orionis.orm.metaclass import pluralize

assert pluralize("category") == "categories"
```

<a id="modelquerybuilder---init--"></a>

### `ModelQueryBuilder.__init__`

```text
def __init__(self, model: type[TModel]) -> None
```

Builds a builder for a concrete model class; normally use `Article.query()`, which performs this operation. The class must have metadata rather than be abstract. No SQL executes.

```python
from orionis.orm import ModelQueryBuilder

query = ModelQueryBuilder(Article)
```
