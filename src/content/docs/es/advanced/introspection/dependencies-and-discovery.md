---
title: "Dependencias y firmas"
description: "ReflectDependencies, Argument y Signature: clasificación de parámetros, valores predeterminados, schemas y metadatos para la inyección."
editUrl: true
lastUpdated: false
---

`ReflectDependencies` transforma los parámetros de un constructor, método o callable en metadatos `Argument`, agrupados en una `Signature`. Sirve para analizar handlers, construir herramientas de diagnóstico o comprender cómo Orionis prepara una invocación.

La reflexión **no instancia servicios, ejecuta el callable ni valida su payload**. La etiqueta `resolved` describe la clasificación del parámetro; no garantiza que el contenedor pueda construir su valor. Para la inyección habitual consulta [Aplicación y Contenedor](/es/architecture/service-container). El descubrimiento de archivos y la carga de clases se explican en [Descubrimiento de módulos](/es/advanced/introspection/module-discovery).

## Importación y primera inspección

`ReflectDependencies` se exporta desde `orionis.introspection`. Las entidades y el contrato tienen estas importaciones:

```python
from orionis.introspection import ReflectDependencies
from orionis.introspection.dependencies.contracts.reflection import IReflectDependencies
from orionis.introspection.dependencies.entities.argument import Argument
from orionis.introspection.dependencies.entities.signature import Signature


class Repository:
    pass


def handler(repository: Repository, user_id: int, *, limit=25):
    return repository, user_id, limit


signature = ReflectDependencies(handler).callableSignature()
assert isinstance(signature, Signature)
assert isinstance(signature.ordered["repository"], Argument)
assert list(signature.resolved) == ["repository", "limit"]
assert list(signature.unresolved) == ["user_id"]
assert list(signature.ordered) == ["repository", "user_id", "limit"]
assert signature.ordered["limit"].is_keyword_only
assert isinstance(ReflectDependencies(handler), IReflectDependencies)
```

Todos estos análisis son síncronos, incluso si el objetivo es una función `async def`: leer su firma no la ejecuta ni requiere `await`.

## Cómo se clasifican los parámetros

El análisis conserva el orden de declaración y aplica estas reglas, en este orden:

| Parámetro | Clasificación y metadatos |
|---|---|
| Nombre `self` o `cls`; `*args`; `**kwargs` | Se omite. Los nombres `self` y `cls` se omiten también en funciones ordinarias. |
| Sin anotación ni valor predeterminado | `resolved=False`; metadatos de `type(typing.Any)`, no una instancia ni el objeto `typing.Any`. |
| Con valor predeterminado | `resolved=True`; `type`, módulo y nombre provienen de **`type(default)`**, aunque exista una anotación diferente. |
| Tipo de módulo `builtins`, sin valor predeterminado | `resolved=False`; por ejemplo `int`, `str` o `list[int]`. |
| Otra anotación, sin valor predeterminado | `resolved=True`; conserva sus metadatos. Esto incluye clases de aplicación y construcciones de typing que pueden no ser instanciables. |

`is_keyword_only=True` identifica únicamente los parámetros declarados después de `*`. Los parámetros anteriores a `/` y los que admiten tanto posición como nombre se agrupan juntos con `False`; `Argument` no conserva una distinción adicional entre ellos.

```python
from orionis.introspection import ReflectDependencies


def options(required: int, /, ordinary: str, *items, count: str = 5, **extras):
    return required, ordinary, items, count, extras


signature = ReflectDependencies(options).callableSignature()
assert list(signature.ordered) == ["required", "ordinary", "count"]
assert list(signature.getPositionalOnly()) == ["required", "ordinary"]
assert list(signature.getKeywordOnly()) == ["count"]
assert signature.resolved["count"].type is int
assert signature.resolved["count"].default == 5
```

La anotación `count: str` no convierte `5` a texto. El análisis describe el valor predeterminado existente.

### Referencias futuras, genéricos y schemas

Para una anotación de texto **sin valor predeterminado**, el resolvedor intenta evaluarla en los globals del módulo del callable. Si no puede resolver todas a la vez, intenta cada referencia por separado. Solo sustituye el texto cuando obtiene un objeto que sea una clase (`isinstance(resultado, type)`). No dispone de los locales arbitrarios de una función que ya terminó.

Una referencia que permanece como texto usa `module_name="typing"`, `class_name` igual al texto y `type=str`. Se marca `resolved=True`, aunque el contenedor la rechazará si no se proporciona un valor explícito. Los alias parametrizados o uniones no reciben tratamiento especial de inyección: por ejemplo `list[int]` real queda sin resolver por su módulo builtin; `int | None` real se marca resuelto por sus metadatos, pero eso no selecciona automáticamente una dependencia alternativa.

`is_schema=True` se establece únicamente cuando la anotación, sin default, es una clase derivada de `msgspec.Struct`; incluye los schemas de Orionis. No ejecuta validación ni inspecciona las restricciones de sus campos. Una anotación con default sigue la rama de defaults y conserva `is_schema=False`.

```python
import inspect
from orionis.introspection import ReflectDependencies
from orionis.schemas import Schema


class Repository:
    pass


class CreateUser(Schema):
    name: str


def action(
    payload: CreateUser,
    repository: "Repository",
    unknown: "UnavailableService",
    rows: list[int],
    optional: Repository = None,
):
    return payload, repository, unknown, rows, optional


signature = ReflectDependencies(action).callableSignature()
assert signature.ordered["payload"].is_schema
assert signature.ordered["repository"].type is Repository
assert signature.ordered["repository"].default is inspect.Parameter.empty
assert signature.ordered["unknown"].type is str
assert signature.ordered["unknown"].module_name == "typing"
assert signature.ordered["unknown"].resolved
assert not signature.ordered["rows"].resolved
assert signature.ordered["optional"].type is type(None)
assert signature.ordered["optional"].default is None
assert not signature.ordered["optional"].is_schema
```

Las anotaciones de **retorno** no forman parte de `Signature`: no hay inferencia ni conversión de la respuesta en este componente.

## API de ReflectDependencies

<a id="reflectdependencies-method-init"></a>
### Construcción

```text
ReflectDependencies(target: Any | None = None) -> None
```

Guarda `target` para las siguientes operaciones, sin validarlo ni analizarlo todavía. Puede ser una clase, instancia, función o método según la operación elegida. El default `None` permite crear el objeto, pero no constituye un objetivo callable útil.

<a id="reflectdependencies-method-constructorsignature"></a>
### constructorSignature

```text
constructorSignature(self) -> Signature
```

Analiza `target.__init__`. No ejecuta el constructor. Para describir una clase sin crear una instancia, pasa directamente la clase:

```python
from orionis.introspection import ReflectDependencies


class Report:
    def __init__(self, title: str, *, attempts=3):
        self.title = title
        self.attempts = attempts


signature = ReflectDependencies(Report).constructorSignature()
assert list(signature.ordered) == ["title", "attempts"]
assert not signature.ordered["title"].resolved
assert signature.ordered["attempts"].default == 3
```

Propaga `AttributeError` si no se obtiene `__init__`; los fallos de inspección se presentan como `ValueError`. Un callable puede tener un `__init__` genérico que no represente su llamada: para funciones utiliza `callableSignature()`.

<a id="reflectdependencies-method-methodsignature"></a>
### methodSignature

```text
methodSignature(self, method_name: str) -> Signature
```

Obtiene el atributo con `getattr(target, method_name)` y analiza su firma. Un nombre ausente provoca **`AttributeError`**, no una excepción de reflexión propia. Un atributo no inspeccionable provoca `ValueError`; un nombre que no sea texto puede provocar `TypeError` en `getattr`.

Los métodos ligados excluyen su primer parámetro por la vinculación de Python, aunque el receptor no se llame `self`. Los `classmethod` y `staticmethod` conservan sus argumentos explícitos. En un método ordinario accedido desde la clase, un receptor con nombre distinto de `self` o `cls` permanece en la firma.

```python
from orionis.introspection import ReflectDependencies


class Actions:
    def handle(receiver, item: int, *, limit=10):
        return item, limit

    @classmethod
    def byClass(cls, page=1):
        return page

    @staticmethod
    def byStatic(page=1):
        return page


bound = ReflectDependencies(Actions()).methodSignature("handle")
unbound = ReflectDependencies(Actions).methodSignature("handle")
assert list(bound.ordered) == ["item", "limit"]
assert list(unbound.ordered) == ["receiver", "item", "limit"]
for target in (Actions, Actions()):
    reflection = ReflectDependencies(target)
    assert list(reflection.methodSignature("byClass").ordered) == ["page"]
    assert list(reflection.methodSignature("byStatic").ordered) == ["page"]
```

<a id="reflectdependencies-method-callablesignature"></a>
### callableSignature

```text
callableSignature(self) -> Signature
```

Comprueba `callable(target)` y analiza la firma de llamada que expone Python. Admite funciones, métodos ligados, clases o instancias invocables cuando su firma puede inspeccionarse y el objetivo puede usarse como clave de caché. Para una clase, inspecciona su llamada; no es una operación equivalente a leer explícitamente `__init__` en todas las metaclases.

```python
from orionis.introspection import ReflectDependencies


async def fetch(item_id: int, *, timeout=5):
    return item_id, timeout


signature = ReflectDependencies(fetch).callableSignature()
assert signature.ordered["item_id"].type is int
assert signature.ordered["timeout"].default == 5
```

Lanza `TypeError` para objetivos no callable y para objetivos no hashables al acceder a la caché. Si `inspect.signature` no puede describir la firma, lanza `ValueError` con la causa original. Inspeccionar `min`, por ejemplo, falla porque no expone una firma inspeccionable en este runtime. Los decoradores con `__wrapped__` y las firmas `__signature__` se interpretan según `inspect.signature`.

### Contrato y caché

`IReflectDependencies` declara las tres operaciones anteriores como abstractas. No es instanciable ni está registrado como servicio nativo para escoger automáticamente un objetivo. El uso directo de `ReflectDependencies(objetivo)` hace explícito qué se está analizando.

Las firmas de Python y sus metadatos usan dos cachés LRU de **1.024 entradas** cada una, locales al proceso. Repetir un objetivo devuelve el **mismo objeto `Signature`**, también entre instancias del wrapper. Los métodos ligados usan como clave la función subyacente y el modo ligado; la caché de esos métodos no retiene sus receptores.

No hay `clearCache()` público en `ReflectDependencies`. Modificar `__annotations__`, defaults o `__signature__` sobre la misma función después de inspeccionarla puede dejar metadatos obsoletos. Para una definición distinta usa un nuevo objeto función o reinicia el proceso. Los fallos de inspección no se almacenan como resultados correctos.

```python
from orionis.introspection import ReflectDependencies


def cached(limit=25):
    return limit


first = ReflectDependencies(cached).callableSignature()
second = ReflectDependencies(cached).callableSignature()
assert first is second
```

## Entidad Argument

`Argument` es una dataclass `frozen=True`, `slots=True`, `kw_only=True`. Sus nueve campos son argumentos por nombre del constructor; los seis primeros son obligatorios:

```text
Argument(
    *,
    name: str,
    resolved: bool,
    module_name: str,
    class_name: str,
    type: type[Any],
    full_class_path: str,
    is_keyword_only: bool = False,
    is_schema: bool = False,
    default: Any | None = None,
) -> None
```

| Campo | Propósito y valor |
|---|---|
| <a id="argument-field-name"></a>`name` | Nombre del parámetro. Se usa como clave en las tres agrupaciones. |
| <a id="argument-field-resolved"></a>`resolved` | Clasificación del analizador; no representa una instancia creada. |
| <a id="argument-field-module-name"></a>`module_name` | Módulo del tipo o del valor predeterminado. Las referencias de texto no resueltas usan `typing`. |
| <a id="argument-field-class-name"></a>`class_name` | Nombre del tipo; para una referencia pendiente, conserva el texto de la anotación. |
| <a id="argument-field-type"></a>`type` | Objeto anotado o tipo del default. La anotación declarada del campo no impide que contenga un alias de typing. |
| <a id="argument-field-full-class-path"></a>`full_class_path` | `module_name + "." + class_name`; identifica metadatos, sin importar o cargar esa ruta. |
| <a id="argument-field-is-keyword-only"></a>`is_keyword_only` | `False` por defecto; `True` para parámetros que solo admiten nombre. |
| <a id="argument-field-is-schema"></a>`is_schema` | `False` por defecto; identifica una clase `msgspec.Struct` anotada sin default. |
| <a id="argument-field-default"></a>`default` | `None` por defecto al construir la entidad. El reflector usa el default real si existe, `inspect.Parameter.empty` para tipos no builtin anotados sin default y `None` para parámetros sin resolver. **`None` por sí solo no indica si el parámetro es opcional.** |

<a id="argument-method-post-init"></a>
### Validación y mutabilidad

```text
__post_init__(self) -> None
```

Se ejecuta automáticamente al construir la entidad. Verifica que `module_name`, `class_name` y `full_class_path` sean `str`, o lanza `TypeError`. Rechaza `type=None` junto con `default=None` mediante `ValueError`. No comprueba exhaustivamente `name`, flags, la correspondencia entre rutas y clases ni todos los objetos de typing.

```python
from dataclasses import FrozenInstanceError
from orionis.introspection.dependencies.entities.argument import Argument


argument = Argument(
    name="limit",
    resolved=True,
    module_name="builtins",
    class_name="int",
    type=int,
    full_class_path="builtins.int",
    default=25,
)
assert argument.default == 25
assert argument.is_keyword_only is False
assert argument.is_schema is False
try:
    argument.name = "other"
except FrozenInstanceError:
    pass
else:
    raise AssertionError("Argument must reject field reassignment")
```

La dataclass genera representación y comparación por campos; su hash solo funciona si todos los valores implicados son hashables. Un default lista no se vuelve inmutable por estar dentro de `Argument`. La entidad no hereda `BaseEntity`: no tiene métodos propios `toDict()` ni `getFields()`.

<a id="argument-generated-protocols"></a>
### Copias y protocolos generados de Argument

`dataclasses.replace()` y `copy.replace()` permiten construir otro `Argument` con campos cambiados y vuelven a ejecutar su validación. La dataclass genera `__replace__`; por tener slots y ser frozen, también genera `__getstate__` y `__setstate__` para preservar sus campos al copiar o serializar. Son protocolos estándar de Python, separados de los métodos implementados por Orionis.

La sustitución y `copy.copy()` son superficiales: conservan el default mutable. `copy.deepcopy()` copia su contenido. Este ejemplo usa un tipo builtin y un default serializable para comprobar también `pickle`:

```python
import copy
import pickle
from dataclasses import replace
from orionis.introspection.dependencies.entities.argument import Argument


original = Argument(
    name="tags",
    resolved=True,
    module_name="builtins",
    class_name="list",
    type=list,
    full_class_path="builtins.list",
    default=["reports"],
)
renamed = replace(original, name="labels")
replaced = copy.replace(original, name="categories")
assert renamed.name == "labels" and replaced.name == "categories"
assert renamed.default is original.default
assert copy.copy(original).default is original.default
assert copy.deepcopy(original).default is not original.default
restored = pickle.loads(pickle.dumps(original))
assert restored == original and restored is not original
assert restored.default is not original.default
```

Poder serializar esta entidad depende de sus valores: una clase local, una función no serializable u otro default pueden impedir `pickle`.

Los errores de construcción pueden capturarse sin inspeccionar ningún callable:

```python
from orionis.introspection.dependencies.entities.argument import Argument
from orionis.introspection.dependencies.entities.signature import Signature


try:
    Argument(
        name="invalid",
        resolved=False,
        module_name="builtins",
        class_name="int",
        type=None,
        full_class_path="builtins.int",
    )
except ValueError:
    pass
else:
    raise AssertionError("A missing type and default must fail")

try:
    Signature(resolved=[], unresolved={}, ordered={})
except TypeError:
    pass
else:
    raise AssertionError("Signature groups must be dictionaries")
```

## Entidad Signature

`Signature` es una dataclass frozen con argumentos por nombre. Guarda tres diccionarios obligatorios de `Argument`:

```text
Signature(
    *,
    resolved: dict[str, Argument],
    unresolved: dict[str, Argument],
    ordered: dict[str, Argument],
) -> None
```

| Campo | Contenido |
|---|---|
| <a id="signature-field-resolved"></a>`resolved` | Parámetros con default o anotación clasificada como no builtin. |
| <a id="signature-field-unresolved"></a>`unresolved` | Parámetros builtin requeridos o sin anotación/default. |
| <a id="signature-field-ordered"></a>`ordered` | Todos los parámetros conservados en orden de declaración. |

El reflector utiliza las mismas instancias `Argument` en `ordered` y su agrupación correspondiente. Al construir una `Signature` manualmente, el desarrollador proporciona esa coherencia.

<a id="signature-generated-protocols"></a>
### Copias y protocolos generados de Signature

Python genera construcción, representación, comparación, protección de campos frozen y `__replace__`. Una `Signature` ordinaria contiene diccionarios, por lo que no es hashable aunque su dataclass genere `__hash__`. `dataclasses.replace()` y `copy.replace()` crean otra entidad validada, pero comparten los mapas que no se sustituyen; no convierten el resultado en un snapshot inmutable.

```python
import copy
import pickle
from dataclasses import replace
from orionis.introspection.dependencies.entities.signature import Signature


original = Signature(resolved={}, unresolved={}, ordered={})
assert replace(original).ordered is original.ordered
assert copy.replace(original).resolved is original.resolved
assert copy.copy(original).unresolved is original.unresolved
assert copy.deepcopy(original).ordered is not original.ordered
restored = pickle.loads(pickle.dumps(original))
assert restored == original and restored.ordered is not original.ordered
try:
    hash(original)
except TypeError:
    pass
else:
    raise AssertionError("Dictionary-backed signatures are not hashable")
```

<a id="signature-method-post-init"></a>
### Validación de construcción

```text
__post_init__(self) -> None
```

Comprueba que cada agrupación sea un `dict`; de lo contrario lanza `TypeError`. No valida los tipos de cada entrada ni la consistencia entre las agrupaciones. Aunque no se puedan reasignar sus campos, **los diccionarios siguen siendo mutables**. Modificar una firma almacenada en caché afecta a inspecciones posteriores del mismo objetivo: utiliza los métodos de copia cuando necesites editar un mapa.

### Predicados

<a id="signature-method-hasparameters"></a>
**`hasParameters(self) -> bool`** devuelve `bool(ordered)`.

<a id="signature-method-noargumentsrequired"></a>
**`noArgumentsRequired(self) -> bool`** devuelve `not bool(ordered)`. Su nombre no significa «todos tienen default»: devuelve `False` aunque cada parámetro conservado sea opcional.

<a id="signature-method-hasunresolvedarguments"></a>
**`hasUnresolvedArguments(self) -> bool`** devuelve `bool(unresolved)`.

```python
from orionis.introspection import ReflectDependencies


def empty():
    return None


def defaults(limit=25):
    return limit


first = ReflectDependencies(empty).callableSignature()
second = ReflectDependencies(defaults).callableSignature()
assert not first.hasParameters()
assert first.noArgumentsRequired()
assert not first.hasUnresolvedArguments()
assert second.hasParameters()
assert not second.noArgumentsRequired()
assert not second.hasUnresolvedArguments()
```

### Acceso a parámetros

<a id="signature-method-getresolved"></a>
**`getResolved(self) -> dict[str, Argument]`** devuelve el diccionario `resolved` original, sin copiarlo.

<a id="signature-method-getunresolved"></a>
**`getUnresolved(self) -> dict[str, Argument]`** devuelve `unresolved` por identidad.

<a id="signature-method-getallordered"></a>
**`getAllOrdered(self) -> dict[str, Argument]`** devuelve `ordered` por identidad, conservando la declaración.

<a id="signature-method-getpositionalonly"></a>
**`getPositionalOnly(self) -> dict[str, Argument]`** crea un nuevo mapa con `is_keyword_only=False`. Incluye tanto los parámetros estrictamente posicionales como los posicionales o por nombre; no equivale al kind `POSITIONAL_ONLY` de `inspect`.

<a id="signature-method-getkeywordonly"></a>
**`getKeywordOnly(self) -> dict[str, Argument]`** crea un nuevo mapa con `is_keyword_only=True`.

```python
from orionis.introspection import ReflectDependencies


def search(term: str, *, limit=25):
    return term, limit


signature = ReflectDependencies(search).callableSignature()
assert signature.getResolved() is signature.resolved
assert signature.getUnresolved() is signature.unresolved
assert signature.getAllOrdered() is signature.ordered
assert list(signature.getPositionalOnly()) == ["term"]
assert list(signature.getKeywordOnly()) == ["limit"]
assert signature.getKeywordOnly()["limit"] is signature.ordered["limit"]
```

### Copias e iteración

<a id="signature-method-todict"></a>
**`toDict(self) -> dict[str, Argument]`** copia superficialmente `ordered`. Sobrescribe el método de `BaseEntity`: no serializa recursivamente los `Argument` ni produce JSON.

<a id="signature-method-resolvedtodict"></a>
**`resolvedToDict(self) -> dict[str, Argument]`** copia superficialmente `resolved`.

<a id="signature-method-unresolvedtodict"></a>
**`unresolvedToDict(self) -> dict[str, Argument]`** copia superficialmente `unresolved`.

<a id="signature-method-arguments"></a>
**`arguments(self) -> dict_items[str, Argument]`** devuelve la vista viva `ordered.items()`, iterable como pares `(nombre, Argument)` en orden de declaración.

```python
from orionis.introspection import ReflectDependencies


def search(term: str, *, limit=25):
    return term, limit


signature = ReflectDependencies(search).callableSignature()
all_copy = signature.toDict()
resolved_copy = signature.resolvedToDict()
unresolved_copy = signature.unresolvedToDict()
assert all_copy is not signature.ordered
assert resolved_copy is not signature.resolved
assert unresolved_copy is not signature.unresolved
assert all_copy["limit"] is signature.ordered["limit"]
all_copy.pop("term")
assert "term" in signature.ordered
assert [(name, argument.resolved) for name, argument in signature.arguments()] == [
    ("term", False),
    ("limit", True),
]
```

<a id="signature-method-getfields"></a>
### getFields heredado

```text
getFields(self) -> list[dict[str, Any]]
```

Proviene de `BaseEntity`. Describe **los campos de la dataclass `Signature`**, no los parámetros del callable. Cada elemento contiene `name`, `types`, `default` y `metadata`. Para recorrer parámetros utiliza `arguments()`.

```python
from orionis.introspection.dependencies.entities.signature import Signature


signature = Signature(resolved={}, unresolved={}, ordered={})
fields = signature.getFields()
assert [field["name"] for field in fields] == ["resolved", "unresolved", "ordered"]
assert all(set(field) == {"name", "types", "default", "metadata"} for field in fields)
```

## Uso con inyección de dependencias

Estas utilidades no necesitan iniciar la aplicación. `Argument` y `Signature` representan datos que se construyen con valores explícitos. `ReflectDependencies` necesita un objetivo para cada análisis; no se obtiene un objetivo automáticamente al inyectar el contrato.

Si un componente necesita inspección, puede recibir un servicio de aplicación que construya el reflector con el objetivo seleccionado. Este ejemplo combina inyección en el constructor y en un método usando las APIs reales del contenedor:

```python
from orionis.container.container import Container
from orionis.introspection import ReflectDependencies
from orionis.introspection.dependencies.entities.signature import Signature
from orionis.test import TestCase


class SignatureReader:
    def inspect(self, target) -> Signature:
        return ReflectDependencies(target).callableSignature()


class ImportService:
    def __init__(self, reader: SignatureReader):
        self.reader = reader

    def describe(self, reader: SignatureReader, *, target):
        return reader.inspect(target)


def importUsers(source: str, *, batch_size=100):
    return source, batch_size


class SignatureInjectionTest(TestCase):
    async def testConstructorAndMethodInjection(self):
        container = Container()
        service = await container.make(ImportService)
        self.assertIsInstance(service.reader, SignatureReader)
        signature = await container.call(service, "describe", target=importUsers)
        self.assertEqual(list(signature.ordered), ["source", "batch_size"])
```

Guarda este caso en el directorio de [Pruebas](/es/testing) de la aplicación. El contenedor construye `SignatureReader` como dependencia concreta; el reflector solo describe `importUsers`. No se ejecuta esa función durante la inspección.

### Relación con la resolución real

El contenedor prepara planes a partir de estos `Argument`. Al invocar un componente, usa primero los valores explícitos, consulta registros de dependencias y, cuando procede, construye servicios o utiliza defaults. Para un argumento marcado como schema, su flujo de resolución puede obtener el payload de la petición HTTP activa y validarlo; **esa lectura y validación pertenecen al contenedor y al sistema de schemas**, no a `ReflectDependencies`.

El constructor del contenedor dispone además de resolución de algunas referencias locales de clase. Que una referencia permanezca pendiente en este reflector no describe necesariamente el resultado final de todos los caminos de invocación del framework. Tampoco `resolved=True` convierte una unión o cualquier alias de typing en un servicio construible.

Consulta [Schemas y validación](/es/validation) para el uso de schemas en los contextos admitidos y [Aplicación y Contenedor](/es/architecture/service-container) para registros, ámbitos y ejecución de componentes.
