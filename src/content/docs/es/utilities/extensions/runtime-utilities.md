---
title: "Facades, fechas y utilidades del runtime"
description: "Una fachada es un proxy a nivel de clase hacia un objeto resuelto por el contenedor de servicios de Orionis. Las importaciones son diferidas, por lo que importar…"
editUrl: true
lastUpdated: false
---

Las referencias detalladas de [Workers](/es/utilities/helpers/workers) y [PerformanceCounter](/es/utilities/helpers/performance-counter) incluyen sus firmas, contextos e inyección. Los demás servicios mantienen sus guías de módulo.

## Conceptos principales

### Fachadas

Una fachada es un proxy a nivel de clase hacia un objeto resuelto por el contenedor de servicios de Orionis. Las importaciones son diferidas, por lo que importar `orionis.support.facades` no carga ansiosamente todos los subsistemas. Las implementaciones de runtime son deliberadamente pequeñas, mientras los archivos `.pyi` adyacentes exponen la API delegada a verificadores de tipos y editores.

La mayoría de fachadas operan en todo el proceso. `Session` está vinculada a un ámbito, por lo que su resolución sigue el ámbito activo de petición o ejecución. No conserves servicios de petición resueltos entre ámbitos.

### Valores auxiliares

`Collection` aporta transformaciones fluidas alrededor de una lista. La mayoría de consultas devuelve una colección nueva; métodos explícitamente mutables como `push`, `put`, `forget`, `merge` y `transform` actualizan el objeto actual. `DotDict` permite acceso recursivo por atributos, `StdClass` almacena atributos dinámicos validados, `Stringable` es una subclase inmutable de `str` con operaciones fluidas, y `MISSING` diferencia un valor omitido de `None`.

### Entidades y estructuras

`BaseEntity` está pensado para combinarse con `@dataclass`. Serializa dataclasses anidados y campos enum mediante `toDict()` y describe tipos, valores predeterminados y metadatos mediante `getFields()`. `FreezeThaw` convierte recursivamente diccionarios en proxies de mapeo de solo lectura y secuencias en tuplas, con los límites de ciclos y referencias compartidas descritos en su referencia.

### Auxiliares transversales

`Singleton` implementa una instancia por clase concreta con una ruta de inicialización protegida por bloqueo. `Final` impide crear subclases. `PerformanceCounter` mide intervalos síncronos o asíncronos. `Workers` elige una cantidad de procesos a partir de límites en caché de CPU lógica y memoria total. `Parser.exception()` crea una representación estructurada y cacheada de una excepción. `Inspire` devuelve una cita elegida criptográficamente.

## API pública

### Fachadas

Importa las fachadas desde `orionis.support.facades`:

| Fachada | Área de servicio |
| --- | --- |
| `Application` | Contenedor y ciclo de vida de la aplicación. |
| `Auth` | Gestor de autenticación. |
| `Cache` | Almacenes y operaciones de caché. |
| `Catch` | Servicio de reporte de excepciones. |
| `Crypt` | Cifrado y descifrado. |
| `DateTime` | Utilidades autónomas de fecha, zona horaria, duración e intervalo. |
| `DB` | Constructor de consultas de base de datos. |
| [`Debug`](/es/utilities/helpers/debug) | Inspección de valores con `dump()` y `dd()`. |
| `Hash` | Hash de contraseñas y valores. |
| `Lang` | Traducción. |
| `Log` | Registro de eventos de texto con filtros de severidad. |
| `Mail` | Construcción y entrega de correo. |
| `Mcp` | Registro de servidores MCP y notificaciones. |
| `Queue` | Despacho, conexiones, workers y trabajos fallidos de colas. |
| `Reactor` | Ejecución de comandos de consola. |
| `Realtime` | Clientes de hubs y conexiones en tiempo real. |
| `Route` | Enrutamiento HTTP, WebSocket, MCP y de vistas. |
| `Schedule` | Comandos y callbacks programados. |
| `Schema` | Operaciones de esquema de base de datos. |
| `Session` | Estado de sesión local al ámbito. |
| `Storage` | Discos configurados del sistema de archivos. |
| `Test` | Motor de pruebas del framework. |
| `View` | Fábrica y renderizado de vistas. |

Salvo `DateTime`, estas clases obtienen su destino del contenedor. Consulta la documentación del módulo propietario para el contrato delegado completo.

### Tipos y auxiliares

- `Collection(items=None)`: selección, mapeo, agrupación, agregación, paginación, serialización y protocolos de lista fluidos.
- `DotDict(mapping)`: acceso por clave y atributo; `export()` restaura diccionarios recursivamente y `copy()` copia profundamente los contenidos mutables.
- `StdClass(**kwargs)`: atributos dinámicos que rechazan nombres reservados o dunder; admite `fromDict`, `toDict`, `update` y `remove`.
- `Stringable(value)`: envoltorio inmutable y fluido de texto con utilidades de formato, coincidencia, reemplazo, codificación, hash, análisis, truncado y validación.
- `MISSING`: centinela falso cuya representación es `MISSING`.
- `BaseEntity`: `toDict()` y `getFields()` para entidades dataclass.
- `FreezeThaw.freeze()` / `thaw()`: conversiones recursivas inmutables/mutables.
- `PerformanceCounter`: `start`/`stop`, `astart`/`astop`, gestores de contexto y conversiones de duración.
- `Workers.setRamPerWorker()` / `calculate()`: cálculo de capacidad de procesos.
- `Parser.exception(error)`: produce un `ExceptionParser`; invoca `toDict()` para `error_type`, `error_message`, `error_code` y `stack_trace`.
- `Inspire.random()`: devuelve un mapeo `{"quote": ..., "author": ...}`.
- `Final` y `Singleton`: metaclases para clases finales y singleton.

## Ejemplos

### Medir una operación

```python
from orionis.support.performance import PerformanceCounter

with PerformanceCounter() as counter:
    total = sum(range(100))

assert total == 4950
assert counter.getSeconds() >= 0
assert counter.getMilliseconds() >= 0
```

### Trabajar con fechas sin inicializar el contenedor

```python
from orionis.support.facades import DateTime

instant = DateTime.parse("2026-10-06T12:30:00Z")
later = DateTime.addDays(instant, 2)

assert instant.timezone_name == "UTC"
assert later.to_date_string() == "2026-10-08"
assert DateTime.diffInDays(instant, later) == 2
```

### Invocar una fachada respaldada por el contenedor

```python
from orionis.support.facades import Cache, Log, Storage

# Run after the Orionis application has booted and bound these services.
async def completed_import() -> None:
    Log.info("Import completed")
    await Cache.set("imports:last", "customers.csv", ttl=300)
    await Storage.disk("local").put("imports/customers.txt", b"done")
```



## API de fechas y horas

`DateTime` funciona sin contenedor. La aplicación configura su zona y locale durante el arranque; consúltalos con `getTimezone()` y `getLocale()`. Omitir `tz` usa esa zona, salvo `local()` (zona del sistema) y `naive()` (sin zona). Los límites de calendario conservan un `dt` explícito y usan `tz` solo al crear la fecha actual.

`formatLocal()` convierte el instante antes de formatear y aplica el locale configurado. `isToday()` compara fechas locales. `diffInDays()` y `diffInHours()` devuelven diferencias absolutas truncadas de tiempo transcurrido; un día de calendario que cruza un cambio horario no necesariamente dura 24 horas. `fromFormat()` y `formatLocal()` usan tokens Pendulum; `Stringable.toDate()` usa tokens strptime de Python. Fechas, unidades, locales o zonas inválidas propagan sus errores de validación.

```python
from orionis.support.facades import DateTime

instant = DateTime.parse("2026-10-06T12:30:00Z", tz="UTC")
month_start = DateTime.startOfMonth(instant)
deadline = DateTime.add(instant, days=2, hours=3)
assert month_start.to_iso8601_string() == "2026-10-01T00:00:00Z"
assert DateTime.diffInHours(instant, deadline) == 51
assert DateTime.fromFormat("06/10/2026", "DD/MM/YYYY", tz="UTC").day == 6
```

| Firma | Resultado |
| --- | --- |
| `getTimezone() -> str` | Zona horaria configurada. |
| `getLocale() -> str` | Locale configurado. |
| `getZoneInfo() -> ZoneInfo` | ZoneInfo de la zona configurada. |
| `now(tz: str \| None=None) -> pendulum.DateTime` | Instante actual en la zona elegida. |
| `today(tz: str \| None=None) -> pendulum.DateTime` | Hoy a medianoche. |
| `tomorrow(tz: str \| None=None) -> pendulum.DateTime` | Mañana a medianoche. |
| `yesterday(tz: str \| None=None) -> pendulum.DateTime` | Ayer a medianoche. |
| `parse(date_string: str, tz: str \| None=None, *, strict: bool=True) -> pendulum.DateTime` | Analiza texto y convierte a la zona elegida. |
| `fromFormat(date_string: str, fmt: str, tz: str \| None=None, locale: str \| None=None) -> pendulum.DateTime` | Analiza con tokens de formato explícitos. |
| `local(year: int, month: int=1, day: int=1, hour: int=0, minute: int=0, second: int=0, microsecond: int=0) -> pendulum.DateTime` | Construye en la zona local del sistema. |
| `naive(year: int, month: int=1, day: int=1, hour: int=0, minute: int=0, second: int=0, microsecond: int=0) -> pendulum.DateTime` | Construye sin información de zona. |
| `fromTimestamp(timestamp: float, tz: str \| None=None) -> pendulum.DateTime` | Convierte segundos Unix a una fecha. |
| `fromDatetime(dt: stdlib_datetime \| pendulum.DateTime, tz: str \| None=None) -> pendulum.DateTime` | Convierte datetime estándar o Pendulum. |
| `datetime(year: int, month: int=1, day: int=1, hour: int=0, minute: int=0, second: int=0, microsecond: int=0, tz: str \| None=None) -> pendulum.DateTime` | Construye en la zona elegida. |
| `duration(*, days: float=0, seconds: float=0, microseconds: float=0, milliseconds: float=0, minutes: float=0, hours: float=0, weeks: float=0, years: float=0, months: float=0) -> pendulum.Duration` | Construye una duración. |
| `interval(start: pendulum.DateTime, end: pendulum.DateTime, *, absolute: bool=False) -> pendulum.Interval` | Construye un intervalo entre fechas. |
| `startOf(unit: str, dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Inicio de la unidad indicada. |
| `endOf(unit: str, dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Final de la unidad indicada. |
| `startOfDay(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Inicio de día. |
| `endOfDay(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Final de día. |
| `convertToLocal(dt: str \| stdlib_datetime \| pendulum.DateTime) -> pendulum.DateTime` | Convierte a la zona configurada de la aplicación. |
| `formatLocal(dt: str \| stdlib_datetime \| pendulum.DateTime \| None=None, format_string: str='YYYY-MM-DD HH:mm:ss') -> str` | Formatea en la zona y locale configurados. |
| `startOfWeek(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Inicio de semana. |
| `endOfWeek(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Final de semana. |
| `startOfMonth(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Inicio de mes. |
| `endOfMonth(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Final de mes. |
| `startOfYear(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Inicio de año. |
| `endOfYear(dt: pendulum.DateTime \| None=None, tz: str \| None=None) -> pendulum.DateTime` | Final de año. |
| `addDays(dt: pendulum.DateTime, days: int) -> pendulum.DateTime` | Suma de días. |
| `addHours(dt: pendulum.DateTime, hours: int) -> pendulum.DateTime` | Suma de horas. |
| `addMinutes(dt: pendulum.DateTime, minutes: int) -> pendulum.DateTime` | Suma de minutos. |
| `diffInDays(dt1: pendulum.DateTime, dt2: pendulum.DateTime) -> int` | Diferencia absoluta truncada de días de 24 horas. |
| `diffInHours(dt1: pendulum.DateTime, dt2: pendulum.DateTime) -> int` | Diferencia absoluta truncada de horas. |
| `isWeekend(dt: pendulum.DateTime \| None=None) -> bool` | Comprueba sábado o domingo. |
| `isToday(dt: pendulum.DateTime) -> bool` | Compara fechas en la zona configurada. |
| `isFuture(dt: pendulum.DateTime) -> bool` | Comprueba si está en el futuro. |
| `isPast(dt: pendulum.DateTime) -> bool` | Comprueba si está en el pasado. |
| `isLeapYear(dt: pendulum.DateTime \| None=None) -> bool` | Comprueba si el año es bisiesto. |
| `isBirthday(dt: pendulum.DateTime, other: pendulum.DateTime \| None=None) -> bool` | Compara mes y día. |
| `closest(dt: pendulum.DateTime, *others: pendulum.DateTime) -> pendulum.DateTime` | Devuelve el candidato más próximo. |
| `farthest(dt: pendulum.DateTime, *others: pendulum.DateTime) -> pendulum.DateTime` | Devuelve el candidato más lejano. |
| `add(dt: pendulum.DateTime, *, years: int=0, months: int=0, weeks: int=0, days: int=0, hours: int=0, minutes: int=0, seconds: float=0, microseconds: int=0) -> pendulum.DateTime` | Suma unidades de calendario y tiempo. |
| `subtract(dt: pendulum.DateTime, *, years: int=0, months: int=0, weeks: int=0, days: int=0, hours: int=0, minutes: int=0, seconds: float=0, microseconds: int=0) -> pendulum.DateTime` | Resta unidades de calendario y tiempo. |
| `diff(dt1: pendulum.DateTime, dt2: pendulum.DateTime \| None=None, *, absolute: bool=True) -> pendulum.Interval` | Devuelve un intervalo entre fechas. |
| `diffForHumans(dt: pendulum.DateTime, other: pendulum.DateTime \| None=None, *, absolute: bool=False, locale: str \| None=None) -> str` | Describe la diferencia en lenguaje humano. |
| `next(dt: pendulum.DateTime, day_of_week: int \| None=None, *, keep_time: bool=False) -> pendulum.DateTime` | Siguiente día de semana seleccionado. |
| `previous(dt: pendulum.DateTime, day_of_week: int \| None=None, *, keep_time: bool=False) -> pendulum.DateTime` | Anterior día de semana seleccionado. |
| `average(dt1: pendulum.DateTime, dt2: pendulum.DateTime \| None=None) -> pendulum.DateTime` | Punto medio entre fechas. |
| `firstOf(dt: pendulum.DateTime, unit: str, day_of_week: int \| None=None) -> pendulum.DateTime` | Primera fecha de la unidad, opcionalmente en un día de semana. |
| `lastOf(dt: pendulum.DateTime, unit: str, day_of_week: int \| None=None) -> pendulum.DateTime` | Última fecha de la unidad, opcionalmente en un día de semana. |
| `nthOf(dt: pendulum.DateTime, unit: str, nth: int, day_of_week: int) -> pendulum.DateTime` | Enésima ocurrencia de un día de semana en la unidad. |

## Citas en consola

`Inspire(quotes=None)` usa el catálogo integrado. Conserva por referencia una lista personalizada no vacía; sus entradas deben incluir `quote` y `author`. `random()` devuelve un mapa con la cita; `printQuote(console)` la imprime mediante la `Console` recibida y devuelve `None`. Si la lista retenida queda vacía, utiliza la cita de respaldo.

```python
from orionis.console import Console
from orionis.support.inspirational.inspire import Inspire

quotes = Inspire([{"quote": "Keep examples executable.", "author": "Documentation team"}])
assert quotes.random()["author"] == "Documentation team"
quotes.printQuote(Console())
```

## Configuración

Los destinos de las fachadas se configuran en sus módulos propietarios y se resuelven desde el contenedor Orionis actual. `DateTime` recibe la zona horaria y el idioma de la aplicación mediante su cargador interno durante el arranque; los argumentos `tz` explícitos sustituyen ese valor para operaciones individuales.

`Workers` usa por defecto 0,5 GiB por worker. `setRamPerWorker()` cambia un presupuesto de clase para todo el proceso. `Inspire` admite una lista personalizada de mapeos con las claves obligatorias `quote` y `author`. Los demás tipos auxiliares no requieren configuración global.

## Integración con Orionis

Usa fachadas en límites de aplicación —controladores, comandos, trabajos, listeners y proveedores— donde resulte útil acceder concisamente a un servicio configurado. Prefiere inyección por constructor dentro de servicios de dominio reutilizables cuando importen las dependencias explícitas y las pruebas aisladas.

El paquete diferido de fachadas evita importar todos los subsistemas al arrancar. Los stubs de tipos conservan la finalización estática alineada con los contratos reales de gestores. `BaseEntity`, `Collection` y `Stringable` también se usan en Orionis para ofrecer serialización y operaciones fluidas de valores coherentes.

## Errores y casos límite

- Una fachada respaldada por servicios falla si su binding no está disponible o no existe un ámbito requerido activo.
- `DotDict.missing` devuelve `None`; usa comprobación de pertenencia cuando `None` sea un valor almacenado significativo.
- `StdClass` rechaza nombres dunder y nombres que colisionan con su API de clase.
- `Collection.chunk()` y `forPage()` rechazan tamaños no positivos; las operaciones con callbacks exigen objetos invocables.
- `FreezeThaw.freeze()` transforma diccionarios/listas/tuplas y conserva proxies existentes. Los ciclos solo de secuencias lanzan `ValueError`; otros objetos conservan su identidad.
- `PerformanceCounter` impide leer antes de completar una medición y mezclar métodos de inicio/parada síncronos y asíncronos.
- `Final` rechaza la herencia al crear la clase. `Singleton` ignora argumentos del constructor después de existir la primera instancia.
- Zonas horarias inválidas y entradas de fecha incompatibles producen errores de validación de `DateTime`/`pendulum`.
- `Workers.setRamPerWorker()` exige un valor finito, positivo y suficiente para representar al menos un byte.

## Rendimiento y concurrencia

Las importaciones de fachadas y sus exportaciones raíz son diferidas y cacheadas. `BaseEntity` cachea metadatos normalizados de campos por clase de entidad. `ExceptionParser` analiza una vez y devuelve su diccionario cacheado en llamadas posteriores. `DateTime` cachea instancias de `ZoneInfo` hasta que cambia su zona horaria.

`Singleton` serializa la primera construcción con un bloqueo por clase. Su acceso asíncrono usa el mismo constructor síncrono, por lo que debe ser breve. La construcción recursiva del mismo singleton lanza `RuntimeError`; una construcción fallida puede reintentarse. `FreezeThaw` recorre contenedores iterativamente. `Workers` cachea CPU y RAM total al importar.

`Collection` y los auxiliares mutables no están sincronizados. No mutues una misma instancia de forma concurrente sin coordinación en la aplicación.

## Compatibilidad

Estas utilidades requieren Python 3.14 o posterior. Los nombres públicos usan la convención camelCase de Orionis. Los archivos `.pyi` de fachadas proporcionan autocompletado y verificación de tipos para los métodos disponibles en los servicios que invocan. Los tokens de formato enviados a `DateTime.fromFormat()` siguen las convenciones de Pendulum, distintas de las de `datetime.strptime()`.

## Estructura del módulo

| Ruta | Responsabilidad |
| --- | --- |
| `entities/` | Serialización y metadatos de campos de `BaseEntity` para dataclasses. |
| `facades/` | Proxies diferidos de servicios y contratos públicos `.pyi`. |
| `formatter/` | Conversión de excepciones a diccionarios. |
| `inspirational/` | Proveedor y catálogo de citas. |
| `patterns/final/` | Metaclase `Final`. |
| `patterns/singleton/` | Metaclase `Singleton` segura entre hilos. |
| `performance/` | `PerformanceCounter` síncrono/asíncrono. |
| `structures/` | Conversiones recursivas `FreezeThaw`. |
| `system/` | Cálculo de workers según CPU/RAM. |
| `types/` | `Collection`, `DotDict`, `StdClass`, `Stringable` y `MISSING`. |

## Referencia y próximos pasos

[__init__.py](https://github.com/orionis-framework/framework/blob/1e905f4f103d47c61789d877eba472a5bd97681b/orionis/support/facades/__init__.py) · [datetime.py](https://github.com/orionis-framework/framework/blob/1e905f4f103d47c61789d877eba472a5bd97681b/orionis/support/facades/datetime.py) · [counter.py](https://github.com/orionis-framework/framework/blob/1e905f4f103d47c61789d877eba472a5bd97681b/orionis/support/performance/counter.py) · [workers.py](https://github.com/orionis-framework/framework/blob/1e905f4f103d47c61789d877eba472a5bd97681b/orionis/support/system/workers.py)

[Volver al índice del módulo](/es/utilities).
