---
title: "User state and form flash data"
description: "Access the session through injection or its facade, keep browser state and recover form input, errors and notices after a redirect."
editUrl: true
lastUpdated: false
---

A session keeps small preferences or temporary browser state between requests. A draft, a selected language or a wizard step can live here; data that must remain part of your application belongs in permanent storage.

The examples on this page are registered in `routes/web.py`, where middleware starts and saves the session. API routes do not activate that integration automatically. The browser must keep its cookie throughout the flow.

## Accessing the current session

### Constructor injection

Annotate the dependency with `ISession`. The container supplies the instance bound to the current request; you do not need to create `Session()` or save its changes manually:

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

### Action injection

When only one action needs the session, receive it in the method. You do not have to keep it as a controller attribute:

```python
from orionis.http import RedirectResponse, response
from orionis.http.base import BaseController
from orionis.session.contracts.session import ISession


class LocaleController(BaseController):
    async def choose(self, session: ISession) -> RedirectResponse:
        session.put("locale", "es")
        return response.redirect("/settings", 303)
```

The `ISession` methods that manipulate data are **synchronous**, even when the controller action is `async`. Write `session.put(...)` or `session.get(...)`; middleware awaits the store's asynchronous reading and persistence operations.

### Session facade

Import the facade from the module that exposes it. Its calls access the same request session:

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

This facade needs an active scope with a registered session. It does not resolve a global session for commands, background jobs or routes that have not executed session middleware.

### Through Request

If your action already receives `Request`, the same instance is available at `request.state.session`:

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

Middleware adds that attribute; constructing a `Request` does not make it available. Use any of these alternatives within the current request and avoid keeping its session in singleton services or work that continues after the response.

## Reading, writing and removing data

| Operation | Result |
| --- | --- |
| `get(key, default=None)` | Reads the exact key; returns `default` when it is absent. |
| `put(key, value)` | Stores a value. Activates the session if it has not started. |
| `has(key)` | Checks whether the key exists, including when its value is `None`. |
| `forget(key)` | Removes a key; does nothing when it is absent. |
| `clear()` | Empties the data, including internal bags; keeps the identifier. |
| `all()` | Returns a shallow copy of the dictionary, including internal keys. |

Keys are looked up literally: `get("draft.subject")` does not traverse a dictionary stored under `"draft"`. Retrieve that value first.

To update a collection, copy the data, make your changes and write it again with `put`. This makes the update explicit:

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

`put` with a value equal to the existing one does not mark a new change. `all()` does not duplicate nested collections: modifying a nested dictionary also modifies the object held by the session. Select your application's keys when reading or returning data; do not expose the whole `all()` result because it can contain identity, tokens and internal bags.

`clear()` does not end a session: it also removes authentication and CSRF data, but does not request cookie deletion. Use `invalidate()` to end it; use `regenerate()` to change its identifier while keeping data. See [Configuration and lifecycle](/en/sessions/configuration-and-security).

## Flash data: this request and the next

`flash(key, value)` makes a value readable during the request that writes it and during **the next request that loads that session**. It then expires. Reading does not consume it; moving between requests determines its lifetime.

`getFlash(key, default=None)` reads those values; `get(key)` reads regular state and does not search flash bags:

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

If `publish` creates the redirect, the first GET to `/notices` receives `"Changes saved."`; a second GET receives `None`. A new value with the same key takes precedence over the one inherited from the previous request. Use `put` for values that must survive longer.

You can also attach a notice to a response with `withFlash("notice", "...")`. Middleware writes it to the session while processing the response; there is no need to call `session.flash` as well.

## Complete form: draft, errors and redirect

This example stores a draft in the browser's session. A missing subject returns to the form with its fields and error; saving or discarding displays a notice once.

Create `app/http/controllers/draft_controller.py`:

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

Register the actions in `routes/web.py`:

```python
from app.http.controllers.draft_controller import DraftController
from orionis.support.facades import Route

Route.get("/draft", [DraftController, "edit"])
Route.post("/draft", [DraftController, "save"])
Route.post("/draft/discard", [DraftController, "discard"])
```

Create `resources/views/draft/edit.html`:

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

Open `/draft` before submitting the form: the GET prepares the session and CSRF token sent with the POST. HTTP 303 requests a GET afterward, so refreshing the page does not resubmit the form. The draft survives further requests while the session remains valid; errors, previous fields and the notice are flash data.

The example only checks for a subject. Use [validation schemas](/en/validation/controllers-and-http) to validate payload types and rules.

### What each method preserves

| Write | Python read | Template read |
| --- | --- | --- |
| `session.put("draft", values)` | `session.get("draft")` | `session().get("draft")` |
| `session.flash("notice", message)` or `withFlash(...)` | `session.getFlash("notice")` | `flash("notice")` |
| `session.flashInput(values)` or `withInput(values)` | `session.getOldInput("subject", "")` | `old("subject", "")` |
| `session.flashErrors(errors)` or `withErrors(errors)` | `session.getErrors()` | `errors.first("subject")` |

`withInput` explicitly receives a mapping of fields; it does not read the whole request itself. The implementation excludes the top-level keys `_csrf`, `csrf_token`, `current_password`, `new_password`, `password` and `password_confirmation`. For secrets with other names or nested structures, select the allowed fields before storing them, as the example does with `subject` and `body`.

`withErrors` and `flashErrors` accept mappings or compatible validation exceptions. A string is normalized into a list of messages; you can also supply lists. Repeated input or error writes within the same request merge fields and replace the value of a repeated key.

Helpers read the request session. Jinja awaits their asynchronous operations automatically: do not write `await` inside the template. For other ways to display errors:

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

`old` returns `""` when both the result and its default are `None`. `errors` exposes `all()`, `any()`, `has(field)`, `get(field)` and `first(field=None)`. Without an active session, `session()` returns `None`, `flash` and `old` use their defaults and the error bag is empty. That allows helper lookup, but does not enable persistence on API routes.

## Rendering again without a redirect

If you choose to return the form and HTTP 422 in the same request, add input and errors to the `PendingView` **before awaiting it**:

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

`response.view(...)` and `View.make(...)` prepare a `PendingView`. Their flash methods write to the session **before rendering**: `old`, `errors` and `flash` already receive those values in the current HTML. They will also remain available during that session's next request.

In contrast, `response.redirect(...).withInput(...)` and other already-built responses queue data for middleware to apply after the action. Adding `withErrors` to an `HTMLResponse` whose HTML has already been generated does not render it again. See [views and HTML responses](/en/views/rendering-templates).

## Previous page

With `track_previous_url=True`, middleware automatically remembers the URL of GET or HEAD navigations with a 200–299 response, excluding AJAX and requests that want JSON. A POST or redirect does not replace that page.

Inside an action you can read it with `session.getPreviousUrl("/settings")` and set it explicitly with `session.setPreviousUrl(url)`. It is navigation data, not destination validation: use a known route for redirects or validate any client-supplied URL.

To choose where these values persist and understand simultaneous requests, continue to [Storage](/en/sessions/stores-and-concurrency).
