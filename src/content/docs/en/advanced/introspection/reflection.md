---
title: "Inspecting classes, functions, and instances"
description: "Reflection is a static entry point. callable(), abstract(), concrete(), instance(), and module() validate the input and return a specialized wrapper. Predicate helpers mirror…"
editUrl: true
lastUpdated: false
---

## Quick start

```python
from orionis.introspection import Reflection


def greet(name: str, punctuation: str = "!") -> str:
    """Build a greeting."""
    return f"Hello, {name}{punctuation}"


reflected = Reflection.callable(greet)
assert reflected.getName() == "greet"
assert list(reflected.getSignature().parameters) == ["name", "punctuation"]
assert reflected.getDocstring() == "Build a greeting."
print(reflected.getModuleWithCallableName())
```

## Core concepts

### Reflection kinds

`Reflection` is a static entry point. `callable()`, `abstract()`, `concrete()`, `instance()`, and `module()` validate the input and return a specialized wrapper. Predicate helpers mirror `inspect` for functions, methods, classes, modules, generators, coroutines, descriptors, frames, code, tracebacks, and awaitables, with additional Orionis checks for concrete classes, instances, generics, protocols, and typing constructs.

### Member classification

Class and instance wrappers classify public, protected, private, dunder, and “magic” members. Methods are further separated into instance, class, and static methods and into synchronous and asynchronous variants. Python-mangled private names are presented without their class prefix, so callers use the source-level name.

### Dependency signatures

`ReflectDependencies` converts a constructor, method, or callable signature into a `Signature` containing `resolved`, `unresolved`, and declaration-ordered maps of immutable `Argument` values. `self`, `cls`, `*args`, and `**kwargs` are omitted. A parameter with a default is resolved from the default's type; a non-builtin annotation is resolved for container lookup; an unannotated or builtin-only required parameter remains unresolved. `msgspec.Struct` subclasses are marked as schemas.

### Caching

Reflection wrappers cache scans, source, files, annotations, and signatures locally. Dependency analysis uses bounded module-level LRU caches of 1,024 entries. `ModuleInspector.loadClass()` also retains resolved class objects by fully qualified name. Bound-method caching avoids retaining controller instances.

## Examples

### Classify a concrete class

```python
from orionis.introspection import Reflection


class Worker:
    category = "demo"

    def run(self, value: int) -> int:
        return value + 1

    async def stop(self) -> None:
        return None


reflected = Reflection.concrete(Worker)
assert reflected.getClassName() == "Worker"
assert "run" in reflected.getPublicSyncMethods()
assert "stop" in reflected.getPublicAsyncMethods()
assert reflected.getAttribute("category") == "demo"
print(reflected.getMethodSignature("run"))
```

### Reflect an importable module

```python
from orionis.introspection import Reflection

module = Reflection.module("orionis.introspection.reflection")
assert module.hasClass("Reflection")
assert module.getClass("Reflection") is Reflection
assert module.getFile().endswith("reflection.py")
print(sorted(module.getPublicClasses()))
```

## Reference and next steps

[reflection.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/introspection/reflection.py) · [reflection.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/introspection/concretes/reflection.py) · [reflection.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/introspection/instances/reflection.py) · [reflection.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/introspection/callables/reflection.py)

[Return to the module index](/en/advanced/introspection).
