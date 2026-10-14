---
title: "Installation and your first project"
description: "Create an application with orionis-installer. The installer selects an official application skeleton, configures its metadata and services, and installs Orionis into the…"
editUrl: true
lastUpdated: false
---

Create an application with `orionis-installer`. The installer selects an official application skeleton, configures its metadata and services, and installs Orionis into the application's own `.venv` using uv.

This guide describes installer **0.7.0**. That release is available on [PyPI](https://pypi.org/project/orionis-installer/0.7.0/). The installer version, the application's version, and the Orionis version are independent: the skeleton supplies the framework requirement, and `uv.lock` records the resolved version.

## Prerequisites

Install [uv](https://docs.astral.sh/uv/getting-started/installation/) and [Git](https://git-scm.com/downloads), and make their executables available on `PATH`. Git is required to download the skeleton even if you skip initializing a new repository. On Windows, the prerequisite check requires executable binaries rather than `.cmd` or `.bat` wrappers.

Python **3.14 or newer** runs the installer. The generated application uses stable Python **3.14.x**, which the installer locates through uv and verifies independently. If necessary, it requests a managed Python download according to uv's network and download policies. With downloads disabled or offline mode enabled, that interpreter must already be available.

Run creation from a directory whose new project destination has an existing parent. The destination must not already exist, even as an empty directory. Redirected paths and destinations inside a uv workspace are rejected. A nonempty `UV_CONFIG_FILE` is also rejected; use supported uv configuration and environment settings for package indexes, proxies, and downloads.

## Create a local project

Use an explicit distribution when invoking the installer:

```bash
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new blog --no-interaction --no-migrate
cd blog
uv run python -B reactor serve
```

This creates the **Blank** stack with local file storage and SQLite, then starts the application. In development, the server binds to [http://127.0.0.1:8000](http://127.0.0.1:8000); `/` displays the skeleton's welcome view and `/up` is its health route. Stop the server with Ctrl+C. Creation does not start the HTTP server automatically.

`uvx --python 3.14` chooses the installer's interpreter. `uv run python -B reactor ...` uses the generated application's environment. Both the framework and the installer can expose an executable named `orionis`; the explicit `--from orionis-installer` invocation identifies the tool you intend to run.

For the unpinned distribution currently available from your index:

```bash
uvx --from orionis-installer orionis --version
uvx --from orionis-installer orionis new
```

Alternatively, install it as a uv tool:

```bash
uv tool install --python 3.14 orionis-installer==0.7.0
orionis --version
orionis new blog
```

Confirm that `orionis --version` reports the installer before using that executable. The explicit uvx form remains useful when another `orionis` is on `PATH`.

## Interactive creation

Run the wizard in an interactive terminal:

```bash
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new blog
```

The wizard checks prerequisites and asks for the following omitted values:

1. **Stack:** Blank by default, or SSR.
2. **Name:** `orionis-app` by default; the argument `blog` supplies it directly.
3. **Description:** `A modern application built with Orionis Framework.` by default.
4. Optional author name and email.
5. Storage drivers and, when choosing `all`, the active disk.
6. Database drivers and, when choosing `all`, the active connection.
7. Confirmation of the destination, stack, source branch, Python target, and extras.

Explicit options skip their corresponding questions. Declining the final confirmation exits successfully without creating the application. After successful creation, the wizard offers Git initialization (Yes), migrations (No), and Visual Studio Code (Yes), in that order. Choose **No** for migrations until you have reviewed the seeders described below. Opening VS Code requires its `code` launcher.

Names contain 1–100 ASCII letters, digits, dots, hyphens, or underscores and start and end with a letter or digit. Path separators, traversal, controls, and reserved Windows names are rejected. Descriptions and author names support Unicode; `--path` can contain spaces and Unicode. The application name and its final destination are separate values.

## Stacks

| Option | Source branch | Starting application |
| --- | --- | --- |
| `--stack blank` | `blank_1.x` | Application bootstrap, configuration, routing files, models, migrations, and a welcome view. |
| `--stack ssr` | `ssr_1.x` | The shared foundation plus server-rendered authentication, profile, and administration controllers and views. |

Both branches belong to the [official skeleton repository](https://github.com/orionis-framework/skeleton). Stack names are case-insensitive. Only the selected branch is downloaded; an unavailable branch stops installation without switching to another stack.

The linked Blank and SSR skeleton versions declare `orionis>=0.805.0` and an application version of `0.2.0` in `pyproject.toml`. The installer preserves that requirement and application version while merging the selected extras. Installation downloads the selected branch, so a newer revision may declare different values; uv resolves the framework version from that requirement. See the [Blank manifest](https://github.com/orionis-framework/skeleton/blob/429363cd2b15242d360d024f4f870736a29c068f/pyproject.toml) and [SSR manifest](https://github.com/orionis-framework/skeleton/blob/3e130de10d44b97f7fc15eb2fb3b59e399d532e6/pyproject.toml).

## Non-interactive creation and options

`--no-interaction` reads no input and requires no TTY. Omitted values use Blank, `orionis-app`, the default description, no author, local storage, and SQLite. Git initialization, migrations, and the editor are skipped unless their positive flags are supplied.

```bash
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new portal --stack ssr --no-interaction --git --no-migrate --no-open
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new analytics --no-interaction --storage s3 --database redshift
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new team --no-interaction --storage all --database all
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new blog --no-interaction --path "./Project with spaces" --author-name "Jane Doe" --author-email jane@example.com
```

| Option | Effect |
| --- | --- |
| `new [NAME]` | Application name; defaults to `orionis-app` when omitted without interaction. |
| `--stack blank\|ssr` | Select the skeleton; defaults to Blank. |
| `--path PATH` | Final destination; otherwise the current directory plus the application name. Its parent must exist. |
| `--description TEXT` | Application description. |
| `--author-name TEXT`, `--author-email TEXT` | Optional author metadata; empty values omit the corresponding field. |
| `--storage local\|s3\|azure\|gcs\|all` | Storage dependencies; defaults to local. |
| `--default-storage local\|s3\|azure\|gcs` | Active disk when using `all`; defaults to local. |
| `--database sqlite\|mysql\|pgsql\|oracle\|sqlserver\|redshift\|all` | Database dependencies; defaults to SQLite. |
| `--default-database sqlite\|mysql\|pgsql\|oracle\|sqlserver\|redshift` | Active connection when using `all`; defaults to SQLite. |
| `--git / --no-git` | Initialize a repository or skip it. |
| `--migrate / --no-migrate` | Run migrations **and seeders** in this implementation, or skip them. |
| `--open / --no-open` | Open Visual Studio Code or skip it. |
| `--no-interaction` | Use defaults and explicit flags without prompts. |
| `--no-color` | Disable colors; `NO_COLOR` also applies, including an empty value. |
| `--verbose` | Display additional plan diagnostics. |

`--version`, `--no-color`, and `--verbose` work globally; the last two also work after `new`. Request command help with `orionis new --help` through the same uvx invocation. A default driver must be concrete. Without `all`, an explicit default must match the selected driver.

## Drivers and extras

| Storage selection | Added Orionis extra |
| --- | --- |
| `local` | None |
| `s3` | `s3` |
| `azure` | `azure` |
| `gcs` | `gcs` |
| `all` | `storage` |

| Database selection | Added Orionis extra |
| --- | --- |
| `sqlite` | None |
| `mysql` | `mysql` |
| `pgsql` | `pgsql` |
| `oracle` | `oracle` |
| `sqlserver` | `sqlserver` |
| `redshift` | `redshift` |
| `all` | `database` |

Every project adds `factories`. Local storage plus SQLite therefore adds `factories`; S3 plus Redshift adds `factories,redshift,s3`; both `all` selections add `database,factories,storage`. Existing skeleton extras are preserved. Aggregate selections install several drivers while the application uses one active disk and one active database connection.

Configure service credentials after installation. Cloud SDK installation creates no bucket, account, or permissions. External databases require a reachable server and connection values. The installer uses `configure-me` as a placeholder username, leaves the password unconfigured, and sets the conventional port for the selected driver. Oracle additionally requires `DB_SERVICE_NAME`; SQL Server requires the appropriate system ODBC driver. Continue with [Database and ORM](/en/database) and [Storage](/en/services/storage).

## Generated environment and first startup

The installer clones into a sibling staging directory, checks the selected branch and revision, removes the clone's `.git`, configures files, and publishes the project at its final path. It runs `uv sync --python 3.14` there, creating the project-local `.venv` and `uv.lock`. It preserves valid development groups and keeps `tool.uv.package = false`.

It creates `.env` from `.env.example` (or the supported `env.example` name), preserving the example, and sets `APP_NAME`, `FILESYSTEM_DISK`, and `DB_CONNECTION`. Some literal values are stored using Orionis's `base64:` type to preserve their exact text. `APP_KEY` is generated through the application's framework command if missing; an existing key is preserved. Keep that key stable and private for encrypted data.

With the linked skeleton versions, the defaults are SQLite at `database/database.sqlite`, a file cache, synchronous queue dispatch, and process-local memory sessions. They permit a local welcome-page startup without separate Redis or queue services. SSR's authentication and model-backed pages require the database tables; apply schema migrations before using those features:

```bash
cd portal
uv run python -B reactor migrate
uv run python -B reactor serve
```

`reactor migrate` alone runs schema migrations. To use a different development port:

```bash
uv run python -B reactor serve --port 8001
```

The generated `bootstrap/app.py` constructs the application, enables its bootstrap cache, registers routes, providers and other components, and calls `create()`. The root `reactor` script imports it and dispatches the command through Orionis's asynchronous loop. Continue with [Creating and starting an application](/en/getting-started/getting-started) and [Application lifecycle](/en/getting-started/application-lifecycle).

### Migration behavior in installer 0.7.0

The implementation of [`_migrate`](https://github.com/orionis-framework/installer/blob/ceb8e8db2ce0b410fdd34817f9c411008785f5c2/src/orionis_installer/post_install.py#L357) invokes the application's Python with `-B reactor migrate --seed`. Accepting the wizard's migration option or passing `--migrate` therefore also requests seeders, although the README and command comments describe schema-only migration. Use the actual invocation when assessing its effect.

Both linked skeleton versions contain an administrative seeder with fixed example credentials. Review and change its credential handling before requesting seeders. Creating with `--no-migrate` and then running `reactor migrate` manually lets you prepare the schema first. After reviewing the connection and adapting the application's seeders, request them explicitly:

```bash
uv run python -B reactor migrate --seed
```

For an external database, the interactive migration path can ask to configure missing connection fields. The non-interactive path never requests credentials and fails the requested operation when those fields are incomplete. The installer does not automatically roll back database changes.

## Exit codes and recovery

| Code | Meaning |
| --- | --- |
| `0` | Creation and requested operations completed or were skipped; also used when final confirmation is declined. |
| `1` | Download, filesystem, or dependency-process failure. |
| `2` | Invalid arguments, missing prerequisites, or a skeleton/framework compatibility failure. |
| `3` | Project created, but a requested Git, migration, or editor operation failed. |
| `130` | Cancellation or end of interactive input. |

Failures before publication clean the owned staging area. Failures after publication preserve the destination and provide recovery guidance. An existing destination cannot be passed to `new` again. Review the error and the preserved files, correct the cause, then complete the environment from that project:

```bash
cd blog
uv sync --python 3.14
uv run python -B reactor key:generate
uv run python -B reactor serve
```

These commands address dependency and key setup; a missing or incompatible skeleton file still needs correction. Git initialization runs only `git init`, with no commit or remote. Post-install operations continue independently after a failure unless cancelled. Inspect the affected database before retrying a migration; no automatic rollback or `migrate:fresh` runs.

If startup cannot import `bootstrap.app`, run Reactor from the application root. For missing dependencies, check that `uv run` uses the local environment and that the required extra is installed. For invalid configuration or stale bootstrap state, consult [Typed configuration](/en/getting-started/configuration) and [Directories and bootstrap caching](/en/getting-started/paths-and-caching).
