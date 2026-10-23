---
title: "Facade, injection, and views"
description: "Translate from controllers, services, and templates with Lang and ITranslator, selecting a language without changing other requests’ shared state."
editUrl: true
lastUpdated: false
---

The `Lang` facade, the `ITranslator` contract, and view helpers use the same translator configured by the application. Choose the access style that suits each component: the facade for direct calls, injection to declare dependencies, and helpers to translate while rendering HTML.

## Prepare the messages

Create these two UTF-8 JSON files. If they already exist, merge the keys without removing existing ones. Their location starts at `app.language_path`; these examples use its default, `resources/lang/`.

`resources/lang/en/dashboard.json`:

```json
{
  "title": "Reports",
  "welcome": "Hello :name",
  "reports": "{0} No reports|{1} One report|[2,*] :count reports"
}
```

`resources/lang/es/dashboard.json`:

```json
{
  "title": "Informes",
  "welcome": "Hola :name",
  "reports": "{0} No hay informes|{1} Un informe|[2,*] :count informes"
}
```

The resulting keys are `dashboard.title`, `dashboard.welcome`, and `dashboard.reports`. The translator receives a message key rather than a file path. File organization, locale discovery, and fallback are covered in [Messages and locales](/en/localization/messages-and-locales); replacements and plurals are explained in [Translating content](/en/localization/translating-content).

## Use the Lang facade

Import the facade from the module that exposes it:

```python
from orionis.support.facades import Lang
```

After application boot, `Lang.get()` returns a string and `Lang.choice()` selects a pluralized message. Both calls are synchronous: do not use `await`, even in an asynchronous controller. The facade requires the localization provider to have booted; importing `Lang` in a standalone script does not configure an application.

Create `app/http/controllers/localized_greeting_controller.py`:

```python
from orionis.http import JSONResponse, response
from orionis.http.base import BaseController
from orionis.support.facades import Lang


class LocalizedGreetingController(BaseController):
    async def __call__(self, language: str) -> JSONResponse:
        if language not in ("en", "es"):
            return response.json({"error": "Unsupported language"}, status_code=404)

        return response.json(
            {
                "language": language,
                "greeting": Lang.get("dashboard.welcome", locale=language, name="Ada"),
                "reports": Lang.choice("dashboard.reports", 3, locale=language),
            },
            headers={"Content-Language": language},
        )
```

The example accepts only `en` and `es`, defined as the languages supported by this application. `GET /greeting/es` returns `{"language":"es","greeting":"Hola Ada","reports":"3 informes"}`. An unsupported language produces a 404 before looking up translations.

The `locale=` argument selects the language for each call. The framework’s syntax validation rejects malformed locale codes, but does not require translation files to exist or your application to support the language. The endpoint therefore checks its own list.

## Constructor and method injection

Import the full contract from `orionis.localization.contracts.translator`. The provider already binds it to the shared instance: you do not need another binding to use the standard configuration.

Create `app/http/controllers/localized_report_controller.py`:

```python
from orionis.http import HTMLResponse, JSONResponse, Response, response
from orionis.http.base import BaseController
from orionis.localization.contracts.translator import ITranslator
from orionis.support.facades import View


class LocalizedReportController(BaseController):
    def __init__(self, translator: ITranslator) -> None:
        self.translator = translator

    async def show(self, language: str) -> Response:
        if language not in ("en", "es"):
            return response.text("Unsupported language", status_code=404)

        rendered: HTMLResponse = await View.make(
            "reports.localized",
            page_language=language,
            supported_languages=("en", "es"),
            title=self.translator.get("dashboard.title", locale=language),
            display_name="Ada",
            report_count=3,
        )
        rendered.setHeader("Content-Language", language)
        return rendered

    async def summary(
        self,
        language: str,
        translator: ITranslator,
    ) -> JSONResponse:
        if language not in ("en", "es"):
            return response.json({"error": "Unsupported language"}, status_code=404)

        return response.json(
            {
                "language": language,
                "title": translator.get("dashboard.title", locale=language),
                "reports": translator.choice("dashboard.reports", 3, locale=language),
            },
            headers={"Content-Language": language},
        )
```

In `show()`, the container constructs the controller and resolves `ITranslator` for `__init__()`. The dependency remains available as `self.translator`. In `summary()`, the container supplies `ITranslator` when invoking the action: `language` comes from the route, while `translator` is resolved by its type annotation.

These two forms access the same service; they do not create translators with independent locales. `show()` returns HTML and `summary()` returns JSON, but translation remains the same synchronous operation. The first method’s `await` belongs to view rendering.

Annotations do not inject dependencies when you call a method directly in Python. If you execute `controller.summary(...)` yourself, supply its arguments; automatic resolution happens when the container invokes it.

## Register the routes

Add these definitions to `routes/web.py`, preserving its existing routes:

```python
from app.http.controllers.localized_greeting_controller import LocalizedGreetingController
from app.http.controllers.localized_report_controller import LocalizedReportController
from orionis.support.facades import Route


Route.get("/greeting/{language:str}", LocalizedGreetingController)

Route.get(
    "/reports/{language:str}",
    [LocalizedReportController, "show"],
).name("localized.reports")

Route.get(
    "/report-summary/{language:str}",
    [LocalizedReportController, "summary"],
)
```

The file must be registered as `web` in your project’s routing configuration. The `localized.reports` name builds the language selector links. These endpoints do not change the shared locale: the route parameter only reaches the action.

You can check `/greeting/en`, `/greeting/es`, `/reports/en`, `/reports/es`, and `/report-summary/es`. With this supported-language list, `/reports/fr` returns 404. To expose the JSON endpoint as an API, register its definition in your API routes file and use the prefix configured there; the translator type does not depend on the route context.

## Translate from views

Create `resources/views/reports/localized.html`:

```html
<!doctype html>
<html lang="{{ page_language }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ title }}</title>
  </head>
  <body>
    <nav aria-label="Language">
      {% for code in locales() %}
        {% if code in supported_languages %}
          <a href="{{ route('localized.reports', language=code) }}"
             lang="{{ code }}"
             {% if code == page_language %}aria-current="page"{% endif %}>
            {{ code | upper }}
          </a>
        {% endif %}
      {% endfor %}
    </nav>

    <h1>{{ trans("dashboard.title", locale=page_language) }}</h1>
    <p>{{ __("dashboard.welcome", locale=page_language, name=display_name) }}</p>
    <p>{{ choice("dashboard.reports", report_count, locale=page_language) }}</p>
  </body>
</html>
```

At `/reports/es`, the title and heading display `Informes`, the greeting displays `Hola Ada`, and the last paragraph displays `3 informes`. The controller passes `page_language` for that render; each helper receives the value explicitly.

| Helper | Result | Use on this page |
|---|---|---|
| `trans(key, locale=None, **replace)` | Translated string. | Title with `trans("dashboard.title", locale=page_language)`. |
| `__(key, locale=None, **replace)` | Alias of the same callable as `trans`. | Greeting with `name=display_name`. |
| `choice(key, count, locale=None, **replace)` | Pluralized string. | Report quantity with `report_count`. |
| `locale()` | The translator’s shared active locale. | Inspect the default, rather than the language selected by this route. |
| `locales()` | Sorted tuple of locale codes with translation sources. | Enumerate discovered resources and filter by the supported list. |

All five helpers are synchronous functions. Use them normally with `{{ ... }}` in the asynchronous view environment; do not write `await` in Jinja. `trans` and `__` translate identically: choose a convention for your templates.

### Page language and application locale

`locale()` does not change when you pass `locale="es"` to a translation. For example, with `APP_LOCALE=en`, this fragment can display `en` even when the page has been translated into Spanish:

```html
<p>Application default: {{ locale() }}</p>
<p>Page language: {{ page_language }}</p>
```

Use a name such as `page_language` or `selected_language` for your context variable. Passing `locale=language` to `View.make()` creates a variable named `locale` that hides the global `locale()` function; it does not automatically select the helpers’ language.

The example selector uses the intersection of `locales()` and `supported_languages`. Finding a file for a locale does not guarantee that its messages are complete or that the product should enable that language.

### Variables, HTML, and escaping

Supply replacements as keyword arguments, such as `name=display_name`. The translator replaces text and returns `str`: it does not escape HTML or return `Markup`. Escaping happens later when that string is inserted into a template with autoescape enabled.

If `display_name` contains `<b>Ada</b>`, the greeting displays those tags as text rather than creating a bold element. Keep markup in the template and translate its text. Do not add `|safe` to messages containing user data; changing escaping affects the entire message. See [View configuration](/en/views/configuration-and-cache) for the `autoescape` setting.

## Select a language without changing other requests

The provider registers a single translator per application. `Lang.setLocale()` and `ITranslator.setLocale()` change its shared state, visible to other tasks in the process. Do not use them to select the language of a concurrent request.

In these examples, the action validates `language`, passes it as `locale=` to each translation, and supplies it as `page_language` to the render. The same rule applies if your application obtains a language from a user preference, header, or parameter: decide and validate that value in the application, then pass it explicitly.

Neither a route parameter’s name nor a client header selects the language of this code on its own. An explicit locale also does not change the configured fallback or create an automatic fallback chain between regional languages.

## Services and other entry points

Translation is not limited to HTTP. A service resolved by the application can receive `ITranslator` through its constructor or a method. The facade is also available within a booted application, even when the operation does not produce an HTTP response.

This example obtains a translated notification subject from an application task. Save it as `app/services/report_notification.py`:

```python
from orionis import Application
from orionis.localization.contracts.translator import ITranslator


class ReportNotification:
    def subject(
        self,
        translator: ITranslator,
        language: str,
        count: int,
    ) -> str:
        return translator.choice("dashboard.reports", count, locale=language)


async def build_notification_subject(app: Application) -> str:
    notification = await app.make(ReportNotification)
    return await app.call(
        notification,
        "subject",
        language="es",
        count=3,
    )
```

`build_notification_subject(app)` receives an already booted application and returns `3 informes` when awaited. `app.make()` obtains the service and `app.call()` invokes its method with `ITranslator`; `language` and `count` are supplied explicitly. Those container operations are asynchronous, while `translator.choice()` remains synchronous.

You can reuse the service in commands, tasks, or MCP components running through the application. Each entry point keeps its own execution and response APIs; you do not need to simulate an HTTP request to translate a message. When constructing the service manually, provide its dependencies or invoke it through the container as shown.

## Configuration scope

The facade, controllers, and views share configuration, the missing-key handler, and the translation cache within the same process. Choosing another access style does not isolate that state. Calls may read files on first access to a locale because the repository loads messages lazily.

To configure the initial locale and message location, continue with [Messages and locales](/en/localization/messages-and-locales).

---

[Localization](/en/localization) · [Messages and locales](/en/localization/messages-and-locales) · [Translating content](/en/localization/translating-content)
