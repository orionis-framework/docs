---
title: "Escribir y enviar jobs"
description: "Genera jobs async, declara su estado persistente, inyecta servicios al ejecutarlos y configura cada envío mediante PendingDispatch."
editUrl: true
lastUpdated: false
---

Un job representa una unidad de trabajo con datos propios y un método `handle()` asíncrono. El productor construye la instancia y envía sus datos; el consumidor reconstruye ese estado y ejecuta `handle()` mediante el contenedor. La conexión determina si esto sucede durante el envío (`sync`) o en un worker separado (`database` o `redis`).

<a id="generator"></a>

## Crear un job con el CLI

Desde la raíz del proyecto, cualquiera de estas alternativas genera el mismo archivo:

```shell
orionis make:job send_welcome
```

```shell
python -B reactor make:job send_welcome
```

La sintaxis es `make:job name`. `name` es el único argumento propio, obligatorio y de tipo `str`; `-h` / `--help` muestra la ayuda. No existen opciones de sobrescritura ni de selección de plantilla.

El destino se resuelve mediante la ruta de aplicación `app_jobs`, cuyo valor predeterminado es `app/jobs`. El generador añade el sufijo `Job` a la clase y `_job` al archivo cuando el nombre todavía no termina en `job`.

| Entrada | Archivo dentro de `app/jobs` | Clase |
| --- | --- | --- |
| `send_welcome` | `send_welcome_job.py` | `SendWelcomeJob` |
| `send_welcome_job` | `send_welcome_job.py` | `SendWelcomeJob` |
| `emails/send_welcome` | `emails/send_welcome_job.py` | `SendWelcomeJob` |
| `SendWelcome` | `sendwelcome_job.py` | `SendWelcomeJob` |

Prefiere `snake_case`: el nombre del archivo se convierte a minúsculas, pero el generador no inserta guiones bajos entre las palabras de un nombre CamelCase. Los directorios también se convierten a minúsculas. Se admiten separadores `/` y `\`, y se elimina la extensión final antes de generar `.py`. Cada componente debe comenzar con una letra ASCII y contener únicamente letras, números o `_`. Las rutas absolutas, los componentes vacíos, `.` y `..` se rechazan.

Los directorios faltantes se crean automáticamente. Si el archivo existe, se informa el error y se conserva su contenido: la escritura es exclusiva y no hay `--force`.

### Código generado

Para `send_welcome`, `app/jobs/send_welcome_job.py` contiene la siguiente plantilla, sustituyendo únicamente el nombre de clase:

```python
from typing import ClassVar
from orionis.logging.contracts.logger import ILogger
from orionis.queues import BaseJob

class SendWelcomeJob(BaseJob):
    """Log processing of the stored record identifier."""

    __slots__ = ("record_id",)

    record_id: int
    tries: ClassVar[int] = 3
    timeout: ClassVar[float] = 30.0
    backoff: ClassVar[tuple[float, ...]] = (1.0, 5.0)

    def __init__(self, record_id: int) -> None:
        """
        Store the persistent record identifier.

        Parameters
        ----------
        record_id : int
            Record identifier restored when the job is executed.
        """
        self.record_id = record_id

    async def handle(self, logger: ILogger) -> None:
        """
        Log the record identifier through an injected application service.

        Parameters
        ----------
        logger : ILogger
            Application logger resolved for this job execution.
        """
        message = f"Queue job processed record {self.record_id}."
        logger.info(message)
```

El nombre solicitado no añade lógica de negocio: este ejemplo generado registra el identificador recibido; todavía no envía un correo de bienvenida. Sustituye `handle()` por el trabajo de tu aplicación.

<a id="job-construction"></a>

## Estructura y política del job

Importa `BaseJob` desde `orionis.queues` y extiéndelo con una clase concreta, importable y definida fuera de funciones locales. `BaseJob` no recibe argumentos propios de construcción; cada job declara su `__init__()` para guardar los datos que necesitará después.

`__slots__` declara campos de instancia y evita un diccionario de atributos cuando la jerarquía tampoco lo aporta. Las anotaciones públicas también declaran campos persistentes; los slots y las anotaciones heredadas se recogen conjuntamente. `ClassVar` identifica datos de clase que no deben formar parte del mensaje.

| Opción de clase | Valor en `BaseJob` | Uso |
| --- | --- | --- |
| `tries: ClassVar[int \| None]` | `None` | Máximo de reservas/intentos. Un entero positivo; `True` y `False` no son válidos. |
| `timeout: ClassVar[float \| None]` | `None` | Tiempo de ejecución positivo y finito, en segundos. |
| `backoff: ClassVar[tuple[float, ...] \| None]` | `None` | Tupla no vacía de demoras finitas y no negativas entre intentos. |

`None` selecciona la opción correspondiente de `queue.worker` al enviar. La configuración predeterminada del worker es `tries=3`, `timeout=60.0` y `backoff=(0.0,)`; la plantilla generada cambia el timeout a `30.0` y el backoff a `(1.0, 5.0)` para esa clase.

Estas opciones se fijan dentro del envelope al confirmar el envío. Modificar posteriormente la clase o `config/queue.py` no reescribe mensajes ya persistidos. No declares `tries`, `timeout` o `backoff` como slots de instancia.

<a id="job-handle"></a>

### `async handle(...) -> None`

Es el punto de entrada obligatorio. El contrato base declara `async handle(self) -> None`; tu implementación puede incorporar parámetros tipados que el contenedor resolverá durante la ejecución, como el `ILogger` de la plantilla.

El worker espera a que `handle()` termine. Su valor de retorno no es un resultado recuperable de la cola: al finalizar correctamente se confirma y elimina el trabajo, salvo que `JobContext` haya efectuado otra transición. Lanza una excepción para que el worker aplique la política de errores, o utiliza los controles explícitos de [`JobContext`](/es/asynchronous/queues/workers-and-failures).

<a id="job-retryuntil"></a>

### `retryUntil() -> float | None`

Devuelve un instante absoluto Unix en segundos, o `None` para no establecer una fecha límite adicional. El manager llama a este método al enviar y persiste el resultado. El worker verifica la fecha antes de ejecutar y antes de programar un reintento.

Una fecha límite no sustituye `tries`: se aplican ambas restricciones. Un valor vencido puede impedir incluso el primer intento. Guarda la fecha como dato persistente cuando quieras que represente un plazo decidido al crear el job, como en el ejemplo siguiente. Debe ser un número finito; no una duración relativa, `datetime` ni un booleano.

### Relación entre timeout, backoff y reserva

El timeout efectivo debe ser menor que `retry_after` de la conexión. El envío rechaza un timeout igual o mayor. Al ejecutar, el worker además lo limita al 95 % de la vida restante de la reserva; la resolución de dependencias queda dentro de ese plazo.

El backoff de la primera excepción usa el primer elemento de la tupla; las siguientes avanzan y repiten el último si faltan valores. `tries` cuenta reservas, incluida la primera, no solamente reintentos. Consulta [reintentos y fallos](/es/asynchronous/queues/failures-and-retries) para la decisión completa.

## Datos en el constructor, servicios en `handle()`

El constructor del job lo ejecuta el productor de forma normal. Al consumir, el serializer crea la instancia mediante `object.__new__` y restaura sus campos: **no llama a `__init__()` ni inyecta servicios en el constructor del job**.

En cambio, `handle()` se invoca con `app.call(job, "handle")` dentro de un scope aislado por ejecución. Los servicios que recibe sí pueden utilizar inyección de dependencias por constructor.

Este ejemplo completo combina ambos mecanismos. Guárdalo como `app/jobs/write_report_job.py`:

```python
from typing import ClassVar
from orionis.queues import BaseJob, JobContext
from orionis.storage.contracts.manager import IStorageManager


class ReportWriter:
    def __init__(self, storage: IStorageManager) -> None:
        self._storage = storage

    async def write(self, record_id: int, text: str) -> None:
        await self._storage.disk("local").put(
            f"reports/{record_id}.txt",
            text,
            visibility="private",
        )


class WriteReportJob(BaseJob):
    __slots__ = ("record_id", "text", "deadline")

    record_id: int
    text: str
    deadline: float | None
    tries: ClassVar[int] = 3
    timeout: ClassVar[float] = 30.0
    backoff: ClassVar[tuple[float, ...]] = (1.0, 5.0)

    def __init__(
        self,
        record_id: int,
        text: str,
        deadline: float | None = None,
    ) -> None:
        self.record_id = record_id
        self.text = text
        self.deadline = deadline

    def retryUntil(self) -> float | None:
        return self.deadline

    async def handle(
        self,
        writer: ReportWriter,
        context: JobContext,
    ) -> None:
        await writer.write(self.record_id, self.text)
```

Solo `record_id`, `text` y `deadline` viajan en el mensaje. El contenedor construye `ReportWriter` e inyecta `IStorageManager` al ejecutarlo; el worker aporta el `JobContext` de esa reserva. La clase concreta `ReportWriter` no necesita un binding adicional.

El disco `local` debe estar configurado y ser escribible. Repetir el job con los mismos datos escribe la misma ruta con el mismo contenido, en lugar de crear un archivo diferente por intento. Esta propiedad facilita tolerar reentregas. El parámetro `context` se incluye para mostrar la inyección; las operaciones de liberación, confirmación y fallo se explican en la [guía del worker](/es/asynchronous/queues/workers-and-failures).

No guardes `Request`, conexiones, clientes de red, servicios o modelos vivos en campos del job. Envía sus identificadores y recupera lo necesario mediante servicios durante `handle()`. Tampoco añadas estado que dependa de efectos de `__init__()` sin declararlo y persistirlo. Una llamada manual `job.handle(...)` es una llamada Python normal; no activa el worker, sus scopes ni sus reintentos.

## Enviar desde un controlador

Con la conexión `database` configurada, este método envía el job anterior a la cola lógica `reports`:

```python
from app.jobs.write_report_job import WriteReportJob
from orionis.http import JSONResponse
from orionis.support.facades import DateTime, Queue


class ReportController:
    async def store(self) -> JSONResponse:
        deadline = DateTime.now().timestamp() + 600.0
        job = WriteReportJob(42, "Report ready", deadline)

        job_id = await (
            Queue.dispatch(job)
            .onConnection("database")
            .onQueue("reports")
            .delay(5.0)
        )

        return JSONResponse({"job_id": job_id}, status_code=202)
```

El identificador devuelto es el UUID del job. Para una conexión persistente confirma que el envío fue aceptado, no que el reporte ya esté listo. Un worker de esa conexión debe escuchar `reports`; un worker que solo escucha `default` no lo consumirá:

```shell
orionis queue:work database --queue reports
```

```shell
python -B reactor queue:work database --queue reports
```

La fachada se importa desde `orionis.support.facades`. El provider nativo la resuelve y fija durante el arranque de la aplicación; no requiere un provider propio.

### Enviar con el servicio inyectado

El mismo envío también funciona sin fachada. El contenedor puede proporcionar `IQueueManager` al constructor de un servicio, o al método de un controlador/comando que invoque mediante DI:

```python
from app.jobs.write_report_job import WriteReportJob
from orionis.queues.contracts.manager import IQueueManager


class ReportRequests:
    def __init__(self, queues: IQueueManager) -> None:
        self._queues = queues

    async def submit(self, record_id: int) -> str:
        return await (
            self._queues.dispatch(WriteReportJob(record_id, "Report ready"))
            .onConnection("database")
            .onQueue("reports")
        )
```

Consulta [servicio e inyección](/es/asynchronous/queues/manager-and-injection) para el registro nativo y los ejemplos de inyección en métodos.

<a id="pending-construction"></a>

## Referencia de `PendingDispatch`

`Queue.dispatch(job: BaseJob) -> PendingDispatch` es síncrono: conserva la instancia y devuelve la operación configurable. Construirla no serializa el job, no abre el backend y no envía nada. Una instancia que no herede de `BaseJob` produce `QueueConfigurationError` inmediatamente.

El constructor técnico es `PendingDispatch(submit: DispatchCallback, job: BaseJob) -> None`. `submit` es el callback async del manager, con firma `(job, connection, queue, delay) -> Awaitable[str]`. En el uso normal obtén este objeto mediante `dispatch()`.

<a id="pending-onconnection"></a>

### `onConnection(name: str) -> PendingDispatch`

Selecciona una **conexión configurada**, no directamente un driver. Devuelve el mismo objeto para continuar la cadena. Si se omite, al enviar se usa `queue.default`. La existencia de la conexión se comprueba al enviar; un nombre sintácticamente inválido se rechaza al configurar la opción.

<a id="pending-onqueue"></a>

### `onQueue(name: str) -> PendingDispatch`

Selecciona un canal lógico dentro de la conexión. No hace falta declararlo previamente en un registro de colas. Si se omite, se usa la propiedad `queue` de la conexión seleccionada.

Los nombres de conexiones y colas tienen entre 1 y 128 caracteres, comienzan con una letra ASCII o un dígito, y admiten después letras ASCII, dígitos, `.`, `_` y `-`. No se recortan espacios ni se convierten a minúsculas. Por ejemplo, `reports.high` es válido y `reports:high`, `../reports` o `monthly reports` no lo son.

<a id="pending-delay"></a>

### `delay(seconds: float) -> PendingDispatch`

Establece una demora finita y no negativa, relativa al momento del envío. Acepta `int` o `float`, pero no booleanos. El valor inicial es `0.0`; llamadas sucesivas sustituyen la demora.

En `database` y `redis` determina cuándo estará disponible el mensaje; no programa una ejecución exacta en ese instante. `sync` rechaza toda demora diferente de cero mediante `QueueDispatchError`. Cero significa disponible inmediatamente, y solo `sync` lo ejecuta durante ese mismo envío.

<a id="pending-__await__"></a>

### `__await__() -> Generator[object, None, str]`

Usa `await pending`: este protocolo llama al callback una sola vez y devuelve el identificador `str`. No hay un método terminal `send()`, ni un destructor que envíe automáticamente.

```python
from app.jobs.write_report_job import WriteReportJob
from orionis.support.facades import Queue


async def submit_once() -> str:
    pending = (
        Queue.dispatch(WriteReportJob(42, "Report ready"))
        .onConnection("database")
        .onQueue("reports")
    )

    first_id = await pending
    same_id = await pending
    assert same_id == first_id
    return first_id
```

Las esperas repetidas, incluso concurrentes, comparten el resultado o error de un único envío. Desde que comienza el primer `await`, cambiar conexión, cola o delay produce `QueueDispatchError`; un error no vuelve mutable el objeto. Para crear otro mensaje construye otra operación.

El job se conserva por referencia hasta iniciar el envío: no lo modifiques mientras se está enviando. La cancelación de una espera posterior no cancela la primera presentación; cancelar al iniciador deja esa operación cancelada y no provoca un segundo envío automático. Si una cancelación interrumpe una llamada de persistencia, el productor puede desconocer si el backend alcanzó a aceptarla; reintentar creando otro envío exige considerar duplicados.

<a id="serializer"></a>

## Qué estado se puede persistir

`JobSerializer` guarda datos explícitos y tipos registrados, no objetos Python arbitrarios. Cada productor y consumidor necesita la misma clase importable y la misma definición de campos.

### Campos y tipos admitidos

- Campos públicos declarados en `__slots__` o mediante anotaciones públicas, incluidos los heredados.
- `str`, `bytes`, `int`, `float` finito, `bool` y `None`.
- `list`, `tuple` y `dict` de esos valores, anidados; las claves de diccionarios deben ser `str`.
- Anotaciones de esos tipos, sus formas parametrizadas y uniones con `|`, por ejemplo `list[int]` o `float | None`. Los campos que solo figuran en slots no requieren una anotación, pero sus valores siguen sujetos a las mismas restricciones.

Las anotaciones se validan de forma estricta: `"42"` no sustituye a un campo `int`. Se rechazan objetos como `datetime`, `UUID`, modelos, servicios, sets, subclases de los contenedores admitidos, números no finitos y diccionarios con claves no string. Convierte esos objetos a identificadores o datos primitivos antes del envío.

Conserva las anotaciones evaluadas que muestra la plantilla. La inspección de campos no evalúa anotaciones en cadenas: `from __future__ import annotations` y `"int"` no son anotaciones persistentes admitidas. Tampoco se admite `Any`. Usa tipos concretos y, para un campo nullable, por ejemplo `int | None`.

Los campos privados, los slots que ocupen `tries` / `timeout` / `backoff` y los atributos de instancia sin declarar se rechazan. Todos los campos persistentes deben existir al codificar. `ClassVar` queda excluido de la carga.

### Formato, tamaño y descubrimiento

El estado se codifica en **MessagePack** y conserva las tuplas mediante una extensión propia. El envelope exterior se codifica en **JSON**, representando su campo `bytes` mediante base64. Ninguno de los dos formatos es pickle. Tanto el estado codificado como el envelope completo tienen un límite de **1 MiB**; el envelope añade metadatos y base64, por lo que el estado útil debe dejar margen. La profundidad máxima del estado es **32**.

El provider descubre durante el arranque los módulos dentro de la ruta `app_jobs` y registra sus clases concretas. La identidad estable es `modulo:Clase`, usando `__qualname__` para el nombre completo. Un tipo definido dentro de una función local no se admite. Las importaciones de los módulos deben funcionar en el worker y no deberían ejecutar efectos de negocio al importarse.

Enviar un job también registra su clase en el productor. Esto no registra la clase en otros procesos ni permite importar un módulo indicado por una carga externa: el consumidor solo reconstruye identidades que ya tiene registradas. Mover o renombrar clases, o modificar sus campos mientras existen mensajes pendientes, requiere conservar la compatibilidad del código que los consumirá.

Guarda documentos voluminosos en [Storage](/es/services/storage) y envía una ruta o identificador. Que `bytes` sea admisible no elimina el límite del envelope.

## API del serializer

El servicio nativo registra `IJobSerializer` con `JobSerializer` como singleton. Normalmente lo utiliza el manager; sus métodos están disponibles para integraciones que necesiten inspeccionar el formato sin cambiar la política de confianza.

<a id="serializer-construction"></a>

### `JobSerializer()`

Crea codecs reutilizables y un registro vacío. No importa automáticamente jobs de la aplicación ni abre conexiones.

<a id="serializer-register"></a>

### `register(job_type: type[BaseJob]) -> None`

Registra una clase concreta con `async handle()` e inspecciona sus campos. Repetir la misma clase es válido. Rechaza clases abstractas, no importables por estar en funciones locales, handlers síncronos, anotaciones incompatibles o identidades ya ocupadas por una clase diferente, mediante `QueueConfigurationError`.

<a id="serializer-encode"></a>

### `encode(job: BaseJob) -> tuple[str, bytes]`

Registra el tipo si hace falta y devuelve `(identidad, estado_MessagePack)`. Valida todos sus campos y el límite de tamaño. Un estado incompatible produce `QueuePayloadError`.

<a id="serializer-decode"></a>

### `decode(identity: str, payload: bytes) -> BaseJob`

Restaura únicamente una identidad registrada. Valida que la carga contenga exactamente los campos esperados, crea el objeto sin ejecutar su constructor y asigna el estado restaurado. Una identidad desconocida genera `UnknownJobError`; una carga corrupta, incompatible o demasiado grande, `QueuePayloadError`.

La siguiente inspección puede ejecutarse dentro de un componente async de la aplicación; no presenta ni ejecuta el job:

```python
from app.jobs.write_report_job import WriteReportJob
from orionis.queues.contracts.serializer import IJobSerializer


class JobPayloadInspector:
    async def inspect(self, serializer: IJobSerializer) -> dict[str, object]:
        original = WriteReportJob(42, "Report ready")
        identity, payload = serializer.encode(original)
        restored = serializer.decode(identity, payload)

        assert isinstance(restored, WriteReportJob)
        return {
            "identity": identity,
            "state_bytes": len(payload),
            "record_id": restored.record_id,
        }
```

<a id="serializer-encodeenvelope"></a>

### `encodeEnvelope(envelope: JobEnvelope) -> bytes`

Codifica el envelope inmutable como JSON y verifica el límite de 1 MiB. No envía ni reserva un job.

<a id="serializer-decodeenvelope"></a>

### `decodeEnvelope(payload: bytes) -> JobEnvelope`

Valida bytes JSON y los campos del envelope sin resolver su clase. Rechaza campos desconocidos, formatos inválidos o un número de versión de formato no admitido mediante `QueuePayloadError`.

<a id="job-envelope"></a>

## Envelope del envío

El manager construye `JobEnvelope` con argumentos nombrados. Es una estructura inmutable con campos extra prohibidos:

| Campo | Tipo y valor predeterminado | Contenido |
| --- | --- | --- |
| `id` | `str`, obligatorio | UUID del job. |
| `job` | `str`, obligatorio | Identidad registrada `modulo:Clase`. |
| `payload` | `bytes`, obligatorio | Estado MessagePack. |
| `connection` | `str`, obligatorio | Nombre de la conexión seleccionada. |
| `queue` | `str`, obligatorio | Nombre del canal lógico. |
| `max_tries` | `int`, obligatorio | Número positivo de intentos máximos. |
| `timeout` | `float \| None`, obligatorio | Plazo de ejecución; el manager siempre fija un número positivo. |
| `backoff` | `tuple[float, ...]`, obligatorio | Demoras no negativas; no puede estar vacía. |
| `retry_until` | `float \| None = None` | Fecha límite absoluta, finita. |
| `version` | `int = 1` | Versión interna del formato de envelope. |

El constructor admite `timeout=None` en el formato, pero el worker lo rechaza al validar la reserva. La política normal de envío evita ese caso. La versión del envelope describe el formato de almacenamiento, no una versión del framework que debas fijar en la aplicación.

## Errores al enviar

Captura errores alrededor de `await Queue.dispatch(...)`: la serialización y la resolución de conexión ocurren al esperar, aunque algunas opciones se validan antes.

| Error | Causa en este flujo |
| --- | --- |
| `QueueConfigurationError` | Tipo de job, destino, anotaciones o política inválidos. |
| `QueuePayloadError` | Campos, valores, profundidad, formato o tamaño no admitidos. |
| `UnknownJobError` | El consumidor no tiene registrada la identidad persistida. |
| `QueueDispatchError` | Cambiar un envío iniciado o pedir demora al driver `sync`. |
| Error del backend | No se pudo completar la presentación al almacén. |

Un error de ejecución de `handle()` se observa durante el envío únicamente con `sync`. En las conexiones persistentes ocurre después, dentro del worker: usa el [manejo de fallos y excepciones](/es/asynchronous/queues/failures-and-retries). La confirmación del mensaje y los efectos externos no forman una única transacción automática; diseña el trabajo para poder repetirse.
