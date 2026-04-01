---
title: PerformanceCounter
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# PerformanceCounter

`PerformanceCounter` es un temporizador de alta resolución para medir el tiempo de ejecución de código. Envuelve `time.perf_counter` de Python (síncrono) y el reloj del event loop (asíncrono) detrás de una API limpia y fluida. Cada método retorna la propia instancia para permitir encadenamiento de métodos, y la clase funciona como context manager tanto síncrono como asíncrono.

Úselo para hacer benchmark de funciones, perfilar rutas críticas o recopilar telemetría de tiempos en cualquier parte de su aplicación.

## Importación

```python
from orionis.support.performance.counter import PerformanceCounter
```

---

## Uso Síncrono

### Iniciar y Detener

Llame a `start()` para comenzar una medición y `stop()` para finalizarla. Luego lea el resultado con cualquiera de los métodos de conversión de unidades:

```python
counter = PerformanceCounter()

counter.start()
# ... código a medir ...
counter.stop()

counter.elapsedTime()      # segundos (float)
counter.getMilliseconds()  # milisegundos
counter.getMicroseconds()  # microsegundos
counter.getSeconds()       # segundos (alias)
counter.getMinutes()       # minutos
```

Todos los métodos retornan `self`, por lo que las llamadas pueden encadenarse:

```python
elapsed = PerformanceCounter().start().stop().elapsedTime()
```

### Context Manager

La forma más simple de medir un bloque de código es la sentencia `with`. El contador inicia al entrar y se detiene al salir — incluso si se lanza una excepción dentro del bloque:

```python
with PerformanceCounter() as counter:
    # ... código a medir ...

print(counter.getMilliseconds(), "ms")
```

### Reinicio

`restart()` reinicia todo el estado interno e inicia inmediatamente una nueva medición, sin crear una nueva instancia:

```python
counter = PerformanceCounter()

counter.start()
# ... primera operación ...
counter.stop()
first = counter.getMilliseconds()

counter.restart()
# ... segunda operación ...
counter.stop()
second = counter.getMilliseconds()
```

---

## Uso Asíncrono

Cada método síncrono tiene una contraparte asíncrona con el prefijo `a`. Las variantes asíncronas usan el reloj de alta resolución del event loop en lugar de `time.perf_counter`.

### Inicio y Detención Asíncronos

```python
counter = PerformanceCounter()

await counter.astart()
# ... código asíncrono a medir ...
await counter.astop()

await counter.aelapsedTime()      # segundos
await counter.agetMilliseconds()  # milisegundos
await counter.agetMicroseconds()  # microsegundos
await counter.agetSeconds()       # segundos
await counter.agetMinutes()       # minutos
```

### Context Manager Asíncrono

```python
async with PerformanceCounter() as counter:
    await some_async_operation()

print(counter.getMilliseconds(), "ms")
```

El contador se detiene automáticamente al salir, incluso cuando se propaga una excepción.

### Reinicio Asíncrono

```python
counter = PerformanceCounter()

await counter.astart()
await counter.astop()
first = counter.getMilliseconds()

await counter.arestart()
await counter.astop()
second = counter.getMilliseconds()
```

---

## Seguridad de Modo

Los modos síncrono y asíncrono **no pueden mezclarse** dentro de un mismo ciclo de medición. El contador rastrea qué modo se usó para iniciar y garantiza consistencia:

| Iniciado con | Detenido con | Resultado |
|---|---|---|
| `start()` | `stop()` | Funciona |
| `astart()` | `astop()` | Funciona |
| `start()` | `astop()` | `RuntimeError` |
| `astart()` | `stop()` | `RuntimeError` |

Llamar a `elapsedTime()` (o cualquier método de unidad) antes de completar un ciclo start/stop lanza `ValueError`.

---

## Conversiones de Unidad

Todos los métodos de conversión leen la misma medición y aplican un factor constante:

| Método | Unidad | Fórmula |
|---|---|---|
| `elapsedTime()` / `getSeconds()` | Segundos | valor directo |
| `getMilliseconds()` | Milisegundos | `elapsed × 1,000` |
| `getMicroseconds()` | Microsegundos | `elapsed × 1,000,000` |
| `getMinutes()` | Minutos | `elapsed ÷ 60` |

Las contrapartes asíncronas (`aelapsedTime`, `agetMilliseconds`, etc.) retornan los mismos valores.

---

## Referencia de Métodos

| Método | Variante async | Retorna | Descripción |
|---|---|---|---|
| `start()` | `astart()` | `self` | Inicia una nueva medición |
| `stop()` | `astop()` | `self` | Finaliza la medición y registra el tiempo transcurrido |
| `restart()` | `arestart()` | `self` | Reinicia el estado e inicia una nueva medición |
| `elapsedTime()` | `aelapsedTime()` | `float` | Tiempo transcurrido en segundos |
| `getSeconds()` | `agetSeconds()` | `float` | Tiempo transcurrido en segundos (alias) |
| `getMilliseconds()` | `agetMilliseconds()` | `float` | Tiempo transcurrido en milisegundos |
| `getMicroseconds()` | `agetMicroseconds()` | `float` | Tiempo transcurrido en microsegundos |
| `getMinutes()` | `agetMinutes()` | `float` | Tiempo transcurrido en minutos |
