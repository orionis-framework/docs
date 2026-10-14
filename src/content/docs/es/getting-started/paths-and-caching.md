---
title: "Directorios y caché de arranque"
description: "Usa el registro de rutas para que un servicio no dependa del directorio actual del proceso. Directory ofrece nombres de métodos para ese mismo registro. La compilación guarda…"
editUrl: true
lastUpdated: false
---

Usa el registro de rutas para que un servicio no dependa del directorio actual del proceso. `Directory` ofrece nombres de métodos para ese mismo registro. La compilación guarda metadatos de arranque: no compila Python ni reemplaza la gestión de despliegues. `compile(...)` devuelve `None`; debe llamarse en una instrucción independiente antes de `create()`.

## Ejemplos

### Usar los directorios configurados de la aplicación

Este fragmento de manejador recibe por inyección la aplicación existente. Devuelve el directorio configurado de vistas, sin construir otra aplicación ni depender del directorio actual del proceso.

```python
from pathlib import Path
from orionis.foundation.contracts.application import IApplication
from orionis.foundation.directory import Directory

async def views_directory(app: IApplication) -> Path:
    directory = Directory(app)
    return directory.resourcesViews()
```

El resultado predeterminado es `<proyecto>/resources/views`. También puedes usar directamente `app.path("resources_views")`. Tras crear la aplicación, las rutas nombradas son absolutas; una clave desconocida devuelve `None`.

| Clave de ruta | Directorio predeterminado | Código de aplicación |
|---|---|---|
| `app_http_controllers` | `app/http/controllers` | Manejadores de solicitudes. |
| `app_models` | `app/models` | Modelos ORM. |
| `app_providers` | `app/providers` | Registro de servicios. |
| `resources_views` | `resources/views` | Plantillas Jinja. |
| `database_migrations` | `database/migrations` | Cambios del esquema. |
| `storage_logs` | `storage/logs` | Archivos de logs. |
| `tests` | `tests` | Pruebas de aplicación. |

### Configurar bootstrap compilado

```python
import base64
from pathlib import Path
from tempfile import TemporaryDirectory
from orionis import Application
from orionis.environment import Env


class CachedApplication(Application):
    pass


key = "base64:" + base64.b64encode(b"c" * 32).decode()
Env.set("APP_KEY", key, only_os=True)
try:
    with TemporaryDirectory() as directory:
        root = Path(directory)
        (root / "config").mkdir()
        (root / ".env").touch()
        app = CachedApplication(root)
        app.compile("bootstrap/cache", ["config", ".env"])
        app.withConfigApp(key=key)
        app.create()
        assert app.compiled
        assert app.compiledPath == (root / "bootstrap/cache").resolve()
        assert (root / "config").resolve() in app.compiledInvalidationPathsDirs
        assert (root / ".env").resolve() in app.compiledInvalidationPathsFiles
        print("compiled cache configured")
finally:
    Env.unset("APP_KEY", only_os=True)
```

## Actualizar la caché de arranque después de un cambio

El esqueleto configura `app.compile(...)` en `bootstrap/app.py` antes de `create()`. Los archivos y directorios vigilados determinan la invalidación automática. Si cambias registros de arranque o una ruta que no está vigilada, limpia los artefactos anteriores desde la raíz del proyecto y reinicia los procesos en ejecución:

```shell
uv run python -B reactor optimize:clear
```

`optimize:clear` elimina los archivos de caché compilada de configuración, comandos y rutas, bytecode de Python y artefactos de los directorios `build`/`dist` del proyecto. Revisa esos efectos si allí almacenas archivos del despliegue. Es una operación distinta de borrar valores de caché de negocio. El siguiente proceso reconstruye los metadatos de arranque que necesite.

`reactor optimize` valida en memoria la sintaxis del código Python; no precarga la caché de arranque ni ejecuta las pruebas de tu aplicación. Cuando se reutiliza una caché válida, también se reutilizan los registros anteriores: editar llamadas `with...` no produce efecto hasta invalidarla.

## Referencia y próximos pasos

[directory.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/directory.py) · [core_paths.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/core_paths.py) · [application.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/application.py)

[Volver al índice del módulo](/es/getting-started).
