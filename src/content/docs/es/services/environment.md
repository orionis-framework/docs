---
title: Variables de Entorno
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Variables de Entorno

Orionis ofrece un sistema completo para la gestión de variables de entorno que va mucho más allá de la simple lectura de cadenas de texto. Mientras que la mayoría de frameworks se limitan a leer valores del archivo `.env` como strings crudos, Orionis incorpora **type hints**, **casting dinámico**, **serialización bidireccional** y **validación estricta de claves**, convirtiendo las variables de entorno en ciudadanos de primera clase del sistema de tipos de Python.

---

## Arquitectura del Módulo

El módulo de entorno se compone de varias capas que colaboran entre sí:

| Componente | Responsabilidad |
|---|---|
| `Env` | Fachada estática de alto nivel — punto de entrada principal |
| `DotEnv` | Motor singleton que lee, escribe y gestiona el archivo `.env` |
| `EnvironmentCaster` | Motor de casting dinámico con 10 tipos soportados |
| `ValidateKeyName` | Validador de nombres de clave (`^[A-Z][A-Z0-9_]*$`) |
| `ValidateTypes` | Validador e inferidor de type hints |
| `EnvironmentValueType` | Enum con los 10 tipos soportados |
| `SecureKeyGenerator` | Generador de claves criptográficas compatible con `APP_KEY` |
| `env()` | Función helper global para acceso rápido |

---

## Fachada Env

La clase `Env` es el punto de entrada principal para interactuar con las variables de entorno. Todos sus métodos son `@classmethod`, por lo que no requiere instanciación.

```python
from orionis.services.environment.env import Env
```

Internamente, `Env` delega todas las operaciones a una instancia singleton de `DotEnv`, creada automáticamente en la primera llamada.

### Contrato

`Env` implementa el contrato abstracto `IEnv`, que define la interfaz pública:

```python
from orionis.services.environment.contracts.env import IEnv
```

| Método | Firma | Retorno |
|---|---|---|
| `get` | `(key, default=None)` | `object` |
| `set` | `(key, value, type_hint=None, *, only_os=False)` | `bool` |
| `unset` | `(key, *, only_os=False)` | `bool` |
| `all` | `()` | `dict[str, Any]` |
| `reload` | `()` | `bool` |

---

## Lectura de Variables

### Método `get`

Recupera el valor de una variable de entorno. Si la clave existe, el valor se **parsea automáticamente** al tipo Python correspondiente. Si no existe, retorna el valor por defecto.

```python
# lectura simple
db_host = Env.get("DB_HOST")

# con valor por defecto
db_port = Env.get("DB_PORT", 5432)
```

#### Parseo automático de valores

A diferencia de otros frameworks donde `get()` siempre devuelve un `str`, Orionis **detecta y convierte** automáticamente los valores almacenados:

| Valor en `.env` | Tipo Python retornado |
|---|---|
| `true` / `false` | `bool` |
| `null`, `none`, `nan`, `nil` | `None` |
| `42` | `int` |
| `3.14` | `float` |
| `[1, 2, 3]` | `list` |
| `{'key': 'val'}` | `dict` |
| `(1, 2)` | `tuple` |
| `{1, 2, 3}` | `set` |
| `int:42` | `int` (via type hint) |
| `base64:SGVsbG8=` | `str` (decodificado) |
| `path:/usr/local` | `str` (ruta POSIX) |
| `Hello World` | `str` |

El motor de parseo sigue esta secuencia de resolución:

1. Si el valor es `None`, retorna `None`
2. Si ya es un tipo Python básico (`bool`, `int`, `float`, etc.), lo retorna directamente
3. Si es un string vacío o coincide con `null`, `none`, `nan` o `nil`, retorna `None`
4. Si es `true` o `false` (case-insensitive), retorna `bool`
5. Si comienza con un prefijo de tipo soportado (ej. `int:`, `list:`), delega al `EnvironmentCaster`
6. Intenta evaluar con `ast.literal_eval` para literales Python
7. Si todo falla, retorna el string original

---

## Escritura de Variables

### Método `set`

Establece o actualiza una variable de entorno. Por defecto, escribe tanto en el archivo `.env` como en `os.environ`.

```python
# escritura simple
Env.set("APP_NAME", "Orionis")

# con type hint explícito
Env.set("APP_PORT", "8000", type_hint="int")

# solo en la memoria del proceso (no persiste en .env)
Env.set("TEMP_TOKEN", "abc123", only_os=True)
```

#### Parámetros

| Parámetro | Tipo | Descripción |
|---|---|---|
| `key` | `str` | Nombre de la variable (debe cumplir `^[A-Z][A-Z0-9_]*$`) |
| `value` | `str \| float \| bool \| list \| dict \| tuple \| set` | Valor a asignar |
| `type_hint` | `str \| EnvironmentValueType \| None` | Tipo explícito para serialización |
| `only_os` | `bool` | Si es `True`, solo establece en `os.environ` |

#### Serialización de valores

Cuando se escribe un valor, el motor lo serializa automáticamente:

| Tipo Python | Representación en `.env` |
|---|---|
| `None` | `null` |
| `bool` | `true` / `false` |
| `int` / `float` | Su representación string (`"42"`, `"3.14"`) |
| `list` / `dict` / `tuple` / `set` | Representación `repr()` |
| `str` | Texto con whitespace recortado |

Cuando se proporciona un `type_hint`, el valor se almacena con prefijo de tipo:

```python
Env.set("PORT", 8080, type_hint="int")
# En .env: PORT="int:8080"

Env.set("HOSTS", ["a", "b"], type_hint="list")
# En .env: HOSTS="list:['a', 'b']"
```

---

## Eliminación de Variables

### Método `unset`

Elimina una variable de entorno del archivo `.env` y de `os.environ`.

```python
# eliminación completa
Env.unset("OLD_KEY")

# solo remover de os.environ (mantener en .env)
Env.unset("CACHED_KEY", only_os=True)
```

La operación siempre retorna `True`, incluso si la clave no existía.

---

## Consulta y Recarga

### Método `all`

Retorna todas las variables del archivo `.env` como un diccionario con valores parseados:

```python
config = Env.all()
# {'DB_HOST': 'localhost', 'DB_PORT': 5432, 'DEBUG': True}
```

### Método `reload`

Recarga las variables desde el archivo `.env`. Útil cuando el archivo ha sido modificado externamente:

```python
Env.reload()
```

Internamente destruye la instancia singleton de `DotEnv` y crea una nueva, asegurando un estado completamente limpio.

---

## Type Hints — Sistema de Tipos

Una de las funcionalidades más distintivas de Orionis es el sistema de **type hints** en las variables de entorno. Permite almacenar y recuperar valores con tipo explícito mediante el formato `tipo:valor` directamente en el archivo `.env`.

### Tipos soportados

El enum `EnvironmentValueType` define los 10 tipos disponibles:

```python
from orionis.services.environment.enums.value_type import EnvironmentValueType
```

| Miembro | Valor | Ejemplo en `.env` | Tipo Python |
|---|---|---|---|
| `STR` | `str` | `str:hello` | `str` |
| `INT` | `int` | `int:42` | `int` |
| `FLOAT` | `float` | `float:3.14` | `float` |
| `BOOL` | `bool` | `bool:true` | `bool` |
| `LIST` | `list` | `list:[1, 2, 3]` | `list` |
| `DICT` | `dict` | `dict:{'a': 1}` | `dict` |
| `TUPLE` | `tuple` | `tuple:(1, 2)` | `tuple` |
| `SET` | `set` | `set:{1, 2, 3}` | `set` |
| `BASE64` | `base64` | `base64:SGVsbG8=` | `str` |
| `PATH` | `path` | `path:/usr/local/bin` | `str` |

### Escritura con type hint

```python
from orionis.services.environment.enums.value_type import EnvironmentValueType

# usando string
Env.set("API_PORT", 3000, type_hint="int")

# usando enum
Env.set("API_PORT", 3000, type_hint=EnvironmentValueType.INT)
```

### Lectura con type hint

Al leer una variable que tiene prefijo de tipo, el `EnvironmentCaster` la convierte automáticamente:

```python
# Si en .env: API_PORT="int:3000"
port = Env.get("API_PORT")
print(type(port))  # <class 'int'>
print(port)        # 3000
```

### Comportamiento especial del tipo Bool

El caster de booleanos reconoce múltiples representaciones:

| Verdadero | Falso |
|---|---|
| `true` | `false` |
| `1` | `0` |
| `yes` | `no` |
| `on` | `off` |
| `enabled` | `disabled` |

### Comportamiento especial del tipo Path

Las rutas se normalizan a formato POSIX y se resuelven como absolutas:

```python
Env.set("UPLOAD_DIR", "./uploads", type_hint="path")
# Almacena: path:/absolute/path/to/uploads
```

### Comportamiento especial del tipo Base64

Si el valor ya es Base64 válido, se preserva. Si no, se codifica automáticamente:

```python
Env.set("SECRET", "mi-secreto", type_hint="base64")
# Almacena: base64:bWktc2VjcmV0bw==
```

---

## Validación de Claves

Todas las claves de variables de entorno se validan con el patrón estricto `^[A-Z][A-Z0-9_]*$`:

| Clave | Válida | Razón |
|---|---|---|
| `DB_HOST` | ✅ | Mayúsculas, guiones bajos, correcto |
| `VAR123` | ✅ | Dígitos después de la primera letra |
| `A__B` | ✅ | Múltiples guiones bajos permitidos |
| `myVar` | ❌ | Contiene minúsculas |
| `1VAR` | ❌ | Comienza con dígito |
| `_VAR` | ❌ | Comienza con guión bajo |
| `MY-VAR` | ❌ | Contiene guión |

```python
# TypeError si no es string
Env.set(123, "value")  # ❌ TypeError

# ValueError si no cumple el patrón
Env.set("my_var", "value")  # ❌ ValueError
```

---

## Motor DotEnv

`DotEnv` es la capa interna que gestiona directamente el archivo `.env`. Implementa el patrón **Singleton** y es **thread-safe** mediante `threading.RLock`.

```python
from orionis.services.environment.core.dot_env import DotEnv
```

### Características

- **Singleton**: Una sola instancia compartida en toda la aplicación
- **Thread-safe**: Todas las operaciones usan `threading.RLock`
- **Creación automática**: Si el archivo `.env` no existe, se crea automáticamente
- **Ruta configurable**: Acepta una ruta personalizada en el constructor
- **Doble persistencia**: Escribe en el archivo `.env` y en `os.environ` simultáneamente

### Inicialización

```python
# usa .env en el directorio actual (comportamiento por defecto)
dotenv = DotEnv()

# ruta personalizada
dotenv = DotEnv(path="/config/.env.production")
```

---

## Generador de Claves Seguras

El módulo incluye `SecureKeyGenerator` para generar claves criptográficas compatibles con el formato `APP_KEY` (`base64:<payload>`):

```python
from orionis.services.environment.key.key_generator import SecureKeyGenerator
```

### Cifrados soportados

| Cifrado | Tamaño de clave |
|---|---|
| `AES-128-CBC` | 16 bytes |
| `AES-256-CBC` | 32 bytes |
| `AES-128-GCM` | 16 bytes |
| `AES-256-GCM` | 32 bytes |

### Uso

```python
# cifrado por defecto: AES-256-CBC
key = SecureKeyGenerator.generate()
# "base64:xK9m2..."

# cifrado específico con string
key = SecureKeyGenerator.generate("AES-128-GCM")

# cifrado específico con enum
from orionis.foundation.config.app.enums.ciphers import Cipher
key = SecureKeyGenerator.generate(Cipher.AES_256_GCM)
```

Cada llamada produce una clave criptográficamente única generada con `os.urandom()`.

---

## Función Helper `env()`

Para acceso rápido desde cualquier parte de la aplicación, Orionis proporciona la función global `env()`:

```python
from orionis.services.environment.helpers.functions import env

# equivalente a Env.get("DB_HOST")
host = env("DB_HOST")

# con valor por defecto
port = env("DB_PORT", 3306)
```

La función simplemente delega a `Env.get()`, aceptando los mismos parámetros `key` y `default`.

---

## Ejemplo Integrado

```python
from orionis.services.environment.env import Env
from orionis.services.environment.helpers.functions import env
from orionis.services.environment.key.key_generator import SecureKeyGenerator

# Generar y establecer una clave de aplicación
app_key = SecureKeyGenerator.generate()
Env.set("APP_KEY", app_key, type_hint="base64")

# Configurar variables con tipos explícitos
Env.set("APP_DEBUG", True, type_hint="bool")
Env.set("APP_PORT", 8080, type_hint="int")
Env.set("ALLOWED_HOSTS", ["localhost", "127.0.0.1"], type_hint="list")
Env.set("DB_CONFIG", {"host": "localhost", "port": 5432}, type_hint="dict")

# Lecturas con casting automático
debug = Env.get("APP_DEBUG")       # bool: True
port = Env.get("APP_PORT")         # int: 8080
hosts = env("ALLOWED_HOSTS")       # list: ['localhost', '127.0.0.1']
db = env("DB_CONFIG")              # dict: {'host': 'localhost', 'port': 5432}

# Consultar toda la configuración
all_vars = Env.all()

# Variable temporal solo en memoria
Env.set("REQUEST_ID", "abc-123", only_os=True)

# Recargar tras cambio externo
Env.reload()
```