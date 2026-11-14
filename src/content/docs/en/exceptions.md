---
title: "Exception handling"
description: "Configure app.withExceptionHandler, understand the failure pipeline, and define how errors are reported and presented across Orionis contexts."
editUrl: true
lastUpdated: false
---

## Overview

Framework execution boundaries deliver exceptions to one application handler after successful startup. `handleFailure(exception, context)` receives the original exception once per incident and returns a `FailureHandling` plan or `None`. `handleResult(value, context)` receives declared failed outcomes without inventing exceptions; its default implementation returns `None`.

`BaseExceptionHandler` builds deferred logging and presentation. The runtime completes logging under its reporting safeguards; `Catch.exception()` requests HTTP or CLI presentation from the same plan without calling the handler again. The defaults preserve `Throwable` and native traceback logging, known HTTP status mapping, safe production 500 responses, debug detail, and CLI output.

Failures before startup are outside this coverage. External code that consumes errors still needs an explicit owner to notify the runtime. Observation remains available during shutdown; once reporting resources start closing, `context.reporting_allowed` is false and the base plan stops scheduling logger calls.

## Requirements

- Python 3.14 or newer. Automatic observation requires a successfully started Orionis runtime; explicit `Catch.exception()` handling requires a created application and the scope below.
- An active scope containing `kernel` for `Catch.exception()`; `capture()` does not require a scope.
- A request or transport adapter for HTTP presentation.
- Application services for logging, console output, and default responses.
- Custom handlers implementing the two-hook contract; overrides must return the inherited plan to preserve default effects.

Customize `handleFailure` for exceptions and `handleResult` for declared failed results. Return the selected plan so the runtime can complete its effects.

## Module learning path

- [Handling exceptions](/en/exceptions/handling-exceptions)
- [Error policies and reference](/en/exceptions/policies-and-reference)
- [Capture after startup](/en/exceptions/handling-exceptions#capture-after-startup)
- [Define a custom handler](/en/exceptions/policies-and-reference#define-a-custom-handler)

Continue with: [http](/en/http) · [logging](/en/logging).

## Compiled configuration and running processes

Register `app.withExceptionHandler(ExceptionHandler)` before `create()`. Once configuration is locked, an ordinary registration change raises `RuntimeError`. With compiled configuration, selection comes from cached bootstrap metadata; calling the registration method does not replace that selection.

The application caches both the handler class and its shared instance. Restart running processes after changing registration or handler code. Keep `app` and `bootstrap` in the compilation invalidation paths. When optimization artifacts must be rebuilt, `orionis optimize:clear` or `python -B reactor optimize:clear` clears the project's compiled caches and build artifacts; it does not configure the handler itself.
