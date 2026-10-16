---
title: "Fundamentos de Orionis"
description: "Construye tu aplicación a partir del esqueleto oficial y añade las funciones que necesite tu proyecto. Para empezar a desarrollar, no necesitas implementar Application, un…"
editUrl: true
lastUpdated: false
---

Construye tu aplicación a partir del esqueleto oficial y añade las funciones que necesite tu proyecto. Para empezar a desarrollar, no necesitas implementar `Application`, un kernel ni un contenedor: el archivo generado `bootstrap/app.py` conecta esos componentes.

## Tu primera sesión de desarrollo

1. [Instala y crea un proyecto](/es/getting-started/installation): prepara uv y Git, elige un stack y crea el entorno de la aplicación.
2. [Arranca la aplicación](/es/getting-started/getting-started): ejecuta el servidor desde la raíz del proyecto y abre la URL indicada en consola.
3. [Configura la aplicación](/es/getting-started/configuration): utiliza `.env` para los valores de cada entorno y `config/` para los ajustes tipados.
4. [Añade tu primera ruta HTTP](/es/http/routing) y elige entre [plantillas](/es/services/views) y una API JSON.
5. [Escribe y ejecuta una prueba](/es/testing/writing-and-running-tests) antes de incorporar persistencia, autenticación, trabajos en segundo plano, Realtime o MCP.

Los comandos de las guías de aplicación usan `uv run python -B reactor ...` desde la raíz del proyecto generado. Esta invocación selecciona el entorno de ese proyecto. La invocación independiente `uvx --from orionis-installer ...` sirve para crear un proyecto nuevo.

## Descripción general

`Application` extiende el `Container` de inyección y es el objeto exportado desde `orionis`. Coordina bootstrap, sirve como entrada ASGI/RSGI, despacha CLI, guarda configuración y rutas, carga providers y posee el ciclo de vida.

Foundation también define entidades congeladas para cada subsistema, metadata core inmutable, el servicio de rutas `Directory`, enums y presentación de startup/shutdown. Las aplicaciones lo configuran en `bootstrap/app.py`, llaman `create()` y dejan que servidor HTTP o Reactor dirijan el runtime.

## Requisitos

- Python 3.14 o posterior; la construcción rechaza intérpretes anteriores.
- Raíz de aplicación como `str` o `pathlib.Path`.
- Módulos de configuración dataclass congelados válidos bajo `config`.
- Archivos de rutas existentes y con la fachada requerida al registrarlos.
- Un event loop por worker; el estado mutable no está diseñado para compartirse entre loops o hilos.

## Recorrido del módulo

- [Arquitectura y ciclo de vida de la aplicación](/es/getting-started/architecture-and-lifecycle)
- [Ciclo de vida y recursos de aplicación](/es/getting-started/application-lifecycle)
- [Configuración tipada y valores en ejecución](/es/getting-started/configuration)
- [Despliegue, diagnóstico y referencia de Application](/es/getting-started/deployment-and-reference)
- [Crear y arrancar una aplicación](/es/getting-started/getting-started)
- [Directorios y caché de arranque](/es/getting-started/paths-and-caching)

Continúa por: [environment](/es/architecture/environment) · [container](/es/architecture/service-container) · [http](/es/http) · [console](/es/console).


- [Instalación y primer proyecto](/es/getting-started/installation)

