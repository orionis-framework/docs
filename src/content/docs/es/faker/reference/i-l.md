---
title: "Faker: proveedores I–L"
description: "Firmas, parámetros, locales y ejemplos de los proveedores I-L."
editUrl: true
lastUpdated: false
---

Esta referencia cubre 100 nombres de la fachada de Faker en el tramo I-L. El conjunto completo contiene **675 métodos tipados** (694 firmas con overloads) y **7 helpers de backend accesibles en runtime**, repartidos alfabéticamente. La disponibilidad se contrastó con los 110 locales del backend instalado; un método puede estar disponible solo en determinados locales.

## Preparar los ejemplos

Estos ejemplos generan datos en memoria. No crean tablas ni insertan registros. Define una vez esta factory; después utiliza los fragmentos dentro de su `definition()`, un seeder o un servicio/controlador como se muestra en [Faker y datos simulados](/es/faker).

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

Los métodos normalmente propagan errores de parámetros del backend (`TypeError`, `ValueError`, errores de formato). Si el locale no publica el nombre, la fachada produce `AttributeError`. `image` y `xml` requieren dependencias específicas, explicadas en sus entradas. Las vistas `unique` y `optional` se explican en la [guía de uso](/es/faker); un resultado no hashable puede impedir aplicar unicidad. No hay garantía de que todos los métodos existan en cualquier locale.

## Índice del catálogo

[A-D](/es/faker/reference/a-d) · [E-H](/es/faker/reference/e-h) · [I-L](/es/faker/reference/i-l) · [M-P](/es/faker/reference/m-p) · [Q-T](/es/faker/reference/q-t) · [U-Z](/es/faker/reference/u-z)


<a id="faker-ianaid"></a>

## `ianaId`

`ianaId` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def ianaId() -> str
```

Firma real para `en_US`:

```text
fake.ianaId() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ianaId()
```

<a id="faker-iban"></a>

## `iban`

`iban` genera identificadores bancarios ficticios; sus formatos no representan cuentas operativas.

Contrato tipado de Orionis:

```text
def iban() -> str
```

Firma real para `en_US`:

```text
fake.iban() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.iban()
```

<a id="faker-ide"></a>

## `ide`

`ide` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def ide() -> str
```

Firma real para `fr_CH`:

```text
fake.ide() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `fr_CH`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.ide()
```

<a id="faker-identitycardnumber"></a>

## `identityCardNumber`

`identityCardNumber` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def identityCardNumber() -> str
```

Firma real para `pl_PL`:

```text
fake.identityCardNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.identityCardNumber()
```

<a id="faker-idi"></a>

## `idi`

`idi` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def idi() -> str
```

Firma real para `fr_CH`:

```text
fake.idi() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `fr_CH`.

```python
fake = SampleFactory(locale="fr_CH", seed=7).fake
value = fake.idi()
```

<a id="faker-image"></a>

## `image`

Genera bytes de una imagen y requiere Pillow. Sin esa dependencia lanza faker.exceptions.UnsupportedFeature; algunos formatos también dependen de los codecs disponibles.

Contrato tipado de Orionis:

```text
def image(size: tuple[int, int]=..., image_format: str=..., hue: int | Sequence[int] | str | None=..., luminosity: str | None=...) -> bytes
```

Firma real para `en_US`:

```text
fake.image(size: Tuple[int, int] = (256, 256), image_format: str = 'png', hue: int | Sequence[int] | str | None = None, luminosity: str | None = None) -> bytes
```


| Parámetro | Propósito |
| --- | --- |
| `size` | Par (ancho, alto) de imagen en píxeles. |
| `image_format` | Formato de codificación de imagen, por ejemplo png. |
| `hue` | Matiz o familia de color admitida por el proveedor. |
| `luminosity` | Categoría de luminosidad del color. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

El ejemplo captura la ausencia de la dependencia; instala `Pillow` para imagen o `xmltodict` para XML en el entorno donde necesites ese proveedor.

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

`imageUrl` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def imageUrl(width: int | None=..., height: int | None=..., placeholder_url: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.imageUrl(width: int | None = None, height: int | None = None, placeholder_url: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `width` | Ancho de la imagen de referencia en píxeles. |
| `height` | Altura de la imagen de referencia en píxeles. |
| `placeholder_url` | Plantilla de URL con marcadores {width} y {height}; solo genera la cadena, no descarga la imagen. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.imageUrl()
```

<a id="faker-individualsinn"></a>

## `individualsInn`

`individualsInn` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def individualsInn() -> str
```

Firma real para `ru_RU`:

```text
fake.individualsInn() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.individualsInn()
```

<a id="faker-individualsogrn"></a>

## `individualsOgrn`

`individualsOgrn` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def individualsOgrn() -> str
```

Firma real para `ru_RU`:

```text
fake.individualsOgrn() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.individualsOgrn()
```

<a id="faker-initials"></a>

## `initials`

`initials` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def initials() -> str
```

Firma real para `ar_JO`:

```text
fake.initials() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ar_JO`.

```python
fake = SampleFactory(locale="ar_JO", seed=7).fake
value = fake.initials()
```

<a id="faker-internetexplorer"></a>

## `internetExplorer`

`internetExplorer` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def internetExplorer() -> str
```

Firma real para `en_US`:

```text
fake.internetExplorer() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.internetExplorer()
```

<a id="faker-invalidssn"></a>

## `invalidSsn`

`invalidSsn` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def invalidSsn() -> str
```

Firma real para `en_US`:

```text
fake.invalidSsn() -> str
```


Disponibilidad verificada: 52 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.invalidSsn()
```

<a id="faker-iosplatformtoken"></a>

## `iosPlatformToken`

`iosPlatformToken` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def iosPlatformToken() -> str
```

Firma real para `en_US`:

```text
fake.iosPlatformToken() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.iosPlatformToken()
```

<a id="faker-ipv4"></a>

## `ipv4`

`ipv4` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def ipv4(network: bool=..., address_class: str | None=..., private: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.ipv4(network: bool = False, address_class: str | None = None, private: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `network` | Devuelve especificación de red en lugar de dirección host. |
| `address_class` | Clase de red IPv4 que restringe el rango generado. |
| `private` | Selecciona si el rango IPv4 debe ser privado cuando no es None. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv4()
```

<a id="faker-ipv4networkclass"></a>

## `ipv4NetworkClass`

`ipv4NetworkClass` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def ipv4NetworkClass() -> str
```

Firma real para `en_US`:

```text
fake.ipv4NetworkClass() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv4NetworkClass()
```

<a id="faker-ipv4private"></a>

## `ipv4Private`

`ipv4Private` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def ipv4Private(network: bool=..., address_class: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.ipv4Private(network: bool = False, address_class: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `network` | Devuelve especificación de red en lugar de dirección host. |
| `address_class` | Clase de red IPv4 que restringe el rango generado. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv4Private()
```

<a id="faker-ipv4public"></a>

## `ipv4Public`

`ipv4Public` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def ipv4Public(network: bool=..., address_class: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.ipv4Public(network: bool = False, address_class: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `network` | Devuelve especificación de red en lugar de dirección host. |
| `address_class` | Clase de red IPv4 que restringe el rango generado. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv4Public()
```

<a id="faker-ipv6"></a>

## `ipv6`

`ipv6` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def ipv6(network: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.ipv6(network: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `network` | Devuelve especificación de red en lugar de dirección host. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ipv6()
```

<a id="faker-isleapyear"></a>

## `isLeapYear`

Comprueba si el año suministrado es bisiesto; devuelve bool y requiere el locale que publica este helper.

Contrato tipado de Orionis:

```text
def isLeapYear(year: int) -> bool
```

Firma real para `it_IT`:

```text
fake.isLeapYear(year: int) -> bool
```


| Parámetro | Propósito |
| --- | --- |
| `year` | Año que genera o evalúa este proveedor. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `it_IT`.

```python
fake = SampleFactory(locale="it_IT", seed=7).fake
value = fake.isLeapYear(year=2024)
```

<a id="faker-isbn10"></a>

## `isbn10`

`isbn10` genera identificadores de publicaciones para catálogos de prueba.

Contrato tipado de Orionis:

```text
def isbn10(separator: str=...) -> str
```

Firma real para `en_US`:

```text
fake.isbn10(separator: str = '-') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `separator` | Separador textual del formato. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.isbn10()
```

<a id="faker-isbn13"></a>

## `isbn13`

`isbn13` genera identificadores de publicaciones para catálogos de prueba.

Contrato tipado de Orionis:

```text
def isbn13(separator: str=...) -> str
```

Firma real para `en_US`:

```text
fake.isbn13(separator: str = '-') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `separator` | Separador textual del formato. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.isbn13()
```

<a id="faker-iso8601"></a>

## `iso8601`

`iso8601` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def iso8601(tzinfo: datetime.tzinfo | None=..., end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None=..., sep: str=..., timespec: str=...) -> str
```

Firma real para `en_US`:

```text
fake.iso8601(tzinfo: datetime.tzinfo | None = None, end_datetime: datetime.date | datetime.datetime | datetime.timedelta | str | int | None = None, sep: str = 'T', timespec: str = 'auto') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |
| `end_datetime` | Límite final datetime del intervalo. |
| `sep` | Separador del formato. |
| `timespec` | Precisión temporal del texto ISO 8601. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.iso8601()
```

<a id="faker-items"></a>

## `items`

Devuelve pares (locale, generador nativo) del backend. Para generar datos usa fake o fake[locale]; estos pares son introspección y contienen objetos nativos.

Helper accesible por el despacho dinámico de la fachada; no está declarado en `_ProviderMethods`.

Firma real para `en_US`:

```text
fake.items() -> 'list[tuple[str, Generator | Faker]]'
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = [(locale, type(generator).__name__) for locale, generator in fake.items()]
```

<a id="faker-itin"></a>

## `itin`

`itin` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def itin() -> str
```

Firma real para `en_US`:

```text
fake.itin() -> str
```


Disponibilidad verificada: 52 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.itin()
```

<a id="faker-jan"></a>

## `jan`

`jan` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def jan(length: int=...) -> str
```

Firma real para `ja_JP`:

```text
fake.jan(length: int = 13) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.jan()
```

<a id="faker-jan13"></a>

## `jan13`

`jan13` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def jan13() -> str
```

Firma real para `ja_JP`:

```text
fake.jan13() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.jan13()
```

<a id="faker-jan8"></a>

## `jan8`

`jan8` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def jan8() -> str
```

Firma real para `ja_JP`:

```text
fake.jan8() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.jan8()
```

<a id="faker-job"></a>

## `job`

`job` genera puestos laborales para perfiles de ejemplo.

Contrato tipado de Orionis:

```text
def job() -> str
```

Firma real para `en_US`:

```text
fake.job() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.job()
```

<a id="faker-jobfemale"></a>

## `jobFemale`

`jobFemale` genera puestos laborales para perfiles de ejemplo.

Contrato tipado de Orionis:

```text
def jobFemale() -> str
```

Firma real para `en_US`:

```text
fake.jobFemale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.jobFemale()
```

<a id="faker-jobmale"></a>

## `jobMale`

`jobMale` genera puestos laborales para perfiles de ejemplo.

Contrato tipado de Orionis:

```text
def jobMale() -> str
```

Firma real para `en_US`:

```text
fake.jobMale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.jobMale()
```

<a id="faker-json"></a>

## `json`

Devuelve texto JSON; data_columns determina la estructura y cls un encoder JSON opcional.

Contrato tipado de Orionis:

```text
def json(data_columns: list | None=..., num_rows: int=..., indent: int | None=..., cls: type[encoder.JSONEncoder] | None=...) -> str
```

Firma real para `en_US`:

```text
fake.json(data_columns: List | None = None, num_rows: int = 10, indent: int | None = None, cls: Type[json.encoder.JSONEncoder] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `data_columns` | Definición de estructura, columnas o tokens generadores. |
| `num_rows` | Cantidad de filas de datos serializados. |
| `indent` | Indentación de JSON o None para formato compacto. |
| `cls` | Clase encoder JSON. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.json(num_rows=2)
```

<a id="faker-jsonbytes"></a>

## `jsonBytes`

Genera JSON codificado como bytes en lugar de str.

Contrato tipado de Orionis:

```text
def jsonBytes(data_columns: list | None=..., num_rows: int=..., indent: int | None=..., cls: type[encoder.JSONEncoder] | None=...) -> bytes
```

Firma real para `en_US`:

```text
fake.jsonBytes(data_columns: List | None = None, num_rows: int = 10, indent: int | None = None, cls: Type[json.encoder.JSONEncoder] | None = None) -> bytes
```


| Parámetro | Propósito |
| --- | --- |
| `data_columns` | Definición de estructura, columnas o tokens generadores. |
| `num_rows` | Cantidad de filas de datos serializados. |
| `indent` | Indentación de JSON o None para formato compacto. |
| `cls` | Clase encoder JSON. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.jsonBytes(num_rows=2)
```

<a id="faker-kana"></a>

## `kana`

`kana` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def kana() -> str
```

Firma real para `ja_JP`:

```text
fake.kana() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.kana()
```

<a id="faker-kananame"></a>

## `kanaName`

`kanaName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def kanaName() -> str
```

Firma real para `ja_JP`:

```text
fake.kanaName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.kanaName()
```

<a id="faker-kananamefemale"></a>

## `kanaNameFemale`

`kanaNameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def kanaNameFemale() -> str
```

Firma real para `ja_JP`:

```text
fake.kanaNameFemale() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.kanaNameFemale()
```

<a id="faker-kananamemale"></a>

## `kanaNameMale`

`kanaNameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def kanaNameMale() -> str
```

Firma real para `ja_JP`:

```text
fake.kanaNameMale() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.kanaNameMale()
```

<a id="faker-kpp"></a>

## `kpp`

`kpp` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def kpp() -> str
```

Firma real para `ru_RU`:

```text
fake.kpp() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ru_RU`.

```python
fake = SampleFactory(locale="ru_RU", seed=7).fake
value = fake.kpp()
```

<a id="faker-kvnr"></a>

## `kvnr`

`kvnr` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def kvnr() -> str
```

Firma real para `de_DE`:

```text
fake.kvnr() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de`, `de_DE`.

```python
fake = SampleFactory(locale="de_DE", seed=7).fake
value = fake.kvnr()
```

<a id="faker-landaddress"></a>

## `landAddress`

`landAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def landAddress() -> str
```

Firma real para `ko_KR`:

```text
fake.landAddress() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.landAddress()
```

<a id="faker-landnumber"></a>

## `landNumber`

`landNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def landNumber() -> str
```

Firma real para `ko_KR`:

```text
fake.landNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ko_KR`.

```python
fake = SampleFactory(locale="ko_KR", seed=7).fake
value = fake.landNumber()
```

<a id="faker-landlinecode"></a>

## `landlineCode`

`landlineCode` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def landlineCode() -> str
```

Firma real para `de_CH`:

```text
fake.landlineCode() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `de_CH`, `es_CL`.

```python
fake = SampleFactory(locale="de_CH", seed=7).fake
value = fake.landlineCode()
```

<a id="faker-landlinenumber"></a>

## `landlineNumber`

`landlineNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def landlineNumber() -> str
```

Firma real para `az_AZ`:

```text
fake.landlineNumber() -> str
```


Disponibilidad verificada: 4 locales. Ejemplos de locales: `az_AZ`, `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.landlineNumber()
```

<a id="faker-languagecode"></a>

## `languageCode`

`languageCode` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def languageCode() -> str
```

Firma real para `en_US`:

```text
fake.languageCode() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.languageCode()
```

<a id="faker-languagename"></a>

## `languageName`

`languageName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def languageName() -> str
```

Firma real para `en_US`:

```text
fake.languageName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.languageName()
```

<a id="faker-largecompany"></a>

## `largeCompany`

`largeCompany` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def largeCompany() -> str
```

Firma real para `az_AZ`:

```text
fake.largeCompany() -> str
```


Disponibilidad verificada: 4 locales. Ejemplos de locales: `az_AZ`, `nl_NL`, `ru_RU`, `tr_TR`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.largeCompany()
```

<a id="faker-lastkananame"></a>

## `lastKanaName`

`lastKanaName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastKanaName() -> str
```

Firma real para `ja_JP`:

```text
fake.lastKanaName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.lastKanaName()
```

<a id="faker-lastname"></a>

## `lastName`

`lastName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastName() -> str
```

Firma real para `en_US`:

```text
fake.lastName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lastName()
```

<a id="faker-lastnamecommon"></a>

## `lastNameCommon`

`lastNameCommon` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameCommon() -> str
```

Firma real para `bn_BD`:

```text
fake.lastNameCommon() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.lastNameCommon()
```

<a id="faker-lastnameest"></a>

## `lastNameEst`

`lastNameEst` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameEst() -> str
```

Firma real para `et_EE`:

```text
fake.lastNameEst() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.lastNameEst()
```

<a id="faker-lastnamefemale"></a>

## `lastNameFemale`

`lastNameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameFemale() -> str
```

Firma real para `en_US`:

```text
fake.lastNameFemale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lastNameFemale()
```

<a id="faker-lastnamefemaleislamic"></a>

## `lastNameFemaleIslamic`

`lastNameFemaleIslamic` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameFemaleIslamic() -> str
```

Firma real para `bn_BD`:

```text
fake.lastNameFemaleIslamic() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.lastNameFemaleIslamic()
```

<a id="faker-lastnamehinduism"></a>

## `lastNameHinduism`

`lastNameHinduism` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameHinduism() -> str
```

Firma real para `bn_BD`:

```text
fake.lastNameHinduism() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.lastNameHinduism()
```

<a id="faker-lastnameislamic"></a>

## `lastNameIslamic`

`lastNameIslamic` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameIslamic() -> str
```

Firma real para `bn_BD`:

```text
fake.lastNameIslamic() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.lastNameIslamic()
```

<a id="faker-lastnamemale"></a>

## `lastNameMale`

`lastNameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameMale() -> str
```

Firma real para `en_US`:

```text
fake.lastNameMale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lastNameMale()
```

<a id="faker-lastnamenonbinary"></a>

## `lastNameNonbinary`

`lastNameNonbinary` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameNonbinary() -> str
```

Firma real para `en_US`:

```text
fake.lastNameNonbinary() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lastNameNonbinary()
```

<a id="faker-lastnamepair"></a>

## `lastNamePair`

`lastNamePair` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNamePair() -> tuple[str, str, str]
```

Firma real para `ja_JP`:

```text
fake.lastNamePair() -> Tuple[str, str, str]
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.lastNamePair()
```

<a id="faker-lastnamerus"></a>

## `lastNameRus`

`lastNameRus` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameRus() -> str
```

Firma real para `et_EE`:

```text
fake.lastNameRus() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.lastNameRus()
```

<a id="faker-lastnameuniquetofemale"></a>

## `lastNameUniqueToFemale`

`lastNameUniqueToFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameUniqueToFemale() -> str
```

Firma real para `az_AZ`:

```text
fake.lastNameUniqueToFemale() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.lastNameUniqueToFemale()
```

<a id="faker-lastnameuniquetomale"></a>

## `lastNameUniqueToMale`

`lastNameUniqueToMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameUniqueToMale() -> str
```

Firma real para `az_AZ`:

```text
fake.lastNameUniqueToMale() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.lastNameUniqueToMale()
```

<a id="faker-lastnameunisex"></a>

## `lastNameUnisex`

`lastNameUnisex` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastNameUnisex() -> str
```

Firma real para `az_AZ`:

```text
fake.lastNameUnisex() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.lastNameUnisex()
```

<a id="faker-lastromanizedname"></a>

## `lastRomanizedName`

`lastRomanizedName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def lastRomanizedName() -> str
```

Firma real para `ja_JP`:

```text
fake.lastRomanizedName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `ja_JP`, `zh_CN`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.lastRomanizedName()
```

<a id="faker-latitude"></a>

## `latitude`

`latitude` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def latitude() -> Decimal
```

Firma real para `en_US`:

```text
fake.latitude() -> decimal.Decimal
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.latitude()
```

<a id="faker-latlng"></a>

## `latlng`

`latlng` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def latlng() -> tuple[Decimal, Decimal]
```

Firma real para `en_US`:

```text
fake.latlng() -> Tuple[decimal.Decimal, decimal.Decimal]
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.latlng()
```

<a id="faker-legalpersonnit"></a>

## `legalPersonNit`

`legalPersonNit` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def legalPersonNit() -> str
```

Firma real para `es_CO`:

```text
fake.legalPersonNit() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.legalPersonNit()
```

<a id="faker-legalpersonnitwithcheckdigit"></a>

## `legalPersonNitWithCheckDigit`

`legalPersonNitWithCheckDigit` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def legalPersonNitWithCheckDigit() -> str
```

Firma real para `es_CO`:

```text
fake.legalPersonNitWithCheckDigit() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CO`.

```python
fake = SampleFactory(locale="es_CO", seed=7).fake
value = fake.legalPersonNitWithCheckDigit()
```

<a id="faker-lexify"></a>

## `lexify`

Sustituye los marcadores `?` por letras de `letters`.

Contrato tipado de Orionis:

```text
def lexify(text: str=..., letters: str=...) -> str
```

Firma real para `en_US`:

```text
fake.lexify(text: str = '????', letters: str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `text` | Plantilla o texto que procesará el proveedor. |
| `letters` | Población de caracteres alfabéticos. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.lexify()
```

<a id="faker-licenseplate"></a>

## `licensePlate`

`licensePlate` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlate() -> str
```

Firma real para `en_US`:

```text
fake.licensePlate() -> str
```


| Parámetro | Propósito |
| --- | --- |
| `ar` | Selecciona la representación árabe de la matrícula en el locale que expone esta opción. |
| `region_name` | Nombre de la región usado para formar la matrícula local. |
| `temporary_plate` | Solicita matrícula temporal en el locale que admite esta variante. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 102 más:

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

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.licensePlate()
```

<a id="faker-licenseplatear"></a>

## `licensePlateAr`

`licensePlateAr` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateAr() -> str
```

Firma real para `ar_SA`:

```text
fake.licensePlateAr() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ar_SA`.

```python
fake = SampleFactory(locale="ar_SA", seed=7).fake
value = fake.licensePlateAr()
```

<a id="faker-licenseplatebyprovince"></a>

## `licensePlateByProvince`

`licensePlateByProvince` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateByProvince(province_prefix: str | None=...) -> str
```

Firma real para `es_ES`:

```text
fake.licensePlateByProvince(province_prefix: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `province_prefix` | Prefijo de provincia admitido por el locale. |

Disponibilidad verificada: 2 locales. Ejemplos de locales: `es_ES`, `es`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.licensePlateByProvince()
```

<a id="faker-licenseplatebystate"></a>

## `licensePlateByState`

`licensePlateByState` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateByState(state_abbr: str | None=...) -> str
```

Firma real para `es_MX`:

```text
fake.licensePlateByState(state_abbr: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `state_abbr` | Abreviatura del estado para restringir el resultado local. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.licensePlateByState()
```

<a id="faker-licenseplatecar"></a>

## `licensePlateCar`

`licensePlateCar` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateCar() -> str
```

Firma real para `nl_NL`:

```text
fake.licensePlateCar() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `nl_NL`.

```python
fake = SampleFactory(locale="nl_NL", seed=7).fake
value = fake.licensePlateCar()
```

<a id="faker-licenseplatecdmx"></a>

## `licensePlateCdmx`

`licensePlateCdmx` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateCdmx() -> str
```

Firma real para `es_MX`:

```text
fake.licensePlateCdmx() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.licensePlateCdmx()
```

<a id="faker-licenseplatediplomatic"></a>

## `licensePlateDiplomatic`

`licensePlateDiplomatic` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateDiplomatic() -> str
```

Firma real para `es_CL`:

```text
fake.licensePlateDiplomatic() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.licensePlateDiplomatic()
```

<a id="faker-licenseplateen"></a>

## `licensePlateEn`

`licensePlateEn` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateEn() -> str
```

Firma real para `ar_SA`:

```text
fake.licensePlateEn() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ar_SA`.

```python
fake = SampleFactory(locale="ar_SA", seed=7).fake
value = fake.licensePlateEn()
```

<a id="faker-licenseplatemercosur"></a>

## `licensePlateMercosur`

`licensePlateMercosur` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateMercosur() -> str
```

Firma real para `es_AR`:

```text
fake.licensePlateMercosur() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_AR`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.licensePlateMercosur()
```

<a id="faker-licenseplatemotorbike"></a>

## `licensePlateMotorbike`

`licensePlateMotorbike` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateMotorbike() -> str
```

Firma real para `nl_NL`:

```text
fake.licensePlateMotorbike() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `nl_NL`.

```python
fake = SampleFactory(locale="nl_NL", seed=7).fake
value = fake.licensePlateMotorbike()
```

<a id="faker-licenseplatenew"></a>

## `licensePlateNew`

`licensePlateNew` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateNew() -> str
```

Firma real para `es_CL`:

```text
fake.licensePlateNew() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.licensePlateNew()
```

<a id="faker-licenseplateold"></a>

## `licensePlateOld`

`licensePlateOld` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateOld() -> str
```

Firma real para `es_AR`:

```text
fake.licensePlateOld() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `es_AR`, `es_CL`, `es_MX`.

```python
fake = SampleFactory(locale="es_AR", seed=7).fake
value = fake.licensePlateOld()
```

<a id="faker-licenseplatepolice"></a>

## `licensePlatePolice`

`licensePlatePolice` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlatePolice() -> str
```

Firma real para `es_CL`:

```text
fake.licensePlatePolice() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.licensePlatePolice()
```

<a id="faker-licenseplateregexformats"></a>

## `licensePlateRegexFormats`

`licensePlateRegexFormats` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateRegexFormats() -> list[str]
```

Firma real para `pl_PL`:

```text
fake.licensePlateRegexFormats() -> List[str]
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.licensePlateRegexFormats()
```

<a id="faker-licenseplatestate"></a>

## `licensePlateState`

`licensePlateState` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateState() -> str
```

Firma real para `es_MX`:

```text
fake.licensePlateState() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.licensePlateState()
```

<a id="faker-licenseplatestateabbr"></a>

## `licensePlateStateAbbr`

`licensePlateStateAbbr` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateStateAbbr() -> str
```

Firma real para `es_MX`:

```text
fake.licensePlateStateAbbr() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.licensePlateStateAbbr()
```

<a id="faker-licenseplatetemporary"></a>

## `licensePlateTemporary`

`licensePlateTemporary` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateTemporary() -> str
```

Firma real para `es_CL`:

```text
fake.licensePlateTemporary() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.licensePlateTemporary()
```

<a id="faker-licenseplateunified"></a>

## `licensePlateUnified`

`licensePlateUnified` genera matrículas e identificadores de vehículos para ejemplos y fixtures.

Contrato tipado de Orionis:

```text
def licensePlateUnified() -> str
```

Firma real para `es_ES`:

```text
fake.licensePlateUnified() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `es_ES`, `es`, `es_MX`.

```python
fake = SampleFactory(locale="es_ES", seed=7).fake
value = fake.licensePlateUnified()
```

<a id="faker-lineaddress"></a>

## `lineAddress`

`lineAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def lineAddress() -> str
```

Firma real para `el_GR`:

```text
fake.lineAddress() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `el_GR`.

```python
fake = SampleFactory(locale="el_GR", seed=7).fake
value = fake.lineAddress()
```

<a id="faker-linuxplatformtoken"></a>

## `linuxPlatformToken`

`linuxPlatformToken` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def linuxPlatformToken() -> str
```

Firma real para `en_US`:

```text
fake.linuxPlatformToken() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.linuxPlatformToken()
```

<a id="faker-linuxprocessor"></a>

## `linuxProcessor`

`linuxProcessor` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def linuxProcessor() -> str
```

Firma real para `en_US`:

```text
fake.linuxProcessor() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.linuxProcessor()
```

<a id="faker-locallatitude"></a>

## `localLatitude`

`localLatitude` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def localLatitude() -> Decimal
```

Firma real para `de_AT`:

```text
fake.localLatitude() -> decimal.Decimal
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `de_AT`, `el_GR`, `mk_MK`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.localLatitude()
```

<a id="faker-locallatlng"></a>

## `localLatlng`

`localLatlng` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def localLatlng(country_code: str=..., coords_only: bool=...) -> tuple[str, ...] | None
```

Firma real para `en_US`:

```text
fake.localLatlng(country_code: str = 'US', coords_only: bool = False) -> Tuple[str, ...] | None
```


| Parámetro | Propósito |
| --- | --- |
| `country_code` | Código de país para la selección localizada. |
| `coords_only` | Devuelve solo coordenadas, sin metadatos de localidad. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 102 más:

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

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.localLatlng()
```

<a id="faker-locallongitude"></a>

## `localLongitude`

`localLongitude` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def localLongitude() -> Decimal
```

Firma real para `de_AT`:

```text
fake.localLongitude() -> decimal.Decimal
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `de_AT`, `el_GR`, `mk_MK`.

```python
fake = SampleFactory(locale="de_AT", seed=7).fake
value = fake.localLongitude()
```

<a id="faker-localregon"></a>

## `localRegon`

`localRegon` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def localRegon() -> str
```

Firma real para `pl_PL`:

```text
fake.localRegon() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pl_PL`.

```python
fake = SampleFactory(locale="pl_PL", seed=7).fake
value = fake.localRegon()
```

<a id="faker-locale"></a>

## `locale`

`locale` devuelve el valor simulado de este proveedor local.

Contrato tipado de Orionis:

```text
def locale() -> str
```

Firma real para `en_US`:

```text
fake.locale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.locale()
```

<a id="faker-localizedean"></a>

## `localizedEan`

`localizedEan` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def localizedEan(length: int=...) -> str
```

Firma real para `en_US`:

```text
fake.localizedEan(length: int = 13) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.localizedEan()
```

<a id="faker-localizedean13"></a>

## `localizedEan13`

`localizedEan13` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def localizedEan13() -> str
```

Firma real para `en_US`:

```text
fake.localizedEan13() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.localizedEan13()
```

<a id="faker-localizedean8"></a>

## `localizedEan8`

`localizedEan8` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def localizedEan8() -> str
```

Firma real para `en_US`:

```text
fake.localizedEan8() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.localizedEan8()
```

<a id="faker-locationonland"></a>

## `locationOnLand`

`locationOnLand` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def locationOnLand(coords_only: bool=...) -> tuple[str, ...]
```

Firma real para `en_US`:

```text
fake.locationOnLand(coords_only: bool = False) -> Tuple[str, ...]
```


| Parámetro | Propósito |
| --- | --- |
| `coords_only` | Devuelve solo coordenadas, sin metadatos de localidad. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.locationOnLand()
```

<a id="faker-longitude"></a>

## `longitude`

`longitude` genera coordenadas y ubicaciones para datos geográficos de prueba.

Contrato tipado de Orionis:

```text
def longitude() -> Decimal
```

Firma real para `en_US`:

```text
fake.longitude() -> decimal.Decimal
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.longitude()
```

<a id="faker-luzonprovince"></a>

## `luzonProvince`

`luzonProvince` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def luzonProvince() -> str
```

Firma real para `en_PH`:

```text
fake.luzonProvince() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.luzonProvince()
```

<a id="faker-luzonprovinceaddress"></a>

## `luzonProvinceAddress`

`luzonProvinceAddress` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def luzonProvinceAddress() -> str
```

Firma real para `en_PH`:

```text
fake.luzonProvinceAddress() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.luzonProvinceAddress()
```

<a id="faker-luzonprovincepostcode"></a>

## `luzonProvincePostcode`

`luzonProvincePostcode` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def luzonProvincePostcode() -> str
```

Firma real para `en_PH`:

```text
fake.luzonProvincePostcode() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.luzonProvincePostcode()
```
