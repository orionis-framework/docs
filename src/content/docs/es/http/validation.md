---
title: "Validación HTTP con schemas"
description: "Introducción a la validación asíncrona de payloads y a los schemas como respuestas de controladores; continúa con la guía completa de Validación."
editUrl: true
lastUpdated: false
---

Los schemas describen los campos, tipos y reglas que acepta un payload. Una acción de controlador puede recibir directamente un schema validado, en lugar de leer y validar el cuerpo manualmente mediante `Request`.

Esta página presenta el flujo HTTP. La [guía de Validación](/es/validation) desarrolla su funcionamiento, el generador CLI, todas las reglas nativas, las reglas personalizadas y el manejo de errores.

Los mismos contratos también sirven en tools MCP, métodos remotos Realtime y otros puntos de entrada. Su [guía de integraciones](/es/validation/integrations) explica cómo se reciben los datos en cada contexto; la inyección del cuerpo que se muestra aquí es específica de HTTP.

## Recibir datos validados

Anota el parámetro con una clase concreta de `Schema`, sin valor predeterminado:

Orionis construye e inyecta ese objeto al resolver la petición. Dentro de la acción puedes utilizar sus campos directamente; no necesitas crear el schema, leer el cuerpo ni ejecutar manualmente el validador para ese parámetro.

```python
from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas.constraints import MinLength
from orionis.schemas.fields import Field


class ProfileInput(Schema):
    name: Field[str, MinLength(2)]


class ProfileOutput(Schema):
    name: str


class ProfileController(BaseController):
    async def __call__(self, payload: ProfileInput) -> ProfileOutput:
        return ProfileOutput(name=payload.name)
```

Al atender la ruta, el contenedor obtiene `await request.data()` y ejecuta `await Validator.validate(datos, ProfileInput)`, donde `Validator` es el alias de `Schema` de `orionis.schemas.validator`. Sólo después de validar entrega `payload` a la acción.

Un cuerpo JSON como `{"name": "Ada"}` permite devolver `{"name": "Ada"}`. Si el nombre no cumple `MinLength(2)`, la acción no se ejecuta. La [guía de integración con controladores](/es/validation/controllers-and-http) muestra los archivos, el registro de rutas y las respuestas completas.

La inyección valida el **cuerpo**: no mezcla automáticamente query string, parámetros de ruta ni cabeceras. Puedes recibir también `Request` cuando necesitas esos datos o controlar la lectura. La conversión es estricta; un texto numérico no se convierte automáticamente a `int`.

## Devolver un schema

El ejemplo devuelve una instancia de `ProfileOutput`; el framework valida sus tipos, restricciones y reglas antes de serializarla como JSON con estado `200`. Esta comprobación depende de la instancia devuelta, incluso sin anotación de retorno. `-> ProfileOutput` por sí solo no convierte un diccionario en un schema. Las respuestas que no son una instancia directa de `Schema` no pasan por esta validación.

Con el manejo predeterminado, los errores de **entrada** producen JSON `422` en rutas API, con listas de objetos `{rule, message}` por campo. En WEB, producen JSON `422` para solicitudes que esperan JSON o son AJAX, y una redirección `302` con errores de sesión para la navegación habitual. Una salida Schema inválida produce un error de servidor `500`. Consulta los [detalles de entrada, salida y errores HTTP](/es/validation/controllers-and-http).

## Guía completa de Validación

- [Funcionamiento y arquitectura](/es/validation): schemas, restricciones, reglas y ejecución asíncrona.
- [Declaración y generador CLI](/es/validation/declaring-schemas): `make:http-schema`, campos, valores predeterminados y metadatos.
- [Integraciones y puntos de entrada](/es/validation/integrations): HTTP, MCP, Realtime, WebSockets y servicios.
- [Todas las restricciones y reglas nativas](/es/validation/constraints-and-reference): firmas y ejemplos de código para cada una.
- [Reglas personalizadas](/es/validation/application-rules): contrato y comprobaciones propias, incluidas operaciones con I/O asíncrono.
- [Errores de validación](/es/validation/validation-and-errors): mensajes y fallos por campo.
- [Controladores y respuestas](/es/validation/controllers-and-http): ejemplo completo de inyección, validación de salida y errores API/WEB.

Para las APIs HTTP complementarias, consulta [controladores](/es/http/controllers), [Request y payloads](/es/http/requests) y [respuestas](/es/http/responses).

En servicios o handlers WebSocket simples, utiliza validación explícita con los datos ya leídos. MCP y Realtime incorporan sus propios mecanismos de validación e inyección; consulta los [ejemplos de cada integración](/es/validation/integrations).
