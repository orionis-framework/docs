---
title: Programador de Tareas
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Programador de Tareas

### Descripción General

Orionis Framework proporciona un sistema integrado de programación de tareas que permite ejecutar comandos de consola de manera automática y programada. Este componente es especialmente útil para automatizar procesos recurrentes tales como limpieza de caché, generación de reportes, sincronización de datos o cualquier operación que requiera ejecutarse periódicamente sin intervención manual.

El programador de tareas está inspirado en los patrones de frameworks consolidados y probados en la industria, combinando lo mejor de estas soluciones con una API intuitiva y flexible. Ofrece funcionalidades avanzadas como:

- **Configuración flexible de horarios**: desde ejecuciones simples hasta reglas complejas basadas en CRON.
- **Manejo de concurrencia**: control preciso sobre instancias simultáneas de tareas.
- **Sistema de eventos y listeners**: reacciona a cambios en el estado de tareas.
- **Gestión del ciclo de vida**: pausa, reanudación y control del ejecutor.
- **Recuperación ante fallos**: tolerancia para ejecuciones perdidas y ajustes automáticos.

### Configuración Inicial

Para comenzar a utilizar el programador de tareas, dirígete al archivo `app\console\scheduler.py` en la estructura estándar de tu proyecto. En este archivo encontrarás la clase `Scheduler` que extiende de `BaseScheduler`. Esta clase es el punto central donde se definen todas las tareas programadas de tu aplicación.

La clase `Scheduler` contiene un método `tasks` cuya firma incluye el parámetro `schedule: ISchedule`. Este parámetro es un contrato importado desde `orionis.console.contracts.schedule` que expone métodos fundamentales para configurar horarios tales como `daily()`, `weekly()`, `cron()`, `every()` y muchos otros especializados.

### Primer Ejemplo: Definición de Tareas Programadas

```python
from orionis.console.base.scheduler import BaseScheduler
from orionis.console.contracts.schedule import ISchedule
from orionis.console.entities.scheduler_event import SchedulerEvent
from app.console.listeners.inspire_task_listener import InspireTaskListener

class Scheduler(BaseScheduler):

    def tasks(self, schedule: ISchedule) -> None:

        # Registrar un comando de prueba que se ejecuta cada diez segundos
        schedule.command("app:test", ["--name=Raul"])\
            .purpose("Comando de prueba de enrutamiento")\
            .maxInstances(1)\
            .everyTenSeconds()

        # Registrar el comando inspire que se ejecuta cada quince segundos con un listener
        schedule.command("app:inspire")\
            .purpose("Comando Inspire de prueba")\
            .maxInstances(1)\
            .registerListener(InspireTaskListener())\
            .everySeconds(15)
```

En el ejemplo anterior se definen dos tareas programadas:

1. **Primera tarea**: Ejecuta el comando `app:test` cada diez segundos, pasando el argumento `--name=Raul`. Esta tarea se limita a una única instancia concurrente mediante `maxInstances(1)`.

2. **Segunda tarea**: Ejecuta el comando `app:inspire` cada quince segundos con un listener registrado. El listener es una instancia completamente inicializada de `InspireTaskListener`, no la clase misma.

**Nota importante**: El parámetro `registerListener()` debe recibir una instancia del listener ya inicializada y lista para usar, no la clase del listener.

El programador de tareas de Orionis Framework es altamente configurable y versátil, permitiendo gestionar escenarios complejos como ejecuciones concurrentes, manejo de errores, notificaciones personalizadas y mucho más. Esta versatilidad lo convierte en una herramienta robusta y poderosa para automatizar procesos críticos dentro de tu aplicación.

## Métodos de Configuración de Control General

Los siguientes métodos permiten controladores aspectos generales de la ejecución y el ciclo de vida de una tarea:

- **`purpose(texto)`**: Establece una descripción legible y significativa de la tarea. Esta descripción es útil para propósitos de documentación, monitoreo y debugging.
- **`startDate(year, month, day, hour=0, minute=0, second=0)`**: Define la fecha y hora a partir de la cual la tarea puede comenzar a ejecutarse. Todas las ejecuciones programadas antes de esta fecha serán ignoradas.
- **`endDate(year, month, day, hour=0, minute=0, second=0)`**: Indica la fecha y hora límite para la ejecución de la tarea. Después de esta fecha, la tarea no se ejecutará bajo ninguna circunstancia.
- **`maxInstances(int)`**: Define el número máximo de instancias concurrentes permitidas para esta tarea. Evita problemas de concurrencia limitando ejecutores simultáneos (valor recomendado: 1 para tareas críticas).
- **`misfireGraceTime(segundos)`**: Establece el período de tolerancia en segundos para recuperarse de ejecuciones perdidas. Si el scheduler no estaba disponible en el tiempo programado y se reanuda dentro de este período, la tarea se ejecutará automáticamente.
- **`coalesce(coalesce=True)`**: Controla el comportamiento cuando hay múltiples ejecuciones pendientes:
  - `True`: Consolida todas las ejecuciones pendientes en una única ejecución.
  - `False`: Intenta ejecutar todas las ejecuciones pendientes de forma individual.
- **`randomDelay(max_seconds=10)`**: Agrega un retraso aleatorio (entre 0 y el valor especificado, máximo 120 segundos) antes de ejecutar la tarea. Útil para evitar picos de carga cuando múltiples tareas se ejecutan simultáneamente.

**Ejemplo de Configuración de Control General:**

```python
schedule.command("app:cleanup")\
    .purpose("Limpiar archivos temporales del sistema")\
    .startDate(2026, 1, 1, 0, 0, 0)\
    .endDate(2026, 12, 31, 23, 59, 59)\
    .maxInstances(1)\
    .misfireGraceTime(120)\
    .coalesce(True)\
    .daily()
```

En este ejemplo, se puede observar cómo se combinan varios métodos de forma encadenada para obtener una configuración completa y expresiva.

## Sistema de Eventos y Listeners de Tareas

**Concepto General**

El sistema de eventos y listeners proporciona un mecanismo robusto para reaccionar a cambios en el estado de las tareas programadas. Mediante listeners, puedes implementar lógica personalizada que se ejecute en momentos específicos del ciclo de vida de una tarea.

**Registración de Listeners**

Para registrar un listener completo en una tarea, utiliza el método:

- **`registerListener(listener)`**: Registra una instancia de `BaseTaskListener` completamente inicializada. El framework mapea automáticamente todos los métodos del listener (como `onTaskExecuted`, `onTaskError`, etc.) a los eventos correspondientes de la tarea.

### Estructura de un Listener

Un listener es una clase que extiende de `BaseTaskListener` e implementa métodos para reaccionar a eventos específicos del ciclo de vida de la tarea. A continuación se muestra un ejemplo de la estructura completa de un listener:

```python
from orionis.console.base.listener import BaseTaskListener
from orionis.console.entities.task_event import TaskEvent

class MyTaskListener(BaseTaskListener):

    async def onTaskAdded(self, event: TaskEvent) -> None:
        """Se invoca cuando la tarea es agregada al scheduler."""
        pass

    async def onTaskRemoved(self, event: TaskEvent) -> None:
        """Se invoca cuando la tarea es removida del scheduler."""
        pass

    async def onTaskExecuted(self, event: TaskEvent) -> None:
        """Se invoca cada vez que la tarea se ejecuta exitosamente."""
        pass

    async def onTaskError(self, event: TaskEvent) -> None:
        """Se invoca cuando ocurre un error durante la ejecución de la tarea."""
        pass

    async def onTaskMissed(self, event: TaskEvent) -> None:
        """Se invoca cuando la tarea no se ejecuta en el horario programado."""
        pass

    async def onTaskSubmitted(self, event: TaskEvent) -> None:
        """Se invoca cada vez que la tarea es enviada para ejecución."""
        pass

    async def onTaskMaxInstances(self, event: TaskEvent) -> None:
        """Se invoca cuando se intenta ejecutar la tarea pero se alcanzó el límite de instancias concurrentes."""
        pass
```

### Eventos Disponibles

Cada evento es disparado en un momento específico del ciclo de vida de la tarea:

| <span style="white-space: nowrap;">Evento</span> | Momento de Disparo | Descripción |
|---|---|---|
| <span style="white-space: nowrap;"><code>onTaskAdded</code></span> | Al agregar la tarea al scheduler | Útil para inicializar recursos asociados a la tarea. |
| <span style="white-space: nowrap;"><code>onTaskRemoved</code></span> | Al eliminar la tarea del scheduler | Ideal para limpiar recursos y realizar acciones de cierre. |
| <span style="white-space: nowrap;"><code>onTaskExecuted</code></span> | Cada ejecución exitosa | Parfecto para registrar logs, actualizar métricas o enviar notificaciones. |
| <span style="white-space: nowrap;"><code>onTaskError</code></span> | Cuando ocurre un error | Permite implementar lógica de recuperación, reintentos automáticos o alertas. |
| <span style="white-space: nowrap;"><code>onTaskMissed</code></span> | Cuando falla la ejecución programada | Se dispara si el servidor estuvo apagado durante la ejecución programada. |
| <span style="white-space: nowrap;"><code>onTaskSubmitted</code></span> | Antes de cada ejecución | Permite validar precondiciones o preparar el estado. |
| <span style="white-space: nowrap;"><code>onTaskMaxInstances</code></span> | Cuando se alcanza el límite concurrente | Útil para alertas o logging de situaciones de sobrecarga. |

### Ejemplo Práctico de Listener

```python
from orionis.console.base.listener import BaseTaskListener
from orionis.console.entities.task_event import TaskEvent
from orionis.services.log.contracts.log_service import ILogger

class ReportTaskListener(BaseTaskListener):

    # Inyectar el logger a través del constructor
    def __int__(self, logger: ILogger) -> None:
        self.logger = logger

    # Implementar el método para cuando la tarea se ejecuta exitosamente
    async def onTaskExecuted(self, event: TaskEvent) -> None:
        self.logger.info(f"Reporte generado exitosamente: {event.signature}")

    # Implementar el método para cuando ocurre un error durante la ejecución de la tarea
    async def onTaskError(self, event: TaskEvent) -> None:
        self.logger.error(f"Error al generar reporte: {event.signature} - {event.exception}")

```

## Programación de Tareas

### Ejecucion Única (Una Sola Vez)

Para ejecutar una tarea una única vez en una fecha y hora específica, utiliza el siguiente método:

- **`onceAt(year, month, day, hour=0, minute=0, second=0)`**: Programa la tarea para ejecutarse una sola y única vez en la fecha y hora indicada. Es especialmente útil para tareas puntuales o migraciones.

**Ejemplo de Ejecución Única:**

```python
# Ejecutar el cierre de operaciones el 1 de abril de 2026 a las 22:00
schedule.command("app:close-window").onceAt(2026, 4, 1, 22, 0, 0)

# Otra tarea que se ejecuta una sola vez
schedule.command("app:migration").purpose("Migración de datos inicial").onceAt(2026, 6, 15, 3, 0, 0)
```

**Nota importante**: El método `onceAt()` no es compatible con `randomDelay()`. Si necesitas ejecutar una tarea una sola vez, no intentes aplicar retrasos aleatorios.

### Programación por Intervalos de Segundos

Los siguientes métodos permiten programar tareas a intervalos basados en segundos:

- **`everySeconds(segundos)`**: Ejecuta la tarea cada N segundos.
- **Atajos predefinidos:**
    - Cada 5 segundos: `everyFiveSeconds()`
    - Cada 10 segundos: `everyTenSeconds()`
    - Cada 15 segundos: `everyFifteenSeconds()`
    - Cada 20 segundos: `everyTwentySeconds()`
    - Cada 25 segundos: `everyTwentyFiveSeconds()`
    - Cada 30 segundos: `everyThirtySeconds()`
    - Cada 35 segundos: `everyThirtyFiveSeconds()`
    - Cada 40 segundos: `everyFortySeconds()`
    - Cada 45 segundos: `everyFortyFiveSeconds()`
    - Cada 50 segundos: `everyFiftySeconds()`
    - Cada 55 segundos: `everyFiftyFiveSeconds()`

**Ejemplo de Programación por Segundos:**

```python
# Monitor que revisa el estado cada 30 segundos
schedule.command("app:heartbeat").purpose("Monitoreo de estado").everySeconds(30)

# Tareas rápidas cada 5 segundos usando atajo
schedule.command("app:quick-sync").everyFiveSeconds()

# Tarea crítica cada 15 segundos
schedule.command("app:critical-check").everyFifteenSeconds()
```

### Programación por Intervalos de Minutos

Los siguientes métodos permiten programar tareas a intervalos basados en minutos:

- **`everyMinutes(minutos)`**: Ejecuta la tarea cada N minutos.
- **`everyMinuteAt(segundos)`**: Ejecuta la tarea cada minuto en un segundo específico.
- **`everyMinutesAt(minutos, segundos)`**: Ejecuta la tarea cada N minutos, comenzando en un segundo específico.
- **Atajos disponibles:**
  - Cada 5 minutos: `everyFiveMinutes()` / `everyFiveMinutesAt(segundos)`
  - Cada 10 minutos: `everyTenMinutes()` / `everyTenMinutesAt(segundos)`
  - Cada 15 minutos: `everyFifteenMinutes()` / `everyFifteenMinutesAt(segundos)`
  - Cada 20 minutos: `everyTwentyMinutes()` / `everyTwentyMinutesAt(segundos)`
  - Cada 25 minutos: `everyTwentyFiveMinutes()` / `everyTwentyFiveMinutesAt(segundos)`
  - Cada 30 minutos: `everyThirtyMinutes()` / `everyThirtyMinutesAt(segundos)`
  - Cada 35 minutos: `everyThirtyFiveMinutes()` / `everyThirtyFiveMinutesAt(segundos)`
  - Cada 40 minutos: `everyFortyMinutes()` / `everyFortyMinutesAt(segundos)`
  - Cada 45 minutos: `everyFortyFiveMinutes()` / `everyFortyFiveMinutesAt(segundos)`
  - Cada 50 minutos: `everyFiftyMinutes()` / `everyFiftyMinutesAt(segundos)`
  - Cada 55 minutos: `everyFiftyFiveMinutes()` / `everyFiftyFiveMinutesAt(segundos)`

**Ejemplo de Programación por Minutos:**

```python
# Sincronización cada 10 minutos en el segundo 10
schedule.command("app:sync")\
    .purpose("Sincronizar datos con servidor externo")\
    .everyTenMinutesAt(10)

# Limpieza de sesiones cada 30 minutos
schedule.command("app:clean-sessions")\
    .everyThirtyMinutes()

# Actualización de caché cada 5 minutos exactamente en el segundo 0
schedule.command("app:update-cache")\
    .purpose("Actualizar caché de aplicación")\
    .everyFiveMinutesAt(0)
```

### Programación por Intervalos de Horas

Los siguientes métodos permiten programar tareas a intervalos basados en horas:

- **`hourly()`**: Ejecuta la tarea cada hora exactamente.
- **`hourlyAt(minute, second=0)`**: Ejecuta la tarea cada hora en minuto y segundo específicos.
- **`everyOddHours()`**: Ejecuta la tarea en horas impares (1, 3, 5, ..., 23).
- **`everyEvenHours()`**: Ejecuta la tarea en horas pares (0, 2, 4, ..., 22).
- **`everyHours(horas)`**: Ejecuta la tarea cada N horas.
- **`everyHoursAt(horas, minute, second=0)`**: Ejecuta la tarea cada N horas en minuto y segundo específicos.
- **Atajos por intervalo:**
    - Cada 2 horas: `everyTwoHours()`
    - Cada 3 horas: `everyThreeHours()`
    - Cada 4 horas: `everyFourHours()`
    - Cada 5 horas: `everyFiveHours()`
    - Cada 6 horas: `everySixHours()`
    - Cada 7 horas: `everySevenHours()`
    - Cada 8 horas: `everyEightHours()`
    - Cada 9 horas: `everyNineHours()`
    - Cada 10 horas: `everyTenHours()`
    - Cada 11 horas: `everyElevenHours()`
    - Cada 12 horas: `everyTwelveHours()`
- **Atajos con hora fija:**
    - Cada 2 horas en minuto/segundo fijo: `everyTwoHoursAt(minute, second=0)`
    - Cada 3 horas en minuto/segundo fijo: `everyThreeHoursAt(minute, second=0)`
    - Cada 4 horas en minuto/segundo fijo: `everyFourHoursAt(minute, second=0)`
    - Cada 5 horas en minuto/segundo fijo: `everyFiveHoursAt(minute, second=0)`
    - Cada 6 horas en minuto/segundo fijo: `everySixHoursAt(minute, second=0)`
    - Cada 7 horas en minuto/segundo fijo: `everySevenHoursAt(minute, second=0)`
    - Cada 8 horas en minuto/segundo fijo: `everyEightHoursAt(minute, second=0)`
    - Cada 9 horas en minuto/segundo fijo: `everyNineHoursAt(minute, second=0)`
    - Cada 10 horas en minuto/segundo fijo: `everyTenHoursAt(minute, second=0)`
    - Cada 11 horas en minuto/segundo fijo: `everyElevenHoursAt(minute, second=0)`
    - Cada 12 horas en minuto/segundo fijo: `everyTwelveHoursAt(minute, second=0)`

**Ejemplo de Programación por Horas:**

```python
# Indexación cada 4 horas a las 15 minutos de la hora
schedule.command("app:index")\
    .purpose("Indexación de búsqueda")\
    .everyFourHoursAt(15, 0)

# Sincronización horaria exacta
schedule.command("app:hourly-sync").hourly()

# Reporte cada 6 horas a las 30 minutos
schedule.command("app:report")\
    .purpose("Generar reporte horario")\
    .everySixHoursAt(30, 0)

# Tarea en horas pares (0, 2, 4, ...)
schedule.command("app:even-hours-task").everyEvenHours()
```

### Programación Diaria

Los siguientes métodos permiten programar tareas para ejecutarse diariamente o en intervalos de días:

- **`daily()`**: Ejecuta la tarea todos los días a las 00:00:00 (medianoche).
- **`dailyAt(hour, minute=0, second=0)`**: Ejecuta la tarea todos los días a la hora, minuto y segundo especificados.
- **`everyDays(dias)`**: Ejecuta la tarea cada N días a las 00:00:00.
- **`everyDaysAt(dias, hour, minute=0, second=0)`**: Ejecuta la tarea cada N días a la hora especificada.
- **Atajos por intervalo:**
    - Cada 2 días: `everyTwoDays()`
    - Cada 3 días: `everyThreeDays()`
    - Cada 4 días: `everyFourDays()`
    - Cada 5 días: `everyFiveDays()`
    - Cada 6 días: `everySixDays()`
    - Cada 7 días: `everySevenDays()`
- **Atajos con hora fija:**
    - Cada 2 días a hora fija: `everyTwoDaysAt(hour, minute=0, second=0)`
    - Cada 3 días a hora fija: `everyThreeDaysAt(hour, minute=0, second=0)`
    - Cada 4 días a hora fija: `everyFourDaysAt(hour, minute=0, second=0)`
    - Cada 5 días a hora fija: `everyFiveDaysAt(hour, minute=0, second=0)`
    - Cada 6 días a hora fija: `everySixDaysAt(hour, minute=0, second=0)`
    - Cada 7 días a hora fija: `everySevenDaysAt(hour, minute=0, second=0)`

**Ejemplo de Programación Diaria:**

```python
# Backup diario a las 02:00 AM
schedule.command("app:backup")\
    .purpose("Copia de seguridad diaria")\
    .dailyAt(2, 0, 0)

# Limpieza de registros antiguos cada día a las 03:00 AM
schedule.command("app:cleanup-old-logs")\
    .purpose("Eliminar registros antigos")\
    .dailyAt(3, 0, 0)

# Tarea cada 3 días a las 10:30 AM
schedule.command("app:maintenance")\
    .purpose("Mantenimiento periódico")\
    .everyThreeDaysAt(10, 30, 0)

# Ejecución diaria a medianoche
schedule.command("app:daily-report").daily()
```

### Programación Semanal

Los siguientes métodos permiten programar tareas para ejecutarse semanalmente o en días específicos de la semana:

- **`weekly()`**: Ejecuta la tarea cada domingo a las 00:00:00.
- **`everyWeeks(semanas)`**: Ejecuta la tarea cada N semanas a las 00:00:00 del domingo.
- **Días específicos de la semana:**
  - Lunes: `everyMondayAt(hour, minute=0, second=0)`
  - Martes: `everyTuesdayAt(hour, minute=0, second=0)`
  - Miércoles: `everyWednesdayAt(hour, minute=0, second=0)`
  - Jueves: `everyThursdayAt(hour, minute=0, second=0)`
  - Viernes: `everyFridayAt(hour, minute=0, second=0)`
  - Sábado: `everySaturdayAt(hour, minute=0, second=0)`
  - Domingo: `everySundayAt(hour, minute=0, second=0)`

**Ejemplo de Programación Semanal:**

```python
# Reporte semanal cada lunes a las 08:30 AM
schedule.command("app:weekly-report")\
    .purpose("Reporte semanal de operaciones")\
    .everyMondayAt(8, 30)

# Mantenimiento cada viernes a las 22:00 (10 PM)
schedule.command("app:maintenance-window")\
    .purpose("Ventana de mantenimiento semanal")\
    .everyFridayAt(22, 0)

# Tarea de sincronización cada martes y jueves a las 09:00 AM
schedule.command("app:sync-tuesday").everyTuesdayAt(9, 0)
schedule.command("app:sync-thursday").everyThursdayAt(9, 0)

# Ejecución semanal el domingo a medianoche
schedule.command("app:weekly-cleanup").weekly()
```

### Programación con Intervalo Personalizado

El método `every()` permite combinar múltiples unidades de tiempo en una única regla, proporcionando flexibilidad para casos específicos:

- **`every(weeks=0, days=0, hours=0, minutes=0, seconds=0)`**: Ejecuta la tarea cada vez que se cumplan todos los intervalos combinados.

**Ejemplo de Intervalo Personalizado:**

```python
# Ejecutar cada 1 hora y 30 minutos
schedule.command("app:poll")\
    .purpose("Sondeo de datos")\
    .every(hours=1, minutes=30)

# Ejecutar cada 2 días, 3 horas y 15 minutos
schedule.command("app:complex-task")\
    .every(days=2, hours=3, minutes=15)

# Ejecutar cada 1 semana y 2 días
schedule.command("app:weekly-extended")\
    .every(weeks=1, days=2)

# Ejecutar cada 45 segundos
schedule.command("app:quick-check").every(seconds=45)
```

### Programación con Expresiones CRON

Para casos más avanzados y complejos, el método `cron()` proporciona compatibilidad total con expresiones CRON estándar:

- **`cron(year, month, day, week, day_of_week, hour, minute, second)`**: Permite definir reglas CRON personalizadas para un control granular de la programación.

Esta es la opción más flexible y poderosa para expresiones avanzadas, adecuada para patrones de ejecución complejos.

**Parámetros de CRON**

| Parámetro | Valores | Descripción |
|-----------|---------|-------------|
| `year` | 1970-3000 | Año específico o rango |
| `month` | 1-12 | Mes específico, rango o asterisco (*) |
| `day` | 1-31 | Día del mes específico, rango o asterisco (*) |
| `week` | 0-53 | Semana del año específica |
| `day_of_week` | mon-sun, 0-6 | Día de la semana (mon, tue, wed, thu, fri, sat, sun) |
| `hour` | 0-23 | Hora específica, rango o asterisco (*) |
| `minute` | 0-59 | Minuto específico, rango o asterisco (*) |
| `second` | 0-59 | Segundo específico, rango o asterisco (*) |

**Ejemplos de Expresiones CRON**

```python
# De lunes a viernes, a las 09:15:00 (horario de negocios)
schedule.command("app:open-market")\
    .purpose("Apertura del mercado")\
    .cron(day_of_week="mon-fri", hour="9", minute="15", second="0")

# Cada 15 minutos
schedule.command("app:frequent-task")\
    .cron(minute="*/15")

# Cada primer día del mes a las 00:00
schedule.command("app:monthly-report")\
    .purpose("Reporte mensual")\
    .cron(day="1", hour="0", minute="0", second="0")

# Cada trimestre (1 de enero, abril, julio, octubre)
schedule.command("app:quarterly-task")\
    .cron(month="1,4,7,10", day="1", hour="0", minute="0")

# Lunes, miércoles y viernes a las 18:00
schedule.command("app:three-days-task")\
    .cron(day_of_week="mon,wed,fri", hour="18", minute="0")

# Último día del mes a las 23:59
schedule.command("app:end-of-month")\
    .cron(day="L", hour="23", minute="59")
```

## Validaciones y Restricciones Importantes

El framework aplica validaciones automáticas a las configuraciones de tareas para evitar comportamientos inesperados. Es importante conocer estas restricciones:

**Restricciones de Valores**

- **Intervalos de tiempo**: Todos los intervalos (`seconds`, `minutes`, `hours`, `days`, `weeks`) deben ser números enteros positivos y mayores que cero.
- **Horas**: El valor de `hour` debe estar en el rango `0` a `23` (formato 24 horas).
- **Minutos y segundos**: Los valores de `minute` y `second` deben estar en el rango `0` a `59`.

**Restricciones de Combinación**

- **`onceAt()` + `randomDelay()`**: No es posible combinar ejecución única (`onceAt()`) con retraso aleatorio (`randomDelay()`). El framework lanzará una excepción si se intenta.
- **Validación de CRON**: Si utilizas `cron()`, debe indicarse al menos un campo/parámetro distinto de `None`.

**Ejemplo de Validaciones:**

```python
# ❌ INCORRECTO: hour fuera de rango
schedule.command("app:invalid").dailyAt(25, 0, 0)  # Lanzará excepción

# ✅ CORRECTO: hora válida
schedule.command("app:valid").dailyAt(23, 59, 59)

# ❌ INCORRECTO: combinación no permitida
schedule.command("app:error").randomDelay(10).onceAt(2026, 6, 15, 10, 0, 0)

# ✅ CORRECTO: métodos compatibles
schedule.command("app:ok").purpose("Tarea única").onceAt(2026, 6, 15, 10, 0, 0)
```

## Consideraciones Sobre Zona Horaria

**Configuración de Zona Horaria por Defecto**

El scheduler utiliza la zona horaria por defecto de la aplicación, obtenida del archivo de configuración `config\app.py` en la propiedad `timezone`. Todas las fechas, horas y comparaciones se realizan usando esta zona horaria.

**Importancia de la Configuración**

Es fundamental configurar correctamente la zona horaria de tu aplicación para garantizar que:

- Las tareas se ejecuten en el horario deseado.
- Los logs y registros de eventos reflejen la hora correcta.
- No haya confusiones en la interpretación de programaciones especificadas en horas locales.

## Oyentes Globales del Scheduler

Además de los listeners de tareas individuales, el scheduler proporciona eventos globales que se disparan cuando cambia el estado del ejecutor completo. Estos se definen dentro de la clase `Scheduler` en el archivo `app\console\scheduler.py`:

**Eventos Globales Disponibles**

```python
class Scheduler(BaseScheduler):

    async def onStarted(self, event: SchedulerEvent) -> None:
        """Se invoca cuando el scheduler inicia su ciclo de ejecución."""
        pass

    async def onPaused(self, event: SchedulerEvent) -> None:
        """Se invoca cuando el scheduler es pausado."""
        pass

    async def onResumed(self, event: SchedulerEvent) -> None:
        """Se invoca cuando el scheduler se reanuda después de una pausa."""
        pass

    async def onShutdown(self, event: SchedulerEvent) -> None:
        """
        Se invoca cuando el scheduler se apaga controladamente.
        (No se dispara en casos de apagado forzado o crash)
        """
        pass

```

**Descripción Detallada de Eventos Globales**

| <span style="white-space: nowrap;">Evento</span> | Momento de Disparo | Caso de Uso |
|---|---|---|
| <span style="white-space: nowrap;"><code>onStarted</code></span> | Cuando el scheduler inicia su ciclo | Inicializar conexiones, configurar recursos globales, registrar en logs que el scheduler está activo. |
| <span style="white-space: nowrap;"><code>onPaused</code></span> | Cuando el scheduler es pausado manualmente | Notificar a administradores, actualizar estado en base de datos, pausar operaciones asociadas. |
| <span style="white-space: nowrap;"><code>onResumed</code></span> | Cuando el scheduler se reanuda desde pausa | Reanudar operaciones pausadas, actualizar estado, sincronizar tareas pendientes. |
| <span style="white-space: nowrap;"><code>onShutdown</code></span> | Cuando el scheduler se apaga | Limpiar recursos, cerrar conexiones, finalizar operaciones en progreso, guardar estado. |

**Ejemplo de Implementación de Listeners Globales:**

```python
from orionis.console.base.scheduler import BaseScheduler
from orionis.console.contracts.schedule import ISchedule
from orionis.console.entities.scheduler_event import SchedulerEvent
from orionis.support.facades.logger import Log

class Scheduler(BaseScheduler):

    async def onStarted(self, event: SchedulerEvent) -> None:
        Log.info("📅 Scheduler iniciado exitosamente")

    async def onPaused(self, event: SchedulerEvent) -> None:
        Log.warning("⏸️  Scheduler pausado por administrador")

    async def onResumed(self, event: SchedulerEvent) -> None:
        Log.info("▶️  Scheduler reanudado")

    async def onShutdown(self, event: SchedulerEvent) -> None:
        Log.info("🛑 Scheduler apagado")
```

## Acciones del Scheduler desde Comandos

**Concepto General**

Es posible crear comandos de consola que ejecuten acciones sobre el scheduler mismo. Esto permite controlar el comportamiento del ejecutor de tareas de forma programática desde la línea de comandos o desde operaciones internas de la aplicación.

**Casos de Uso Comunes**

- **Pausar el scheduler**: Detener la ejecución de tareas temporalmente durante mantenimiento.
- **Reanudar el scheduler**: Reactivar la ejecución después de una pausa.
- **Eliminar tareas específicas**: Desactivar una tarea sin detener todo el scheduler.
- **Consultar información**: Obtener estado de tareas y ejecuciones.

**Ejemplo de Comando para Pausar el Scheduler:**

```python
from orionis.console.base.command import Command
from orionis.console.contracts.schedule import ISchedule

class PauseSchedulerCommand(Command):
    """Comando para pausar el scheduler"""

    signature = "scheduler:pause"
    description = "Pausa temporalmente el scheduler"

    # Inyectar el scheduler directamente en el método handle
    async def handle(self, scheduler: ISchedule) -> int:
        try:
            scheduler.pause()
            self.exitSuccess("✅ Scheduler pausado exitosamente")
        except RuntimeError as e:
            self.exitError(f"❌ Error al pausar: {e}")
```

**Ejemplo de Comando para Reanudar el Scheduler:**

```python
from orionis.console.base.command import Command
from orionis.console.contracts.schedule import ISchedule

class ResumeSchedulerCommand(Command):
    """Comando para reanudar el scheduler"""

    signature = "scheduler:resume"
    description = "Reanuda el scheduler tras una pausa"

    # Inyectar el scheduler directamente en el método handle
    async def handle(self, scheduler: ISchedule) -> int:
        try:
            scheduler.resume()
            self.exitSuccess("✅ Scheduler reanudado exitosamente")
        except RuntimeError as e:
            self.exitError(f"❌ Error al reanudar: {e}")
```

## Métodos de la Clase Scheduler

Los siguientes métodos están disponibles en la clase `Scheduler` para consultar y controlar el estado y el comportamiento del ejecutor de tareas programadas.
Se pueden utilizar tanto desde comandos personalizados como desde cualquier parte de la aplicación que tenga acceso a una instancia del scheduler.

### Métodos de Consulta de Estado

#### `state() -> str`

Devuelve el estado actual del scheduler como una cadena de texto.

```python
estado = scheduler.state()
# Valor retornado: "RUNNING", "PAUSED", o "STOPPED"
```

#### `isRunning() -> bool`

Determina si el scheduler está actualmente en ejecución.

```python
if scheduler.isRunning():
    self.info("El scheduler está ejecutando tareas")
```

#### `isPaused() -> bool`

Determina si el scheduler está actualmente pausado.

```python
if scheduler.isPaused():
    self.info("El scheduler está pausado temporalmente")
```

#### `isStopped() -> bool`

Determina si el scheduler ha sido detenido.

```python
if scheduler.isStopped():
    self.info("El scheduler está completamente detenido")
```

#### `info() -> list[dict]` (Asincrónico)

Recupera información detallada sobre todas las tareas cargadas en el scheduler.

```python
tareas = await scheduler.info()

# Retorna una lista de diccionarios con detalles de cada tarea
for tarea in tareas:
    self.info(tarea["signature"])
    self.info(tarea["args"])
    self.info(tarea["purpose"])
    self.info(tarea["random_delay"])
    self.info(tarea["coalesce"])
    self.info(tarea["max_instances"])
    self.info(tarea["misfire_grace_time"])
    self.info(tarea["start_date"])
    self.info(tarea["end_date"])
    self.info(tarea["details"])
```

### Métodos de Control de Tareas Individuales

#### `pauseTask(signature: str) -> bool`

Pausa la ejecución de una tarea específica sin afectar otras tareas.

```python
try:
    scheduler.pauseTask("app:sync")
    self.info("Tarea pausada correctamente")
except ValueError:
    self.info("La tarea no existe")
except RuntimeError:
    self.info("El scheduler no ha sido iniciado")
```

**Parámetros:**
- `signature` (str): Identificador único de la tarea a pausar.

**Excepciones:**
- `RuntimeError`: Si el scheduler no ha sido iniciado.
- `ValueError`: Si la tarea especificada no existe.

#### `resumeTask(signature: str) -> bool`

Reanuda la ejecución de una tarea pausada.

```python
try:
    scheduler.resumeTask("app:sync")
    self.info("Tarea reanudada correctamente")
except ValueError:
    self.info("La tarea no existe")
except RuntimeError:
    self.info("El scheduler no está en estado pausado para esta tarea")
```

#### `removeTask(signature: str) -> bool`

Elimina completamente una tarea del scheduler.

```python
try:
    scheduler.removeTask("app:old-task")
    self.info("Tarea eliminada del scheduler")
except ValueError:
    self.info("La tarea no existe")
except RuntimeError:
    self.info("El scheduler no ha sido iniciado")
```

**Nota:** Esta acción es permanente durante la sesión actual del scheduler.

#### `removeAllTasks() -> bool`

Elimina todas las tareas del scheduler de una sola vez.

```python
try:
    scheduler.removeAllTasks()
    self.info("Todas las tareas han sido eliminadas")
except RuntimeError:
    self.info("Error al eliminar tareas")
```

### Métodos de Control del Scheduler Completo

#### `pause() -> bool`

Pausa el scheduler completamente, deteniendo la ejecución de nuevas tareas sin terminar las que están en progreso.

```python
try:
    scheduler.pause()
    self.info("Scheduler pausado")
except RuntimeError:
    self.info("El scheduler no está en estado de ejecución")
```

**Comportamiento:**
- Las tareas no se ejecutarán en el horario programado.
- Las tareas en ejecución continuarán hasta completarse.
- El scheduler permanece cargado en memoria.

#### `resume() -> bool`

Reanuda la ejecución del scheduler después de una pausa.

```python
try:
    scheduler.resume()
    self.info("Scheduler reanudado")
except RuntimeError:
    self.info("El scheduler no está pausado")
```

#### `shutdown(wait: int | None = None) -> None`

Apaga el scheduler de forma segura y limpia.

```python
# Apagar sin esperar
scheduler.shutdown()

# Apagar con tiempo de espera
# Esperar máximo 30 segundos a que las tareas en progreso
# finalicen antes de forzar el apagado
scheduler.shutdown(wait=30)
```

**Parámetros:**
- `wait` (int | None, opcional): Tiempo en segundos para esperar la finalización. Si es `None`, no espera.

**Comportamiento:**
- Detiene la Aceptación de nuevas tareas.
- Permite que las tareas en progreso continúen (sin esperar su finalización si `wait` es None).
- Libera recursos del scheduler.
- Limpia conexiones y estado interno.

**Nota:** Ideal para entornos de consola donde el proceso se termina inmediatamente después.

### Resumen de Métodos por Categoría

| Categoría | Método | Tipo | Descripción |
|-----------|--------|------|-------------|
| **Consulta** | `state()` | Sincrónico | Obtiene estado actual |
| **Consulta** | `isRunning()` | Sincrónico | Verifica si está ejecutando |
| **Consulta** | `isPaused()` | Sincrónico | Verifica si está pausado |
| **Consulta** | `isStopped()` | Sincrónico | Verifica si está detenido |
| **Consulta** | `info()` | Asincrónico | Obtiene info de tareas |
| **Control Individual** | `pauseTask()` | Sincrónico | Pausa una tarea |
| **Control Individual** | `resumeTask()` | Sincrónico | Reanuda una tarea |
| **Control Individual** | `removeTask()` | Sincrónico | Elimina una tarea |
| **Control Individual** | `removeAllTasks()` | Sincrónico | Elimina todas las tareas |
| **Control Global** | `pause()` | Sincrónico | Pausa el scheduler |
| **Control Global** | `resume()` | Sincrónico | Reanuda el scheduler |
| **Control Global** | `shutdown()` | Sincrónico | Apaga el scheduler |

## Mejores Prácticas y Patrones Recomendados

### 1. Limitar Instancias Concurrentes

Siempre utiliza `maxInstances(1)` para tareas que acceden a recursos compartidos o bases de datos, evitando condiciones de carrera:

```python
schedule.command("app:backup")\
    .purpose("Copia de seguridad de base de datos")\
    .maxInstances(1)\ # Crítico para evitar bloqueos
    .dailyAt(2, 0, 0)
```

### 2. Implementar Listeners para Monitoreo

Registra listeners para tareas críticas y monitorea su ejecución:

```python
from app.console.listeners.critical_task_listener import CriticalTaskListener

schedule.command("app:process-payments")\
    .purpose("Procesar pagos pendientes")\
    .registerListener(CriticalTaskListener())\
    .maxInstances(1)\
    .everyTenMinutes()
```

### 3. Usar Propósitos Descriptivos

Siempre proporciona una descripción clara del propósito de la tarea:

```python
schedule.command("app:clean-db")\
    .purpose("Limpiar registros de auditoría más antiguos de 90 días")\
    .dailyAt(3, 0, 0)
```

### 4. Configurar Tolerancia para Interrupciones

Configura `misfireGraceTime()` para recuperarse automáticamente de interrupciones:

```python
schedule.command("app:sync")\
    .misfireGraceTime(300)\ # Tolerancia de 5 minutos
    .coalesce(True)\ # Consolidar ejecuciones pendientes
    .everyTenMinutes()
```

### 5. Usar Retrasos Aleatorios para Distribuir Carga

Cuando hay múltiples servidores ejecutando el mismo scheduler, añade variabilidad:

```python
schedule.command("app:health-check")\
    .randomDelay(30)\ # Retraso aleatorio de 0-30 segundos
    .everyMinutes(5)
```

### 6. Usar CRON para Patrones Complejos

Para programaciones complejas, prefiere CRON sobre combinaciones múltiples:

```python
# ✅ MEJOR: Clara y expresiva
schedule.command("app:business-hours").cron(
    day_of_week="mon-fri",
    hour="9-17",
    minute="*/15"
)

# ❌ EVITAR: Múltiples definiciones idénticas
schedule.command("app:task").everyMondayAt(9, 0)
schedule.command("app:task").everyTuesdayAt(9, 0)
# ... repetir para cada día
```

## Notas

El programador de tareas de Orionis Framework proporciona un sistema robusto, flexible y fácil de usar para automatizar procesos recurrentes dentro de tu aplicación. Con:

- **Configuración intuitiva**: API fluida y expresiva
- **Flexibilidad extrema**: Desde programación simple hasta reglas CRON complejas
- **Monitoreo avanzado**: Listeners y eventos para cada aspecto
- **Control preciso**: Métodos para pausar, reanudar y gestionar tareas
- **Recuperación automática**: Tolerancia a fallos e interrupciones

Tienes en tus manos una herramienta profesional capaz de manejar los requerimientos más exigentes de automatización de tareas. Aprovecha estas funcionalidades para mantener tu aplicación funcionando de manera confiable y diferenciada dentro del ecosistema de frameworks modernos.