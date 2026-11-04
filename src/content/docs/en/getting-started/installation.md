---
title: "Installation and your first project"
description: "Create an Orionis application with the official installer: seven skeletons, interactive and automated setup, environment configuration, migrations, and startup."
editUrl: true
lastUpdated: false
---

The official **`orionis-installer`** creates an application from your chosen skeleton, configures its environment, and installs its dependencies in a project-local `.venv`. It also generates an application key and a `uv.lock` file. Start the wizard from the directory where you want to create your project:

```bash
uvx --python 3.14 --from orionis-installer orionis new blog
```

This guide describes **installer 1.0.1** and the seven current skeletons for Orionis 1.5 and later within 1.x. Installer and framework versions are independent: each skeleton declares its Orionis requirement in `pyproject.toml`, which the installer preserves.

The package is `orionis-installer`; its executable is `orionis`. Application commands in this guide use `uv run python -B reactor ...` from the generated project's root, so they run in that application's environment.

## Prerequisites

- Install **[uv](https://docs.astral.sh/uv/getting-started/installation/)** and **[Git](https://git-scm.com/downloads)** and make them available on `PATH`. Git downloads the skeleton even when you skip initializing the new project's repository.
- The installer requires **Python 3.14 or newer**. Generated projects use **stable Python 3.14.x**. uv can obtain that interpreter if it is missing and your download policies allow it. You do not need to activate a virtual environment first.
- Use an interactive terminal for the wizard, or pass `--no-interaction` in scripts and CI.
- Choose a **new destination directory with an existing, writable parent**. An existing destination is rejected even when it is empty.
- Allow access to GitHub, the package index, and Python download servers when an interpreter download is needed.

Windows, macOS, and Linux are supported. On Windows, uv and Git must resolve to native executables. The skeletons do not require Node.js or a frontend build for their initial startup. Use your preferred editor; the installer does not launch one.

## Installation and execution

### Run with uvx

`uvx` runs the installer in its own environment. Omit the name to let the wizard ask for it:

```bash
uvx --python 3.14 --from orionis-installer orionis new
```

Check the command's identity and available options:

```bash
uvx --python 3.14 --from orionis-installer orionis --version
uvx --python 3.14 --from orionis-installer orionis --help
uvx --python 3.14 --from orionis-installer orionis new --help
```

If uv has cached an older installer, refresh it before creating another project:

```bash
uvx --refresh --python 3.14 --from orionis-installer orionis --version
```

For a repeatable installer version, use `--from "orionis-installer==1.0.1"`. This pins the installer, not the skeleton's Git revision or the application's dependency resolution. See [uv's tool guide](https://docs.astral.sh/uv/guides/tools/) for tool environments and version selection.

### Install as a uv tool

To make the installer available as a persistent terminal command:

```bash
uv tool install --python 3.14 orionis-installer
orionis --version
orionis new blog
```

Update an existing tool installation with:

```bash
uv tool upgrade orionis-installer
```

The framework also provides an executable named `orionis`. Check that `orionis --version` identifies **`orionis-installer`** before creating projects. The explicit `uvx --from orionis-installer` invocation avoids that ambiguity.

## Available stacks

All seven variants come from the [official skeleton repository](https://github.com/orionis-framework/skeleton). The installer downloads the exact branch shown below. **Blank** is the default.

| Stack | `--stack` | Starting point | Branch |
| --- | --- | --- | --- |
| **Full application** | `master` | Full reference application with web authentication and an API example, plus extension points for console commands, WebSocket, and MCP. | [master](https://github.com/orionis-framework/skeleton/tree/master) |
| **Blank** | `blank` | Foundation for building from scratch, with route files and application directories ready for your own code. No initial application tables or homepage. | [blank_1.x](https://github.com/orionis-framework/skeleton/tree/blank_1.x) |
| **Server-rendered web** | `ssr` | Jinja2 web application with a welcome page, authentication, dashboard, profile, and user model. | [ssr_1.x](https://github.com/orionis-framework/skeleton/tree/ssr_1.x) |
| **Slim API** | `slim_api` | HTTP API with a JSON controller and `/api/example` endpoint. | [slim_api_1.x](https://github.com/orionis-framework/skeleton/tree/slim_api_1.x) |
| **Slim MCP** | `slim_mcp` | HTTP MCP server at `/mcp`, including an `echo` tool, `docs://example/guide` resource, and `greeting` prompt. | [slim_mcp_1.x](https://github.com/orionis-framework/skeleton/tree/slim_mcp_1.x) |
| **Queue worker** | `slim_worker` | Background jobs, console commands, and scheduled tasks; its queue uses database storage by default. | [slim_worker_1.x](https://github.com/orionis-framework/skeleton/tree/slim_worker_1.x) |
| **Realtime** | `slim_realtime` | WebSocket application with `/ws/echo` and the `/realtime/echo` hub. | [slim_realtime_1.x](https://github.com/orionis-framework/skeleton/tree/slim_realtime_1.x) |

Master and Blank register web, API, console, WebSocket, and AI route files. SSR registers web and console; Slim API registers API; Slim MCP registers AI; Slim Realtime registers WebSocket; Slim Worker registers console. Use `/up` to check the HTTP variants. Slim Worker is intended for command-line processes; framework routes such as `/up` can still appear in its route inventory.

The installer preserves the selected skeleton's configuration and resources. Installing all database or storage drivers does not change its routes or turn a slim variant into the full application.

## Installation process step by step

The wizard is in English. Use arrows or number keys to select an option, then Enter to accept it. Ctrl+C cancels. Supplied options skip their corresponding questions. The console adapts to narrow terminals and displays stages, states, and elapsed times. `--no-color` or the presence of `NO_COLOR` disables colors.

### 1. Check tools and Python

The installer checks uv and Git and locates stable Python 3.14.x. If necessary, it announces and attempts an interpreter download through uv. This can happen before you confirm project creation.

### 2. Define the application

The **Application** section asks for:

1. **Stack**, with Blank selected by default.
2. **Name**, defaulting to `orionis-app` unless supplied after `new`.
3. **Description**, defaulting to `A modern application built with Orionis Framework.`
4. Optional **author name** and **email**.

Names accept 1–100 ASCII letters, digits, dots, hyphens, and underscores, starting and ending with a letter or digit. Traversal sequences, path separators, and reserved Windows names are rejected. Descriptions and author names support Unicode; email is validated when supplied.

Use `--path` to choose another destination. It specifies the final project folder, not its parent; the wizard does not ask for this path separately.

### 3. Select services

Choose storage first: **local**, **S3**, **Azure Blob Storage**, **Google Cloud Storage**, or **all** drivers. Then choose **SQLite**, **MySQL**, **PostgreSQL**, **Oracle**, **SQL Server**, **Redshift**, or **all** database drivers.

With `all`, the wizard also asks for one active disk or connection. The defaults are `local` and `sqlite`. Installing all drivers does not activate all providers simultaneously. The active services become `FILESYSTEM_DISK` and `DB_CONNECTION` in `.env`.

### 4. Review and confirm

Review the name, destination, metadata, stack, repository, branch, Python target, active services, and extras. Confirmation defaults to **Yes**. Declining exits without downloading the skeleton or creating the project.

### 5. Download, configure, and verify

The installer downloads the selected branch, removes the skeleton's Git metadata, and prepares the application:

- Updates project metadata and selected Orionis extras while preserving the skeleton's framework requirement and dependency groups.
- Creates `.env`, groups related variables, and removes `.env.example` and the legacy `env.example` after successful environment generation. `.env.reference` stays available.
- Configures ignore rules for secrets, the virtual environment, SQLite files, and runtime data; keeps `uv.lock` available for version control.
- Runs `uv sync --python 3.14` in the final destination, creating `.venv` there.
- Verifies Python, the framework, dependencies, lockfile, and effective configuration; generates `APP_KEY` if missing.

Creation does not start the server or worker. The application's environment is separate from the installer's environment.

### 6. Choose final operations

| Action | Default in the wizard | Effect |
| --- | --- | --- |
| Initialize Git | Yes | Runs `git init`; creates no commit or remote. |
| Prepare the database | No | Runs application migrations and framework storage commands required by the stack and services. **Does not run seeders.** |

An incomplete external database connection can be configured interactively before migrations. The installer asks for host, port, database or Oracle service, username, and a masked password. It does not provision a database server. Without interaction, missing connection details cause the requested migration operation to fail.

The final summary reports creation, Git, migrations, runtime versions, warnings, and commands appropriate to your stack. Open the generated folder in your preferred editor.

## Available parameters and options

### Argument and options for new

The following defaults apply with `--no-interaction`. Interactive mode requests omitted application and service settings.

| Argument or option | Purpose and accepted values | Default |
| --- | --- | --- |
| `NAME` | Application name and folder name when `--path` is omitted. | `orionis-app` |
| `--stack` | `master`, `blank`, `ssr`, `slim_api`, `slim_mcp`, `slim_worker`, `slim_realtime`; case-insensitive. | `blank` |
| `--path` | Final destination; parent must exist. Quote paths containing spaces. | Current directory plus `NAME` |
| `--description` | Project description. | `A modern application built with Orionis Framework.` |
| `--author-name` | Optional author name. | Omitted |
| `--author-email` | Optional valid email. | Omitted |
| `--storage` | `local`, `s3`, `azure`, `gcs`, `all`. | `local` |
| `--default-storage` | Active disk with `all`: `local`, `s3`, `azure`, `gcs`. | `local` with `all`; otherwise the selected disk |
| `--database` | `sqlite`, `mysql`, `pgsql`, `oracle`, `sqlserver`, `redshift`, `all`. | `sqlite` |
| `--default-database` | Active connection with `all`: any concrete database value above. | `sqlite` with `all`; otherwise the selected connection |
| `--git` / `--no-git` | Initialize or skip Git. | Skipped without interaction; prompted with Yes otherwise |
| `--migrate` / `--no-migrate` | Prepare required tables or skip preparation. No automatic seeders. | Skipped without interaction; prompted with No otherwise |
| `--no-interaction` | Skip prompts and creation confirmation. | Disabled |
| `--no-color` | Disable colors; also respects `NO_COLOR`, including an empty value. | Disabled |
| `--verbose` | Show additional plan diagnostics. | Disabled |
| `--help` | Show creation help and exit. | Disabled |

Storage and database values are lowercase. A default driver cannot be `all`; without an aggregate selection, it must match the selected concrete driver.

### Global options

`--help` and `--version` at the command root show general help and installer identity. `--no-color` and `--verbose` work before or after `new`. `new --help` shows creation-specific options.

### Non-interactive examples

Create a JSON API and initialize Git:

```bash
uvx --python 3.14 --from orionis-installer orionis new service --stack slim_api --no-interaction --git
```

Create an SSR application and prepare its application and authentication tables:

```bash
uvx --python 3.14 --from orionis-installer orionis new portal --stack ssr --no-interaction --migrate
```

Create a worker with its database queue tables:

```bash
uvx --python 3.14 --from orionis-installer orionis new jobs --stack slim_worker --no-interaction --migrate
```

Create an MCP or realtime application:

```bash
uvx --python 3.14 --from orionis-installer orionis new tools --stack slim_mcp --no-interaction
uvx --python 3.14 --from orionis-installer orionis new live --stack slim_realtime --no-interaction
```

Install every driver in the full application while keeping local storage and SQLite active:

```bash
uvx --python 3.14 --from orionis-installer orionis new team --stack master --no-interaction --storage all --default-storage local --database all --default-database sqlite
```

Select external services and a custom destination:

```bash
uvx --python 3.14 --from orionis-installer orionis new analytics --no-interaction --path "./Project with spaces" --description "Reporting service" --author-name "Jane Doe" --author-email jane@example.com --storage s3 --database redshift
```

The last command installs the drivers; configure the external services before using them. Non-interactive mode never requests credentials. Git and migrations are skipped unless their positive flags are supplied.

### Installed drivers and extras

| Selection | Extra added to the Orionis dependency |
| --- | --- |
| Local storage or SQLite | None |
| `s3`, `azure`, or `gcs` | The extra with the same name |
| Storage `all` | `storage` |
| `mysql`, `pgsql`, `oracle`, `sqlserver`, or `redshift` | The extra with the same name |
| Database `all` | `database` |

Existing extras are preserved and duplicates removed. S3 plus Redshift adds `redshift,s3`; both `all` selections add `database,storage`. Factory support belongs to the framework's core dependencies, so no `factories` extra is added. SQL Server also requires its system ODBC driver.

## Generated environment

After an installer-created project is ready, edit **`.env`** directly. Do not copy an example over it: the installer has already configured it and generated its key. **`.env.reference`** documents the complete set of available variables; it is retained unchanged, while `.env.example` and `env.example` are removed.

Database variables stay together in their database block, and storage variables stay in their storage block, separated from other groups by blank lines. Connection settings entered before migrations use the same grouping.

`APP_NAME` remains readable text. Names that Orionis could interpret as a number, boolean, or null use `str:` to retain their string type. These are alternative names for separate projects:

```dotenv
APP_NAME="blog"
```

```dotenv
APP_NAME="str:123"
```

Quoted values use double quotes by default, or single quotes when they avoid escaping embedded double quotes. Escaping preserves the value. User-supplied literal connection values may use `base64:` to avoid dotenv interpolation; the [typed environment system](/en/environment/typed-configuration) decodes them. Base64 is not encryption: `.env` still contains secrets and must remain outside version control.

Selecting cloud storage installs the SDK and sets the active disk. Add the provider settings you need from `.env.reference`; the installer does not fill in cloud credentials. External database selections also require reviewing connection values. For SQLite, the installer creates the configured path's parent directory without truncating an existing database.

Cache, queue, session, mail, and other defaults come from the chosen skeleton and framework configuration. They differ across variants: Slim Worker uses a database queue, while Master and SSR use a synchronous queue and file-based sessions by default. Review `.env` and `config/` before enabling additional services.

### Obtain a stack manually

You can clone a branch from the [stack table](#available-stacks). For example, to obtain SSR:

```bash
git clone --branch ssr_1.x --single-branch https://github.com/orionis-framework/skeleton.git portal
cd portal
```

For a ZIP download, open the branch and choose **Code → Download ZIP**. A manual clone retains the skeleton's Git history and remote; a ZIP does not include them.

Only for a fresh manual checkout without `.env`, copy the example:

```bash
# macOS / Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Review `.env`, project metadata, and any extra drivers needed in `pyproject.toml`, then run:

```bash
uv sync --python 3.14
uv run python -B reactor key:generate
```

For SQLite, ensure the parent directory of `DB_DATABASE` exists if you change its path. Prepare the tables required by your stack using the commands below. Manual setup does not perform the installer's configuration, example cleanup, or verification automatically.

## First steps after installation

Run all application commands from the generated project's root. `APP_KEY` is already generated by the installer, and environment activation is not required when using `uv run`.

### Migrations and initial data

Accepting database preparation in the wizard or using `--migrate` runs **schema commands only**. It never invokes application seeders.

| Stack or enabled service | Preparation performed by the installer |
| --- | --- |
| Master or SSR | `migrate`, then `auth:migrate` |
| Blank, Slim API, or Slim MCP | `migrate`; initial application migration directories are empty |
| Slim Worker | `migrate`, then `queue:migrate` with its default database queue |
| Slim Realtime | Skipped unless application migrations or database-backed services are present |
| `CACHE_STORE=database` | Also `cache:migrate` |
| `QUEUE_CONNECTION=database` | Also `queue:migrate` |
| `TASKS_STORE=database` | Also `schedule:migrate` |
| `SESSION_DRIVER=database` | Also `session:migrate` |

Application migrations belong to your project. Orionis owns the definitions of its internal authentication, cache, queue, scheduler, and session tables. Their commands create those tables while preserving existing records; duplicate application migrations are unnecessary. See [internal storage commands](/en/database/commands#internal-storage-commands).

If you skipped preparation for Master or SSR, run:

```bash
uv run python -B reactor migrate
uv run python -B reactor auth:migrate
```

This creates application tables such as `users`, followed by the framework's roles, permissions, relationships, access-token, and password-recovery tables. It does not create an administrator account. For initial data, first review and adapt the application's seeders and example credentials, then request seeding explicitly:

```bash
uv run python -B reactor seed
```

Redshift does not support the framework's seeder execution; schema migration commands remain separate. Authentication email verification and recovery also require an appropriate [mail configuration](/en/mail).

### Start and check the application

For Master, SSR, Slim API, Slim MCP, or Slim Realtime:

```bash
uv run python -B reactor serve
```

The server defaults to [http://127.0.0.1:8000](http://127.0.0.1:8000). Check `/up`, then use your stack's entry point:

- **Master or SSR:** open `/`; prepare the tables before using authentication.
- **Slim API:** request `/api/example`.
- **Slim MCP:** open [Orionis Inspector](https://inspector.orionis-framework.com/) and connect to `http://127.0.0.1:8000/mcp`. Try the included tool, resource, and prompt. MCP requires protocol requests, not an ordinary browser visit to the endpoint; see [MCP servers and routes](/en/mcp/servers-and-routes).
- **Slim Realtime:** connect a WebSocket client to `ws://127.0.0.1:8000/ws/echo`, or use an Orionis realtime client with `/realtime/echo`. See [Realtime](/en/realtime).

For **Blank**, begin with `uv run python -B reactor list` and add your own routes. You can run `serve` and check `/up`, but no homepage is initially registered at `/`.

For **Slim Worker**, prepare the queue if you skipped `--migrate`, then run the worker:

```bash
uv run python -B reactor migrate
uv run python -B reactor queue:migrate
uv run python -B reactor queue:work
```

Run scheduled tasks in a separate terminal with `uv run python -B reactor schedule:work` when needed. These processes do not require starting `serve`.

Stop foreground processes with Ctrl+C. To change the HTTP server's address or port:

```bash
uv run python -B reactor serve --host 127.0.0.1 --port 8001
```

See the [`serve` options](/en/console/built-in-application#command-serve) for other bind addresses, and [Application lifecycle](/en/application/lifecycle) to understand startup.

## Considerations and recovery

- **Existing destination:** choose a new path or continue in the existing project. The installer does not overwrite directories. It also rejects path redirections, traversal, and inherited uv workspaces.
- **Older installer:** check `--version` and use `uvx --refresh` or `uv tool upgrade orionis-installer` if new stack values are unavailable.
- **Python downloads disabled:** stable Python 3.14.x must already be available when your uv policy prevents downloads. Offline uv mode does not supply the GitHub skeleton.
- **Service credentials:** edit `.env`; installation does not indiscriminately inherit database or cloud settings from the calling process. A custom nonempty `UV_CONFIG_FILE` is rejected; supported uv index, network, and certificate settings are retained.
- **Temporary Windows file locks:** environment writes and project placement retry transient access and sharing violations. Persistent I/O errors still stop the operation; inspect the reported path and permissions before retrying.
- **Creation failure:** before the destination is populated, owned temporary files are cleaned up. After placement, the project is preserved for recovery. Git or migration failures also preserve the application.
- **Migration failure:** inspect the connection and database state before retrying. The installer does not run an automatic rollback or `migrate:fresh`.

To recover a preserved project after resolving its reported problem, run inside its folder:

```bash
uv sync --python 3.14
uv run python -B reactor key:generate
```

Key generation preserves an existing key. Do not force key replacement as a recovery step. Then prepare pending tables and start the appropriate application process. See [configuration](/en/application/configuration) and [bootstrap caching](/en/application/paths-and-caching) for configuration issues.

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Requested operations completed or were skipped, or creation confirmation was declined. Configuration warnings may still need attention. |
| `1` | Critical download, file, or dependency installation failure. |
| `2` | Invalid arguments, missing prerequisites, or incompatible configuration. |
| `3` | Project created, but a requested Git or migration operation failed. |
| `130` | Cancellation or end of interactive input. |
