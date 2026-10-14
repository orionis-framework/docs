---
title: "Consola y programación de tareas"
description: "Ejecuta los comandos desde la raíz del proyecto generado para que uv run utilice su .venv y Reactor cargue bootstrap.app. Empieza con:"
editUrl: true
lastUpdated: false
---

Ejecuta los comandos desde la raíz del proyecto generado para que `uv run` utilice su `.venv` y Reactor cargue `bootstrap.app`. Empieza con:

```shell
uv run python -B reactor list
uv run python -B reactor app:greet --help
```

El primer comando lista los comandos disponibles. El segundo supone que ya creaste el [comando de saludo](/es/console/commands-and-arguments). Los comandos de aplicación usan Reactor; la creación de proyectos usa la distribución independiente `orionis-installer`. Si un ejecutable global llamado `orionis` pertenece al instalador, no ejecutará los comandos de tu aplicación.

La consola ofrece comandos de aplicación, argumentos validados, salida de terminal y un scheduler basado en APScheduler 3. Los mismos comandos pueden ejecutarse desde el proceso CLI, mediante la facade `Reactor` o como tareas programadas.

1. [Crear comandos y argumentos](/es/console/commands-and-arguments): descubrimiento, parsing, dependencias y códigos de salida.
2. [Salida y ejecución programática](/es/console/output-and-programmatic-execution): prompts, tablas, progreso y llamadas desde otros servicios.
3. [Programar tareas](/es/console/task-scheduling): triggers, zona horaria, stores, listeners y operación.
4. [Comandos incluidos](/es/console/built-in-commands): recorrido por generadores, datos, mantenimiento y workers.

Ejecuta `uv run python -B reactor list` desde la raíz de la aplicación para conocer su registro real. El punto de entrada del framework dentro del proyecto, por ejemplo `uv run orionis list`, carga `bootstrap.app` del directorio actual y admite los mismos argumentos; no necesita un archivo `reactor` propio. Ambos puntos de entrada de aplicación requieren un proyecto válido. Python 3.14+, Rich 15 y APScheduler `>=3.11.3,<4.0` forman parte de las dependencias declaradas.

El scheduler ejecuta comandos, mientras [Queues](/es/asynchronous/queues) procesa jobs serializados con reservas y reintentos. Son herramientas distintas que pueden colaborar.
