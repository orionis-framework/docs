# Auditoría de Aplicación y Contenedor

Fecha: 2026-10-23. Alcance: documentación, navegación e inventarios; sin cambios en Foundation, Container ni el bootstrap del framework.

## Organización

La categoría Aplicación y contenedor contiene 14 guías por idioma, distribuidas en cinco grupos:

- Aplicación y ejecución: introducción, ciclo de vida, ASGI/RSGI e IApplication.
- Bootstrap y configuración: opciones de bootstrap, configuración tipada y directorios/caché.
- Contenedor: introducción, registro/invocación y scopes/concurrencia.
- Proveedores y fachadas: proveedores de servicios y fachadas sync/async.
- Ejecución asíncrona: las dos guías existentes de AIO.

Se añaden cinco páginas por idioma: application-overview, application-api, bootstrap-options, server-entrypoints y service-container/facades. Se reescriben las siete guías existentes relacionadas con los dos componentes. Se conservan las URLs anteriores; Entorno mantiene su categoría independiente y se cita desde configuración. Las dos guías de AIO se conservan y no se incluyen en el inventario nuevo de Foundation/Container.

Las doce guías revisadas contienen 12 diagramas Mermaid por idioma: creación, arranque/cierre HTTP, CLI, protocolos, configuración, resolución, scopes, fachadas y alcance de la caché.

## Inventario contrastado

`public/downloads/application-container-api-inventory.json` contiene **330 declaraciones propias** con firmas, archivo, línea y destino de documentación. El conteo incluye contratos e implementaciones por separado; no representa 330 operaciones diferentes.

| Área | Cobertura |
| --- | --- |
| Foundation: 242 declaraciones | Application/IApplication, propiedades, bootstrap, runtime, protocolos, lifecycle, Directory/IDirectory, enums, mapas nativos, Configuration y validadores comunes. |
| Container: 88 declaraciones | Contrato e implementación, cuatro formas de registro, resolución/construcción/invocación, scopes, errores, proveedores, fachadas y contratos relacionados. |
| Configuración de componentes: 648 referencias separadas | Entidades, campos, enums y helpers identificados en foundation/config, vinculados a la guía del componente correspondiente o a la configuración general. |

Las 330 declaraciones se distribuyen en 24 clases, 244 métodos —incluidos constructores, propiedades y protocolos seleccionados—, 24 funciones, 23 campos y 15 constantes. El inventario excluye helpers privados, variables de tipado, maquinaria de exportación diferida, miembros heredados y métodos generados por dataclasses. Las exportaciones de compatibilidad de los mapas nativos se explican en la guía aunque no sean declaraciones léxicas independientes.

Las 648 referencias de configuración **no se presentan como una nueva documentación detallada del 100 % de sus campos**: sus opciones pertenecen a Database, HTTP, Storage, Auth y los demás componentes. Esta sección sí explica individualmente la composición de Configuration, los campos de App, los diez validadores comunes y los helpers públicos de configuración encontrados en logging y session.

El auditor `scripts/audit-application-container-source.py` reconstruye las identidades y firmas mediante AST y compara 202 hashes de fuentes normalizadas a LF, incluyendo los puntos de integración auxiliares. Una declaración nueva requiere un destino revisado antes de regenerar. El validador `scripts/validate-application-container-coverage.mjs` comprueba destinos y anclas ES/EN, unicidad e integración de las 14 guías en cinco grupos. Está incluido en la validación del sitio y funciona en CI sin el checkout del framework.

## Precisiones y límites documentados

- create, boot eager y startup HTTP/CLI son etapas diferentes. isBooted es un alias del estado de creación; isHttpReady refleja la publicación de handlers, no la salud de servicios externos ni del servidor después del cierre.
- Los callbacks se ejecutan con DI, se guardan en conjuntos sin orden garantizado y no se serializan. boot por sí solo no reproduce los eventos ni inicia kernels. El kernel CLI se prepara antes del startup CLI.
- ASGI y RSGI utilizan el mismo bootstrap y el mismo kernel HTTP; sus protocolos de inicio y cierre son diferentes. Se documentan el despacho sin lifespan y los errores de arranque.
- config(key, value) es un setter, no una lectura con default. La configuración runtime es mutable y compartida por proceso. resetRuntimeConfig no recarga .env ni reconstruye servicios; los objetos no tratados por FreezeThaw, como los sets, conservan su identidad y sus mutaciones internas no se revierten.
- Los setters withConfig guardan diccionarios, no garantizan validar todas las opciones. La mezcla es por sección; los archivos dataclass del proyecto se aplican después de los overrides. Configuration no es un paso implícito de validación de Application.
- Los registros transient, singleton y scoped reciben clases, no factories arbitrarias. Un callable se ejecuta mediante invoke y su resultado puede registrarse con instance. build construye una instancia nueva; make respeta los bindings y sus ciclos de vida.
- Se explican prioridades de instancias locales/globales, singleton ya resuelto, alias, override, dependencias circulares, argumentos explícitos, anotaciones y limitaciones de await en invocación.
- Los scopes HTTP, WebSocket y CLI tienen duraciones distintas. Las tareas hijas heredan el contexto; los scopes anidados lo sustituyen y restauran. El cierre elimina referencias, pero no llama automáticamente a close/aclose de todos los servicios.
- Los proveedores eager se construyen directamente con app; los deferred pueden usar DI en el constructor. register/boot no reciben inyección automática de parámetros. Se documentan el orden real de registro, el boot async pendiente, concurrencia y reintentos.
- Una fachada sin fijar devuelve una operación diferida incluso si el método del servicio es síncrono. Una fachada fijada conserva la semántica sync/async del servicio. ScopedFacade requiere una instancia ya publicada en el scope y no la autoconstruye.
- Directory contiene 46 accessors. IDirectory no tiene binding automático. Cambiar un directorio padre no relocaliza todas las claves y los métodos no crean carpetas.
- compile persiste metadatos JSON, no conexiones ni instancias. Las rutas vigiladas inexistentes se ignoran; la huella utiliza paths, tamaño y mtime. Los archivos locales solo se comparten cuando el filesystem real es común.
- El alcance por Fargate se explica a partir del acceso local del código y de las fuentes primarias de AWS: almacenamiento efímero por tarea y volúmenes compartidos configurados explícitamente. No se atribuye a Orionis una coordinación distribuida de la caché.

## Evidencia de ejecución

- Suite nativa Container: 256 pruebas correctas.
- Suite nativa Foundation: 208 pruebas correctas. Total nativo relacionado: **464 pruebas**. Los subconjuntos de providers y fachadas pertenecen a esas suites y no se suman otra vez.
- Arnés de Container: 32 comprobaciones reales de registro, construcción, invocación, scopes anidados, prioridades y concurrencia.
- Providers y fachadas: diez escenarios reales de eager/deferred, resolución, pinning, despacho sync/async y scopes; generadores ejecutados en directorios temporales, incluyendo archivos existentes y fallos parciales .py/.pyi.
- Configuración: nueve bloques ejecutados en temporales, catorce casos inválidos y pruebas de precedencia y diferencias entre constructor y setter.
- Lifecycle/API: cuatro conjuntos ejecutados mediante el bootstrap real para DI de constructor y método, hooks, boot y getters de aplicación.
- Directory: 46 métodos y defaults contrastados con AST, 92 accesos ES/EN ejecutados, dos controladores resueltos mediante DI y ausencia de binding automático IDirectory confirmada.
- Revisión cruzada de las guías generales contra el código, con comprobación adicional de identidad de sets en FreezeThaw.

Los arneses y logs de ejecución se conservaron en el directorio temporal del usuario con prefijos orionis-application y orionis-container y fecha 20261023. Se utilizaron aplicaciones temporales y Python con -B; no se modificó el .env ni se conectaron servicios externos.

## Validación del sitio

- 19 pruebas del sitio y la navegación correctas.
- Ejemplos del sitio: 4.350 bloques Python, 276 JSON y 82 JavaScript; 3.400 imports nativos comprobados y ningún error.
- El auditor reconstruido coincide con las 330 declaraciones, las 648 referencias separadas y los 202 archivos de fuente. Los 33 archivos cambiados son UTF-8 sin BOM y LF; diff --check correcto. El checkout del framework permanece limpio.
- Build correcto: 411 páginas generadas; comprobación posterior de 410 páginas renderizadas. Catálogo de 24 categorías, 203 páginas de manual por idioma y dos recursos por idioma; 3.450 enlaces internos válidos, traducciones, fragmentos, redirecciones, sitemap y búsqueda comprobados.
- Navegador a 390 px: doce guías revisadas en ambos idiomas, sin desbordamiento de página y con una sola selección activa. Las tablas amplias usan scroll interno. Los cinco subgrupos contienen 4/3/3/2/2 enlaces; la apertura exclusiva de subgrupos en móvil funciona. Diagramas renderizados sin errores, con scroll interno cuando su ancho lo requiere. Revisión visual de escritorio a 1440 px.
- Servidor Astro reiniciado y activo en http://localhost:4321/es/getting-started/application-overview.

La primera validación detectó dos títulos EN distintos del catálogo y cuatro enlaces a slugs incorrectos. Se corrigieron antes del build y de la comprobación final. No quedan fallos conocidos relacionados con estos cambios.

## Repetir la validación

```shell
python -B scripts/audit-application-container-source.py --framework-root ../framework
node scripts/validate-application-container-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor de fuente requiere un Python compatible con el framework y acceso a ese checkout. La validación del sitio usa el inventario publicado; un cambio futuro en las fuentes debe revisarse antes de regenerarlo.
