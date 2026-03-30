---
title: Guía de Contribución
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Guía de Contribución

Bienvenido/a a la guía oficial para contribuir a **Orionis Framework**. Aquí encontrarás las mejores prácticas, requisitos y flujos de trabajo para colaborar de manera efectiva, garantizando calidad, seguridad y coherencia en cada aporte.

---

## Repositorios oficiales

El código fuente de Orionis Framework se gestiona en GitHub. Cada componente del ecosistema cuenta con su propio repositorio:

| Repositorio | Descripción |
|---|---|
| [Orionis Framework](https://github.com/orionis-framework/framework) | Núcleo del framework |
| [Orionis Skeleton](https://github.com/orionis-framework/skeleton) | Plantilla base para nuevos proyectos |

---

## Flujo de contribución

A continuación se describe el proceso general para aportar al proyecto:

1. **Haz un fork** del repositorio en el que deseas contribuir.
2. **Crea una rama** desde la rama base apropiada (consulta la sección [Estrategia de ramas](#estrategia-de-ramas)).
3. **Implementa los cambios** siguiendo las convenciones de estilo y calidad del proyecto.
4. **Incluye pruebas** que validen el comportamiento nuevo o modificado.
5. **Ejecuta el análisis estático** con Ruff y SonarQube antes de abrir tu PR.
6. **Abre un Pull Request** y márcalo como *Ready for review* cuando esté listo.
7. **Responde al feedback** de los revisores y realiza los ajustes necesarios.

:::tip[Consejo]
Los PR serán revisados únicamente cuando estén marcados como **"Ready for review"** y todas las pruebas asociadas estén aprobadas. Los PR inactivos en estado de "borrador" podrán ser cerrados tras algunos días, según lo determinen los mantenedores.
:::

---

## Reporte de errores

Para una colaboración eficiente, **envía siempre tus correcciones mediante Pull Requests** en vez de reportar errores por correo o foros. Todo ajuste debe incluir pruebas que validen su funcionamiento.

Al reportar un error, incluye:

- Un **título claro y conciso** que describa el problema.
- Una **descripción detallada** con el comportamiento esperado vs. el obtenido.
- **Pasos para reproducir** el error de forma consistente.
- **Información del entorno**: versión de Python, sistema operativo y versión de Orionis.
- Un **ejemplo de código reproducible** mínimo.

:::caution[Advertencias erróneas en herramientas]
Si detectas advertencias incorrectas en tu IDE, SonarQube, Ruff u otras herramientas al usar Orionis Framework, **no crees un issue en GitHub**. En su lugar, envía un PR para corregir el inconveniente directamente.
:::

---

## Discusión sobre el desarrollo

¿Tienes ideas para nuevas características o mejoras? Compártelas en el [tablero de discusiones de GitHub](https://github.com/orgs/orionis-framework/discussions). Se recomienda estar dispuesto a colaborar en la implementación, ya sea aportando código o ayudando en el desarrollo.

No todas las propuestas serán aceptadas; los mantenedores evaluarán cada sugerencia considerando la visión, los objetivos y la hoja de ruta del proyecto. Las propuestas deben aportar valor real y priorizar soluciones que beneficien a la comunidad.

---

## Estrategia de ramas

Elige la rama destino de tu PR según el tipo de cambio:

| Tipo de cambio | Rama destino | Ejemplo |
|---|---|---|
| Corrección de errores | Última versión estable | `1.x` |
| Mejoras menores y compatibles | Última versión estable | `1.x` |
| Nuevas características o cambios incompatibles | `master` | — |

:::note[Nota]
No envíes correcciones a `master` salvo que el error afecte exclusivamente a funcionalidades de la próxima versión principal.
:::

---

## Pruebas

Toda contribución **debe incluir pruebas** que validen los cambios realizados. Se espera que:

- Los **bug fixes** incluyan al menos un test que reproduzca el error corregido.
- Las **nuevas funcionalidades** incluyan tests unitarios y, cuando corresponda, tests de integración.
- Las pruebas sigan las convenciones existentes del proyecto en cuanto a estructura y nomenclatura.

Antes de abrir tu PR, verifica que **todas las pruebas pasen correctamente** ejecutando la suite completa del proyecto.

---

## Archivos compilados

:::danger[Importante]
No incluyas archivos compilados ni artefactos generados en tus PR. Estos se producen automáticamente a partir del código fuente y **serán rechazados** si se detectan. Esto garantiza la integridad y trazabilidad del proyecto.
:::

---

## Vulnerabilidades de seguridad

Si descubres una vulnerabilidad de seguridad, **no la publiques como un issue público**. En su lugar, envía un correo electrónico a **Raul M. Uñate** a <a href="mailto:raulmauriciounate@gmail.com">raulmauriciounate@gmail.com</a>. Todas las vulnerabilidades serán atendidas con prioridad y de forma confidencial.

---

## Estilo de código

Orionis sigue convenciones propias de estilo, alineadas con frameworks web modernos. Estos son los requisitos obligatorios para todo código:

- **Documentación**: Toda función, clase o método debe incluir docstrings en formato **NumPyDoc**.
- **Anotaciones de tipos**: Todos los parámetros y valores de retorno deben estar tipados con *type hints*.
- **Legibilidad**: El código debe ser claro, coherente y seguir las convenciones del proyecto.

### Convención de nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Clases | *PascalCase* | `EmailService` |
| Métodos | *camelCase* | `sendEmail` |
| Funciones | *snake_case* | `validate_input` |
| Constantes | *UPPER_SNAKE_CASE* | `MAX_RETRIES` |

### Ejemplo: clase con método

```python
class EmailService:

    def sendNotification(self, recipient: str, subject: str) -> bool:
        """
        Envía una notificación por correo electrónico.

        Parameters
        ----------
        recipient : str
            Dirección de correo del destinatario.
        subject : str
            Asunto del correo electrónico.

        Returns
        -------
        bool
            True si el envío fue exitoso, False en caso contrario.
        """
        return True
```

### Ejemplo: función independiente

```python
def parse_config_file(file_path: str, encoding: str = "utf-8") -> dict:
    """
    Lee y parsea un archivo de configuración.

    Parameters
    ----------
    file_path : str
        Ruta absoluta al archivo de configuración.
    encoding : str, optional
        Codificación del archivo. Por defecto es 'utf-8'.

    Returns
    -------
    dict
        Diccionario con los pares clave-valor de la configuración.
    """
    return {}
```

---

## Análisis estático

Orionis Framework utiliza dos herramientas complementarias para asegurar la calidad del código:

| Herramienta | Propósito |
|---|---|
| [Ruff](https://github.com/astral-sh/ruff) | Linting y formateo de código |
| [SonarQube](https://www.sonarqube.org/) | Análisis estático de calidad y seguridad |

**Todo el código debe pasar ambos análisis** sin advertencias ni errores antes de enviar un PR.

### Ruff

Configura tu entorno para ejecutar Ruff y corrige cualquier advertencia antes de enviar tu contribución:

```bash
ruff check .
```

### Configuración de SonarLint para VSCode

Si usas **Visual Studio Code**, aplica la siguiente configuración en tu archivo `settings.json`:

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

:::note[Nota]
Esta configuración es específica para VSCode. Si usas otro IDE, adapta las reglas según la documentación de SonarQube/SonarLint para tu entorno.
:::

### Referencia de reglas personalizadas

| Regla | Estado | Descripción |
|---|---|---|
| `python:S100` | Activa (personalizada) | Permite nombres de métodos en *camelCase* y con guiones bajos iniciales, alineados con el estilo del framework. |
| `python:S1542` | Activa (personalizada) | Refuerza la consistencia en la nomenclatura de funciones y métodos. |
| `python:S2638` | Desactivada | Incompatible con la sintaxis de inyección de dependencias utilizada en Orionis. |

### Complejidad cognitiva (`python:S3776`)

Algunos métodos pueden superar el límite de complejidad cognitiva por defecto de **15**. En esos casos:

- **No desactives la regla globalmente.**
- Usa `# NOSONAR` con moderación y solo cuando la complejidad sea justificada y revisada.

```python
def metodo_complejo(...):  # NOSONAR
    # Lógica compleja que requiere excepción documentada
    ...
```

:::caution[Precaución]
Considera aumentar el umbral de complejidad solo si es estrictamente necesario y justificado por la naturaleza del problema. Documenta la razón en un comentario o en la descripción del PR.
:::

---

¡Gracias por contribuir a Orionis Framework! Tu colaboración ayuda a mejorar la calidad y la experiencia de desarrollo para toda la comunidad.
