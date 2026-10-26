# Orionis Framework Documentation

Documentación oficial de Orionis Framework en inglés y español, construida con Astro y Starlight. Se publica en [docs.orionis-framework.com](https://docs.orionis-framework.com).

## Desarrollo local

Usar Node.js 22 y las dependencias fijadas en `package-lock.json`:

```bash
npm ci
npm run dev
```

Para servir el sitio en una dirección y un puerto específicos:

```bash
npm run dev -- --host 127.0.0.1 --port 4321
```

## Estructura del proyecto

| Ubicación | Responsabilidad |
|---|---|
| `src/content/docs/{en,es}/` | Fuentes Markdown del manual y las guías de contribución. |
| `src/pages/{en,es}/contribute/` | Páginas Astro de colaboradores. |
| `src/components/` | Navegación, cabecera, idioma, diagramas y componentes del sitio. |
| `src/plugins/` | Procesamiento de diagramas Mermaid y tablas adaptables. |
| `src/styles/` | Estilos compartidos. |
| `src/utils/` | Catálogo y navegación, colaboradores y metadatos SEO. |
| `config/` | Catálogo de páginas y orden del menú. |
| `public/` | Recursos del sitio: fuentes, licencias, imágenes, JavaScript y robots. |
| `scripts/` | Pruebas del sitio y validación de rutas, enlaces y HTML. |
| `.github/workflows/` | Compilación y despliegue en GitHub Pages. |

`dist/`, `.astro/` y `node_modules/` son directorios generados y no se versionan. La configuración local de `.env` tampoco se publica.

## Contenido, rutas y navegación

Los Markdown son la fuente definitiva del contenido. Cada ruta del manual corresponde a un archivo en `src/content/docs/{idioma}/{ruta}.md`; las páginas Astro se definen en `src/pages/`. Sus carpetas y rutas canónicas siguen la organización temática del menú. El orden visible se define en la navegación, sin prefijos numéricos en los nombres de archivo.

- `config/documentation-menu.json` contiene el catálogo: ID estable, tipo de página, título, etiqueta del menú y URL por idioma.
- `config/documentation-navigation.json` define los bloques, categorías, grupos y el orden de sus páginas. Cada ID del catálogo debe tener una única ubicación principal.

Para añadir o reorganizar una guía:

1. Crear o mover ambos Markdown en `src/content/docs/en/` y `src/content/docs/es/`, con la misma ruta después del idioma.
2. Registrar o actualizar sus rutas, títulos y etiquetas en el catálogo. Conservar el ID de una página existente.
3. Ubicar su ID en el grupo correspondiente de la navegación y mantener coincidentes el orden del grupo, el de la categoría y el del catálogo. El primer segmento de la URL debe coincidir con el ID de su categoría.
4. Mantener el título del frontmatter igual al del catálogo, `editUrl: true` y enlaces internos absolutos en el idioma del documento.
5. Al cambiar una ruta, actualizar sus archivos, entradas del catálogo, enlaces internos y correspondencias entre idiomas.

Astro utiliza rutas sin barra final. Los enlaces de edición apuntan al archivo canónico, las traducciones se relacionan mediante el ID y el sitemap contiene las páginas canónicas vigentes. Los accesos `/` y `/en` llevan a `/en/getting-started`; `/es` lleva a `/es/getting-started`.

Las páginas de colaboradores comparten consulta, paginación y caché de GitHub en `src/utils/contributors.ts`. Los errores de red permiten compilar con los datos disponibles o mostrar un estado sin estadísticas.

## Comprobaciones del sitio

```bash
npm run docs:test
npm run docs:validate
npm run build
npm run preview
```

| Comando | Qué comprueba |
|---|---|
| `docs:test` | Pruebas de catálogo, navegación, traducciones y colaboradores. |
| `docs:validate` | Catálogo, archivos, títulos, navegación, enlaces, fragmentos, accesos raíz y permisos de rastreo. |
| `build` | Genera el sitio y ejecuta automáticamente `postbuild` para validar su salida HTML, enlaces, traducciones, sitemap y búsqueda. |
| `preview` | Sirve la compilación de `dist/` para revisar el resultado publicado. |

Las cifras de páginas y enlaces se calculan a partir de los archivos actuales y se muestran en los resultados de validación.

## Revisión visual

Usar `npm run preview` y comprobar anchos de 320, 375, 768, 799, 800, 1024, 1152 y 1440 px, además de orientación horizontal. Revisar apertura y cierre del menú, acordeones, filtro, botón Atrás, tema, idioma, búsqueda, tabla de contenidos y enlaces de edición.

Sólo los grupos que contienen la página activa deben comenzar abiertos. En móvil, revisar el cierre con Escape y el foco dentro de la navegación. Las tablas, diagramas y bloques de código pueden desplazarse en su propio contenedor; la página completa no debe desbordarse horizontalmente.

## Publicación, rastreo y recursos

GitHub Actions ejecuta las pruebas de estructura, compila, valida el HTML generado y publica en GitHub Pages al recibir cambios en `master`, según `.github/workflows/deploy.yml`. El HTML estático incluye contenido legible sin JavaScript, URL canónicas, descripciones y enlaces de idioma. El sitemap incluye las páginas canónicas y se anuncia desde `public/robots.txt`.

`robots.txt` permite el sitio a rastreadores generales, `OAI-SearchBot`, `GPTBot` y `ChatGPT-User`. Estos permisos se verifican durante la validación; permitir el rastreo no garantiza indexación ni citas. Las restricciones de autenticación, CDN o firewall deben revisarse en el alojamiento. Consultar la [documentación oficial de rastreadores de OpenAI](https://developers.openai.com/api/docs/bots) al modificar esta política.

El código usa JetBrains Mono local y el texto usa Titillium Web local. Los archivos y licencias se conservan en `public/fonts/`, y las declaraciones CSS en `src/styles/custom.css`.

## Licencia

MIT. Consultar `LICENSE.txt` y las licencias de las fuentes en `public/fonts/`.
