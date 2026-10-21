---
title: "Roles y permisos"
description: "Crea roles y permisos, administra sus asignaciones y verifica capacidades con Auth, inyección de dependencias y middleware."
editUrl: true
lastUpdated: false
---

La autenticación responde **quién realiza la petición**. La autorización responde **qué puede hacer esa identidad**. Un login o un token válido no conceden automáticamente acceso a todas las operaciones.

Un **permiso** representa una capacidad con un nombre elegido por tu aplicación, como `articles.publish`. Un **rol** agrupa permisos, como `editor`. Un usuario puede tener varios roles y permisos directos; sus permisos son la unión de ambos orígenes. Para decisiones sobre un registro concreto, utiliza [policies](/es/security/authentication/policies).

## Modelo y tablas necesarias

El modelo predeterminado `app.models.user.User` incorpora `Authenticatable` para autenticarse y `Authorizable` para poseer roles y permisos. Son responsabilidades distintas: una identidad puede autenticarse sin implementar autorización basada en roles.

`Authorizable` aporta `getAuthorizableType()` y `getAuthorizableId()`; las operaciones se realizan mediante `PermissionRegistrar`, no mediante métodos `assignRole()` del modelo.

Las migraciones incluidas crean estas tablas:

| Tabla | Contenido |
| --- | --- |
| `permissions` | Nombres únicos de permisos. |
| `roles` | Nombres únicos de roles. |
| `model_has_permissions` | Permisos directos de una identidad. |
| `model_has_roles` | Roles asignados a una identidad. |
| `role_has_permissions` | Permisos compartidos por un rol. |

Ejecuta las migraciones pendientes sobre la base de datos configurada antes de utilizarlas. El comando directo y su equivalente local son:

```bash
orionis migrate
```

```bash
python -B reactor migrate
```

Las relaciones de identidad guardan `model_type` y `model_id`. El identificador debe corresponder a una identidad persistida y admitir un valor `int`, `str` o `UUID`. Por defecto, el tipo es la ruta Python de la clase; puedes fijarlo mediante `AUTHORIZABLE_TYPE` en tu modelo. Conserva ese valor cuando existan asignaciones: cambiarlo modifica la clave con la que se buscan sus relaciones.

## Crear roles y conceder permisos

`PermissionRegistrar` ya está registrado en el contenedor. Puedes recibirlo por constructor o por parámetro de un método que ejecute el framework.

Este seeder supone que `editor@example.com` ya existe. Guárdalo como `database/seeders/s0000000002_editor_authorization.py`, ajustando la secuencia a los seeders de tu proyecto:

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

El ejemplo:

1. Busca al usuario que recibirá las asignaciones.
2. Crea `editor` y `articles.view`, o reutiliza sus registros si ya existen.
3. Asocia `articles.view` y `articles.publish` al rol. Los permisos ausentes se crean automáticamente.
4. Asigna el rol al usuario.
5. Concede `reports.export` directamente al usuario, sin añadirlo al rol.

Después de crear el usuario y guardar el archivo, ejecuta los seeders pendientes con `orionis seed` o `python -B reactor seed`. El comando descubre los seeders del proyecto; no ejecuta únicamente este archivo.

Los nombres deben ser cadenas no vacías, sin espacios al inicio o al final y con un máximo de 255 caracteres. Las asignaciones repetidas son idempotentes. El nombre `admin` o un permiso llamado `full_access` no tienen privilegios especiales por sí mismos; define expresamente las capacidades que vas a comprobar.

## Consultar la autorización de la petición

Guarda este controlador en `app/http/controllers/access_controller.py`:

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

`Auth` y el contrato inyectado `IAuthManager` acceden al mismo servicio. Los métodos que consultan permisos son asíncronos porque pueden necesitar cargar las asignaciones de la base de datos.

En `routes/api.py`:

```python
from app.http.controllers.access_controller import AccessController
from orionis.auth.middleware import AuthenticateTokenMiddleware
from orionis.support.facades import Route


Route.get("/access", AccessController).middleware(AuthenticateTokenMiddleware)
```

Consulta `/access` con el token descrito en [Tokens personales](/es/security/authentication/personal-access-tokens). Para usar el controlador con una sesión web, registra su ruta en `routes/web.py` y aplica `AuthenticateSessionMiddleware`.

| Consulta | Resultado |
| --- | --- |
| `await Auth.can(name)` | Si la credencial actual permite usar ese permiso. |
| `await Auth.cannot(name)` | Negación de `can`. |
| `await Auth.canAny(names)` | Si concede al menos uno. |
| `await Auth.canAll(names)` | Si concede todos. |
| `await Auth.hasRole(name)` | Si la identidad pertenece al rol. |
| `await Auth.authorization()` | Snapshot inmutable de permisos, roles y límites de la credencial. |

Un invitado obtiene `False` al consultar permisos o roles. No hay herencia entre roles ni coincidencias por prefijo: `articles.*` no concede automáticamente `articles.publish`.

### Exigir una capacidad

Una consulta booleana permite adaptar una interfaz. Para detener una operación si falta autorización, utiliza `authorize()` antes de ejecutarla:

```python
from orionis.http import JSONResponse
from orionis.support.facades import Auth


class PublishArticleController:

    async def __call__(self) -> JSONResponse:
        await Auth.authorize("articles.publish")
        return JSONResponse({"can_publish": True})
```

`authorize` no devuelve una respuesta ni ejecuta la publicación. Continúa cuando existe el permiso; lanza `AuthenticationException` si no hay identidad y `AuthorizationException` si la identidad no tiene acceso. El manejador HTTP predeterminado convierte esas excepciones en `401` y `403`, respectivamente. El middleware previo de autenticación de sesión puede redirigir al navegador al login antes de llegar a esta comprobación.

## Asignar y revocar acceso desde un controlador

Guarda `app/http/controllers/editorial_access_controller.py`:

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

En `routes/api.py`:

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

La identidad administradora necesita `users.manage-access` y, si usa un token restringido, el token debe incluir esa misma capacidad. El usuario de `user_id` es el destinatario de las asignaciones; no se convierte en la identidad que está ejecutando la petición.

Revocar `reports.export` elimina su asignación **directa**. Si el usuario lo recibe también mediante un rol, seguirá disponiendo de ese permiso. Quitar `editor` elimina la pertenencia a ese rol y sus permisos heredados, conservando los permisos directos y los de otros roles.

### Cambiar los permisos de un rol

Las modificaciones de un rol afectan a todas las identidades que lo tienen. Por ejemplo, este servicio sustituye la capacidad de publicar por la de revisar:

```python
from orionis.auth.authorization.registrar import PermissionRegistrar


class EditorialPermissions:

    def __init__(self, registrar: PermissionRegistrar) -> None:
        self.registrar = registrar

    async def update(self) -> None:
        await self.registrar.revokeFromRole("editor", "articles.publish")
        await self.registrar.grantToRole("editor", "articles.review")
```

`revokeFromRole` elimina la relación con el permiso, no borra su registro de `permissions`. Las revocaciones de roles o permisos inexistentes no producen una nueva asignación ni crean los nombres ausentes.

### Sustituir la lista de roles de un usuario

`assignRole` añade roles; no reemplaza los anteriores. Cuando necesitas sustituirlos, puedes combinar las operaciones disponibles en un servicio de aplicación. Guarda `app/services/user_roles.py`:

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

`UserRoles.replace()` pertenece a este ejemplo, no es una API nativa del framework. Lee los roles actuales, elimina los que sobran y añade los que faltan dentro de una transacción. Una tupla vacía retira todos los roles; los permisos directos se conservan. Si tu aplicación permite modificaciones concurrentes sobre el mismo usuario, coordina esas operaciones de acuerdo con las garantías de tu base de datos.

Por ejemplo, un controlador puede recibir el servicio mediante inyección de método y asignar únicamente `reviewer`:

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

Guárdalo en `app/http/controllers/replace_member_roles_controller.py` y registra su acción detrás del middleware de autenticación correspondiente. El ejemplo utiliza una lista definida por la aplicación: si los roles provienen del payload, valida la lista y autoriza quién puede asignar cada rol antes de llamar al servicio.

### Consultar el acceso de otra identidad

`Auth.can()` consulta siempre la petición actual. Para una pantalla administrativa que muestre las asignaciones de otro usuario, recibe `IPermissionRepository`:

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

Guarda `app/http/controllers/member_access_controller.py` y registra su acción en una ruta autenticada con parámetro `{user_id:int}`. `loadFor()` devuelve permisos directos **más** los heredados y los roles del usuario; no aplica los límites del token del destinatario ni equivale a autenticarlo. Tampoco distingue el origen individual de cada permiso.

## Middleware para rutas y grupos

Guarda las clases en `app/http/middleware/article_access.py`:

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

`RequirePermissionMiddleware` exige todos los permisos por defecto; `requires_all=False` acepta cualquiera. `RequireRoleMiddleware` acepta cualquiera de los roles por defecto; `requires_all=True` exige todos.

La autenticación debe ejecutarse primero. Esta ruta utiliza el controlador `PublishArticleController` mostrado anteriormente, guardado en `app/http/controllers/publish_article_controller.py`:

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

Puedes aplicar las mismas clases a un grupo mediante `Route.group(middleware=[...], routes=[...])`. Consulta [Middleware de autenticación](/es/security/authentication/middleware) para el registro y el orden de cada nivel.

El middleware de permisos evalúa también los límites de la credencial. El de roles rechaza credenciales con `abilities` restringidas, aunque el usuario pertenezca al rol: para APIs con tokens limitados, expresa la condición como permisos o policies.

## Usar permisos desde una vista

El global `auth()` expone el servicio de autenticación. Jinja espera automáticamente las consultas asíncronas:

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

El enlace `/articles/new` representa una ruta de tu aplicación. Ocultar un enlace mejora la interfaz; protege también el endpoint con middleware o `Auth.authorize()`.

## Permisos y límites de los tokens

Para permisos, la autorización efectiva es:

```text
(permisos directos ∪ permisos de los roles) ∩ abilities de la credencial
```

Cuando `abilities=None`, la credencial no limita los permisos de la identidad. Una colección vacía no permite ninguno. Añadir un nombre al token no concede un permiso que el usuario no tenga.

`snapshot.permissions` muestra los permisos que posee la identidad, antes de aplicar la restricción del token. Para decidir acceso usa `snapshot.can(name)` o `Auth.can(name)`. `hasRole()` describe pertenencia y no demuestra que un token pueda ejecutar una operación.

## Momento en que se leen las asignaciones

La primera consulta de autorización carga un snapshot inmutable para el contexto actual; las siguientes lo reutilizan. Una modificación en la base de datos no recalcula un snapshot ya cargado durante la misma petición. Comprueba los cambios con una nueva petición autenticada.

Esto permite varias comprobaciones sin repetir la carga de roles y permisos. No guardes snapshots ni identidades de una petición en servicios globales para reutilizarlos entre usuarios.

Para decisiones sobre propietarios o registros concretos, continúa con [Policies y autorización de recursos](/es/security/authentication/policies). La configuración de identidad y guards está en [Configuración y guards](/es/security/authentication/configuration-and-guards).
