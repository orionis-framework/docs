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

## Helpers and Metadata references

Each helper has its own guide covering imports, parameters, returns, examples and access patterns:

| Utility | Main use |
| --- | --- |
| [Collection](/en/utilities/helpers/collection) | Transform, filter, group and serialize in-memory data. |
| [DotDict](/en/utilities/helpers/dot-dict) | Access nested dictionaries through attributes. |
| [Sentinel](/en/utilities/helpers/sentinel) | Distinguish omitted data with `MISSING`. |
| [StdClass](/en/utilities/helpers/std-class) | Group dynamic attributes and export them to a dictionary. |
| [Stringable](/en/utilities/helpers/stringable) | Transform and inspect immutable strings. |
| [Workers](/en/utilities/helpers/workers) | Estimate concurrency from CPU and a memory budget. |
| [Bounded concurrency](/en/utilities/helpers/concurrency) | Run blocking work with explicit admission and cancellation behavior. |
| [FreezeThaw](/en/utilities/helpers/freeze-thaw) | Convert containers between frozen and mutable forms. |
| [PerformanceCounter](/en/utilities/helpers/performance-counter) | Measure synchronous and asynchronous intervals. |
| [Debug](/en/utilities/helpers/debug) | Inspect values in the console or stop a request with an HTML dump. |
| [Metadata](/en/utilities/metadata) | Read the installed framework's identity and version. |

Construct data-bearing types explicitly; class methods, static methods and constants do not require the container. Each reference explains where injection applies. These utilities do not hydrate request data by themselves.

## Module learning path

- [Transforming collections and strings](/en/utilities/workflows/collections-and-strings)
- [Entities and data structures](/en/utilities/workflows/entities-and-structures)
- [Facades, dates, and runtime utilities](/en/utilities/extensions/runtime-utilities)

Continue with: [container](/en/application/container) · [schemas](/en/validation).

## Choose a utility for the task

| Application task | Start with |
|---|---|
| Transform an already loaded list | `Collection` from `orionis.support.types`. |
| Normalize text or create a slug | `Stringable` from `orionis.support.types`. |
| Serialize a result with known fields | A dataclass extending `BaseEntity`. |
| Work with dates and time zones | `DateTime` from `orionis.support.facades`; no container is needed for ordinary operations. |
| Call a configured framework service | Its facade after bootstrap, or its service contract through dependency injection. |
| Inspect values during development | `Debug.dump()` to continue or `Debug.dd()` to stop execution according to the context. |

These are Python utilities you can import into your application; they do not create SQL tables or validate a request automatically. Use [schemas](/en/validation) for external input and [container bindings](/en/application/container) for service dependencies.
