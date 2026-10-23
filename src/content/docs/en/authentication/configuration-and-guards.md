---
title: "Configuration and guards"
description: "Configure identities, session and token guards, persistent credentials, and account recovery through config/auth.py."
editUrl: true
lastUpdated: false
---

A **guard** checks the presented credential and returns an identity. Orionis includes `session` and `token`. The guard answers who is making the request; permissions and policies decide what that identity may do.

## The two native guards

| Guard | Credential and resolution | Typical use |
| --- | --- | --- |
| `session` | Restores the identifier and authentication fingerprint from the session. It can also restore access through a remember-me credential. | Browser pages and WEB forms. |
| `token` | Reads `Authorization: Bearer <token>`, validates its hash and lifetime, and resolves its owner. | APIs, client applications, and integrations. |

The session guard also provides operations to verify username and password and start or end access. The token guard checks an already issued credential; it does not verify a password on every call.

The kernel installs `ResolveSessionIdentityMiddleware` in the WEB context, after sessions and CSRF, and `ResolveTokenIdentityMiddleware` in API. These components allow guests. Add `AuthenticateSessionMiddleware` or `AuthenticateTokenMiddleware` to routes that require an identity.

`Auth.guard()` returns the configured default guard. `Auth.guard("session")` or `Auth.guard("token")` selects one explicitly; retrieving that object does not authenticate a request by itself. Without an explicit guard, `AuthenticateMiddleware` reuses the guard already established by the kernel.

## The config/auth.py file

`BootstrapAppAuth` contains the options. This is the structure of the project's file; edit its existing fields:

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

Fields are typed, immutable entities. They also accept dictionaries using the option names, which are normalized into those entities. Configuration is prepared during startup; changing a separate instance does not reconfigure services in a running application.

### default: default guard

`default` accepts `Guards.SESSION`, `Guards.TOKEN`, or the names `"session"` and `"token"`. Configuration strings are normalized to canonical values. Its environment variable is `AUTH_GUARD`, and the project default is `session`.

This setting does not turn WEB routes into API routes or add sessions to API routes. The kernel selects the pipeline from the route registration context. Also, `Auth.attempt()` is always a session operation, even when the default guard is `token`.

### identity: the user model

| Option | Project value | Purpose |
| --- | --- | --- |
| `model` | `"app.models.user.User"` | Import path of the class representing the user. Reads `AUTH_MODEL`. |
| `username` | `"email"` | Attribute used to find the user from submitted credentials. Reads `AUTH_USERNAME`. |

The model must implement `IAuthenticatable`; the `Authenticatable` concern provides the usual implementation. For permissions and tokens, also use `Authorizable`. See [session authentication](/en/authentication/session-authentication) for complete model, column, and hashing examples.

`username` determines the key the provider looks for in the credentials dictionary. If you configure `"username"`, that attribute must exist in the model and login must supply `{"username": ..., "password": ...}`. Password verification uses the hashing service and the model contract; it does not compare against stored plain text.

### session: WEB authentication state

| Option | Value in config/auth.py | Purpose |
| --- | --- | --- |
| `key` | `"_auth_identifier"` | Session key holding the authenticated identifier. Reads `AUTH_SESSION_KEY`. |
| `redirect_to` | `"/login"` | Destination for browser guests when session authentication is required. Reads `AUTH_REDIRECT_TO`. |
| `home` | `"/home"` | Destination used by native login and `GuestMiddleware` for signed-in users. Reads `AUTH_HOME`. |

`redirect_to=None` produces `401` rather than a redirect. JSON/AJAX clients receive `401` even when a login destination exists. The base `SessionAuth()` entity defaults `redirect_to` to `None`; the project file above explicitly sets it to `"/login"`.

Session driver, cookie, encryption, and lifetime belong in `config/session.py`; see [HTTP sessions](/en/sessions). These authentication options do not replace that configuration.

### tokens: personal API credentials

| Option | Default | Purpose |
| --- | --- | --- |
| `table` | `"personal_access_tokens"` | Issued credential table. Reads `AUTH_TOKEN_TABLE`. |
| `expiration` | `None` | Lifetime in **minutes** when issuing a token without `expires_at`. Reads `AUTH_TOKEN_EXPIRATION`. |
| `secret_bytes` | `40` | Random bytes used to generate the secret. Reads `AUTH_TOKEN_SECRET_BYTES`. |

`expiration` accepts `None` or a positive integer; `None` allows tokens without automatic expiration. `secret_bytes` must be an integer from `32` to `128`. Credentials can be revoked independently of expiration. See [token authentication](/en/authentication/personal-access-tokens) for issuance, storage, and transmission.

### passwords: password recovery

| Option | Default | Purpose |
| --- | --- | --- |
| `expiration` | `60` | Recovery token lifetime, in **minutes**. Reads `AUTH_PASSWORD_RESET_EXPIRATION`. |
| `throttle` | `60` | Minimum interval before issuing another token for the same account, in **seconds**. Reads `AUTH_PASSWORD_RESET_THROTTLE`. |
| `table` | `"password_reset_tokens"` | Recovery token table. Reads `AUTH_PASSWORD_RESET_TABLE`. |

Both limits must be positive integers. Recovery tokens are separate credentials from API Bearer tokens. [Account recovery and verification](/en/authentication/account-recovery) explains the broker and native routes.

### remember: optional persistent access

| Option | Default | Purpose |
| --- | --- | --- |
| `cookie` | `"orionis_remember"` | Persistent cookie name. Reads `AUTH_REMEMBER_COOKIE`. |
| `lifetime` | `43200` | Lifetime in **minutes**, equivalent to 30 days. Reads `AUTH_REMEMBER_LIFETIME`. |
| `secure` | `True` | Requires HTTPS when issuing the credential. Reads `AUTH_REMEMBER_SECURE`. |

This cookie is separate from the session cookie. It is used when login calls `Auth.attempt(credentials, remember=True)`; configuration alone does not activate it. Its name allows ASCII alphanumeric characters, `_`, and `-`; lifetime must be a positive integer and `secure` a real boolean.

For development over local HTTP, `AUTH_REMEMBER_SECURE=bool:false` allows testing that flow. Names starting with `__Host-` or `__Secure-` require `secure=True`. The [session authentication guide](/en/authentication/session-authentication) covers the form, restoration, and logout.

## Configure through .env

With the file above, these values reproduce its defaults:

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

To limit new tokens to one hour, change only `AUTH_TOKEN_EXPIRATION=int:60`. To disable the login redirect, use `AUTH_REDIRECT_TO=null`. The `int:` and `bool:` prefixes and the `null` literal provide the required types; do not use `"None"` as a table name or lifetime.

## Choose your application's flow

- **Browser:** register WEB routes, configure the model and storage, and use [session login](/en/authentication/session-authentication) with CSRF in forms.
- **API:** issue a credential from an authorized flow and require a [Bearer token](/en/authentication/personal-access-tokens) on API routes.
- **Feature access:** after resolving identity, check [roles and permissions](/en/authentication/authorization) or a [resource policy](/en/authentication/policies).

Configuration selects collaborators and their parameters; restrictions are enforced with [access middleware](/en/authentication/middleware) and controller checks.
