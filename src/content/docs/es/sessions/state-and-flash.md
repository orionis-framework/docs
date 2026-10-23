---
title: "Estado de usuario y formularios con flash"
description: "Accede a la sesión por inyección o fachada, conserva datos del navegador y recupera formularios, errores y avisos después de una redirección."
editUrl: true
lastUpdated: false
---

Una sesión conserva pequeñas preferencias o estado temporal del navegador entre peticiones. Un borrador, el idioma elegido o un paso de un asistente pueden vivir aquí; los datos que deban conservarse como parte de tu aplicación pertenecen a su almacenamiento permanente.

Los ejemplos de esta página se registran en `routes/web.py`, donde el middleware inicia y guarda la sesión. En las rutas API esa integración no se activa automáticamente. El navegador debe conservar la cookie durante todo el recorrido.

## Acceder a la sesión actual

### Inyección en el constructor

Anota la dependencia con `ISession`. El contenedor entrega la instancia vinculada a la petición actual; no tienes que crear `Session()` ni guardar manualmente sus cambios:

```python
from orionis.http import JSONResponse, response
from orionis.http.base import BaseController
from orionis.session.contracts.session import ISession


class PreferencesController(BaseController):
    def __init__(self, session: ISession) -> None:
        self._session = session

    async def show(self) -> JSONResponse:
        return response.json({
            "locale": self._session.get("locale", "es"),
            "has_locale": self._session.has("locale"),
        })
```

### Inyección en una acción

Cuando solo una acción necesita la sesión, recíbela en el método. No es obligatorio mantenerla como atributo del controlador:

```python
from orionis.http import RedirectResponse, response
from orionis.http.base import BaseController
from orionis.session.contracts.session import ISession


class LocaleController(BaseController):
    async def choose(self, session: ISession) -> RedirectResponse:
        session.put("locale", "es")
        return response.redirect("/settings", 303)
```

Los métodos de `ISession` que manipulan datos son **síncronos**, aunque la acción del controlador sea `async`. Escribe `session.put(...)` o `session.get(...)`; el middleware espera las operaciones asíncronas de lectura y persistencia del almacén.

### Fachada Session

Importa la fachada desde el módulo que la expone. Sus llamadas acceden a la misma sesión de la petición:

```python
from orionis.http import JSONResponse, response
from orionis.http.base import BaseController
from orionis.support.facades import Session


class LocaleSummaryController(BaseController):
    async def show(self) -> JSONResponse:
        return response.json({
            "locale": Session.get("locale", "es"),
        })
```

Esta fachada necesita un scope activo con la sesión registrada. No resuelve una sesión global para comandos, tareas en segundo plano o rutas que no hayan ejecutado el middleware de sesión.

### Desde Request

Si tu acción ya recibe `Request`, la misma instancia se encuentra en `request.state.session`:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.base import BaseController
from orionis.session.contracts.session import ISession


class SessionSummaryController(BaseController):
    async def show(self, request: Request) -> JSONResponse:
        session: ISession = request.state.session
        return response.json({
            "locale": session.get("locale", "es"),
        })
```

Ese atributo lo añade el middleware; no está disponible por el hecho de construir un `Request`. Utiliza cualquiera de estas alternativas dentro de la petición actual y evita conservar su sesión en servicios singleton o trabajo que continúe después de la respuesta.

## Leer, escribir y eliminar datos

| Operación | Resultado |
| --- | --- |
| `get(key, default=None)` | Lee la clave exacta; devuelve `default` si no existe. |
| `put(key, value)` | Guarda un valor. Activa la sesión si aún no estaba iniciada. |
| `has(key)` | Comprueba que la clave exista, incluso si su valor es `None`. |
| `forget(key)` | Elimina una clave; no hace nada si no existe. |
| `clear()` | Vacía los datos, incluidas las bolsas internas; conserva el identificador. |
| `all()` | Devuelve una copia superficial del diccionario, incluidas las claves internas. |

Las claves se consultan literalmente: `get("draft.subject")` no navega dentro de un diccionario almacenado como `"draft"`. Accede primero al valor correspondiente.

Para actualizar una colección, copia los datos, realiza los cambios y vuelve a escribirlos con `put`. Así el cambio queda explícito:

```python
from orionis.http import RedirectResponse, response
from orionis.http.base import BaseController
from orionis.session.contracts.session import ISession


class WizardController(BaseController):
    async def advance(self, session: ISession) -> RedirectResponse:
        wizard = dict(session.get("wizard", {}))
        wizard["step"] = 2
        session.put("wizard", wizard)
        return response.redirect("/wizard/step-two", 303)

    async def restart(self, session: ISession) -> RedirectResponse:
        session.forget("wizard")
        return response.redirect("/wizard", 303)
```

`put` con un valor igual al existente no marca cambios nuevos. `all()` no duplica las colecciones internas: modificar un diccionario anidado también modifica el objeto que mantiene la sesión. Para consultar o devolver datos, selecciona las claves de tu aplicación; no expongas todo `all()` porque puede contener identidad, tokens y bolsas internas.

`clear()` no equivale a cerrar una sesión: elimina también datos de autenticación y CSRF, pero no solicita borrar su cookie. Para finalizarla utiliza `invalidate()`; para cambiar su identificador conservando datos utiliza `regenerate()`. Consulta [Configuración y ciclo de vida](/es/sessions/configuration-and-security).

## Datos flash: esta petición y la siguiente

`flash(key, value)` permite leer un dato durante la petición que lo escribe y durante **la siguiente petición que cargue esa sesión**. Después caduca. Leerlo no lo consume; el avance entre peticiones determina su duración.

`getFlash(key, default=None)` lee esos valores; `get(key)` consulta el estado normal y no busca dentro de las bolsas flash:

```python
from orionis.http import JSONResponse, RedirectResponse, response
from orionis.http.base import BaseController
from orionis.session.contracts.session import ISession


class NoticeController(BaseController):
    async def publish(self, session: ISession) -> RedirectResponse:
        session.flash("notice", "Changes saved.")
        return response.redirect("/notices", 303)

    async def show(self, session: ISession) -> JSONResponse:
        return response.json({
            "notice": session.getFlash("notice"),
        })
```

Si `publish` genera la redirección, el primer GET a `/notices` recibe `"Changes saved."`; un segundo GET recibe `None`. Un valor nuevo con la misma clave tiene prioridad sobre el heredado de la petición anterior. Guarda con `put` los valores que deban durar más de ese recorrido.

También puedes adjuntar el aviso a una respuesta con `withFlash("notice", "...")`. El middleware lo escribe en la sesión al procesar la respuesta; no es necesario llamar además a `session.flash`.

## Formulario completo: borrador, errores y redirección

Este ejemplo guarda un borrador en la sesión del navegador. Al faltar el asunto vuelve al formulario con los campos y el error; al guardar o descartar muestra un aviso una sola vez.

Crea `app/http/controllers/draft_controller.py`:

```python
from orionis.http import HTMLResponse, RedirectResponse, Request, response
from orionis.http.base import BaseController
from orionis.session.contracts.session import ISession


class DraftController(BaseController):
    def __init__(self, session: ISession) -> None:
        self._session = session

    async def edit(self) -> HTMLResponse:
        draft = self._session.get("draft", {"subject": "", "body": ""})
        return await response.view("draft.edit", draft=draft)

    async def save(self, request: Request) -> RedirectResponse:
        payload = await request.formUrlEncoded()
        values = {
            "subject": str(payload.get("subject", "")).strip(),
            "body": str(payload.get("body", "")),
        }

        if not values["subject"]:
            return (
                response.redirect("/draft", 303)
                .withInput(values)
                .withErrors({"subject": "Enter a subject."})
            )

        self._session.put("draft", values)
        return response.redirect("/draft", 303).withFlash(
            "notice", "Draft saved.",
        )

    async def discard(self) -> RedirectResponse:
        self._session.forget("draft")
        return response.redirect("/draft", 303).withFlash(
            "notice", "Draft discarded.",
        )
```

Registra las acciones en `routes/web.py`:

```python
from app.http.controllers.draft_controller import DraftController
from orionis.support.facades import Route

Route.get("/draft", [DraftController, "edit"])
Route.post("/draft", [DraftController, "save"])
Route.post("/draft/discard", [DraftController, "discard"])
```

Crea `resources/views/draft/edit.html`:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Session draft</title>
</head>
<body>
    <h1>Session draft</h1>

    {% if flash("notice") %}
        <p role="status">{{ flash("notice") }}</p>
    {% endif %}

    <form method="post" action="/draft">
        {% csrf %}

        <label for="subject">Subject</label>
        <input
            id="subject"
            name="subject"
            value="{{ old('subject', draft.subject) }}"
        >
        {% if errors.has("subject") %}
            <p role="alert">{{ errors.first("subject") }}</p>
        {% endif %}

        <label for="body">Body</label>
        <textarea id="body" name="body">{{ old("body", draft.body) }}</textarea>

        <button type="submit">Save draft</button>
    </form>

    <form method="post" action="/draft/discard">
        {% csrf %}
        <button type="submit">Discard draft</button>
    </form>
</body>
</html>
```

Abre `/draft` antes de enviar el formulario: el GET prepara la sesión y el token CSRF que se enviará con el POST. La respuesta HTTP 303 solicita después un GET, por lo que actualizar la página no vuelve a enviar el formulario. El borrador sobrevive a nuevas peticiones mientras la sesión siga vigente; los errores, los campos anteriores y el aviso son flash.

La validación del ejemplo comprueba únicamente que exista el asunto. Para validar tipos y reglas de un payload utiliza [schemas de validación](/es/validation/controllers-and-http).

### Qué conserva cada método

| Escritura | Lectura en Python | Lectura en la plantilla |
| --- | --- | --- |
| `session.put("draft", values)` | `session.get("draft")` | `session().get("draft")` |
| `session.flash("notice", message)` o `withFlash(...)` | `session.getFlash("notice")` | `flash("notice")` |
| `session.flashInput(values)` o `withInput(values)` | `session.getOldInput("subject", "")` | `old("subject", "")` |
| `session.flashErrors(errors)` o `withErrors(errors)` | `session.getErrors()` | `errors.first("subject")` |

`withInput` recibe explícitamente un mapping de campos; no lee todo el request por su cuenta. La implementación excluye las claves de primer nivel `_csrf`, `csrf_token`, `current_password`, `new_password`, `password` y `password_confirmation`. Para secretos con otros nombres o estructuras anidadas, selecciona los campos permitidos antes de guardarlos, como hace el ejemplo con `subject` y `body`.

`withErrors` y `flashErrors` aceptan mappings o excepciones de validación compatibles. Una cadena se normaliza a una lista de mensajes; también puedes pasar listas. Las escrituras repetidas de input o errores en la misma petición combinan campos y reemplazan el valor de una clave repetida.

Los helpers consultan la sesión de la petición. Jinja espera sus operaciones asíncronas automáticamente: no escribas `await` dentro de la plantilla. Si necesitas otras formas de mostrar los errores:

```html
{% if errors.any() %}
    <p>{{ errors.first() }}</p>

    <ul>
        {% for field, messages in errors.all().items() %}
            {% for message in messages %}
                <li>{{ field }}: {{ message }}</li>
            {% endfor %}
        {% endfor %}
    </ul>
{% endif %}

{% for message in errors.get("subject") %}
    <p>{{ message }}</p>
{% endfor %}

{% set current_session = session() %}
{% if current_session %}
    <p>Current locale: {{ current_session.get("locale", "es") }}</p>
{% endif %}
```

`old` devuelve `""` cuando el resultado y su valor predeterminado son `None`. `errors` expone `all()`, `any()`, `has(field)`, `get(field)` y `first(field=None)`. Sin sesión activa, `session()` devuelve `None`, `flash` y `old` usan sus valores predeterminados y la bolsa de errores está vacía. Eso permite consultar los helpers, pero no habilita persistencia en rutas API.

## Volver a renderizar sin redirección

Si decides responder con el formulario y HTTP 422 en la misma petición, añade input y errores al `PendingView` **antes de esperarlo**:

```python
from orionis.http import HTMLResponse, Request, response
from orionis.http.base import BaseController


class DraftPreviewController(BaseController):
    async def show(self, request: Request) -> HTMLResponse:
        payload = await request.formUrlEncoded()
        values = {
            "subject": str(payload.get("subject", "")).strip(),
            "body": str(payload.get("body", "")),
        }

        result = await (
            response.view("draft.edit", draft={"subject": "", "body": ""})
            .withInput(values)
            .withErrors({"subject": "Review the subject before saving."})
            .withFlash("notice", "The draft has not been saved.")
        )
        result.status_code = 422
        return result
```

`response.view(...)` y `View.make(...)` preparan un `PendingView`. Sus métodos de flash escriben en la sesión **antes de renderizar**: `old`, `errors` y `flash` ya reciben esos valores en el HTML actual. También permanecerán disponibles durante la siguiente petición de esa sesión.

En cambio, `response.redirect(...).withInput(...)` y las demás respuestas ya construidas encolan los datos para que el middleware los aplique después de la acción. Añadir `withErrors` a un `HTMLResponse` cuyo HTML ya se generó no vuelve a renderizarlo. Consulta [vistas y respuestas HTML](/es/views/rendering-templates).

## Página anterior

Con `track_previous_url=True`, el middleware recuerda automáticamente la URL de las navegaciones GET o HEAD con respuesta 200–299, excluyendo AJAX y peticiones que solicitan JSON. Un POST o una redirección no reemplazan esa página.

Desde una acción puedes consultarla con `session.getPreviousUrl("/settings")` y establecerla explícitamente con `session.setPreviousUrl(url)`. Es un dato de navegación, no un validador del destino: utiliza una ruta conocida para tus redirecciones o valida cualquier URL proporcionada por el cliente.

Para elegir dónde persisten estos datos y cómo se comportan las peticiones simultáneas, continúa con [Almacenamiento](/es/sessions/stores-and-concurrency).
