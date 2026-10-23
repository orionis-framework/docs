---
title: "Mail technical reference"
description: "Contracts, MIME composition, types, helpers, provider, exceptions and a verified Mail API inventory."
editUrl: true
lastUpdated: false
---

The [sending and results guide](/en/mail/sending-and-results) covers every method of `Mail`, `IMailManager`, `PendingMail` and `Message`. The [mailable guide](/en/mail/composing-mail) explains `Mailable`, `Envelope` and `Address`. This reference covers composition components and lower-level utilities.

## API map

| Component | Documentation |
| --- | --- |
| `MailManager` and `IMailManager` | [Facade, DI and lifecycle](/en/mail/manager-and-injection); [fluent and terminal operations](/en/mail/sending-and-results). |
| `PendingMail`, `Message`, `MailOptions` | [Independent chains, callbacks and precedence](/en/mail/sending-and-results). |
| `Mailable`, `Envelope`, `Address` | [Classes, hooks, recipients and normalization](/en/mail/composing-mail). |
| `Content` | [Text, HTML, views and context](/en/mail/content-and-views). |
| `Attachment` | [Every field and fromStorage()](/en/mail/attachments). |
| `MailResult`, `MailStatus`, `PreparedMail` | [Delivery data and outcomes](/en/mail/sending-and-results). |
| `SmtpSettings`, `MailEncryption` and configuration | [Configuration reference](/en/mail/configuration). |
| `IMailTransport`, `FileTransport`, `SmtpTransport` and factories | [Native transports and extensions](/en/mail/transports-and-extensions). |

The `orionis.mail` package exports `Address`, `Attachment`, `Content`, `Envelope`, `MailResult`, `MailStatus`, `Mailable`, `Message` and `PendingMail`. Import services, contracts and lower-level components from the modules used in their examples. Import the facade from `orionis.support.facades`.

<a id="composer"></a>
<a id="composer-prepare"></a>

## MailComposer

```text
MailComposer(view: IViewEngine, storage: IStorageManager) -> None
async prepare(
    envelope: Envelope,
    content: Content,
    attachments: tuple[Attachment, ...],
) -> PreparedMail
```

The constructor retains view and Storage services, not message state. The provider registers it as a singleton. Each `prepare()` keeps its data local, checks sender and recipients, renders plain text followed by HTML, loads attachments in order and composes the complete MIME through `Loop.execute()` outside the event loop.

`prepare()` does not select a mailer, apply a global sender, deliver SMTP or publish an `.eml`. Those responsibilities belong to the manager and transport. Direct consumers must supply an `Envelope` with its sender and recipients already resolved.

```python
from orionis.mail import Content, Envelope
from orionis.mail.composer import MailComposer


class InspectMail:
    def __init__(self, composer: MailComposer) -> None:
        self.composer = composer

    async def prepare(self) -> dict:
        prepared = await self.composer.prepare(
            Envelope(
                subject="Preview",
                from_address="notifications@example.com",
                to="ana@example.com",
            ),
            Content(text="Hello, Ana.", html="<p>Hello, Ana.</p>"),
            (),
        )
        return {
            "message_id": prepared.message_id,
            "mime_bytes": len(prepared.mime),
            "smtp_utf8": prepared.smtp_utf8,
        }
```

Inject `InspectMail` into an application component. This example only composes and uses no transport. `PreparedMail.mime` contains MIME bytes, rather than an HTTP response or open stream.

### Composition behavior

- Generates Date and Message-ID for each operation. The sender's address supplies the ID domain.
- Preserves text and HTML as MIME alternatives when both exist. Bodies use quoted-printable encoding.
- Adds visible To, Cc and Reply-To headers; Bcc belongs only to the transport envelope's recipient union.
- Detects non-ASCII addr-specs to set `smtp_utf8`; Unicode display names are header-encoded and do not by themselves imply an international mailbox.
- Materializes attachments and complete MIME in memory. See [attachments](/en/mail/attachments) for Storage loading and stream cleanup.
- Wraps rendering failures in `MailCompositionException` with their cause. Attachment loading uses `MailAttachmentException`; type/value errors during MIME encoding become `MailCompositionException`.

The message is prepared before constructing the transport. A view or file error prevents reaching that delivery; it does not imply rollback of other service operations.

## Transport constructors and factories

These components support integrations; the manager already selects them for normal delivery:

```text
FileTransport(path: Path) -> None
create_file_transport(app: IApplication, config: Mapping[str, object]) -> IMailTransport
SmtpTransport(settings: SmtpSettings) -> None
create_smtp_transport(app: IApplication, config: Mapping[str, object]) -> IMailTransport
```

Import file components from `orionis.mail.transports.file` and SMTP components from `orionis.mail.transports.smtp`. The file constructor retains its path; its factory validates `config["path"]` (default `storage/mail`) and anchors relative paths to `app.basePath`. The SMTP constructor retains normalized settings; its factory calls `SmtpSettings.fromConfig(config)`. None of these constructors connects or publishes a message.

Both transports implement `async send(message: PreparedMail, *, mailer: str, driver: str) -> MailResult`. The `message` argument and keyword-only names `mailer` and `driver` are required. File returns confirmed storage; SMTP returns complete or partial acceptance. See [transports](/en/mail/transports-and-extensions) for errors, closing, cancellation and publication differences.

<a id="mail-types"></a>

## Public integration types

In `orionis.mail.types`:

```text
Recipients = str | Address | list[str | Address] | tuple[str | Address, ...]
MessageCallback = Callable[[Message], Message | Awaitable[Message | None] | None]
Delivery = Callable[
    [str | None, Envelope, Content, tuple[Attachment, ...]],
    Awaitable[MailResult],
]
TransportFactory = Callable[
    [IApplication, Mapping[str, object]],
    IMailTransport | Awaitable[IMailTransport],
]
```

`Recipients` describes accepted mailbox declarations. `MessageCallback` receives one direct operation's configurator and returns `None` or that same object, directly or through an awaitable. `Delivery` describes the delivery callback supplied to `PendingMail`: optional mailer name, envelope, content and attachments. `TransportFactory` is the factory contract for `extend()` and must return an instance inheriting `IMailTransport`.

`orionis.mail.composer.LoadedAttachment` declares `tuple[Attachment, bytes, str | None]`: declaration, complete bytes and optional MIME from loading. The composer uses it during MIME preparation; normal consumers declare `Attachment` and leave resolution to the service.

## Validation and snapshot helpers

These public functions are in `orionis.mail.functions` and are synchronous. Higher-level components already use them; you do not need to call them before every send, and they do not add methods to the builder.

<a id="helper-header-value"></a>

### header_value(value: str, label: str) → str

Returns the original text if it contains no Unicode controls, formatting, surrogates or line/paragraph separators. Empty text is valid, such as an empty subject. An incorrect type or rejected character raises `MailCompositionException`; `label` identifies the field in diagnostics.

```python
from orionis.mail.functions import header_value

assert header_value("Monthly report", "Subject") == "Monthly report"
assert header_value("", "Subject") == ""
```

<a id="helper-attachment-name"></a>

### attachment_name(value: str) → str

Validates the visible filename and returns it unchanged. Rejects controls, empty/whitespace-only values, `.`/`..` and `/`, `\` or `:`. Does not accept a full path. Invalid values raise `MailAttachmentException`.

```python
from orionis.mail.functions import attachment_name

assert attachment_name("Annual report.pdf") == "Annual report.pdf"
```

<a id="helper-media-type"></a>

### media_type(value: str) → str

Returns a lowercase `type/subtype` pair. Requires two nonempty MIME tokens; rejects parameters such as `; charset=utf-8`, spaces or a string without `/`. Invalid values raise `MailAttachmentException`. This validates the label without inspecting file bytes.

```python
from orionis.mail.functions import media_type

assert media_type("Application/PDF") == "application/pdf"
```

<a id="helper-freeze-owned"></a>

### freeze_owned(value: object, active: frozenset[int] = frozenset()) → object

Recursively snapshots owned containers: mappings become `MappingProxyType`, lists/tuples become tuples and sets/frozensets become frozensets. Opaque objects retain their identity. Cyclic containers raise `MailCompositionException`; `active` tracks ancestors during recursion and normally keeps its default. This does not deeply copy every service or business object.

```python
from orionis.mail.functions import freeze_owned

source = {"tags": ["receipt"]}
snapshot = freeze_owned(source)
source["tags"].append("updated")
assert snapshot["tags"] == ("receipt",)
```

<a id="helper-sanitize-reason"></a>

### sanitize_reason(value: str | bytes, sensitive: tuple[str, ...] = ()) → str

Decodes UTF-8 bytes with replacement, redacts declared nonempty secrets longest-first, replaces rejected controls with spaces and limits output to 512 characters. Only supplied secrets are redacted. `MailResult` removes controls and bounds reasons; transports must redact credentials before constructing it.

```python
from orionis.mail.functions import sanitize_reason

reason = sanitize_reason(b"Rejected\r\ncredential=example-secret", ("example-secret",))
assert "example-secret" not in reason
assert "\r" not in reason and "\n" not in reason
```

The address helpers `one_address()` and `addresses()` are documented with signatures and examples under [Address](/en/mail/composing-mail#address).

<a id="provider"></a>

## MailProvider

`register() -> None` binds `MailComposer` and `IMailManager → MailManager` as singletons. `async boot() -> None` runs `await Mail.pin()`. This is an ordinary native provider, without deferred resolution. Standard application registration already includes it; do not add another instance per request.

<a id="facade-accessor"></a>

## Mail.getFacadeAccessor() → type[IMailManager]

This class method returns the contract through which the facade resolves its manager. It does not read configuration or send a message. Inherited facade methods allow explicit service resolution; see [Mail and DI usage](/en/mail/manager-and-injection) for suitable contexts.

<a id="exceptions"></a>

## Exceptions

| Class | Purpose |
| --- | --- |
| `MailException` | Common subsystem base. |
| `MailConfigurationException` | Invalid mailer, driver, factory or settings. |
| `MailCompositionException` | Invalid declarations, callbacks, addresses, views or MIME. |
| `MailAttachmentException` | Composition subclass for attachment metadata or loading. |
| `MailTransportException` | Delivery/publication failure; does not guarantee the server received no data. |

These classes provide no retry method or public rollback attribute. Context and the original cause may accompany an exception. A partial SMTP result carries its own data in `MailResult`; it does not simply represent “nothing sent.” See [results and errors](/en/mail/sending-and-results).

## Coverage and maintenance

The [downloadable inventory](/downloads/mail-api-inventory.json) maps own public declarations to their signatures, file, line, checksum and ES/EN section. Includes overloads, type aliases, fields, contracts and implementations; dataclass-generated methods are explained through their fields. Excludes private implementation and inherited API from components outside this module. Operations inherited by `MailManager` from `PendingMail` are documented once in the sending guide.
