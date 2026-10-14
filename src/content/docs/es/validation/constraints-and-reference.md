---
title: "Constraints, metadatos y referencia"
description: "from orionis.schemas import Schema es el único export raíz. APIs avanzadas son explícitas:"
editUrl: true
lastUpdated: false
---

## API pública

`from orionis.schemas import Schema` es el único export raíz. APIs avanzadas son explícitas:

- `orionis.schemas.fields`: `Field`, `Choice`, `Nullable`, `AnyOf`, `Constant`, `Alias`, `Static`.
- `orionis.schemas.constraints`: constraints estructurales y reglas incluidas.
- `orionis.schemas.metadata`: `Title`, `Description`, `Examples`, `ExtraJsonSchema`, `Extra`, `Message`.
- `orionis.schemas.validator.Schema`: `validate`/`validateAsync`; use alias `Validator`.
- `orionis.schemas.rule.Rule`: base de reglas personalizadas.
- `ValidationException`: `failures`, `failure`, `errors`, `message` y `error()`.


## Elegir restricciones estructurales

| Requisito de entrada | Declaración del campo |
|---|---|
| Texto no vacío de hasta 80 caracteres | `Field[str, MinLength(1), MaxLength(80)]` |
| Entero positivo | `Field[int, GreaterThan(0)]` |
| Entero de al menos 18 | `Field[int, GreaterThanOrEqual(18)]` |
| Al menos un elemento | `Field[list[str], MinLength(1)]` |
| Fecha/hora con zona horaria | `Field[datetime, TimezoneAware()]` |

Importa `Field` desde `orionis.schemas.fields`, las restricciones desde `orionis.schemas.constraints` y `datetime` desde el módulo estándar `datetime`. Declara valores predeterminados con asignación normal, como `note: str | None = None`. Las restricciones describen estructura; las [reglas de aplicación](/es/validation/application-rules) comprueban condiciones de negocio.

[Volver al índice del módulo](/es/validation).
