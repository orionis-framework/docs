---
title: "Faker: proveedores Q–T"
description: "Firmas, parámetros, locales y ejemplos de los proveedores Q-T."
editUrl: true
lastUpdated: false
---

Esta referencia cubre 138 nombres de la fachada de Faker en el tramo Q-T. El conjunto completo contiene **675 métodos tipados** (694 firmas con overloads) y **7 helpers de backend accesibles en runtime**, repartidos alfabéticamente. La disponibilidad se contrastó con los 110 locales del backend instalado; un método puede estar disponible solo en determinados locales.

## Preparar los ejemplos

Estos ejemplos generan datos en memoria. No crean tablas ni insertan registros. Define una vez esta factory; después utiliza los fragmentos dentro de su `definition()`, un seeder o un servicio/controlador como se muestra en [Faker y datos simulados](/es/database/orm/faker).

```python
from orionis.orm import Integer, Model, String
from orionis.orm.factories import Factory


class SampleRecord(Model):
    id = Integer().primary().autoIncrement()
    value = String(180)
    timestamps = False
    fillable = ["value"]


class SampleFactory(Factory[SampleRecord]):
    model = SampleRecord

    def definition(self):
        return {"value": self.fake.word()}
```

Cada entrada selecciona un locale compatible verificado, muestra el contrato tipado y los valores predeterminados reales del backend. **`...` en la firma tipada significa default no especificado por el stub**, no un valor que debas pasar. Las firmas de runtime muestran el default concreto. Las variantes de locale se distinguen cuando cambian; los ejemplos conservan los nombres nativos de parámetros, aunque los métodos de la fachada usen camelCase.

Tipos como `T` y `TEnum` conservan el tipo de los valores o Enum recibidos; `Callable`, `Iterable`, `Sequence`, `Collection`, `Any`, `Decimal`, `UUID` y los tipos `datetime` pertenecen al contrato Python del proveedor. `Optional` permite None y `Literal` limita valores concretos. Los resultados no se convierten automáticamente a atributos ORM ni a JSON: aplica el cast/encoder apropiado.

Los métodos normalmente propagan errores de parámetros del backend (`TypeError`, `ValueError`, errores de formato). Si el locale no publica el nombre, la fachada produce `AttributeError`. `image` y `xml` requieren dependencias específicas, explicadas en sus entradas. Las vistas `unique` y `optional` se explican en la [guía de uso](/es/database/orm/faker); un resultado no hashable puede impedir aplicar unicidad. No hay garantía de que todos los métodos existan en cualquier locale.

## Índice del catálogo

[A-D](/es/database/orm/faker-reference-a-d) · [E-H](/es/database/orm/faker-reference-e-h) · [I-L](/es/database/orm/faker-reference-i-l) · [M-P](/es/database/orm/faker-reference-m-p) · [Q-T](/es/database/orm/faker-reference-q-t) · [U-Z](/es/database/orm/faker-reference-u-z)


<a id="faker-randomchoices"></a>

## `randomChoices`

Selecciona varios elementos con reemplazo; puede repetir resultados.

Contrato tipado de Orionis:

```text
def randomChoices(elements: Collection[T] | OrderedDict[T, float], length: int | None=...) -> Sequence[T]
def randomChoices(*, length: int | None=...) -> Sequence[str]
```

Firma real para `en_US`:

```text
fake.randomChoices(elements: Collection[~T] | collections.OrderedDict[~T, float] = ('a', 'b', 'c'), length: int | None = None) -> Sequence[~T]
```


| Parámetro | Propósito |
| --- | --- |
| `elements` | Población de valores; OrderedDict puede representar pesos. |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomChoices()
```

<a id="faker-randomcompanyacronym"></a>

## `randomCompanyAcronym`

`randomCompanyAcronym` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomCompanyAcronym() -> str
```

Firma real para `es_ES`:

```text
fake.randomCompanyAcronym() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `es_ES`, `en_PH`, `es`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.randomCompanyAcronym()
```

<a id="faker-randomcompanyadjective"></a>

## `randomCompanyAdjective`

`randomCompanyAdjective` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomCompanyAdjective() -> str
```

Firma real para `es_ES`:

```text
fake.randomCompanyAdjective() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `es_ES`, `en_PH`, `es`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.randomCompanyAdjective()
```

<a id="faker-randomcompanynounchain"></a>

## `randomCompanyNounChain`

`randomCompanyNounChain` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomCompanyNounChain() -> str
```

Firma real para `en_PH`:

```text
fake.randomCompanyNounChain() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.randomCompanyNounChain()
```

<a id="faker-randomcompanyproduct"></a>

## `randomCompanyProduct`

`randomCompanyProduct` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomCompanyProduct() -> str
```

Firma real para `en_PH`:

```text
fake.randomCompanyProduct() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.randomCompanyProduct()
```

<a id="faker-randomdigit"></a>

## `randomDigit`

`randomDigit` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomDigit() -> int
```

Firma real para `en_US`:

```text
fake.randomDigit() -> int
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigit()
```

<a id="faker-randomdigitabovetwo"></a>

## `randomDigitAboveTwo`

`randomDigitAboveTwo` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomDigitAboveTwo() -> int
```

Firma real para `en_US`:

```text
fake.randomDigitAboveTwo() -> int
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigitAboveTwo()
```

<a id="faker-randomdigitnotnull"></a>

## `randomDigitNotNull`

`randomDigitNotNull` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomDigitNotNull() -> int
```

Firma real para `en_US`:

```text
fake.randomDigitNotNull() -> int
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigitNotNull()
```

<a id="faker-randomdigitnotnullorempty"></a>

## `randomDigitNotNullOrEmpty`

`randomDigitNotNullOrEmpty` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomDigitNotNullOrEmpty() -> int | str
```

Firma real para `en_US`:

```text
fake.randomDigitNotNullOrEmpty() -> int | str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigitNotNullOrEmpty()
```

<a id="faker-randomdigitorempty"></a>

## `randomDigitOrEmpty`

`randomDigitOrEmpty` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomDigitOrEmpty() -> int | str
```

Firma real para `en_US`:

```text
fake.randomDigitOrEmpty() -> int | str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigitOrEmpty()
```

<a id="faker-randomelement"></a>

## `randomElement`

Selecciona un elemento de la población; OrderedDict admite pesos. Sin población usa los valores predeterminados del proveedor.

Contrato tipado de Orionis:

```text
def randomElement(elements: Collection[T] | OrderedDict[T, float]) -> T
def randomElement() -> str
```

Firma real para `en_US`:

```text
fake.randomElement(elements: Collection[~T] | collections.OrderedDict[~T, float] = ('a', 'b', 'c')) -> ~T
```


| Parámetro | Propósito |
| --- | --- |
| `elements` | Población de valores; OrderedDict puede representar pesos. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomElement()
```

<a id="faker-randomelements"></a>

## `randomElements`

Selecciona elementos; `unique` controla repetición y `use_weighting` ponderación cuando la población la admite.

Contrato tipado de Orionis:

```text
def randomElements(elements: Collection[T] | OrderedDict[T, float], length: int | None=..., unique: bool=..., use_weighting: bool | None=...) -> Sequence[T]
def randomElements(*, length: int | None=..., unique: bool=..., use_weighting: bool | None=...) -> Sequence[str]
```

Firma real para `en_US`:

```text
fake.randomElements(elements: Collection[~T] | collections.OrderedDict[~T, float] = ('a', 'b', 'c'), length: int | None = None, unique: bool = False, use_weighting: bool | None = None) -> Sequence[~T]
```


| Parámetro | Propósito |
| --- | --- |
| `elements` | Población de valores; OrderedDict puede representar pesos. |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |
| `unique` | Solicita selección sin valores repetidos dentro de esta llamada. |
| `use_weighting` | Activa ponderación donde el proveedor la soporta. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomElements()
```

<a id="faker-randomgoodserviceadjective"></a>

## `randomGoodServiceAdjective`

`randomGoodServiceAdjective` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomGoodServiceAdjective() -> str
```

Firma real para `fil_PH`:

```text
fake.randomGoodServiceAdjective() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.randomGoodServiceAdjective()
```

<a id="faker-randomgoodserviceadjectivechain"></a>

## `randomGoodServiceAdjectiveChain`

`randomGoodServiceAdjectiveChain` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomGoodServiceAdjectiveChain() -> str
```

Firma real para `fil_PH`:

```text
fake.randomGoodServiceAdjectiveChain() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.randomGoodServiceAdjectiveChain()
```

<a id="faker-randomint"></a>

## `randomInt`

Entero entre límites inclusivos `min`/`max`, usando `step`; útil para cantidades acotadas.

Contrato tipado de Orionis:

```text
def randomInt(min: int=..., max: int=..., step: int=...) -> int
```

Firma real para `en_US`:

```text
fake.randomInt(min: int = 0, max: int = 9999, step: int = 1) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `min` | Límite inferior inclusivo. |
| `max` | Límite superior inclusivo. |
| `step` | Paso de la selección entera. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomInt()
```

<a id="faker-randomletter"></a>

## `randomLetter`

`randomLetter` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomLetter() -> str
```

Firma real para `en_US`:

```text
fake.randomLetter() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomLetter()
```

<a id="faker-randomletters"></a>

## `randomLetters`

`randomLetters` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomLetters(length: int=...) -> Sequence[str]
```

Firma real para `en_US`:

```text
fake.randomLetters(length: int = 16) -> Sequence[str]
```


| Parámetro | Propósito |
| --- | --- |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomLetters()
```

<a id="faker-randomlowercaseletter"></a>

## `randomLowercaseLetter`

`randomLowercaseLetter` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomLowercaseLetter() -> str
```

Firma real para `en_US`:

```text
fake.randomLowercaseLetter() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomLowercaseLetter()
```

<a id="faker-randomnamecomplements"></a>

## `randomNameComplements`

`randomNameComplements` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomNameComplements() -> str
```

Firma real para `es_ES`:

```text
fake.randomNameComplements() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_ES`, `es`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.randomNameComplements()
```

<a id="faker-randomnounishgoodtrait"></a>

## `randomNounIshGoodTrait`

`randomNounIshGoodTrait` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomNounIshGoodTrait() -> str
```

Firma real para `fil_PH`:

```text
fake.randomNounIshGoodTrait() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.randomNounIshGoodTrait()
```

<a id="faker-randomnumber"></a>

## `randomNumber`

Entero con número de dígitos solicitado; `fix_len` exige longitud fija cuando está activo.

Contrato tipado de Orionis:

```text
def randomNumber(digits: int | None=..., fix_len: bool=...) -> int
```

Firma real para `en_US`:

```text
fake.randomNumber(digits: int | None = None, fix_len: bool = False) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `digits` | Número de dígitos del resultado. |
| `fix_len` | Exige la longitud de dígitos exacta. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomNumber()
```

<a id="faker-randomobjectname"></a>

## `randomObjectName`

`randomObjectName` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def randomObjectName() -> str
```

Firma real para `en_PH`:

```text
fake.randomObjectName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.randomObjectName()
```

<a id="faker-randomobjectofconcern"></a>

## `randomObjectOfConcern`

`randomObjectOfConcern` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def randomObjectOfConcern() -> str
```

Firma real para `fil_PH`:

```text
fake.randomObjectOfConcern() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.randomObjectOfConcern()
```

<a id="faker-randomsample"></a>

## `randomSample`

Muestra sin reemplazo de la población; pedir más elementos que los disponibles falla.

Contrato tipado de Orionis:

```text
def randomSample(elements: Collection[T] | OrderedDict[T, float], length: int | None=...) -> Sequence[T]
def randomSample(*, length: int | None=...) -> Sequence[str]
```

Firma real para `en_US`:

```text
fake.randomSample(elements: Collection[~T] | collections.OrderedDict[~T, float] = ('a', 'b', 'c'), length: int | None = None) -> Sequence[~T]
```


| Parámetro | Propósito |
| --- | --- |
| `elements` | Población de valores; OrderedDict puede representar pesos. |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomSample()
```

<a id="faker-randomuppercaseletter"></a>

## `randomUppercaseLetter`

`randomUppercaseLetter` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomUppercaseLetter() -> str
```

Firma real para `en_US`:

```text
fake.randomUppercaseLetter() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomUppercaseLetter()
```

<a id="faker-randomizenbelements"></a>

## `randomizeNbElements`

`randomizeNbElements` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def randomizeNbElements(number: int=..., le: bool=..., ge: bool=..., min: int | None=..., max: int | None=...) -> int
```

Firma real para `en_US`:

```text
fake.randomizeNbElements(number: int = 10, le: bool = False, ge: bool = False, min: int | None = None, max: int | None = None) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `number` | Cantidad de referencia sobre la que varía randomizeNbElements. |
| `le` | Impide resultados mayores que number en randomizeNbElements. |
| `ge` | Impide resultados menores que number en randomizeNbElements. |
| `min` | Límite inferior inclusivo. |
| `max` | Límite superior inclusivo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomizeNbElements()
```

<a id="faker-rcsnumber"></a>

## `rcsNumber`

`rcsNumber` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def rcsNumber(city: str=..., letter: str=..., siren: str=...) -> str
```

Firma real para `fr_CH`:

```text
fake.rcsNumber(city: str = '', letter: str = '', siren: str = '') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `city` | Ciudad usada en el número de registro mercantil. |
| `letter` | Letra utilizada en el registro mercantil simulado. |
| `siren` | SIREN incorporado al registro mercantil RCS. |

Disponibilidad verificada: 2 locales. Ejemplos de locales: `fr_CH`, `fr_FR`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.rcsNumber()
```

<a id="faker-rdnumber"></a>

## `rdNumber`

`rdNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def rdNumber() -> str
```

Firma real para `en_NZ`:

```text
fake.rdNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_NZ`.

```python
fake = SampleFactory(locale="en_NZ", seed=7).fake
value = fake.rdNumber()
```

<a id="faker-realcityname"></a>

## `realCityName`

`realCityName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def realCityName() -> str
```

Firma real para `hu_HU`:

```text
fake.realCityName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.realCityName()
```

<a id="faker-region"></a>

## `region`

`region` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def region() -> str
```

Firma real para `es_ES`:

```text
fake.region() -> str
```


Disponibilidad verificada: 8 locales. Ejemplos de locales: `es_ES`, `el_GR`, `es`, `es_CL`, `fr_FR`, `pl_PL`, `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.region()
```

<a id="faker-regioncode"></a>

## `regionCode`

`regionCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def regionCode() -> str
```

Firma real para `es_CL`:

```text
fake.regionCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.regionCode()
```

<a id="faker-regon"></a>

## `regon`

`regon` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def regon() -> str
```

Firma real para `pl_PL`:

```text
fake.regon() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.regon()
```

<a id="faker-rfc"></a>

## `rfc`

`rfc` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def rfc(natural: bool=...) -> str
```

Firma real para `es_MX`:

```text
fake.rfc(natural: bool = True) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `natural` | Selecciona RFC de persona natural en lugar de persona jurídica. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.rfc()
```

<a id="faker-rg"></a>

## `rg`

`rg` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def rg() -> str
```

Firma real para `pt_BR`:

```text
fake.rg() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.rg()
```

<a id="faker-rgbcolor"></a>

## `rgbColor`

`rgbColor` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def rgbColor() -> str
```

Firma real para `en_US`:

```text
fake.rgbColor() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.rgbColor()
```

<a id="faker-rgbcsscolor"></a>

## `rgbCssColor`

`rgbCssColor` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def rgbCssColor() -> str
```

Firma real para `en_US`:

```text
fake.rgbCssColor() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.rgbCssColor()
```

<a id="faker-ripeid"></a>

## `ripeId`

`ripeId` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def ripeId() -> str
```

Firma real para `en_US`:

```text
fake.ripeId() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ripeId()
```

<a id="faker-road"></a>

## `road`

`road` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def road() -> str
```

Firma real para `ko_KR`:

```text
fake.road() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.road()
```

<a id="faker-roadaddress"></a>

## `roadAddress`

`roadAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def roadAddress() -> str
```

Firma real para `ko_KR`:

```text
fake.roadAddress() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.roadAddress()
```

<a id="faker-roadname"></a>

## `roadName`

`roadName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def roadName() -> str
```

Firma real para `es_CL`:

```text
fake.roadName() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_CL`, `ko_KR`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.roadName()
```

<a id="faker-roadnumber"></a>

## `roadNumber`

`roadNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def roadNumber() -> str
```

Firma real para `ko_KR`:

```text
fake.roadNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.roadNumber()
```

<a id="faker-roadsuffix"></a>

## `roadSuffix`

`roadSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def roadSuffix() -> str
```

Firma real para `ko_KR`:

```text
fake.roadSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.roadSuffix()
```

<a id="faker-romanizedname"></a>

## `romanizedName`

`romanizedName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def romanizedName() -> str
```

Firma real para `ja_JP`:

```text
fake.romanizedName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `ja_JP`, `zh_CN`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.romanizedName()
```

<a id="faker-romanizednamefemale"></a>

## `romanizedNameFemale`

`romanizedNameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def romanizedNameFemale() -> str
```

Firma real para `ja_JP`:

```text
fake.romanizedNameFemale() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ja_JP`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.romanizedNameFemale()
```

<a id="faker-romanizednamemale"></a>

## `romanizedNameMale`

`romanizedNameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def romanizedNameMale() -> str
```

Firma real para `ja_JP`:

```text
fake.romanizedNameMale() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ja_JP`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.romanizedNameMale()
```

<a id="faker-rut"></a>

## `rut`

`rut` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def rut(min: int=..., max: int=...) -> str
```

Firma real para `es_CL`:

```text
fake.rut(min: int = 10, max: int = 99999999) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `min` | Límite inferior inclusivo. |
| `max` | Límite superior inclusivo. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.rut()
```

<a id="faker-rvnr"></a>

## `rvnr`

`rvnr` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def rvnr(birthdate: datetime.date | None=...) -> str
```

Firma real para `de_DE`:

```text
fake.rvnr(birthdate: datetime.date | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `birthdate` | Fecha de nacimiento usada al construir el identificador. |

Disponibilidad verificada: 2 locales. Ejemplos de locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.rvnr()
```

<a id="faker-safari"></a>

## `safari`

`safari` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def safari() -> str
```

Firma real para `en_US`:

```text
fake.safari() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safari()
```

<a id="faker-safecolorname"></a>

## `safeColorName`

`safeColorName` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def safeColorName() -> str
```

Firma real para `en_US`:

```text
fake.safeColorName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safeColorName()
```

<a id="faker-safedomainname"></a>

## `safeDomainName`

`safeDomainName` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def safeDomainName() -> str
```

Firma real para `en_US`:

```text
fake.safeDomainName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safeDomainName()
```

<a id="faker-safeemail"></a>

## `safeEmail`

`safeEmail` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def safeEmail() -> str
```

Firma real para `en_US`:

```text
fake.safeEmail() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safeEmail()
```

<a id="faker-safehexcolor"></a>

## `safeHexColor`

`safeHexColor` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def safeHexColor() -> str
```

Firma real para `en_US`:

```text
fake.safeHexColor() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safeHexColor()
```

<a id="faker-sbn9"></a>

## `sbn9`

`sbn9` genera códigos de libros para catálogos.

Contrato tipado de Orionis:

```text
def sbn9(separator: str=...) -> str
```

Firma real para `en_US`:

```text
fake.sbn9(separator: str = '-') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `separator` | Separador textual del formato. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sbn9()
```

<a id="faker-secondaryaddress"></a>

## `secondaryAddress`

`secondaryAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def secondaryAddress() -> str
```

Firma real para `en_US`:

```text
fake.secondaryAddress() -> str
```


Disponibilidad verificada: 64 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.secondaryAddress()
```

<a id="faker-sectionnumber"></a>

## `sectionNumber`

`sectionNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def sectionNumber() -> str
```

Firma real para `zh_TW`:

```text
fake.sectionNumber() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `zh_TW`, `zu_ZA`.

```python
fake = SampleFactory(locale="zh_TW", seed=7).fake
value = fake.sectionNumber()
```

<a id="faker-sentence"></a>

## `sentence`

`sentence` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def sentence(nb_words: int=..., variable_nb_words: bool=..., ext_word_list: Sequence[str] | None=...) -> str
```

Firma real para `en_US`:

```text
fake.sentence(nb_words: int = 6, variable_nb_words: bool = True, ext_word_list: Sequence[str] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `nb_words` | Número objetivo de palabras. |
| `variable_nb_words` | Permite variar el número objetivo de palabras. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sentence()
```

<a id="faker-sentences"></a>

## `sentences`

`sentences` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def sentences(nb: int=..., ext_word_list: Sequence[str] | None=...) -> list[str]
```

Firma real para `en_US`:

```text
fake.sentences(nb: int = 3, ext_word_list: Sequence[str] | None = None) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `nb` | Cantidad de resultados solicitados. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sentences()
```

<a id="faker-serialnumber"></a>

## `serialNumber`

`serialNumber` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def serialNumber() -> str
```

Firma real para `ja_JP`:

```text
fake.serialNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.serialNumber()
```

<a id="faker-servicephonenumber"></a>

## `servicePhoneNumber`

`servicePhoneNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def servicePhoneNumber() -> str
```

Firma real para `ar_AE`:

```text
fake.servicePhoneNumber() -> str
```


Disponibilidad verificada: 4 locales. Ejemplos de locales: `ar_AE`, `ar_JO`, `ar_PS`, `pt_BR`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.servicePhoneNumber()
```

<a id="faker-setarguments"></a>

## `setArguments`

Configura un argumento (group, argument, value) o reemplaza un grupo pasando dict como segundo argumento, aunque la anotación nativa declare str. Retorna None; otro tipo de argumento produce ValueError.

Helper accesible por el despacho dinámico de la fachada; no está declarado en `_ProviderMethods`.

Firma real para `en_US`:

```text
fake.setArguments(group: str, argument: str, value: Any | None = None) -> None
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
fake.setArguments("small", "min_value", 1)
fake.setArguments("small", "max_value", 3)
value = fake.parse("{{pyint:small}}")
```

<a id="faker-settlement"></a>

## `settlement`

`settlement` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def settlement() -> str
```

Firma real para `az_AZ`:

```text
fake.settlement() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.settlement()
```

<a id="faker-settlementsuffix"></a>

## `settlementSuffix`

`settlementSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def settlementSuffix() -> str
```

Firma real para `az_AZ`:

```text
fake.settlementSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.settlementSuffix()
```

<a id="faker-sha1"></a>

## `sha1`

Digest SHA-1 de datos aleatorios para fixtures; no es hashing de contraseñas.

Contrato tipado de Orionis:

```text
def sha1() -> str
def sha1(raw_output: Literal[True]) -> bytes
def sha1(raw_output: Literal[False]) -> str
```

Firma real para `en_US`:

```text
fake.sha1(raw_output: bool = False) -> bytes | str
```


| Parámetro | Propósito |
| --- | --- |
| `raw_output` | Solicita la representación binaria/nativa en vez del texto habitual. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sha1()
```

<a id="faker-sha256"></a>

## `sha256`

Digest SHA-256 de datos aleatorios para fixtures; no es hashing de contraseñas.

Contrato tipado de Orionis:

```text
def sha256() -> str
def sha256(raw_output: Literal[True]) -> bytes
def sha256(raw_output: Literal[False]) -> str
```

Firma real para `en_US`:

```text
fake.sha256(raw_output: bool = False) -> bytes | str
```


| Parámetro | Propósito |
| --- | --- |
| `raw_output` | Solicita la representación binaria/nativa en vez del texto habitual. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sha256()
```

<a id="faker-simpleprofile"></a>

## `simpleProfile`

`simpleProfile` genera perfiles compuestos para fixtures.

Contrato tipado de Orionis:

```text
def simpleProfile(sex: Literal['M', 'F', 'X'] | None=...) -> dict[str, str | datetime.date | Literal['M', 'F', 'X']]
```

Firma real para `en_US`:

```text
fake.simpleProfile(sex: Literal['M', 'F', 'X'] | None = None) -> Dict[str, str | datetime.date | Literal['M', 'F', 'X']]
```


| Parámetro | Propósito |
| --- | --- |
| `sex` | Selección de sexo según los valores locales admitidos. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.simpleProfile()
```

<a id="faker-siren"></a>

## `siren`

`siren` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def siren() -> str
```

Firma real para `fr_CH`:

```text
fake.siren() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `fr_CH`, `fr_FR`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.siren()
```

<a id="faker-siret"></a>

## `siret`

`siret` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def siret(max_sequential_digits: int=...) -> str
```

Firma real para `fr_CH`:

```text
fake.siret(max_sequential_digits: int = 2) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `max_sequential_digits` | Máximo de dígitos secuenciales SIRET, entre 1 y 4; un valor inválido se normaliza a 2. |

Disponibilidad verificada: 2 locales. Ejemplos de locales: `fr_CH`, `fr_FR`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.siret()
```

<a id="faker-slug"></a>

## `slug`

`slug` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def slug(value: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.slug(value: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `value` | Texto de origen que se normalizará como slug. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.slug()
```

<a id="faker-smartmobilenumber"></a>

## `smartMobileNumber`

`smartMobileNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def smartMobileNumber() -> str
```

Firma real para `en_PH`:

```text
fake.smartMobileNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.smartMobileNumber()
```

<a id="faker-smartmobilenumberprefix"></a>

## `smartMobileNumberPrefix`

`smartMobileNumberPrefix` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def smartMobileNumberPrefix() -> str
```

Firma real para `en_PH`:

```text
fake.smartMobileNumberPrefix() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.smartMobileNumberPrefix()
```

<a id="faker-snils"></a>

## `snils`

`snils` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def snils() -> str
```

Firma real para `ru_RU`:

```text
fake.snils() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.snils()
```

<a id="faker-spaceobjectname"></a>

## `spaceObjectName`

`spaceObjectName` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def spaceObjectName() -> str
```

Firma real para `en_PH`:

```text
fake.spaceObjectName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.spaceObjectName()
```

<a id="faker-specialcode"></a>

## `specialCode`

`specialCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def specialCode() -> str
```

Firma real para `es_CL`:

```text
fake.specialCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.specialCode()
```

<a id="faker-ssn"></a>

## `ssn`

`ssn` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def ssn(taxpayer_identification_number_type: str=...) -> str
```

Firma real para `en_US`:

```text
fake.ssn(taxpayer_identification_number_type: str = 'SSN') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `taxpayer_identification_number_type` | Tipo de identificador fiscal que genera el locale; en en_US el predeterminado es SSN. |
| `birthdate` | Fecha de nacimiento usada al construir el identificador. |
| `min_age` | Edad mínima del titular del identificador local. |
| `max_age` | Edad máxima del titular del identificador local. |
| `artificial` | Selecciona el indicador artificial del identificador cuando el locale lo permite. |
| `dob` | Fecha de nacimiento utilizada para formar el identificador local. |
| `gender` | Selección de género según los valores locales admitidos. |
| `long` | Solicita la variante larga del identificador local. |
| `dash` | Incluye guion en la representación del identificador. |
| `birthday` | Fecha de nacimiento de referencia para el pasaporte. |
| `area_code` | Código de área utilizado para formar el identificador local. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG` y 46 más:

```text
fake.ssn(taxpayer_identification_number_type: str = 'SSN') -> str
```

`ar_DZ`, `az_AZ`, `bg_BG`, `bn_BD`, `cs_CZ`, `de` y 43 más:

```text
fake.ssn() -> str
```

`de_AT`:

```text
fake.ssn(birthdate: datetime.date | None = None) -> str
```

`et_EE`:

```text
fake.ssn(min_age: int = 16, max_age: int = 90) -> str
```

`fi_FI`:

```text
fake.ssn(min_age: int = 0, max_age: int = 105, artificial: bool = False) -> str
```

`hu_HU`, `no_NO`:

```text
fake.ssn(dob: str | None = None, gender: Literal['M', 'F', 'X'] | None = None) -> str
```

`lv_LV`:

```text
fake.ssn(min_age: int = 0, max_age: int = 105) -> str
```

`sv_SE`:

```text
fake.ssn(min_age: int = 18, max_age: int = 90, long: bool = False, dash: bool = True) -> str
```

`uk_UA`:

```text
fake.ssn(birthday: str | None = None, gender: Literal['M', 'F', 'X'] | None = None) -> str
```

`zh_CN`:

```text
fake.ssn(min_age: int = 18, max_age: int = 90, gender: Literal['M', 'F', 'X'] | None = None, area_code: str = '') -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ssn()
```

<a id="faker-sss"></a>

## `sss`

`sss` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def sss() -> str
```

Firma real para `en_PH`:

```text
fake.sss() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.sss()
```

<a id="faker-standalonebuildingnumber"></a>

## `standaloneBuildingNumber`

`standaloneBuildingNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def standaloneBuildingNumber() -> str
```

Firma real para `en_PH`:

```text
fake.standaloneBuildingNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.standaloneBuildingNumber()
```

<a id="faker-startdigit"></a>

## `startDigit`

`startDigit` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def startDigit() -> str
```

Firma real para `az_AZ`:

```text
fake.startDigit() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.startDigit()
```

<a id="faker-state"></a>

## `state`

`state` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def state() -> str
```

Firma real para `en_US`:

```text
fake.state() -> str
```


Disponibilidad verificada: 72 locales. Ejemplos de locales: `en_US`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.state()
```

<a id="faker-stateabbr"></a>

## `stateAbbr`

`stateAbbr` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def stateAbbr(include_territories: bool=..., include_freely_associated_states: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.stateAbbr(include_territories: bool = True, include_freely_associated_states: bool = True) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `include_territories` | Incluye territorios estadounidenses en la selección. |
| `include_freely_associated_states` | Incluye estados en libre asociación en el conjunto de estados. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG` y 39 más:

```text
fake.stateAbbr(include_territories: bool = True, include_freely_associated_states: bool = True) -> str
```

`en_AU`, `es_MX`, `hy_AM`, `id_ID`, `it_IT`, `pt_BR` y 2 más:

```text
fake.stateAbbr() -> str
```

Disponibilidad verificada: 53 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.stateAbbr()
```

<a id="faker-statename"></a>

## `stateName`

`stateName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def stateName() -> str
```

Firma real para `es_ES`:

```text
fake.stateName() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_ES`, `es`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.stateName()
```

<a id="faker-street"></a>

## `street`

`street` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def street() -> str
```

Firma real para `az_AZ`:

```text
fake.street() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `az_AZ`, `el_GR`, `hy_AM`, `id_ID`, `vi_VN`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.street()
```

<a id="faker-streetaddress"></a>

## `streetAddress`

`streetAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetAddress() -> str
```

Firma real para `en_US`:

```text
fake.streetAddress() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.streetAddress()
```

<a id="faker-streetaddresswithcounty"></a>

## `streetAddressWithCounty`

`streetAddressWithCounty` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetAddressWithCounty() -> str
```

Firma real para `hu_HU`:

```text
fake.streetAddressWithCounty() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.streetAddressWithCounty()
```

<a id="faker-streetmunicipality"></a>

## `streetMunicipality`

`streetMunicipality` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetMunicipality() -> str
```

Firma real para `es_AR`:

```text
fake.streetMunicipality() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.streetMunicipality()
```

<a id="faker-streetname"></a>

## `streetName`

`streetName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetName() -> str
```

Firma real para `en_US`:

```text
fake.streetName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.streetName()
```

<a id="faker-streetnameadjectivefeminine"></a>

## `streetNameAdjectiveFeminine`

`streetNameAdjectiveFeminine` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetNameAdjectiveFeminine() -> str
```

Firma real para `pl_PL`:

```text
fake.streetNameAdjectiveFeminine() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetNameAdjectiveFeminine()
```

<a id="faker-streetnamesuffix"></a>

## `streetNameSuffix`

`streetNameSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetNameSuffix() -> str
```

Firma real para `zh_TW`:

```text
fake.streetNameSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `zh_TW`.

```python
fake = SampleFactory(locale="zh_TW", seed=7).fake
value = fake.streetNameSuffix()
```

<a id="faker-streetnameuniversal"></a>

## `streetNameUniversal`

`streetNameUniversal` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetNameUniversal() -> str
```

Firma real para `pl_PL`:

```text
fake.streetNameUniversal() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetNameUniversal()
```

<a id="faker-streetprefix"></a>

## `streetPrefix`

`streetPrefix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetPrefix() -> str
```

Firma real para `es_CO`:

```text
fake.streetPrefix() -> str
```


Disponibilidad verificada: 24 locales. Ejemplos de locales: `es_CO`, `es_ES`, `ar_DZ`, `el_GR`, `en_MS`, `es`, `es_AR`, `es_CL`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.streetPrefix()
```

<a id="faker-streetprefixfeminine"></a>

## `streetPrefixFeminine`

`streetPrefixFeminine` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetPrefixFeminine() -> str
```

Firma real para `pl_PL`:

```text
fake.streetPrefixFeminine() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetPrefixFeminine()
```

<a id="faker-streetprefixfeminineshort"></a>

## `streetPrefixFeminineShort`

`streetPrefixFeminineShort` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetPrefixFeminineShort() -> str
```

Firma real para `pl_PL`:

```text
fake.streetPrefixFeminineShort() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetPrefixFeminineShort()
```

<a id="faker-streetprefixlong"></a>

## `streetPrefixLong`

`streetPrefixLong` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetPrefixLong() -> str
```

Firma real para `el_GR`:

```text
fake.streetPrefixLong() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `el_GR`, `id_ID`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.streetPrefixLong()
```

<a id="faker-streetprefixmasculine"></a>

## `streetPrefixMasculine`

`streetPrefixMasculine` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetPrefixMasculine() -> str
```

Firma real para `pl_PL`:

```text
fake.streetPrefixMasculine() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetPrefixMasculine()
```

<a id="faker-streetprefixmasculineshort"></a>

## `streetPrefixMasculineShort`

`streetPrefixMasculineShort` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetPrefixMasculineShort() -> str
```

Firma real para `pl_PL`:

```text
fake.streetPrefixMasculineShort() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetPrefixMasculineShort()
```

<a id="faker-streetprefixshort"></a>

## `streetPrefixShort`

`streetPrefixShort` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetPrefixShort() -> str
```

Firma real para `el_GR`:

```text
fake.streetPrefixShort() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `el_GR`, `id_ID`, `pl_PL`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.streetPrefixShort()
```

<a id="faker-streetprocer"></a>

## `streetProcer`

`streetProcer` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetProcer() -> str
```

Firma real para `es_AR`:

```text
fake.streetProcer() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.streetProcer()
```

<a id="faker-streetprovince"></a>

## `streetProvince`

`streetProvince` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetProvince() -> str
```

Firma real para `es_AR`:

```text
fake.streetProvince() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.streetProvince()
```

<a id="faker-streetsuffix"></a>

## `streetSuffix`

`streetSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetSuffix() -> str
```

Firma real para `en_US`:

```text
fake.streetSuffix() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.streetSuffix()
```

<a id="faker-streetsuffixlong"></a>

## `streetSuffixLong`

`streetSuffixLong` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetSuffixLong() -> str
```

Firma real para `cs_CZ`:

```text
fake.streetSuffixLong() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `cs_CZ`, `de`, `de_AT`, `de_DE`, `sk_SK`.

```python
fake = SampleFactory(locale="cs_CZ", seed=7).fake
value = fake.streetSuffixLong()
```

<a id="faker-streetsuffixshort"></a>

## `streetSuffixShort`

`streetSuffixShort` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetSuffixShort() -> str
```

Firma real para `cs_CZ`:

```text
fake.streetSuffixShort() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `cs_CZ`, `de`, `de_AT`, `de_DE`, `sk_SK`.

```python
fake = SampleFactory(locale="cs_CZ", seed=7).fake
value = fake.streetSuffixShort()
```

<a id="faker-streettitle"></a>

## `streetTitle`

`streetTitle` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def streetTitle() -> str
```

Firma real para `he_IL`:

```text
fake.streetTitle() -> str
```


Disponibilidad verificada: 4 locales. Ejemplos de locales: `he_IL`, `ka_GE`, `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="he_IL", seed=7).fake
value = fake.streetTitle()
```

<a id="faker-substreet"></a>

## `subStreet`

`subStreet` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def subStreet() -> str
```

Firma real para `vi_VN`:

```text
fake.subStreet() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.subStreet()
```

<a id="faker-substreetprefix"></a>

## `subStreetPrefix`

`subStreetPrefix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def subStreetPrefix() -> str
```

Firma real para `vi_VN`:

```text
fake.subStreetPrefix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.subStreetPrefix()
```

<a id="faker-subdivisionblocknumber"></a>

## `subdivisionBlockNumber`

`subdivisionBlockNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def subdivisionBlockNumber() -> str
```

Firma real para `en_PH`:

```text
fake.subdivisionBlockNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionBlockNumber()
```

<a id="faker-subdivisionlotnumber"></a>

## `subdivisionLotNumber`

`subdivisionLotNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def subdivisionLotNumber() -> str
```

Firma real para `en_PH`:

```text
fake.subdivisionLotNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionLotNumber()
```

<a id="faker-subdivisionname"></a>

## `subdivisionName`

`subdivisionName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def subdivisionName() -> str
```

Firma real para `en_PH`:

```text
fake.subdivisionName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionName()
```

<a id="faker-subdivisionnamesuffix"></a>

## `subdivisionNameSuffix`

`subdivisionNameSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def subdivisionNameSuffix() -> str
```

Firma real para `en_PH`:

```text
fake.subdivisionNameSuffix() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionNameSuffix()
```

<a id="faker-subdivisionunitnumber"></a>

## `subdivisionUnitNumber`

`subdivisionUnitNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def subdivisionUnitNumber() -> str
```

Firma real para `en_PH`:

```text
fake.subdivisionUnitNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionUnitNumber()
```

<a id="faker-suffix"></a>

## `suffix`

`suffix` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def suffix() -> str
```

Firma real para `en_US`:

```text
fake.suffix() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.suffix()
```

<a id="faker-suffixfemale"></a>

## `suffixFemale`

`suffixFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def suffixFemale() -> str
```

Firma real para `en_US`:

```text
fake.suffixFemale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.suffixFemale()
```

<a id="faker-suffixmale"></a>

## `suffixMale`

`suffixMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def suffixMale() -> str
```

Firma real para `en_US`:

```text
fake.suffixMale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.suffixMale()
```

<a id="faker-suffixnonbinary"></a>

## `suffixNonbinary`

`suffixNonbinary` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def suffixNonbinary() -> str
```

Firma real para `en_US`:

```text
fake.suffixNonbinary() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.suffixNonbinary()
```

<a id="faker-sunmobilenumber"></a>

## `sunMobileNumber`

`sunMobileNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def sunMobileNumber() -> str
```

Firma real para `en_PH`:

```text
fake.sunMobileNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.sunMobileNumber()
```

<a id="faker-sunmobilenumberprefix"></a>

## `sunMobileNumberPrefix`

`sunMobileNumberPrefix` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def sunMobileNumberPrefix() -> str
```

Firma real para `en_PH`:

```text
fake.sunMobileNumberPrefix() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.sunMobileNumberPrefix()
```

<a id="faker-swift"></a>

## `swift`

`swift` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def swift(length: int | None=..., primary: bool=..., use_dataset: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.swift(length: int | None = None, primary: bool = False, use_dataset: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |
| `primary` | En SWIFT de 11 caracteres usa la sede principal con sufijo XXX. |
| `use_dataset` | Utiliza códigos SWIFT del dataset local si existen; si faltan genera componentes aleatorios. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 103 más:

```text
fake.swift(length: int | None = None, primary: bool = False, use_dataset: bool = False) -> str
```

`bn_BD`:

```text
fake.swift(length: int | None = None, primary: bool = False, use_dataset: bool = True) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.swift()
```

<a id="faker-swift11"></a>

## `swift11`

`swift11` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def swift11(primary: bool=..., use_dataset: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.swift11(primary: bool = False, use_dataset: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `primary` | En SWIFT de 11 caracteres usa la sede principal con sufijo XXX. |
| `use_dataset` | Utiliza códigos SWIFT del dataset local si existen; si faltan genera componentes aleatorios. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 103 más:

```text
fake.swift11(primary: bool = False, use_dataset: bool = False) -> str
```

`bn_BD`:

```text
fake.swift11(primary: bool = False, use_dataset: bool = True) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.swift11()
```

<a id="faker-swift8"></a>

## `swift8`

`swift8` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def swift8(use_dataset: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.swift8(use_dataset: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `use_dataset` | Utiliza códigos SWIFT del dataset local si existen; si faltan genera componentes aleatorios. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 103 más:

```text
fake.swift8(use_dataset: bool = False) -> str
```

`bn_BD`:

```text
fake.swift8(use_dataset: bool = True) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.swift8()
```

<a id="faker-tambon"></a>

## `tambon`

`tambon` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def tambon() -> str
```

Firma real para `th_TH`:

```text
fake.tambon() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.tambon()
```

<a id="faker-tar"></a>

## `tar`

Genera bytes de un archivo TAR en memoria, con tamaño/número de archivos y compresión configurables. No escribe al disco.

Contrato tipado de Orionis:

```text
def tar(uncompressed_size: int=..., num_files: int=..., min_file_size: int=..., compression: str | None=...) -> bytes
```

Firma real para `en_US`:

```text
fake.tar(uncompressed_size: int = 65536, num_files: int = 1, min_file_size: int = 4096, compression: str | None = None) -> bytes
```


| Parámetro | Propósito |
| --- | --- |
| `uncompressed_size` | Tamaño total sin comprimir en bytes. |
| `num_files` | Número de archivos dentro del contenedor. |
| `min_file_size` | Tamaño mínimo en bytes por archivo. |
| `compression` | Algoritmo nativo de compresión o None. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.tar(uncompressed_size=128, min_file_size=64, num_files=1)
```

<a id="faker-tereoending"></a>

## `teReoEnding`

`teReoEnding` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def teReoEnding() -> str
```

Firma real para `en_NZ`:

```text
fake.teReoEnding() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_NZ`.

```python
fake = SampleFactory(locale="en_NZ", seed=7).fake
value = fake.teReoEnding()
```

<a id="faker-tereofirst"></a>

## `teReoFirst`

`teReoFirst` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def teReoFirst() -> str
```

Firma real para `en_NZ`:

```text
fake.teReoFirst() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_NZ`.

```python
fake = SampleFactory(locale="en_NZ", seed=7).fake
value = fake.teReoFirst()
```

<a id="faker-tereopart"></a>

## `teReoPart`

`teReoPart` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def teReoPart() -> str
```

Firma real para `en_NZ`:

```text
fake.teReoPart() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_NZ`.

```python
fake = SampleFactory(locale="en_NZ", seed=7).fake
value = fake.teReoPart()
```

<a id="faker-telephonenumber"></a>

## `telephoneNumber`

`telephoneNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def telephoneNumber() -> str
```

Firma real para `ar_AE`:

```text
fake.telephoneNumber() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `ar_AE`, `ar_DZ`, `ar_JO`, `ar_PS`, `fr_DZ`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.telephoneNumber()
```

<a id="faker-telephoneprovidercode"></a>

## `telephoneProviderCode`

`telephoneProviderCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def telephoneProviderCode() -> str
```

Firma real para `ar_AE`:

```text
fake.telephoneProviderCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ar_AE`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.telephoneProviderCode()
```

<a id="faker-text"></a>

## `text`

`text` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def text(max_nb_chars: int=..., ext_word_list: Sequence[str] | None=...) -> str
```

Firma real para `en_US`:

```text
fake.text(max_nb_chars: int = 200, ext_word_list: Sequence[str] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `max_nb_chars` | Máximo de caracteres del texto solicitado. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.text(max_nb_chars=80)
```

<a id="faker-texts"></a>

## `texts`

`texts` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def texts(nb_texts: int=..., max_nb_chars: int=..., ext_word_list: Sequence[str] | None=...) -> list[str]
```

Firma real para `en_US`:

```text
fake.texts(nb_texts: int = 3, max_nb_chars: int = 200, ext_word_list: Sequence[str] | None = None) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `nb_texts` | Número de textos a devolver. |
| `max_nb_chars` | Máximo de caracteres del texto solicitado. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.texts(nb_texts=2, max_nb_chars=80)
```

<a id="faker-time"></a>

## `time`

`time` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def time(pattern: str=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> str
```

Firma real para `en_US`:

```text
fake.time(pattern: str = '%H:%M:%S', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `pattern` | Patrón de formato aceptado por el proveedor. |
| `end_datetime` | Límite final datetime del intervalo. |
| `thai_digit` | Usa dígitos tailandeses en la representación del proveedor. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 102 más:

```text
fake.time(pattern: str = '%H:%M:%S', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> str
```

`th`, `th_TH`:

```text
fake.time(pattern: str = '%H:%M:%S', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, thai_digit: bool = False) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.time()
```

<a id="faker-timedelta"></a>

## `timeDelta`

`timeDelta` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def timeDelta(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.timedelta
```

Firma real para `en_US`:

```text
fake.timeDelta(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.timedelta
```


| Parámetro | Propósito |
| --- | --- |
| `end_datetime` | Límite final datetime del intervalo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.timeDelta()
```

<a id="faker-timeobject"></a>

## `timeObject`

`timeObject` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def timeObject(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.time
```

Firma real para `en_US`:

```text
fake.timeObject(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.time
```


| Parámetro | Propósito |
| --- | --- |
| `end_datetime` | Límite final datetime del intervalo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.timeObject()
```

<a id="faker-timeseries"></a>

## `timeSeries`

Genera un iterador de pares (datetime, valor). El ejemplo lo consume con list y usa precision en segundos para acotar los puntos.

Contrato tipado de Orionis:

```text
def timeSeries(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., precision: float | None=..., distrib: Callable[[datetime.datetime], float] | None=..., tzinfo: datetime.tzinfo | None=...) -> Iterator[tuple[datetime.datetime, Any]]
```

Firma real para `en_US`:

```text
fake.timeSeries(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30d', end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = 'now', precision: float | None = None, distrib: Callable[[datetime.datetime], float] | None = None, tzinfo: datetime.tzinfo | None = None) -> Iterator[Tuple[datetime.datetime, Any]]
```


| Parámetro | Propósito |
| --- | --- |
| `start_date` | Extremo inicial: fecha/hora, intervalo relativo o formato admitido por el proveedor. |
| `end_date` | Extremo final de fecha/hora o intervalo relativo. |
| `precision` | Intervalo de puntos de la serie temporal en segundos. |
| `distrib` | Callable que calcula el valor para cada datetime. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = list(fake.timeSeries(start_date="-2d", end_date="now", precision=86400))
```

<a id="faker-timezone"></a>

## `timezone`

`timezone` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def timezone() -> str
```

Firma real para `en_US`:

```text
fake.timezone() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.timezone()
```

<a id="faker-tin"></a>

## `tin`

`tin` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def tin() -> str
```

Firma real para `el_GR`:

```text
fake.tin() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `el_GR`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.tin()
```

<a id="faker-tld"></a>

## `tld`

`tld` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def tld() -> str
```

Firma real para `en_US`:

```text
fake.tld() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.tld()
```

<a id="faker-tollnumber"></a>

## `tollNumber`

`tollNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def tollNumber() -> str
```

Firma real para `ar_AE`:

```text
fake.tollNumber() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ar_AE`, `ar_PS`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.tollNumber()
```

<a id="faker-town"></a>

## `town`

`town` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def town() -> str
```

Firma real para `bn_BD`:

```text
fake.town() -> str
```


Disponibilidad verificada: 4 locales. Ejemplos de locales: `bn_BD`, `en_BD`, `ja_JP`, `ko_KR`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.town()
```

<a id="faker-townsuffix"></a>

## `townSuffix`

`townSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def townSuffix() -> str
```

Firma real para `ko_KR`:

```text
fake.townSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.townSuffix()
```

<a id="faker-traditionalmonthname"></a>

## `traditionalMonthName`

`traditionalMonthName` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def traditionalMonthName() -> str
```

Firma real para `ja_JP`:

```text
fake.traditionalMonthName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.traditionalMonthName()
```

<a id="faker-tsv"></a>

## `tsv`

`tsv` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def tsv(header: Sequence[str] | None=..., data_columns: tuple[str, str]=..., num_rows: int=..., include_row_ids: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.tsv(header: Sequence[str] | None = None, data_columns: Tuple[str, str] = ('{{name}}', '{{address}}'), num_rows: int = 10, include_row_ids: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `header` | Encabezados de columnas o None para omitirlos. |
| `data_columns` | Definición de estructura, columnas o tokens generadores. |
| `num_rows` | Cantidad de filas de datos serializados. |
| `include_row_ids` | Añade identificador secuencial de fila. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.tsv(num_rows=2)
```
