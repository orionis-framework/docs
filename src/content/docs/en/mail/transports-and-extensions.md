---
title: "Configuring SMTP, file, and custom transports"
description: "How SMTP and file transports work, effective security settings, and custom transport registration."
editUrl: true
lastUpdated: false
---

Mail separates message declarations, MIME composition, and transport. The manager resolves a mailer from [config/mail.py](/en/mail/configuration), prepares every body and attachment, and only then creates and invokes its transport.

## Mailer and driver

A **mailer** is an entry in `mail.mailers`; a **driver** identifies its implementation. Multiple mailers can use `driver="file"` or `driver="smtp"` with different settings. Selecting `mailer("archive")` does not register a new transport.

The built-in drivers are `smtp` and `file`. The manager infers those drivers only for entries named exactly `smtp` or `file`; every other mailer needs an explicit `driver`.

| Driver | Dependencies | Confirmed result |
|---|---|---|
| `smtp` | Python's `smtplib`, `ssl`, and `email`; an accessible SMTP server. | Complete or partial SMTP acceptance rather than final mailbox receipt. |
| `file` | Writable filesystem supporting hard links. | MIME published as an `.eml` file rather than sent to a server. |

No Orionis extras are required for these transports. The view engine and Storage are integrated framework services; cloud storage drivers used by attachments retain their [own dependencies](/en/storage/disks-and-drivers). Installing another mail SDK does not automatically register it as a transport.

<a id="driver-smtp"></a>

## SMTP: connection and delivery

The transport uses effective `SmtpSettings`. Each send creates its own client and moves blocking work off the event loop through Orionis's executor:

1. Constructs `SMTP_SSL` for `SSL`, or `SMTP` for `TLS`/`none`.
2. Connects to host and port, requiring an SMTP 220 greeting.
3. Negotiates through `ehlo_or_helo_if_needed()`.
4. In `TLS` mode, runs STARTTLS and negotiates capabilities again.
5. Authenticates with username/password when a username is present.
6. Checks SMTPUTF8 and 8BITMIME when the message's addresses require them.
7. Calls `sendmail()` with the sender and recipient union from its envelope.
8. Closes the client in `finally`, including on errors.

The transport envelope includes Bcc even though MIME has no Bcc header. A Unicode display name is encoded as a header and does not alone require SMTPUTF8. International addresses remaining non-ASCII require both server extensions.

### Security modes

| Effective mode | Behavior |
|---|---|
| `TLS` / `MailEncryption.TLS` | Initial normal connection followed by mandatory STARTTLS. Failure does not continue in plaintext. |
| `SSL` / `MailEncryption.SSL` | Implicit TLS through `SMTP_SSL`. |
| `none` or empty string / `MailEncryption.NONE` | No transport-requested TLS. |

Modes are case-insensitive but whitespace is not trimmed. TLS uses the system trust context, verifies certificates and hostnames, and requires at least TLS 1.2. The transport exposes no option to bypass verification.

Username and password must both be present or both empty. No alternate authentication or encryption mode is detected after failure. `timeout` is a positive integer or `None`; `None` sets no explicit socket wait limit. It is not a global deadline for every stage of a send.

### Results, failures, and cancellation

A transaction with no rejected recipients returns `MailStatus.ACCEPTED`; mixed acceptance and rejection returns `PARTIAL`. Rejecting every recipient raises `MailTransportException`. The [results guide](/en/mail/sending-and-results) explains `MailResult` fields.

Connection, STARTTLS, authentication, and transaction failures become `MailTransportException` identifying the stage and SMTP code when available. Public diagnostics omit full server responses and credentials; rejection reasons are bounded, converted to one line, and redacted using known sensitive values.

There is no automatic retry. An exception or cancellation does not prove server rejection: it may have accepted the message before confirmation was lost. Canceling the caller also does not necessarily stop the worker or cancel an in-progress SMTP transaction. Define retries with partial acceptance and possible duplicates in mind.

<a id="smtp-settings"></a>

## SmtpSettings: effective options

`SmtpSettings.fromConfig(config: Mapping[str, object]) -> SmtpSettings` combines fields and URL, validates the result, and returns an immutable dataclass without connecting. Use this factory for operational settings; direct dataclass construction does not run that normalization.

| Result field | Meaning |
|---|---|
| `host` | Effective host from URL or individual field. |
| `port` | Effective integer port from 1 through 65535. |
| `encryption` | `MailEncryption.TLS`, `SSL`, or `NONE`. |
| `username` | Effective username; excluded from `repr`. |
| `password` | Effective password; excluded from `repr`. |
| `timeout` | Positive integer seconds or `None`. |
| `sensitive` | URL and credential variants used to redact diagnostics; excluded from `repr`. |

`smtps://` forces `SSL` and port 465 unless a port is explicit. `smtp://` retains configured encryption and port when the URL does not replace them. URL credentials replace both fields as a pair; timeout remains independent. See the [complete precedence table](/en/mail/configuration#config-smtp).

```python
from orionis.mail.entities.smtp_settings import SmtpSettings
from orionis.mail.enums.encryption import MailEncryption


def validate_smtp_options() -> SmtpSettings:
    settings = SmtpSettings.fromConfig({
        "url": "smtps://smtp.example.com",
        "port": 587,
        "encryption": "TLS",
        "username": "",
        "password": "",
        "timeout": 15,
    })
    assert settings.port == 465
    assert settings.encryption is MailEncryption.SSL
    return settings
```

Hiding fields from `repr` does not make configuration a secret store; avoid logging complete mappings, URLs, or the `sensitive` field.

<a id="driver-file"></a>

## File: preview or archive messages

Configure local storage before startup:

```dotenv
MAIL_MAILER=file
MAIL_FROM_ADDRESS=notifications@example.com
MAIL_FILE_PATH=storage/mail
```

This service receives the manager through injection and explicitly selects file; it only publishes a local file:

```python
from orionis.mail.contracts import IMailManager
from orionis.mail.entities.result import MailResult


class LocalMailPreview:
    def __init__(self, mail: IMailManager) -> None:
        self.mail = mail

    async def save(self) -> MailResult:
        return await (
            self.mail.mailer("file")
            .fromAddress("notifications@example.com", "Example")
            .to("reader@example.com")
            .subject("Preview")
            .raw("This message is stored locally.")
        )
```

The transport creates its output directory when publishing. Relative paths resolve from the application root; absolute paths are preserved. Its factory rejects anchored but relative Windows paths. It does not use a Storage disk to publish `.eml`: `MAIL_FILE_PATH` directly configures the destination.

### Publication and retention

The worker writes complete MIME to a private temporary file in the output directory, calls `flush()` and `fsync()`, then publishes a random filename through a hard link. It never replaces an existing file; a collision or filesystem lacking hard-link support raises `MailTransportException`. The temporary is removed in `finally` when possible. Cleanup is not guaranteed if the filesystem also rejects deletion.

Only after publication does it return `MailStatus.STORED` with `file_path`. This implies neither SMTP acceptance nor delivery. A new final directory is created with mode `0700`; effective permissions depend on the operating system, and existing directory permissions are not rewritten.

Files contain bodies, visible addresses, and every encoded attachment. Published `.eml` files have no automatic rotation, retention, or cleanup. Define those policies for the destination. Cancellation may return control to the caller while the worker finishes publishing and cleaning its temporary file.

<a id="custom-transports"></a>

## Register custom transports

The actual contract is:

```text
async IMailTransport.send(
    message: PreparedMail,
    *,
    mailer: str,
    driver: str,
) -> MailResult
```

The transport receives complete MIME, `message_id`, sender, recipients, and `smtp_utf8` through `PreparedMail`. It receives no views, controllers, or Storage paths. Use `message.sender` and `message.recipients` for the envelope; rebuilding recipients from visible headers would lose Bcc.

`extend(driver, factory)` accepts a synchronous or asynchronous factory with arguments `(app, normalized_config)`. It must return an **`IMailTransport` instance**, rather than just an object exposing `send`. The factory runs per send after MIME preparation. It can resolve container services; an implementation needing shared connections must manage their lifecycle.

### Reuse file through a custom driver

This factory retains `FileTransport`'s publication behavior:

```python
from collections.abc import Mapping
from orionis.container.providers import ServiceProvider
from orionis.foundation.contracts.application import IApplication
from orionis.mail.contracts import IMailManager, IMailTransport
from orionis.mail.transports.file import create_file_transport


def create_archive_transport(
    app: IApplication,
    config: Mapping[str, object],
) -> IMailTransport:
    return create_file_transport(app, config)


class ArchiveMailProvider(ServiceProvider):
    async def boot(self) -> None:
        mail: IMailManager = await self.app.make(IMailManager)
        mail.extend("custom_archive", create_archive_transport)
```

Add `ArchiveMailProvider` to the existing `app.withProviders(...)` call in `bootstrap/app.py`. Configure an entry with explicit name and driver in the `BootstrapMail.mailers` factory:

```python
def archive_mailers() -> dict:
    return {
        "archive": {"driver": "custom_archive", "path": "storage/mail/archive"},
        "file": {"driver": "file", "path": "storage/mail"},
    }
```

Use `archive_mailers` as that field's `default_factory` and select `MAIL_MAILER=archive`, or call `mail.mailer("archive")` for one operation. The provider registered the driver implementation; the mailer name only selects configuration.

Registration rejects blank names, non-callable factories, duplicates, and the built-in `smtp`/`file` drivers rather than replacing them. Register extensions once during startup, before concurrent sends. The manager adds no retry, fallback, queue, or automatic closure for custom transports; their results must represent actual evidence of acceptance or storage.

See [attachments from Storage](/en/mail/attachments) for preparation before transport and the [technical reference](/en/mail/api-reference) for contracts.
