---
title: "Crear y arrancar una aplicación"
description: "Completa la instalación, inicia el servidor de desarrollo y abre tu aplicación Orionis en el navegador."
editUrl: true
lastUpdated: false
---

## 1. Instalar el proyecto

Completa primero el [manual de instalación](/es/getting-started/installation) para crear tu proyecto de Orionis Framework. Una vez finalizado el proceso, continúa con los pasos siguientes.

## 2. Iniciar el servidor de desarrollo

Desde la raíz del proyecto generado, inicia el servidor con el entorno del proyecto.

```bash
uv run python -B reactor serve
```

Si ya activaste el entorno del proyecto, el comando instalado `orionis serve` inicia el mismo servidor.

## 3. Acceder a la aplicación

Abre tu navegador y accede a la URL local que aparece en la consola. Por defecto, la dirección es [http://localhost:8000](http://localhost:8000). Si la consola muestra una dirección diferente, utiliza esa dirección.

:::note[Migraciones y seeders]
Las migraciones preparan la estructura de la base de datos y los seeders cargan datos iniciales. Pueden necesitarse antes de utilizar funciones que dependan de esas tablas o datos. Consulta [migraciones y datos iniciales](/es/getting-started/installation#migraciones-y-datos-iniciales) en el manual de instalación.
:::

## Devolver JSON desde un controlador

En un proyecto con rutas HTTP, crea `app/http/controllers/greeting_controller.py`. El controlador recibe la aplicación configurada en el parámetro de su acción.

```python
from orionis import IApplication
from orionis.http import JSONResponse


class GreetingController:
    async def show(self, app: IApplication) -> JSONResponse:
        return JSONResponse({"message": "Hello", "app": app.config("app.name")})
```

En el archivo de rutas web registrado con `withRouting(web=...)`, normalmente `routes/web.py`, añade esta ruta en el nivel del módulo. Reinicia el servidor de desarrollo tras guardar ambos archivos.

```python
from app.http.controllers.greeting_controller import GreetingController
from orionis.support.facades import Route

Route.get("/greeting", [GreetingController, "show"])
```

Abre `/greeting` en el servidor local. El objeto JSON contiene `"message": "Hello"` y el nombre de la aplicación configurado en `config/app.py`. El contenedor proporciona `IApplication` al invocar la acción. Continúa con [parámetros y nombres de rutas](/es/http/routing) o con la [validación de datos de la petición](/es/validation/controllers-and-http).
