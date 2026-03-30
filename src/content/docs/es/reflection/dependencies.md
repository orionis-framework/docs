---
title: 'Dependencias'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reflect Dependencies

La clase `ReflectDependencies` es el motor de análisis de dependencias del sistema de reflexión de Orionis. Su propósito es inspeccionar las firmas de constructores, métodos y funciones callable para categorizar automáticamente sus parámetros como **resueltos** o **no resueltos**, proporcionando la información necesaria para que el contenedor de inyección de dependencias (IoC) pueda resolver e inyectar servicios de forma automática.

Este componente es fundamental para el funcionamiento interno del framework, ya que permite al contenedor de servicios determinar qué dependencias puede resolver automáticamente y cuáles requieren configuración explícita por parte del desarrollador.

## Importación

```python
from orionis.services.introspection.dependencies.reflection import ReflectDependencies
```

## Inicialización

La clase `ReflectDependencies` recibe un objeto objetivo (`target`) que puede ser una clase, una función o `None`. El análisis de dependencias se realiza bajo demanda al invocar los métodos de inspección.

```python
from orionis.services.introspection.dependencies.reflection import ReflectDependencies

class UserService:
    def __init__(self, repo: UserRepository, name: str, retries: int = 3) -> None:
        self.repo = repo
        self.name = name
        self.retries = retries

reflection = ReflectDependencies(UserService)
```

También acepta funciones y callables:

```python
def process_data(data: list, mode: str = "fast") -> str:
    return f"{len(data)}-{mode}"

reflection = ReflectDependencies(process_data)
```

## Contrato

La clase `ReflectDependencies` implementa el contrato `IReflectDependencies`, que define tres métodos abstractos de inspección:

```python
from orionis.services.introspection.dependencies.contracts.reflection import IReflectDependencies
```

## Entidades

El sistema utiliza dos entidades inmutables (dataclasses congeladas) para representar los resultados del análisis.

### Argument

Representa un parámetro individual con toda su metadata de tipo y estado de resolución.

```python
from orionis.services.introspection.dependencies.entities.argument import Argument
```

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | `str` | Nombre del parámetro |
| `resolved` | `bool` | Si la dependencia fue resuelta |
| `module_name` | `str` | Módulo donde está definido el tipo |
| `class_name` | `str` | Nombre del tipo/clase del parámetro |
| `type` | `type` | Objeto tipo Python del parámetro |
| `full_class_path` | `str` | Ruta completa al tipo (`module.Class`) |
| `is_keyword_only` | `bool` | Si es un parámetro keyword-only |
| `default` | `Any \| None` | Valor por defecto, si lo tiene |

`Argument` es un dataclass congelado (`frozen=True`), lo que lo hace inmutable y hashable.

### Signature

Agrupa los resultados del análisis en tres diccionarios categorizados.

```python
from orionis.services.introspection.dependencies.entities.signature import Signature
```

| Campo | Tipo | Descripción |
|---|---|---|
| `resolved` | `dict[str, Argument]` | Parámetros resueltos automáticamente |
| `unresolved` | `dict[str, Argument]` | Parámetros que no pudieron resolverse |
| `ordered` | `dict[str, Argument]` | Todos los parámetros en orden de declaración |

## Lógica de Resolución

El sistema clasifica cada parámetro según las siguientes reglas, evaluadas en orden de prioridad:

1. **Parámetros omitidos**: `self`, `cls`, `*args` y `**kwargs` se excluyen del análisis.
2. **Sin anotación ni valor por defecto**: se clasifican como **no resueltos** — el contenedor no tiene información suficiente para inyectarlos.
3. **Con valor por defecto**: se clasifican como **resueltos** — el contenedor puede utilizar el valor proporcionado.
4. **Anotados con tipo builtin** (`str`, `int`, `float`, etc.) **sin valor por defecto**: se clasifican como **no resueltos** — los tipos primitivos no pueden resolverse automáticamente.
5. **Anotados con tipo no-builtin**: se clasifican como **resueltos** — el contenedor puede resolver la dependencia por tipo a través del IoC.

```python
class PaymentService:
    def __init__(
        self,
        gateway: PaymentGateway,   # Resuelto (tipo no-builtin)
        currency: str,             # No resuelto (builtin sin default)
        retries: int = 3,          # Resuelto (tiene valor por defecto)
    ) -> None: ...

rd = ReflectDependencies(PaymentService)
sig = rd.constructorSignature()

sig.resolved    # {"gateway": Argument(...), "retries": Argument(...)}
sig.unresolved  # {"currency": Argument(...)}
sig.ordered     # {"gateway": ..., "currency": ..., "retries": ...}
```

## Inspección de Constructores

### constructorSignature

Analiza el método `__init__` de una clase y categoriza sus parámetros.

```python
class EmailService:
    def __init__(self, mailer: Mailer, subject: str, max_retries: int = 5) -> None:
        ...

rd = ReflectDependencies(EmailService)
sig = rd.constructorSignature()

# Dependencia resuelta por tipo
sig.resolved["mailer"].class_name      # "Mailer"
sig.resolved["mailer"].resolved        # True

# Dependencia resuelta por valor por defecto
sig.resolved["max_retries"].default    # 5
sig.resolved["max_retries"].resolved   # True

# Dependencia no resuelta
sig.unresolved["subject"].class_name   # "str"
sig.unresolved["subject"].resolved     # False
```

## Inspección de Métodos

### methodSignature

Analiza la firma de un método específico de la clase objetivo.

```python
class DataProcessor:
    def process(self, value: int, mode: str = "fast") -> str:
        return f"{value}-{mode}"

rd = ReflectDependencies(DataProcessor)
sig = rd.methodSignature("process")

sig.unresolved["value"].class_name  # "int"
sig.resolved["mode"].default        # "fast"
```

Si el método no existe, se lanza un `AttributeError`:

```python
rd.methodSignature("nonexistent")
# AttributeError
```

## Inspección de Callables

### callableSignature

Analiza la firma de una función o callable pasado como objetivo.

```python
def calculate(a: int, b: str = "hello") -> str:
    return f"{a}-{b}"

rd = ReflectDependencies(calculate)
sig = rd.callableSignature()

sig.unresolved["a"].class_name  # "int"
sig.resolved["b"].default       # "hello"
```

Si el objetivo no es callable, se lanza un `TypeError`:

```python
rd = ReflectDependencies("not callable")
rd.callableSignature()
# TypeError
```

## Métodos de Signature

La entidad `Signature` ofrece métodos para consultar y filtrar los resultados del análisis.

| Método | Retorno | Descripción |
|---|---|---|
| `noArgumentsRequired()` | `bool` | `True` si no hay dependencias |
| `hasUnresolvedArguments()` | `bool` | `True` si existen dependencias no resueltas |
| `arguments()` | `dict_items` | Pares `(nombre, Argument)` en orden |
| `items()` | `dict_items` | Alias de `arguments()` |
| `getAllOrdered()` | `dict[str, Argument]` | Todas las dependencias en orden |
| `getResolved()` | `dict[str, Argument]` | Solo dependencias resueltas |
| `getUnresolved()` | `dict[str, Argument]` | Solo dependencias no resueltas |
| `getPositionalOnly()` | `dict[str, Argument]` | Dependencias posicionales |
| `getKeywordOnly()` | `dict[str, Argument]` | Dependencias keyword-only |
| `toDict()` | `dict[str, dict]` | Todas las dependencias como diccionarios |
| `resolvedToDict()` | `dict[str, dict]` | Resueltas como diccionarios |
| `unresolvedToDict()` | `dict[str, dict]` | No resueltas como diccionarios |
| `positionalOnlyToDict()` | `dict[str, dict]` | Posicionales como diccionarios |
| `keywordOnlyToDict()` | `dict[str, dict]` | Keyword-only como diccionarios |

### Ejemplo de Consulta

```python
sig = rd.constructorSignature()

# Verificar si requiere argumentos
if sig.noArgumentsRequired():
    print("No requiere dependencias")

# Verificar si hay dependencias sin resolver
if sig.hasUnresolvedArguments():
    for name, arg in sig.getUnresolved().items():
        print(f"  {name}: {arg.class_name} (no resuelto)")

# Iterar sobre todas las dependencias en orden
for name, arg in sig.items():
    status = "resuelto" if arg.resolved else "no resuelto"
    print(f"{name}: {arg.class_name} [{status}]")
```

## Parámetros Keyword-Only

El sistema detecta correctamente parámetros keyword-only (definidos después de `*` en la firma) y los marca con `is_keyword_only=True` en el `Argument`.

```python
class Config:
    def __init__(self, *, label: str, count: int = 0) -> None:
        self.label = label
        self.count = count

rd = ReflectDependencies(Config)
sig = rd.constructorSignature()

# Filtrar solo keyword-only
keyword_args = sig.getKeywordOnly()
# {"label": Argument(..., is_keyword_only=True), "count": Argument(..., is_keyword_only=True)}

# Filtrar solo posicionales
positional_args = sig.getPositionalOnly()
# {} (vacío, ya que todos son keyword-only)
```