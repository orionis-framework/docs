---
title: Contenedor de servicios
---

# Contenedor de servicios

El **Contenedor de Servicios** de `Orionis Framework` es una solución robusta para la gestión de dependencias en tus aplicaciones. Su arquitectura flexible permite registrar y resolver servicios de forma eficiente, promoviendo la colaboración entre componentes sin acoplamientos innecesarios.

## Ventajas de utilizar el contenedor de servicios

- **Inyección de dependencias automática:** El contenedor crea y gestiona instancias por ti, eliminando la necesidad de manejar dependencias manualmente.
- **Diseño modular y escalable:** Facilita el desarrollo de aplicaciones limpias y mantenibles, donde cada componente es independiente y reutilizable.
- **Gestión avanzada del ciclo de vida:** Permite registrar servicios como *singleton*, *scope* o *transitorio*, adaptando el ciclo de vida según los requisitos de tu aplicación.
- **Resolución inteligente de dependencias:** Analiza y resuelve automáticamente las dependencias necesarias para cada servicio.

El contenedor de servicios de `Orionis Framework` está inspirado en soluciones de frameworks reconocidos como Laravel(PHP), Symfony(PHP), Spring (Java) y .NET Core (C#), ofreciendo una experiencia optimizada y adaptada para el ecosistema de Orionis.

## ¿Qué es un contenedor de servicios?

Un **contenedor de servicios** es un componente central en la arquitectura de software que gestiona la creación, configuración y ciclo de vida de los objetos y sus dependencias. Actúa como un registro centralizado donde se pueden definir servicios (clases o componentes) y sus relaciones, permitiendo que las dependencias se inyecten automáticamente cuando se solicitan.

### Características principales

- **Inversión de control (IoC):** El contenedor toma el control de la creación de objetos en lugar de que los objetos se creen a sí mismos.
- **Inyección de dependencias (DI):** Los objetos reciben sus dependencias desde el exterior en lugar de crearlas internamente.
- **Gestión automática del ciclo de vida:** El contenedor decide cuándo crear, mantener y destruir las instancias de los servicios.
- **Desacoplamiento:** Reduce la dependencia entre clases, facilitando el mantenimiento y las pruebas.

## ¿Qué ciclos de vida soporta el contenedor de servicios?

El contenedor de servicios de `Orionis Framework` soporta tres ciclos de vida para los servicios registrados, adaptándose a diferentes necesidades de la aplicación:

### Singleton
Una única instancia del servicio se crea y se comparte en toda la aplicación. Esta instancia permanece en memoria durante toda la ejecución de la aplicación.

**Cuándo usarlo:**
- Servicios de configuración
- Servicios de logging
- Servicios sin estado

### Scoped
Una nueva instancia del servicio se crea para cada alcance o contexto específico. Por defecto, esto significa una instancia por cada solicitud HTTP en aplicaciones web.

**Cuándo usarlo:**
- Servicios que mantienen estado durante una solicitud
- Servicios de autenticación
- Servicios de contexto de usuario

### Transient
Cada vez que se solicita el servicio, se crea una nueva instancia. Es el ciclo de vida más ligero en términos de gestión de memoria.

**Cuándo usarlo:**
- Servicios ligeros y sin estado
- Servicios de cálculo o procesamiento
- Servicios que no requieren persistencia

## ¿Qué se requiere para registrar un servicio?

Para registrar un servicio en el contenedor de servicios de `Orionis Framework`, se requieren dos componentes obligatorios:

- **Contrato (Interfaz)**: Especifica la funcionalidad que el servicio debe implementar, pero no define cómo se implementa. Define el "qué" debe hacer el servicio.
- **Implementación (Clase)**: Proporciona la lógica concreta que cumple con el contrato definido por la interfaz. Define el "cómo" se hace el trabajo.

### Beneficios de esta separación:
- **Flexibilidad:** Permite cambiar la implementación sin afectar el código que usa el servicio
- **Testabilidad:** Facilita la creación de mocks y stubs para pruebas unitarias
- **Mantenibilidad:** El código se vuelve más fácil de mantener y extender

A continuación se muestra un ejemplo básico y claro de cómo definir y registrar un servicio en el contenedor de servicios de `Orionis Framework`.

### Definición del servicio

**Contrato (Interfaz)**
```python
from abc import ABC, abstractmethod

class IEmailService(ABC):

    @abstractmethod
    def configure(self, subject: str, body: str, to: str) -> None:
        """Configura los parámetros del correo electrónico."""
        pass

    @abstractmethod
    def send(self) -> bool:
        """Envía el correo electrónico y retorna True si fue exitoso."""
        pass
```

**Implementación (Clase)**
```python
from module import IEmailService

class EmailService(IEmailService):

    def configure(self, subject: str, body: str, to: str) -> None:
        """Configura los parámetros del correo electrónico."""
        self._subject = subject
        self._body = body
        self._to = to

    def send(self) -> bool:
        """Envía el correo electrónico y retorna True si fue exitoso."""
        # Aquí iría la lógica real de envío usando SMTP
        return True
```

**Importante**: Para que el registro del servicio sea exitoso, la clase de implementación debe cumplir con el contrato definido por la interfaz. Esto asegura que todas las funcionalidades esperadas estén presentes y correctamente implementadas, en caso de que no se cumpla con todo el contrato, el contenedor de servicios lanzará una excepción indicando el incumplimiento.

## ¿Cómo registrar un servicio en el contenedor?

### Singleton

Para registrar un servicio con ciclo de vida *singleton*, se utiliza el método `singleton` disponible en la instancia de la aplicación. Con este ciclo de vida, una única instancia del servicio se creará y será reutilizada en toda la aplicación.

#### Firma del método

La firma del método `singleton` es la siguiente:
```python
(method) def singleton(
    abstract: (...) -> Any,
    concrete: (...) -> Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parámetros

- **`abstract`**: La interfaz o clase abstracta que define el contrato del servicio.
- **`concrete`**: La clase concreta que implementa el servicio.
- **`alias`** (opcional): Un nombre alternativo para registrar el servicio. Debe ser una cadena de texto.
- **`enforce_decoupling`** (opcional): Si se establece en `True`, el contenedor verificará que la clase concreta cumpla con el contrato definido por la interfaz, pero sin necesidad de implementarla directamente en la clase promoviendo un mayor desacoplamiento. **Raramente se utiliza en la práctica** sin embargo `Orionis` es tan flexible que permite hacerlo.

#### Ejemplo de uso

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

# Crear la instancia de la aplicación
app: IApplication = Application()

# Registrar el servicio como singleton
app.singleton(IEmailService, EmailService)

# Iniciar la aplicación
app.create()
```

#### Registro con alias

Si deseas utilizar un alias para registrar el servicio:

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar con alias (usar parámetro nombrado)
app.singleton(IEmailService, EmailService, alias="EmailServiceProvider")

app.create()
```

> **Importante:** El parámetro `alias` debe pasarse como argumento nombrado. Pasarlo como tercer parámetro posicional generará un error de tipo.

### Scoped

Para registrar un servicio con ciclo de vida *scoped*, se utiliza el método `scoped` disponible en la instancia de la aplicación. Con este ciclo de vida, se creará una nueva instancia del servicio para cada alcance o contexto específico (por defecto, cada solicitud HTTP ó de Consola).

#### Firma del método

La firma del método `scoped` es la siguiente:
```python
(method) def scoped(
    abstract: (...) -> Any,
    concrete: (...) -> Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parámetros

Los parámetros son idénticos a los del método `singleton`:

- **`abstract`**: La interfaz o clase abstracta que define el contrato del servicio.
- **`concrete`**: La clase concreta que implementa el servicio.
- **`alias`** (opcional): Un nombre alternativo para registrar el servicio.
- **`enforce_decoupling`** (opcional): Si se establece en `True`, el contenedor verificará que la clase concreta cumpla con el contrato definido por la interfaz, pero sin necesidad de implementarla directamente en la clase promoviendo un mayor desacoplamiento. **Raramente se utiliza en la práctica** sin embargo `Orionis` es tan flexible que permite hacerlo.

#### Ejemplo de uso

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar el servicio como scoped
app.scoped(IEmailService, EmailService)

app.create()
```

#### Registro con alias

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar con alias
app.scoped(IEmailService, EmailService, alias="EmailServiceProvider")

app.create()
```

### Transient

Para registrar un servicio con ciclo de vida *transient*, se utiliza el método `transient` disponible en la instancia de la aplicación. Con este ciclo de vida, se creará una nueva instancia del servicio cada vez que se solicite.

#### Firma del método

La firma del método `transient` es la siguiente:

```python
(method) def transient(
    abstract: (...) -> Any,
    concrete: (...) -> Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parámetros

Los parámetros son idénticos a los métodos anteriores:

- **`abstract`**: La interfaz o clase abstracta que define el contrato del servicio.
- **`concrete`**: La clase concreta que implementa el servicio.
- **`alias`** (opcional): Un nombre alternativo para registrar el servicio.
- **`enforce_decoupling`** (opcional): Si se establece en `True`, el contenedor verificará que la clase concreta cumpla con el contrato definido por la interfaz, pero sin necesidad de implementarla directamente en la clase promoviendo un mayor desacoplamiento. **Raramente se utiliza en la práctica** sin embargo `Orionis` es tan flexible que permite hacerlo.

#### Ejemplo de uso

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar el servicio como transient
app.transient(IEmailService, EmailService)

app.create()
```

#### Registro con alias

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar con alias
app.transient(IEmailService, EmailService, alias="EmailServiceProvider")

app.create()
```

## Otras características del contenedor de servicios

Aunque los métodos principales para registrar servicios son `singleton`, `scoped` y `transient`, el contenedor de servicios de `Orionis Framework` ofrece funcionalidades adicionales para mejorar la gestión de dependencias:

### Instancias

Puedes registrar una instancia específica de un servicio utilizando el método `instance`. Esto es útil cuando ya tienes una instancia creada y deseas que el contenedor la utilice.

#### Firma del método

La firma del método `transient` es la siguiente:

```python
(method) def instance(
    abstract: (...) -> Any,
    instance: Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parámetros

Los parámetros son idénticos a los métodos anteriores:

- **`abstract`**: La interfaz o clase abstracta que define el contrato del servicio.
- **`instance`**: La instancia específica del servicio que deseas registrar ya inicializada.
- **`alias`** (opcional): Un nombre alternativo para registrar el servicio.
- **`enforce_decoupling`** (opcional): Si se establece en `True`, el contenedor verificará que la clase concreta cumpla con el contrato definido por la interfaz, pero sin necesidad de implementarla directamente en la clase promoviendo un mayor desacoplamiento. **Raramente se utiliza en la práctica** sin embargo `Orionis` es tan flexible que permite hacerlo.

#### ¿Esto seria un Singleton?

Registrar una instancia específica con el método `instance` puede considerarse similar a un singleton en el sentido de que la misma instancia se reutiliza cada vez que se solicita el servicio. Sin embargo, la diferencia clave es que con `instance`, tú proporcionas la instancia ya creada, mientras que con `singleton`, el contenedor es responsable de crear y gestionar la instancia.

#### Ejemplo de uso

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar una instancia específica
app.instance(IEmailService, EmailService())

app.create()
```

#### Registro con alias

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar una instancia con alias
app.instance(IEmailService, EmailService(), alias="EmailServiceProvider")

app.create()
```

### Instancia de alcance (*Scoped Instance*)

Puedes registrar una instancia específica de un servicio con ciclo de vida *scoped* utilizando el método `scopedInstance`. Esto es útil cuando deseas que una instancia particular se utilice dentro de un alcance específico.
Como puedes notar esto es diferente a `instance`, ya que `instance` es una instancia global reutilizable en toda la aplicación, mientras que `scopedInstance` es una instancia que se reutiliza solo dentro de un alcance específico.

```python
(method) def scopedInstance(
    abstract: (...) -> Any,
    instance: Any,
    *,
    alias: str = None,
    enforce_decoupling: bool = False
) -> bool | None
```

#### Parámetros

Los parámetros son idénticos a los métodos anteriores:

- **`abstract`**: La interfaz o clase abstracta que define el contrato del servicio.
- **`instance`**: La instancia específica del servicio que deseas registrar ya inicializada.
- **`alias`** (opcional): Un nombre alternativo para registrar el servicio.
- **`enforce_decoupling`** (opcional): Si se establece en `True`, el contenedor verificará que la clase concreta cumpla con el contrato definido por la interfaz, pero sin necesidad de implementarla directamente en la clase promoviendo un mayor desacoplamiento. **Raramente se utiliza en la práctica** sin embargo `Orionis` es tan flexible que permite hacerlo.

#### Ejemplo de uso

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar una instancia específica como scoped
app.scopedInstance(IEmailService, EmailService())

app.create()
```

#### Registro con alias

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication

app: IApplication = Application()

# Registrar una instancia scoped con alias
app.scopedInstance(IEmailService, EmailService(), alias="EmailServiceProvider")

# Iniciar la aplicación
app.create()
```

### Callable

¿Se puede registrar un servicio usando una función?
Sí, es posible registrar un servicio mediante una función o cualquier objeto *callable*. Esto resulta útil cuando necesitas personalizar la creación del servicio, por ejemplo, aplicando configuraciones dinámicas o lógica adicional antes de instanciarlo.

> **Recomendación:** Aunque los *callables* ofrecen flexibilidad, se recomienda registrar servicios usando clases para mantener una arquitectura clara y coherente. El uso de funciones como servicios debe reservarse para casos muy específicos.

**Limitaciones importantes:**
- El contenedor inyectará automáticamente las dependencias requeridas por el *callable*.
- No se puede utilizar con ciclos de vida *singleton* o *scoped* debido a la naturaleza dinámica de los *callables*.

Utiliza esta opción solo cuando realmente necesites controlar manualmente la creación del servicio.

#### Firma del método
```python
(method) def callable(
    fn: (...) -> Any,
    *,
    alias: str
) -> bool | None
```

#### Parámetros
- **`fn`**: La función o *callable* que crea y retorna la instancia del servicio.
- **`alias`**: Un nombre alternativo obligatorio para registrar el servicio.

#### Ejemplo de uso mejorado

Supongamos que tienes una función que reporta errores enviando un correo. Puedes registrar esta función como servicio *callable* en el contenedor:

```python
# app/helpers.py
def report_error(email_service: IEmailService, logger: ILoggerService, error_message: str) -> bool:
    email_service.configure(
        subject='Error en la aplicación',
        body=error_message,
        to='raulmauriciounate@gmail.com'
    )
    return email_service.send()
```

Luego, registra la función en el contenedor usando el método `callable`:

```python
# bootstrap/app.py
from orionis.foundation.application import Application, IApplication
from app.helpers import report_error

app: IApplication = Application()

# Registrar la función como servicio callable con alias
app.callable(report_error, alias="report_error")

# Iniciar la aplicación
app.create()
```

De esta forma, puedes inyectar y reutilizar la función `report_error` en cualquier parte de tu aplicación, aprovechando la resolución automática de dependencias del contenedor.

## Mejores prácticas

Para aprovechar al máximo el contenedor de servicios de `Orionis Framework`, considera las siguientes mejores prácticas al definir y registrar tus servicios:

### 1. Nomenclatura de interfaces
Utiliza el prefijo "I" para las interfaces, seguido del nombre del servicio:
```python
class IEmailService(ABC): pass
class IUserService(ABC): pass
class ILoggerService(ABC): pass
```

### 2. Uso de `Service Providers`
Registra servicios relacionados en proveedores de servicios dedicados para mantener el código organizado y modular.
Revisa la sección de [Service Providers](../service-providers) para más detalles.

### 3. Elección del ciclo de vida correcto
- **Singleton**: Para servicios costosos de crear o que mantienen estado global
- **Scoped**: Para servicios que necesitan mantener estado durante una operación
- **Transient**: Para servicios ligeros y sin estado

### 4. Evita dependencias circulares
Asegúrate de que tus servicios no dependan entre sí de forma circular, ya que esto puede causar problemas en la resolución.

## Como resolver un servicio registrado

Una vez que un servicio ha sido registrado en el contenedor de servicios, puedes resolverlo e inyectarlo en cualquier parte de tu aplicación utilizando la funcionalidad de inyección de dependencias automática del contenedor.

### En el constructor de una clase

**La forma más común** de resolver e inyectar un servicio registrado es a través del constructor de una clase. El contenedor de servicios analizará automáticamente las dependencias requeridas y proporcionará las instancias correspondientes cuando se cree una instancia de la clase.

Esto lo hace muy sencillo y limpio el uso de servicios en tus controladores, servicios u otros componentes de la aplicación.

```python
# app/http/controllers/user_controller.py
class UserController(Controller):

    def __init__(
        self,
        email_service: IEmailService,
        logger: ILoggerService
    ) -> None:
        """
        email_service (IEmailService): Servicio para enviar correos electrónicos.
        logger (ILoggerService): Servicio para registrar eventos y errores.
        """
        self._email_service = email_service
        self._logger = logger

    def sendWelcomeEmail(
        self,
        user_email: str
    ) -> bool:
        """
        Envía un correo de bienvenida al usuario especificado.
        Configura el correo con asunto y cuerpo predeterminados, y lo envía al email proporcionado.
        Retorna True si el envío fue exitoso, False en caso contrario
        """

        # Configurar el servicio de correo ya inyectado
        self._email_service.configure(
            subject='Welcome to Orionis Framework',
            body='Thank you for registering!',
            to=user_email
        )

        # Enviar el correo y registrar el resultado
        result = self._email_service.send()

        # Registrar el resultado en el servicio de logging inyectado
        if result:
            self._logger.log(f'Welcome email sent to {user_email}')
        else:
            self._logger.log(f'Failed to send welcome email to {user_email}')

        # Retornar el resultado del envío
        return result
```

#### ¿Que sucede aca?

Bueno, el contenedor de dependencias de `Orionis Framework` se encarga de resolver automáticamente las dependencias `IEmailService` e `ILoggerService` cuando se crea una instancia de `UserController`. No es necesario instanciar manualmente estos servicios; el contenedor los inyecta automáticamente, facilitando la gestión de dependencias y promoviendo un diseño limpio y desacoplado.

Simplemente crea una instancia de `UserController` y el contenedor hará el resto.

### En Metodos De Clases

Puedes inyectar dependencias directamente en los métodos de tus clases utilizando el contenedor de servicios de `Orionis Framework`. Esto es especialmente útil para funciones o métodos que requieren servicios específicos sin necesidad de almacenarlos como atributos de la clase.

Aquí tienes un ejemplo de cómo hacerlo:

```python
# app/http/controllers/user_controller.py
class UserController(Controller):

    def sendWelcomeEmail(
        self,
        email_service: IEmailService,
        user_email: str
    ) -> bool:
        """
        Envía un correo de bienvenida al usuario especificado.
        Configura el correo con asunto y cuerpo predeterminados, y lo envía al email proporcionado.
        Retorna True si el envío fue exitoso, False en caso contrario
        """

        # Configurar el servicio de correo ya inyectado
        email_service.configure(
            subject='Welcome to Orionis Framework',
            body='Thank you for registering!',
            to=user_email
        )

        # Enviar el correo y retornar el resultado
        return email_service.send()
```

En este ejemplo, el método `sendWelcomeEmail` recibe una instancia de `IEmailService` como parámetro. El contenedor de servicios se encarga de inyectar automáticamente la implementación correcta cuando se llama al método, permitiéndote utilizar el servicio sin necesidad de almacenarlo como un atributo de la clase.

Solo requieres pasar los demás parámetros necesarios al método, y el contenedor gestionará las dependencias por ti.

### Resolver manualmente un servicio

Si necesitas resolver un servicio registrado manualmente, puedes hacerlo utilizando el método `make` disponible en la instancia o en la fachada `orionis.support.facades.application.Application` de la instancia de la aplicación. Este método te permite obtener una instancia del servicio registrado en el contenedor.

Para poder resolverlo puedes usar el contrato (interfaz) o el alias con el que fue registrado.

#### Resolviendo Con La Fachada Application

Ejemplo de uso:

```python
from orionis.support.facades.application import Application
from module import IEmailService

# Resolver el servicio usando el contrato (interfaz)
email_service: IEmailService = Application.make(IEmailService)

# Resolver el servicio usando el alias
email_service_alias: IEmailService = Application.make("EmailServiceProvider")
```

#### Resolviendo Con La Instancia De La Aplicación

Ejemplo de uso:

```python
from bootstrap.app import app
from module import IEmailService

# Resolver el servicio usando el contrato (interfaz)
email_service: IEmailService = app.make(IEmailService)

# Resolver el servicio usando el alias
email_service_alias: IEmailService = app.make("EmailServiceProvider")
```


Aca estamos tipando la variable `email_service` como `IEmailService` para indicar que esperamos una instancia que implemente esa interfaz. El contenedor de servicios se encargará de proporcionarnos la implementación correcta registrada previamente.

### Resolver un servicio *callable*

Puedes resolver un servicio registrado como *callable* utilizando el método `make` de la misma manera que con otros servicios. El contenedor de servicios ejecutará el *callable* y proporcionará las dependencias necesarias automáticamente.

#### Resolviendo Con La Fachada Application

Ejemplo de uso:

```python
from orionis.support.facades.application import Application

# Resolver siempre usando el alias
email_service_alias = Application.make(
    "report_error",
    error_message="Error al conectar a la base de datos"
)
```

#### Resolviendo Con La Instancia De La Aplicación

Ejemplo de uso:

```python
from bootstrap.app import app

# Resolver siempre usando el alias
email_service_alias = app.make(
    "report_error",
    error_message="Error al conectar a la base de datos"
)
```

En este ejemplo, estamos resolviendo el *callable* registrado con el alias `"report_error"` y pasando un mensaje de error como argumento adicional. El contenedor inyectará automáticamente las dependencias requeridas por la función `report_error` y ejecutará la función con los parámetros proporcionados.

<aside aria-label="Importante" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm0-8c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/>
</svg>
¡Alerta!
</p>
<div class="starlight-aside__content">
<p>Al resolver directamente un <strong>callable</strong>, asegúrate de pasar los parámetros adicionales que no son dependencias del contenedor <strong>usando su nombre</strong> en el método <code>make</code>, tal como se muestra en el ejemplo. No los pases como argumentos posicionales, ya que esto puede provocar errores inesperados.</p>
</div>
</aside>

## Validar el registro de un servicio

Si requeres verificar si un servicio ha sido registrado en el contenedor de servicios, puedes utilizar el método `bound` disponible en la instancia de la aplicación. Este método te permite comprobar si un servicio específico está registrado, ya sea por su contrato (interfaz) o por su alias.

#### Firma del método
```python
(method) def bound(
    abstract_or_alias: Any
) -> bool
```

#### Parámetros
- **`abstract_or_alias`**: La interfaz, clase abstracta o alias del servicio que deseas verificar.

#### Ejemplo de uso

```python
# Verificar si el servicio está registrado usando el contrato (interfaz)
is_registered = app.bound(IEmailService)

# Verificar si el servicio está registrado usando el alias
is_registered_alias = app.bound("EmailServiceProvider")
```

## Obtener un servicio registrado

Si necesitas obtener información detallada sobre un servicio registrado en el contenedor, puedes utilizar el método `getBinding` disponible en la instancia de la aplicación. Este método retorna una instancia de `orionis.container.entities.binding.Binding` que te permite acceder a la definición completa del servicio, incluyendo su ciclo de vida, implementación y otras configuraciones.

```python
# Obtener el servicio usando el contrato (interfaz)
service = app.getBinding(IEmailService)

# Obtener el servicio usando el alias
service = app.getBinding("EmailServiceProvider")

# Acceder a los detalles del servicio registrado
print(service)

# Ejemplo de salida esperada
# Binding(
#     contract=...,
#     concrete=...,
#     instance=...,
#     function=...,
#     lifetime=...,
#     enforce_decoupling=...,
#     alias=...
# )
```

## Eliminar un servicio registrado

Si necesitas eliminar un servicio registrado en el contenedor de servicios, puedes utilizar el método `drop` disponible en la instancia de la aplicación. Este método te permite eliminar un servicio específico, ya sea por su contrato (interfaz) o por su alias.

<aside aria-label="Importante" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm0-8c-.83 0-1.5-.67-1.5-1.5S11.17 6 12 6s1.5.67 1.5 1.5S12.83 9 12 9z"/>
</svg>
¡Atención!
</p>
<div class="starlight-aside__content">
<p>Utiliza este método con precaución. Eliminar servicios nativos del framework o servicios que son dependencias de otros componentes puede provocar errores graves en la aplicación. Asegúrate de comprender completamente las implicaciones antes de eliminar cualquier servicio registrado.</p>
</div>
</aside>

#### Firma del método
```python
(method) def drop(
    self,
    abstract: Callable[..., Any] = None,
    alias: str = None
) -> bool
```

#### Parámetros
- **`abstract`** (opcional): La interfaz o clase abstracta del servicio que deseas eliminar.
- **`alias`** (opcional): El alias del servicio que deseas eliminar.

#### Ejemplo de uso

```python
# Eliminar el servicio usando el contrato (interfaz)
app.drop(abstract=IEmailService)

# Eliminar el servicio usando el alias
app.drop(alias="EmailServiceProvider")
```

## Crear Alcance Manualmente

En situaciones avanzadas, es posible que necesites crear un nuevo alcance (*scope*) manualmente. Esto es útil cuando deseas gestionar el ciclo de vida de los servicios de manera explícita, especialmente en contextos donde no se maneja automáticamente, como en tareas en segundo plano o procesos personalizados.

Aunque `Orionis Framework` maneja automáticamente los alcances en solicitudes HTTP y de consola, puedes crear un nuevo alcance manualmente utilizando el método `createContext` disponible en la instancia de la aplicación.

#### Ejemplo de uso

```python
# Crear un nuevo alcance manualmente
with app.createContext():

    # Dentro de este bloque, se crea un nuevo alcance
    email_service: IEmailService = app.make(IEmailService)
```

Todos los servicios registrados con ciclo de vida *scoped* dentro del bloque `with` compartirán la misma instancia durante la duración del contexto. Al salir del bloque, el alcance se cerrará y las instancias *scoped* serán liberadas.

Asegúrate de entender bien el manejo de alcances para evitar problemas de memoria o referencias a instancias que ya no son válidas fuera del contexto creado.

## Resolver dependencias de un Binding

Si necesitas resolver las dependencias de un servicio registrado en el contenedor, puedes utilizar el método `resolveDependencies` disponible en la instancia de la aplicación. De esta forma el contenedor analizará y resolverá automáticamente todas las dependencias necesarias para el servicio especificado.

#### Firma del método
```python
(method) def resolve(
        self,
        binding: Binding,
        *args,
        **kwargs
) -> Any
```

#### Parámetros
- **`binding`**: La instancia de `Binding` que representa el servicio registrado en el contenedor.
- **`*args`**: Argumentos posicionales adicionales que pueden ser necesarios para resolver las dependencias.
- **`**kwargs`**: Argumentos nombrados adicionales que pueden ser necesarios para resolver las dependencias.

#### Ejemplo de uso

```python
# Obtener el binding del servicio
binding = app.getBinding(IEmailService)

# Resolver las dependencias del servicio
email_service: IEmailService = app.resolve(binding)
```

## Llamar un método con inyección de dependencias

Si necesitas llamar a un método específico de una clase y deseas que el contenedor de servicios inyecte automáticamente las dependencias requeridas por ese método, puedes utilizar el método `call` disponible en la instancia de la aplicación. Esto es especialmente útil cuando deseas ejecutar un método sin necesidad de instanciar manualmente la clase o gestionar sus dependencias.

#### Firma del método
```python
(method) def call(
    self,
    instance: Any,
    method_name: str,
    *args,
    **kwargs
) -> Any
```

#### Parámetros
- **`instance`**: La instancia de la clase que contiene el método que deseas llamar.
- **`method_name`**: El nombre del método que deseas ejecutar.
- **`*args`**: Argumentos posicionales adicionales que pueden ser necesarios para el método.
- **`**kwargs`**: Argumentos nombrados adicionales que pueden ser necesarios para el método.

#### Ejemplo de uso

```python
# Crear una instancia de la clase
user_controller = UserController()

# Llamar al método con inyección de dependencias
result = app.call(user_controller, "sendWelcomeEmail", user_email="webmaster@domain.co")
```

#### Variante Asíncrona

Si el método que deseas llamar es asíncrono, puedes utilizar el método `callAsync` disponible en la instancia de la aplicación. Esto te permite ejecutar métodos asíncronos con inyección automática de dependencias. Su firma y uso son similares al método `call`, pero está diseñado para trabajar con funciones asíncronas, de igual forma aunque el método sea asíncrono el método `call` también funcionará correctamente.

## Ejecutar Desde Fuera del Contenedor

### Resolver funciones (*Callable*)

En situaciones donde necesitas ejecutar una función o método desde fuera del contenedor de servicios, pero aún deseas aprovechar la inyección automática de dependencias, puedes utilizar el método `invoke` disponible en la instancia de la aplicación. Esto es útil para ejecutar funciones independientes que requieren servicios gestionados por el contenedor.

#### Firma del método
```python
(method) def invoke(
    self,
    fn: Callable,
    *args,
    **kwargs
) -> Any
```

#### Parámetros
- **`fn`**: La función o método que deseas ejecutar.
- **`*args`**: Argumentos posicionales adicionales que pueden ser necesarios para la función.
- **`**kwargs`**: Argumentos nombrados adicionales que pueden ser necesarios para la función.
#### Ejemplo de uso

```python
# Ejemplo de función a ejecutar
def log_error(logger: ILoggerService, message: str) -> None:
    logger.error(message)

# Ejecutar la función con inyección de dependencias
result = app.invoke(
    log_error,
    message="Error crítico en el sistema"
)
```

#### Variante Asíncrona

Si la función que deseas ejecutar es asíncrona, puedes utilizar el método `invokeAsync` disponible en la instancia de la aplicación. Esto te permite ejecutar funciones asíncronas con inyección automática de dependencias. Aunque el método `invoke` también funcionará correctamente con funciones asíncronas, `invokeAsync` está optimizado para este propósito.

### Resolver Clases

Si necesitas crear una instancia de una clase desde fuera del contenedor de servicios, pero deseas que el contenedor gestione la inyección automática de dependencias, puedes utilizar el método `build` disponible en la instancia de la aplicación. Esto es útil para instanciar clases que requieren servicios gestionados por el contenedor.

#### Firma del método
```python
(method) def build(
    self,
    type_: Callable[..., Any],
    *args,
    **kwargs
) -> Any
```

#### Parámetros
- **`type_`**: La clase que deseas instanciar.
- **`*args`**: Argumentos posicionales adicionales que pueden ser necesarios para el constructor de la clase.
- **`**kwargs`**: Argumentos nombrados adicionales que pueden ser necesarios para el constructor de la clase.

#### Ejemplo de uso

```python
# Crear una instancia de UserController con inyección de dependencias
user_controller: UserController = app.build(UserController)
```