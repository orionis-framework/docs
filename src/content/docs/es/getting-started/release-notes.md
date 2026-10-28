---
title: "Notas de versión"
description: "Cambios de Orionis 1.0.8 a 1.0.12: Loop en Python 3.14, pruebas, generación de schemas, migración de colas, rendimiento HTTP y fachada Debug."
editUrl: true
lastUpdated: false
---

Estas notas reúnen los cambios de las versiones **1.0.8 a 1.0.12** y enlazan las guías de uso actualizadas. Los ejemplos de Reactor se ejecutan desde la raíz de la aplicación con su entorno de Python.

<a id="v1-0-12"></a>

## 1.0.12: fachada Debug

Se incorpora `Debug` como acceso al servicio de depuración desde las fachadas:

```python
from orionis.support.facades import Debug

data = {"ready": True, "items": [1, 2, 3]}
Debug.dump(data)
Debug.dd(data)
```

`Debug.dump()` imprime los valores en consola y permite continuar. `Debug.dd()` muestra los valores y detiene la ejecución: en HTTP con depuración activa interrumpe la petición con una respuesta HTML de diagnóstico; en consola termina el proceso. Son llamadas síncronas y requieren una aplicación inicializada. Consulta [Debug](/es/utilities/helpers/debug) para sus opciones, valores de retorno y comportamiento fuera del modo de depuración.

<a id="v1-0-11"></a>

## 1.0.11: rendimiento HTTP y respuestas

Se reducen bloqueos y llamadas redundantes en el recorrido HTTP. La admisión de peticiones ASGI/RSGI utiliza un contador por kernel en el event loop del worker; se omiten pasos innecesarios en rutas públicas sin middleware y consultas de políticas cuando no hay políticas registradas.

Las respuestas HTML, JSON, redirecciones, streaming, SSE y archivos preparan sus cabeceras estándar con menos llamadas. Cada respuesta mantiene sus propias cabeceras mutables; se conservan las reglas de precedencia, los hooks de las subclases y el comportamiento de serialización y streams. Consulta [límites de peticiones](/es/http/requests) y [cabeceras de respuesta](/es/http/responses).

### Estimaciones locales de tiempo

La validación local reportada para esta versión registró **320 pruebas pasando**. La estimación general es de **aproximadamente 10–15 % menos tiempo por petición en el recorrido Python medido**, sin red. La siguiente tabla conserva el alcance de cada medición:

| Área o respuesta | Reducción estimada de tiempo | Qué se midió |
| --- | ---: | --- |
| HTTP ASGI | **≈15 %** | Recorrido por petición, sin red. |
| HTTP RSGI | **≈13 %** | Recorrido por petición, sin red. |
| HTML | **≈10 %** | Construcción de respuesta pequeña. |
| JSON compacto | **≈23 %** | Construcción y serialización de payload pequeño. |
| Redirecciones | **≈11 %** | Construcción y cabeceras. |
| Streaming | **≈19 %** | Construcción, no transferencia. |
| SSE | **≈24 %** | Construcción, no duración del stream. |
| JSON con formato | **Sin mejora estable** | Resultado variable. |
| Archivos y descargas | **Sin mejora estable** | Resultado variable por I/O. |

:::caution[Alcance de las cifras]
Las cifras de construcción son orientativas y tuvieron bastante variabilidad. **No se suman entre sí ni equivalen al mismo incremento en peticiones por segundo (RPS).** No garantizan una mejora de RPS en tu aplicación; archivos y descargas no tienen un porcentaje estable. Mide tu carga completa, incluida la red, la base de datos y el I/O, antes de extrapolar estos resultados.
:::

Estas cifras corresponden a la validación local reportada de 1.0.11; no constituyen un benchmark nuevo de cada versión posterior. Las pruebas de comportamiento cubren, entre otros casos, [recursos de ejecución](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_execution_resources.py), [límites de peticiones](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_request_limits.py) y [construcción de respuestas](https://github.com/orionis-framework/framework/blob/49353208e/tests/http/test_response_performance.py).

<a id="v1-0-10"></a>

## 1.0.10: schemas de tablas y migración de colas

Se actualiza el stub de creación de schemas de tablas utilizado por `make:database-schema`: el módulo generado declara `TABLE: Final[TableDefinition | None] = None`, en lugar de una clase contenedora. Reemplaza `None` por la definición de la tabla e importa esa constante en tus migraciones y modelos. Revisa el [ejemplo de schema generado](/es/database/schema) y la [referencia del generador](/es/database/commands).

Se añade el comando para preparar explícitamente las tablas de las colas que utilizan base de datos:

```bash
python reactor queue:migrate
```

Si utilizas uv para seleccionar el entorno del proyecto, la invocación equivalente de estas guías es:

```bash
uv run python -B reactor queue:migrate
```

Consulta los [drivers y la preparación de colas](/es/queues/drivers-and-configuration) para seleccionar la conexión y revisar qué tablas se preparan. El comando se ocupa de la infraestructura de colas; las migraciones de la aplicación se ejecutan con `reactor migrate`.

<a id="v1-0-9"></a>

## 1.0.9: pruebas y aplicación de benchmarking

Se corrigen detalles de las pruebas de integración de `uvloop` y de la aplicación Orionis usada en las comparativas HTTP. La comprobación periódica de disponibilidad de esa aplicación pasa de `0.01` a `0.1` segundos. El ajuste pertenece al arranque del benchmark y no establece la latencia por petición ni una mejora de RPS.

La [aplicación de comparación HTTP](https://github.com/orionis-framework/framework/blob/cd986045b/benchmarks/http_compare/apps/orionis.py) forma parte del repositorio de desarrollo del framework. Para las pruebas de tu aplicación, continúa usando la [guía de testing](/es/testing/writing-and-running-tests).

<a id="v1-0-8"></a>

## 1.0.8: Loop y Python 3.14

Se refactoriza `Loop` para que el registro, la propiedad y la limpieza del event loop tengan un comportamiento predecible en Python 3.14. Los puntos de entrada síncronos rechazan su ejecución dentro de un loop activo, el trabajo síncrono delegado a hilos conserva el contexto y los loops propios se cierran mediante `asyncio.Runner` sin cerrar loops prestados.

Al actualizar código que usa estas utilidades, revisa especialmente `Loop.runSync()`, `Loop.createTask()` y `Loop.eventLoopContext()`. `createTask()` es síncrono y devuelve la tarea que después puedes esperar. La [guía de ejecución asíncrona](/es/application/async) contiene las firmas y los ejemplos vigentes.
