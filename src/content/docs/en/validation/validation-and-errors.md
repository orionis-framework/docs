---
title: "Validation, errors, and integration"
description: "Catch ValidationException, inspect field errors, customize messages, and understand how conversion and rule failures are collected."
editUrl: true
lastUpdated: false
---

When an action declares a parameter such as `payload: Order`, the container validates the request body and injects a typed instance. Type, constraint, or rule failures raise `ValidationException` before the action runs. Default HTTP handling turns that exception into a response for the client.

You do not need to catch the exception inside the action or call the validator manually to enable injection. Start with [schema declarations](/en/validation/declaring-schemas) and [controller integration](/en/validation/controllers-and-http). The same validator is reused in [MCP, Realtime, and other entry points](/en/validation/integrations); the HTTP `422` response shown here belongs to API handling, rather than all those transports.

## Example: several errors in one operation

This schema combines a numeric bound, two rules on the same field, and a direct child schema. Save the example in `app/http/controllers/preview_order_controller.py`; the classes are shown together for clarity, although schemas can live in separate modules.

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

Register the controller in the configured API routes file:

```python
from app.http.controllers.preview_order_controller import PreviewOrderController
from orionis.support.facades import Route

Route.post("/orders/preview", PreviewOrderController)
```

Send `POST /orders/preview` with `Content-Type: application/json` and this valid body:

```json
{
  "quantity": 2,
  "reference": "ord-42",
  "contact": {
    "email": "ada@example.com"
  }
}
```

The action receives `payload` as `Order`, can access `payload.contact.email`, and returns the same fields as JSON with status `200`. If you send this body instead:

```json
{
  "quantity": 0,
  "reference": "ABC",
  "contact": {
    "email": "invalid"
  }
}
```

The controller does not run. Default API handling responds with status `422` and the contents of `ValidationException.error()`:

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

The collector preserves the `quantity` error and also executes rules on values that converted successfully. This produces two failures for `reference` and the direct child's `contact.email` failure. The `rule` identifier distinguishes the violated condition without interpreting its message.

## Inspect an exception

Automatic injection leaves HTTP error handling to the framework. Use this API to inspect a `ValidationException` when implementing explicit validation or custom error handling:

| API | Content |
| --- | --- |
| `error.failures` | Tuple of collected failures. Each failure exposes `field`, `rule`, and `message`. |
| `error.failure` | First failure; `None` if the exception was constructed without failures. |
| `error.errors` | Dictionary mapping field names to lists of objects containing `rule` and `message`. Preserves every collected failure for each field. |
| `error.message` | Summary: the first message and, when more failures exist, their remaining count. |
| `error.error()` | Serializable dictionary with `message` and `errors` keys. |
| `failure.toDict()` | Dictionary containing `field`, `rule`, and `message` for one failure. |

The example's first failure is represented as follows:

```json
{
  "field": "quantity",
  "rule": "ge",
  "message": "Quantity must be positive."
}
```

The summary uses the first error's text and a suffix for additional failures: `(and 1 more error)` or `(and N more errors)`. It counts failures, not fields. To present errors by field, consume `errors[field]` and read `item["message"]`; `item["rule"]` identifies the condition. There is no need to parse the summary text.

Rules publish their `__code__`, such as `email` or `starts_with`; custom rules that omit it use the lowercase class name. Constraints use codes such as `ge`, `multiple_of`, `min_length`, and `pattern`. Incompatible types use `type`, and missing required fields use `missing`. `failure.toDict()` adds `field` to the same code and message pair.

Field paths include dots for nested objects, such as `contact.email`, collection indices, such as `contacts[0].email`, and actual dictionary keys, such as `contacts['primary'].email`. This notation applies to both conversion failures and rules. Dictionary keys use `repr()` and may appear with single or double quotes; set indices describe iteration order rather than a stable position. An error concerning the complete payload may use an empty key.

## How failures are collected

1. The validator attempts to convert the whole payload and apply structural constraints through `msgspec`.
2. If conversion succeeds, it awaits rules on converted fields and traverses child schemas, including those inside collections. Every rule uses `async def enforce()` and is awaited through `Rule.validate()`.
3. If conversion fails, it inspects declared fields to collect conversion errors and missing required fields. For each type-compatible value, it checks every constraint and awaits every rule, even when a constraint fails. It also descends into collection children to preserve their failures.
4. It groups the collected failures into one `ValidationException`.

Rules on a field follow declaration order; a `False` result does not cancel subsequent checks. During nested traversal, children are validated before rules on their containing field. Checks are awaited sequentially rather than launching every field in parallel. An incompatible type or missing field prevents conditions requiring its converted value from running; valid fields on that child and other elements are still checked.

### Multiple constraints on the same field

This independent example combines two native constraints and a Python rule on one field. Save it as `validation_example.py` at the project root and run `python validation_example.py`:

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

`"ABC"` has the correct type but violates both constraints and the rule: `errors["value"]` contains three objects. Supplying `42` reports a `type` error; string conditions are not applied to that integer.

Valid data retains msgspec's native conversion and the plans prepared when the class is declared. Detailed traversal runs after that conversion fails; it is not repeated for every valid request. Python rules and their I/O waits still have their own cost.

The validator accepts no `bail`, `max_errors`, or first-error policy options: its `async validate()` method takes only `payload` and `schema`.

## Schemas in collections

Child schema rules also execute inside lists and dictionaries, as well as tuples, sets, and frozen sets compatible with conversion. Compatible annotations and unions preserve this traversal: this endpoint accepts either a contact list or a dictionary keyed by name.

Save the following example in `app/http/controllers/preview_contacts_controller.py`:

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

Register the action in the configured API routes file:

```python
from app.http.controllers.preview_contacts_controller import PreviewContactsController
from orionis.support.facades import Route

Route.post("/contacts/preview", PreviewContactsController)
```

With `Content-Type: application/json`, `POST /contacts/preview` accepts `{"contacts": [{"email": "ada@example.com"}]}`. The controller receives an `ImportContact` at `payload.contacts[0]`; `nickname` defaults to `"guest"`. It also accepts `{"contacts": {"primary": {"email": "ada@example.com"}}}`, whose child is available at `payload.contacts["primary"]`.

This body contains an incorrect type, a failed rule, a failed constraint, and an error on another parent field:

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

The action does not run. Default API handling returns status `422` with these errors:

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

The first child's failure does not hide the other children's errors, and the `count` error does not prevent contact checks. Sending `{"contacts": {"primary": {"email": "invalid"}}}` to the same endpoint reports `"contacts['primary'].email"` with the message `"Enter a valid email address."`.

Nested collections retain every selector, for example `contacts[0]['main'][1].email`. When a collection fails its own constraint, such as `MinLength`, a failure on `contacts` may be preserved alongside child failures. For a tagged union of schemas, the collector uses the member selected by its tag and that member's messages, rather than those on the first declared member.

Rules comparing fields on a child receive that child as their context. During partial conversion, this context only contains successfully converted fields: use defensive reads as described under [custom rules](/en/validation/application-rules#inspect-other-fields).

## Customize messages

- Use `Message("...")` from `orionis.schemas.metadata` for a field type error.
- Set `message="..."` on the specific constraint or rule to customize its failure.
- For a custom rule, define `__message__` as the default message and `__code__` as its identifier.

In `Order`, an incompatible quantity type uses `"Quantity must be an integer."`; the integer `0` uses `"Quantity must be positive."`. `Message` does not replace every message for the field or the error for a missing required field.

Constraint failures preserve the declared code and its custom message. For example, `GreaterThan(0, message="Must be positive.")` reports `gt`, even if msgspec internally expresses the integer bound as `>= 1`.

## Use results and handle application errors

Use the returned instance only after validation. Constructing a schema directly does not execute this pipeline; calling `msgspec.convert()` directly neither executes Orionis application rules nor produces its grouped exception.

`ValidationException` represents data rejected by validation. A programming exception or an exception from a service called by a rule propagates without automatically becoming a field error. Fix incompatible metadata declarations in the code: these errors may occur at class definition.

Injection awaits the asynchronous pipeline during request processing. Every rule implements `async def enforce()` and is awaited in order; a local condition may need no `await` inside its calculation. A blocking operation still blocks the loop unless explicitly adapted; see [rules with asynchronous I/O](/en/validation/application-rules#rules-with-asynchronous-io).

An unexpected exception inside a rule interrupts validation and propagates; it is not added to `errors` or treated as valid input. Cancellation while awaiting a rule also propagates as cancellation, including inside a collection or during partial error collection.

## Explicit validation as an alternative

When you need to prepare the body before validating it or receive data through another adapter, call the validator inside an asynchronous method. This alternative controller retains `Request` to control input reading and failure handling. Prefer the injected example when you only need to validate the body:

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

`Validator` is the execution class imported from `orionis.schemas.validator`; `Schema`, from `orionis.schemas`, declares fields. Use `await Validator.validate(...)`: without `await`, you only obtain a coroutine. A service, task, or adapter for another input source can use the same call and choose whether to catch or propagate `ValidationException`. Check the [MCP, Realtime, and explicit validation cases](/en/validation/integrations) before assuming that every entry point produces HTTP responses or uses the same data source.

In the automatic action with `payload: Order`, validation happens before entering the method. A `try/except` inside that action therefore cannot catch an injection error; use default HTTP handling or the application's exception handling mechanism.

## HTTP integration

The [controller and HTTP integration guide](/en/validation/controllers-and-http) explains automatic schema injection, input selection, and HTTP error responses, including API and WEB differences. The dictionary above is the output of `ValidationException.error()`; HTTP presentation depends on that integration.

When logging or returning errors, use the fields and messages the client needs; do not include passwords or the complete payload.

<a id="validation-plan-cache"></a>

## Bounded validation plans

Since **1.1.0**, custom-rule plans use a process-local LRU with capacity for **1,024 schema types**. Eviction releases the cached plan and allows dynamically created types to be collected when no other references remain. Reusing an evicted type rebuilds its plan; validation is never skipped because the cache is full. Recursive child-plan preparation and concurrent compilation are guarded. Validation rules, structured errors and serialization behavior are unchanged.
