---
title: Caché Basada en Archivos
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Caché Basada en Archivos

Orionis Framework incluye un sistema de caché basado en archivos que va más allá del simple almacenamiento clave-valor. A diferencia de las soluciones de caché convencionales que reducen todo a cadenas de texto plano, Orionis **preserva los tipos de Python a través de las fronteras de serialización** — un `Path` se restaura como `Path`, un `Decimal` como `Decimal` y un `datetime` como `datetime`. Combinado con **invalidación automática impulsada por el monitoreo de archivos fuente**, la caché ofrece un mecanismo confiable y sin configuración para persistir y recuperar datos estructurados.

---

## FileBasedCache

`FileBasedCache` proporciona una caché orientada a diccionarios respaldada por un único archivo JSON en disco. Soporta **invalidación automática** cuando los archivos o directorios monitoreados cambian, de modo que nunca se sirven datos obsoletos.

```python
from pathlib import Path
from orionis.services.cache.file_based_cache import FileBasedCache
```

### Crear una Caché

```python
cache = FileBasedCache(
    path=Path("storage/cache"),
    filename="app_cache.json",
    monitored_dirs=[Path("app/models"), Path("app/services")],
    monitored_files=[Path("config/app.py")],
)
```

| Parámetro | Tipo | Requerido | Descripción |
|---|---|---|---|
| `path` | `Path` | Sí | Directorio donde se almacenará el archivo de caché. Se crea automáticamente si no existe. |
| `filename` | `str` | Sí | Nombre del archivo de caché dentro de `path`. |
| `monitored_dirs` | `list[Path] \| None` | No | Directorios cuyos archivos `.py` se vigilan para detectar cambios. |
| `monitored_files` | `list[Path] \| None` | No | Archivos individuales vigilados para detectar cambios. |

> **Nota:** El parámetro `path` debe ser un objeto `Path`. Pasar una cadena de texto genera `TypeError`.

### Guardar Datos

El método `save()` escribe un diccionario en disco:

```python
version, sources_hash = cache.save({
    "routes": ["/api/users", "/api/posts"],
    "compiled_at": "2026-03-31T10:00:00",
})
```

**Valor de retorno:** una tupla de `(cache_version, sources_hash)` — útil para registro o depuración.

La caché aplica una **optimización de omisión cuando no hay cambios**: si la caché existente ya contiene los mismos datos y ninguna fuente monitoreada ha cambiado, el archivo **no se reescribe**. Esto evita E/S de disco innecesaria.

```python
cache.save({"key": "value"})  # escribe en disco
cache.save({"key": "value"})  # sin operación — archivo intacto
cache.save({"key": "new"})    # escribe en disco — los datos cambiaron
```

> Solo se aceptan valores de tipo `dict`. Pasar cualquier otro tipo genera `TypeError`.

### Recuperar Datos

El método `get()` retorna el diccionario en caché solo si la caché sigue siendo válida:

```python
data = cache.get()
if data is not None:
    print(data["routes"])
```

`get()` retorna `None` en cualquiera de estas situaciones:

- El archivo de caché no existe (primera ejecución o después de limpiar).
- Un archivo o directorio monitoreado ha cambiado desde el último guardado.
- La caché fue creada por una versión incompatible del framework.

Cuando se retorna `None`, simplemente recomputa y guarda los datos — la caché se encarga del resto.

### Limpiar la Caché

El método `clear()` elimina el archivo de caché del disco:

```python
removed = cache.clear()
# True  → el archivo existía y fue eliminado
# False → el archivo no existía
```

Llamar a `clear()` dos veces es seguro — la segunda llamada retorna `False` sin generar errores.

---

## Invalidación Automática

La funcionalidad más distintiva de `FileBasedCache` es su **invalidación consciente de las fuentes**. La caché detecta automáticamente cuando las dependencias monitoreadas cambian y se invalida a sí misma — sin requerir intervención manual.

### Cómo Funciona

Cuando se llama a `save()`, la caché toma una huella digital de todas las fuentes monitoreadas. En cada llamada a `get()`, esta huella se recalcula y compara. Si algo ha cambiado, la caché se trata como obsoleta y se retorna `None`.

| Fuente | Qué Se Vigila |
|---|---|
| `monitored_dirs` | Todos los archivos `*.py` recursivamente dentro de cada directorio |
| `monitored_files` | Cada archivo individualmente |

**Comportamientos clave:**

- Los directorios y archivos inexistentes se ignoran silenciosamente — no generan errores.
- La huella digital se almacena temporalmente en caché para llamadas sucesivas rápidas, evitando cómputo redundante en lecturas de alta frecuencia.

### Ejemplo — Caché de Configuración

```python
from pathlib import Path
from orionis.services.cache.file_based_cache import FileBasedCache

config_cache = FileBasedCache(
    path=Path("storage/cache"),
    filename="config.json",
    monitored_files=[Path("config/app.py"), Path("config/database.py")],
)

# Primera ejecución: sin caché → computar y guardar
data = config_cache.get()
if data is None:
    data = expensive_config_computation()
    config_cache.save(data)

# Ejecuciones siguientes: caché válida → recuperación instantánea
# Si config/app.py o config/database.py cambia → caché se auto-invalida
```

---

## Serializer

Orionis incluye una utilidad `Serializer` independiente que puede usarse por separado de `FileBasedCache`. Convierte objetos Python a cadenas JSON y viceversa, **preservando sus tipos originales** durante el viaje de ida y vuelta.

```python
from orionis.services.cache.serializer import Serializer
```

### Tipos Soportados

El serializador soporta nativamente más de 18 tipos de Python con fidelidad completa de ida y vuelta:

| Tipo Python | Preservación |
|---|---|
| `str`, `int`, `float`, `bool`, `None` | Exacta |
| `Path` | Restaurado como `Path` |
| `bytes` | Codificado y restaurado |
| `datetime`, `date`, `time` | Ida y vuelta ISO 8601 |
| `timedelta` | Precisión completa |
| `Decimal` | Precisión completa |
| `UUID` | Forma canónica |
| `tuple` | Restaurado como `tuple` (no `list`) |
| `set`, `frozenset` | Restaurado con el tipo correcto |
| `complex` | Precisión completa |
| `type` | Restaurado vía ruta cualificada del módulo |
| `dict`, `list` | Recursivo — los tipos anidados también se preservan |

> Los tipos no soportados generan `TypeError` durante la serialización. Los payloads corruptos generan `ValueError` durante la deserialización.

### Serialización en Memoria

```python
from pathlib import Path
from orionis.services.cache.serializer import Serializer

# Serializar a cadena JSON
raw = Serializer.dumps({"path": Path("/etc/config"), "count": 42})

# Deserializar de vuelta a Python — los tipos se preservan
data = Serializer.loads(raw)
print(type(data["path"]))  # <class 'pathlib.PosixPath'>
```

El parámetro opcional `indent` produce una salida legible:

```python
raw = Serializer.dumps({"key": "value"}, indent=2)
```

### E/S de Archivos

El `Serializer` también provee operaciones directas de archivo con **semántica de escritura segura** — el archivo destino nunca queda en un estado parcial o corrupto, incluso ante una terminación inesperada del proceso:

```python
from pathlib import Path
from orionis.services.cache.serializer import Serializer

file = Path("storage/data.json")

# Escritura segura a archivo
Serializer.dumpToFile({"version": 1, "active": True}, file)

# Lectura desde archivo — retorna None si no existe o está vacío
data = Serializer.loadFromFile(file)
```

| Método | Firma | Descripción |
|---|---|---|
| `dumps` | `(data, indent=None) → str` | Serializar a cadena JSON |
| `loads` | `(raw: str) → Any` | Deserializar desde cadena JSON |
| `dumpToFile` | `(data, file_path: Path) → None` | Escritura segura a archivo |
| `loadFromFile` | `(file_path: Path) → Any \| None` | Lectura desde archivo; `None` si no existe o está vacío |

### Estructuras Anidadas

El serializador maneja estructuras anidadas de profundidad arbitraria. Cada elemento se procesa recursivamente, preservando los tipos en cada nivel:

```python
import decimal
from datetime import datetime
from pathlib import Path
from orionis.services.cache.serializer import Serializer

original = {
    "timestamp": datetime(2026, 3, 31, 12, 0, 0),
    "amount": decimal.Decimal("99.99"),
    "files": [Path("/tmp/a.txt"), Path("/tmp/b.txt")],
    "flags": (True, False, None),
}

raw = Serializer.dumps(original)
restored = Serializer.loads(raw)

assert restored["timestamp"] == original["timestamp"]
assert isinstance(restored["amount"], decimal.Decimal)
assert isinstance(restored["flags"], tuple)
```

---

## Ejemplo de Uso Completo

El siguiente ejemplo demuestra un flujo de trabajo típico: crear una caché con monitoreo de archivos, guardar datos computados y recuperarlos con invalidación automática.

```python
from pathlib import Path
from orionis.services.cache.file_based_cache import FileBasedCache

# Definir la caché con monitoreo de fuentes
cache = FileBasedCache(
    path=Path("storage/cache"),
    filename="routes.json",
    monitored_dirs=[Path("app/http/controllers")],
    monitored_files=[Path("routes/web.py"), Path("routes/api.py")],
)

# Intentar cargar desde caché
routes = cache.get()

if routes is None:
    # Miss de caché o invalidada — recomputar
    routes = discover_routes()
    cache.save(routes)

# Usar las rutas
register(routes)

# Cuando sea necesario, limpiar explícitamente
cache.clear()
```

**Ciclo de vida:**

1. **Primera ejecución** — no existe caché → `get()` retorna `None` → las rutas se computan y guardan.
2. **Ejecuciones siguientes** — caché válida, fuentes sin cambios → `get()` retorna los datos en caché instantáneamente.
3. **Cambio en fuentes** — se modifica un controlador en `app/http/controllers/` → `get()` retorna `None` → las rutas se recomputan automáticamente.
