---
title: "Pruebas de aplicaciones"
description: "Empieza guardando un caso en tests/ y ejecutándolo mediante Reactor desde la aplicación generada. Así arrancan los mismos proveedores y dependencias de tu aplicación. El…"
editUrl: true
lastUpdated: false
---

Empieza guardando un caso en `tests/` y ejecutándolo mediante Reactor desde la aplicación generada. Así arrancan los mismos proveedores y dependencias de tu aplicación. El recorrido más corto es [Escribir y ejecutar pruebas](/es/testing/writing-and-running-tests); continúa con [pruebas de integración MCP](/es/testing/mcp-testing) cuando tu proyecto exponga herramientas.

Usa datos exclusivos de prueba y limpieza explícita cuando accedas a persistencia o servicios externos. Un event loop aislado no equivale a una base de datos aislada ni deshace escrituras automáticamente.

## Descripción general

`orionis.test` es la capa de pruebas asíncronas de Orionis sobre `unittest` de Python. Ofrece un `TestCase` consciente de la aplicación, un motor configurable de descubrimiento y ejecución, resultados estructurados, reportes Rich en consola y un cliente MCP en proceso que recorre la serialización JSON-RPC y el dispatcher reales.

El paquete está diseñado para pruebas del framework y de aplicaciones que necesitan inyección de dependencias de Orionis sin abandonar las aserciones, fixtures, omisiones, fallos esperados o subpruebas habituales de `unittest`.

## Requisitos

- Python 3.14 o posterior.
- Una estructura normal de aplicación Orionis cuando las pruebas requieran servicios de la aplicación.
- Módulos y métodos de prueba cuyos nombres coincidan con los patrones configurados.
- Una declaración de servidor MCP y un contenedor de aplicación arrancable para pruebas de integración MCP.

## Recorrido del módulo

- [Escribir y ejecutar pruebas](/es/testing/writing-and-running-tests)
- [Probar herramientas MCP dentro del proceso](/es/testing/mcp-testing)
- [Resultados, configuración y referencia](/es/testing/results-and-reference)

Continúa por: [foundation](/es/getting-started) · [mcp](/es/protocols/mcp).
