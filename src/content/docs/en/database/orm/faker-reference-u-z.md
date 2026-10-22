---
title: "Faker: providers U–Z"
description: "Signatures, parameters, locales and examples for providers U-Z."
editUrl: true
lastUpdated: false
---

This reference covers 43 facade names in the U-Z range. The whole catalog contains **675 typed methods** (694 signatures including overloads) and **7 backend helpers accessible at runtime**, organized alphabetically. Availability was checked against the installed backend's 110 locales; some methods only exist for specific locales.

## Preparing examples

Examples generate values in memory. They neither create tables nor insert records. Define this factory once, then use snippets inside its `definition()`, a seeder or a service/controller as shown in [Faker and simulated data](/en/database/orm/faker).

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

Methods ordinarily propagate backend parameter errors (`TypeError`, `ValueError`, formatting errors). If a locale does not publish a name, the facade raises `AttributeError`. `image` and `xml` need specific dependencies explained in their entries. See the [usage guide](/en/database/orm/faker) for `unique` and `optional`; unhashable results can prevent uniqueness checks. No claim is made that every method exists for every locale.

## Catalog index

[A-D](/en/database/orm/faker-reference-a-d) · [E-H](/en/database/orm/faker-reference-e-h) · [I-L](/en/database/orm/faker-reference-i-l) · [M-P](/en/database/orm/faker-reference-m-p) · [Q-T](/en/database/orm/faker-reference-q-t) · [U-Z](/en/database/orm/faker-reference-u-z)


<a id="faker-uid"></a>

## `uid`

`uid` generates company names and expressions for test entities.

Orionis typed contract:

```text
def uid() -> str
```

Actual signature for `fr_CH`:

```text
fake.uid() -> str
```


Verified availability: 1 locales. Example locales: `fr_CH`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.uid()
```

<a id="faker-umid"></a>

## `umid`

`umid` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def umid() -> str
```

Actual signature for `en_PH`:

```text
fake.umid() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.umid()
```

<a id="faker-unionterritory"></a>

## `unionTerritory`

`unionTerritory` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def unionTerritory() -> str
```

Actual signature for `en_IN`:

```text
fake.unionTerritory() -> str
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.unionTerritory()
```

<a id="faker-unixdevice"></a>

## `unixDevice`

`unixDevice` generates fictional filenames, paths and media types; it does not create files on disk.

Orionis typed contract:

```text
def unixDevice(prefix: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.unixDevice(prefix: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `prefix` | Generated string prefix. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.unixDevice()
```

<a id="faker-unixpartition"></a>

## `unixPartition`

`unixPartition` generates fictional filenames, paths and media types; it does not create files on disk.

Orionis typed contract:

```text
def unixPartition(prefix: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.unixPartition(prefix: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `prefix` | Generated string prefix. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.unixPartition()
```

<a id="faker-unixtime"></a>

## `unixTime`

`unixTime` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def unixTime(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., start_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> float
```

Actual signature for `en_US`:

```text
fake.unixTime(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, start_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> float
```


| Parameter | Purpose |
| --- | --- |
| `end_datetime` | Ending datetime interval boundary. |
| `start_datetime` | Starting datetime interval boundary. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.unixTime()
```

<a id="faker-upca"></a>

## `upcA`

`upcA` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def upcA(upc_ae_mode: bool=..., base: str | None=..., number_system_digit: int | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.upcA(upc_ae_mode: bool = False, base: str | None = None, number_system_digit: int | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `upc_ae_mode` | Generates UPC-A with a UPC-E equivalent, enabling base and number_system_digit. |
| `base` | Six-digit base for UPC-A/UPC-E conversion; unsupported values may generate another base. |
| `number_system_digit` | UPC number-system digit: 0 or 1. |

Verified availability: 107 locales. Example locales: `en_US`, `es_CO`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`, `ar_EG`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.upcA()
```

<a id="faker-upce"></a>

## `upcE`

`upcE` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def upcE(base: str | None=..., number_system_digit: int | None=..., safe_mode: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.upcE(base: str | None = None, number_system_digit: int | None = None, safe_mode: bool = True) -> str
```


| Parameter | Purpose |
| --- | --- |
| `base` | Six-digit base for UPC-A/UPC-E conversion; unsupported values may generate another base. |
| `number_system_digit` | UPC number-system digit: 0 or 1. |
| `safe_mode` | Requires reversible UPC-E to UPC-A conversion and back. |

Verified availability: 107 locales. Example locales: `en_US`, `es_CO`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`, `ar_EG`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.upcE()
```

<a id="faker-uri"></a>

## `uri`

`uri` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def uri(schemes: list[str] | None=..., deep: int | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.uri(schemes: List[str] | None = None, deep: int | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `schemes` | Permitted URL schemes. |
| `deep` | URI path segment depth. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uri()
```

<a id="faker-uriextension"></a>

## `uriExtension`

`uriExtension` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def uriExtension() -> str
```

Actual signature for `en_US`:

```text
fake.uriExtension() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uriExtension()
```

<a id="faker-uripage"></a>

## `uriPage`

`uriPage` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def uriPage() -> str
```

Actual signature for `en_US`:

```text
fake.uriPage() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uriPage()
```

<a id="faker-uripath"></a>

## `uriPath`

`uriPath` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def uriPath(deep: int | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.uriPath(deep: int | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `deep` | URI path segment depth. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uriPath()
```

<a id="faker-url"></a>

## `url`

`url` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def url(schemes: list[str] | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.url(schemes: List[str] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `schemes` | Permitted URL schemes. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.url()
```

<a id="faker-useragent"></a>

## `userAgent`

`userAgent` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def userAgent() -> str
```

Actual signature for `en_US`:

```text
fake.userAgent() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.userAgent()
```

<a id="faker-username"></a>

## `userName`

`userName` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def userName() -> str
```

Actual signature for `en_US`:

```text
fake.userName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.userName()
```

<a id="faker-uuid1"></a>

## `uuid1`

`uuid1` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def uuid1() -> str
def uuid1(cast_to: None) -> UUID
def uuid1(cast_to: Callable[[UUID], str]) -> str
def uuid1(cast_to: Callable[[UUID], bytes]) -> bytes
```

Actual signature for `en_US`:

```text
fake.uuid1(cast_to: Callable[[uuid.UUID], str] | Callable[[uuid.UUID], bytes] | None = <class 'str'>) -> bytes | str | uuid.UUID
```


| Parameter | Purpose |
| --- | --- |
| `cast_to` | Final UUID representation type, such as str or UUID. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uuid1()
```

<a id="faker-uuid4"></a>

## `uuid4`

`uuid4` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def uuid4() -> str
def uuid4(cast_to: None) -> UUID
def uuid4(cast_to: Callable[[UUID], str]) -> str
def uuid4(cast_to: Callable[[UUID], bytes]) -> bytes
```

Actual signature for `en_US`:

```text
fake.uuid4(cast_to: Callable[[uuid.UUID], str] | Callable[[uuid.UUID], bytes] | None = <class 'str'>) -> bytes | str | uuid.UUID
```


| Parameter | Purpose |
| --- | --- |
| `cast_to` | Final UUID representation type, such as str or UUID. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uuid4()
```

<a id="faker-uuid7"></a>

## `uuid7`

`uuid7` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def uuid7() -> str
def uuid7(cast_to: None) -> UUID
def uuid7(cast_to: Callable[[UUID], str]) -> str
def uuid7(cast_to: Callable[[UUID], bytes]) -> bytes
```

Actual signature for `en_US`:

```text
fake.uuid7(cast_to: Callable[[uuid.UUID], str] | Callable[[uuid.UUID], bytes] | None = <class 'str'>) -> bytes | str | uuid.UUID
```


| Parameter | Purpose |
| --- | --- |
| `cast_to` | Final UUID representation type, such as str or UUID. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uuid7()
```

<a id="faker-vatid"></a>

## `vatId`

`vatId` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def vatId() -> str
```

Actual signature for `es_ES`:

```text
fake.vatId() -> str
```


| Parameter | Purpose |
| --- | --- |
| `prefix` | Generated string prefix. |

Actual locale variants:

`bg_BG`, `cs_CZ`, `de`, `de_AT`, `de_CH`, `de_DE` and 28 more:

```text
fake.vatId() -> str
```

`el_GR`:

```text
fake.vatId(prefix: bool = True) -> str
```

Verified availability: 35 locales. Example locales: `es_ES`, `bg_BG`, `cs_CZ`, `de`, `de_AT`, `de_CH`, `de_DE`, `dk_DK`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.vatId()
```

<a id="faker-vehiclecategory"></a>

## `vehicleCategory`

`vehicleCategory` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def vehicleCategory() -> str
```

Actual signature for `ru_RU`:

```text
fake.vehicleCategory() -> str
```


Verified availability: 2 locales. Example locales: `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.vehicleCategory()
```

<a id="faker-vehiclecategoryletter"></a>

## `vehicleCategoryLetter`

`vehicleCategoryLetter` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def vehicleCategoryLetter() -> str
```

Actual signature for `bn_BD`:

```text
fake.vehicleCategoryLetter() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.vehicleCategoryLetter()
```

<a id="faker-vehiclecategorynumber"></a>

## `vehicleCategoryNumber`

`vehicleCategoryNumber` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def vehicleCategoryNumber() -> str
```

Actual signature for `bn_BD`:

```text
fake.vehicleCategoryNumber() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.vehicleCategoryNumber()
```

<a id="faker-vehicleserialnumber"></a>

## `vehicleSerialNumber`

`vehicleSerialNumber` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def vehicleSerialNumber() -> str
```

Actual signature for `bn_BD`:

```text
fake.vehicleSerialNumber() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.vehicleSerialNumber()
```

<a id="faker-vibuildingnumberformat"></a>

## `viBuildingNumberFormat`

`viBuildingNumberFormat` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def viBuildingNumberFormat() -> str
```

Actual signature for `vi_VN`:

```text
fake.viBuildingNumberFormat() -> str
```


Verified availability: 1 locales. Example locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.viBuildingNumberFormat()
```

<a id="faker-village"></a>

## `village`

`village` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def village() -> str
```

Actual signature for `az_AZ`:

```text
fake.village() -> str
```


Verified availability: 2 locales. Example locales: `az_AZ`, `hy_AM`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.village()
```

<a id="faker-villageprefix"></a>

## `villagePrefix`

`villagePrefix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def villagePrefix() -> str
```

Actual signature for `hy_AM`:

```text
fake.villagePrefix() -> str
```


Verified availability: 1 locales. Example locales: `hy_AM`.

```python
fake = SampleFactory(locale="hy_AM", seed=7).fake
value = fake.villagePrefix()
```

<a id="faker-villagesuffix"></a>

## `villageSuffix`

`villageSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def villageSuffix() -> str
```

Actual signature for `az_AZ`:

```text
fake.villageSuffix() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.villageSuffix()
```

<a id="faker-vin"></a>

## `vin`

`vin` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def vin() -> str
```

Actual signature for `en_US`:

```text
fake.vin() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.vin()
```

<a id="faker-visayasprovince"></a>

## `visayasProvince`

`visayasProvince` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def visayasProvince() -> str
```

Actual signature for `en_PH`:

```text
fake.visayasProvince() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.visayasProvince()
```

<a id="faker-visayasprovinceaddress"></a>

## `visayasProvinceAddress`

`visayasProvinceAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def visayasProvinceAddress() -> str
```

Actual signature for `en_PH`:

```text
fake.visayasProvinceAddress() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.visayasProvinceAddress()
```

<a id="faker-visayasprovincepostcode"></a>

## `visayasProvincePostcode`

`visayasProvincePostcode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def visayasProvincePostcode() -> str
```

Actual signature for `en_PH`:

```text
fake.visayasProvincePostcode() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.visayasProvincePostcode()
```

<a id="faker-wilaya"></a>

## `wilaya`

`wilaya` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def wilaya() -> str
```

Actual signature for `ar_DZ`:

```text
fake.wilaya() -> str
```


Verified availability: 2 locales. Example locales: `ar_DZ`, `fr_DZ`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.wilaya()
```

<a id="faker-windowsplatformtoken"></a>

## `windowsPlatformToken`

`windowsPlatformToken` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def windowsPlatformToken() -> str
```

Actual signature for `en_US`:

```text
fake.windowsPlatformToken() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.windowsPlatformToken()
```

<a id="faker-word"></a>

## `word`

`word` generates placeholder text for content and forms.

Orionis typed contract:

```text
def word(part_of_speech: str | None=..., ext_word_list: Sequence[str] | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.word(part_of_speech: str | None = None, ext_word_list: Sequence[str] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `part_of_speech` | Vocabulary grammatical category where supported by the locale. |
| `ext_word_list` | Alternative vocabulary or None for native data. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.word()
```

<a id="faker-words"></a>

## `words`

`words` generates placeholder text for content and forms.

Orionis typed contract:

```text
def words(nb: int=..., ext_word_list: list[str] | None=..., part_of_speech: str | None=..., unique: bool=...) -> list[str]
```

Actual signature for `en_US`:

```text
fake.words(nb: int = 3, ext_word_list: List[str] | None = None, part_of_speech: str | None = None, unique: bool = False) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `nb` | Requested result count. |
| `ext_word_list` | Alternative vocabulary or None for native data. |
| `part_of_speech` | Vocabulary grammatical category where supported by the locale. |
| `unique` | Requests nonrepeating selections within this call. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.words()
```

<a id="faker-xml"></a>

## `xml`

Generates XML text and requires xmltodict. Without that dependency it raises faker.exceptions.UnsupportedFeature. Use nb_elements and permitted types to control structure.

Orionis typed contract:

```text
def xml(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.xml(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `nb_elements` | Number of elements to generate. |
| `variable_nb_elements` | Allows count variation around its target. |
| `value_types` | Python types of generated values. |
| `allowed_types` | Python types the container may select. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

The example handles a missing dependency; install `Pillow` for images or `xmltodict` for XML in the environment using that provider.

```python
from faker.exceptions import UnsupportedFeature

fake = SampleFactory(locale="en_US", seed=7).fake
try:
    value = fake.xml(nb_elements=2)
except UnsupportedFeature:
    value = None
```

<a id="faker-year"></a>

## `year`

`year` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def year() -> str
```

Actual signature for `en_US`:

```text
fake.year() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.year()
```

<a id="faker-zip"></a>

## `zip`

Generates ZIP archive bytes in memory. Does not write a file; num_files, min_file_size and uncompressed_size must be positive and compatible.

Orionis typed contract:

```text
def zip(uncompressed_size: int=..., num_files: int=..., min_file_size: int=..., compression: str | None=...) -> bytes
```

Actual signature for `en_US`:

```text
fake.zip(uncompressed_size: int = 65536, num_files: int = 1, min_file_size: int = 4096, compression: str | None = None) -> bytes
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
value = fake.zip(uncompressed_size=128, min_file_size=64, num_files=1)
```

<a id="faker-zipcode"></a>

## `zipcode`

`zipcode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def zipcode() -> str
```

Actual signature for `en_US`:

```text
fake.zipcode() -> str
```


Verified availability: 47 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.zipcode()
```

<a id="faker-zipcodeinarmy"></a>

## `zipcodeInArmy`

`zipcodeInArmy` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def zipcodeInArmy() -> int
```

Actual signature for `en_IN`:

```text
fake.zipcodeInArmy() -> int
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.zipcodeInArmy()
```

<a id="faker-zipcodeinmilitary"></a>

## `zipcodeInMilitary`

`zipcodeInMilitary` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def zipcodeInMilitary() -> int
```

Actual signature for `en_IN`:

```text
fake.zipcodeInMilitary() -> int
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.zipcodeInMilitary()
```

<a id="faker-zipcodeinstate"></a>

## `zipcodeInState`

`zipcodeInState` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def zipcodeInState(state_abbr: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.zipcodeInState(state_abbr: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `state_abbr` | State abbreviation restricting localized output. |
| `include_union_territories` | Includes Indian Union Territories in postal codes. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG` and 39 more:

```text
fake.zipcodeInState(state_abbr: str | None = None) -> str
```

`en_IN`:

```text
fake.zipcodeInState(state_abbr: str | None = None, include_union_territories: bool = False) -> int
```

Verified availability: 46 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.zipcodeInState()
```

<a id="faker-zipcodeplus4"></a>

## `zipcodePlus4`

`zipcodePlus4` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def zipcodePlus4() -> str
```

Actual signature for `en_US`:

```text
fake.zipcodePlus4() -> str
```


Verified availability: 45 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.zipcodePlus4()
```
