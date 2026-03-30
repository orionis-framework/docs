---
title: Encryption
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Encryption Service

Orionis Framework includes a built-in encryption service that allows you to securely encrypt and decrypt data using industry-standard AES algorithms. The service is accessible through the service container, dependency injection, or the `Crypt` facade.

Encryption is essential for protecting sensitive information such as tokens, credentials, personal data, or any value that requires confidentiality both in transit and at rest.

## Supported Ciphers

The service supports four AES cipher modes:

| Cipher | Key Size | Mode | Authentication |
|--------|----------|------|----------------|
| `AES-128-CBC` | 16 bytes (128 bits) | Cipher Block Chaining | No |
| `AES-256-CBC` | 32 bytes (256 bits) | Cipher Block Chaining | No |
| `AES-128-GCM` | 16 bytes (128 bits) | Galois/Counter Mode | Yes |
| `AES-256-GCM` | 32 bytes (256 bits) | Galois/Counter Mode | Yes |

**Differences Between CBC and GCM**

- **CBC** (Cipher Block Chaining): a classic block cipher mode with PKCS7 padding. It provides confidentiality but no built-in integrity verification.
- **GCM** (Galois/Counter Mode): an authenticated encryption mode that provides both confidentiality and integrity simultaneously through an authentication tag. This is the recommended option for most use cases.

## Configuration

The encryption service is configured through two values in the application configuration file (`config/app.py`) that are resolved from environment variables:

### Encryption Key (`APP_KEY`)

The encryption key is a byte value used as the secret for encryption and decryption operations.

- If the `APP_KEY` environment variable is not defined, the framework automatically generates a secure key on application startup.
- The key length must match the configured cipher: **16 bytes** for AES-128 or **32 bytes** for AES-256.

### Cipher (`APP_CIPHER`)

Defines the encryption algorithm used. The default value is `AES-256-CBC`.

Valid values:
- `AES-128-CBC`
- `AES-256-CBC`
- `AES-128-GCM`
- `AES-256-GCM`

**Example `.env` configuration**

```env
APP_KEY=your-32-byte-secret-key-here!!!!
APP_CIPHER=AES-256-GCM
```

## Usage via the `Crypt` Facade

The most straightforward way to use the encryption service is through the `Crypt` facade, which exposes the `encrypt` and `decrypt` methods as static calls.

**Import**

```python
from orionis.support.facades.encrypter import Crypt
```

### Encrypting a Value

```python
from orionis.support.facades.encrypter import Crypt

encrypted = Crypt.encrypt("sensitive information")
# Returns a base64-encoded string containing the encrypted payload
```

### Decrypting a Value

```python
from orionis.support.facades.encrypter import Crypt

plaintext = Crypt.decrypt(encrypted)
# Returns: "sensitive information"
```

### Complete Example

```python
from orionis.support.facades.encrypter import Crypt

# Encrypt
token = "my-secret-token-12345"
encrypted_token = Crypt.encrypt(token)
print(f"Encrypted: {encrypted_token}")

# Decrypt
original = Crypt.decrypt(encrypted_token)
print(f"Original: {original}")

# Verify
assert original == token
```

## Usage via Dependency Injection

You can also access the service through dependency injection using the `IEncrypter` contract:

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

In console commands, you can inject directly into the `handle` method:

```python
from orionis.console.base.command import BaseCommand
from orionis.services.encrypter.contracts.encrypter import IEncrypter

class EncryptDataCommand(BaseCommand):

    signature: str = "data:encrypt"
    description: str = "Encrypts a provided value"

    async def handle(self, encrypter: IEncrypter) -> None:
        value = self.ask("Enter the value to encrypt:")
        encrypted = encrypter.encrypt(value)
        self.success(f"Encrypted value: {encrypted}")
```

## `IEncrypter` Contract

The service implements the `IEncrypter` contract, an abstract class that defines two methods:

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

Encrypts a text string and returns a base64-encoded payload.

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `plaintext` | `str` | Text to encrypt. Cannot be empty. |

**Returns**: `str` — Base64-encoded encrypted payload.

**Exceptions**

| Exception | Cause |
|-----------|-------|
| `TypeError` | If `plaintext` is not a string. |
| `ValueError` | If `plaintext` is an empty string. |
| `RuntimeError` | If an error occurs during the encryption process. |

### `decrypt(payload: str) -> str`

Decrypts a payload previously generated by `encrypt` and returns the original text.

**Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `payload` | `str` | Encrypted payload in base64 format. |

**Returns**: `str` — Original decrypted text.

**Exceptions**

| Exception | Cause |
|-----------|-------|
| `TypeError` | If `payload` is not a string. |
| `ValueError` | If `payload` is empty, not valid base64, is missing required fields, or the cipher does not match. |
| `RuntimeError` | If an error occurs during the decryption process. |

## Payload Structure

The `encrypt` method generates a base64-encoded JSON payload with the following structure:

### CBC Payload

```json
{
    "iv": "<base64-encoded IV>",
    "value": "<base64-encoded ciphertext>",
    "tag": null,
    "cipher": "AES-256-CBC"
}
```

### GCM Payload

```json
{
    "iv": "<base64-encoded IV>",
    "value": "<base64-encoded ciphertext>",
    "tag": "<base64-encoded authentication tag>",
    "cipher": "AES-256-GCM"
}
```

**Payload fields**

| Field | Type | Description |
|-------|------|-------------|
| `iv` | `str` | Initialization vector (16 bytes in CBC, 12 bytes in GCM), base64-encoded. |
| `value` | `str` | Encrypted data, base64-encoded. |
| `tag` | `str \| null` | GCM authentication tag (16 bytes) base64-encoded. `null` in CBC mode. |
| `cipher` | `str` | Identifier of the cipher used. |

Each encryption operation generates a new random IV, ensuring that encrypting the same text twice always produces different payloads.

## Service Registration

The encryption service is registered in the application container via `EncrypterProvider`, a deferred provider that is only loaded when needed:

```python
from orionis.foundation.providers.encrypter_provider import EncrypterProvider
```

The provider:

- Registers `Encrypter` as a singleton bound to the `IEncrypter` contract.
- Initializes the `Crypt` facade during boot.
- Being deferred, it does not impact application startup time until the service is resolved.

## Internal Constants

The `Encrypter` class defines the following configuration constants:

| Constant | Value | Description |
|----------|-------|-------------|
| `AES_128_KEY_SIZE` | `16` | Key size in bytes for AES-128. |
| `AES_256_KEY_SIZE` | `32` | Key size in bytes for AES-256. |
| `CBC_IV_SIZE` | `16` | IV size in bytes for CBC mode. |
| `GCM_IV_SIZE` | `12` | IV size in bytes for GCM mode. |
| `GCM_TAG_SIZE` | `16` | Authentication tag size in bytes for GCM. |
| `PKCS7_BLOCK_SIZE` | `16` | Block size for PKCS7 padding. |

## Best Practices

- **Use GCM when possible**: GCM provides authenticated encryption, protecting both the confidentiality and integrity of data.
- **Protect your `APP_KEY`**: never include the encryption key in source code or version control repositories. Use environment variables.
- **Do not encrypt already encrypted data**: avoid accidental double encryption, which complicates decryption and increases payload size.
- **Use the `IEncrypter` contract for injection**: this facilitates testing and decouples your code from the concrete implementation.
- **Handle exceptions**: wrap decryption operations in `try/except` blocks to handle corrupt or incompatible payloads.

## Common Errors

**`ValueError`: Cipher not supported**

The cipher configured in `APP_CIPHER` is not valid. Verify it is one of: `AES-128-CBC`, `AES-256-CBC`, `AES-128-GCM`, `AES-256-GCM`.

**`ValueError`: Key must be N bytes**

The length of `APP_KEY` does not match the configured cipher. AES-128 requires 16 bytes and AES-256 requires 32 bytes.

**`ValueError`: Payload cipher does not match**

An attempt was made to decrypt a payload that was encrypted with a different algorithm than the one currently configured. Ensure you use the same cipher for both encryption and decryption.

**`RuntimeError`: Error during decryption**

The payload is corrupt, was modified, or a different key from the one used during encryption is being used.

## Notes

- The service uses Python's `cryptography` library for all cryptographic operations.
- IVs are randomly generated with `os.urandom` on each encryption operation, ensuring that identical payloads never produce the same result.
- CBC mode uses PKCS7 padding to align data to the AES block size.
- GCM mode does not require padding and provides integrity verification through the authentication tag.
- Payloads are self-describing: they include the cipher used, which facilitates validation during decryption.