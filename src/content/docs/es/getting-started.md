---
title: "Fundamentos de Orionis"
description: "Instala Orionis Framework 1.9.0, ejecuta tu primer endpoint HTTP y consulta las guías de configuración, servicios y pruebas."
editUrl: true
lastUpdated: false
---

Construye tu aplicación a partir del esqueleto oficial y añade las funciones que necesite tu proyecto. Para empezar a desarrollar, no necesitas implementar `Application`, un kernel ni un contenedor: el archivo generado `bootstrap/app.py` conecta esos componentes.

Este manual cubre **Orionis Framework 1.9.0** y requiere Python 3.14 o posterior. Desde la raíz de la aplicación puedes comprobar qué versión ejecuta tu proyecto.

```bash
uv run python -c "from orionis.metadata import VERSION; print(VERSION)"
```

## Tu primera sesión de desarrollo

1. [Instala y crea un proyecto](/es/getting-started/installation): prepara uv y Git, elige un stack y crea el entorno de la aplicación.
2. [Arranca la aplicación](/es/getting-started/quick-start): ejecuta el servidor desde la raíz del proyecto y abre la URL indicada en consola.
3. [Configura la aplicación](/es/application/configuration): utiliza `.env` para los valores de cada entorno y `config/` para los ajustes tipados.
4. [Añade tu primera ruta HTTP](/es/http/routing) y elige entre [plantillas](/es/views) y una API JSON.
5. [Escribe y ejecuta una prueba](/es/testing/writing-and-running-tests) antes de incorporar persistencia, autenticación, trabajos en segundo plano, Realtime o MCP.

Los comandos de las guías de aplicación usan `uv run python -B reactor ...` desde la raíz del proyecto generado. Esta invocación selecciona el entorno de ese proyecto. La invocación independiente `uvx --from orionis-installer ...` sirve para crear un proyecto nuevo.

## Descripción general

`Application` extiende el `Container` de inyección y es el objeto exportado desde `orionis`. Coordina bootstrap, sirve como entrada ASGI/RSGI, despacha CLI, guarda configuración y rutas, carga providers y posee el ciclo de vida.

Foundation también define entidades congeladas para cada subsistema, metadata core inmutable, el servicio de rutas `Directory`, enums y presentación de startup/shutdown. Las aplicaciones lo configuran en `bootstrap/app.py`, llaman `create()` y dejan que servidor HTTP o Reactor dirijan el runtime.

<a id="requisitos"></a>

## Estructura del proyecto

El proyecto generado incluye la raíz de la aplicación, el módulo de arranque y los archivos de rutas. Orionis construye la configuración predeterminada y aplica las dataclasses congeladas que descubre en `config/`. Añade tu propia dataclass allí para [definir una sección de configuración](/es/application/configuration#configuration-own).

Un archivo de rutas registrado en `bootstrap/app.py` debe existir y puede estar vacío. Cuando añadas rutas, importa la fachada desde `orionis.support.facades`, como en el [ejemplo del primer controlador](/es/getting-started/quick-start).

## Recorrido del módulo

- [Referencia de API: clases, métodos y firmas](https://api.orionis-framework.com/)
- [Arquitectura y ciclo de vida de la aplicación](/es/getting-started/architecture-and-lifecycle)
- [Ciclo de vida y recursos de aplicación](/es/application/lifecycle)
- [Configuración tipada y valores en ejecución](/es/application/configuration)
- [Preparar un despliegue](/es/deployment)
- [Crear y arrancar una aplicación](/es/getting-started/quick-start)
- [Directorios y caché de arranque](/es/application/paths-and-caching)

Consulta también [variables de entorno](/es/environment), [inyección de dependencias](/es/application/container), [HTTP](/es/http) y [comandos de consola](/es/console).
