---
title: "Variables y configuración tipada"
description: "Define y convierte los diez tipos de valores de entorno admitidos por Orionis desde archivos de configuración."
editUrl: true
lastUpdated: false
---

Los valores de `.env` se almacenan como texto, pero `Env.get()` y `env()` pueden devolver tipos Python. Define el formato adecuado en el archivo y léelo **exclusivamente desde `config/`**. Durante el runtime, utiliza la configuración resuelta, como se explica en [Entorno](/es/environment).

## Un ejemplo completo

Este `.env` utiliza los diez prefijos disponibles:

```dotenv
REPORTS_NAME="str:Weekly report"
REPORTS_LIMIT=int:100
REPORTS_TIMEOUT=float:2.5
REPORTS_ENABLED=bool:on
REPORTS_RECIPIENTS="list:['team@example.test', 'ops@example.test']"
REPORTS_OPTIONS="dict:{'retries': 3, 'notify': True}"
REPORTS_WINDOW="tuple:(8, 18)"
REPORTS_TAGS="set:{'daily', 'internal'}"
REPORTS_DIRECTORY=path:storage/reports
REPORTS_BANNER=base64:SGVsbG8=
```

Crea `config/reports.py` con las lecturas correspondientes:

```python
from dataclasses import dataclass, field
from orionis.environment import env


@dataclass(frozen=True, kw_only=True)
class Reports:
    name: str = field(
        default_factory=lambda: env("REPORTS_NAME", "Weekly report"),
    )
    limit: int = field(
        default_factory=lambda: env("REPORTS_LIMIT", 100),
    )
    timeout: float = field(
        default_factory=lambda: env("REPORTS_TIMEOUT", 2.5),
    )
    enabled: bool = field(
        default_factory=lambda: env("REPORTS_ENABLED", False),
    )
    recipients: list[str] = field(
        default_factory=lambda: env("REPORTS_RECIPIENTS", []),
    )
    options: dict[str, object] = field(
        default_factory=lambda: env("REPORTS_OPTIONS", {}),
    )
    window: tuple[int, int] = field(
        default_factory=lambda: env("REPORTS_WINDOW", (8, 18)),
    )
    tags: set[str] = field(
        default_factory=lambda: env("REPORTS_TAGS", set()),
    )
    directory: str = field(
        default_factory=lambda: env("REPORTS_DIRECTORY", "storage/reports"),
    )
    banner: str | bytes = field(
        default_factory=lambda: env("REPORTS_BANNER", ""),
    )
```

Las fábricas construyen los valores de cada instancia de configuración. Una vez creada la aplicación, consulta claves como `app.config("reports.limit")` y `app.config("reports.options")`; no repitas las lecturas de entorno desde los componentes de la aplicación.

Los resultados descritos en esta página son los de la lectura de entorno. Revisa la [serialización de la configuración compilada](/es/environment/compiled-configuration) antes de depender de la preservación de tipos como tuplas, conjuntos o bytes a través del almacenamiento JSON.

<a id="env-types"></a>
## Prefijos admitidos

Escribe el prefijo en minúsculas, sin espacios antes de `:`. `int:100` se reconoce; `INT:100` y `int :100` permanecen como texto al leerlos con `Env.get()`.

| Prefijo | Tipo de resultado | Ejemplo del resultado |
|---|---|---|
| `str:` | `str` | `"Weekly report"` |
| `int:` | `int` | `100` |
| `float:` | `float` | `2.5` |
| `bool:` | `bool` | `True` |
| `list:` | `list` | `["team@example.test", "ops@example.test"]` |
| `dict:` | `dict` | `{"retries": 3, "notify": True}` |
| `tuple:` | `tuple` | `(8, 18)` |
| `set:` | `set` | `{"daily", "internal"}` |
| `path:` | `str` | `"storage/reports"` |
| `base64:` | `str` o `bytes` | `"Hello"` |

<a id="env-type-str"></a>
### `str:`: conservar texto

Úsalo para códigos, identificadores o textos que podrían interpretarse como otro tipo:

```dotenv
ACCOUNT_CODE=str:00125
DISPLAY_FLAG=str:false
EMPTY_LABEL=str:
```

Al leerlos desde `config/`, los resultados son `"00125"`, `"false"` y `""`. Las comillas de dotenv solo delimitan el valor: `ACCOUNT_CODE="123"` sigue convirtiéndose al entero `123`. El prefijo `str:` es el mecanismo para impedir esa conversión.

La conversión elimina espacios iniciales del contenido posterior al prefijo. No se debe utilizar para conservar esos espacios iniciales.

<a id="env-type-int"></a>
### `int:`: números enteros

Úsalo para puertos, cantidades o límites:

```dotenv
REPORTS_LIMIT=int:100
REPORTS_OFFSET=int:-5
```

Produce `100` y `-5`. Acepta espacios alrededor del número y los formatos que admite `int(texto)` con su base predeterminada. `int:many` y `int:2.5` lanzan `ValueError`; no se reemplazan por el valor predeterminado de la lectura.

<a id="env-type-float"></a>
### `float:`: números decimales

Úsalo para tiempos de espera o factores:

```dotenv
REPORTS_TIMEOUT=float:2.5
REPORTS_FACTOR=float:1e-3
```

Produce `2.5` y `0.001` mediante `float(texto)`. El separador decimal es `.`; `float:2,5` lanza `ValueError`.

<a id="env-type-bool"></a>
### `bool:`: activadores booleanos

Úsalo para habilitar o deshabilitar opciones:

```dotenv
REPORTS_ENABLED=bool:on
REPORTS_NOTIFY=bool:disabled
```

`true`, `1`, `yes`, `on` y `enabled` producen `True`, sin distinguir mayúsculas y después de eliminar espacios. `false`, `0`, `no`, `off` y `disabled` producen `False`.

**La lectura de `Env.get()` y `env()` considera `False` cualquier otro contenido después de `bool:`.** Por ejemplo, `bool:treu` también devuelve `False`; no valida que sea una de las palabras negativas anteriores. Usa las representaciones documentadas para evitar desactivar una opción por un error de escritura. La conversión explícita con `EnvironmentCaster(...).get()` sí valida ambos grupos y se explica más adelante.

<a id="env-type-list"></a>
### `list:`: listas ordenadas

Úsalo para destinatarios, orígenes o valores que mantienen un orden:

```dotenv
REPORTS_RECIPIENTS="list:['team@example.test', 'ops@example.test']"
REPORTS_EMPTY_LIST=list:[]
```

Produce una lista con dos cadenas y una lista vacía. El contenido debe ser un literal Python de lista; `list:team,ops` no separa texto por comas. Tampoco convierte elementos automáticamente: `list:['1', 2]` conserva una cadena y un entero.

<a id="env-type-dict"></a>
### `dict:`: opciones con nombre

Úsalo para agrupar ajustes relacionados:

```dotenv
REPORTS_OPTIONS="dict:{'retries': 3, 'notify': True}"
```

Produce `{"retries": 3, "notify": True}`. La sintaxis interna es la de un literal Python seguro: utiliza `True`, `False` y `None` para esos valores. No es un analizador JSON; `dict:{"notify": true}` falla porque `true` no es un literal Python.

<a id="env-type-tuple"></a>
### `tuple:`: agrupaciones posicionales

Úsalo cuando los valores representan posiciones concretas, como una ventana horaria:

```dotenv
REPORTS_WINDOW="tuple:(8, 18)"
REPORTS_SINGLE_VALUE="tuple:('daily',)"
```

Produce `(8, 18)` y `("daily",)`. La coma es necesaria para una tupla de un elemento. `tuple:[8, 18]` es una lista y se rechaza; el prefijo no convierte una colección de otro tipo.

<a id="env-type-set"></a>
### `set:`: valores únicos

Úsalo para conjuntos donde interesa la pertenencia y no el orden:

```dotenv
REPORTS_TAGS="set:{'daily', 'internal', 'daily'}"
REPORTS_EMPTY_SET=set:set()
```

Produce `{"daily", "internal"}` y `set()`. Los duplicados desaparecen y no se garantiza un orden. `set:{}` no crea un conjunto vacío: `{}` es un diccionario y se rechaza. Los elementos deben poder formar parte de un conjunto Python.

<a id="env-type-path"></a>
### `path:`: rutas normalizadas

Úsalo para ajustes que contienen rutas de archivos o carpetas:

```dotenv
REPORTS_DIRECTORY=path:storage/reports
REPORTS_WINDOWS_DIRECTORY='path:storage\reports'
```

Ambas lecturas devuelven `"storage/reports"`. El resultado es una cadena con separadores POSIX; no es un objeto `Path`. Leer `path:` no crea la carpeta, no verifica que exista y no convierte una ruta relativa en absoluta.

La serialización explícita `EnvironmentCaster(valor).to("path")` sí antepone el directorio de trabajo cuando el valor es relativo. Esta diferencia entre lectura y serialización es relevante al preparar valores para `.env`.

<a id="env-type-base64"></a>
### `base64:`: contenido codificado

Úsalo cuando el formato del ajuste requiere contenido codificado en Base64:

```dotenv
REPORTS_BANNER=base64:SGVsbG8=
REPORTS_BINARY=base64:/w==
```

La primera lectura devuelve la cadena `"Hello"`; la segunda devuelve `b"\xff"`, porque el contenido decodificado no es texto UTF-8 válido. Un payload Base64 inválido lanza `ValueError`.

El componente decodifica el prefijo al leerlo. Base64 no cifra el contenido: no convierte un secreto en un valor protegido.

## Valores sin prefijo

El análisis de un valor sin prefijo sigue este orden:

1. Una cadena vacía devuelve `None`.
2. `none`, `null`, `nan` y `nil`, sin distinguir mayúsculas y eliminando espacios, devuelven `None`.
3. `true` y `false`, también sin distinguir mayúsculas, devuelven booleanos.
4. Se intenta interpretar un literal Python mediante `ast.literal_eval`: números, cadenas entrecomilladas y colecciones literales.
5. Si no es un literal válido, se conserva la cadena original.

```dotenv
AUTO_LIMIT=100
AUTO_ENABLED=true
AUTO_OPTIONS="{'notify': True, 'retries': 3}"
AUTO_URL=https://example.test/reports
AUTO_WORD=yes
```

Los resultados son `100`, `True`, un diccionario, la URL como cadena y `"yes"`. Sin `bool:`, palabras como `yes` y `off` no son activadores booleanos. Un prefijo desconocido, por ejemplo `json:{}`, no añade un tipo nuevo y normalmente permanece como texto.

Los literales se evalúan de forma segura; no se ejecutan expresiones ni llamadas arbitrarias. El componente no valida los tipos de cada elemento de las colecciones según la anotación de una dataclass.

## Cuándo se aplica el valor predeterminado

Las firmas de lectura son:

```text
env(key: str, default: object | None = None) -> object
Env.get(key: str, default: object | None = None) -> object
```

Con estas entradas:

```dotenv
REPORTS_EMPTY=
REPORTS_NULL=null
REPORTS_EMPTY_TEXT=str:
REPORTS_ZERO=int:0
REPORTS_DISABLED=bool:false
```

| Lectura dentro de `config/` | Resultado |
|---|---|
| `env("REPORTS_MISSING", 100)` | `100`, si la clave no existe en el proceso. |
| `env("REPORTS_EMPTY", 100)` | `None`. |
| `env("REPORTS_NULL", 100)` | `None`. |
| `env("REPORTS_EMPTY_TEXT", "fallback")` | `""`. |
| `env("REPORTS_ZERO", 100)` | `0`. |
| `env("REPORTS_DISABLED", True)` | `False`. |
| `env("REPORTS_MISSING", "int:100")` | `"int:100"`, sin convertir el default. |

Una línea que contiene solo un nombre, sin `=`, figura con `None` en la instantánea de `Env.all()`, pero no publica un valor en el proceso. Si esa variable tampoco estaba en el sistema, `Env.get()` devuelve el default.

El default no actúa como validación ni corrige un prefijo inválido. Proporciona el valor Python que necesita la configuración, por ejemplo `100`, `False` o `[]`, en lugar de una cadena con prefijo.

## Conversión explícita en la configuración

`EnvironmentCaster` es la utilidad que interpreta o serializa valores tipados. Implementa el contrato `IEnvironmentCaster`, ubicado en `orionis.environment.contracts.caster`, que define las operaciones `get()` y `to()`. Su uso explícito también debe permanecer en los archivos de configuración. No es necesario importarla para las lecturas habituales con `Env.get()`.

<a id="caster-construction"></a>
### Construcción

```text
EnvironmentCaster(raw: str | object) -> None
```

Acepta un objeto o una cadena. Si reconoce un prefijo, conserva el contenido para interpretarlo en `get()`; si no, conserva el valor sin convertir. A diferencia del reconocimiento realizado por `Env.get()`, el constructor normaliza el prefijo con eliminación de espacios y conversión a minúsculas.

<a id="caster-options"></a>
<a id="caster-supported-types"></a>
### `OPTIONS` y `supportedTypes()`

`OPTIONS` y `supportedTypes() -> frozenset[str]` exponen los mismos diez nombres de tipo de la tabla anterior. `EnvironmentValueType` contiene los miembros `STR`, `INT`, `FLOAT`, `BOOL`, `LIST`, `DICT`, `TUPLE`, `SET`, `PATH` y `BASE64`, cuyos valores son esos nombres en minúsculas.

```python
# Una comprobación de configuración, dentro de config/reports.py.
from orionis.environment.dynamic.caster import EnvironmentCaster


SUPPORTED_REPORT_TYPES = EnvironmentCaster.supportedTypes()
assert "dict" in SUPPORTED_REPORT_TYPES
assert SUPPORTED_REPORT_TYPES == EnvironmentCaster.OPTIONS
```

<a id="caster-get"></a>
### `get() -> object`

Interpreta el valor de la instancia. Para validar explícitamente un booleano, utiliza un valor de texto y realiza la conversión al construir tu configuración. Esta es una alternativa de `config/reports.py` enfocada en ese caso:

```dotenv
REPORTS_SWITCH=str:off
```

```python
from dataclasses import dataclass, field
from orionis.environment import env
from orionis.environment.dynamic.caster import EnvironmentCaster


def report_switch() -> bool:
    value = env("REPORTS_SWITCH", "off")
    return EnvironmentCaster(f"bool:{value}").get()


@dataclass(frozen=True, kw_only=True)
class Reports:
    enabled: bool = field(default_factory=report_switch)
```

`off` produce `False`; `str:unexpected` en `.env` hace que esta configuración lance `ValueError`. Conserva `str:` en la entrada para que el valor original llegue a esta validación: si utilizas `bool:unexpected`, la lectura previa de `env()` ya lo habrá convertido a `False`.

`get()` conserva los errores de conversión como `ValueError` o `TypeError`, según el caso, y envuelve otros fallos como `ValueError`. El caso vacío `EnvironmentCaster("str:").get()` falla; la lectura habitual `env()` utiliza una ruta diferente y sí devuelve `""`.

<a id="caster-parse-typed"></a>
### `parseTyped(value_str: str) -> object`

Interpreta directamente una cadena con formato `tipo:contenido`. Normaliza el prefijo y utiliza una conversión rápida para `str`, `int`, `float` y `bool`; los demás tipos pasan por una instancia del conversor.

```python
# Expresiones de conversión durante la carga de config/reports.py.
from orionis.environment.dynamic.caster import EnvironmentCaster


DEFAULT_LIMIT = EnvironmentCaster.parseTyped("int:100")
DEFAULT_OPTIONS = EnvironmentCaster.parseTyped("dict:{'retries': 3}")
```

`DEFAULT_LIMIT` es `100` y `DEFAULT_OPTIONS` es `{"retries": 3}`. Una cadena sin `:` lanza `ValueError`. Esta ruta tiene el mismo comportamiento permisivo de `bool:` que `Env.get()`; para validar sus palabras de entrada utiliza `get()` como en el ejemplo anterior.

<a id="caster-to"></a>
### `to(type_hint: str | EnvironmentValueType) -> str`

Serializa el objeto a una cadena `tipo:contenido`. No guarda el resultado en `.env`; esa operación corresponde a [`Env.set()`](/es/environment/operations-and-reference). Puedes utilizarla al preparar valores tipados en una configuración o una integración de configuración:

```python
# Serialización explícita en un archivo de config/.
from orionis.environment.dynamic.caster import EnvironmentCaster
from orionis.environment.enums import EnvironmentValueType


LIMIT_LITERAL = EnvironmentCaster("12").to("int")
OPTIONS_LITERAL = EnvironmentCaster({"retries": 3}).to("dict")
ENABLED_LITERAL = EnvironmentCaster("yes").to(EnvironmentValueType.BOOL)
```

Los resultados son `"int:12"`, `"dict:{'retries': 3}"` y `"bool:true"`.

| Tipo solicitado | Valor Python que puedes serializar | Comportamiento |
|---|---|---|
| `str` | Cadena. | Añade el prefijo; no convierte automáticamente otros objetos a texto. |
| `int` | Entero o valor convertible con `int()`. | Puede convertir texto numérico; la conversión de un decimal Python a entero puede perder su parte fraccionaria. |
| `float` | Decimal o valor convertible con `float()`. | Devuelve la representación decimal con prefijo. |
| `bool` | Booleano, palabra booleana admitida u otro objeto. | Valida las palabras; para otros objetos utiliza su valor de verdad Python. |
| `list`, `dict`, `tuple`, `set` | Una colección del tipo correspondiente. | Usa su representación literal; una cadena que contiene una colección no sustituye a la colección real. |
| `path` | Cadena o `Path`. | Normaliza separadores y convierte rutas relativas utilizando el directorio de trabajo. |
| `base64` | Cadena o bytes decodificables como UTF-8. | Conserva contenido que ya es Base64 válido; en otro caso lo codifica. |

`to()` acepta los nombres en minúsculas o un miembro del enum. Un nombre desconocido, una colección incompatible o un fallo de conversión termina en `ValueError`. Al serializar Base64, una cadena que ya es Base64 válido se considera codificada; no se vuelve a codificar. Los bytes que no pueden convertirse a UTF-8 no se admiten en esa operación, aunque sí pueden obtenerse al decodificar un valor de `.env`.

## Continúa con la guía

Consulta la [referencia de operaciones](/es/environment/operations-and-reference) para escritura, recarga y validación de nombres. La [guía de compilación y persistencia](/es/environment/compiled-configuration) explica qué ocurre con estos valores cuando la aplicación utiliza configuración almacenada en JSON.
