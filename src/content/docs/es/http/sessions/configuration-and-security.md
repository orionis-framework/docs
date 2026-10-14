---
title: "Cookies, renovación y ciclo seguro"
description: "Configura sesiones en config/session.py. La configuración congelada valida nombre, política de cookie, driver e intervalos durante el arranque. Las opciones ambientales se leen…"
editUrl: true
lastUpdated: false
---

Configura sesiones en `config/session.py`. La configuración congelada valida nombre, política de cookie, driver e intervalos durante el arranque. Las opciones ambientales se leen al construir el bootstrap; cambiar el entorno de un worker ya iniciado no es un mecanismo de reconfiguración por petición.

| Variable | Predeterminado | Efecto |
|---|---|---|
| `SESSION_DRIVER` | `memory` | Store de servidor. |
| `SESSION_LIFETIME` | 120 minutos | Expiración del registro. |
| `SESSION_EXPIRE_ON_CLOSE` | falso | Omite Max-Age de cookie; no elimina el plazo de servidor. |
| `SESSION_RENEWAL_INTERVAL` | 0 segundos | Mínimo entre renovaciones de datos escalares sin cambios. |
| `SESSION_TRACK_PREVIOUS_URL` | verdadero | Seguimiento de navegación elegible. |
| `SESSION_COOKIE`, `SESSION_PATH`, `SESSION_DOMAIN` | `sessionid`, `/`, host actual | Identidad y alcance de cookie. |
| `SESSION_SECURE`, `SESSION_HTTP_ONLY` | falso, verdadero | HTTPS y acceso a scripts. |
| `SESSION_SAME_SITE`, `SESSION_PARTITIONED` | `lax`, falso | Política entre sitios y atributo Partitioned. |

En producción HTTPS configura Secure. `SameSite=None` requiere Secure. El intervalo de renovación debe ser no negativo y menor que lifetime en segundos. Un intervalo positivo reduce escrituras/cookies en lecturas de datos escalares sin cambios; los datos mutables o dirty siguen guardándose. No constituye una garantía de actividad ni evita todas las escrituras.

El ejemplo siguiente construye un valor de configuración para ilustrar sus opciones; no lo instala en la aplicación en ejecución. Aplica los ajustes equivalentes en `config/session.py` o en las variables de entorno que lea ese archivo y reinicia los workers. Para desarrollo local por HTTP conserva `secure=False`; el navegador solo envía cookies Secure por HTTPS.

```python
from orionis.foundation.config.session import Session as SessionConfig

config = SessionConfig(driver="memory", lifetime=120, renewal_interval=300,
                       secure=True, http_only=True, same_site="none")
assert config.renewal_interval == 300
```

## Rotar después de cambiar privilegios

```python
from orionis.session.session import Session

session = Session()
session.put("account", 7)
old_id = session.id
session.regenerate()
assert session.wantsRegenerate
assert session.id == old_id
session.invalidate()
assert session.invalidated
```

`regenerate()` solicita una rotación; el ID no cambia inmediatamente. El manager coordina la eliminación del anterior y persistencia del nuevo al guardar la respuesta. La API de login de Auth ya integra rotación: no implementes un flujo paralelo que evite su contexto. `invalidate()` limpia datos y marca eliminación/cookie expirada. `clear()` solo elimina valores; no equivale a logout seguro.

## Recuperación y fallos

Cookies ausentes, malformadas, expiradas o registros corruptos producen una sesión nueva y perezosa. No se pasa un ID inválido al backend. Un error de almacenamiento no se convierte silenciosamente en una cookie que promete persistencia inexistente; inspecciona `SessionStorageException` y el error del backend.

`SessionManager.start(request)`, `save(response, session)` y `abort(session)` son operaciones asíncronas de infraestructura. El middleware debe ser su dueño para no guardar dos veces. `abort` elimina IDs invalidados o reemplazados cuando hay error/cancelación; no genera una nueva cookie. La persistencia condicional impide que una petición tardía vuelva a crear un registro de sesión revocado.

No compartas objetos `Session` entre requests ni asumas que HttpOnly impide CSRF. Mantén [la protección CSRF](/es/http/middleware-and-security), y usa [Auth](/es/security/authentication) para identidad. La sesión no incorpora por sí sola cifrado de cada payload de store.
