---
title: "Ciclo de petición y controladores"
description: "Una petición entra por un adaptador ASGI o RSGI. El kernel aplica políticas globales, resuelve la ruta compilada, abre el scope del contenedor y construye el pipeline…"
editUrl: true
lastUpdated: false
---

Una petición entra por un adaptador ASGI o RSGI. El kernel aplica políticas globales, resuelve la ruta compilada, abre el scope del contenedor y construye el pipeline correspondiente. El controlador trabaja con `Request`, servicios inyectados y respuestas independientes del servidor. Al finalizar se persiste la sesión cuando corresponde, se envía la respuesta y se liberan cuerpos, archivos y servicios del scope.

## Un controlador de lectura

Guarda el controlador en `app/http/controllers/catalog_controller.py`:

```python
from orionis.http import Request, Response, response
from orionis.http.base.controller import BaseController

class CatalogController(BaseController):
    async def show(self, request: Request) -> Response:
        product_id = request.routeParam("product_id")
        return response.json({"id": product_id, "currency": "USD"})
```

Regístralo en `routes/api.py`:

```python
from app.http.controllers.catalog_controller import CatalogController
from orionis.support.facades import Route

Route.get("/products/{product_id:int}", [CatalogController, "show"])
```

Con el servidor de desarrollo iniciado, `GET /products/42` devuelve HTTP 200 y `{"id": 42, "currency": "USD"}`. El convertidor de ruta entrega el entero `42`. `BaseController` es un marcador vacío: no proporciona métodos de autorización, validación ni acceso al ORM. Esas tareas pertenecen a sus servicios.

También puedes registrar una función o una clase con `__call__`. Para completar una declaración diferida usa `Route.get("/products").action(CatalogController, "show")` antes de compilar las rutas. El método y su información de tipos se inspeccionan durante el arranque; las dependencias del controlador se construyen mediante el contenedor.

## Elegir web o API

El loader importa primero `routes/web.py` y luego `routes/api.py`; la ubicación determina el tipo de ruta. Las rutas web incorporan sesión, CSRF y resolución de identidad de sesión. Las rutas API utilizan resolución de identidad mediante token y no añaden automáticamente estado de navegador. Resolver identidad permite invitados; exige autenticación explícitamente para proteger recursos.

`public()` selecciona el perfil HTTP sin estado y elimina las capas de sesión, CSRF e identidad. Úsalo para endpoints que no necesitan credenciales de cookies ni la identidad actual. Las políticas globales continúan aplicándose. No lo uses como sustituto de una decisión de autorización.

## Asincronía, scopes y fallos

Escribe `async def` para operaciones con I/O y espera las APIs asíncronas. El soporte para funciones síncronas no convierte una llamada bloqueante dentro de un controlador asíncrono en trabajo seguro para el event loop. Delega CPU o I/O síncrono largo a servicios adecuados.

La solicitud y su identidad viven en un scope. No conserves el `Request`, la sesión ni el contexto autenticado en singletons o variables globales. El kernel precarga y reutiliza instancias de middleware: almacena datos de cada petición en variables locales o `request.state`.

Las excepciones de validación y autenticación se convierten mediante los manejadores del framework. Una excepción después de enviar encabezados de streaming ya no puede reemplazar el estado HTTP enviado. Diseña el trabajo de preparación para fallar antes de devolver el stream.

## Continuar

Consulta [rutas](/es/http/routing), [middleware](/es/http/middleware-and-security) y [fallos](/es/architecture/exception-handling).
