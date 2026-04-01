---
title: FreezeThaw
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# FreezeThaw

`FreezeThaw` es una clase utilitaria que convierte contenedores mutables de Python en equivalentes profundamente inmutables y viceversa. Llamar a `freeze` transforma diccionarios en instancias de `MappingProxyType` y listas en tuplas, de forma recursiva a través de toda la estructura. Llamar a `thaw` invierte el proceso, restaurando la mutabilidad completa.

Esto resulta especialmente útil cuando se necesita exponer datos de configuración, resultados en caché o estado compartido que **no debe ser modificado** por los consumidores, pero que aún necesita ser editable cuando llegue el momento de actualizarlo.

## Importación

```python
from orionis.support.structures.freezer import FreezeThaw
```

---

## Congelar Datos

El método `freeze` acepta cualquier objeto. Si el objeto es un contenedor soportado (`dict`, `list` o `tuple`), se convierte recursivamente a su equivalente inmutable. Los valores que no son contenedores — cadenas, números, `None`, booleanos — pasan sin cambios.

### Reglas de Conversión

| Tipo de entrada | Tipo congelado |
|---|---|
| `dict` | `MappingProxyType` |
| `list` | `tuple` |
| `tuple` | `tuple` (se preserva) |
| `MappingProxyType` | se retorna tal cual |
| Escalar (`int`, `str`, `None`, …) | se retorna tal cual |

### Congelar un Diccionario

```python
config = {"database": {"host": "localhost", "port": 5432}}

frozen = FreezeThaw.freeze(config)

frozen["database"]["host"]   # "localhost"
frozen["database"]["port"]   # 5432
```

El resultado es un `MappingProxyType`. Cualquier intento de modificarlo lanza un `TypeError`:

```python
frozen["database"] = "other"   # TypeError
```

### Congelar una Lista

```python
items = [1, 2, [3, 4]]

frozen = FreezeThaw.freeze(items)
# (1, 2, (3, 4))
```

Las listas se convierten en tuplas, incluyendo las listas anidadas.

### Congelar Estructuras Anidadas

`freeze` recorre todo el grafo de objetos, convirtiendo cada contenedor que encuentra:

```python
data = {
    "users": ["alice", "bob"],
    "meta": {
        "version": 3,
        "tags": ["admin", "staff"]
    }
}

frozen = FreezeThaw.freeze(data)

frozen["users"]          # ("alice", "bob")
frozen["meta"]["tags"]   # ("admin", "staff")
```

### Escalares y Objetos Ya Congelados

Los valores que no son contenedores se retornan sin cambios:

```python
FreezeThaw.freeze(42)       # 42
FreezeThaw.freeze("text")   # "text"
FreezeThaw.freeze(None)     # None
```

Si la entrada ya es un `MappingProxyType`, se retorna tal cual sin re-envolver:

```python
from types import MappingProxyType

proxy = MappingProxyType({"key": "value"})
FreezeThaw.freeze(proxy) is proxy   # True
```

---

## Descongelar Datos

El método `thaw` es el inverso de `freeze`. Convierte recursivamente los contenedores inmutables a sus equivalentes mutables.

### Reglas de Conversión

| Tipo de entrada | Tipo descongelado |
|---|---|
| `MappingProxyType` | `dict` |
| `dict` | `dict` (copia profunda) |
| `tuple` | `list` |
| `list` | `list` (copia profunda) |
| Escalar (`int`, `str`, `None`, …) | se retorna tal cual |

### Descongelar un Diccionario Congelado

```python
from types import MappingProxyType

frozen = MappingProxyType({"host": "localhost", "port": 5432})

config = FreezeThaw.thaw(frozen)

config["host"]          # "localhost"
config["port"] = 3306   # funciona — el resultado es completamente mutable
```

### Descongelar una Tupla

```python
frozen_items = (1, 2, 3)

items = FreezeThaw.thaw(frozen_items)
# [1, 2, 3]

items.append(4)   # funciona
```

### Descongelar Estructuras Anidadas

Cada nivel de la estructura se convierte:

```python
frozen = MappingProxyType({
    "items": (1, 2),
    "meta": MappingProxyType({"key": "value"})
})

data = FreezeThaw.thaw(frozen)

type(data)              # dict
type(data["items"])     # list
type(data["meta"])      # dict
```

### Escalares

Al igual que `freeze`, los valores que no son contenedores pasan sin cambios:

```python
FreezeThaw.thaw(42)       # 42
FreezeThaw.thaw("text")   # "text"
FreezeThaw.thaw(None)     # None
```

---

## Integridad de Ida y Vuelta

Un `freeze` seguido de `thaw` retorna una estructura **igual** a la original, con todos los contenedores completamente mutables de nuevo:

```python
original = {
    "a": 1,
    "b": [2, 3],
    "c": {"d": 4}
}

frozen = FreezeThaw.freeze(original)
restored = FreezeThaw.thaw(frozen)

restored == original         # True
restored["b"].append(5)      # funciona
restored["c"]["e"] = 6       # funciona
```

Esta garantía de ida y vuelta hace que `FreezeThaw` sea seguro para escenarios donde se necesita bloquear datos temporalmente y luego desbloquearlos sin pérdida de información.

---

## Referencia de Métodos

| Método | Firma | Descripción |
|---|---|---|
| `freeze` | `freeze(obj) → object` | Convierte recursivamente contenedores mutables a equivalentes inmutables. Retorna valores no contenedores sin cambios. |
| `thaw` | `thaw(obj) → object` | Convierte recursivamente contenedores inmutables a equivalentes mutables. Retorna valores no contenedores sin cambios. |
