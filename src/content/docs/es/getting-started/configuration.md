---
title: "Configuración tipada y valores en ejecución"
description: "Edita los valores de cada entorno en el .env del proyecto y conserva su APP_KEY existente. Por ejemplo:"
editUrl: true
lastUpdated: false
---

## Configurar un proyecto generado

Define los valores de cada instalación siguiendo la guía independiente de [Entorno](/es/architecture/environment). Allí se documentan `.env`, la lectura exclusiva desde `config/`, el tipado y la persistencia JSON del bootstrap.

Durante la ejecución, lee los ajustes resueltos mediante `app.config("app.name")` o una `IApplication` inyectada. Esta página explica cómo se reúne, valida y consulta esa configuración.

## Configuración

Foundation construye defaults nativos independientes, mezcla datos `withConfig...` y luego dataclasses congeladas descubiertas. Así, entidades `config/*.py` son la fuente final normal. Tras validar, el snapshot se congela profundamente.

Secciones core:

| Sección | Responsabilidad principal |
|---|---|
| `app`, `auth`, `session` | Identidad, entorno, cifrado, guards, cookies y sesiones. |
| `http`, `mcp`, `realtime` | HTTP/seguridad, orígenes y límites realtime. |
| `database`, `cache`, `queue`, `scheduler` | Conexiones, stores, workers y estado programado. |
| `filesystems`, `mail`, `logging`, `view` | Storage, entrega, canales y templates. |
| `hashing`, `testing` | Passwords y test runner. |

Las entidades son dataclasses congeladas que normalizan dicts/enums anidados. Variables de entorno se leen en default factories; consulta cada subsistema para todas las opciones.

## Ejemplos

### Validar configuración nativa

Este ejemplo independiente demuestra la validación. La clave fija es exclusivamente de prueba; conserva en tu aplicación la clave privada generada.

```python
from orionis.foundation.config.app import App, Cipher, Environments

config = App(
    name="Docs",
    env=Environments.TESTING,
    debug=False,
    cipher=Cipher.AES_256_GCM,
    key=b"k" * 32,
)
assert config.env == "testing"
assert config.cipher == "AES-256-GCM"
assert config.key == b"k" * 32
print(config.name, config.env, config.cipher)
```

## Precedencia y alcance de los cambios

La combinación se realiza por sección con `dict.update`: defaults nativos → valores de `withConfig...` → dataclasses descubiertas. No es una combinación recursiva universal. Al reemplazar un diccionario anidado, proporciona sus opciones necesarias o usa la entidad nativa correspondiente. Para secciones de aplicación, las dataclasses de `config/` se aplican al final y pueden reemplazar un valor pasado en bootstrap.

`config(key, value)` admite `None` como valor explícito porque distingue un argumento omitido mediante un sentinel. Los cambios viven en el proceso actual y no se escriben en `.env`, dataclasses ni otros workers. Un manager ya creado puede haber capturado sus opciones: cambiar `config()` no promete reconfigurarlo. Para cambiar una clave criptográfica, conexión o driver, configura el arranque y reinicia los procesos según la operación del servicio.

Los indicadores `isProduction()` e `isDebug()` se calculan al crear la aplicación; no los uses para comprobar si un cambio posterior de `config()` se propagó. `BaseExceptionHandler`, por ejemplo, consulta `app.debug` en su ruta de error, mientras otros componentes pueden tener snapshots.

## Configuración propia

Una dataclass frozen declarada en `config/payments.py` se descubre como sección `payments`. Mantén esta configuración libre de I/O de red: se importa y construye durante el arranque. El nombre de sección procede del módulo, no del nombre de clase. Este es el contenido completo del archivo; léelo después de `create()` mediante `app.config("payments.currency")`.

```python
from dataclasses import dataclass

@dataclass(frozen=True, kw_only=True)
class Payments:
    currency: str = "USD"
    receipt_limit: int = 100
```

## Referencia y próximos pasos

[application.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/application.py) · [core_config.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/core_config.py) · [app.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/foundation/config/app/entities/app.py)

[Volver al índice del módulo](/es/getting-started).
