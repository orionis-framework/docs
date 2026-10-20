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

1. [Rutas](/es/http/routing): métodos, parámetros, grupos y registro de endpoints.
2. [Middlewares](/es/http/middleware-and-security): creación, registro y procesamiento de peticiones y respuestas.
3. [Controladores](/es/http/request-lifecycle): generación, acciones, parámetros e integración con rutas.
4. [Validación](/es/http/requests-and-validation): recibe datos validados en controladores y devuelve schemas como JSON.
5. [Request y payloads HTTP](/es/http/forms-and-uploads): lectura de la petición, formatos del cuerpo y archivos subidos.
6. [Respuestas](/es/http/responses): JSON, schemas, vistas, redirecciones y descargas.
7. [Excepciones HTTP](/es/http/exceptions): respuestas de error y página de diagnóstico.

Para otros flujos y servicios HTTP, consulta [streaming y SSE](/es/http/streaming-and-sse), [WebSocket](/es/http/websockets) y [páginas y rutas predeterminadas](/es/http/default-responses).

Continúa con [sesiones](/es/http/sessions), [autenticación](/es/security/authentication), [schemas](/es/validation), [vistas](/es/services/views) y [hubs Realtime](/es/asynchronous/realtime).
