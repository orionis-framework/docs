---
title: "Application and maintenance commands"
description: "Syntax and options for inspection, serving, tests, optimization, maintenance, clearing, keys and packages."
editUrl: true
lastUpdated: false
---

This reference covers general project commands. Each example shows both execution alternatives; use the one matching your environment. Parameterless commands do not accept additional filters; all commands support `-h` / `--help`.

`serve` and `test` options take precedence over configuration values where their implementations consult them. Cleanup commands operate on specific resources and are not interchangeable.

<a id="command-about"></a>

## about

Show installed framework metadata.

Takes no arguments or command-specific options; automatic help remains available.

Display the name, installed version, description, author, Python requirement and framework links. This reports the running package and does not check remote updates.

```shell
orionis about
python -B reactor about
```

<a id="command-clear-cache"></a>

## clear:cache

Clear the default cache store.

Takes no arguments or command-specific options; automatic help remains available.

Call `ICacheManager.clear()`. Its scope depends on the configured driver/namespace; it takes no store name. Return `0` when the service confirms clearing, or `1` for a false result or recognized backend error. Errors outside these families propagate.

```shell
orionis clear:cache
python -B reactor clear:cache
```

<a id="command-clear-logs"></a>

## clear:logs

Remove framework log files.

Takes no arguments or command-specific options; automatic help remains available.

Close `ILogger` first, remove `.log` / `.log.gz` below `storage_logs`, and also handle configured channel `path` values outside that directory (including dynamic filename suffixes). A dynamic directory containing `{suffix}` is reported as an error rather than cleared. Report removed counts and return `1` if any path fails.

```shell
orionis clear:logs
python -B reactor clear:logs
```

<a id="command-clear-testing"></a>

## clear:testing

Remove cached test results.

Takes no arguments or command-specific options; automatic help remains available.

Recursively remove `.json` files beneath `storage_framework/cache/testing`. Test source files are retained and the runner is not started. Report the count and return `1` on deletion errors.

```shell
orionis clear:testing
python -B reactor clear:testing
```

<a id="command-clear-views"></a>

## clear:views

Remove compiled view bytecode.

Takes no arguments or command-specific options; automatic help remains available.

Read `view.cache_path` and recursively remove files ending in `.cache` beneath it. Relative paths are resolved against the application root. If the setting is `None`, report disabled caching and return `0`; an invalid path type or deletion errors returns `1`. Source templates are retained.

```shell
orionis clear:views
python -B reactor clear:views
```

<a id="command-down"></a>

## down

Enable the HTTP maintenance state.

Takes no arguments or command-specific options; automatic help remains available.

Write `down` to `storage_framework/maintenance` using a temporary file and a `FileLock`-protected replacement. HTTP middleware reads this shared marker. The command does not stop HTTP processes or queue/scheduler workers. Return `0` on persistence or `1` on filesystem errors.

```shell
orionis down
python -B reactor down
```

<a id="command-env"></a>

## env

Show the application environment.

Takes no arguments or command-specific options; automatic help remains available.

Read and print the `app.env` configuration value. It takes no environment name and does not edit `.env`.

```shell
orionis env
python -B reactor env
```

<a id="command-key-generate"></a>

## key:generate

Generate and persist the application encryption key.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--force` | Flag, optional | `False` | Bypass confirmation (db:wipe) or replace APP_KEY (key:generate). |

Read `app.cipher` (falling back to `AES_256_CBC`), generate a valid key and save it through `Env.set("APP_KEY", ...)`. An existing `APP_KEY` is preserved with status `0`; enable `--force` (default `False`) to replace it. Persistence failures return `1`. Replacement affects data encrypted with the previous key: consult the encryption guide before using `--force` on an existing application.

```shell
orionis key:generate
python -B reactor key:generate
```

<a id="command-list"></a>

## list

List Reactor's loaded command registry.

Takes no arguments or command-specific options; automatic help remains available.

Display signatures and descriptions for native commands, discovered application commands and route-defined commands. It takes no filters or command names as arguments. To inspect a signature's options, run that signature with `--help`.

```shell
orionis list
python -B reactor list
```

<a id="command-optimize"></a>

## optimize

Validate project Python syntax.

Takes no arguments or command-specific options; automatic help remains available.

Walk project `.py` files and compile them in memory with `optimize=2`. It does not import modules, run tests, write bytecode or prewarm service caches. Virtual environments, `.git`, common caches, `node_modules`, `build`, `dist` and `*.egg-info` directories are excluded. Return `1` on reading, traversal or compilation errors and `0` when all sources validate.

```shell
orionis optimize
python -B reactor optimize
```

<a id="command-optimize-clear"></a>

## optimize:clear

Remove compiled application artifacts.

Takes no arguments or command-specific options; automatic help remains available.

Remove `__pycache__` directories, `.pyc` / `.pyo` files, top-level `build`, `dist` and `*.egg-info`, and the `config`, `commands` and `routes` cache files beneath `app.compiledPath` (or `storage_framework/cache` when unset). Virtual environments and dependencies are excluded from bytecode traversal. It does not flush every application cache store: use `clear:cache` for the default store. Cleanup groups are reported; return `1` if any removal fails, otherwise `0`. There is no `--dry-run` flag.

```shell
orionis optimize:clear
python -B reactor optimize:clear
```

<a id="command-packages"></a>

## packages

Install optional Orionis extras and dependency groups.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `options` | str, optional | `[]` | Zero or more catalog names/numbers. Count: zero or more. |
| `--list` | Flag, optional | `False` | Display catalog without installing. |
| `--yes` / `-y` | Flag, optional | `False` | Bypass installation confirmation. |

`options` takes zero or more catalog names or numbers. It accepts unambiguous short names, `extra:NAME`, `group:NAME`, displayed indices and selections separated by spaces or commas. Enable `--list` (default `False`) to display the catalog without installing. `--yes` / `-y` (default `False`) bypasses confirmation. With no selection, an interactive terminal asks what to install (`0` cancels); without a terminal it explains that names are needed. A supplied selection in a noninteractive process requires `--yes`.

Manifest lookup tries bundled Orionis first, then the source/editable framework root, then the application. It reads `[project.optional-dependencies]`, `[dependency-groups]` (including group references, with cycle detection) and `[tool.orionis.packages]` descriptions. Requirements are deduplicated while preserving their markers.

Run `uv pip install --python <current interpreter> -- <requirements>` without a shell. `uv` must be on PATH; connectivity is needed when packages are unavailable locally. Only that environment changes: the manifest and lockfile are not rewritten. Return the installer's positive status, `1` when `uv` is missing/an error occurs, or `130` when interrupted. For reproducibility, declare required project dependencies and update the lockfile.

```shell
orionis packages --list
python -B reactor packages --list
```

<a id="command-route-list"></a>

## route:list

Inspect registered HTTP routes.

Takes no arguments or command-specific options; automatic help remains available.

Load routes through `RouteLoader` and display method, URI, name, action and compiled middleware, ordered by path. It has no `--path`, `--method` or JSON-format flags. An empty registry reports the problem and returns `1`; a populated registry returns `0`.

```shell
orionis route:list
python -B reactor route:list
```

<a id="command-serve"></a>

## serve

Start the application's Granian HTTP server.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--interface` / `-i` | str, optional | `rsgi` | Server HTTP interface. Choices: `rsgi`, `asgi`. |
| `--port` / `-p` | int, optional | `8000` | TCP port; integer. |
| `--log` | Flag, optional | `False` | Enable server logging at info level. |
| `--export` | Flag, optional | `False` | Print the resolved Granian command without starting it. |

`--interface` / `-i` accepts `rsgi` or `asgi`, with an effective default of `rsgi`. `--port` / `-p` is an integer; normal execution defaults to port `8000`. `--log` enables `info` logging; without it, production uses `error` and development disables server logging. `--export` prints the resolved Granian command and exits without starting the server.

Normal execution binds to `127.0.0.1` outside production and `0.0.0.0` in production; the CLI does not expose `--host`. Windows uses one worker and the `auto` loop; other systems use the CPU count and `uvloop`. Reload is enabled outside production when valid watch directories exist; paths containing spaces are excluded from that set. Static mounting comes from the `public` filesystem disk.

Windows with an active debugger uses the embedded server: in that variant omitted host/port are read from `app.host` / `app.port` before falling back to defaults. These values do not replace the normal execution behavior.

```shell
orionis serve --interface asgi --port 8001
python -B reactor serve --interface asgi --port 8001
```

<a id="command-test"></a>

## test

Run application tests.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `--verbosity` / `-v` | int, optional | `testing.verbosity` | Result verbosity: 0, 1 or 2. |
| `--fail-fast` / `-f` | int, optional | `testing.fail_fast` | 1 stops at the first failure; 0 continues. |
| `--start-dir` / `-s` | str, optional | `testing.start_dir` | Starting directory for test discovery. |
| `--file-pattern` | str, optional | `testing.file_pattern` | Test filename pattern. |
| `--method-pattern` | str, optional | `testing.method_pattern` | Test method-name pattern. |
| `--panel` | Flag, optional | `True` | Enable/disable result panels. |
| `--no-panel` | Flag, optional | `True` | Enable/disable result panels. |

Omitted selection options are resolved through `config/testing.py`: `verbosity` (`2` in the base configuration), `fail_fast` (`False`), `start_dir` (`tests`), `file_pattern` (`test_*.py`) and `method_pattern` (`test*`). `--verbosity` / `-v` accepts `0`, `1` or `2` and rejects other integers. `--fail-fast` / `-f` takes an integer rather than acting as a flag: use `1` to stop at the first failure or `0` to continue. `--start-dir` / `-s`, `--file-pattern` and `--method-pattern` are strings. `--panel` keeps panels enabled; `--no-panel` disables them without taking a value. Return `1` if any result is failed or errored, otherwise `0`.

```shell
orionis test --start-dir tests --file-pattern "test_*.py" --method-pattern "test*" --verbosity 2 --fail-fast 0 --no-panel
python -B reactor test --start-dir tests --file-pattern "test_*.py" --method-pattern "test*" --verbosity 2 --fail-fast 0 --no-panel
```

<a id="command-up"></a>

## up

Disable the HTTP maintenance state.

Takes no arguments or command-specific options; automatic help remains available.

Write `up` to the same shared maintenance marker; it neither removes the file nor restarts processes. It uses the same protected replacement as `down`, returning `0` / `1` according to the outcome.

```shell
orionis up
python -B reactor up
```

See [Cache](/en/cache), [Views](/en/views), [Encryption](/en/cryptography/encryption) and [Testing](/en/testing) for related services. [Command caching](/en/console/command-cache) explains when Reactor's registry is rebuilt.
