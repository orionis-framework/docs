---
title: "Comandos incluidos"
description: "Catálogo completo de los 67 comandos nativos de Orionis, organizado por tarea y vinculado a cada referencia de argumentos y opciones."
editUrl: true
lastUpdated: false
---

El registro nativo de Reactor incluye **67 comandos**. Las referencias de esta sección cubren sus argumentos, opciones, valores predeterminados, efectos y ejemplos de ejecución. La aplicación puede incorporar firmas adicionales mediante clases y [rutas de consola](/es/console/command-routing).

Ejecuta los comandos desde la raíz del proyecto. El comando directo y el archivo local comparten el mismo registro y ciclo de ejecución:

```shell
orionis list
python -B reactor list

orionis make:console-command --help
python -B reactor make:console-command --help
```

`list` muestra las firmas registradas; `COMANDO --help` consulta el parser de una firma sin ejecutar su operación. `-h` es su forma corta. Las opciones y aliases que se muestran en cada página son los realmente definidos, incluidos los heredados por los generadores y los comandos Database. Las opciones largas no se abrevian.

## Elegir la referencia

| Familia | Cantidad | Contenido |
|---|---|---|
| [Generadores de código](/es/console/built-in-generators) | 24 | Crear los 24 componentes disponibles mediante stubs. |
| [Comandos de aplicación y mantenimiento](/es/console/built-in-application) | 16 | Servidor, pruebas, inspección, limpieza, claves y paquetes. |
| [Comandos de bases de datos](/es/console/built-in-database) | 11 | Inspección, migraciones, reversión, seeders y borrado. |
| [Comandos de workers y scheduler](/es/console/built-in-workers) | 9 | Workers de colas, operaciones sobre fallos, scheduler y MCP. |
| [Bootstrap y recuperación del proyecto](/es/console/built-in-bootstrap) | 7 | Habilitar contextos y recuperar configuración faltante. |

## Índice de firmas

Cada enlace lleva a las opciones y ejemplos completos de ese comando.

| Comando | Propósito |
|---|---|
| [`about`](/es/console/built-in-application#command-about) | Muestra metadatos del framework instalado. |
| [`bootstrap:ai`](/es/console/built-in-bootstrap#command-bootstrap-ai) | Habilita rutas de servidores MCP. |
| [`bootstrap:api`](/es/console/built-in-bootstrap#command-bootstrap-api) | Habilita el contexto de rutas API. |
| [`bootstrap:config`](/es/console/built-in-bootstrap#command-bootstrap-config) | Restaura archivos oficiales de configuración faltantes. |
| [`bootstrap:console`](/es/console/built-in-bootstrap#command-bootstrap-console) | Habilita rutas y directorios de consola. |
| [`bootstrap:lifespan`](/es/console/built-in-bootstrap#command-bootstrap-lifespan) | Crea e integra callbacks del ciclo de vida. |
| [`bootstrap:web`](/es/console/built-in-bootstrap#command-bootstrap-web) | Habilita el contexto de rutas web. |
| [`bootstrap:websocket`](/es/console/built-in-bootstrap#command-bootstrap-websocket) | Habilita las rutas WebSocket. |
| [`clear:cache`](/es/console/built-in-application#command-clear-cache) | Vacía el store de caché predeterminado. |
| [`clear:logs`](/es/console/built-in-application#command-clear-logs) | Elimina los archivos de log del framework. |
| [`clear:testing`](/es/console/built-in-application#command-clear-testing) | Borra los resultados de pruebas guardados en caché. |
| [`clear:views`](/es/console/built-in-application#command-clear-views) | Elimina bytecode de las vistas compiladas. |
| [`db:seed`](/es/console/built-in-database#command-db-seed) | Ejecuta los seeders pendientes. |
| [`db:show`](/es/console/built-in-database#command-db-show) | Inspecciona la base y resume sus tablas. |
| [`db:table`](/es/console/built-in-database#command-db-table) | Muestra la estructura de una tabla. |
| [`db:wipe`](/es/console/built-in-database#command-db-wipe) | Elimina los objetos de usuario de una base de datos. |
| [`down`](/es/console/built-in-application#command-down) | Activa el estado de mantenimiento HTTP. |
| [`env`](/es/console/built-in-application#command-env) | Muestra el entorno de la aplicación. |
| [`key:generate`](/es/console/built-in-application#command-key-generate) | Genera y guarda la clave de cifrado de la aplicación. |
| [`list`](/es/console/built-in-application#command-list) | Lista el registro de comandos cargado por Reactor. |
| [`make:console-command`](/es/console/built-in-generators#command-make-console-command) | Crea un comando con firma única y descripción. |
| [`make:console-listener`](/es/console/built-in-generators#command-make-console-listener) | Crea un listener de tareas de consola. |
| [`make:contract`](/es/console/built-in-generators#command-make-contract) | Genera un contrato de servicio. |
| [`make:database-migration`](/es/console/built-in-generators#command-make-database-migration) | Crea una migración con marca de tiempo. |
| [`make:database-schema`](/es/console/built-in-generators#command-make-database-schema) | Genera una definición de tabla reutilizable. |
| [`make:database-seeder`](/es/console/built-in-generators#command-make-database-seeder) | Genera un seeder de base de datos. |
| [`make:facade`](/es/console/built-in-generators#command-make-facade) | Genera una fachada y su interfaz de tipos. |
| [`make:factory`](/es/console/built-in-generators#command-make-factory) | Genera una factory asociada a un modelo. |
| [`make:http-controller`](/es/console/built-in-generators#command-make-http-controller) | Crea un controlador resource o invokable. |
| [`make:http-middleware`](/es/console/built-in-generators#command-make-http-middleware) | Genera un middleware HTTP. |
| [`make:http-schema`](/es/console/built-in-generators#command-make-http-schema) | Crea un esquema de validación HTTP. |
| [`make:http-schema-rule`](/es/console/built-in-generators#command-make-http-schema-rule) | Genera una regla de validación personalizada. |
| [`make:job`](/es/console/built-in-generators#command-make-job) | Crea un job asíncrono de colas. |
| [`make:mail`](/es/console/built-in-generators#command-make-mail) | Crea una clase de correo reutilizable. |
| [`make:mcp-prompt`](/es/console/built-in-generators#command-make-mcp-prompt) | Genera un prompt MCP. |
| [`make:mcp-resource`](/es/console/built-in-generators#command-make-mcp-resource) | Genera un recurso MCP. |
| [`make:mcp-server`](/es/console/built-in-generators#command-make-mcp-server) | Genera un servidor MCP. |
| [`make:mcp-tool`](/es/console/built-in-generators#command-make-mcp-tool) | Genera una herramienta MCP. |
| [`make:model`](/es/console/built-in-generators#command-make-model) | Crea un modelo del ORM. |
| [`make:provider`](/es/console/built-in-generators#command-make-provider) | Crea un provider eager o diferido. |
| [`make:realtime-hub`](/es/console/built-in-generators#command-make-realtime-hub) | Crea un hub de métodos remotos. |
| [`make:realtime-socket`](/es/console/built-in-generators#command-make-realtime-socket) | Crea un handler WebSocket de Realtime. |
| [`make:service`](/es/console/built-in-generators#command-make-service) | Genera una clase de servicio. |
| [`make:test`](/es/console/built-in-generators#command-make-test) | Crea un caso de prueba de la aplicación. |
| [`mcp:list`](/es/console/built-in-workers#command-mcp-list) | Lista servidores MCP HTTP y locales. |
| [`mcp:start`](/es/console/built-in-workers#command-mcp-start) | Inicia un servidor MCP local mediante STDIO. |
| [`migrate`](/es/console/built-in-database#command-migrate) | Aplica migraciones pendientes y puede ejecutar seeders. |
| [`migrate:fresh`](/es/console/built-in-database#command-migrate-fresh) | Reconstruye el historial y vuelve a aplicar migraciones. |
| [`migrate:refresh`](/es/console/built-in-database#command-migrate-refresh) | Revierte lotes y aplica de nuevo las migraciones pendientes. |
| [`migrate:reset`](/es/console/built-in-database#command-migrate-reset) | Revierte todas las migraciones aplicadas. |
| [`migrate:rollback`](/es/console/built-in-database#command-migrate-rollback) | Revierte el lote más reciente o varios lotes. |
| [`migrate:status`](/es/console/built-in-database#command-migrate-status) | Muestra migraciones aplicadas y pendientes. |
| [`optimize`](/es/console/built-in-application#command-optimize) | Valida la sintaxis Python del proyecto. |
| [`optimize:clear`](/es/console/built-in-application#command-optimize-clear) | Elimina los artefactos compilados de la aplicación. |
| [`packages`](/es/console/built-in-application#command-packages) | Instala extras y grupos opcionales del catálogo de Orionis. |
| [`queue:clear`](/es/console/built-in-workers#command-queue-clear) | Vacía una cola, incluidos jobs retrasados o reservados. |
| [`queue:failed`](/es/console/built-in-workers#command-queue-failed) | Lista los jobs con fallo terminal. |
| [`queue:forget`](/es/console/built-in-workers#command-queue-forget) | Elimina un registro de fallo. |
| [`queue:retry`](/es/console/built-in-workers#command-queue-retry) | Reenvía un job fallido identificado. |
| [`queue:work`](/es/console/built-in-workers#command-queue-work) | Consume jobs persistidos en una conexión de colas. |
| [`route:list`](/es/console/built-in-application#command-route-list) | Inspecciona las rutas HTTP registradas. |
| [`schedule:list`](/es/console/built-in-workers#command-schedule-list) | Inspecciona las tareas definidas por el scheduler. |
| [`schedule:work`](/es/console/built-in-workers#command-schedule-work) | Inicia el proceso del scheduler. |
| [`seed`](/es/console/built-in-database#command-seed) | Ejecuta los seeders pendientes. |
| [`serve`](/es/console/built-in-application#command-serve) | Inicia el servidor HTTP Granian de la aplicación. |
| [`test`](/es/console/built-in-application#command-test) | Ejecuta las pruebas de la aplicación. |
| [`up`](/es/console/built-in-application#command-up) | Desactiva el estado de mantenimiento HTTP. |

## Interpretar resultados

Reactor devuelve el entero retornado por `handle()`; un retorno que no es entero se convierte en `0`. Una excepción no capturada pasa al manejador de fallos de consola y produce `1`. El parser termina con `0` al pedir ayuda y `2` ante un error de argumentos.

No todos los comandos convierten sus errores internos en una excepción o en un retorno `1`: los generadores comunes imprimen ciertos errores y retornan `None`. Sus páginas explican esta limitación y los códigos específicos de comandos como `packages`, `test`, `db:wipe` y workers. Usa conjuntamente la salida del comando, su código y el resultado esperado.

Para encadenar comandos desde código e inyectar servicios consulta la guía de [Reactor y ejecución programática](/es/console/output-and-programmatic-execution).
