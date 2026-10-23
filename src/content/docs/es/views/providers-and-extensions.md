---
title: "Providers y extensiones de vistas"
description: "Añade filtros, globals, tests y etiquetas a Jinja desde los providers de Orionis."
editUrl: true
lastUpdated: false
---

Los filtros transforman valores, los globals proporcionan valores o funciones compartidas, los tests comprueban condiciones y las extensiones añaden etiquetas al lenguaje de plantillas. Regístralos en un `ServiceProvider` para que estén disponibles antes de renderizar la primera página.

Consulta también los catálogos de [filtros incluidos](/es/views/filters) y [globals incluidos](/es/views/globals). Esta página explica las extensiones incluidas y cómo añadir comportamiento propio.

## Qué registra Orionis al arrancar

`ViewServiceProvider` registra tres singletons: `IViewEnvironment`, `IViewEngine` e `IViewFactory`. Durante su `boot()` añade los helpers nativos, los filtros `json` y `markdown`, y la extensión `CsrfExtension`; finalmente fija la fachada `View`.

La única extensión añadida por Orionis es `CsrfExtension`. Las etiquetas habituales `if`, `for`, `extends`, `include`, `block`, `macro` y `with` pertenecen al lenguaje de Jinja. Las extensiones opcionales `do` y `loopcontrols` no están activadas de fábrica: más abajo se muestra cómo incorporarlas.

### La etiqueta csrf incluida

`{% csrf %}` equivale a `{{ csrf_field() }}`. Produce un campo oculto llamado `_csrf` con el token de la sesión actual:

```jinja
<form method="post" action="/profile">
    {% csrf %}
    <label>
        Name
        <input name="name" value="{{ old('name', '') }}">
    </label>
    <button type="submit">Save</button>
</form>
```

Este fragmento presupone un endpoint `POST /profile` de tu aplicación. Sirve para formularios de rutas WEB, con sesión y protección CSRF configuradas. La etiqueta genera el campo; el middleware verifica el token cuando llega la petición. No convierte una ruta API sin estado en una ruta con sesión.

El helper devuelve markup seguro y escapa el token antes de insertarlo. No añadas `|safe`. Si no hay token, el campo tiene un valor vacío; no se crea un token por utilizar la etiqueta. Si falta el global `csrf_field` en un entorno personalizado, la extensión lanza `ViewRenderException`. Revisa [middleware](/es/http/middleware) y [rutas](/es/http/routing) para su configuración HTTP.

## API para ampliar el entorno

Resuelve `IViewEnvironment` desde el contenedor de la aplicación y utiliza sus métodos públicos:

| Método | Uso en una plantilla | Propósito |
| --- | --- | --- |
| `addFilter(name, callback)` | `{{ total \| money }}` | Transformar el valor situado antes de `\|`. |
| `addGlobal(name, value)` | `{{ support_email }}` o `{{ helper() }}` | Exponer un valor o callable. |
| `addTest(name, callback)` | `{% if stock is positive %}` | Evaluar una condición. |
| `addExtension(extension)` | `{% support_link %}` | Registrar una clase `jinja2.ext.Extension` o su ruta de importación. |

Los registros por nombre sustituyen filtros, globals o tests que ya existan. Elige nombres propios para evitar reemplazar un helper nativo accidentalmente. `addExtension()` envuelve los errores de registro en `ViewException`, conservando su causa.

`getJinjaEnvironment()` devuelve el entorno compartido para inspección. Realiza las modificaciones a través de los métodos anteriores y evita cambiarlo durante peticiones concurrentes.

## Crear una etiqueta propia

Este ejemplo añade `{% support_link %}`. Guarda la extensión en `app/views/extensions/support_link.py`:

```python
from jinja2 import nodes
from jinja2.ext import Extension
from jinja2.parser import Parser
from markupsafe import Markup


class SupportLinkExtension(Extension):
    tags = {"support_link"}

    def parse(self, parser: Parser) -> nodes.Output:
        lineno = next(parser.stream).lineno
        return nodes.Output(
            [self.call_method("_renderLink")],
            lineno=lineno,
        )

    def _renderLink(self) -> Markup:
        email = "help@example.com"
        return Markup('<a href="mailto:{email}">{email}</a>').format(
            email=email,
        )
```

`parse()` consume la etiqueta y crea el nodo de salida. `_renderLink()` produce el contenido cada vez que se renderiza. `Markup.format()` escapa los valores que incorpora, mientras conserva el HTML fijo de confianza. Para etiquetas con argumentos o bloques, consulta la [API oficial de extensiones de Jinja](https://jinja.palletsprojects.com/en/stable/extensions/#writing-extensions); un filtro o global suele bastar cuando no necesitas sintaxis nueva.

## Registrar un provider completo

Guarda `app/providers/view_helpers_provider.py`:

```python
from decimal import Decimal

from app.views.extensions.support_link import SupportLinkExtension
from orionis.container.providers import ServiceProvider
from orionis.view.contracts.environment import IViewEnvironment


def money(value: object) -> str:
    amount = Decimal(str(value))
    return f"${amount:,.2f}"


def positive(value: int | float) -> bool:
    return value > 0


async def delivery_label(country: str) -> str:
    return "Local delivery" if country == "CO" else "International delivery"


class ViewHelpersProvider(ServiceProvider):
    async def boot(self) -> None:
        environment: IViewEnvironment = await self.app.make(IViewEnvironment)
        environment.addFilter("money", money)
        environment.addTest("positive", positive)
        environment.addGlobal("support_email", "help@example.com")
        environment.addGlobal("delivery_label", delivery_label)
        environment.addExtension(SupportLinkExtension)
        environment.addExtension("jinja2.ext.do")
        environment.addExtension("jinja2.ext.loopcontrols")
```

`money` formatea un importe sin crear HTML; el escape habitual sigue activo. `positive` devuelve un booleano. `support_email` es un valor constante. `delivery_label` es una función asíncrona: Jinja espera su resultado automáticamente, sin escribir `await` en la plantilla. Este ejemplo no realiza I/O, pero utiliza la misma firma asíncrona que un helper que necesite esperarlo.

La clase base proporciona un `register()` vacío cuando el provider no necesita registrar servicios propios. Si necesita bindings adicionales, impleméntalos en `register()` síncrono; resuelve dependencias y configura vistas en `boot()` asíncrono. `boot(self)` no recibe automáticamente servicios como parámetros: resuélvelos mediante `self.app.make(...)`.

### Integrarlo en bootstrap/app.py

Importa la clase y añádela a la llamada existente, **antes de `app.create()`**:

```python
from app.providers.view_helpers_provider import ViewHelpersProvider

app.withProviders(ViewHelpersProvider)
```

`app` es la instancia de aplicación que ya existe en `bootstrap/app.py`; conserva sus demás configuraciones y providers. Orionis también descubre providers concretos en el directorio configurado para `app/providers`. El registro explícito deja visible esta integración; no hace falta duplicarlo mediante otra clase.

Foundation registra los servicios antes de completar los boots asíncronos. Los providers core, incluido el de vistas, se preparan antes de los providers de aplicación; por eso el provider propio puede resolver `IViewEnvironment` y ampliar los helpers nativos. Las llamadas explícitas y el descubrimiento participan en el registro final: no deduzcas un orden de dependencias entre varios providers únicamente del orden de los argumentos de `withProviders(...)`.

Durante una petición normal, el runtime ya ha completado este arranque. En un proceso propio que utilice una aplicación fuera de los kernels HTTP/CLI, espera `await app.boot()` antes de usar los helpers; la llamada síncrona `app.create()` no completa por sí sola los boots asíncronos pendientes.

## Utilizar las extensiones desde un controlador

Guarda `resources/views/examples/helpers.html`:

```jinja
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>View helpers</title>
    </head>
    <body>
        <p>Total: {{ total | money }}</p>
        {% if stock is positive %}
            <p>In stock</p>
        {% endif %}
        <p>{{ delivery_label(country) }}</p>
        <p>{{ support_email }}</p>
        {% support_link %}

        {% set names = [] %}
        {% for item in items %}
            {% if not item.active %}
                {% continue %}
            {% endif %}
            {% do names.append(item.name) %}
            {% if names | length == 2 %}
                {% break %}
            {% endif %}
        {% endfor %}
        <p>{{ names | join(', ') }}</p>
    </body>
</html>
```

El ejemplo utiliza las dos extensiones Jinja que registraste: `do` ejecuta una expresión sin imprimir su resultado y `loopcontrols` habilita `break` y `continue` dentro de los bucles. Sin ese registro, estas etiquetas producen un error de sintaxis.

El controlador, en `app/http/controllers/view_helpers_controller.py`, pasa los datos de cada petición mediante el contexto:

```python
from orionis.http import HTMLResponse
from orionis.support.facades import View


class ViewHelpersController:
    async def __call__(self) -> HTMLResponse:
        return await View.make(
            "examples.helpers",
            total="1250.50",
            stock=3,
            country="CO",
            items=[
                {"name": "Hidden", "active": False},
                {"name": "Notebook", "active": True},
                {"name": "Pencil", "active": True},
                {"name": "Folder", "active": True},
            ],
        )
```

En `routes/web.py`:

```python
from app.http.controllers.view_helpers_controller import ViewHelpersController
from orionis.support.facades import Route

Route.get("/view-helpers", ViewHelpersController)
```

La página muestra `$1,250.50`, `In stock`, `Local delivery`, el correo de soporte y `Notebook, Pencil`. No es necesario construir un entorno Jinja por controlador.

## Estado compartido y motores alternativos

El entorno, el motor y la fábrica son singletons por proceso. Registra helpers durante el arranque y pasa usuario, permisos, resultados y datos variables por el contexto de `View.make()`. Un global mutable compartido no aísla datos de peticiones o tenants.

Los globals y filtros se llaman como funciones de plantilla, sin inyección automática en sus parámetros: reciben los argumentos de la expresión Jinja. Si un helper necesita un servicio, resuélvelo explícitamente o utiliza una dependencia estable preparada durante el boot; no conserves una instancia de petición dentro del provider.

Para sustituir el motor, implementa `IViewEngine.render(template, context) -> str` como método asíncrono y reemplaza su binding antes de construir la fábrica. Cambiar el registro después de resolver singletons o de fijar la fachada no reconstruye sus referencias. La ampliación habitual de una aplicación consiste en añadir helpers al entorno existente, como en el ejemplo anterior.

La caché y su limpieza se explican en [configuración y caché](/es/views/configuration-and-cache). Al cambiar la sintaxis o semántica de una extensión, publica el cambio junto con el reinicio de los workers y la limpieza de bytecode que corresponda.
