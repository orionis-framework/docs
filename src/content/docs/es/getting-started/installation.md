---
title: "Instalación y primer proyecto"
description: "Crea un proyecto Orionis con el instalador oficial: requisitos, asistente, opciones, stacks, instalación manual y primer arranque."
editUrl: true
lastUpdated: false
---

`orionis-installer` crea aplicaciones a partir de los esqueletos oficiales de Orionis Framework. El asistente permite elegir un stack, definir los metadatos del proyecto y seleccionar los drivers de almacenamiento y base de datos. Después descarga la plantilla, configura sus archivos e instala las dependencias en una `.venv` propia, con su archivo `uv.lock`.

El paquete del instalador se llama **`orionis-installer`** y su ejecutable es **`orionis`**. La dependencia de Orionis que utiliza la aplicación la define cada stack en su `pyproject.toml`; el instalador conserva esa restricción y uv resuelve las dependencias compatibles.

## Requisitos previos

- **[uv](https://docs.astral.sh/uv/getting-started/installation/)** y **[Git](https://git-scm.com/downloads)** disponibles en `PATH`. Git descarga el esqueleto incluso si eliges `--no-git` para omitir la inicialización del nuevo repositorio.
- **Python 3.14 o superior para ejecutar el instalador.** Para la aplicación, el instalador busca y verifica específicamente **Python estable 3.14.x**. Si falta, intenta obtenerlo mediante uv, respetando las políticas de descarga y conectividad configuradas. No necesitas activar un entorno virtual para usar el instalador.
- **Una terminal interactiva** para utilizar el asistente. En scripts, CI o terminales sin entrada y salida TTY, utiliza `--no-interaction`.
- **Un directorio padre existente y con permisos de escritura.** El directorio de destino debe ser nuevo: se rechaza incluso si ya existe y está vacío.
- **Conectividad con GitHub y el índice de paquetes**, además de los servidores de descarga de Python si ese intérprete aún no está instalado.

El instalador contempla Windows, macOS y Linux; su configuración de CI incluye los tres sistemas. En Windows, uv y Git deben resolverse como ejecutables nativos, no como envoltorios `.cmd` o `.bat`. Los comandos de creación y de Reactor utilizados aquí son comunes a los tres sistemas; las diferencias al copiar archivos se indican en la instalación manual.

Visual Studio Code es opcional. Para que el instalador lo abra al finalizar, su lanzador `code` debe estar disponible en `PATH`. Los stacks no requieren Node.js, npm ni una compilación de frontend para su arranque inicial.

## Instalación y ejecución

### Ejecutar con uvx

Esta invocación identifica explícitamente el paquete del instalador y selecciona Python para ejecutarlo:

```bash
uvx --python 3.14 --from orionis-installer orionis new blog
```

El asistente creará `blog` dentro del directorio actual. Si omites `blog`, también te preguntará el nombre del proyecto. Puedes ejecutar `uvx --from orionis-installer orionis new` cuando uv ya seleccione un intérprete compatible.

Consulta la ayuda general, la ayuda de creación y la identidad del ejecutable con:

```bash
uvx --python 3.14 --from orionis-installer orionis --help
uvx --python 3.14 --from orionis-installer orionis new --help
uvx --python 3.14 --from orionis-installer orionis --version
```

### Instalar como herramienta de uv

Si prefieres disponer del comando en tu terminal:

```bash
uv tool install --python 3.14 orionis-installer
orionis --version
orionis new blog
```

Comprueba que `orionis --version` identifica a `orionis-installer`. El framework también puede proporcionar un ejecutable llamado `orionis`; utiliza la forma explícita con `uvx --from orionis-installer` para crear proyectos y los comandos de Reactor desde la raíz de cada aplicación.

## Proceso de instalación paso a paso

El asistente se presenta en inglés. Utiliza las flechas para seleccionar opciones y Enter para aceptarlas; Ctrl+C cancela el proceso. Una opción proporcionada en la línea de comandos omite su pregunta correspondiente.

### 1. Comprobar herramientas y Python

Antes de preguntar por el proyecto, el instalador comprueba que uv y Git puedan ejecutarse y localiza Python estable 3.14.x fuera del entorno de la aplicación. Si necesita descargarlo, informa antes de intentarlo. Esta fase todavía no descarga el stack.

### 2. Definir la aplicación

En la sección **Application**, el asistente solicita, en este orden:

1. **Stack:** Blank, SSR, Slim API o Slim MCP. Blank es el predeterminado; [compara los stacks](#stacks-disponibles) antes de elegir.
2. **Nombre:** `orionis-app` por defecto; `new blog` ya proporciona este valor.
3. **Descripción:** `A modern application built with Orionis Framework.` por defecto.
4. **Nombre y correo del autor:** opcionales; puedes dejarlos vacíos.

El nombre admite entre 1 y 100 caracteres ASCII: letras, dígitos, puntos, guiones y guiones bajos, con una letra o dígito en ambos extremos. No admite `..`, separadores de ruta ni nombres reservados de Windows. Las descripciones y los nombres de autor admiten Unicode sin caracteres de control; el correo se valida si lo proporcionas.

La ruta no se pregunta durante el asistente. Para elegir otro destino, proporciona `--path`: representa la carpeta final del proyecto, no su directorio padre.

### 3. Seleccionar los servicios

En **Services**, primero eliges el almacenamiento: local, Amazon S3, Azure Blob Storage, Google Cloud Storage o todos los drivers cloud. Si seleccionas `all`, una pregunta adicional permite elegir el disco activo, con `local` por defecto.

Después eliges la base de datos: SQLite, MySQL, PostgreSQL, Oracle, SQL Server, Amazon Redshift o todos los drivers. SQLite es el valor predeterminado. Con `all`, eliges también una conexión activa, con `sqlite` por defecto.

La selección determina las dependencias que se instalarán y los valores de `FILESYSTEM_DISK` y `DB_CONNECTION`. Elegir todos los drivers no activa simultáneamente todos los servicios. Las credenciales y la infraestructura externa se preparan por separado.

### 4. Revisar y confirmar

El instalador valida el destino y muestra el plan: nombre, ruta absoluta, metadatos, stack, repositorio, rama, Python, drivers activos y extras de Orionis.

La confirmación de creación propone **Yes**. Si eliges **No**, termina con código `0` sin descargar el esqueleto. Antes de confirmar, el instalador puede haber descargado Python durante la comprobación de requisitos.

### 5. Descargar, configurar y verificar

Tras confirmar, se ejecutan automáticamente estas acciones:

1. Clonar únicamente la rama del stack elegido en un directorio temporal junto al destino, verificar la rama y su revisión y retirar el `.git` del esqueleto descargado.
2. Actualizar nombre, descripción y autor en `pyproject.toml`; combinar los extras seleccionados con los del stack, conservando su restricción de Orionis, versión de aplicación y grupos de dependencias. Mantener `tool.uv.package = false` y escribir `.python-version` con el Python objetivo.
3. Copiar `.env.example` a `.env`, conservar el ejemplo y configurar el nombre de aplicación, disco y conexión activos. También se admite `env.example`. Para SQLite se prepara el directorio padre del archivo de base de datos; no se crea ni se trunca el archivo en esta fase.
4. Ajustar `.gitignore` para excluir `.env`, `.venv`, archivos SQLite y datos locales de ejecución, manteniendo `uv.lock` versionable.
5. Colocar los archivos en el destino final y ejecutar allí `uv sync --python 3.14`. La `.venv` se crea directamente dentro del proyecto, junto con `uv.lock`.
6. Verificar el intérprete, Orionis, los extras y dependencias instalados, el lockfile y la configuración efectiva. Generar `APP_KEY` mediante el framework si falta; una clave existente se conserva.

El instalador mantiene los archivos y las rutas propias de cada stack. La creación no inicia el servidor de la aplicación.

### 6. Elegir las operaciones finales

Cuando la creación termina, el asistente ofrece estas acciones, en orden:

| Acción | Selección propuesta | Resultado al aceptar |
| --- | --- | --- |
| Inicializar Git | Yes | Ejecutar `git init` en el proyecto, sin commit, remoto ni push. |
| Ejecutar migraciones | No | Verificar la conexión y ejecutar `reactor migrate --seed` con el Python del proyecto. Incluye seeders; revisa [las consideraciones de migración](#migraciones-y-datos-iniciales). |
| Abrir Visual Studio Code | Yes | Abrir la carpeta en una nueva ventana del editor. |

Si solicitas migraciones con una base externa incompleta, el modo interactivo ofrece configurar la conexión, con **No** por defecto. Si aceptas, pide host, puerto, base de datos —servicio en Oracle—, usuario y contraseña enmascarada. No crea el servidor ni la base externa. En modo no interactivo no solicita credenciales y esa operación falla si faltan datos.

El resumen final distingue la creación, Git, migraciones y editor, e indica advertencias y comandos para continuar.

## Parámetros y opciones disponibles

Para crear una aplicación, el subcomando es `new`. El nombre y todas sus opciones son opcionales. En modo interactivo se preguntan los metadatos y servicios omitidos y se ofrecen las acciones finales; las demás opciones utilizan sus valores predeterminados. Con `--no-interaction`, se aplican los valores predeterminados de la tabla.

### Argumento y opciones de new

| Parámetro | Propósito | Obligatorio | Predeterminado | Valores permitidos |
| --- | --- | --- | --- | --- |
| `NAME` | Nombre de aplicación y carpeta si no se indica `--path`. | No | `orionis-app` | Nombre válido según las reglas anteriores. |
| `--stack` | Seleccionar el esqueleto. | No | `blank` | `blank`, `ssr`, `slim_api`, `slim_mcp`; sin distinguir mayúsculas. |
| `--path` | Elegir la ruta final del proyecto. | No | Directorio actual más `NAME` | Ruta nueva cuyo padre exista; espacios y Unicode admitidos. |
| `--description` | Establecer la descripción del proyecto. | No | `A modern application built with Orionis Framework.` | Texto sin caracteres de control. |
| `--author-name` | Definir el nombre del autor. | No | Sin autor | Texto; un valor vacío omite el campo. |
| `--author-email` | Definir el correo del autor. | No | Sin correo | Correo válido; un valor vacío omite el campo. |
| `--storage` | Seleccionar drivers de almacenamiento. | No | `local` | `local`, `s3`, `azure`, `gcs`, `all`. |
| `--default-storage` | Elegir el disco activo cuando se instalan todos. | No | `local` con `all`; en otro caso, el seleccionado | `local`, `s3`, `azure`, `gcs`. |
| `--database` | Seleccionar drivers de base de datos. | No | `sqlite` | `sqlite`, `mysql`, `pgsql`, `oracle`, `sqlserver`, `redshift`, `all`. |
| `--default-database` | Elegir la conexión activa cuando se instalan todos. | No | `sqlite` con `all`; en otro caso, la seleccionada | `sqlite`, `mysql`, `pgsql`, `oracle`, `sqlserver`, `redshift`. |
| `--git` / `--no-git` | Inicializar Git o saltar esa acción. | No | Preguntar: Yes; sin interacción: omitir | Activar u omitir explícitamente. |
| `--migrate` / `--no-migrate` | Ejecutar migraciones y seeders o saltarlos. | No | Preguntar: No; sin interacción: omitir | Activar u omitir explícitamente. |
| `--open` / `--no-open` | Abrir VS Code o saltar esa acción. | No | Preguntar: Yes; sin interacción: omitir | Activar u omitir explícitamente. |
| `--no-interaction` | Evitar todas las preguntas y la confirmación. | No | Desactivado | Flag; las acciones finales requieren sus flags positivos. |
| `--no-color` | Deshabilitar colores. | No | Desactivado, salvo `NO_COLOR` | Flag; también se admite antes de `new`. |
| `--verbose` | Mostrar diagnósticos adicionales del plan. | No | Desactivado | Flag; también se admite antes de `new`. |
| `--help` | Mostrar ayuda de creación y salir. | No | Desactivado | Flag. |

Los valores de almacenamiento y base de datos se escriben en minúsculas. `--default-storage` y `--default-database` nunca admiten `all`; si no has seleccionado todos los drivers, sólo pueden repetir el driver elegido. Para rutas con espacios, utiliza comillas.

### Opciones globales

| Parámetro | Propósito | Obligatorio | Predeterminado | Valores permitidos |
| --- | --- | --- | --- | --- |
| `--help` | Mostrar la ayuda general y salir. | No | Desactivado | Flag antes de `new`; después de `new` muestra su ayuda. |
| `--version` | Mostrar la identidad y versión del instalador y salir. | No | Desactivado | Flag sólo en la raíz, antes del subcomando. |
| `--no-color` | Deshabilitar colores. | No | Desactivado, salvo `NO_COLOR` | Flag antes o después de `new`. |
| `--verbose` | Mostrar diagnósticos adicionales del plan. | No | Desactivado | Flag antes o después de `new`. |

La presencia de `NO_COLOR`, incluso con un valor vacío, deshabilita los colores.

### Ejemplos sin interacción

Crear una API con valores locales e inicializar su repositorio:

```bash
uvx --python 3.14 --from orionis-installer orionis new service --stack slim_api --no-interaction --git
```

Crear una aplicación SSR y dejar las migraciones y el editor para después:

```bash
uvx --python 3.14 --from orionis-installer orionis new portal --stack ssr --no-interaction --no-migrate --no-open
```

Instalar todos los drivers y mantener almacenamiento local y SQLite como servicios activos:

```bash
uvx --python 3.14 --from orionis-installer orionis new team --no-interaction --storage all --default-storage local --database all --default-database sqlite
```

Elegir otro destino y servicios externos, con metadatos de autor:

```bash
uvx --python 3.14 --from orionis-installer orionis new analytics --no-interaction --path "./Proyecto con espacios" --description "Servicio de informes" --author-name "Jane Doe" --author-email jane@example.com --storage s3 --database redshift
```

El último ejemplo instala los drivers, pero requiere configurar la conexión y el almacenamiento antes de utilizar esos servicios. Sin interacción, Git, migraciones y editor se omiten cuando no has indicado sus flags positivos.

### Drivers y extras instalados

Los extras se incorporan a la dependencia de Orionis del stack, conservando los que ya existan:

| Selección | Extra añadido |
| --- | --- |
| Almacenamiento `local` o base de datos `sqlite` | Ninguno. |
| Almacenamiento `s3`, `azure` o `gcs` | El extra con ese mismo nombre. |
| Almacenamiento `all` | `storage`. |
| Base de datos `mysql`, `pgsql`, `oracle`, `sqlserver` o `redshift` | El extra con ese mismo nombre. |
| Base de datos `all` | `database`. |

Por ejemplo, S3 y Redshift añaden `redshift,s3`; ambas selecciones `all` añaden `database,storage`. El instalador no añade un extra `factories`: las dependencias de factories pertenecen al núcleo del framework.

## Stacks disponibles

Los cuatro stacks utilizan el [repositorio oficial de esqueletos](https://github.com/orionis-framework/skeleton), cada uno en su propia rama. Los enlaces siguientes apuntan a la rama correspondiente; el instalador descarga únicamente la seleccionada y no cambia a otro stack si falla esa descarga.

| Stack oficial | Valor de `--stack` | Propósito y componentes | Repositorio y rama |
| --- | --- | --- | --- |
| **Blank** | `blank` | Base para construir desde cero: configuración de servicios, provider, handler de excepciones, lifespan y archivos de rutas web, API, consola, WebSocket y AI. No trae controladores, modelos, vistas ni migraciones iniciales. | [Skeleton / blank_1.x](https://github.com/orionis-framework/skeleton/tree/blank_1.x) |
| **SSR** | `ssr` | Aplicación web con renderizado en servidor mediante Jinja2, Bootstrap y CSS/JS incluidos. Incorpora bienvenida, autenticación, dashboard, perfil, modelo de usuario, migraciones y vistas de administración como punto de partida. | [Skeleton / ssr_1.x](https://github.com/orionis-framework/skeleton/tree/ssr_1.x) |
| **Slim API** | `slim_api` | Base reducida para APIs y WebSockets: controlador JSON de ejemplo, middleware y registro de rutas API y WebSocket. No incluye interfaz web de autenticación; el archivo WebSocket está preparado para añadir tus rutas. | [Skeleton / slim_api_1.x](https://github.com/orionis-framework/skeleton/tree/slim_api_1.x) |
| **Slim MCP** | `slim_mcp` | Base para servidores Model Context Protocol: registra las rutas AI y un servidor MCP HTTP de ejemplo. Sus colecciones de herramientas, recursos y prompts están vacías para que añadas las tuyas. | [Skeleton / slim_mcp_1.x](https://github.com/orionis-framework/skeleton/tree/slim_mcp_1.x) |

Blank y SSR registran los cinco tipos de archivos de rutas; Slim API registra sólo API y WebSocket, y Slim MCP sólo AI. Todos registran `/up` como comprobación de salud. El servidor de Slim MCP se publica en `/mcp`; la plantilla no registra un servidor STDIO. En SSR, las vistas administrativas de usuarios y roles son puntos de partida, no un CRUD completo.

### Obtener un stack manualmente

Puedes clonar directamente la rama que prefieras. Ejecuta **una** de estas alternativas desde el directorio padre:

**Blank:**

```bash
git clone --branch blank_1.x --single-branch https://github.com/orionis-framework/skeleton.git blog
cd blog
```

**SSR:**

```bash
git clone --branch ssr_1.x --single-branch https://github.com/orionis-framework/skeleton.git portal
cd portal
```

**Slim API:**

```bash
git clone --branch slim_api_1.x --single-branch https://github.com/orionis-framework/skeleton.git service
cd service
```

**Slim MCP:**

```bash
git clone --branch slim_mcp_1.x --single-branch https://github.com/orionis-framework/skeleton.git tools
cd tools
```

Para descargar un ZIP, abre el enlace de la rama en la tabla y utiliza **Code → Download ZIP**. Extrae el contenido y sitúate en la carpeta que contiene `pyproject.toml` y `reactor`.

Una descarga manual requiere preparar el entorno. En un clon nuevo, copia el ejemplo según tu terminal:

```bash
# macOS / Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Revisa `APP_NAME` en `.env` y los metadatos de `pyproject.toml`. Después ejecuta:

```bash
uv sync --python 3.14
uv run python -c "from pathlib import Path; Path('database').mkdir(exist_ok=True)"
uv run python -B reactor key:generate
```

El directorio `database` permite utilizar la ruta SQLite del ejemplo, `database/database.sqlite`; algunas plantillas no lo incluyen inicialmente. El archivo SQLite lo creará la base de datos cuando se utilice. Para SSR, prepara el esquema antes de utilizar la autenticación:

```bash
uv run python -B reactor migrate
```

Continúa con [el primer arranque](#primeros-pasos-después-de-la-instalación). Al clonar manualmente conservas el historial y remoto del esqueleto; un ZIP no incluye `.git`. Tampoco se aplican las selecciones de metadatos, drivers ni las verificaciones del instalador: configura `.env`, incorpora los extras necesarios a la dependencia de Orionis en `pyproject.toml` conservando su restricción y vuelve a ejecutar `uv sync --python 3.14` si cambias dependencias.

## Primeros pasos después de la instalación

### Revisar el entorno del proyecto

Para un proyecto creado por el instalador, entra en su carpeta; si utilizaste `--path`, utiliza esa ruta:

```bash
cd blog
```

La `.venv`, `uv.lock`, `.env` y `APP_KEY` ya están preparados cuando la creación termina correctamente. No copies otra vez `.env.example` sobre `.env`. Si necesitas instalar dependencias pendientes o sincronizar cambios del manifiesto:

```bash
uv sync --python 3.14
```

Revisa `.env` y utiliza `.env.reference` como referencia de las opciones adicionales del stack. Algunos valores escritos por el instalador utilizan el prefijo `base64:` de Orionis para preservar su contenido literal. Los valores locales iniciales son SQLite, almacenamiento local, caché en archivos, colas síncronas y sesiones en memoria del proceso.

Para servicios externos, sustituye los valores pendientes de conexión y configura credenciales, bucket o contenedor y permisos del proveedor. El instalador escribe `configure-me` como usuario provisional de base de datos, establece el puerto del driver y no proporciona una contraseña. Oracle requiere además un servicio de conexión, como `DB_SERVICE_NAME`; SQL Server necesita el driver ODBC del sistema indicado por `DB_ODBC_DRIVER`. Continúa con [Bases de datos y ORM](/es/database) y [Almacenamiento](/es/storage).

### Migraciones y datos iniciales

Para preparar el esquema —por ejemplo, las tablas de autenticación de SSR— ejecuta desde la raíz del proyecto:

```bash
uv run python -B reactor migrate
```

Este comando aplica las migraciones sin solicitar seeders. Si ya se ejecutaron correctamente, no es necesario volver a prepararlas para iniciar el servidor. Blank, Slim API y Slim MCP no incluyen migraciones iniciales necesarias para probar sus endpoints de partida.

:::caution[La opción del instalador también ejecuta seeders]
Aceptar las migraciones del asistente o pasar `--migrate` ejecuta `reactor migrate --seed`. Revisa los seeders antes de elegir esa opción: SSR incluye datos administrativos con credenciales de ejemplo. Para preparar sólo el esquema, crea el proyecto con `--no-migrate` y ejecuta manualmente `reactor migrate`.
:::

Con Redshift como conexión activa, utiliza `--no-migrate` y ejecuta las migraciones de esquema manualmente, sin `--seed`: el framework rechaza la ejecución de seeders en Redshift porque requiere restricciones únicas efectivas para registrar cada ejecución una sola vez.

En una base compatible con seeders, cuando hayas revisado y adaptado los datos iniciales y sus credenciales, puedes solicitarlos explícitamente:

```bash
uv run python -B reactor migrate --seed
```

Los flujos de verificación y recuperación de cuenta de SSR también requieren configurar el envío de correo. El stack no incluye credenciales SMTP; consulta [Correo](/es/mail).

### Iniciar y comprobar la aplicación

Desde la raíz del proyecto:

```bash
uv run python -B reactor serve
```

El servidor de desarrollo utiliza [http://127.0.0.1:8000](http://127.0.0.1:8000). Comprueba [http://127.0.0.1:8000/up](http://127.0.0.1:8000/up), disponible en los cuatro stacks. Los puntos de entrada adicionales dependen de la plantilla:

- **Blank:** añade tus rutas; no registra una página en `/` inicialmente.
- **SSR:** abre `/` para la bienvenida y prepara las tablas antes de utilizar registro e inicio de sesión.
- **Slim API:** prueba `/api/example` para el endpoint JSON incluido.
- **Slim MCP:** configura tu cliente MCP para el endpoint `/mcp`; una visita normal del navegador no equivale a una solicitud del protocolo. Sigue [Servidores MCP](/es/mcp) para declarar herramientas y conectar clientes.

Detén el servidor con Ctrl+C. Si el puerto está ocupado:

```bash
uv run python -B reactor serve --port 8001
```

Desde 1.0.13 puedes elegir también la dirección de escucha con `--host`. Por ejemplo, para aceptar conexiones por las interfaces de red del equipo:

```bash
uv run python -B reactor serve --host 0.0.0.0 --port 8001
```

Abre la IP o el dominio del equipo con el puerto seleccionado. Si necesitas escuchar únicamente en el equipo local, usa `--host 127.0.0.1`. Consulta las [opciones de `serve`](/es/console/built-in-application#command-serve) y la [configuración CORS para clientes web](/es/http/middleware#cors-http).

Para añadir tus primeras rutas y comprender el arranque, continúa con [Crear y arrancar una aplicación](/es/getting-started/quick-start) y [Ciclo de vida](/es/application/lifecycle).

## Consideraciones y recuperación

- **Destinos existentes:** `new` no sobrescribe carpetas y no ofrece `--force`. Utiliza otra ruta o continúa la configuración del proyecto que ya existe. También se rechazan enlaces simbólicos, junctions, rutas con `..` y destinos dentro de un workspace de uv heredado.
- **Python sin descargas:** con `UV_PYTHON_DOWNLOADS=never` o `UV_OFFLINE` activo, Python estable 3.14.x debe estar disponible previamente. El modo offline de uv no sustituye la descarga del esqueleto desde GitHub.
- **Configuración aislada:** el instalador rechaza un `UV_CONFIG_FILE` no vacío. Conserva los ajustes admitidos de red, certificados e índices de uv, pero no hereda indiscriminadamente el entorno virtual ni las variables de aplicación, base de datos o nube del proceso que lo ejecuta. Configura los servicios en el `.env` del proyecto.
- **Errores al descargar o verificar:** si la rama no existe o la plantilla no satisface los requisitos, la instalación se detiene; no cambia de stack ni ignora la incompatibilidad.
- **Fallos durante la creación:** antes de colocar el proyecto en su destino se limpia el directorio temporal propio. Después de colocarlo, los archivos se conservan y el diagnóstico indica cómo continuar. Un fallo de Git o del editor no elimina el proyecto, y las demás operaciones finales independientes pueden continuar.
- **Migraciones fallidas:** revisa la conexión y el estado real de la base antes de reintentar. No se ejecutan rollback automático ni `migrate:fresh`.

Para recuperar un proyecto conservado, revisa primero sus archivos y configuración y ejecuta dentro de su carpeta:

```bash
uv sync --python 3.14
uv run python -B reactor key:generate
```

La generación de clave conserva una existente; no utilices `--force` como paso de recuperación. Si faltan archivos del stack o existe una incompatibilidad de dependencias, corrige esa causa antes de volver a arrancar. Los problemas de configuración y caché se desarrollan en [Configuración tipada](/es/application/configuration) y [Directorios y caché de arranque](/es/application/paths-and-caching).

### Códigos de salida

| Código | Significado |
| --- | --- |
| `0` | Creación y acciones solicitadas completadas u omitidas; también se utiliza al rechazar la confirmación. Puede haber advertencias de configuración pendiente. |
| `1` | Fallo crítico de descarga, archivos o instalación de dependencias. |
| `2` | Argumentos inválidos, requisitos ausentes o incompatibilidad detectada. |
| `3` | Proyecto creado, pero falló una operación final solicitada: Git, migraciones o editor. |
| `130` | Cancelación del usuario o fin de la entrada interactiva. |
