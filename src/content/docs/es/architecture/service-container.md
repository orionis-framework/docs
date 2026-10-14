---
title: "Contenedor de servicios"
description: "Usa inyección de dependencias para compartir servicios de aplicación entre manejadores HTTP, comandos y trabajos. Registra la relación entre una interfaz y su implementación en…"
editUrl: true
lastUpdated: false
---

Usa inyección de dependencias para compartir servicios de aplicación entre manejadores HTTP, comandos y trabajos. Registra la relación entre una interfaz y su implementación en `app/providers/` y anota esa interfaz en el consumidor. La `Application` existente posee el contenedor; el código habitual de aplicación no crea un `Container` separado.

Comienza con [Registrar e invocar servicios](/es/architecture/service-container/bindings-and-invocation) y sigue el [ejemplo completo de proveedor de aplicación](/es/architecture/service-container/providers-and-facades). Elige `transient` para una instancia nueva por resolución, `singleton` para estado reutilizable del proceso y `scoped` para estado de la solicitud o comando. Un singleton no se comparte entre procesos worker.

## Descripción general

El contenedor asigna contratos o alias a implementaciones y crea grafos desde anotaciones de tipo. Admite instancias preparadas, servicios transient, singletons de proceso y servicios scoped locales al contexto. `build` construye una clase, `invoke` inyecta una función y `call` inyecta un método nombrado.

El código de aplicación suele interactuar mediante `Application`, que extiende el contenedor; los proveedores de la aplicación registran sus servicios y las fachadas opcionales. Providers diferidos posponen imports/registro hasta solicitar un contrato. Kernels HTTP/console crean scopes para impedir fugas de dependencias locales.

## Requisitos

- Python 3.14 o posterior.
- Sin dependencia opcional ni servicio externo.
- Anotaciones runtime en parámetros inyectables.
- Un contexto `beginScope()` activo antes de resolver un binding `scoped`.
- Referencias adelantadas resolubles en el módulo del callable.

## Recorrido del módulo

- [Registrar e invocar servicios](/es/architecture/service-container/bindings-and-invocation)
- [Service Providers, facades y extensión](/es/architecture/service-container/providers-and-facades)
- [Scopes, aislamiento y concurrencia](/es/architecture/service-container/scopes-and-concurrency)

Continúa por: [foundation](/es/getting-started) · [schemas](/es/validation).
