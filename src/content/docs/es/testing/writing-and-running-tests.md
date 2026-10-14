---
title: "Escribir y ejecutar pruebas"
description: "Crea tests/unit/test_arithmetic.py con este módulo completo (crea los directorios si hacen falta):"
editUrl: true
lastUpdated: false
---

## Inicio rápido

Crea `tests/unit/test_arithmetic.py` con este módulo completo (crea los directorios si hacen falta):

```python
from orionis.test import TestCase

class TestArithmetic(TestCase):
    async def testAddition(self) -> None:
        self.assertEqual(2 + 2, 4)
```

Ejecuta la suite desde la raíz del proyecto:

```powershell
uv run python -B reactor test
uv run python -B reactor test --start-dir tests/unit --file-pattern "test_arithmetic.py" --no-panel --verbosity 1
```

El segundo comando selecciona el archivo nuevo y debe mostrar una prueba aprobada con código de salida 0. El primero ejecuta toda la suite configurada, incluidas otras pruebas existentes del proyecto. Un archivo debe coincidir con `test_*.py` y sus métodos con `test*`, salvo que cambies los patrones configurados.

Para seleccionar métodos o detenerte en el primer fallo:

```shell
uv run python -B reactor test --method-pattern "testAddition*" --fail-fast 1
```

`--fail-fast` recibe `0` o `1`; no es una opción sin valor. Si no se encuentran pruebas, revisa el directorio inicial y ambos patrones antes de considerar validada la aplicación.

## Conceptos principales

### Casos conscientes de la aplicación

`TestCase` extiende `unittest.IsolatedAsyncioTestCase`. Al construirse envuelve solo el método seleccionado —no los hooks del ciclo de vida— y lo ejecuta mediante `Application.invoke()`. Así los métodos reciben la misma resolución automática de dependencias que los callables de la aplicación. La ruta de invocación acepta métodos de prueba síncronos y asíncronos.

Cada caso obtiene un event loop aislado. El umbral de callbacks lentos se establece en un segundo y se conserva el modo de depuración de asyncio. El patrón de nombres vive en un `ContextVar`, por lo que contextos concurrentes de descubrimiento no se sobrescriben.

### Descubrimiento y ejecución

`TestingEngine` recorre recursivamente el directorio configurado, incluidos directorios sin `__init__.py`, carga archivos coincidentes y filtra métodos individuales. Crea una suite nueva en cada ejecución y envía el runner síncrono de `unittest` a un executor para no bloquear el event loop del llamador.

### Resultados estructurados

`TestResultProcessor` convierte éxitos, fallos, errores, omisiones, fallos esperados, éxitos inesperados y resultados de subpruebas en entidades `TestResult`. Un resultado registra estado, duración, ubicación, documentación, detalles de excepción, traceback y código fuente cercano. La caché JSON opcional serializa estas entidades bajo `storage/framework/cache/testing`.

### Pruebas MCP a nivel de protocolo

`McpTestClient` compila un servidor una vez, envía mensajes JSON-RPC codificados mediante `McpDispatcher` y crea un ámbito nuevo del contenedor por petición o stream. `McpTestResponse` expone el mensaje final decodificado junto a las notificaciones recopiladas y aserciones breves de éxito y texto retornado.

## Flujos de trabajo comunes

### Probar dependencias resueltas

Anota el método como cualquier callable invocado por la aplicación. Orionis resuelve el parámetro cuando el runner invoca el caso:

```python
from uuid import uuid4
from orionis.cache.contracts.cache_manager import ICacheManager
from orionis.test import TestCase

class TestHealth(TestCase):
    async def testCache(self, cache: ICacheManager) -> None:
        key = f"tests:health:{uuid4().hex}"
        try:
            await cache.set(key, "ok", ttl=10)
            self.assertEqual(await cache.get(key), "ok")
        finally:
            await cache.delete(key)
```

### Comprobar una respuesta MCP

```python
from orionis.test import McpTestResponse

response = McpTestResponse({
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
        "content": [{"type": "text", "text": "Hello, Ada"}],
        "isError": False,
    },
})
response.assertOk()
response.assertTextContains("Ada")
assert response.notifications == ()
```

### Inspeccionar un resultado estructurado

```python
from orionis.test.entities.result import TestResult
from orionis.test.enums.status import TestStatus

result = TestResult(
    id="case-1",
    name="tests.unit.TestUsers.testCreate",
    status=TestStatus.PASSED,
    execution_time=0.012,
)

payload = result.toDict()
assert payload["status"] == "PASSED"
assert payload["execution_time"] == 0.012
```

## Configuración

La entidad de configuración `testing` lee estas variables de entorno:

| Variable de entorno | Predeterminado | Significado |
| --- | --- | --- |
| `TESTING_VERBOSITY` | `2` | `0` silencioso, `1` compacto, `2` detallado. |
| `TESTING_FAIL_FAST` | `False` | Detenerse tras el primer fallo o error. |
| `TESTING_START_DIR` | `tests` | Raíz de descubrimiento. |
| `TESTING_FILE_PATTERN` | `test_*.py` | Patrón de archivos. |
| `TESTING_METHOD_PATTERN` | `test*` | Patrón de métodos. |
| `TESTING_CACHE_RESULTS` | `False` | Persistir resultados estructurados como JSON. |

Los argumentos CLI sustituyen los valores configurados correspondientes. `--no-panel` oculta los paneles Rich inicial y final independientemente de la verbosidad por prueba.

## Integración con Orionis

`TestingProvider` enlaza `ITestingEngine` como singleton y fija la fachada `Test` durante el arranque. El comando `reactor test` resuelve ese motor, aplica las opciones de línea de comandos, lo ejecuta y deriva el estado del proceso a partir de los resultados estructurados.

`TestCase.mcp()` reutiliza por defecto la aplicación ya arrancada. Pasa `app=` solo cuando una prueba posea deliberadamente otro contenedor compatible. Esto evita que el cliente MCP cree silenciosamente una aplicación paralela con bindings distintos.

## Aislar el estado de una prueba

Cada caso usa un event loop aislado; la aplicación, sus singletons y los datos externos pueden seguir compartidos. La base no promete rollback de base de datos, vaciado de caché ni un scope independiente por método. Usa almacenes temporales o de memoria, claves únicas y cleanup explícito. El ejemplo de caché elimina su clave en `finally`. Para resolver un servicio scoped, abre `async with app.beginScope()` y resuélvelo dentro del bloque; no lo solicites como argumento antes de que exista ese scope. Los hooks `setUp` y `asyncSetUp` conservan sus firmas unittest y no reciben inyección automática.

## Referencia y próximos pasos

[case.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/test/cases/case.py) · [engine.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/test/core/engine.py) · [test_example.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/tests/test_example.py)

[Volver al índice del módulo](/es/testing).
