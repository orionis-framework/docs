---
title: "Referencia técnica de correo"
description: "Contratos, composición MIME, tipos, helpers, provider y excepciones de la API de Mail."
editUrl: true
lastUpdated: false
---

La guía de [envío y resultados](/es/mail/sending-and-results) explica todos los métodos de `Mail`, `IMailManager`, `PendingMail` y `Message`. La guía de [clases de correo](/es/mail/composing-mail) desarrolla `Mailable`, `Envelope` y `Address`. Aquí se reúnen los componentes de composición y las utilidades de nivel inferior.

## Mapa de la API

| Componente | Documentación |
| --- | --- |
| `MailManager` e `IMailManager` | [Fachada, DI y ciclo de vida](/es/mail/manager-and-injection); [operaciones fluidas y terminales](/es/mail/sending-and-results). |
| `PendingMail`, `Message`, `MailOptions` | [Cadenas independientes, callbacks y precedencia](/es/mail/sending-and-results). |
| `Mailable`, `Envelope`, `Address` | [Clases, hooks, destinatarios y normalización](/es/mail/composing-mail). |
| `Content` | [Texto, HTML, vistas y contexto](/es/mail/content-and-views). |
| `Attachment` | [Todos sus campos y fromStorage()](/es/mail/attachments). |
| `MailResult`, `MailStatus`, `PreparedMail` | [Datos de entrega y resultados](/es/mail/sending-and-results). |
| `SmtpSettings`, `MailEncryption` y configuración | [Referencia de configuración](/es/mail/configuration). |
| `IMailTransport`, `FileTransport`, `SmtpTransport` y factorías | [Transportes nativos y extensiones](/es/mail/transports-and-extensions). |

El paquete `orionis.mail` exporta `Address`, `Attachment`, `Content`, `Envelope`, `MailResult`, `MailStatus`, `Mailable`, `Message` y `PendingMail`. Los servicios, contratos y componentes de bajo nivel se importan desde los módulos indicados en sus ejemplos. La fachada se importa desde `orionis.support.facades`.

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

El constructor conserva los servicios de vistas y Storage; no el estado de un mensaje. El provider lo registra como singleton. Cada `prepare()` mantiene sus datos locales, comprueba remitente y destinatarios, renderiza primero texto y después HTML, carga los adjuntos en orden y compone MIME completo mediante `Loop.execute()` fuera del event loop.

`prepare()` no selecciona un mailer, no aplica el remitente global y no envía por SMTP ni publica un `.eml`. Esas responsabilidades pertenecen al manager y al transporte. Al utilizar directamente este servicio debes aportar un `Envelope` con remitente y destinatarios ya resueltos.

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

Inyecta `InspectMail` en un componente de la aplicación. Este ejemplo solo compone: no utiliza un transporte. `PreparedMail.mime` contiene bytes MIME; no es una respuesta HTTP ni un stream abierto.

### Comportamiento de la composición

- Genera Date y Message-ID por operación. La dirección del remitente aporta el dominio del ID.
- Conserva el texto y HTML como alternativas MIME cuando existen ambos. Los cuerpos se codifican como quoted-printable.
- Añade To, Cc y Reply-To visibles; Bcc pertenece únicamente a la unión de destinatarios del sobre de transporte.
- Detecta direcciones addr-spec no ASCII para marcar `smtp_utf8`; los nombres visibles Unicode se codifican como encabezados y no equivalen por sí solos a una dirección internacional.
- Materializa los adjuntos y el MIME completo en memoria. La lectura de Storage y la limpieza de sus streams se describen en [adjuntos](/es/mail/attachments).
- Los fallos de renderizado se convierten a `MailCompositionException` con su causa. Los de lectura de adjuntos se tratan como `MailAttachmentException`; errores de tipos/valores al codificar MIME se convierten a `MailCompositionException`.

El mensaje se prepara antes de construir el transporte. Un error de vista o archivo impide llegar a esa entrega; no demuestra que otras operaciones de tu servicio deban revertirse.

## Constructores y factorías de transporte

Estos componentes se utilizan al implementar integraciones. El manager ya los selecciona para el envío habitual:

```text
FileTransport(path: Path) -> None
create_file_transport(app: IApplication, config: Mapping[str, object]) -> IMailTransport
SmtpTransport(settings: SmtpSettings) -> None
create_smtp_transport(app: IApplication, config: Mapping[str, object]) -> IMailTransport
```

Los componentes file se importan de `orionis.mail.transports.file` y los SMTP de `orionis.mail.transports.smtp`. El constructor file conserva la ruta; su factoría valida `config["path"]` (fallback `storage/mail`) y ancla rutas relativas a `app.basePath`. El constructor SMTP conserva las opciones normalizadas; su factoría ejecuta `SmtpSettings.fromConfig(config)`. Ninguno de esos constructores conecta o publica un mensaje.

Ambos transportes cumplen la firma `async send(message: PreparedMail, *, mailer: str, driver: str) -> MailResult`. El argumento `message` es obligatorio, al igual que los nombres keyword-only `mailer` y `driver`. File devuelve almacenamiento confirmado; SMTP devuelve aceptación completa o parcial. Las diferencias de errores, cierre, cancelación y publicación se explican en [transportes](/es/mail/transports-and-extensions).

<a id="mail-types"></a>

## Tipos públicos de integración

En `orionis.mail.types`:

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

`Recipients` define las formas aceptadas para buzones. `MessageCallback` recibe el configurador de una operación directa y retorna `None` o ese mismo objeto, directamente o mediante awaitable. `Delivery` describe el callback de entrega que recibe `PendingMail`: nombre opcional de mailer, sobre, contenido y adjuntos. `TransportFactory` es el contrato de factoría de `extend()`; debe devolver una instancia que cumpla `IMailTransport` por herencia.

`orionis.mail.composer.LoadedAttachment` declara `tuple[Attachment, bytes, str | None]`: declaración, bytes completos y MIME opcional obtenido durante la lectura. El composer lo utiliza para preparar el MIME; los consumidores habituales declaran `Attachment` y dejan esa resolución al servicio.

## Helpers de validación y snapshots

Estas funciones públicas están en `orionis.mail.functions`. Son síncronas. Los componentes de alto nivel ya las utilizan; no necesitas llamarlas antes de cada envío ni aportan métodos adicionales al builder.

<a id="helper-header-value"></a>

### header_value(value: str, label: str) → str

Retorna el texto original si no contiene caracteres de control, formato, surrogates o separadores Unicode de línea/párrafo. Una cadena vacía es válida, por ejemplo para el asunto. Un tipo incorrecto o carácter rechazado produce `MailCompositionException`; `label` identifica el campo en el diagnóstico.

```python
from orionis.mail.functions import header_value

assert header_value("Monthly report", "Subject") == "Monthly report"
assert header_value("", "Subject") == ""
```

<a id="helper-attachment-name"></a>

### attachment_name(value: str) → str

Valida el nombre visible del adjunto y lo devuelve sin modificar. Rechaza controles, valores vacíos o solo espacios, `.`/`..` y `/`, `\` o `:`. No acepta una ruta completa. Los errores se expresan como `MailAttachmentException`.

```python
from orionis.mail.functions import attachment_name

assert attachment_name("Annual report.pdf") == "Annual report.pdf"
```

<a id="helper-media-type"></a>

### media_type(value: str) → str

Devuelve un par `type/subtype` en minúsculas. Exige dos tokens MIME no vacíos; no admite parámetros como `; charset=utf-8`, espacios o una cadena sin `/`. Un valor inválido genera `MailAttachmentException`. Valida la etiqueta, no inspecciona los bytes de un archivo.

```python
from orionis.mail.functions import media_type

assert media_type("Application/PDF") == "application/pdf"
```

<a id="helper-freeze-owned"></a>

### freeze_owned(value: object, active: frozenset[int] = frozenset()) → object

Crea snapshots recursivos de contenedores propios: mappings pasan a `MappingProxyType`, listas/tuplas a tuplas y sets/frozensets a frozensets. Los objetos opacos se conservan por referencia. Los contenedores cíclicos generan `MailCompositionException`; `active` lleva los ancestros durante la recursión y normalmente se deja con su valor predeterminado. No equivale a copiar profundamente cualquier servicio u objeto de negocio.

```python
from orionis.mail.functions import freeze_owned

source = {"tags": ["receipt"]}
snapshot = freeze_owned(source)
source["tags"].append("updated")
assert snapshot["tags"] == ("receipt",)
```

<a id="helper-sanitize-reason"></a>

### sanitize_reason(value: str | bytes, sensitive: tuple[str, ...] = ()) → str

Decodifica bytes UTF-8 con reemplazo, sustituye los secretos no vacíos declarados —primero los más largos—, convierte los controles rechazados en espacios y limita la salida a 512 caracteres. Solo redacta los secretos que recibe. `MailResult` limpia los controles y acota razones; el transporte debe redactar sus credenciales antes de construirlo.

```python
from orionis.mail.functions import sanitize_reason

reason = sanitize_reason(b"Rejected\r\ncredential=example-secret", ("example-secret",))
assert "example-secret" not in reason
assert "\r" not in reason and "\n" not in reason
```

Los helpers de direcciones `one_address()` y `addresses()` están documentados con sus firmas y ejemplos en [Address](/es/mail/composing-mail#address).

<a id="provider"></a>

## MailProvider

`register() -> None` registra `MailComposer` e `IMailManager → MailManager` como singletons. `async boot() -> None` ejecuta `await Mail.pin()`. Es un provider nativo ordinario, no diferido. El registro de la aplicación estándar ya lo incluye; no agregues una segunda instancia por petición.

<a id="facade-accessor"></a>

## Mail.getFacadeAccessor() → type[IMailManager]

Este método de clase retorna el contrato con el que la fachada resuelve el manager. No lee configuración ni envía un mensaje. Los métodos heredados de la fachada permiten resolver el servicio explícitamente; el [uso de Mail y DI](/es/mail/manager-and-injection) muestra los contextos adecuados.

<a id="exceptions"></a>

## Excepciones

| Clase | Finalidad |
| --- | --- |
| `MailException` | Base común del subsistema. |
| `MailConfigurationException` | Mailer/driver, factoría o ajustes inválidos. |
| `MailCompositionException` | Declaraciones, callbacks, direcciones, vistas o MIME inválidos. |
| `MailAttachmentException` | Subclase de composición para metadatos o lectura de adjuntos. |
| `MailTransportException` | Fallo de entrega/publicación; no garantiza que el servidor no haya recibido datos. |

Estas clases no incorporan un método de retry ni un atributo público de rollback. El contexto y la causa original pueden acompañar la excepción. Un resultado SMTP parcial tiene datos propios en `MailResult`; no se representa simplemente como «ningún envío». Consulta [resultados y errores](/es/mail/sending-and-results).
