---
title: Desconexión del Cliente
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Desconexión del Cliente

En cualquier aplicación web, un cliente puede desconectarse en cualquier momento: al cerrar el navegador, refrescar la página, cancelar una solicitud o simplemente perder la conectividad de red. Cuando esto ocurre, el servidor puede continuar procesando una solicitud que nadie recibirá jamás, desperdiciando ciclos de CPU, memoria, conexiones a bases de datos y ancho de banda de I/O.

Orionis Framework resuelve este problema a nivel del núcleo. Cada conexión HTTP — ya sea servida sobre **ASGI** o **RSGI** — es monitoreada concurrentemente para detectar desconexiones del cliente. Cuando se detecta una desconexión, Orionis **cancela inmediatamente** todo el procesamiento en curso asociado a esa conexión, liberando recursos sin requerir ninguna acción por parte del desarrollador.

---

## El Problema

La mayoría de los frameworks web de Python no detectan la desconexión del cliente automáticamente. Cuando un cliente cierra la conexión, el servidor continúa procesando la solicitud como si nada hubiera pasado:

- Las consultas a la base de datos siguen ejecutándose.
- Las llamadas a APIs externas permanecen en vuelo.
- Los cálculos intensivos de CPU se ejecutan hasta completarse.
- Las respuestas de streaming siguen produciendo fragmentos que nunca serán entregados.
- Las operaciones de I/O en segundo plano consumen ancho de banda para datos que nadie recibirá.

En aplicaciones de alta concurrencia — manejando cientos o miles de conexiones simultáneas — este trabajo desperdiciado se acumula rápidamente. El resultado es una degradación del rendimiento, mayor latencia para los clientes activos y, en casos severos, agotamiento de recursos que puede provocar la caída total del servidor.

### Qué Ofrecen Típicamente Otros Frameworks

La mayoría de los frameworks populares de Python dejan la detección de desconexión en manos del desarrollador:

| Enfoque | Limitación |
|---------|-----------|
| **Polling manual** | El handler debe llamar periódicamente a un método como `request.is_disconnected()` dentro de bucles, añadiendo complejidad y rara vez implementándose en la práctica. |
| **Detección basada en middleware** | El middleware se ejecuta en el límite del procesamiento de la solicitud, lo que significa que el handler y todo su trabajo derivado ya han sido iniciados antes de que se realice cualquier verificación de desconexión. |
| **Sin soporte integrado** | Muchos frameworks no exponen ningún mecanismo, dependiendo de timeouts TCP a nivel del sistema operativo que pueden tardar minutos en activarse. |

Estos enfoques comparten un defecto común: son **reactivos** en lugar de **proactivos**. Detectan la desconexión después de que el trabajo ya se ha realizado, no antes o durante.

---

## Cómo Maneja Orionis la Desconexión

Orionis monitorea nativamente la conexión del cliente a nivel de protocolo durante todo el ciclo de vida de cada solicitud. Cuando se detecta un evento de desconexión, el procesamiento de la solicitud se cancela inmediatamente — no en el próximo intervalo de polling, no después de construir la respuesta, sino en el momento exacto en que el protocolo señala la desconexión.

Este mecanismo opera de forma transparente en el núcleo del framework. Tus handlers de rutas, middleware y código de aplicación no requieren **ninguna modificación** para beneficiarse de él.

### Escenarios de Desconexión Soportados

Orionis detecta y maneja todos los eventos comunes de desconexión:

- **Pestaña del navegador cerrada** — La conexión TCP termina y el servidor recibe una señal de desconexión.
- **Refresco de página (F5)** — El navegador aborta la solicitud actual antes de emitir una nueva.
- **Solicitud cancelada** — El usuario o el código del lado del cliente aborta explícitamente el fetch/XHR.
- **Pérdida de red** — El cliente pierde conectividad (caída de Wi-Fi, cambio de red móvil, modo suspensión).
- **Timeout del cliente** — La librería HTTP del cliente impone un plazo límite y cierra el socket.

En todos los casos, Orionis cancela el procesamiento de la solicitud y recupera todos los recursos vinculados a esa conexión.

---

## Soporte de Protocolos

Orionis soporta nativamente dos protocolos de servidor, y la detección de desconexión funciona de forma transparente en ambos:

### Protocolo ASGI

Cuando se ejecuta bajo ASGI, Orionis intercepta las señales de desconexión (`http.disconnect`) directamente del canal del servidor. El framework detecta la desconexión de forma proactiva, independientemente de lo que el handler esté haciendo en ese momento — ya sea esperando una consulta a la base de datos, llamando a una API externa o calculando una respuesta. No se requieren llamadas manuales a `receive()` ni verificaciones explícitas de desconexión en tu código de aplicación.

### Protocolo RSGI

RSGI es el protocolo nativo de Orionis, impulsado por [Granian](https://github.com/emmett-framework/granian). Orionis aprovecha la señalización de desconexión integrada del protocolo para detectar cuándo un cliente cierra la conexión, cancelando el procesamiento de la solicitud inmediatamente. Además, las conexiones keep-alive se preservan correctamente después de enviar la respuesta, siguiendo la especificación RSGI.

:::tip[Ventaja de RSGI]
Dado que RSGI proporciona señalización de desconexión a nivel de protocolo — impulsado por Rust (Hyper + Tokio) — la detección de desconexión en modo RSGI es ligeramente más eficiente que la ruta ASGI.
:::

---

## Respuestas de Streaming

La detección de desconexión del cliente es particularmente importante para las respuestas de streaming (Server-Sent Events, descargas de archivos grandes, transferencias chunked). Sin detección de desconexión, el servidor continuaría generando y transmitiendo fragmentos indefinidamente incluso después de que el cliente se haya ido.

Orionis maneja la desconexión en streaming de forma integral:

- Cuando se detecta una desconexión, cualquier respuesta de streaming activa se interrumpe inmediatamente — no se producen ni transmiten más fragmentos.
- El estado de la conexión se verifica **entre cada fragmento**, por lo que incluso durante streams de larga duración el framework captura la desconexión antes de enviar el siguiente fragmento.
- Esto aplica por igual tanto al protocolo ASGI como al RSGI, sin necesidad de configuración ni manejo especial en tu código de streaming.

---

## Streaming del Body de la Solicitud

La detección de desconexión también aplica al leer el body de la solicitud como stream. Si el cliente se desconecta mientras el servidor aún está consumiendo el body entrante, Orionis detecta la situación y termina el stream apropiadamente.

Esto evita que el servidor espere indefinidamente datos del body que nunca llegarán.

---

## Cero Configuración

A diferencia de otros frameworks donde debes implementar verificaciones manuales, escribir middleware personalizado o agregar bucles de polling, Orionis **no requiere configuración** para habilitar la detección de desconexión. Está siempre activa para cada solicitud HTTP, en ambos protocolos ASGI y RSGI.

No hay nada que habilitar, ningún middleware que registrar, ningún decorador que aplicar y ninguna verificación condicional que escribir en tus handlers. El framework lo maneja de forma transparente.

| Característica | Otros frameworks | Orionis |
|---------------|-----------------|---------|
| **Mecanismo de detección** | Polling manual / middleware | Monitoreo concurrente nativo |
| **Modificación del handler requerida** | Sí | No |
| **Detección de desconexión en streaming** | Raramente soportada | Integrada a nivel del adaptador |
| **Desconexión en stream del body** | No manejada | Propagación automática de error |
| **Limpieza de recursos** | Responsabilidad del desarrollador | Automática vía cancelación de tareas |
| **Configuración necesaria** | Registro de middleware, decoradores | Ninguna — siempre activa |

---

## Limpieza Elegante

Cuando el procesamiento de una solicitud es cancelado debido a la desconexión del cliente, Orionis garantiza que toda la lógica de limpieza se ejecute normalmente:

- Los bloques `try`/`finally` y los context managers asíncronos (`async with`) ejecutan su código de limpieza como se espera.
- Las transacciones de base de datos pueden revertirse, los handles de archivo cerrarse y los recursos temporales liberarse.
- La desconexión se maneja completamente a nivel del framework — nunca se propaga como una excepción no manejada en los logs de tu aplicación.

La solicitud simplemente termina silenciosamente, como si el cliente hubiera recibido la respuesta y seguido adelante.

---

## Impacto en el Rendimiento

El sistema de detección de desconexión añade una sobrecarga insignificante al procesamiento de solicitudes. El mecanismo de monitoreo permanece inactivo hasta que un evento de desconexión realmente ocurre, sin consumir prácticamente CPU ni memoria durante la operación normal.

El kernel HTTP se inicializa de forma lazy en la primera solicitud y se cachea para todas las solicitudes subsiguientes, de modo que la detección de desconexión no afecta el tiempo de inicio ni la resolución por solicitud.

A cambio, el sistema **elimina todo el trabajo desperdiciado** de clientes desconectados — un beneficio neto para cualquier aplicación bajo condiciones reales de tráfico.

---

## Resumen

Orionis Framework trata la desconexión del cliente como una preocupación de primera clase, no como una idea tardía. Al monitorear cada conexión concurrentemente a nivel de protocolo, el framework garantiza que los recursos del servidor nunca se desperdicien en solicitudes que ningún cliente recibirá. Esto opera de forma transparente en ambos protocolos ASGI y RSGI, no requiere configuración y maneja todos los escenarios comunes de desconexión — desde el cierre del navegador hasta las fallas de red — con cancelación inmediata de tareas y limpieza elegante de recursos.
