---
title: Project Structure
---

# Directory Structure

The default structure of an `Orionis` application is designed to provide an excellent starting point for both minimalist and enterprise-grade projects. However, you are free to organize your application as you prefer. Orionis imposes almost no restrictions on where a class can be located, as long as the application is properly configured during the bootstrapping process.
Refer to the previous section of the documentation for more information on how autoloading works in `Orionis`.

## Root Directory

The root of your application contains several important directories and files. Below is a brief description of the main directories you will find in a fresh Orionis installation:

#### Typical Project Structure

```
my_project/                     # Project root directory
├── app/                        # Main application code
│   ├── console/                # Custom console commands
│   │   └── commands/
│   ├── exceptions/             # Custom exception handlers
│   │   ├── handler.py
│   ├── http/                   # HTTP layer of the application
│   │   ├── controllers/        # Route controllers
│   │   │   ├── controller.py
│   │   ├── middleware/         # HTTP request middleware
│   │   │   ├── authenticate.py
│   │   │   ├── cors.py
│   │   │   └── throttle.py
│   │   └── requests/           # Request validation classes
│   │       └── form_request.py
│   ├── jobs/                   # Queue jobs
│   │   └── job.py
│   ├── models/                 # ORM/ODM models
│   │   ├── model.py
│   │   └── user.py
│   ├── notifications/          # Notification system
│   │   └── notification.py
│   ├── providers/              # Service providers
│   │   ├── app_service_provider.py
│   │   ├── auth_service_provider.py
│   │   └── route_service_provider.py
│   └── services/               # Business logic and services
│       └── user_service.py
├── bootstrap/                  # Framework bootstrap files
│   └── app.py
├── config/                     # Configuration files
│   ├── app.py
│   ├── auth.py
│   ├── cache.py
│   ├── database.py
│   ├── mail.py
│   ├── queue.py
│   └── session.py
├── database/                   # Migrations, seeders, and factories
│   ├── migrations/
│   ├── seeders/
│   └── factories/
├── resources/                  # Views and uncompiled assets
│   ├── views/
│   ├── lang/                   # Language/localization files
│   │   ├── en/
│   │   └── es/
│   └── assets/                 # Raw assets (CSS, JS, images)
│       ├── css/
│       ├── js/
│       └── images/
├── routes/                     # Route definitions
│   ├── web.py
│   ├── api.py
│   ├── console.py
│   └── channels.py
├── storage/                    # File storage and cache
│   ├── app/
│   │   ├── public/
│   │   └── private/
│   ├── framework/
│   │   ├── cache/
│   │   ├── sessions/
│   │   └── views/
│   └── logs/
├── tests/                      # Test suite
│   ├── unit/
│   ├── feature/
│   └── test_case.py
├── venv/                       # Python virtual environment
├── .env                        # Environment variables
├── .env.example                # Example environment variables
├── .gitignore                  # Git ignored files
├── requirements.txt            # Python dependencies
├── reactor                     # Framework CLI
└── README.md                   # Project documentation
```

### App Directory

The `app` directory contains the main code for your application. We will explore this directory in detail later; however, almost all of your application's classes will reside here.

#### Subdirectories in the App Directory

##### Console
The `console` directory contains all custom command-line commands for your application. These commands are executed via the `reactor` CLI and are useful for maintenance tasks, data processing, and automation.

##### Exceptions
The `exceptions` directory houses your application's exception handler and any custom exceptions you define. This is where you can customize how your application reports and renders exceptions.
##### Http
The `http` directory contains your controllers, middleware, and form requests. This directory acts as the entry point for all web requests coming into your application.

- **Controllers**: Contain the logic that handles HTTP requests and returns responses.
- **Middleware**: Filters that can run before or after HTTP requests.
- **Requests**: Classes that encapsulate validation logic for HTTP requests.

##### Jobs
The `jobs` directory contains queued jobs for your application. Jobs can be dispatched to a queue or executed synchronously within the current request lifecycle.

##### Models
The `models` directory contains all your ORM model classes. Each model represents a table in your database and provides an elegant, expressive interface for interacting with your data.

##### Notifications
The `notifications` directory contains all "transactional" notifications sent by your application, by default via email. You can define notifications for different channels such as email, SMS, or push notifications.

##### Providers
The `providers` directory contains all service providers for your application. Service providers bootstrap your application by binding services into the service container, registering events, or performing any other tasks needed to prepare your application for incoming requests.

##### Services
The `services` directory contains classes that encapsulate complex business logic for your application. This directory helps keep your controllers thin and your code reusable.

### Bootstrap Directory

The `bootstrap` directory contains the `app.py` file, which starts the framework. Its sole responsibility is to bootstrap the application. Unlike other frameworks, it is not used to store cache or additional files, so you do not need to grant write access to this directory in production environments. All cache generated by the framework is stored in the `storage` directory.

### Config Directory

The `config` directory, as its name suggests, contains all configuration files for your Orionis application. It is recommended to read these files and familiarize yourself with all available options.

#### Main configuration files:

- **`app.py`**: General application configuration (name, environment, debug, etc.)
- **`auth.py`**: Authentication and authorization system configuration
- **`cache.py`**: Configuration for available cache drivers
- **`database.py`**: Database connection configuration
- **`mail.py`**: Email system configuration
- **`queue.py`**: Job queue system configuration
- **`session.py`**: Session management configuration

The previous section of the documentation explains in detail how to configure Orionis.

### Database Directory

The `database` directory contains your database migrations, model factories, and seeders. If you wish, you can also use this directory to store a SQLite database.

#### Subdirectories:

- **`migrations/`**: Contains database migrations that allow you to version and modify your database schema
- **`seeders/`**: Contains classes that populate the database with test or initial data
- **`factories/`**: Contains model factories for generating fake data during testing

### Resources Directory

The `resources` directory contains your views, language files, and uncompiled assets such as CSS, JavaScript, and images.

#### Subdirectories:

- **`views/`**: Contains your application's templates and views
- **`lang/`**: Localization and internationalization files
    - `en/`: English translations
    - `es/`: Spanish translations
- **`assets/`**: Raw assets
    - `css/`: CSS style files
    - `js/`: JavaScript files
    - `images/`: Images and graphic resources

### Routes Directory

The `routes` directory contains all route definitions for your application. By default, Orionis includes four route files: `web.py`, `api.py`, `console.py`, and `channels.py`.

#### Route files:

**`web.py`**
Contains all routes defined to handle regular HTTP requests to your web application. These routes are assigned to the `web` middleware, which provides features such as:
- Session state
- CSRF protection
- Cookie encryption
- User authentication

**`api.py`**
Contains routes intended to be stateless, ideal for REST APIs. Requests entering the application through these routes:
- Must be authenticated via tokens (API tokens, JWT, etc.)
- Do not have access to session state
- Are assigned to the `api` middleware
- Generally return responses in JSON format

**`console.py`**
Contains all routes defined to handle CLI commands via the `reactor` CLI. These routes:
- Are not associated with any HTTP middleware
- Are executed from the command line
- Do not handle traditional HTTP requests
- Are useful for maintenance and automation tasks

**`channels.py`**
This is where you can register all event broadcasting channels supported by your application. Useful for:
- WebSockets
- Real-time broadcasting
- Push notifications
- Live chat

### Storage Directory

The `storage` directory contains files generated by your application, including logs, file-based sessions, file caches, and other files created by the framework. This directory is organized into several important subdirectories:

#### Storage Subdirectories:

**`app/`**
This directory is intended for storing any files generated by your application. It contains two main subdirectories:

- **`public/`**: Stores files that should be publicly accessible via the web server:
    - User-uploaded images
    - Downloadable documents
    - Dynamically generated assets
    - Compiled CSS and JS files

- **`private/`**: Stores files that should not be publicly accessible:
    - Confidential documents
    - Temporary processing files
    - Private backups
    - User files that require authentication to access

**`framework/`**
Contains files automatically generated by the Orionis framework:

- **`cache/`**: Application cache to improve performance
    - Configuration cache
    - Route cache
    - Service cache
    - Query cache

- **`sessions/`**: Session files when using the file-based session driver
    - User session data
    - Temporary authentication information
    - Application state per session

**`logs/`**
Contains all log files generated by your application:
- Application error logs

<aside aria-label="Key Recommendation" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Key Recommendation
</p>
<div class="starlight-aside__content">
<p><strong>The <code>storage</code> directory and all its subdirectories must have write permissions for the web server.</strong> In production environments, make sure that only <code>storage/app/public</code> is publicly accessible. All other subdirectories should remain private to protect sensitive files and avoid security risks.</p>
</div>
</aside>

More subdirectories may be added to `storage` in future framework versions, but these are the most important for now.

### Tests Directory

The `tests` directory contains your complete suite of automated tests. `Orionis` includes its own microframework for testing, making it easy to write and run tests.

#### Running Tests:

You can run your tests using the `Reactor` command:

```bash
python -B reactor test
```

### Venv Directory

The `venv` directory contains the Python virtual environment for your application. This directory is created when you set up the virtual environment using `python -m venv venv`.

#### Virtual Environment Features:

- **Dependency isolation**: Each project has its own dependencies, independent from the system
- **Version management**: Allows you to use specific package versions without conflicts
- **Portability**: Makes it easy to replicate the environment on different machines

<aside aria-label="Key Recommendation" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Key Recommendation
</p>
<div class="starlight-aside__content">
<p><strong>Make sure to add the <code>venv</code> directory to your <code>.gitignore</code> file to avoid uploading it to version control.</strong> The virtual environment should be recreated in each deployment environment and never shared between developers or servers.</p>
</div>
</aside>

## Important Files in the Root

In addition to the directories mentioned above, you will find several important files in your project's root:

### Configuration Files

**`.env`**
Contains environment variables specific to your local installation. **This file should not be versioned** and contains sensitive information such as:
- Database credentials
- API keys
- Environment-specific configurations

**`.env.example`**
Template example of the `.env` file that should be versioned. It shows which environment variables the application needs without exposing real values.

**`requirements.txt`**
Lists all Python dependencies required for your project:
```txt
orionis-framework>=1.0.0
other-dependency>=2.3.4
another-dependency==1.2.3
```

### Control Files

**`.gitignore`**
Specifies which files and directories Git should ignore:
```gitignore
venv/
.env
__pycache__/
*.pyc
storage/logs/*.log
```

**`reactor`**
Framework CLI. Provides commands to:
- Generate boilerplate code
- Run migrations
- Run tests
- Clear cache
- And many other development tasks

**`README.md`**
Main project documentation, including:
- Project description
- Installation instructions
- Basic usage guide
- Links to additional documentation

## The App Directory in Depth

Most of your application resides in the `app` directory.

### Organization

The `app` directory contains several subdirectories such as `http`, `models`, `providers`, `services`, and more. Over time, other directories will be generated inside `app` as you use the `Reactor` commands to generate classes.

#### Organization Philosophy

**Separation of Responsibilities:**
- **HTTP Layer** (`http/`): Handles interaction with the HTTP protocol
- **Business Logic** (`services/`): Contains business logic
- **Data Layer** (`models/`): Manages data persistence and access
- **Infrastructure** (`providers/`): Service configuration and registration

**Design Patterns:**
Orionis follows several well-established design patterns:
- **MVC (Model-View-Controller)**: For organizing application logic
- **Service Layer**: To encapsulate complex business logic
- **Repository Pattern**: To abstract data access
- **Provider Pattern**: For service registration and configuration

### Automatic Code Generation

<aside aria-label="Key Recommendation" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Key Recommendation
</p>
<div class="starlight-aside__content">
<p><strong>Many classes in the <code>app</code> directory can be generated automatically using the integrated console interpreter <code>Reactor</code>.</strong> To view available commands and speed up development, run <code>python -B reactor help</code> in your terminal.</p>
</div>
</aside>

### Details of Important Subdirectories

#### Console Directory

The `console` directory contains all custom command-line commands for your application. These commands are executed via the `reactor` CLI and are especially useful for:

- **Maintenance tasks**: Cache cleanup, database optimization
- **Batch processing**: Mass data processing
- **Automation**: Scripts for cron jobs
- **Development utilities**: Commands to generate test data

**Example structure:**
```
console/
├── commands/
│   ├── send_emails.py
│   ├── cleanup_logs.py
│   └── generate_reports.py
├── listeners/
│   └── your_listener.py
└── scheduler.py
```

**Command features:**
- Inherits from the base `Command` class
- Defines signature and description
- Handles arguments and options
- Integrates with the logging system
- Full access to the service container

#### Http Directory in Detail

The `http` directory is the heart of your web application and is organized into three main subdirectories:

**Controllers**
- Handle HTTP request logic
- Should remain thin (thin controllers)
- Delegate complex logic to services
- Return appropriate HTTP responses

**Middleware**
- Filters executed before/after requests
- Useful for authentication, logging, CORS, rate limiting
- Can modify requests and responses
- Organized in an execution stack

**Requests**
- Encapsulate validation and authorization
- Process input data
- Provide custom error messages
- Keep controllers clean from validation logic

<aside aria-label="Key Note" class="starlight-aside starlight-aside--note">
<p class="starlight-aside__title" aria-hidden="true">
<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="starlight-aside__icon">
<path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H5V21H19V9ZM12 15V13H15V15H12ZM9 15V13H12V15H9ZM12 18V16H15V18H12ZM9 18V16H12V18H9Z"/>
</svg>
Key Note
</p>
<div class="starlight-aside__content">
<p><strong>The <code>console</code> and <code>http</code> directories act as APIs for interacting with your application's core.</strong> The HTTP protocol and CLI are entry mechanisms, but do not contain business logic. They are separate interfaces for issuing commands, keeping business logic isolated and centralized in other components.</p>
</div>
</aside>

This organization helps maintain a clean and scalable architecture, where each component has well-defined responsibilities and business logic remains independent from delivery mechanisms.

