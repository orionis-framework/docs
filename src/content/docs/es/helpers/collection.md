---
title: Collection
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Collection

`Collection` es un wrapper fluido sobre listas de Python que proporciona un amplio conjunto de métodos para filtrar, transformar, agregar y paginar datos. En lugar de encadenar funciones integradas o escribir bucles repetitivos, las operaciones sobre datos se expresan de forma legible y declarativa.

Las colecciones aceptan cualquier lista de elementos — escalares, diccionarios, objetos — y exponen una API consistente que cubre las necesidades más comunes de manipulación de datos en el desarrollo de aplicaciones.

## Importación

```python
from orionis.support.structures.collection import Collection
```

## Crear una Instancia

```python
# Desde una lista
users = Collection([1, 2, 3])

# Colección vacía
empty = Collection()

# None se trata como vacío
also_empty = Collection(None)
```

---

## Obtener Elementos

### first

Retorna el primer elemento, o `None` si la colección está vacía. Un callback opcional filtra los elementos antes de seleccionar:

```python
c = Collection([1, 2, 3, 4])

c.first()                      # 1
c.first(lambda x: x > 2)       # 3
c.first(lambda x: x > 10)      # None
```

### last

Retorna el último elemento, con el mismo comportamiento de callback opcional:

```python
c = Collection([1, 2, 3, 4])

c.last()                       # 4
c.last(lambda x: x < 4)        # 3
```

### get

Obtiene un elemento por índice. Retorna un valor por defecto (`None` por defecto) cuando el índice está fuera de rango:

```python
c = Collection([10, 20, 30])

c.get(1)              # 20
c.get(99)             # None
c.get(99, "missing")  # "missing"
```

### random

Retorna uno o más elementos aleatorios. Sin argumentos retorna un valor único; con un conteo retorna una `Collection`:

```python
c = Collection([1, 2, 3, 4, 5])

c.random()       # elemento aleatorio único
c.random(3)      # Collection con 3 elementos aleatorios
```

Retorna `None` para colecciones vacías. Lanza `ValueError` si el conteo excede el tamaño de la colección.

---

## Agregar y Eliminar Elementos

### push

Añade un valor al final:

```python
c = Collection([1, 2])
c.push(3)
c.all()   # [1, 2, 3]
```

### prepend

Inserta un valor al inicio:

```python
c = Collection([2, 3])
c.prepend(1)
c.all()   # [1, 2, 3]
```

### pop

Elimina y retorna el último elemento. Retorna `None` si la colección está vacía:

```python
c = Collection([1, 2, 3])
c.pop()    # 3
c.all()    # [1, 2]
```

### shift

Elimina y retorna el primer elemento:

```python
c = Collection([10, 20, 30])
c.shift()   # 10
c.all()     # [20, 30]
```

### pull

Elimina y retorna el elemento en un índice dado:

```python
c = Collection([10, 20, 30])
c.pull(1)   # 20
c.all()     # [10, 30]
```

### put

Reemplaza el valor en un índice específico:

```python
c = Collection([1, 2, 3])
c.put(1, 99)
c.all()   # [1, 99, 3]
```

### forget

Elimina elementos por uno o más índices:

```python
c = Collection([10, 20, 30, 40])
c.forget(0, 2)
c.all()   # [20, 40]
```

### merge

Añade elementos desde una lista u otra `Collection`. Lanza `TypeError` para tipos incompatibles:

```python
c = Collection([1, 2])
c.merge([3, 4])
c.all()   # [1, 2, 3, 4]
```

---

## Filtrado

### filter

Retorna una nueva colección con los elementos que pasan la prueba:

```python
c = Collection([1, 2, 3, 4, 5])
c.filter(lambda x: x > 3).all()   # [4, 5]
```

### reject

El inverso de `filter` — elimina los elementos que coinciden con el callback. Modifica la colección en su lugar:

```python
c = Collection([1, 2, 3, 4])
c.reject(lambda x: x > 2)
c.all()   # [1, 2]
```

### where

Filtra elementos de diccionario por una condición clave-valor. Soporta operadores de comparación:

```python
items = Collection([{"v": 1}, {"v": 5}, {"v": 10}])

items.where("v", 5).all()         # [{"v": 5}]
items.where("v", ">", 3).all()    # [{"v": 5}, {"v": 10}]
```

Operadores soportados: `==`, `!=`, `<`, `<=`, `>`, `>=`.

### whereIn / whereNotIn

Filtra elementos cuyo valor de clave está (o no está) en una lista dada:

```python
c = Collection([{"id": 1}, {"id": 2}, {"id": 3}])

c.whereIn("id", [1, 3]).count()      # 2
c.whereNotIn("id", [2]).count()      # 2
```

### unique

Retorna una nueva colección sin valores duplicados. Pase una clave para unicidad basada en diccionarios:

```python
Collection([1, 2, 2, 3]).unique().count()   # 3

items = Collection([
    {"id": 1, "v": "a"},
    {"id": 2, "v": "b"},
    {"id": 1, "v": "c"},
])
items.unique("id").count()   # 2
```

### contains

Verifica si un valor — o un valor que coincida con un callback o par clave-valor — existe en la colección:

```python
c = Collection([1, 2, 3])

c.contains(2)                   # True
c.contains(99)                  # False
c.contains(lambda x: x > 2)     # True

items = Collection([{"name": "a"}, {"name": "b"}])
items.contains("name", "a")     # True
```

### diff

Retorna los elementos que no están presentes en la lista o colección dada:

```python
c = Collection([1, 2, 3, 4])
c.diff([2, 4]).all()   # [1, 3]
```

---

## Transformación

### map

Aplica un callback a cada elemento y retorna una **nueva** colección:

```python
c = Collection([1, 2, 3])
c.map(lambda x: x * 10).all()   # [10, 20, 30]
```

### transform

Como `map`, pero modifica la colección **en su lugar**:

```python
c = Collection([1, 2, 3])
c.transform(lambda x: x * 2)
c.all()   # [2, 4, 6]
```

### each

Itera y aplica un callback a cada elemento en su lugar. Detiene la iteración si el callback retorna un valor falsy:

```python
c = Collection([1, 2, 3])
c.each(lambda x: x * 2)
c.all()   # [2, 4, 6]
```

### mapInto

Crea instancias de una clase dada a partir de cada elemento:

```python
c = Collection([1, 2, 3])
c.mapInto(str).all()   # ["1", "2", "3"]
```

Lanza `TypeError` si el argumento no es un tipo.

### flatten

Aplana recursivamente listas anidadas y valores de diccionarios en una colección de un solo nivel:

```python
Collection([1, [2, [3, 4]], 5]).flatten().all()
# [1, 2, 3, 4, 5]

Collection([{"a": 1, "b": 2}]).flatten().all()
# [1, 2]
```

### collapse

Fusiona un nivel de listas anidadas en una colección plana:

```python
Collection([[1, 2], [3, 4]]).collapse().all()
# [1, 2, 3, 4]
```

### reverse

Invierte el orden de los elementos en su lugar:

```python
c = Collection([1, 2, 3])
c.reverse()
c.all()   # [3, 2, 1]
```

### sort

Ordena los elementos en orden ascendente. Pase un nombre de clave para ordenar diccionarios por un campo específico:

```python
c = Collection([3, 1, 2])
c.sort()
c.all()   # [1, 2, 3]

items = Collection([{"v": 3}, {"v": 1}, {"v": 2}])
items.sort("v")
items.all()   # [{"v": 1}, {"v": 2}, {"v": 3}]
```

---

## Agregación

### count

Retorna la cantidad de elementos. También disponible mediante `len()`:

```python
c = Collection([1, 2, 3])
c.count()   # 3
len(c)      # 3
```

### sum

Calcula el total. Pase una clave para sumar un campo específico de diccionarios:

```python
Collection([1, 2, 3]).sum()                          # 6
Collection([{"v": 10}, {"v": 20}]).sum("v")          # 30
```

Retorna `0` para colecciones vacías.

### avg

Calcula la media aritmética:

```python
Collection([2, 4, 6]).avg()                          # 4.0
Collection([{"v": 10}, {"v": 20}]).avg("v")          # 15.0
```

Retorna `0` para colecciones vacías.

### max / min

Retornan el mayor y menor valor respectivamente:

```python
c = Collection([3, 1, 4, 1, 5])
c.max()   # 5
c.min()   # 1
```

Ambos retornan `0` para colecciones vacías.

### reduce

Acumula todos los elementos en un solo valor usando un callback:

```python
c = Collection([1, 2, 3])
c.reduce(lambda acc, x: acc + x, 0)   # 6
```

### every

Retorna `True` solo si **todos** los elementos satisfacen el callback:

```python
Collection([2, 4, 6]).every(lambda x: x % 2 == 0)   # True
Collection([2, 3, 6]).every(lambda x: x % 2 == 0)   # False
```

### isEmpty

Retorna `True` cuando la colección no tiene elementos:

```python
Collection().isEmpty()       # True
Collection([1]).isEmpty()    # False
```

---

## Extracción

### pluck

Extrae valores para una clave dada de una colección de diccionarios. Una segunda clave opcional sirve como índice del resultado:

```python
c = Collection([{"n": "a"}, {"n": "b"}, {"n": "c"}])
c.pluck("n").all()   # ["a", "b", "c"]

users = Collection([
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
])
users.pluck("name", "id").all()   # {1: "Alice", 2: "Bob"}
```

### take

Toma elementos desde el inicio (positivo) o el final (negativo) de la colección:

```python
c = Collection([1, 2, 3, 4, 5])

c.take(3).all()    # [1, 2, 3]
c.take(-2).all()   # [4, 5]
c.take(0).all()    # []
```

### groupBy

Agrupa elementos por una clave especificada, produciendo una colección cuyos elementos son un diccionario que mapea claves de grupo a listas:

```python
c = Collection([
    {"type": "a", "v": 1},
    {"type": "b", "v": 2},
    {"type": "a", "v": 3},
])
groups = c.groupBy("type")
# {"a": [...], "b": [...]}
```

---

## Paginación

### forPage

Retorna un segmento de elementos para un número de página y tamaño de página dados:

```python
c = Collection([1, 2, 3, 4, 5, 6])

c.forPage(1, 2).all()   # [1, 2]
c.forPage(2, 2).all()   # [3, 4]
c.forPage(3, 2).all()   # [5, 6]
```

Lanza `ValueError` si el tamaño de página es cero o negativo.

### chunk

Divide la colección en colecciones más pequeñas del tamaño dado:

```python
c = Collection([1, 2, 3, 4, 5])
chunks = c.chunk(2)

chunks[0].all()   # [1, 2]
chunks[1].all()   # [3, 4]
chunks[2].all()   # [5]
```

Lanza `ValueError` si el tamaño del chunk es cero o negativo.

---

## Serialización

### toJson

Retorna una representación como cadena JSON:

```python
Collection([1, 2, 3]).toJson()   # "[1, 2, 3]"
```

### serialize

Retorna los elementos subyacentes como una lista plana. Para elementos que implementan un método `serialize` o `to_dict`, esos métodos se invocan automáticamente:

```python
Collection([1, "a", None]).serialize()   # [1, "a", None]
```

### implode

Une todos los elementos en una cadena con un separador (por defecto `,`):

```python
Collection(["a", "b", "c"]).implode("-")   # "a-b-c"
Collection(["x", "y"]).implode()           # "x,y"
```

---

## Combinar Colecciones

### zip

Empareja elementos de la colección con elementos de otra lista o colección por índice:

```python
c = Collection([1, 2, 3])
c.zip([4, 5, 6]).all()
# [[1, 4], [2, 5], [3, 6]]
```

Lanza `TypeError` si el argumento no es una lista o `Collection`.

---

## Notación de Corchetes e Iteración

`Collection` soporta acceso estándar de Python con corchetes, slicing, asignación e iteración:

```python
c = Collection([10, 20, 30])

c[0]         # 10
c[1] = 99    # establece el índice 1 a 99
c[0:2]       # Collection([10, 99])

for item in c:
    print(item)
```

El slicing retorna una nueva `Collection`. La función `len()` retorna la cantidad de elementos.

---

## Operadores de Comparación

Las colecciones soportan `==`, `!=`, `<`, `<=`, `>`, `>=` usando la semántica de comparación estándar de listas:

```python
a = Collection([1, 2, 3])
b = Collection([1, 2, 3])
c = Collection([1, 3])

a == b   # True
a < c    # True
```

Las colecciones con elementos idénticos también producen el mismo valor de `hash()`.

---

## Referencia de Métodos

| Método | Retorna | Muta | Descripción |
|---|---|---|---|
| `all()` | `list` | No | Retorna todos los elementos como lista |
| `avg(key?)` | `float` | No | Media aritmética de los elementos o valores de clave |
| `chunk(size)` | `Collection` | No | Divide en sub-colecciones del tamaño dado |
| `collapse()` | `Collection` | No | Aplana un nivel de listas anidadas |
| `contains(key, value?)` | `bool` | No | Verifica valor, coincidencia de callback o par clave-valor |
| `count()` | `int` | No | Número de elementos |
| `diff(items)` | `Collection` | No | Elementos que no están en la lista dada |
| `each(callback)` | `Collection` | Sí | Aplica callback en su lugar, se detiene con retorno falsy |
| `every(callback)` | `bool` | No | True si todos pasan la prueba |
| `filter(callback)` | `Collection` | No | Elementos que pasan la prueba del callback |
| `flatten()` | `Collection` | No | Aplana recursivamente estructuras anidadas |
| `forPage(page, size)` | `Collection` | No | Segmento paginado |
| `forget(*keys)` | `Collection` | Sí | Elimina elementos por índice |
| `first(callback?)` | `object` | No | Primer elemento, opcionalmente filtrado |
| `get(index, default?)` | `object` | No | Elemento por índice con valor por defecto |
| `groupBy(key)` | `Collection` | No | Agrupa elementos por un campo clave |
| `implode(glue?, key?)` | `str` | No | Une elementos en una cadena |
| `isEmpty()` | `bool` | No | True si la colección no tiene elementos |
| `last(callback?)` | `object` | No | Último elemento, opcionalmente filtrado |
| `map(callback)` | `Collection` | No | Nueva colección con elementos transformados |
| `mapInto(cls)` | `Collection` | No | Mapea elementos a instancias de clase |
| `max(key?)` | `object` | No | Valor máximo |
| `merge(items)` | `Collection` | Sí | Añade elementos desde lista o Collection |
| `min(key?)` | `object` | No | Valor mínimo |
| `pluck(value, key?)` | `Collection` | No | Extrae valores por clave |
| `pop()` | `object` | Sí | Elimina y retorna el último elemento |
| `prepend(value)` | `Collection` | Sí | Inserta elemento al inicio |
| `pull(index)` | `object` | Sí | Elimina y retorna elemento por índice |
| `push(value)` | `Collection` | Sí | Añade elemento al final |
| `put(index, value)` | `Collection` | Sí | Reemplaza valor en el índice |
| `random(count?)` | `object\|Collection` | No | Elemento(s) aleatorio(s) |
| `reduce(callback, initial)` | `object` | No | Acumula a un solo valor |
| `reject(callback)` | `Collection` | Sí | Elimina elementos que coinciden con callback |
| `reverse()` | `Collection` | Sí | Invierte el orden de los elementos |
| `serialize()` | `list` | No | Elementos como lista serializada |
| `shift()` | `object` | Sí | Elimina y retorna el primer elemento |
| `sort(key?)` | `Collection` | Sí | Ordena elementos en orden ascendente |
| `sum(key?)` | `float` | No | Suma de elementos o valores de clave |
| `take(n)` | `Collection` | No | Primeros n o últimos n elementos |
| `toJson()` | `str` | No | Representación como cadena JSON |
| `transform(callback)` | `Collection` | Sí | Transforma elementos en su lugar |
| `unique(key?)` | `Collection` | No | Elimina elementos duplicados |
| `where(key, ...)` | `Collection` | No | Filtra por comparación clave-valor |
| `whereIn(key, values)` | `Collection` | No | Filtra donde la clave está en los valores |
| `whereNotIn(key, values)` | `Collection` | No | Filtra donde la clave no está en los valores |
| `zip(items)` | `Collection` | No | Empareja elementos por índice |
