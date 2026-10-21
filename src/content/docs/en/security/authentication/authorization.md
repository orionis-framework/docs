---
title: "Roles and permissions"
description: "Create roles and permissions, manage assignments, and check capabilities with Auth, dependency injection, and middleware."
editUrl: true
lastUpdated: false
---

Authentication answers **who is making the request**. Authorization answers **what that identity may do**. A successful login or a valid token does not automatically grant access to every operation.

A **permission** represents a capability named by your application, such as `articles.publish`. A **role** groups permissions, such as `editor`. A user may hold several roles and direct permissions; their permissions combine both sources. For decisions about a particular record, use [policies](/en/security/authentication/policies).

## Required model and tables

The default `app.models.user.User` model includes `Authenticatable` for authentication and `Authorizable` for owning roles and permissions. These are separate responsibilities: an identity may authenticate without supporting role-based authorization.

`Authorizable` provides `getAuthorizableType()` and `getAuthorizableId()`. Operations use `PermissionRegistrar` rather than methods such as `assignRole()` on the model.

The included migrations create these tables:

| Table | Contents |
| --- | --- |
| `permissions` | Unique permission names. |
| `roles` | Unique role names. |
| `model_has_permissions` | Direct permissions assigned to an identity. |
| `model_has_roles` | Roles assigned to an identity. |
| `role_has_permissions` | Permissions shared by a role. |

Run pending migrations against your configured database before using them. The direct command and its local equivalent are:

```bash
orionis migrate
```

```bash
python -B reactor migrate
```

Identity relationships store `model_type` and `model_id`. The identifier must belong to a persisted identity and support an `int`, `str`, or `UUID` value. By default, the type is the Python class path; you may set a stable value with `AUTHORIZABLE_TYPE` on the model. Keep that value once assignments exist: changing it changes the key used to find those relationships.

## Create roles and grant permissions

`PermissionRegistrar` is already registered in the container. Receive it through a constructor or a method parameter that the framework invokes.

This seeder assumes `editor@example.com` already exists. Save it as `database/seeders/s0000000002_editor_authorization.py`, adapting its sequence to your project's seeders:

```python
from app.models.user import User
from orionis.auth.authorization.registrar import PermissionRegistrar
from orionis.database.seeders.seeder import Seeder


class EditorAuthorizationSeeder(Seeder):

    def __init__(self, registrar: PermissionRegistrar) -> None:
        self.registrar = registrar

    async def run(self) -> None:
        editor = await User.where("email", "editor@example.com").first()
        if editor is None:
            raise ValueError("Create editor@example.com before running this seeder.")

        await self.registrar.createRole("editor")
        await self.registrar.createPermission("articles.view")
        await self.registrar.grantToRole(
            "editor", "articles.view", "articles.publish"
        )
        await self.registrar.assignRole(editor, "editor")
        await self.registrar.givePermissionTo(editor, "reports.export")
```

The example:

1. Finds the user who will receive the assignments.
2. Creates `editor` and `articles.view`, or reuses their existing records.
3. Attaches `articles.view` and `articles.publish` to the role. Missing permissions are created automatically.
4. Assigns the role to the user.
5. Grants `reports.export` directly to the user, without adding it to the role.

After creating the user and saving the file, run pending seeders with `orionis seed` or `python -B reactor seed`. The command discovers the project's seeders; it does not run only this file.

Names must be nonempty strings without leading or trailing whitespace, with at most 255 characters. Repeating an assignment is idempotent. The name `admin` or a permission named `full_access` has no special privileges by itself; explicitly define the capabilities you will check.

## Inspect the current request's authorization

Save this controller in `app/http/controllers/access_controller.py`:

```python
from orionis.auth.contracts.manager import IAuthManager
from orionis.http import JSONResponse
from orionis.support.facades import Auth


class AccessController:

    async def __call__(self, auth: IAuthManager) -> JSONResponse:
        snapshot = await auth.authorization()

        return JSONResponse({
            "is_editor": await Auth.hasRole("editor"),
            "can_publish": await Auth.can("articles.publish"),
            "cannot_export": await Auth.cannot("reports.export"),
            "can_read_or_publish": await Auth.canAny(
                ["articles.view", "articles.publish"]
            ),
            "can_read_and_publish": await Auth.canAll(
                ["articles.view", "articles.publish"]
            ),
            "permissions": sorted(snapshot.permissions),
            "roles": sorted(snapshot.roles),
            "abilities": (
                None if snapshot.abilities is None
                else sorted(snapshot.abilities)
            ),
        })
```

`Auth` and the injected `IAuthManager` contract access the same service. Permission queries are asynchronous because they may need to load assignments from the database.

In `routes/api.py`:

```python
from app.http.controllers.access_controller import AccessController
from orionis.auth.middleware import AuthenticateTokenMiddleware
from orionis.support.facades import Route


Route.get("/access", AccessController).middleware(AuthenticateTokenMiddleware)
```

Call `/access` using the token described in [Personal access tokens](/en/security/authentication/personal-access-tokens). To use the controller with a browser session, register its route in `routes/web.py` and apply `AuthenticateSessionMiddleware`.

| Query | Result |
| --- | --- |
| `await Auth.can(name)` | Whether the current credential may use that permission. |
| `await Auth.cannot(name)` | The inverse of `can`. |
| `await Auth.canAny(names)` | Whether it grants at least one. |
| `await Auth.canAll(names)` | Whether it grants all of them. |
| `await Auth.hasRole(name)` | Whether the identity belongs to the role. |
| `await Auth.authorization()` | An immutable snapshot of permissions, roles, and credential limits. |

Guests receive `False` for permission or role queries. Roles have no inheritance, and permission names do not match by prefix: `articles.*` does not automatically grant `articles.publish`.

### Require a capability

A boolean query lets you adapt an interface. To stop an operation when authorization is missing, call `authorize()` before performing it:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Auth


class PublishArticleController:

    async def __call__(self) -> JSONResponse:
        await Auth.authorize("articles.publish")
        return JSONResponse({"can_publish": True})
```

`authorize` neither returns a response nor publishes anything. It continues when the permission exists, raises `AuthenticationException` for a guest, and raises `AuthorizationException` when an authenticated identity lacks access. The default HTTP handler converts those exceptions into `401` and `403`, respectively. Earlier session authentication middleware may redirect a browser to login before this check is reached.

## Assign and revoke access from a controller

Save `app/http/controllers/editorial_access_controller.py`:

```python
from app.models.user import User
from orionis.auth.authorization.registrar import PermissionRegistrar
from orionis.http import JSONResponse
from orionis.support.facades import Auth


class EditorialAccessController:

    def __init__(self, registrar: PermissionRegistrar) -> None:
        self.registrar = registrar

    async def grant(self, user_id: int) -> JSONResponse:
        await Auth.authorize("users.manage-access")
        member = await User.findOrFail(user_id)

        await self.registrar.assignRole(member, "editor")
        await self.registrar.givePermissionTo(member, "reports.export")
        return JSONResponse({"message": "Access granted"})

    async def revoke(self, user_id: int) -> JSONResponse:
        await Auth.authorize("users.manage-access")
        member = await User.findOrFail(user_id)

        await self.registrar.revokePermissionFrom(member, "reports.export")
        await self.registrar.removeRole(member, "editor")
        return JSONResponse({"message": "Access revoked"})
```

In `routes/api.py`:

```python
from app.http.controllers.editorial_access_controller import EditorialAccessController
from orionis.auth.middleware import AuthenticateTokenMiddleware
from orionis.support.facades import Route


Route.post(
    "/members/{user_id:int}/editorial-access",
    [EditorialAccessController, "grant"],
).middleware(AuthenticateTokenMiddleware)

Route.delete(
    "/members/{user_id:int}/editorial-access",
    [EditorialAccessController, "revoke"],
).middleware(AuthenticateTokenMiddleware)
```

The administrator needs `users.manage-access` and, when using a restricted token, the token must include that same capability. The user identified by `user_id` receives the assignments; they do not become the identity executing this request.

Revoking `reports.export` removes its **direct** assignment. If the user also receives it through a role, that permission remains available. Removing `editor` removes that membership and its inherited permissions, preserving direct permissions and those provided by other roles.

### Change a role's permissions

Changes to a role affect every identity holding it. For example, this service replaces the publishing capability with the review capability:

```python
from orionis.auth.authorization.registrar import PermissionRegistrar


class EditorialPermissions:

    def __init__(self, registrar: PermissionRegistrar) -> None:
        self.registrar = registrar

    async def update(self) -> None:
        await self.registrar.revokeFromRole("editor", "articles.publish")
        await self.registrar.grantToRole("editor", "articles.review")
```

`revokeFromRole` removes the relationship, not the record in `permissions`. Revoking an unknown role or permission does not create an assignment or any missing names.

### Replace a user's list of roles

`assignRole` adds roles; it does not replace previous assignments. When replacement is needed, combine the available operations in an application service. Save `app/services/user_roles.py`:

```python
from orionis.auth.authorization.registrar import PermissionRegistrar
from orionis.auth.contracts.authorizable import IAuthorizable
from orionis.auth.contracts.permission_repository import IPermissionRepository
from orionis.orm.contracts.query_builder import IQueryBuilder


class UserRoles:

    def __init__(
        self,
        registrar: PermissionRegistrar,
        permissions: IPermissionRepository,
        db: IQueryBuilder,
    ) -> None:
        self.registrar = registrar
        self.permissions = permissions
        self.db = db

    async def replace(
        self,
        user: IAuthorizable,
        roles: tuple[str, ...],
    ) -> None:
        desired = frozenset(roles)

        async with self.db.transaction():
            _, current = await self.permissions.loadFor(user)
            await self.registrar.removeRole(user, *sorted(current - desired))
            await self.registrar.assignRole(user, *sorted(desired - current))
```

`UserRoles.replace()` belongs to this example; it is not a native framework API. It reads the existing roles, removes unwanted ones, and adds missing ones inside a transaction. An empty tuple removes all roles; direct permissions remain. If your application allows concurrent changes to the same user, coordinate them according to your database's guarantees.

For example, a controller may receive this service through method injection and assign only `reviewer`:

```python
from app.models.user import User
from app.services.user_roles import UserRoles
from orionis.http import JSONResponse
from orionis.support.facades import Auth


class ReplaceMemberRolesController:

    async def __call__(
        self,
        user_id: int,
        roles: UserRoles,
    ) -> JSONResponse:
        await Auth.authorize("users.manage-access")
        member = await User.findOrFail(user_id)
        await roles.replace(member, ("reviewer",))
        return JSONResponse({"message": "Roles replaced"})
```

Save it in `app/http/controllers/replace_member_roles_controller.py` and register its action behind the appropriate authentication middleware. The example uses an application-defined list: when roles come from the payload, validate that list and authorize which roles the caller may assign before invoking the service.

### Inspect another identity's access

`Auth.can()` always checks the current request. To build an administrative screen showing another user's assignments, receive `IPermissionRepository`:

```python
from app.models.user import User
from orionis.auth.contracts.permission_repository import IPermissionRepository
from orionis.http import JSONResponse
from orionis.support.facades import Auth


class MemberAccessController:

    async def __call__(
        self,
        user_id: int,
        repository: IPermissionRepository,
    ) -> JSONResponse:
        await Auth.authorize("users.manage-access")
        member = await User.findOrFail(user_id)
        permissions, roles = await repository.loadFor(member)

        return JSONResponse({
            "user_id": member.id,
            "permissions": sorted(permissions),
            "roles": sorted(roles),
        })
```

Save `app/http/controllers/member_access_controller.py` and register its action in an authenticated route with a `{user_id:int}` parameter. `loadFor()` returns direct **and** inherited permissions, followed by the user's roles. It does not apply any token limits belonging to that user or authenticate them. It also does not separate each permission's individual source.

## Middleware for routes and groups

Save these classes in `app/http/middleware/article_access.py`:

```python
from orionis.auth.middleware import (
    RequirePermissionMiddleware,
    RequireRoleMiddleware,
)


class CanPublishArticles(RequirePermissionMiddleware):
    permissions = ("articles.view", "articles.publish")
    requires_all = True


class CanReadArticles(RequirePermissionMiddleware):
    permissions = ("articles.view", "articles.publish")
    requires_all = False


class IsEditorialStaff(RequireRoleMiddleware):
    roles = ("editor", "reviewer")
    requires_all = False
```

`RequirePermissionMiddleware` requires all permissions by default; `requires_all=False` accepts any one of them. `RequireRoleMiddleware` accepts any listed role by default; `requires_all=True` requires all of them.

Authentication must run first. This route uses the `PublishArticleController` shown above, saved in `app/http/controllers/publish_article_controller.py`:

```python
from app.http.controllers.publish_article_controller import PublishArticleController
from app.http.middleware.article_access import CanPublishArticles
from orionis.auth.middleware import AuthenticateTokenMiddleware
from orionis.support.facades import Route


Route.post("/articles/publish", PublishArticleController).middleware(
    AuthenticateTokenMiddleware,
    CanPublishArticles,
)
```

Apply the same classes to a group using `Route.group(middleware=[...], routes=[...])`. See [Authentication middleware](/en/security/authentication/middleware) for registration and ordering across levels.

Permission middleware also evaluates credential limits. Role middleware rejects credentials with restricted `abilities` even when the user belongs to the role: express API conditions as permissions or policies when using limited tokens.

## Use permissions in a view

The `auth()` global exposes the authentication service. Jinja automatically awaits asynchronous queries:

```jinja
{% if auth().check() %}
  {% if auth().can("articles.publish") %}
    <a href="/articles/new">Write an article</a>
  {% endif %}
  {% if auth().hasRole("editor") %}
    <span>Editorial staff</span>
  {% endif %}
{% endif %}
```

The `/articles/new` link represents an application route. Hiding a link improves the interface; also protect the endpoint with middleware or `Auth.authorize()`.

## Permissions and token limits

For permissions, effective authorization is:

```text
(direct permissions ∪ permissions from roles) ∩ credential abilities
```

When `abilities=None`, the credential does not narrow the identity's permissions. An empty collection allows none. Adding a name to a token never grants a permission that its owner lacks.

`snapshot.permissions` shows the identity's permissions before applying token restrictions. Use `snapshot.can(name)` or `Auth.can(name)` to decide access. `hasRole()` describes membership and does not prove that a token may perform an operation.

## When assignments are read

The first authorization query loads an immutable snapshot for the current context; later queries reuse it. Changing the database does not recalculate a snapshot already loaded in the same request. Verify changes with a new authenticated request.

This allows repeated checks without repeatedly loading roles and permissions. Do not store a request's snapshots or identities in global services for reuse between users.

For ownership or record-specific decisions, continue with [Policies and resource authorization](/en/security/authentication/policies). Identity and guard settings are documented in [Configuration and guards](/en/security/authentication/configuration-and-guards).
