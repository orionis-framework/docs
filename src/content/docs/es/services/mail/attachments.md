---
title: "Adjuntos desde Storage"
description: "Declara archivos de Storage como adjuntos, configura nombre y MIME y controla su lectura y ciclo de vida."
editUrl: true
lastUpdated: false
---

Los adjuntos de Mail son declaraciones de archivos de Storage. Se validan al declararse y se leen después, al preparar el mensaje, antes de ejecutar el transporte. La misma declaración puede utilizar un disco local o cloud mediante el contrato de Storage.

<a id="attachment"></a>

## Attachment: declaración y campos

`Attachment` se exporta desde `orionis.mail`. Es una dataclass inmutable con argumentos solo por nombre:

```text
Attachment(
    *,
    path: str,
    disk: str | None = None,
    name: str | None = None,
    mime_type: str | None = None,
)
```

| Campo | Propósito y valor predeterminado |
|---|---|
| `path` | Obligatorio. Ruta lógica del archivo dentro del disco; se normaliza con las reglas de Storage. |
| `disk` | `None` utiliza el disco predeterminado de Storage. Una cadena selecciona un disco configurado y no puede estar vacía. |
| `name` | `None` utiliza el último segmento de la ruta como nombre visible. Si lo indicas, debe ser un nombre de archivo seguro, sin directorios. |
| `mime_type` | `None` deja la selección al metadata de Storage y a la inferencia. Un valor explícito debe tener formato `tipo/subtipo` sin parámetros y se normaliza a minúsculas. |

```python
from orionis.mail import Attachment


report = Attachment(
    path="reports/monthly.csv",
    disk="local",
    name="monthly-report.csv",
    mime_type="text/csv",
)
```

El nombre visible no renombra ni copia el archivo original. Una declaración válida puede apuntar a un archivo que aún no existe; el acceso y los permisos se comprueban al preparar el envío.

<a id="attachment-fromstorage"></a>

## fromStorage(): factoría disponible

```text
Attachment.fromStorage(
    path: str,
    *,
    disk: str | None = None,
    name: str | None = None,
    mime_type: str | None = None,
) -> Attachment
```

Esta factoría de clase devuelve la misma declaración validada que el constructor:

```python
from orionis.mail import Attachment


report = Attachment.fromStorage(
    "reports/monthly.csv",
    disk="local",
    name="monthly-report.csv",
    mime_type="text/csv",
)
```

No lee el archivo, no descarga un objeto cloud ni calcula sus bytes al llamarse. `fromStorage()` es la única factoría nativa de `Attachment`.

## Guardar y adjuntar con las fachadas

Este servicio crea un archivo mediante Storage y utiliza el transporte file para revisar el correo localmente:

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

Se resuelven los managers antes de utilizar sus métodos síncronos de selección. El ejemplo mantiene el informe en Storage; Mail no elimina el archivo fuente. El mensaje `.eml` contiene sus bytes completos y puede inspeccionarse sin contactar un servidor SMTP.

## Bytes, streams y otros orígenes

| Origen que tienes | Integración implementada |
|---|---|
| Ruta lógica de Storage | Constructor `Attachment(...)` o `Attachment.fromStorage(...)`. |
| `bytes` o texto generado | Guárdalo con `disk.put(...)` o `file.write(...)` y declara la ruta resultante. |
| Productor asíncrono de bytes | Persiste mediante `file.writeStream(...)` y adjunta ese archivo de Storage. |
| Upload HTTP | Valídalo y persístelo con la API de [uploads de Storage](/es/services/storage/streaming-and-uploads) antes de declararlo. |
| Ruta nativa externa, handle abierto o URL | No hay una factoría directa para estos orígenes. Importa el contenido a un disco configurado antes de adjuntarlo. |

`attach()` recibe una instancia de `Attachment`; pasar un `bytes`, un objeto `File`, un `Path` o un stream no lo convierte automáticamente. No existen `fromBytes()`, `fromPath()`, `fromStream()` ni `fromUrl()` en esta API.

### Inyección y archivo de trabajo temporal

Este componente recibe ambos servicios por constructor, genera el CSV por bloques y elimina el archivo de trabajo al finalizar la operación:

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

La limpieza pertenece al componente que creó el archivo. Un error de eliminación puede propagarse; no es una transacción de correo ni revierte una entrega. Si planeas reintentos, conserva el origen o garantiza que puede regenerarse. Consulta los [contextos y temporales de Storage](/es/services/storage/temporary-files-and-contexts).

## Adjuntos en un Mailable

Declara una secuencia en el método **síncrono** `attachments()`:

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

El envío debe aportar remitente y destinatarios, mediante la configuración o una cadena del manager. Los adjuntos del Mailable se combinan primero con los agregados mediante `.attach(...)`, conservando ese orden. No se deduplican: declarar el mismo archivo dos veces produce dos partes. Consulta la [composición de mensajes](/es/services/mail/composing-mail).

## Lectura, MIME y recursos

Durante la preparación, el composer selecciona `storage.disk(attachment.disk).file(attachment.path)`. Si no hay MIME explícito, consulta `file.mimeType()`; si el driver indica que esa operación no está soportada, continúa sin ese metadata.

La prioridad de MIME es:

1. `mime_type` explícito de la declaración.
2. Tipo proporcionado por Storage.
3. Tipo inferido desde el nombre visible del adjunto.
4. `application/octet-stream` si no hay ninguno.

El metadata de Storage también debe ser un `tipo/subtipo` válido; un valor inválido falla, no se ignora como si faltara. Esta selección no valida que los bytes correspondan al tipo declarado.

El composer abre el archivo con `open("rb")`, lee todos sus bytes y cierra el stream. Se aceptan archivos de cero bytes. Un error de apertura, lectura, metadata o cierre interrumpe la preparación con `MailAttachmentException`; no se abre un transporte para ese mensaje.

El stream lo crea y lo cierra Mail; no toma posesión de un handle que hayas abierto. Tras leer no elimina ni mueve el origen. Si el consumidor se cancela, Mail espera que el trabajo de lectura que posee termine y libere su stream antes de propagar la cancelación.

Aunque el archivo se genere o almacene por bloques, la composición **materializa todos los adjuntos y el MIME final en memoria**. No es una transmisión SMTP por chunks desde Storage. Dimensiona los adjuntos considerando también la codificación MIME y los límites de tu servidor.

### Metadatos seguros

Las rutas se normalizan lógicamente, se rechazan escapes fuera de la raíz y caracteres prohibidos. El nombre visible debe ser un basename no vacío: no acepta separadores `/`, `\`, `:`, los nombres `.`/`..` ni caracteres de control. El MIME no acepta parámetros como `text/plain; charset=utf-8`.

## Límites de imágenes inline y CID

La implementación genera todas las partes con `Content-Disposition: attachment` y nombre de archivo. No expone campos `disposition`/`cid`, no genera `Content-ID` ni ofrece un método `inline()`. Adjuntar una imagen no convierte una referencia HTML `cid:logo` en una imagen incrustada funcional.

Para una imagen remota en HTML utiliza una URL HTTP accesible y publica el recurso por separado, por ejemplo mediante un disco público de Storage. El cliente de correo decide si carga imágenes remotas; Mail no genera esa URL ni concede permisos. Un transporte personalizado recibe MIME ya compuesto, por lo que registrar uno no agrega por sí solo capacidades inline al composer.
