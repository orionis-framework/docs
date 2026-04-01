---
title: DateTime
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# DateTime

`DateTime` es una utilidad a nivel de clase que proporciona una API consistente y consciente de zonas horarias para todas las operaciones de fecha y hora en el framework. Gestiona una zona horaria y un locale configurables por defecto, de modo que cada método — desde crear instantes hasta formatear salidas — produce resultados en el contexto esperado sin necesidad de pasar argumentos de zona horaria en cada llamada.

Todos los métodos son métodos de clase. No es necesario instanciar `DateTime`; llame a los métodos directamente sobre la clase.

## Importación

```python
from orionis.support.time.datetime import DateTime
```

:::tip[Recomendado para todas las operaciones de fecha]
Utilice siempre la clase `DateTime` para cualquier operación de fecha y hora en su aplicación. Durante el arranque (bootstrapping), el framework lee los valores de `timezone` y `locale` de la configuración de la aplicación (`config/app.py`) y los aplica automáticamente a `DateTime`. Esto significa que cada método — `now()`, `parse()`, `formatLocal()`, etc. — ya devuelve resultados en la zona horaria correcta sin argumentos adicionales. Usar primitivas de la biblioteca estándar directamente omite esta configuración y puede generar un manejo inconsistente de fechas en toda la base de código.
:::

---

## Métodos Internos

La clase expone tres métodos con prefijo que están reservados para el proceso de arranque interno del framework:

| Método | Efecto |
|---|---|
| `_loadConfig(timezone?, locale?)` | Sobrescribe la zona horaria **y** el locale por defecto para todas las llamadas posteriores |
| `_setTimezone(name)` | Reemplaza la zona horaria por defecto de forma global |
| `_setLocale(code)` | Reemplaza el locale por defecto de forma global |

:::caution[No invoque estos métodos en código de aplicación]
Estos métodos mutan estado **a nivel de clase**. Invocarlos fuera de la fase de arranque cambia la zona horaria o el locale para **todas** las partes de la aplicación que dependen de `DateTime`, incluyendo middleware, tareas en segundo plano y trabajos programados. Esto puede producir inconsistencias silenciosas en los datos — por ejemplo, marcas de tiempo almacenadas en base de datos pueden cambiar repentinamente a una zona horaria inesperada. El framework llama a estos métodos una sola vez durante el inicio; no hay razón para invocarlos manualmente.
:::

---

## Configuración

### getZoneinfo

Retorna un objeto `ZoneInfo` de la biblioteca estándar para la zona horaria configurada, útil al interactuar con código que espera tipos `zoneinfo`:

```python
from zoneinfo import ZoneInfo

zi = DateTime.getZoneinfo()   # ZoneInfo(key='Europe/Berlin')
```

---

## Crear Instantes

Cada método de instante acepta un parámetro opcional `tz`. Cuando se omite, se usa la zona horaria configurada por defecto.

### now

Retorna la fecha y hora actual:

```python
DateTime.now()                        # momento actual en tz por defecto
DateTime.now(tz="Asia/Singapore")     # momento actual en Singapur
```

### today

Retorna la fecha de hoy a medianoche (00:00:00):

```python
DateTime.today()
DateTime.today(tz="Australia/Sydney")
```

### tomorrow / yesterday

Retornan la fecha un día adelante o atrás, respectivamente:

```python
DateTime.tomorrow()
DateTime.yesterday(tz="Pacific/Auckland")
```

### datetime

Método fábrica que crea un datetime específico con componentes individuales. Solo `year` es requerido; todos los demás componentes tienen valores mínimos por defecto:

```python
DateTime.datetime(2024, 6, 15, 10, 30, 45)
# 2024-06-15 10:30:45 en la zona horaria por defecto

DateTime.datetime(2024, tz="Europe/Madrid")
# 2024-01-01 00:00:00 en Madrid
```

---

## Análisis y Conversión

### parse

Analiza una cadena de fecha ISO 8601 y la convierte a la zona horaria objetivo:

```python
dt = DateTime.parse("2024-06-15T12:00:00+00:00")
# Convertido a la zona horaria por defecto

dt = DateTime.parse("2024-01-01T00:00:00+00:00", tz="Asia/Tokyo")
# Convertido a Tokio
```

### fromTimestamp

Convierte un timestamp Unix a un datetime:

```python
dt = DateTime.fromTimestamp(0.0)
# 1970-01-01 00:00:00 UTC

dt = DateTime.fromTimestamp(1718400000, tz="America/Chicago")
```

### fromDatetime

Convierte un `datetime` de la biblioteca estándar o una instancia `DateTime` existente a la zona horaria objetivo. Lanza `TypeError` para tipos no soportados:

```python
from datetime import datetime, timezone

# Datetime ingenuo — se asume que está en la zona horaria configurada
dt = DateTime.fromDatetime(datetime(2024, 3, 15, 10, 30))

# Datetime consciente — se convierte a la zona horaria configurada
aware = datetime(2024, 3, 15, 10, 30, tzinfo=timezone.utc)
dt = DateTime.fromDatetime(aware)

# Con zona horaria objetivo explícita
dt = DateTime.fromDatetime(aware, tz="Asia/Seoul")
```

### convertToLocal

Acepta una cadena, `datetime` de la biblioteca estándar, o una instancia `DateTime` y lo convierte a la zona horaria configurada:

```python
dt = DateTime.convertToLocal("2024-06-15T12:00:00+00:00")
dt = DateTime.convertToLocal(datetime(2024, 6, 15, 12, 0, 0))
```

---

## Formateo

### formatLocal

Formatea un datetime como cadena. Por defecto usa `YYYY-MM-DD HH:mm:ss`. Cuando no se proporciona datetime, formatea el momento actual:

```python
dt = DateTime.datetime(2024, 6, 15, 10, 30, 45, tz="UTC")

DateTime.formatLocal(dt)
# "2024-06-15 10:30:45"

DateTime.formatLocal(dt, format_string="YYYY/MM/DD")
# "2024/06/15"

DateTime.formatLocal()
# datetime actual formateado con el patrón por defecto
```

---

## Límites

Los métodos de límites ajustan un datetime al inicio o final de un período de tiempo. Cuando se llaman sin argumento `dt`, utilizan el datetime actual.

### Día

```python
ref = DateTime.datetime(2024, 6, 12, 14, 30, 45, tz="UTC")

DateTime.startOfDay(ref)   # 2024-06-12 00:00:00
DateTime.endOfDay(ref)     # 2024-06-12 23:59:59

DateTime.startOfDay()      # hoy a las 00:00:00
DateTime.endOfDay()        # hoy a las 23:59:59
```

### Semana

Las semanas comienzan el lunes y terminan el domingo:

```python
DateTime.startOfWeek(ref)   # Lunes 00:00:00
DateTime.endOfWeek(ref)     # Domingo 23:59:59
```

### Mes

```python
DateTime.startOfMonth(ref)   # 2024-06-01 00:00:00
DateTime.endOfMonth(ref)     # 2024-06-30 23:59:59
```

### Año

```python
DateTime.startOfYear(ref)   # 2024-01-01 00:00:00
DateTime.endOfYear(ref)     # 2024-12-31 23:59:59
```

---

## Aritmética

Los métodos aritméticos aceptan valores negativos para retroceder en el tiempo.

### addDays

```python
ref = DateTime.datetime(2024, 1, 1, 12, 0, 0, tz="UTC")

DateTime.addDays(ref, 5)     # 2024-01-06
DateTime.addDays(ref, -3)    # 2023-12-29
```

### addHours

```python
DateTime.addHours(ref, 3)    # 15:00
DateTime.addHours(ref, 14)   # día siguiente 02:00
```

### addMinutes

```python
DateTime.addMinutes(ref, 30)   # 12:30
DateTime.addMinutes(ref, 90)   # 13:30
```

### diffInDays

Retorna la diferencia absoluta en días entre dos datetimes:

```python
a = DateTime.datetime(2024, 1, 1, tz="UTC")
b = DateTime.datetime(2024, 1, 11, tz="UTC")

DateTime.diffInDays(a, b)   # 10
```

### diffInHours

Retorna la diferencia absoluta en horas:

```python
a = DateTime.datetime(2024, 1, 1, 12, 0, 0, tz="UTC")
b = DateTime.addHours(a, 6)

DateTime.diffInHours(a, b)   # 6
```

---

## Predicados

### isWeekend

Retorna `True` para sábado o domingo. Sin argumentos, verifica la fecha actual:

```python
saturday = DateTime.datetime(2024, 6, 8, tz="UTC")
monday   = DateTime.datetime(2024, 6, 10, tz="UTC")

DateTime.isWeekend(saturday)   # True
DateTime.isWeekend(monday)     # False
DateTime.isWeekend()           # depende del día actual
```

### isToday

```python
DateTime.isToday(DateTime.now())         # True
DateTime.isToday(DateTime.yesterday())   # False
```

### isFuture / isPast

```python
future = DateTime.addDays(DateTime.now(), 100)
past   = DateTime.addDays(DateTime.now(), -100)

DateTime.isFuture(future)   # True
DateTime.isPast(past)        # True
```

---

## Referencia de Métodos

| Método | Retorna | Descripción |
|---|---|---|
| `getZoneinfo()` | `ZoneInfo` | Retorna un `ZoneInfo` para la zona horaria actual |
| `now(tz?)` | `DateTime` | Fecha y hora actual |
| `today(tz?)` | `DateTime` | Hoy a medianoche |
| `tomorrow(tz?)` | `DateTime` | Mañana a medianoche |
| `yesterday(tz?)` | `DateTime` | Ayer a medianoche |
| `datetime(year, ...)` | `DateTime` | Construye un datetime específico |
| `parse(string, tz?)` | `DateTime` | Analiza una cadena de fecha |
| `fromTimestamp(ts, tz?)` | `DateTime` | Convierte un timestamp Unix |
| `fromDatetime(dt, tz?)` | `DateTime` | Convierte un datetime stdlib o del framework |
| `convertToLocal(dt)` | `DateTime` | Convierte cualquier entrada de fecha a la zona horaria configurada |
| `formatLocal(dt?, fmt?)` | `str` | Formatea un datetime como cadena |
| `startOfDay(dt?)` | `DateTime` | Ajusta a las 00:00:00 del día |
| `endOfDay(dt?)` | `DateTime` | Ajusta a las 23:59:59 del día |
| `startOfWeek(dt?)` | `DateTime` | Lunes a las 00:00:00 |
| `endOfWeek(dt?)` | `DateTime` | Domingo a las 23:59:59 |
| `startOfMonth(dt?)` | `DateTime` | Primer día a las 00:00:00 |
| `endOfMonth(dt?)` | `DateTime` | Último día a las 23:59:59 |
| `startOfYear(dt?)` | `DateTime` | 1 de enero a las 00:00:00 |
| `endOfYear(dt?)` | `DateTime` | 31 de diciembre a las 23:59:59 |
| `addDays(dt, n)` | `DateTime` | Suma n días |
| `addHours(dt, n)` | `DateTime` | Suma n horas |
| `addMinutes(dt, n)` | `DateTime` | Suma n minutos |
| `diffInDays(dt1, dt2)` | `int` | Diferencia absoluta en días |
| `diffInHours(dt1, dt2)` | `int` | Diferencia absoluta en horas |
| `isWeekend(dt?)` | `bool` | True si es sábado o domingo |
| `isToday(dt)` | `bool` | True si la fecha es hoy |
| `isFuture(dt)` | `bool` | True si es posterior al momento actual |
| `isPast(dt)` | `bool` | True si es anterior al momento actual |

---

## Trabajar con la Instancia DateTime Subyacente

Cada método que retorna un `DateTime` en realidad devuelve un objeto datetime enriquecido. Puede llamar a cualquier método de la biblioteca subyacente directamente sobre la instancia retornada, lo que le da acceso al rango completo de operaciones más allá de lo que esta clase expone:

```python
# Obtener una instancia a través de cualquier método DateTime
dt = DateTime.now()

# Acceder a propiedades extendidas
dt.day_of_week        # 0 (Lunes) a 6 (Domingo)
dt.day_of_year        # 1–366
dt.week_of_year       # 1–53
dt.days_in_month      # 28–31
dt.timezone_name      # 'America/Bogota'

# Usar aritmética extendida
dt.add(months=2, weeks=1)
dt.subtract(years=1)

# Helpers de diferencia
dt.diff(DateTime.yesterday()).in_hours()   # horas entre dos instantes

# Diferencia legible para humanos
dt.diff_for_humans()   # ej. "hace 2 horas"

# Salida ISO 8601
dt.to_iso8601_string()   # '2024-06-15T10:30:45-05:00'
dt.to_date_string()      # '2024-06-15'
dt.to_time_string()      # '10:30:45'
```

:::tip[Consejo]
Combine la conveniencia de `DateTime` para la creación consciente de zona horaria con la API completa de la instancia retornada para formateo avanzado, cálculos de diferencia o introspección de calendario.
:::
