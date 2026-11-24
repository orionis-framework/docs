---
title: "Health, errors and default routes"
description: "Read the health endpoint, publish a favicon, robots.txt and sitemap, and use the default error responses."
editUrl: true
lastUpdated: false
---

The router registers favicon, `robots.txt`, `sitemap.xml` and the application's configured health path. `DefaultResponses` renders pages through `IViewEngine`, serves a closed set of packaged assets and provides JSON where appropriate. It is not a static server for arbitrary project files.

## Checking availability

Health returns 200 normally and 503 during maintenance. `Accept: application/json` requests JSON with a state message; HTML shows the corresponding page. This reports application state rather than automatically checking every database, queue or external dependency.

A service that injects `IDefaultResponses` can also call `await pages.favicon()`, `await pages.robotsTxt()` or `await pages.sitemapXml()`. Each returns a file response when a candidate exists, otherwise an HTTP error response.

### Publish crawler files and a favicon

Place these files in the application’s public storage directory (`storage/app/public` by default). The router exposes the following GET endpoints:

| Endpoint | Application file, in lookup order | When absent |
| --- | --- | --- |
| `/favicon.ico` | `favicon.ico`, then `favicon.png`, then `favicon.svg` | Uses the packaged icon. |
| `/robots.txt` | `robots.txt` | Uses the packaged robots file. |
| `/sitemap.xml` | `sitemap.xml` | Returns HTTP 404. |

To generate a sitemap from your application’s data, register a GET action at `/sitemap.xml`. An application GET route at any of these three paths replaces its default handler.

## Presenting an error from a service

```python
from orionis.http.default.contracts.responses import IDefaultResponses

async def unavailable(pages: IDefaultResponses):
    return await pages.error(
        503, {"message": "Catalog temporarily unavailable"},
        expects_json=True, headers={"Retry-After": "30"},
    )
```

The container must resolve `IDefaultResponses` in a booted application. `error` accepts an integer/`HTTPStatus` between 100 and 599 and text or dictionary content. HTML escapes descriptions; JSON preserves values. The example returns both `Retry-After: 30` and `Cache-Control: no-cache, no-store, must-revalidate`. The service adds that cache policy whenever a caller omits `Cache-Control` and preserves a caller-supplied value.

Exception pages contain traceback/context and may include an assistance link encoding diagnostic information in a URL. Review what your handler exposes and configure debug for the environment. The `exception()` method does not itself authorize access to diagnostic details.

## Enabling optional authentication pages

`Route.auth()` registers login, registration and recovery GET/POST routes, email verification GET and logout POST. Logout requires session identity. Guest pages use `GuestMiddleware`; verification allows links opened in an already authenticated browser. The web pipeline provides sessions and CSRF.

```python
from orionis.support.facades import Route

Route.auth()
```

Register the helper once in `routes/web.py`. To replace individual controllers, pass `login_controller`, `register_controller` or `forgot_password_controller`. The default registration flow uses `app.models.user.User`, application templates, hashing and mail delivery. See [the route names and expected actions](/en/authentication/account-recovery). The signed-in profile and password-change form require [separate web routes](/en/authentication/session-authentication#change-a-signed-in-users-password).

## Caches and file changes

The clock on the built-in HTML pages displays the application timezone. A change in the configured application name, locale or timezone invalidates the cached healthy and maintenance HTML. JSON health responses carry the status independently of the HTML clock.

Restart workers after adding or replacing public fallback candidates so they select the intended favicon, robots or sitemap files. Editing the content of an already selected file is reflected on later reads. Error and exception pages are rendered per request; they do not reuse another request's error payload. Verify the actual health URL configured by your application before configuring load-balancer probes.

Continue with [account recovery](/en/authentication/account-recovery) for authentication-page prerequisites.
