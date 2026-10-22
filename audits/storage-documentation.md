# Informe técnico: Storage

La revisión utiliza el módulo Storage, los contratos, los cinco drivers, `config/filesystems.py`, las entidades de configuración, el provider, la fachada, el comando `packages` y las pruebas del checkout del framework. No modifica su implementación.

## Organización

Ocho guías por idioma, conservando las cuatro URLs anteriores y añadiendo cuatro:

| Grupo | Guías |
| --- | --- |
| Discos y configuración | Introducción; discos, drivers y dependencias; configuración de filesystems. |
| Operaciones y recursos | Archivos y directorios; streaming y uploads; archivos temporales y contextos. |
| Servicios y referencia | Fachada e inyección; referencia técnica. |

Los ejemplos principales utilizan servicios y controladores asíncronos. Incluyen fachada `Storage`, inyección por constructor y por método mediante `IStorageManager`, registro de rutas, persistencia de uploads HTTP, respuesta por bloques y un contexto temporal definido por la aplicación.

## Cobertura verificable

`public/downloads/storage-api-inventory.json` registra 367 declaraciones públicas propias en 42 archivos fuente: 273 métodos, 42 campos, 38 clases, siete constantes y siete funciones. También registra siete aliases de compatibilidad. Todos tienen un destino documental válido en ES/EN; 111 destinos distintos cubren los miembros y sus implementaciones.

El conteo es léxico: los contratos y los overrides de los cinco drivers se conservan como declaraciones separadas. No equivale a 367 funcionalidades diferentes. Incluye constructores y protocolos de contexto; excluye implementación privada, resolución interna de exports, APIs heredadas de otros módulos y métodos generados por dataclasses. Las dataclasses se explican por sus campos. El inventario mantiene firmas, archivo, línea y checksum normalizado de cada fuente.

La referencia cubre los cuatro métodos del manager, ocho de Disk, 21 de File, ocho de Directory, diez del adaptador UploadedFile, cuatro operaciones de AsyncStream y sus dos protocolos de contexto. El contrato de driver reúne 24 operaciones; se documentan sus implementaciones, constructores, helpers, excepciones y diferencias reales. Se explican los 31 campos propios de las entidades de configuración, sus overrides del bootstrap y los cinco valores DiskName.

## Comportamientos precisados

- Disco y driver son conceptos distintos. La configuración estándar tiene cinco slots de disco; `memory` es un driver y no un sexto disco predefinido. `extend()` amplía drivers y vacía la caché, sin migrar datos ni actualizar referencias existentes.
- Los extras `s3`, `azure`, `gcs` y `storage` se contrastaron con el manifiesto. `packages` instala con `uv pip` en el intérprete de Reactor; no modifica `pyproject.toml` ni `uv.lock`.
- La fachada encadenada se comprobó tras el arranque asíncrono de la aplicación real. La guía explica `await Storage.resolve()` para un bootstrap personalizado con el provider todavía diferido.
- Los temporales internos no son un API pública de archivos temporales. Se distingue staging local `.tmp`, spools cloud de 8 MiB, buffers HTTP y archivos de trabajo bajo rutas lógicas de Storage.
- Los contextos cierran handles; no ofrecen rollback. Memory/cloud pueden publicar al cerrar aunque el bloque haya lanzado una excepción. Un callback de cierre que falla no garantiza cerrar inmediatamente el handle. La cancelación no detiene los hilos de I/O ni garantiza limpieza bajo cancelaciones repetidas.
- `FileInfo.checksum` y ETag no tienen semántica universal: Local/Memory calculan SHA-256/MD5; S3 no aporta checksum en el snapshot; Azure/GCS pueden aportar MD5 del proveedor. `hash()` es una operación distinta.
- Los listados locales omiten archivos terminados en `.tmp`. La normalización es lógica y no implementa contención adicional de symlinks. La documentación anterior prometía una protección que no está en el código actual.
- Azure administra visibilidad por contenedor y rechaza cambios por archivo. URLs públicas no conceden permisos; las firmadas solo existen en los drivers cloud compatibles.
- Los errores de SDK y OS no se convierten uniformemente a StorageException. Los algoritmos hash no admitidos generan UnsupportedStorageOperationException.

## Evidencia de validación

| Comprobación | Resultado |
| --- | --- |
| Suite nativa `reactor test --start-dir tests/storage --no-panel --verbosity 1` | 245 pruebas aprobadas. Los drivers cloud se prueban con dobles, sin servidores externos. |
| Comando `packages` | 39 pruebas nativas, ayuda y listado; sin instalar SDK cloud. |
| Ejemplos de archivos y directorios | 13 bloques ES/EN ejecutados y 36 comprobaciones con drivers Local/Memory. |
| Ejemplos de streams, uploads y temporales | 15 ejemplos ejecutados y 99 comprobaciones, incluidos errores de cierre, buffers y cancelación. |
| Configuración | 16 bloques ejecutados y 52 comprobaciones de defaults, normalización, diccionarios, extensiones y errores. |
| Controladores, fachada, DI y helpers | 24 comprobaciones de ejecución; DI real de constructor/método, lectura/escritura, uploads y respuestas de error. |
| AST e inventario | 367 declaraciones, siete aliases y 42 hashes coincidentes; todos los destinos válidos en ambos idiomas. |
| Pruebas del sitio | 19 aprobadas. |
| Sintaxis del sitio e imports | 3.560 bloques Python, 276 JSON y 82 JavaScript; 2.778 imports nativos contrastados, sin errores. |
| Construcción y HTML | `npm run build` pasó: 339 páginas generadas y 338 de contenido verificadas, con 2.486 enlaces internos válidos. |
| Navegador | Revisados 390 y 1440 px: tres submenús, página activa, filtro/restauración, traducciones, siete tablas de configuración con scroll interno y ambos diagramas renderizados sin errores. Sin desbordamiento de página en las vistas comprobadas. |

Los subconjuntos de pruebas nativas que ejecutaron las revisiones individuales se solapan con la suite de 245 y no se suman como pruebas distintas. No se validaron credenciales, políticas ni operaciones contra cuentas reales de S3, Azure o GCS.

## Mantenimiento

```bash
python -B scripts/audit-storage-source.py --framework-root ../framework
node scripts/validate-storage-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor requiere el checkout fuente. Después de revisar cambios de implementación y actualizar su guía, `--write` regenera el inventario. La validación de destinos se integra en `docs:validate` y el postbuild; no requiere un checkout del framework en CI.
