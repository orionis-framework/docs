---
title: "Schemas y validación"
description: "Utiliza un Schema para describir y validar los datos que llegan a una ruta HTTP, un método Realtime o una herramienta MCP. Declara tipos Python, adjunta límites estructurales…"
editUrl: true
lastUpdated: false
---

## Descripción general

Utiliza un `Schema` para describir y validar los datos que llegan a una ruta HTTP, un método Realtime o una herramienta MCP. Declara tipos Python, adjunta límites estructurales como una longitud mínima y añade reglas de aplicación como email o confirmación de contraseña. Una validación correcta devuelve una instancia cuyos campos puedes utilizar; una entrada inválida produce errores agrupados por campo.

Los schemas utilizan `msgspec.Struct` internamente. `Field` es un alias de `typing.Annotated`; Orionis compila sus restricciones y planes de reglas al declarar la clase.

Declaración y validación están separadas. La construcción directa confía en valores ya tipados bajo la semántica del constructor `msgspec`. `orionis.schemas.validator.Schema.validate()` y `validateAsync()` convierten payloads no confiables y lanzan `ValidationException` con fallos por campo.

## Requisitos

- Python 3.14 o posterior; la compilación usa evaluación diferida de anotaciones.
- Imports explícitos desde `fields`, `constraints`, `metadata`, `rules`, `validator` y `exceptions`; la raíz solo exporta `Schema`.
- Conexión database iniciada para `Unique` y contexto de red/archivo para reglas que lo necesiten.

## Recorrido del módulo

1. [Declarar schemas y convertir datos](/es/validation/declaring-schemas).
2. [Manejar errores de validación](/es/validation/validation-and-errors).
3. [Añadir reglas de aplicación](/es/validation/application-rules).
4. [Consultar restricciones y metadatos](/es/validation/constraints-and-reference).

Continúa con [HTTP](/es/http), [base de datos](/es/database) o [MCP](/es/protocols/mcp).
