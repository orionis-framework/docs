---
title: "Debug"
description: "Inspecciona valores con Debug.dump() y Debug.dd(), con salida en consola o una página de diagnóstico HTTP."
editUrl: true
lastUpdated: false
---

Desde Orionis **1.0.12**, la fachada `Debug` permite inspeccionar uno o varios valores mediante el servicio de volcado integrado:

```python
from orionis.support.facades import Debug

data = {"report_id": 7, "status": "ready"}
Debug.dump(data)
Debug.dd(data)
```

`dump()` imprime los valores y continúa. `dd()` muestra los valores e interrumpe la ejecución según el contexto. Ninguno devuelve los datos inspeccionados ni una respuesta que debas retornar desde el controlador.

## Disponibilidad y llamadas síncronas

Usa `Debug` después de completar el arranque de la aplicación. El proveedor integrado `DumperProvider` registra `IDumper` como singleton y fija la fachada durante `boot()`: no necesitas registrar un proveedor propio ni llamar a `Debug.pin()` en tu aplicación.

Los dos métodos son **síncronos**, también dentro de un controlador `async`. Llámalos sin `await`:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Debug


class ReportController:
    async def show(self) -> JSONResponse:
        data = {"report_id": 7, "status": "ready"}
        Debug.dump(data, show_types=True)
        return JSONResponse(data)
```

El cliente recibe la respuesta JSON habitual; el volcado aparece en la consola del servidor. Antes del arranque, usa el helper autónomo descrito más abajo. Consulta [Fachadas síncronas y asíncronas](/es/application/container/facades) para el despacho general de fachadas.

## `dump()`: inspeccionar y continuar

<a id="debug-method-dump"></a>

`Debug.dump(*args, ...) -> None` acepta varios valores posicionales, imprime su representación en consola y devuelve `None`. Conserva la ejecución del comando o de la petición HTTP y no modifica su respuesta.

```python
from orionis.support.facades import Debug

Debug.dump(
    {"report_id": 7},
    ["api", "web"],
    show_types=True,
    show_index=True,
    max_depth=3,
)
```

## `dd()`: inspeccionar y detener

<a id="debug-method-dd"></a>

`Debug.dd(*args, ...) -> None` acepta los mismos valores y opciones que `dump()`. Su efecto depende del contexto:

| Contexto | Resultado |
| --- | --- |
| Despacho HTTP con `app.debug=True` | Interrumpe la petición y el kernel devuelve una página HTML con los valores. El servidor continúa atendiendo otras peticiones. Funciona en ASGI y RSGI. |
| Despacho HTTP con `app.debug=False` | El kernel rechaza el volcado como `RuntimeError` y lo envía al manejador habitual de errores, sin renderizar los valores. |
| Consola o ejecución fuera del contexto HTTP | Imprime en consola y termina el proceso con código `1`. |

Por ejemplo, durante una petición de desarrollo:

```python
from orionis.support.facades import Debug


class ReportController:
    async def show(self) -> None:
        data = {"report_id": 7, "status": "ready"}
        Debug.dd(data, show_types=True)
```

La página de diagnóstico incluye el archivo y la línea de llamada, y utiliza `Cache-Control: no-store`. No necesitas `return Debug.dd(...)`: el kernel gestiona la interrupción y la respuesta HTML. Deja que esa interrupción llegue al kernel si tu código captura excepciones.

El volcado HTTP debe ocurrir durante el despacho de la petición, antes de iniciar el envío de la respuesta. No lo uses dentro de un generador de streaming cuando ya se esté transmitiendo el cuerpo. Fuera del límite de captura HTTP se propaga como un error de ejecución.

En la configuración habitual, `APP_DEBUG` alimenta `app.debug`. Desactivar el modo debug bloquea la página HTML de `dd()`; `dump()` sigue escribiendo en consola. Usa estas llamadas temporalmente con datos adecuados para su destino.

## Opciones compartidas

Todas las opciones se pasan por nombre a `dump()` o `dd()`:

| Opción | Valor predeterminado | Efecto |
| --- | --- | --- |
| `show_types: bool` | `False` | Incluye el tipo de cada valor. |
| `show_index: bool` | `False` | Numera los valores recibidos. |
| `expand_all: bool` | `True` | Expande las estructuras anidadas. |
| `max_depth: int \| None` | `None` | Limita la profundidad; `None` no impone límite. |
| `module_path: str \| None` | `None` | Sustituye el archivo o módulo mostrado en la cabecera. En `dd()` HTTP se detecta el archivo del llamador si se omite. |
| `line_number: int \| None` | `None` | Sustituye la línea mostrada. En `dd()` HTTP se detecta la línea de llamada si se omite. |
| `redirect_output: bool` | `False` | Activa el manejo de los streams originales de consola. No cambia el destino HTML de `dd()` HTTP. |
| `insert_line: bool` | `False` | Añade separación alrededor del volcado. |

Con `dd()` fuera de HTTP, `redirect_output=False` termina mediante `sys.exit(1)` y `redirect_output=True` utiliza `os._exit(1)`, que finaliza inmediatamente el proceso.

## Scripts y depuración durante el arranque

El helper `Dumper` conserva la misma API síncrona y puede utilizarse directamente sin inicializar el contenedor:

```python
from orionis.console import Dumper

Dumper.dump({"phase": "bootstrap"})
```

`Dumper` sigue exportándose desde `orionis.console`; la nueva exportación de `orionis.support.facades` se llama `Debug`. Para integrar el servicio mediante inyección, el contrato es `orionis.console.debug.contracts.dumper.IDumper`.

El global de plantillas [`dump(*values)`](/es/views/globals#dumpvalues) devuelve HTML para insertarlo en la vista; es una API distinta de `Debug.dump()`, que escribe en consola.

Implementación: [Debug](https://github.com/orionis-framework/framework/blob/64fd20a92/orionis/support/facades/debug.py), [Dumper](https://github.com/orionis-framework/framework/blob/64fd20a92/orionis/console/debug/dumper.py) y [DumperProvider](https://github.com/orionis-framework/framework/blob/64fd20a92/orionis/console/debug/provider.py).
