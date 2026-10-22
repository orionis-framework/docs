---
title: "Faker: proveedores A–D"
description: "Firmas, parámetros, locales y ejemplos de los proveedores A-D."
editUrl: true
lastUpdated: false
---

Esta referencia cubre 167 nombres de la fachada de Faker en el tramo A-D. El conjunto completo contiene **675 métodos tipados** (694 firmas con overloads) y **7 helpers de backend accesibles en runtime**, repartidos alfabéticamente. La disponibilidad se contrastó con los 110 locales del backend instalado; un método puede estar disponible solo en determinados locales.

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


<a id="faker-aadhaarid"></a>

## `aadhaarId`

`aadhaarId` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def aadhaarId() -> str
```

Firma real para `en_IN`:

```text
fake.aadhaarId() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.aadhaarId()
```

<a id="faker-aba"></a>

## `aba`

`aba` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def aba() -> str
```

Firma real para `en_US`:

```text
fake.aba() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.aba()
```

<a id="faker-academicprefix"></a>

## `academicPrefix`

`academicPrefix` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def academicPrefix() -> str
```

Firma real para `de_AT`:

```text
fake.academicPrefix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `de_AT`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.academicPrefix()
```

<a id="faker-academicsuffix"></a>

## `academicSuffix`

`academicSuffix` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def academicSuffix() -> str
```

Firma real para `de_AT`:

```text
fake.academicSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `de_AT`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.academicSuffix()
```

<a id="faker-address"></a>

## `address`

`address` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def address() -> str
```

Firma real para `en_US`:

```text
fake.address() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.address()
```

<a id="faker-addressdetail"></a>

## `addressDetail`

`addressDetail` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def addressDetail() -> str
```

Firma real para `ko_KR`:

```text
fake.addressDetail() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.addressDetail()
```

<a id="faker-administrativeunit"></a>

## `administrativeUnit`

`administrativeUnit` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def administrativeUnit() -> str
```

Firma real para `en_US`:

```text
fake.administrativeUnit() -> str
```


Disponibilidad verificada: 104 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.administrativeUnit()
```

<a id="faker-ampm"></a>

## `amPm`

`amPm` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def amPm() -> str
```

Firma real para `en_US`:

```text
fake.amPm() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.amPm()
```

<a id="faker-amphoe"></a>

## `amphoe`

`amphoe` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def amphoe() -> str
```

Firma real para `th_TH`:

```text
fake.amphoe() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.amphoe()
```

<a id="faker-androidplatformtoken"></a>

## `androidPlatformToken`

`androidPlatformToken` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def androidPlatformToken() -> str
```

Firma real para `en_US`:

```text
fake.androidPlatformToken() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.androidPlatformToken()
```

<a id="faker-apecode"></a>

## `apeCode`

`apeCode` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def apeCode(version: str | None=...) -> str
```

Firma real para `fr_CH`:

```text
fake.apeCode(version: str | None = 'naf-2003') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `version` | Versión del código APE; naf-2003 solicita el formato NAF 2003. |

Disponibilidad verificada: 2 locales. Ejemplos de locales: `fr_CH`, `fr_FR`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.apeCode()
```

<a id="faker-area2landlinenumber"></a>

## `area2LandlineNumber`

`area2LandlineNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def area2LandlineNumber() -> str
```

Firma real para `en_PH`:

```text
fake.area2LandlineNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.area2LandlineNumber()
```

<a id="faker-areacode"></a>

## `areaCode`

`areaCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def areaCode() -> str
```

Firma real para `ar_AE`:

```text
fake.areaCode() -> str
```


Disponibilidad verificada: 10 locales. Ejemplos de locales: `ar_AE`, `ar_DZ`, `ar_JO`, `ar_PS`, `az_AZ`, `de_AT`, `en_AU`, `en_NZ`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.areaCode()
```

<a id="faker-areacodewithseparator"></a>

## `areaCodeWithSeparator`

`areaCodeWithSeparator` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def areaCodeWithSeparator() -> str
```

Firma real para `fr_FR`:

```text
fake.areaCodeWithSeparator() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `fr_FR`.

```python
fake = SampleFactory(locale="fr_FR", seed=7).fake
value = fake.areaCodeWithSeparator()
```

<a id="faker-areacodewithoutseparator"></a>

## `areaCodeWithoutSeparator`

`areaCodeWithoutSeparator` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def areaCodeWithoutSeparator() -> str
```

Firma real para `fr_FR`:

```text
fake.areaCodeWithoutSeparator() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `fr_FR`.

```python
fake = SampleFactory(locale="fr_FR", seed=7).fake
value = fake.areaCodeWithoutSeparator()
```

<a id="faker-areaname"></a>

## `areaName`

`areaName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def areaName() -> str
```

Firma real para `bn_BD`:

```text
fake.areaName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `bn_BD`, `en_BD`, `ja_JP`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.areaName()
```

<a id="faker-asciicompanyemail"></a>

## `asciiCompanyEmail`

`asciiCompanyEmail` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def asciiCompanyEmail() -> str
```

Firma real para `en_US`:

```text
fake.asciiCompanyEmail() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.asciiCompanyEmail()
```

<a id="faker-asciiemail"></a>

## `asciiEmail`

`asciiEmail` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def asciiEmail() -> str
```

Firma real para `en_US`:

```text
fake.asciiEmail() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.asciiEmail()
```

<a id="faker-asciifreeemail"></a>

## `asciiFreeEmail`

`asciiFreeEmail` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def asciiFreeEmail() -> str
```

Firma real para `en_US`:

```text
fake.asciiFreeEmail() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.asciiFreeEmail()
```

<a id="faker-asciisafeemail"></a>

## `asciiSafeEmail`

`asciiSafeEmail` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def asciiSafeEmail() -> str
```

Firma real para `en_US`:

```text
fake.asciiSafeEmail() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.asciiSafeEmail()
```

<a id="faker-automobilelicenseplate"></a>

## `automobileLicensePlate`

`automobileLicensePlate` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def automobileLicensePlate() -> str
```

Firma real para `en_PH`:

```text
fake.automobileLicensePlate() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.automobileLicensePlate()
```

<a id="faker-autonomouscommunity"></a>

## `autonomousCommunity`

`autonomousCommunity` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def autonomousCommunity() -> str
```

Firma real para `es_ES`:

```text
fake.autonomousCommunity() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_ES`, `es`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.autonomousCommunity()
```

<a id="faker-bairro"></a>

## `bairro`

`bairro` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def bairro() -> str
```

Firma real para `pt_BR`:

```text
fake.bairro() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.bairro()
```

<a id="faker-ban"></a>

## `ban`

`ban` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def ban() -> str
```

Firma real para `ja_JP`:

```text
fake.ban() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.ban()
```

<a id="faker-bank"></a>

## `bank`

`bank` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def bank() -> str
```

Firma real para `en_US`:

```text
fake.bank() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bank()
```

<a id="faker-bankcountry"></a>

## `bankCountry`

`bankCountry` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def bankCountry() -> str
```

Firma real para `en_US`:

```text
fake.bankCountry() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bankCountry()
```

<a id="faker-basicphonenumber"></a>

## `basicPhoneNumber`

`basicPhoneNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def basicPhoneNumber() -> str
```

Firma real para `en_US`:

```text
fake.basicPhoneNumber() -> str
```


Disponibilidad verificada: 36 locales. Ejemplos de locales: `en_US`, `ar_AA`, `ar_BH`, `ar_EG`, `ar_SA`, `dk_DK`, `el_CY`, `en`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.basicPhoneNumber()
```

<a id="faker-bayantelarea2landlinenumber"></a>

## `bayantelArea2LandlineNumber`

`bayantelArea2LandlineNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def bayantelArea2LandlineNumber() -> str
```

Firma real para `en_PH`:

```text
fake.bayantelArea2LandlineNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.bayantelArea2LandlineNumber()
```

<a id="faker-bayantellandlineidentifier"></a>

## `bayantelLandlineIdentifier`

`bayantelLandlineIdentifier` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def bayantelLandlineIdentifier() -> str
```

Firma real para `en_PH`:

```text
fake.bayantelLandlineIdentifier() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.bayantelLandlineIdentifier()
```

<a id="faker-bban"></a>

## `bban`

`bban` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def bban() -> str
```

Firma real para `en_US`:

```text
fake.bban() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bban()
```

<a id="faker-bic"></a>

## `bic`

`bic` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def bic() -> str
```

Firma real para `ru_RU`:

```text
fake.bic() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.bic()
```

<a id="faker-binary"></a>

## `binary`

`binary` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def binary(length: int=...) -> bytes
```

Firma real para `en_US`:

```text
fake.binary(length: int = 1048576) -> bytes
```


| Parámetro | Propósito |
| --- | --- |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.binary(length=16)
```

<a id="faker-birthnumber"></a>

## `birthNumber`

`birthNumber` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def birthNumber() -> str
```

Firma real para `cs_CZ`:

```text
fake.birthNumber() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `cs_CZ`, `sk_SK`.

```python
fake = SampleFactory(locale="cs_CZ", seed=7).fake
value = fake.birthNumber()
```

<a id="faker-boolean"></a>

## `boolean`

Booleano con porcentaje `chance_of_getting_true` de obtener True.

Contrato tipado de Orionis:

```text
def boolean(chance_of_getting_true: int=...) -> bool
```

Firma real para `en_US`:

```text
fake.boolean(chance_of_getting_true: int = 50) -> bool
```


| Parámetro | Propósito |
| --- | --- |
| `chance_of_getting_true` | Porcentaje de True (0 a 100). |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.boolean()
```

<a id="faker-borough"></a>

## `borough`

`borough` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def borough() -> str
```

Firma real para `ko_KR`:

```text
fake.borough() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.borough()
```

<a id="faker-bothify"></a>

## `bothify`

Sustituye marcadores numéricos y alfabéticos de una plantilla. Útil para referencias como SKU; `#` genera dígitos y `?` letras de `letters`.

Contrato tipado de Orionis:

```text
def bothify(text: str=..., letters: str=...) -> str
```

Firma real para `en_US`:

```text
fake.bothify(text: str = '## ??', letters: str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `text` | Plantilla o texto que procesará el proveedor. |
| `letters` | Población de caracteres alfabéticos. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bothify()
```

<a id="faker-brandsuffix"></a>

## `brandSuffix`

`brandSuffix` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def brandSuffix() -> str
```

Firma real para `ko_KR`:

```text
fake.brandSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.brandSuffix()
```

<a id="faker-bs"></a>

## `bs`

`bs` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def bs() -> str
```

Firma real para `en_US`:

```text
fake.bs() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.bs()
```

<a id="faker-buildingdong"></a>

## `buildingDong`

`buildingDong` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingDong() -> str
```

Firma real para `ko_KR`:

```text
fake.buildingDong() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.buildingDong()
```

<a id="faker-buildingname"></a>

## `buildingName`

`buildingName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingName() -> str
```

Firma real para `bn_BD`:

```text
fake.buildingName() -> str
```


Disponibilidad verificada: 7 locales. Ejemplos de locales: `bn_BD`, `en_BD`, `en_PH`, `fil_PH`, `ja_JP`, `ko_KR`, `tl_PH`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.buildingName()
```

<a id="faker-buildingnamesuffix"></a>

## `buildingNameSuffix`

`buildingNameSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingNameSuffix() -> str
```

Firma real para `en_PH`:

```text
fake.buildingNameSuffix() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.buildingNameSuffix()
```

<a id="faker-buildingnumber"></a>

## `buildingNumber`

`buildingNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingNumber() -> str
```

Firma real para `en_US`:

```text
fake.buildingNumber() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.buildingNumber()
```

<a id="faker-buildingnumbersegregated"></a>

## `buildingNumberSegregated`

`buildingNumberSegregated` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingNumberSegregated() -> str
```

Firma real para `ko_KR`:

```text
fake.buildingNumberSegregated() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.buildingNumberSegregated()
```

<a id="faker-buildingnumberunderground"></a>

## `buildingNumberUnderground`

`buildingNumberUnderground` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingNumberUnderground() -> str
```

Firma real para `ko_KR`:

```text
fake.buildingNumberUnderground() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.buildingNumberUnderground()
```

<a id="faker-buildingprefix"></a>

## `buildingPrefix`

`buildingPrefix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingPrefix() -> str
```

Firma real para `en_MS`:

```text
fake.buildingPrefix() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `en_MS`, `ne_NP`.

```python
fake = SampleFactory(locale="en_MS", seed=7).fake
value = fake.buildingPrefix()
```

<a id="faker-buildingsuffix"></a>

## `buildingSuffix`

`buildingSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingSuffix() -> str
```

Firma real para `ko_KR`:

```text
fake.buildingSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.buildingSuffix()
```

<a id="faker-buildingunitnumber"></a>

## `buildingUnitNumber`

`buildingUnitNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def buildingUnitNumber() -> str
```

Firma real para `en_PH`:

```text
fake.buildingUnitNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.buildingUnitNumber()
```

<a id="faker-businessesinn"></a>

## `businessesInn`

`businessesInn` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def businessesInn() -> str
```

Firma real para `ru_RU`:

```text
fake.businessesInn() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.businessesInn()
```

<a id="faker-businessesogrn"></a>

## `businessesOgrn`

`businessesOgrn` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def businessesOgrn() -> str
```

Firma real para `ru_RU`:

```text
fake.businessesOgrn() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.businessesOgrn()
```

<a id="faker-canton"></a>

## `canton`

`canton` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def canton() -> tuple[str, str]
```

Firma real para `de_CH`:

```text
fake.canton() -> Tuple[str, str]
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de_CH`, `fr_CH`.

```python
fake = SampleFactory(locale="de_CH", seed=7).fake
value = fake.canton()
```

<a id="faker-cantoncode"></a>

## `cantonCode`

`cantonCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cantonCode() -> str
```

Firma real para `de_CH`:

```text
fake.cantonCode() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de_CH`, `fr_CH`.

```python
fake = SampleFactory(locale="de_CH", seed=7).fake
value = fake.cantonCode()
```

<a id="faker-cantonname"></a>

## `cantonName`

`cantonName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cantonName() -> str
```

Firma real para `de_CH`:

```text
fake.cantonName() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de_CH`, `fr_CH`.

```python
fake = SampleFactory(locale="de_CH", seed=7).fake
value = fake.cantonName()
```

<a id="faker-catchphrase"></a>

## `catchPhrase`

`catchPhrase` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def catchPhrase() -> str
```

Firma real para `en_US`:

```text
fake.catchPhrase() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.catchPhrase()
```

<a id="faker-catchphraseattribute"></a>

## `catchPhraseAttribute`

`catchPhraseAttribute` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def catchPhraseAttribute() -> str
```

Firma real para `ar_DZ`:

```text
fake.catchPhraseAttribute() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `ar_DZ`, `fr_CH`, `fr_DZ`, `fr_FR`, `pt_BR`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.catchPhraseAttribute()
```

<a id="faker-catchphrasenoun"></a>

## `catchPhraseNoun`

`catchPhraseNoun` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def catchPhraseNoun() -> str
```

Firma real para `ar_DZ`:

```text
fake.catchPhraseNoun() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `ar_DZ`, `fr_CH`, `fr_DZ`, `fr_FR`, `pt_BR`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.catchPhraseNoun()
```

<a id="faker-catchphraseverb"></a>

## `catchPhraseVerb`

`catchPhraseVerb` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def catchPhraseVerb() -> str
```

Firma real para `ar_DZ`:

```text
fake.catchPhraseVerb() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `ar_DZ`, `fr_CH`, `fr_DZ`, `fr_FR`, `pt_BR`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.catchPhraseVerb()
```

<a id="faker-cellphoneblock"></a>

## `cellphoneBlock`

`cellphoneBlock` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def cellphoneBlock() -> str
```

Firma real para `es_CL`:

```text
fake.cellphoneBlock() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.cellphoneBlock()
```

<a id="faker-cellphonenumber"></a>

## `cellphoneNumber`

`cellphoneNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def cellphoneNumber() -> str
```

Firma real para `ar_AE`:

```text
fake.cellphoneNumber() -> str
```


Disponibilidad verificada: 10 locales. Ejemplos de locales: `ar_AE`, `ar_DZ`, `ar_JO`, `ar_PS`, `az_AZ`, `de_AT`, `de_CH`, `en_GB`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.cellphoneNumber()
```

<a id="faker-cellphoneprovidercode"></a>

## `cellphoneProviderCode`

`cellphoneProviderCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def cellphoneProviderCode() -> str
```

Firma real para `ar_AE`:

```text
fake.cellphoneProviderCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ar_AE`.

```python
fake = SampleFactory(locale="ar_AE", seed=7).fake
value = fake.cellphoneProviderCode()
```

<a id="faker-century"></a>

## `century`

`century` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def century() -> str
```

Firma real para `en_US`:

```text
fake.century() -> str
```


| Parámetro | Propósito |
| --- | --- |
| `thai_digit` | Usa dígitos tailandeses en la representación del proveedor. |
| `buddhist_era` | Usa la era budista para la representación de fecha del proveedor tailandés. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 102 más:

```text
fake.century() -> str
```

`th`, `th_TH`:

```text
fake.century(thai_digit: bool = False, buddhist_era: bool = True) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.century()
```

<a id="faker-checkingaccount"></a>

## `checkingAccount`

`checkingAccount` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def checkingAccount() -> str
```

Firma real para `ru_RU`:

```text
fake.checkingAccount() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.checkingAccount()
```

<a id="faker-chome"></a>

## `chome`

`chome` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def chome() -> str
```

Firma real para `ja_JP`:

```text
fake.chome() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.chome()
```

<a id="faker-chrome"></a>

## `chrome`

`chrome` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def chrome(version_from: int=..., version_to: int=..., build_from: int=..., build_to: int=...) -> str
```

Firma real para `en_US`:

```text
fake.chrome(version_from: int = 13, version_to: int = 63, build_from: int = 800, build_to: int = 899) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `version_from` | Versión inicial del navegador Chrome simulado. |
| `version_to` | Versión final del navegador Chrome simulado. |
| `build_from` | Límite inferior del número de build de Chrome simulado. |
| `build_to` | Límite superior del número de build de Chrome simulado. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.chrome()
```

<a id="faker-cie"></a>

## `cie`

`cie` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def cie() -> str
```

Firma real para `it_IT`:

```text
fake.cie() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `it_IT`.

```python
fake = SampleFactory(locale="it_IT", seed=7).fake
value = fake.cie()
```

<a id="faker-cif"></a>

## `cif`

`cif` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def cif() -> str
```

Firma real para `es_ES`:

```text
fake.cif() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `es_ES`, `es`, `es_CA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.cif()
```

<a id="faker-cin"></a>

## `cin`

`cin` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def cin() -> str
```

Firma real para `pt_BR`:

```text
fake.cin() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.cin()
```

<a id="faker-city"></a>

## `city`

`city` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def city() -> str
```

Firma real para `en_US`:

```text
fake.city() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.city()
```

<a id="faker-cityadjective"></a>

## `cityAdjective`

`cityAdjective` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cityAdjective() -> str
```

Firma real para `es_MX`:

```text
fake.cityAdjective() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.cityAdjective()
```

<a id="faker-cityname"></a>

## `cityName`

`cityName` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def cityName() -> str
```

Firma real para `bn_BD`:

```text
fake.cityName() -> str
```


Disponibilidad verificada: 30 locales. Ejemplos de locales: `bn_BD`, `cs_CZ`, `da_DK`, `de`, `de_AT`, `de_CH`, `de_DE`, `en_IN`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.cityName()
```

<a id="faker-citynamesuffix"></a>

## `cityNameSuffix`

`cityNameSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cityNameSuffix() -> str
```

Firma real para `zh_TW`:

```text
fake.cityNameSuffix() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `zh_TW`, `zu_ZA`.

```python
fake = SampleFactory(locale="zh_TW", seed=7).fake
value = fake.cityNameSuffix()
```

<a id="faker-citypart"></a>

## `cityPart`

`cityPart` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cityPart() -> str
```

Firma real para `hu_HU`:

```text
fake.cityPart() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.cityPart()
```

<a id="faker-cityprefix"></a>

## `cityPrefix`

`cityPrefix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cityPrefix() -> str
```

Firma real para `en_US`:

```text
fake.cityPrefix() -> str
```


Disponibilidad verificada: 63 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.cityPrefix()
```

<a id="faker-cityprefixabbr"></a>

## `cityPrefixAbbr`

`cityPrefixAbbr` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cityPrefixAbbr() -> str
```

Firma real para `en_MS`:

```text
fake.cityPrefixAbbr() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_MS`.

```python
fake = SampleFactory(locale="en_MS", seed=7).fake
value = fake.cityPrefixAbbr()
```

<a id="faker-citystate"></a>

## `cityState`

`cityState` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cityState() -> str
```

Firma real para `en_MS`:

```text
fake.cityState() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_MS`.

```python
fake = SampleFactory(locale="en_MS", seed=7).fake
value = fake.cityState()
```

<a id="faker-citysuffix"></a>

## `citySuffix`

`citySuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def citySuffix() -> str
```

Firma real para `en_US`:

```text
fake.citySuffix() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.citySuffix()
```

<a id="faker-citywithpostcode"></a>

## `cityWithPostcode`

`cityWithPostcode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def cityWithPostcode() -> str
```

Firma real para `cs_CZ`:

```text
fake.cityWithPostcode() -> str
```


Disponibilidad verificada: 6 locales. Ejemplos de locales: `cs_CZ`, `de`, `de_AT`, `de_DE`, `ro_RO`, `sk_SK`.

```python
fake = SampleFactory(locale="cs_CZ", seed=7).fake
value = fake.cityWithPostcode()
```

<a id="faker-civilstatus"></a>

## `civilStatus`

`civilStatus` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def civilStatus() -> tuple[str, str]
```

Firma real para `de_DE`:

```text
fake.civilStatus() -> Tuple[str, str]
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.civilStatus()
```

<a id="faker-civilstatuscode"></a>

## `civilStatusCode`

`civilStatusCode` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def civilStatusCode() -> str
```

Firma real para `de_DE`:

```text
fake.civilStatusCode() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.civilStatusCode()
```

<a id="faker-civilstatusname"></a>

## `civilStatusName`

`civilStatusName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def civilStatusName() -> str
```

Firma real para `de_DE`:

```text
fake.civilStatusName() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.civilStatusName()
```

<a id="faker-clabe"></a>

## `clabe`

`clabe` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def clabe(bank_code: int | None=...) -> str
```

Firma real para `es_MX`:

```text
fake.clabe(bank_code: int | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `bank_code` | Código bancario utilizado al generar CLABE. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.clabe()
```

<a id="faker-classificationnumber"></a>

## `classificationNumber`

`classificationNumber` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def classificationNumber() -> str
```

Firma real para `ja_JP`:

```text
fake.classificationNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.classificationNumber()
```

<a id="faker-cnpj"></a>

## `cnpj`

`cnpj` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def cnpj(use_alphanumeric: bool=...) -> str
```

Firma real para `pt_BR`:

```text
fake.cnpj(use_alphanumeric: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `use_alphanumeric` | Permite el formato alfanumérico del identificador empresarial brasileño. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.cnpj()
```

<a id="faker-color"></a>

## `color`

`color` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def color(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=..., color_format: str=...) -> str
```

Firma real para `en_US`:

```text
fake.color(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None, color_format: str = 'hex') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `hue` | Matiz o familia de color admitida por el proveedor. |
| `luminosity` | Categoría de luminosidad del color. |
| `color_format` | Representación del color (según proveedor). |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.color()
```

<a id="faker-colorhsl"></a>

## `colorHsl`

`colorHsl` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def colorHsl(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=...) -> tuple[int, int, int]
```

Firma real para `en_US`:

```text
fake.colorHsl(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None) -> Tuple[int, int, int]
```


| Parámetro | Propósito |
| --- | --- |
| `hue` | Matiz o familia de color admitida por el proveedor. |
| `luminosity` | Categoría de luminosidad del color. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorHsl()
```

<a id="faker-colorhsv"></a>

## `colorHsv`

`colorHsv` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def colorHsv(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=...) -> tuple[int, int, int]
```

Firma real para `en_US`:

```text
fake.colorHsv(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None) -> Tuple[int, int, int]
```


| Parámetro | Propósito |
| --- | --- |
| `hue` | Matiz o familia de color admitida por el proveedor. |
| `luminosity` | Categoría de luminosidad del color. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorHsv()
```

<a id="faker-colorname"></a>

## `colorName`

`colorName` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def colorName() -> str
```

Firma real para `en_US`:

```text
fake.colorName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorName()
```

<a id="faker-colorrgb"></a>

## `colorRgb`

`colorRgb` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def colorRgb(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=...) -> tuple[int, int, int]
```

Firma real para `en_US`:

```text
fake.colorRgb(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None) -> Tuple[int, int, int]
```


| Parámetro | Propósito |
| --- | --- |
| `hue` | Matiz o familia de color admitida por el proveedor. |
| `luminosity` | Categoría de luminosidad del color. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorRgb()
```

<a id="faker-colorrgbfloat"></a>

## `colorRgbFloat`

`colorRgbFloat` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def colorRgbFloat(hue: str | float | int | Sequence[int] | None=..., luminosity: str | None=...) -> tuple[float, float, float]
```

Firma real para `en_US`:

```text
fake.colorRgbFloat(hue: str | float | int | Sequence[int] | None = None, luminosity: str | None = None) -> Tuple[float, float, float]
```


| Parámetro | Propósito |
| --- | --- |
| `hue` | Matiz o familia de color admitida por el proveedor. |
| `luminosity` | Categoría de luminosidad del color. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.colorRgbFloat()
```

<a id="faker-commonstreetname"></a>

## `commonStreetName`

`commonStreetName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def commonStreetName() -> str
```

Firma real para `es_CL`:

```text
fake.commonStreetName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.commonStreetName()
```

<a id="faker-commune"></a>

## `commune`

`commune` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def commune() -> str
```

Firma real para `es_CL`:

```text
fake.commune() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_CL`, `vi_VN`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.commune()
```

<a id="faker-communeandregion"></a>

## `communeAndRegion`

`communeAndRegion` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def communeAndRegion() -> str
```

Firma real para `es_CL`:

```text
fake.communeAndRegion() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.communeAndRegion()
```

<a id="faker-communecode"></a>

## `communeCode`

`communeCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def communeCode() -> str
```

Firma real para `es_CL`:

```text
fake.communeCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.communeCode()
```

<a id="faker-communename"></a>

## `communeName`

`communeName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def communeName() -> str
```

Firma real para `vi_VN`:

```text
fake.communeName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.communeName()
```

<a id="faker-communeprefix"></a>

## `communePrefix`

`communePrefix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def communePrefix() -> Any
```

Firma real para `vi_VN`:

```text
fake.communePrefix()
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.communePrefix()
```

<a id="faker-company"></a>

## `company`

`company` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def company() -> str
```

Firma real para `en_US`:

```text
fake.company() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.company()
```

<a id="faker-companybusinessid"></a>

## `companyBusinessId`

`companyBusinessId` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyBusinessId() -> str
```

Firma real para `fi_FI`:

```text
fake.companyBusinessId() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `fi_FI`.

```python
fake = SampleFactory(locale="fi_FI", seed=7).fake
value = fake.companyBusinessId()
```

<a id="faker-companycategory"></a>

## `companyCategory`

`companyCategory` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyCategory() -> str
```

Firma real para `ja_JP`:

```text
fake.companyCategory() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.companyCategory()
```

<a id="faker-companyemail"></a>

## `companyEmail`

`companyEmail` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def companyEmail() -> str
```

Firma real para `en_US`:

```text
fake.companyEmail() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.companyEmail()
```

<a id="faker-companyid"></a>

## `companyId`

`companyId` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyId(use_alphanumeric: bool=...) -> str
```

Firma real para `pt_BR`:

```text
fake.companyId(use_alphanumeric: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `use_alphanumeric` | Permite el formato alfanumérico del identificador empresarial brasileño. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.companyId()
```

<a id="faker-companylimitedprefix"></a>

## `companyLimitedPrefix`

`companyLimitedPrefix` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyLimitedPrefix() -> str
```

Firma real para `th_TH`:

```text
fake.companyLimitedPrefix() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.companyLimitedPrefix()
```

<a id="faker-companylimitedsuffix"></a>

## `companyLimitedSuffix`

`companyLimitedSuffix` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyLimitedSuffix() -> str
```

Firma real para `th_TH`:

```text
fake.companyLimitedSuffix() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.companyLimitedSuffix()
```

<a id="faker-companynameword"></a>

## `companyNameWord`

`companyNameWord` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyNameWord() -> str
```

Firma real para `ko_KR`:

```text
fake.companyNameWord() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.companyNameWord()
```

<a id="faker-companyprefix"></a>

## `companyPrefix`

`companyPrefix` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyPrefix() -> str
```

Firma real para `es_ES`:

```text
fake.companyPrefix() -> str
```


Disponibilidad verificada: 13 locales. Ejemplos de locales: `es_ES`, `es`, `es_CL`, `es_MX`, `id_ID`, `ja_JP`, `nl_NL`, `pl_PL`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.companyPrefix()
```

<a id="faker-companyrut"></a>

## `companyRut`

`companyRut` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def companyRut() -> str
```

Firma real para `es_CL`:

```text
fake.companyRut() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.companyRut()
```

<a id="faker-companysuffix"></a>

## `companySuffix`

`companySuffix` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companySuffix() -> str
```

Firma real para `en_US`:

```text
fake.companySuffix() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.companySuffix()
```

<a id="faker-companytype"></a>

## `companyType`

`companyType` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyType() -> str
```

Firma real para `es_ES`:

```text
fake.companyType() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `es_ES`, `en_PH`, `es`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.companyType()
```

<a id="faker-companyvat"></a>

## `companyVat`

`companyVat` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def companyVat() -> str
```

Firma real para `fi_FI`:

```text
fake.companyVat() -> str
```


| Parámetro | Propósito |
| --- | --- |
| `siren` | SIREN incorporado al registro mercantil RCS. |

Variantes reales por locale:

`fi_FI`, `it_IT`, `pl_PL`:

```text
fake.companyVat() -> str
```

`fr_CH`, `fr_FR`:

```text
fake.companyVat(siren: str = '') -> str
```

Disponibilidad verificada: 5 locales. Ejemplos de locales: `fi_FI`, `fr_CH`, `fr_FR`, `it_IT`, `pl_PL`.

```python
fake = SampleFactory(locale="fi_FI", seed=7).fake
value = fake.companyVat()
```

<a id="faker-concelho"></a>

## `concelho`

`concelho` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def concelho() -> str
```

Firma real para `pt_PT`:

```text
fake.concelho() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.concelho()
```

<a id="faker-coordinate"></a>

## `coordinate`

`coordinate` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def coordinate(center: float | None=..., radius: float | int=...) -> Decimal
```

Firma real para `en_US`:

```text
fake.coordinate(center: float | None = None, radius: float | int = 0.001) -> decimal.Decimal
```


| Parámetro | Propósito |
| --- | --- |
| `center` | Coordenada central alrededor de la que se genera el valor. |
| `radius` | Distancia máxima respecto a center de la coordenada simulada. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.coordinate()
```

<a id="faker-correspondentaccount"></a>

## `correspondentAccount`

`correspondentAccount` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def correspondentAccount() -> str
```

Firma real para `ru_RU`:

```text
fake.correspondentAccount() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.correspondentAccount()
```

<a id="faker-country"></a>

## `country`

`country` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def country() -> str
```

Firma real para `en_US`:

```text
fake.country() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.country()
```

<a id="faker-countrycallingcode"></a>

## `countryCallingCode`

`countryCallingCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def countryCallingCode() -> str
```

Firma real para `en_US`:

```text
fake.countryCallingCode() -> str
```


Disponibilidad verificada: 107 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.countryCallingCode()
```

<a id="faker-countrycode"></a>

## `countryCode`

`countryCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def countryCode(representation: str=...) -> str
```

Firma real para `en_US`:

```text
fake.countryCode(representation: str = 'alpha-2') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `representation` | Representación del código de país admitida por el proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.countryCode()
```

<a id="faker-county"></a>

## `county`

`county` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def county() -> str
```

Firma real para `en_GB`:

```text
fake.county() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_GB`, `en_IE`, `hu_HU`.

```python
fake = SampleFactory(locale="en_GB", seed=7).fake
value = fake.county()
```

<a id="faker-cpf"></a>

## `cpf`

`cpf` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def cpf() -> str
```

Firma real para `pt_BR`:

```text
fake.cpf() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.cpf()
```

<a id="faker-creditcardexpire"></a>

## `creditCardExpire`

`creditCardExpire` genera formatos ficticios de tarjeta; no genera medios de pago utilizables.

Contrato tipado de Orionis:

```text
def creditCardExpire(start: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., end: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., date_format: str=...) -> str
```

Firma real para `en_US`:

```text
fake.creditCardExpire(start: datetime.date | datetime.datetime | datetime.timedelta | str | int = 'now', end: datetime.date | datetime.datetime | datetime.timedelta | str | int = '+10y', date_format: str = '%m/%y') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `start` | Límite inicial de la fecha de vencimiento. |
| `end` | Límite final de la fecha de vencimiento. |
| `date_format` | Formato strftime del texto de fecha. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardExpire()
```

<a id="faker-creditcardfull"></a>

## `creditCardFull`

`creditCardFull` genera formatos ficticios de tarjeta; no genera medios de pago utilizables.

Contrato tipado de Orionis:

```text
def creditCardFull(card_type: CardType | None=...) -> str
```

Firma real para `en_US`:

```text
fake.creditCardFull(card_type: ~CardType | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `card_type` | Categoría de tarjeta admitida por el proveedor nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardFull()
```

<a id="faker-creditcardnumber"></a>

## `creditCardNumber`

`creditCardNumber` genera formatos ficticios de tarjeta; no genera medios de pago utilizables.

Contrato tipado de Orionis:

```text
def creditCardNumber(card_type: CardType | None=...) -> str
```

Firma real para `en_US`:

```text
fake.creditCardNumber(card_type: ~CardType | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `card_type` | Categoría de tarjeta admitida por el proveedor nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardNumber()
```

<a id="faker-creditcardprovider"></a>

## `creditCardProvider`

`creditCardProvider` genera formatos ficticios de tarjeta; no genera medios de pago utilizables.

Contrato tipado de Orionis:

```text
def creditCardProvider(card_type: CardType | None=...) -> str
```

Firma real para `en_US`:

```text
fake.creditCardProvider(card_type: ~CardType | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `card_type` | Categoría de tarjeta admitida por el proveedor nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardProvider()
```

<a id="faker-creditcardsecuritycode"></a>

## `creditCardSecurityCode`

`creditCardSecurityCode` genera formatos ficticios de tarjeta; no genera medios de pago utilizables.

Contrato tipado de Orionis:

```text
def creditCardSecurityCode(card_type: CardType | None=...) -> str
```

Firma real para `en_US`:

```text
fake.creditCardSecurityCode(card_type: ~CardType | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `card_type` | Categoría de tarjeta admitida por el proveedor nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.creditCardSecurityCode()
```

<a id="faker-cryptocurrency"></a>

## `cryptocurrency`

`cryptocurrency` genera nombres, símbolos y códigos monetarios para catálogos.

Contrato tipado de Orionis:

```text
def cryptocurrency() -> tuple[str, str]
```

Firma real para `en_US`:

```text
fake.cryptocurrency() -> Tuple[str, str]
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.cryptocurrency()
```

<a id="faker-cryptocurrencycode"></a>

## `cryptocurrencyCode`

`cryptocurrencyCode` genera nombres, símbolos y códigos monetarios para catálogos.

Contrato tipado de Orionis:

```text
def cryptocurrencyCode() -> str
```

Firma real para `en_US`:

```text
fake.cryptocurrencyCode() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.cryptocurrencyCode()
```

<a id="faker-cryptocurrencyname"></a>

## `cryptocurrencyName`

`cryptocurrencyName` genera nombres, símbolos y códigos monetarios para catálogos.

Contrato tipado de Orionis:

```text
def cryptocurrencyName() -> str
```

Firma real para `en_US`:

```text
fake.cryptocurrencyName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.cryptocurrencyName()
```

<a id="faker-csv"></a>

## `csv`

Devuelve CSV en una cadena. data_columns usa tokens del parser nativo; num_rows controla las filas.

Contrato tipado de Orionis:

```text
def csv(header: Sequence[str] | None=..., data_columns: tuple[str, str]=..., num_rows: int=..., include_row_ids: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.csv(header: Sequence[str] | None = None, data_columns: Tuple[str, str] = ('{{name}}', '{{address}}'), num_rows: int = 10, include_row_ids: bool = False) -> str
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
value = fake.csv(num_rows=2)
```

<a id="faker-curp"></a>

## `curp`

`curp` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def curp() -> str
```

Firma real para `es_MX`:

```text
fake.curp() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.curp()
```

<a id="faker-currency"></a>

## `currency`

`currency` genera nombres, símbolos y códigos monetarios para catálogos.

Contrato tipado de Orionis:

```text
def currency() -> tuple[str, str]
```

Firma real para `en_US`:

```text
fake.currency() -> Tuple[str, str]
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currency()
```

<a id="faker-currencycode"></a>

## `currencyCode`

`currencyCode` genera nombres, símbolos y códigos monetarios para catálogos.

Contrato tipado de Orionis:

```text
def currencyCode() -> str
```

Firma real para `en_US`:

```text
fake.currencyCode() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currencyCode()
```

<a id="faker-currencyname"></a>

## `currencyName`

`currencyName` genera nombres, símbolos y códigos monetarios para catálogos.

Contrato tipado de Orionis:

```text
def currencyName() -> str
```

Firma real para `en_US`:

```text
fake.currencyName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currencyName()
```

<a id="faker-currencysymbol"></a>

## `currencySymbol`

`currencySymbol` genera nombres, símbolos y códigos monetarios para catálogos.

Contrato tipado de Orionis:

```text
def currencySymbol(code: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.currencySymbol(code: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `code` | Código de moneda del símbolo solicitado; None permite selección automática. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currencySymbol()
```

<a id="faker-currentcountry"></a>

## `currentCountry`

`currentCountry` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def currentCountry() -> str
```

Firma real para `en_US`:

```text
fake.currentCountry() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currentCountry()
```

<a id="faker-currentcountrycode"></a>

## `currentCountryCode`

`currentCountryCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def currentCountryCode() -> str
```

Firma real para `en_US`:

```text
fake.currentCountryCode() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.currentCountryCode()
```

<a id="faker-date"></a>

## `date`

`date` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def date(pattern: str=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> str
```

Firma real para `en_US`:

```text
fake.date(pattern: str = '%Y-%m-%d', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `pattern` | Patrón de formato aceptado por el proveedor. |
| `end_datetime` | Límite final datetime del intervalo. |
| `thai_digit` | Usa dígitos tailandeses en la representación del proveedor. |
| `buddhist_era` | Usa la era budista para la representación de fecha del proveedor tailandés. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 102 más:

```text
fake.date(pattern: str = '%Y-%m-%d', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> str
```

`th`, `th_TH`:

```text
fake.date(pattern: str = '%-d %b %Y', end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, thai_digit: bool = False, buddhist_era: bool = True) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.date()
```

<a id="faker-datebetween"></a>

## `dateBetween`

`dateBetween` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateBetween(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.dateBetween(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30y', end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = 'today') -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `start_date` | Extremo inicial: fecha/hora, intervalo relativo o formato admitido por el proveedor. |
| `end_date` | Extremo final de fecha/hora o intervalo relativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateBetween()
```

<a id="faker-datebetweendates"></a>

## `dateBetweenDates`

`dateBetweenDates` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateBetweenDates(date_start: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., date_end: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.dateBetweenDates(date_start: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, date_end: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `date_start` | Fecha inicial del intervalo. |
| `date_end` | Fecha final del intervalo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateBetweenDates()
```

<a id="faker-dateobject"></a>

## `dateObject`

`dateObject` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateObject(end_datetime: datetime.datetime | None=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.dateObject(end_datetime: datetime.datetime | None = None) -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `end_datetime` | Límite final datetime del intervalo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateObject()
```

<a id="faker-dateofbirth"></a>

## `dateOfBirth`

`dateOfBirth` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateOfBirth(tzinfo: datetime.tzinfo | None=..., minimum_age: int=..., maximum_age: int=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.dateOfBirth(tzinfo: datetime.tzinfo | None = None, minimum_age: int = 0, maximum_age: int = 115) -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |
| `minimum_age` | Edad mínima para la fecha de nacimiento. |
| `maximum_age` | Edad máxima para la fecha de nacimiento. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateOfBirth()
```

<a id="faker-datethiscentury"></a>

## `dateThisCentury`

`dateThisCentury` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateThisCentury(before_today: bool=..., after_today: bool=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.dateThisCentury(before_today: bool = True, after_today: bool = False) -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `before_today` | Permite fechas anteriores a hoy dentro del periodo. |
| `after_today` | Permite fechas posteriores a hoy dentro del periodo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateThisCentury()
```

<a id="faker-datethisdecade"></a>

## `dateThisDecade`

`dateThisDecade` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateThisDecade(before_today: bool=..., after_today: bool=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.dateThisDecade(before_today: bool = True, after_today: bool = False) -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `before_today` | Permite fechas anteriores a hoy dentro del periodo. |
| `after_today` | Permite fechas posteriores a hoy dentro del periodo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateThisDecade()
```

<a id="faker-datethismonth"></a>

## `dateThisMonth`

`dateThisMonth` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateThisMonth(before_today: bool=..., after_today: bool=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.dateThisMonth(before_today: bool = True, after_today: bool = False) -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `before_today` | Permite fechas anteriores a hoy dentro del periodo. |
| `after_today` | Permite fechas posteriores a hoy dentro del periodo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateThisMonth()
```

<a id="faker-datethisyear"></a>

## `dateThisYear`

`dateThisYear` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateThisYear(before_today: bool=..., after_today: bool=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.dateThisYear(before_today: bool = True, after_today: bool = False) -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `before_today` | Permite fechas anteriores a hoy dentro del periodo. |
| `after_today` | Permite fechas posteriores a hoy dentro del periodo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateThisYear()
```

<a id="faker-datetime"></a>

## `dateTime`

`dateTime` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateTime(tzinfo: datetime.tzinfo | None=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.dateTime(tzinfo: datetime.tzinfo | None = None, end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |
| `end_datetime` | Límite final datetime del intervalo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTime()
```

<a id="faker-datetimead"></a>

## `dateTimeAd`

`dateTimeAd` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateTimeAd(tzinfo: datetime.tzinfo | None=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., start_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.dateTimeAd(tzinfo: datetime.tzinfo | None = None, end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, start_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |
| `end_datetime` | Límite final datetime del intervalo. |
| `start_datetime` | Límite inicial datetime del intervalo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeAd()
```

<a id="faker-datetimebetween"></a>

## `dateTimeBetween`

`dateTimeBetween` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateTimeBetween(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.dateTimeBetween(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30y', end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = 'now', tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `start_date` | Extremo inicial: fecha/hora, intervalo relativo o formato admitido por el proveedor. |
| `end_date` | Extremo final de fecha/hora o intervalo relativo. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeBetween()
```

<a id="faker-datetimebetweendates"></a>

## `dateTimeBetweenDates`

`dateTimeBetweenDates` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateTimeBetweenDates(datetime_start: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., datetime_end: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.dateTimeBetweenDates(datetime_start: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, datetime_end: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `datetime_start` | Datetime inicial del intervalo. |
| `datetime_end` | Datetime final del intervalo. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeBetweenDates()
```

<a id="faker-datetimethiscentury"></a>

## `dateTimeThisCentury`

`dateTimeThisCentury` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateTimeThisCentury(before_now: bool=..., after_now: bool=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.dateTimeThisCentury(before_now: bool = True, after_now: bool = False, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `before_now` | Permite datetimes anteriores al momento actual dentro del periodo. |
| `after_now` | Permite datetimes posteriores al momento actual dentro del periodo. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeThisCentury()
```

<a id="faker-datetimethisdecade"></a>

## `dateTimeThisDecade`

`dateTimeThisDecade` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateTimeThisDecade(before_now: bool=..., after_now: bool=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.dateTimeThisDecade(before_now: bool = True, after_now: bool = False, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `before_now` | Permite datetimes anteriores al momento actual dentro del periodo. |
| `after_now` | Permite datetimes posteriores al momento actual dentro del periodo. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeThisDecade()
```

<a id="faker-datetimethismonth"></a>

## `dateTimeThisMonth`

`dateTimeThisMonth` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateTimeThisMonth(before_now: bool=..., after_now: bool=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.dateTimeThisMonth(before_now: bool = True, after_now: bool = False, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `before_now` | Permite datetimes anteriores al momento actual dentro del periodo. |
| `after_now` | Permite datetimes posteriores al momento actual dentro del periodo. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeThisMonth()
```

<a id="faker-datetimethisyear"></a>

## `dateTimeThisYear`

`dateTimeThisYear` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dateTimeThisYear(before_now: bool=..., after_now: bool=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.dateTimeThisYear(before_now: bool = True, after_now: bool = False, tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `before_now` | Permite datetimes anteriores al momento actual dentro del periodo. |
| `after_now` | Permite datetimes posteriores al momento actual dentro del periodo. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dateTimeThisYear()
```

<a id="faker-dayofmonth"></a>

## `dayOfMonth`

`dayOfMonth` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dayOfMonth() -> str
```

Firma real para `en_US`:

```text
fake.dayOfMonth() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dayOfMonth()
```

<a id="faker-dayofweek"></a>

## `dayOfWeek`

`dayOfWeek` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dayOfWeek() -> str
```

Firma real para `en_US`:

```text
fake.dayOfWeek() -> str
```


Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 80 más:

```text
fake.dayOfWeek() -> str
```

`az_AZ`, `cs_CZ`, `da_DK`, `de`, `de_AT`, `de_DE` y 18 más:

```text
fake.dayOfWeek()
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dayOfWeek()
```

<a id="faker-dayofweekinguj"></a>

## `dayOfWeekInGuj`

`dayOfWeekInGuj` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def dayOfWeekInGuj() -> str
```

Firma real para `gu_IN`:

```text
fake.dayOfWeekInGuj() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `gu_IN`.

```python
fake = SampleFactory(locale="gu_IN", seed=7).fake
value = fake.dayOfWeekInGuj()
```

<a id="faker-delarguments"></a>

## `delArguments`

Borra un argumento o grupo de argumentos del parser. Grupo ausente devuelve None; argumento ausente en un grupo existente puede lanzar KeyError.

Helper accesible por el despacho dinámico de la fachada; no está declarado en `_ProviderMethods`.

Firma real para `en_US`:

```text
fake.delArguments(group: str, argument: str | None = None) -> Any
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
fake.setArguments("small", {"min_value": 1, "max_value": 3})
value = fake.delArguments("small", "max_value")
```

<a id="faker-department"></a>

## `department`

`department` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def department() -> str
```

Firma real para `es_CO`:

```text
fake.department() -> str
```


Variantes reales por locale:

`es_CO`:

```text
fake.department() -> str
```

`fr_FR`:

```text
fake.department() -> Tuple[str, str]
```

Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_CO`, `fr_FR`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.department()
```

<a id="faker-departmentcode"></a>

## `departmentCode`

`departmentCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def departmentCode() -> str
```

Firma real para `es_CO`:

```text
fake.departmentCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.departmentCode()
```

<a id="faker-departmentname"></a>

## `departmentName`

`departmentName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def departmentName() -> str
```

Firma real para `fr_FR`:

```text
fake.departmentName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `fr_FR`.

```python
fake = SampleFactory(locale="fr_FR", seed=7).fake
value = fake.departmentName()
```

<a id="faker-departmentnumber"></a>

## `departmentNumber`

`departmentNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def departmentNumber() -> str
```

Firma real para `fr_FR`:

```text
fake.departmentNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `fr_FR`.

```python
fake = SampleFactory(locale="fr_FR", seed=7).fake
value = fake.departmentNumber()
```

<a id="faker-dga"></a>

## `dga`

`dga` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def dga(year: int | None=..., month: int | None=..., day: int | None=..., tld: str | None=..., length: int | None=...) -> str
```

Firma real para `en_US`:

```text
fake.dga(year: int | None = None, month: int | None = None, day: int | None = None, tld: str | None = None, length: int | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `year` | Año que genera o evalúa este proveedor. |
| `month` | Mes usado por el algoritmo de dominio simulado. |
| `day` | Día usado por el algoritmo de dominio simulado. |
| `tld` | Dominio de nivel superior para el dominio generado. |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dga()
```

<a id="faker-dialingcode"></a>

## `dialingCode`

`dialingCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def dialingCode() -> str
```

Firma real para `de_AT`:

```text
fake.dialingCode() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de_AT`, `de_CH`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.dialingCode()
```

<a id="faker-diplomaticlicenseplate"></a>

## `diplomaticLicensePlate`

`diplomaticLicensePlate` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def diplomaticLicensePlate() -> str
```

Firma real para `uk_UA`:

```text
fake.diplomaticLicensePlate() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.diplomaticLicensePlate()
```

<a id="faker-district"></a>

## `district`

`district` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def district() -> str
```

Firma real para `ar_PS`:

```text
fake.district() -> str
```


Disponibilidad verificada: 4 locales. Ejemplos de locales: `ar_PS`, `az_AZ`, `ne_NP`, `zh_CN`.

```python
fake = SampleFactory(locale="ar_PS", seed=7).fake
value = fake.district()
```

<a id="faker-districtsuffix"></a>

## `districtSuffix`

`districtSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def districtSuffix() -> str
```

Firma real para `az_AZ`:

```text
fake.districtSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.districtSuffix()
```

<a id="faker-distrito"></a>

## `distrito`

`distrito` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def distrito() -> str
```

Firma real para `pt_PT`:

```text
fake.distrito() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.distrito()
```

<a id="faker-dkstreetname"></a>

## `dkStreetName`

`dkStreetName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def dkStreetName() -> str
```

Firma real para `da_DK`:

```text
fake.dkStreetName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `da_DK`.

```python
fake = SampleFactory(locale="da_DK", seed=7).fake
value = fake.dkStreetName()
```

<a id="faker-doi"></a>

## `doi`

`doi` genera identificadores DOI simulados para publicaciones de prueba.

Contrato tipado de Orionis:

```text
def doi() -> str
```

Firma real para `en_US`:

```text
fake.doi() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.doi()
```

<a id="faker-domainname"></a>

## `domainName`

`domainName` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def domainName(levels: int=...) -> str
```

Firma real para `en_US`:

```text
fake.domainName(levels: int = 1) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `levels` | Número de niveles del dominio o hostname. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.domainName()
```

<a id="faker-domainword"></a>

## `domainWord`

`domainWord` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def domainWord() -> str
```

Firma real para `en_US`:

```text
fake.domainWord() -> str
```


Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 103 más:

```text
fake.domainWord() -> str
```

`zh_TW`:

```text
fake.domainWord()
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.domainWord()
```

<a id="faker-dsv"></a>

## `dsv`

Devuelve valores delimitados en texto; dialect y fmtparams se pasan al escritor CSV.

Contrato tipado de Orionis:

```text
def dsv(dialect: str=..., header: Sequence[str] | None=..., data_columns: tuple[str, str]=..., num_rows: int=..., include_row_ids: bool=..., **fmtparams: Any) -> str
```

Firma real para `en_US`:

```text
fake.dsv(dialect: str = 'faker-csv', header: Sequence[str] | None = None, data_columns: Tuple[str, str] = ('{{name}}', '{{address}}'), num_rows: int = 10, include_row_ids: bool = False, **fmtparams: Any) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `dialect` | Dialecto del escritor CSV. |
| `header` | Encabezados de columnas o None para omitirlos. |
| `data_columns` | Definición de estructura, columnas o tokens generadores. |
| `num_rows` | Cantidad de filas de datos serializados. |
| `include_row_ids` | Añade identificador secuencial de fila. |
| `fmtparams` | Opciones adicionales del escritor CSV nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.dsv(num_rows=2)
```
