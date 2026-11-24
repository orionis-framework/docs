---
title: "Controladores HTTP"
description: "Genera controladores Resource o Invokable, utiliza --api, registra sus acciones en rutas y recibe parámetros y dependencias."
editUrl: true
lastUpdated: false
---

Un controlador HTTP organiza la lógica de uno o varios endpoints. Cuando el router encuentra una coincidencia y los middleware permiten continuar, Orionis construye el controlador mediante el contenedor, invoca su acción y procesa la respuesta devuelta.

Mantener las acciones en controladores permite que los archivos de rutas se concentren en declarar endpoints y que los servicios se ocupen de la lógica de negocio.

**Resource e Invokable son dos estructuras de controlador. `--api` es una opción independiente que cambia las anotaciones de respuesta; puede utilizarse con cualquiera de las dos.**

## Generar un controlador

Desde la raíz del proyecto, con su entorno Python activo, puedes utilizar el comando directo:

```bash
orionis make:http-controller ExampleController
```

O su alternativa mediante el archivo local `reactor`:

```bash
python -B reactor make:http-controller ExampleController
```

La sintaxis es `make:http-controller name [--invoke] [--api]`:

| Argumento u opción | Obligatorio | Predeterminado | Efecto |
| --- | --- | --- | --- |
| `name` | Sí | Sin valor | Nombre utilizado para construir el archivo y la clase. |
| `--invoke` | No | `False` | Generar únicamente la acción `__call__`, en lugar de las siete acciones Resource. |
| `--api` | No | `False` | Importar `JSONResponse` y utilizarlo en las anotaciones de retorno y docstrings. |

`-h` o `--help` muestran la ayuda. Las opciones `--invoke` y `--api` se pueden combinar.

### Ubicación y normalización de nombres

El destino predeterminado es `app/http/controllers`, obtenido de la ruta de aplicación `app_http_controllers`. Si personalizas esa ruta, el generador utiliza su ubicación configurada.

| `name` | Clase generada | Archivo relativo al proyecto |
| --- | --- | --- |
| `ExampleController` | `ExampleController` | `app/http/controllers/examplecontroller.py` |
| `UserController` | `UserController` | `app/http/controllers/usercontroller.py` |
| `user_controller` o `user` | `UserController` | `app/http/controllers/user_controller.py` |
| `admin/user` | `UserController` | `app/http/controllers/admin/user_controller.py` |

El archivo utiliza minúsculas y añade `_controller` cuando falta el sufijo. La clase se forma a partir de los segmentos separados por `_` y añade `Controller` si falta. **No se insertan guiones bajos entre palabras PascalCase**: `UserController` produce `usercontroller.py`, no `user_controller.py`.

Se admiten subdirectorios con `/` o `\`, normalizados a minúsculas, y una extensión final como `.py`. Los directorios se crean automáticamente. No se admiten rutas absolutas, segmentos `..` ni nombres con guiones.

El generador no sobrescribe archivos existentes y no ofrece `--force`. Las modalidades siguientes son alternativas: usa un nombre distinto para conservar varias o edita el archivo ya generado.

Las acciones generadas contienen únicamente un docstring. Añade una respuesta antes de registrar una acción como endpoint. Una acción vacía devuelve `None` y el núcleo HTTP lanza `TypeError`.

## Resource Controllers

Un Resource Controller reúne acciones relacionadas con un recurso. Resulta útil cuando consultas, formularios, creación, actualización y eliminación pertenecen a la misma entidad.

Es la estructura predeterminada:

```bash
orionis make:http-controller UserController
```

Alternativa local:

```bash
python -B reactor make:http-controller UserController
```

<a id="código-generado"></a>

El `UserController` generado hereda de `orionis.http.base.BaseController` y declara siete métodos asíncronos. Cada uno recibe `self` y lleva la anotación de retorno `HttpResponse`, el alias público de `Response`.

| Acción | Uso habitual |
| --- | --- |
| `index` / `show` | Listar recursos o mostrar uno de ellos. |
| `create` / `store` | Mostrar un formulario de creación o guardar los datos enviados. |
| `edit` / `update` | Mostrar un formulario de edición o actualizar el recurso. |
| `destroy` | Eliminar el recurso. |

Registra cada acción con el método HTTP y la URL que necesite tu aplicación. Añade los identificadores, los esquemas o los servicios inyectados a la firma del método correspondiente.

### Implementar acciones y registrarlas en rutas

Para probar dos acciones de lectura, sustituye el archivo del ejemplo por esta implementación mínima:

```python
from orionis.http import HttpResponse, response
from orionis.http.base import BaseController


class UserController(BaseController):
    async def index(self) -> HttpResponse:
        return response.json({"users": []})

    async def show(self, user_id: int) -> HttpResponse:
        return response.json({"id": user_id})
```

En el archivo registrado como API, normalmente `routes/api.py`:

```python
from app.http.controllers.usercontroller import UserController
from orionis.support.facades import Route

Route.get("/users", [UserController, "index"])
Route.get("/users/{user_id:int}", [UserController, "show"])
```

`GET /users` devuelve `{"users": []}`; `GET /users/42` devuelve `{"id": 42}`. La segunda acción añade `user_id` a la firma para recibir el parámetro de su ruta.

La pareja `[Clase, "acción"]` identifica el método sin ejecutarlo. También se admite una tupla. Pasa la clase, sin instanciarla.

**No hay registro automático de rutas Resource.** El generador no asocia verbos HTTP a las acciones: en este ejemplo elegimos GET para ambas lecturas. Declara las demás rutas explícitamente con los métodos HTTP que corresponda a tus acciones implementadas. Consulta [Rutas](/es/http/routing).

## Invokable Controllers

Un Invokable Controller concentra una operación en `__call__`. Es útil para un endpoint con una responsabilidad concreta, sin reunir varias acciones en la misma clase.

```bash
orionis make:http-controller UserController --invoke
```

Alternativa local:

```bash
python -B reactor make:http-controller UserController --invoke
```

<a id="código-generado-1"></a>

Con `--invoke`, la clase generada declara `async def __call__(self) -> HttpResponse`. Añade a esa firma los parámetros de ruta o las dependencias que quieras inyectar.

### Implementar y registrar la acción única

Sustituye el esqueleto por una implementación que devuelva una respuesta:

```python
from orionis.http import HttpResponse, response
from orionis.http.base import BaseController


class UserController(BaseController):
    async def __call__(self) -> HttpResponse:
        return response.text("User endpoint ready")
```

En el archivo de rutas:

```python
from app.http.controllers.usercontroller import UserController
from orionis.support.facades import Route

Route.get("/user-summary", UserController)
```

`GET /user-summary` ejecuta `__call__()` y devuelve el texto con estado `200`. También se admite `[UserController, "__call__"]`, aunque la clase directa expresa la misma intención de forma breve. El router no acepta una instancia ni un método ligado como acción.

## Controladores con --api

<a id="resource-controller-para-api"></a>

`--api` cambia la importación de `HttpResponse` por `JSONResponse`, las anotaciones de retorno y el tipo mencionado en las docstrings. No añade código de respuesta, serialización, rutas ni persistencia.

La estructura sigue dependiendo de `--invoke`: sin esa opción conserva las siete acciones Resource, incluidas `create` y `edit`; con ella genera sólo `__call__`.

<a id="invokable-controller-para-api"></a>

Por ejemplo, genera un controlador de API para un único endpoint de estado:

```bash
orionis make:http-controller status --invoke --api
```

Implementa la acción generada en `app/http/controllers/status_controller.py`:

```python
from orionis.http import JSONResponse, response
from orionis.http.base import BaseController


class StatusController(BaseController):
    async def __call__(self) -> JSONResponse:
        return response.json({"status": "ready"})
```

Regístralo en `routes/api.py`:

```python
from app.http.controllers.status_controller import StatusController
from orionis.support.facades import Route

Route.get("/status", StatusController)
```

### Anotaciones, respuestas y contexto API

Una anotación `JSONResponse` no convierte por sí sola el valor retornado. Los ejemplos construyen la respuesta mediante `response.json(...)`.

Por separado, el kernel admite resultados `dict` o `msgspec.Struct` y los convierte en `JSONResponse` con estado `200`, independientemente de `--api` y de la anotación. No convierte cualquier tipo de valor: una respuesta textual debe construirse, por ejemplo, con `response.text(...)`. Consulta [Respuestas HTTP](/es/http/responses).

El contexto API o WEB procede de la configuración de `app.withRouting(...)`, no de `--api`, del nombre del controlador ni de su anotación. Un controlador sin `--api` también puede devolver JSON, como en el primer ejemplo Resource. Consulta la [separación de rutas API y WEB](/es/http/routing#separar-rutas-api-y-web).

## Comparación de modalidades

La columna de argumentos se añade a `orionis make:http-controller` o a `python -B reactor make:http-controller`. El tipo indicado es el esperado al implementar la acción, no una respuesta ya creada por el esqueleto.

| Estructura | Argumentos | Acciones generadas | Retorno anotado | Uso habitual | Registro en ruta |
| --- | --- | --- | --- | --- | --- |
| Resource | `UserController` | Las siete acciones de recurso. | `HttpResponse` | Varias operaciones del mismo recurso. | `[UserController, "index"]` |
| Invokable | `UserController --invoke` | `__call__` | `HttpResponse` | Una operación concreta. | `UserController` |
| Resource con API | `UserController --api` | Las mismas siete acciones. | `JSONResponse` | Varias operaciones con respuestas JSON. | `[UserController, "index"]` |
| Invokable con API | `UserController --invoke --api` | `__call__` | `JSONResponse` | Una operación con respuesta JSON. | `UserController` |

## Parámetros e inyección de dependencias

Al atender una ruta, Orionis construye la clase del controlador y resuelve las dependencias anotadas de su constructor. Después invoca la acción, aportando los parámetros de ruta por nombre y resolviendo sus dependencias restantes. La preparación de metadatos durante el arranque no ejecuta el constructor ni las acciones ordinarias.

Este ejemplo utiliza dos servicios concretos sin dependencias, que el contenedor puede construir automáticamente. Guarda `app/services/user_label_service.py`:

```python
import logging


class UserLabelService:
    def label(self, user_id: int) -> str:
        return f"User {user_id}"


class UserAuditService:
    def recordView(self, user_id: int, path: str) -> None:
        logging.getLogger(__name__).info("Viewing user %s at %s", user_id, path)
```

En `app/http/controllers/show_user_controller.py`:

```python
from app.services.user_label_service import UserAuditService, UserLabelService
from orionis.http import JSONResponse, Request, response
from orionis.http.base import BaseController


class ShowUserController(BaseController):
    def __init__(self, labels: UserLabelService) -> None:
        self.labels = labels

    async def __call__(
        self,
        request: Request,
        user_id: int,
        audit: UserAuditService,
    ) -> JSONResponse:
        audit.recordView(user_id, request.path)
        return response.json({
            "id": user_id,
            "label": self.labels.label(user_id),
            "path": request.path,
        })
```

Registra la clase en `routes/api.py`, sustituyendo la declaración equivalente si ya utilizas ese path:

```python
from app.http.controllers.show_user_controller import ShowUserController
from orionis.support.facades import Route

Route.get("/users/{user_id:int}", ShowUserController)
```

`GET /users/42` devuelve `{"id": 42, "label": "User 42", "path": "/users/42"}`.

- `labels: UserLabelService` permite construir e inyectar el servicio en el constructor. Los servicios abstractos o contratos necesitan su binding correspondiente.
- `audit: UserAuditService` se resuelve al invocar esta acción. El cliente no lo envía en la URL ni en el payload: es una dependencia del servidor.
- `request: Request` obtiene la petición actual registrada en el scope HTTP; no debes construirla manualmente.
- `user_id` llega como entero por el convertidor `{user_id:int}`. Debes aceptar ese nombre en la acción, también cuando recibes `Request`.
- Las anotaciones identifican dependencias, pero el convertidor declarado en la ruta determina cómo se convierte el segmento. Añadir `: int` sólo en la firma no cambia el patrón de ruta.
- `Response` es el resultado que devuelve la acción; no es una respuesta precreada que el controlador reciba automáticamente.

Usa el constructor para servicios utilizados por varias acciones de la clase y los parámetros de método para servicios que sólo necesita una acción. Este mecanismo también se aplica a acciones Resource: si renombras `__call__` como `show`, registra `[ShowUserController, "show"]`. El constructor se resuelve primero y después los argumentos de la acción; los valores de ruta se proporcionan a la acción, no al constructor.

El ejemplo no necesita bindings porque ambos servicios son concretos y autoconstruibles. Si necesitas compartir la misma instancia entre resoluciones, configura su [ciclo de vida](/es/application/container/bindings-and-invocation). La inyección ocurre cuando Orionis construye e invoca el controlador; una llamada Python directa como `controller.show(...)` requiere que proporciones tú sus argumentos.

## Organización y consideraciones

Agrupa los controladores en `app/http/controllers` por responsabilidad o dominio cuando el proyecto crezca; por ejemplo, `admin/user` permite generar una clase dentro de `admin`. Utiliza nombres consistentes, Resource para acciones de un recurso e Invokable para operaciones concretas. Son recomendaciones de organización, no restricciones del router.

Mantén la coordinación HTTP en el controlador y delega la lógica de negocio a servicios. La clase base no realiza operaciones de base de datos ni implementa automáticamente las acciones generadas.

Los [middleware](/es/http/middleware) se ejecutan antes de la invocación y pueden impedir que ésta ocurra. Si una acción falla, las capas HTTP y el kernel delegan su tratamiento al sistema de [Excepciones](/es/http/exceptions). Para formatos, encabezados, cookies o descargas consulta [Respuestas](/es/http/responses).
