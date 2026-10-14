---
title: "Identities and browser authentication"
description: "An identity model must implement IAuthenticatable. Usually combine Model with Authenticatable; add Authorizable for permissions, roles or tokens. Mixins avoid direct ABC…"
editUrl: true
lastUpdated: false
---

An identity model must implement `IAuthenticatable`. Usually combine `Model` with `Authenticatable`; add `Authorizable` for permissions, roles or tokens. Mixins avoid direct ABC inheritance, which would conflict with the ORM metaclass.

Adapt the existing `app/models/user.py` model rather than declaring a second user model. The minimum shape below requires a matching database table/migration and a configured connection:

```python
from orionis.auth import Authenticatable, Authorizable
from orionis.orm import Integer, Model, String

class User(Model, Authenticatable, Authorizable):
    id = Integer().primary().autoIncrement()
    email = String(255).unique()
    password = String(255)
```

Place it in an application module and set `AUTH_MODEL` to its path, defaulting to `app.models.user.User`. `AUTH_USERNAME` defaults to `email`. `Authenticatable` reads the key from ORM metadata and the hash from `AUTH_PASSWORD="password"`; override that class variable for another column. Persist hashes through [hashing](/en/security/hashing), never submitted passwords.

## Login and logout

```python
from orionis.http import Request, response
from orionis.support.facades import Auth
from orionis.schemas import Schema
from orionis.schemas.fields import Field
from orionis.schemas.rules import Email
from orionis.schemas.constraints import MinLength
from orionis.schemas.validator import Schema as Validator

class LoginInput(Schema):
    email: Field[str, Email()]
    password: Field[str, MinLength(1)]

async def login(request: Request):
    values = await Validator.validateAsync(await request.data(), LoginInput)
    credentials = {"email": values.email, "password": values.password}
    if not await Auth.attempt(credentials):
        return response.json({"message": "Invalid credentials"}, 401)
    return response.redirect("/home", 303)

async def logout():
    await Auth.logout()
    return response.redirect("/login", 303)
```

Keep the example handlers in an importable controller module, then register them in `routes/web.py`:

```python
from app.http.controllers.auth_controller import login, logout
from orionis.auth.middleware import AuthenticateSessionMiddleware
from orionis.support.facades import Route

Route.post("/login", login)
Route.post("/logout", logout).middleware(AuthenticateSessionMiddleware)
```

Save the handlers as `app/http/controllers/auth_controller.py` for these imports. Supply GET pages for `/login` and `/home`, or use your own redirect destinations. Submit through a form carrying `{% csrf %}` (see [views](/en/services/views/rendering-templates)). An invalid credential returns 401; success redirects with 303 and establishes the session cookie. Do not add these paths on top of an existing `Route.auth()` registration without replacing its controllers.

These handlers require web routes with sessions and CSRF; validate format with an application schema first. `attempt` returns `False` on failed authentication. Success rotates the session, stores the identity identifier and rebinds the current context. `login(identity)` accepts an identity verified by another trusted flow; it does not itself check a password.

`attempt`, `login` and `logout` are asynchronous and always use the session guard even when another is default. They raise `AuthException` outside an active HTTP request. Logout invalidates session state; deleting one variable is not equivalent.

## Reading and requiring identity

`Auth.user()`, `identifier()`, `check()`, `guest()` and `context()` are synchronous. Permission checks and snapshot loading require `await`. The kernel uses `ResolveSessionIdentityMiddleware` for web and `ResolveTokenIdentityMiddleware` for API routes; both permit guests. Add `AuthenticateSessionMiddleware` or `AuthenticateTokenMiddleware` to require credentials.

`AuthenticateMiddleware` uses the current/default guard. JSON/AJAX and token guests receive authentication failure; session browsers may redirect to `AUTH_REDIRECT_TO` (`/login`). `GuestMiddleware` redirects authenticated users to `AUTH_HOME` (`/home`). Protected responses include private/no-store cache policy.

## Configuration and extension

`AUTH_GUARD` accepts `session` or `token`; `AUTH_SESSION_KEY` defaults to `_auth_identifier`. Unknown guards raise `GuardNotFoundException`. `AuthProvider` registers a scoped context and shared services/guards; the facade is pinned at boot to support synchronous reads. Do not cache `Auth.user()` in a singleton.

Replace `IIdentityProvider`, `IGuard`, `IAuthManager` or repository contracts through container bindings before dependents are constructed. Configuration does not automatically register new guard names. Continue with [authorization](/en/security/authentication/authorization).
