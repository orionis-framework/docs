---
title: "Generadores de código"
description: "Referencia de los 24 comandos make: incluidos: archivos, argumentos, opciones y comportamiento de generación."
editUrl: true
lastUpdated: false
---

Los generadores crean archivos a partir de los stubs incluidos en Orionis. Se ejecutan desde la raíz de la aplicación y usan sus rutas efectivas; los directorios de esta guía son los valores predeterminados del framework.

Todos reciben `name` como cadena posicional obligatoria y `-h` / `--help` para consultar ayuda. Solo los comandos que lo indican tienen opciones adicionales. **Ninguno ofrece sobrescritura ni `--force`**: se crea el archivo de manera exclusiva y un destino existente produce un error.

El stub común acepta `/` y `\` como separadores, crea subdirectorios y normaliza los directorios/nombres de archivo a minúsculas. Las palabras separadas por `_` forman el nombre de clase y cada generador agrega su prefijo/sufijo cuando corresponde. Por ejemplo, `sales/report_export` con `make:console-command` produce `app/console/commands/sales/report_export_command.py` y `ReportExportCommand`. **No separa CamelCase en snake_case**: `ReportExport` produce `reportexport_command.py`. El generador de factories tiene su propia normalización, descrita más abajo.

Los nombres absolutos, componentes vacíos, `.` / `..`, guiones y componentes que no cumplan el formato de módulos admitido se rechazan. Los errores de filesystem o de nombres se imprimen. En el generador común y en `make:console-command`, esos errores se capturan y `handle()` devuelve `None`; por ello el código de salida puede ser `0` aunque la generación haya fallado. Comprueba el mensaje y el archivo generado antes de continuar.

<a id="command-make-console-command"></a>

## make:console-command

Crea un comando con firma única y descripción.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |
| `--signature` / `-s` | str, obligatorio | — | Firma única de registro del comando. |
| `--description` / `-d` | str, opcional | `A custom console command.` | Descripción breve incluida en la ayuda. |

`--signature` / `-s` es obligatorio y debe cumplir el formato de firma del CLI; también se comprueba que Reactor no tenga ya esa firma. `--description` / `-d` es opcional; al omitirlo se escribe `A custom console command.`. El archivo deriva de `console_command.stub`; su método `handle()` es el punto de entrada.

**Destino predeterminado:** `app/console/commands`. Sufijo de clase/archivo: `Command`.

```shell
orionis make:console-command reports/export --signature reports:export --description "Export reports"
python -B reactor make:console-command reports/export --signature reports:export --description "Export reports"
```

<a id="command-make-console-listener"></a>

## make:console-listener

Crea un listener de tareas de consola.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Genera la estructura de listener de eventos de ejecución de comandos. Su creación no lo registra automáticamente en una tarea.

**Destino predeterminado:** `app/console/listeners`. Sufijo de clase/archivo: `Listener`.

```shell
orionis make:console-listener report_events
python -B reactor make:console-listener report_events
```

<a id="command-make-contract"></a>

## make:contract

Genera un contrato de servicio.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Aplica el prefijo `I` a la clase cuando todavía no empieza por él; no antepone ese prefijo al nombre del archivo. `report_store` produce `report_store.py` con `IReportStore`.

**Destino predeterminado:** `app/contracts`. Sufijo de clase/archivo: ninguno.

```shell
orionis make:contract report_store
python -B reactor make:contract report_store
```

<a id="command-make-database-migration"></a>

## make:database-migration

Crea una migración con marca de tiempo.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Añade `mYYYYMMDDHHMMSS_` al archivo usando `DateTime.now()` y deriva la clase del nombre sin esa marca. Admite subdirectorios. No ejecuta la migración ni agrega opciones de tabla; las operaciones se escriben en `up()` / `down()`. Generar el mismo nombre durante el mismo segundo puede encontrar un archivo ya existente.

**Destino predeterminado:** `database/migrations`. Sufijo de clase/archivo: ninguno.

```shell
orionis make:database-migration create_products
python -B reactor make:database-migration create_products
```

<a id="command-make-database-schema"></a>

## make:database-schema

Genera una definición de tabla reutilizable.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `database_schema.stub` y el sufijo `Schema`. La definición debe ser utilizada por una migración o por la API de esquemas; crear el archivo no crea una tabla.

**Destino predeterminado:** `database/schemas`. Sufijo de clase/archivo: `Schema`.

```shell
orionis make:database-schema products
python -B reactor make:database-schema products
```

<a id="command-make-database-seeder"></a>

## make:database-seeder

Genera un seeder de base de datos.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `database_seeder.stub` y el sufijo `Seeder`; no lo ejecuta. `seed` / `db:seed` operan sobre seeders pendientes.

**Destino predeterminado:** `database/seeders`. Sufijo de clase/archivo: `Seeder`.

```shell
orionis make:database-seeder catalog
python -B reactor make:database-seeder catalog
```

<a id="command-make-facade"></a>

## make:facade

Genera una fachada y su interfaz de tipos.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |
| `--accessor` / `-a` | str, obligatorio | — | Identificador de servicio del contenedor. |

`--accessor` / `-a` es una cadena obligatoria con el identificador del servicio del contenedor. Se crean dos archivos del mismo nombre: `.py` y `.pyi`. El generador no registra el servicio. Las escrituras son secuenciales: si falla el segundo archivo, el primero puede haber sido creado.

**Destino predeterminado:** `app/facades`. Sufijo de clase/archivo: ninguno.

```shell
orionis make:facade reporting --accessor app.reporting
python -B reactor make:facade reporting --accessor app.reporting
```

<a id="command-make-factory"></a>

## make:factory

Genera una factory asociada a un modelo.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |
| `--model` / `-m` | str, opcional | Inferido del nombre | Modelo de la factory, relativo al directorio de modelos. |

`--model` / `-m` es opcional. Si se omite, infiere el modelo retirando `Factory` del nombre de clase y conservando los subdirectorios. A diferencia del stub común, separa CamelCase/acrónimos al normalizar los módulos a snake_case. `sales/OrderFactory` genera `sales/order_factory.py`. Valida identificadores Python y palabras reservadas; la ruta de modelos debe formar un paquete importable dentro del proyecto. No crea el modelo al que apunta el import.

**Destino predeterminado:** `database/factories`. Sufijo de clase/archivo: `Factory`.

```shell
orionis make:factory sales/OrderFactory --model sales/Order
python -B reactor make:factory sales/OrderFactory --model sales/Order
```

<a id="command-make-http-controller"></a>

## make:http-controller

Crea un controlador resource o invokable.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |
| `--invoke` | Bandera, opcional | `False` | Generar una sola acción __call__. |
| `--api` | Bandera, opcional | `False` | Usar import y anotaciones JSONResponse. |

Por defecto genera `index`, `create`, `store`, `show`, `edit`, `update` y `destroy`. `--invoke` (`False` por defecto) cambia esa estructura por una sola acción `__call__` cuando se activa. `--api` (`False` por defecto) cambia el import y las anotaciones de retorno de `HttpResponse` a `JSONResponse`; se puede combinar con `--invoke`. Las acciones generadas contienen documentación y todavía deben implementarse: la anotación no construye una respuesta ni convierte valores por sí sola.

**Destino predeterminado:** `app/http/request-lifecycle`. Sufijo de clase/archivo: `Controller`.

```shell
orionis make:http-controller user --invoke --api
python -B reactor make:http-controller user --invoke --api
```

<a id="command-make-http-middleware"></a>

## make:http-middleware

Genera un middleware HTTP.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `http_middleware.stub`, con `BaseMiddleware` y `handle(request, call_next)`. El archivo no queda asignado automáticamente a rutas o middleware globales.

**Destino predeterminado:** `app/http/middleware`. Sufijo de clase/archivo: `Middleware`.

```shell
orionis make:http-middleware measure_latency
python -B reactor make:http-middleware measure_latency
```

<a id="command-make-http-schema"></a>

## make:http-schema

Crea un esquema de validación HTTP.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `http_schema.stub`. Completa sus campos y reglas antes de inyectarlo en una acción.

**Destino predeterminado:** `app/http/schemas`. Sufijo de clase/archivo: `Schema`.

```shell
orionis make:http-schema create_order
python -B reactor make:http-schema create_order
```

<a id="command-make-http-schema-rule"></a>

## make:http-schema-rule

Genera una regla de validación personalizada.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `http_schema_rule.stub` y el sufijo `Rule`. Implementa el criterio de `enforce(field, value, instance)`; el stub usa un método síncrono y solo produce la estructura de la regla.

**Destino predeterminado:** `app/http/schemas/rules`. Sufijo de clase/archivo: `Rule`.

```shell
orionis make:http-schema-rule valid_reference
python -B reactor make:http-schema-rule valid_reference
```

<a id="command-make-job"></a>

## make:job

Crea un job asíncrono de colas.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `job.stub` y el sufijo `Job`. No despacha el job ni inicia un worker; completa su estado serializable y `handle()` antes de enviarlo.

**Destino predeterminado:** `app/jobs`. Sufijo de clase/archivo: `Job`.

```shell
orionis make:job generate_report
python -B reactor make:job generate_report
```

<a id="command-make-mail"></a>

## make:mail

Crea una clase de correo reutilizable.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `mail.stub` bajo el directorio de notificaciones. No envía correos al generar el archivo.

**Destino predeterminado:** `app/notifications`. Sufijo de clase/archivo: `Mail`.

```shell
orionis make:mail welcome
python -B reactor make:mail welcome
```

<a id="command-make-mcp-prompt"></a>

## make:mcp-prompt

Genera un prompt MCP.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `mcp_prompt.stub` y el sufijo `Prompt`. Completa sus argumentos y mensajes y regístralo en un servidor.

**Destino predeterminado:** `app/mcp/prompts`. Sufijo de clase/archivo: `Prompt`.

```shell
orionis make:mcp-prompt summarize_catalog
python -B reactor make:mcp-prompt summarize_catalog
```

<a id="command-make-mcp-resource"></a>

## make:mcp-resource

Genera un recurso MCP.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `mcp_resource.stub` y el sufijo `Resource`. El archivo no queda expuesto hasta registrarlo en un servidor.

**Destino predeterminado:** `app/mcp/resources`. Sufijo de clase/archivo: `Resource`.

```shell
orionis make:mcp-resource catalog
python -B reactor make:mcp-resource catalog
```

<a id="command-make-mcp-server"></a>

## make:mcp-server

Genera un servidor MCP.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `mcp_server.stub` y el sufijo `Server`. El servidor debe registrarse después con sus componentes y transporte.

**Destino predeterminado:** `app/mcp/servers`. Sufijo de clase/archivo: `Server`.

```shell
orionis make:mcp-server catalog
python -B reactor make:mcp-server catalog
```

<a id="command-make-mcp-tool"></a>

## make:mcp-tool

Genera una herramienta MCP.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `mcp_tool.stub` y el sufijo `Tool`. Completa la herramienta y añádela al servidor correspondiente.

**Destino predeterminado:** `app/mcp/tools`. Sufijo de clase/archivo: `Tool`.

```shell
orionis make:mcp-tool search_catalog
python -B reactor make:mcp-tool search_catalog
```

<a id="command-make-model"></a>

## make:model

Crea un modelo del ORM.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Utiliza `model.stub`, sin agregar un sufijo a la clase. No crea migraciones, tablas ni factories automáticamente.

**Destino predeterminado:** `app/models`. Sufijo de clase/archivo: ninguno.

```shell
orionis make:model product
python -B reactor make:model product
```

<a id="command-make-provider"></a>

## make:provider

Crea un provider eager o diferido.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |
| `--deferred` | Bandera, opcional | `False` | Seleccionar el stub de provider diferido. |

`--deferred` es una bandera opcional, `False` por defecto. Selecciona `provider_deferred.stub` en lugar de `provider_eager.stub`. La generación del archivo no lo incorpora por sí misma a la lista de providers de la aplicación.

**Destino predeterminado:** `app/providers`. Sufijo de clase/archivo: `Provider`.

```shell
orionis make:provider reporting --deferred
python -B reactor make:provider reporting --deferred
```

<a id="command-make-realtime-hub"></a>

## make:realtime-hub

Crea un hub de métodos remotos.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `realtime_hub.stub` y el sufijo `Hub`. No inicia conexiones ni registra automáticamente el hub en un endpoint.

**Destino predeterminado:** `app/realtime/hubs`. Sufijo de clase/archivo: `Hub`.

```shell
orionis make:realtime-hub chat
python -B reactor make:realtime-hub chat
```

<a id="command-make-realtime-socket"></a>

## make:realtime-socket

Crea un handler WebSocket de Realtime.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Usa `realtime_socket.stub` y el sufijo `Socket`. El handler todavía debe registrarse en las rutas WebSocket de la aplicación.

**Destino predeterminado:** `app/realtime/sockets`. Sufijo de clase/archivo: `Socket`.

```shell
orionis make:realtime-socket chat
python -B reactor make:realtime-socket chat
```

<a id="command-make-service"></a>

## make:service

Genera una clase de servicio.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Utiliza `service.stub`. El contenedor y el registro de un contrato dependen de la configuración que implemente la aplicación; el comando solo crea el archivo.

**Destino predeterminado:** `app/services`. Sufijo de clase/archivo: ninguno.

```shell
orionis make:service report_service
python -B reactor make:service report_service
```

<a id="command-make-test"></a>

## make:test

Crea un caso de prueba de la aplicación.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

Añade `test_` al archivo si no lo tiene y permite subdirectorios: `services/report` crea `tests/services/test_report.py`. No ejecuta el test generado.

**Destino predeterminado:** `tests`. Sufijo de clase/archivo: ninguno.

```shell
orionis make:test services/report
python -B reactor make:test services/report
```

La generación prepara código: no registra providers, crea tablas, publica endpoints ni ejecuta jobs por sí misma. Consulta [Controladores](/es/http/request-lifecycle), [Middleware](/es/http/middleware-and-security), [Schemas](/es/validation), [ORM](/es/database/orm), [Mail](/es/services/mail), [Queues](/es/asynchronous/queues), [Realtime](/es/asynchronous/realtime) y [MCP](/es/protocols/mcp) para implementar cada componente.
