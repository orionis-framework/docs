---
title: 'Descripción General'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## ¿Qué es la Reflexión?

La **programación reflexiva** (o simplemente *reflection*) es la capacidad de un programa para examinar, inspeccionar y modificar su propia estructura y comportamiento en tiempo de ejecución. En lugar de depender exclusivamente de definiciones estáticas escritas en el código fuente, un sistema reflexivo puede descubrir dinámicamente clases, métodos, atributos, tipos y dependencias mientras la aplicación está en ejecución.

Esta capacidad es fundamental en los frameworks modernos, ya que permite construir sistemas altamente desacoplados donde los componentes no necesitan conocerse entre sí de antemano. El framework puede descubrir, conectar e inyectar servicios automáticamente basándose en la inspección del código del desarrollador.

## ¿Por qué es Relevante?

La reflexión resuelve problemas concretos que aparecen en el desarrollo de aplicaciones a escala:

- **Inyección de dependencias automática**: el contenedor de servicios analiza las firmas de los constructores para determinar qué dependencias necesita cada clase y las resuelve automáticamente, sin configuración manual.
- **Descubrimiento de componentes**: permite al framework detectar automáticamente comandos, controladores, proveedores de servicios y otros componentes registrados en el sistema.
- **Validación en tiempo de ejecución**: verifica que las clases cumplan con los contratos esperados (interfaces, clases abstractas, protocolos) antes de utilizarlas.
- **Carga dinámica de módulos**: inspecciona y carga módulos de Python bajo demanda, facilitando la arquitectura de plugins y extensiones.
- **Depuración y diagnóstico**: proporciona herramientas para examinar el estado interno de objetos, clases y módulos durante el desarrollo.

Sin reflexión, cada conexión entre componentes tendría que ser explícita y manual, lo que resultaría en un código rígido, difícil de mantener y resistente al cambio.

## El Sistema de Reflexión de Orionis

Orionis implementa un sistema de reflexión completo y cohesivo diseñado específicamente para las necesidades de un framework Python moderno. El sistema está organizado en componentes especializados, cada uno enfocado en un tipo de análisis particular:

### Arquitectura del Sistema

| Componente | Clase | Propósito |
|---|---|---|
| **Inspección** | `Reflection` | Fachada central con métodos factoría y verificaciones de tipo |
| **Clases Abstractas** | `ReflectionAbstract` | Introspección de ABCs: métodos abstractos, contratos, jerarquía |
| **Clases Concretas** | `ReflectionConcrete` | Análisis de clases instanciables: atributos, métodos, propiedades |
| **Instancias** | `ReflectionInstance` | Inspección de objetos vivos: estado, atributos dinámicos, mutación |
| **Invocables** | `ReflectionCallable` | Análisis de funciones y lambdas: firma, parámetros, naturaleza |
| **Módulos** | `ReflectionModule` | Descubrimiento de clases, funciones, constantes e importaciones |
| **Dependencias** | `ReflectDependencies` | Motor de resolución para el contenedor IoC |

### Punto de Entrada

La clase `Reflection` actúa como punto de entrada único al sistema. Ofrece métodos factoría para crear objetos de reflexión especializados y métodos de verificación para determinar la naturaleza de cualquier objeto Python:

```python
from orionis.services.introspection.reflection import Reflection

# Crear objetos de reflexión especializados
ri = Reflection.instance(my_object)
rc = Reflection.concrete(MyService)
ra = Reflection.abstract(MyContract)
rm = Reflection.module("my_module")
rf = Reflection.callable(my_function)

# Verificar la naturaleza de un objeto
Reflection.isConcreteClass(MyService)      # True
Reflection.isAbstract(MyContract)          # True
Reflection.isCoroutineFunction(async_fn)   # True
```

### Papel en el Framework

El sistema de reflexión es utilizado internamente por los componentes centrales de Orionis:

- **Contenedor de servicios**: utiliza `ReflectDependencies` para analizar las firmas de constructores y resolver dependencias automáticamente.
- **Proveedores de servicios**: emplean `ReflectionConcrete` y `ReflectionAbstract` para validar que los bindings cumplan con los contratos esperados.
- **Router de comandos**: usa `ReflectionModule` para descubrir y registrar comandos disponibles.
- **Sistema de validación**: aplica `Reflection.isConcreteClass()`, `Reflection.isAbstract()` y otras verificaciones para garantizar la integridad de los componentes registrados.

### Contratos

Cada clase de reflexión implementa un contrato (interfaz abstracta) que define su API pública. Esto permite sustituir implementaciones sin romper el código que las consume:

| Clase | Contrato |
|---|---|
| `ReflectionAbstract` | `IReflectionAbstract` |
| `ReflectionCallable` | `IReflectionCallable` |
| `ReflectionConcrete` | `IReflectionConcrete` |
| `ReflectionInstance` | `IReflectionInstance` |
| `ReflectionModule` | `IReflectionModule` |
| `ReflectDependencies` | `IReflectDependencies` |

### Caché Integrada

Todos los componentes de reflexión implementan un sistema de caché interno que almacena los resultados de las operaciones de descubrimiento. Esto garantiza que las inspecciones repetidas sobre el mismo objetivo no recomputen los resultados, optimizando significativamente el rendimiento en escenarios donde el contenedor de servicios resuelve múltiples dependencias durante el arranque de la aplicación.

```python
# La primera llamada computa el resultado
methods = reflection.getMethods()

# Las llamadas posteriores retornan el resultado cacheado
methods = reflection.getMethods()  # instantáneo

# Si es necesario, la caché puede limpiarse manualmente
reflection.clearCache()
```