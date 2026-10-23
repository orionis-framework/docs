---
title: "Configuración de correo"
description: "Referencia de config/mail.py: mailers, remitente, variables de entorno, SMTP URL y validación efectiva."
editUrl: true
lastUpdated: false
---

`config/mail.py` define `BootstrapMail`, una dataclass inmutable que hereda de `Mail`. Sus tres campos seleccionan el mailer predeterminado, el remitente global y los transportes disponibles. Configurar estas entidades no abre conexiones ni envía mensajes.

<a id="config-mail"></a>

## Configuración general: Mail

| Campo | Variable y predeterminado | Tipo y comportamiento |
|---|---|---|
| `default` | `MAIL_MAILER`; `smtp`. | `str \| MailDriver`. Nombre no vacío de un mailer declarado. |
| `from_address` | Fábrica `FromAddress(...)`. | `FromAddress \| dict`. Remitente utilizado cuando el mensaje no declara uno. |
| `mailers` | Fábrica `Mailers(...)`. | `Mailers \| dict`. Entradas de configuración seleccionables por nombre. |

`default` debe coincidir exactamente con una entrada. A diferencia de una selección de enum normalizada, no se convierte a minúsculas ni se recortan espacios: `"SMTP"` no selecciona automáticamente `"smtp"`. Un nombre vacío o ausente en `mailers` produce `ValueError`; un tipo incorrecto produce `TypeError`.

<a id="config-maildriver"></a>

### MailDriver

`MailDriver.SMTP` vale `"smtp"` y `MailDriver.FILE`, `"file"`. Son nombres convencionales; no limitan los mailers personalizados a esas dos entradas. El manager selecciona un **mailer** por nombre y su campo `driver` identifica el transporte que lo implementa.

<a id="config-fromaddress"></a>

## Remitente global: FromAddress

| Campo | Variable y predeterminado | Tipo y efecto |
|---|---|---|
| `address` | `MAIL_FROM_ADDRESS`; `""`. | `str`. Dirección del remitente global. Vacío permite configurarlo en cada mensaje. |
| `name` | `MAIL_FROM_NAME`; `APP_NAME`, después `"Orionis"`. | `str`. Nombre visible del remitente. |

La entidad valida tipos, no la sintaxis completa del buzón. Cuando un mensaje carece de remitente explícito, el manager lee esta configuración, recorta dirección y nombre y construye el `Address` validado. Una dirección global vacía no completa el mensaje: este debe declarar su remitente antes del envío.

El remitente definido mediante `fromAddress(...)` o el `Envelope` del mensaje tiene prioridad; en ese caso no se consulta el remitente global. Un diccionario se valida como `FromAddress` y se conserva como copia independiente, sin convertirse automáticamente a esa entidad.

```dotenv
MAIL_FROM_ADDRESS=notifications@example.com
MAIL_FROM_NAME="Example application"
```

<a id="config-mailers"></a>

## Mailers y nombres personalizados

Importa las entidades desde el módulo público:

```python
from orionis.foundation.config.mail import (
    File, FromAddress, Mail, MailDriver, Mailers, Smtp,
)
```

`Mailers` incluye dos campos:

| Campo | Valor admitido | Predeterminado |
|---|---|---|
| `smtp` | `Smtp \| dict`. | Nueva entidad `Smtp()`. |
| `file` | `File \| dict`. | Nueva entidad `File()`. |

Los diccionarios de estas entradas se convierten a las entidades correspondientes. No se admite `None`. Sus fábricas crean instancias independientes.

Para nombres arbitrarios utiliza un diccionario en **`Mail.mailers`**, no campos desconocidos en `Mailers`. Este ejemplo valida una configuración con dos destinos de archivo:

```python
from orionis.foundation.config.mail import Mail


settings = Mail(
    default="archive",
    from_address={"address": "notifications@example.com", "name": "Reports"},
    mailers={
        "archive": {"driver": "file", "path": "storage/mail/archive"},
        "file": {"path": "storage/mail"},
    },
)
```

El objeto `settings` ilustra la estructura; para activarla colócala en los campos de `BootstrapMail` de tu aplicación. Las entradas llamadas `smtp` y `file` pueden omitir `driver`, porque el manager lo infiere. Un mailer llamado `archive` necesita `driver="file"` aunque use el mismo transporte.

Cada valor del mapping debe ser un diccionario, `Smtp` o `File`. Un diccionario SMTP pasa por la validación de `Smtp`; uno file por la de `File` tras quitar la clave `driver`. Los drivers propios conservan sus opciones para la factory registrada. El mapping se copia, incluido su contenido anidado. El manager resuelve el mailer seleccionado en cada envío y entrega a la factory una configuración normalizada de solo lectura.

<a id="config-file"></a>

## Transporte de archivo: File

| Campo | Variable y predeterminado | Tipo y validación |
|---|---|---|
| `path` | `MAIL_FILE_PATH`; `"storage/mail"`. | `str` no vacía ni compuesta solo por espacios. Tipo incorrecto o vacío producen `ValueError`. |

`File` no tiene un campo `driver`: la entrada convencional `file` lo infiere; los mappings con otro nombre deben declararlo.

```dotenv
MAIL_MAILER=file
MAIL_FILE_PATH=storage/mail
MAIL_FROM_ADDRESS=notifications@example.com
```

La factory de file resuelve una ruta relativa desde la raíz de la aplicación. Conserva una ruta absoluta y rechaza rutas de Windows ancladas pero no absolutas, como `C:outgoing`. En la selección del transporte también se rechazan valores vacíos, tipos incompatibles o caracteres NUL. El directorio se crea al publicar el mensaje, no al construir la entidad.

Este transporte guarda `.eml`; no entrega correo ni necesita un servidor SMTP. Su comportamiento de publicación y retención se explica en [transportes](/es/services/mail/transports-and-extensions#driver-file).

<a id="config-smtp"></a>

## Transporte SMTP: Smtp

| Campo | Variable y predeterminado | Tipo y propósito |
|---|---|---|
| `driver` | Sin variable; `"smtp"`. | Debe ser exactamente `"smtp"`; otro valor produce `TypeError`. |
| `url` | `MAIL_URL`; `""`. | `str`. URL opcional que puede sustituir los campos de conexión. |
| `host` | `MAIL_HOST`; `""`. | `str`. Host SMTP, obligatorio en la configuración efectiva. |
| `port` | `MAIL_PORT`; `587`. | `int`. Puerto TCP de la configuración efectiva, entre 1 y 65535. |
| `encryption` | `MAIL_ENCRYPTION`; `"TLS"`. | `str`. `TLS`, `SSL`, `none` o vacío; comparación sin distinguir mayúsculas. |
| `username` | `MAIL_USERNAME`; `""`. | `str`. Usuario de autenticación; debe acompañarse de contraseña. |
| `password` | `MAIL_PASSWORD`; `""`. | `str`. Contraseña; debe acompañarse de usuario. |
| `timeout` | `MAIL_TIMEOUT`; `None`. | `int \| None`. Segundos positivos de timeout del socket, o espera sin límite explícito. |

La entidad `Smtp` valida tipos: permite cadenas vacías y exige enteros reales para puerto y timeout, rechazando booleanos. Los rangos, el host efectivo, la autenticación y el modo de seguridad se validan **al seleccionar el transporte**, mediante `SmtpSettings.fromConfig(...)`.

Esto permite que una entrada SMTP no utilizada permanezca incompleta cuando envías mediante file. También permite que una URL válida sustituya un puerto o modo que no se utilizarían. La URL no sustituye `timeout`: un timeout no positivo sigue siendo inválido. Los tipos de los campos de una entidad `Smtp` se validan aunque posteriormente la URL los sustituya.

### Configuración por campos

```dotenv
MAIL_MAILER=smtp
MAIL_FROM_ADDRESS=notifications@example.com
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_ENCRYPTION=TLS
MAIL_USERNAME=replace-with-username
MAIL_PASSWORD=replace-with-password
MAIL_TIMEOUT=15
```

`TLS` exige STARTTLS; no es TLS implícito. `SSL` selecciona TLS implícito. `none` o cadena vacía desactivan TLS. Cambiar `MAIL_ENCRYPTION` por sí solo no cambia el puerto configurado: elige el puerto apropiado para tu servidor. No se normalizan espacios alrededor del modo.

### Precedencia de MAIL_URL

```dotenv
MAIL_URL=smtps://example-user:example-password@smtp.example.com
MAIL_TIMEOUT=15
```

| Componente de la URL | Qué sustituye |
|---|---|
| `smtp://host` | El host; conserva puerto y cifrado configurados si la URL no los cambia. No fuerza texto plano. |
| `smtps://host` | El host, el modo `SSL` y el puerto 465. |
| Puerto explícito | Sustituye el puerto configurado o el 465 de `smtps`. |
| Usuario o contraseña presentes | Sustituye **ambos** campos como un par; no mezcla una credencial de la URL y otra del entorno. |
| Timeout | No hay opción de timeout en la URL; se conserva el campo `timeout`. |

Codifica los caracteres reservados del usuario o contraseña con percent-encoding. La URL solo admite esquemas `smtp` y `smtps`, host y puerto/credenciales opcionales. Se rechazan paths —también una barra final—, query, fragment, controles, host ausente o puerto inválido. Una URL con solo usuario y sin contraseña no se completa con `MAIL_PASSWORD`: el par resultante es inválido.

Tras aplicar precedencia, el host no puede estar vacío ni contener espacios, controles, `/`, `\` o `@`. Puerto y timeout se comprueban en ese estado efectivo. Un usuario y contraseña ambos vacíos permiten intentar la conexión sin autenticación; si solo uno está presente se lanza `MailConfigurationException`.

### Comprobar opciones sin conectarse

```python
from orionis.mail.entities.smtp_settings import SmtpSettings
from orionis.mail.enums.encryption import MailEncryption


settings = SmtpSettings.fromConfig({
    "url": "smtps://smtp.example.com:8465",
    "host": "unused.example.com",
    "port": 587,
    "encryption": "TLS",
    "username": "",
    "password": "",
    "timeout": 15,
})
assert settings.host == "smtp.example.com"
assert settings.port == 8465
assert settings.encryption is MailEncryption.SSL
```

Este bloque valida y normaliza configuración; no crea una conexión ni envía correo. La referencia del [transporte SMTP](/es/services/mail/transports-and-extensions#smtp-settings) detalla el resultado y las garantías de TLS.

## Personalizar config/mail.py

Este archivo completo configura file como alternativa segura para revisar mensajes localmente y conserva la entrada SMTP con sus lecturas de entorno:

```python
from dataclasses import dataclass, field
from orionis.environment import Env
from orionis.foundation.config.mail import (
    File, FromAddress, Mail, MailDriver, Mailers,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapMail(Mail):
    default: str | MailDriver = field(
        default_factory=lambda: Env.get("MAIL_MAILER", MailDriver.FILE),
    )
    from_address: FromAddress | dict = field(
        default_factory=lambda: FromAddress(
            address=Env.get("MAIL_FROM_ADDRESS", "notifications@example.com"),
            name=Env.get("MAIL_FROM_NAME", Env.get("APP_NAME", "Orionis")),
        ),
    )
    mailers: Mailers | dict = field(
        default_factory=lambda: Mailers(
            file=File(path=Env.get("MAIL_FILE_PATH", "storage/mail")),
        ),
    )
```

Para agregar mailers personalizados sustituye la fábrica de `mailers` por un mapping como el anterior. Un nombre desconocido, driver no registrado, configuración seleccionada inválida o factory incorrecta produce `MailConfigurationException`. La validación inicial de entidades puede producir `TypeError` o `ValueError` antes de enviar.

La configuración no confirma conectividad, credenciales ni recepción de mensajes. Continúa con [transportes y extensiones](/es/services/mail/transports-and-extensions) y [resultados del envío](/es/services/mail/sending-and-results) para interpretar lo que realmente garantiza una operación.
