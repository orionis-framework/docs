---
title: "Workers"
description: "Calcula una recomendación de procesos según CPU, memoria total y presupuesto de RAM por worker."
editUrl: true
lastUpdated: false
---

`Workers` calcula una cantidad orientativa de procesos a partir de la CPU disponible para el proceso y la memoria total detectadas al importar el módulo. Sirve para obtener un valor inicial de concurrencia; no crea workers, no ejecuta trabajos y no supervisa procesos.

## Importación y uso directo

```python
from orionis.support.system import Workers

recommended = Workers.calculate()
assert isinstance(recommended, int)
assert recommended >= 1
```

También es válida la importación desde `orionis.support.system.workers`. Los dos métodos públicos son métodos de clase: no necesitas construir una instancia.

## Presupuesto de memoria

<a id="workers-method-setramperworker"></a>

### `setRamPerWorker`

```python
@classmethod
def setRamPerWorker(cls, ram_per_worker: float) -> None: ...
```

`ram_per_worker` es obligatorio. Indica cuánta memoria presupuestar para cada proceso. Aunque el argumento se describe como GB en el código, la conversión usa `1024 ** 3` bytes: su unidad efectiva es **GiB**. El valor predeterminado es **0,5 GiB**. El presupuesto se convierte a un número entero de bytes.

Devuelve `None` y modifica la configuración de la clase para las llamadas posteriores a `calculate()`. El cambio afecta a todos los consumidores de esa misma clase dentro del proceso; crear otra instancia no lo aísla.

```python
from orionis.support.system import Workers

# Presupuestar 1 GiB por proceso antes de obtener la recomendación.
Workers.setRamPerWorker(1.0)
recommended = Workers.calculate()
assert recommended >= 1

# Restaurar el presupuesto predeterminado del helper.
Workers.setRamPerWorker(0.5)
```

Lanza `ValueError` si el número no es finito, no es positivo o representa menos de un byte después de la conversión. Los valores no numéricos pueden producir `TypeError`; el método no convierte cadenas como `"0.5"`.

```python
from orionis.support.system import Workers

for invalid in (0, -1, float("inf"), float("nan"), 1e-12):
    try:
        Workers.setRamPerWorker(invalid)
    except ValueError:
        pass
    else:
        raise AssertionError("El presupuesto debía ser rechazado")
```

## Cálculo y límites

<a id="workers-method-calculate"></a>

### `calculate`

```python
@classmethod
def calculate(cls) -> int: ...
```

No recibe argumentos y devuelve un entero de al menos uno. La operación equivale a:

```text
CPU = process_cpu_count() o cpu_count() o 1
RAM = memoria total detectada al importar el módulo
presupuesto_bytes = int(presupuesto_GiB * 1024 ** 3)
recomendación = min(CPU, RAM // presupuesto_bytes) o 1
```

La CPU y la RAM quedan en caché al importar el módulo. Cambiar el presupuesto no vuelve a consultar el hardware. La memoria corresponde al total informado por el sistema, no a la memoria libre en ese instante. Tampoco existe un ajuste adicional de cuotas de contenedor en este helper.

El mínimo de uno se mantiene incluso cuando la memoria estimada no alcanza para un worker. Por ello, el resultado es una **heurística de capacidad**, no una garantía de que la carga de trabajo quepa en memoria. Contrástalo con el consumo real de tu aplicación y los límites de su entorno de ejecución.

Una subclase puede separar su presupuesto sin modificar el de `Workers`; sigue utilizando las mismas mediciones de CPU y RAM del módulo:

```python
from orionis.support.system import Workers

class ImportWorkers(Workers):
    __slots__ = ()

ImportWorkers.setRamPerWorker(1.5)
import_processes = ImportWorkers.calculate()
general_processes = Workers.calculate()
assert import_processes >= 1
assert general_processes >= 1
```

## Acceso mediante inyección

La clase concreta `Workers` no requiere argumentos de construcción y el contenedor puede resolverla. En un controlador, por ejemplo:

```python
from orionis.http import JSONResponse
from orionis.support.system import Workers

class CapacityController:
    async def __call__(self, workers: Workers) -> JSONResponse:
        return JSONResponse({"recommended_workers": workers.calculate()})
```

La inyección permite declarar la dependencia, pero los métodos siguen operando sobre la configuración de clase. Para este helper sin estado de instancia, el acceso directo suele ser suficiente.

Si tu servicio depende del contrato `IWorkers`, regístralo explícitamente en un [proveedor](/es/application/container/providers):

```python
from orionis.container.providers import ServiceProvider
from orionis.support.system import Workers
from orionis.support.system.contracts.workers import IWorkers

class CapacityProvider(ServiceProvider):
    def register(self) -> None:
        self.app.transient(IWorkers, Workers)
```

Este binding pertenece a tu aplicación; el módulo no incluye un proveedor que lo registre automáticamente. Registra el proveedor en `bootstrap/app.py` mediante `app.withProviders(CapacityProvider)` antes de solicitar `IWorkers`.

La recomendación no configura por sí sola los workers del servidor HTTP o de las [colas](/es/queues). Utiliza el resultado donde la API del componente correspondiente admita un número de procesos.
