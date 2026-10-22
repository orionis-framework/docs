---
title: "Faker: proveedores U–Z"
description: "Firmas, parámetros, locales y ejemplos de los proveedores U-Z."
editUrl: true
lastUpdated: false
---

Esta referencia cubre 43 nombres de la fachada de Faker en el tramo U-Z. El conjunto completo contiene **675 métodos tipados** (694 firmas con overloads) y **7 helpers de backend accesibles en runtime**, repartidos alfabéticamente. La disponibilidad se contrastó con los 110 locales del backend instalado; un método puede estar disponible solo en determinados locales.

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


<a id="faker-uid"></a>

## `uid`

`uid` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def uid() -> str
```

Firma real para `fr_CH`:

```text
fake.uid() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `fr_CH`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.uid()
```

<a id="faker-umid"></a>

## `umid`

`umid` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def umid() -> str
```

Firma real para `en_PH`:

```text
fake.umid() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.umid()
```

<a id="faker-unionterritory"></a>

## `unionTerritory`

`unionTerritory` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def unionTerritory() -> str
```

Firma real para `en_IN`:

```text
fake.unionTerritory() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.unionTerritory()
```

<a id="faker-unixdevice"></a>

## `unixDevice`

`unixDevice` genera nombres, rutas y tipos de archivo ficticios; no crea archivos en disco.

Contrato tipado de Orionis:

```text
def unixDevice(prefix: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.unixDevice(prefix: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `prefix` | Prefijo de la cadena generada. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.unixDevice()
```

<a id="faker-unixpartition"></a>

## `unixPartition`

`unixPartition` genera nombres, rutas y tipos de archivo ficticios; no crea archivos en disco.

Contrato tipado de Orionis:

```text
def unixPartition(prefix: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.unixPartition(prefix: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `prefix` | Prefijo de la cadena generada. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.unixPartition()
```

<a id="faker-unixtime"></a>

## `unixTime`

`unixTime` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def unixTime(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., start_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=...) -> float
```

Firma real para `en_US`:

```text
fake.unixTime(end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, start_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None) -> float
```


| Parámetro | Propósito |
| --- | --- |
| `end_datetime` | Límite final datetime del intervalo. |
| `start_datetime` | Límite inicial datetime del intervalo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.unixTime()
```

<a id="faker-upca"></a>

## `upcA`

`upcA` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def upcA(upc_ae_mode: bool=..., base: str | None=..., number_system_digit: int | None=...) -> str
```

Firma real para `en_US`:

```text
fake.upcA(upc_ae_mode: bool = False, base: str | None = None, number_system_digit: int | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `upc_ae_mode` | Genera UPC-A con equivalente UPC-E; activa el uso de base y number_system_digit. |
| `base` | Base de seis dígitos para la conversión UPC-A/UPC-E; un valor no admisible puede generar otra base. |
| `number_system_digit` | Dígito del sistema UPC: 0 o 1. |

Disponibilidad verificada: 107 locales. Ejemplos de locales: `en_US`, `es_CO`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`, `ar_EG`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.upcA()
```

<a id="faker-upce"></a>

## `upcE`

`upcE` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def upcE(base: str | None=..., number_system_digit: int | None=..., safe_mode: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.upcE(base: str | None = None, number_system_digit: int | None = None, safe_mode: bool = True) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `base` | Base de seis dígitos para la conversión UPC-A/UPC-E; un valor no admisible puede generar otra base. |
| `number_system_digit` | Dígito del sistema UPC: 0 o 1. |
| `safe_mode` | Exige conversión reversible de UPC-E a UPC-A y de vuelta. |

Disponibilidad verificada: 107 locales. Ejemplos de locales: `en_US`, `es_CO`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`, `ar_EG`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.upcE()
```

<a id="faker-uri"></a>

## `uri`

`uri` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def uri(schemes: list[str] | None=..., deep: int | None=...) -> str
```

Firma real para `en_US`:

```text
fake.uri(schemes: List[str] | None = None, deep: int | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `schemes` | Esquemas de URL permitidos. |
| `deep` | Profundidad de segmentos de la ruta URI. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uri()
```

<a id="faker-uriextension"></a>

## `uriExtension`

`uriExtension` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def uriExtension() -> str
```

Firma real para `en_US`:

```text
fake.uriExtension() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uriExtension()
```

<a id="faker-uripage"></a>

## `uriPage`

`uriPage` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def uriPage() -> str
```

Firma real para `en_US`:

```text
fake.uriPage() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uriPage()
```

<a id="faker-uripath"></a>

## `uriPath`

`uriPath` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def uriPath(deep: int | None=...) -> str
```

Firma real para `en_US`:

```text
fake.uriPath(deep: int | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `deep` | Profundidad de segmentos de la ruta URI. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uriPath()
```

<a id="faker-url"></a>

## `url`

`url` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def url(schemes: list[str] | None=...) -> str
```

Firma real para `en_US`:

```text
fake.url(schemes: List[str] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `schemes` | Esquemas de URL permitidos. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.url()
```

<a id="faker-useragent"></a>

## `userAgent`

`userAgent` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def userAgent() -> str
```

Firma real para `en_US`:

```text
fake.userAgent() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.userAgent()
```

<a id="faker-username"></a>

## `userName`

`userName` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def userName() -> str
```

Firma real para `en_US`:

```text
fake.userName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.userName()
```

<a id="faker-uuid1"></a>

## `uuid1`

`uuid1` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def uuid1() -> str
def uuid1(cast_to: None) -> UUID
def uuid1(cast_to: Callable[[UUID], str]) -> str
def uuid1(cast_to: Callable[[UUID], bytes]) -> bytes
```

Firma real para `en_US`:

```text
fake.uuid1(cast_to: Callable[[uuid.UUID], str] | Callable[[uuid.UUID], bytes] | None = <class 'str'>) -> bytes | str | uuid.UUID
```


| Parámetro | Propósito |
| --- | --- |
| `cast_to` | Tipo de representación final del UUID, como str o UUID. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uuid1()
```

<a id="faker-uuid4"></a>

## `uuid4`

`uuid4` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def uuid4() -> str
def uuid4(cast_to: None) -> UUID
def uuid4(cast_to: Callable[[UUID], str]) -> str
def uuid4(cast_to: Callable[[UUID], bytes]) -> bytes
```

Firma real para `en_US`:

```text
fake.uuid4(cast_to: Callable[[uuid.UUID], str] | Callable[[uuid.UUID], bytes] | None = <class 'str'>) -> bytes | str | uuid.UUID
```


| Parámetro | Propósito |
| --- | --- |
| `cast_to` | Tipo de representación final del UUID, como str o UUID. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uuid4()
```

<a id="faker-uuid7"></a>

## `uuid7`

`uuid7` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def uuid7() -> str
def uuid7(cast_to: None) -> UUID
def uuid7(cast_to: Callable[[UUID], str]) -> str
def uuid7(cast_to: Callable[[UUID], bytes]) -> bytes
```

Firma real para `en_US`:

```text
fake.uuid7(cast_to: Callable[[uuid.UUID], str] | Callable[[uuid.UUID], bytes] | None = <class 'str'>) -> bytes | str | uuid.UUID
```


| Parámetro | Propósito |
| --- | --- |
| `cast_to` | Tipo de representación final del UUID, como str o UUID. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.uuid7()
```

<a id="faker-vatid"></a>

## `vatId`

`vatId` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def vatId() -> str
```

Firma real para `es_ES`:

```text
fake.vatId() -> str
```


| Parámetro | Propósito |
| --- | --- |
| `prefix` | Prefijo de la cadena generada. |

Variantes reales por locale:

`bg_BG`, `cs_CZ`, `de`, `de_AT`, `de_CH`, `de_DE` y 28 más:

```text
fake.vatId() -> str
```

`el_GR`:

```text
fake.vatId(prefix: bool = True) -> str
```

Disponibilidad verificada: 35 locales. Ejemplos de locales: `es_ES`, `bg_BG`, `cs_CZ`, `de`, `de_AT`, `de_CH`, `de_DE`, `dk_DK`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.vatId()
```

<a id="faker-vehiclecategory"></a>

## `vehicleCategory`

`vehicleCategory` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def vehicleCategory() -> str
```

Firma real para `ru_RU`:

```text
fake.vehicleCategory() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ru_RU`, `uk_UA`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.vehicleCategory()
```

<a id="faker-vehiclecategoryletter"></a>

## `vehicleCategoryLetter`

`vehicleCategoryLetter` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def vehicleCategoryLetter() -> str
```

Firma real para `bn_BD`:

```text
fake.vehicleCategoryLetter() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.vehicleCategoryLetter()
```

<a id="faker-vehiclecategorynumber"></a>

## `vehicleCategoryNumber`

`vehicleCategoryNumber` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def vehicleCategoryNumber() -> str
```

Firma real para `bn_BD`:

```text
fake.vehicleCategoryNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.vehicleCategoryNumber()
```

<a id="faker-vehicleserialnumber"></a>

## `vehicleSerialNumber`

`vehicleSerialNumber` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def vehicleSerialNumber() -> str
```

Firma real para `bn_BD`:

```text
fake.vehicleSerialNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.vehicleSerialNumber()
```

<a id="faker-vibuildingnumberformat"></a>

## `viBuildingNumberFormat`

`viBuildingNumberFormat` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def viBuildingNumberFormat() -> str
```

Firma real para `vi_VN`:

```text
fake.viBuildingNumberFormat() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `vi_VN`.

```python
fake = SampleFactory(locale="vi_VN", seed=7).fake
value = fake.viBuildingNumberFormat()
```

<a id="faker-village"></a>

## `village`

`village` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def village() -> str
```

Firma real para `az_AZ`:

```text
fake.village() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `az_AZ`, `hy_AM`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.village()
```

<a id="faker-villageprefix"></a>

## `villagePrefix`

`villagePrefix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def villagePrefix() -> str
```

Firma real para `hy_AM`:

```text
fake.villagePrefix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `hy_AM`.

```python
fake = SampleFactory(locale="hy_AM", seed=7).fake
value = fake.villagePrefix()
```

<a id="faker-villagesuffix"></a>

## `villageSuffix`

`villageSuffix` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def villageSuffix() -> str
```

Firma real para `az_AZ`:

```text
fake.villageSuffix() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.villageSuffix()
```

<a id="faker-vin"></a>

## `vin`

`vin` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def vin() -> str
```

Firma real para `en_US`:

```text
fake.vin() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.vin()
```

<a id="faker-visayasprovince"></a>

## `visayasProvince`

`visayasProvince` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def visayasProvince() -> str
```

Firma real para `en_PH`:

```text
fake.visayasProvince() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.visayasProvince()
```

<a id="faker-visayasprovinceaddress"></a>

## `visayasProvinceAddress`

`visayasProvinceAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def visayasProvinceAddress() -> str
```

Firma real para `en_PH`:

```text
fake.visayasProvinceAddress() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.visayasProvinceAddress()
```

<a id="faker-visayasprovincepostcode"></a>

## `visayasProvincePostcode`

`visayasProvincePostcode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def visayasProvincePostcode() -> str
```

Firma real para `en_PH`:

```text
fake.visayasProvincePostcode() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.visayasProvincePostcode()
```

<a id="faker-wilaya"></a>

## `wilaya`

`wilaya` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def wilaya() -> str
```

Firma real para `ar_DZ`:

```text
fake.wilaya() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ar_DZ`, `fr_DZ`.

```python
fake = SampleFactory(locale="ar_DZ", seed=7).fake
value = fake.wilaya()
```

<a id="faker-windowsplatformtoken"></a>

## `windowsPlatformToken`

`windowsPlatformToken` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def windowsPlatformToken() -> str
```

Firma real para `en_US`:

```text
fake.windowsPlatformToken() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.windowsPlatformToken()
```

<a id="faker-word"></a>

## `word`

`word` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def word(part_of_speech: str | None=..., ext_word_list: Sequence[str] | None=...) -> str
```

Firma real para `en_US`:

```text
fake.word(part_of_speech: str | None = None, ext_word_list: Sequence[str] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `part_of_speech` | Categoría gramatical del vocabulario cuando el locale la soporta. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.word()
```

<a id="faker-words"></a>

## `words`

`words` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def words(nb: int=..., ext_word_list: list[str] | None=..., part_of_speech: str | None=..., unique: bool=...) -> list[str]
```

Firma real para `en_US`:

```text
fake.words(nb: int = 3, ext_word_list: List[str] | None = None, part_of_speech: str | None = None, unique: bool = False) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `nb` | Cantidad de resultados solicitados. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |
| `part_of_speech` | Categoría gramatical del vocabulario cuando el locale la soporta. |
| `unique` | Solicita selección sin valores repetidos dentro de esta llamada. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.words()
```

<a id="faker-xml"></a>

## `xml`

Genera texto XML y requiere xmltodict. Sin esa dependencia lanza faker.exceptions.UnsupportedFeature. Usa nb_elements y los tipos permitidos para controlar su estructura.

Contrato tipado de Orionis:

```text
def xml(nb_elements: int=..., variable_nb_elements: bool=..., value_types: list[type] | tuple[type, ...] | None=..., allowed_types: list[type] | tuple[type, ...] | None=...) -> str
```

Firma real para `en_US`:

```text
fake.xml(nb_elements: int = 10, variable_nb_elements: bool = True, value_types: List[Type] | Tuple[Type, ...] | None = None, allowed_types: List[Type] | Tuple[Type, ...] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `nb_elements` | Cantidad de elementos a generar. |
| `variable_nb_elements` | Permite variar la cantidad alrededor del objetivo. |
| `value_types` | Tipos Python de los valores generados. |
| `allowed_types` | Tipos Python que puede elegir el contenedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

El ejemplo captura la ausencia de la dependencia; instala `Pillow` para imagen o `xmltodict` para XML en el entorno donde necesites ese proveedor.

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

`year` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def year() -> str
```

Firma real para `en_US`:

```text
fake.year() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.year()
```

<a id="faker-zip"></a>

## `zip`

Genera bytes de un archivo ZIP en memoria. No escribe un archivo; num_files, min_file_size y uncompressed_size deben ser positivos y compatibles.

Contrato tipado de Orionis:

```text
def zip(uncompressed_size: int=..., num_files: int=..., min_file_size: int=..., compression: str | None=...) -> bytes
```

Firma real para `en_US`:

```text
fake.zip(uncompressed_size: int = 65536, num_files: int = 1, min_file_size: int = 4096, compression: str | None = None) -> bytes
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
value = fake.zip(uncompressed_size=128, min_file_size=64, num_files=1)
```

<a id="faker-zipcode"></a>

## `zipcode`

`zipcode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def zipcode() -> str
```

Firma real para `en_US`:

```text
fake.zipcode() -> str
```


Disponibilidad verificada: 47 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.zipcode()
```

<a id="faker-zipcodeinarmy"></a>

## `zipcodeInArmy`

`zipcodeInArmy` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def zipcodeInArmy() -> int
```

Firma real para `en_IN`:

```text
fake.zipcodeInArmy() -> int
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.zipcodeInArmy()
```

<a id="faker-zipcodeinmilitary"></a>

## `zipcodeInMilitary`

`zipcodeInMilitary` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def zipcodeInMilitary() -> int
```

Firma real para `en_IN`:

```text
fake.zipcodeInMilitary() -> int
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.zipcodeInMilitary()
```

<a id="faker-zipcodeinstate"></a>

## `zipcodeInState`

`zipcodeInState` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def zipcodeInState(state_abbr: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.zipcodeInState(state_abbr: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `state_abbr` | Abreviatura del estado para restringir el resultado local. |
| `include_union_territories` | Incluye territorios de la Unión en códigos postales de India. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG` y 39 más:

```text
fake.zipcodeInState(state_abbr: str | None = None) -> str
```

`en_IN`:

```text
fake.zipcodeInState(state_abbr: str | None = None, include_union_territories: bool = False) -> int
```

Disponibilidad verificada: 46 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.zipcodeInState()
```

<a id="faker-zipcodeplus4"></a>

## `zipcodePlus4`

`zipcodePlus4` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def zipcodePlus4() -> str
```

Firma real para `en_US`:

```text
fake.zipcodePlus4() -> str
```


Disponibilidad verificada: 45 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.zipcodePlus4()
```
