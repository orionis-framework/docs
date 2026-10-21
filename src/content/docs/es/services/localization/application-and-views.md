---
title: "Fachada, inyección y vistas"
description: "Traduce desde controladores, servicios y plantillas con Lang e ITranslator, seleccionando el idioma sin alterar el estado de otras solicitudes."
editUrl: true
lastUpdated: false
---

La fachada `Lang`, el contrato `ITranslator` y los helpers de las vistas utilizan el mismo traductor configurado por la aplicación. Elige la forma de acceso que convenga a cada componente: la fachada para llamadas directas, la inyección para declarar dependencias y los helpers para traducir al renderizar HTML.

## Preparar los mensajes

Crea estos dos archivos JSON UTF-8. Si ya existen, incorpora las claves sin eliminar las demás. La ubicación parte de `app.language_path`; los ejemplos utilizan su valor predeterminado, `resources/lang/`.

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

Las claves resultantes son `dashboard.title`, `dashboard.welcome` y `dashboard.reports`. El traductor recibe el nombre de la clave, no la ruta del archivo. La estructura de archivos, el descubrimiento de idiomas y el fallback se explican en [Mensajes e idiomas](/es/services/localization/messages-and-locales); los reemplazos y plurales, en [Traducir contenido](/es/services/localization/translating-content).

## Usar la fachada Lang

Importa la fachada desde el módulo que la expone:

```python
from orionis.support.facades import Lang
```

Después del arranque de la aplicación, `Lang.get()` devuelve una cadena y `Lang.choice()` selecciona el mensaje plural. Ambas llamadas son síncronas: no llevan `await`, aunque el controlador sea asíncrono. La fachada requiere que el provider de localización haya iniciado; importar `Lang` en un script aislado no configura una aplicación.

Crea `app/http/controllers/localized_greeting_controller.py`:

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

El ejemplo acepta únicamente `en` y `es`, definidos como idiomas admitidos por esta aplicación. `GET /greeting/es` devuelve `{"language":"es","greeting":"Hola Ada","reports":"3 informes"}`. Un idioma no admitido produce 404 antes de consultar las traducciones.

El argumento `locale=` selecciona el idioma de cada llamada. La validación sintáctica del framework impide códigos malformados, pero no exige que el idioma tenga archivos ni que tu aplicación lo admita. Por eso el endpoint comprueba su propia lista.

## Inyección por constructor y por método

El contrato completo se importa desde `orionis.localization.contracts.translator`. El provider ya lo enlaza a la instancia compartida: no necesitas registrar otro binding para usar la configuración estándar.

Crea `app/http/controllers/localized_report_controller.py`:

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

En `show()`, el contenedor construye el controlador y resuelve `ITranslator` para `__init__()`. La dependencia queda disponible como `self.translator`. En `summary()`, el contenedor proporciona `ITranslator` al invocar la acción: el parámetro `language` procede de la ruta y `translator` se resuelve por su anotación de tipo.

Estas dos formas acceden al mismo servicio; no crean traductores con idiomas independientes. `show()` devuelve HTML y `summary()` JSON, pero la traducción sigue siendo la misma operación síncrona. El `await` del primer método corresponde al renderizado de la vista.

Las anotaciones no inyectan dependencias cuando llamas un método directamente en Python. Si ejecutas `controller.summary(...)` por tu cuenta, debes proporcionar sus argumentos; la resolución automática ocurre cuando interviene el contenedor.

## Registrar las rutas

Agrega estas definiciones a `routes/web.py` conservando sus rutas existentes:

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

El archivo debe estar registrado como `web` en la configuración de rutas de tu proyecto. El nombre `localized.reports` permite construir los enlaces del selector de idioma. Estos endpoints no cambian el locale compartido: el parámetro de ruta únicamente llega a la acción.

Puedes comprobar `/greeting/en`, `/greeting/es`, `/reports/en`, `/reports/es` y `/report-summary/es`. La ruta `/reports/fr` devuelve 404 con esta lista de idiomas. Para exponer el endpoint JSON como API, registra su definición en tu archivo de rutas API y utiliza el prefijo configurado allí; el tipo de traductor no depende del contexto de la ruta.

## Traducir desde las vistas

Crea `resources/views/reports/localized.html`:

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

En `/reports/es`, el título y el encabezado muestran `Informes`, el saludo muestra `Hola Ada` y el último párrafo muestra `3 informes`. El controlador pasa `page_language` para ese renderizado; cada helper recibe ese valor de forma explícita.

| Helper | Resultado | Uso en esta página |
|---|---|---|
| `trans(key, locale=None, **replace)` | Cadena traducida. | Título mediante `trans("dashboard.title", locale=page_language)`. |
| `__(key, locale=None, **replace)` | Alias del mismo callable de `trans`. | Saludo con `name=display_name`. |
| `choice(key, count, locale=None, **replace)` | Cadena pluralizada. | Cantidad de informes con `report_count`. |
| `locale()` | Locale activo compartido del traductor. | Consultar el valor predeterminado, no el idioma seleccionado por esta ruta. |
| `locales()` | Tupla ordenada de códigos con fuentes de traducción. | Enumerar recursos descubiertos y filtrar por la lista admitida. |

Los cinco helpers son funciones síncronas. Se utilizan normalmente con `{{ ... }}` dentro del entorno asíncrono de vistas; no se escribe `await` en Jinja. `trans` y `__` traducen del mismo modo: elige una convención para tus plantillas.

### Idioma de la página frente al locale de la aplicación

`locale()` no cambia cuando pasas `locale="es"` a una traducción. Por ejemplo, con `APP_LOCALE=en`, este fragmento puede mostrar `en` aunque la página se haya traducido al español:

```html
<p>Application default: {{ locale() }}</p>
<p>Page language: {{ page_language }}</p>
```

Usa un nombre como `page_language` o `selected_language` para tu variable de contexto. Pasar `locale=language` a `View.make()` crearía una variable llamada `locale` que oculta la función global `locale()`; no selecciona automáticamente el idioma de los helpers.

El selector del ejemplo usa la intersección entre `locales()` y `supported_languages`. Encontrar un archivo para un idioma no garantiza que sus mensajes estén completos ni que ese idioma deba estar habilitado para el producto.

### Variables, HTML y escape

Los reemplazos se proporcionan como argumentos nombrados, por ejemplo `name=display_name`. El traductor sustituye texto y devuelve `str`: no escapa HTML ni devuelve `Markup`. El escape se aplica después al insertar esa cadena en una plantilla con autoescape habilitado.

Si `display_name` contiene `<b>Ada</b>`, el saludo se muestra como texto con esas etiquetas, no como un elemento en negrita. Conserva las etiquetas en la plantilla y traduce sus textos. No añadas `|safe` a mensajes que contienen datos de usuarios; cambiar el escape afecta al mensaje completo. Consulta [Configuración de vistas](/es/services/views/configuration-and-extensions) para el ajuste `autoescape`.

## Seleccionar el idioma sin alterar otras solicitudes

El provider registra un único traductor por aplicación. `Lang.setLocale()` e `ITranslator.setLocale()` modifican su estado compartido, visible para las demás tareas del proceso. No los uses para seleccionar el idioma de una solicitud concurrente.

En los ejemplos, la acción valida `language` y lo pasa como `locale=` a cada traducción y como `page_language` al renderizado. La misma regla se aplica si tu aplicación obtiene el idioma de una preferencia de usuario, un encabezado o un parámetro: decide y valida ese valor en la aplicación, luego pásalo de forma explícita.

Ni el nombre del parámetro de ruta ni un encabezado del cliente seleccionan por sí solos el idioma de este código. Además, pasar un locale explícito no cambia el fallback configurado ni crea una cadena automática entre idiomas regionales.

## Servicios y otros puntos de entrada

La traducción no está limitada a HTTP. Un servicio resuelto por la aplicación puede recibir `ITranslator` por constructor o por método. La fachada también está disponible dentro de una aplicación iniciada, aunque la operación no produzca una respuesta HTTP.

Este ejemplo permite obtener un asunto traducido desde una tarea de aplicación. Guárdalo en `app/services/report_notification.py`:

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

`build_notification_subject(app)` recibe una aplicación ya iniciada y devuelve `3 informes` cuando se espera su resultado. `app.make()` obtiene el servicio y `app.call()` invoca el método proporcionando `ITranslator`; `language` y `count` se pasan explícitamente. Esas operaciones del contenedor son asíncronas, mientras que `translator.choice()` sigue siendo síncrona.

Puedes reutilizar el servicio en comandos, tareas o componentes MCP que se ejecuten mediante la aplicación. Cada punto de entrada mantiene su propia API de ejecución y respuesta; no es necesario simular una petición HTTP para traducir un mensaje. Al construir el servicio manualmente, proporciona sus dependencias o invócalo mediante el contenedor como en el ejemplo.

## Alcance de la configuración

La fachada, los controladores y las vistas comparten configuración, handler de claves ausentes y caché de traducciones del mismo proceso. Elegir otro estilo de acceso no aísla ese estado. Las llamadas pueden leer archivos en el primer acceso a un idioma porque el repositorio carga los mensajes de forma perezosa.

Para configurar el locale inicial y la ubicación de los mensajes, continúa en [Mensajes e idiomas](/es/services/localization/messages-and-locales).

---

[Traducciones](/es/services/localization) · [Mensajes e idiomas](/es/services/localization/messages-and-locales) · [Traducir contenido](/es/services/localization/translating-content)

