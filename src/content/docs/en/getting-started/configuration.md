---
title: Configuration
---

## Configuration Files

`Orionis Framework` manages application configuration using dataclasses, centralizing parameters in the `config/` directory. These files allow you to define key aspects such as database, email, sessions, and other essential behaviors.

Each file extends a base class with default values, which you can override according to your project requirements.

Below are the main configuration files, their properties, and available options.

### `app.py`

The `app.py` file contains the main configuration for your `Orionis Framework` application, defining essential parameters such as environment, debugging, networking, workers, localization, and encryption. This centralized configuration allows you to adapt the application's behavior according to your project's needs and deployment environment.

#### How does application configuration work in Orionis Framework?

Configuration is defined using a `dataclass` that extends the base `App` class, leveraging environment variables for specific values and providing safe defaults. This enables you to maintain different configurations for development, testing, and production without changing your code.

#### Configuration structure

```python
# app.py
from dataclasses import dataclass
from orionis.foundation.config.app.entities.app import App
from orionis.foundation.config.app.enums.ciphers import Cipher
from orionis.foundation.config.app.enums.environments import Environments
from orionis.services.environment.env import Env
from orionis.services.system.workers import Workers

@dataclass
class BootstrapApp(App):
  # ... configuration properties
```

#### Main configuration properties

Below are all available options, their purpose, and usage examples:

- **`name`**
  Application name.
  - Loaded from the `APP_NAME` environment variable or defaults to `'Orionis Application'`.
  - Used in browser titles, logs, and internal framework references.
  - Example: `name = Env.get('APP_NAME', 'My Web Application')`

- **`env`**
  Application runtime environment.
  - Loaded from `APP_ENV` or defaults to `Environments.DEVELOPMENT`.
  - Available options: `DEVELOPMENT`, `TESTING`, `PRODUCTION`.
  - Affects logging, error handling, and optimizations.

  You can use the provided ENUM:
  ```python
  from orionis.foundation.config.app.enums.environments import Environments

  # Available options:
  Environments.DEVELOPMENT
  Environments.PRODUCTION
  Environments.TESTING
  ```

  Or assign the environment as a string:
  ```python
  env = "development"  # Or "production", "testing"
  ```

- **`debug`**
  Application debug mode.
  - Loaded from `APP_DEBUG` or defaults to `True`.
  - When enabled (`True`): shows detailed errors, enables auto-reload, and verbose logs.
  - **Important:** Should be disabled (`False`) in production for security.

- **`host`**
  IP address the application listens on.
  - Loaded from `APP_HOST` or defaults to `'127.0.0.1'`.
  - `'127.0.0.1'`: Local access only (recommended with a reverse proxy like `Nginx` or `Apache`).
  - `'0.0.0.0'`: Allows external access (use with caution in production).

- **`port`**
  Network port the application listens on.
  - Loaded from `APP_PORT` or defaults to `8000`.
  - Ports below `1024` require administrator privileges.
  - Common suggestions: `80` for HTTP, `443` for HTTPS in production.

- **`workers`**
  Number of worker processes for handling concurrent requests.
  - Loaded from `APP_WORKERS` or uses `Workers().calculate()` for automatic calculation.
  - Defaults to `1`, but you can increase it for better performance in production.

  Consider if your application is `stateful` (keeps state in memory) or `stateless` (each request is independent):

  - **Stateful**: Keep `workers = 1` or implement Orionis Framework's `Cache` system (e.g., using `Memcached` or `Redis` in a separate container) to share state between processes.
  - **Stateless**: You can increase the number of workers according to server capacity. A general rule is `2 × CPU cores + 1`.

  Orionis Framework allows automatic calculation of optimal workers:
  ```python
  from orionis.services.system.workers import Workers

  workers = Workers()
  real_workers = workers.calculate()
  ```

  Recommended example in `app.py`:
  ```python
  from orionis.services.system.workers import Workers

  @dataclass
  class BootstrapApp(App):
    workers = Env.get('APP_WORKERS', Workers().calculate())
  ```

  To assign memory per worker:
  ```python
  workers = Env.get('APP_WORKERS', Workers(ram_per_worker=0.5).calculate())
  # Or
  workers = Env.get('APP_WORKERS', Workers().setRamPerWorker(0.5).calculate())
  ```

  **Important note**: Use the class directly in configuration files, as the facade is only available after application bootstrap.

- **`reload`**
  Automatic reload when code changes are detected.
  - Loaded from `APP_RELOAD` or defaults to `True`.
  - Useful in development, should be disabled (`False`) in production.
  - Only works with `workers = 1`.

- **`timezone`**
  Default application time zone.
  - Loaded from `APP_TIMEZONE` or defaults to `'America/Bogota'`.
  - You can set any valid time zone, such as `'UTC'`, `'America/New_York'`, `'Europe/Madrid'`, `'America/Bogota'`, etc.
  - Affects date and time formatting throughout the application.

- **`locale`**
  Default regional setting.
  - Loaded from `APP_LOCALE` or defaults to `'en'`.
  - You can change it to `'es'`, `'fr'`, `'de'`, etc.
  - Defines language for messages, number, and date formats.

- **`fallback_locale`**
  Fallback regional setting.
  - Loaded from `APP_FALLBACK_LOCALE` or defaults to `'en'`.
  - Used when the main language is unavailable.
  - Ensures the application always has a functional language.

- **`cipher`**
  Encryption algorithm for protecting sensitive data.
  - Loaded from `APP_CIPHER` or defaults to `Cipher.AES_256_CBC`.
  - Default: `AES-256-CBC`. Available options: `AES-128-CBC`, `AES-256-CBC`, `AES-128-GCM`, `AES-256-GCM`.
  - `AES-256` offers higher security than `AES-128`.
  - `GCM` provides authenticated encryption, `CBC` is more compatible.

  Orionis Framework provides an ENUM for encryption algorithms:
  ```python
  from orionis.foundation.config.app.enums.ciphers import Cipher

  # Available options:
  Cipher.AES_128_CBC
  Cipher.AES_256_CBC
  Cipher.AES_128_GCM
  Cipher.AES_256_GCM
  ```

- **`key`**
  Encryption key used by the specified algorithm.
  - Loaded from `APP_KEY` (no default value for security).
  - **Critical:** Must be a secure, unique, and secret key per application.
  - Always store it in environment variables, never in source code.
  - Change this key if security is compromised.

#### Configuration recommendations

- **Development:** Use `debug=True`, `reload=True`, `workers=1` for easier development.
- **Production:** Set `debug=False`, `reload=False`, optimize `workers` according to hardware.
- **Security:** Keep `key` in environment variables and use HTTPS in production.
- **Environment variables:** Use `.env` files for environment-specific configurations.

#### Additional considerations

- Changes to `app.py` require restarting the application to take effect.
- The framework automatically validates configuration types and values.
- Use `Workers().calculate()` to leverage automatic optimal worker calculation.
- Configuration is loaded once during application initialization and remains immutable during execution.

### `auth.py`

This configuration file is still under development and will be available in future versions of `Orionis Framework`.

### `cache.py`

This configuration file is still under development and will be available in future versions of `Orionis Framework`.

### `cors.py`

The `cors.py` file allows you to configure CORS (Cross-Origin Resource Sharing) behavior in your Orionis Framework application, controlling how and from where clients can access your API. CORS is essential for the security and functionality of modern web applications, as it defines which external origins can interact with your backend and under what conditions.

#### How does CORS work in Orionis Framework?

When a browser makes a request to your API from a different origin (domain, protocol, or port), the server responds with CORS headers indicating whether the request is allowed. Orionis Framework uses the configuration defined in `cors.py` to automatically generate these headers for every response.

#### Main configuration properties

Below are all available options, their purpose, and usage examples:

- **`allow_origins`**
  List of allowed origins that can access the API.
  - Use `["*"]` to allow any origin (not recommended in production for security reasons).
  - You can specify specific domains, e.g.: `["https://myapp.com", "https://admin.myapp.com"]`.
  - If a request comes from an origin not included, it will be rejected by the browser.

- **`allow_origin_regex`**
  Regular expression to allow origins matching a pattern.
  - Useful for allowing dynamic subdomains, e.g.: `r"^https://.*\.myapp\.com$"`.
  - If defined, it takes precedence over `allow_origins`.

- **`allow_methods`**
  List of HTTP methods allowed in CORS requests.
  - Use `["*"]` to allow all methods (`GET`, `POST`, `PUT`, `DELETE`, etc.).
  - You can restrict to specific methods: `["GET", "POST"]`.

- **`allow_headers`**
  List of HTTP headers the client can send in CORS requests.
  - Use `["*"]` to allow all headers.
  - For better security, limit to only those needed: `["Authorization", "Content-Type"]`.

- **`expose_headers`**
  List of headers the browser can access in the response.
  - By default, the browser only exposes standard headers.
  - Example: `["X-Custom-Header", "Authorization"]`.

- **`allow_credentials`**
  Allows the use of credentials (cookies, authorization headers, etc.) in CORS requests.
  - If set to `True`, the browser will send and receive credentials.
  - Important: You cannot use `["*"]` in `allow_origins` if `allow_credentials` is `True` (due to CORS standard restrictions).

- **`max_age`**
  Maximum time (in seconds) the browser can cache the preflight (`OPTIONS`) response.
  - Reduces the number of preflight requests and improves performance.
  - Example: `max_age = 600` (10 minutes).

#### Security recommendations

- **Production:** Limit allowed origins and methods, and enable credentials only if necessary.
- **Development:** You can use more permissive values (`["*"]`) for testing, but never use them in production.
- **Custom headers:** Only expose the headers your frontend actually needs.

#### Additional considerations

- If you use credentials (`allow_credentials = True`), you must specify explicit origins in `allow_origins`.
- Changes to `cors.py` are applied automatically when you restart the application.
- Orionis Framework validates and enforces these rules on every request, ensuring compliance with the CORS standard.
- You must use `field` to assign lists to configuration properties, due to limitations of Python `dataclasses`.

Example:
```python
# cors.py
from dataclasses import dataclass, field

#...
@dataclass
class BootstrapCors(Cors):

  # ...
  allow_origins: List[str] = field(
    default_factory = lambda: ["myapp.com", "admin.myapp.com"]
  )
```

This configuration lets you adapt API access according to your project's needs, maintaining a balance between functionality and security.

### `database.py`

This configuration file is still under development and will be available in future versions of `Orionis Framework`.

### `filesystems.py`

The `filesystems.py` file defines the filesystem configuration for `Orionis Framework`, enabling you to manage different types of storage such as local disks, public storage, and cloud services like AWS S3. This centralized configuration streamlines file handling for both internal application use and public files accessible by users.

#### How does the filesystem work in Orionis Framework?

The filesystem uses a multi-disk pattern, where each disk represents a different storage location with its own settings. You can dynamically switch between disks as needed, providing flexibility for storing various types of files.

#### Configuration structure

```python
# filesystems.py
from dataclasses import dataclass
from orionis.foundation.config.filesystems.entitites.aws import S3
from orionis.foundation.config.filesystems.entitites.disks import Disks
from orionis.foundation.config.filesystems.entitites.filesystems import Filesystems
from orionis.foundation.config.filesystems.entitites.local import Local
from orionis.foundation.config.filesystems.entitites.public import Public

@dataclass
class BootstrapFilesystems(Filesystems):
  # ... configuration properties
```

#### Main configuration properties

Below are all available options, their purpose, and usage examples:

- **`default`**
  Name of the default filesystem disk to use.
  - Default: The value of the `"FILESYSTEM_DISK"` environment variable, or `"local"` if not set.
  - Specifies which disk is used when none is explicitly indicated.
  - Common options: `"local"`, `"public"`, `"aws"`.

- **`disks`**
  Configuration for the different filesystem disks available to the application.
  - Default: An instance of `Disks` with default values.
  - Contains settings for each available storage type.

#### Available disk configurations

##### **`local`** – Private local disk
Configuration for private local storage.
- **`path`**: Path where private files are stored.
  - Default: `"storage/app/private"`.
- Ideal for: Configuration files, internal logs, temporary data not meant to be public.

##### **`public`** – Public disk
Configuration for publicly accessible storage via the web.
- **`path`**: Path where public files are stored.
  - Default: `"storage/app/public"`.
- **`url`**: Base URL to access public files.
  - Default: `"/static"`.
- Ideal for: User images, public assets, downloadable files.

##### **`aws`** – Amazon S3
Configuration for cloud storage using Amazon S3.
- **`key`**: AWS Access Key ID.
  - Default: `""` (must be set).
  - Obtain from AWS IAM console.

- **`secret`**: AWS Secret Access Key.
  - Default: `""` (must be set).
  - Keep secure and never expose in source code.

- **`region`**: AWS region where the bucket is located.
  - Default: `"us-east-1"`.
  - Examples: `"us-west-2"`, `"eu-west-1"`, `"ap-southeast-1"`.

- **`bucket`**: S3 bucket name.
  - Default: `""` (must be set).
  - Must already exist in your AWS account.

- **`url`**: Custom URL to access the bucket (optional).
  - Default: `None` (uses standard S3 URL).
  - Useful for CloudFront or custom domains.

- **`endpoint`**: Custom S3 endpoint (optional).
  - Default: `None` (uses standard endpoint).
  - Useful for S3-compatible services like MinIO.

- **`use_path_style_endpoint`**: Use path-style instead of virtual-hosted-style URLs.
  - Default: `False`.
  - Set to `True` for S3-compatible services that require it.

- **`throw`**: Throw exceptions on operation errors.
  - Default: `False`.
  - Set to `True` for strict error handling.

#### Configuration recommendations

- **Development:** Mainly use `local` and `public` disks for simplicity and speed.
- **Production:** Consider using `aws` for scalability and redundancy in large applications.
- **Security:** Keep AWS credentials in environment variables, never in source code.
- **Performance:** Use `public` for frequently accessed static files.

#### Additional considerations

- Changes to `filesystems.py` require restarting the application to take effect.
- Ensure local storage paths have appropriate write permissions.
- For AWS S3, verify credentials have the necessary permissions for the bucket.
- The framework automatically validates configurations and provides descriptive error messages if something is misconfigured.

### `logging.py`

The `logging.py` file defines the logging system configuration for `Orionis Framework`, allowing you to manage multiple logging channels with rotation strategies, retention policies, and custom log levels. This centralized configuration streamlines monitoring, debugging, and auditing through a flexible system of structured logs.

#### How does logging work in Orionis Framework?

The logging system uses multiple channels, each representing a different strategy for storing and rotating logs. You can configure different logging levels, file paths, retention policies, and rotation strategies according to your application's monitoring needs.

#### Configuration structure

```python
# logging.py
from dataclasses import dataclass
from datetime import time
from orionis.foundation.config.logging.entities.channels import Channels
from orionis.foundation.config.logging.entities.chunked import Chunked
from orionis.foundation.config.logging.entities.daily import Daily
from orionis.foundation.config.logging.entities.hourly import Hourly
from orionis.foundation.config.logging.entities.logging import Logging
from orionis.foundation.config.logging.entities.monthly import Monthly
from orionis.foundation.config.logging.entities.stack import Stack
from orionis.foundation.config.logging.entities.weekly import Weekly
from orionis.foundation.config.logging.enums.levels import Level

@dataclass
class BootstrapLogging(Logging):
  # ... configuration properties
```

#### Main configuration properties

Below are all available options, their purpose, and usage examples:

- **`default`**
  Name of the default logging channel to use.
  - Default: The value of the `"LOG_CHANNEL"` environment variable, or `"stack"` if not set.
  - Specifies which channel is used when none is explicitly indicated.
  - Available options: `"stack"`, `"hourly"`, `"daily"`, `"weekly"`, `"monthly"`, `"chunked"`.

- **`channels`**
  Configuration for the different logging channels available to the application.
  - Default: An instance of `Channels` with default settings.
  - Contains the configuration for each available logging strategy.

#### Available logging channel configurations

##### **`stack`** – Basic cumulative logging
Configuration for basic logging without automatic rotation.
- **`path`**: Log file path.
  - Default: `'storage/logs/stack.log'`.
- **`level`**: Minimum logging level.
  - Default: `Level.INFO`.
- Ideal for: Development, simple logs, basic debugging.

##### **`hourly`** – Hourly rotation
Configuration for logging with rotation every hour.
- **`path`**: Log file path.
  - Default: `'storage/logs/hourly.log'`.
- **`level`**: Minimum logging level.
  - Default: `Level.INFO`.
- **`retention_hours`**: Number of hours to retain log files.
  - Default: `24` (keeps logs for the last 24 hours).
- Ideal for: High-activity applications, granular event monitoring.

##### **`daily`** – Daily rotation
Configuration for logging with daily rotation.
- **`path`**: Log file path.
  - Default: `'storage/logs/daily.log'`.
- **`level`**: Minimum logging level.
  - Default: `Level.INFO`.
- **`retention_days`**: Number of days to retain log files.
  - Default: `7` (keeps logs for the last week).
- **`at`**: Specific time for rotation.
  - Default: `time(0, 0)` (midnight).
- Ideal for: Production applications, daily auditing, trend analysis.

##### **`weekly`** – Weekly rotation
Configuration for logging with weekly rotation.
- **`path`**: Log file path.
  - Default: `'storage/logs/weekly.log'`.
- **`level`**: Minimum logging level.
  - Default: `Level.INFO`.
- **`retention_weeks`**: Number of weeks to retain log files.
  - Default: `4` (keeps logs for the last month).
- Ideal for: Weekly trend analysis, periodic reports, lower-activity applications.

##### **`monthly`** – Monthly rotation
Configuration for logging with monthly rotation.
- **`path`**: Log file path.
  - Default: `'storage/logs/monthly.log'`.
- **`level`**: Minimum logging level.
  - Default: `Level.INFO`.
- **`retention_months`**: Number of months to retain log files.
  - Default: `4` (keeps logs for the last 4 months).
- Ideal for: Historical archives, regulatory compliance, long-term analysis.

##### **`chunked`** – Size-based rotation
Configuration for logging with rotation based on file size.
- **`path`**: Log file path.
  - Default: `'storage/logs/chunked.log'`.
- **`level`**: Minimum logging level.
  - Default: `Level.INFO`.
- **`mb_size`**: Maximum file size in MB.
  - Default: `10` MB.
- **`files`**: Maximum number of files to keep.
  - Default: `5` files.
- Ideal for: Disk space control, applications with variable log volume.

#### Available logging levels

Logging levels follow the Python logging standard:

- **`Level.DEBUG`**: Detailed information for debugging.
- **`Level.INFO`**: General operational information.
- **`Level.WARNING`**: Warnings that do not prevent operation.
- **`Level.ERROR`**: Errors affecting specific functionalities.
- **`Level.CRITICAL`**: Critical errors that may stop the application.

#### Configuration recommendations

- **Development:** Use `stack` or `daily` with `DEBUG` level for maximum information.
- **Production:** Combine `daily` for general logs and `chunked` for disk space control.
- **Intensive monitoring:** Use `hourly` for critical, high-activity applications.
- **Historical archives:** Configure `monthly` for compliance and long-term audits.

#### Additional considerations

- Log files are rotated automatically according to the configured strategy.
- Ensure logging paths have appropriate write permissions.
- Old logs are deleted automatically based on retention policies.
- The framework automatically creates directories if they do not exist.
- You can use multiple channels simultaneously for different event types.

### `mail.py`

The `mail.py` file defines the email system configuration for `Orionis Framework`, allowing you to manage different email transports such as SMTP for real delivery and local files for development and testing. This centralized configuration streamlines email sending from your application, with support for multiple providers and delivery strategies.

#### How does the mail system work in Orionis Framework?

The mail system uses multiple mailers (transports), where each mailer represents a different strategy for delivering emails. You can switch between transports depending on the environment (development, testing, production) without changing your application code—just update the configuration.

#### Configuration structure

```python
# mail.py
from dataclasses import dataclass
from orionis.foundation.config.mail.entities.file import File
from orionis.foundation.config.mail.entities.mail import Mail
from orionis.foundation.config.mail.entities.mailers import Mailers
from orionis.foundation.config.mail.entities.smtp import Smtp
from orionis.services.environment.env import Env

@dataclass
class BootstrapMail(Mail):
  # ... configuration properties
```

#### Main configuration properties

Below are all available options, their purpose, and usage examples:

- **`default`**
  Name of the default mailer (transport) used for sending emails.
  - Loaded from the `MAIL_MAILER` environment variable or defaults to `'smtp'`.
  - Specifies which transport will be used when none is explicitly indicated.
  - Available options: `"smtp"`, `"file"`, etc.

- **`mailers`**
  Configuration for the different email transports available to the application.
  - Default: An instance of `Mailers` with default settings.
  - Contains the configuration for each available email delivery strategy.

#### Available mailer configurations

##### **`smtp`** – SMTP Server
Configuration for sending emails via an SMTP server.
- **`url`**: Full SMTP connection URL (optional, alternative to individual settings).
  - Loaded from `MAIL_URL` or defaults to `''`.
  - Format: `smtp://user:password@server:port`
  - If defined, it takes precedence over individual settings.

- **`host`**: SMTP server for sending emails.
  - Loaded from `MAIL_HOST` or defaults to `''`.
  - Examples: `smtp.gmail.com`, `smtp.mailgun.org`, `localhost`.

- **`port`**: SMTP server port.
  - Loaded from `MAIL_PORT` or defaults to `587`.
  - Common ports: `25` (no encryption), `587` (STARTTLS), `465` (SSL/TLS).

- **`encryption`**: Encryption type for the SMTP connection.
  - Loaded from `MAIL_ENCRYPTION` or defaults to `'TLS'`.
  - Options: `'TLS'` (STARTTLS), `'SSL'` (SSL/TLS), `None` (no encryption).

- **`username`**: Username for SMTP authentication.
  - Loaded from `MAIL_USERNAME` or defaults to `''`.
  - Usually the email address or a specific username.

- **`password`**: Password for SMTP authentication.
  - Loaded from `MAIL_PASSWORD` or defaults to `''`.
  - **Important:** Always keep in environment variables for security.

- **`timeout`**: SMTP connection timeout in seconds.
  - Default: `None` (uses system default timeout).
  - Useful for adjusting behavior on slow networks or remote servers.

##### **`file`** – File Storage
Configuration for saving emails as files instead of sending them.
- **`path`**: Directory where emails are stored as files.
  - Default: `"storage/mail"`.
  - Emails are saved in `.eml` format for later inspection.
- Ideal for: Development, testing, debugging emails without real delivery.

#### Popular SMTP provider configurations

##### Gmail
```python
smtp = Smtp(
  host = "smtp.gmail.com",
  port = 587,
  encryption = "TLS",
  username = "your_email@gmail.com",
  password = "your_app_password"
)
```

##### Outlook/Hotmail
```python
smtp = Smtp(
  host = "smtp-mail.outlook.com",
  port = 587,
  encryption = "TLS",
  username = "your_email@outlook.com",
  password = "your_password"
)
```

##### SendGrid
```python
smtp = Smtp(
  host = "smtp.sendgrid.net",
  port = 587,
  encryption = "TLS",
  username = "apikey",
  password = "your_sendgrid_api_key"
)
```

##### Mailgun
```python
smtp = Smtp(
  host = "smtp.mailgun.org",
  port = 587,
  encryption = "TLS",
  username = "postmaster@your_domain.mailgun.org",
  password = "your_mailgun_password"
)
```

#### Configuration recommendations

- **Development:** Use the `file` transport to avoid accidental sends and inspect emails.
- **Testing:** Combine `file` for automated tests and `smtp` for occasional manual tests.
- **Production:** Configure `smtp` with a reliable provider and secure credentials.
- **Security:** Use application-specific passwords whenever possible.

#### Recommended environment variables

```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_ENCRYPTION=TLS
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
```

#### Additional considerations

- Changes to `mail.py` require restarting the application to take effect.
- Ensure the file transport directory has write permissions.
- Many providers require two-factor authentication and application-specific passwords.
- For Gmail, enable 2-step verification and generate an app password.
- The framework automatically creates directories for the `file` transport.
- Consider using transactional services like SendGrid or Mailgun for production applications.
- Emails stored as files include all headers and content for complete debugging.

### `paths.py`

The `paths.py` file defines the project's path configuration for `Orionis Framework`, establishing the locations of all the application's important directories. This centralized configuration allows both the framework and your application to automatically locate files and directories without relying on hardcoded paths, making project organization and maintenance easier.

#### How does the path system work in Orionis Framework?

The path system uses Python's `Path` objects to define absolute locations for key directories. All paths are resolved from the project's root directory, ensuring consistency regardless of where the application is run. The framework uses these paths to automatically locate controllers, models, views, and other components.

#### Configuration structure

```python
# paths.py
from pathlib import Path
from orionis.foundation.config.roots.paths import Paths

class BootstrapPaths(Paths):
  # ... path properties
```

#### Main configuration properties

Below are all available paths, their purpose, and default locations:

#### Main project paths

- **`root`**
  Project root directory.
  - Default: `Path.cwd().resolve()` (current working directory).
  - Base for all other project paths.
  - Contains files like `main.py`, `requirements.txt`, `.env`.

- **`app`**
  Main application directory.
  - Default: `{root}/app`.
  - Contains all application logic organized in subdirectories.
  - The heart of your project's source code.

- **`config`**
  Configuration files directory.
  - Default: `{root}/config`.
  - Contains all `.py` configuration files (app.py, cors.py, mail.py, etc.).
  - Centralizes all application configuration.

- **`bootstrap`**
  Initialization files directory.
  - Default: `{root}/bootstrap`.
  - Contains files that configure application startup.
  - Includes provider and initial service configurations.

#### Application logic paths

- **`console`**
  Console commands and scheduled tasks directory.
  - Default: `{root}/app/console`.
  - Contains subdirectories for custom commands and `scheduler.py`.
  - Organizes all CLI functionality.

- **`exceptions`**
  Custom exception handlers directory.
  - Default: `{root}/app/exceptions`.
  - Contains classes for specific error and exception handling.
  - Allows customizing error responses by exception type.

- **`http`**
  HTTP-related components directory.
  - Default: `{root}/app/http`.
  - Contains controllers, middleware, validation requests.
  - Organizes all web logic for the application.

- **`models`**
  ORM models directory.
  - Default: `{root}/app/models`.
  - Contains classes representing database tables.
  - Defines relationships, validations, and data logic.

- **`providers`**
  Service providers directory.
  - Default: `{root}/app/providers`.
  - Contains classes that register services in the container.
  - Configures dependency injection and bindings.

- **`notifications`**
  Notification classes directory.
  - Default: `{root}/app/notifications`.
  - Contains logic for sending emails, SMS, push notifications.
  - Organizes different channels and notification types.

- **`services`**
  Business logic services directory.
  - Default: `{root}/app/services`.
  - Contains reusable business logic classes.
  - Separates complex logic from controllers and models.

- **`jobs`**
  Queue jobs directory.
  - Default: `{root}/app/jobs`.
  - Contains classes for asynchronous tasks and background processing.
  - Organizes jobs executed outside the request-response cycle.

#### Resource and storage paths

- **`database`**
  SQLite database file directory.
  - Default: `{root}/database/database`.
  - Location for the SQLite file when using this driver.
  - May also contain migrations and seeds.

- **`resources`**
  Application resources directory.
  - Default: `{root}/resources`.
  - Contains views, language files, raw assets.
  - Organizes content that is not Python code.

- **`routes`**
  Route definition directory.
  - Default: `{root}/routes`.
  - Contains files defining Console, Web, and API routes.
  - Organizes application routing.

- **`storage`**
  File storage directory.
  - Default: `{root}/storage`.
  - Contains logs, cache, uploaded files, sessions.
  - Must have write permissions for the application.

- **`tests`**
  Test files directory.
  - Default: `{root}/tests`.
  - Contains all unit, integration, and functional tests.
  - Organizes the project's automated tests.

#### Typical project structure

```
my_project/                    # root
├── app/                       # app
│   ├── console/               # console
│   ├── exceptions/            # exceptions
│   ├── http/                  # http
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── requests/
│   ├── jobs/                  # jobs
│   ├── models/                # models
│   ├── notifications/         # notifications
│   ├── providers/             # providers
│   └── services/              # services
├── bootstrap/                 # bootstrap
├── config/                    # config
├── database/                  # database
├── resources/                 # resources
├── routes/                    # routes
├── storage/                   # storage
├── tests/                     # tests
```

#### Configuration recommendations

- **Development:** Default paths are suitable for most projects.
- **Customization:** Only modify paths if you have specific organizational requirements.
- **Consistency:** Maintain the standard structure for easier maintenance and collaboration.
- **Permissions:** Ensure the `storage` directory has write permissions.

#### Additional considerations

- Paths are automatically resolved as absolute paths to avoid location issues.
- The framework uses these paths for class and component autoloading.
- Changing paths requires restarting the application and may require additional adjustments.
- All paths are globally available once configuration is loaded.
- The path system is compatible with different operating systems (Windows, Linux, macOS).
- If you modify paths, be sure to update any deployment or CI/CD scripts as well.

### `queue.py`

This configuration file is still under development and will be available in future versions of `Orionis Framework`.

### `session.py`

This configuration file is still under development and will be available in future versions of `Orionis Framework`.

### `testing.py`

The `testing.py` file defines the testing system configuration for `Orionis Framework`, allowing you to customize automated test behavior, including verbosity, parallel execution, result persistence, and web report generation. This centralized configuration streamlines test management for both development and continuous integration.

#### How does the testing system work in Orionis Framework?

The testing system provides flexible configuration options to run tests in different ways according to your project needs. You can adjust the output detail level, choose between sequential or parallel execution, and enable advanced features such as persistent results and interactive web reports.

#### Configuration structure

```python
# testing.py
from dataclasses import dataclass
from orionis.foundation.config.testing.entities.testing import Testing
from orionis.foundation.config.testing.enums import ExecutionMode, PersistentDrivers, VerbosityMode

@dataclass
class BootstrapTesting(Testing):
  # ... configuration properties
```

#### Main configuration properties

Below are all available options, their purpose, and usage examples:

#### Output and verbosity configuration

- **`verbosity`**
  Verbosity level for test output.
  - Default: `VerbosityMode.DETAILED`.
  - Available options:
    - `VerbosityMode.SILENT` (0): No output, only final results.
    - `VerbosityMode.MINIMAL` (1): Minimal output, dots per test.
    - `VerbosityMode.DETAILED` (2): Detailed output with names and results.
  - You can also use numeric values: `0`, `1`, `2`.

#### Execution configuration

- **`execution_mode`**
  Test execution mode.
  - Default: `ExecutionMode.SEQUENTIAL`.
  - Available options:
    - `ExecutionMode.SEQUENTIAL`: Sequential execution (one test at a time).
    - `ExecutionMode.PARALLEL`: Parallel execution (multiple tests simultaneously).
  - You can also use strings: `"sequential"`, `"parallel"`.

- **`max_workers`**
  Maximum number of workers for parallel execution.
  - Default: `1`.
  - Only applies when `execution_mode` is `PARALLEL`.
  - Recommendation: Do not exceed the number of available CPU cores.
  - Example to use all cores: `max_workers = Workers().calculate()`.

- **`fail_fast`**
  Stop execution after the first failure.
  - Default: `False`.
  - If `True`: Stops at the first failed test.
  - If `False`: Runs all tests regardless of failures.
  - Useful for rapid development when fixing errors one by one.

- **`throw_exception`**
  Raise exception if a test fails.
  - Default: `True`.
  - If `True`: Raises exception on failures (useful for CI/CD).
  - If `False`: Completes execution and reports failures without raising exceptions.

#### Test discovery configuration

- **`folder_path`**
  Pattern for searching subfolders for tests.
  - Default: `'*'` (all subfolders in the main `test/` directory).
  - Can be a simple string or a list of patterns.
  - Examples:
    - `'example'`: Only searches the `'example'` subdirectory.
    - `['example', 'integration']`: Searches multiple subdirectories.

- **`pattern`**
  Pattern for test file names.
  - Default: `'test_*.py'`.
  - Defines which files are considered tests.
  - Common examples:
    - `'test_*.py'`: Files starting with "test_".
    - `'*_test.py'`: Files ending with "_test".
    - `'test*.py'`: Any file starting with "test".

- **`test_name_pattern`**
  Pattern to filter specific test names.
  - Default: `None` (runs all tests).
  - Allows running only tests matching a pattern.
  - Examples:
    - `'test*'`: Only test methods starting with `'test*'`, e.g., `testUserCreation`.
    - `'*Integration*'`: Only methods containing `'Integration'` in their name, e.g., `testIntegrationFlow`.

#### Persistence and reporting configuration

- **`persistent`**
  Keep persistent test results.
  - Default: `False`.
  - If `True`: Saves results for later analysis.
  - Useful for progress tracking and trend analysis.

- **`persistent_driver`**
  Driver for storing persistent results.
  - Default: `PersistentDrivers.JSON`.
  - Available options:
    - `PersistentDrivers.JSON`: Stores in JSON files.
    - `PersistentDrivers.SQLITE`: Stores in SQLite database (different from main database).
  - You can also use strings: `"json"`, `"sqlite"`.

- **`web_report`**
  Generate interactive web report.
  - Default: `False`.
  - If `True`: Generates an HTML report with charts and statistics.

#### Recommended configurations by environment

##### Local development
```python
verbosity = VerbosityMode.DETAILED
execution_mode = ExecutionMode.SEQUENTIAL
fail_fast = True
persistent = False
web_report = True
```

##### Continuous integration (CI/CD)
```python
verbosity = VerbosityMode.MINIMAL
execution_mode = ExecutionMode.PARALLEL
max_workers = Workers().calculate()
fail_fast = False
throw_exception = True
persistent = True
web_report = False
```

#### Configuration recommendations

- **Development:** Use `DETAILED` verbosity and `SEQUENTIAL` execution for easy debugging.
- **CI/CD:** Enable `throw_exception` for continuous integration.
- **Debugging:** Activate `fail_fast` to quickly fix errors during development.

#### Additional considerations

- Parallel execution may not be suitable for tests that share state or resources.
- Web reports are generated in the `storage/testing/reports` directory.
- Persistent results are stored in `storage/testing/results`.
- The framework automatically creates necessary storage directories.
- The configuration applies to all framework testing tools.
- Web reports include runtime metrics and code coverage when available.

## Bootstrapping

The bootstrapping process in `Orionis Framework` is responsible for automatically loading and initializing all configurations during application startup. This system ensures that all configuration parameters are available and validated before any application component begins to operate.

### How does configuration bootstrapping work?

During startup, the framework:

1. **Automatic loading**: Reads all configuration files defined in the `config/` directory.
2. **Validation**: Checks that configurations meet expected types and values.
3. **Initialization**: Registers configurations in the service container for global access.
4. **Fallback**: Uses safe default values when specific configurations are not provided.

### Main bootstrapping file

Bootstrapping is performed in the `bootstrap/app.py` file, which acts as the central initialization point for the application:

```python
# bootstrap/app.py
from orionis.foundation.application.application import Application
from orionis.foundation.contracts.application.application import IApplication

# Import custom configuration classes
from config.app import BootstrapApp
from config.auth import BootstrapAuth
from config.cache import BootstrapCache
from config.cors import BootstrapCors
from config.database import BootstrapDatabase
from config.filesystems import BootstrapFilesystems
from config.logging import BootstrapLogging
from config.mail import BootstrapMail
from config.paths import BootstrapPaths
from config.queue import BootstrapQueue
from config.session import BootstrapSession
from config.testing import BootstrapTesting

# Initialize an application instance
app: IApplication = Application()

# Register all custom configurations
app.withConfigurators(
  app=BootstrapApp,
  auth=BootstrapAuth,
  cache=BootstrapCache,
  cors=BootstrapCors,
  database=BootstrapDatabase,
  filesystems=BootstrapFilesystems,
  logging=BootstrapLogging,
  mail=BootstrapMail,
  paths=BootstrapPaths,
  queue=BootstrapQueue,
  session=BootstrapSession,
  testing=BootstrapTesting
)

# Start the application with all configurations loaded
app.create()
```

### Default configurations and fallback

One of the core principles of `Orionis Framework` is to provide a "works out of the box" experience. For this reason:

- **Safe defaults**: Each configuration includes secure default values for development.
- **Automatic fallback**: If a configuration file does not exist, default values are used.
- **Minimal setup**: You can run an application without creating custom configuration files.
- **Automatic validation**: The framework automatically validates types and value ranges.

### Benefits of the bootstrapping system

#### Consistency and predictability
- All applications follow the same initialization pattern.
- Developers always know where to find and modify configurations.
- Behavior is predictable regardless of the execution environment.

#### Flexibility without complexity
- You can override only the configurations you need to change.
- Unused configurations do not affect application performance.
- Easy migration between environments using environment variables.

#### Early error detection
- Configuration errors are detected during startup, not at runtime.
- Clear error messages indicate exactly which configuration has issues.
- Type validation prevents silent errors that are hard to debug.

### Modifying the bootstrapping process

**In most cases, you do not need to modify the `bootstrap/app.py` file.** However, you can customize it in specific situations:

#### Use cases for modification:
- Applications that do not follow the framework's standard structure.
- Need for additional configurations not provided by default.
- Integration with external configuration systems.
- Applications requiring special service initialization.

#### Example of custom bootstrapping:
```python
# Custom bootstrap/app.py
from orionis.foundation.application.application import Application
from mi_configuracion_personalizada import MiConfigApp

app: IApplication = Application()

# Register only the configurations you need
app.withConfigurators(
  app=MiConfigApp,
  # Omit configurations not needed for your application
)

# Initialize the application
app.create()
```

## Configuration Alternatives

### Development with Standard Skeleton (Recommended)

The recommended way to work with `Orionis Framework` is by using the standard directory and file structure. This approach offers:

#### Advantages:
- **Convention over configuration**: Fewer decisions to make, more time to develop.
- **Comprehensive documentation**: Everything is documented and exemplified.
- **Compatibility**: Works perfectly with all framework tools.
- **Maintainability**: Easy for other developers to understand and maintain.

#### Standard structure:
```
my_project/
├── app/                    # Application logic
├── bootstrap/              # Initialization
├── config/                 # Custom configurations
├── database/               # Database and migrations
├── resources/              # Resources (views, languages)
├── routes/                 # Route definitions
├── storage/                # Storage (logs, cache)
├── tests/                  # Automated tests
```

### Development Outside the Standard Skeleton

For special cases where the standard structure does not fit your needs, you can create a fully customized implementation:

#### When to consider this option:
- Migrating existing applications with a different structure.
- Integrating with enterprise systems with specific standards.
- Embedded applications with file structure restrictions.
- Projects requiring multiple applications in a single repository.

#### Custom implementation:

```python
# my_config/app_config.py
from dataclasses import dataclass
from orionis.foundation.config.app.entities.app import App
from orionis.foundation.config.app.enums.environments import Environments

@dataclass
class MyCustomConfig(App):
  name: str = 'My Enterprise Application'
  env: str = Environments.PRODUCTION
  debug: bool = False
  host: str = '0.0.0.0'  # Accessible from any IP
  port: int = 8080       # Standard enterprise port
  # Other custom configurations...

  # Company-specific settings
  company_code: str = 'ACME001'
  integration_enabled: bool = True
```

```python
# main.py
from orionis.foundation.application.application import Application
from orionis.foundation.contracts.application.application import IApplication
from my_config.app_config import MyCustomConfig

# Initialize an application instance
app: IApplication = Application()

# Register only the configurations you need
app.withConfigurators(
  app=MyCustomConfig,
  # Omit or add other configurations as needed
)

# Initialize the application
app.create()
```

`Orionis Framework` is flexible enough for developers to define any custom structure, as long as the necessary configurations are registered during bootstrapping.

If you do not wish to create custom configuration classes, you can register configurations using the application's own methods.

Example:

```python
# main.py
from orionis.foundation.application.application import Application
from orionis.foundation.contracts.application.application import IApplication

# Initialize an application instance
app: IApplication = Application()

# Use methods to configure the application directly.
app.setConfigApp()(
  name='My Application',
  env='production',
  debug=False
)

# Other methods to configure each aspect individually.
# app.setConfigAuth(...)
# app.setConfigCache(...)
# app.setConfigCors(...)
# app.setConfigDatabase(...)
# app.setConfigFilesystems(...)
# app.setConfigLogging(...)
# app.setConfigMail(...)
# app.setConfigQueue(...)
# app.setConfigSession(...)
# app.setConfigTesting(...)
# app.setConfigPaths(...)
# app.setConfig(...)

# Initialize the application
app.create()
```

<aside aria-label="Important" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Important note
</p>
<div class="starlight-aside__content">
<p>These methods accept the same attributes defined in the corresponding configuration classes; you can use only those you need, and any not specified will take their default value. For more details on available attributes, see the <a href="#configuration-files">Configuration Files</a> section.</p>
</div>
</aside>

### Recommendations by Project Type

#### For New Applications:
- ✅ **Use the standard skeleton** – It’s the fastest and most maintainable option.
- ✅ **Follow conventions** – Makes collaboration and maintenance easier.
- ✅ **Customize only what’s necessary** – Override specific configurations without changing the structure.

#### For Migrating Existing Applications:
- ⚖️ **Assess complexity** – Compare the cost of adapting vs. keeping your current structure.
- 🔄 **Gradual migration** – Consider adopting parts of the standard skeleton progressively.
- 📚 **Document deviations** – If you use a custom structure, document it clearly.

#### For Enterprise Applications:
- 🏢 **Consider corporate standards** – Some companies require specific directory structures.
- 🔒 **Security and compliance** – Ensure your structure meets security requirements.
- 🔧 **CI/CD tools** – Make sure your structure is compatible with existing pipelines.

### Key Considerations

- **Maintenance**: Custom structures require more documentation and ongoing maintenance.
- **Updates**: The standard skeleton receives automatic improvements with each framework release.
- **Community**: It’s easier to get help when using the standard structure.
- **Tools**: CLI commands and generators are optimized for the standard skeleton.

In summary, while `Orionis Framework` offers the flexibility to work with fully customized structures, the general recommendation is to use the standard skeleton and customize it through specific configurations according to your project’s needs.

## Accessing Configurations from Your Application

Once the application has been initialized through the bootstrapping process, all configurations defined in the configuration files are globally available via the service container. `Orionis Framework` provides multiple ways to access these configurations efficiently and securely.

### How to Access Configurations

The recommended way to access configurations is through the `Application` facade, which provides a clean and expressive interface:

```python
from orionis.support.facades.application import Application

# Access basic configurations
app_name = Application.config('app.name')
environment = Application.config('app.env')
debug_enabled = Application.config('app.debug')

# Access nested configurations
smtp_host = Application.config('mail.mailers.smtp.host')
smtp_port = Application.config('mail.mailers.smtp.port')
```

### Changing Configurations at Runtime

The `Application` facade also allows you to modify configurations at runtime if needed. Simply provide the configuration key and the new value:

```python
from orionis.support.facades.application import Application

# Change configuration at runtime
Application.config('app.debug', True)
```

This way, you can dynamically adjust the application’s behavior according to environment needs or specific conditions.

### Restoring Configurations to Default Values

If needed, you can restore configurations to their default values as defined in the original configuration files:

```python
from orionis.support.facades.application import Application

# Restore configuration to default value
Application.resetConfig()
```

A simple yet extremely useful way to maintain flexibility in configuration management throughout the application lifecycle.

<aside aria-label="Important" class="starlight-aside starlight-aside--caution">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16v-2h2v2h-2zm0-4V8h2v4h-2z"/>
</svg>
Important Note
</p>
<div class="starlight-aside__content">
<p>Changing configurations at runtime can affect application behavior. It is recommended to do so with caution and preferably only during development or testing phases. Additionally, if working with multiple threads or processes, it is essential to ensure consistency of shared configurations.</p>
</div>
</aside>

### Common Usage Patterns

Practical examples of how to use configurations in different parts of your application:

#### Configuration in Controllers
```python
# app/http/controllers/home_controller.py
from orionis.support.facades.application import Application
from orionis.http.controller import Controller

class HomeController(Controller):

  def index(self):
    # Retrieve configurations for the view
    app_name = Application.config('app.name')
    env = Application.config('app.env')
    debug = Application.config('app.debug')

    return self.view('home', {
      'app_name': app_name,
      'environment': env,
      'debug_mode': debug
    })
```

#### Configuration in Services

```python
# app/services/email_service.py
from orionis.support.facades.application import Application

class EmailService:

  def __init__(self):
    # Configure the service based on settings
    self.mailer = Application.config('mail.default', 'smtp')
    self.from_address = Application.config('mail.from.address')
    self.from_name = Application.config('mail.from.name')

  def send_email(self, to, subject, content):
    # Sending logic using configurations
    if self.mailer == 'file':
      # Development mode - save to file
      file_path = Application.config('mail.mailers.file.path')
      # ... logic to save file
    else:
      # Production mode - send via SMTP
      smtp_config = Application.config('mail.mailers.smtp')
      # ... SMTP sending logic
```

### Performance Considerations

- **Configurations are loaded only once during bootstrapping**, so subsequent access is extremely fast.
- **Feel free to use `Application.config()` liberally** – there is no significant performance penalty.

<aside aria-label="Key Recommendation" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Key Recommendation
</p>
<div class="starlight-aside__content">
<p><strong>Do not access the <code>.env</code> file directly in your code.</strong> Always use the framework’s configuration facade (<code>Application.config()</code>) to retrieve environment and configuration values. Direct access to <code>.env</code> can cause inconsistencies if variables change after application startup, and adds complexity and potential errors. The facade ensures values remain consistent and centralized throughout execution.</p>
</div>
</aside>

The configuration system in `Orionis Framework` is designed to be both powerful and easy to use, providing flexible access to all settings while maintaining type safety and sensible defaults.