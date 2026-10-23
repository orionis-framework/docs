---
title: "Almacenar, comprobar y actualizar contraseñas"
description: "Genera y verifica hashes desde controladores y servicios, configura Argon2id y bcrypt y actualiza credenciales mediante rehash."
editUrl: true
lastUpdated: false
---

El servicio de hashing convierte una contraseña en un valor codificado que puedes almacenar y verificar posteriormente. `make()` genera el hash; `check()` compara una contraseña candidata con el valor guardado. El servicio no crea usuarios, no inicia sesiones y no guarda el resultado automáticamente.

Orionis incluye los drivers `argon2`, que genera **Argon2id**, y `bcrypt`. La configuración de `config/hashing.py` determina cuál utilizan `Hash` y `IHashManager` de forma predeterminada.

## Usar hashing desde un controlador

El proveedor del framework registra `IHashManager` como singleton y prepara la fachada `Hash` durante el arranque. No necesitas registrar el servicio manualmente. Puedes inyectarlo en una acción, recibirlo en el constructor o utilizar la fachada desde un controlador, servicio, comando, seeder u otro componente con la aplicación iniciada.

`make()` y `check()` son **asíncronos**: se utilizan con `await`. El trabajo del algoritmo se ejecuta en un worker thread mediante `asyncio.to_thread()`, permitiendo que el event loop continúe atendiendo otras tareas. `driver()`, `needsRehash()`, `getAlgorithm()` y `getDefaultDriver()` son síncronos.

### Validar y guardar una contraseña

Este ejemplo utiliza el modelo `User` de la aplicación de referencia y una tabla `users` ya migrada. Crea el esquema en `app/http/schemas/create_account.py`:

```python
from orionis.schemas import Schema
from orionis.schemas.constraints import Email, MaxLength, MinLength, Unique
from orionis.schemas.fields import Field


class CreateAccountSchema(Schema):
    name: Field[str, MinLength(2), MaxLength(100)]
    email: Field[str, Email(), Unique(table="users", column="email")]
    password: Field[str, MinLength(12), MaxLength(128)]
```

En `app/http/controllers/account_controller.py`, recibe el esquema validado y el servicio de hashing en la acción:

```python
from app.http.schemas.create_account import CreateAccountSchema
from app.models.user import User
from orionis.hashing.contracts import IHashManager
from orionis.http import JSONResponse, response


class AccountController:
    async def store(
        self,
        payload: CreateAccountSchema,
        hashing: IHashManager,
    ) -> JSONResponse:
        user = await User.create({
            "name": payload.name,
            "email": payload.email,
            "password": await hashing.make(payload.password),
            "active": True,
        })

        return response.json(
            {"id": user.id, "name": user.name, "email": user.email},
            status_code=201,
        )
```

Registra el endpoint en `routes/api.py`:

```python
from app.http.controllers.account_controller import AccountController
from orionis.support.facades import Route


Route.post("/accounts", [AccountController, "store"])
```

El kernel valida el payload antes de ejecutar la acción. `make()` genera un hash con salt y parámetros incorporados; `User.create()` lo persiste. La respuesta proyecta únicamente los campos públicos. No asignes `payload.password` directamente a la columna: el modelo no ejecuta hashing automáticamente.

El ejemplo muestra la operación de almacenamiento. La [guía de autenticación](/es/authentication/account-recovery) desarrolla el registro y la verificación de correo; [validación](/es/validation) explica las reglas y el tratamiento de los errores del payload.

### Inyectar el servicio en el constructor

Si varias acciones necesitan hashing, puedes conservar el servicio en el controlador. Como alternativa al controlador anterior, utiliza esta implementación en el mismo archivo:

```python
from app.http.schemas.create_account import CreateAccountSchema
from app.models.user import User
from orionis.hashing.contracts import IHashManager
from orionis.http import JSONResponse, response


class AccountController:
    def __init__(self, hashing: IHashManager) -> None:
        self._hashing = hashing

    async def store(self, payload: CreateAccountSchema) -> JSONResponse:
        user = await User.create({
            "name": payload.name,
            "email": payload.email,
            "password": await self._hashing.make(payload.password),
            "active": True,
        })

        return response.json(
            {"id": user.id, "name": user.name, "email": user.email},
            status_code=201,
        )
```

El contenedor construye el controlador y resuelve `IHashManager` desde su anotación. La ruta permanece igual. Ambas formas reciben el mismo manager configurado; no crean una configuración de hashing independiente para cada petición.

### Utilizar la fachada

Importa siempre desde el módulo público:

```python
from app.models.user import User
from orionis.support.facades import Hash


class AccountCreator:
    async def create(self, name: str, email: str, password: str) -> User:
        return await User.create({
            "name": name,
            "email": email,
            "password": await Hash.make(password),
            "active": True,
        })
```

Este servicio recibe datos ya validados. `Hash` expone las mismas operaciones que `IHashManager` y utiliza la configuración de la aplicación iniciada. La inyección hace explícita la dependencia; la fachada permite acceder al mismo servicio sin añadirlo a la firma.

## Verificar una contraseña

Utiliza `await hashing.check(candidate, stored_hash)`, en ese orden. El segundo argumento es **el hash completo recuperado del almacenamiento**. Una contraseña incorrecta devuelve `False`.

No generes otro hash para compararlo mediante `==`: el salt hace que dos llamadas a `make()` con la misma contraseña produzcan resultados distintos. Tampoco necesitas guardar el salt en una columna separada: ya forma parte de la cadena codificada.

Si necesitas iniciar sesión, utiliza [`Auth.attempt()` y los guards](/es/authentication/session-authentication). Verificar un hash por sí solo no autentica al usuario ni crea una sesión.

## Actualizar un hash con rehash

`needsRehash(stored_hash)` indica si el hash difiere de la política actual del driver: algoritmo o parámetros. Devuelve `bool` de forma síncrona. **No verifica la contraseña y no actualiza la base de datos**.

Después de una comprobación correcta, puedes generar un reemplazo y persistirlo. Este servicio, por ejemplo en `app/services/password_verifier.py`, separa la verificación de la escritura:

```python
from orionis.hashing.contracts import IHashManager


class PasswordVerifier:
    def __init__(self, hashing: IHashManager) -> None:
        self._hashing = hashing

    async def verify(
        self,
        candidate: str,
        stored_hash: str,
    ) -> tuple[bool, str | None]:
        if not await self._hashing.check(candidate, stored_hash):
            return False, None

        if self._hashing.needsRehash(stored_hash):
            return True, await self._hashing.make(candidate)

        return True, None
```

`(False, None)` significa que el intento falló. `(True, None)` indica que la contraseña es correcta y el hash ya coincide con la política. `(True, replacement)` requiere guardar el reemplazo mediante tu repositorio o modelo antes de completar el flujo. Aplica el control de concurrencia de tu aplicación para no sobrescribir un cambio de contraseña simultáneo.

Cambiar el coste de configuración no impide verificar hashes anteriores del mismo algoritmo: el backend lee sus parámetros codificados. `needsRehash()` compara esos parámetros con la configuración actual; una diferencia también puede deberse a una reducción del coste. La configuración define la política que se aplicará al generar el reemplazo.

El proveedor de identidad nativo comprueba contraseñas mediante `check()`; no ejecuta este flujo de rehash ni persiste reemplazos automáticamente.

## Seleccionar un driver

Las operaciones del manager utilizan exclusivamente el driver predeterminado. `driver()` devuelve un hasher configurado y cacheado; seleccionar otro driver no modifica el predeterminado.

| Driver | Algoritmo generado | Costes | Uso |
| --- | --- | --- | --- |
| `argon2` | `argon2id` | Memoria, paralelismo e iteraciones. | Predeterminado del framework para nuevas contraseñas. |
| `bcrypt` | `bcrypt` | Factor de coste `rounds`. | Interoperabilidad con aplicaciones y registros que ya utilizan bcrypt. |

La selección explícita utiliza nombres canónicos en minúsculas: `Hash.driver("argon2")` o `Hash.driver("bcrypt")`. `Hash.driver()` selecciona el predeterminado, `Hash.getDefaultDriver()` informa su nombre de configuración y `Hash.getAlgorithm()` informa el algoritmo.

### Migrar registros bcrypt a Argon2id

Configura `HASH_DRIVER=argon2` para las nuevas contraseñas. Cuando sepas que un registro legado utiliza bcrypt, verifícalo expresamente con ese driver antes de generar un hash Argon2id:

```python
from orionis.support.facades import Hash


async def upgradeBcrypt(
    candidate: str,
    stored_bcrypt_hash: str,
) -> tuple[bool, str | None]:
    legacy = Hash.driver("bcrypt")

    if not await legacy.check(candidate, stored_bcrypt_hash):
        return False, None

    return True, await Hash.make(candidate)
```

El ejemplo presupone que el driver predeterminado es `argon2` y que la aplicación identifica qué registros son legados. Guarda el reemplazo mediante el mismo flujo de persistencia descrito antes. No existe selección automática de bcrypt al utilizar `Hash.check()` con el predeterminado Argon2.

Un hash bcrypt se verifica con los límites de su backend, incluso durante una migración. El backend instalado rechaza contraseñas de más de **72 bytes UTF-8**; no equivale a 72 caracteres. Orionis no trunca el valor ni aplica un prehash para eludir ese límite.

## Configuración completa

`config/hashing.py` define `BootstrapHashing`, que extiende la entidad congelada `Hashing`. Sus objetos `Argon2` y `Bcrypt` también son congelados; sus valores se validan durante la configuración. Estas son todas las opciones disponibles:

| Campo de `hashing` | Variable de entorno | Predeterminado | Significado y validación |
| --- | --- | --- | --- |
| `driver` | `HASH_DRIVER` | `argon2` | `argon2` o `bcrypt`. También acepta un miembro de `Drivers` en Python. |
| `argon2.memory` | `ARGON_MEMORY` | `65536` | Memoria en KiB. Entero positivo y al menos `8 * threads`. |
| `argon2.threads` | `ARGON_THREADS` | `4` | Paralelismo o lanes. Entero positivo. |
| `argon2.time` | `ARGON_TIME` | `3` | Número de iteraciones. Entero positivo. |
| `bcrypt.rounds` | `BCRYPT_ROUNDS` | `12` | Factor logarítmico de coste, entero entre `4` y `31` inclusive. |

Por ejemplo, esta configuración de entorno reproduce los valores predeterminados:

```dotenv
HASH_DRIVER=argon2
ARGON_MEMORY=65536
ARGON_THREADS=4
ARGON_TIME=3
BCRYPT_ROUNDS=12
```

Los parámetros de ambos algoritmos se mantienen en la configuración, aunque solo uno sea el predeterminado. Así, `driver("bcrypt")` utiliza `bcrypt.rounds` mientras `make()` continúa utilizando Argon2id.

Si prefieres fijar los valores en Python, puedes adaptar `config/hashing.py` de esta manera:

```python
from dataclasses import dataclass, field

from orionis.foundation.config.hashing import Argon2, Bcrypt, Drivers, Hashing


@dataclass(frozen=True, kw_only=True)
class BootstrapHashing(Hashing):
    driver: Drivers | str = Drivers.ARGON2
    argon2: Argon2 | dict = field(
        default_factory=lambda: Argon2(memory=65536, threads=4, time=3),
    )
    bcrypt: Bcrypt | dict = field(
        default_factory=lambda: Bcrypt(rounds=12),
    )
```

Este ejemplo fija valores en el archivo; para conservar la lectura de `.env`, mantén las llamadas a `Env.get()` de la configuración original. Los diccionarios de opciones también se convierten a las entidades correspondientes. Los booleanos no son valores válidos para los costes, aunque Python los considere subtipos de `int`.

## Opciones por operación

`make()` admite parámetros nombrados para ajustar únicamente esa operación:

```python
from orionis.hashing.contracts import IHashManager


async def encodePassword(hashing: IHashManager, password: str) -> str:
    return await hashing.driver("argon2").make(
        password,
        rounds=3,
        memory=65536,
        threads=4,
    )
```

| Opción de `make()` | Argon2id | Bcrypt |
| --- | --- | --- |
| `rounds` | Iteraciones; corresponde a `argon2.time`. | Factor de coste; corresponde a `bcrypt.rounds`. |
| `memory` | Memoria en KiB. | Se ignora. |
| `threads` | Paralelismo. | Se ignora. |
| `None` o parámetro omitido | Conserva el coste configurado para esa opción. | Conserva el coste configurado para `rounds`. |

Estos ajustes no modifican el driver cacheado. Si generas con un coste diferente, `needsRehash()` seguirá comparando contra los valores configurados del driver, por lo que puede indicar un reemplazo inmediatamente.

### Setters y clases concretas

`Hash.setRounds(value)` modifica el driver predeterminado compartido y devuelve el manager. En Argon2 cambia el coste temporal; en bcrypt, su factor de coste. Por su alcance global, configura los costes durante el arranque y utiliza opciones por operación cuando solo una llamada deba diferir.

También puedes crear instancias independientes para pruebas, procesos específicos o migraciones. `Argon2Hasher` añade `setMemory()` y `setThreads()`; todos sus setters devuelven la instancia:

```python
from orionis.hashing import Argon2Hasher, BcryptHasher


async def verifyWithIndependentHashers(
    candidate: str,
    argon2_hash: str,
    bcrypt_hash: str,
) -> tuple[bool, bool]:
    argon2 = Argon2Hasher(memory=65536, threads=4, time=3)
    argon2.setRounds(3).setMemory(65536).setThreads(4)
    bcrypt = BcryptHasher(rounds=12).setRounds(12)

    return (
        await argon2.check(candidate, argon2_hash),
        await bcrypt.check(candidate, bcrypt_hash),
    )
```

Estas instancias no leen `config/hashing.py` ni requieren la fachada. Los servicios son utilizables fuera de HTTP desde funciones asíncronas; dentro de una petición ya existe un event loop y no necesitas envolverlos en `asyncio.run()`.

## Referencia de operaciones

| Operación | Retorno | Comportamiento |
| --- | --- | --- |
| `await make(value, *, rounds=None, memory=None, threads=None)` | `str` | Genera el hash codificado con salt y parámetros. |
| `await check(value, hashed)` | `bool` | Verifica la contraseña usando el hash almacenado. |
| `needsRehash(hashed)` | `bool` | Compara el hash con la política actual del driver. |
| `getAlgorithm()` | `str` | `argon2id` o `bcrypt`. |
| `setRounds(rounds)` | La misma instancia. | Modifica el coste del driver seleccionado. |
| `driver(name=None)` | `IHasher` | Disponible en el manager y la fachada. Selecciona un driver sin cambiar el predeterminado. |
| `getDefaultDriver()` | `str` | Disponible en el manager y la fachada. Devuelve `argon2` o `bcrypt`. |

## Errores y comportamiento verificado

- Un hash vacío o no identificado por el driver seleccionado hace que `check()` devuelva `False` y `needsRehash()` devuelva `True`. Esto no autoriza un reemplazo: verifica siempre la contraseña primero.
- Los errores del backend pueden propagarse, por ejemplo por límites de entrada o un formato identificado pero inválido. La API de hashing no convierte cualquier excepción en `False`.
- Las entidades de configuración rechazan tipos o valores inválidos con `TypeError` o `ValueError`. Los constructores, setters y opciones por llamada de los hashers utilizan `HashConfigurationException` para sus costes inválidos; las restricciones adicionales del backend pueden producir sus propios errores.
- Resolver un driver no soportado mediante `driver(name)` lanza `HashDriverNotSupportedException`. Un driver inválido en `config/hashing.py` se rechaza al validar la configuración.
- Los backends se cargan al utilizarlos. Una dependencia ausente produce `MissingHashDependencyException` con el comando de instalación correspondiente. Las dependencias normales de Orionis incluyen ambos backends de `pwdlib`.
- `HashManager` solo resuelve los dos drivers nativos y no expone `extend()`. Una implementación propia debe cumplir los contratos `IHasher` o `IHashManager` y registrarse mediante el contenedor.

Los `65536` KiB predeterminados equivalen a 64 MiB de coste de memoria Argon2 por operación, además del consumo del proceso y del backend. Ejecutar el cálculo fuera del event loop permite concurrencia; no elimina el coste de CPU, memoria ni worker threads. Ajusta los valores según las mediciones de tu aplicación.

Consulta [autenticación](/es/authentication) para la gestión de identidades y [cifrado](/es/cryptography/encryption) cuando necesites recuperar un valor original.
