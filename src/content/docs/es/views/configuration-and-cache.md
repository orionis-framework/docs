---
title: "Configuración y caché de vistas"
description: "Configura directorios, escape, recarga y las dos cachés del motor de vistas de Orionis."
editUrl: true
lastUpdated: false
---

`config/view.py` define dónde se buscan las plantillas y cómo se conserva su compilación. Orionis crea un entorno Jinja compartido por proceso a partir de esta configuración. El renderizado siempre es asíncrono.

## El archivo config/view.py

La estructura predeterminada es una dataclass inmutable que hereda de la configuración de Orionis. Modifica los campos de la clase existente; no crees una segunda configuración de vistas en otro archivo:

```python
from dataclasses import dataclass, field

from orionis.environment import Env
from orionis.foundation.config.view import View


@dataclass(frozen=True, kw_only=True)
class BootstrapView(View):
    paths: list[str] | tuple[str, ...] = field(
        default_factory=lambda: Env.get("VIEW_PATHS", ["resources/views"]),
    )
    cache_size: int = field(
        default_factory=lambda: Env.get("VIEW_CACHE_SIZE", 400),
    )
    cache_path: str | None = field(
        default_factory=lambda: Env.get("VIEW_CACHE_PATH", "storage/framework/views"),
    )
    auto_reload: bool = field(
        default_factory=lambda: Env.get("APP_DEBUG", True),
    )
    autoescape: bool = field(
        default_factory=lambda: Env.get("VIEW_AUTOESCAPE", True),
    )
```

Foundation descubre esta clase al cargar la configuración y publica sus valores en la sección `view`. Las llamadas `Env.get()` se evalúan al construir la configuración; las variables de entorno influyen porque el archivo las lee. Instanciar `View(...)` en un controlador no reconfigura el motor.

| Campo | Tipo y valor predeterminado | Comportamiento |
| --- | --- | --- |
| `paths` | `list[str]` o `tuple[str, ...]`; `["resources/views"]` | Directorios de búsqueda, en orden de prioridad. Lee `VIEW_PATHS`. |
| `cache_size` | `int`; `400` | Número máximo de plantillas en memoria por entorno. Lee `VIEW_CACHE_SIZE`. |
| `cache_path` | `str` o `None`; `"storage/framework/views"` | Directorio de bytecode en disco; `None` lo desactiva. Lee `VIEW_CACHE_PATH`. |
| `auto_reload` | `bool`; `True` | Comprueba si cambió el archivo fuente al recuperar una plantilla cacheada. Lee `APP_DEBUG`. |
| `autoescape` | `bool`; `True` | Escapa los valores insertados en las plantillas de aplicación. Lee `VIEW_AUTOESCAPE`. |

No existe un campo `enable_async`: Orionis crea Jinja con `enable_async=True` y utiliza `render_async()`.

### Configurar mediante el entorno

Con el archivo anterior, este ejemplo conserva el escape y la recarga durante el desarrollo y añade un segundo directorio:

```dotenv
VIEW_PATHS=list:["resources/views", "packages/admin/views"]
VIEW_CACHE_SIZE=int:400
VIEW_CACHE_PATH=storage/framework/views
APP_DEBUG=bool:true
VIEW_AUTOESCAPE=bool:true
```

Para desactivar únicamente la caché en disco, utiliza `VIEW_CACHE_PATH=null`. Para desactivar únicamente la caché en memoria, utiliza `VIEW_CACHE_SIZE=int:0`. `int:-1` elimina el límite de la caché en memoria. Un valor positivo mantiene una caché LRU con ese máximo de plantillas.

`paths` debe ser una lista o tupla no vacía de cadenas no vacías. `cache_size` debe ser un entero mayor o igual a `-1`; un booleano no es válido. `cache_path` admite una cadena no vacía o `None`. Los dos campos booleanos requieren valores booleanos reales: la configuración no convierte tipos incorrectos silenciosamente.

## Cómo se resuelven los directorios

Las rutas relativas se resuelven desde `app.basePath`, normalmente la raíz del proyecto. También se admiten rutas absolutas. Por ejemplo:

```text
project/
├── resources/views/dashboard.html
├── packages/admin/views/dashboard.html
└── storage/framework/views/
```

Con `paths=["resources/views", "packages/admin/views"]`, `View.make("dashboard")` carga `resources/views/dashboard.html`. Si ese archivo no existe, busca en el segundo directorio. Cambiar el orden cambia qué plantilla se selecciona cuando los nombres coinciden.

Los archivos no necesitan un módulo Python ni archivos de inicialización: son plantillas del loader. Su ubicación y los nombres que se pasan a `View.make()` se explican en [renderizar vistas](/es/views/rendering-templates).

El prefijo `__orionis__/default/` está reservado para páginas incluidas en el framework. Un loader propio del framework las busca antes de los directorios de aplicación. Estas páginas conservan el escape HTML aunque `autoescape=False` para las vistas de aplicación.

## Caché en memoria y bytecode en disco

Son dos mecanismos distintos:

1. **Memoria:** Jinja conserva los objetos de plantilla compilados dentro del entorno del proceso. `cache_size` establece su límite. Cada worker tiene su propia memoria.
2. **Disco:** Jinja guarda bytecode Python compilado para evitar volver a compilar la plantilla cuando otro entorno la carga. `cache_path` determina su directorio.

Estas cachés conservan la compilación de la plantilla, **no el HTML de una petición**. Las variables se aplican en cada renderizado: dos usuarios pueden recibir resultados distintos a partir del mismo bytecode. Tampoco establecen cabeceras de caché HTTP.

### Cuándo aparecen los archivos

Si `cache_path` no es `None`, Orionis crea el directorio y sus padres al construir el entorno, normalmente durante el arranque de los providers. Los archivos `.cache` se escriben cuando una plantilla se carga y compila por primera vez; arrancar la aplicación no precompila todas las vistas.

La ubicación predeterminada es:

```text
<raíz del proyecto>/storage/framework/views/
```

El nombre contiene la ruta de la plantilla aplanada, un digest SHA-1 de ocho caracteres del nombre original y la extensión `.cache`:

```text
users/profile.html → users.profile.<digest de 8 caracteres>.cache
```

El digest distingue, por ejemplo, `users/profile.html` de `users/profile.j2`. Jinja conserva también una comprobación del contenido fuente para descartar bytecode que ya no corresponde a la plantilla.

La escritura utiliza un archivo temporal y un reemplazo al terminar, para evitar que otro proceso lea bytecode parcialmente escrito. El directorio debe permitir creación y escritura al proceso de la aplicación: Orionis no cambia automáticamente a una caché desactivada si falla su creación. Aunque parte de los fallos de lectura o reemplazo se toleran, los errores de apertura y escritura pueden propagarse; prepara el directorio antes del despliegue.

### Recarga durante desarrollo y despliegue

Con `auto_reload=True`, Jinja comprueba si la plantilla en memoria sigue actualizada y vuelve a cargarla cuando cambia el archivo. Con `False`, un proceso que ya tiene una plantilla en memoria puede seguir utilizándola aunque se edite el archivo.

Por eso, al desplegar cambios con `auto_reload=False`, reinicia los workers para reconstruir sus entornos. Borrar archivos de disco no vacía la caché en memoria de procesos que ya están atendiendo peticiones. Modificar `app.config("view...")` después de resolver el entorno tampoco reconstruye ese singleton.

## Limpiar el bytecode

Desde la raíz del proyecto, utiliza cualquiera de estas alternativas:

```bash
orionis clear:views
```

```bash
python -B reactor clear:views
```

El comando lee `view.cache_path`, resuelve la ruta relativa desde la base de la aplicación y elimina recursivamente archivos terminados en `.cache`. Conserva el directorio y los demás archivos. Si la caché en disco está desactivada, informa de ello y termina correctamente.

El código de salida es `0` si no hubo errores y `1` si falló la eliminación de algún archivo o la ruta configurada no es válida. Los errores se muestran en consola. Una plantilla utilizada después de la limpieza puede volver a generar su bytecode.

Dedica `cache_path` al bytecode de vistas, ya que la limpieza se aplica a todos los archivos `.cache` de ese directorio y sus subdirectorios. Para una limpieza estable durante un despliegue, coordina la operación con el reinicio de los workers.

## Escape, variables ausentes y diagnóstico

Mantén `autoescape=True` para páginas HTML. Escapa el contenido insertado, sin impedir que los layouts, bloques y archivos HTML de la aplicación funcionen. Los helpers que devuelven markup seguro tienen contratos específicos, descritos en [globals de vistas](/es/views/globals).

El entorno utiliza `jinja2.Undefined`: una variable ausente puede imprimirse vacía, mientras otras operaciones sobre ella sí pueden fallar. Pasa un contexto explícito y comprueba las páginas con datos completos y vacíos. Las plantillas son código confiable de tu aplicación; este entorno no utiliza el sandbox de Jinja.

Una plantilla ausente produce `ViewTemplateNotFoundException`. Los errores del renderizado pendiente se presentan como `ViewRenderException`, conservando la causa. Revisa el nombre solicitado, los directorios de búsqueda y la excepción original antes de limpiar cachés. Consulta [excepciones HTTP](/es/http/exceptions) para entender su presentación durante una petición.

Para añadir filtros, globals, tests o etiquetas, utiliza un [provider de vistas](/es/views/providers-and-extensions). La configuración anterior controla carga y caché; el provider amplía el entorno compartido antes de atender peticiones.
