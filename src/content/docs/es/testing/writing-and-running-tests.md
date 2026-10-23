---
title: "Escribir y ejecutar pruebas"
description: "Genera un TestCase con make:test, sustituye el ejemplo omitido por aserciones y ejecuta casos sync o async desde Reactor."
editUrl: true
lastUpdated: false
---

## Crear un caso con `make:test`

Desde la raíz de la aplicación, elige una de estas alternativas:

```shell
orionis make:test unit/price
```

```shell
python -B reactor make:test unit/price
```

Si prefieres que uv seleccione el entorno del proyecto, utiliza `uv run python -B reactor make:test unit/price`. Los tres comandos generan el mismo archivo; no los ejecutes consecutivamente para crear un único caso.

El generador recibe **un argumento obligatorio `name`** y admite `-h`/`--help`. No ofrece flags para elegir otra clase base o sobrescribir archivos. El destino se toma de `app.path("tests")`, normalmente `tests/`:

| Nombre proporcionado | Archivo predeterminado | Clase generada |
| --- | --- | --- |
| `price` | `tests/test_price.py` | `TestPrice` |
| `unit/price` | `tests/unit/test_price.py` | `TestPrice` |
| `feature/test_order` | `tests/feature/test_order.py` | `TestOrder` |

Añade `test_` al nombre de archivo si falta, convierte archivos y subdirectorios a minúsculas y compone la clase a partir de los segmentos separados por `_`. No convierte automáticamente CamelCase en snake_case: prefiere nombres como `order_total`. Crea los directorios necesarios y rechaza rutas absolutas, componentes vacíos, `.`/`..` o nombres de módulos inválidos. Si el archivo ya existe, informa del error y lo conserva; edítalo directamente o elige otro nombre.

## Entender la plantilla generada

Para `unit/price`, el stub produce esta clase:

```python
from orionis.test import TestCase

class TestPrice(TestCase):
    """Describe the application behavior covered by this test case."""

    async def testExample(self) -> None:
        """
        Describe one expected behavior and add its assertions.

        Returns
        -------
        None
            The test completes after its assertions pass.
        """
        self.skipTest("Replace this placeholder with assertions.")
```

**Todos los casos de prueba de Orionis deben heredar de `TestCase`, importado con `from orionis.test import TestCase`.** La plantilla crea un método asíncrono y una omisión explícita; todavía no comprueba un comportamiento. Sustituye `skipTest(...)` por las operaciones y aserciones de tu aplicación antes de considerar cubierta esa funcionalidad.

Los nombres de archivo coinciden por defecto con `test_*.py`; los métodos deben empezar por `test`. No es obligatorio que el nombre de la clase tenga ese prefijo, aunque el generador lo usa para mantener una convención clara.

## Escribir una primera prueba completa

Reemplaza el contenido de `tests/unit/test_price.py` por este módulo. La función representa una regla de ejemplo; en tu aplicación importa el servicio o función que necesitas probar.

```python
from orionis.test import TestCase


def final_price(cents: int) -> int:
    if cents < 0:
        raise ValueError("Price cannot be negative")
    return cents + cents // 5


class TestPrice(TestCase):
    def testTotal(self) -> None:
        self.assertEqual(final_price(1000), 1200)

    async def testRejectsNegative(self) -> None:
        with self.assertRaisesRegex(ValueError, "cannot be negative"):
            final_price(-1)
```

El primer método es síncrono y el segundo asíncrono: ambos se admiten. Dentro de un método `async`, utiliza `await` cuando el servicio invocado lo requiera; no necesitas `asyncio.run()`. Los métodos de prueba terminan sin devolver un resultado de negocio: las aserciones determinan si pasan o fallan.

## Ejecutar y seleccionar casos

Con el entorno del proyecto activo, elige el comando directo o Reactor:

```shell
orionis test
```

```shell
python -B reactor test
```

Ejecuta solo el archivo anterior desde la misma raíz:

```shell
python -B reactor test --start-dir tests/unit --file-pattern "test_price.py" --no-panel --verbosity 1
```

Debe ejecutar dos métodos aprobados. Para seleccionar uno:

```shell
python -B reactor test --start-dir tests/unit --file-pattern "test_price.py" --method-pattern "testRejects*" --fail-fast 1
```

`--method-pattern` filtra los candidatos `test*` encontrados por el loader; no habilita métodos llamados `checkSomething`. `--fail-fast` recibe un valor entero, no es un interruptor sin argumento. Consulta todas las opciones, sus valores predeterminados y la salida JSON en [Resultados y configuración](/es/testing/results-and-reference).

## Organizar las pruebas

Puedes separar reglas sin I/O en `tests/unit` e integraciones en `tests/integration` o `tests/feature`. Son convenciones del proyecto, no categorías especiales del motor. El descubrimiento recorre subdirectorios; el directorio inicial debe estar dentro del proyecto y ser importable desde su raíz. Mantén el directorio de trabajo en esa raíz al ejecutar Reactor.

El comando utiliza los proveedores y la configuración de la aplicación. No cambia automáticamente `APP_ENV`, conexiones de base de datos o drivers a un entorno aislado. Configura los recursos de prueba antes del bootstrap; revisa [inyección y aislamiento](/es/testing/dependency-injection) antes de probar persistencia.

Continúa con [el ciclo de vida y los decoradores](/es/testing/cases-and-decorators). Las pruebas de componentes MCP tienen su [guía específica](/es/testing/mcp-testing).
