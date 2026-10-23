---
title: "Fachada e inyección de Mail"
description: "Utiliza Mail e IMailManager en controladores, servicios, providers y constructores de clases Mailable."
editUrl: true
lastUpdated: false
---

La fachada `Mail` y el contrato `IMailManager` acceden al mismo manager de la aplicación. Importa la fachada desde `orionis.support.facades`; para inyección utiliza `orionis.mail.contracts.manager.IMailManager`.

<a id="facade"></a>

## Fachada en una aplicación iniciada

`MailProvider` se inicia con los providers nativos, registra el manager y fija la fachada. Sus métodos fluidos son síncronos; los terminales `send()`, `raw()` y `html()` requieren `await`.

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

El ejemplo no necesita remitente global porque lo declara en la cadena. Selecciona `file`, que publica un `.eml` y no envía a un servidor SMTP. La guía de [configuración](/es/services/mail/configuration) explica el directorio y los requisitos del filesystem.

Si utilizas un arranque personalizado y todavía no se ha fijado la fachada, resuelve `mail = await Mail.resolve()` antes de encadenar `mail.to(...)`. Importar la clase en un script externo no inicia la aplicación ni sus servicios. En el arranque estándar la fachada ya queda fijada por el provider de correo.

<a id="injection"></a>

## Inyección por constructor

Recibe el contrato cuando varias operaciones del controlador necesitan correo. Guarda este ejemplo en `app/http/controllers/receipt_mail_controller.py`:

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

Registra la acción en el archivo de rutas API configurado:

```python
from app.http.controllers.receipt_mail_controller import ReceiptMailController
from orionis.support.facades import Route

Route.post("/receipts/{order_id:int}/mail-preview", [ReceiptMailController, "preview"])
```

El contenedor construye el controlador, resuelve `IMailManager` y aporta `order_id` a la acción desde la ruta. `mail` no es un campo de la petición. Aplicar autorización y elegir el destinatario según tu negocio corresponde al componente que llama al servicio; este ejemplo muestra una previsualización local con datos explícitos.

## Inyección por método

Si solo una acción necesita correo, declara la dependencia en ella:

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

Registra la clase como controlador invokable según [controladores](/es/http/request-lifecycle). La inyección ocurre cuando el contenedor invoca la acción. Una llamada Python directa a `controller.__call__()` requiere que tú aportes el argumento.

## Servicios de aplicación

El mismo contrato funciona en constructores de servicios que construya el contenedor. Estos pueden consumirse desde controladores, comandos, jobs o MCP con soporte de inyección:

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

Recibe `ReceiptMailer` en el componente consumidor y espera su operación. El manager es compartido, pero cada configuración fluida devuelve una cadena nueva: conserva esa cadena. Un `Message` de callback pertenece a una sola operación y se modifica de forma distinta; consulta [envío y resultados](/es/services/mail/sending-and-results).

## Dependencias en una clase Mailable

Cuando envías **la clase**, el manager llama a `app.build()` para construir una instancia nueva y resolver sus dependencias de constructor:

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

`PublicStatus` es un servicio concreto sin dependencias que el contenedor puede construir. Si utilizas un contrato propio, registra su implementación como explica el [contenedor](/es/architecture/service-container).

Los hooks `envelope()`, `content()` y `attachments()` son **síncronos**, sin parámetros adicionales. Se llaman directamente, sin inyección de método; tampoco se espera un resultado awaitable. Si necesitas datos obtenidos con I/O asíncrono, prepáralos en tu servicio y pasa una **instancia** de Mailable con esos datos. Enviar una instancia no vuelve a construirla ni inyecta retroactivamente sus dependencias.

<a id="manager-construction"></a>

## Ciclo de vida del manager

```text
MailManager(app: IApplication, composer: MailComposer) -> None
```

Conserva la aplicación, el composer y un registro de factorías. Hereda de `PendingMail` para ofrecer las operaciones fluidas y terminales, y cumple `IMailManager`. La [API de envío](/es/services/mail/sending-and-results) documenta todos esos métodos; [extend()](/es/services/mail/transports-and-extensions#custom-transports) registra implementaciones adicionales.

El manager lee `app.config("mail")` en cada entrega, selecciona mailer y driver, incorpora el remitente global si falta, compone todo el mensaje y después construye el transporte. Conserva las **factorías**, no una conexión SMTP ni una instancia de transporte reutilizada entre envíos. La factoría puede ser síncrona o asíncrona y debe devolver un `IMailTransport`.

## Utilizarlo desde un provider

El provider nativo registra `MailComposer → MailComposer` e `IMailManager → MailManager` como singletons; el composer requiere `IViewEngine` e `IStorageManager`. No necesitas repetir estos bindings.

Si un provider propio necesita configurar un driver, utiliza `mail = await self.app.make(IMailManager)` dentro de su hook asíncrono y llama a `mail.extend(...)` con una factoría real. Los hooks `register()` y `boot()` no reciben automáticamente dependencias como las acciones HTTP. Registra extensiones antes de utilizarlas y consulta el [ejemplo completo de transporte](/es/services/mail/transports-and-extensions#custom-transports).
