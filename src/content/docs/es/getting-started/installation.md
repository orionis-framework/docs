---
title: "Instalación y primer proyecto"
description: "Crea aplicaciones con el instalador oficial: siete esqueletos, asistente, opciones, entorno, migraciones y primer arranque."
editUrl: true
lastUpdated: false
---

El instalador oficial crea una aplicación desde el esqueleto que elijas, configura sus servicios e instala sus dependencias en una `.venv` propia. Ejecuta desde el directorio donde quieras crear el proyecto:

```bash
uvx --python 3.14 --from orionis-installer orionis new blog
```

Sigue el asistente para elegir el stack y los servicios. Si quieres crear directamente una aplicación web SSR con SQLite y sus tablas preparadas:

```bash
uvx --python 3.14 --from orionis-installer orionis new portal --stack ssr --no-interaction --migrate
cd portal
uv run python -B reactor serve
```

Esta guía describe el instalador **1.0.1**. Su paquete se llama **`orionis-installer`** y su ejecutable es **`orionis`**. El framework que utiliza cada aplicación es una dependencia distinta: su restricción está en el `pyproject.toml` del stack y se conserva durante la instalación.

## Requisitos previos

- **[uv](https://docs.astral.sh/uv/getting-started/installation/) y [Git](https://git-scm.com/downloads)** disponibles en `PATH`. Git descarga el esqueleto incluso si omites la inicialización del repositorio de tu nueva aplicación.
- **Python 3.14 o superior para ejecutar el instalador.** La aplicación utiliza específicamente **Python estable 3.14.x**. Si falta, uv puede descargarlo según sus políticas de red y descarga. La invocación con `uvx --python 3.14` selecciona también un intérprete compatible para el instalador.
- **Conectividad con GitHub y el índice de paquetes**, y con el servidor de descarga de Python cuando sea necesario.
- **Una carpeta de destino nueva y un directorio padre existente con permisos de escritura.** Se rechaza un destino que ya exista, incluso si está vacío.
- **Una terminal interactiva** para el asistente. En scripts, CI o terminales sin entrada y salida TTY, utiliza `--no-interaction`.

Puedes trabajar en Windows, macOS o Linux y elegir tu editor. El instalador no abre editores al terminar. Los comandos de esta guía no requieren activar manualmente un entorno virtual. En Windows, uv y Git deben resolverse como ejecutables nativos, no mediante envoltorios `.cmd` o `.bat`.

## Instalación y ejecución

### Ejecutar con uvx

La forma explícita identifica el paquete que proporciona el comando:

```bash
uvx --python 3.14 --from orionis-installer orionis new
uvx --python 3.14 --from orionis-installer orionis new blog
```

Sin nombre, el asistente también lo pregunta; propone `orionis-app`. Con `new blog`, la carpeta predeterminada es `blog` dentro del directorio actual. Para elegir otra ubicación, proporciona `--path` con la ruta final del proyecto.

Consulta las opciones y comprueba la versión que estás ejecutando:

```bash
uvx --python 3.14 --from orionis-installer orionis --version
uvx --python 3.14 --from orionis-installer orionis --help
uvx --python 3.14 --from orionis-installer orionis new --help
```

Si uvx reutiliza una versión anterior desde su caché, actualízala y comprueba su identidad con:

```bash
uvx --refresh --python 3.14 --from orionis-installer orionis --version
```

Para fijar la versión del instalador, utiliza `--from "orionis-installer==1.0.1"`. Esto no fija la revisión Git del esqueleto ni la resolución de dependencias de la aplicación. La [guía de herramientas de uv](https://docs.astral.sh/uv/guides/tools/) explica los entornos y la selección de versiones.

### Instalar como herramienta de uv

Para disponer del comando en tu terminal:

```bash
uv tool install --python 3.14 orionis-installer
orionis --version
orionis new blog
```

Para actualizar una instalación existente de la herramienta:

```bash
uv tool upgrade orionis-installer
```

Comprueba que `orionis --version` identifica a `orionis-installer`. El framework también puede proporcionar un ejecutable llamado `orionis`; la forma explícita con `uvx --from orionis-installer` selecciona el instalador. Dentro de la aplicación, utiliza `uv run python -B reactor ...` para sus comandos.

## Stacks disponibles

Los **siete stacks** proceden del [repositorio oficial de esqueletos](https://github.com/orionis-framework/skeleton). El instalador descarga únicamente la rama seleccionada; si falla, se detiene sin cambiar a otra variante.

| Valor de `--stack` | Nombre en el asistente | Punto de partida | Rama |
| --- | --- | --- | --- |
| `master` | Full application | Aplicación de referencia con autenticación web y ejemplo de API, más puntos de extensión para consola, WebSocket y MCP. | [master](https://github.com/orionis-framework/skeleton/tree/master) |
| `blank` | Blank | Base mínima para construir desde cero, con archivos de rutas preparados y sin funcionalidades de negocio iniciales. **Es el valor predeterminado.** | [blank_1.x](https://github.com/orionis-framework/skeleton/tree/blank_1.x) |
| `ssr` | Server-rendered web | Aplicación web con renderizado de vistas, autenticación y rutas de consola. | [ssr_1.x](https://github.com/orionis-framework/skeleton/tree/ssr_1.x) |
| `slim_api` | Slim API | API HTTP con endpoint JSON de ejemplo y configuración de base de datos. | [slim_api_1.x](https://github.com/orionis-framework/skeleton/tree/slim_api_1.x) |
| `slim_mcp` | Slim MCP | Servidor MCP HTTP con ejemplos de herramienta, recurso y prompt. | [slim_mcp_1.x](https://github.com/orionis-framework/skeleton/tree/slim_mcp_1.x) |
| `slim_worker` | Queue worker | Jobs, tareas programadas y comandos de consola; la cola utiliza base de datos por defecto. | [slim_worker_1.x](https://github.com/orionis-framework/skeleton/tree/slim_worker_1.x) |
| `slim_realtime` | Realtime | Conexiones WebSocket y hub de ejemplo. | [slim_realtime_1.x](https://github.com/orionis-framework/skeleton/tree/slim_realtime_1.x) |

El bootstrap de cada variante determina qué rutas se registran. Master y Blank incluyen archivos para web, API, consola, WebSocket y AI; SSR registra web y consola; Slim API registra API; Slim MCP registra AI; Slim Worker registra consola; Slim Realtime registra WebSocket. Utiliza `/up` para comprobar las variantes HTTP. Slim Worker está orientado a procesos de consola; las rutas internas del framework, como `/up`, pueden aparecer también en su inventario de rutas.

## Proceso de instalación paso a paso

El asistente se presenta en inglés. Usa las flechas o un número para seleccionar y Enter para confirmar; Home y End llevan al principio o al final de la lista. Ctrl+C cancela. Las opciones proporcionadas en la línea de comandos omiten sus preguntas correspondientes.

### 1. Comprobar herramientas y Python

Primero se comprueban uv, Git y Python estable 3.14.x. Si hace falta descargar Python, el instalador lo anuncia antes de intentarlo. Esto puede ocurrir antes de la confirmación de creación del proyecto.

### 2. Definir la aplicación

En **Application**, se solicitan el stack, nombre, descripción y autor opcional. La descripción propuesta es `A modern application built with Orionis Framework.`. Puedes dejar vacíos el nombre y el correo del autor para omitir esos metadatos.

El nombre de la aplicación admite de 1 a 100 caracteres ASCII: letras, números, puntos, guiones y guiones bajos. Debe comenzar y terminar con una letra o número. No admite `..`, separadores de ruta ni nombres reservados de Windows. Las descripciones y los nombres de autor admiten Unicode sin caracteres de control.

La ubicación no se pregunta: utiliza `--path` para establecer una carpeta final distinta de la que deriva del nombre.

### 3. Seleccionar los servicios

En **Services**, elige primero el almacenamiento y luego la base de datos. Los valores predeterminados son **local** y **SQLite**.

Seleccionar `all` instala todos los drivers de esa categoría y añade una pregunta para elegir el disco o la conexión activos. Sus valores predeterminados siguen siendo `local` y `sqlite`. La selección de drivers se traduce en extras de Orionis y en `FILESYSTEM_DISK` y `DB_CONNECTION` dentro de `.env`.

Las credenciales y la infraestructura externa se configuran por separado. Instalar un SDK no crea buckets, cuentas ni servidores de base de datos.

### 4. Revisar y confirmar

El plan muestra los metadatos, la ruta completa, el stack, la rama, el Python objetivo y los servicios y extras seleccionados. La confirmación propone **Yes**. Si eliges **No**, el proceso termina con código `0` sin descargar el esqueleto.

### 5. Crear y verificar el proyecto

La consola muestra las etapas **Source**, **Configuration**, **Dependencies** y **Verification**, con sus estados y tiempos. Durante ellas, el instalador:

1. Descarga la rama seleccionada en un directorio temporal junto al destino, verifica su origen y retira el `.git` de esa copia.
2. Actualiza los metadatos y extras de `pyproject.toml`, conservando la restricción de Orionis, la versión de la aplicación y sus grupos de dependencias. Escribe `.python-version` para Python 3.14 y mantiene la aplicación sin empaquetar mediante `tool.uv.package = false`.
3. Genera el `.env` con variables agrupadas, consume los archivos de ejemplo y conserva `.env.reference`. Ajusta `.gitignore` para los secretos y archivos locales, manteniendo `uv.lock` versionable.
4. Coloca los archivos en el destino definitivo y ejecuta allí `uv sync --python 3.14`; la `.venv` se crea en su ubicación final.
5. Verifica el intérprete, Orionis, sus dependencias, el lockfile y los drivers efectivos. Genera `APP_KEY` con el framework si falta y conserva una clave existente.

La creación no inicia el servidor. La pantalla inicial utiliza información local del instalador; la versión de Orionis se presenta después de instalarla y verificarla.

### 6. Elegir las operaciones finales

| Acción | Selección propuesta | Resultado al aceptar |
| --- | --- | --- |
| Inicializar Git | Yes | Ejecuta `git init`, sin crear commit, remoto ni push. |
| Preparar la base de datos | No | Ejecuta las migraciones de aplicación y los comandos internos necesarios según el stack y los servicios SQL activos. **No ejecuta seeders.** |

Si la conexión externa está incompleta, el modo interactivo puede solicitar host, puerto, base o servicio Oracle, usuario y contraseña enmascarada. La configuración adicional se propone con **No**. En modo no interactivo no se solicitan credenciales: la preparación de tablas falla si faltan los datos necesarios.

La pantalla final distingue el estado de creación, Git y migraciones y muestra los comandos adecuados para continuar con el stack elegido. Puedes abrir la carpeta en tu editor habitual.

## Parámetros y opciones disponibles

### Argumento y opciones de new

Todos los argumentos son opcionales. Los valores siguientes se aplican automáticamente con `--no-interaction`; en el asistente, los campos omitidos se preguntan cuando corresponde.

| Parámetro | Uso y valor predeterminado |
| --- | --- |
| `new [NAME]` | Nombre de la aplicación; `orionis-app` si se omite. |
| `--stack` | Uno de los siete valores de la tabla de stacks; `blank` por defecto. No distingue mayúsculas. |
| `--path PATH` | Ruta final del proyecto; por defecto, directorio actual más `NAME`. Admite espacios y Unicode. |
| `--description TEXT` | Descripción de la aplicación; utiliza la descripción propuesta por el asistente si se omite. |
| `--author-name TEXT`, `--author-email TEXT` | Autor opcional; un valor vacío omite el campo correspondiente. |
| `--storage` | `local`, `s3`, `azure`, `gcs` o `all`; `local` por defecto. |
| `--default-storage` | Disco activo con `--storage all`: `local`, `s3`, `azure` o `gcs`; `local` por defecto. |
| `--database` | `sqlite`, `mysql`, `pgsql`, `oracle`, `sqlserver`, `redshift` o `all`; `sqlite` por defecto. |
| `--default-database` | Conexión activa con `--database all`: cualquiera de las concretas anteriores; `sqlite` por defecto. |
| `--git` / `--no-git` | Inicializar Git u omitirlo. Sin flags, se pregunta en modo interactivo y se omite sin interacción. |
| `--migrate` / `--no-migrate` | Preparar las tablas u omitirlo. Sin flags, se pregunta en modo interactivo y se omite sin interacción. |
| `--no-interaction` | Aplicar valores predeterminados sin preguntas ni confirmación. |
| `--no-color` | Deshabilitar colores; también respeta la presencia de `NO_COLOR`, incluso vacío. |
| `--verbose` | Mostrar diagnósticos adicionales del plan sin volcar la salida cruda de los procesos ni secretos. |
| `--help` | Mostrar la ayuda del subcomando y salir. |

Escribe los valores de almacenamiento y base de datos en minúsculas. Un driver predeterminado debe ser concreto: `--default-storage` y `--default-database` no admiten `all`. Si no seleccionas todos los drivers, sólo pueden repetir el driver seleccionado. Utiliza comillas para las rutas con espacios.

### Opciones globales

`--version` muestra la identidad y versión del instalador; se utiliza en la raíz del comando. `--help` muestra la ayuda general antes de `new` y la ayuda de creación después. `--no-color` y `--verbose` se admiten antes o después de `new`.

### Ejemplos sin interacción

API con almacenamiento local, SQLite e inicialización de Git:

```bash
uvx --python 3.14 --from orionis-installer orionis new service --stack slim_api --no-interaction --git
```

Worker con su cola SQL preparada:

```bash
uvx --python 3.14 --from orionis-installer orionis new jobs --stack slim_worker --no-interaction --migrate
```

Servidor MCP y aplicación realtime, en directorios distintos:

```bash
uvx --python 3.14 --from orionis-installer orionis new tools --stack slim_mcp --no-interaction
uvx --python 3.14 --from orionis-installer orionis new live --stack slim_realtime --no-interaction
```

Todos los drivers, con disco local y SQLite activos:

```bash
uvx --python 3.14 --from orionis-installer orionis new team --no-interaction --storage all --default-storage local --database all --default-database sqlite
```

Destino personalizado y servicios externos pendientes de credenciales:

```bash
uvx --python 3.14 --from orionis-installer orionis new analytics --no-interaction --path "./Proyecto con espacios" --description "Servicio de informes" --author-name "Jane Doe" --author-email jane@example.com --storage s3 --database redshift
```

En este modo, Git y las migraciones se omiten salvo que pases `--git` y `--migrate`, respectivamente.

### Drivers y extras instalados

| Selección | Extra de Orionis añadido |
| --- | --- |
| Almacenamiento `local` o base de datos `sqlite` | Ninguno. |
| Almacenamiento `s3`, `azure` o `gcs` | El extra con ese mismo nombre. |
| Almacenamiento `all` | `storage`. |
| Base de datos `mysql`, `pgsql`, `oracle`, `sqlserver` o `redshift` | El extra con ese mismo nombre. |
| Base de datos `all` | `database`. |

Los extras se combinan con los del stack y se deduplican: S3 y Redshift añaden `redshift,s3`; ambas selecciones `all` añaden `database,storage`. Las dependencias de factories ya pertenecen al núcleo del framework. SQL Server requiere además un driver ODBC del sistema; las credenciales, servicios y componentes del sistema no se provisionan al instalar los extras.

## Configuración del entorno

El instalador utiliza el ejemplo mínimo del stack para generar `.env`, con las variables de cada servicio en su bloque y los bloques separados por una línea vacía. Las variables adicionales de conexión se insertan en el bloque correspondiente, incluidas las que se solicitan al preparar una base externa.

Después de escribir `.env` correctamente, elimina `.env.example` y el nombre heredado `env.example` si existe. **`.env.reference` permanece como referencia completa de las variables disponibles.** Trabaja sobre `.env` para configurar la aplicación; no necesitas copiar de nuevo un archivo de ejemplo.

Algunos valores generados para una aplicación local son:

```dotenv
APP_NAME="blog"

DB_CONNECTION="sqlite"
DB_DATABASE="database/database.sqlite"

FILESYSTEM_DISK="local"
```

`APP_NAME` se escribe como texto legible. Si el nombre parece un número, booleano o valor nulo, se utiliza `str:` para conservar su tipo de texto, por ejemplo `APP_NAME="str:123"`. Los valores entrecomillados utilizan comillas dobles por defecto y comillas simples cuando evitan escapar comillas dobles interiores. Los valores tipados sin comillas conservan su representación.

Los valores literales de conexión pueden utilizar el prefijo `base64:` para conservar exactamente caracteres especiales frente a la interpolación de dotenv. Esa codificación no cifra las credenciales; `.env` contiene los secretos locales y se excluye de Git.

`APP_KEY` se genera con el Python de la aplicación y sin forzar su sustitución. SQLite utiliza una ruta local persistente; se prepara su directorio padre y el archivo se crea cuando la base de datos se utiliza. Para proveedores cloud o bases externas, completa las opciones correspondientes en `.env` usando `.env.reference` y las guías de [almacenamiento](/es/storage/configuration) y [base de datos](/es/database/configuration).

Los archivos de configuración distribuidos dependen del stack. Si no existe un override de base de datos o filesystem, se utilizan los valores del framework; el instalador verifica igualmente los drivers efectivos.

### Obtener un stack manualmente

También puedes clonar una rama de la tabla de stacks. Este ejemplo utiliza SSR:

```bash
git clone --branch ssr_1.x --single-branch https://github.com/orionis-framework/skeleton.git portal
cd portal
```

Para obtener un ZIP, abre el enlace de la rama y utiliza **Code → Download ZIP**. Sitúate en la carpeta que contiene `pyproject.toml` y `reactor`. En un clon o ZIP nuevo, prepara `.env` según tu terminal:

```bash
# macOS / Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Revisa `APP_NAME`, los servicios de `.env` y los metadatos de `pyproject.toml`. Después instala las dependencias y genera la clave:

```bash
uv sync --python 3.14
uv run python -B reactor key:generate
```

Si usas SQLite, comprueba que exista el directorio padre del archivo configurado antes de migrar. Para la ruta habitual `database/database.sqlite`:

```bash
uv run python -c "from pathlib import Path; Path('database').mkdir(exist_ok=True)"
```

Continúa con las migraciones y el arranque que correspondan a tu variante. La descarga manual conserva los archivos del esqueleto, incluidos los ejemplos de entorno; el clon también conserva su remoto e historial. Las operaciones de configuración y limpieza descritas para el instalador no se ejecutan automáticamente en este procedimiento.

## Primeros pasos después de la instalación

Ejecuta los comandos siguientes desde la raíz de tu aplicación, donde están `pyproject.toml` y `reactor`.

### Migraciones y datos iniciales

El instalador prepara las tablas sólo cuando aceptas esa acción o proporcionas `--migrate`. Aplica primero `reactor migrate` para las migraciones de aplicación y después los comandos internos requeridos:

| Stack o servicio activo | Comando adicional |
| --- | --- |
| Master o SSR, para sus tablas de autenticación | `auth:migrate` |
| `CACHE_STORE=database` | `cache:migrate` |
| `QUEUE_CONNECTION=database`, incluido el valor inicial de Slim Worker | `queue:migrate` |
| `TASKS_STORE=database` | `schedule:migrate` |
| `SESSION_DRIVER=database` | `session:migrate` |

Slim Realtime omite la preparación si no tiene un directorio de migraciones de aplicación ni servicios con almacenamiento SQL. Los comandos internos crean sus tablas a partir de las definiciones del framework, conservando los datos existentes.

Si omitiste esta fase en Master o SSR, prepara la aplicación y la autenticación con:

```bash
uv run python -B reactor migrate
uv run python -B reactor auth:migrate
```

Para Slim Worker, el almacenamiento inicial de la cola necesita:

```bash
uv run python -B reactor migrate
uv run python -B reactor queue:migrate
```

**El instalador no ejecuta seeders ni crea usuarios administrativos de ejemplo.** Para cargar datos iniciales, revisa primero los seeders de la aplicación y adapta sus credenciales; solicita su ejecución explícitamente después de preparar las tablas:

```bash
uv run python -B reactor seed
```

La preparación de una base externa requiere una conexión completa y accesible. En Redshift, los seeders no están soportados; las migraciones de esquema se ejecutan por separado. Consulta [Migraciones](/es/database/migrations) y [Seeders](/es/database/seeders) para sus contratos. Los flujos de cuenta que envían mensajes también requieren configurar [Correo](/es/mail).

### Iniciar y comprobar la aplicación

Para Master, SSR, Slim API, Slim MCP o Slim Realtime:

```bash
uv run python -B reactor serve
```

El servidor de desarrollo escucha por defecto en [http://127.0.0.1:8000](http://127.0.0.1:8000). Puedes comprobar [http://127.0.0.1:8000/up](http://127.0.0.1:8000/up) y continuar según el stack:

| Stack | Primer uso |
| --- | --- |
| Master o SSR | Abre `/`; prepara las tablas antes de utilizar la autenticación. |
| Slim API | Solicita `/api/example` para probar el endpoint JSON. |
| Slim MCP | Conecta un cliente MCP a `http://127.0.0.1:8000/mcp`; incluye ejemplos de herramienta, recurso y prompt. |
| Slim Realtime | Conecta un cliente WebSocket a `/ws/echo` o utiliza el hub `/realtime/echo`. |

Para Slim MCP, utiliza [Orionis Inspector](https://inspector.orionis-framework.com/) y consulta [Servidores MCP](/es/mcp). Una visita normal del navegador al endpoint no equivale a una petición MCP.

Blank te permite comenzar revisando los comandos y añadiendo tus rutas:

```bash
uv run python -B reactor list
```

También puedes ejecutar `reactor serve` en Blank y comprobar `/up`; la plantilla no incluye una página de negocio en `/`.

Slim Worker trabaja mediante procesos de consola. Después de preparar la cola:

```bash
uv run python -B reactor queue:work
```

Si utilizas tareas programadas, ejecuta en otra terminal:

```bash
uv run python -B reactor schedule:work
```

Estos procesos no requieren iniciar `serve`. Consulta [Colas](/es/queues) y [Scheduler](/es/console/task-scheduling) para configurarlos.

Detén los procesos de desarrollo con Ctrl+C. Para cambiar el puerto HTTP o la dirección de escucha:

```bash
uv run python -B reactor serve --host 127.0.0.1 --port 8001
```

Consulta las [opciones de `serve`](/es/console/built-in-application#command-serve), [Crear y arrancar una aplicación](/es/getting-started/quick-start) y el [ciclo de vida](/es/application/lifecycle) para continuar.

## Consideraciones y recuperación

- **Destinos existentes:** `new` no sobrescribe carpetas y no ofrece `--force`. Utiliza otra ruta o continúa configurando el proyecto existente. Se rechazan enlaces simbólicos, junctions, rutas con `..` y destinos dentro de un workspace de uv heredado.
- **Python y red:** con `UV_PYTHON_DOWNLOADS=never` o `UV_OFFLINE` activo, Python estable 3.14.x debe estar disponible. El modo offline de uv no evita que el instalador necesite descargar el esqueleto desde GitHub.
- **Configuración aislada:** se rechaza un `UV_CONFIG_FILE` no vacío. Se conservan los ajustes admitidos de red, certificados e índices de uv; los servicios de la aplicación se configuran en su propio `.env`.
- **Bloqueos temporales en Windows:** la escritura de `.env` y la colocación final de los archivos reintentan fallos transitorios de acceso o bloqueo hasta cinco veces. Un error persistente se informa y detiene esa operación.
- **Fallos antes de colocar el proyecto:** se limpia únicamente el directorio temporal de esa instalación. Si los archivos ya están en el destino final, se conservan y se muestran pasos de recuperación.
- **Fallos de Git o migraciones:** el proyecto se conserva. Una migración fallida puede haber aplicado cambios; revisa la base antes de reintentar. No se ejecutan rollback automático ni `migrate:fresh`.

Para recuperar un proyecto conservado, corrige primero la causa indicada y ejecuta dentro de su carpeta:

```bash
uv sync --python 3.14
uv run python -B reactor key:generate
```

La generación de clave conserva una existente; no necesita `--force`. Revisa las migraciones pendientes antes de iniciar la aplicación. Para problemas de configuración o caché, consulta [Configuración](/es/application/configuration) y [Directorios y caché de arranque](/es/application/paths-and-caching).

### Códigos de salida

| Código | Significado |
| --- | --- |
| `0` | Creación y acciones solicitadas completadas u omitidas; también al rechazar la confirmación. Puede haber configuración externa pendiente. |
| `1` | Fallo crítico al descargar, configurar, colocar los archivos o instalar dependencias. |
| `2` | Argumentos inválidos, requisitos ausentes o incompatibilidad detectada. |
| `3` | Proyecto creado, pero falló una operación final solicitada de Git o migraciones. |
| `130` | Cancelación del usuario o fin de la entrada interactiva. |
