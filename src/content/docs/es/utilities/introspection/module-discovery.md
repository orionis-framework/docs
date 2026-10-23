---
title: "ModuleInspector"
description: "Descubrir módulos, analizar imports, cargar clases y localizar dataclasses frozen."
editUrl: true
lastUpdated: false
---

`ModuleInspector` ofrece cuatro operaciones para descubrir módulos, filtrar archivos por imports y recuperar clases o dataclasses de módulos importables. Todas se invocan directamente desde la clase; no necesitan crear un inspector. Orionis utiliza estas operaciones en el descubrimiento de configuración y componentes de la aplicación.

```python
from orionis.introspection import ModuleInspector
```

## Elegir la operación

| Operación | Entrada | ¿Ejecuta el módulo? | Resultado |
| --- | --- | --- | --- |
| `discoverModules` | Directorios `Path`. | No. | Nombres de módulos en un `set[str]`. |
| `fileImportsAny` | Archivo `Path` y nombres de imports. | No; analiza su AST. | `bool`. |
| `loadClass` | Módulo y nombre de clase, o metadata. | Puede ejecutarlo al importar. | La clase (`type`), sin instanciar. |
| `discoverFrozenDataclasses` | Nombres de módulos. | Puede ejecutarlos al importar. | Tuplas de archivo, módulo, nombre y clase. |

No conviertas el resultado del descubrimiento de archivos en una afirmación de que cada módulo se puede importar. La carga depende del `sys.path` del proceso y de las dependencias reales de esos archivos.

## Descubrir archivos sin importarlos

<a id="moduleinspector-method-discovermodules"></a>

### `discoverModules`

```python
@staticmethod
def discoverModules(base_path: Path, target_path: Path) -> set[str]: ...
```

`base_path` y `target_path` son argumentos `Path` obligatorios. Resuelve ambas rutas y recorre recursivamente `target_path`; este debe quedar dentro de `base_path` o se genera `ValueError`. Convierte archivos con extensión exacta `.py` a nombres con puntos, relativos a la base. Devuelve un `set[str]`, sin orden garantizado.

No importa los archivos ni valida que los nombres de directorio sean identificadores Python. Una carpeta inexistente produce un conjunto vacío. Los inicializadores de paquetes se normalizan al nombre del paquete; el inicializador situado en la raíz de la base no añade un nombre vacío. No exige un inicializador para cada carpeta.

Omite directorios llamados `__pycache__` o `site-packages`, sin distinguir mayúsculas. También omite `.env`, `.venv`, `env` y `venv` cuando contienen `pyvenv.cfg`; una carpeta `env` normal sí se recorre. La misma comprobación se aplica a los directorios que conducen desde la base al objetivo. No excluye una carpeta por contener simplemente la palabra `env`.

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

## Filtrar imports con AST

<a id="moduleinspector-method-fileimportsany"></a>

### `fileImportsAny`

```python
@staticmethod
def fileImportsAny(file_path: Path, target_modules: set[str], *, allow_empty: bool=False) -> bool: ...
```

`file_path: Path` y `target_modules: set[str]` son obligatorios; `allow_empty=False` es keyword-only. Devuelve `True` si algún nodo `import x` tiene un nombre exacto del conjunto o algún `from x import ...` tiene ese módulo exacto. Un alias no cambia la coincidencia. `import app.services.worker` no coincide por prefijo con `app.services`.

El recorrido AST incluye imports dentro de funciones, condiciones y bloques `TYPE_CHECKING`: detectarlos no prueba que se ejecuten. No ejecuta imports dinámicos con `importlib` ni resuelve imports relativos al paquete; compara el texto del campo AST `module`.

Devuelve `False` si el conjunto está vacío, la ruta no es un archivo, hay un error de sintaxis o el archivo no es UTF-8. Con un conjunto no vacío, `allow_empty=True` acepta un archivo vacío o compuesto únicamente por espacios; un archivo con solo comentarios no se considera vacío. Otros errores de lectura, como permisos, se propagan.

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

## Cargar una clase

<a id="moduleinspector-method-loadclass"></a>

### `loadClass`

```python
@classmethod
def loadClass(cls: type, module_path: str | None=None, class_name: str | None=None, *, metadata: dict[str, str] | None=None) -> type: ...
```

Es un método de clase. Devuelve el objeto `type` encontrado, sin llamar a su constructor. Hay dos formas de uso:

- `module_path` y `class_name`: nombres explícitos, ambos con valor predeterminado `None` en la firma. Para una carga válida proporciona ambos.
- `metadata`, keyword-only, con claves `"module"` y `"class"`: se utiliza únicamente si ambos argumentos explícitos son `None`. Acepta un `dict` o un `MappingProxyType` no vacío. No completa automáticamente un argumento explícito que falte ni mezcla ambos formatos.

Primero reutiliza la clase cacheada por `module_path.class_name`; luego consulta `sys.modules` y, si hace falta, importa el módulo. No exige que la clase se haya declarado allí: un alias importado también es válido.

Un módulo desconocido genera `ImportError`; un nombre ausente, `AttributeError`; un valor que no sea clase, `TypeError`. La metadata incompleta o tipos incorrectos pueden producir los errores de las llamadas de importación o de `getattr`; no hay un validador adicional que convierta todos esos casos en una única excepción. Excepciones distintas de `ImportError` durante la importación se propagan.

La caché de clases vive en memoria, es compartida por las llamadas y no tiene un método público de vaciado ni un límite configurado. No relee automáticamente una clase reemplazada posteriormente en el módulo. No está vinculada a `clearCache()` de los wrappers de reflexión.

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

## Descubrir dataclasses inmutables

<a id="moduleinspector-method-discoverfrozendataclasses"></a>

### `discoverFrozenDataclasses`

```python
@staticmethod
def discoverFrozenDataclasses(modules: set[str]) -> set[tuple[str, str, str, type[Any]]]: ...
```

`modules: set[str]` es obligatorio. Importa cada módulo e inspecciona sus variables buscando clases cuyo `__module__` coincida con el módulo y cuyo **propio** `__dict__` contenga `__dataclass_params__` con `frozen=True`. No incluye dataclasses reexportadas, mutables ni subclases no redecoradas que solo hereden esos metadatos.

Devuelve un conjunto de tuplas `(file_stem, module_path, attribute_name, class_type)`. `file_stem` es el nombre del archivo sin extensión; si el módulo no tiene `__file__`, usa `"unknown"`. El tercer elemento es el nombre del atributo en el módulo y puede ser un alias de la misma clase. No construye instancias y no impone un orden. Un conjunto vacío devuelve un conjunto vacío.

Cualquier excepción durante la importación o la inspección de un módulo se envuelve en `RuntimeError`, conservando su causa; la operación no continúa silenciosamente con los demás módulos.

```python
from orionis.introspection import ModuleInspector

found = ModuleInspector.discoverFrozenDataclasses({
    "orionis.introspection.dependencies.entities.argument",
})
assert any(name == "Argument" for _, _, name, _ in found)
assert ModuleInspector.discoverFrozenDataclasses(set()) == set()
```

## Ejemplo completo: descubrir y cargar un plugin

Este ejemplo crea un módulo temporal aislado, descubre su nombre sin ejecutarlo, filtra sus imports, carga una clase y descubre su configuración frozen. Agrega la raíz temporal a `sys.path` únicamente durante la importación y la retira al terminar. No modifica el proyecto.

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

En un proyecto real, la raíz de la aplicación ya debe ser importable. Ordena explícitamente los conjuntos con `sorted()` si necesitas un registro reproducible; la herramienta no establece prioridad entre plugins. La clase devuelta por `loadClass()` todavía debe registrarse o construirse según el contrato de tu aplicación.

## Acceso e inyección de dependencias

`ModuleInspector` no necesita datos de construcción: usa métodos estáticos y de clase. Puede ser un parámetro concreto de un componente resuelto por el contenedor, pero crear otra instancia no aísla la caché de `loadClass`. El uso directo suele ser suficiente para operaciones de inicialización. No existe una interfaz `IModuleInspector` exportada ni un mecanismo de inyección de nombres de módulo.

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

[Inspeccionar un módulo importado](/es/utilities/introspection/modules) · [Aplicación y contenedor](/es/application).
