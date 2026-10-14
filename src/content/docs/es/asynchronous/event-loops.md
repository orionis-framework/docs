---
title: "Ejecución asíncrona"
description: "Loop reúne la creación de loops, el despacho de callables y los puentes síncronos. Empieza por distinguir si tu código ya está dentro de un loop: esa decisión determina qué…"
editUrl: true
lastUpdated: false
---

Loop reúne la creación de loops, el despacho de callables y los puentes síncronos. Empieza por distinguir si tu código ya está dentro de un loop: esa decisión determina qué operación usar.

## Recorrido

1. [Conectar código síncrono y asíncrono](/es/asynchronous/event-loops/async-execution): requisitos, uso progresivo, configuración, integración, errores y referencia pública.

## Usarlo en el punto adecuado de la aplicación

`Loop` es una utilidad autónoma: no necesita iniciar la aplicación, una fachada ni un proveedor. En un controlador, comando o job async de Orionis, el loop ya está activo; usa `await` para operaciones async y `await Loop.execute(funcion_bloqueante, ...)` para una llamada de biblioteca que bloquea. `Loop.run(main())` corresponde a la entrada de un script independiente donde no exista un loop activo.

Usa el [módulo de colas](/es/asynchronous/queues) cuando el trabajo deba sobrevivir a un reinicio. Crear una tarea de asyncio no la guarda de forma persistente.

Relacionados: [background](/es/asynchronous/background-tasks) · [foundation](/es/getting-started)
