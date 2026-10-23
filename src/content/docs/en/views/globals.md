---
title: "View globals and context"
description: "Every Orionis and Jinja global, with examples and the context required by each helper."
editUrl: true
lastUpdated: false
---

Globals are names available in every template without passing them from each controller. Orionis registers functions that query services and an `errors` object for form errors. Jinja also provides six template utilities.

The environment is async: write `{{ asset("css/app.css") }}` and Jinja awaits its result. Do not write `await` inside a template. Call global functions with `()`; for example, `request()` retrieves the request, whereas `request` is the function. The exception is `errors`, which is already a bag exposing methods.

## Controller variables and shared context

Pass page-specific data from the controller:

```python
from orionis.http import HTMLResponse
from orionis.support.facades import View


class DashboardController:
    async def __call__(self) -> HTMLResponse:
        return await View.make(
            "dashboard.index",
            page_title="Dashboard",
            stats={"open": 7, "closed": 12},
        )
```

In `resources/views/dashboard/index.html`:

```html
<h1>{{ page_title }}</h1>
<p>{{ stats.open }} open / {{ stats.closed }} closed</p>
<footer>{{ config("app.name", "Demo") }}</footer>
```

`page_title` and `stats` belong to that render. A global registered in a provider belongs to the shared environment; do not store a request's user there. Helpers look up services when called, according to the contracts registered in the scope. Requests and sessions have different requirements, explained below. Avoid context names such as `request`, `config`, or `errors`, which would shadow the corresponding helpers.

## Application, configuration, and cache

### app()

Returns the application instance. Access its API when a more specific helper does not cover your requirement; keep data preparation and business operations in controllers or services.

```html
<small>{{ app().config("app.name") }}</small>
```

### config(key, default=None)

Reads a dot-notated configuration key. If its value is `None`, it returns the default; values such as `False`, `0`, or an empty string are preserved.

```html
<title>{{ config("app.name", "Demo") }}</title>
```

### cache(key, default=None)

Reads a value through the application's cache manager. If the result is `None`, it returns `default`. It does not write data or automatically execute a cache producer.

```html
<p>Published reports: {{ cache("reports:published", 0) }}</p>
```

Prepare or update that value in your application. Resolve repeated expensive reads before rendering instead of performing them inside a loop.

## URLs, routes, and public files

### url(path="/", **query) and secure_url(path="/", **query)

Build links from a path. They prefix `baseUrl` only when the container can resolve `IRequest`; otherwise they return the normalized path. The HTTP kernel registers the request under `Request` without automatically registering `IRequest`, so these links are origin-relative with the default configuration. Extra arguments become an encoded query string, including lists. Absolute HTTP(S) URLs and URLs starting with `//` retain their origin.

```html
<a href="{{ url('/reports', page=2, status='open') }}">Reports</a>
<a href="{{ secure_url('/account') }}">Account over HTTPS</a>
```

`secure_url` rewrites `http://` or `//` to `https://` when a host is present. A result such as `/account` stays relative even while an HTTP request is being handled; the helper does not configure HTTPS or invent a domain.

### route(name, **params)

Builds the URL of a route registered with `.name()`. Parameters used by the path are encoded as segments; remaining parameters become a query string. First register a route in `routes/web.py`, for example:

```python
from orionis.http import response
from orionis.support.facades import Route


async def show_report(report_id: int):
    return response.text(f"Report {report_id}")


Route.get("/reports/{report_id:int}", show_report).name("reports.show")
```

```html
<a href="{{ route('reports.show', report_id=7, tab='history') }}">Report 7</a>
```

With the default configuration this generates `/reports/7?tab=history`, which the browser resolves against the page's origin. `baseUrl` is prefixed only if your application provides a resolvable `IRequest`; for example, with that contract and an origin of `http://localhost:8000`, the result would be `http://localhost:8000/reports/7?tab=history`. An unknown route or missing required parameter raises `ViewRouteException`; no silent substitution occurs.

### asset(path, disk=None) and secure_asset(path, disk=None)

Request the file URL from storage: `storage.disk(disk or "public").file(path).url()`. The path is relative to the disk root, not to `resources/views` or the project directory.

```html
<link rel="stylesheet" href="{{ asset('css/app.css') }}">
<img src="{{ secure_asset('brand/logo.png', disk='public') }}" alt="Demo">
```

These examples require files available on the `public` disk and disk configuration that supports public URLs. The helpers do not check existence, upload files, or create public links. `secure_asset` rewrites the URL scheme when a host is known. See [Storage](/en/storage) for publishing and retrieving files through the `Storage` facade.

## Request, session, and authentication

### request()

Attempts to resolve `IRequest`, returning `None` when unavailable. The kernel registers the HTTP request as `Request`, not `IRequest`, so a normal HTTP request does not guarantee that this global returns a request. The following fragment handles its absence:

```html
{% set current_request = request() %}
{% if current_request is not none %}
  <small>{{ current_request.method }} {{ current_request.path }}</small>
{% endif %}
```

To display request information without depending on that contract, inject `Request` into the controller and pass the required data under distinct names. Create `app/http/controllers/request_context_controller.py`:

```python
from orionis.http import HTMLResponse, Request
from orionis.support.facades import View


class RequestContextController:
    async def __call__(self, request: Request) -> HTMLResponse:
        return await View.make(
            "pages.request-context",
            request_info={"method": request.method, "path": request.path},
        )
```

Register it in `routes/web.py`:

```python
from app.http.controllers.request_context_controller import RequestContextController
from orionis.support.facades import Route


Route.get("/request-context", RequestContextController)
```

In `resources/views/pages/request-context.html`:

```html
<small>{{ request_info.method }} {{ request_info.path }}</small>
```

`GET /request-context` displays `GET /request-context`. The name `request_info` leaves the `request` global available; handle payloads and validation in the controller.

### session()

Returns the active session, or `None` when the service is unavailable. On WEB routes, session middleware supplies this context; an API route does not gain a session merely by rendering HTML.

```html
{% set current_session = session() %}
{% if current_session is not none %}
  <p>Theme: {{ current_session.get("theme", "light") }}</p>
{% endif %}
```

### auth()

Returns the authentication facade. Calls query the active context's identity rather than an identity stored in the template. Check authentication before accessing the user:

```html
{% if auth().check() %}
  <p>Account: {{ auth().user().getAuthIdentifier() }}</p>
{% elif auth().guest() %}
  <a href="{{ url('/login') }}">Sign in</a>
{% endif %}
```

The example uses the identity contract; additional properties such as `name` depend on your application's model. Showing or hiding a link does not replace endpoint authorization. See [Authentication](/en/authentication) to configure user resolution.

## Forms, messages, and CSRF

### old(key, default=None)

Retrieves previous input saved with `withInput()`. It does not read flash messages or errors. When the resulting value is `None`, it returns an empty string.

```html
<label for="email">Email</label>
<input id="email" name="email" type="email" value="{{ old('email', '') }}">
```

### flash(key, default=None)

Reads a temporary message written with `withFlash()`. If there is no session or the key is missing, it returns `default`. It can also read a value written during the same request.

```html
{% set status = flash("status") %}
{% if status is not none %}
  <p role="status">{{ status }}</p>
{% endif %}
```

### errors

A bag of errors saved with `withErrors()`, not a function or dictionary. Its five methods are async and awaited automatically by Jinja:

- `any()` reports whether messages exist.
- `has(field)` reports whether a field has messages.
- `get(field)` returns that field's list.
- `first(field=None)` returns the first message for a field or the whole bag.
- `all()` returns the complete dictionary of field-indexed lists.

```html
{% if errors.any() %}
  <p role="alert">{{ errors.first() }}</p>
{% endif %}
{% if errors.has("email") %}
  <p id="email-error">{{ errors.first("email") }}</p>
  <ul>
    {% for message in errors.get("email") %}
      <li>{{ message }}</li>
    {% endfor %}
  </ul>
{% endif %}
{% for field, messages in errors.all().items() %}
  <p>{{ field }}: {{ messages | join("; ") }}</p>
{% endfor %}
```

Without an available session, the bag behaves as empty: `all()` returns `{}`, `get()` returns `[]`, `first()` returns `""`, and boolean methods return `False`.

### csrf_token() and csrf_field()

`csrf_token()` reads the session token under `http.csrf.session_key`, or `_csrf_token` when unconfigured. `csrf_field()` builds a hidden `<input>` named `_csrf`; it returns `Markup` and escapes the token. Do not add `|safe`.

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
<form method="post" action="{{ url('/profile') }}">
  {{ csrf_field() }}
  <input name="display_name" value="{{ old('display_name', '') }}">
  <button type="submit">Save</button>
</form>
```

Both functions require a resolvable session service. If the session exists but has no token yet, the value is empty; the helpers do not generate one themselves. WEB's CSRF middleware issues and validates the token. The `{% csrf %}` extension is equivalent to `{{ csrf_field() }}`; see [Providers and extensions](/en/views/providers-and-extensions).

See [Rendering views](/en/views/rendering-templates) for the complete flow that saves input, errors, and messages.

## Translations and locales

### trans(key, locale=None, **replace) and __(…)

`trans` translates a key and replaces `:name` placeholders using named arguments. `__` is exactly the same callable registered under another name. When a translation is missing, the translator returns the key after consulting the fallback locale.

For a reproducible example, create `resources/lang/en/messages.json`:

```json
{
  "welcome": "Welcome, :name!",
  "reports": "{0} No reports|{1} One report|[2,*] :count reports"
}
```

```html
<h1>{{ trans("messages.welcome", locale="en", name="Ada") }}</h1>
<p>{{ __("messages.welcome", locale="en", name="Lin") }}</p>
```

### choice(key, count, locale=None, **replace)

Selects a plural segment according to the quantity. The line above contains exact cases and a range; `:count` is provided automatically.

```html
<p>{{ choice("messages.reports", 0, locale="en") }}</p>
<p>{{ choice("messages.reports", 3, locale="en") }}</p>
```

The output is `No reports` and `3 reports`. Pass a numeric quantity; the function does not convert strings to numbers.

### locale() and locales()

`locale()` returns the translator's active locale. `locales()` returns a sorted tuple of locales with discovered translation files.

```html
<p>Active language: {{ locale() }}</p>
<ul>
  {% for code in locales() %}
    <li>{{ code }}</li>
  {% endfor %}
</ul>
```

The translator is shared; select a language per call by passing `locale=` to `trans` or `choice`. See [Localization](/en/localization) for file organization and loading.

## Collections, strings, and dates

### collect(value=None)

Returns a `Collection`: `None` creates an empty collection, lists supply their elements, and other iterables are materialized. Strings remain a single element.

```html
<p>{{ collect(["api", "web"]).count() }} modules</p>
<p>{{ collect("api").count() }} item</p>
```

### stringable(value="")

Returns a `Stringable` for chained text transformations. If given one already, it preserves that instance.

```html
<p>{{ stringable("Hello Orionis").slug() }}</p>
<p>{{ stringable("orionis").upper() }}</p>
```

The results are `hello-orionis` and `ORIONIS`.

### now() and today()

`now()` returns the current date and time through `DateTime`; `today()` returns the start of the day. Both use the timezone configured for that facade. The returned object supports formatting directly:

```html
<time>{{ now().to_iso8601_string() }}</time>
<p>Report date: {{ today().to_date_string() }}</p>
```

## Encryption and diagnostics

### encrypt(plaintext) and decrypt(payload)

Resolve `IEncrypter` and use the application's configured cipher and key. These are reversible encryption operations, not password hashing.

```html
{% set encrypted_reference = encrypt("report:7") %}
<code>{{ encrypted_reference }}</code>
<p>{{ decrypt(encrypted_reference) }}</p>
```

The second result is `report:7`. `decrypt` requires a valid payload and the corresponding key; encryption errors propagate. The server must still authorize operations even when a reference is encrypted.

### dump(*values)

Produces diagnostic HTML through `VarDumper` and returns `Markup`; no `|safe` is needed. The implementation also prints the dump to the process console. Use it temporarily with data appropriate to expose on that page and in its logs.

```html
{{ dump({"report_id": 7, "status": "ready"}, ["api", "web"]) }}
```

### framework_version() and python_version()

Return the installed framework version and the running interpreter version, useful on an internal diagnostic page.

```html
<p>Orionis: {{ framework_version() }}</p>
<p>Python: {{ python_version() }}</p>
```

## Standard utilities included by Jinja

These six utilities do not resolve Orionis services and are also available by default.

### range(start, stop=None, step=1)

Produces integers; with one argument it starts at zero and excludes the final limit. Use it for repeated controls or positions.

```html
{% for page in range(1, 4) %}
  <a href="{{ url('/reports', page=page) }}">{{ page }}</a>
{% endfor %}
```

### dict(**items)

Creates a dictionary from named arguments when you need a small structure within the template.

```html
{% set badge = dict(label="Ready", color="green") %}
<span class="{{ badge.color }}">{{ badge.label }}</span>
```

### cycler(*items)

Alternates values even across multiple loops. The object exposes `next()`, `current`, and `reset()`.

```html
{% set rows = cycler("odd", "even") %}
{% for name in ["Ada", "Lin", "Sam"] %}
  <p class="{{ rows.next() }}">{{ name }}</p>
{% endfor %}
```

### joiner(sep=", ")

Returns an empty string on its first call and the separator afterward. Use it to separate conditional fragments without leading or trailing commas.

```html
{% set separator = joiner(" / ") %}
{% for label in ["API", "WEB"] %}{{ separator() }}{{ label }}{% endfor %}
```

### namespace(**items)

Preserves values modified inside a loop for use afterward; a plain `set` assignment within a loop does not have that scope.

```html
{% set summary = namespace(total=0) %}
{% for quantity in [2, 3, 4] %}
  {% set summary.total = summary.total + quantity %}
{% endfor %}
<p>Total: {{ summary.total }}</p>
```

### lipsum(n=5, html=True, min=20, max=100)

Generates random paragraphs for mockups. This example disables HTML to return plain text; it does not depend on translations or application content.

```html
<p>{{ lipsum(n=1, html=false, min=5, max=8) }}</p>
```

## Create custom globals

Register values or callables in a provider through `IViewEnvironment.addGlobal()`. Async callables are also awaited automatically. See [Providers and extensions](/en/views/providers-and-extensions) for a complete example registered in the application; keep request-specific state in its services and context.

---

[Views](/en/views) · [Filters](/en/views/filters) · [Rendering views](/en/views/rendering-templates)
