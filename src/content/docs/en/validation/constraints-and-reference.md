---
title: "Constraints, metadata, and reference"
description: "Complete native constraint and rule reference: parameters, accepted types, examples, and verified considerations."
editUrl: true
lastUpdated: false
---

This reference covers the **47 public names** in `orionis.schemas.constraints`: **10 structural constraints** and **37 executable rules**. The categories below organize the reference; they do not represent separate internal modules.

## Reading the examples

Each of the **47 elements** includes a schema, a controller method with **schema injection**, and accepted/rejected inputs. Tables retain signatures, defaults and accepted types.

To try an example, copy these imports and the selected element's block into `app/http/controllers/rule_example_controller.py`:

```python
from datetime import date, datetime

from orionis.http.base import BaseController
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field
```

Register the controller in your application's configured API routes file. This registration uses the first example; replace `GreaterThanController` with the controller you want to try:

```python
from app.http.controllers.rule_example_controller import GreaterThanController
from orionis.support.facades import Route

Route.post("/validation/example", GreaterThanController)
```

Send the valid or invalid JSON body shown in each section to `POST /validation/example`, with `Content-Type: application/json`. For example, for `GreaterThan`:

```bash
curl -X POST http://localhost:8000/validation/example -H "Content-Type: application/json" -H "Accept: application/json" --data '{"value":1}'
```

The container reads the request body, awaits asynchronous validation and **injects the validated instance** into `payload` before executing `__call__()`. Valid input makes these controllers return JSON with status 200; invalid input produces the API 422 response and the method does not run. These actions do not need a `Request` parameter, an explicit validator call or a new event loop.

The examples use HTTP to show how to test each condition; **rules belong to the schema, not to the controller**. The same schema can reuse them in MCP tools, Realtime remote methods and explicit validation in services or other entry points. Each integration obtains its payload and handles errors differently; see [schemas across entry points](/en/validation/integrations) to choose the appropriate flow.

File examples use `multipart/form-data`, as shown in their section. `Unique` also requires the documented connection and data. The [HTTP integration guide](/en/validation/controllers-and-http) explains controller injection and its responses.

Each table field belongs inside a `Schema` class. References to `minimum`, `maximum`, `password`, `start` or `end` also require that sibling field; the corresponding examples include it.

Every constructor accepts **keyword-only `message: str | None = None`**. It replaces the failure message for that constraint or rule without changing its condition. Tables omit this shared argument and show all remaining parameters. Parameters without a default are required. `—` means only `message` is accepted; `*` introduces keyword-only arguments. Variadic `*prefixes`, `*suffixes`, `*formats`, `*values` and `*mime_types` arguments require at least one item.

Structural constraints compile into the type-conversion layer. `Rule` subclasses check converted values: **they neither replace type annotations nor transform data**. Many text rules add no error for a different type; declare `str` when text is required. Allowing `None` in a type does not automatically disable every rule.

### Asynchronous execution and nested schemas

All **37 executable rules** implement `async def enforce(...)`: validation always awaits their evaluation, including local checks without I/O. There is no synchronous rule variant or alternate `enforceAsync` method. Type conversion and structural constraints remain the first phase; rules then run in declaration order without launching concurrent tasks per field. `ActiveUrl` awaits name resolution, `Unique` awaits the active connection's query, and rules that read files delegate that read to a worker thread.

A child schema's rules also run when it is held in lists, dictionary values, tuples, sets or frozensets supported by conversion, including nested and optional collections. No manual per-element validation is required. For example, if `ContactSchema.email` declares `Email()`, a `contacts: list[ContactSchema]` field checks every email and retains error paths such as `contacts[0].email`. The [error guide](/en/validation/validation-and-errors) explains paths and failure collection, including when another item could not be converted.

## Numeric constraints

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `GreaterThan` | An `int`/`float` strictly greater than the bound; equality fails. | `value: int \| float` | `value: Field[int, C.GreaterThan(0)]` |
| `GreaterThanOrEqual` | An `int`/`float` greater than or equal to the bound. | `value: int \| float` | `value: Field[int, C.GreaterThanOrEqual(18)]` |
| `LessThan` | An `int`/`float` strictly less than the bound; equality fails. | `value: int \| float` | `value: Field[float, C.LessThan(100)]` |
| `LessThanOrEqual` | An `int`/`float` less than or equal to the bound. | `value: int \| float` | `value: Field[int, C.LessThanOrEqual(100)]` |
| `MultipleOf` | An `int`/`float` divisible by a positive `value`. Use an integer divisor for an `int` field. | `value: int \| float` | `value: Field[int, C.MultipleOf(5)]` |

All five are structural constraints for `int` and `float`, rather than business rules applicable to arbitrary objects. These numeric metadata constraints do not support `Decimal`. `MultipleOf` requires a divisor greater than zero. Avoid incompatible bounds: do not combine `GreaterThan` with `GreaterThanOrEqual`, or `LessThan` with `LessThanOrEqual`, on the same field.

### GreaterThan

1 is greater than 0; 0 fails because equality is excluded.

```python
class GreaterThanSchema(Schema):
    value: Field[int, C.GreaterThan(0)]


class GreaterThanController(BaseController):
    async def __call__(self, payload: GreaterThanSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": 1}
```

Invalid body (422):

```json
{"value": 0}
```

### GreaterThanOrEqual

18 meets the minimum; 17 is below it.

```python
class GreaterThanOrEqualSchema(Schema):
    value: Field[int, C.GreaterThanOrEqual(18)]


class GreaterThanOrEqualController(BaseController):
    async def __call__(self, payload: GreaterThanOrEqualSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": 18}
```

Invalid body (422):

```json
{"value": 17}
```

### LessThan

99.5 is below 100; 100.0 fails because equality is excluded.

```python
class LessThanSchema(Schema):
    value: Field[float, C.LessThan(100)]


class LessThanController(BaseController):
    async def __call__(self, payload: LessThanSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": 99.5}
```

Invalid body (422):

```json
{"value": 100.0}
```

### LessThanOrEqual

100 is allowed; 101 exceeds the maximum.

```python
class LessThanOrEqualSchema(Schema):
    value: Field[int, C.LessThanOrEqual(100)]


class LessThanOrEqualController(BaseController):
    async def __call__(self, payload: LessThanOrEqualSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": 100}
```

Invalid body (422):

```json
{"value": 101}
```

### MultipleOf

15 is a multiple of 5; 12 is not.

```python
class MultipleOfSchema(Schema):
    value: Field[int, C.MultipleOf(5)]


class MultipleOfController(BaseController):
    async def __call__(self, payload: MultipleOfSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": 15}
```

Invalid body (422):

```json
{"value": 12}
```


## Length and patterns

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `MinLength` | Inclusive minimum length for a `str`, `bytes` or collection; fewer characters, bytes or items fails. | `value: int` | `value: Field[str, C.MinLength(1)]` |
| `MaxLength` | Inclusive maximum length for a `str`, `bytes` or collection; exceeding the limit fails. | `value: int` | `value: Field[list[str], C.MaxLength(10)]` |
| `Pattern` | Searches a `str` for a regular-expression match; it does not require matching the entire text. | `regex: str` | `value: Field[str, C.Pattern(r"^[A-Z]{3}$")]` |

These are structural constraints. `MinLength` and `MaxLength` accept nonnegative bounds and apply to `str`, `bytes`, lists, variable-length tuples (`tuple[str, ...]`), sets, frozen sets and dictionaries. Fixed-length tuples such as `tuple[str, str]` do not support them. They count dictionary entries without independently validating their contents. `Pattern` applies only to `str`: use anchors such as `^...$` when the entire text must match.

Each structural metadata type may appear only once per field. A minimum greater than its maximum, or a pattern attached to an incompatible type, is a definition/configuration error rather than an ordinary rejected input value.

### MinLength

Three characters meet the minimum of two; one does not.

```python
class MinLengthSchema(Schema):
    value: Field[str, C.MinLength(2)]


class MinLengthController(BaseController):
    async def __call__(self, payload: MinLengthSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "Ada"}
```

Invalid body (422):

```json
{"value": "A"}
```

### MaxLength

Two items meet the limit; three exceed it.

```python
class MaxLengthSchema(Schema):
    value: Field[list[str], C.MaxLength(2)]


class MaxLengthController(BaseController):
    async def __call__(self, payload: MaxLengthSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": ["api", "web"]}
```

Invalid body (422):

```json
{"value": ["api", "web", "console"]}
```

### Pattern

The anchors require three uppercase letters; the digit in AB1 fails.

```python
class PatternSchema(Schema):
    value: Field[str, C.Pattern(r"^[A-Z]{3}$")]


class PatternController(BaseController):
    async def __call__(self, payload: PatternSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "ABC"}
```

Invalid body (422):

```json
{"value": "AB1"}
```


## Text content

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `Alpha` | A nonempty `str` containing Unicode letters and combining marks. With `ascii_only=True`, only ASCII letters. | `*, ascii_only: bool = False` | `value: Field[str, C.Alpha(ascii_only=True)]` |
| `Ascii` | A `str` containing only 7-bit ASCII characters; the empty string passes. | — | `value: Field[str, C.Ascii()]` |
| `Lowercase` | A `str` equal to `value.lower()`. Digits, symbols and empty text pass; the value is not transformed. | — | `value: Field[str, C.Lowercase()]` |
| `Uppercase` | A `str` equal to `value.upper()`. Uncased characters and empty text pass; the value is not transformed. | — | `value: Field[str, C.Uppercase()]` |
| `StartsWith` | A `str` starting with at least one prefix; comparison is case-sensitive. | `*prefixes: str` | `value: Field[str, C.StartsWith("orionis-", "app-")]` |
| `EndsWith` | A `str` ending with at least one suffix; comparison is case-sensitive. | `*suffixes: str` | `value: Field[str, C.EndsWith(".json", ".txt")]` |
| `DoesntStartWith` | A `str` that starts with none of the forbidden prefixes. | `*prefixes: str` | `value: Field[str, C.DoesntStartWith("admin-", "root-")]` |
| `DoesntEndWith` | A `str` that ends with none of the forbidden suffixes. | `*suffixes: str` | `value: Field[str, C.DoesntEndWith(".exe", ".bat")]` |
| `Encoding` | A `str` encodable with the selected codec; for files, bytes decodable with it. It does not convert the content. | `encoding: str = "utf-8"` | `value: Field[str, C.Encoding("ascii")]` |

Prefixes and suffixes are literals rather than regular expressions. Negative variants are also case-sensitive. An empty prefix or suffix follows Python's `str.startswith()`/`str.endswith()` semantics.

`Encoding()` defaults to `utf-8` and rejects an unknown codec name when constructed. For text, it checks representability in that codec rather than the original source encoding. For a file object, it attempts to decode the bytes returned by `read()`. If content cannot be obtained and the value is not text, it adds no failure: combine it with `File()` when a file is required.

### Alpha

With ascii_only=True, Ada passes and José fails because of é.

```python
class AlphaSchema(Schema):
    value: Field[str, C.Alpha(ascii_only=True)]


class AlphaController(BaseController):
    async def __call__(self, payload: AlphaSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "Ada"}
```

Invalid body (422):

```json
{"value": "José"}
```

### Ascii

Orionis contains only ASCII; café includes é.

```python
class AsciiSchema(Schema):
    value: Field[str, C.Ascii()]


class AsciiController(BaseController):
    async def __call__(self, payload: AsciiSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "Orionis"}
```

Invalid body (422):

```json
{"value": "café"}
```

### Lowercase

The lowercase form passes; uppercase O fails.

```python
class LowercaseSchema(Schema):
    value: Field[str, C.Lowercase()]


class LowercaseController(BaseController):
    async def __call__(self, payload: LowercaseSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "orionis-1"}
```

Invalid body (422):

```json
{"value": "Orionis-1"}
```

### Uppercase

The uppercase form passes; lowercase letters fail.

```python
class UppercaseSchema(Schema):
    value: Field[str, C.Uppercase()]


class UppercaseController(BaseController):
    async def __call__(self, payload: UppercaseSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "ORIONIS-1"}
```

Invalid body (422):

```json
{"value": "Orionis-1"}
```

### StartsWith

app-blog starts with an allowed prefix; blog-app does not.

```python
class StartsWithSchema(Schema):
    value: Field[str, C.StartsWith("orionis-", "app-")]


class StartsWithController(BaseController):
    async def __call__(self, payload: StartsWithSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "app-blog"}
```

Invalid body (422):

```json
{"value": "blog-app"}
```

### EndsWith

The .json extension passes; .yaml is not an allowed suffix.

```python
class EndsWithSchema(Schema):
    value: Field[str, C.EndsWith(".json", ".txt")]


class EndsWithController(BaseController):
    async def __call__(self, payload: EndsWithSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "settings.json"}
```

Invalid body (422):

```json
{"value": "settings.yaml"}
```

### DoesntStartWith

user-report passes; admin-report uses a forbidden prefix.

```python
class DoesntStartWithSchema(Schema):
    value: Field[str, C.DoesntStartWith("admin-", "root-")]


class DoesntStartWithController(BaseController):
    async def __call__(self, payload: DoesntStartWithSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "user-report"}
```

Invalid body (422):

```json
{"value": "admin-report"}
```

### DoesntEndWith

report.pdf passes; run.exe uses a forbidden suffix.

```python
class DoesntEndWithSchema(Schema):
    value: Field[str, C.DoesntEndWith(".exe", ".bat")]


class DoesntEndWithController(BaseController):
    async def __call__(self, payload: DoesntEndWithSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "report.pdf"}
```

Invalid body (422):

```json
{"value": "run.exe"}
```

### Encoding

cafe is representable in ASCII; café is not. The rule does not remove accents.

```python
class EncodingSchema(Schema):
    value: Field[str, C.Encoding("ascii")]


class EncodingController(BaseController):
    async def __call__(self, payload: EncodingSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "cafe"}
```

Invalid body (422):

```json
{"value": "café"}
```


## Formats and identifiers

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `Email` | A `str` matching a local ASCII email format, with a dotted domain, at most 254 characters and a local part up to 64. No DNS lookup. | — | `value: Field[str, C.Email()]` |
| `ActiveUrl` | A `str` with an extractable hostname that resolves through the system resolver. A missing host or resolution failure fails. | — | `value: Field[str, C.ActiveUrl()]` |
| `IpAddress` | A `str` with an address in the selected family. Defaults to IPv4; `6` requires IPv6 and `None` allows either. | `version: int \| None = 4` | `value: Field[str, C.IpAddress(version=None)]` |
| `MacAddress` | A `str` with six hexadecimal pairs separated by `:` or `-`, or three dotted groups of four hexadecimal digits. | — | `value: Field[str, C.MacAddress()]` |
| `Json` | A `str` containing syntactically valid JSON, including scalars. It does not convert the text into an object. | — | `value: Field[str, C.Json()]` |
| `Uuid` | A hexadecimal `str` in hyphenated `8-4-4-4-12` form. A specified version additionally checks its digit and the variant bits. | `version: int \| None = None` | `value: Field[str, C.Uuid(version=4)]` |
| `Ulid` | A 26-character `str` from the case-insensitive Crockford alphabet with a first character no greater than `7`. | — | `value: Field[str, C.Ulid()]` |

`Email` checks a specific email format: display names, quoted local parts and undotted domains are not accepted. It does not verify account existence or mail delivery.

`ActiveUrl` resolves the hostname; it does not send an HTTP request, require an HTTP/HTTPS scheme or check the remote application's response. Its result depends on resolver availability and connectivity. Validation before injection uses its asynchronous implementation, awaiting resolution through the event loop.

`IpAddress` accepts only `version=4`, `6` or `None`. `Uuid` allows selecting only `1`, `3`, `4`, `5`, `6`, `7`, `8` or `None`. With no version, `Uuid()` checks the hyphenated hexadecimal form without requiring specific version or variant bits. `Json`, `Uuid` and `Ulid` preserve a `str`; use the appropriate Python type when a different representation is required.

The expressions used by `Email`, `MacAddress`, `Uuid` and `Integer` use a `$` end anchor that also permits a final Python newline. Do not assume these rules strip whitespace or normalize input; add a separate condition when your format must explicitly forbid that character.

### Email

The dotted domain passes; the undotted domain fails.

```python
class EmailSchema(Schema):
    value: Field[str, C.Email()]


class EmailController(BaseController):
    async def __call__(self, payload: EmailSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "ada@example.com"}
```

Invalid body (422):

```json
{"value": "ada@localhost"}
```

### ActiveUrl

This example requires the system resolver to resolve localhost. The second value has no hostname.

```python
class ActiveUrlSchema(Schema):
    value: Field[str, C.ActiveUrl()]


class ActiveUrlController(BaseController):
    async def __call__(self, payload: ActiveUrlSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "https://localhost/"}
```

Invalid body (422):

```json
{"value": "not-a-url"}
```

### IpAddress

version=None allows IPv6; the second value is not a valid IP address.

```python
class IpAddressSchema(Schema):
    value: Field[str, C.IpAddress(version=None)]


class IpAddressController(BaseController):
    async def __call__(self, payload: IpAddressSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "2001:db8::1"}
```

Invalid body (422):

```json
{"value": "999.1.1.1"}
```

### MacAddress

Six hexadecimal pairs pass; ZZ is not hexadecimal.

```python
class MacAddressSchema(Schema):
    value: Field[str, C.MacAddress()]


class MacAddressController(BaseController):
    async def __call__(self, payload: MacAddressSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "00:1A:2B:3C:4D:5E"}
```

Invalid body (422):

```json
{"value": "00:1A:2B:3C:4D:ZZ"}
```

### Json

The first string contains valid JSON; the second is missing a value.

```python
class JsonSchema(Schema):
    value: Field[str, C.Json()]


class JsonController(BaseController):
    async def __call__(self, payload: JsonSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "{\"active\": true}"}
```

Invalid body (422):

```json
{"value": "{\"active\": }"}
```

### Uuid

The first identifier has version 4; the second has version 1.

```python
class UuidSchema(Schema):
    value: Field[str, C.Uuid(version=4)]


class UuidController(BaseController):
    async def __call__(self, payload: UuidSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "550e8400-e29b-41d4-a716-446655440000"}
```

Invalid body (422):

```json
{"value": "550e8400-e29b-11d4-a716-446655440000"}
```

### Ulid

The first value is in range; the second starts with 8 and exceeds it.

```python
class UlidSchema(Schema):
    value: Field[str, C.Ulid()]


class UlidController(BaseController):
    async def __call__(self, payload: UlidSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "01ARZ3NDEKTSV4RRFFQ69G5FAV"}
```

Invalid body (422):

```json
{"value": "81ARZ3NDEKTSV4RRFFQ69G5FAV"}
```


## Numeric representations

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `Integer` | Accepts an `int` except `bool`, a `float` with no fractional part, or a digit `str` with an optional sign. It does not convert the value. | — | `value: Field[str, C.Integer()]` |
| `DecimalPlaces` | A finite `int`, `float`, `str` or `Decimal` with between `minimum` and `maximum` decimal places. Rejects `bool` and nonnumeric text. | `minimum: int, maximum: int \| None = None` | `value: Field[str, C.DecimalPlaces(2)]` |
| `MaxDigits` | An `int` or `str` whose representation, excluding a leading sign, has at most `maximum` characters. Rejects `bool` and `float`. | `maximum: int` | `value: Field[int, C.MaxDigits(6)]` |

`Integer()` checks a representation rather than converting it to `int`. With a `str` annotation, `"+12"` remains text after validation.

`DecimalPlaces(minimum, maximum=None)` requires exactly `minimum` places when `maximum` is omitted. Bounds must be nonnegative and ordered. Counting uses `Decimal(str(value))`: text such as `"12.50"` retains two places, while a `float` may have already lost trailing zeros before reaching the rule. Infinity and `NaN` fail. Import `Decimal` from `decimal` when using that field type.

`MaxDigits` requires `maximum >= 1`. For text, it **counts characters without verifying they are digits**. Combine `Integer()` and `MaxDigits()` when both conditions are needed:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class ReferenceSchema(Schema):
    reference: Field[str, C.Integer(), C.MaxDigits(6)]
```

### Integer

The signed integer passes and remains a str; decimal text fails.

```python
class IntegerSchema(Schema):
    value: Field[str, C.Integer()]


class IntegerController(BaseController):
    async def __call__(self, payload: IntegerSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "+12"}
```

Invalid body (422):

```json
{"value": "12.5"}
```

### DecimalPlaces

Omitting maximum requires exactly two decimal places.

```python
class DecimalPlacesSchema(Schema):
    value: Field[str, C.DecimalPlaces(2)]


class DecimalPlacesController(BaseController):
    async def __call__(self, payload: DecimalPlacesSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "12.50"}
```

Invalid body (422):

```json
{"value": "12.5"}
```

### MaxDigits

The sign does not count: -1234 passes and 12345 has five digits.

```python
class MaxDigitsSchema(Schema):
    value: Field[int, C.MaxDigits(4)]


class MaxDigitsController(BaseController):
    async def __call__(self, payload: MaxDigitsSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": -1234}
```

Invalid body (422):

```json
{"value": 12345}
```


## Measures and field comparison

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `Between` | A measure within the inclusive bounds; below `minimum` or above `maximum` fails. | `minimum: float, maximum: float` | `value: Field[list[str], C.Between(1, 5)]` |
| `Size` | A measure exactly equal to a nonnegative `size`. | `size: float` | `value: Field[list[str], C.Size(3)]` |
| `GreaterThanOrEqualField` | A measure greater than or equal to the named sibling field's measure. An unmeasurable operand adds no error. | `other_field: str` | `value: Field[int, C.GreaterThanOrEqualField("minimum")]` |
| `LessThanOrEqualField` | A measure less than or equal to the named sibling field's measure. An unmeasurable operand adds no error. | `other_field: str` | `value: Field[int, C.LessThanOrEqualField("maximum")]` |

These four rules share the same measure:

- `int`, `float` and `Decimal`: their numeric value, without taking its absolute value; `bool` has no measure.
- Text and other sized objects: `len(value)`.
- File objects: `size / 1024`, in KiB, when `size` is an integer.

An unmeasurable value adds no failure for these rules; the type annotation remains necessary. `Between` requires `minimum <= maximum` and includes both endpoints. Field comparison references are schema attribute names rather than dotted paths or literal bounds:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class RangeSchema(Schema):
    minimum: int
    maximum: int
    value: Field[
        int,
        C.GreaterThanOrEqualField("minimum"),
        C.LessThanOrEqualField("maximum"),
    ]
```

Comparison uses the measures of both fields; text is compared by length rather than alphabetical order. Separately ensure the referenced fields are required and appropriately typed.

### Between

Two items are between 1 and 3; an empty list is below the minimum.

```python
class BetweenSchema(Schema):
    value: Field[list[str], C.Between(1, 3)]


class BetweenController(BaseController):
    async def __call__(self, payload: BetweenSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": ["api", "web"]}
```

Invalid body (422):

```json
{"value": []}
```

### Size

Exactly two items are required.

```python
class SizeSchema(Schema):
    value: Field[list[str], C.Size(2)]


class SizeController(BaseController):
    async def __call__(self, payload: SizeSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": ["api", "web"]}
```

Invalid body (422):

```json
{"value": ["api"]}
```

### GreaterThanOrEqualField

The value field is compared against the minimum attribute, whose value is 10.

```python
class GreaterThanOrEqualFieldSchema(Schema):
    minimum: int
    value: Field[int, C.GreaterThanOrEqualField("minimum")]


class GreaterThanOrEqualFieldController(BaseController):
    async def __call__(self, payload: GreaterThanOrEqualFieldSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"minimum": 10, "value": 10}
```

Invalid body (422):

```json
{"minimum": 10, "value": 9}
```

### LessThanOrEqualField

The value field is compared against the maximum attribute, whose value is 10.

```python
class LessThanOrEqualFieldSchema(Schema):
    maximum: int
    value: Field[int, C.LessThanOrEqualField("maximum")]


class LessThanOrEqualFieldController(BaseController):
    async def __call__(self, payload: LessThanOrEqualFieldSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"maximum": 10, "value": 10}
```

Invalid body (422):

```json
{"maximum": 10, "value": 11}
```


## Dates, times and timezones

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `TimezoneAware` | A `datetime` or `time` field carrying timezone information. A timezone-naive value fails. | — | `value: Field[datetime, C.TimezoneAware()]` |
| `TimezoneNaive` | A `datetime` or `time` field without timezone information. A timezone-aware value fails. | — | `value: Field[datetime, C.TimezoneNaive()]` |
| `After` | A date strictly after the reference. Equality fails. | `reference: object = None` | `value: Field[date, C.After("2025-01-01")]` |
| `AfterOrEqual` | A date on or after the reference. | `reference: object = None` | `value: Field[date, C.AfterOrEqual("start")]` |
| `Before` | A date strictly before the reference. Equality fails. | `reference: object = None` | `value: Field[date, C.Before("2030-01-01")]` |
| `BeforeOrEqual` | A date on or before the reference. | `reference: object = None` | `value: Field[date, C.BeforeOrEqual("end")]` |
| `DateFormat` | A `str` parseable with at least one format accepted by the `DateTime` facade. If none works, it fails. | `*formats: str` | `value: Field[str, C.DateFormat("YYYY-MM-DD", "DD/MM/YYYY")]` |

`TimezoneAware` and `TimezoneNaive` are mutually exclusive structural constraints for `datetime` and `time`, rather than `date`.

`After`, `AfterOrEqual`, `Before` and `BeforeOrEqual` accept `date`, `datetime` or text parseable by `DateTime`. Their `reference` may be one of those values or a sibling field name. An existing non-`None` sibling attribute takes precedence over parsing the text as a date. `None` compares against the current moment. The strings `now`, `today`, `tomorrow` and `yesterday` are recognized; the last three mean the start of the corresponding day.

These four rules add no error when the field value cannot be interpreted as a date; an unresolvable reference does fail. Prefer a `date`/`datetime` annotation, or add `DateFormat` when retaining text. `DateFormat` uses `DateTime` tokens such as `YYYY-MM-DD`, **not** `strptime` directives such as `%Y-%m-%d`.

```python
from datetime import date

from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class BookingSchema(Schema):
    start: date
    end: Field[date, C.AfterOrEqual("start")]
```

### TimezoneAware

The Z suffix converts to an aware datetime; the other value has no timezone.

```python
class TimezoneAwareSchema(Schema):
    value: Field[datetime, C.TimezoneAware()]


class TimezoneAwareController(BaseController):
    async def __call__(self, payload: TimezoneAwareSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "2030-06-01T12:00:00Z"}
```

Invalid body (422):

```json
{"value": "2030-06-01T12:00:00"}
```

### TimezoneNaive

The timezone-naive datetime passes; the Z suffix fails this constraint.

```python
class TimezoneNaiveSchema(Schema):
    value: Field[datetime, C.TimezoneNaive()]


class TimezoneNaiveController(BaseController):
    async def __call__(self, payload: TimezoneNaiveSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "2030-06-01T12:00:00"}
```

Invalid body (422):

```json
{"value": "2030-06-01T12:00:00Z"}
```

### After

The following day passes; equality fails.

```python
class AfterSchema(Schema):
    value: Field[date, C.After("2025-01-01")]


class AfterController(BaseController):
    async def __call__(self, payload: AfterSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "2025-01-02"}
```

Invalid body (422):

```json
{"value": "2025-01-01"}
```

### AfterOrEqual

Equality with start passes; an earlier day fails.

```python
class AfterOrEqualSchema(Schema):
    start: date
    value: Field[date, C.AfterOrEqual("start")]


class AfterOrEqualController(BaseController):
    async def __call__(self, payload: AfterOrEqualSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"start": "2025-01-01", "value": "2025-01-01"}
```

Invalid body (422):

```json
{"start": "2025-01-01", "value": "2024-12-31"}
```

### Before

The preceding day passes; equality fails.

```python
class BeforeSchema(Schema):
    value: Field[date, C.Before("2030-01-01")]


class BeforeController(BaseController):
    async def __call__(self, payload: BeforeSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "2029-12-31"}
```

Invalid body (422):

```json
{"value": "2030-01-01"}
```

### BeforeOrEqual

Equality with end passes; a later day fails.

```python
class BeforeOrEqualSchema(Schema):
    end: date
    value: Field[date, C.BeforeOrEqual("end")]


class BeforeOrEqualController(BaseController):
    async def __call__(self, payload: BeforeOrEqualSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"end": "2030-01-01", "value": "2030-01-01"}
```

Invalid body (422):

```json
{"end": "2030-01-01", "value": "2030-01-02"}
```

### DateFormat

The second format accepts day/month/year; the hyphens match neither format.

```python
class DateFormatSchema(Schema):
    value: Field[str, C.DateFormat("YYYY-MM-DD", "DD/MM/YYYY")]


class DateFormatController(BaseController):
    async def __call__(self, payload: DateFormatSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "19/10/2026"}
```

Invalid body (422):

```json
{"value": "19-10-2026"}
```


## Acceptance, values and passwords

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `Accepted` | Accepts `True`, integer `1`, or case-insensitive `yes`, `on`, `1`, `true` strings. Whitespace is not stripped. | — | `value: Field[bool, C.Accepted()]` |
| `Different` | The value must differ from every supplied literal, using Python comparison. | `*values: object` | `value: Field[str, C.Different("admin", "root")]` |
| `StrongPassword` | A `str` of at least 8 characters with an ASCII uppercase letter, lowercase letter and digit. Symbols are not required. | — | `value: Field[str, C.StrongPassword()]` |
| `ConfirmPassword` | A value equal to the sibling `other_field`; place it on the confirmation field. A missing sibling adds no error. | `other_field: str = "password"` | `value: Field[str, C.ConfirmPassword()]` |

`Accepted` does not convert accepted representations into booleans. The field type determines which representations can reach the rule. `Different("password")` forbids that literal text rather than referencing a field.

`ConfirmPassword` reads the selected sibling attribute; an empty `other_field` raises a construction error. It neither adds the password field nor encrypts its contents. Declare that field and validate its strength separately:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class PasswordSchema(Schema):
    password: Field[str, C.StrongPassword()]
    password_confirmation: Field[str, C.ConfirmPassword()]
```

### Accepted

Explicit acceptance passes; False fails.

```python
class AcceptedSchema(Schema):
    value: Field[bool, C.Accepted()]


class AcceptedController(BaseController):
    async def __call__(self, payload: AcceptedSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": true}
```

Invalid body (422):

```json
{"value": false}
```

### Different

reader differs from both literal values; admin is forbidden.

```python
class DifferentSchema(Schema):
    value: Field[str, C.Different("admin", "root")]


class DifferentController(BaseController):
    async def __call__(self, payload: DifferentSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200):

```json
{"value": "reader"}
```

Invalid body (422):

```json
{"value": "admin"}
```

### StrongPassword

The first contains uppercase, lowercase and digits; the second has no uppercase letter.

```python
class StrongPasswordSchema(Schema):
    value: Field[str, C.StrongPassword()]


class StrongPasswordController(BaseController):
    async def __call__(self, payload: StrongPasswordSchema) -> dict:
        return {"accepted": True}
```

Valid body (200):

```json
{"value": "Orionis123"}
```

Invalid body (422):

```json
{"value": "orionis123"}
```

### ConfirmPassword

The confirmation must exactly match password.

```python
class ConfirmPasswordSchema(Schema):
    password: str
    value: Field[str, C.ConfirmPassword()]


class ConfirmPasswordController(BaseController):
    async def __call__(self, payload: ConfirmPasswordSchema) -> dict:
        return {"accepted": True}
```

Valid body (200):

```json
{"password": "Orionis123", "value": "Orionis123"}
```

Invalid body (422):

```json
{"password": "Orionis123", "value": "Other123"}
```


## Files and images

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `File` | An object with `read`, `size`, `filename` attributes and an integer `size` greater than zero. Empty files fail. | — | `value: Field[object, C.File()]` |
| `Image` | A file whose `read()` returns bytes with a recognizable PNG, JPEG, GIF, BMP or WebP header. | — | `value: Field[object, C.Image()]` |
| `MimeTypes` | A file whose declared `content_type` matches an allowed MIME type or prefix. | `*mime_types: str` | `value: Field[object, C.MimeTypes("image/png", "image/jpeg")]` |
| `Dimensions` | A recognizable image with nonzero width and height satisfying every configured bound and ratio. | `*; see signature below` | `value: Field[object, C.Dimensions(min_width=100, max_width=1600)]` |

### File objects and the scope of these checks

These rules expect objects exposing `read`, `size` and `filename`; they do not accept a local path or download a URL. `File` checks those attributes and a positive size without reading the contents. `Image`, `Dimensions` and `Encoding` require a synchronous callable `read()` returning `bytes`. Internally they await `asyncio.to_thread(read)` to avoid blocking the event loop during that read; they do not await an `async def read()`. An `OSError` or a result other than `bytes` means content is unavailable. In that case `Image` and `Dimensions` fail; `Encoding` keeps the behavior described in its section. Reading may change the object's position when its implementation does not restore it.

`Image` and `Dimensions` inspect headers without decoding the entire image or depending on Pillow. Recognized formats are PNG, JPEG, GIF, BMP and WebP; a filename extension or correct MIME type alone does not satisfy their check. `MimeTypes` checks only the declared `content_type`: it strips parameters such as `; charset=...`, normalizes case and surrounding whitespace, and accepts a wildcard subtype such as `image/*`. It does not detect MIME from content.

### `Dimensions` parameters

All parameters are optional and keyword-only:

```text
Dimensions(
    *,
    min_width: int | None = None,
    max_width: int | None = None,
    min_height: int | None = None,
    max_height: int | None = None,
    width: int | None = None,
    height: int | None = None,
    ratio: float | str | None = None,
    min_ratio: float | str | None = None,
    max_ratio: float | str | None = None,
    message: str | None = None,
)
```

`width` and `height` require exact pixel dimensions. `min_*` and `max_*` bounds are inclusive. `ratio`, `min_ratio` and `max_ratio` express width/height and accept numbers or strings such as `"3/2"`. An exact ratio allows a difference of `1 / max(width, height)`; ratio bounds compare directly. Every configured condition must pass. A malformed ratio or zero denominator raises `ValueError` when constructing the rule.

Combine the checks needed for an already received object:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class AvatarSchema(Schema):
    avatar: Field[
        object,
        C.File(),
        C.Image(),
        C.MimeTypes("image/png", "image/jpeg"),
        C.Dimensions(min_width=100, max_width=1600, ratio="1/1"),
        C.Between(1, 2048),
    ]
```

`object` preserves the file object and leaves checks to the rules. `Between(1, 2048)` requires between 1 and 2048 KiB, rather than pixels or bytes. This schema does not itself process multipart data: it receives objects supplied by the [request and upload system](/en/http/requests).

### Testing files through a request

Use the same route registration and the controller from each section. The commands below require the named local files and send the multipart field `value`; do not set `Content-Type` manually, because `curl` must generate the multipart boundary. The HTTP parser creates the file object before the schema is validated and injected. The controller returns only a serializable summary, rather than the complete upload.


### File

A nonempty file is accepted; a text field in its place fails.

```python
class FileSchema(Schema):
    value: Field[object, C.File()]


class FileController(BaseController):
    async def __call__(self, payload: FileSchema) -> dict:
        return {"filename": payload.value.filename, "size": payload.value.size}
```

Valid request (200):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@document.pdf;type=application/pdf"
```

Invalid request (422):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=not-a-file"
```


### Image

Use a real PNG as avatar.png and text as notes.txt. The PNG header passes; declaring image/png for text does not make it an image.

```python
class ImageSchema(Schema):
    value: Field[object, C.Image()]


class ImageController(BaseController):
    async def __call__(self, payload: ImageSchema) -> dict:
        return {"filename": payload.value.filename, "size": payload.value.size}
```

Valid request (200):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@avatar.png;type=image/png"
```

Invalid request (422):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@notes.txt;type=image/png"
```


### MimeTypes

The same file passes with declared MIME image/png and fails with text/plain. This rule checks the declared MIME, rather than the bytes.

```python
class MimeTypesSchema(Schema):
    value: Field[object, C.MimeTypes("image/png", "image/jpeg")]


class MimeTypesController(BaseController):
    async def __call__(self, payload: MimeTypesSchema) -> dict:
        return {"filename": payload.value.filename, "size": payload.value.size}
```

Valid request (200):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@avatar.png;type=image/png"
```

Invalid request (422):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@avatar.png;type=text/plain"
```


### Dimensions

Use a real 800×800 image as square-800.png and an 800×400 image as wide-800x400.png. The first meets the dimensions and ratio; the second fails.

```python
class DimensionsSchema(Schema):
    value: Field[object, C.Dimensions(width=800, height=800, ratio="1/1")]


class DimensionsController(BaseController):
    async def __call__(self, payload: DimensionsSchema) -> dict:
        return {"filename": payload.value.filename, "size": payload.value.size}
```

Valid request (200):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@square-800.png;type=image/png"
```

Invalid request (422):

```bash
curl -X POST http://localhost:8000/validation/example -H "Accept: application/json" -F "value=@wide-800x400.png;type=image/png"
```


## Database

| Rule or constraint | Condition and types | Additional parameters | Example field |
| --- | --- | --- | --- |
| `Unique` | The value must not exist in the selected column, excluding the configured `ignore` row. `None` performs no database lookup. | `table: str, column: str; see signature below` | `value: Field[str, C.Unique("users", "email")]` |

### `Unique` parameters and lookup

```text
Unique(
    table: str,
    column: str,
    *,
    ignore: object = None,
    ignore_column: str = "id",
    connection: str | None = None,
    message: str | None = None,
)
```

`table` is the table and `column` is compared for equality. `ignore` excludes rows whose `ignore_column` equals that value; omitting it excludes no row. `connection=None` uses the default connection; select another using its configured name.

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field


class CreateUserSchema(Schema):
    email: Field[str, C.Email(), C.Unique("users", "email")]


class UpdateUserSchema(Schema):
    email: Field[
        str,
        C.Email(),
        C.Unique("users", "email", ignore=42, ignore_column="id"),
    ]
```

Identifier `42` represents the row being updated; the rule uses its configured value rather than automatically reading a route identifier. The application must configure an existing table, column, connection and driver.

The rule performs a read-only ORM query limited to one row. Asynchronous validation before injection awaits the lookup on the current connection and preserves its transaction context. Connection or query exceptions propagate rather than becoming a simple non-unique result. This check neither creates indexes nor replaces a database uniqueness constraint.

### Unique

The controller runs only if the email is absent from `users.email`. Configure the application's connection first and prepare a row with `registered@example.com`; `new@example.com` must be free. This example checks the condition without creating tables or saving the user.

```python
class UniqueSchema(Schema):
    value: Field[str, C.Unique("users", "email")]


class UniqueController(BaseController):
    async def __call__(self, payload: UniqueSchema) -> dict:
        return {"value": payload.value}
```

Valid body (200, available email):

```json
{"value": "new@example.com"}
```

Invalid body (422, existing email):

```json
{"value": "registered@example.com"}
```


## Metadata and aliases are not additional rules

`orionis.schemas.fields` exposes typing aliases: `Field` (`Annotated`), `Choice` (`Literal`), `Nullable` (`Optional`), `AnyOf` (`Union`), `Constant` (`Final`), `Alias` (`TypeAlias`) and `Static` (`ClassVar`). These aliases add no executable rule. Type annotations and defaults are explained in the [schema guide](/en/validation).

Import the following objects from `orionis.schemas.metadata`, rather than `constraints`:

| Metadata | Constructor | Purpose |
| --- | --- | --- |
| `Title` | `Title(value: str)` | A descriptive field title. |
| `Description` | `Description(value: str)` | A field description. |
| `Examples` | `Examples(values: list[object])` | JSON-serializable JSON Schema examples. |
| `ExtraJsonSchema` | `ExtraJsonSchema(data: dict[str, object])` | Additional JSON Schema properties; no executable validation is added. |
| `Extra` | `Extra(data: dict[str, object])` | Additional data associated with the field. |
| `Message` | `Message(text: str)` | A custom type-error message; it does not override every rule message. |

`DocumentMetadata`, also exported by that module, is the metadata base rather than a validation condition. For a rule, use its `message` argument; for declared type errors, use `Message`:

```python
from orionis.schemas import Schema
from orionis.schemas import constraints as C
from orionis.schemas.fields import Field
from orionis.schemas.metadata import Description, Message, Title


class QuantitySchema(Schema):
    quantity: Field[
        int,
        C.GreaterThanOrEqual(1, message="Quantity must be positive."),
        Message("Quantity must be an integer."),
        Title("Quantity"),
        Description("Number of items requested."),
    ]
```

On an `int` field, the conversion layer may normalize exclusive bounds into inclusive ones. For a custom message on a positive integer condition, `GreaterThanOrEqual(1, message=...)` keeps a direct match between the condition and its message.

See [custom validation rules](/en/validation/application-rules) to extend these checks.

For controller schema arguments and responses, see [HTTP integration](/en/validation/controllers-and-http). For MCP, Realtime and other asynchronous flows, see [the other entry points](/en/validation/integrations).
