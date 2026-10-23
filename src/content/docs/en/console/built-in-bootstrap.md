---
title: "Project bootstrap and recovery"
description: "Seven commands for enabling optional contexts and restoring missing configuration while preserving local files."
editUrl: true
lastUpdated: false
---

`bootstrap:*` commands prepare optional resources and application integration. Configured paths are respected; the conventional destinations below apply only when no effective context selection exists.

For routing, first inspect/validate the application's recorded entry point (or `bootstrap/app.py`), plan a safe source edit and validate existing resources. Only then create missing resources and apply the edit. Existing files are preserved. A context using several route files keeps that list instead of being reduced to one default file.

Output distinguishes `CREATED`, `UPDATED`, `EXISTS` and `SKIPPED`. Changes invalidate existing compiled `config`, `commands` and `routes` files beneath `compiledPath`. Normal completion returns `0`; filesystem, type, configuration, syntax or safe-edit errors are displayed with status `1`. There is no `--force` or overwrite mode.

<a id="command-bootstrap-ai"></a>

## bootstrap:ai

Enable MCP server routes.

Takes no arguments or command-specific options; automatic help remains available.

Create the effective AI route file (default `routes/ai.py`) and MCP server/tool/resource/prompt directories. Integrate `ai=...` with `withRouting()`; complete servers and their components are not generated automatically.

```shell
orionis bootstrap:ai
python -B reactor bootstrap:ai
```

<a id="command-bootstrap-api"></a>

## bootstrap:api

Enable API routing.

Takes no arguments or command-specific options; automatic help remains available.

Create the effective API route file (default `routes/api.py`) and HTTP controller, middleware, schema and rule directories. Integrate `api=...` with `app.withRouting()` while preserving other contexts and the health endpoint.

```shell
orionis bootstrap:api
python -B reactor bootstrap:api
```

<a id="command-bootstrap-config"></a>

## bootstrap:config

Restore missing official configuration files.

| Argument or option | Type and presence | Effective value when omitted | Purpose |
|---|---|---|---|
| `file` | str, optional | `None` | Configuration name without .py; omission recovers all missing files. |

`file` is an optional positional string (`None`): supply a name without `.py`, such as `queue`, or omit it to recover every missing resource under the official `config/` directory. Valid names come from the current `orionis-framework/skeleton` tree on `master`; the parser does not hard-code choices.

HTTPS access to GitHub's API and raw files is required. Validate tree completeness, paths, sizes and Git blob hashes before writing. Existing local files are preserved byte for byte; existing configuration is neither updated nor merged. Individual modules are not registered by editing `bootstrap/app.py`. An unknown selection displays available names and fails; network failures, invalid metadata and unsafe paths also produce status `1`.

```shell
orionis bootstrap:config queue
python -B reactor bootstrap:config queue
```

<a id="command-bootstrap-console"></a>

## bootstrap:console

Enable console routes and directories.

Takes no arguments or command-specific options; automatic help remains available.

Create the effective console route file (default `routes/console.py`), plus configured command/listener directories (normally `app/console/commands` and `app/console/listeners`). Integrate `console=...` with `withRouting()`; implement project commands afterward using classes or Reactor definitions.

```shell
orionis bootstrap:console
python -B reactor bootstrap:console
```

<a id="command-bootstrap-lifespan"></a>

## bootstrap:lifespan

Create and integrate lifecycle callbacks.

Takes no arguments or command-specific options; automatic help remains available.

Create `bootstrap/lifespan.py` using the configured bootstrap directory and integrate its synchronous `register_lifespan_callbacks` function into the application construction source. Preserve existing callbacks and verify that the file exposes that function before adding a call. An existing asynchronous registration function requiring integration is rejected rather than inserting an unawaited call.

```shell
orionis bootstrap:lifespan
python -B reactor bootstrap:lifespan
```

<a id="command-bootstrap-web"></a>

## bootstrap:web

Enable web routing.

Takes no arguments or command-specific options; automatic help remains available.

Create the effective web route file (default `routes/web.py`) and shared HTTP directories. Integrate `web=...` with `withRouting()`. It does not install a frontend or generate controllers for individual routes.

```shell
orionis bootstrap:web
python -B reactor bootstrap:web
```

<a id="command-bootstrap-websocket"></a>

## bootstrap:websocket

Enable WebSocket routing.

Takes no arguments or command-specific options; automatic help remains available.

Create the effective WebSocket route file (default `routes/websocket.py`) and shared HTTP directories, then integrate `websocket=...`. Use Realtime generators for socket/hub classes: this command prepares context integration only.

```shell
orionis bootstrap:websocket
python -B reactor bootstrap:websocket
```

### Recovery limits

Special startup recognizes only an explicit invocation of one of these seven commands without `-h` / `--help`, temporarily bypassing compiled caches. For `bootstrap:api`, `bootstrap:web`, `bootstrap:websocket`, `bootstrap:console` and `bootstrap:ai`, only missing routes for the context being repaired are tolerated. This does not make an arbitrarily broken project bootable.

If `withRouting()` is configured indirectly, application assignments are ambiguous or declared/effective paths cannot be reconciled, the editor refuses to replace configuration it cannot safely interpret. Correct the structure explicitly and rerun the command. Help invocations do not enable recovery and therefore do not repair missing files.
