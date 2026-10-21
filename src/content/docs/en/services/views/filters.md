---
title: "Template filters"
description: "Practical reference for Orionis filters and the Jinja filters included in the view environment."
editUrl: true
lastUpdated: false
---

A filter transforms the value to the left of `|`. Chain filters and pass arguments: `{{ names | sort | join(", ") }}`. Orionis includes Jinja's standard filters and adds `json` and `markdown`. The examples below cover every name registered by default, including aliases.

Combine filters that produce iterators with `|list` when you need to display or reuse their contents. These examples are fragments of files inside `resources/views/`; they do not run as Python code.

## Filters added by Orionis

### json: display serialized data

`json(value, indent=None)` uses msgspec and returns a string. Use it to present data in a diagnostic block or panel; `indent` pretty-prints it. With autoescape enabled, quotes are escaped in the HTML source and the browser displays JSON as text.

```html
<pre>{{ {"name": "Ada", "active": true} | json(indent=2) }}</pre>
```

If encoding fails, the filter returns `str(value)`: it does not guarantee valid JSON for every object. To embed data in a `<script>` block, use `tojson`, covered below; adding `|safe` to `json` does not provide that context-specific escaping.

### markdown: convert Markdown text

`markdown(value)` converts `str(value)` to HTML with the Markdown extensions `extra`, `codehilite`, and `toc`. These enable features including tables, code blocks, and heading-based table-of-contents generation. The result is an ordinary string, so autoescape applies to it too.

```html
<pre>{{ "## Release notes\n\nA **small** update." | markdown }}</pre>
```

This example displays tags as text. When Markdown is trusted content maintained by the application, you can insert its HTML:

```html
<article>{{ "## Release notes\n\nA **small** update." | markdown | safe }}</article>
```

The filter does not sanitize user-supplied HTML. If you accept external Markdown, apply suitable sanitization before marking its result safe.

## Text

### lower, upper, capitalize, and title

Normalize capitalization. `capitalize` uppercases the first character and lowercases the rest; `title` applies title casing to words.

```html
{{ "ORIONIS" | lower }}       {# orionis #}
{{ "Orionis" | upper }}       {# ORIONIS #}
{{ "hELLO WORLD" | capitalize }} {# Hello world #}
{{ "hello orionis" | title }}  {# Hello Orionis #}
```

### trim, replace, and string

`trim` removes characters from both ends; `replace` replaces matches and accepts an optional limit; `string` converts a value to text.

```html
{{ "  Orionis  " | trim }}
{{ "--Orionis--" | trim("-") }}
{{ "red red red" | replace("red", "blue", 2) }} {# blue blue red #}
{{ 42 | string }}
```

### format, center, and indent

`format` uses Python's `%` formatting; `center` centers text with spaces; `indent` adds indentation, useful for preformatted text. Its `first` and `blank` options include the first line and empty lines.

```html
<pre>{{ "%s: %03d" | format("Item", 7) }}</pre>
<pre>{{ "hi" | center(6) }}</pre>
<pre>{{ "first\nsecond" | indent(2, first=true) }}</pre>
```

### truncate, wordwrap, and wordcount

`truncate(length, killwords=False, end="...", leeway=None)` shortens text. The example sets `leeway=0` to enforce the limit without tolerance. `wordwrap` wraps text into lines; `wordcount` counts words.

```html
{{ "Orionis Framework" | truncate(10, true, "...", 0) }} {# Orionis... #}
<pre>{{ "one two three" | wordwrap(7) }}</pre>
{{ "one two three" | wordcount }} {# 3 #}
```

### striptags

Removes tags and normalizes whitespace when presenting an HTML summary. Do not use it as a general HTML sanitization policy.

```html
{{ "<p>Hello <strong>Ada</strong></p>" | striptags }} {# Hello Ada #}
```

## Numbers and missing values

### abs, int, float, and round

`abs` returns the absolute value. `int` and `float` convert text and accept a default when conversion fails; `int` supports `base`. `round` accepts precision and the methods `common`, `ceil`, and `floor`; it returns a floating-point number, so chain `|int` if you need an integer.

```html
{{ -7 | abs }}                    {# 7 #}
{{ "ff" | int(default=0, base=16) }} {# 255 #}
{{ "bad" | int(default=0) }}        {# 0 #}
{{ "12.5" | float(default=0.0) }}    {# 12.5 #}
{{ 3.14159 | round(2) }}            {# 3.14 #}
```

### sum and filesizeformat

`sum` adds values or a specified attribute from a sequence. `filesizeformat` displays sizes with decimal units; `binary=true` uses binary units.

```html
{{ [10, 20, 30] | sum }} {# 60 #}
{{ [{"price": 10}, {"price": 20}] | sum(attribute="price") }} {# 30 #}
{{ 1000 | filesizeformat }}       {# 1.0 kB #}
{{ 1024 | filesizeformat(true) }} {# 1.0 KiB #}
```

### default and d

`default` replaces an undefined variable; `d` is its alias. The second argument `boolean=true` also replaces false values such as an empty string, `None`, or zero. Leave it disabled when zero is meaningful.

```html
{{ missing_title | default("Untitled") }} {# Untitled #}
{{ missing_title | d("Untitled") }}       {# Untitled #}
{{ "" | default("Empty", true) }}         {# Empty #}
{{ 0 | default(100) }}                    {# 0 #}
```

## Collections and dictionaries

### length, count, first, last, and list

`length` and its alias `count` return a size. `first` and `last` select endpoints; convert a generator to a list before using `last`. `list` materializes iterables, including strings.

```html
{{ ["Ada", "Lin"] | length }} {# 2 #}
{{ ["Ada", "Lin"] | count }}  {# 2 #}
{{ ["Ada", "Lin"] | first }}  {# Ada #}
{{ ["Ada", "Lin"] | last }}   {# Lin #}
{{ "api" | list }}            {# ['a', 'p', 'i'] #}
```

### join, reverse, sort, and unique

`join` joins elements with a separator and accepts `attribute`. `reverse` reverses order; `sort` sorts it. `unique` retains the first occurrence of each value. `sort` and `unique` support case-sensitive comparison and an attribute.

```html
{{ ["Ada", "Lin"] | join(", ") }}          {# Ada, Lin #}
{{ [{"name": "Ada"}] | join(", ", attribute="name") }}
{{ [1, 2, 3] | reverse | list }}           {# [3, 2, 1] #}
{{ [3, 1, 2] | sort }}                     {# [1, 2, 3] #}
{{ [3, 1, 2] | sort(reverse=true) }}        {# [3, 2, 1] #}
{{ ["api", "API", "web"] | unique | list }} {# ['api', 'web'] #}
```

### batch and slice

`batch(n, fill_with=None)` creates rows of up to `n` elements. `slice(n, fill_with=None)` distributes elements into `n` columns. Use them to build grids; a provided fill value completes short groups.

```html
{{ [1, 2, 3, 4, 5] | batch(2, "-") | list }}
{# [[1, 2], [3, 4], [5, '-']] #}
{{ [1, 2, 3, 4, 5] | slice(2) | list }}
{# [[1, 2, 3], [4, 5]] #}
```

### items, dictsort, and attr

`items` iterates dictionary pairs; `dictsort` sorts them by `key` or `value`. `attr` retrieves an object attribute without falling back to dictionary-key lookup.

```html
{% for key, value in {"name": "Ada", "role": "editor"} | items %}
  <p>{{ key }}: {{ value }}</p>
{% endfor %}
{{ {"b": 2, "a": 1} | dictsort }} {# [('a', 1), ('b', 2)] #}
{{ ("orionis" | attr("upper"))() }} {# ORIONIS #}
```

### groupby

Groups by an attribute after sorting the elements. Each group exposes `grouper` and `list`. Set `default` for elements missing that attribute and `case_sensitive=true` when capitalization matters.

```html
{% set users = [{"name": "Ada", "team": "api"}, {"name": "Lin", "team": "web"}] %}
{% for group in users | groupby("team", default="other") %}
  <h2>{{ group.grouper }}</h2>
  <p>{{ group.list | map(attribute="name") | join(", ") }}</p>
{% endfor %}
```

### map, select, reject, selectattr, and rejectattr

`map` retrieves an attribute or applies another filter to each element. `select`/`reject` retain or discard elements according to a Jinja test; the `attr` variants apply that test to an attribute. Without an explicit test, the attribute's truth value is used.

```html
{{ ["api", "web"] | map("upper") | list }} {# ['API', 'WEB'] #}
{{ [{"name": "Ada"}, {}] | map(attribute="name", default="Guest") | list }}
{{ [1, 2, 3, 4] | select("even") | list }} {# [2, 4] #}
{{ [1, 2, 3, 4] | reject("even") | list }} {# [1, 3] #}
{% set users = [{"name": "Ada", "active": true}, {"name": "Lin", "active": false}] %}
{{ users | selectattr("active") | map(attribute="name") | list }} {# ['Ada'] #}
{{ users | rejectattr("active") | map(attribute="name") | list }} {# ['Lin'] #}
```

### min and max

Return the minimum or maximum; both support `attribute` and case-sensitive comparison. An empty sequence produces an undefined value, which you can handle with `default`.

```html
{{ [10, 30, 20] | min }} {# 10 #}
{{ [10, 30, 20] | max }} {# 30 #}
{{ [] | max | default("No data") }}
```

## HTML, URLs, and browser JSON

### escape, e, forceescape, and safe

`escape` and its alias `e` turn special characters into HTML entities. `forceescape` escapes even content marked safe. `safe` marks a value as trusted HTML and bypasses autoescape: use it only with application-controlled markup.

```html
{{ "<strong>Ada</strong>" | escape }}
{{ "<strong>Ada</strong>" | e }}
{{ "<strong>Ada</strong>" | safe | forceescape }}
{{ "<strong>Application-owned heading</strong>" | safe }}
```

### urlencode and urlize

`urlencode` encodes a string or a collection of parameters. For a string it preserves `/`, allowing a path to be encoded; this differs from encoding a single path segment. `urlize` turns recognized URLs into HTML links.

```html
{{ "search term" | urlencode }} {# search%20term #}
{{ {"q": "hello world", "page": 2} | urlencode }}
{{ "Visit https://example.com" | urlize(nofollow=true, target="_blank") }}
```

### xmlattr

Converts a dictionary to HTML attributes and escapes their values. `None` and undefined values are omitted. Keep attribute names under application control; value escaping does not make every external name an acceptable attribute.

```html
<div{{ {"class": "notice", "data-id": 7, "hidden": none} | xmlattr }}>
  Saved
</div>
```

### tojson

Serializes data and returns safe markup with escaping appropriate for a `<script>` block. Unlike `json`, it does not fall back to `str(value)`. It also accepts `indent`.

```html
<script id="page-data" type="application/json">
  {{ {"name": "Ada", "label": "<demo>"} | tojson(indent=2) }}
</script>
```

JavaScript can read `JSON.parse(document.getElementById("page-data").textContent)`. Double-quoted HTML attributes require additional escaping; use the block above to keep escaping contexts clear.

## Diagnostics and random selection

### pprint and random

`pprint` displays a readable object representation, useful for diagnostics. `random` selects an element from a nonempty sequence; do not use it for security decisions or expect reproducible output.

```html
<pre>{{ {"team": "api", "members": ["Ada", "Lin"]} | pprint }}</pre>
{{ ["API tip", "Web tip", "Testing tip"] | random }}
```

## Add your own filters

Register functions through `IViewEnvironment.addFilter()` in a provider's `boot()` method. See [Providers and extensions](/en/services/views/providers-and-extensions) for full registration and async filters; change the environment during startup, before requests are served.

---

[Views](/en/services/views) · [Globals and context](/en/services/views/globals) · [Layouts and inheritance](/en/services/views/template-language)
