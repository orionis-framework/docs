---
title: "Faker: providers A–D"
description: "Signatures, parameters, locales and examples for providers A-D."
editUrl: true
lastUpdated: false
---

This reference covers 167 facade names in the A-D range. The whole catalog contains **675 typed methods** (694 signatures including overloads) and **7 backend helpers accessible at runtime**, organized alphabetically. Availability was checked against the installed backend's 110 locales; some methods only exist for specific locales.

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


<a id="faker-aadhaarid"></a>

## `aadhaarId`

`aadhaarId` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def aadhaarId() -> str
```

Actual signature for `en_IN`:

```text
fake.aadhaarId() -> str
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.aadhaarId()
```

<a id="faker-aba"></a>

## `aba`

`aba` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def aba() -> str
```

Actual signature for `en_US`:

```text
fake.aba() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.aba()
```

<a id="faker-academicprefix"></a>

## `academicPrefix`

`academicPrefix` generates names and identity components for test profiles.

Orionis typed contract:

```text
def academicPrefix() -> str
```

Actual signature for `de_AT`:

```text
fake.academicPrefix() -> str
```


Verified availability: 1 locales. Example locales: `de_AT`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.academicPrefix()
```

<a id="faker-academicsuffix"></a>

## `academicSuffix`

`academicSuffix` generates names and identity components for test profiles.

Orionis typed contract:

```text
def academicSuffix() -> str
```

Actual signature for `de_AT`:

```text
fake.academicSuffix() -> str
```


Verified availability: 1 locales. Example locales: `de_AT`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.academicSuffix()
```

<a id="faker-address"></a>

## `address`

`address` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def address() -> str
```

Actual signature for `en_US`:

```text
fake.address() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.address()
```

<a id="faker-addressdetail"></a>

## `addressDetail`

`addressDetail` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def addressDetail() -> str
```

Actual signature for `ko_KR`:

```text
fake.addressDetail() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.addressDetail()
```

<a id="faker-administrativeunit"></a>

## `administrativeUnit`

`administrativeUnit` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def administrativeUnit() -> str
```

Actual signature for `en_US`:

```text
fake.administrativeUnit() -> str
```


Verified availability: 104 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.administrativeUnit()
```

<a id="faker-ampm"></a>

## `amPm`

`amPm` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def amPm() -> str
```

Actual signature for `en_US`:

```text
fake.amPm() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.amPm()
```

<a id="faker-amphoe"></a>

## `amphoe`

`amphoe` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def amphoe() -> str
```

Actual signature for `th_TH`:

```text
fake.amphoe() -> str
```


Verified availability: 2 locales. Example locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.amphoe()
```

<a id="faker-androidplatformtoken"></a>

## `androidPlatformToken`

`androidPlatformToken` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def androidPlatformToken() -> str
```

Actual signature for `en_US`:

```text
fake.androidPlatformToken() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.androidPlatformToken()
```

<a id="faker-apecode"></a>

## `apeCode`

`apeCode` generates company names and expressions for test entities.

Orionis typed contract:

```text
def apeCode(version: str | None=...) -> str
```

Actual signature for `fr_CH`:

```text
fake.apeCode(version: str | None = 'naf-2003') -> str
```


| Parameter | Purpose |
| --- | --- |
| `version` | APE code version; naf-2003 requests NAF 2003 format. |

Verified availability: 2 locales. Example locales: `fr_CH`, `fr_FR`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.apeCode()
```

<a id="faker-area2landlinenumber"></a>

## `area2LandlineNumber`

`area2LandlineNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def area2LandlineNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.area2LandlineNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.area2LandlineNumber()
```

<a id="faker-areacode"></a>

## `areaCode`

`areaCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def areaCode() -> str
```

Actual signature for `ar_AE`:

```text
fake.areaCode() -> str
```


Verified availability: 10 locales. Example locales: `ar_AE`, `ar_DZ`, `ar_JO`, `ar_PS`, `az_AZ`, `de_AT`, `en_AU`, `en_NZ`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.areaCode()
```

<a id="faker-areacodewithseparator"></a>

## `areaCodeWithSeparator`

`areaCodeWithSeparator` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def areaCodeWithSeparator() -> str
```

Actual signature for `fr_FR`:

```text
fake.areaCodeWithSeparator() -> str
```


Verified availability: 1 locales. Example locales: `fr_FR`.

```python
fake = SampleFactory(locale="fr_FR", seed=7).fake
value = fake.areaCodeWithSeparator()
```

<a id="faker-areacodewithoutseparator"></a>

## `areaCodeWithoutSeparator`

`areaCodeWithoutSeparator` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def areaCodeWithoutSeparator() -> str
```

Actual signature for `fr_FR`:

```text
fake.areaCodeWithoutSeparator() -> str
```


Verified availability: 1 locales. Example locales: `fr_FR`.

```python
fake = SampleFactory(locale="fr_FR", seed=7).fake
value = fake.areaCodeWithoutSeparator()
```

<a id="faker-areaname"></a>

## `areaName`

`areaName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def areaName() -> str
```

Actual signature for `bn_BD`:

```text
fake.areaName() -> str
```


Verified availability: 3 locales. Example locales: `bn_BD`, `en_BD`, `ja_JP`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.areaName()
```

<a id="faker-asciicompanyemail"></a>

## `asciiCompanyEmail`

`asciiCompanyEmail` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def asciiCompanyEmail() -> str
```

Actual signature for `en_US`:

```text
fake.asciiCompanyEmail() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.asciiCompanyEmail()
```

<a id="faker-asciiemail"></a>

## `asciiEmail`

`asciiEmail` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def asciiEmail() -> str
```

Actual signature for `en_US`:

```text
fake.asciiEmail() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.asciiEmail()
```

<a id="faker-asciifreeemail"></a>

## `asciiFreeEmail`

`asciiFreeEmail` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def asciiFreeEmail() -> str
```

Actual signature for `en_US`:

```text
fake.asciiFreeEmail() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.asciiFreeEmail()
```

<a id="faker-asciisafeemail"></a>

## `asciiSafeEmail`

`asciiSafeEmail` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def asciiSafeEmail() -> str
```

Actual signature for `en_US`:

```text
fake.asciiSafeEmail() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.asciiSafeEmail()
```

<a id="faker-automobilelicenseplate"></a>

## `automobileLicensePlate`

`automobileLicensePlate` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def automobileLicensePlate() -> str
```

Actual signature for `en_PH`:

```text
fake.automobileLicensePlate() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.automobileLicensePlate()
```

<a id="faker-autonomouscommunity"></a>

## `autonomousCommunity`

`autonomousCommunity` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def autonomousCommunity() -> str
```

Actual signature for `es_ES`:

```text
fake.autonomousCommunity() -> str
```


Verified availability: 2 locales. Example locales: `es_ES`, `es`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.autonomousCommunity()
```

<a id="faker-bairro"></a>

## `bairro`

`bairro` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def bairro() -> str
```

Actual signature for `pt_BR`:

```text
fake.bairro() -> str
```


Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.bairro()
```

<a id="faker-ban"></a>

## `ban`

`ban` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def ban() -> str
```

Actual signature for `ja_JP`:

```text
fake.ban() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.ban()
```

<a id="faker-bank"></a>

## `bank`

`bank` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def bank() -> str
```

Actual signature for `en_US`:

```text
fake.bank() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bank()
```

<a id="faker-bankcountry"></a>

## `bankCountry`

`bankCountry` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def bankCountry() -> str
```

Actual signature for `en_US`:

```text
fake.bankCountry() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bankCountry()
```

<a id="faker-basicphonenumber"></a>

## `basicPhoneNumber`

`basicPhoneNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def basicPhoneNumber() -> str
```

Actual signature for `en_US`:

```text
fake.basicPhoneNumber() -> str
```


Verified availability: 36 locales. Example locales: `en_US`, `ar_AA`, `ar_BH`, `ar_EG`, `ar_SA`, `dk_DK`, `el_CY`, `en`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.basicPhoneNumber()
```

<a id="faker-bayantelarea2landlinenumber"></a>

## `bayantelArea2LandlineNumber`

`bayantelArea2LandlineNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def bayantelArea2LandlineNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.bayantelArea2LandlineNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.bayantelArea2LandlineNumber()
```

<a id="faker-bayantellandlineidentifier"></a>

## `bayantelLandlineIdentifier`

`bayantelLandlineIdentifier` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def bayantelLandlineIdentifier() -> str
```

Actual signature for `en_PH`:

```text
fake.bayantelLandlineIdentifier() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.bayantelLandlineIdentifier()
```

<a id="faker-bban"></a>

## `bban`

`bban` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def bban() -> str
```

Actual signature for `en_US`:

```text
fake.bban() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bban()
```

<a id="faker-bic"></a>

## `bic`

`bic` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def bic() -> str
```

Actual signature for `ru_RU`:

```text
fake.bic() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.bic()
```

<a id="faker-binary"></a>

## `binary`

`binary` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def binary(length: int=...) -> bytes
```

Actual signature for `en_US`:

```text
fake.binary(length: int = 1048576) -> bytes
```


| Parameter | Purpose |
| --- | --- |
| `length` | Value length/size; units depend on this provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.binary(length=16)
```

<a id="faker-birthnumber"></a>

## `birthNumber`

`birthNumber` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def birthNumber() -> str
```

Actual signature for `cs_CZ`:

```text
fake.birthNumber() -> str
```


Verified availability: 2 locales. Example locales: `cs_CZ`, `sk_SK`.

```python
fake = SampleFactory(locale="cs_CZ", seed=7).fake
value = fake.birthNumber()
```

<a id="faker-boolean"></a>

## `boolean`

Boolean with a `chance_of_getting_true` percentage chance of True.

Orionis typed contract:

```text
def boolean(chance_of_getting_true: int=...) -> bool
```

Actual signature for `en_US`:

```text
fake.boolean(chance_of_getting_true: int = 50) -> bool
```


| Parameter | Purpose |
| --- | --- |
| `chance_of_getting_true` | True percentage (0 to 100). |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.boolean()
```

<a id="faker-borough"></a>

## `borough`

`borough` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def borough() -> str
```

Actual signature for `ko_KR`:

```text
fake.borough() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.borough()
```

<a id="faker-bothify"></a>

## `bothify`

Replaces numeric/alphabetic template placeholders. Useful for SKU references; `#` generates digits and `?` letters from `letters`.

Orionis typed contract:

```text
def bothify(text: str=..., letters: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.bothify(text: str = '## ??', letters: str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') -> str
```


| Parameter | Purpose |
| --- | --- |
| `text` | Template or text processed by the provider. |
| `letters` | Alphabetic character population. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bothify()
```

<a id="faker-brandsuffix"></a>

## `brandSuffix`

`brandSuffix` generates company names and expressions for test entities.

Orionis typed contract:

```text
def brandSuffix() -> str
```

Actual signature for `ko_KR`:

```text
fake.brandSuffix() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.brandSuffix()
```

<a id="faker-bs"></a>

## `bs`

`bs` generates company names and expressions for test entities.

Orionis typed contract:

```text
def bs() -> str
```

Actual signature for `en_US`:

```text
fake.bs() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bs()
```

<a id="faker-buildingdong"></a>

## `buildingDong`

`buildingDong` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingDong() -> str
```

Actual signature for `ko_KR`:

```text
fake.buildingDong() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.buildingDong()
```

<a id="faker-buildingname"></a>

## `buildingName`

`buildingName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingName() -> str
```

Actual signature for `bn_BD`:

```text
fake.buildingName() -> str
```


Verified availability: 7 locales. Example locales: `bn_BD`, `en_BD`, `en_PH`, `fil_PH`, `ja_JP`, `ko_KR`, `tl_PH`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.buildingName()
```

<a id="faker-buildingnamesuffix"></a>

## `buildingNameSuffix`

`buildingNameSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingNameSuffix() -> str
```

Actual signature for `en_PH`:

```text
fake.buildingNameSuffix() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.buildingNameSuffix()
```

<a id="faker-buildingnumber"></a>

## `buildingNumber`

`buildingNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingNumber() -> str
```

Actual signature for `en_US`:

```text
fake.buildingNumber() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.buildingNumber()
```

<a id="faker-buildingnumbersegregated"></a>

## `buildingNumberSegregated`

`buildingNumberSegregated` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingNumberSegregated() -> str
```

Actual signature for `ko_KR`:

```text
fake.buildingNumberSegregated() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.buildingNumberSegregated()
```

<a id="faker-buildingnumberunderground"></a>

## `buildingNumberUnderground`

`buildingNumberUnderground` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingNumberUnderground() -> str
```

Actual signature for `ko_KR`:

```text
fake.buildingNumberUnderground() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.buildingNumberUnderground()
```

<a id="faker-buildingprefix"></a>

## `buildingPrefix`

`buildingPrefix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingPrefix() -> str
```

Actual signature for `en_MS`:

```text
fake.buildingPrefix() -> str
```


Verified availability: 2 locales. Example locales: `en_MS`, `ne_NP`.

```python
fake = SampleFactory(locale="en_MS", seed=7).fake
value = fake.buildingPrefix()
```

<a id="faker-buildingsuffix"></a>

## `buildingSuffix`

`buildingSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingSuffix() -> str
```

Actual signature for `ko_KR`:

```text
fake.buildingSuffix() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.buildingSuffix()
```

<a id="faker-buildingunitnumber"></a>

## `buildingUnitNumber`

`buildingUnitNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def buildingUnitNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.buildingUnitNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.buildingUnitNumber()
```

<a id="faker-businessesinn"></a>

## `businessesInn`

`businessesInn` generates company names and expressions for test entities.

Orionis typed contract:

```text
def businessesInn() -> str
```

Actual signature for `ru_RU`:

```text
fake.businessesInn() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.businessesInn()
```

<a id="faker-businessesogrn"></a>

## `businessesOgrn`

`businessesOgrn` generates company names and expressions for test entities.

Orionis typed contract:

```text
def businessesOgrn() -> str
```

Actual signature for `ru_RU`:

```text
fake.businessesOgrn() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.businessesOgrn()
```

<a id="faker-canton"></a>

## `canton`

`canton` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def canton() -> tuple[str, str]
```

Actual signature for `de_CH`:

```text
fake.canton() -> Tuple[str, str]
```


Verified availability: 2 locales. Example locales: `de_CH`, `fr_CH`.

```python
fake = SampleFactory(locale="de_CH", seed=7).fake
value = fake.canton()
```

<a id="faker-cantoncode"></a>

## `cantonCode`

`cantonCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cantonCode() -> str
```

Actual signature for `de_CH`:

```text
fake.cantonCode() -> str
```


Verified availability: 2 locales. Example locales: `de_CH`, `fr_CH`.

```python
fake = SampleFactory(locale="de_CH", seed=7).fake
value = fake.cantonCode()
```

<a id="faker-cantonname"></a>

## `cantonName`

`cantonName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cantonName() -> str
```

Actual signature for `de_CH`:

```text
fake.cantonName() -> str
```


Verified availability: 2 locales. Example locales: `de_CH`, `fr_CH`.

```python
fake = SampleFactory(locale="de_CH", seed=7).fake
value = fake.cantonName()
```

<a id="faker-catchphrase"></a>

## `catchPhrase`

`catchPhrase` generates company names and expressions for test entities.

Orionis typed contract:

```text
def catchPhrase() -> str
```

Actual signature for `en_US`:

```text
fake.catchPhrase() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.catchPhrase()
```

<a id="faker-catchphraseattribute"></a>

## `catchPhraseAttribute`

`catchPhraseAttribute` generates company names and expressions for test entities.

Orionis typed contract:

```text
def catchPhraseAttribute() -> str
```

Actual signature for `ar_DZ`:

```text
fake.catchPhraseAttribute() -> str
```


Verified availability: 5 locales. Example locales: `ar_DZ`, `fr_CH`, `fr_DZ`, `fr_FR`, `pt_BR`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.catchPhraseAttribute()
```

<a id="faker-catchphrasenoun"></a>

## `catchPhraseNoun`

`catchPhraseNoun` generates company names and expressions for test entities.

Orionis typed contract:

```text
def catchPhraseNoun() -> str
```

Actual signature for `ar_DZ`:

```text
fake.catchPhraseNoun() -> str
```


Verified availability: 5 locales. Example locales: `ar_DZ`, `fr_CH`, `fr_DZ`, `fr_FR`, `pt_BR`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.catchPhraseNoun()
```

<a id="faker-catchphraseverb"></a>

## `catchPhraseVerb`

`catchPhraseVerb` generates company names and expressions for test entities.

Orionis typed contract:

```text
def catchPhraseVerb() -> str
```

Actual signature for `ar_DZ`:

```text
fake.catchPhraseVerb() -> str
```


Verified availability: 5 locales. Example locales: `ar_DZ`, `fr_CH`, `fr_DZ`, `fr_FR`, `pt_BR`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.catchPhraseVerb()
```

<a id="faker-cellphoneblock"></a>

## `cellphoneBlock`

`cellphoneBlock` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def cellphoneBlock() -> str
```

Actual signature for `es_CL`:

```text
fake.cellphoneBlock() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.cellphoneBlock()
```

<a id="faker-cellphonenumber"></a>

## `cellphoneNumber`

`cellphoneNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def cellphoneNumber() -> str
```

Actual signature for `ar_AE`:

```text
fake.cellphoneNumber() -> str
```


Verified availability: 10 locales. Example locales: `ar_AE`, `ar_DZ`, `ar_JO`, `ar_PS`, `az_AZ`, `de_AT`, `de_CH`, `en_GB`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.cellphoneNumber()
```

<a id="faker-cellphoneprovidercode"></a>

## `cellphoneProviderCode`

`cellphoneProviderCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def cellphoneProviderCode() -> str
```

Actual signature for `ar_AE`:

```text
fake.cellphoneProviderCode() -> str
```


Verified availability: 1 locales. Example locales: `ar_AE`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.cellphoneProviderCode()
```

<a id="faker-century"></a>

## `century`

`century` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def century() -> str
```

Actual signature for `en_US`:

```text
fake.century() -> str
```


| Parameter | Purpose |
| --- | --- |
| `thai_digit` | Uses Thai digits in provider output. |
| `buddhist_era` | Uses the Buddhist era for Thai-provider date representation. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 102 more:

```text
fake.century() -> str
```

`th`, `th_TH`:

```text
fake.century(thai_digit: bool = False, buddhist_era: bool = True) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.century()
```

<a id="faker-checkingaccount"></a>

## `checkingAccount`

`checkingAccount` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def checkingAccount() -> str
```

Actual signature for `ru_RU`:

```text
fake.checkingAccount() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.checkingAccount()
```

<a id="faker-chome"></a>

## `chome`

`chome` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def chome() -> str
```

Actual signature for `ja_JP`:

```text
fake.chome() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.chome()
```

<a id="faker-chrome"></a>

## `chrome`

`chrome` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def chrome(version_from: int=..., version_to: int=..., build_from: int=..., build_to: int=...) -> str
```

Actual signature for `en_US`:

```text
fake.chrome(version_from: int = 13, version_to: int = 63, build_from: int = 800, build_to: int = 899) -> str
```


| Parameter | Purpose |
| --- | --- |
| `version_from` | Starting simulated Chrome version. |
| `version_to` | Ending simulated Chrome version. |
| `build_from` | Lower bound for the simulated Chrome build number. |
| `build_to` | Upper bound for the simulated Chrome build number. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.chrome()
```

<a id="faker-cie"></a>

## `cie`

`cie` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def cie() -> str
```

Actual signature for `it_IT`:

```text
fake.cie() -> str
```


Verified availability: 1 locales. Example locales: `it_IT`.

```python
fake = SampleFactory(locale="it_IT", seed=7).fake
value = fake.cie()
```

<a id="faker-cif"></a>

## `cif`

`cif` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def cif() -> str
```

Actual signature for `es_ES`:

```text
fake.cif() -> str
```


Verified availability: 3 locales. Example locales: `es_ES`, `es`, `es_CA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.cif()
```

<a id="faker-cin"></a>

## `cin`

`cin` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def cin() -> str
```

Actual signature for `pt_BR`:

```text
fake.cin() -> str
```


Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.cin()
```

<a id="faker-city"></a>

## `city`

`city` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def city() -> str
```

Actual signature for `en_US`:

```text
fake.city() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.city()
```

<a id="faker-cityadjective"></a>

## `cityAdjective`

`cityAdjective` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cityAdjective() -> str
```

Actual signature for `es_MX`:

```text
fake.cityAdjective() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.cityAdjective()
```

<a id="faker-cityname"></a>

## `cityName`

`cityName` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def cityName() -> str
```

Actual signature for `bn_BD`:

```text
fake.cityName() -> str
```


Verified availability: 30 locales. Example locales: `bn_BD`, `cs_CZ`, `da_DK`, `de`, `de_AT`, `de_CH`, `de_DE`, `en_IN`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.cityName()
```

<a id="faker-citynamesuffix"></a>

## `cityNameSuffix`

`cityNameSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cityNameSuffix() -> str
```

Actual signature for `zh_TW`:

```text
fake.cityNameSuffix() -> str
```


Verified availability: 2 locales. Example locales: `zh_TW`, `zu_ZA`.

```python
fake = SampleFactory(locale="zh_TW", seed=7).fake
value = fake.cityNameSuffix()
```

<a id="faker-citypart"></a>

## `cityPart`

`cityPart` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cityPart() -> str
```

Actual signature for `hu_HU`:

```text
fake.cityPart() -> str
```


Verified availability: 1 locales. Example locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.cityPart()
```

<a id="faker-cityprefix"></a>

## `cityPrefix`

`cityPrefix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cityPrefix() -> str
```

Actual signature for `en_US`:

```text
fake.cityPrefix() -> str
```


Verified availability: 63 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.cityPrefix()
```

<a id="faker-cityprefixabbr"></a>

## `cityPrefixAbbr`

`cityPrefixAbbr` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cityPrefixAbbr() -> str
```

Actual signature for `en_MS`:

```text
fake.cityPrefixAbbr() -> str
```


Verified availability: 1 locales. Example locales: `en_MS`.

```python
fake = SampleFactory(locale="en_MS", seed=7).fake
value = fake.cityPrefixAbbr()
```

<a id="faker-citystate"></a>

## `cityState`

`cityState` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cityState() -> str
```

Actual signature for `en_MS`:

```text
fake.cityState() -> str
```


Verified availability: 1 locales. Example locales: `en_MS`.

```python
fake = SampleFactory(locale="en_MS", seed=7).fake
value = fake.cityState()
```

<a id="faker-citysuffix"></a>

## `citySuffix`

`citySuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def citySuffix() -> str
```

Actual signature for `en_US`:

```text
fake.citySuffix() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.citySuffix()
```

<a id="faker-citywithpostcode"></a>

## `cityWithPostcode`

`cityWithPostcode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def cityWithPostcode() -> str
```

Actual signature for `cs_CZ`:

```text
fake.cityWithPostcode() -> str
```


Verified availability: 6 locales. Example locales: `cs_CZ`, `de`, `de_AT`, `de_DE`, `ro_RO`, `sk_SK`.

```python
fake = SampleFactory(locale="cs_CZ", seed=7).fake
value = fake.cityWithPostcode()
```

<a id="faker-civilstatus"></a>

## `civilStatus`

`civilStatus` generates names and identity components for test profiles.

Orionis typed contract:

```text
def civilStatus() -> tuple[str, str]
```

Actual signature for `de_DE`:

```text
fake.civilStatus() -> Tuple[str, str]
```


Verified availability: 2 locales. Example locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.civilStatus()
```

<a id="faker-civilstatuscode"></a>

## `civilStatusCode`

`civilStatusCode` generates names and identity components for test profiles.

Orionis typed contract:

```text
def civilStatusCode() -> str
```

Actual signature for `de_DE`:

```text
fake.civilStatusCode() -> str
```


Verified availability: 2 locales. Example locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.civilStatusCode()
```

<a id="faker-civilstatusname"></a>

## `civilStatusName`

`civilStatusName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def civilStatusName() -> str
```

Actual signature for `de_DE`:

```text
fake.civilStatusName() -> str
```


Verified availability: 2 locales. Example locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.civilStatusName()
```

<a id="faker-clabe"></a>

## `clabe`

`clabe` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def clabe(bank_code: int | None=...) -> str
```

Actual signature for `es_MX`:

```text
fake.clabe(bank_code: int | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `bank_code` | Bank code used when generating CLABE. |

Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.clabe()
```

<a id="faker-classificationnumber"></a>

## `classificationNumber`

`classificationNumber` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def classificationNumber() -> str
```

Actual signature for `ja_JP`:

```text
fake.classificationNumber() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.classificationNumber()
```

<a id="faker-cnpj"></a>

## `cnpj`

`cnpj` generates company names and expressions for test entities.

Orionis typed contract:

```text
def cnpj(use_alphanumeric: bool=...) -> str
```

Actual signature for `pt_BR`:

```text
fake.cnpj(use_alphanumeric: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `use_alphanumeric` | Allows the Brazilian company identifier alphanumeric format. |

Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.cnpj()
```

<a id="faker-color"></a>

## `color`

`color` generates colors and representations for interface data.

Orionis typed contract:

```text
def color(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=..., color_format: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.color(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None, color_format: str = 'hex') -> str
```


| Parameter | Purpose |
| --- | --- |
| `hue` | Provider-supported hue or color family. |
| `luminosity` | Color luminosity category. |
| `color_format` | Color representation (provider-specific). |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.color()
```

<a id="faker-colorhsl"></a>

## `colorHsl`

`colorHsl` generates colors and representations for interface data.

Orionis typed contract:

```text
def colorHsl(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=...) -> tuple[int, int, int]
```

Actual signature for `en_US`:

```text
fake.colorHsl(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None) -> Tuple[int, int, int]
```


| Parameter | Purpose |
| --- | --- |
| `hue` | Provider-supported hue or color family. |
| `luminosity` | Color luminosity category. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorHsl()
```

<a id="faker-colorhsv"></a>

## `colorHsv`

`colorHsv` generates colors and representations for interface data.

Orionis typed contract:

```text
def colorHsv(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=...) -> tuple[int, int, int]
```

Actual signature for `en_US`:

```text
fake.colorHsv(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None) -> Tuple[int, int, int]
```


| Parameter | Purpose |
| --- | --- |
| `hue` | Provider-supported hue or color family. |
| `luminosity` | Color luminosity category. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorHsv()
```

<a id="faker-colorname"></a>

## `colorName`

`colorName` generates colors and representations for interface data.

Orionis typed contract:

```text
def colorName() -> str
```

Actual signature for `en_US`:

```text
fake.colorName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorName()
```

<a id="faker-colorrgb"></a>

## `colorRgb`

`colorRgb` generates colors and representations for interface data.

Orionis typed contract:

```text
def colorRgb(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=...) -> tuple[int, int, int]
```

Actual signature for `en_US`:

```text
fake.colorRgb(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None) -> Tuple[int, int, int]
```


| Parameter | Purpose |
| --- | --- |
| `hue` | Provider-supported hue or color family. |
| `luminosity` | Color luminosity category. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorRgb()
```

<a id="faker-colorrgbfloat"></a>

## `colorRgbFloat`

`colorRgbFloat` generates colors and representations for interface data.

Orionis typed contract:

```text
def colorRgbFloat(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=...) -> tuple[float, float, float]
```

Actual signature for `en_US`:

```text
fake.colorRgbFloat(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None) -> Tuple[float, float, float]
```


| Parameter | Purpose |
| --- | --- |
| `hue` | Provider-supported hue or color family. |
| `luminosity` | Color luminosity category. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorRgbFloat()
```

<a id="faker-commonstreetname"></a>

## `commonStreetName`

`commonStreetName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def commonStreetName() -> str
```

Actual signature for `es_CL`:

```text
fake.commonStreetName() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.commonStreetName()
```

<a id="faker-commune"></a>

## `commune`

`commune` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def commune() -> str
```

Actual signature for `es_CL`:

```text
fake.commune() -> str
```


Verified availability: 2 locales. Example locales: `es_CL`, `vi_VN`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.commune()
```

<a id="faker-communeandregion"></a>

## `communeAndRegion`

`communeAndRegion` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def communeAndRegion() -> str
```

Actual signature for `es_CL`:

```text
fake.communeAndRegion() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.communeAndRegion()
```

<a id="faker-communecode"></a>

## `communeCode`

`communeCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def communeCode() -> str
```

Actual signature for `es_CL`:

```text
fake.communeCode() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.communeCode()
```

<a id="faker-communename"></a>

## `communeName`

`communeName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def communeName() -> str
```

Actual signature for `vi_VN`:

```text
fake.communeName() -> str
```


Verified availability: 1 locales. Example locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.communeName()
```

<a id="faker-communeprefix"></a>

## `communePrefix`

`communePrefix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def communePrefix() -> Any
```

Actual signature for `vi_VN`:

```text
fake.communePrefix()
```


Verified availability: 1 locales. Example locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.communePrefix()
```

<a id="faker-company"></a>

## `company`

`company` generates company names and expressions for test entities.

Orionis typed contract:

```text
def company() -> str
```

Actual signature for `en_US`:

```text
fake.company() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.company()
```

<a id="faker-companybusinessid"></a>

## `companyBusinessId`

`companyBusinessId` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyBusinessId() -> str
```

Actual signature for `fi_FI`:

```text
fake.companyBusinessId() -> str
```


Verified availability: 1 locales. Example locales: `fi_FI`.

```python
fake = SampleFactory(locale="fi_FI", seed=7).fake
value = fake.companyBusinessId()
```

<a id="faker-companycategory"></a>

## `companyCategory`

`companyCategory` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyCategory() -> str
```

Actual signature for `ja_JP`:

```text
fake.companyCategory() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.companyCategory()
```

<a id="faker-companyemail"></a>

## `companyEmail`

`companyEmail` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def companyEmail() -> str
```

Actual signature for `en_US`:

```text
fake.companyEmail() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.companyEmail()
```

<a id="faker-companyid"></a>

## `companyId`

`companyId` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyId(use_alphanumeric: bool=...) -> str
```

Actual signature for `pt_BR`:

```text
fake.companyId(use_alphanumeric: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `use_alphanumeric` | Allows the Brazilian company identifier alphanumeric format. |

Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.companyId()
```

<a id="faker-companylimitedprefix"></a>

## `companyLimitedPrefix`

`companyLimitedPrefix` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyLimitedPrefix() -> str
```

Actual signature for `th_TH`:

```text
fake.companyLimitedPrefix() -> str
```


Verified availability: 2 locales. Example locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.companyLimitedPrefix()
```

<a id="faker-companylimitedsuffix"></a>

## `companyLimitedSuffix`

`companyLimitedSuffix` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyLimitedSuffix() -> str
```

Actual signature for `th_TH`:

```text
fake.companyLimitedSuffix() -> str
```


Verified availability: 2 locales. Example locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.companyLimitedSuffix()
```

<a id="faker-companynameword"></a>

## `companyNameWord`

`companyNameWord` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyNameWord() -> str
```

Actual signature for `ko_KR`:

```text
fake.companyNameWord() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.companyNameWord()
```

<a id="faker-companyprefix"></a>

## `companyPrefix`

`companyPrefix` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyPrefix() -> str
```

Actual signature for `es_ES`:

```text
fake.companyPrefix() -> str
```


Verified availability: 13 locales. Example locales: `es_ES`, `es`, `es_CL`, `es_MX`, `id_ID`, `ja_JP`, `nl_NL`, `pl_PL`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.companyPrefix()
```

<a id="faker-companyrut"></a>

## `companyRut`

`companyRut` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def companyRut() -> str
```

Actual signature for `es_CL`:

```text
fake.companyRut() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.companyRut()
```

<a id="faker-companysuffix"></a>

## `companySuffix`

`companySuffix` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companySuffix() -> str
```

Actual signature for `en_US`:

```text
fake.companySuffix() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.companySuffix()
```

<a id="faker-companytype"></a>

## `companyType`

`companyType` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyType() -> str
```

Actual signature for `es_ES`:

```text
fake.companyType() -> str
```


Verified availability: 5 locales. Example locales: `es_ES`, `en_PH`, `es`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.companyType()
```

<a id="faker-companyvat"></a>

## `companyVat`

`companyVat` generates company names and expressions for test entities.

Orionis typed contract:

```text
def companyVat() -> str
```

Actual signature for `fi_FI`:

```text
fake.companyVat() -> str
```


| Parameter | Purpose |
| --- | --- |
| `siren` | SIREN incorporated into the RCS registry number. |

Actual locale variants:

`fi_FI`, `it_IT`, `pl_PL`:

```text
fake.companyVat() -> str
```

`fr_CH`, `fr_FR`:

```text
fake.companyVat(siren: str = '') -> str
```

Verified availability: 5 locales. Example locales: `fi_FI`, `fr_CH`, `fr_FR`, `it_IT`, `pl_PL`.

```python
fake = SampleFactory(locale="fi_FI", seed=7).fake
value = fake.companyVat()
```

<a id="faker-concelho"></a>

## `concelho`

`concelho` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def concelho() -> str
```

Actual signature for `pt_PT`:

```text
fake.concelho() -> str
```


Verified availability: 1 locales. Example locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.concelho()
```

<a id="faker-coordinate"></a>

## `coordinate`

`coordinate` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def coordinate(center: float | None=..., radius: float | int=...) -> Decimal
```

Actual signature for `en_US`:

```text
fake.coordinate(center: float | None = None, radius: float | int = 0.001) -> decimal.Decimal
```


| Parameter | Purpose |
| --- | --- |
| `center` | Center coordinate around which the value is generated. |
| `radius` | Maximum coordinate distance from center. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.coordinate()
```

<a id="faker-correspondentaccount"></a>

## `correspondentAccount`

`correspondentAccount` generates fictional banking identifiers; formatting does not represent operational accounts.

Orionis typed contract:

```text
def correspondentAccount() -> str
```

Actual signature for `ru_RU`:

```text
fake.correspondentAccount() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.correspondentAccount()
```

<a id="faker-country"></a>

## `country`

`country` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def country() -> str
```

Actual signature for `en_US`:

```text
fake.country() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.country()
```

<a id="faker-countrycallingcode"></a>

## `countryCallingCode`

`countryCallingCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def countryCallingCode() -> str
```

Actual signature for `en_US`:

```text
fake.countryCallingCode() -> str
```


Verified availability: 107 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.countryCallingCode()
```

<a id="faker-countrycode"></a>

## `countryCode`

`countryCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def countryCode(representation: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.countryCode(representation: str = 'alpha-2') -> str
```


| Parameter | Purpose |
| --- | --- |
| `representation` | Provider-supported country-code representation. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.countryCode()
```

<a id="faker-county"></a>

## `county`

`county` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def county() -> str
```

Actual signature for `en_GB`:

```text
fake.county() -> str
```


Verified availability: 3 locales. Example locales: `en_GB`, `en_IE`, `hu_HU`.

```python
fake = SampleFactory(locale="en_GB", seed=7).fake
value = fake.county()
```

<a id="faker-cpf"></a>

## `cpf`

`cpf` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def cpf() -> str
```

Actual signature for `pt_BR`:

```text
fake.cpf() -> str
```


Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.cpf()
```

<a id="faker-creditcardexpire"></a>

## `creditCardExpire`

`creditCardExpire` generates fictional card formats; it does not generate usable payment instruments.

Orionis typed contract:

```text
def creditCardExpire(start: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., end: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., date_format: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.creditCardExpire(start: datetime.date | datetime.datetime | datetime.timedelta | str | int = 'now', end: datetime.date | datetime.datetime | datetime.timedelta | str | int = '+10y', date_format: str = '%m/%y') -> str
```


| Parameter | Purpose |
| --- | --- |
| `start` | Starting expiry-date boundary. |
| `end` | Ending expiry-date boundary. |
| `date_format` | strftime format for date text. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardExpire()
```

<a id="faker-creditcardfull"></a>

## `creditCardFull`

`creditCardFull` generates fictional card formats; it does not generate usable payment instruments.

Orionis typed contract:

```text
def creditCardFull(card_type: CardType | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.creditCardFull(card_type: ~CardType | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `card_type` | Card category accepted by the native provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardFull()
```

<a id="faker-creditcardnumber"></a>

## `creditCardNumber`

`creditCardNumber` generates fictional card formats; it does not generate usable payment instruments.

Orionis typed contract:

```text
def creditCardNumber(card_type: CardType | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.creditCardNumber(card_type: ~CardType | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `card_type` | Card category accepted by the native provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardNumber()
```

<a id="faker-creditcardprovider"></a>

## `creditCardProvider`

`creditCardProvider` generates fictional card formats; it does not generate usable payment instruments.

Orionis typed contract:

```text
def creditCardProvider(card_type: CardType | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.creditCardProvider(card_type: ~CardType | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `card_type` | Card category accepted by the native provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardProvider()
```

<a id="faker-creditcardsecuritycode"></a>

## `creditCardSecurityCode`

`creditCardSecurityCode` generates fictional card formats; it does not generate usable payment instruments.

Orionis typed contract:

```text
def creditCardSecurityCode(card_type: CardType | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.creditCardSecurityCode(card_type: ~CardType | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `card_type` | Card category accepted by the native provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardSecurityCode()
```

<a id="faker-cryptocurrency"></a>

## `cryptocurrency`

`cryptocurrency` generates currency names, symbols and codes for catalogs.

Orionis typed contract:

```text
def cryptocurrency() -> tuple[str, str]
```

Actual signature for `en_US`:

```text
fake.cryptocurrency() -> Tuple[str, str]
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.cryptocurrency()
```

<a id="faker-cryptocurrencycode"></a>

## `cryptocurrencyCode`

`cryptocurrencyCode` generates currency names, symbols and codes for catalogs.

Orionis typed contract:

```text
def cryptocurrencyCode() -> str
```

Actual signature for `en_US`:

```text
fake.cryptocurrencyCode() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.cryptocurrencyCode()
```

<a id="faker-cryptocurrencyname"></a>

## `cryptocurrencyName`

`cryptocurrencyName` generates currency names, symbols and codes for catalogs.

Orionis typed contract:

```text
def cryptocurrencyName() -> str
```

Actual signature for `en_US`:

```text
fake.cryptocurrencyName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.cryptocurrencyName()
```

<a id="faker-csv"></a>

## `csv`

Returns CSV as a string. data_columns uses native parser tokens; num_rows controls row count.

Orionis typed contract:

```text
def csv(header: Sequence[str] | None=..., data_columns: tuple[str, str]=..., num_rows: int=..., include_row_ids: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.csv(header: Sequence[str] | None = None, data_columns: Tuple[str, str] = ('{{name}}', '{{address}}'), num_rows: int = 10, include_row_ids: bool = False) -> str
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
value = fake.csv(num_rows=2)
```

<a id="faker-curp"></a>

## `curp`

`curp` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def curp() -> str
```

Actual signature for `es_MX`:

```text
fake.curp() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.curp()
```

<a id="faker-currency"></a>

## `currency`

`currency` generates currency names, symbols and codes for catalogs.

Orionis typed contract:

```text
def currency() -> tuple[str, str]
```

Actual signature for `en_US`:

```text
fake.currency() -> Tuple[str, str]
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currency()
```

<a id="faker-currencycode"></a>

## `currencyCode`

`currencyCode` generates currency names, symbols and codes for catalogs.

Orionis typed contract:

```text
def currencyCode() -> str
```

Actual signature for `en_US`:

```text
fake.currencyCode() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currencyCode()
```

<a id="faker-currencyname"></a>

## `currencyName`

`currencyName` generates currency names, symbols and codes for catalogs.

Orionis typed contract:

```text
def currencyName() -> str
```

Actual signature for `en_US`:

```text
fake.currencyName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currencyName()
```

<a id="faker-currencysymbol"></a>

## `currencySymbol`

`currencySymbol` generates currency names, symbols and codes for catalogs.

Orionis typed contract:

```text
def currencySymbol(code: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.currencySymbol(code: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `code` | Currency code for the requested symbol; None permits automatic selection. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currencySymbol()
```

<a id="faker-currentcountry"></a>

## `currentCountry`

`currentCountry` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def currentCountry() -> str
```

Actual signature for `en_US`:

```text
fake.currentCountry() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currentCountry()
```

<a id="faker-currentcountrycode"></a>

## `currentCountryCode`

`currentCountryCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def currentCountryCode() -> str
```

Actual signature for `en_US`:

```text
fake.currentCountryCode() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currentCountryCode()
```

<a id="faker-date"></a>

## `date`

`date` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def date(pattern: str=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.date(pattern: str = '%Y-%m-%d', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `pattern` | Provider-supported formatting pattern. |
| `end_datetime` | Ending datetime interval boundary. |
| `thai_digit` | Uses Thai digits in provider output. |
| `buddhist_era` | Uses the Buddhist era for Thai-provider date representation. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 102 more:

```text
fake.date(pattern: str = '%Y-%m-%d', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> str
```

`th`, `th_TH`:

```text
fake.date(pattern: str = '%-d %b %Y', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, thai_digit: bool = False, buddhist_era: bool = True) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.date()
```

<a id="faker-datebetween"></a>

## `dateBetween`

`dateBetween` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateBetween(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.dateBetween(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30y', end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = 'today') -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `start_date` | Start boundary: date/time, relative interval or provider-supported format. |
| `end_date` | End date/time boundary or relative interval. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateBetween()
```

<a id="faker-datebetweendates"></a>

## `dateBetweenDates`

`dateBetweenDates` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateBetweenDates(date_start: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., date_end: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.dateBetweenDates(date_start: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, date_end: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `date_start` | Starting date boundary. |
| `date_end` | Ending date boundary. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateBetweenDates()
```

<a id="faker-dateobject"></a>

## `dateObject`

`dateObject` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateObject(end_datetime: datetime.datetime | None=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.dateObject(end_datetime: datetime.datetime | None = None) -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `end_datetime` | Ending datetime interval boundary. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateObject()
```

<a id="faker-dateofbirth"></a>

## `dateOfBirth`

`dateOfBirth` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateOfBirth(tzinfo: datetime.tzinfo | None=..., minimum_age: int=..., maximum_age: int=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.dateOfBirth(tzinfo: datetime.tzinfo | None = None, minimum_age: int = 0, maximum_age: int = 115) -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |
| `minimum_age` | Minimum age for the birth date. |
| `maximum_age` | Maximum age for the birth date. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateOfBirth()
```

<a id="faker-datethiscentury"></a>

## `dateThisCentury`

`dateThisCentury` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateThisCentury(before_today: bool=..., after_today: bool=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.dateThisCentury(before_today: bool = True, after_today: bool = False) -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `before_today` | Allows dates before today within the period. |
| `after_today` | Allows dates after today within the period. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateThisCentury()
```

<a id="faker-datethisdecade"></a>

## `dateThisDecade`

`dateThisDecade` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateThisDecade(before_today: bool=..., after_today: bool=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.dateThisDecade(before_today: bool = True, after_today: bool = False) -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `before_today` | Allows dates before today within the period. |
| `after_today` | Allows dates after today within the period. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateThisDecade()
```

<a id="faker-datethismonth"></a>

## `dateThisMonth`

`dateThisMonth` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateThisMonth(before_today: bool=..., after_today: bool=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.dateThisMonth(before_today: bool = True, after_today: bool = False) -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `before_today` | Allows dates before today within the period. |
| `after_today` | Allows dates after today within the period. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateThisMonth()
```

<a id="faker-datethisyear"></a>

## `dateThisYear`

`dateThisYear` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateThisYear(before_today: bool=..., after_today: bool=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.dateThisYear(before_today: bool = True, after_today: bool = False) -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `before_today` | Allows dates before today within the period. |
| `after_today` | Allows dates after today within the period. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateThisYear()
```

<a id="faker-datetime"></a>

## `dateTime`

`dateTime` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateTime(tzinfo: datetime.tzinfo | None=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.dateTime(tzinfo: datetime.tzinfo | None = None, end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |
| `end_datetime` | Ending datetime interval boundary. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTime()
```

<a id="faker-datetimead"></a>

## `dateTimeAd`

`dateTimeAd` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateTimeAd(tzinfo: datetime.tzinfo | None=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., start_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.dateTimeAd(tzinfo: datetime.tzinfo | None = None, end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, start_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |
| `end_datetime` | Ending datetime interval boundary. |
| `start_datetime` | Starting datetime interval boundary. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeAd()
```

<a id="faker-datetimebetween"></a>

## `dateTimeBetween`

`dateTimeBetween` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateTimeBetween(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.dateTimeBetween(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30y', end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = 'now', tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `start_date` | Start boundary: date/time, relative interval or provider-supported format. |
| `end_date` | End date/time boundary or relative interval. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeBetween()
```

<a id="faker-datetimebetweendates"></a>

## `dateTimeBetweenDates`

`dateTimeBetweenDates` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateTimeBetweenDates(datetime_start: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., datetime_end: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.dateTimeBetweenDates(datetime_start: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, datetime_end: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `datetime_start` | Starting datetime boundary. |
| `datetime_end` | Ending datetime boundary. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeBetweenDates()
```

<a id="faker-datetimethiscentury"></a>

## `dateTimeThisCentury`

`dateTimeThisCentury` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateTimeThisCentury(before_now: bool=..., after_now: bool=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.dateTimeThisCentury(before_now: bool = True, after_now: bool = False, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `before_now` | Allows datetimes before the current moment within the period. |
| `after_now` | Allows datetimes after the current moment within the period. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeThisCentury()
```

<a id="faker-datetimethisdecade"></a>

## `dateTimeThisDecade`

`dateTimeThisDecade` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateTimeThisDecade(before_now: bool=..., after_now: bool=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.dateTimeThisDecade(before_now: bool = True, after_now: bool = False, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `before_now` | Allows datetimes before the current moment within the period. |
| `after_now` | Allows datetimes after the current moment within the period. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeThisDecade()
```

<a id="faker-datetimethismonth"></a>

## `dateTimeThisMonth`

`dateTimeThisMonth` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateTimeThisMonth(before_now: bool=..., after_now: bool=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.dateTimeThisMonth(before_now: bool = True, after_now: bool = False, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `before_now` | Allows datetimes before the current moment within the period. |
| `after_now` | Allows datetimes after the current moment within the period. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeThisMonth()
```

<a id="faker-datetimethisyear"></a>

## `dateTimeThisYear`

`dateTimeThisYear` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dateTimeThisYear(before_now: bool=..., after_now: bool=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.dateTimeThisYear(before_now: bool = True, after_now: bool = False, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `before_now` | Allows datetimes before the current moment within the period. |
| `after_now` | Allows datetimes after the current moment within the period. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeThisYear()
```

<a id="faker-dayofmonth"></a>

## `dayOfMonth`

`dayOfMonth` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dayOfMonth() -> str
```

Actual signature for `en_US`:

```text
fake.dayOfMonth() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dayOfMonth()
```

<a id="faker-dayofweek"></a>

## `dayOfWeek`

`dayOfWeek` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dayOfWeek() -> str
```

Actual signature for `en_US`:

```text
fake.dayOfWeek() -> str
```


Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 80 more:

```text
fake.dayOfWeek() -> str
```

`az_AZ`, `cs_CZ`, `da_DK`, `de`, `de_AT`, `de_DE` and 18 more:

```text
fake.dayOfWeek()
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dayOfWeek()
```

<a id="faker-dayofweekinguj"></a>

## `dayOfWeekInGuj`

`dayOfWeekInGuj` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def dayOfWeekInGuj() -> str
```

Actual signature for `gu_IN`:

```text
fake.dayOfWeekInGuj() -> str
```


Verified availability: 1 locales. Example locales: `gu_IN`.

```python
fake = SampleFactory(locale="gu_IN", seed=7).fake
value = fake.dayOfWeekInGuj()
```

<a id="faker-delarguments"></a>

## `delArguments`

Deletes a parser argument or group. Missing groups return None; missing arguments in an existing group may raise KeyError.

Helper accessible through dynamic facade dispatch; not declared in `_ProviderMethods`.

Actual signature for `en_US`:

```text
fake.delArguments(group: str, argument: str | None = None) -> Any
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
fake.setArguments("small", {"min_value": 1, "max_value": 3})
value = fake.delArguments("small", "max_value")
```

<a id="faker-department"></a>

## `department`

`department` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def department() -> str
```

Actual signature for `es_CO`:

```text
fake.department() -> str
```


Actual locale variants:

`es_CO`:

```text
fake.department() -> str
```

`fr_FR`:

```text
fake.department() -> Tuple[str, str]
```

Verified availability: 2 locales. Example locales: `es_CO`, `fr_FR`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.department()
```

<a id="faker-departmentcode"></a>

## `departmentCode`

`departmentCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def departmentCode() -> str
```

Actual signature for `es_CO`:

```text
fake.departmentCode() -> str
```


Verified availability: 1 locales. Example locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.departmentCode()
```

<a id="faker-departmentname"></a>

## `departmentName`

`departmentName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def departmentName() -> str
```

Actual signature for `fr_FR`:

```text
fake.departmentName() -> str
```


Verified availability: 1 locales. Example locales: `fr_FR`.

```python
fake = SampleFactory(locale="fr_FR", seed=7).fake
value = fake.departmentName()
```

<a id="faker-departmentnumber"></a>

## `departmentNumber`

`departmentNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def departmentNumber() -> str
```

Actual signature for `fr_FR`:

```text
fake.departmentNumber() -> str
```


Verified availability: 1 locales. Example locales: `fr_FR`.

```python
fake = SampleFactory(locale="fr_FR", seed=7).fake
value = fake.departmentNumber()
```

<a id="faker-dga"></a>

## `dga`

`dga` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def dga(year: int | None=..., month: int | None=..., day: int | None=..., tld: str | None=..., length: int | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.dga(year: int | None = None, month: int | None = None, day: int | None = None, tld: str | None = None, length: int | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `year` | Year generated or evaluated by this provider. |
| `month` | Month used by the simulated domain algorithm. |
| `day` | Day used by the simulated domain algorithm. |
| `tld` | Top-level domain for the generated domain. |
| `length` | Value length/size; units depend on this provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dga()
```

<a id="faker-dialingcode"></a>

## `dialingCode`

`dialingCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def dialingCode() -> str
```

Actual signature for `de_AT`:

```text
fake.dialingCode() -> str
```


Verified availability: 2 locales. Example locales: `de_AT`, `de_CH`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.dialingCode()
```

<a id="faker-diplomaticlicenseplate"></a>

## `diplomaticLicensePlate`

`diplomaticLicensePlate` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def diplomaticLicensePlate() -> str
```

Actual signature for `uk_UA`:

```text
fake.diplomaticLicensePlate() -> str
```


Verified availability: 1 locales. Example locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.diplomaticLicensePlate()
```

<a id="faker-district"></a>

## `district`

`district` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def district() -> str
```

Actual signature for `ar_PS`:

```text
fake.district() -> str
```


Verified availability: 4 locales. Example locales: `ar_PS`, `az_AZ`, `ne_NP`, `zh_CN`.

```python
fake = SampleFactory(locale="ar_PS", seed=7).fake
value = fake.district()
```

<a id="faker-districtsuffix"></a>

## `districtSuffix`

`districtSuffix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def districtSuffix() -> str
```

Actual signature for `az_AZ`:

```text
fake.districtSuffix() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.districtSuffix()
```

<a id="faker-distrito"></a>

## `distrito`

`distrito` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def distrito() -> str
```

Actual signature for `pt_PT`:

```text
fake.distrito() -> str
```


Verified availability: 1 locales. Example locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.distrito()
```

<a id="faker-dkstreetname"></a>

## `dkStreetName`

`dkStreetName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def dkStreetName() -> str
```

Actual signature for `da_DK`:

```text
fake.dkStreetName() -> str
```


Verified availability: 1 locales. Example locales: `da_DK`.

```python
fake = SampleFactory(locale="da_DK", seed=7).fake
value = fake.dkStreetName()
```

<a id="faker-doi"></a>

## `doi`

`doi` generates simulated DOI identifiers for test publications.

Orionis typed contract:

```text
def doi() -> str
```

Actual signature for `en_US`:

```text
fake.doi() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.doi()
```

<a id="faker-domainname"></a>

## `domainName`

`domainName` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def domainName(levels: int=...) -> str
```

Actual signature for `en_US`:

```text
fake.domainName(levels: int = 1) -> str
```


| Parameter | Purpose |
| --- | --- |
| `levels` | Number of domain/hostname levels. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.domainName()
```

<a id="faker-domainword"></a>

## `domainWord`

`domainWord` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def domainWord() -> str
```

Actual signature for `en_US`:

```text
fake.domainWord() -> str
```


Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 103 more:

```text
fake.domainWord() -> str
```

`zh_TW`:

```text
fake.domainWord()
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.domainWord()
```

<a id="faker-dsv"></a>

## `dsv`

Returns delimited text; dialect and fmtparams are passed to the CSV writer.

Orionis typed contract:

```text
def dsv(dialect: str=..., header: Sequence[str] | None=..., data_columns: tuple[str, str]=..., num_rows: int=..., include_row_ids: bool=..., **fmtparams: Any) -> str
```

Actual signature for `en_US`:

```text
fake.dsv(dialect: str = 'faker-csv', header: Sequence[str] | None = None, data_columns: Tuple[str, str] = ('{{name}}', '{{address}}'), num_rows: int = 10, include_row_ids: bool = False, **fmtparams: Any) -> str
```


| Parameter | Purpose |
| --- | --- |
| `dialect` | CSV writer dialect. |
| `header` | Column headings or None to omit them. |
| `data_columns` | Structure, column or generator-token definition. |
| `num_rows` | Number of serialized data rows. |
| `include_row_ids` | Adds a sequential row identifier. |
| `fmtparams` | Additional native CSV writer options. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dsv(num_rows=2)
```
