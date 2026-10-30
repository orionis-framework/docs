---
title: "Files, locales, and configuration"
description: "Organize JSON files, configure locales, and understand translation key resolution and fallback in Orionis."
editUrl: true
lastUpdated: false
---

Orionis reads translations from UTF-8 JSON files and collects each locale's lines into a map of keys. You can combine literal source text keys with files grouped by responsibility. The default directory is `resources/lang/`, relative to the application root.

## Configure application locales

These settings belong to `config/app.py`, rather than the view configuration. These are the three translation fields in `BootstrapApp`; retain the remaining fields in your file:

```python
from dataclasses import dataclass, field

from orionis.environment import Env
from orionis.foundation.config.app import App


@dataclass(frozen=True, kw_only=True)
class BootstrapApp(App):
    locale: str = field(
        default_factory=lambda: Env.get("APP_LOCALE", "en"),
    )
    fallback_locale: str = field(
        default_factory=lambda: Env.get("APP_FALLBACK_LOCALE", "en"),
    )
    language_path: str = field(
        default_factory=lambda: Env.get("APP_LANGUAGE_PATH", "resources/lang/"),
    )
```

| Field | Environment variable | Default | Purpose |
| --- | --- | --- | --- |
| `locale` | `APP_LOCALE` | `"en"` | Initial active locale of the shared translator. |
| `fallback_locale` | `APP_FALLBACK_LOCALE` | `"en"` | Second locale queried when a key is missing. |
| `language_path` | `APP_LANGUAGE_PATH` | `"resources/lang/"` | Directory containing all locales. |

For example, in `.env`:

```dotenv
APP_LOCALE=es
APP_FALLBACK_LOCALE=en
APP_LANGUAGE_PATH=resources/lang/
```

`language_path` accepts an absolute path or a path relative to `app.basePath`. Configuration validates these fields as nonempty strings; the translator also validates the locale code syntax during construction. Each code does not need existing files: a locale without sources produces an empty map and allows resolution to continue with the fallback.

If you explicitly configure the application from `bootstrap/app.py`, add these fields to its existing `withConfigApp(...)` call, before `app.create()`:

```python
app.withConfigApp(
    locale="es",
    fallback_locale="en",
    language_path="resources/lang/",
)
```

Keep the other options your application already uses in that same call. The manager builds the translator with these values at startup; changing configuration later does not rebuild an already resolved translator.

## Create translation files

One possible layout is:

```text
resources/lang/
├── en.json
├── es.json
├── en/
│   ├── shop.json
│   └── validation.json
└── es/
    ├── shop.json
    └── validation.json
```

Create these files directly in the project. They are not Python modules and do not need initialization files. The loader looks for files with the `.json` extension; it does not interpret YAML, Python files, or Jinja templates as translation sources.

### Literal source text keys

Use `resources/lang/es.json` when you prefer translating the source text itself:

```json
{
  "Save changes": "Guardar cambios",
  "Welcome, :name": "Bienvenido, :name"
}
```

The full key is looked up, including spaces, punctuation, and capitalization. For example, `Lang.get("Save changes", locale="es")` returns `Guardar cambios`, and `Lang.get("Welcome, :name", locale="es", name="Ada")` returns `Bienvenido, Ada`.

### Grouped files and nested objects

Use `resources/lang/es/shop.json` to group related messages:

```json
{
  "welcome": "Bienvenido, :name",
  "account": {
    "title": "Tu cuenta",
    "updated": "Los datos se guardaron correctamente"
  },
  "cart": {
    "items": "{0} Tu carrito está vacío|{1} Tienes un artículo|[2,*] Tienes :count artículos"
  }
}
```

The filename becomes the group prefix. Its objects are flattened recursively:

| Resulting key | Stored line |
| --- | --- |
| `shop.welcome` | `Bienvenido, :name` |
| `shop.account.title` | `Tu cuenta` |
| `shop.account.updated` | `Los datos se guardaron correctamente` |
| `shop.cart.items` | The complete string with segments separated by `\|`. |

Groups are only searched as `resources/lang/<locale>/*.json`. Objects inside the JSON support nesting; additional subdirectories are not traversed. To organize a domain, create a group file and use nested objects inside it.

The corresponding `resources/lang/en/shop.json` file can contain:

```json
{
  "welcome": "Welcome, :name",
  "account": {
    "title": "Your account",
    "updated": "Your details were saved successfully"
  },
  "cart": {
    "items": "{0} Your cart is empty|{1} You have one item|[2,*] You have :count items"
  },
  "help": "Contact support"
}
```

See [translating content](/en/localization/translating-content) for interpolation, key existence checks, and plural selection.

### Precedence when keys overlap

For each locale, the loader follows this sequence:

1. Read grouped files in filename order and flatten their objects.
2. Read `<locale>.json` and merge its entries last.
3. Keep the last written value when two entries produce the same key.

For example, `es/shop.json` can define `shop.account.title`, while `es.json` contains:

```json
{
  "shop.account.title": "Mi cuenta"
}
```

In this case, `Lang.get("shop.account.title", locale="es")` returns `Mi cuenta`. The root file also flattens nested objects starting from their own key, without adding a group name. Avoid defining the same key in multiple ways unless you specifically intend this replacement.

## JSON types and errors

Each file must have a JSON object at its root. Nested objects become dotted keys, and leaf values should be translation text. The loader accepts other leaves but converts them with Python's `str()`: a boolean `true` becomes `"True"`, `null` becomes `"None"`, and a list becomes its Python representation. They are not retained as typed JSON values or lists of translations. Use strings for stable, explicit results.

A missing file or locale directory does not prevent resolving other locales. If a discovered file disappears before it is read, `TranslationFileNotFoundException` is raised. Invalid JSON, incompatible encoding, or a root value that is not an object produces `TranslationSyntaxException`. Filesystem read errors may propagate; fallback applies to **missing keys**, rather than errors loading a damaged source.

Empty objects generate no lines. Keys already containing dots share the same notation as nested objects and can collide with them. Keep a consistent convention within each group.

## Choose and discover locale codes

Use codes such as `en`, `es`, `es-CO`, `pt_BR`, or `zh-Hant`. The translator accepts alphanumeric groups separated by `-` or `_`; it rejects empty codes, ordinary spaces, slashes, and segments such as `../es`. It does not check a language registry or convert the code to a canonical form.

`es-CO`, `es_CO`, and `es-co` are different locale keys for the translator. Create files and query codes with matching spelling. On case-insensitive filesystems, disk access may be less strict, but the framework does not normalize names.

`Lang.availableLocales()` returns a sorted tuple of names discovered in root `.json` files and directories containing at least one `.json` file directly. Discovery does not parse their contents or guarantee that their names pass translator validation. It is neither a list of locales installed in Python nor a list of maps already loaded into the cache.

## How fallback works

With `locale="es-CO"` and `fallback_locale="en"`, a query searches for the key in `es-CO` and then in `en`. **It does not automatically search `es`**. Orionis uses the single configured fallback, without a regional hierarchy or an additional locale list.

With the preceding examples and `APP_FALLBACK_LOCALE=en`, `Lang.get("shop.help", locale="es")` returns `Contact support`, because the key exists only in English. If it is also absent from English, the missing-key handler is consulted if registered; otherwise, the key itself is returned. `Lang.has(..., fallback=False)` checks whether the translation exists specifically in the requested locale.

Selecting `locale=` for a query does not change the shared active locale. Use this argument for requests from different users, as described in [application and views](/en/localization/application-and-views).

<a id="locale-cache-limits"></a>

## Locale cache limits and missing files

In **1.1.0**, `TranslationRepository(loader, *, max_locales=256, negative_ttl=30)` retains at most **256 locale maps per repository**, counting both populated and empty maps. Reads refresh recency; reaching capacity evicts the least recently used map. An empty result is retried after **30 seconds** by default, so adding a previously missing locale no longer requires indefinite negative caching.

`max_locales` must be a positive integer excluding booleans. `negative_ttl` must be finite and nonnegative; zero retries empty results on the next read. These are repository constructor options, not new `APP_*` environment settings. Replace the repository binding in a provider to use a custom budget.

Populated maps do not watch the filesystem and remain cached until eviction or explicit invalidation. Existing `forget()`, `flush()` and translator reload APIs remain available. Loading stays synchronous; preload required locales at startup when first-request file I/O is undesirable. Cached maps are shared within the repository, so consumers should not mutate them.
