---
title: Comandos Personalizados
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Comandos Personalizados en Orionis Framework

Orionis Framework permite extender la consola con comandos definidos por la
aplicación. Estos comandos conviven con los nativos del framework y pueden
descubrirse desde la propia CLI mediante `reactor list`, sin pasos manuales de
registro en el flujo habitual de desarrollo.

Esta guía cubre:

- Por qué y cuándo conviene crear comandos personalizados.
- Cómo generarlos con `make:command`.
- Cómo estructurar sus propiedades, argumentos y lógica de negocio.
- Cómo inyectar dependencias y emitir salida en consola.
- Buenas prácticas y solución de problemas frecuentes.

## ¿Por qué crear comandos personalizados?

Los comandos nativos del framework cubren tareas operativas generales. Sin embargo,
en proyectos con reglas de negocio reales aparecen tareas recurrentes que conviene
formalizar como comandos propios, por ejemplo:

- Limpieza de caché de dominio.
- Sincronización de datos con servicios externos.
- Generación de reportes programados.
- Carga semilla de datos en desarrollo.
- Validaciones o auditorías sobre el estado del sistema.

Modelar estas operaciones como comandos hace que sean reproducibles, auditables y
fáciles de invocar tanto por desarrolladores como por procesos automatizados de CI/CD.

## Generación con `make:command`

El comando nativo `make:command` genera la estructura base de un nuevo comando,
incluyendo la clase, sus propiedades principales y el método `handle` listo para
implementar la lógica.

**Sintaxis**

```bash
python -B reactor make:command <name> [--signature="..."] [--description="..."]
```

**Parámetros aceptados**

- `name`: Nombre del archivo y clase a generar, en formato `snake_case`.
- `--signature`: Firma con la que se invocará el comando desde la terminal.
- `--description`: Texto descriptivo que aparecerá al ejecutar `reactor list`.

**Ejemplo de uso**

```bash
python -B reactor make:command clean_cache --signature="cache:clean" --description="Limpia cache de aplicacion"
```

Este comando genera el archivo `app/console/commands/clean_cache_command.py`, listo
para que implementes la lógica específica.

**Convención de nomenclatura**

| Elemento | Formato esperado | Ejemplo |
|----------|-----------------|---------|
| `name` (argumento CLI) | `snake_case` | `clean_cache` |
| Clase generada | `PascalCase` + `Command` | `CleanCacheCommand` |
| `--signature` | `modulo:accion` | `cache:clean` |

Usar un prefijo de módulo en la firma (`cache:`, `user:`, `report:`) facilita la
clasificación de comandos a medida que el proyecto crece.

## Estructura de un comando personalizado

La plantilla generada a partir del ejemplo anterior es equivalente a:

```python
from orionis.console.args.argument import Argument
from orionis.console.base.command import BaseCommand

class CleanCacheCommand(BaseCommand):

    # Firma que se usará en la terminal para invocar el comando
    signature: str = "cache:clean"

    # Descripción visible en `reactor list`
    description: str = "Limpia cache de aplicacion"

    # Argumentos y opciones que el comando acepta
    arguments: list[Argument] = []

    async def handle(self) -> None:
        # TODO: Implementar lógica del comando
        ...
```

**Propiedades principales**

- `signature`: Cadena de texto que define cómo se invocará el comando. Debe ser
  única en el proyecto.
- `description`: Texto breve que describe el propósito del comando. Se muestra
  en `reactor list` y ayuda a otros desarrolladores a entender su función.
- `arguments`: Lista de instancias de `Argument` que declaran los parámetros que
  el comando acepta al invocarse. Puede estar vacía si el comando no requiere
  parámetros de entrada.

## Definición de argumentos

Los argumentos del comando se declaran como instancias de `Argument` dentro de la
propiedad `arguments`. Cada definición establece el nombre o flags del argumento,
su tipo, obligatoriedad, valor por defecto y texto de ayuda.

**Ejemplo con múltiples argumentos**

```python
from typing import ClassVar
from orionis.console.args.argument import Argument
from orionis.console.base.command import BaseCommand

class ServeCommand(BaseCommand):

    signature: str = "app:serve"
    description: str = "Inicia el servidor de la aplicacion"

    arguments: ClassVar[list[Argument]] = [
        Argument(
            name_or_flags=["--interface", "-i"],
            type_=str,
            help="Tipo de interfaz: ASGI o RSGI.",
            choices=["rsgi", "asgi"],
            dest="interface",
            required=False,
        ),
        Argument(
            name_or_flags=["--port", "-p"],
            type_=int,
            help="Puerto en el que escuchará el servidor.",
            dest="port",
            required=False,
        ),
        Argument(
            name_or_flags=["--log"],
            type_=bool,
            help="Activa logs detallados del servidor.",
            action="store_true",
            dest="log_enabled",
            default=False,
            required=False,
        ),
    ]

    async def handle(self) -> None:
        interface = self.getArgument("interface", default="rsgi")
        port = self.getArgument("port", default=8000)
        log = self.getArgument("log_enabled", default=False)
        self.info(f"Servidor iniciando en {interface}:{port} (log={log})")
```

## Referencia de la entidad `Argument`

**Firma del constructor**

```python
class Argument(
    *,
    name_or_flags: str | Iterable[str],
    action: str | ArgumentAction | None = None,
    nargs: int | str | None = None,
    const: Any = MISSING,
    default: Any = MISSING,
    type_: Callable[[str], Any] | None = None,
    choices: Iterable[Any] | None = None,
    required: bool = False,
    help: str | None = None,
    metavar: str | tuple[str, ...] | None = None,
    dest: str | None = None,
    version: str | None = None,
    extra: dict[str, Any] = dict,
)
```

**Parámetros de configuración**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `name_or_flags` | `str \| Iterable[str]` | Nombre o flags del argumento, p. ej. `["--file", "-f"]`. |
| `action` | `str \| None` | Acción al encontrar el argumento (`store_true`, `store_const`, etc.). |
| `nargs` | `int \| str \| None` | Cantidad de valores a consumir (`?`, `*`, `+` o un entero). |
| `const` | `Any` | Valor constante usado con acciones como `store_const`. |
| `default` | `Any` | Valor por defecto cuando el argumento no se proporciona. |
| `type_` | `Callable` | Función para convertir el valor recibido al tipo esperado. |
| `choices` | `Iterable` | Conjunto de valores válidos para el argumento. |
| `required` | `bool` | Indica si el argumento es obligatorio. |
| `help` | `str \| None` | Texto de ayuda que se muestra en la consola. |
| `metavar` | `str \| None` | Nombre del argumento en los mensajes de ayuda. |
| `dest` | `str \| None` | Nombre del atributo donde se almacena el valor parseado. |
| `version` | `str \| None` | Cadena de versión, usada con `action="version"`. |
| `extra` | `dict` | Parámetros adicionales enviados a `add_argument` de argparse. |

## Acceso a argumentos en el método `handle`

Dentro del método `handle` puedes leer los valores recibidos con los siguientes métodos:

**Obtener un argumento individual**

```python
# Retorna el valor del argumento o None si no se proporcionó
valor = self.getArgument('name')

# Retorna el valor del argumento o el default indicado si no se proporcionó
valor = self.getArgument('key', default='valor_por_defecto')
```

**Obtener todos los argumentos**

```python
# Retorna un diccionario con todos los argumentos y sus valores
todos = self.getArguments()
```

**Ejemplo de uso combinado**

```python
async def handle(self) -> None:
    args = self.getArguments()
    self.info(f"Argumentos recibidos: {args}")

    modo = self.getArgument("mode", default="produccion")
    self.success(f"Ejecutando en modo: {modo}")
```

## Método `handle`: lógica del comando

El método `handle` es el punto de entrada de la ejecución del comando. Está
definido como `async`, por lo que puede coordinar operaciones de I/O no bloqueantes
cuando el caso de uso lo requiera.

Dentro de `handle` puedes orquestar operaciones de negocio como consultas a base
de datos, invocación de servicios, generación de archivos o envío de notificaciones.

**Inyección de dependencias**

Orionis Framework soporta inyección de dependencias directamente en el método
`handle`. Basta con declarar el tipo del servicio como parámetro y el contenedor
lo resolverá automáticamente:

```python
from app.services.cache_service import CacheService

async def handle(self, cache: CacheService) -> None:
    await cache.flush()
    self.success("Cache limpiada correctamente.")
```

**Uso del constructor**

También puedes inicializar dependencias o estado en el constructor de la clase,
lo que resulta familiar si vienes de otros frameworks:

```python
from app.services.cache_service import CacheService

def __init__(self, cache: CacheService):
    super().__init__()
    self._cache = cache
```

La recomendación general es mantener `handle` como coordinador del caso de uso y
delegar la lógica compleja a servicios especializados.

## API de salidas de consola

`BaseCommand` hereda de la clase `Console`, que concentra las utilidades de salida,
entrada interactiva, depuración y renderizado en terminal. Esta API no se limita a
mostrar mensajes decorativos: también define cómo el comando informa progreso,
reporta fallos, solicita confirmaciones y finaliza su ejecución.

### Mensajes con fondo de color

Estos métodos imprimen una etiqueta con fondo de color, seguida del mensaje. Por
defecto agregan una marca de tiempo generada con `LocalDateTime.now()` y formateada
como `YYYY-MM-DD HH:MM:SS`.

| Método | Etiqueta impresa | Estilo | Uso recomendado |
|--------|------------------|--------|-----------------|
| `self.success(message, *, timestamp=True)` | `SUCCESS` | Fondo verde y texto blanco | Confirmar que una operación terminó correctamente. |
| `self.info(message, *, timestamp=True)` | `INFO` | Fondo azul y texto blanco | Informar progreso, contexto o pasos intermedios. |
| `self.warning(message, *, timestamp=True)` | `WARNING` | Fondo amarillo y texto blanco | Advertir sobre una situación anómala que no bloquea el flujo. |
| `self.fail(message, *, timestamp=True)` | `FAIL` | Fondo rojo y texto blanco | Indicar un resultado fallido o no satisfactorio dentro de un flujo aún controlado. |
| `self.error(message, *, timestamp=True)` | `ERROR` | Fondo rojo y texto blanco | Reportar un error real que normalmente precede a una excepción o a una salida fallida. |

El parámetro `timestamp` controla si se imprime la fecha y hora antes del mensaje.
Úsalo en `False` cuando quieras una salida más limpia o cuando el tiempo no aporte
valor al contexto.

### Diferencia correcta entre `fail` y `error`

Esta es la parte que más suele documentarse mal. Aunque ambos métodos usan fondo
rojo, no significan exactamente lo mismo:

- `fail(...)` comunica que una operación falló o que el resultado no fue el esperado,
  pero no obliga necesariamente a interrumpir la ejecución.
- `error(...)` comunica un error de ejecución más fuerte, normalmente asociado a una
  excepción, una cancelación del flujo o una salida con código de error.

Ejemplo práctico:

```python
async def handle(self) -> None:
    profile = await self.profileService.findById(10)

    if profile is None:
        self.fail("No se encontró el perfil solicitado.")
        return

    if not profile.is_valid:
        self.error("El perfil existe, pero no cumple las condiciones requeridas.")
        raise ValueError("Perfil inválido")

    self.success("Perfil validado correctamente.")
```

**Ejemplo de uso básico**

```python
async def handle(self) -> None:
    self.info("Iniciando proceso de limpieza...")

    try:
        # lógica de negocio
        self.success("Cache eliminada correctamente.")
    except Exception as exc:
        self.error(f"No se pudo completar la operación: {exc}")
        raise
```

### Mensajes de solo texto con color

Estos métodos imprimen únicamente el texto coloreado. No incluyen etiqueta ni
timestamp. Son adecuados para complementar la salida principal del comando.

**Variantes disponibles**

| Método | Color | Variante |
|--------|-------|----------|
| `self.textSuccess(message)` | Verde | Texto normal |
| `self.textSuccessBold(message)` | Verde | Texto en negrita |
| `self.textInfo(message)` | Azul | Texto normal |
| `self.textInfoBold(message)` | Azul | Texto en negrita |
| `self.textWarning(message)` | Amarillo | Texto normal |
| `self.textWarningBold(message)` | Amarillo | Texto en negrita |
| `self.textError(message)` | Rojo | Texto normal |
| `self.textErrorBold(message)` | Rojo | Texto en negrita |
| `self.textMuted(message)` | Gris | Texto normal |
| `self.textMutedBold(message)` | Gris | Texto en negrita |
| `self.textUnderline(message)` | Estilo de subrayado | Texto subrayado |

No existe un método `textFail(...)`. Si necesitas expresar un fallo con semántica
propia del framework, debes usar `fail(...)` o `error(...)` según la intención.

**Ejemplo de texto auxiliar**

```python
async def handle(self) -> None:
    self.textMuted("Leyendo configuración...")
    self.textInfoBold("Conexión establecida.")
    self.textSuccessBold("Proceso finalizado.")
```

### Control de espaciado y pantalla

Estos métodos ayudan a estructurar visualmente la salida en terminal.

| Método | Comportamiento real |
|--------|----------------------|
| `self.line()` | Imprime una línea en blanco. No dibuja una línea horizontal. |
| `self.newLine(count=1)` | Imprime `count` saltos de línea. Lanza `ValueError` si `count <= 0`. |
| `self.clearLine()` | Borra el contenido de la línea actual usando `\r \r`. |
| `self.clear()` | Limpia la pantalla completa con `cls` en Windows o `clear` en Unix. |
| `self.writeLine(message)` | Imprime un mensaje simple con salto de línea. |
| `self.write(*values, sep, end, file, flush)` | Funciona como `print(...)` y permite más control sobre la salida. |

**Cuándo usar `line`, `newLine`, `write` y `writeLine`**

- Usa `line()` cuando solo quieras separar bloques visualmente con una línea en blanco.
- Usa `newLine(count)` cuando necesites más de un salto de línea consecutivo.
- Usa `writeLine(...)` para imprimir una línea simple sin color ni formato especial.
- Usa `write(...)` cuando necesites controlar `sep`, `end`, `flush` o el stream de salida.

**Ejemplo de espaciado***

```python
async def handle(self) -> None:
    self.info("Paso 1 completado.")
    self.line()
    self.textMuted("Preparando paso 2...")
    self.newLine(2)
    self.writeLine("Resultado: OK")
```

### Renderizado de tablas

El método `table(...)` imprime una tabla con bordes Unicode, encabezados en negrita
y ancho de columnas calculado dinámicamente a partir del contenido.

```python
self.table(
    headers=["ID", "Nombre", "Estado"],
    rows=[
        [1, "Tarea Alpha", "Activa"],
        [2, "Tarea Beta", "Pendiente"],
        [3, "Tarea Gamma", "Completada"],
    ],
)
```

Lanza `ValueError` si `headers` o `rows` están vacíos. Es especialmente útil para
mostrar listados, resultados de consultas, comparaciones o salidas administrativas.

### Barra de progreso

La propiedad `progressBar` devuelve una nueva instancia de `ProgressBar` cada vez
que se accede a ella.

```python
bar = self.progressBar
bar.start(total=100)
for _ in range(100):
    # proceso
    bar.advance()
bar.finish()
```

Esto resulta útil en operaciones largas como importaciones, migraciones, sincronías
o procesamiento por lotes.

### Impresión de excepciones

El método `exception(...)` usa `rich.traceback.Traceback` para renderizar la traza
de una excepción con formato enriquecido.

```python
try:
    operacion_riesgosa()
except Exception as exc:
    self.exception(exc)
    raise
```

Lanza `TypeError` si el argumento recibido no es una instancia de `Exception`.
Es útil cuando necesitas mostrar una traza legible sin depender del formato por
defecto del intérprete.

### Salida con código de estado

Estos métodos terminan explícitamente el proceso:

| Método | Código de salida | Comportamiento |
|--------|------------------|----------------|
| `self.exitSuccess(message=None)` | `0` | Imprime un mensaje de éxito opcional y finaliza correctamente. |
| `self.exitError(message=None)` | `1` | Imprime un mensaje de error opcional y finaliza con error. |

Son útiles cuando necesitas cerrar el comando de manera explícita sin continuar
con el resto del flujo.

```python
async def handle(self) -> None:
    if not self.confirm("¿Deseas continuar con la operación?"):
        self.exitError("Operación cancelada por el usuario.")

    self.exitSuccess("Proceso completado correctamente.")
```

**Código de salida**

El framework determina el resultado final del comando según el flujo de ejecución:

- Si `handle` termina sin excepciones, el proceso finaliza con código `0`.
- Si `handle` lanza una excepción no controlada, el proceso finaliza con un código
  distinto de `0`.
- Si llamas a `exitSuccess(...)`, el proceso finaliza con código `0`.
- Si llamas a `exitError(...)`, el proceso finaliza con código `1`.

No es necesario retornar un valor desde `handle`. El resultado del comando queda
determinado por excepciones no controladas o por llamadas explícitas a los métodos
de salida del proceso.

## API de consola interacción con el usuario

Estos métodos permiten solicitar datos desde la terminal. Todos muestran el prompt
con el color informativo del framework.

### `ask` — Entrada libre

```python
valor = self.ask("¿Cuál es el nombre del entorno?")
```

Retorna el texto escrito por el usuario.

### `confirm` — Confirmación booleana

```python
confirmado = self.confirm("¿Deseas continuar?", default=False)
```

Muestra la pregunta con el texto `(Y/n)` y convierte la respuesta a mayúsculas.
Retorna `True` cuando el usuario escribe `Y` o `YES`. Si el usuario no escribe
nada, retorna el valor indicado en `default`.

Aunque el texto visible del prompt siempre es `(Y/n)`, el valor real por defecto
depende del parámetro `default`.

### `secret` — Entrada oculta

```python
token = self.secret("Ingresa tu token de acceso:")
```

Usa `getpass.getpass(...)`, por lo que la entrada no queda visible en consola.
Es adecuada para contraseñas, claves o tokens.

### `choice` — Selección numerada

```python
opcion = self.choice(
    "Selecciona un entorno:",
    choices=["development", "staging", "production"],
    default_index=0,
)
```

Imprime una lista numerada a partir de `1` y solicita al usuario que elija una
opción válida. Si no se introduce ningún valor, retorna la opción ubicada en
`default_index`. Lanza `ValueError` si la lista está vacía o si el índice está fuera
de rango.

### `anticipate` — Autocompletado por prefijo

```python
entorno = self.anticipate(
    "¿Qué entorno deseas usar?",
    options=["development", "staging", "production"],
    default="development",
)
```

Compara el texto ingresado con las opciones disponibles usando coincidencia por
prefijo mediante `startswith(...)`. Si encuentra una coincidencia, retorna la
primera opción que cumple la condición. Si no encuentra ninguna, retorna `default`
o, en su defecto, el texto ingresado por el usuario.

## Buenas prácticas

- **Firmas descriptivas y únicas**: Usa el patrón `modulo:accion` para evitar
  colisiones y facilitar la organización.
- **Describe siempre el comando**: Proporciona una `description` clara; aparecerá
  en `reactor list` y es la primera fuente de documentación.
- **Delega la lógica**: Mantén `handle` limpio y delega las operaciones complejas
  a servicios o repositorios especializados.
- **Valida entrada temprano**: Si un argumento requerido no llega con el valor
  esperado, notifica con `self.error` y lanza una excepción para producir un código
  de salida limpio.
- **Aprovecha la inyección de dependencias**: Evita instanciar servicios
  manualmente dentro del comando; delega esa responsabilidad al contenedor.
- **Usa la consola con intención**: Reserva `success`, `warning`, `fail` y `error`
  para estados del flujo, y deja `textInfo`, `textMuted` o `table` para detalles
  complementarios.

## Solución de problemas frecuentes

**El comando no aparece en `reactor list`**

- Verifica que el archivo esté ubicado en `app/console/commands/`.
- Confirma que la clase hereda de `BaseCommand`.
- Revisa que no existan errores de importación en el módulo.

**El argumento siempre llega como `None`**

- Verifica que el `dest` en `Argument` coincida exactamente con la clave que
  usas en `getArgument`.
- Asegúrate de que el argumento se está pasando correctamente en la terminal.

**La inyección de dependencias no resuelve el servicio**

- Confirma que el servicio esté registrado en el contenedor de la aplicación.
- Verifica el tipo declarado en el parámetro de `handle`; debe coincidir con
  el binding registrado.
