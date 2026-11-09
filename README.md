<p align="center">
  <a href="https://orionis-framework.com/">
    <img src="public/favicon.svg" alt="Orionis Framework logo" width="140" height="140" />
  </a>
</p>

<h1 align="center">Orionis Framework Documentation</h1>

<p align="center">
  Official guides, examples and reference for building with Orionis Framework.
</p>

<p align="center">
  <a href="https://github.com/orionis-framework/docs/actions/workflows/deploy.yml"><img src="https://github.com/orionis-framework/docs/actions/workflows/deploy.yml/badge.svg?branch=master" alt="Documentation deployment" /></a>
  <a href="LICENSE.txt"><img src="https://img.shields.io/badge/license-MIT-16803d?style=flat-square" alt="MIT license" /></a>
</p>

<p align="center">
  <a href="https://docs.orionis-framework.com/en/getting-started">English documentation</a> &bull;
  <a href="https://docs.orionis-framework.com/es/getting-started">Spanish documentation</a> &bull;
  <a href="https://api.orionis-framework.com/">API reference</a> &bull;
  <a href="https://orionis-framework.com/">Website</a>
</p>

This repository maintains the **official documentation** for [Orionis Framework](https://github.com/orionis-framework/framework), an async-first, full-stack Python framework for web applications, APIs and real-time services.

Published at [docs.orionis-framework.com](https://docs.orionis-framework.com/) in English and Spanish, the manual covers installation, HTTP, realtime, MCP, the ORM, security, application services, testing and deployment. The site is built with **Astro** and **Starlight**.

The [API reference](https://api.orionis-framework.com/) is generated separately from the framework's Python docstrings.

## Local development

Use **Node.js 22** and **npm**, matching the deployment environment. Install dependencies from the committed lockfile:

```bash
git clone https://github.com/orionis-framework/docs.git
cd docs
npm ci
npm run dev
```

Open the local URL printed by Astro. Edit the Markdown guides in `src/content/docs/en/` and `src/content/docs/es/` to update the manual.

## Contributing

Corrections, clearer examples and translation improvements are welcome. Start with the [contribution guide](https://docs.orionis-framework.com/en/contribute/guide).

1. Keep the English and Spanish guides synchronized, including API signatures, examples and links.
2. When adding or moving a page, update the [page catalog](config/documentation-menu.json) and [navigation](config/documentation-navigation.json). Preserve existing page IDs and keep each page in a single navigation group.
3. Match frontmatter titles to the catalog, keep `editUrl: true`, and use absolute documentation paths with the appropriate language prefix, such as `/en/http/routing`.
4. Run the checks below and preview your changes on desktop and mobile before opening a pull request.

## Checks and preview

| Command | Purpose |
| --- | --- |
| `npm run docs:test` | Test the catalog, navigation, translations and contributor data. |
| `npm run docs:validate` | Validate source pages, titles, routes, internal links and heading fragments. |
| `npm run build` | Generate the static site and validate the rendered HTML, links, translations, sitemap and search index. |
| `npm run preview` | Serve the generated site locally for review. |

## Repository layout

| Path | Contents |
| --- | --- |
| [src/content/docs/](src/content/docs/) | English and Spanish Markdown guides. |
| [src/pages/](src/pages/) | Custom Astro pages, including contributor listings. |
| [src/components/](src/components/), [src/plugins/](src/plugins/), [src/styles/](src/styles/), [src/utils/](src/utils/) | Shared components, Markdown processing, styles and site utilities. |
| [config/](config/) | Page catalog and navigation order. |
| [public/](public/) | Logo, images, local fonts, scripts and crawler configuration. |
| [scripts/](scripts/) | Tests and documentation validation tools. |

## Deployment

The [GitHub Actions workflow](.github/workflows/deploy.yml) runs the tests, builds and validates the site, and publishes it to **GitHub Pages** when changes are pushed to `master`.

Generated output (`dist/`, `.astro/`), installed dependencies (`node_modules/`) and local environment files are excluded from version control through [.gitignore](.gitignore).

## License

Released under the [MIT license](LICENSE.txt). Bundled font licenses are available in [public/fonts/](public/fonts/).
