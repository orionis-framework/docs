---
title: "Argumentos y opciones"
description: "Declara argumentos y opciones, acciones, valores opcionales, conversores y lectura de datos CLI."
editUrl: true
lastUpdated: false
---

Los valores CLI se definen mediante `Argument` y se procesan con `argparse`. La firma identifica el comando; no incorpora una sintaxis adicional como `{name}`. Declara los argumentos en `BaseCommand.arguments` o en `.arguments([...])` al registrar una [ruta de consola](/es/console/command-routing).

<a id="argument-construction"></a>

## Declarar argumentos con Argument

Importa `Argument` desde `orionis.console`. Es una dataclass inmutable, con construcción exclusivamente por nombre. Solo `name_or_flags` es obligatorio:

| Campo | Tipo y predeterminado | Función |
| --- | --- | --- |
| `name_or_flags` | `str` o `Iterable[str]`, obligatorio. | Nombre posicional o flags como `("-n", "--count")`; se normaliza a una tupla. |
| `action` | `str \| ArgumentAction \| None = None`. | Acción del parser; `None` utiliza el almacenamiento normal. |
| `nargs` | `int \| str \| None = None`. | Cantidad de valores: entero, `?`, `*` o `+`. |
| `const` | `Any = MISSING`. | Valor usado por acciones constantes o un opcional presente sin valor. |
| `default` | `Any = MISSING`. | Valor cuando no se proporciona el argumento. El sentinel conserva la diferencia entre ausencia y `None`. |
| `type_` | `Callable[[str], Any] \| None = None`. | Conversión de cada valor, por ejemplo `int` o un conversor importable. |
| `choices` | `Iterable[Any] \| None = None`. | Valores permitidos después de la conversión. No acepta un string como colección. |
| `required` | `bool = False`. | Exige que una opción con flags esté presente. No configura la cardinalidad de un posicional. |
| `help` | `str \| None = None`. | Descripción mostrada en la ayuda. |
| `metavar` | `str \| tuple[str, ...] \| None = None`. | Etiqueta visible para los valores; una tupla permite etiquetas distintas con cardinalidad fija. |
| `dest` | `str \| None = None`. | Nombre de la clave en los argumentos resueltos. |
| `version` | `str \| None = None`. | Texto obligatorio cuando `action="version"`. |

`-h` y `--help` están reservados por Orionis. Un iterable vacío o un elemento que no sea string se rechaza; las combinaciones de flags, nombres y acciones también deben ser válidas para `argparse`.

Los campos se validan al construir la entidad. Algunas incompatibilidades solo aparecen al crear el parser o al analizar una invocación. Los valores deben ser compatibles con la [serialización de metadatos](/es/console/command-cache).

<a id="argument-cardinality"></a>

## Posicionales, cardinalidad y valores ausentes

| Declaración | Ejemplo de entrada | Resultado |
| --- | --- | --- |
| `Argument(name_or_flags="name")` | `Ada` | Un string obligatorio. |
| `Argument(name_or_flags="name", nargs="?", default="guest")` | Sin valor, o `Ada`. | `"guest"` o `"Ada"`. |
| `Argument(name_or_flags="pair", nargs=2, type_=int)` | `10 20` | `[10, 20]`; exige exactamente dos valores. |
| `Argument(name_or_flags="files", nargs="*", default=[])` | Sin valores, o `a.csv b.csv`. | Una lista que puede estar vacía. |
| `Argument(name_or_flags="ids", nargs="+", type_=int)` | `10 20` | Lista no vacía; omitirla es un error de parsing. |

Cada fila es una definición independiente. Este comando muestra una **opción** con valor opcional. Guárdalo en `app/console/commands/inspect_mode_command.py`:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand


class InspectModeCommand(BaseCommand):
    signature = "app:inspect-mode"
    description = "Show the selected execution mode."
    arguments: ClassVar[list[Argument]] = [
        Argument(
            name_or_flags="--mode", nargs="?",
            default="normal", const="fast", choices=("normal", "fast", "safe"),
        ),
    ]

    async def handle(self) -> int:
        self.writeLine(self.getArgument("mode"))
        return 0
```

```shell
python -B reactor app:inspect-mode
python -B reactor app:inspect-mode --mode
python -B reactor app:inspect-mode --mode safe
```

Las tres invocaciones imprimen `normal`, `fast` y `safe`, respectivamente. Puedes sustituir `python -B reactor` por `orionis`.

Para una opción obligatoria utiliza `required=True`. Para un posicional opcional utiliza `nargs="?"`; `required=False` por sí solo no lo hace opcional. Una lista con `nargs` agrupa valores de una aparición; `append` acumula apariciones de una opción.

`MISSING` no es `None`. El parser recibe ese sentinel como default y Reactor elimina del diccionario las claves cuyo valor siga siendo exactamente `MISSING`. Si declaras `default=None`, la clave se conserva con `None`. Por ello, declara defaults explícitos cuando tu código necesite siempre una lista, un contador o un booleano.

<a id="argument-actions"></a>

## Las nueve acciones del enum

`ArgumentAction` se importa desde `orionis.console.enums.actions`. Puedes utilizar sus miembros o las cadenas equivalentes:

| Miembro | Acción | Uso |
| --- | --- | --- |
| `STORE` | `store` | Guardar un valor. |
| `STORE_CONST` | `store_const` | Guardar `const` cuando aparece el flag. |
| `STORE_TRUE` | `store_true` | Activar un booleano. |
| `STORE_FALSE` | `store_false` | Desactivar un booleano. |
| `APPEND` | `append` | Añadir cada aparición a una lista. |
| `APPEND_CONST` | `append_const` | Añadir una constante por aparición. |
| `COUNT` | `count` | Contar apariciones. |
| `HELP` | `help` | Imprimir ayuda y terminar con `SystemExit(0)`. |
| `VERSION` | `version` | Imprimir `version` y terminar con `SystemExit(0)`. |

Este comando completo muestra las siete acciones que entregan valores. Guárdalo como `app/console/commands/inspect_options_command.py`:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand
from orionis.console.enums.actions import ArgumentAction


class InspectOptionsCommand(BaseCommand):
    signature = "app:inspect-options"
    description = "Inspect parsed command options."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="--format", action=ArgumentAction.STORE,
                 choices=("json", "csv"), default="json"),
        Argument(name_or_flags="--preview", action="store_const",
                 const="preview", default="write", dest="mode"),
        Argument(name_or_flags="--verbose", action="store_true", default=False),
        Argument(name_or_flags="--no-color", action="store_false",
                 default=True, dest="color"),
        Argument(name_or_flags="--tag", action="append", default=[]),
        Argument(name_or_flags="--email", action="append_const",
                 const="email", default=[], dest="channels"),
        Argument(name_or_flags=("-v", "--verbosity"), action="count", default=0),
    ]

    async def handle(self) -> int:
        self.table(
            ["Key", "Value"],
            [[key, repr(value)] for key, value in self.getArguments().items()],
        )
        return 0
```

```shell
orionis app:inspect-options --format csv --preview --verbose --no-color --tag urgent --tag paid --email --email -vv
```

```shell
python -B reactor app:inspect-options --format csv --preview --verbose --no-color --tag urgent --tag paid --email --email -vv
```

Los resultados son `format="csv"`, `mode="preview"`, `verbose=True`, `color=False`, `tag=["urgent", "paid"]`, `channels=["email", "email"]` y `verbosity=2`.

Para `append` y `append_const`, utiliza `default=[]`; para `count`, `default=0`. En esta implementación, el sentinel predeterminado no sirve como acumulador: sin esos defaults, la primera aparición puede producir `AttributeError` o `TypeError`. Las acciones constantes y booleanas no admiten `type_`: Orionis lo rechaza antes de construir el parser. No utilices `type_=bool` para interpretar el texto `"false"`.

Las acciones de ayuda y versión pueden añadirse con nombres distintos de los reservados:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand
from orionis.console.enums.actions import ArgumentAction


class ApplicationInfoCommand(BaseCommand):
    signature = "app:info"
    description = "Show application CLI information."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="--usage", action=ArgumentAction.HELP),
        Argument(
            name_or_flags="--release", action=ArgumentAction.VERSION,
            version="Example application CLI",
        ),
    ]

    async def handle(self) -> int:
        self.writeLine("Use --usage or --release for CLI information.")
        return 0
```

Guárdalo en `app/console/commands/application_info_command.py` y ejecuta:

```shell
orionis app:info --usage
python -B reactor app:info --release
```

`--usage` imprime la ayuda del comando; `--release` imprime el texto configurado. Ambos terminan con código `0` antes de ejecutar `handle()`. El flag nativo `--help` continúa disponible en cada comando.

<a id="argument-conversion"></a>

## Conversión, choices, aliases y dest

Define conversores propios a nivel de módulo para que el loader pueda importarlos al reconstruir sus metadatos. Por ejemplo, en `app/console/types.py`:

```python
import argparse


def positive_integer(value: str) -> int:
    try:
        number = int(value)
    except ValueError as error:
        raise argparse.ArgumentTypeError("Expected an integer.") from error
    if number < 1:
        raise argparse.ArgumentTypeError("Expected a positive integer.")
    return number
```

En la lista de argumentos de tu comando:

```python
from app.console.types import positive_integer
from orionis.console import Argument

arguments = [
    Argument(
        name_or_flags=("-l", "--limit"), type_=positive_integer,
        choices=(10, 50, 100), default=10, dest="row_limit", metavar="ROWS",
        help="Maximum number of rows.",
    ),
]
```

`--limit 50` y `-l 50` producen `row_limit=50`. `--limit 0` falla en el conversor; `--limit 25`, en `choices`. Los choices son enteros porque se comparan después de convertir. Para aliases cortos y largos utiliza una tupla o lista de flags, no un string que los contenga separados por espacios.

El loader usa `allow_abbrev=False`: debes escribir `--limit`, no `--lim`. Puedes pasar `--limit=50` o `--limit 50`; para tratar como posicional un valor que empieza por guion, utiliza el separador `--` del parser cuando la estructura del comando lo permita.

<a id="base-getargument"></a>

## Leer un valor: getArgument()

```text
getArgument(key: str, default: Any | None = None) -> Any | None
```

Busca la clave exacta asignada por el parser, que depende de `dest` o del nombre de la opción. Una clave ausente devuelve `default`; un `None` presente se conserva. Una clave que no sea `str` produce `TypeError`. No uses el texto del flag con sus guiones: para `--row-limit`, la clave habitual es `row_limit`.

<a id="base-getarguments"></a>

## Leer todos: getArguments()

```text
getArguments() -> dict[str, Any]
```

Devuelve una copia superficial del diccionario de la instancia. Cambiar sus claves no cambia el original, pero los objetos anidados siguen compartidos. Los valores son los ya convertidos por el parser.

<a id="base-setarguments"></a>

## Asignar datos: setArguments()

```text
setArguments(args: dict[str, Any]) -> None
```

Reactor lo utiliza antes de `handle()`. Fusiona el diccionario con el existente mediante `update`; no borra claves anteriores ni ejecuta el parser. Un valor que no sea `dict` produce `TypeError`. También sirve para probar un comando aislado:

```python
from orionis.console.base import BaseCommand

command = BaseCommand()
command.setArguments({"limit": 10, "optional": None})
command.setArguments({"limit": 20})
assert command.getArgument("limit") == 20
assert command.getArgument("optional", "fallback") is None
assert command.getArgument("missing", "fallback") == "fallback"
copy = command.getArguments()
copy["limit"] = 99
assert command.getArgument("limit") == 20
```

Este ejemplo inspecciona estado y no llama al `handle()` sin implementar de la clase base. Para una ejecución normal no llames a `setArguments()` a mano: utiliza Reactor y una lista de tokens CLI.
