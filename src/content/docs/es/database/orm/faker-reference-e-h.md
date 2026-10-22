---
title: "Faker: proveedores E–H"
description: "Firmas, parámetros, locales y ejemplos de los proveedores E-H."
editUrl: true
lastUpdated: false
---

Esta referencia cubre 83 nombres de la fachada de Faker en el tramo E-H. El conjunto completo contiene **675 métodos tipados** (694 firmas con overloads) y **7 helpers de backend accesibles en runtime**, repartidos alfabéticamente. La disponibilidad se contrastó con los 110 locales del backend instalado; un método puede estar disponible solo en determinados locales.

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


<a id="faker-ean"></a>

## `ean`

`ean` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def ean(length: int=..., prefixes: tuple[int | str | tuple[int | str, ...], ...]=...) -> str
```

Firma real para `en_US`:

```text
fake.ean(length: int = 13, prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = ()) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `length` | Longitud/tamaño del valor; la unidad depende de este proveedor. |
| `prefixes` | Prefijos aceptados para el código de barras. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ean()
```

<a id="faker-ean13"></a>

## `ean13`

`ean13` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def ean13(prefixes: tuple[int | str | tuple[int | str, ...], ...]=..., leading_zero: bool | None=...) -> str
```

Firma real para `en_US`:

```text
fake.ean13(prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = (), leading_zero: bool | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `prefixes` | Prefijos aceptados para el código de barras. |
| `leading_zero` | Controla el cero inicial del EAN-13 donde el locale lo soporta. |

Variantes reales por locale:

`en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ` y 101 más:

```text
fake.ean13(prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = (), leading_zero: bool | None = None) -> str
```

`es`, `es_ES`, `ja_JP`:

```text
fake.ean13(prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = ()) -> str
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ean13()
```

<a id="faker-ean8"></a>

## `ean8`

`ean8` genera códigos de producto y dígitos de control para catálogos de prueba.

Contrato tipado de Orionis:

```text
def ean8(prefixes: tuple[int | str | tuple[int | str, ...], ...]=...) -> str
```

Firma real para `en_US`:

```text
fake.ean8(prefixes: Tuple[int | str | Tuple[int | str, ...], ...] = ()) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `prefixes` | Prefijos aceptados para el código de barras. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ean8()
```

<a id="faker-ein"></a>

## `ein`

`ein` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def ein() -> str
```

Firma real para `en_US`:

```text
fake.ein() -> str
```


Disponibilidad verificada: 52 locales. Ejemplos de locales: `en_US`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_EG`, `ar_JO`, `ar_PS`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.ein()
```

<a id="faker-electorcode"></a>

## `electorCode`

`electorCode` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def electorCode(gender: Literal['H', 'M'] | None=...) -> str
```

Firma real para `es_MX`:

```text
fake.electorCode(gender: Literal['H', 'M'] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `gender` | Selección de género según los valores locales admitidos. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_MX`.

```python
fake = SampleFactory(locale="es_MX", seed=7).fake
value = fake.electorCode()
```

<a id="faker-email"></a>

## `email`

`email` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def email(safe: bool=..., domain: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.email(safe: bool = True, domain: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `safe` | Genera correo de dominio seguro de ejemplo cuando está activo. |
| `domain` | Dominio explícito o None para generación automática. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.email()
```

<a id="faker-emoji"></a>

## `emoji`

`emoji` genera emoji para contenido de ejemplo.

Contrato tipado de Orionis:

```text
def emoji() -> str
```

Firma real para `en_US`:

```text
fake.emoji() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.emoji()
```

<a id="faker-englishcatchphrase"></a>

## `englishCatchPhrase`

`englishCatchPhrase` genera nombres y expresiones empresariales para entidades de prueba.

Contrato tipado de Orionis:

```text
def englishCatchPhrase() -> str
```

Firma real para `fil_PH`:

```text
fake.englishCatchPhrase() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="fil_PH", seed=7).fake
value = fake.englishCatchPhrase()
```

<a id="faker-englishparagraph"></a>

## `englishParagraph`

`englishParagraph` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def englishParagraph(nb_sentences: int=..., variable_nb_sentences: bool=...) -> str
```

Firma real para `en_PH`:

```text
fake.englishParagraph(nb_sentences: int = 3, variable_nb_sentences: bool = True) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `nb_sentences` | Número objetivo de oraciones. |
| `variable_nb_sentences` | Permite variar el número objetivo de oraciones. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishParagraph()
```

<a id="faker-englishparagraphs"></a>

## `englishParagraphs`

`englishParagraphs` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def englishParagraphs(nb: int=...) -> list[str]
```

Firma real para `en_PH`:

```text
fake.englishParagraphs(nb: int = 3) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `nb` | Cantidad de resultados solicitados. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishParagraphs()
```

<a id="faker-englishsentence"></a>

## `englishSentence`

`englishSentence` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def englishSentence(nb_words: int=..., variable_nb_words: bool=...) -> str
```

Firma real para `en_PH`:

```text
fake.englishSentence(nb_words: int = 6, variable_nb_words: bool = True) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `nb_words` | Número objetivo de palabras. |
| `variable_nb_words` | Permite variar el número objetivo de palabras. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishSentence()
```

<a id="faker-englishsentences"></a>

## `englishSentences`

`englishSentences` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def englishSentences(nb: int=...) -> list[str]
```

Firma real para `en_PH`:

```text
fake.englishSentences(nb: int = 3) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `nb` | Cantidad de resultados solicitados. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishSentences()
```

<a id="faker-englishtext"></a>

## `englishText`

`englishText` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def englishText(max_nb_chars: int=...) -> str
```

Firma real para `en_PH`:

```text
fake.englishText(max_nb_chars: int = 200) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `max_nb_chars` | Máximo de caracteres del texto solicitado. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishText()
```

<a id="faker-englishtexts"></a>

## `englishTexts`

`englishTexts` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def englishTexts(nb_texts: int=..., max_nb_chars: int=...) -> list[str]
```

Firma real para `en_PH`:

```text
fake.englishTexts(nb_texts: int = 3, max_nb_chars: int = 200) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `nb_texts` | Número de textos a devolver. |
| `max_nb_chars` | Máximo de caracteres del texto solicitado. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishTexts()
```

<a id="faker-englishword"></a>

## `englishWord`

`englishWord` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def englishWord() -> str
```

Firma real para `en_PH`:

```text
fake.englishWord() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishWord()
```

<a id="faker-englishwords"></a>

## `englishWords`

`englishWords` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def englishWords(nb: int=..., unique: bool=...) -> list[str]
```

Firma real para `en_PH`:

```text
fake.englishWords(nb: int = 3, unique: bool = False) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `nb` | Cantidad de resultados solicitados. |
| `unique` | Solicita selección sin valores repetidos dentro de esta llamada. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.englishWords()
```

<a id="faker-enum"></a>

## `enum`

Selecciona un miembro de la clase Enum suministrada, no solo su valor.

Contrato tipado de Orionis:

```text
def enum(enum_cls: type[TEnum]) -> TEnum
```

Firma real para `en_US`:

```text
fake.enum(enum_cls: Type[~TEnum]) -> ~TEnum
```


| Parámetro | Propósito |
| --- | --- |
| `enum_cls` | Clase Enum de la que se seleccionará un miembro. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

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

`estado` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def estado() -> tuple[str, str]
```

Firma real para `pt_BR`:

```text
fake.estado() -> Tuple[str, str]
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.estado()
```

<a id="faker-estadonome"></a>

## `estadoNome`

`estadoNome` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def estadoNome() -> str
```

Firma real para `pt_BR`:

```text
fake.estadoNome() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.estadoNome()
```

<a id="faker-estadosigla"></a>

## `estadoSigla`

`estadoSigla` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def estadoSigla() -> str
```

Firma real para `pt_BR`:

```text
fake.estadoSigla() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_BR`.

```python
fake = SampleFactory(locale="pt_BR", seed=7).fake
value = fake.estadoSigla()
```

<a id="faker-fileextension"></a>

## `fileExtension`

`fileExtension` genera nombres, rutas y tipos de archivo ficticios; no crea archivos en disco.

Contrato tipado de Orionis:

```text
def fileExtension(category: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.fileExtension(category: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `category` | Categoría de datos del proveedor. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.fileExtension()
```

<a id="faker-filename"></a>

## `fileName`

`fileName` genera nombres, rutas y tipos de archivo ficticios; no crea archivos en disco.

Contrato tipado de Orionis:

```text
def fileName(category: str | None=..., extension: str | None=...) -> str
```

Firma real para `en_US`:

```text
fake.fileName(category: str | None = None, extension: str | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `category` | Categoría de datos del proveedor. |
| `extension` | Extensión del nombre/ruta de archivo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.fileName()
```

<a id="faker-filepath"></a>

## `filePath`

`filePath` genera nombres, rutas y tipos de archivo ficticios; no crea archivos en disco.

Contrato tipado de Orionis:

```text
def filePath(depth: int=..., category: str | None=..., extension: str | Sequence[str] | None=..., absolute: bool | None=..., file_system_rule: Literal['linux', 'windows']=..., allowed_path_traversal_elements: Sequence[str] | None=...) -> str
```

Firma real para `en_US`:

```text
fake.filePath(depth: int = 1, category: str | None = None, extension: str | Sequence[str] | None = None, absolute: bool | None = True, file_system_rule: Literal['linux', 'windows'] = 'linux', allowed_path_traversal_elements: Sequence[str] | None = None) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `depth` | Cantidad de niveles de directorios de la ruta ficticia. |
| `category` | Categoría de datos del proveedor. |
| `extension` | Extensión del nombre/ruta de archivo. |
| `absolute` | Genera ruta absoluta en vez de relativa. |
| `file_system_rule` | Convención de ruta linux o windows; no opera sobre ese sistema de archivos. |
| `allowed_path_traversal_elements` | Segmentos como . o .. que pueden aparecer para probar manejo de rutas; None los omite. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.filePath()
```

<a id="faker-firefox"></a>

## `firefox`

`firefox` genera cadenas y componentes User-Agent para simular clientes.

Contrato tipado de Orionis:

```text
def firefox() -> str
```

Firma real para `en_US`:

```text
fake.firefox() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firefox()
```

<a id="faker-firstkananame"></a>

## `firstKanaName`

`firstKanaName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstKanaName() -> str
```

Firma real para `ja_JP`:

```text
fake.firstKanaName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstKanaName()
```

<a id="faker-firstkananamefemale"></a>

## `firstKanaNameFemale`

`firstKanaNameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstKanaNameFemale() -> str
```

Firma real para `ja_JP`:

```text
fake.firstKanaNameFemale() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstKanaNameFemale()
```

<a id="faker-firstkananamemale"></a>

## `firstKanaNameMale`

`firstKanaNameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstKanaNameMale() -> str
```

Firma real para `ja_JP`:

```text
fake.firstKanaNameMale() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstKanaNameMale()
```

<a id="faker-firstname"></a>

## `firstName`

`firstName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstName() -> str
```

Firma real para `en_US`:

```text
fake.firstName() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firstName()
```

<a id="faker-firstnameest"></a>

## `firstNameEst`

`firstNameEst` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameEst() -> str
```

Firma real para `et_EE`:

```text
fake.firstNameEst() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameEst()
```

<a id="faker-firstnamefemale"></a>

## `firstNameFemale`

`firstNameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameFemale() -> str
```

Firma real para `en_US`:

```text
fake.firstNameFemale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firstNameFemale()
```

<a id="faker-firstnamefemaleabbreviated"></a>

## `firstNameFemaleAbbreviated`

`firstNameFemaleAbbreviated` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameFemaleAbbreviated() -> str
```

Firma real para `hu_HU`:

```text
fake.firstNameFemaleAbbreviated() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.firstNameFemaleAbbreviated()
```

<a id="faker-firstnamefemalecommon"></a>

## `firstNameFemaleCommon`

`firstNameFemaleCommon` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameFemaleCommon() -> str
```

Firma real para `bn_BD`:

```text
fake.firstNameFemaleCommon() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameFemaleCommon()
```

<a id="faker-firstnamefemaleest"></a>

## `firstNameFemaleEst`

`firstNameFemaleEst` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameFemaleEst() -> str
```

Firma real para `et_EE`:

```text
fake.firstNameFemaleEst() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameFemaleEst()
```

<a id="faker-firstnamefemalehinduism"></a>

## `firstNameFemaleHinduism`

`firstNameFemaleHinduism` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameFemaleHinduism() -> str
```

Firma real para `bn_BD`:

```text
fake.firstNameFemaleHinduism() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameFemaleHinduism()
```

<a id="faker-firstnamefemaleislamic"></a>

## `firstNameFemaleIslamic`

`firstNameFemaleIslamic` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameFemaleIslamic() -> str
```

Firma real para `bn_BD`:

```text
fake.firstNameFemaleIslamic() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameFemaleIslamic()
```

<a id="faker-firstnamefemalepair"></a>

## `firstNameFemalePair`

`firstNameFemalePair` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameFemalePair() -> tuple[str, str, str]
```

Firma real para `ja_JP`:

```text
fake.firstNameFemalePair() -> Tuple[str, str, str]
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstNameFemalePair()
```

<a id="faker-firstnamefemalerus"></a>

## `firstNameFemaleRus`

`firstNameFemaleRus` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameFemaleRus() -> str
```

Firma real para `et_EE`:

```text
fake.firstNameFemaleRus() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameFemaleRus()
```

<a id="faker-firstnamemale"></a>

## `firstNameMale`

`firstNameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameMale() -> str
```

Firma real para `en_US`:

```text
fake.firstNameMale() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firstNameMale()
```

<a id="faker-firstnamemaleabbreviated"></a>

## `firstNameMaleAbbreviated`

`firstNameMaleAbbreviated` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameMaleAbbreviated() -> str
```

Firma real para `hu_HU`:

```text
fake.firstNameMaleAbbreviated() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.firstNameMaleAbbreviated()
```

<a id="faker-firstnamemalecommon"></a>

## `firstNameMaleCommon`

`firstNameMaleCommon` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameMaleCommon() -> str
```

Firma real para `bn_BD`:

```text
fake.firstNameMaleCommon() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameMaleCommon()
```

<a id="faker-firstnamemaleest"></a>

## `firstNameMaleEst`

`firstNameMaleEst` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameMaleEst() -> str
```

Firma real para `et_EE`:

```text
fake.firstNameMaleEst() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameMaleEst()
```

<a id="faker-firstnamemalehinduism"></a>

## `firstNameMaleHinduism`

`firstNameMaleHinduism` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameMaleHinduism() -> str
```

Firma real para `bn_BD`:

```text
fake.firstNameMaleHinduism() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameMaleHinduism()
```

<a id="faker-firstnamemaleislamic"></a>

## `firstNameMaleIslamic`

`firstNameMaleIslamic` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameMaleIslamic() -> str
```

Firma real para `bn_BD`:

```text
fake.firstNameMaleIslamic() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `bn_BD`.

```python
fake = SampleFactory(locale="bn_BD", seed=7).fake
value = fake.firstNameMaleIslamic()
```

<a id="faker-firstnamemalepair"></a>

## `firstNameMalePair`

`firstNameMalePair` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameMalePair() -> tuple[str, str, str]
```

Firma real para `ja_JP`:

```text
fake.firstNameMalePair() -> Tuple[str, str, str]
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstNameMalePair()
```

<a id="faker-firstnamemalerus"></a>

## `firstNameMaleRus`

`firstNameMaleRus` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameMaleRus() -> str
```

Firma real para `et_EE`:

```text
fake.firstNameMaleRus() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameMaleRus()
```

<a id="faker-firstnamenonbinary"></a>

## `firstNameNonbinary`

`firstNameNonbinary` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameNonbinary() -> str
```

Firma real para `en_US`:

```text
fake.firstNameNonbinary() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.firstNameNonbinary()
```

<a id="faker-firstnamepair"></a>

## `firstNamePair`

`firstNamePair` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNamePair() -> tuple[str, str, str]
```

Firma real para `ja_JP`:

```text
fake.firstNamePair() -> Tuple[str, str, str]
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstNamePair()
```

<a id="faker-firstnamerus"></a>

## `firstNameRus`

`firstNameRus` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameRus() -> str
```

Firma real para `et_EE`:

```text
fake.firstNameRus() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `et_EE`.

```python
fake = SampleFactory(locale="et_EE", seed=7).fake
value = fake.firstNameRus()
```

<a id="faker-firstnameunisex"></a>

## `firstNameUnisex`

`firstNameUnisex` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstNameUnisex() -> str
```

Firma real para `or_IN`:

```text
fake.firstNameUnisex() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `or_IN`, `vi_VN`.

```python
fake = SampleFactory(locale="or_IN", seed=7).fake
value = fake.firstNameUnisex()
```

<a id="faker-firstromanizedname"></a>

## `firstRomanizedName`

`firstRomanizedName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstRomanizedName() -> str
```

Firma real para `ja_JP`:

```text
fake.firstRomanizedName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `ja_JP`, `zh_CN`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstRomanizedName()
```

<a id="faker-firstromanizednamefemale"></a>

## `firstRomanizedNameFemale`

`firstRomanizedNameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstRomanizedNameFemale() -> str
```

Firma real para `ja_JP`:

```text
fake.firstRomanizedNameFemale() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ja_JP`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstRomanizedNameFemale()
```

<a id="faker-firstromanizednamemale"></a>

## `firstRomanizedNameMale`

`firstRomanizedNameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def firstRomanizedNameMale() -> str
```

Firma real para `ja_JP`:

```text
fake.firstRomanizedNameMale() -> str
```


Disponibilidad verificada: 2 locales. Ejemplos de locales: `ja_JP`, `zh_TW`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.firstRomanizedNameMale()
```

<a id="faker-fixedwidth"></a>

## `fixedWidth`

Devuelve texto de ancho fijo según tuplas (ancho, definición, argumentos opcionales) en data_columns.

Contrato tipado de Orionis:

```text
def fixedWidth(data_columns: list[tuple[int, str] | tuple[int, str, dict[str, Any]]] | None=..., num_rows: int=..., align: str=...) -> str
```

Firma real para `en_US`:

```text
fake.fixedWidth(data_columns: List[Tuple[int, str] | Tuple[int, str, Dict[str, Any]]] | None = None, num_rows: int = 10, align: str = 'left') -> str
```


| Parámetro | Propósito |
| --- | --- |
| `data_columns` | Definición de estructura, columnas o tokens generadores. |
| `num_rows` | Cantidad de filas de datos serializados. |
| `align` | Alineación de campos de ancho fijo: left, middle o right. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.fixedWidth(num_rows=2)
```

<a id="faker-floornumber"></a>

## `floorNumber`

`floorNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def floorNumber() -> str
```

Firma real para `en_PH`:

```text
fake.floorNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.floorNumber()
```

<a id="faker-floorunitnumber"></a>

## `floorUnitNumber`

`floorUnitNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def floorUnitNumber() -> str
```

Firma real para `en_PH`:

```text
fake.floorUnitNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.floorUnitNumber()
```

<a id="faker-freeemail"></a>

## `freeEmail`

`freeEmail` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def freeEmail() -> str
```

Firma real para `en_US`:

```text
fake.freeEmail() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.freeEmail()
```

<a id="faker-freeemaildomain"></a>

## `freeEmailDomain`

`freeEmailDomain` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def freeEmailDomain() -> str
```

Firma real para `en_US`:

```text
fake.freeEmailDomain() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.freeEmailDomain()
```

<a id="faker-freguesia"></a>

## `freguesia`

`freguesia` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def freguesia() -> str
```

Firma real para `pt_PT`:

```text
fake.freguesia() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `pt_PT`.

```python
fake = SampleFactory(locale="pt_PT", seed=7).fake
value = fake.freguesia()
```

<a id="faker-frequentstreetname"></a>

## `frequentStreetName`

`frequentStreetName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def frequentStreetName() -> str
```

Firma real para `hu_HU`:

```text
fake.frequentStreetName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `hu_HU`.

```python
fake = SampleFactory(locale="hu_HU", seed=7).fake
value = fake.frequentStreetName()
```

<a id="faker-fullname"></a>

## `fullName`

`fullName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def fullName(gender: Literal['M', 'F', 'X'] | None=..., short: bool | None=...) -> str
```

Firma real para `uk_UA`:

```text
fake.fullName(gender: Literal['M', 'F', 'X'] | None = None, short: bool | None = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `gender` | Selección de género según los valores locales admitidos. |
| `short` | Solicita nombre completo en su forma abreviada local. |

Disponibilidad verificada: 1 locales. Ejemplos de locales: `uk_UA`.

```python
fake = SampleFactory(locale="uk_UA", seed=7).fake
value = fake.fullName()
```

<a id="faker-futuredate"></a>

## `futureDate`

`futureDate` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def futureDate(end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=...) -> datetime.date
```

Firma real para `en_US`:

```text
fake.futureDate(end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '+30d') -> datetime.date
```


| Parámetro | Propósito |
| --- | --- |
| `end_date` | Extremo final de fecha/hora o intervalo relativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.futureDate()
```

<a id="faker-futuredatetime"></a>

## `futureDatetime`

`futureDatetime` genera fechas, horas e intervalos para fixtures temporales.

Contrato tipado de Orionis:

```text
def futureDatetime(end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int=..., tzinfo: datetime.tzinfo | None=...) -> datetime.datetime
```

Firma real para `en_US`:

```text
fake.futureDatetime(end_date: datetime.date | datetime.datetime | datetime.timedelta | str | int = '+30d', tzinfo: datetime.tzinfo | None = None) -> datetime.datetime
```


| Parámetro | Propósito |
| --- | --- |
| `end_date` | Extremo final de fecha/hora o intervalo relativo. |
| `tzinfo` | Timezone del datetime producido; None usa el comportamiento nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.futureDatetime()
```

<a id="faker-gemstonename"></a>

## `gemstoneName`

`gemstoneName` genera valores y estructuras auxiliares de prueba; la forma de retorno depende del método.

Contrato tipado de Orionis:

```text
def gemstoneName() -> str
```

Firma real para `en_PH`:

```text
fake.gemstoneName() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.gemstoneName()
```

<a id="faker-getarguments"></a>

## `getArguments`

Recupera un argumento o el dict del grupo; grupo/argumento ausente devuelve None. El dict retornado es el de la configuración nativa.

Helper accesible por el despacho dinámico de la fachada; no está declarado en `_ProviderMethods`.

Firma real para `en_US`:

```text
fake.getArguments(group: str, argument: str | None = None) -> Any
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
fake.setArguments("small", {"min_value": 1, "max_value": 3})
value = fake.getArguments("small")
```

<a id="faker-getproviders"></a>

## `getProviders`

Devuelve la lista de instancias de proveedores registrados. Es introspección del backend, no generación de datos; no es un catálogo de métodos disponible en todo locale.

Helper accesible por el despacho dinámico de la fachada; no está declarado en `_ProviderMethods`.

Firma real para `en_US`:

```text
fake.getProviders() -> List[ForwardRef('BaseProvider')]
```

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.getProviders()
```

<a id="faker-getwordslist"></a>

## `getWordsList`

`getWordsList` genera texto simulado para contenido y formularios.

Contrato tipado de Orionis:

```text
def getWordsList(part_of_speech: str | None=..., ext_word_list: Sequence[str] | None=...) -> list[str]
```

Firma real para `en_US`:

```text
fake.getWordsList(part_of_speech: str | None = None, ext_word_list: Sequence[str] | None = None) -> List[str]
```


| Parámetro | Propósito |
| --- | --- |
| `part_of_speech` | Categoría gramatical del vocabulario cuando el locale la soporta. |
| `ext_word_list` | Vocabulario alternativo o None para el nativo. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.getWordsList()
```

<a id="faker-givenname"></a>

## `givenName`

`givenName` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def givenName() -> str
```

Firma real para `es_CL`:

```text
fake.givenName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.givenName()
```

<a id="faker-givennamefemale"></a>

## `givenNameFemale`

`givenNameFemale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def givenNameFemale() -> str
```

Firma real para `es_CL`:

```text
fake.givenNameFemale() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.givenNameFemale()
```

<a id="faker-givennamemale"></a>

## `givenNameMale`

`givenNameMale` genera nombres y componentes de identidad para perfiles de prueba.

Contrato tipado de Orionis:

```text
def givenNameMale() -> str
```

Firma real para `es_CL`:

```text
fake.givenNameMale() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.givenNameMale()
```

<a id="faker-globearea2landlinenumber"></a>

## `globeArea2LandlineNumber`

`globeArea2LandlineNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def globeArea2LandlineNumber() -> str
```

Firma real para `en_PH`:

```text
fake.globeArea2LandlineNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.globeArea2LandlineNumber()
```

<a id="faker-globemobilenumber"></a>

## `globeMobileNumber`

`globeMobileNumber` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def globeMobileNumber() -> str
```

Firma real para `en_PH`:

```text
fake.globeMobileNumber() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.globeMobileNumber()
```

<a id="faker-globemobilenumberprefix"></a>

## `globeMobileNumberPrefix`

`globeMobileNumberPrefix` genera números telefónicos ficticios con formatos locales.

Contrato tipado de Orionis:

```text
def globeMobileNumberPrefix() -> str
```

Firma real para `en_PH`:

```text
fake.globeMobileNumberPrefix() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.globeMobileNumberPrefix()
```

<a id="faker-gou"></a>

## `gou`

`gou` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def gou() -> str
```

Firma real para `ja_JP`:

```text
fake.gou() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `ja_JP`.

```python
fake = SampleFactory(locale="ja_JP", seed=7).fake
value = fake.gou()
```

<a id="faker-gsis"></a>

## `gsis`

`gsis` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def gsis() -> str
```

Firma real para `en_PH`:

```text
fake.gsis() -> str
```


Disponibilidad verificada: 3 locales. Ejemplos de locales: `en_PH`, `fil_PH`, `tl_PH`.

```python
fake = SampleFactory(locale="en_PH", seed=7).fake
value = fake.gsis()
```

<a id="faker-gstin"></a>

## `gstin`

`gstin` genera identificadores administrativos o fiscales ficticios; el formato depende del país.

Contrato tipado de Orionis:

```text
def gstin() -> str
```

Firma real para `en_IN`:

```text
fake.gstin() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `en_IN`.

```python
fake = SampleFactory(locale="en_IN", seed=7).fake
value = fake.gstin()
```

<a id="faker-hexcolor"></a>

## `hexColor`

`hexColor` genera colores y sus representaciones para datos de interfaz.

Contrato tipado de Orionis:

```text
def hexColor() -> str
```

Firma real para `en_US`:

```text
fake.hexColor() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.hexColor()
```

<a id="faker-hexify"></a>

## `hexify`

Sustituye el marcador de la plantilla por dígitos hexadecimales; `upper` controla mayúsculas.

Contrato tipado de Orionis:

```text
def hexify(text: str=..., upper: bool=...) -> str
```

Firma real para `en_US`:

```text
fake.hexify(text: str = '^^^^', upper: bool = False) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `text` | Plantilla o texto que procesará el proveedor. |
| `upper` | Usa letras hexadecimales mayúsculas. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.hexify()
```

<a id="faker-highwayname"></a>

## `highwayName`

`highwayName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def highwayName() -> str
```

Firma real para `es_CL`:

```text
fake.highwayName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.highwayName()
```

<a id="faker-historicpeoplestreetname"></a>

## `historicPeopleStreetName`

`historicPeopleStreetName` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def historicPeopleStreetName() -> str
```

Firma real para `es_CL`:

```text
fake.historicPeopleStreetName() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `es_CL`.

```python
fake = SampleFactory(locale="es_CL", seed=7).fake
value = fake.historicPeopleStreetName()
```

<a id="faker-hostname"></a>

## `hostname`

`hostname` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def hostname(levels: int=...) -> str
```

Firma real para `en_US`:

```text
fake.hostname(levels: int = 1) -> str
```


| Parámetro | Propósito |
| --- | --- |
| `levels` | Número de niveles del dominio o hostname. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.hostname()
```

<a id="faker-housenumber"></a>

## `houseNumber`

`houseNumber` genera direcciones y divisiones geográficas para formularios, entregas y perfiles de prueba.

Contrato tipado de Orionis:

```text
def houseNumber() -> str
```

Firma real para `az_AZ`:

```text
fake.houseNumber() -> str
```


Disponibilidad verificada: 1 locales. Ejemplos de locales: `az_AZ`.

```python
fake = SampleFactory(locale="az_AZ", seed=7).fake
value = fake.houseNumber()
```

<a id="faker-httpmethod"></a>

## `httpMethod`

`httpMethod` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def httpMethod() -> str
```

Firma real para `en_US`:

```text
fake.httpMethod() -> str
```


Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.httpMethod()
```

<a id="faker-httpstatuscode"></a>

## `httpStatusCode`

`httpStatusCode` genera direcciones y formatos de Internet para datos de prueba; generar una cadena no abre una conexión.

Contrato tipado de Orionis:

```text
def httpStatusCode(include_unassigned: bool=...) -> int
```

Firma real para `en_US`:

```text
fake.httpStatusCode(include_unassigned: bool = True) -> int
```


| Parámetro | Propósito |
| --- | --- |
| `include_unassigned` | Incluye códigos de estado HTTP sin asignación o sin uso. |

Disponibilidad verificada: 110 locales. Ejemplos de locales: `en_US`, `es_CO`, `es_ES`, `am_ET`, `ar_AA`, `ar_AE`, `ar_BH`, `ar_DZ`.

```python
fake = SampleFactory(locale="en_US", seed=7).fake
value = fake.httpStatusCode()
```
