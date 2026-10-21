---
title: "Controladores y HTML"
description: "Crea vistas, pasa variables desde los controladores y genera respuestas HTML o el texto procesado por el motor."
editUrl: true
lastUpdated: false
---

Una vista es un archivo de plantilla que Orionis procesa en el servidor con Jinja2. El controlador prepara los datos; el motor combina esos datos con la plantilla y la respuesta entrega el HTML al navegador. El renderizado es asíncrono y se integra con las acciones HTTP y la inyección de dependencias de la aplicación.

## Crear y localizar las vistas

Crea los archivos manualmente dentro de `resources/views`, el directorio predeterminado. El framework no incluye un comando `make:view`. Puedes organizar las plantillas por página o dominio:

```text
resources/
└── views/
    ├── layouts/
    │   └── base.html
    ├── partials/
    │   └── navigation.html
    ├── users/
    │   └── profile.html
    └── pages/
        └── about.html
```

La búsqueda utiliza los directorios de `paths` en [config/view.py](/es/services/views/configuration-and-extensions), en el orden configurado. Un directorio relativo se resuelve desde la raíz de la aplicación. El nombre identifica una plantilla dentro de esos directorios; no incluye `resources/views`.

| Nombre entregado al motor | Archivo buscado dentro del directorio de vistas |
|---|---|
| `users.profile` | `users/profile.html` |
| `users/profile` | `users/profile.html` |
| `users/profile.html` | `users/profile.html` |
| `users/profile.j2` | `users/profile.j2` |

Usa puntos **sin extensión**, o una ruta con `/` cuando quieras escribir una extensión explícita. `users.profile.html` se interpreta como notación de puntos y busca `users/profile/html.html`. Para una plantilla en la raíz, `welcome` busca `welcome.html`; `./welcome.html` permite escribir la extensión explícita.

## Devolver una vista desde un controlador

Crea `resources/views/users/profile.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ title }}</title>
  </head>
  <body>
    <h1>{{ user.name }}</h1>
    <p>User #{{ user.id }}</p>
    {% if user.active %}
      <p>Active account</p>
    {% endif %}
    <ul>
      {% for skill in skills %}
        <li>{{ skill }}</li>
      {% else %}
        <li>No skills recorded.</li>
      {% endfor %}
    </ul>
  </body>
</html>
```

Define `app/http/controllers/profile_controller.py`:

```python
from orionis.http import HTMLResponse
from orionis.http.base import BaseController
from orionis.support.facades import View


class ProfileController(BaseController):
    async def show(self, user_id: int) -> HTMLResponse:
        user = {"id": user_id, "name": "Ada", "active": True}
        return await View.make(
            "users.profile",
            title="User profile",
            user=user,
            skills=["Python", "Orionis"],
        )
```

Registra la acción en `routes/web.py`:

```python
from app.http.controllers.profile_controller import ProfileController
from orionis.support.facades import Route

Route.get("/users/{user_id:int}", [ProfileController, "show"]).name("users.show")
```

Al abrir `/users/7`, la ruta convierte el identificador a `int`, el contenedor invoca `show(user_id=7)` y la vista muestra `Ada`, `User #7` y las dos habilidades. Los datos fijos permiten ejecutar el ejemplo; una aplicación real puede obtenerlos de sus servicios desde el controlador.

`View.make("users.profile", ...)` recibe cada variable como argumento nombrado. En la plantilla, `user.name` puede consultar la clave de un diccionario; también puedes escribir `user["name"]`. Las listas se recorren con `for` y los objetos pueden exponer sus atributos.

### Controladores invocables y funciones

Una acción `__call__` devuelve la vista de la misma forma. Guarda este controlador en `app/http/controllers/welcome_controller.py`:

```python
from orionis.http import HTMLResponse
from orionis.http.base import BaseController
from orionis.support.facades import View


class WelcomeController(BaseController):
    async def __call__(self) -> HTMLResponse:
        return await View.make(
            "users.profile",
            title="Welcome",
            user={"id": 7, "name": "Ada", "active": True},
            skills=[],
        )
```

Registra la clase directamente. También puedes utilizar una función; el siguiente bloque se coloca en `routes/web.py`:

```python
from app.http.controllers.welcome_controller import WelcomeController
from orionis.http import HTMLResponse
from orionis.support.facades import Route, View

Route.get("/welcome", WelcomeController)


async def guest_profile() -> HTMLResponse:
    return await View.make(
        "users.profile",
        title="Guest profile",
        user={"id": 0, "name": "Guest", "active": False},
        skills=[],
    )


Route.get("/guest", guest_profile)
```

El sistema de vistas no exige una estructura especial de controlador. Las dependencias del constructor y de la acción se resuelven igual que en los demás [controladores HTTP](/es/http/request-lifecycle).

## Contexto y datos de presentación

También puedes preparar un diccionario y expandirlo con `**context`. Las claves serán variables de primer nivel:

```python
from orionis.http import HTMLResponse
from orionis.support.facades import View


async def prepared_profile() -> HTMLResponse:
    context = {
        "title": "User profile",
        "user": {"id": 7, "name": "Ada", "active": True},
        "skills": ["Python"],
    }
    return await View.make("users.profile", **context)
```

El contexto se pasa a Jinja como datos Python. No se convierte automáticamente a JSON ni se valida como un payload HTTP. Puedes pasar un `Schema` ya construido como una variable, acceder a sus atributos o utilizar `schema.toDict()` para convertirlo en un diccionario. Preparar un esquema de presentación tampoco equivale a validar una entrada; consulta [validación](/es/validation) para ese flujo.

```python
from orionis.http import HTMLResponse
from orionis.schemas import Schema
from orionis.support.facades import View


class ProfileData(Schema):
    id: int
    name: str
    active: bool


async def schema_profile() -> HTMLResponse:
    profile = ProfileData(id=7, name="Ada", active=True)
    return await View.make(
        "users.profile",
        title="Typed profile",
        user=profile,
        skills=["Python"],
    )
```

Pasa solo los datos que la página necesita y evita usar como variables nombres de helpers como `request`, `route`, `config` o `errors`: el contexto local puede ocultar un global del mismo nombre. Para valores compartidos entre plantillas, registra un global en un [provider de vistas](/es/services/views/providers-and-extensions); conserva los datos propios de cada petición en el contexto del renderizado.

## Renderizado pendiente y respuesta HTTP

`View.make()` es síncrono: prepara un `PendingView` sin cargar ni validar todavía la plantilla. Al ejecutar `await`, Orionis procesa la plantilla, crea un `HTMLResponse` con estado `200` y añade `X-Orionis-Render: SSR`.

```python
from orionis.http import HTMLResponse
from orionis.support.facades import View


async def private_profile() -> HTMLResponse:
    pending = View.make(
        "users.profile",
        title="Private profile",
        user={"id": 7, "name": "Ada", "active": True},
        skills=[],
    )
    pending.setHeader("Cache-Control", "no-store")
    pending.withCookie("theme", "dark")
    return await pending
```

Puedes escribir `await pending.render()` en lugar de `await pending`; ambos devuelven `HTMLResponse`. Los métodos de respuesta encadenados se ponen en cola y se aplican después de generar el HTML. Usa `setHeader()` para reemplazar un encabezado y `addHeader()` para añadir otro valor. La firma real de cada método corresponde a [respuestas HTTP](/es/http/responses).

Para establecer el estado, modifica la respuesta ya renderizada:

```python
from orionis.http import HTMLResponse
from orionis.support.facades import View


async def created_profile() -> HTMLResponse:
    rendered = await View.make(
        "users.profile",
        title="Profile created",
        user={"id": 7, "name": "Ada", "active": True},
        skills=[],
    )
    rendered.status_code = 201
    return rendered
```

`View.make(..., status_code=201)` **no configura el estado HTTP**: incorpora una variable de plantilla llamada `status_code`. Lo mismo ocurre con un argumento `headers`.

Crea un pendiente por operación. Esperar el mismo objeto dos veces vuelve a renderizarlo y reproduce sus mutaciones; no almacena una respuesta ya calculada. Una acción debe devolver la respuesta obtenida con `await`, no el pendiente sin esperar ni un `str` suelto.

### Errores de formulario y flash

`withInput()`, `withErrors()` y `withFlash()` preparan datos de sesión antes de renderizar. Este fragmento muestra cómo una acción puede volver a presentar los campos permitidos y sus errores:

```python
from orionis.http import HTMLResponse
from orionis.support.facades import View


async def invalid_login() -> HTMLResponse:
    rendered = await (
        View.make("auth.login")
        .withInput({"email": "ada@example.com"})
        .withErrors({"email": "Unknown account"})
        .withFlash("status", "Please review the form")
        .setHeader("Cache-Control", "no-store")
    )
    rendered.status_code = 422
    return rendered
```

Crea `resources/views/auth/login.html`; este fragmento muestra los mensajes y los campos que después puedes integrar en tu formulario de autenticación:

```html
{% if flash('status') %}
  <p role="status">{{ flash('status') }}</p>
{% endif %}
<label>
  Email
  <input name="email" value="{{ old('email', '') }}">
</label>
{% if errors.has('email') %}
  <p role="alert">{{ errors.first('email') }}</p>
{% endif %}
```

Estos datos necesitan una sesión activa, normalmente proporcionada por las rutas WEB. Sin sesión, el pendiente omite las escrituras flash. `withInput()` filtra nombres de credenciales conocidos; selecciona los campos que quieres conservar. El flash se aplica antes del renderizado, por lo que un error posterior de plantilla no revierte esa escritura. Los helpers se explican en [globals y contexto](/es/services/views/globals), y CSRF en [providers y extensiones](/es/services/views/providers-and-extensions).

## Obtener el HTML procesado como texto

Inyecta `IViewEngine` cuando necesites el HTML para un correo, un fragmento o un servicio. Su método `render(template, context)` es asíncrono y devuelve `str`, sin crear una respuesta, aplicar flash ni añadir encabezados HTTP.

Este controlador, guardado en `app/http/controllers/profile_preview_controller.py`, muestra la inyección por constructor y por método. Ambas alternativas utilizan el motor configurado por la aplicación:

```python
from orionis.http import HTMLResponse, response
from orionis.http.base import BaseController
from orionis.view.contracts.engine import IViewEngine


class ProfilePreviewController(BaseController):
    def __init__(self, engine: IViewEngine) -> None:
        self.engine = engine

    async def preview(self) -> HTMLResponse:
        html = await self.engine.render(
            "users.profile",
            {
                "title": "Profile preview",
                "user": {"id": 7, "name": "Ada", "active": True},
                "skills": ["Python"],
            },
        )
        return response.html(html, headers={"X-Preview": "true"})

    async def fragment(self, engine: IViewEngine) -> HTMLResponse:
        html = await engine.render(
            "users.profile",
            {
                "title": "Profile fragment",
                "user": {"id": 7, "name": "Ada", "active": True},
                "skills": [],
            },
        )
        return response.html(html)
```

```python
from app.http.controllers.profile_preview_controller import ProfilePreviewController
from orionis.support.facades import Route

Route.get("/profile-preview", [ProfilePreviewController, "preview"])
Route.get("/profile-fragment", [ProfilePreviewController, "fragment"])
```

En un servicio puedes conservar el `html`, pasarlo a otra operación o devolverlo al código que lo solicitó. En HTTP, `response.html(html)` lo convierte explícitamente en una respuesta. No vuelve a interpretar el texto como plantilla y no añade el encabezado SSR de `PendingView`.

`IViewFactory` también se puede inyectar si prefieres `await factory.make("users.profile", ...)` a la fachada. Elige la operación según el resultado que necesites:

| Operación | Resultado |
|---|---|
| `View.make(nombre, **contexto)` | `PendingView` que prepara el renderizado. |
| `await View.make(nombre, **contexto)` | `HTMLResponse` con el HTML y el encabezado SSR. |
| `await pending.render()` | El mismo tipo de respuesta que esperar el pendiente. |
| `await engine.render(nombre, contexto)` | `str` con el HTML procesado. |
| `response.html(html)` | `HTMLResponse` a partir del texto ya preparado. |

## Una ruta que solo necesita una plantilla

Para contenido sin datos específicos de un controlador, crea `resources/views/pages/about.html`:

```html
<!doctype html>
<html lang="en">
  <head><title>About</title></head>
  <body><h1>About this application</h1></body>
</html>
```

Regístrala en `routes/web.py`:

```python
from orionis.support.facades import Route

Route.view("/about", "pages.about").name("pages.about")
```

`Route.view(path, view)` registra un GET cuyo renderizado realiza el kernel. No acepta un tercer argumento de contexto ni convierte los parámetros de la ruta en variables de plantilla. Utiliza una acción cuando necesites preparar datos, dependencias o una respuesta personalizada. Los globals del entorno siguen disponibles.

## Errores y límites del renderizado

- Una plantilla que no aparece en los directorios configurados produce `ViewTemplateNotFoundException`. Comprueba el nombre normalizado y `paths`.
- Los errores de renderizado se presentan como `ViewRenderException`, conservando su causa. Un error de sintaxis durante la carga también queda envuelto cuando usas `View.make()`.
- El entorno utiliza `jinja2.Undefined`: una variable ausente puede mostrarse vacía y ciertas operaciones pueden fallar. Pasa explícitamente todos los datos que el contrato de la página requiere.
- El HTML se genera completo antes de que `PendingView` entregue la respuesta; no es una respuesta de streaming.
- No renderices un nombre de plantilla proporcionado directamente por el usuario sin decidir qué vistas puede seleccionar.

Continúa con [plantillas y herencia](/es/services/views/template-language) para componer layouts, o con [configuración y caché](/es/services/views/configuration-and-extensions) para configurar el entorno.
