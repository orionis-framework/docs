---
title: "Faker: proveedores M–P"
description: "Firmas, parámetros, locales y ejemplos de los proveedores M-P."
editUrl: true
lastUpdated: false
---

Esta referencia cubre 151 nombres de la fachada de Faker en el tramo M-P. El conjunto completo contiene **675 métodos tipados** (694 firmas con overloads) y **7 helpers de backend accesibles en runtime**, repartidos alfabéticamente. La disponibilidad se contrastó con los 110 locales del backend instalado; un método puede estar disponible solo en determinados locales.

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


<a id="faker-macaddress"></a>

## `macAddress`

`macAddress` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def macAddress(multicast: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.macAddress(multicast: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `multicast` | Controla el bit multicast de la dirección MAC. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.macAddress()
```

<a id="faker-macplatformtoken"></a>

## `macPlatformToken`

`macPlatformToken` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def macPlatformToken() -> str
```

Firma real para `en_US`:

```text
fake.macPlatformToken() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.macPlatformToken()
```

<a id="faker-macprocessor"></a>

## `macProcessor`

`macProcessor` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def macProcessor() -> str
```

Firma real para `en_US`:

```text
fake.macProcessor() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.macProcessor()
```

<a id="faker-md5"></a>

## `md5`

Digest MD5 de datos aleatorios para fixtures; no sustituye la fachada Hash para contraseñas.

Contrato tipado de Orionis:

```text
def md5() -> str
def md5(raw_output: Literal[True]) -> bytes
def md5(raw_output: Literal[False]) -> str
```

Firma real para `en_US`:

```text
fake.md5(raw_output: bool = False) -> bytes | str
```


| Parámetro | Propósito |
| --- | --- |
| `raw_output` | Solicita la representación binaria/nativa en vez del texto habitual. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.md5()
```

<a id="faker-metromanilaaddress"></a>

## `metroManilaAddress`

`metroManilaAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def metroManilaAddress() -> str
```

Firma real para `en_PH`:

```text
fake.metroManilaAddress() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.metroManilaAddress()
```

<a id="faker-metromanilalgu"></a>

## `metroManilaLgu`

`metroManilaLgu` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def metroManilaLgu() -> str
```

Firma real para `en_PH`:

```text
fake.metroManilaLgu() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.metroManilaLgu()
```

<a id="faker-metromanilapostcode"></a>

## `metroManilaPostcode`

`metroManilaPostcode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def metroManilaPostcode() -> str
```

Firma real para `en_PH`:

```text
fake.metroManilaPostcode() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.metroManilaPostcode()
```

<a id="faker-metropolitancity"></a>

## `metropolitanCity`

`metropolitanCity` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def metropolitanCity() -> str
```

Firma real para `ko_KR`:

```text
fake.metropolitanCity() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.metropolitanCity()
```

<a id="faker-middlename"></a>

## `middleName`

`middleName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def middleName() -> str
```

Firma real para `is_IS`:

```text
fake.middleName() -> str
```


Disponibilidad verificada: 5 locales. Ejemplos de locales: `is_IS`, `or_IN`, `ru_RU`, `uk_UA`, `vi_VN`.

```python
fake = SampleFactory(locale="is_IS", seed=7).fake
value = fake.middleName()
```

<a id="faker-middlenamefemale"></a>

## `middleNameFemale`

`middleNameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def middleNameFemale() -> str
```

Firma real para `ru_RU`:

```text
fake.middleNameFemale() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.middleNameFemale()
```

<a id="faker-middlenamemale"></a>

## `middleNameMale`

`middleNameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def middleNameMale() -> str
```

Firma real para `ru_RU`:

```text
fake.middleNameMale() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.middleNameMale()
```

<a id="faker-militaryapo"></a>

## `militaryApo`

`militaryApo` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def militaryApo() -> str
```

Firma real para `en_US`:

```text
fake.militaryApo() -> str
```


Disponibilidad verificada: 45 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.militaryApo()
```

<a id="faker-militarydpo"></a>

## `militaryDpo`

`militaryDpo` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def militaryDpo() -> str
```

Firma real para `en_US`:

```text
fake.militaryDpo() -> str
```


Disponibilidad verificada: 45 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.militaryDpo()
```

<a id="faker-militaryship"></a>

## `militaryShip`

`militaryShip` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def militaryShip() -> str
```

Firma real para `en_US`:

```text
fake.militaryShip() -> str
```


Disponibilidad verificada: 45 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.militaryShip()
```

<a id="faker-militarystate"></a>

## `militaryState`

`militaryState` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def militaryState() -> str
```

Firma real para `en_US`:

```text
fake.militaryState() -> str
```


Disponibilidad verificada: 45 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.militaryState()
```

<a id="faker-mimetype"></a>

## `mimeType`

`mimeType` genera nombres, rutas y tipos de archivo ficticios; no crea archivos en disco.

Contrato tipado de Orionis:

```text
def mimeType(category: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.mimeType(category: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `category` | Categoría de datos del proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.mimeType()
```

<a id="faker-mindanaoprovince"></a>

## `mindanaoProvince`

`mindanaoProvince` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def mindanaoProvince() -> str
```

Firma real para `en_PH`:

```text
fake.mindanaoProvince() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mindanaoProvince()
```

<a id="faker-mindanaoprovinceaddress"></a>

## `mindanaoProvinceAddress`

`mindanaoProvinceAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def mindanaoProvinceAddress() -> str
```

Firma real para `en_PH`:

```text
fake.mindanaoProvinceAddress() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mindanaoProvinceAddress()
```

<a id="faker-mindanaoprovincepostcode"></a>

## `mindanaoProvincePostcode`

`mindanaoProvincePostcode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def mindanaoProvincePostcode() -> str
```

Firma real para `en_PH`:

```text
fake.mindanaoProvincePostcode() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mindanaoProvincePostcode()
```

<a id="faker-minguoyear"></a>

## `minguoYear`

`minguoYear` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def minguoYear() -> str
```

Firma real para `zh_TW`:

```text
fake.minguoYear() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `zh_TW`.

```python
fake = SampleFactory(locale="zh_TW", seed=7).fake
value = fake.minguoYear()
```

<a id="faker-miscarea2landlinenumber"></a>

## `miscArea2LandlineNumber`

`miscArea2LandlineNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def miscArea2LandlineNumber() -> str
```

Firma real para `en_PH`:

```text
fake.miscArea2LandlineNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.miscArea2LandlineNumber()
```

<a id="faker-misclandlineidentifier"></a>

## `miscLandlineIdentifier`

`miscLandlineIdentifier` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def miscLandlineIdentifier() -> str
```

Firma real para `en_PH`:

```text
fake.miscLandlineIdentifier() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.miscLandlineIdentifier()
```

<a id="faker-mobilenumber"></a>

## `mobileNumber`

`mobileNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def mobileNumber() -> str
```

Firma real para `en_PH`:

```text
fake.mobileNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mobileNumber()
```

<a id="faker-mobileoperator"></a>

## `mobileOperator`

`mobileOperator` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def mobileOperator() -> str
```

Firma real para `ar_DZ`:

```text
fake.mobileOperator() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ar_DZ`, `fr_DZ`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.mobileOperator()
```

<a id="faker-month"></a>

## `month`

`month` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def month() -> str
```

Firma real para `en_US`:

```text
fake.month() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.month()
```

<a id="faker-monthinguj"></a>

## `monthInGuj`

`monthInGuj` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def monthInGuj() -> str
```

Firma real para `gu_IN`:

```text
fake.monthInGuj() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `gu_IN`.

```python
fake = SampleFactory(locale="gu_IN", seed=7).fake
value = fake.monthInGuj()
```

<a id="faker-monthname"></a>

## `monthName`

`monthName` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def monthName() -> str
```

Firma real para `en_US`:

```text
fake.monthName() -> str
```


Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 80 más:

```text
fake.monthName() -> str
```

`az_AZ`, `cs_CZ`, `da_DK`, `de`, `de_AT`, `de_DE` y 18 más:

```text
fake.monthName()
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.monthName()
```

<a id="faker-monthnameinguj"></a>

## `monthNameInGuj`

`monthNameInGuj` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def monthNameInGuj() -> str
```

Firma real para `gu_IN`:

```text
fake.monthNameInGuj() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `gu_IN`.

```python
fake = SampleFactory(locale="gu_IN", seed=7).fake
value = fake.monthNameInGuj()
```

<a id="faker-motorcyclelicenseplate"></a>

## `motorcycleLicensePlate`

`motorcycleLicensePlate` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def motorcycleLicensePlate() -> str
```

Firma real para `en_PH`:

```text
fake.motorcycleLicensePlate() -> str
```


Disponibilidad verificada: 4 locales. Ejemplos de locales: `en_PH`, `es_MX`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.motorcycleLicensePlate()
```

<a id="faker-motorcyclelicenseplatecdmx"></a>

## `motorcycleLicensePlateCdmx`

`motorcycleLicensePlateCdmx` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def motorcycleLicensePlateCdmx() -> str
```

Firma real para `es_MX`:

```text
fake.motorcycleLicensePlateCdmx() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.motorcycleLicensePlateCdmx()
```

<a id="faker-motorcyclelicenseplatenational"></a>

## `motorcycleLicensePlateNational`

`motorcycleLicensePlateNational` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def motorcycleLicensePlateNational() -> str
```

Firma real para `es_MX`:

```text
fake.motorcycleLicensePlateNational() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.motorcycleLicensePlateNational()
```

<a id="faker-mountainname"></a>

## `mountainName`

`mountainName` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def mountainName() -> str
```

Firma real para `en_PH`:

```text
fake.mountainName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.mountainName()
```

<a id="faker-msisdn"></a>

## `msisdn`

`msisdn` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def msisdn() -> str
```

Firma real para `en_US`:

```text
fake.msisdn() -> str
```


Disponibilidad verificada: 107 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.msisdn()
```

<a id="faker-municipality"></a>

## `municipality`

`municipality` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def municipality() -> str
```

Firma real para `es_CO`:

```text
fake.municipality() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_CO`, `es_AR`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.municipality()
```

<a id="faker-municipalitycode"></a>

## `municipalityCode`

`municipalityCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def municipalityCode() -> str
```

Firma real para `es_CO`:

```text
fake.municipalityCode() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_CO`, `es_AR`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.municipalityCode()
```

<a id="faker-name"></a>

## `name`

`name` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def name() -> str
```

Firma real para `en_US`:

```text
fake.name() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.name()
```

<a id="faker-namefemale"></a>

## `nameFemale`

`nameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def nameFemale() -> str
```

Firma real para `en_US`:

```text
fake.nameFemale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nameFemale()
```

<a id="faker-namemale"></a>

## `nameMale`

`nameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def nameMale() -> str
```

Firma real para `en_US`:

```text
fake.nameMale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nameMale()
```

<a id="faker-namenonbinary"></a>

## `nameNonbinary`

`nameNonbinary` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def nameNonbinary() -> str
```

Firma real para `en_US`:

```text
fake.nameNonbinary() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nameNonbinary()
```

<a id="faker-nationality"></a>

## `nationality`

`nationality` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def nationality() -> str
```

Firma real para `pt_PT`:

```text
fake.nationality() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.nationality()
```

<a id="faker-naturalpersonnit"></a>

## `naturalPersonNit`

`naturalPersonNit` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def naturalPersonNit() -> str
```

Firma real para `es_CO`:

```text
fake.naturalPersonNit() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.naturalPersonNit()
```

<a id="faker-naturalpersonnitwithcheckdigit"></a>

## `naturalPersonNitWithCheckDigit`

`naturalPersonNitWithCheckDigit` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def naturalPersonNitWithCheckDigit() -> str
```

Firma real para `es_CO`:

```text
fake.naturalPersonNitWithCheckDigit() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.naturalPersonNitWithCheckDigit()
```

<a id="faker-neighborhood"></a>

## `neighborhood`

`neighborhood` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def neighborhood() -> str
```

Firma real para `pt_BR`:

```text
fake.neighborhood() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.neighborhood()
```

<a id="faker-nichandle"></a>

## `nicHandle`

`nicHandle` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def nicHandle(suffix: str=...) -> str
```

Firma real para `en_US`:

```text
fake.nicHandle(suffix: str = 'FAKE') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `suffix` | Sufijo de la cadena generada. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nicHandle()
```

<a id="faker-nichandles"></a>

## `nicHandles`

`nicHandles` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def nicHandles(count: int=..., suffix: str=...) -> list[str]
```

Firma real para `en_US`:

```text
fake.nicHandles(count: int = 1, suffix: str = '????') -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `count` | Cantidad de elementos o estructuras que produce el proveedor. |
| `suffix` | Sufijo de la cadena generada. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nicHandles()
```

<a id="faker-nie"></a>

## `nie`

`nie` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def nie() -> str
```

Firma real para `es_ES`:

```text
fake.nie() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `es_ES`, `es`, `es_CA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.nie()
```

<a id="faker-nif"></a>

## `nif`

`nif` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def nif() -> str
```

Firma real para `es_ES`:

```text
fake.nif() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `es_ES`, `es`, `es_CA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.nif()
```

<a id="faker-nip"></a>

## `nip`

`nip` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def nip() -> str
```

Firma real para `pl_PL`:

```text
fake.nip() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.nip()
```

<a id="faker-nonarea2landlineareacode"></a>

## `nonArea2LandlineAreaCode`

`nonArea2LandlineAreaCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def nonArea2LandlineAreaCode() -> str
```

Firma real para `en_PH`:

```text
fake.nonArea2LandlineAreaCode() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.nonArea2LandlineAreaCode()
```

<a id="faker-nonarea2landlinenumber"></a>

## `nonArea2LandlineNumber`

`nonArea2LandlineNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def nonArea2LandlineNumber() -> str
```

Firma real para `en_PH`:

```text
fake.nonArea2LandlineNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.nonArea2LandlineNumber()
```

<a id="faker-nonprofitprefix"></a>

## `nonprofitPrefix`

`nonprofitPrefix` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def nonprofitPrefix() -> str
```

Firma real para `th_TH`:

```text
fake.nonprofitPrefix() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `th`, `th_TH`.

```python
fake = SampleFactory(locale="th_TH", seed=7).fake
value = fake.nonprofitPrefix()
```

<a id="faker-nuip"></a>

## `nuip`

`nuip` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def nuip() -> str
```

Firma real para `es_CO`:

```text
fake.nuip() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.nuip()
```

<a id="faker-nullboolean"></a>

## `nullBoolean`

`nullBoolean` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def nullBoolean() -> bool | None
```

Firma real para `en_US`:

```text
fake.nullBoolean() -> bool | None
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.nullBoolean()
```

<a id="faker-numberedstreet"></a>

## `numberedStreet`

`numberedStreet` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def numberedStreet() -> str
```

Firma real para `vi_VN`:

```text
fake.numberedStreet() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.numberedStreet()
```

<a id="faker-numerify"></a>

## `numerify`

Sustituye marcadores numéricos de `text`; cada marcador tiene su regla en el proveedor nativo.

Contrato tipado de Orionis:

```text
def numerify(text: str=...) -> str
```

Firma real para `en_US`:

```text
fake.numerify(text: str = '###') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `text` | Plantilla o texto que procesará el proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.numerify()
```

<a id="faker-nuss"></a>

## `nuss`

`nuss` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def nuss(company: bool=...) -> str
```

Firma real para `es_ES`:

```text
fake.nuss(company: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `company` | Genera NUSS de empresa cuando está activo. |

Disponibilidad verificada: 3 locales. Ejemplos de locales: `es_ES`, `es`, `es_CA`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.nuss()
```

<a id="faker-oldpostalcode"></a>

## `oldPostalCode`

`oldPostalCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def oldPostalCode() -> str
```

Firma real para `ko_KR`:

```text
fake.oldPostalCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.oldPostalCode()
```

<a id="faker-opera"></a>

## `opera`

`opera` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def opera() -> str
```

Firma real para `en_US`:

```text
fake.opera() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.opera()
```

<a id="faker-operatorid"></a>

## `operatorId`

`operatorId` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def operatorId() -> str
```

Firma real para `ar_JO`:

```text
fake.operatorId() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ar_JO`.

```python
fake = SampleFactory(locale="ar_JO", seed=7).fake
value = fake.operatorId()
```

<a id="faker-ordinalfloornumber"></a>

## `ordinalFloorNumber`

`ordinalFloorNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def ordinalFloorNumber() -> str
```

Firma real para `en_PH`:

```text
fake.ordinalFloorNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.ordinalFloorNumber()
```

<a id="faker-ordinalstreetnumber"></a>

## `ordinalStreetNumber`

`ordinalStreetNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def ordinalStreetNumber() -> str
```

Firma real para `en_PH`:

```text
fake.ordinalStreetNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.ordinalStreetNumber()
```

<a id="faker-organdvatid"></a>

## `orgAndVatId`

`orgAndVatId` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def orgAndVatId(long: bool=..., dash: bool=...) -> tuple[str, str]
```

Firma real para `sv_SE`:

```text
fake.orgAndVatId(long: bool = False, dash: bool = True) -> Tuple[str, str]
```


| Parámetro | Propósito |
| --- | --- |
| `long` | Solicita la variante larga del identificador local. |
| `dash` | Incluye guion en la representación del identificador. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `sv_SE`.

```python
fake = SampleFactory(locale="sv_SE", seed=7).fake
value = fake.orgAndVatId()
```

<a id="faker-orgid"></a>

## `orgId`

`orgId` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def orgId(long: bool=..., dash: bool=...) -> str
```

Firma real para `sv_SE`:

```text
fake.orgId(long: bool = False, dash: bool = True) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `long` | Solicita la variante larga del identificador local. |
| `dash` | Incluye guion en la representación del identificador. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `sv_SE`.

```python
fake = SampleFactory(locale="sv_SE", seed=7).fake
value = fake.orgId()
```

<a id="faker-pagibig"></a>

## `pagibig`

`pagibig` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def pagibig() -> str
```

Firma real para `en_PH`:

```text
fake.pagibig() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.pagibig()
```

<a id="faker-pan"></a>

## `pan`

`pan` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def pan() -> str
```

Firma real para `en_IN`:

```text
fake.pan() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.pan()
```

<a id="faker-paragraph"></a>

## `paragraph`

`paragraph` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def paragraph(nb_sentences: int=..., variable_nb_sentences: bool=..., ext_word_list: Sequence[str] | None=...) -> str
```

Firma real para `en_US`:

```text
fake.paragraph(nb_sentences: int = 3, variable_nb_sentences: bool = True, ext_word_list: Sequence[str] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `nb_sentences` | Número objetivo de oraciones. |
| `variable_nb_sentences` | Permite variar el número objetivo de oraciones. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.paragraph()
```

<a id="faker-paragraphs"></a>

## `paragraphs`

`paragraphs` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def paragraphs(nb: int=..., ext_word_list: Sequence[str] | None=...) -> list[str]
```

Firma real para `en_US`:

```text
fake.paragraphs(nb: int = 3, ext_word_list: Sequence[str] | None = None) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `nb` | Cantidad de resultados solicitados. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.paragraphs()
```

<a id="faker-parse"></a>

## `parse`

Sustituye tokens {{proveedor}} y grupos {{proveedor:grupo}}. Dentro de los tokens se usan nombres NATIVOS del backend, como first_name; el método Python de la fachada sigue siendo camelCase. Un token inexistente produce AttributeError.

Helper accesible por el despacho dinámico de la fachada; no está declarado en `_ProviderMethods`.

Firma real para `en_US`:

```text
fake.parse(text: str) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
fake.setArguments("small", {"min_value": 1, "max_value": 3})
value = fake.parse("{{first_name}} / {{pyint:small}}")
```

<a id="faker-partitionedbuildingnumber"></a>

## `partitionedBuildingNumber`

`partitionedBuildingNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def partitionedBuildingNumber() -> str
```

Firma real para `en_PH`:

```text
fake.partitionedBuildingNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.partitionedBuildingNumber()
```

<a id="faker-passportdates"></a>

## `passportDates`

`passportDates` genera formatos de pasaporte ficticios para fixtures; no documentos válidos de viaje.

Contrato tipado de Orionis:

```text
def passportDates(birthday: datetime.date=...) -> tuple[str, str, str]
```

Firma real para `en_US`:

```text
fake.passportDates(birthday: datetime.date = datetime.date(2026, 10, 22)) -> Tuple[str, str, str]
```


| Parámetro | Propósito |
| --- | --- |
| `birthday` | Fecha de nacimiento de referencia para el pasaporte. |

Disponibilidad verificada: 106 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportDates()
```

<a id="faker-passportdob"></a>

## `passportDob`

`passportDob` genera formatos de pasaporte ficticios para fixtures; no documentos válidos de viaje.

Contrato tipado de Orionis:

```text
def passportDob() -> datetime.date
```

Firma real para `en_US`:

```text
fake.passportDob() -> datetime.date
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportDob()
```

<a id="faker-passportfull"></a>

## `passportFull`

`passportFull` genera formatos de pasaporte ficticios para fixtures; no documentos válidos de viaje.

Contrato tipado de Orionis:

```text
def passportFull() -> str
```

Firma real para `en_US`:

```text
fake.passportFull() -> str
```


Disponibilidad verificada: 106 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportFull()
```

<a id="faker-passportgender"></a>

## `passportGender`

`passportGender` genera formatos de pasaporte ficticios para fixtures; no documentos válidos de viaje.

Contrato tipado de Orionis:

```text
def passportGender(seed: int=...) -> Literal['M', 'F', 'X']
```

Firma real para `en_US`:

```text
fake.passportGender(seed: int = 0) -> Literal['M', 'F', 'X']
```


| Parámetro | Propósito |
| --- | --- |
| `seed` | Semilla específica aceptada por este proveedor. |

Disponibilidad verificada: 106 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportGender()
```

<a id="faker-passportnumber"></a>

## `passportNumber`

`passportNumber` genera formatos de pasaporte ficticios para fixtures; no documentos válidos de viaje.

Contrato tipado de Orionis:

```text
def passportNumber() -> str
```

Firma real para `en_US`:

```text
fake.passportNumber() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportNumber()
```

<a id="faker-passportowner"></a>

## `passportOwner`

`passportOwner` genera formatos de pasaporte ficticios para fixtures; no documentos válidos de viaje.

Contrato tipado de Orionis:

```text
def passportOwner(gender: Literal['M', 'F', 'X']=...) -> tuple[str, str]
```

Firma real para `en_US`:

```text
fake.passportOwner(gender: Literal['M', 'F', 'X'] = 'X') -> Tuple[str, str]
```


| Parámetro | Propósito |
| --- | --- |
| `gender` | Selección de género según los valores locales admitidos. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 103 más:

```text
fake.passportOwner(gender: Literal['M', 'F', 'X'] = 'X') -> Tuple[str, str]
```

`ru_RU`:

```text
fake.passportOwner(gender: Literal['M', 'F', 'X'] = 'M') -> Tuple[str, str]
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.passportOwner()
```

<a id="faker-password"></a>

## `password`

Genera una contraseña ficticia con clases de caracteres configurables para fixtures; no calcula un hash de autenticación.

Contrato tipado de Orionis:

```text
def password(length: int=..., special_chars: bool=..., digits: bool=..., upper_case: bool=..., lower_case: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.password(length: int = 10, special_chars: bool = True, digits: bool = True, upper_case: bool = True, lower_case: bool = True) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |
| `special_chars` | Incluye caracteres especiales en la contraseña ficticia. |
| `digits` | Número de dígitos del resultado. |
| `upper_case` | Incluye letras mayúsculas entre los caracteres de contraseña. |
| `lower_case` | Incluye letras minúsculas entre los caracteres de contraseña. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.password(length=16)
```

<a id="faker-pastdate"></a>

## `pastDate`

`pastDate` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def pastDate(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., tzinfo: datetime.tzinfo | None=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.pastDate(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30d', tzinfo: datetime.tzinfo | None = None) -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `start_date` | Extremo inicial: fecha/hora, intervalo relativo o formato admitido por el proveedor. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pastDate()
```

<a id="faker-pastdatetime"></a>

## `pastDatetime`

`pastDatetime` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def pastDatetime(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.pastDatetime(start_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '-30d', tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `start_date` | Extremo inicial: fecha/hora, intervalo relativo o formato admitido por el proveedor. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pastDatetime()
```

<a id="faker-personrut"></a>

## `personRut`

`personRut` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def personRut() -> str
```

Firma real para `es_CL`:

```text
fake.personRut() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.personRut()
```

<a id="faker-pesel"></a>

## `pesel`

`pesel` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def pesel(date_of_birth: datetime.datetime | None=..., sex: str | None=...) -> str
```

Firma real para `pl_PL`:

```text
fake.pesel(date_of_birth: datetime.datetime | None = None, sex: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `date_of_birth` | Fecha de nacimiento usada para construir el identificador. |
| `sex` | Selección de sexo según los valores locales admitidos. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.pesel()
```

<a id="faker-peselcomputecheckdigit"></a>

## `peselComputeCheckDigit`

Calcula el dígito de control PESEL a partir de la cadena de dígitos inicial; no genera el identificador completo.

Contrato tipado de Orionis:

```text
def peselComputeCheckDigit(pesel: str) -> int
```

Firma real para `pl_PL`:

```text
fake.peselComputeCheckDigit(pesel: str) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `pesel` | Dígitos iniciales PESEL para calcular su control. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.peselComputeCheckDigit(pesel="4405140145")
```

<a id="faker-philhealth"></a>

## `philhealth`

`philhealth` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def philhealth() -> str
```

Firma real para `en_PH`:

```text
fake.philhealth() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.philhealth()
```

<a id="faker-phonenumber"></a>

## `phoneNumber`

`phoneNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def phoneNumber() -> str
```

Firma real para `en_US`:

```text
fake.phoneNumber() -> str
```


Disponibilidad verificada: 107 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.phoneNumber()
```

<a id="faker-phonenumberprefix"></a>

## `phonenumberPrefix`

`phonenumberPrefix` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def phonenumberPrefix() -> int
```

Firma real para `zh_CN`:

```text
fake.phonenumberPrefix() -> int
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `zh_CN`.

```python
fake = SampleFactory(locale="zh_CN", seed=7).fake
value = fake.phonenumberPrefix()
```

<a id="faker-pincodeinarmy"></a>

## `pincodeInArmy`

`pincodeInArmy` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def pincodeInArmy() -> int
```

Firma real para `en_IN`:

```text
fake.pincodeInArmy() -> int
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.pincodeInArmy()
```

<a id="faker-pincodeinmilitary"></a>

## `pincodeInMilitary`

`pincodeInMilitary` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def pincodeInMilitary() -> int
```

Firma real para `en_IN`:

```text
fake.pincodeInMilitary() -> int
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.pincodeInMilitary()
```

<a id="faker-pincodeinstate"></a>

## `pincodeInState`

`pincodeInState` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def pincodeInState(state_abbr: str | None=..., include_union_territories: bool=...) -> int
```

Firma real para `en_IN`:

```text
fake.pincodeInState(state_abbr: str | None = None, include_union_territories: bool = False) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `state_abbr` | Abreviatura del estado para restringir el resultado local. |
| `include_union_territories` | Incluye territorios de la Unión en códigos postales de India. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.pincodeInState()
```

<a id="faker-placename"></a>

## `placeName`

`placeName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def placeName() -> str
```

Firma real para `pt_PT`:

```text
fake.placeName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.placeName()
```

<a id="faker-plantname"></a>

## `plantName`

`plantName` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def plantName() -> str
```

Firma real para `en_PH`:

```text
fake.plantName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.plantName()
```

<a id="faker-plantstreetname"></a>

## `plantStreetName`

`plantStreetName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def plantStreetName() -> str
```

Firma real para `es_CL`:

```text
fake.plantStreetName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.plantStreetName()
```

<a id="faker-plateletter"></a>

## `plateLetter`

`plateLetter` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def plateLetter() -> str
```

Firma real para `ru_RU`:

```text
fake.plateLetter() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateLetter()
```

<a id="faker-plateletterprefix"></a>

## `plateLetterPrefix`

`plateLetterPrefix` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def plateLetterPrefix(region_name: str | None=...) -> str
```

Firma real para `uk_UA`:

```text
fake.plateLetterPrefix(region_name: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `region_name` | Nombre de la región usado para formar la matrícula local. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.plateLetterPrefix()
```

<a id="faker-platelettersuffix"></a>

## `plateLetterSuffix`

`plateLetterSuffix` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def plateLetterSuffix() -> str
```

Firma real para `uk_UA`:

```text
fake.plateLetterSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.plateLetterSuffix()
```

<a id="faker-platenumber"></a>

## `plateNumber`

`plateNumber` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def plateNumber() -> str
```

Firma real para `ru_RU`:

```text
fake.plateNumber() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateNumber()
```

<a id="faker-platenumberextra"></a>

## `plateNumberExtra`

`plateNumberExtra` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def plateNumberExtra() -> str
```

Firma real para `ru_RU`:

```text
fake.plateNumberExtra() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateNumberExtra()
```

<a id="faker-platenumberspecial"></a>

## `plateNumberSpecial`

`plateNumberSpecial` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def plateNumberSpecial() -> str
```

Firma real para `ru_RU`:

```text
fake.plateNumberSpecial() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateNumberSpecial()
```

<a id="faker-plateregioncode"></a>

## `plateRegionCode`

`plateRegionCode` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def plateRegionCode(region_name: str | None=...) -> str
```

Firma real para `uk_UA`:

```text
fake.plateRegionCode(region_name: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `region_name` | Nombre de la región usado para formar la matrícula local. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.plateRegionCode()
```

<a id="faker-platesuffix"></a>

## `plateSuffix`

`plateSuffix` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def plateSuffix() -> str
```

Firma real para `ru_RU`:

```text
fake.plateSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.plateSuffix()
```

<a id="faker-pldtarea2landlinenumber"></a>

## `pldtArea2LandlineNumber`

`pldtArea2LandlineNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def pldtArea2LandlineNumber() -> str
```

Firma real para `en_PH`:

```text
fake.pldtArea2LandlineNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.pldtArea2LandlineNumber()
```

<a id="faker-policeid"></a>

## `policeId`

`policeId` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def policeId() -> str
```

Firma real para `el_GR`:

```text
fake.policeId() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `el_GR`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.policeId()
```

<a id="faker-portnumber"></a>

## `portNumber`

`portNumber` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def portNumber(is_system: bool=..., is_user: bool=..., is_dynamic: bool=...) -> int
```

Firma real para `en_US`:

```text
fake.portNumber(is_system: bool = False, is_user: bool = False, is_dynamic: bool = False) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `is_system` | Selecciona puertos de sistema o bien conocidos. |
| `is_user` | Selecciona puertos de usuario o registrados. |
| `is_dynamic` | Selecciona puertos dinámicos/privados/efímeros. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.portNumber()
```

<a id="faker-postal-code"></a>

## `postalCode`

`postalCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postalCode() -> str
```

Firma real para `ko_KR`:

```text
fake.postalCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.postalCode()
```

<a id="faker-postalcodeletter"></a>

## `postalCodeLetter`

`postalCodeLetter` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postalCodeLetter() -> str
```

Firma real para `en_CA`:

```text
fake.postalCodeLetter() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `en_CA`, `fr_CA`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.postalCodeLetter()
```

<a id="faker-postalcode"></a>

## `postalcode`

`postalcode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postalcode() -> str
```

Firma real para `en_US`:

```text
fake.postalcode() -> str
```


Disponibilidad verificada: 49 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postalcode()
```

<a id="faker-postalcodeinprovince"></a>

## `postalcodeInProvince`

`postalcodeInProvince` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postalcodeInProvince(province_abbr: str | None=...) -> str
```

Firma real para `en_CA`:

```text
fake.postalcodeInProvince(province_abbr: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `province_abbr` | Abreviatura de provincia admitida por el locale. |

Disponibilidad verificada: 2 locales. Ejemplos de locales: `en_CA`, `fr_CA`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.postalcodeInProvince()
```

<a id="faker-postalcodeinstate"></a>

## `postalcodeInState`

`postalcodeInState` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postalcodeInState(state_abbr: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.postalcodeInState(state_abbr: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `state_abbr` | Abreviatura del estado para restringir el resultado local. |

Disponibilidad verificada: 45 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postalcodeInState()
```

<a id="faker-postalcodeplus4"></a>

## `postalcodePlus4`

`postalcodePlus4` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postalcodePlus4() -> str
```

Firma real para `en_US`:

```text
fake.postalcodePlus4() -> str
```


Disponibilidad verificada: 45 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postalcodePlus4()
```

<a id="faker-postcode"></a>

## `postcode`

`postcode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postcode() -> str
```

Firma real para `en_US`:

```text
fake.postcode() -> str
```


| Parámetro | Propósito |
| --- | --- |
| `formatted` | Controla el formato de presentación del código postal en el locale que lo soporta. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 103 más:

```text
fake.postcode() -> str
```

`pt_BR`:

```text
fake.postcode(formatted: bool = True) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postcode()
```

<a id="faker-postcodecityprovince"></a>

## `postcodeCityProvince`

`postcodeCityProvince` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postcodeCityProvince() -> str
```

Firma real para `it_IT`:

```text
fake.postcodeCityProvince() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `it_IT`.

```python
fake = SampleFactory(locale="it_IT", seed=7).fake
value = fake.postcodeCityProvince()
```

<a id="faker-postcodeinarmy"></a>

## `postcodeInArmy`

`postcodeInArmy` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postcodeInArmy() -> int
```

Firma real para `en_IN`:

```text
fake.postcodeInArmy() -> int
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.postcodeInArmy()
```

<a id="faker-postcodeinmilitary"></a>

## `postcodeInMilitary`

`postcodeInMilitary` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postcodeInMilitary() -> int
```

Firma real para `en_IN`:

```text
fake.postcodeInMilitary() -> int
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.postcodeInMilitary()
```

<a id="faker-postcodeinprovince"></a>

## `postcodeInProvince`

`postcodeInProvince` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postcodeInProvince(province_abbr: str | None=...) -> str
```

Firma real para `en_CA`:

```text
fake.postcodeInProvince(province_abbr: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `province_abbr` | Abreviatura de provincia admitida por el locale. |

Disponibilidad verificada: 2 locales. Ejemplos de locales: `en_CA`, `fr_CA`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.postcodeInProvince()
```

<a id="faker-postcodeinstate"></a>

## `postcodeInState`

`postcodeInState` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def postcodeInState(state_abbr: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.postcodeInState(state_abbr: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `state_abbr` | Abreviatura del estado para restringir el resultado local. |
| `include_union_territories` | Incluye territorios de la Unión en códigos postales de India. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG` y 42 más:

```text
fake.postcodeInState(state_abbr: str | None = None) -> str
```

`en_IN`:

```text
fake.postcodeInState(state_abbr: str | None = None, include_union_territories: bool = False) -> int
```

Disponibilidad verificada: 49 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.postcodeInState()
```

<a id="faker-prefecture"></a>

## `prefecture`

`prefecture` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def prefecture() -> str
```

Firma real para `ja_JP`:

```text
fake.prefecture() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.prefecture()
```

<a id="faker-prefix"></a>

## `prefix`

`prefix` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def prefix() -> str
```

Firma real para `en_US`:

```text
fake.prefix() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.prefix()
```

<a id="faker-prefixfemale"></a>

## `prefixFemale`

`prefixFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def prefixFemale() -> str
```

Firma real para `en_US`:

```text
fake.prefixFemale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.prefixFemale()
```

<a id="faker-prefixmale"></a>

## `prefixMale`

`prefixMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def prefixMale() -> str
```

Firma real para `en_US`:

```text
fake.prefixMale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.prefixMale()
```

<a id="faker-prefixnonbinary"></a>

## `prefixNonbinary`

`prefixNonbinary` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def prefixNonbinary() -> str
```

Firma real para `en_US`:

```text
fake.prefixNonbinary() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.prefixNonbinary()
```

<a id="faker-pricetag"></a>

## `pricetag`

`pricetag` genera nombres, símbolos y códigos monetarios para catálogos.

Contrato tipado de Orionis:

```text
def pricetag() -> str
```

Firma real para `en_US`:

```text
fake.pricetag() -> str
```


Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 95 más:

```text
fake.pricetag() -> str
```

`az_AZ`, `da_DK`, `de`, `de_CH`, `de_DE`, `en_CA` y 3 más:

```text
fake.pricetag()
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pricetag()
```

<a id="faker-profile"></a>

## `profile`

`profile` genera perfiles compuestos para fixtures.

Contrato tipado de Orionis:

```text
def profile(fields: list[str] | None=..., sex: Literal['M', 'F', 'X'] | None=...) -> dict[str, str | tuple[Decimal, Decimal] | list[str] | datetime.date]
```

Firma real para `en_US`:

```text
fake.profile(fields: List[str] | None = None, sex: Literal['M', 'F', 'X'] | None = None) -> Dict[str, str | Tuple[decimal.Decimal, decimal.Decimal] | List[str] | datetime.date]
```


| Parámetro | Propósito |
| --- | --- |
| `fields` | Nombres de campos que se incluirán en el perfil. |
| `sex` | Selección de sexo según los valores locales admitidos. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.profile()
```

<a id="faker-protocollicenseplate"></a>

## `protocolLicensePlate`

`protocolLicensePlate` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def protocolLicensePlate() -> str
```

Firma real para `en_PH`:

```text
fake.protocolLicensePlate() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.protocolLicensePlate()
```

<a id="faker-provider"></a>

## `provider`

Busca un proveedor por su identificador __provider__, sin distinguir mayúsculas, o devuelve None. Recibir un objeto nativo no lo registra ni añade métodos.

Helper accesible por el despacho dinámico de la fachada; no está declarado en `_ProviderMethods`.

Firma real para `en_US`:

```text
fake.provider(name: str) -> ForwardRef('BaseProvider') | None
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.provider("person")
```

<a id="faker-providercode"></a>

## `providerCode`

`providerCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def providerCode() -> str
```

Firma real para `ar_PS`:

```text
fake.providerCode() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ar_PS`, `az_AZ`.

```python
fake = SampleFactory(locale="ar_PS", seed=7).fake
value = fake.providerCode()
```

<a id="faker-province"></a>

## `province`

`province` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def province() -> str
```

Firma real para `en_CA`:

```text
fake.province() -> str
```


Variantes reales por locale:

`en_CA`, `en_PH`, `es_AR`, `es_CL`, `fil_PH`, `fr_CA` y 9 más:

```text
fake.province() -> str
```

`vi_VN`:

```text
fake.province()
```

Disponibilidad verificada: 16 locales. Ejemplos de locales: `en_CA`, `en_PH`, `es_AR`, `es_CL`, `fil_PH`, `fr_CA`, `ko_KR`, `ne_NP`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.province()
```

<a id="faker-provinceabbr"></a>

## `provinceAbbr`

`provinceAbbr` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def provinceAbbr() -> str
```

Firma real para `en_CA`:

```text
fake.provinceAbbr() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `en_CA`, `fr_CA`.

```python
fake = SampleFactory(locale="en_CA", seed=7).fake
value = fake.provinceAbbr()
```

<a id="faker-provincecode"></a>

## `provinceCode`

`provinceCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def provinceCode() -> str
```

Firma real para `es_CL`:

```text
fake.provinceCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.provinceCode()
```

<a id="faker-provincelgu"></a>

## `provinceLgu`

`provinceLgu` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def provinceLgu() -> str
```

Firma real para `en_PH`:

```text
fake.provinceLgu() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.provinceLgu()
```

<a id="faker-provincename"></a>

## `provinceName`

`provinceName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def provinceName() -> str
```

Firma real para `vi_VN`:

```text
fake.provinceName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.provinceName()
```

<a id="faker-provinceprefix"></a>

## `provincePrefix`

`provincePrefix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def provincePrefix() -> str
```

Firma real para `vi_VN`:

```text
fake.provincePrefix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.provincePrefix()
```

<a id="faker-provincescode"></a>

## `provincesCode`

`provincesCode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def provincesCode() -> str
```

Firma real para `es_AR`:

```text
fake.provincesCode() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.provincesCode()
```

<a id="faker-psv"></a>

## `psv`

`psv` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def psv(header: Sequence[str] | None=..., data_columns: tuple[str, str]=..., num_rows: int=..., include_row_ids: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.psv(header: Sequence[str] | None = None, data_columns: Tuple[str, str] = ('{{name}}', '{{address}}'), num_rows: int = 10, include_row_ids: bool = False) -> str
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
value = fake.psv(num_rows=2)
```

<a id="faker-publictransportlicenseplate"></a>

## `publicTransportLicensePlate`

`publicTransportLicensePlate` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def publicTransportLicensePlate() -> str
```

Firma real para `es_MX`:

```text
fake.publicTransportLicensePlate() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.publicTransportLicensePlate()
```

<a id="faker-publictransportlicenseplatelettered"></a>

## `publicTransportLicensePlateLettered`

`publicTransportLicensePlateLettered` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def publicTransportLicensePlateLettered() -> str
```

Firma real para `es_MX`:

```text
fake.publicTransportLicensePlateLettered() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.publicTransportLicensePlateLettered()
```

<a id="faker-publictransportlicenseplatenumbered"></a>

## `publicTransportLicensePlateNumbered`

`publicTransportLicensePlateNumbered` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def publicTransportLicensePlateNumbered() -> str
```

Firma real para `es_MX`:

```text
fake.publicTransportLicensePlateNumbered() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.publicTransportLicensePlateNumbered()
```

<a id="faker-pwzdoctor"></a>

## `pwzDoctor`

`pwzDoctor` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def pwzDoctor() -> str
```

Firma real para `pl_PL`:

```text
fake.pwzDoctor() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.pwzDoctor()
```

<a id="faker-pwzdoctorcomputecheckdigit"></a>

## `pwzDoctorComputeCheckDigit`

Calcula el dígito de control del identificador médico polaco a partir de la secuencia de dígitos.

Contrato tipado de Orionis:

```text
def pwzDoctorComputeCheckDigit(x: Sequence[int]) -> int
```

Firma real para `pl_PL`:

```text
fake.pwzDoctorComputeCheckDigit(x: Sequence[int]) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `x` | Secuencia de dígitos para calcular el control. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.pwzDoctorComputeCheckDigit(x=[1, 2, 3, 4, 5, 6])
```

<a id="faker-pwznurse"></a>

## `pwzNurse`

`pwzNurse` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def pwzNurse(kind: str=...) -> str
```

Firma real para `pl_PL`:

```text
fake.pwzNurse(kind: str = 'nurse') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `kind` | Clase de profesional de enfermería del identificador PWZ; por defecto nurse. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.pwzNurse()
```

<a id="faker-pybool"></a>

## `pybool`

Booleano con `truth_probability` entre 0 y 100.

Contrato tipado de Orionis:

```text
def pybool(truth_probability: int=...) -> bool
```

Firma real para `en_US`:

```text
fake.pybool(truth_probability: int = 50) -> bool
```


| Parámetro | Propósito |
| --- | --- |
| `truth_probability` | Porcentaje de True (0 a 100). |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pybool()
```

<a id="faker-pydecimal"></a>

## `pydecimal`

Devuelve Decimal con límites de dígitos/valor y signo, sin convertirlo automáticamente en float ni texto.

Contrato tipado de Orionis:

```text
def pydecimal(left_digits: int | None=..., right_digits: int | None=..., positive: bool | None=..., min_value: float | int | Decimal | None=..., max_value: float | int | Decimal | None=...) -> Decimal
```

Firma real para `en_US`:

```text
fake.pydecimal(left_digits: int | None = None, right_digits: int | None = None, positive: bool | None = None, min_value: float | int | decimal.Decimal | None = None, max_value: float | int | decimal.Decimal | None = None) -> decimal.Decimal
```


| Parámetro | Propósito |
| --- | --- |
| `left_digits` | Cantidad de dígitos a la izquierda del separador decimal. |
| `right_digits` | Cantidad de dígitos fraccionarios. |
| `positive` | Restringe el signo cuando no es None. |
| `min_value` | Valor numérico mínimo permitido. |
| `max_value` | Valor numérico máximo permitido. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pydecimal(left_digits=3, right_digits=2, positive=True)
```

<a id="faker-pydict"></a>

## `pydict`

`pydict` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pydict(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> dict[Any, Any]
```

Firma real para `en_US`:

```text
fake.pydict(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Dict[Any, Any]
```


| Parámetro | Propósito |
| --- | --- |
| `nb_elements` | Cantidad de elementos a generar. |
| `variable_nb_elements` | Permite variar la cantidad alrededor del objetivo. |
| `value_types` | Tipos Python de los valores generados. |
| `allowed_types` | Tipos Python que puede elegir el contenedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pydict()
```

<a id="faker-pyfloat"></a>

## `pyfloat`

Devuelve float con límites de dígitos, signo y valor.

Contrato tipado de Orionis:

```text
def pyfloat(left_digits: int | None=..., right_digits: int | None=..., positive: bool | None=..., min_value: float | int | None=..., max_value: float | int | None=...) -> float
```

Firma real para `en_US`:

```text
fake.pyfloat(left_digits: int | None = None, right_digits: int | None = None, positive: bool | None = None, min_value: float | int | None = None, max_value: float | int | None = None) -> float
```


| Parámetro | Propósito |
| --- | --- |
| `left_digits` | Cantidad de dígitos a la izquierda del separador decimal. |
| `right_digits` | Cantidad de dígitos fraccionarios. |
| `positive` | Restringe el signo cuando no es None. |
| `min_value` | Valor numérico mínimo permitido. |
| `max_value` | Valor numérico máximo permitido. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyfloat(left_digits=2, right_digits=2, positive=True)
```

<a id="faker-pyint"></a>

## `pyint`

`pyint` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pyint(min_value: int=..., max_value: int=..., step: int=...) -> int
```

Firma real para `en_US`:

```text
fake.pyint(min_value: int = 0, max_value: int = 9999, step: int = 1) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `min_value` | Valor numérico mínimo permitido. |
| `max_value` | Valor numérico máximo permitido. |
| `step` | Paso de la selección entera. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyint()
```

<a id="faker-pyiterable"></a>

## `pyiterable`

`pyiterable` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pyiterable(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> Iterable[Any]
```

Firma real para `en_US`:

```text
fake.pyiterable(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Iterable[Any]
```


| Parámetro | Propósito |
| --- | --- |
| `nb_elements` | Cantidad de elementos a generar. |
| `variable_nb_elements` | Permite variar la cantidad alrededor del objetivo. |
| `value_types` | Tipos Python de los valores generados. |
| `allowed_types` | Tipos Python que puede elegir el contenedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyiterable()
```

<a id="faker-pylist"></a>

## `pylist`

`pylist` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pylist(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> list[Any]
```

Firma real para `en_US`:

```text
fake.pylist(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> List[Any]
```


| Parámetro | Propósito |
| --- | --- |
| `nb_elements` | Cantidad de elementos a generar. |
| `variable_nb_elements` | Permite variar la cantidad alrededor del objetivo. |
| `value_types` | Tipos Python de los valores generados. |
| `allowed_types` | Tipos Python que puede elegir el contenedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pylist()
```

<a id="faker-pyobject"></a>

## `pyobject`

`pyobject` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pyobject(object_type: type[bool | str | float | int | tuple | set | list | Iterable | dict] | None=...) -> bool | str | float | int | tuple | set | list | Iterable | dict | None
```

Firma real para `en_US`:

```text
fake.pyobject(object_type: Type[bool | str | float | int | tuple | set | list | Iterable | dict] | None = None) -> bool | str | float | int | tuple | set | list | Iterable | dict | None
```


| Parámetro | Propósito |
| --- | --- |
| `object_type` | Tipo Python del objeto que se generará. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyobject()
```

<a id="faker-pyset"></a>

## `pyset`

`pyset` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pyset(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> set[Any]
```

Firma real para `en_US`:

```text
fake.pyset(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Set[Any]
```


| Parámetro | Propósito |
| --- | --- |
| `nb_elements` | Cantidad de elementos a generar. |
| `variable_nb_elements` | Permite variar la cantidad alrededor del objetivo. |
| `value_types` | Tipos Python de los valores generados. |
| `allowed_types` | Tipos Python que puede elegir el contenedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pyset()
```

<a id="faker-pystr"></a>

## `pystr`

`pystr` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pystr(min_chars: int | None=..., max_chars: int=..., prefix: str=..., suffix: str=...) -> str
```

Firma real para `en_US`:

```text
fake.pystr(min_chars: int | None = None, max_chars: int = 20, prefix: str = '', suffix: str = '') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `min_chars` | Longitud mínima de la cadena. |
| `max_chars` | Longitud máxima de la cadena. |
| `prefix` | Prefijo de la cadena generada. |
| `suffix` | Sufijo de la cadena generada. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pystr(min_chars=6, max_chars=12)
```

<a id="faker-pystrformat"></a>

## `pystrFormat`

`pystrFormat` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pystrFormat(string_format: str=..., letters: str=...) -> str
```

Firma real para `en_US`:

```text
fake.pystrFormat(string_format: str = '?#-###{{random_int}}{{random_letter}}', letters: str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `string_format` | Plantilla con tokens para generar texto formateado. |
| `letters` | Población de caracteres alfabéticos. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pystrFormat()
```

<a id="faker-pystruct"></a>

## `pystruct`

`pystruct` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pystruct(count: int=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> tuple[list, dict, dict]
```

Firma real para `en_US`:

```text
fake.pystruct(count: int = 10, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Tuple[List, Dict, Dict]
```


| Parámetro | Propósito |
| --- | --- |
| `count` | Cantidad de elementos o estructuras que produce el proveedor. |
| `value_types` | Tipos Python de los valores generados. |
| `allowed_types` | Tipos Python que puede elegir el contenedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pystruct()
```

<a id="faker-pytimezone"></a>

## `pytimezone`

`pytimezone` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def pytimezone(*args: Any, **kwargs: Any) -> datetime.tzinfo | None
```

Firma real para `en_US`:

```text
fake.pytimezone(*args: Any, **kwargs: Any) -> datetime.tzinfo | None
```


| Parámetro | Propósito |
| --- | --- |
| `args` | Argumentos posicionales de los tipos Python generados. |
| `kwargs` | Argumentos keyword de los tipos Python generados. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pytimezone()
```

<a id="faker-pytuple"></a>

## `pytuple`

`pytuple` genera valores y contenedores Python para preparar atributos de prueba.

Contrato tipado de Orionis:

```text
def pytuple(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> tuple[Any, ...]
```

Firma real para `en_US`:

```text
fake.pytuple(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> Tuple[Any, ...]
```


| Parámetro | Propósito |
| --- | --- |
| `nb_elements` | Cantidad de elementos a generar. |
| `variable_nb_elements` | Permite variar la cantidad alrededor del objetivo. |
| `value_types` | Tipos Python de los valores generados. |
| `allowed_types` | Tipos Python que puede elegir el contenedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.pytuple()
```
