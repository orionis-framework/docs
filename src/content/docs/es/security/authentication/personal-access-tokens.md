---
title: "Autenticación con tokens"
description: "Emite credenciales Bearer, protege endpoints API y administra sus capacidades, vencimiento y revocación."
editUrl: true
lastUpdated: false
---

Un token personal permite autenticar clientes HTTP sin una sesión de navegador. El cliente envía el secreto completo en `Authorization: Bearer …`; el guard `token` busca su registro y resuelve a su propietario. Orionis utiliza tokens **opacos**, revocables y con vencimiento opcional: el valor no contiene un payload JWT ni necesita decodificarse.

El recorrido habitual es: iniciar sesión en la aplicación, emitir un token desde una operación autorizada, entregarlo una sola vez al cliente y utilizarlo en las rutas API protegidas. [Sesiones](/es/security/authentication/identity-and-session), [guards](/es/security/authentication/configuration-and-guards) y [permisos](/es/security/authentication/authorization) explican las piezas que intervienen.

## Preparar la identidad y la base de datos

El modelo configurado en `auth.identity.model` debe implementar `IAuthenticatable` y `IAuthorizable`. En un modelo ORM se consigue con los mixins `Authenticatable` y `Authorizable` de `orionis.auth`; el modelo `User` predeterminado ya los incluye. El token conserva tanto el identificador como el tipo del propietario, derivado de `getAuthorizableType()`.

La aplicación incluye la migración `m0000000011_create_personal_access_tokens_table.py`, que crea `personal_access_tokens`. Con la conexión de base de datos configurada, aplica las migraciones pendientes mediante cualquiera de estas alternativas:

```bash
orionis migrate
```

```bash
python -B reactor migrate
```

Estos comandos aplican todas las migraciones pendientes. Si cambias `auth.tokens.table`, también debes disponer de una tabla con el esquema correspondiente; cambiar el nombre en la configuración no modifica la migración existente.

## Emitir un token desde el navegador

Este ejemplo permite emitir un token de lectura durante siete días. Crea `app/http/controllers/access_token_controller.py`:

```python
from datetime import UTC, datetime, timedelta

from orionis.http import JSONResponse, response
from orionis.support.facades import Auth


class AccessTokenController:

    async def store(self) -> JSONResponse:
        await Auth.authorize("tokens.issue")

        issued = await Auth.createToken(
            "report-client",
            abilities=("reports.read",),
            expires_at=datetime.now(UTC) + timedelta(days=7),
        )

        return response.json(
            {
                "token_type": "Bearer",
                "token": issued.plain_text,
                "metadata": issued.toDict(),
            },
            status_code=201,
            headers={"Cache-Control": "no-store"},
        )
```

Registra la emisión en `routes/web.py`:

```python
from app.http.controllers.access_token_controller import AccessTokenController
from orionis.auth.middleware import AuthenticateSessionMiddleware
from orionis.support.facades import Route

Route.post("/account/tokens", [AccessTokenController, "store"]).middleware(
    AuthenticateSessionMiddleware,
)
```

La ruta exige una sesión autenticada y conserva la protección CSRF del flujo WEB. La identidad debe tener `tokens.issue` para emitir y `reports.read` para utilizar el endpoint de reportes del siguiente apartado. Son permisos de esta aplicación de ejemplo: debes asignarlos mediante el [registro de permisos](/es/security/authentication/authorization).

`Auth.createToken()` toma como propietario la identidad actual. Su argumento opcional `tokenable=` permite indicar otro objeto `IAuthorizable` desde código que ya haya autorizado esa operación; no comprueba por sí mismo si el solicitante puede administrar ese propietario. Una petición autenticada con token no puede emitir otro mediante este método, incluso si proporciona `tokenable=`.

| Argumento | Uso | Predeterminado |
| --- | --- | --- |
| `name` | Etiqueta obligatoria, no vacía, de hasta 255 caracteres. | Sin valor predeterminado. |
| `tokenable` | Propietario explícito que implementa `IAuthorizable`. | Identidad de la petición. |
| `abilities` | Colección de nombres que restringe la credencial. No acepta una cadena como colección. | `None`, sin restricción adicional. |
| `expires_at` | Momento de vencimiento explícito, como `datetime` UTC. | `None`, aplica `auth.tokens.expiration`. |

La colección admite como máximo 256 nombres no vacíos de hasta 255 caracteres cada uno; los duplicados se eliminan. No utilices `"*"` como comodín: las capacidades se comparan por nombre exacto.

### Qué recibe el cliente y qué queda almacenado

`NewAccessToken` contiene dos propiedades:

- `plain_text`: secreto que se entrega al cliente. Solo está disponible en el resultado de la emisión.
- `access_token`: entidad `AccessToken` inmutable con identificador, propietario, nombre, capacidades y fechas.

`issued.toDict()` devuelve `{"access_token": …}` con metadata; no incluye `plain_text`. La representación `repr()` también omite el secreto. Accede expresamente a `issued.plain_text` cuando lo entregues y evita registrarlo.

El secreto se genera con `secrets.token_urlsafe(secret_bytes)`. Se envía completo: **no** tiene formato `id|secreto`. En la base de datos solo se guarda su digest SHA-256 de 64 caracteres, junto con `tokenable_type`, `tokenable_id`, `abilities`, `expires_at`, `last_used_at`, `revoked_at` y las fechas de creación/actualización. No hay una operación para recuperar el secreto posteriormente.

## Consumirlo en una ruta API

Crea `app/http/controllers/token_report_controller.py`. Aquí se utiliza inyección por método: `IAuthManager` ofrece las mismas operaciones que la fachada `Auth`.

```python
from orionis.auth.contracts.manager import IAuthManager
from orionis.http import JSONResponse, response


class TokenReportController:

    async def index(self, auth: IAuthManager) -> JSONResponse:
        await auth.authorize("reports.read")
        return response.json({
            "user_id": auth.identifier(),
            "reports": [{"id": 1, "title": "Monthly summary"}],
        })

    async def revoke(self, auth: IAuthManager) -> JSONResponse:
        revoked = await auth.revokeCurrentToken()
        return response.json({"revoked": revoked})
```

En `routes/api.py`:

```python
from app.http.controllers.token_report_controller import TokenReportController
from orionis.auth.middleware import AuthenticateTokenMiddleware
from orionis.support.facades import Route

Route.group(
    prefix="/api",
    middleware=AuthenticateTokenMiddleware,
    routes=[
        Route.get("/token-reports", [TokenReportController, "index"]),
        Route.delete("/current-token", [TokenReportController, "revoke"]),
    ],
)
```

El prefijo se declara explícitamente en este ejemplo. Estar en `routes/api.py` selecciona el flujo API; no agrega por sí mismo `/api` a la URL.

```bash
curl --header "Accept: application/json" \
     --header "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN" \
     http://localhost:8000/api/token-reports
```

Sustituye `YOUR_PERSONAL_ACCESS_TOKEN` por el valor recibido al emitirlo. El guard lee `request.bearerToken`; una cabecera ausente, vacía o duplicada no aporta una credencial utilizable. El esquema `Bearer` no distingue mayúsculas y minúsculas. Enviar `X-API-Key`, un parámetro de consulta o una cookie no activa este guard.

El flujo API resuelve la identidad incluso en rutas públicas, pero permite continuar a invitados. `AuthenticateTokenMiddleware` es lo que exige un token válido antes de llegar al controlador. Sin autenticación responde `401`; con un token válido pero sin `reports.read`, `authorize()` produce `403`. Consulta [middleware de autenticación](/es/security/authentication/middleware).

## Capacidades del token y permisos del propietario

Las capacidades **limitan** la autorización existente; no otorgan permisos al propietario. Para que `Auth.can("reports.read")` devuelva verdadero, la identidad necesita ese permiso y la credencial debe permitirlo.

| Capacidades emitidas | Efecto sobre `can()` |
| --- | --- |
| `None` | Conserva los permisos del propietario sin un filtro adicional. |
| `("reports.read",)` | Solo permite comprobar favorablemente ese permiso si el propietario ya lo tiene. |
| `()` | No permite ningún permiso. |

Un token de lectura sigue sin poder eliminar reportes aunque su propietario tenga `reports.delete`. Tampoco adquiere `reports.read` si el propietario carece de él.

Los roles siguen perteneciendo a la identidad: `hasRole()` puede indicar que tiene uno aunque el token esté restringido. Para exigir acceso con credenciales restringidas, utiliza permisos o [políticas](/es/security/authentication/policies); el middleware de roles rechaza esas credenciales para evitar saltarse el límite. Las políticas también tienen su propio control de capacidades, explicado en su guía.

## Consultar y revocar los tokens propios

La API pública del repositorio no incluye un método de listado. Para mostrar metadata en una pantalla de cuenta, consulta las columnas públicas y limita siempre por **tipo e identificador del propietario**. El siguiente controlador utiliza inyección por constructor para el repositorio y por método para la aplicación/query builder.

Crea `app/http/controllers/account_token_controller.py`:

```python
from orionis.auth.contracts.token_repository import IAccessTokenRepository
from orionis.foundation.contracts.application import IApplication
from orionis.http import JSONResponse, response
from orionis.orm.contracts.query_builder import IQueryBuilder
from orionis.support.facades import Auth


class AccountTokenController:

    def __init__(self, tokens: IAccessTokenRepository) -> None:
        self.tokens = tokens

    async def index(self, app: IApplication, db: IQueryBuilder) -> JSONResponse:
        owner = Auth.user()
        table = app.config("auth.tokens.table")
        rows = await (
            db.table(table)
            .select("id", "name", "abilities", "expires_at", "last_used_at", "revoked_at")
            .where("tokenable_type", owner.getAuthorizableType())
            .where("tokenable_id", str(owner.getAuthorizableId()))
            .orderBy("id", "desc")
            .get()
        )
        return response.json({"tokens": list(rows)})

    async def destroy(
        self,
        token_id: int,
        app: IApplication,
        db: IQueryBuilder,
    ) -> JSONResponse:
        owner = Auth.user()
        owned = await (
            db.table(app.config("auth.tokens.table"))
            .where("id", token_id)
            .where("tokenable_type", owner.getAuthorizableType())
            .where("tokenable_id", str(owner.getAuthorizableId()))
            .exists()
        )
        if not owned:
            return response.json({"message": "Token not found"}, status_code=404)
        return response.json({"revoked": await self.tokens.revoke(token_id)})

    async def revokeAll(self) -> JSONResponse:
        count = await self.tokens.revokeAll(Auth.user())
        return response.json({"revoked_count": count})
```

Este ejemplo presupone el modelo `User` con `Authorizable` y el mismo repositorio/conexión configurado para los tokens. `abilities` aparece como JSON almacenado o `None` en esta consulta directa; no es una entidad `AccessToken`. No selecciones ni expongas la columna `token`, que contiene el digest.

Añade las rutas a `routes/web.py`:

```python
from app.http.controllers.account_token_controller import AccountTokenController
from orionis.auth.middleware import AuthenticateSessionMiddleware
from orionis.support.facades import Route

Route.group(
    prefix="/account/tokens",
    middleware=AuthenticateSessionMiddleware,
    routes=[
        Route.get("", [AccountTokenController, "index"]),
        Route.delete("/{token_id:int}", [AccountTokenController, "destroy"]),
        Route.post("/revoke-all", [AccountTokenController, "revokeAll"]),
    ],
)
```

Las operaciones de escritura mantienen CSRF. No basta con recibir un `token_id` y llamar a `revoke()`: el repositorio no autoriza al solicitante ni comprueba la propiedad por él.

### Revocar la credencial que está haciendo la petición

`await Auth.revokeCurrentToken()` revoca el token del contexto actual y sustituye ese contexto por uno invitado. Devuelve `True` cuando la llamada revoca un token todavía activo; si la petición no tiene credencial de token devuelve `False`. Tras revocarlo, la siguiente petición con ese secreto recibe `401` en una ruta protegida.

```bash
curl --request DELETE \
     --header "Accept: application/json" \
     --header "Authorization: Bearer YOUR_PERSONAL_ACCESS_TOKEN" \
     http://localhost:8000/api/current-token
```

`Auth.logout()` pertenece al acceso de sesión y no sustituye la revocación de un token personal.

## Vencimiento y mantenimiento

| Configuración / entorno | Predeterminado | Significado |
| --- | --- | --- |
| `tokens.table` / `AUTH_TOKEN_TABLE` | `personal_access_tokens` | Tabla de credenciales. |
| `tokens.expiration` / `AUTH_TOKEN_EXPIRATION` | `None` | Duración en minutos; `None` no fija vencimiento automático. |
| `tokens.secret_bytes` / `AUTH_TOKEN_SECRET_BYTES` | `40` | Bytes aleatorios antes de codificación; admite entre 32 y 128. |

Una fecha `expires_at` explícita prevalece sobre la duración configurada. Pasar `None` aplica esa duración: para emitir credenciales sin vencimiento automático, la configuración debe tener `expiration=None`. Las fechas se normalizan a UTC para persistencia. El token deja de aceptarse al alcanzar su fecha aunque la fila siga almacenada.

`IAccessTokenRepository` expone estas operaciones asíncronas:

| Método | Resultado |
| --- | --- |
| `create(owner, name, *, abilities=None, expires_at=None)` | `NewAccessToken` con secreto y metadata. |
| `findByPlainText(secret)` | `AccessToken` o `None` si no existe, está revocado o ha vencido. |
| `touch(token_id)` | `bool`; actualiza `last_used_at` únicamente si sigue sin revocar y vigente. |
| `revoke(token_id)` | `bool`; marca `revoked_at` sin eliminar la fila. |
| `revokeAll(owner)` | Cantidad de filas no revocadas que se marcan como revocadas. |
| `purgeExpired()` | Cantidad de filas eliminadas por vencimiento o revocación. |

El guard ejecuta `findByPlainText()`, comprueba el tipo e identificador del propietario y confirma la vigencia con `touch()` antes de publicar su identidad. No necesitas actualizar `last_used_at` en cada controlador.

Puedes inyectar el repositorio en un servicio de mantenimiento:

```python
from orionis.auth.contracts.token_repository import IAccessTokenRepository


class TokenMaintenance:

    def __init__(self, tokens: IAccessTokenRepository) -> None:
        self.tokens = tokens

    async def purge(self) -> int:
        return await self.tokens.purgeExpired()
```

La limpieza física requiere que tu aplicación invoque ese servicio desde su tarea de mantenimiento; el guard ya rechaza tokens vencidos o revocados sin esperar a esa limpieza.

Al desactivar una cuenta o cambiar sus credenciales fuera del flujo de recuperación, decide explícitamente qué tokens revocar. El guard de tokens comprueba la identidad y la credencial almacenada; no aplica por sí mismo una condición sobre la columna `active`. La [recuperación de contraseña](/es/security/authentication/account-recovery) sí revoca los tokens del propietario durante su transacción.
