# Informe técnico: Database y ORM

La documentación se contrastó directamente con el checkout de Orionis situado junto al proyecto. No se modificaron el framework, sus generadores ni sus templates.

## Estructura resultante

Se mantienen las 13 URLs anteriores y se incorporan 30 páginas: **43 guías por idioma, 86 archivos ES/EN**, distribuidos en dos categorías independientes. Los capítulos son elementos del mismo nivel, con etiquetas cortas, traducciones y estado activo propios. La navegación conserva el límite de dos niveles del sitio.

**Base de datos: 21 guías.** Introducción, drivers y dependencias, configuración, conexiones, fachada DB, SQL y bindings, selección y resultados, filtros, joins/subconsultas, escrituras/bloqueos, transacciones, esquemas, tipos, modificadores, alteraciones, migraciones, seeders, dialectos/producción, API de conexiones, planes SQL e inventario.

**ORM: 22 guías.** Introducción, modelos/atributos, persistencia/estado, consultas, definición y operaciones de relaciones, carga anticipada/N+1, soft deletes, scopes, eventos, colecciones/paginación, factories, Faker, seis catálogos alfabéticos de proveedores, definiciones de tabla/tipos, mapa de mecanismos del modelo y testing.

Las nuevas páginas tienen referencias cruzadas hacia HTTP, transacciones, esquemas, modelos y pruebas; no sustituyen las guías HTTP ni alteran otras categorías.

## Inventario y alcance de cobertura

El inventario descargable se encuentra en `public/downloads/database-orm-api-inventory.json`. La página `/es/database/api-coverage` explica su alcance y ofrece referencias por archivo. Cada entrada tiene un destino individual en ambos idiomas.

| Medida | Resultado |
| --- | ---: |
| Declaraciones léxicas extraídas de Database y ORM | 978 |
| Declaraciones públicas con referencia documental | 971 |
| Exclusiones internas justificadas individualmente | 7 |
| Entradas adicionales de API, configuración, comandos y colecciones | 423 |
| Proveedores Faker tipados | 675 |
| Utilidades dinámicas adicionales de Faker | 7 |
| Archivos fuente identificados mediante hash normalizado | 183 |
| Declaraciones pendientes dentro del alcance auditado | 0 |

Las declaraciones incluyen clases, propiedades, métodos, enum, campos, contratos y determinados protocolos de Python. **No son 978 funcionalidades diferentes.** Los contratos enlazan a la implementación; los métodos heredados se documentan en su clase de origen. Los suplementos cubren, entre otros, constructores generados por dataclasses, configuración, CLI, `Collection` y `Paginator`.

Las siete exclusiones son dos funciones auxiliares de módulos privados de factories, tres constantes de defaults en un módulo privado —sus valores sí aparecen en las firmas consumidoras— y dos aliases del compilador definidos únicamente bajo `TYPE_CHECKING`. El inventario conserva el símbolo y la justificación de cada exclusión.

La cobertura de declaraciones públicas identificadas es completa dentro de esta definición y del código contrastado. Esto no supone que se haya ejecutado cada combinación de parámetros en todos los motores externos.

## API y comportamientos documentados

- Los 11 métodos del gateway que respalda la fachada `DB`, distinguidos de `ConnectionManager`, `Connection` y los métodos de infraestructura heredados de `Facade`.
- Los 71 métodos públicos propios de `QueryBuilderBase`, los siete de `RawQueryBuilder` y los tres de `JoinClause`: firmas, argumentos, resultados, ejemplos y límites de ejecución.
- Las configuraciones de los seis drivers, opciones de `config/database.py`, variables de entorno, dependencias opcionales y el comando `packages` real.
- Transacciones manuales y contextuales, savepoints, propiedad por tarea, concurrencia, cancelación, commit y rollback.
- Las 40 factorías `Column` para los 39 tipos lógicos, sus constructores, defaults, modificadores, restricciones, índices y compatibilidad.
- CLI, contratos y ejecución de migraciones/seeders, descubrimiento, batches, opciones, errores y creación de archivos.
- Opciones y atributos de modelos, casts, accessors/mutators, asignación masiva, hidratación, seguimiento de estado y persistencia.
- Las cuatro relaciones, sus claves, consultas, operaciones de asociación y pivots; carga anticipada y comparación N+1.
- Scopes, soft deletes, los 11 eventos, listeners/observers, vetos, errores y relación con las transacciones.
- API de factories y `Sequence`, cardinalidad, estados, overrides, iteración, concurrencia y persistencia.
- API de gestión de `Fake`, unicidad, opcionalidad, semillas, locales y proveedores personalizados. El catálogo contrasta 675 nombres tipados, 694 sobrecargas y siete utilidades dinámicas; documenta también las variaciones nativas de firma por locale.
- Un módulo completo de 14 pruebas de datos/ORM y otro de dos pruebas de migraciones/seeders, con `TestCase` nativo y SQLite temporal aislado.

## Limitaciones e inconsistencias corregidas

| Tema | Comportamiento verificado y documentado |
| --- | --- |
| Fachada `DB` | Su accessor es `IQueryBuilder`; no expone directamente el API de `ConnectionManager`. |
| Resultados | `get()` devuelve `Collection`; SQL directo devuelve listas de diccionarios. `InsertResult` tiene `last_insert_id` y `row_count`. |
| SQLite URL | La ejecución utiliza `database`; `url` no reemplaza ese destino. |
| Tipos sin compilador | `StrictArray`, `MatchType`, `NumericCommon` y `SchemaType` están declarados, pero carecen de builder SQL. |
| Clave primaria simple | `Blueprint.primaryKey("columna")` solo cambia metadata; para generar la PK simple debe utilizarse `.primary()` en la columna. La restricción compuesta tiene otro comportamiento. |
| Alteraciones | No existe una API general de alteración de tablas; se explican únicamente operaciones reales y las estrategias manuales necesarias. |
| `PickleType` | El tipo conserva `pickler` e `impl`, pero el compilador solo traslada `protocol`. |
| Migraciones | `migrate` sí admite `--seed`; se usan los nombres reales de los generadores y las opciones de cada comando. |
| Fachada `Schema` | La selección nombrada se resuelve con `schema = await Schema.connection(...)`; no se encadena como si ya fuera la instancia concreta. |
| Copia de consultas | `clone()` devuelve otro builder y copia listas, pero comparte los objetos de cláusulas y planes anidados. |
| Condiciones | Se combinan de izquierda a derecha. Un grupo OR vacío se compila como true; `None` no equivale a un iterable vacío. |
| Patrones | `whereStartsWith`, `whereEndsWith` y `whereContains` no activan autoescape de `%` y `_`. |
| Agregados agrupados | Los terminales escalares retornan el primer agregado; `count("*")` tiene tratamiento especial para grupos/DISTINCT/UNION. Para todos los grupos se utiliza una proyección agrupada con `get()`. |
| Escrituras masivas | Conservan WHERE, pero no alias, JOIN, orden, límite u offset de lectura. Serializan valores de almacenamiento sin ejecutar `Model.casts`, `fillable`, mutadores ni eventos por instancia. |
| Bloqueos | SQLite omite el row lock; Redshift lo rechaza; SQL Server utiliza hints específicos. |
| Errores SQL | La capa de conexión sanea mensajes y suprime la causa encadenada del driver. |
| Relaciones | Hay cuatro modalidades; no se documentan relaciones through, polimórficas ni métodos de asociación inexistentes. Las relaciones no se incluyen automáticamente en `toDict()`. |
| Pivot | `wherePivot` limita lecturas, no convierte ese filtro en una restricción para `attach`/`detach`/`sync`/`toggle`. |
| Factories | No existe `Model.factory()` ni creación automática de relaciones; `create()` guarda cada modelo y no abre una transacción implícita. |
| Faker | Disponibilidad y firmas dependen del locale. `pydecimal` conserva su nombre real. `image` y `xml` requieren dependencias adicionales; sus ejemplos manejan `UnsupportedFeature`. |

## Ejemplos y diagramas

Se incorporaron ejemplos completos para controladores, servicios, modelos, relaciones, seeders, factories y pruebas. Los bloques Python son iguales en ES/EN. Los catálogos de Faker incluyen un ejemplo por entrada y el locale compatible.

Los 28 diagramas de ambas traducciones cubren arquitectura, relaciones con cardinalidad/PK/FK, carga N+1 y eventos. Las cuatro relaciones tienen sus propios diagramas. Se reutilizaron Mermaid y los estilos existentes; no se añadieron dependencias.

## Verificaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| Auditor AST contra el checkout real | 978 declaraciones contrastadas; sin nuevas, desaparecidas o pendientes; hashes coincidentes. |
| Inventario y destinos | Todas las entradas tienen anclas válidas en ambos idiomas; sin duplicados injustificados. |
| Runtime Database | 208 comprobaciones nativas de fachada, conexiones, controladores, transacciones, compiladores y workers. |
| Esquemas/migraciones/seeders | 307 comprobaciones nativas y 200 compilaciones DDL sobre cinco dialectos. |
| Pruebas existentes del framework | 129 pruebas relacionadas pasaron. |
| ORM/relaciones/colecciones | 116 comprobaciones nativas. |
| Query Builder | 104 comprobaciones con las expresiones publicadas, más comprobaciones específicas de grupos vacíos, NULL, agregados y alias de DML. |
| Factories/Faker/planes/consultas ORM | 88 comprobaciones ejecutando los bloques publicados. |
| Proveedores Faker | 682 ejemplos publicados ejecutados; 708 variantes de firma contrastadas (706 valores y dos dependencias opcionales identificadas). |
| Pruebas publicadas | Los 16 tests pasaron en ES/EN mediante Reactor y `TestingEngine`: 64 ejecuciones en proyectos temporales. |
| Sintaxis de ejemplos del sitio | 3.478 bloques Python, 276 JSON y 82 JavaScript comprobados; 2.656 imports nativos contrastados; cero errores. |
| Mermaid | 28 diagramas parseados correctamente. |
| Navegación | 17 pruebas del proyecto pasaron; categorías independientes y capítulos al mismo nivel. |
| Documentación | 22 categorías, 162 guías por idioma y 2 recursos de contribución; 2.326 enlaces internos comprobados. |
| Construcción de producción | `npm run build` pasó: 329 páginas generadas, 328 páginas de contenido verificadas, índices de búsqueda, sitemap, redirecciones, traducciones y enlaces del HTML válidos. |
| Navegador | Revisión a 390 y 1440 px; navegación móvil, categoría activa, tablas sin desbordamiento de página y cuatro diagramas de relaciones renderizados. |

La construcción de producción y la verificación del HTML generado pasaron. El servidor local se deja activo después de esa validación.

## Mantenimiento reproducible

```bash
npm run docs:coverage
python -B scripts/audit-database-orm-source.py --framework-root ../framework
npm run docs:validate
npm run docs:test
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

La validación de cobertura forma parte de la validación normal de documentación y del postbuild. No exige un checkout del framework en GitHub Pages; la comparación AST y hashes sí se invoca explícitamente con `--framework-root`.

No se probaron servidores externos MySQL, PostgreSQL, Oracle, SQL Server o Redshift: la evidencia de ejecución corresponde a SQLite y a compilación/configuración según el caso. Esa comprobación de infraestructura externa queda fuera de la evidencia disponible; las diferencias de cada motor están documentadas.
