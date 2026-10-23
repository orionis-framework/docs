# Auditoría de documentación de Logs

Fecha: 2026-10-23. Alcance: guías ES/EN, navegación, icono e inventario; sin cambios en el framework.

## Organización

La categoría **Logs** es independiente y contiene cuatro guías por idioma en dos grupos:

- Configuración inicial: introducción y canales/configuración.
- Uso y archivos: API de escritura e inyección; rotación y ciclo de vida.

Las tres URLs anteriores de services/logging se conservan. Se añade services/logging/configuration. Las páginas se retiran del grupo de despliegue, cuyo nombre pasa a **Despliegue y errores**. Cada página mantiene una única ubicación primaria; las referencias desde configuración general y excepciones siguen apuntando a estas guías sin duplicar su contenido.

## Fuente de verdad y cobertura

Se revisaron config/logging.py, orionis/logging, las entidades/enums/validadores de foundation/config/logging, ILogger, SuffixResolver, LoggerProvider, la fachada Log y su integración con la aplicación y el reporte de excepciones.

El inventario `public/downloads/logging-api-inventory.json` relaciona **111 declaraciones públicas propias** con anclas de documentación en ambos idiomas:

| Área | Declaraciones |
| --- | --- |
| Configuración del proyecto y entidades | 47: BootstrapLogging, Logging, Channels, seis entidades de canal, todos sus campos, cinco niveles y los validadores públicos. |
| Servicio, contrato, proveedor y fachada | 35: doce métodos de Logger/ILogger, nombre, construcción/destrucción, registro/boot y accessor de Log. |
| Handlers y resolvers | 29: factory, AdvancedRotatingFileHandler, SuffixResolver y cinco resolvers con sus constructores, sufijos y cálculos de próxima rotación. |

El conteo léxico distingue contratos e implementaciones: 22 clases, 45 métodos, 30 campos, siete constructores, cinco miembros de enum y dos instancias invocables. Excluye helpers privados, hooks de validación/generated methods de dataclasses, API heredada de logging/Facade y maquinaria de exports. Su comportamiento relevante se explica en las guías; el inventario no atribuye toda la API estándar de Python al wrapper de Orionis.

El auditor `scripts/audit-logging-source.py` reconstruye las declaraciones mediante AST y compara firmas, defaults y 38 hashes de fuente normalizados a LF. Las integraciones auxiliares se incluyen como checksums sin afirmar que toda su API pertenezca a logging. Nuevas declaraciones requieren mappings revisados antes de regenerar el inventario.

`scripts/validate-logging-coverage.mjs` comprueba identidades, firmas presentes, hashes, destinos/anclas ES/EN y pertenencia exclusiva de las cuatro guías al menú Logs. Se ejecuta desde la validación general del sitio sin requerir un checkout del framework en CI.

## Precisiones incorporadas

- Hay seis canales de archivos; stack es un archivo único, no una agrupación. Solo un canal está activo normalmente.
- ILogger es el binding singleton nativo; inyectar Logger concreto puede construir otro wrapper que manipule el mismo logger estándar __orionis__.
- El provider fija Log durante su boot async. Después, los doce métodos son síncronos; una fachada sin fijar requiere esperar su operación diferida. No se presenta el acceso a disco como I/O asíncrono.
- Se documentan individualmente debug, info, warning, error, critical, getLogger, reloadConfiguration, switchChannel, close, getActiveChannels, getActiveChannel y getAvailableChannels. Los mensajes simples no aceptan los argumentos avanzados del logger estándar; getLogger permite acceder a ese objeto y registrar tracebacks.
- Los cinco niveles aceptan enum, número exacto o nombre válido. Las entidades validan todos los canales, también los inactivos.
- LOG_PATH y LOG_RETENTION afectan únicamente al canal seleccionado; LOG_LEVEL configura los seis. LOG_MB_SIZE/LOG_FILES configuran chunked y LOG_ROTATION_TIME configura daily aunque no sean el canal activo. Son siete variables en el archivo distribuido.
- La inicialización predeterminada de stack concatena el root y la ruta como texto; los handlers creados mediante la factory usan Path. Se recomienda una ruta relativa para evitar el comportamiento inconsistente de rutas absolutas de stack.
- Los nombres retention_hours/days/weeks/months se pasan como backup_count: conservan cantidades de archivos ordenados por mtime, no una edad máxima. La limpieza sucede al rotar, antes del nuevo activo; después puede haber backup_count + 1 archivos.
- La rotación se comprueba al emitir. Daily.at y los cálculos getNextRotationTime no programan un temporizador ni desplazan el límite efectivo del sufijo diario. Los períodos sin tráfico no generan archivos ni limpieza.
- ChunkedSuffixResolver incrementa el contador en cada consulta y el handler lo consulta en cada emisión. El canal chunked integrado rota por registro, incluso sin alcanzar mb_size. Se explica como comportamiento verificado, sin corregir ni prometer capacidades ajenas al código.
- La compresión es gzip al rotar chunked; close no comprime el archivo activo ni ejecuta retención. La comprobación de tamaño no anticipa el nuevo registro y no garantiza un límite de espacio.
- Switch/reload/close afectan al servicio compartido del proceso. Un cambio fallido puede dejarlo sin handlers; no hay rollback automático ni contexto de canal por petición. Reload relee app.config, no .env ni los módulos de configuración.
- Los locks protegen operaciones dentro del proceso; no coordinan archivos entre workers o servidores. Se explican los errores de escritura, los límites de confirmación y el cierre explícito mediante un callback con ILogger.

## Evidencia de ejecución

- Logger y su contrato: 64 pruebas nativas correctas; provider: siete.
- Handlers: 96; contrato de sufijos: ocho; package: tres.
- Configuración logging de Foundation: cinco. Total: **183 pruebas nativas correctas**, sin duplicar subconjuntos.
- API: diez bloques Python por idioma ejecutados con Application/Container/LoggerProvider reales aislados; DI por constructor/método, singleton, cinco niveles, pin/unpin, lazy init, cambio/recarga, traceback, cierre/reapertura, fallback y fallo de cambio contrastados. El controlador introductorio escribió su evento en el canal diario.
- Rotación: 34 comprobaciones reales, incluidos seis handlers, UTF-8, gzip, retención por mtime, cleanup por rotación, superación del umbral y ausencia de llamadas del handler a getNextRotationTime. Los seis bloques Python publicados fueron ejecutados.
- Configuración: 245 comprobaciones de tipos, normalización, rangos, errores y selección de variables ya resueltas; doce bloques Python ejecutados. Se comprobó además el parsing real de DotEnv y se cargó el archivo config/logging.py con un .env temporal para verificar rutas/retención seleccionadas, defaults inactivos y los seis niveles. Los prefijos int: son ejemplos explícitos válidos; los números sin prefijo también pueden resolverse mediante literal_eval.

Los arneses y logs reproducibles están en el directorio temporal del usuario con prefijo orionis-logging y fecha 20261023. Se utilizó Python con -B y temporales; no se alteró el .env real ni se conectaron servicios externos. Un primer arnés de configuración necesitó restaurar el cwd antes de limpiar su directorio en Windows; la ejecución corregida terminó correctamente.

## Validación del sitio

- 20 pruebas correctas del sitio, incluida la pertenencia exclusiva de las guías a Logs y la conservación de las tres URLs anteriores.
- 4.394 bloques Python, 276 JSON y 82 JavaScript comprobados; 3.474 imports nativos válidos y ningún error.
- Inventario de 111 declaraciones contrastado con el código y 38 checksums; destinos y anclas ES/EN válidos.
- Build correcto: 413 páginas generadas y 412 páginas renderizadas verificadas. El catálogo contiene 25 categorías, 204 páginas de manual y dos recursos por idioma; 3.484 enlaces internos, fragmentos, traducciones, redirecciones, sitemap y búsqueda comprobados.
- Navegador: ocho guías ES/EN revisadas a 390 px, con una sola selección activa y sin desbordamiento de página; las tablas amplias se desplazan dentro de su contenedor. Cuatro diagramas renderizados sin errores. Los dos subgrupos de Logs alternan su apertura de forma exclusiva en móvil. Revisión visual de escritorio a 1440 px.
- Los 18 archivos modificados/creados son UTF-8 sin BOM y LF; diff --check correcto. El framework permanece limpio.
- Servidor Astro reiniciado y activo en http://localhost:4321/es/services/logging.

No quedan fallos conocidos relacionados con la documentación. Las limitaciones funcionales de chunked, retención, Daily.at y concurrencia se describen tal como existen; no se ha cambiado su implementación.

## Repetir las comprobaciones

```shell
python -B scripts/audit-logging-source.py --framework-root ../framework
node scripts/validate-logging-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor de fuentes requiere Python compatible con la implementación y acceso al framework. El validador del sitio usa el inventario publicado.
