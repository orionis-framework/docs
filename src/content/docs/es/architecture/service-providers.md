---
title: Proveedores de servicios
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Proveedores de servicios

Los proveedores de servicios son el mecanismo central de configuración en Orionis. A través de ellos se registran servicios, se vinculan contratos a implementaciones concretas y se ejecutan tareas de inicialización durante el arranque de la aplicación.

Todo proveedor extiende la clase `ServiceProvider`, que recibe automáticamente la instancia de la aplicación (`self.app`) y expone dos métodos del ciclo de vida: `register` y `boot`. Orionis se encarga de invocar estos métodos en el orden correcto durante el proceso de arranque.

Los proveedores se ubican en el directorio `app/providers`. El proveedor predeterminado es `app/providers/app_service_provider.py`, pero puedes crear tantos proveedores como necesites para organizar el registro de servicios de forma modular.

## Crear un proveedor de servicios

Para generar un nuevo proveedor, utiliza el comando `make:provider` de Reactor CLI:

```bash
python -B reactor make:provider riak_service_provider
```

Este comando crea el archivo `app/providers/riak_service_provider.py` con la siguiente estructura:

```python
from orionis.container.providers.service_provider import ServiceProvider

class RiakServiceProvider(ServiceProvider):

    def register(self) -> None:
        # Registra servicios en el contenedor aquí.
        ...

    async def boot(self) -> None:
        # Ejecuta tareas de inicialización asíncronas aquí.
        ...
```

El método `register` se utiliza para vincular servicios al contenedor, mientras que `boot` permite ejecutar lógica de inicialización una vez que todos los proveedores han sido registrados.

## Crear un proveedor diferido

Un proveedor diferido (*deferred*) no se carga durante el arranque de la aplicación, sino únicamente cuando se solicita por primera vez uno de los servicios que declara. Esto mejora el rendimiento al evitar la inicialización de servicios que pueden no ser necesarios en cada solicitud.

Para generar un proveedor diferido, agrega la opción `--deferred`:

```bash
python -B reactor make:provider neo4j_service_provider --deferred
```

Esto genera una clase que hereda tanto de `ServiceProvider` como de `DeferrableProvider`:

```python
from orionis.container.providers.deferrable_provider import DeferrableProvider
from orionis.container.providers.service_provider import ServiceProvider

class Neo4jServiceProvider(ServiceProvider, DeferrableProvider):

    def register(self) -> None:
        # Registra servicios en el contenedor aquí.
        ...

    async def boot(self) -> None:
        # Ejecuta tareas de inicialización asíncronas aquí.
        ...

    @classmethod
    def provides(cls) -> list[type]:
        return []
```

La diferencia clave respecto a un proveedor estándar es la herencia de `DeferrableProvider` y la implementación del método de clase `provides`, que debe devolver la lista de tipos (contratos) que este proveedor ofrece.

## Proveedores estándar vs. diferidos

Orionis clasifica automáticamente cada proveedor según su jerarquía de herencia:

| Característica | Proveedor estándar | Proveedor diferido |
|---|---|---|
| **Herencia** | `ServiceProvider` | `ServiceProvider` + `DeferrableProvider` |
| **Momento de carga** | Durante el arranque de la aplicación | Cuando se solicita un servicio que declara |
| **Método `provides`** | No aplica | Obligatorio |
| **Caso de uso** | Servicios que se necesitan siempre | Servicios opcionales o de uso infrecuente |

Internamente, cuando se llama a `withProviders`, Orionis inspecciona si la clase es subclase de `DeferrableProvider`. Si lo es, registra el proveedor en un registro diferido indexado por los tipos que devuelve `provides()`. En caso contrario, lo registra como un proveedor de carga inmediata (*eager*).

Cuando la aplicación necesita resolver un servicio que aún no está vinculado en el contenedor, consulta el registro diferido. Si encuentra un proveedor que lo declara, lo instancia, ejecuta su ciclo `register`/`boot` en ese momento y resuelve el servicio.

## Métodos del ciclo de vida

Todo proveedor de servicios dispone de dos métodos que conforman su ciclo de vida: `register` y `boot`. Comprender cuándo y cómo se ejecuta cada uno es fundamental para estructurar correctamente los servicios de la aplicación.

### Método `register`

El método `register` es **sincrónico** y se invoca durante la fase de registro de la aplicación. Su propósito exclusivo es vincular servicios al contenedor de inyección de dependencias. No debe ejecutar lógica de negocio ni depender de otros servicios, ya que no hay garantía de que estén disponibles en este punto.

Dentro de `register`, se utilizan los métodos de vinculación del contenedor para definir el ciclo de vida de cada servicio:

| Método | Ciclo de vida | Descripción |
|---|---|---|
| `self.app.singleton(abstract, concrete)` | **Singleton** | Una única instancia compartida durante toda la vida de la aplicación. |
| `self.app.transient(abstract, concrete)` | **Transient** | Una nueva instancia cada vez que se solicita el servicio. |
| `self.app.scoped(abstract, concrete)` | **Scoped** | Una instancia compartida dentro de un ámbito definido. |

Cada método de vinculación acepta los siguientes parámetros:

- `abstract` — El tipo del contrato (interfaz). Puede ser `None` para usar directamente el tipo concreto.
- `concrete` — La clase de implementación concreta.
- `alias` *(opcional)* — Un alias de tipo `str` para resolver el servicio por nombre.
- `override` *(opcional)* — Si es `True`, reemplaza un registro existente para el mismo contrato.

Ejemplo de registro con un servicio singleton:

```python
from app.services.database_service import DatabaseService
from app.services.contracts.database_service import IDatabaseService
from orionis.container.providers.service_provider import ServiceProvider

class DatabaseServiceProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(IDatabaseService, DatabaseService)
```

Ejemplo con múltiples ciclos de vida:

```python
from orionis.container.providers.service_provider import ServiceProvider
from app.services.contracts.cache_service import ICacheService
from app.services.contracts.logger_service import ILoggerService
from app.services.contracts.request_context import IRequestContext
from app.services.cache_service import CacheService
from app.services.logger_service import LoggerService
from app.services.request_context import RequestContext

class AppServiceProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(ICacheService, CacheService)
        self.app.transient(ILoggerService, LoggerService)
        self.app.scoped(IRequestContext, RequestContext)
```

### Método `boot`

El método `boot` es **asíncrono** (`async def`) y se ejecuta después de que todos los proveedores han completado su fase de registro. En este punto, todos los servicios registrados están disponibles en el contenedor, lo que permite realizar tareas de inicialización que dependan de otros servicios.

Casos de uso típicos del método `boot`:

- Establecer conexiones a bases de datos o servicios externos.
- Configurar listeners de eventos.
- Inicializar cachés o cargar configuración desde fuentes externas.

```python
from app.services.event_service import EventService
from app.services.contracts.event_service import IEventService
from orionis.container.providers.service_provider import ServiceProvider

class EventServiceProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(IEventService, EventService)

    async def boot(self) -> None:
        event_service = await self.app.make(IEventService)
        await event_service.initialize()
```

:::note
El método `make` del contenedor es asíncrono. Debe invocarse con `await` para resolver correctamente las dependencias.
:::

### Método `provides`

El método `provides` es exclusivo de los proveedores diferidos. Es un **método de clase** (`@classmethod`) que debe devolver una lista con los tipos de servicios (contratos) que el proveedor ofrece. Orionis utiliza esta información para saber qué proveedor instanciar cuando se solicita un servicio que aún no ha sido registrado.

Si un proveedor diferido no implementa `provides`, se lanzará un `NotImplementedError` en tiempo de ejecución.

```python
from app.services.neo4j_service import Neo4jService
from app.services.contracts.neo4j_service import INeo4jService
from orionis.container.providers.deferrable_provider import DeferrableProvider
from orionis.container.providers.service_provider import ServiceProvider

class Neo4jServiceProvider(ServiceProvider, DeferrableProvider):

    def register(self) -> None:
        self.app.singleton(INeo4jService, Neo4jService)

    async def boot(self) -> None:
        neo4j_service = await self.app.make(INeo4jService)
        await neo4j_service.initialize()

    @classmethod
    def provides(cls) -> list[type]:
        return [INeo4jService]
```

En este ejemplo, cuando la aplicación intente resolver `INeo4jService` por primera vez, Orionis detectará que `Neo4jServiceProvider` lo declara en `provides`, lo instanciará, ejecutará `register` y `boot`, y finalmente devolverá la instancia del servicio.

## Registrar proveedores en la aplicación

Para que Orionis cargue un proveedor durante el arranque, debe declararse en el archivo `bootstrap/app.py` mediante el método `withProviders`:

```python
from app.providers.app_service_provider import AppServiceProvider
from app.providers.database_service_provider import DatabaseServiceProvider
from app.providers.event_service_provider import EventServiceProvider
from app.providers.neo4j_service_provider import Neo4jServiceProvider

# ...

app.withProviders(
    AppServiceProvider,
    DatabaseServiceProvider,
    EventServiceProvider,
    Neo4jServiceProvider,
    # Agrega aquí mas proveedores personalizados
)

# ...
```

El método `withProviders` acepta una cantidad variable de clases que hereden de `ServiceProvider`. Cada clase se valida automáticamente y se clasifica como proveedor estándar o diferido según su jerarquía de herencia. Si alguna clase no es subclase de `IServiceProvider`, se lanzará un `TypeError`.

El método retorna la instancia de la aplicación.

## Flujo de arranque

El siguiente diagrama resume el orden en que Orionis procesa los proveedores de servicios durante el arranque:

1. **Clasificación** — `withProviders` recibe las clases de proveedores y las clasifica en el registro *eager* (estándar) o *deferred* (diferido).
2. **Registro** — Orionis instancia cada proveedor estándar pasándole la aplicación (`self.app`) e invoca su método `register`.
3. **Arranque** — Una vez que todos los proveedores estándar han sido registrados, Orionis invoca el método `boot` de cada uno (respetando su naturaleza asíncrona).
4. **Resolución diferida** — Los proveedores diferidos permanecen inactivos hasta que la aplicación intenta resolver un servicio no registrado. En ese momento, Orionis consulta el registro diferido, instancia el proveedor correspondiente y ejecuta su ciclo `register`/`boot` bajo demanda.