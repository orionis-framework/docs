# Auditoría de documentación de Entorno

Fecha: 2026-10-23. Alcance: documentación, menú y verificadores; sin cambios en el framework.

## Organización y alcance

La categoría independiente **Entorno / Environment** contiene cuatro guías por idioma, distribuidas en dos subgrupos:

- Variables y configuración: introducción; variables y tipos.
- Bootstrap y referencia: persistencia JSON; API de Env y preparación de configuración.

Se conservan las tres URLs anteriores de `architecture/environment` y se añade `compiled-configuration`. Las páginas dejan de pertenecer a Aplicación y contenedor. Las guías generales de configuración y directorios enlazan a Entorno; se retiraron sus instrucciones duplicadas y el ejemplo que utilizaba Env desde un programa fuera de configuración.

El uso exclusivo desde archivos de configuración es un requisito de esta documentación. No se afirma que exista una comprobación del framework que rechace técnicamente cualquier llamada desde runtime. Los componentes de aplicación reciben los ajustes resueltos mediante `IApplication.config()`.

## Fuente de verdad y cobertura

Se revisaron los 17 archivos Python de `orionis/environment`, contratos, exportaciones, validadores, conversor, singleton y generador de claves; además del bootstrap, configuración App, Application, serialización y caché de archivos, generador de claves CLI, limpieza de optimización y congelación de configuración.

El inventario público `public/downloads/environment-api-inventory.json` relaciona **46 declaraciones propias** con sus guías y anclas en ambos idiomas:

| Superficie | Cobertura |
| --- | --- |
| Env e IEnv | Cinco métodos: get, set, unset, all y reload. |
| Helper env | Firma, defaults y equivalencia con Env.get. |
| DotEnv | Constructor, selección del archivo, singleton y cinco operaciones. |
| EnvironmentCaster e IEnvironmentCaster | Constructor, get, to, supportedTypes, parseTyped y OPTIONS; contrato get/to. |
| EnvironmentValueType | Diez miembros, con ejemplos individuales de lectura y serialización. |
| ValidateKeyName y ValidateTypes | Alias de función e instancia invocable, parámetros y límites de validación. |
| SecureKeyGenerator | generate y KEY_SIZES, cuatro algoritmos y persistencia separada de la generación. |

El conteo es léxico: contratos e implementaciones se cuentan por separado. Incluye siete clases, 22 métodos, dos constructores, dos constantes, diez miembros de enum, una función y dos callables públicos. Excluye helpers privados, infraestructura de exportación diferida, API heredada y métodos generados. No implica documentar toda la API de Application o Cache dentro de Entorno.

`scripts/audit-environment-source.py` reconstruye el inventario desde AST, compara firmas y hashes normalizados a LF y verifica los archivos auxiliares de integración. `scripts/validate-environment-coverage.mjs` comprueba que cada declaración tenga un destino publicado, sus anclas en ambos idiomas y una única ubicación en el menú. Está integrado en la validación del sitio.

## Precisiones incorporadas

- La primera lectura selecciona el archivo desde el directorio de trabajo y carga con precedencia del archivo. No hay selección de archivo por cada consulta de la fachada.
- get consulta el proceso; all devuelve el snapshot del archivo. only_os no actualiza ese snapshot.
- Los defaults se aplican solo a claves ausentes, no a valores vacíos, nulos ni errores de conversión.
- Los prefijos de get requieren el formato exacto en minúsculas. El conversor explícito tiene reglas de normalización diferentes.
- El camino rápido bool de get/parseTyped devuelve False para cualquier palabra no afirmativa. La instancia del conversor valida también las palabras negativas.
- path devuelve texto normalizado, no un Path; su lectura y su serialización tienen distinto tratamiento de rutas relativas. Base64 puede producir texto o bytes y no cifra.
- set tiene una anotación más estrecha que algunos casos aceptados por su serializador. La validación con hint y la serialización sin hint tienen límites diferentes. No se promete una transacción entre archivo y proceso.
- reload no borra del proceso claves retiradas manualmente, no cambia el archivo seleccionado y no reconstruye configuración ni servicios existentes.
- compile recibe path e invalidation_paths; no tiene env=True. Los artefactos config, commands y routes son JSON sin extensión. No hay un env.json ni un volcado automático de todo el entorno.
- La instantánea incluye configuración resuelta y metadatos del bootstrap. Su hash de invalidación utiliza rutas, tamaño y mtime; .env debe vigilarse explícitamente y existir al registrar la compilación.
- La representación JSON preserva tipos mediante etiquetas, mientras que la congelación y descongelación de configuración afectan sus contenedores durante el acceso runtime, incluso sin persistencia.
- Se explican el alcance real de optimize:clear y el reinicio de procesos; no se promete recarga automática de configuración en ejecución.

## Evidencia de ejecución

- Suite nativa Environment: 210 pruebas correctas.
- Configuración de entorno Foundation: 26 pruebas correctas.
- FileBasedCache: 23 pruebas; configuración Application: 15; optimize:clear: tres. Total relacionado: **277 pruebas nativas correctas**.
- Arnés aislado del componente: 60 comprobaciones de conversiones, defaults, snapshot/proceso, recarga, Base64 y claves.
- Referencia de operaciones: siete bloques por idioma ejecutados en temporales, AST equivalente y 25 comprobaciones correctas.
- Guías de uso: diez tipos y diez serializaciones comprobadas, 14 bloques Python exactos ejecutados y carga real del config/reports.py documentado mediante Application.
- Integración en tres procesos temporales: arranque frío con límite 100; reutilización de JSON sin importar otra vez config; modificación del .env vigilado y reconstrucción con límite 200. Se comprobaron metadatos, JSON sin extensión, exclusión de una variable no utilizada y lectura de colecciones/bytes en runtime.

## Validación del sitio

- 19 pruebas de documentación y navegación correctas.
- Ejemplos del sitio: 4.242 bloques Python, 276 JSON y 82 JavaScript comprobados; 3.338 imports nativos válidos y ningún error.
- Inventario independiente y auditor reconstruido coinciden en las 46 identidades públicas; 28 archivos de implementación e integración con checksum.
- Construcción estática: 401 páginas generadas. La validación de fuentes comprueba 24 categorías, 198 páginas de manual por idioma, dos recursos de contribución por idioma y 3.220 enlaces internos. La comprobación posterior verificó 400 páginas renderizadas, traducciones, fragmentos, sitemap y búsqueda sin errores.
- Navegador: ocho guías ES/EN revisadas a 390 px sin desbordamiento de página y con una sola selección activa. La categoría Entorno contiene sus cuatro enlaces y Aplicación no contiene ninguno de ellos. Apertura exclusiva de subgrupos móvil y scroll interno de tablas comprobados. Diagramas de introducción y bootstrap renderizados como SVG a 1440 px, sin errores. Servidor Astro activo en http://localhost:4321/es/architecture/environment.

Los archivos de pruebas y .env utilizados son temporales. No se modificó el .env real, no se conectaron servicios externos y las invocaciones Python utilizaron `-B`. Los intentos de ejecutar pruebas directamente sin el arranque requerido por su TestCase se sustituyeron por el runner nativo Reactor.

## Repetir las comprobaciones

```shell
python -B scripts/audit-environment-source.py --framework-root ../framework
node scripts/validate-environment-coverage.mjs
npm run docs:test
npm run docs:validate
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor requiere el checkout del framework y Python compatible con su sintaxis. La validación del sitio utiliza el inventario publicado y no necesita ese checkout en CI.
