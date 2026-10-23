# Auditoría de documentación de Exceptions

Fecha: 2026-10-23. Alcance: documentación, navegación e inventarios; sin cambios en el framework.

## Organización

La nueva categoría **Exceptions** contiene cuatro guías por idioma en dos grupos:

- Política de aplicación: introducción/registro y personalización del handler.
- Contextos y referencia: captura por transporte y API/políticas compartidas.

Se conservan las tres URLs anteriores de architecture/exception-handling y se añade contexts-and-transports. Las páginas generales se retiran de Despliegue; la categoría restante se llama Despliegue/Deployment. HTTP conserva su capítulo específico de diagnóstico y respuestas, cuya referencia ahora identifica correctamente la sección independiente Exceptions. Las guías de Logs existentes permanecen independientes.

La introducción cubre bootstrap, resolución, comportamiento base, diagrama y caché. La personalización explica las cinco extensiones con ejemplos completos; la referencia concentra Catch/ICatch, proveedor, fachada, scope y Throwable. La guía de contextos enlaza los manuales especializados y distingue captura, reporte y presentación sin asumir un mismo tratamiento para todos los protocolos.

## Cobertura contrastada

`public/downloads/exceptions-api-inventory.json` relaciona **43 declaraciones propias** con anclas ES/EN. Incluye:

- BaseExceptionHandler e IBaseExceptionHandler: constructor, dont_catch y cinco métodos.
- ExceptionHandler del proyecto: clase, política y tres sobrescrituras delegadoras.
- Catch e ICatch: construcción y exception.
- CatchProvider y su registro/boot; fachada Catch y accessor.
- Throwable y sus cuatro campos; KernelContext y sus dos miembros.
- Application/IApplication.withExceptionHandler y getExceptionHandler; metadatos del handler nativo.

El conteo léxico incluye contratos e implementaciones por separado: nueve clases, 22 métodos, seis campos, dos constructores, dos miembros de enum, una función y una constante. Excluye helpers privados, métodos generados de dataclasses, maquinaria de exports y API heredada de otros componentes. No representa 43 tratamientos diferentes de errores.

Se inventarían además **37 referencias de integración** a los puntos de captura por transporte. El auditor compara **60 archivos de fuente** mediante hashes normalizados a LF, incluyendo bootstrap/app.py, app/exceptions, Failure, aplicación, contenedor, reporte de logs, consola, kernel HTTP, sesiones, respuesta/streams/background, WebSocket, Realtime, MCP, scheduler y colas. Los archivos auxiliares no se presentan como una cobertura completa de toda la API de esos componentes.

`scripts/audit-exceptions-source.py` reconstruye las declaraciones con AST y contrasta firmas, líneas, defaults y hashes. Una declaración nueva necesita un mapping revisado antes de regenerar. `scripts/validate-exceptions-coverage.mjs` comprueba destinos/anclas, inventario y navegación exclusiva, preservando el capítulo HTTP. Está integrado en la validación general del sitio y usa el inventario publicado sin requerir el checkout del framework en CI.

## Correcciones y límites incorporados

- withExceptionHandler recibe una clase compatible con IBaseExceptionHandler y almacena módulo/clase. No instancia en el registro. La configuración mutable permite sustituirla; después de create se rechaza el cambio, salvo el retorno temprano al recuperar bootstrap compilado.
- Application conserva la clase resuelta y construye otra instancia con cada getExceptionHandler; Catch conserva su primera instancia y coordina esa resolución con un lock. Se explica por qué el estado por petición debe permanecer en variables locales o dependencias resueltas por método.
- Catch resuelve primero el handler, exige scope/kernel, reporta y presenta según identidad KernelContext.HTTP/CONSOLE. El retorno de report no cancela la presentación; un error de report sí la interrumpe. Otro contexto no nulo produce solo reporte.
- Se corrigió la afirmación anterior de que el reporte base no incluía traceback. Actualmente utiliza log.getLogger().error con exc_info explícito y conserva traceback, causas y notas, también fuera del except original.
- Throwable resume el primer argumento y convierte todos a texto; sin argumentos utiliza una cadena vacía. No es Response ni una representación JSON del traceback.
- dont_catch utiliza tipos exactos y puede suprimir reporte y presentación. No es una opción exclusiva para silenciar logs ni garantiza relanzar automáticamente. El mapa HTTP, en cambio, recorre MRO y reconoce subclases.
- El handler de proyecto anota Exception/Request; el contrato base acepta BaseException y Request/TransportAdapter. Los ejemplos ampliados conservan los casos de fallo antes de construir Request. Console.exception exige Exception: el contrato amplio no convierte las señales de finalización en errores CLI ordinarios.
- HTTP trata directamente validación, tamaño, fallback y políticas de endpoint donde corresponde; el resto llega a Catch. Se distingue API/WEB y el reporte dentro de la sesión.
- WebSocket captura desconexión esperada, registra errores imprevistos, intenta cerrar y propaga; no invoca Catch automáticamente. La API RSGI no permite prometer un código de cierre observado por el navegador.
- Realtime traduce errores de invocación mediante su protocolo. RPCError conserva el código público, pero el mensaje de la completion es Invocation failed; no se expone automáticamente el mensaje personalizado ni se llama al handler global.
- MCP utiliza report en las fronteras implementadas y conserva resultados isError, JSON-RPC y respuestas de transporte. Un fallo del reporte protegido no sustituye el error original. No utiliza handleHTTP para mostrar una página de debug.
- Scheduler distingue retorno de comando y excepción de tarea/listener. Un comando con salida 1 puede ser una tarea ejecutada cuyo retval debe inspeccionarse. La delegación de listeners a Catch necesita el contexto correspondiente.
- Los workers de colas aplican reintentos y persistencia propios. La conexión sync puede propagar el fallo al llamador; enviar un job y fallar más tarde en su worker son fronteras distintas.
- Los errores durante streams/SSE o background pueden suceder después de enviar la respuesta. No se promete reemplazar sus headers/cuerpo mediante el handler; BackgroundTasks detiene la secuencia cuando falla una tarea.
- Arranque/apagado, cancelación y llamadas fuera de un kernel mantienen sus límites. No se instala un sys.excepthook universal ni una captura de cualquier tarea/hilo del proceso.

## Evidencia ejecutada

- Suite nativa completa tests/failure: **95 pruebas correctas**, sin fallos ni omisiones.
- Integraciones: Realtime 22, MCP 21, WebSocket 47, Reactor 47, background 46, colas 21 y scheduler 56: **260 pruebas correctas**, sin repetir la suite Failure.
- Total nativo relacionado: **355 pruebas correctas**.
- Personalización: 29 comprobaciones reales de DI por constructor/método, respuesta de dominio 409, MRO, tipos ignorados, report sin retorno, error de report, traceback/causas/notas, consola y conversión. Los 18 bloques Python por idioma se contrastaron.
- Referencia: 19 comprobaciones reales con Container, CatchProvider y fachada, resolución concurrente en ocho llamadas, scope, caché y Throwable.
- Contextos: 15 comprobaciones reales con los ocho ejemplos Python por idioma; incluidas serialización Realtime/MCP, WebSocket, Reactor, JobContext, trabajo posterior a la respuesta y reporte fuera del kernel. El ejemplo duplicado de reporte recuperado se sustituyó por un enlace a la guía de personalización.
- Bootstrap: diez comprobaciones con Application, el handler real del proyecto y dependencias nativas en un directorio temporal. Validación de tipos/estado, sustitución antes de create, rechazo posterior, construcción de instancias distintas y metadatos predeterminados.

Los arneses y logs se guardaron en el directorio temporal del usuario con prefijo orionis-exceptions y fecha 20261023. Las ejecuciones usaron Python con -B, sin modificar el .env del proyecto ni conectar servicios externos.

## Validación del sitio

- 21 pruebas correctas del sitio y la navegación. Se verifican las cuatro páginas generales exclusivamente en Exceptions, las tres URLs anteriores conservadas y el capítulo HTTP en su categoría original.
- Comprobación de bloques Python, JSON y JavaScript y de exportaciones nativas sin errores; los ejemplos de personalización, referencia y contextos tienen además las ejecuciones indicadas arriba.
- Build correcto: 415 páginas generadas y 414 páginas renderizadas verificadas. Catálogo de 26 categorías, 205 páginas de manual y dos recursos por idioma; 3.534 enlaces internos, fragmentos, traducciones, redirecciones, sitemap y búsqueda comprobados.
- Navegador: ocho guías generales y dos páginas HTTP revisadas a 390 px sin desbordamiento de página y con una sola selección activa. Las tablas amplias usan scroll interno. Seis diagramas Mermaid renderizados sin errores. Los dos subgrupos de Exceptions alternan su apertura de forma exclusiva en móvil; escritorio revisado a 1440 px.
- Los archivos de esta tarea y los cambios previos de Logs preservados son UTF-8 sin BOM y LF; diff --check correcto. El checkout del framework permanece limpio.
- Servidor Astro reiniciado y activo en http://localhost:4321/es/architecture/exception-handling.

No quedan fallos conocidos relacionados con estos cambios. Se documentan las fronteras y limitaciones verificadas; no se modificó el comportamiento del sistema de excepciones.

## Repetir las comprobaciones

```shell
python -B scripts/audit-exceptions-source.py --framework-root ../framework
node scripts/validate-exceptions-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor de implementación requiere un Python compatible y el checkout del framework; la validación del sitio utiliza el inventario publicado.
