---
title: "Notas de versión"
description: "Cambios de Orionis 1.0.8 a 1.1.0: concurrencia limitada, APIs por lotes, colas de logging, límites de caché y actualización."
editUrl: true
lastUpdated: false
---

Estas notas reúnen los cambios de las versiones **1.0.8 a 1.1.0** y enlazan las guías de uso actualizadas. Los ejemplos de Reactor se ejecutan desde la raíz de la aplicación con su entorno de Python.

<a id="v1-1-0"></a>

## 1.1.0: ejecución limitada y APIs por lotes

La versión **1.1.0** añade APIs opcionales para fallos concurrentes de caché, consultas por lotes, lotes SMTP, preparación de plantillas y trabajo bloqueante de la aplicación. También limita las cachés internas y la admisión a los workers. Se mantiene el requisito de **Python 3.14+**.

| Área | Cambio y guía de uso |
| --- | --- |
| Callbacks bloqueantes | [`@threaded` y `BoundedExecutor`](/es/utilities/helpers/concurrency) conservan las firmas para DI y las variables de contexto, con límites explícitos de ejecución. |
| Caché | [`rememberOnce()`](/es/cache/caching-values#repository-rememberonce) comparte resoluciones simultáneas; un lease opcional del backend coordina otros consumidores. Las operaciones por lotes de File reducen las transiciones a workers. |
| ORM y constructor SQL | [`chunks(size=1000)`](/es/orm/collections-and-pagination#query-chunks) entrega colecciones con orden determinista sin materializar el resultado completo. |
| SMTP | [`SmtpTransport.sendMany()`](/es/mail/transports-and-extensions#smtp-batches) envía hasta 100 mensajes preparados mediante una conexión e informa resultados parciales. |
| Logging | [`queue_capacity`](/es/logging/configuration#logging-queue-capacity) habilita la entrega en segundo plano con capacidad limitada; [`aclose()`](/es/logging/rotation-and-lifecycle#logging-async-close) cierra los recursos de logging pendientes. El valor predeterminado mantiene la escritura síncrona. |
| Hashing | [Argon2 y bcrypt](/es/cryptography/hashing/password-storage#hashing-worker-budget) comparten un límite dedicado de workers sin cambiar los parámetros criptográficos. |
| Vistas | [`warmup()`](/es/views/configuration-and-cache#view-warmup) prepara plantillas; la carga inicial de nivel superior y la comprobación de recarga se ejecutan en un pool dedicado. |
| Storage | [`stream.chunks()`](/es/storage/streaming-and-uploads#stream-chunks) y las lecturas nativas agrupadas mantienen límites de consumo y cierre explícito de recursos. |
| Estado retenido | Los [mapas de traducción](/es/localization/messages-and-locales#locale-cache-limits) y los [planes de schemas](/es/validation/validation-and-errors#validation-plan-cache) utilizan cachés limitadas. |

Otros cambios internos reducen la inspección repetida de dependencias, la preparación de hidratación de modelos, la conversión de headers y las comparaciones de colecciones. La autenticación nativa puede combinar la consulta del token y su propietario conservando la comprobación final de revocación y expiración. Las transiciones de colas Redis usan identificadores de scripts con recuperación ante `NOSCRIPT`. Consulta [autenticación por tokens](/es/authentication/personal-access-tokens#token-lookup-performance), [colas Redis](/es/queues/drivers-and-configuration#redis-script-cache) y [valores únicos en colecciones](/es/utilities/helpers/collection#collection-unique-performance). Estos cambios no implican una mejora universal de rendimiento para todas las aplicaciones.

### Actualizar una aplicación existente

Desde la raíz de la aplicación, selecciona la nueva versión del runtime y sincroniza el entorno:

```bash
uv add "orionis==1.1.0"
uv sync
```

Para un entorno administrado directamente con pip, usa `python -m pip install --upgrade "orionis==1.1.0"`. Esto actualiza el paquete del framework; no regenera la configuración de la aplicación ni instala un nuevo skeleton. Revisa y regenera la configuración compilada mediante el [flujo de configuración](/es/environment/compiled-configuration), si lo utilizas, y reinicia los procesos de aplicación y workers.

`remember()`, `get()`, el envío individual de correo y los callbacks síncronos conservan sus APIs. Adopta las nuevas APIs por lotes y en hilos de forma explícita. Define cómo responder a `WorkQueueFullError`, `queue.Full` de logging, timeouts de admisión y entregas SMTP parciales. La cancelación puede esperar una operación nativa que ya empezó; configura timeouts finitos de I/O. La [tabla de workers](/es/utilities/helpers/concurrency#framework-worker-budgets) muestra los límites por proceso.

<a id="v1-0-16"></a>

## 1.0.16: listas de orígenes MCP y configuración del Inspector

`allowed_origins` de MCP utiliza ahora `list[str]`, como la configuración HTTP. Se siguen aceptando listas y tuplas como entrada; cada instancia de configuración conserva una lista independiente.

La configuración editable `BootstrapMcp` de `config/mcp.py` utiliza `["https://inspector.orionis-framework.com"]` cuando `CORS_ALLOW_ORIGINS` no está definida. La entidad `McpConfig` del núcleo utiliza `[]` si esa variable está ausente y no incluye la URL del Inspector. Una lista explícita en `CORS_ALLOW_ORIGINS` reemplaza el valor editable, incluso si está vacía.

En una aplicación existente, actualiza el campo `allowed_origins` de su `config/mcp.py` para adoptar este valor; actualizar únicamente el framework instalado no reescribe tu configuración. El campo utiliza `field` de `dataclasses` y `Env` de `orionis.environment`:

```python
allowed_origins: list[str] = field(
    default_factory=lambda: Env.get(
        "CORS_ALLOW_ORIGINS", ["https://inspector.orionis-framework.com"],
    ),
)
```

También puedes declarar los orígenes permitidos explícitamente mediante el entorno:

```dotenv
CORS_ALLOW_ORIGINS=["https://inspector.orionis-framework.com"]
```

MCP acepta peticiones sin `Origin`. Si la cabecera aparece, debe coincidir exactamente con un origen HTTP(S) configurado; de lo contrario, el transporte devuelve `403`. Cada entrada contiene únicamente esquema, host y puerto opcional, sin ruta ni barra final. Se mantiene el rechazo de comodines y no existe una excepción implícita de mismo origen; `[]` rechaza toda cabecera `Origin` presente.

La variable de entorno se comparte con CORS HTTP, pero MCP conserva su validación más estricta. En particular, el valor `["*"]` de CORS HTTP mostrado para [1.0.15](#v1-0-15) no es válido en MCP. Utiliza orígenes explícitos cuando compartas esta variable y configura CORS HTTP para admitir los métodos, cabeceras y peticiones preflight del navegador. Consulta la [configuración MCP](/es/mcp/stdio-and-configuration#orígenes-http-permitidos) y las [pruebas en el navegador](/es/mcp/testing#inspeccionar-un-servidor-http-desde-el-navegador).

<a id="v1-0-15"></a>

## 1.0.15: CORS HTTP para herramientas de depuración

Esta versión complementa el cambio de orígenes permitidos iniciado en [1.0.13](#v1-0-13). CORS HTTP utiliza ahora `["*"]` por defecto para orígenes, métodos y cabeceras:

```dotenv
CORS_ALLOW_ORIGINS=["*"]
CORS_ALLOW_METHODS=["*"]
CORS_ALLOW_HEADERS=["*"]
```

Con estos valores, las peticiones y sus comprobaciones preflight `OPTIONS` admiten los métodos y cabeceras necesarios para probar la API desde herramientas de depuración como Postman, EchoAPI o Hoppscotch en el navegador, siempre que este pueda alcanzar el endpoint. No necesitas declarar cada método o cabecera para esas pruebas.

Los valores corresponden a `allow_origins`, `allow_methods` y `allow_headers` en la configuración `Cors` de HTTP. Para restringirlos, declara listas explícitas. `allow_credentials` sigue siendo `False` y `expose_headers` conserva `[]`; si habilitas credenciales, debes configurar orígenes explícitos. Consulta [CORS HTTP](/es/http/middleware#cors-http).

<a id="v1-0-14"></a>

## 1.0.14: validación de schemas

Se mejora el sistema de validación de `orionis.schemas`, tanto para datos de entrada como para schemas devueltos por controladores HTTP.

### Errores estructurados y múltiples fallos por campo

Cada elemento de `ValidationException.errors[campo]` contiene ahora `rule` y `message`. Las reglas personalizadas conservan su identificador `__code__`; las restricciones nativas informan códigos como `ge`, `gt`, `multiple_of` o `min_length`.

El validador acumula las restricciones y reglas aplicables a un mismo campo. Por ejemplo, una cantidad negativa e impar puede incumplir simultáneamente `GreaterThanOrEqual(1)` y `MultipleOf(2)`. Con mensajes personalizados mediante `message=`, el resultado puede ser:

```json
{
  "message": "Quantity must be positive. (and 1 more error)",
  "errors": {
    "quantity": [
      {"rule": "ge", "message": "Quantity must be positive."},
      {"rule": "multiple_of", "message": "Quantity must be even."}
    ]
  }
}
```

El resumen cuenta fallos, no campos. Cuando el tipo es incompatible, se informa ese error y se omiten las reglas que necesitan el valor convertido. Los errores de schemas hijos y colecciones mantienen su ruta, como `items[0].quantity`. Al actualizar consumidores de la API, lee `error["message"]` donde antes recibías una cadena; `error["rule"]` permite identificar la condición. Los formularios WEB conservan sus mensajes de texto en la bolsa flash. Consulta [validación y errores](/es/validation/validation-and-errors).

### Validación automática de la salida HTTP

Si una acción devuelve directamente una instancia de `Schema`, el framework comprueba sus tipos, restricciones y reglas antes de serializarla. También revalida instancias modificadas y schemas anidados. Una salida inválida sigue el manejo de errores del servidor y produce `500` con la configuración predeterminada.

La comprobación depende del valor devuelto: una anotación de retorno no convierte ni valida un diccionario. Las respuestas `dict` y `Response` mantienen su recorrido sin ejecutar el validador de salida. Si devuelves el mismo schema recibido como entrada, sus reglas se ejecutan de nuevo; utiliza un contrato de salida adecuado cuando las reglas consulten servicios externos. Consulta [schemas en controladores HTTP](/es/validation/controllers-and-http).

### Compilación, rendimiento y generación de reglas

Las restricciones nativas se compilan también dentro de colecciones y uniones, como `list[Field[int, GreaterThanOrEqual(1)]]` y `Nullable[Field[int, GreaterThanOrEqual(1)]]`. Se conservan mensajes personalizados y nombres de campo renombrados. La [declaración de schemas](/es/validation/declaring-schemas) incluye ejemplos ejecutables de los siete aliases de tipos.

La conversión válida mantiene las comprobaciones nativas en C mediante `msgspec`, con planes preparados y reutilizados. La recopilación detallada se reserva para entradas inválidas y se evitan recorridos de Python por hijos sin reglas personalizadas. Las reglas asíncronas y sus operaciones de I/O mantienen su propio coste.

El generador `make:http-schema-rule` utiliza el stub actualizado con `async def enforce(...)`, `__code__` y `__message__`. Consulta [reglas personalizadas](/es/validation/application-rules) para implementar el contrato asíncrono.

<a id="v1-0-13"></a>

## 1.0.13: serve --host y CORS HTTP

El comando `serve` incorpora `--host` para elegir explícitamente la dirección de escucha:

```bash
python reactor serve --host 0.0.0.0 --port 8000
```

`0.0.0.0` escucha en todas las interfaces IPv4. Si omites `--host`, se mantiene `127.0.0.1` en desarrollo y `0.0.0.0` en producción; el puerto predeterminado es `8000`. Consulta [puntos de entrada del servidor](/es/application/server-entrypoints).

La configuración CORS de **HTTP** cambia el valor predeterminado de `allow_origins` a `["*"]`. Esto permite orígenes de navegador externos y facilita probar endpoints con clientes web como Postman o Hoppscotch, sin instalar un cliente de escritorio, siempre que el navegador pueda alcanzar la API. Una lista vacía también se normaliza a `["*"]`; para restringir el acceso por origen, declara una lista de orígenes explícitos.

En 1.0.13, el cambio corresponde a los orígenes permitidos: las peticiones con preflight también necesitan métodos y cabeceras autorizados mediante `allow_methods` y `allow_headers`. [La versión 1.0.15](#v1-0-15) completa esta configuración con `["*"]` por defecto también para métodos y cabeceras. `allow_credentials` sigue siendo `False`; para habilitar credenciales, configura orígenes explícitos en lugar de `"*"`. Consulta [CORS HTTP](/es/http/middleware). Las políticas de origen de WebSocket y MCP se configuran por separado.

<a id="v1-0-12"></a>

## 1.0.12: fachada Debug

Se incorpora `Debug` como acceso al servicio de depuración desde las fachadas:

```python
from orionis.support.facades import Debug

data = {"ready": True, "items": [1, 2, 3]}
Debug.dump(data)
Debug.dd(data)
```

`Debug.dump()` imprime los valores en consola y permite continuar. `Debug.dd()` muestra los valores y detiene la ejecución: en HTTP con depuración activa interrumpe la petición con una respuesta HTML de diagnóstico; en consola termina el proceso. Son llamadas síncronas y requieren una aplicación inicializada. Consulta [Debug](/es/utilities/helpers/debug) para sus opciones, valores de retorno y comportamiento fuera del modo de depuración.

<a id="v1-0-11"></a>

## 1.0.11: rendimiento HTTP y respuestas

Se reducen bloqueos y llamadas redundantes en el recorrido HTTP. La admisión de peticiones ASGI/RSGI utiliza un contador por kernel en el event loop del worker; se omiten pasos innecesarios en rutas públicas sin middleware y consultas de políticas cuando no hay políticas registradas.

Las respuestas HTML, JSON, redirecciones, streaming, SSE y archivos preparan sus cabeceras estándar con menos llamadas. Cada respuesta mantiene sus propias cabeceras mutables; se conservan las reglas de precedencia, los hooks de las subclases y el comportamiento de serialización y streams. Consulta [límites de peticiones](/es/http/requests) y [cabeceras de respuesta](/es/http/responses).

### Estimaciones locales de tiempo

La validación local reportada para esta versión registró **320 pruebas pasando**. La estimación general es de **aproximadamente 10–15 % menos tiempo por petición en el recorrido Python medido**, sin red. La siguiente tabla conserva el alcance de cada medición:

| Área o respuesta | Reducción estimada de tiempo | Qué se midió |
| --- | ---: | --- |
| HTTP ASGI | **≈15 %** | Recorrido por petición, sin red. |
| HTTP RSGI | **≈13 %** | Recorrido por petición, sin red. |
| HTML | **≈10 %** | Construcción de respuesta pequeña. |
| JSON compacto | **≈23 %** | Construcción y serialización de payload pequeño. |
| Redirecciones | **≈11 %** | Construcción y cabeceras. |
| Streaming | **≈19 %** | Construcción, no transferencia. |
| SSE | **≈24 %** | Construcción, no duración del stream. |
| JSON con formato | **Sin mejora estable** | Resultado variable. |
| Archivos y descargas | **Sin mejora estable** | Resultado variable por I/O. |

:::caution[Alcance de las cifras]
Las cifras de construcción son orientativas y tuvieron bastante variabilidad. **No se suman entre sí ni equivalen al mismo incremento en peticiones por segundo (RPS).** No garantizan una mejora de RPS en tu aplicación; archivos y descargas no tienen un porcentaje estable. Mide tu carga completa, incluida la red, la base de datos y el I/O, antes de extrapolar estos resultados.
:::

Estas cifras corresponden a la validación local reportada de 1.0.11; no constituyen un benchmark nuevo de cada versión posterior. Las pruebas de comportamiento cubren, entre otros casos, [recursos de ejecución](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_execution_resources.py), [límites de peticiones](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_request_limits.py) y [construcción de respuestas](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_response_performance.py).

<a id="v1-0-10"></a>

## 1.0.10: schemas de tablas y migración de colas

Se actualiza el stub de creación de schemas de tablas utilizado por `make:database-schema`: el módulo generado declara `TABLE: Final[TableDefinition | None] = None`, en lugar de una clase contenedora. Reemplaza `None` por la definición de la tabla e importa esa constante en tus migraciones y modelos. Revisa el [ejemplo de schema generado](/es/database/schema) y la [referencia del generador](/es/database/commands).

Se añade el comando para preparar explícitamente las tablas de las colas que utilizan base de datos:

```bash
python reactor queue:migrate
```

Si utilizas uv para seleccionar el entorno del proyecto, la invocación equivalente de estas guías es:

```bash
uv run python -B reactor queue:migrate
```

Consulta los [drivers y la preparación de colas](/es/queues/drivers-and-configuration) para seleccionar la conexión y revisar qué tablas se preparan. El comando se ocupa de la infraestructura de colas; las migraciones de la aplicación se ejecutan con `reactor migrate`.

<a id="v1-0-9"></a>

## 1.0.9: pruebas y aplicación de benchmarking

Se corrigen detalles de las pruebas de integración de `uvloop` y de la aplicación Orionis usada en las comparativas HTTP. La comprobación periódica de disponibilidad de esa aplicación pasa de `0.01` a `0.1` segundos. El ajuste pertenece al arranque del benchmark y no establece la latencia por petición ni una mejora de RPS.

La [aplicación de comparación HTTP](https://github.com/orionis-framework/framework/blob/cd986045b/benchmarks/http_compare/apps/orionis.py) forma parte del repositorio de desarrollo del framework. Para las pruebas de tu aplicación, continúa usando la [guía de testing](/es/testing/writing-and-running-tests).

<a id="v1-0-8"></a>

## 1.0.8: Loop y Python 3.14

Se refactoriza `Loop` para que el registro, la propiedad y la limpieza del event loop tengan un comportamiento predecible en Python 3.14. Los puntos de entrada síncronos rechazan su ejecución dentro de un loop activo, el trabajo síncrono delegado a hilos conserva el contexto y los loops propios se cierran mediante `asyncio.Runner` sin cerrar loops prestados.

Al actualizar código que usa estas utilidades, revisa especialmente `Loop.runSync()`, `Loop.createTask()` y `Loop.eventLoopContext()`. `createTask()` es síncrono y devuelve la tarea que después puedes esperar. La [guía de ejecución asíncrona](/es/application/async) contiene las firmas y los ejemplos vigentes.
