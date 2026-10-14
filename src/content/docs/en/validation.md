---
title: "Schemas and validation"
description: "Use a Schema to describe and validate data arriving at an HTTP route, a Realtime method or an MCP tool. Declare Python field types, attach structural bounds such as minimum…"
editUrl: true
lastUpdated: false
---

## Overview

Use a `Schema` to describe and validate data arriving at an HTTP route, a Realtime method or an MCP tool. Declare Python field types, attach structural bounds such as minimum length and add application rules such as email or password confirmation. A successful validation returns an instance whose fields you can use; invalid input produces errors keyed by field.

Schemas use `msgspec.Struct` internally. `Field` aliases `typing.Annotated`; Orionis compiles its constraints and rule plans when the class is declared.

The package separates declaration from validation. Direct construction trusts already typed Python values under `msgspec` constructor semantics. `orionis.schemas.validator.Schema.validate()` and `validateAsync()` convert untrusted payloads and raise an Orionis `ValidationException` containing field-indexed failures.

## Requirements

- Python 3.14 or newer; schema compilation relies on deferred annotation evaluation.
- Explicit imports from `fields`, `constraints`, `metadata`, `rules`, `validator`, and `exceptions` for advanced features; the package root deliberately exports only `Schema`.
- A booted database connection for `Unique`, and network/file context for rules that perform those checks.

## Module learning path

1. [Declare schemas and convert data](/en/validation/declaring-schemas).
2. [Handle validation errors](/en/validation/validation-and-errors).
3. [Add application rules](/en/validation/application-rules).
4. [Look up constraints and metadata](/en/validation/constraints-and-reference).

Continue with [HTTP](/en/http), [database](/en/database) or [MCP](/en/protocols/mcp).
