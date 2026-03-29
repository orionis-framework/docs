---
title: Contenedor de servicios
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Introducción

El **Contenedor de Servicios** es el núcleo de la arquitectura de Orionis Framework. Implementa un sistema de **Inversión de Control** (IoC) que centraliza el registro, la resolución y el ciclo de vida de todas las dependencias de la aplicación.

En lugar de instanciar clases manualmente o propagar dependencias de forma explícita a través de cada capa, el contenedor las resuelve automáticamente a partir de las anotaciones de tipo declaradas en constructores y métodos. Esto desacopla los componentes entre sí y facilita el mantenimiento, la extensibilidad y las pruebas.

El contenedor es un **singleton thread-safe**: existe una única instancia compartida durante toda la vida del proceso, independientemente de si el contexto es una solicitud HTTP, un comando CLI o una tarea programada. La implementación utiliza un patrón de **double-checked locking** con `threading.RLock` para garantizar la seguridad en entornos concurrentes.

---

## Conceptos fundamentales

### Inversión de Control (IoC)

La inversión de control es el principio por el cual la responsabilidad de construir y conectar objetos se transfiere desde el código de negocio hacia un componente centralizado: el contenedor. El desarrollador declara *qué* necesita; el contenedor decide *cómo* crearlo y *cuándo* entregarlo.

### Inyección de Dependencias (DI)

La inyección de dependencias es el mecanismo concreto que usa el contenedor para satisfacer las necesidades de cada clase. Cuando una clase declara parámetros tipados en su constructor o en un método, el contenedor inspecciona esos tipos mediante reflexión, localiza los bindings registrados y entrega las instancias correctas sin intervención del desarrollador.

El contenedor soporta inyección tanto en argumentos posicionales como en argumentos keyword-only, y es capaz de invocar funciones síncronas y `async def` de forma transparente.

### Contrato e implementación

El patrón recomendado en Orionis Framework consiste en registrar servicios vinculando un **contrato** (interfaz o clase abstracta) a una **implementación** (clase concreta). Esta separación ofrece tres ventajas directas:

- Permite sustituir implementaciones sin modificar el código que las consume.
- Facilita la creación de dobles de prueba (*mocks*) para tests unitarios.
- Aplica el principio de inversión de dependencias (DIP) de forma natural.

```python
# Contrato (app/contracts/email.py)
from abc import ABC, abstractmethod

class IEmailService(ABC):

    @abstractmethod
    def configure(self, subject: str, body: str, to: str) -> None: ...

    @abstractmethod
    def send(self) -> bool: ...


# Implementación (app/services/email.py)
from app.contracts.email import IEmailService

class EmailService(IEmailService):

    def configure(self, subject: str, body: str, to: str) -> None:
        self._subject = subject
        self._body    = body
        self._to      = to

    def send(self) -> bool:
        # lógica real de envío SMTP
        return True
```

> Si la implementación no satisface completamente el contrato (es decir, `concrete` no es subclase de `abstract`), el contenedor lanzará un `TypeError` durante el registro, antes de que la aplicación procese cualquier solicitud.

---

## Ciclos de vida

El contenedor ofrece tres ciclos de vida, definidos en el enumerado `Lifetime` (`orionis.container.enums.lifetimes`). Elegir el ciclo de vida correcto es una de las decisiones de diseño más importantes al registrar un servicio.

```python
from orionis.container.enums.lifetimes import Lifetime

# Lifetime.SINGLETON — una instancia para todo el proceso
# Lifetime.SCOPED    — una instancia por alcance activo
# Lifetime.TRANSIENT — una instancia nueva por cada resolución
```

### Singleton

Una única instancia se crea la primera vez que el servicio es resuelto y se almacena en una caché interna del contenedor. Se reutiliza durante toda la vida del proceso: entre solicitudes HTTP, comandos CLI y tareas programadas.

**Cuándo usar:** servicios de configuración, clientes de base de datos, servicios de logging, cachés en memoria, o cualquier recurso cuya inicialización sea costosa y cuyo estado pueda compartirse de forma segura.

### Scoped

Una nueva instancia se crea al inicio de cada **alcance activo** y se reutiliza dentro de ese alcance. En contexto HTTP el framework abre un alcance por solicitud; en CLI, por ejecución de comando. Al finalizar el alcance, las instancias scoped son descartadas automáticamente.

Si se intenta resolver un servicio scoped sin un alcance activo, el contenedor lanza `RuntimeError` con el mensaje `"No active scope for scoped service. Use 'beginScope()' to create a scope."`.

**Cuándo usar:** servicios que deben mantener estado acotado a una única solicitud, como el contexto de autenticación del usuario actual, una unidad de trabajo transaccional (Unit of Work) o un repositorio con estado por petición.

### Transient

Cada vez que se solicita el servicio, el contenedor crea una nueva instancia independiente. No se almacena ni comparte ninguna referencia entre resoluciones.

**Cuándo usar:** objetos ligeros y sin estado, helpers de cálculo o transformación, builders, o cualquier componente que no deba compartirse entre llamadas.

---

## Registro de servicios

El registro de servicios puede realizarse directamente sobre la instancia de la aplicación en `bootstrap/app.py`, o dentro de un `ServiceProvider` para mantener el código organizado por módulo (recomendado).

### Firma común

Los métodos `singleton`, `scoped` y `transient` comparten la misma firma:

```python
def método(
    abstract: type | None,
    concrete: type,
    *,
    alias: str | None = None,
    override: bool = False,
) -> bool
```

| Parámetro  | Tipo           | Descripción |
|------------|----------------|-------------|
| `abstract` | `type \| None` | Contrato que identifica el servicio. Si es `None`, se usa el propio `concrete` como clave de registro. |
| `concrete` | `type`         | Clase concreta que implementa el contrato. Debe ser una clase (`inspect.isclass`). |
| `alias`    | `str \| None`  | Nombre de cadena alternativo para resolver el servicio. Debe pasarse como argumento nombrado (*keyword-only*). |
| `override` | `bool`         | Si es `True`, permite sobreescribir un binding ya existente. Por defecto `False`. |

Todos los métodos retornan `True` si el binding se registró correctamente. Si se viola alguna restricción, lanzan la excepción correspondiente:

- `TypeError` — si `concrete` no es una clase, o no implementa `abstract`.
- `ValueError` — si el alias está vacío, o si el contrato/alias ya está registrado y `override` es `False`.

### `singleton`

Registra un servicio con ciclo de vida Singleton.

```python
app.singleton(IEmailService, EmailService)

# Con alias de cadena
app.singleton(IEmailService, EmailService, alias="mailer")
```

### `scoped`

Registra un servicio con ciclo de vida Scoped.

```python
app.scoped(IAuthContext, AuthContext)

# Con alias
app.scoped(IAuthContext, AuthContext, alias="auth")
```

### `transient`

Registra un servicio con ciclo de vida Transient.

```python
app.transient(IReportBuilder, PdfReportBuilder)

# Con alias
app.transient(IReportBuilder, PdfReportBuilder, alias="report.pdf")
```

### `instance`

Registra un objeto ya construido como singleton efectivo. A diferencia de `singleton`, el contenedor no construye la clase: simplemente almacena y devuelve la referencia proporcionada. Útil cuando necesitas pre-inicializar un servicio con parámetros concretos antes del arranque completo de la aplicación.

```python
mailer = EmailService()

app.instance(IEmailService, mailer)
app.instance(IEmailService, mailer, alias="mailer")
```

La firma de `instance` recibe un objeto en lugar de un tipo concreto:

```python
def instance(
    abstract: type | None,
    instance: object,
    *,
    alias: str | None = None,
    override: bool = False,
) -> bool
```

Si `abstract` es `None`, el contenedor utiliza `type(instance)` como clave de registro. Si el objeto pasado es una clase en lugar de una instancia, se lanza `TypeError` (`"instance() expects an initialized object, not a class."`).

#### Comportamiento dentro de un alcance

Cuando se llama a `instance` dentro de un alcance activo, la instancia se registra en el scope local y **no** globalmente. En este contexto:

- La instancia queda vinculada al ciclo de vida del alcance y se descarta al cerrarlo.
- El parámetro `alias` **no está permitido** y lanza `ValueError` (`"Alias registration is only allowed globally."`) si se proporciona.
- La validación de `override` se aplica contra el scope local, no contra los bindings globales.

---

## Verificación de bindings

### `bound`

Verifica si un contrato o alias está registrado en el contenedor o en el alcance activo actual.

```python
# Verificar por tipo contrato
is_registered: bool = app.bound(IEmailService)

# Verificar por alias de cadena
is_registered: bool = app.bound("mailer")
```

El método evalúa las siguientes fuentes en orden:

1. Si `key` es una cadena, resuelve el alias al tipo abstracto correspondiente. Si el alias no existe, retorna `False`.
2. Busca en el **alcance activo** (si existe).
3. Busca en los **bindings globales** y en la **caché de singletons**.

Retorna `True` si el servicio se encuentra en cualquiera de estas fuentes. Retorna `False` en cualquier otro caso.

---

## Resolución de servicios

El contenedor expone varios mecanismos de resolución adaptados a distintos escenarios. El prioritario es siempre la **inyección automática vía constructor**; los métodos explícitos están pensados para código de infraestructura o situaciones puntuales.

### Inyección vía constructor

El mecanismo principal y recomendado. Cuando el contenedor construye una clase, inspecciona su `__init__` mediante reflexión (`ReflectionConcrete`) e inyecta cada parámetro tipado que corresponda a un binding registrado. Los parámetros sin tipo, sin binding registrado y sin valor por defecto provocan un `TypeError`.

```python
class UserController(BaseController):

    def __init__(
        self,
        email: IEmailService,
        logger: ILoggerService,
    ) -> None:
        self._email  = email
        self._logger = logger

    async def register(self, user_email: str) -> bool:
        self._email.configure("Bienvenido", "Gracias por registrarte.", user_email)
        result = self._email.send()
        self._logger.info(f"Registro completado para {user_email}")
        return result
```

El contenedor resuelve `IEmailService` e `ILoggerService` automáticamente al construir `UserController`. Los tipos built-in (`str`, `int`, etc.) y los del módulo `typing` **no** se auto-resuelven: deben tener un valor por defecto o ser proporcionados explícitamente.

### Inyección vía parámetros de método

Las dependencias también pueden declararse en los parámetros de un método. El contenedor las inyecta cuando el método es invocado a través de `call` o `invoke`. Los parámetros que no correspondan a servicios registrados deben pasarse de forma explícita por el llamador.

```python
class ReportController(BaseController):

    async def generate(
        self,
        builder: IReportBuilder,   # resuelto por el contenedor
        period: str,               # pasado explícitamente
    ) -> bytes:
        return await builder.build(period)
```

### `make`

Resuelve y devuelve la instancia de un servicio a partir de un tipo contrato o de un alias de cadena. Es un método asíncrono (`async`) porque puede desencadenar la carga de proveedores diferidos.

```python
from orionis.support.facades.application import Application

# Por tipo contrato
email: IEmailService = await Application.make(IEmailService)

# Por alias de cadena
email: IEmailService = await Application.make("mailer")
```

También puede invocarse desde la instancia de la aplicación directamente:

```python
from bootstrap.app import app

email: IEmailService = await app.make(IEmailService)
```

**Orden de resolución interno:**

1. Si el servicio no está registrado, intenta cargar un proveedor diferido asociado.
2. Si tras el paso anterior sigue sin estar registrado:
   - Si `key` es un **tipo de clase**, lo construye automáticamente con inyección de dependencias (equivalente a `build`).
   - Si `key` es un **alias de cadena**, lanza `ValueError` (`"Service '{key}' is not registered."`).
3. Si el servicio existe en el **alcance activo**, retorna la instancia del scope.
4. Si el servicio existe en la **caché de singletons**, retorna la instancia cacheada.
5. En cualquier otro caso, resuelve el binding según su ciclo de vida.

### `build`

Construye una instancia de cualquier clase con inyección automática de dependencias, sin necesidad de que la clase esté registrada en el contenedor. Antes de instanciar, intenta cargar proveedores diferidos asociados al tipo.

```python
controller: UserController = await app.build(UserController)
```

`build` siempre crea una nueva instancia. Si la clase está registrada como singleton o scoped, ese binding es ignorado: `build` construye directamente la clase concreta. Si el argumento no es una clase, lanza `TypeError` (`"build() expects a class type to instantiate."`).

### `invoke`

Ejecuta una función (no un método de instancia ni una clase) inyectando sus parámetros tipados de forma automática. Los parámetros sin binding deben proporcionarse como argumentos posicionales o nombrados. Soporta funciones tanto síncronas como `async def`.

```python
async def notify(logger: ILoggerService, message: str) -> None:
    logger.info(message)

await app.invoke(notify, message="Proceso completado.")
```

Si se pasa una clase o un tipo como argumento, el método lanza `TypeError` (`"invoke() expects a non-class callable as the first argument."`).

### `call`

Invoca un método de una instancia existente con inyección automática de dependencias en sus parámetros. El primer argumento es la instancia; el segundo, el nombre del método como cadena.

```python
controller = UserController.__new__(UserController)

await app.call(controller, "register", user_email="user@domain.com")
```

| Excepción         | Condición |
|-------------------|-----------|
| `AttributeError`  | El método no existe en la instancia. |
| `TypeError`        | El atributo existe pero no es llamable. |

---

## Alcances (Scopes)

Los alcances son el mecanismo que permite a los servicios Scoped mantener estado dentro de un contexto delimitado —típicamente una solicitud HTTP o una ejecución de comando CLI— sin compartirlo con otros contextos concurrentes.

### Arquitectura interna

El contenedor gestiona los alcances mediante dos clases:

- **`ScopeManager`** (`orionis.container.context.manager`): gestor de contexto asíncrono que mantiene un diccionario de instancias por alcance. Soporta almacenamiento de coroutines y `asyncio.Task`, resolviéndolos automáticamente mediante `await` en la primera lectura.
- **`ScopedContext`** (`orionis.container.context.scope`): almacena el alcance activo usando `contextvars.ContextVar`, lo que garantiza el aislamiento entre solicitudes concurrentes sin necesidad de locks explícitos.

### Gestión automática

En condiciones normales, el framework gestiona los alcances de forma transparente:

- **HTTP:** un alcance por solicitud entrante, abierto antes del despacho y cerrado tras la respuesta.
- **CLI:** un alcance por ejecución de comando.

### Gestión manual con `beginScope`

En escenarios avanzados —tareas en segundo plano, workers personalizados, tests de integración— puedes gestionar alcances manualmente:

```python
async with app.beginScope():
    # Dentro de este bloque existe un alcance activo.
    # Los servicios scoped obtienen una instancia compartida por el alcance.
    auth: IAuthContext = await app.make(IAuthContext)

    # Al salir del bloque, el alcance se cierra y
    # las instancias scoped son descartadas automáticamente.
```

`beginScope()` retorna un `ScopeManager` utilizable como gestor de contexto asíncrono (`async with`). Al salir del bloque, el scope invoca `clear()` sobre sus instancias y restablece el `ContextVar` al estado anterior mediante un token.

### Inspección del alcance activo

```python
current_scope = app.getCurrentScope()
# Retorna el ScopeManager activo, o None si no hay ninguno abierto.
```

---

## Detección de dependencias circulares

El contenedor detecta dependencias circulares en tiempo de resolución. Mantiene un conjunto interno (`__resolution_cache`) con las claves de los tipos que están siendo resueltos en la cadena actual. Si durante la construcción de un servicio se detecta que ese mismo tipo ya está en resolución, el contenedor lanza `CircularDependencyException`:

```
orionis.container.exceptions.CircularDependencyException:
Circular dependency detected while resolving argument 'app.services.foo.FooService'.
```

La detección utiliza la ruta completa del módulo (`module.ClassName`) como clave de tracking, y el servicio se elimina del conjunto al finalizar su resolución (en un bloque `finally`), independientemente de si la construcción fue exitosa o no.

Las dependencias circulares son un indicador inequívoco de un problema de diseño. Las soluciones habituales son:

- Dividir la responsabilidad entre servicios de menor acoplamiento.
- Introducir un nivel de indirección mediante un servicio mediador o un evento.
- Convertir una de las dependencias en un parámetro de método en lugar de una dependencia de constructor.

---

## Proveedores de servicios

Un `ServiceProvider` es la unidad de organización recomendada para agrupar registros relacionados. La clase base `ServiceProvider` expone `self.app` (la instancia del contenedor) y obliga a implementar dos métodos diferenciados por su fase de ejecución:

```python
from orionis.foundation.providers.service_provider import ServiceProvider

class MailServiceProvider(ServiceProvider):

    def register(self) -> None:
        self.app.singleton(IEmailService, EmailService)
        self.app.singleton(IMailQueue, RedisMailQueue)

    async def boot(self) -> None:
        # Lógica de inicialización asíncrona que requiere
        # que todos los servicios estén ya registrados.
        mailer: IEmailService = await self.app.make(IEmailService)
        await mailer.verify_connection()
```

| Método     | Sincronía   | Propósito |
|------------|-------------|-----------|
| <span style="white-space: nowrap;">`register`</span> | Síncrono    | Registrar bindings en el contenedor. En esta fase no deben resolverse otros servicios porque el orden de procesamiento de proveedores no está garantizado. |
| <span style="white-space: nowrap;">`boot`</span>     | Asíncrono   | Ejecutar lógica de inicialización. En esta fase todos los proveedores han completado `register` y los servicios están disponibles para su resolución. |

### Proveedores diferidos

Los proveedores diferidos (`DeferrableProvider`) retrasan su registro hasta que uno de sus servicios es solicitado por primera vez. El contenedor almacena metadatos de los proveedores diferidos (módulo y clase) en un diccionario interno (`_deferred_providers`), y cuando `make` o `build` requieren un servicio no registrado, el contenedor:

1. Busca si existe un proveedor diferido asociado al tipo solicitado.
2. Importa dinámicamente el módulo del proveedor mediante `importlib.import_module`.
3. Construye la instancia del proveedor con `build`.
4. Ejecuta `register()` y `boot()` del proveedor.
5. Marca el proveedor como resuelto en una caché interna para evitar procesamiento duplicado.

Este mecanismo reduce el tiempo de arranque de la aplicación en entornos con muchos servicios que no se utilizan en todos los contextos.

Consulta la documentación de [Proveedores de Servicios](/es/architecture/service-providers) para conocer el ciclo de vida completo y la implementación de `DeferrableProvider`.

---

## Buenas prácticas

**Nombra los contratos con el prefijo `I`:** `IEmailService`, `IUserRepository`. Mejora la legibilidad, distingue contratos de implementaciones y facilita los análisis estáticos de tipo.

**Declara dependencias por contrato, no por implementación:** los constructores y métodos deben recibir interfaces, nunca clases concretas. Esto es lo que hace el diseño verdaderamente desacoplado y sustituible.

**Registra en proveedores de servicios:** agrupa los bindings relacionados en un `ServiceProvider` dedicado en lugar de concentrarlos en `bootstrap/app.py`. Un proveedor por módulo o dominio funcional es una buena norma de organización.

**Elige el ciclo de vida correcto:** el mal uso de los ciclos de vida es una fuente habitual de bugs difíciles de rastrear. Como regla general: `singleton` para recursos costosos o estado global; `scoped` para estado por solicitud; `transient` para objetos sin estado.

**No resuelvas servicios en `register`:** durante la fase de registro el orden de procesamiento de los proveedores no está garantizado. Intentar resolver un servicio en `register` puede causar una excepción.

**Reserva `make` para casos puntuales:** la inyección automática vía constructor es siempre preferible a la resolución manual. Usa `make` solo cuando sea estrictamente necesario: factories dinámicas, código de infraestructura, o resolución condicional en tiempo de ejecución.

**Evita las dependencias circulares desde el diseño:** si dos servicios se necesitan mutuamente, es una señal de que la responsabilidad debe redistribuirse. El contenedor detectará y lanzará la excepción correspondiente, pero la solución correcta es rediseñar, no rodear el error.