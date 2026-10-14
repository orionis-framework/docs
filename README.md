# Orionis Framework Documentation

Documentación de Orionis Framework en inglés y español, construida con Astro y Starlight. El sitio publica 114 páginas del manual por idioma y cuatro páginas de contribución: **232 páginas**, además de las redirecciones y el 404. Su dominio es https://docs.orionis-framework.com.

## Desarrollo

Usar Node.js 22 y las versiones fijadas en `package-lock.json`:

```bash
npm ci
npm run dev
```

Para comprobar y compilar:

```bash
npm run docs:test
npm run docs:validate
npm run build
npm run preview
```

`build` ejecuta automáticamente la validación de la salida: páginas, navegación, enlaces, traducciones, redirecciones, búsqueda, sitemap y fuentes locales. `preview` sirve `dist/`. GitHub Actions compila y publica en GitHub Pages mediante `.github/workflows/deploy.yml`.

## Editar documentación

Los archivos en `src/content/docs/{en,es}/` son las fuentes definitivas del manual y las guías de contribución. Editar directamente el Markdown de cada idioma; la compilación no necesita otros repositorios ni una sincronización previa. La instalación documentada corresponde al instalador de Orionis y sus proyectos Blank y SSR.

Las páginas de colaboradores se mantienen en `src/pages/{en,es}/contribute/contributors.astro`. Comparten la consulta, paginación y caché de GitHub implementadas en `src/utils/contributors.ts`. Los errores de red permiten compilar con los datos disponibles o un estado sin estadísticas.

La configuración utilizada por el sitio está en cuatro archivos:

- `config/documentation-menu.json`: catálogo de páginas, IDs, títulos, etiquetas y rutas EN/ES. `kind` distingue documentos Markdown de páginas Astro.
- `config/documentation-navigation.json`: categorías, bloques de orientación y enlace externo a la referencia API. Cada ID del catálogo debe aparecer una sola vez en `pageIds`.
- `config/legacy-redirects.json`: equivalencias de rutas anteriores que siguen activas.
- `config/font-assets.json`: versión y hashes de las fuentes JetBrains Mono utilizadas por la validación.

Para añadir una guía, crear ambos Markdown, registrar un ID con sus rutas en el catálogo y ubicarlo en una categoría del menú. Las rutas de ambos idiomas deben compartir el sufijo después de `/en/` y `/es/`. Mantener los títulos del frontmatter iguales a los del catálogo, `editUrl: true` y enlaces internos absolutos con el idioma correspondiente.

El menú tiene categorías y enlaces, con iconos SVG locales. Sólo la categoría activa aparece desplegada al cargar una página. Las traducciones se vinculan por ID. La entrada del manual incluye un mapa de capacidades; la referencia API y las opciones de contribución permanecen accesibles desde el menú.

## Tipografía y ejemplos

Todo el código utiliza **JetBrains Mono local** en pesos 400, 600 y 700, normales e itálicos. El texto general usa Titillium Web local. Los archivos y sus licencias están en `public/fonts/`; las declaraciones CSS están en `src/styles/custom.css`. La validación comprueba las fuentes de código y rechaza cargas desde CDN.

Para comprobar la sintaxis de ejemplos, usar Python 3.14 o posterior:

```bash
npm run docs:examples
```

Opcionalmente, contrastar los imports de Orionis con un checkout del framework:

```bash
node scripts/check-code-examples.mjs --framework-root ../framework
```

Se puede seleccionar el intérprete con `--python /ruta/al/python`. Esta comprobación analiza Python, JSON, TOML y JavaScript; no ejecuta los ejemplos. Su resultado se muestra en consola. Las pruebas de comportamiento de una aplicación necesitan sus servicios reales.

## Licencia

MIT. Consultar `LICENSE.txt` y las licencias de las fuentes en `public/fonts/`.
