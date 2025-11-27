---
title: Enhanced Contribution Guide
---

# Contribution Guide

Welcome to the official guide for contributing to Orionis Framework. Here you'll find best practices and requirements to collaborate effectively, ensuring quality, security, and consistency in development.

## Bug Reporting

For efficient collaboration, **always submit your fixes via pull requests (PR)** instead of reporting bugs by email or forums. PRs will only be reviewed when marked as "ready for review" (not in "draft" state) and all associated tests are passing. Every change must include tests that validate its functionality.

Inactive PRs in "draft" state may be closed after a few days, as determined by the maintainers.

When reporting a bug, include a **clear title, detailed description, relevant information, and a reproducible code example**. This facilitates collaboration and quick resolution.

If you encounter incorrect warnings in your IDE, SonarQube, Ruff, or other tools while using Orionis Framework, **do not create a GitHub issue**. Instead, submit a PR to fix the issue.

The Orionis Framework source code is managed on GitHub, with dedicated repositories for each Laravel-based project:

- [Orionis Skeleton](https://github.com/orionis-framework/skeleton)
- [Orionis Framework](https://github.com/orionis-framework/framework)

## Framework Development Discussion

Do you have ideas for new features or improvements? Share them on the [GitHub discussion board](https://github.com/orgs/orionis-framework/discussions). It's recommended to be willing to collaborate on implementation, either by contributing code or assisting in development.

Not all proposals will be accepted; maintainers will review each suggestion considering the project's vision and goals. Proposals must add real value to the framework and prioritize solutions that benefit the community.

## Which Branch Should I Submit My Contribution To?

- **Bug fixes:** Submit your fixes to the latest stable version branch (e.g., `1.x`). Do not submit fixes to `master` unless the bug affects features exclusive to the next major version.
- **Minor and compatible improvements:** Also submit to the latest stable branch.
- **New features or breaking changes:** Submit to the `master` branch, which represents development for the next major version.

## Compiled Files

Do not include compiled files in your PRs. These are generated automatically from the source code and **will be rejected** if detected in PRs. This ensures the project's integrity and security.

## Security Vulnerabilities

If you discover a security vulnerability, **send an email to Raul M Uñate** at <a href="mailto:raulmauriciounate@gmail.com">raulmauriciounate@gmail.com</a>. All vulnerabilities will be addressed with priority.

## Code Style and Static Analysis

Orionis follows its own code style conventions, aligned with modern web frameworks. **All code must pass static analysis with [Ruff](https://github.com/astral-sh/ruff)** and should not generate warnings or errors.

- Every added or modified function, class, or method must include documentation in NumPyDoc format.
- Every function, class, or method must include type hints for parameters and return values.
- Code must be readable, consistent, and follow the project's established conventions.

Example:

If you are defining a class or method, make sure to include **type annotations and documentation in NumPyDoc format.**

Class names should use *PascalCase*, and method names should use *camelCase*.

```python
class ExampleClass:

    def exampleMethod(self, param1: int, param2: str) -> bool:
        """
        This is a sample function demonstrating
        type annotations and documentation in NumPyDoc format.

        Parameters
        ----------
        param1 : int
            Description of the first parameter.
        param2 : str
            Description of the second parameter.

        Returns
        -------
        bool
            Description of the return value.
        """
        return True

```

If you are defining a function, follow the same format, but use *snake_case* for the function name.

```python
def example_function(param1: float, param2: list) -> dict:
    """
    This is a sample function demonstrating type annotations
    and documentation in NumPyDoc format.

    Parameters
    ----------
    param1 : float
        Description of the first parameter.
    param2 : list
        Description of the second parameter.

    Returns
    -------
    dict
        Description of the return value.
    """
    return {}
```

### Style Rule Exceptions

The framework is inspired by the naming conventions of **modern web frameworks**. It is necessary to adjust SonarQube/SonarLint to avoid false positives during static analysis.

## Static Analysis with SonarQube and Ruff

Orionis Framework uses **SonarQube** as the main tool for static code analysis and quality. Additionally, **Ruff** is the official tool for linting and formatting in Orionis Framework. All code must pass both analyses before submitting a PR.

Set up your environment to run `ruff check .` and fix any warnings or errors before submitting your contribution.

### Recommended Configuration for VSCode

If you use **Visual Studio Code**, you can apply the following configuration in your `settings.json` file for SonarLint. For other IDEs, consult the relevant documentation to adapt the rules, as configuration may vary.

```json
"sonarlint.rules": {
    "python:S100": {
        "level": "on",
        "parameters": {
            "format": "^_{0,2}[a-z][a-zA-Z0-9_]*_{0,2}$"
        }
    },
    "python:S2638": {
        "level": "off"
    },
    "python:S1542": {
        "level": "on",
        "parameters": {
            "format": "^_{0,2}[a-z][a-zA-Z0-9_]*_{0,2}$"
        }
    }
},
"sonarlint.automaticAnalysis": true
```

> **Note:** This configuration is specific to VSCode. If you use another IDE, you must adapt the rules according to the SonarQube/SonarLint documentation for that environment.

### Rule Explanations

- **`python:S100`**: Allows method names with leading underscores or camelCase structure, aligned with the framework's style.
- **`python:S2638`**: Disabled due to incompatibility with dependency injection syntax.
- **`python:S1542`**: Enforces consistency in method naming.

## Handling Cognitive Complexity (`python:S3776`)

Some methods may exceed the default cognitive complexity limit of **15**.

### Recommendation

- **Do not disable the rule globally**.
- Use `# NOSONAR` sparingly and only when complexity is justified.

```python
def complex_method(...):  # NOSONAR
    # Complex logic requiring exception
    ...
```

> **Note:** Consider increasing the threshold only if strictly necessary and justified by the nature of the problem.

---

Thank you for contributing to Orionis Framework! Your collaboration helps improve the quality and development experience for the entire community.
