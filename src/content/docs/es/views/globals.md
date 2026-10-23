---
title: "Globals y contexto de las vistas"
description: "Todos los globals de Orionis y Jinja, con ejemplos y los requisitos de contexto de cada helper."
editUrl: true
lastUpdated: false
---

Los globals son nombres disponibles en todas las plantillas sin pasarlos desde cada controlador. Orionis registra funciones para consultar servicios y un objeto `errors` para errores de formulario. Jinja aporta además seis utilidades de plantilla.

El entorno es asíncrono: escribe `{{ asset("css/app.css") }}` y Jinja espera su resultado. No escribas `await` dentro de una plantilla. Una función global se invoca con `()`; por ejemplo, `request()` obtiene la solicitud, mientras que `request` es la función. La excepción es `errors`, que ya es una bolsa con métodos.

## Variables del controlador y contexto compartido

Pasa los datos propios de cada página desde el controlador:

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

En `resources/views/dashboard/index.html`:

```html
<h1>{{ page_title }}</h1>
<p>{{ stats.open }} open / {{ stats.closed }} closed</p>
<footer>{{ config("app.name", "Demo") }}</footer>
```

`page_title` y `stats` pertenecen a ese renderizado. Un global registrado en un provider pertenece al entorno compartido; no guardes allí el usuario de una petición. Los helpers consultan sus servicios al invocarse, según los contratos que estén registrados en el scope. La solicitud y la sesión tienen requisitos distintos, descritos más adelante. Evita nombres de contexto como `request`, `config` o `errors`, que ocultarían los helpers del mismo nombre.

## Aplicación, configuración y caché

### app()

Devuelve la instancia de aplicación. Permite acceder a su API cuando necesitas algo que no cubre un helper más específico; mantén la preparación de datos y operaciones de negocio en controladores o servicios.

```html
<small>{{ app().config("app.name") }}</small>
```

### config(key, default=None)

Lee una clave de configuración con notación de puntos. Si su valor es `None`, devuelve el valor predeterminado; valores como `False`, `0` o una cadena vacía se conservan.

```html
<title>{{ config("app.name", "Demo") }}</title>
```

### cache(key, default=None)

Lee un valor mediante el administrador de caché de la aplicación. Si el resultado es `None`, devuelve `default`. No escribe datos ni ejecuta automáticamente un productor de caché.

```html
<p>Published reports: {{ cache("reports:published", 0) }}</p>
```

Prepara o actualiza ese valor desde tu aplicación. Si necesitas varias lecturas costosas, resuélvelas antes de renderizar en vez de repetirlas dentro de un bucle.

## URLs, rutas y archivos públicos

### url(path="/", **query) y secure_url(path="/", **query)

Construyen enlaces a partir de un path. Anteponen `baseUrl` únicamente si el contenedor puede resolver `IRequest`; de lo contrario devuelven el path normalizado. El kernel HTTP registra la solicitud bajo `Request`, sin registrar automáticamente `IRequest`, por lo que en la configuración predeterminada estos enlaces son relativos al origen. Los argumentos adicionales se codifican como query string, incluidas listas. Las URLs absolutas HTTP(S) y las que empiezan por `//` conservan su origen.

```html
<a href="{{ url('/reports', page=2, status='open') }}">Reports</a>
<a href="{{ secure_url('/account') }}">Account over HTTPS</a>
```

`secure_url` cambia `http://` o `//` a `https://` si hay host. Si el resultado es `/account`, permanece relativo aunque se esté atendiendo una petición HTTP; el helper no configura HTTPS ni inventa un dominio.

### route(name, **params)

Genera la URL de una ruta registrada con `.name()`. Los parámetros usados por el path se codifican como segmentos; los restantes se convierten en query string. Registra primero una ruta en `routes/web.py`, por ejemplo:

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

Con la configuración predeterminada se genera `/reports/7?tab=history`, que el navegador resuelve en el origen de la página. Solo se antepone `baseUrl` si tu aplicación proporciona un `IRequest` resoluble; por ejemplo, con ese contrato y el origen `http://localhost:8000`, el resultado sería `http://localhost:8000/reports/7?tab=history`. Una ruta inexistente o un parámetro obligatorio ausente produce `ViewRouteException`; no hay sustitución silenciosa.

### asset(path, disk=None) y secure_asset(path, disk=None)

Piden la URL del archivo al sistema de almacenamiento: `storage.disk(disk or "public").file(path).url()`. El path es relativo a la raíz del disco, no a `resources/views` ni al directorio del proyecto.

```html
<link rel="stylesheet" href="{{ asset('css/app.css') }}">
<img src="{{ secure_asset('brand/logo.png', disk='public') }}" alt="Demo">
```

Estos ejemplos requieren que los archivos estén disponibles en el disco `public` y que su configuración permita URLs públicas. Los helpers no comprueban existencia, no suben archivos ni crean enlaces públicos. `secure_asset` reescribe el esquema de la URL cuando conoce su host. Consulta [Storage](/es/storage) para publicar y obtener archivos mediante la fachada `Storage`.

## Solicitud, sesión y autenticación

### request()

Intenta resolver `IRequest` y devuelve `None` si no está disponible. El kernel registra la solicitud HTTP como `Request`, no como `IRequest`; por tanto, una petición HTTP normal no garantiza que este global devuelva una solicitud. El siguiente fragmento contempla esa ausencia:

```html
{% set current_request = request() %}
{% if current_request is not none %}
  <small>{{ current_request.method }} {{ current_request.path }}</small>
{% endif %}
```

Para mostrar información de la petición sin depender de ese contrato, inyecta `Request` en el controlador y pasa los datos necesarios con nombres propios. Crea `app/http/controllers/request_context_controller.py`:

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

Regístralo en `routes/web.py`:

```python
from app.http.controllers.request_context_controller import RequestContextController
from orionis.support.facades import Route


Route.get("/request-context", RequestContextController)
```

En `resources/views/pages/request-context.html`:

```html
<small>{{ request_info.method }} {{ request_info.path }}</small>
```

`GET /request-context` muestra `GET /request-context`. El nombre `request_info` conserva disponible el global `request`; prepara los payloads y validaciones en el controlador.

### session()

Devuelve la sesión activa o `None` cuando el servicio no está disponible. En rutas WEB, el middleware de sesión proporciona este contexto; una ruta API no adquiere sesión por el hecho de renderizar HTML.

```html
{% set current_session = session() %}
{% if current_session is not none %}
  <p>Theme: {{ current_session.get("theme", "light") }}</p>
{% endif %}
```

### auth()

Devuelve la fachada de autenticación. Sus llamadas consultan la identidad del contexto activo, no una identidad guardada en la plantilla. Comprueba el estado antes de acceder al usuario:

```html
{% if auth().check() %}
  <p>Account: {{ auth().user().getAuthIdentifier() }}</p>
{% elif auth().guest() %}
  <a href="{{ url('/login') }}">Sign in</a>
{% endif %}
```

El ejemplo usa el contrato de identidad; propiedades adicionales como `name` dependen del modelo de tu aplicación. Mostrar u ocultar un enlace no sustituye la autorización del endpoint. Consulta [Autenticación](/es/authentication) para configurar la resolución del usuario.

## Formularios, mensajes y CSRF

### old(key, default=None)

Recupera entrada anterior guardada con `withInput()`. No lee los mensajes flash ni los errores. Si el valor resultante es `None`, devuelve una cadena vacía.

```html
<label for="email">Email</label>
<input id="email" name="email" type="email" value="{{ old('email', '') }}">
```

### flash(key, default=None)

Lee un mensaje temporal escrito con `withFlash()`. Si no existe sesión o falta la clave, devuelve `default`. También puede leer un valor escrito durante la misma solicitud.

```html
{% set status = flash("status") %}
{% if status is not none %}
  <p role="status">{{ status }}</p>
{% endif %}
```

### errors

Es una bolsa de errores guardados con `withErrors()`, no una función ni un diccionario. Sus cinco métodos son asíncronos, esperados automáticamente por Jinja:

- `any()` indica si hay mensajes.
- `has(field)` indica si un campo tiene mensajes.
- `get(field)` devuelve la lista del campo.
- `first(field=None)` devuelve el primer mensaje del campo o de toda la bolsa.
- `all()` devuelve el diccionario completo de listas por campo.

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

Sin sesión disponible, la bolsa se comporta como vacía: `all()` devuelve `{}`, `get()` devuelve `[]`, `first()` devuelve `""` y los métodos booleanos devuelven `False`.

### csrf_token() y csrf_field()

`csrf_token()` obtiene el token de la sesión usando la clave `http.csrf.session_key`, o `_csrf_token` si no se configura. `csrf_field()` construye un `<input>` oculto cuyo nombre es `_csrf`; devuelve `Markup` y escapa el token. No añadas `|safe`.

```html
<meta name="csrf-token" content="{{ csrf_token() }}">
<form method="post" action="{{ url('/profile') }}">
  {{ csrf_field() }}
  <input name="display_name" value="{{ old('display_name', '') }}">
  <button type="submit">Save</button>
</form>
```

Ambas funciones necesitan que el servicio de sesión pueda resolverse. Si la sesión existe pero todavía no tiene token, el valor es vacío; los helpers no generan uno por su cuenta. El middleware CSRF de WEB emite y valida el token. La extensión `{% csrf %}` es equivalente a `{{ csrf_field() }}`; su funcionamiento se detalla en [Providers y extensiones](/es/views/providers-and-extensions).

El flujo de guardado de entrada, errores y mensajes se muestra completo en [Renderizar vistas](/es/views/rendering-templates).

## Traducciones y locales

### trans(key, locale=None, **replace) y __(…)

`trans` traduce una clave y sustituye placeholders `:name` con argumentos nombrados. `__` es exactamente el mismo callable registrado con otro nombre. Si no existe traducción, el traductor devuelve la clave, después de consultar el locale de fallback.

Para un ejemplo reproducible, crea `resources/lang/en/messages.json`:

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

Selecciona un segmento plural según la cantidad. La línea anterior incluye casos exactos y un rango; `:count` está disponible automáticamente.

```html
<p>{{ choice("messages.reports", 0, locale="en") }}</p>
<p>{{ choice("messages.reports", 3, locale="en") }}</p>
```

El resultado es `No reports` y `3 reports`. Pasa una cantidad numérica; la función no convierte cadenas a números.

### locale() y locales()

`locale()` devuelve el locale activo del traductor. `locales()` devuelve una tupla ordenada de locales con archivos de traducción detectados.

```html
<p>Active language: {{ locale() }}</p>
<ul>
  {% for code in locales() %}
    <li>{{ code }}</li>
  {% endfor %}
</ul>
```

El traductor es compartido; para seleccionar un idioma por llamada, pasa `locale=` a `trans` o `choice`. Consulta [Traducciones](/es/localization) para la estructura y carga de archivos.

## Colecciones, cadenas y fechas

### collect(value=None)

Devuelve una `Collection`: `None` produce una colección vacía, las listas se utilizan como elementos y otros iterables se materializan. Las cadenas se conservan como un solo elemento.

```html
<p>{{ collect(["api", "web"]).count() }} modules</p>
<p>{{ collect("api").count() }} item</p>
```

### stringable(value="")

Devuelve un `Stringable` para encadenar transformaciones de texto. Si ya recibe uno, conserva esa instancia.

```html
<p>{{ stringable("Hello Orionis").slug() }}</p>
<p>{{ stringable("orionis").upper() }}</p>
```

Los resultados son `hello-orionis` y `ORIONIS`.

### now() y today()

`now()` devuelve la fecha y hora actuales de `DateTime`; `today()` devuelve el inicio del día. Utilizan la zona horaria configurada para esa fachada. El objeto permite formatear sin preparar cada texto en el controlador:

```html
<time>{{ now().to_iso8601_string() }}</time>
<p>Report date: {{ today().to_date_string() }}</p>
```

## Cifrado y diagnóstico

### encrypt(plaintext) y decrypt(payload)

Resuelven `IEncrypter` y usan el cifrado y la clave configurados en la aplicación. Son operaciones reversibles de cifrado, no hashing de contraseñas.

```html
{% set encrypted_reference = encrypt("report:7") %}
<code>{{ encrypted_reference }}</code>
<p>{{ decrypt(encrypted_reference) }}</p>
```

El segundo resultado es `report:7`. `decrypt` necesita un payload válido y la clave correspondiente; los errores de cifrado se propagan. La autorización de una operación debe comprobarse en el servidor aunque la referencia esté cifrada.

### dump(*values)

Genera una representación HTML de diagnóstico con `VarDumper` y la devuelve como `Markup`; no necesita `|safe`. La implementación también imprime el volcado en la consola del proceso. Utilízalo de manera temporal con datos que puedas exponer en esa página y sus logs.

```html
{{ dump({"report_id": 7, "status": "ready"}, ["api", "web"]) }}
```

### framework_version() y python_version()

Devuelven las versiones del framework instalado y del intérprete en ejecución. Son útiles para una página interna de diagnóstico.

```html
<p>Orionis: {{ framework_version() }}</p>
<p>Python: {{ python_version() }}</p>
```

## Utilidades estándar incluidas por Jinja

Estas seis utilidades no resuelven servicios Orionis y también están disponibles por defecto.

### range(start, stop=None, step=1)

Produce una secuencia de enteros; con un solo argumento empieza en cero y excluye el límite final. Úsala para controles o posiciones repetidas.

```html
{% for page in range(1, 4) %}
  <a href="{{ url('/reports', page=page) }}">{{ page }}</a>
{% endfor %}
```

### dict(**items)

Crea un diccionario con argumentos nombrados cuando necesitas preparar una estructura pequeña dentro de la plantilla.

```html
{% set badge = dict(label="Ready", color="green") %}
<span class="{{ badge.color }}">{{ badge.label }}</span>
```

### cycler(*items)

Alterna valores incluso entre varios bucles. El objeto expone `next()`, `current` y `reset()`.

```html
{% set rows = cycler("odd", "even") %}
{% for name in ["Ada", "Lin", "Sam"] %}
  <p class="{{ rows.next() }}">{{ name }}</p>
{% endfor %}
```

### joiner(sep=", ")

Devuelve una cadena vacía en la primera llamada y el separador en las siguientes. Úsalo para separar fragmentos condicionales sin comas iniciales o finales.

```html
{% set separator = joiner(" / ") %}
{% for label in ["API", "WEB"] %}{{ separator() }}{{ label }}{% endfor %}
```

### namespace(**items)

Permite conservar valores modificados dentro de un bucle y consultarlos después; una asignación simple con `set` dentro de un bucle no tiene ese alcance.

```html
{% set summary = namespace(total=0) %}
{% for quantity in [2, 3, 4] %}
  {% set summary.total = summary.total + quantity %}
{% endfor %}
<p>Total: {{ summary.total }}</p>
```

### lipsum(n=5, html=True, min=20, max=100)

Genera párrafos de texto aleatorio para maquetas. El ejemplo desactiva HTML para obtener texto normal; no depende de traducciones ni de contenido de la aplicación.

```html
<p>{{ lipsum(n=1, html=false, min=5, max=8) }}</p>
```

## Crear globals propios

Registra valores o callables en un provider mediante `IViewEnvironment.addGlobal()`. Un callable asíncrono también se espera automáticamente. Consulta [Providers y extensiones](/es/views/providers-and-extensions) para un ejemplo completo con registro en la aplicación; conserva el estado específico de una solicitud en sus servicios y contexto.

---

[Vistas](/es/views) · [Filtros](/es/views/filters) · [Renderizar vistas](/es/views/rendering-templates)
