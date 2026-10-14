---
title: "Logging"
description: "Registra eventos mediante Log para seguir una petición, investigar un job fallido o revisar una importación. El logger incluido escribe archivos de texto UTF-8 con filtros de…"
editUrl: true
lastUpdated: false
---

Registra eventos mediante `Log` para seguir una petición, investigar un job fallido o revisar una importación. El logger incluido escribe archivos de texto UTF-8 con filtros de severidad y un canal activo.

## Registrar un evento desde tu aplicación

Configura `.env` antes del arranque, por ejemplo:

```dotenv
LOG_CHANNEL=daily
LOG_LEVEL=INFO
LOG_RETENTION=7
```

El canal diario estándar escribe en `storage/logs`, con nombres como `daily_2026-10-14.log`. Asegura permisos de escritura. La retención limita archivos coincidentes; no es un temporizador que elimine datos al cumplir una edad exacta.

Después del arranque, desde un controlador, comando, job o servicio:

```python
from orionis.support.facades import Log


async def record_import(import_id: int, row_count: int) -> None:
    Log.info(f"event=import-completed import={import_id} rows={row_count}")
```

`Log.info()` es síncrono: no añadas `await`. Los mensajes por debajo de `LOG_LEVEL` se filtran. La fachada acepta una cadena, no un diccionario ni argumentos de interpolación; no incluye salida JSON estructurada ni eliminación automática de secretos.

## Elegir el siguiente paso

1. [Registrar eventos](/es/services/logging/writing-logs): fachada e inyección, severidad, acceso al logger estándar y trazas de excepción.
2. [Configurar rotación y ciclo de vida](/es/services/logging/rotation-and-lifecycle): rutas, retención, múltiples procesos y cambios de configuración.

Usa el logger singleton de la aplicación. Crear otro `Logger` por petición puede reemplazar los handlers compartidos del proceso. Consulta [gestión de excepciones](/es/architecture/exception-handling) para reportar errores según la política de la aplicación.
