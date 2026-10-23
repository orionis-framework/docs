---
title: "Crear y arrancar una aplicación"
description: "Completa la instalación, inicia el servidor de desarrollo y abre tu aplicación Orionis en el navegador."
editUrl: true
lastUpdated: false
---

## 1. Instalar el proyecto

Completa primero el [manual de instalación](/es/getting-started/installation) para crear tu proyecto de Orionis Framework. Una vez finalizado el proceso, continúa con los pasos siguientes.

## 2. Iniciar el servidor de desarrollo

Desde el directorio raíz del proyecto instalado, utiliza cualquiera de estas dos alternativas para iniciar el servidor:

**Opción 1: Comando directo de Orionis**

```bash
orionis serve
```

**Opción 2: Utilizando uv y Reactor**

```bash
uv run python -B reactor serve
```

## 3. Acceder a la aplicación

Abre tu navegador y accede a la URL local que aparece en la consola. Por defecto, la dirección es [http://localhost:8000](http://localhost:8000). Si la consola muestra una dirección diferente, utiliza esa dirección.

:::note[Migraciones y seeders]
Las migraciones preparan la estructura de la base de datos y los seeders cargan datos iniciales. Pueden necesitarse antes de utilizar funciones que dependan de esas tablas o datos. Consulta [migraciones y datos iniciales](/es/getting-started/installation#migraciones-y-datos-iniciales) en el manual de instalación.
:::
