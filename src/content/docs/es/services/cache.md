---
title: "Caché"
description: "Guarda en caché resultados que tu aplicación pueda reconstruir, como resúmenes del catálogo, datos de consulta o cálculos costosos. Conserva los datos permanentes en la base de…"
editUrl: true
lastUpdated: false
---

Guarda en caché resultados que tu aplicación pueda reconstruir, como resúmenes del catálogo, datos de consulta o cálculos costosos. Conserva los datos permanentes en la base de datos; decide cuánto tiempo puede quedar desactualizado un resultado y cuándo invalidarlo.

## Usar la caché configurada en tu aplicación

Empieza con el almacenamiento en archivos incluido en la instalación normal. Configura estos valores en el `.env` de tu aplicación antes del arranque:

```dotenv
CACHE_STORE=file
CACHE_PREFIX=my-app
```

El directorio predeterminado es `storage/framework/cache/data` y el proceso de la aplicación debe poder escribir allí. Este almacenamiento no requiere Redis ni un paquete adicional de caché. `config/cache.py` define los almacenes disponibles y sus opciones.

Invoca la fachada `Cache` desde un controlador, comando, job o servicio async después de iniciar la aplicación:

```python
from orionis.support.facades import Cache


async def remember_preferences(user_id: int, preferences: dict) -> dict:
    key = f"user:{user_id}:preferences:v1"
    await Cache.set(key, preferences, ttl=300)
    return await Cache.get(key)


async def invalidate_preferences(user_id: int) -> None:
    await Cache.delete(f"user:{user_id}:preferences:v1")
```

La primera función guarda un diccionario compatible con JSON durante 300 segundos y lo devuelve inmediatamente. Tras expirar o invalidarse, `get()` devuelve `None`. Autoriza al usuario y guarda los cambios permanentes antes de almacenarlos en caché; este ejemplo solo muestra las operaciones de caché.

Para calcular únicamente cuando falta un resultado, usa `await Cache.remember(key, 300, resolver)`: el resolver no recibe argumentos y puede ser async. Varias solicitudes simultáneas todavía pueden ejecutarlo más de una vez. Consulta la [guía de regeneración](/es/services/cache/stores-and-locks) cuando debas reducir ese trabajo duplicado.

## Elegir el siguiente paso

1. [Guardar y regenerar datos](/es/services/cache/caching-values): claves, TTL en segundos, cálculo ante una ausencia, lotes y contadores.
2. [Configurar almacenes y locks](/es/services/cache/stores-and-locks): elegir memoria, archivos, Redis, Memcached o base de datos según dónde deban compartirse los valores.
3. [Cachear artefactos derivados de código](/es/services/cache/source-artifacts): la API síncrona e independiente `FileBasedCache` para diccionarios compilados desde archivos fuente.

Usa `FileBasedCache` para artefactos compilados y la fachada `Cache` para valores habituales de tu aplicación. Ambas APIs tienen reglas diferentes de serialización e invalidación.
