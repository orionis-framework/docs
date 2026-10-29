---
title: "Validation in controllers and responses"
description: "Complete guide to schema injection in HTTP controllers, asynchronous input and output validation, and API and WEB errors."
editUrl: true
lastUpdated: false
---

A controller parameter annotated with a concrete `Schema` class receives a validated request body. The container reads the data, runs asynchronous validation, and passes the instance to the action. If validation fails, the action does not run.

This chapter covers HTTP integration; the same mechanism applies to route functions resolved by the container. Schemas are also reused in [MCP, Realtime, and other entry points](/en/validation/integrations), with their own data sources and error responses.

Start with [schemas and validation](/en/validation) and [declaring schemas and generating them with the CLI](/en/validation/declaring-schemas). The [reference for all 47 native constraints and rules](/en/validation/constraints-and-reference), [custom rules](/en/validation/application-rules), and [error API](/en/validation/validation-and-errors) complete this guide.

## A controller with input and output schemas

This endpoint returns a preview of the submitted data; it does not save users. Create the following application files and register the route in the API file configured in `bootstrap/app.py`, commonly `routes/api.py`. The request must pass that route's middleware and access policy.

### Input schema

In `app/http/schemas/create_user_schema.py`:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import Email, GreaterThanOrEqual, MinLength
from orionis.schemas.fields import Field


class CreateUserSchema(Schema):
    name: Field[str, MinLength(2, message="Name must have at least 2 characters.")]
    email: Field[str, Email(message="Email is invalid.")]
    age: Field[int, GreaterThanOrEqual(18, message="Age must be at least 18.")]
```

All three fields are required. `name` requires at least two characters, `email` applies the `Email` format rule, and `age` must be an integer greater than or equal to 18. Import the declarative base class from `orionis.schemas`; `Field` attaches constraints and rules to a type.

### Output schema

In `app/http/schemas/user_preview_schema.py`:

```python
from orionis.schemas import Schema


class UserPreviewSchema(Schema):
    name: str
    email: str
    age: int
```

This class describes the preview fields. A separate output schema lets you explicitly choose which data to return.

### Controller action

In `app/http/controllers/preview_user_controller.py`:

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

`payload` arrives as a validated `CreateUserSchema` instance. The action actually returns a `UserPreviewSchema` object; its return annotation describes that intention but does not itself run validation.

### Register and try the route

In the API route file:

```python
from app.http.controllers.preview_user_controller import PreviewUserController
from orionis.support.facades import Route

Route.post("/users/preview", PreviewUserController)
```

Send a `POST` request to `/users/preview` with `Content-Type: application/json` and this body:

```json
{"name": "Ada", "email": "ada@example.com", "age": 36}
```

The response is JSON with status `200`:

```json
{"name": "Ada", "email": "ada@example.com", "age": 36}
```

## How the parameter is validated

1. The container recognizes the schema class annotation on the action.
2. It resolves the active `Request` and reads `await request.data()`.
3. It runs `await Validator.validate(data, CreateUserSchema)`: converts compatible types, checks constraints, and executes rules.
4. On success, it injects the instance into `payload` and runs the action.
5. On failure, it raises `ValidationException` and the default HTTP handling builds the appropriate response.

You do not need to read the body again or invoke the validator manually in this action. Rules and their nesting limitations are the same as in [explicit validation](/en/validation/declaring-schemas).

Declare the parameter with a concrete class and no default value, as in `payload: CreateUserSchema`. A default takes priority over automatic resolution. Also choose a name distinct from route parameters: an argument supplied by the route takes precedence over schema injection.

### Where the data comes from

Injection uses only the dictionary returned by `Request.data()`. It does not automatically merge route parameters, query strings, cookies, or headers into the body.

| Request body | Input available to the schema |
| --- | --- |
| `application/json` | Top-level JSON object decoded as a dictionary. |
| `application/msgpack` | Decoded top-level mapping. |
| `application/x-www-form-urlencoded` | Form fields; repeated keys may produce lists. |
| `multipart/form-data` | Text fields and uploaded file objects. |

These are the content types recognized by `data()`; it does not automatically recognize every subtype ending in `+json`. A top-level JSON array is not the dictionary this flow requires.

Conversion keeps the validator's strict behavior. In this example, `"age": "36"` fails because it is a string. Text form fields also arrive as strings: declaring `age: int` does not automatically convert them to integers. Deliberately adapt input through [explicit validation](/en/validation/declaring-schemas) when your format requires it.

## Schema or Request

| Parameter | When to use it |
| --- | --- |
| `payload: CreateUserSchema` | To work with typed body fields validated before the action runs. |
| `request: Request` | To inspect headers, query strings, cookies, metadata, or control body reading. Receiving it does not automatically validate those values. |
| Both parameters | When you need a validated body and other request data. Import `Request` from `orionis.http`. |

Route parameters still reach the action by name; they are independent of the body schema. See [controllers](/en/http/controllers) and [Request and payloads](/en/http/requests) for their access mechanisms.

## HTTP validation errors

The validator collects conversion and rule failures in a `ValidationException`. Default handling depends on the routing context:

| Context | Default result |
| --- | --- |
| API | The kernel returns JSON with status `422`, even without `Accept: application/json`. |
| WEB expecting JSON or using AJAX | WEB validation handling returns JSON with status `422`. |
| WEB with ordinary navigation | Returns a `302` redirect and stores errors and filtered previous input in session flash data. |

In WEB, negotiation uses `wantsJson()` or `isAjax()`: for example, `Accept: application/json` or `X-Requested-With: XMLHttpRequest`. Sending only `Content-Type: application/json` does not request a JSON response.

For the invalid body `{"name": "x", "email": "bad", "age": 17}`, the API endpoint above responds:

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

`message` summarizes the first failure and counts the remaining failures; `errors` groups `{rule, message}` objects by field. One field can contribute several constraint and rule failures. The [error API](/en/validation/validation-and-errors) explains how to inspect and customize them.

A WEB redirect first uses the previous session URL, then an allowed same-origin `Referer`, and finally the current URL as a fallback. Retained input excludes sensitive top-level fields such as `password` and `password_confirmation`. See [sessions and flash data](/en/sessions/state-and-flash).

These responses describe schema failures with default handling. Body reading, format, or middleware errors can produce other responses before validation.

## Returning schemas and validating output

When an action directly returns a `Schema` instance, the framework validates its types, constraints, and rules before wrapping it in a `JSONResponse` with status `200`. It also checks child schemas and collection elements. You do not need to call `toDict()` or manually validate this output.

Distinguish these behaviors:

- The actual value activates the check: a `Schema` instance is validated even without a return annotation.
- Annotating `-> UserPreviewSchema` does not convert a returned dictionary to that class or validate the dictionary.
- Constructing an instance directly does not run validation; the framework validates it when processing it as HTTP output.
- An instance modified after input validation is checked again when returned.
- Ordinary responses (`dict` or an already constructed `Response`) do not run this validator. The framework does not recursively search arbitrary returned containers for schemas.

Output rules belong to the returned schema. This independent example demonstrates automatic validation:

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

Place the block in your API route file, or separate the classes and import them before registration. `GET /stock` returns `{"quantity": 5}`. If you change the return value to `StockOutput(quantity=-1)`, construction succeeds but output validation rejects the quantity. A string such as `StockOutput(quantity="bad")` is also rejected by its type.

Invalid output is an application failure: default handling produces **HTTP `500`**, rather than the `422` used for invalid input or a form redirect. The client response follows server error handling and its debug configuration; do not treat its details as the public input-error contract.

If you return the same schema received as a parameter, its rules run for both input and output. Account for this when a rule queries external services. Keep these checks free of side effects and declare an output schema appropriate for the data you publish.

To control status or headers, return an explicit response, such as `response.json(schema, status_code=202)`, importing `response` from `orionis.http`. The result is already a response, so it does not activate the direct-Schema check. If its content needs validation, run `await Validator.validate(data, YourSchema)` before constructing it. See [HTTP responses](/en/http/responses) for response configuration.

## Manual validation as an alternative

Schema injection is the primary flow for the HTTP actions above: Orionis reads and validates the body before calling the method. Explicit validation is useful when another entry point obtains the data or when input needs preparation before validation.

### Explicit validation with Request

When you need to control how input is obtained or prepared, keep `Request` and validate explicitly. This alternative for the same controller performs the reading that the container handles automatically in the earlier example:

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

Both approaches await `Validator.validate(...)`. Schema injection removes that manual reading and validation from the action; receiving only `Request` does not perform them by itself. You can also declare both parameters, such as `payload: CreateUserSchema, request: Request`, to inspect headers without repeating body validation.

### Services and other input sources

In a service or process receiving decoded records, supply the data explicitly; an annotation alone does not identify its source. This alternative does not require an active HTTP `Request`. MCP and Realtime have their own injection mechanisms, covered in the [integration guide](/en/validation/integrations).

```python
from app.http.schemas.create_user_schema import CreateUserSchema
from orionis.schemas.validator import Schema as Validator


class UserImportService:
    async def validate_record(self, record: dict) -> CreateUserSchema:
        return await Validator.validate(record, CreateUserSchema)
```

The service's caller awaits `await service.validate_record(record)` in its own asynchronous context. Rules and exceptions stay the same; data selection and decoding depend on that entry point.

The [HTTP validation introduction](/en/http/validation) summarizes this flow. To extend payload checks, continue with the [rule catalog and examples](/en/validation/constraints-and-reference) and [custom rules](/en/validation/application-rules).
