---
title: "Creating and starting an application"
description: "Install your Orionis project, start its development server, and open the application in your browser."
editUrl: true
lastUpdated: false
---

## 1. Install the project

Follow [Installation and your first project](/en/getting-started/installation) and complete the installation before continuing.

## 2. Start the development server

From the generated project root, start the server in the project environment.

```bash
uv run python -B reactor serve
```

If the project environment is already active, the installed `orionis serve` command starts the same server.

## 3. Open the application

Open the URL shown in the console. The default address is [http://localhost:8000](http://localhost:8000); if the server reports a different address, use that one.

:::note[Migrations and seeders]
Migrations prepare the database schema; seeders insert initial data. Run migrations when the application's features require database tables, and seeders when you need their initial data. Review [Migrations and initial data](/en/getting-started/installation#migrations-and-initial-data) before running them.
:::

## Return JSON from a controller

In a project with HTTP routes, create `app/http/controllers/greeting_controller.py`. The controller receives the configured application through its action parameter.

```python
from orionis import IApplication
from orionis.http import JSONResponse


class GreetingController:
    async def show(self, app: IApplication) -> JSONResponse:
        return JSONResponse({"message": "Hello", "app": app.config("app.name")})
```

In the web route file registered with `withRouting(web=...)`, usually `routes/web.py`, add this route at module level. Restart the development server after saving both files.

```python
from app.http.controllers.greeting_controller import GreetingController
from orionis.support.facades import Route

Route.get("/greeting", [GreetingController, "show"])
```

Open `/greeting` on the local server. The JSON object contains `"message": "Hello"` and the application name from `config/app.py`. The container supplies `IApplication` when it invokes the action. Continue with [route parameters and named routes](/en/http/routing) or [validating request data](/en/validation/controllers-and-http).
