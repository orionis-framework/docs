---
title: "Stringable"
description: "Complete Stringable reference: 148 methods, immutable strings, Unicode, regex, callbacks, conversions and service-backed encryption."
editUrl: true
lastUpdated: false
---

`Stringable` is an immutable subclass of Python `str` that adds fluent text transformations. Import it from the curated package or its defining module:

```python
from orionis.support.types import Stringable
from orionis.support.types.stringable import Stringable as ModuleStringable

assert Stringable is ModuleStringable
assert Stringable("  Café Orionis  ").trim().slug() == "cafe-orionis"
```

This reference covers all **148 methods declared by the class**: 146 public methods and the implemented `__getitem__`/`__str__` protocols. The class declares no properties, custom constructor, class methods or static methods. APIs inherited unchanged from `str` are explained below rather than counted as additional Orionis methods. No random-string, UUID-generation or ULID-generation method is declared; `isUuid` and `isUlid` only inspect existing text.

<a id="stringable-constructor"></a>

**Construction — `Stringable(object="")` / `Stringable(bytes, encoding="utf-8", errors="strict")`**

Construction is inherited from `str`: an omitted object produces empty text; other objects use their string representation. Bytes without an encoding become their representation, whereas bytes plus an encoding are decoded. Invalid construction/decoding arguments propagate Python `TypeError`, `LookupError` or `UnicodeDecodeError`.

```python
from orionis.support.types import Stringable

assert Stringable() == ""
assert Stringable(42) == "42"
assert Stringable(None) == "None"
assert Stringable(b"hello") == "b'hello'"
assert Stringable(b"caf\xc3\xa9", encoding="utf-8") == "café"
```

A transformation does not change the source value: keep its return value. Most text transformations return a new Stringable. `tap` returns the original instance, and `when` may return the original or a branch's existing Stringable. Predicates, counts, parsing/list methods and conversions return their documented ordinary Python types. `encrypt`/`decrypt` delegate verbatim and have special awaitable/return-type behavior explained in their entries.

```python
from orionis.support.types import Stringable

original = Stringable("hello")
changed = original.upper()
assert original == "hello" and changed == "HELLO"
assert changed is not original
assert isinstance(original, str)
assert len(original) == 5 and "ell" in original
assert list(original) == ["h", "e", "l", "l", "o"]
assert type(next(iter(original))) is str
assert type(original + "!") is str
assert type(original * 2) is str
assert type(original.strip()) is str
assert {original: 1}["hello"] == 1
```

Indexing is explicitly overridden and remains Stringable; inherited concatenation, multiplication, iteration, `join`, `strip` and many other `str` operations can return ordinary strings. Equality, ordering, formatting, hashing, containment and truth testing use string semantics. There is no item assignment or mutable instance dictionary (`__slots__ = ()`). Unicode operations generally count code points, not bytes or user-perceived graphemes.

Method signatures below preserve actual parameter names, keyword-only `*`, annotations and defaults. The implementation is the authority when an annotation differs from runtime behavior. Examples are independent Python snippets; assertions state the expected result. Python/standard-library errors are allowed to propagate unless a method explicitly wraps them. As in Python, bool is an int subclass, so many integer checks accept True/False.

## Direct values and dependency injection

Construct Stringable where the input value is available. A type annotation does not supply request text, read an environment variable, or normalize input automatically. For reusable application behavior, inject a service which creates the wrapper inside its operation. The isolated container example below is executable; an application normally uses its existing `app` container.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.types import Stringable

class ExampleContainer(Container):
    pass

class SlugService:
    def normalize(self, title: str) -> str:
        return Stringable(title).trim().slug().value()

class ArticleService:
    def __init__(self, slugs: SlugService) -> None:
        self.slugs = slugs

async def example():
    container = ExampleContainer()
    article = await container.make(ArticleService)
    assert article.slugs.normalize("  Café Orionis  ") == "cafe-orionis"
    fixed = Stringable("application-label")
    container.instance(Stringable, fixed)
    assert await container.make(Stringable) is fixed

asyncio.run(example())
```

Explicit instance binding is possible when the data value is intentionally fixed for that container/scope; it does not connect the type to arbitrary incoming text. See [service bindings and invocation](/en/architecture/service-container/bindings-and-invocation) for lifetimes. `toDate` uses the standalone DateTime timezone configuration; encryption uses the configured `IEncrypter` service through Crypt.

## Values, construction and Python protocols

<a id="stringable-method-value"></a>

**`value() -> str`**

Return a plain `str`, useful at an API boundary where chaining ends.

```python
from orionis.support.types import Stringable

assert type(Stringable("hello").value()) is str
assert Stringable("hello").value() == "hello"
```

<a id="stringable-method-length"></a>

**`length() -> int`**

Count Unicode code points with `len`; this is neither the UTF-8 byte size nor the number of displayed grapheme clusters.

```python
from orionis.support.types import Stringable

assert Stringable("é").length() == 1
assert Stringable("e\u0301").length() == 2
```

<a id="stringable-method-getitem"></a>

**`__getitem__(key: int | slice) -> Stringable`**

Indexing and slicing both return `Stringable`, preserving chaining. Negative indexes and slice steps follow Python; an out-of-range index raises `IndexError`, an invalid key raises `TypeError`, and a zero slice step raises `ValueError`.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert s[-1] == "o" and isinstance(s[-1], Stringable)
assert s[1:4].upper() == "ELL"
assert s[::-1] == "olleh"
```

<a id="stringable-method-str"></a>

**`__str__() -> str`**

The `str(s)` protocol returns an ordinary `str`; equality, ordering, hashing and truth testing remain inherited string behavior.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert str(s) == "hello" and type(str(s)) is str
assert s == "hello" and hash(s) == hash("hello")
```

<a id="stringable-method-jsonserialize"></a>

**`jsonSerialize() -> str`**

Return the plain string value, without JSON encoding. Python `json.dumps` already recognizes this `str` subclass; it does not call this method as a serialization hook.

```python
from orionis.support.types import Stringable

import json
s = Stringable("hello")
assert s.jsonSerialize() == "hello"
assert type(s.jsonSerialize()) is str
assert json.dumps(s) == '"hello"'
```

<a id="stringable-method-tointeger"></a>

**`toInteger(base: int=10) -> int`**

Delegate to `int(self, base)`, default base 10; base 0 detects a prefix and bases 2–36 are supported by Python. Invalid text or base raises `ValueError` with added context; incompatible base types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("ff").toInteger(16) == 255
assert Stringable("0x10").toInteger(0) == 16
```

<a id="stringable-method-tofloat"></a>

**`toFloat() -> float`**

Parse with Python `float`, including its supported exponent, infinity and NaN spellings. Invalid text raises `ValueError` with conversion context.

```python
from orionis.support.types import Stringable

assert Stringable("1.25e2").toFloat() == 125.0
```

<a id="stringable-method-toboolean"></a>

**`toBoolean() -> bool`**

Strip surrounding whitespace, lowercase, then return true only for `1`, `true`, `on` or `yes`. All other values are false; this differs from `bool(s)`, which checks only emptiness.

```python
from orionis.support.types import Stringable

assert Stringable(" YES ").toBoolean() is True
assert Stringable("false").toBoolean() is False
assert bool(Stringable("false")) is True
```

<a id="stringable-method-todate"></a>

**`toDate(format_str: str | None='%Y-%m-%d') -> datetime | None`**

Parse with `datetime.strptime` using `%Y-%m-%d` by default, then attach `DateTime.getZoneInfo()` as `tzinfo` without converting the clock time. Return a timezone-aware standard `datetime`; no container is needed. Format mismatches raise `ValueError`. Despite the annotation and source comment, `None` is passed to `strptime` and raises `TypeError`; ISO auto-detection is not implemented.

```python
from orionis.support.types import Stringable

from orionis.support.facades.datetime import DateTime
d = Stringable("2026-10-23").toDate()
assert (d.year, d.month, d.day) == (2026, 10, 23)
assert d.tzinfo == DateTime.getZoneInfo()
assert Stringable("23/10/2026").toDate("%d/%m/%Y").day == 23
```

## Search, boundaries and offsets

<a id="stringable-method-after"></a>

**`after(search: str) -> Stringable`**

Return the portion after the first literal occurrence; a missing search leaves the value unchanged. An empty search returns the whole value. Search must be compatible with Python string search or `TypeError` is raised.

```python
from orionis.support.types import Stringable

assert Stringable("a/b/c").after("/") == "b/c"
assert Stringable("abc").after("x") == "abc"
assert Stringable("abc").after("") == "abc"
```

<a id="stringable-method-afterlast"></a>

**`afterLast(search: str) -> Stringable`**

Search from the right and return what follows the final occurrence; missing search preserves the value. An empty search matches the end and returns an empty `Stringable`.

```python
from orionis.support.types import Stringable

assert Stringable("a/b/c").afterLast("/") == "c"
assert Stringable("abc").afterLast("") == ""
```

<a id="stringable-method-before"></a>

**`before(search: str) -> Stringable`**

Return the portion before the first literal occurrence; missing search preserves the value and an empty search returns empty.

```python
from orionis.support.types import Stringable

assert Stringable("a/b/c").before("/") == "a"
assert Stringable("abc").before("x") == "abc"
assert Stringable("abc").before("") == ""
```

<a id="stringable-method-beforelast"></a>

**`beforeLast(search: str) -> Stringable`**

Return the portion before the final literal occurrence. Missing search preserves the value; an empty search matches the end, preserving the whole value.

```python
from orionis.support.types import Stringable

assert Stringable("a/b/c").beforeLast("/") == "a/b"
assert Stringable("abc").beforeLast("") == "abc"
```

<a id="stringable-method-between"></a>

**`between(from_str: str, to_str: str) -> Stringable`**

Find the first opening delimiter and the first closing delimiter after it. Return empty if either is absent; invalid delimiter types raise `TypeError`. It does not match nested delimiters.

```python
from orionis.support.types import Stringable

assert Stringable("[a][b]").between("[", "]") == "a"
assert Stringable("[a").between("[", "]") == ""
```

<a id="stringable-method-betweenfirst"></a>

**`betweenFirst(from_str: str, to_str: str) -> Stringable`**

Currently performs exactly the same first-pair extraction as `between`, including the empty result for missing delimiters and `TypeError` for non-string delimiters.

```python
from orionis.support.types import Stringable

assert Stringable("[a][b]").betweenFirst("[", "]") == "a"
```

<a id="stringable-method-contains"></a>

**`contains(needles: str | Iterable[str], *, ignore_case: bool=False) -> bool`**

Test whether any literal needle occurs. Accept a string or iterable; an empty iterable returns false. `ignore_case=True` uses `lower()`, not Unicode case folding. Invalid outer types raise `TypeError`; elements are not prevalidated, so invalid elements may raise `TypeError` or `AttributeError` when reached.

```python
from orionis.support.types import Stringable

assert Stringable("Hello world").contains(["absent", "WORLD"], ignore_case=True)
assert Stringable("hello").contains([]) is False
```

<a id="stringable-method-containsall"></a>

**`containsAll(needles: list[str], *, ignore_case: bool=False) -> bool`**

Require a nonempty `list[str]` and test every substring. Non-list or non-string items raise `TypeError`; an empty list raises `ValueError`. For two or more needles, `ignore_case` must be bool; the one-item shortcut delegates to `contains` and currently skips that validation.

```python
from orionis.support.types import Stringable

assert Stringable("Hello world").containsAll(["HELLO", "WORLD"], ignore_case=True)
assert not Stringable("hello").containsAll(["hello", "world"])
```

<a id="stringable-method-doesntcontain"></a>

**`doesntContain(needles: str | list[str], *, ignore_case: bool=False) -> bool`**

Negate an any-needle containment test. Unlike `contains`, require a string or list of strings and a bool `ignore_case`; invalid arguments raise `TypeError`. An empty list returns true.

```python
from orionis.support.types import Stringable

assert Stringable("Hello").doesntContain("WORLD", ignore_case=True)
assert not Stringable("Hello").doesntContain(["HELLO"], ignore_case=True)
```

<a id="stringable-method-startswith"></a>

**`startsWith(needles: str | list[str]) -> bool`**

Return true if any prefix matches, case sensitively. Require a string or list of strings (`TypeError` otherwise). Empty lists return false; an empty prefix matches every string.

```python
from orionis.support.types import Stringable

assert Stringable("hello.py").startsWith(["hi", "hello"])
assert not Stringable("hello").startsWith([])
```

<a id="stringable-method-endswith"></a>

**`endsWith(needles: str | Iterable[str]) -> bool`**

Return true if any suffix matches, case sensitively. Accept a string or iterable, so tuples and generators work. An invalid outer type raises `TypeError`; reached invalid elements fail through `str.endswith`. An empty iterable returns false.

```python
from orionis.support.types import Stringable

assert Stringable("hello.py").endsWith((".txt", ".py"))
assert not Stringable("hello").endsWith([])
```

<a id="stringable-method-doesntstartwith"></a>

**`doesntStartWith(needles: str | list[str]) -> bool`**

Negate the prefix-any test; require a string or list containing only strings (`TypeError` otherwise). An empty list returns true.

```python
from orionis.support.types import Stringable

assert Stringable("hello").doesntStartWith(["bye", "hi"])
```

<a id="stringable-method-doesntendwith"></a>

**`doesntEndWith(needles: str | list[str]) -> bool`**

Negate `endsWith` after stricter string-or-list and element validation (`TypeError` for invalid input). An empty list returns true.

```python
from orionis.support.types import Stringable

assert Stringable("hello.py").doesntEndWith([".txt", ".md"])
```

<a id="stringable-method-exactly"></a>

**`exactly(value: str) -> bool`**

Compare the entire value case sensitively; require a string, otherwise raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").exactly("hello")
assert not Stringable("hello").exactly("Hello")
```

<a id="stringable-method-position"></a>

**`position(needle: str, offset: int=0, encoding: str | None=None) -> int | bool`**

Return the first zero-based position at or after `offset`, or the singleton `False` when absent. Use `is False` to distinguish absence from index 0. Negative offsets follow `str.find`. `encoding` is type-checked but unused. Wrong needle, offset or encoding types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("ababa").position("a", 1, encoding="utf-8") == 2
assert Stringable("abc").position("x") is False
assert Stringable("abc").position("a") == 0
```

<a id="stringable-method-charat"></a>

**`charAt(index: int) -> str | bool`**

Return a plain one-character `str` at an integer index, including negative indexes; return `False` if out of bounds. Non-integer indexes raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").charAt(-1) == "o"
assert Stringable("hello").charAt(99) is False
```

<a id="stringable-method-offsetexists"></a>

**`offsetExists(offset: int) -> bool`**

Check whether an integer index can be accessed, including negative indexes. Invalid index types and out-of-range indexes return false. Booleans are accepted as integer indexes, following `isinstance(True, int)`.

```python
from orionis.support.types import Stringable

assert Stringable("hi").offsetExists(-1)
assert not Stringable("hi").offsetExists(2)
assert not Stringable("hi").offsetExists("0")
```

<a id="stringable-method-offsetget"></a>

**`offsetGet(offset: int) -> str`**

Return a plain `str` character for an integer offset. Negative offsets work; invalid types raise `TypeError` and out-of-range offsets raise `IndexError`. Use indexing when the result should remain `Stringable`.

```python
from orionis.support.types import Stringable

assert Stringable("hi").offsetGet(-1) == "i"
assert type(Stringable("hi").offsetGet(0)) is str
```

## Case, names and Unicode

<a id="stringable-method-lower"></a>

**`lower() -> Stringable`**

Apply Python Unicode lowercase conversion and return `Stringable`.

```python
from orionis.support.types import Stringable

assert Stringable("HÉLLO").lower() == "héllo"
```

<a id="stringable-method-upper"></a>

**`upper() -> Stringable`**

Apply Python Unicode uppercase conversion; a character may expand into multiple characters.

```python
from orionis.support.types import Stringable

assert Stringable("straße").upper() == "STRASSE"
```

<a id="stringable-method-swapcase"></a>

**`swapCase() -> Stringable`**

Invert the case of each cased character using Python Unicode rules.

```python
from orionis.support.types import Stringable

assert Stringable("Hello 1!").swapCase() == "hELLO 1!"
```

<a id="stringable-method-convertcase"></a>

**`convertCase(mode: int | None=None) -> Stringable`**

Use case folding for mode `None`, 0, or any unrecognized integer; 1 means uppercase, 2 lowercase, and 3 title case. A non-integer, non-None mode raises `TypeError`. Case folding can expand Unicode characters.

```python
from orionis.support.types import Stringable

assert Stringable("Straße").convertCase() == "strasse"
assert Stringable("hello world").convertCase(3) == "Hello World"
assert Stringable("ABC").convertCase(99) == "abc"
```

<a id="stringable-method-camel"></a>

**`camel() -> Stringable`**

Split underscores, hyphens and whitespace, lowercase the first word, then capitalize and join the rest. Existing camel-case boundaries are not split; each later word is lowercased after its first character.

```python
from orionis.support.types import Stringable

assert Stringable("HELLO_world-name").camel() == "helloWorldName"
assert Stringable("helloWorld").camel() == "helloworld"
```

<a id="stringable-method-kebab"></a>

**`kebab() -> Stringable`**

Insert a hyphen only at an ASCII lowercase/digit-to-uppercase boundary, replace underscores/whitespace, collapse hyphens, lowercase and strip edge hyphens. Acronyms are not split into words.

```python
from orionis.support.types import Stringable

assert Stringable("helloWorld_name").kebab() == "hello-world-name"
assert Stringable("HTTPServer").kebab() == "httpserver"
```

<a id="stringable-method-snake"></a>

**`snake(delimiter: str='_') -> Stringable`**

Like the ASCII boundary conversion in `kebab`, but use `delimiter` (default `_`) for camel boundaries, whitespace and hyphens. Edge trimming treats delimiter characters as a set. Existing separators are collapsed by a generated regex; multicharacter delimiters do not behave as a general token separator, and backslashes can be interpreted as replacement escapes. An empty delimiter raises `re.PatternError`; there is no dedicated argument validation, so other incompatible values propagate Python/regex errors.

```python
from orionis.support.types import Stringable

assert Stringable("helloWorld name").snake() == "hello_world_name"
assert Stringable("helloWorld").snake(".") == "hello.world"
```

<a id="stringable-method-studly"></a>

**`studly() -> Stringable`**

Split whitespace, underscores and hyphens, capitalize each word and join. This uses `capitalize`, so existing internal capitals become lowercase.

```python
from orionis.support.types import Stringable

assert Stringable("hello_world-name").studly() == "HelloWorldName"
assert Stringable("HTTPServer").studly() == "Httpserver"
```

<a id="stringable-method-pascal"></a>

**`pascal() -> Stringable`**

Alias implemented by calling `studly`; it has the same separators and capitalization behavior.

```python
from orionis.support.types import Stringable

assert Stringable("hello_world").pascal() == "HelloWorld"
```

<a id="stringable-method-slug"></a>

**`slug(separator: str='-', dictionary: dict[str, str] | None=None) -> Stringable`**

Apply dictionary replacements first (default `{"@": "at"}`; passing `{}` disables it), normalize through `ascii`, remove punctuation except hyphens, replace whitespace/underscores with `separator`, lowercase and trim separator characters. Non-string separators or non-dict dictionaries raise `TypeError`; dictionary entries follow `str.replace` validation. An existing hyphen is not converted when using another separator. An empty separator raises `re.PatternError`; backslashes in separators can also be interpreted as replacement escapes.

```python
from orionis.support.types import Stringable

assert Stringable("Café @ Home!").slug() == "cafe-at-home"
assert Stringable("A-B C").slug("_") == "a-b_c"
assert Stringable("a@b").slug(dictionary={}) == "ab"
```

<a id="stringable-method-title"></a>

**`title() -> Stringable`**

Use Python `str.title`, including its punctuation-based word boundaries; it is not the same algorithm as `headline` or `apa`.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").title() == "Hello World"
assert Stringable("they're").title() == "They'Re"
```

<a id="stringable-method-headline"></a>

**`headline() -> Stringable`**

Extract Unicode `\b\w+\b` tokens, capitalize each and join with single spaces. Punctuation is discarded, but underscores remain inside tokens and camel boundaries are not split.

```python
from orionis.support.types import Stringable

assert Stringable("hello, WORLD!").headline() == "Hello World"
assert Stringable("hello_world").headline() == "Hello_world"
```

<a id="stringable-method-apa"></a>

**`apa() -> Stringable`**

Split on whitespace and capitalize the first/last word, all words of length at least four, and other words outside the small English stopword set. Interior short stopwords remain lowercase. This is a simple rule, not a full publishing style engine.

```python
from orionis.support.types import Stringable

assert Stringable("a tale of ice and fire").apa() == "A Tale of Ice and Fire"
```

<a id="stringable-method-ucfirst"></a>

**`ucfirst() -> Stringable`**

Uppercase only the first Unicode code point and preserve the rest; empty input stays empty.

```python
from orionis.support.types import Stringable

assert Stringable("hELLO").ucfirst() == "HELLO"
assert Stringable("").ucfirst() == ""
```

<a id="stringable-method-lcfirst"></a>

**`lcfirst() -> Stringable`**

Lowercase only the first Unicode code point and preserve the rest; empty input stays empty.

```python
from orionis.support.types import Stringable

assert Stringable("HELLO").lcfirst() == "hELLO"
```

<a id="stringable-method-ascii"></a>

**`ascii() -> Stringable`**

Normalize with Unicode NFKD, then encode ASCII while ignoring non-ASCII characters. Diacritics can disappear; unsupported scripts and symbols are dropped rather than linguistically transliterated.

```python
from orionis.support.types import Stringable

assert Stringable("café 日本語").ascii() == "cafe "
```

<a id="stringable-method-transliterate"></a>

**`transliterate(unknown: str='?', *, strict: bool=False) -> Stringable`**

NFKD plus ASCII dropping by default, like `ascii`. With `strict=True`, replace each non-ASCII code point in the normalized form with `unknown`, including combining accents. Require a one-character string and bool strict flag (`TypeError` otherwise).

```python
from orionis.support.types import Stringable

assert Stringable("café 日本").transliterate() == "cafe "
assert Stringable("café 日本").transliterate("?", strict=True) == "cafe? ??"
```

## Composition, trimming and padding

<a id="stringable-method-append"></a>

**`append(*values: str) -> Stringable`**

Concatenate zero or more strings after the value in argument order. Non-string arguments raise `TypeError`; the original value is never modified.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert s.append(" ", "world") == "hello world"
assert s == "hello"
```

<a id="stringable-method-prepend"></a>

**`prepend(*values: str) -> Stringable`**

Concatenate zero or more strings before the value in argument order, rather than reversing the arguments. A non-string argument raises `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("world").prepend("hello", " ") == "hello world"
```

<a id="stringable-method-newline"></a>

**`newLine(count: int=1) -> Stringable`**

Append `count` line-feed (`\n`) characters, default one. It uses string multiplication directly: zero and negative counts add nothing; a non-integer count raises `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("x").newLine(2) == "x\n\n"
assert Stringable("x").newLine(-1) == "x"
```

<a id="stringable-method-repeat"></a>

**`repeat(times: int) -> Stringable`**

Return the value repeated a nonnegative integer number of times. A negative count or non-integer count raises `ValueError`; zero yields empty. Booleans pass the integer check.

```python
from orionis.support.types import Stringable

assert Stringable("ab").repeat(3) == "ababab"
assert Stringable("ab").repeat(0) == ""
```

<a id="stringable-method-reverse"></a>

**`reverse() -> Stringable`**

Reverse Unicode code points using a slice. Combining marks and multi-code-point emoji are reversed individually.

```python
from orionis.support.types import Stringable

assert Stringable("abc").reverse() == "cba"
assert Stringable("e\u0301").reverse() == "\u0301e"
```

<a id="stringable-method-trim"></a>

**`trim(characters: str | None=None) -> Stringable`**

Remove characters from both ends. `None` removes Python whitespace; an explicit string is a set of individual characters, not a complete prefix/suffix. Other argument types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("xyhelloyx").trim("xy") == "hello"
```

<a id="stringable-method-ltrim"></a>

**`ltrim(characters: str | None=None) -> Stringable`**

Remove characters from the left end. `None` removes Python whitespace; an explicit string is a set of individual characters, not a complete prefix/suffix. Other argument types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("  hello  ").ltrim() == "hello  "
```

<a id="stringable-method-rtrim"></a>

**`rtrim(characters: str | None=None) -> Stringable`**

Remove characters from the right end. `None` removes Python whitespace; an explicit string is a set of individual characters, not a complete prefix/suffix. Other argument types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("  hello  ").rtrim() == "  hello"
```

<a id="stringable-method-lstrip"></a>

**`lStrip(chars: str | None=None) -> Stringable`**

Remove characters from the left end. `None` removes Python whitespace; an explicit string is a set of individual characters, not a complete prefix/suffix. Other argument types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("xyhelloxy").lStrip("xy") == "helloxy"
```

<a id="stringable-method-rstrip"></a>

**`rStrip(chars: str | None=None) -> Stringable`**

Remove characters from the right end. `None` removes Python whitespace; an explicit string is a set of individual characters, not a complete prefix/suffix. Other argument types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("xyhelloxy").rStrip("xy") == "xyhello"
```

<a id="stringable-method-squish"></a>

**`squish() -> Stringable`**

Collapse every run of Unicode regex whitespace to one ASCII space, then strip whitespace at both ends.

```python
from orionis.support.types import Stringable

assert Stringable("  hello\t\n world  ").squish() == "hello world"
```

<a id="stringable-method-deduplicate"></a>

**`deduplicate(character: str=' ') -> Stringable`**

Collapse consecutive occurrences of one character (space by default). Non-string or multicharacter input raises `ValueError`. The replacement uses `re.sub`, so a backslash character can raise a replacement-template error.

```python
from orionis.support.types import Stringable

assert Stringable("a---b--c").deduplicate("-") == "a-b-c"
assert Stringable("a  b").deduplicate() == "a b"
```

<a id="stringable-method-start"></a>

**`start(prefix: str) -> Stringable`**

Add a literal prefix only if the value does not already start with it. Existing repeated prefixes remain as they are; invalid prefix types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("path").start("/") == "/path"
assert Stringable("//path").start("/") == "//path"
```

<a id="stringable-method-finish"></a>

**`finish(cap: str) -> Stringable`**

Add a literal ending only if the value does not already end with it. Existing repeated endings are not collapsed; invalid cap types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("path").finish("/") == "path/"
assert Stringable("path//").finish("/") == "path//"
```

<a id="stringable-method-chopstart"></a>

**`chopStart(needle: str | list[str]) -> Stringable`**

Remove the first matching prefix from a string or iterable of candidates, then stop. Candidate order matters and only one prefix is removed. Invalid outer input raises `TypeError`; invalid reached elements fail through `startswith`.

```python
from orionis.support.types import Stringable

assert Stringable("foobar").chopStart(["foo", "foobar"]) == "bar"
assert Stringable("hello").chopStart("x") == "hello"
```

<a id="stringable-method-chopend"></a>

**`chopEnd(needle: str | list[str]) -> Stringable`**

Remove the first matching suffix from the candidate string/iterable. Only one suffix is removed. An empty candidate currently empties the whole value because the implementation slices to `-0`; avoid it when trimming conditionally. Invalid input can raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("file.tar.gz").chopEnd([".gz", ".tar.gz"]) == "file.tar"
assert Stringable("hello").chopEnd("") == ""
```

<a id="stringable-method-wrap"></a>

**`wrap(before: str, after: str | None=None) -> Stringable`**

Surround the value with `before` and `after`; `after=None` reuses `before`. Wrong argument types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("name").wrap("[", "]") == "[name]"
assert Stringable("name").wrap("*") == "*name*"
```

<a id="stringable-method-unwrap"></a>

**`unwrap(before: str, after: str | None=None) -> Stringable`**

Remove one matching prefix and one matching suffix independently; it does not require a complete pair. `after=None` reuses `before`; wrong types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("[name]").unwrap("[", "]") == "name"
assert Stringable("[name").unwrap("[", "]") == "name"
```

<a id="stringable-method-padleft"></a>

**`padLeft(length: int, pad: str=' ') -> Stringable`**

Pad toward the left to a minimum total code-point length; repeat and truncate the pad string as necessary. Already long values stay unchanged. Require a nonnegative integer length and a nonempty string pad (`ValueError` otherwise). For `padBoth`, an odd extra character goes on the right.

```python
from orionis.support.types import Stringable

assert Stringable("x").padLeft(6, "ab") == "ababax"
```

<a id="stringable-method-padright"></a>

**`padRight(length: int, pad: str=' ') -> Stringable`**

Pad toward the right to a minimum total code-point length; repeat and truncate the pad string as necessary. Already long values stay unchanged. Require a nonnegative integer length and a nonempty string pad (`ValueError` otherwise). For `padBoth`, an odd extra character goes on the right.

```python
from orionis.support.types import Stringable

assert Stringable("x").padRight(6, "ab") == "xababa"
```

<a id="stringable-method-padboth"></a>

**`padBoth(length: int, pad: str=' ') -> Stringable`**

Pad toward the both sides to a minimum total code-point length; repeat and truncate the pad string as necessary. Already long values stay unchanged. Require a nonnegative integer length and a nonempty string pad (`ValueError` otherwise). For `padBoth`, an odd extra character goes on the right.

```python
from orionis.support.types import Stringable

assert Stringable("x").padBoth(6, "ab") == "abxaba"
```

<a id="stringable-method-zfill"></a>

**`zFill(width: int) -> Stringable`**

Pad with ASCII zeros to a minimum width, placing zeros after a leading sign. Require nonnegative integer width (`ValueError` otherwise); values already at least that wide remain unchanged.

```python
from orionis.support.types import Stringable

assert Stringable("-42").zFill(6) == "-00042"
```

## Slices, masking and excerpts

<a id="stringable-method-take"></a>

**`take(limit: int) -> Stringable`**

Take the first `limit` code points when nonnegative, or the last `abs(limit)` when negative. Zero gives empty; a non-integer raises `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("abcdef").take(3) == "abc"
assert Stringable("abcdef").take(-2) == "ef"
```

<a id="stringable-method-substr"></a>

**`substr(start: int, length: int | None=None) -> Stringable`**

Slice from `start`, optionally to `start + length`; this is Python slicing, including negative indexes, clipping and possibly empty results. A negative length is not a PHP-style trim from the end. Wrong start/length types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("abcdef").substr(2, 3) == "cde"
assert Stringable("abcdef").substr(-2) == "ef"
assert Stringable("abcdef").substr(2, -1) == ""
```

<a id="stringable-method-mask"></a>

**`mask(character: str, index: int, length: int | None=None) -> Stringable`**

Replace a range with repetitions of one character. Negative indexes count from the end and clamp at zero; omitted length masks through the end, while negative length leaves that many trailing characters visible. Require one mask character (`ValueError`) and integer index/optional length (`TypeError`). Indexes beyond the end preserve the value.

```python
from orionis.support.types import Stringable

assert Stringable("123456789").mask("*", 2, -2) == "12*****89"
assert Stringable("123456").mask("*", -3) == "123***"
```

<a id="stringable-method-limit"></a>

**`limit(limit: int=100, end: str='...', *, preserve_words: bool=False) -> Stringable`**

If longer than `limit`, take a code-point prefix and append `end`; the suffix is additional to the limit. `preserve_words=True` cuts back to the final ASCII space in the prefix when its position is positive; it may still split a long word with no space. Nonnegative integer limit is required (`ValueError`); end must be str and preserve_words bool (`TypeError`).

```python
from orionis.support.types import Stringable

assert Stringable("hello world").limit(8) == "hello wo..."
assert Stringable("hello world").limit(8, "!", preserve_words=True) == "hello!"
```

<a id="stringable-method-excerpt"></a>

**`excerpt(phrase: str='', options: dict | None=None) -> str | None`**

Return plain `str` around the first case-insensitive literal phrase or `None` if absent. Options default to `radius=100` code points on each side and `omission="..."`; an empty phrase takes the first `2 * radius` characters. Invalid phrase/options types raise `TypeError`; option values are not validated and may fail during arithmetic/slicing.

```python
from orionis.support.types import Stringable

assert Stringable("01234HELLO56789").excerpt("hello", {"radius": 2, "omission": "~"}) == "~34HELLO56~"
assert Stringable("hello").excerpt("missing") is None
assert Stringable("abcdef").excerpt(options={"radius": 2}) == "abcd..."
```

<a id="stringable-method-words"></a>

**`words(words: int=100, end: str='...') -> Stringable`**

Limit whitespace-separated words, default 100, appending `end` only when truncated. A truncated value is joined with single spaces; a value within the limit retains its original whitespace. Zero produces just the ending for nonempty word content. Invalid word count raises `ValueError`; non-string ending raises `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("one  two three").words(2, "!") == "one two!"
assert Stringable("one  two").words(2) == "one  two"
```

<a id="stringable-method-wordcount"></a>

**`wordCount(characters: str | None=None) -> int`**

Count whitespace-separated words after stripping. If `characters` is truthy, treat each of its characters as an additional separator, not as a character whitelist. Invalid argument types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("one,two;three").wordCount(",;") == 3
assert Stringable("   ").wordCount() == 0
```

<a id="stringable-method-wordwrap"></a>

**`wordWrap(characters: int=75, break_str: str='\n', *, cut_long_words: bool=False) -> Stringable`**

Use `textwrap.fill` at width `characters` (75 by default), then replace its line feeds with `break_str`. Long words are preserved unless `cut_long_words=True`; hyphen breaks remain enabled in both modes and whitespace can be normalized. Invalid widths or arguments propagate Python errors such as `ValueError` for width zero.

```python
from orionis.support.types import Stringable

assert Stringable("one two three").wordWrap(7, "|") == "one two|three"
assert Stringable("abcdef").wordWrap(3, "|", cut_long_words=True) == "abc|def"
```

## Replacement and removal

<a id="stringable-method-replace"></a>

**`replace(search: str | Iterable[str], replace: str | Iterable[str], *, case_sensitive: bool=True) -> Stringable`**

Replace search/replacement pairs sequentially, so later replacements see earlier results. Strings become one-item lists; iterables must have equal lengths because `zip(..., strict=True)` raises `ValueError` on mismatch. It does not broadcast one replacement across many searches. Invalid outer types raise `TypeError`. `case_sensitive=False` escapes the search and uses `re.IGNORECASE`; replacement backslashes still have regex-template meaning. There is no Python `str.replace(..., count)` argument.

```python
from orionis.support.types import Stringable

assert Stringable("ab").replace(["a", "b"], ["b", "c"]) == "cc"
assert Stringable("Hello HELLO").replace("hello", "hi", case_sensitive=False) == "hi hi"
```

<a id="stringable-method-replacearray"></a>

**`replaceArray(search: str, replace: list[str]) -> Stringable`**

For each replacement, replace the first occurrence remaining in the current result. A shortage leaves later occurrences unchanged; surplus replacements are unused. Replacement text can itself introduce a match for the next step. Require a list containing only strings (`TypeError` otherwise); search errors follow Python string operations.

```python
from orionis.support.types import Stringable

assert Stringable("? + ? = ?").replaceArray("?", ["1", "2"]) == "1 + 2 = ?"
```

<a id="stringable-method-replacefirst"></a>

**`replaceFirst(search: str, replace: str) -> Stringable`**

Replace one first literal occurrence, leaving the value unchanged if absent. Both arguments must be strings (`TypeError` otherwise); empty search inserts at the start.

```python
from orionis.support.types import Stringable

assert Stringable("a-a-a").replaceFirst("a", "x") == "x-a-a"
```

<a id="stringable-method-replacelast"></a>

**`replaceLast(search: str, replace: str) -> Stringable`**

Replace only the last literal occurrence; a missing search preserves the value. String arguments are required (`TypeError` otherwise); empty search inserts at the end.

```python
from orionis.support.types import Stringable

assert Stringable("a-a-a").replaceLast("a", "x") == "a-a-x"
```

<a id="stringable-method-replacestart"></a>

**`replaceStart(search: str, replace: str) -> Stringable`**

Replace the literal search only when it is a prefix. Both arguments must be strings (`TypeError` otherwise). Empty search prepends the replacement.

```python
from orionis.support.types import Stringable

assert Stringable("pre-name-pre").replaceStart("pre", "new") == "new-name-pre"
```

<a id="stringable-method-replaceend"></a>

**`replaceEnd(search: str, replace: str) -> Stringable`**

Replace the literal search only when it is a suffix. Both arguments must be strings (`TypeError` otherwise). An empty search currently replaces the entire value, because the prefix slice ends at `-0`.

```python
from orionis.support.types import Stringable

assert Stringable("pre-name-pre").replaceEnd("pre", "new") == "pre-name-new"
assert Stringable("abc").replaceEnd("", "X") == "X"
```

<a id="stringable-method-replacematches"></a>

**`replaceMatches(pattern: str | list[str], replace: str | Callable, limit: int=-1) -> Stringable`**

Apply one Python regex or a list sequentially. A string replacement supports backreferences; a callback receives a `re.Match` and must return `str`. `limit=-1` and 0 replace all, positive limits apply per pattern, and other negative values currently replace none. Wrong pattern/replacement/limit types raise `TypeError`; invalid regex or replacement templates propagate `re` errors.

```python
from orionis.support.types import Stringable

assert Stringable("a1 b22").replaceMatches(r"\d+", lambda m: str(int(m.group()) * 2)) == "a2 b44"
assert Stringable("a1 b2").replaceMatches(r"\d", "X", 1) == "aX b2"
```

<a id="stringable-method-remove"></a>

**`remove(search: str | list[str], *, case_sensitive: bool=True) -> Stringable`**

Remove literal searches in sequence. A string or list of strings is required (`TypeError` otherwise). `case_sensitive=False` uses escaped searches with `re.IGNORECASE`; the flag itself is tested for truthiness rather than validated as bool.

```python
from orionis.support.types import Stringable

assert Stringable("Hello WORLD").remove(["hello", "world"], case_sensitive=False) == " "
```

<a id="stringable-method-swap"></a>

**`swap(map_dict: dict[str, str]) -> Stringable`**

Apply a dictionary of literal replacements in insertion order. Replacements cascade; this is not a simultaneous character translation. Non-dict inputs or non-string keys/values raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("ab").swap({"a": "b", "b": "c"}) == "cc"
```

<a id="stringable-method-substrcount"></a>

**`substrCount(needle: str, offset: int=0, length: int | None=None) -> int`**

Count non-overlapping literal occurrences in `self[offset:]` or `self[offset:offset + length]`. Python slicing defines negative offsets/lengths and clipping; an empty needle counts boundaries. Wrong needle/offset/length types raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("aaaaa").substrCount("aa") == 2
assert Stringable("ab-ab-ab").substrCount("ab", 3, 5) == 2
```

<a id="stringable-method-substrreplace"></a>

**`substrReplace(replace: str | list[str], offset: int | list[int]=0, length: int | list[int] | None=None) -> Stringable`**

Apply replacements one at a time against the evolving result. Scalars become lists; a shorter offset list repeats its last offset. Omitted `length` inserts rather than replacing through the end; a shorter length list also makes remaining operations insert. Negative offsets count from the current end. Empty lists, negative lengths, list lengths exceeding the replacement count, and out-of-bounds offsets raise `ValueError`; wrong types/elements raise `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("abcdef").substrReplace("X", 2, 3) == "abXf"
assert Stringable("abc").substrReplace("X", 1) == "aXbc"
assert Stringable("abcd").substrReplace(["X", "Y"], [1, -1], [1, 1]) == "aXcY"
```

## Regular expressions, splitting and parsing

<a id="stringable-method-match"></a>

**`match(pattern: str) -> Stringable`**

Use `re.search` and return the entire first match, not the first capture group. Return empty `Stringable` on no match. Require a string pattern (`TypeError`); invalid syntax raises `re.PatternError`. Use inline flags such as `(?i)` when needed.

```python
from orionis.support.types import Stringable

assert Stringable("item=42").match(r"item=(\d+)") == "item=42"
assert Stringable("abc").match(r"\d+") == ""
```

<a id="stringable-method-matchall"></a>

**`matchAll(pattern: str) -> list[str]`**

Return `re.findall` results: full matches without groups, strings with one capture group, tuples with several groups. Consequently the annotated `list[str]` is not the only actual shape. No matches return `[]`; non-string patterns raise `TypeError` and invalid patterns raise `re.PatternError`.

```python
from orionis.support.types import Stringable

assert Stringable("a1 b2").matchAll(r"([a-z])(\d)") == [("a", "1"), ("b", "2")]
assert Stringable("a1 b2").matchAll(r"\d") == ["1", "2"]
```

<a id="stringable-method-ismatch"></a>

**`isMatch(pattern: str | list[str]) -> bool`**

Return whether any regex matches anywhere. Accept a string or iterable of strings and validate each element, then search each pattern. Invalid types raise `TypeError`; invalid patterns raise `re.PatternError`. Empty iterables return false. A one-shot generator is consumed during validation and currently yields false in the subsequent search.

```python
from orionis.support.types import Stringable

assert Stringable("item42").isMatch([r"^other", r"\d+$"])
assert not Stringable("item42").isMatch([])
```

<a id="stringable-method-test"></a>

**`test(pattern: str) -> bool`**

Call `re.search` directly and return bool. Although annotated as a string, a compiled regex also works at runtime. Invalid inputs and regex syntax propagate Python `TypeError` or `re.PatternError`.

```python
from orionis.support.types import Stringable

assert Stringable("Hello").test(r"(?i)^hello$")
assert not Stringable("hello").test(r"^world$")
```

<a id="stringable-method-ispattern"></a>

**`isPattern(pattern: str | list[str], *, ignore_case: bool=False) -> bool`**

Match the whole value against shell-style `fnmatch` patterns (`*`, `?`, `[abc]`), not regex. A list means any pattern; require a string or a nonempty list of strings and bool ignore_case (`TypeError`, or `ValueError` for an empty list). On Windows, `fnmatch.fnmatch` normalizes case even when `ignore_case=False`; `ignore_case=True` explicitly lowercases on every platform.

```python
from orionis.support.types import Stringable

assert Stringable("Report.PDF").isPattern("report.*", ignore_case=True)
assert Stringable("file3.txt").isPattern(["*.csv", "file[0-9].txt"])
```

<a id="stringable-method-explode"></a>

**`explode(delimiter: str, limit: int=-1) -> list[str]`**

Split on a literal nonempty delimiter into plain strings. `limit=-1` is unlimited; a positive limit is a maximum number of pieces. `limit=0` currently also splits without limit because it passes `-1` to `str.split`. Wrong delimiter types raise `TypeError`; invalid limits and empty delimiters raise `ValueError`.

```python
from orionis.support.types import Stringable

assert Stringable("a,b,c").explode(",", 2) == ["a", "b,c"]
assert Stringable("a,b,c").explode(",", 0) == ["a", "b", "c"]
```

<a id="stringable-method-split"></a>

**`split(pattern: str | int, limit: int=-1, flags: int=0) -> list[str]`**

An integer pattern creates fixed-size chunks (ignoring limit/flags for chunking); zero raises `ValueError` and a negative size produces `[]`. A string pattern invokes `re.split`; `limit=-1` or 0 means unlimited, while positive limit counts splits, not result pieces. Capture groups appear in the result. `flags` accepts integer regex flags. Wrong types propagate `TypeError`, limits below -1 raise `ValueError`, and bad regex raises `re.PatternError`. There is no no-argument whitespace overload.

```python
from orionis.support.types import Stringable

import re
assert Stringable("abcdefg").split(3) == ["abc", "def", "g"]
assert Stringable("aXbxc").split("x", 1, re.IGNORECASE) == ["a", "bxc"]
assert Stringable("a1b2").split(r"(\d)") == ["a", "1", "b", "2", ""]
```

<a id="stringable-method-ucsplit"></a>

**`ucsplit() -> list[str]`**

Extract ASCII uppercase-led words, lowercase runs, or digit runs using `[A-Z][a-z]*|[a-z]+|\d+`. Acronyms split into individual uppercase characters; unmatched punctuation/non-Latin text disappears when there are matches. If no tokens match, return `[str(self)]`.

```python
from orionis.support.types import Stringable

assert Stringable("HTTPServer42").ucsplit() == ["H", "T", "T", "P", "Server", "42"]
assert Stringable("日本").ucsplit() == ["日本"]
```

<a id="stringable-method-numbers"></a>

**`numbers() -> Stringable`**

Remove regex `\D` characters, keeping Unicode decimal digits (`\d`), not just ASCII digits. Signs and decimal punctuation are removed.

```python
from orionis.support.types import Stringable

assert Stringable("-12.3 and ٤").numbers() == "123٤"
```

<a id="stringable-method-scan"></a>

**`scan(format_str: str) -> list[str]`**

Translate `%s` to a non-whitespace capture, `%d` to digits and `%f` to digit/dot characters, then run `re.findall` and take only the first match. Values remain strings, literal regex characters in the format are not escaped, and `%f` does not validate numeric syntax. With one capture, converting the matching string to list splits it into characters. Wrong format type raises `TypeError`; invalid generated regex propagates `re.PatternError`.

```python
from orionis.support.types import Stringable

assert Stringable("name=Ada age=37").scan("name=%s age=%d") == ["Ada", "37"]
assert Stringable("123").scan("%d") == ["1", "2", "3"]
```

<a id="stringable-method-parsecallback"></a>

**`parseCallback(default: str | None=None) -> list[str | None]`**

Split once on `@` and return `[class_or_name, method]` as strings. Without `@`, return `[value, default]`; no import, resolution or invocation occurs. A non-string, non-None default raises `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("UserController@show").parseCallback() == ["UserController", "show"]
assert Stringable("Handler").parseCallback("run") == ["Handler", "run"]
```

## Predicates and format checks

<a id="stringable-method-isempty"></a>

**`isEmpty() -> bool`**

Return true only for zero code points. Whitespace-only text is not empty; trim first if that is the application rule.

```python
from orionis.support.types import Stringable

assert Stringable("").isEmpty()
assert not Stringable(" ").isEmpty()
```

<a id="stringable-method-isnotempty"></a>

**`isNotEmpty() -> bool`**

Return the inherited string truth value: true for any content, including whitespace and `"0"`.

```python
from orionis.support.types import Stringable

assert Stringable("0").isNotEmpty()
assert not Stringable("").isNotEmpty()
```

<a id="stringable-method-isalnum"></a>

**`isAlnum() -> bool`**

Use Unicode `str.isalnum`: require at least one character and every character alphabetic or numeric. Spaces/punctuation make it false.

```python
from orionis.support.types import Stringable

assert Stringable("café42").isAlnum()
assert not Stringable("café 42").isAlnum()
```

<a id="stringable-method-isalpha"></a>

**`isAlpha() -> bool`**

Use Unicode `str.isalpha`: all characters must be alphabetic and the value nonempty. A decomposed combining mark is not itself alphabetic.

```python
from orionis.support.types import Stringable

assert Stringable("café").isAlpha()
assert not Stringable("cafe\u0301").isAlpha()
```

<a id="stringable-method-isdecimal"></a>

**`isDecimal() -> bool`**

Use Unicode `str.isdecimal`: require one or more decimal digits (Unicode Nd). Signs, decimal points and superscript two do not qualify.

```python
from orionis.support.types import Stringable

assert Stringable("٤٢").isDecimal()
assert not Stringable("²").isDecimal()
```

<a id="stringable-method-isdigit"></a>

**`isDigit() -> bool`**

Use Unicode `str.isdigit`, which includes decimal digits plus characters such as superscript two; require nonempty text.

```python
from orionis.support.types import Stringable

assert Stringable("²").isDigit()
assert not Stringable("-2").isDigit()
```

<a id="stringable-method-isnumeric"></a>

**`isNumeric() -> bool`**

Use Unicode `str.isnumeric`, broader than decimal/digit checks: numeric fractions and Roman numeral characters qualify. It does not parse signed or decimal numeric literals.

```python
from orionis.support.types import Stringable

assert Stringable("Ⅷ½").isNumeric()
assert not Stringable("3.14").isNumeric()
```

<a id="stringable-method-isidentifier"></a>

**`isIdentifier() -> bool`**

Use Python lexical identifier rules. This does not reject language keywords; use `keyword.iskeyword` separately if defining Python names.

```python
from orionis.support.types import Stringable

assert Stringable("user_name").isIdentifier()
assert Stringable("class").isIdentifier()
assert not Stringable("2users").isIdentifier()
```

<a id="stringable-method-islower"></a>

**`isLower() -> bool`**

Require at least one cased character, with every cased character lowercase. Digits, spaces and punctuation are ignored for case.

```python
from orionis.support.types import Stringable

assert Stringable("hello 123!").isLower()
assert not Stringable("123").isLower()
```

<a id="stringable-method-isupper"></a>

**`isUpper() -> bool`**

Require at least one cased character, with every cased character uppercase; uncased characters do not affect the check.

```python
from orionis.support.types import Stringable

assert Stringable("HELLO 123!").isUpper()
assert not Stringable("").isUpper()
```

<a id="stringable-method-istitle"></a>

**`isTitle() -> bool`**

Use Python Unicode title-case rules: each sequence of cased letters begins uppercase/titlecase and continues lowercase; at least one cased character is required.

```python
from orionis.support.types import Stringable

assert Stringable("Hello World").isTitle()
assert not Stringable("HELLO World").isTitle()
```

<a id="stringable-method-isprintable"></a>

**`isPrintable() -> bool`**

Use Python `str.isprintable`. Control characters and most separator categories fail; ASCII space passes. Empty text also returns true.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").isPrintable()
assert Stringable("").isPrintable()
assert not Stringable("hello\n").isPrintable()
```

<a id="stringable-method-isspace"></a>

**`isSpace() -> bool`**

Require nonempty text made entirely of Unicode whitespace, as defined by Python `str.isspace`.

```python
from orionis.support.types import Stringable

assert Stringable(" \t\n").isSpace()
assert not Stringable("").isSpace()
```

<a id="stringable-method-isascii"></a>

**`isAscii() -> bool`**

Return whether ASCII encoding succeeds, including empty text and ASCII control characters. This is independent of printability.

```python
from orionis.support.types import Stringable

assert Stringable("\n").isAscii()
assert not Stringable("é").isAscii()
```

<a id="stringable-method-isjson"></a>

**`isJson() -> bool`**

Return whether Python `json.loads` succeeds; any JSON value shape can pass, including scalar strings, numbers and null. This follows Python parser extensions such as NaN rather than a strict external-schema check.

```python
from orionis.support.types import Stringable

assert Stringable("null").isJson()
assert Stringable("42").isJson()
assert not Stringable("{bad}").isJson()
```

<a id="stringable-method-isurl"></a>

**`isUrl(protocols: list[str] | None=None) -> bool`**

Parse with `urllib.parse.urlparse` and require a nonempty scheme/netloc plus membership in `protocols` (default `["http", "https"]`). This does not verify reachability, host validity or every URL component. A non-list protocols value raises `TypeError`; parsing failures return false. An empty list permits no protocols.

```python
from orionis.support.types import Stringable

assert Stringable("https://example.com/path").isUrl()
assert Stringable("ftp://example.com/file").isUrl(["ftp"])
assert not Stringable("/relative/path").isUrl()
```

<a id="stringable-method-isuuid"></a>

**`isUuid(version: int | str | None=None) -> bool`**

Parse with `uuid.UUID`; without version, accept any parseable representation, including forms without hyphens. An integer version compares the parsed version directly (no explicit 1–8 range validation); `"max"` checks version <= 8 and returns false when no comparable version is available. Invalid version types raise `TypeError`; parse failures return false. This validates existing text, without generating a UUID.

```python
from orionis.support.types import Stringable

s = Stringable("550e8400-e29b-41d4-a716-446655440000")
assert s.isUuid() and s.isUuid(4) and s.isUuid("max")
assert not s.isUuid(1)
assert not Stringable("bad").isUuid()
```

<a id="stringable-method-isulid"></a>

**`isUlid() -> bool`**

Uppercase then check exactly 26 characters from the Crockford alphabet `0123456789ABCDEFGHJKMNPQRSTVWXYZ`. It accepts lowercase input and does not validate the leading-bit overflow or timestamp range of a canonical ULID. It does not generate identifiers.

```python
from orionis.support.types import Stringable

assert Stringable("01arz3ndektsv4rrffq69g5fav").isUlid()
assert Stringable("Z" * 26).isUlid()
assert not Stringable("I" * 26).isUlid()
```

## Paths, inflection and counts

<a id="stringable-method-basename"></a>

**`basename(suffix: str='') -> Stringable`**

Use the host platform’s `pathlib.Path.name`, then remove a literal trailing `suffix` if present. This does not access the filesystem. Windows and POSIX path rules differ; incompatible suffix types propagate `TypeError`.

```python
from orionis.support.types import Stringable

assert Stringable("folder/report.txt").basename() == "report.txt"
assert Stringable("folder/report.txt").basename(".txt") == "report"
```

<a id="stringable-method-dirname"></a>

**`dirname(levels: int=1) -> Stringable`**

Apply `Path.parent` `levels` times, default one, using host-platform syntax without filesystem I/O. Zero or negative levels leave the normalized Path text; non-integers fail in `range`. Root parents remain root.

```python
from orionis.support.types import Stringable

from pathlib import Path
assert Stringable("folder/sub/report.txt").dirname(2) == str(Path("folder"))
```

<a id="stringable-method-plural"></a>

**`plural(count: int | list | Any=2, *, prepend_count: bool=False) -> Stringable`**

Use a small English suffix algorithm, default count 2. Count can be int, float, or an object with `__len__`; only a count equal to 1 leaves the word unchanged. Other words gain `es` after s/sh/ch/x/z, consonant-y becomes ies, f/fe becomes ves, otherwise add s. `prepend_count=True` prefixes the effective count. Invalid count types or a non-bool prepend_count raise `TypeError`. Irregular nouns and linguistic exceptions are not implemented.

```python
from orionis.support.types import Stringable

assert Stringable("city").plural() == "cities"
assert Stringable("cat").plural([1], prepend_count=True) == "1 cat"
assert Stringable("person").plural(2) == "persons"
```

<a id="stringable-method-pluralstudly"></a>

**`pluralStudly(count: int | list | Any=2) -> Stringable`**

Extract ASCII letter words with `[A-Z][a-z]*|[a-z]+`, pluralize and capitalize only the last token, then join. Digits and separators are discarded when tokens exist; acronyms split into letters. With no letter tokens, fall back to `plural(count).studly()`.

```python
from orionis.support.types import Stringable

assert Stringable("UserCategory").pluralStudly() == "UserCategories"
assert Stringable("User2Category").pluralStudly(1) == "UserCategory"
```

<a id="stringable-method-pluralpascal"></a>

**`pluralPascal(count: int | list | Any=2) -> Stringable`**

Extract the same ASCII letter tokens and pluralize the last when needed; empty or tokenless input is returned unchanged. Lists/tuples use their length to decide plurality; other count values are compared directly with 1 before delegation. Digits/separators are discarded when tokens exist, so this differs from `pluralStudly` on tokenless inputs.

```python
from orionis.support.types import Stringable

assert Stringable("UserCategory").pluralPascal(2) == "UserCategories"
assert Stringable("123").pluralPascal() == "123"
```

<a id="stringable-method-singular"></a>

**`singular() -> Stringable`**

Apply simple suffix reversal: ies→y, ives→fe, ves→f, es→nothing, then terminal s→nothing except ss. It is not a general inverse of plural and may produce unexpected English words, such as `houses`→`hous` and `knives`→`knfe`.

```python
from orionis.support.types import Stringable

assert Stringable("cities").singular() == "city"
assert Stringable("knives").singular() == "knfe"
assert Stringable("houses").singular() == "hous"
```

## Encoding, HTML, hashing and encryption

<a id="stringable-method-tobase64"></a>

**`toBase64() -> Stringable`**

Encode UTF-8 bytes as standard Base64 and return `Stringable`. This is encoding, not encryption; invalid Unicode surrogate encoding can raise `UnicodeEncodeError`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").toBase64() == "aGVsbG8="
assert Stringable("café").toBase64().fromBase64() == "café"
```

<a id="stringable-method-frombase64"></a>

**`fromBase64(*, strict: bool=False) -> Stringable`**

Decode standard Base64 bytes as UTF-8. On any decoding exception return empty by default, or raise `RuntimeError` with the cause when `strict=True`; a non-bool strict flag raises `TypeError`. Strict controls error propagation, not alphabet validation: the implementation does not pass `validate=True` to the decoder and can ignore non-alphabet characters.

```python
from orionis.support.types import Stringable

assert Stringable("aGVsbG8=").fromBase64() == "hello"
assert Stringable("aGVsbG8=!!").fromBase64(strict=True) == "hello"
assert Stringable("!").fromBase64() == ""
```

<a id="stringable-method-md5"></a>

**`md5() -> str`**

Hash the UTF-8 bytes and return a plain 32-character hexadecimal `str`. These methods do not return `Stringable`; choose `hash` for a chainable digest.

```python
from orionis.support.types import Stringable

assert Stringable("hello").md5() == "5d41402abc4b2a76b9719d911017c592"
assert type(Stringable("hello").md5()) is str
```

<a id="stringable-method-sha1"></a>

**`sha1() -> str`**

Hash the UTF-8 bytes and return a plain 40-character hexadecimal `str`. These methods do not return `Stringable`; choose `hash` for a chainable digest.

```python
from orionis.support.types import Stringable

assert Stringable("hello").sha1() == "aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d"
assert type(Stringable("hello").sha1()) is str
```

<a id="stringable-method-sha256"></a>

**`sha256() -> str`**

Hash the UTF-8 bytes and return a plain 64-character hexadecimal `str`. These methods do not return `Stringable`; choose `hash` for a chainable digest.

```python
from orionis.support.types import Stringable

assert Stringable("hello").sha256() == "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
assert type(Stringable("hello").sha256()) is str
```

<a id="stringable-method-hash"></a>

**`hash(algorithm: str) -> Stringable`**

Require a name present in `hashlib.algorithms_available`, hash UTF-8 bytes and return the hexadecimal digest as `Stringable`. Unknown algorithms raise `ValueError`; availability depends on the Python/OpenSSL build. Variable-length SHAKE algorithms require a digest length, which this method does not accept, so they currently raise `TypeError` at `hexdigest()`.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert s.hash("sha256") == s.sha256()
assert isinstance(s.hash("sha256"), Stringable)
```

<a id="stringable-method-striptags"></a>

**`stripTags(allowed_tags: str | None=None) -> Stringable`**

With no truthy `allowed_tags`, remove substrings matching `<[^>]*>` and leave entities unchanged. Any truthy allowed_tags value instead performs only `html.unescape`, retaining every tag; there is no selective allowlist. This regex operation is not an HTML parser or sanitizer.

```python
from orionis.support.types import Stringable

assert Stringable("<b>x</b>&amp;").stripTags() == "x&amp;"
assert Stringable("<i>x</i>&amp;").stripTags("<b>") == "<i>x</i>&"
```

<a id="stringable-method-tohtmlstring"></a>

**`toHtmlString() -> Stringable`**

Return `html.escape` output as `Stringable`, escaping ampersands, angle brackets, both quote forms, and already encoded ampersands again. It does not mark text as trusted or bypass template escaping.

```python
from orionis.support.types import Stringable

assert Stringable('<b>"&"</b>').toHtmlString() == "&lt;b&gt;&quot;&amp;&quot;&lt;/b&gt;"
```

<a id="stringable-method-encrypt"></a>

**`encrypt() -> Stringable`**

Delegate the string value to the public `Crypt` facade (`from orionis.support.facades import Crypt`) without wrapping its result. In a bootstrapped application with `app.key` and `app.cipher` configured, await this call while Crypt uses its default unpinned mode. The standard Encrypter returns a plain `str`, despite the Stringable annotation, and uses a random IV, so ciphertext varies. If Crypt is pinned, its service result is returned synchronously instead. Missing application boot on resolution raises `RuntimeError`; the service rejects empty plaintext with `ValueError`.

The controller receives plaintext from its caller and returns its encrypted value in a JSON response:

```python
from orionis.http import JSONResponse
from orionis.support.types import Stringable


class SecretController:
    async def encrypt(self, plaintext: str) -> JSONResponse:
        ciphertext = await Stringable(plaintext).encrypt()
        return JSONResponse({"ciphertext": ciphertext})
```

For input `"hello"`, the response contains a ciphertext string that the same configured encrypter can decrypt to `"hello"`; its bytes are not fixed between calls.

<a id="stringable-method-decrypt"></a>

**`decrypt() -> Stringable`**

Delegate the value to `Crypt.decrypt`. In a bootstrapped application with the matching encryption configuration, await its default unpinned dispatcher; a pinned facade instead returns its service result directly. Standard Encrypter plaintext is plain `str`, despite the Stringable annotation. Invalid/empty payloads raise service `ValueError`; authentication or decryption failures can propagate `RuntimeError`. Construct a Stringable explicitly to continue fluent transformations.

This service receives ciphertext produced by the same application and returns its plaintext as a Stringable:

```python
from orionis.support.types import Stringable


class SecretService:
    async def restore(self, ciphertext: str) -> Stringable:
        plaintext = await Stringable(ciphertext).decrypt()
        return Stringable(plaintext)
```

Restoring ciphertext for `"hello"` returns `Stringable("hello")`; the caller can then use methods such as `.upper()`, producing `"HELLO"`.

## Callbacks and conditional chains

All conditional convenience methods use `when(condition, callback, default=None)`. Their callbacks receive the current `Stringable`, and their selected results are converted according to `when`. Return the desired value from a transformation callback; use `tap` for observation without replacing the value.

<a id="stringable-method-pipe"></a>

**`pipe(callback: Callable) -> Stringable`**

Call `callback(self)` once and use its result. Preserve a returned Stringable; otherwise construct `Stringable(result)`, so numbers stringify and `None` becomes `"None"`. It always returns a Stringable rather than an arbitrary callback result. A non-callable raises `TypeError`; callback exceptions propagate. Async callbacks are not awaited.

```python
from orionis.support.types import Stringable

assert Stringable("hello").pipe(lambda s: len(s)) == "5"
assert Stringable("hello").pipe(lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-tap"></a>

**`tap(callback: Callable[[Stringable], Any]) -> Stringable`**

Call `callback(self)` for a side effect, ignore its return and return the same instance (`is`). Stringable itself remains immutable. A non-callable fails with `TypeError` when called; callback exceptions propagate and async callbacks are not awaited.

```python
from orionis.support.types import Stringable

seen = []
s = Stringable("hello")
assert s.tap(lambda value: seen.append(str(value))) is s
assert seen == ["hello"]
assert s.tap(lambda value: value.upper()) == "hello"
```

<a id="stringable-method-when"></a>

**`when(condition: bool | Callable, callback: Callable, default: Callable | None=None) -> Stringable`**

Accept a bool or synchronous predicate `condition(self)`; evaluate a callable predicate once and test its result by truthiness. Execute `callback(self)` if true, otherwise `default(self)` when provided. Wrap a non-Stringable branch result with `Stringable`, including `None`→`"None"`. With no selected branch, return the same instance. Invalid condition/callback/default types raise `TypeError`; callback exceptions propagate. Predicates and callbacks are not awaited.

```python
from orionis.support.types import Stringable

s = Stringable("hello")
assert s.when(lambda value: len(value) > 3, lambda value: value.upper()) == "HELLO"
assert s.when(False, lambda value: "yes", lambda value: "no") == "no"
assert s.when(False, lambda value: value.upper()) is s
assert s.when(True, lambda value: None) == "None"
```

<a id="stringable-method-whencontains"></a>

**`whenContains(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Use the case-sensitive `contains(needles)` any-match condition; inherit its iterable support and errors. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").whenContains("world", lambda s: s.upper()) == "HELLO WORLD"
```

<a id="stringable-method-whencontainsall"></a>

**`whenContainsAll(needles: list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Test `all(needle in str(self) for needle in needles)` directly. Unlike `containsAll`, an empty iterable selects the callback and a string is iterated character by character; it does not perform the stricter list validation. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").whenContainsAll(["hello", "world"], lambda s: s.upper()) == "HELLO WORLD"
assert Stringable("hello").whenContainsAll([], lambda s: "selected") == "selected"
```

<a id="stringable-method-whenempty"></a>

**`whenEmpty(callback: Callable, default: Callable | None=None) -> Stringable`**

Select the callback only for the empty string, using `isEmpty`; whitespace selects the default or leaves the original. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("").whenEmpty(lambda s: "fallback") == "fallback"
```

<a id="stringable-method-whennotempty"></a>

**`whenNotEmpty(callback: Callable, default: Callable | None=None) -> Stringable`**

Select the callback whenever `isNotEmpty()` is true, including whitespace-only text. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenNotEmpty(lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whenendswith"></a>

**`whenEndsWith(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Use the case-sensitive any-suffix `endsWith` condition, including its iterable support and errors. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("file.py").whenEndsWith(".py", lambda s: s.upper()) == "FILE.PY"
```

<a id="stringable-method-whendoesntendwith"></a>

**`whenDoesntEndWith(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Negate `endsWith`; this delegates to its broader iterable API, rather than to the stricter `doesntEndWith` validator. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("file.txt").whenDoesntEndWith(".py", lambda s: s.upper()) == "FILE.TXT"
```

<a id="stringable-method-whenexactly"></a>

**`whenExactly(value: str, callback: Callable, default: Callable | None=None) -> Stringable`**

Use `exactly(value)`, requiring a case-sensitive whole-string match and a string value. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenExactly("hello", lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whennotexactly"></a>

**`whenNotExactly(value: str, callback: Callable, default: Callable | None=None) -> Stringable`**

Negate `exactly(value)`; a non-string comparison value raises `TypeError` before branch selection. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenNotExactly("world", lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whenstartswith"></a>

**`whenStartsWith(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Test any case-sensitive prefix. A non-list argument becomes a one-item list, then every item must be a string (`TypeError` otherwise); tuples are not treated as multiple prefixes. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello world").whenStartsWith(["hi", "hello"], lambda s: s.upper()) == "HELLO WORLD"
```

<a id="stringable-method-whendoesntstartwith"></a>

**`whenDoesntStartWith(needles: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Negate the same inline prefix-any check as `whenStartsWith`, with the same string/list element validation. An empty list selects the callback. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenDoesntStartWith("world", lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whentest"></a>

**`whenTest(pattern: str, callback: Callable, default: Callable | None=None) -> Stringable`**

Use `test(pattern)` as a Python regex search condition; regex/type errors propagate before branch selection. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello42").whenTest(r"\d+$", lambda s: s.upper()) == "HELLO42"
```

<a id="stringable-method-whenis"></a>

**`whenIs(pattern: str | list[str], callback: Callable, default: Callable | None=None) -> Stringable`**

Use `isPattern(pattern)` shell-style whole-value matching with its default ignore_case setting and platform behavior. It exposes no ignore_case parameter; pattern validation errors propagate. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello.txt").whenIs("*.txt", lambda s: s.upper()) == "HELLO.TXT"
```

<a id="stringable-method-whenisascii"></a>

**`whenIsAscii(callback: Callable, default: Callable | None=None) -> Stringable`**

Select using `isAscii`, which includes empty text and ASCII control characters. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("hello").whenIsAscii(lambda s: s.upper()) == "HELLO"
```

<a id="stringable-method-whenisuuid"></a>

**`whenIsUuid(callback: Callable, default: Callable | None=None) -> Stringable`**

Select using `isUuid()` with no version filter. This only validates an existing value. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("550e8400-e29b-41d4-a716-446655440000").whenIsUuid(lambda s: "uuid") == "uuid"
```

<a id="stringable-method-whenisulid"></a>

**`whenIsUlid(callback: Callable, default: Callable | None=None) -> Stringable`**

Select using the current alphabet/length `isUlid` check, including its documented range limitations. Branch callbacks receive one Stringable argument; `default=None` and result coercion/identity follow `when`.

```python
from orionis.support.types import Stringable

assert Stringable("01ARZ3NDEKTSV4RRFFQ69G5FAV").whenIsUlid(lambda s: "ulid") == "ulid"
```
