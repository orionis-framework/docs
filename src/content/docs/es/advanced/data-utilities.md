---
title: "Tipos y utilidades de soporte"
description: "orionis.support es la capa compartida de utilidades de Orionis. Contiene las fachadas para acceder a servicios del framework, tipos auxiliares orientados a valores,…"
editUrl: true
lastUpdated: false
---

## Descripción general

`orionis.support` es la capa compartida de utilidades de Orionis. Contiene las fachadas para acceder a servicios del framework, tipos auxiliares orientados a valores, serialización de entidades, estructuras inmutables, metaclases reutilizables, formateo de excepciones, medición de tiempo, dimensionamiento de workers y el proveedor integrado de citas inspiradoras.

El paquete tiene deliberadamente dos niveles de API. `orionis.support.facades` y `orionis.support.types` ofrecen importaciones seleccionadas; los auxiliares de menor nivel se importan desde sus módulos de definición. El paquete raíz `orionis.support` no reexporta estos objetos.

## Requisitos

- Python 3.14 o posterior.
- El runtime de Orionis y sus dependencias declaradas. Este módulo usa directamente `pendulum`, `dotty-dict` y `psutil`.
- Una aplicación Orionis inicializada antes de invocar fachadas respaldadas por servicios. `DateTime` es una clase autónoma y no requiere el contenedor para las operaciones de fecha normales.

## Referencias de Helpers y Metadata

Cada helper tiene una guía propia con importaciones, parámetros, retornos, ejemplos y formas de acceso:

| Utilidad | Uso principal |
| --- | --- |
| [Collection](/es/advanced/data-utilities/collection) | Transformar, filtrar, agrupar y serializar datos en memoria. |
| [DotDict](/es/advanced/data-utilities/dot-dict) | Acceder por atributos a diccionarios anidados. |
| [Sentinel](/es/advanced/data-utilities/sentinel) | Diferenciar un dato omitido mediante `MISSING`. |
| [StdClass](/es/advanced/data-utilities/std-class) | Agrupar atributos dinámicos y exportarlos a un diccionario. |
| [Stringable](/es/advanced/data-utilities/stringable) | Transformar y analizar cadenas inmutables. |
| [Workers](/es/advanced/data-utilities/workers) | Estimar concurrencia según CPU y presupuesto de memoria. |
| [FreezeThaw](/es/advanced/data-utilities/freeze-thaw) | Convertir contenedores entre formas congeladas y mutables. |
| [PerformanceCounter](/es/advanced/data-utilities/performance-counter) | Medir intervalos síncronos y asíncronos. |
| [Metadata](/es/advanced/framework-metadata) | Consultar la identidad y versión del framework instalado. |

Los tipos que reciben datos se construyen explícitamente; los métodos de clase, métodos estáticos y constantes no requieren contenedor. Cada referencia explica cuándo la inyección es aplicable. Estas utilidades no hidratan por sí solas los datos de una petición.

## Recorrido del módulo

- [Transformar colecciones y cadenas](/es/advanced/data-utilities/collections-and-strings)
- [Entidades y estructuras de datos](/es/advanced/data-utilities/entities-and-structures)
- [Facades, fechas y utilidades del runtime](/es/advanced/data-utilities/facades-and-runtime-utilities)

Continúa por: [container](/es/architecture/service-container) · [schemas](/es/validation).

## Elegir una utilidad según la tarea

| Tarea de la aplicación | Punto de partida |
|---|---|
| Transformar una lista ya cargada | `Collection`, desde `orionis.support.types`. |
| Normalizar texto o crear un slug | `Stringable`, desde `orionis.support.types`. |
| Serializar un resultado con campos conocidos | Una dataclass que herede de `BaseEntity`. |
| Trabajar con fechas y zonas horarias | `DateTime`, desde `orionis.support.facades`; las operaciones habituales no requieren contenedor. |
| Invocar un servicio configurado del framework | Su fachada después del arranque, o su contrato mediante inyección de dependencias. |

Son utilidades Python que puedes importar en tu aplicación; no crean tablas SQL ni validan una petición automáticamente. Usa [schemas](/es/validation) para la entrada externa y el [contenedor](/es/architecture/service-container) para las dependencias de servicios.
