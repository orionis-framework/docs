---
title: "Persistencia y estado del modelo"
description: "Persistencia y estado del modelo en Orionis Framework."
editUrl: true
lastUpdated: false
---

Esta referencia usa `Article` de [modelos y atributos](/es/database/orm/models-and-attributes), con la tabla ya migrada y la aplicación inicializada. Los fragmentos con `article` suponen una instancia de esa clase; los accesos SQL aparecen dentro de funciones async que puedes usar en controladores o servicios.

## Diferenciar clase, instancia y builder

`Article.query()` y accesos delegados como `Article.where(...)` crean consultas. `Article.create(...)` es de clase; `article.update(...)` y `article.delete()` son de instancia. `Article.query().update(...)` y `.delete()` son escrituras masivas con recuento, sin asignación masiva ni eventos por fila. `Article.update(...)` no es una entrada estática de actualización: usa explícitamente `query()`.

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

El ejemplo cambia el título por un valor conocido. Para datos del cliente usa un [schema de entrada](/es/validation). Los parámetros de ruta son argumentos tipados del controlador.

## Construcción, consulta y persistencia


<a id="model---init--"></a>

### `__init__`

```text
def __init__(self, attributes: dict[str, Any] | None=None) -> None
```

Construye una instancia no persistida. `attributes=None` no asigna valores; un dict aplica `fill` y puede producir `MassAssignmentException` o errores de cast. No consulta SQL ni rellena defaults de columna.

```python
article = Article({"title": "  First article  ", "status": "draft"})
```

<a id="model-query"></a>

### `query`

```text
def query(cls) -> ModelQueryBuilder[Any]
```

Método de clase síncrono: crea un `ModelQueryBuilder` nuevo para la tabla y conexión del modelo, sin consultar todavía. Usa otro builder para otra tarea concurrente.

```python
query = Article.query().where("published", True)
```

<a id="model-getconnection"></a>

### `getConnection`

```text
def getConnection(cls) -> IConnection
```

Resuelve `IConnection` a partir de `connection`. No es un builder. Propaga `OrmConfigurationException` si no hubo bootstrap y `ConnectionNotFoundException` si falta el nombre.

```python
connection = Article.getConnection()
assert connection is not None
```

<a id="model-all"></a>

### `all`

```text
async def all(cls) -> Collection
```

Método de clase async: devuelve `Collection` de modelos, posiblemente vacía, con scopes y soft deletes. Hidrata todos los resultados; para tablas grandes filtra o pagina.

```python
async def list_articles():
    return (await Article.all()).serialize()
```

<a id="model-find"></a>

### `find`

```text
async def find(cls, key: Any) -> Model | None
```

Busca una identidad escalar con los filtros predeterminados y devuelve modelo o `None`. No acepta una lista como mecanismo de búsqueda múltiple; utiliza `whereIn` para eso.

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

Igual que `find`, pero la ausencia lanza `ModelNotFoundException`. SQL/configuración/casts pueden fallar de forma independiente.

```python
async def require_article(article_id: int):
    return await Article.findOrFail(article_id)
```

<a id="model-first"></a>

### `first`

```text
async def first(cls) -> Model | None
```

Devuelve el primer modelo o `None`. Sin `orderBy` no garantiza qué fila es la primera; usa `Article.orderBy(...).first()` cuando importe el orden.

```python
async def first_article():
    return await Article.first()
```

<a id="model-firstorfail"></a>

### `firstOrFail`

```text
async def firstOrFail(cls) -> Model
```

Variante de clase sin argumentos que lanza `ModelNotFoundException` si no hay fila. Para filtros encadena la variante del builder.

```python
async def require_any_article():
    return await Article.firstOrFail()
```

<a id="model-create"></a>

### `create`

```text
async def create(cls, attributes: dict[str, Any]) -> Model
```

Construye, aplica asignación masiva y ejecuta `save`; devuelve el modelo. Importante: devuelve la instancia incluso si un listener veta `save`. Si debes asegurar escritura, construye y comprueba el booleano de `save`. No recarga defaults SQL.

```python
async def create_article():
    return await Article.create({"title": "Guide", "status": "draft", "published": False})
```

<a id="model-destroy"></a>

### `destroy`

```text
async def destroy(cls, *keys: Any) -> int
```

Borrado masivo por identidades; sin claves devuelve `0`. Retorna número de filas, respeta scopes/soft deletes y no hidrata ni ejecuta eventos por instancia.

```python
async def delete_articles(ids: list[int]) -> int:
    return await Article.destroy(*ids)
```

<a id="model-save"></a>

### `save`

```text
async def save(self) -> bool
```

Inserta si la instancia es nueva; si ya existe, actualiza solo diferencias contra el original. Devuelve `False` por veto previo o UPDATE sin fila coincidente, y `True` al insertar, actualizar o no haber cambios. Mantiene timestamps declarados. Propaga errores SQL y listeners; no abre una transacción para el conjunto.

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

Método de instancia: aplica `fill(attributes)` y después `save`. Devuelve booleano, a diferencia de `builder.update`, que devuelve recuento. La asignación puede ser parcial si una clave posterior falla.

```python
async def publish(article: Article) -> bool:
    return await article.update({"status": "published", "published": True})
```

<a id="model-delete"></a>

### `delete`

```text
async def delete(self) -> bool
```

Devuelve `False` para una instancia nueva o un veto `deleting`. Borra por la identidad original; con soft delete estampa la columna. Tras eliminación física marca la instancia como no persistida, incluso si SQL no encontró fila; no sincroniza automáticamente otras instancias ni relaciones cargadas.

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

Genera UTC. Usa datetime sin timezone cuando la primera columna disponible entre actualización, creación y borrado no declara `timezone=True`; si no existe ninguna, devuelve UTC consciente. Se puede sobrescribir como classmethod.

```python
timestamp = Article.freshTimestamp()
```

<a id="model-newuniqueid"></a>

### `newUniqueId`

```text
def newUniqueId(cls) -> Any
```

Genera `uuid.uuid4()`; solo se usa automáticamente con `uuids=True` e identidad ausente al insertar. Sobrescribe el classmethod para otra política; no consulta unicidad en la base.

```python
identity = Article.newUniqueId()
```

## Atributos y serialización


<a id="attributesmixin-fill"></a>

### `fill`

```text
def fill(self, attributes: dict[str, Any]) -> Any
```

Asigna cada clave declarada y permitida, en orden, y retorna la misma instancia. `fillable` no vacía prevalece sobre `guarded`; con ambas vacías se permite cualquier columna. Clave desconocida/no permitida: `MassAssignmentException`. Un error no revierte claves anteriores.

```python
article.fill({"title": "Updated title", "status": "draft"})
```

<a id="attributesmixin-setattribute"></a>

### `setAttribute`

```text
def setAttribute(self, key: str, value: Any) -> None
```

Asigna sin comprobar `fillable` ni que la clave sea una columna; ejecuta mutador y cast cuando existan. Retorna `None`. Úsalo con datos confiables: una clave arbitraria puede llegar después a SQL y fallar.

```python
article.setAttribute("title", "  Trimmed title  ")
assert article.title == "Trimmed title"
```

<a id="attributesmixin-getattribute"></a>

### `getAttribute`

```text
def getAttribute(self, key: str, default: Any=None) -> Any
```

Lee el valor o `default=None` y aplica su accessor si existe. Un accessor también recibe el default cuando falta el valor. No consulta la base ni carga relaciones.

```python
title = article.getAttribute("title", "Untitled")
label = article.getAttribute("label")
```

<a id="attributesmixin-hasaccessor"></a>

### `hasAccessor`

```text
def hasAccessor(self, key: str) -> bool
```

Retorna si hay un método `get<Name>Attribute` registrado para la clave; no ejecuta el cálculo.

```python
assert article.hasAccessor("label") is True
```

<a id="attributesmixin-todict"></a>

### `toDict`

```text
def toDict(self) -> dict[str, Any]
```

Devuelve un dict de atributos actualmente cargados con accessors, `hidden` y `appends`. Conserva tipos Python como datetime/UUID. **No incluye relaciones guardadas con `setRelation`**; serialízalas explícitamente.

```python
visible = article.toDict()
assert "internal_token" not in visible
```

<a id="attributesmixin-serialize"></a>

### `serialize`

```text
def serialize(self) -> dict[str, Any]
```

Alias funcional de `toDict`, utilizado por `Collection.serialize` y `Paginator.toDict`. Devuelve dict y respeta ocultación; tampoco incorpora relaciones automáticamente.

```python
data = article.serialize()
assert data == article.toDict()
```

<a id="attributesmixin-tojson"></a>

### `toJson`

```text
def toJson(self, **kwargs: Any) -> str
```

Llama a `json.dumps(toDict(), **kwargs)`, añadiendo `default=str` si no se proporcionó. Devuelve texto JSON; los kwargs pueden causar errores de serialización estándar.

```python
text = article.toJson(ensure_ascii=False, indent=2)
```

<a id="attributesmixin-only"></a>

### `only`

```text
def only(self, *keys: str) -> dict[str, Any]
```

Devuelve únicamente claves existentes del almacén **crudo** de atributos. No ejecuta accessors ni aplica `hidden`/`appends`. Puede exponer secretos: para una respuesta pública selecciona desde `toDict()`.

```python
raw_title = article.only("title", "status")
public_title = {k: v for k, v in article.toDict().items() if k in {"title", "label"}}
```

<a id="attributesmixin-exclude"></a>

### `exclude`

```text
def exclude(self, *keys: str) -> dict[str, Any]
```

Devuelve los atributos crudos excepto las claves indicadas. No equivale a serialización segura: no aplica `hidden` ni accessors ni agrega calculados.

```python
internal_data = article.exclude("internal_token")
```

## Estado original y cambios

`getAttribute()`, `toDict()`, `only()` y `exclude()` no convierten los valores anidados en copias profundas. Si un atributo contiene un dict/list, modificar ese valor puede modificar el estado de la entidad; utiliza una copia explícita si vas a transformar una representación por separado. Los snapshots devueltos por `getOriginal()` y `getChanges()` sí son copias profundas.


<a id="statemixin-getdirty"></a>

### `getDirty`

```text
def getDirty(self) -> dict[str, Any]
```

Devuelve dict de valores actuales diferentes del snapshot, incluyendo claves nuevas aunque su valor sea `None`. La comparación usa igualdad Python y detecta cambios internos en dict/list porque el original se copió profundamente. No es una consulta SQL.

```python
pending = article.getDirty()
```

<a id="statemixin-isdirty"></a>

### `isDirty`

```text
def isDirty(self, *attributes: str) -> bool
```

Sin nombres comprueba cualquier cambio; con `*attributes` devuelve si al menos uno está modificado. Una clave no cargada no se considera modificada.

```python
article.title = "Changed"
assert article.isDirty("title")
```

<a id="statemixin-isclean"></a>

### `isClean`

```text
def isClean(self, *attributes: str) -> bool
```

Negación de `isDirty` sobre los mismos nombres. No significa que la base siga teniendo esos valores frente a escritores concurrentes.

```python
clean = article.isClean("published", "status")
```

<a id="statemixin-waschanged"></a>

### `wasChanged`

```text
def wasChanged(self, *attributes: str) -> bool
```

Consulta las claves escritas por la última persistencia exitosa registrada, no los cambios pendientes. Sin nombres devuelve si hay alguna. Un `save` sin cambios vacía el registro; fallos o vetos no garantizan sustituir un registro anterior.

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

Devuelve copia profunda del dict de cambios registrados por el último INSERT/UPDATE exitoso. Las claves incluyen identidad y timestamps cuando se escribieron.

```python
changes = article.getChanges()
```

<a id="statemixin-getoriginal"></a>

### `getOriginal`

```text
def getOriginal(self, key: str | None=None, default: Any=None) -> Any
```

Sin `key` devuelve copia profunda del snapshot completo; con clave devuelve copia profunda de su valor o `default=None`. No recupera la versión actual de la base.

```python
before = article.getOriginal("title", "Untitled")
original = article.getOriginal()
```

<a id="statemixin-syncoriginal"></a>

### `syncOriginal`

```text
def syncOriginal(self) -> Any
```

Convierte los valores actuales en el nuevo snapshot y retorna la misma instancia, **sin persistir** y sin limpiar `getChanges`. Es una operación avanzada: invocarla antes de guardar oculta esos cambios al próximo UPDATE.

```python
snapshot_only = Article({"title": "Baseline"})
snapshot_only.syncOriginal()
assert snapshot_only.isClean()
```

## Terminales del builder de modelo

Estos métodos conservan filtros, scopes y visibilidad de soft deletes. Las consultas SQL pueden fallar con `QueryException`. Consulta el [lenguaje compartido](/es/database/orm/querying) para filtros y escrituras, y [paginación](/es/database/orm/collections-and-pagination) para `paginate`.


<a id="modelquerybuilder-get"></a>

### `get`

```text
async def get(self) -> Collection
```

Ejecuta el plan, hidrata cada fila con casts, dispara `retrieved` en orden y finalmente carga las relaciones solicitadas. Devuelve `Collection`; propaga `QueryException`, errores de cast/listener y `RelationNotFoundException`.

```python
async def published_articles():
    return await Article.where("published", True).orderBy("id").get()
```

<a id="modelquerybuilder-first"></a>

### `first`

```text
async def first(self) -> TModel | None
```

Ejecuta una copia del plan con límite 1 y devuelve modelo o `None`; no altera el límite original. Ejecuta retrieved/eager loading si hubo fila.

```python
async def oldest_article():
    return await Article.orderBy("id").first()
```

<a id="modelquerybuilder-firstorfail"></a>

### `firstOrFail`

```text
async def firstOrFail(self) -> TModel
```

Como `first`, lanzando `ModelNotFoundException` ante ausencia.

```python
async def require_published():
    return await Article.where("published", True).firstOrFail()
```

<a id="modelquerybuilder-find"></a>

### `find`

```text
async def find(self, key: Any) -> TModel | None
```

Añade condición sobre la PK al mismo builder y llama a `first`; conserva los filtros previos y devuelve modelo o `None`. Reutilizarlo con otra identidad acumula condiciones.

```python
async def find_published(article_id: int):
    return await Article.where("published", True).find(article_id)
```

<a id="modelquerybuilder-findorfail"></a>

### `findOrFail`

```text
async def findOrFail(self, key: Any) -> TModel
```

Como `find`, pero lanza `ModelNotFoundException` si no hay coincidencia. Acepta una identidad escalar, sin valor predeterminado.

```python
async def require_published_id(article_id: int):
    return await Article.where("published", True).findOrFail(article_id)
```

<a id="modelquerybuilder-value"></a>

### `value`

```text
async def value(self, column: str) -> Any
```

Proyecta una columna en un clon, recupera un modelo y devuelve su atributo (con accessor si existe) o `None`. No permite distinguir fila ausente de valor nulo por el resultado.

```python
async def title_of(article_id: int):
    return await Article.where("id", article_id).value("title")
```

<a id="modelquerybuilder-pluck"></a>

### `pluck`

```text
async def pluck(self, column: str) -> Collection
```

Proyecta una columna en un clon y devuelve `Collection` de valores, conservando `None`. Ejecuta hidratación/retrieved. Selecciona claves necesarias si combinas proyección con relaciones; no acepta el segundo argumento `key` de Collection.pluck.

```python
async def all_titles():
    return (await Article.orderBy("id").pluck("title")).all()
```

<a id="modelquerybuilder-clone"></a>

### `clone`

```text
def clone(self) -> Self
```

Clona el builder con plan y lista de eager loading independientes. Los modelos y la conexión siguen siendo los mismos; el clon no convierte una consulta ya ejecutada en un snapshot de base.

```python
base = Article.where("published", True)
first_page = base.clone().limit(10)
assert first_page is not base
```

<a id="model-metadata-fields"></a>

<a id="model-python-protocol"></a>

## Metadatos e integración avanzada

`__meta__` es `None` en modelos abstractos. En modelos concretos es `ModelMetadata`, con `table_name`, `table`, `columns`, `primary_key`, `casts`, `cast_lookup`, `fillable`, `guarded`, `hidden`, `timestamps`, `incrementing`, `connection`, `created_column`, `updated_column`, `deleted_column`, `uses_unique_ids`, `accessors`, `mutators`, `appends`, `scopes`, `global_scopes` y `events`. Es información compilada de clase; para opciones ordinarias declara la clase, no modifiques esos registros internamente por petición.



<a id="modelmetadata-isfillable"></a>

### `isFillable`

```text
def isFillable(self, key: str) -> bool
```

Inspecciona la política ya compilada sin asignar valores; con `fillable` no vacía esta tiene prioridad. Un resultado `True` no comprueba por sí solo que exista la columna; `fill` comprueba ambas condiciones.

```python
assert Article.__meta__.isFillable("title")
```

<a id="modelmetadata-applycasts"></a>

### `applyCasts`

```text
def applyCasts(self, attributes: dict[str, Any]) -> dict[str, Any]
```

Aplica casts al dict recibido **en el mismo objeto** y lo devuelve. Operación avanzada usada al hidratar; no aplica mutadores, asignación masiva ni validación. Propaga errores de conversión.

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

Instala un `IConnectionManager` global para los consumidores ORM. Lo hace el provider durante bootstrap; en pruebas aisladas puedes suministrar un gestor dedicado. No cambies este registro global por petición.

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

Devuelve el gestor instalado o lanza `OrmConfigurationException`.

```python
from orionis.orm import ConnectionResolver

manager = ConnectionResolver.manager()
```

<a id="connectionresolver-connection"></a>

### `connection`

```text
def connection(cls, name: str | None=None) -> IConnection
```

Devuelve una conexión por nombre o la predeterminada. Si `name=None` y existe contexto de migración, utiliza la conexión de esa migración; un nombre explícito prevalece. Propaga errores de gestor/configuración.

```python
from orionis.orm import ConnectionResolver

connection = ConnectionResolver.connection()
```

<a id="connectionresolver-clear"></a>

### `clear`

```text
def clear(cls) -> None
```

Elimina el puente para aislamiento de pruebas; no cierra las conexiones del gestor y deja futuras consultas sin configuración hasta reinstalarlo.

```python
from orionis.orm import ConnectionResolver

manager = ConnectionResolver.manager()
try:
    ConnectionResolver.clear()
finally:
    ConnectionResolver.setManager(manager)
```

## Límites de persistencia

No existen aquí métodos de instancia `refresh()`/`fresh()` ni una propiedad pública `exists`. Para comprobar existencia consulta de nuevo o usa el booleano de escritura y la identidad. Una proyección parcial no rellena el resto de la entidad: no intentes guardar valores que asumiste cargados. Actualizar/borrar una instancia usa su PK original directamente, sin reintroducir scopes globales ni control de versión. No hay bloqueo optimista implícito. Tras errores o rollback, descarta o recupera de nuevo el objeto si necesitas reflejar el estado real.

`save()` sin cambios sigue ejecutando eventos `saving`, `updating`, `updated`, `saved`, pero no UPDATE. Si SQL afecta cero filas, los eventos posteriores se ejecutan aunque el booleano sea `False`. Véase [eventos](/es/database/orm/events).

<a id="orm-exceptions"></a>

## Excepciones públicas

`OrmException` es la base. `OrmConfigurationException` indica wiring/configuración; `MassAssignmentException`, entrada no asignable; `ModelNotFoundException`, ausencia en OrFail; `InvalidQueryException`, argumentos de consulta inválidos; `RelationNotFoundException`, eager loading inválido; `ScopeNotFoundException`, scope local ausente. Este último se importa desde `orionis.orm.exceptions`; los demás también están expuestos por `orionis.orm`. Los errores de driver pertenecen a Database (`QueryException`), no se convierten en ModelNotFoundException.

El protocolo de modelo dirige lecturas/escrituras de columnas a sus atributos y repr muestra clase/PK. No implementa comparación por identidad ni reemplaza una recarga SQL.

## Helpers de integración

Son funciones públicas de módulos especializados; la aplicación normalmente usa Model, sus opciones y el builder.

<a id="orm-helper-get-cast-handler"></a>

### `get_cast_handler`

```text
def get_cast_handler(cast: str) -> Callable[[Any], Any]
```

Devuelve el callable de un cast nativo, normalizando espacios/mayúsculas; un nombre no soportado produce OrmException.

```python
from orionis.orm.attributes import get_cast_handler

assert get_cast_handler(" BOOL ")("on") is True
```

<a id="orm-helper-serialize-for-storage"></a>

### `serialize_for_storage`

```text
def serialize_for_storage(meta: ModelMetadata, values: dict[str, Any]) -> dict[str, Any]
```

Devuelve copia de values con dict/list o UUID convertidos cuando la columna no almacena esos tipos nativamente. No aplica casts de entrada, mutadores ni asignación masiva.

```python
from orionis.orm.attributes import serialize_for_storage

values = serialize_for_storage(Article.__meta__, {"title": "Guide"})
```

<a id="orm-helper-snake-case"></a>

### `snake_case`

```text
def snake_case(name: str) -> str
```

Transforma CamelCase separando cada mayúscula y retira guiones bajos iniciales; es una heurística sencilla, no un analizador de acrónimos.

```python
from orionis.orm.metaclass import snake_case

assert snake_case("UserRole") == "user_role"
```

<a id="orm-helper-pluralize"></a>

### `pluralize`

```text
def pluralize(word: str) -> str
```

Aplica la heurística de plural inglés (y consonante→ies; s/x/z/ch/sh→es; resto→s), sin diccionario de irregulares.

```python
from orionis.orm.metaclass import pluralize

assert pluralize("category") == "categories"
```

<a id="modelquerybuilder---init--"></a>

### `ModelQueryBuilder.__init__`

```text
def __init__(self, model: type[TModel]) -> None
```

Construye un builder para una clase de modelo concreta; normalmente usa `Article.query()` que realiza esta operación. La clase debe tener metadatos (no ser abstracta). No ejecuta SQL.

```python
from orionis.orm import ModelQueryBuilder

query = ModelQueryBuilder(Article)
```
