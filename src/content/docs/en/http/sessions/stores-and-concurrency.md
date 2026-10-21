---
title: "Choosing storage and understanding concurrency"
description: "Configure the memory, file, cache and database drivers, understand session persistence, and handle expiration and concurrent requests."
editUrl: true
lastUpdated: false
---

The driver decides where Orionis stores session data. The cookie holds only the identifier: the payload stays on the server. Changing drivers does not change the `ISession` API or the `Session` facade.

Configure the driver in `config/session.py` or use the variables that file reads from `.env`. Choose one of the following alternatives.

| Driver | Persistence and scope | Typical use |
|---|---|---|
| `memory` | One store instance within one process; lost on restart. | Development and tests with a single process. |
| `file` | Files in the configured directory. | Keeping sessions across restarts on a server with persistent storage. |
| `cache` | Configured cache repository; scope and physical retention depend on its backend. | Reusing Redis, Memcached or another available cache store. |
| `database` | Rows in a table on the selected connection. | Sharing sessions among processes using the same database. |

## Memory: start without additional services

```dotenv
SESSION_DRIVER=memory
```

This is the default in `config/session.py`. It does not need session files, Redis or a database table.

Each instance keeps its own dictionary. Two workers do not share data or revocations, even when they belong to the same application. Restarting the process removes its stored sessions; the browser may retain a cookie whose record no longer exists.

Choose shared storage when a user's requests can reach different processes or servers.

## File: persist on the filesystem

```dotenv
SESSION_DRIVER=file
SESSION_FILES=storage/framework/sessions
```

A relative path is resolved from the project root. Orionis creates the directory if it does not exist and saves one `<identifier>.json` file per session, containing its data and expiration date.

The account running the application needs permission to create, read, replace and delete files in that directory. If the deployment uses containers, preserve the directory between replacements to retain those sessions.

The store runs I/O in worker threads and publishes each write through a temporary file and an atomic replacement. Its locks coordinate reads, updates and deletion among processes accessing the same directory. This protects individual storage operations; it does not lock the entire request.

Several processes on one server can use the same directory. On different servers, identically named paths do not share files: they need a common volume with suitable locking and replacement semantics, or a network backend such as Redis or a database.

## Cache: use a cache repository

The session driver is `cache`; `SESSION_CACHE_STORE` selects the actual backend. For example, to use Redis:

```dotenv
SESSION_DRIVER=cache
SESSION_CACHE_STORE=redis

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
```

This example uses the Redis configuration from `config/cache.py` and needs an accessible Redis server at that address. If it requires authentication, also configure `REDIS_PASSWORD`.

The native repository names are `memory`, `file`, `redis`, `memcached` and `database`. Their configuration and requirements belong to the [cache system](/en/services/cache/stores-and-locks/). If you do not define `SESSION_CACHE_STORE`, the default cache repository is used, selected through `CACHE_STORE` in the project configuration.

The store saves each session under `session:<identifier>` and also applies `CACHE_PREFIX` when configured. TTL is calculated from the time remaining until the session expires, rounded up to whole seconds. Updating an existing session uses the cache's conditional replacement operation rather than unconditionally creating the key.

Scope depends on the repository: `cache` with `SESSION_CACHE_STORE=memory` remains local to the process; selecting `cache` alone does not make sessions shared. Deleting entries from that repository, including sessions, causes affected clients to start a new session.

## Database: share sessions through a table

To use the SQLite connection defined in `config/database.py`:

```dotenv
SESSION_DRIVER=database
SESSION_DB_CONNECTION=sqlite
SESSION_DB_TABLE=sessions

DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite
```

`SESSION_DB_CONNECTION` is the name of a configured connection, not a URL or an independent driver name. When omitted, the manager uses the default database connection. `SESSION_DB_TABLE` defaults to `sessions`; the connection's configured prefix is applied.

The store uses this structure:

| Column | Contents |
|---|---|
| `id` | String of up to 255 characters; primary key holding the session identifier. |
| `payload` | JSON text containing session data. |
| `expires_at` | Integer holding expiration as Unix seconds. |

The table is checked and created, if missing, on the store's first operation. The connection must be available and have the permissions needed for that creation when applicable. An existing table must match the expected structure; the store does not transform an incompatible schema.

The project also includes a migration for the `sessions` table. If you manage the schema through [project migrations](/en/database/migrations-and-seeders/), you can run the usual command before serving requests:

```bash
orionis migrate
```

Or its alternative through the local `reactor` file:

```bash
python -B reactor migrate
```

These commands apply **all pending migrations** on the selected connection, not just the sessions table. If you change the session table name or connection, also adapt any migration you choose to use.

The driver requires a connection with enforced unique constraints. The implementation rejects Redshift for sessions because it does not provide the required guarantee of a single row per identifier.

## Use data that can persist with any driver

Controller logic remains the same with all four drivers. For example, in `app/http/controllers/display_preferences_controller.py`:

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

Register these actions in `routes/web.py`, where middleware starts and saves the session:

```python
from app.http.controllers.display_preferences_controller import DisplayPreferencesController
from orionis.support.facades import Route


Route.put("/settings/display/compact", [DisplayPreferencesController, "compact"])
Route.get("/settings/display", [DisplayPreferencesController, "show"])
```

The `PUT` request must include the WEB flow's [CSRF token](/en/http/sessions/configuration-and-security/). A later `GET /settings/display` request with the same cookie receives the persisted values, provided the session is still valid.

File and database serialize the payload as JSON through `msgspec`; native cache repositories also use JSON serialization. Store strings, numbers, booleans, `None`, lists and dictionaries with string keys. A date may return as a string and a tuple as a list; transform those values explicitly if you need to reconstruct their types.

The `memory` store copies records and can retain objects that do not behave the same when serialized. Avoid storing ORM models, connections, requests or other live objects assuming they will behave identically after switching drivers.

## Concurrent requests and revocation

Orionis distinguishes between creating a new session and updating an existing one. If another request deletes or expires the record before it is saved, the conditional update fails and the delayed request does not recreate it. Identifier rotation deletes the previous record first.

This protects revocation, but **does not merge changes from two requests** to a still-valid session. For example:

1. Two requests load the same session cart.
2. Each adds a product to its own copy.
3. Both save the entire payload.
4. The last accepted write may replace the other's changes.

File locks and conditional database/cache updates protect storage operations; they do not provide a transaction around the whole controller. For quantities that must be updated without loss, use domain data and its concurrency controls, such as a [database transaction](/en/database/transactions/).

## Expiration, cleanup and backend changes

`SESSION_LIFETIME` sets the session lifetime in minutes. [Renewal configuration](/en/http/sessions/configuration-and-security/) controls when an unchanged payload is saved again and when its cookie is renewed.

An expired record is no longer valid even if it still exists physically. Memory, file and database reject expired records on read; file also discards corrupt files. Cache checks expiration and uses the repository's TTL, whose physical cleanup depends on the backend.

Stores provide `gc()` to collect expired records; in cache it is a no-op because expiration is delegated to the repository. The session manager does not schedule automatic bulk collection. If you need to remove expired files or rows that no longer receive reads, add explicit maintenance for the chosen storage.

Changing the driver, directory, cache repository, prefix or table changes where Orionis looks for sessions. Existing records are not migrated automatically. Plan the change knowing that existing cookies may no longer find their session.
