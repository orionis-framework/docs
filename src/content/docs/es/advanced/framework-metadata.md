---
title: "Metadatos y compatibilidad de Orionis"
description: "Usa orionis.metadata para mostrar la versión instalada del framework en el diagnóstico de tu aplicación, una pantalla de información o un comando. Los valores proceden del…"
editUrl: true
lastUpdated: false
---

Usa `orionis.metadata` para mostrar la versión instalada del framework en el diagnóstico de tu aplicación, una pantalla de información o un comando. Los valores proceden del paquete instalado; importarlos no necesita iniciar la aplicación, un archivo de configuración ni una petición de red.

## Mostrar la versión instalada

Este ejemplo completo funciona donde Orionis esté instalado:

```python
from orionis.metadata import NAME, PYTHON_REQUIRES, VERSION

required_python = ".".join(map(str, PYTHON_REQUIRES))
print(f"{NAME} {VERSION}; Python {required_python}+")
```

`VERSION` identifica el framework Orionis instalado, no la versión de tu aplicación. Mantén separados ambos versionados. `PYTHON_REQUIRES` representa el mínimo del intérprete como tupla, actualmente `(3, 14)`.

## Constantes disponibles

| Constante | Uso desde la aplicación |
|---|---|
| `NAME` | Identidad de distribución/importación, `orionis`. |
| `VERSION` | Cadena de versión del framework instalado. |
| `DESCRIPTION` | Descripción del framework. |
| `AUTHOR` / `AUTHOR_EMAIL` | Identidad y contacto de su mantenedor. |
| `PYTHON_REQUIRES` | Tupla `(major, minor)` mínima de Python. |
| `API` | Endpoint JSON de PyPI para la distribución. |
| `DOCS` | Raíz de la documentación. |
| `FRAMEWORK` | Repositorio fuente del framework. |
| `SKELETON` | Repositorio del esqueleto de aplicación. |

Las cadenas y la tupla son metadatos de la versión; trátalas como valores de solo lectura. `API` apunta a metadatos del paquete en PyPI, no a una API de tu aplicación ni al sitio de referencia API del framework. Importar una constante URL no contacta ese destino ni comprueba su disponibilidad.

## Comprobar compatibilidad del intérprete

```python
import sys
from orionis.metadata import PYTHON_REQUIRES

running = sys.version_info[: len(PYTHON_REQUIRES)]
if running < PYTHON_REQUIRES:
    required = ".".join(map(str, PYTHON_REQUIRES))
    raise RuntimeError(f"Orionis requires Python {required}+")
```

Compara la misma cantidad de componentes. La instalación normal ya aplica `requires-python`; esta comprobación resulta útil para un diagnóstico o lanzador independiente. Un wheel instalado puede no contener el `pyproject.toml` del repositorio, así que usa las constantes exportadas en vez de buscar ese archivo desde tu aplicación.

`VERSION` es una cadena de versión, no un parser PEP 440 ni una consulta de funcionalidades soportadas. Determina el comportamiento a partir de la documentación y API pública de la versión instalada. El módulo no tiene configuración, proveedor, fachada ni estado por petición.

Referencia de implementación: [framework.py](https://github.com/orionis-framework/framework/blob/470229f78a5db61263ce887bcdd16bc98f9141db/orionis/metadata/framework.py).
