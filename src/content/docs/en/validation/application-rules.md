---
title: "Application rules and validation with I/O"
description: "Create custom Rule subclasses and run local or I/O checks inside the asynchronous validation pipeline."
editUrl: true
lastUpdated: false
---

An application rule checks a condition on a value already converted to its declared type. Add it to a field's metadata using `Field[T, ...]`, alongside structural constraints. For checks included with Orionis, see the [complete rule and constraint reference](/en/validation/constraints-and-reference).

Declare the schema as an HTTP action parameter: the container validates the request body and awaits its rules before injecting the instance. The action runs only when validation succeeds. The same pipeline combines structural constraints, local rules, and asynchronous I/O rules. Schemas do not depend on controllers: reuse their rules in [MCP, Realtime, and other entry points](/en/validation/integrations).

## Custom rule contract

Import `Rule` from `orionis.schemas.rule` and subclass it. The executor recognizes `Rule` instances; implementing only the `IRule` contract is not sufficient to attach a rule to a schema.

| Component | Responsibility |
| --- | --- |
| `async def enforce(field, value, instance) -> bool` | Single check method for both local conditions and I/O: returns `True` for a valid value or `False` to report an error. |
| `field: str` | Field path, such as `address.code`, `contacts[0].email`, or `contacts['primary'].email`. |
| `value: object` | Contains the current field's converted value. |
| `instance: object` | Provides access to other available fields on the same object. |
| `__code__` | Identifier published in `errors[field][i]["rule"]` and `ValidationFailure.rule`. Defaults to the lowercase class name when omitted. |
| `__message__` | Default message for an invalid value. Define a useful description for the error recipient. |
| `Rule(message=...)` | Overrides the default message for this declaration. Pass the argument by keyword. |

You do not need to override `async validate()`: the inherited implementation calls `await self.enforce(field, value, instance)`. When the check returns `False`, it constructs a `ValidationFailure` containing the field, code, and message; it returns `None` for a valid value.

Declare `enforce()` with `async def` even when its calculation contains no `await`. A synchronous `def enforce(...)` override raises `TypeError` when the class is defined. There is no alternate `enforceAsync()` method or automatic adaptation of synchronous rules; subclasses may also inherit an existing asynchronous implementation.

A rule reports an invalid value by returning `False`. Exceptions raised by its logic propagate; they are not automatically converted into validation failures.

### Generate a rule with the CLI

From the project root, use either command:

```bash
orionis make:http-schema-rule EvenRule
```

```bash
python -B reactor make:http-schema-rule EvenRule
```

The command creates `app/http/schemas/rules/evenrule.py` with a `Rule` subclass, `__code__ = "custom_rule"`, `__message__ = "The value is invalid."`, and `async def enforce(self, field, value, instance) -> bool`. The path follows `app_http_schemas_rules`; the `Rule` suffix is added when missing. Existing files are not overwritten.

Replace the code and message with your condition's values and implement `enforce`: the template raises `NotImplementedError` until that logic is completed. For the next example, name the class `EvenRule` and use `EvenRule()` on the field, or retain the independent example's `Even` class.

## Complete example: even quantities

This rule combines with a numeric constraint. Type and bound checks happen during conversion; the parity condition is awaited afterwards. Its `async def enforce()` needs no internal `await` because it only calculates a local condition.

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

Save these classes in `app/http/controllers/preview_batch_controller.py` to follow the example. They are shown together for clarity; the rule and schema can live in separate modules. Register the controller in the configured API routes file:

```python
from app.http.controllers.preview_batch_controller import PreviewBatchController
from orionis.support.facades import Route

Route.post("/batches/preview", PreviewBatchController)
```

Send `POST /batches/preview` with `Content-Type: application/json`:

- `{"quantity": 4}`: the controller receives `payload.quantity == 4` and returns the schema as JSON with status `200`.
- `{"quantity": 3}`: `Even` returns `False`; the controller does not run, and default API handling responds with status `422` and the following body:

```json
{
  "message": "Quantity must be even.",
  "errors": {
    "quantity": [
      {"rule": "even", "message": "Quantity must be even."}
    ]
  }
}
```

You do not need to receive `Request` or call the validator manually: the `payload: Batch` annotation triggers request-body validation and injection. This response applies to API routes; see the [API and WEB handling differences](/en/validation/controllers-and-http#http-validation-errors).

`__slots__ = ()` prevents adding an attribute dictionary to this subclass without its own configuration; it does not change the validation condition. If the rule accepts constructor configuration, declare its attributes and call `super().__init__(message=message)` to preserve the code and message.

Another schema can change the text using `Even(message="Use an even quantity.")`. `Field` aliases `typing.Annotated`: rules are metadata, rather than arguments to a field-construction function.

## Rules with asynchronous I/O

Implement the same `async def enforce()` and await the actual asynchronous API. This example queries the resolver through the loop's `getaddrinfo()`; the valid input uses `localhost`, and the invalid input is rejected before querying DNS.

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

In `app/http/controllers/check_server_controller.py`, the controller receives `Server` in the same way as `Batch`. Register its API endpoint:

```python
from app.http.controllers.check_server_controller import CheckServerController
from orionis.support.facades import Route

Route.post("/servers/check", CheckServerController)
```

With `Content-Type: application/json`, `POST /servers/check` accepts `{"host": "localhost"}` when the local resolver resolves it; it returns `{"host": "localhost"}` with status `200`. With `{"host": ""}`, the rule rejects the value before querying DNS and the action does not run. The default API response has status `422`:

```json
{
  "message": "Host must resolve through DNS.",
  "errors": {
    "host": [
      {"rule": "resolvable_host", "message": "Host must resolve through DNS."}
    ]
  }
}
```

`ResolvableHost` uses the same contract as `Even`: `Rule.validate()` awaits its `enforce()`. Orionis already includes `ActiveUrl` to check a URL's hostname; this example demonstrates the contract with a field containing only a hostname.

Declaring `async def` does not make a blocking operation asynchronous. **The pipeline awaits the rule on the current loop without automatically moving its method to a worker thread**. Use asynchronous I/O APIs; explicitly adapt a blocking synchronous API when needed. Brief local conditions, such as parity, are calculated directly.

Fields and rules are processed in order. Each asynchronous check is awaited before starting the next; the validator does not launch every query in parallel.

An unexpected rule exception interrupts that traversal and propagates. Cancellation of a suspended validation also propagates instead of becoming a field failure. Catch only errors that your rule considers invalid input, such as the resolver errors caught in this example.

### Built-in rules using external services

`ActiveUrl` checks hostname DNS resolution for a URL; it does not request the HTTP resource or inspect its content. Inside the pipeline, it uses the loop's resolver.

`Unique` queries the database through the current loop's connection and preserves its transaction. It requires a configured connection and access to the specified table. This check does not replace a database uniqueness constraint against concurrent writes.

Rules that read file contents, such as `Image`, `Dimensions`, and `Encoding`'s file check, await a helper that runs the file's synchronous `read()` in a worker thread. This specifically adapts that read; it does not mean every rule runs in a thread.

See their signatures, parameters, and examples in the [native reference](/en/validation/constraints-and-reference).

## Inspect other fields

After successful whole-object conversion, `instance` is the schema owning the field. If another value fails conversion, the collector still executes rules on valid fields: that traversal provides an object containing successfully converted fields, which may omit missing or invalid fields and their defaults.

For a cross-field rule, use a defensive read such as `getattr(instance, "other_field", None)` and explicitly decide how to handle an unavailable value. Do not rely on `instance` always having a particular class, or on an earlier rule transforming another field.

Rules on a field execute in declaration order and may contribute several errors. The executor does not stop at the first `False`. A rule also receives `None` when the declared type allows it; decide whether to accept that value.

## Reuse and organize rules

Orionis does not require a directory for custom rules. Organize them by responsibility, for example under `app/validation/rules/`, and import each class from the schemas that need it. Creating a rule is independent from [generating a schema](/en/validation/declaring-schemas).

Instances declared as metadata and their plans are reused. Store only stable configuration in a rule; do not retain the request, current value, or results from an earlier validation in shared attributes. Use local variables for invocation-specific data.

The executor awaits rules in direct child schemas and elements nested in lists, dictionaries, tuples, sets, and frozen sets compatible with conversion. It also traverses compatible annotations and unions: an allowed `None` value is skipped as a child. Dictionaries traverse their values; set indices reflect iteration order rather than a stable position. See the [collection and error examples](/en/validation/validation-and-errors#schemas-in-collections).

Cross-field checks on a child receive that child's fields, rather than its parent's fields or another collection element's fields. When one element fails conversion, the collector preserves that failure and continues awaiting rules on fields and elements it could convert.

The [controller and HTTP integration guide](/en/validation/controllers-and-http) explains how the same pipeline is awaited when a schema is declared as an action parameter.

## Use rules outside HTTP

Schemas and rules also work with data received through MCP, Realtime, tasks, or services. The [integration guide](/en/validation/integrations) distinguishes injection available in each context from explicit validation. For the latter, import `Schema as Validator` from `orionis.schemas.validator` and use `await Validator.validate(data, Batch)` inside an asynchronous method. In an action with `payload: Batch`, the container already performs that work; do not repeat it. The [error guide](/en/validation/validation-and-errors) explains when to catch `ValidationException`.
