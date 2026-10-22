---
title: "Comandos incluidos"
description: "Ejecuta estos comandos desde la raíz del proyecto generado:"
editUrl: true
lastUpdated: false
---

## Encontrar el comando para tu tarea

Ejecuta estos comandos desde la raíz del proyecto generado:

| Tarea | Comando | Resultado |
|---|---|---|
| Listar comandos | `uv run python -B reactor list` | Registro y descripciones. |
| Inspeccionar rutas | `uv run python -B reactor route:list` | Metadatos de rutas registradas. |
| Iniciar HTTP en desarrollo | `uv run python -B reactor serve` | Servidor que permanece activo. |
| Consultar migraciones | `uv run python -B reactor migrate:status` | Migraciones aplicadas y pendientes. |
| Ejecutar pruebas | `uv run python -B reactor test` | Resultados y código de salida. |
| Inspeccionar agenda | `uv run python -B reactor schedule:list` | Tareas programadas registradas. |
| Consultar opciones | `uv run python -B reactor serve --help` | Ayuda sin iniciar HTTP. |

Los comandos con efectos persistentes necesitan la configuración y dependencias de sus servicios. Los ejemplos terminados en `--help` solo muestran ayuda; quita esa opción cuando quieras crear o modificar un componente.

El registro incluido se define en `orionis/console/core/commands.py`; la aplicación puede añadir comandos propios. Consulta `uv run python -B reactor list` y la ayuda de cada firma antes de operaciones con efectos persistentes. Esta guía organiza el catálogo por tarea, no reemplaza los argumentos específicos de cada ayuda.

## Crear componentes

Los generadores `make:console-command`, `make:model`, `make:factory`, `make:job`, `make:mail`, generadores HTTP, providers, facades, servicios, contratos, tests y MCP utilizan stubs y rutas de aplicación. La firma de cada generador se puede consultar en `list`; no deduzcas opciones de comandos con nombres similares de otro framework.

```shell
uv run python -B reactor make:job SendWelcomeEmail --help
uv run python -B reactor make:factory ProductFactory --help
```

Generar un modelo no migra su tabla; generar un job no inicia workers. Revisa los imports, dependencias y configuración del componente generado antes de usarlo.

## Evolucionar datos

Consulta la [Referencia de comandos de Database](/es/database/commands) para todos los argumentos, defaults y ejemplos de inspección, generadores, migraciones, seeders y borrado.

`migrate`, `migrate:status`, `migrate:rollback`, `migrate:reset`, `migrate:refresh`, `migrate:fresh`, `seed` y `db:seed` se explican en [migraciones y seeders](/es/database/migrations-and-seeders). Comparten `--database`/`-d` para seleccionar conexión. Rollback `--step` cuenta lotes. `db:show` muestra información de la base; `db:table` inspecciona tablas; `db:wipe` elimina datos estructurales según su flujo y exige cuidado operativo.

```shell
uv run python -B reactor migrate:status --database sqlite
uv run python -B reactor db:show --help
uv run python -B reactor db:table --help
```

No programes `migrate:fresh`, `db:wipe` ni `queue:clear` como mantenimiento rutinario de producción. Borran datos o trabajo pendiente; no equivalen a limpieza de registros completados.

## Servir, inspeccionar y probar

`serve` inicia el servidor de desarrollo según los argumentos disponibles; revisa [HTTP](/es/http) para el ciclo web. `route:list` inspecciona rutas registradas. `test` ejecuta el sistema de pruebas de Orionis; su modo y selección pertenecen a [Testing](/es/testing). Las tareas de desarrollo y workers son procesos de larga duración: necesitan supervisión si se usan en un entorno operativo.

`schedule:list` y `schedule:work` pertenecen al [scheduler](/es/console/task-scheduling). `queue:work`, `queue:failed`, `queue:retry`, `queue:forget` y `queue:clear` operan [colas](/es/asynchronous/queues/workers-and-failures). Los comandos MCP se documentan en [MCP](/es/protocols/mcp).

## Optimizar y mantener

- `optimize` valida en memoria la sintaxis del código Python; no precarga cachés, ejecuta pruebas ni escribe bytecode.
- `optimize:clear` elimina cachés compiladas de configuración, rutas y comandos, bytecode de Python y artefactos `build`/`dist` del proyecto. Revisa esas ubicaciones antes de limpiarlas.
- `about` y `env` muestran información de aplicación y entorno.
- `down` y `up` establecen el marcador compartido de mantenimiento; no detienen los procesos worker.
- `clear:cache`, `clear:logs`, `clear:views` y `clear:testing` limpian sus artefactos correspondientes; consulta la ayuda y la configuración del servicio.
- `key:generate` genera una clave de cifrado de aplicación. Coordina cambios en una aplicación existente con [cifrado](/es/security/encryption), porque los datos cifrados dependen de la clave anterior.

## Instalar extras desde el catálogo

La firma pública es `packages`, aunque la clase de implementación se llame `InstallCommand`:

```shell
uv run python -B reactor packages --list
uv run python -B reactor packages s3 redshift --yes
uv run python -B reactor packages group:dev --yes
```

`--list` solo muestra el catálogo; los otros ejemplos instalan paquetes con `uv` para el intérprete que ejecuta Orionis. `--yes` suprime confirmación interactiva.

El comando usa primero el manifiesto empaquetado `orionis/pyproject.toml`, después el manifiesto raíz del framework en instalaciones source/editable y, como fallback, el manifiesto raíz de la aplicación. Los textos de propósito provienen de `[tool.orionis.packages]`, con claves `extra:s3` o `group:dev`. Respeta extras, marcadores, grupos y deduplicación; no reescribe el manifiesto ni lockfile de la aplicación. Si falta un catálogo esperado, verifica qué manifiesto está disponible y el entorno Python activo.

Para reproducir las dependencias del proyecto, declara también los extras necesarios de Orionis en el `pyproject.toml` de la aplicación y actualiza su lockfile. `packages` modifica solo el entorno en ejecución; una sincronización posterior sigue el manifiesto y el lockfile, no esa instalación manual.
