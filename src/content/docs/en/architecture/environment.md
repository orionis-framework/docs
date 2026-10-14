---
title: "Environment and process configuration"
description: "For application development, keep environment values in the generated project's .env and read them from typed files under config/. Start Reactor from that project root so the…"
editUrl: true
lastUpdated: false
---

For application development, keep environment values in the generated project's `.env` and read them from typed files under `config/`. Start Reactor from that project root so the first environment lookup selects the intended file. [Reading and writing environment configuration](/en/architecture/environment/typed-configuration) shows the complete flow.

Keep a `.env.example` containing the required keys and non-secret examples. Deployment changes to `.env` require restarting processes or deliberately reloading it; existing service configuration is not automatically rebuilt by an environment edit.

## Overview

The package-level API is `Env` plus the `env()` lookup helper. Both delegate to a process-wide `DotEnv` singleton. On first use, it resolves `.env` from the working directory, creates it if absent, loads it into `os.environ` with file values taking precedence, and caches the file entries for `all()`.

Values may use explicit prefixes such as `int:`, `bool:`, `list:`, `path:`, or `base64:`. Unprefixed values still recognize nulls, booleans, and safe Python literals. `EnvironmentCaster` owns the typed serialization/parsing rules.

## Requirements

- Python 3.14 or newer.
- `python-dotenv>=1.2.3,<2.0`, installed by Orionis.
- Read/write access to the selected `.env` file for persistent `set`, `unset`, and `reload` workflows.
- Uppercase variable names matching `[A-Z][A-Z0-9_]*`.

## Module learning path

- [Persistence, reloads, and Env reference](/en/architecture/environment/operations-and-reference)
- [Reading and writing environment configuration](/en/architecture/environment/typed-configuration)

Continue with: [foundation](/en/getting-started) · [encrypter](/en/security/encryption).
