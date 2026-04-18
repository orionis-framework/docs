---
title: Descripción General
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Descripción General del Testing

Orionis incluye un subsistema de testing completamente integrado que elimina la fricción de configurar un entorno de pruebas. En lugar de arrancar la aplicación manualmente o hacer mocks de los internos del framework, cada método de prueba se ejecuta dentro del contexto real de la aplicación — el contenedor de servicios está activo, los valores de configuración están cargados y todos los proveedores registrados han sido iniciados. Esto permite verificar el comportamiento exactamente como se ejecutará en producción.

<video controls muted controlsList="novolume" width="100%" style="border-radius: 8px; margin: 1.5rem 0;">
  <source src="/assets/videos/TestOrionis.mp4" type="video/mp4" />
  Tu navegador no soporta la reproducción de video.
</video>

El subsistema se compone de cuatro piezas principales:

| Componente | Responsabilidad |
|---|---|
| `TestCase` | Clase base que debe extender cada prueba. Proporciona soporte async e inyección automática del contexto de la aplicación |
| `TestingEngine` | Coordina el descubrimiento, filtrado, ejecución, salida en consola y almacenamiento en caché de resultados |
| `TestResult` | Dataclass inmutable que contiene el resultado completo de un método de prueba individual |
| `TestStatus` | Enumeración de cadena que representa los cuatro posibles resultados de una prueba |

---

## Arquitectura

A nivel general, el flujo es:

1. El `TestingEngine` lee sus valores predeterminados de la configuración de la aplicación (`config/testing.py`).
2. Escanea el directorio configurado buscando archivos de prueba que coincidan con un patrón glob.
3. Dentro de esos archivos, filtra los métodos individuales mediante un segundo patrón glob.
4. El motor entrega la suite de pruebas resultante al `TestRunner`, que ejecuta cada prueba dentro del contexto de la aplicación.
5. A medida que cada prueba finaliza, el `TestResultProcessor` registra un `TestResult` inmutable y lo renderiza en la consola según la verbosidad configurada.
6. Después de que todas las pruebas se completan, el runner muestra una tabla resumen con los conteos por estado y el tiempo total de ejecución.
7. Si el almacenamiento en caché está habilitado, la lista completa de resultados se persiste como un archivo JSON con marca de tiempo.

Toda la ejecución es asíncrona — el motor descarga la ejecución de pruebas a un pool de hilos para que el bucle de eventos permanezca desbloqueado.

---

## Configuración

Todos los valores predeterminados del testing se declaran en el dataclass `BootstrapTesting` en `config/testing.py`. El framework lee estos valores durante el arranque y los pasa al constructor del `TestingEngine` automáticamente.

```python
from orionis.foundation.config.testing.entities.testing import Testing
from orionis.foundation.config.testing.enums import VerbosityMode

class BootstrapTesting(Testing):
    verbosity: int | VerbosityMode = VerbosityMode.DETAILED
    fail_fast: bool = False
    start_dir: str = "tests"
    file_pattern: str = "test_*.py"
    method_pattern: str = "test*"
    cache_results: bool = False
```

### Referencia de Opciones

| Opción | Tipo | Predeterminado | Descripción |
|---|---|---|---|
| `verbosity` | `int \| VerbosityMode` | `DETAILED` (2) | Controla la cantidad de detalle impreso por prueba. Consulte la sección **Niveles de Verbosidad** más adelante |
| `fail_fast` | `bool` | `False` | Cuando es `True`, la ejecución se detiene inmediatamente después del primer fallo o error. Las pruebas restantes no se recopilan |
| `start_dir` | `str` | `"tests"` | Ruta relativa al directorio raíz donde el motor comienza a buscar archivos de prueba |
| `file_pattern` | `str` | `"test_*.py"` | Patrón glob aplicado contra los nombres de archivo en el directorio de inicio (y subdirectorios). Solo se cargan los archivos que coincidan |
| `method_pattern` | `str` | `"test*"` | Patrón glob aplicado contra los nombres de método dentro de cada clase de prueba descubierta. Solo se ejecutan los métodos que coincidan |
| `cache_results` | `bool` | `False` | Cuando es `True`, el motor serializa todos los objetos `TestResult` a un archivo JSON después de que la ejecución se complete |

:::tip[Sobrescritura en tiempo de ejecución]
Cada opción también puede sobrescribirse programáticamente a través de la API fluida del `TestingEngine` sin modificar el archivo de configuración. Esto es útil para ejecutar un subconjunto rápido de pruebas durante el desarrollo.
:::

### Enumeración VerbosityMode

La enumeración `VerbosityMode` proporciona constantes nombradas para los tres niveles de verbosidad:

| Miembro | Valor | Comportamiento |
|---|---|---|
| `VerbosityMode.SILENT` | `0` | Sin salida por prueba. Solo se muestra la tabla resumen después de que todas las pruebas finalicen |
| `VerbosityMode.MINIMAL` | `1` | Una línea compacta por prueba: badge de estado, nombre completamente cualificado, relleno de puntos y tiempo de ejecución |
| `VerbosityMode.DETAILED` | `2` | Un panel Rich por prueba con metadatos completos. Los fallos y errores incluyen el mensaje de excepción y el código fuente que rodea la línea causante |

---

## Niveles de Verbosidad en Detalle

### Silent — `VerbosityMode.SILENT` (0)

El motor ejecuta todas las pruebas sin imprimir resultados individuales. Después de que la suite finaliza, solo aparece la tabla resumen. Este modo es útil en pipelines de CI donde solo importa la señal final de éxito/fallo.

### Minimal — `VerbosityMode.MINIMAL` (1)

Cada prueba produce una sola línea que se ajusta al ancho del terminal:

```
 PASSED  • tests.unit.test_user.TestUserService.testCreatesUser ............. • ~ 0.003s
 FAILED  • tests.unit.test_user.TestUserService.testBadLogic ................ • ~ 0.012s
 SKIPPED • tests.unit.test_user.TestUserService.testPending ................. • ~ 0.000s
```

El badge de estado tiene código de color: verde para pasado, magenta para fallido, rojo para error y amarillo para omitido. Si el nombre de la prueba es demasiado largo para el terminal, se trunca con puntos suspensivos para evitar el ajuste de línea.

### Detailed — `VerbosityMode.DETAILED` (2)

Cada prueba renderiza un panel Rich con borde que contiene:

- **ID** — el ID de objeto Python de la instancia de prueba
- **Name** — identificador de prueba completamente cualificado (`módulo.clase.método`)
- **Class** — nombre de la clase de prueba
- **Method** — nombre del método de prueba
- **Module** — ruta del módulo
- **File path** — ruta absoluta al archivo fuente

Para pruebas que **pasan** o son **omitidas**, el panel muestra los metadatos anteriores con el tiempo de ejecución en el subtítulo.

Para pruebas que **fallan** o tienen **error**, el panel adicionalmente incluye:

- El nombre de la clase de excepción y el mensaje de error
- Un fragmento del código fuente alrededor de la línea causante (típicamente 3–4 líneas), con la línea exacta resaltada usando un marcador `*|`

:::danger[FAILED ~ 0.012s]
🔑 **ID:** 140234821907 | 📌 **Name:** tests.test_user.TestUserService.testBadLogic

📁 **Class:** TestUserService | 🔧 **Method:** testBadLogic | 📦 **Module:** tests.test_user

📄 **Path:** /app/tests/test_user.py:25

❌ **AssertionError:** 1 != 2

```python
  | 23:     def testBadLogic(self):
  | 24:         result = 1
 *| 25:         self.assertEqual(result, 2)
```
:::

Las pruebas con error muestran el icono `💥` en lugar de `❌` y usan un borde rojo.

---

## Salida en Consola

Independientemente del nivel de verbosidad, el motor siempre renderiza dos paneles que enmarcan la ejecución de pruebas:

### Panel de Inicio

Se muestra antes de que se ejecute la primera prueba. Contiene:

| Campo | Contenido |
|---|---|
| Título | `🚀 Orionis TestSuite` |
| Iniciado a las | Marca de tiempo actual en formato `YYYY-MM-DD HH:MM:SS`, usando la zona horaria configurada de la aplicación |
| PID | ID del proceso Python en ejecución |
| Política del bucle Reactor | Nombre de la política del bucle de eventos asyncio activa |
| Instrucción de parada | Recordatorio de `Ctrl+C` |

### Tabla Resumen

Se muestra después de que la última prueba finaliza. Una vista tabular con cinco columnas:

| Total | Passed | Failed | Errored | Skipped |
|:---:|:---:|:---:|:---:|:---:|
| 42 | 40 | 1 | 0 | 1 |

El subtítulo de la tabla muestra el tiempo total de ejecución en segundos con precisión de milisegundos.

---

## Almacenamiento de Resultados

Cuando `cache_results` se establece en `True` en `config/testing.py`, el motor escribe un archivo JSON después de cada ejecución. El archivo se almacena en:

```
storage/framework/cache/testing/<unix_timestamp>.json
```

### Formato del Archivo

El archivo JSON contiene un arreglo de objetos, uno por prueba ejecutada. Cada objeto incluye todos los campos del dataclass `TestResult`, con los valores de `TestStatus` serializados como su representación de cadena:

```json
[
    {
        "id": 140234821907,
        "name": "tests.test_user.TestUserService.testCreatesUser",
        "status": "PASSED",
        "execution_time": 0.003,
        "error_message": null,
        "traceback": null,
        "class_name": "TestUserService",
        "method": "testCreatesUser",
        "module": "tests.test_user",
        "file_path": "/app/tests/test_user.py",
        "doc_string": "Crear un usuario y persistirlo.",
        "exception": null,
        "line_no": null,
        "source_code": []
    }
]
```

### Casos de Uso

- **Integración CI/CD** — parsear el archivo JSON en su pipeline para extraer conteos de éxito/fallo, identificar pruebas inestables o generar reportes
- **Seguimiento histórico** — acumular archivos con marca de tiempo a lo largo del tiempo para detectar regresiones de rendimiento o tasas crecientes de fallos
- **Dashboards personalizados** — alimentar los resultados a una herramienta de monitoreo o base de datos para visualización

La carpeta de caché se crea automáticamente si no existe. Cada ejecución produce un nuevo archivo; los archivos anteriores no se sobrescriben ni se rotan.

---

## Estados de Prueba

Cada prueba ejecutada recibe exactamente uno de cuatro estados posibles, definidos en la enumeración `TestStatus`:

| Estado | Valor de Cadena | Cuándo se Asigna |
|---|---|---|
| `TestStatus.PASSED` | `"PASSED"` | El método de prueba se completó sin lanzar ninguna excepción y todas las aserciones tuvieron éxito |
| `TestStatus.FAILED` | `"FAILED"` | Se lanzó un `AssertionError` — típicamente de una llamada `self.assert*` que no se cumplió |
| `TestStatus.ERRORED` | `"ERRORED"` | Se lanzó una excepción inesperada (cualquier cosa diferente de `AssertionError`) durante la ejecución |
| `TestStatus.SKIPPED` | `"SKIPPED"` | La prueba fue marcada para omitirse, ya sea mediante `@unittest.skip`, `@unittest.skipIf` o `@unittest.skipUnless` |

`TestStatus` extiende `StrEnum`, lo que significa que cada miembro es simultáneamente una cadena. Se pueden comparar miembros contra cadenas planas, usarlos como claves de diccionario, serializarlos directamente a JSON o incluirlos en cadenas formateadas sin ninguna conversión:

```python
from orionis.test.enums.status import TestStatus

status = TestStatus.PASSED

# Comparación con cadena
status == "PASSED"          # True

# Uso como clave de diccionario
counts = {TestStatus.PASSED: 0, TestStatus.FAILED: 0}

# Interpolación directa de cadena
print(f"Resultado de la prueba: {status}")   # "Resultado de la prueba: PASSED"
```

La enumeración contiene exactamente cuatro miembros — no existen otros ni se agregarán.
