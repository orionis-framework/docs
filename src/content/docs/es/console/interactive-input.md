---
title: "Preguntas y entrada interactiva"
description: "Cómo leer texto, secretos, confirmaciones y selecciones desde un comando Orionis."
editUrl: true
lastUpdated: false
---

`BaseCommand` hereda los métodos de entrada de `Console` / `IConsole`. Dentro del comando llama directamente a `self.ask()`, `self.confirm()`, `self.secret()`, `self.choice()` o `self.anticipate()`; no necesitas importar ni instanciar `Console`. Son llamadas síncronas a stdin: bloquean mientras esperan al usuario, incluso dentro de `async handle()`. No incluyen validación de negocio ni una opción global de ejecución sin interacción. Para automatización, expón argumentos u opciones y pregunta únicamente cuando el usuario no los haya proporcionado.

<a id="console-ask"></a>
## Texto: `ask()`

```text
ask(question: str) -> str
```

Muestra `question.strip()` en color informativo y devuelve la entrada de `input()` como `str`. El salto de línea de la entrada se elimina, pero los demás espacios permanecen. Acepta una respuesta vacía. No convierte números, no repite preguntas ni recibe un valor predeterminado.

```python
from orionis.console.base import BaseCommand


class GreetCommand(BaseCommand):
    signature = "app:greet-interactively"
    description = "Ask for a name and greet the user."

    async def handle(self) -> int:
        name = self.ask("Your name:").strip()
        if not name:
            self.error("A name is required")
            return 1
        self.writeLine(f"Hello, {name}!")
        return 0
```

La normalización y comprobación de `name` pertenecen al comando. Un `EOFError` por entrada cerrada o un `KeyboardInterrupt` no son capturados por `ask()`.

<a id="console-confirm"></a>
## Confirmaciones: `confirm()`

```text
confirm(question: str, *, default: bool = False) -> bool
```

Devuelve `default` al pulsar Enter sin texto. En los demás casos convierte la respuesta a mayúsculas y devuelve `True` únicamente para `Y` o `YES`; cualquier otra entrada devuelve `False`. No vuelve a preguntar. Los espacios no se recortan: `" yes "` no es una confirmación afirmativa. El indicador mostrado es siempre `(Y/n)`, incluso con `default=False`; utiliza el argumento como referencia del comportamiento efectivo.

```python
from orionis.console.base import BaseCommand


class ConfirmReportCommand(BaseCommand):
    signature = "app:confirm-report"
    description = "Confirm whether to prepare a report."

    async def handle(self) -> int:
        if not self.confirm("Prepare the report?", default=False):
            self.writeLine("No report was requested")
            return 0
        self.writeLine("Report preparation confirmed")
        return 0
```

`question` debe ser texto y `default` un booleano; no hay comprobación de tipos adicional. Los errores de stdin se propagan.

<a id="console-secret"></a>
## Entrada oculta: `secret()`

```text
secret(question: str) -> str
```

Construye el prompt con `question.strip()` y delega en `getpass.getpass()`. Devuelve el texto introducido, sin una validación de longitud ni un valor predeterminado. Es útil para leer una credencial sin escribirla explícitamente en la salida del comando.

```python
from orionis.console.base import BaseCommand


class CheckCredentialCommand(BaseCommand):
    signature = "app:check-credential"
    description = "Check whether a credential was provided."

    async def handle(self) -> int:
        credential = self.secret("API credential:")
        if not credential:
            self.error("A credential is required")
            return 1
        self.success("Credential received")
        return 0
```

El ocultamiento depende del terminal y del comportamiento de `getpass`: si no puede desactivar el eco, puede advertir y recurrir a entrada normal. Orionis no añade cifrado, almacenamiento ni redacción automática de esa cadena. Los errores de lectura y la interrupción del usuario se propagan.

<a id="console-choice"></a>
## Elegir un elemento: `choice()`

```text
choice(question: str, choices: list, default_index: int = 0) -> str
```

`choices` debe contener las opciones de texto. `default_index` es el índice **desde cero** que selecciona Enter; el menú visible enumera las opciones **desde uno**. La función devuelve el elemento seleccionado, no su índice.

Si la entrada no es un número válido dentro del rango, repite `Please select a valid number:` hasta obtenerlo. Solo la primera entrada vacía selecciona el valor predeterminado; una entrada vacía durante la repetición sigue siendo inválida. No permite selección múltiple ni selección por nombre.

```python
from orionis.console.base import BaseCommand


class ChooseReportCommand(BaseCommand):
    signature = "app:choose-report"
    description = "Choose an output format."

    async def handle(self) -> int:
        output_format = self.choice(
            "Report format",
            ["csv", "json", "html"],
            default_index=1,
        )
        self.writeLine(f"Selected format: {output_format}")
        return 0
```

Lanza `ValueError` si `choices` está vacío o si `default_index` queda fuera de rango. Tipos incompatibles o errores de stdin se propagan. Aunque la anotación indica `str`, la implementación devuelve directamente el elemento de la lista; utiliza cadenas para mantener ese contrato.

<a id="console-anticipate"></a>
## Completar un prefijo: `anticipate()`

```text
anticipate(question: str, options: list, default: None = None) -> str
```

Lee una cadena y devuelve la **primera** opción cuyo `startswith(entrada)` sea verdadero, respetando el orden y las mayúsculas. Si no hay coincidencias, devuelve `default or entrada`. No ofrece un menú dinámico mientras se escribe, no comprueba unicidad y no restringe la respuesta a la lista.

La firma declara `default: None`, aunque la implementación utiliza ese valor como fallback. Con el valor predeterminado `None`, una entrada sin coincidencias se devuelve intacta. Una entrada vacía coincide con cualquier cadena: si la lista no está vacía, obtiene su primer elemento.

```python
from orionis.console.base import BaseCommand


class SuggestRegionCommand(BaseCommand):
    signature = "app:suggest-region"
    description = "Complete a region name from its prefix."

    async def handle(self) -> int:
        regions = ["europe", "europe-west", "america"]
        region = self.anticipate("Region prefix:", regions)
        if region not in regions:
            self.error("Choose a supported region")
            return 1
        self.writeLine(f"Selected region: {region}")
        return 0
```

`eu` selecciona `europe`, no solicita desambiguación; `America` no coincide con `america`. Con `options=[]` devuelve la entrada o el fallback. Las opciones deben admitir `.startswith(str)`; los errores de tipo y de lectura se propagan.

<a id="input-testing"></a>
## Pruebas de entrada fuera de un comando

Fuera de un comando, una prueba puede construir `Console` de manera explícita para verificar el componente de entrada. Puedes sustituir stdin y `getpass` sin esperar interacción real. Este ejemplo comprueba la distinción entre respuesta vacía, confirmación afirmativa y espacios:

```python
from unittest import TestCase
from unittest.mock import patch
from orionis.console import Console


class InputTest(TestCase):
    def test_confirm(self) -> None:
        console = Console()
        with patch("builtins.input", return_value=""):
            self.assertFalse(console.confirm("Continue?", default=False))
        with patch("builtins.input", return_value="yes"):
            self.assertTrue(console.confirm("Continue?"))
        with patch("builtins.input", return_value=" yes "):
            self.assertFalse(console.confirm("Continue?"))

    def test_secret(self) -> None:
        with patch("getpass.getpass", return_value="example-secret"):
            self.assertEqual(Console().secret("Credential:"), "example-secret")
```

Para procesos no interactivos utiliza los [argumentos y opciones](/es/console/commands-and-arguments). Para presentar el resultado consulta [texto y tablas](/es/console/console-output).
