---
title: "Gestión de excepciones"
description: "Los manejadores HTTP y comandos ya se ejecutan bajo la política de excepciones de Orionis. Lanza errores de dominio o del framework desde tu código; el kernel los reporta y…"
editUrl: true
lastUpdated: false
---

Los manejadores HTTP y comandos ya se ejecutan bajo la política de excepciones de Orionis. Lanza errores de dominio o del framework desde tu código; el kernel los reporta y genera la respuesta mediante el manejador configurado. Personaliza `app/exceptions/handler.py` cuando un error de dominio necesite una respuesta específica y registra esa clase antes de crear la aplicación.

Comienza con el [ejemplo de conflicto de dominio](/es/architecture/exception-handling/handling-exceptions), que conserva el comportamiento nativo para los demás errores. Llamar directamente a `Catch` resulta útil cuando gestionas de forma deliberada un fallo dentro de un contexto de kernel existente.

## Descripción general

`Catch` es el servicio exportado por el paquete: recibe una excepción, resuelve perezosamente el handler de aplicación, reporta y despacha el renderizado según el kernel del scope activo. Console usa `handleCLI`; HTTP usa `handleHTTP`; contextos desconocidos solo reportan.

`BaseExceptionHandler` aporta la política predeterminada: conversión a `Throwable`, logging, render CLI, mapeo de estados HTTP, respuestas 500 saneadas en producción y detalle en debug. La aplicación puede registrar otro handler que satisfaga `IBaseExceptionHandler`.

## Requisitos

- Python 3.14 o posterior.
- Aplicación/contenedor Orionis iniciado para `Catch.exception()` o la fachada `Catch`.
- Scope activo con contexto `kernel`.
- Request o adaptador de transporte al manejar una excepción HTTP.
- Servicios de logging, consola y respuestas resolubles para el método elegido.

## Recorrido del módulo

- [Reportar y gestionar excepciones](/es/architecture/exception-handling/handling-exceptions)
- [Políticas de errores y referencia](/es/architecture/exception-handling/policies-and-reference)

Continúa por: [http](/es/http) · [logging](/es/services/logging).
