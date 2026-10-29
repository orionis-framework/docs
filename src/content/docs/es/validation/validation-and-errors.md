---
title: "Validación, errores e integración"
description: "Captura ValidationException, consulta errores por campo, personaliza mensajes y comprende cómo se recopilan fallos de conversión y reglas."
editUrl: true
lastUpdated: false
---

Cuando una acción declara un parámetro como `payload: Order`, el contenedor valida el cuerpo de la petición e inyecta una instancia tipada. Si encuentra fallos de tipos, restricciones o reglas, lanza `ValidationException` antes de ejecutar la acción. El manejo HTTP predeterminado transforma esa excepción en una respuesta para el cliente.

No necesitas capturar esa excepción dentro de la acción ni llamar manualmente al validador para activar la inyección. Consulta la [declaración de schemas](/es/validation/declaring-schemas) y la [integración con controladores](/es/validation/controllers-and-http) para comenzar. El mismo validador se reutiliza en [MCP, Realtime y otros puntos de entrada](/es/validation/integrations); la respuesta HTTP `422` mostrada aquí pertenece al manejo API, no a todos esos transportes.

## Ejemplo: varios errores en una operación

Este schema combina un límite numérico, dos reglas sobre un mismo campo y un schema hijo directo. Guarda el ejemplo en `app/http/controllers/preview_order_controller.py`; las clases se muestran juntas para facilitar la lectura, aunque puedes separar los schemas en sus propios módulos.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import (
    Email,
    GreaterThanOrEqual,
    Lowercase,
    StartsWith,
)
from orionis.schemas.fields import Field
from orionis.schemas.metadata import Message


class Contact(Schema):
    email: Field[str, Email(message="Enter a valid email address.")]


class Order(Schema):
    quantity: Field[
        int,
        Message("Quantity must be an integer."),
        GreaterThanOrEqual(1, message="Quantity must be positive."),
    ]
    reference: Field[
        str,
        Lowercase(message="Use lowercase characters."),
        StartsWith("ord-", message="Reference must start with ord-."),
    ]
    contact: Contact


class PreviewOrderController(BaseController):
    async def __call__(self, payload: Order) -> Order:
        return payload
```

Registra el controlador en el archivo de rutas API configurado:

```python
from app.http.controllers.preview_order_controller import PreviewOrderController
from orionis.support.facades import Route

Route.post("/orders/preview", PreviewOrderController)
```

Envía un `POST /orders/preview` con `Content-Type: application/json` y este cuerpo válido:

```json
{
  "quantity": 2,
  "reference": "ord-42",
  "contact": {
    "email": "ada@example.com"
  }
}
```

La acción recibe `payload` como `Order`, puede acceder a `payload.contact.email` y devuelve los mismos campos como JSON con estado `200`. Si envías este otro cuerpo:

```json
{
  "quantity": 0,
  "reference": "ABC",
  "contact": {
    "email": "invalid"
  }
}
```

El controlador no se ejecuta. El manejo API predeterminado responde con estado `422` y el contenido de `ValidationException.error()`:

```json
{
  "message": "Quantity must be positive. (and 3 more errors)",
  "errors": {
    "quantity": [
      {"rule": "ge", "message": "Quantity must be positive."}
    ],
    "reference": [
      {"rule": "lowercase", "message": "Use lowercase characters."},
      {"rule": "starts_with", "message": "Reference must start with ord-."}
    ],
    "contact.email": [
      {"rule": "email", "message": "Enter a valid email address."}
    ]
  }
}
```

El recolector conserva el error de `quantity` y también ejecuta las reglas de los valores que sí se convirtieron. Por eso `reference` contiene dos fallos y el hijo directo aporta `contact.email`. El identificador `rule` permite distinguir la condición incumplida sin interpretar el mensaje.

## Consultar una excepción

La inyección automática deja el tratamiento HTTP al framework. La siguiente API sirve para inspeccionar una `ValidationException` cuando implementas validación explícita o manejo personalizado de errores:

| API | Contenido |
| --- | --- |
| `error.failures` | Tupla de los fallos recopilados. Cada fallo expone `field`, `rule` y `message`. |
| `error.failure` | Primer fallo; es `None` si la excepción se construyó sin fallos. |
| `error.errors` | Diccionario de nombres de campo a listas de objetos con `rule` y `message`. Conserva todos los fallos recopilados de cada campo. |
| `error.message` | Resumen: primer mensaje y, si hay más fallos, su cantidad restante. |
| `error.error()` | Diccionario serializable con las claves `message` y `errors`. |
| `failure.toDict()` | Diccionario con `field`, `rule` y `message` para ese fallo individual. |

En el ejemplo, el primer fallo se representa así:

```json
{
  "field": "quantity",
  "rule": "ge",
  "message": "Quantity must be positive."
}
```

El resumen utiliza el texto del primer error y un sufijo en inglés para los adicionales: `(and 1 more error)` o `(and N more errors)`. Cuenta fallos, no campos. Para presentar los errores por campo, consume `errors[field]` y lee `item["message"]`; `item["rule"]` identifica la condición. No necesitas analizar el texto del resumen.

Las reglas publican su `__code__`, como `email` o `starts_with`; si una regla propia lo omite, utiliza el nombre de su clase en minúsculas. Las restricciones usan códigos como `ge`, `multiple_of`, `min_length` y `pattern`. Los tipos incompatibles usan `type` y los campos obligatorios ausentes, `missing`. `failure.toDict()` añade `field` al mismo par de código y mensaje.

Las rutas de campos incluyen puntos para objetos anidados, como `contact.email`, índices de colecciones, como `contacts[0].email`, y claves reales de diccionario, como `contacts['primary'].email`. Esta notación se usa tanto en fallos de conversión como en reglas. Las claves de diccionario se representan mediante `repr()` y pueden usar comillas simples o dobles; los índices de conjuntos describen su orden de iteración, no una posición estable. Un error sobre el payload completo puede utilizar una clave vacía.

## Cómo se recopilan los fallos

1. El validador intenta convertir todo el payload y aplicar las restricciones estructurales mediante `msgspec`.
2. Si esa conversión funciona, espera las reglas de los campos convertidos y recorre los schemas hijos, también dentro de colecciones. Cada regla utiliza `async def enforce()` y se espera mediante `Rule.validate()`.
3. Si la conversión falla, inspecciona los campos declarados para recopilar los errores de conversión y los obligatorios ausentes. Sobre cada valor compatible con su tipo comprueba todas las restricciones y espera todas sus reglas, aunque alguna restricción falle. Desciende también a los hijos de las colecciones para conservar sus fallos.
4. Agrupa los fallos encontrados en una sola `ValidationException`.

Las reglas de un campo siguen el orden de su declaración y un resultado `False` no cancela las siguientes. En un recorrido anidado, los hijos se validan antes de las reglas del campo que los contiene. Las comprobaciones se esperan secuencialmente, sin lanzar todos los campos en paralelo. Un tipo incompatible o un campo ausente impide ejecutar las condiciones que requieren su valor convertido, pero eso no impide comprobar los campos válidos de ese hijo ni otros elementos.

### Varias restricciones del mismo campo

Este ejemplo independiente combina dos restricciones nativas y una regla Python en un mismo campo. Guárdalo como `validation_example.py` en la raíz del proyecto y ejecútalo con `python validation_example.py`:

```python
import asyncio

from orionis.schemas import Schema
from orionis.schemas.constraints import Lowercase, MinLength, Pattern
from orionis.schemas.exceptions import ValidationException
from orionis.schemas.fields import Field
from orionis.schemas.validator import Schema as Validator


class Reference(Schema):
    value: Field[
        str,
        MinLength(6, message="Use at least 6 characters."),
        Pattern(r"^ord-", message="Start with ord-."),
        Lowercase(message="Use lowercase characters."),
    ]


async def main() -> None:
    try:
        await Validator.validate({"value": "ABC"}, Reference)
    except ValidationException as error:
        assert {item["rule"] for item in error.errors["value"]} == {
            "min_length", "pattern", "lowercase",
        }
        print(error.error())


asyncio.run(main())
```

`"ABC"` tiene el tipo correcto, pero incumple las dos restricciones y la regla: `errors["value"]` contiene tres objetos. Si envías `42`, se informa el error `type`; no se aplican las condiciones de cadena a ese entero.

El caso válido conserva la conversión nativa de `msgspec` y los planes preparados al declarar la clase. El recorrido detallado se utiliza al fallar esa conversión; no se repite para cada petición válida. Las reglas Python y sus esperas de I/O siguen teniendo su propio coste.

El validador no recibe opciones `bail`, `max_errors` ni una política para detenerse en el primer error: su método `async validate()` acepta únicamente `payload` y `schema`.

## Schemas en colecciones

Las reglas de los schemas hijos también se ejecutan dentro de listas y diccionarios, además de tuplas, conjuntos y conjuntos inmutables compatibles con la conversión. Las anotaciones y uniones compatibles conservan ese recorrido: este endpoint acepta tanto una lista de contactos como un diccionario por nombre.

Guarda el siguiente ejemplo en `app/http/controllers/preview_contacts_controller.py`:

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import Email, MinLength
from orionis.schemas.fields import Field
from orionis.schemas.metadata import Message


class ImportContact(Schema):
    email: Field[
        str,
        Message("Email must be a string."),
        Email(message="Enter a valid email address."),
    ]
    nickname: Field[
        str,
        MinLength(3, message="Nickname must have at least 3 characters."),
    ] = "guest"


class ContactBatch(Schema):
    contacts: list[ImportContact] | dict[str, ImportContact]
    count: Field[int, Message("Count must be an integer.")] = 1


class PreviewContactsController(BaseController):
    async def __call__(self, payload: ContactBatch) -> ContactBatch:
        return payload
```

Registra la acción en el archivo de rutas API configurado:

```python
from app.http.controllers.preview_contacts_controller import PreviewContactsController
from orionis.support.facades import Route

Route.post("/contacts/preview", PreviewContactsController)
```

Con `Content-Type: application/json`, `POST /contacts/preview` acepta `{"contacts": [{"email": "ada@example.com"}]}`. El controlador recibe un `ImportContact` en `payload.contacts[0]`; el valor predeterminado de `nickname` es `"guest"`. También acepta `{"contacts": {"primary": {"email": "ada@example.com"}}}`, cuyo hijo está en `payload.contacts["primary"]`.

Este cuerpo contiene un tipo incorrecto, una regla fallida, una restricción fallida y un error en otro campo del padre:

```json
{
  "contacts": [
    {"email": 42},
    {"email": "invalid"},
    {"email": "ada@example.com", "nickname": "x"}
  ],
  "count": "bad"
}
```

La acción no se ejecuta. El manejo API predeterminado devuelve estado `422` con estos errores:

```json
{
  "message": "Email must be a string. (and 3 more errors)",
  "errors": {
    "contacts[0].email": [
      {"rule": "type", "message": "Email must be a string."}
    ],
    "contacts[1].email": [
      {"rule": "email", "message": "Enter a valid email address."}
    ],
    "contacts[2].nickname": [
      {"rule": "min_length", "message": "Nickname must have at least 3 characters."}
    ],
    "count": [
      {"rule": "type", "message": "Count must be an integer."}
    ]
  }
}
```

El fallo del primer hijo no oculta los errores de los demás, y el error de `count` tampoco evita las comprobaciones de contactos. Si envías `{"contacts": {"primary": {"email": "invalid"}}}`, el mismo endpoint informa `"contacts['primary'].email"` con el mensaje `"Enter a valid email address."`.

En colecciones anidadas se conserva cada selector, por ejemplo `contacts[0]['main'][1].email`. Cuando una colección incumple su propia restricción, como `MinLength`, puede conservarse un fallo sobre `contacts` junto a los fallos de sus hijos. En una unión de schemas diferenciados mediante etiquetas, el recolector utiliza el miembro seleccionado por la etiqueta y sus mensajes, no los del primer miembro declarado.

Las reglas que comparan campos de un hijo reciben ese hijo como contexto. En una conversión parcial, el contexto sólo contiene los campos que se convirtieron: utiliza lecturas defensivas como se explica en [reglas personalizadas](/es/validation/application-rules#consultar-otros-campos).

## Personalizar los mensajes

- Usa `Message("...")`, importado desde `orionis.schemas.metadata`, para un error de tipo del campo.
- Usa `message="..."` en la restricción o regla concreta para personalizar su fallo.
- En una regla propia, define `__message__` como mensaje predeterminado y `__code__` como identificador.

En `Order`, una cantidad con tipo incompatible utiliza `"Quantity must be an integer."`; el entero `0` utiliza `"Quantity must be positive."`. `Message` no sustituye todos los mensajes del campo ni el error de un campo obligatorio ausente.

Los fallos conservan el código y el mensaje de la restricción declarada. Por ejemplo, `GreaterThan(0, message="Quantity must be positive.")` informa `rule: "gt"`, aunque el diagnóstico interno de `msgspec` exprese el límite entero como `>= 1`. No necesitas sustituirla por `GreaterThanOrEqual` para personalizar el mensaje.

## Usar el resultado y tratar errores de aplicación

Trabaja con la instancia devuelta sólo después de validar. Construir directamente un schema no ejecuta este pipeline; llamar directamente a `msgspec.convert()` tampoco ejecuta las reglas de aplicación de Orionis ni produce su excepción agrupada.

`ValidationException` representa datos rechazados por la validación. Una excepción de programación o de un servicio llamado por una regla se propaga sin convertirse automáticamente en un error por campo. Corrige las declaraciones de metadata incompatibles en el código: esos errores pueden ocurrir al definir la clase.

La inyección espera el pipeline asíncrono dentro del procesamiento de la petición. Todas las reglas implementan `async def enforce()` y se esperan en orden; una condición local puede no necesitar `await` dentro de su cálculo. Una operación bloqueante todavía bloquea el loop si no la adaptas; consulta las [reglas con I/O asíncrono](/es/validation/application-rules#reglas-con-io-asíncrono).

Una excepción inesperada dentro de una regla interrumpe la validación y se propaga; no se incorpora a `errors` ni permite continuar como si el dato fuera válido. La cancelación mientras se espera una regla también se propaga como cancelación, incluso dentro de una colección o durante la recopilación de errores parciales.

## Validación explícita como alternativa

Si necesitas preparar el cuerpo antes de validarlo o recibir datos por otro adaptador, puedes invocar el validador dentro de un método asíncrono. Este controlador alternativo conserva `Request` para decidir cómo leer la entrada y manejar los fallos. No sustituye al ejemplo con inyección cuando sólo necesitas validar el cuerpo:

```python
from app.http.controllers.preview_order_controller import Order
from orionis.http import JSONResponse, Request, response
from orionis.http.base import BaseController
from orionis.schemas.exceptions import ValidationException
from orionis.schemas.validator import Schema as Validator


class ImportOrderController(BaseController):
    async def __call__(self, request: Request) -> JSONResponse:
        data = await request.data()
        try:
            order = await Validator.validate(data, Order)
        except ValidationException as error:
            return response.json(error.error(), status_code=422)
        return response.json({"reference": order.reference})
```

`Validator` es la clase de ejecución importada desde `orionis.schemas.validator`; `Schema`, de `orionis.schemas`, declara los campos. Debes usar `await Validator.validate(...)`: sin `await`, sólo obtienes una corrutina. Un servicio, tarea o adaptador de otro medio de entrada puede usar la misma llamada y decidir si captura o propaga `ValidationException`. Consulta los casos de [MCP, Realtime y validación explícita](/es/validation/integrations) antes de asumir que todos los puntos de entrada generan respuestas HTTP o utilizan el mismo origen de datos.

En la acción automática con `payload: Order`, la validación ocurre antes de entrar al método. Por eso un `try/except` colocado dentro de esa acción no captura un error de inyección; utiliza el manejo HTTP predeterminado o un mecanismo de excepciones de la aplicación.

## Integración HTTP

La [guía de integración con controladores y HTTP](/es/validation/controllers-and-http) explica la inyección automática de schemas, la selección de los datos de entrada y las respuestas HTTP de error, incluidas las diferencias entre API y WEB. El diccionario anterior es la salida de `ValidationException.error()`; la presentación HTTP depende de esa integración.

Al registrar o devolver errores, utiliza los campos y mensajes necesarios para el cliente; no incluyas contraseñas ni el payload completo.
