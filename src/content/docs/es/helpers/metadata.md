---
title: 'Metadatos'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Metadatos del Framework

Orionis Framework expone un módulo de metadatos que centraliza la información de identidad, versión, autoría y recursos del proyecto. Este módulo se encuentra en `orionis.metadata.framework` y contiene un conjunto de constantes que describen las propiedades fundamentales del framework.

Estas constantes son utilizadas internamente por el framework para:

- Identificar el paquete en el ecosistema de Python (PyPI).
- Validar la versión mínima del intérprete requerida.
- Generar mensajes de diagnóstico, logs y salidas de consola.
- Referenciar repositorios, documentación y endpoints de la API pública.

También están disponibles para los desarrolladores de aplicaciones que necesiten consultar información del framework en tiempo de ejecución, por ejemplo, para incluirla en pantallas de diagnóstico, reportes de errores o integraciones con servicios de monitoreo.

## Importación

Puedes importar las constantes de forma individual o acceder al módulo completo:

**Importación individual**

```python
from orionis.metadata.framework import NAME, VERSION, AUTHOR
```

**Importación del módulo completo**

```python
from orionis.metadata import framework as fw

print(fw.NAME)       # "orionis"
print(fw.VERSION)    # "0.756.0"
```

## Referencia de Constantes

### `NAME`

Nombre del paquete tal como está registrado en PyPI.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Valor** | `"orionis"` |
| **Formato** | Minúsculas, sin espacios |

```python
from orionis.metadata.framework import NAME

print(NAME)  # "orionis"
```

### `VERSION`

Versión actual del framework, siguiendo el esquema de versionado semántico con segmentos numéricos separados por puntos.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Formato** | `MAYOR.MENOR.PARCHE` (ej. `"0.756.0"`) |

```python
from orionis.metadata.framework import VERSION

print(VERSION)  # "0.756.0"
```

Esta constante es útil para validaciones de compatibilidad o para mostrar la versión en la interfaz de usuario:

```python
from orionis.metadata.framework import VERSION

segments = VERSION.split(".")
major, minor, patch = int(segments[0]), int(segments[1]), int(segments[2])
```

### `AUTHOR`

Nombre completo del autor o mantenedor principal del proyecto.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Valor** | `"Raul Mauricio Uñate Castro"` |

```python
from orionis.metadata.framework import AUTHOR
```

### `AUTHOR_EMAIL`

Dirección de correo electrónico del autor o mantenedor principal.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Valor** | `"raulmauriciounate@gmail.com"` |
| **Formato** | Dirección de email válida |

```python
from orionis.metadata.framework import AUTHOR_EMAIL
```

### `DESCRIPTION`

Descripción breve del proyecto que identifica su propósito dentro del ecosistema Python.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Valor** | `"Orionis Framework — Async-first full-stack framework for modern Python applications."` |

```python
from orionis.metadata.framework import DESCRIPTION
```

### `SKELETON`

URL del repositorio de la plantilla de inicio (skeleton), utilizado para crear nuevos proyectos basados en Orionis Framework.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Valor** | `"https://github.com/orionis-framework/skeleton"` |
| **Protocolo** | HTTPS |

```python
from orionis.metadata.framework import SKELETON
```

### `FRAMEWORK`

URL del repositorio principal del framework.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Valor** | `"https://github.com/orionis-framework/framework"` |
| **Protocolo** | HTTPS |

```python
from orionis.metadata.framework import FRAMEWORK
```

### `DOCS`

URL de la documentación oficial del framework.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Valor** | `"https://orionis-framework.com/"` |
| **Protocolo** | HTTPS |

```python
from orionis.metadata.framework import DOCS
```

### `API`

URL del endpoint JSON de PyPI para consultar información del paquete de forma programática.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `str` |
| **Valor** | `"https://pypi.org/pypi/orionis/json"` |
| **Protocolo** | HTTPS |

```python
from orionis.metadata.framework import API

# Ejemplo: consultar la última versión desde PyPI
import urllib.request
import json

with urllib.request.urlopen(API) as response:
    data = json.loads(response.read())
    latest = data["info"]["version"]
    print(f"Última versión en PyPI: {latest}")
```

### `PYTHON_REQUIRES`

Tupla que indica la versión mínima de Python requerida para ejecutar el framework.

| Propiedad | Valor |
|-----------|-------|
| **Tipo** | `tuple[int, int]` |
| **Valor** | `(3, 14)` |
| **Formato** | `(MAYOR, MENOR)` |

```python
from orionis.metadata.framework import PYTHON_REQUIRES

print(PYTHON_REQUIRES)  # (3, 14)
```

Esta constante puede usarse para validar el entorno en tiempo de ejecución:

```python
import sys
from orionis.metadata.framework import PYTHON_REQUIRES

if sys.version_info[:2] < PYTHON_REQUIRES:
    raise RuntimeError(
        f"Orionis requiere Python {PYTHON_REQUIRES[0]}.{PYTHON_REQUIRES[1]} o superior. "
        f"Versión actual: {sys.version_info[0]}.{sys.version_info[1]}"
    )
```

## Resumen de Constantes

| Constante | Tipo | Descripción |
|-----------|------|-------------|
| `NAME` | `str` | Nombre del paquete (`"orionis"`) |
| `VERSION` | `str` | Versión actual del framework |
| `AUTHOR` | `str` | Nombre del autor principal |
| `AUTHOR_EMAIL` | `str` | Email de contacto del autor |
| `DESCRIPTION` | `str` | Descripción del proyecto |
| `SKELETON` | `str` | URL del repositorio skeleton |
| `FRAMEWORK` | `str` | URL del repositorio del framework |
| `DOCS` | `str` | URL de la documentación oficial |
| `API` | `str` | URL del endpoint JSON de PyPI |
| `PYTHON_REQUIRES` | `tuple[int, int]` | Versión mínima de Python requerida |

## Ubicación del Módulo

El módulo de metadatos está ubicado en la siguiente ruta dentro del código fuente del framework:

```
orionis/
└── metadata/
    └── framework.py
```

Puedes acceder tanto al módulo completo (`orionis.metadata.framework`) como al paquete contenedor (`orionis.metadata`), que expone el submódulo `framework` como atributo.

## Notas

- Todas las URLs utilizan el protocolo HTTPS.
- Cada URL es única y apunta a un recurso distinto dentro del ecosistema de Orionis Framework.
- `PYTHON_REQUIRES` es compatible con `sys.version_info` para comparaciones directas de versión.
- `NAME` sigue las convenciones de nomenclatura de paquetes de Python: minúsculas, sin espacios.
- `VERSION` sigue un patrón numérico con segmentos separados por puntos, donde cada segmento es un entero.