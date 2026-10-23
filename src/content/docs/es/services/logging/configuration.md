---
title: "Canales y configuración de logs"
description: "Referencia completa de config/logging.py: seis canales, niveles, rutas, variables de entorno y validación de las entidades de configuración."
editUrl: true
lastUpdated: false
---

`config/logging.py` define `BootstrapLogging`, una dataclass inmutable que hereda de `Logging`. Selecciona el canal predeterminado y configura los seis canales incorporados. El servicio obtiene la configuración resuelta de `app.config("logging")`; no consulta `.env` por cada mensaje.

<a id="logging-configuration"></a>
## Configuración general

Importa las entidades desde su módulo público:

```python
from orionis.foundation.config.logging import (
    Channels, Chunked, Daily, Hourly, Level, Logging,
    Monthly, Stack, Weekly,
)
```

| Entidad y campo | Tipo y predeterminado | Comportamiento |
|---|---|---|
| `Logging.default` | `str`; `LOG_CHANNEL`, o `"stack"`. | Canal seleccionado al inicializar el logger. Solo acepta los seis nombres exactos de la tabla siguiente. |
| `Logging.channels` | `Channels \| dict`; nueva entidad `Channels()`. | Un diccionario se convierte en `Channels(**valor)` y valida sus entradas. |
| `BootstrapLogging.default` | `str`; mismo valor de entorno. | El archivo del proyecto hace explícita la selección del canal. |
| `BootstrapLogging.channels` | `Channels \| dict`; fábrica con las seis entidades. | Expone las lecturas de entorno y las condiciones que puedes personalizar en este archivo. |

`default=" DAILY "`, `default="Daily"` y un nombre desconocido producen `ValueError`: el nombre no se recorta ni se normaliza. Un valor de `channels` que no sea `Channels` o `dict` produce `TypeError`.

<a id="logging-channels"></a>
## Los seis canales disponibles

Cada campo de `Channels` acepta su entidad correspondiente o un `dict`, convertido al construir la configuración. Todos se crean y validan, aunque solo uno esté activo. No admiten `None`; una entrada desconocida como `audit` produce `TypeError` al construir `Channels`.

| Campo de `Channels` | Entidad | Ruta predeterminada | Política incorporada |
|---|---|---|---|
| `stack` | `Stack` | `storage/logs/stack.log` | Un único archivo sin rotación. El nombre no representa una combinación de canales. |
| `hourly` | `Hourly` | `storage/logs/hourly_{suffix}.log` | Sufijo por hora. |
| `daily` | `Daily` | `storage/logs/daily_{suffix}.log` | Sufijo por fecha. |
| `weekly` | `Weekly` | `storage/logs/weekly_{suffix}.log` | Sufijo por semana ISO. |
| `monthly` | `Monthly` | `storage/logs/monthly_{suffix}.log` | Sufijo por año y mes. |
| `chunked` | `Chunked` | `storage/logs/chunked_{suffix}.log` | Sufijo con fecha y contador, compresión gzip de los archivos cerrados. |

Los nombres seleccionan implementaciones concretas; no hay un campo `driver` ni un registro `extend()` de canales en estas entidades. El sistema incluido escribe archivos UTF-8 y no necesita instalar extras de Orionis. No incluye canales SMTP, Redis, servicios remotos ni salida JSON como opciones de esta configuración.

Para escribir y consultar el canal activo, consulta [fachada e inyección del logger](/es/services/logging/writing-logs). El servicio mantiene **un canal activo**; declarar seis configuraciones no envía cada mensaje a seis archivos.

<a id="logging-levels"></a>
## Nivel de cada canal

Las seis entidades exponen `level: int | str | Level`. Todas leen `LOG_LEVEL`, con `Level.INFO` como valor predeterminado, y almacenan el nivel como entero después de validarlo.

| Miembro de `Level` | Valor | Cuándo utilizarlo |
|---|---|---|
| `DEBUG` | `10` | Detalles de diagnóstico durante una investigación. |
| `INFO` | `20` | Eventos esperados, como la finalización de una importación. |
| `WARNING` | `30` | Condiciones inesperadas que permiten continuar. |
| `ERROR` | `40` | Una operación no pudo completarse. |
| `CRITICAL` | `50` | Fallos graves que comprometen la continuidad del servicio. |

El nivel configura el umbral del handler: `WARNING` admite `WARNING`, `ERROR` y `CRITICAL`. No cambia la severidad de un mensaje enviado con `info()`.

```python
from orionis.foundation.config.logging import Daily, Level


daily = Daily(level=Level.WARNING)
assert daily.level == 30
assert Daily(level=" warning ").level == 30
assert Daily(level=30).level == 30
```

Los nombres de nivel sí se recortan y convierten a mayúsculas. Solo se aceptan los cinco nombres o valores anteriores: `"WARN"`, `"FATAL"`, `"30"`, `0` y `25` producen `ValueError`; `True`, `None` y un `float` producen `TypeError`. No hay niveles `notice`, `alert` ni `emergency` en `Level`.

<a id="logging-paths"></a>
## Ubicación y validación de las rutas

Todas las entidades tienen `path: str`. Debe ser una cadena no vacía que termine exactamente en `.log`; `.LOG`, una ruta con espacios al final o una ruta de directorio no cumplen la validación. No se recorta ni transforma la cadena. Las entidades rotativas exigen además el marcador literal `{suffix}`; en `Stack` no es obligatorio.

```python
from orionis.foundation.config.logging import Daily, Stack


single_file = Stack(path="storage/logs/application.log")
daily_files = Daily(path="storage/logs/application_{suffix}.log")
```

Usa rutas relativas a la raíz del proyecto para una configuración consistente. Los handlers crean los directorios padre al preparar su archivo, no durante la validación de `path`. La creación del directorio no implica que el proceso tenga permisos para escribir todos los archivos posteriores.

Hay una diferencia concreta con rutas absolutas: los handlers rotativos y el handler `stack` creado mediante `switchChannel()` usan `Path(app_root) / path`, que conserva una ruta absoluta. La inicialización de `stack` como canal predeterminado concatena la raíz y `path` como texto; por ello **no interpreta de forma consistente una ruta absoluta**. Configura una ruta relativa en `stack`.

El directorio habitual es `storage/logs`, pero no se obtiene del disco predeterminado de `Storage`. El logger escribe directamente en el sistema de archivos mediante el `path` de su canal. Consulta [ubicación, nombres y concurrencia](/es/services/logging/rotation-and-lifecycle#log-files) para el alcance de estos archivos entre procesos.

<a id="logging-retention-options"></a>
## Opciones de retención y rotación

Además de `path` y `level`, estas entidades exponen los siguientes campos:

| Entidad y campo | Tipo y predeterminado | Valores admitidos |
|---|---|---|
| `Hourly.retention_hours` | `int`; `24`. | De `1` a `168`. |
| `Daily.retention_days` | `int`; `7`. | De `1` a `90`. |
| `Daily.at` | `datetime.time \| str`; `time(0, 0, 0)`. | Una hora Python o una cadena aceptada por `time.fromisoformat()`, por ejemplo `"00:00:00"`. Se almacena como `time`. |
| `Weekly.retention_weeks` | `int`; `4`. | De `1` a `12`. |
| `Monthly.retention_months` | `int`; `4`. | De `1` a `12`. |
| `Chunked.mb_size` | `int`; `10`. | De `1` a `1000`; la factory calcula `mb_size * 1024 * 1024` bytes. |
| `Chunked.files` | `int`; `5`. | Mayor o igual que `1`, sin máximo adicional en la entidad. |

Los campos numéricos no aceptan booleanos ni cadenas numéricas. Tipos incorrectos producen `TypeError` y valores fuera del intervalo producen `ValueError`. En `Hourly`, un entero negativo produce `TypeError`; cero o un entero superior a `168`, `ValueError`. Una cadena de hora inválida produce `ValueError`; otro tipo de `at`, `TypeError`.

**Los nombres `retention_hours`, `retention_days`, `retention_weeks` y `retention_months` no implementan una caducidad por edad.** La factory entrega su valor como `backup_count`: el handler cuenta archivos coincidentes, los ordena por modificación y limpia al rotar. No existe una tarea que elimine cada archivo al cumplir ese número de horas, días, semanas o meses.

`Daily.at` se entrega al resolver y permite calcular su siguiente hora teórica; el handler integrado decide por cambio de sufijo de fecha, sin consultar ese cálculo. Tampoco presupongas que `Chunked.mb_size` agrupa mensajes hasta alcanzar el límite: su resolver cambia el sufijo en cada emisión y provoca rotaciones antes de ese umbral. Revisa los ejemplos y las consecuencias exactas en [rotación y retención](/es/services/logging/rotation-and-lifecycle#time-rotation) antes de elegir una política.

`Stack` no tiene campos de rotación ni retención. `Weekly` y `Monthly` no exponen un campo `at` en sus entidades, aunque la factory de bajo nivel pueda leer una clave con ese nombre de un diccionario.

<a id="logging-environment"></a>
## Variables del archivo del proyecto

Estas son todas las lecturas de entorno de `config/logging.py`:

| Variable | Predeterminado | Alcance real |
|---|---|---|
| `LOG_CHANNEL` | `stack` | Selecciona `Logging.default` y determina qué entidad recibe `LOG_PATH` y `LOG_RETENTION`. |
| `LOG_LEVEL` | `INFO` | Nivel inicial de **los seis canales**, incluidos los inactivos. |
| `LOG_PATH` | Ruta de la tabla de canales. | Sustituye solo la ruta del canal indicado por `LOG_CHANNEL`. |
| `LOG_RETENTION` | `24`, `7`, `4` o `4`. | Sustituye solo `retention_hours`, `retention_days`, `retention_weeks` o `retention_months` del canal de tiempo seleccionado. No configura `stack` ni `chunked`. |
| `LOG_ROTATION_TIME` | `00:00:00`. | Configura `Daily.at`, aunque el canal activo sea otro. |
| `LOG_MB_SIZE` | `10`. | Configura `Chunked.mb_size`, aunque el canal activo sea otro. |
| `LOG_FILES` | `5`. | Configura `Chunked.files`, aunque el canal activo sea otro. |

Por ejemplo, este `.env` selecciona `daily` y modifica únicamente su ruta y su contador de retención:

```dotenv
LOG_CHANNEL=daily
LOG_LEVEL=INFO
LOG_PATH=storage/logs/application_{suffix}.log
LOG_RETENTION=int:14
```

`hourly`, `weekly`, `monthly` y `chunked` conservan sus rutas estándar; `stack` conserva `storage/logs/stack.log`. Si después cambias de canal en runtime mediante `switchChannel("hourly")`, se utiliza la configuración ya resuelta de `hourly`; no se vuelven a aplicar a ese canal las variables compartidas.

Para seleccionar `chunked`, la configuración correspondiente sería:

```dotenv
LOG_CHANNEL=chunked
LOG_LEVEL=WARNING
LOG_PATH=storage/logs/worker_{suffix}.log
LOG_MB_SIZE=int:20
LOG_FILES=int:8
```

Estos valores configuran los campos de `Chunked`; su comportamiento de rotación por registro sigue siendo el descrito anteriormente. `LOG_RETENTION` no modifica `files`.

Usa el componente de [Entorno](/es/architecture/environment) **solo en los archivos de configuración**. En controladores, comandos y servicios, utiliza la configuración de la aplicación o el logger inyectado. Un valor inválido de un canal inactivo también puede impedir construir `Channels`: por ejemplo, `LOG_FILES=int:0` es inválido incluso con `LOG_CHANNEL=stack`.

<a id="logging-custom-configuration"></a>
## Configurar cada canal de forma independiente

Puedes editar `config/logging.py` para dar a cada canal una ruta, nivel y política propios. Este reemplazo completo muestra todos los campos admitidos y evita depender de una variable compartida:

```python
from dataclasses import dataclass, field
from datetime import time
from orionis.foundation.config.logging import (
    Channels, Chunked, Daily, Hourly, Level, Logging,
    Monthly, Stack, Weekly,
)


@dataclass(frozen=True, kw_only=True)
class BootstrapLogging(Logging):
    default: str = "daily"
    channels: Channels | dict = field(
        default_factory=lambda: Channels(
            stack=Stack(
                path="storage/logs/application.log",
                level=Level.WARNING,
            ),
            hourly=Hourly(
                path="storage/logs/hourly_{suffix}.log",
                level=Level.DEBUG,
                retention_hours=48,
            ),
            daily=Daily(
                path="storage/logs/daily_{suffix}.log",
                level=Level.INFO,
                retention_days=14,
                at=time(0, 0, 0),
            ),
            weekly=Weekly(
                path="storage/logs/weekly_{suffix}.log",
                level=Level.INFO,
                retention_weeks=8,
            ),
            monthly=Monthly(
                path="storage/logs/monthly_{suffix}.log",
                level=Level.WARNING,
                retention_months=6,
            ),
            chunked=Chunked(
                path="storage/logs/chunked_{suffix}.log",
                level=Level.ERROR,
                mb_size=20,
                files=8,
            ),
        ),
    )
```

También puedes usar diccionarios para las mismas entidades:

```python
from orionis.foundation.config.logging import Logging


settings = Logging(
    default="daily",
    channels={
        "daily": {
            "path": "storage/logs/application_{suffix}.log",
            "level": "INFO",
            "retention_days": 14,
            "at": "00:00:00",
        },
    },
)
assert settings.channels.daily.level == 20
```

Los cinco campos omitidos de `Channels` construyen sus entidades predeterminadas. No se desactivan. Una clave no admitida por una entidad, como `daily={"files": 8}`, produce `TypeError`.

Las entidades son inmutables: realiza estos cambios antes de crear la aplicación. Si necesitas modificar la configuración resuelta de una aplicación ya iniciada, revisa [recarga y selección del canal](/es/services/logging/rotation-and-lifecycle#logger-lifecycle); cambiar `.env` o el archivo Python no reconfigura por sí solo los handlers existentes.

<a id="logging-validators"></a>
## Validadores públicos de configuración

Las entidades aplican estos validadores automáticamente. También están disponibles para validar configuraciones propias:

```python
from orionis.foundation.config.logging.validators import (
    IsValidLevel, IsValidPath,
)


assert IsValidLevel(" info ") is None
assert IsValidLevel.normalize(" info ") == 20
assert IsValidPath("storage/logs/application.log") is None
assert IsValidPath(
    "storage/logs/application_{suffix}.log",
    suffix=True,
) is None
```

`IsValidLevel(value: Level | int | str) -> None` valida sin devolver el entero; `IsValidLevel.normalize(value: Level | int | str) -> int` valida y devuelve el nivel numérico. Ambos comparten los tipos, nombres y errores de [niveles](#logging-levels).

`IsValidPath(value: str, *, suffix: bool = False) -> None` comprueba la cadena, el marcador cuando se exige y la terminación `.log`. No crea archivos, no comprueba permisos y no restringe la ruta a `storage/logs`. Un tipo incorrecto produce `TypeError`; una cadena vacía, un marcador ausente o una terminación incorrecta producen `ValueError`.
