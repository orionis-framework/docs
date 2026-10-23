---
title: "Metadata"
description: "Read the identity, installed version, links and Python requirement published by Orionis."
editUrl: true
lastUpdated: false
---

`orionis.metadata` publishes information about the **installed framework**. Use it for diagnostics, information screens and commands. It provides module constants: there is no `Metadata` class, facade or service to initialize.

## Import and direct use

```python
from orionis.metadata import NAME, PYTHON_REQUIRES, VERSION

required_python = ".".join(map(str, PYTHON_REQUIRES))
print(f"{NAME} {VERSION}; Python {required_python}+")
```

You can also import the same names from `orionis.metadata.framework`. Importing them does not require booting an application, reading its configuration or making a network request. `VERSION` identifies the installed package version, not your application's version or the latest published release.

## Available constants

All strings are `str`; `PYTHON_REQUIRES` is a tuple of integers. They take no parameters and define no methods of their own. Values come from the installed package's source.

<a id="metadata-constant-name"></a>
<a id="metadata-constant-version"></a>
<a id="metadata-constant-description"></a>
<a id="metadata-constant-author"></a>
<a id="metadata-constant-author-email"></a>
<a id="metadata-constant-python-requires"></a>
<a id="metadata-constant-api"></a>
<a id="metadata-constant-docs"></a>
<a id="metadata-constant-framework"></a>
<a id="metadata-constant-skeleton"></a>

| Constant | Type | Purpose |
| --- | --- | --- |
| `NAME` | `str` | Distribution name: `orionis`. |
| `VERSION` | `str` | Installed framework version; read it dynamically. |
| `DESCRIPTION` | `str` | Framework description. |
| `AUTHOR` | `str` | Author or maintainer name published by the package. |
| `AUTHOR_EMAIL` | `str` | Contact email published by the package. |
| `PYTHON_REQUIRES` | `tuple[int, int]` | Minimum Python version as `(major, minor)`, currently `(3, 14)`. |
| `API` | `str` | URL of the distribution's JSON metadata on PyPI. |
| `DOCS` | `str` | Documentation root URL. |
| `FRAMEWORK` | `str` | Framework repository URL. |
| `SKELETON` | `str` | Application skeleton repository URL. |

This example reads every value without hardcoding a framework version:

```python
from orionis.metadata import (
    API, AUTHOR, AUTHOR_EMAIL, DESCRIPTION, DOCS,
    FRAMEWORK, NAME, PYTHON_REQUIRES, SKELETON, VERSION,
)

framework_info = {
    "name": NAME,
    "version": VERSION,
    "description": DESCRIPTION,
    "author": {"name": AUTHOR, "email": AUTHOR_EMAIL},
    "python_minimum": ".".join(map(str, PYTHON_REQUIRES)),
    "links": {
        "package_metadata": API,
        "documentation": DOCS,
        "source": FRAMEWORK,
        "skeleton": SKELETON,
    },
}
assert framework_info["name"] == "orionis"
assert isinstance(framework_info["version"], str)
```

URLs are data. Reading `API` does not download metadata, check for updates or validate availability. `API` is not your application URL or the framework's API reference URL.

## Diagnose Python compatibility

Compare the same number of version components:

```python
import sys
from orionis.metadata import PYTHON_REQUIRES

running = sys.version_info[:len(PYTHON_REQUIRES)]
if running < PYTHON_REQUIRES:
    required = ".".join(map(str, PYTHON_REQUIRES))
    raise RuntimeError(f"Orionis requires Python {required}+")
```

This check can help in a diagnostic or standalone launcher. The module does not check compatibility itself when its constants are imported. `VERSION` does not parse versions or report whether a particular feature is available either.

## Components and dependency injection

Controllers, commands, jobs and services can read these constants directly. They are not dependencies the container resolves by name: annotating a parameter as `str` does not inject `VERSION`.

For a dependency you can replace in tests, wrap the read in an application service. The following `FrameworkInfo` class is application example code, not a native Orionis class:

```python
from orionis.http import JSONResponse
from orionis.metadata import NAME, VERSION

class FrameworkInfo:
    def describe(self) -> dict[str, str]:
        return {"name": NAME, "version": VERSION}

class InformationController:
    def __init__(self, info: FrameworkInfo) -> None:
        self.info = info

    async def __call__(self) -> JSONResponse:
        return JSONResponse(self.info.describe())
```

The container can construct `FrameworkInfo` without arguments and pass it to the controller. When placing the classes in separate files, import the service into the controller from its module. See [resolution and invocation](/en/architecture/service-container/bindings-and-invocation) for replacing it with another implementation.

Uppercase names express the intent to treat these values as constants; Python does not prevent reassigning module attributes. Keep your application's version in its own configuration and avoid changing framework metadata.
