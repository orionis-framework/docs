# Auditoría de documentación de Queues

Fecha: 2026-10-23. Alcance: documentación; sin cambios en la implementación del framework.

## Fuentes y organización

Se revisaron `config/queue.py`, `orionis/queues`, las entidades de `orionis/foundation/config/queue`, la fachada, los comandos `make:job` y `queue:*`, su plantilla y las pruebas nativas relacionadas. La implementación local constituye la fuente de las firmas y comportamientos descritos.

Nueve guías por idioma, conservando las cuatro URLs anteriores y agregando cinco. El menú mantiene los otros tres recursos de background/scheduling en un grupo separado:

| Grupo | Contenido |
| --- | --- |
| Fundamentos y persistencia | Introducción; drivers; configuración. |
| Jobs y procesamiento | Creación y envío; formas de ejecución; workers; reintentos y fallos. |
| Servicios y referencia | Fachada e inyección; referencia técnica. |
| Respuesta y programación | Las tres guías existentes de background y programación, sin alterar su contenido. |

Las páginas incluyen ejemplos de controladores, servicios y jobs asíncronos, CLI directo y Reactor, generación de archivos mediante Storage, DI por constructor y método, inspección de reservas y fallos, ejecución inmediata/persistente y consumo por lotes. Cinco diagramas por idioma explican arquitectura, persistencia, ejecución independiente, worker y fallos terminales.

## Cobertura verificable

`public/downloads/queues-api-inventory.json` contiene **214 declaraciones públicas propias en 42 archivos**: 39 clases, 94 métodos, 68 campos, siete funciones, tres constantes de enum y tres aliases de callbacks. Se relacionan con 71 destinos documentales válidos en ambos idiomas. Cada registro conserva archivo, línea, firma y checksum normalizado de la fuente.

El conteo es léxico: contratos e implementaciones de un mismo método se cuentan por separado. Incluye constructores explícitos y el protocolo `__await__`; los constructores generados se explican mediante sus campos. Excluye implementación privada, exports, métodos generados por dataclasses/Struct y APIs heredadas de terceros. No equivale a 214 funcionalidades diferentes.

El inventario comprende el administrador, BaseJob/IJob, PendingDispatch, serializer, envelopes, reservas, contexto, Worker/WorkerOptions, repositorio y entidad de fallos, contratos, los tres drivers, esquemas, validadores, callbacks, excepciones, proveedor y fachada. Configuración cubre los 30 campos de entidades, cuatro overrides de BootstrapQueue y los tres valores de Drivers. El CLI y su plantilla se verifican adicionalmente contra las fuentes y los parsers reales; no se suman al conteo de declaraciones del módulo.

`scripts/audit-queues-source.py` compara el inventario con el checkout del framework. `scripts/validate-queues-coverage.mjs`, integrado en la validación normal y postbuild, verifica rutas y anclas sin necesitar dicho checkout en CI.

## Precisiones y limitaciones documentadas

- `sync` es predeterminado: serializa y ejecuta un intento mediante el worker dentro del envío. No almacena pendientes, no admite demora distinta de cero ni liberación persistente, y propaga la excepción de ejecución.
- Database y Redis separan envío y consumo. Un ID de envío no confirma el éxito de negocio; `run()` cuenta reservas y la salida correcta de `queue:work` puede incluir fallos gestionados.
- El proveedor registra y fija Queue durante el arranque, descubre jobs en `app_jobs` y cierra recursos al apagarse. La resolución de backends sigue siendo perezosa; no se inicia un consumidor automáticamente.
- Los datos persistentes se restauran sin ejecutar el constructor del job. DI se aplica a `handle()` y a los constructores de los servicios que recibe. No se serializan servicios, modelos vivos ni Request.
- PendingDispatch muta la misma operación; solamente `await` envía. Las esperas repetidas comparten un único envío y cambiar opciones después de iniciarlo produce un error.
- MessagePack para estado, JSON/base64 para envelopes, límite de 1 MiB por formato y profundidad de 32. Las identidades deben estar registradas. Anotaciones en cadenas, `Any` y future annotations no son compatibles con el registro actual. `Optional` y `Union` sí se verificaron en el runtime Python 3.14.
- Database reserva mediante actualización condicional y exige restricciones únicas; no reserva dentro de una transacción activa. Un envío puede participar en la transacción de su misma conexión SQL. No existe una opción general afterCommit.
- Redis usa Lua y cinco claves por canal con hash tag. Su configuración no instala un servidor, no habilita AOF/RDB ni configura Redis Cluster. La supervivencia a reinicios depende del servidor. El cliente Python ya viene incluido.
- No hay heartbeat de reservas, renovación automática, promesa de ejecución exactamente una vez ni hook de job `failed()`. Se explican vencimientos, timeout cooperativo, cancelación y parada gradual.
- Los fallos definitivos se guardan en SQL, también con Redis y Sync. Registrar el fallo y eliminar el mensaje, o reencolar y olvidar el fallo, no forman una transacción entre almacenes.
- `DatabaseFailedJobRepository` no impone en su constructor la misma comprobación `supportsUniqueConstraints()` que DatabaseQueueDriver. Se corrigió la afirmación anterior que extendía esa restricción al repositorio.
- `record.exception` difiere entre contrato (`BaseException`) y concreto (`Exception`); `find`/`forget` usan `failed_id` en el contrato y `failure_id` en la implementación. Se documenta y los ejemplos usan IDs posicionales.
- `clear()` elimina también reservas activas y no detiene los efectos de handlers en ejecución. La eliminación de fallos no elimina jobs pendientes. Los mensajes y tracebacks del repositorio no se sanean automáticamente.

## Evidencia de validación

| Comprobación | Resultado |
| --- | --- |
| Suite nativa `python -B reactor test --start-dir tests/queues --no-panel --verbosity 1` | 130 aprobadas, 14 omitidas por requerir Redis externo opt-in, cero fallos; salida 0. |
| E2E nativo | Application/Container reales, SQLite temporal, descubrimiento, scopes, transacciones cold/warm, reintentos y cinco comandos. |
| Generador y payloads | Plantilla literal contrastada ES/EN, cuatro combinaciones de nombres y negativa de sobrescritura; serializer, espera compartida y DI ejecutados. |
| Configuración | Seis bloques Python parseados y cuatro ejemplos BootstrapQueue construidos con entorno controlado. |
| Controladores y servicio | Ejemplos extraídos del Markdown con Application real, Queue fijada por el arranque, SQLite y Storage temporales: fachada, constructor, método, cuatro jobs sin efectos antes del worker, contenido exacto de archivos tras consumo, Sync, delay, size, clear, lotes e inspección de fallos. |
| Workers y fallos | 16 bloques publicados ejecutados, 52 comprobaciones y 12 ejemplos CLI contrastados con el parser real. |
| Firmas | 42 firmas adicionales de referencia contrastadas por AST con el código; inventario completo contrastado contra sus 42 hashes. |
| Pruebas del sitio | 19 aprobadas. |
| Sintaxis e imports | 3.842 bloques Python, 276 JSON y 82 JavaScript; 3.128 imports nativos contrastados sin errores. |
| Construcción y HTML | `npm run build` aprobado: 367 páginas generadas y 366 de contenido verificadas; 2.836 enlaces internos, fragments, traducciones, sitemap y búsqueda correctos. |
| Navegador | Nueve guías ES revisadas a 390 px: un enlace activo y sin desbordamiento de página; tablas con scroll interno. Cuatro subgrupos, apertura exclusiva móvil, filtro/restauración, navegación y cambio ES/EN comprobados. Los cinco diagramas se renderizan en SVG a 1440 px sin errores. |
| Servidor | Astro activo en `http://localhost:4321/es/asynchronous/queues`. |

Los subconjuntos de pruebas nativas se solapan y no se suman al total. No se contactó Redis externo ni otro servicio de producción. Una corrida preliminar fijó por error `ORIONIS_QUEUE_REDIS_HOST` como cadena vacía: el E2E rechazó esa configuración. Se reprodujo la causa y se repitió la suite con la variable ausente, obteniendo el resultado aprobado indicado arriba; no se modificó el framework para hacerla pasar.

## Repetir las comprobaciones

```bash
python -B scripts/audit-queues-source.py --framework-root ../framework
node scripts/validate-queues-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor requiere Python 3.14 y el checkout del framework. `--write` regenera el inventario después de revisar el cambio de implementación y actualizar la guía correspondiente.
