# Orionis Framework Documentation

Documentación de Orionis Framework en inglés y español, construida con Astro y Starlight. El sitio publica 115 páginas del manual por idioma y cuatro páginas de contribución: **234 páginas**, además de las redirecciones y el 404. Su dominio es https://docs.orionis-framework.com.

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

Los archivos en `src/content/docs/{en,es}/` son las fuentes definitivas del manual y las guías de contribución. Editar directamente el Markdown de cada idioma; la compilación no necesita otros repositorios ni una sincronización previa. La instalación documentada corresponde al instalador de Orionis y sus proyectos Blank, SSR, Slim API y Slim MCP.

Las páginas de colaboradores se mantienen en `src/pages/{en,es}/contribute/contributors.astro`. Comparten la consulta, paginación y caché de GitHub implementadas en `src/utils/contributors.ts`. Los errores de red permiten compilar con los datos disponibles o un estado sin estadísticas.

La configuración utilizada por el sitio está en cuatro archivos:

- `config/documentation-menu.json`: catálogo de páginas, IDs, títulos, etiquetas y rutas EN/ES. `kind` distingue documentos Markdown de páginas Astro.
- `config/documentation-navigation.json`: categorías, bloques de orientación y enlace externo a la referencia API. Cada ID del catálogo debe aparecer una sola vez en `pageIds`.
- `config/legacy-redirects.json`: equivalencias de rutas anteriores que siguen activas.
- `config/font-assets.json`: versión y hashes de las fuentes JetBrains Mono utilizadas por la validación.

Para añadir una guía, crear ambos Markdown, registrar un ID con sus rutas en el catálogo y ubicarlo en una categoría del menú. Las rutas de ambos idiomas deben compartir el sufijo después de `/en/` y `/es/`. Mantener los títulos del frontmatter iguales a los del catálogo, `editUrl: true` y enlaces internos absolutos con el idioma correspondiente.

El menú tiene categorías y enlaces, con iconos SVG locales. Sólo la categoría activa aparece desplegada al cargar una página. El filtro busca guías o categorías en el idioma actual e ignora las tildes. En móvil se despliega una categoría a la vez; las preferencias de tema e idioma están después de las guías. El botón del menú sincroniza su estado accesible, permite cerrar con Escape y conserva el foco dentro de la navegación abierta. Las traducciones se vinculan por ID. La entrada del manual incluye un mapa de capacidades; la referencia API y las opciones de contribución permanecen accesibles desde el menú.

Para revisar cambios de interfaz, usar la compilación con `npm run preview`: comprobar pantallas de 320, 375, 768, 799, 800, 1024, 1152 y 1440 px, además de orientación horizontal. Validar apertura y cierre del menú, acordeones, filtro con y sin resultados, botón Atrás, tema, idioma, búsqueda y tabla de contenidos. Las tablas y los bloques de código pueden desplazarse dentro de su propio contenedor; la página completa no debe desbordarse horizontalmente. Las tarjetas de capacidades y colaboradores se ajustan al ancho disponible después de descontar las barras laterales.

## Rastreo e indexación en ChatGPT

[`public/robots.txt`](public/robots.txt) permite todo el sitio a los rastreadores generales y declara permisos explícitos para:

- `OAI-SearchBot`: descubre contenido para los resultados de búsqueda de ChatGPT.
- `GPTBot`: rastrea contenido que podría utilizarse para entrenar modelos de OpenAI. Este permiso es independiente y no es necesario para aparecer en la búsqueda de ChatGPT.
- `ChatGPT-User`: puede visitar páginas por acciones de usuarios de ChatGPT o GPTs personalizados. No es un rastreador automático ni controla la inclusión en búsquedas; sus solicitudes pueden no seguir `robots.txt`.

Astro genera el contenido como HTML estático, legible sin ejecutar JavaScript. Las páginas publican sus URL canónicas, descripciones y enlaces de idioma. El sitemap se genera durante la compilación y se anuncia en https://docs.orionis-framework.com/robots.txt mediante https://docs.orionis-framework.com/sitemap-index.xml.

`npm run docs:validate` verifica los permisos explícitos y la URL del sitemap. `npm run build` también comprueba que se publique el mismo `robots.txt`, que las páginas tengan contenido estático sin metadatos `noindex`, `nofollow` o `none`, y que el índice de sitemaps apunte a los archivos publicados con todas las páginas canónicas. Los errores y las redirecciones no se tratan como páginas del manual indexables.

Después de desplegar, comprobar que `robots.txt`, los sitemaps y las páginas respondan públicamente por HTTPS. Si se añade un proxy, CDN o firewall, no bloquear los rangos oficiales de [OAI-SearchBot](https://openai.com/searchbot.json), [GPTBot](https://openai.com/gptbot.json) y [ChatGPT-User](https://openai.com/chatgpt-user.json); mantenerlos actualizados desde esas fuentes. Evitar autenticación, CAPTCHA y cabeceras `X-Robots-Tag: noindex` en el contenido público. Estas restricciones del alojamiento no se pueden controlar desde `robots.txt`.

Permitir el rastreo no garantiza indexación, posición ni citas en las respuestas. OpenAI indica que sus sistemas pueden tardar aproximadamente 24 horas en ajustar las reglas tras cambiar `robots.txt`; no es un plazo garantizado de indexación. `llms.txt` no figura como requisito en su [documentación oficial de rastreadores](https://developers.openai.com/api/docs/bots) y no sustituye a `robots.txt` ni al sitemap.

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
