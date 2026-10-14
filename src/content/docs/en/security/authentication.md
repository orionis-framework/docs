---
title: "Authentication and authorization"
description: "Orionis resolves the current identity through browser sessions or personal access tokens and evaluates permissions, roles and policies. Context belongs to a request; shared…"
editUrl: true
lastUpdated: false
---

Orionis resolves the current identity through browser sessions or personal access tokens and evaluates permissions, roles and policies. Context belongs to a request; shared services do not retain a global user.

For a browser application, start with session login. For scripts or integrations calling your API, issue a personal token through an authorized session and protect the API with token middleware. In both cases, add permissions or resource policies for actions that need more than a signed-in user.

1. [Identity and session login](/en/security/authentication/identity-and-session): models, guards, login and logout.
2. [Permissions, roles and policies](/en/security/authentication/authorization): protect capabilities and resources.
3. [Personal access tokens](/en/security/authentication/personal-access-tokens): issue, restrict and revoke credentials.
4. [Remember-me and account recovery](/en/security/authentication/account-recovery): persistent cookies, resets and default pages.

Requires Python 3.14+, a configured ORM identity model, hashing and authentication migrations for persistence. Facade/repository examples require a booted application; snapshot examples are independent. Review [sessions](/en/http/sessions), [HTTP](/en/http) and [ORM](/en/database/orm).
