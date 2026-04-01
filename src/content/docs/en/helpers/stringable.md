---
title: Stringable
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Stringable

The `Stringable` class is a fluent, immutable wrapper around Python's built-in `str` type. It provides a rich collection of chainable methods for common string operations — searching, replacing, transforming case, encoding, validating, and more — without mutating the original value. Because `Stringable` extends `str`, it can be used anywhere a regular string is expected while adding expressive, framework-level convenience.

## Import

```python
from orionis.support.strings.stringable import Stringable
```

## Creating an Instance

```python
s = Stringable("Hello World")
```

Every method that returns text produces a **new** `Stringable` instance, so you can chain calls fluently:

```python
result = Stringable("  hello world  ").trim().title().finish("!")
# "Hello World!"
```

## Substring Extraction

### after / afterLast

Return the portion of the string after the first (or last) occurrence of a delimiter.

```python
Stringable("foo/bar/baz").after("/")       # "bar/baz"
Stringable("foo/bar/baz").afterLast("/")   # "baz"
```

If the delimiter is not found, the original string is returned.

### before / beforeLast

Return the portion of the string before the first (or last) occurrence of a delimiter.

```python
Stringable("foo/bar/baz").before("/")      # "foo"
Stringable("foo/bar/baz").beforeLast("/")  # "foo/bar"
```

### between / betweenFirst

Extract the text between two delimiters. `between` uses the first occurrence of the start delimiter and the **first** occurrence of the end delimiter after it. `betweenFirst` behaves identically and is provided for readability.

```python
Stringable("[hello]").between("[", "]")          # "hello"
Stringable("[a][b]").betweenFirst("[", "]")      # "a"
```

Returns an empty `Stringable` when either delimiter is missing.

### substr

Return a substring starting at a given position, optionally limited to a specific length.

```python
Stringable("Hello World").substr(6)       # "World"
Stringable("Hello World").substr(0, 5)    # "Hello"
```

### take

Take characters from the start (positive) or end (negative) of the string.

```python
Stringable("hello world").take(5)    # "hello"
Stringable("hello world").take(-5)   # "world"
```

### excerpt

Extract an excerpt around the first occurrence of a phrase, with configurable radius and omission indicator.

```python
text = Stringable("The quick brown fox jumps over the lazy dog")
text.excerpt("fox", {"radius": 5, "omission": "..."})
# "...brown fox jumps..."
```

Returns `None` if the phrase is not found.

## Search & Position

### contains

Check whether the string contains one or more substrings. Accepts a single string or an iterable, with an optional case-insensitive flag.

```python
Stringable("Hello World").contains("World")                        # True
Stringable("Hello World").contains("world", ignore_case=True)      # True
Stringable("Hello World").contains(["foo", "World"])               # True
```

### containsAll

Return `True` only when **every** needle in the list is present.

```python
Stringable("hello world foo").containsAll(["hello", "world", "foo"])  # True
Stringable("hello world").containsAll(["hello", "xyz"])               # False
```

### doesntContain

The inverse of `contains`.

```python
Stringable("hello world").doesntContain("xyz")  # True
```

### startsWith / endsWith

```python
Stringable("hello.py").endsWith(".py")                 # True
Stringable("hello.py").endsWith([".py", ".txt"])       # True
Stringable("hello world").startsWith("hello")          # True
```

### doesntStartWith / doesntEndWith

```python
Stringable("hello").doesntStartWith("world")   # True
Stringable("hello.py").doesntEndWith(".txt")   # True
```

### exactly

Strict equality comparison.

```python
Stringable("hello").exactly("hello")  # True
Stringable("hello").exactly("Hello")  # False
```

### position

Find the index of the first occurrence of a substring, optionally starting from an offset. Returns `False` when not found.

```python
Stringable("hello world").position("world")  # 6
Stringable("hello world").position("xyz")    # False
```

### match / matchAll / isMatch / test

Regular-expression helpers:

```python
Stringable("order-1234").match(r"\d+")      # "1234"
Stringable("a1b2c3").matchAll(r"\d")        # ["1", "2", "3"]
Stringable("hello").isMatch(r"^h.*o$")      # True
Stringable("hello").test(r"^h.*o$")         # True  (alias)
```

### isPattern

Wildcard-based pattern matching (`*` and `?`), with optional case-insensitive mode.

```python
Stringable("hello world").isPattern("hello*")                       # True
Stringable("Hello World").isPattern("hello*", ignore_case=True)     # True
```

## Replacement

### replace

Replace substrings with new values. Supports parallel lists for multi-replace and a case-insensitive mode.

```python
Stringable("Hello World").replace("World", "Python")                        # "Hello Python"
Stringable("Hello World").replace("world", "Python", case_sensitive=False)  # "Hello Python"
Stringable("a b c").replace(["a", "b"], ["x", "y"])                         # "x y c"
```

### replaceFirst / replaceLast

Replace only the first or last occurrence.

```python
Stringable("aaa").replaceFirst("a", "b")  # "baa"
Stringable("aaa").replaceLast("a", "b")   # "aab"
```

### replaceStart / replaceEnd

Replace a substring only if it appears as a prefix or suffix.

```python
Stringable("helloWorld").replaceStart("hello", "hi")    # "hiWorld"
Stringable("helloWorld").replaceEnd("World", "Python")  # "helloPython"
```

### replaceArray

Replace occurrences of a search string one at a time with successive elements from a list.

```python
Stringable("? ? ?").replaceArray("?", ["a", "b", "c"])  # "a b c"
```

### replaceMatches

Regex-powered replacement with a string or callable.

```python
Stringable("hello123world").replaceMatches(r"\d+", "NUM")
# "helloNUMworld"

Stringable("hello").replaceMatches(r"[aeiou]", lambda m: m.group(0).upper())
# "hEllO"
```

### remove

Remove substrings entirely.

```python
Stringable("hello world").remove("l")                              # "heo word"
Stringable("Hello World").remove("hello", case_sensitive=False)    # " World"
Stringable("hello world").remove(["hello", " "])                   # "world"
```

### swap

Replace multiple keywords using a dictionary mapping.

```python
Stringable("I love cats").swap({"cats": "dogs"})  # "I love dogs"
```

## Case Conversion

### lower / upper

```python
Stringable("HELLO World").lower()  # "hello world"
Stringable("hello World").upper()  # "HELLO WORLD"
```

### swapCase

Invert the case of every character.

```python
Stringable("Hello World").swapCase()  # "hELLO wORLD"
```

### camel / kebab / snake / studly / pascal

Convert between common naming conventions.

```python
Stringable("hello_world").camel()    # "helloWorld"
Stringable("helloWorld").kebab()     # "hello-world"
Stringable("helloWorld").snake()     # "hello_world"
Stringable("helloWorld").snake(".")  # "hello.world"
Stringable("hello_world").studly()   # "HelloWorld"
Stringable("hello_world").pascal()   # "HelloWorld"  (alias of studly)
```

### title / headline / apa

```python
Stringable("hello world").title()      # "Hello World"
Stringable("hello world").headline()   # "Hello World"

Stringable("the quick brown fox").apa()
# "The Quick Brown Fox"  — APA-style: short words lowercased except first/last
```

### ucfirst / lcfirst

Capitalize or lowercase **only** the first character.

```python
Stringable("hello world").ucfirst()  # "Hello world"
Stringable("Hello World").lcfirst()  # "hello World"
```

### convertCase

Numeric mode-based conversion:

| Mode | Effect |
|------|--------|
| `None` / `0` | casefold |
| `1` | UPPER |
| `2` | lower |
| `3` | Title |

```python
Stringable("HELLO").convertCase(2)  # "hello"
```

### slug

Generate a URL-friendly slug. Supports a custom separator and a character-replacement dictionary.

```python
Stringable("Hello World!").slug()       # "hello-world"
Stringable("Hello World").slug("_")     # "hello_world"
Stringable("user@example").slug()       # "user-at-example"
```

## Trimming & Padding

### trim / ltrim / rtrim

```python
Stringable("  hello  ").trim()      # "hello"
Stringable("--hello--").trim("-")   # "hello"
Stringable("  hello  ").ltrim()     # "hello  "
Stringable("  hello  ").rtrim()     # "  hello"
```

### lStrip / rStrip

Python-style `lstrip` / `rstrip` wrappers returning a `Stringable`.

```python
Stringable("xxhello").lStrip("x")   # "hello"
Stringable("helloxx").rStrip("x")   # "hello"
```

### padBoth / padLeft / padRight

Pad the string to reach a desired total length.

```python
Stringable("hi").padBoth(6)        # "  hi  "
Stringable("hi").padLeft(5)        # "   hi"
Stringable("5").padLeft(3, "0")    # "005"
Stringable("hi").padRight(5)       # "hi   "
```

### zFill

Pad with leading zeros.

```python
Stringable("42").zFill(5)  # "00042"
```

### squish

Collapse consecutive whitespace into a single space and trim.

```python
Stringable("  hello   world  ").squish()  # "hello world"
```

### deduplicate

Collapse consecutive occurrences of a character into one.

```python
Stringable("hello   world").deduplicate()   # "hello world"
Stringable("aabbcc").deduplicate("b")       # "aabcc"
```

## Building & Wrapping

### append / prepend

```python
Stringable("hello").append(" world", "!")          # "hello world!"
Stringable("world").prepend("hello ", "dear ")     # "hello dear world"
```

### newLine

Append one or more newline characters.

```python
Stringable("hello").newLine()    # "hello\n"
Stringable("hello").newLine(2)   # "hello\n\n"
```

### finish / start

Ensure the string ends (or starts) with a given value — does **not** duplicate it if already present.

```python
Stringable("path/to").finish("/")       # "path/to/"
Stringable("path/to/").finish("/")      # "path/to/"
Stringable("world").start("hello ")     # "hello world"
```

### wrap / unwrap

```python
Stringable("hello").wrap('"')                # '"hello"'
Stringable("hello").wrap("[", "]")           # "[hello]"
Stringable('"hello"').unwrap('"')            # "hello"
Stringable("[hello]").unwrap("[", "]")       # "hello"
```

### repeat

```python
Stringable("ab").repeat(3)   # "ababab"
Stringable("ab").repeat(0)   # ""
```

### reverse

```python
Stringable("hello").reverse()  # "olleh"
```

## Limiting & Truncation

### limit

Truncate the string to a maximum number of characters. An optional `preserve_words` flag avoids cutting in the middle of a word.

```python
Stringable("hello world").limit(5)                                   # "hello..."
Stringable("hello world").limit(5, " [more]")                        # "hello [more]"
Stringable("hello world foo").limit(8, "...", preserve_words=True)   # word-safe truncation
```

### words

Limit to a maximum number of words.

```python
Stringable("one two three four").words(2)  # "one two..."
```

### mask

Mask a portion of the string with a repeated character.

```python
Stringable("password").mask("*", 2, 4)  # "pa****rd"
Stringable("hello").mask("*", 2)        # "he***"
Stringable("hello").mask("*", -3)       # "he***"
```

## Splitting

### explode

Split by a literal delimiter.

```python
Stringable("a,b,c").explode(",")  # ["a", "b", "c"]
```

### split

Split by a regular expression or by chunk length.

```python
Stringable("a1b2c3").split(r"\d")  # ["a", "b", "c", ""]
Stringable("abcdef").split(2)      # ["ab", "cd", "ef"]
```

### ucsplit

Split at uppercase boundaries.

```python
Stringable("helloWorld").ucsplit()  # ["hello", "World"]
```

## Counting

### length

```python
Stringable("hello").length()  # 5
```

### wordCount

```python
Stringable("hello world").wordCount()  # 2
```

### substrCount

Count non-overlapping occurrences of a substring, optionally within an offset/length window.

```python
Stringable("banana").substrCount("an")  # 2
```

## Word Wrapping

### wordWrap

Wrap text to a specified line width.

```python
long_text = Stringable("This is a long sentence that needs wrapping")
long_text.wordWrap(20)
```

## Encoding & Hashing

### toBase64 / fromBase64

```python
Stringable("hello").toBase64()            # "aGVsbG8="
Stringable("aGVsbG8=").fromBase64()       # "hello"
```

`fromBase64` accepts a keyword-only `strict` parameter. When `strict=True`, invalid input raises a `RuntimeError` instead of returning an empty string.

### md5 / sha1 / sha256

Convenience hashing methods returning hexadecimal digest strings.

```python
Stringable("hello").md5()     # 32-char hex digest
Stringable("hello").sha1()    # 40-char hex digest
Stringable("hello").sha256()  # 64-char hex digest
```

### hash

Hash with any algorithm supported by `hashlib`.

```python
Stringable("hello").hash("sha256")  # equivalent to .sha256()
```

### toHtmlString / stripTags

```python
Stringable("<b>Hello</b>").toHtmlString()  # "&lt;b&gt;Hello&lt;/b&gt;"
Stringable("<p>Hello <b>World</b></p>").stripTags()  # "Hello World"
```

### ascii / transliterate

Remove or replace non-ASCII characters.

```python
Stringable("café").ascii()                         # "cafe"
Stringable("café").transliterate("?", strict=True) # "caf?"
```

### encrypt / decrypt

Encrypt and decrypt via the framework's `Crypt` facade. Requires the Encrypter service to be registered.

```python
encrypted = Stringable("secret").encrypt()
decrypted = encrypted.decrypt()
```

## Type Conversion

### toInteger / toFloat / toBoolean

```python
Stringable("42").toInteger()       # 42
Stringable("0xff").toInteger(16)   # 255
Stringable("3.14").toFloat()       # 3.14
Stringable("true").toBoolean()     # True
Stringable("0").toBoolean()        # False
```

### value

Return the underlying plain `str`.

```python
Stringable("hello").value()  # "hello" (type: str)
```

### jsonSerialize

Return a plain `str` suitable for JSON encoding.

```python
Stringable("hello").jsonSerialize()  # "hello"
```

## Validation

### isEmpty / isNotEmpty

```python
Stringable("").isEmpty()          # True
Stringable("hello").isNotEmpty()  # True
```

### Character Type Checks

| Method | Returns `True` when… |
|---|---|
| `isAlnum()` | All characters are alphanumeric |
| `isAlpha()` | All characters are alphabetic |
| `isDecimal()` | All characters are decimal digits |
| `isDigit()` | All characters are digit characters |
| `isIdentifier()` | Valid Python identifier |
| `isLower()` | All cased characters are lowercase |
| `isUpper()` | All cased characters are uppercase |
| `isNumeric()` | All characters are numeric |
| `isPrintable()` | All characters are printable |
| `isSpace()` | Only whitespace characters |
| `isTitle()` | Titlecased string |
| `isAscii()` | Only 7-bit ASCII characters |

### isJson

```python
Stringable('{"key": "value"}').isJson()  # True
Stringable("not json").isJson()          # False
```

### isUrl

Validate a URL, optionally restricting to specific protocols.

```python
Stringable("https://example.com").isUrl()                        # True
Stringable("ftp://example.com").isUrl(protocols=["ftp"])         # True
```

### isUuid / isUlid

```python
Stringable("550e8400-e29b-41d4-a716-446655440000").isUuid()  # True
Stringable("550e8400-e29b-41d4-a716-446655440000").isUuid(4) # True (version 4)
Stringable("01ARZ3NDEKTSV4RRFFQ69G5FAV").isUlid()            # True
```

## Pluralization

### plural / singular

Basic English pluralization rules.

```python
Stringable("cat").plural()           # "cats"
Stringable("cat").plural(1)          # "cat"
Stringable("baby").plural()          # "babies"
Stringable("bus").plural()           # "buses"
Stringable("cat").plural(3, prepend_count=True)  # "3 cats"

Stringable("cats").singular()        # "cat"
Stringable("babies").singular()      # "baby"
```

### pluralStudly / pluralPascal

Pluralize the last word of a StudlyCase or PascalCase string.

```python
Stringable("BlogPost").pluralStudly()     # "BlogPosts"
Stringable("UserProfile").pluralPascal()  # "UserProfiles"
```

## Callback Parsing

### parseCallback

Parse a `Class@method` style string into its components.

```python
Stringable("MyClass@myMethod").parseCallback()         # ["MyClass", "myMethod"]
Stringable("MyClass").parseCallback("handle")          # ["MyClass", "handle"]
Stringable("MyClass").parseCallback()                  # ["MyClass", None]
```

## Path Helpers

### basename / dirname

```python
Stringable("/home/user/file.txt").basename()           # "file.txt"
Stringable("/home/user/file.txt").basename(".txt")     # "file"
Stringable("/home/user/file.txt").dirname()            # "/home/user"
```

## Offset Access

### offsetExists / offsetGet / charAt

```python
Stringable("hello").offsetExists(2)   # True
Stringable("hello").offsetExists(99)  # False
Stringable("hello").offsetGet(1)      # "e"
Stringable("hello").charAt(0)         # "h"
Stringable("hello").charAt(99)        # False
```

`Stringable` also supports standard indexing and slicing:

```python
Stringable("hello")[1]      # Stringable("e")
Stringable("hello")[1:4]    # Stringable("ell")
```

## Numeric Extraction

### numbers

Remove all non-numeric characters.

```python
Stringable("phone: +1-234-567").numbers()  # "1234567"
```

### scan

Extract values using a simplified `sscanf`-style format string with `%s`, `%d` and `%f` placeholders.

```python
Stringable("John 30 5.9").scan("%s %d %f")  # ["John", "30", "5.9"]
```

## Substring Replacement

### substrReplace

Replace text within a specific range of the string using offset and length.

```python
Stringable("hello world").substrReplace("Python", 6, 5)  # "hello Python"
```

## Conditional Execution

All `when*` methods accept a callback and an optional default. The callback receives the current `Stringable` and its return value becomes the new string. If the condition is `False` and no default is provided, the original string is returned unchanged.

### when

Execute a callback conditionally based on a boolean or callable condition.

```python
Stringable("hello").when(True, lambda s: s.upper())           # "HELLO"
Stringable("hello").when(False, lambda s: s.upper())          # "hello"
Stringable("hello").when(lambda s: s.isNotEmpty(), lambda s: s.upper())  # "HELLO"
```

### whenContains / whenContainsAll

```python
Stringable("hello world").whenContains("world", lambda s: s.upper())
# "HELLO WORLD"
```

### whenEmpty / whenNotEmpty

```python
Stringable("").whenEmpty(lambda s: Stringable("default"))  # "default"
Stringable("hello").whenNotEmpty(lambda s: s.upper())      # "HELLO"
```

### whenStartsWith / whenDoesntStartWith

```python
Stringable("hello world").whenStartsWith("hello", lambda s: s.upper())
# "HELLO WORLD"
```

### whenEndsWith / whenDoesntEndWith

```python
Stringable("hello.py").whenEndsWith(".py", lambda s: s.upper())
# "HELLO.PY"
```

### whenExactly / whenNotExactly

```python
Stringable("hello").whenExactly("hello", lambda s: s.upper())     # "HELLO"
Stringable("hello").whenNotExactly("world", lambda s: s.upper())  # "HELLO"
```

### whenTest / whenIs / whenIsAscii / whenIsUuid / whenIsUlid

```python
Stringable("hello123").whenTest(r"\d+", lambda s: s.upper())  # "HELLO123"
```

## Pipelines & Side Effects

### pipe

Pass the string through a callback and return the result.

```python
Stringable("hello").pipe(lambda s: s.upper())  # "HELLO"
```

### tap

Execute a side-effect callback without modifying the string. Useful for logging or debugging within a chain.

```python
Stringable("hello").tap(lambda s: print(s)).upper()  # prints "hello", returns "HELLO"
```

## Date Parsing

### toDate

Parse the string into a `datetime` object using the specified format (default `%Y-%m-%d`). The resulting datetime is timezone-aware using the framework's local timezone.

```python
Stringable("2026-04-01").toDate()              # datetime(2026, 4, 1, ...)
Stringable("01/04/2026").toDate("%d/%m/%Y")    # datetime(2026, 4, 1, ...)
```

Raises `ValueError` if the string does not match the format.
