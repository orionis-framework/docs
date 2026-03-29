---
title: Fachada de Consola
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Introducción

La fachada `Reactor` es la interfaz de alto nivel que Orionis Framework expone para
interactuar con el sistema de comandos CLI desde cualquier capa de la aplicación.
Actúa como una capa de abstracción que desacopla el punto de invocación del comando
de su implementación interna, permitiendo ejecutar cualquier comando registrado en
el framework con una única llamada asíncrona.

A diferencia de invocar un comando directamente instanciando su clase, la fachada
delega la resolución, configuración y ejecución al contenedor de la aplicación,
garantizando que la inyección de dependencias y el ciclo de vida del comando se
respeten en todos los contextos de uso.

## ¿Cuándo utilizar la Fachada de Consola?

La fachada es especialmente útil en los siguientes escenarios:

- **Reutilización de lógica de negocio**: cuando la operación ya está encapsulada
  en un comando y deseas invocarla desde un servicio, controlador o tarea programada
  sin duplicar código.
- **Automatización interna**: cuando un proceso del sistema necesita desencadenar
  otro comando como parte de un flujo más amplio.
- **Integración con HTTP**: cuando un endpoint de la aplicación debe lanzar una
  operación de consola como respuesta a una solicitud del cliente.
- **Composición de comandos**: cuando un comando necesita delegar parte de su
  trabajo a otro comando ya registrado en el framework.

Para procesos que no requieren una respuesta inmediata, consulta la documentación
de tareas en segundo plano disponible en la sección HTTP, donde encontrarás cómo
lanzar comandos de manera asíncrona sin bloquear el ciclo de la solicitud.

## Importación

La fachada se importa desde el módulo de soporte del framework:

```python
from orionis.support.facades.reactor import Reactor
```

No es necesario instanciar la clase ni resolver dependencias manualmente. La
fachada expone directamente los métodos de clase disponibles para su uso inmediato.

## API de la Fachada

### `Reactor.call`

Ejecuta un comando registrado en el framework de forma asíncrona.

```python
await Reactor.call(signature: str, arguments: list[str] = []) -> None
```

**Parámetros**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| <span style="white-space:nowrap">`signature`</span> | <span style="white-space:nowrap">`str`</span> | Firma del comando a ejecutar, tal como está definida en su propiedad `signature`. |
| <span style="white-space:nowrap">`arguments`</span> | <span style="white-space:nowrap">`list[str]`</span> | Lista de argumentos y opciones en formato CLI (`--flag=valor`, `--flag`). |

**Notas**

- El método es `async` y debe ser esperado con `await` en un contexto asíncrono.
- Los argumentos se pasan en el mismo formato que se utilizarían desde la terminal.
- Si el comando no existe o falla en su ejecución, el framework propagará la
  excepción correspondiente.

## Ejecución de un comando

El siguiente ejemplo muestra cómo invocar el comando `sync:users` con un conjunto
de argumentos desde cualquier clase de la aplicación:

```python
# Garantiza la importación de la fachada
from orionis.support.facades.reactor import Reactor

class UserController(BaseController):

    async def syncUsers(self) -> None:
        await Reactor.call("sync:users", [
            "--category=admin",
            "--force",
            "--verbose",
        ])
```

En este caso, el comando `sync:users` recibirá los argumentos `--category`,
`--force` y `--verbose` exactamente como si hubieran sido proporcionados desde
la terminal.

## Uso desde un Controlador HTTP

La fachada puede invocarse sin restricciones desde controladores HTTP, lo que
permite reutilizar la lógica de negocio ya encapsulada en un comando sin
necesidad de extraerla a un servicio separado.

```python
# Garantiza la importación de la fachada
from orionis.support.facades.reactor import Reactor

class ReportController(BaseController):

    async def generate(self, request: Request) -> dict:

        # Logica de validación y preparación de datos aquí...

        await Reactor.call("report:generate", [
            f"--period={period}",
            "--format=pdf",
        ])

        # Lógica de respuesta HTTP aquí...
```

Para operaciones de larga duración donde el cliente no debe esperar la finalización
del proceso, consulta la documentación de tareas en segundo plano en la sección
de sesión HTTP.

## Buenas Prácticas

- **Prefiere la fachada sobre la instanciación directa**: invocar un comando a través
  de `Reactor.call` garantiza que el contenedor resuelva todas las dependencias del
  comando correctamente.
- **Pasa solo los argumentos necesarios**: evita enviar argumentos vacíos o
  redundantes; el comando utilizará los valores por defecto definidos en su
  configuración para los parámetros no proporcionados.
- **Maneja las excepciones del llamador**: si el comando puede fallar, envuelve la
  llamada en un bloque `try/except` para controlar el flujo desde el contexto
  que lo invoca.
- **No uses la fachada para lógica síncrona crítica**: dado que `Reactor.call` es
  asíncrono, asegúrate de estar en un contexto que soporte `await`; de lo contrario,
  utiliza una tarea en segundo plano.

## Consideraciones

- La fachada resuelve el comando a partir de su `signature`, por lo que esta debe
  estar registrada y ser única en el proyecto.
- Cualquier salida de consola generada por el comando durante su ejecución será
  visible en el contexto desde el que se invoca (terminal, log del servidor, etc.).
- Los argumentos opcionales no declarados simplemente serán ignorados por el
  parser del comando; no generan errores.