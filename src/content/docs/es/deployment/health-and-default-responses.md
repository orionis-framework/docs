---
title: "Salud, errores y rutas predeterminadas"
description: "Consulta la ruta de salud, publica un favicon, robots.txt y sitemap, y utiliza las respuestas de error predeterminadas."
editUrl: true
lastUpdated: false
---

El router registra favicon, `robots.txt`, `sitemap.xml` y la ruta de salud configurada por la aplicación. `DefaultResponses` renderiza páginas mediante `IViewEngine`, sirve un conjunto cerrado de recursos del paquete y ofrece respuestas JSON cuando corresponde. No es un servidor estático para cualquier archivo del proyecto.

## Comprobar disponibilidad

La ruta de salud devuelve 200 en estado normal y 503 durante mantenimiento. `Accept: application/json` solicita JSON con un mensaje de estado; la representación HTML muestra la página correspondiente. Es una señal del estado de la aplicación, no una comprobación automática de cada base de datos, cola o dependencia externa.

Un servicio que inyecta `IDefaultResponses` también puede llamar a `await pages.favicon()`, `await pages.robotsTxt()` o `await pages.sitemapXml()`. Cada método devuelve una respuesta de archivo si encuentra un candidato o una respuesta de error HTTP si falta.

### Publicar archivos para buscadores y un favicon

Coloca los archivos en el directorio de almacenamiento público de la aplicación (`storage/app/public` por defecto). El router expone las siguientes rutas GET:

| Ruta | Archivo de la aplicación, en orden de búsqueda | Si falta |
| --- | --- | --- |
| `/favicon.ico` | `favicon.ico`, después `favicon.png` y por último `favicon.svg` | Utiliza el icono incluido en el paquete. |
| `/robots.txt` | `robots.txt` | Utiliza el archivo robots del paquete. |
| `/sitemap.xml` | `sitemap.xml` | Devuelve HTTP 404. |

Para generar el sitemap a partir de los datos de tu aplicación, registra una acción GET en `/sitemap.xml`. Una ruta GET de la aplicación en cualquiera de estas tres direcciones sustituye a su manejador predeterminado.

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

Registra el helper una vez en `routes/web.py`. Para sustituir un controlador, pasa `login_controller`, `register_controller` o `forgot_password_controller`. El registro predeterminado utiliza `app.models.user.User`, plantillas de la aplicación, hashing y envío de correo. Consulta [los nombres de ruta y las acciones esperadas](/es/authentication/account-recovery). El perfil y el formulario de cambio de contraseña de un usuario autenticado requieren [sus propias rutas web](/es/authentication/session-authentication#cambiar-la-contraseña-de-un-usuario-autenticado).

## Cachés y cambios de archivos

El reloj de las páginas HTML integradas muestra la zona horaria de la aplicación. Si cambia el nombre de la aplicación, el idioma o la zona horaria, el servicio invalida el HTML en caché de los estados disponible y en mantenimiento. Las respuestas JSON de salud indican el estado independientemente del reloj HTML.

Reinicia los workers después de añadir o reemplazar candidatos públicos para que seleccionen el favicon, robots o sitemap esperado. Editar el contenido de un archivo ya seleccionado se refleja en lecturas posteriores. Las páginas de error y excepción se renderizan por petición; no reutilizan el error de otra solicitud. Comprueba la URL de salud configurada por tu aplicación antes de establecer sondas en el balanceador.

Continúa con [recuperación de cuentas](/es/authentication/account-recovery) para conocer los requisitos de las páginas de autenticación.
