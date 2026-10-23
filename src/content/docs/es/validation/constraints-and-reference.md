---
title: "Constraints, metadatos y referencia"
description: "Referencia completa de restricciones y reglas nativas: parámetros, tipos admitidos, ejemplos y consideraciones verificadas."
editUrl: true
lastUpdated: false
---

Esta referencia reúne los **47 nombres públicos** de `orionis.schemas.constraints`: **10 restricciones estructurales** y **37 reglas ejecutables**. Las categorías siguientes organizan su consulta; no representan módulos internos separados.

## Cómo leer los ejemplos

Cada uno de los **47 elementos** incluye un schema, un método de controlador con **inyección del schema** y entradas aceptadas/rechazadas. Las tablas conservan sus firmas, valores predeterminados y tipos.

Para probar un ejemplo, copia estos imports y el bloque del elemento elegido a `app/http/controllers/rule_example_controller.py`:

```python
from datetime import date, datetime

from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field
```

Registra el controlador en el archivo de rutas API configurado en tu aplicación. Este registro usa el primer ejemplo; cambia `GreaterThanController` por el controlador que quieras probar:

```python
from app.http.controllers.rule_example_controller import GreaterThanController
from orionis.support.facades import Route

Route.post("/validation/example", GreaterThanController)
```

Envía el cuerpo JSON válido o inválido indicado en cada apartado a `POST /validation/example`, con `Content-Type: application/json`. Por ejemplo, para `GreaterThan`:

```bash
curl -X POST http://localhost:8000/validation/example -H "Content-Type: application/json" -H "Accept: application/json" --data '{"value":1}'
```

El contenedor obtiene el cuerpo de la petición, espera la validación asíncrona e **inyecta la instancia validada** en `payload` antes de ejecutar `__call__()`. Con una entrada válida, estos controladores devuelven JSON con estado 200; una entrada inválida produce la respuesta API 422 y el método no se ejecuta. No necesitas recibir `Request`, invocar el validador ni iniciar un event loop en estas acciones.

Los ejemplos utilizan HTTP para mostrar cómo probar cada condición; **las reglas pertenecen al schema, no al controlador**. Un mismo schema puede reutilizarlas en herramientas MCP, métodos remotos de Realtime y validación explícita en servicios u otros puntos de entrada. Cada integración obtiene su payload y trata los errores de forma distinta; consulta [schemas en los distintos puntos de entrada](/es/validation/integrations) para elegir el flujo correspondiente.

Los ejemplos de archivos utilizan `multipart/form-data`, como se muestra en su apartado. `Unique` requiere además la conexión y los datos indicados. La [guía de integración HTTP](/es/validation/controllers-and-http) explica la inyección en controladores y sus respuestas.

Cada campo de las tablas se declara dentro de una clase `Schema`. Las referencias a `minimum`, `maximum`, `password`, `start` o `end` necesitan también ese campo hermano; los ejemplos correspondientes lo incluyen.

Todos los constructores admiten **`message: str | None = None` como argumento por nombre**. Este argumento sustituye el mensaje de fallo de esa restricción o regla; no altera la condición validada. Para evitar repetirlo, las tablas muestran el resto de sus parámetros. Los parámetros sin valor predeterminado son obligatorios. `—` significa que sólo se admite `message`; `*` introduce argumentos por nombre. Los argumentos variádicos `*prefixes`, `*suffixes`, `*formats`, `*values` y `*mime_types` requieren al menos un elemento.

Las restricciones estructurales se compilan para la conversión de tipos. Las clases derivadas de `Rule` comprueban los valores convertidos: **no reemplazan la anotación de tipo ni transforman datos**. Muchas reglas de texto no añaden errores si reciben otro tipo; declara `str` cuando esperas texto. Permitir `None` en el tipo tampoco desactiva automáticamente todas las reglas.

### Ejecución asíncrona y schemas anidados

Las **37 reglas ejecutables** implementan `async def enforce(...)`: el validador siempre espera su evaluación, incluidas las comprobaciones locales sin I/O. No hay una variante síncrona de regla ni un método alternativo `enforceAsync`. La conversión y las restricciones estructurales permanecen en la primera fase; después se recorren las reglas en su orden de declaración, sin lanzar tareas concurrentes por campo. `ActiveUrl` espera la resolución de nombres, `Unique` espera la consulta de la conexión activa y las reglas que leen archivos delegan esa lectura a un hilo auxiliar.

Las reglas de un schema hijo también se aplican cuando el hijo está dentro de listas, valores de diccionarios, tuplas, sets o frozensets compatibles con la conversión, incluidas colecciones anidadas y opcionales. No necesitas validar manualmente cada elemento. Por ejemplo, si `ContactSchema.email` declara `Email()`, un campo `contacts: list[ContactSchema]` comprueba cada correo y conserva rutas de error como `contacts[0].email`. La [guía de errores](/es/validation/validation-and-errors) explica las rutas y la acumulación de fallos, incluso cuando otro elemento no se pudo convertir.

## Restricciones numéricas

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `GreaterThan` | Número `int`/`float` estrictamente mayor que el límite; la igualdad falla. | `value: int \| float` | `value: Field[int, C.GreaterThan(0)]` |
| `GreaterThanOrEqual` | Número `int`/`float` mayor o igual al límite. | `value: int \| float` | `value: Field[int, C.GreaterThanOrEqual(18)]` |
| `LessThan` | Número `int`/`float` estrictamente menor que el límite; la igualdad falla. | `value: int \| float` | `value: Field[float, C.LessThan(100)]` |
| `LessThanOrEqual` | Número `int`/`float` menor o igual al límite. | `value: int \| float` | `value: Field[int, C.LessThanOrEqual(100)]` |
| `MultipleOf` | Número `int`/`float` divisible por `value`, que debe ser positivo. Para un campo `int`, usa un divisor entero. | `value: int \| float` | `value: Field[int, C.MultipleOf(5)]` |

Las cinco son restricciones estructurales para `int` y `float`; no son reglas de negocio aplicables a cualquier objeto. `Decimal` no admite estos metadatos numéricos. `MultipleOf` exige un divisor mayor que cero. Evita declarar límites incompatibles: no combines `GreaterThan` con `GreaterThanOrEqual`, ni `LessThan` con `LessThanOrEqual` en el mismo campo.

### GreaterThan

1 es mayor que 0; 0 falla por igualdad.

```python
class GreaterThanSchema(Schema):
    value: Field[int, C.GreaterThan(0)]


class GreaterThanController(BaseController):
    async def __call__(self, payload: GreaterThanSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": 1}
```

Cuerpo inválido (422):

```json
{"value": 0}
```

### GreaterThanOrEqual

18 alcanza el mínimo; 17 queda por debajo.

```python
class GreaterThanOrEqualSchema(Schema):
    value: Field[int, C.GreaterThanOrEqual(18)]


class GreaterThanOrEqualController(BaseController):
    async def __call__(self, payload: GreaterThanOrEqualSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": 18}
```

Cuerpo inválido (422):

```json
{"value": 17}
```

### LessThan

99.5 está por debajo de 100; 100.0 falla por igualdad.

```python
class LessThanSchema(Schema):
    value: Field[float, C.LessThan(100)]


class LessThanController(BaseController):
    async def __call__(self, payload: LessThanSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": 99.5}
```

Cuerpo inválido (422):

```json
{"value": 100.0}
```

### LessThanOrEqual

100 está permitido; 101 supera el máximo.

```python
class LessThanOrEqualSchema(Schema):
    value: Field[int, C.LessThanOrEqual(100)]


class LessThanOrEqualController(BaseController):
    async def __call__(self, payload: LessThanOrEqualSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": 100}
```

Cuerpo inválido (422):

```json
{"value": 101}
```

### MultipleOf

15 es múltiplo de 5; 12 no lo es.

```python
class MultipleOfSchema(Schema):
    value: Field[int, C.MultipleOf(5)]


class MultipleOfController(BaseController):
    async def __call__(self, payload: MultipleOfSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": 15}
```

Cuerpo inválido (422):

```json
{"value": 12}
```


## Longitud y patrones

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `MinLength` | Longitud mínima inclusiva de `str`, `bytes` o colección; menos caracteres, bytes o elementos falla. | `value: int` | `value: Field[str, C.MinLength(1)]` |
| `MaxLength` | Longitud máxima inclusiva de `str`, `bytes` o colección; superar el límite falla. | `value: int` | `value: Field[list[str], C.MaxLength(10)]` |
| `Pattern` | Busca una coincidencia de la expresión regular en un `str`; no exige abarcar todo el texto. | `regex: str` | `value: Field[str, C.Pattern(r"^[A-Z]{3}$")]` |

Son restricciones estructurales. `MinLength` y `MaxLength` aceptan valores no negativos y se aplican a `str`, `bytes`, listas, tuplas de longitud variable (`tuple[str, ...]`), conjuntos, conjuntos inmutables y diccionarios. No se admiten sobre tuplas de longitud fija como `tuple[str, str]`. En un diccionario cuentan entradas; no validan por sí solas los valores interiores. `Pattern` opera sólo sobre `str`: usa anclas como `^...$` cuando necesites cubrir todo el texto.

Cada tipo de metadato estructural puede aparecer una sola vez por campo. Un mínimo superior al máximo o un patrón incompatible con el tipo genera un error de definición/configuración, no un fallo normal del valor recibido.

### MinLength

Tres caracteres cumplen el mínimo de dos; uno no.

```python
class MinLengthSchema(Schema):
    value: Field[str, C.MinLength(2)]


class MinLengthController(BaseController):
    async def __call__(self, payload: MinLengthSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "Ada"}
```

Cuerpo inválido (422):

```json
{"value": "A"}
```

### MaxLength

Dos elementos cumplen el máximo; tres lo superan.

```python
class MaxLengthSchema(Schema):
    value: Field[list[str], C.MaxLength(2)]


class MaxLengthController(BaseController):
    async def __call__(self, payload: MaxLengthSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": ["api", "web"]}
```

Cuerpo inválido (422):

```json
{"value": ["api", "web", "console"]}
```

### Pattern

Las anclas exigen tres letras mayúsculas; el dígito de AB1 falla.

```python
class PatternSchema(Schema):
    value: Field[str, C.Pattern(r"^[A-Z]{3}$")]


class PatternController(BaseController):
    async def __call__(self, payload: PatternSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "ABC"}
```

Cuerpo inválido (422):

```json
{"value": "AB1"}
```


## Contenido de texto

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `Alpha` | `str` no vacío formado por letras Unicode y marcas combinantes. Con `ascii_only=True`, sólo letras ASCII. | `*, ascii_only: bool = False` | `value: Field[str, C.Alpha(ascii_only=True)]` |
| `Ascii` | `str` cuyos caracteres son ASCII de 7 bits; permite la cadena vacía. | — | `value: Field[str, C.Ascii()]` |
| `Lowercase` | `str` igual a `value.lower()`. Permite números, signos y texto vacío; no transforma el valor. | — | `value: Field[str, C.Lowercase()]` |
| `Uppercase` | `str` igual a `value.upper()`. Permite caracteres sin mayúscula/minúscula y texto vacío; no transforma. | — | `value: Field[str, C.Uppercase()]` |
| `StartsWith` | `str` que comienza por al menos uno de los prefijos; la comparación distingue mayúsculas. | `*prefixes: str` | `value: Field[str, C.StartsWith("orionis-", "app-")]` |
| `EndsWith` | `str` que termina en al menos uno de los sufijos; la comparación distingue mayúsculas. | `*suffixes: str` | `value: Field[str, C.EndsWith(".json", ".txt")]` |
| `DoesntStartWith` | `str` que no comienza por ninguno de los prefijos prohibidos. | `*prefixes: str` | `value: Field[str, C.DoesntStartWith("admin-", "root-")]` |
| `DoesntEndWith` | `str` que no termina en ninguno de los sufijos prohibidos. | `*suffixes: str` | `value: Field[str, C.DoesntEndWith(".exe", ".bat")]` |
| `Encoding` | `str` que puede codificarse con el codec indicado; en archivos, bytes que pueden decodificarse con él. No convierte el contenido. | `encoding: str = "utf-8"` | `value: Field[str, C.Encoding("ascii")]` |

Los prefijos y sufijos son literales; no son expresiones regulares. Las variantes negativas también distinguen mayúsculas. Un prefijo o sufijo vacío tiene la semántica de `str.startswith()`/`str.endswith()` de Python.

`Encoding()` usa `utf-8` por defecto y rechaza un nombre de codec desconocido al construir la regla. Para texto comprueba si es representable en ese codec, no cuál fue su codificación original. Para un objeto de archivo intenta decodificar los bytes que devuelve `read()`. Si no obtiene contenido y el valor no es texto, no añade un fallo: combínala con `File()` cuando debas exigir un archivo.

### Alpha

Con ascii_only=True, Ada pasa y José falla por é.

```python
class AlphaSchema(Schema):
    value: Field[str, C.Alpha(ascii_only=True)]


class AlphaController(BaseController):
    async def __call__(self, payload: AlphaSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "Ada"}
```

Cuerpo inválido (422):

```json
{"value": "José"}
```

### Ascii

Orionis sólo contiene ASCII; café incluye é.

```python
class AsciiSchema(Schema):
    value: Field[str, C.Ascii()]


class AsciiController(BaseController):
    async def __call__(self, payload: AsciiSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "Orionis"}
```

Cuerpo inválido (422):

```json
{"value": "café"}
```

### Lowercase

La variante en minúsculas pasa; la O mayúscula falla.

```python
class LowercaseSchema(Schema):
    value: Field[str, C.Lowercase()]


class LowercaseController(BaseController):
    async def __call__(self, payload: LowercaseSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "orionis-1"}
```

Cuerpo inválido (422):

```json
{"value": "Orionis-1"}
```

### Uppercase

La variante en mayúsculas pasa; las letras minúsculas fallan.

```python
class UppercaseSchema(Schema):
    value: Field[str, C.Uppercase()]


class UppercaseController(BaseController):
    async def __call__(self, payload: UppercaseSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "ORIONIS-1"}
```

Cuerpo inválido (422):

```json
{"value": "Orionis-1"}
```

### StartsWith

app-blog comienza con uno de los prefijos; blog-app no.

```python
class StartsWithSchema(Schema):
    value: Field[str, C.StartsWith("orionis-", "app-")]


class StartsWithController(BaseController):
    async def __call__(self, payload: StartsWithSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "app-blog"}
```

Cuerpo inválido (422):

```json
{"value": "blog-app"}
```

### EndsWith

La extensión .json pasa; .yaml no está en los sufijos permitidos.

```python
class EndsWithSchema(Schema):
    value: Field[str, C.EndsWith(".json", ".txt")]


class EndsWithController(BaseController):
    async def __call__(self, payload: EndsWithSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "settings.json"}
```

Cuerpo inválido (422):

```json
{"value": "settings.yaml"}
```

### DoesntStartWith

user-report pasa; admin-report utiliza un prefijo prohibido.

```python
class DoesntStartWithSchema(Schema):
    value: Field[str, C.DoesntStartWith("admin-", "root-")]


class DoesntStartWithController(BaseController):
    async def __call__(self, payload: DoesntStartWithSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "user-report"}
```

Cuerpo inválido (422):

```json
{"value": "admin-report"}
```

### DoesntEndWith

report.pdf pasa; run.exe utiliza un sufijo prohibido.

```python
class DoesntEndWithSchema(Schema):
    value: Field[str, C.DoesntEndWith(".exe", ".bat")]


class DoesntEndWithController(BaseController):
    async def __call__(self, payload: DoesntEndWithSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "report.pdf"}
```

Cuerpo inválido (422):

```json
{"value": "run.exe"}
```

### Encoding

cafe se representa en ASCII; café no. La regla no elimina acentos.

```python
class EncodingSchema(Schema):
    value: Field[str, C.Encoding("ascii")]


class EncodingController(BaseController):
    async def __call__(self, payload: EncodingSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "cafe"}
```

Cuerpo inválido (422):

```json
{"value": "café"}
```


## Formatos e identificadores

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `Email` | `str` con formato local de correo ASCII, dominio con punto, hasta 254 caracteres y parte local de hasta 64. No consulta DNS. | — | `value: Field[str, C.Email()]` |
| `ActiveUrl` | `str` del que se pueda extraer un host y resolverlo mediante el resolver del sistema. Falla sin host o si la resolución falla. | — | `value: Field[str, C.ActiveUrl()]` |
| `IpAddress` | `str` con una dirección de la familia seleccionada. Por defecto exige IPv4; `6` exige IPv6 y `None` permite ambas. | `version: int \| None = 4` | `value: Field[str, C.IpAddress(version=None)]` |
| `MacAddress` | `str` con seis pares hexadecimales separados por `:` o `-`, o tres grupos de cuatro separados por puntos. | — | `value: Field[str, C.MacAddress()]` |
| `Json` | `str` que contiene JSON sintácticamente válido, incluidos escalares. No convierte el texto en un objeto. | — | `value: Field[str, C.Json()]` |
| `Uuid` | `str` hexadecimal con guiones en formato `8-4-4-4-12`. Si se especifica versión, comprueba además su dígito y los bits de variante. | `version: int \| None = None` | `value: Field[str, C.Uuid(version=4)]` |
| `Ulid` | `str` de 26 caracteres del alfabeto Crockford, sin distinguir mayúsculas, cuyo primer carácter es como máximo `7`. | — | `value: Field[str, C.Ulid()]` |

`Email` comprueba una forma concreta de correo: no admite nombres para mostrar, partes locales entre comillas ni un dominio sin punto. No verifica que exista la cuenta ni que el servidor reciba correo.

`ActiveUrl` consulta la resolución del host; no realiza una petición HTTP, no exige un esquema HTTP/HTTPS y no comprueba que la aplicación remota responda. Su resultado depende del resolver y de la conectividad. La validación previa a la inyección utiliza su implementación asíncrona, que espera la resolución mediante el event loop.

`IpAddress` sólo acepta `version=4`, `6` o `None`. `Uuid` sólo permite seleccionar `1`, `3`, `4`, `5`, `6`, `7`, `8` o `None`. Con `Uuid()` sin versión se comprueba el formato hexadecimal con guiones, sin exigir bits concretos de versión o variante. `Json`, `Uuid` y `Ulid` conservan un `str`; usa el tipo Python correspondiente cuando necesites una representación distinta.

Las expresiones usadas por `Email`, `MacAddress`, `Uuid` e `Integer` emplean un ancla final `$` que también permite un salto de línea final de Python. No asumas que estas reglas eliminan espacios o normalizan la entrada; agrega una condición propia si tu formato debe prohibir expresamente ese carácter.

### Email

El dominio con punto pasa; el dominio sin punto falla.

```python
class EmailSchema(Schema):
    value: Field[str, C.Email()]


class EmailController(BaseController):
    async def __call__(self, payload: EmailSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "ada@example.com"}
```

Cuerpo inválido (422):

```json
{"value": "ada@localhost"}
```

### ActiveUrl

El ejemplo requiere que el resolver del sistema resuelva localhost. El segundo valor no tiene host.

```python
class ActiveUrlSchema(Schema):
    value: Field[str, C.ActiveUrl()]


class ActiveUrlController(BaseController):
    async def __call__(self, payload: ActiveUrlSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "https://localhost/"}
```

Cuerpo inválido (422):

```json
{"value": "not-a-url"}
```

### IpAddress

version=None permite IPv6; la segunda dirección no es una IP válida.

```python
class IpAddressSchema(Schema):
    value: Field[str, C.IpAddress(version=None)]


class IpAddressController(BaseController):
    async def __call__(self, payload: IpAddressSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "2001:db8::1"}
```

Cuerpo inválido (422):

```json
{"value": "999.1.1.1"}
```

### MacAddress

Los seis pares hexadecimales pasan; ZZ no es hexadecimal.

```python
class MacAddressSchema(Schema):
    value: Field[str, C.MacAddress()]


class MacAddressController(BaseController):
    async def __call__(self, payload: MacAddressSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "00:1A:2B:3C:4D:5E"}
```

Cuerpo inválido (422):

```json
{"value": "00:1A:2B:3C:4D:ZZ"}
```

### Json

El primer texto contiene JSON válido; al segundo le falta un valor.

```python
class JsonSchema(Schema):
    value: Field[str, C.Json()]


class JsonController(BaseController):
    async def __call__(self, payload: JsonSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "{\"active\": true}"}
```

Cuerpo inválido (422):

```json
{"value": "{\"active\": }"}
```

### Uuid

El primero declara versión 4; el segundo declara versión 1.

```python
class UuidSchema(Schema):
    value: Field[str, C.Uuid(version=4)]


class UuidController(BaseController):
    async def __call__(self, payload: UuidSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "550e8400-e29b-41d4-a716-446655440000"}
```

Cuerpo inválido (422):

```json
{"value": "550e8400-e29b-11d4-a716-446655440000"}
```

### Ulid

El primero cabe en el rango; el segundo comienza con 8 y lo excede.

```python
class UlidSchema(Schema):
    value: Field[str, C.Ulid()]


class UlidController(BaseController):
    async def __call__(self, payload: UlidSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "01ARZ3NDEKTSV4RRFFQ69G5FAV"}
```

Cuerpo inválido (422):

```json
{"value": "81ARZ3NDEKTSV4RRFFQ69G5FAV"}
```


## Representaciones numéricas

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `Integer` | Acepta `int` salvo `bool`, `float` sin fracción o `str` de dígitos con signo opcional. No convierte el valor. | — | `value: Field[str, C.Integer()]` |
| `DecimalPlaces` | `int`, `float`, `str` o `Decimal` finito con entre `minimum` y `maximum` decimales. Rechaza `bool` y texto no numérico. | `minimum: int, maximum: int \| None = None` | `value: Field[str, C.DecimalPlaces(2)]` |
| `MaxDigits` | `int` o `str` cuya representación, descontando el signo inicial, tiene como máximo `maximum` caracteres. Rechaza `bool` y `float`. | `maximum: int` | `value: Field[int, C.MaxDigits(6)]` |

`Integer()` es una comprobación de representación, no una conversión a `int`. Si declaras `str`, `"+12"` continúa siendo texto después de validar.

`DecimalPlaces(minimum, maximum=None)` exige exactamente `minimum` decimales cuando se omite `maximum`. Los límites deben ser no negativos y estar ordenados. Cuenta a partir de `Decimal(str(value))`: un texto como `"12.50"` conserva dos decimales; un `float` puede haber perdido ceros finales antes de llegar a la regla. Los valores infinitos y `NaN` fallan. Para usar el tipo `Decimal`, impórtalo desde `decimal`.

`MaxDigits` exige `maximum >= 1`. En texto **cuenta caracteres, no verifica que sean dígitos**: combina `Integer()` y `MaxDigits()` si necesitas ambas condiciones:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class ReferenceSchema(Schema):
    reference: Field[str, C.Integer(), C.MaxDigits(6)]
```

### Integer

El entero con signo pasa y sigue siendo str; el texto decimal falla.

```python
class IntegerSchema(Schema):
    value: Field[str, C.Integer()]


class IntegerController(BaseController):
    async def __call__(self, payload: IntegerSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "+12"}
```

Cuerpo inválido (422):

```json
{"value": "12.5"}
```

### DecimalPlaces

Al omitir maximum, se exigen exactamente dos decimales.

```python
class DecimalPlacesSchema(Schema):
    value: Field[str, C.DecimalPlaces(2)]


class DecimalPlacesController(BaseController):
    async def __call__(self, payload: DecimalPlacesSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "12.50"}
```

Cuerpo inválido (422):

```json
{"value": "12.5"}
```

### MaxDigits

El signo no cuenta: -1234 pasa y 12345 tiene cinco dígitos.

```python
class MaxDigitsSchema(Schema):
    value: Field[int, C.MaxDigits(4)]


class MaxDigitsController(BaseController):
    async def __call__(self, payload: MaxDigitsSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": -1234}
```

Cuerpo inválido (422):

```json
{"value": 12345}
```


## Medidas y comparación entre campos

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `Between` | Medida dentro de los límites inclusivos; falla por debajo de `minimum` o por encima de `maximum`. | `minimum: float, maximum: float` | `value: Field[list[str], C.Between(1, 5)]` |
| `Size` | Medida exactamente igual a `size`, que debe ser no negativo. | `size: float` | `value: Field[list[str], C.Size(3)]` |
| `GreaterThanOrEqualField` | Medida mayor o igual que la del campo hermano indicado. Si alguna medida no puede obtenerse, no añade un error. | `other_field: str` | `value: Field[int, C.GreaterThanOrEqualField("minimum")]` |
| `LessThanOrEqualField` | Medida menor o igual que la del campo hermano indicado. Si alguna medida no puede obtenerse, no añade un error. | `other_field: str` | `value: Field[int, C.LessThanOrEqualField("maximum")]` |

Estas cuatro reglas usan la misma medida:

- `int`, `float` y `Decimal`: su valor numérico, sin valor absoluto; `bool` no tiene medida.
- Texto y otros objetos con longitud: `len(value)`.
- Objetos de archivo: `size / 1024`, en KiB, si `size` es entero.

Un valor sin medida no produce un fallo de estas reglas; la anotación de tipo sigue siendo necesaria. `Between` exige `minimum <= maximum`; ambos extremos son inclusivos. Las referencias de las reglas entre campos son nombres de atributos del schema, no rutas punteadas ni valores límite literales:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class RangeSchema(Schema):
    minimum: int
    maximum: int
    value: Field[
        int,
        C.GreaterThanOrEqualField("minimum"),
        C.LessThanOrEqualField("maximum"),
    ]
```

La comparación usa las medidas de ambos campos; en texto compara longitudes, no orden alfabético. Asegura por separado que los campos referenciados sean obligatorios y tengan tipos adecuados.

### Between

Dos elementos están entre 1 y 3; una lista vacía queda por debajo.

```python
class BetweenSchema(Schema):
    value: Field[list[str], C.Between(1, 3)]


class BetweenController(BaseController):
    async def __call__(self, payload: BetweenSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": ["api", "web"]}
```

Cuerpo inválido (422):

```json
{"value": []}
```

### Size

Se exigen exactamente dos elementos.

```python
class SizeSchema(Schema):
    value: Field[list[str], C.Size(2)]


class SizeController(BaseController):
    async def __call__(self, payload: SizeSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": ["api", "web"]}
```

Cuerpo inválido (422):

```json
{"value": ["api"]}
```

### GreaterThanOrEqualField

El campo value se compara con el atributo minimum, cuyo valor es 10.

```python
class GreaterThanOrEqualFieldSchema(Schema):
    minimum: int
    value: Field[int, C.GreaterThanOrEqualField("minimum")]


class GreaterThanOrEqualFieldController(BaseController):
    async def __call__(self, payload: GreaterThanOrEqualFieldSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"minimum": 10, "value": 10}
```

Cuerpo inválido (422):

```json
{"minimum": 10, "value": 9}
```

### LessThanOrEqualField

El campo value se compara con el atributo maximum, cuyo valor es 10.

```python
class LessThanOrEqualFieldSchema(Schema):
    maximum: int
    value: Field[int, C.LessThanOrEqualField("maximum")]


class LessThanOrEqualFieldController(BaseController):
    async def __call__(self, payload: LessThanOrEqualFieldSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"maximum": 10, "value": 10}
```

Cuerpo inválido (422):

```json
{"maximum": 10, "value": 11}
```


## Fechas, horas y zonas horarias

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `TimezoneAware` | Campo `datetime` o `time` con información de zona horaria. Un valor sin zona falla. | — | `value: Field[datetime, C.TimezoneAware()]` |
| `TimezoneNaive` | Campo `datetime` o `time` sin información de zona horaria. Un valor con zona falla. | — | `value: Field[datetime, C.TimezoneNaive()]` |
| `After` | Fecha estrictamente posterior a la referencia. La igualdad falla. | `reference: object = None` | `value: Field[date, C.After("2025-01-01")]` |
| `AfterOrEqual` | Fecha posterior o igual a la referencia. | `reference: object = None` | `value: Field[date, C.AfterOrEqual("start")]` |
| `Before` | Fecha estrictamente anterior a la referencia. La igualdad falla. | `reference: object = None` | `value: Field[date, C.Before("2030-01-01")]` |
| `BeforeOrEqual` | Fecha anterior o igual a la referencia. | `reference: object = None` | `value: Field[date, C.BeforeOrEqual("end")]` |
| `DateFormat` | `str` interpretable mediante al menos uno de los formatos de la fachada `DateTime`. Si ninguno sirve, falla. | `*formats: str` | `value: Field[str, C.DateFormat("YYYY-MM-DD", "DD/MM/YYYY")]` |

`TimezoneAware` y `TimezoneNaive` son restricciones estructurales para `datetime` y `time`, no para `date`, y son mutuamente excluyentes.

`After`, `AfterOrEqual`, `Before` y `BeforeOrEqual` aceptan valores `date`, `datetime` o texto interpretable por `DateTime`. El parámetro `reference` puede ser uno de esos valores o un nombre de campo hermano. Si el atributo existe y no es `None`, se utiliza antes de intentar interpretar el texto como fecha. `None` compara con el momento actual. También se reconocen los textos `now`, `today`, `tomorrow` y `yesterday`; los tres últimos representan el inicio del día correspondiente.

Si el valor del campo no puede interpretarse como fecha, estas cuatro reglas no añaden error; una referencia que no puede resolverse sí falla. Por eso conviene declarar `date` o `datetime`, o agregar `DateFormat` si se conserva texto. Los formatos de `DateFormat` usan tokens de `DateTime`, como `YYYY-MM-DD`, **no** directivas de `strptime` como `%Y-%m-%d`.

```python
from datetime import date

from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class BookingSchema(Schema):
    start: date
    end: Field[date, C.AfterOrEqual("start")]
```

### TimezoneAware

El texto con Z se convierte en datetime con zona; el otro no tiene zona.

```python
class TimezoneAwareSchema(Schema):
    value: Field[datetime, C.TimezoneAware()]


class TimezoneAwareController(BaseController):
    async def __call__(self, payload: TimezoneAwareSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "2030-06-01T12:00:00Z"}
```

Cuerpo inválido (422):

```json
{"value": "2030-06-01T12:00:00"}
```

### TimezoneNaive

Se acepta la fecha sin zona; el sufijo Z hace fallar esta restricción.

```python
class TimezoneNaiveSchema(Schema):
    value: Field[datetime, C.TimezoneNaive()]


class TimezoneNaiveController(BaseController):
    async def __call__(self, payload: TimezoneNaiveSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "2030-06-01T12:00:00"}
```

Cuerpo inválido (422):

```json
{"value": "2030-06-01T12:00:00Z"}
```

### After

El día posterior pasa; la igualdad falla.

```python
class AfterSchema(Schema):
    value: Field[date, C.After("2025-01-01")]


class AfterController(BaseController):
    async def __call__(self, payload: AfterSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "2025-01-02"}
```

Cuerpo inválido (422):

```json
{"value": "2025-01-01"}
```

### AfterOrEqual

La igualdad con start pasa; un día anterior falla.

```python
class AfterOrEqualSchema(Schema):
    start: date
    value: Field[date, C.AfterOrEqual("start")]


class AfterOrEqualController(BaseController):
    async def __call__(self, payload: AfterOrEqualSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"start": "2025-01-01", "value": "2025-01-01"}
```

Cuerpo inválido (422):

```json
{"start": "2025-01-01", "value": "2024-12-31"}
```

### Before

El día anterior pasa; la igualdad falla.

```python
class BeforeSchema(Schema):
    value: Field[date, C.Before("2030-01-01")]


class BeforeController(BaseController):
    async def __call__(self, payload: BeforeSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "2029-12-31"}
```

Cuerpo inválido (422):

```json
{"value": "2030-01-01"}
```

### BeforeOrEqual

La igualdad con end pasa; un día posterior falla.

```python
class BeforeOrEqualSchema(Schema):
    end: date
    value: Field[date, C.BeforeOrEqual("end")]


class BeforeOrEqualController(BaseController):
    async def __call__(self, payload: BeforeOrEqualSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"end": "2030-01-01", "value": "2030-01-01"}
```

Cuerpo inválido (422):

```json
{"end": "2030-01-01", "value": "2030-01-02"}
```

### DateFormat

El segundo formato permite día/mes/año; los guiones no coinciden con ninguno.

```python
class DateFormatSchema(Schema):
    value: Field[str, C.DateFormat("YYYY-MM-DD", "DD/MM/YYYY")]


class DateFormatController(BaseController):
    async def __call__(self, payload: DateFormatSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "19/10/2026"}
```

Cuerpo inválido (422):

```json
{"value": "19-10-2026"}
```


## Aceptación, valores y contraseñas

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `Accepted` | Acepta `True`, el entero `1` o los textos `yes`, `on`, `1`, `true` sin distinguir mayúsculas. No elimina espacios. | — | `value: Field[bool, C.Accepted()]` |
| `Different` | El valor debe ser distinto de todos los valores literales indicados, mediante la comparación de Python. | `*values: object` | `value: Field[str, C.Different("admin", "root")]` |
| `StrongPassword` | `str` de al menos 8 caracteres, con una mayúscula ASCII, una minúscula ASCII y un dígito ASCII. No exige símbolos. | — | `value: Field[str, C.StrongPassword()]` |
| `ConfirmPassword` | Valor igual al del campo hermano `other_field`; se coloca en el campo de confirmación. Si el hermano no existe, no añade error. | `other_field: str = "password"` | `value: Field[str, C.ConfirmPassword()]` |

`Accepted` no convierte las representaciones aceptadas a booleanos. El tipo del campo decide qué representaciones pueden llegar a la regla. `Different("password")` prohíbe ese texto literal; no lo interpreta como referencia a un campo.

`ConfirmPassword` usa el atributo hermano indicado; `other_field=""` produce un error de construcción. No añade el campo de contraseña ni cifra su contenido. Decláralo y valida su fortaleza por separado:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class PasswordSchema(Schema):
    password: Field[str, C.StrongPassword()]
    password_confirmation: Field[str, C.ConfirmPassword()]
```

### Accepted

La aceptación explícita pasa; False falla.

```python
class AcceptedSchema(Schema):
    value: Field[bool, C.Accepted()]


class AcceptedController(BaseController):
    async def __call__(self, payload: AcceptedSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": true}
```

Cuerpo inválido (422):

```json
{"value": false}
```

### Different

reader difiere de ambos valores literales; admin está prohibido.

```python
class DifferentSchema(Schema):
    value: Field[str, C.Different("admin", "root")]


class DifferentController(BaseController):
    async def __call__(self, payload: DifferentSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200):

```json
{"value": "reader"}
```

Cuerpo inválido (422):

```json
{"value": "admin"}
```

### StrongPassword

El primero contiene mayúscula, minúsculas y dígitos; el segundo no tiene mayúsculas.

```python
class StrongPasswordSchema(Schema):
    value: Field[str, C.StrongPassword()]


class StrongPasswordController(BaseController):
    async def __call__(self, payload: StrongPasswordSchema) -> dict:
        return {"accepted": True}
```

Cuerpo válido (200):

```json
{"value": "Orionis123"}
```

Cuerpo inválido (422):

```json
{"value": "orionis123"}
```

### ConfirmPassword

La confirmación debe coincidir exactamente con password.

```python
class ConfirmPasswordSchema(Schema):
    password: str
    value: Field[str, C.ConfirmPassword()]


class ConfirmPasswordController(BaseController):
    async def __call__(self, payload: ConfirmPasswordSchema) -> dict:
        return {"accepted": True}
```

Cuerpo válido (200):

```json
{"password": "Orionis123", "value": "Orionis123"}
```

Cuerpo inválido (422):

```json
{"password": "Orionis123", "value": "Other123"}
```


## Archivos e imágenes

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `File` | Objeto con atributos `read`, `size`, `filename` y `size` entero mayor que cero. Un archivo vacío falla. | — | `value: Field[object, C.File()]` |
| `Image` | Archivo cuyo `read()` entrega bytes con una cabecera reconocible de PNG, JPEG, GIF, BMP o WebP. | — | `value: Field[object, C.Image()]` |
| `MimeTypes` | Archivo cuyo `content_type` declarado coincide con uno de los tipos o prefijos MIME permitidos. | `*mime_types: str` | `value: Field[object, C.MimeTypes("image/png", "image/jpeg")]` |
| `Dimensions` | Imagen reconocible con ancho y alto distintos de cero que cumple todos los límites y proporciones configurados. | `*; ver firma debajo` | `value: Field[object, C.Dimensions(min_width=100, max_width=1600)]` |

### Objetos de archivo y límites de estas comprobaciones

Estas reglas esperan objetos con los atributos `read`, `size` y `filename`; no reciben una ruta local ni descargan una URL. `File` comprueba los atributos y un tamaño positivo; no intenta leer el contenido. `Image`, `Dimensions` y `Encoding` requieren un `read()` síncrono invocable que devuelva `bytes`. Internamente esperan `asyncio.to_thread(read)` para evitar bloquear el event loop durante esa lectura; no esperan un `async def read()`. Un `OSError` o un resultado distinto de `bytes` se trata como contenido no disponible. En ese caso `Image` y `Dimensions` fallan; `Encoding` conserva el comportamiento indicado en su apartado. La lectura puede tener efectos sobre la posición del objeto si su implementación no la restaura.

`Image` y `Dimensions` inspeccionan cabeceras, sin decodificar la imagen completa ni depender de Pillow. Sus formatos reconocidos son PNG, JPEG, GIF, BMP y WebP; una extensión de archivo o un MIME correcto no bastan para esta comprobación. `MimeTypes` comprueba exclusivamente el `content_type` declarado: elimina parámetros como `; charset=...`, normaliza mayúsculas y espacios y admite un subtipo comodín como `image/*`. No detecta el MIME a partir del contenido.

### Parámetros de `Dimensions`

Todos son opcionales y se pasan por nombre:

```text
Dimensions(
    *,
    min_width: int | None = None,
    max_width: int | None = None,
    min_height: int | None = None,
    max_height: int | None = None,
    width: int | None = None,
    height: int | None = None,
    ratio: float | str | None = None,
    min_ratio: float | str | None = None,
    max_ratio: float | str | None = None,
    message: str | None = None,
)
```

`width` y `height` exigen dimensiones exactas en píxeles. Los límites `min_*` y `max_*` son inclusivos. `ratio`, `min_ratio` y `max_ratio` expresan ancho/alto y aceptan números o textos como `"3/2"`. La proporción exacta tolera una diferencia de `1 / max(width, height)`; los límites de proporción se comparan directamente. Las condiciones configuradas deben cumplirse conjuntamente. Una proporción mal formada o con denominador cero produce `ValueError` al construir la regla.

Combina las comprobaciones que necesitas sobre un objeto ya recibido:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class AvatarSchema(Schema):
    avatar: Field[
        object,
        C.File(),
        C.Image(),
        C.MimeTypes("image/png", "image/jpeg"),
        C.Dimensions(min_width=100, max_width=1600, ratio="1/1"),
        C.Between(1, 2048),
    ]
```

`object` conserva el objeto de archivo y deja las comprobaciones a las reglas. `Between(1, 2048)` exige entre 1 y 2048 KiB; no son píxeles ni bytes. Este schema no procesa multipart por sí mismo: recibe los objetos proporcionados por el sistema de [peticiones y archivos](/es/http/requests).

### Probar los archivos desde una petición

Usa el mismo registro de ruta y el controlador de cada apartado. Los comandos siguientes requieren los archivos locales indicados y envían el campo multipart `value`; no establezcas manualmente `Content-Type`, porque `curl` debe generar el límite multipart. El parser HTTP crea el objeto de archivo antes de que se valide e inyecte el schema. El controlador devuelve sólo un resumen serializable, no el upload completo.


### File

Un archivo no vacío se acepta; un campo de texto en su lugar falla.

```python
class FileSchema(Schema):
    value: Field[object, C.File()]


class FileController(BaseController):
    async def __call__(self, payload: FileSchema) -> dict:
        return {"filename": payload.value.filename, "size": payload.value.size}
```

Petición válida (200):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@document.pdf;type=application/pdf"
```

Petición inválida (422):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=not-a-file"
```


### Image

Usa un PNG real en avatar.png y texto en notes.txt. La cabecera PNG pasa; declarar image/png en el texto no lo convierte en imagen.

```python
class ImageSchema(Schema):
    value: Field[object, C.Image()]


class ImageController(BaseController):
    async def __call__(self, payload: ImageSchema) -> dict:
        return {"filename": payload.value.filename, "size": payload.value.size}
```

Petición válida (200):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@avatar.png;type=image/png"
```

Petición inválida (422):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@notes.txt;type=image/png"
```


### MimeTypes

El mismo archivo se acepta con MIME declarado image/png y falla si se declara text/plain. Esta regla comprueba el MIME declarado, no los bytes.

```python
class MimeTypesSchema(Schema):
    value: Field[object, C.MimeTypes("image/png", "image/jpeg")]


class MimeTypesController(BaseController):
    async def __call__(self, payload: MimeTypesSchema) -> dict:
        return {"filename": payload.value.filename, "size": payload.value.size}
```

Petición válida (200):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@avatar.png;type=image/png"
```

Petición inválida (422):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@avatar.png;type=text/plain"
```


### Dimensions

Usa una imagen real de 800×800 en square-800.png y otra de 800×400 en wide-800x400.png. La primera cumple las dimensiones y proporción; la segunda falla.

```python
class DimensionsSchema(Schema):
    value: Field[object, C.Dimensions(width=800, height=800, ratio="1/1")]


class DimensionsController(BaseController):
    async def __call__(self, payload: DimensionsSchema) -> dict:
        return {"filename": payload.value.filename, "size": payload.value.size}
```

Petición válida (200):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@square-800.png;type=image/png"
```

Petición inválida (422):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@wide-800x400.png;type=image/png"
```


## Base de datos

| Regla o restricción | Condición y tipos | Parámetros adicionales | Campo de ejemplo |
| --- | --- | --- | --- |
| `Unique` | El valor no debe existir en la columna indicada, excluyendo la fila `ignore` cuando se configura. `None` no consulta la base de datos. | `table: str, column: str; ver firma debajo` | `value: Field[str, C.Unique("users", "email")]` |

### Parámetros y consulta de `Unique`

```text
Unique(
    table: str,
    column: str,
    *,
    ignore: object = None,
    ignore_column: str = "id",
    connection: str | None = None,
    message: str | None = None,
)
```

`table` es la tabla y `column` la columna consultada por igualdad. `ignore` excluye las filas cuyo `ignore_column` coincide con ese valor; omitirlo no excluye ninguna. `connection=None` utiliza la conexión predeterminada; para otra conexión utiliza su nombre configurado.

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class CreateUserSchema(Schema):
    email: Field[str, C.Email(), C.Unique("users", "email")]


class UpdateUserSchema(Schema):
    email: Field[
        str,
        C.Email(),
        C.Unique("users", "email", ignore=42, ignore_column="id"),
    ]
```

El identificador `42` representa la fila que se está actualizando; la regla utiliza el valor configurado, no obtiene automáticamente un identificador de la ruta. La tabla, columna, conexión y driver deben existir y estar configurados en la aplicación.

La regla ejecuta una consulta de lectura limitada a una fila mediante el ORM. La validación asíncrona previa a la inyección espera la consulta sobre la conexión actual y conserva su contexto transaccional. Los errores de conexión o consulta se propagan: no se convierten en un simple resultado «no único». Esta comprobación no crea índices ni sustituye una restricción de unicidad de la base de datos.

### Unique

El controlador se ejecuta sólo si el correo no aparece en `users.email`. Configura antes la conexión de la aplicación y prepara una fila con `registered@example.com`; `new@example.com` debe estar libre. El ejemplo comprueba la condición, pero no crea tablas ni guarda al usuario.

```python
class UniqueSchema(Schema):
    value: Field[str, C.Unique("users", "email")]


class UniqueController(BaseController):
    async def __call__(self, payload: UniqueSchema) -> dict:
        return {"value": payload.value}
```

Cuerpo válido (200, correo libre):

```json
{"value": "new@example.com"}
```

Cuerpo inválido (422, correo existente):

```json
{"value": "registered@example.com"}
```


## Metadatos y aliases: no son reglas adicionales

`orionis.schemas.fields` expone aliases de tipado: `Field` (`Annotated`), `Choice` (`Literal`), `Nullable` (`Optional`), `AnyOf` (`Union`), `Constant` (`Final`), `Alias` (`TypeAlias`) y `Static` (`ClassVar`). Su presencia no añade una regla ejecutable. Las anotaciones y valores predeterminados se explican en la [guía de schemas](/es/validation).

Los siguientes objetos se importan de `orionis.schemas.metadata`, no de `constraints`:

| Metadato | Constructor | Propósito |
| --- | --- | --- |
| `Title` | `Title(value: str)` | Título descriptivo del campo. |
| `Description` | `Description(value: str)` | Descripción del campo. |
| `Examples` | `Examples(values: list[object])` | Ejemplos serializables para JSON Schema. |
| `ExtraJsonSchema` | `ExtraJsonSchema(data: dict[str, object])` | Propiedades adicionales para JSON Schema; no añade validación ejecutable. |
| `Extra` | `Extra(data: dict[str, object])` | Datos adicionales asociados al campo. |
| `Message` | `Message(text: str)` | Mensaje personalizado para errores de tipo; no sustituye el mensaje de todas las reglas. |

`DocumentMetadata`, también expuesta por ese módulo, es la base de esos metadatos, no una condición de validación. Para una regla usa su argumento `message`; para errores del tipo declarado usa `Message`:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field
from orionis.schemas.metadata import Description, Message, Title


class QuantitySchema(Schema):
    quantity: Field[
        int,
        C.GreaterThanOrEqual(1, message="Quantity must be positive."),
        Message("Quantity must be an integer."),
        Title("Quantity"),
        Description("Number of items requested."),
    ]
```

En un campo `int`, los límites exclusivos pueden normalizarse a límites inclusivos en la capa de conversión. Para personalizar el mensaje de una condición como entero positivo, `GreaterThanOrEqual(1, message=...)` conserva una correspondencia directa entre la condición y su mensaje.

Consulta la [creación de reglas personalizadas](/es/validation/application-rules) para extender estas comprobaciones.

Para utilizar estos schemas como argumentos y respuestas de controladores, consulta la [integración HTTP](/es/validation/controllers-and-http). Para MCP, Realtime y otros flujos asíncronos, consulta [los demás puntos de entrada](/es/validation/integrations).
