---
title: "Referencia técnica de consola"
description: "Mapa de APIs y contratos, kernel CLI, metadatos, plantillas y utilidades de integración."
editUrl: true
lastUpdated: false
---

Esta página conecta las referencias completas y describe las herramientas de integración que no necesitas construir al escribir un comando normal.

## Mapa de la API pública

| Componente | Referencia |
| --- | --- |
| `BaseCommand` / `IBaseCommand` | [Estructura, constructor y handle](/es/console/creating-commands#base-command); [getArgument, getArguments y setArguments](/es/console/commands-and-arguments#base-getargument). |
| `Argument` / `ArgumentAction` | [Declaración, acciones y lectura de argumentos](/es/console/commands-and-arguments). |
| Reactor / `IReactor` | [command, hasCommand, info y call](/es/console/reactor-and-injection). |
| Loader / `ILoader` | [Descubrimiento, persistencia y cuatro métodos](/es/console/command-cache#loader-api). |
| Builder de comando / `ICommand` | [timestamp, description, arguments y get](/es/console/command-routing#fluent-api). |
| `Console` / `IConsole` | [Salida](/es/console/console-output), [preguntas](/es/console/interactive-input) y [progreso](/es/console/progress). |
| Auxiliares de salida y contratos | [Executor y HelpCommand](/es/console/console-output); [ProgressBar](/es/console/progress). |
| `BaseScheduler`, Schedule / `ISchedule` | [Registro](/es/console/task-scheduling), [Schedule.command()](/es/console/scheduler-execution#schedule-command) y [API completa](/es/console/scheduler-execution). |
| Builder de tarea / `ITask` | [Configuradores y todas las frecuencias](/es/console/scheduler-frequencies). |
| `ScheduleStore` / `IScheduleStore` | [Stores, drivers y configuración](/es/console/scheduler-configuration). |
| Listener, eventos y estados | [Hooks, entidades y enums](/es/console/scheduler-listeners). |

Los contratos describen la intención de la API; los ejemplos de la guía siguen la implementación. Por ejemplo, `IReactor.call()` menciona excepciones en su docstring, pero Reactor captura las `Exception` dentro de su flujo y normalmente devuelve `1`. Sus anotaciones amplias de handler tampoco habilitan cadenas de importación. Consulta cada guía para los límites verificados.

<a id="command-entity"></a>

## Entidad de metadatos Command

Se importa desde `orionis.console.entities.command`; no es el builder de `orionis.console.fluent.command`.

```text
Command(
    *,
    obj: type,
    method: str = "handle",
    timestamps: bool = True,
    signature: str,
    description: str,
    args: list[Argument] | argparse.ArgumentParser | None = None,
)
```

Es una dataclass mutable. `obj` referencia la clase que construirá el contenedor, `method` la acción, `signature` la identidad y `description` la ayuda. `timestamps` configura los mensajes del ejecutor. `args` es una lista declarativa mientras el builder prepara el comando, y un parser construido cuando el loader lo materializa.

El builder devuelve esta entidad mediante `get()`; `Loader.get()` y `Loader.all()` exponen las entidades materializadas. No modifiques sus campos para intentar actualizar un registro persistente: la caché conserva otra representación de metadatos.

<a id="kernel-cli"></a>

## KernelCLI e IKernelCLI

La implementación está en `orionis.console.kernel`; el contrato, en `orionis.console.contracts.kernel`. La aplicación los utiliza para conectar la entrada CLI con Reactor.

```text
async boot(application: IApplication) -> None
async handle(args: list[str] | None = None) -> int
```

`boot()` resuelve `IReactor`. `handle()` necesita ese arranque previo, comprueba que los argumentos explícitos sean una lista y normaliza el prefijo del ejecutable. Si no queda una firma o se solicita ayuda global, llama a `list`. En otro caso entrega el primer token como firma y el resto a `Reactor.call()`.

El método puede modificar la lista recibida al retirar prefijos; pasa una lista nueva si necesitas conservar la original. `None` no lee automáticamente `sys.argv`: representa una invocación sin argumentos para este kernel. La aplicación y los entrypoints se encargan de suministrarlos.

La constante pública `IGNORE_FLAGS` contiene `reactor`, `-c`, `-m`, `-`, `-i`, `-q`, `-B`, `-O`, `-OO`, `-v`, `-vv`, `-d`, `-x`, `-E`, `-s`, `-S`, `-u`, `-I` y `-W`. Se utiliza para retirar tokens iniciales; no convierte esos flags en opciones globales de todos los comandos ni es un parser completo de invocaciones Python.

Para integrar la ejecución utiliza normalmente la aplicación:

```python
from orionis.foundation.contracts.application import IApplication


class ConsoleEntrypoint:
    async def run(self, app: IApplication) -> int:
        return await app.handleCommand(["reactor", "list"])
```

`Application.handleCommand()` coordina el ciclo de la aplicación. Para llamar a un comando desde un componente ya arrancado suele ser suficiente `IReactor.call()`; no necesitas construir un segundo kernel.

<a id="reactor-provider"></a>

## Proveedor y accesor de Reactor

```text
ReactorProvider.register() -> None
async ReactorProvider.boot() -> None
Reactor.getFacadeAccessor() -> str
```

`orionis.console.reactor_provider.ReactorProvider` registra `IReactor -> Reactor` como singleton con alias `x-orionis-IReactor`. En `boot()` fija la fachada; `getFacadeAccessor()` devuelve ese alias. No registra automáticamente todos los contratos de los auxiliares como bindings intercambiables: por ejemplo, Reactor recibe la clase concreta Loader, no `ILoader`.

El [proveedor de Schedule](/es/console/scheduler-execution#scheduler-provider) registra el servicio del scheduler. Las fachadas se importan desde `orionis.support.facades`, con nombres `Reactor` y `Schedule`.

<a id="core-commands"></a>

## Catálogo de comandos nativos

```text
get_core_commands_mapping() -> tuple[type, ...]
CORE_COMMANDS: tuple
```

En `orionis.console.core.commands`, la función devuelve las 67 clases registradas por el framework y `CORE_COMMANDS` conserva ese resultado para el loader. No son instancias ejecutadas al importar el catálogo. El [catálogo completo](/es/console/built-in-commands) documenta todas las firmas, argumentos y opciones; no basta con encontrar otra clase en un archivo para considerarla un comando CLI registrado.

<a id="stub-construction"></a>

## Renderizar y crear código con Stub

La herramienta `orionis.console.templates.stub.Stub` utiliza las plantillas distribuidas con el framework. Los [generadores CLI](/es/console/built-in-generators) proporcionan la interfaz habitual; esta API permite inspeccionar o reutilizar su renderizado.

```text
Stub(
    template_name: str,
    class_name: str,
    prefix: str | None = None,
    postfix: str | None = None,
    replacements: dict[str, str] | None = None,
) -> None
render() -> str
create(
    directory: Path,
    relative_to: Path | None = None,
    extension: str = "py",
) -> str
```

El constructor conserva el nombre de plantilla sin `.stub`, el nombre base y las sustituciones. `render()` calcula el nombre de archivo/clase, carga la plantilla y devuelve el código como string, sin escribirlo. Rechaza nombres inválidos y sustituciones cuyo nombre o valor no sean strings; una plantilla inexistente produce `FileNotFoundError`.

`create()` renderiza, crea subdirectorios y abre el destino de forma exclusiva. Un archivo existente produce `FileExistsError`. La extensión admite un punto inicial que se elimina y se convierte a minúsculas, pero debe ser un identificador de extensión válido. Devuelve el path absoluto como texto, o relativo a `relative_to` cuando se proporciona. Esa relación se calcula después de crear el archivo; utiliza un destino que pertenezca a la raíz esperada.

Este ejemplo permite obtener una vista previa del comando sin escribirlo:

```python
from orionis.console.templates.stub import Stub


class CommandTemplatePreview:
    def render(self) -> str:
        return Stub(
            template_name="console_command",
            class_name="sample",
            postfix="Command",
            replacements={
                "signature_literal": repr("app:sample"),
                "description_literal": repr("Example command."),
            },
        ).render()
```

Para crearlo desde un componente que controla explícitamente ese archivo:

```python
from orionis.console.templates.stub import Stub
from orionis.foundation.contracts.application import IApplication


class CommandFileGenerator:
    async def create(self, app: IApplication) -> str:
        template = Stub(
            "console_command", "sample", postfix="Command",
            replacements={
                "signature_literal": repr("app:sample"),
                "description_literal": repr("Example command."),
            },
        )
        return template.create(
            app.path("app_console_commands"), relative_to=app.basePath,
        )
```

La creación es síncrona aunque la llames desde ese método async; para archivos numerosos utiliza una estrategia de ejecución adecuada. El generador CLI incluido delega su escritura a un thread. Esta API de plantillas no sustituye a Storage para los archivos de negocio.

<a id="startup-contexts"></a>

## Contextos de entrada CLI

Estas funciones de infraestructura coordinan el arranque y restauran su contexto al salir. En un proyecto normal las llama el entrypoint; no deben envolver cada comando de aplicación.

| Módulo y función | Resultado y efecto |
| --- | --- |
| `orionis.console.cli.main() -> int` | Entry point síncrono de `orionis`: selecciona la raíz actual, importa `bootstrap.app` y ejecuta `app.handleCommand()` mediante Loop. No inicia un proceso separado. |
| `startup.startup_feedback(arguments: Sequence[str] \| None) -> Generator[None]` | Context manager síncrono de feedback transitorio. Solo muestra el mensaje en terminales interactivos aptos; lo retira al primer contenido de salida o antes del handler. Incluye el contexto de recuperación. |
| `startup.stop_startup_feedback() -> None` | Retira el feedback activo y restaura streams; no hace nada si no está activo. |
| `bootstrap.bootstrap_recovery(arguments: Sequence[str] \| None) -> Generator[None]` | Habilita reparación solo para una invocación exacta soportada de `bootstrap:*`, fuera de ayuda, y restaura el contexto anterior al salir. |
| `bootstrap.recovering_route(context: str) -> bool` | Devuelve si se está reparando ese contexto de rutas (`api`, `ai`, `console`, `web` o `websocket`). |
| `bootstrap.bootstrap_recovery_active() -> bool` | Indica si está activo uno de los contextos de recuperación soportados, incluidos configuración y lifespan. |
| `stdio.protocol_stdio(arguments: Sequence[str] \| None) -> Generator[None]` | Para `mcp:start`, redirige diagnóstico stdout a stderr conservando el primer writer binario del protocolo; para otros comandos deja la salida normal. |
| `stdio.protocol_stdout() -> BinaryIO \| None` | Devuelve el writer binario original dentro de ese contexto, o `None`. |

El feedback se omite con redirección/pipes, CI, terminales no aptos y MCP. Los contextos de protocolo no convierten otros comandos en servidores MCP. Consulta [los comandos de transporte](/es/console/built-in-workers) y [Servidores MCP](/es/mcp) para esa integración.

<a id="coverage"></a>

## Cobertura contrastada con la fuente

El [inventario de Console](/downloads/console-api-inventory.json) relaciona las declaraciones públicas incluidas en esta guía, sus firmas y campos con referencias en ambos idiomas. Registra por separado las exclusiones editoriales acordadas para que no se confundan con funcionalidades documentadas. Conserva un catálogo separado de las 67 firmas CLI con sus argumentos reales. Los detalles internos de implementación de cada comando nativo no se cuentan como una API adicional de aplicación.

El auditor `scripts/audit-console-source.py` contrasta el inventario contra el checkout del framework. La validación del sitio comprueba destinos, anclas y cobertura del catálogo sin requerir dicho checkout en CI. Los métodos privados, exports, API heredada de dependencias y métodos generados automáticamente quedan fuera del conteo de declaraciones propias.
