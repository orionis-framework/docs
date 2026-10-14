---
title: "Rutas, parámetros y grupos"
description: "Declara rutas durante el arranque, normalmente en routes/web.py o routes/api.py. La facade Route necesita un router registrado en la aplicación. Conserva las acciones y clases…"
editUrl: true
lastUpdated: false
---

Declara rutas durante el arranque, normalmente en `routes/web.py` o `routes/api.py`. La facade `Route` necesita un router registrado en la aplicación. Conserva las acciones y clases de middleware en módulos importables para permitir su reconstrucción desde caché.

## Construir una pequeña API

Coloca este ejemplo completo en `routes/api.py`:

```python
from orionis.http import Request, response
from orionis.support.facades import Route

async def show_product(request: Request):
    return response.json({"id": request.routeParam("product_id")})

async def create_product():
    return response.json({"created": True}, status_code=201)

Route.group(prefix="/catalog", routes=[
    Route.get("/products/{product_id:int}", show_product).name("products.show"),
    Route.post("/products", create_product).name("products.create"),
])
```

`GET /catalog/products/42` devuelve `{"id": 42}` con HTTP 200. `POST /catalog/products` devuelve `{"created": true}` con HTTP 201; el ejemplo confirma la petición, pero no crea un registro en la base de datos. El grupo recibe rutas ya registradas; no es un context manager ni una función decoradora. Puedes incluir otros `RouteGroup` para anidar prefijos. `middleware`, `without_middleware` y `public` son opciones del grupo; un `public` explícito en una ruta conserva prioridad sobre el heredado. Un grupo vacío no configura declaraciones posteriores.

## Convertir parámetros

| Sintaxis | Valor y restricción |
|---|---|
| `{name}` o `{name:str}` | Texto no vacío sin `/`. |
| `{name:slug}` | Letras minúsculas ASCII, dígitos y guiones. |
| `{name:int}` | Dígitos convertidos a `int`; el patrón no acepta signo negativo. |
| `{name:uuid}` | UUID canónico convertido a `uuid.UUID`. |

`request.routeParam("name")` obtiene un valor y `routeParams()` devuelve el mapping. Un valor que no satisface el patrón no coincide con la ruta; no equivale a una validación de cuerpo. No hay convertidores `float`, `path` ni parámetros opcionales declarados en el registro actual.

## Acciones, nombres y middleware

Los helpers disponibles son `get`, `post`, `put`, `patch`, `delete` y `query`. `query` declara el método HTTP `QUERY`: no añade parámetros de URL. `view(path, template)` crea una ruta GET de plantilla. `websocket` y `hub` registran conexiones independientes de las rutas HTTP.

Una acción puede ser una función, una clase invokable o `[Controller, "method"]`. Los builders admiten `.name(...)`, `.prefix(...)`, `.middleware(...)`, `.withOutMiddleware(...)` y `.public()`. Respeta la mayúscula interna de `withOutMiddleware`; la opción del grupo se escribe `without_middleware`.

```python
from orionis.auth.middleware import AuthenticateTokenMiddleware

Route.get("/private/product/{product_id:int}", show_product).middleware(AuthenticateTokenMiddleware)
```

Los nombres sirven para identificar rutas y generar enlaces en servicios que consumen el router.

## Conflictos, fallback y caché

Las rutas estáticas tienen búsqueda directa; las dinámicas se compilan y ordenan por especificidad. Los conflictos estáticos, estructuras dinámicas ambiguas, nombres incompatibles y acciones sin completar fallan en registro/compilación. Solo existe un fallback, declarado con `Route.fallback(handler)`. Un método incorrecto tiene tratamiento distinto de una ruta ausente.

Los GET predeterminados de favicon, robots y sitemap pueden reemplazarse declarando la misma ruta. No dependas de sobrescribir rutas normales. Cuando uses modo compilado, conserva clases y funciones con nombres importables; lambdas y clases locales no son un contrato portable de caché. La caché contiene versión y se rechaza si es incompatible.
