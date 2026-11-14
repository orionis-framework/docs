---
title: "Gestión de excepciones"
description: "Configura app.withExceptionHandler, comprende el pipeline de failure y define cómo reportar y presentar errores en los contextos de Orionis."
editUrl: true
lastUpdated: false
---

## Descripción general

Los límites de ejecución del framework entregan las excepciones a un handler de aplicación después del inicio exitoso. `handleFailure(exception, context)` recibe la excepción original una vez por incidente y retorna un plan `FailureHandling` o `None`. `handleResult(value, context)` recibe resultados declarados fallidos sin fabricar excepciones; su implementación predeterminada retorna `None`.

`BaseExceptionHandler` prepara logging y presentación diferidos. El runtime completa el logging bajo sus protecciones de reporte; `Catch.exception()` solicita la presentación HTTP o CLI del mismo plan sin volver a llamar al handler. La política predeterminada conserva `Throwable`, el traceback nativo en el log, el mapeo de estados HTTP, respuestas 500 seguras en producción, detalle en debug y salida CLI.

Los fallos anteriores al inicio quedan fuera de esta cobertura. El código externo que consume errores necesita un propietario explícito que notifique al runtime. La recepción permanece disponible durante el cierre; cuando empiezan a cerrarse los recursos de reporte, `context.reporting_allowed` pasa a false y el plan base deja de programar llamadas al logger.

## Requisitos

- Python 3.14 o posterior. La observación automática requiere un runtime Orionis iniciado correctamente; el manejo explícito con `Catch.exception()` necesita una aplicación creada y el scope indicado abajo.
- Scope activo con `kernel` para `Catch.exception()`; `capture()` no requiere scope.
- Request o adaptador de transporte para presentación HTTP.
- Servicios de aplicación para logging, salida de consola y respuestas predeterminadas.
- Handlers personalizados que implementen el contrato de dos hooks; los overrides deben retornar el plan heredado para conservar sus efectos.

Personaliza `handleFailure` para excepciones y `handleResult` para resultados declarados fallidos. Devuelve el plan seleccionado para que el runtime complete sus efectos.

## Recorrido del módulo

- [Gestionar excepciones](/es/exceptions/handling-exceptions)
- [Políticas de errores y referencia](/es/exceptions/policies-and-reference)
- [Captura después del inicio](/es/exceptions/handling-exceptions#captura-despues-del-inicio)
- [Definir un handler personalizado](/es/exceptions/policies-and-reference#definir-un-handler-personalizado)

Continúa por: [http](/es/http) · [logging](/es/logging).

## Configuración compilada y procesos activos

Registra `app.withExceptionHandler(ExceptionHandler)` antes de `create()`. Con la configuración bloqueada, un cambio ordinario de registro lanza `RuntimeError`. Con configuración compilada, la selección procede de metadatos bootstrap cacheados; llamar al método de registro no reemplaza esa selección.

La aplicación cachea tanto la clase como la instancia compartida del handler. Reinicia los procesos después de modificar su registro o código. Mantén `app` y `bootstrap` en las rutas de invalidación. Si debes reconstruir los artefactos de optimización, `orionis optimize:clear` o `python -B reactor optimize:clear` elimina cachés compiladas y artefactos de build del proyecto; no configura el handler por sí mismo.
