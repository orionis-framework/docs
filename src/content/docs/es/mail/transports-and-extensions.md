---
title: "Configurar SMTP, file y transportes propios"
description: "Funcionamiento de SMTP y file, configuración efectiva de seguridad y registro de transportes propios."
editUrl: true
lastUpdated: false
---

Mail separa la declaración del mensaje, su composición MIME y el transporte. El manager resuelve un mailer de [config/mail.py](/es/mail/configuration), prepara todos sus cuerpos y adjuntos y solo después crea e invoca el transporte.

## Mailer y driver

Un **mailer** es una entrada de `mail.mailers`; un **driver** identifica su implementación. Puedes tener varios mailers con `driver="file"` o `driver="smtp"` y opciones diferentes. Seleccionar `mailer("archive")` no registra un transporte nuevo.

Los drivers nativos son `smtp` y `file`. El manager infiere esos nombres únicamente para entradas llamadas exactamente `smtp` o `file`; cualquier otro mailer requiere `driver` explícito.

| Driver | Dependencias | Resultado confirmado |
|---|---|---|
| `smtp` | `smtplib`, `ssl` y `email` de Python; servidor SMTP accesible. | Aceptación SMTP completa o parcial; no recepción final en el buzón. |
| `file` | Sistema de archivos escribible con soporte de hard links. | MIME publicado como archivo `.eml`; no se envía a un servidor. |

No hay extras de Orionis para habilitar estos dos transportes. El motor de vistas y Storage forman parte de la integración del framework; los drivers cloud utilizados por un adjunto conservan sus [dependencias propias](/es/storage/disks-and-drivers). Instalar un SDK de correo distinto no lo registra automáticamente como transporte.

<a id="driver-smtp"></a>

## SMTP: conexión y entrega

El transporte utiliza las opciones efectivas de `SmtpSettings`. Cada envío crea su propio cliente y ejecuta el trabajo bloqueante fuera del event loop mediante el executor de Orionis:

1. Construye `SMTP_SSL` para `SSL`, o `SMTP` para `TLS`/`none`.
2. Conecta al host y puerto y exige el saludo SMTP 220.
3. Negocia mediante `ehlo_or_helo_if_needed()`.
4. En modo `TLS`, ejecuta STARTTLS y vuelve a negociar capacidades.
5. Si hay usuario, autentica con el par usuario/contraseña.
6. Comprueba SMTPUTF8 y 8BITMIME si las direcciones del mensaje lo requieren.
7. Ejecuta `sendmail()` con el remitente y la unión de destinatarios del envelope.
8. Cierra el cliente en `finally`, incluso ante errores.

El envelope de transporte incluye Bcc, aunque el MIME no incluya ese encabezado. Un nombre visible Unicode se codifica como encabezado; no exige por sí solo una dirección SMTPUTF8. Las direcciones internacionales que permanecen no ASCII requieren ambas extensiones del servidor.

### Modos de seguridad

| Modo efectivo | Comportamiento |
|---|---|
| `TLS` / `MailEncryption.TLS` | Conexión inicial normal y STARTTLS obligatorio. Si el servidor no lo admite, falla; no continúa en texto plano. |
| `SSL` / `MailEncryption.SSL` | TLS implícito desde la conexión mediante `SMTP_SSL`. |
| `none` o cadena vacía / `MailEncryption.NONE` | Sin TLS solicitado por el transporte. |

Los modos se comparan sin distinguir mayúsculas, pero no se recortan espacios. TLS usa el contexto de confianza del sistema, verifica certificado y hostname y exige al menos TLS 1.2. El transporte no expone una opción para omitir esa verificación.

Usuario y contraseña deben estar ambos presentes o ambos vacíos. No se detecta automáticamente un modo de autenticación o cifrado alternativo al fallar. `timeout` es un entero positivo o `None`; `None` configura espera de socket sin límite explícito. No es un deadline global para completar todas las etapas de un envío.

### Resultados, errores y cancelación

Una transacción sin rechazados devuelve `MailStatus.ACCEPTED`; con aceptados y rechazados, `PARTIAL`. Si todos se rechazan, se lanza `MailTransportException`. La [guía de resultados](/es/mail/sending-and-results) describe los campos de `MailResult`.

Los fallos de conexión, STARTTLS, autenticación y transacción se traducen a `MailTransportException` con la etapa y, cuando existe, el código SMTP. Los diagnósticos públicos no incluyen el texto completo del servidor ni credenciales; los motivos de rechazo se acotan, se convierten a una línea y se redactan con los valores sensibles conocidos.

No hay reintento automático. Una excepción o cancelación no demuestra que el servidor haya rechazado el mensaje: puede haberlo aceptado antes de perderse la confirmación. La cancelación del consumidor tampoco detiene necesariamente el worker ni cancela una transacción SMTP en curso. Define una política de reintentos que tenga en cuenta aceptaciones parciales y posibles duplicados.

<a id="smtp-settings"></a>

## SmtpSettings: opciones efectivas

`SmtpSettings.fromConfig(config: Mapping[str, object]) -> SmtpSettings` combina campos y URL, valida el resultado y devuelve una dataclass inmutable. No se conecta. Utiliza esta factoría para obtener opciones operativas; construir directamente la dataclass no ejecuta esa normalización.

| Campo del resultado | Significado |
|---|---|
| `host` | Host efectivo de la URL o del campo individual. |
| `port` | Puerto efectivo entero entre 1 y 65535. |
| `encryption` | Miembro `MailEncryption.TLS`, `SSL` o `NONE`. |
| `username` | Usuario efectivo; oculto en `repr`. |
| `password` | Contraseña efectiva; oculta en `repr`. |
| `timeout` | Entero positivo de segundos o `None`. |
| `sensitive` | Tupla de variantes de URL y credenciales utilizadas para redactar diagnósticos; oculta en `repr`. |

`smtps://` fuerza `SSL` y puerto 465, salvo puerto explícito. `smtp://` conserva cifrado y puerto configurados cuando la URL no los sustituye. Si la URL contiene credenciales sustituye ambas como par; el timeout permanece independiente. Consulta la [tabla de precedencia completa](/es/mail/configuration#config-smtp).

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

El ocultamiento en `repr` no convierte la configuración en un almacén de secretos: evita registrar mappings, URLs o el campo `sensitive` completos.

<a id="driver-file"></a>

## File: revisar o archivar mensajes

Configura el transporte local antes del arranque:

```dotenv
MAIL_MAILER=file
MAIL_FROM_ADDRESS=notifications@example.com
MAIL_FILE_PATH=storage/mail
```

Este servicio utiliza inyección del manager y selecciona explícitamente file; solo publica un archivo local:

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

El transporte crea el directorio de destino cuando publica. La ruta relativa se ancla a la raíz de la aplicación; una absoluta se conserva. La factory rechaza rutas ancladas pero relativas de Windows. No utiliza un disco de Storage para publicar `.eml`: `MAIL_FILE_PATH` configura directamente su destino.

### Publicación y retención

El worker escribe el MIME completo en un temporal privado dentro del directorio, ejecuta `flush()` y `fsync()` y publica un nombre aleatorio mediante hard link. No reemplaza un archivo existente; una colisión o un filesystem sin hard links producen `MailTransportException`. El temporal se elimina en `finally` cuando es posible. No hay garantía de limpieza si el sistema de archivos también rechaza la eliminación.

Solo después de publicar devuelve `MailStatus.STORED` con `file_path`. Ese resultado no implica aceptación SMTP ni entrega. El directorio final se crea con modo `0700` cuando es nuevo; los permisos efectivos dependen del sistema operativo y no se reescriben los de directorios existentes.

Los archivos contienen el cuerpo, las direcciones visibles y todos los adjuntos codificados. No hay rotación, retención ni limpieza automática de los `.eml` publicados. Define esas políticas para el destino. La cancelación puede devolver el control al consumidor mientras el worker termina de publicar y limpiar su temporal.

<a id="custom-transports"></a>

## Registrar transportes propios

El contrato real es:

```text
async IMailTransport.send(
    message: PreparedMail,
    *,
    mailer: str,
    driver: str,
) -> MailResult
```

El transporte recibe MIME completo, `message_id`, remitente, destinatarios y la indicación `smtp_utf8` de `PreparedMail`. No recibe vistas, controladores ni rutas de Storage. Usa `message.sender` y `message.recipients` para el envelope; reconstruir destinatarios desde los encabezados perdería Bcc.

`extend(driver, factory)` acepta una fábrica síncrona o asíncrona con argumentos `(app, normalized_config)`. Debe devolver una **instancia de `IMailTransport`**, no simplemente un objeto que tenga un método `send`. La factory se invoca por envío después de componer el MIME. Puede resolver servicios del contenedor; si necesita mantener conexiones compartidas, su implementación debe gestionar ese ciclo de vida.

### Reutilizar file con un driver propio

Esta factory conserva el comportamiento real de publicación de `FileTransport`:

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

Añade `ArchiveMailProvider` a la llamada existente a `app.withProviders(...)` en `bootstrap/app.py`. Configura una entrada con nombre y driver explícitos en la fábrica `mailers` de `BootstrapMail`:

```python
def archive_mailers() -> dict:
    return {
        "archive": {"driver": "custom_archive", "path": "storage/mail/archive"},
        "file": {"driver": "file", "path": "storage/mail"},
    }
```

Utiliza `archive_mailers` como `default_factory` de ese campo y selecciona `MAIL_MAILER=archive`, o usa `mail.mailer("archive")` para una operación. El driver existe en el registro porque lo añadió el provider; el nombre del mailer solo selecciona la configuración.

El registro rechaza nombres vacíos, factories no invocables, duplicados y los drivers incorporados `smtp`/`file`; no los sustituye. Registra extensiones una sola vez durante el arranque antes de envíos concurrentes. El manager no añade retry, fallback, colas ni cierre automático a un transporte personalizado: el resultado debe representar una evidencia real de aceptación o almacenamiento.

Consulta [adjuntos desde Storage](/es/mail/attachments) para el trabajo que se completa antes del transporte y la [referencia técnica](/es/mail/api-reference) para sus contratos.
