---
title: "Excepciones HTTP y página de diagnóstico"
description: "Comprende las respuestas de error del flujo HTTP, la página de excepción en debug y la información que ayuda a localizar el fallo."
editUrl: true
lastUpdated: false
---

Una excepción puede interrumpir la lectura del cuerpo, un middleware, la resolución de dependencias o una acción del controlador. Las capas HTTP y el kernel transforman los fallos que pueden manejar en una respuesta para el cliente. El resultado depende del tipo de excepción, del modo debug y del momento en que ocurre.

Esta página se centra en **peticiones y respuestas HTTP**. La [guía general de excepciones](/es/architecture/exception-handling), ubicada en **Despliegue, logs y errores**, explica `app.withExceptionHandler(ExceptionHandler)`, los contratos de `failure`, el reporte y los demás contextos del framework.

## De la excepción a la respuesta HTTP

Durante el procesamiento de una petición, Orionis distingue entre respuestas especiales del flujo HTTP y errores que debe delegar al manejador de aplicación:

1. Una capa puede resolver directamente el caso, como los errores de validación.
2. Para los demás errores, el sistema de excepciones reporta el fallo y solicita al handler una respuesta HTTP.
3. El adaptador ASGI/RSGI entrega esa respuesta con su estado, cabeceras y cuerpo.

En WEB, la capa de sesión también puede capturar errores de sus componentes siguientes y delegarlos mientras la sesión sigue disponible. Por ello, la conversión no ocurre exclusivamente en un único `except` al final del kernel.

Una respuesta de error no siempre es un `500` ni muestra un traceback. Un fallo de autorización puede producir `403`; una ruta inexistente, `404`; y un schema inválido, `422` o una redirección según su contexto.

## Cuándo aparece la página de excepción

El manejador nativo conserva los estados de las excepciones conocidas. Para las **excepciones no reconocidas**, consulta `app.debug`:

| Modo | Lo que solicita el cliente | Respuesta nativa ante un error no reconocido |
| --- | --- | --- |
| Debug desactivado | HTML u otro Accept sin JSON | Página HTML genérica, estado `500`. |
| Debug desactivado | Accept con JSON | JSON `500`: `{"message": "Internal Server Error"}`. |
| Debug activado | HTML | Página HTML detallada de excepción, estado `500`. |
| Debug activado | Accept con JSON | La misma página HTML detallada, estado `500`. |

**Una ruta API no garantiza JSON para un fallo inesperado con debug activo.** La página detallada permite depurar ese fallo también cuando el endpoint normalmente devuelve JSON. Las políticas de protocolo, como MCP, y los handlers personalizados pueden aplicar otra respuesta.

La configuración se declara mediante `APP_DEBUG` y se consulta desde `config/app.py`. Para observar el diagnóstico localmente:

```dotenv
APP_DEBUG=bool:true
```

Reinicia la aplicación para aplicar su configuración de arranque. Si utilizas compilación, consulta las [consideraciones de registro y configuración](/es/architecture/exception-handling#configuración-compilada-y-procesos-activos).

El nombre de entorno `APP_ENV` no sustituye este ajuste: un entorno llamado producción con debug activo sigue exponiendo el diagnóstico.

## Provocar y reconocer un fallo de ejemplo

Para probar el flujo en una aplicación local, guarda este controlador en `app/http/controllers/http_error_demo_controller.py`:

```python
from orionis.http import JSONResponse, Request, response
from orionis.http.base import BaseController


class HttpErrorDemoController(BaseController):
    async def __call__(self, request: Request) -> JSONResponse:
        quantity = int(request.queryParams.get("quantity", "invalid"))
        return response.json({"quantity": quantity})
```

Regístralo en el archivo de rutas API configurado, normalmente `routes/api.py`:

```python
from app.http.controllers.http_error_demo_controller import HttpErrorDemoController
from orionis.support.facades import Route

Route.get("/http-error-demo", HttpErrorDemoController)
```

Con la aplicación iniciada, abre `/http-error-demo?quantity=invalid` o utiliza:

```bash
curl -i "http://localhost:8000/http-error-demo?quantity=invalid" -H "Accept: text/html"
curl -i "http://localhost:8000/http-error-demo?quantity=invalid" -H "Accept: application/json"
```

`int("invalid")` lanza `ValueError`. El código nativo no lo convierte automáticamente en un error de input `400`: con debug activo, ambas peticiones reciben la página detallada `500`. Con `quantity=3`, el endpoint devuelve `{"quantity":3}`.

Este endpoint demuestra un fallo de programación o una validación omitida. Para una entrada real, declara un [schema de petición](/es/http/requests-and-validation) o trata explícitamente la conversión; conserva este endpoint sólo como demostración local.

## Qué contiene la página y cómo interpretarlo

### Tipo y mensaje de excepción

El encabezado identifica la clase, como `ValueError`, y el mensaje asociado. La clase indica qué operación falló; el texto aporta el detalle concreto, por ejemplo que una cadena no puede convertirse a entero.

Un mensaje no identifica por sí solo la causa de negocio. Contrástalo con la línea señalada y con los argumentos que esperaba esa operación.

### Método y ruta de la petición

La página muestra el método HTTP y el path que se estaba procesando. Ayudan a distinguir endpoints con lógica parecida y a reproducir el fallo en el recorrido correcto.

El diagnóstico recibe el path de la petición, no un volcado completo de la URL con todos sus parámetros, del cuerpo o de las cabeceras.

### Exception Details: archivo, línea y código

Cada frame puede mostrar su archivo, número de línea y fragmento de código, destacando la línea del fallo. La ventana incluye hasta cinco líneas: dos anteriores, la línea indicada y dos posteriores.

Esto permite ver la operación junto con su contexto inmediato. En el ejemplo anterior, comienza por la conversión a `int` y comprueba si la entrada se validó antes.

Si el archivo fuente no puede leerse, el diagnóstico conserva los datos disponibles e indica que no hay código para mostrar. Esto puede ocurrir cuando el código no está disponible como un archivo legible en ese entorno.

El enlace al editor utiliza el protocolo `vscode://file/...`. Su apertura depende de que el equipo tenga un editor y un navegador que admitan ese protocolo y puedan acceder a la ruta mostrada.

### Stack Trace: recorrido de llamadas

El panel lateral enumera archivo, función y línea de los frames, ordenados **del más reciente al más antiguo**. Seleccionar uno lleva al bloque de código correspondiente.

Empieza por el frame del fallo y recorre las llamadas que lo precedieron. Eso permite identificar si el error se originó en el controlador, un servicio invocado, la conversión de datos o una dependencia del framework. Los enlaces y el contenido siguen disponibles sin JavaScript; la interacción mejora la navegación entre frames.

### System Info: contexto de ejecución

| Dato | Para qué sirve |
| --- | --- |
| Orionis Framework | Identificar la implementación que está ejecutándose. |
| Python | Comparar el comportamiento del intérprete entre entornos. |
| Environment | Reconocer el entorno configurado. |
| Debug Mode | Confirmar el estado de la configuración de diagnóstico. |
| Timezone | Contextualizar operaciones que dependen de fechas y horas. |
| Interface | Saber si la entrega HTTP utiliza ASGI o RSGI. |

Estos datos permiten comparar una reproducción local con otro despliegue. El panel no enumera todas las variables de entorno ni todas las opciones de configuración.

## Copiar el reporte y consultar recursos

La página incorpora herramientas que utilizan la información del diagnóstico:

| Acción | Contenido y comportamiento |
| --- | --- |
| Copiar reporte | Copia tipo y mensaje, método y path, rutas, líneas y fragmentos de código. El botón depende de que el navegador ofrezca Clipboard API. |
| Google | Busca por el tipo de excepción Python; no incluye el reporte completo en esa búsqueda. |
| ChatGPT | Abre un enlace con el diagnóstico codificado en la URL. |
| Documentación | Abre la documentación del framework. |

La URL de ChatGPT se construye localmente; renderizar la página no envía una consulta al servicio. **Abrir ese enlace sí transmite el contenido incluido en la URL.** La implementación limita su longitud a 2048 caracteres: puede omitir snippets, compactar campos o descartar frames antiguos, indicando el recorte. Ese límite pertenece al generador de Orionis.

Antes de compartir un reporte, revisa el mensaje y el código que contiene. Aunque el parser no captura variables locales, el mensaje de una excepción o un fragmento fuente puede contener información privada.

## Excepciones HTTP con estado conocido

El manejador base recorre la jerarquía de la excepción para reconocer estos casos, incluidas sus subclases:

| Excepción | Estado | Mensaje público nativo |
| --- | --- | --- |
| `AuthenticationException` | `401` | `Unauthenticated` |
| `AuthorizationException` | `403` | `This action is unauthorized` |
| `RouteNotFound` | `404` | `Route not found` |
| `MethodNotAllowed` | `405` | `Method not allowed` |
| `PayloadTooLargeException` | `413` | `Payload too large` |
| `UnsupportedMediaTypeException` | `415` | `Unsupported media type` |
| `CSRFTokenMismatchException` | `419` | `CSRF token mismatch` |

Estos casos conservan su estado y mensaje tanto con debug activo como desactivado. El handler decide entre JSON y HTML mediante `request.wantsJson()`, que consulta Accept; no por el nombre del archivo de rutas. Si el fallo de autenticación procede del guard de token, añade `WWW-Authenticate: Bearer`.

El kernel puede resolver antes algunos casos con su propia respuesta, por lo que el mensaje exacto de un `413` depende de la capa que lo maneje. No todas las excepciones recorren el handler global.

## Validación, parsing y otros errores del flujo

| Situación | Tratamiento HTTP predeterminado |
| --- | --- |
| Schema inválido en API | JSON `422` con mensajes por campo. |
| Schema inválido en WEB que espera JSON o es AJAX | JSON `422`. |
| Schema inválido en navegación WEB habitual | Redirección `302` con errores e input flash. |
| Límite de cuerpo o buffer excedido en el kernel | `413`; puede resolverse antes de llamar al handler global. |
| Content-Length inválido, duplicado o ambiguo con Transfer-Encoding | `400` construido antes de leer el cuerpo. |
| Ruta inexistente con fallback configurado | Ejecuta el fallback correspondiente. |
| Excepción propia sin tratamiento específico | Política del handler de aplicación; por defecto, `500` genérico o diagnóstico según debug. |

Un JSON mal formado puede lanzar `ValueError`; XML o MessagePack utilizan sus excepciones de decodificación. No hay una regla universal que convierta cualquier excepción de parsing en `400`. Consulta los [errores de lectura de Request](/es/http/forms-and-uploads#errores-de-lectura-y-validación) y el [manejo de validación](/es/validation/controllers-and-http).

Si una condición de dominio necesita una respuesta como `409`, su traducción se define en el [handler de aplicación](/es/architecture/exception-handling/handling-exceptions). Capturar una excepción localmente y devolver una respuesta también es válido cuando ese componente puede resolver el caso.

## Diagnóstico en desarrollo y respuesta pública

Para una aplicación expuesta a usuarios, desactiva debug:

```dotenv
APP_DEBUG=bool:false
```

Con el handler nativo, un error no reconocido devuelve `Internal Server Error` sin el traceback. La [guía general](/es/architecture/exception-handling) explica cómo conservar el reporte interno y definir mensajes públicos para errores propios.

Las plantillas de error escapan el HTML y las respuestas nativas incluyen `Cache-Control: no-cache, no-store, must-revalidate`. El escape evita interpretar texto como HTML; no elimina secretos de los mensajes o del código.

El parser utiliza `capture_locals=False` y no incorpora automáticamente variables locales, cuerpo, cookies o cabeceras de la petición. Aun así, la página muestra rutas de archivos y código fuente, por lo que corresponde a un contexto de diagnóstico controlado.

`DefaultResponses.exception()` es un renderer y no aplica por sí mismo el filtro de debug. Una llamada directa desde código propio puede mostrar el diagnóstico aunque debug esté desactivado; conserva la decisión de exposición en la política de manejo.

## Si la respuesta ya comenzó a enviarse

La conversión a una página de error sucede durante el procesamiento de la petición. La entrega del cuerpo, los productores de streaming y las tareas background ocurren después.

Si un productor falla cuando ya se enviaron cabeceras, no se puede sustituir esa respuesta por una página de excepción. El transporte intenta cerrar los recursos y propaga el fallo. Los errores de background tampoco cambian un estado HTTP que ya se entregó.

Consulta [respuestas y entrega HTTP](/es/http/responses), [streaming y SSE](/es/http/streaming-and-sse) y la [guía general de excepciones](/es/architecture/exception-handling) para sus respectivos límites.
