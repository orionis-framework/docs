---
title: 'Overview'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## What is Reflection?

**Reflective programming** (or simply *reflection*) is the ability of a program to examine, inspect, and modify its own structure and behavior at runtime. Rather than relying exclusively on static definitions written in source code, a reflective system can dynamically discover classes, methods, attributes, types, and dependencies while the application is running.

This capability is essential in modern frameworks, as it enables building highly decoupled systems where components do not need to know about each other in advance. The framework can automatically discover, connect, and inject services based on inspection of the developer's code.

## Why is it Relevant?

Reflection solves concrete problems that arise when developing applications at scale:

- **Automatic dependency injection**: the service container analyzes constructor signatures to determine what dependencies each class needs and resolves them automatically, without manual configuration.
- **Component discovery**: allows the framework to automatically detect commands, controllers, service providers, and other components registered in the system.
- **Runtime validation**: verifies that classes comply with expected contracts (interfaces, abstract classes, protocols) before using them.
- **Dynamic module loading**: inspects and loads Python modules on demand, facilitating plugin and extension architecture.
- **Debugging and diagnostics**: provides tools to examine the internal state of objects, classes, and modules during development.

Without reflection, every connection between components would have to be explicit and manual, resulting in rigid code that is difficult to maintain and resistant to change.

## The Orionis Reflection System

Orionis implements a complete and cohesive reflection system designed specifically for the needs of a modern Python framework. The system is organized into specialized components, each focused on a particular type of analysis:

### System Architecture

| Component | Class | Purpose |
|---|---|---|
| **Inspection** | `Reflection` | Central facade with factory methods and type checks |
| **Abstract Classes** | `ReflectionAbstract` | ABC introspection: abstract methods, contracts, hierarchy |
| **Concrete Classes** | `ReflectionConcrete` | Instantiable class analysis: attributes, methods, properties |
| **Instances** | `ReflectionInstance` | Live object inspection: state, dynamic attributes, mutation |
| **Callables** | `ReflectionCallable` | Function and lambda analysis: signature, parameters, nature |
| **Modules** | `ReflectionModule` | Discovery of classes, functions, constants, and imports |
| **Dependencies** | `ReflectDependencies` | Resolution engine for the IoC container |

### Entry Point

The `Reflection` class acts as the single entry point to the system. It provides factory methods to create specialized reflection objects and verification methods to determine the nature of any Python object:

```python
from orionis.services.introspection.reflection import Reflection

# Create specialized reflection objects
ri = Reflection.instance(my_object)
rc = Reflection.concrete(MyService)
ra = Reflection.abstract(MyContract)
rm = Reflection.module("my_module")
rf = Reflection.callable(my_function)

# Check the nature of an object
Reflection.isConcreteClass(MyService)      # True
Reflection.isAbstract(MyContract)          # True
Reflection.isCoroutineFunction(async_fn)   # True
```

### Role in the Framework

The reflection system is used internally by the core components of Orionis:

- **Service container**: uses `ReflectDependencies` to analyze constructor signatures and resolve dependencies automatically.
- **Service providers**: use `ReflectionConcrete` and `ReflectionAbstract` to validate that bindings comply with expected contracts.
- **Command router**: uses `ReflectionModule` to discover and register available commands.
- **Validation system**: applies `Reflection.isConcreteClass()`, `Reflection.isAbstract()`, and other checks to ensure the integrity of registered components.

### Contracts

Each reflection class implements a contract (abstract interface) that defines its public API. This allows implementations to be substituted without breaking the consuming code:

| Class | Contract |
|---|---|
| `ReflectionAbstract` | `IReflectionAbstract` |
| `ReflectionCallable` | `IReflectionCallable` |
| `ReflectionConcrete` | `IReflectionConcrete` |
| `ReflectionInstance` | `IReflectionInstance` |
| `ReflectionModule` | `IReflectionModule` |
| `ReflectDependencies` | `IReflectDependencies` |

### Integrated Cache

All reflection components implement an internal caching system that stores the results of discovery operations. This ensures that repeated inspections on the same target do not recompute results, significantly optimizing performance in scenarios where the service container resolves multiple dependencies during application startup.

```python
# The first call computes the result
methods = reflection.getMethods()

# Subsequent calls return the cached result
methods = reflection.getMethods()  # instant

# If needed, the cache can be manually cleared
reflection.clearCache()
```