---
title: "Health, errors and default routes"
description: "The router registers favicon, robots.txt, sitemap.xml and the application's configured health path. DefaultResponses renders pages through IViewEngine, serves a closed set of…"
editUrl: true
lastUpdated: false
---

The router registers favicon, `robots.txt`, `sitemap.xml` and the application's configured health path. `DefaultResponses` renders pages through `IViewEngine`, serves a closed set of packaged assets and provides JSON where appropriate. It is not a static server for arbitrary project files.

## Checking availability

Health returns 200 normally and 503 during maintenance. `Accept: application/json` requests JSON with a state message; HTML shows the corresponding page. This reports application state rather than automatically checking every database, queue or external dependency.

A service that injects `IDefaultResponses` can also call `await pages.favicon()`, `await pages.robotsTxt()` or `await pages.sitemapXml()`. Each returns a file response when a candidate exists, otherwise an HTTP error response.

Override the GET favicon, robots and sitemap routes by declaring their paths in application routes. Public files use candidate selection with packaged fallbacks where available. A missing sitemap can return 404; business URL catalogs are not generated automatically.

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

Declare it once in web routes. Supply `login_controller`, `register_controller` or `forgot_password_controller` to replace individual controllers. Preserve methods expected by [the actual registration](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/http/routes/auth.py). Default registration/profile controllers depend on `app.models.user.User`, application views, hashing and mail; they are not a generic flow for every identity model. Check those contracts before enabling them. Read [account recovery](/en/authentication/account-recovery).

## Caches and file changes

The clock on the built-in HTML pages displays the application timezone. A change in the configured application name, locale or timezone invalidates the cached healthy and maintenance HTML. JSON health responses carry the status independently of the HTML clock.

Restart workers after adding or replacing public fallback candidates so they select the intended favicon, robots or sitemap files. Editing the content of an already selected file is reflected on later reads. Error and exception pages are rendered per request; they do not reuse another request's error payload. Verify the actual health URL configured by your application before configuring load-balancer probes.

Continue with [account recovery](/en/authentication/account-recovery) for authentication-page prerequisites.
