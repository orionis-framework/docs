# Organización de rutas y limpieza del proyecto

Revisión del 23 de octubre de 2026 sobre el catálogo, navegación, Markdown, recursos y herramientas de mantenimiento del sitio.

## Estructura canónica

El catálogo sigue el orden completo de la navegación: bloques, categorías, grupos y páginas. Cada URL pertenece a la raíz de su categoría y cada Markdown ocupa exactamente `src/content/docs/{idioma}/{ruta}.md`. El orden del menú es explícito; los nombres de archivo no necesitan prefijos numéricos.

- 26 categorías distribuidas en cinco bloques.
- 225 páginas canónicas por idioma: 223 del manual y dos recursos de contribución.
- 448 archivos Markdown y dos páginas Astro de colaboradores, para 450 páginas canónicas renderizadas.
- 328 Markdown trasladados. Se conservan los IDs de las páginas retenidas y la correspondencia ES/EN.

Las categorías anteriormente ubicadas bajo `services`, `security`, `architecture`, `asynchronous`, `protocols` y `advanced` utilizan ahora sus raíces temáticas del menú. Database, ORM y Faker tienen carpetas independientes. La configuración completa vigente está en `config/documentation-menu.json` y `config/documentation-navigation.json`.

Ejemplos de capítulos cuyo nombre ahora describe su contenido:

| Contenido | Ruta anterior sin idioma | Ruta actual sin idioma |
|---|---|---|
| Primer arranque | `/getting-started/getting-started` | `/getting-started/quick-start` |
| Middleware | `/http/middleware-and-security` | `/http/middleware` |
| Controladores | `/http/request-lifecycle` | `/http/controllers` |
| Validación HTTP | `/http/requests-and-validation` | `/http/validation` |
| Request | `/http/forms-and-uploads` | `/http/requests` |
| ORM | `/database/orm` | `/orm` |
| Faker | `/database/orm/faker` | `/faker` |
| Migraciones | `/database/migrations-and-seeders` | `/database/migrations` |
| Servidores y rutas MCP | `/protocols/mcp/servers-and-tools` | `/mcp/servers-and-routes` |
| Recursos MCP | `/protocols/mcp/resources-and-prompts` | `/mcp/resources` |

Se corrigieron nombres del menú: Excepciones, Almacenamiento de archivos, Utilidades, Esquemas y validación y Middleware. Los nombres en inglés mantienen su equivalente correspondiente.

## Compatibilidad y preservación del contenido

`config/legacy-redirects.json` mantiene 207 equivalencias compartidas por ambos idiomas: 414 direcciones antiguas, además de los tres accesos raíz. Los destinos son canónicos y directos, sin cadenas, ciclos ni colisiones con páginas actuales. Se verificaron las 227 entradas por idioma del catálogo anterior; las 332 URL canónicas renombradas o fusionadas conservan un destino válido.

Los enlaces internos, traducciones, enlaces de edición, inventarios descargables, generadores de inventarios, validadores y pruebas de integración utilizan las rutas actuales. Las direcciones anteriores quedan fuera del sitemap y del índice de búsqueda.

Se comparó cada guía conservada con su contenido en Git antes de la migración. Fuera de las actualizaciones de URL, solamente cambiaron las introducciones del ORM y la guía asíncrona al incorporar las notas de los índices fusionados.

Los 14 inventarios de API conservan firmas, estadísticas, fuentes y hashes. Sus 5.299 modificaciones son exclusivamente referencias documentales previstas. Los informes anteriores de `audits/` permanecen como evidencia histórica y pueden mencionar rutas anteriores; no sustituyen al catálogo vigente.

## Limpieza realizada

- Se fusionó el índice de eventos y scopes del ORM con su introducción y guías específicas. Su nota conceptual se conserva en la introducción al ORM.
- Se fusionó el índice de ejecución asíncrona con la guía detallada. Se conservan las indicaciones sobre el loop activo y el enlace a colas persistentes y tareas de respuesta.
- Estas fusiones retiraron cuatro Markdown redundantes, dos por idioma, con redirecciones hacia su contenido actual.
- Se retiraron 56 directorios de contenido que quedaron vacíos y cuatro directorios locales vacíos bajo `packages/realtime-client`.
- Se eliminó una equivalencia antigua de `console/command-routing` que ya coincidía con una página canónica y antes se ignoraba silenciosamente.
- Se centralizaron los 14 validadores de API en `scripts/validate-api-coverage.mjs`. `docs:coverage` ahora comprueba todos los componentes, al igual que la validación general.
- Se actualizó el README con la estructura, el procedimiento de mantenimiento, las auditorías y las comprobaciones actuales, sin cifras de páginas que queden obsoletas.

La revisión de recursos y dependencias no encontró código versionado, fuentes, imágenes, licencias ni herramientas de auditoría que pudieran eliminarse sin perder funcionalidad o trazabilidad. Los inventarios públicos son entradas de validación y descargas enlazadas desde las guías. Los directorios generados y la configuración local permanecen fuera del control de versiones.

## Protección contra futuras inconsistencias

La navegación valida el orden compartido con el catálogo, la raíz de las URL, los nombres localizados y la ausencia de etiquetas hermanas duplicadas. Las redirecciones rechazan destinos no canónicos, cadenas, ciclos y orígenes que oculten páginas publicadas. La validación existente comprueba además archivos huérfanos, títulos, enlaces, fragmentos y traducciones.

Las pruebas de estructura se ejecutan en GitHub Actions antes de compilar. La compilación ejecuta `postbuild` para verificar el HTML producido, incluidos navegación, enlaces de edición, URL canónicas, sitemap e índice de búsqueda.

## Validación ejecutada

- `npm run docs:test`: 30 pruebas correctas.
- `npm run docs:coverage`: 14 inventarios correctos.
- Los 14 auditores `audit-*-source.py` contra el checkout real del framework: correctos, sin regenerar inventarios.
- `node scripts/validate-documentation.mjs`: 3.772 enlaces internos y 26 referencias permanentes a la implementación, sin errores.
- `node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework`: 5.650 bloques Python, 284 JSON, 82 JavaScript y 4.182 importaciones nativas, sin errores.
- Integración opcional Realtime: 106 comprobaciones ASGI/RSGI, 36 ejecuciones de ejemplos ES/EN y consumidores TypeScript NodeNext/Bundler correctos con las rutas reubicadas.
- `npm run build`, incluido `postbuild`: 450 páginas renderizadas, traducciones, redirecciones, enlaces, fragmentos, sitemap y búsqueda correctos. Pagefind indexó las 450 páginas canónicas en ambos idiomas.
- Navegador sobre el sitio compilado: 26 categorías y 225 enlaces del menú ES, navegación a ORM y Faker, selección única, enlaces de edición nuevos, redirección desde la URL anterior de Faker y cambio de idioma correctos. Revisados escritorio de 1440 px y móvil de 390 px; sin desbordamiento horizontal en las páginas examinadas. En móvil, apertura exclusiva de categorías y cierre al seleccionar una guía correctos.
- `git -c core.autocrlf=false diff --check`: correcto. Checkout del framework sin modificaciones.

No se modificó la implementación de Orionis ni se publicaron estos cambios durante esta revisión.
