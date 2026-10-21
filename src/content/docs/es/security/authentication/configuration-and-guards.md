---
title: "Configuración y guards"
description: "Configura las identidades, los guards de sesión y token, las credenciales persistentes y la recuperación desde config/auth.py."
editUrl: true
lastUpdated: false
---

Un **guard** es el componente que comprueba la credencial presentada y devuelve una identidad. Orionis incluye `session` y `token`. El guard responde quién está haciendo la petición; los permisos y las policies deciden qué puede hacer esa identidad.

## Los dos guards nativos

| Guard | Credencial y resolución | Uso habitual |
| --- | --- | --- |
| `session` | Restaura el identificador y la huella de autenticación de la sesión. También puede restaurar el acceso mediante la credencial «recordarme». | Páginas de navegador y formularios WEB. |
| `token` | Lee `Authorization: Bearer <token>`, valida su hash y vigencia, y resuelve su propietario. | APIs, aplicaciones cliente e integraciones. |

El guard de sesión dispone además de operaciones para comprobar usuario y contraseña e iniciar o cerrar el acceso. El guard de token comprueba una credencial ya emitida; no verifica una contraseña en cada llamada.

El kernel instala `ResolveSessionIdentityMiddleware` en el contexto WEB, después de sesión y CSRF, y `ResolveTokenIdentityMiddleware` en API. Estos componentes permiten invitados. Para exigir identidad, añade `AuthenticateSessionMiddleware` o `AuthenticateTokenMiddleware` a las rutas que la requieran.

`Auth.guard()` devuelve el guard predeterminado de configuración. `Auth.guard("session")` o `Auth.guard("token")` seleccionan uno explícitamente; obtener ese objeto no autentica por sí solo la petición. Cuando se llama sin guard explícito, `AuthenticateMiddleware` reutiliza el guard del contexto ya establecido por el kernel.

## El archivo config/auth.py

La clase `BootstrapAppAuth` reúne las opciones. Esta es la estructura del archivo del proyecto; modifica sus campos existentes:

```python
from dataclasses import dataclass, field

from orionis.environment import Env
from orionis.foundation.config.auth import (
    Auth, Guards, Identity, PasswordReset, RememberAuth, SessionAuth, Tokens,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapAppAuth(Auth):
    default: Guards | str = field(
        default_factory=lambda: Env.get("AUTH_GUARD", Guards.SESSION),
    )
    identity: Identity | dict = field(
        default_factory=lambda: Identity(
            model=Env.get("AUTH_MODEL", "app.models.user.User"),
            username=Env.get("AUTH_USERNAME", "email"),
        ),
    )
    session: SessionAuth | dict = field(
        default_factory=lambda: SessionAuth(
            key=Env.get("AUTH_SESSION_KEY", "_auth_identifier"),
            redirect_to=Env.get("AUTH_REDIRECT_TO", "/login"),
            home=Env.get("AUTH_HOME", "/home"),
        ),
    )
    tokens: Tokens | dict = field(
        default_factory=lambda: Tokens(
            table=Env.get("AUTH_TOKEN_TABLE", "personal_access_tokens"),
            expiration=Env.get("AUTH_TOKEN_EXPIRATION", None),
            secret_bytes=Env.get("AUTH_TOKEN_SECRET_BYTES", 40),
        ),
    )
    passwords: PasswordReset | dict = field(
        default_factory=lambda: PasswordReset(
            expiration=Env.get("AUTH_PASSWORD_RESET_EXPIRATION", 60),
            throttle=Env.get("AUTH_PASSWORD_RESET_THROTTLE", 60),
            table=Env.get("AUTH_PASSWORD_RESET_TABLE", "password_reset_tokens"),
        ),
    )
    remember: RememberAuth | dict = field(
        default_factory=lambda: RememberAuth(
            cookie=Env.get("AUTH_REMEMBER_COOKIE", "orionis_remember"),
            lifetime=Env.get("AUTH_REMEMBER_LIFETIME", 43200),
            secure=Env.get("AUTH_REMEMBER_SECURE", True),
        ),
    )
```

Los campos son entidades tipadas e inmutables. También aceptan diccionarios con los nombres de sus opciones, que se normalizan a esas entidades. La configuración se prepara durante el arranque; cambiar una instancia aislada no reconfigura los servicios de una aplicación que ya está funcionando.

### default: guard predeterminado

`default` admite `Guards.SESSION`, `Guards.TOKEN` o los nombres `"session"` y `"token"`. Las cadenas de configuración se normalizan a su valor canónico. Su variable de entorno es `AUTH_GUARD` y el valor predeterminado del proyecto es `session`.

Este ajuste no convierte las rutas WEB en API ni añade sesiones a las rutas API. El kernel elige el flujo por el contexto en el que se registró la ruta. Además, `Auth.attempt()` siempre es una operación de sesión, aunque el guard predeterminado sea `token`.

### identity: el modelo del usuario

| Opción | Valor del proyecto | Propósito |
| --- | --- | --- |
| `model` | `"app.models.user.User"` | Ruta de importación de la clase que representa al usuario. Lee `AUTH_MODEL`. |
| `username` | `"email"` | Atributo utilizado para buscar al usuario con las credenciales proporcionadas. Lee `AUTH_USERNAME`. |

El modelo debe implementar `IAuthenticatable`; el concern `Authenticatable` proporciona su implementación habitual. Para permisos y tokens, utiliza también `Authorizable`. Los ejemplos completos del modelo, sus columnas y el hashing están en [autenticación con sesiones](/es/security/authentication/identity-and-session).

`username` determina la clave que el proveedor busca en el diccionario de credenciales. Si configuras `"username"`, ese atributo debe existir en el modelo y tu login debe proporcionar `{"username": ..., "password": ...}`. La contraseña se verifica mediante el servicio de hashing y el contrato del modelo; no se compara con texto guardado directamente.

### session: estado de autenticación WEB

| Opción | Valor en config/auth.py | Propósito |
| --- | --- | --- |
| `key` | `"_auth_identifier"` | Clave de sesión que guarda el identificador autenticado. Lee `AUTH_SESSION_KEY`. |
| `redirect_to` | `"/login"` | Destino de invitados de navegador cuando se exige autenticación de sesión. Lee `AUTH_REDIRECT_TO`. |
| `home` | `"/home"` | Destino usado por el login nativo y `GuestMiddleware` para usuarios ya autenticados. Lee `AUTH_HOME`. |

`redirect_to=None` permite responder con `401` en lugar de redirigir. Los clientes JSON/AJAX reciben `401` aunque haya un destino de login. La entidad base `SessionAuth()` usa `None` como valor de `redirect_to`; el archivo del proyecto mostrado arriba lo establece expresamente en `"/login"`.

El driver, la cookie, el cifrado y la duración de la sesión pertenecen a `config/session.py`. Consulta [sesiones HTTP](/es/http/sessions). Estas opciones de autenticación no sustituyen esa configuración.

### tokens: credenciales personales para API

| Opción | Valor predeterminado | Propósito |
| --- | --- | --- |
| `table` | `"personal_access_tokens"` | Tabla de credenciales emitidas. Lee `AUTH_TOKEN_TABLE`. |
| `expiration` | `None` | Duración en **minutos** usada al emitir un token cuando no se proporciona `expires_at`. Lee `AUTH_TOKEN_EXPIRATION`. |
| `secret_bytes` | `40` | Bytes aleatorios utilizados para generar el secreto. Lee `AUTH_TOKEN_SECRET_BYTES`. |

`expiration` admite `None` o un entero positivo; `None` permite tokens sin vencimiento automático. `secret_bytes` debe ser un entero entre `32` y `128`. Las credenciales pueden revocarse independientemente de su expiración. Emisión, almacenamiento y envío se explican en [autenticación con tokens](/es/security/authentication/personal-access-tokens).

### passwords: recuperación de contraseña

| Opción | Valor predeterminado | Propósito |
| --- | --- | --- |
| `expiration` | `60` | Vigencia del token de recuperación, en **minutos**. Lee `AUTH_PASSWORD_RESET_EXPIRATION`. |
| `throttle` | `60` | Intervalo mínimo para emitir otro token de la misma cuenta, en **segundos**. Lee `AUTH_PASSWORD_RESET_THROTTLE`. |
| `table` | `"password_reset_tokens"` | Tabla de tokens de recuperación. Lee `AUTH_PASSWORD_RESET_TABLE`. |

Los dos límites deben ser enteros positivos. El token de recuperación es una credencial diferente del token Bearer de API. El broker y las rutas nativas se explican en [recuperación y verificación](/es/security/authentication/account-recovery).

### remember: acceso persistente opcional

| Opción | Valor predeterminado | Propósito |
| --- | --- | --- |
| `cookie` | `"orionis_remember"` | Nombre de la cookie persistente. Lee `AUTH_REMEMBER_COOKIE`. |
| `lifetime` | `43200` | Vigencia en **minutos**, equivalente a 30 días. Lee `AUTH_REMEMBER_LIFETIME`. |
| `secure` | `True` | Exige transporte HTTPS para emitir la credencial. Lee `AUTH_REMEMBER_SECURE`. |

Esta cookie es independiente de la cookie de sesión. Se utiliza cuando el login llama a `Auth.attempt(credentials, remember=True)`; no se activa solo por tener configuración. El nombre admite caracteres ASCII alfanuméricos, `_` y `-`; el tiempo debe ser un entero positivo y `secure` un booleano real.

En desarrollo mediante HTTP local, `AUTH_REMEMBER_SECURE=bool:false` permite probar ese flujo. Los nombres con prefijos `__Host-` o `__Secure-` exigen `secure=True`. La [guía de sesiones](/es/security/authentication/identity-and-session) muestra el formulario, la restauración y el logout.

## Configurar mediante .env

Con el archivo anterior, estos valores reproducen sus opciones predeterminadas:

```dotenv
AUTH_GUARD=session
AUTH_MODEL=app.models.user.User
AUTH_USERNAME=email
AUTH_SESSION_KEY=_auth_identifier
AUTH_REDIRECT_TO=/login
AUTH_HOME=/home
AUTH_TOKEN_TABLE=personal_access_tokens
AUTH_TOKEN_EXPIRATION=null
AUTH_TOKEN_SECRET_BYTES=int:40
AUTH_PASSWORD_RESET_EXPIRATION=int:60
AUTH_PASSWORD_RESET_THROTTLE=int:60
AUTH_PASSWORD_RESET_TABLE=password_reset_tokens
AUTH_REMEMBER_COOKIE=orionis_remember
AUTH_REMEMBER_LIFETIME=int:43200
AUTH_REMEMBER_SECURE=bool:true
```

Para limitar los nuevos tokens a una hora, cambia únicamente `AUTH_TOKEN_EXPIRATION=int:60`. Para desactivar la redirección de login, utiliza `AUTH_REDIRECT_TO=null`. Los prefijos `int:` y `bool:` y el literal `null` proporcionan los tipos requeridos; no escribas `"None"` como nombre de tabla o duración.

## Elegir el flujo de tu aplicación

- **Navegador:** registra rutas WEB, configura el modelo y su almacenamiento y utiliza [login de sesión](/es/security/authentication/identity-and-session), con CSRF en los formularios.
- **API:** emite una credencial desde un flujo autorizado y exige [token Bearer](/es/security/authentication/personal-access-tokens) en las rutas de API.
- **Acceso a funcionalidades:** después de resolver la identidad, comprueba [roles y permisos](/es/security/authentication/authorization) o una [policy del recurso](/es/security/authentication/policies).

La configuración elige los colaboradores y sus parámetros; las restricciones se aplican con [middleware de acceso](/es/security/authentication/middleware) y las comprobaciones del controlador.
