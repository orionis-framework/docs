---
title: Logging
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Logging

Orionis Framework proporciona un **sistema de logging multicanal** con rotación integrada, gestión automática de archivos e inicialización diferida. A diferencia de configuraciones básicas que escriben todo en un solo archivo, Orionis permite definir canales independientes — cada uno con su propia estrategia de rotación, política de retención y nivel de log — y alternar entre ellos en tiempo de ejecución sin reiniciar la aplicación.

El canal por defecto se lee de la variable de entorno `LOG_CHANNEL`, lo que facilita usar estrategias diferentes por entorno (por ejemplo, `stack` en desarrollo, `daily` en producción) sin cambiar una sola línea de código.

---

## Inicio Rápido

El servicio de logging se accede a través de la facade `Log`. **No debes importar la clase del servicio directamente** — la facade lo resuelve desde el contenedor de servicios automáticamente y proporciona una API limpia de estilo estático:

```python
from orionis.support.facades.logger import Log

# Registrar en diferentes niveles de severidad
Log.info("Aplicación iniciada correctamente")
Log.debug("Procesando payload de la petición")
Log.warning("Uso de disco superior al 80%")
Log.error("Error al conectar con la base de datos")
Log.critical("Fallo irrecuperable del sistema")
```

El logger se inicializa de forma diferida en la primera llamada — no requiere configuración explícita.

---

## Niveles de Log

Cada canal acepta un parámetro `level` que controla la severidad mínima registrada. Los mensajes por debajo de este umbral se descartan silenciosamente.

| Nivel | Valor | Propósito |
|---|---|---|
| `DEBUG` | 10 | Información de diagnóstico detallada para desarrollo |
| `INFO` | 20 | Confirmación de que las operaciones funcionan correctamente |
| `WARNING` | 30 | Indicación de un problema potencial o comportamiento inesperado |
| `ERROR` | 40 | Fallo en una operación específica |
| `CRITICAL` | 50 | Fallo severo que puede comprometer la aplicación |

El nivel puede especificarse como cadena (`"DEBUG"`), entero (`10`) o mediante el enum `Level`:

```python
from orionis.foundation.config.logging.enums.levels import Level

# Las tres formas son equivalentes
level = Level.WARNING
level = "WARNING"
level = 30
```

---

## Canales

Un canal es un destino de logging con nombre, con su propia ruta de archivo, estrategia de rotación y política de retención. Orionis incluye **seis canales integrados**:

| Canal | Rotación | Formato del Sufijo | Configuración de Retención |
|---|---|---|---|
| `stack` | Ninguna — archivo único | *(ninguno)* | — |
| `hourly` | Cada hora | `YYYY-MM-DD_HH` | `retention_hours` |
| `daily` | Cada día | `YYYY-MM-DD` | `retention_days` |
| `weekly` | Cada lunes | `YYYY-weekWW` | `retention_weeks` |
| `monthly` | Primer día del mes | `YYYY-MM` | `retention_months` |
| `chunked` | Al alcanzar el límite de tamaño | `YYYYMMDD_HHMMSS_NNNN` | `files` |

Solo **un canal está activo** a la vez. El canal activo se determina por la configuración `default` en la configuración de logging.

### stack

El canal más simple. Escribe todas las entradas de log en un único archivo sin rotación. Ideal para desarrollo o aplicaciones de bajo tráfico.

```
storage/logs/stack.log
```

**Configuración por defecto:**

| Parámetro | Valor por defecto |
|---|---|
| `path` | `storage/logs/stack.log` |
| `level` | `INFO` |

### hourly

Crea un nuevo archivo de log cada hora. Los archivos anteriores se eliminan automáticamente tras el período de retención.

```
storage/logs/hourly_2026-03-31_14.log
storage/logs/hourly_2026-03-31_15.log
```

| Parámetro | Valor por defecto | Descripción |
|---|---|---|
| `path` | `storage/logs/hourly_{suffix}.log` | `{suffix}` se reemplaza automáticamente |
| `level` | `INFO` | Severidad mínima |
| `retention_hours` | `24` | Número de archivos horarios a conservar |

### daily

Crea un nuevo archivo de log cada día. Soporta un parámetro opcional `at` para controlar la hora exacta de rotación.

```
storage/logs/daily_2026-03-31.log
storage/logs/daily_2026-04-01.log
```

| Parámetro | Valor por defecto | Descripción |
|---|---|---|
| `path` | `storage/logs/daily_{suffix}.log` | `{suffix}` se reemplaza automáticamente |
| `level` | `INFO` | Severidad mínima |
| `retention_days` | `7` | Número de archivos diarios a conservar |
| `at` | `00:00` | Hora del día en que ocurre la rotación |

### weekly

Crea un nuevo archivo de log cada lunes. También soporta el parámetro `at`.

```
storage/logs/weekly_2026-week14.log
storage/logs/weekly_2026-week15.log
```

| Parámetro | Valor por defecto | Descripción |
|---|---|---|
| `path` | `storage/logs/weekly_{suffix}.log` | `{suffix}` se reemplaza automáticamente |
| `level` | `INFO` | Severidad mínima |
| `retention_weeks` | `4` | Número de archivos semanales a conservar |
| `at` | `00:00` | Hora del lunes en que ocurre la rotación |

### monthly

Crea un nuevo archivo de log el primer día de cada mes. También soporta el parámetro `at`.

```
storage/logs/monthly_2026-03.log
storage/logs/monthly_2026-04.log
```

| Parámetro | Valor por defecto | Descripción |
|---|---|---|
| `path` | `storage/logs/monthly_{suffix}.log` | `{suffix}` se reemplaza automáticamente |
| `level` | `INFO` | Severidad mínima |
| `retention_months` | `4` | Número de archivos mensuales a conservar |
| `at` | `00:00` | Hora del primer día en que ocurre la rotación |

### chunked

Rota basándose en el **tamaño del archivo** en lugar del tiempo. Cuando el archivo de log activo alcanza el límite configurado, se crea un nuevo fragmento y el anterior se **comprime automáticamente con gzip**. Ideal para aplicaciones de alto rendimiento donde los logs crecen rápidamente.

```
storage/logs/chunked_20260331_140523_0001.log
storage/logs/chunked_20260331_140523_0001.log.gz   ← comprimido tras la rotación
storage/logs/chunked_20260331_142107_0002.log
```

| Parámetro | Valor por defecto | Descripción |
|---|---|---|
| `path` | `storage/logs/chunked_{suffix}.log` | `{suffix}` se reemplaza automáticamente |
| `level` | `INFO` | Severidad mínima |
| `mb_size` | `10` | Tamaño máximo en megabytes antes de la rotación |
| `files` | `5` | Número máximo de archivos de fragmento a conservar |

---

## Configuración

Toda la configuración de logging se encuentra en el archivo `config/logging.py` en la raíz de tu proyecto. Este archivo exporta un dataclass `BootstrapLogging` que el framework lee durante el arranque.

### Variable de Entorno

El canal por defecto se controla mediante la variable de entorno `LOG_CHANNEL`:

```ini
# .env
LOG_CHANNEL=daily
```

Si no se define, el canal por defecto es `stack`.

### El Archivo `config/logging.py`

Para personalizar canales, políticas de retención o tiempos de rotación, edita `config/logging.py` directamente. Este es el **único lugar** donde debe configurarse el comportamiento del logging:

```python
# config/logging.py
from __future__ import annotations
from dataclasses import dataclass, field
from datetime import time
from orionis.foundation.config.logging.entities.channels import Channels
from orionis.foundation.config.logging.entities.daily import Daily
from orionis.foundation.config.logging.entities.stack import Stack
from orionis.foundation.config.logging.entities.chunked import Chunked
from orionis.foundation.config.logging.entities.logging import Logging
from orionis.foundation.config.logging.enums.levels import Level
from orionis.services.environment.env import Env

@dataclass(frozen=True, kw_only=True)
class BootstrapLogging(Logging):

    default: str = field(
        default_factory=lambda: Env.get("LOG_CHANNEL", "stack"),
    )

    channels: Channels | dict = field(
        default_factory=lambda: Channels(
            stack=Stack(
                path="storage/logs/app.log",
                level=Level.DEBUG,
            ),
            daily=Daily(
                path="storage/logs/daily_{suffix}.log",
                level=Level.WARNING,
                retention_days=14,
                at=time(2, 0),  # Rotar a las 2:00 AM
            ),
            chunked=Chunked(
                path="storage/logs/chunked_{suffix}.log",
                level=Level.INFO,
                mb_size=20,
                files=10,
            ),
        ),
    )
```

Cada entidad de canal valida sus parámetros en la construcción — rutas inválidas, niveles de log no soportados o tipos incorrectos lanzan errores descriptivos de inmediato.

> **Importante:** Solo necesitas declarar los canales que quieras utilizar. Los canales no incluidos en el constructor `Channels(...)` no estarán disponibles.

### Plantillas de Ruta

Los canales con rotación utilizan el marcador `{suffix}` en su ruta. Este marcador se reemplaza automáticamente con una marca de tiempo o identificador cuando se crea el archivo de log. Solo necesitas definir la plantilla:

```python
# El framework maneja el reemplazo del sufijo internamente
path = "storage/logs/daily_{suffix}.log"
# → storage/logs/daily_2026-03-31.log
```

> **Nota:** El canal `stack` no usa `{suffix}` — escribe en una ruta de archivo fija.

---

## Cambiar de Canal en Tiempo de Ejecución

Puedes cambiar el canal de logging activo sin reiniciar la aplicación usando `switchChannel()`:

```python
from orionis.support.facades.logger import Log

# Iniciar con el canal por defecto
Log.info("Usando canal por defecto")

# Cambiar a rotación diaria
success = Log.switchChannel("daily")
if success:
    Log.info("Ahora registrando en el canal diario")
```

`switchChannel()` devuelve `True` si el cambio fue exitoso, o `False` si el nombre del canal no existe en la configuración. Los handlers del canal anterior se cierran correctamente antes de activar el nuevo.

---

## Recargar Configuración

Si modificas `config/logging.py` o cambias la variable `LOG_CHANNEL` mientras la aplicación está en ejecución, puedes recargar la configuración dinámicamente:

```python
Log.reloadConfiguration()
```

Esto cierra todos los handlers actuales, relee la configuración de la aplicación y reinicializa el logger. Es seguro para hilos y puede invocarse desde cualquier contexto.

---

## Inspeccionar Canales

La facade `Log` proporciona métodos para inspeccionar el estado actual de los canales:

```python
from orionis.support.facades.logger import Log

# Obtener el nombre del canal actualmente activo
active = Log.getActiveChannel()
# → "daily"

# Obtener una lista de todos los nombres de canales activos
active_list = Log.getActiveChannels()
# → ["daily"]

# Obtener todos los canales definidos en config/logging.py
available = Log.getAvailableChannels()
# → ["stack", "daily", "chunked"]
```

---

## Acceso Avanzado

Para escenarios que requieren acceso directo a la instancia subyacente de `logging.Logger` — como integrar con bibliotecas de terceros o agregar handlers personalizados — usa `getLogger()`:

```python
import logging
from orionis.support.facades.logger import Log

stdlib_logger = Log.getLogger()
stdlib_logger.addHandler(logging.StreamHandler())
```

> Usa esta vía de escape con moderación. En la mayoría de los casos, los cinco métodos de severidad (`info`, `debug`, `warning`, `error`, `critical`) son suficientes.

---

## Liberar Recursos

Cuando el logger ya no sea necesario, llama a `close()` para liberar todos los identificadores de archivo y recursos del sistema:

```python
Log.close()
```

Todos los handlers se cierran y el estado interno se reinicia. El logger puede reutilizarse — se reinicializará de forma diferida en la siguiente llamada de log.

---

## Comportamientos Clave

- **Inicialización diferida:** El logger no hace nada hasta que se registra el primer mensaje. Esto mantiene el arranque de la aplicación rápido.
- **Seguridad de hilos:** Todas las operaciones — logging, cambio de canales, recarga — están protegidas por locks y son seguras para uso concurrente.
- **Filtrado de mensajes vacíos:** Los mensajes en blanco o que solo contienen espacios se descartan silenciosamente.
- **Creación automática de directorios:** Los directorios de log se crean bajo demanda — no requieren configuración manual.
- **Limpieza automática:** Los archivos rotados que exceden el límite de retención se eliminan automáticamente.
- **Respaldo elegante:** Si el canal por defecto configurado no se encuentra, el logger recurre a `storage/logs/default.log`.

---

## Ejemplo Completo

```python
from orionis.support.facades.logger import Log

# Registrar mensajes informativos (usa el canal por defecto del .env)
Log.info("Arranque de la aplicación completado")
Log.debug("42 rutas cargadas")

# Verificar el canal actual
print(Log.getActiveChannel())   # → "stack"
print(Log.getAvailableChannels())  # → ["stack", "daily", "chunked"]

# Cambiar a rotación diaria para logging en producción
Log.switchChannel("daily")
Log.warning("Cambiando a rotación diaria de logs")

# Tras un cambio de configuración, recargar sin reiniciar
Log.reloadConfiguration()

# Al apagar, liberar recursos
logger.close()
```
