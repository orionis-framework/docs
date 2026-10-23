---
title: "Faker: providers M–P"
description: "Signatures, parameters, locales and examples for providers M-P."
editUrl: true
lastUpdated: false
---

This reference covers 151 facade names in the M-P range. The whole catalog contains **675 typed methods** (694 signatures including overloads) and **7 backend helpers accessible at runtime**, organized alphabetically. Availability was checked against the installed backend's 110 locales; some methods only exist for specific locales.

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


<a id="faker-macaddress"></a>

## `macAddress`

`macAddress` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def macAddress(multicast: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.macAddress(multicast: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `multicast` | Controls the MAC multicast bit. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.macAddress()
```

<a id="faker-macplatformtoken"></a>

## `macPlatformToken`

`macPlatformToken` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def macPlatformToken() -> str
```

Actual signature for `en_US`:

```text
fake.macPlatformToken() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.macPlatformToken()
```

<a id="faker-macprocessor"></a>

## `macProcessor`

`macProcessor` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def macProcessor() -> str
```

Actual signature for `en_US`:

```text
fake.macProcessor() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.macProcessor()
```

<a id="faker-md5"></a>

## `md5`

MD5 digest of random data for fixtures; does not replace the Hash facade for passwords.

Orionis typed contract:

```text
def md5() -> str
def md5(raw_output: Literal[True]) -> bytes
def md5(raw_output: Literal[False]) -> str
```

Actual signature for `en_US`:

```text
fake.md5(raw_output: bool = False) -> bytes | str
```


| Parameter | Purpose |
| --- | --- |
| `raw_output` | Requests binary/native output rather than usual text. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.md5()
```

<a id="faker-metromanilaaddress"></a>

## `metroManilaAddress`

`metroManilaAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def metroManilaAddress() -> str
```

Actual signature for `en_PH`:

```text
fake.metroManilaAddress() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.metroManilaAddress()
```

<a id="faker-metromanilalgu"></a>

## `metroManilaLgu`

`metroManilaLgu` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def metroManilaLgu() -> str
```

Actual signature for `en_PH`:

```text
fake.metroManilaLgu() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.metroManilaLgu()
```

<a id="faker-metromanilapostcode"></a>

## `metroManilaPostcode`

`metroManilaPostcode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def metroManilaPostcode() -> str
```

Actual signature for `en_PH`:

```text
fake.metroManilaPostcode() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.metroManilaPostcode()
```

<a id="faker-metropolitancity"></a>

## `metropolitanCity`

`metropolitanCity` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def metropolitanCity() -> str
```

Actual signature for `ko_KR`:

```text
fake.metropolitanCity() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.metropolitanCity()
```

<a id="faker-middlename"></a>

## `middleName`

`middleName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def middleName() -> str
```

Actual signature for `is_IS`:

```text
fake.middleName() -> str
```


Verified availability: 5 locales. Example locales: `is_IS`, `or_IN`, `ru_RU`, `uk_UA`, `vi_VN`.

```python
fake = SampleFactory(locale="is_IS", seed=7).fake
value = fake.middleName()
```

<a id="faker-middlenamefemale"></a>

## `middleNameFemale`

`middleNameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def middleNameFemale() -> str
```

Actual signature for `ru_RU`:

```text
fake.middleNameFemale() -> str
```


Verified availability: 2 locales. Example locales: `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.middleNameFemale()
```

<a id="faker-middlenamemale"></a>

## `middleNameMale`

`middleNameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def middleNameMale() -> str
```

Actual signature for `ru_RU`:

```text
fake.middleNameMale() -> str
```


Verified availability: 2 locales. Example locales: `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.middleNameMale()
```

<a id="faker-militaryapo"></a>

## `militaryApo`

`militaryApo` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def militaryApo() -> str
```

Actual signature for `en_US`:

```text
fake.militaryApo() -> str
```


Verified availability: 45 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.militaryApo()
```

<a id="faker-militarydpo"></a>

## `militaryDpo`

`militaryDpo` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def militaryDpo() -> str
```

Actual signature for `en_US`:

```text
fake.militaryDpo() -> str
```


Verified availability: 45 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.militaryDpo()
```

<a id="faker-militaryship"></a>

## `militaryShip`

`militaryShip` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def militaryShip() -> str
```

Actual signature for `en_US`:

```text
fake.militaryShip() -> str
```


Verified availability: 45 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.militaryShip()
```

<a id="faker-militarystate"></a>

## `militaryState`

`militaryState` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def militaryState() -> str
```

Actual signature for `en_US`:

```text
fake.militaryState() -> str
```


Verified availability: 45 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.militaryState()
```

<a id="faker-mimetype"></a>

## `mimeType`

`mimeType` generates fictional filenames, paths and media types; it does not create files on disk.

Orionis typed contract:

```text
def mimeType(category: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.mimeType(category: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `category` | Provider data category. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.mimeType()
```

<a id="faker-mindanaoprovince"></a>

## `mindanaoProvince`

`mindanaoProvince` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def mindanaoProvince() -> str
```

Actual signature for `en_PH`:

```text
fake.mindanaoProvince() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mindanaoProvince()
```

<a id="faker-mindanaoprovinceaddress"></a>

## `mindanaoProvinceAddress`

`mindanaoProvinceAddress` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def mindanaoProvinceAddress() -> str
```

Actual signature for `en_PH`:

```text
fake.mindanaoProvinceAddress() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mindanaoProvinceAddress()
```

<a id="faker-mindanaoprovincepostcode"></a>

## `mindanaoProvincePostcode`

`mindanaoProvincePostcode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def mindanaoProvincePostcode() -> str
```

Actual signature for `en_PH`:

```text
fake.mindanaoProvincePostcode() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mindanaoProvincePostcode()
```

<a id="faker-minguoyear"></a>

## `minguoYear`

`minguoYear` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def minguoYear() -> str
```

Actual signature for `zh_TW`:

```text
fake.minguoYear() -> str
```


Verified availability: 1 locales. Example locales: `zh_TW`.

```python
fake = SampleFactory(locale="zh_TW", seed=7).fake
value = fake.minguoYear()
```

<a id="faker-miscarea2landlinenumber"></a>

## `miscArea2LandlineNumber`

`miscArea2LandlineNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def miscArea2LandlineNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.miscArea2LandlineNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.miscArea2LandlineNumber()
```

<a id="faker-misclandlineidentifier"></a>

## `miscLandlineIdentifier`

`miscLandlineIdentifier` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def miscLandlineIdentifier() -> str
```

Actual signature for `en_PH`:

```text
fake.miscLandlineIdentifier() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.miscLandlineIdentifier()
```

<a id="faker-mobilenumber"></a>

## `mobileNumber`

`mobileNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def mobileNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.mobileNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mobileNumber()
```

<a id="faker-mobileoperator"></a>

## `mobileOperator`

`mobileOperator` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def mobileOperator() -> str
```

Actual signature for `ar_DZ`:

```text
fake.mobileOperator() -> str
```


Verified availability: 2 locales. Example locales: `ar_DZ`, `fr_DZ`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.mobileOperator()
```

<a id="faker-month"></a>

## `month`

`month` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def month() -> str
```

Actual signature for `en_US`:

```text
fake.month() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.month()
```

<a id="faker-monthinguj"></a>

## `monthInGuj`

`monthInGuj` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def monthInGuj() -> str
```

Actual signature for `gu_IN`:

```text
fake.monthInGuj() -> str
```


Verified availability: 1 locales. Example locales: `gu_IN`.

```python
fake = SampleFactory(locale="gu_IN", seed=7).fake
value = fake.monthInGuj()
```

<a id="faker-monthname"></a>

## `monthName`

`monthName` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def monthName() -> str
```

Actual signature for `en_US`:

```text
fake.monthName() -> str
```


Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 80 more:

```text
fake.monthName() -> str
```

`az_AZ`, `cs_CZ`, `da_DK`, `de`, `de_AT`, `de_DE` and 18 more:

```text
fake.monthName()
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.monthName()
```

<a id="faker-monthnameinguj"></a>

## `monthNameInGuj`

`monthNameInGuj` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def monthNameInGuj() -> str
```

Actual signature for `gu_IN`:

```text
fake.monthNameInGuj() -> str
```


Verified availability: 1 locales. Example locales: `gu_IN`.

```python
fake = SampleFactory(locale="gu_IN", seed=7).fake
value = fake.monthNameInGuj()
```

<a id="faker-motorcyclelicenseplate"></a>

## `motorcycleLicensePlate`

`motorcycleLicensePlate` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def motorcycleLicensePlate() -> str
```

Actual signature for `en_PH`:

```text
fake.motorcycleLicensePlate() -> str
```


Verified availability: 4 locales. Example locales: `en_PH`, `es_MX`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.motorcycleLicensePlate()
```

<a id="faker-motorcyclelicenseplatecdmx"></a>

## `motorcycleLicensePlateCdmx`

`motorcycleLicensePlateCdmx` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def motorcycleLicensePlateCdmx() -> str
```

Actual signature for `es_MX`:

```text
fake.motorcycleLicensePlateCdmx() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.motorcycleLicensePlateCdmx()
```

<a id="faker-motorcyclelicenseplatenational"></a>

## `motorcycleLicensePlateNational`

`motorcycleLicensePlateNational` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def motorcycleLicensePlateNational() -> str
```

Actual signature for `es_MX`:

```text
fake.motorcycleLicensePlateNational() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.motorcycleLicensePlateNational()
```

<a id="faker-mountainname"></a>

## `mountainName`

`mountainName` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def mountainName() -> str
```

Actual signature for `en_PH`:

```text
fake.mountainName() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mountainName()
```

<a id="faker-msisdn"></a>

## `msisdn`

`msisdn` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def msisdn() -> str
```

Actual signature for `en_US`:

```text
fake.msisdn() -> str
```


Verified availability: 107 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.msisdn()
```

<a id="faker-municipality"></a>

## `municipality`

`municipality` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def municipality() -> str
```

Actual signature for `es_CO`:

```text
fake.municipality() -> str
```


Verified availability: 2 locales. Example locales: `es_CO`, `es_AR`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.municipality()
```

<a id="faker-municipalitycode"></a>

## `municipalityCode`

`municipalityCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def municipalityCode() -> str
```

Actual signature for `es_CO`:

```text
fake.municipalityCode() -> str
```


Verified availability: 2 locales. Example locales: `es_CO`, `es_AR`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.municipalityCode()
```

<a id="faker-name"></a>

## `name`

`name` generates names and identity components for test profiles.

Orionis typed contract:

```text
def name() -> str
```

Actual signature for `en_US`:

```text
fake.name() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.name()
```

<a id="faker-namefemale"></a>

## `nameFemale`

`nameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def nameFemale() -> str
```

Actual signature for `en_US`:

```text
fake.nameFemale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nameFemale()
```

<a id="faker-namemale"></a>

## `nameMale`

`nameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def nameMale() -> str
```

Actual signature for `en_US`:

```text
fake.nameMale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nameMale()
```

<a id="faker-namenonbinary"></a>

## `nameNonbinary`

`nameNonbinary` generates names and identity components for test profiles.

Orionis typed contract:

```text
def nameNonbinary() -> str
```

Actual signature for `en_US`:

```text
fake.nameNonbinary() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nameNonbinary()
```

<a id="faker-nationality"></a>

## `nationality`

`nationality` generates coordinates and locations for geographic fixtures.

Orionis typed contract:

```text
def nationality() -> str
```

Actual signature for `pt_PT`:

```text
fake.nationality() -> str
```


Verified availability: 1 locales. Example locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.nationality()
```

<a id="faker-naturalpersonnit"></a>

## `naturalPersonNit`

`naturalPersonNit` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def naturalPersonNit() -> str
```

Actual signature for `es_CO`:

```text
fake.naturalPersonNit() -> str
```


Verified availability: 1 locales. Example locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.naturalPersonNit()
```

<a id="faker-naturalpersonnitwithcheckdigit"></a>

## `naturalPersonNitWithCheckDigit`

`naturalPersonNitWithCheckDigit` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def naturalPersonNitWithCheckDigit() -> str
```

Actual signature for `es_CO`:

```text
fake.naturalPersonNitWithCheckDigit() -> str
```


Verified availability: 1 locales. Example locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.naturalPersonNitWithCheckDigit()
```

<a id="faker-neighborhood"></a>

## `neighborhood`

`neighborhood` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def neighborhood() -> str
```

Actual signature for `pt_BR`:

```text
fake.neighborhood() -> str
```


Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.neighborhood()
```

<a id="faker-nichandle"></a>

## `nicHandle`

`nicHandle` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def nicHandle(suffix: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.nicHandle(suffix: str = 'FAKE') -> str
```


| Parameter | Purpose |
| --- | --- |
| `suffix` | Generated string suffix. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nicHandle()
```

<a id="faker-nichandles"></a>

## `nicHandles`

`nicHandles` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def nicHandles(count: int=..., suffix: str=...) -> list[str]
```

Actual signature for `en_US`:

```text
fake.nicHandles(count: int = 1, suffix: str = '????') -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `count` | Number of items or structures produced by the provider. |
| `suffix` | Generated string suffix. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nicHandles()
```

<a id="faker-nie"></a>

## `nie`

`nie` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def nie() -> str
```

Actual signature for `es_ES`:

```text
fake.nie() -> str
```


Verified availability: 3 locales. Example locales: `es_ES`, `es`, `es_CA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.nie()
```

<a id="faker-nif"></a>

## `nif`

`nif` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def nif() -> str
```

Actual signature for `es_ES`:

```text
fake.nif() -> str
```


Verified availability: 3 locales. Example locales: `es_ES`, `es`, `es_CA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.nif()
```

<a id="faker-nip"></a>

## `nip`

`nip` generates names and identity components for test profiles.

Orionis typed contract:

```text
def nip() -> str
```

Actual signature for `pl_PL`:

```text
fake.nip() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.nip()
```

<a id="faker-nonarea2landlineareacode"></a>

## `nonArea2LandlineAreaCode`

`nonArea2LandlineAreaCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def nonArea2LandlineAreaCode() -> str
```

Actual signature for `en_PH`:

```text
fake.nonArea2LandlineAreaCode() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.nonArea2LandlineAreaCode()
```

<a id="faker-nonarea2landlinenumber"></a>

## `nonArea2LandlineNumber`

`nonArea2LandlineNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def nonArea2LandlineNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.nonArea2LandlineNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.nonArea2LandlineNumber()
```

<a id="faker-nonprofitprefix"></a>

## `nonprofitPrefix`

`nonprofitPrefix` generates company names and expressions for test entities.

Orionis typed contract:

```text
def nonprofitPrefix() -> str
```

Actual signature for `th_TH`:

```text
fake.nonprofitPrefix() -> str
```


Verified availability: 2 locales. Example locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.nonprofitPrefix()
```

<a id="faker-nuip"></a>

## `nuip`

`nuip` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def nuip() -> str
```

Actual signature for `es_CO`:

```text
fake.nuip() -> str
```


Verified availability: 1 locales. Example locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.nuip()
```

<a id="faker-nullboolean"></a>

## `nullBoolean`

`nullBoolean` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def nullBoolean() -> bool | None
```

Actual signature for `en_US`:

```text
fake.nullBoolean() -> bool | None
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nullBoolean()
```

<a id="faker-numberedstreet"></a>

## `numberedStreet`

`numberedStreet` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def numberedStreet() -> str
```

Actual signature for `vi_VN`:

```text
fake.numberedStreet() -> str
```


Verified availability: 1 locales. Example locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.numberedStreet()
```

<a id="faker-numerify"></a>

## `numerify`

Replaces numeric placeholders in `text`; each placeholder follows the native provider rule.

Orionis typed contract:

```text
def numerify(text: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.numerify(text: str = '###') -> str
```


| Parameter | Purpose |
| --- | --- |
| `text` | Template or text processed by the provider. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.numerify()
```

<a id="faker-nuss"></a>

## `nuss`

`nuss` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def nuss(company: bool=...) -> str
```

Actual signature for `es_ES`:

```text
fake.nuss(company: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `company` | Generates a company NUSS when enabled. |

Verified availability: 3 locales. Example locales: `es_ES`, `es`, `es_CA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.nuss()
```

<a id="faker-oldpostalcode"></a>

## `oldPostalCode`

`oldPostalCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def oldPostalCode() -> str
```

Actual signature for `ko_KR`:

```text
fake.oldPostalCode() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.oldPostalCode()
```

<a id="faker-opera"></a>

## `opera`

`opera` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def opera() -> str
```

Actual signature for `en_US`:

```text
fake.opera() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.opera()
```

<a id="faker-operatorid"></a>

## `operatorId`

`operatorId` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def operatorId() -> str
```

Actual signature for `ar_JO`:

```text
fake.operatorId() -> str
```


Verified availability: 1 locales. Example locales: `ar_JO`.

```python
fake = SampleFactory(locale="ar_JO", seed=7).fake
value = fake.operatorId()
```

<a id="faker-ordinalfloornumber"></a>

## `ordinalFloorNumber`

`ordinalFloorNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def ordinalFloorNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.ordinalFloorNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.ordinalFloorNumber()
```

<a id="faker-ordinalstreetnumber"></a>

## `ordinalStreetNumber`

`ordinalStreetNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def ordinalStreetNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.ordinalStreetNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.ordinalStreetNumber()
```

<a id="faker-organdvatid"></a>

## `orgAndVatId`

`orgAndVatId` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def orgAndVatId(long: bool=..., dash: bool=...) -> tuple[str, str]
```

Actual signature for `sv_SE`:

```text
fake.orgAndVatId(long: bool = False, dash: bool = True) -> Tuple[str, str]
```


| Parameter | Purpose |
| --- | --- |
| `long` | Requests the long localized identifier variant. |
| `dash` | Includes a hyphen in the identifier representation. |

Verified availability: 1 locales. Example locales: `sv_SE`.

```python
fake = SampleFactory(locale="sv_SE", seed=7).fake
value = fake.orgAndVatId()
```

<a id="faker-orgid"></a>

## `orgId`

`orgId` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def orgId(long: bool=..., dash: bool=...) -> str
```

Actual signature for `sv_SE`:

```text
fake.orgId(long: bool = False, dash: bool = True) -> str
```


| Parameter | Purpose |
| --- | --- |
| `long` | Requests the long localized identifier variant. |
| `dash` | Includes a hyphen in the identifier representation. |

Verified availability: 1 locales. Example locales: `sv_SE`.

```python
fake = SampleFactory(locale="sv_SE", seed=7).fake
value = fake.orgId()
```

<a id="faker-pagibig"></a>

## `pagibig`

`pagibig` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def pagibig() -> str
```

Actual signature for `en_PH`:

```text
fake.pagibig() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.pagibig()
```

<a id="faker-pan"></a>

## `pan`

`pan` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def pan() -> str
```

Actual signature for `en_IN`:

```text
fake.pan() -> str
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.pan()
```

<a id="faker-paragraph"></a>

## `paragraph`

`paragraph` generates placeholder text for content and forms.

Orionis typed contract:

```text
def paragraph(nb_sentences: int=..., variable_nb_sentences: bool=..., ext_word_list: Sequence[str] | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.paragraph(nb_sentences: int = 3, variable_nb_sentences: bool = True, ext_word_list: Sequence[str] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `nb_sentences` | Target sentence count. |
| `variable_nb_sentences` | Allows variation around target sentence count. |
| `ext_word_list` | Alternative vocabulary or None for native data. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.paragraph()
```

<a id="faker-paragraphs"></a>

## `paragraphs`

`paragraphs` generates placeholder text for content and forms.

Orionis typed contract:

```text
def paragraphs(nb: int=..., ext_word_list: Sequence[str] | None=...) -> list[str]
```

Actual signature for `en_US`:

```text
fake.paragraphs(nb: int = 3, ext_word_list: Sequence[str] | None = None) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `nb` | Requested result count. |
| `ext_word_list` | Alternative vocabulary or None for native data. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.paragraphs()
```

<a id="faker-parse"></a>

## `parse`

Replaces {{provider}} and {{provider:group}} tokens. Tokens use NATIVE backend names such as first_name; the Python facade method remains camelCase. Unknown tokens raise AttributeError.

Helper accessible through dynamic facade dispatch; not declared in `_ProviderMethods`.

Actual signature for `en_US`:

```text
fake.parse(text: str) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
fake.setArguments("small", {"min_value": 1, "max_value": 3})
value = fake.parse("{{first_name}} / {{pyint:small}}")
```

<a id="faker-partitionedbuildingnumber"></a>

## `partitionedBuildingNumber`

`partitionedBuildingNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def partitionedBuildingNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.partitionedBuildingNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.partitionedBuildingNumber()
```

<a id="faker-passportdates"></a>

## `passportDates`

`passportDates` generates fictional passport formats for fixtures, not valid travel documents.

Orionis typed contract:

```text
def passportDates(birthday: datetime.date=...) -> tuple[str, str, str]
```

Actual signature for `en_US`:

```text
fake.passportDates(birthday: datetime.date = datetime.date(2026, 10, 22)) -> Tuple[str, str, str]
```


| Parameter | Purpose |
| --- | --- |
| `birthday` | Reference birth date for the passport. |

Verified availability: 106 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportDates()
```

<a id="faker-passportdob"></a>

## `passportDob`

`passportDob` generates fictional passport formats for fixtures, not valid travel documents.

Orionis typed contract:

```text
def passportDob() -> datetime.date
```

Actual signature for `en_US`:

```text
fake.passportDob() -> datetime.date
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportDob()
```

<a id="faker-passportfull"></a>

## `passportFull`

`passportFull` generates fictional passport formats for fixtures, not valid travel documents.

Orionis typed contract:

```text
def passportFull() -> str
```

Actual signature for `en_US`:

```text
fake.passportFull() -> str
```


Verified availability: 106 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportFull()
```

<a id="faker-passportgender"></a>

## `passportGender`

`passportGender` generates fictional passport formats for fixtures, not valid travel documents.

Orionis typed contract:

```text
def passportGender(seed: int=...) -> Literal['M', 'F', 'X']
```

Actual signature for `en_US`:

```text
fake.passportGender(seed: int = 0) -> Literal['M', 'F', 'X']
```


| Parameter | Purpose |
| --- | --- |
| `seed` | Provider-specific seed. |

Verified availability: 106 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportGender()
```

<a id="faker-passportnumber"></a>

## `passportNumber`

`passportNumber` generates fictional passport formats for fixtures, not valid travel documents.

Orionis typed contract:

```text
def passportNumber() -> str
```

Actual signature for `en_US`:

```text
fake.passportNumber() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportNumber()
```

<a id="faker-passportowner"></a>

## `passportOwner`

`passportOwner` generates fictional passport formats for fixtures, not valid travel documents.

Orionis typed contract:

```text
def passportOwner(gender: Literal['M', 'F', 'X']=...) -> tuple[str, str]
```

Actual signature for `en_US`:

```text
fake.passportOwner(gender: Literal['M', 'F', 'X'] = 'X') -> Tuple[str, str]
```


| Parameter | Purpose |
| --- | --- |
| `gender` | Gender selection using supported locale-specific values. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 103 more:

```text
fake.passportOwner(gender: Literal['M', 'F', 'X'] = 'X') -> Tuple[str, str]
```

`ru_RU`:

```text
fake.passportOwner(gender: Literal['M', 'F', 'X'] = 'M') -> Tuple[str, str]
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportOwner()
```

<a id="faker-password"></a>

## `password`

Generates a fictional password with configurable character classes for fixtures; does not compute an authentication hash.

Orionis typed contract:

```text
def password(length: int=..., special_chars: bool=..., digits: bool=..., upper_case: bool=..., lower_case: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.password(length: int = 10, special_chars: bool = True, digits: bool = True, upper_case: bool = True, lower_case: bool = True) -> str
```


| Parameter | Purpose |
| --- | --- |
| `length` | Value length/size; units depend on this provider. |
| `special_chars` | Includes special characters in the fictional password. |
| `digits` | Number of result digits. |
| `upper_case` | Includes uppercase password characters. |
| `lower_case` | Includes lowercase password characters. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.password(length=16)
```

<a id="faker-pastdate"></a>

## `pastDate`

`pastDate` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def pastDate(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., tzinfo: datetime.tzinfo | None=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.pastDate(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30d', tzinfo: datetime.tzinfo | None = None) -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `start_date` | Start boundary: date/time, relative interval or provider-supported format. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pastDate()
```

<a id="faker-pastdatetime"></a>

## `pastDatetime`

`pastDatetime` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def pastDatetime(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.pastDatetime(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30d', tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `start_date` | Start boundary: date/time, relative interval or provider-supported format. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pastDatetime()
```

<a id="faker-personrut"></a>

## `personRut`

`personRut` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def personRut() -> str
```

Actual signature for `es_CL`:

```text
fake.personRut() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.personRut()
```

<a id="faker-pesel"></a>

## `pesel`

`pesel` generates names and identity components for test profiles.

Orionis typed contract:

```text
def pesel(date_of_birth: datetime.datetime | None=..., sex: str | None=...) -> str
```

Actual signature for `pl_PL`:

```text
fake.pesel(date_of_birth: datetime.datetime | None = None, sex: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `date_of_birth` | Birth date used to build the identifier. |
| `sex` | Sex selection using supported locale-specific values. |

Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.pesel()
```

<a id="faker-peselcomputecheckdigit"></a>

## `peselComputeCheckDigit`

Calculates a PESEL check digit from the initial digit string; does not generate the whole identifier.

Orionis typed contract:

```text
def peselComputeCheckDigit(pesel: str) -> int
```

Actual signature for `pl_PL`:

```text
fake.peselComputeCheckDigit(pesel: str) -> int
```


| Parameter | Purpose |
| --- | --- |
| `pesel` | Initial PESEL digits used to compute its check digit. |

Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.peselComputeCheckDigit(pesel="4405140145")
```

<a id="faker-philhealth"></a>

## `philhealth`

`philhealth` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def philhealth() -> str
```

Actual signature for `en_PH`:

```text
fake.philhealth() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.philhealth()
```

<a id="faker-phonenumber"></a>

## `phoneNumber`

`phoneNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def phoneNumber() -> str
```

Actual signature for `en_US`:

```text
fake.phoneNumber() -> str
```


Verified availability: 107 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.phoneNumber()
```

<a id="faker-phonenumberprefix"></a>

## `phonenumberPrefix`

`phonenumberPrefix` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def phonenumberPrefix() -> int
```

Actual signature for `zh_CN`:

```text
fake.phonenumberPrefix() -> int
```


Verified availability: 1 locales. Example locales: `zh_CN`.

```python
fake = SampleFactory(locale="zh_CN", seed=7).fake
value = fake.phonenumberPrefix()
```

<a id="faker-pincodeinarmy"></a>

## `pincodeInArmy`

`pincodeInArmy` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def pincodeInArmy() -> int
```

Actual signature for `en_IN`:

```text
fake.pincodeInArmy() -> int
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.pincodeInArmy()
```

<a id="faker-pincodeinmilitary"></a>

## `pincodeInMilitary`

`pincodeInMilitary` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def pincodeInMilitary() -> int
```

Actual signature for `en_IN`:

```text
fake.pincodeInMilitary() -> int
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.pincodeInMilitary()
```

<a id="faker-pincodeinstate"></a>

## `pincodeInState`

`pincodeInState` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def pincodeInState(state_abbr: str | None=..., include_union_territories: bool=...) -> int
```

Actual signature for `en_IN`:

```text
fake.pincodeInState(state_abbr: str | None = None, include_union_territories: bool = False) -> int
```


| Parameter | Purpose |
| --- | --- |
| `state_abbr` | State abbreviation restricting localized output. |
| `include_union_territories` | Includes Indian Union Territories in postal codes. |

Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.pincodeInState()
```

<a id="faker-placename"></a>

## `placeName`

`placeName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def placeName() -> str
```

Actual signature for `pt_PT`:

```text
fake.placeName() -> str
```


Verified availability: 1 locales. Example locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.placeName()
```

<a id="faker-plantname"></a>

## `plantName`

`plantName` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def plantName() -> str
```

Actual signature for `en_PH`:

```text
fake.plantName() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.plantName()
```

<a id="faker-plantstreetname"></a>

## `plantStreetName`

`plantStreetName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def plantStreetName() -> str
```

Actual signature for `es_CL`:

```text
fake.plantStreetName() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.plantStreetName()
```

<a id="faker-plateletter"></a>

## `plateLetter`

`plateLetter` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def plateLetter() -> str
```

Actual signature for `ru_RU`:

```text
fake.plateLetter() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateLetter()
```

<a id="faker-plateletterprefix"></a>

## `plateLetterPrefix`

`plateLetterPrefix` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def plateLetterPrefix(region_name: str | None=...) -> str
```

Actual signature for `uk_UA`:

```text
fake.plateLetterPrefix(region_name: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `region_name` | Region name used to form the local license plate. |

Verified availability: 1 locales. Example locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.plateLetterPrefix()
```

<a id="faker-platelettersuffix"></a>

## `plateLetterSuffix`

`plateLetterSuffix` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def plateLetterSuffix() -> str
```

Actual signature for `uk_UA`:

```text
fake.plateLetterSuffix() -> str
```


Verified availability: 1 locales. Example locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.plateLetterSuffix()
```

<a id="faker-platenumber"></a>

## `plateNumber`

`plateNumber` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def plateNumber() -> str
```

Actual signature for `ru_RU`:

```text
fake.plateNumber() -> str
```


Verified availability: 2 locales. Example locales: `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateNumber()
```

<a id="faker-platenumberextra"></a>

## `plateNumberExtra`

`plateNumberExtra` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def plateNumberExtra() -> str
```

Actual signature for `ru_RU`:

```text
fake.plateNumberExtra() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateNumberExtra()
```

<a id="faker-platenumberspecial"></a>

## `plateNumberSpecial`

`plateNumberSpecial` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def plateNumberSpecial() -> str
```

Actual signature for `ru_RU`:

```text
fake.plateNumberSpecial() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateNumberSpecial()
```

<a id="faker-plateregioncode"></a>

## `plateRegionCode`

`plateRegionCode` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def plateRegionCode(region_name: str | None=...) -> str
```

Actual signature for `uk_UA`:

```text
fake.plateRegionCode(region_name: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `region_name` | Region name used to form the local license plate. |

Verified availability: 1 locales. Example locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.plateRegionCode()
```

<a id="faker-platesuffix"></a>

## `plateSuffix`

`plateSuffix` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def plateSuffix() -> str
```

Actual signature for `ru_RU`:

```text
fake.plateSuffix() -> str
```


Verified availability: 1 locales. Example locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateSuffix()
```

<a id="faker-pldtarea2landlinenumber"></a>

## `pldtArea2LandlineNumber`

`pldtArea2LandlineNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def pldtArea2LandlineNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.pldtArea2LandlineNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.pldtArea2LandlineNumber()
```

<a id="faker-policeid"></a>

## `policeId`

`policeId` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def policeId() -> str
```

Actual signature for `el_GR`:

```text
fake.policeId() -> str
```


Verified availability: 1 locales. Example locales: `el_GR`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.policeId()
```

<a id="faker-portnumber"></a>

## `portNumber`

`portNumber` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def portNumber(is_system: bool=..., is_user: bool=..., is_dynamic: bool=...) -> int
```

Actual signature for `en_US`:

```text
fake.portNumber(is_system: bool = False, is_user: bool = False, is_dynamic: bool = False) -> int
```


| Parameter | Purpose |
| --- | --- |
| `is_system` | Selects system or well-known ports. |
| `is_user` | Selects user or registered ports. |
| `is_dynamic` | Selects dynamic/private/ephemeral ports. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.portNumber()
```

<a id="faker-postal-code"></a>

## `postalCode`

`postalCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postalCode() -> str
```

Actual signature for `ko_KR`:

```text
fake.postalCode() -> str
```


Verified availability: 1 locales. Example locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.postalCode()
```

<a id="faker-postalcodeletter"></a>

## `postalCodeLetter`

`postalCodeLetter` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postalCodeLetter() -> str
```

Actual signature for `en_CA`:

```text
fake.postalCodeLetter() -> str
```


Verified availability: 2 locales. Example locales: `en_CA`, `fr_CA`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.postalCodeLetter()
```

<a id="faker-postalcode"></a>

## `postalcode`

`postalcode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postalcode() -> str
```

Actual signature for `en_US`:

```text
fake.postalcode() -> str
```


Verified availability: 49 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postalcode()
```

<a id="faker-postalcodeinprovince"></a>

## `postalcodeInProvince`

`postalcodeInProvince` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postalcodeInProvince(province_abbr: str | None=...) -> str
```

Actual signature for `en_CA`:

```text
fake.postalcodeInProvince(province_abbr: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `province_abbr` | Locale-supported province abbreviation. |

Verified availability: 2 locales. Example locales: `en_CA`, `fr_CA`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.postalcodeInProvince()
```

<a id="faker-postalcodeinstate"></a>

## `postalcodeInState`

`postalcodeInState` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postalcodeInState(state_abbr: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.postalcodeInState(state_abbr: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `state_abbr` | State abbreviation restricting localized output. |

Verified availability: 45 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postalcodeInState()
```

<a id="faker-postalcodeplus4"></a>

## `postalcodePlus4`

`postalcodePlus4` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postalcodePlus4() -> str
```

Actual signature for `en_US`:

```text
fake.postalcodePlus4() -> str
```


Verified availability: 45 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postalcodePlus4()
```

<a id="faker-postcode"></a>

## `postcode`

`postcode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postcode() -> str
```

Actual signature for `en_US`:

```text
fake.postcode() -> str
```


| Parameter | Purpose |
| --- | --- |
| `formatted` | Controls postal-code presentation in supporting locales. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 103 more:

```text
fake.postcode() -> str
```

`pt_BR`:

```text
fake.postcode(formatted: bool = True) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postcode()
```

<a id="faker-postcodecityprovince"></a>

## `postcodeCityProvince`

`postcodeCityProvince` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postcodeCityProvince() -> str
```

Actual signature for `it_IT`:

```text
fake.postcodeCityProvince() -> str
```


Verified availability: 1 locales. Example locales: `it_IT`.

```python
fake = SampleFactory(locale="it_IT", seed=7).fake
value = fake.postcodeCityProvince()
```

<a id="faker-postcodeinarmy"></a>

## `postcodeInArmy`

`postcodeInArmy` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postcodeInArmy() -> int
```

Actual signature for `en_IN`:

```text
fake.postcodeInArmy() -> int
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.postcodeInArmy()
```

<a id="faker-postcodeinmilitary"></a>

## `postcodeInMilitary`

`postcodeInMilitary` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postcodeInMilitary() -> int
```

Actual signature for `en_IN`:

```text
fake.postcodeInMilitary() -> int
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.postcodeInMilitary()
```

<a id="faker-postcodeinprovince"></a>

## `postcodeInProvince`

`postcodeInProvince` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postcodeInProvince(province_abbr: str | None=...) -> str
```

Actual signature for `en_CA`:

```text
fake.postcodeInProvince(province_abbr: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `province_abbr` | Locale-supported province abbreviation. |

Verified availability: 2 locales. Example locales: `en_CA`, `fr_CA`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.postcodeInProvince()
```

<a id="faker-postcodeinstate"></a>

## `postcodeInState`

`postcodeInState` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def postcodeInState(state_abbr: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.postcodeInState(state_abbr: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `state_abbr` | State abbreviation restricting localized output. |
| `include_union_territories` | Includes Indian Union Territories in postal codes. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG` and 42 more:

```text
fake.postcodeInState(state_abbr: str | None = None) -> str
```

`en_IN`:

```text
fake.postcodeInState(state_abbr: str | None = None, include_union_territories: bool = False) -> int
```

Verified availability: 49 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postcodeInState()
```

<a id="faker-prefecture"></a>

## `prefecture`

`prefecture` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def prefecture() -> str
```

Actual signature for `ja_JP`:

```text
fake.prefecture() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.prefecture()
```

<a id="faker-prefix"></a>

## `prefix`

`prefix` generates names and identity components for test profiles.

Orionis typed contract:

```text
def prefix() -> str
```

Actual signature for `en_US`:

```text
fake.prefix() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.prefix()
```

<a id="faker-prefixfemale"></a>

## `prefixFemale`

`prefixFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def prefixFemale() -> str
```

Actual signature for `en_US`:

```text
fake.prefixFemale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.prefixFemale()
```

<a id="faker-prefixmale"></a>

## `prefixMale`

`prefixMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def prefixMale() -> str
```

Actual signature for `en_US`:

```text
fake.prefixMale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.prefixMale()
```

<a id="faker-prefixnonbinary"></a>

## `prefixNonbinary`

`prefixNonbinary` generates names and identity components for test profiles.

Orionis typed contract:

```text
def prefixNonbinary() -> str
```

Actual signature for `en_US`:

```text
fake.prefixNonbinary() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.prefixNonbinary()
```

<a id="faker-pricetag"></a>

## `pricetag`

`pricetag` generates currency names, symbols and codes for catalogs.

Orionis typed contract:

```text
def pricetag() -> str
```

Actual signature for `en_US`:

```text
fake.pricetag() -> str
```


Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 95 more:

```text
fake.pricetag() -> str
```

`az_AZ`, `da_DK`, `de`, `de_CH`, `de_DE`, `en_CA` and 3 more:

```text
fake.pricetag()
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pricetag()
```

<a id="faker-profile"></a>

## `profile`

`profile` generates composite profiles for fixtures.

Orionis typed contract:

```text
def profile(fields: list[str] | None=..., sex: Literal['M', 'F', 'X'] | None=...) -> dict[str, str | tuple[Decimal, Decimal] | list[str] | datetime.date]
```

Actual signature for `en_US`:

```text
fake.profile(fields: List[str] | None = None, sex: Literal['M', 'F', 'X'] | None = None) -> Dict[str, str | Tuple[decimal.Decimal, decimal.Decimal] | List[str] | datetime.date]
```


| Parameter | Purpose |
| --- | --- |
| `fields` | Profile field names included in the result. |
| `sex` | Sex selection using supported locale-specific values. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.profile()
```

<a id="faker-protocollicenseplate"></a>

## `protocolLicensePlate`

`protocolLicensePlate` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def protocolLicensePlate() -> str
```

Actual signature for `en_PH`:

```text
fake.protocolLicensePlate() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.protocolLicensePlate()
```

<a id="faker-provider"></a>

## `provider`

Looks up a provider by its case-insensitive __provider__ identifier, or returns None. Receiving a native object neither registers it nor adds methods.

Helper accessible through dynamic facade dispatch; not declared in `_ProviderMethods`.

Actual signature for `en_US`:

```text
fake.provider(name: str) -> ForwardRef('BaseProvider') | None
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.provider("person")
```

<a id="faker-providercode"></a>

## `providerCode`

`providerCode` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def providerCode() -> str
```

Actual signature for `ar_PS`:

```text
fake.providerCode() -> str
```


Verified availability: 2 locales. Example locales: `ar_PS`, `az_AZ`.

```python
fake = SampleFactory(locale="ar_PS", seed=7).fake
value = fake.providerCode()
```

<a id="faker-province"></a>

## `province`

`province` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def province() -> str
```

Actual signature for `en_CA`:

```text
fake.province() -> str
```


Actual locale variants:

`en_CA`, `en_PH`, `es_AR`, `es_CL`, `fil_PH`, `fr_CA` and 9 more:

```text
fake.province() -> str
```

`vi_VN`:

```text
fake.province()
```

Verified availability: 16 locales. Example locales: `en_CA`, `en_PH`, `es_AR`, `es_CL`, `fil_PH`, `fr_CA`, `ko_KR`, `ne_NP`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.province()
```

<a id="faker-provinceabbr"></a>

## `provinceAbbr`

`provinceAbbr` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def provinceAbbr() -> str
```

Actual signature for `en_CA`:

```text
fake.provinceAbbr() -> str
```


Verified availability: 2 locales. Example locales: `en_CA`, `fr_CA`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.provinceAbbr()
```

<a id="faker-provincecode"></a>

## `provinceCode`

`provinceCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def provinceCode() -> str
```

Actual signature for `es_CL`:

```text
fake.provinceCode() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.provinceCode()
```

<a id="faker-provincelgu"></a>

## `provinceLgu`

`provinceLgu` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def provinceLgu() -> str
```

Actual signature for `en_PH`:

```text
fake.provinceLgu() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.provinceLgu()
```

<a id="faker-provincename"></a>

## `provinceName`

`provinceName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def provinceName() -> str
```

Actual signature for `vi_VN`:

```text
fake.provinceName() -> str
```


Verified availability: 1 locales. Example locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.provinceName()
```

<a id="faker-provinceprefix"></a>

## `provincePrefix`

`provincePrefix` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def provincePrefix() -> str
```

Actual signature for `vi_VN`:

```text
fake.provincePrefix() -> str
```


Verified availability: 1 locales. Example locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.provincePrefix()
```

<a id="faker-provincescode"></a>

## `provincesCode`

`provincesCode` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def provincesCode() -> str
```

Actual signature for `es_AR`:

```text
fake.provincesCode() -> str
```


Verified availability: 1 locales. Example locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.provincesCode()
```

<a id="faker-psv"></a>

## `psv`

`psv` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def psv(header: Sequence[str] | None=..., data_columns: tuple[str, str]=..., num_rows: int=..., include_row_ids: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.psv(header: Sequence[str] | None = None, data_columns: Tuple[str, str] = ('{{name}}', '{{address}}'), num_rows: int = 10, include_row_ids: bool = False) -> str
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
value = fake.psv(num_rows=2)
```

<a id="faker-publictransportlicenseplate"></a>

## `publicTransportLicensePlate`

`publicTransportLicensePlate` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def publicTransportLicensePlate() -> str
```

Actual signature for `es_MX`:

```text
fake.publicTransportLicensePlate() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.publicTransportLicensePlate()
```

<a id="faker-publictransportlicenseplatelettered"></a>

## `publicTransportLicensePlateLettered`

`publicTransportLicensePlateLettered` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def publicTransportLicensePlateLettered() -> str
```

Actual signature for `es_MX`:

```text
fake.publicTransportLicensePlateLettered() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.publicTransportLicensePlateLettered()
```

<a id="faker-publictransportlicenseplatenumbered"></a>

## `publicTransportLicensePlateNumbered`

`publicTransportLicensePlateNumbered` generates vehicle plates and identifiers for examples and fixtures.

Orionis typed contract:

```text
def publicTransportLicensePlateNumbered() -> str
```

Actual signature for `es_MX`:

```text
fake.publicTransportLicensePlateNumbered() -> str
```


Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.publicTransportLicensePlateNumbered()
```

<a id="faker-pwzdoctor"></a>

## `pwzDoctor`

`pwzDoctor` generates names and identity components for test profiles.

Orionis typed contract:

```text
def pwzDoctor() -> str
```

Actual signature for `pl_PL`:

```text
fake.pwzDoctor() -> str
```


Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.pwzDoctor()
```

<a id="faker-pwzdoctorcomputecheckdigit"></a>

## `pwzDoctorComputeCheckDigit`

Calculates the Polish doctor identifier check digit from its digit sequence.

Orionis typed contract:

```text
def pwzDoctorComputeCheckDigit(x: Sequence[int]) -> int
```

Actual signature for `pl_PL`:

```text
fake.pwzDoctorComputeCheckDigit(x: Sequence[int]) -> int
```


| Parameter | Purpose |
| --- | --- |
| `x` | Digit sequence used for check-digit calculation. |

Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.pwzDoctorComputeCheckDigit(x=[1, 2, 3, 4, 5, 6])
```

<a id="faker-pwznurse"></a>

## `pwzNurse`

`pwzNurse` generates names and identity components for test profiles.

Orionis typed contract:

```text
def pwzNurse(kind: str=...) -> str
```

Actual signature for `pl_PL`:

```text
fake.pwzNurse(kind: str = 'nurse') -> str
```


| Parameter | Purpose |
| --- | --- |
| `kind` | Nursing profession kind for a PWZ identifier; defaults to nurse. |

Verified availability: 1 locales. Example locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.pwzNurse()
```

<a id="faker-pybool"></a>

## `pybool`

Boolean with `truth_probability` between 0 and 100.

Orionis typed contract:

```text
def pybool(truth_probability: int=...) -> bool
```

Actual signature for `en_US`:

```text
fake.pybool(truth_probability: int = 50) -> bool
```


| Parameter | Purpose |
| --- | --- |
| `truth_probability` | True percentage (0 to 100). |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pybool()
```

<a id="faker-pydecimal"></a>

## `pydecimal`

Returns Decimal with digit/value limits and sign, without automatically converting it to float/text.

Orionis typed contract:

```text
def pydecimal(left_digits: int | None=..., right_digits: int | None=..., positive: bool | None=..., min_value: float | int | Decimal | None=..., max_value: float | int | Decimal | None=...) -> Decimal
```

Actual signature for `en_US`:

```text
fake.pydecimal(left_digits: int | None = None, right_digits: int | None = None, positive: bool | None = None, min_value: float | int | decimal.Decimal | None = None, max_value: float | int | decimal.Decimal | None = None) -> decimal.Decimal
```


| Parameter | Purpose |
| --- | --- |
| `left_digits` | Digit count to the left of the decimal separator. |
| `right_digits` | Fractional digit count. |
| `positive` | Restricts sign when not None. |
| `min_value` | Minimum permitted numeric value. |
| `max_value` | Maximum permitted numeric value. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pydecimal(left_digits=3, right_digits=2, positive=True)
```

<a id="faker-pydict"></a>

## `pydict`

`pydict` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pydict(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> dict[Any, Any]
```

Actual signature for `en_US`:

```text
fake.pydict(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Dict[Any, Any]
```


| Parameter | Purpose |
| --- | --- |
| `nb_elements` | Number of elements to generate. |
| `variable_nb_elements` | Allows count variation around its target. |
| `value_types` | Python types of generated values. |
| `allowed_types` | Python types the container may select. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pydict()
```

<a id="faker-pyfloat"></a>

## `pyfloat`

Returns float with digit, sign and value limits.

Orionis typed contract:

```text
def pyfloat(left_digits: int | None=..., right_digits: int | None=..., positive: bool | None=..., min_value: float | int | None=..., max_value: float | int | None=...) -> float
```

Actual signature for `en_US`:

```text
fake.pyfloat(left_digits: int | None = None, right_digits: int | None = None, positive: bool | None = None, min_value: float | int | None = None, max_value: float | int | None = None) -> float
```


| Parameter | Purpose |
| --- | --- |
| `left_digits` | Digit count to the left of the decimal separator. |
| `right_digits` | Fractional digit count. |
| `positive` | Restricts sign when not None. |
| `min_value` | Minimum permitted numeric value. |
| `max_value` | Maximum permitted numeric value. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyfloat(left_digits=2, right_digits=2, positive=True)
```

<a id="faker-pyint"></a>

## `pyint`

`pyint` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pyint(min_value: int=..., max_value: int=..., step: int=...) -> int
```

Actual signature for `en_US`:

```text
fake.pyint(min_value: int = 0, max_value: int = 9999, step: int = 1) -> int
```


| Parameter | Purpose |
| --- | --- |
| `min_value` | Minimum permitted numeric value. |
| `max_value` | Maximum permitted numeric value. |
| `step` | Integer selection step. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyint()
```

<a id="faker-pyiterable"></a>

## `pyiterable`

`pyiterable` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pyiterable(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> Iterable[Any]
```

Actual signature for `en_US`:

```text
fake.pyiterable(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Iterable[Any]
```


| Parameter | Purpose |
| --- | --- |
| `nb_elements` | Number of elements to generate. |
| `variable_nb_elements` | Allows count variation around its target. |
| `value_types` | Python types of generated values. |
| `allowed_types` | Python types the container may select. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyiterable()
```

<a id="faker-pylist"></a>

## `pylist`

`pylist` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pylist(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> list[Any]
```

Actual signature for `en_US`:

```text
fake.pylist(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> List[Any]
```


| Parameter | Purpose |
| --- | --- |
| `nb_elements` | Number of elements to generate. |
| `variable_nb_elements` | Allows count variation around its target. |
| `value_types` | Python types of generated values. |
| `allowed_types` | Python types the container may select. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pylist()
```

<a id="faker-pyobject"></a>

## `pyobject`

`pyobject` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pyobject(object_type: type[bool | str | float | int | tuple | set | list | Iterable | dict] | None=...) -> bool | str | float | int | tuple | set | list | Iterable | dict | None
```

Actual signature for `en_US`:

```text
fake.pyobject(object_type: Type[bool | str | float | int | tuple | set | list | Iterable | dict] | None = None) -> bool | str | float | int | tuple | set | list | Iterable | dict | None
```


| Parameter | Purpose |
| --- | --- |
| `object_type` | Python type of the generated object. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyobject()
```

<a id="faker-pyset"></a>

## `pyset`

`pyset` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pyset(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> set[Any]
```

Actual signature for `en_US`:

```text
fake.pyset(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Set[Any]
```


| Parameter | Purpose |
| --- | --- |
| `nb_elements` | Number of elements to generate. |
| `variable_nb_elements` | Allows count variation around its target. |
| `value_types` | Python types of generated values. |
| `allowed_types` | Python types the container may select. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyset()
```

<a id="faker-pystr"></a>

## `pystr`

`pystr` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pystr(min_chars: int | None=..., max_chars: int=..., prefix: str=..., suffix: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.pystr(min_chars: int | None = None, max_chars: int = 20, prefix: str = '', suffix: str = '') -> str
```


| Parameter | Purpose |
| --- | --- |
| `min_chars` | Minimum string length. |
| `max_chars` | Maximum string length. |
| `prefix` | Generated string prefix. |
| `suffix` | Generated string suffix. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pystr(min_chars=6, max_chars=12)
```

<a id="faker-pystrformat"></a>

## `pystrFormat`

`pystrFormat` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pystrFormat(string_format: str=..., letters: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.pystrFormat(string_format: str = '?#-###{{random_int}}{{random_letter}}', letters: str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') -> str
```


| Parameter | Purpose |
| --- | --- |
| `string_format` | Template with tokens for formatted text generation. |
| `letters` | Alphabetic character population. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pystrFormat()
```

<a id="faker-pystruct"></a>

## `pystruct`

`pystruct` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pystruct(count: int=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> tuple[list, dict, dict]
```

Actual signature for `en_US`:

```text
fake.pystruct(count: int = 10, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Tuple[List, Dict, Dict]
```


| Parameter | Purpose |
| --- | --- |
| `count` | Number of items or structures produced by the provider. |
| `value_types` | Python types of generated values. |
| `allowed_types` | Python types the container may select. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pystruct()
```

<a id="faker-pytimezone"></a>

## `pytimezone`

`pytimezone` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def pytimezone(*args: Any, **kwargs: Any) -> datetime.tzinfo | None
```

Actual signature for `en_US`:

```text
fake.pytimezone(*args: Any, **kwargs: Any) -> datetime.tzinfo | None
```


| Parameter | Purpose |
| --- | --- |
| `args` | Positional arguments for generated Python types. |
| `kwargs` | Keyword arguments for generated Python types. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pytimezone()
```

<a id="faker-pytuple"></a>

## `pytuple`

`pytuple` generates Python values and containers for test attributes.

Orionis typed contract:

```text
def pytuple(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> tuple[Any, ...]
```

Actual signature for `en_US`:

```text
fake.pytuple(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Tuple[Any, ...]
```


| Parameter | Purpose |
| --- | --- |
| `nb_elements` | Number of elements to generate. |
| `variable_nb_elements` | Allows count variation around its target. |
| `value_types` | Python types of generated values. |
| `allowed_types` | Python types the container may select. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pytuple()
```
