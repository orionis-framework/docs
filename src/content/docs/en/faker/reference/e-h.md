---
title: "Faker: providers E–H"
description: "Signatures, parameters, locales and examples for providers E-H."
editUrl: true
lastUpdated: false
---

This reference covers 83 facade names in the E-H range. The whole catalog contains **675 typed methods** (694 signatures including overloads) and **7 backend helpers accessible at runtime**, organized alphabetically. Availability was checked against the installed backend's 110 locales; some methods only exist for specific locales.

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


<a id="faker-ean"></a>

## `ean`

`ean` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def ean(length: int=..., prefixes: tuple[int | str | tuple[int | str, ...], ...]=...) -> str
```

Actual signature for `en_US`:

```text
fake.ean(length: int = 13, prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = ()) -> str
```


| Parameter | Purpose |
| --- | --- |
| `length` | Value length/size; units depend on this provider. |
| `prefixes` | Accepted barcode prefixes. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ean()
```

<a id="faker-ean13"></a>

## `ean13`

`ean13` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def ean13(prefixes: tuple[int | str | tuple[int | str, ...], ...]=..., leading_zero: bool | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.ean13(prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = (), leading_zero: bool | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `prefixes` | Accepted barcode prefixes. |
| `leading_zero` | Controls the leading EAN-13 zero where supported by the locale. |

Actual locale variants:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` and 101 more:

```text
fake.ean13(prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = (), leading_zero: bool | None = None) -> str
```

`es`, `es_ES`, `ja_JP`:

```text
fake.ean13(prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = ()) -> str
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ean13()
```

<a id="faker-ean8"></a>

## `ean8`

`ean8` generates product codes and check digits for test catalogs.

Orionis typed contract:

```text
def ean8(prefixes: tuple[int | str | tuple[int | str, ...], ...]=...) -> str
```

Actual signature for `en_US`:

```text
fake.ean8(prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = ()) -> str
```


| Parameter | Purpose |
| --- | --- |
| `prefixes` | Accepted barcode prefixes. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ean8()
```

<a id="faker-ein"></a>

## `ein`

`ein` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def ein() -> str
```

Actual signature for `en_US`:

```text
fake.ein() -> str
```


Verified availability: 52 locales. Example locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ein()
```

<a id="faker-electorcode"></a>

## `electorCode`

`electorCode` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def electorCode(gender: Literal['H', 'M'] | None=...) -> str
```

Actual signature for `es_MX`:

```text
fake.electorCode(gender: Literal['H', 'M'] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `gender` | Gender selection using supported locale-specific values. |

Verified availability: 1 locales. Example locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.electorCode()
```

<a id="faker-email"></a>

## `email`

`email` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def email(safe: bool=..., domain: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.email(safe: bool = True, domain: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `safe` | Generates a safe sample-domain email when enabled. |
| `domain` | Explicit domain or None for automatic generation. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.email()
```

<a id="faker-emoji"></a>

## `emoji`

`emoji` generates emoji for sample content.

Orionis typed contract:

```text
def emoji() -> str
```

Actual signature for `en_US`:

```text
fake.emoji() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.emoji()
```

<a id="faker-englishcatchphrase"></a>

## `englishCatchPhrase`

`englishCatchPhrase` generates company names and expressions for test entities.

Orionis typed contract:

```text
def englishCatchPhrase() -> str
```

Actual signature for `fil_PH`:

```text
fake.englishCatchPhrase() -> str
```


Verified availability: 2 locales. Example locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.englishCatchPhrase()
```

<a id="faker-englishparagraph"></a>

## `englishParagraph`

`englishParagraph` generates placeholder text for content and forms.

Orionis typed contract:

```text
def englishParagraph(nb_sentences: int=..., variable_nb_sentences: bool=...) -> str
```

Actual signature for `en_PH`:

```text
fake.englishParagraph(nb_sentences: int = 3, variable_nb_sentences: bool = True) -> str
```


| Parameter | Purpose |
| --- | --- |
| `nb_sentences` | Target sentence count. |
| `variable_nb_sentences` | Allows variation around target sentence count. |

Verified availability: 1 locales. Example locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishParagraph()
```

<a id="faker-englishparagraphs"></a>

## `englishParagraphs`

`englishParagraphs` generates placeholder text for content and forms.

Orionis typed contract:

```text
def englishParagraphs(nb: int=...) -> list[str]
```

Actual signature for `en_PH`:

```text
fake.englishParagraphs(nb: int = 3) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `nb` | Requested result count. |

Verified availability: 1 locales. Example locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishParagraphs()
```

<a id="faker-englishsentence"></a>

## `englishSentence`

`englishSentence` generates placeholder text for content and forms.

Orionis typed contract:

```text
def englishSentence(nb_words: int=..., variable_nb_words: bool=...) -> str
```

Actual signature for `en_PH`:

```text
fake.englishSentence(nb_words: int = 6, variable_nb_words: bool = True) -> str
```


| Parameter | Purpose |
| --- | --- |
| `nb_words` | Target word count. |
| `variable_nb_words` | Allows variation around target word count. |

Verified availability: 1 locales. Example locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishSentence()
```

<a id="faker-englishsentences"></a>

## `englishSentences`

`englishSentences` generates placeholder text for content and forms.

Orionis typed contract:

```text
def englishSentences(nb: int=...) -> list[str]
```

Actual signature for `en_PH`:

```text
fake.englishSentences(nb: int = 3) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `nb` | Requested result count. |

Verified availability: 1 locales. Example locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishSentences()
```

<a id="faker-englishtext"></a>

## `englishText`

`englishText` generates placeholder text for content and forms.

Orionis typed contract:

```text
def englishText(max_nb_chars: int=...) -> str
```

Actual signature for `en_PH`:

```text
fake.englishText(max_nb_chars: int = 200) -> str
```


| Parameter | Purpose |
| --- | --- |
| `max_nb_chars` | Maximum requested text character count. |

Verified availability: 1 locales. Example locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishText()
```

<a id="faker-englishtexts"></a>

## `englishTexts`

`englishTexts` generates placeholder text for content and forms.

Orionis typed contract:

```text
def englishTexts(nb_texts: int=..., max_nb_chars: int=...) -> list[str]
```

Actual signature for `en_PH`:

```text
fake.englishTexts(nb_texts: int = 3, max_nb_chars: int = 200) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `nb_texts` | Number of texts to return. |
| `max_nb_chars` | Maximum requested text character count. |

Verified availability: 1 locales. Example locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishTexts()
```

<a id="faker-englishword"></a>

## `englishWord`

`englishWord` generates placeholder text for content and forms.

Orionis typed contract:

```text
def englishWord() -> str
```

Actual signature for `en_PH`:

```text
fake.englishWord() -> str
```


Verified availability: 1 locales. Example locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishWord()
```

<a id="faker-englishwords"></a>

## `englishWords`

`englishWords` generates placeholder text for content and forms.

Orionis typed contract:

```text
def englishWords(nb: int=..., unique: bool=...) -> list[str]
```

Actual signature for `en_PH`:

```text
fake.englishWords(nb: int = 3, unique: bool = False) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `nb` | Requested result count. |
| `unique` | Requests nonrepeating selections within this call. |

Verified availability: 1 locales. Example locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishWords()
```

<a id="faker-enum"></a>

## `enum`

Selects a member of the supplied Enum class rather than only its value.

Orionis typed contract:

```text
def enum(enum_cls: type[TEnum]) -> TEnum
```

Actual signature for `en_US`:

```text
fake.enum(enum_cls: Type[~TEnum]) -> ~TEnum
```


| Parameter | Purpose |
| --- | --- |
| `enum_cls` | Enum class from which to select a member. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
from enum import Enum


class Status(Enum):
    DRAFT = "draft"
    PUBLISHED = "published"


fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.enum(enum_cls=Status)
```

<a id="faker-estado"></a>

## `estado`

`estado` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def estado() -> tuple[str, str]
```

Actual signature for `pt_BR`:

```text
fake.estado() -> Tuple[str, str]
```


Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.estado()
```

<a id="faker-estadonome"></a>

## `estadoNome`

`estadoNome` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def estadoNome() -> str
```

Actual signature for `pt_BR`:

```text
fake.estadoNome() -> str
```


Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.estadoNome()
```

<a id="faker-estadosigla"></a>

## `estadoSigla`

`estadoSigla` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def estadoSigla() -> str
```

Actual signature for `pt_BR`:

```text
fake.estadoSigla() -> str
```


Verified availability: 1 locales. Example locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.estadoSigla()
```

<a id="faker-fileextension"></a>

## `fileExtension`

`fileExtension` generates fictional filenames, paths and media types; it does not create files on disk.

Orionis typed contract:

```text
def fileExtension(category: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.fileExtension(category: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `category` | Provider data category. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.fileExtension()
```

<a id="faker-filename"></a>

## `fileName`

`fileName` generates fictional filenames, paths and media types; it does not create files on disk.

Orionis typed contract:

```text
def fileName(category: str | None=..., extension: str | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.fileName(category: str | None = None, extension: str | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `category` | Provider data category. |
| `extension` | Filename/path extension. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.fileName()
```

<a id="faker-filepath"></a>

## `filePath`

`filePath` generates fictional filenames, paths and media types; it does not create files on disk.

Orionis typed contract:

```text
def filePath(depth: int=..., category: str | None=..., extension: str | Sequence[str] | None=..., absolute: bool | None=..., file_system_rule: Literal['linux', 'windows']=..., allowed_path_traversal_elements: Sequence[str] | None=...) -> str
```

Actual signature for `en_US`:

```text
fake.filePath(depth: int = 1, category: str | None = None, extension: str | Sequence[str] | None = None, absolute: bool | None = True, file_system_rule: Literal['linux', 'windows'] = 'linux', allowed_path_traversal_elements: Sequence[str] | None = None) -> str
```


| Parameter | Purpose |
| --- | --- |
| `depth` | Directory level count of the fictional path. |
| `category` | Provider data category. |
| `extension` | Filename/path extension. |
| `absolute` | Generates an absolute rather than relative path. |
| `file_system_rule` | linux or windows path convention; does not operate on that filesystem. |
| `allowed_path_traversal_elements` | Segments such as . or .. allowed for path-handling tests; None omits them. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.filePath()
```

<a id="faker-firefox"></a>

## `firefox`

`firefox` generates User-Agent strings and components for simulated clients.

Orionis typed contract:

```text
def firefox() -> str
```

Actual signature for `en_US`:

```text
fake.firefox() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firefox()
```

<a id="faker-firstkananame"></a>

## `firstKanaName`

`firstKanaName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstKanaName() -> str
```

Actual signature for `ja_JP`:

```text
fake.firstKanaName() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstKanaName()
```

<a id="faker-firstkananamefemale"></a>

## `firstKanaNameFemale`

`firstKanaNameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstKanaNameFemale() -> str
```

Actual signature for `ja_JP`:

```text
fake.firstKanaNameFemale() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstKanaNameFemale()
```

<a id="faker-firstkananamemale"></a>

## `firstKanaNameMale`

`firstKanaNameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstKanaNameMale() -> str
```

Actual signature for `ja_JP`:

```text
fake.firstKanaNameMale() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstKanaNameMale()
```

<a id="faker-firstname"></a>

## `firstName`

`firstName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstName() -> str
```

Actual signature for `en_US`:

```text
fake.firstName() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firstName()
```

<a id="faker-firstnameest"></a>

## `firstNameEst`

`firstNameEst` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameEst() -> str
```

Actual signature for `et_EE`:

```text
fake.firstNameEst() -> str
```


Verified availability: 1 locales. Example locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameEst()
```

<a id="faker-firstnamefemale"></a>

## `firstNameFemale`

`firstNameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameFemale() -> str
```

Actual signature for `en_US`:

```text
fake.firstNameFemale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firstNameFemale()
```

<a id="faker-firstnamefemaleabbreviated"></a>

## `firstNameFemaleAbbreviated`

`firstNameFemaleAbbreviated` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameFemaleAbbreviated() -> str
```

Actual signature for `hu_HU`:

```text
fake.firstNameFemaleAbbreviated() -> str
```


Verified availability: 1 locales. Example locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.firstNameFemaleAbbreviated()
```

<a id="faker-firstnamefemalecommon"></a>

## `firstNameFemaleCommon`

`firstNameFemaleCommon` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameFemaleCommon() -> str
```

Actual signature for `bn_BD`:

```text
fake.firstNameFemaleCommon() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameFemaleCommon()
```

<a id="faker-firstnamefemaleest"></a>

## `firstNameFemaleEst`

`firstNameFemaleEst` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameFemaleEst() -> str
```

Actual signature for `et_EE`:

```text
fake.firstNameFemaleEst() -> str
```


Verified availability: 1 locales. Example locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameFemaleEst()
```

<a id="faker-firstnamefemalehinduism"></a>

## `firstNameFemaleHinduism`

`firstNameFemaleHinduism` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameFemaleHinduism() -> str
```

Actual signature for `bn_BD`:

```text
fake.firstNameFemaleHinduism() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameFemaleHinduism()
```

<a id="faker-firstnamefemaleislamic"></a>

## `firstNameFemaleIslamic`

`firstNameFemaleIslamic` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameFemaleIslamic() -> str
```

Actual signature for `bn_BD`:

```text
fake.firstNameFemaleIslamic() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameFemaleIslamic()
```

<a id="faker-firstnamefemalepair"></a>

## `firstNameFemalePair`

`firstNameFemalePair` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameFemalePair() -> tuple[str, str, str]
```

Actual signature for `ja_JP`:

```text
fake.firstNameFemalePair() -> Tuple[str, str, str]
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstNameFemalePair()
```

<a id="faker-firstnamefemalerus"></a>

## `firstNameFemaleRus`

`firstNameFemaleRus` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameFemaleRus() -> str
```

Actual signature for `et_EE`:

```text
fake.firstNameFemaleRus() -> str
```


Verified availability: 1 locales. Example locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameFemaleRus()
```

<a id="faker-firstnamemale"></a>

## `firstNameMale`

`firstNameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameMale() -> str
```

Actual signature for `en_US`:

```text
fake.firstNameMale() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firstNameMale()
```

<a id="faker-firstnamemaleabbreviated"></a>

## `firstNameMaleAbbreviated`

`firstNameMaleAbbreviated` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameMaleAbbreviated() -> str
```

Actual signature for `hu_HU`:

```text
fake.firstNameMaleAbbreviated() -> str
```


Verified availability: 1 locales. Example locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.firstNameMaleAbbreviated()
```

<a id="faker-firstnamemalecommon"></a>

## `firstNameMaleCommon`

`firstNameMaleCommon` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameMaleCommon() -> str
```

Actual signature for `bn_BD`:

```text
fake.firstNameMaleCommon() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameMaleCommon()
```

<a id="faker-firstnamemaleest"></a>

## `firstNameMaleEst`

`firstNameMaleEst` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameMaleEst() -> str
```

Actual signature for `et_EE`:

```text
fake.firstNameMaleEst() -> str
```


Verified availability: 1 locales. Example locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameMaleEst()
```

<a id="faker-firstnamemalehinduism"></a>

## `firstNameMaleHinduism`

`firstNameMaleHinduism` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameMaleHinduism() -> str
```

Actual signature for `bn_BD`:

```text
fake.firstNameMaleHinduism() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameMaleHinduism()
```

<a id="faker-firstnamemaleislamic"></a>

## `firstNameMaleIslamic`

`firstNameMaleIslamic` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameMaleIslamic() -> str
```

Actual signature for `bn_BD`:

```text
fake.firstNameMaleIslamic() -> str
```


Verified availability: 1 locales. Example locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameMaleIslamic()
```

<a id="faker-firstnamemalepair"></a>

## `firstNameMalePair`

`firstNameMalePair` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameMalePair() -> tuple[str, str, str]
```

Actual signature for `ja_JP`:

```text
fake.firstNameMalePair() -> Tuple[str, str, str]
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstNameMalePair()
```

<a id="faker-firstnamemalerus"></a>

## `firstNameMaleRus`

`firstNameMaleRus` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameMaleRus() -> str
```

Actual signature for `et_EE`:

```text
fake.firstNameMaleRus() -> str
```


Verified availability: 1 locales. Example locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameMaleRus()
```

<a id="faker-firstnamenonbinary"></a>

## `firstNameNonbinary`

`firstNameNonbinary` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameNonbinary() -> str
```

Actual signature for `en_US`:

```text
fake.firstNameNonbinary() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firstNameNonbinary()
```

<a id="faker-firstnamepair"></a>

## `firstNamePair`

`firstNamePair` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNamePair() -> tuple[str, str, str]
```

Actual signature for `ja_JP`:

```text
fake.firstNamePair() -> Tuple[str, str, str]
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstNamePair()
```

<a id="faker-firstnamerus"></a>

## `firstNameRus`

`firstNameRus` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameRus() -> str
```

Actual signature for `et_EE`:

```text
fake.firstNameRus() -> str
```


Verified availability: 1 locales. Example locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameRus()
```

<a id="faker-firstnameunisex"></a>

## `firstNameUnisex`

`firstNameUnisex` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstNameUnisex() -> str
```

Actual signature for `or_IN`:

```text
fake.firstNameUnisex() -> str
```


Verified availability: 2 locales. Example locales: `or_IN`, `vi_VN`.

```python
fake = SampleFactory(locale="or_IN", seed=7).fake
value = fake.firstNameUnisex()
```

<a id="faker-firstromanizedname"></a>

## `firstRomanizedName`

`firstRomanizedName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstRomanizedName() -> str
```

Actual signature for `ja_JP`:

```text
fake.firstRomanizedName() -> str
```


Verified availability: 3 locales. Example locales: `ja_JP`, `zh_CN`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstRomanizedName()
```

<a id="faker-firstromanizednamefemale"></a>

## `firstRomanizedNameFemale`

`firstRomanizedNameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstRomanizedNameFemale() -> str
```

Actual signature for `ja_JP`:

```text
fake.firstRomanizedNameFemale() -> str
```


Verified availability: 2 locales. Example locales: `ja_JP`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstRomanizedNameFemale()
```

<a id="faker-firstromanizednamemale"></a>

## `firstRomanizedNameMale`

`firstRomanizedNameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def firstRomanizedNameMale() -> str
```

Actual signature for `ja_JP`:

```text
fake.firstRomanizedNameMale() -> str
```


Verified availability: 2 locales. Example locales: `ja_JP`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstRomanizedNameMale()
```

<a id="faker-fixedwidth"></a>

## `fixedWidth`

Returns fixed-width text using (width, definition, optional arguments) tuples in data_columns.

Orionis typed contract:

```text
def fixedWidth(data_columns: list[tuple[int, str] | tuple[int, str, dict[str, Any]]] | None=..., num_rows: int=..., align: str=...) -> str
```

Actual signature for `en_US`:

```text
fake.fixedWidth(data_columns: List[Tuple[int, str] | Tuple[int, str, Dict[str, Any]]] | None = None, num_rows: int = 10, align: str = 'left') -> str
```


| Parameter | Purpose |
| --- | --- |
| `data_columns` | Structure, column or generator-token definition. |
| `num_rows` | Number of serialized data rows. |
| `align` | Fixed-width field alignment: left, middle or right. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.fixedWidth(num_rows=2)
```

<a id="faker-floornumber"></a>

## `floorNumber`

`floorNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def floorNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.floorNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.floorNumber()
```

<a id="faker-floorunitnumber"></a>

## `floorUnitNumber`

`floorUnitNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def floorUnitNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.floorUnitNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.floorUnitNumber()
```

<a id="faker-freeemail"></a>

## `freeEmail`

`freeEmail` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def freeEmail() -> str
```

Actual signature for `en_US`:

```text
fake.freeEmail() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.freeEmail()
```

<a id="faker-freeemaildomain"></a>

## `freeEmailDomain`

`freeEmailDomain` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def freeEmailDomain() -> str
```

Actual signature for `en_US`:

```text
fake.freeEmailDomain() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.freeEmailDomain()
```

<a id="faker-freguesia"></a>

## `freguesia`

`freguesia` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def freguesia() -> str
```

Actual signature for `pt_PT`:

```text
fake.freguesia() -> str
```


Verified availability: 1 locales. Example locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.freguesia()
```

<a id="faker-frequentstreetname"></a>

## `frequentStreetName`

`frequentStreetName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def frequentStreetName() -> str
```

Actual signature for `hu_HU`:

```text
fake.frequentStreetName() -> str
```


Verified availability: 1 locales. Example locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.frequentStreetName()
```

<a id="faker-fullname"></a>

## `fullName`

`fullName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def fullName(gender: Literal['M', 'F', 'X'] | None=..., short: bool | None=...) -> str
```

Actual signature for `uk_UA`:

```text
fake.fullName(gender: Literal['M', 'F', 'X'] | None = None, short: bool | None = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `gender` | Gender selection using supported locale-specific values. |
| `short` | Requests the localized abbreviated full name. |

Verified availability: 1 locales. Example locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.fullName()
```

<a id="faker-futuredate"></a>

## `futureDate`

`futureDate` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def futureDate(end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=...) -> datetime.date
```

Actual signature for `en_US`:

```text
fake.futureDate(end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '+30d') -> datetime.date
```


| Parameter | Purpose |
| --- | --- |
| `end_date` | End date/time boundary or relative interval. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.futureDate()
```

<a id="faker-futuredatetime"></a>

## `futureDatetime`

`futureDatetime` generates dates, times and intervals for temporal fixtures.

Orionis typed contract:

```text
def futureDatetime(end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Actual signature for `en_US`:

```text
fake.futureDatetime(end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '+30d', tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parameter | Purpose |
| --- | --- |
| `end_date` | End date/time boundary or relative interval. |
| `tzinfo` | Timezone for generated datetime; None uses native behavior. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.futureDatetime()
```

<a id="faker-gemstonename"></a>

## `gemstoneName`

`gemstoneName` generates auxiliary test values and structures; return shape depends on the method.

Orionis typed contract:

```text
def gemstoneName() -> str
```

Actual signature for `en_PH`:

```text
fake.gemstoneName() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.gemstoneName()
```

<a id="faker-getarguments"></a>

## `getArguments`

Reads an argument or the group dict; missing groups/arguments return None. Returned dictionaries are native configuration objects.

Helper accessible through dynamic facade dispatch; not declared in `_ProviderMethods`.

Actual signature for `en_US`:

```text
fake.getArguments(group: str, argument: str | None = None) -> Any
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
fake.setArguments("small", {"min_value": 1, "max_value": 3})
value = fake.getArguments("small")
```

<a id="faker-getproviders"></a>

## `getProviders`

Returns registered provider instances. This is backend introspection rather than data generation; it is not a locale-independent method catalog.

Helper accessible through dynamic facade dispatch; not declared in `_ProviderMethods`.

Actual signature for `en_US`:

```text
fake.getProviders() -> List[ForwardRef('BaseProvider')]
```

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.getProviders()
```

<a id="faker-getwordslist"></a>

## `getWordsList`

`getWordsList` generates placeholder text for content and forms.

Orionis typed contract:

```text
def getWordsList(part_of_speech: str | None=..., ext_word_list: Sequence[str] | None=...) -> list[str]
```

Actual signature for `en_US`:

```text
fake.getWordsList(part_of_speech: str | None = None, ext_word_list: Sequence[str] | None = None) -> List[str]
```


| Parameter | Purpose |
| --- | --- |
| `part_of_speech` | Vocabulary grammatical category where supported by the locale. |
| `ext_word_list` | Alternative vocabulary or None for native data. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.getWordsList()
```

<a id="faker-givenname"></a>

## `givenName`

`givenName` generates names and identity components for test profiles.

Orionis typed contract:

```text
def givenName() -> str
```

Actual signature for `es_CL`:

```text
fake.givenName() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.givenName()
```

<a id="faker-givennamefemale"></a>

## `givenNameFemale`

`givenNameFemale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def givenNameFemale() -> str
```

Actual signature for `es_CL`:

```text
fake.givenNameFemale() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.givenNameFemale()
```

<a id="faker-givennamemale"></a>

## `givenNameMale`

`givenNameMale` generates names and identity components for test profiles.

Orionis typed contract:

```text
def givenNameMale() -> str
```

Actual signature for `es_CL`:

```text
fake.givenNameMale() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.givenNameMale()
```

<a id="faker-globearea2landlinenumber"></a>

## `globeArea2LandlineNumber`

`globeArea2LandlineNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def globeArea2LandlineNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.globeArea2LandlineNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.globeArea2LandlineNumber()
```

<a id="faker-globemobilenumber"></a>

## `globeMobileNumber`

`globeMobileNumber` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def globeMobileNumber() -> str
```

Actual signature for `en_PH`:

```text
fake.globeMobileNumber() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.globeMobileNumber()
```

<a id="faker-globemobilenumberprefix"></a>

## `globeMobileNumberPrefix`

`globeMobileNumberPrefix` generates fictional telephone numbers in local formats.

Orionis typed contract:

```text
def globeMobileNumberPrefix() -> str
```

Actual signature for `en_PH`:

```text
fake.globeMobileNumberPrefix() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.globeMobileNumberPrefix()
```

<a id="faker-gou"></a>

## `gou`

`gou` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def gou() -> str
```

Actual signature for `ja_JP`:

```text
fake.gou() -> str
```


Verified availability: 1 locales. Example locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.gou()
```

<a id="faker-gsis"></a>

## `gsis`

`gsis` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def gsis() -> str
```

Actual signature for `en_PH`:

```text
fake.gsis() -> str
```


Verified availability: 3 locales. Example locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.gsis()
```

<a id="faker-gstin"></a>

## `gstin`

`gstin` generates fictional administrative or tax identifiers; format depends on country.

Orionis typed contract:

```text
def gstin() -> str
```

Actual signature for `en_IN`:

```text
fake.gstin() -> str
```


Verified availability: 1 locales. Example locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.gstin()
```

<a id="faker-hexcolor"></a>

## `hexColor`

`hexColor` generates colors and representations for interface data.

Orionis typed contract:

```text
def hexColor() -> str
```

Actual signature for `en_US`:

```text
fake.hexColor() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.hexColor()
```

<a id="faker-hexify"></a>

## `hexify`

Replaces template placeholders with hexadecimal digits; `upper` controls case.

Orionis typed contract:

```text
def hexify(text: str=..., upper: bool=...) -> str
```

Actual signature for `en_US`:

```text
fake.hexify(text: str = '^^^^', upper: bool = False) -> str
```


| Parameter | Purpose |
| --- | --- |
| `text` | Template or text processed by the provider. |
| `upper` | Uses uppercase hexadecimal letters. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.hexify()
```

<a id="faker-highwayname"></a>

## `highwayName`

`highwayName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def highwayName() -> str
```

Actual signature for `es_CL`:

```text
fake.highwayName() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.highwayName()
```

<a id="faker-historicpeoplestreetname"></a>

## `historicPeopleStreetName`

`historicPeopleStreetName` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def historicPeopleStreetName() -> str
```

Actual signature for `es_CL`:

```text
fake.historicPeopleStreetName() -> str
```


Verified availability: 1 locales. Example locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.historicPeopleStreetName()
```

<a id="faker-hostname"></a>

## `hostname`

`hostname` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def hostname(levels: int=...) -> str
```

Actual signature for `en_US`:

```text
fake.hostname(levels: int = 1) -> str
```


| Parameter | Purpose |
| --- | --- |
| `levels` | Number of domain/hostname levels. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.hostname()
```

<a id="faker-housenumber"></a>

## `houseNumber`

`houseNumber` generates addresses and geographic subdivisions for test forms, deliveries and profiles.

Orionis typed contract:

```text
def houseNumber() -> str
```

Actual signature for `az_AZ`:

```text
fake.houseNumber() -> str
```


Verified availability: 1 locales. Example locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.houseNumber()
```

<a id="faker-httpmethod"></a>

## `httpMethod`

`httpMethod` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def httpMethod() -> str
```

Actual signature for `en_US`:

```text
fake.httpMethod() -> str
```


Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.httpMethod()
```

<a id="faker-httpstatuscode"></a>

## `httpStatusCode`

`httpStatusCode` generates Internet addresses and formats for test data; generating a string does not open a connection.

Orionis typed contract:

```text
def httpStatusCode(include_unassigned: bool=...) -> int
```

Actual signature for `en_US`:

```text
fake.httpStatusCode(include_unassigned: bool = True) -> int
```


| Parameter | Purpose |
| --- | --- |
| `include_unassigned` | Includes unassigned or unused HTTP status codes. |

Verified availability: 110 locales. Example locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.httpStatusCode()
```
