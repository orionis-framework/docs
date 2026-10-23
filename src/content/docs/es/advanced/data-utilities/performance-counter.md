---
title: "PerformanceCounter"
description: "Mide intervalos síncronos y asíncronos con contextos, conversión de unidades e inyección de dependencias."
editUrl: true
lastUpdated: false
---

`PerformanceCounter` mide el tiempo transcurrido entre un inicio y una parada mediante `time.perf_counter()`. Úsalo para medir una consulta, una transformación o una operación de un servicio. Mide duración transcurrida, incluidas las esperas; no representa exclusivamente consumo de CPU.

## Crear y medir

<a id="performancecounter-method-init"></a>

```python
from orionis.support.performance import PerformanceCounter

counter = PerformanceCounter()
counter.start()
total = sum(range(100))
counter.stop()

assert total == 4950
assert counter.getMilliseconds() >= 0
```

`__init__(self) -> None` no recibe configuración. Cada instancia conserva un inicio, un resultado y el modo de medición. También puedes importar la clase desde `orionis.support.performance.counter`. No necesita inicializar la aplicación para usarla directamente.

## Inicio, parada y reinicio

Todos estos métodos carecen de argumentos adicionales y devuelven **la misma instancia** para facilitar el encadenamiento. Las firmas siguientes conservan los nombres y retornos de la implementación.

<a id="performancecounter-method-start"></a>
<a id="performancecounter-method-stop"></a>
<a id="performancecounter-method-restart"></a>

### Medición síncrona

```python
def start(self) -> PerformanceCounter: ...
def stop(self) -> PerformanceCounter: ...
def restart(self) -> PerformanceCounter: ...
```

`start()` registra un nuevo inicio en modo síncrono y borra el resultado anterior. `stop()` calcula la diferencia respecto a ese inicio. `restart()` descarta la medición anterior y comienza otra en modo síncrono; funciona incluso en una instancia que todavía no se haya iniciado.

```python
from orionis.support.performance import PerformanceCounter

counter = PerformanceCounter().start()
first_total = sum(range(100))
assert counter.stop() is counter
first_seconds = counter.elapsedTime()

assert counter.restart() is counter
second_total = sum(range(200))
counter.stop()
assert first_total == 4950 and second_total == 19900
assert first_seconds >= 0 and counter.elapsedTime() >= 0
```

`stop()` antes del inicio lanza `ValueError`. Después de `astart()` o `arestart()`, lanza `RuntimeError`: debes usar `astop()`. Una segunda llamada a `stop()` vuelve a calcular la diferencia desde el mismo inicio; no congela el primer resultado. Para una medición distinta, vuelve a iniciar.

<a id="performancecounter-method-astart"></a>
<a id="performancecounter-method-astop"></a>
<a id="performancecounter-method-arestart"></a>

### Medición asíncrona

```python
async def astart(self) -> PerformanceCounter: ...
async def astop(self) -> PerformanceCounter: ...
async def arestart(self) -> PerformanceCounter: ...
```

Se usan con `await`. `astart()` registra el inicio y elimina el resultado anterior en modo asíncrono. `astop()` guarda la duración; `arestart()` descarta el intervalo anterior e inicia otro en ese mismo modo. No realizan E/S: sus firmas asíncronas permiten integrarlos en flujos asíncronos.

```python
from orionis.http import JSONResponse
from orionis.support.performance import PerformanceCounter

class MeasurementController:
    async def __call__(self) -> JSONResponse:
        counter = PerformanceCounter()
        await counter.astart()
        first_total = sum(range(100))
        await counter.astop()
        first_seconds = await counter.aelapsedTime()

        await counter.arestart()
        second_total = sum(range(200))
        await counter.astop()
        return JSONResponse({
            "totals": [first_total, second_total],
            "first_seconds": first_seconds,
            "second_seconds": await counter.agetSeconds(),
        })
```

En una instancia nueva, o después de un inicio síncrono, `astop()` lanza `RuntimeError` porque el modo no es asíncrono. No mezcles las parejas `start()/stop()` y `astart()/astop()`. Un nuevo inicio o reinicio sí puede cambiar explícitamente de modo.

## Leer el resultado y convertir unidades

Los diez lectores no reciben argumentos y devuelven un `float`. Todos requieren un intervalo **iniciado y detenido**: antes de la parada, o después de reiniciar sin detener de nuevo, lanzan `ValueError`. No permiten consultar una medición en curso.

<a id="performancecounter-method-elapsedtime"></a>
<a id="performancecounter-method-getmicroseconds"></a>
<a id="performancecounter-method-getmilliseconds"></a>
<a id="performancecounter-method-getseconds"></a>
<a id="performancecounter-method-getminutes"></a>

### Lectores síncronos

```python
def elapsedTime(self) -> float: ...
def getMicroseconds(self) -> float: ...
def getMilliseconds(self) -> float: ...
def getSeconds(self) -> float: ...
def getMinutes(self) -> float: ...
```

| Método | Resultado a partir del intervalo almacenado |
| --- | --- |
| `elapsedTime()` | Segundos, sin conversión. |
| `getMicroseconds()` | Segundos multiplicados por `1_000_000`. |
| `getMilliseconds()` | Segundos multiplicados por `1_000`. |
| `getSeconds()` | Segundos, igual a `elapsedTime()`. |
| `getMinutes()` | Segundos divididos entre `60`. |

```python
from orionis.support.performance import PerformanceCounter

with PerformanceCounter() as counter:
    result = sum(range(100))

seconds = counter.elapsedTime()
assert counter.getSeconds() == seconds
assert counter.getMicroseconds() == seconds * 1_000_000
assert counter.getMilliseconds() == seconds * 1_000
assert counter.getMinutes() == seconds / 60
```

<a id="performancecounter-method-aelapsedtime"></a>
<a id="performancecounter-method-agetmicroseconds"></a>
<a id="performancecounter-method-agetmilliseconds"></a>
<a id="performancecounter-method-agetseconds"></a>
<a id="performancecounter-method-agetminutes"></a>

### Lectores asíncronos

```python
async def aelapsedTime(self) -> float: ...
async def agetMicroseconds(self) -> float: ...
async def agetMilliseconds(self) -> float: ...
async def agetSeconds(self) -> float: ...
async def agetMinutes(self) -> float: ...
```

Devuelven las mismas unidades y aplican las mismas conversiones que sus equivalentes síncronos. Debes esperarlos con `await`. El modo restringe la pareja de inicio/parada, no los lectores: un resultado detenido puede leerse con cualquiera de las dos familias.

```python
from orionis.http import JSONResponse
from orionis.support.performance import PerformanceCounter

class TimingController:
    async def __call__(self) -> JSONResponse:
        async with PerformanceCounter() as counter:
            total = sum(range(100))

        return JSONResponse({
            "total": total,
            "elapsed": await counter.aelapsedTime(),
            "microseconds": await counter.agetMicroseconds(),
            "milliseconds": await counter.agetMilliseconds(),
            "seconds": await counter.agetSeconds(),
            "minutes": await counter.agetMinutes(),
        })
```

## Gestores de contexto

<a id="performancecounter-method-enter"></a>
<a id="performancecounter-method-exit"></a>
<a id="performancecounter-method-aenter"></a>
<a id="performancecounter-method-aexit"></a>

```python
def __enter__(self) -> Self: ...
def __exit__(
    self,
    exc_type: type[BaseException] | None,
    exc_val: BaseException | None,
    exc_tb: TracebackType | None,
) -> None: ...
async def __aenter__(self) -> Self: ...
async def __aexit__(
    self,
    exc_type: type[BaseException] | None,
    exc_val: BaseException | None,
    exc_tb: TracebackType | None,
) -> None: ...
```

`with` ejecuta `start()` al entrar y `stop()` al salir. `async with` espera `astart()` y `astop()`. Ambos devuelven la misma instancia en la entrada. Python proporciona a los métodos de salida el tipo, valor y traceback de la excepción, o tres `None` si el bloque termina normalmente; no necesitas invocarlos manualmente.

Los métodos de salida devuelven `None`: **no suprimen las excepciones**. La duración queda registrada al salir también cuando el bloque falla, siempre que no hayas cambiado su modo dentro del contexto.

```python
from orionis.support.performance import PerformanceCounter

counter = PerformanceCounter()
try:
    with counter:
        raise ValueError("Importación inválida")
except ValueError:
    assert counter.getSeconds() >= 0
```

Utiliza una instancia por medición. Anidar contextos o realizar mediciones concurrentes con el mismo contador sobrescribe su inicio y resultado.

## Inyección de dependencias

El contenedor puede construir la clase concreta sin argumentos e inyectarla en un constructor o una acción. Este controlador conserva la dependencia mediante el constructor y utiliza el contexto asíncrono:

```python
from orionis.http import JSONResponse
from orionis.support.performance import PerformanceCounter

class ReportController:
    def __init__(self, counter: PerformanceCounter) -> None:
        self.counter = counter

    async def __call__(self) -> JSONResponse:
        async with self.counter:
            total = sum(range(100))
        return JSONResponse({
            "total": total,
            "duration_ms": self.counter.getMilliseconds(),
        })
```

Para depender de `IPerformanceCounter`, declara tu binding explícitamente:

```python
from orionis.container.providers import ServiceProvider
from orionis.support.performance import PerformanceCounter
from orionis.support.performance.contracts.counter import IPerformanceCounter

class TimingProvider(ServiceProvider):
    def register(self) -> None:
        self.app.transient(IPerformanceCounter, PerformanceCounter)
```

Registra `TimingProvider` con `app.withProviders(TimingProvider)` en `bootstrap/app.py`; después puedes anotar la dependencia con `IPerformanceCounter`. No existe un binding nativo automático para ese contrato. El ciclo transitorio evita compartir el estado de una medición entre consumidores distintos. Una misma instancia sigue sin admitir mediciones simultáneas.

Consulta [inyección y ciclos de vida](/es/architecture/service-container/bindings-and-invocation) para registrar implementaciones alternativas. El contador no imprime resultados, no persiste métricas ni agrega varias muestras; utiliza sus valores de retorno para construir ese comportamiento en tu aplicación.
