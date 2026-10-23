---
title: "Referencia de Env y operaciones de configuración"
description: "API de Env, archivo y proceso, recarga, validadores y generación de claves durante la preparación de configuración."
editUrl: true
lastUpdated: false
---

Utiliza el componente de entorno **únicamente en los archivos de configuración**. Esta referencia explica sus operaciones para preparar esos valores; no debes llamar a `Env`, `env()` o `DotEnv` desde controladores, middleware, comandos, jobs ni servicios en ejecución. Durante el runtime, consume la configuración resuelta mediante `IApplication.config()`, como muestra [Bootstrap y archivos JSON](/es/architecture/environment/compiled-configuration#runtime-configuration).

Para definir ajustes habituales, edita `.env` y léelos en una dataclass de `config/`: [Variables y tipos](/es/architecture/environment/typed-configuration). No necesitas escribir ni recargar el archivo mediante Python en cada arranque.

<a id="env-api"></a>
## Importaciones y contrato

```python
from orionis.environment import Env, env
```

Son las dos exportaciones del paquete raíz. `Env` implementa `IEnv` mediante métodos de clase y delega en el mismo singleton `DotEnv`; no necesitas `Env()` ni un binding del contenedor. Todas sus operaciones son síncronas y no llevan `await`. `IEnv`, disponible en `orionis.environment.contracts.env`, declara los mismos cinco métodos; no proporciona otra fuente de valores.

<a id="env-get"></a>
<a id="env-helper"></a>
## Leer: Env.get() y env()

```text
Env.get(key: str, default: object | None = None) -> object
env(key: str, default: object | None = None) -> object
```

`key` es el nombre exacto de la variable. Ambos validan el nombre, leen `os.environ` y convierten el texto conforme a las [reglas de tipado](/es/architecture/environment/typed-configuration). El helper delega directamente en `Env.get()` y acepta los mismos dos argumentos; no tiene un tercer argumento de conversión.

En los campos de tu archivo de configuración puedes utilizar cualquiera de las dos formas:

```python
# config/reports.py
from dataclasses import dataclass, field
from orionis.environment import Env, env


@dataclass(frozen=True, kw_only=True)
class Reports:
    limit: int = field(default_factory=lambda: Env.get("REPORT_LIMIT", 100))
    region: str = field(default_factory=lambda: env("REPORT_REGION", "eu"))
```

Con `REPORT_LIMIT=int:50`, `limit` recibe el entero `50`. El default se devuelve exactamente como lo proporcionas **solo cuando la clave no existe en el proceso**; no convierte un valor incompatible, no sustituye `None` o una cadena vacía ya almacenada y no valida por sí solo la anotación del campo. Un nombre inválido produce `TypeError` o `ValueError`; un prefijo válido con contenido inválido puede producir errores de conversión en vez de usar el default.

<a id="env-set"></a>
## Escribir: Env.set()

La firma declarada es:

```text
Env.set(
    key: str,
    value: str | float | bool | list | dict | tuple | set,
    type_hint: str | EnvironmentValueType | None = None,
    *,
    only_os: bool = False,
) -> bool
```

| Parámetro | Efecto |
|---|---|
| `key` | Obligatorio. Nombre validado con el mismo formato de `get()`. |
| `value` | Obligatorio. Valor que se serializa antes de almacenarlo. |
| `type_hint` | Opcional, `None`. Un nombre de tipo o miembro de `EnvironmentValueType` selecciona la serialización explícita con prefijo. |
| `only_os` | Solo por nombre, `False`. Con `True`, actualiza únicamente `os.environ`; no escribe el archivo ni el snapshot de `all()`. |

Sin `type_hint`, los strings se recortan con `strip()`, los booleanos se escriben como `true`/`false`, los números como texto y las colecciones mediante `repr()`. Aunque la anotación no enumera `int` ni `None`, el serializador real admite enteros y convierte `None` en `null` cuando no se proporciona un hint. Para los demás objetos existe un fallback a `str()`; no lo uses para asumir que conservarán su tipo al leerlos.

Con un hint, `ValidateTypes` admite valores `str`, `int`, `float`, `bool`, `list`, `dict`, `tuple` y `set`. Por ejemplo, `"INT"` se normaliza a `"int"`; los espacios en el nombre no se eliminan. Los valores `None`, `Path` o `bytes` se rechazan por ese validador cuando se proporciona un hint, aunque el conversor de menor nivel tenga otras capacidades. Para `path` o `base64`, utiliza texto compatible. Los [diez tipos y el conversor](/es/architecture/environment/typed-configuration) detallan sus restricciones.

Este helper ilustra una escritura explícita en la preparación de configuración; **definirlo no lo ejecuta**. No lo llames desde el código de negocio ni lo añadas como escritura incondicional en cada arranque:

```python
# config/reports.py: helper de preparación, separado de la dataclass anterior.
from orionis.environment import Env
from orionis.environment.enums import EnvironmentValueType


def persist_report_limit(value: int) -> bool:
    return Env.set("REPORT_LIMIT", value, EnvironmentValueType.INT)
```

Al invocarlo con `50` durante esa preparación, guarda un valor equivalente a `REPORT_LIMIT='int:50'`, actualiza el snapshot del archivo y el entorno del proceso. Con `only_os=True`, `Env.get()` vería el valor nuevo, pero `Env.all()` conservaría el anterior.

Devuelve `True` si el flujo termina; no es una transacción entre archivo, snapshot y proceso. Un hint desconocido produce `RuntimeError`, un tipo de hint o valor incompatible puede producir `TypeError`, y una conversión fallida puede producir `ValueError`. Los fallos de acceso/escritura se propagan. No incorpora bloqueo entre varios procesos ni una reversión de cambios parciales.

<a id="env-unset"></a>
## Eliminar: Env.unset()

```text
Env.unset(key: str, *, only_os: bool = False) -> bool
```

Elimina la entrada del `.env`, del snapshot y de `os.environ`. Con `only_os=True` solo retira la entrada del proceso: una lectura posterior de `all()` aún puede mostrar la del archivo, y una recarga puede volver a introducirla en el proceso. Una clave válida ausente también devuelve `True`; no es un indicador de que hubiera una entrada previa. El nombre inválido produce `TypeError` o `ValueError`, y los errores de archivo se propagan.

Un helper de limpieza explícita dentro de configuración puede ser:

```python
from orionis.environment import Env


def remove_obsolete_report_option() -> bool:
    return Env.unset("REPORT_LEGACY_OPTION")
```

La función solo actúa cuando se invoca deliberadamente durante la preparación de configuración; no es un mecanismo de limpieza por petición.

<a id="env-all"></a>
## Inspeccionar el archivo: Env.all()

```text
Env.all() -> dict[str, Any]
```

Devuelve un diccionario nuevo con las entradas del **snapshot del archivo** y sus valores convertidos. No enumera todo `os.environ`, no relee el disco y no incluye una variable creada solo mediante `only_os=True`. Las colecciones se vuelven a parsear, por lo que no son referencias al snapshot interno.

Para comprobar la presencia de claves durante la preparación de configuración sin imprimir sus valores:

```python
from orionis.environment import Env


def has_report_configuration() -> bool:
    names = Env.all().keys()
    return "REPORT_LIMIT" in names and "REPORT_REGION" in names
```

Un valor inválido del archivo puede hacer fallar la conversión del conjunto completo. `all()` también puede contener claves con `None` cuando aparecen sin asignación en el archivo. No vuelques su resultado en logs: incluye los valores de credenciales que estén en `.env`.

<a id="env-reload"></a>
## Recargar: Env.reload()

```text
Env.reload() -> bool
```

Vuelve a cargar el mismo archivo con precedencia sobre valores de proceso y reconstruye el snapshot; conserva la instancia y la ruta seleccionada. La operación satisfactoria devuelve `True`. Si falla la recarga, `DotEnv.reload()` envuelve el error en `RuntimeError`, que la fachada deja propagarse. La fachada devuelve `False` únicamente si obtener o construir el singleton falla con `OSError` o `ValueError` antes de llamar a su recarga.

```python
from orionis.environment import Env


def refresh_configuration_source() -> bool:
    return Env.reload()
```

Este helper corresponde exclusivamente a preparación de configuración. La recarga **no reconstruye** dataclasses ya instanciadas, servicios ni archivos de configuración compilada. Tampoco borra del proceso claves que hayas eliminado manualmente del archivo: pueden desaparecer de `all()` y seguir siendo visibles mediante `get()`. Para aplicar cambios a la aplicación sigue [el flujo de invalidación y reinicio](/es/architecture/environment/compiled-configuration#refresh-compiled-configuration).

<a id="dotenv-service"></a>
## DotEnv y selección del archivo

```text
DotEnv(path: str | None = None) -> None
```

La implementación está en `orionis.environment.core.dot_env`. El primer acceso crea una única instancia por proceso. Sin ruta usa `.env` del directorio de trabajo; una ruta explícita se expande y resuelve. Si falta el archivo, intenta crearlo; no crea automáticamente sus directorios padres.

Carga el archivo con `override=True` y prepara su snapshot. Las llamadas posteriores reutilizan la instancia: pasar otra ruta no selecciona un segundo archivo. `Env` y `env()` comparten esa selección. La fachada no expone un argumento para elegir archivos diferentes por consulta; mantén el proceso en la raíz del proyecto al preparar su configuración.

`DotEnv` ofrece los mismos cinco métodos `get`, `set`, `unset`, `all` y `reload`; sus parámetros y efectos corresponden a los descritos arriba. Su `all()` está anotado como `dict`, y su `reload()` propaga `RuntimeError` sin el tratamiento adicional de la fachada. Un `threading.Lock` serializa estas operaciones dentro del proceso; no es un lock distribuido. El componente no ofrece una API HTTP, async, de inyección por petición ni un sistema de configuración recargable durante runtime.

<a id="environment-validators"></a>
## Validadores de claves y hints

Los dos callables se exportan desde `orionis.environment.validators`:

```text
ValidateKeyName(key: str) -> str
ValidateTypes(
    *,
    value: str | float | bool | list | dict | tuple | set,
    type_hint: str | EnvironmentValueType | None = None,
) -> str
```

`ValidateKeyName` es un alias de función: devuelve el nombre intacto si coincide con `[A-Z][A-Z0-9_]*`. No lo convierte a mayúsculas ni elimina espacios. Rechaza tipos distintos de `str` y formatos incorrectos.

`ValidateTypes` es una instancia invocable. Comprueba los tipos Python admitidos y devuelve el hint normalizado, o el nombre del tipo inferido si se omite. **No realiza la conversión ni comprueba que una cadena sea un entero válido**. Un hint como `"unknown"` produce `RuntimeError`; un valor o tipo de hint no admitido produce `TypeError`.

```python
# Comprobaciones auxiliares al preparar config/.
from orionis.environment.validators import ValidateKeyName, ValidateTypes

assert ValidateKeyName("REPORT_LIMIT") == "REPORT_LIMIT"
assert ValidateTypes(value="50", type_hint="INT") == "int"
assert ValidateTypes(value=["eu", "us"]) == "list"
```

Para convertir el contenido utiliza [EnvironmentCaster](/es/architecture/environment/typed-configuration#caster-construction); para la lectura habitual, `Env.get()` o `env()`.

<a id="environment-key-generator"></a>
## Generación de APP_KEY

```text
SecureKeyGenerator.generate(cipher: str | Cipher = Cipher.AES_256_CBC) -> str
```

`SecureKeyGenerator`, en `orionis.environment.key.key_generator`, genera bytes aleatorios con `os.urandom` y devuelve texto con prefijo `base64:`. `KEY_SIZES` relaciona las cuatro opciones con su tamaño:

| Cipher o texto exacto | Bytes generados |
|---|---|
| `Cipher.AES_128_CBC` / `"AES-128-CBC"` | 16 |
| `Cipher.AES_256_CBC` / `"AES-256-CBC"` | 32 |
| `Cipher.AES_128_GCM` / `"AES-128-GCM"` | 16 |
| `Cipher.AES_256_GCM` / `"AES-256-GCM"` | 32 |

Una cadena de algoritmo desconocida produce `ValueError`; no se normalizan sus mayúsculas. Generar una clave no la persiste por sí solo. La entidad nativa de configuración `App` utiliza este generador si falta la clave y escribe `APP_KEY` durante su validación.

No generes una clave nueva cada vez que se construya tu configuración: conserva la existente para poder descifrar los datos previos. Para la operación explícita utiliza el [comando key:generate](/es/console/built-in-application#command-key-generate) y consulta [Hashing y cifrado](/es/security/encryption).

<a id="environment-coverage"></a>
## Referencia contrastada

El [inventario del componente](/downloads/environment-api-inventory.json) relaciona su API pública, contratos, tipos y validadores con las cuatro guías de Entorno. Las funciones privadas, la carga diferida de exportaciones y los métodos heredados o generados no se presentan como funcionalidades adicionales.
