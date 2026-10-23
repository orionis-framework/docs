---
title: "View configuration and cache"
description: "Configure directories, escaping, reloads, and the two caches used by the Orionis view engine."
editUrl: true
lastUpdated: false
---

`config/view.py` defines where templates are located and how their compilation is retained. Orionis creates one shared Jinja environment per process from this configuration. Rendering is always asynchronous.

## The config/view.py file

The default structure is a frozen dataclass extending the Orionis configuration. Change the fields of the existing class; do not create a second view configuration in another file:

```python
from dataclasses import dataclass, field

from orionis.environment import Env
from orionis.foundation.config.view import View


@dataclass(frozen=True, kw_only=True)
class BootstrapView(View):
    paths: list[str] | tuple[str, ...] = field(
        default_factory=lambda: Env.get("VIEW_PATHS", ["resources/views"]),
    )
    cache_size: int = field(
        default_factory=lambda: Env.get("VIEW_CACHE_SIZE", 400),
    )
    cache_path: str | None = field(
        default_factory=lambda: Env.get("VIEW_CACHE_PATH", "storage/framework/views"),
    )
    auto_reload: bool = field(
        default_factory=lambda: Env.get("APP_DEBUG", True),
    )
    autoescape: bool = field(
        default_factory=lambda: Env.get("VIEW_AUTOESCAPE", True),
    )
```

Foundation discovers this class when loading configuration and exposes its values under `view`. The `Env.get()` calls are evaluated when the configuration is constructed; environment variables affect these options because the file reads them. Instantiating `View(...)` in a controller does not reconfigure the engine.

| Field | Type and default | Behavior |
| --- | --- | --- |
| `paths` | `list[str]` or `tuple[str, ...]`; `["resources/views"]` | Search directories, in priority order. Reads `VIEW_PATHS`. |
| `cache_size` | `int`; `400` | Maximum number of templates held in memory per environment. Reads `VIEW_CACHE_SIZE`. |
| `cache_path` | `str` or `None`; `"storage/framework/views"` | Disk bytecode directory; `None` disables it. Reads `VIEW_CACHE_PATH`. |
| `auto_reload` | `bool`; `True` | Checks whether the source changed when retrieving a cached template. Reads `APP_DEBUG`. |
| `autoescape` | `bool`; `True` | Escapes values inserted into application templates. Reads `VIEW_AUTOESCAPE`. |

There is no `enable_async` field: Orionis creates Jinja with `enable_async=True` and uses `render_async()`.

### Configure through the environment

With the file above, this example keeps escaping and reloads enabled during development and adds a second directory:

```dotenv
VIEW_PATHS=list:["resources/views", "packages/admin/views"]
VIEW_CACHE_SIZE=int:400
VIEW_CACHE_PATH=storage/framework/views
APP_DEBUG=bool:true
VIEW_AUTOESCAPE=bool:true
```

To disable only the disk cache, use `VIEW_CACHE_PATH=null`. To disable only the memory cache, use `VIEW_CACHE_SIZE=int:0`. `int:-1` removes the memory-cache limit. A positive value maintains an LRU cache with that maximum number of templates.

`paths` must be a nonempty list or tuple of nonempty strings. `cache_size` must be an integer greater than or equal to `-1`; a boolean is invalid. `cache_path` accepts a nonempty string or `None`. Both boolean fields require actual booleans: configuration does not silently coerce incorrect types.

## How directories are resolved

Relative paths resolve from `app.basePath`, normally the project root. Absolute paths are also supported. For example:

```text
project/
├── resources/views/dashboard.html
├── packages/admin/views/dashboard.html
└── storage/framework/views/
```

With `paths=["resources/views", "packages/admin/views"]`, `View.make("dashboard")` loads `resources/views/dashboard.html`. If that file is absent, it searches the second directory. Changing the order changes which template wins when names overlap.

Files do not require a Python module or initialization files: they are loader templates. Their location and the names passed to `View.make()` are explained in [rendering views](/en/views/rendering-templates).

The `__orionis__/default/` prefix is reserved for pages bundled with the framework. A framework loader searches them before application directories. These pages retain HTML escaping even when application views use `autoescape=False`.

## Memory cache and disk bytecode

These are separate mechanisms:

1. **Memory:** Jinja retains compiled template objects in the process environment. `cache_size` sets the limit. Each worker has separate memory.
2. **Disk:** Jinja saves compiled Python bytecode to avoid compiling the template again when another environment loads it. `cache_path` sets its directory.

These caches retain template compilation, **not the HTML of a request**. Variables are applied on each render: two users can receive different output from the same bytecode. Neither cache sets HTTP cache headers.

### When files appear

When `cache_path` is not `None`, Orionis creates the directory and its parents when constructing the environment, normally during provider startup. `.cache` files are written when a template is first loaded and compiled; application startup does not precompile all views.

The default location is:

```text
<project root>/storage/framework/views/
```

The name contains the flattened template path, an eight-character SHA-1 digest of the original name, and the `.cache` extension:

```text
users/profile.html → users.profile.<8-character digest>.cache
```

The digest distinguishes, for example, `users/profile.html` from `users/profile.j2`. Jinja also stores a source-content checksum to discard bytecode that no longer matches the template.

Writes use a temporary file followed by replacement, preventing another process from reading partially written bytecode. The application process needs permission to create and write the directory: Orionis does not automatically disable caching when directory creation fails. Although some read or replacement failures are tolerated, opening or writing errors can propagate; prepare the directory before deployment.

### Reloads during development and deployment

With `auto_reload=True`, Jinja checks whether an in-memory template is still current and reloads it when its source changes. With `False`, a process that already holds a template may keep using it after the file is edited.

When deploying changes with `auto_reload=False`, restart workers to rebuild their environments. Removing disk files does not clear the memory caches of processes already serving requests. Changing `app.config("view...")` after resolving the environment does not rebuild that singleton either.

## Clear bytecode

From the project root, use either alternative:

```bash
orionis clear:views
```

```bash
python -B reactor clear:views
```

The command reads `view.cache_path`, resolves relative paths from the application base, and recursively removes files ending in `.cache`. It preserves the directory and other files. If disk caching is disabled, it reports that and exits successfully.

The exit code is `0` when no errors occur and `1` when a file cannot be removed or the configured path is invalid. Errors are printed in the console. A template used after cleanup can generate its bytecode again.

Dedicate `cache_path` to view bytecode, since cleanup applies to every `.cache` file in that directory and its subdirectories. For a stable cleanup during deployment, coordinate the operation with worker restarts.

## Escaping, missing variables, and diagnosis

Keep `autoescape=True` for HTML pages. It escapes inserted content while allowing application layouts, blocks, and HTML files to work normally. Helpers returning safe markup have specific contracts, described in [view globals](/en/views/globals).

The environment uses `jinja2.Undefined`: a missing variable may print as empty text, while other operations on it can fail. Pass explicit context and check pages with populated and empty data. Templates are trusted application code; this environment does not use the Jinja sandbox.

A missing template raises `ViewTemplateNotFoundException`. Pending-render failures appear as `ViewRenderException`, preserving their cause. Check the requested name, search directories, and original exception before clearing caches. See [HTTP exceptions](/en/http/exceptions) for their presentation during a request.

To add filters, globals, tests, or tags, use a [view provider](/en/views/providers-and-extensions). The configuration above controls loading and caching; the provider extends the shared environment before requests are served.
