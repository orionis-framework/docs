---
title: "Mail facade and injection"
description: "Use Mail and IMailManager in controllers, services, providers and Mailable constructors."
editUrl: true
lastUpdated: false
---

The `Mail` facade and `IMailManager` contract access the same application manager. Import the facade from `orionis.support.facades`; use `orionis.mail.contracts.manager.IMailManager` for injection.

<a id="facade"></a>

## Facade in a booted application

`MailProvider` boots with the native providers, registers the manager and pins the facade. Fluent methods are synchronous; terminal methods `send()`, `raw()` and `html()` require `await`.

```python
from orionis.http import JSONResponse
from orionis.support.facades import Mail


class PreviewMailController:
    async def __call__(self) -> JSONResponse:
        result = await (
            Mail.mailer("file")
            .fromAddress("notifications@example.com", "Example App")
            .to("ana@example.com", "Ana")
            .subject("Preview")
            .raw("This message is stored locally.")
        )
        return JSONResponse({"status": result.status.value})
```

No global sender is required here because the chain supplies one. It selects `file`, publishing an `.eml` without sending to an SMTP server. See [configuration](/en/services/mail/configuration) for the directory and filesystem requirements.

If a custom bootstrap has not pinned the facade yet, resolve `mail = await Mail.resolve()` before chaining `mail.to(...)`. Importing the class in an external script does not boot the application or its services. Standard startup already pins the mail facade through its provider.

<a id="injection"></a>

## Constructor injection

Receive the contract when several controller operations need mail. Save this example in `app/http/controllers/receipt_mail_controller.py`:

```python
from orionis.http import JSONResponse
from orionis.mail.contracts.manager import IMailManager


class ReceiptMailController:
    def __init__(self, mail: IMailManager) -> None:
        self.mail = mail

    async def preview(self, order_id: int) -> JSONResponse:
        result = await (
            self.mail.mailer("file")
            .fromAddress("billing@example.com", "Billing")
            .to("ana@example.com")
            .subject(f"Receipt {order_id}")
            .raw(f"Your order number is {order_id}.")
        )
        return JSONResponse({
            "message_id": result.message_id,
            "status": result.status.value,
        })
```

Register the action in the configured API route file:

```python
from app.http.controllers.receipt_mail_controller import ReceiptMailController
from orionis.support.facades import Route

Route.post("/receipts/{order_id:int}/mail-preview", [ReceiptMailController, "preview"])
```

The container constructs the controller, resolves `IMailManager` and supplies `order_id` from the route. `mail` is not a request field. Authorization and business recipient selection belong to the consuming component; this example demonstrates a local preview with explicit data.

## Method injection

If only one action needs mail, declare the dependency on it:

```python
from orionis.http import JSONResponse
from orionis.mail.contracts.manager import IMailManager


class AnnouncementController:
    async def __call__(self, mail: IMailManager) -> JSONResponse:
        result = await (
            mail.mailer("file")
            .fromAddress("news@example.com")
            .to("ana@example.com")
            .subject("Announcement")
            .html("<h1>New features</h1><p>Your account is ready.</p>")
        )
        return JSONResponse({"status": result.status.value})
```

Register it as an invokable controller following [controllers](/en/http/request-lifecycle). Injection happens when the container invokes the action. Calling `controller.__call__()` directly requires supplying the argument yourself.

## Application services

The same contract works in service constructors built by the container. Controllers, commands, jobs or MCP components supporting injection can consume them:

```python
from orionis.mail import Content, MailResult
from orionis.mail.contracts.manager import IMailManager


class ReceiptMailer:
    def __init__(self, mail: IMailManager) -> None:
        self.mail = mail

    async def preview(self, order_id: int, recipient: str) -> MailResult:
        return await (
            self.mail.mailer("file")
            .fromAddress("billing@example.com")
            .to(recipient)
            .subject(f"Receipt {order_id}")
            .send(Content(text=f"Receipt for order {order_id}."))
        )
```

Receive `ReceiptMailer` in the consuming component and await its operation. The manager is shared, but each fluent configuration returns a new chain: keep that chain. A callback's `Message` belongs to one operation and mutates differently; see [sending and results](/en/services/mail/sending-and-results).

## Dependencies in a Mailable class

When sending **the class**, the manager calls `app.build()` to construct a fresh instance and resolve constructor dependencies:

```python
from orionis.mail import Content, Envelope, Mailable, MailResult
from orionis.mail.contracts.manager import IMailManager


class PublicStatus:
    def description(self) -> str:
        return "All services are operational."


class StatusMail(Mailable):
    def __init__(self, status: PublicStatus) -> None:
        self.status = status

    def envelope(self) -> Envelope:
        return Envelope(subject="Service status")

    def content(self) -> Content:
        return Content(text=self.status.description())


class StatusMailer:
    def __init__(self, mail: IMailManager) -> None:
        self.mail = mail

    async def preview(self) -> MailResult:
        return await (
            self.mail.mailer("file")
            .fromAddress("status@example.com")
            .to("ana@example.com")
            .send(StatusMail)
        )
```

`PublicStatus` is a concrete dependency-free service the container can construct. For a custom contract, register its implementation as explained in the [container guide](/en/architecture/service-container).

The hooks `envelope()`, `content()` and `attachments()` are **synchronous** and receive no extra arguments. They are called directly, without method injection or awaiting their results. If you need data from asynchronous I/O, prepare it in your service and pass a Mailable **instance** holding those values. Sending an instance does not rebuild it or retroactively inject its dependencies.

<a id="manager-construction"></a>

## Manager lifecycle

```text
MailManager(app: IApplication, composer: MailComposer) -> None
```

Retains the application, composer and a factory registry. Inherits from `PendingMail` to provide fluent and terminal operations and implements `IMailManager`. The [sending API](/en/services/mail/sending-and-results) documents all those methods; [extend()](/en/services/mail/transports-and-extensions#custom-transports) registers additional implementations.

On each delivery, the manager reads `app.config("mail")`, selects the mailer and driver, adds a global sender when absent, composes the entire message and then constructs the transport. It retains **factories**, not an SMTP connection or transport instance reused across sends. A factory may be synchronous or asynchronous and must return an `IMailTransport`.

## Using it from a provider

The native provider binds `MailComposer → MailComposer` and `IMailManager → MailManager` as singletons; the composer needs `IViewEngine` and `IStorageManager`. You do not need to repeat these bindings.

If a custom provider configures a driver, use `mail = await self.app.make(IMailManager)` in its asynchronous hook and call `mail.extend(...)` with a real factory. The `register()` and `boot()` hooks do not receive automatic dependencies like HTTP actions. Register extensions before using them and see the [complete transport example](/en/services/mail/transports-and-extensions#custom-transports).
