---
title: "Plantillas y herencia"
description: "Construye páginas con layouts, bloques, includes y macros, manteniendo el contexto y el escape de HTML."
editUrl: true
lastUpdated: false
---

Orionis utiliza la sintaxis de Jinja2 dentro de archivos de texto, normalmente `.html`. Las expresiones `{{ ... }}` producen contenido; las sentencias `{% ... %}` organizan la página y los comentarios `{# ... #}` no aparecen en el resultado. Los datos proceden del controlador y de los [globals del entorno](/es/services/views/globals).

## Componer una página completa

El siguiente ejemplo muestra una página de informes con navegación, un layout compartido, una tarjeta reutilizable y una macro. Todos los archivos de plantilla se crean dentro de `resources/views`:

```text
resources/views/
├── layouts/base.html
├── macros/ui.html
├── partials/navigation.html
├── partials/report-card.html
└── reports/index.html
```

Los nombres usados en `extends`, `include`, `import` y `from` son rutas de Jinja relativas a los directorios de búsqueda: escribe `layouts/base.html`, incluyendo la extensión. La notación de puntos de `View.make("reports.index")` corresponde al punto de entrada de Orionis; no se aplica dentro de las instrucciones de Jinja.

### Layout base y bloques

Crea `resources/views/layouts/base.html`:

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

El layout define la estructura común. Cada `block` establece una zona que una plantilla hija puede reemplazar; su contenido original se usa si la hija no lo redefine. Puedes tener varios niveles de herencia: otra plantilla puede extender este layout y una tercera extender la segunda.

### Fragmentos con include

Crea `resources/views/partials/navigation.html`:

```html
<nav aria-label="Main navigation">
  <a href="{{ route('reports.index') }}">{{ site_name }}</a>
</nav>
```

`include` renderiza otro archivo en ese punto y recibe el contexto actual por defecto. Por eso la navegación puede leer `site_name`. El helper async `route()` se espera automáticamente y utilizará la ruta que registraremos más abajo.

Crea `resources/views/partials/report-card.html`:

```html
<article>
  <h2>{{ report.title }}</h2>
  <p>{{ report.summary }}</p>
  <p>{{ ui.badge(report.status) }}</p>
</article>
```

La tarjeta lee `report` y `ui` del lugar donde se incluye. Un `include` sirve para un fragmento completo; no define un componente Python ni crea un controlador independiente.

### Macros con argumentos

Crea `resources/views/macros/ui.html`:

```html
{% macro badge(label, variant="neutral") -%}
  <span class="badge badge--{{ variant }}">{{ label }}</span>
{%- endmacro %}
```

Una macro es un fragmento parametrizable. `label` recibe el texto y `variant` tiene un valor predeterminado. Los guiones en `{%-` y `-%}` controlan el espacio alrededor del bloque; no son necesarios para que funcione.

### Plantilla hija y super

Crea `resources/views/reports/index.html`:

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

`extends` selecciona el padre y debe aparecer antes de producir contenido de página. `super()` incorpora el contenido del mismo bloque en el padre; aquí conserva el título y el footer comunes. `import ... as ui` expone las macros mediante un nombre y `ui.badge(...)` devuelve el fragmento. El `else` del bucle muestra un estado vacío cuando no hay informes.

### Controlador, contexto y ruta

Guarda el controlador en `app/http/controllers/report_page_controller.py`:

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

Registra la ruta en `routes/web.py`:

```python
from app.http.controllers.report_page_controller import ReportPageController
from orionis.support.facades import Route

Route.get("/reports", [ReportPageController, "index"]).name("reports.index")
```

`GET /reports` renderiza las dos tarjetas dentro del layout y genera el enlace de navegación. Si cambias `reports` por `[]`, aparece `No reports yet.`. No es necesario registrar cada layout, macro o partial como una ruta: el motor los carga al procesar la vista principal.

## Decidir qué contexto recibe un fragmento

Las tres formas de composición tienen propósitos distintos:

| Instrucción | Uso y contexto |
|---|---|
| `extends "layouts/base.html"` | Reutiliza una estructura y redefine sus bloques con el contexto de la página. |
| `include "partials/report-card.html"` | Inserta un archivo con el contexto actual, incluido el elemento del bucle. |
| `import "macros/ui.html" as ui` | Importa macros; pasa sus datos mediante argumentos explícitos. |

Si solo necesitas una macro, puedes importar su nombre:

```html
{% from "macros/ui.html" import badge %}
{{ badge("Ready", variant="success") }}
```

Las macros importadas no reciben las variables locales de la página por defecto. Si una macro necesita ese contexto, `with context` lo incorpora:

```html
{% import "macros/ui.html" as ui with context %}
{{ ui.badge("Ready") }}
```

Prefiere argumentos explícitos cuando el fragmento debe ser reutilizable. Un `include ... without context` sirve cuando quieres aislarlo del contexto local; los globals del entorno siguen estando disponibles. Un archivo requerido que no existe causa un error. Para un fragmento deliberadamente opcional, Jinja permite:

```html
{% include "partials/announcement.html" ignore missing %}
```

## Variables, condiciones y colecciones

Utiliza expresiones de presentación sobre datos ya preparados. Este fragmento puede colocarse dentro de una página que reciba `reports`:

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

`loop.index` empieza en uno; `loop.index0` empieza en cero. `default(...)` cubre un valor indefinido; utiliza `default("Fallback", true)` si también quieres sustituir valores vacíos o falsos. Para comprobar explícitamente un valor nulo puedes escribir `{% if value is none %}`. Una variable no definida no sustituye la preparación del contexto: ciertas expresiones más complejas pueden producir errores.

No hagas consultas de negocio por cada tarjeta desde la plantilla. Resuelve las dependencias y carga los datos en el controlador o servicio, y deja en la vista las decisiones necesarias para mostrarlos.

## Funciones asíncronas en las plantillas

El entorno siempre tiene `enable_async=True` y el motor utiliza `render_async()`. Jinja espera las funciones async que invoca; en una plantilla escribe:

```html
<a href="{{ route('reports.index', page=2) }}">Next page</a>
<p>{{ config('app.name', 'Application') }}</p>
```

No escribas `await` ni uses `asyncio.run()` en las expresiones. El primer enlace utiliza la ruta registrada y agrega `page=2` como query string. Una función async propia también puede registrarse en un [provider](/es/services/views/providers-and-extensions). Los helpers que acceden a request o sesión necesitan que exista su contexto de ejecución.

## Escape de HTML y texto literal

El autoescape de la aplicación está activado por defecto: si un título contiene `<script>`, `{{ report.title }}` lo representa como texto escapado. Se aplica también dentro de layouts, includes y macros. La configuración se explica en [configuración y caché](/es/services/views/configuration-and-extensions).

`|safe` declara que una cadena ya es HTML confiable; no la limpia ni la valida. Úsalo solo con contenido controlado o sanitizado por tu aplicación. El filtro `markdown` tampoco sanitiza HTML externo; consulta sus [ejemplos y límites](/es/services/views/filters).

Para mostrar la sintaxis de otra herramienta sin que Jinja la evalúe, utiliza un bloque `raw`:

```html
{% raw %}
<code>{{ client_side_expression }}</code>
{% endraw %}
```

Los archivos son plantillas de servidor, no un entorno aislado para ejecutar código no confiable. Conserva las plantillas en el código de la aplicación y pasa el contenido de los usuarios como datos.
