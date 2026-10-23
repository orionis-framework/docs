# Auditoría de documentación de Console

Fecha: 2026-10-23. Alcance: documentación, navegación y verificadores; sin cambios en el código del framework.

## Fuentes revisadas

Se revisaron `orionis/console`, sus comandos, contratos, plantillas, entrada/salida, Reactor, loader, scheduler, stores y listeners; `config/scheduler.py` y sus entidades; las fachadas Reactor/Schedule y su registro; la integración en Application y bootstrap; FileBasedCache y su serializador; y las pruebas nativas relacionadas.

También se contrastó `config/queue.py`: corresponde a Queues y no configura el planificador. La documentación distingue los calendarios de comandos del almacenamiento de jobs. La fachada pública real es `Schedule`; `Scheduler` es la clase de aplicación registrada mediante `app.withScheduler()`.

## Organización

21 guías por idioma, conservando las cinco URLs anteriores y añadiendo 16. La categoría Console utiliza cinco subgrupos:

| Subgrupo | Guías |
| --- | --- |
| Crear y ejecutar comandos | Introducción; creación/DI; argumentos; rutas. |
| Entrada, salida y progreso | Texto/tablas; preguntas; progreso y esperas. |
| Reactor y metadatos | Fachada/DI/ejecución; descubrimiento/caché; referencia técnica. |
| Scheduler y tareas | Agenda; configuración/persistencia; frecuencias; listeners/eventos; ejecución/API. |
| Comandos incluidos | Índice; generadores; aplicación/mantenimiento; Database; workers/scheduler/MCP; bootstrap. |

`/console/task-scheduling` conserva su URL y pasa de la categoría Queues a Console. Queues mantiene sus nueve guías y las dos de tareas de respuesta. Se actualizaron sus etiquetas y el verificador de navegación; no se alteró el contenido de sus guías. Los enlaces entre componentes permanecen válidos.

## Cobertura verificable

`public/downloads/console-api-inventory.json` registra **596 declaraciones públicas documentadas**, **53 exclusiones editoriales solicitadas**, **67 comandos nativos** y **171 archivos de fuente con checksum**. Las declaraciones se desglosan en 50 clases, 405 métodos, 80 campos, 52 constantes y nueve funciones, relacionadas con 221 destinos documentales en ambos idiomas.

Es un conteo léxico, no de funcionalidades diferentes: contratos, implementaciones y overrides cuentan por separado. Incluye constructores explícitos y campos de clase declarados. Excluye métodos privados, exports, TypeVar, API heredada y métodos generados por dataclasses. La implementación interna de los comandos incluidos se verifica a través de su catálogo CLI separado, sin presentarla como una API adicional de aplicación. Las fuentes auxiliares se conservan como hashes de la integración revisada.

El catálogo CLI enumera las 67 clases realmente registradas en CORE_COMMANDS y sus 75 definiciones de Argument, incluidas las heredadas y repetidas entre comandos. Para cada definición conserva aliases, acción, cardinalidad, sentinel/default, conversor, choices, obligatoriedad, ayuda, metavar, dest y versión. Los metadatos del catálogo publican los campos incluidos en la guía.

| Familia de comandos | Cantidad |
| --- | --- |
| Generadores | 24 |
| Aplicación y mantenimiento | 16 |
| Database | 11 |
| Workers, scheduler y MCP | 9 |
| Bootstrap | 7 |

La referencia incluye los cuatro métodos de Reactor, los 16 del servicio Schedule, los 104 métodos propios del builder Task —incluido constructor—, los métodos de Console y auxiliares incluidos en el alcance editorial, junto con sus contratos, los nueve ArgumentAction, stores, entidades y eventos. El auditor `scripts/audit-console-source.py` compara firmas y valores del catálogo contra el framework; `scripts/validate-console-coverage.mjs` verifica todos sus destinos y está integrado en la validación del sitio.

## Revisión editorial solicitada

- Retirados el manual de integración del parser y su opción de extensión, los auxiliares de volcado y el diagnóstico de peticiones HTTP. El inventario conserva sus 53 declaraciones como exclusiones con motivo, sin destinos documentales; no se cuentan como cobertura publicada.
- Dentro de BaseCommand, salida y preguntas usan self y el progreso utiliza una instancia guardada de self.progressBar. La construcción explícita de Console y ProgressBar queda rotulada como uso fuera de comandos. La URL previa de progreso se conserva, con título y menú simplificados.
- Schedule.command() aparece como primer apartado de su referencia, enlazado desde la introducción y el mapa de API. Incluye firma, args, purpose, ejemplos de fachada y servicio inyectado, registro de la clase y arranque, identidad y restricciones.
- La guía evita nombres de dependencias internas del planificador y describe sus stores mediante la API de Orionis.
- Comprobaciones de esta revisión: cinco invocaciones nuevas de comandos verificadas; 40 bloques de salida ejecutados, 30 handlers, cuatro pruebas de entrada y cuatro caminos de salida con mocks. Los ejemplos nuevos de programación se contrastaron con el parser, contenedor, fachada y servicio reales, incluyendo reemplazo de firma y errores de tipo/estado. La suite nativa previa sigue siendo evidencia del mismo código del framework; esta revisión solo cambia documentación y verificadores. La revisión final aprobó las 19 pruebas del sitio, la comprobación de ejemplos (4.222 Python, 276 JSON, 82 JavaScript y 3.314 imports nativos), la construcción de 399 páginas y la verificación de 398 páginas renderizadas y 3.188 enlaces internos. Se revisaron ocho páginas ES/EN a 390 px sin desbordamiento y con un único enlace activo, además de la referencia de Schedule.command() a 1440 px; el servidor local quedó activo.

## Precisiones y limitaciones documentadas

- Las firmas no incluyen `{argumentos}`. Las clases descubiertas tienen validación de firma, descripción y argumentos; las rutas fluidas usan otra validación. Definiciones posteriores pueden reemplazar firmas previas.
- BaseCommand recibe los valores mediante `setArguments()`; sus parámetros CLI se leen con getters. Los handlers de ruta sin IBaseCommand reciben los valores por nombre. Ambos permiten constructor y método con DI.
- Argument conserva MISSING; no lo confunde con None. `append`/`append_const` necesitan defaults de lista y `count`, un default numérico. Sin ellos, el acumulador predeterminado puede producir un error. Los conversores deben ser importables para reconstruir metadatos.
- Reactor devuelve enteros y convierte otros retornos correctos en cero. Un entero no cero no equivale a excepción; puede acompañarse de DONE y de EXECUTED/retval. Ayuda y errores de argparse usan SystemExit; cancelación y errores del propio scope/capturador pueden propagarse.
- Los generadores comunes pueden imprimir errores y retornar None, con código cero normalizado por Reactor. Se explica esa limitación para automatizaciones. `migrate:fresh` no equivale a `db:wipe`; cada comando conserva sus propias confirmaciones y opciones reales.
- La caché CLI usa el archivo local `commands` de FileBasedCache, activado por Application.compile. No es un driver de Cache, una cola ni un almacén de resultados. El loader y Reactor.info conservan además referencias en memoria. `optimize` valida fuentes sin escribir bytecode ni precargar comandos.
- BaseCommand hereda Console, no todos los auxiliares de output. `exitSuccess`/`exitError` terminan el proceso con os._exit tras sys.exit; no son equivalentes a retornar desde handle. Se documentan los efectos reales de redirectOutput, toHtml y los límites de ProgressBar.
- Las frecuencias terminan la configuración y devuelven bool; no son builders encadenables después del registro. Se incluyen los parámetros y triggers reales, casos de calendario y métodos que no representan un intervalo uniforme continuo.
- El jitter global aparece en metadatos, pero no se propaga al trigger ya construido. No se promete dispersión que el código no aplica.
- Los stores del scheduler son memory, database y redis; no son los drivers de Queues. SQL/Redis persisten el estado de la tarea y requieren código importable compatible. No persisten servicios del contenedor, listeners, scopes ni efectos de negocio; no hay líder distribuido ni reintentos nativos de comandos.
- Los hooks de listeners reciben directamente su evento y no DI adicional por método. Constructor de listener y definición tasks sí pueden recibir DI. Un Reactor que devuelve 1 sin lanzar una excepción produce EXECUTED con retval=1; ERROR requiere una excepción que escape.
- shutdown del scheduler no ofrece las mismas garantías de drenaje de handlers que los workers de Queues; el executor async puede cancelar futures y el estado del wrapper no vuelve automáticamente a STOPPED. El control desde otro proceso no administra remotamente una instancia activa.

## Evidencia de validación

| Comprobación | Resultado |
| --- | --- |
| Suite nativa `python -B -X utf8 reactor test --start-dir tests/console --no-panel --verbosity 1` | 1.435 aprobadas, cero fallos y cero omitidas; salida 0. |
| Comandos incluidos | 276 invocaciones publicadas parseadas y 134 ayudas contrastadas con Argument/argparse reales. |
| Generadores | Los 24 ejecutados en directorios temporales; 25 archivos .py/.pyi válidos y 24 negativas de sobrescritura. |
| Comandos, rutas y DI | Aplicaciones reales temporales: fachada fijada al mismo IReactor, ocho invocaciones, seis componentes programáticos, DI de constructor/método, Storage, tres reportes y SQLite. |
| Argument | Nueve acciones, cinco variantes nargs, aliases, choices, conversor, abreviaturas, lectura/copias y errores de defaults verificados. |
| Caché y plantillas | Caché real con 68 metadatos, JSON/hash y restauración de parsers; eliminación del archivo sin recarga del loader existente; preview/create de Stub, exclusividad y entrypoint probados. |
| Salida | 44 bloques ejecutados, 18 handlers y casos específicos de preguntas, exits parcheados, progreso, copias y HTML; 100 bloques de las ocho guías/traducciones del área analizados. |
| Scheduler | 292 bloques Python analizados; 226 ejemplos de calendario ejecutados con triggers reales; stores SQLite temporales con serialización/restauración de callable/firma/args; DI real y demo de tres segundos; eventos EXECUTED/retval=1, ERROR y captura del listener verificados. |
| Inventario | 596 declaraciones documentadas, 53 exclusiones editoriales y 67 comandos contrastados con la fuente. |
| Sitio y ejemplos | 19 pruebas aprobadas; 4.222 bloques Python, 276 JSON y 82 JavaScript, con 3.314 imports nativos válidos. |
| Construcción y navegación | `npm run build` aprobado: 399 páginas generadas y 398 de contenido verificadas; 3.188 enlaces internos, fragments, traducciones, sitemap y búsqueda correctos. |
| Navegador y servidor | 21 guías ES revisadas a 390 px sin desbordamiento de página, tablas con scroll interno y un enlace activo. Cinco subgrupos, apertura exclusiva móvil, filtro/restauración y cambio ES/EN comprobados. Los cinco diagramas renderizan SVG sin errores a 1440 px. Astro queda activo en `http://localhost:4321/es/console`. |

Los subconjuntos de pruebas y ejemplos se solapan; no se suman como pruebas nativas distintas. No se enviaron correos, se instalaron paquetes ni se contactó Redis o servicios de producción. Todos los archivos de ejecución y bases de prueba utilizaron temporales.

La primera corrida nativa presentó una espera en una prueba de salida redirigida con la codificación predeterminada de Windows. Se reprodujo con un arnés acotado y se verificó la suite completa con `-X utf8`, sin modificar el framework. Esta observación de pruebas no se presenta como documentación de una API incluida en la guía.

## Repetir la validación

```bash
python -B scripts/audit-console-source.py --framework-root ../framework
node scripts/validate-console-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor necesita el checkout de implementación y Python 3.14. Su opción `--write` regenera el inventario después de revisar la implementación y actualizar las páginas. Los verificadores del sitio no necesitan el checkout del framework en CI.
