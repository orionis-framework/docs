---
title: "Crear clases de correo"
description: "Genera clases Mailable, declara destinatarios con Envelope y normaliza direcciones con Address."
editUrl: true
lastUpdated: false
---

Un `Mailable` reúne el asunto, los destinatarios, el contenido y los adjuntos de una notificación reutilizable. Sus métodos declaran el mensaje; el envío asíncrono se encarga después de renderizar las vistas, leer los adjuntos y entregar el MIME al transporte. Así puedes mantener una bienvenida o confirmación fuera del controlador.

Para un mensaje puntual, consulta [envío y resultados](/es/mail/sending-and-results). La selección del mailer se explica en [configuración](/es/mail/configuration).

## Generar una clase

Desde la raíz del proyecto, utiliza cualquiera de estas alternativas:

```bash
orionis make:mail welcome
```

```bash
python -B reactor make:mail welcome
```

La sintaxis es `make:mail name`. `name` es un argumento posicional obligatorio de tipo `str`; el comando no incorpora opciones adicionales a `-h` / `--help` ni una opción para sobrescribir. El destino es `app.path("app_notifications")`, que en la estructura predeterminada corresponde a `app/notifications`.

| Entrada | Archivo predeterminado | Clase |
| --- | --- | --- |
| `welcome` | `app/notifications/welcome_mail.py` | `WelcomeMail` |
| `billing/invoice` | `app/notifications/billing/invoice_mail.py` | `InvoiceMail` |
| `welcome_mail` | `app/notifications/welcome_mail.py` | `WelcomeMail` |

El generador acepta subdirectorios con `/` o `\`, crea los directorios necesarios y elimina una extensión indicada en el último componente. Convierte archivos y directorios a minúsculas y añade `_mail` al archivo y `Mail` a la clase cuando falta. La clase se forma a partir de componentes separados por `_`: usa `order_ready` para obtener `OrderReadyMail`. No convierte automáticamente CamelCase a snake_case: `WelcomeMail` produce `welcomemail.py`.

Los componentes normalizados deben cumplir `[a-z][a-z0-9_]*`. No se admiten rutas absolutas ni componentes vacíos, `.` o `..`. Un archivo existente causa un error; no se reemplaza.

La plantilla genera un constructor que recibe `IApplication`, `envelope()` que consulta `mail.from_address.address` y `mail.from_address.name`, y `content()` que devuelve `Content(text="Notification message")`. El asunto inicial es `"Notification subject"`. No agrega destinatarios: debes declararlos o incorporarlos al enviar. Hereda `attachments()`, cuyo resultado inicial es `()`.

<a id="mailable-construction"></a>
## Definir una notificación con datos propios

Reemplaza el contenido de `app/notifications/welcome_mail.py` por una declaración enfocada en tu caso de uso:

```python
from orionis.mail import Content, Envelope, Mailable


class WelcomeMail(Mailable):
    __slots__ = ("recipient", "name")

    def __init__(self, recipient: str, name: str) -> None:
        self.recipient = recipient
        self.name = name

    def envelope(self) -> Envelope:
        return Envelope(subject="Welcome", to=self.recipient)

    def content(self) -> Content:
        return Content(
            view="emails.welcome",
            text=f"Welcome, {self.name}.",
            data={"name": self.name},
        )
```

Con la configuración de vistas predeterminada, crea `resources/views/emails/welcome.html`:

```html
<p>Welcome, {{ name }}.</p>
```

`recipient` y `name` son datos del constructor de esta clase, no parámetros especiales del framework. `data` es el contexto que recibirá Jinja. Los atributos del mailable no se exponen automáticamente a las vistas. La [guía de contenido y vistas](/es/mail/content-and-views) desarrolla las alternativas HTML y texto.

En una aplicación iniciada, un controlador puede enviar la instancia:

```python
from app.notifications.welcome_mail import WelcomeMail
from orionis.http import JSONResponse
from orionis.support.facades import Mail


class WelcomeController:
    async def __call__(self) -> JSONResponse:
        manager = await Mail.resolve()
        result = await (
            manager.mailer("file")
            .fromAddress("notifications@example.com", "Example App")
            .send(WelcomeMail("ana@example.com", "Ana"))
        )
        return JSONResponse({"status": result.status.value})
```

El ejemplo utiliza el mailer configurado con nombre `file`: guarda el mensaje y devuelve el estado `stored`. Cambia la selección conforme a tu [configuración](/es/mail/configuration). `send()` es la operación asíncrona; construir `WelcomeMail` no renderiza ni envía nada.

## Enviar una instancia o una clase

Al pasar una **instancia**, `send()` utiliza ese objeto. Su constructor ya se ejecutó y el framework no vuelve a inyectarle dependencias. Es la opción adecuada cuando has obtenido datos de negocio mediante una consulta o una operación asíncrona previa.

Al pasar una **clase derivada de `Mailable`**, el manager ejecuta `await app.build(Clase)` para cada envío. El contenedor construye una nueva instancia e inyecta las dependencias de su constructor. Esto también permite enviar la clase generada por `make:mail`, cuyo constructor recibe `IApplication`.

Por ejemplo, esta clase utiliza la configuración de la aplicación y no requiere argumentos de negocio:

```python
from orionis.foundation.contracts.application import IApplication
from orionis.mail import Content, Envelope, Mailable


class ProjectNoticeMail(Mailable):
    __slots__ = ("application",)

    def __init__(self, application: IApplication) -> None:
        self.application = application

    def envelope(self) -> Envelope:
        return Envelope(subject="Project notice")

    def content(self) -> Content:
        name = str(self.application.config("app.name"))
        return Content(text=f"A notification from {name}.")
```

Después de definir o importar `ProjectNoticeMail`, un servicio asíncrono puede enviarla así:

```python
from orionis.mail import MailResult
from orionis.support.facades import Mail


class ProjectNoticeService:
    async def send(self) -> MailResult:
        manager = await Mail.resolve()
        return await (
            manager.mailer("file")
            .fromAddress("notifications@example.com", "Example App")
            .to("ana@example.com")
            .send(ProjectNoticeMail)
        )
```

No pases una clase que necesita `recipient: str` o `name: str` esperando que el manager invente esos valores; prepara una instancia como en `WelcomeMail`. Los fallos al construir la clase se presentan como `MailCompositionException` y conservan la causa original. Consulta [manager e inyección](/es/mail/manager-and-injection) para resolver servicios mediante contratos.

## Contrato completo de Mailable

`Mailable` es una clase abstracta con `__slots__ = ()`. Cada subclase decide sus atributos y puede declarar sus propios `__slots__`, como los ejemplos anteriores. No impone inmutabilidad a los objetos de aplicación.

<a id="mailable-envelope"></a>
### `envelope(self) -> Envelope`

Es obligatorio y devuelve los encabezados y destinatarios de la notificación. Debe ser síncrono y no recibe argumentos adicionales. Puede dejar el remitente o los destinatarios pendientes de la configuración y de las opciones del envío.

<a id="mailable-content"></a>
### `content(self) -> Content`

Es obligatorio y devuelve la declaración del cuerpo. También es síncrono y sin parámetros. Devuelve `Content`, no una cadena, un objeto de respuesta HTTP ni una vista pendiente.

<a id="mailable-attachments"></a>
### `attachments(self) -> Sequence[Attachment]`

Es opcional; la implementación base devuelve `()`. Para adjuntar un documento ya guardado en Storage, devuelve una lista o tupla de declaraciones:

```python
from collections.abc import Sequence
from orionis.mail import Attachment, Content, Envelope, Mailable


class GuideMail(Mailable):
    __slots__ = ()

    def envelope(self) -> Envelope:
        return Envelope(subject="User guide", to="ana@example.com")

    def content(self) -> Content:
        return Content(text="Your guide is attached.")

    def attachments(self) -> Sequence[Attachment]:
        return (
            Attachment.fromStorage(
                "documents/guide.pdf",
                disk="local",
                name="User Guide.pdf",
                mime_type="application/pdf",
            ),
        )
```

El path es lógico dentro del disco; la lectura ocurre al enviar. La [guía de adjuntos desde Storage](/es/mail/attachments) explica cómo guardar archivos mediante la fachada `Storage`, resolver discos y gestionar errores. Un generador o un iterador asíncrono no sustituye a la secuencia requerida.

### Orden de declaración y errores

El pipeline llama directamente a `envelope()`, después a `content()` y después a `attachments()`. Valida cada resultado antes de continuar. Ninguno se ejecuta mediante el inyector de métodos: no agregues parámetros `Request`, repositorios u otros servicios a sus firmas. Inyecta servicios en el constructor o prepara los datos antes del envío.

Una implementación `async def` devuelve una corrutina y se rechaza con `MailCompositionException`; el pipeline no la espera. Los tipos de retorno incorrectos y los errores producidos por las declaraciones también impiden llegar al transporte. Las excepciones de las declaraciones conservan la causa original.

Mantén los métodos repetibles. El pipeline no modifica el mailable, pero tampoco congela su estado: no cambies una instancia compartida mientras se utiliza en varios envíos.

<a id="envelope"></a>
## Envelope: asunto y grupos de destinatarios

Todos los argumentos son por nombre:

```text
Envelope(
    *,
    subject: str = "",
    from_address: str | Address | None = None,
    to: Recipients = (),
    cc: Recipients = (),
    bcc: Recipients = (),
    reply_to: Recipients = (),
)
```

`subject` es texto literal; una cadena vacía es válida. `from_address` es el remitente y puede quedar en `None` para utilizar la configuración. `to` identifica destinatarios visibles principales; `cc`, otros destinatarios visibles; `bcc`, destinatarios ocultos; `reply_to`, las direcciones para responder. El constructor transforma el remitente en `Address | None` y cada grupo en `tuple[Address, ...]`, copiando las colecciones de entrada.

```python
from orionis.mail import Address, Envelope

envelope = Envelope(
    subject="Monthly report",
    from_address=Address("notifications@example.com", "Example App"),
    to=[Address("ana@example.com", "Ana"), "ana@EXAMPLE.COM"],
    cc="ops@example.com",
    bcc="archive@example.com",
    reply_to="support@example.com",
)
assert len(envelope.to) == 1
assert envelope.to[0].name == "Ana"
assert envelope.recipients() == (
    "ana@example.com", "ops@example.com", "archive@example.com",
)
```

<a id="envelope-recipients"></a>
### `recipients(self) -> tuple[str, ...]`

Devuelve la unión sin duplicados de `To`, `Cc` y `Bcc`, en ese orden. Excluye `Reply-To`. Una dirección puede estar en `To` y `Cc` y conservar ambos encabezados; el transporte la recibe una vez. No puede estar simultáneamente en `Bcc` y en un grupo visible: esa combinación causa `MailCompositionException`.

Un `Envelope()` incompleto es válido como declaración. Antes del transporte se exige un remitente y al menos un destinatario entre `To`, `Cc` y `Bcc`. El compositor omite el encabezado `Bcc` del MIME y conserva esos destinatarios únicamente en el sobre de transporte.

<a id="address"></a>
## Address y formas de declarar destinatarios

`Address(address: str, name: str | None = None)` es un objeto de valor inmutable para un buzón y su nombre visible. Usa `Address("ana@example.com", "Ana")`; no introduzcas `"Ana <ana@example.com>"` ni varias direcciones separadas por comas en `address`.

El dominio se normaliza a IDNA en minúsculas y se conserva la capitalización de la parte local. Se permiten buzones internacionales; que el transporte pueda enviarlos depende de su soporte de SMTPUTF8. La validación rechaza encabezados ambiguos y caracteres de control o separación de líneas. No consulta DNS ni comprueba que exista la cuenta.

<a id="address-asheader"></a>
### `asHeader(self) -> email.headerregistry.Address`

Convierte el objeto en un valor de encabezado de la biblioteca estándar; no envía el correo:

```python
from orionis.mail import Address

address = Address("Ana@EXAMPLE.COM", "Ana López")
assert address.address == "Ana@example.com"
assert address.asHeader().display_name == "Ana López"
assert address.asHeader().addr_spec == "Ana@example.com"
```

El alias `Recipients`, definido en `orionis.mail.types`, acepta `str | Address | list[str | Address] | tuple[str | Address, ...]`. No admite sets, generadores ni `None`. Una tupla `(email, nombre)` significa dos entradas de destinatarios, no una pareja buzón/nombre: utiliza `Address` para eso.

<a id="address-one_address"></a>
### `one_address(value: str | Address, name: str | None = None) -> Address`

Normaliza un único buzón. Un `Address` existente se devuelve tal cual si no añades `name`; un segundo nombre causa `MailCompositionException`.

<a id="address-addresses"></a>
### `addresses(value: Recipients, name: str | None = None) -> tuple[Address, ...]`

Normaliza una declaración y elimina duplicados por dirección normalizada. Conserva el orden y el nombre de la primera aparición. `name` solo se permite al pasar una cadena individual, no una lista o tupla. Ambos helpers se importan de su módulo:

```python
from orionis.mail import Address
from orionis.mail.entities.address import addresses, one_address

ana = one_address("ana@example.com", "Ana")
assert one_address(ana) is ana
recipients = addresses([
    ana,
    "ana@EXAMPLE.COM",
    Address("ops@example.com", "Operations"),
])
assert recipients == (ana, Address("ops@example.com", "Operations"))
```

## Precedencia de las opciones del envío

Las opciones explícitas de la cadena se aplican sobre el `Envelope` del mailable:

- `fromAddress()` reemplaza su remitente. Si el resultado sigue siendo `None`, el manager utiliza `mail.from_address`.
- `subject()` reemplaza su asunto, incluso si el nuevo asunto es `""`.
- `to()`, `cc()`, `bcc()` y `replyTo()` añaden destinatarios después de los declarados; se normalizan y deduplican por grupo. Se vuelve a validar el conflicto entre destinatarios visibles y Bcc.
- Los adjuntos de la cadena se añaden después de los devueltos por `attachments()`.

El contenido procede exclusivamente de `content()`. `send(mailable)` no acepta un `data` ni un callback adicional, aunque sea `None`; esas variantes corresponden al envío directo y se documentan en [envío y resultados](/es/mail/sending-and-results).

`Envelope` y `Address` son inmutables. Sus validaciones producen `MailCompositionException`; la [referencia de API](/es/mail/api-reference) reúne firmas y errores del módulo.
