---
title: "Model factories"
description: "Define, compose and iterate factories, generate deterministic data and persist models with event and transaction control."
editUrl: true
lastUpdated: false
---

A factory builds sample models from an attribute definition. `make()` constructs unsaved instances; `create()` calls `save()` to persist them. Use factories in seeders and tests requiring coherent datasets.

Every factory owns its generator, states, count and sequence index. Import its class explicitly: models expose no `factory()` method and do not discover factories by naming convention.

## Generate the file

```bash
orionis make:factory ProductFactory --model Product
```

```bash
python -B reactor make:factory ProductFactory --model Product
```

| Argument or option | Required | Default and behavior |
| --- | --- | --- |
| `name` | Yes | Class or file name. Normalizes modules to snake_case and adds `Factory` when absent. |
| `--model`, `-m` | No | When omitted, derives the model by removing `Factory`, preserving subdirectories. |
| `-h`, `--help` | No | Displays command help. |

`sales/OrderFactory --model sales/Order` generates `database/factories/sales/order_factory.py`, importing `app.models.sales.order.Order` under default project paths. `/` and `\` separators are accepted; absolute paths, empty/invalid segments and reserved words are rejected. Directories are created, but existing files are not overwritten. This generator has no `--force` option.

The command does not generate the model or table. With `ProductFactory --model Product`, initial contents are:

```python
from typing import Any
from app.models.product import Product
from orionis.orm.factories import Factory

class ProductFactory(Factory[Product]):
    """Define default attributes for generated Product models."""

    __slots__ = ()

    model = Product

    def definition(self) -> dict[str, Any]:
        """
        Define the model's default attributes.

        Returns
        -------
        dict[str, Any]
            Explicit mass-assignable attributes, using ``self.fake`` as needed.
        """
        return {}
```

The empty definition is a starting point: fill it with attributes required by your model.

## Complete model and factory

In `app/models/product.py`, this model matches columns in the [testing scenario](/en/database/orm/testing):

```python
from typing import ClassVar
from orionis.orm import Boolean, Integer, Model, String


class Product(Model):
    table = "products"
    timestamps = False
    id = Integer().primary().autoIncrement()
    name = String(120)
    price = Integer()
    stock = Integer()
    reserved = Integer()
    active = Boolean()
    category_id = Integer().nullable()
    description = String(255).nullable()
    fillable: ClassVar[list[str]] = [
        "name", "price", "stock", "reserved", "active", "category_id", "description",
    ]
    casts: ClassVar[dict[str, str]] = {"active": "bool"}
```

Replace the empty definition in `database/factories/product_factory.py` with:

```python
from typing import Any
from app.models.product import Product
from orionis.orm.factories import Factory


class ProductFactory(Factory[Product]):
    model = Product

    def definition(self) -> dict[str, Any]:
        return {
            "name": self.fake.word(),
            "price": self.fake.randomInt(min=10, max=100),
            "stock": self.fake.randomInt(min=0, max=20),
            "reserved": 0,
            "active": True,
            "category_id": None,
            "description": None,
        }
```

`model` must be a concrete `Model` subclass, not a string or instance. `definition()` is synchronous and returns a dictionary with string keys. Attributes pass through the normal model constructor: `fillable`, casts and mutators apply. SQL column defaults do not define factory attributes.

## Composition order

Values combine in this order: `definition()` → states in registration order → sequence → operation overrides. Each layer replaces repeated keys from the previous one. Dictionaries and nested containers are copied so records do not accidentally share attributes.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence


products = (
    ProductFactory(seed=7)
    .count(3)
    .state({"stock": 10})
    .state(lambda attributes: {"price": attributes["price"] + 5})
    .sequence(Sequence({"active": True}, {"active": False}))
    .make(reserved=0)
)
assert [product.active for product in products] == [True, False, True]
```

The default count is one: `make()` returns a model. `count(0)` or a count greater than one returns `Collection`. Zero does not call `definition()` or persist records.

## Persistence and relationships

With the table prepared, call factories from an asynchronous seeder, controller or test:

```python
from database.factories.product_factory import ProductFactory
from orionis.support.facades import DB


async def create_catalog(category_id: int):
    async with DB.transaction():
        return await (
            ProductFactory(seed=7)
            .count(20)
            .create(category_id=category_id, active=True)
        )
```

The category must exist when the schema enforces its foreign key. Factories do not create associations automatically or offer `has()`/`for_()` helpers: create the parent first and pass its key, or explicitly use [relationship operations](/en/database/orm/relationship-operations). A synchronous `definition()` must not attempt to create records with `await`.

`create()` does not open a transaction. Earlier records may remain persisted when a later record fails; the example’s context rolls back the group. The transaction and model must use the same connection. `save()` fires events and may be vetoed; the factory turns that result into `FactoryPersistenceException`.

## Iteration and concurrent use

`iterMake()` returns a synchronous iterator; `iterCreate()` an asynchronous iterator saving each model before yielding it. Both avoid constructing a complete collection, but neither is a SQL read cursor.

```python
from contextlib import aclosing
from database.factories.product_factory import ProductFactory


async def create_first_product():
    factory = ProductFactory(seed=7).count(100)
    async with aclosing(factory.iterCreate()) as models:
        async for model in models:
            return model
```

This example saves only the first record and closes the iterator. Use `close()` or `contextlib.closing` when stopping `iterMake()` early. A busy factory rejects overlapping generation or reconfiguration with `FactoryConcurrencyException`; use one instance per task. Protection starts when iteration begins, not when creating an unconsumed iterator.

## Complete Factory API

<a id="factory-model"></a>

### `Factory.model: type[TModel] | None = None`

Defines the concrete Model class constructed by the factory. It is a required subclass option; the base None value is unusable. It is validated and captured by the constructor: changing model afterwards does not change an existing factory instance.

```python
from app.models.product import Product
from database.factories.product_factory import ProductFactory

assert ProductFactory.model is Product
```

<a id="factory-init"></a>

### `__init__`

```text
__init__(*, locale: str | None=None, seed: int | None=None) -> None
```

Builds a factory with count 1, no states or sequence. locale=None uses app.locale; an unsupported locale falls back to en_US. seed=None uses entropy and an independent RNG.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = ProductFactory(locale="es_CO", seed=7)
```

<a id="factory-fake"></a>

### `fake`

```text
fake() -> Fake
```

Property returning this instance’s same Fake; not recreated for every record.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = ProductFactory(seed=7).fake.safeEmail()
```

<a id="factory-definition"></a>

### `definition`

```text
definition() -> dict[str, Any]
```

Required synchronous override returning dict[str, Any]. The base implementation raises FactoryDefinitionException.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = ProductFactory(seed=7).definition()
```

<a id="factory-count"></a>

### `count`

```text
count(count: int) -> Self
```

Changes the count for later calls. Accepts int >=0; bool, negative values and other types raise FactoryConfigurationException. Returns the same factory.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = ProductFactory(seed=7).count(2).make()
```

<a id="factory-state"></a>

### `state`

```text
state(state: State) -> Self
```

Appends a copied dictionary or synchronous callback receiving detached current attributes and returning a dictionary. Returned fields merge. Async callbacks or invalid inputs raise FactoryConfigurationException; invalid results raise FactoryDefinitionException.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = ProductFactory(seed=7).state(lambda attributes: {"price": attributes["price"] + 10}).make()
```

<a id="factory-sequence"></a>

### `sequence`

```text
sequence(sequence: Sequence) -> Self
```

Installs a Sequence and resets the index to zero. Non-Sequence input raises FactoryConfigurationException. Returns the same factory.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = ProductFactory(seed=7).count(2).sequence(Sequence({"active": True}, {"active": False})).make()
```

<a id="factory-clearunique"></a>

### `clearUnique`

```text
clearUnique() -> Self
```

Clears self.fake.unique history without reseeding the RNG or resetting sequence or states. Returns the same factory.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = ProductFactory(seed=7).clearUnique().make()
```

<a id="factory-make"></a>

### `make`

```text
make(**overrides: Any) -> TModel | Collection
```

Constructs one model when count=1; otherwise returns Collection. Does not access the database or fire persistence events. Overrides take precedence over states and sequence.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = ProductFactory(seed=7).make(name="Fixed name")
```

<a id="factory-create"></a>

### `create`

```text
async create(**overrides: Any) -> TModel | Collection
```

Saves each model through await save(). Same cardinality as make; opens no transaction and does not combine inserts into bulk SQL. A veto raises FactoryPersistenceException; SQL errors propagate.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

async def run_example():
    return await ProductFactory(seed=7).count(2).create(active=True)
```

<a id="factory-itermake"></a>

### `iterMake`

```text
iterMake(**overrides: Any) -> Iterator[TModel]
```

Returns Iterator[TModel]. Generates attributes on advancement and keeps the factory busy until the iterator is exhausted or closed.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

result = list(ProductFactory(seed=7).count(2).iterMake())
```

<a id="factory-itercreate"></a>

### `iterCreate`

```text
async iterCreate(**overrides: Any) -> AsyncIterator[TModel]
```

Returns AsyncIterator[TModel]. Awaits save before every yield; closing the stream releases the factory but does not roll back records already saved.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

async def run_example():
    return [model async for model in ProductFactory(seed=7).count(2).iterCreate()]
```

## Sequence

`Sequence(*entries)` requires at least one dictionary or synchronous callback. `resolve(index: int) -> dict[str, Any]` requires a nonnegative integer and returns a copy of `entries[index % len(entries)]`; callbacks receive the absolute index rather than the modulo position. The object owns no counter: every factory owns an index advancing across operations and resetting on sequence(). String keys are required and async callbacks rejected.

```python
from orionis.orm.factories import Sequence

sequence = Sequence({"active": True}, lambda index: {"price": 10 + index})
assert sequence.resolve(0) == {"active": True}
assert sequence.resolve(3) == {"price": 13}
```

<a id="factory-types"></a>

### `State` / `SequenceEntry`

```python
from orionis.orm.factories.factory import State
from orionis.orm.factories.sequence import SequenceEntry

state: State = lambda attributes: {"stock": attributes["stock"] + 1}
entry: SequenceEntry = lambda index: {"price": 10 + index}
```

`State` means `dict[str, Any] | Callable[[dict[str, Any]], dict[str, Any]]`; `SequenceEntry` means `dict[str, Any] | Callable[[int], dict[str, Any]]`. They describe synchronous callbacks, without automatic awaitable conversion.
<a id="factory-errors"></a>

## Errors and reproducibility

`FactoryConfigurationException` covers invalid model/locale/seed/count/state/sequence; `FactoryDefinitionException` covers definitions or results that are not dictionaries with string keys; `FactoryConcurrencyException` indicates overlap; `FactoryPersistenceException` indicates a save veto. `FactoryDependencyException` is a public type, but this implementation imports Faker directly: it does not promise to turn Faker ImportError into that exception. All derive from `FactoryException`. Factories do not swallow query failures.

A seed reproduces a sequence for the same configuration and call order; it does not freeze results across future provider updates. Fake values are not production credentials. When a model needs a password, explicitly hash it outside definition() or pass a prepared hash as an override.

[Faker](/en/database/orm/faker) · [Seeders](/en/database/seeders) · [Testing](/en/database/orm/testing)
