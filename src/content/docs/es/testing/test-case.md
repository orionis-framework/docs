---
title: TestCase
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# TestCase

`TestCase` es la clase base que cada prueba en una aplicación Orionis debe extender. Hereda de `unittest.IsolatedAsyncioTestCase`, lo que significa que soporta métodos de prueba tanto síncronos como asíncronos de forma nativa. Su adición clave sobre el `unittest` estándar es la **inyección automática del contexto de la aplicación** — cada método de prueba se ejecuta dentro del contexto completo de la aplicación Orionis, con el contenedor de servicios, la configuración y todos los proveedores arrancados disponibles.

## Importación

```python
from orionis.test import TestCase
```

Esta es la única importación necesaria para comenzar a escribir pruebas. `TestCase` es la única exportación pública del paquete `orionis.test`.

---

## Cómo Funciona

Cuando el runner de pruebas llama a un método de prueba, `TestCase` intercepta el acceso al atributo a través de un hook personalizado `__getattribute__`. Si el nombre accedido coincide con el patrón de método configurado (por defecto `test*`) y es un invocable (método o función), `TestCase` lo envuelve en una función asíncrona que llama a `Application.invoke()`. Esto garantiza:

1. **El contenedor de servicios está activo** — se pueden usar type-hints de dependencias en los métodos de prueba y estas se resuelven automáticamente, exactamente como se haría en un controlador o servicio.
2. **La configuración está cargada** — todos los valores de `config/*.py` son accesibles a través de la instancia de la aplicación.
3. **Los proveedores están arrancados** — cada proveedor de servicio registrado ha sido `register()`ado y `boot()`eado antes de que el código de prueba se ejecute.
4. **El soporte async es nativo** — tanto los métodos `def test...` como `async def test...` funcionan. Los métodos síncronos son await-eados a través del mismo wrapper de forma transparente.

Los atributos privados (nombres que comienzan con `_`) y los atributos no invocables omiten el envolvimiento por completo y se retornan tal cual.

---

## Escribir la Primera Prueba

### Prueba Síncrona Básica

```python
from orionis.test import TestCase

class TestMathOperations(TestCase):

    def testAddition(self):
        self.assertEqual(1 + 1, 2)

    def testSubtraction(self):
        result = 10 - 3
        self.assertGreater(result, 0)
        self.assertEqual(result, 7)
```

### Prueba Asíncrona

```python
from orionis.test import TestCase

class TestAsyncService(TestCase):

    async def testFetchData(self):
        # Las operaciones async se ejecutan con await automáticamente
        data = await some_async_service.fetch()
        self.assertIsNotNone(data)
        self.assertIn("key", data)

    async def testAsyncExceptionHandling(self):
        with self.assertRaises(ValueError):
            await some_async_service.validate(invalid_input)
```

Dado que `TestCase` extiende `IsolatedAsyncioTestCase`, cada método de prueba async obtiene su propio bucle de eventos. No es necesario gestionar el bucle manualmente.

### Pruebas con el Contenedor de Servicios

Dado que cada método de prueba se invoca a través de `Application.invoke()`, el contenedor de servicios resuelve las dependencias automáticamente. Agregue un type-hint de un contrato o una clase concreta como parámetro del método y el framework inyecta la implementación registrada — exactamente como lo hace con controladores o clases de servicio:

```python
from orionis.test import TestCase
from app.contracts.user_service import IUserService

class TestUserService(TestCase):

    async def testUserCreation(self, user_service: IUserService):
        user = await user_service.create(name="John", email="john@example.com")
        self.assertIsNotNone(user.id)
        self.assertEqual(user.name, "John")
```

Se pueden inyectar tantas dependencias como sea necesario:

```python
from orionis.test import TestCase
from app.contracts.user_service import IUserService
from app.contracts.notification_service import INotificationService

class TestNotifications(TestCase):

    async def testWelcomeEmailIsSent(
        self,
        user_service: IUserService,
        notifications: INotificationService,
    ):
        user = await user_service.create(name="Jane", email="jane@example.com")
        result = await notifications.sendWelcome(user)
        self.assertTrue(result)
```

:::tip[Contratos sobre concretos]
Prefiera inyectar contratos (interfaces) en lugar de clases concretas. Esto mantiene las pruebas desacopladas de implementaciones específicas y asegura que ejerciten la misma ruta de resolución que la aplicación usa en tiempo de ejecución.
:::

---

## Aserciones

`TestCase` hereda la biblioteca completa de aserciones de `unittest.TestCase`. Cada método de aserción estándar está disponible:

### Igualdad

```python
self.assertEqual(a, b)           # a == b
self.assertNotEqual(a, b)        # a != b
self.assertAlmostEqual(a, b)     # round(a - b, 7) == 0
self.assertNotAlmostEqual(a, b)  # round(a - b, 7) != 0
```

### Veracidad

```python
self.assertTrue(expr)     # bool(expr) is True
self.assertFalse(expr)    # bool(expr) is False
```

### Identidad y Tipo

```python
self.assertIs(a, b)            # a is b
self.assertIsNot(a, b)         # a is not b
self.assertIsNone(value)       # value is None
self.assertIsNotNone(value)    # value is not None
self.assertIsInstance(obj, cls)     # isinstance(obj, cls)
self.assertNotIsInstance(obj, cls)  # not isinstance(obj, cls)
```

### Pertenencia

```python
self.assertIn(item, container)       # item in container
self.assertNotIn(item, container)    # item not in container
```

### Comparación

```python
self.assertGreater(a, b)        # a > b
self.assertGreaterEqual(a, b)   # a >= b
self.assertLess(a, b)           # a < b
self.assertLessEqual(a, b)      # a <= b
```

### Excepciones

```python
# Como administrador de contexto
with self.assertRaises(ValueError):
    function_that_raises()

# Con coincidencia de mensaje
with self.assertRaisesRegex(ValueError, "invalid"):
    function_that_raises()
```

### Coincidencia de Cadenas

```python
self.assertRegex(text, pattern)       # re.search(pattern, text)
self.assertNotRegex(text, pattern)    # not re.search(pattern, text)
```

### Comparación de Colecciones

```python
self.assertCountEqual(a, b)     # mismos elementos, sin importar el orden
self.assertSequenceEqual(a, b)  # mismos elementos en el mismo orden
self.assertListEqual(a, b)      # específicamente para listas
self.assertDictEqual(a, b)      # específicamente para diccionarios
self.assertSetEqual(a, b)       # específicamente para conjuntos
```

---

## Omitir Pruebas

Use los decoradores estándar de `unittest` para omitir pruebas condicionalmente. Las pruebas omitidas reciben el estado `SKIPPED` y no cuentan como fallos.

### Omisión Incondicional

```python
import unittest
from orionis.test import TestCase

class TestFeature(TestCase):

    @unittest.skip("Aún no implementado")
    def testPendingFeature(self):
        pass
```

### Omisión Condicional

```python
import sys
import unittest
from orionis.test import TestCase

class TestPlatformSpecific(TestCase):

    @unittest.skipIf(sys.platform == "win32", "No soportado en Windows")
    def testLinuxOnlyFeature(self):
        pass

    @unittest.skipUnless(sys.platform.startswith("linux"), "Requiere Linux")
    def testLinuxBehavior(self):
        pass
```

### Omisión Programática

```python
from orionis.test import TestCase

class TestConditional(TestCase):

    def testMaybeSkip(self):
        if not some_precondition():
            self.skipTest("Precondición no cumplida")
        # La lógica de la prueba continúa aquí...
```

---

## Setup y Teardown

`TestCase` soporta todos los hooks estándar de setup y teardown de `unittest`. Estos se ejecutan **fuera** del wrapper del contexto de la aplicación — solo los métodos de prueba que coincidan con el patrón de método son envueltos.

### Hooks por Prueba

```python
from orionis.test import TestCase

class TestWithSetup(TestCase):

    def setUp(self):
        """Se ejecuta antes de cada método de prueba."""
        self.data = {"key": "value"}

    def tearDown(self):
        """Se ejecuta después de cada método de prueba, incluso si falló."""
        self.data = None

    def testDataIsAvailable(self):
        self.assertIn("key", self.data)
```

### Hooks por Clase

```python
from orionis.test import TestCase

class TestWithClassSetup(TestCase):

    @classmethod
    def setUpClass(cls):
        """Se ejecuta una vez antes de cualquier prueba en la clase."""
        cls.shared_resource = create_expensive_resource()

    @classmethod
    def tearDownClass(cls):
        """Se ejecuta una vez después de todas las pruebas en la clase."""
        cls.shared_resource.close()

    def testUsesSharedResource(self):
        self.assertIsNotNone(self.shared_resource)
```

### Setup y Teardown Asíncronos

Dado que `TestCase` extiende `IsolatedAsyncioTestCase`, las variantes asíncronas también son soportadas:

```python
from orionis.test import TestCase

class TestAsyncSetup(TestCase):

    async def asyncSetUp(self):
        """Setup async — se ejecuta antes de cada prueba async."""
        self.connection = await create_async_connection()

    async def asyncTearDown(self):
        """Teardown async — se ejecuta después de cada prueba async."""
        await self.connection.close()

    async def testAsyncOperation(self):
        result = await self.connection.query("SELECT 1")
        self.assertIsNotNone(result)
```

---

## Patrón de Método

Por defecto, solo los métodos cuyo nombre coincida con el patrón glob `test*` son reconocidos como métodos de prueba y envueltos con el contexto de la aplicación. Esto sigue la convención estándar de `unittest`.

### Cambiar el Patrón

El patrón se puede cambiar a nivel de clase mediante el método de clase `setMethodPattern`:

```python
from orionis.test.cases.case import TestCase

# Ahora solo los métodos que comiencen con "check" serán tratados como pruebas
TestCase.setMethodPattern("check*")
```

:::caution[Efecto global]
`setMethodPattern` modifica un atributo a nivel de clase. Cambiarlo afecta a **todas** las subclases de `TestCase` durante el resto del proceso. En la práctica, esto es gestionado por el `TestingEngine` basándose en la configuración `method_pattern`, por lo que rara vez se necesita llamarlo manualmente.
:::

El patrón usa la sintaxis glob de `fnmatch`:

| Patrón | Coincide con |
|---|---|
| `test*` | `testCreate`, `testUpdate`, `test_delete` |
| `test_user*` | `test_user_create`, `test_user_delete` |
| `check*` | `checkValid`, `checkInvalid` |
| `*` | Todos los métodos públicos |

---

## Organización de Pruebas

### Estructura de Directorios Recomendada

```
tests/
├── __init__.py
├── unit/
│   ├── __init__.py
│   ├── test_user_service.py
│   └── test_order_service.py
├── integration/
│   ├── __init__.py
│   ├── test_database.py
│   └── test_api.py
└── feature/
    ├── __init__.py
    └── test_checkout_flow.py
```

### Convención de Nombres de Archivo

El patrón de archivo predeterminado `test_*.py` espera que los archivos comiencen con `test_`. Todos los archivos en el `start_dir` (y sus subdirectorios) que coincidan con este patrón se cargan. Cada archivo debe contener una o más clases que extiendan `TestCase`.

### Convención de Nombres de Método

Los métodos de prueba deben comenzar con `test` (coincidiendo con el patrón predeterminado `test*`). Use nombres descriptivos en camelCase que transmitan lo que se está probando:

```python
class TestPaymentService(TestCase):

    def testChargeSucceedsWithValidCard(self):
        ...

    def testChargeFailsWithExpiredCard(self):
        ...

    def testRefundReturnsFullAmount(self):
        ...
```

---

## Referencia de Métodos

| Método / Característica | Tipo | Descripción |
|---|---|---|
| `setMethodPattern(pattern)` | `classmethod` | Reemplaza el patrón glob usado para identificar qué métodos son de prueba. El predeterminado es `test*` |
| `setUp()` / `tearDown()` | instancia | Hooks estándar de setup y teardown por prueba |
| `setUpClass()` / `tearDownClass()` | `classmethod` | Hooks que se ejecutan una vez por clase |
| `asyncSetUp()` / `asyncTearDown()` | instancia | Hooks asíncronos de setup y teardown por prueba |
| Todos los métodos `self.assert*()` | instancia | Biblioteca completa de aserciones de `unittest.TestCase` |
| `self.skipTest(reason)` | instancia | Omitir programáticamente la prueba actual |
| Métodos de prueba sync y async | instancia | Tanto `def test...` como `async def test...` son soportados nativamente |
| Inyección de contexto de aplicación | automático | Cada método de prueba coincidente se envuelve para ejecutarse dentro del contexto de la aplicación Orionis |
