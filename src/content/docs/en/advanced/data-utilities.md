---
title: "Support types and utilities"
description: "orionis.support is Orionis's shared utility layer. It contains the facades used to reach framework services, value-oriented helper types, entity serialization, immutable…"
editUrl: true
lastUpdated: false
---

## Overview

`orionis.support` is Orionis's shared utility layer. It contains the facades used to reach framework services, value-oriented helper types, entity serialization, immutable structure helpers, reusable metaclasses, exception formatting, timing, worker sizing, and the built-in inspirational quote provider.

The package deliberately has two levels of API. `orionis.support.facades` and `orionis.support.types` provide curated imports; lower-level helpers are imported from their defining modules. The root `orionis.support` package itself does not re-export these objects.

## Requirements

- Python 3.14 or newer.
- The Orionis runtime and its declared dependencies. This module directly uses `pendulum`, `dotty-dict`, and `psutil`.
- A bootstrapped Orionis application before calling service-backed facades. `DateTime` is a standalone class and does not require the container for ordinary date operations.

## Module learning path

- [Transforming collections and strings](/en/advanced/data-utilities/collections-and-strings)
- [Entities and data structures](/en/advanced/data-utilities/entities-and-structures)
- [Facades, dates, and runtime utilities](/en/advanced/data-utilities/facades-and-runtime-utilities)

Continue with: [container](/en/architecture/service-container) · [schemas](/en/validation).

## Choose a utility for the task

| Application task | Start with |
|---|---|
| Transform an already loaded list | `Collection` from `orionis.support.types`. |
| Normalize text or create a slug | `Stringable` from `orionis.support.types`. |
| Serialize a result with known fields | A dataclass extending `BaseEntity`. |
| Work with dates and time zones | `DateTime` from `orionis.support.facades`; no container is needed for ordinary operations. |
| Call a configured framework service | Its facade after bootstrap, or its service contract through dependency injection. |

These are Python utilities you can import into your application; they do not create SQL tables or validate a request automatically. Use [schemas](/en/validation) for external input and [container bindings](/en/architecture/service-container) for service dependencies.
