---
title: "View providers and extensions"
description: "Add filters, globals, tests, and tags to Jinja through Orionis providers."
editUrl: true
lastUpdated: false
---

Filters transform values, globals supply shared values or functions, tests check conditions, and extensions add tags to the template language. Register them in a `ServiceProvider` so they are available before the first page renders.

See also the catalogs of [included filters](/en/views/filters) and [included globals](/en/views/globals). This page covers the included extensions and how to add your own behavior.

## What Orionis registers at startup

`ViewServiceProvider` registers three singletons: `IViewEnvironment`, `IViewEngine`, and `IViewFactory`. During `boot()` it adds native helpers, the `json` and `markdown` filters, and `CsrfExtension`; it then pins the `View` facade.

The only extension added by Orionis is `CsrfExtension`. Ordinary `if`, `for`, `extends`, `include`, `block`, `macro`, and `with` tags belong to the Jinja language. Optional `do` and `loopcontrols` extensions are not enabled by default: their registration is shown below.

### The included csrf tag

`{% csrf %}` is equivalent to `{{ csrf_field() }}`. It produces a hidden field named `_csrf` containing the current session token:

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

This fragment assumes your application has a `POST /profile` endpoint. It is intended for WEB forms with sessions and CSRF protection configured. The tag generates the field; middleware checks the token when the request arrives. It does not turn a stateless API route into a stateful route.

The helper returns safe markup and escapes the token before inserting it. Do not add `|safe`. Without a token, the field has an empty value; using the tag does not create a token. If a custom environment lacks the `csrf_field` global, the extension raises `ViewRenderException`. See [middleware](/en/http/middleware) and [routes](/en/http/routing) for their HTTP configuration.

## Environment extension API

Resolve `IViewEnvironment` from the application container and use its public methods:

| Method | Template usage | Purpose |
| --- | --- | --- |
| `addFilter(name, callback)` | `{{ total \| money }}` | Transform the value before `\|`. |
| `addGlobal(name, value)` | `{{ support_email }}` or `{{ helper() }}` | Expose a value or callable. |
| `addTest(name, callback)` | `{% if stock is positive %}` | Evaluate a condition. |
| `addExtension(extension)` | `{% support_link %}` | Register a `jinja2.ext.Extension` class or its import path. |

Named registration replaces filters, globals, or tests that already exist. Choose application-specific names to avoid accidentally replacing a native helper. `addExtension()` wraps registration failures in `ViewException`, preserving their cause.

`getJinjaEnvironment()` returns the shared environment for inspection. Make changes through the methods above and avoid modifying it during concurrent requests.

## Create a custom tag

This example adds `{% support_link %}`. Save the extension as `app/views/extensions/support_link.py`:

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

`parse()` consumes the tag and constructs the output node. `_renderLink()` produces content each time the template renders. `Markup.format()` escapes inserted values while preserving trusted fixed HTML. For tags with arguments or blocks, consult the [official Jinja extension API](https://jinja.palletsprojects.com/en/stable/extensions/#writing-extensions); a filter or global is usually sufficient when new syntax is unnecessary.

## Register a complete provider

Save `app/providers/view_helpers_provider.py`:

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

`money` formats an amount without creating HTML; ordinary escaping remains active. `positive` returns a boolean. `support_email` is a constant value. `delivery_label` is asynchronous: Jinja awaits its result automatically, without `await` in the template. This example performs no I/O, but uses the same asynchronous signature as a helper that needs to await it.

The base class provides an empty `register()` when no application services need registration. If additional bindings are needed, define them in synchronous `register()`; resolve dependencies and configure views in asynchronous `boot()`. `boot(self)` does not automatically receive services as parameters: resolve them using `self.app.make(...)`.

### Integrate it in bootstrap/app.py

Import the class and add it to the existing setup **before `app.create()`**:

```python
from app.providers.view_helpers_provider import ViewHelpersProvider

app.withProviders(ViewHelpersProvider)
```

`app` is the application instance already defined in `bootstrap/app.py`; preserve its other settings and providers. Orionis also discovers concrete providers in the directory configured for `app/providers`. Explicit registration makes the integration visible; there is no need to duplicate it through another class.

Foundation registers services before completing asynchronous boots. Core providers, including views, are prepared before application providers; therefore the custom provider can resolve `IViewEnvironment` and extend native helpers. Explicit calls and discovery participate in the final registry: do not infer dependencies between several providers solely from argument order in `withProviders(...)`.

During a normal request, the runtime has already completed this startup. In a custom process using an application outside HTTP/CLI kernels, await `app.boot()` before using helpers; synchronous `app.create()` alone does not complete pending asynchronous boots.

## Use extensions from a controller

Save `resources/views/examples/helpers.html`:

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

This uses the two Jinja extensions you registered: `do` evaluates an expression without printing its result, and `loopcontrols` enables `break` and `continue` inside loops. Without registration, these tags produce a syntax error.

The controller, in `app/http/controllers/view_helpers_controller.py`, passes request-specific data through the context:

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

In `routes/web.py`:

```python
from app.http.controllers.view_helpers_controller import ViewHelpersController
from orionis.support.facades import Route

Route.get("/view-helpers", ViewHelpersController)
```

The page displays `$1,250.50`, `In stock`, `Local delivery`, the support email, and `Notebook, Pencil`. No separate Jinja environment is needed per controller.

## Shared state and alternative engines

The environment, engine, and factory are singletons per process. Register helpers at startup and pass users, permissions, results, and changing data through `View.make()` context. A shared mutable global does not isolate data between requests or tenants.

Globals and filters are called as template functions, without automatic injection into their parameters: they receive arguments from the Jinja expression. When a helper needs a service, resolve it explicitly or use a stable dependency prepared at boot; do not retain a request instance inside the provider.

To replace the engine, implement asynchronous `IViewEngine.render(template, context) -> str` and replace its binding before constructing the factory. Changing registration after resolving singletons or pinning the facade does not rebuild their references. The usual application extension adds helpers to the existing environment, as shown above.

Caching and cleanup are explained in [configuration and cache](/en/views/configuration-and-cache). When changing an extension's syntax or semantics, deploy it together with worker restarts and the appropriate bytecode cleanup.
