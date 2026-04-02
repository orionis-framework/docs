---
title: TestResult
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# TestResult

`TestResult` es un dataclass inmutable que captura el resultado completo de la ejecución de un método de prueba individual. Después de que el `TestingEngine` finaliza una ejecución, retorna una lista de objetos `TestResult` — uno por método de prueba — que contiene todos los metadatos necesarios para inspeccionar, reportar o persistir el resultado.

## Importación

```python
from orionis.test.entities.result import TestResult
from orionis.test.enums.status import TestStatus
```

---

## Características

`TestResult` se define con `@dataclass(frozen=True, kw_only=True)`, lo que le otorga tres propiedades importantes:

### Inmutabilidad

Una vez creado, ningún campo puede ser modificado o eliminado. Cualquier intento de asignar o eliminar un atributo lanza `FrozenInstanceError`:

```python
result = results[0]

result.name = "modified"   # lanza FrozenInstanceError
del result.status          # lanza FrozenInstanceError
```

Esto garantiza que los datos del resultado permanezcan consistentes desde el momento en que se registran hasta que se consumen — no hay riesgo de mutación accidental entre el registro y el reporte.

### Construcción Solo por Nombre

Todos los campos deben pasarse como argumentos con nombre. Los argumentos posicionales son rechazados:

```python
# Correcto
result = TestResult(
    id=1,
    name="tests.test_user.TestUser.testCreate",
    status=TestStatus.PASSED,
    execution_time=0.012,
)

# TypeError — argumentos posicionales no permitidos
result = TestResult(1, "tests.test_user.TestUser.testCreate", TestStatus.PASSED, 0.012)
```

### Hashabilidad

Dado que el dataclass es congelado, Python genera automáticamente un método `__hash__`. Esto significa que las instancias de `TestResult` pueden ser:

- Usadas como claves de diccionario
- Almacenadas en conjuntos
- Deduplicadas

```python
result_set = set(results)
result_map = {result: "analyzed" for result in results}
```

---

## Campos

### Campos Requeridos

Estos cuatro campos siempre deben proporcionarse. Son poblados automáticamente por el procesador de resultados del framework.

#### id

```python
id: Any
```

El identificador único para la instancia de prueba. El framework usa la función integrada `id()` de Python, que retorna la dirección de memoria del objeto de prueba. Esto garantiza unicidad dentro de una sola ejecución.

#### name

```python
name: str
```

El nombre completamente cualificado de la prueba, tal como lo retorna `unittest.TestCase.id()`. Típicamente sigue el formato `módulo.NombreClase.nombreMétodo`:

```
tests.unit.test_user.TestUserService.testCreatesUser
```

#### status

```python
status: TestStatus
```

El resultado de la ejecución. Uno de los cuatro miembros de `TestStatus`:

| Valor | Significado |
|---|---|
| `TestStatus.PASSED` | Todas las aserciones tuvieron éxito, no se lanzó ninguna excepción |
| `TestStatus.FAILED` | Se lanzó un `AssertionError` |
| `TestStatus.ERRORED` | Se lanzó una excepción inesperada (diferente de `AssertionError`) |
| `TestStatus.SKIPPED` | La prueba fue omitida mediante un decorador `@unittest.skip*` o `self.skipTest()` |

#### execution_time

```python
execution_time: float
```

El tiempo de reloj de pared tomado para ejecutar el método de prueba, en segundos. Medido usando `time.perf_counter()` para temporización de alta resolución. Incluye cualquier hook `setUp` y `tearDown` que se haya ejecutado como parte de la prueba.

---

### Campos Opcionales

Todos los campos opcionales tienen como valor predeterminado `None` cuando no se proporcionan. El framework los completa cuando la información está disponible.

#### error_message

```python
error_message: str | None = None
```

La representación de cadena de la excepción que causó el fallo o error. Para una aserción fallida, esto es típicamente el mensaje de la aserción:

```
"1 != 2"
"'admin' not found in ['user', 'guest']"
```

`None` para pruebas pasadas u omitidas.

#### traceback

```python
traceback: str | None = None
```

El traceback formateado completo producido por `traceback.format_exception()`. Es una lista de cadenas que, al unirse, forman el stack trace completo. `None` para pruebas pasadas u omitidas.

#### class_name

```python
class_name: str | None = None
```

El nombre de la clase de prueba (ej., `"TestUserService"`). Extraído mediante las utilidades de reflexión del framework.

#### method

```python
method: str | None = None
```

El nombre del método de prueba específico (ej., `"testCreatesUser"`). Este es el valor de `_testMethodName` en la instancia de `unittest.TestCase`.

#### module

```python
module: str | None = None
```

La ruta del módulo Python que contiene la clase de prueba (ej., `"tests.unit.test_user"`).

#### file_path

```python
file_path: str | None = None
```

La ruta absoluta del sistema de archivos al archivo fuente que contiene la prueba (ej., `"/app/tests/unit/test_user.py"`).

#### doc_string

```python
doc_string: str | None = None
```

El docstring del método de prueba, si se definió uno. Esto es útil para generar reportes legibles donde cada prueba tiene una descripción:

```python
def testCreatesUser(self):
    """Crear un nuevo usuario y persistirlo en la base de datos."""
    ...
```

En este caso, `doc_string` sería `"Crear un nuevo usuario y persistirlo en la base de datos."`.

#### exception

```python
exception: str | None = None
```

El nombre de la clase de excepción que fue lanzada (ej., `"AssertionError"`, `"ValueError"`, `"TypeError"`). Se extrae de `exc_info[0].__name__`. `None` para pruebas pasadas u omitidas.

#### line_no

```python
line_no: int | None = None
```

El número de línea en el archivo fuente donde ocurrió el fallo o error. El framework inspecciona los frames del traceback e identifica el frame que corresponde al archivo de prueba. `None` para pruebas pasadas u omitidas.

#### source_code

```python
source_code: list[tuple[int, str]] | None = None
```

Una lista de tuplas `(número_de_línea, línea_de_código)` que representan el código fuente alrededor del punto de fallo. Típicamente incluye 2 líneas antes y 1 línea después de la línea causante. Estos son los datos que usa el modo de verbosidad Detallado para renderizar el fragmento de código:

```python
[
    (23, "    def testBadLogic(self):"),
    (24, "        result = 1"),
    (25, "        self.assertEqual(result, 2)"),
    (26, ""),
]
```

`None` (o una lista vacía) para pruebas pasadas u omitidas.

---

## Serialización

### toDict

Convierte el `TestResult` a un diccionario Python plano. Los valores de enumeración (como `TestStatus`) se serializan a su representación de cadena:

```python
result = results[0]
data = result.toDict()

# data es un dict con claves de cadena y valores serializables
print(data["name"])       # "tests.test_user.TestUser.testCreate"
print(data["status"])     # "PASSED" (cadena, no TestStatus)
print(data["execution_time"])  # 0.012
```

Este método es usado internamente por el `TestingEngine` al persistir resultados en la caché JSON, y está disponible para cualquier reporte personalizado o integración.

### getFields

Retorna una lista de diccionarios que describen cada campo en el dataclass, incluyendo nombre, tipos, valor predeterminado y metadatos:

```python
fields = result.getFields()

for field in fields:
    print(field["name"], field["types"], field["default"])
```

Cada entrada tiene la estructura:

```python
{
    "name": "status",
    "types": ["TestStatus"],
    "default": None,
    "metadata": {"description": "Status of the test execution (e.g., passed, failed)."}
}
```

---

## Igualdad y Comparación

Dos instancias de `TestResult` se consideran iguales si todos sus campos tienen valores idénticos. Este es el comportamiento estándar de `__eq__` de `dataclass`:

```python
r1 = TestResult(id=1, name="test", status=TestStatus.PASSED, execution_time=0.5)
r2 = TestResult(id=1, name="test", status=TestStatus.PASSED, execution_time=0.5)

r1 == r2   # True

r3 = TestResult(id=1, name="test", status=TestStatus.FAILED, execution_time=0.5)
r1 == r3   # False — el status difiere
```

---

## Trabajar con Resultados

### Filtrar por Estado

```python
results = await engine.run()

passed  = [r for r in results if r.status == TestStatus.PASSED]
failed  = [r for r in results if r.status == TestStatus.FAILED]
errored = [r for r in results if r.status == TestStatus.ERRORED]
skipped = [r for r in results if r.status == TestStatus.SKIPPED]

print(f"{len(passed)} pasaron, {len(failed)} fallaron, {len(errored)} errores, {len(skipped)} omitidas")
```

### Extraer Detalles de Fallos

```python
for result in failed:
    print(f"\n--- {result.name} ---")
    print(f"Clase:     {result.class_name}")
    print(f"Método:    {result.method}")
    print(f"Archivo:   {result.file_path}:{result.line_no}")
    print(f"Excepción: {result.exception}: {result.error_message}")

    if result.source_code:
        print("Código fuente:")
        for line_no, code in result.source_code:
            marker = " *" if line_no == result.line_no else "  "
            print(f"  {marker}| {line_no}: {code}")
```

### Generar un Reporte Personalizado

```python
import json

results = await engine.run()

report = {
    "total": len(results),
    "passed": sum(1 for r in results if r.status == TestStatus.PASSED),
    "failed": sum(1 for r in results if r.status == TestStatus.FAILED),
    "errored": sum(1 for r in results if r.status == TestStatus.ERRORED),
    "skipped": sum(1 for r in results if r.status == TestStatus.SKIPPED),
    "total_time": sum(r.execution_time for r in results),
    "slowest": max(results, key=lambda r: r.execution_time).name if results else None,
    "details": [r.toDict() for r in results],
}

print(json.dumps(report, indent=2, default=str))
```

### Recopilar en Conjuntos o Diccionarios

Dado que `TestResult` es hashable, se pueden deduplicar resultados o usarlos como claves de diccionario:

```python
unique_failures = {r for r in results if r.status == TestStatus.FAILED}

annotations = {}
for result in results:
    annotations[result] = analyze(result)
```

---

## Enumeración TestStatus

La enumeración `TestStatus` define los cuatro posibles resultados. Extiende `StrEnum`, lo que significa que cada miembro es simultáneamente un `str`:

```python
from orionis.test.enums.status import TestStatus

# Miembros
TestStatus.PASSED    # "PASSED"
TestStatus.FAILED    # "FAILED"
TestStatus.ERRORED   # "ERRORED"
TestStatus.SKIPPED   # "SKIPPED"
```

### Comportamiento como Cadena

Dado que los miembros de `TestStatus` son cadenas, soportan todas las operaciones de cadena sin conversión:

```python
status = TestStatus.PASSED

# Comparación
status == "PASSED"                  # True
status in ["PASSED", "SKIPPED"]     # True

# Métodos de cadena
status.lower()                      # "passed"
f"Resultado: {status}"              # "Resultado: PASSED"

# Serialización JSON
import json
json.dumps({"status": status})      # '{"status": "PASSED"}'
```

### Membresía del Enum

La enumeración contiene exactamente cuatro miembros. Se puede iterar sobre ellos:

```python
for status in TestStatus:
    print(status.name, status.value)

# PASSED PASSED
# FAILED FAILED
# ERRORED ERRORED
# SKIPPED SKIPPED
```

---

## Referencia de Campos

| Campo | Tipo | Requerido | Predeterminado | Descripción |
|---|---|---|---|---|
| `id` | `Any` | Sí | — | Identificador único (`id()` de Python de la instancia de prueba) |
| `name` | `str` | Sí | — | Nombre completamente cualificado (`módulo.Clase.método`) |
| `status` | `TestStatus` | Sí | — | Resultado: `PASSED`, `FAILED`, `ERRORED` o `SKIPPED` |
| `execution_time` | `float` | Sí | — | Duración en segundos (alta resolución) |
| `error_message` | `str \| None` | No | `None` | Mensaje de error o aserción |
| `traceback` | `str \| None` | No | `None` | Traceback formateado completo |
| `class_name` | `str \| None` | No | `None` | Nombre de la clase de prueba |
| `method` | `str \| None` | No | `None` | Nombre del método de prueba |
| `module` | `str \| None` | No | `None` | Ruta del módulo de la prueba |
| `file_path` | `str \| None` | No | `None` | Ruta absoluta al archivo de prueba |
| `doc_string` | `str \| None` | No | `None` | Docstring del método de prueba |
| `exception` | `str \| None` | No | `None` | Nombre de la clase de excepción |
| `line_no` | `int \| None` | No | `None` | Número de línea del fallo |
| `source_code` | `list \| None` | No | `None` | Líneas de código fuente cerca del fallo como tuplas `(line_no, code)` |
