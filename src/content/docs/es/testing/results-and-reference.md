---
title: "Resultados, configuración y referencia"
description: "Opciones de reactor test, descubrimiento, verbosidad, configuración, informes JSON y API del motor de pruebas."
editUrl: true
lastUpdated: false
---

Ejecuta las pruebas desde la raíz de la aplicación, donde se encuentra `reactor`. Todos los casos deben extender `TestCase`, importado con `from orionis.test import TestCase`; consulta [creación e inyección de dependencias](/es/testing/writing-and-running-tests) para preparar el primero.

## Ejecutar la suite

Las dos entradas ejecutan el mismo comando:

```bash
orionis test
python -B reactor test
```

Con uv, utiliza `uv run python -B reactor test`. El comando arranca la aplicación y resuelve el motor registrado en el contenedor. Ejecutar directamente `python -m unittest` omite ese arranque: los métodos de `TestCase` que delegan en la aplicación necesitan que esta ya esté inicializada.

Consulta las opciones instaladas en tu proyecto:

```bash
orionis test --help
python -B reactor test --help
```

### Opciones de ejecución

El comando no tiene argumentos posicionales. Todas estas opciones son opcionales:

| Opción | Valor y efecto |
| --- | --- |
| `--verbosity N`, `-v N` | Entero `0`, `1` o `2`. Sobrescribe `testing.verbosity`; valor configurado predeterminado: `2`. |
| `--fail-fast N`, `-f N` | Entero: `1` detiene ante el primer fallo o error; `0` continúa. Sobrescribe `testing.fail_fast`, incluso con `0`. Predeterminado configurado: `False`. |
| `--start-dir RUTA`, `-s RUTA` | Directorio del descubrimiento. Predeterminado configurado: `tests`. |
| `--file-pattern PATRÓN` | Glob de nombres de archivos, inicialmente `test_*.py`. |
| `--method-pattern PATRÓN` | Glob para filtrar los métodos descubiertos, inicialmente `test*`. |
| `--panel` | Activa los paneles de inicio y resumen; comportamiento predeterminado del CLI. |
| `--no-panel` | Desactiva los paneles de inicio y resumen y evita limpiar la consola. No cambia la verbosidad de cada resultado. |
| `--help`, `-h` | Muestra la ayuda sin ejecutar las pruebas. |

`--fail-fast` necesita un valor: escribe `--fail-fast 1`, no únicamente `--fail-fast`. Aunque el parser acepta otros enteros, solo `1` activa esta opción en el CLI; utiliza `0` o `1`. Una verbosidad fuera de `0`, `1` y `2` genera `ValueError`.

```bash
# Filtrar un directorio y una familia de casos.
python -B reactor test --start-dir tests/unit --file-pattern "test_invoice*.py" --method-pattern "testCalculate*"

# Detenerse ante el primer resultado fallido o con error.
orionis test --fail-fast 1 --verbosity 2

# Continuar aunque la configuración general active fail-fast.
python -B reactor test --fail-fast 0 --no-panel --verbosity 1
```

### Descubrimiento y filtros

El motor recorre el directorio de inicio y sus subdirectorios, incluso sin `__init__.py`. Convierte los archivos coincidentes en nombres de módulo y los importa mediante el loader de `unittest`. Mantén los nombres convencionales `test_*.py` y métodos `test...`.

Los patrones son globs mediante `fnmatch`, como `test_user*.py`, `testCreate*` o `test*Permission*`; no son expresiones regulares. El filtro de métodos se aplica a candidatos encontrados por el loader: no convierte métodos de nombre arbitrario en pruebas. La sensibilidad a mayúsculas sigue la plataforma.

`start_dir` relativo se resuelve desde el directorio de trabajo del proceso. La raíz de la aplicación forma los nombres de módulo y se añade a la ruta de importación. Ejecuta desde la raíz del proyecto y utiliza subdirectorios dentro de ella, o una ruta absoluta dentro de ese proyecto.

Un directorio inexistente o filtros sin coincidencias producen una suite vacía. El comando devuelve `0` en ese caso; confirma en el resumen que se ejecutó la cantidad esperada. Los fallos de importación representados por el loader se conservan como errores aunque el filtro de métodos no coincida. Otras excepciones durante el descubrimiento, como ciertos errores de sintaxis, se propagan y no se convierten necesariamente en un resultado por caso.

## Configuración de las pruebas

`config/testing.py` define `BootstrapTesting(Testing)`, una configuración inmutable con argumentos por nombre. Sus seis propiedades se establecen en ese archivo o mediante las variables que ya lee:

| Propiedad | Tipo y valor predeterminado | Variable de entorno |
| --- | --- | --- |
| `verbosity` | `int \| VerbosityMode`, `VerbosityMode.DETAILED` → `2` | `TESTING_VERBOSITY` |
| `fail_fast` | `bool`, `False` | `TESTING_FAIL_FAST` |
| `start_dir` | `str`, `"tests"` | `TESTING_START_DIR` |
| `file_pattern` | `str`, `"test_*.py"` | `TESTING_FILE_PATTERN` |
| `method_pattern` | `str`, `"test*"` | `TESTING_METHOD_PATTERN` |
| `cache_results` | `bool`, `False` | `TESTING_CACHE_RESULTS` |

Por ejemplo, en `.env`:

```dotenv
TESTING_VERBOSITY=int:1
TESTING_FAIL_FAST=bool:false
TESTING_START_DIR=tests
TESTING_FILE_PATTERN=test_*.py
TESTING_METHOD_PATTERN=test*
TESTING_CACHE_RESULTS=bool:true
```

Los prefijos producen tipos reales al construir la configuración. `Env` se utiliza en archivos de configuración; durante la ejecución, accede a estos valores mediante `IApplication.config()`. Consulta [Entorno](/es/environment) para configurar su carga y persistencia.

Para fijar opciones directamente en `config/testing.py`, conserva la clase y sustituye los campos correspondientes:

```python
from dataclasses import dataclass

from orionis.foundation.config.testing import Testing, VerbosityMode


@dataclass(frozen=True, kw_only=True)
class BootstrapTesting(Testing):
    verbosity: int | VerbosityMode = VerbosityMode.MINIMAL
    fail_fast: bool = True
    start_dir: str = "tests/unit"
    file_pattern: str = "test_*.py"
    method_pattern: str = "test*"
    cache_results: bool = True
```

### Validación y precedencia

`Testing` normaliza `VerbosityMode` a su entero. Solo admite `0`, `1` y `2`; un booleano no es una verbosidad válida. `fail_fast` y `cache_results` deben ser booleanos reales, no `1` ni cadenas. Los otros tres campos deben ser cadenas no vacías ni compuestas únicamente de espacios. Los tipos inválidos producen `TypeError`; una verbosidad fuera de rango o una cadena vacía producen `ValueError`. No se comprueba aquí que el directorio exista.

La precedencia normal es **opción CLI → configuración de la aplicación → valor predeterminado del motor**. Omitir una opción conserva lo configurado; los valores explícitos `--verbosity 0` y `--fail-fast 0` prevalecen. Para directorio y patrones, una cadena CLI vacía vuelve al valor configurado.

El motor admite aplicaciones sin alguna clave: usa `2`, `False`, `tests`, `test_*.py`, `test*` y `False`, respectivamente. Los paneles se controlan por CLI o `withoutPanel()`; no existe un campo `with_panel` en `Testing`.

## Verbosidad y paneles

| Valor | Enum | Salida por resultado |
| --- | --- | --- |
| `0` | `VerbosityMode.SILENT` | No imprime cada resultado. |
| `1` | `VerbosityMode.MINIMAL` | Línea compacta con estado, identificador y tiempo. Los nombres largos pueden truncarse visualmente. |
| `2` | `VerbosityMode.DETAILED` | Panel con nombre, clase, método, módulo y archivo. Fallos y errores añaden excepción, mensaje y contexto de código disponible. |

Los paneles externos son independientes: inicio con fecha, PID e información del loop; resumen con totales por estado y tiempo. `--verbosity 0` conserva ambos salvo que también indiques `--no-panel`.

```bash
# Sin presentación del runner; las pruebas todavía pueden imprimir su propia salida.
python -B reactor test --verbosity 0 --no-panel

# Una línea por resultado, sin limpiar la terminal ni mostrar paneles externos.
python -B reactor test --verbosity 1 --no-panel
```

`--no-panel` no desactiva los paneles individuales de verbosidad `2`. El comando no ofrece flags de captura de `stdout`, paralelismo, cobertura ni emisión JSON por consola.

## Estados y código de salida

`TestStatus` es un enum de cadenas:

| Estado | Interpretación |
| --- | --- |
| `PASSED` | El caso terminó sin fallo ni error. |
| `FAILED` | Falló una aserción. Incluye un éxito inesperado de `expectedFailure`. |
| `ERRORED` | Excepción que no corresponde a un fallo de aserción. |
| `SKIPPED` | Caso omitido o fallo marcado como esperado. |

El CLI devuelve **`1` ante algún `FAILED` o `ERRORED`, y `0` en los demás casos**, incluida una lista vacía. Conserva ese código en integración continua. Fail-fast detiene los casos posteriores ante un fallo, un error o un éxito inesperado; también se respeta ante una subprueba fallida. No equivale a cancelar por tiempo ni a interrumpir la limpieza del caso.

Una subprueba fallida exporta su identidad con los parámetros de `subTest()`. Las subpruebas satisfactorias no generan entradas individuales. Los totales cuentan resultados registrados y pueden diferir del número de métodos cuando existen varias subpruebas fallidas o errores adicionales de ciclo de vida.

## Resultados JSON

Activa `cache_results=True` en configuración o `TESTING_CACHE_RESULTS=bool:true` en `.env`, y ejecuta normalmente:

```bash
python -B reactor test --verbosity 1 --no-panel
```

El motor crea el directorio y escribe una lista JSON en:

```text
storage/framework/cache/testing/<timestamp-en-segundos>.json
```

La base real es `app.path("storage_framework")`; personalizar esa ruta cambia el destino. **No existe `--json`**: el JSON es un archivo independiente de la consola. Se guarda después del runner, también con resultados fallidos o una lista vacía. Una excepción que impida completar el descubrimiento o el runner puede impedir la escritura; los errores al escribir se propagan.

Ejemplo de estructura para un resultado satisfactorio; identificadores, ruta y duración cambian en cada ejecución:

```json
[
  {
    "id": 123456,
    "name": "tests.unit.test_totals.TotalTest.testTotal",
    "status": "PASSED",
    "execution_time": 0.002,
    "error_message": null,
    "traceback": null,
    "class_name": "TotalTest",
    "method": "testTotal",
    "module": "tests.unit.test_totals",
    "file_path": "/srv/project/tests/unit/test_totals.py",
    "doc_string": null,
    "exception": null,
    "line_no": null,
    "source_code": []
  }
]
```

Cada entrada corresponde a un `TestResult` inmutable:

| Campo | Contenido |
| --- | --- |
| `id` | Identidad Python del objeto caso o subprueba en esa ejecución; no es persistente. |
| `name` | Nombre completo de `test.id()` o de la subprueba; útil para comparar informes. |
| `status` | Una de las cuatro cadenas de `TestStatus`. |
| `execution_time` | Segundos desde el inicio del caso hasta registrar el resultado. |
| `error_message` | Texto de la excepción, o `None`. |
| `traceback` | Lista de fragmentos del traceback formateado, o `None`. |
| `class_name`, `method`, `module` | Metadatos del caso. |
| `file_path` | Archivo de la clase cuando se puede inspeccionar, o `None`. |
| `doc_string` | Docstring del método, o `None`. |
| `exception` | Nombre de la clase de excepción, o `None`. |
| `line_no` | Línea asociada al contexto de error detectado, o `None`. |
| `source_code` | Pares `(número_de_línea, código)`; en JSON, listas de dos elementos. Puede estar vacío. |

Los cuatro primeros campos son obligatorios al construir `TestResult`; los restantes admiten `None`. El procesador utiliza `[]` cuando no extrae código. `toDict()` devuelve la representación usada por el motor. Un `skip` ordinario no almacena el motivo como campo separado; un fallo esperado conserva diagnósticos aunque se exporte como `SKIPPED`.

Los nombres de archivo tienen resolución de un segundo: dos ejecuciones en ese segundo usan la misma ruta y la última puede reemplazar la anterior. No hay retención automática ni un selector del nombre. Estos archivos son informes; no evitan volver a ejecutar pruebas. Si utilizas configuración compilada, aplica el procedimiento de [caché de la aplicación](/es/application/paths-and-caching) para actualizarla.

## Motor y fachada Test

En una aplicación inicializada, puedes resolver el contrato y configurar la ejecución:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.test.contracts.engine import ITestingEngine
from orionis.test.entities.result import TestResult


async def runSelectedTests(app: IApplication) -> list[TestResult]:
    engine = await app.make(ITestingEngine)
    engine.setStartDir("tests/unit")
    engine.setFilePattern("test_*.py")
    engine.setMethodPattern("testCalculate*")
    engine.setVerbosity(0)
    engine.setFailFast(fail_fast=True)
    engine.withoutPanel()
    return await engine.run()
```

También puedes declarar `engine: ITestingEngine` como parámetro de un componente invocado por el contenedor. La fachada se importa desde `orionis.support.facades`; después de resolver el servicio anterior, su instancia ya está fijada:

```python
from orionis.support.facades import Test


async def runUnitSuite():
    engine = await Test.resolve()
    engine.setStartDir("tests/unit").setVerbosity(1).withoutPanel()
    return await Test.run()
```

El proveedor registra `ITestingEngine → TestingEngine` como singleton diferido y fija la instancia de la fachada al arrancarlo. Resolver explícitamente el servicio permite configurar métodos síncronos sin depender de si la fachada ya estaba fijada. No ejecutes la suite recursivamente desde una prueba incluida en ella.

| Firma real | Operación |
| --- | --- |
| `setVerbosity(verbosity: int) -> Self` | Nivel de presentación. Usa `0`, `1` o `2`; el setter no valida el rango como el CLI. |
| `setFailFast(*, fail_fast: bool) -> Self` | Detención ante el primer fallo; argumento por nombre. |
| `setStartDir(start_dir: str) -> Self` | Directorio de descubrimiento. |
| `setFilePattern(file_pattern: str) -> Self` | Glob de archivos. |
| `setMethodPattern(method_pattern: str) -> Self` | Glob de métodos y patrón contextual de `TestCase`. |
| `withoutPanel() -> Self` | Desactiva inicio y resumen. No existe setter inverso en este contrato. |
| `discover() -> unittest.TestSuite` | Suite nueva, sin ejecución ni JSON. |
| `async run() -> list[TestResult]` | Descubre, ejecuta, guarda JSON si corresponde y devuelve resultados. |

`TestingEngine(app: IApplication)` lee configuración y rutas al construirse. Los setters devuelven la misma instancia y conservan cambios: ejecuciones posteriores en el proceso heredan esos ajustes. `run()` mueve el runner a un hilo para no bloquear el loop del llamador; no ejecuta los casos en paralelo. Cada `TestCase` dispone de un loop aislado; la base de datos y los servicios requieren su propia estrategia de aislamiento.

## Runner y procesamiento de resultados

Normalmente utiliza el CLI o `ITestingEngine`. Para una integración con la aplicación ya inicializada, el runner expone:

```text
TestRunner(
    verbosity: int = 0,
    failfast: bool = False,
    buffer: bool = False,
    warnings: str | None = None,
    with_panel: bool = True,
    **kwargs: dict,
)
```

`run(test: unittest.suite.TestSuite) -> unittest.result.TestResult` ejecuta una suite preparada y devuelve por defecto `TestResultProcessor`. No descubre pruebas ni escribe JSON. `buffer` controla la captura estándar durante casos; `warnings`, el filtro de advertencias. Los argumentos adicionales pasan a `unittest.TextTestRunner`, incluidos `stream`, `descriptions`, `tb_locals` y `durations`. Rich usa su propia consola: `stream` no redirige por sí solo sus paneles. Los resúmenes de Orionis no añaden un ranking de duración.

`TestResultProcessor(stream=None, descriptions=None, verbosity=None, **kwargs)` conserva resultados y ofrece `getTestResults() -> list[TestResult]`. Se integra con los callbacks de `unittest`:

| Callback | Comportamiento de Orionis |
| --- | --- |
| `startTest(test)` | Inicia la medición del caso. |
| `addSuccess(test)` | Registra e imprime `PASSED`. |
| `addFailure(test, err)` | Registra `FAILED` con diagnósticos. |
| `addError(test, err)` | Registra `ERRORED` con diagnósticos. |
| `addSkip(test, reason)` | Registra `SKIPPED`. |
| `addSubTest(test, subtest, err)` | Añade un resultado cuando falla; conserva la identidad parametrizada. |
| `addExpectedFailure(test, err)` | Exporta `SKIPPED` con la excepción esperada. |
| `addUnexpectedSuccess(test)` | Exporta `FAILED` con un `AssertionError` explicativo. |

El runner llama a `startTestRun()` y garantiza `stopTestRun()` mediante `finally` cuando ese protocolo está disponible. Las excepciones normales de casos se procesan como resultados; una excepción del propio objeto suite puede propagarse. El almacenamiento del procesador es por instancia y `getTestResults()` devuelve su lista, no una copia.

Existe una limitación en los errores de preparación de clase: si `setUpClass()` falla antes de que se inicie el primer caso, el procesador aún no tiene su temporizador y puede lanzar `AttributeError` en lugar de producir un resultado `ERRORED`. No dependas de recibir un informe JSON completo en ese escenario; conserva también el código y la salida del proceso. Esto no impide utilizar `setUpClass()` para una preparación satisfactoria.

Continúa con [casos y decoradores](/es/testing/cases-and-decorators) o vuelve a [Pruebas](/es/testing).
