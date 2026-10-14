---
title: "Orionis metadata and compatibility"
description: "Use orionis.metadata to display the installed framework version in an application's diagnostics, about screen, or command output. The values are read directly from the…"
editUrl: true
lastUpdated: false
---

Use `orionis.metadata` to display the installed framework version in an application's diagnostics, about screen, or command output. The values are read directly from the installed package; importing them needs no application bootstrap, configuration file, or network request.

## Display the installed version

This complete example runs anywhere Orionis is installed:

```python
from orionis.metadata import NAME, PYTHON_REQUIRES, VERSION

required_python = ".".join(map(str, PYTHON_REQUIRES))
print(f"{NAME} {VERSION}; Python {required_python}+")
```

`VERSION` describes the installed Orionis framework, not your application's release. Keep application versioning separate. `PYTHON_REQUIRES` is the interpreter floor as a tuple, currently `(3, 14)`.

## Available constants

| Constant | Use in an application |
|---|---|
| `NAME` | Distribution/import identity, `orionis`. |
| `VERSION` | Installed framework release string. |
| `DESCRIPTION` | Framework description. |
| `AUTHOR` / `AUTHOR_EMAIL` | Framework maintainer identity and contact. |
| `PYTHON_REQUIRES` | Minimum Python `(major, minor)` tuple. |
| `API` | PyPI JSON endpoint for the distribution. |
| `DOCS` | Documentation root. |
| `FRAMEWORK` | Framework source repository. |
| `SKELETON` | Application skeleton repository. |

The strings and tuple are release metadata; treat them as read-only. `API` refers to package metadata on PyPI, not a callable application API or the framework API reference site. Importing any URL constant does not contact that destination or check its availability.

## Check interpreter compatibility

```python
import sys
from orionis.metadata import PYTHON_REQUIRES

running = sys.version_info[: len(PYTHON_REQUIRES)]
if running < PYTHON_REQUIRES:
    required = ".".join(map(str, PYTHON_REQUIRES))
    raise RuntimeError(f"Orionis requires Python {required}+")
```

Compare the same number of components. Python packaging already enforces `requires-python` during normal installation; this check is useful for a separate diagnostic or launcher. Installed wheels may not contain the repository's `pyproject.toml`, so application code should use the exported constants instead of looking for that file.

`VERSION` is a plain release string, not a PEP 440 parser or a supported-feature query. Determine behavior from the documentation and public API for the installed release. There is no metadata configuration, provider, facade, or per-request state.

Implementation reference: [framework.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/metadata/framework.py).
