---
title: "Declarar schemas y convertir datos"
description: "Genera schemas con el CLI, define campos y aliases y reutiliza la validación asíncrona en HTTP, MCP, Realtime y otros puntos de entrada."
editUrl: true
lastUpdated: false
---

Un schema es una clase que hereda de `orionis.schemas.Schema`. Sus anotaciones describen los datos aceptados; las restricciones y reglas se adjuntan a cada campo. La validación asíncrona convierte esos datos y espera sus reglas antes de entregar una instancia tipada.

En una acción de un [controlador HTTP](/es/validation/controllers-and-http), declara un parámetro con ese tipo: el contenedor valida el cuerpo e inyecta la instancia antes de ejecutar el método. Los schemas también se integran con herramientas MCP y Realtime mediante sus adaptadores, y se pueden validar explícitamente desde servicios o tareas. La [guía de integraciones](/es/validation/integrations) explica la entrada y la resolución de cada contexto; no todos reciben un cuerpo HTTP.

## Generar un schema con el CLI

Desde la raíz del proyecto, utiliza cualquiera de estas alternativas:

```bash
orionis make:http-schema UserSchema
```

```bash
python -B reactor make:http-schema UserSchema
```

La sintaxis es `make:http-schema name`. `name` es un argumento posicional obligatorio de tipo `str`; no tiene valor predeterminado. Este generador no añade flags propios. Para consultar su ayuda:

```bash
orionis make:http-schema --help
python -B reactor make:http-schema --help
```

El destino predeterminado es `app/http/schemas`, correspondiente a la ruta configurada `app_http_schemas`. Esta ubicación es una convención del generador HTTP, no una restricción de uso: la clase generada puede importarse desde una herramienta MCP, Realtime o un servicio. El comando añade el sufijo `Schema` cuando el nombre no termina ya con él, sin distinguir mayúsculas y minúsculas.

La normalización del archivo y de la clase es distinta: el archivo se convierte a minúsculas y conserva los guiones bajos; la clase une las palabras separadas por guiones bajos y pone en mayúscula su inicial. No se inserta un guion bajo entre las palabras de un nombre CamelCase.

| Argumento `name` | Archivo generado | Clase |
| --- | --- | --- |
| `UserSchema` | `app/http/schemas/userschema.py` | `UserSchema` |
| `User` | `app/http/schemas/user_schema.py` | `UserSchema` |
| `user_schema` | `app/http/schemas/user_schema.py` | `UserSchema` |
| `Admin/CreateUserSchema` | `app/http/schemas/admin/createuserschema.py` | `CreateUserSchema` |

Se admiten subdirectorios con `/` o `\`; sus nombres se convierten a minúsculas y los directorios necesarios se crean automáticamente. Cada componente debe comenzar por una letra y contener únicamente letras ASCII, dígitos o guiones bajos. No se admiten rutas absolutas, segmentos vacíos, `.`, `..` ni nombres con guiones medios.

Si el último componente incluye una extensión, como `user_schema.py`, el generador la elimina antes de normalizar el nombre y crea el archivo `.py`.

Si el archivo ya existe, el comando informa del error y conserva su contenido. No hay una opción de sobrescritura.

### Estructura generada

Para `UserSchema`, el contenido generado por `http_schema.stub` es:

```python
from orionis.schemas import Schema

class UserSchema(Schema):
    """
    Declare the fields and validation rules for an HTTP payload.

    Add typed fields and schema metadata to describe the accepted request data.
    """
```

La importación expone la clase base pública. La clase generada contiene únicamente el docstring: no incorpora campos, reglas ni métodos propios. Añade las declaraciones que necesita el payload.

## Declarar los campos

Este ejemplo reemplaza el contenido de `app/http/schemas/userschema.py`:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import (
    Email,
    GreaterThanOrEqual,
    LessThanOrEqual,
    MaxLength,
    MinLength,
)
from orionis.schemas.fields import Field
from orionis.schemas.metadata import Description, Examples, Message, Title


class UserSchema(Schema):
    name: Field[
        str,
        MinLength(2),
        MaxLength(80),
        Title("Name"),
        Description("User display name."),
        Examples(["Ada"]),
    ]
    email: Field[str, Email(), MaxLength(254)]
    age: Field[
        int,
        GreaterThanOrEqual(18),
        LessThanOrEqual(120),
        Message("Age must be an integer."),
    ]
    nickname: str | None = None
    newsletter: bool = False
```

- `name` es una cadena obligatoria de 2 a 80 caracteres. Sus metadatos documentales describen el campo.
- `email` es obligatorio; combina el tipo `str`, una regla de formato `Email()` y un límite de longitud.
- `age` es un entero obligatorio entre 18 y 120, ambos inclusive. `Message` personaliza el error de tipo; los límites mantienen sus propios mensajes.
- `nickname` se puede omitir o enviar como `None`.
- `newsletter` se puede omitir y entonces vale `False`. Si se envía, debe ser un booleano.

Los campos obligatorios aparecen antes de los campos con valor predeterminado, siguiendo el orden de declaración que utiliza `msgspec.Struct`.

:::note[Anotaciones del módulo]
En los módulos que declaran schemas, utiliza las anotaciones nativas de Python y evita `from __future__ import annotations`. `SchemaMeta` utiliza el mecanismo de anotaciones diferidas de Python para compilar las restricciones; convertirlas en cadenas mediante ese import impide esa compilación.
:::

### Recibir el schema en una acción

Guarda esta acción en `app/http/controllers/preview_user_controller.py`:

```python
from app.http.schemas.userschema import UserSchema
from orionis.http.base import BaseController


class PreviewUserController(BaseController):
    async def __call__(self, payload: UserSchema) -> dict:
        return payload.toDict()
```

Registra la ruta en el archivo API configurado, normalmente `routes/api.py`:

```python
from app.http.controllers.preview_user_controller import PreviewUserController
from orionis.support.facades import Route

Route.post("/users/preview", PreviewUserController)
```

Con un `POST /users/preview` y `Content-Type: application/json`, envía:

```json
{"name": "Ada", "email": "ada@example.com", "age": 36}
```

El contenedor entrega `payload` como una instancia validada de `UserSchema`. La acción accede a sus atributos y devuelve JSON; `nickname` será `null` y `newsletter`, `false`. No necesita recibir `Request`, leer el cuerpo ni llamar al validador. Si necesitas otros datos de la petición, puedes [recibir `Request` y el schema juntos](/es/validation/controllers-and-http#schema-o-request).

### Campo obligatorio, nullable y predeterminado

Permitir `None` y permitir omitir un campo son decisiones distintas:

```python
from orionis.schemas import Schema


class PresenceSchema(Schema):
    required_nullable: str | None
    optional_nullable: str | None = None
    optional_name: str = "Guest"
```

`required_nullable` debe estar presente, aunque su valor puede ser `None`. `optional_nullable` permite tanto ausencia como `None`. `optional_name` permite ausencia, pero no `None`. Declara valores predeterminados coherentes con el tipo y las restricciones del campo.

## Tipos, restricciones, reglas y metadatos

### Tipos y aliases

Los tipos determinan la estructura de los datos: `str`, `int`, `float`, `bool`, `list[int]`, `dict[str, str]`, `date`, `datetime`, `UUID` o un schema hijo, entre los tipos compatibles con `msgspec`.

`orionis.schemas.fields` expone estos aliases de `typing`; no son reglas adicionales:

| Alias | Equivalente | Uso |
| --- | --- | --- |
| [`Field`](#field) | `Annotated` | Adjuntar restricciones, reglas y metadatos a un tipo. |
| [`Choice`](#choice) | `Literal` | Declarar valores literales permitidos. |
| [`Nullable`](#nullable) | `Optional` | Permitir `None`; no añade un valor predeterminado. |
| [`AnyOf`](#anyof) | `Union` | Declarar tipos alternativos compatibles. |
| [`Constant`](#constant) | `Final` | Anotación de intención para herramientas de tipos; no es una regla de validación. |
| [`Alias`](#alias) | `TypeAlias` | Declarar aliases de tipos. |
| [`Static`](#static) | `ClassVar` | Declarar un atributo de clase en lugar de un campo del payload. |

Los siguientes ejemplos muestran schemas inyectados en acciones asíncronas. Son alternativas independientes: para probar uno, guarda su bloque completo en `app/http/controllers/alias_example_controller.py` y registra esta ruta API una sola vez:

```python
from app.http.controllers.alias_example_controller import AliasExampleController
from orionis.support.facades import Route

Route.post("/validation/alias-example", AliasExampleController)
```

Envía el cuerpo indicado a `POST /validation/alias-example` con `Content-Type: application/json`. El contenedor valida el schema antes de llamar a `__call__`; la acción solo accede a los campos validados. Con el manejo API predeterminado, los ejemplos válidos devuelven JSON `200` y los inválidos generan errores `422`, sin ejecutar la acción. La petición debe superar los middleware de la ruta.

Para facilitar la copia, cada ejemplo reúne schema y controlador en un módulo. En tu aplicación puedes separar las clases en `app/http/schemas` y `app/http/controllers`, importando el schema en el controlador.

#### Field

Usa `Field` cuando un campo necesita restricciones, reglas o metadatos además de su tipo. El primer argumento es el tipo; los siguientes añaden sus condiciones y descripción. Aquí el nombre público debe tener entre 2 y 60 caracteres.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import MaxLength, MinLength
from orionis.schemas.fields import Field
from orionis.schemas.metadata import Description


class DisplayNameSchema(Schema):
    name: Field[str, MinLength(2), MaxLength(60), Description("Public name.")]


class AliasExampleController(BaseController):
    async def __call__(self, payload: DisplayNameSchema) -> dict:
        return {"name": payload.name}
```

`"Ada"` pasa la validación; `"A"` o una cadena de 61 caracteres generan `ValidationException`. `Description` documenta el campo y no modifica su valor.

Envía `{"name": "Ada"}`: la acción responde `{"name": "Ada"}`.

#### Choice

Usa `Choice` para un conjunto cerrado de valores, como la prioridad de un ticket. Cada literal se declara explícitamente; el valor predeterminado sigue siendo una decisión separada.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.fields import Choice


class TicketSchema(Schema):
    priority: Choice["low", "normal", "high"] = "normal"


class AliasExampleController(BaseController):
    async def __call__(self, payload: TicketSchema) -> dict:
        return {"priority": payload.priority}
```

`"high"` es válido y omitir `priority` aplica `"normal"`. Un valor como `"urgent"` se rechaza; los textos distinguen mayúsculas y minúsculas.

Envía `{"priority": "high"}` para obtener `{"priority": "high"}`, o `{}` para obtener `{"priority": "normal"}`.

#### Nullable

Usa `Nullable[T]` cuando `None` representa un valor válido, por ejemplo un nombre visible todavía no definido. Permitir `None` y permitir omitir el campo son decisiones distintas.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.fields import Nullable


class ProfileSchema(Schema):
    display_name: Nullable[str]
    nickname: Nullable[str] = None


class AliasExampleController(BaseController):
    async def __call__(self, payload: ProfileSchema) -> dict:
        return payload.toDict()
```

`display_name` debe enviarse, aunque sea `None`; omitirlo produce un error de campo obligatorio. `nickname` se puede omitir porque tiene `= None`. Un entero no es válido para ninguno de estos campos.

Envía `{"display_name": null}`: la acción responde `{"display_name": null, "nickname": null}`. Enviar `{}` o `{"display_name": 42}` produce errores antes de ejecutar la acción.

#### AnyOf

Usa `AnyOf` cuando una operación admite tipos alternativos, como un identificador numérico o una referencia externa de texto. El resultado conserva el tipo que corresponde a la entrada.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.fields import AnyOf


class LookupSchema(Schema):
    reference: AnyOf[int, str]


class AliasExampleController(BaseController):
    async def __call__(self, payload: LookupSchema) -> dict:
        return {"reference": payload.reference}
```

Una lista o `None` se rechazan en este ejemplo. Las alternativas deben ser compatibles con `msgspec`: no cualquier combinación es válida. Por ejemplo, `AnyOf[str, bytes]` no está admitida por el conversor; no la utilices como declaración de un campo.

Envía `{"reference": 42}` o `{"reference": "SKU-42"}`: la acción devuelve el mismo identificador, manteniendo su tipo numérico o de texto.

#### Constant

Usa `Constant` para señalar a las herramientas de tipos una constante de configuración a nivel de módulo. Puedes utilizar esa constante como valor predeterminado de un campo normal.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.fields import Constant


DEFAULT_PAGE_SIZE: Constant[int] = 20


class PaginationSchema(Schema):
    page_size: int = DEFAULT_PAGE_SIZE


class AliasExampleController(BaseController):
    async def __call__(self, payload: PaginationSchema) -> dict:
        return {"page_size": payload.page_size}
```

`Constant` equivale a `Final`: no impone inmutabilidad en tiempo de ejecución ni obliga a que el cliente envíe `20`. El ejemplo acepta `50` porque `page_size` es un campo `int`. Para aceptar únicamente un valor concreto en el payload, declara `Choice[20]`.

Envía `{}` para recibir `{"page_size": 20}`; envía `{"page_size": 50}` para recibir `{"page_size": 50}`. Una cadena como `{"page_size": "50"}` se rechaza.

#### Alias

Usa `Alias` para dar nombre a un tipo que se reutiliza en varios schemas. También puedes reutilizar un `Field` con sus restricciones, como el nombre público de un perfil.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import MaxLength, MinLength
from orionis.schemas.fields import Alias, Field


DisplayName: Alias = Field[str, MinLength(2), MaxLength(60)]


class CreateProfileSchema(Schema):
    name: DisplayName


class RenameProfileSchema(Schema):
    new_name: DisplayName


class AliasExampleController(BaseController):
    async def __call__(self, payload: CreateProfileSchema) -> dict:
        return payload.toDict()

    async def rename(self, payload: RenameProfileSchema) -> dict:
        return payload.toDict()
```

Ambos campos aplican las mismas restricciones: `"A"` falla tanto en `name` como en `new_name`. Declara `DisplayName: Alias = ...` a nivel de módulo, antes de los schemas; dentro de una clase `Schema` se interpretaría como un campo con un tipo no admitido. La sintaxis es una asignación anotada, no `Alias[...]`.

Envía `{"name": "Ada"}` a la ruta común. Para la segunda acción, añade al mismo archivo de rutas:

```python
Route.post("/validation/alias-rename", [AliasExampleController, "rename"])
```

Envía `{"new_name": "Lin"}` a `POST /validation/alias-rename`; el contenedor inyecta `RenameProfileSchema` en `rename()` y devuelve `{"new_name": "Lin"}`.

#### Static

Usa `Static` para atributos de clase que describen el schema o su contexto y que no deben formar parte del payload. Por ejemplo, el origen asignado por la aplicación puede compartirse entre todas las instancias.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.fields import Static


class EventSchema(Schema):
    source: Static[str] = "web"
    event: str


class AliasExampleController(BaseController):
    async def __call__(self, payload: EventSchema) -> dict:
        return {"source": payload.source, "payload": payload.toDict()}
```

`source` no es un campo requerido, no se incluye en `toDict()` y no se rellena desde el cuerpo de la petición. Es un atributo compartido de la clase; los datos de cada petición deben declararse como campos normales.

Envía `{"event": "signup"}`: la respuesta es `{"source": "web", "payload": {"event": "signup"}}`. Omitir `event` falla; no es necesario enviar `source`.

### Restricciones estructurales

Los diez metadatos de restricciones son `GreaterThan`, `GreaterThanOrEqual`, `LessThan`, `LessThanOrEqual`, `MultipleOf`, `Pattern`, `MinLength`, `MaxLength`, `TimezoneAware` y `TimezoneNaive`. Se importan desde `orionis.schemas.constraints` y se comprueban durante la conversión.

`Field[str, MinLength(2), MaxLength(80)]` y `Annotated[str, MinLength(2), MaxLength(80)]` son equivalentes. El primer argumento es siempre el tipo; los siguientes son instancias de restricciones, reglas o metadatos compatibles.

La compilación se aplica al `Field` exterior de cada campo del schema. No coloques restricciones de Orionis dentro de `list[Field[str, MinLength(2)]]`: esos metadatos internos no se compilan. Para validar cada elemento con esas restricciones, usa un schema hijo con campos declarados normalmente y valida su estructura, o valida los elementos explícitamente.

El compilador rechaza restricciones duplicadas o incompatibles, como dos `MinLength`, un mínimo mayor que el máximo, `MultipleOf(0)` o las dos condiciones de zona horaria en el mismo campo. Los tipos también deben admitir las restricciones aplicadas: una combinación incompatible puede impedir la conversión. Corrige esas combinaciones en el schema; no representan datos inválidos enviados por un cliente.

### Reglas

Las reglas son instancias de `Rule`, como `Email()`. Se ejecutan sobre los valores convertidos y pueden combinarse con restricciones en el mismo `Field`. Una regla de formato no reemplaza el tipo: declara `Field[str, Email()]` para exigir una cadena y comprobar su formato.

Consulta las firmas, los tipos admitidos y las particularidades de todas las reglas en la [referencia completa](/es/validation/constraints-and-reference). Para extenderlas, consulta [reglas personalizadas](/es/validation/application-rules).

### Metadatos descriptivos y mensajes

Estos objetos se importan desde `orionis.schemas.metadata`:

| Metadato | Propósito |
| --- | --- |
| `Title(value)` | Título del campo para su representación documental. |
| `Description(value)` | Descripción del campo. |
| `Examples(values)` | Lista de ejemplos serializables a JSON. |
| `ExtraJsonSchema(data)` | Propiedades adicionales de JSON Schema. |
| `Extra(data)` | Metadatos propios de la aplicación. |
| `Message(text)` | Mensaje personalizado para un error de tipo. |

Los cinco primeros no comprueban el valor ni lo transforman. `Message` personaliza errores, no constituye una condición adicional. Las restricciones y muchas reglas también admiten `message=` para su propio fallo; revisa cada firma en la referencia.

## Validación durante la petición

El parámetro `payload: UserSchema` activa el flujo HTTP: el contenedor obtiene `await request.data()`, espera `Validator.validate(data, UserSchema)` e invoca el método únicamente si la validación tiene éxito. No combina automáticamente el cuerpo con la query string o los parámetros de ruta.

La conversión es estricta: enviar `"36"` como edad produce un error de tipo, aunque la cadena contenga dígitos. El método del validador no admite `strict=False`. Los campos desconocidos se ignoran de forma predeterminada; puedes rechazarlos declarando la clase con `class UserSchema(Schema, forbid_unknown_fields=True):`.

Construir `UserSchema(name=..., email=..., age=...)` directamente utiliza el constructor de `msgspec.Struct`, que no ejecuta estas comprobaciones de tipos, restricciones y reglas. Reserva esa construcción para datos confiables; en una acción usa el parámetro inyectado para recibir entradas externas.

### Ejecución asíncrona

La resolución del schema espera la validación dentro del flujo asíncrono de la petición. El método público subyacente es `await Validator.validate(payload, schema)`; no existe una variante síncrona ni un método `validateAsync`.

Cada regla implementa `async def enforce(...)`; el ejecutor la espera en su orden de declaración mediante `Rule.validate()`. Esto incluye las comprobaciones locales, aunque no necesiten un `await` interno. Una sobrescritura síncrona de `enforce()` se rechaza al definir la subclase. No hay un método alternativo `enforceAsync()` ni una adaptación automática de reglas síncronas.

Las reglas se esperan secuencialmente y no se envían automáticamente a un hilo. Para I/O, utiliza una API asíncrona o adapta expresamente la operación bloqueante, como se explica en [reglas personalizadas](/es/validation/application-rules). El mismo pipeline se utiliza en los demás puntos de entrada que invocan el validador.

### Conversiones compatibles

En `app/http/controllers/typed_values_controller.py`:

```python
from datetime import date
from uuid import UUID

from orionis.http.base import BaseController
from orionis.schemas import Schema


class TypedValues(Schema):
    id: UUID
    joined_on: date
    scores: list[int]


class TypedValuesController(BaseController):
    async def __call__(self, payload: TypedValues) -> dict:
        return {
            "id": str(payload.id),
            "joined_on": payload.joined_on.isoformat(),
            "total_score": sum(payload.scores),
        }
```

Registra la acción en las rutas API:

```python
from app.http.controllers.typed_values_controller import TypedValuesController
from orionis.support.facades import Route

Route.post("/typed-values", TypedValuesController)
```

Envía `POST /typed-values` con este cuerpo JSON:

```json
{"id": "ddeb27fb-d9a0-4624-be4d-4615062daed4", "joined_on": "2026-01-15", "scores": [1, 2]}
```

La acción recibe `payload.id` como `UUID`, `payload.joined_on` como `date` y los elementos de `scores` como enteros; responde con el UUID y la fecha en texto y `total_score: 3`.

Estas conversiones pertenecen al tipo declarado; no son una conversión general de cualquier cadena a cualquier tipo.

## Schemas anidados y acceso a los datos

Puedes declarar un schema como campo de otro. El validador convierte el diccionario hijo y ejecuta sus reglas; los errores conservan la ruta del campo, como `contact.email`.

En `app/http/controllers/account_controller.py`:

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import Email
from orionis.schemas.fields import Field


class ContactSchema(Schema):
    email: Field[str, Email()]


class AccountSchema(Schema):
    contact: ContactSchema


class AccountController(BaseController):
    async def __call__(self, payload: AccountSchema) -> dict:
        return payload.toDict()
```

Registra la acción en las rutas API:

```python
from app.http.controllers.account_controller import AccountController
from orionis.support.facades import Route

Route.post("/accounts/preview", AccountController)
```

Envía `{"contact": {"email": "ada@example.com"}}` a `POST /accounts/preview`. La acción recibe `payload.contact` como `ContactSchema` y devuelve ese cuerpo como JSON. Un correo inválido produce un error en `contact.email` antes de ejecutar el método.

`toDict()` devuelve un diccionario y convierte recursivamente los schemas hijos, incluidos los contenidos en valores de diccionarios, listas y tuplas. Conserva esos contenedores y los demás valores: las fechas y los UUID siguen siendo objetos Python, no texto JSON. Es una conversión de datos; no ejecuta validaciones ni reglas.

### Reglas dentro de colecciones

La validación recorre los schemas contenidos en listas, diccionarios, tuplas y otras colecciones compatibles. Comprueba los tipos y restricciones de los hijos y espera sus reglas, también cuando otro campo o elemento falla la conversión. No necesitas validar cada hijo manualmente.

Para reutilizar `ContactSchema`, guarda este endpoint en `app/http/controllers/preview_contacts_controller.py`:

```python
from app.http.controllers.account_controller import ContactSchema
from orionis.http.base import BaseController
from orionis.schemas import Schema


class ContactListSchema(Schema):
    contacts: list[ContactSchema]


class PreviewContactsController(BaseController):
    async def __call__(self, payload: ContactListSchema) -> ContactListSchema:
        return payload
```

Registra la acción en las rutas API:

```python
from app.http.controllers.preview_contacts_controller import PreviewContactsController
from orionis.support.facades import Route

Route.post("/contacts/preview", PreviewContactsController)
```

Envía `{"contacts": [{"email": "ada@example.com"}]}` a `POST /contacts/preview` con `Content-Type: application/json`: el controlador recibe un `ContactSchema` en `payload.contacts[0]` y devuelve el schema como JSON. Con `{"contacts": [{"email": "invalid"}]}`, `Email()` rechaza el hijo antes de ejecutar la acción; el manejo API predeterminado responde `422` con un error en `contacts[0].email`.

Si declaras `contacts: dict[str, ContactSchema]`, una entrada como `{"contacts": {"primary": {"email": "invalid"}}}` informa `contacts['primary'].email`. Las anotaciones y uniones compatibles conservan ese recorrido recursivo. Consulta los [ejemplos completos de colecciones y errores parciales](/es/validation/validation-and-errors#schemas-en-colecciones).

## Otros puntos de entrada

Los controladores son uno de los puntos de entrada. Las herramientas MCP y los adaptadores Realtime disponen de integración automática propia para validar sus datos tipados; sus declaraciones y su origen de datos se explican en [integraciones de schemas](/es/validation/integrations). No necesitan simular una petición HTTP ni seguir la lectura de `Request.data()`.

En servicios, jobs o un manejador WebSocket simple que no utilice una integración automática, valida explícitamente los datos ya decodificados desde el método asíncrono que los procesa:

```python
from app.http.schemas.userschema import UserSchema
from orionis.schemas.validator import Schema as Validator


async def validate_imported_user(data: dict) -> UserSchema:
    return await Validator.validate(data, UserSchema)
```

`Validator` es un alias de la utilidad `Schema` de `orionis.schemas.validator`. El método devuelve la instancia validada o lanza `ValidationException`; recibe datos ya leídos, como un diccionario, y no texto JSON para decodificar. Este uso no presupone una petición activa ni inyecta automáticamente su cuerpo. Cuando el adaptador ya valida e inyecta el schema —como el parámetro HTTP mostrado en esta guía—, no repitas la validación dentro de su método.

## Organización y siguientes pasos

Mantén los schemas centrados en los datos de una operación. Puedes separar entrada y salida, reutilizar schemas hijos y organizar archivos por dominio mediante los subdirectorios del generador. Estas son decisiones de organización del proyecto.

Continúa con [ejecución y errores](/es/validation/validation-and-errors), [schemas en controladores HTTP](/es/validation/controllers-and-http) o [MCP, Realtime y otros puntos de entrada](/es/validation/integrations). La [referencia](/es/validation/constraints-and-reference) documenta las restricciones y reglas disponibles; las [reglas personalizadas](/es/validation/application-rules) permiten ampliar sus comprobaciones.
