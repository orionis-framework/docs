---
title: Excepciones y Manejo de Errores
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Handler de Excepciones

El Handler de Excepciones de Orionis Framework es el componente responsable de centralizar la gestión de errores durante la ejecución de la aplicación.

Su objetivo principal es estandarizar el tratamiento de excepciones en tres frentes:

- Conversión de excepciones nativas a una estructura uniforme.
- Reporte de errores hacia mecanismos de observabilidad (por ejemplo, logs).
- Presentación consistente de errores en entorno de consola.

Este enfoque reduce duplicación de lógica, mejora la trazabilidad de fallos y facilita la evolución de la estrategia de manejo de errores en proyectos medianos y grandes.

## Arquitectura General

La implementación base del framework está compuesta por dos niveles:

- Capa base: clase `BaseExceptionHandler` (núcleo de comportamiento común).
- Capa de aplicación: clase `ExceptionHandler` en `app\exceptions\handler.py` (punto de personalización del proyecto).

La clase de aplicación hereda de la clase base y te permite extender, reemplazar o complementar el comportamiento por defecto sin modificar código interno del framework.

### Componentes Clave

- `BaseExceptionHandler`: contiene la lógica de conversión, exclusión, reporte y salida de consola.
- `Throwable`: entidad estructurada que representa una excepción en formato uniforme.
- `ILogger`: contrato de logging para registrar errores de forma desacoplada.
- `Console`: servicio de salida para renderizar errores en comandos CLI.

## Flujo de Manejo de Excepciones

Cuando ocurre una excepción, el flujo recomendado es el siguiente:

1. Se recibe la excepción capturada.
2. Se valida si debe ser ignorada mediante `dont_catch`.
3. Se transforma a `Throwable` para normalizar su contenido.
4. Se reporta al logger (si aplica).
5. Se renderiza en consola cuando el error proviene de ejecución CLI.

Este flujo garantiza uniformidad en toda la aplicación y evita que cada módulo implemente su propia lógica de manejo.

## Ubicación y Configuración

En una aplicación Orionis Framework, el punto de entrada para personalizar el manejo de errores está en:

- `app\exceptions\handler.py`

Ese archivo define la clase `ExceptionHandler`, que extiende `BaseExceptionHandler`.

Un esqueleto típico de implementación es:

```python
from typing import ClassVar
from orionis.console.output.console import Console
from orionis.failure.base.handler import BaseExceptionHandler
from orionis.failure.entities.throwable import Throwable
from orionis.services.log.contracts.log_service import ILogger


class ExceptionHandler(BaseExceptionHandler):

	dont_catch: ClassVar[list[type[BaseException]]] = [
		# Excepciones a excluir del manejo centralizado
	]

	async def report(
		self,
		exception: Exception,
		log: ILogger,
	) -> Throwable | None:
		return await super().report(exception, log)

	async def handleCLI(
		self,
		exception: Exception,
		console: Console,
	) -> None:
		await super().handleCLI(exception, console)
```

## Métodos Principales

### `toThrowable(exception)`

Convierte una excepción nativa en una instancia de `Throwable`, incluyendo:

- Tipo de excepción.
- Mensaje principal.
- Argumentos serializados.
- Información de traza.

Esta normalización permite que el resto del pipeline trabaje con un formato estable, independientemente del tipo de error original.

### `isExceptionIgnored(exception)`

Determina si una excepción debe ser ignorada según la propiedad `dont_catch`.

Comportamiento esperado:

- Si el tipo de excepción está en `dont_catch`, retorna `True`.
- Si no está listada, retorna `False`.
- Si el objeto recibido no es una excepción válida, lanza `TypeError`.

### `report(exception, log)`

Responsable de reportar la excepción para observabilidad.

Comportamiento por defecto:

- Si la excepción está en `dont_catch`, no reporta y retorna `None`.
- Si no está excluida, crea un `Throwable`, registra el error y retorna la estructura generada.

Este método es ideal para integrar sistemas externos de monitoreo, alertas o trazabilidad distribuida.

### `handleCLI(exception, console)`

Gestiona la representación del error durante ejecución de comandos en consola.

Comportamiento por defecto:

- Omite excepciones excluidas por `dont_catch`.
- Imprime el error con formato legible y traza para facilitar depuración.

## Control de Excepciones Ignoradas con `dont_catch`

La propiedad `dont_catch` permite excluir excepciones específicas del manejo centralizado.

Ejemplo de configuración:

```python
from typing import ClassVar


class ExceptionHandler(BaseExceptionHandler):
	dont_catch: ClassVar[list[type[BaseException]]] = [
		KeyboardInterrupt,
		SystemExit,
	]
```

Esto es útil cuando deseas que ciertas excepciones sigan su flujo natural y no sean interceptadas por el handler global.

**Recomendaciones para `dont_catch`**

- Incluye solo excepciones que realmente deban propagarse.
- Evita agregar excepciones de negocio sin una razón arquitectónica clara.
- Documenta internamente por qué cada excepción fue excluida.

## Manejo de Errores en Consola

En comandos CLI, la calidad del diagnóstico es crítica. Por eso, `handleCLI` debe asegurar:

- Mensajes claros y accionables.
- Salida consistente entre comandos.
- Visibilidad de traza en entornos de desarrollo.

Un patrón de implementación recomendado es delegar en la base y añadir personalización gradual:

```python
async def handleCLI(
	self,
	exception: Exception,
	console: Console,
) -> None:
	# Ejemplo: lógica adicional previa
	# console.warning("Se detectó una excepción en CLI")

	await super().handleCLI(exception, console)

	# Ejemplo: lógica adicional posterior
	# console.info("Consulta los logs para más detalles")
```

## Integración con Logging

El método `report` se integra con el contrato `ILogger`, lo que permite sustituir la implementación concreta del logger sin modificar el handler.

Ejemplo de extensión orientada a observabilidad:

```python
async def report(
	self,
	exception: Exception,
	log: ILogger,
) -> Throwable | None:
	throwable = await super().report(exception, log)

	if throwable is None:
		return None

	# Puedes agregar metadatos de contexto aquí
	# log.error(f"[request_id=...] [{throwable.classtype.__name__}] {throwable.message}")

	return throwable
```

## Ejemplo de Implementación Personalizada

El siguiente ejemplo muestra una estrategia de personalización común en proyectos reales:

```python
from typing import ClassVar
from orionis.console.output.console import Console
from orionis.failure.base.handler import BaseExceptionHandler
from orionis.failure.entities.throwable import Throwable
from orionis.services.log.contracts.log_service import ILogger


class ExceptionHandler(BaseExceptionHandler):

	dont_catch: ClassVar[list[type[BaseException]]] = [
		KeyboardInterrupt,
		SystemExit,
	]

	async def report(
		self,
		exception: Exception,
		log: ILogger,
	) -> Throwable | None:
		throwable = await super().report(exception, log)

		if throwable is None:
			return None

		# Punto de integración para sistemas externos (Apm, alertas, etc.)
		# await notify_monitoring_service(throwable)

		return throwable

	async def handleCLI(
		self,
		exception: Exception,
		console: Console,
	) -> None:
		await super().handleCLI(exception, console)
```

## Buenas Prácticas

**1. Mantén el Handler Delgado**

Centraliza la orquestación en el handler, pero delega reglas complejas a servicios dedicados.

**2. No Silencies Errores sin Justificación**

Cada excepción incluida en `dont_catch` debe tener una razón técnica explícita.

**3. Evita Filtrar Información Sensible**

No imprimas secretos, tokens o datos privados en logs ni en salida de consola.

**4. Conserva Trazabilidad**

Asegura que todos los errores relevantes queden registrados con contexto suficiente para diagnóstico.

**5. Estandariza Mensajes**

Usa formatos consistentes para facilitar búsquedas, alertas y correlación de eventos.

## Errores Comunes y Cómo Evitarlos

**Error: no retornar `Throwable | None` en `report`**

Si sobreescribes `report`, respeta siempre el contrato de retorno para evitar inconsistencias en capas superiores.

**Error: capturar todo en `dont_catch`**

Agregar demasiadas excepciones puede anular el objetivo del handler centralizado.

**Error: depender del tipo concreto de logger**

Acóplate al contrato `ILogger`, no a implementaciones específicas.

**Error: mezclar lógica de negocio en el handler**

El handler debe coordinar manejo de errores, no ejecutar reglas de dominio.

## Lista de Verificación de Producción

Antes de desplegar, valida lo siguiente:

- La clase `ExceptionHandler` existe y extiende `BaseExceptionHandler`.
- `dont_catch` contiene únicamente excepciones justificadas.
- `report` registra errores relevantes de forma consistente.
- `handleCLI` muestra salida legible para operadores.
- No se exponen datos sensibles en logs ni en consola.
- El equipo conoce el flujo de errores y su estrategia de observabilidad.

## Notas

El Handler de Excepciones en Orionis Framework proporciona una base sólida para gestionar errores con criterios de arquitectura moderna: consistencia, extensibilidad y trazabilidad.

Al personalizar correctamente `ExceptionHandler`, obtienes un sistema de manejo de errores preparado para crecimiento, diagnóstico eficiente y operación confiable en entornos reales.