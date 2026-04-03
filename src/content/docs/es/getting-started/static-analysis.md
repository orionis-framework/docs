---
title: Especificaciones SonarQube y Ruff
---

# Configuración de análisis estático para aplicaciones Orionis

Orionis Framework adopta convenciones de nomenclatura y patrones de diseño inspirados en **frameworks web modernos** (Laravel, NestJS, etc.), lo que genera falsos positivos en herramientas de análisis estático con configuración por defecto. Este documento describe las reglas que **deben configurarse obligatoriamente** tanto en **SonarQube/SonarLint** como en **Ruff** al trabajar sobre aplicaciones Orionis.

---

## SonarQube / SonarLint

### Configuración obligatoria en `settings.json`

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

### Descripción de cada regla

| Regla | Acción | Motivo |
|---|---|---|
| `python:S100` | Reconfigurar formato | Orionis permite nombres de métodos con prefijos de guión bajo y estructura camelCase (`_metodo`, `miMetodo`), siguiendo el estilo de frameworks web modernos. El patrón `^_{0,2}[a-z][a-zA-Z0-9_]*_{0,2}$` habilita esta convención. |
| `python:S2638` | Desactivar | Esta regla no reconoce la sintaxis implícita de inyección de dependencias del framework, generando falsos positivos en firmas de métodos válidas. |
| `python:S1542` | Reconfigurar formato | Aplica el mismo patrón de nomenclatura que `S100` pero para funciones definidas con `def`, garantizando consistencia en todo el código base. |

### Manejo de complejidad cognitiva (`python:S3776`)

Algunos métodos del framework, por la naturaleza del problema que resuelven, pueden superar el umbral de complejidad cognitiva por defecto (**15**).

**No desactivar la regla globalmente.** En su lugar, usar `# NOSONAR` únicamente sobre el método afectado:

```python
def metodo_complejo(...):  # NOSONAR
    # Lógica que justifica la excepción puntual
    ...
```

> Usar `# NOSONAR` con criterio y solo cuando la complejidad sea estructuralmente inevitable. Para múltiples casos, valorar aumentar el umbral de complejidad en la configuración del proyecto.

---

## Ruff

### Configuración global obligatoria en `ruff.toml`

```toml
[lint]
select = ["ALL"]
ignore = [
    "N818",
    "D100",
    "N802",
    "D104",
    "D101",
    "I001",
    "I002",
    "TRY301",
    "TRY300",
    "INP001"
]
exclude = [
    "test/*"
]

[lint.pydocstyle]
convention = "numpy"
```

#### Reglas globalmente ignoradas

| Regla | Motivo |
|---|---|
| `N818` | Orionis define excepciones con sufijos propios (`*Exception`, `*Failure`), no forzados a terminar en `Error`. |
| `D100` | Los módulos no requieren docstring a nivel de módulo; la documentación se gestiona a nivel de clase y método. |
| `N802` | Orionis usa camelCase en nombres de funciones y métodos (`myMethod`, `handleRequest`), convención central del framework. |
| `D104` | Los paquetes (`__init__.py`) no requieren docstring propio. |
| `D101` | No todos los contextos exigen docstring a nivel de clase. |
| `I001` | El orden de importaciones se gestiona manualmente para respetar la lógica de carga del framework. |
| `I002` | No existe ningún import forzado globalmente; cada módulo importa únicamente lo que necesita. |
| `TRY301` | El framework lanza excepciones dentro de bloques `try` de forma intencional para controlar el flujo de error. |
| `TRY300` | Orionis no usa el patrón de bloque `else` en `try/except`; la lógica de éxito puede estar dentro del mismo `try`. |
| `INP001` | Algunas partes del framework operan como paquetes de espacio de nombres implícitos sin `__init__.py`, válido en Python moderno. |

---

### Supresiones inline obligatorias (`# ruff: noqa`)

Las siguientes reglas **no se ignoran globalmente** en `ruff.toml`, pero aparecen suprimidas de forma recurrente mediante `# ruff: noqa` en archivos específicos del framework. Al desarrollar una aplicación Orionis, estos mismos patrones se repetirán y requerirán las mismas supresiones.

#### Complejidad estructural

| Regla | Motivo |
|---|---|
| `C901` | Complejidad ciclomática (McCabe) elevada en métodos de parseo, resolución de dependencias y configuración de entidades. |
| `PLR0912` | Exceso de ramas en métodos de validación y configuración de entities (`__post_init__`). |
| `PLR0913` | Métodos con más de 5 argumentos, frecuente en la API pública de comandos de consola, log y HTTP. |
| `PLR0915` | Exceso de sentencias en métodos de inicialización y parseo de argumentos. |
| `PLR0911` | Múltiples puntos de retorno en resolutores de tipo, fábricas y helpers de entorno. |

#### Tipos y anotaciones

| Regla | Motivo |
|---|---|
| `ANN401` | El framework usa `Any` de forma explícita en contratos de inyección de dependencias, facades, reflection y el contenedor de servicios. Prohibirlo generaría falsas alertas en APIs deliberadamente dinámicas. |
| `ANN002` | Tipado de `*args` no siempre es aplicable en métodos de paso de argumentos variables del contenedor. |
| `ANN003` | Tipado de `**kwargs` en métodos genéricos del contenedor y facades no es siempre aplicable. |
| `TC001` | Los imports de tipos propios del proyecto se mantienen fuera del bloque `TYPE_CHECKING` para permitir la resolución en tiempo de ejecución (patrón de inyección de dependencias). |
| `TC002` | Igual que `TC001` pero para imports de terceros usados como tipos en firmas de métodos resueltos dinámicamente. |

#### Comportamiento del framework

| Regla | Motivo |
|---|---|
| `SLF001` | El contenedor de servicios, facades y el output de consola acceden a miembros privados de otras clases del framework de forma intencional. |
| `FBT001` | Argumentos booleanos posicionales presentes en APIs públicas del framework para mantener compatibilidad con el estilo de llamada del usuario. |
| `FBT002` | Valores por defecto booleanos posicionales en métodos de configuración y ambiente. |
| `ARG004` | Argumentos de métodos estáticos no utilizados en implementaciones base que definen contratos de interfaz. |
| `BLE001` | Captura ciega de `Exception` utilizada intencionalmente en el reactor de consola y en tareas planificadas para evitar que un error individual detenga el proceso. |
| `TRY400` | Se utiliza `logging.error` en lugar de `logging.exception` de forma deliberada para controlar el nivel de detalle del stacktrace registrado. |
| `PLC0415` | Imports realizados fuera del nivel superior del módulo de forma condicional (imports opcionales: `orjson`, `uvloop`, `msgpack`). |
| `ASYNC240` | Se usa `pathlib.Path.open` en lugar de `anyio.Path.open` en contextos donde el IO de archivos se gestiona de forma controlada fuera del loop async. |
| `PGH003` | Supresiones `# type: ignore` sin código específico para imports opcionales no tipados (`orjson`, `uvloop`, `msgpack`). |
| `PLW0108` | Lambdas consideradas "innecesarias" por Ruff pero que son parte de contratos de configuración de entidades con validadores dinámicos. |
| `PLW2901` | Reasignación de variable de iteración en loops de procesamiento de resultados de tests y colecciones. |

#### Seguridad (supresiones intencionales)

| Regla | Motivo |
|---|---|
| `S104` | El servidor de desarrollo hace binding a `0.0.0.0` de forma explícita para permitir acceso en red local; está documentado como comportamiento solo de desarrollo. |
| `S311` | Se usan generadores pseudo-aleatorios estándar para operaciones no criptográficas (shuffle de frases inspiracionales, generación de IDs de tareas). |
| `S324` | Se usa MD5/SHA1 para computar hashes de caché de archivos (fingerprint de integridad, no seguridad criptográfica). |
| `S605` | Inicio de procesos con shell habilitado en comandos de consola del framework (`console.py`). |
| `S606` | Inicio de procesos sin shell en comandos de servidor de desarrollo. |
| `S314` | Parsing de XML en contextos controlados dentro del sistema de recursos HTTP. |

#### Estilo y calidad de código

| Regla | Motivo |
|---|---|
| `T201` | Uso de `print()` en el módulo de output de consola y en el system runtime importer, donde es el mecanismo de salida intencional. |
| `G004` | Logging con f-strings en el handler de errores del framework para mejorar la legibilidad de los mensajes de log. |
| `RUF012` | Atributos de clase mutables sin `ClassVar` en registro de comandos, routing y módulos de introspección donde la mutabilidad es parte del diseño. |
| `RUF001` | Caracteres Unicode ambiguos en el módulo de frases inspiracionales (`quotes.py`), que contiene texto legítimo en múltiples idiomas. |
| `PLR2004` | Valores mágicos en comparaciones de routing, resolución de tipos y lógica de log donde la literalidad mejora la legibilidad. |
| `PERF401` | Construcción de listas con `for` explícito en lugar de comprensión de lista en métodos de introspección. |
| `PERF403` | Construcción de diccionarios con `for` explícito en módulos de reflection. |
| `B905` | `zip()` sin parámetro `strict` en el output de consola (`zip_longest` pattern). |
| `E501` | Líneas superiores a 88 caracteres en el módulo de routing (`params_types.py`) y en frases inspiracionales. |
| `N801` | El tipo centinela `_MISSING_TYPE` no sigue CapWords porque forma parte de un patrón de valor interno no exportado. |
| `DTZ007` | Parseo de `datetime` con formato sin timezone explícita en el módulo de routing de parámetros URL. |
| `D205` | Docstrings con formato libre en el system runtime importer donde la estructura estricta NumPy no aplica. |
| `A002` | Argumento que sombrea un builtin de Python (`type`, `format`) en APIs públicas del framework por compatibilidad de nomenclatura. |

---

### Convención de docstrings (`pydocstyle`)

Se utiliza la convención **NumPy** (`convention = "numpy"`) para la escritura de docstrings en todo el framework. Esta convención define el formato esperado de parámetros, retornos y excepciones en la documentación de funciones y clases.

### Exclusiones del análisis

El directorio `test/*` se excluye del análisis de Ruff ya que los tests pueden requerir estilos distintos (uso de fixtures, mocks, nombres descriptivos largos, etc.) que entrarían en conflicto con las reglas de producción.
