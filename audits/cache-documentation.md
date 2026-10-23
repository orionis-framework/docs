# Informe técnico: Cache

La revisión parte de `config/cache.py`, el módulo `orionis/cache`, sus contratos y pruebas, las entidades de `orionis/foundation/config/cache`, el provider y la fachada. También contrasta el código instalado de aiocache y aiomcache que utilizan los builders nativos y las dependencias normales declaradas por Orionis. No modifica la implementación del framework.

## Organización

Ocho guías por idioma, conservando las cuatro URLs anteriores y agregando cuatro:

| Grupo | Guías |
| --- | --- |
| Almacenes y configuración | Introducción; drivers y almacenes; configuración. |
| Operaciones y concurrencia | Guardar y regenerar valores; bloqueos y concurrencia; artefactos de código fuente. |
| Servicios y referencia | Fachada e inyección; referencia técnica. |

Los ejemplos principales se utilizan dentro de servicios y controladores asíncronos. Incluyen fachada `Cache`, DI por constructor y por método mediante `ICacheManager`, selección de almacenes, rutas, cache-aside con resolvers sync/async, invalidación, lotes, contadores, escrituras condicionales, contextos y artefactos con I/O desplazado a threads. Tres diagramas por idioma explican arquitectura, doble comprobación e invalidación de artefactos.

## Cobertura verificable

`public/downloads/cache-api-inventory.json` registra **170 declaraciones públicas propias en 34 archivos**: 105 métodos, 26 campos, 24 clases, siete constantes, cuatro funciones y cuatro aliases. Sus 62 destinos documentales existen tanto en ES como en EN. Cada declaración conserva firma, archivo, línea y checksum normalizado de la fuente.

El conteo es léxico: interfaces, implementaciones y overrides se registran por separado. No equivale a 170 funcionalidades distintas. Incluye constructores y los protocolos de contexto asíncrono; excluye implementación privada, resolución de exports, métodos generados por dataclasses y API heredada de dependencias. Las diferencias de aiocache que afectan la API de Orionis están explicadas expresamente.

El inventario cubre las 15 operaciones del repositorio, las 14 delegaciones del manager y su fábrica `store()`, los contratos, los cinco builders/backends, las operaciones propias de File y Database, los locks, FileBasedCache, ambos serializers, configuración, excepciones, provider y accessor de fachada. Los 26 campos comprenden 23 declaraciones de las entidades y tres overrides del bootstrap; se explican también los cinco valores de `Drivers`.

## Precisiones frente a la documentación anterior

- La fachada se importa desde `orionis.support.facades`. El provider nativo es diferido: una aplicación real recién iniciada todavía puede devolver un dispatcher en su primera llamada síncrona a `Cache.store()`. Los ejemplos resuelven antes `await Cache.resolve()` para encadenar operaciones del repositorio. Las llamadas asíncronas y el contexto diferido de `Cache.lock()` tienen su mecanismo de resolución.
- `replace()` pertenece al repositorio, sin proxy en el manager. `lock()` existe en las clases concretas, pero no está declarado en `ICacheManager` ni `ICacheRepository`.
- Los cinco nombres de store seleccionan implementaciones fijas; no existe `extend()` del manager. La configuración `memory=None` no desactiva el backend de memoria. El prefijo base de la entidad es `orionis`, mientras que el bootstrap incluido utiliza la cadena vacía.
- Redis/Memcached ya tienen sus clientes Python como dependencias normales. Necesitan servicios externos accesibles; no requieren un extra de caché. Database utiliza la conexión existente y los requisitos propios del motor elegido.
- `clear()` ignora prefijos: Redis llega a `FLUSHDB`, Memcached a `flush_all`, File limpia su directorio y Database vacía su tabla de entradas. No se ofrece aislamiento de borrado por `CACHE_PREFIX`.
- TTL cero difiere incluso entre operaciones Redis: `set`/`add`/`replace` reciben expiración cero inválida y `setMany` escribe sin expiración. File/Database vencen inmediatamente; Memory/Memcached no programan vencimiento. Memcached requiere tiempos enteros.
- File/Database distinguen un `None` presente durante `remember()`/`pull()`. La lectura de aiocache sustituye un `None` decodificado por el default, por lo que esos métodos tienen un comportamiento distinto en Memory/Redis/Memcached. La guía aporta un contenedor JSON portable para cachear resultados negativos.
- `remember()` no coordina resolvers concurrentes ni verifica el booleano de `set()`. `pull()` tiene lectura y borrado separados. Los lotes File/Database no constituyen una transacción.
- Los locks públicos File son locales al event loop, directorio y clave; los locks internos por archivos de una operación son un mecanismo distinto. Database utiliza owner y lease sin renovación. RedLock de aiocache puede dejar pasar consumidores sin readquirir tras la espera o si no hay un evento local. Memcached no compara atómicamente owner al liberar; el registro de eventos por clave también puede interferir entre clientes independientes.
- Database prepara dos tablas de forma diferida y exige restricciones únicas efectivas. Los nombres deben ser distintos; el backend no migra estructuras incompatibles. La longitud de clave incluye el prefijo. Los contadores usan hasta 25 intentos de compare-and-swap.
- Los stores de valores utilizan JSON de msgspec; el Serializer enriquecido es otra API. FileBasedCache es síncrono, invalida por metadatos de fuentes y formato, no por TTL, y memoiza la huella durante 0,5 segundos. Su formato no es un deserializador de payloads HTTP de clientes.

## Evidencia de validación

| Comprobación | Resultado |
| --- | --- |
| Suite nativa `python -B reactor test --start-dir tests/cache --no-panel --verbosity 1` | 210 pruebas aprobadas, sin errores registrados. |
| Configuración y drivers | Diez bloques publicados ejecutados, 88 comprobaciones de configuración y 19 comprobaciones con manager, servicio y controlador reales; clientes Redis/Memcached construidos sin red. |
| API de valores | 20 ejemplos publicados idénticos ES/EN ejecutados, con 117 comprobaciones sobre Memory, File temporal y Database SQLite en memoria. |
| Locks y artefactos | Nueve ejemplos ejecutados con 50 comprobaciones; probes adicionales de RedLock sobre memoria y dobles de clientes, sin servicios remotos. |
| Fachada, constructor y método | 18 bloques publicados ejecutados y 32 comprobaciones; resolución diferida y DI mediante la aplicación real, caché y archivos aislados. |
| Inventario | 170 declaraciones y 34 checksums contrastados con el checkout; todos los destinos válidos en ambos idiomas. |
| Pruebas del sitio | 19 aprobadas. |
| Sintaxis e imports | 3.636 bloques Python, 276 JSON y 82 JavaScript; 2.882 imports nativos contrastados, sin errores. |
| Construcción y HTML | `npm run build` aprobado: 347 páginas generadas, 346 páginas de contenido y 2.588 enlaces internos verificados, incluidas traducciones, fragments, sitemap y búsqueda. |
| Navegador | Las ocho guías ES revisadas a 390 px, sin desbordamiento horizontal de página y con un único enlace activo. Siete tablas de configuración con scroll interno. Navegación y diagramas revisados a 1440 px; tres SVG renderizados sin errores. Filtro/restauración de submenús y cambio ES/EN verificados. |
| Servidor local | Astro reiniciado y disponible en `http://localhost:4321/es/services/cache`. |

Las revisiones individuales también ejecutaron subconjuntos de pruebas nativas; se solapan con las 210 pruebas y no se suman como pruebas nuevas. Los ejemplos y fixtures prueban comportamientos locales y adaptadores; no se han realizado operaciones contra servidores Redis/Memcached externos ni motores Database remotos.

## Mantenimiento

```bash
python -B scripts/audit-cache-source.py --framework-root ../framework
node scripts/validate-cache-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor AST necesita el checkout fuente; `--write` regenera el inventario después de revisar los cambios de código y documentación. La comprobación de destinos está integrada en `docs:validate` y postbuild y no requiere el framework en CI.
