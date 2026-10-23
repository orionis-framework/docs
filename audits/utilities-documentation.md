# Auditoría de Utilidades y metadatos

## Alcance y organización

La categoría anterior «Utilities and extensions» pasa a **Utilidades y metadatos** / **Utilities and metadata**. Se organiza en tres grupos: **Helpers**, **Metadata** y **Extensión e introspección**. Los dos primeros contienen los nueve componentes solicitados; el tercero conserva las referencias anteriores y sus URLs, sin atribuirles una auditoría completa de módulos ajenos a este alcance.

Se crean ocho guías por idioma: Collection, DotDict, Sentinel, StdClass, Stringable, Workers, FreezeThaw y PerformanceCounter. Se reescribe la página existente de Metadata. Los índices y ejemplos combinados enlazan las nuevas referencias. Los alias históricos `helpers/*` correspondientes apuntan a las nuevas guías; se incorpora el alias de Sentinel.

## Fuente de verdad y cobertura

Se revisan los nueve archivos solicitados, sus exportaciones y los contratos de Workers y PerformanceCounter. También se verifica la resolución de dependencias y el comportamiento mediante las pruebas del framework y ejemplos ejecutables.

| Componente | Métodos públicos propios | Protocolos propios | Cobertura de métodos |
| --- | ---: | ---: | ---: |
| Collection | 48 | 13 | 61/61 |
| DotDict | 3 | 3 | 6/6 |
| Sentinel (`MISSING`) | 0 | 2 | 2/2 |
| StdClass | 4 | 6 | 10/10 |
| Stringable | 146 | 2 | 148/148 |
| Workers | 2 | 0 | 2/2 |
| FreezeThaw | 2 | 0 | 2/2 |
| PerformanceCounter | 16 | 5 | 21/21 |
| Metadata | 0 | 0 | Diez constantes de módulo |

En total se documentan **252 métodos declarados**: 221 públicos ordinarios y 31 métodos de protocolos, contando los constructores propios dentro de estos últimos. Los métodos heredados de `str`, `dict` y `object` no se suman como métodos propios de Orionis. Las páginas describen los protocolos e interfaces heredadas relevantes por separado. Sentinel no es una clase pública para instanciar; se documenta el valor exportado `MISSING` y el comportamiento de su tipo privado.

El inventario verificable contiene **272 declaraciones nativas** al incluir siete clases públicas, la clase privada del marcador, `StdClass.RESERVED`, `MISSING` y las diez constantes. Registra por separado **72 declaraciones de contratos**, once exclusiones privadas y **45 hashes de archivos revisados**, incluidos 16 módulos de pruebas. Cada declaración funcional enlaza un anchor explícito en las guías de ambos idiomas.

El auditor de fuente no modifica el snapshot en su ejecución normal. Las pruebas con copias temporales confirman que rechaza fuentes modificadas, y que `--write` sigue rechazando métodos públicos o dunders nuevos sin un mapeo revisado. El validador de documentación comprueba los 209 métodos de Collection/Stringable con ejemplos Python cercanos que realmente usan la operación o su protocolo; una eliminación simulada de las llamadas a `Collection.first()` se rechaza.

No se presentan los helpers internos de agrupación/serialización de Collection, el predicado interno de FreezeThaw ni la función privada de detección de CPU como APIs de aplicación. Tampoco se cuentan como funcionalidades los métodos generados automáticamente por el intérprete.

Las guías incluyen importaciones desde los paquetes que efectivamente reexportan cada nombre, firmas, parámetros, valores predeterminados, retornos, mutaciones y ejemplos. La resolución de clases concretas se distingue de los bindings explícitos de contratos, y de los valores de entrada que deben construirse o proporcionarse a la aplicación. No se atribuye hidratación automática de payloads a las anotaciones de helpers.

## Comportamientos y límites confirmados

- Collection trabaja en memoria y puede exponer o sustituir su estructura de respaldo. `each`, `reject`, `random(count)` y las colecciones respaldadas por diccionarios tienen efectos particulares documentados. Los ejemplos distinguen una colección nueva de una copia profunda y verifican casos vacíos, callbacks y excepciones.
- Stringable hereda la construcción de `str`; algunas operaciones heredadas devuelven cadenas ordinarias. La referencia cubre parámetros y variantes de Unicode, regex, búsqueda, reemplazo, predicados, callbacks, análisis y codificación. Se explican resultados reales como `knives` → `knfe`, sin atribuir corrección lingüística general al inflector.
- `Stringable.encrypt/decrypt` delegan en Crypt sin envolver el resultado. La guía diferencia el dispatcher awaitable de la fachada sin fijar y el resultado directo de una fachada fijada; el servicio nativo devuelve `str`. Los ejemplos públicos muestran componentes asíncronos, sin fixtures ni mocks.
- DotDict transforma diccionarios anidados para acceso por atributos; listas y otros valores no se copian recursivamente con `copy()`/`export()`. Un `get()` con un default de diccionario puede insertarlo.
- MISSING debe compararse por identidad; copiarlo o usar pickle no conserva necesariamente la identidad del marcador exportado. Su representación real es `<MISSING>`.
- StdClass valida nombres al construir, actualizar y convertir desde un diccionario; una asignación directa no pasa por esa validación. Una actualización puede quedar parcialmente aplicada y sus valores afectan al hash.
- FreezeThaw no garantiza inmutabilidad profunda para tipos arbitrarios. El orden de congelación puede conservar copias intermedias mutables en grafos compartidos o ciclos; los ejemplos muestran este límite. `thaw()` normaliza secuencias a listas y no es un serializador.
- Workers utiliza CPU y memoria total cacheadas al importar el módulo. El presupuesto efectivo está en GiB, se comparte a nivel de clase y devuelve al menos uno incluso con memoria insuficiente; no crea procesos ni garantiza capacidad libre.
- PerformanceCounter requiere iniciar y detener antes de leer. Las parejas sync/async son coherentes, los contextos no suprimen excepciones y una instancia no admite mediciones simultáneas independientes. No agrega ni persiste métricas.
- Metadata consta de diez valores del paquete instalado; importarlos no realiza consultas de red ni verifica actualizaciones. No hay una clase o binding nativo Metadata.

## Comprobaciones de ejecución

Se completaron **734 pruebas nativas únicas**: 589 en `tests/support/types`, 33 de FreezeThaw, 42 de PerformanceCounter, 32 de Workers y 38 de Metadata. Las ejecuciones específicas repetidas durante la investigación no se suman.

- Collection: todos los 61 métodos se ejercitaron con instrumentación de llamadas; ejemplos independientes en ES/EN, 20 comprobaciones adicionales de excepciones y seis variantes de propiedad/rutas/métodos de clase.
- Stringable: los 148 métodos tienen ejemplos; se ejecutaron 150 bloques independientes y dos métodos de componentes por idioma. El fixture externo utilizó el Encrypter real y sustituyó únicamente la resolución de la fachada para comprobar el flujo sin aplicación completa.
- DotDict, Sentinel, StdClass y FreezeThaw: 94 bloques ejecutados entre ambos idiomas, incluidos seis bloques de inyección.
- Workers, PerformanceCounter y Metadata: revisión independiente, ejecución de bloques y cinco acciones de controlador por idioma mediante `make`/`call`; registro de ambos contratos en una aplicación aislada y comprobación de instancias transitorias distintas.

Solo se modifica documentación, navegación y sus validadores. No se modifica el framework ni se alteran los cambios previos de la sección Pruebas.

## Validación final del sitio

- **484 bloques ejecutables** comprobados entre las nueve guías ES/EN; las firmas de referencia sin cuerpo funcional se verifican aparte. Collection ejecuta los 61 métodos y protocolos; Stringable conserva un ejemplo por cada uno de sus 148 métodos.
- **24 pruebas del sitio** correctas, incluidos orden de grupos, metadatos localizados, destino único de cada página y rechazo de configuraciones de navegación inválidas.
- Analizador general: **4.932 bloques Python, 284 JSON, 82 JavaScript y 4.058 importaciones nativas**, sin errores.
- `npm run build` y postbuild completados con código 0: **442 páginas canónicas renderizadas**, 219 manuales por idioma y **3.734 enlaces internos** comprobados, además de traducciones, fragmentos, redirecciones, sitemap y buscador.
- Revisión en navegador real: nueve guías ES a 390 px sin desbordamiento horizontal de página, un solo enlace activo y desplazamiento local de tablas. Los ocho enlaces Helpers y el enlace Metadata están presentes en sus grupos móviles. Collection ES y Stringable EN también se verificaron a 1.440 px; los 61 y 148 anchors respectivos están renderizados.
- Captura final local: `C:/Users/runate/AppData/Local/Temp/orionis-utilities-20261023.png`. Se mantiene el servidor en `http://localhost:4321` y la página Collection abierta.

El primer postbuild detectó el enlace de colas de Workers con un destino incorrecto. Se corrigió contra el catálogo real (`/asynchronous/queues`) y se repitió la construcción completa. La validación final no tiene enlaces pendientes. `git diff --check` no informa errores y el repositorio del framework permanece sin modificaciones.

## Repetir comprobaciones

```shell
python -B scripts/audit-utilities-source.py --framework-root ../framework
node scripts/validate-utilities-coverage.mjs
npm run docs:test
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```
