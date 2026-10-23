---
title: "Attachments from Storage"
description: "Declare Storage files as attachments, select filenames and MIME types, and control reading and resource ownership."
editUrl: true
lastUpdated: false
---

Mail attachments declare files from Storage. They are validated when declared and read later during message preparation, before the transport runs. The same declaration can use a local or cloud disk through the Storage contract.

<a id="attachment"></a>

## Attachment: declaration and fields

`Attachment` is exported from `orionis.mail`. It is an immutable dataclass accepting keyword-only arguments:

```text
Attachment(
    *,
    path: str,
    disk: str | None = None,
    name: str | None = None,
    mime_type: str | None = None,
)
```

| Field | Purpose and default |
|---|---|
| `path` | Required. Logical file path within the disk, normalized using Storage rules. |
| `disk` | `None` selects Storage's default disk. A string selects a configured disk and cannot be blank. |
| `name` | `None` uses the final path segment as the visible filename. Explicit names must be safe basenames without directories. |
| `mime_type` | `None` lets Storage metadata and inference choose. Explicit values must be parameter-free `type/subtype` pairs and are lowercased. |

```python
from orionis.mail import Attachment


report = Attachment(
    path="reports/monthly.csv",
    disk="local",
    name="monthly-report.csv",
    mime_type="text/csv",
)
```

The visible name does not rename or copy the original file. A valid declaration can refer to a file that does not yet exist; access and permissions are checked when preparing the send.

<a id="attachment-fromstorage"></a>

## fromStorage(): the available factory

```text
Attachment.fromStorage(
    path: str,
    *,
    disk: str | None = None,
    name: str | None = None,
    mime_type: str | None = None,
) -> Attachment
```

This class factory returns the same validated declaration as the constructor:

```python
from orionis.mail import Attachment


report = Attachment.fromStorage(
    "reports/monthly.csv",
    disk="local",
    name="monthly-report.csv",
    mime_type="text/csv",
)
```

Calling it neither reads the file, downloads a cloud object, nor materializes its bytes. `fromStorage()` is `Attachment`'s only native factory.

## Save and attach through facades

This service creates a file using Storage and selects the file transport to preview mail locally:

```python
from orionis.mail import Attachment, MailResult
from orionis.support.facades import Mail, Storage


class ReportPreview:
    async def save(self) -> MailResult:
        storage = await Storage.resolve()
        report = await storage.disk("local").put(
            "reports/monthly.csv",
            "month,total\nJanuary,120\n",
        )
        mail = await Mail.resolve()
        return await (
            mail.mailer("file")
            .fromAddress("reports@example.com")
            .to("reader@example.com")
            .subject("Monthly report")
            .attach(Attachment.fromStorage(
                report.path(),
                disk="local",
                name="monthly-report.csv",
                mime_type="text/csv",
            ))
            .raw("The report is attached.")
        )
```

Managers are resolved before calling synchronous selection methods. The example retains the report in Storage; Mail does not delete its source. The resulting `.eml` contains complete bytes and can be inspected without contacting an SMTP server.

## Bytes, streams, and other sources

| Available source | Implemented integration |
|---|---|
| Logical Storage path | `Attachment(...)` or `Attachment.fromStorage(...)`. |
| Generated `bytes` or text | Save with `disk.put(...)` or `file.write(...)`, then declare its path. |
| Asynchronous byte producer | Persist through `file.writeStream(...)`, then attach the Storage file. |
| HTTP upload | Validate and persist through the [Storage upload API](/en/services/storage/streaming-and-uploads) before declaring it. |
| External native path, open handle, or URL | No direct factory accepts these sources. Import content into a configured disk before attaching it. |

`attach()` takes an `Attachment` instance; `bytes`, `File`, `Path`, and stream objects are not automatically converted. There are no `fromBytes()`, `fromPath()`, `fromStream()`, or `fromUrl()` methods in this API.

### Injection and temporary working files

This component receives both services through its constructor, generates CSV chunks, and removes its working file when the operation finishes:

```python
from collections.abc import AsyncIterator
from uuid import uuid4
from orionis.mail import Attachment, MailResult
from orionis.mail.contracts import IMailManager
from orionis.storage.contracts import IStorageManager


async def report_chunks() -> AsyncIterator[bytes]:
    yield b"id,total\n"
    yield b"1,120\n"


class GeneratedReportPreview:
    def __init__(self, mail: IMailManager, storage: IStorageManager) -> None:
        self.mail = mail
        self.storage = storage

    async def save(self) -> MailResult:
        report = self.storage.disk("local").file(f"mail-work/{uuid4().hex}.csv")
        try:
            await report.writeStream(report_chunks())
            return await (
                self.mail.mailer("file")
                .fromAddress("reports@example.com")
                .to("reader@example.com")
                .subject("Generated report")
                .attach(Attachment.fromStorage(
                    report.path(),
                    disk="local",
                    name="report.csv",
                    mime_type="text/csv",
                ))
                .raw("The generated report is attached.")
            )
        finally:
            await report.delete()
```

Cleanup belongs to the component that created the file. Deletion errors can propagate; this is neither a mail transaction nor a delivery rollback. For retries, retain the source or ensure it can be regenerated. See [Storage contexts and temporary files](/en/services/storage/temporary-files-and-contexts).

## Attachments in a Mailable

Return a sequence from the **synchronous** `attachments()` method:

```python
from orionis.mail import Attachment, Content, Envelope, Mailable


class MonthlyReportMail(Mailable):
    def envelope(self) -> Envelope:
        return Envelope(subject="Monthly report")

    def content(self) -> Content:
        return Content(
            text="The report is attached.",
            html="<p>The report is attached.</p>",
        )

    def attachments(self) -> tuple[Attachment, ...]:
        return (
            Attachment.fromStorage(
                "reports/monthly.csv",
                disk="local",
                mime_type="text/csv",
            ),
        )
```

The send must supply a sender and recipients through configuration or a manager chain. Mailable attachments precede those added through `.attach(...)`, retaining their order. They are not deduplicated: declaring the same file twice produces two MIME parts. See [message composition](/en/services/mail/composing-mail).

## Reading, MIME, and resource ownership

During preparation, the composer selects `storage.disk(attachment.disk).file(attachment.path)`. Without an explicit MIME type, it queries `file.mimeType()`; if the driver reports that operation unsupported, preparation continues without that metadata.

MIME selection follows this priority:

1. Explicit declaration `mime_type`.
2. Storage-provided type.
3. Type inferred from the visible attachment filename.
4. `application/octet-stream` when none is available.

Storage metadata must also be a valid `type/subtype` pair; invalid metadata fails rather than being treated as missing. This selection does not verify that the bytes match the declared type.

The composer opens the file with `open("rb")`, reads every byte, and closes the stream. Empty files are valid attachments. Opening, reading, metadata, or closure errors interrupt preparation with `MailAttachmentException`; no transport is opened for that message.

Mail creates and closes its own stream rather than taking ownership of a handle you opened. Reading does not delete or move the source. If the caller is canceled, Mail waits for its owned reading task to finish and release the stream before propagating cancellation.

Even if generated or stored in chunks, composition **materializes every attachment and the final MIME in memory**. It is not a chunked SMTP transfer from Storage. Size attachments with MIME encoding overhead and server limits in mind.

### Safe metadata

Paths are logically normalized, rejecting escapes above the disk root and forbidden characters. Visible names must be nonempty basenames: separators `/`, `\`, `:`, the names `.`/`..`, and control characters are rejected. MIME parameters such as `text/plain; charset=utf-8` are unsupported.

## Inline image and CID limits

Every part is generated with `Content-Disposition: attachment` and a filename. There are no `disposition`/`cid` fields, no generated `Content-ID`, and no `inline()` method. Attaching an image does not make an HTML reference such as `cid:logo` a working embedded image.

For a remote HTML image, use an accessible HTTP URL and publish the resource separately, for example through a public Storage disk. The mail client decides whether to load remote images; Mail neither creates that URL nor grants access. A custom transport receives already-composed MIME, so registering one does not itself add inline composition support.
