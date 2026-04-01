---
title: Eventos de Ciclo de Vida
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Eventos de Ciclo de Vida

Orionis Framework proporciona un sistema de eventos de ciclo de vida (lifespan) que permite registrar funciones para ejecutar durante el **arranque** y la **detención** de la aplicación en el runtime CLI. Esto brinda un punto de entrada limpio para la lógica de inicialización y limpieza que se ejecuta antes y después de cada comando de consola.

---

## Qué Son los Eventos de Ciclo de Vida

Un evento de ciclo de vida es un hook que se dispara en uno de dos momentos críticos del ciclo de vida de la aplicación:

| Evento | Cuándo se Dispara |
|---|---|
| **Startup** | Inmediatamente después de que la aplicación arranca y antes de que cualquier comando sea procesado. |
| **Shutdown** | Inmediatamente después de que la lógica del comando finaliza y antes de que el proceso termine. |

Estos eventos están representados por el enum `Lifespan`:

```python
from orionis.foundation.enums.lifespan import Lifespan

Lifespan.STARTUP   # "lifespan.startup"
Lifespan.SHUTDOWN   # "lifespan.shutdown"
```

---

---

## Registro de Callbacks de Ciclo de Vida

Los callbacks se registran en la instancia de `Application` usando el método `on()` en el archivo `bootstrap/app.py`. Es posible registrar múltiples callbacks para el mismo evento en una sola llamada, y se soportan tanto funciones síncronas como asíncronas.

### Registro Básico

```python
from orionis.foundation.enums.lifespan import Lifespan
from orionis.foundation.enums.runtimes import Runtime

def on_startup():
    print("La aplicación está arrancando...")

def on_shutdown():
    print("La aplicación se está deteniendo...")

app.on(
    Lifespan.STARTUP,
    on_startup,
    runtime=Runtime.CLI,  # Acotado al contexto de ejecución CLI
)

app.on(
    Lifespan.SHUTDOWN,
    on_shutdown,
    runtime=Runtime.CLI,
)
```

### Múltiples Callbacks

Pasa múltiples funciones en una sola llamada. Todas se ejecutarán durante el evento especificado:

```python
def init_cache():
    print("Inicializando cache...")

def init_connections():
    print("Abriendo conexiones a base de datos...")

app.on(
    Lifespan.STARTUP,
    init_cache, init_connections,
    runtime=Runtime.CLI,
)
```

### Callbacks con Lambda

Los lambdas son callbacks válidos para lógica concisa e inline:

```python
app.on(
    Lifespan.SHUTDOWN,
    lambda: print("¡Adiós!"),
    runtime=Runtime.CLI,
)
```

### Callbacks Asíncronos

Las funciones asíncronas son completamente soportadas y se ejecutan con await:

```python
async def warm_up_cache():
    # Lógica de inicialización asíncrona
    ...

app.on(
    Lifespan.STARTUP,
    warm_up_cache,
    runtime=Runtime.CLI,
)
```

---

## Flujo de Ejecución

Cuando se ejecuta un comando CLI (ej. `python -B reactor list`), el framework sigue esta secuencia:

```
1. La aplicación arranca y carga la configuración
2. El kernel CLI se inicializa
3. ✅ Se ejecutan los callbacks de STARTUP
4. Se ejecuta la lógica del comando
5. ✅ Se ejecutan los callbacks de SHUTDOWN
6. El proceso finaliza
```

Cada invocación de comando desencadena el ciclo completo de startup → ejecución → shutdown. Esto garantiza que los recursos se inicialicen y liberen adecuadamente en cada operación.

---

## Eventos de Ciclo de Vida vs. Eventos del Scheduler

El programador de tareas (scheduler) de Orionis tiene su propio sistema de eventos con listeners `onStarted` y `onShutdown`. Aunque los nombres son similares, operan en capas diferentes:

| Aspecto | Eventos de Ciclo de Vida | Eventos del Scheduler |
|---|---|---|
| **Alcance** | Ciclo de vida completo de la aplicación | Ciclo de vida del servicio scheduler |
| **Registro** | `app.on(Lifespan.STARTUP, ...)` | Clase listener del scheduler |
| **STARTUP se dispara** | Antes de cualquier lógica de la aplicación | Cuando el scheduler inicia su ciclo, antes de ejecutar cualquier tarea |
| **SHUTDOWN se dispara** | Después de que toda la lógica de la aplicación finaliza | Cuando el scheduler se detiene controladamente, antes de devolver el control |

Al combinar ambos, el orden de ejecución para una ejecución de tareas programadas es:

```
1. Callbacks de Lifespan STARTUP
2. Listener onStarted del Scheduler
3. Las tareas programadas se ejecutan...
4. Listener onShutdown del Scheduler
5. Callbacks de Lifespan SHUTDOWN
```

Este diseño por capas permite separar las preocupaciones a **nivel de aplicación** (conexiones a base de datos, configuración del entorno) de las preocupaciones a **nivel de scheduler** (logging de estado de tareas, pool de recursos para jobs).

---

## Ejemplo Práctico

Una configuración típica de `bootstrap/app.py` combinando eventos de ciclo de vida con otra configuración de la aplicación:

```python
from pathlib import Path
from orionis.foundation.application import Application
from orionis.foundation.enums.lifespan import Lifespan
from orionis.foundation.enums.runtimes import Runtime
from app.providers.app_service_provider import AppServiceProvider

app = Application(
    base_path=Path(__file__).parent.parent,
)

# Configurar rutas
app.withRouting(
    console="routes/console.py",
)

# Registrar proveedores
app.withProviders(
    AppServiceProvider,
)

# Eventos de ciclo de vida para CLI
def on_startup():
    print("Inicializando recursos CLI...")

app.on(
    Lifespan.STARTUP,
    on_startup,
    runtime=Runtime.CLI,
)

app.on(
    Lifespan.SHUTDOWN,
    lambda: print("Recursos CLI liberados."),
    runtime=Runtime.CLI,
)

# Arrancar la aplicación
app.create()
```

---

## Referencia del Método

### `app.on()`

Registra uno o más callbacks para un evento de ciclo de vida.

**Firma:**

```python
app.on(
    lifespan: Lifespan,
    *callbacks: Callable,
    runtime: Runtime | None = None,
) -> Self
```

**Parámetros:**

| Parámetro | Tipo | Descripción |
|---|---|---|
| `lifespan` | `Lifespan` | El evento al que vincular callbacks (`STARTUP` o `SHUTDOWN`). |
| `*callbacks` | `Callable` | Una o más funciones (síncronas o asíncronas) a ejecutar. |
| `runtime` | `Runtime \| None` | Contexto de ejecución. Use `Runtime.CLI` para comandos de consola. |

**Excepciones:**

| Excepción | Condición |
|---|---|
| `TypeError` | `lifespan` no es un miembro del enum `Lifespan`, o un callback no es callable. |
| `ValueError` | No se proporcionan callbacks. |

**Retorna:** La instancia de la aplicación (`Self`) para encadenamiento de métodos.
