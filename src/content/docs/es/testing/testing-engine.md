---
title: TestingEngine
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# TestingEngine

El `TestingEngine` es el coordinador central del subsistema de testing. Lee la configuración de la aplicación, descubre archivos y métodos de prueba, los ejecuta de forma asíncrona, gestiona la salida en consola y opcionalmente persiste los resultados en una caché JSON. Todos los métodos setter retornan `self`, habilitando un estilo de configuración completamente fluido.

## Importación

```python
from orionis.test.core.engine import TestingEngine
```

---

## Crear una Instancia del Motor

El motor se construye a partir de la instancia de la aplicación. Durante la construcción, lee cada valor de configuración relacionado con el testing (`verbosity`, `fail_fast`, `start_dir`, `file_pattern`, `method_pattern`, `cache_results`) y los usa como valores predeterminados para la ejecución actual:

```python
from orionis.test.core.engine import TestingEngine

engine = TestingEngine(app)
```

El constructor también inicializa:

- Una `unittest.TestSuite` interna que contendrá las pruebas descubiertas
- La ruta de la **carpeta de caché** en `storage/framework/cache/testing/` (derivada de la ruta `storage` de la aplicación)

---

## Configuración Fluida

Cada setter retorna `self`, por lo que se pueden encadenar múltiples cambios de configuración en una sola expresión. Estas sobrescrituras se aplican **solo a la instancia actual del motor** — no modifican `config/testing.py`.

```python
engine = (
    TestingEngine(app)
    .setVerbosity(1)
    .setFailFast(fail_fast=True)
    .setStartDir("tests/unit")
    .setFilePattern("test_*.py")
    .setMethodPattern("check*")
)
```

### setVerbosity

Controla la cantidad de salida impresa por prueba durante la ejecución.

```python
engine.setVerbosity(0)   # Silencioso — solo la tabla resumen
engine.setVerbosity(1)   # Mínimo — una línea por prueba
engine.setVerbosity(2)   # Detallado — panel Rich por prueba
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `verbosity` | `int` | `0` para silencioso, `1` para mínimo, `2` para detallado |

**Retorna:** `Self` — la misma instancia del motor para encadenamiento.

### setFailFast

Determina si el motor detiene la ejecución tan pronto como ocurre el primer fallo o error. Las pruebas restantes no se ejecutan.

```python
engine.setFailFast(fail_fast=True)    # Detenerse en el primer fallo
engine.setFailFast(fail_fast=False)   # Ejecutar todas las pruebas sin importar los fallos
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `fail_fast` | `bool` | `True` para detenerse en el primer fallo, `False` para ejecutar todas. Debe pasarse como argumento con nombre |

**Retorna:** `Self`

:::note[Parámetro solo por nombre]
`fail_fast` es un parámetro solo por nombre (keyword-only) — `engine.setFailFast(True)` lanzará un `TypeError`. Siempre use `engine.setFailFast(fail_fast=True)`.
:::

### setStartDir

Establece el directorio raíz donde comienza el descubrimiento de pruebas. El motor escanea este directorio y todos sus subdirectorios de forma recursiva.

```python
engine.setStartDir("tests")           # Predeterminado — escanear todo el árbol tests/
engine.setStartDir("tests/unit")      # Solo pruebas unitarias
engine.setStartDir("tests/feature")   # Solo pruebas de características
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `start_dir` | `str` | Ruta relativa al directorio a escanear |

**Retorna:** `Self`

### setFilePattern

Establece el patrón glob usado para coincidir con nombres de archivos de prueba. Solo se cargan los archivos que coincidan con este patrón durante el proceso de descubrimiento.

```python
engine.setFilePattern("test_*.py")       # Predeterminado — archivos que comienzan con test_
engine.setFilePattern("*_test.py")       # Archivos que terminan con _test
engine.setFilePattern("test_user*.py")   # Solo archivos de prueba relacionados con usuario
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `file_pattern` | `str` | Patrón glob, comparado contra el nombre del archivo (no la ruta completa) |

**Retorna:** `Self`

### setMethodPattern

Establece el patrón glob usado para identificar métodos de prueba dentro de las clases descubiertas. Este método tiene un **efecto dual**: actualiza tanto el filtro interno del motor como el patrón a nivel de clase `TestCase.setMethodPattern()`, asegurando consistencia entre el descubrimiento y el envolvimiento del contexto de la aplicación realizado por `TestCase.__getattribute__`.

```python
engine.setMethodPattern("test*")      # Predeterminado — métodos que comienzan con test
engine.setMethodPattern("check*")     # Métodos que comienzan con check
engine.setMethodPattern("test_user*") # Solo métodos de prueba relacionados con usuario
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `method_pattern` | `str` | Patrón glob, comparado contra nombres de método usando `fnmatch` |

**Retorna:** `Self`

:::caution[Efecto secundario]
Llamar a `setMethodPattern` también llama a `TestCase.setMethodPattern()`, que modifica un atributo a nivel de clase afectando a todas las clases de prueba. Esta sincronización es intencional — asegura que el hook `TestCase.__getattribute__` envuelva los mismos métodos que el motor descubre.
:::

---

## Descubrimiento de Pruebas

### Cómo Funciona el Descubrimiento

El método `discover()` realiza un proceso de filtrado en dos etapas:

**Etapa 1 — Descubrimiento de archivos:** Usa `unittest.defaultTestLoader.discover()` para escanear el `start_dir` recursivamente buscando archivos que coincidan con el `file_pattern`. Cada archivo coincidente se importa, y todas las subclases de `TestCase` dentro de él se recopilan en una `unittest.TestSuite`.

**Etapa 2 — Filtrado de métodos:** El motor itera sobre cada caso de prueba en la suite y verifica si su `_testMethodName` coincide con el glob `method_pattern`. Solo los métodos que coincidan se incluyen en la suite final.

```python
suite = engine.discover()

# suite es una unittest.TestSuite que contiene solo las pruebas que coinciden con ambos filtros
print(suite.countTestCases())   # Número de pruebas coincidentes
```

### Ejemplos de Descubrimiento

```python
# Descubrir todas las pruebas en el directorio predeterminado con patrones predeterminados
engine = TestingEngine(app)
suite = engine.discover()

# Descubrir solo archivos de prueba del módulo de usuario
engine.setStartDir("tests/unit").setFilePattern("test_user*.py")
suite = engine.discover()

# Descubrir pruebas usando una convención de nombres personalizada
engine.setMethodPattern("verify*")
suite = engine.discover()

# Combinar filtros de directorio, archivo y método
suite = (
    TestingEngine(app)
    .setStartDir("tests/integration")
    .setFilePattern("test_api*.py")
    .setMethodPattern("test_get*")
    .discover()
)
```

### Suites Vacías

Si ningún archivo coincide con el patrón de archivo en el directorio dado, `discover()` retorna una `unittest.TestSuite` vacía con cero casos de prueba. Lo mismo ocurre si se encuentran archivos pero ninguno de sus métodos coincide con el patrón de método. El motor no lanza un error en ninguno de los casos.

---

## Ejecutar Pruebas

El método `run()` es un método asíncrono que orquesta todo el ciclo de vida de la ejecución de pruebas:

1. Llama a `discover()` y agrega todas las pruebas coincidentes a la suite interna
2. Configura la verbosidad en el `TestResultProcessor`
3. Crea un `TestRunner` con la configuración actual de `fail_fast`
4. Ejecuta la suite en un pool de hilos via `asyncio.run_in_executor()` para evitar bloquear el bucle de eventos
5. Recopila todos los objetos `TestResult` del procesador de resultados
6. Si el almacenamiento en caché está habilitado, escribe los resultados en un archivo JSON de forma asíncrona
7. Retorna la lista de objetos `TestResult`

```python
results = await engine.run()

# results es una list[TestResult]
for result in results:
    print(f"{result.name}: {result.status} ({result.execution_time:.3f}s)")
```

### Ejemplo Completo

```python
from orionis.test.core.engine import TestingEngine

async def run_tests(app):
    results = await (
        TestingEngine(app)
        .setVerbosity(2)
        .setFailFast(fail_fast=False)
        .setStartDir("tests")
        .setFilePattern("test_*.py")
        .setMethodPattern("test*")
        .run()
    )

    # Procesar resultados programáticamente
    passed = [r for r in results if r.status == "PASSED"]
    failed = [r for r in results if r.status == "FAILED"]

    print(f"\n{len(passed)} pasaron, {len(failed)} fallaron")

    # Retornar código de salida para CI
    return 0 if not failed else 1
```

### Ejecución en Pool de Hilos

La ejecución de pruebas se descarga al executor predeterminado mediante `asyncio.get_event_loop().run_in_executor()`. Esto significa que las pruebas en sí se ejecutan en un hilo separado, manteniendo el bucle de eventos libre. El runner, la salida en consola y el procesamiento de resultados ocurren todos en ese hilo trabajador. Solo la recopilación final de resultados y el almacenamiento JSON retornan al contexto asíncrono.

---

## Salida en Consola Durante la Ejecución

El motor delega el renderizado en consola al `TestRunner`, que usa la biblioteca Rich para producir salida estilizada en el terminal.

### Antes de las Pruebas

Un **panel de inicio** aparece con:

| Campo | Contenido |
|---|---|
| Título | `🚀 Orionis TestSuite` |
| Iniciado a las | Marca de tiempo actual en formato `YYYY-MM-DD HH:MM:SS` |
| PID | ID del proceso Python en ejecución |
| Política del bucle Reactor | Nombre de la política del bucle de eventos asyncio activa |
| Instrucción de parada | Recordatorio de `Ctrl+C` |

### Durante las Pruebas

Cada prueba produce salida según el nivel de verbosidad (consulte **Descripción General del Testing** para detalles sobre los tres niveles).

### Después de las Pruebas

Una **tabla resumen** aparece con cinco columnas:

| Total | Passed | Failed | Errored | Skipped |
|:---:|:---:|:---:|:---:|:---:|
| 42 | 40 | 1 | 0 | 1 |

El subtítulo muestra el tiempo total de ejecución con precisión de milisegundos.

---

## Referencia de Métodos

| Método | Parámetro | Retorna | Descripción |
|---|---|---|---|
| `__init__(app)` | `IApplication` | — | Construye el motor desde la instancia de la aplicación, leyendo todos los valores de configuración de testing |
| `setVerbosity(verbosity)` | `int` | `Self` | Sobrescribir el nivel de detalle de la salida (0, 1 o 2) |
| `setFailFast(*, fail_fast)` | `bool` | `Self` | Habilitar o deshabilitar el modo fail-fast. Solo por nombre |
| `setStartDir(start_dir)` | `str` | `Self` | Establecer el directorio raíz para el descubrimiento de archivos de prueba |
| `setFilePattern(file_pattern)` | `str` | `Self` | Establecer el patrón glob para coincidir con nombres de archivos de prueba |
| `setMethodPattern(method_pattern)` | `str` | `Self` | Establecer el patrón glob para coincidir con nombres de métodos de prueba (también actualiza `TestCase`) |
| `discover()` | — | `TestSuite` | Escanear el directorio y retornar una suite de pruebas filtrada |
| `run()` | — | `list[TestResult]` | Ejecutar todas las pruebas descubiertas de forma asíncrona y retornar los resultados |
