---
title: "Elegir almacenamiento y entender concurrencia"
description: "Configura los drivers memory, file, cache y database, conoce cómo persisten las sesiones y qué ocurre con la expiración y las peticiones simultáneas."
editUrl: true
lastUpdated: false
---

El driver decide dónde guarda Orionis los datos de sesión. La cookie conserva únicamente el identificador: el payload permanece en el servidor. Cambiar de driver no modifica la API de `ISession` ni de la fachada `Session`.

Configura el driver en `config/session.py` o utiliza las variables que ese archivo lee desde `.env`. Selecciona una de las siguientes alternativas.

| Driver | Persistencia y alcance | Uso habitual |
|---|---|---|
| `memory` | Una instancia del store dentro de un proceso; se pierde al reiniciar. | Desarrollo y pruebas con un solo proceso. |
| `file` | Archivos en el directorio configurado. | Conservar sesiones entre reinicios en un servidor con almacenamiento persistente. |
| `cache` | Repositorio de caché configurado; alcance y duración física según su backend. | Reutilizar Redis, Memcached u otro store de caché disponible. |
| `database` | Filas en una tabla de la conexión elegida. | Compartir sesiones entre procesos que consultan la misma base de datos. |

## Memory: comenzar sin servicios adicionales

```dotenv
SESSION_DRIVER=memory
```

Es el valor predeterminado de `config/session.py`. No necesita archivos de sesión, Redis ni una tabla de base de datos.

Cada instancia mantiene su propio diccionario. Dos workers no comparten datos ni revocaciones, aunque pertenezcan a la misma aplicación. Reiniciar el proceso elimina las sesiones que almacenaba; el navegador puede conservar una cookie cuyo registro ya no existe.

Elige un almacenamiento compartido cuando las peticiones de un usuario puedan llegar a distintos procesos o servidores.

## File: persistir en el sistema de archivos

```dotenv
SESSION_DRIVER=file
SESSION_FILES=storage/framework/sessions
```

Una ruta relativa se resuelve desde la raíz del proyecto. Orionis crea el directorio si no existe y guarda un archivo `<identificador>.json` por sesión, con sus datos y su fecha de expiración.

La cuenta que ejecuta la aplicación necesita permisos para crear, leer, reemplazar y eliminar archivos en ese directorio. Si el despliegue usa contenedores, el directorio debe conservarse entre reemplazos para mantener esas sesiones.

El store ejecuta el I/O en hilos de trabajo y publica cada escritura mediante un archivo temporal y un reemplazo atómico. Sus locks coordinan la lectura, actualización y eliminación entre procesos que acceden al mismo directorio. Esto protege cada operación de almacenamiento; no bloquea todo el procesamiento de una petición.

Varios procesos de un mismo servidor pueden utilizar el mismo directorio. En servidores diferentes, una ruta con el mismo nombre no comparte los archivos: necesitan un volumen común cuya semántica de locks y reemplazos sea apropiada, o un backend de red como Redis o una base de datos.

## Cache: utilizar un repositorio de caché

El driver de sesión es `cache`; el backend concreto se selecciona con `SESSION_CACHE_STORE`. Por ejemplo, para Redis:

```dotenv
SESSION_DRIVER=cache
SESSION_CACHE_STORE=redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
```

Este ejemplo usa la configuración Redis de `config/cache.py` y necesita un servidor Redis accesible en esa dirección. Si requiere autenticación, configura también `REDIS_PASSWORD`.

Los nombres nativos de repositorio son `memory`, `file`, `redis`, `memcached` y `database`. Su configuración y requisitos pertenecen al [sistema de caché](/es/services/cache/stores-and-locks/). Si no defines `SESSION_CACHE_STORE`, se utiliza el repositorio predeterminado de caché, seleccionado con `CACHE_STORE` en la configuración del proyecto.

El store guarda cada sesión bajo `session:<identificador>` y aplica también `CACHE_PREFIX` cuando está configurado. El TTL se calcula con el tiempo restante hasta la expiración de la sesión, redondeado hacia arriba a segundos completos. Al actualizar una sesión existente utiliza el reemplazo condicional de la caché, no una creación incondicional de la clave.

El alcance depende del repositorio: `cache` con `SESSION_CACHE_STORE=memory` sigue siendo local al proceso; seleccionar `cache` por sí solo no convierte las sesiones en compartidas. Borrar las entradas de ese repositorio, incluidas las sesiones, hará que los clientes afectados comiencen una sesión nueva.

## Database: compartir sesiones mediante una tabla

Para usar la conexión SQLite definida en `config/database.py`:

```dotenv
SESSION_DRIVER=database
SESSION_DB_CONNECTION=sqlite
SESSION_DB_TABLE=sessions

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

`SESSION_DB_CONNECTION` es el nombre de una conexión configurada, no una URL ni un nombre de driver independiente. Si no lo defines, el manager utiliza la conexión predeterminada de base de datos. `SESSION_DB_TABLE` vale `sessions` de forma predeterminada; se aplica el prefijo configurado en la conexión.

El store utiliza esta estructura:

| Columna | Contenido |
|---|---|
| `id` | Cadena de hasta 255 caracteres; clave primaria del identificador de sesión. |
| `payload` | Texto JSON con los datos de sesión. |
| `expires_at` | Entero con la expiración como segundos Unix. |

La tabla se comprueba y se crea, si falta, en la primera operación del store. La conexión debe estar disponible y disponer de los permisos necesarios para esa creación cuando corresponda. Una tabla existente debe respetar la estructura esperada; el store no transforma un esquema incompatible.

El proyecto también incluye una migración para la tabla `sessions`. Si administras el esquema mediante las [migraciones del proyecto](/es/database/migrations-and-seeders/), puedes ejecutar el comando habitual antes de recibir peticiones:

```bash
orionis migrate
```

O su alternativa mediante el archivo local `reactor`:

```bash
python -B reactor migrate
```

Estos comandos aplican **todas las migraciones pendientes** de la conexión seleccionada, no solamente la tabla de sesiones. Si cambias el nombre o la conexión de la tabla de sesiones, adapta también la migración que decidas utilizar.

El driver exige una conexión con restricciones de unicidad efectivas. La implementación rechaza Redshift para sesiones, porque no proporciona la garantía requerida de una sola fila por identificador.

## Usar datos que puedan persistirse en cualquier driver

La lógica del controlador sigue siendo la misma con cualquiera de los cuatro drivers. Por ejemplo, en `app/http/controllers/display_preferences_controller.py`:

```python
from orionis.http import JSONResponse
from orionis.session.contracts.session import ISession


class DisplayPreferencesController:

    async def compact(self, session: ISession) -> JSONResponse:
        session.put("display", {
            "layout": "compact",
            "page_size": 20,
            "show_help": True,
        })
        return JSONResponse({"display": session.get("display")})

    async def show(self, session: ISession) -> JSONResponse:
        return JSONResponse({
            "display": session.get("display", {"layout": "comfortable"}),
        })
```

Registra estas acciones en `routes/web.py`, donde el middleware inicia y guarda la sesión:

```python
from app.http.controllers.display_preferences_controller import DisplayPreferencesController
from orionis.support.facades import Route


Route.put("/settings/display/compact", [DisplayPreferencesController, "compact"])
Route.get("/settings/display", [DisplayPreferencesController, "show"])
```

La petición `PUT` debe incluir el token [CSRF](/es/http/sessions/configuration-and-security/) del flujo WEB. Al consultar después `GET /settings/display` con la misma cookie, el controlador recibe los valores persistidos, siempre que la sesión siga vigente.

File y database serializan el payload como JSON mediante `msgspec`; los repositorios de caché nativos también utilizan serialización JSON. Guarda cadenas, números, booleanos, `None`, listas y diccionarios con claves de texto. Una fecha puede volver como cadena y una tupla como lista; transforma esos valores explícitamente si necesitas reconstruir sus tipos.

El store `memory` copia los registros y puede conservar objetos que no tienen el mismo comportamiento al serializarse. Evita guardar modelos ORM, conexiones, peticiones u otros objetos vivos suponiendo que funcionarán igual al cambiar de driver.

## Peticiones simultáneas y revocación

Orionis diferencia entre crear una sesión nueva y actualizar una existente. Si otra petición elimina o expira el registro antes de guardarlo, la actualización condicional falla y la petición atrasada no lo vuelve a crear. La rotación de identificador elimina primero el registro anterior.

Esto protege la revocación, pero **no combina los cambios de dos peticiones** sobre una sesión todavía válida. Por ejemplo:

1. Dos peticiones cargan el mismo carrito de sesión.
2. Cada una añade un producto a su copia.
3. Ambas guardan el payload completo.
4. La última escritura aceptada puede reemplazar los cambios de la otra.

Los locks de archivo y las actualizaciones condicionales de database/cache protegen sus operaciones de almacenamiento; no constituyen una transacción sobre todo el controlador. Para cantidades que deban actualizarse sin pérdida, utiliza datos de dominio y su control de concurrencia, por ejemplo una [transacción de base de datos](/es/database/transactions/).

## Expiración, limpieza y cambios de backend

`SESSION_LIFETIME` determina la vigencia de la sesión en minutos. La [configuración de renovación](/es/http/sessions/configuration-and-security/) controla cuándo se vuelve a guardar un payload sin cambios y cuándo se renueva la cookie.

Un registro vencido deja de ser válido aunque todavía exista físicamente. Memory, file y database rechazan los registros expirados al leerlos; file también descarta archivos corruptos. Cache comprueba la expiración y utiliza el TTL del repositorio, cuya eliminación física depende del backend.

Los stores proporcionan `gc()` para recolectar registros expirados; en cache es una operación vacía porque la expiración se delega al repositorio. El manager de sesiones no programa una recolección masiva automática. Si necesitas retirar archivos o filas expirados que ya no reciben lecturas, incorpora mantenimiento explícito del almacenamiento elegido.

Cambiar de driver, directorio, repositorio de caché, prefijo o tabla cambia el lugar donde Orionis busca las sesiones. No hay una migración automática de los registros anteriores. Planifica ese cambio teniendo en cuenta que las cookies existentes pueden dejar de encontrar su sesión.
