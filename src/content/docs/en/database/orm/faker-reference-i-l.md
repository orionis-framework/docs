---
title: "Faker: providers I–L"
description: "Signatures, parameters, locales and examples for providers I-L."
editUrl: true
lastUpdated: false
---

This reference covers 100 facade names in the I-L range. The whole catalog contains **675 typed methods** (694 signatures including overloads) and **7 backend helpers accessible at runtime**, organized alphabetically. Availability was checked against the installed backend's 110 locales; some methods only exist for specific locales.

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


<a id="faker-ianaid"></a>

## `ianaId`

`ianaId` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def ianaId() -> str
```

Actual signature for `en_US`:

```text
fake.ianaId() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ianaId()
```

<a id="faker-iban"></a>

## `iban`

`iban` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def iban() -> str
```

Actual signature for `en_US`:

```text
fake.iban() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.iban()
```

<a id="faker-ide"></a>

## `ide`

`ide` generates company names and expressions for test entities.

Orionis typed contract:

```text
def ide() -> str
```

Actual signature for `fr_CH`:

```text
fake.ide() -> str
```


Verified availability: 1 locales. Example locales: `fr_CH`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.ide()
```

<a id="faker-identitycardnumber"></a>

## `identityCardNumber`

`identityCardNumber` generates names and identity components for test profiles.

Orionis typed contract:

```text
def identityCardNumber() -> str
```

Actual signature for `pl_PL`:

```text
fake.identityCardNumber() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.identityCardNumber()
```

<a id="faker-idi"></a>

## `idi`

`idi` generates company names and expressions for test entities.

Orionis typed contract:

```text
def idi() -> str
```

Actual signature for `fr_CH`:

```text
fake.idi() -> str
```


Verified availability: 1 locales. Example locales: `fr_CH`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.idi()
```

<a id="faker-image"></a>

## `image`

Generates image bytes and requires Pillow. Without that dependency it raises faker.exceptions.UnsupportedFeature; some formats also depend on available codecs.

Orionis typed contract:

```text
def image(size: tuple[int, int]=..., image_format: str=..., hue: int | Sequence[int] | str | None=..., luminosity: str | None=...) -> bytes
```

Actual signature for `en_US`:

```text
fake.image(size: Tuple[int, int] = (256, 256), image_format: str = 'png', hue: int | Sequence[int] | str | None = None, luminosity: str | None = None) -> bytes
```


| Parameter | Purpose |
| --- | --- |
| `size` | Image (width, height) pair in pixels. |
| `image_format` | Image encoding format, such as png. |
| `hue` | Provider-supported hue or color family. |
| `luminosity` | Color luminosity category. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

The example handles a missing dependency; install `Pillow` for images or `xmltodict` for XML in the environment using that provider.

```python
from faker.exceptions import UnsupportedFeature

fake = SampleFactory(locale="en_US", seed=7).fake
try:
    value = fake.image(size=(32, 32), image_format="png")
except UnsupportedFeature:
    value = None
```

<a id="faker-imageurl"></a>

## `imageUrl`

`imageUrl` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def imageUrl(width: int | None=..., height: int | None=..., placeholder_url: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.imageUrl(width: int | None = None, height: int | None = None, placeholder_url: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `width` | Placeholder image width in pixels. |
| `height` | Placeholder image height in pixels. |
| `placeholder_url` | URL template with {width}/{height} placeholders; only generates text, without downloading an image. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.imageUrl()
```

<a id="faker-individualsinn"></a>

## `individualsInn`

`individualsInn` generates company names and expressions for test entities.

Orionis typed contract:

```text
def individualsInn() -> str
```

Actual signature for `ru_RU`:

```text
fake.individualsInn() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.individualsInn()
```

<a id="faker-individualsogrn"></a>

## `individualsOgrn`

`individualsOgrn` generates company names and expressions for test entities.

Orionis typed contract:

```text
def individualsOgrn() -> str
```

Actual signature for `ru_RU`:

```text
fake.individualsOgrn() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.individualsOgrn()
```

<a id="faker-initials"></a>

## `initials`

`initials` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def initials() -> str
```

Actual signature for `ar_JO`:

```text
fake.initials() -> str
```


Verified availability: 1 locales. Example locales: `ar_JO`.

```python
fake = SampleFactory(locale="ar_JO", seed=7).fake
value = fake.initials()
```

<a id="faker-internetexplorer"></a>

## `internetExplorer`

`internetExplorer` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def internetExplorer() -> str
```

Actual signature for `en_US`:

```text
fake.internetExplorer() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.internetExplorer()
```

<a id="faker-invalidssn"></a>

## `invalidSsn`

`invalidSsn` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def invalidSsn() -> str
```

Actual signature for `en_US`:

```text
fake.invalidSsn() -> str
```


Verified availability: 52 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.invalidSsn()
```

<a id="faker-iosplatformtoken"></a>

## `iosPlatformToken`

`iosPlatformToken` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def iosPlatformToken() -> str
```

Actual signature for `en_US`:

```text
fake.iosPlatformToken() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.iosPlatformToken()
```

<a id="faker-ipv4"></a>

## `ipv4`

`ipv4` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def ipv4(network: bool=..., address_class: str | None=..., private: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.ipv4(network: bool = False, address_class: str | None = None, private: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `network` | Returns network specification rather than a host address. |
| `address_class` | IPv4 network class restricting the generated range. |
| `private` | Selects private IPv4 range when not None. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv4()
```

<a id="faker-ipv4networkclass"></a>

## `ipv4NetworkClass`

`ipv4NetworkClass` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def ipv4NetworkClass() -> str
```

Actual signature for `en_US`:

```text
fake.ipv4NetworkClass() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv4NetworkClass()
```

<a id="faker-ipv4private"></a>

## `ipv4Private`

`ipv4Private` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def ipv4Private(network: bool=..., address_class: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.ipv4Private(network: bool = False, address_class: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `network` | Returns network specification rather than a host address. |
| `address_class` | IPv4 network class restricting the generated range. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv4Private()
```

<a id="faker-ipv4public"></a>

## `ipv4Public`

`ipv4Public` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def ipv4Public(network: bool=..., address_class: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.ipv4Public(network: bool = False, address_class: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `network` | Returns network specification rather than a host address. |
| `address_class` | IPv4 network class restricting the generated range. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv4Public()
```

<a id="faker-ipv6"></a>

## `ipv6`

`ipv6` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def ipv6(network: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.ipv6(network: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `network` | Returns network specification rather than a host address. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv6()
```

<a id="faker-isleapyear"></a>

## `isLeapYear`

Checks whether the supplied year is a leap year; returns bool and requires a locale publishing this helper.

Orionis typed contract:

```text
def isLeapYear(year: int) -> bool
```

Actual signature for `it_IT`:

```text
fake.isLeapYear(year: int) -> bool
```


| Parameter | Purpose |
| --- | --- |
| `year` | Year generated or evaluated by this provider. |

Verified availability: 1 locales. Example locales: `it_IT`.

```python
fake = SampleFactory(locale="it_IT", seed=7).fake
value = fake.isLeapYear(year=2024)
```

<a id="faker-isbn10"></a>

## `isbn10`

`isbn10` generates publication identifiers for test catalogs.

Orionis typed contract:

```text
def isbn10(separator: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.isbn10(separator: str = '-') -> str
```


| Parameter | Purpose |
| --- | --- |
| `separator` | Textual format separator. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.isbn10()
```

<a id="faker-isbn13"></a>

## `isbn13`

`isbn13` generates publication identifiers for test catalogs.

Orionis typed contract:

```text
def isbn13(separator: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.isbn13(separator: str = '-') -> str
```


| Parameter | Purpose |
| --- | --- |
| `separator` | Textual format separator. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.isbn13()
```

<a id="faker-iso8601"></a>

## `iso8601`

`iso8601` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def iso8601(tzinfo: datetime.tzinfo | None=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., sep: str=..., timespec: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.iso8601(tzinfo: datetime.tzinfo | None = None, end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, sep: str = 'T', timespec: str = 'auto') -> str
```


| Parameter | Purpose |
| --- | --- |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |
| `end_datetime` | Ending datetime interval boundary. |
| `sep` | Format separator. |
| `timespec` | Temporal precision of ISO 8601 text. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.iso8601()
```

<a id="faker-items"></a>

## `items`

Returns backend (locale, native generator) pairs. Generate data through fake or fake[locale]; these introspection pairs contain native objects.

Helper accessible through dynamic facade dispatch; not declared in `_ProviderMethods`.

Actual signature for `en_US`:

```text
fake.items() -> 'list[tuple[str, Generator | Faker]]'
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = [(locale, type(generator).__name__) for locale, generator in fake.items()]
```

<a id="faker-itin"></a>

## `itin`

`itin` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def itin() -> str
```

Actual signature for `en_US`:

```text
fake.itin() -> str
```


Verified availability: 52 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.itin()
```

<a id="faker-jan"></a>

## `jan`

`jan` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def jan(length: int=...) -> str
```

Actual signature for `ja_JP`:

```text
fake.jan(length: int = 13) -> str
```


| Parameter | Purpose |
| --- | --- |
| `length` | Value length/size; units depend on this provider. |

Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.jan()
```

<a id="faker-jan13"></a>

## `jan13`

`jan13` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def jan13() -> str
```

Actual signature for `ja_JP`:

```text
fake.jan13() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.jan13()
```

<a id="faker-jan8"></a>

## `jan8`

`jan8` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def jan8() -> str
```

Actual signature for `ja_JP`:

```text
fake.jan8() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.jan8()
```

<a id="faker-job"></a>

## `job`

`job` generates job titles for sample profiles.

Orionis typed contract:

```text
def job() -> str
```

Actual signature for `en_US`:

```text
fake.job() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.job()
```

<a id="faker-jobfemale"></a>

## `jobFemale`

`jobFemale` generates job titles for sample profiles.

Orionis typed contract:

```text
def jobFemale() -> str
```

Actual signature for `en_US`:

```text
fake.jobFemale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.jobFemale()
```

<a id="faker-jobmale"></a>

## `jobMale`

`jobMale` generates job titles for sample profiles.

Orionis typed contract:

```text
def jobMale() -> str
```

Actual signature for `en_US`:

```text
fake.jobMale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.jobMale()
```

<a id="faker-json"></a>

## `json`

Returns JSON text; data_columns controls structure and cls supplies an optional JSON encoder.

Orionis typed contract:

```text
def json(data_columns: list | None=..., num_rows: int=..., indent: int | None=..., cls: type[encoder.JSONEncoder] | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.json(data_columns: List | None = None, num_rows: int = 10, indent: int | None = None, cls: Type[json.encoder.JSONEncoder] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `data_columns` | Structure, column or generator-token definition. |
| `num_rows` | Number of serialized data rows. |
| `indent` | JSON indentation or None for compact output. |
| `cls` | JSON encoder class. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.json(num_rows=2)
```

<a id="faker-jsonbytes"></a>

## `jsonBytes`

Generates JSON encoded as bytes rather than str.

Orionis typed contract:

```text
def jsonBytes(data_columns: list | None=..., num_rows: int=..., indent: int | None=..., cls: type[encoder.JSONEncoder] | None=...) -> bytes
```

Actual signature for `en_US`:

```text
fake.jsonBytes(data_columns: List | None = None, num_rows: int = 10, indent: int | None = None, cls: Type[json.encoder.JSONEncoder] | None = None) -> bytes
```


| Parameter | Purpose |
| --- | --- |
| `data_columns` | Structure, column or generator-token definition. |
| `num_rows` | Number of serialized data rows. |
| `indent` | JSON indentation or None for compact output. |
| `cls` | JSON encoder class. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.jsonBytes(num_rows=2)
```

<a id="faker-kana"></a>

## `kana`

`kana` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def kana() -> str
```

Actual signature for `ja_JP`:

```text
fake.kana() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.kana()
```

<a id="faker-kananame"></a>

## `kanaName`

`kanaName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def kanaName() -> str
```

Actual signature for `ja_JP`:

```text
fake.kanaName() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.kanaName()
```

<a id="faker-kananamefemale"></a>

## `kanaNameFemale`

`kanaNameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def kanaNameFemale() -> str
```

Actual signature for `ja_JP`:

```text
fake.kanaNameFemale() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.kanaNameFemale()
```

<a id="faker-kananamemale"></a>

## `kanaNameMale`

`kanaNameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def kanaNameMale() -> str
```

Actual signature for `ja_JP`:

```text
fake.kanaNameMale() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.kanaNameMale()
```

<a id="faker-kpp"></a>

## `kpp`

`kpp` generates company names and expressions for test entities.

Orionis typed contract:

```text
def kpp() -> str
```

Actual signature for `ru_RU`:

```text
fake.kpp() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.kpp()
```

<a id="faker-kvnr"></a>

## `kvnr`

`kvnr` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def kvnr() -> str
```

Actual signature for `de_DE`:

```text
fake.kvnr() -> str
```


Verified availability: 2 locales. Example locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.kvnr()
```

<a id="faker-landaddress"></a>

## `landAddress`

`landAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def landAddress() -> str
```

Actual signature for `ko_KR`:

```text
fake.landAddress() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.landAddress()
```

<a id="faker-landnumber"></a>

## `landNumber`

`landNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def landNumber() -> str
```

Actual signature for `ko_KR`:

```text
fake.landNumber() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.landNumber()
```

<a id="faker-landlinecode"></a>

## `landlineCode`

`landlineCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def landlineCode() -> str
```

Actual signature for `de_CH`:

```text
fake.landlineCode() -> str
```


Verified availability: 2 locales. Example locales: `de_CH`, `es_CL`.

```python
fake = SampleFactory(locale="de_CH", seed=7).fake
value = fake.landlineCode()
```

<a id="faker-landlinenumber"></a>

## `landlineNumber`

`landlineNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def landlineNumber() -> str
```

Actual signature for `az_AZ`:

```text
fake.landlineNumber() -> str
```


Verified availability: 4 locales. Example locales: `az_AZ`, `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.landlineNumber()
```

<a id="faker-languagecode"></a>

## `languageCode`

`languageCode` returns this localized provider's simulated value.

Orionis typed contract:

```text
def languageCode() -> str
```

Actual signature for `en_US`:

```text
fake.languageCode() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.languageCode()
```

<a id="faker-languagename"></a>

## `languageName`

`languageName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def languageName() -> str
```

Actual signature for `en_US`:

```text
fake.languageName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.languageName()
```

<a id="faker-largecompany"></a>

## `largeCompany`

`largeCompany` generates company names and expressions for test entities.

Orionis typed contract:

```text
def largeCompany() -> str
```

Actual signature for `az_AZ`:

```text
fake.largeCompany() -> str
```


Verified availability: 4 locales. Example locales: `az_AZ`, `nl_NL`, `ru_RU`, `tr_TR`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.largeCompany()
```

<a id="faker-lastkananame"></a>

## `lastKanaName`

`lastKanaName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastKanaName() -> str
```

Actual signature for `ja_JP`:

```text
fake.lastKanaName() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.lastKanaName()
```

<a id="faker-lastname"></a>

## `lastName`

`lastName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastName() -> str
```

Actual signature for `en_US`:

```text
fake.lastName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lastName()
```

<a id="faker-lastnamecommon"></a>

## `lastNameCommon`

`lastNameCommon` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameCommon() -> str
```

Actual signature for `bn_BD`:

```text
fake.lastNameCommon() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.lastNameCommon()
```

<a id="faker-lastnameest"></a>

## `lastNameEst`

`lastNameEst` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameEst() -> str
```

Actual signature for `et_EE`:

```text
fake.lastNameEst() -> str
```


Verified availability: 1 locales. Example locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.lastNameEst()
```

<a id="faker-lastnamefemale"></a>

## `lastNameFemale`

`lastNameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameFemale() -> str
```

Actual signature for `en_US`:

```text
fake.lastNameFemale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lastNameFemale()
```

<a id="faker-lastnamefemaleislamic"></a>

## `lastNameFemaleIslamic`

`lastNameFemaleIslamic` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameFemaleIslamic() -> str
```

Actual signature for `bn_BD`:

```text
fake.lastNameFemaleIslamic() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.lastNameFemaleIslamic()
```

<a id="faker-lastnamehinduism"></a>

## `lastNameHinduism`

`lastNameHinduism` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameHinduism() -> str
```

Actual signature for `bn_BD`:

```text
fake.lastNameHinduism() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.lastNameHinduism()
```

<a id="faker-lastnameislamic"></a>

## `lastNameIslamic`

`lastNameIslamic` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameIslamic() -> str
```

Actual signature for `bn_BD`:

```text
fake.lastNameIslamic() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.lastNameIslamic()
```

<a id="faker-lastnamemale"></a>

## `lastNameMale`

`lastNameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameMale() -> str
```

Actual signature for `en_US`:

```text
fake.lastNameMale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lastNameMale()
```

<a id="faker-lastnamenonbinary"></a>

## `lastNameNonbinary`

`lastNameNonbinary` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameNonbinary() -> str
```

Actual signature for `en_US`:

```text
fake.lastNameNonbinary() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lastNameNonbinary()
```

<a id="faker-lastnamepair"></a>

## `lastNamePair`

`lastNamePair` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNamePair() -> tuple[str, str, str]
```

Actual signature for `ja_JP`:

```text
fake.lastNamePair() -> Tuple[str, str, str]
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.lastNamePair()
```

<a id="faker-lastnamerus"></a>

## `lastNameRus`

`lastNameRus` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameRus() -> str
```

Actual signature for `et_EE`:

```text
fake.lastNameRus() -> str
```


Verified availability: 1 locales. Example locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.lastNameRus()
```

<a id="faker-lastnameuniquetofemale"></a>

## `lastNameUniqueToFemale`

`lastNameUniqueToFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameUniqueToFemale() -> str
```

Actual signature for `az_AZ`:

```text
fake.lastNameUniqueToFemale() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.lastNameUniqueToFemale()
```

<a id="faker-lastnameuniquetomale"></a>

## `lastNameUniqueToMale`

`lastNameUniqueToMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameUniqueToMale() -> str
```

Actual signature for `az_AZ`:

```text
fake.lastNameUniqueToMale() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.lastNameUniqueToMale()
```

<a id="faker-lastnameunisex"></a>

## `lastNameUnisex`

`lastNameUnisex` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastNameUnisex() -> str
```

Actual signature for `az_AZ`:

```text
fake.lastNameUnisex() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.lastNameUnisex()
```

<a id="faker-lastromanizedname"></a>

## `lastRomanizedName`

`lastRomanizedName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def lastRomanizedName() -> str
```

Actual signature for `ja_JP`:

```text
fake.lastRomanizedName() -> str
```


Verified availability: 3 locales. Example locales: `ja_JP`, `zh_CN`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.lastRomanizedName()
```

<a id="faker-latitude"></a>

## `latitude`

`latitude` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def latitude() -> Decimal
```

Actual signature for `en_US`:

```text
fake.latitude() -> decimal.Decimal
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.latitude()
```

<a id="faker-latlng"></a>

## `latlng`

`latlng` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def latlng() -> tuple[Decimal, Decimal]
```

Actual signature for `en_US`:

```text
fake.latlng() -> Tuple[decimal.Decimal, decimal.Decimal]
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.latlng()
```

<a id="faker-legalpersonnit"></a>

## `legalPersonNit`

`legalPersonNit` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def legalPersonNit() -> str
```

Actual signature for `es_CO`:

```text
fake.legalPersonNit() -> str
```


Verified availability: 1 locales. Example locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.legalPersonNit()
```

<a id="faker-legalpersonnitwithcheckdigit"></a>

## `legalPersonNitWithCheckDigit`

`legalPersonNitWithCheckDigit` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def legalPersonNitWithCheckDigit() -> str
```

Actual signature for `es_CO`:

```text
fake.legalPersonNitWithCheckDigit() -> str
```


Verified availability: 1 locales. Example locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.legalPersonNitWithCheckDigit()
```

<a id="faker-lexify"></a>

## `lexify`

Replaces `?` placeholders with characters from `letters`.

Orionis typed contract:

```text
def lexify(text: str=..., letters: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.lexify(text: str = '????', letters: str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') -> str
```


| Parameter | Purpose |
| --- | --- |
| `text` | Template or text processed by the provider. |
| `letters` | Alphabetic character population. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lexify()
```

<a id="faker-licenseplate"></a>

## `licensePlate`

`licensePlate` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlate() -> str
```

Actual signature for `en_US`:

```text
fake.licensePlate() -> str
```


| Parameter | Purpose |
| --- | --- |
| `ar` | Selects the Arabic plate representation in the locale exposing this option. |
| `region_name` | Region name used to form the local license plate. |
| `temporary_plate` | Requests a temporary plate where the locale supports it. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 102 more:

```text
fake.licensePlate() -> str
```

`ar_SA`:

```text
fake.licensePlate(ar: bool = True) -> str
```

`uk_UA`:

```text
fake.licensePlate(region_name: str | None = None, temporary_plate: bool = False) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.licensePlate()
```

<a id="faker-licenseplatear"></a>

## `licensePlateAr`

`licensePlateAr` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateAr() -> str
```

Actual signature for `ar_SA`:

```text
fake.licensePlateAr() -> str
```


Verified availability: 1 locales. Example locales: `ar_SA`.

```python
fake = SampleFactory(locale="ar_SA", seed=7).fake
value = fake.licensePlateAr()
```

<a id="faker-licenseplatebyprovince"></a>

## `licensePlateByProvince`

`licensePlateByProvince` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateByProvince(province_prefix: str | None=...) -> str
```

Actual signature for `es_ES`:

```text
fake.licensePlateByProvince(province_prefix: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `province_prefix` | Locale-supported province prefix. |

Verified availability: 2 locales. Example locales: `es_ES`, `es`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.licensePlateByProvince()
```

<a id="faker-licenseplatebystate"></a>

## `licensePlateByState`

`licensePlateByState` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateByState(state_abbr: str | None=...) -> str
```

Actual signature for `es_MX`:

```text
fake.licensePlateByState(state_abbr: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `state_abbr` | State abbreviation restricting localized output. |

Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.licensePlateByState()
```

<a id="faker-licenseplatecar"></a>

## `licensePlateCar`

`licensePlateCar` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateCar() -> str
```

Actual signature for `nl_NL`:

```text
fake.licensePlateCar() -> str
```


Verified availability: 1 locales. Example locales: `nl_NL`.

```python
fake = SampleFactory(locale="nl_NL", seed=7).fake
value = fake.licensePlateCar()
```

<a id="faker-licenseplatecdmx"></a>

## `licensePlateCdmx`

`licensePlateCdmx` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateCdmx() -> str
```

Actual signature for `es_MX`:

```text
fake.licensePlateCdmx() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.licensePlateCdmx()
```

<a id="faker-licenseplatediplomatic"></a>

## `licensePlateDiplomatic`

`licensePlateDiplomatic` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateDiplomatic() -> str
```

Actual signature for `es_CL`:

```text
fake.licensePlateDiplomatic() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.licensePlateDiplomatic()
```

<a id="faker-licenseplateen"></a>

## `licensePlateEn`

`licensePlateEn` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateEn() -> str
```

Actual signature for `ar_SA`:

```text
fake.licensePlateEn() -> str
```


Verified availability: 1 locales. Example locales: `ar_SA`.

```python
fake = SampleFactory(locale="ar_SA", seed=7).fake
value = fake.licensePlateEn()
```

<a id="faker-licenseplatemercosur"></a>

## `licensePlateMercosur`

`licensePlateMercosur` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateMercosur() -> str
```

Actual signature for `es_AR`:

```text
fake.licensePlateMercosur() -> str
```


Verified availability: 1 locales. Example locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.licensePlateMercosur()
```

<a id="faker-licenseplatemotorbike"></a>

## `licensePlateMotorbike`

`licensePlateMotorbike` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateMotorbike() -> str
```

Actual signature for `nl_NL`:

```text
fake.licensePlateMotorbike() -> str
```


Verified availability: 1 locales. Example locales: `nl_NL`.

```python
fake = SampleFactory(locale="nl_NL", seed=7).fake
value = fake.licensePlateMotorbike()
```

<a id="faker-licenseplatenew"></a>

## `licensePlateNew`

`licensePlateNew` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateNew() -> str
```

Actual signature for `es_CL`:

```text
fake.licensePlateNew() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.licensePlateNew()
```

<a id="faker-licenseplateold"></a>

## `licensePlateOld`

`licensePlateOld` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateOld() -> str
```

Actual signature for `es_AR`:

```text
fake.licensePlateOld() -> str
```


Verified availability: 3 locales. Example locales: `es_AR`, `es_CL`, `es_MX`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.licensePlateOld()
```

<a id="faker-licenseplatepolice"></a>

## `licensePlatePolice`

`licensePlatePolice` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlatePolice() -> str
```

Actual signature for `es_CL`:

```text
fake.licensePlatePolice() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.licensePlatePolice()
```

<a id="faker-licenseplateregexformats"></a>

## `licensePlateRegexFormats`

`licensePlateRegexFormats` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateRegexFormats() -> list[str]
```

Actual signature for `pl_PL`:

```text
fake.licensePlateRegexFormats() -> List[str]
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.licensePlateRegexFormats()
```

<a id="faker-licenseplatestate"></a>

## `licensePlateState`

`licensePlateState` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateState() -> str
```

Actual signature for `es_MX`:

```text
fake.licensePlateState() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.licensePlateState()
```

<a id="faker-licenseplatestateabbr"></a>

## `licensePlateStateAbbr`

`licensePlateStateAbbr` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateStateAbbr() -> str
```

Actual signature for `es_MX`:

```text
fake.licensePlateStateAbbr() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.licensePlateStateAbbr()
```

<a id="faker-licenseplatetemporary"></a>

## `licensePlateTemporary`

`licensePlateTemporary` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateTemporary() -> str
```

Actual signature for `es_CL`:

```text
fake.licensePlateTemporary() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.licensePlateTemporary()
```

<a id="faker-licenseplateunified"></a>

## `licensePlateUnified`

`licensePlateUnified` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def licensePlateUnified() -> str
```

Actual signature for `es_ES`:

```text
fake.licensePlateUnified() -> str
```


Verified availability: 3 locales. Example locales: `es_ES`, `es`, `es_MX`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.licensePlateUnified()
```

<a id="faker-lineaddress"></a>

## `lineAddress`

`lineAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def lineAddress() -> str
```

Actual signature for `el_GR`:

```text
fake.lineAddress() -> str
```


Verified availability: 1 locales. Example locales: `el_GR`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.lineAddress()
```

<a id="faker-linuxplatformtoken"></a>

## `linuxPlatformToken`

`linuxPlatformToken` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def linuxPlatformToken() -> str
```

Actual signature for `en_US`:

```text
fake.linuxPlatformToken() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.linuxPlatformToken()
```

<a id="faker-linuxprocessor"></a>

## `linuxProcessor`

`linuxProcessor` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def linuxProcessor() -> str
```

Actual signature for `en_US`:

```text
fake.linuxProcessor() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.linuxProcessor()
```

<a id="faker-locallatitude"></a>

## `localLatitude`

`localLatitude` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def localLatitude() -> Decimal
```

Actual signature for `de_AT`:

```text
fake.localLatitude() -> decimal.Decimal
```


Verified availability: 3 locales. Example locales: `de_AT`, `el_GR`, `mk_MK`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.localLatitude()
```

<a id="faker-locallatlng"></a>

## `localLatlng`

`localLatlng` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def localLatlng(country_code: str=..., coords_only: bool=...) -> tuple[str, ...] | None
```

Actual signature for `en_US`:

```text
fake.localLatlng(country_code: str = 'US', coords_only: bool = False) -> Tuple[str, ...] | None
```


| Parameter | Purpose |
| --- | --- |
| `country_code` | Country code for localized selection. |
| `coords_only` | Returns coordinates only, without location metadata. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 102 more:

```text
fake.localLatlng(country_code: str = 'US', coords_only: bool = False) -> Tuple[str, ...] | None
```

`bn_BD`:

```text
fake.localLatlng(country_code: str = 'BD', coords_only: bool = False) -> Tuple[str, ...] | None
```

`el_GR`:

```text
fake.localLatlng(*args: Any, **kwargs: Any) -> Tuple[str, str]
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.localLatlng()
```

<a id="faker-locallongitude"></a>

## `localLongitude`

`localLongitude` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def localLongitude() -> Decimal
```

Actual signature for `de_AT`:

```text
fake.localLongitude() -> decimal.Decimal
```


Verified availability: 3 locales. Example locales: `de_AT`, `el_GR`, `mk_MK`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.localLongitude()
```

<a id="faker-localregon"></a>

## `localRegon`

`localRegon` generates company names and expressions for test entities.

Orionis typed contract:

```text
def localRegon() -> str
```

Actual signature for `pl_PL`:

```text
fake.localRegon() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.localRegon()
```

<a id="faker-locale"></a>

## `locale`

`locale` returns this localized provider's simulated value.

Orionis typed contract:

```text
def locale() -> str
```

Actual signature for `en_US`:

```text
fake.locale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.locale()
```

<a id="faker-localizedean"></a>

## `localizedEan`

`localizedEan` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def localizedEan(length: int=...) -> str
```

Actual signature for `en_US`:

```text
fake.localizedEan(length: int = 13) -> str
```


| Parameter | Purpose |
| --- | --- |
| `length` | Value length/size; units depend on this provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.localizedEan()
```

<a id="faker-localizedean13"></a>

## `localizedEan13`

`localizedEan13` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def localizedEan13() -> str
```

Actual signature for `en_US`:

```text
fake.localizedEan13() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.localizedEan13()
```

<a id="faker-localizedean8"></a>

## `localizedEan8`

`localizedEan8` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def localizedEan8() -> str
```

Actual signature for `en_US`:

```text
fake.localizedEan8() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.localizedEan8()
```

<a id="faker-locationonland"></a>

## `locationOnLand`

`locationOnLand` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def locationOnLand(coords_only: bool=...) -> tuple[str, ...]
```

Actual signature for `en_US`:

```text
fake.locationOnLand(coords_only: bool = False) -> Tuple[str, ...]
```


| Parameter | Purpose |
| --- | --- |
| `coords_only` | Returns coordinates only, without location metadata. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.locationOnLand()
```

<a id="faker-longitude"></a>

## `longitude`

`longitude` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def longitude() -> Decimal
```

Actual signature for `en_US`:

```text
fake.longitude() -> decimal.Decimal
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.longitude()
```

<a id="faker-luzonprovince"></a>

## `luzonProvince`

`luzonProvince` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def luzonProvince() -> str
```

Actual signature for `en_PH`:

```text
fake.luzonProvince() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.luzonProvince()
```

<a id="faker-luzonprovinceaddress"></a>

## `luzonProvinceAddress`

`luzonProvinceAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def luzonProvinceAddress() -> str
```

Actual signature for `en_PH`:

```text
fake.luzonProvinceAddress() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.luzonProvinceAddress()
```

<a id="faker-luzonprovincepostcode"></a>

## `luzonProvincePostcode`

`luzonProvincePostcode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def luzonProvincePostcode() -> str
```

Actual signature for `en_PH`:

```text
fake.luzonProvincePostcode() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.luzonProvincePostcode()
```
