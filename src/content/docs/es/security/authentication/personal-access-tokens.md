---
title: "Tokens personales para APIs"
description: "Los tokens personales representan una identidad authorizable sin una sesión de navegador. El cliente envía Authorization: Bearer <token>; el guard valida secreto, registro,…"
editUrl: true
lastUpdated: false
---

Los tokens personales representan una identidad authorizable sin una sesión de navegador. El cliente envía `Authorization: Bearer <token>`; el guard valida secreto, registro, vencimiento y dueño. Son tokens opacos, no JWT ni un sistema de refresh tokens.

## Emitir y mostrar una sola vez

```python
from datetime import UTC, datetime, timedelta
from orionis.http import response
from orionis.support.facades import Auth

async def issue_read_token():
    issued = await Auth.createToken(
        "report-client", abilities=("reports.read",),
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    return response.json({"token": issued.plain_text, "metadata": issued.toDict()}, 201)
```

Protege este handler con autenticación de sesión, CSRF y autorización para emitir credenciales. Las peticiones autenticadas con token no pueden emitir otros mediante `Auth.createToken`. El dueño por defecto es la identidad actual; `tokenable=` permite uno explícito desde código confiable y debe implementar `IAuthorizable`.

El secreto aparece solo en `NewAccessToken.plain_text`. `repr` y `toDict()` lo omiten. Entrégalo una vez por un canal protegido y no lo registres. `AccessToken` conserva metadata inmutable; el repositorio guarda un digest, no un secreto recuperable.

Registra el handler de emisión en una ruta POST web, por ejemplo `Route.post("/tokens/report-client", issue_read_token).middleware(AuthenticateSessionMiddleware)`, importando `Route` y `AuthenticateSessionMiddleware` como en [acceso de sesión](/es/security/authentication/identity-and-session). Valida el permiso de tu aplicación para emitir credenciales antes de llamar a `Auth.createToken`. Para consumir el token obtenido, protege la ruta API con `AuthenticateTokenMiddleware` y envía:

```http
Authorization: Bearer <token devuelto por la ruta de emisión>
```

Un token con `reports.read` solo limita los permisos que ya tiene su propietario; asigna ese permiso a la identidad mediante [autorización](/es/security/authentication/authorization) y compruébalo en la ruta de reportes.

## Restringir permisos

```python
from orionis.auth import AuthorizationSnapshot

snapshot = AuthorizationSnapshot(
    permissions={"reports.read", "reports.delete"}, roles={"analyst"},
    abilities={"reports.read"},
)
assert snapshot.can("reports.read")
assert not snapshot.can("reports.delete")
assert snapshot.hasRole("analyst")
```

El snapshot puede indicar un rol, pero el middleware de roles rechaza credenciales restringidas para no saltarse el límite. Usa permisos o políticas. `abilities=None` no añade restricción; `abilities=()` no admite capacidades. No emitas tokens amplios para resolver permisos mal configurados.

## Revocar y mantener registros

En una petición token, `await Auth.revokeCurrentToken()` devuelve si revocó la credencial actual. `AccessTokenRepository` expone `create`, `findByPlainText`, `touch`, `revoke`, `revokeAll` y `purgeExpired`, todos asíncronos. Inyéctalo o su contrato en administración confiable. `revokeAll(owner)` requiere autorización del llamador para administrar al dueño.

La validación rechaza credenciales malformadas, expiradas, revocadas o de dueño inactivo. La comparación utiliza helpers de tiempo constante. No bases lógica del cliente en parsear la representación del identificador/secreto.

## Configuración

`AUTH_TOKEN_TABLE` vale `personal_access_tokens`, `AUTH_TOKEN_EXPIRATION` es `None` (sin vencimiento automático) y `AUTH_TOKEN_SECRET_BYTES` es 40, validado entre 32 y 128. La expiración configurada usa minutos; `expires_at` acepta fecha explícita. Limita la duración deliberadamente y programa tu propia tarea `purgeExpired` para limpieza física. El vencimiento impide acceso aunque siga existiendo el registro.
