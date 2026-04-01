---
title: StdClass
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# StdClass

`StdClass` es un contenedor ligero y genérico que convierte argumentos de palabra clave en atributos del objeto. Proporciona una forma simple de crear objetos de datos estructurados sobre la marcha sin definir una clase formal — similar a un objeto anónimo o un objeto de transferencia de datos simple.

Use `StdClass` cuando necesite un contenedor rápido y flexible para pasar valores agrupados a través de su aplicación — paquetes de configuración, resultados intermedios o cualquier escenario donde una definición de clase completa sería excesiva.

## Importación

```python
from orionis.support.standard.std import StdClass
```

## Crear una Instancia

Pase cualquier argumento de palabra clave al constructor. Cada clave se convierte en un atributo del objeto resultante:

```python
obj = StdClass(name="Orionis", version=1, debug=True)

obj.name      # "Orionis"
obj.version   # 1
obj.debug     # True
```

Una instancia vacía no tiene atributos:

```python
obj = StdClass()
obj.toDict()   # {}
```

### Desde un Diccionario

El método de clase `fromDict` crea una instancia a partir de un diccionario existente:

```python
data = {"host": "localhost", "port": 5432}

config = StdClass.fromDict(data)
config.host   # "localhost"
config.port   # 5432
```

Una ida y vuelta `fromDict` → `toDict` preserva los datos originales:

```python
original = {"a": 1, "b": "hello"}
StdClass.fromDict(original).toDict() == original   # True
```

---

## Gestión de Atributos

### Leer Atributos

Acceda a los atributos con notación de punto estándar. Use `hasattr` para verificar existencia:

```python
obj = StdClass(color="blue", count=5)

obj.color                # "blue"
hasattr(obj, "color")    # True
hasattr(obj, "missing")  # False
```

### Agregar y Actualizar Atributos

El método `update` agrega nuevos atributos o sobrescribe los existentes:

```python
obj = StdClass(x=1)

obj.update(y=2, z=3)    # agregar nuevos atributos
obj.update(x=99)         # sobrescribir existente

obj.toDict()   # {"x": 99, "y": 2, "z": 3}
```

Múltiples llamadas a `update` acumulan atributos:

```python
obj = StdClass()
obj.update(a=1)
obj.update(b=2)
obj.update(c=3)
obj.toDict()   # {"a": 1, "b": 2, "c": 3}
```

También puede establecer atributos directamente:

```python
obj = StdClass(x=1)
obj.x = 99
obj.x   # 99
```

#### Nombres Protegidos

`update` rechaza nombres de atributos que entran en conflicto con la interfaz de la clase:

- **Nombres dunder** (`__name__`, `__init__`, etc.) — lanza `ValueError`
- **Nombres de métodos existentes** (`toDict`, `update`, `remove`, `fromDict`) — lanza `ValueError`

```python
obj = StdClass()

obj.update(__reserved__="bad")   # ValueError
obj.update(toDict="conflict")   # ValueError
obj.update(remove="conflict")   # ValueError
```

### Eliminar Atributos

El método `remove` elimina uno o más atributos por nombre. Lanza `AttributeError` si algún atributo no existe:

```python
obj = StdClass(a=1, b=2, c=3)

obj.remove("a")
obj.toDict()   # {"b": 2, "c": 3}

obj.remove("b", "c")
obj.toDict()   # {}
```

```python
obj = StdClass()
obj.remove("missing")   # AttributeError: Attribute 'missing' not found
```

---

## Convertir a Diccionario

`toDict` retorna una **copia superficial** de todos los atributos como un `dict` simple. Mutar el diccionario retornado no afecta al objeto original:

```python
obj = StdClass(x=1, flag=True)

d = obj.toDict()    # {"x": 1, "flag": True}
d["x"] = 999
obj.x               # 1 — sin cambios
```

---

## Igualdad y Hashing

Dos instancias de `StdClass` son iguales cuando tienen los mismos atributos con los mismos valores:

```python
a = StdClass(x=1, y=2)
b = StdClass(x=1, y=2)

a == b   # True
```

Valores diferentes, claves diferentes o comparación con objetos que no son `StdClass` producen `False`:

```python
StdClass(x=1) == StdClass(x=2)    # False
StdClass(x=1) == StdClass(y=1)    # False
StdClass(x=1) == {"x": 1}         # False
```

Las instancias de `StdClass` son **hasheables**, por lo que pueden usarse como claves de diccionario o en conjuntos. Instancias con atributos idénticos producen el mismo hash:

```python
a = StdClass(x=1)
b = StdClass(x=1)

{a, b}           # set con 1 elemento
{a: "value"}     # funciona como clave de dict
```

Modificar atributos cambia el valor del hash.

---

## Representación en Cadena

`repr()` incluye el nombre de la clase y todos los atributos — útil para depuración:

```python
obj = StdClass(name="Orionis", v=3)

repr(obj)   # "StdClass({'name': 'Orionis', 'v': 3})"
str(obj)    # "{'name': 'Orionis', 'v': 3}"
```

---

## Referencia de Métodos

| Método | Firma | Descripción |
|---|---|---|
| `__init__` | `StdClass(**kwargs)` | Crea una instancia con argumentos de palabra clave como atributos |
| `fromDict` | `StdClass.fromDict(dict) → StdClass` | Método de clase — crea una instancia desde un diccionario |
| `update` | `update(**kwargs) → None` | Agrega o sobrescribe atributos. Rechaza nombres dunder y de métodos |
| `remove` | `remove(*names) → None` | Elimina atributos por nombre. Lanza `AttributeError` si no existen |
| `toDict` | `toDict() → dict` | Retorna una copia superficial de todos los atributos como diccionario |
