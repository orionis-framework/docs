---
title: "Guardar y regenerar datos"
description: "API completa de CacheRepository: lecturas, escrituras, cache-aside, contadores, TTL, invalidación y fachada del store predeterminado."
editUrl: true
lastUpdated: false
---

Utiliza la caché para valores que puedan regenerarse desde una fuente persistente: resúmenes de catálogos, informes calculados o configuración preparada para una petición. Define juntos la clave, el tiempo de vida y la invalidación. Actualizar un modelo no invalida automáticamente sus representaciones almacenadas.

Los ejemplos se ejecutan dentro de una aplicación Orionis, en servicios asíncronos que pueden utilizar los controladores u otros componentes. Importa la fachada desde su módulo público:

```python
from orionis.support.facades import Cache


class CatalogCache:

    async def publish(self, tenant_id: int, products: list[dict]) -> bool:
        key = f"catalog:{tenant_id}:v1"
        return await Cache.set(key, products, ttl=60)

    async def read(self, tenant_id: int) -> list[dict] | None:
        return await Cache.get(f"catalog:{tenant_id}:v1")

    async def invalidate(self, tenant_id: int) -> bool:
        return await Cache.delete(f"catalog:{tenant_id}:v1")
```

Después de confirmar un cambio en la fuente, invalida las claves afectadas. Incluye datos como tenant, idioma, filtros y formato de representación cuando modifiquen el resultado. Un prefijo separa nombres; no aplica autorización.

## Elegir el store predeterminado o un repositorio

`await Cache.get(...)` y las demás operaciones asíncronas de la fachada utilizan `cache.default`. Para seleccionar explícitamente un store, resuelve la fachada diferida antes de llamar a la fábrica síncrona `store()`:

```python
from orionis.support.facades import Cache


class ReportCache:

    async def publish(self, report_id: str, content: dict) -> bool:
        manager = await Cache.resolve()
        repository = manager.store("memory")
        return await repository.set(f"report:{report_id}", content, ttl=30)
```

`Cache.resolve()` devuelve el manager y lo fija para las siguientes llamadas. El servicio de caché puede seguir sin resolverse después del arranque de la aplicación; no supongas que `Cache.store("memory")` devuelve un repositorio en su primer uso. `(await Cache.resolve()).store()` selecciona el store predeterminado; un nombre vacío también selecciona el predeterminado. Los nombres reconocidos son `memory`, `file`, `database`, `redis` y `memcached`. Un nombre no soportado genera `CacheStoreException`.

El manager reutiliza su repositorio para cada nombre de store. Los repositorios seleccionados de distintos stores no comparten contenido. Consulta [manager e inyección de dependencias](/es/cache/manager-and-injection) para la resolución de configuración y la inyección.

<a id="repository-construction"></a>

## Repositorio, prefijos y valores admitidos

```text
CacheRepository(backend: Any, prefix: str = "") -> None
```

El manager construye este adaptador automáticamente. `backend` proporciona primitivas de almacenamiento como `get`, `set`, `multi_get` e `increment`. El constructor únicamente conserva el backend y el prefijo; no valida toda la interfaz del backend.

Un prefijo no vacío transforma `report:42` en `<prefijo>:report:42` para las operaciones sobre claves. Un prefijo vacío conserva la clave original. Quien llama siempre proporciona el nombre sin prefijo. El repositorio no recorta nombres ni normaliza rutas. `clear()` es la excepción al prefijado: no recibe una clave y vacía el backend.

Para construir un repositorio aislado del manager, proporciona un backend concreto:

```python
from orionis.cache import CacheRepository
from orionis.cache.stores.memory import build


class IsolatedReportCache:

    def __init__(self) -> None:
        self.repository = CacheRepository(build(), prefix="reports")

    async def publish(self) -> bool:
        return await self.repository.set("daily", {"total": 12}, ttl=60)
```

Su clave física es `reports:daily`. Cada backend de memoria nuevo tiene contenido propio; crear este servicio repetidamente también crea cachés separadas.

### JSON es una frontera de almacenamiento

Los stores nativos de valores codifican los datos como JSON mediante `msgspec`, incluido el store de memoria. Prefiere diccionarios, listas, cadenas, números, booleanos y `None`. Los valores se decodifican desde almacenamiento: no se garantiza identidad de objetos y una tupla se recupera como lista.

La anotación `Any` no promete conservar objetos o clases arbitrarias de Python. Los valores no admitidos pueden producir errores de serialización. El helper `Serializer` enriquecido es independiente y no se aplica automáticamente a los valores del repositorio.

### Tiempo de vida en segundos

`set`, `setMany`, `add` y `replace` tienen `ttl=None` como valor predeterminado. `remember` exige el argumento `ttl`, que también puede ser `None`.

| TTL | Efecto |
| --- | --- |
| `None` | La nueva escritura no tiene expiración configurada. Aun así, una eliminación, expulsión, reinicio o mantenimiento del backend puede quitarla. |
| Segundos positivos | La escritura establece la expiración. Las lecturas y los aciertos de caché no la renuevan. |
| `0` | No es portable: file/database expiran inmediatamente; memory y Memcached no establecen expiración. En Redis, `set`/`add`/`replace` envían un comando de expiración cero no válido, mientras que `setMany` escribe sin expiración. |

Utiliza `None` o una duración positiva para código portable. No existe un validador común del rango de TTL. Memory, file, database y Redis permiten segundos fraccionarios; Memcached requiere valores enteros de expiración. Redis convierte los segundos fraccionarios a milisegundos enteros.

Sobrescribir con `set(..., ttl=None)` o `replace(..., ttl=None)` elimina una expiración anterior. Un acierto de `rememberForever` conserva la entrada existente y su TTL original.

## Leer y escribir

Las firmas siguientes corresponden a métodos de `CacheRepository` y omiten `self`. Los métodos asíncronos requieren `await`. Los errores del backend, red o serialización pueden propagarse, salvo cuando el apartado indica un retorno o una supresión específica.

<a id="repository-get"></a>

### `get`: recuperar un valor

```text
async get(key: str) -> Any
```

`key` es obligatorio. Devuelve el valor decodificado o `None` si falta o expiró. No existe un parámetro `default=`. Un null JSON almacenado también se recupera como `None`; no utilices la evaluación booleana para distinguir un `0`, `False` o una cadena vacía de un fallo de caché.

```python
from orionis.support.facades import Cache


class DashboardCache:

    async def total(self) -> int:
        value = await Cache.get("dashboard:total")
        return value if value is not None else 0
```

<a id="repository-set"></a>

### `set`: guardar o sobrescribir

```text
async set(key: str, value: Any, ttl: float | None = None) -> bool
```

Guarda `value` bajo la clave obligatoria `key`, reemplaza una entrada existente y aplica el nuevo TTL. Devuelve el resultado del backend convertido a `bool`. Un resultado `False` no representa una escritura exitosa aunque no se haya producido una excepción.

```python
from orionis.support.facades import Cache


class DashboardCache:

    async def publish(self, total: int) -> bool:
        return await Cache.set("dashboard:total", total, ttl=60)
```

<a id="repository-has"></a>

### `has`: comprobar existencia

```text
async has(key: str) -> bool
```

Devuelve si existe una entrada vigente, incluso si contiene `None`. Es una operación separada de `get` o `set`: la entrada puede expirar o cambiar entre llamadas. Para creación condicional, utiliza `add` en lugar de `has` seguido de `set`.

```python
from orionis.support.facades import Cache


class ExportCache:

    async def is_ready(self, export_id: str) -> bool:
        return await Cache.has(f"export:{export_id}")
```

<a id="repository-delete"></a>

### `delete`: invalidar una entrada

```text
async delete(key: str) -> bool
```

Devuelve `True` si se eliminó una entrada y `False` cuando no se eliminó ninguna. La operación aplica el prefijo del repositorio. Un valor `None` almacenado también puede eliminarse correctamente.

```python
from orionis.support.facades import Cache


class ProfileCache:

    async def invalidate(self, user_id: int) -> bool:
        return await Cache.delete(f"profile:{user_id}")
```

### Operaciones por lotes

<a id="repository-getmany"></a>

#### `getMany`: recuperar varias claves

```text
async getMany(keys: list[str]) -> dict[str, Any]
```

La lista obligatoria contiene nombres sin prefijo. Devuelve un diccionario con esos nombres y sus valores decodificados; las ausencias son `None`. Los nombres repetidos se reducen a una entrada del diccionario. Si un backend personalizado devuelve una cantidad distinta de resultados, se produce `ValueError` porque el emparejamiento es estricto.

```python
from orionis.support.facades import Cache


class DashboardCache:

    async def read(self) -> dict:
        return await Cache.getMany(["dashboard:users", "dashboard:orders"])
```

<a id="repository-setmany"></a>

#### `setMany`: escribir un mapping

```text
async setMany(values: dict[str, Any], ttl: float | None = None) -> bool
```

`values` relaciona claves sin prefijo con sus valores. Un único TTL aplica a toda la solicitud. Devuelve el resultado del backend convertido a `bool`. No representa una transacción portable: file y database recorren las entradas, por lo que un error puede dejar aplicadas las escrituras anteriores. Tampoco se garantiza una instantánea consistente entre stores para las lecturas por lotes.

```python
from orionis.support.facades import Cache


class DashboardCache:

    async def publish(self, users: int, orders: int) -> bool:
        return await Cache.setMany(
            {"dashboard:users": users, "dashboard:orders": orders},
            ttl=30,
        )
```

## Generar un valor solo cuando se necesita

<a id="repository-remember"></a>

### `remember`: cache-aside

```text
async remember(key: str, ttl: float | None, resolver: Callable) -> Any
```

Los tres argumentos son obligatorios. `resolver` debe ser una función invocable sin argumentos. Si hay un acierto, devuelve el valor almacenado sin llamarla ni renovar el TTL. Cuando falta:

1. Invoca `resolver()`.
2. Espera su resultado si es awaitable.
3. Guarda el resultado con el TTL indicado.
4. Devuelve el valor calculado.

Pasa la función, no el resultado de ejecutarla. Un resolver síncrono se ejecuta directamente en el event loop; utiliza I/O asíncrono o delega explícitamente el trabajo bloqueante.

```python
from orionis.support.facades import Cache


class PriceCache:

    async def quote(self, product_id: int, amount: int, unit_price: float) -> dict:
        key = f"quote:{product_id}:{amount}:{unit_price}"

        def calculate() -> dict:
            return {"total": round(amount * unit_price, 2)}

        return await Cache.remember(key, 30, calculate)
```

Un resolver asíncrono utiliza la misma API; este servicio recibe una función real de la aplicación y no depende de un modelo de ejemplo sin declarar:

```python
from collections.abc import Awaitable, Callable

from orionis.support.facades import Cache


class ReportCache:

    async def read(
        self,
        report_id: str,
        load_report: Callable[[str], Awaitable[dict]],
    ) -> dict:
        async def resolve() -> dict:
            return await load_report(report_id)

        return await Cache.remember(f"report:{report_id}", 60, resolve)
```

No se agrupan automáticamente los fallos de caché concurrentes. Varias peticiones pueden calcular y sobrescribir la misma clave. Consulta [locks](/es/cache/locks) para los mecanismos de coordinación disponibles y sus límites según el backend.

Una excepción del resolver se propaga antes de la escritura. Una excepción del backend también se propaga. El método espera `set`, pero no revisa su resultado booleano: si el backend devuelve `False` sin generar una excepción, `remember` igualmente devuelve el valor recién calculado.

<a id="repository-rememberforever"></a>

### `rememberForever`: resolver sin una nueva expiración

```text
async rememberForever(key: str, resolver: Callable) -> Any
```

Equivale a `remember(key, None, resolver)`, incluido el tratamiento del callable, los errores y los límites de concurrencia. El nombre indica que un fallo se almacena sin expiración; no garantiza almacenamiento permanente ni elimina el TTL de una entrada encontrada.

```python
from orionis.support.facades import Cache


class NavigationCache:

    async def items(self) -> list[dict]:
        return await Cache.rememberForever(
            "navigation:public:v1",
            lambda: [{"label": "Home", "url": "/"}],
        )
```

### Almacenar un resultado ausente de forma portable

El tratamiento de un `None` almacenado cambia entre los backends nativos:

| Operación sobre una entrada vigente con `None` | file / database | memory / Redis / Memcached |
| --- | --- | --- |
| `get` | Devuelve `None`. | Devuelve `None`. |
| `has` | `True`. | `True`. |
| `remember` / `rememberForever` | Lo considera un acierto. | Ejecuta de nuevo el resolver porque la lectura de aiocache sustituye un `None` decodificado por su valor predeterminado. |
| `pull` | Devuelve `None` y elimina la entrada. | Devuelve `None` sin eliminarla. |

Utiliza un diccionario contenedor cuando debas recordar también la ausencia de un registro en cualquier store:

```python
from collections.abc import Awaitable, Callable

from orionis.support.facades import Cache


class CustomerLookupCache:

    async def find(
        self,
        customer_id: int,
        lookup: Callable[[int], Awaitable[dict | None]],
    ) -> dict | None:
        async def resolve() -> dict:
            customer = await lookup(customer_id)
            return {"found": customer is not None, "value": customer}

        result = await Cache.remember(f"customer:{customer_id}", 60, resolve)
        return result["value"] if result["found"] else None
```

El propio diccionario nunca es `None`, por lo que una búsqueda negativa no vuelve a consultar la fuente durante su TTL.

## Escrituras condicionales y lectura seguida de borrado

<a id="repository-add"></a>

### `add`: crear solo si falta

```text
async add(key: str, value: Any, ttl: float | None = None) -> bool
```

Utiliza la primitiva de creación condicional del backend en lugar de una comprobación separada. Devuelve `True` si la llamada al backend termina y `False` cuando genera `ValueError`, convencionalmente porque ya existe una clave vigente. El repositorio captura todos los `ValueError` de esta llamada; las demás excepciones se propagan. No inspecciona el booleano devuelto por un backend personalizado.

```python
from orionis.support.facades import Cache


class NotificationCache:

    async def mark_seen(self, notification_id: str) -> bool:
        return await Cache.add(f"notification:seen:{notification_id}", True, ttl=300)
```

Un conflicto por clave existente conserva su valor. La inserción atómica depende del backend seleccionado; no garantiza la ejecución única de un correo, escritura en base de datos u otro efecto posterior.

<a id="repository-replace"></a>

### `replace`: actualizar únicamente una entrada vigente

```text
async replace(key: str, value: Any, ttl: float | None = None) -> bool
```

Devuelve `True` cuando una entrada existente acepta el reemplazo o `False` cuando está ausente o pierde una comparación optimista por concurrencia. El nuevo TTL sustituye la expiración anterior. No crea una clave ausente.

**Este método pertenece a `CacheRepository`; `CacheManager` no tiene un proxy `replace`.** Obtén explícitamente un repositorio:

```python
from orionis.support.facades import Cache


class ReportCache:

    async def update_existing(self, report_id: str, report: dict) -> bool:
        repository = (await Cache.resolve()).store()
        return await repository.replace(f"report:{report_id}", report, ttl=60)
```

El repositorio utiliza `replace` del backend cuando existe. En otro caso, los backends aiocache utilizan `OptimisticLock` y compare-and-set; una modificación detectada devuelve `False`. Esto protege la escritura, no una lectura anterior realizada por separado desde la aplicación. Un backend personalizado sin ninguno de los mecanismos produce `CacheStoreException`. Los demás errores del backend o de serialización se propagan.

<a id="repository-pull"></a>

### `pull`: leer y después eliminar

```text
async pull(key: str) -> Any
```

Devuelve el valor almacenado o `None` si falta. Primero lee un acierto y después lo elimina; si falta, omite la eliminación. Son dos operaciones separadas. Varios lectores concurrentes pueden recibir el mismo valor y se puede eliminar el valor escrito por otro proceso entre ambos pasos. No utilices `pull` para reclamar trabajos en exclusiva ni para consumir pagos. La diferencia de `None` almacenado se describe arriba.

```python
from orionis.support.facades import Cache


class DraftPreviewCache:

    async def take(self, preview_id: str) -> dict | None:
        return await Cache.pull(f"draft-preview:{preview_id}")
```

Si la eliminación falla con una excepción, esta se propaga en lugar de devolver el valor leído.

## Contadores

<a id="repository-increment"></a>

### `increment`: sumar un delta entero

```text
async increment(key: str, amount: int = 1) -> int
```

`key` es obligatorio; `amount` vale `1` de forma predeterminada. Las implementaciones nativas inicializan un contador ausente con el delta y conservan el TTL de un contador existente. No hay un parámetro TTL. Para iniciar con expiración, crea primero un entero de forma condicional:

```python
from orionis.support.facades import Cache


class DownloadCounter:

    async def record(self, day: str) -> int:
        key = f"downloads:{day}"
        await Cache.add(key, 0, ttl=86400)
        return await Cache.increment(key)
```

La inicialización y el incremento son operaciones separadas: una eliminación o expiración intermedia puede crear un contador nuevo sin expiración. Utiliza valores enteros, en lugar de cadenas JSON con dígitos, para un comportamiento consistente.

<a id="repository-decrement"></a>

### `decrement`: restar un delta entero

```text
async decrement(key: str, amount: int = 1) -> int
```

Delega en la misma primitiva de incremento del backend con `-amount`. Los valores negativos invierten la operación; el repositorio no valida el signo. Una clave ausente se inicializa con el delta negativo cuando el backend lo admite.

```python
from orionis.support.facades import Cache


class RetryBudgetCache:

    async def consume(self, job_id: str) -> int:
        key = f"retry-budget:{job_id}"
        await Cache.add(key, 5, ttl=300)
        return await Cache.decrement(key, 1)
```

### Límites de contadores según el backend

| Backend | Comportamiento relevante |
| --- | --- |
| memory | Actualiza la instancia del backend dentro del proceso. No coordina procesos distintos ni backends de memoria separados. |
| file | Serializa la lectura, modificación y escritura del contador con locks internos de archivos. Conserva una expiración existente. |
| database | Utiliza actualizaciones SQL condicionales y reintenta escrituras en conflicto hasta 25 veces; agotar los intentos genera `QueryException`. |
| Redis | Delega en el comando nativo de incremento entero. Los valores almacenados que no son numéricos se rechazan. |
| Memcached | Utiliza incremento/decremento nativos para entradas existentes. La inicialización de una ausencia es una escritura separada y el adaptador devuelve el delta cuando el SDK devuelve cero. |

En el adaptador actual de Memcached, un decremento que llega a cero puede devolver `-amount` en lugar del cero almacenado; un incremento con resultado cero también utiliza `amount` como alternativa. Lee el valor almacenado si ese límite es relevante y evita basar la contabilidad persistente en estos retornos de caché.

Los valores de contador no válidos pueden generar errores del backend, `TypeError` o `ValueError`; la conversión y los límites numéricos dependen del backend. Los contadores de caché no participan automáticamente en la transacción que actualiza la base de datos de origen.

<a id="repository-clear"></a>

## `clear`: vaciar un backend

```text
async clear() -> bool
```

No recibe argumentos y devuelve el resultado del backend convertido a `bool`. **No aplica el prefijo del repositorio.** Los prefijos de otros repositorios no protegen sus entradas frente a esta operación.

| Store | Alcance de `clear` |
| --- | --- |
| memory | Todas las entradas de esa instancia del backend. |
| file | Archivos de entradas de caché en el directorio configurado, incluidas las entradas con otros prefijos. |
| database | Entradas de la tabla de caché configurada; no la tabla de locks separada. |
| Redis | `FLUSHDB` sobre la base Redis seleccionada. |
| Memcached | `flush_all` sobre el servicio seleccionado. |

Utilízalo deliberadamente durante mantenimiento; para invalidaciones específicas, utiliza `delete`.

```python
from orionis.support.facades import Cache


class CacheMaintenance:

    async def reset_memory_store(self) -> bool:
        repository = (await Cache.resolve()).store("memory")
        return await repository.clear()
```

<a id="repository-lock"></a>

## `lock`: construir un contexto de coordinación

```text
lock(key: str, timeout: float | None = None) -> CacheLock
```

La fábrica es síncrona: no utilices `await repository.lock(...)`. Aplica el prefijo y devuelve un administrador de contexto asíncrono. `key` es obligatorio; `timeout` vale `None` de forma predeterminada. Su significado y las garantías de bloqueo dependen del backend; el valor predeterminado no garantiza universalmente un bloqueo exclusivo ilimitado.

```python
from orionis.support.facades import Cache


class SummaryCache:

    async def read(self) -> dict:
        repository = (await Cache.resolve()).store()
        async with repository.lock("summary:build", timeout=5):
            return await repository.remember(
                "summary:value",
                30,
                lambda: {"total": 42},
            )
```

Consulta [locks y regeneración concurrente](/es/cache/locks) antes de utilizarlo para coordinar trabajo costoso entre peticiones o procesos.

## Proxies del store predeterminado

`CacheManager` delega las trece operaciones asíncronas de valores anteriores, excepto `replace`, en `store()`. Sus argumentos, valores predeterminados, resultados y errores no cambian. Además, expone la fábrica síncrona `lock(key: str, timeout: float | None = None) -> Any`, cuyo resultado concreto es `CacheLock`.

El [mapa completo de proxies](/es/cache/manager-and-injection#manager-proxies) enumera todas las firmas del manager y enlaza con la operación correspondiente en esta página. Un proxy no añade reintentos, fallback ni una transacción.

Para la fábrica síncrona de locks mediante la fachada, utiliza `manager = await Cache.resolve()` seguido de `manager.lock(...)`. Las operaciones asíncronas pueden esperarse directamente mediante `Cache`.

`replace` está disponible en `ICacheRepository` y `CacheRepository`, no en `CacheManager`. Las fábricas concretas `lock` no están declaradas por `ICacheManager` ni `ICacheRepository`; considera esa diferencia al tipar un contrato inyectado. La [referencia de API](/es/cache/api-reference) enumera los contratos y los demás componentes públicos.

## Errores, concurrencia e invalidación

- No existe una transacción automática entre caché y base de datos ni invalidación por eventos de modelos. Coordina la escritura persistente y la invalidación desde tu servicio.
- Una secuencia `has/get/set`, `pull`, `remember` o una escritura por lotes no se convierten en una sola operación atómica por ejecutarse desde la misma corrutina.
- `add` captura `ValueError` del backend; `replace` convierte conflictos optimistas en `False`. Generalmente, los demás errores se propagan. Las lecturas de file pueden tratar entradas ilegibles o malformadas como ausencias; el backend database decodifica JSON de caché no válido como `None`. Esa fila sigue existiendo: `has` puede devolver `True` y `remember` puede reutilizar el `None` decodificado hasta su expiración o eliminación.
- Los errores de disponibilidad, serialización o contadores no provocan un cambio automático de store. Decide qué lecturas fallidas pueden regenerarse desde la fuente y qué escrituras deben hacer fallar la petición.
- Un resultado `False` en escritura es distinto de una excepción. `remember` devuelve su valor calculado incluso cuando `set` devuelve `False`; no certifica que otra petición pueda leer el valor posteriormente.

Continúa con [configuración y stores](/es/cache/stores-and-drivers), [locks](/es/cache/locks) o el [panorama de caché](/es/cache).
