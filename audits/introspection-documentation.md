# Auditoría de Introspección

## Organización y alcance

Se amplían las tres páginas anteriores y se crean seis guías por idioma, manteniendo todas las URLs publicadas. El nuevo grupo **Introspección** dentro de **Utilidades y metadatos** reúne, en orden:

1. Introducción (`/advanced/introspection`).
2. Reflection: clasificación y selección (`/advanced/introspection/reflection`).
3. Funciones y métodos (`/advanced/introspection/callables`).
4. Clases abstractas (`/advanced/introspection/abstract-classes`).
5. Clases concretas (`/advanced/introspection/concrete-classes`).
6. Instancias (`/advanced/introspection/instances`).
7. Dependencias y firmas (`/advanced/introspection/dependencies-and-discovery`).
8. Módulos (`/advanced/introspection/modules`).
9. Descubrimiento de módulos (`/advanced/introspection/module-discovery`).

Helpers y Metadata conservan sus grupos, páginas y orden. Las referencias de soporte permanecen en «Extensión y referencias». Los alias históricos `reflection/*` dirigen a las referencias específicas, conservando los antiguos destinos canónicos como páginas válidas.

## Fuente de verdad y cobertura

Se inventarían los **30 archivos Python** de `orionis/introspection`, incluidos contratos e inicializadores. La cobertura propia consta de **329 declaraciones**: diez clases, 307 métodos y doce campos de entidades. Los 307 métodos se separan en 279 métodos públicos ordinarios y 28 métodos especiales declarados, incluidos constructores y hooks `__post_init__`.

| Clase | Métodos públicos | Métodos especiales | Total propio |
| --- | ---: | ---: | ---: |
| Reflection | 31 | 0 | 31 |
| ReflectionCallable | 10 | 5 | 15 |
| ReflectionAbstract | 61 | 5 | 66 |
| ReflectionConcrete | 64 | 5 | 69 |
| ReflectionInstance | 66 | 5 | 71 |
| ReflectionModule | 28 | 5 | 33 |
| ModuleInspector | 4 | 0 | 4 |
| ReflectDependencies | 3 | 1 | 4 |
| Signature | 12 | 1 | 13 |
| Argument | 0 | 1 | 1 |

Los campos son nueve de `Argument` y tres de `Signature`. La construcción y los protocolos generados por dataclasses se explican por separado: no se suman como métodos implementados por Orionis. Tampoco se incluye como método propio `Signature.getFields`, heredado de `BaseEntity` y documentado explícitamente.

El inventario registra aparte seis contratos con **231 métodos**, 33 declaraciones privadas excluidas justificadamente, dos hooks de exportación diferida y los miembros generados por dataclasses. Mantiene **57 hashes**: treinta fuentes del paquete, diecisiete módulos exactos de pruebas y diez archivos de integración. Las integraciones se citan para explicar sus consumos; no se presenta una cobertura completa de la API de esos otros componentes.

Cada método propio y campo enlaza un anchor explícito en ambas traducciones. Los 307 métodos tienen ejemplos Python que realmente llaman al método o ejercitan el protocolo, comprobados por el validador con grupos próximos y acotados. Las declaraciones de firma sin cuerpo funcional no satisfacen esa comprobación.

El auditor normal compara el snapshot sin modificarlo. Las allowlists impiden incorporar silenciosamente una declaración o un archivo nuevo mediante `--write`. Se comprobaron cinco escenarios con copias temporales: fuente idéntica aceptada; cambio de hash, nuevo método público, nuevo método con `--write` y nuevo módulo con `--write` rechazados. Las pruebas de rechazo no alteran el inventario publicado.

## Contenido y precisiones verificadas

- Importaciones de las ocho clases exportadas por el paquete, entidades en sus módulos explícitos y contratos de los wrappers. No se presenta Reflection como fachada ni se exige un proveedor global.
- Las cinco fábricas y los 26 predicados de Reflection, distinguiendo funciones de sus resultados, instancias de clases y los distintos tipos de descriptor.
- Los límites reales de clasificación: `isBuiltIn` detecta funciones/métodos builtin, no todas las clases builtin; `isConcreteClass(int)` y `isConcreteClass(typing.Any)` son verdaderos; `isTypingConstruct` usa nombres de tipos y no es un detector exhaustivo del módulo typing.
- Los filtros de miembros de clase recorren las declaraciones propias; los de instancia tienen sus reglas de herencia y datos de `vars(instance)`. Una instancia sin diccionario de atributos puede fallar durante esos recorridos.
- Los wrappers abstractos sí permiten modificar atributos y eliminar métodos. Las propiedades concretas se pueden evaluar sobre la clase; una propiedad que requiera estado de instancia puede fallar allí.
- Las modificaciones afectan objetos reales, con invalidaciones de caché distintas según la operación. La eliminación de métodos de instancia actúa sobre la clase; no admite eliminar métodos privados normales por la discrepancia de mangling entre búsqueda y eliminación.
- El constructor de ReflectionInstance aplica exclusiones de módulo, sin verificar importabilidad. Se recomiendan archivos importables para recuperar fuente, no como una validación adicional inexistente.
- Nombre, módulo y docstring de ReflectionCallable son capturas de construcción; limpiar la caché no los renueva. Las identidades capturadas por otros wrappers se explican según sus slots y getters reales.
- El protocolo mapping de los wrappers no tiene el mismo destino en todos ellos: los wrappers de función/clase/instancia exponen caché; el de módulo accede a atributos del módulo. Sobrescribir claves internas puede interferir con resultados calculados.
- `inspect.Signature` y la entidad Orionis `Signature` son resultados distintos. ReflectDependencies clasifica parámetros, pero no construye servicios, ejecuta handlers ni valida payloads.
- Los defaults tienen prioridad sobre la anotación al determinar metadatos. Las referencias futuras y tipos de typing pueden quedar marcados como resueltos sin ser dependencias construibles. `getPositionalOnly` incluye también parámetros que permiten posición o nombre.
- Las entidades frozen conservan mapas o valores mutables; las copias superficiales y sustituciones comparten esos contenidos. Se explican validaciones parciales, retorno de mapas por identidad y cachés LRU sin API pública de limpieza.
- ModuleInspector separa descubrimiento de archivos y AST sin ejecución de la importación efectiva al cargar clases o dataclasses. Se documentan nombres exactos de imports, filtros de entornos virtuales, metadata de carga, caché y errores.
- Los ejemplos de inyección distinguen servicios de aplicación resolubles de wrappers que necesitan un objetivo explícito. Se verificaron construcción por constructor, inyección en métodos, bindings preparados y respuestas de controladores.

## Comprobaciones de ejecución

La suite exacta `tests/introspection` produjo **1.022 resultados PASSED**, sin FAILED ni ERRORED, en diecisiete módulos de pruebas. La cifra coincide con el inventario AST de esos archivos. No se suman ejecuciones repetidas de casos durante la investigación.

Se ejecutaron **580 bloques prácticos entre ambos idiomas**: 34 de introducción/Reflection/ReflectionCallable, 278 de reflexión de clases, 236 de instancias/módulos/descubrimiento y 32 de dependencias y entidades. Los 144 bloques adicionales de declaraciones de firma de las páginas de objetos se validaron aparte y no se cuentan como ejemplos prácticos ejecutados.

Las comprobaciones adicionales verifican el perfil de llamadas de los 31 métodos de Reflection, los controladores mediante `Container.make`/`call`, las distintas modalidades de binding, funciones async, sustitución y pickle de entidades, caché de identidades y discrepancias de mangling. Los fixtures y evidencias se guardaron fuera del repositorio en el directorio temporal del usuario; no se incorporan módulos de demostración a la aplicación real.

No se modifica el framework. Los archivos de auditoría de Testing y Utilities anteriores se conservan como informes de sus respectivas entregas; sus cifras históricas no se reinterpretan como el tamaño actual del sitio.

## Validación final del sitio

- **25 pruebas del sitio aprobadas**, incluida la agrupación de las nueve guías, la conservación de URLs y la ausencia de destinos duplicados.
- Auditor de fuentes y validador de cobertura correctos: los 307 métodos/protocolos tienen ejemplos en español e inglés; campos, contratos, exportaciones, miembros generados e integraciones cuentan con sus referencias separadas.
- Analizador general sin errores: **5.650 bloques Python, 284 JSON, 82 JavaScript y 4.182 importaciones nativas** revisadas en el sitio completo.
- `npm run build` y postbuild finalizaron con código 0: **454 páginas canónicas renderizadas**, 225 manuales por idioma y **3.784 enlaces internos** comprobados. También se verificaron fragmentos, traducciones, redirecciones, sitemap y buscador.
- Las dieciocho páginas localizadas usan UTF-8 sin BOM, LF y un único salto de línea final. `git diff --check` no informa problemas.
- Navegador real a 390 px: las nueve guías ES no desbordan horizontalmente la página; tablas anchas tienen desplazamiento local, hay un solo enlace activo y los nueve destinos del grupo móvil son visibles. El diagrama general renderiza correctamente.
- Escritorio a 1.440 px: índice ES y referencias EN verificadas. ReflectionConcrete, ReflectionInstance y ReflectionModule renderizan sus 69, 71 y 33 anchors de métodos, respectivamente.
- El servidor queda activo en `http://localhost:4321` con `/es/advanced/introspection` abierto. Captura: `C:/Users/runate/AppData/Local/Temp/orionis-introspection-20261023.png`.

No quedan errores de construcción, enlaces o cobertura detectados por las comprobaciones ejecutadas. Las limitaciones de la implementación se describen en las guías; no se modificó el framework para cambiar esos comportamientos.

## Repetir comprobaciones

```shell
python -B scripts/audit-introspection-source.py --framework-root ../framework
node scripts/validate-introspection-coverage.mjs
npm run docs:test
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```
