---
title: "Installation and your first project"
description: "Create an Orionis project with the official installer: prerequisites, wizard, options, stacks, manual installation, and first startup."
editUrl: true
lastUpdated: false
---

`orionis-installer` creates applications from the official Orionis Framework skeletons. The wizard lets you choose a stack, define project metadata, and select storage and database drivers. It then downloads the template, configures its files, and installs dependencies in a dedicated `.venv`, with a `uv.lock` file.

The installer package is named **`orionis-installer`** and its executable is **`orionis`**. Each stack defines the application's Orionis dependency in its `pyproject.toml`; the installer preserves that constraint, and uv resolves compatible dependencies.

## Prerequisites

- **[uv](https://docs.astral.sh/uv/getting-started/installation/)** and **[Git](https://git-scm.com/downloads)** available on `PATH`. Git downloads the skeleton even if you choose `--no-git` to skip initializing the new repository.
- **Python 3.14 or newer to run the installer.** For the application, the installer specifically locates and verifies **stable Python 3.14.x**. If missing, it attempts to obtain it through uv, respecting the configured download and connectivity policies. You do not need to activate a virtual environment to use the installer.
- **An interactive terminal** to use the wizard. In scripts, CI, or terminals without TTY input and output, use `--no-interaction`.
- **An existing, writable parent directory.** The destination directory must be new: it is rejected even if it already exists and is empty.
- **Connectivity to GitHub and the package index**, plus Python download servers if that interpreter is not installed yet.

The installer accounts for Windows, macOS, and Linux; its CI configuration includes all three systems. On Windows, uv and Git must resolve to native executables rather than `.cmd` or `.bat` wrappers. The creation and Reactor commands used here work across the three systems; file-copying differences are shown in the manual installation instructions.

Visual Studio Code is optional. For the installer to open it at the end, its `code` launcher must be available on `PATH`. The stacks do not require Node.js, npm, or a frontend build for their initial startup.

## Installation and execution

### Run with uvx

This invocation explicitly identifies the installer package and selects Python to run it:

```bash
uvx --python 3.14 --from orionis-installer orionis new blog
```

The wizard creates `blog` inside the current directory. If you omit `blog`, it also asks for the project name. You can run `uvx --from orionis-installer orionis new` when uv already selects a compatible interpreter.

View the general help, creation help, and executable identity with:

```bash
uvx --python 3.14 --from orionis-installer orionis --help
uvx --python 3.14 --from orionis-installer orionis new --help
uvx --python 3.14 --from orionis-installer orionis --version
```

### Install as a uv tool

If you prefer to have the command available in your terminal:

```bash
uv tool install --python 3.14 orionis-installer
orionis --version
orionis new blog
```

Check that `orionis --version` identifies `orionis-installer`. The framework can also provide an executable named `orionis`; use the explicit `uvx --from orionis-installer` form to create projects and run Reactor commands from each application's root directory.

## Installation process step by step

The wizard is presented in English. Use the arrow keys to select options and Enter to accept them; Ctrl+C cancels the process. An option supplied on the command line skips its corresponding question.

### 1. Check tools and Python

Before asking about the project, the installer checks that uv and Git can execute and locates stable Python 3.14.x outside the application's environment. If a download is necessary, it announces it before trying. This stage does not download the stack yet.

### 2. Define the application

In the **Application** section, the wizard asks for the following, in order:

1. **Stack:** Blank, SSR, Slim API, or Slim MCP. Blank is the default; [compare the stacks](#available-stacks) before choosing.
2. **Name:** `orionis-app` by default; `new blog` already supplies this value.
3. **Description:** `A modern application built with Orionis Framework.` by default.
4. **Author name and email:** optional; you can leave them empty.

The name accepts 1–100 ASCII characters: letters, digits, dots, hyphens, and underscores, with a letter or digit at both ends. It does not accept `..`, path separators, or reserved Windows names. Descriptions and author names support Unicode without control characters; email is validated if provided.

The wizard does not ask for a path. To choose another destination, supply `--path`: it represents the final project folder rather than its parent directory.

### 3. Select services

In **Services**, first choose storage: local, Amazon S3, Azure Blob Storage, Google Cloud Storage, or all cloud drivers. If you select `all`, an additional question lets you choose the active disk, defaulting to `local`.

Next choose the database: SQLite, MySQL, PostgreSQL, Oracle, SQL Server, Amazon Redshift, or all drivers. SQLite is the default. With `all`, you also choose an active connection, defaulting to `sqlite`.

Your selection determines which dependencies are installed and the values of `FILESYSTEM_DISK` and `DB_CONNECTION`. Selecting all drivers does not activate all services simultaneously. Credentials and external infrastructure are prepared separately.

### 4. Review and confirm

The installer validates the destination and displays the plan: name, absolute path, metadata, stack, repository, branch, Python, active drivers, and Orionis extras.

The creation confirmation defaults to **Yes**. If you choose **No**, it exits with code `0` without downloading the skeleton. Before confirmation, the installer may already have downloaded Python during the prerequisite check.

### 5. Download, configure, and verify

After confirmation, the following actions run automatically:

1. Clone only the selected stack's branch into a temporary directory beside the destination, verify the branch and revision, and remove the downloaded skeleton's `.git`.
2. Update the name, description, and author in `pyproject.toml`; merge the selected extras with the stack's existing extras while preserving its Orionis constraint, application version, and dependency groups. Keep `tool.uv.package = false` and write `.python-version` with the target Python.
3. Copy `.env.example` to `.env`, preserve the example, and configure the application name, active disk, and active connection. The name `env.example` is also supported. For SQLite, prepare the database file's parent directory; the file is neither created nor truncated at this stage.
4. Adjust `.gitignore` to exclude `.env`, `.venv`, SQLite files, and local runtime data while keeping `uv.lock` available for version control.
5. Place the files at the final destination and run `uv sync --python 3.14` there. The `.venv` is created directly inside the project, along with `uv.lock`.
6. Verify the interpreter, Orionis, installed extras and dependencies, lockfile, and effective configuration. Generate `APP_KEY` through the framework if missing; preserve an existing key.

The installer preserves each stack's own files and routes. Creation does not start the application server.

### 6. Choose final operations

Once creation finishes, the wizard offers these actions, in order:

| Action | Proposed selection | Result when accepted |
| --- | --- | --- |
| Initialize Git | Yes | Run `git init` in the project, with no commit, remote, or push. |
| Run migrations | No | Verify the connection and run `reactor migrate --seed` with the project's Python. This includes seeders; review [the migration considerations](#migrations-and-initial-data). |
| Open Visual Studio Code | Yes | Open the folder in a new editor window. |

If you request migrations with an incomplete external database connection, interactive mode offers to configure it, defaulting to **No**. If you accept, it asks for the host, port, database name—or service for Oracle—username, and a masked password. It does not create the external server or database. Non-interactive mode does not request credentials, and that operation fails if details are missing.

The final summary distinguishes creation, Git, migrations, and the editor, and lists warnings and commands to continue.

## Available parameters and options

The subcommand for creating an application is `new`. The name and all its options are optional. Interactive mode asks for omitted metadata and services and offers the final actions; other options use their defaults. With `--no-interaction`, the defaults in the table apply.

### Argument and options for new

| Parameter | Purpose | Required | Default | Allowed values |
| --- | --- | --- | --- | --- |
| `NAME` | Application and folder name when `--path` is not provided. | No | `orionis-app` | A valid name following the rules above. |
| `--stack` | Select the skeleton. | No | `blank` | `blank`, `ssr`, `slim_api`, `slim_mcp`; case-insensitive. |
| `--path` | Choose the final project path. | No | Current directory plus `NAME` | A new path whose parent exists; spaces and Unicode are supported. |
| `--description` | Set the project description. | No | `A modern application built with Orionis Framework.` | Text without control characters. |
| `--author-name` | Define the author name. | No | No author | Text; an empty value omits the field. |
| `--author-email` | Define the author email. | No | No email | A valid email address; an empty value omits the field. |
| `--storage` | Select storage drivers. | No | `local` | `local`, `s3`, `azure`, `gcs`, `all`. |
| `--default-storage` | Choose the active disk when installing all drivers. | No | `local` with `all`; otherwise, the selected disk | `local`, `s3`, `azure`, `gcs`. |
| `--database` | Select database drivers. | No | `sqlite` | `sqlite`, `mysql`, `pgsql`, `oracle`, `sqlserver`, `redshift`, `all`. |
| `--default-database` | Choose the active connection when installing all drivers. | No | `sqlite` with `all`; otherwise, the selected connection | `sqlite`, `mysql`, `pgsql`, `oracle`, `sqlserver`, `redshift`. |
| `--git` / `--no-git` | Initialize Git or skip that action. | No | Prompt: Yes; without interaction: skip | Explicitly enable or skip. |
| `--migrate` / `--no-migrate` | Run migrations and seeders or skip them. | No | Prompt: No; without interaction: skip | Explicitly enable or skip. |
| `--open` / `--no-open` | Open VS Code or skip that action. | No | Prompt: Yes; without interaction: skip | Explicitly enable or skip. |
| `--no-interaction` | Skip all questions and confirmation. | No | Disabled | Flag; final actions require their positive flags. |
| `--no-color` | Disable colors. | No | Disabled, unless `NO_COLOR` is present | Flag; also accepted before `new`. |
| `--verbose` | Display additional plan diagnostics. | No | Disabled | Flag; also accepted before `new`. |
| `--help` | Display creation help and exit. | No | Disabled | Flag. |

Write storage and database values in lowercase. `--default-storage` and `--default-database` never accept `all`; if you have not selected all drivers, they can only repeat the chosen driver. Use quotes for paths containing spaces.

### Global options

| Parameter | Purpose | Required | Default | Allowed values |
| --- | --- | --- | --- | --- |
| `--help` | Display the general help and exit. | No | Disabled | Flag before `new`; after `new`, it displays creation help. |
| `--version` | Display the installer's identity and version and exit. | No | Disabled | Flag only at the command root, before the subcommand. |
| `--no-color` | Disable colors. | No | Disabled, unless `NO_COLOR` is present | Flag before or after `new`. |
| `--verbose` | Display additional plan diagnostics. | No | Disabled | Flag before or after `new`. |

The presence of `NO_COLOR`, even with an empty value, disables colors.

### Non-interactive examples

Create an API with local defaults and initialize its repository:

```bash
uvx --python 3.14 --from orionis-installer orionis new service --stack slim_api --no-interaction --git
```

Create an SSR application and leave migrations and the editor for later:

```bash
uvx --python 3.14 --from orionis-installer orionis new portal --stack ssr --no-interaction --no-migrate --no-open
```

Install all drivers and keep local storage and SQLite as the active services:

```bash
uvx --python 3.14 --from orionis-installer orionis new team --no-interaction --storage all --default-storage local --database all --default-database sqlite
```

Choose another destination and external services, with author metadata:

```bash
uvx --python 3.14 --from orionis-installer orionis new analytics --no-interaction --path "./Project with spaces" --description "Reporting service" --author-name "Jane Doe" --author-email jane@example.com --storage s3 --database redshift
```

The last example installs the drivers, but you must configure the connection and storage before using those services. Without interaction, Git, migrations, and the editor are skipped when their positive flags are absent.

### Installed drivers and extras

Extras are added to the stack's Orionis dependency while preserving those already present:

| Selection | Added extra |
| --- | --- |
| `local` storage or `sqlite` database | None. |
| `s3`, `azure`, or `gcs` storage | The extra with the same name. |
| `all` storage | `storage`. |
| `mysql`, `pgsql`, `oracle`, `sqlserver`, or `redshift` database | The extra with the same name. |
| `all` database | `database`. |

For example, S3 and Redshift add `redshift,s3`; both `all` selections add `database,storage`. The installer does not add a `factories` extra: factory dependencies belong to the framework's core.

## Available stacks

All four stacks use the [official skeleton repository](https://github.com/orionis-framework/skeleton), each on its own branch. The following links point to the corresponding branch; the installer downloads only the selected one and does not switch stacks if that download fails.

| Official stack | `--stack` value | Purpose and components | Repository and branch |
| --- | --- | --- | --- |
| **Blank** | `blank` | Foundation for building from scratch: service configuration, provider, exception handler, lifespan, and web, API, console, WebSocket, and AI route files. It includes no controllers, models, views, or initial migrations. | [Skeleton / blank_1.x](https://github.com/orionis-framework/skeleton/tree/blank_1.x) |
| **SSR** | `ssr` | Web application with server-side rendering through Jinja2, Bootstrap, and bundled CSS/JS. Includes a welcome page, authentication, dashboard, profile, user model, migrations, and administration views as a starting point. | [Skeleton / ssr_1.x](https://github.com/orionis-framework/skeleton/tree/ssr_1.x) |
| **Slim API** | `slim_api` | Reduced foundation for APIs and WebSockets: example JSON controller, middleware, and API and WebSocket route registration. It does not include a web authentication interface; the WebSocket file is ready for you to add routes. | [Skeleton / slim_api_1.x](https://github.com/orionis-framework/skeleton/tree/slim_api_1.x) |
| **Slim MCP** | `slim_mcp` | Foundation for Model Context Protocol servers: registers AI routes and an example HTTP MCP server. Its tool, resource, and prompt collections are empty so you can add your own. | [Skeleton / slim_mcp_1.x](https://github.com/orionis-framework/skeleton/tree/slim_mcp_1.x) |

Blank and SSR register all five route file types; Slim API registers only API and WebSocket, and Slim MCP only AI. All register `/up` as a health check. The Slim MCP server is exposed at `/mcp`; the template does not register a STDIO server. In SSR, the user and role administration views are starting points rather than a complete CRUD implementation.

### Obtain a stack manually

You can clone your preferred branch directly. Run **one** of these alternatives from the parent directory:

**Blank:**

```bash
git clone --branch blank_1.x --single-branch https://github.com/orionis-framework/skeleton.git blog
cd blog
```

**SSR:**

```bash
git clone --branch ssr_1.x --single-branch https://github.com/orionis-framework/skeleton.git portal
cd portal
```

**Slim API:**

```bash
git clone --branch slim_api_1.x --single-branch https://github.com/orionis-framework/skeleton.git service
cd service
```

**Slim MCP:**

```bash
git clone --branch slim_mcp_1.x --single-branch https://github.com/orionis-framework/skeleton.git tools
cd tools
```

To download a ZIP, open the branch link in the table and use **Code → Download ZIP**. Extract its contents and change to the folder containing `pyproject.toml` and `reactor`.

A manual download requires environment setup. In a new clone, copy the example according to your terminal:

```bash
# macOS / Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Review `APP_NAME` in `.env` and the metadata in `pyproject.toml`. Then run:

```bash
uv sync --python 3.14
uv run python -c "from pathlib import Path; Path('database').mkdir(exist_ok=True)"
uv run python -B reactor key:generate
```

The `database` directory supports the example SQLite path, `database/database.sqlite`; some templates do not include it initially. The database creates the SQLite file when it is used. For SSR, prepare the schema before using authentication:

```bash
uv run python -B reactor migrate
```

Continue with [first startup](#first-steps-after-installation). A manual clone preserves the skeleton's history and remote; a ZIP does not include `.git`. The installer's metadata and driver selections and its checks are also not applied: configure `.env`, add any necessary extras to the Orionis dependency in `pyproject.toml` while preserving its constraint, and run `uv sync --python 3.14` again if you change dependencies.

## First steps after installation

### Review the project environment

For a project created by the installer, enter its folder; if you used `--path`, use that path:

```bash
cd blog
```

The `.venv`, `uv.lock`, `.env`, and `APP_KEY` are already prepared when creation finishes successfully. Do not copy `.env.example` over `.env` again. If you need to install pending dependencies or synchronize manifest changes:

```bash
uv sync --python 3.14
```

Review `.env` and use `.env.reference` as a reference for the stack's additional options. Some values written by the installer use Orionis's `base64:` prefix to preserve their literal contents. The initial local settings are SQLite, local storage, a file cache, synchronous queues, and process-local memory sessions.

For external services, replace the pending connection values and configure credentials, the bucket or container, and provider permissions. The installer writes `configure-me` as a placeholder database username, sets the driver's port, and does not provide a password. Oracle also requires a connection service, such as `DB_SERVICE_NAME`; SQL Server requires the system ODBC driver named by `DB_ODBC_DRIVER`. Continue with [Database and ORM](/en/database) and [Storage](/en/storage).

### Migrations and initial data

To prepare the schema—for example, SSR's authentication tables—run this from the project root:

```bash
uv run python -B reactor migrate
```

This command applies migrations without requesting seeders. If they have already completed successfully, you do not need to prepare them again to start the server. Blank, Slim API, and Slim MCP do not include initial migrations required to test their starting endpoints.

:::caution[The installer option also runs seeders]
Accepting the wizard's migrations or passing `--migrate` runs `reactor migrate --seed`. Review the seeders before choosing that option: SSR includes administrative data with example credentials. To prepare only the schema, create the project with `--no-migrate` and run `reactor migrate` manually.
:::

With Redshift as the active connection, use `--no-migrate` and run schema migrations manually, without `--seed`: the framework rejects seeder execution on Redshift because it requires enforced unique constraints to record each execution only once.

With a database that supports seeders, once you have reviewed and adapted the initial data and its credentials, you can request it explicitly:

```bash
uv run python -B reactor migrate --seed
```

SSR's account verification and recovery flows also require mail delivery configuration. The stack does not include SMTP credentials; see [Mail](/en/mail).

### Start and check the application

From the project root:

```bash
uv run python -B reactor serve
```

The development server uses [http://127.0.0.1:8000](http://127.0.0.1:8000). Check [http://127.0.0.1:8000/up](http://127.0.0.1:8000/up), available in all four stacks. Additional entry points depend on the template:

- **Blank:** add your routes; it does not initially register a page at `/`.
- **SSR:** open `/` for the welcome page and prepare the tables before using registration and login.
- **Slim API:** try `/api/example` for the included JSON endpoint.
- **Slim MCP:** configure your MCP client for the `/mcp` endpoint; an ordinary browser visit is not equivalent to a protocol request. Follow [MCP servers](/en/mcp) to declare tools and connect clients.

Stop the server with Ctrl+C. If the port is occupied:

```bash
uv run python -B reactor serve --port 8001
```

To add your first routes and understand startup, continue with [Creating and starting an application](/en/getting-started/quick-start) and [Application lifecycle](/en/application/lifecycle).

## Considerations and recovery

- **Existing destinations:** `new` does not overwrite folders or offer `--force`. Use another path or continue configuring the project that already exists. Symbolic links, junctions, paths with `..`, and destinations inside an inherited uv workspace are also rejected.
- **Python without downloads:** with `UV_PYTHON_DOWNLOADS=never` or `UV_OFFLINE` enabled, stable Python 3.14.x must already be available. uv's offline mode does not replace the skeleton download from GitHub.
- **Isolated configuration:** the installer rejects a nonempty `UV_CONFIG_FILE`. It preserves supported uv network, certificate, and index settings, but does not indiscriminately inherit the calling process's virtual environment or application, database, or cloud variables. Configure services in the project's `.env`.
- **Download or verification errors:** if the branch does not exist or the template does not meet requirements, installation stops; it does not switch stacks or ignore the incompatibility.
- **Creation failures:** before placing the project at its destination, the owned temporary directory is cleaned up. After placement, files are preserved and diagnostics explain how to continue. A Git or editor failure does not remove the project, and other independent final operations may continue.
- **Failed migrations:** review the connection and the actual database state before retrying. No automatic rollback or `migrate:fresh` runs.

To recover a preserved project, first review its files and configuration, then run inside its folder:

```bash
uv sync --python 3.14
uv run python -B reactor key:generate
```

Key generation preserves an existing key; do not use `--force` as a recovery step. If stack files are missing or dependencies are incompatible, correct the cause before starting again. Configuration and cache issues are covered in [Typed configuration](/en/application/configuration) and [Directories and bootstrap caching](/en/application/paths-and-caching).

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Creation and requested actions completed or were skipped; also used when confirmation is declined. Pending configuration warnings may remain. |
| `1` | Critical download, file, or dependency installation failure. |
| `2` | Invalid arguments, missing prerequisites, or detected incompatibility. |
| `3` | Project created, but a requested final operation failed: Git, migrations, or the editor. |
| `130` | User cancellation or end of interactive input. |
