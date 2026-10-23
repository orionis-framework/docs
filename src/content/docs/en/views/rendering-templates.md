---
title: "Controllers and HTML"
description: "Create views, pass variables from controllers, and generate HTML responses or the text processed by the engine."
editUrl: true
lastUpdated: false
---

A view is a template file that Orionis processes on the server using Jinja2. The controller prepares the data; the engine combines that data with the template, and the response delivers HTML to the browser. Rendering is asynchronous and integrates with the application's HTTP actions and dependency injection.

## Create and locate views

Create files manually inside `resources/views`, the default directory. The framework does not include a `make:view` command. You can organize templates by page or domain:

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

Lookup uses the `paths` directories in [config/view.py](/en/views/configuration-and-cache), in their configured order. A relative directory is resolved from the application root. The name identifies a template within those directories; it does not include `resources/views`.

| Name passed to the engine | File looked up within the views directory |
|---|---|
| `users.profile` | `users/profile.html` |
| `users/profile` | `users/profile.html` |
| `users/profile.html` | `users/profile.html` |
| `users/profile.j2` | `users/profile.j2` |

Use dotted names **without an extension**, or a path containing `/` when writing an explicit extension. `users.profile.html` is interpreted as dot notation and looks up `users/profile/html.html`. For a root template, `welcome` looks up `welcome.html`; `./welcome.html` allows an explicit extension.

## Return a view from a controller

Create `resources/views/users/profile.html`:

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

Register the action in `routes/web.py`:

```python
from app.http.controllers.profile_controller import ProfileController
from orionis.support.facades import Route

Route.get("/users/{user_id:int}", [ProfileController, "show"]).name("users.show")
```

Opening `/users/7` converts the identifier to `int`, invokes `show(user_id=7)` through the container, and displays `Ada`, `User #7`, and both skills. Fixed data makes the example runnable; a real application can load it from services within the controller.

`View.make("users.profile", ...)` receives each variable as a keyword argument. In the template, `user.name` can access a dictionary key; you can also write `user["name"]`. Lists can be traversed using `for`, and objects can expose their attributes.

### Invokable controllers and functions

A `__call__` action returns a view in the same way. Save this controller in `app/http/controllers/welcome_controller.py`:

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

Register the class directly. You can also use a function; place the following block in `routes/web.py`:

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

The view system requires no special controller structure. Constructor and action dependencies are resolved as with other [HTTP controllers](/en/http/controllers).

## Context and presentation data

You can also prepare a dictionary and expand it using `**context`. Its keys become top-level variables:

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

Context is passed to Jinja as Python data. It is not automatically converted to JSON or validated as an HTTP payload. You can pass a constructed `Schema` as a variable, access its attributes, or use `schema.toDict()` to convert it to a dictionary. Preparing a presentation schema also does not validate input; see [validation](/en/validation) for that flow.

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

Pass only the data a page needs and avoid naming variables after helpers such as `request`, `route`, `config`, or `errors`: local context can shadow a global with the same name. For values shared between templates, register a global in a [view provider](/en/views/providers-and-extensions); keep request-specific data in the rendering context.

## Pending rendering and HTTP responses

`View.make()` is synchronous: it prepares a `PendingView` without loading or checking the template yet. Awaiting it processes the template, creates an `HTMLResponse` with status `200`, and adds `X-Orionis-Render: SSR`.

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

You can write `await pending.render()` instead of `await pending`; both return an `HTMLResponse`. Chained response methods are queued and applied after HTML generation. Use `setHeader()` to replace a header and `addHeader()` to append another value. Each method's real signature belongs to [HTTP responses](/en/http/responses).

To set the status, modify the rendered response:

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

`View.make(..., status_code=201)` **does not configure the HTTP status**: it introduces a template variable named `status_code`. A `headers` argument behaves the same way.

Create a pending view per operation. Awaiting the same object twice renders again and replays its mutations; it does not cache a computed response. An action must return the response obtained with `await`, not an unawaited pending view or a bare `str`.

### Form errors and flash

`withInput()`, `withErrors()`, and `withFlash()` prepare session data before rendering. This fragment shows how an action can redisplay permitted fields and their errors:

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

Create `resources/views/auth/login.html`; this fragment displays messages and fields that you can then integrate into your authentication form:

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

This data needs an active session, normally supplied by WEB routes. Without a session, the pending view skips flash writes. `withInput()` filters known credential names; select the fields to retain. Flash is applied before rendering, so a later template failure does not roll back that write. Helpers are covered in [globals and context](/en/views/globals), and CSRF in [providers and extensions](/en/views/providers-and-extensions).

## Obtain processed HTML as text

Inject `IViewEngine` when you need HTML for an email, a fragment, or a service. Its asynchronous `render(template, context)` method returns `str` without creating a response, applying flash, or adding HTTP headers.

This controller, saved as `app/http/controllers/profile_preview_controller.py`, demonstrates constructor and method injection. Both alternatives use the engine configured by the application:

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

In a service, you can keep `html`, pass it to another operation, or return it to its caller. In HTTP, `response.html(html)` explicitly turns it into a response. It does not reinterpret the text as a template or add the SSR header supplied by `PendingView`.

You can also inject `IViewFactory` if you prefer `await factory.make("users.profile", ...)` to the facade. Choose an operation according to the result you need:

| Operation | Result |
|---|---|
| `View.make(name, **context)` | A `PendingView` that prepares rendering. |
| `await View.make(name, **context)` | An `HTMLResponse` with HTML and the SSR header. |
| `await pending.render()` | The same response type as awaiting the pending view. |
| `await engine.render(name, context)` | A `str` containing the processed HTML. |
| `response.html(html)` | An `HTMLResponse` from previously prepared text. |

## A route that only needs a template

For content without controller-specific data, create `resources/views/pages/about.html`:

```html
<!doctype html>
<html lang="en">
  <head><title>About</title></head>
  <body><h1>About this application</h1></body>
</html>
```

Register it in `routes/web.py`:

```python
from orionis.support.facades import Route

Route.view("/about", "pages.about").name("pages.about")
```

`Route.view(path, view)` registers a GET rendered by the kernel. It accepts no third context argument and does not turn route parameters into template variables. Use an action when you need to prepare data, dependencies, or a customized response. Environment globals remain available.

## Rendering errors and boundaries

- A template missing from the configured directories raises `ViewTemplateNotFoundException`. Check the normalized name and `paths`.
- Rendering errors are reported as `ViewRenderException`, preserving their cause. A syntax error during loading is also wrapped when you use `View.make()`.
- The environment uses `jinja2.Undefined`: a missing variable can appear empty, and some operations can fail. Explicitly pass all data required by a page's contract.
- HTML is fully generated before `PendingView` returns the response; this is not a streaming response.
- Do not render a user-supplied template name without deciding which views the user may select.

Continue with [templates and inheritance](/en/views/template-language) to compose layouts, or [configuration and cache](/en/views/configuration-and-cache) to configure the environment.
