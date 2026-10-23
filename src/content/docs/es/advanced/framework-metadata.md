---
title: "Metadata"
description: "Consulta la identidad, la versión instalada, los enlaces y el requisito de Python publicados por Orionis."
editUrl: true
lastUpdated: false
---

`orionis.metadata` publica información del **framework instalado**. Es útil para diagnósticos, pantallas de información y comandos. Son constantes de módulo: no existe una clase `Metadata`, una fachada ni un servicio que debas iniciar.

## Importación y uso directo

```python
from orionis.metadata import NAME, PYTHON_REQUIRES, VERSION

required_python = ".".join(map(str, PYTHON_REQUIRES))
print(f"{NAME} {VERSION}; Python {required_python}+")
```

También puedes importar los mismos nombres desde `orionis.metadata.framework`. Importarlos no requiere iniciar la aplicación, leer su configuración ni realizar una petición de red. `VERSION` identifica la versión del paquete, no la versión de tu aplicación ni la más reciente publicada.

## Constantes disponibles

Todas las cadenas son `str`; `PYTHON_REQUIRES` es una tupla de enteros. No reciben parámetros ni tienen métodos propios. Los valores se definen en el código del paquete instalado.

<a id="metadata-constant-name"></a>
<a id="metadata-constant-version"></a>
<a id="metadata-constant-description"></a>
<a id="metadata-constant-author"></a>
<a id="metadata-constant-author-email"></a>
<a id="metadata-constant-python-requires"></a>
<a id="metadata-constant-api"></a>
<a id="metadata-constant-docs"></a>
<a id="metadata-constant-framework"></a>
<a id="metadata-constant-skeleton"></a>

| Constante | Tipo | Propósito |
| --- | --- | --- |
| `NAME` | `str` | Nombre de la distribución: `orionis`. |
| `VERSION` | `str` | Versión del framework instalado; consúltala dinámicamente. |
| `DESCRIPTION` | `str` | Descripción del framework. |
| `AUTHOR` | `str` | Nombre del autor o mantenedor publicado por el paquete. |
| `AUTHOR_EMAIL` | `str` | Correo de contacto publicado por el paquete. |
| `PYTHON_REQUIRES` | `tuple[int, int]` | Versión mínima de Python como `(major, minor)`, actualmente `(3, 14)`. |
| `API` | `str` | URL de los metadatos JSON de la distribución en PyPI. |
| `DOCS` | `str` | URL raíz de la documentación. |
| `FRAMEWORK` | `str` | URL del repositorio del framework. |
| `SKELETON` | `str` | URL del repositorio del esqueleto de aplicación. |

Este ejemplo consulta cada valor sin fijar la versión del framework en el código:

```python
from orionis.metadata import (
    API, AUTHOR, AUTHOR_EMAIL, DESCRIPTION, DOCS,
    FRAMEWORK, NAME, PYTHON_REQUIRES, SKELETON, VERSION,
)

framework_info = {
    "name": NAME,
    "version": VERSION,
    "description": DESCRIPTION,
    "author": {"name": AUTHOR, "email": AUTHOR_EMAIL},
    "python_minimum": ".".join(map(str, PYTHON_REQUIRES)),
    "links": {
        "package_metadata": API,
        "documentation": DOCS,
        "source": FRAMEWORK,
        "skeleton": SKELETON,
    },
}
assert framework_info["name"] == "orionis"
assert isinstance(framework_info["version"], str)
```

Las URLs son datos. Leer `API` no descarga metadatos, no comprueba actualizaciones ni valida la disponibilidad del sitio. `API` no es la URL de tu aplicación ni la referencia de API del framework.

## Diagnosticar la compatibilidad de Python

Compara el mismo número de componentes de la versión:

```python
import sys
from orionis.metadata import PYTHON_REQUIRES

running = sys.version_info[:len(PYTHON_REQUIRES)]
if running < PYTHON_REQUIRES:
    required = ".".join(map(str, PYTHON_REQUIRES))
    raise RuntimeError(f"Orionis requires Python {required}+")
```

Esta comprobación resulta útil en un diagnóstico o lanzador independiente. El módulo no verifica por sí mismo la compatibilidad al importar sus constantes. `VERSION` tampoco interpreta versiones ni informa si una funcionalidad concreta está disponible.

## Uso en componentes e inyección

Puedes leer estas constantes directamente desde controladores, comandos, jobs o servicios. No son dependencias que el contenedor resuelva por su nombre: anotar un parámetro como `str` no inyecta `VERSION`.

Si necesitas una dependencia sustituible en pruebas, envuelve la lectura en un servicio de tu aplicación. La siguiente clase `FrameworkInfo` es un ejemplo propio, no una clase nativa de Orionis:

```python
from orionis.http import JSONResponse
from orionis.metadata import NAME, VERSION

class FrameworkInfo:
    def describe(self) -> dict[str, str]:
        return {"name": NAME, "version": VERSION}

class InformationController:
    def __init__(self, info: FrameworkInfo) -> None:
        self.info = info

    async def __call__(self) -> JSONResponse:
        return JSONResponse(self.info.describe())
```

El contenedor puede construir `FrameworkInfo` sin argumentos y pasarlo al controlador. Si organizas ambas clases en archivos distintos, importa el servicio desde su módulo en el controlador. Consulta [resolución e invocación](/es/architecture/service-container/bindings-and-invocation) para sustituirlo por otra implementación.

Las mayúsculas expresan la intención de tratar estos datos como constantes; Python no impide reasignar atributos del módulo. Mantén la versión de tu aplicación en su propia configuración y evita modificar los metadatos del framework.
