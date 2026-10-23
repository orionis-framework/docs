---
title: "Inyección de dependencias y aislamiento"
description: "Recibe servicios en los métodos de prueba, resuélvelos en fixtures y controla scopes y recursos externos."
editUrl: true
lastUpdated: false
---

## Inyección de dependencias

Orionis envuelve el método de prueba seleccionado y lo llama con `Application.invoke()`. Sus parámetros anotados reciben servicios registrados o clases que el contenedor puede construir. Funciona en métodos síncronos y asíncronos; no implica que un método síncrono pueda utilizar servicios asíncronos sin `await`.

Este ejemplo es autocontenido: la prueba recibe `PriceCalculator`, cuyo constructor recibe otra dependencia resoluble:

```python
from decimal import Decimal

from orionis.test import TestCase


class TaxPolicy:
    def rate(self) -> Decimal:
        return Decimal("0.20")


class PriceCalculator:
    def __init__(self, policy: TaxPolicy) -> None:
        self.policy = policy

    def total(self, net: Decimal) -> Decimal:
        return net * (Decimal("1") + self.policy.rate())


class TestPrices(TestCase):
    def testTaxIncluded(self, calculator: PriceCalculator) -> None:
        self.assertEqual(calculator.total(Decimal("10")), Decimal("12.00"))
```

Para contratos abstractos, registra su implementación en un [proveedor del contenedor](/es/application/container/providers). También puedes recibir `IApplication` y acceder a `app.config(...)`, `await app.make(...)` o `await app.invoke(...)`. Los helpers llamados directamente por tu código reciben los argumentos que tú les pases; no se inyectan por el mero hecho de pertenecer al caso.

### Resolver servicios scoped

El runner no crea un scope del contenedor por cada método. Un loop aislado tampoco vacía singletons, cachés ni bases de datos. Para probar la vida de un servicio scoped, abre el ámbito antes de resolverlo:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.test import TestCase


class TestScopeState:
    def __init__(self) -> None:
        self.values: list[str] = []


class TestScopedServices(TestCase):
    async def testFreshState(self, app: IApplication) -> None:
        app.scoped(None, TestScopeState, override=True)

        async with app.beginScope():
            first = await app.make(TestScopeState)
            first.values.append("created")
            self.assertIs(await app.make(TestScopeState), first)

        async with app.beginScope():
            second = await app.make(TestScopeState)
            self.assertIsNot(first, second)
            self.assertEqual(second.values, [])
```

El ejemplo registra una clase exclusiva de la prueba. En una aplicación normalmente el binding vive en un proveedor. No solicites `state: TestScopeState` como parámetro del método antes de abrir el ámbito: la inyección ocurre antes de entrar en su cuerpo. Al salir se elimina el estado del scope; los recursos que la instancia haya abierto siguen necesitando su cierre explícito.


## Resolver dependencias desde los hooks y helpers

Los hooks no aceptan parámetros de servicios. Cuando necesites la aplicación desde `asyncSetUp`, resuelve explícitamente su fachada y guarda los recursos de esa prueba. Este módulo es completo:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.support.facades import Application
from orionis.test import TestCase


class TestConfiguration(TestCase):
    async def asyncSetUp(self) -> None:
        self.app = await Application.resolve()

    async def _readName(self, app: IApplication) -> str:
        return app.config("app.name")

    async def testName(self) -> None:
        name = await self.app.invoke(self._readName)
        self.assertEqual(name, self.app.config("app.name"))
```

`_readName` es un helper, no un caso descubierto. `await self.app.invoke(...)` solicita la resolución de su parámetro; `await self._readName(self.app)` sería la llamada explícita equivalente. Añadir una anotación a un helper no hace que una llamada ordinaria reciba argumentos automáticamente.

Para obtener un servicio directamente utiliza `await self.app.make(ContratoOClase)`. Si tu fixture abre conexiones o recursos, registra su limpieza al adquirirlos con `addCleanup` o `addAsyncCleanup`; consulta [fixtures y limpieza](/es/testing/cases-and-decorators). No añadas parámetros inyectados al constructor de `TestCase`, `setUp`, `asyncSetUp` ni a los hooks de cierre.

## Qué aísla el runner

| Elemento | Alcance real |
| --- | --- |
| Instancia de `TestCase` y event loop | Se crean para el método seleccionado. |
| Aplicación y bindings singleton | Pueden reutilizarse durante la suite; no se reinician por caso. |
| Servicios scoped | Requieren un scope activo en el contexto que los resuelve. |
| Bases de datos, archivos, colas y caché | Conservan los cambios salvo la limpieza que programe la prueba. |

El motor ejecuta la suite síncrona en un executor. No propaga automáticamente a ese hilo el contexto del scope CLI; no dependas de él dentro del caso. Abre el scope en el propio método o fixture antes de resolver servicios scoped. El contenedor sí resuelve los constructores de los **servicios** que necesita el método; la instancia de `TestCase` la crea el loader de pruebas.

Una prueba de reglas puras no necesita sustituir la aplicación completa. Para integraciones utiliza datos exclusivos, almacenes destinados a pruebas y limpieza explícita. No hay rollback automático de base de datos por heredar de `TestCase`; la guía de [pruebas de Database y ORM](/es/orm/testing) explica sus mecanismos específicos.

## Elegir el entorno antes de ejecutar

`reactor test` no cambia por sí mismo `APP_ENV`, no reemplaza conexiones y no activa otro archivo `.env` por el nombre del comando. Configura los servicios de prueba antes de que se cree la aplicación; por ejemplo, en el `.env` que uses para esa ejecución:

```dotenv
APP_ENV=testing
APP_DEBUG=bool:false
```

Esto selecciona el entorno de aplicación; no convierte automáticamente una base de datos de producción en una base de pruebas. Configura sus conexiones, discos y servicios de acuerdo con tu proyecto. Las variables se leen en `config/`; desde la prueba recibe `IApplication` y utiliza `app.config(...)`.

Si mantienes caché compilada de bootstrap entre ejecuciones, revisa sus [rutas e invalidación](/es/application/paths-and-caching) al cambiar configuración. Evita reutilizar sin revisión la caché de otro entorno. Para sustituir colaboradores durante una prueba puedes utilizar `unittest.mock` y contextos de parcheo; consulta [dobles de prueba](/es/testing/cases-and-decorators#dobles-de-prueba).

El runner no crea una petición HTTP ni carga un payload para los parámetros del caso. Para probar una regla o schema invócalo con los datos de tu fixture; para peticiones MCP utiliza [el cliente MCP de pruebas](/es/mcp/testing), cuyo scope por petición pertenece a esa integración.
