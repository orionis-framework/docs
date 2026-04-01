---
title: Stringable
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Stringable

La clase `Stringable` es un envoltorio fluido e inmutable sobre el tipo `str` nativo de Python. Proporciona una amplia colección de métodos encadenables para operaciones comunes con cadenas — búsqueda, reemplazo, transformación de mayúsculas/minúsculas, codificación, validación y más — sin mutar el valor original. Al extender `str`, puede usarse en cualquier lugar donde se acepte una cadena regular, agregando la conveniencia expresiva de nivel framework.

## Importación

```python
from orionis.support.strings.stringable import Stringable
```

## Creación de una Instancia

```python
s = Stringable("Hello World")
```

Cada método que retorna texto produce una **nueva** instancia de `Stringable`, lo que permite encadenar llamadas de forma fluida:

```python
result = Stringable("  hello world  ").trim().title().finish("!")
# "Hello World!"
```

## Extracción de Subcadenas

### after / afterLast

Retorna la porción de la cadena después de la primera (o última) aparición de un delimitador.

```python
Stringable("foo/bar/baz").after("/")       # "bar/baz"
Stringable("foo/bar/baz").afterLast("/")   # "baz"
```

Si el delimitador no se encuentra, se retorna la cadena original.

### before / beforeLast

Retorna la porción de la cadena antes de la primera (o última) aparición de un delimitador.

```python
Stringable("foo/bar/baz").before("/")      # "foo"
Stringable("foo/bar/baz").beforeLast("/")  # "foo/bar"
```

### between / betweenFirst

Extrae el texto entre dos delimitadores. `between` utiliza la primera aparición del delimitador de inicio y la **primera** aparición del delimitador de fin después de este. `betweenFirst` se comporta de forma idéntica y se ofrece por legibilidad.

```python
Stringable("[hello]").between("[", "]")          # "hello"
Stringable("[a][b]").betweenFirst("[", "]")      # "a"
```

Retorna un `Stringable` vacío cuando alguno de los delimitadores no se encuentra.

### substr

Retorna una subcadena a partir de una posición dada, opcionalmente limitada a una longitud específica.

```python
Stringable("Hello World").substr(6)       # "World"
Stringable("Hello World").substr(0, 5)    # "Hello"
```

### take

Toma caracteres desde el inicio (positivo) o el final (negativo) de la cadena.

```python
Stringable("hello world").take(5)    # "hello"
Stringable("hello world").take(-5)   # "world"
```

### excerpt

Extrae un fragmento alrededor de la primera aparición de una frase, con radio y texto de omisión configurables.

```python
text = Stringable("The quick brown fox jumps over the lazy dog")
text.excerpt("fox", {"radius": 5, "omission": "..."})
# "...brown fox jumps..."
```

Retorna `None` si la frase no se encuentra.

## Búsqueda y Posición

### contains

Verifica si la cadena contiene una o más subcadenas. Acepta una cadena individual o un iterable, con flag opcional de búsqueda sin distinción de mayúsculas.

```python
Stringable("Hello World").contains("World")                         # True
Stringable("Hello World").contains("world", ignore_case=True)       # True
Stringable("Hello World").contains(["foo", "World"])                # True
```

### containsAll

Retorna `True` solo cuando **todas** las agujas de la lista están presentes.

```python
Stringable("hello world foo").containsAll(["hello", "world", "foo"])  # True
Stringable("hello world").containsAll(["hello", "xyz"])               # False
```

### doesntContain

El inverso de `contains`.

```python
Stringable("hello world").doesntContain("xyz")  # True
```

### startsWith / endsWith

```python
Stringable("hello.py").endsWith(".py")                 # True
Stringable("hello.py").endsWith([".py", ".txt"])       # True
Stringable("hello world").startsWith("hello")          # True
```

### doesntStartWith / doesntEndWith

```python
Stringable("hello").doesntStartWith("world")    # True
Stringable("hello.py").doesntEndWith(".txt")    # True
```

### exactly

Comparación de igualdad estricta.

```python
Stringable("hello").exactly("hello")  # True
Stringable("hello").exactly("Hello")  # False
```

### position

Encuentra el índice de la primera aparición de una subcadena, opcionalmente comenzando desde un desplazamiento. Retorna `False` si no se encuentra.

```python
Stringable("hello world").position("world")  # 6
Stringable("hello world").position("xyz")    # False
```

### match / matchAll / isMatch / test

Métodos auxiliares para expresiones regulares:

```python
Stringable("order-1234").match(r"\d+")   # "1234"
Stringable("a1b2c3").matchAll(r"\d")     # ["1", "2", "3"]
Stringable("hello").isMatch(r"^h.*o$")   # True
Stringable("hello").test(r"^h.*o$")      # True  (alias)
```

### isPattern

Coincidencia basada en comodines (`*` y `?`), con modo sin distinción de mayúsculas opcional.

```python
Stringable("hello world").isPattern("hello*")                   # True
Stringable("Hello World").isPattern("hello*", ignore_case=True) # True
```

## Reemplazo

### replace

Reemplaza subcadenas con nuevos valores. Soporta listas paralelas para multi-reemplazo y modo sin distinción de mayúsculas.

```python
Stringable("Hello World").replace("World", "Python")                        # "Hello Python"
Stringable("Hello World").replace("world", "Python", case_sensitive=False)  # "Hello Python"
Stringable("a b c").replace(["a", "b"], ["x", "y"])                         # "x y c"
```

### replaceFirst / replaceLast

Reemplaza solo la primera o última aparición.

```python
Stringable("aaa").replaceFirst("a", "b")  # "baa"
Stringable("aaa").replaceLast("a", "b")   # "aab"
```

### replaceStart / replaceEnd

Reemplaza una subcadena solo si aparece como prefijo o sufijo.

```python
Stringable("helloWorld").replaceStart("hello", "hi")    # "hiWorld"
Stringable("helloWorld").replaceEnd("World", "Python")  # "helloPython"
```

### replaceArray

Reemplaza apariciones de una cadena de búsqueda una a una con elementos sucesivos de una lista.

```python
Stringable("? ? ?").replaceArray("?", ["a", "b", "c"])  # "a b c"
```

### replaceMatches

Reemplazo basado en regex con una cadena o un callable.

```python
Stringable("hello123world").replaceMatches(r"\d+", "NUM")
# "helloNUMworld"

Stringable("hello").replaceMatches(r"[aeiou]", lambda m: m.group(0).upper())
# "hEllO"
```

### remove

Elimina subcadenas completamente.

```python
Stringable("hello world").remove("l")                              # "heo word"
Stringable("Hello World").remove("hello", case_sensitive=False)    # " World"
Stringable("hello world").remove(["hello", " "])                   # "world"
```

### swap

Reemplaza múltiples palabras clave usando un diccionario de mapeo.

```python
Stringable("I love cats").swap({"cats": "dogs"})  # "I love dogs"
```

## Conversión de Mayúsculas/Minúsculas

### lower / upper

```python
Stringable("HELLO World").lower()  # "hello world"
Stringable("hello World").upper()  # "HELLO WORLD"
```

### swapCase

Invierte las mayúsculas/minúsculas de cada carácter.

```python
Stringable("Hello World").swapCase()  # "hELLO wORLD"
```

### camel / kebab / snake / studly / pascal

Convierte entre convenciones de nomenclatura comunes.

```python
Stringable("hello_world").camel()    # "helloWorld"
Stringable("helloWorld").kebab()     # "hello-world"
Stringable("helloWorld").snake()     # "hello_world"
Stringable("helloWorld").snake(".")  # "hello.world"
Stringable("hello_world").studly()   # "HelloWorld"
Stringable("hello_world").pascal()   # "HelloWorld"  (alias de studly)
```

### title / headline / apa

```python
Stringable("hello world").title()      # "Hello World"
Stringable("hello world").headline()   # "Hello World"

Stringable("the quick brown fox").apa()
# "The Quick Brown Fox"  — Estilo APA: palabras cortas en minúsculas excepto primera/última
```

### ucfirst / lcfirst

Convierte a mayúscula o minúscula **solo** el primer carácter.

```python
Stringable("hello world").ucfirst()  # "Hello world"
Stringable("Hello World").lcfirst()  # "hello World"
```

### convertCase

Conversión basada en modo numérico:

| Modo | Efecto |
|------|--------|
| `None` / `0` | casefold |
| `1` | MAYÚSCULAS |
| `2` | minúsculas |
| `3` | Título |

```python
Stringable("HELLO").convertCase(2)  # "hello"
```

### slug

Genera un slug amigable para URLs. Soporta un separador personalizado y un diccionario de reemplazo de caracteres.

```python
Stringable("Hello World!").slug()                   # "hello-world"
Stringable("Hello World").slug("_")                 # "hello_world"
Stringable("user@example").slug()                   # "user-at-example"
```

## Recorte y Relleno

### trim / ltrim / rtrim

```python
Stringable("  hello  ").trim()      # "hello"
Stringable("--hello--").trim("-")   # "hello"
Stringable("  hello  ").ltrim()     # "hello  "
Stringable("  hello  ").rtrim()     # "  hello"
```

### lStrip / rStrip

Envoltorios estilo Python para `lstrip` / `rstrip` que retornan un `Stringable`.

```python
Stringable("xxhello").lStrip("x")   # "hello"
Stringable("helloxx").rStrip("x")   # "hello"
```

### padBoth / padLeft / padRight

Rellena la cadena para alcanzar una longitud total deseada.

```python
Stringable("hi").padBoth(6)        # "  hi  "
Stringable("hi").padLeft(5)        # "   hi"
Stringable("5").padLeft(3, "0")    # "005"
Stringable("hi").padRight(5)       # "hi   "
```

### zFill

Rellena con ceros a la izquierda.

```python
Stringable("42").zFill(5)  # "00042"
```

### squish

Colapsa espacios en blanco consecutivos en un solo espacio y recorta.

```python
Stringable("  hello   world  ").squish()  # "hello world"
```

### deduplicate

Colapsa apariciones consecutivas de un carácter en una sola.

```python
Stringable("hello   world").deduplicate()   # "hello world"
Stringable("aabbcc").deduplicate("b")       # "aabcc"
```

## Construcción y Envolvimiento

### append / prepend

```python
Stringable("hello").append(" world", "!")          # "hello world!"
Stringable("world").prepend("hello ", "dear ")     # "hello dear world"
```

### newLine

Agrega uno o más caracteres de nueva línea.

```python
Stringable("hello").newLine()    # "hello\n"
Stringable("hello").newLine(2)   # "hello\n\n"
```

### finish / start

Asegura que la cadena termina (o comienza) con un valor dado — **no** lo duplica si ya está presente.

```python
Stringable("path/to").finish("/")       # "path/to/"
Stringable("path/to/").finish("/")      # "path/to/"
Stringable("world").start("hello ")     # "hello world"
```

### wrap / unwrap

```python
Stringable("hello").wrap('"')                # '"hello"'
Stringable("hello").wrap("[", "]")           # "[hello]"
Stringable('"hello"').unwrap('"')            # "hello"
Stringable("[hello]").unwrap("[", "]")       # "hello"
```

### repeat

```python
Stringable("ab").repeat(3)   # "ababab"
Stringable("ab").repeat(0)   # ""
```

### reverse

```python
Stringable("hello").reverse()  # "olleh"
```

## Limitación y Truncamiento

### limit

Trunca la cadena a un número máximo de caracteres. Un flag opcional `preserve_words` evita cortar a mitad de palabra.

```python
Stringable("hello world").limit(5)                                   # "hello..."
Stringable("hello world").limit(5, " [more]")                        # "hello [more]"
Stringable("hello world foo").limit(8, "...", preserve_words=True)   # truncamiento seguro por palabras
```

### words

Limita a un número máximo de palabras.

```python
Stringable("one two three four").words(2)  # "one two..."
```

### mask

Enmascara una porción de la cadena con un carácter repetido.

```python
Stringable("password").mask("*", 2, 4)  # "pa****rd"
Stringable("hello").mask("*", 2)        # "he***"
Stringable("hello").mask("*", -3)       # "he***"
```

## División

### explode

Divide por un delimitador literal.

```python
Stringable("a,b,c").explode(",")  # ["a", "b", "c"]
```

### split

Divide por una expresión regular o por longitud de fragmento.

```python
Stringable("a1b2c3").split(r"\d")  # ["a", "b", "c", ""]
Stringable("abcdef").split(2)      # ["ab", "cd", "ef"]
```

### ucsplit

Divide en las fronteras de mayúsculas.

```python
Stringable("helloWorld").ucsplit()  # ["hello", "World"]
```

## Conteo

### length

```python
Stringable("hello").length()  # 5
```

### wordCount

```python
Stringable("hello world").wordCount()  # 2
```

### substrCount

Cuenta apariciones no superpuestas de una subcadena, opcionalmente dentro de una ventana offset/length.

```python
Stringable("banana").substrCount("an")  # 2
```

## Ajuste de Texto

### wordWrap

Ajusta el texto a un ancho de línea especificado.

```python
long_text = Stringable("This is a long sentence that needs wrapping")
long_text.wordWrap(20)
```

## Codificación y Hashing

### toBase64 / fromBase64

```python
Stringable("hello").toBase64()            # "aGVsbG8="
Stringable("aGVsbG8=").fromBase64()       # "hello"
```

`fromBase64` acepta un parámetro solo por nombre `strict`. Cuando `strict=True`, una entrada inválida lanza un `RuntimeError` en lugar de retornar una cadena vacía.

### md5 / sha1 / sha256

Métodos de hashing convenientes que retornan cadenas de resumen hexadecimal.

```python
Stringable("hello").md5()     # resumen hex de 32 caracteres
Stringable("hello").sha1()    # resumen hex de 40 caracteres
Stringable("hello").sha256()  # resumen hex de 64 caracteres
```

### hash

Aplica hash con cualquier algoritmo soportado por `hashlib`.

```python
Stringable("hello").hash("sha256")  # equivalente a .sha256()
```

### toHtmlString / stripTags

```python
Stringable("<b>Hello</b>").toHtmlString()  # "&lt;b&gt;Hello&lt;/b&gt;"
Stringable("<p>Hello <b>World</b></p>").stripTags()  # "Hello World"
```

### ascii / transliterate

Elimina o reemplaza caracteres no ASCII.

```python
Stringable("café").ascii()                         # "cafe"
Stringable("café").transliterate("?", strict=True) # "caf?"
```

### encrypt / decrypt

Cifra y descifra mediante la fachada `Crypt` del framework. Requiere que el servicio Encrypter esté registrado.

```python
encrypted = Stringable("secret").encrypt()
decrypted = encrypted.decrypt()
```

## Conversión de Tipos

### toInteger / toFloat / toBoolean

```python
Stringable("42").toInteger()       # 42
Stringable("0xff").toInteger(16)   # 255
Stringable("3.14").toFloat()       # 3.14
Stringable("true").toBoolean()     # True
Stringable("0").toBoolean()        # False
```

### value

Retorna el `str` plano subyacente.

```python
Stringable("hello").value()  # "hello" (tipo: str)
```

### jsonSerialize

Retorna un `str` plano apto para codificación JSON.

```python
Stringable("hello").jsonSerialize()  # "hello"
```

## Validación

### isEmpty / isNotEmpty

```python
Stringable("").isEmpty()          # True
Stringable("hello").isNotEmpty()  # True
```

### Verificaciones de Tipo de Carácter

| Método | Retorna `True` cuando… |
|---|---|
| `isAlnum()` | Todos los caracteres son alfanuméricos |
| `isAlpha()` | Todos los caracteres son alfabéticos |
| `isDecimal()` | Todos los caracteres son dígitos decimales |
| `isDigit()` | Todos los caracteres son dígitos |
| `isIdentifier()` | Es un identificador Python válido |
| `isLower()` | Todos los caracteres con casing están en minúsculas |
| `isUpper()` | Todos los caracteres con casing están en mayúsculas |
| `isNumeric()` | Todos los caracteres son numéricos |
| `isPrintable()` | Todos los caracteres son imprimibles |
| `isSpace()` | Solo caracteres de espacio en blanco |
| `isTitle()` | Cadena en formato título |
| `isAscii()` | Solo caracteres ASCII de 7 bits |

### isJson

```python
Stringable('{"key": "value"}').isJson()  # True
Stringable("not json").isJson()          # False
```

### isUrl

Valida una URL, opcionalmente restringiendo a protocolos específicos.

```python
Stringable("https://example.com").isUrl()                        # True
Stringable("ftp://example.com").isUrl(protocols=["ftp"])         # True
```

### isUuid / isUlid

```python
Stringable("550e8400-e29b-41d4-a716-446655440000").isUuid()  # True
Stringable("550e8400-e29b-41d4-a716-446655440000").isUuid(4) # True (versión 4)
Stringable("01ARZ3NDEKTSV4RRFFQ69G5FAV").isUlid()            # True
```

## Pluralización

### plural / singular

Reglas básicas de pluralización del inglés.

```python
Stringable("cat").plural()           # "cats"
Stringable("cat").plural(1)          # "cat"
Stringable("baby").plural()          # "babies"
Stringable("bus").plural()           # "buses"
Stringable("cat").plural(3, prepend_count=True)  # "3 cats"

Stringable("cats").singular()        # "cat"
Stringable("babies").singular()      # "baby"
```

### pluralStudly / pluralPascal

Pluraliza la última palabra de una cadena en StudlyCase o PascalCase.

```python
Stringable("BlogPost").pluralStudly()   # "BlogPosts"
Stringable("UserProfile").pluralPascal()  # "UserProfiles"
```

## Análisis de Callbacks

### parseCallback

Analiza una cadena estilo `Class@method` en sus componentes.

```python
Stringable("MyClass@myMethod").parseCallback()         # ["MyClass", "myMethod"]
Stringable("MyClass").parseCallback("handle")          # ["MyClass", "handle"]
Stringable("MyClass").parseCallback()                  # ["MyClass", None]
```

## Utilidades de Rutas

### basename / dirname

```python
Stringable("/home/user/file.txt").basename()           # "file.txt"
Stringable("/home/user/file.txt").basename(".txt")     # "file"
Stringable("/home/user/file.txt").dirname()            # "/home/user"
```

## Acceso por Posición

### offsetExists / offsetGet / charAt

```python
Stringable("hello").offsetExists(2)   # True
Stringable("hello").offsetExists(99)  # False
Stringable("hello").offsetGet(1)      # "e"
Stringable("hello").charAt(0)         # "h"
Stringable("hello").charAt(99)        # False
```

`Stringable` también soporta indexación y slicing estándar:

```python
Stringable("hello")[1]      # Stringable("e")
Stringable("hello")[1:4]    # Stringable("ell")
```

## Extracción Numérica

### numbers

Elimina todos los caracteres no numéricos.

```python
Stringable("phone: +1-234-567").numbers()  # "1234567"
```

### scan

Extrae valores usando un formato simplificado estilo `sscanf` con los marcadores `%s`, `%d` y `%f`.

```python
Stringable("John 30 5.9").scan("%s %d %f")  # ["John", "30", "5.9"]
```

## Reemplazo de Subcadenas

### substrReplace

Reemplaza texto dentro de un rango específico de la cadena usando offset y longitud.

```python
Stringable("hello world").substrReplace("Python", 6, 5)  # "hello Python"
```

## Ejecución Condicional

Todos los métodos `when*` aceptan un callback y un default opcional. El callback recibe el `Stringable` actual y su valor de retorno se convierte en la nueva cadena. Si la condición es `False` y no se proporciona default, se retorna la cadena original sin cambios.

### when

Ejecuta un callback condicionalmente basado en una condición booleana o callable.

```python
Stringable("hello").when(True, lambda s: s.upper())           # "HELLO"
Stringable("hello").when(False, lambda s: s.upper())          # "hello"
Stringable("hello").when(lambda s: s.isNotEmpty(), lambda s: s.upper())  # "HELLO"
```

### whenContains / whenContainsAll

```python
Stringable("hello world").whenContains("world", lambda s: s.upper())
# "HELLO WORLD"
```

### whenEmpty / whenNotEmpty

```python
Stringable("").whenEmpty(lambda s: Stringable("default"))  # "default"
Stringable("hello").whenNotEmpty(lambda s: s.upper())      # "HELLO"
```

### whenStartsWith / whenDoesntStartWith

```python
Stringable("hello world").whenStartsWith("hello", lambda s: s.upper())
# "HELLO WORLD"
```

### whenEndsWith / whenDoesntEndWith

```python
Stringable("hello.py").whenEndsWith(".py", lambda s: s.upper())
# "HELLO.PY"
```

### whenExactly / whenNotExactly

```python
Stringable("hello").whenExactly("hello", lambda s: s.upper())     # "HELLO"
Stringable("hello").whenNotExactly("world", lambda s: s.upper())  # "HELLO"
```

### whenTest / whenIs / whenIsAscii / whenIsUuid / whenIsUlid

```python
Stringable("hello123").whenTest(r"\d+", lambda s: s.upper())  # "HELLO123"
```

## Pipelines y Efectos Secundarios

### pipe

Pasa la cadena a través de un callback y retorna el resultado.

```python
Stringable("hello").pipe(lambda s: s.upper())  # "HELLO"
```

### tap

Ejecuta un callback de efecto secundario sin modificar la cadena. Útil para logging o depuración dentro de una cadena de llamadas.

```python
Stringable("hello").tap(lambda s: print(s)).upper()  # imprime "hello", retorna "HELLO"
```

## Análisis de Fechas

### toDate

Convierte la cadena en un objeto `datetime` usando el formato especificado (por defecto `%Y-%m-%d`). El datetime resultante incluye zona horaria usando la zona local del framework.

```python
Stringable("2026-04-01").toDate()              # datetime(2026, 4, 1, ...)
Stringable("01/04/2026").toDate("%d/%m/%Y")    # datetime(2026, 4, 1, ...)
```

Lanza `ValueError` si la cadena no coincide con el formato.
