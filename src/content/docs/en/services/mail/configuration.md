---
title: "Mail configuration"
description: "Reference for config/mail.py: mailers, sender, environment variables, SMTP URL precedence, and effective validation."
editUrl: true
lastUpdated: false
---

`config/mail.py` defines `BootstrapMail`, an immutable dataclass extending `Mail`. Its three fields select the default mailer, global sender, and available transports. Constructing these entities does not open connections or send messages.

<a id="config-mail"></a>

## General configuration: Mail

| Field | Variable and default | Type and behavior |
|---|---|---|
| `default` | `MAIL_MAILER`; `smtp`. | `str \| MailDriver`. Nonempty name of a declared mailer. |
| `from_address` | `FromAddress(...)` factory. | `FromAddress \| dict`. Sender used when the message declares none. |
| `mailers` | `Mailers(...)` factory. | `Mailers \| dict`. Named configuration entries available for selection. |

`default` must exactly match an entry. It is not lowercased or trimmed: `"SMTP"` does not automatically select `"smtp"`. A blank name or one absent from `mailers` raises `ValueError`; an incorrect type raises `TypeError`.

<a id="config-maildriver"></a>

### MailDriver

`MailDriver.SMTP` is `"smtp"` and `MailDriver.FILE` is `"file"`. These are conventional names rather than a restriction to two mailer entries. The manager selects a **mailer** by name; its `driver` field identifies the transport implementation.

<a id="config-fromaddress"></a>

## Global sender: FromAddress

| Field | Variable and default | Type and effect |
|---|---|---|
| `address` | `MAIL_FROM_ADDRESS`; `""`. | `str`. Global sender mailbox. Empty allows each message to supply its own. |
| `name` | `MAIL_FROM_NAME`; `APP_NAME`, then `"Orionis"`. | `str`. Sender display name. |

The entity checks types rather than complete mailbox syntax. When a message lacks an explicit sender, the manager reads this configuration, trims the address and name, and constructs a validated `Address`. An empty global address does not complete the message: it must declare a sender before sending.

A sender supplied through `fromAddress(...)` or the message's `Envelope` takes precedence; in that case the global sender is not read. A dictionary is validated as `FromAddress` and retained as an independent copy rather than automatically converted into that entity.

```dotenv
MAIL_FROM_ADDRESS=notifications@example.com
MAIL_FROM_NAME="Example application"
```

<a id="config-mailers"></a>

## Mailers and custom names

Import entities from the public module:

```python
from orionis.foundation.config.mail import (
    File, FromAddress, Mail, MailDriver, Mailers, Smtp,
)
```

`Mailers` provides two fields:

| Field | Accepted value | Default |
|---|---|---|
| `smtp` | `Smtp \| dict`. | New `Smtp()` entity. |
| `file` | `File \| dict`. | New `File()` entity. |

Entry dictionaries are converted into the corresponding entities. `None` is not accepted. Factories create independent instances.

For arbitrary names, use a dictionary in **`Mail.mailers`**, rather than adding unknown fields to `Mailers`. This example validates a configuration with two file destinations:

```python
from orionis.foundation.config.mail import Mail


settings = Mail(
    default="archive",
    from_address={"address": "notifications@example.com", "name": "Reports"},
    mailers={
        "archive": {"driver": "file", "path": "storage/mail/archive"},
        "file": {"path": "storage/mail"},
    },
)
```

The `settings` object illustrates the structure; activate it through your application's `BootstrapMail` fields. Entries named `smtp` or `file` can omit `driver` because the manager infers it. A mailer named `archive` needs `driver="file"` even when using the same transport.

Each mapping value must be a dictionary, `Smtp`, or `File`. An SMTP dictionary passes through `Smtp` validation; a file dictionary passes through `File` after removing `driver`. Custom drivers retain their options for the registered factory. The mapping and its nested contents are copied. The manager resolves the selected mailer on each send and gives its factory a normalized, read-only configuration.

<a id="config-file"></a>

## File transport: File

| Field | Variable and default | Type and validation |
|---|---|---|
| `path` | `MAIL_FILE_PATH`; `"storage/mail"`. | Nonempty `str`, not whitespace-only. Incorrect types or blank values raise `ValueError`. |

`File` has no `driver` field: the conventional `file` entry infers it, while mappings with other names must declare it.

```dotenv
MAIL_MAILER=file
MAIL_FILE_PATH=storage/mail
MAIL_FROM_ADDRESS=notifications@example.com
```

The file factory resolves relative paths from the application root. Absolute paths are preserved; anchored but non-absolute Windows paths such as `C:outgoing` are rejected. Transport selection also rejects blank values, incompatible types, and NUL characters. The directory is created when publishing the message, rather than when constructing the entity.

This transport stores `.eml` files instead of delivering mail and needs no SMTP server. See [transports](/en/services/mail/transports-and-extensions#driver-file) for publication and retention behavior.

<a id="config-smtp"></a>

## SMTP transport: Smtp

| Field | Variable and default | Type and purpose |
|---|---|---|
| `driver` | No variable; `"smtp"`. | Must be exactly `"smtp"`; other values raise `TypeError`. |
| `url` | `MAIL_URL`; `""`. | `str`. Optional URL overriding connection fields. |
| `host` | `MAIL_HOST`; `""`. | `str`. SMTP host; required in effective configuration. |
| `port` | `MAIL_PORT`; `587`. | `int`. Effective TCP port from 1 through 65535. |
| `encryption` | `MAIL_ENCRYPTION`; `"TLS"`. | `str`. Case-insensitive `TLS`, `SSL`, `none`, or empty. |
| `username` | `MAIL_USERNAME`; `""`. | `str`. Authentication user; requires a password. |
| `password` | `MAIL_PASSWORD`; `""`. | `str`. Password; requires a username. |
| `timeout` | `MAIL_TIMEOUT`; `None`. | `int \| None`. Positive seconds for socket timeout, or no explicit limit. |

The `Smtp` entity checks types: it accepts empty strings and requires actual integers for port and timeout, rejecting booleans. Ranges, effective host, authentication, and security mode are checked **when selecting the transport** through `SmtpSettings.fromConfig(...)`.

An unused SMTP entry can therefore remain incomplete while using file. A valid URL can also replace a port or mode that will not be used. The URL does not override `timeout`: nonpositive timeouts remain invalid. Entity field types are checked even if the URL later replaces those fields.

### Configure individual fields

```dotenv
MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=notifications@example.com
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_ENCRYPTION=TLS
MAIL_USERNAME=replace-with-username
MAIL_PASSWORD=replace-with-password
MAIL_TIMEOUT=15
```

`TLS` requires STARTTLS rather than implicit TLS. `SSL` selects implicit TLS. `none` or an empty string disables TLS. Changing `MAIL_ENCRYPTION` alone does not change the configured port; choose the appropriate port for your server. Whitespace around the mode is not normalized.

### MAIL_URL precedence

```dotenv
MAIL_URL=smtps://example-user:example-password@smtp.example.com
MAIL_TIMEOUT=15
```

| URL component | Override |
|---|---|
| `smtp://host` | Host; retains configured port and encryption unless explicitly overridden. Does not force plaintext. |
| `smtps://host` | Host, `SSL` mode, and port 465. |
| Explicit port | Overrides the configured port or `smtps` default 465. |
| Present username or password | Replaces **both** fields as a pair; never mixes a URL credential with an environment credential. |
| Timeout | Not a supported URL option; the `timeout` field remains effective. |

Percent-encode reserved characters in usernames and passwords. URLs accept only the `smtp` and `smtps` schemes, a host, and optional port/credentials. Paths, including a trailing slash, queries, fragments, control characters, missing hosts, and invalid ports are rejected. A URL supplying only a username does not inherit `MAIL_PASSWORD`; its resulting credential pair is invalid.

After applying precedence, hosts cannot be empty or contain whitespace, controls, `/`, `\`, or `@`. Port and timeout validation applies to effective options. Empty username and password allow an unauthenticated connection attempt; supplying only one raises `MailConfigurationException`.

### Check settings without connecting

```python
from orionis.mail.entities.smtp_settings import SmtpSettings
from orionis.mail.enums.encryption import MailEncryption


settings = SmtpSettings.fromConfig({
    "url": "smtps://smtp.example.com:8465",
    "host": "unused.example.com",
    "port": 587,
    "encryption": "TLS",
    "username": "",
    "password": "",
    "timeout": 15,
})
assert settings.host == "smtp.example.com"
assert settings.port == 8465
assert settings.encryption is MailEncryption.SSL
```

This block validates and normalizes configuration without connecting or sending mail. The [SMTP transport reference](/en/services/mail/transports-and-extensions#smtp-settings) explains the result and TLS guarantees.

## Customize config/mail.py

This complete file defaults to file for reviewing messages locally while retaining the SMTP entry and its environment factories:

```python
from dataclasses import dataclass, field
from orionis.environment import Env
from orionis.foundation.config.mail import (
    File, FromAddress, Mail, MailDriver, Mailers,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapMail(Mail):
    default: str | MailDriver = field(
        default_factory=lambda: Env.get("MAIL_MAILER", MailDriver.FILE),
    )
    from_address: FromAddress | dict = field(
        default_factory=lambda: FromAddress(
            address=Env.get("MAIL_FROM_ADDRESS", "notifications@example.com"),
            name=Env.get("MAIL_FROM_NAME", Env.get("APP_NAME", "Orionis")),
        ),
    )
    mailers: Mailers | dict = field(
        default_factory=lambda: Mailers(
            file=File(path=Env.get("MAIL_FILE_PATH", "storage/mail")),
        ),
    )
```

For custom mailer names, replace the `mailers` factory with a mapping like the earlier example. Unknown names, unregistered drivers, invalid selected configuration, or invalid factories raise `MailConfigurationException`. Initial entity validation may raise `TypeError` or `ValueError` before sending.

Configuration does not confirm connectivity, credentials, or message receipt. Continue with [transports and extensions](/en/services/mail/transports-and-extensions) and [send results](/en/services/mail/sending-and-results) to understand what an operation actually guarantees.
