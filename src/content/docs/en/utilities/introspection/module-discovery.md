---
title: "ModuleInspector"
description: "Discover modules, inspect imports, load classes and locate frozen dataclasses."
editUrl: true
lastUpdated: false
---

`ModuleInspector` provides four operations to discover modules, filter files by imports, and retrieve classes or dataclasses from importable modules. Call each operation directly on the class; no inspector instance is needed. Orionis uses these operations when discovering application configuration and components.

```python
from orionis.introspection import ModuleInspector
```

## Choose an operation

| Operation | Input | Does it execute module code? | Result |
| --- | --- | --- | --- |
| `discoverModules` | `Path` directories. | No. | Module names in `set[str]`. |
| `fileImportsAny` | A `Path` file and import names. | No; it analyzes the AST. | `bool`. |
| `loadClass` | Module and class name, or metadata. | It can execute code when importing. | The class (`type`), without constructing it. |
| `discoverFrozenDataclasses` | Module names. | It can execute code when importing. | Tuples of file, module, name and class. |

Discovering a file does not establish that its module is importable. Loading depends on the process `sys.path` and the files’ actual dependencies.

## Discover files without importing them

<a id="moduleinspector-method-discovermodules"></a>

### `discoverModules`

```python
@staticmethod
def discoverModules(base_path: Path, target_path: Path) -> set[str]: ...
```

`base_path` and `target_path` are required `Path` arguments. Resolve both paths and recursively traverse `target_path`; it must be inside `base_path`, otherwise `ValueError` is raised. Convert files with the exact `.py` suffix into dotted names relative to the base. Return `set[str]`, without guaranteed order.

This does not import files or validate that directory names are Python identifiers. A missing directory yields an empty set. Package initializers are normalized to their package names; an initializer at the base root does not add an empty name. An initializer is not required in every directory.

Skip directories named `__pycache__` or `site-packages`, case-insensitively. Also skip `.env`, `.venv`, `env` and `venv` when they contain `pyvenv.cfg`; a normal `env` directory is still traversed. The same check applies to directories leading from the base to the target. Merely containing the word `env` does not exclude a directory.

```python
from pathlib import Path
from tempfile import TemporaryDirectory
from orionis.introspection import ModuleInspector

with TemporaryDirectory() as directory:
    base = Path(directory)
    package = base / "plugins"
    package.mkdir()
    (package / "catalog.py").write_text("", encoding="utf-8")
    assert ModuleInspector.discoverModules(base, package) == {"plugins.catalog"}
```

## Filter imports using the AST

<a id="moduleinspector-method-fileimportsany"></a>

### `fileImportsAny`

```python
@staticmethod
def fileImportsAny(file_path: Path, target_modules: set[str], *, allow_empty: bool=False) -> bool: ...
```

`file_path: Path` and `target_modules: set[str]` are required; `allow_empty=False` is keyword-only. Return `True` when an `import x` node has an exact name from the set, or a `from x import ...` node has that exact module. Aliases do not change matching. `import app.services.worker` does not match the prefix `app.services`.

The AST walk includes imports inside functions, conditions and `TYPE_CHECKING` blocks: finding them does not establish that they execute. Dynamic `importlib` calls are not inspected, and relative imports are not resolved against their package; the AST `module` text is compared.

Return `False` for an empty target set, a path that is not a file, syntax errors, or non-UTF-8 source. With a nonempty target set, `allow_empty=True` accepts an empty or whitespace-only file; comments alone do not count as empty. Other read errors, such as permission errors, propagate.

```python
from pathlib import Path
from tempfile import TemporaryDirectory
from orionis.introspection import ModuleInspector

with TemporaryDirectory() as directory:
    file = Path(directory) / "plugin.py"
    file.write_text("from orionis.introspection import Reflection\n", encoding="utf-8")
    assert ModuleInspector.fileImportsAny(file, {"orionis.introspection"})
    assert not ModuleInspector.fileImportsAny(file, {"orionis"})

    file.write_text("   \n", encoding="utf-8")
    assert ModuleInspector.fileImportsAny(file, {"orionis"}, allow_empty=True)
    assert not ModuleInspector.fileImportsAny(file, set(), allow_empty=True)
```

## Load a class

<a id="moduleinspector-method-loadclass"></a>

### `loadClass`

```python
@classmethod
def loadClass(cls: type, module_path: str | None=None, class_name: str | None=None, *, metadata: dict[str, str] | None=None) -> type: ...
```

This is a class method. Return the `type` object without calling its constructor. Two forms are supported:

- `module_path` and `class_name`: explicit names, each defaulting to `None` in the signature. Provide both for a valid load.
- Keyword-only `metadata`, with `"module"` and `"class"` keys: used only when both explicit arguments are `None`. A nonempty `dict` or `MappingProxyType` is accepted. This does not fill in a missing explicit argument or combine the formats.

First reuse a class cached by `module_path.class_name`; then consult `sys.modules` and import the module if needed. The class need not be declared there: an imported alias is also valid.

An unknown module raises `ImportError`; an absent name raises `AttributeError`; a non-class value raises `TypeError`. Incomplete metadata or incorrect argument types can trigger import or `getattr` errors; there is no additional validator normalizing every case into one exception. Import-time exceptions other than `ImportError` propagate.

The shared in-memory class cache has no public clearing method or configured size limit. It does not automatically reread a class later replaced in the module. It is independent of reflection wrappers’ `clearCache()`.

```python
from types import MappingProxyType
from orionis.introspection import ModuleInspector
from orionis.support.types import Stringable

klass = ModuleInspector.loadClass("orionis.support.types", "Stringable")
assert klass is Stringable
assert str(klass("hello").upper()) == "HELLO"

metadata = {"module": "orionis.support.types", "class": "Stringable"}
assert ModuleInspector.loadClass(metadata=metadata) is klass
assert ModuleInspector.loadClass(metadata=MappingProxyType(metadata)) is klass
```

## Discover frozen dataclasses

<a id="moduleinspector-method-discoverfrozendataclasses"></a>

### `discoverFrozenDataclasses`

```python
@staticmethod
def discoverFrozenDataclasses(modules: set[str]) -> set[tuple[str, str, str, type[Any]]]: ...
```

`modules: set[str]` is required. Import each module and inspect its namespace for classes whose `__module__` matches that module and whose **own** `__dict__` contains `__dataclass_params__` with `frozen=True`. Reexported dataclasses, mutable dataclasses and subclasses that merely inherit metadata without being decorated again are excluded.

Return a set of `(file_stem, module_path, attribute_name, class_type)` tuples. `file_stem` is the file name without its extension; a module without `__file__` uses `"unknown"`. The third item is the module attribute name, which can be an alias for the same class. Instances are not constructed and ordering is not guaranteed. Empty input returns an empty set.

Any exception during a module’s import or inspection is wrapped in `RuntimeError`, preserving its cause; the operation does not silently continue with the remaining modules.

```python
from orionis.introspection import ModuleInspector

found = ModuleInspector.discoverFrozenDataclasses({
    "orionis.introspection.dependencies.entities.argument",
})
assert any(name == "Argument" for _, _, name, _ in found)
assert ModuleInspector.discoverFrozenDataclasses(set()) == set()
```

## Complete example: discover and load a plugin

This example creates an isolated temporary module, discovers its name without executing it, filters its imports, loads a class and discovers its frozen configuration. It adds the temporary root to `sys.path` only while importing, then removes it. The project is not modified.

```python
import importlib
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from uuid import uuid4
from orionis.introspection import ModuleInspector

source = """from dataclasses import dataclass

@dataclass(frozen=True)
class PluginSettings:
    name: str = "catalog"

class CatalogPlugin:
    def run(self) -> str:
        return "catalog ready"
"""

with TemporaryDirectory() as directory:
    base = Path(directory)
    package_name = f"orionis_demo_{uuid4().hex}"
    package = base / package_name
    package.mkdir()
    file = package / "catalog.py"
    file.write_text(source, encoding="utf-8")

    modules = ModuleInspector.discoverModules(base, package)
    assert modules == {f"{package_name}.catalog"}
    assert ModuleInspector.fileImportsAny(file, {"dataclasses"})

    sys.path.insert(0, str(base))
    importlib.invalidate_caches()
    try:
        plugin_type = ModuleInspector.loadClass(
            f"{package_name}.catalog",
            "CatalogPlugin",
        )
        assert plugin_type().run() == "catalog ready"

        frozen = ModuleInspector.discoverFrozenDataclasses(modules)
        for file_stem, module_name, class_name, settings_type in frozen:
            assert file_stem == "catalog"
            assert class_name == "PluginSettings"
            assert settings_type().name == "catalog"
    finally:
        sys.path.remove(str(base))
        for module_name in tuple(sys.modules):
            if module_name == package_name or module_name.startswith(package_name + "."):
                sys.modules.pop(module_name, None)
```

In a real project, the application root must already be importable. Explicitly sort sets with `sorted()` if you need reproducible registration; the utility does not assign plugin priority. A class returned by `loadClass()` still needs registration or construction according to the application’s contract.

## Access and dependency injection

`ModuleInspector` needs no construction data: its methods are static or class methods. It can be a concrete parameter of a container-resolved component, but creating another instance does not isolate the `loadClass` cache. Direct use is usually sufficient for initialization work. There is no exported `IModuleInspector` interface or mechanism for injecting module names.

```python
from orionis.introspection import ModuleInspector
from orionis.support.types import Stringable


class ExtensionLoader:
    def __init__(self, inspector: ModuleInspector) -> None:
        self.inspector = inspector

    def string_type(self) -> type:
        return self.inspector.loadClass("orionis.support.types", "Stringable")


assert ExtensionLoader(ModuleInspector()).string_type() is Stringable
```

[Inspect an imported module](/en/utilities/introspection/modules) · [Application and container](/en/application).
