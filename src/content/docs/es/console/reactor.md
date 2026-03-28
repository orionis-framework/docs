---
title: Interprete Linea de Comandos Reactor
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Intérprete de Línea de Comandos **Reactor**

Orionis Framework incluye un intérprete de línea de comandos llamado **Reactor CLI**, diseñado para facilitar la interacción con el framework desde la terminal. Esta herramienta permite ejecutar comandos integrados y personalizados para automatizar tareas comunes de desarrollo, administración y mantenimiento de aplicaciones.

En esta sección aprenderás:

- Qué es **Reactor CLI**
- Cómo utilizarlo
- Cómo funciona internamente
- Cómo gestiona la ejecución asíncrona según el sistema operativo

## ¿Qué es Reactor CLI?

**Reactor CLI** es la interfaz oficial de línea de comandos de **Orionis Framework**.

Proporciona un conjunto de comandos que permiten realizar tareas habituales durante el desarrollo de una aplicación, tales como:

- iniciar el servidor de desarrollo
- generar componentes o estructuras de proyecto
- ejecutar pruebas
- ejecutar tareas programadas
- administrar servicios del framework

Además, **Reactor CLI es completamente extensible**, lo que permite a los desarrolladores crear comandos personalizados adaptados a las necesidades específicas de cada proyecto.

Esto convierte a Reactor CLI en una herramienta central para la automatización del flujo de trabajo dentro de Orionis.

## Uso de Reactor CLI

Utilizar **Reactor CLI** es muy sencillo. Desde la terminal puedes ejecutar comandos usando la siguiente sintaxis:

```bash
python reactor [comando] [argumentos] [--opciones]
````

Por ejemplo, para iniciar el servidor de desarrollo puedes ejecutar:

```bash
python reactor serve
```

Una vez iniciado el servidor, podrás acceder a tu aplicación desde:

```
http://localhost:8000
```

## Uso de la bandera `-B` de Python

En algunos casos es recomendable ejecutar el CLI utilizando la bandera `-B` de Python:

```bash
python -B reactor serve
```

La opción `-B` indica a Python que **no genere archivos de bytecode (`.pyc`)**.

Esto puede ser útil en entornos de desarrollo cuando:

* se realizan cambios frecuentes en el código
* se desea mantener el repositorio limpio
* se quiere evitar la generación de carpetas `__pycache__`

El comportamiento del comando será exactamente el mismo, pero sin generar archivos de compilación.

## Punto de entrada de Reactor CLI

En todos los proyectos creados con **Orionis Framework** existe un archivo llamado:

```
reactor
```

Este archivo se encuentra en la raíz del proyecto y actúa como **punto de entrada del CLI**.

Su responsabilidad principal es:

1. Inicializar el entorno del framework
2. Descubrir los comandos disponibles
3. Interpretar argumentos y opciones
4. Ejecutar el comando solicitado

Cuando ejecutas un comando como:

```bash
python reactor serve
```

Reactor CLI realiza internamente el siguiente proceso:

1. Carga el entorno del framework
2. Descubre los comandos registrados
3. Analiza los argumentos y opciones proporcionados
4. Resuelve el comando solicitado
5. Ejecuta la lógica del comando

Este mecanismo permite que los comandos se integren de forma consistente dentro del ecosistema de Orionis.

## Ejecución asíncrona y gestión del Event Loop

Reactor CLI está diseñado para aprovechar el modelo **asíncrono** de Python basado en `asyncio`.

Para garantizar el mejor rendimiento posible en cada plataforma, Orionis incluye un manejador interno de **event loops** que selecciona automáticamente la implementación más adecuada dependiendo del sistema operativo.

Esto permite que las operaciones asíncronas se ejecuten utilizando el motor de eventos más eficiente disponible.

## Estrategia de Event Loop por sistema operativo

| Sistema     | Loop utilizado             | Factory                     |
| ----------- | -------------------------- | --------------------------- |
| **Linux**   | `uvloop` si está instalado | `uvloop.new_event_loop`     |
|             | Loop estándar de asyncio   | `asyncio.new_event_loop`    |
| **macOS**   | `uvloop` si está instalado | `uvloop.new_event_loop`     |
|             | Loop estándar de asyncio   | `asyncio.new_event_loop`    |
| **Windows** | `ProactorEventLoop`        | `asyncio.ProactorEventLoop` |

## Uso automático de uvloop

Cuando está disponible, Reactor CLI utiliza automáticamente **uvloop**.

`uvloop` es una implementación alternativa del event loop de Python diseñada para alto rendimiento. Está basada en **libuv**, la misma biblioteca que utiliza el runtime de Node.js para manejar operaciones de I/O asíncronas.

Gracias a esta implementación, `uvloop` puede ofrecer mejoras significativas de rendimiento frente al loop estándar de `asyncio`.

## Beneficios de uvloop

En diversos benchmarks, `uvloop` ha demostrado:

* menor latencia
* mayor throughput
* mejor manejo de miles de conexiones concurrentes

Dependiendo del tipo de aplicación, puede llegar a ser **entre 2x y 4x más rápido** que el loop predeterminado de `asyncio`.

Por esta razón, Orionis lo utiliza automáticamente cuando está disponible, sin requerir configuración adicional por parte del desarrollador.

Si `uvloop` no está instalado, Reactor CLI utiliza el loop estándar de `asyncio` sin afectar la compatibilidad del sistema.

## Resumen

Reactor CLI es una herramienta fundamental dentro del ecosistema de Orionis que permite:

* interactuar con el framework desde la terminal
* automatizar tareas comunes de desarrollo
* ejecutar comandos integrados o personalizados
* aprovechar el modelo asíncrono de Python de forma eficiente

Gracias a su sistema de detección automática de event loops, Reactor CLI garantiza un comportamiento consistente y optimizado en diferentes plataformas.
