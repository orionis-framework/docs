---
title: "Storing, verifying, and upgrading passwords"
description: "Generate and verify hashes from controllers and services, configure Argon2id and bcrypt, and upgrade credentials through rehashing."
editUrl: true
lastUpdated: false
---

The hashing service turns a password into an encoded value that you can store and verify later. `make()` generates the hash; `check()` compares a candidate password with the stored value. The service does not create users, start sessions, or save its output automatically.

Orionis includes the `argon2` driver, which generates **Argon2id**, and `bcrypt`. Configuration in `config/hashing.py` determines which driver `Hash` and `IHashManager` use by default.

## Use hashing from a controller

The framework provider registers `IHashManager` as a singleton and prepares the `Hash` facade during startup. You do not need to register the service manually. Inject it into an action, receive it through the constructor, or use the facade from a controller, service, command, seeder, or another component in a booted application.

`make()` and `check()` are **asynchronous**: use them with `await`. Algorithm work runs on a worker thread through `asyncio.to_thread()`, allowing the event loop to continue handling other tasks. `driver()`, `needsRehash()`, `getAlgorithm()`, and `getDefaultDriver()` are synchronous.

### Validate and store a password

This example uses the reference application's `User` model and an already migrated `users` table. Create the schema in `app/http/schemas/create_account.py`:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import Email, MaxLength, MinLength, Unique
from orionis.schemas.fields import Field


class CreateAccountSchema(Schema):
    name: Field[str, MinLength(2), MaxLength(100)]
    email: Field[str, Email(), Unique(table="users", column="email")]
    password: Field[str, MinLength(12), MaxLength(128)]
```

In `app/http/controllers/account_controller.py`, receive the validated schema and hashing service in the action:

```python
from app.http.schemas.create_account import CreateAccountSchema
from app.models.user import User
from orionis.hashing.contracts import IHashManager
from orionis.http import JSONResponse, response


class AccountController:
    async def store(
        self,
        payload: CreateAccountSchema,
        hashing: IHashManager,
    ) -> JSONResponse:
        user = await User.create({
            "name": payload.name,
            "email": payload.email,
            "password": await hashing.make(payload.password),
            "active": True,
        })

        return response.json(
            {"id": user.id, "name": user.name, "email": user.email},
            status_code=201,
        )
```

Register the endpoint in `routes/api.py`:

```python
from app.http.controllers.account_controller import AccountController
from orionis.support.facades import Route


Route.post("/accounts", [AccountController, "store"])
```

The kernel validates the payload before executing the action. `make()` generates a hash with its salt and parameters embedded; `User.create()` persists it. The response projects public fields only. Do not assign `payload.password` directly to the column: the model does not perform hashing automatically.

This example demonstrates the storage operation. The [authentication guide](/en/authentication/account-recovery) develops registration and email verification; [validation](/en/validation) covers rules and payload error handling.

### Inject the service through the constructor

When several actions need hashing, keep the service on the controller. As an alternative to the previous controller, use this implementation in the same file:

```python
from app.http.schemas.create_account import CreateAccountSchema
from app.models.user import User
from orionis.hashing.contracts import IHashManager
from orionis.http import JSONResponse, response


class AccountController:
    def __init__(self, hashing: IHashManager) -> None:
        self._hashing = hashing

    async def store(self, payload: CreateAccountSchema) -> JSONResponse:
        user = await User.create({
            "name": payload.name,
            "email": payload.email,
            "password": await self._hashing.make(payload.password),
            "active": True,
        })

        return response.json(
            {"id": user.id, "name": user.name, "email": user.email},
            status_code=201,
        )
```

The container constructs the controller and resolves `IHashManager` from its annotation. The route stays the same. Both approaches receive the same configured manager; they do not create independent hashing settings for each request.

### Use the facade

Always import from the public module:

```python
from app.models.user import User
from orionis.support.facades import Hash


class AccountCreator:
    async def create(self, name: str, email: str, password: str) -> User:
        return await User.create({
            "name": name,
            "email": email,
            "password": await Hash.make(password),
            "active": True,
        })
```

This service receives already validated data. `Hash` exposes the same operations as `IHashManager` and uses the booted application's configuration. Injection makes the dependency explicit; the facade accesses the same service without adding it to the signature.

## Verify a password

Use `await hashing.check(candidate, stored_hash)`, in that order. The second argument is **the complete hash retrieved from storage**. An incorrect password returns `False`.

Do not generate another hash and compare it with `==`: the salt makes two `make()` calls with the same password produce different results. You do not need a separate salt column either: it is already part of the encoded string.

To sign a user in, use [`Auth.attempt()` and guards](/en/authentication/session-authentication). Verifying a hash alone does not authenticate the user or create a session.

## Upgrade a hash through rehashing

`needsRehash(stored_hash)` indicates whether a hash differs from the driver's current policy: algorithm or parameters. It returns `bool` synchronously. **It does not verify the password or update the database**.

After successful verification, generate a replacement and persist it when needed. This service, for example in `app/services/password_verifier.py`, separates verification from writing:

```python
from orionis.hashing.contracts import IHashManager


class PasswordVerifier:
    def __init__(self, hashing: IHashManager) -> None:
        self._hashing = hashing

    async def verify(
        self,
        candidate: str,
        stored_hash: str,
    ) -> tuple[bool, str | None]:
        if not await self._hashing.check(candidate, stored_hash):
            return False, None

        if self._hashing.needsRehash(stored_hash):
            return True, await self._hashing.make(candidate)

        return True, None
```

`(False, None)` means the attempt failed. `(True, None)` means the password is correct and its hash already matches the policy. `(True, replacement)` requires storing the replacement through your repository or model before completing the workflow. Apply your application's concurrency control to avoid overwriting a simultaneous password change.

Changing configured costs does not prevent verification of older hashes from the same algorithm: the backend reads their encoded parameters. `needsRehash()` compares those parameters with current settings; a difference may also result from lowering the cost. Configuration defines the policy used to generate a replacement.

The native identity provider checks passwords through `check()`; it does not execute this rehash workflow or persist replacements automatically.

## Select a driver

Manager operations use the default driver exclusively. `driver()` returns a configured, cached hasher; selecting another driver does not change the default.

| Driver | Generated algorithm | Costs | Use |
| --- | --- | --- | --- |
| `argon2` | `argon2id` | Memory, parallelism, and iterations. | Framework default for new passwords. |
| `bcrypt` | `bcrypt` | `rounds` cost factor. | Interoperability with applications and records already using bcrypt. |

Explicit selection uses canonical lowercase names: `Hash.driver("argon2")` or `Hash.driver("bcrypt")`. `Hash.driver()` selects the default, `Hash.getDefaultDriver()` reports its configuration name, and `Hash.getAlgorithm()` reports the algorithm.

### Migrate bcrypt records to Argon2id

Configure `HASH_DRIVER=argon2` for new passwords. When you know a legacy record uses bcrypt, explicitly verify it with that driver before generating an Argon2id hash:

```python
from orionis.support.facades import Hash


async def upgradeBcrypt(
    candidate: str,
    stored_bcrypt_hash: str,
) -> tuple[bool, str | None]:
    legacy = Hash.driver("bcrypt")

    if not await legacy.check(candidate, stored_bcrypt_hash):
        return False, None

    return True, await Hash.make(candidate)
```

This example assumes the default driver is `argon2` and the application identifies legacy records. Store the replacement through the persistence workflow described above. Calling `Hash.check()` with the Argon2 default does not automatically select bcrypt.

A bcrypt hash is verified with its backend's limits, including during migration. The installed backend rejects passwords longer than **72 UTF-8 bytes**; this does not mean 72 characters. Orionis does not truncate the value or prehash it to bypass that limit.

## Complete configuration

`config/hashing.py` defines `BootstrapHashing`, extending the frozen `Hashing` entity. Its `Argon2` and `Bcrypt` objects are frozen too; values are validated during configuration. These are all available settings:

| Field within `hashing` | Environment variable | Default | Meaning and validation |
| --- | --- | --- | --- |
| `driver` | `HASH_DRIVER` | `argon2` | `argon2` or `bcrypt`. Also accepts a `Drivers` member in Python. |
| `argon2.memory` | `ARGON_MEMORY` | `65536` | Memory in KiB. Positive integer and at least `8 * threads`. |
| `argon2.threads` | `ARGON_THREADS` | `4` | Parallelism or lanes. Positive integer. |
| `argon2.time` | `ARGON_TIME` | `3` | Iteration count. Positive integer. |
| `bcrypt.rounds` | `BCRYPT_ROUNDS` | `12` | Logarithmic cost factor, an integer from `4` through `31` inclusive. |

For example, this environment configuration reproduces the defaults:

```dotenv
HASH_DRIVER=argon2
ARGON_MEMORY=65536
ARGON_THREADS=4
ARGON_TIME=3
BCRYPT_ROUNDS=12
```

Both algorithms' parameters remain in configuration even though only one is the default. Therefore, `driver("bcrypt")` uses `bcrypt.rounds` while `make()` continues using Argon2id.

To set values in Python instead, adapt `config/hashing.py` as follows:

```python
from dataclasses import dataclass, field

from orionis.foundation.config.hashing import Argon2, Bcrypt, Drivers, Hashing


@dataclass(frozen=True, kw_only=True)
class BootstrapHashing(Hashing):
    driver: Drivers | str = Drivers.ARGON2
    argon2: Argon2 | dict = field(
        default_factory=lambda: Argon2(memory=65536, threads=4, time=3),
    )
    bcrypt: Bcrypt | dict = field(
        default_factory=lambda: Bcrypt(rounds=12),
    )
```

This example fixes values in the file; to retain `.env` loading, keep the original configuration's `Env.get()` calls. Option dictionaries are also converted into their corresponding entities. Booleans are invalid costs even though Python considers them subtypes of `int`.

## Per-operation options

`make()` accepts keyword arguments that affect only that operation:

```python
from orionis.hashing.contracts import IHashManager


async def encodePassword(hashing: IHashManager, password: str) -> str:
    return await hashing.driver("argon2").make(
        password,
        rounds=3,
        memory=65536,
        threads=4,
    )
```

| `make()` option | Argon2id | Bcrypt |
| --- | --- | --- |
| `rounds` | Iterations; corresponds to `argon2.time`. | Cost factor; corresponds to `bcrypt.rounds`. |
| `memory` | Memory in KiB. | Ignored. |
| `threads` | Parallelism. | Ignored. |
| `None` or omitted argument | Keeps the configured cost for that option. | Keeps configured `rounds`. |

These overrides do not modify the cached driver. When generating with a different cost, `needsRehash()` still compares against the driver's configured values, so it may immediately indicate that replacement is needed.

### Setters and concrete classes

`Hash.setRounds(value)` modifies the shared default driver and returns the manager. For Argon2 it changes time cost; for bcrypt, the cost factor. Because the change applies globally, configure costs at startup and use per-operation options when only one call should differ.

You may also construct independent instances for tests, dedicated processes, or migrations. `Argon2Hasher` adds `setMemory()` and `setThreads()`; all its setters return the instance:

```python
from orionis.hashing import Argon2Hasher, BcryptHasher


async def verifyWithIndependentHashers(
    candidate: str,
    argon2_hash: str,
    bcrypt_hash: str,
) -> tuple[bool, bool]:
    argon2 = Argon2Hasher(memory=65536, threads=4, time=3)
    argon2.setRounds(3).setMemory(65536).setThreads(4)
    bcrypt = BcryptHasher(rounds=12).setRounds(12)

    return (
        await argon2.check(candidate, argon2_hash),
        await bcrypt.check(candidate, bcrypt_hash),
    )
```

These instances do not read `config/hashing.py` or require the facade. The services also work outside HTTP from asynchronous functions; a request already has an event loop and does not need an `asyncio.run()` wrapper.

## Operation reference

| Operation | Returns | Behavior |
| --- | --- | --- |
| `await make(value, *, rounds=None, memory=None, threads=None)` | `str` | Generates an encoded hash containing salt and parameters. |
| `await check(value, hashed)` | `bool` | Verifies a password against its stored hash. |
| `needsRehash(hashed)` | `bool` | Compares the hash with the driver's current policy. |
| `getAlgorithm()` | `str` | `argon2id` or `bcrypt`. |
| `setRounds(rounds)` | The same instance. | Changes the selected driver's cost. |
| `driver(name=None)` | `IHasher` | Available on the manager and facade. Selects a driver without changing the default. |
| `getDefaultDriver()` | `str` | Available on the manager and facade. Returns `argon2` or `bcrypt`. |

## Errors and verified behavior

- An empty hash or one not identified by the selected driver makes `check()` return `False` and `needsRehash()` return `True`. This does not authorize replacement: always verify the password first.
- Backend errors may propagate, for example due to input limits or an identified but invalid encoding. The hashing API does not turn every exception into `False`.
- Configuration entities reject invalid types or values with `TypeError` or `ValueError`. Hasher constructors, setters, and per-call options use `HashConfigurationException` for invalid costs; additional backend constraints may raise backend errors.
- Resolving an unsupported driver through `driver(name)` raises `HashDriverNotSupportedException`. An invalid driver in `config/hashing.py` is rejected during configuration validation.
- Backends load when used. A missing dependency raises `MissingHashDependencyException` with the corresponding installation command. Orionis's normal dependencies include both `pwdlib` backends.
- `HashManager` resolves only the two native drivers and exposes no `extend()`. A custom implementation must satisfy the `IHasher` or `IHashManager` contracts and be registered through the container.

The default `65536` KiB equals 64 MiB of Argon2 memory cost per operation, in addition to process and backend consumption. Running calculations off the event loop enables concurrency; it does not remove CPU, memory, or worker-thread costs. Tune values according to your application's measurements.

See [authentication](/en/authentication) for identity management and [encryption](/en/cryptography/encryption) when you need to recover an original value.
