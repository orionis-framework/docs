---
title: "HTTP: de la ruta a la respuesta"
description: "La capa HTTP de Orionis ofrece una API común sobre ASGI y RSGI. El mismo controlador puede recibir una solicitud normalizada, validar datos y devolver una respuesta JSON, HTML,…"
editUrl: true
lastUpdated: false
---

La capa HTTP de Orionis ofrece una API común sobre ASGI y RSGI. El mismo controlador puede recibir una solicitud normalizada, validar datos y devolver una respuesta JSON, HTML, archivo, stream o SSE. Las conexiones WebSocket utilizan una API separada sobre el mismo sistema de rutas.

Necesitas Python 3.14+, las dependencias declaradas del framework y una aplicación inicializada para utilizar facades y servicios del contenedor. Los ejemplos de funciones son código de aplicación: se ejecutan cuando el kernel atiende una petición. Los ejemplos que solo construyen respuestas pueden utilizarse sin arrancar un servidor.

Crea primero un proyecto Orionis siguiendo [instalación](/es/getting-started/installation). Las rutas de archivo siguientes parten de tu aplicación, no del paquete instalado del framework. Las declaraciones de rutas se ejecutan al iniciar la aplicación; los handlers se ejecutan cuando una petición coincide con su ruta.

Comprueba la llamada existente `app.withRouting(...)` en `bootstrap/app.py`: debe registrar los archivos que uses, normalmente `web="routes/web.py"` y `api="routes/api.py"`. Crear un archivo de rutas sin registrarlo no publica sus endpoints. Conserva los argumentos existentes al añadir otro archivo.

## Recorrido recomendado

1. [Controladores HTTP](/es/http/request-lifecycle): generación, acciones, parámetros e integración con rutas.
2. [Rutas, parámetros y grupos](/es/http/routing): diseña una API y organiza acceso.
3. [Validación HTTP con schemas](/es/http/requests-and-validation): recibe datos validados en controladores y devuelve schemas como JSON.
4. [Formularios y archivos](/es/http/forms-and-uploads): entradas repetidas y recursos temporales.
5. [Respuestas y cookies](/es/http/responses): JSON, vistas, redirecciones y descargas.
6. [Streaming y SSE](/es/http/streaming-and-sse): entrega progresiva y limpieza.
7. [WebSocket](/es/http/websockets): conexión, mensajes y middleware.
8. [Middleware HTTP](/es/http/middleware-and-security): creación, registro y procesamiento de peticiones y respuestas.
9. [Páginas y rutas predeterminadas](/es/http/default-responses): salud, errores y autenticación opcional.

Continúa con [sesiones](/es/http/sessions), [autenticación](/es/security/authentication), [schemas](/es/validation), [vistas](/es/services/views) y [hubs Realtime](/es/asynchronous/realtime).
