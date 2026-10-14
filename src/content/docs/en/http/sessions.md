---
title: "HTTP sessions"
description: "Sessions keep data on the server and send only a random identifier to the browser. Orionis creates sessions lazily: reading an empty session does not automatically create a…"
editUrl: true
lastUpdated: false
---

Sessions keep data on the server and send only a random identifier to the browser. Orionis creates sessions lazily: reading an empty session does not automatically create a record or cookie. Web middleware coordinates restoration, flash, persistence and cleanup.

Use web routes in `routes/web.py` for browser state. API routes do not automatically restore or save a session. Start with [state and flash](/en/http/sessions/state-and-flash), where a POST stores a preference and the following GET reads it; choose persistent storage before deploying multiple workers.

1. [State and flash](/en/http/sessions/state-and-flash): preferences, forms and navigation between requests.
2. [Storage and concurrency](/en/http/sessions/stores-and-concurrency): choose a driver and implement a store.
3. [Configuration and secure lifecycle](/en/http/sessions/configuration-and-security): cookies, renewal and rotation.

You need Python 3.14+ and web routes for automatic persistence. `orionis.session` exports no classes at its root: inject `ISession`, use the `Session` facade or import implementations from their modules. Start with [HTTP](/en/http) and continue with [authentication](/en/security/authentication).
