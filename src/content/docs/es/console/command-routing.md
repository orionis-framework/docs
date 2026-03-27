---
title: Rutas de Comandos
---

## Rutas de Comandos

Orionis Framework permite registrar comandos de consola como rutas hacia clases y
métodos de tu aplicación. En lugar de crear una clase de comando completa para
cada caso, puedes exponer lógica existente mediante una firma de comando.

Este enfoque es útil cuando:

- Ya tienes servicios con lógica reutilizable.
- Quieres evitar boilerplate para tareas simples.
- Necesitas exponer acciones internas en la CLI de forma rápida y ordenada.

## ¿Qué es el enrutamiento de comandos?

El enrutamiento de comandos consiste en mapear una firma de consola (por ejemplo,
`app:test`) a un destino ejecutable dentro de tu aplicación.

En Orionis Framework, ese destino puede definirse principalmente de dos formas:

- Clase + método específico.
- Clase invocable por `__call__`.

Ambas opciones se registran con `Reactor.command(...)`, y pueden enriquecerse con
opciones como descripción, timestamp y argumentos.

## Ventajas de usar rutas de comandos

- Reduce código repetitivo cuando no necesitas una clase de comando dedicada.
- Permite reutilizar servicios existentes sin duplicar lógica.
- Facilita el mantenimiento al centralizar el comportamiento en tu capa de dominio.
- Acelera la creación de tareas operativas o administrativas.

## Dónde se definen las rutas

En el esqueleto estándar de Orionis Framework, las rutas de consola se definen en:

`routes\console.py`

Ese archivo actúa como punto de registro de firmas y destinos.

## Estructura general de `Reactor.command`

La forma conceptual es:

```python
Reactor.command("firma:comando", destino)...
```

Donde:

- `"firma:comando"` es la firma que ejecutarás desde terminal.
- `destino` es la clase o la combinación clase+método que se ejecutará.

Después del registro, puedes encadenar configuración:

- `.description("...")`
- `.timestamp()`
- `.arguments([...])`

## Registro como ruta de clase + método

Esta variante se usa cuando quieres exponer un método concreto de una clase.

### Ejemplo de registro

```python
from app.services.welcome_service import WelcomeService
from orionis.console.args.argument import Argument
from orionis.support.facades.reactor import Reactor

Reactor.command("app:test", [WelcomeService, "greetUser"])\
    .description("Comando de prueba definido como ruta")\
    .timestamp()\
    .arguments([
        Argument(name_or_flags=["--name", "-n"], type_=str, required=True),
    ])
```

### Qué está ocurriendo

- Se crea una firma de comando llamada `app:test`.
- Esa firma apunta al método `greetUser` de la clase `WelcomeService`.
- Se agrega una descripción visible en `reactor list`.
- Se habilita timestamp en la salida del comando.
- Se define el argumento `--name` como obligatorio.

### Firma esperada del método destino

```python
class WelcomeService:
    def greetUser(self, name: str) -> None:
        # lógica del método
        ...
```

### Ejecución desde terminal

```bash
python -B reactor app:test --name="Orionis"
```

## Registro como ruta de clase invocable (`__call__`)

Esta variante se usa cuando tu clase define `__call__` como punto de entrada.

### Ejemplo de registro

```python
from app.services.welcome_service import WelcomeService
from orionis.console.args.argument import Argument
from orionis.support.facades.reactor import Reactor

Reactor.command("app:test", WelcomeService)\
    .description("Comando de prueba con clase invocable")\
    .timestamp()\
    .arguments([
        Argument(name_or_flags=["--name", "-n"], type_=str, required=False),
    ])
```

### Clase destino esperada

```python
class WelcomeService:
    def __call__(self, name: str = "User") -> None:
        # lógica del método
        ...
```

### Comportamiento

- Si envías `--name`, ese valor se inyecta en `__call__`.
- Si no lo envías, se usa el valor por defecto (`"User"`).

### Ejecución desde terminal

Con parámetro:

```bash
python -B reactor app:test --name="Ana"
```

Sin parámetro:

```bash
python -B reactor app:test
```

## Diferencias entre ambos enfoques

| Enfoque | Úsalo cuando | Ventaja principal |
|---------|---------------|-------------------|
| Clase + método | Quieres exponer una acción puntual de una clase | Mayor precisión sobre el punto de entrada |
| Clase invocable (`__call__`) | La clase representa una acción única | Registro más corto y limpio |

## Recomendaciones de diseño

- Mantén firmas descriptivas (`modulo:accion`), por ejemplo `user:sync`.
- Evita rutas que apunten a lógica muy acoplada a infraestructura.
- Prioriza servicios de dominio con responsabilidades claras.
- Define argumentos explícitos para mejorar la experiencia en CLI.
- Agrega `description(...)` siempre para facilitar descubrimiento en `reactor list`.

## Ejemplo completo recomendado

```python
from app.services.user_sync_service import UserSyncService
from orionis.console.args.argument import Argument
from orionis.support.facades.reactor import Reactor

Reactor.command("user:sync", [UserSyncService, "run"])\
    .description("Sincroniza usuarios con el proveedor externo")\
    .timestamp()\
    .arguments([
        Argument(name_or_flags=["--source"], type_=str, required=True),
        Argument(name_or_flags=["--dry-run"], action="store_true", required=False),
    ])
```

Posible firma destino:

```python
class UserSyncService:
    def run(self, source: str, dry_run: bool = False) -> None:
        # lógica de sincronización
        ...
```

Ejemplo de ejecución:

```bash
python -B reactor user:sync --source="crm" --dry-run
```

## Errores frecuentes y cómo evitarlos

### La firma no aparece en `reactor list`

- Verifica que la ruta esté registrada en `routes\console.py`.
- Revisa que no existan errores de importación en el archivo de rutas.
- Confirma que estás ejecutando el proyecto en el entorno de Python correcto.
- Ejecuta `python -B reactor optimize:clear` para limpiar bytecode obsoleto.

### El método no recibe argumentos

- Verifica que el nombre del argumento coincida con el parámetro esperado.
- Comprueba tipos (`type_`) y obligatoriedad (`required`) al declarar `Argument`.
- Asegura que el valor se esté enviando correctamente en la CLI.

### Error al resolver la clase destino

- Confirma que la clase sea importable desde `routes\console.py`.
- Revisa dependencias o inicialización requerida por la clase.
- Si usas DI, valida que el contenedor pueda resolver el servicio.

## Buenas prácticas operativas

- Usa `python -B reactor list` tras registrar una nueva ruta para validarla.
- Conserva el archivo de rutas legible, agrupando comandos por módulo.
- Evita registrar comandos con firmas ambiguas o demasiado genéricas.
- Documenta en el equipo qué firmas son internas y cuáles son de uso habitual.

## Cierre

Las rutas de comandos en Orionis Framework permiten exponer lógica de aplicación
de forma rápida, mantenible y sin código boilerplate innecesario. Elegir entre
`[Clase, "método"]` o `Clase` invocable depende del caso de uso, pero en ambos
escenarios el objetivo es el mismo: convertir tu lógica de negocio en acciones de
consola claras, reutilizables y fáciles de operar.