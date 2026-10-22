---
title: "Connection management"
description: "Lazy resolution, names, injection, runtime registration and the ConnectionManager API."
editUrl: true
lastUpdated: false
---

Each name identifies configuration and a reusable `Connection` object, not a permanently open physical session. The manager caches resolved objects; the engine acquires physical connections per operation or transaction.

Typed configuration accepts `sqlite`, `mysql`, `pgsql`, `oracle`, `sqlserver` and `redshift`. Register additional names during startup for multiple databases of one backend; do not add `reporting=...` to `Connections`: its fields are fixed.

## Per-operation selection

```python
from orionis.support.facades import DB


async def list_notes():
    primary = await DB.table("notes", connection="sqlite").get()
    reporting = await DB.connection("reporting").table("notes").get()
    raw = await DB.select("SELECT id, body FROM notes", name="reporting")
    return {"primary": primary, "reporting": reporting, "raw": raw}
```

`DB.connection()` does not change other callers' targets. `setDefaultName()` changes the shared default. Every operation participating in a transaction must resolve the same name.

## Registering a second connection

```python
from orionis.container.providers.service_provider import ServiceProvider
from orionis.database.contracts.connection_manager import IConnectionManager


class ReportingProvider(ServiceProvider):
    async def boot(self, manager: IConnectionManager) -> None:
        settings = dict(manager.configFor("sqlite"))
        settings["database"] = "database/reporting.sqlite"
        settings["url"] = "sqlite:///database/reporting.sqlite"
        manager.addConnection("reporting", settings)
```

Register the provider with `app.withProviders(ReportingProvider)` in `bootstrap/app.py` alongside existing providers. The `database` directory must exist. The example copies validated settings and changes the file; `url` stays consistent although runtime uses `database`.

`addConnection()` does not repeat complete typed-configuration validation: construct a driver entity and use `toDict()` for new settings. Do not register uncontrolled credentials received from a request.

## ConnectionManager

`ConnectionManager(app: IApplication)` consumes `app.config("database")` as a `Database` entity or dictionary. The container registers it as an `IConnectionManager` singleton. These are all its public methods:

### connection()

```text
def connection(self, name: str | None = None) -> IConnection:
```

Resolves `name` or the default and caches `Connection` on first access. No I/O yet. Unknown name: `ConnectionNotFoundException`. Invalid driver: `UnsupportedDriverException` during construction.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    connection = manager.connection("sqlite")
    assert connection.getName() == "sqlite"
```

### addConnection()

```text
def addConnection(self, name: str, config: dict[str, Any]) -> None:
```

Registers or replaces settings; empty names raise `ValueError` and non-`dict` settings raise `TypeError`. Retains the supplied dictionary. A cached connection keeps its previous copy until disposed.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    manager.addConnection("reporting", {"driver": "sqlite", "database": "database/reporting.sqlite"})
```

### hasConnection()

```text
def hasConnection(self, name: str) -> bool:
```

Checks registration rather than connectivity. Name lookup is case-sensitive.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    assert manager.hasConnection("sqlite")
```

### getDefaultName()

```text
def getDefaultName(self) -> str:
```

Returns the manager default. Initial construction lowercases this name; it does not imply an open physical connection.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    name = manager.getDefaultName()
```

### setDefaultName()

```text
def setDefaultName(self, name: str) -> None:
```

Selects a registered name or raises `ConnectionNotFoundException`. Changes future unnamed operations, not builders with a captured connection.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    manager.setDefaultName("sqlite")
```

### configFor()

```text
def configFor(self, name: str | None = None) -> dict[str, Any]:
```

Returns the registered dictionary, not a copy. Unknown name: `ConnectionNotFoundException`. Copy with `dict(...)` before customization. It can contain passwords: never expose it to clients.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    settings = dict(manager.configFor("sqlite"))
```

### disconnect()

```text
async def disconnect(self, name: str | None = None) -> None:
```

With a name removes and disposes that cached instance; an uncached name is a no-op. `None` clears the cache and disposes all instances sequentially. Settings remain registered. Disposal failures propagate. Do not call per request.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


async def example(manager: IConnectionManager):
    await manager.disconnect("reporting")
```

## Constructor and method injection

```python
from orionis.database.contracts.connection_manager import IConnectionManager
from orionis.http import JSONResponse


class DatabaseStatusController:
    def __init__(self, manager: IConnectionManager) -> None:
        self.manager = manager

    async def index(self) -> JSONResponse:
        rows = await self.manager.connection().select("SELECT 1 AS ready")
        return JSONResponse({"ready": rows[0]["ready"] == 1})

    async def name(self, manager: IConnectionManager) -> JSONResponse:
        return JSONResponse({"connection": manager.getDefaultName()})
```

`IConnection` represents a specific connection; there is no single automatic binding that arbitrarily chooses a name. Inject the manager or register your own binding.

After replacing cached settings, call `await manager.disconnect(name)` before resolving again. An older `Connection` reference can recreate an engine with its old settings: registration updates do not update existing references. Do not dispose shared services while other tasks use them.
