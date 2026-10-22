---
title: "Events, scopes and model lifecycle"
description: "Events, scopes and model lifecycle in Orionis Framework."
editUrl: true
lastUpdated: false
---

Entity behaviors have dedicated guides for precise reference:

- [Local and global scopes](/en/database/orm/scopes): reusable filters, arguments, registration and query-local exclusions.
- [Events and observers](/en/database/orm/events): eleven events, ordering, vetoes, async callbacks and transactions.
- [Soft deletes](/en/database/orm/soft-deletes): deletion column, visibility, restoration and purge.
- [Persistence and state](/en/database/orm/model-api): pending changes, original values, write booleans and entity/builder differences.

A scope constrains a query, an event wraps an instance operation, and soft deletion changes deletion writes/visibility. Combining them does not replace authorization or SQL constraints. Verify their interactions with [the testing guides](/en/database/orm/factories-and-testing).
