---
title: "Exception handling"
description: "HTTP handlers and console commands already run under Orionis's exception policy. Raise domain or framework exceptions from your application code; the kernel reports and renders…"
editUrl: true
lastUpdated: false
---

HTTP handlers and console commands already run under Orionis's exception policy. Raise domain or framework exceptions from your application code; the kernel reports and renders them through the configured handler. Customize `app/exceptions/handler.py` when a domain error needs a specific response, and register that class before application creation.

Start with the [domain-conflict example](/en/architecture/exception-handling/handling-exceptions), which preserves the native behavior for other errors. Direct `Catch` calls are useful only when you deliberately handle a failure inside an existing kernel context.

## Overview

`Catch` is the package-level service that receives an exception, lazily resolves the application's exception handler, reports the exception, and dispatches rendering according to the active kernel scope. Console contexts use `handleCLI`; HTTP contexts use `handleHTTP`; unknown contexts report only.

`BaseExceptionHandler` supplies the default policy: structured `Throwable` conversion, logging, CLI rendering, known HTTP status mapping, sanitized production 500 responses, and detailed debug responses. Applications can register another handler through the application API as long as it satisfies `IBaseExceptionHandler`.

## Requirements

- Python 3.14 or newer.
- A booted Orionis application/container for `Catch.exception()` or the `Catch` facade.
- An active application scope containing the `kernel` context.
- A request or transport adapter when handling an HTTP exception.
- Logging, console, and default-response services resolvable for the selected handler method.

## Module learning path

- [Reporting and handling exceptions](/en/architecture/exception-handling/handling-exceptions)
- [Error policies and reference](/en/architecture/exception-handling/policies-and-reference)

Continue with: [http](/en/http) · [logging](/en/services/logging).
