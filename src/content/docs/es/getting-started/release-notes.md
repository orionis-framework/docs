---
title: "Notas de versión"
description: "Cambios de Orionis 1.0.8 a 1.5.0: almacenamiento de autorización en el core, recuperación de contraseñas, validación y actualización."
editUrl: true
lastUpdated: false
---

Estas notas reúnen los cambios de las versiones **1.0.8 a 1.5.0** y enlazan las guías de uso actualizadas. Los ejemplos de Reactor se ejecutan desde la raíz de la aplicación con su entorno de Python.

<a id="v1-5-0"></a>

## 1.5.0: almacenamiento de autorización y recuperación en el core

La versión **1.5.0** traslada al core el esquema técnico de roles, permisos, sus relaciones y recuperación de contraseñas. `auth:migrate`, que ya preparaba tokens personales desde 1.3.0, crea ahora las siete tablas internas de autenticación y autorización. Se mantiene el requisito de **Python 3.14+**.

### Preparar las tablas de autenticación

| Tablas | Responsabilidad |
| --- | --- |
| `permissions` y `roles` | Almacenar capacidades y roles con nombres únicos. |
| `model_has_permissions`, `model_has_roles` y `role_has_permissions` | Relacionar identidades con capacidades y roles, y roles con permisos. |
| `auth.tokens.table` (`AUTH_TOKEN_TABLE`, predeterminado `personal_access_tokens`) | Almacenar tokens personales. |
| `auth.passwords.table` (`AUTH_PASSWORD_RESET_TABLE`, predeterminado `password_reset_tokens`) | Almacenar credenciales de recuperación de contraseña. |

El comando utiliza la conexión SQL predeterminada y su prefijo de tablas, requiere restricciones de unicidad efectivas y no admite `--database`. Los nombres configurados para tokens personales y recuperación deben ser distintos entre sí y de las cinco tablas de autorización, sin distinguir mayúsculas. Una colisión se rechaza antes de crear tablas.

En una base nueva, aplica las migraciones de identidad y negocio, prepara el almacenamiento de auth y después ejecuta los seeders de la aplicación:

```bash
python -B reactor migrate
python -B reactor auth:migrate
python -B reactor seed
```

`auth:migrate` crea el almacenamiento faltante desde las definiciones del framework, sin importar archivos de `database/`, ejecutar seeders ni registrar entradas en `migrations`. El modelo `User`, su tabla `users` y su migración siguen en la aplicación, al igual que los nombres de roles y permisos del negocio, sus asignaciones y las policies. Preparar las tablas no crea cuentas ni concede privilegios de administrador. Consulta [roles y permisos](/es/authentication/authorization), [recuperación de cuentas](/es/authentication/account-recovery) y la [referencia de `auth:migrate`](/es/database/commands#auth-migrate).

### Actualizar a 1.5.0

```bash
uv add "orionis==1.5.0"
uv sync
```

Para entornos administrados con pip, usa `python -m pip install --upgrade "orionis==1.5.0"`. Revisa la conexión predeterminada, `AUTH_TOKEN_TABLE` y `AUTH_PASSWORD_RESET_TABLE`; si utilizas [configuración compilada](/es/environment/compiled-configuration), regénérala antes de ejecutar `python -B reactor auth:migrate`. Reinicia los procesos de aplicación y workers con la versión actualizada.

Repetir `auth:migrate` conserva tablas y registros existentes, incluidas asignaciones, tokens y solicitudes de recuperación. No ejecuta `DROP` ni `ALTER`, traslada datos al cambiar un nombre de tabla ni reescribe el historial de migraciones. Un esquema existente incompatible necesita una migración de aplicación explícita.

La aplicación de referencia retira las seis migraciones y schemas de autorización y recuperación que ahora proporciona el core. **Conserva en los proyectos existentes las migraciones ya aplicadas y los schemas que importan**: eliminarlos puede impedir revertir sus lotes registrados. No renumeres archivos ni borres historial para adoptar el comando. Actualizar el paquete no modifica automáticamente las migraciones de tu aplicación o skeleton. Consulta la [guía para actualizar el almacenamiento de auth](/es/database/migrations#auth-storage-1-5-0).

<a id="v1-4-0"></a>

## 1.4.0: conversión de campos y reglas de vacío

La versión **1.4.0** incorpora conversión opcional previa a la validación mediante `Coerce()` y las reglas complementarias `Empty()` y `NoEmpty()`. Los campos sin conversión siguen siendo estrictos. Se mantiene el requisito de **Python 3.14+**.

### Convertir antes de validar con `Coerce()`

Importa `Coerce` desde `orionis.schemas.metadata` y añádelo al tipo declarado del campo:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import GreaterThan
from orionis.schemas.fields import Field
from orionis.schemas.metadata import Coerce


class QuantityInput(Schema):
    quantity: Field[int, Coerce(), GreaterThan(0)]
```

Cuando el validador procesa este schema, convierte el valor marcado antes de comprobar su tipo, restricciones y reglas:

| Entrada | Resultado |
| --- | --- |
| `"12"` o `"12.0"` | Se convierte al entero `12` y pasa. |
| `"0"` | Se convierte a `0` y falla `GreaterThan(0)` con código `gt`. |
| `"abc"` o `"1.5"` | Falla con código `type`; no se trunca ni se reemplaza por cero. |

También admite destinos como `float`, `bool` y `Decimal`, según las reglas de conversión del tipo declarado. El marcador funciona con schemas anidados, colecciones, campos renombrados y tipos nullable. Marcar una colección o schema habilita la conversión de sus valores y campos descendientes; las claves de diccionario siguen siendo estrictas y los campos hermanos sin marcar no cambian.

La validación preserva el payload original. Construir directamente una instancia del schema no ejecuta la conversión. Consulta [conversión de campos](/es/validation/declaring-schemas#field-coercion) y [entrada de formularios](/es/validation/controllers-and-http#form-field-coercion).

### Definir el vacío con `Empty()` y `NoEmpty()`

Ambas reglas comparten una definición y son opuestas exactas. Son vacíos `None`, strings vacíos o compuestos solo por espacios en blanco, ceros numéricos, `False`, colecciones de longitud cero y archivos subidos de cero bytes. El contenido de los archivos no se lee.

El string `"0"` está presente; tras convertirlo a `int`, su valor es un cero numérico vacío. `[None]` y `{"key": None}` están presentes porque contienen elementos. Las reglas no recortan strings ni consumen iteradores sin longitud; estos iteradores se consideran presentes. Un campo ausente sigue sujeto a la obligatoriedad del schema y su valor debe satisfacer el tipo declarado antes de aplicar una regla de vacío.

Importa ambas reglas desde `orionis.schemas.rules`. Cada una admite `message=`; sus códigos de fallo son `empty` y `no_empty`. Los fallos anidados conservan rutas como `items[0].name` y sus mensajes personalizados. Consulta la [referencia de las reglas](/es/validation/application-rules#empty-and-no-empty) y el [ejemplo completo de validación de un pedido](/es/validation/validation-and-errors#coercion-and-empty-rules), incluidos los casos de rechazo.

### Pruebas y calidad

La versión añade **38 pruebas: 22 de conversión y 16 de vacío**, que cubren una petición multipart real, anidamiento, mensajes personalizados, conversiones y preservación del payload. La validación de la versión aprobó **561 pruebas de schemas** y **3 pruebas de respuestas HTTP**. Se compartió lógica de validación para reducir duplicación y complejidad; Ruff y SonarLint quedaron sin avisos, con supresiones puntuales justificadas. La documentación del framework se actualizó en español e inglés.

### Actualizar a 1.4.0

```bash
uv add "orionis==1.4.0"
uv sync
```

Para entornos administrados con pip, usa `python -m pip install --upgrade "orionis==1.4.0"`. Activa la conversión explícitamente en los campos que deban aceptar entradas convertibles. Usa `NoEmpty()` cuando también debas rechazar cero y `False`; no sustituye la declaración de un campo obligatorio. Revisa la [secuencia de validación y sus errores](/es/validation/validation-and-errors) antes de cambiar contratos existentes.

<a id="v1-3-0"></a>

## 1.3.0: comandos de almacenamiento interno y documentación de la API

La versión **1.3.0** añade comandos para preparar el almacenamiento propio del framework, ajusta nombres de métodos a su convención y corrige la documentación generada de la API. Se mantiene el requisito de **Python 3.14+**.

### Preparar el almacenamiento interno

Los nuevos comandos `auth:migrate`, `cache:migrate`, `schedule:migrate` y `session:migrate` se suman al existente `queue:migrate`. Cada uno crea las tablas faltantes desde las definiciones del framework y utiliza la configuración correspondiente. Ejecuta los comandos del almacenamiento que necesite tu aplicación:

```bash
python -B reactor auth:migrate
python -B reactor cache:migrate
python -B reactor queue:migrate
python -B reactor schedule:migrate
python -B reactor session:migrate
```

Estos comandos preservan los registros existentes y no eliminan ni alteran tablas existentes. Tampoco crean archivos de migración de aplicación ni escriben entradas en el historial de migraciones. No aceptan `--database`: configura la conexión de cada almacenamiento antes de ejecutarlos. Consulta los [comandos de base de datos](/es/database/commands#internal-storage-commands) y la [gestión de migraciones al actualizar](/es/database/migrations#framework-storage-tables).

La aplicación de referencia del framework elimina cinco migraciones redundantes y sus cinco definiciones de schema para tareas programadas, valores de caché, bloqueos de caché, sesiones y tokens de acceso personal. En 1.3.0 conservaba usuarios, permisos, roles, sus relaciones y recuperación de contraseñas, sin renumerar los archivos restantes; [1.5.0](#v1-5-0) amplía el almacenamiento de auth administrado por el core. Esta limpieza no elimina automáticamente archivos de aplicaciones existentes ni de todos los skeletons. Revisa tus migraciones antes de adoptar los comandos; conserva el historial existente y utiliza una migración de aplicación explícita cuando necesites modificar un schema. Los cambios de esta versión no modificaron las bases de datos existentes ni su historial de migraciones.

### Nombres de métodos y referencia generada

Los métodos de clase utilizan `camelCase`, `_camelCase` o `__camelCase`; las funciones fuera de clases utilizan `snake_case`. Los métodos especiales de Python, como `__init__`, conservan sus nombres obligatorios. Al actualizar, revisa subclases propias, sobrescrituras y llamadas a métodos renombrados con la [referencia de la API](https://api.orionis-framework.com/) y la [convención de nombres](/es/contribute/guide#naming-conventions).

Se corrigieron y completaron los docstrings del framework al estilo NumPy para Pydoctor. La referencia de la API se genera desde los docstrings del framework y se publica en [api.orionis-framework.com](https://api.orionis-framework.com/). La [guía de contribución](/es/contribute/guide#api-docstrings) explica el formato y los requisitos de documentación. En `tests/test_http_compare.py`, las **57 funciones y métodos** utilizan ahora docstrings NumPy con resúmenes imperativos y sin secciones `Examples`; esta última restricción corresponde a ese archivo de pruebas, no a todos los docstrings de la API.

<a id="http-benchmark-1-3-0"></a>

### Corrección del benchmark HTTP

El lanzador del benchmark activa ahora `TCP_NODELAY` en el socket de escucha de Uvicorn antes de compartirlo entre varios workers. Esto elimina la penalización TCP detectada para respuestas pequeñas en esa configuración. La corrección se validó en Linux y pertenece al lanzador del benchmark, no al comando `serve` de producción de Orionis.

**Las gráficas publicadas del benchmark siguen pendientes de regeneración con esta corrección.** Las gráficas existentes no deben interpretarse como mediciones del lanzador corregido ni permiten deducir nuevas cifras de rendimiento para esta versión. Una nueva comparación requiere ejecutar de nuevo el benchmark con el lanzador corregido y la misma carga y cantidad de workers.

Se actualizaron las pruebas y la documentación. Las validaciones ejecutadas para la versión pasaron, incluidos Ruff y los diagnósticos.

### Actualizar a 1.3.0

Desde la raíz de la aplicación:

```bash
uv add "orionis==1.3.0"
uv sync
```

Para entornos administrados con pip, usa `python -m pip install --upgrade "orionis==1.3.0"`. Actualizar el paquete no reescribe la configuración de la aplicación, reemplaza el skeleton ni ejecuta comandos de almacenamiento. Revisa los nombres de métodos y la configuración de almacenamiento, regenera la [configuración compilada](/es/environment/compiled-configuration) si la utilizas y reinicia los procesos de aplicación y workers. Ejecuta explícitamente los comandos de almacenamiento cuando necesites sus tablas.

<a id="v1-2-0"></a>

## 1.2.0: inspeccionar SQL sin ejecutar una consulta

Las consultas de modelos y `DB.table()` incorporan `toSql(*, literal_binds=False) -> str`, un método síncrono. La salida predeterminada utiliza los placeholders del dialecto seleccionado. Usa `literal_binds=True` para representar los valores admitidos como literales SQL durante la depuración:

```python
from orionis.support.facades import DB

query = DB.table("users").where("active", True)
sql = query.toSql()
debug_sql = query.toSql(literal_binds=True)
```

La compilación respeta el dialecto y el prefijo de tablas de la conexión. En consultas de modelos también incorpora los scopes globales aplicables y el filtro de borrado lógico. Trabaja sobre una copia sin ejecutar la consulta ni cambiar el builder original, que puedes seguir utilizando después. Requiere una aplicación inicializada o un resolvedor de conexiones configurado para obtener los ajustes de conexión.

La representación literal sirve para inspección y puede exponer valores sensibles; algunos tipos no pueden representarse y provocan `QueryException`. Mantén la ejecución parametrizada en las consultas de la aplicación. Consulta [`DB.table().toSql()`](/es/database/query-builder#api-tosql) y la [inspección SQL de modelos](/es/orm/querying#query-to-sql) para ver ejemplos y limitaciones.

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
