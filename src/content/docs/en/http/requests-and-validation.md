---
title: "HTTP validation with schemas"
description: "Introduction to asynchronous payload validation and schemas as controller responses; continue with the complete Validation guide."
editUrl: true
lastUpdated: false
---

Schemas describe a payload's accepted fields, types, and rules. A controller action can receive a validated schema directly instead of manually reading and validating the body through `Request`.

This page introduces the HTTP flow. The [Validation guide](/en/validation) covers its architecture, CLI generator, every native rule, custom rules, and error handling.

The same contracts also work in MCP tools, Realtime remote methods, and other entry points. The [integration guide](/en/validation/integrations) explains each context's data source; the body injection shown here is specific to HTTP.

## Receiving validated data

Annotate the parameter with a concrete `Schema` class, without a default value:

Orionis constructs and injects that object while resolving the request. Inside the action, use its fields directly; you do not need to construct the schema, read the body, or run the validator manually for that parameter.

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

When handling the route, the container reads `await request.data()` and runs `await Validator.validate(data, ProfileInput)`, where `Validator` aliases `Schema` from `orionis.schemas.validator`. It passes `payload` to the action only after validation succeeds.

A JSON body such as `{"name": "Ada"}` allows the action to return `{"name": "Ada"}`. If the name fails `MinLength(2)`, the action does not run. The [controller integration guide](/en/validation/controllers-and-http) shows the files, route registration, and complete responses.

Injection validates the **body**: it does not automatically merge query strings, route parameters, or headers. You can also receive `Request` when you need those values or control body reading. Conversion is strict; numeric text does not automatically become an `int`.

## Returning a schema

The example returns a `ProfileOutput` instance; the kernel serializes it as JSON with status `200`. The `-> ProfileOutput` annotation describes the return value but **does not automatically validate or convert output**. To check output, explicitly run `await Validator.validate(..., ProfileOutput)` before returning it.

With default handling, validation failures produce JSON `422` in API routes. In WEB, they produce JSON `422` for requests expecting JSON or using AJAX, and a `302` redirect with session errors for ordinary navigation. See [input, output, and HTTP error details](/en/validation/controllers-and-http).

## Complete Validation guide

- [Architecture and execution](/en/validation): schemas, constraints, rules, and asynchronous validation.
- [Declarations and CLI generator](/en/validation/declaring-schemas): `make:http-schema`, fields, defaults, and metadata.
- [Integrations and entry points](/en/validation/integrations): HTTP, MCP, Realtime, WebSockets, and services.
- [Every native constraint and rule](/en/validation/constraints-and-reference): signatures and a code example for each one.
- [Custom rules](/en/validation/application-rules): contracts and application checks, including asynchronous I/O.
- [Validation errors](/en/validation/validation-and-errors): field failures and messages.
- [Controllers and responses](/en/validation/controllers-and-http): a complete injection example, output validation, and API/WEB errors.

For the related HTTP APIs, see [controllers](/en/http/request-lifecycle), [Request and payloads](/en/http/forms-and-uploads), and [responses](/en/http/responses).

In services or plain WebSocket handlers, explicitly validate data you have already read. MCP and Realtime provide their own validation and injection mechanisms; see the [examples for each integration](/en/validation/integrations).
