---
title: "Stringable"
description: "Referencia completa de Stringable: 148 métodos, cadenas inmutables, Unicode, regex, callbacks, conversiones y cifrado mediante servicios."
editUrl: true
lastUpdated: false
---

`Stringable` es una subclase inmutable de `str` de Python que añade transformaciones de texto encadenables. Impórtala desde el paquete público o desde su módulo de definición:

```python
from orionis.support.types import Stringable
from orionis.support.types.stringable import Stringable as ModuleStringable

assert Stringable is ModuleStringable
assert Stringable("  Café Orionis  ").trim().slug() == "cafe-orionis"
```

Esta referencia cubre los **148 métodos declarados por la clase**: 146 públicos y los protocolos implementados `__getitem__`/`__str__`. La clase no declara propiedades, constructor propio, métodos de clase ni métodos estáticos. Las APIs heredadas sin cambios de `str` se explican a continuación, sin contarlas como métodos adicionales de Orionis. No declara generación de cadenas aleatorias, UUID ni ULID; `isUuid` e `isUlid` solo inspeccionan texto existente.

<a id="stringable-constructor"></a>

**Construcción — `Stringable(object="")` / `Stringable(bytes, encoding="utf-8", errors="strict")`**

La construcción se hereda de `str`: sin objeto produce texto vacío y otros objetos usan su representación de cadena. Bytes sin encoding se convierten a su representación, mientras que con encoding se decodifican. Argumentos de construcción/decodificación inválidos propagan `TypeError`, `LookupError` o `UnicodeDecodeError` de Python.

```python
from orionis.support.types import Stringable

assert Stringable() == ""
assert Stringable(42) == "42"
assert Stringable(None) == "None"
assert Stringable(b"hello") == "b'hello'"
assert Stringable(b"caf\xc3\xa9", encoding="utf-8") == "café"
```

Una transformación no cambia el valor original: conserva su resultado. La mayoría de transformaciones de texto devuelve otro Stringable. `tap` devuelve la instancia original y `when` puede devolverla o devolver un Stringable ya creado por la rama. Predicados, conteos, análisis/listas y conversiones devuelven los tipos Python indicados. `encrypt`/`decrypt` delegan sin envolver y tienen comportamiento awaitable/tipos particulares explicados en sus entradas.

```python
from orionis.support.types import Stringable

original = Stringable("hello")
changed = original.upper()
assert original == "hello" and changed == "HELLO"
assert changed is not original
assert isinstance(original, str)
assert len(original) == 5 and "ell" in original
assert list(original) == ["h", "e", "l", "l", "o"]
assert type(next(iter(original))) is str
assert type(original + "!") is str
assert type(original * 2) is str
assert type(original.strip()) is str
assert {original: 1}["hello"] == 1
```

La indexación está sobrescrita y conserva Stringable; concatenación, multiplicación, iteración, `join`, `strip` y muchas otras operaciones heredadas pueden devolver cadenas ordinarias. Igualdad, orden, formato, hash, pertenencia y evaluación booleana siguen las reglas de cadenas. No hay asignación de elementos ni diccionario mutable de instancia (`__slots__ = ()`). En general, Unicode se cuenta en puntos de código, no en bytes ni grafemas visibles.

Las firmas conservan nombres de parámetros, `*` para argumentos por nombre, anotaciones y valores predeterminados reales. La implementación tiene prioridad si una anotación difiere del resultado. Los ejemplos son fragmentos Python independientes y sus aserciones indican el resultado esperado. Se propagan errores Python/biblioteca estándar salvo cuando el método los envuelve explícitamente. Como en Python, bool es subclase de int y muchas validaciones enteras aceptan True/False.

## Valores directos e inyección de dependencias

Construye Stringable donde esté disponible el dato. Una anotación de tipo no proporciona texto de una petición, no lee variables de entorno ni normaliza automáticamente. Para comportamiento reutilizable, inyecta un servicio que cree el envoltorio de texto dentro de su operación. El siguiente ejemplo con contenedor aislado es ejecutable; una aplicación normalmente usa su contenedor `app` existente.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.types import Stringable

class ExampleContainer(Container):
    pass

class SlugService:
    def normalize(self, title: str) -> str:
        return Stringable(title).trim().slug().value()

class ArticleService:
    def __init__(self, slugs: SlugService) -> None:
        self.slugs = slugs

async def example():
    container = ExampleContainer()
    article = await container.make(ArticleService)
    assert article.slugs.normalize("  Café Orionis  ") == "cafe-orionis"
    fixed = Stringable("application-label")
    container.instance(Stringable, fixed)
    assert await container.make(Stringable) is fixed

asyncio.run(example())
```

Registrar una instancia explícita es posible cuando el dato está fijado intencionalmente para ese contenedor/alcance; no vincula el tipo con texto entrante arbitrario. Consulta [registros e invocación de servicios](/es/application/container/bindings-and-invocation) para los ciclos de vida. `toDate` usa la configuración independiente de zona de DateTime; el cifrado usa el servicio `IEncrypter` configurado mediante Crypt.

## Valores, construcción y protocolos de Python

<a id="stringable-method-value"></a>

**`value() -> str`**

Devuelve un `str` ordinario, útil al entregar el resultado a otra API y terminar la cadena.

```python
from orionis.support.types import Stringable

assert type(Stringable("hello").value()) is str
assert Stringable("hello").value() == "hello"
```

<a id="stringable-method-length"></a>

**`length() -> int`**

Cuenta puntos de código Unicode con `len`; no mide bytes UTF-8 ni grafemas visibles.

```python
from orionis.support.types import Stringable

assert Stringable("é").length() == 1
assert Stringable("e\u0301").length() == 2
```

<a id="stringable-method-getitem"></a>

**`__getitem__(key: int | slice) -> Stringable`**

La indexación y los cortes devuelven `Stringable` y permiten encadenar. Los índices negativos y pasos siguen Python; un índice fuera de rango produce `IndexError`, una clave inválida `TypeError` y un paso cero `ValueError`.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert s[-1] == "o" and isinstance(s[-1], Stringable)
assert s[1:4].upper() == "ELL"
assert s[::-1] == "olleh"
```

<a id="stringable-method-str"></a>

**`__str__() -> str`**

El protocolo `str(s)` devuelve un `str` ordinario; igualdad, orden, hash y evaluación booleana conservan el comportamiento heredado de las cadenas.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert str(s) == "hello" and type(str(s)) is str
assert s == "hello" and hash(s) == hash("hello")
```

<a id="stringable-method-jsonserialize"></a>

**`jsonSerialize() -> str`**

Devuelve el valor como cadena ordinaria, sin codificar JSON. `json.dumps` ya reconoce esta subclase de `str`; no llama este método como mecanismo de serialización.

```python
from orionis.support.types import Stringable

import json
s = Stringable("hello")
assert s.jsonSerialize() == "hello"
assert type(s.jsonSerialize()) is str
assert json.dumps(s) == '"hello"'
```

<a id="stringable-method-tointeger"></a>

**`toInteger(base: int=10) -> int`**

Delega en `int(self, base)`, con base 10 por defecto; 0 detecta prefijos y Python admite bases 2–36. Un texto o base inválidos producen `ValueError` con contexto; tipos de base incompatibles producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("ff").toInteger(16) == 255
assert Stringable("0x10").toInteger(0) == 16
```

<a id="stringable-method-tofloat"></a>

**`toFloat() -> float`**

Convierte mediante `float` de Python, incluidas sus formas de exponentes, infinito y NaN. Un texto inválido produce `ValueError` con contexto de conversión.

```python
from orionis.support.types import Stringable

assert Stringable("1.25e2").toFloat() == 125.0
```

<a id="stringable-method-toboolean"></a>

**`toBoolean() -> bool`**

Elimina espacios externos, convierte a minúsculas y devuelve verdadero solo para `1`, `true`, `on` o `yes`. Los demás valores son falsos; `bool(s)` solo comprueba si hay contenido.

```python
from orionis.support.types import Stringable

assert Stringable(" YES ").toBoolean() is True
assert Stringable("false").toBoolean() is False
assert bool(Stringable("false")) is True
```

<a id="stringable-method-todate"></a>

**`toDate(format_str: str | None='%Y-%m-%d') -> datetime | None`**

Analiza con `datetime.strptime`, usando `%Y-%m-%d` por defecto, y asigna `DateTime.getZoneInfo()` como `tzinfo` sin convertir la hora. Devuelve un `datetime` estándar con zona; no necesita contenedor. Un formato incompatible produce `ValueError`. Aunque la anotación y un comentario sugieren otra cosa, `None` llega a `strptime` y produce `TypeError`; no hay detección ISO automática.

```python
from orionis.support.types import Stringable

from orionis.support.facades.datetime import DateTime
d = Stringable("2026-10-23").toDate()
assert (d.year, d.month, d.day) == (2026, 10, 23)
assert d.tzinfo == DateTime.getZoneInfo()
assert Stringable("23/10/2026").toDate("%d/%m/%Y").day == 23
```

## Búsquedas, límites e índices

<a id="stringable-method-after"></a>

**`after(search: str) -> Stringable`**

Devuelve el contenido posterior a la primera coincidencia literal; si no existe, conserva el valor. Una búsqueda vacía devuelve toda la cadena. Un argumento incompatible con la búsqueda de Python produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("a/b/c").after("/") == "b/c"
assert Stringable("abc").after("x") == "abc"
assert Stringable("abc").after("") == "abc"
```

<a id="stringable-method-afterlast"></a>

**`afterLast(search: str) -> Stringable`**

Busca desde la derecha y devuelve el contenido posterior a la última coincidencia; si falta, conserva el valor. Una búsqueda vacía coincide con el final y devuelve un `Stringable` vacío.

```python
from orionis.support.types import Stringable

assert Stringable("a/b/c").afterLast("/") == "c"
assert Stringable("abc").afterLast("") == ""
```

<a id="stringable-method-before"></a>

**`before(search: str) -> Stringable`**

Devuelve el contenido anterior a la primera coincidencia literal; si falta, conserva el valor, y una búsqueda vacía devuelve vacío.

```python
from orionis.support.types import Stringable

assert Stringable("a/b/c").before("/") == "a"
assert Stringable("abc").before("x") == "abc"
assert Stringable("abc").before("") == ""
```

<a id="stringable-method-beforelast"></a>

**`beforeLast(search: str) -> Stringable`**

Devuelve el contenido anterior a la última coincidencia literal. Si falta, conserva el valor; una búsqueda vacía coincide con el final y conserva toda la cadena.

```python
from orionis.support.types import Stringable

assert Stringable("a/b/c").beforeLast("/") == "a/b"
assert Stringable("abc").beforeLast("") == "abc"
```

<a id="stringable-method-between"></a>

**`between(from_str: str, to_str: str) -> Stringable`**

Busca el primer delimitador inicial y el primer delimitador final que lo siga. Devuelve vacío si falta alguno; tipos inválidos producen `TypeError`. No analiza delimitadores anidados.

```python
from orionis.support.types import Stringable

assert Stringable("[a][b]").between("[", "]") == "a"
assert Stringable("[a").between("[", "]") == ""
```

<a id="stringable-method-betweenfirst"></a>

**`betweenFirst(from_str: str, to_str: str) -> Stringable`**

Actualmente realiza la misma extracción del primer par que `between`, incluido el resultado vacío si faltan delimitadores y `TypeError` si no son cadenas.

```python
from orionis.support.types import Stringable

assert Stringable("[a][b]").betweenFirst("[", "]") == "a"
```

<a id="stringable-method-contains"></a>

**`contains(needles: str | Iterable[str], *, ignore_case: bool=False) -> bool`**

Comprueba si aparece alguna búsqueda literal. Acepta una cadena o iterable; un iterable vacío devuelve falso. `ignore_case=True` usa `lower()`, no case folding Unicode. Un tipo externo inválido produce `TypeError`; los elementos no se validan antes y pueden producir `TypeError` o `AttributeError` al evaluarse.

```python
from orionis.support.types import Stringable

assert Stringable("Hello world").contains(["absent", "WORLD"], ignore_case=True)
assert Stringable("hello").contains([]) is False
```

<a id="stringable-method-containsall"></a>

**`containsAll(needles: list[str], *, ignore_case: bool=False) -> bool`**

Exige una `list[str]` no vacía y comprueba todas las subcadenas. Tipos incorrectos producen `TypeError`; una lista vacía produce `ValueError`. Con dos o más búsquedas, `ignore_case` debe ser bool; el atajo de un elemento delega en `contains` y omite esa validación.

```python
from orionis.support.types import Stringable

assert Stringable("Hello world").containsAll(["HELLO", "WORLD"], ignore_case=True)
assert not Stringable("hello").containsAll(["hello", "world"])
```

<a id="stringable-method-doesntcontain"></a>

**`doesntContain(needles: str | list[str], *, ignore_case: bool=False) -> bool`**

Niega la búsqueda de alguna subcadena. A diferencia de `contains`, exige cadena o lista de cadenas y `ignore_case` bool; argumentos inválidos producen `TypeError`. Una lista vacía devuelve verdadero.

```python
from orionis.support.types import Stringable

assert Stringable("Hello").doesntContain("WORLD", ignore_case=True)
assert not Stringable("Hello").doesntContain(["HELLO"], ignore_case=True)
```

<a id="stringable-method-startswith"></a>

**`startsWith(needles: str | list[str]) -> bool`**

Devuelve verdadero si coincide algún prefijo, distinguiendo mayúsculas. Exige cadena o lista de cadenas (`TypeError` en otro caso). Una lista vacía devuelve falso; un prefijo vacío coincide con cualquier cadena.

```python
from orionis.support.types import Stringable

assert Stringable("hello.py").startsWith(["hi", "hello"])
assert not Stringable("hello").startsWith([])
```

<a id="stringable-method-endswith"></a>

**`endsWith(needles: str | Iterable[str]) -> bool`**

Devuelve verdadero si coincide algún sufijo, distinguiendo mayúsculas. Acepta cadena o iterable, incluidos tuplas y generadores. Un tipo externo inválido produce `TypeError`; los elementos inválidos evaluados fallan en `str.endswith`. Un iterable vacío devuelve falso.

```python
from orionis.support.types import Stringable

assert Stringable("hello.py").endsWith((".txt", ".py"))
assert not Stringable("hello").endsWith([])
```

<a id="stringable-method-doesntstartwith"></a>

**`doesntStartWith(needles: str | list[str]) -> bool`**

Niega la coincidencia de algún prefijo; exige cadena o lista que contenga solo cadenas (`TypeError` en otro caso). Una lista vacía devuelve verdadero.

```python
from orionis.support.types import Stringable

assert Stringable("hello").doesntStartWith(["bye", "hi"])
```

<a id="stringable-method-doesntendwith"></a>

**`doesntEndWith(needles: str | list[str]) -> bool`**

Niega `endsWith` tras validar estrictamente cadena o lista y sus elementos (`TypeError` si son inválidos). Una lista vacía devuelve verdadero.

```python
from orionis.support.types import Stringable

assert Stringable("hello.py").doesntEndWith([".txt", ".md"])
```

<a id="stringable-method-exactly"></a>

**`exactly(value: str) -> bool`**

Compara todo el valor distinguiendo mayúsculas; exige una cadena y produce `TypeError` en otro caso.

```python
from orionis.support.types import Stringable

assert Stringable("hello").exactly("hello")
assert not Stringable("hello").exactly("Hello")
```

<a id="stringable-method-position"></a>

**`position(needle: str, offset: int=0, encoding: str | None=None) -> int | bool`**

Devuelve la primera posición desde `offset`, comenzando en cero, o el objeto `False` si falta. Usa `is False` para distinguir ausencia de la posición 0. Los offsets negativos siguen `str.find`. `encoding` se valida pero no se usa. Tipos incorrectos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("ababa").position("a", 1, encoding="utf-8") == 2
assert Stringable("abc").position("x") is False
assert Stringable("abc").position("a") == 0
```

<a id="stringable-method-charat"></a>

**`charAt(index: int) -> str | bool`**

Devuelve un `str` ordinario de un carácter en el índice entero, incluidos negativos; devuelve `False` fuera de rango. Un índice no entero produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").charAt(-1) == "o"
assert Stringable("hello").charAt(99) is False
```

<a id="stringable-method-offsetexists"></a>

**`offsetExists(offset: int) -> bool`**

Comprueba si se puede acceder al índice entero, incluidos negativos. Tipos inválidos e índices fuera de rango devuelven falso. Acepta booleanos como índices enteros, siguiendo `isinstance(True, int)`.

```python
from orionis.support.types import Stringable

assert Stringable("hi").offsetExists(-1)
assert not Stringable("hi").offsetExists(2)
assert not Stringable("hi").offsetExists("0")
```

<a id="stringable-method-offsetget"></a>

**`offsetGet(offset: int) -> str`**

Devuelve un carácter `str` ordinario para un offset entero. Admite negativos; tipos inválidos producen `TypeError` y posiciones fuera de rango `IndexError`. Usa la indexación si quieres conservar `Stringable`.

```python
from orionis.support.types import Stringable

assert Stringable("hi").offsetGet(-1) == "i"
assert type(Stringable("hi").offsetGet(0)) is str
```

## Mayúsculas, nombres y Unicode

<a id="stringable-method-lower"></a>

**`lower() -> Stringable`**

Aplica la conversión Unicode de Python a minúsculas y devuelve `Stringable`.

```python
from orionis.support.types import Stringable

assert Stringable("HÉLLO").lower() == "héllo"
```

<a id="stringable-method-upper"></a>

**`upper() -> Stringable`**

Aplica la conversión Unicode de Python a mayúsculas; un carácter puede expandirse en varios.

```python
from orionis.support.types import Stringable

assert Stringable("straße").upper() == "STRASSE"
```

<a id="stringable-method-swapcase"></a>

**`swapCase() -> Stringable`**

Invierte las mayúsculas y minúsculas de cada carácter según las reglas Unicode de Python.

```python
from orionis.support.types import Stringable

assert Stringable("Hello 1!").swapCase() == "hELLO 1!"
```

<a id="stringable-method-convertcase"></a>

**`convertCase(mode: int | None=None) -> Stringable`**

Usa case folding para modo `None`, 0 o cualquier entero no reconocido; 1 indica mayúsculas, 2 minúsculas y 3 título. Un modo que no sea entero ni None produce `TypeError`. Case folding puede expandir caracteres Unicode.

```python
from orionis.support.types import Stringable

assert Stringable("Straße").convertCase() == "strasse"
assert Stringable("hello world").convertCase(3) == "Hello World"
assert Stringable("ABC").convertCase(99) == "abc"
```

<a id="stringable-method-camel"></a>

**`camel() -> Stringable`**

Separa guiones bajos, guiones y espacios, convierte la primera palabra a minúsculas, capitaliza las demás y las une. No separa límites camelCase existentes; convierte a minúsculas el resto de cada palabra posterior.

```python
from orionis.support.types import Stringable

assert Stringable("HELLO_world-name").camel() == "helloWorldName"
assert Stringable("helloWorld").camel() == "helloworld"
```

<a id="stringable-method-kebab"></a>

**`kebab() -> Stringable`**

Inserta un guion solo entre minúscula ASCII o dígito y mayúscula, reemplaza guiones bajos/espacios, colapsa guiones, pasa a minúsculas y recorta los extremos. No separa siglas en palabras.

```python
from orionis.support.types import Stringable

assert Stringable("helloWorld_name").kebab() == "hello-world-name"
assert Stringable("HTTPServer").kebab() == "httpserver"
```

<a id="stringable-method-snake"></a>

**`snake(delimiter: str='_') -> Stringable`**

Como la conversión de límites ASCII de `kebab`, pero usa `delimiter` (`_` por defecto) para límites camel, espacios y guiones. El recorte externo trata sus caracteres como conjunto. Una regex generada colapsa separadores; los delimitadores de varios caracteres no son separadores generales y las barras inversas pueden interpretarse como escapes de reemplazo. Un delimitador vacío produce `re.PatternError`; no hay validación específica de argumentos y otros valores incompatibles propagan errores Python/regex.

```python
from orionis.support.types import Stringable

assert Stringable("helloWorld name").snake() == "hello_world_name"
assert Stringable("helloWorld").snake(".") == "hello.world"
```

<a id="stringable-method-studly"></a>

**`studly() -> Stringable`**

Separa espacios, guiones bajos y guiones, capitaliza cada palabra y las une. Usa `capitalize`, por lo que las mayúsculas internas pasan a minúsculas.

```python
from orionis.support.types import Stringable

assert Stringable("hello_world-name").studly() == "HelloWorldName"
assert Stringable("HTTPServer").studly() == "Httpserver"
```

<a id="stringable-method-pascal"></a>

**`pascal() -> Stringable`**

Alias implementado llamando a `studly`; tiene los mismos separadores y comportamiento de capitalización.

```python
from orionis.support.types import Stringable

assert Stringable("hello_world").pascal() == "HelloWorld"
```

<a id="stringable-method-slug"></a>

**`slug(separator: str='-', dictionary: dict[str, str] | None=None) -> Stringable`**

Aplica primero el diccionario (`{"@": "at"}` por defecto; `{}` lo desactiva), normaliza con `ascii`, elimina puntuación excepto guiones, reemplaza espacios/guiones bajos con `separator`, pasa a minúsculas y recorta sus caracteres. Un separador que no sea cadena o diccionario de tipo incorrecto produce `TypeError`; sus entradas siguen la validación de `str.replace`. Un guion existente no cambia al elegir otro separador. Un separador vacío produce `re.PatternError`; las barras inversas también pueden interpretarse como escapes de reemplazo.

```python
from orionis.support.types import Stringable

assert Stringable("Café @ Home!").slug() == "cafe-at-home"
assert Stringable("A-B C").slug("_") == "a-b_c"
assert Stringable("a@b").slug(dictionary={}) == "ab"
```

<a id="stringable-method-title"></a>

**`title() -> Stringable`**

Usa `str.title` de Python, incluidos sus límites de palabra por puntuación; no aplica el mismo algoritmo que `headline` ni `apa`.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").title() == "Hello World"
assert Stringable("they're").title() == "They'Re"
```

<a id="stringable-method-headline"></a>

**`headline() -> Stringable`**

Extrae tokens Unicode `\b\w+\b`, capitaliza cada uno y los une con espacios simples. Descarta puntuación, pero conserva guiones bajos dentro de tokens y no separa límites camel.

```python
from orionis.support.types import Stringable

assert Stringable("hello, WORLD!").headline() == "Hello World"
assert Stringable("hello_world").headline() == "Hello_world"
```

<a id="stringable-method-apa"></a>

**`apa() -> Stringable`**

Separa por espacios y capitaliza la primera/última palabra, las de cuatro o más caracteres y las que no están en su pequeña lista inglesa. Las palabras interiores cortas de esa lista quedan en minúsculas. Es una regla sencilla, no un motor completo de estilo editorial.

```python
from orionis.support.types import Stringable

assert Stringable("a tale of ice and fire").apa() == "A Tale of Ice and Fire"
```

<a id="stringable-method-ucfirst"></a>

**`ucfirst() -> Stringable`**

Convierte a mayúsculas solo el primer punto de código Unicode y conserva el resto; una entrada vacía sigue vacía.

```python
from orionis.support.types import Stringable

assert Stringable("hELLO").ucfirst() == "HELLO"
assert Stringable("").ucfirst() == ""
```

<a id="stringable-method-lcfirst"></a>

**`lcfirst() -> Stringable`**

Convierte a minúsculas solo el primer punto de código Unicode y conserva el resto; una entrada vacía sigue vacía.

```python
from orionis.support.types import Stringable

assert Stringable("HELLO").lcfirst() == "hELLO"
```

<a id="stringable-method-ascii"></a>

**`ascii() -> Stringable`**

Normaliza mediante NFKD Unicode y codifica ASCII ignorando caracteres no ASCII. Puede eliminar diacríticos; descarta escrituras y símbolos incompatibles en lugar de transliterarlos lingüísticamente.

```python
from orionis.support.types import Stringable

assert Stringable("café 日本語").ascii() == "cafe "
```

<a id="stringable-method-transliterate"></a>

**`transliterate(unknown: str='?', *, strict: bool=False) -> Stringable`**

Por defecto aplica NFKD y descarta lo no ASCII, como `ascii`. Con `strict=True`, reemplaza cada punto de código no ASCII normalizado por `unknown`, incluidos acentos combinantes. Exige una cadena de un carácter y bool en strict (`TypeError` en otro caso).

```python
from orionis.support.types import Stringable

assert Stringable("café 日本").transliterate() == "cafe "
assert Stringable("café 日本").transliterate("?", strict=True) == "cafe? ??"
```

## Composición, recorte y relleno

<a id="stringable-method-append"></a>

**`append(*values: str) -> Stringable`**

Concatena cero o más cadenas después del valor, en el orden recibido. Argumentos que no sean cadenas producen `TypeError`; nunca modifica el valor original.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert s.append(" ", "world") == "hello world"
assert s == "hello"
```

<a id="stringable-method-prepend"></a>

**`prepend(*values: str) -> Stringable`**

Concatena cero o más cadenas antes del valor en el orden recibido, sin invertir los argumentos. Un argumento que no sea cadena produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("world").prepend("hello", " ") == "hello world"
```

<a id="stringable-method-newline"></a>

**`newLine(count: int=1) -> Stringable`**

Añade `count` caracteres de salto de línea (`\n`), uno por defecto. Usa multiplicación de cadenas directamente: cero y negativos no añaden nada; un valor no entero produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("x").newLine(2) == "x\n\n"
assert Stringable("x").newLine(-1) == "x"
```

<a id="stringable-method-repeat"></a>

**`repeat(times: int) -> Stringable`**

Repite el valor un número entero no negativo de veces. Un conteo negativo o no entero produce `ValueError`; cero devuelve vacío. Los booleanos pasan la comprobación de entero.

```python
from orionis.support.types import Stringable

assert Stringable("ab").repeat(3) == "ababab"
assert Stringable("ab").repeat(0) == ""
```

<a id="stringable-method-reverse"></a>

**`reverse() -> Stringable`**

Invierte puntos de código Unicode mediante un corte. Las marcas combinantes y emoji de varios puntos de código se invierten individualmente.

```python
from orionis.support.types import Stringable

assert Stringable("abc").reverse() == "cba"
assert Stringable("e\u0301").reverse() == "\u0301e"
```

<a id="stringable-method-trim"></a>

**`trim(characters: str | None=None) -> Stringable`**

Elimina caracteres de ambos extremos. `None` elimina espacios en blanco de Python; una cadena explícita es un conjunto de caracteres individuales, no un prefijo/sufijo completo. Otros tipos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("xyhelloyx").trim("xy") == "hello"
```

<a id="stringable-method-ltrim"></a>

**`ltrim(characters: str | None=None) -> Stringable`**

Elimina caracteres de el extremo izquierdo. `None` elimina espacios en blanco de Python; una cadena explícita es un conjunto de caracteres individuales, no un prefijo/sufijo completo. Otros tipos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("  hello  ").ltrim() == "hello  "
```

<a id="stringable-method-rtrim"></a>

**`rtrim(characters: str | None=None) -> Stringable`**

Elimina caracteres de el extremo derecho. `None` elimina espacios en blanco de Python; una cadena explícita es un conjunto de caracteres individuales, no un prefijo/sufijo completo. Otros tipos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("  hello  ").rtrim() == "  hello"
```

<a id="stringable-method-lstrip"></a>

**`lStrip(chars: str | None=None) -> Stringable`**

Elimina caracteres de el extremo izquierdo. `None` elimina espacios en blanco de Python; una cadena explícita es un conjunto de caracteres individuales, no un prefijo/sufijo completo. Otros tipos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("xyhelloxy").lStrip("xy") == "helloxy"
```

<a id="stringable-method-rstrip"></a>

**`rStrip(chars: str | None=None) -> Stringable`**

Elimina caracteres de el extremo derecho. `None` elimina espacios en blanco de Python; una cadena explícita es un conjunto de caracteres individuales, no un prefijo/sufijo completo. Otros tipos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("xyhelloxy").rStrip("xy") == "xyhello"
```

<a id="stringable-method-squish"></a>

**`squish() -> Stringable`**

Colapsa cada secuencia de espacios en blanco Unicode reconocidos por regex a un espacio ASCII y recorta ambos extremos.

```python
from orionis.support.types import Stringable

assert Stringable("  hello\t\n world  ").squish() == "hello world"
```

<a id="stringable-method-deduplicate"></a>

**`deduplicate(character: str=' ') -> Stringable`**

Colapsa apariciones consecutivas de un solo carácter (espacio por defecto). Una entrada no cadena o de varios caracteres produce `ValueError`. El reemplazo usa `re.sub`, por lo que una barra inversa puede producir un error de plantilla de reemplazo.

```python
from orionis.support.types import Stringable

assert Stringable("a---b--c").deduplicate("-") == "a-b-c"
assert Stringable("a  b").deduplicate() == "a b"
```

<a id="stringable-method-start"></a>

**`start(prefix: str) -> Stringable`**

Añade un prefijo literal solo si el valor aún no comienza por él. Los prefijos repetidos existentes se conservan; un tipo inválido produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("path").start("/") == "/path"
assert Stringable("//path").start("/") == "//path"
```

<a id="stringable-method-finish"></a>

**`finish(cap: str) -> Stringable`**

Añade una terminación literal solo si el valor aún no termina con ella. No colapsa terminaciones repetidas existentes; un tipo inválido produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("path").finish("/") == "path/"
assert Stringable("path//").finish("/") == "path//"
```

<a id="stringable-method-chopstart"></a>

**`chopStart(needle: str | list[str]) -> Stringable`**

Elimina el primer prefijo coincidente de una cadena o iterable de candidatos y se detiene. Importa el orden y solo elimina un prefijo. Un tipo externo inválido produce `TypeError`; los elementos inválidos evaluados fallan en `startswith`.

```python
from orionis.support.types import Stringable

assert Stringable("foobar").chopStart(["foo", "foobar"]) == "bar"
assert Stringable("hello").chopStart("x") == "hello"
```

<a id="stringable-method-chopend"></a>

**`chopEnd(needle: str | list[str]) -> Stringable`**

Elimina el primer sufijo coincidente de una cadena o iterable de candidatos. Solo elimina uno. Un candidato vacío actualmente vacía todo el valor porque el código corta hasta `-0`; evítalo al recortar condicionalmente. Una entrada inválida puede producir `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("file.tar.gz").chopEnd([".gz", ".tar.gz"]) == "file.tar"
assert Stringable("hello").chopEnd("") == ""
```

<a id="stringable-method-wrap"></a>

**`wrap(before: str, after: str | None=None) -> Stringable`**

Rodea el valor con `before` y `after`; `after=None` reutiliza `before`. Tipos incorrectos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("name").wrap("[", "]") == "[name]"
assert Stringable("name").wrap("*") == "*name*"
```

<a id="stringable-method-unwrap"></a>

**`unwrap(before: str, after: str | None=None) -> Stringable`**

Elimina un prefijo y un sufijo coincidentes de manera independiente; no exige un par completo. `after=None` reutiliza `before`; tipos incorrectos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("[name]").unwrap("[", "]") == "name"
assert Stringable("[name").unwrap("[", "]") == "name"
```

<a id="stringable-method-padleft"></a>

**`padLeft(length: int, pad: str=' ') -> Stringable`**

Rellena hacia izquierda hasta una longitud mínima total en puntos de código; repite y corta el relleno cuando sea necesario. Conserva valores ya largos. Exige longitud entera no negativa y relleno de cadena no vacía (`ValueError` en otro caso). En `padBoth`, el carácter impar adicional queda a la derecha.

```python
from orionis.support.types import Stringable

assert Stringable("x").padLeft(6, "ab") == "ababax"
```

<a id="stringable-method-padright"></a>

**`padRight(length: int, pad: str=' ') -> Stringable`**

Rellena hacia derecha hasta una longitud mínima total en puntos de código; repite y corta el relleno cuando sea necesario. Conserva valores ya largos. Exige longitud entera no negativa y relleno de cadena no vacía (`ValueError` en otro caso). En `padBoth`, el carácter impar adicional queda a la derecha.

```python
from orionis.support.types import Stringable

assert Stringable("x").padRight(6, "ab") == "xababa"
```

<a id="stringable-method-padboth"></a>

**`padBoth(length: int, pad: str=' ') -> Stringable`**

Rellena hacia ambos lados hasta una longitud mínima total en puntos de código; repite y corta el relleno cuando sea necesario. Conserva valores ya largos. Exige longitud entera no negativa y relleno de cadena no vacía (`ValueError` en otro caso). En `padBoth`, el carácter impar adicional queda a la derecha.

```python
from orionis.support.types import Stringable

assert Stringable("x").padBoth(6, "ab") == "abxaba"
```

<a id="stringable-method-zfill"></a>

**`zFill(width: int) -> Stringable`**

Rellena con ceros ASCII hasta un ancho mínimo, colocando los ceros después del signo inicial. Exige ancho entero no negativo (`ValueError` en otro caso); conserva valores que ya alcancen ese ancho.

```python
from orionis.support.types import Stringable

assert Stringable("-42").zFill(6) == "-00042"
```

## Cortes, máscaras y extractos

<a id="stringable-method-take"></a>

**`take(limit: int) -> Stringable`**

Toma los primeros `limit` puntos de código si es no negativo o los últimos `abs(limit)` si es negativo. Cero devuelve vacío; un tipo no entero produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("abcdef").take(3) == "abc"
assert Stringable("abcdef").take(-2) == "ef"
```

<a id="stringable-method-substr"></a>

**`substr(start: int, length: int | None=None) -> Stringable`**

Corta desde `start`, opcionalmente hasta `start + length`; sigue los cortes Python, incluidos negativos, límites recortados y posibles resultados vacíos. Una longitud negativa no es un recorte desde el final al estilo PHP. Tipos incorrectos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("abcdef").substr(2, 3) == "cde"
assert Stringable("abcdef").substr(-2) == "ef"
assert Stringable("abcdef").substr(2, -1) == ""
```

<a id="stringable-method-mask"></a>

**`mask(character: str, index: int, length: int | None=None) -> Stringable`**

Reemplaza un rango por repeticiones de un carácter. Índices negativos cuentan desde el final y se limitan a cero; sin longitud oculta hasta el final y una longitud negativa deja visibles esos caracteres finales. Exige un carácter de máscara (`ValueError`) e índice/longitud enteros (`TypeError`). Un índice posterior al final conserva el valor.

```python
from orionis.support.types import Stringable

assert Stringable("123456789").mask("*", 2, -2) == "12*****89"
assert Stringable("123456").mask("*", -3) == "123***"
```

<a id="stringable-method-limit"></a>

**`limit(limit: int=100, end: str='...', *, preserve_words: bool=False) -> Stringable`**

Si supera `limit`, toma un prefijo en puntos de código y añade `end`; el sufijo no se incluye en el límite. `preserve_words=True` retrocede al último espacio ASCII del prefijo si su posición es positiva; aún puede cortar una palabra larga sin espacios. Exige límite entero no negativo (`ValueError`), end str y preserve_words bool (`TypeError`).

```python
from orionis.support.types import Stringable

assert Stringable("hello world").limit(8) == "hello wo..."
assert Stringable("hello world").limit(8, "!", preserve_words=True) == "hello!"
```

<a id="stringable-method-excerpt"></a>

**`excerpt(phrase: str='', options: dict | None=None) -> str | None`**

Devuelve un `str` ordinario alrededor de la primera frase literal sin distinguir mayúsculas o `None` si falta. Las opciones predeterminadas son `radius=100` puntos de código a cada lado y `omission="..."`; una frase vacía toma los primeros `2 * radius` caracteres. Tipos de frase/opciones inválidos producen `TypeError`; los valores internos no se validan y pueden fallar en operaciones o cortes.

```python
from orionis.support.types import Stringable

assert Stringable("01234HELLO56789").excerpt("hello", {"radius": 2, "omission": "~"}) == "~34HELLO56~"
assert Stringable("hello").excerpt("missing") is None
assert Stringable("abcdef").excerpt(options={"radius": 2}) == "abcd..."
```

<a id="stringable-method-words"></a>

**`words(words: int=100, end: str='...') -> Stringable`**

Limita palabras separadas por espacios, 100 por defecto, y añade `end` solo al truncar. Si trunca, une con espacios simples; si cabe, conserva los espacios originales. Cero produce solo la terminación cuando hay palabras. Un conteo inválido produce `ValueError`; una terminación no cadena produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("one  two three").words(2, "!") == "one two!"
assert Stringable("one  two").words(2) == "one  two"
```

<a id="stringable-method-wordcount"></a>

**`wordCount(characters: str | None=None) -> int`**

Cuenta palabras separadas por espacios después de recortar. Si `characters` tiene contenido, trata cada carácter como separador adicional, no como una lista de caracteres permitidos. Tipos inválidos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("one,two;three").wordCount(",;") == 3
assert Stringable("   ").wordCount() == 0
```

<a id="stringable-method-wordwrap"></a>

**`wordWrap(characters: int=75, break_str: str='\n', *, cut_long_words: bool=False) -> Stringable`**

Usa `textwrap.fill` con ancho `characters` (75 por defecto) y reemplaza sus saltos por `break_str`. Conserva palabras largas salvo con `cut_long_words=True`; permite cortes por guiones en ambos modos y puede normalizar espacios. Anchos o argumentos inválidos propagan errores de Python, como `ValueError` para ancho cero.

```python
from orionis.support.types import Stringable

assert Stringable("one two three").wordWrap(7, "|") == "one two|three"
assert Stringable("abcdef").wordWrap(3, "|", cut_long_words=True) == "abc|def"
```

## Reemplazo y eliminación

<a id="stringable-method-replace"></a>

**`replace(search: str | Iterable[str], replace: str | Iterable[str], *, case_sensitive: bool=True) -> Stringable`**

Reemplaza pares de búsqueda/reemplazo secuencialmente, por lo que cada paso ve resultados anteriores. Las cadenas se convierten en listas de un elemento; los iterables deben tener igual longitud porque `zip(..., strict=True)` produce `ValueError` si difieren. No distribuye un único reemplazo entre varias búsquedas. Tipos externos inválidos producen `TypeError`. `case_sensitive=False` escapa la búsqueda y usa `re.IGNORECASE`; las barras del reemplazo conservan significado de plantilla regex. No existe el argumento count de `str.replace`.

```python
from orionis.support.types import Stringable

assert Stringable("ab").replace(["a", "b"], ["b", "c"]) == "cc"
assert Stringable("Hello HELLO").replace("hello", "hi", case_sensitive=False) == "hi hi"
```

<a id="stringable-method-replacearray"></a>

**`replaceArray(search: str, replace: list[str]) -> Stringable`**

Por cada reemplazo, sustituye la primera coincidencia que quede en el resultado actual. Si faltan reemplazos conserva coincidencias posteriores; si sobran no se usan. Un reemplazo puede introducir coincidencias para el paso siguiente. Exige lista con solo cadenas (`TypeError` en otro caso); los errores de búsqueda siguen las operaciones de Python.

```python
from orionis.support.types import Stringable

assert Stringable("? + ? = ?").replaceArray("?", ["1", "2"]) == "1 + 2 = ?"
```

<a id="stringable-method-replacefirst"></a>

**`replaceFirst(search: str, replace: str) -> Stringable`**

Reemplaza una primera coincidencia literal y conserva el valor si no existe. Ambos argumentos deben ser cadenas (`TypeError` en otro caso); una búsqueda vacía inserta al inicio.

```python
from orionis.support.types import Stringable

assert Stringable("a-a-a").replaceFirst("a", "x") == "x-a-a"
```

<a id="stringable-method-replacelast"></a>

**`replaceLast(search: str, replace: str) -> Stringable`**

Reemplaza solo la última coincidencia literal; si falta, conserva el valor. Exige argumentos de cadena (`TypeError` en otro caso); una búsqueda vacía inserta al final.

```python
from orionis.support.types import Stringable

assert Stringable("a-a-a").replaceLast("a", "x") == "a-a-x"
```

<a id="stringable-method-replacestart"></a>

**`replaceStart(search: str, replace: str) -> Stringable`**

Reemplaza la búsqueda literal solo si es un prefijo. Ambos argumentos deben ser cadenas (`TypeError` en otro caso). Una búsqueda vacía antepone el reemplazo.

```python
from orionis.support.types import Stringable

assert Stringable("pre-name-pre").replaceStart("pre", "new") == "new-name-pre"
```

<a id="stringable-method-replaceend"></a>

**`replaceEnd(search: str, replace: str) -> Stringable`**

Reemplaza la búsqueda literal solo si es un sufijo. Ambos argumentos deben ser cadenas (`TypeError` en otro caso). Una búsqueda vacía actualmente reemplaza todo el valor porque el corte del prefijo termina en `-0`.

```python
from orionis.support.types import Stringable

assert Stringable("pre-name-pre").replaceEnd("pre", "new") == "pre-name-new"
assert Stringable("abc").replaceEnd("", "X") == "X"
```

<a id="stringable-method-replacematches"></a>

**`replaceMatches(pattern: str | list[str], replace: str | Callable, limit: int=-1) -> Stringable`**

Aplica una regex Python o una lista secuencialmente. Un reemplazo de cadena admite referencias a grupos; un callback recibe `re.Match` y debe devolver `str`. `limit=-1` y 0 reemplazan todo, los positivos limitan cada patrón y otros negativos actualmente no reemplazan nada. Tipos incorrectos producen `TypeError`; regex o plantillas inválidas propagan errores de `re`.

```python
from orionis.support.types import Stringable

assert Stringable("a1 b22").replaceMatches(r"\d+", lambda m: str(int(m.group()) * 2)) == "a2 b44"
assert Stringable("a1 b2").replaceMatches(r"\d", "X", 1) == "aX b2"
```

<a id="stringable-method-remove"></a>

**`remove(search: str | list[str], *, case_sensitive: bool=True) -> Stringable`**

Elimina búsquedas literales secuencialmente. Exige cadena o lista de cadenas (`TypeError` en otro caso). `case_sensitive=False` usa búsquedas escapadas con `re.IGNORECASE`; la opción se evalúa por su valor booleano sin exigir bool.

```python
from orionis.support.types import Stringable

assert Stringable("Hello WORLD").remove(["hello", "world"], case_sensitive=False) == " "
```

<a id="stringable-method-swap"></a>

**`swap(map_dict: dict[str, str]) -> Stringable`**

Aplica un diccionario de reemplazos literales en orden de inserción. Los reemplazos se encadenan; no es una traducción simultánea de caracteres. Un tipo no dict o claves/valores no cadena producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("ab").swap({"a": "b", "b": "c"}) == "cc"
```

<a id="stringable-method-substrcount"></a>

**`substrCount(needle: str, offset: int=0, length: int | None=None) -> int`**

Cuenta coincidencias literales no solapadas en `self[offset:]` o `self[offset:offset + length]`. Los cortes Python definen negativos y límites; una búsqueda vacía cuenta posiciones entre caracteres. Tipos incorrectos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("aaaaa").substrCount("aa") == 2
assert Stringable("ab-ab-ab").substrCount("ab", 3, 5) == 2
```

<a id="stringable-method-substrreplace"></a>

**`substrReplace(replace: str | list[str], offset: int | list[int]=0, length: int | list[int] | None=None) -> Stringable`**

Aplica reemplazos uno a uno sobre el resultado cambiante. Los escalares se vuelven listas; si faltan offsets se repite el último. Omitir `length` inserta, no reemplaza hasta el final; si faltan longitudes también inserta en las operaciones restantes. Offsets negativos cuentan desde el final actual. Listas vacías, longitudes negativas, listas más largas que los reemplazos y offsets fuera de rango producen `ValueError`; tipos/elementos incorrectos producen `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("abcdef").substrReplace("X", 2, 3) == "abXf"
assert Stringable("abc").substrReplace("X", 1) == "aXbc"
assert Stringable("abcd").substrReplace(["X", "Y"], [1, -1], [1, 1]) == "aXcY"
```

## Expresiones regulares, separación y análisis

<a id="stringable-method-match"></a>

**`match(pattern: str) -> Stringable`**

Usa `re.search` y devuelve la primera coincidencia completa, no el primer grupo capturado. Devuelve `Stringable` vacío si no coincide. Exige patrón de cadena (`TypeError`); una sintaxis inválida produce `re.PatternError`. Usa opciones internas como `(?i)` cuando sean necesarias.

```python
from orionis.support.types import Stringable

assert Stringable("item=42").match(r"item=(\d+)") == "item=42"
assert Stringable("abc").match(r"\d+") == ""
```

<a id="stringable-method-matchall"></a>

**`matchAll(pattern: str) -> list[str]`**

Devuelve los resultados de `re.findall`: coincidencias completas sin grupos, cadenas con un grupo y tuplas con varios grupos. Por ello la anotación `list[str]` no describe todas las formas reales. Sin coincidencias devuelve `[]`; patrones no cadena producen `TypeError` e inválidos `re.PatternError`.

```python
from orionis.support.types import Stringable

assert Stringable("a1 b2").matchAll(r"([a-z])(\d)") == [("a", "1"), ("b", "2")]
assert Stringable("a1 b2").matchAll(r"\d") == ["1", "2"]
```

<a id="stringable-method-ismatch"></a>

**`isMatch(pattern: str | list[str]) -> bool`**

Comprueba si alguna regex coincide en cualquier posición. Acepta cadena o iterable de cadenas, valida cada elemento y luego busca cada patrón. Tipos inválidos producen `TypeError` y patrones inválidos `re.PatternError`. Un iterable vacío devuelve falso. Un generador de un solo uso se consume al validarlo y actualmente devuelve falso en la búsqueda posterior.

```python
from orionis.support.types import Stringable

assert Stringable("item42").isMatch([r"^other", r"\d+$"])
assert not Stringable("item42").isMatch([])
```

<a id="stringable-method-test"></a>

**`test(pattern: str) -> bool`**

Llama directamente a `re.search` y devuelve bool. Aunque se anota como cadena, una regex compilada también funciona en ejecución. Entradas o sintaxis inválidas propagan `TypeError` o `re.PatternError` de Python.

```python
from orionis.support.types import Stringable

assert Stringable("Hello").test(r"(?i)^hello$")
assert not Stringable("hello").test(r"^world$")
```

<a id="stringable-method-ispattern"></a>

**`isPattern(pattern: str | list[str], *, ignore_case: bool=False) -> bool`**

Compara todo el valor con patrones shell de `fnmatch` (`*`, `?`, `[abc]`), no regex. Una lista significa algún patrón; exige una cadena o lista de cadenas no vacía y bool ignore_case (`TypeError`, o `ValueError` con lista vacía). En Windows, `fnmatch.fnmatch` normaliza mayúsculas incluso con `ignore_case=False`; `ignore_case=True` convierte explícitamente a minúsculas en cualquier plataforma.

```python
from orionis.support.types import Stringable

assert Stringable("Report.PDF").isPattern("report.*", ignore_case=True)
assert Stringable("file3.txt").isPattern(["*.csv", "file[0-9].txt"])
```

<a id="stringable-method-explode"></a>

**`explode(delimiter: str, limit: int=-1) -> list[str]`**

Separa por delimitador literal no vacío y devuelve cadenas ordinarias. `limit=-1` no limita; un positivo indica máximo de partes. `limit=0` actualmente tampoco limita porque pasa `-1` a `str.split`. Un delimitador de tipo incorrecto produce `TypeError`; límites inválidos y delimitador vacío producen `ValueError`.

```python
from orionis.support.types import Stringable

assert Stringable("a,b,c").explode(",", 2) == ["a", "b,c"]
assert Stringable("a,b,c").explode(",", 0) == ["a", "b", "c"]
```

<a id="stringable-method-split"></a>

**`split(pattern: str | int, limit: int=-1, flags: int=0) -> list[str]`**

Un patrón entero crea fragmentos de tamaño fijo (ignora limit/flags para dividir); cero produce `ValueError` y un tamaño negativo devuelve `[]`. Un patrón de cadena llama a `re.split`; `limit=-1` o 0 no limita y un positivo cuenta cortes, no partes finales. Los grupos capturados aparecen en el resultado. `flags` admite opciones regex enteras. Tipos incorrectos propagan `TypeError`, límites menores que -1 producen `ValueError` y regex inválidas `re.PatternError`. No existe la variante sin argumentos para espacios.

```python
from orionis.support.types import Stringable

import re
assert Stringable("abcdefg").split(3) == ["abc", "def", "g"]
assert Stringable("aXbxc").split("x", 1, re.IGNORECASE) == ["a", "bxc"]
assert Stringable("a1b2").split(r"(\d)") == ["a", "1", "b", "2", ""]
```

<a id="stringable-method-ucsplit"></a>

**`ucsplit() -> list[str]`**

Extrae palabras iniciadas en mayúscula ASCII, secuencias minúsculas o dígitos con `[A-Z][a-z]*|[a-z]+|\d+`. Las siglas se separan en mayúsculas individuales; puntuación/texto no latino sin coincidencia desaparece si hay tokens. Si no coincide nada, devuelve `[str(self)]`.

```python
from orionis.support.types import Stringable

assert Stringable("HTTPServer42").ucsplit() == ["H", "T", "T", "P", "Server", "42"]
assert Stringable("日本").ucsplit() == ["日本"]
```

<a id="stringable-method-numbers"></a>

**`numbers() -> Stringable`**

Elimina los caracteres regex `\D` y conserva dígitos decimales Unicode (`\d`), no solo ASCII. Elimina signos y puntuación decimal.

```python
from orionis.support.types import Stringable

assert Stringable("-12.3 and ٤").numbers() == "123٤"
```

<a id="stringable-method-scan"></a>

**`scan(format_str: str) -> list[str]`**

Traduce `%s` a captura sin espacios, `%d` a dígitos y `%f` a dígitos/puntos, ejecuta `re.findall` y toma solo la primera coincidencia. Conserva valores como cadenas, no escapa caracteres regex literales del formato y `%f` no valida sintaxis numérica. Con una captura, convertir la cadena coincidente a lista la separa en caracteres. Un formato de tipo incorrecto produce `TypeError`; regex generadas inválidas propagan `re.PatternError`.

```python
from orionis.support.types import Stringable

assert Stringable("name=Ada age=37").scan("name=%s age=%d") == ["Ada", "37"]
assert Stringable("123").scan("%d") == ["1", "2", "3"]
```

<a id="stringable-method-parsecallback"></a>

**`parseCallback(default: str | None=None) -> list[str | None]`**

Divide una vez por `@` y devuelve `[clase_o_nombre, método]` como cadenas. Sin `@`, devuelve `[valor, default]`; no importa, resuelve ni invoca nada. Un default que no sea cadena ni None produce `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("UserController@show").parseCallback() == ["UserController", "show"]
assert Stringable("Handler").parseCallback("run") == ["Handler", "run"]
```

## Predicados y comprobación de formatos

<a id="stringable-method-isempty"></a>

**`isEmpty() -> bool`**

Devuelve verdadero solo con cero puntos de código. Un texto de espacios no está vacío; recórtalo antes si esa es la regla de la aplicación.

```python
from orionis.support.types import Stringable

assert Stringable("").isEmpty()
assert not Stringable(" ").isEmpty()
```

<a id="stringable-method-isnotempty"></a>

**`isNotEmpty() -> bool`**

Devuelve el valor booleano heredado de las cadenas: verdadero para cualquier contenido, incluidos espacios y `"0"`.

```python
from orionis.support.types import Stringable

assert Stringable("0").isNotEmpty()
assert not Stringable("").isNotEmpty()
```

<a id="stringable-method-isalnum"></a>

**`isAlnum() -> bool`**

Usa `str.isalnum` Unicode: exige al menos un carácter y que todos sean alfabéticos o numéricos. Espacios y puntuación devuelven falso.

```python
from orionis.support.types import Stringable

assert Stringable("café42").isAlnum()
assert not Stringable("café 42").isAlnum()
```

<a id="stringable-method-isalpha"></a>

**`isAlpha() -> bool`**

Usa `str.isalpha` Unicode: todos los caracteres deben ser alfabéticos y debe haber contenido. Una marca combinante descompuesta no es alfabética por sí sola.

```python
from orionis.support.types import Stringable

assert Stringable("café").isAlpha()
assert not Stringable("cafe\u0301").isAlpha()
```

<a id="stringable-method-isdecimal"></a>

**`isDecimal() -> bool`**

Usa `str.isdecimal` Unicode: exige uno o más dígitos decimales (Unicode Nd). Signos, puntos decimales y dos en superíndice no cumplen.

```python
from orionis.support.types import Stringable

assert Stringable("٤٢").isDecimal()
assert not Stringable("²").isDecimal()
```

<a id="stringable-method-isdigit"></a>

**`isDigit() -> bool`**

Usa `str.isdigit` Unicode, que incluye dígitos decimales y caracteres como dos en superíndice; exige texto no vacío.

```python
from orionis.support.types import Stringable

assert Stringable("²").isDigit()
assert not Stringable("-2").isDigit()
```

<a id="stringable-method-isnumeric"></a>

**`isNumeric() -> bool`**

Usa `str.isnumeric` Unicode, más amplio que decimal/digit: admite fracciones numéricas y caracteres de números romanos. No analiza literales con signo o punto decimal.

```python
from orionis.support.types import Stringable

assert Stringable("Ⅷ½").isNumeric()
assert not Stringable("3.14").isNumeric()
```

<a id="stringable-method-isidentifier"></a>

**`isIdentifier() -> bool`**

Usa las reglas léxicas de identificadores Python. No rechaza palabras reservadas; usa además `keyword.iskeyword` al definir nombres Python.

```python
from orionis.support.types import Stringable

assert Stringable("user_name").isIdentifier()
assert Stringable("class").isIdentifier()
assert not Stringable("2users").isIdentifier()
```

<a id="stringable-method-islower"></a>

**`isLower() -> bool`**

Exige al menos un carácter con distinción de mayúsculas y que todos ellos estén en minúsculas. Dígitos, espacios y puntuación no afectan al caso.

```python
from orionis.support.types import Stringable

assert Stringable("hello 123!").isLower()
assert not Stringable("123").isLower()
```

<a id="stringable-method-isupper"></a>

**`isUpper() -> bool`**

Exige al menos un carácter con distinción de mayúsculas y que todos ellos estén en mayúsculas; los caracteres sin esa distinción no afectan la comprobación.

```python
from orionis.support.types import Stringable

assert Stringable("HELLO 123!").isUpper()
assert not Stringable("").isUpper()
```

<a id="stringable-method-istitle"></a>

**`isTitle() -> bool`**

Usa las reglas Unicode de título de Python: cada secuencia de letras con caso comienza en mayúscula/título y continúa en minúscula; exige al menos un carácter con caso.

```python
from orionis.support.types import Stringable

assert Stringable("Hello World").isTitle()
assert not Stringable("HELLO World").isTitle()
```

<a id="stringable-method-isprintable"></a>

**`isPrintable() -> bool`**

Usa `str.isprintable` de Python. Fallan caracteres de control y la mayoría de separadores; el espacio ASCII cumple. El texto vacío también devuelve verdadero.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").isPrintable()
assert Stringable("").isPrintable()
assert not Stringable("hello\n").isPrintable()
```

<a id="stringable-method-isspace"></a>

**`isSpace() -> bool`**

Exige texto no vacío formado completamente por espacios en blanco Unicode según `str.isspace` de Python.

```python
from orionis.support.types import Stringable

assert Stringable(" \t\n").isSpace()
assert not Stringable("").isSpace()
```

<a id="stringable-method-isascii"></a>

**`isAscii() -> bool`**

Comprueba si se puede codificar como ASCII, incluidos texto vacío y caracteres de control ASCII. Es independiente de si se puede imprimir.

```python
from orionis.support.types import Stringable

assert Stringable("\n").isAscii()
assert not Stringable("é").isAscii()
```

<a id="stringable-method-isjson"></a>

**`isJson() -> bool`**

Comprueba si `json.loads` de Python puede analizar el texto; admite cualquier forma JSON, incluidos cadenas escalares, números y null. Sigue extensiones del analizador Python como NaN, no una validación estricta de esquema externo.

```python
from orionis.support.types import Stringable

assert Stringable("null").isJson()
assert Stringable("42").isJson()
assert not Stringable("{bad}").isJson()
```

<a id="stringable-method-isurl"></a>

**`isUrl(protocols: list[str] | None=None) -> bool`**

Analiza con `urllib.parse.urlparse` y exige esquema/netloc no vacíos y pertenencia a `protocols` (`["http", "https"]` por defecto). No comprueba acceso, validez del host ni todos los componentes URL. Un protocols que no sea lista produce `TypeError`; fallos de análisis devuelven falso. Una lista vacía no permite protocolos.

```python
from orionis.support.types import Stringable

assert Stringable("https://example.com/path").isUrl()
assert Stringable("ftp://example.com/file").isUrl(["ftp"])
assert not Stringable("/relative/path").isUrl()
```

<a id="stringable-method-isuuid"></a>

**`isUuid(version: int | str | None=None) -> bool`**

Analiza con `uuid.UUID`; sin versión acepta cualquier representación analizable, incluidas formas sin guiones. Una versión entera se compara directamente (sin validar explícitamente el rango 1–8); `"max"` comprueba versión <= 8 y devuelve falso si no hay versión comparable. Tipos de versión inválidos producen `TypeError`; fallos de análisis devuelven falso. Valida texto existente sin generar UUID.

```python
from orionis.support.types import Stringable

s = Stringable("550e8400-e29b-41d4-a716-446655440000")
assert s.isUuid() and s.isUuid(4) and s.isUuid("max")
assert not s.isUuid(1)
assert not Stringable("bad").isUuid()
```

<a id="stringable-method-isulid"></a>

**`isUlid() -> bool`**

Convierte a mayúsculas y exige exactamente 26 caracteres del alfabeto Crockford `0123456789ABCDEFGHJKMNPQRSTVWXYZ`. Acepta minúsculas y no valida desbordamiento de bits iniciales ni rango de tiempo de un ULID canónico. No genera identificadores.

```python
from orionis.support.types import Stringable

assert Stringable("01arz3ndektsv4rrffq69g5fav").isUlid()
assert Stringable("Z" * 26).isUlid()
assert not Stringable("I" * 26).isUlid()
```

## Rutas, inflexión y conteos

<a id="stringable-method-basename"></a>

**`basename(suffix: str='') -> Stringable`**

Usa `pathlib.Path.name` de la plataforma actual y elimina el sufijo literal `suffix` si está al final. No accede al sistema de archivos. Las reglas Windows y POSIX difieren; tipos de sufijo incompatibles propagan `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("folder/report.txt").basename() == "report.txt"
assert Stringable("folder/report.txt").basename(".txt") == "report"
```

<a id="stringable-method-dirname"></a>

**`dirname(levels: int=1) -> Stringable`**

Aplica `Path.parent` `levels` veces, una por defecto, con sintaxis de la plataforma y sin acceder al sistema de archivos. Cero o negativos conservan el texto normalizado de Path; los no enteros fallan en `range`. La raíz conserva su propia ruta padre.

```python
from orionis.support.types import Stringable

from pathlib import Path
assert Stringable("folder/sub/report.txt").dirname(2) == str(Path("folder"))
```

<a id="stringable-method-plural"></a>

**`plural(count: int | list | Any=2, *, prepend_count: bool=False) -> Stringable`**

Aplica un pequeño algoritmo inglés de sufijos, con conteo 2 por defecto. Acepta int, float u objeto con `__len__`; solo un conteo igual a 1 conserva la palabra. En otros casos añade `es` después de s/sh/ch/x/z, cambia consonante-y por ies, f/fe por ves o añade s. `prepend_count=True` antepone el conteo efectivo. Tipos inválidos o prepend_count no bool producen `TypeError`. No implementa nombres irregulares ni excepciones lingüísticas.

```python
from orionis.support.types import Stringable

assert Stringable("city").plural() == "cities"
assert Stringable("cat").plural([1], prepend_count=True) == "1 cat"
assert Stringable("person").plural(2) == "persons"
```

<a id="stringable-method-pluralstudly"></a>

**`pluralStudly(count: int | list | Any=2) -> Stringable`**

Extrae palabras ASCII con `[A-Z][a-z]*|[a-z]+`, pluraliza y capitaliza solo el último token y une todo. Descarta dígitos y separadores cuando hay tokens; las siglas se separan en letras. Sin tokens de letras usa `plural(count).studly()`.

```python
from orionis.support.types import Stringable

assert Stringable("UserCategory").pluralStudly() == "UserCategories"
assert Stringable("User2Category").pluralStudly(1) == "UserCategory"
```

<a id="stringable-method-pluralpascal"></a>

**`pluralPascal(count: int | list | Any=2) -> Stringable`**

Extrae los mismos tokens ASCII y pluraliza el último cuando corresponda; conserva entradas vacías o sin tokens. Listas/tuplas usan su longitud para decidir; otros conteos se comparan directamente con 1 antes de delegar. Descarta dígitos/separadores si hay tokens, por lo que difiere de `pluralStudly` en entradas sin tokens.

```python
from orionis.support.types import Stringable

assert Stringable("UserCategory").pluralPascal(2) == "UserCategories"
assert Stringable("123").pluralPascal() == "123"
```

<a id="stringable-method-singular"></a>

**`singular() -> Stringable`**

Aplica inversión sencilla de sufijos: ies→y, ives→fe, ves→f, es→vacío y s final→vacío salvo ss. No es una inversa general de plural y puede producir palabras inglesas inesperadas, como `houses`→`hous` y `knives`→`knfe`.

```python
from orionis.support.types import Stringable

assert Stringable("cities").singular() == "city"
assert Stringable("knives").singular() == "knfe"
assert Stringable("houses").singular() == "hous"
```

## Codificación, HTML, hash y cifrado

<a id="stringable-method-tobase64"></a>

**`toBase64() -> Stringable`**

Codifica bytes UTF-8 como Base64 estándar y devuelve `Stringable`. Es una codificación, no cifrado; un sustituto Unicode inválido puede producir `UnicodeEncodeError`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").toBase64() == "aGVsbG8="
assert Stringable("café").toBase64().fromBase64() == "café"
```

<a id="stringable-method-frombase64"></a>

**`fromBase64(*, strict: bool=False) -> Stringable`**

Decodifica bytes Base64 estándar como UTF-8. Ante cualquier excepción devuelve vacío por defecto o produce `RuntimeError` con la causa si `strict=True`; strict no bool produce `TypeError`. Strict controla la propagación del error, no la validación del alfabeto: no pasa `validate=True` y puede ignorar caracteres ajenos al alfabeto.

```python
from orionis.support.types import Stringable

assert Stringable("aGVsbG8=").fromBase64() == "hello"
assert Stringable("aGVsbG8=!!").fromBase64(strict=True) == "hello"
assert Stringable("!").fromBase64() == ""
```

<a id="stringable-method-md5"></a>

**`md5() -> str`**

Calcula el hash de los bytes UTF-8 y devuelve un `str` hexadecimal ordinario de 32 caracteres. Estos métodos no devuelven `Stringable`; usa `hash` para encadenar el resumen.

```python
from orionis.support.types import Stringable

assert Stringable("hello").md5() == "5d41402abc4b2a76b9719d911017c592"
assert type(Stringable("hello").md5()) is str
```

<a id="stringable-method-sha1"></a>

**`sha1() -> str`**

Calcula el hash de los bytes UTF-8 y devuelve un `str` hexadecimal ordinario de 40 caracteres. Estos métodos no devuelven `Stringable`; usa `hash` para encadenar el resumen.

```python
from orionis.support.types import Stringable

assert Stringable("hello").sha1() == "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d"
assert type(Stringable("hello").sha1()) is str
```

<a id="stringable-method-sha256"></a>

**`sha256() -> str`**

Calcula el hash de los bytes UTF-8 y devuelve un `str` hexadecimal ordinario de 64 caracteres. Estos métodos no devuelven `Stringable`; usa `hash` para encadenar el resumen.

```python
from orionis.support.types import Stringable

assert Stringable("hello").sha256() == "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
assert type(Stringable("hello").sha256()) is str
```

<a id="stringable-method-hash"></a>

**`hash(algorithm: str) -> Stringable`**

Exige un nombre en `hashlib.algorithms_available`, calcula el hash UTF-8 y devuelve el resumen hexadecimal como `Stringable`. Algoritmos desconocidos producen `ValueError`; su disponibilidad depende de Python/OpenSSL. SHAKE de longitud variable necesita una longitud que este método no acepta, por lo que actualmente produce `TypeError` en `hexdigest()`.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert s.hash("sha256") == s.sha256()
assert isinstance(s.hash("sha256"), Stringable)
```

<a id="stringable-method-striptags"></a>

**`stripTags(allowed_tags: str | None=None) -> Stringable`**

Sin `allowed_tags` verdadero, elimina subcadenas que coincidan con `<[^>]*>` y conserva entidades. Cualquier allowed_tags verdadero ejecuta solo `html.unescape` y conserva todas las etiquetas; no hay lista selectiva. La operación regex no es un analizador ni saneador HTML.

```python
from orionis.support.types import Stringable

assert Stringable("<b>x</b>&amp;").stripTags() == "x&amp;"
assert Stringable("<i>x</i>&amp;").stripTags("<b>") == "<i>x</i>&"
```

<a id="stringable-method-tohtmlstring"></a>

**`toHtmlString() -> Stringable`**

Devuelve el resultado de `html.escape` como `Stringable`: escapa ampersands, ángulos, ambos tipos de comillas y vuelve a escapar ampersands ya codificados. No marca texto como confiable ni omite el escape de plantillas.

```python
from orionis.support.types import Stringable

assert Stringable('<b>"&"</b>').toHtmlString() == "&lt;b&gt;&quot;&amp;&quot;&lt;/b&gt;"
```

<a id="stringable-method-encrypt"></a>

**`encrypt() -> Stringable`**

Delega el valor en la fachada pública `Crypt` (`from orionis.support.facades import Crypt`) sin envolver su resultado. En una aplicación inicializada con `app.key` y `app.cipher` configurados, espera esta llamada mientras Crypt use su modo predeterminado sin fijar. El Encrypter estándar devuelve `str` ordinario, pese a la anotación Stringable, y usa un IV aleatorio, por lo que el cifrado varía. Si Crypt está fijada, devuelve sincrónicamente el resultado del servicio. Resolver sin inicializar produce `RuntimeError`; el servicio rechaza texto vacío con `ValueError`.

El controlador recibe el texto de quien lo invoca y devuelve su valor cifrado en una respuesta JSON:

```python
from orionis.http import JSONResponse
from orionis.support.types import Stringable


class SecretController:
    async def encrypt(self, plaintext: str) -> JSONResponse:
        ciphertext = await Stringable(plaintext).encrypt()
        return JSONResponse({"ciphertext": ciphertext})
```

Para la entrada `"hello"`, la respuesta contiene una cadena cifrada que el mismo encrypter configurado puede descifrar a `"hello"`; sus bytes cambian entre llamadas.

<a id="stringable-method-decrypt"></a>

**`decrypt() -> Stringable`**

Delega el valor en `Crypt.decrypt`. En una aplicación inicializada con la configuración de cifrado correspondiente, espera su dispatcher predeterminado sin fijar; una fachada fijada devuelve directamente el resultado de su servicio. El texto del Encrypter estándar es `str` ordinario, pese a la anotación Stringable. Datos inválidos/vacíos producen `ValueError` del servicio; fallos de autenticación o descifrado pueden propagar `RuntimeError`. Construye un Stringable explícitamente para continuar las transformaciones encadenadas.

Este servicio recibe texto cifrado por la misma aplicación y devuelve el texto original como Stringable:

```python
from orionis.support.types import Stringable


class SecretService:
    async def restore(self, ciphertext: str) -> Stringable:
        plaintext = await Stringable(ciphertext).decrypt()
        return Stringable(plaintext)
```

Restaurar un cifrado de `"hello"` devuelve `Stringable("hello")`; quien lo invoca puede usar después métodos como `.upper()`, que produce `"HELLO"`.

## Callbacks y cadenas condicionales

Todos los métodos condicionales auxiliares usan `when(condition, callback, default=None)`. Sus callbacks reciben el `Stringable` actual y convierten sus resultados según `when`. Devuelve el valor deseado desde un callback de transformación; usa `tap` para observar sin sustituirlo.

<a id="stringable-method-pipe"></a>

**`pipe(callback: Callable) -> Stringable`**

Llama una vez a `callback(self)` y usa su resultado. Conserva un Stringable devuelto; en otro caso construye `Stringable(result)`, de modo que los números se convierten a texto y `None` queda como `"None"`. Siempre devuelve Stringable, no un resultado arbitrario. Un no callable produce `TypeError`; propaga excepciones del callback. No espera callbacks async.

```python
from orionis.support.types import Stringable

assert Stringable("hello").pipe(lambda s: len(s)) == "5"
assert Stringable("hello").pipe(lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-tap"></a>

**`tap(callback: Callable[[Stringable], Any]) -> Stringable`**

Llama a `callback(self)` por su efecto secundario, ignora su resultado y devuelve la misma instancia (`is`). Stringable sigue siendo inmutable. Un no callable falla con `TypeError` al llamarlo; propaga excepciones y no espera callbacks async.

```python
from orionis.support.types import Stringable

seen = []
s = Stringable("hello")
assert s.tap(lambda value: seen.append(str(value))) is s
assert seen == ["hello"]
assert s.tap(lambda value: value.upper()) == "hello"
```

<a id="stringable-method-when"></a>

**`when(condition: bool | Callable, callback: Callable, default: Callable | None=None) -> Stringable`**

Acepta bool o predicado síncrono `condition(self)`; evalúa una vez el predicado y usa el valor booleano de su resultado. Ejecuta `callback(self)` si cumple o `default(self)` si no cumple y existe. Envuelve resultados que no sean Stringable con `Stringable`, incluido `None`→`"None"`. Sin rama seleccionada devuelve la misma instancia. Tipos inválidos producen `TypeError`; propaga excepciones. No espera predicados ni callbacks.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert s.when(lambda value: len(value) > 3, lambda value: value.upper()) == "HELLO"
assert s.when(False, lambda value: "yes", lambda value: "no") == "no"
assert s.when(False, lambda value: value.upper()) is s
assert s.when(True, lambda value: None) == "None"
```

<a id="stringable-method-whencontains"></a>

**`whenContains(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Usa la condición de alguna coincidencia `contains(needles)`, distinguiendo mayúsculas; hereda su soporte de iterables y errores. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").whenContains("world", lambda s: s.upper()) == "HELLO WORLD"
```

<a id="stringable-method-whencontainsall"></a>

**`whenContainsAll(needles: list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Evalúa directamente `all(needle in str(self) for needle in needles)`. A diferencia de `containsAll`, un iterable vacío selecciona el callback y una cadena se recorre carácter a carácter; no aplica la validación estricta de lista. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").whenContainsAll(["hello", "world"], lambda s: s.upper()) == "HELLO WORLD"
assert Stringable("hello").whenContainsAll([], lambda s: "selected") == "selected"
```

<a id="stringable-method-whenempty"></a>

**`whenEmpty(callback: Callable, default: Callable | None=None) -> Stringable`**

Selecciona el callback solo para cadena vacía mediante `isEmpty`; los espacios seleccionan default o conservan el original. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("").whenEmpty(lambda s: "fallback") == "fallback"
```

<a id="stringable-method-whennotempty"></a>

**`whenNotEmpty(callback: Callable, default: Callable | None=None) -> Stringable`**

Selecciona el callback cuando `isNotEmpty()` es verdadero, incluso con solo espacios. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenNotEmpty(lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whenendswith"></a>

**`whenEndsWith(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Usa la condición de algún sufijo `endsWith` distinguiendo mayúsculas, con su soporte de iterables y errores. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("file.py").whenEndsWith(".py", lambda s: s.upper()) == "FILE.PY"
```

<a id="stringable-method-whendoesntendwith"></a>

**`whenDoesntEndWith(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Niega `endsWith`; delega en su API de iterables, más amplia que la validación de `doesntEndWith`. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("file.txt").whenDoesntEndWith(".py", lambda s: s.upper()) == "FILE.TXT"
```

<a id="stringable-method-whenexactly"></a>

**`whenExactly(value: str, callback: Callable, default: Callable | None=None) -> Stringable`**

Usa `exactly(value)`, que exige coincidencia completa distinguiendo mayúsculas y un valor de cadena. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenExactly("hello", lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whennotexactly"></a>

**`whenNotExactly(value: str, callback: Callable, default: Callable | None=None) -> Stringable`**

Niega `exactly(value)`; un valor de comparación que no sea cadena produce `TypeError` antes de seleccionar rama. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenNotExactly("world", lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whenstartswith"></a>

**`whenStartsWith(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Comprueba algún prefijo distinguiendo mayúsculas. Si el argumento no es lista se envuelve en una; cada elemento debe ser cadena (`TypeError` en otro caso). No interpreta tuplas como varios prefijos. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").whenStartsWith(["hi", "hello"], lambda s: s.upper()) == "HELLO WORLD"
```

<a id="stringable-method-whendoesntstartwith"></a>

**`whenDoesntStartWith(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Niega la misma comprobación de algún prefijo de `whenStartsWith`, con la misma validación de cadena/lista. Una lista vacía selecciona el callback. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenDoesntStartWith("world", lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whentest"></a>

**`whenTest(pattern: str, callback: Callable, default: Callable | None=None) -> Stringable`**

Usa `test(pattern)` como condición de búsqueda regex Python; propaga sus errores de patrón/tipo antes de seleccionar rama. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello42").whenTest(r"\d+$", lambda s: s.upper()) == "HELLO42"
```

<a id="stringable-method-whenis"></a>

**`whenIs(pattern: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Usa la coincidencia shell de todo el valor de `isPattern(pattern)`, con ignore_case predeterminado y comportamiento de plataforma. No expone ignore_case; propaga errores de patrón. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello.txt").whenIs("*.txt", lambda s: s.upper()) == "HELLO.TXT"
```

<a id="stringable-method-whenisascii"></a>

**`whenIsAscii(callback: Callable, default: Callable | None=None) -> Stringable`**

Selecciona mediante `isAscii`, que incluye texto vacío y caracteres ASCII de control. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenIsAscii(lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whenisuuid"></a>

**`whenIsUuid(callback: Callable, default: Callable | None=None) -> Stringable`**

Selecciona mediante `isUuid()` sin filtro de versión. Solo valida un valor existente. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("550e8400-e29b-41d4-a716-446655440000").whenIsUuid(lambda s: "uuid") == "uuid"
```

<a id="stringable-method-whenisulid"></a>

**`whenIsUlid(callback: Callable, default: Callable | None=None) -> Stringable`**

Selecciona mediante la comprobación de alfabeto/longitud de `isUlid`, con sus limitaciones de rango documentadas. Los callbacks reciben un argumento Stringable; `default=None` y la conversión/identidad del resultado siguen `when`.

```python
from orionis.support.types import Stringable

assert Stringable("01ARZ3NDEKTSV4RRFFQ69G5FAV").whenIsUlid(lambda s: "ulid") == "ulid"
```
