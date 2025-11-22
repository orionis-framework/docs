---
title: Guía de Contribución Mejorada
---

# Guía de Contribución

Bienvenido/a a la guía oficial para contribuir a Orionis Framework. Aquí encontrarás las mejores prácticas y requisitos para colaborar de manera efectiva, garantizando calidad, seguridad y coherencia en el desarrollo.

## Reporte de Errores

Para una colaboración eficiente, **envía siempre tus correcciones mediante pull requests (PR)** en vez de reportar errores por correo o foros. Los PR serán revisados únicamente cuando estén marcados como "listos para revisión" (no en estado de "borrador") y todas las pruebas asociadas estén aprobadas. Todo ajuste debe incluir pruebas que validen su funcionamiento.

Los PR inactivos en estado de "borrador" podrán ser cerrados tras algunos días, según lo determinen los mantenedores.

Al reportar un error, incluye un **título claro, descripción detallada, información relevante y un ejemplo de código reproducible**. Esto facilita la colaboración y la resolución rápida del problema.

Si detectas advertencias incorrectas en el IDE, SonarQube, Ruff u otras herramientas al usar Orionis Framework, **no crees un issue en GitHub**. En su lugar, envía un PR para corregir el inconveniente.

El código fuente de Orionis Framework se gestiona en GitHub, con repositorios específicos para cada proyecto basado en Laravel:

- [Orionis Skeleton](https://github.com/orionis-framework/skeleton)
- [Orionis Framework](https://github.com/orionis-framework/framework)

## Discusión sobre el Desarrollo del Framework

¿Tienes ideas para nuevas características o mejoras? Compártelas en el [tablero de discusiones de GitHub](https://github.com/orgs/orionis-framework/discussions). Se recomienda estar dispuesto a colaborar en la implementación, ya sea aportando código o ayudando en el desarrollo.

No todas las propuestas serán aceptadas; los mantenedores revisarán cada sugerencia considerando la visión y los objetivos del proyecto. Las propuestas deben aportar valor real al framework y priorizar soluciones que beneficien a la comunidad.

## ¿A qué rama debo enviar mi contribución?

- **Correcciones de errores:** Envía tus correcciones a la rama de la versión estable más reciente (por ejemplo, `1.x`). No envíes correcciones a `master` salvo que el error afecte exclusivamente a funcionalidades de la próxima versión principal.
- **Mejoras menores y compatibles:** Envía también a la rama estable más reciente.
- **Nuevas características o cambios incompatibles:** Envía a la rama `master`, que representa el desarrollo de la próxima versión principal.

## Archivos Compilados

No incluyas archivos compilados en tus PR. Estos se generan automáticamente a partir del código fuente y **serán rechazados** si se detectan en los PR. Esto garantiza la integridad y seguridad del proyecto.

## Vulnerabilidades de Seguridad

Si descubres una vulnerabilidad de seguridad, **envía un correo electrónico a Raul M Uñate** a <a href="mailto:raulmauriciounate@gmail.com">raulmauriciounate@gmail.com</a>. Todas las vulnerabilidades serán atendidas con prioridad.

## Estilo de Código y Análisis Estático

Orionis sigue convenciones propias de estilo de código, alineadas con frameworks web modernos. **Todo el código debe pasar el análisis estático con [Ruff](https://github.com/astral-sh/ruff)** y no debe generar advertencias ni errores.

- Toda función, clase o método agregado o modificado debe incluir documentación en formato NumPyDoc.
- Toda función, clase o método debe incluir anotaciones de tipos (type hints) para parámetros y valores de retorno.
- El código debe ser legible, coherente y seguir las convenciones establecidas en el proyecto.

Ejemplo:

```python
def ejemplo_funcion(param1: int, param2: str) -> bool:
    """
    Esta es una función de ejemplo que demuestra las anotaciones de tipos y la documentación en formato NumPyDoc.

    Parameters
    ----------
    param1 : int
        Descripción del primer parámetro.
    param2 : str
        Descripción del segundo parámetro.

    Returns
    -------
    bool
        Descripción del valor de retorno.
    """
    return True
```

### Excepciones de reglas de estilo

El framework está inspirado en la convención de nomenclatura de **frameworks web modernos**. Es necesario ajustar SonarQube/SonarLint para evitar falsos positivos durante el análisis estático.

## Análisis Estático con SonarQube y Ruff

Orionis Framework utiliza **SonarQube** como herramienta principal para el análisis estático de código y calidad. Además, **Ruff** es la herramienta oficial para linting y formato en Orionis Framework. Todo el código debe pasar ambos análisis antes de enviar un PR.

Configura tu entorno para ejecutar `ruff check .` y corrige cualquier advertencia o error antes de enviar tu contribución.

### Configuración recomendada para VSCode

Si usas **Visual Studio Code**, puedes aplicar la siguiente configuración en tu archivo `settings.json` para SonarLint. En otros IDE, consulta la documentación correspondiente para adaptar las reglas, ya que la configuración puede variar.

```json
"sonarlint.rules": {
    "python:S100": {
        "level": "on",
        "parameters": {
            "format": "^_{0,2}[a-z][a-zA-Z0-9_]*_{0,2}$"
        }
    },
    "python:S2638": {
        "level": "off"
    },
    "python:S1542": {
        "level": "on",
        "parameters": {
            "format": "^_{0,2}[a-z][a-zA-Z0-9_]*_{0,2}$"
        }
    }
},
"sonarlint.automaticAnalysis": true
```

> **Nota:** Esta configuración es específica para VSCode. Si usas otro IDE, deberás adaptar las reglas según la documentación de SonarQube/SonarLint para ese entorno.

### Explicación de las reglas

- **`python:S100`**: Permite nombres de métodos con guiones bajos iniciales o estructura camelCase, alineados con el estilo del framework.
- **`python:S2638`**: Se desactiva por incompatibilidad con la sintaxis de inyección de dependencias.
- **`python:S1542`**: Refuerza la consistencia en la nomenclatura de métodos.

## Manejo de Complejidad Cognitiva (`python:S3776`)

Algunos métodos pueden superar el límite de complejidad cognitiva por defecto de **15**.

### Recomendación

- **No desactivar la regla globalmente**.
- Usa `# NOSONAR` con moderación y solo cuando la complejidad sea justificada.

```python
def metodo_complejo(...):  # NOSONAR
    # Lógica compleja que requiere excepción
    ...
```

> **Nota:** Considera aumentar el umbral solo si es estrictamente necesario y justificado por la naturaleza del problema.

---

¡Gracias por contribuir a Orionis Framework! Tu colaboración ayuda a mejorar la calidad y experiencia de desarrollo para toda la comunidad.
