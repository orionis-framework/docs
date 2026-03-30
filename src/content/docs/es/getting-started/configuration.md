---
title: Configuración
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Archivos de Configuración

`Orionis Framework` gestiona la configuración de la aplicación mediante dataclasses congeladas (`frozen=True`), centralizando los parámetros en el directorio `config/`. Estos archivos permiten definir aspectos clave como la base de datos, correo electrónico, sesiones, CORS y otros comportamientos esenciales.

Cada archivo define una dataclass que extiende una clase base del framework y utiliza `Env.get()` para cargar valores desde variables de entorno, con valores predeterminados seguros como respaldo.

## `app.py`

Contiene la configuración principal de la aplicación: entorno de ejecución, red, workers, localización y cifrado.

La configuración se define mediante una dataclass congelada que extiende la clase base `App`:

```python
from dataclasses import dataclass, field
from orionis.foundation.config.app.entities.app import App
from orionis.foundation.config.app.enums.ciphers import Cipher
from orionis.foundation.config.app.enums.environments import Environments
from orionis.services.environment.env import Env

@dataclass(frozen=True, kw_only=True)
class BootstrapApp(App):
    # ... propiedades de configuración
```

### Propiedades

- **`name`** (`str`) — Nombre identificativo de la aplicación.
    - Variable de entorno: `APP_NAME`
    - Valor por defecto: `'Orionis Application'`

- **`env`** (`str | Environments`) — Entorno de ejecución.
    - Variable de entorno: `APP_ENV`
    - Valor por defecto: `Environments.DEVELOPMENT`
    - Opciones: `DEVELOPMENT`, `TESTING`, `PRODUCTION`

    ```python
    from orionis.foundation.config.app.enums.environments import Environments

    Environments.DEVELOPMENT
    Environments.PRODUCTION
    Environments.TESTING
    ```

- **`debug`** (`bool`) — Modo de depuración.
    - Variable de entorno: `APP_DEBUG`
    - Valor por defecto: `True`

    :::caution[Seguridad]
    Debe estar desactivado (`False`) en producción. Cuando está activo muestra errores detallados y habilita logs verbosos.
    :::

- **`host`** (`str`) — Dirección IP donde escucha la aplicación.
    - Variable de entorno: `APP_HOST`
    - Valor por defecto: `'127.0.0.1'`
    - Usa `'0.0.0.0'` para permitir acceso externo (con precaución en producción).

- **`port`** (`int`) — Puerto de red donde escucha la aplicación.
    - Variable de entorno: `APP_PORT`
    - Valor por defecto: `8000`

- **`workers`** (`int`) — Número de procesos trabajadores para manejar solicitudes concurrentes.
    - Variable de entorno: `APP_WORKERS`
    - Valor por defecto: `1`

    Orionis Framework proporciona la clase `Workers` para calcular automáticamente el número óptimo basado en CPU y RAM disponibles:

    ```python
    from orionis.services.system.workers import Workers

    # Cálculo automático por CPU y RAM (0.5 GB por worker por defecto)
    workers = Workers().calculate()

    # Con asignación personalizada de RAM por worker
    workers = Workers(ram_per_worker=0.5).calculate()
    ```

    Si tu aplicación es **stateful** (mantiene estado en memoria), mantén `workers = 1` o implementa un sistema de cache compartido (Memcached, Redis). Si es **stateless**, puedes incrementar los workers según la capacidad del servidor.

- **`reload`** (`bool`) — Recarga automática al detectar cambios en el código.
    - Variable de entorno: `APP_RELOAD`
    - Valor por defecto: `True`
    - Solo funciona con `workers = 1`. Debe estar desactivado en producción.

- **`timezone`** (`str`) — Zona horaria de la aplicación.
    - Variable de entorno: `APP_TIMEZONE`
    - Valor por defecto: `'UTC'`
    - Acepta cualquier zona válida: `'America/New_York'`, `'Europe/Madrid'`, `'America/Bogota'`, etc.

- **`locale`** (`str`) — Configuración regional predeterminada.
    - Variable de entorno: `APP_LOCALE`
    - Valor por defecto: `'en'`

- **`fallback_locale`** (`str`) — Configuración regional de respaldo.
    - Variable de entorno: `APP_FALLBACK_LOCALE`
    - Valor por defecto: `'en'`
    - Se utiliza cuando el idioma principal no está disponible.

- **`cipher`** (`str | Cipher`) — Algoritmo de cifrado para datos sensibles.
    - Variable de entorno: `APP_CIPHER`
    - Valor por defecto: `Cipher.AES_256_CBC`

    ```python
    from orionis.foundation.config.app.enums.ciphers import Cipher

    Cipher.AES_128_CBC
    Cipher.AES_256_CBC
    Cipher.AES_128_GCM   # Cifrado autenticado
    Cipher.AES_256_GCM   # Cifrado autenticado
    ```

- **`key`** (`str | None`) — Clave de cifrado de la aplicación.
    - Variable de entorno: `APP_KEY`
    - Valor por defecto: `None`

    :::caution[Seguridad]
    Debe ser una clave segura, única y secreta. Almacénala siempre en variables de entorno, nunca en código fuente.
    :::

- **`maintenance`** (`str | bool`) — Indicador de modo mantenimiento.
    - Variable de entorno: `APP_MAINTENANCE`
    - Valor por defecto: `False`

## `auth.py`

Define la configuración del sistema de autenticación. Actualmente hereda la estructura base sin campos adicionales personalizados:

```python
from dataclasses import dataclass
from orionis.foundation.config.auth.entities.auth import Auth

@dataclass(frozen=True, kw_only=True)
class BootstrapAppAuth(Auth):
    pass
```

Este archivo se extenderá con campos adicionales en futuras versiones del framework.

## `cache.py`

Configura el sistema de cache de la aplicación. Por defecto utiliza almacenamiento basado en archivos.

### Propiedades

- **`default`** (`Drivers | str`) — Driver de cache predeterminado.
    - Variable de entorno: `CACHE_STORE`
    - Valor por defecto: `Drivers.FILE`

- **`stores`** (`Stores | dict`) — Configuración de stores disponibles.
    - **`file`**: Cache basado en archivos.
        - `path`: Ruta de almacenamiento. Variable de entorno: `CACHE_FILE_PATH`. Por defecto: `"storage/framework/cache/data"`.

## `cors.py`

Configura el comportamiento de CORS (Cross-Origin Resource Sharing), controlando qué orígenes externos pueden interactuar con tu API y bajo qué condiciones.

Cuando un navegador realiza una solicitud desde un origen diferente (dominio, protocolo o puerto), el servidor responde con cabeceras CORS generadas automáticamente a partir de esta configuración.

### Propiedades

- **`allow_origins`** (`list[str]`) — Orígenes permitidos para acceder a la API.
    - Valor por defecto: `["*"]`
    - Especifica dominios concretos en producción: `["https://miapp.com", "https://admin.miapp.com"]`

- **`allow_origin_regex`** (`str | None`) — Expresión regular para orígenes con patrón.
    - Valor por defecto: `None`
    - Ejemplo: `r"^https://.*\.miapp\.com$"` para subdominios dinámicos.

- **`allow_methods`** (`list[str]`) — Métodos HTTP permitidos en solicitudes CORS.
    - Valor por defecto: `["*"]`
    - Restringe en producción: `["GET", "POST", "PUT", "DELETE"]`

- **`allow_headers`** (`list[str]`) — Cabeceras HTTP permitidas del cliente.
    - Valor por defecto: `["*"]`

- **`expose_headers`** (`list[str]`) — Cabeceras expuestas al navegador en la respuesta.
    - Valor por defecto: `[]`

- **`allow_credentials`** (`bool`) — Permite credenciales (cookies, headers de autorización) en solicitudes CORS.
    - Valor por defecto: `False`

    :::note
    Si `allow_credentials` es `True`, no puedes usar `["*"]` en `allow_origins` (restricción del estándar CORS). Debes especificar orígenes concretos.
    :::

- **`max_age`** (`int | None`) — Segundos para cachear la respuesta preflight (`OPTIONS`).
    - Valor por defecto: `600` (10 minutos)

Dado que las listas no pueden usarse como valores por defecto directamente en dataclasses, utiliza `field` con `default_factory`:

```python
from dataclasses import dataclass, field
from orionis.foundation.config.cors.entities.cors import Cors

@dataclass(frozen=True, kw_only=True)
class BootstrapCors(Cors):
    allow_origins: list[str] = field(
        default_factory=lambda: ["https://miapp.com", "https://admin.miapp.com"]
    )
```

## `database.py`

Define las conexiones de base de datos de la aplicación. Soporta múltiples drivers: SQLite, MySQL, PostgreSQL y Oracle.

### Propiedades

- **`default`** (`str`) — Conexión de base de datos predeterminada.
    - Variable de entorno: `DB_CONNECTION`
    - Valor por defecto: `"sqlite"`

- **`connections`** (`Connections | dict`) — Conexiones disponibles.

### SQLite

| Propiedad | Variable de entorno | Valor por defecto |
|---|---|---|
| `driver` | — | `"sqlite"` |
| `url` | `DB_URL` | `"sqlite:///database/database.sqlite"` |
| `database` | `DB_DATABASE` | `"database.sqlite"` |
| `prefix` | `DB_PREFIX` | `""` |
| `foreign_key_constraints` | `DB_FOREIGN_KEYS` | `SQLiteForeignKey.OFF` |
| `busy_timeout` | `DB_BUSY_TIMEOUT` | `5000` |
| `journal_mode` | `DB_JOURNAL_MODE` | `SQLiteJournalMode.DELETE` |
| `synchronous` | `DB_SYNCHRONOUS` | `SQLiteSynchronous.NORMAL` |

### MySQL

| Propiedad | Variable de entorno | Valor por defecto |
|---|---|---|
| `driver` | — | `"mysql"` |
| `host` | `DB_HOST` | `"127.0.0.1"` |
| `port` | `DB_PORT` | `3306` |
| `database` | `DB_DATABASE` | `"orionis"` |
| `username` | `DB_USERNAME` | `"root"` |
| `password` | `DB_PASSWORD` | `""` |
| `unix_socket` | `DB_SOCKET` | `""` |
| `charset` | — | `MySQLCharset.UTF8MB4` |
| `collation` | — | `MySQLCollation.UTF8MB4_UNICODE_CI` |
| `engine` | — | `MySQLEngine.INNODB` |
| `strict` | — | `True` |

### PostgreSQL

| Propiedad | Variable de entorno | Valor por defecto |
|---|---|---|
| `driver` | — | `"pgsql"` |
| `host` | `DB_HOST` | `"127.0.0.1"` |
| `port` | `DB_PORT` | `5432` |
| `database` | `DB_DATABASE` | `"orionis"` |
| `username` | `DB_USERNAME` | `"postgres"` |
| `password` | `DB_PASSWORD` | `""` |
| `charset` | `DB_CHARSET` | `PGSQLCharset.UTF8` |
| `search_path` | — | `"public"` |
| `sslmode` | — | `PGSQLSSLMode.PREFER` |

### Oracle

| Propiedad | Variable de entorno | Valor por defecto |
|---|---|---|
| `driver` | — | `"oracle"` |
| `host` | `DB_HOST` | `"localhost"` |
| `port` | `DB_PORT` | `1521` |
| `username` | `DB_USERNAME` | `"sys"` |
| `password` | `DB_PASSWORD` | `""` |
| `service_name` | `DB_SERVICE_NAME` | `"ORCL"` |
| `sid` | `DB_SID` | `None` |
| `dsn` | `DB_DSN` | `None` |
| `tns_name` | `DB_TNS` | `None` |
| `encoding` | `DB_ENCODING` | `OracleEncoding.AL32UTF8` |
| `nencoding` | `DB_NENCODING` | `OracleNencoding.AL32UTF8` |

## `filesystems.py`

Define el sistema de archivos de la aplicación mediante el patrón de múltiples discos, donde cada disco representa una ubicación de almacenamiento con su propia configuración.

### Propiedades

- **`default`** (`str`) — Disco de almacenamiento predeterminado.
    - Variable de entorno: `FILESYSTEM_DISK`
    - Valor por defecto: `"local"`
    - Opciones: `"local"`, `"public"`, `"aws"`

- **`disks`** (`Disks | dict`) — Discos disponibles.

### Disco `local` — Almacenamiento privado

- **`path`**: Ruta de almacenamiento. Por defecto: `"storage/app/private"`.

### Disco `public` — Almacenamiento público

- **`path`**: Ruta de almacenamiento. Por defecto: `"storage/app/public"`.
- **`url`**: URL base para acceso web. Por defecto: `"/static"`.

### Disco `aws` — Amazon S3

| Propiedad | Valor por defecto | Descripción |
|---|---|---|
| `key` | `""` | AWS Access Key ID |
| `secret` | `""` | AWS Secret Access Key |
| `region` | `"us-east-1"` | Región del bucket |
| `bucket` | `""` | Nombre del bucket |
| `url` | `None` | URL personalizada (CloudFront) |
| `endpoint` | `None` | Endpoint personalizado (MinIO) |
| `use_path_style_endpoint` | `False` | Estilo de ruta vs subdominio |
| `throw` | `False` | Lanzar excepciones en errores |

:::tip[Recomendación]
En desarrollo usa discos `local` y `public`. En producción considera `aws` para escalabilidad. Mantén las credenciales de AWS en variables de entorno.
:::

## `logging.py`

Configura el sistema de logging con múltiples canales que representan diferentes estrategias de almacenamiento y rotación.

### Propiedades

- **`default`** (`str`) — Canal de logging predeterminado.
    - Variable de entorno: `LOG_CHANNEL`
    - Valor por defecto: `"stack"`
    - Opciones: `"stack"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"chunked"`

- **`channels`** (`Channels | dict`) — Canales disponibles.

### Canal `stack` — Logging acumulativo

Logging básico sin rotación automática.

| Propiedad | Valor por defecto |
|---|---|
| `path` | `"storage/logs/stack.log"` |
| `level` | `Level.INFO` |

### Canal `hourly` — Rotación por horas

| Propiedad | Valor por defecto |
|---|---|
| `path` | `"storage/logs/hourly_{suffix}.log"` |
| `level` | `Level.INFO` |
| `retention_hours` | `24` |

### Canal `daily` — Rotación diaria

| Propiedad | Valor por defecto |
|---|---|
| `path` | `"storage/logs/daily_{suffix}.log"` |
| `level` | `Level.INFO` |
| `retention_days` | `7` |
| `at` | `time(0, 0)` (medianoche) |

### Canal `weekly` — Rotación semanal

| Propiedad | Valor por defecto |
|---|---|
| `path` | `"storage/logs/weekly_{suffix}.log"` |
| `level` | `Level.INFO` |
| `retention_weeks` | `4` |

### Canal `monthly` — Rotación mensual

| Propiedad | Valor por defecto |
|---|---|
| `path` | `"storage/logs/monthly_{suffix}.log"` |
| `level` | `Level.INFO` |
| `retention_months` | `4` |

### Canal `chunked` — Rotación por tamaño

| Propiedad | Valor por defecto |
|---|---|
| `path` | `"storage/logs/chunked_{suffix}.log"` |
| `level` | `Level.INFO` |
| `mb_size` | `10` MB |
| `files` | `5` archivos máximo |

### Niveles de logging

```python
from orionis.foundation.config.logging.enums.levels import Level

Level.DEBUG       # Información detallada para debugging
Level.INFO        # Información general de funcionamiento
Level.WARNING     # Advertencias que no impiden el funcionamiento
Level.ERROR       # Errores que afectan funcionalidades específicas
Level.CRITICAL    # Errores críticos que pueden detener la aplicación
```

## `mail.py`

Define los transportes de correo electrónico disponibles: SMTP para envío real y almacenamiento en archivos para desarrollo.

### Propiedades

- **`default`** (`str`) — Transporte predeterminado.
    - Variable de entorno: `MAIL_MAILER`
    - Valor por defecto: `"smtp"`
    - Opciones: `"smtp"`, `"file"`

- **`mailers`** (`Mailers | dict`) — Transportes disponibles.

### Transporte `smtp`

| Propiedad | Variable de entorno | Valor por defecto |
|---|---|---|
| `url` | `MAIL_URL` | `""` |
| `host` | `MAIL_HOST` | `""` |
| `port` | `MAIL_PORT` | `587` |
| `encryption` | `MAIL_ENCRYPTION` | `"TLS"` |
| `username` | `MAIL_USERNAME` | `""` |
| `password` | `MAIL_PASSWORD` | `""` |
| `timeout` | — | `None` |

### Transporte `file`

- **`path`**: Directorio de almacenamiento. Por defecto: `"storage/mail"`.

Ideal para desarrollo y testing — los correos se guardan como archivos para inspección sin envío real.

### Proveedores SMTP comunes

```python
# Gmail
smtp = Smtp(host="smtp.gmail.com", port=587, encryption="TLS",
            username="tu_email@gmail.com", password="tu_contraseña_de_aplicación")

# SendGrid
smtp = Smtp(host="smtp.sendgrid.net", port=587, encryption="TLS",
            username="apikey", password="tu_api_key")

# Outlook
smtp = Smtp(host="smtp-mail.outlook.com", port=587, encryption="TLS",
            username="tu_email@outlook.com", password="tu_contraseña")

# Mailgun
smtp = Smtp(host="smtp.mailgun.org", port=587, encryption="TLS",
            username="postmaster@tu_dominio.mailgun.org", password="tu_contraseña")
```

## `queue.py`

Configura el sistema de colas de trabajo de la aplicación.

### Propiedades

- **`default`** (`str`) — Conexión de cola predeterminada.
    - Variable de entorno: `QUEUE_CONNECTION`
    - Valor por defecto: `"async"`

- **`brokers`** (`Brokers | dict`) — Brokers disponibles.

### Broker `database`

| Propiedad | Valor por defecto | Descripción |
|---|---|---|
| `jobs_table` | `"jobs"` | Tabla de trabajos |
| `failed_jobs_table` | `"failed_jobs"` | Tabla de trabajos fallidos |
| `queue` | `"default"` | Nombre de la cola |
| `visibility_timeout` | `60` | Segundos antes de que un job sea visible de nuevo |
| `retry_delay` | `90` | Segundos entre reintentos |
| `max_attempts` | `3` | Intentos máximos por job |
| `strategy` | `Strategy.FIFO` | Estrategia de procesamiento (First In, First Out) |

## `session.py`

Configura el manejo de sesiones HTTP de la aplicación.

### Propiedades

| Propiedad | Variable de entorno | Valor por defecto | Descripción |
|---|---|---|---|
| `secret_key` | `APP_KEY` | — | Clave para firmar cookies de sesión |
| `session_cookie` | `SESSION_COOKIE_NAME` | `"orionis_session"` | Nombre de la cookie |
| `max_age` | `SESSION_MAX_AGE` | `1800` (30 min) | Duración en segundos (`None` = hasta cerrar navegador) |
| `same_site` | `SESSION_SAME_SITE` | `SameSitePolicy.LAX` | Política SameSite: `lax`, `strict`, `none` |
| `path` | `SESSION_PATH` | `"/"` | Path de la cookie |
| `https_only` | `SESSION_HTTPS_ONLY` | `False` | Restringir a HTTPS |
| `domain` | `SESSION_DOMAIN` | `None` | Dominio de la cookie |

:::note
Si `same_site` es `"none"`, `https_only` debe ser `True` (requisito del estándar de cookies).
:::

## `testing.py`

Configura el comportamiento de las pruebas automatizadas del framework.

### Propiedades

| Propiedad | Valor por defecto | Descripción |
|---|---|---|
| `verbosity` | `VerbosityMode.DETAILED` | Nivel de detalle en la salida (`0`: silent, `1`: minimal, `2`: detailed) |
| `fail_fast` | `False` | Detener ejecución tras el primer fallo |
| `start_dir` | `"tests"` | Directorio raíz de pruebas |
| `file_pattern` | `"test_*.py"` | Patrón de archivos de prueba |
| `method_pattern` | `"test*"` | Patrón de métodos de prueba |
| `cache_results` | `False` | Guardar resultados en archivo JSON |

```python
from orionis.foundation.config.testing.enums import VerbosityMode

VerbosityMode.SILENT     # 0 - Sin salida
VerbosityMode.MINIMAL    # 1 - Salida mínima
VerbosityMode.DETAILED   # 2 - Salida detallada
```

---

# Bootstrapping

El proceso de bootstrapping se encarga de inicializar la aplicación, cargar las configuraciones y preparar todos los servicios. Este proceso garantiza que los parámetros estén disponibles y validados antes de que cualquier componente comience a funcionar.

## Archivo de bootstrapping

El archivo `bootstrap/app.py` es el punto central de inicialización. Crea la instancia de `Application`, registra configuraciones, rutas, proveedores de servicios y ejecuta el arranque:

```python
from pathlib import Path
from app.console.scheduler import Scheduler
from app.exceptions.handler import ExceptionHandler
from app.providers.app_service_provider import AppServiceProvider
from orionis.foundation.application import Application

app = Application(
    base_path=Path(__file__).parent.parent,
    compiled=True,
    compiled_path="storage/framework/bootstrap",
    compiled_invalidation_paths=[
        "app", "bootstrap", "config",
        "resources", "routes", ".env"
    ],
)

app.withRouting(
    console="routes/console.py",
    web="routes/web.py",
    api="routes/api.py",
    health="/up",
)

app.withScheduler(Scheduler)
app.withExceptionHandler(ExceptionHandler)

app.withProviders(
    AppServiceProvider,
)

app.create()
```

## Proceso de arranque

Durante `app.create()`, el framework ejecuta las siguientes etapas:

1. **Carga de configuración**: Lee los archivos del directorio `config/` y los combina con los valores predeterminados del framework.
2. **Validación**: Verifica que los tipos y valores sean correctos según las dataclasses definidas.
3. **Registro de proveedores**: Instancia y registra todos los proveedores eager en el contenedor de servicios.
4. **Bloqueo de configuración**: La configuración queda inmutable (congelada) tras el arranque.

## Compilación de configuración

El parámetro `compiled=True` habilita el cache de configuración en el directorio especificado por `compiled_path`. Los paths listados en `compiled_invalidation_paths` son monitoreados para invalidar automáticamente el cache cuando se detectan cambios.

Esto acelera el arranque en producción al evitar la recarga de archivos de configuración en cada inicio.

## Valores predeterminados y fallback

Orionis sigue el principio de "funciona desde el primer momento":

- Cada configuración incluye valores predeterminados seguros para desarrollo.
- Si una configuración no se personaliza, se utilizan los valores del framework.
- Es posible ejecutar una aplicación sin modificar ningún archivo del directorio `config/`.

---

# Configuración personalizada

## Uso de métodos `withConfig`

Además de personalizar los archivos en `config/`, puedes sobrescribir configuraciones directamente en `bootstrap/app.py` mediante los métodos `withConfig*` de la instancia `Application`. Cada método acepta keyword arguments que coinciden con los campos de la dataclass correspondiente:

```python
app.withConfigApp(
    name='Mi Aplicación',
    env='production',
    debug=False,
    workers=4,
)

app.withConfigCors(
    allow_origins=["https://miapp.com"],
    allow_credentials=True,
)

app.withConfigDatabase(
    default="pgsql",
)
```

Los métodos disponibles son:

| Método | Archivo de configuración |
|---|---|
| `withConfigApp()` | `config/app.py` |
| `withConfigAuth()` | `config/auth.py` |
| `withConfigCache()` | `config/cache.py` |
| `withConfigCors()` | `config/cors.py` |
| `withConfigDatabase()` | `config/database.py` |
| `withConfigFilesystems()` | `config/filesystems.py` |
| `withConfigLogging()` | `config/logging.py` |
| `withConfigMail()` | `config/mail.py` |
| `withConfigQueue()` | `config/queue.py` |
| `withConfigSession()` | `config/session.py` |
| `withConfigTesting()` | `config/testing.py` |
| `withConfigPaths()` | Rutas de directorios de la aplicación |

:::note
Los parámetros que no se definan tomarán el valor por defecto de la dataclass correspondiente. Estos métodos deben invocarse **antes** de `app.create()`.
:::

## Configuración de rutas de directorios

El método `withConfigPaths()` permite personalizar las rutas de los directorios de la aplicación. Las claves disponibles corresponden a los directorios principales del proyecto:

```python
app.withConfigPaths(
    app="app",
    console="app/console",
    exceptions="app/exceptions",
    http="app/http",
    models="app/models",
    providers="app/providers",
    notifications="app/notifications",
    services="app/services",
    jobs="app/jobs",
    bootstrap="app/bootstrap",
    config="config",
    database="database/database",
    resources="resources",
    routes="routes",
    storage="storage",
    tests="tests",
)
```

Las rutas se resuelven como relativas al `base_path` de la aplicación.

---

# Acceso en tiempo de ejecución

Una vez que la aplicación ha sido inicializada con `app.create()`, todas las configuraciones están disponibles globalmente.

## Leer configuraciones

Utiliza la facade `Application` con notación de puntos para acceder a cualquier valor de configuración:

```python
from orionis.support.facades.application import Application

# Valores simples
nombre = Application.config('app.name')
entorno = Application.config('app.env')
debug = Application.config('app.debug')

# Valores anidados
host_smtp = Application.config('mail.mailers.smtp.host')
puerto_smtp = Application.config('mail.mailers.smtp.port')
driver_cache = Application.config('cache.default')

# Configuración completa (sin clave)
toda_la_config = Application.config()
```

Si la clave no existe, el método retorna `None`.

## Modificar configuraciones

Puedes alterar configuraciones en tiempo de ejecución proporcionando la clave y el nuevo valor:

```python
from orionis.support.facades.application import Application

Application.config('app.debug', False)
Application.config('cache.default', 'file')
```

:::caution[Precaución]
Modificar configuraciones en tiempo de ejecución puede afectar el comportamiento de la aplicación. Úsalo con precaución, preferiblemente en desarrollo o testing. En aplicaciones con múltiples workers, asegúrate de que los cambios sean consistentes.
:::

## Restaurar configuraciones

Para revertir todos los cambios realizados en tiempo de ejecución y volver a los valores originales del bootstrapping:

```python
from orionis.support.facades.application import Application

Application.resetRuntimeConfig()
```

:::tip[Recomendación]
No accedas directamente al archivo `.env` en tu código. Utiliza siempre `Application.config()` para obtener valores de configuración. La facade garantiza consistencia y centralización durante toda la ejecución.
:::