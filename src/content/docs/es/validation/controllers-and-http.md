---
title: "Validación en controladores y respuestas"
description: "Guía completa de inyección de schemas en controladores HTTP, validación asíncrona de entrada y salida y errores API y WEB."
editUrl: true
lastUpdated: false
---

Un parámetro de controlador anotado con una clase concreta de `Schema` permite recibir el cuerpo de la petición ya validado. El contenedor obtiene los datos, ejecuta el validador asíncrono y entrega la instancia a la acción. Si falla, la acción no se ejecuta.

Este capítulo desarrolla la integración HTTP; también se aplica a funciones de ruta resueltas por el contenedor. Los schemas se reutilizan en [MCP, Realtime y otros puntos de entrada](/es/validation/integrations), con sus propias fuentes de datos y respuestas de error.

Para comenzar con la declaración de campos, consulta [schemas y validación](/es/validation) y [declarar schemas y generarlos mediante el CLI](/es/validation/declaring-schemas). La [referencia de las 47 restricciones y reglas nativas](/es/validation/constraints-and-reference), las [reglas personalizadas](/es/validation/application-rules) y la [API de errores](/es/validation/validation-and-errors) completan esta guía.

## Un controlador con schemas de entrada y salida

Este endpoint devuelve una vista previa de los datos recibidos; no guarda usuarios. Crea los siguientes archivos en tu aplicación y registra la ruta en el archivo API configurado en `bootstrap/app.py`, normalmente `routes/api.py`. La petición debe superar los middleware y la política de acceso de esa ruta.

### Schema de entrada

En `app/http/schemas/create_user_schema.py`:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import Email, GreaterThanOrEqual, MinLength
from orionis.schemas.fields import Field


class CreateUserSchema(Schema):
    name: Field[str, MinLength(2, message="Name must have at least 2 characters.")]
    email: Field[str, Email(message="Email is invalid.")]
    age: Field[int, GreaterThanOrEqual(18, message="Age must be at least 18.")]
```

Los tres campos son obligatorios. `name` exige al menos dos caracteres, `email` aplica la regla de formato `Email` y `age` debe ser un entero mayor o igual que 18. Importa la clase declarativa desde `orionis.schemas`; `Field` permite asociar restricciones y reglas al tipo.

### Schema de salida

En `app/http/schemas/user_preview_schema.py`:

```python
from orionis.schemas import Schema


class UserPreviewSchema(Schema):
    name: str
    email: str
    age: int
```

Esta clase describe los campos de la vista previa. Utilizar un schema de salida separado permite elegir explícitamente qué datos se devuelven.

### Acción del controlador

En `app/http/controllers/preview_user_controller.py`:

```python
from app.http.schemas.create_user_schema import CreateUserSchema
from app.http.schemas.user_preview_schema import UserPreviewSchema
from orionis.http.base import BaseController


class PreviewUserController(BaseController):
    async def __call__(self, payload: CreateUserSchema) -> UserPreviewSchema:
        return UserPreviewSchema(
            name=payload.name,
            email=payload.email,
            age=payload.age,
        )
```

`payload` llega como una instancia validada de `CreateUserSchema`. La acción devuelve realmente un objeto `UserPreviewSchema`; la anotación de retorno describe esa intención, pero por sí sola no ejecuta validación.

### Registrar y probar la ruta

En el archivo de rutas API:

```python
from app.http.controllers.preview_user_controller import PreviewUserController
from orionis.support.facades import Route

Route.post("/users/preview", PreviewUserController)
```

Envía una petición `POST` a `/users/preview` con `Content-Type: application/json` y este cuerpo:

```json
{"name": "Ada", "email": "ada@example.com", "age": 36}
```

La respuesta es JSON con estado `200`:

```json
{"name": "Ada", "email": "ada@example.com", "age": 36}
```

## Cómo se valida el parámetro

1. El contenedor reconoce la anotación de la clase de schema en la acción.
2. Resuelve el `Request` activo y lee `await request.data()`.
3. Ejecuta `await Validator.validate(data, CreateUserSchema)`: convierte los tipos compatibles, comprueba las restricciones y ejecuta las reglas.
4. Si el resultado es válido, inyecta la instancia en `payload` y ejecuta la acción.
5. Si hay errores, lanza `ValidationException` y el manejo HTTP predeterminado construye la respuesta correspondiente.

No necesitas volver a leer el cuerpo ni llamar manualmente al validador en esta acción. Las reglas y sus limitaciones de anidamiento son las mismas que en la [validación explícita](/es/validation/declaring-schemas).

Declara el parámetro con una clase concreta y sin valor predeterminado, como `payload: CreateUserSchema`. Un valor predeterminado tiene prioridad sobre la resolución automática. Usa también un nombre distinto de los parámetros de ruta: un argumento proporcionado por la ruta prevalece sobre la inyección del schema.

### De dónde proceden los datos

La inyección utiliza exclusivamente el diccionario devuelto por `Request.data()`. No combina automáticamente parámetros de ruta, query string, cookies ni cabeceras con el cuerpo.

| Cuerpo de la petición | Entrada disponible para el schema |
| --- | --- |
| `application/json` | Objeto JSON superior convertido en diccionario. |
| `application/msgpack` | Mapping superior decodificado. |
| `application/x-www-form-urlencoded` | Campos de formulario; las claves repetidas pueden producir listas. |
| `multipart/form-data` | Campos de texto y objetos de archivo subidos. |

Estos son los tipos de contenido reconocidos por `data()`; no reconoce automáticamente cualquier subtipo terminado en `+json`. Un array JSON superior no es el diccionario que exige este flujo.

La conversión conserva el comportamiento estricto del validador. En el ejemplo, `"age": "36"` falla porque es una cadena. Los campos de texto de un formulario también llegan como cadenas: declarar `age: int` no los convierte automáticamente a enteros. Adapta la entrada deliberadamente mediante [validación explícita](/es/validation/declaring-schemas) cuando tu formato lo requiera.

## Schema o Request

| Parámetro | Cuándo utilizarlo |
| --- | --- |
| `payload: CreateUserSchema` | Para trabajar con campos del cuerpo tipados y validados antes de ejecutar la acción. |
| `request: Request` | Para consultar cabeceras, query string, cookies, metadatos o controlar la lectura del cuerpo. Recibirlo no valida automáticamente esos datos. |
| Ambos parámetros | Cuando necesitas el cuerpo validado y otros datos de la petición. Importa `Request` desde `orionis.http`. |

Los parámetros de ruta siguen llegando por su nombre a la acción; son independientes del schema del cuerpo. Consulta [controladores](/es/http/controllers) y [Request y payloads](/es/http/requests) para sus mecanismos de acceso.

## Errores de validación HTTP

El validador recopila fallos de conversión y de reglas en una `ValidationException`. El comportamiento predeterminado depende del contexto de rutas:

| Contexto | Resultado predeterminado |
| --- | --- |
| API | El kernel devuelve JSON con estado `422`, incluso sin `Accept: application/json`. |
| WEB que espera JSON o es AJAX | El manejo de validación WEB devuelve JSON con estado `422`. |
| WEB con navegación habitual | Devuelve una redirección `302` y guarda errores e input anterior filtrado en datos flash de sesión. |

En WEB, la negociación se basa en `wantsJson()` o `isAjax()`: por ejemplo, `Accept: application/json` o `X-Requested-With: XMLHttpRequest`. Enviar solamente `Content-Type: application/json` no equivale a solicitar una respuesta JSON.

Para el cuerpo inválido `{"name": "x", "email": "bad", "age": 17}`, el endpoint API anterior responde:

```json
{
  "message": "Name must have at least 2 characters. (and 2 more errors)",
  "errors": {
    "name": [
      {"rule": "min_length", "message": "Name must have at least 2 characters."}
    ],
    "age": [
      {"rule": "ge", "message": "Age must be at least 18."}
    ],
    "email": [
      {"rule": "email", "message": "Email is invalid."}
    ]
  }
}
```

`message` resume el primer fallo y cuenta los restantes; `errors` agrupa objetos `{rule, message}` por campo. Un campo puede aportar varios fallos de restricciones y reglas. La [API de errores](/es/validation/validation-and-errors) explica cómo inspeccionarlos y personalizarlos.

En una redirección WEB, se usa primero la URL anterior de sesión, después un `Referer` permitido del mismo origen y, como alternativa, la URL actual. El input conservado excluye campos sensibles de primer nivel como `password` y `password_confirmation`. Consulta [sesiones y datos flash](/es/sessions/state-and-flash).

Estas respuestas corresponden a fallos del schema con el manejo predeterminado. Los errores de lectura del cuerpo, de formato o de middleware pueden producir otras respuestas antes de validar.

## Devolver schemas y validar la salida

Cuando la acción devuelve directamente una instancia de `Schema`, el framework valida sus tipos, restricciones y reglas antes de envolverla en una `JSONResponse` con estado `200`. También comprueba los schemas hijos y los elementos de sus colecciones. No necesitas llamar a `toDict()` ni validar manualmente esa salida.

Distingue estos comportamientos:

- La comprobación se activa por el valor real: una instancia de `Schema` se valida incluso sin anotación de retorno.
- Anotar `-> UserPreviewSchema` no convierte un diccionario devuelto en esa clase ni valida ese diccionario.
- Construir una instancia directamente no ejecuta la validación; el framework la realiza al procesarla como salida HTTP.
- Una instancia modificada después de validar la entrada también se vuelve a comprobar al devolverla.
- Las respuestas ordinarias (`dict` o una `Response` ya construida) no ejecutan este validador. Tampoco se busca recursivamente un Schema dentro de cualquier contenedor devuelto.

Las reglas de salida pertenecen al schema devuelto. Este ejemplo independiente permite observar la validación automática:

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import GreaterThanOrEqual
from orionis.schemas.fields import Field
from orionis.support.facades import Route


class StockOutput(Schema):
    quantity: Field[int, GreaterThanOrEqual(0)]


class StockController(BaseController):
    async def __call__(self) -> StockOutput:
        return StockOutput(quantity=5)


Route.get("/stock", StockController)
```

Coloca el bloque en tu archivo de rutas API o separa las clases e impórtalas antes del registro. `GET /stock` devuelve `{"quantity": 5}`. Si cambias el retorno a `StockOutput(quantity=-1)`, el constructor crea la instancia, pero la validación de salida rechaza su cantidad. Una cadena como `StockOutput(quantity="bad")` también se rechaza por tipo.

Una salida inválida es un fallo de la aplicación: con el manejo predeterminado produce **HTTP `500`**, no el `422` de un cuerpo de entrada inválido ni una redirección de formulario. La respuesta al cliente sigue el manejo de errores de servidor y su configuración de depuración; no uses sus detalles como contrato público de errores de entrada.

Si devuelves el schema que recibiste como parámetro, sus reglas se ejecutan tanto para la entrada como para la salida. Tenlo en cuenta si una regla consulta servicios externos. Diseña esas comprobaciones sin efectos secundarios y declara un schema de salida adecuado a los datos que publicas.

Para controlar el estado o las cabeceras, puedes devolver una respuesta explícita, por ejemplo `response.json(schema, status_code=202)`, importando `response` desde `orionis.http`. El resultado ya es una respuesta, por lo que no activa esta comprobación de Schema directo. Si necesitas validar su contenido, ejecuta `await Validator.validate(datos, TuSchema)` antes de construirla. Consulta [respuestas HTTP](/es/http/responses) para configurar la respuesta.

## Validación manual como alternativa

La inyección del schema es el recorrido principal de las acciones HTTP anteriores: Orionis lee y valida el cuerpo antes de llamar al método. La validación explícita resulta útil cuando otro punto de entrada obtiene los datos, o cuando necesitas preparar una entrada antes de validarla.

### Validación explícita con Request

Cuando necesitas controlar cómo obtienes o preparas la entrada, puedes conservar `Request` y validar explícitamente. Esta alternativa para el mismo controlador realiza la lectura que el contenedor hace automáticamente en el ejemplo anterior:

```python
from app.http.schemas.create_user_schema import CreateUserSchema
from app.http.schemas.user_preview_schema import UserPreviewSchema
from orionis.http import Request
from orionis.http.base import BaseController
from orionis.schemas.validator import Schema as Validator


class PreviewUserController(BaseController):
    async def __call__(self, request: Request) -> UserPreviewSchema:
        payload = await Validator.validate(await request.data(), CreateUserSchema)
        return UserPreviewSchema(
            name=payload.name,
            email=payload.email,
            age=payload.age,
        )
```

En ambos casos se espera `Validator.validate(...)`. La inyección del schema elimina esa lectura y validación manuales de la acción; recibir solamente `Request` no las ejecuta por sí mismo. También puedes declarar ambos parámetros, como `payload: CreateUserSchema, request: Request`, para acceder a cabeceras sin repetir la validación del cuerpo.

### Servicios y otros medios de entrada

En un servicio o proceso que recibe registros ya decodificados, proporciona los datos explícitamente; una anotación no identifica por sí sola su origen. Esta alternativa no requiere un `Request` HTTP activo. MCP y Realtime tienen mecanismos propios de inyección que se explican en la [guía de integraciones](/es/validation/integrations).

```python
from app.http.schemas.create_user_schema import CreateUserSchema
from orionis.schemas.validator import Schema as Validator


class UserImportService:
    async def validate_record(self, record: dict) -> CreateUserSchema:
        return await Validator.validate(record, CreateUserSchema)
```

El llamador de este servicio debe esperar `await service.validate_record(record)` desde su propio contexto asíncrono. Las reglas y las excepciones son las mismas; la selección y la decodificación de los datos dependen de ese punto de entrada.

La [introducción HTTP a la validación](/es/http/validation) resume este flujo. Para ampliar las condiciones del payload, continúa con el [catálogo de reglas y sus ejemplos](/es/validation/constraints-and-reference) y las [reglas personalizadas](/es/validation/application-rules).
