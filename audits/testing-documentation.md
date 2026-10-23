# Auditoría de documentación de Pruebas

## Organización

La categoría «Pruebas de aplicaciones» se renombra a **Pruebas** (`Testing` en inglés). Conserva su entrada independiente y se divide en «Casos de prueba» y «Aplicación y resultados».

Se amplían las tres URLs existentes: `/testing`, `/testing/writing-and-running-tests` y `/testing/results-and-reference`. Se agregan `/testing/cases-and-decorators` y `/testing/dependency-injection`, en ambos idiomas. Las guías especializadas de MCP y Database/ORM conservan sus ubicaciones en los árboles de esos componentes, con enlaces desde la introducción.

## Fuente y cobertura

El inventario `public/downloads/testing-api-inventory.json` relaciona **106 declaraciones públicas propias con sus guías**, y verifica **53 archivos de fuente e integración**, incluidos 15 archivos de pruebas nativas. Los contratos y sus implementaciones cuentan por separado; también se inventarían campos, enums, callbacks del runner, proveedor y metadata de los comandos. Esta cifra no significa que existan 106 métodos que deba invocar el desarrollador.

Se revisaron `config/testing.py`, `orionis/test`, las entidades de configuración, la fachada `Test`, los comandos `test` y `make:test`, su stub y las integraciones de aplicación/contenedor. La API heredada de `unittest` se registra aparte; no se presenta una cobertura completa de la biblioteca estándar como API propia de Orionis.

Contenido documentado:

- Importación obligatoria de `TestCase` desde `orionis.test`, métodos sync/async y constructor administrado por el loader.
- `make:test name`, normalización real de nombres, subdirectorios, creación exclusiva y contenido exacto del stub. La prueba generada empieza omitida y requiere aserciones.
- Seis hooks, ocho herramientas de cleanup/contextos, subpruebas, aserciones, AsyncMock y parcheo mediante contextos.
- Los cuatro decoradores de control de `unittest`: `skip`, `skipIf`, `skipUnless` y `expectedFailure`. Orionis no exporta decoradores propios de pruebas.
- Inyección en el método de prueba, construcción transitiva de servicios, resolución explícita en hooks/helpers y scopes abiertos por la prueba. No se atribuye DI al constructor de TestCase o a sus fixtures.
- Las seis propiedades de `Testing`, variables de entorno, tipos, valores predeterminados, validación y precedencia respecto a la CLI.
- Todos los flags reales de `test`, filtros, verbosidad 0/1/2, paneles, fail-fast y códigos de salida. Una suite vacía devuelve 0; los filtros no cambian el prefijo `test` del loader.
- Archivo JSON opcional, ruta, 14 campos de resultado, cuatro estados, subpruebas, fallos esperados y límites de persistencia. No existe un flag `--json` de stdout.
- Los ocho métodos del motor/contrato, servicio singleton, fachada, runner y callbacks del procesador de resultados.

`scripts/audit-testing-source.py` contrasta fuentes y firmas con el snapshot. Su ejecución normal no lo modifica; `--write` requiere revisión previa, y una declaración nueva necesita un mapeo explícito. `scripts/validate-testing-coverage.mjs` comprueba destinos en ambos idiomas, cobertura de las referencias, características heredadas y navegación; está integrado en el validador general.

## Verificación ejecutada

- **231 pruebas nativas** completadas correctamente mediante Reactor: 179 de `tests/test`, 20 de generadores, 16 de stubs y 16 del comando `test`. Las ejecuciones duplicadas durante el análisis no se suman.
- Ejemplos de casos ES/EN: 24 métodos ejecutados con aplicación real, más dos comprobaciones específicas del orden de lifecycle y de limpieza tras un fallo de preparación.
- Siete escenarios de CLI con aplicación temporal: aprobado, resultados mixtos, fail-fast, suite vacía y variantes de salida 0/1/2. JSON, estados y códigos contrastados; ocho comprobaciones adicionales de configuración estricta.
- Fixture exacto de las páginas de creación/DI: seis comprobaciones correctas, incluida generación del stub, preservación de un archivo existente, omisión inicial, cinco casos aprobados de sync/async/DI/scopes/helpers y selección de un método. El fixture verifica igualdad de bloques Python ES/EN.
- Auditoría de snapshot: aceptación de fuentes idénticas y rechazo de una fuente modificada o de una nueva declaración sin referencia. Framework sin modificaciones.
- **23 tests del sitio** correctos. El analizador verificó 4.438 bloques Python, 284 JSON, 82 JavaScript y 3.542 imports nativos en toda la documentación, sin errores.
- Compilación y postbuild correctos: **426 páginas renderizadas y 3.688 enlaces internos**, con fragmentos, traducciones, navegación, redirecciones, sitemap y buscador verificados.
- Revisión real en navegador: cinco guías ES a 390 px sin desbordamiento horizontal de página, un solo enlace activo y tablas con desplazamiento local. Ambos diagramas se renderizan; los cinco destinos del menú móvil son visibles al abrir los grupos. Referencia EN comprobada en escritorio.

Los fixtures fueron temporales; no se publican archivos generados ni datos de ejecución de la aplicación. La evidencia de ejecución se registró en las herramientas. El chequeo de creación e inyección también produjo un resumen local temporal de seis comprobaciones.

## Límites confirmados

El runner no cambia automáticamente APP_ENV, no selecciona otra base de datos, no activa rollback y no crea un scope por caso. Su executor no propaga el ContextVar del scope CLI al hilo de ejecución. Las guías muestran limpieza y scopes explícitos.

Si `setUpClass()` falla antes del primer caso, el procesador puede lanzar `AttributeError` porque su temporizador todavía no existe, en lugar de completar un resultado ERRORED y el JSON. Se comprobó y documentó este caso; no se modificó la implementación del framework.

Los archivos JSON tienen nombres con resolución de un segundo, no ofrecen retención automática y pueden sobrescribirse entre ejecuciones en ese intervalo. El motivo de un skip ordinario no se exporta en un campo independiente. Estas limitaciones están descritas en la referencia de resultados.

## Repetir comprobaciones

```shell
python -B scripts/audit-testing-source.py --framework-root ../framework
node scripts/validate-testing-coverage.mjs
npm run docs:test
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```
