---
title: "Faker y datos simulados"
description: "Locales, semillas, datos únicos y opcionales, proveedores camelCase y extensión del generador de factories."
editUrl: true
lastUpdated: false
---

`Factory.fake` expone `Fake`, la fachada de proveedores de datos simulados de Orionis. Sus métodos usan **camelCase**, mientras que los argumentos conservan los nombres del proveedor nativo: `fake.phoneNumber()` y `fake.dateBetween(start_date="-10d", end_date="today")`.

Los proveedores se ejecutan de forma síncrona y generan valores; no insertan registros. Para persistir modelos utiliza [factories](/es/orm/factories) y [seeders](/es/database/seeders).

## Recibir una factory en un controlador

Después de crear `ProductFactory` como se muestra en la guía de factories, el contenedor puede construirla como una dependencia normal. Cada instancia obtiene un generador independiente:

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

Registra `[SampleDataController, "show"]` en una ruta API de tu aplicación de desarrollo. Este controlador no accede a la base ni espera las llamadas de Faker; los datos se generan en esa ejecución.

## Seleccionar locale y semilla

`Factory(locale=None, seed=None)` normaliza `-` a `_` e intenta el locale solicitado; sin override lee `app.locale` cuando hay una aplicación actual y utiliza `en_US` si no puede resolver un locale soportado. Un locale explícito debe ser texto no vacío; seed debe ser entero o None, sin bool.

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

`fake.locales` devuelve una copia de los locales configurados. `fake[locale]` y `fake.unique[locale]` seleccionan un locale **ya configurado** y pueden lanzar `KeyError`; no incorporan otro idioma al generador. Una factory configura un solo locale mediante su argumento, aunque la clase `Fake` puede envolver un backend compatible configurado de otra forma.

La semilla afecta solo a ese generador. Reproducibilidad significa misma configuración y mismo orden de llamadas; no una promesa de mantener los resultados entre cambios del backend. Cambiar el locale también cambia formatos y proveedores disponibles.

## Elegir datos por su propósito

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

`dateBetween()` devuelve una fecha y `pydecimal()` un Decimal: conserva sus tipos o conviértelos explícitamente al formato que acepte tu columna o respuesta. `fileName()` y `filePath()` generan nombres y rutas ficticias, no crean archivos. Los métodos de identidad o pagos generan ejemplos con formatos locales, no documentos ni medios de pago válidos para uso real.

El [catálogo de proveedores A–D](/es/faker/reference/a-d) y sus continuaciones relacionan todos los nombres declarados por el tipado de Orionis con sus firmas, disponibilidad por locale y ejemplos. El catálogo distingue lo declarado de lo disponible en un locale concreto; los proveedores personalizados pueden ampliar ese conjunto en tiempo de ejecución.

## Unicidad de una instancia

`fake.unique` mantiene un historial de resultados por la instancia del backend y la llamada de proveedor. Ese historial no consulta la base de datos y no sustituye una restricción UNIQUE del esquema.

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

Al agotar los valores posibles o los intentos del backend se propaga `faker.exceptions.UniquenessException`. `clear()` permite reutilizar valores anteriores. `Factory.clearUnique()` hace esa limpieza y devuelve la factory, sin volver a sembrar el RNG ni retroceder una Sequence. `excludeTypes()` devuelve una vista que permite repetir resultados de los tipos indicados; conserva el pool compartido para los demás.

## Valores opcionales

`fake.optional.provider(..., prob=0.5)` devuelve el resultado del proveedor o `None`. `prob` indica la probabilidad de **generar el valor**, no la de omitirlo. El backend exige `0 < prob <= 1`; `prob=1` siempre genera y `prob=0` produce `ValueError`.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(seed=7).fake
phone = fake.optional.phoneNumber(prob=0.8)
always_present = fake.optional.word(prob=1)
```

La selección pasa por el generador de esa instancia. Los parámetros propios del proveedor conservan su forma nativa; `prob` pertenece a la vista opcional.

## Añadir o reemplazar proveedores

`addProvider()` acepta una clase o instancia compatible con Faker. Los nombres públicos se convierten a camelCase; si hay una colisión, el nombre ya escrito exactamente en camelCase tiene prioridad. La actualización invalida los métodos cacheados también en las vistas unique y optional.

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

`getFormatter(name)` devuelve el callable resuelto; `format(name, *args, **kwargs)` lo ejecuta. `setFormatter()` registra/reemplaza bajo un identificador camelCase público: rechaza `_` y `seed` con `ValueError` y un formatter no invocable con `TypeError`. No añadas un proveedor global a mitad de una generación concurrente; cada factory ya ofrece su propia instancia.

## API de gestión y vistas

<a id="fake-init"></a>

### `Fake.__init__`

```text
__init__(backend: object) -> None
```

Envuelve un backend compatible. No copia ni siembra el backend; normalmente se obtiene de Factory.fake.

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

Propiedad: devuelve una UniqueFake estable que comparte el historial de esa instancia.

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

Propiedad: devuelve una OptionalFake estable que añade el keyword prob.

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

Propiedad: devuelve list[str] con una copia de los locales configurados.

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

Propiedad: expone el random.Random vivo de esta instancia. Cambiar su estado modifica las generaciones siguientes.

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

Selecciona un locale ya configurado. Si coincide con su backend único devuelve la misma fachada; en otro caso envuelve el backend seleccionado.

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

Registra un proveedor en el backend e invalida los métodos cacheados. Devuelve None.

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

Siembra el RNG de esta instancia con un entero; None utiliza entropía. No afecta el RNG de otras factories.

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

Siembra el RNG de un locale configurado; no incorpora locales nuevos. Devuelve None.

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

Resuelve un callable por su nombre público camelCase. Un nombre ausente, privado o snake_case produce AttributeError.

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

Instala un callable con nombre público válido y refresca las vistas existentes. Devuelve None.

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

Invoca el formatter camelCase con args/kwargs y devuelve exactamente su resultado.

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

Limpia el pool compartido de valores vistos. No devuelve valores ni reinicia la semilla.

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

Recibe list[type] y devuelve una UniqueFake sobre el mismo pool permitiendo repetir los tipos indicados.

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

Selecciona el locale sobre el pool de unicidad existente y devuelve otra vista de ese pool.

```python
from database.factories.product_factory import ProductFactory

fake = ProductFactory(locale="es_CO", seed=7).fake
view = fake.unique["es_CO"]
value = view.safeEmail()
```


`OptionalFake` no añade métodos de gestión propios: hereda el despacho camelCase y la selección probabilística del backend. `dir(fake)` ayuda a consultar qué proveedores tiene ese locale. La fachada rechaza acceso a métodos snake_case y al seed global; no expone propiedades internas del backend. Las excepciones del proveedor se propagan sin transformarse en valores falsos.
