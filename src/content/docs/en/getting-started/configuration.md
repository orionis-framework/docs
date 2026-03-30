---
title: Configuration
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Configuration Files

`Orionis Framework` manages application configuration using frozen dataclasses (`frozen=True`), centralizing parameters in the `config/` directory. These files allow you to define key aspects such as database, email, sessions, CORS, and other essential behaviors.

Each file defines a dataclass that extends a base framework class and uses `Env.get()` to load values from environment variables, with safe default values as fallback.

## `app.py`

Contains the main application configuration: runtime environment, networking, workers, localization, and encryption.

The configuration is defined using a frozen dataclass that extends the base `App` class:

```python
from dataclasses import dataclass, field
from orionis.foundation.config.app.entities.app import App
from orionis.foundation.config.app.enums.ciphers import Cipher
from orionis.foundation.config.app.enums.environments import Environments
from orionis.services.environment.env import Env

@dataclass(frozen=True, kw_only=True)
class BootstrapApp(App):
    # ... configuration properties
```

### Properties

- **`name`** (`str`) — Application display name.
    - Environment variable: `APP_NAME`
    - Default value: `'Orionis Application'`

- **`env`** (`str | Environments`) — Runtime environment.
    - Environment variable: `APP_ENV`
    - Default value: `Environments.DEVELOPMENT`
    - Options: `DEVELOPMENT`, `TESTING`, `PRODUCTION`

    ```python
    from orionis.foundation.config.app.enums.environments import Environments

    Environments.DEVELOPMENT
    Environments.PRODUCTION
    Environments.TESTING
    ```

- **`debug`** (`bool`) — Debug mode.
    - Environment variable: `APP_DEBUG`
    - Default value: `True`

    :::caution[Security]
    Must be disabled (`False`) in production. When enabled, it displays detailed errors and enables verbose logging.
    :::

- **`host`** (`str`) — IP address the application listens on.
    - Environment variable: `APP_HOST`
    - Default value: `'127.0.0.1'`
    - Use `'0.0.0.0'` to allow external access (with caution in production).

- **`port`** (`int`) — Network port the application listens on.
    - Environment variable: `APP_PORT`
    - Default value: `8000`

- **`workers`** (`int`) — Number of worker processes for handling concurrent requests.
    - Environment variable: `APP_WORKERS`
    - Default value: `1`

    Orionis Framework provides the `Workers` class to automatically calculate the optimal number based on available CPU and RAM:

    ```python
    from orionis.services.system.workers import Workers

    # Automatic calculation based on CPU and RAM (0.5 GB per worker by default)
    workers = Workers().calculate()

    # With custom RAM allocation per worker
    workers = Workers(ram_per_worker=0.5).calculate()
    ```

    If your application is **stateful** (maintains state in memory), keep `workers = 1` or implement a shared cache system (Memcached, Redis). If it is **stateless**, you can increase workers according to server capacity.

- **`reload`** (`bool`) — Automatic reload when code changes are detected.
    - Environment variable: `APP_RELOAD`
    - Default value: `True`
    - Only works with `workers = 1`. Must be disabled in production.

- **`timezone`** (`str`) — Application time zone.
    - Environment variable: `APP_TIMEZONE`
    - Default value: `'UTC'`
    - Accepts any valid time zone: `'America/New_York'`, `'Europe/Madrid'`, `'America/Bogota'`, etc.

- **`locale`** (`str`) — Default regional setting.
    - Environment variable: `APP_LOCALE`
    - Default value: `'en'`

- **`fallback_locale`** (`str`) — Fallback regional setting.
    - Environment variable: `APP_FALLBACK_LOCALE`
    - Default value: `'en'`
    - Used when the primary language is unavailable.

- **`cipher`** (`str | Cipher`) — Encryption algorithm for sensitive data.
    - Environment variable: `APP_CIPHER`
    - Default value: `Cipher.AES_256_CBC`

    ```python
    from orionis.foundation.config.app.enums.ciphers import Cipher

    Cipher.AES_128_CBC
    Cipher.AES_256_CBC
    Cipher.AES_128_GCM   # Authenticated encryption
    Cipher.AES_256_GCM   # Authenticated encryption
    ```

- **`key`** (`str | None`) — Application encryption key.
    - Environment variable: `APP_KEY`
    - Default value: `None`

    :::caution[Security]
    Must be a secure, unique, and secret key. Always store it in environment variables, never in source code.
    :::

- **`maintenance`** (`str | bool`) — Maintenance mode flag.
    - Environment variable: `APP_MAINTENANCE`
    - Default value: `False`

## `auth.py`

Defines the authentication system configuration. Currently inherits the base structure without additional custom fields:

```python
from dataclasses import dataclass
from orionis.foundation.config.auth.entities.auth import Auth

@dataclass(frozen=True, kw_only=True)
class BootstrapAppAuth(Auth):
    pass
```

This file will be extended with additional fields in future framework versions.

## `cache.py`

Configures the application's caching system. By default, it uses file-based storage.

### Properties

- **`default`** (`Drivers | str`) — Default cache driver.
    - Environment variable: `CACHE_STORE`
    - Default value: `Drivers.FILE`

- **`stores`** (`Stores | dict`) — Available store configurations.
    - **`file`**: File-based caching.
        - `path`: Storage path. Environment variable: `CACHE_FILE_PATH`. Default: `"storage/framework/cache/data"`.

## `cors.py`

Configures CORS (Cross-Origin Resource Sharing) behavior, controlling which external origins can interact with your API and under what conditions.

When a browser makes a request from a different origin (domain, protocol, or port), the server responds with CORS headers automatically generated from this configuration.

### Properties

- **`allow_origins`** (`list[str]`) — Allowed origins that can access the API.
    - Default value: `["*"]`
    - Specify concrete domains in production: `["https://myapp.com", "https://admin.myapp.com"]`

- **`allow_origin_regex`** (`str | None`) — Regular expression for pattern-based origins.
    - Default value: `None`
    - Example: `r"^https://.*\.myapp\.com$"` for dynamic subdomains.

- **`allow_methods`** (`list[str]`) — HTTP methods allowed in CORS requests.
    - Default value: `["*"]`
    - Restrict in production: `["GET", "POST", "PUT", "DELETE"]`

- **`allow_headers`** (`list[str]`) — HTTP headers the client is allowed to send.
    - Default value: `["*"]`

- **`expose_headers`** (`list[str]`) — Headers exposed to the browser in the response.
    - Default value: `[]`

- **`allow_credentials`** (`bool`) — Allows credentials (cookies, authorization headers) in CORS requests.
    - Default value: `False`

    :::note
    If `allow_credentials` is `True`, you cannot use `["*"]` in `allow_origins` (CORS standard restriction). You must specify concrete origins.
    :::

- **`max_age`** (`int | None`) — Seconds to cache the preflight (`OPTIONS`) response.
    - Default value: `600` (10 minutes)

Since lists cannot be used as default values directly in dataclasses, use `field` with `default_factory`:

```python
from dataclasses import dataclass, field
from orionis.foundation.config.cors.entities.cors import Cors

@dataclass(frozen=True, kw_only=True)
class BootstrapCors(Cors):
    allow_origins: list[str] = field(
        default_factory=lambda: ["https://myapp.com", "https://admin.myapp.com"]
    )
```

## `database.py`

Defines the application's database connections. Supports multiple drivers: SQLite, MySQL, PostgreSQL, and Oracle.

### Properties

- **`default`** (`str`) — Default database connection.
    - Environment variable: `DB_CONNECTION`
    - Default value: `"sqlite"`

- **`connections`** (`Connections | dict`) — Available connections.

### SQLite

| Property | Environment Variable | Default Value |
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

| Property | Environment Variable | Default Value |
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

| Property | Environment Variable | Default Value |
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

| Property | Environment Variable | Default Value |
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

Defines the application's filesystem using a multi-disk pattern, where each disk represents a storage location with its own configuration.

### Properties

- **`default`** (`str`) — Default storage disk.
    - Environment variable: `FILESYSTEM_DISK`
    - Default value: `"local"`
    - Options: `"local"`, `"public"`, `"aws"`

- **`disks`** (`Disks | dict`) — Available disks.

### `local` Disk — Private Storage

- **`path`**: Storage path. Default: `"storage/app/private"`.

### `public` Disk — Public Storage

- **`path`**: Storage path. Default: `"storage/app/public"`.
- **`url`**: Base URL for web access. Default: `"/static"`.

### `aws` Disk — Amazon S3

| Property | Default Value | Description |
|---|---|---|
| `key` | `""` | AWS Access Key ID |
| `secret` | `""` | AWS Secret Access Key |
| `region` | `"us-east-1"` | Bucket region |
| `bucket` | `""` | Bucket name |
| `url` | `None` | Custom URL (CloudFront) |
| `endpoint` | `None` | Custom endpoint (MinIO) |
| `use_path_style_endpoint` | `False` | Path-style vs subdomain-style |
| `throw` | `False` | Throw exceptions on errors |

:::tip[Recommendation]
Use `local` and `public` disks during development. In production, consider `aws` for scalability. Always keep AWS credentials in environment variables.
:::

## `logging.py`

Configures the logging system with multiple channels representing different storage and rotation strategies.

### Properties

- **`default`** (`str`) — Default logging channel.
    - Environment variable: `LOG_CHANNEL`
    - Default value: `"stack"`
    - Options: `"stack"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"chunked"`

- **`channels`** (`Channels | dict`) — Available channels.

### `stack` Channel — Cumulative Logging

Basic logging without automatic rotation.

| Property | Default Value |
|---|---|
| `path` | `"storage/logs/stack.log"` |
| `level` | `Level.INFO` |

### `hourly` Channel — Hourly Rotation

| Property | Default Value |
|---|---|
| `path` | `"storage/logs/hourly_{suffix}.log"` |
| `level` | `Level.INFO` |
| `retention_hours` | `24` |

### `daily` Channel — Daily Rotation

| Property | Default Value |
|---|---|
| `path` | `"storage/logs/daily_{suffix}.log"` |
| `level` | `Level.INFO` |
| `retention_days` | `7` |
| `at` | `time(0, 0)` (midnight) |

### `weekly` Channel — Weekly Rotation

| Property | Default Value |
|---|---|
| `path` | `"storage/logs/weekly_{suffix}.log"` |
| `level` | `Level.INFO` |
| `retention_weeks` | `4` |

### `monthly` Channel — Monthly Rotation

| Property | Default Value |
|---|---|
| `path` | `"storage/logs/monthly_{suffix}.log"` |
| `level` | `Level.INFO` |
| `retention_months` | `4` |

### `chunked` Channel — Size-Based Rotation

| Property | Default Value |
|---|---|
| `path` | `"storage/logs/chunked_{suffix}.log"` |
| `level` | `Level.INFO` |
| `mb_size` | `10` MB |
| `files` | `5` files maximum |

### Logging Levels

```python
from orionis.foundation.config.logging.enums.levels import Level

Level.DEBUG       # Detailed information for debugging
Level.INFO        # General operational information
Level.WARNING     # Warnings that do not prevent operation
Level.ERROR       # Errors affecting specific functionalities
Level.CRITICAL    # Critical errors that may stop the application
```

## `mail.py`

Defines the available email transports: SMTP for real delivery and file-based storage for development.

### Properties

- **`default`** (`str`) — Default transport.
    - Environment variable: `MAIL_MAILER`
    - Default value: `"smtp"`
    - Options: `"smtp"`, `"file"`

- **`mailers`** (`Mailers | dict`) — Available transports.

### `smtp` Transport

| Property | Environment Variable | Default Value |
|---|---|---|
| `url` | `MAIL_URL` | `""` |
| `host` | `MAIL_HOST` | `""` |
| `port` | `MAIL_PORT` | `587` |
| `encryption` | `MAIL_ENCRYPTION` | `"TLS"` |
| `username` | `MAIL_USERNAME` | `""` |
| `password` | `MAIL_PASSWORD` | `""` |
| `timeout` | — | `None` |

### `file` Transport

- **`path`**: Storage directory. Default: `"storage/mail"`.

Ideal for development and testing — emails are saved as files for inspection without actual delivery.

### Common SMTP Providers

```python
# Gmail
smtp = Smtp(host="smtp.gmail.com", port=587, encryption="TLS",
            username="your_email@gmail.com", password="your_app_password")

# SendGrid
smtp = Smtp(host="smtp.sendgrid.net", port=587, encryption="TLS",
            username="apikey", password="your_api_key")

# Outlook
smtp = Smtp(host="smtp-mail.outlook.com", port=587, encryption="TLS",
            username="your_email@outlook.com", password="your_password")

# Mailgun
smtp = Smtp(host="smtp.mailgun.org", port=587, encryption="TLS",
            username="postmaster@your_domain.mailgun.org", password="your_password")
```

## `queue.py`

Configures the application's job queue system.

### Properties

- **`default`** (`str`) — Default queue connection.
    - Environment variable: `QUEUE_CONNECTION`
    - Default value: `"async"`

- **`brokers`** (`Brokers | dict`) — Available brokers.

### `database` Broker

| Property | Default Value | Description |
|---|---|---|
| `jobs_table` | `"jobs"` | Jobs table |
| `failed_jobs_table` | `"failed_jobs"` | Failed jobs table |
| `queue` | `"default"` | Queue name |
| `visibility_timeout` | `60` | Seconds before a job becomes visible again |
| `retry_delay` | `90` | Seconds between retries |
| `max_attempts` | `3` | Maximum attempts per job |
| `strategy` | `Strategy.FIFO` | Processing strategy (First In, First Out) |

## `session.py`

Configures the application's HTTP session handling.

### Properties

| Property | Environment Variable | Default Value | Description |
|---|---|---|---|
| `secret_key` | `APP_KEY` | — | Key for signing session cookies |
| `session_cookie` | `SESSION_COOKIE_NAME` | `"orionis_session"` | Cookie name |
| `max_age` | `SESSION_MAX_AGE` | `1800` (30 min) | Duration in seconds (`None` = until browser closes) |
| `same_site` | `SESSION_SAME_SITE` | `SameSitePolicy.LAX` | SameSite policy: `lax`, `strict`, `none` |
| `path` | `SESSION_PATH` | `"/"` | Cookie path |
| `https_only` | `SESSION_HTTPS_ONLY` | `False` | Restrict to HTTPS |
| `domain` | `SESSION_DOMAIN` | `None` | Cookie domain |

:::note
If `same_site` is `"none"`, `https_only` must be `True` (cookie standard requirement).
:::

## `testing.py`

Configures the behavior of the framework's automated tests.

### Properties

| Property | Default Value | Description |
|---|---|---|
| `verbosity` | `VerbosityMode.DETAILED` | Output detail level (`0`: silent, `1`: minimal, `2`: detailed) |
| `fail_fast` | `False` | Stop execution after the first failure |
| `start_dir` | `"tests"` | Root test directory |
| `file_pattern` | `"test_*.py"` | Test file pattern |
| `method_pattern` | `"test*"` | Test method pattern |
| `cache_results` | `False` | Save results to a JSON file |

```python
from orionis.foundation.config.testing.enums import VerbosityMode

VerbosityMode.SILENT     # 0 - No output
VerbosityMode.MINIMAL    # 1 - Minimal output
VerbosityMode.DETAILED   # 2 - Detailed output
```

---

# Bootstrapping

The bootstrapping process is responsible for initializing the application, loading configurations, and preparing all services. This process ensures that parameters are available and validated before any component starts operating.

## Bootstrapping File

The `bootstrap/app.py` file is the central initialization point. It creates the `Application` instance, registers configurations, routes, service providers, and executes the startup:

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

## Startup Process

During `app.create()`, the framework executes the following stages:

1. **Configuration loading**: Reads files from the `config/` directory and merges them with the framework's default values.
2. **Validation**: Verifies that types and values are correct according to the defined dataclasses.
3. **Provider registration**: Instantiates and registers all eager providers in the service container.
4. **Configuration lock**: The configuration becomes immutable (frozen) after startup.

## Configuration Compilation

The `compiled=True` parameter enables configuration caching in the directory specified by `compiled_path`. The paths listed in `compiled_invalidation_paths` are monitored to automatically invalidate the cache when changes are detected.

This speeds up startup in production by avoiding configuration file reloads on each start.

## Default Values and Fallback

Orionis follows the principle of "works out of the box":

- Every configuration includes safe default values for development.
- If a configuration is not customized, the framework's defaults are used.
- It is possible to run an application without modifying any file in the `config/` directory.

---

# Custom Configuration

## Using `withConfig` Methods

In addition to customizing files in `config/`, you can override configurations directly in `bootstrap/app.py` using the `withConfig*` methods on the `Application` instance. Each method accepts keyword arguments matching the fields of the corresponding dataclass:

```python
app.withConfigApp(
    name='My Application',
    env='production',
    debug=False,
    workers=4,
)

app.withConfigCors(
    allow_origins=["https://myapp.com"],
    allow_credentials=True,
)

app.withConfigDatabase(
    default="pgsql",
)
```

The available methods are:

| Method | Configuration File |
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
| `withConfigPaths()` | Application directory paths |

:::note
Parameters not provided will use the default value from the corresponding dataclass. These methods must be called **before** `app.create()`.
:::

## Directory Path Configuration

The `withConfigPaths()` method allows you to customize the application's directory paths. The available keys correspond to the project's main directories:

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

Paths are resolved relative to the application's `base_path`.

---

# Runtime Access

Once the application has been initialized with `app.create()`, all configurations are available globally.

## Reading Configurations

Use the `Application` facade with dot notation to access any configuration value:

```python
from orionis.support.facades.application import Application

# Simple values
name = Application.config('app.name')
environment = Application.config('app.env')
debug = Application.config('app.debug')

# Nested values
smtp_host = Application.config('mail.mailers.smtp.host')
smtp_port = Application.config('mail.mailers.smtp.port')
cache_driver = Application.config('cache.default')

# Full configuration (no key)
all_config = Application.config()
```

If the key does not exist, the method returns `None`.

## Modifying Configurations

You can alter configurations at runtime by providing the key and the new value:

```python
from orionis.support.facades.application import Application

Application.config('app.debug', False)
Application.config('cache.default', 'file')
```

:::caution[Caution]
Modifying configurations at runtime can affect application behavior. Use with care, preferably in development or testing. In multi-worker applications, ensure changes are consistent.
:::

## Restoring Configurations

To revert all runtime changes and return to the original bootstrapping values:

```python
from orionis.support.facades.application import Application

Application.resetRuntimeConfig()
```

:::tip[Recommendation]
Do not access the `.env` file directly in your code. Always use `Application.config()` to retrieve configuration values. The facade ensures consistency and centralization throughout the entire execution.
:::