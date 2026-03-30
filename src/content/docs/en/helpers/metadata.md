---
title: 'Metadata'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Framework Metadata

Orionis Framework exposes a metadata module that centralizes identity, version, authorship, and resource information for the project. This module is located at `orionis.metadata.framework` and contains a set of constants describing the fundamental properties of the framework.

These constants are used internally by the framework to:

- Identify the package within the Python ecosystem (PyPI).
- Validate the minimum required interpreter version.
- Generate diagnostic messages, logs, and console output.
- Reference repositories, documentation, and public API endpoints.

They are also available to application developers who need to query framework information at runtime — for example, to include it in diagnostic screens, error reports, or integrations with monitoring services.

## Import

You can import constants individually or access the full module:

**Individual import**

```python
from orionis.metadata.framework import NAME, VERSION, AUTHOR
```

**Full module import**

```python
from orionis.metadata import framework as fw

print(fw.NAME)       # "orionis"
print(fw.VERSION)    # "0.756.0"
```

## Constants Reference

### `NAME`

Package name as registered on PyPI.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Value** | `"orionis"` |
| **Format** | Lowercase, no spaces |

```python
from orionis.metadata.framework import NAME

print(NAME)  # "orionis"
```

### `VERSION`

Current framework version, following a semantic versioning scheme with dot-separated numeric segments.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Format** | `MAJOR.MINOR.PATCH` (e.g. `"0.756.0"`) |

```python
from orionis.metadata.framework import VERSION

print(VERSION)  # "0.756.0"
```

This constant is useful for compatibility validations or for displaying the version in the user interface:

```python
from orionis.metadata.framework import VERSION

segments = VERSION.split(".")
major, minor, patch = int(segments[0]), int(segments[1]), int(segments[2])
```

### `AUTHOR`

Full name of the primary author or maintainer of the project.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Value** | `"Raul Mauricio Uñate Castro"` |

```python
from orionis.metadata.framework import AUTHOR
```

### `AUTHOR_EMAIL`

Email address of the primary author or maintainer.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Value** | `"raulmauriciounate@gmail.com"` |
| **Format** | Valid email address |

```python
from orionis.metadata.framework import AUTHOR_EMAIL
```

### `DESCRIPTION`

Short project description that identifies its purpose within the Python ecosystem.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Value** | `"Orionis Framework — Async-first full-stack framework for modern Python applications."` |

```python
from orionis.metadata.framework import DESCRIPTION
```

### `SKELETON`

URL of the starter template repository (skeleton), used to create new projects based on Orionis Framework.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Value** | `"https://github.com/orionis-framework/skeleton"` |
| **Protocol** | HTTPS |

```python
from orionis.metadata.framework import SKELETON
```

### `FRAMEWORK`

URL of the main framework repository.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Value** | `"https://github.com/orionis-framework/framework"` |
| **Protocol** | HTTPS |

```python
from orionis.metadata.framework import FRAMEWORK
```

### `DOCS`

URL of the official framework documentation.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Value** | `"https://orionis-framework.com/"` |
| **Protocol** | HTTPS |

```python
from orionis.metadata.framework import DOCS
```

### `API`

URL of the PyPI JSON endpoint for querying package information programmatically.

| Property | Value |
|----------|-------|
| **Type** | `str` |
| **Value** | `"https://pypi.org/pypi/orionis/json"` |
| **Protocol** | HTTPS |

```python
from orionis.metadata.framework import API

# Example: query the latest version from PyPI
import urllib.request
import json

with urllib.request.urlopen(API) as response:
    data = json.loads(response.read())
    latest = data["info"]["version"]
    print(f"Latest version on PyPI: {latest}")
```

### `PYTHON_REQUIRES`

Tuple indicating the minimum Python version required to run the framework.

| Property | Value |
|----------|-------|
| **Type** | `tuple[int, int]` |
| **Value** | `(3, 14)` |
| **Format** | `(MAJOR, MINOR)` |

```python
from orionis.metadata.framework import PYTHON_REQUIRES

print(PYTHON_REQUIRES)  # (3, 14)
```

This constant can be used to validate the runtime environment:

```python
import sys
from orionis.metadata.framework import PYTHON_REQUIRES

if sys.version_info[:2] < PYTHON_REQUIRES:
    raise RuntimeError(
        f"Orionis requires Python {PYTHON_REQUIRES[0]}.{PYTHON_REQUIRES[1]} or higher. "
        f"Current version: {sys.version_info[0]}.{sys.version_info[1]}"
    )
```

## Constants Summary

| Constant | Type | Description |
|----------|------|-------------|
| `NAME` | `str` | Package name (`"orionis"`) |
| `VERSION` | `str` | Current framework version |
| `AUTHOR` | `str` | Primary author name |
| `AUTHOR_EMAIL` | `str` | Author contact email |
| `DESCRIPTION` | `str` | Project description |
| `SKELETON` | `str` | Skeleton repository URL |
| `FRAMEWORK` | `str` | Framework repository URL |
| `DOCS` | `str` | Official documentation URL |
| `API` | `str` | PyPI JSON endpoint URL |
| `PYTHON_REQUIRES` | `tuple[int, int]` | Minimum required Python version |

## Module Location

The metadata module is located at the following path within the framework source code:

```
orionis/
└── metadata/
    └── framework.py
```

You can access both the full module (`orionis.metadata.framework`) and the containing package (`orionis.metadata`), which exposes the `framework` submodule as an attribute.

## Notes

- All URLs use the HTTPS protocol.
- Each URL is unique and points to a distinct resource within the Orionis Framework ecosystem.
- `PYTHON_REQUIRES` is compatible with `sys.version_info` for direct version comparisons.
- `NAME` follows Python package naming conventions: lowercase, no spaces.
- `VERSION` follows a numeric pattern with dot-separated segments, where each segment is an integer.