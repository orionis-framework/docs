---
title: "Declaring schemas and converting data"
description: "Generate schemas with the CLI, define fields and aliases, and reuse asynchronous validation in HTTP, MCP, Realtime, and other entry points."
editUrl: true
lastUpdated: false
---

A schema is a class that inherits from `orionis.schemas.Schema`. Its annotations describe accepted data; constraints and rules attach to each field. Asynchronous validation converts that data and awaits its rules before returning a typed instance.

In an [HTTP controller](/en/validation/controllers-and-http) action, declare a parameter with that type: the container validates the body and injects the instance before invoking the method. Schemas also integrate with MCP tools and Realtime through their adapters, and can be validated explicitly from services or tasks. The [integration guide](/en/validation/integrations) explains each context's input and resolution; not every context receives an HTTP body.

## Generate a schema with the CLI

From the project root, use either alternative:

```bash
orionis make:http-schema UserSchema
```

```bash
python -B reactor make:http-schema UserSchema
```

The syntax is `make:http-schema name`. `name` is a required positional `str` argument with no default. This generator adds no command-specific flags. To inspect its help:

```bash
orionis make:http-schema --help
python -B reactor make:http-schema --help
```

The default destination is `app/http/schemas`, corresponding to the configured `app_http_schemas` path. This is an HTTP generator convention rather than a usage restriction: the generated class can be imported by an MCP tool, Realtime, or a service. The command appends the `Schema` suffix when the name does not already end with it, using a case-insensitive comparison.

Filename and class normalization differ: the filename is lowercased and keeps underscores; the class joins underscore-separated words and capitalizes their initials. An underscore is not inserted between the words in a CamelCase name.

| `name` argument | Generated file | Class |
| --- | --- | --- |
| `UserSchema` | `app/http/schemas/userschema.py` | `UserSchema` |
| `User` | `app/http/schemas/user_schema.py` | `UserSchema` |
| `user_schema` | `app/http/schemas/user_schema.py` | `UserSchema` |
| `Admin/CreateUserSchema` | `app/http/schemas/admin/createuserschema.py` | `CreateUserSchema` |

Subdirectories using `/` or `\` are accepted; directory names are lowercased and necessary directories are created automatically. Each component must start with a letter and contain only ASCII letters, digits or underscores. Absolute paths, empty segments, `.`, `..` and hyphenated names are rejected.

If the final component includes an extension, such as `user_schema.py`, the generator removes it before normalizing the name and creates a `.py` file.

If the file already exists, the command reports an error and preserves its contents. There is no overwrite option.

### Generated structure

For `UserSchema`, the content generated from `http_schema.stub` is:

```python
from orionis.schemas import Schema

class UserSchema(Schema):
    """
    Declare the fields and validation rules for an HTTP payload.

    Add typed fields and schema metadata to describe the accepted request data.
    """
```

The import exposes the public declaration base. The generated class contains only the docstring: it adds no fields, rules or methods. Add the declarations your payload needs.

## Declare fields

This example replaces the contents of `app/http/schemas/userschema.py`:

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

- `name` is a required string of 2 to 80 characters. Its documentation metadata describes the field.
- `email` is required; it combines the `str` type, an `Email()` format rule and a length constraint.
- `age` is a required integer between 18 and 120, inclusive. `Message` customizes the type error; bounds retain their own messages.
- `nickname` can be omitted or supplied as `None`.
- `newsletter` can be omitted and then defaults to `False`. If supplied, it must be a boolean.

Required fields precede fields with defaults, following the declaration order used by `msgspec.Struct`.

:::note[Module annotations]
In modules that declare schemas, use Python's native annotations and avoid `from __future__ import annotations`. `SchemaMeta` uses Python's deferred annotation mechanism to compile constraints; turning annotations into strings through that import prevents this compilation.
:::

### Receive the schema in an action

Save this action in `app/http/controllers/preview_user_controller.py`:

```python
from app.http.schemas.userschema import UserSchema
from orionis.http.base import BaseController


class PreviewUserController(BaseController):
    async def __call__(self, payload: UserSchema) -> dict:
        return payload.toDict()
```

Register the route in your configured API file, usually `routes/api.py`:

```python
from app.http.controllers.preview_user_controller import PreviewUserController
from orionis.support.facades import Route

Route.post("/users/preview", PreviewUserController)
```

Send a `POST /users/preview` with `Content-Type: application/json` and:

```json
{"name": "Ada", "email": "ada@example.com", "age": 36}
```

The container provides `payload` as a validated `UserSchema` instance. The action accesses its attributes and returns JSON; `nickname` is `null` and `newsletter` is `false`. It does not need to receive `Request`, read the body or call the validator. If you need other request data, you can [receive `Request` and the schema together](/en/validation/controllers-and-http#schema-or-request).

### Required, nullable and defaulted fields

Allowing `None` and allowing a field to be omitted are different decisions:

```python
from orionis.schemas import Schema


class PresenceSchema(Schema):
    required_nullable: str | None
    optional_nullable: str | None = None
    optional_name: str = "Guest"
```

`required_nullable` must be present, although its value can be `None`. `optional_nullable` allows both omission and `None`. `optional_name` allows omission, but not `None`. Declare default values that match the field's type and constraints.

## Types, constraints, rules and metadata

### Types and aliases

Types determine the data structure: `str`, `int`, `float`, `bool`, `list[int]`, `dict[str, str]`, `date`, `datetime`, `UUID` or a child schema, among the types supported by `msgspec`.

`orionis.schemas.fields` exposes these `typing` aliases; they are not additional rules:

| Alias | Equivalent | Purpose |
| --- | --- | --- |
| [`Field`](#field) | `Annotated` | Attach constraints, rules and metadata to a type. |
| [`Choice`](#choice) | `Literal` | Declare allowed literal values. |
| [`Nullable`](#nullable) | `Optional` | Allow `None`; does not add a default. |
| [`AnyOf`](#anyof) | `Union` | Declare compatible alternative types. |
| [`Constant`](#constant) | `Final` | Express intent to typing tools; not a validation rule. |
| [`Alias`](#alias) | `TypeAlias` | Declare type aliases. |
| [`Static`](#static) | `ClassVar` | Declare a class attribute rather than a payload field. |

The following examples show schemas injected into asynchronous actions. They are independent alternatives: to try one, save its complete block in `app/http/controllers/alias_example_controller.py` and register this API route once:

```python
from app.http.controllers.alias_example_controller import AliasExampleController
from orionis.support.facades import Route

Route.post("/validation/alias-example", AliasExampleController)
```

Send the stated body to `POST /validation/alias-example` with `Content-Type: application/json`. The container validates the schema before calling `__call__`; the action only accesses validated fields. With default API error handling, valid examples return JSON `200` and invalid ones produce `422` errors without invoking the action. The request must pass the route's middleware.

For easy copying, each example combines its schema and controller in one module. In your application, you can separate the classes into `app/http/schemas` and `app/http/controllers`, importing the schema in the controller.

#### Field

Use `Field` when a field needs constraints, rules, or metadata in addition to its type. The first argument is the type; the remaining arguments add conditions and documentation. Here, a public name must contain between 2 and 60 characters.

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

`"Ada"` passes validation; `"A"` or a 61-character string raises `ValidationException`. `Description` documents the field without changing its value.

Send `{"name": "Ada"}`: the action responds with `{"name": "Ada"}`.

#### Choice

Use `Choice` for a closed set of values, such as a ticket's priority. Declare each allowed literal explicitly; a default value remains a separate decision.

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

`"high"` is valid, and omitting `priority` applies `"normal"`. A value such as `"urgent"` is rejected; text comparisons are case-sensitive.

Send `{"priority": "high"}` to receive `{"priority": "high"}`, or `{}` to receive `{"priority": "normal"}`.

#### Nullable

Use `Nullable[T]` when `None` is a valid value, such as a display name that has not been set. Allowing `None` and allowing a field to be omitted are separate decisions.

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

`display_name` must be supplied, even if its value is `None`; omitting it produces a required-field error. `nickname` can be omitted because it has `= None`. An integer is invalid for either field.

Send `{"display_name": null}`: the action responds with `{"display_name": null, "nickname": null}`. Sending `{}` or `{"display_name": 42}` produces errors before the action runs.

#### AnyOf

Use `AnyOf` when an operation accepts alternative types, such as a numeric identifier or an external text reference. The result preserves the type corresponding to the input.

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

A list or `None` is rejected in this example. Alternatives must be compatible with `msgspec`: not every combination is valid. For example, `AnyOf[str, bytes]` is unsupported by the converter; do not use it as a field declaration.

Send `{"reference": 42}` or `{"reference": "SKU-42"}`: the action returns the same identifier, preserving its numeric or string type.

#### Constant

Use `Constant` to signal a module-level configuration constant to typing tools. You can use that constant as the default for a normal field.

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

`Constant` aliases `Final`: it does not enforce runtime immutability or require the client to send `20`. The example accepts `50` because `page_size` is an `int` field. To accept only one specific payload value, declare `Choice[20]`.

Send `{}` to receive `{"page_size": 20}`; send `{"page_size": 50}` to receive `{"page_size": 50}`. A string such as `{"page_size": "50"}` is rejected.

#### Alias

Use `Alias` to name a type reused across schemas. You can also reuse a `Field` with its constraints, such as a profile's public name.

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

Both fields apply the same constraints: `"A"` fails for both `name` and `new_name`. Declare `DisplayName: Alias = ...` at module level, before the schemas; inside a `Schema` class, it would be interpreted as a field with an unsupported type. The syntax is an annotated assignment, not `Alias[...]`.

Send `{"name": "Ada"}` to the common route. For the second action, add this to the same routes file:

```python
Route.post("/validation/alias-rename", [AliasExampleController, "rename"])
```

Send `{"new_name": "Lin"}` to `POST /validation/alias-rename`; the container injects `RenameProfileSchema` into `rename()` and returns `{"new_name": "Lin"}`.

#### Static

Use `Static` for class attributes describing a schema or its context that should not belong to the payload. For example, an application-assigned source can be shared across all instances.

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

`source` is not a required field, is excluded from `toDict()`, and is not populated from the request body. It is a shared class attribute; declare per-request data as normal fields.

Send `{"event": "signup"}`: the response is `{"source": "web", "payload": {"event": "signup"}}`. Omitting `event` fails; sending `source` is unnecessary.

### Structural constraints

The ten constraint metadata classes are `GreaterThan`, `GreaterThanOrEqual`, `LessThan`, `LessThanOrEqual`, `MultipleOf`, `Pattern`, `MinLength`, `MaxLength`, `TimezoneAware` and `TimezoneNaive`. Import them from `orionis.schemas.constraints`; they are checked during conversion.

`Field[str, MinLength(2), MaxLength(80)]` and `Annotated[str, MinLength(2), MaxLength(80)]` are equivalent. The first argument is always the type; the remaining arguments are compatible constraint, rule or metadata instances.

Compilation applies to the outer `Field` of each schema field. Do not place Orionis constraints inside `list[Field[str, MinLength(2)]]`: those inner metadata items are not compiled. To validate each element with those constraints, use a child schema with normally declared fields and validate its structure, or validate elements explicitly.

The compiler rejects duplicate or incompatible constraints, such as two `MinLength` declarations, a minimum greater than the maximum, `MultipleOf(0)` or both timezone conditions on the same field. Types must also support the applied constraints: an incompatible combination can prevent conversion. Fix those combinations in the schema; they do not represent invalid data supplied by a client.

### Rules

Rules are `Rule` instances, such as `Email()`. They run on converted values and can be combined with constraints in the same `Field`. A format rule does not replace the type: declare `Field[str, Email()]` to require a string and check its format.

See signatures, accepted types and special behavior for all rules in the [complete reference](/en/validation/constraints-and-reference). To extend them, see [custom rules](/en/validation/application-rules).

### Documentation metadata and messages

Import these objects from `orionis.schemas.metadata`:

| Metadata | Purpose |
| --- | --- |
| `Title(value)` | Field title for documentation output. |
| `Description(value)` | Field description. |
| `Examples(values)` | List of JSON-serializable examples. |
| `ExtraJsonSchema(data)` | Additional JSON Schema properties. |
| `Extra(data)` | Application-specific metadata. |
| `Message(text)` | Custom message for a type error. |

The first five do not check or transform values. `Message` customizes errors rather than adding a condition. Constraints and many rules also accept `message=` for their own failures; consult each signature in the reference.

## Validation during the request

The `payload: UserSchema` parameter activates the HTTP flow: the container obtains `await request.data()`, awaits `Validator.validate(data, UserSchema)` and invokes the method only if validation succeeds. It does not automatically merge the body with the query string or route parameters.

Conversion is strict: sending `"36"` as the age produces a type error even though the string contains digits. The validator method has no `strict=False` option. Unknown fields are ignored by default; reject them by declaring the class as `class UserSchema(Schema, forbid_unknown_fields=True):`.

Constructing `UserSchema(name=..., email=..., age=...)` directly uses the `msgspec.Struct` constructor, which does not run these type, constraint and rule checks. Reserve direct construction for trusted data; use the injected parameter in an action to receive external input.

### Asynchronous execution

Schema resolution awaits validation within the request's asynchronous flow. The underlying public method is `await Validator.validate(payload, schema)`; there is no synchronous variant or `validateAsync` method.

Every rule implements `async def enforce(...)`; the executor awaits it in declaration order through `Rule.validate()`. This includes local checks even when they need no internal `await`. A synchronous `enforce()` override is rejected when the subclass is defined. There is no alternate `enforceAsync()` method or automatic adaptation of synchronous rules.

Rules are awaited sequentially without automatically moving them to a worker thread. For I/O, use an asynchronous API or explicitly adapt a blocking operation as described under [custom rules](/en/validation/application-rules). The same pipeline is used by other entry points that invoke the validator.

### Supported conversions

In `app/http/controllers/typed_values_controller.py`:

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

Register the action in the API routes:

```python
from app.http.controllers.typed_values_controller import TypedValuesController
from orionis.support.facades import Route

Route.post("/typed-values", TypedValuesController)
```

Send `POST /typed-values` with this JSON body:

```json
{"id": "ddeb27fb-d9a0-4624-be4d-4615062daed4", "joined_on": "2026-01-15", "scores": [1, 2]}
```

The action receives `payload.id` as a `UUID`, `payload.joined_on` as a `date` and the `scores` elements as integers; it responds with the UUID and date as text and `total_score: 3`.

These conversions belong to the declared type; they do not provide general conversion from any string to any type.

## Nested schemas and data access

Declare a schema as a field of another schema. The validator converts the child dictionary and runs its rules; errors retain the field path, such as `contact.email`.

In `app/http/controllers/account_controller.py`:

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

Register the action in the API routes:

```python
from app.http.controllers.account_controller import AccountController
from orionis.support.facades import Route

Route.post("/accounts/preview", AccountController)
```

Send `{"contact": {"email": "ada@example.com"}}` to `POST /accounts/preview`. The action receives `payload.contact` as a `ContactSchema` and returns that body as JSON. An invalid email produces an error at `contact.email` before invoking the method.

`toDict()` returns a dictionary and recursively converts child schemas, including those held in dictionary values, lists and tuples. It preserves these containers and other values: dates and UUIDs remain Python objects rather than JSON text. This is data conversion; it runs neither validation nor rules.

### Rules inside collections

Validation traverses schemas held in lists, dictionaries, tuples, and other compatible collections. It checks child types and constraints and awaits their rules, including when another field or element fails conversion. You do not need to validate each child manually.

To reuse `ContactSchema`, save this endpoint in `app/http/controllers/preview_contacts_controller.py`:

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

Register the action in the API routes:

```python
from app.http.controllers.preview_contacts_controller import PreviewContactsController
from orionis.support.facades import Route

Route.post("/contacts/preview", PreviewContactsController)
```

Send `{"contacts": [{"email": "ada@example.com"}]}` to `POST /contacts/preview` with `Content-Type: application/json`: the controller receives a `ContactSchema` at `payload.contacts[0]` and returns the schema as JSON. With `{"contacts": [{"email": "invalid"}]}`, `Email()` rejects the child before the action runs; default API handling responds with `422` and an error at `contacts[0].email`.

Declaring `contacts: dict[str, ContactSchema]` makes input such as `{"contacts": {"primary": {"email": "invalid"}}}` report `contacts['primary'].email`. Compatible annotations and unions preserve this recursive traversal. See the [complete collection and partial error examples](/en/validation/validation-and-errors#schemas-in-collections).

## Other entry points

Controllers are one entry point. MCP tools and Realtime adapters have their own automatic integration for validating typed data; their declarations and input sources are described under [schema integrations](/en/validation/integrations). They do not need to simulate an HTTP request or follow `Request.data()` reading.

In services, jobs, or a simple WebSocket handler without automatic integration, explicitly validate already-decoded data from the asynchronous method processing it:

```python
from app.http.schemas.userschema import UserSchema
from orionis.schemas.validator import Schema as Validator


async def validate_imported_user(data: dict) -> UserSchema:
    return await Validator.validate(data, UserSchema)
```

`Validator` aliases the `Schema` utility in `orionis.schemas.validator`. The method returns the validated instance or raises `ValidationException`; it accepts already-read data, such as a dictionary, rather than JSON text to decode. This usage neither assumes an active request nor automatically injects its body. When an adapter already validates and injects the schema, as the HTTP parameter shown in this guide does, do not repeat validation inside its method.

## Organization and next steps

Keep schemas focused on the data for an operation. Separate input and output, reuse child schemas and organize files by domain using the generator's subdirectories as needed. These are project organization choices.

Continue with [validation execution and errors](/en/validation/validation-and-errors), [schemas in HTTP controllers](/en/validation/controllers-and-http), or [MCP, Realtime, and other entry points](/en/validation/integrations). The [reference](/en/validation/constraints-and-reference) documents available constraints and rules; [custom rules](/en/validation/application-rules) extend their checks.
