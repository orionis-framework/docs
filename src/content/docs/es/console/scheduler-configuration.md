---
title: "Configuración y persistencia del scheduler"
description: "Todos los ajustes de config/scheduler.py, stores memory, database y Redis, requisitos y comportamiento al reiniciar."
editUrl: true
lastUpdated: false
---

El scheduler mantiene definiciones de tareas y sus próximas ejecuciones. Configura ese almacenamiento en `config/scheduler.py`. La configuración de [Queues](/es/queues/configuration) es independiente: los jobs de una cola, sus reservas y sus fallos no se guardan en los stores del scheduler.

## Configuración general

<a id="config-scheduler"></a>

`BootstrapScheduler` hereda la entidad `Scheduler` de `orionis.foundation.config.scheduler`. Sus campos se declaran por nombre; la entidad es inmutable y valida los valores al construirse.

| Propiedad | Variable de entorno | Predeterminado y efecto |
|---|---|---|
| `store: Drivers \| str` | `TASKS_STORE` | `memory`. Selecciona `memory`, `database` o `redis`. El texto se recorta, se compara sin distinguir mayúsculas y se normaliza a minúsculas. |
| `stores: Stores \| dict` | — | Configuraciones de los tres stores; un diccionario se convierte en `Stores`. El store seleccionado debe estar configurado. |
| `max_instances: int` | `TASKS_MAX_INSTANCES` | `1`. Máximo de ejecuciones simultáneas de una firma en este scheduler; entero mayor o igual a uno. |
| `coalesce: bool` | `TASKS_COALESCE` | `True`. Agrupa varias ejecuciones atrasadas pendientes en una sola. |
| `misfire_grace_time: int \| None` | `TASKS_MISFIRE_GRACE_TIME` | `30`. Tolerancia de retraso en segundos; entero positivo o `None` para no limitarla. |
| `replace_existing: bool` | `TASKS_REPLACE_EXISTING` | `True`. Sustituye la definición persistida que ya tenga la misma firma al iniciar. |
| `jitter: int` | `TASKS_JITTER` | `0`. Valor predeterminado de `random_delay` en la entidad informativa; entero no negativo. Lee la precisión sobre su aplicación al trigger debajo. |

Los booleanos deben ser booleanos reales en configuración Python; los campos enteros generales rechazan `bool`. Un driver desconocido, un store seleccionado con valor `None`, un máximo menor que uno o una tolerancia no positiva producen `ValueError`; los tipos incompatibles producen `TypeError`.

### Alcance real de jitter

Actualmente, `Schedule.info()` aplica `jitter` como valor de `Task.random_delay` cuando la tarea no lo define. Ese valor global **no se copia al trigger que la tarea ya construyó**. Para aplicar dispersión al horario utiliza `.randomDelay(...)` en la tarea; no asumas que `TASKS_JITTER` por sí solo modifica sus próximas ejecuciones. [La referencia](/es/console/scheduler-frequencies#task-randomdelay) explica el muestreo y las frecuencias compatibles.

### Stores y enumeración de drivers

<a id="config-stores"></a>
<a id="config-drivers"></a>

`Stores` contiene `memory: Memory | dict | None`, `redis: Redis | dict | None` y `database: Database | dict | None`. Cada campo crea por defecto la entidad correspondiente; un diccionario se normaliza a ella. Puedes desactivar un store con `None`, siempre que no sea el seleccionado.

`Drivers` expone `MEMORY = "memory"`, `REDIS = "redis"` y `DATABASE = "database"`. Los campos `driver` de las entidades individuales exigen su nombre exacto. No hay un mecanismo de registro de drivers personalizados en este servicio.

```python
from orionis.foundation.config.scheduler import (
    Database,
    Drivers,
    Memory,
    Scheduler,
    Stores,
)

settings = Scheduler(
    store=Drivers.DATABASE,
    stores=Stores(
        memory=Memory(),
        redis=None,
        database=Database(connection="sqlite", table="scheduler_tasks"),
    ),
    max_instances=1,
    coalesce=True,
    misfire_grace_time=60,
    replace_existing=True,
    jitter=0,
)
```

Este ejemplo construye una entidad de configuración completa para mostrar su estructura. En la aplicación, modifica los campos correspondientes de `BootstrapScheduler` en `config/scheduler.py`, conservando los demás valores del archivo. La configuración se carga desde ese módulo; construir `settings` en otro archivo no reemplaza automáticamente la configuración de la aplicación. Para seleccionar el store mediante `.env` no necesitas reemplazar el archivo.

## Memory

<a id="config-memory"></a>

`Memory` tiene un solo campo: `driver: str = "memory"`. No tiene ruta de archivos ni opciones de conexión.

```dotenv
TASKS_STORE=memory
```

Las tareas y su próxima fecha viven en el proceso. Al terminar, se pierden esos datos; al volver a ejecutar `schedule:work`, las declaraciones de `tasks()` crean otra agenda. Es adecuado para desarrollo o para agendas reconstruibles que no necesitan recuperar su estado temporal tras una parada.

El arranque añade siempre un store con alias `memory`, incluso cuando el elegido es persistente. Las tareas declaradas por Orionis se guardan en el alias seleccionado por `store`.

## Database

<a id="config-database"></a>

`Database` configura el almacén SQL de las tareas:

| Campo | Variable | Predeterminado / validación |
|---|---|---|
| `driver: str` | — | `"database"`; exige ese valor. |
| `connection: str \| None` | `DB_TASK_CONNECTION` | `None`: usa la conexión predeterminada de Database. Una cadena selecciona una conexión configurada allí. |
| `table: str` | `DB_TASK_TABLE` | `"scheduler_tasks"`; solo letras minúsculas y `_`, patrón `[a-z_]+`. No admite números, puntos ni nombres cualificados. |

```dotenv
TASKS_STORE=database
DB_TASK_CONNECTION=sqlite
DB_TASK_TABLE=scheduler_tasks
TASKS_REPLACE_EXISTING=True
```

La conexión `sqlite` debe existir en [Database](/es/database/configuration). El store usa sus credenciales y opciones de motor, pero crea un **motor de conexión SQL síncrono propio**. No comparte la conexión async ni las transacciones de una petición. Si SQLite usa `:memory:`, ese engine tiene su propia base en memoria; no proporciona persistencia en disco ni comparte automáticamente los datos de otra conexión.

Al arrancar, el store crea la tabla si no existe. La estructura de la implementación integrada es:

| Columna | Información almacenada |
|---|---|
| `id` | Firma del comando, clave primaria de hasta 191 caracteres. |
| `next_run_time` | Timestamp de próxima ejecución, indexado; `NULL` si está pausada. |
| `job_state` | Estado serializado del job: referencia al ejecutor, trigger, argumentos y políticas. |

No es una tabla de logs ni una tabla de jobs fallidos. El scheduler no crea una migración de Orionis para ella. El usuario de base de datos necesita permisos para crearla inicialmente y posteriormente leer, insertar, actualizar y borrar sus registros.

### Dependencias del engine síncrono

Los componentes del scheduler, el acceso SQL y el cliente de Redis ya forman parte de las dependencias de Orionis. SQLite usa `sqlite3` de Python para este store. Para motores opcionales, los extras del framework incluyen los clientes que utiliza su ruta síncrona:

| Motor de Database | Cliente de este store | Extra |
|---|---|---|
| `sqlite` | `sqlite3` | Incluido en Python. |
| `mysql` | `pymysql` | `orionis[mysql]` |
| `pgsql` | `psycopg2` | `orionis[pgsql]` |
| `oracle` | `oracledb` | `orionis[oracle]` |
| `sqlserver` | `pyodbc` | `orionis[sqlserver]`; requiere también el driver ODBC del sistema. |

Puedes instalar los paquetes opcionales desde el selector del proyecto:

```shell
orionis packages
python -B reactor packages
```

Selecciona el extra del motor que realmente vas a utilizar; [drivers de Database](/es/database/drivers) detalla sus requisitos. Redshift se rechaza explícitamente para este store porque necesita claves únicas impuestas e índices. En Oracle, la implementación adapta la precisión de `next_run_time` al dialecto.

## Redis

<a id="config-redis"></a>

| Campo | Variable | Predeterminado / validación |
|---|---|---|
| `driver: str` | — | `"redis"`; exige ese valor. |
| `host: str` | `REDIS_HOST` | `"127.0.0.1"`; cadena no vacía. |
| `port: int` | `REDIS_PORT` | `6379`; entre 1 y 65535, no booleano. |
| `db: int` | `REDIS_DB` | `0`; entero no negativo, no booleano. |
| `password: str \| None` | `REDIS_PASSWORD` | `None`; admite cadena vacía. |
| `key: str` | `REDIS_TASKS_KEY` | `"scheduler:tasks"`; cadena no vacía. Hash que guarda los jobs serializados. |
| `run_times_key: str` | `REDIS_RUN_TIMES_KEY` | `"scheduler:run_times"`; cadena no vacía y distinta de `key`. Sorted set de fechas de próxima ejecución. |

```dotenv
TASKS_STORE=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_TASKS_KEY=reports:scheduler:tasks
REDIS_RUN_TIMES_KEY=reports:scheduler:run_times
```

Necesitas un servidor Redis accesible. No debes instalar otro cliente Python para este componente: el proyecto ya lo incluye. La durabilidad ante reinicios del servidor depende de la persistencia configurada en Redis; Orionis no activa AOF ni snapshots por ti.

Este store usa el cliente **síncrono** de Redis. Sus dos claves pertenecen al scheduler, no al prefijo del driver Redis de colas ni a las claves de Cache. Usa claves propias para agendas independientes. La configuración pública no expone usuario, TLS, cluster ni una URL de conexión; no agregues esos parámetros a estas entidades esperando que se apliquen.

## Qué se recupera al reiniciar

La implementación persiste una referencia importable al ejecutor del framework y le pasa **firma y lista de argumentos**. Reactor vuelve a resolver el comando y sus dependencias al ejecutar. No guarda una instancia del contenedor, el objeto comando, un scope de petición ni los listeners Python.

Los almacenes persistentes del scheduler usan serialización interna basada en pickle. Las tablas y claves deben ser de la aplicación y de confianza; no son un formato de intercambio para recibir trabajos de clientes. Las declaraciones normales de `Schedule.command()` evitan serializar métodos ligados al contenedor.

Con `replace_existing=True`, cada arranque vuelve a declarar las tareas del código y sustituye las entradas con la misma firma. Esto puede recalcular su próxima ejecución según el trigger; no equivale a reproducir exactamente todos los horarios que ocurrieron con el proceso detenido. `coalesce` y `misfire_grace_time` se aplican a las ejecuciones atrasadas que el trigger y el store finalmente entreguen.

Con `replace_existing=False`, una firma ya persistida puede provocar `ConflictingIdError` durante el arranque. Quitar una declaración del código **no borra automáticamente** una entrada antigua de un store persistente; gestiona su eliminación antes de retirarla y comprueba las entradas existentes. `info()` y `schedule:list` describen las declaraciones cargadas, no inventarían un historial completo del store.

`max_instances` limita ejecuciones dentro de un scheduler; no implementa un bloqueo distribuido entre procesos. Ninguno de estos stores incorpora elección de líder ni una reserva de trabajo como las de Queues. Mantén un proceso responsable de una agenda si no has implementado coordinación externa.

## Servicio de stores

<a id="store-construction"></a>

`ScheduleStore(app: IApplication, db_manager: IConnectionManager) -> None` implementa `IScheduleStore`. El provider lo registra como singleton; valida `app.config("scheduler")` durante su construcción. Los métodos siguientes son síncronos y crean objetos de store; no inician un reloj ni despachan comandos.

<a id="store-store"></a>

### `store -> str`

Propiedad de solo lectura con el nombre normalizado del store seleccionado: `"memory"`, `"database"` o `"redis"`.

<a id="store-config"></a>

### `config -> ConfigScheduler`

Propiedad de solo lectura con la entidad `Scheduler` ya validada. Permite consultar sus políticas y entidades de conexión.

<a id="store-database"></a>

### `database()`: crear el almacén SQL

Devuelve el objeto de almacenamiento SQL que utiliza el scheduler, con la conexión seleccionada, tabla y opciones de motor. No reutiliza un store de una llamada anterior. Una sección `database=None` produce `RuntimeError`; una conexión inexistente o mal configurada falla al resolver su configuración. Redshift produce `RuntimeError` y un cliente opcional ausente se traduce al error de dependencia de Database.

<a id="store-redis"></a>

### `redis()`: crear el almacén Redis

Devuelve el objeto de almacenamiento Redis que utiliza el scheduler, con las claves de tareas y horarios, host, puerto, base y contraseña. No cachea el objeto. Una sección `redis=None` produce `RuntimeError`; los errores reales de conexión se pueden manifestar después al operar con Redis.

Ejemplo de inspección mediante inyección, sin crear stores adicionales:

```python
from orionis.console.base import BaseCommand
from orionis.console.contracts.store import IScheduleStore


class SchedulerSettingsCommand(BaseCommand):
    signature = "scheduler:settings"
    description = "Show scheduler settings."

    async def handle(self, stores: IScheduleStore) -> int:
        self.writeLine(f"Store: {stores.store}")
        self.writeLine(f"Max instances: {stores.config.max_instances}")
        self.writeLine(f"Replace existing: {stores.config.replace_existing}")
        return 0
```

Deja normalmente la creación y el cierre de los objetos de almacenamiento al servicio `Schedule`; llamar directamente a `database()` o `redis()` es una API de integración, no un requisito para usar la agenda.
