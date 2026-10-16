---
title: "Crear y arrancar una aplicación"
description: "Comienza con la aplicación creada en Instalación y primer proyecto. Ejecuta los comandos desde su raíz, donde están reactor, bootstrap/, config/ y uv.lock."
editUrl: true
lastUpdated: false
---

Comienza con la aplicación creada en [Instalación y primer proyecto](/es/getting-started/installation). Ejecuta los comandos desde su raíz, donde están `reactor`, `bootstrap/`, `config/` y `uv.lock`.

## Arrancar la aplicación generada

Para un proyecto local nuevo con Blank:

```bash
uvx --python 3.14 --from orionis-installer orionis new blog --no-interaction --no-migrate
cd blog
uv run python -B reactor serve
```

Si ya creaste `blog`, continúa desde `cd blog` en lugar de ejecutar `new` otra vez. El instalador prepara el entorno y la clave de aplicación; `serve` inicia el servidor HTTP. Comprueba [la ruta de salud](http://127.0.0.1:8000/up); Blank no registra una página de bienvenida en `/`. Detén el servidor con Ctrl+C. Si el puerto está ocupado, usa `uv run python -B reactor serve --port 8001`.

El stack SSR también incluye vistas de autenticación, perfil y administración. Prepara sus tablas antes de utilizar esas funciones:

```bash
cd portal
uv run python -B reactor migrate
uv run python -B reactor serve
```

Esto supone que creaste `portal` con `--stack ssr`. `reactor migrate` aplica el esquema sin seeders. La opción `--migrate` del instalador solicita `reactor migrate --seed`; revisa el seeder administrativo del esqueleto antes de elegirla. Consulta [migraciones y datos iniciales](/es/getting-started/installation#migraciones-y-datos-iniciales).

## Seguir el arranque

El archivo generado `bootstrap/app.py` construye `Application` con la raíz del proyecto, configura la caché de arranque, registra archivos de rutas, proveedores y otros componentes, y llama a `create()`. El script `reactor` importa esa instancia y usa `Loop.run` para ejecutar `app.handleCommand(sys.argv)`. El servidor expone la misma aplicación mediante su protocolo HTTP.

Edita las rutas web en `routes/web.py`, la configuración en `config/` y las plantillas en `resources/views/`. Continúa con [Ciclo de vida](/es/getting-started/application-lifecycle), [Configuración tipada](/es/getting-started/configuration) y [Directorios y caché de arranque](/es/getting-started/paths-and-caching) para comprender cómo afectan los cambios al arranque.

## Añadir tu primera ruta JSON

Añade esta declaración completa en `routes/web.py` y conserva las rutas existentes:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Route

async def hello() -> JSONResponse:
    return JSONResponse({"message": "Hello, Orionis!"})

Route.get("/hello", hello).public()
```

Desde la raíz del proyecto, comprueba el registro con `uv run python -B reactor route:list`. Reinicia el servidor si hace falta y abre [http://127.0.0.1:8000/hello](http://127.0.0.1:8000/hello). El cuerpo esperado es `{"message":"Hello, Orionis!"}` con estado 200. Si los metadatos compilados conservan rutas anteriores, sigue el [flujo de invalidación de caché](/es/getting-started/paths-and-caching).

Este endpoint GET público demuestra el registro de rutas y una respuesta JSON. Para endpoints protegidos, validación de entradas, controladores y grupos de rutas, continúa con [routing HTTP](/es/http/routing).

## Explorar la API de Application de forma aislada

Orionis reúne un contenedor de servicios, configuración tipada y kernels HTTP y CLI sobre un runtime asíncrono. El punto de entrada es una instancia de `Application`: construirla no inicia un servidor. El ejemplo usa una raíz temporal para mostrar la configuración sin depender del esqueleto de una aplicación. La clave fija es exclusivamente de prueba; utiliza una clave aleatoria privada en una aplicación real.

```python
import base64
from pathlib import Path
from tempfile import TemporaryDirectory
from orionis import Application
from orionis.environment import Env


class DocsApplication(Application):
    pass


key = "base64:" + base64.b64encode(b"k" * 32).decode()
Env.set("APP_KEY", key, only_os=True)
try:
    with TemporaryDirectory() as directory:
        app = DocsApplication(Path(directory))
        app.withConfigApp(
            name="Docs",
            env="testing",
            debug=False,
            key=key,
            cipher="AES-256-CBC",
        ).withConfigPaths(storage="var")
        app.create()
        assert app.isCreated and DocsApplication.current() is app
        assert app.config("app.name") == "Docs"
        assert app.path("storage") == (Path(directory) / "var").resolve()
        app.config("app.name", "Runtime Docs")
        assert app.config("app.name") == "Runtime Docs"
        app.resetRuntimeConfig()
        assert app.config("app.name") == "Docs"
        print(app.config("app.name"), app.routeHealthCheck)
finally:
    Env.unset("APP_KEY", only_os=True)
```

Ejecuta el ejemplo en un proceso de Python separado que tenga Orionis instalado. Demuestra configuración, creación, cambios en ejecución y restablecimiento; no inicia un servidor HTTP. No incorpores su raíz temporal ni su clave fija de prueba al arranque de la aplicación generada.

## Referencia y próximos pasos

[application.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/application.py) · [pyproject.toml](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/pyproject.toml)

[Volver al índice del módulo](/es/getting-started).
