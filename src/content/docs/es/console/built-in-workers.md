---
title: "Comandos de workers y scheduler"
description: "Referencia de comandos de colas, scheduler y servidores MCP locales: opciones, salidas y errores."
editUrl: true
lastUpdated: false
---

`queue:work`, `schedule:work` y `mcp:start` son procesos de consumo o servicio; no se sustituyen entre sí. Los demás comandos inspeccionan o modifican sus registros. Cada uno se ejecuta desde la raíz del proyecto, mediante `orionis` o el archivo local `reactor`.

Todas las firmas admiten `-h` / `--help`. Las políticas de reintento/persistencia pertenecen al servicio de Queues o al scheduler: no infieras flags de otros sistemas de workers.

<a id="command-mcp-list"></a>

## mcp:list

Lista servidores MCP HTTP y locales.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Consulta `IMcpManager.servers()` y muestra transporte, endpoint o handle y clase de servidor. Sin registros informa que no hay servidores; no inicia ninguno ni recibe filtros.

```shell
orionis mcp:list
python -B reactor mcp:list
```

<a id="command-mcp-start"></a>

## mcp:start

Inicia un servidor MCP local mediante STDIO.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `name` | str, obligatorio | — | Nombre del archivo/clase; admite subdirectorios cuando se usa el generador. |

`name` es el handle local obligatorio registrado en MCP, no una URL ni una clase. Comprueba su existencia y ejecuta `IMcpManager.startLocal(name)`. Un handle ausente/inválido devuelve `1`; la finalización normal devuelve `0`. El proceso utiliza STDIN/STDOUT para el protocolo y redirige diagnósticos de arranque/comando/apagado a STDERR. No ejecuta un servidor HTTP ni recibe `--host`, `--port` o `--transport`. Consulta la guía MCP para registrar el handle y la revisión de protocolo implementada.

```shell
orionis mcp:start catalog
python -B reactor mcp:start catalog
```

<a id="command-queue-clear"></a>

## queue:clear

Vacía una cola, incluidos jobs retrasados o reservados.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `connection` | str, opcional | Conexión predeterminada | Nombre de conexión de colas. |
| `--queue` | str, opcional | `default` | Nombre de cola; queue:work acepta nombres separados por comas. |

`connection` es opcional (`None`: predeterminada). `--queue` es una cadena con default literal `default`, incluso si la conexión configura otro nombre de cola; no admite una lista separada por comas. Elimina jobs listos, retrasados y reservados y muestra el conteo. No pide confirmación ni tiene `--force`; no borra el repositorio de fallos ni puede deshacer efectos de un `handle()` que ya se ejecuta. Devuelve `0` o `1` ante `QueueError`.

```shell
orionis queue:clear database --queue reports
python -B reactor queue:clear database --queue reports
```

<a id="command-queue-failed"></a>

## queue:failed

Lista los jobs con fallo terminal.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

No admite conexión, paginación ni flags. Consulta el repositorio SQL de fallos configurado en `queue.failed`, aunque el backend de jobs sea Redis o sync. Muestra ID del registro fallido, ID del job, conexión/cola, intentos y excepción. Usa el primer ID para retry/forget. Devuelve `0` si la consulta termina y `1` ante `QueueError`.

```shell
orionis queue:failed
python -B reactor queue:failed
```

<a id="command-queue-forget"></a>

## queue:forget

Elimina un registro de fallo.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `id` | str, obligatorio | — | ID del registro fallido, no el ID del job. |

`id` es una cadena posicional obligatoria del repositorio de fallos. No reintenta el job ni borra trabajo de las colas activas. Devuelve `0` al eliminarlo y `1` si no existe o se produce `QueueError`.

```shell
orionis queue:forget 866a127d-3185-4e5c-b21c-65eef9cd78a8
python -B reactor queue:forget 866a127d-3185-4e5c-b21c-65eef9cd78a8
```

<a id="command-queue-retry"></a>

## queue:retry

Reenvía un job fallido identificado.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `id` | str, obligatorio | — | ID del registro fallido, no el ID del job. |

`id` es el identificador obligatorio del registro fallido mostrado por `queue:failed`. Reencola el envelope original en su conexión y cola, conserva el ID del job y elimina el registro fallido después del push. Si venció `retryUntil()` o no existe el fallo, devuelve `1` mediante `QueueError`. No tiene `all`, `--all` ni selección de conexión. El push y el borrado del fallo son pasos separados; consulta sus límites de atomicidad en Queues.

```shell
orionis queue:retry 866a127d-3185-4e5c-b21c-65eef9cd78a8
python -B reactor queue:retry 866a127d-3185-4e5c-b21c-65eef9cd78a8
```

<a id="command-queue-work"></a>

## queue:work

Consume jobs persistidos en una conexión de colas.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `connection` | str, opcional | Conexión predeterminada | Nombre de conexión de colas. |
| `--queue` | str, opcional | Cola de la conexión | Nombre de cola; queue:work acepta nombres separados por comas. |
| `--concurrency` | int, opcional | `queue.worker.concurrency` | Consumidores concurrentes; entero positivo. |
| `--max-jobs` | int, opcional | Sin límite | Máximo de intentos reservados; entero positivo. |
| `--stop-when-empty` | Bandera, opcional | `False` | Terminar cuando la reserva no encuentra trabajo listo. |

`connection` es una cadena posicional opcional (`None`: conexión predeterminada). `--queue` acepta una cadena de nombres separados por comas; se eliminan espacios alrededor de cada nombre y se conserva el orden de prioridad. Omitida usa la cola configurada en la conexión. `--concurrency` es un entero positivo opcional (por defecto `queue.worker.concurrency`); `--max-jobs` limita la cantidad de intentos reservados con un entero positivo, y omitido no fija un límite. `--stop-when-empty` (`False` por defecto) termina cuando no hay trabajo listo en el momento de consultar: puede dejar jobs retrasados o reservados pendientes.

La conexión `sync` no permite crear workers. Se instalan handlers de señales para solicitar una parada ordenada. El resultado exitoso muestra el número de intentos y devuelve `0`; un `QueueError` devuelve `1`. `--tries`, `--timeout`, `--backoff`, `--sleep` y `--retry-after` no son opciones de este comando: se resuelven desde configuración y política del job.

```shell
orionis queue:work database --queue critical,default --concurrency 2 --max-jobs 100 --stop-when-empty
python -B reactor queue:work database --queue critical,default --concurrency 2 --max-jobs 100 --stop-when-empty
```

<a id="command-schedule-list"></a>

## schedule:list

Inspecciona las tareas definidas por el scheduler.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Obtiene `app.getScheduler()`, resuelve `ISchedule` e invoca `tasks(schedule=...)` mediante el contenedor antes de consultar `info()`. Muestra firma, argumentos, propósito, random delay, coalescing, máximo de instancias, tolerancia de misfire y fechas. No ejecuta `boot()` del servicio ni procesa las tareas. El método `tasks()` sí se evalúa, por lo que debe concentrarse en declarar la programación.

```shell
orionis schedule:list
python -B reactor schedule:list
```

<a id="command-schedule-work"></a>

## schedule:work

Inicia el proceso del scheduler.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Carga el scheduler registrado, exige `tasks()` invocable, registra las tareas y los listeners `onStarted`, `onPaused`, `onResumed` y `onShutdown`, ejecuta `ISchedule.boot()` y espera con `wait()`. Permanece activo hasta el apagado; no es un tick ni un comando que deba lanzarse cada minuto. No acepta `--once`, `--queue` ni flags de driver: la persistencia procede de la configuración de tareas.

Si ya inició y recibe `KeyboardInterrupt` o cancelación, llama a `shutdown()` y espera el cierre. Los errores reconocidos de conexión, persistencia y sistema de archivos se muestran con estado `1`; otras excepciones se propagan. Las excepciones de jobs programados y sus listeners se explican en la guía del scheduler.

```shell
orionis schedule:work
python -B reactor schedule:work
```

Consulta [Workers de colas](/es/asynchronous/queues/workers-and-failures), [Reintentos y fallos](/es/asynchronous/queues/failures-and-retries), [Programación de tareas](/es/console/task-scheduling) y [MCP](/es/protocols/mcp) para configurar los servicios y sus componentes.
