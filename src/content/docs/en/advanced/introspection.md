---
title: "Introspection and metaprogramming"
description: "This package wraps Python inspection in purpose-built APIs used throughout Orionis. It can classify a value, reflect a function, abstract or concrete class, instance, or…"
editUrl: true
lastUpdated: false
---

## Overview

This package wraps Python inspection in purpose-built APIs used throughout Orionis. It can classify a value, reflect a function, abstract or concrete class, instance, or importable module, split members by visibility and execution kind, discover Python modules, load classes, and translate callable parameters into dependency metadata.

The public package exports `Reflection`, the specialized reflection classes, `ReflectDependencies`, and `ModuleInspector`. Results that are expensive to compute are memoized; wrappers expose `clearCache()` when the inspected object is changed deliberately.

## Requirements

- Python 3.14 or newer.
- Importable modules and source files for operations that retrieve source or file paths.
- Runtime annotations when dependency injection must resolve a concrete type.
- `msgspec`, installed by Orionis, for recognizing schema dependencies.

## Module learning path

- [Dependencies, discovery, and reference](/en/advanced/introspection/dependencies-and-discovery)
- [Inspecting classes, functions, and instances](/en/advanced/introspection/reflection)

Continue with: [container](/en/architecture/service-container) · [console](/en/console).

## When your application needs this API

Use introspection for an application plugin loader, code-generation tool, or custom component discovery. Ordinary controllers and services normally rely on the [container](/en/architecture/service-container) to resolve dependencies; they do not need to construct reflection signatures themselves.

Start with [reflecting a callable](/en/advanced/introspection/reflection) if you only need names, parameters, or documentation. Continue to [module discovery](/en/advanced/introspection/dependencies-and-discovery) for trusted application directories. File discovery and AST import checks can inspect without executing source; class loading and module reflection import code and should only target trusted modules.
