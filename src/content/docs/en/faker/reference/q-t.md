---
title: "Faker: providers Q–T"
description: "Signatures, parameters, locales and examples for providers Q-T."
editUrl: true
lastUpdated: false
---

This reference covers 138 facade names in the Q-T range. The whole catalog contains **675 typed methods** (694 signatures including overloads) and **7 backend helpers accessible at runtime**, organized alphabetically. Availability was checked against the installed backend's 110 locales; some methods only exist for specific locales.

## Preparing examples

Examples generate values in memory. They neither create tables nor insert records. Define this factory once, then use snippets inside its `definition()`, a seeder or a service/controller as shown in [Faker and simulated data](/en/faker).

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

Each entry selects a verified compatible locale, presents the typed contract and the backend's actual defaults. **`...` in a typed signature means the stub does not specify that default**, not a value to pass. Runtime signatures show concrete defaults. Locale variants are distinguished when they differ; examples retain native parameter names while facade methods use camelCase.

Types `T` and `TEnum` preserve received value/Enum types; `Callable`, `Iterable`, `Sequence`, `Collection`, `Any`, `Decimal`, `UUID` and `datetime` types belong to the provider's Python contract. `Optional` permits None and `Literal` restricts concrete values. Results are not automatically converted to ORM attributes or JSON: apply the appropriate cast/encoder.

Methods ordinarily propagate backend parameter errors (`TypeError`, `ValueError`, formatting errors). If a locale does not publish a name, the facade raises `AttributeError`. `image` and `xml` need specific dependencies explained in their entries. See the [usage guide](/en/faker) for `unique` and `optional`; unhashable results can prevent uniqueness checks. No claim is made that every method exists for every locale.

## Catalog index

[A-D](/en/faker/reference/a-d) · [E-H](/en/faker/reference/e-h) · [I-L](/en/faker/reference/i-l) · [M-P](/en/faker/reference/m-p) · [Q-T](/en/faker/reference/q-t) · [U-Z](/en/faker/reference/u-z)


<a id="faker-randomchoices"></a>

## `randomChoices`

Selects several elements with replacement; results may repeat.

Orionis typed contract:

```text
def randomChoices(elements: Collection[T] | OrderedDict[T, float], length: int | None=...) -> Sequence[T]
def randomChoices(*, length: int | None=...) -> Sequence[str]
```

Actual signature for `en_US`:

```text
fake.randomChoices(elements: Collection[~T] | collections.OrderedDict[~T, float] = ('a', 'b', 'c'), length: int | None = None) -> Sequence[~T]
```


| Parameter | Purpose |
| --- | --- |
| `elements` | Value population; OrderedDict can represent weights. |
| `length` | Value length/size; units depend on this provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomChoices()
```

<a id="faker-randomcompanyacronym"></a>

## `randomCompanyAcronym`

`randomCompanyAcronym` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomCompanyAcronym() -> str
```

Actual signature for `es_ES`:

```text
fake.randomCompanyAcronym() -> str
```


Verified availability: 5 locales. Example locales: `es_ES`, `en_PH`, `es`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.randomCompanyAcronym()
```

<a id="faker-randomcompanyadjective"></a>

## `randomCompanyAdjective`

`randomCompanyAdjective` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomCompanyAdjective() -> str
```

Actual signature for `es_ES`:

```text
fake.randomCompanyAdjective() -> str
```


Verified availability: 5 locales. Example locales: `es_ES`, `en_PH`, `es`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.randomCompanyAdjective()
```

<a id="faker-randomcompanynounchain"></a>

## `randomCompanyNounChain`

`randomCompanyNounChain` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomCompanyNounChain() -> str
```

Actual signature for `en_PH`:

```text
fake.randomCompanyNounChain() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.randomCompanyNounChain()
```

<a id="faker-randomcompanyproduct"></a>

## `randomCompanyProduct`

`randomCompanyProduct` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomCompanyProduct() -> str
```

Actual signature for `en_PH`:

```text
fake.randomCompanyProduct() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.randomCompanyProduct()
```

<a id="faker-randomdigit"></a>

## `randomDigit`

`randomDigit` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomDigit() -> int
```

Actual signature for `en_US`:

```text
fake.randomDigit() -> int
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigit()
```

<a id="faker-randomdigitabovetwo"></a>

## `randomDigitAboveTwo`

`randomDigitAboveTwo` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomDigitAboveTwo() -> int
```

Actual signature for `en_US`:

```text
fake.randomDigitAboveTwo() -> int
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigitAboveTwo()
```

<a id="faker-randomdigitnotnull"></a>

## `randomDigitNotNull`

`randomDigitNotNull` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomDigitNotNull() -> int
```

Actual signature for `en_US`:

```text
fake.randomDigitNotNull() -> int
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigitNotNull()
```

<a id="faker-randomdigitnotnullorempty"></a>

## `randomDigitNotNullOrEmpty`

`randomDigitNotNullOrEmpty` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomDigitNotNullOrEmpty() -> int | str
```

Actual signature for `en_US`:

```text
fake.randomDigitNotNullOrEmpty() -> int | str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigitNotNullOrEmpty()
```

<a id="faker-randomdigitorempty"></a>

## `randomDigitOrEmpty`

`randomDigitOrEmpty` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomDigitOrEmpty() -> int | str
```

Actual signature for `en_US`:

```text
fake.randomDigitOrEmpty() -> int | str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomDigitOrEmpty()
```

<a id="faker-randomelement"></a>

## `randomElement`

Selects an element from the population; OrderedDict supports weights. Omission uses provider defaults.

Orionis typed contract:

```text
def randomElement(elements: Collection[T] | OrderedDict[T, float]) -> T
def randomElement() -> str
```

Actual signature for `en_US`:

```text
fake.randomElement(elements: Collection[~T] | collections.OrderedDict[~T, float] = ('a', 'b', 'c')) -> ~T
```


| Parameter | Purpose |
| --- | --- |
| `elements` | Value population; OrderedDict can represent weights. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomElement()
```

<a id="faker-randomelements"></a>

## `randomElements`

Selects elements; `unique` controls repetition and `use_weighting` weighting when supported by the population.

Orionis typed contract:

```text
def randomElements(elements: Collection[T] | OrderedDict[T, float], length: int | None=..., unique: bool=..., use_weighting: bool | None=...) -> Sequence[T]
def randomElements(*, length: int | None=..., unique: bool=..., use_weighting: bool | None=...) -> Sequence[str]
```

Actual signature for `en_US`:

```text
fake.randomElements(elements: Collection[~T] | collections.OrderedDict[~T, float] = ('a', 'b', 'c'), length: int | None = None, unique: bool = False, use_weighting: bool | None = None) -> Sequence[~T]
```


| Parameter | Purpose |
| --- | --- |
| `elements` | Value population; OrderedDict can represent weights. |
| `length` | Value length/size; units depend on this provider. |
| `unique` | Requests nonrepeating selections within this call. |
| `use_weighting` | Enables weighting where supported. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomElements()
```

<a id="faker-randomgoodserviceadjective"></a>

## `randomGoodServiceAdjective`

`randomGoodServiceAdjective` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomGoodServiceAdjective() -> str
```

Actual signature for `fil_PH`:

```text
fake.randomGoodServiceAdjective() -> str
```


Verified availability: 2 locales. Example locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.randomGoodServiceAdjective()
```

<a id="faker-randomgoodserviceadjectivechain"></a>

## `randomGoodServiceAdjectiveChain`

`randomGoodServiceAdjectiveChain` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomGoodServiceAdjectiveChain() -> str
```

Actual signature for `fil_PH`:

```text
fake.randomGoodServiceAdjectiveChain() -> str
```


Verified availability: 2 locales. Example locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.randomGoodServiceAdjectiveChain()
```

<a id="faker-randomint"></a>

## `randomInt`

Integer between inclusive `min`/`max` bounds using `step`; useful for bounded quantities.

Orionis typed contract:

```text
def randomInt(min: int=..., max: int=..., step: int=...) -> int
```

Actual signature for `en_US`:

```text
fake.randomInt(min: int = 0, max: int = 9999, step: int = 1) -> int
```


| Parameter | Purpose |
| --- | --- |
| `min` | Inclusive lower bound. |
| `max` | Inclusive upper bound. |
| `step` | Integer selection step. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomInt()
```

<a id="faker-randomletter"></a>

## `randomLetter`

`randomLetter` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomLetter() -> str
```

Actual signature for `en_US`:

```text
fake.randomLetter() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomLetter()
```

<a id="faker-randomletters"></a>

## `randomLetters`

`randomLetters` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomLetters(length: int=...) -> Sequence[str]
```

Actual signature for `en_US`:

```text
fake.randomLetters(length: int = 16) -> Sequence[str]
```


| Parameter | Purpose |
| --- | --- |
| `length` | Value length/size; units depend on this provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomLetters()
```

<a id="faker-randomlowercaseletter"></a>

## `randomLowercaseLetter`

`randomLowercaseLetter` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomLowercaseLetter() -> str
```

Actual signature for `en_US`:

```text
fake.randomLowercaseLetter() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomLowercaseLetter()
```

<a id="faker-randomnamecomplements"></a>

## `randomNameComplements`

`randomNameComplements` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomNameComplements() -> str
```

Actual signature for `es_ES`:

```text
fake.randomNameComplements() -> str
```


Verified availability: 2 locales. Example locales: `es_ES`, `es`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.randomNameComplements()
```

<a id="faker-randomnounishgoodtrait"></a>

## `randomNounIshGoodTrait`

`randomNounIshGoodTrait` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomNounIshGoodTrait() -> str
```

Actual signature for `fil_PH`:

```text
fake.randomNounIshGoodTrait() -> str
```


Verified availability: 2 locales. Example locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.randomNounIshGoodTrait()
```

<a id="faker-randomnumber"></a>

## `randomNumber`

Integer with requested digit count; `fix_len` enforces fixed length when enabled.

Orionis typed contract:

```text
def randomNumber(digits: int | None=..., fix_len: bool=...) -> int
```

Actual signature for `en_US`:

```text
fake.randomNumber(digits: int | None = None, fix_len: bool = False) -> int
```


| Parameter | Purpose |
| --- | --- |
| `digits` | Number of result digits. |
| `fix_len` | Requires exact digit length. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomNumber()
```

<a id="faker-randomobjectname"></a>

## `randomObjectName`

`randomObjectName` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def randomObjectName() -> str
```

Actual signature for `en_PH`:

```text
fake.randomObjectName() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.randomObjectName()
```

<a id="faker-randomobjectofconcern"></a>

## `randomObjectOfConcern`

`randomObjectOfConcern` generates company names and expressions for test entities.

Orionis typed contract:

```text
def randomObjectOfConcern() -> str
```

Actual signature for `fil_PH`:

```text
fake.randomObjectOfConcern() -> str
```


Verified availability: 2 locales. Example locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.randomObjectOfConcern()
```

<a id="faker-randomsample"></a>

## `randomSample`

Samples without replacement; requesting more items than the population fails.

Orionis typed contract:

```text
def randomSample(elements: Collection[T] | OrderedDict[T, float], length: int | None=...) -> Sequence[T]
def randomSample(*, length: int | None=...) -> Sequence[str]
```

Actual signature for `en_US`:

```text
fake.randomSample(elements: Collection[~T] | collections.OrderedDict[~T, float] = ('a', 'b', 'c'), length: int | None = None) -> Sequence[~T]
```


| Parameter | Purpose |
| --- | --- |
| `elements` | Value population; OrderedDict can represent weights. |
| `length` | Value length/size; units depend on this provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomSample()
```

<a id="faker-randomuppercaseletter"></a>

## `randomUppercaseLetter`

`randomUppercaseLetter` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomUppercaseLetter() -> str
```

Actual signature for `en_US`:

```text
fake.randomUppercaseLetter() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomUppercaseLetter()
```

<a id="faker-randomizenbelements"></a>

## `randomizeNbElements`

`randomizeNbElements` returns this localized provider's simulated value.

Orionis typed contract:

```text
def randomizeNbElements(number: int=..., le: bool=..., ge: bool=..., min: int | None=..., max: int | None=...) -> int
```

Actual signature for `en_US`:

```text
fake.randomizeNbElements(number: int = 10, le: bool = False, ge: bool = False, min: int | None = None, max: int | None = None) -> int
```


| Parameter | Purpose |
| --- | --- |
| `number` | Reference count varied by randomizeNbElements. |
| `le` | Prevents results above number in randomizeNbElements. |
| `ge` | Prevents results below number in randomizeNbElements. |
| `min` | Inclusive lower bound. |
| `max` | Inclusive upper bound. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.randomizeNbElements()
```

<a id="faker-rcsnumber"></a>

## `rcsNumber`

`rcsNumber` generates company names and expressions for test entities.

Orionis typed contract:

```text
def rcsNumber(city: str=..., letter: str=..., siren: str=...) -> str
```

Actual signature for `fr_CH`:

```text
fake.rcsNumber(city: str = '', letter: str = '', siren: str = '') -> str
```


| Parameter | Purpose |
| --- | --- |
| `city` | City used in the company registry number. |
| `letter` | Letter used in the simulated company registry number. |
| `siren` | SIREN incorporated into the RCS registry number. |

Verified availability: 2 locales. Example locales: `fr_CH`, `fr_FR`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.rcsNumber()
```

<a id="faker-rdnumber"></a>

## `rdNumber`

`rdNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def rdNumber() -> str
```

Actual signature for `en_NZ`:

```text
fake.rdNumber() -> str
```


Verified availability: 1 locales. Example locales: `en_NZ`.

```python
fake = SampleFactory(locale="en_NZ", seed=7).fake
value = fake.rdNumber()
```

<a id="faker-realcityname"></a>

## `realCityName`

`realCityName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def realCityName() -> str
```

Actual signature for `hu_HU`:

```text
fake.realCityName() -> str
```


Verified availability: 1 locales. Example locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.realCityName()
```

<a id="faker-region"></a>

## `region`

`region` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def region() -> str
```

Actual signature for `es_ES`:

```text
fake.region() -> str
```


Verified availability: 8 locales. Example locales: `es_ES`, `el_GR`, `es`, `es_CL`, `fr_FR`, `pl_PL`, `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.region()
```

<a id="faker-regioncode"></a>

## `regionCode`

`regionCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def regionCode() -> str
```

Actual signature for `es_CL`:

```text
fake.regionCode() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.regionCode()
```

<a id="faker-regon"></a>

## `regon`

`regon` generates company names and expressions for test entities.

Orionis typed contract:

```text
def regon() -> str
```

Actual signature for `pl_PL`:

```text
fake.regon() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.regon()
```

<a id="faker-rfc"></a>

## `rfc`

`rfc` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def rfc(natural: bool=...) -> str
```

Actual signature for `es_MX`:

```text
fake.rfc(natural: bool = True) -> str
```


| Parameter | Purpose |
| --- | --- |
| `natural` | Selects a natural-person rather than legal-entity RFC. |

Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.rfc()
```

<a id="faker-rg"></a>

## `rg`

`rg` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def rg() -> str
```

Actual signature for `pt_BR`:

```text
fake.rg() -> str
```


Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.rg()
```

<a id="faker-rgbcolor"></a>

## `rgbColor`

`rgbColor` generates colors and representations for interface data.

Orionis typed contract:

```text
def rgbColor() -> str
```

Actual signature for `en_US`:

```text
fake.rgbColor() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.rgbColor()
```

<a id="faker-rgbcsscolor"></a>

## `rgbCssColor`

`rgbCssColor` generates colors and representations for interface data.

Orionis typed contract:

```text
def rgbCssColor() -> str
```

Actual signature for `en_US`:

```text
fake.rgbCssColor() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.rgbCssColor()
```

<a id="faker-ripeid"></a>

## `ripeId`

`ripeId` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def ripeId() -> str
```

Actual signature for `en_US`:

```text
fake.ripeId() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ripeId()
```

<a id="faker-road"></a>

## `road`

`road` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def road() -> str
```

Actual signature for `ko_KR`:

```text
fake.road() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.road()
```

<a id="faker-roadaddress"></a>

## `roadAddress`

`roadAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def roadAddress() -> str
```

Actual signature for `ko_KR`:

```text
fake.roadAddress() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.roadAddress()
```

<a id="faker-roadname"></a>

## `roadName`

`roadName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def roadName() -> str
```

Actual signature for `es_CL`:

```text
fake.roadName() -> str
```


Verified availability: 2 locales. Example locales: `es_CL`, `ko_KR`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.roadName()
```

<a id="faker-roadnumber"></a>

## `roadNumber`

`roadNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def roadNumber() -> str
```

Actual signature for `ko_KR`:

```text
fake.roadNumber() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.roadNumber()
```

<a id="faker-roadsuffix"></a>

## `roadSuffix`

`roadSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def roadSuffix() -> str
```

Actual signature for `ko_KR`:

```text
fake.roadSuffix() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.roadSuffix()
```

<a id="faker-romanizedname"></a>

## `romanizedName`

`romanizedName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def romanizedName() -> str
```

Actual signature for `ja_JP`:

```text
fake.romanizedName() -> str
```


Verified availability: 3 locales. Example locales: `ja_JP`, `zh_CN`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.romanizedName()
```

<a id="faker-romanizednamefemale"></a>

## `romanizedNameFemale`

`romanizedNameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def romanizedNameFemale() -> str
```

Actual signature for `ja_JP`:

```text
fake.romanizedNameFemale() -> str
```


Verified availability: 2 locales. Example locales: `ja_JP`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.romanizedNameFemale()
```

<a id="faker-romanizednamemale"></a>

## `romanizedNameMale`

`romanizedNameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def romanizedNameMale() -> str
```

Actual signature for `ja_JP`:

```text
fake.romanizedNameMale() -> str
```


Verified availability: 2 locales. Example locales: `ja_JP`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.romanizedNameMale()
```

<a id="faker-rut"></a>

## `rut`

`rut` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def rut(min: int=..., max: int=...) -> str
```

Actual signature for `es_CL`:

```text
fake.rut(min: int = 10, max: int = 99999999) -> str
```


| Parameter | Purpose |
| --- | --- |
| `min` | Inclusive lower bound. |
| `max` | Inclusive upper bound. |

Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.rut()
```

<a id="faker-rvnr"></a>

## `rvnr`

`rvnr` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def rvnr(birthdate: datetime.date | None=...) -> str
```

Actual signature for `de_DE`:

```text
fake.rvnr(birthdate: datetime.date | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `birthdate` | Birth date used when constructing the identifier. |

Verified availability: 2 locales. Example locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.rvnr()
```

<a id="faker-safari"></a>

## `safari`

`safari` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def safari() -> str
```

Actual signature for `en_US`:

```text
fake.safari() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safari()
```

<a id="faker-safecolorname"></a>

## `safeColorName`

`safeColorName` generates colors and representations for interface data.

Orionis typed contract:

```text
def safeColorName() -> str
```

Actual signature for `en_US`:

```text
fake.safeColorName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safeColorName()
```

<a id="faker-safedomainname"></a>

## `safeDomainName`

`safeDomainName` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def safeDomainName() -> str
```

Actual signature for `en_US`:

```text
fake.safeDomainName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safeDomainName()
```

<a id="faker-safeemail"></a>

## `safeEmail`

`safeEmail` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def safeEmail() -> str
```

Actual signature for `en_US`:

```text
fake.safeEmail() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safeEmail()
```

<a id="faker-safehexcolor"></a>

## `safeHexColor`

`safeHexColor` generates colors and representations for interface data.

Orionis typed contract:

```text
def safeHexColor() -> str
```

Actual signature for `en_US`:

```text
fake.safeHexColor() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.safeHexColor()
```

<a id="faker-sbn9"></a>

## `sbn9`

`sbn9` generates book codes for catalogs.

Orionis typed contract:

```text
def sbn9(separator: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.sbn9(separator: str = '-') -> str
```


| Parameter | Purpose |
| --- | --- |
| `separator` | Textual format separator. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sbn9()
```

<a id="faker-secondaryaddress"></a>

## `secondaryAddress`

`secondaryAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def secondaryAddress() -> str
```

Actual signature for `en_US`:

```text
fake.secondaryAddress() -> str
```


Verified availability: 64 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.secondaryAddress()
```

<a id="faker-sectionnumber"></a>

## `sectionNumber`

`sectionNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def sectionNumber() -> str
```

Actual signature for `zh_TW`:

```text
fake.sectionNumber() -> str
```


Verified availability: 2 locales. Example locales: `zh_TW`, `zu_ZA`.

```python
fake = SampleFactory(locale="zh_TW", seed=7).fake
value = fake.sectionNumber()
```

<a id="faker-sentence"></a>

## `sentence`

`sentence` generates placeholder text for content and forms.

Orionis typed contract:

```text
def sentence(nb_words: int=..., variable_nb_words: bool=..., ext_word_list: Sequence[str] | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.sentence(nb_words: int = 6, variable_nb_words: bool = True, ext_word_list: Sequence[str] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `nb_words` | Target word count. |
| `variable_nb_words` | Allows variation around target word count. |
| `ext_word_list` | Alternative vocabulary or None for native data. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sentence()
```

<a id="faker-sentences"></a>

## `sentences`

`sentences` generates placeholder text for content and forms.

Orionis typed contract:

```text
def sentences(nb: int=..., ext_word_list: Sequence[str] | None=...) -> list[str]
```

Actual signature for `en_US`:

```text
fake.sentences(nb: int = 3, ext_word_list: Sequence[str] | None = None) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `nb` | Requested result count. |
| `ext_word_list` | Alternative vocabulary or None for native data. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sentences()
```

<a id="faker-serialnumber"></a>

## `serialNumber`

`serialNumber` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def serialNumber() -> str
```

Actual signature for `ja_JP`:

```text
fake.serialNumber() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.serialNumber()
```

<a id="faker-servicephonenumber"></a>

## `servicePhoneNumber`

`servicePhoneNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def servicePhoneNumber() -> str
```

Actual signature for `ar_AE`:

```text
fake.servicePhoneNumber() -> str
```


Verified availability: 4 locales. Example locales: `ar_AE`, `ar_JO`, `ar_PS`, `pt_BR`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.servicePhoneNumber()
```

<a id="faker-setarguments"></a>

## `setArguments`

Configures one argument (group, argument, value), or replaces a group with a dict as the second argument despite its native str annotation. Returns None; other argument types raise ValueError.

Helper accessible through dynamic facade dispatch; not declared in `_ProviderMethods`.

Actual signature for `en_US`:

```text
fake.setArguments(group: str, argument: str, value: Any | None = None) -> None
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
fake.setArguments("small", "min_value", 1)
fake.setArguments("small", "max_value", 3)
value = fake.parse("{{pyint:small}}")
```

<a id="faker-settlement"></a>

## `settlement`

`settlement` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def settlement() -> str
```

Actual signature for `az_AZ`:

```text
fake.settlement() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.settlement()
```

<a id="faker-settlementsuffix"></a>

## `settlementSuffix`

`settlementSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def settlementSuffix() -> str
```

Actual signature for `az_AZ`:

```text
fake.settlementSuffix() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.settlementSuffix()
```

<a id="faker-sha1"></a>

## `sha1`

SHA-1 digest of random data for fixtures; not password hashing.

Orionis typed contract:

```text
def sha1() -> str
def sha1(raw_output: Literal[True]) -> bytes
def sha1(raw_output: Literal[False]) -> str
```

Actual signature for `en_US`:

```text
fake.sha1(raw_output: bool = False) -> bytes | str
```


| Parameter | Purpose |
| --- | --- |
| `raw_output` | Requests binary/native output rather than usual text. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sha1()
```

<a id="faker-sha256"></a>

## `sha256`

SHA-256 digest of random data for fixtures; not password hashing.

Orionis typed contract:

```text
def sha256() -> str
def sha256(raw_output: Literal[True]) -> bytes
def sha256(raw_output: Literal[False]) -> str
```

Actual signature for `en_US`:

```text
fake.sha256(raw_output: bool = False) -> bytes | str
```


| Parameter | Purpose |
| --- | --- |
| `raw_output` | Requests binary/native output rather than usual text. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.sha256()
```

<a id="faker-simpleprofile"></a>

## `simpleProfile`

`simpleProfile` generates composite profiles for fixtures.

Orionis typed contract:

```text
def simpleProfile(sex: Literal['M', 'F', 'X'] | None=...) -> dict[str, str | datetime.date | Literal['M', 'F', 'X']]
```

Actual signature for `en_US`:

```text
fake.simpleProfile(sex: Literal['M', 'F', 'X'] | None = None) -> Dict[str, str | datetime.date | Literal['M', 'F', 'X']]
```


| Parameter | Purpose |
| --- | --- |
| `sex` | Sex selection using supported locale-specific values. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.simpleProfile()
```

<a id="faker-siren"></a>

## `siren`

`siren` generates company names and expressions for test entities.

Orionis typed contract:

```text
def siren() -> str
```

Actual signature for `fr_CH`:

```text
fake.siren() -> str
```


Verified availability: 2 locales. Example locales: `fr_CH`, `fr_FR`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.siren()
```

<a id="faker-siret"></a>

## `siret`

`siret` generates company names and expressions for test entities.

Orionis typed contract:

```text
def siret(max_sequential_digits: int=...) -> str
```

Actual signature for `fr_CH`:

```text
fake.siret(max_sequential_digits: int = 2) -> str
```


| Parameter | Purpose |
| --- | --- |
| `max_sequential_digits` | Maximum SIRET sequential digits, from 1 to 4; invalid values normalize to 2. |

Verified availability: 2 locales. Example locales: `fr_CH`, `fr_FR`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.siret()
```

<a id="faker-slug"></a>

## `slug`

`slug` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def slug(value: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.slug(value: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `value` | Source text normalized into a slug. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.slug()
```

<a id="faker-smartmobilenumber"></a>

## `smartMobileNumber`

`smartMobileNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def smartMobileNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.smartMobileNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.smartMobileNumber()
```

<a id="faker-smartmobilenumberprefix"></a>

## `smartMobileNumberPrefix`

`smartMobileNumberPrefix` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def smartMobileNumberPrefix() -> str
```

Actual signature for `en_PH`:

```text
fake.smartMobileNumberPrefix() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.smartMobileNumberPrefix()
```

<a id="faker-snils"></a>

## `snils`

`snils` generates company names and expressions for test entities.

Orionis typed contract:

```text
def snils() -> str
```

Actual signature for `ru_RU`:

```text
fake.snils() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.snils()
```

<a id="faker-spaceobjectname"></a>

## `spaceObjectName`

`spaceObjectName` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def spaceObjectName() -> str
```

Actual signature for `en_PH`:

```text
fake.spaceObjectName() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.spaceObjectName()
```

<a id="faker-specialcode"></a>

## `specialCode`

`specialCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def specialCode() -> str
```

Actual signature for `es_CL`:

```text
fake.specialCode() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.specialCode()
```

<a id="faker-ssn"></a>

## `ssn`

`ssn` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def ssn(taxpayer_identification_number_type: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.ssn(taxpayer_identification_number_type: str = 'SSN') -> str
```


| Parameter | Purpose |
| --- | --- |
| `taxpayer_identification_number_type` | Locale-specific taxpayer identifier kind; en_US defaults to SSN. |
| `birthdate` | Birth date used when constructing the identifier. |
| `min_age` | Minimum age of the localized identifier holder. |
| `max_age` | Maximum age of the localized identifier holder. |
| `artificial` | Selects the artificial identifier marker where supported by the locale. |
| `dob` | Birth date used to form the localized identifier. |
| `gender` | Gender selection using supported locale-specific values. |
| `long` | Requests the long localized identifier variant. |
| `dash` | Includes a hyphen in the identifier representation. |
| `birthday` | Reference birth date for the passport. |
| `area_code` | Area code used to form the localized identifier. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG` and 46 more:

```text
fake.ssn(taxpayer_identification_number_type: str = 'SSN') -> str
```

`ar_DZ`, `az_AZ`, `bg_BG`, `bn_BD`, `cs_CZ`, `de` and 43 more:

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

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ssn()
```

<a id="faker-sss"></a>

## `sss`

`sss` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def sss() -> str
```

Actual signature for `en_PH`:

```text
fake.sss() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.sss()
```

<a id="faker-standalonebuildingnumber"></a>

## `standaloneBuildingNumber`

`standaloneBuildingNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def standaloneBuildingNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.standaloneBuildingNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.standaloneBuildingNumber()
```

<a id="faker-startdigit"></a>

## `startDigit`

`startDigit` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def startDigit() -> str
```

Actual signature for `az_AZ`:

```text
fake.startDigit() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.startDigit()
```

<a id="faker-state"></a>

## `state`

`state` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def state() -> str
```

Actual signature for `en_US`:

```text
fake.state() -> str
```


Verified availability: 72 locales. Example locales: `en_US`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.state()
```

<a id="faker-stateabbr"></a>

## `stateAbbr`

`stateAbbr` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def stateAbbr(include_territories: bool=..., include_freely_associated_states: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.stateAbbr(include_territories: bool = True, include_freely_associated_states: bool = True) -> str
```


| Parameter | Purpose |
| --- | --- |
| `include_territories` | Includes US territories in selection. |
| `include_freely_associated_states` | Includes freely associated states in the state selection. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG` and 39 more:

```text
fake.stateAbbr(include_territories: bool = True, include_freely_associated_states: bool = True) -> str
```

`en_AU`, `es_MX`, `hy_AM`, `id_ID`, `it_IT`, `pt_BR` and 2 more:

```text
fake.stateAbbr() -> str
```

Verified availability: 53 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.stateAbbr()
```

<a id="faker-statename"></a>

## `stateName`

`stateName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def stateName() -> str
```

Actual signature for `es_ES`:

```text
fake.stateName() -> str
```


Verified availability: 2 locales. Example locales: `es_ES`, `es`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.stateName()
```

<a id="faker-street"></a>

## `street`

`street` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def street() -> str
```

Actual signature for `az_AZ`:

```text
fake.street() -> str
```


Verified availability: 5 locales. Example locales: `az_AZ`, `el_GR`, `hy_AM`, `id_ID`, `vi_VN`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.street()
```

<a id="faker-streetaddress"></a>

## `streetAddress`

`streetAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetAddress() -> str
```

Actual signature for `en_US`:

```text
fake.streetAddress() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.streetAddress()
```

<a id="faker-streetaddresswithcounty"></a>

## `streetAddressWithCounty`

`streetAddressWithCounty` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetAddressWithCounty() -> str
```

Actual signature for `hu_HU`:

```text
fake.streetAddressWithCounty() -> str
```


Verified availability: 1 locales. Example locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.streetAddressWithCounty()
```

<a id="faker-streetmunicipality"></a>

## `streetMunicipality`

`streetMunicipality` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetMunicipality() -> str
```

Actual signature for `es_AR`:

```text
fake.streetMunicipality() -> str
```


Verified availability: 1 locales. Example locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.streetMunicipality()
```

<a id="faker-streetname"></a>

## `streetName`

`streetName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetName() -> str
```

Actual signature for `en_US`:

```text
fake.streetName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.streetName()
```

<a id="faker-streetnameadjectivefeminine"></a>

## `streetNameAdjectiveFeminine`

`streetNameAdjectiveFeminine` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetNameAdjectiveFeminine() -> str
```

Actual signature for `pl_PL`:

```text
fake.streetNameAdjectiveFeminine() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetNameAdjectiveFeminine()
```

<a id="faker-streetnamesuffix"></a>

## `streetNameSuffix`

`streetNameSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetNameSuffix() -> str
```

Actual signature for `zh_TW`:

```text
fake.streetNameSuffix() -> str
```


Verified availability: 1 locales. Example locales: `zh_TW`.

```python
fake = SampleFactory(locale="zh_TW", seed=7).fake
value = fake.streetNameSuffix()
```

<a id="faker-streetnameuniversal"></a>

## `streetNameUniversal`

`streetNameUniversal` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetNameUniversal() -> str
```

Actual signature for `pl_PL`:

```text
fake.streetNameUniversal() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetNameUniversal()
```

<a id="faker-streetprefix"></a>

## `streetPrefix`

`streetPrefix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetPrefix() -> str
```

Actual signature for `es_CO`:

```text
fake.streetPrefix() -> str
```


Verified availability: 24 locales. Example locales: `es_CO`, `es_ES`, `ar_DZ`, `el_GR`, `en_MS`, `es`, `es_AR`, `es_CL`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.streetPrefix()
```

<a id="faker-streetprefixfeminine"></a>

## `streetPrefixFeminine`

`streetPrefixFeminine` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetPrefixFeminine() -> str
```

Actual signature for `pl_PL`:

```text
fake.streetPrefixFeminine() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetPrefixFeminine()
```

<a id="faker-streetprefixfeminineshort"></a>

## `streetPrefixFeminineShort`

`streetPrefixFeminineShort` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetPrefixFeminineShort() -> str
```

Actual signature for `pl_PL`:

```text
fake.streetPrefixFeminineShort() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetPrefixFeminineShort()
```

<a id="faker-streetprefixlong"></a>

## `streetPrefixLong`

`streetPrefixLong` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetPrefixLong() -> str
```

Actual signature for `el_GR`:

```text
fake.streetPrefixLong() -> str
```


Verified availability: 2 locales. Example locales: `el_GR`, `id_ID`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.streetPrefixLong()
```

<a id="faker-streetprefixmasculine"></a>

## `streetPrefixMasculine`

`streetPrefixMasculine` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetPrefixMasculine() -> str
```

Actual signature for `pl_PL`:

```text
fake.streetPrefixMasculine() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetPrefixMasculine()
```

<a id="faker-streetprefixmasculineshort"></a>

## `streetPrefixMasculineShort`

`streetPrefixMasculineShort` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetPrefixMasculineShort() -> str
```

Actual signature for `pl_PL`:

```text
fake.streetPrefixMasculineShort() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.streetPrefixMasculineShort()
```

<a id="faker-streetprefixshort"></a>

## `streetPrefixShort`

`streetPrefixShort` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetPrefixShort() -> str
```

Actual signature for `el_GR`:

```text
fake.streetPrefixShort() -> str
```


Verified availability: 3 locales. Example locales: `el_GR`, `id_ID`, `pl_PL`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.streetPrefixShort()
```

<a id="faker-streetprocer"></a>

## `streetProcer`

`streetProcer` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetProcer() -> str
```

Actual signature for `es_AR`:

```text
fake.streetProcer() -> str
```


Verified availability: 1 locales. Example locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.streetProcer()
```

<a id="faker-streetprovince"></a>

## `streetProvince`

`streetProvince` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetProvince() -> str
```

Actual signature for `es_AR`:

```text
fake.streetProvince() -> str
```


Verified availability: 1 locales. Example locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.streetProvince()
```

<a id="faker-streetsuffix"></a>

## `streetSuffix`

`streetSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetSuffix() -> str
```

Actual signature for `en_US`:

```text
fake.streetSuffix() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.streetSuffix()
```

<a id="faker-streetsuffixlong"></a>

## `streetSuffixLong`

`streetSuffixLong` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetSuffixLong() -> str
```

Actual signature for `cs_CZ`:

```text
fake.streetSuffixLong() -> str
```


Verified availability: 5 locales. Example locales: `cs_CZ`, `de`, `de_AT`, `de_DE`, `sk_SK`.

```python
fake = SampleFactory(locale="cs_CZ", seed=7).fake
value = fake.streetSuffixLong()
```

<a id="faker-streetsuffixshort"></a>

## `streetSuffixShort`

`streetSuffixShort` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetSuffixShort() -> str
```

Actual signature for `cs_CZ`:

```text
fake.streetSuffixShort() -> str
```


Verified availability: 5 locales. Example locales: `cs_CZ`, `de`, `de_AT`, `de_DE`, `sk_SK`.

```python
fake = SampleFactory(locale="cs_CZ", seed=7).fake
value = fake.streetSuffixShort()
```

<a id="faker-streettitle"></a>

## `streetTitle`

`streetTitle` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def streetTitle() -> str
```

Actual signature for `he_IL`:

```text
fake.streetTitle() -> str
```


Verified availability: 4 locales. Example locales: `he_IL`, `ka_GE`, `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="he_IL", seed=7).fake
value = fake.streetTitle()
```

<a id="faker-substreet"></a>

## `subStreet`

`subStreet` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def subStreet() -> str
```

Actual signature for `vi_VN`:

```text
fake.subStreet() -> str
```


Verified availability: 1 locales. Example locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.subStreet()
```

<a id="faker-substreetprefix"></a>

## `subStreetPrefix`

`subStreetPrefix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def subStreetPrefix() -> str
```

Actual signature for `vi_VN`:

```text
fake.subStreetPrefix() -> str
```


Verified availability: 1 locales. Example locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.subStreetPrefix()
```

<a id="faker-subdivisionblocknumber"></a>

## `subdivisionBlockNumber`

`subdivisionBlockNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def subdivisionBlockNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.subdivisionBlockNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionBlockNumber()
```

<a id="faker-subdivisionlotnumber"></a>

## `subdivisionLotNumber`

`subdivisionLotNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def subdivisionLotNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.subdivisionLotNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionLotNumber()
```

<a id="faker-subdivisionname"></a>

## `subdivisionName`

`subdivisionName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def subdivisionName() -> str
```

Actual signature for `en_PH`:

```text
fake.subdivisionName() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionName()
```

<a id="faker-subdivisionnamesuffix"></a>

## `subdivisionNameSuffix`

`subdivisionNameSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def subdivisionNameSuffix() -> str
```

Actual signature for `en_PH`:

```text
fake.subdivisionNameSuffix() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionNameSuffix()
```

<a id="faker-subdivisionunitnumber"></a>

## `subdivisionUnitNumber`

`subdivisionUnitNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def subdivisionUnitNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.subdivisionUnitNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.subdivisionUnitNumber()
```

<a id="faker-suffix"></a>

## `suffix`

`suffix` generates names and identity components for test profiles.

Orionis typed contract:

```text
def suffix() -> str
```

Actual signature for `en_US`:

```text
fake.suffix() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.suffix()
```

<a id="faker-suffixfemale"></a>

## `suffixFemale`

`suffixFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def suffixFemale() -> str
```

Actual signature for `en_US`:

```text
fake.suffixFemale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.suffixFemale()
```

<a id="faker-suffixmale"></a>

## `suffixMale`

`suffixMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def suffixMale() -> str
```

Actual signature for `en_US`:

```text
fake.suffixMale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.suffixMale()
```

<a id="faker-suffixnonbinary"></a>

## `suffixNonbinary`

`suffixNonbinary` generates names and identity components for test profiles.

Orionis typed contract:

```text
def suffixNonbinary() -> str
```

Actual signature for `en_US`:

```text
fake.suffixNonbinary() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.suffixNonbinary()
```

<a id="faker-sunmobilenumber"></a>

## `sunMobileNumber`

`sunMobileNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def sunMobileNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.sunMobileNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.sunMobileNumber()
```

<a id="faker-sunmobilenumberprefix"></a>

## `sunMobileNumberPrefix`

`sunMobileNumberPrefix` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def sunMobileNumberPrefix() -> str
```

Actual signature for `en_PH`:

```text
fake.sunMobileNumberPrefix() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.sunMobileNumberPrefix()
```

<a id="faker-swift"></a>

## `swift`

`swift` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def swift(length: int | None=..., primary: bool=..., use_dataset: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.swift(length: int | None = None, primary: bool = False, use_dataset: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `length` | Value length/size; units depend on this provider. |
| `primary` | For 11-character SWIFT selects the primary office with XXX suffix. |
| `use_dataset` | Uses local SWIFT dataset codes when available, otherwise random components. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 103 more:

```text
fake.swift(length: int | None = None, primary: bool = False, use_dataset: bool = False) -> str
```

`bn_BD`:

```text
fake.swift(length: int | None = None, primary: bool = False, use_dataset: bool = True) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.swift()
```

<a id="faker-swift11"></a>

## `swift11`

`swift11` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def swift11(primary: bool=..., use_dataset: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.swift11(primary: bool = False, use_dataset: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `primary` | For 11-character SWIFT selects the primary office with XXX suffix. |
| `use_dataset` | Uses local SWIFT dataset codes when available, otherwise random components. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 103 more:

```text
fake.swift11(primary: bool = False, use_dataset: bool = False) -> str
```

`bn_BD`:

```text
fake.swift11(primary: bool = False, use_dataset: bool = True) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.swift11()
```

<a id="faker-swift8"></a>

## `swift8`

`swift8` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def swift8(use_dataset: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.swift8(use_dataset: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `use_dataset` | Uses local SWIFT dataset codes when available, otherwise random components. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 103 more:

```text
fake.swift8(use_dataset: bool = False) -> str
```

`bn_BD`:

```text
fake.swift8(use_dataset: bool = True) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.swift8()
```

<a id="faker-tambon"></a>

## `tambon`

`tambon` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def tambon() -> str
```

Actual signature for `th_TH`:

```text
fake.tambon() -> str
```


Verified availability: 2 locales. Example locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.tambon()
```

<a id="faker-tar"></a>

## `tar`

Generates TAR archive bytes in memory with configurable size/count/compression. Does not write to disk.

Orionis typed contract:

```text
def tar(uncompressed_size: int=..., num_files: int=..., min_file_size: int=..., compression: str | None=...) -> bytes
```

Actual signature for `en_US`:

```text
fake.tar(uncompressed_size: int = 65536, num_files: int = 1, min_file_size: int = 4096, compression: str | None = None) -> bytes
```


| Parameter | Purpose |
| --- | --- |
| `uncompressed_size` | Total uncompressed size in bytes. |
| `num_files` | Number of files in the archive. |
| `min_file_size` | Minimum bytes per file. |
| `compression` | Native compression algorithm or None. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.tar(uncompressed_size=128, min_file_size=64, num_files=1)
```

<a id="faker-tereoending"></a>

## `teReoEnding`

`teReoEnding` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def teReoEnding() -> str
```

Actual signature for `en_NZ`:

```text
fake.teReoEnding() -> str
```


Verified availability: 1 locales. Example locales: `en_NZ`.

```python
fake = SampleFactory(locale="en_NZ", seed=7).fake
value = fake.teReoEnding()
```

<a id="faker-tereofirst"></a>

## `teReoFirst`

`teReoFirst` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def teReoFirst() -> str
```

Actual signature for `en_NZ`:

```text
fake.teReoFirst() -> str
```


Verified availability: 1 locales. Example locales: `en_NZ`.

```python
fake = SampleFactory(locale="en_NZ", seed=7).fake
value = fake.teReoFirst()
```

<a id="faker-tereopart"></a>

## `teReoPart`

`teReoPart` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def teReoPart() -> str
```

Actual signature for `en_NZ`:

```text
fake.teReoPart() -> str
```


Verified availability: 1 locales. Example locales: `en_NZ`.

```python
fake = SampleFactory(locale="en_NZ", seed=7).fake
value = fake.teReoPart()
```

<a id="faker-telephonenumber"></a>

## `telephoneNumber`

`telephoneNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def telephoneNumber() -> str
```

Actual signature for `ar_AE`:

```text
fake.telephoneNumber() -> str
```


Verified availability: 5 locales. Example locales: `ar_AE`, `ar_DZ`, `ar_JO`, `ar_PS`, `fr_DZ`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.telephoneNumber()
```

<a id="faker-telephoneprovidercode"></a>

## `telephoneProviderCode`

`telephoneProviderCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def telephoneProviderCode() -> str
```

Actual signature for `ar_AE`:

```text
fake.telephoneProviderCode() -> str
```


Verified availability: 1 locales. Example locales: `ar_AE`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.telephoneProviderCode()
```

<a id="faker-text"></a>

## `text`

`text` generates placeholder text for content and forms.

Orionis typed contract:

```text
def text(max_nb_chars: int=..., ext_word_list: Sequence[str] | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.text(max_nb_chars: int = 200, ext_word_list: Sequence[str] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `max_nb_chars` | Maximum requested text character count. |
| `ext_word_list` | Alternative vocabulary or None for native data. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.text(max_nb_chars=80)
```

<a id="faker-texts"></a>

## `texts`

`texts` generates placeholder text for content and forms.

Orionis typed contract:

```text
def texts(nb_texts: int=..., max_nb_chars: int=..., ext_word_list: Sequence[str] | None=...) -> list[str]
```

Actual signature for `en_US`:

```text
fake.texts(nb_texts: int = 3, max_nb_chars: int = 200, ext_word_list: Sequence[str] | None = None) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `nb_texts` | Number of texts to return. |
| `max_nb_chars` | Maximum requested text character count. |
| `ext_word_list` | Alternative vocabulary or None for native data. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.texts(nb_texts=2, max_nb_chars=80)
```

<a id="faker-time"></a>

## `time`

`time` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def time(pattern: str=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.time(pattern: str = '%H:%M:%S', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `pattern` | Provider-supported formatting pattern. |
| `end_datetime` | Ending datetime interval boundary. |
| `thai_digit` | Uses Thai digits in provider output. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 102 more:

```text
fake.time(pattern: str = '%H:%M:%S', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> str
```

`th`, `th_TH`:

```text
fake.time(pattern: str = '%H:%M:%S', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, thai_digit: bool = False) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.time()
```

<a id="faker-timedelta"></a>

## `timeDelta`

`timeDelta` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def timeDelta(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.timedelta
```

Actual signature for `en_US`:

```text
fake.timeDelta(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.timedelta
```


| Parameter | Purpose |
| --- | --- |
| `end_datetime` | Ending datetime interval boundary. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.timeDelta()
```

<a id="faker-timeobject"></a>

## `timeObject`

`timeObject` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def timeObject(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.time
```

Actual signature for `en_US`:

```text
fake.timeObject(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.time
```


| Parameter | Purpose |
| --- | --- |
| `end_datetime` | Ending datetime interval boundary. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.timeObject()
```

<a id="faker-timeseries"></a>

## `timeSeries`

Generates an iterator of (datetime, value) pairs. The example consumes it with list and uses precision in seconds to bound point count.

Orionis typed contract:

```text
def timeSeries(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., precision: float | None=..., distrib: Callable[[datetime.datetime], float] | None=..., tzinfo: datetime.tzinfo | None=...) -> Iterator[tuple[datetime.datetime, Any]]
```

Actual signature for `en_US`:

```text
fake.timeSeries(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30d', end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = 'now', precision: float | None = None, distrib: Callable[[datetime.datetime], float] | None = None, tzinfo: datetime.tzinfo | None = None) -> Iterator[Tuple[datetime.datetime, Any]]
```


| Parameter | Purpose |
| --- | --- |
| `start_date` | Start boundary: date/time, relative interval or provider-supported format. |
| `end_date` | End date/time boundary or relative interval. |
| `precision` | Time-series point interval in seconds. |
| `distrib` | Callable computing a value for each datetime. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = list(fake.timeSeries(start_date="-2d", end_date="now", precision=86400))
```

<a id="faker-timezone"></a>

## `timezone`

`timezone` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def timezone() -> str
```

Actual signature for `en_US`:

```text
fake.timezone() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.timezone()
```

<a id="faker-tin"></a>

## `tin`

`tin` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def tin() -> str
```

Actual signature for `el_GR`:

```text
fake.tin() -> str
```


Verified availability: 1 locales. Example locales: `el_GR`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.tin()
```

<a id="faker-tld"></a>

## `tld`

`tld` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def tld() -> str
```

Actual signature for `en_US`:

```text
fake.tld() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.tld()
```

<a id="faker-tollnumber"></a>

## `tollNumber`

`tollNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def tollNumber() -> str
```

Actual signature for `ar_AE`:

```text
fake.tollNumber() -> str
```


Verified availability: 2 locales. Example locales: `ar_AE`, `ar_PS`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.tollNumber()
```

<a id="faker-town"></a>

## `town`

`town` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def town() -> str
```

Actual signature for `bn_BD`:

```text
fake.town() -> str
```


Verified availability: 4 locales. Example locales: `bn_BD`, `en_BD`, `ja_JP`, `ko_KR`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.town()
```

<a id="faker-townsuffix"></a>

## `townSuffix`

`townSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def townSuffix() -> str
```

Actual signature for `ko_KR`:

```text
fake.townSuffix() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.townSuffix()
```

<a id="faker-traditionalmonthname"></a>

## `traditionalMonthName`

`traditionalMonthName` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def traditionalMonthName() -> str
```

Actual signature for `ja_JP`:

```text
fake.traditionalMonthName() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.traditionalMonthName()
```

<a id="faker-tsv"></a>

## `tsv`

`tsv` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def tsv(header: Sequence[str] | None=..., data_columns: tuple[str, str]=..., num_rows: int=..., include_row_ids: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.tsv(header: Sequence[str] | None = None, data_columns: Tuple[str, str] = ('{{name}}', '{{address}}'), num_rows: int = 10, include_row_ids: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `header` | Column headings or None to omit them. |
| `data_columns` | Structure, column or generator-token definition. |
| `num_rows` | Number of serialized data rows. |
| `include_row_ids` | Adds a sequential row identifier. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.tsv(num_rows=2)
```
