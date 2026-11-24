---
title: "Salud, errores y rutas predeterminadas"
description: "El router registra favicon, robots.txt, sitemap.xml y la ruta de salud configurada por la aplicación. DefaultResponses renderiza páginas mediante IViewEngine, sirve un conjunto…"
editUrl: true
lastUpdated: false
---

El router registra favicon, `robots.txt`, `sitemap.xml` y la ruta de salud configurada por la aplicación. `DefaultResponses` renderiza páginas mediante `IViewEngine`, sirve un conjunto cerrado de recursos del paquete y ofrece respuestas JSON cuando corresponde. No es un servidor estático para cualquier archivo del proyecto.

## Comprobar disponibilidad

La ruta de salud devuelve 200 en estado normal y 503 durante mantenimiento. `Accept: application/json` solicita JSON con un mensaje de estado; la representación HTML muestra la página correspondiente. Es una señal del estado de la aplicación, no una comprobación automática de cada base de datos, cola o dependencia externa.

Un servicio que inyecta `IDefaultResponses` también puede llamar a `await pages.favicon()`, `await pages.robotsTxt()` o `await pages.sitemapXml()`. Cada método devuelve una respuesta de archivo si encuentra un candidato o una respuesta de error HTTP si falta.

Puedes reemplazar los GET de favicon, robots y sitemap declarando esos paths en rutas de aplicación. Los archivos públicos usan una selección de candidatos con fallback del paquete donde existe. Un sitemap ausente puede terminar en 404; no se genera un catálogo de URLs de negocio.

## Presentar errores desde un servicio

```python
from orionis.http.default.contracts.responses import IDefaultResponses

async def unavailable(pages: IDefaultResponses):
    return await pages.error(
        503, {"message": "Catalog temporarily unavailable"},
        expects_json=True, headers={"Retry-After": "30"},
    )
```

El contenedor debe resolver `IDefaultResponses` en una aplicación inicializada. `error` acepta estado entero/`HTTPStatus` entre 100 y 599 y contenido texto o diccionario. HTML escapa la descripción; JSON conserva los valores. El ejemplo devuelve tanto `Retry-After: 30` como `Cache-Control: no-cache, no-store, must-revalidate`. El servicio añade esa política cuando falta `Cache-Control` y conserva el valor que proporcione el llamador.

Las páginas de excepción contienen traceback y contexto y pueden incluir un enlace de asistencia que codifica parte del diagnóstico en una URL. Revisa qué información muestra tu manejador y configura debug para el entorno. El método `exception()` no constituye por sí solo una frontera de autorización para ver detalles.

## Personalizar autenticación opcional

`Route.auth()` registra GET/POST de login, registro y recuperación; GET de verificación de email y POST de logout. Logout exige identidad de sesión. Las páginas para invitados usan `GuestMiddleware`; la verificación admite el enlace desde un navegador ya autenticado. El pipeline web proporciona sesión y CSRF.

```python
from orionis.support.facades import Route

Route.auth()
```

Solo declara una vez desde rutas web. Puedes pasar `login_controller`, `register_controller` y `forgot_password_controller` para reemplazar cada controlador. Conserva los métodos que espera [el registro real](https://github.com/orionis-framework/framework/blob/v1.9.0/orionis/http/routes/auth.py). Los controladores predeterminados de registro/perfil dependen del modelo `app.models.user.User`, vistas, hashing y correo de la aplicación; no son un flujo genérico para cualquier modelo. Comprueba esos contratos antes de activarlos. Consulta [recuperación de cuentas](/es/authentication/account-recovery).

## Cachés y cambios de archivos

El reloj de las páginas HTML integradas muestra la zona horaria de la aplicación. Si cambia el nombre de la aplicación, el idioma o la zona horaria, el servicio invalida el HTML en caché de los estados disponible y en mantenimiento. Las respuestas JSON de salud indican el estado independientemente del reloj HTML.

Reinicia los workers después de añadir o reemplazar candidatos públicos para que seleccionen el favicon, robots o sitemap esperado. Editar el contenido de un archivo ya seleccionado se refleja en lecturas posteriores. Las páginas de error y excepción se renderizan por petición; no reutilizan el error de otra solicitud. Comprueba la URL de salud configurada por tu aplicación antes de establecer sondas en el balanceador.

Continúa con [recuperación de cuentas](/es/authentication/account-recovery) para conocer los requisitos de las páginas de autenticación.
