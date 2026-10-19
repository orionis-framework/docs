---
title: "Reglas de aplicación y validación con I/O"
description: "Crea reglas personalizadas con Rule y ejecuta comprobaciones locales o con I/O dentro del pipeline asíncrono de validación."
editUrl: true
lastUpdated: false
---

Una regla de aplicación comprueba una condición sobre un valor ya convertido al tipo declarado. Se añade a la metadata de un campo mediante `Field[T, ...]`, junto a sus restricciones estructurales. Para las comprobaciones incluidas en Orionis, consulta la [referencia completa de reglas y restricciones](/es/validation/constraints-and-reference).

En una acción HTTP, declara el schema como parámetro: el contenedor valida el cuerpo de la petición y espera las reglas antes de inyectar la instancia. La acción sólo se ejecuta si esa validación termina correctamente. El mismo pipeline combina restricciones estructurales, reglas locales y reglas con I/O asíncrono. Los schemas no dependen de los controladores: puedes reutilizar sus reglas en [MCP, Realtime y otros puntos de entrada](/es/validation/integrations).

## Contrato de una regla personalizada

Importa `Rule` desde `orionis.schemas.rule` y crea una subclase. El ejecutor reconoce instancias de `Rule`; implementar únicamente el contrato `IRule` no basta para incorporarlas a un schema.

| Componente | Responsabilidad |
| --- | --- |
| `async def enforce(field, value, instance) -> bool` | Único método de comprobación, tanto para condiciones locales como para I/O: devuelve `True` si el valor es válido o `False` si debe producir un error. |
| `field: str` | Ruta del campo, por ejemplo `address.code`, `contacts[0].email` o `contacts['primary'].email`. |
| `value: object` | Contiene el valor convertido del campo actual. |
| `instance: object` | Permite consultar otros campos disponibles del mismo objeto. |
| `__code__` | Identificador del fallo. Si se omite, se usa el nombre de la clase en minúsculas. |
| `__message__` | Mensaje predeterminado para un valor inválido. Define un texto útil para quien recibe el error. |
| `Rule(message=...)` | Sustituye el mensaje predeterminado para esa declaración. El argumento se pasa por nombre. |

No necesitas sobrescribir `async validate()`: la implementación heredada ejecuta `await self.enforce(field, value, instance)`. Cuando la comprobación devuelve `False`, construye un `ValidationFailure` con el campo, el código y el mensaje; si es válida, devuelve `None`.

`enforce()` debe declararse con `async def` incluso si su cálculo no contiene `await`. Una sobrescritura síncrona con `def enforce(...)` provoca un `TypeError` al definir la clase. No existe un método alternativo `enforceAsync()` ni una adaptación automática de reglas síncronas; también puedes heredar una implementación asíncrona de otra regla.

Una regla informa un valor inválido con `False`. Una excepción lanzada desde su lógica se propaga y no se convierte automáticamente en un fallo de validación.

## Ejemplo completo: cantidades pares

Esta regla se combina con una restricción numérica. El tipo y el límite se comprueban durante la conversión; después se espera la condición de paridad. Su `async def enforce()` no necesita un `await` interno porque sólo calcula una condición local.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import GreaterThanOrEqual
from orionis.schemas.fields import Field
from orionis.schemas.rule import Rule


class Even(Rule):
    __slots__ = ()

    __code__ = "even"
    __message__ = "Quantity must be even."

    async def enforce(
        self,
        field: str,
        value: object,
        instance: object,
    ) -> bool:
        return isinstance(value, int) and value % 2 == 0


class Batch(Schema):
    quantity: Field[int, GreaterThanOrEqual(1), Even()]


class PreviewBatchController(BaseController):
    async def __call__(self, payload: Batch) -> Batch:
        return payload
```

Para seguir el ejemplo, guarda las clases anteriores en `app/http/controllers/preview_batch_controller.py`. Se muestran juntas para facilitar la lectura; puedes separar la regla y el schema en sus propios módulos. Registra el controlador en el archivo de rutas API configurado:

```python
from app.http.controllers.preview_batch_controller import PreviewBatchController
from orionis.support.facades import Route

Route.post("/batches/preview", PreviewBatchController)
```

Envía un `POST /batches/preview` con `Content-Type: application/json`:

- `{"quantity": 4}`: el controlador recibe `payload.quantity == 4` y devuelve el schema como JSON con estado `200`.
- `{"quantity": 3}`: `Even` devuelve `False`; el controlador no se ejecuta y el manejo API predeterminado responde con estado `422` y el siguiente cuerpo:

```json
{
  "message": "Quantity must be even.",
  "errors": {
    "quantity": ["Quantity must be even."]
  }
}
```

No necesitas recibir `Request` ni invocar manualmente al validador: la anotación `payload: Batch` activa la inyección y la validación del cuerpo. La respuesta anterior corresponde a rutas API; consulta las [diferencias de manejo API y WEB](/es/validation/controllers-and-http#errores-de-validación-http).

`__slots__ = ()` evita añadir un diccionario de atributos a esta subclase sin configuración propia; no modifica la condición de validación. Si la regla recibe configuración en su constructor, declara sus atributos y llama a `super().__init__(message=message)` para conservar el código y el mensaje.

Puedes cambiar el texto en otro schema con `Even(message="Use an even quantity.")`. `Field` es un alias de `typing.Annotated`: las reglas son metadata, no argumentos de una función que construya el campo.

## Reglas con I/O asíncrono

Implementa el mismo `async def enforce()` y utiliza `await` sobre la API asíncrona real. Este ejemplo consulta el resolver mediante `getaddrinfo()` del loop; la entrada válida usa `localhost` y la inválida se rechaza antes de consultar DNS.

```python
import asyncio
import socket

from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.fields import Field
from orionis.schemas.rule import Rule


class ResolvableHost(Rule):
    __slots__ = ()

    __code__ = "resolvable_host"
    __message__ = "Host must resolve through DNS."

    async def enforce(
        self,
        field: str,
        value: object,
        instance: object,
    ) -> bool:
        if not isinstance(value, str) or not value:
            return False
        try:
            await asyncio.get_running_loop().getaddrinfo(
                value,
                None,
                family=socket.AF_UNSPEC,
                type=socket.SOCK_STREAM,
            )
        except (OSError, UnicodeError):
            return False
        return True


class Server(Schema):
    host: Field[str, ResolvableHost()]


class CheckServerController(BaseController):
    async def __call__(self, payload: Server) -> Server:
        return payload
```

En `app/http/controllers/check_server_controller.py`, el controlador recibe `Server` de la misma manera que `Batch`. Registra su endpoint API:

```python
from app.http.controllers.check_server_controller import CheckServerController
from orionis.support.facades import Route

Route.post("/servers/check", CheckServerController)
```

Con `Content-Type: application/json`, `POST /servers/check` acepta `{"host": "localhost"}` si el resolver local lo resuelve; devuelve `{"host": "localhost"}` con estado `200`. Con `{"host": ""}`, la regla rechaza el valor antes de consultar DNS y la acción no se ejecuta. La respuesta API predeterminada tiene estado `422`:

```json
{
  "message": "Host must resolve through DNS.",
  "errors": {
    "host": [
      "Host must resolve through DNS."
    ]
  }
}
```

`ResolvableHost` utiliza el mismo contrato que `Even`: `Rule.validate()` espera su `enforce()`. Orionis ya incluye `ActiveUrl` para comprobar el hostname de una URL; este ejemplo muestra cómo aplicar el contrato a un campo que contiene únicamente un hostname.

Declarar `async def` no convierte una operación bloqueante en asíncrona. **El pipeline espera la regla en el loop actual, sin trasladar automáticamente su método a un hilo**. Utiliza APIs asíncronas para I/O; si necesitas una API síncrona bloqueante, debes adaptar expresamente esa operación. Las condiciones locales breves, como la paridad, se calculan directamente.

Los campos y las reglas se procesan en orden. Cada comprobación asíncrona se espera antes de comenzar la siguiente; el validador no lanza todas las consultas en paralelo.

Una excepción inesperada de la regla interrumpe ese recorrido y se propaga. La cancelación de una validación suspendida también se propaga; no se transforma en un fallo por campo. Captura únicamente los fallos que tu regla considere datos inválidos, como los errores del resolver capturados en el ejemplo.

### Reglas nativas con servicios externos

`ActiveUrl` comprueba que el hostname de una URL resuelva mediante DNS; no solicita el recurso HTTP ni comprueba su contenido. Dentro del pipeline utiliza el resolver del loop.

`Unique` consulta la base de datos mediante la conexión del loop actual y conserva su transacción. Necesita una conexión configurada y acceso a la tabla indicada. La comprobación no sustituye una restricción de unicidad en la base de datos frente a escrituras concurrentes.

Las reglas que leen el contenido de archivos, como `Image`, `Dimensions` y la comprobación de archivos de `Encoding`, esperan un helper que ejecuta el `read()` síncrono del archivo en un hilo. Es una adaptación específica de esa lectura; no implica que todas las reglas se ejecuten en hilos.

Consulta sus firmas, parámetros y ejemplos en la [referencia nativa](/es/validation/constraints-and-reference).

## Consultar otros campos

Después de una conversión completa, `instance` es el schema al que pertenece el campo. Si otro valor falla la conversión, el recolector todavía ejecuta las reglas de los campos válidos: en ese recorrido entrega un objeto con los campos convertidos correctamente, que puede no incluir campos ausentes, inválidos o sus valores predeterminados.

Para una regla entre campos, utiliza una lectura defensiva como `getattr(instance, "other_field", None)` y decide expresamente cómo tratar un valor no disponible. No dependas de que `instance` siempre tenga una clase concreta ni de que una regla anterior haya transformado otro campo.

Las reglas de un campo se ejecutan en el orden declarado y pueden aportar varios errores. El ejecutor no se detiene en el primer `False`. Una regla también recibe `None` si ese es un valor permitido por el tipo; decide si debe aceptarlo.

## Reutilizar y organizar reglas

Orionis no exige una carpeta para las reglas personalizadas. Puedes organizarlas por responsabilidad, por ejemplo en `app/validation/rules/`, e importar la clase desde los schemas que la necesitan. Crear una regla es independiente de [generar un schema](/es/validation/declaring-schemas).

Las instancias declaradas como metadata y sus planes se reutilizan. Guarda sólo configuración estable en una regla; no almacenes la petición, el valor actual ni resultados de una validación anterior en atributos compartidos. Usa las variables locales de cada invocación para esos datos.

El ejecutor espera las reglas de schemas hijos directos y de los elementos anidados en listas, diccionarios, tuplas, conjuntos y conjuntos inmutables compatibles con la conversión. También atraviesa anotaciones y uniones compatibles: un valor `None` permitido se omite como hijo. En los diccionarios recorre los valores; en conjuntos, los índices reflejan el orden de iteración y no una posición estable. Consulta los [ejemplos de colecciones y errores](/es/validation/validation-and-errors#schemas-en-colecciones).

Las comprobaciones entre campos de cada hijo reciben los campos de ese hijo, no los del padre ni los de otro elemento de la colección. Si un elemento falla la conversión, el recolector conserva ese fallo y continúa esperando las reglas de los campos y elementos que pudo convertir.

La [integración con controladores y HTTP](/es/validation/controllers-and-http) explica cómo se espera este mismo pipeline al declarar un schema como argumento de una acción.

## Usar reglas fuera de HTTP

Los schemas y las reglas también sirven para datos recibidos mediante MCP, Realtime, tareas o servicios. La [guía de integraciones](/es/validation/integrations) distingue la inyección disponible en cada contexto y la validación explícita. Para esta última, importa `Schema as Validator` desde `orionis.schemas.validator` y usa `await Validator.validate(datos, Batch)` dentro de un método asíncrono. En una acción con `payload: Batch`, el contenedor ya realiza ese trabajo; no lo repitas. La [guía de errores](/es/validation/validation-and-errors) muestra cuándo capturar `ValidationException`.
