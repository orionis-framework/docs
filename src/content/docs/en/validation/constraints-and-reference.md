---
title: "Constraints, metadata, and reference"
description: "from orionis.schemas import Schema is the only root export. Advanced APIs are intentionally explicit:"
editUrl: true
lastUpdated: false
---

## Public API

`from orionis.schemas import Schema` is the only root export. Advanced APIs are intentionally explicit:

- `orionis.schemas.fields`: `Field`, `Choice`, `Nullable`, `AnyOf`, `Constant`, `Alias`, `Static`.
- `orionis.schemas.constraints`: structural constraints plus all bundled rule classes.
- `orionis.schemas.metadata`: `Title`, `Description`, `Examples`, `ExtraJsonSchema`, `Extra`, `Message`.
- `orionis.schemas.validator.Schema`: static `validate(payload, schema)` and `validateAsync(payload, schema)` utility; alias it as `Validator` to avoid confusing it with the declaration base.
- `orionis.schemas.rule.Rule`: base for custom rules.
- `orionis.schemas.exceptions.ValidationException`: `failures`, first `failure`, grouped `errors`, summary `message`, and serializable `error()`.


## Choose structural constraints

| Input requirement | Field declaration |
|---|---|
| Nonempty text up to 80 characters | `Field[str, MinLength(1), MaxLength(80)]` |
| Positive integer | `Field[int, GreaterThan(0)]` |
| Integer at least 18 | `Field[int, GreaterThanOrEqual(18)]` |
| At least one item | `Field[list[str], MinLength(1)]` |
| Timezone-aware datetime | `Field[datetime, TimezoneAware()]` |

Import `Field` from `orionis.schemas.fields`, the constraints from `orionis.schemas.constraints` and `datetime` from the standard-library `datetime` module. Declare defaults with normal assignment, such as `note: str | None = None`. Constraints describe structure; [application rules](/en/validation/application-rules) handle business checks.

[Return to the module index](/en/validation).
