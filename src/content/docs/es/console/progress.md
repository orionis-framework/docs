---
title: "Progreso"
description: "Muestra progreso desde los métodos heredados de BaseCommand y realiza pausas asíncronas."
editUrl: true
lastUpdated: false
---

<a id="console-progressbar"></a>
<a id="progress-bar"></a>
## Crear una barra de progreso

`BaseCommand` ya expone la propiedad heredada `self.progressBar`: **dentro de un comando no necesitas importar ni construir `ProgressBar`**. La propiedad devuelve una nueva instancia en cada acceso, anotada como `IProgressBar`. Guárdala una vez y utiliza esa misma barra durante toda la operación.

Este comando configura sus atributos públicos `total` y `bar_width` antes de empezar:

```python
from orionis.console.base import BaseCommand


class ProcessBatchCommand(BaseCommand):
    signature = "app:process-batch"
    description = "Process a small batch with progress output."

    async def handle(self) -> int:
        records = ["customer-1", "customer-2", "customer-3"]
        if not records:
            self.writeLine("No records to process")
            return 0
        bar = self.progressBar
        bar.total = len(records)
        bar.bar_width = 24
        bar.start()
        for record in records:
            # Replace this pause with the actual asynchronous operation.
            await self.sleep(0.01)
            bar.advance()
        bar.finish()
        self.writeLine(f"Processed {len(records)} records")
        return 0
```

Sin ajustar sus atributos, `self.progressBar` utiliza `total=100` y `bar_width=50`. Repetir `self.progressBar.advance()` construye otra barra en cada iteración; utiliza siempre la referencia guardada en `bar`.

<a id="progress-bar-start"></a>
<a id="progress-bar-advance"></a>
<a id="progress-bar-finish"></a>
## Actualizar y completar

| Firma | Efecto y resultado |
| --- | --- |
| `start() -> None` | Establece el progreso en `0` y dibuja la barra. |
| `advance(increment: int = 1) -> None` | Suma `increment`, limita el resultado superior a `total` y redibuja. |
| `finish() -> None` | Establece el progreso en `total`, redibuja, añade un salto de línea y hace flush. |

Las tres operaciones devuelven `None`. Se puede avanzar por lotes, por ejemplo `bar.advance(25)`. `finish()` muestra 100 % aunque no hayas avanzado todo el trabajo; llámalo cuando la operación realmente termine, no como confirmación de éxito en un `finally` indiscriminado.

<a id="progress-bar-fields"></a>
### Estado público

| Atributo | Valor inicial | Significado |
| --- | --- | --- |
| `total` | El argumento `total`, por defecto `100`. | Trabajo total usado como divisor. |
| `bar_width` | El argumento `width`, por defecto `50`. | Anchura de dibujo en caracteres. |
| `progress` | `0`. | Trabajo acumulado; `start()` lo reinicia. |

Usa enteros positivos para `total` y `width`, e incrementos no negativos. **La implementación no impone esas restricciones**: `total=0` produce `ZeroDivisionError` al dibujar; un incremento negativo puede producir progreso negativo y no hay límite inferior. Tipos incompatibles o errores del stream también se propagan. La barra usa retornos de carro y bloques Unicode, sin comprobar `isatty()`; en logs redirigidos puede conservar esos caracteres. Evita escribir mensajes entre avances de la misma barra si necesitas una salida limpia.

<a id="console-sleep"></a>
## Pausas cooperativas

```text
async sleep(seconds: float) -> None
```

`await self.sleep(seconds)` delega en `asyncio.sleep(seconds)`, cede el control al ciclo de eventos y devuelve `None`. `await self.sleep(0)` permite una cesión sin una espera positiva. No añade una validación o política propia; errores de argumentos y cancelación siguen el comportamiento de asyncio. No hace asíncronas las preguntas o la impresión.

<a id="progress-bar-construction"></a>
## Usar ProgressBar fuera de un comando

En un componente que no extiende `BaseCommand` puedes importar y construir la barra explícitamente. Esta es la alternativa para usos independientes; dentro de un comando conserva el patrón `bar = self.progressBar`.

```text
ProgressBar(total: int = 100, width: int = 50) -> None
```

`total` representa el trabajo que equivale al 100 %; `width` es el número de caracteres. El constructor guarda los métodos de escritura y flush del stdout existente en ese momento. No crea una tarea en segundo plano, no persiste el progreso ni valida los argumentos.

```python
from orionis.console import ProgressBar

bar = ProgressBar(total=3, width=24)
bar.start()
for _ in range(3):
    bar.advance()
bar.finish()
```

Para mostrar resultados desde un comando utiliza los métodos heredados de [texto y tablas](/es/console/console-output); para solicitar información al usuario consulta [preguntas y entrada interactiva](/es/console/interactive-input).
