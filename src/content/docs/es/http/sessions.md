---
title: "Sesiones HTTP"
description: "Una sesión conserva datos en el servidor y envía al navegador únicamente un identificador aleatorio. Orionis la crea de forma perezosa: leer una sesión vacía no genera…"
editUrl: true
lastUpdated: false
---

Una sesión conserva datos en el servidor y envía al navegador únicamente un identificador aleatorio. Orionis la crea de forma perezosa: leer una sesión vacía no genera automáticamente registro ni cookie. El middleware web coordina restauración, flash, persistencia y limpieza.

Utiliza rutas web en `routes/web.py` para el estado de navegador. Las rutas API no restauran ni guardan una sesión automáticamente. Empieza con [estado y flash](/es/http/sessions/state-and-flash), donde un POST guarda una preferencia y el GET siguiente la lee; elige almacenamiento persistente antes de desplegar varios workers.

1. [Estado y flash](/es/http/sessions/state-and-flash): preferencias, formularios y navegación entre peticiones.
2. [Almacenamiento y concurrencia](/es/http/sessions/stores-and-concurrency): elegir driver e implementar un store.
3. [Configuración y ciclo seguro](/es/http/sessions/configuration-and-security): cookies, renovación y rotación.

Necesitas Python 3.14+ y rutas web para persistencia automática. `orionis.session` no reexporta clases en su raíz: inyecta `ISession`, usa la facade `Session` o importa la implementación desde su módulo. Lee antes [HTTP](/es/http) y continúa con [autenticación](/es/security/authentication).
