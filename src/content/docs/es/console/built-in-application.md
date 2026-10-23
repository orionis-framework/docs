---
title: "Comandos de aplicación y mantenimiento"
description: "Sintaxis y opciones de inspección, servidor, tests, optimización, mantenimiento, limpieza, claves y paquetes."
editUrl: true
lastUpdated: false
---

Esta referencia cubre los comandos de uso general del proyecto. Cada bloque muestra las dos alternativas de ejecución: usa la que corresponda a tu entorno. Los comandos sin parámetros no admiten filtros adicionales; todos permiten consultar `-h` / `--help`.

Las opciones de `serve` y `test` tienen precedencia sobre los valores de configuración que su implementación consulta. Las operaciones de limpieza actúan en ubicaciones concretas; sus efectos no son intercambiables.

<a id="command-about"></a>

## about

Muestra metadatos del framework instalado.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Presenta nombre, versión instalada, descripción, autor, requisito Python y enlaces del framework. Es información del paquete que ejecuta el proceso; no consulta actualizaciones remotas.

```shell
orionis about
python -B reactor about
```

<a id="command-clear-cache"></a>

## clear:cache

Vacía el store de caché predeterminado.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Llama a `ICacheManager.clear()`. Su alcance depende del driver y namespace configurados; no acepta nombre de store. Devuelve `0` si el servicio confirma la limpieza y `1` si devuelve falso o produce un error de backend reconocido. Errores ajenos a esas familias se propagan.

```shell
orionis clear:cache
python -B reactor clear:cache
```

<a id="command-clear-logs"></a>

## clear:logs

Elimina los archivos de log del framework.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Cierra primero `ILogger`, borra `.log` y `.log.gz` bajo `storage_logs`, y atiende también rutas `path` de canales configurados fuera de ese directorio (incluidos sufijos dinámicos en el nombre). Un directorio dinámico con `{suffix}` no se limpia y se informa como error. Muestra cantidad eliminada y devuelve `1` si alguna ruta falla.

```shell
orionis clear:logs
python -B reactor clear:logs
```

<a id="command-clear-testing"></a>

## clear:testing

Borra los resultados de pruebas guardados en caché.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Elimina recursivamente archivos `.json` de `storage_framework/cache/testing`. No borra archivos de pruebas ni inicia el runner. Informa el conteo y devuelve `1` si hubo errores de eliminación.

```shell
orionis clear:testing
python -B reactor clear:testing
```

<a id="command-clear-views"></a>

## clear:views

Elimina bytecode de las vistas compiladas.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Lee `view.cache_path` y borra recursivamente los archivos terminados en `.cache` de ese directorio. Una ruta relativa se resuelve desde la raíz de la aplicación. Si el valor es `None`, informa que la caché de vistas está desactivada y devuelve `0`; un tipo de ruta inválido o errores de eliminación devuelven `1`. No elimina las plantillas fuente.

```shell
orionis clear:views
python -B reactor clear:views
```

<a id="command-down"></a>

## down

Activa el estado de mantenimiento HTTP.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Escribe `down` en `storage_framework/maintenance`, mediante archivo temporal y reemplazo protegido por `FileLock`. El middleware HTTP consulta ese marcador compartido. No detiene el proceso HTTP ni workers de colas/scheduler. Devuelve `0` al guardar o `1` ante un error de filesystem.

```shell
orionis down
python -B reactor down
```

<a id="command-env"></a>

## env

Muestra el entorno de la aplicación.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Lee `app.env` de la configuración y lo imprime. No recibe un nombre de entorno ni modifica `.env`.

```shell
orionis env
python -B reactor env
```

<a id="command-key-generate"></a>

## key:generate

Genera y guarda la clave de cifrado de la aplicación.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--force` | Bandera, opcional | `False` | Omitir confirmación (db:wipe) o reemplazar APP_KEY (key:generate). |

Lee `app.cipher` (fallback `AES_256_CBC`), genera una clave válida y la guarda mediante `Env.set("APP_KEY", ...)`. Si ya hay `APP_KEY`, la conserva y devuelve `0`; `--force` (`False` por defecto) permite reemplazarla al activarlo. Un fallo al guardar devuelve `1`. Reemplazar una clave afecta a los datos cifrados con la anterior: revisa la guía de cifrado antes de usar `--force` en una aplicación existente.

```shell
orionis key:generate
python -B reactor key:generate
```

<a id="command-list"></a>

## list

Lista el registro de comandos cargado por Reactor.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Muestra las firmas y descripciones de comandos nativos, comandos descubiertos en la aplicación y comandos definidos por rutas. No recibe filtros ni nombres de comando como argumentos. Para opciones de una firma, ejecuta esa firma con `--help`.

```shell
orionis list
python -B reactor list
```

<a id="command-optimize"></a>

## optimize

Valida la sintaxis Python del proyecto.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Recorre archivos `.py` del proyecto y los compila en memoria con `optimize=2`. No importa los módulos, no ejecuta pruebas, no produce bytecode ni precalienta cachés de servicios. Excluye entornos virtuales, `.git`, cachés habituales, `node_modules`, `build`, `dist` y directorios `*.egg-info`. Devuelve `1` ante errores de lectura, recorrido o compilación y `0` si valida todo.

```shell
orionis optimize
python -B reactor optimize
```

<a id="command-optimize-clear"></a>

## optimize:clear

Elimina los artefactos compilados de la aplicación.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Borra directorios `__pycache__`, archivos `.pyc` / `.pyo`, los directorios raíz `build`, `dist` y `*.egg-info`, y los archivos de caché `config`, `commands` y `routes` bajo `app.compiledPath` (o `storage_framework/cache` si no está configurado). Excluye entornos virtuales y dependencias del recorrido de bytecode. No limpia el contenido de todos los stores de caché: para el store predeterminado existe `clear:cache`. Informa cada grupo de limpieza; devuelve `1` si alguna eliminación falla, `0` en caso contrario. No ofrece `--dry-run`.

```shell
orionis optimize:clear
python -B reactor optimize:clear
```

<a id="command-packages"></a>

## packages

Instala extras y grupos opcionales del catálogo de Orionis.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `options` | str, opcional | `[]` | Cero o más nombres/números del catálogo. Cantidad: cero o más. |
| `--list` | Bandera, opcional | `False` | Mostrar catálogo sin instalar. |
| `--yes` / `-y` | Bandera, opcional | `False` | Omitir confirmación de instalación. |

`options` consume cero o más nombres o números del catálogo. Acepta nombres simples no ambiguos, `extra:NOMBRE`, `group:NOMBRE`, números de la lista y selección separada por espacios o comas. `--list` (`False` por defecto) muestra el catálogo sin instalar al activarlo. `--yes` / `-y` (`False` por defecto) evita la confirmación. Sin selección, una terminal interactiva pregunta qué instalar (`0` cancela); sin terminal informa que deben pasarse nombres. Con selección y sin terminal se exige `--yes`.

El manifiesto se busca primero empaquetado en Orionis, después en la raíz del framework source/editable y finalmente en la aplicación. Se leen `[project.optional-dependencies]`, `[dependency-groups]` (también inclusiones de grupos, con detección de ciclos) y textos de `[tool.orionis.packages]`. Se deduplican requisitos conservando sus marcadores.

Ejecuta `uv pip install --python <intérprete actual> -- <requisitos>` sin shell. Requiere `uv` en PATH y conectividad cuando los paquetes no estén disponibles localmente. Cambia ese entorno, sin reescribir el manifiesto ni el lockfile. Devuelve el código positivo del instalador, `1` si falta `uv`/hay un error y `130` ante interrupción. Para reproducibilidad, declara las dependencias requeridas en el proyecto y actualiza su lockfile.

```shell
orionis packages --list
python -B reactor packages --list
```

<a id="command-route-list"></a>

## route:list

Inspecciona las rutas HTTP registradas.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Carga las rutas con `RouteLoader` y muestra método, URI, nombre, acción y middleware compilados, ordenadas por ruta. No admite filtros `--path`, `--method` ni formato JSON. Si no hay rutas, informa el problema y devuelve `1`; con rutas devuelve `0`.

```shell
orionis route:list
python -B reactor route:list
```

<a id="command-serve"></a>

## serve

Inicia el servidor HTTP Granian de la aplicación.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--interface` / `-i` | str, opcional | `rsgi` | Interfaz HTTP del servidor. Valores: `rsgi`, `asgi`. |
| `--port` / `-p` | int, opcional | `8000` | Puerto TCP; entero. |
| `--log` | Bandera, opcional | `False` | Activar el logging del servidor a nivel info. |
| `--export` | Bandera, opcional | `False` | Imprimir el comando Granian resuelto sin iniciarlo. |

`--interface` / `-i` acepta `rsgi` o `asgi`, con `rsgi` como elección efectiva predeterminada. `--port` / `-p` es entero; en ejecución normal el puerto predeterminado es `8000`. `--log` activa nivel `info`; sin esa bandera se usa `error` en producción y se desactiva el log del servidor en desarrollo. `--export` imprime el comando Granian resuelto y termina sin iniciar el servidor.

En el modo normal se escucha en `127.0.0.1` fuera de producción y `0.0.0.0` en producción; el CLI no expone `--host`. Windows usa un worker y loop `auto`; otros sistemas usan el número de CPU y `uvloop`. El reload se activa fuera de producción cuando hay directorios observables válidos; las rutas con espacios se excluyen de ese conjunto. El montaje estático procede del disco `public` de `filesystems`.

En Windows con depurador activo se utiliza el servidor embebido: en esa variante host y puerto omitidos se leen de `app.host` y `app.port` antes de los defaults. Estos valores no sustituyen el comportamiento de la ejecución normal.

```shell
orionis serve --interface asgi --port 8001
python -B reactor serve --interface asgi --port 8001
```

<a id="command-test"></a>

## test

Ejecuta las pruebas de la aplicación.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `--verbosity` / `-v` | int, opcional | `testing.verbosity` | Detalle de resultados: 0, 1 o 2. |
| `--fail-fast` / `-f` | int, opcional | `testing.fail_fast` | 1 detiene ante el primer fallo; 0 continúa. |
| `--start-dir` / `-s` | str, opcional | `testing.start_dir` | Directorio inicial para descubrir pruebas. |
| `--file-pattern` | str, opcional | `testing.file_pattern` | Patrón de nombres de archivos de prueba. |
| `--method-pattern` | str, opcional | `testing.method_pattern` | Patrón de nombres de métodos de prueba. |
| `--panel` | Bandera, opcional | `True` | Activar/desactivar paneles de resultados. |
| `--no-panel` | Bandera, opcional | `True` | Activar/desactivar paneles de resultados. |

Las opciones de selección omitidas se resuelven desde `config/testing.py`: `verbosity` (`2` en la configuración base), `fail_fast` (`False`), `start_dir` (`tests`), `file_pattern` (`test_*.py`) y `method_pattern` (`test*`). `--verbosity` / `-v` acepta `0`, `1` o `2` y rechaza otros enteros. `--fail-fast` / `-f` recibe un entero, no es una bandera: usa `1` para detenerse al primer fallo y `0` para continuar. `--start-dir` / `-s`, `--file-pattern` y `--method-pattern` son cadenas. `--panel` mantiene el panel; `--no-panel` lo desactiva y no consume valor. Se devuelve `1` si algún resultado es fallido o erróneo, y `0` en los demás casos.

```shell
orionis test --start-dir tests --file-pattern "test_*.py" --method-pattern "test*" --verbosity 2 --fail-fast 0 --no-panel
python -B reactor test --start-dir tests --file-pattern "test_*.py" --method-pattern "test*" --verbosity 2 --fail-fast 0 --no-panel
```

<a id="command-up"></a>

## up

Desactiva el estado de mantenimiento HTTP.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Escribe `up` en el mismo marcador compartido de mantenimiento; no elimina el archivo ni reinicia procesos. Usa el mismo reemplazo protegido que `down` y devuelve `0` / `1` según el resultado.

```shell
orionis up
python -B reactor up
```

Para el funcionamiento de los servicios relacionados consulta [Cache](/es/services/cache), [Vistas](/es/services/views), [Cifrado](/es/security/encryption) y [Testing](/es/testing). La [caché de comandos](/es/console/command-cache) explica cuándo se reconstruye el registro de Reactor.
