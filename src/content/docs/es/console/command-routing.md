---
title: "Comandos por rutas de consola"
description: "Registra handlers por clase y método en routes/console.py, con argumentos e inyección de dependencias."
editUrl: true
lastUpdated: false
---

Una ruta de consola registra una firma CLI mediante `Reactor.command()`. Permite exponer una clase y un método sin extender `BaseCommand`. No es una ruta HTTP ni se llama mediante una URL: se ejecuta con el mismo CLI y los mismos códigos de salida que los comandos de clase.

<a id="console-routes"></a>

## Dónde se registran

En `bootstrap/app.py`, la aplicación distribuida incluye:

```python
app.withRouting(console="routes/console.py")
```

Este fragmento sustituye únicamente el argumento `console` de tu configuración completa. También acepta una lista de archivos:

```python
app.withRouting(console=["routes/console.py", "routes/reports.py"])
```

Crea esos archivos dentro del proyecto y configúralos antes de `app.create()`. El loader importa los módulos al construir el registro de comandos. No añadas E/S de negocio al nivel superior del archivo: allí se declara la operación; su ejecución pertenece al handler. Con caché de metadatos válida, la importación de rutas para registrar comandos puede omitirse.

<a id="fluent-construction"></a>

## Registrar una clase invocable

Guarda este módulo en `routes/console.py`:

```python
from orionis.console import Argument, Console
from orionis.support.facades import Reactor


class GreetHandler:
    async def __call__(self, name: str, console: Console) -> int:
        console.writeLine(f"Hello, {name}!")
        return 0


Reactor.command("app:greet-route", GreetHandler).description(
    "Greet through a console route."
).arguments([
    Argument(name_or_flags="name", type_=str),
]).timestamp(enabled=False)
```

```shell
orionis app:greet-route Ada
python -B reactor app:greet-route Ada
```

Pasar la clase directamente selecciona `__call__`. Aunque la anotación del servicio menciona `str`, **una cadena de importación no es un handler admitido por la validación actual**: utiliza una referencia real a la clase. No se admite una función libre como sustituto directo de ese contrato de clase y método.

## Elegir un método y combinar argumentos con DI

Puedes separar la operación del archivo de rutas. Por ejemplo, en `app/services/report_runner.py`:

```python
from orionis.storage.contracts.manager import IStorageManager
from orionis.console import Console


class ReportRunner:
    def __init__(self, storage: IStorageManager) -> None:
        self.storage = storage

    async def run(self, report_id: int, console: Console) -> int:
        await self.storage.disk("local").put(
            f"reports/{report_id}.txt", f"Report {report_id}\n",
        )
        console.success(f"Report {report_id} created.", timestamp=False)
        return 0
```

En `routes/reports.py`:

```python
from app.services.report_runner import ReportRunner
from orionis.console import Argument
from orionis.support.facades import Reactor

Reactor.command("reports:run", [ReportRunner, "run"]).description(
    "Write one report."
).arguments([
    Argument(name_or_flags="report_id", type_=int),
])
```

```shell
orionis reports:run 42
python -B reactor reports:run 42
```

Reactor construye `ReportRunner` por el contenedor e invoca `run(report_id=42, ...)`. Los nombres del parser deben coincidir con los parámetros del método; las otras dependencias anotadas se resuelven por DI. Este mecanismo entrega los valores CLI por nombre porque la clase **no** implementa `IBaseCommand`. Si registras una clase que sí lo implementa, utiliza `getArgument()` como en los comandos convencionales.

<a id="fluent-api"></a>

## API del constructor fluido

`Reactor.command(signature, handler)` devuelve `ICommand`, implementado por `orionis.console.fluent.command.Command`. Las opciones mutan el mismo builder y devuelven `Self`, salvo `get()`.

```text
Command(signature: str, concrete: Callable[..., Any], method: str = "handle")
```

El constructor técnico usa `handle` como método predeterminado. El servicio Reactor lo normaliza a `__call__` cuando recibe una clase directamente o una lista sin método. Valida que `concrete` sea callable, que `method` sea `str` y que exista un método callable con ese nombre; de lo contrario lanza `TypeError` o `AttributeError`. El loader exige además un callable con `__name__`. Utiliza clases importables, cuyos nombres de módulo/clase puedan reconstruirse desde los metadatos.

<a id="fluent-timestamp"></a>

### timestamp(*, enabled: bool = True) -> Self

Habilita o deshabilita los mensajes del ejecutor para el comando. El builder empieza en `True`; un tipo distinto de `bool` produce `TypeError`. El argumento es exclusivamente nombrado: `.timestamp(enabled=False)`.

<a id="fluent-description"></a>

### description(desc: str) -> Self

Sustituye el texto de ayuda; inicialmente es `No description provided.`. Rechaza tipos distintos de `str`. No aplica las mismas comprobaciones de firma y descripción que el descubrimiento de subclases de `BaseCommand`: conserva nombres coherentes y descripciones útiles.

<a id="fluent-arguments"></a>

### arguments(args: list[Argument]) -> Self

Sustituye la lista completa de argumentos; no añade elementos a la anterior. La lista inicial está vacía. Un valor que no sea lista, o que contenga otros tipos, produce `TypeError`. Consulta [argumentos y opciones](/es/console/commands-and-arguments).

<a id="fluent-get"></a>

### get() -> tuple[str, CommandEntity]

Devuelve la firma y la entidad de metadatos con clase, método, timestamps, descripción y argumentos. No ejecuta el comando. El loader consume este resultado y construye el parser. En el uso habitual basta con declarar la cadena de registro; no necesitas llamar a `get()`.

```python
from orionis.console.fluent.command import Command


class HealthHandler:
    async def handle(self) -> int:
        return 0


builder = Command("app:health", HealthHandler)
builder.description("Check application command wiring.")
signature, metadata = builder.get()
assert signature == "app:health"
assert metadata.method == "handle"
```

No agregues registros después de materializar el registro del loader o llamar a `Reactor.info()` esperando una recarga automática. La [caché](/es/console/command-cache) conserva tanto metadatos persistentes como objetos en memoria durante la vida del servicio.
