---
title: "Creating and starting an application"
description: "Start with the application created by Installation and your first project. Run commands from its root, where reactor, bootstrap/, config/, and uv.lock are located."
editUrl: true
lastUpdated: false
---

Start with the application created by [Installation and your first project](/en/getting-started/installation). Run commands from its root, where `reactor`, `bootstrap/`, `config/`, and `uv.lock` are located.

## Start the generated application

For a new local Blank project:

```bash
uvx --python 3.14 --from orionis-installer orionis new blog --no-interaction --no-migrate
cd blog
uv run python -B reactor serve
```

If you already created `blog`, continue from `cd blog` instead of running `new` again. The installer prepares the environment and application key; `serve` starts the HTTP server. Check [the health route](http://127.0.0.1:8000/up); Blank does not initially register a welcome page at `/`. Stop it with Ctrl+C. If the port is busy, use `uv run python -B reactor serve --port 8001`.

The SSR stack also includes authentication, profile, and administration views. Prepare its database tables before using those features:

```bash
cd portal
uv run python -B reactor migrate
uv run python -B reactor serve
```

This assumes `portal` was created with `--stack ssr`. `reactor migrate` applies the schema without seeders. The installer's `--migrate` option requests `reactor migrate --seed`; review the skeleton's administrative seeder before choosing that option. See [migrations and initial data](/en/getting-started/installation#migrations-and-initial-data).

## Follow the bootstrap

The generated `bootstrap/app.py` constructs `Application` with the project's root, configures bootstrap caching, registers route files, providers and other components, and calls `create()`. The `reactor` script imports that instance and uses `Loop.run` to execute `app.handleCommand(sys.argv)`. The server exposes the same application through its HTTP protocol.

Edit web routes in `routes/web.py`, configuration in `config/`, and templates in `resources/views/`. Continue with [Application lifecycle](/en/getting-started/application-lifecycle), [Typed configuration](/en/getting-started/configuration), and [Directories and bootstrap caching](/en/getting-started/paths-and-caching) to understand how changes affect startup.

## Add your first JSON route

Add this complete declaration to `routes/web.py`, keeping the existing routes:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Route

async def hello() -> JSONResponse:
    return JSONResponse({"message": "Hello, Orionis!"})

Route.get("/hello", hello).public()
```

From the project root, inspect registration with `uv run python -B reactor route:list`. Restart the server if necessary, then open [http://127.0.0.1:8000/hello](http://127.0.0.1:8000/hello). The expected body is `{"message":"Hello, Orionis!"}` with status 200. If compiled metadata still contains older routes, follow [cache invalidation](/en/getting-started/paths-and-caching).

This public GET endpoint demonstrates route registration and a JSON response. For protected endpoints, input validation, controllers, and route groups, continue with [HTTP routing](/en/http/routing).

## Explore the Application API in isolation

Orionis combines a service container, typed configuration, and HTTP and CLI kernels around an asynchronous runtime. Its entry point is an `Application` instance: constructing it does not start a server. This example uses a temporary root to demonstrate configuration independently of an application skeleton. Its fixed key is only for testing; use a private random key in an actual application.

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

Run the example in a separate Python process with Orionis installed. It demonstrates configuration, creation, runtime changes, and reset; it does not launch an HTTP server. Do not put its temporary root or fixed test key into the generated application's bootstrap.

## Reference and next steps

[application.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/application.py) · [pyproject.toml](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/pyproject.toml)

[Return to the module index](/en/getting-started).
