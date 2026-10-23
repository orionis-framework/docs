---
title: "Texto, tablas y salida"
description: "Referencia de Console: texto, estilos, tablas, diagnósticos y auxiliares de salida del CLI."
editUrl: true
lastUpdated: false
---

<a id="console"></a>
## La salida que hereda un comando

`BaseCommand` hereda `Console`, que implementa `IConsole`. En un comando utiliza directamente `self.writeLine()`, `self.table()` y los demás métodos heredados: **no necesitas importar ni instanciar `Console`**. El patrón principal es el siguiente:

```python
from orionis.console.base import BaseCommand

class ImportSummaryCommand(BaseCommand):
    signature = 'app:import-summary'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.writeLine('Import summary')
        self.table(['Status', 'Rows'], [['created', 12], ['skipped', 3]])
        self.success('Finished', timestamp=False)
        return 0
```

Los métodos heredados son síncronos, excepto [`sleep()`](/es/console/progress-and-debugging#console-sleep). Usarlos dentro de `async handle()` no convierte la escritura o las preguntas en operaciones asíncronas. Los métodos de texto escriben en stdout; `error()` tampoco cambia automáticamente a stderr ni altera el código de salida.

Los encabezados de estado con `timestamp=True` resuelven la hora mediante la fachada `DateTime`, disponible en la aplicación iniciada. Para una utilidad independiente usa `timestamp=False`. Las variantes de color emiten códigos ANSI; no interpretan marcado Rich como `[bold]`.

<a id="console-write"></a>
<a id="console-writeline"></a>
## Escribir valores y líneas

```text
write(*values: object, sep: str | None = " ", end: str | None = "\n",
      file: SupportsWrite[str] | None = None, flush: bool = False) -> None
writeLine(message: str) -> None
```

`write()` delega en `print()`: convierte los valores a texto, coloca `sep` entre ellos y añade `end`. `file=None` selecciona stdout; `flush=True` vacía el búfer. `sep=None` y `end=None` utilizan los valores predeterminados de `print`. `SupportsWrite[str]` describe un destino con `write(str)`, no un nombre de archivo. `writeLine()` imprime un único mensaje y un salto de línea. Ambos devuelven `None`; los errores de conversión, argumentos de `print()` o escritura se propagan.

```python
from io import StringIO
from orionis.console.base import BaseCommand

class WriteValuesCommand(BaseCommand):
    signature = 'app:write-values'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.write('Processed', 24, 'rows', sep=' | ', flush=True)
        self.writeLine('Import complete')
        buffer = StringIO()
        self.write('created', 24, sep=',', end='', file=buffer)
        assert buffer.getvalue() == 'created,24'
        return 0
```

<a id="console-success"></a>
<a id="console-info"></a>
<a id="console-warning"></a>
<a id="console-fail"></a>
<a id="console-error"></a>
## Mensajes de estado

| Firma | Presentación y uso |
| --- | --- |
| `success(message: str, *, timestamp: bool = True) -> None` | Etiqueta `SUCCESS`, fondo verde: operación terminada correctamente. |
| `info(message: str, *, timestamp: bool = True) -> None` | Etiqueta `INFO`, fondo azul: información del proceso. |
| `warning(message: str, *, timestamp: bool = True) -> None` | Etiqueta `WARNING`, fondo amarillo: condición que requiere atención. |
| `fail(message: str, *, timestamp: bool = True) -> None` | Etiqueta `FAIL`, fondo ANSI 256 de índice `166` (naranja): operación fallida. |
| `error(message: str, *, timestamp: bool = True) -> None` | Etiqueta `ERROR`, fondo rojo: diagnóstico de error. |

`message` es el texto que se imprime. `timestamp` es exclusivamente de palabra clave y controla la fecha y hora; no existe una opción global de `Console` que sustituya este argumento. Todos devuelven `None`, no lanzan una excepción por el estado mostrado y no detienen el comando. Los errores del servicio de fecha o de stdout se propagan.

```python
from orionis.console.base import BaseCommand

class StatusMessagesCommand(BaseCommand):
    signature = 'app:status-messages'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.info('Reading input', timestamp=False)
        self.warning('Two rows were skipped', timestamp=False)
        self.fail('Import could not be completed', timestamp=False)
        self.error('The supplied file has an invalid format', timestamp=False)
        self.success('Summary saved', timestamp=False)
        return 0
```

<a id="console-textsuccess"></a>
<a id="console-textsuccessbold"></a>
<a id="console-textinfo"></a>
<a id="console-textinfobold"></a>
<a id="console-textwarning"></a>
<a id="console-textwarningbold"></a>
<a id="console-texterror"></a>
<a id="console-texterrorbold"></a>
<a id="console-textmuted"></a>
<a id="console-textmutedbold"></a>
<a id="console-textunderline"></a>
## Texto con estilos

Cada método recibe únicamente `message: str`, imprime una línea y devuelve `None`. No añade etiqueta ni fecha. No hay validación adicional; los errores de escritura se propagan.

| Firma | Estilo |
| --- | --- |
| `textSuccess(message: str) -> None` | Verde. |
| `textSuccessBold(message: str) -> None` | Verde y negrita. |
| `textInfo(message: str) -> None` | Azul. |
| `textInfoBold(message: str) -> None` | Azul y negrita. |
| `textWarning(message: str) -> None` | Amarillo. |
| `textWarningBold(message: str) -> None` | Amarillo y negrita. |
| `textError(message: str) -> None` | Rojo. |
| `textErrorBold(message: str) -> None` | Rojo y negrita. |
| `textMuted(message: str) -> None` | Gris. |
| `textMutedBold(message: str) -> None` | Gris y negrita. |
| `textUnderline(message: str) -> None` | Subrayado. |

```python
from orionis.console.base import BaseCommand

class StyledTextCommand(BaseCommand):
    signature = 'app:styled-text'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.textSuccess('Created')
        self.textSuccessBold('All records created')
        self.textInfo('Reading configuration')
        self.textInfoBold('Selected connection: sqlite')
        self.textWarning('Skipped an existing record')
        self.textWarningBold('Review the skipped records')
        self.textError('Invalid row')
        self.textErrorBold('Import failed')
        self.textMuted('Elapsed: 0.2 seconds')
        self.textMutedBold('Import details')
        self.textUnderline('Summary')
        return 0
```

<a id="console-line"></a>
<a id="console-newline"></a>
<a id="console-clear"></a>
<a id="console-clearline"></a>
## Espaciado y control del terminal

```text
line() -> None
newLine(count: int = 1) -> None
clear() -> None
clearLine() -> None
```

`line()` escribe un salto de línea; no dibuja una regla horizontal. `newLine()` escribe `count` saltos y lanza `ValueError` si `count <= 0`. Usa un entero positivo; otros tipos pueden producir `TypeError` durante la comparación o multiplicación.

`clear()` limpia la pantalla y mueve el cursor al origen mediante ANSI **solo si stdout es un terminal** (`isatty()`); en salida redirigida no escribe nada. `clearLine()` escribe `\r \r` y hace flush: vuelve al principio y sobrescribe un carácter, sin garantizar que borre una línea larga completa. Todos devuelven `None`; los errores del stream se propagan.

```python
from orionis.console.base import BaseCommand

class TerminalOutputCommand(BaseCommand):
    signature = 'app:terminal-output'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.clear()
        self.write('Preparing...', end='', flush=True)
        self.clearLine()
        self.writeLine('Ready')
        self.line()
        self.newLine(2)
        return 0
```

<a id="console-table"></a>
## Tablas

```text
table(headers: list, rows: list) -> None
```

`headers` contiene los nombres de columna y `rows` las filas. Convierte las celdas a texto, calcula el ancho máximo por columna y dibuja bordes con encabezados en negrita. Devuelve `None`. Una lista vacía de encabezados o de filas produce `ValueError`.

Proporciona encabezados de texto y el mismo número de celdas en cada fila: el cálculo usa `zip()`, por lo que filas más cortas recortan las columnas y las celdas sobrantes no se muestran. No incorpora ajuste automático al ancho del terminal ni una opción de alineación o paginación.

```python
from orionis.console.base import BaseCommand

class TableOutputCommand(BaseCommand):
    signature = 'app:table-output'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        rows = [['customers', 120], ['orders', 48]]
        if rows:
            self.table(['Resource', 'Imported'], rows)
        else:
            self.writeLine('No rows to display')
        return 0
```

<a id="console-exception"></a>
## Mostrar una excepción

```text
exception(exception: Exception) -> None
```

Recibe una instancia de `Exception`, muestra su tipo, mensaje y un traceback Rich con `max_frames=1`, una línea de contexto y sin variables locales. Devuelve `None`; un valor que no derive de `Exception` produce `TypeError`. Mostrarla no equivale a relanzarla, registrar un evento ni marcar el comando como fallido.

```python
from orionis.console.base import BaseCommand


class CheckInputCommand(BaseCommand):
    signature = "app:check-input"
    description = "Validate an import quantity."

    async def handle(self) -> int:
        try:
            int("invalid")
        except ValueError as error:
            self.exception(error)
            return 1
        return 0
```

<a id="console-exitsuccess"></a>
<a id="console-exiterror"></a>
## Finalizar el proceso

```text
exitSuccess(message: str | None = None) -> None
exitError(message: str | None = None) -> None
```

Si `message` contiene texto, primero llama a `success()` o `error()` con fecha activada. Después solicita la salida con código `0` o `1`. **La implementación captura `SystemExit` y llama a `os._exit()`**, que finaliza el proceso inmediatamente. No son una forma de devolver un resultado al Reactor; no permiten confiar en los bloques `finally` ni en la limpieza del ciclo de vida de la aplicación.

Para un comando normal devuelve un entero desde `handle()`, como en el ejemplo anterior. Usa estos métodos solo cuando realmente necesites terminar todo el proceso que ejecuta el comando, incluidas sus otras tareas:

```python
from orionis.console.base import BaseCommand

class ProcessExitCommand(BaseCommand):
    signature = 'app:process-exit'
    description = 'Demonstrate inherited command output.'

    def terminate_process(self, success: bool) -> None:
        if success:
            self.exitSuccess()
        else:
            self.exitError()
```

El método auxiliar `terminate_process()` no se ejecuta al definir la clase; solo termina el proceso si lo llamas. Los mensajes opcionales requieren la misma aplicación iniciada que los demás mensajes con fecha. No uses estos métodos desde un comando llamado programáticamente si debe continuar el proceso llamador.

<a id="executor"></a>
<a id="executor-running"></a>
<a id="executor-done"></a>
<a id="executor-fail"></a>
## Indicadores auxiliares de ejecución

`Executor` implementa `IExecutor`. **No ejecuta procesos ni se hereda en `BaseCommand`**: representa visualmente un estado. Su constructor no recibe argumentos y sus tres métodos devuelven `None`:

```text
running(program: str, time: str = "") -> None
done(program: str, time: str = "") -> None
fail(program: str, time: str = "") -> None
```

`program` es la etiqueta; `time` es un texto ya calculado por el llamador, no un temporizador. Imprime fecha, puntos de relleno y `RUNNING`, `DONE` o `FAIL`, vaciando stdout. `done()` y `fail()` anteponen ` ~ ` al texto de tiempo. Utiliza `DateTime`, por lo que este ejemplo corresponde a un comando de una aplicación iniciada. Los errores de fecha o escritura se propagan; mostrar `FAIL` no lanza una excepción.

```python
from time import perf_counter
from orionis.console.base import BaseCommand
from orionis.console.output.executor import Executor


class MeasureCommand(BaseCommand):
    signature = "app:measure"
    description = "Show execution status."

    async def handle(self) -> int:
        output = Executor()
        output.running("Inventory summary")
        started = perf_counter()
        try:
            total = sum(range(100))
        except Exception as error:
            output.fail("Inventory summary", f"{perf_counter() - started:.3f}s")
            self.exception(error)
            return 1
        output.done("Inventory summary", f"{perf_counter() - started:.3f}s")
        self.writeLine(f"Total: {total}")
        return 0
```

<a id="help-command"></a>
<a id="help-command-parseactions"></a>
<a id="help-command-printactions"></a>
## Inspeccionar y mostrar ayuda

`HelpCommand` implementa `IHelpCommand`. Es un auxiliar estático del parser, no una superclase de comandos:

```text
HelpCommand.parseActions(actions: list[argparse.Action]) -> dict[str, Any]
HelpCommand.printActions(command_name: str, actions: list[argparse.Action],
                         *, is_error: bool = False) -> None
```

`parseActions()` clasifica acciones argparse. Devuelve `help` (`dict` o `None`), `positionals` (`list`), `optionals` (`list`) y `subcommands` (`dict`). Cada argumento contiene `action_class`, `dest`, `flags`, `nargs`, `const`, `default`, `type`, `choices`, `required`, `help` y `metavar`. Para subcomandos incluye su descripción y la clasificación recursiva de sus argumentos. No ejecuta comandos ni convierte esos valores en JSON automáticamente: `choices` o `default` pueden contener objetos Python.

`printActions()` muestra un panel y tablas de argumentos, opciones y subcomandos. `is_error=True` añade un diagnóstico de uso inválido; sigue devolviendo `None`, sin lanzar por sí mismo un error de parsing ni cambiar el código de salida. Recibe acciones ya construidas; errores de objetos inválidos o del renderizado se propagan.

```python
import argparse
from orionis.console.output.help_command import HelpCommand

parser = argparse.ArgumentParser(prog="app:report")
parser.add_argument("name", help="Report name")
parser.add_argument("--format", choices=["csv", "json"], default="csv")

metadata = HelpCommand.parseActions(parser._actions)
assert metadata["positionals"][0]["dest"] == "name"
HelpCommand.printActions("app:report", parser._actions)
HelpCommand.printActions("app:report", parser._actions, is_error=True)
```

El acceso a `parser._actions` aparece porque esta API recibe precisamente las acciones de argparse; para los comandos de la aplicación deja que Reactor construya y muestre la ayuda.

<a id="ansi-colors"></a>
## Códigos ANSI disponibles

`ANSIColors` es un `Enum`; cada miembro expone su secuencia como `.value`. Los métodos de `Console` anteriores ya seleccionan estos códigos. Para una presentación propia están disponibles los siguientes 24 miembros; la reproducción exacta del color depende del terminal:

| Miembro | Secuencia (`ESC` representa `\x1b`) | Propósito |
| --- | --- | --- |
| `DEFAULT` | `ESC[0m` | Restaurar estilos y colores. |
| `BG_INFO` | `ESC[44m` | Fondo azul. |
| `BG_ERROR` | `ESC[41m` | Fondo rojo. |
| `BG_FAIL` | `ESC[48;5;166m` | Fondo de color 256, índice 166. |
| `BG_WARNING` | `ESC[43m` | Fondo amarillo. |
| `BG_SUCCESS` | `ESC[42m` | Fondo verde. |
| `TEXT_INFO` | `ESC[34m` | Texto azul. |
| `TEXT_ERROR` | `ESC[91m` | Texto rojo brillante. |
| `TEXT_WARNING` | `ESC[33m` | Texto amarillo. |
| `TEXT_SUCCESS` | `ESC[32m` | Texto verde. |
| `TEXT_WHITE` | `ESC[97m` | Texto blanco brillante. |
| `TEXT_MUTED` | `ESC[90m` | Texto gris. |
| `TEXT_BOLD_INFO` | `ESC[1;34m` | Texto azul y negrita. |
| `TEXT_BOLD_ERROR` | `ESC[1;91m` | Texto rojo brillante y negrita. |
| `TEXT_BOLD_WARNING` | `ESC[1;33m` | Texto amarillo y negrita. |
| `TEXT_BOLD_SUCCESS` | `ESC[1;32m` | Texto verde y negrita. |
| `TEXT_BOLD_WHITE` | `ESC[1;97m` | Texto blanco brillante y negrita. |
| `TEXT_BOLD_MUTED` | `ESC[1;90m` | Texto gris y negrita. |
| `TEXT_BOLD` | `ESC[1m` | Negrita. |
| `TEXT_STYLE_UNDERLINE` | `ESC[4m` | Subrayado. |
| `CYAN` | `ESC[36m` | Texto cian. |
| `DIM` | `ESC[2m` | Intensidad atenuada. |
| `MAGENTA` | `ESC[35m` | Texto magenta. |
| `ITALIC` | `ESC[3m` | Cursiva. |

```python
from orionis.console.enums.styles import ANSIColors
from orionis.console.base import BaseCommand

class AnsiOutputCommand(BaseCommand):
    signature = 'app:ansi-output'
    description = 'Demonstrate inherited command output.'

    async def handle(self) -> int:
        self.writeLine(f'{ANSIColors.CYAN.value}Report details{ANSIColors.DEFAULT.value}')
        return 0
```

Continúa con [preguntas interactivas](/es/console/interactive-input), [progreso](/es/console/progress-and-debugging) o [ejecución programática](/es/console/output-and-programmatic-execution).

<a id="console-outside-commands"></a>
## Usar Console fuera de un comando

En una utilidad que no extiende `BaseCommand` sí puedes importar y construir `Console`. Este es un uso independiente; dentro de un comando utiliza los métodos heredados mediante `self`. `Console()` no necesita argumentos.

```python
from orionis.console import Console

console = Console()
console.writeLine("Import summary")
console.table(["Status", "Rows"], [["created", 12], ["skipped", 3]])
console.success("Finished", timestamp=False)
```
