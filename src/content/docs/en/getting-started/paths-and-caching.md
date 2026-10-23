---
title: "Directories and bootstrap caching"
description: "Use the path registry so that services do not depend on the process working directory. Directory provides named methods for that same registry. Compilation stores bootstrap…"
editUrl: true
lastUpdated: false
---

Use the path registry so that services do not depend on the process working directory. `Directory` provides named methods for that same registry. Compilation stores bootstrap metadata: it does not compile Python or replace deployment management. `compile(...)` returns `None`; call it in a separate statement before `create()`.

## Examples

### Use the application's configured directories

This handler fragment receives the existing application through dependency injection. It returns the configured views directory rather than constructing a second application or relying on the working directory.

```python
from pathlib import Path
from orionis.foundation.contracts.application import IApplication
from orionis.foundation.directory import Directory

async def views_directory(app: IApplication) -> Path:
    directory = Directory(app)
    return directory.resourcesViews()
```

The default result is `<project>/resources/views`. You can also use `app.path("resources_views")` directly. All named paths are absolute after application creation; unknown keys return `None`.

| Path key | Default directory | Application code |
|---|---|---|
| `app_http_controllers` | `app/http/controllers` | Request handlers. |
| `app_models` | `app/models` | ORM models. |
| `app_providers` | `app/providers` | Service registrations. |
| `resources_views` | `resources/views` | Jinja templates. |
| `database_migrations` | `database/migrations` | Schema changes. |
| `storage_logs` | `storage/logs` | Log files. |
| `tests` | `tests` | Application tests. |

### Configure compiled bootstrap state

Bootstrap persistence, its JSON files and `.env` invalidation are covered in [Environment: bootstrap and compiled configuration](/en/architecture/environment/compiled-configuration). Configure it in `bootstrap/app.py` on the same application instance before `app.create()`; directory paths can be part of that snapshot.

## Refresh bootstrap caches after a change

The skeleton configures `app.compile(...)` in `bootstrap/app.py` before `create()`. Its monitored files and directories determine automatic invalidation. When changing bootstrap registrations or a path not included in that list, clear the previous artifacts from the project root, then restart running processes:

```shell
uv run python -B reactor optimize:clear
```

`optimize:clear` removes compiled configuration, command and route cache files, Python bytecode, and project `build`/`dist` artifacts. Review those effects when the application stores deployment assets there. It is distinct from deleting cached business values. The next process reconstructs bootstrap metadata as needed.

`reactor optimize` validates Python source syntax in memory; it does not prewarm the bootstrap cache or execute your application tests. A valid compiled-cache hit reuses earlier registrations, so edits to `with...` calls do not take effect until invalidation.

## Reference and next steps

[directory.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/directory.py) · [core_paths.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/core_paths.py) · [application.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/application.py)

[Return to the module index](/en/getting-started).
