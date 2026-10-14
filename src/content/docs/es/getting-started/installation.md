---
title: "Instalación y primer proyecto"
description: "Crea una aplicación con orionis-installer. El instalador selecciona un esqueleto oficial, configura sus metadatos y servicios e instala Orionis en la .venv de la aplicación…"
editUrl: true
lastUpdated: false
---

Crea una aplicación con `orionis-installer`. El instalador selecciona un esqueleto oficial, configura sus metadatos y servicios e instala Orionis en la `.venv` de la aplicación mediante uv.

Esta guía describe el instalador **0.7.0**, disponible en [PyPI](https://pypi.org/project/orionis-installer/0.7.0/). La versión del instalador, la versión de la aplicación y la versión de Orionis son independientes: el esqueleto define el requisito del framework y `uv.lock` registra la versión resuelta.

## Requisitos

Instala [uv](https://docs.astral.sh/uv/getting-started/installation/) y [Git](https://git-scm.com/downloads) y asegúrate de que sus ejecutables estén disponibles en `PATH`. Git es necesario para descargar el esqueleto incluso si omites la inicialización de un repositorio nuevo. En Windows, la comprobación requiere ejecutables binarios en lugar de envoltorios `.cmd` o `.bat`.

El instalador se ejecuta con Python **3.14 o superior**. La aplicación generada utiliza Python estable **3.14.x**, localizado mediante uv y verificado de forma independiente. Si hace falta, el instalador solicita su descarga según las políticas de red y descargas de uv. Con las descargas deshabilitadas o en modo sin conexión, ese intérprete debe estar disponible previamente.

Ejecuta la creación desde una ubicación donde el directorio padre del destino ya exista. El destino debe ser nuevo, incluso si un directorio existente está vacío. Se rechazan rutas redirigidas y destinos dentro de un workspace de uv. También se rechaza un `UV_CONFIG_FILE` no vacío; usa la configuración y las variables admitidas por uv para índices, proxies y descargas.

## Crear un proyecto local

Indica explícitamente la distribución al invocar el instalador:

```bash
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new blog --no-interaction --no-migrate
cd blog
uv run python -B reactor serve
```

Esto crea el stack **Blank** con almacenamiento local y SQLite e inicia la aplicación. En desarrollo, el servidor escucha en [http://127.0.0.1:8000](http://127.0.0.1:8000); `/` muestra la vista de bienvenida y `/up` es la ruta de salud del esqueleto. Detén el servidor con Ctrl+C. La creación del proyecto no inicia automáticamente el servidor HTTP.

`uvx --python 3.14` selecciona el intérprete del instalador. `uv run python -B reactor ...` utiliza el entorno de la aplicación generada. Tanto el framework como el instalador pueden proporcionar un ejecutable llamado `orionis`; `--from orionis-installer` identifica la herramienta que deseas ejecutar.

Para utilizar la distribución disponible actualmente en tu índice sin fijar su versión:

```bash
uvx --from orionis-installer orionis --version
uvx --from orionis-installer orionis new
```

También puedes instalarlo como herramienta de uv:

```bash
uv tool install --python 3.14 orionis-installer==0.7.0
orionis --version
orionis new blog
```

Comprueba que `orionis --version` identifica al instalador antes de usar ese ejecutable. La invocación explícita con uvx sigue siendo útil si hay otro `orionis` en `PATH`.

## Creación interactiva

Ejecuta el asistente desde una terminal interactiva:

```bash
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new blog
```

El asistente comprueba los requisitos y solicita los valores que no proporcionaste:

1. **Stack:** Blank por defecto, o SSR.
2. **Nombre:** `orionis-app` por defecto; el argumento `blog` lo proporciona directamente.
3. **Descripción:** `A modern application built with Orionis Framework.` por defecto.
4. Nombre y correo del autor, opcionales.
5. Drivers de almacenamiento y, al elegir `all`, el disco activo.
6. Drivers de base de datos y, al elegir `all`, la conexión activa.
7. Confirmación del destino, stack, rama fuente, Python y extras.

Las opciones explícitas omiten sus preguntas correspondientes. Rechazar la confirmación final termina correctamente sin crear la aplicación. Después de crearla, el asistente ofrece inicializar Git (Sí), ejecutar migraciones (No) y abrir Visual Studio Code (Sí), en ese orden. Elige **No** para las migraciones hasta revisar los seeders descritos más adelante. Abrir VS Code requiere su lanzador `code`.

Los nombres admiten entre 1 y 100 letras ASCII, dígitos, puntos, guiones y guiones bajos, y deben comenzar y terminar con una letra o un dígito. Se rechazan separadores de ruta, recorridos a directorios superiores, caracteres de control y nombres reservados de Windows. Las descripciones y los nombres de autor admiten Unicode; `--path` admite espacios y Unicode. El nombre de la aplicación y su ubicación final son valores independientes.

## Stacks

| Opción | Rama fuente | Aplicación inicial |
| --- | --- | --- |
| `--stack blank` | `blank_1.x` | Arranque de la aplicación, configuración, archivos de rutas, modelos, migraciones y vista de bienvenida. |
| `--stack ssr` | `ssr_1.x` | La base compartida más controladores y vistas de autenticación, perfil y administración renderizados en el servidor. |

Ambas ramas pertenecen al [repositorio oficial del esqueleto](https://github.com/orionis-framework/skeleton). Los nombres de los stacks no distinguen mayúsculas y minúsculas. Solo se descarga la rama seleccionada; si no está disponible, la instalación falla sin cambiar de stack.

Las versiones enlazadas de los esqueletos Blank y SSR declaran `orionis>=0.805.0` y una versión de aplicación `0.2.0` en `pyproject.toml`. El instalador conserva ese requisito y esa versión al incorporar los extras seleccionados. La instalación descarga la rama seleccionada, por lo que una revisión más reciente puede declarar otros valores; uv resuelve la versión del framework a partir de ese requisito. Consulta los manifiestos de [Blank](https://github.com/orionis-framework/skeleton/blob/429363cd2b15242d360d024f4f870736a29c068f/pyproject.toml) y [SSR](https://github.com/orionis-framework/skeleton/blob/3e130de10d44b97f7fc15eb2fb3b59e399d532e6/pyproject.toml).

## Creación sin interacción y opciones

`--no-interaction` no lee entradas y no requiere una TTY. Los valores omitidos utilizan Blank, `orionis-app`, la descripción predeterminada, ningún autor, almacenamiento local y SQLite. Se omiten Git, las migraciones y el editor, salvo que proporciones sus flags positivos.

```bash
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new portal --stack ssr --no-interaction --git --no-migrate --no-open
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new analytics --no-interaction --storage s3 --database redshift
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new team --no-interaction --storage all --database all
uvx --python 3.14 --from orionis-installer==0.7.0 orionis new blog --no-interaction --path "./Proyecto con espacios" --author-name "Jane Doe" --author-email jane@example.com
```

| Opción | Efecto |
| --- | --- |
| `new [NAME]` | Nombre de la aplicación; sin interacción, se utiliza `orionis-app` si se omite. |
| `--stack blank\|ssr` | Selecciona el esqueleto; Blank por defecto. |
| `--path PATH` | Destino final; si se omite, se usa el directorio actual más el nombre. Su padre debe existir. |
| `--description TEXT` | Descripción de la aplicación. |
| `--author-name TEXT`, `--author-email TEXT` | Metadatos opcionales del autor; un valor vacío omite el campo correspondiente. |
| `--storage local\|s3\|azure\|gcs\|all` | Dependencias de almacenamiento; local por defecto. |
| `--default-storage local\|s3\|azure\|gcs` | Disco activo al usar `all`; local por defecto. |
| `--database sqlite\|mysql\|pgsql\|oracle\|sqlserver\|redshift\|all` | Dependencias de base de datos; SQLite por defecto. |
| `--default-database sqlite\|mysql\|pgsql\|oracle\|sqlserver\|redshift` | Conexión activa al usar `all`; SQLite por defecto. |
| `--git / --no-git` | Inicializa un repositorio o lo omite. |
| `--migrate / --no-migrate` | Ejecuta migraciones **y seeders** en esta implementación, o los omite. |
| `--open / --no-open` | Abre Visual Studio Code o lo omite. |
| `--no-interaction` | Aplica valores predeterminados y flags explícitos sin preguntas. |
| `--no-color` | Deshabilita colores; también aplica `NO_COLOR`, incluso con un valor vacío. |
| `--verbose` | Muestra diagnósticos adicionales del plan de instalación. |

`--version`, `--no-color` y `--verbose` funcionan como opciones globales; las dos últimas también funcionan después de `new`. Consulta la ayuda mediante `orionis new --help` usando la misma invocación con uvx. El driver predeterminado debe ser concreto. Si no utilizas `all`, un predeterminado explícito debe coincidir con el driver seleccionado.

## Drivers y extras

| Almacenamiento seleccionado | Extra de Orionis añadido |
| --- | --- |
| `local` | Ninguno |
| `s3` | `s3` |
| `azure` | `azure` |
| `gcs` | `gcs` |
| `all` | `storage` |

| Base de datos seleccionada | Extra de Orionis añadido |
| --- | --- |
| `sqlite` | Ninguno |
| `mysql` | `mysql` |
| `pgsql` | `pgsql` |
| `oracle` | `oracle` |
| `sqlserver` | `sqlserver` |
| `redshift` | `redshift` |
| `all` | `database` |

Cada proyecto añade `factories`. Almacenamiento local más SQLite añade `factories`; S3 más Redshift añade `factories,redshift,s3`; ambas selecciones `all` añaden `database,factories,storage`. Los extras existentes del esqueleto se conservan. Las selecciones agregadas instalan varios drivers, mientras la aplicación utiliza un disco activo y una conexión activa.

Configura las credenciales de los servicios después de instalar. Instalar un SDK de nube no crea buckets, cuentas ni permisos. Las bases externas requieren un servidor accesible y sus valores de conexión. El instalador utiliza `configure-me` como usuario provisional, deja la contraseña sin configurar y establece el puerto habitual del driver elegido. Oracle también requiere `DB_SERVICE_NAME`; SQL Server requiere el driver ODBC correspondiente del sistema. Continúa con [Bases de datos y ORM](/es/database) y [Almacenamiento](/es/services/storage).

## Entorno generado y primer arranque

El instalador clona en un directorio temporal junto al destino, comprueba la rama y revisión seleccionadas, elimina el `.git` del clon, configura los archivos y coloca el proyecto en su ruta final. Allí ejecuta `uv sync --python 3.14`, que crea la `.venv` local y `uv.lock`. Conserva los grupos de desarrollo válidos y mantiene `tool.uv.package = false`.

Crea `.env` a partir de `.env.example` (o el nombre compatible `env.example`), conserva el ejemplo y establece `APP_NAME`, `FILESYSTEM_DISK` y `DB_CONNECTION`. Algunos valores literales se guardan con el tipo `base64:` de Orionis para conservar su texto exacto. Si falta `APP_KEY`, se genera mediante el comando del framework dentro de la aplicación; una clave existente se conserva. Mantén esa clave estable y privada para los datos cifrados.

En las versiones enlazadas de los esqueletos, los valores predeterminados son SQLite en `database/database.sqlite`, caché en archivos, despacho síncrono de trabajos y sesiones en memoria del proceso. Permiten arrancar localmente la página de bienvenida sin servicios separados de Redis o colas. Las páginas de autenticación y las que utilizan modelos en SSR requieren las tablas; aplica las migraciones de esquema antes de usarlas:

```bash
cd portal
uv run python -B reactor migrate
uv run python -B reactor serve
```

`reactor migrate` por sí solo ejecuta migraciones de esquema. Para utilizar otro puerto de desarrollo:

```bash
uv run python -B reactor serve --port 8001
```

El archivo generado `bootstrap/app.py` construye la aplicación, habilita su caché de arranque, registra rutas, proveedores y otros componentes y llama a `create()`. El script `reactor` de la raíz importa esa instancia y despacha el comando mediante el bucle asíncrono de Orionis. Continúa con [Crear y arrancar una aplicación](/es/getting-started/getting-started) y [Ciclo de vida](/es/getting-started/application-lifecycle).

### Comportamiento de las migraciones en el instalador 0.7.0

La implementación de [`_migrate`](https://github.com/orionis-framework/installer/blob/ceb8e8db2ce0b410fdd34817f9c411008785f5c2/src/orionis_installer/post_install.py#L357) invoca el Python de la aplicación con `-B reactor migrate --seed`. Aceptar la opción de migraciones del asistente o proporcionar `--migrate` solicita también los seeders, aunque el README y los comentarios del comando describen solo las migraciones de esquema. Ten en cuenta la invocación real para evaluar su efecto.

Ambas versiones enlazadas de los esqueletos contienen un seeder administrativo con credenciales fijas de ejemplo. Revisa y cambia su manejo de credenciales antes de solicitar seeders. Crear con `--no-migrate` y después ejecutar manualmente `reactor migrate` permite preparar primero el esquema. Después de revisar la conexión y adaptar los seeders de tu aplicación, puedes solicitarlos explícitamente:

```bash
uv run python -B reactor migrate --seed
```

Para una base externa, la ruta interactiva de migraciones puede solicitar configurar campos de conexión pendientes. La ruta sin interacción nunca solicita credenciales y falla la operación pedida si están incompletas. El instalador no revierte automáticamente los cambios en la base de datos.

## Códigos de salida y recuperación

| Código | Significado |
| --- | --- |
| `0` | La creación y las operaciones solicitadas terminaron o se omitieron; también se utiliza al rechazar la confirmación final. |
| `1` | Fallo de descarga, archivos o proceso de instalación de dependencias. |
| `2` | Argumentos inválidos, requisitos ausentes o incompatibilidad del esqueleto/framework. |
| `3` | Proyecto creado, pero falló una operación solicitada de Git, migraciones o editor. |
| `130` | Cancelación o fin de la entrada interactiva. |

Los fallos antes de colocar el proyecto en su destino limpian el área temporal propia. Los fallos posteriores conservan el destino y ofrecen instrucciones de recuperación. No puedes pasar nuevamente ese directorio existente a `new`. Revisa el error y los archivos conservados, corrige la causa y completa el entorno desde el proyecto:

```bash
cd blog
uv sync --python 3.14
uv run python -B reactor key:generate
uv run python -B reactor serve
```

Estos comandos resuelven la instalación de dependencias y la preparación de la clave; un archivo faltante o incompatible del esqueleto requiere corregirlo. La inicialización de Git ejecuta solo `git init`, sin commit ni remoto. Las operaciones posteriores continúan de forma independiente después de un fallo, salvo cancelación. Inspecciona la base afectada antes de reintentar una migración; no se ejecutan rollback automático ni `migrate:fresh`.

Si el arranque no puede importar `bootstrap.app`, ejecuta Reactor desde la raíz de la aplicación. Ante dependencias ausentes, comprueba que `uv run` utiliza el entorno local y que está instalado el extra necesario. Para configuración inválida o estado de arranque desactualizado, consulta [Configuración tipada](/es/getting-started/configuration) y [Directorios y caché de arranque](/es/getting-started/paths-and-caching).
