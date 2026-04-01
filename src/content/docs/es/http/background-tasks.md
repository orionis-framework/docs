---
title: Background Tasks
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Background Tasks

Las clases `BackgroundTask` y `BackgroundTasks` proporcionan un mecanismo simple para diferir trabajo que debe ejecutarse **después** de que se ha enviado una respuesta al cliente. Los casos de uso típicos incluyen enviar correos electrónicos, escribir registros de auditoría, enviar eventos de analítica, o cualquier operación que no necesite bloquear la respuesta.

Se soportan tanto funciones síncronas como asíncronas. Las funciones síncronas se descargan automáticamente a un thread-pool executor para que nunca bloqueen el event loop.

## Importación

```python
from orionis.support.background.task import BackgroundTask
from orionis.support.background.tasks import BackgroundTasks
```

---

## BackgroundTask

`BackgroundTask` envuelve un solo callable — síncrono o asíncrono — junto con sus argumentos. Cuando se espera (await), ejecuta el callable con los argumentos capturados.

### Crear una Tarea

Pase el callable y sus argumentos al constructor:

```python
# Función síncrona
def send_email(to: str, subject: str):
    ...

task = BackgroundTask(send_email, "user@example.com", subject="Welcome")

# Función asíncrona
async def notify(channel: str, message: str):
    ...

task = BackgroundTask(notify, "general", message="Deployed!")
```

### Ejecutar una Tarea

Espere la instancia directamente o llame a su método `run()` — ambos son equivalentes:

```python
await task()
# o
await task.run()
```

- Las **funciones async** se esperan directamente.
- Las **funciones sync** se ejecutan en un thread-pool executor mediante `loop.run_in_executor`, asegurando que no bloqueen el event loop.

### Ejemplo Práctico

```python
from orionis.support.background.task import BackgroundTask

results = []

def log_access(path: str):
    results.append(f"accessed {path}")

task = BackgroundTask(log_access, "/api/users")
await task()
# results == ["accessed /api/users"]
```

---

## BackgroundTasks

`BackgroundTasks` gestiona una colección ordenada de tareas y las ejecuta **secuencialmente** cuando se invoca. Extiende `BackgroundTask`, por lo que puede usarse en cualquier lugar donde se espere una tarea única.

### Crear la Colección

Cree una colección vacía, o pase instancias existentes de `BackgroundTask`:

```python
# Vacía — agregar tareas después
tasks = BackgroundTasks()

# Pre-poblada
tasks = BackgroundTasks([
    BackgroundTask(send_email, "a@example.com", subject="Hi"),
    BackgroundTask(send_email, "b@example.com", subject="Hi"),
])
```

### Agregar Tareas

Use `addTask` para añadir una nueva tarea. Acepta la misma firma que el constructor de `BackgroundTask` — un callable seguido de sus argumentos:

```python
tasks = BackgroundTasks()

tasks.addTask(send_email, "user@example.com", subject="Welcome")
tasks.addTask(notify, "general", message="New signup")
tasks.addTask(lambda: print("done"))
```

Puede seguir agregando tareas después de la inicialización, incluso a una colección pre-poblada:

```python
tasks = BackgroundTasks([BackgroundTask(send_email, "a@example.com")])
tasks.addTask(send_email, "b@example.com")
```

### Ejecutar Todas las Tareas

Espere la colección o llame a `run()` — ambos ejecutan cada tarea en orden de inserción:

```python
await tasks()
# o
await tasks.run()
```

Las tareas se ejecutan una a la vez en el orden en que fueron agregadas. Se pueden mezclar libremente callables sync y async dentro de la misma colección.

### Ejemplo Práctico

```python
from orionis.support.background.task import BackgroundTask
from orionis.support.background.tasks import BackgroundTasks

results = []

async def audit(action: str):
    results.append(action)

def log(message: str):
    results.append(message)

tasks = BackgroundTasks()
tasks.addTask(audit, "user.created")
tasks.addTask(log, "email.sent")
tasks.addTask(audit, "webhook.fired")

await tasks()
# results == ["user.created", "email.sent", "webhook.fired"]
```

---

## Manejo Sync vs Async

La estrategia de ejecución se elige automáticamente según el tipo de callable:

| Tipo de callable | Método de ejecución |
|---|---|
| `async def` (función coroutine) | Se espera directamente |
| `def` regular / `lambda` | Se descarga a `run_in_executor` (thread pool) |

Esto es transparente para quien llama — siempre se usa `await` en la tarea sin importar si la función subyacente es sync o async.

---

## Referencia de Métodos

### BackgroundTask

| Método | Firma | Descripción |
|---|---|---|
| `__init__` | `BackgroundTask(func, *args, **kwargs)` | Envuelve un callable con sus argumentos |
| `__call__` | `await task()` | Ejecuta el callable |
| `run` | `await task.run()` | Alias de `__call__` |

### BackgroundTasks

| Método | Firma | Descripción |
|---|---|---|
| `__init__` | `BackgroundTasks(tasks?)` | Crea la colección, opcionalmente pre-poblada |
| `addTask` | `addTask(func, *args, **kwargs)` | Añade una nueva tarea a la colección |
| `__call__` | `await tasks()` | Ejecuta todas las tareas secuencialmente |
| `run` | `await tasks.run()` | Alias de `__call__` |
