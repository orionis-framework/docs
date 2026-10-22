---
title: "Gestión de conexiones"
description: "Resolución perezosa, nombres, inyección, registro dinámico y API de ConnectionManager."
editUrl: true
lastUpdated: false
---

Cada nombre identifica una configuración y un objeto `Connection` reutilizable, no una sesión física permanentemente abierta. El gestor conserva los objetos resueltos y el engine adquiere conexiones físicas por operación o transacción.

La configuración tipada admite `sqlite`, `mysql`, `pgsql`, `oracle`, `sqlserver` y `redshift`. Para utilizar dos bases del mismo motor registra nombres adicionales durante el arranque; no añadas `reporting=...` a `Connections`: sus campos son fijos.

## Selección por operación

```python
from orionis.support.facades import DB


async def list_notes():
    primary = await DB.table("notes", connection="sqlite").get()
    reporting = await DB.connection("reporting").table("notes").get()
    raw = await DB.select("SELECT id, body FROM notes", name="reporting")
    return {"primary": primary, "reporting": reporting, "raw": raw}
```

`DB.connection()` no cambia a otros consumidores. `setDefaultName()` sí modifica el predeterminado compartido. Toda operación participante en una transacción debe resolver el mismo nombre.

## Registrar una segunda conexión

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

Registra el provider con `app.withProviders(ReportingProvider)` en `bootstrap/app.py` junto a los existentes. El directorio `database` debe existir. El ejemplo copia opciones ya validadas y cambia el archivo; mantiene `url` coherente aunque el runtime utiliza `database`.

`addConnection()` no repite la validación completa de la configuración tipada: para una configuración nueva construye una entidad de driver y usa `toDict()`. No registres credenciales recibidas sin control desde una petición.

## ConnectionManager

`ConnectionManager(app: IApplication)` consume `app.config("database")` como entidad `Database` o diccionario. El contenedor la registra como singleton bajo `IConnectionManager`. Estos son todos sus métodos públicos:

### connection()

```text
def connection(self, name: str | None = None) -> IConnection:
```

Resuelve `name` o el predeterminado; crea y cachea `Connection` en el primer acceso. No hace E/S todavía. Nombre desconocido: `ConnectionNotFoundException`. Driver inválido: `UnsupportedDriverException` al construir la conexión.

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

Registra o reemplaza configuración; nombre vacío produce `ValueError` y configuración no `dict` produce `TypeError`. Conserva el diccionario recibido. Una conexión cacheada sigue usando su copia anterior hasta desconectarla.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    manager.addConnection("reporting", {"driver": "sqlite", "database": "database/reporting.sqlite"})
```

### hasConnection()

```text
def hasConnection(self, name: str) -> bool:
```

Comprueba registro, no conectividad. La búsqueda distingue mayúsculas y minúsculas.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    assert manager.hasConnection("sqlite")
```

### getDefaultName()

```text
def getDefaultName(self) -> str:
```

Devuelve el predeterminado del gestor. La construcción inicial normaliza ese nombre a minúsculas; no implica conexión física abierta.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    name = manager.getDefaultName()
```

### setDefaultName()

```text
def setDefaultName(self, name: str) -> None:
```

Selecciona un nombre registrado o lanza `ConnectionNotFoundException`. Cambia futuras operaciones sin selección explícita, pero no builders que ya fijaron conexión.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    manager.setDefaultName("sqlite")
```

### configFor()

```text
def configFor(self, name: str | None = None) -> dict[str, Any]:
```

Devuelve el diccionario registrado, no una copia. Nombre desconocido: `ConnectionNotFoundException`. Copia con `dict(...)` antes de personalizar. Puede incluir contraseñas: no lo expongas al cliente.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


def example(manager: IConnectionManager):
    settings = dict(manager.configFor("sqlite"))
```

### disconnect()

```text
async def disconnect(self, name: str | None = None) -> None:
```

Con nombre elimina esa instancia cacheada y espera su cierre; nombre no cacheado no hace nada. `None` vacía la caché y cierra todas secuencialmente. La configuración permanece registrada. Un fallo de cierre se propaga. No lo ejecutes por petición.

```python
from orionis.database.contracts.connection_manager import IConnectionManager


async def example(manager: IConnectionManager):
    await manager.disconnect("reporting")
```

## Inyección por constructor y método

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

`IConnection` representa una conexión concreta; no tiene un binding automático único para elegir arbitrariamente un nombre. Inyecta el gestor o registra un binding propio.

Para cambiar una configuración cacheada utiliza `await manager.disconnect(name)` antes de resolver otra vez. Una referencia anterior a `Connection` puede reconstruir el engine con sus ajustes antiguos: cambiar el registro no actualiza referencias existentes. No desconectes un servicio compartido mientras otras tareas lo usan.
