---
title: "Schemas and validation"
description: "Define data contracts with schemas and asynchronous rules for HTTP, MCP, Realtime, and other framework entry points."
editUrl: true
lastUpdated: false
---

The validation system describes the data your application accepts through `Schema` classes. Every field declares a Python type and can add constraints and business rules. Validation converts compatible input into a typed instance or raises `ValidationException` with structured errors by field.

Schemas are reusable data contracts: they are not exclusive to controllers and do not depend on `Request`. Orionis integrates validation into HTTP actions, MCP tools, and Realtime remote methods. You can also explicitly validate WebSocket messages, imported records, or service and task data. Each entry point determines its data source and how errors are presented.

In an HTTP action, declare a parameter with your schema's type. The container reads the request body, awaits asynchronous validation and injects the validated instance before invoking the method. Receive typed data directly instead of reading and validating it through `Request`. If you also need headers, cookies or the query string, you can receive both parameters.

## First schema in a controller

In `app/http/schemas/userschema.py`, declare the accepted body:

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

In `app/http/controllers/preview_user_controller.py`, receive the schema through its type annotation:

```python
from app.http.schemas.userschema import UserSchema
from orionis.http.base import BaseController


class PreviewUserController(BaseController):
    async def __call__(self, payload: UserSchema) -> UserSchema:
        return payload
```

Register the action in your configured API routes file, usually `routes/api.py`:

```python
from app.http.controllers.preview_user_controller import PreviewUserController
from orionis.support.facades import Route

Route.post("/users/preview", PreviewUserController)
```

Send a `POST /users/preview` with `Content-Type: application/json` and this body:

```json
{"name": "Ada", "email": "ada@example.com", "age": 36}
```

The container injects `payload` as a `UserSchema`; omitted `newsletter` defaults to `False`. The action returns the schema and Orionis serializes it as JSON with status `200`. This example returns a preview; it does not save a user. An invalid email or an age under 18 prevents the action from running and produces the route's validation response.

You do not need to call the validator in this action. The parameter annotation triggers schema resolution; returning a schema instance allows serialization, but a return annotation alone does not validate or convert output. See [input and output schemas in controllers](/en/validation/controllers-and-http) for the complete behavior.

## How it works

During injection, the container uses the validator's single asynchronous entry point: `await Validator.validate(data, UserSchema)`. `Validator` aliases the `Schema` utility in `orionis.schemas.validator`, separate from the declaration base imported from `orionis.schemas`. Type conversion runs directly; checks that require I/O can await their operations without blocking the request. An asynchronous validator does not mean all operations run in parallel.

The process combines two validation layers:

1. **Types and structural constraints.** `msgspec` converts data into the declared structure and checks types, required fields and constraints such as `MinLength`.
2. **Rules.** Orionis awaits validation by each `Rule` instance, such as `Email()`, on converted values. All implement `async def enforce(...)`, including simple checks and checks awaiting I/O. Rules can inspect other fields and use external services. A synchronous `enforce` is rejected when its class is defined.

| Component | Responsibility |
| --- | --- |
| `Schema` | Declares fields on top of `msgspec.Struct` and exposes `toDict()`. |
| `SchemaMeta` | Processes annotations when the class is created and prepares its metadata and rule plans. You do not need to use it directly. |
| `Annotated` / `Field` | Attaches constraints, rules and metadata to a type without changing the field type. `Field` aliases `typing.Annotated`. |
| Metadata compiler | Transforms constraints and documentation metadata into `msgspec.Meta`; detects incompatible declarations. |
| Rule executor | Traverses child schemas and collections, awaits each field's rules in declaration order, and collects their failures. |
| `ValidationException` | Collects failures and exposes messages grouped by field. |

Types, constraints and documentation metadata have different purposes. For example, `str` requires a string, `MinLength(2)` limits its length, `Email()` checks its format, and `Description("...")` describes the field without validating its contents.

### Conversion and errors

Conversion preserves `msgspec`'s strict behavior: `"36"` is not a valid `int` for `age`. Certain types accept string representations, such as ISO dates and UUIDs, according to the declared type.

Orionis can report several errors in one operation. If initial conversion fails, it inspects the fields again to collect structural errors and run rules on values that converted successfully. If conversion succeeds, it collects rule failures instead of stopping at the first one. This does not mean that every constraint violated by the same value is reported simultaneously.

Child schemas' rules also run inside lists, tuples, sets, and dictionary values, even when another field fails conversion. Errors retain their location, such as `contacts[0].email` or `contacts['primary'].email`. See the [collection and partial error examples](/en/validation/validation-and-errors#schemas-in-collections).

See the format of `errors`, `failures` and messages in [Validation and errors](/en/validation/validation-and-errors).

## Guide learning path

1. [Declaring schemas and converting data](/en/validation/declaring-schemas): required fields, defaults, types, metadata and the `make:http-schema` generator.
2. [Schemas across HTTP, MCP, and Realtime](/en/validation/integrations): automatic injection, data sources, and explicit validation in other contexts.
3. [Complete native constraints and rules reference](/en/validation/constraints-and-reference): signatures, parameters, accepted values, and examples for all 47 public declarations.
4. [Application rules and custom rules](/en/validation/application-rules): the asynchronous contract, I/O, and reuse.
5. [Validation and errors](/en/validation/validation-and-errors): asynchronous execution, collections, failures, and messages.
6. [Schemas in HTTP controllers](/en/validation/controllers-and-http): automatic input validation, HTTP errors and schemas as responses. The [HTTP introduction](/en/http/validation) summarizes this integration.

File, network and database rules need the context or services described in their reference. A schema does not configure those services itself.

## Choosing an entry point

In HTTP, the parameter receives the request body. In MCP, `Tool[InputSchema, OutputSchema]` declares the arguments and structured output contract; use an Orionis `Schema` class as the root to run its rules. In Realtime, `@remote` method parameters are validated from invocation arguments.

In services and plain WebSocket handlers, explicitly supply decoded data to `await Validator.validate(data, UserSchema)`. An annotation alone does not identify queue messages or console arguments. The [integration guide](/en/validation/integrations) provides complete examples and explains differences in errors and responses across these contexts.
