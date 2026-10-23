---
title: "Templates and inheritance"
description: "Build pages with layouts, blocks, includes, and macros while preserving context and HTML escaping."
editUrl: true
lastUpdated: false
---

Orionis uses Jinja2 syntax inside text files, normally `.html`. Expressions written as `{{ ... }}` produce content; `{% ... %}` statements organize the page, and `{# ... #}` comments do not appear in the output. Data comes from the controller and [environment globals](/en/views/globals).

## Compose a complete page

The following example shows a report page with navigation, a shared layout, a reusable card, and a macro. All template files are created inside `resources/views`:

```text
resources/views/
├── layouts/base.html
├── macros/ui.html
├── partials/navigation.html
├── partials/report-card.html
└── reports/index.html
```

Names used in `extends`, `include`, `import`, and `from` are Jinja paths relative to the search directories: write `layouts/base.html`, including the extension. The dot notation in `View.make("reports.index")` belongs to Orionis's entry point; it does not apply within Jinja instructions.

### Base layout and blocks

Create `resources/views/layouts/base.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{% block title %}Reports · {{ site_name }}{% endblock %}</title>
    {% block head %}{% endblock %}
  </head>
  <body>
    {% include "partials/navigation.html" %}
    <main>
      {% block content %}{% endblock %}
    </main>
    <footer>{% block footer %}{{ site_name }}{% endblock %}</footer>
  </body>
</html>
```

The layout defines a common structure. Each `block` establishes a region that a child template can replace; its original content is used when the child does not override it. Inheritance can have several levels: another template can extend this layout, and a third can extend the second.

### Fragments with include

Create `resources/views/partials/navigation.html`:

```html
<nav aria-label="Main navigation">
  <a href="{{ route('reports.index') }}">{{ site_name }}</a>
</nav>
```

`include` renders another file at that location and receives the current context by default. The navigation can therefore read `site_name`. The asynchronous `route()` helper is awaited automatically and uses the route we register below.

Create `resources/views/partials/report-card.html`:

```html
<article>
  <h2>{{ report.title }}</h2>
  <p>{{ report.summary }}</p>
  <p>{{ ui.badge(report.status) }}</p>
</article>
```

The card reads `report` and `ui` from the location where it is included. An `include` inserts a complete fragment; it does not define a Python component or create an independent controller.

### Macros with arguments

Create `resources/views/macros/ui.html`:

```html
{% macro badge(label, variant="neutral") -%}
  <span class="badge badge--{{ variant }}">{{ label }}</span>
{%- endmacro %}
```

A macro is a parameterized fragment. `label` receives the text, and `variant` has a default value. Hyphens in `{%-` and `-%}` control whitespace around the block; they are not required for it to work.

### Child template and super

Create `resources/views/reports/index.html`:

```html
{% extends "layouts/base.html" %}
{% import "macros/ui.html" as ui %}

{% block title %}Recent reports · {{ super() }}{% endblock %}

{% block head %}
  <meta name="description" content="Recent application reports">
{% endblock %}

{% block content %}
  <h1>Recent reports</h1>
  <p>{{ reports|length }} reports</p>
  {% for report in reports %}
    {% include "partials/report-card.html" %}
  {% else %}
    <p>No reports yet.</p>
  {% endfor %}
{% endblock %}

{% block footer %}
  {{ super() }} · Internal reports
{% endblock %}
```

`extends` selects the parent and should appear before producing page content. `super()` incorporates the same block's content from the parent; here it retains the common title and footer. `import ... as ui` exposes macros under a name, and `ui.badge(...)` returns the fragment. The loop's `else` displays an empty state when there are no reports.

### Controller, context, and route

Save the controller in `app/http/controllers/report_page_controller.py`:

```python
from orionis.http import HTMLResponse
from orionis.http.base import BaseController
from orionis.support.facades import View


class ReportPageController(BaseController):
    async def index(self) -> HTMLResponse:
        reports = [
            {
                "title": "Monthly summary",
                "summary": "The report is ready for review.",
                "status": "Ready",
            },
            {
                "title": "Usage overview",
                "summary": "The report is being prepared.",
                "status": "Processing",
            },
        ]
        return await View.make(
            "reports.index",
            site_name="Orionis Reports",
            reports=reports,
        )
```

Register the route in `routes/web.py`:

```python
from app.http.controllers.report_page_controller import ReportPageController
from orionis.support.facades import Route

Route.get("/reports", [ReportPageController, "index"]).name("reports.index")
```

`GET /reports` renders both cards inside the layout and generates the navigation link. Changing `reports` to `[]` displays `No reports yet.`. Layouts, macros, and partials need no separate route registrations: the engine loads them while processing the main view.

## Decide which context a fragment receives

The three composition mechanisms serve different purposes:

| Instruction | Purpose and context |
|---|---|
| `extends "layouts/base.html"` | Reuses a structure and overrides its blocks with the page context. |
| `include "partials/report-card.html"` | Inserts a file with the current context, including the loop item. |
| `import "macros/ui.html" as ui` | Imports macros; supply their data through explicit arguments. |

If you need only one macro, you can import its name:

```html
{% from "macros/ui.html" import badge %}
{{ badge("Ready", variant="success") }}
```

Imported macros do not receive a page's local variables by default. When a macro needs that context, `with context` includes it:

```html
{% import "macros/ui.html" as ui with context %}
{{ ui.badge("Ready") }}
```

Prefer explicit arguments for reusable fragments. Use `include ... without context` when you want isolation from the local context; environment globals remain available. A missing required file causes an error. For a deliberately optional fragment, Jinja supports:

```html
{% include "partials/announcement.html" ignore missing %}
```

## Variables, conditions, and collections

Use presentation expressions with prepared data. This fragment can be placed in a page receiving `reports`:

```html
{% if reports %}
  <ol>
    {% for report in reports %}
      <li>
        {{ loop.index }}. {{ report.title }}
        {% if loop.first %}<strong>Latest</strong>{% endif %}
      </li>
    {% endfor %}
  </ol>
{% else %}
  <p>No reports available.</p>
{% endif %}

<p>{{ subtitle|default("Report dashboard") }}</p>
```

`loop.index` starts at one; `loop.index0` starts at zero. `default(...)` handles an undefined value; use `default("Fallback", true)` to also replace empty or false values. To explicitly check for a null value, write `{% if value is none %}`. An undefined variable does not replace context preparation: some more complex expressions can produce errors.

Do not perform business queries for every card inside the template. Resolve dependencies and load data in a controller or service, leaving only presentation decisions in the view.

## Asynchronous functions in templates

The environment always has `enable_async=True`, and the engine uses `render_async()`. Jinja awaits asynchronous functions it invokes; write the following in a template:

```html
<a href="{{ route('reports.index', page=2) }}">Next page</a>
<p>{{ config('app.name', 'Application') }}</p>
```

Do not write `await` or use `asyncio.run()` in expressions. The first link uses the registered route and adds `page=2` to the query string. A custom asynchronous function can also be registered in a [provider](/en/views/providers-and-extensions). Helpers that access requests or sessions need their execution context to exist.

## HTML escaping and literal text

Application autoescaping is enabled by default: if a title contains `<script>`, `{{ report.title }}` displays escaped text. This also applies inside layouts, includes, and macros. See [configuration and cache](/en/views/configuration-and-cache) for its setting.

`|safe` declares that a string is already trusted HTML; it does not clean or validate it. Use it only with content controlled or sanitized by your application. The `markdown` filter also does not sanitize external HTML; see its [examples and boundaries](/en/views/filters).

To display another tool's syntax without Jinja evaluating it, use a `raw` block:

```html
{% raw %}
<code>{{ client_side_expression }}</code>
{% endraw %}
```

These files are server templates, not a sandbox for executing untrusted code. Keep templates in application code and pass user content as data.
