---
title: Comandos Nativos
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Comandos Nativos de Orionis Framework

Orionis Framework incluye una consola de comandos pensada para acelerar tareas de desarrollo, mantenimiento y operación. Esta guía reúne los comandos nativos más importantes, su propósito y ejemplos de uso para que puedas incorporarlos rápidamente en tu flujo de trabajo.

En esta sección encontrarás:
- Qué son los comandos nativos y cuándo conviene utilizarlos.
- Sintaxis general de ejecución.
- Detalle de comandos clave del framework.
- Recomendaciones para desarrollo y producción.

## ¿Qué son los comandos nativos?

Los comandos nativos son utilidades integradas en Orionis Framework que puedes ejecutar desde la terminal para realizar acciones frecuentes sin escribir scripts adicionales.

Permiten, por ejemplo:
- Inspeccionar el estado del framework.
- Listar y ejecutar tareas programadas.
- Generar estructuras base para extender funcionalidades.
- Iniciar el servidor de desarrollo.
- Ejecutar pruebas automatizadas.

## Sintaxis general

La forma habitual de ejecutar un comando es:

```bash
python reactor <comando> <argumentos/opciones>
```

También puedes usar la bandera `-B` para evitar la generación de archivos `.pyc`:

```bash
python -B reactor <comando> <argumentos/opciones>
```

## Recomendación de uso de `-B`

Durante desarrollo, usar `python -B` ayuda a mantener el proyecto más limpio y reduce efectos no deseados por bytecode antiguo.

En producción, evalúa tu estrategia de despliegue:
- Si tu pipeline prepara imágenes limpias (por ejemplo, Docker), puedes limpiar cachés en el build.
- Si priorizas rendimiento de arranque, puedes permitir bytecode generado en tiempo de ejecución.

## Resumen rápido de comandos

- `list`: Muestra todos los comandos disponibles.
- `about`: Muestra información de versión y entorno.
- `optimize:clear`: Limpia bytecode y artefactos de optimización.
- `schedule:list`: Lista tareas programadas y su configuración.
- `schedule:work`: Ejecuta y mantiene activo el scheduler.
- `make:command`: Genera un comando personalizado.
- `make:task:listener`: Genera un listener para eventos de tareas.
- `serve`: Inicia servidor de desarrollo.
- `test`: Ejecuta pruebas del proyecto.

## Comando `list`

**Propósito**

Muestra todos los comandos disponibles, tanto nativos como personalizados.

**Uso**

```bash
python -B reactor list
```

**Cuándo usarlo**

- Al iniciar en un proyecto existente.
- Después de crear comandos personalizados.
- Para verificar la firma exacta de un comando antes de ejecutarlo.

## Comando `about`

**Propósito**

Entrega información de la versión de Orionis Framework y datos del entorno de ejecución.

**Uso**

```bash
python -B reactor about
```

**Cuándo usarlo**

- Para validar la versión instalada.
- Para reportar información al equipo durante soporte técnico.
- Para confirmar contexto antes de depurar incidencias.

## Comando `optimize:clear`

**Propósito**

Elimina archivos de bytecode y artefactos de optimización generados durante el bootstrapping de la aplicación.

**Uso**

```bash
python -B reactor optimize:clear
```

**Cuándo usarlo**

- Después de cambios relevantes de configuración.
- Al detectar comportamientos inconsistentes tras refactors.
- En procesos de build o despliegue para garantizar un arranque limpio.

**Nota operativa**

En entornos de producción no suele ser necesario ejecutarlo en cada inicio. Lo recomendable es incorporarlo en el pipeline cuando buscas un despliegue reproducible y limpio.

## Comando `schedule:list`

**Propósito**

Muestra una vista detallada de todas las tareas programadas registradas en el proyecto.

**Uso**

```bash
python -B reactor schedule:list
```

**Información que muestra**

- `Signature`: Nombre de la tarea.
- `Arguments`: Argumentos configurados.
- `Purpose`: Propósito descriptivo.
- `Random Delay (Calculated Result)`: Delay aleatorio calculado.
- `Coalesce`: Estado de coalescencia.
- `Max Instances`: Límite de instancias simultáneas.
- `Misfire Grace Time`: Margen de tolerancia para misfire.
- `Start Date - End Date`: Rango de fechas de ejecución.
- `Details`: Frecuencia o intervalo de ejecución.

**Cuándo usarlo**

- Antes de pasar a producción.
- Durante auditorías operativas.
- Para validar que una nueva tarea fue registrada correctamente.

## Comando `schedule:work`

**Propósito**

Inicia el proceso que mantiene activo el scheduler y ejecuta tareas en segundo plano según su programación.

**Uso**

```bash
python -B reactor schedule:work
```

**Comportamiento esperado**

- Lee las tareas definidas en `app\console\scheduler.py`.
- Evalúa tiempos de ejecución y dispara tareas cuando corresponde.
- Publica eventos asociados para que los listeners respondan.
- Mantiene un proceso persistente para tareas recurrentes.

**Recomendaciones por entorno**

En desarrollo:
- Ejecuta este comando en una terminal separada.
- Déjalo corriendo mientras pruebas tareas periódicas.

En producción:
- Gestiona el proceso con herramientas del sistema operativo.
- Asegura reinicio automático ante fallos.

En Unix:
- Puedes usar `systemd`, `supervisord` o estrategias equivalentes.

En Windows:
- Puedes usar el Programador de tareas o un servicio dedicado.

**Ejecución directa sin scheduler**

Si no necesitas scheduler y solo quieres ejecutar un comando concreto en intervalos, puedes apoyarte en herramientas del sistema:
- Linux: `cron`.
- Windows: Programador de tareas.

Ejemplo en Linux con `cron`:

1. Abre el editor de crontab:

```bash
crontab -e
```

2. Agrega una regla para ejecutar un comando cada 5 minutos:

```bash
*/5 * * * * cd /ruta/a/tu/proyecto && python -B reactor <signature>
```

3. Guarda los cambios y verifica que la tarea esté registrada:

```bash
crontab -l
```

Comando objetivo:

```bash
python -B reactor <signature>
```

## Comando `make:command`

**Propósito**

Genera la estructura base de un comando personalizado para extender la consola de tu proyecto.

**Uso**

```bash
python -B reactor make:command <name_of_command> [--options]
```

**Opciones comunes**

- `--signature`: Firma con la que invocarás el comando.
- `--description`: Descripción visible en `reactor list`.

**Ejemplo**

```bash
python -B reactor make:command clean_cache --signature="cache:clean" --description="Limpia cache de aplicacion"
```

**Buena práctica**

Usa firmas consistentes con formato `modulo:accion` para facilitar descubrimiento y mantenimiento.

## Comando `make:task:listener`

**Propósito**

Genera un listener para reaccionar a eventos del ciclo de vida de tareas programadas.

**Uso**

```bash
python -B reactor make:task:listener <name_of_listener>
```

**Ubicación y relación con scheduler**

- Los listeners se ubican en `app\console\listeners`.
- Se conectan a tareas definidas en `app\console\scheduler.py`, dentro del método `tasks`.

**Eventos de tarea habituales**

- `onTaskAdded`: Se agrega una tarea al scheduler.
- `onTaskRemoved`: Se elimina una tarea.
- `onTaskExecuted`: La tarea termina correctamente.
- `onTaskError`: Ocurre un error al ejecutar una tarea.
- `onTaskMissed`: La tarea no se ejecuta en el instante previsto.
- `onTaskSubmitted`: La tarea se envía para ejecución.
- `onTaskMaxInstances`: Se alcanza el máximo de instancias permitidas.

**Cuándo conviene usar listeners**

- Para registrar auditoría operacional.
- Para emitir notificaciones tras ejecuciones críticas.
- Para activar compensaciones o flujos alternos ante fallos.

## Comando `serve`

**Propósito**

Inicia el servidor de desarrollo para ejecutar la aplicación localmente.

**Uso** básico

```bash
python -B reactor serve
```

**Opciones**

- `--interface`: Define la interfaz de servidor.
- `--port`: Establece el puerto de escucha.
- `--log`: Activa logs detallados del servidor.

**Valores frecuentes**

- `--interface="rsgi"`: interfaz predeterminada.
- `--interface="asgi"`: útil para servidores ASGI compatibles.
- `--port="8000"`: puerto por defecto.

**Ejemplos**

```bash
python -B reactor serve --interface="rsgi" --port="8000" --log
```

```bash
python -B reactor serve --interface="asgi" --port="8080" --log
```

**Recomendación**

Activa `--log` cuando estés depurando problemas de arranque, puertos ocupados o comportamiento del servidor web.

## Comando `test`

**Propósito**

Ejecuta pruebas del proyecto para validar el comportamiento de la aplicación.

**Uso**

```bash
python -B test
```

**Opciones disponibles**

- `--verbosity, -v`: Nivel de detalle en salida.
- `--fail-fast, -f`: Detiene ejecución al primer fallo (`1`) o continúa (`0`).
- `--start-dir, -s`: Directorio de búsqueda de pruebas.
- `--file-pattern`: Patrón de archivos de prueba.
- `--method-pattern`: Patrón de métodos de prueba.

**Valores por defecto**

- Verbosidad: `2`.
- Fail fast: `0`.
- Directorio de pruebas: `tests`.
- Patrón de archivos: `test_*.py`.
- Patrón de métodos: `test*`.

**Ejemplos útiles**

Ejecutar todas las pruebas con salida detallada:

```bash
python -B test -v 2
```

Detener en el primer fallo:

```bash
python -B test -f 1
```

Ejecutar pruebas desde otra carpeta:

```bash
python -B test --start-dir="custom_tests"
```

Filtrar por método:

```bash
python -B test --method-pattern="test_auth*"
```

## Flujo recomendado de trabajo

Para una rutina de desarrollo más estable, puedes seguir este orden:

1. Ejecuta `python -B reactor list` para validar comandos disponibles.
2. Si cambiaste configuración o bootstrap, ejecuta `python -B reactor optimize:clear`.
3. Levanta aplicación con `python -B reactor serve`.
4. Si usas tareas programadas, inicia `python -B reactor schedule:work` en otra terminal.
5. Ejecuta `python -B test` antes de integrar cambios.

## Buenas prácticas generales

- Mantén firmas de comandos personalizadas claras y consistentes.
- Documenta siempre `--description` al crear comandos nuevos.
- Revisa periódicamente `schedule:list` para detectar configuraciones inválidas.
- Registra eventos críticos mediante listeners en tareas de alto impacto.
- Integra la ejecución de pruebas en tu pipeline de CI/CD.

## Solución de problemas frecuentes

**Un comando no aparece en `list`**

- Verifica que el comando esté correctamente registrado.
- Revisa errores de importación en módulos de consola.
- Confirma que estás usando el entorno de Python correcto.
- Ejecuta `python -B reactor optimize:clear` para limpiar bytecode obsoleto.

**Una tarea programada no se ejecuta**

- Confirma que `schedule:work` esté activo.
- Revisa restricciones como `start_date`, `end_date` o `max_instances`.
- Valida logs de listeners para identificar fallos.
- Valida el log general de Orionis Framework para errores relacionados.

**Las pruebas no detectan casos esperados**

- Revisa `--start-dir` y `--file-pattern`.
- Verifica que los métodos cumplan el patrón `test*`.
- Ajusta la verbosidad con `-v` para mayor detalle de diagnóstico.

## Nota

Los comandos nativos de Orionis Framework son una capa operativa clave para desarrollar con mayor velocidad y control. Dominar estos comandos te permitirá automatizar tareas, mejorar la observabilidad del sistema y mantener una operación más predecible en desarrollo y producción.