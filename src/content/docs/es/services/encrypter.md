---
title: Encriptación
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Servicio de Encriptación

Orionis Framework incluye un servicio de encriptación integrado que permite cifrar y descifrar datos de forma segura mediante algoritmos AES estándar de la industria. El servicio está disponible a través del contenedor de servicios, inyección de dependencias o la fachada `Crypt`.

La encriptación es fundamental para proteger información sensible como tokens, credenciales, datos personales o cualquier valor que necesite confidencialidad tanto en tránsito como en reposo.

## Cifrados Soportados

El servicio soporta cuatro modos de cifrado AES:

| Cifrado | Tamaño de Clave | Modo | Autenticación |
|---------|-----------------|------|---------------|
| `AES-128-CBC` | 16 bytes (128 bits) | Cipher Block Chaining | No |
| `AES-256-CBC` | 32 bytes (256 bits) | Cipher Block Chaining | No |
| `AES-128-GCM` | 16 bytes (128 bits) | Galois/Counter Mode | Sí |
| `AES-256-GCM` | 32 bytes (256 bits) | Galois/Counter Mode | Sí |

**Diferencias entre CBC y GCM**

- **CBC** (Cipher Block Chaining): modo clásico de cifrado por bloques con padding PKCS7. Proporciona confidencialidad pero no verificación de integridad integrada.
- **GCM** (Galois/Counter Mode): modo de cifrado autenticado que proporciona confidencialidad e integridad simultáneamente mediante un tag de autenticación. Es la opción recomendada para la mayoría de los casos de uso.

## Configuración

El servicio de encriptación se configura a través de dos valores en el archivo de configuración de la aplicación (`config/app.py`) que se resuelven desde variables de entorno:

### Clave de Encriptación (`APP_KEY`)

La clave de encriptación es un valor en bytes que se utiliza como secreto para las operaciones de cifrado y descifrado.

- Si la variable de entorno `APP_KEY` no está definida, el framework genera automáticamente una clave segura al iniciar la aplicación.
- La longitud de la clave debe coincidir con el cifrado configurado: **16 bytes** para AES-128 o **32 bytes** para AES-256.

### Cifrado (`APP_CIPHER`)

Define el algoritmo de cifrado utilizado. El valor por defecto es `AES-256-CBC`.

Valores válidos:
- `AES-128-CBC`
- `AES-256-CBC`
- `AES-128-GCM`
- `AES-256-GCM`

**Ejemplo de configuración en `.env`**

```env
APP_KEY=your-32-byte-secret-key-here!!!!
APP_CIPHER=AES-256-GCM
```

## Uso mediante la Fachada `Crypt`

La forma más directa de utilizar el servicio de encriptación es a través de la fachada `Crypt`, que expone los métodos `encrypt` y `decrypt` como llamadas estáticas.

**Importación**

```python
from orionis.support.facades.encrypter import Crypt
```

### Cifrar un Valor

```python
from orionis.support.facades.encrypter import Crypt

encrypted = Crypt.encrypt("información sensible")
# Retorna una cadena base64 con el payload cifrado
```

### Descifrar un Valor

```python
from orionis.support.facades.encrypter import Crypt

plaintext = Crypt.decrypt(encrypted)
# Retorna: "información sensible"
```

### Ejemplo Completo

```python
from orionis.support.facades.encrypter import Crypt

# Cifrar
token = "mi-token-secreto-12345"
encrypted_token = Crypt.encrypt(token)
print(f"Cifrado: {encrypted_token}")

# Descifrar
original = Crypt.decrypt(encrypted_token)
print(f"Original: {original}")

# Verificar
assert original == token
```

## Uso mediante Inyección de Dependencias

También puedes acceder al servicio a través de inyección de dependencias utilizando el contrato `IEncrypter`:

```python
from orionis.services.encrypter.contracts.encrypter import IEncrypter

class PaymentService:

    def __init__(self, encrypter: IEncrypter) -> None:
        self._encrypter = encrypter

    def store_card(self, card_number: str) -> str:
        return self._encrypter.encrypt(card_number)

    def retrieve_card(self, encrypted: str) -> str:
        return self._encrypter.decrypt(encrypted)
```

En comandos de consola, puedes inyectar directamente en el método `handle`:

```python
from orionis.console.base.command import BaseCommand
from orionis.services.encrypter.contracts.encrypter import IEncrypter

class EncryptDataCommand(BaseCommand):

    signature: str = "data:encrypt"
    description: str = "Cifra un valor proporcionado"

    async def handle(self, encrypter: IEncrypter) -> None:
        value = self.ask("Ingresa el valor a cifrar:")
        encrypted = encrypter.encrypt(value)
        self.success(f"Valor cifrado: {encrypted}")
```

## Contrato `IEncrypter`

El servicio implementa el contrato `IEncrypter`, una clase abstracta que define dos métodos:

```python
from abc import ABC, abstractmethod

class IEncrypter(ABC):

    @abstractmethod
    def encrypt(self, plaintext: str) -> str:
        ...

    @abstractmethod
    def decrypt(self, payload: str) -> str:
        ...
```

### `encrypt(plaintext: str) -> str`

Cifra una cadena de texto y retorna un payload codificado en base64.

**Parámetros**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `plaintext` | `str` | Texto a cifrar. No puede ser vacío. |

**Retorno**: `str` — Payload cifrado codificado en base64.

**Excepciones**

| Excepción | Causa |
|-----------|-------|
| `TypeError` | Si `plaintext` no es una cadena de texto. |
| `ValueError` | Si `plaintext` es una cadena vacía. |
| `RuntimeError` | Si ocurre un error durante el proceso de cifrado. |

### `decrypt(payload: str) -> str`

Descifra un payload previamente generado por `encrypt` y retorna el texto original.

**Parámetros**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `payload` | `str` | Payload cifrado en formato base64. |

**Retorno**: `str` — Texto original descifrado.

**Excepciones**

| Excepción | Causa |
|-----------|-------|
| `TypeError` | Si `payload` no es una cadena de texto. |
| `ValueError` | Si `payload` es vacío, no es base64 válido, le faltan campos requeridos o el cifrado no coincide. |
| `RuntimeError` | Si ocurre un error durante el proceso de descifrado. |

## Estructura del Payload

El método `encrypt` genera un payload JSON codificado en base64 con la siguiente estructura:

### Payload CBC

```json
{
    "iv": "<IV codificado en base64>",
    "value": "<texto cifrado codificado en base64>",
    "tag": null,
    "cipher": "AES-256-CBC"
}
```

### Payload GCM

```json
{
    "iv": "<IV codificado en base64>",
    "value": "<texto cifrado codificado en base64>",
    "tag": "<tag de autenticación codificado en base64>",
    "cipher": "AES-256-GCM"
}
```

**Campos del payload**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `iv` | `str` | Vector de inicialización (16 bytes en CBC, 12 bytes en GCM), codificado en base64. |
| `value` | `str` | Datos cifrados codificados en base64. |
| `tag` | `str \| null` | Tag de autenticación GCM (16 bytes) codificado en base64. `null` en modo CBC. |
| `cipher` | `str` | Identificador del cifrado utilizado. |

Cada operación de cifrado genera un IV aleatorio nuevo, lo que garantiza que cifrando el mismo texto dos veces se produzcan payloads diferentes.

## Registro del Servicio

El servicio de encriptación se registra en el contenedor de la aplicación mediante `EncrypterProvider`, un proveedor diferido que solo se carga cuando se necesita:

```python
from orionis.foundation.providers.encrypter_provider import EncrypterProvider
```

El proveedor:

- Registra `Encrypter` como singleton vinculado al contrato `IEncrypter`.
- Inicializa la fachada `Crypt` durante el arranque.
- Al ser diferido, no impacta el tiempo de inicio de la aplicación hasta que se resuelve el servicio.

## Constantes Internas

La clase `Encrypter` define las siguientes constantes de configuración:

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `AES_128_KEY_SIZE` | `16` | Tamaño de clave en bytes para AES-128. |
| `AES_256_KEY_SIZE` | `32` | Tamaño de clave en bytes para AES-256. |
| `CBC_IV_SIZE` | `16` | Tamaño del IV en bytes para modo CBC. |
| `GCM_IV_SIZE` | `12` | Tamaño del IV en bytes para modo GCM. |
| `GCM_TAG_SIZE` | `16` | Tamaño del tag de autenticación en bytes para GCM. |
| `PKCS7_BLOCK_SIZE` | `16` | Tamaño de bloque para padding PKCS7. |

## Buenas Prácticas

- **Usa GCM cuando sea posible**: GCM proporciona cifrado autenticado, lo que protege tanto la confidencialidad como la integridad de los datos.
- **Protege tu `APP_KEY`**: nunca incluyas la clave de encriptación en el código fuente ni en repositorios de control de versiones. Usa variables de entorno.
- **No cifres datos ya cifrados**: evita el doble cifrado accidental, que dificulta el descifrado y aumenta el tamaño del payload.
- **Usa el contrato `IEncrypter` para inyección**: esto facilita testing y desacopla tu código de la implementación concreta.
- **Maneja las excepciones**: envuelve las operaciones de descifrado en bloques `try/except` para manejar payloads corruptos o incompatibles.

## Errores Comunes

**`ValueError`: Cipher not supported**

El cifrado configurado en `APP_CIPHER` no es válido. Verifica que sea uno de: `AES-128-CBC`, `AES-256-CBC`, `AES-128-GCM`, `AES-256-GCM`.

**`ValueError`: Key must be N bytes**

La longitud de `APP_KEY` no coincide con el cifrado configurado. AES-128 requiere 16 bytes y AES-256 requiere 32 bytes.

**`ValueError`: Payload cipher does not match**

Se intenta descifrar un payload que fue cifrado con un algoritmo diferente al configurado actualmente. Asegúrate de usar el mismo cifrado para cifrar y descifrar.

**`RuntimeError`: Error during decryption**

El payload está corrupto, fue modificado o se está usando una clave diferente a la utilizada durante el cifrado.

## Notas

- El servicio utiliza la biblioteca `cryptography` de Python para todas las operaciones criptográficas.
- Los IVs se generan aleatoriamente con `os.urandom` en cada operación de cifrado, garantizando que payloads idénticos nunca produzcan el mismo resultado.
- El modo CBC utiliza padding PKCS7 para alinear los datos al tamaño de bloque AES.
- El modo GCM no requiere padding y proporciona verificación de integridad mediante el tag de autenticación.
- Los payloads son autodescriptivos: incluyen el cifrado utilizado, lo que facilita la validación durante el descifrado.