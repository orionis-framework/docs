---
title: DotDict
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# DotDict

`DotDict` es una subclase de diccionario que permite el **acceso a claves mediante notación de punto** (atributos). En lugar de escribir `config["database"]["host"]`, se puede escribir `config.database.host`. Los diccionarios anidados se convierten automáticamente en instancias de `DotDict` al acceder a ellos, haciendo que toda la estructura sea navegable con notación de punto.

Esta utilidad es especialmente útil al trabajar con datos de configuración, respuestas de API o cualquier estructura de diccionario profundamente anidada donde la notación de corchetes se vuelve verbosa y difícil de leer.

## Importación

```python
from orionis.support.wrapper.dot_dict import DotDict
```

## Creación de una Instancia

`DotDict` soporta las mismas formas de inicialización que un `dict` estándar:

```python
# Desde un diccionario
config = DotDict({"database": {"host": "localhost", "port": 5432}})

# Desde argumentos con nombre
settings = DotDict(debug=True, version="1.0")

# Instancia vacía
data = DotDict()
```

---

## Acceso por Atributo

### Lectura de Valores

Accede a las claves del diccionario como atributos de objeto. Los diccionarios anidados se envuelven automáticamente en `DotDict`:

```python
config = DotDict({
    "app": {
        "name": "Orionis",
        "settings": {
            "debug": True
        }
    }
})

config.app.name                # "Orionis"
config.app.settings.debug      # True
```

Acceder a una clave que no existe retorna `None` en lugar de lanzar una excepción:

```python
config = DotDict({"a": 1})
config.missing_key  # None
```

### Asignación de Valores

Asigna valores usando sintaxis de atributo. Los diccionarios planos se convierten automáticamente a `DotDict`:

```python
config = DotDict()

config.name = "Orionis"
config.database = {"host": "localhost", "port": 5432}

config.database.host   # "localhost" — convertido automáticamente a DotDict
```

### Eliminación de Valores

Elimina claves usando la sentencia `del`:

```python
config = DotDict({"key": "value"})
del config.key
```

Lanza `AttributeError` si la clave no existe:

```python
config = DotDict()
del config.nonexistent  # AttributeError: 'DotDict' has no attribute 'nonexistent'
```

---

## Métodos

### get

Obtiene un valor por clave con un valor por defecto opcional. Al igual que el acceso por atributo, los dicts anidados se convierten automáticamente:

```python
config = DotDict({"timeout": 30, "retry": {"max": 3}})

config.get("timeout")          # 30
config.get("missing", 60)      # 60
config.get("missing")          # None
config.get("retry").max        # 3
```

### export

Convierte todo el árbol de `DotDict` de vuelta a diccionarios estándar de Python — útil para serialización o para pasar datos a librerías que esperan dicts planos:

```python
config = DotDict({"app": DotDict({"name": "Orionis", "meta": DotDict({"v": 1})})})

result = config.export()
# {"app": {"name": "Orionis", "meta": {"v": 1}}}

type(result)               # dict (no DotDict)
type(result["app"])        # dict (no DotDict)
```

### copy

Crea una **copia profunda** del `DotDict`. Las modificaciones en la copia no afectan al original:

```python
original = DotDict({"nested": {"value": 10}})
cloned = original.copy()

cloned.nested.value = 99
original.nested.value      # 10 — sin cambios
```

---

## Compatibilidad con Dict Estándar

`DotDict` hereda de `dict`, por lo que todas las operaciones estándar de diccionario siguen disponibles:

```python
config = DotDict({"a": 1, "b": 2, "c": 3})

# Acceso por corchetes
config["a"]                # 1

# Verificación de membresía
"a" in config              # True
"z" in config              # False

# Iteración
list(config)               # ["a", "b", "c"]

# Longitud
len(config)                # 3

# Actualización
config.update({"d": 4})
config.d                   # 4

# Representación
repr(config)               # "{'a': 1, 'b': 2, 'c': 3, 'd': 4}"
```

---

## Anidamiento Profundo

El acceso por atributo funciona de forma transparente a través de cualquier cantidad de niveles de anidamiento. Todos los dicts intermedios se convierten automáticamente y se almacenan en caché:

```python
data = DotDict({
    "level1": {
        "level2": {
            "level3": {
                "value": "deep"
            }
        }
    }
})

data.level1.level2.level3.value  # "deep"

# Mutación a cualquier profundidad
data.level1.level2.level3.value = "modified"
data.level1.level2.level3.value  # "modified"
```

---

## Comportamiento de Conversión

Entender cuándo y cómo los dicts planos se convierten a `DotDict` es clave para usar esta clase efectivamente:

| Operación | ¿`dict` plano auto-convertido? | ¿Almacenado en caché? |
|---|---|---|
| `d.key` (lectura por atributo) | Sí | Sí |
| `d.key = {...}` (escritura por atributo) | Sí | — |
| `d.get("key")` | Sí | Sí |
| `d["key"]` (lectura por corchetes) | No | No |
| `d.copy()` | Sí (profunda) | — |
| `d.export()` | Inverso — convierte `DotDict` → `dict` | — |

El acceso por corchetes (`d["key"]`) **no** convierte automáticamente los valores anidados. Usa el acceso por atributo o `get()` cuando necesites el comportamiento recursivo de `DotDict`.
