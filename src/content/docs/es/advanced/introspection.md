---
title: "Introspección y metaprogramación"
description: "Este paquete envuelve la inspección de Python en APIs especializadas que usa todo Orionis. Puede clasificar un valor, reflejar una función, clase abstracta o concreta,…"
editUrl: true
lastUpdated: false
---

## Descripción general

Este paquete envuelve la inspección de Python en APIs especializadas que usa todo Orionis. Puede clasificar un valor, reflejar una función, clase abstracta o concreta, instancia o módulo importable, separar miembros por visibilidad y tipo de ejecución, descubrir módulos Python, cargar clases y convertir parámetros de callables en metadatos de dependencias.

El paquete público exporta `Reflection`, las clases especializadas, `ReflectDependencies` y `ModuleInspector`. Los resultados costosos se memoizan; los wrappers exponen `clearCache()` cuando el objeto inspeccionado se modifica deliberadamente.

## Requisitos

- Python 3.14 o posterior.
- Módulos importables y archivos fuente para operaciones que recuperan código o rutas.
- Anotaciones disponibles en runtime cuando la inyección debe resolver un tipo concreto.
- `msgspec`, instalado por Orionis, para reconocer dependencias de schemas.

## Recorrido del módulo

- [Dependencias, descubrimiento y referencia](/es/advanced/introspection/dependencies-and-discovery)
- [Inspeccionar clases, funciones e instancias](/es/advanced/introspection/reflection)

Continúa por: [container](/es/architecture/service-container) · [console](/es/console).

## Cuándo necesita tu aplicación esta API

Usa introspección para cargar plugins de aplicación, generar código o descubrir componentes propios. Los controladores y servicios habituales usan el [contenedor](/es/architecture/service-container) para resolver dependencias; no necesitan construir firmas de reflexión manualmente.

Empieza por [reflejar un callable](/es/advanced/introspection/reflection) si solo necesitas nombres, parámetros o documentación. Continúa con [descubrimiento de módulos](/es/advanced/introspection/dependencies-and-discovery) para directorios de aplicación confiables. La detección de archivos y el análisis AST de imports pueden inspeccionar sin ejecutar el código; cargar clases y reflejar módulos sí importa código y debe limitarse a módulos confiables.
