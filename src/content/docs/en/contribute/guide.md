---
title: Contribution Guide
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Contribution Guide

Welcome to the official guide for contributing to **Orionis Framework**. Here you will find best practices, requirements, and workflows to collaborate effectively, ensuring quality, security, and consistency in every contribution.

---

## Official Repositories

The Orionis Framework source code is managed on GitHub. Each component of the ecosystem has its own repository:

| Repository | Description |
|---|---|
| [Orionis Framework](https://github.com/orionis-framework/framework) | Framework core |
| [Orionis Skeleton](https://github.com/orionis-framework/skeleton) | Base template for new projects |

---

## Contribution Workflow

The following outlines the general process for contributing to the project:

1. **Fork** the repository you want to contribute to.
2. **Create a branch** from the appropriate base branch (see the [Branch Strategy](#branch-strategy) section).
3. **Implement your changes** following the project's style and quality conventions.
4. **Include tests** that validate the new or modified behavior.
5. **Run static analysis** with Ruff and SonarQube before opening your PR.
6. **Open a Pull Request** and mark it as *Ready for review* when it is complete.
7. **Respond to feedback** from reviewers and make the necessary adjustments.

:::tip[Tip]
PRs will only be reviewed when marked as **"Ready for review"** and all associated tests are passing. Inactive PRs in "draft" status may be closed after a few days, at the maintainers' discretion.
:::

---

## Bug Reports

For efficient collaboration, **always submit your fixes via Pull Requests** rather than reporting bugs through email or forums. Every fix must include tests that validate its behavior.

When reporting a bug, include:

- A **clear and concise title** describing the problem.
- A **detailed description** with expected vs. actual behavior.
- **Steps to reproduce** the bug consistently.
- **Environment information**: Python version, operating system, and Orionis version.
- A minimal **reproducible code example**.

:::caution[Incorrect tool warnings]
If you encounter incorrect warnings in your IDE, SonarQube, Ruff, or other tools when using Orionis Framework, **do not create a GitHub issue**. Instead, submit a PR to fix the problem directly.
:::

---

## Development Discussion

Have ideas for new features or improvements? Share them on the [GitHub Discussions board](https://github.com/orgs/orionis-framework/discussions). Contributors are encouraged to be willing to participate in the implementation, whether by contributing code or helping with development.

Not all proposals will be accepted; maintainers will evaluate each suggestion considering the project's vision, goals, and roadmap. Proposals should provide real value and prioritize solutions that benefit the community.

---

## Branch Strategy

Choose the target branch for your PR based on the type of change:

| Type of Change | Target Branch | Example |
|---|---|---|
| Bug fixes | Latest stable version | `1.x` |
| Minor backward-compatible improvements | Latest stable version | `1.x` |
| New features or breaking changes | `master` | — |

:::note[Note]
Do not submit fixes to `master` unless the bug exclusively affects features in the next major version.
:::

---

## Tests

Every contribution **must include tests** that validate the changes made. It is expected that:

- **Bug fixes** include at least one test that reproduces the corrected bug.
- **New features** include unit tests and, when applicable, integration tests.
- Tests follow the project's existing conventions regarding structure and naming.

Before opening your PR, verify that **all tests pass successfully** by running the project's complete test suite.

---

## Compiled Files

:::danger[Important]
Do not include compiled files or generated artifacts in your PRs. These are produced automatically from source code and **will be rejected** if detected. This ensures the project's integrity and traceability.
:::

---

## Security Vulnerabilities

If you discover a security vulnerability, **do not publish it as a public issue**. Instead, send an email to **Raul M. Uñate** at <a href="mailto:raulmauriciounate@gmail.com">raulmauriciounate@gmail.com</a>. All vulnerabilities will be addressed with priority and handled confidentially.

---

## Code Style

Orionis follows its own style conventions, aligned with modern web frameworks. The following requirements are mandatory for all code:

- **Documentation**: Every function, class, or method must include docstrings in **NumPyDoc** format.
- **Type annotations**: All parameters and return values must be typed with *type hints*.
- **Readability**: Code must be clear, consistent, and follow the project's conventions.

### Naming Convention

| Element | Convention | Example |
|---|---|---|
| Classes | *PascalCase* | `EmailService` |
| Methods | *camelCase* | `sendEmail` |
| Functions | *snake_case* | `validate_input` |
| Constants | *UPPER_SNAKE_CASE* | `MAX_RETRIES` |

### Example: Class with Method

```python
class EmailService:

    def sendNotification(self, recipient: str, subject: str) -> bool:
        """
        Sends an email notification.

        Parameters
        ----------
        recipient : str
            Recipient's email address.
        subject : str
            Email subject line.

        Returns
        -------
        bool
            True if the sending was successful, False otherwise.
        """
        return True
```

### Example: Standalone Function

```python
def parse_config_file(file_path: str, encoding: str = "utf-8") -> dict:
    """
    Reads and parses a configuration file.

    Parameters
    ----------
    file_path : str
        Absolute path to the configuration file.
    encoding : str, optional
        File encoding. Defaults to 'utf-8'.

    Returns
    -------
    dict
        Dictionary with the configuration key-value pairs.
    """
    return {}
```

---

## Static Analysis

Orionis Framework uses two complementary tools to ensure code quality:

| Tool | Purpose |
|---|---|
| [Ruff](https://github.com/astral-sh/ruff) | Code linting and formatting |
| [SonarQube](https://www.sonarqube.org/) | Static quality and security analysis |

**All code must pass both analyses** with no warnings or errors before submitting a PR.

### Ruff

Configure your environment to run Ruff and fix any warnings before submitting your contribution:

```bash
ruff check .
```

### SonarLint Configuration for VSCode

If you use **Visual Studio Code**, apply the following configuration in your `settings.json` file:

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

:::note[Note]
This configuration is specific to VSCode. If you use a different IDE, adapt the rules according to the SonarQube/SonarLint documentation for your environment.
:::

### Custom Rules Reference

| Rule | Status | Description |
|---|---|---|
| `python:S100` | Active (customized) | Allows method names in *camelCase* and with leading underscores, aligned with the framework's style. |
| `python:S1542` | Active (customized) | Enforces consistency in function and method naming. |
| `python:S2638` | Disabled | Incompatible with the dependency injection syntax used in Orionis. |

### Cognitive Complexity (`python:S3776`)

Some methods may exceed the default cognitive complexity threshold of **15**. In such cases:

- **Do not disable the rule globally.**
- Use `# NOSONAR` sparingly and only when the complexity is justified and reviewed.

```python
def complex_method(...):  # NOSONAR
    # Complex logic that requires a documented exception
    ...
```

:::caution[Caution]
Consider increasing the complexity threshold only if strictly necessary and justified by the nature of the problem. Document the reason in a comment or in the PR description.
:::

---

Thank you for contributing to Orionis Framework! Your collaboration helps improve the quality and developer experience for the entire community.