---
title: "Dependencies and signatures"
description: "ReflectDependencies, Argument and Signature: parameter classification, default values, schemas and metadata for dependency injection."
editUrl: true
lastUpdated: false
---

`ReflectDependencies` turns the parameters of a constructor, method or callable into `Argument` metadata, grouped in a `Signature`. Use it to analyze handlers, build diagnostics or understand how Orionis prepares an invocation.

Reflection **does not instantiate services, execute the callable or validate its payload**. The `resolved` flag describes a parameter's classification; it does not guarantee that the container can construct its value. For routine injection, see [Application and Container](/en/application/container). File discovery and class loading have their own guide in [Module discovery](/en/utilities/introspection/module-discovery).

## Imports and first inspection

`ReflectDependencies` is exported from `orionis.introspection`. Import the entities and contract from their defining modules:

```python
from orionis.introspection import ReflectDependencies
from orionis.introspection.dependencies.contracts.reflection import IReflectDependencies
from orionis.introspection.dependencies.entities.argument import Argument
from orionis.introspection.dependencies.entities.signature import Signature


class Repository:
    pass


def handler(repository: Repository, user_id: int, *, limit=25):
    return repository, user_id, limit


signature = ReflectDependencies(handler).callableSignature()
assert isinstance(signature, Signature)
assert isinstance(signature.ordered["repository"], Argument)
assert list(signature.resolved) == ["repository", "limit"]
assert list(signature.unresolved) == ["user_id"]
assert list(signature.ordered) == ["repository", "user_id", "limit"]
assert signature.ordered["limit"].is_keyword_only
assert isinstance(ReflectDependencies(handler), IReflectDependencies)
```

All these inspections are synchronous, including when the target is an `async def` function: reading its signature neither executes it nor requires `await`.

## Parameter classification

Analysis preserves declaration order and applies these rules in sequence:

| Parameter | Classification and metadata |
|---|---|
| Named `self` or `cls`; `*args`; `**kwargs` | Omitted. The names `self` and `cls` are also omitted in ordinary functions. |
| No annotation and no default | `resolved=False`; metadata describes `type(typing.Any)`, not an instance or the `typing.Any` object. |
| Has a default | `resolved=True`; `type`, module and class name come from **`type(default)`**, even when another type was annotated. |
| Type from module `builtins`, without a default | `resolved=False`; for example `int`, `str` or `list[int]`. |
| Other annotation without a default | `resolved=True`; its metadata is preserved. This includes application classes and typing constructs that may not be instantiable. |

`is_keyword_only=True` identifies only parameters declared after `*`. Parameters before `/` and those accepting either position or name are grouped together with `False`; `Argument` preserves no further distinction between them.

```python
from orionis.introspection import ReflectDependencies


def options(required: int, /, ordinary: str, *items, count: str = 5, **extras):
    return required, ordinary, items, count, extras


signature = ReflectDependencies(options).callableSignature()
assert list(signature.ordered) == ["required", "ordinary", "count"]
assert list(signature.getPositionalOnly()) == ["required", "ordinary"]
assert list(signature.getKeywordOnly()) == ["count"]
assert signature.resolved["count"].type is int
assert signature.resolved["count"].default == 5
```

The `count: str` annotation does not convert `5` to text. Inspection describes the existing default value.

### Forward references, generics and schemas

For a string annotation **without a default**, the resolver attempts evaluation in the callable's module globals. If resolving all hints at once fails, it tries each reference separately. It replaces the string only when the result is a class object (`isinstance(result, type)`). It does not have arbitrary local variables from a function that has already returned.

A reference that remains a string uses `module_name="typing"`, the annotation text as `class_name`, and `type=str`. It is marked `resolved=True`, although the container will reject it unless an explicit value is supplied. Parameterized aliases and unions receive no special injection selection: an actual `list[int]` stays unresolved because its module is builtin; an actual `int | None` is marked resolved from its metadata, but this does not automatically select an alternative dependency.

`is_schema=True` is set only when the annotation, without a default, is a class derived from `msgspec.Struct`; this includes Orionis schemas. It does not perform validation or inspect field constraints. An annotated parameter with a default follows the default-value branch and keeps `is_schema=False`.

```python
import inspect
from orionis.introspection import ReflectDependencies
from orionis.schemas import Schema


class Repository:
    pass


class CreateUser(Schema):
    name: str


def action(
    payload: CreateUser,
    repository: "Repository",
    unknown: "UnavailableService",
    rows: list[int],
    optional: Repository = None,
):
    return payload, repository, unknown, rows, optional


signature = ReflectDependencies(action).callableSignature()
assert signature.ordered["payload"].is_schema
assert signature.ordered["repository"].type is Repository
assert signature.ordered["repository"].default is inspect.Parameter.empty
assert signature.ordered["unknown"].type is str
assert signature.ordered["unknown"].module_name == "typing"
assert signature.ordered["unknown"].resolved
assert not signature.ordered["rows"].resolved
assert signature.ordered["optional"].type is type(None)
assert signature.ordered["optional"].default is None
assert not signature.ordered["optional"].is_schema
```

**Return annotations** are not part of `Signature`: this component performs no response inference or conversion.

## ReflectDependencies API

<a id="reflectdependencies-method-init"></a>
### Construction

```text
ReflectDependencies(target: Any | None = None) -> None
```

Stores `target` for later operations without validating or inspecting it yet. It can be a class, instance, function or method depending on the selected operation. The `None` default allows constructing the wrapper, but does not provide a useful callable target.

<a id="reflectdependencies-method-constructorsignature"></a>
### constructorSignature

```text
constructorSignature(self) -> Signature
```

Inspects `target.__init__` without running the constructor. To describe a class without creating an instance, pass the class itself:

```python
from orionis.introspection import ReflectDependencies


class Report:
    def __init__(self, title: str, *, attempts=3):
        self.title = title
        self.attempts = attempts


signature = ReflectDependencies(Report).constructorSignature()
assert list(signature.ordered) == ["title", "attempts"]
assert not signature.ordered["title"].resolved
assert signature.ordered["attempts"].default == 3
```

Propagates `AttributeError` if `__init__` cannot be retrieved; inspection failures become `ValueError`. A callable may have a generic `__init__` that does not represent its call: use `callableSignature()` for functions.

<a id="reflectdependencies-method-methodsignature"></a>
### methodSignature

```text
methodSignature(self, method_name: str) -> Signature
```

Retrieves the attribute with `getattr(target, method_name)` and inspects its signature. A missing name raises **`AttributeError`**, rather than a custom reflection exception. An uninspectable attribute raises `ValueError`; a non-string name may raise `TypeError` in `getattr`.

Bound methods omit their first parameter according to Python binding, even if the receiver is not named `self`. Class methods and static methods preserve their explicit parameters. For an ordinary method accessed on the class, a receiver named something other than `self` or `cls` stays in the signature.

```python
from orionis.introspection import ReflectDependencies


class Actions:
    def handle(receiver, item: int, *, limit=10):
        return item, limit

    @classmethod
    def byClass(cls, page=1):
        return page

    @staticmethod
    def byStatic(page=1):
        return page


bound = ReflectDependencies(Actions()).methodSignature("handle")
unbound = ReflectDependencies(Actions).methodSignature("handle")
assert list(bound.ordered) == ["item", "limit"]
assert list(unbound.ordered) == ["receiver", "item", "limit"]
for target in (Actions, Actions()):
    reflection = ReflectDependencies(target)
    assert list(reflection.methodSignature("byClass").ordered) == ["page"]
    assert list(reflection.methodSignature("byStatic").ordered) == ["page"]
```

<a id="reflectdependencies-method-callablesignature"></a>
### callableSignature

```text
callableSignature(self) -> Signature
```

Checks `callable(target)` and analyzes the call signature exposed by Python. Accepts functions, bound methods, classes and callable instances when their signatures can be inspected and the target can be used as a cache key. For a class, it inspects its call; this is not equivalent to explicitly reading `__init__` for every metaclass.

```python
from orionis.introspection import ReflectDependencies


async def fetch(item_id: int, *, timeout=5):
    return item_id, timeout


signature = ReflectDependencies(fetch).callableSignature()
assert signature.ordered["item_id"].type is int
assert signature.ordered["timeout"].default == 5
```

Raises `TypeError` for non-callable targets and for unhashable targets when accessing the cache. If `inspect.signature` cannot describe the signature, raises `ValueError` with the original cause. Inspecting `min`, for example, fails because it exposes no inspectable signature in this runtime. Decorators exposing `__wrapped__` and custom `__signature__` values follow `inspect.signature` behavior.

### Contract and caching

`IReflectDependencies` declares the three operations above as abstract methods. It cannot be instantiated and is not registered as a native service that automatically selects a target. Direct `ReflectDependencies(target)` construction makes the inspected target explicit.

Python signatures and dependency metadata use two **1,024-entry** LRU caches local to the process. Inspecting the same target returns the **same `Signature` object**, even across different wrapper instances. Bound methods use the underlying function and binding mode as the key; those cached methods do not retain their receivers.

`ReflectDependencies` has no public `clearCache()`. Changing `__annotations__`, defaults or `__signature__` on the same function after inspection can leave stale metadata. For a different definition, use a new function object or restart the process. Inspection failures are not stored as successful results.

```python
from orionis.introspection import ReflectDependencies


def cached(limit=25):
    return limit


first = ReflectDependencies(cached).callableSignature()
second = ReflectDependencies(cached).callableSignature()
assert first is second
```

## Argument entity

`Argument` is a `frozen=True`, `slots=True`, `kw_only=True` dataclass. Its nine fields are keyword arguments to the constructor; the first six are required:

```text
Argument(
    *,
    name: str,
    resolved: bool,
    module_name: str,
    class_name: str,
    type: type[Any],
    full_class_path: str,
    is_keyword_only: bool = False,
    is_schema: bool = False,
    default: Any | None = None,
) -> None
```

| Field | Purpose and value |
|---|---|
| <a id="argument-field-name"></a>`name` | Parameter name. Used as the key in all three groups. |
| <a id="argument-field-resolved"></a>`resolved` | Analyzer classification; does not represent a constructed instance. |
| <a id="argument-field-module-name"></a>`module_name` | Module of the type or default value. Unresolved string references use `typing`. |
| <a id="argument-field-class-name"></a>`class_name` | Type name; a pending reference preserves the annotation text. |
| <a id="argument-field-type"></a>`type` | Annotated object or type of the default. The field annotation does not prevent it from holding a typing alias. |
| <a id="argument-field-full-class-path"></a>`full_class_path` | `module_name + "." + class_name`; identifies metadata without importing or loading that path. |
| <a id="argument-field-is-keyword-only"></a>`is_keyword_only` | `False` by default; `True` for parameters that require a keyword. |
| <a id="argument-field-is-schema"></a>`is_schema` | `False` by default; identifies an annotated `msgspec.Struct` class without a default. |
| <a id="argument-field-default"></a>`default` | Defaults to `None` when constructing the entity. Reflection uses the actual default when present, `inspect.Parameter.empty` for annotated non-builtin types without a default, and `None` for unresolved parameters. **`None` alone does not indicate whether a parameter is optional.** |

<a id="argument-method-post-init"></a>
### Validation and mutability

```text
__post_init__(self) -> None
```

Runs automatically when constructing the entity. Checks that `module_name`, `class_name` and `full_class_path` are strings, raising `TypeError` otherwise. Rejects `type=None` together with `default=None` using `ValueError`. It does not exhaustively validate `name`, flags, correspondence between paths and classes or all typing objects.

```python
from dataclasses import FrozenInstanceError
from orionis.introspection.dependencies.entities.argument import Argument


argument = Argument(
    name="limit",
    resolved=True,
    module_name="builtins",
    class_name="int",
    type=int,
    full_class_path="builtins.int",
    default=25,
)
assert argument.default == 25
assert argument.is_keyword_only is False
assert argument.is_schema is False
try:
    argument.name = "other"
except FrozenInstanceError:
    pass
else:
    raise AssertionError("Argument must reject field reassignment")
```

The dataclass generates representation and field-based equality; hashing works only if all participating values are hashable. A list default does not become immutable inside an `Argument`. The entity does not inherit `BaseEntity`: it has no `toDict()` or `getFields()` methods of its own.

<a id="argument-generated-protocols"></a>
### Argument copies and generated protocols

`dataclasses.replace()` and `copy.replace()` construct another `Argument` with changed fields and run its validation again. The dataclass generates `__replace__`; because it is frozen and uses slots, it also generates `__getstate__` and `__setstate__` to preserve fields during copying or serialization. These are standard Python protocols, separate from Orionis-implemented methods.

Replacement and `copy.copy()` are shallow: they retain the mutable default. `copy.deepcopy()` copies its contents. This example uses a builtin type and a serializable default to also verify `pickle`:

```python
import copy
import pickle
from dataclasses import replace
from orionis.introspection.dependencies.entities.argument import Argument


original = Argument(
    name="tags",
    resolved=True,
    module_name="builtins",
    class_name="list",
    type=list,
    full_class_path="builtins.list",
    default=["reports"],
)
renamed = replace(original, name="labels")
replaced = copy.replace(original, name="categories")
assert renamed.name == "labels" and replaced.name == "categories"
assert renamed.default is original.default
assert copy.copy(original).default is original.default
assert copy.deepcopy(original).default is not original.default
restored = pickle.loads(pickle.dumps(original))
assert restored == original and restored is not original
assert restored.default is not original.default
```

Serialization depends on field values: local classes, non-serializable functions or other defaults may prevent `pickle` from working.

Construction errors can be handled without inspecting a callable:

```python
from orionis.introspection.dependencies.entities.argument import Argument
from orionis.introspection.dependencies.entities.signature import Signature


try:
    Argument(
        name="invalid",
        resolved=False,
        module_name="builtins",
        class_name="int",
        type=None,
        full_class_path="builtins.int",
    )
except ValueError:
    pass
else:
    raise AssertionError("A missing type and default must fail")

try:
    Signature(resolved=[], unresolved={}, ordered={})
except TypeError:
    pass
else:
    raise AssertionError("Signature groups must be dictionaries")
```

## Signature entity

`Signature` is a frozen dataclass with keyword arguments. It stores three required dictionaries of `Argument` objects:

```text
Signature(
    *,
    resolved: dict[str, Argument],
    unresolved: dict[str, Argument],
    ordered: dict[str, Argument],
) -> None
```

| Field | Contents |
|---|---|
| <a id="signature-field-resolved"></a>`resolved` | Parameters with defaults or annotations classified as non-builtin. |
| <a id="signature-field-unresolved"></a>`unresolved` | Required builtin parameters or those without an annotation/default. |
| <a id="signature-field-ordered"></a>`ordered` | All retained parameters in declaration order. |

Reflection puts the same `Argument` instances in `ordered` and their corresponding group. When constructing `Signature` manually, the developer provides that consistency.

<a id="signature-generated-protocols"></a>
### Signature copies and generated protocols

Python generates construction, representation, equality, frozen-field protection and `__replace__`. An ordinary `Signature` contains dictionaries, so it is not hashable even though its dataclass generates `__hash__`. `dataclasses.replace()` and `copy.replace()` create another validated entity, but share maps that are not replaced; they do not create an immutable snapshot.

```python
import copy
import pickle
from dataclasses import replace
from orionis.introspection.dependencies.entities.signature import Signature


original = Signature(resolved={}, unresolved={}, ordered={})
assert replace(original).ordered is original.ordered
assert copy.replace(original).resolved is original.resolved
assert copy.copy(original).unresolved is original.unresolved
assert copy.deepcopy(original).ordered is not original.ordered
restored = pickle.loads(pickle.dumps(original))
assert restored == original and restored.ordered is not original.ordered
try:
    hash(original)
except TypeError:
    pass
else:
    raise AssertionError("Dictionary-backed signatures are not hashable")
```

<a id="signature-method-post-init"></a>
### Construction validation

```text
__post_init__(self) -> None
```

Checks that each group is a `dict`, raising `TypeError` otherwise. It does not validate individual entry types or consistency between groups. Fields cannot be reassigned, but **the dictionaries remain mutable**. Changing a cached signature affects later inspections of the same target: use the copying methods when you need to edit a map.

### Predicates

<a id="signature-method-hasparameters"></a>
**`hasParameters(self) -> bool`** returns `bool(ordered)`.

<a id="signature-method-noargumentsrequired"></a>
**`noArgumentsRequired(self) -> bool`** returns `not bool(ordered)`. Its name does not mean “all parameters have defaults”: it returns `False` even when every retained parameter is optional.

<a id="signature-method-hasunresolvedarguments"></a>
**`hasUnresolvedArguments(self) -> bool`** returns `bool(unresolved)`.

```python
from orionis.introspection import ReflectDependencies


def empty():
    return None


def defaults(limit=25):
    return limit


first = ReflectDependencies(empty).callableSignature()
second = ReflectDependencies(defaults).callableSignature()
assert not first.hasParameters()
assert first.noArgumentsRequired()
assert not first.hasUnresolvedArguments()
assert second.hasParameters()
assert not second.noArgumentsRequired()
assert not second.hasUnresolvedArguments()
```

### Accessing parameters

<a id="signature-method-getresolved"></a>
**`getResolved(self) -> dict[str, Argument]`** returns the original `resolved` dictionary without copying.

<a id="signature-method-getunresolved"></a>
**`getUnresolved(self) -> dict[str, Argument]`** returns `unresolved` by identity.

<a id="signature-method-getallordered"></a>
**`getAllOrdered(self) -> dict[str, Argument]`** returns `ordered` by identity, preserving declaration order.

<a id="signature-method-getpositionalonly"></a>
**`getPositionalOnly(self) -> dict[str, Argument]`** creates a new map with `is_keyword_only=False`. It includes both strictly positional and positional-or-keyword parameters; it is not equivalent to the `inspect` kind `POSITIONAL_ONLY`.

<a id="signature-method-getkeywordonly"></a>
**`getKeywordOnly(self) -> dict[str, Argument]`** creates a new map with `is_keyword_only=True`.

```python
from orionis.introspection import ReflectDependencies


def search(term: str, *, limit=25):
    return term, limit


signature = ReflectDependencies(search).callableSignature()
assert signature.getResolved() is signature.resolved
assert signature.getUnresolved() is signature.unresolved
assert signature.getAllOrdered() is signature.ordered
assert list(signature.getPositionalOnly()) == ["term"]
assert list(signature.getKeywordOnly()) == ["limit"]
assert signature.getKeywordOnly()["limit"] is signature.ordered["limit"]
```

### Copies and iteration

<a id="signature-method-todict"></a>
**`toDict(self) -> dict[str, Argument]`** shallow-copies `ordered`. Overrides `BaseEntity.toDict`: it does not recursively serialize `Argument` objects or produce JSON.

<a id="signature-method-resolvedtodict"></a>
**`resolvedToDict(self) -> dict[str, Argument]`** shallow-copies `resolved`.

<a id="signature-method-unresolvedtodict"></a>
**`unresolvedToDict(self) -> dict[str, Argument]`** shallow-copies `unresolved`.

<a id="signature-method-arguments"></a>
**`arguments(self) -> dict_items[str, Argument]`** returns the live `ordered.items()` view, iterable as `(name, Argument)` pairs in declaration order.

```python
from orionis.introspection import ReflectDependencies


def search(term: str, *, limit=25):
    return term, limit


signature = ReflectDependencies(search).callableSignature()
all_copy = signature.toDict()
resolved_copy = signature.resolvedToDict()
unresolved_copy = signature.unresolvedToDict()
assert all_copy is not signature.ordered
assert resolved_copy is not signature.resolved
assert unresolved_copy is not signature.unresolved
assert all_copy["limit"] is signature.ordered["limit"]
all_copy.pop("term")
assert "term" in signature.ordered
assert [(name, argument.resolved) for name, argument in signature.arguments()] == [
    ("term", False),
    ("limit", True),
]
```

<a id="signature-method-getfields"></a>
### Inherited getFields

```text
getFields(self) -> list[dict[str, Any]]
```

Inherited from `BaseEntity`. Describes **the dataclass fields of `Signature`**, not the callable's parameters. Each entry contains `name`, `types`, `default` and `metadata`. Use `arguments()` to iterate parameters.

```python
from orionis.introspection.dependencies.entities.signature import Signature


signature = Signature(resolved={}, unresolved={}, ordered={})
fields = signature.getFields()
assert [field["name"] for field in fields] == ["resolved", "unresolved", "ordered"]
assert all(set(field) == {"name", "types", "default", "metadata"} for field in fields)
```

## Dependency injection

These utilities do not require application startup. `Argument` and `Signature` are data records constructed with explicit values. `ReflectDependencies` needs a target for each inspection; injecting its contract does not automatically provide a target.

A component that needs inspection can receive an application service that constructs the reflector for its selected target. This example combines constructor and method injection with the container's real APIs:

```python
from orionis.container.container import Container
from orionis.introspection import ReflectDependencies
from orionis.introspection.dependencies.entities.signature import Signature
from orionis.test import TestCase


class SignatureReader:
    def inspect(self, target) -> Signature:
        return ReflectDependencies(target).callableSignature()


class ImportService:
    def __init__(self, reader: SignatureReader):
        self.reader = reader

    def describe(self, reader: SignatureReader, *, target):
        return reader.inspect(target)


def importUsers(source: str, *, batch_size=100):
    return source, batch_size


class SignatureInjectionTest(TestCase):
    async def testConstructorAndMethodInjection(self):
        container = Container()
        service = await container.make(ImportService)
        self.assertIsInstance(service.reader, SignatureReader)
        signature = await container.call(service, "describe", target=importUsers)
        self.assertEqual(list(signature.ordered), ["source", "batch_size"])
```

Save this case in the application's [Testing](/en/testing) directory. The container constructs `SignatureReader` as a concrete dependency; reflection only describes `importUsers`. The function is not executed during inspection.

### Relationship to actual resolution

The container prepares plans using these `Argument` objects. When invoking a component it uses explicit values first, checks dependency registrations, and constructs services or applies defaults as appropriate. For a schema parameter, its resolution path may read the active HTTP request's payload and validate it; **that reading and validation belong to the container and schema system**, rather than `ReflectDependencies`.

The container's constructor path also resolves some class-local references. A reference that remains pending in this reflector does not necessarily describe the final result of every framework invocation path. Likewise, `resolved=True` does not turn a union or arbitrary typing alias into a constructible service.

See [Schemas and validation](/en/validation) for schema usage in supported contexts, and [Application and Container](/en/application/container) for registration, scopes and component invocation.
