---
title: "Factories de modelos"
description: "Define, combina e itera factories, genera datos deterministas y persiste modelos con control de eventos y transacciones."
editUrl: true
lastUpdated: false
---

Una factory construye modelos de ejemplo a partir de una definición de atributos. `make()` genera instancias sin guardar; `create()` ejecuta `save()` para persistirlas. Sirve para seeders y pruebas que necesitan conjuntos coherentes de datos.

Cada factory mantiene su propio generador de datos, estados, cantidad e índice de secuencia. Importa la clase de factory explícitamente: el modelo no ofrece `factory()` ni descubre una factory por convención.

## Generar el archivo

```bash
orionis make:factory ProductFactory --model Product
```

```bash
python -B reactor make:factory ProductFactory --model Product
```

| Argumento u opción | Obligatorio | Predeterminado y comportamiento |
| --- | --- | --- |
| `name` | Sí | Clase o nombre de archivo. Normaliza módulos a snake_case y añade el sufijo `Factory` si falta. |
| `--model`, `-m` | No | Si se omite, deriva el modelo quitando `Factory` al nombre y conserva los subdirectorios. |
| `-h`, `--help` | No | Muestra la ayuda del comando. |

`sales/OrderFactory --model sales/Order` genera una factory en `database/factories/sales/order_factory.py` que importa `app.models.sales.order.Order` con las rutas predeterminadas del proyecto. Se admiten separadores `/` y `\`; se rechazan rutas absolutas, segmentos vacíos o inválidos y palabras reservadas. Los directorios se crean, pero un archivo existente no se sobrescribe. No existe una opción `--force` en este generador.

El comando no genera el modelo ni su tabla. Con `ProductFactory --model Product`, el contenido inicial es:

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

La definición vacía es un punto de partida: complétala con los campos requeridos por tu modelo.

## Modelo y factory completos

En `app/models/product.py`, el modelo siguiente coincide con las columnas del [escenario de pruebas](/es/database/orm/testing):

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

Sustituye la definición vacía de `database/factories/product_factory.py` por:

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

`model` debe ser una clase concreta derivada de `Model`, no un string ni una instancia. `definition()` es síncrona y devuelve un `dict` con claves de texto. Los atributos se asignan mediante el constructor normal del modelo: se aplican `fillable`, casts y mutadores. Los defaults SQL de las columnas no son una definición de factory.

## Orden de composición

Se combinan en este orden: `definition()` → estados, en su orden de registro → secuencia → overrides de la operación. Cada capa reemplaza las claves repetidas de la anterior. Los diccionarios y contenedores anidados se copian para evitar compartir atributos entre registros.

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

La cantidad predeterminada es uno: `make()` devuelve un modelo. Con `count(0)` o una cantidad mayor que uno devuelve `Collection`. La cantidad cero no llama a `definition()` ni persiste registros.

## Persistencia y relaciones

Con la tabla preparada, utiliza las factories dentro del flujo asíncrono de un seeder, controlador o prueba:

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

La categoría debe existir si tu esquema exige la clave foránea. La factory no genera asociaciones automáticamente ni ofrece `has()`/`for_()` para relaciones: crea primero el padre y pasa su clave, o utiliza la [API de relaciones](/es/database/orm/relationship-operations) explícitamente. Una `definition()` síncrona no debe intentar crear registros con `await`.

`create()` no abre una transacción. Si un registro falla, los anteriores pueden quedar guardados; el contexto del ejemplo permite revertir el conjunto. La conexión de la transacción y la del modelo deben coincidir. `save()` aplica eventos y puede ser vetado; la factory traduce ese resultado a `FactoryPersistenceException`.

## Iteración y uso concurrente

`iterMake()` devuelve un iterador síncrono; `iterCreate()` un iterador asíncrono que guarda un modelo antes de producirlo. Ambos evitan construir una colección completa, pero no son un cursor de lectura SQL.

```python
from contextlib import aclosing
from database.factories.product_factory import ProductFactory


async def create_first_product():
    factory = ProductFactory(seed=7).count(100)
    async with aclosing(factory.iterCreate()) as models:
        async for model in models:
            return model
```

El ejemplo guarda solo el primero y cierra el iterador. Para `iterMake()` utiliza `close()` o `contextlib.closing` si interrumpes la iteración. Una factory ocupada rechaza otra generación o reconfiguración con `FactoryConcurrencyException`; utiliza una instancia por tarea. La protección se activa al empezar la iteración, no al crear un iterador todavía sin consumir.

## API completa de Factory

<a id="factory-model"></a>

### `Factory.model: type[TModel] | None = None`

Define la clase concreta de Model que la factory construye. Es una opción de clase obligatoria en la subclase; el valor None de la base no es utilizable. Se valida y captura en el constructor: modificar model después no cambia una instancia de factory ya creada.

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

Construye una factory con cantidad 1, sin estados ni secuencia. locale=None usa app.locale; un locale no disponible vuelve a en_US. seed=None usa entropía y un RNG independiente.

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

Propiedad que devuelve el mismo Fake de esta instancia; no lo recrea en cada registro.

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

Override obligatorio y síncrono que devuelve dict[str, Any]. La implementación base lanza FactoryDefinitionException.

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

Cambia la cantidad para llamadas posteriores. Acepta int >=0; bool, negativos y otros tipos producen FactoryConfigurationException. Devuelve la misma factory.

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

Añade un dict copiado o callback síncrono que recibe atributos actuales separados y devuelve otro dict. Los campos devueltos se combinan. Un callable async o entrada inválida produce FactoryConfigurationException; un resultado inválido produce FactoryDefinitionException.

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

Instala una Sequence y reinicia el índice a cero. Una entrada que no sea Sequence produce FactoryConfigurationException. Devuelve la misma factory.

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

Limpia el historial de self.fake.unique, sin volver a sembrar el RNG ni reiniciar la secuencia o los estados. Devuelve la misma factory.

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

Construye un modelo si count=1; en otro caso devuelve Collection. No accede a la base ni dispara eventos de persistencia. Los overrides prevalecen sobre estados y secuencia.

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

Guarda cada modelo mediante await save(). Misma cardinalidad que make; no abre transacción ni combina las inserciones en SQL masivo. Un veto produce FactoryPersistenceException; los errores SQL se propagan.

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

Devuelve Iterator[TModel]. Crea atributos al avanzar y mantiene ocupada la factory hasta agotar o cerrar el iterador.

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

Devuelve AsyncIterator[TModel]. Espera save antes de cada yield; cerrar el stream libera la factory, pero no revierte los registros ya guardados.

```python
from database.factories.product_factory import ProductFactory
from orionis.orm.factories import Sequence

async def run_example():
    return [model async for model in ProductFactory(seed=7).count(2).iterCreate()]
```

## Sequence

`Sequence(*entries)` requiere al menos un dict o callback síncrono. `resolve(index: int) -> dict[str, Any]` exige un índice entero no negativo y devuelve una copia de `entries[index % len(entries)]`; un callback recibe el índice absoluto, no la posición módulo. El objeto no guarda un contador: cada factory conserva el suyo, que avanza entre operaciones y se reinicia al llamar sequence(). Se validan claves string y se rechazan callbacks async.

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

`State` equivale a `dict[str, Any] | Callable[[dict[str, Any]], dict[str, Any]]`; `SequenceEntry` a `dict[str, Any] | Callable[[int], dict[str, Any]]`. Describen callbacks síncronos; no añaden conversión automática de awaitables.
<a id="factory-errors"></a>

## Errores y reproducibilidad

`FactoryConfigurationException` cubre modelo/locale/seed/count/estado/secuencia inválidos; `FactoryDefinitionException` cubre una definición o resultado que no sea un diccionario con claves string; `FactoryConcurrencyException` indica solapamiento; `FactoryPersistenceException` indica un veto de save. `FactoryDependencyException` existe como tipo público, pero esta implementación importa Faker directamente: no promete convertir un ImportError de Faker en esa excepción. Todas derivan de `FactoryException`. Una factory no captura y descarta errores de consultas.

La semilla reproduce una secuencia para la misma configuración y orden de llamadas; no congela resultados entre futuras actualizaciones de los proveedores. Los valores simulados no son contraseñas ni credenciales de producción. Si un modelo necesita una contraseña, genera su hash explícitamente fuera de definition() o pásalo como override ya preparado.

[Faker](/es/database/orm/faker) · [Seeders](/es/database/seeders) · [Testing](/es/database/orm/testing)
