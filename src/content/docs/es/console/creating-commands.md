---
title: "Crear comandos e inyectar servicios"
description: "Genera un comando, entiende BaseCommand y recibe servicios por constructor o por método."
editUrl: true
lastUpdated: false
---

Un comando expone una operación mediante una firma CLI, sus argumentos y un método `handle()`. Úsalo para coordinar tareas operativas; conserva la lógica reutilizable en servicios para poder invocarla también desde HTTP, jobs u otros componentes.

<a id="generator"></a>

## Generar el archivo

Desde la raíz del proyecto utiliza una de estas alternativas:

```shell
orionis make:console-command greet --signature app:greet --description "Print a greeting."
```

```shell
python -B reactor make:console-command greet --signature app:greet --description "Print a greeting."
```

`name` es obligatorio; `--signature` / `-s` también. `--description` / `-d` es opcional y, si se omite, la plantilla recibe `A custom console command.`. El generador comprueba el formato y que la firma no esté registrada.

Por defecto crea `app/console/commands/greet_command.py` con la clase `GreetCommand`. La ruta depende de `app_console_commands`; admite subdirectorios, por ejemplo `reports/export`. Prefiere nombres `snake_case`: `BuildReport` se convierte en `buildreport_command.py`, mientras que `build_report` produce `build_report_command.py`. Añade los sufijos `Command` y `_command` si faltan, crea directorios y no sobrescribe archivos existentes. Consulta [todos los generadores](/es/console/built-in-generators).

La plantilla importa `ClassVar`, `Argument` y `BaseCommand`, declara firma, descripción y una lista vacía de argumentos. Su `async handle(self) -> None` lanza `NotImplementedError("Implement the command logic.")`: debes reemplazar ese cuerpo antes de utilizarla.

## Completar y ejecutar el comando

Este módulo completo puede sustituir el archivo generado:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand


class GreetCommand(BaseCommand):
    signature = "app:greet"
    description = "Print a greeting."
    timestamps = False
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="name", type_=str, help="Name to greet."),
        Argument(name_or_flags=("-n", "--times"), type_=int, default=1),
        Argument(name_or_flags="--quiet", action="store_true", default=False),
    ]

    async def handle(self) -> int:
        count = self.getArgument("times")
        if count < 1:
            self.error("--times must be positive", timestamp=False)
            return 2
        if not self.getArgument("quiet"):
            for _ in range(count):
                self.writeLine(f"Hello, {self.getArgument('name')}!")
        return 0
```

```shell
orionis app:greet Ada --times 2
python -B reactor app:greet Ada --quiet
python -B reactor app:greet --help
```

La primera ejecución imprime dos saludos. `--times 0` devuelve `2`; un envío válido, `0`. `--quiet` pertenece a este ejemplo; no es un flag global del framework. Cada comando declara sus propias opciones.

<a id="base-command"></a>

## Estructura y descubrimiento

`BaseCommand` se importa desde `orionis.console.base`. Extiende `Console` y el contrato `IBaseCommand`: dentro del comando utiliza `self.writeLine()`, `self.table()`, `self.ask()` y los demás métodos de [salida](/es/console/console-output) y [preguntas](/es/console/interactive-input). Para [progreso](/es/console/progress), la propiedad heredada `self.progressBar` proporciona una barra; guarda esa instancia antes de actualizarla. No necesitas construir otro `Console` ni importar `ProgressBar` dentro del comando.

| Miembro | Tipo y predeterminado | Función |
| --- | --- | --- |
| `signature` | `str`, sin valor en la base. | Identidad del comando; no contiene definiciones de argumentos entre llaves. |
| `description` | `str`, sin valor en la base. | Texto de ayuda. El loader permite omitirlo y utiliza `No description provided.`; un texto declarado vacío se rechaza. |
| `timestamps` | `bool = True`. | Habilita los mensajes del ejecutor al comenzar y terminar. No configura los timestamps de cada llamada a `self.info()`. |
| `arguments` | `ClassVar[list[Argument]] = []`. | Declaraciones utilizadas para construir el parser. Define tu propia lista en cada comando. |

El loader descubre módulos de `app_console_commands` y clases derivadas de `BaseCommand` **definidas en cada módulo**. Importar una clase desde otro archivo no la registra otra vez. El directorio debe ser importable dentro de la aplicación; no necesitas editar un registro central por cada comando.

Las firmas de clases se recortan y se validan con el patrón `[a-z][a-z0-9]*(?::[a-z][a-z0-9]*(?:-[a-z0-9]+)*)?`. Son válidas `greet`, `app:greet` y `reports:build-daily`; `my-command`, `reports:daily:build` o `App:Greet` no lo son. Los argumentos se declaran con `Argument`, no dentro de `signature`.

Las fuentes se cargan en orden: comandos nativos, clases de aplicación y registros de rutas. El registro final es un diccionario por firma: una definición posterior puede sustituir la anterior. Asigna firmas propias y únicas; el generador rechaza las que ya conoce. Consulta [caché y descubrimiento](/es/console/command-cache) si una modificación no aparece.

<a id="base-construction"></a>

### Constructor y handle()

```python
def __init__(self) -> None: ...
async def handle(self) -> None: ...
```

El constructor inicializa el diccionario interno de argumentos. Si lo sobrescribes, llama a `super().__init__()`. El `handle()` de la base no implementa trabajo y lanza `NotImplementedError`; tu clase debe reemplazarlo. El contenedor puede invocar handlers síncronos, pero utiliza `async def` cuando realices operaciones async.

Devuelve un entero para controlar el código de salida. Un retorno correcto de otro tipo, incluido `None`, se normaliza a `0`; Reactor no devuelve un resultado de negocio estructurado. `bool` es un subtipo de `int`, por lo que devolver `True` tampoco expresa éxito de manera apropiada: devuelve `0` explícitamente.

<a id="dependency-injection"></a>

## Inyección por constructor y por método

Guarda este módulo en `app/console/commands/build_report_command.py`:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand
from orionis.storage.contracts.manager import IStorageManager


class ReportBuilder:
    def __init__(self, storage: IStorageManager) -> None:
        self.storage = storage

    async def build(self, report_id: int) -> None:
        await self.storage.disk("local").put(
            f"reports/{report_id}.txt", f"Report {report_id}\n",
        )


class ReportPresenter:
    def format(self, report_id: int) -> str:
        return f"Report {report_id} is ready."


class BuildReportCommand(BaseCommand):
    signature = "reports:build-one"
    description = "Build a report with injected services."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="report_id", type_=int),
    ]

    def __init__(self, builder: ReportBuilder) -> None:
        super().__init__()
        self.builder = builder

    async def handle(self, presenter: ReportPresenter) -> int:
        report_id = self.getArgument("report_id")
        await self.builder.build(report_id)
        self.success(presenter.format(report_id), timestamp=False)
        return 0
```

```shell
orionis reports:build-one 42
python -B reactor reports:build-one 42
```

Reactor construye el comando mediante `app.build()`: resuelve `ReportBuilder` y su `IStorageManager` por constructor. Luego invoca `handle()` mediante `app.call()` e inyecta `ReportPresenter`. Las clases concretas pueden resolverse sin un binding propio; los contratos necesitan su proveedor, como el nativo de Storage. El disco `local` debe estar configurado y ser escribible.

**Los argumentos CLI de una clase BaseCommand no se inyectan como parámetros de `handle()`**: Reactor los asigna a la instancia y se leen con `getArgument()`. Los handlers de [rutas de consola](/es/console/command-routing) que no extienden `BaseCommand` sí reciben esos valores por nombre.

Cada llamada de Reactor abre un scope marcado como consola. Inyecta el servicio que necesitas en lugar de conservar objetos de una petición HTTP anterior. Una llamada Python directa a `command.handle()` no activa esta resolución automática.

<a id="command-exceptions"></a>

## Errores y códigos de salida

Usa `try/except` cuando puedas resolver el problema o devolver un código de negocio. Si deseas que el capturador global registre y presente el error, permite que se propague:

```python
from typing import ClassVar
from orionis.console import Argument
from orionis.console.base import BaseCommand


class ParseCountCommand(BaseCommand):
    signature = "app:parse-count"
    description = "Validate a positive record count."
    arguments: ClassVar[list[Argument]] = [
        Argument(name_or_flags="value", type_=str),
    ]

    async def handle(self) -> int:
        try:
            count = int(self.getArgument("value"))
        except ValueError:
            self.error("Count must contain decimal digits.", timestamp=False)
            return 2
        if count < 1:
            raise ValueError("Count must be positive.")
        self.writeLine(f"Accepted: {count}")
        return 0
```

```shell
python -B reactor app:parse-count invalid
python -B reactor app:parse-count 0
```

La primera llamada devuelve `2` desde el comando. La segunda llega al tratamiento de excepciones de Reactor: escribe en logs, delega a `ICatch` y devuelve `1` si ese tratamiento termina correctamente. Capturar un error y terminar sin un retorno distinto de cero puede hacer que el comando se interprete como exitoso.

Para terminar un comando normal, devuelve el código desde `handle()`; `exitSuccess()` y `exitError()` son [operaciones de terminación del proceso](/es/console/console-output), con efectos diferentes. La ayuda y los errores del parser utilizan `SystemExit`; consulta [la ejecución programática](/es/console/reactor-and-injection) antes de capturarlos desde otro componente.
