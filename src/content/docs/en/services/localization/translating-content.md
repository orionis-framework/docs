---
title: "Translate messages and plurals"
description: "Use Lang to resolve messages, check translations, replace variables, and select plural forms with real JSON resources."
editUrl: true
lastUpdated: false
---

The `Lang` facade translates messages in controllers, services, and other components of a booted Orionis application. Always import `from orionis.support.facades import Lang`. Its `get()`, `has()`, and `choice()` methods are **synchronous**: call them inside an asynchronous method without `await`.

This page focuses on message resolution. To create the files and configure the default locale, see [Messages and locales](/en/services/localization/messages-and-locales); to inject the translator or use it in Jinja, see [Application and views](/en/services/localization/application-and-views).

## Resources for the examples

Create these UTF-8 JSON files. If they already exist, merge the keys with their translations. These examples use `en` as the fallback locale.

`resources/lang/en/messages.json`:

```json
{
  "greeting": "Hello :name",
  "welcome": "Welcome to Orionis",
  "names": ":name | :Name | :NAME",
  "contacts": ":name (:name_full)",
  "reports": "{0} No reports|{1} One report|[2,*] :count reports",
  "items": "One item|:count items",
  "stock": "[*,0] Out of stock|[1,5] Low stock: :count|[6,*] In stock: :count",
  "universal": "{0} No messages|{*} :count messages",
  "only_in_english": "Available in English"
}
```

`resources/lang/es/messages.json`:

```json
{
  "greeting": "Hola :name",
  "welcome": "Bienvenido a Orionis",
  "names": ":name | :Name | :NAME",
  "contacts": ":name (:name_full)",
  "reports": "{0} No hay informes|{1} Un informe|[2,*] :count informes",
  "items": "Un artículo|:count artículos",
  "stock": "[*,0] Sin existencias|[1,5] Pocas existencias: :count|[6,*] Existencias: :count",
  "universal": "{0} No hay mensajes|{*} :count mensajes"
}
```

The filename supplies the prefix: `messages.greeting` identifies `greeting` inside `messages.json`. The Spanish file deliberately omits `messages.only_in_english` to demonstrate fallback.

## Retrieve a message with get()

`Lang.get(key, locale=None, **replace)` returns a `str`. `key` identifies the message; `locale` selects the language for this call; the remaining keyword arguments provide placeholder values.

A service can prepare text needed by a controller, an email, or a task:

```python
from orionis.support.facades import Lang


class WelcomeMessages:

    def for_user(self, name: str, locale: str) -> dict[str, str]:
        return {
            "title": Lang.get("messages.welcome", locale=locale),
            "greeting": Lang.get(
                "messages.greeting",
                locale=locale,
                name=name,
            ),
        }
```

`WelcomeMessages().for_user("Ada", "es")` returns `{"title": "Bienvenido a Orionis", "greeting": "Hola Ada"}`. With `"en"`, it returns `{"title": "Welcome to Orionis", "greeting": "Hello Ada"}`.

When you omit `locale` or pass `None`, the translator uses its active locale. For a request or job with its own language, pass `locale=` on **every call**. The translator is shared by the process: `Lang.setLocale()` changes global state and does not provide an isolated locale selection for a request.

### Placeholders and capitalization

With `name="ada lovelace"`, the same message can use three forms:

| Placeholder | Result |
|---|---|
| `:name` | `ada lovelace` |
| `:Name` | `Ada lovelace` |
| `:NAME` | `ADA LOVELACE` |

`:Name` uses `str.capitalize()`: it uppercases the first character and lowercases the rest; it does not capitalize every word. Values are converted with `str()`, so you can also substitute numbers and other objects.

```python
from orionis.support.facades import Lang


class ContactMessages:

    def preview(self, locale: str) -> dict[str, str]:
        return {
            "variants": Lang.get(
                "messages.names",
                locale=locale,
                name="ada lovelace",
            ),
            "contact": Lang.get(
                "messages.contacts",
                locale=locale,
                name="Ada",
                name_full="Ada Lovelace",
            ),
            "pending": Lang.get("messages.greeting", locale=locale),
        }
```

With `locale="es"`:

- `variants` is `ada lovelace | Ada lovelace | ADA LOVELACE`.
- `contact` is `Ada (Ada Lovelace)`.
- `pending` is `Hola :name` because no `name` was supplied.

Longer names are replaced before shorter ones: `name_full` is processed before `name`. Replacement is literal, without expressions or date, number, or HTML formatters. A placeholder without a supplied value remains in the message. The translator returns text; HTML escaping belongs to the presentation context, such as view autoescaping.

## Fallback and missing keys

For each `get()` call, Orionis checks:

1. The locale supplied in `locale`, or the active locale when omitted.
2. The configured fallback locale, when different.
3. The missing-key callback, when registered.
4. The key itself if the callback does not return a `str`.

An empty translation (`""`) counts as present and does not trigger fallback. Regional locales are not traversed automatically: requesting `es-CO` does not try `es` before the fallback. Locale codes are not normalized either: `es-CO` and `es_CO` are different identifiers.

### Check whether a translation exists with has()

Use `Lang.has(key, locale=None, *, fallback=True)` to check existence. It includes the fallback by default; with `fallback=False` it only checks the requested locale.

```python
from orionis.support.facades import Lang


class TranslationStatus:

    def inspect(self, locale: str) -> dict[str, str | bool]:
        return {
            "text": Lang.get("messages.only_in_english", locale=locale),
            "available": Lang.has("messages.only_in_english", locale=locale),
            "translated_here": Lang.has(
                "messages.only_in_english",
                locale=locale,
                fallback=False,
            ),
            "missing": Lang.get("messages.unknown", locale=locale),
            "missing_exists": Lang.has("messages.unknown", locale=locale),
        }
```

With `locale="es"`, fallback `en`, and no custom callback, the result is:

```json
{
  "text": "Available in English",
  "available": true,
  "translated_here": false,
  "missing": "messages.unknown",
  "missing_exists": false
}
```

`has()` does not execute the missing-key callback. Prefer it over comparing `get(key) != key`: a valid translation can have exactly the same text as its key.

### Customize missing keys

`Lang.missing(handler)` registers a synchronous callback with signature `(key: str, locale: str) -> str | None`. It receives the requested locale even when the fallback was also checked. Return a `str` to replace the message or `None` to retain the key; placeholders are then applied to the resulting text.

Configure this behavior once during application startup. `Lang.missing(None)` removes the callback. Registration is shared: avoid installing and removing callbacks per request, recursively calling the translator from the callback, or passing an `async` function.

## Select plural forms with choice()

`Lang.choice(key, count, locale=None, **replace)` retrieves a message with the same fallback as `get()`, selects a segment, and replaces its placeholders. `count` represents the quantity and is available as `:count` without repeating it among replacement arguments.

```python
from orionis.support.facades import Lang


class ReportMessages:

    def summary(self, count: int, locale: str) -> str:
        return Lang.choice("messages.reports", count, locale=locale)
```

For `locale="es"`:

| Quantity | Result |
|---|---|
| `0` | `No hay informes` |
| `1` | `Un informe` |
| `2` | `2 informes` |
| `15` | `15 informes` |

Use `choice()` for messages with alternatives separated by `|`. `get("messages.reports")` returns the entire line, including selectors and separators; it does not select a form automatically.

### Exact selectors, ranges, and wildcards

| Syntax | Match |
|---|---|
| `{0}`, `{1}`, `{5}` | A quantity numerically equal to the given value. |
| `[1,5]` | From `1` through `5`, including both bounds. |
| `[6,*]` | From `6` with no upper bound. |
| `[*,0]` | Up to `0` with no lower bound. |
| `{*}` | Any quantity; useful as the final case. |

Segments are separated by `|`. A selector must start at the beginning of its segment, for example `{0} None|[1,*] :count`. You may leave spaces after `}` or `]`; do not insert spaces before the selector, including after `|`.

A service can use the stock rules and the universal case defined in the resources:

```python
from orionis.support.facades import Lang


class InventoryMessages:

    def stock(self, quantity: int, locale: str) -> str:
        return Lang.choice("messages.stock", quantity, locale=locale)

    def notifications(self, quantity: int, locale: str) -> str:
        return Lang.choice("messages.universal", quantity, locale=locale)
```

In Spanish, `stock(0, "es")` returns `Sin existencias`; `stock(5, "es")` returns `Pocas existencias: 5`; `stock(6, "es")` returns `Existencias: 6`. `notifications(0, "es")` returns `No hay mensajes` and `notifications(8, "es")` returns `8 mensajes`.

Orionis scans **all explicit selectors in their written order** and chooses the first match. There is no additional priority for `{n}` over `[a,b]`. Put specific cases before broad ranges and leave `{*}` last so it does not hide later segments.

### Positional rule when no explicit selector matches

When no explicit selector matches:

- A single segment is used for every quantity.
- With multiple segments, `count == 1` selects the first.
- Any other quantity selects the second.

Condition markers are removed from the selected segment. A third segment without a condition is not selected by this rule; add explicit selectors when you need more cases.

```python
from orionis.support.facades import Lang


class ItemMessages:

    def summary(self, count: int, locale: str) -> str:
        return Lang.choice("messages.items", count, locale=locale)
```

In Spanish, `summary(1, "es")` returns `Un artículo`; `summary(0, "es")` and `summary(7, "es")` return `0 artículos` and `7 artículos`. The same positional rule applies to every language: the framework does not include automatic locale-specific ICU/CLDR plural selection.

### Plural selection limits

The argument is annotated as `int`. Orionis does not convert or validate it internally: validate quantities received from payloads before using them. A nonnumeric value may produce a comparison `TypeError` against a range bound.

Numeric condition bounds are interpreted with `float()`. Malformed conditions do not match and may fall through to the positional rule; they do not themselves raise a configuration error. Cover every quantity your application accepts, especially `0` and negative values when applicable.

The `|` character always separates segments when using `choice()`; there is no escape mechanism for including it as literal text in one alternative. Leading and trailing whitespace is stripped from the selected text.

## Quick reference

| Method | Use |
|---|---|
| `Lang.get(key, locale=None, **replace)` | Returns the resolved and interpolated message as a `str`. |
| `Lang.has(key, locale=None, *, fallback=True)` | Returns `bool` and includes the fallback unless disabled. |
| `Lang.choice(key, count, locale=None, **replace)` | Selects a plural segment and replaces `:count` and other placeholders. |
| `Lang.getLocale()` | Returns the shared active locale; it does not by itself identify the request language. |
| `Lang.availableLocales()` | Returns a sorted tuple of locales with discovered sources; it does not guarantee that every key is translated. |

Initial configuration and file organization are covered in [Configuration and resources](/en/services/localization/messages-and-locales). Using the same service through `ITranslator` and the `trans`, `__`, and `choice` helpers is covered in [Application and views](/en/services/localization/application-and-views).
