---
title: "Schemas y validación"
description: "Define contratos de datos con schemas y reglas asíncronas para HTTP, MCP, Realtime y otros puntos de entrada del framework."
editUrl: true
lastUpdated: false
---

El sistema de validación describe qué datos acepta la aplicación mediante clases `Schema`. Cada campo declara un tipo Python y puede añadir restricciones y reglas de negocio. La validación convierte una entrada compatible en una instancia tipada o lanza `ValidationException` con errores estructurados por campo.

Los schemas son contratos de datos reutilizables: no pertenecen exclusivamente a los controladores ni dependen de `Request`. Orionis integra su validación en acciones HTTP, tools MCP y métodos remotos Realtime. También puedes validar explícitamente mensajes WebSocket, registros importados o datos de servicios y tareas. Cada punto de entrada determina de dónde obtiene los datos y cómo presenta los errores.

En una acción HTTP, declara un parámetro con el tipo de tu schema. El contenedor lee el cuerpo de la petición, espera la validación asíncrona e inyecta la instancia validada antes de ejecutar el método. Así puedes recibir los datos tipados directamente en lugar de leerlos y validarlos desde `Request`. Si también necesitas cabeceras, cookies o query string, puedes recibir ambos parámetros.

## Primer schema en un controlador

En `app/http/schemas/userschema.py`, declara el cuerpo aceptado:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import Email, GreaterThanOrEqual, MinLength
from orionis.schemas.fields import Field


class UserSchema(Schema):
    name: Field[str, MinLength(2)]
    email: Field[str, Email()]
    age: Field[int, GreaterThanOrEqual(18)]
    newsletter: bool = False
```

En `app/http/controllers/preview_user_controller.py`, recibe el schema por su anotación de tipo:

```python
from app.http.schemas.userschema import UserSchema
from orionis.http.base import BaseController


class PreviewUserController(BaseController):
    async def __call__(self, payload: UserSchema) -> UserSchema:
        return payload
```

Registra la acción en el archivo de rutas API configurado, normalmente `routes/api.py`:

```python
from app.http.controllers.preview_user_controller import PreviewUserController
from orionis.support.facades import Route

Route.post("/users/preview", PreviewUserController)
```

Envía un `POST /users/preview` con `Content-Type: application/json` y este cuerpo:

```json
{"name": "Ada", "email": "ada@example.com", "age": 36}
```

El contenedor inyecta `payload` como `UserSchema`; `newsletter` vale `False` al omitirse. La acción devuelve el schema y Orionis lo serializa como JSON con estado `200`. Este ejemplo devuelve una vista previa; no guarda un usuario. Un correo inválido o una edad menor que 18 impiden ejecutar la acción y producen la respuesta de validación de la ruta.

No necesitas llamar al validador en esta acción. La anotación del parámetro activa la validación de entrada; devolver una instancia de `Schema` activa la validación de salida antes de serializarla. Se comprueban sus tipos, restricciones y reglas, incluidos los schemas hijos. La anotación de retorno por sí sola no convierte un diccionario en un schema. Consulta [schemas de entrada y salida en controladores](/es/validation/controllers-and-http) para el comportamiento completo.

## Cómo funciona

Durante la inyección, el contenedor utiliza el único punto de entrada asíncrono del validador: `await Validator.validate(data, UserSchema)`. `Validator` es un alias de la utilidad `Schema` de `orionis.schemas.validator`, distinto de la clase base declarativa importada desde `orionis.schemas`. La conversión de tipos se realiza directamente; las comprobaciones que requieren I/O pueden esperar sus operaciones sin bloquear la petición. Que el validador sea asíncrono no significa que todas sus operaciones se ejecuten en paralelo.

El proceso combina dos capas de validación:

1. **Tipos y restricciones estructurales.** `msgspec` convierte los datos a la estructura declarada y comprueba tipos, campos obligatorios y restricciones como `MinLength`.
2. **Reglas.** Orionis espera la validación de cada instancia de `Rule`, como `Email()`, sobre los valores convertidos. Todas implementan `async def enforce(...)`, tanto las comprobaciones sencillas como las que esperan I/O. Las reglas pueden inspeccionar otros campos y utilizar servicios externos. Un `enforce` síncrono se rechaza al definir la clase.

| Componente | Responsabilidad |
| --- | --- |
| `Schema` | Declara campos sobre `msgspec.Struct` y expone `toDict()`. |
| `SchemaMeta` | Procesa las anotaciones al crear la clase y prepara sus metadatos y planes de reglas. No necesitas utilizarla directamente. |
| `Annotated` / `Field` | Adjunta restricciones, reglas y metadatos a un tipo sin cambiar el tipo del campo. `Field` es un alias de `typing.Annotated`. |
| Compilador de metadatos | Transforma restricciones y metadatos documentales en `msgspec.Meta`; detecta declaraciones incompatibles. |
| Ejecutor de reglas | Recorre schemas hijos y colecciones; espera las reglas de cada campo en orden de declaración y acumula sus fallos. |
| `ValidationException` | Reúne los fallos y expone listas de objetos `{rule, message}` agrupadas por campo. |

Los tipos, las restricciones y los metadatos documentales tienen funciones distintas. Por ejemplo, `str` exige una cadena, `MinLength(2)` limita su longitud, `Email()` comprueba su formato y `Description("...")` describe el campo sin validar su contenido.

### Conversión y errores

La conversión conserva el comportamiento estricto de `msgspec`: `"36"` no es un `int` válido para `age`. Determinados tipos sí admiten representaciones de texto, como fechas ISO y UUID, según el tipo declarado.

Orionis acumula los errores de cada campo: restricciones incumplidas y reglas que devuelven `False`. Si falla la conversión inicial, inspecciona los campos para completar el diagnóstico. Un tipo incompatible o un campo ausente impide evaluar las condiciones que requieren su valor convertido; los demás campos y elementos siguen validándose.

Cada elemento de `errors` incluye `rule` y `message`. Las reglas propias publican su `__code__`; las restricciones utilizan códigos como `ge`, `min_length` o `pattern`. El resumen cuenta fallos individuales, aunque varios pertenezcan al mismo campo:

```json
{
  "message": "Quantity must be positive. (and 1 more error)",
  "errors": {
    "quantity": [
      {"rule": "ge", "message": "Quantity must be positive."},
      {"rule": "multiple_of", "message": "Quantity must be a multiple of 2."}
    ]
  }
}
```

La ruta rápida conserva la conversión y las restricciones de `msgspec`, implementadas en código nativo. Los metadatos y planes se preparan al declarar la clase; la recopilación detallada se reserva para los datos inválidos. Las reglas Python y su I/O tienen su propio coste. La validación de salida HTTP sólo se activa al devolver directamente una instancia de `Schema`; las otras respuestas no recorren el validador.

Las reglas de los schemas hijos también se ejecutan cuando están dentro de listas, tuplas, conjuntos o valores de diccionarios, incluso si otro campo falla la conversión. Los errores conservan su ubicación, como `contacts[0].email` o `contacts['primary'].email`. Consulta los [ejemplos de colecciones y errores parciales](/es/validation/validation-and-errors#schemas-en-colecciones).

Consulta el formato de `errors`, `failures` y los mensajes en [Validación y errores](/es/validation/validation-and-errors).

## Recorrido de la guía

1. [Declarar schemas y convertir datos](/es/validation/declaring-schemas): campos obligatorios, valores predeterminados, tipos, metadatos y el generador `make:http-schema`.
2. [Schemas en HTTP, MCP y Realtime](/es/validation/integrations): inyección automática, origen de los datos y validación explícita en otros contextos.
3. [Referencia completa de restricciones y reglas nativas](/es/validation/constraints-and-reference): firmas, parámetros, valores admitidos y ejemplos de las 47 declaraciones públicas.
4. [Reglas de aplicación y reglas personalizadas](/es/validation/application-rules): contrato asíncrono, I/O y reutilización.
5. [Validación y errores](/es/validation/validation-and-errors): ejecución asíncrona, colecciones, fallos y mensajes.
6. [Schemas en controladores HTTP](/es/validation/controllers-and-http): entrada automática, errores HTTP y schemas como respuestas. La [introducción de HTTP](/es/http/validation) resume esta integración.

Las reglas de archivos, red o base de datos necesitan el contexto o los servicios indicados en su referencia. Un schema por sí solo no configura esos servicios.

## Elegir el punto de entrada

En HTTP, el parámetro recibe el cuerpo de la petición. En MCP, `Tool[InputSchema, OutputSchema]` declara el contrato de los argumentos y de la salida estructurada; utiliza una clase Orionis `Schema` como raíz para ejecutar sus reglas. En Realtime, los parámetros de un método `@remote` se validan a partir de los argumentos de la invocación.

En servicios y handlers WebSocket simples, proporciona explícitamente los datos decodificados a `await Validator.validate(data, UserSchema)`. Una anotación por sí sola no identifica mensajes de una cola ni argumentos de consola. La [guía de integraciones](/es/validation/integrations) muestra ejemplos completos y explica las diferencias de errores y respuestas entre estos contextos.
