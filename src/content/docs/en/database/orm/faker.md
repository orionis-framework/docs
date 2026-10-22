---
title: "Faker and sample data"
description: "Locales, seeds, unique and optional data, camelCase providers and factory generator extension."
editUrl: true
lastUpdated: false
---

`Factory.fake` exposes `Fake`, Orionis’s sample-data provider facade. Methods use **camelCase**, while parameters retain native provider names: `fake.phoneNumber()` and `fake.dateBetween(start_date="-10d", end_date="today")`.

Providers run synchronously and generate values; they do not insert records. Persist models through [factories](/en/database/orm/factories-and-testing) and [seeders](/en/database/seeders).

## Receive a factory in a controller

After creating `ProductFactory` as shown in the factory guide, the container can build it as an ordinary dependency. Every instance owns an independent generator:

```python
from database.factories.product_factory import ProductFactory
from orionis.http import JSONResponse


class SampleDataController:
    def __init__(self, factory: ProductFactory) -> None:
        self._factory = factory

    async def show(self) -> JSONResponse:
        fake = self._factory.fake
        return JSONResponse({
            "customer": fake.name(),
            "email": fake.safeEmail(),
            "phone": fake.phoneNumber(),
            "reference": fake.bothify(text="SKU-####-??"),
            "amount": fake.randomInt(min=10, max=100, step=5),
            "optional_note": fake.optional.sentence(prob=0.5),
        })
```

Register `[SampleDataController, "show"]` on a development API route. This controller does not access the database or await Faker calls; values are generated during execution.

## Select locale and seed

`Factory(locale=None, seed=None)` normalizes `-` to `_` and tries the requested locale; without an override it reads `app.locale` when an application is current and falls back to `en_US` if no supported locale can be resolved. An explicit locale must be nonempty text; seed must be an integer or None, excluding bool.

```python
from database.factories.product_factory import ProductFactory


first = ProductFactory(locale="es_CO", seed=7).fake
second = ProductFactory(locale="es_CO", seed=7).fake
assert first.name() == second.name()
first.seedInstance(12)
first.seedLocale("es_CO", 12)
selected = first["es_CO"]
value = selected.city()
```

`fake.locales` returns a detached locale list. `fake[locale]` and `fake.unique[locale]` select an **already configured** locale and may raise `KeyError`; they do not add another language. A factory configures one locale through its argument, although `Fake` can wrap another compatible backend configuration.

A seed affects only that generator. Reproducibility means the same configuration and call order, not a promise to retain results across backend changes. Changing locale also changes formats and available providers.

## Choose data by purpose

```python
from database.factories.product_factory import ProductFactory


fake = ProductFactory(locale="en_US", seed=7).fake
sample = {
    "person": fake.name(),
    "email": fake.safeEmail(),
    "address": fake.address(),
    "company": fake.company(),
    "description": fake.sentence(nb_words=6),
    "quantity": fake.randomInt(min=1, max=20),
    "price": fake.pydecimal(left_digits=3, right_digits=2, positive=True),
    "active": fake.boolean(chance_of_getting_true=80),
    "created": fake.dateBetween(start_date="-30d", end_date="today"),
    "identifier": fake.uuid4(),
    "file_name": fake.fileName(extension="pdf"),
    "status": fake.randomElement(elements=("draft", "published")),
}
```

`dateBetween()` returns a date and `pydecimal()` a Decimal: retain their types or explicitly convert them for the target column/response. `fileName()` and `filePath()` generate fictional names/paths without creating files. Identity/payment methods produce examples in localized formats rather than valid real-world documents or payment instruments.

The [A–D provider catalog](/en/database/orm/faker-reference-a-d) and continuations map every name declared in Orionis typing to signatures, locale availability and examples. The catalog distinguishes declarations from availability in a particular locale; custom providers can extend the runtime set.

## Instance-local uniqueness

`fake.unique` retains result history for the backend instance and provider call. It does not query the database or replace a schema UNIQUE constraint.

```python
from database.factories.product_factory import ProductFactory
from faker.exceptions import UniquenessException


fake = ProductFactory(seed=7).fake
assert fake.unique.randomElement(elements=("one",)) == "one"
try:
    fake.unique.randomElement(elements=("one",))
except UniquenessException:
    fake.unique.clear()

assert fake.unique.randomElement(elements=("one",)) == "one"
unrestricted_ints = fake.unique.excludeTypes([int])
assert unrestricted_ints.randomElement(elements=(7,)) == 7
assert unrestricted_ints.randomElement(elements=(7,)) == 7
```

Exhausting possible values or backend attempts propagates `faker.exceptions.UniquenessException`. `clear()` permits earlier values again. `Factory.clearUnique()` clears the pool and returns the factory without reseeding the RNG or rewinding a Sequence. `excludeTypes()` returns a view allowing repeated results of selected types while sharing the pool for other results.

## Optional values

`fake.optional.provider(..., prob=0.5)` returns the provider result or `None`. `prob` is the probability of **generating the value**, not omitting it. The backend requires `0 < prob <= 1`; `prob=1` always generates and `prob=0` raises `ValueError`.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(seed=7).fake
phone = fake.optional.phoneNumber(prob=0.8)
always_present = fake.optional.word(prob=1)
```

Selection uses that instance’s generator. Provider-specific parameter names remain native; `prob` belongs to the optional view.

## Add or replace providers

`addProvider()` accepts a Faker-compatible provider class or instance. Public names convert to camelCase; an already exact camelCase name wins collisions. Updates invalidate cached methods in unique and optional views too.

```python
from database.factories.product_factory import ProductFactory
from faker.providers import BaseProvider


class ProductCodeProvider(BaseProvider):
    def product_code(self, prefix: str = "P") -> str:
        return f"{prefix}-{self.generator.random_int(min=1000, max=9999)}"


fake = ProductFactory(locale="es_CO", seed=7).fake
fake.addProvider(ProductCodeProvider)
code = fake.productCode(prefix="SKU")
same_api = fake.format("productCode", prefix="SKU")
fake.setFormatter("productCode", lambda prefix="P": f"{prefix}-FIXED")
assert fake.getFormatter("productCode")(prefix="SKU") == "SKU-FIXED"
```

`getFormatter(name)` returns the resolved callable; `format(name, *args, **kwargs)` executes it. `setFormatter()` registers/replaces a public camelCase identifier: `_` and `seed` raise `ValueError`, and a non-callable formatter raises `TypeError`. Do not add a global provider during concurrent generation; every factory already supplies its own instance.

## Management and view API

<a id="fake-init"></a>

### `Fake.__init__`

```text
__init__(backend: object) -> None
```

Wraps a compatible backend without cloning or reseeding it; normally obtained through Factory.fake.

```python
from faker import Faker
from orionis.orm.factories import Fake

backend = Faker("en_US")
backend.seed_instance(7)
fake = Fake(backend)
assert isinstance(fake.name(), str)
```

<a id="fake-unique"></a>

### `Fake.unique`

```text
unique() -> UniqueFake
```

Property: returns a stable UniqueFake sharing that instance’s history.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
value = fake.unique.safeEmail()
```

<a id="fake-optional"></a>

### `Fake.optional`

```text
optional() -> OptionalFake
```

Property: returns a stable OptionalFake adding the prob keyword.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
value = fake.optional.sentence(prob=0.8)
```

<a id="fake-locales"></a>

### `Fake.locales`

```text
locales() -> list[str]
```

Property: returns list[str], a copy of configured locales.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
locales = fake.locales
assert "es_CO" in locales
```

<a id="fake-random"></a>

### `Fake.random`

```text
random() -> Random
```

Property: exposes this instance’s live random.Random. Changing its state affects later generation.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
value = fake.random.randint(1, 6)
```

<a id="fake-getitem"></a>

### `Fake.__getitem__`

```text
__getitem__(locale: str) -> Fake
```

Selects an already configured locale. Returns the same facade for its single matching backend, otherwise wraps the selected backend.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
selected = fake["es_CO"]
value = selected.city()
```

<a id="fake-addprovider"></a>

### `Fake.addProvider`

```text
addProvider(provider: object) -> None
```

Registers a backend provider and invalidates cached methods. Returns None.

```python
from database.factories.product_factory import ProductFactory
from faker.providers import BaseProvider


class ProductCodeProvider(BaseProvider):
    def product_code(self, prefix: str = "P") -> str:
        return f"{prefix}-{self.generator.random_int(min=1000, max=9999)}"


fake = ProductFactory(locale="es_CO", seed=7).fake
fake.addProvider(ProductCodeProvider)
code = fake.productCode(prefix="SKU")
same_api = fake.format("productCode", prefix="SKU")
fake.setFormatter("productCode", lambda prefix="P": f"{prefix}-FIXED")
assert fake.getFormatter("productCode")(prefix="SKU") == "SKU-FIXED"

```

<a id="fake-seedinstance"></a>

### `Fake.seedInstance`

```text
seedInstance(seed: int | None=None) -> None
```

Seeds this instance’s RNG with an integer; None uses entropy. Does not affect other factories’ RNGs.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
fake.seedInstance(7)
value = fake.name()
```

<a id="fake-seedlocale"></a>

### `Fake.seedLocale`

```text
seedLocale(locale: str, seed: int | None=None) -> None
```

Seeds a configured locale’s RNG without adding a locale. Returns None.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
fake.seedLocale("es_CO", 7)
value = fake.name()
```

<a id="fake-getformatter"></a>

### `Fake.getFormatter`

```text
getFormatter(name: str) -> Callable[..., Any]
```

Resolves a callable by public camelCase name. Missing, private or snake_case names raise AttributeError.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
formatter = fake.getFormatter("safeEmail")
value = formatter()
```

<a id="fake-setformatter"></a>

### `Fake.setFormatter`

```text
setFormatter(name: str, formatter: Callable[..., Any]) -> None
```

Installs a callable under a valid public name and refreshes existing views. Returns None.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
fake.setFormatter("productCode", lambda prefix="P": f"{prefix}-EXAMPLE")
assert fake.productCode(prefix="SKU") == "SKU-EXAMPLE"
```

<a id="fake-format"></a>

### `Fake.format`

```text
format(formatter: str, *args: Any, **kwargs: Any) -> Any
```

Calls the camelCase formatter with args/kwargs and returns its exact result.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
value = fake.format("randomInt", min=1, max=5)
```

<a id="uniquefake-clear"></a>

### `UniqueFake.clear`

```text
clear() -> None
```

Clears the shared seen-value pool. Returns no values and does not reseed.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
fake.unique.clear()
value = fake.unique.randomInt(min=1, max=5)
```

<a id="uniquefake-excludetypes"></a>

### `UniqueFake.excludeTypes`

```text
excludeTypes(types: list[type]) -> UniqueFake
```

Accepts list[type] and returns a UniqueFake over the same pool, allowing repeated results of those types.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
view = fake.unique.excludeTypes([int])
assert view.randomElement(elements=(7,)) == 7
assert view.randomElement(elements=(7,)) == 7
```

<a id="uniquefake-getitem"></a>

### `UniqueFake.__getitem__`

```text
__getitem__(locale: str) -> UniqueFake
```

Selects a locale over the existing uniqueness pool and returns another view of it.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
view = fake.unique["es_CO"]
value = view.safeEmail()
```


`OptionalFake` adds no management methods: it inherits camelCase dispatch and backend probability selection. `dir(fake)` shows providers available in that locale. The facade rejects snake_case methods and the global seed; it does not expose raw backend properties. Provider exceptions propagate rather than becoming false values.
