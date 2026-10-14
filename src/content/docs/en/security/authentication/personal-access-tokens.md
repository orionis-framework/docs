---
title: "Personal access tokens for APIs"
description: "Personal tokens represent an authorizable identity without a browser session. Clients send Authorization: Bearer <token>; the guard validates secret, record, expiry and owner.…"
editUrl: true
lastUpdated: false
---

Personal tokens represent an authorizable identity without a browser session. Clients send `Authorization: Bearer <token>`; the guard validates secret, record, expiry and owner. These are opaque credentials, not JWT or a refresh-token system.

## Issuing and showing a secret once

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

Protect this handler with session authentication, CSRF and authorization to issue credentials. Token-authenticated requests cannot mint further tokens through `Auth.createToken`. The current identity is the default owner; trusted code may pass `tokenable=`, which must implement `IAuthorizable`.

The secret appears only in `NewAccessToken.plain_text`. `repr` and `toDict()` omit it. Deliver it once over a protected channel and keep it out of logs. `AccessToken` holds immutable metadata; the repository stores a digest rather than a recoverable secret.

Register the issuance handler on a web POST route, for example `Route.post("/tokens/report-client", issue_read_token).middleware(AuthenticateSessionMiddleware)`, importing `Route` and `AuthenticateSessionMiddleware` as in [session login](/en/security/authentication/identity-and-session). Validate your application's permission to issue credentials before calling `Auth.createToken`. To consume the resulting token, protect your API route with `AuthenticateTokenMiddleware` and send:

```http
Authorization: Bearer <token returned by the issuance endpoint>
```

A token carrying `reports.read` only restricts the owner's existing permissions; grant the identity that permission using [authorization](/en/security/authentication/authorization) and check it on the reporting endpoint.

## Restricting permission

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

Snapshots can report roles, but role middleware rejects restricted credentials so grouping cannot bypass ability limits. Use permissions or policies. `abilities=None` adds no restriction; `abilities=()` permits no capabilities. Do not issue broad tokens to compensate for misconfigured permissions.

## Revocation and maintenance

In a token request, `await Auth.revokeCurrentToken()` returns whether the active credential was revoked. `AccessTokenRepository` exposes asynchronous `create`, `findByPlainText`, `touch`, `revoke`, `revokeAll` and `purgeExpired`. Inject it or its contract into trusted administration. `revokeAll(owner)` requires caller authorization to administer that owner.

Validation rejects malformed, expired, revoked and inactive-owner credentials. Secret comparisons use constant-time helpers. Do not base client logic on parsing the identifier/secret representation.

## Configuration

`AUTH_TOKEN_TABLE` defaults to `personal_access_tokens`, `AUTH_TOKEN_EXPIRATION` to `None` (no automatic expiry) and `AUTH_TOKEN_SECRET_BYTES` to 40, validated between 32 and 128. Configured expiry uses minutes; `expires_at` takes an explicit timestamp. Deliberately limit lifetime and schedule your own `purgeExpired` task for physical cleanup. Expiry denies access even while a record remains stored.
