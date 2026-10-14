---
title: "Correo"
description: "Envía notificaciones con Mail, mediante texto/HTML literal o clases Mailable reutilizables. Orionis compone mensajes MIME y los entrega por SMTP o los guarda como archivos .eml…"
editUrl: true
lastUpdated: false
---

Envía notificaciones con `Mail`, mediante texto/HTML literal o clases `Mailable` reutilizables. Orionis compone mensajes MIME y los entrega por SMTP o los guarda como archivos `.eml` para desarrollo.

## Preparar e inspeccionar el primer mensaje

Empieza con el transporte de archivos para revisar el mensaje sin una cuenta SMTP. Añade estos valores al `.env` de tu aplicación antes del arranque:

```dotenv
MAIL_MAILER=file
MAIL_FROM_ADDRESS=notifications@example.com
MAIL_FROM_NAME="Example App"
MAIL_FILE_PATH=storage/mail
```

El directorio debe ser escribible y su sistema de archivos debe admitir enlaces duros. La aplicación estándar necesita los proveedores de correo, vistas y almacenamiento disponibles; importar `Mail` en un script externo no los inicia.

Usa esta función dentro de un controlador, comando o servicio async de la aplicación iniciada:

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

Proporciona la dirección real del destinatario y llama `await send_welcome(address, name)` desde ese contexto de aplicación. Con `MAIL_MAILER=file`, el resultado tiene estado `stored` y `file_path` apunta al `.eml` completo. Ábrelo en un cliente de correo o inspecciona su contenido. Este transporte no entrega el mensaje al destinatario.

Para entregar correo, configura el [transporte SMTP](/es/services/mail/transports-and-extensions) y selecciona `MAIL_MAILER=smtp`. Un resultado de aceptación indica que el servidor aceptó el mensaje; no confirma entrega en el buzón.

## Elegir el siguiente paso

1. [Declarar mensajes](/es/services/mail/composing-mail): mailables reutilizables, plantillas, destinatarios y archivos adjuntos.
2. [Enviar y manejar resultados](/es/services/mail/sending-and-results): cadenas independientes, callbacks, entrega parcial y errores.
3. [Configurar transportes](/es/services/mail/transports-and-extensions): ajustes SMTP, archivos de desarrollo y drivers propios.

Si el trabajo debe sobrevivir al reinicio del proceso, envía un [job persistente](/es/asynchronous/queues) que reconstruya y envíe el mensaje. El correo y la confirmación de una transacción de base de datos son efectos separados.
