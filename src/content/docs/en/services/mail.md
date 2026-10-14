---
title: "Mail"
description: "Send application notifications with Mail, either as literal text/HTML or reusable Mailable classes. Orionis composes MIME messages and delivers them through SMTP or stores .eml…"
editUrl: true
lastUpdated: false
---

Send application notifications with `Mail`, either as literal text/HTML or reusable `Mailable` classes. Orionis composes MIME messages and delivers them through SMTP or stores `.eml` files for development.

## Prepare and inspect your first message

Start with the file mailer so you can inspect the message without an SMTP account. Add these values to your application's `.env` before startup:

```dotenv
MAIL_MAILER=file
MAIL_FROM_ADDRESS=notifications@example.com
MAIL_FROM_NAME="Example App"
MAIL_FILE_PATH=storage/mail
```

The directory must be writable and its filesystem must support hard links. The standard application must have its mail, view, and storage providers available; simply importing `Mail` in an unrelated script does not bootstrap them.

Use this function inside an async controller, command, or service of the booted application:

```python
from orionis.mail import MailResult
from orionis.support.facades import Mail


async def send_welcome(recipient: str, name: str) -> MailResult:
    return await (
        Mail.to(recipient)
        .subject("Welcome")
        .raw(f"Welcome, {name}.")
    )
```

Supply the recipient's real address and call `await send_welcome(address, name)` from that application context. With `MAIL_MAILER=file`, the result has status `stored` and a `file_path` pointing to the complete `.eml`. Open that file in a mail client or inspect its source. This does not deliver anything to the recipient.

For actual delivery, configure the [SMTP transport](/en/services/mail/transports-and-extensions) and select `MAIL_MAILER=smtp`. SMTP acceptance is evidence that the server accepted the message, not confirmation of mailbox delivery.

## Choose the next step

1. [Declare messages](/en/services/mail/composing-mail): reusable mailables, templates, recipients, and storage attachments.
2. [Send and handle results](/en/services/mail/sending-and-results): immutable chains, callbacks, partial delivery, and failures.
3. [Configure transports](/en/services/mail/transports-and-extensions): SMTP settings, file output, and custom drivers.

For work that must survive a process restart, dispatch a [durable job](/en/asynchronous/queues) that reconstructs and sends the message. Sending mail and committing a database transaction are separate effects.
