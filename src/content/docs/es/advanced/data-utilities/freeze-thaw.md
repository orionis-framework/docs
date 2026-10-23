---
title: "FreezeThaw"
description: "Convierte diccionarios y secuencias entre formas congeladas y mutables, con sus límites de referencias."
editUrl: true
lastUpdated: false
---

`FreezeThaw` convierte estructuras de contenedores compatibles para consultarlas en modo de solo lectura o editarlas después. Sus dos operaciones públicas son estáticas: usa `FreezeThaw.freeze(value)` y `FreezeThaw.thaw(value)` sin construir un auxiliar. Solo los diccionarios, listas, tuplas y proxies de diccionario participan en el recorrido; los objetos Python arbitrarios no se congelan.

## Importación y uso directo

Importa el módulo que lo define: `orionis.support.structures` no reexporta `FreezeThaw`.

```python
from orionis.support.structures.freezer import FreezeThaw

frozen = FreezeThaw.freeze({"items": [1, 2]})
editable = FreezeThaw.thaw(frozen)
editable["items"].append(3)
assert editable == {"items": [1, 2, 3]}
assert frozen["items"] == (1, 2)
```

## Inyección de dependencias

Las llamadas estáticas no requieren contenedor ni inicio de la aplicación. Si el constructor de una aplicación depende explícitamente de esta clase auxiliar, Orionis puede inyectar una instancia sin estado y las mismas operaciones estáticas siguen disponibles. No hay un contrato de servicio ni una configuración correspondiente que resolver.

```python
import asyncio
from orionis.container.container import Container
from orionis.support.structures.freezer import FreezeThaw

class Snapshot:
    def __init__(self, converter: FreezeThaw) -> None:
        self.converter = converter

async def main() -> None:
    class LocalContainer(Container):
        pass

    snapshot = await LocalContainer().make(Snapshot)
    assert snapshot.converter.freeze([1, 2]) == (1, 2)

asyncio.run(main())
```

<a id="freezethaw-method-freeze"></a>

## `freeze(obj: object) -> object`

Este método estático copia contenedores compatibles y devuelve los valores de tipo `dict` como `MappingProxyType`, y los valores `list`/`tuple` como tuplas. Los diccionarios vacíos se convierten en proxies vacíos; las listas y tuplas vacías, en `()`. Recorre los valores de diccionario y los elementos de secuencia, dejando las claves sin cambios. No modifica la entrada. Los objetos que no son contenedores se devuelven por identidad, incluidos conjuntos y objetos mutables personalizados. Un `MappingProxyType` existente se devuelve sin cambios y sin recorrer su contenido.

En árboles ordinarios de contenedores, los contenedores anidados compatibles se convierten recursivamente. Esto no garantiza inmutabilidad profunda para cualquier objeto: los proxies existentes y los valores mutables no compatibles pueden seguir exponiendo cambios. El método no declara una excepción propia de validación. Asignar sobre el proxy o la tupla resultante produce el `TypeError` de Python.

```python
from types import MappingProxyType
from orionis.support.structures.freezer import FreezeThaw

source = {"items": [1, {"enabled": True}], "pair": (2, 3)}
frozen = FreezeThaw.freeze(source)
assert isinstance(frozen, MappingProxyType)
assert isinstance(frozen["items"], tuple)
assert isinstance(frozen["items"][1], MappingProxyType)
assert frozen["items"][1]["enabled"] is True
source["items"].append(4)
assert len(frozen["items"]) == 2
try:
    frozen["new"] = 1
except TypeError:
    pass

mutable = []
proxy = MappingProxyType({"items": mutable})
assert FreezeThaw.freeze(proxy) is proxy
mutable.append(1)
assert proxy["items"] == [1]
unsupported = {1, 2}
assert FreezeThaw.freeze(unsupported) is unsupported
```

<a id="freezethaw-method-thaw"></a>

## `thaw(obj: object) -> object`

Este método estático devuelve copias mutables: los diccionarios y `MappingProxyType` se convierten en diccionarios estándar; las listas y tuplas, en listas. Recorre recursivamente sus valores/elementos, conserva las referencias repetidas a contenedores compatibles mediante una caché de identidad y reconecta sus ciclos. Los mapas vacíos se convierten en `{}` y las secuencias vacías, en `[]`. No convierte las claves de diccionario. El origen permanece intacto; los objetos no compatibles se devuelven por identidad, por lo que conjuntos y objetos mutables personalizados anidados siguen compartidos. No declara una excepción propia de validación.

Un recorrido de congelación y descongelación normaliza las tuplas a listas y las subclases de diccionario a diccionarios estándar; no reconstruye las clases originales de los contenedores.

```python
from types import MappingProxyType
from orionis.support.structures.freezer import FreezeThaw

shared = (1, 2)
source = MappingProxyType({"first": shared, "second": shared})
mutable = FreezeThaw.thaw(source)
assert type(mutable) is dict
assert type(mutable["first"]) is list
assert mutable["first"] is mutable["second"]
mutable["first"].append(3)
assert source["first"] == (1, 2)

cycle = {}
cycle["self"] = cycle
copied_cycle = FreezeThaw.thaw(cycle)
assert copied_cycle is not cycle
assert copied_cycle["self"] is copied_cycle

assert FreezeThaw.thaw(FreezeThaw.freeze({"pair": (1, 2)})) == {
    "pair": [1, 2]
}
```

<a id="freezethaw-boundaries"></a>

## Grafos compartidos y ciclos al congelar

`freeze()` recorre los objetos con una pila y convierte las copias de la caché en orden inverso al descubrimiento. Este orden funciona para árboles de contenedores, pero no representa un orden completo de dependencias para grafos compartidos arbitrarios. Algunas disposiciones compartidas pueden conservar una copia intermedia mutable; un ciclo también puede conservar diccionarios/listas intermedios mutables en lugar de apuntar a la raíz congelada final. No dependas de inmutabilidad recursiva completa ni de la conservación de todas las identidades compartidas para estas entradas. El ejemplo muestra un límite real de la implementación que depende del orden.

```python
from orionis.support.structures.freezer import FreezeThaw

shared = [1]
source = {"outer": {"shared": shared}, "direct": shared}
frozen = FreezeThaw.freeze(source)
assert type(frozen["outer"]["shared"]) is list
assert type(frozen["direct"]) is tuple
assert frozen["outer"]["shared"] is not frozen["direct"]

cycle = {}
cycle["self"] = cycle
frozen_cycle = FreezeThaw.freeze(cycle)
assert type(frozen_cycle["self"]) is dict
assert frozen_cycle["self"] is not frozen_cycle
```

<a id="freezethaw-protocol-serialization"></a>

## Protocolos de Python y serialización

`FreezeThaw` no define dunders propios de construcción, igualdad, hash, copia, copia profunda ni serialización. Es un contenedor sin estado de operaciones estáticas; sus resultados tienen los protocolos nativos de `MappingProxyType`, `tuple`, `dict` o `list`.

Un proxy de diccionario congelado no es directamente serializable con JSON ni con pickle, y `copy.copy`/`copy.deepcopy` no pueden copiarlo mediante la ruta habitual de reducción. Usa `thaw()` antes de codificar cuando las claves y los valores restantes sean compatibles con el formato elegido. `thaw()` convierte contenedores; no es un serializador: los objetos arbitrarios restantes aún pueden impedir la codificación. JSON convierte tuplas en arreglos y no conserva la identidad de los objetos Python.

```python
import copy
import json
import pickle
from orionis.support.structures.freezer import FreezeThaw

frozen = FreezeThaw.freeze({"items": [1, 2]})
for encode in (json.dumps, pickle.dumps, copy.copy, copy.deepcopy):
    try:
        encode(frozen)
    except TypeError:
        pass
    else:
        raise AssertionError("Mapping proxies are not supported directly")

mutable = FreezeThaw.thaw(frozen)
assert json.loads(json.dumps(mutable)) == {"items": [1, 2]}
assert pickle.loads(pickle.dumps(mutable)) == mutable
```

El método estático `_isContainer` es un predicado interno del recorrido, no una operación pública de conversión.
