---
title: Workers
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Workers

Orionis incluye una utilidad consciente de los recursos del sistema que calcula el número máximo de procesos worker que tu aplicación puede ejecutar de forma segura en paralelo. En lugar de depender de un valor fijo o un simple conteo de CPUs, el calculador `Workers` evalúa **tanto los núcleos de CPU como la RAM disponible**, asegurando que ninguno de los dos recursos se sobrecomprometa.

Este valor se utiliza durante el arranque (bootstrap) de la aplicación para validar la configuración de `APP_WORKERS`, y también está disponible para uso directo cuando necesites determinar límites seguros de paralelismo — colas de tareas, procesadores por lotes, trabajos programados, etc.

---

## Inicio Rápido

```python
from orionis.services.system.workers import Workers

calculator = Workers()
max_workers = calculator.calculate()

print(f"Esta máquina puede ejecutar hasta {max_workers} workers de forma segura.")
```

---

## Cómo Funciona

El cálculo sigue una fórmula simple pero efectiva:

```text
workers = min(núcleos CPU, ⌊ RAM total (GB) / RAM por worker (GB) ⌋)
```

El resultado siempre es un entero. Este enfoque previene dos problemas comunes en despliegues:

| Problema | Causa | Cómo lo Previene Workers |
|---|---|---|
| Saturación de CPU | Más procesos que núcleos | Limita el resultado al número de núcleos físicos |
| Agotamiento de memoria | Procesos compitiendo por RAM | Limita el resultado según la memoria disponible |

---

## Crear una Instancia

```python
from orionis.services.system.workers import Workers

# Por defecto: 0.5 GB por worker
calculator = Workers()

# Personalizado: 2 GB por worker (ej. cargas de trabajo de ML)
calculator = Workers(ram_per_worker=2.0)
```

| Parámetro | Tipo | Por Defecto | Descripción |
|---|---|---|---|
| `ram_per_worker` | `float` | `0.5` | Cantidad de RAM en gigabytes asignada por cada proceso worker. |

El constructor detecta automáticamente el número de núcleos de CPU y la RAM total del sistema en el momento de la instanciación.

---

## Referencia de la API

### `calculate`

Devuelve el número máximo de workers que pueden ejecutarse de forma segura en paralelo.

```python
max_workers = calculator.calculate()
```

| Retorno | Tipo | Descripción |
|---|---|---|
| Máximo de workers | `int` | El menor entre el límite basado en CPU y el basado en RAM. |

#### Ejemplos

```python
from orionis.services.system.workers import Workers

# En una máquina con 4 núcleos y 8 GB de RAM

# Por defecto (0.5 GB/worker): min(4, floor(8/0.5)) = min(4, 16) = 4
Workers().calculate()  # 4

# Cargas pesadas (4 GB/worker): min(4, floor(8/4)) = min(4, 2) = 2
Workers(ram_per_worker=4.0).calculate()  # 2

# Tareas ligeras (0.1 GB/worker): min(4, floor(8/0.1)) = min(4, 80) = 4
Workers(ram_per_worker=0.1).calculate()  # 4
```

### `setRamPerWorker`

Actualiza la asignación de RAM por worker sin necesidad de crear una nueva instancia.

```python
calculator.setRamPerWorker(2.0)
new_max = calculator.calculate()
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `ram_per_worker` | `float` | Nueva asignación de RAM en GB por worker. |

Esto es útil cuando necesitas recalcular el límite para diferentes perfiles de carga dentro del mismo proceso.

---

## Integración con la Configuración de la Aplicación

La forma principal en que la mayoría de las aplicaciones interactúan con los límites de workers es a través del archivo de configuración `config/app.py` y la variable de entorno `APP_WORKERS`.

### Variable de Entorno

Establece el número deseado de workers en tu archivo `.env`:

```ini
APP_WORKERS=4
```

:::tip[Conversión automática de tipos]
Orionis lee `APP_WORKERS` a través de su sistema de entorno, que **convierte automáticamente** el valor a `int` — sin necesidad de conversión manual. Esto es parte del motor de casting dinámico de Orionis, que va mucho más allá de la simple lectura de cadenas de texto.
:::

### Archivo de Configuración

En `config/app.py`, el número de workers se declara como un campo que lee del entorno:

```python
from orionis.services.environment.env import Env

workers: int = field(
    default_factory=lambda: Env.get("APP_WORKERS", 1),
)
```

Si `APP_WORKERS` no está definida, el valor por defecto es **1 worker**.

### Validación en el Bootstrap

Durante el arranque de la aplicación, Orionis **valida automáticamente** que el número configurado de workers no exceda la capacidad del sistema. Si estableces `APP_WORKERS=16` en una máquina que solo puede manejar 4 workers, el framework lanza un `ValueError`:

```
ValueError: The 'workers' attribute must be between 1 and 4.
```

Esta validación utiliza `Workers().calculate()` internamente para determinar el límite superior seguro, protegiéndote de un sobrecompromiso accidental de recursos en producción.

---

## Casos de Uso Prácticos

### Escalar una Cola de Tareas

```python
from orionis.services.system.workers import Workers

calculator = Workers(ram_per_worker=1.0)
pool_size = calculator.calculate()

# Usa pool_size para configurar la concurrencia de tu cola de tareas
```

### Asignación Condicional de Recursos

```python
from orionis.services.system.workers import Workers

calculator = Workers()

# Tareas ligeras
calculator.setRamPerWorker(0.25)
light_workers = calculator.calculate()

# Tareas pesadas
calculator.setRamPerWorker(4.0)
heavy_workers = calculator.calculate()

print(f"Pool ligero: {light_workers}, Pool pesado: {heavy_workers}")
```

### Despliegue Adaptado al Entorno

Combina `Workers` con la detección de entorno para adaptarse automáticamente:

```python
from orionis.services.system.workers import Workers
from orionis.services.environment.env import Env

env = Env.get("APP_ENV", "development")

ram_allocation = 0.25 if env == "development" else 1.0
max_workers = Workers(ram_per_worker=ram_allocation).calculate()
```
