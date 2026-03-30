---
title: 'Descripción General'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## HTTP en Orionis

Orionis Framework ofrece una capa HTTP moderna y de alto rendimiento, diseñada para atender aplicaciones web con la máxima eficiencia. Gracias a su arquitectura flexible, Orionis soporta de forma nativa dos protocolos de comunicación: **ASGI** y **RSGI**, permitiendo al desarrollador elegir entre compatibilidad con el ecosistema Python estándar o rendimiento superior con tecnología Rust.

Todo esto es posible gracias a [Granian](https://github.com/emmett-framework/granian), un servidor HTTP de última generación construido en Rust sobre [Hyper](https://github.com/hyperium/hyper) y [Tokio](https://github.com/tokio-rs/tokio), que sirve como motor de red del framework.

## ¿Por qué Granian?

Los servidores Python tradicionales como Gunicorn, Uvicorn o Hypercorn dependen completamente del intérprete CPython para gestionar las conexiones de red. Orionis adopta un enfoque diferente al utilizar Granian, cuyo core de red está implementado en Rust, lo que ofrece ventajas significativas:

| Característica | Servidores tradicionales | Granian |
|----------------|--------------------------|---------|
| **Core de red** | Python (CPython) | Rust (Hyper + Tokio) |
| **HTTP/2** | Soporte limitado o parcial | Nativo |
| **HTTPS / mTLS** | Configuración externa | Integrado |
| **WebSockets** | Requiere extensiones | Integrado |
| **Archivos estáticos** | Servidor externo (Nginx, etc.) | Servicio directo |
| **Protocolos** | Solo ASGI o WSGI | ASGI, RSGI y WSGI |

:::tip[Servidor unificado]
Granian reemplaza la necesidad de combinar múltiples herramientas (Gunicorn + Uvicorn + Nginx), ofreciendo una solución todo-en-uno con rendimiento superior.
:::

## Protocolos Soportados

### ASGI — Compatibilidad con el ecosistema Python

**ASGI** (Asynchronous Server Gateway Interface) es el estándar de la industria para aplicaciones web asíncronas en Python. Al ejecutar Orionis en modo ASGI, la aplicación es compatible con cualquier servidor que implemente este estándar, lo que brinda máxima portabilidad.

**Ventajas del modo ASGI:**

- Compatibilidad con servidores alternativos como Uvicorn, Hypercorn o Daphne
- Integración directa con herramientas y middleware del ecosistema ASGI
- Estándar ampliamente documentado y adoptado por la comunidad Python

**Cuándo usar ASGI:**

- Si necesitas desplegar en infraestructura que requiere un servidor ASGI específico
- Si tu aplicación depende de middleware o herramientas exclusivas del ecosistema ASGI
- Si la portabilidad entre diferentes servidores es una prioridad

### RSGI — Rendimiento máximo con Rust

**RSGI** (Rust Server Gateway Interface) es un protocolo diseñado para aprovechar al máximo las capacidades del runtime de Rust. A diferencia de ASGI, donde Python gestiona la comunicación de red subyacente, en RSGI esta responsabilidad se delega completamente al core de Rust, eliminando cuellos de botella del intérprete Python en las operaciones de I/O.

**Ventajas del modo RSGI:**

- El I/O de red se ejecuta en Rust, fuera del GIL de Python
- Respuestas directas sin la sobrecarga del sistema de mensajes de ASGI
- Soporte nativo para streaming, archivos y respuestas binarias
- Mejor aprovechamiento de los recursos del sistema

**Cuándo usar RSGI:**

- Si el rendimiento es la prioridad principal de tu aplicación
- Si tu despliegue utiliza Granian como servidor (opción por defecto en Orionis)
- Si no necesitas compatibilidad con servidores ASGI de terceros

:::note
Para el desarrollador, el cambio entre ASGI y RSGI es completamente transparente. Orionis maneja internamente la adaptación del protocolo, por lo que tu código de rutas, controladores y middleware funciona exactamente igual en ambos modos.
:::

## Comparación de Protocolos

| Aspecto | ASGI | RSGI |
|---------|------|------|
| **Tipo** | Estándar de la industria Python | Protocolo optimizado para Rust |
| **I/O de red** | Gestionado por Python | Gestionado por Rust |
| **Compatibilidad** | Múltiples servidores | Exclusivo de Granian |
| **HTTP/2** | Depende del servidor | Nativo |
| **Rendimiento** | Alto | Superior |
| **WebSockets** | Sí | Sí |
| **Caso de uso ideal** | Máxima portabilidad | Máximo rendimiento |

## Ejecución del Servidor

Orionis se ejecuta a través de Granian, especificando el protocolo deseado:

```bash
# Modo RSGI (rendimiento máximo — opción por defecto)
granian --interface rsgi bootstrap:app

# Modo ASGI (compatibilidad estándar)
granian --interface asgi bootstrap:app
```

### Configuración

Las opciones principales del servidor pueden configurarse mediante variables de entorno:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `GRANIAN_HOST` | Dirección de escucha | `127.0.0.1` |
| `GRANIAN_PORT` | Puerto de escucha | `8000` |
| `GRANIAN_INTERFACE` | Protocolo (`asgi`, `rsgi`) | `rsgi` |
| `GRANIAN_WORKERS` | Procesos worker | `1` |
| `GRANIAN_HTTP` | Versión HTTP (`auto`, `1`, `2`) | `auto` |

## Ciclo de Vida de la Aplicación

Orionis gestiona automáticamente las fases de **arranque** (startup) y **apagado** (shutdown) de la aplicación. Puedes registrar callbacks que se ejecutarán en cada fase, útiles para inicializar conexiones a bases de datos, cachés, colas de trabajo, o liberar recursos al apagar.

### Registrar callbacks

```python
from orionis.foundation.enums.lifespan import Lifespan
from orionis.foundation.enums.runtimes import Runtime

app = Application()

# Ejecutar al arrancar la aplicación
app.on(Lifespan.STARTUP, init_database, init_cache)

# Ejecutar al apagar (solo en modo HTTP)
app.on(Lifespan.SHUTDOWN, close_connections, runtime=Runtime.HTTP)

# Encadenamiento fluido
app.on(Lifespan.STARTUP, init_db).on(Lifespan.SHUTDOWN, close_db)
```

Los callbacks pueden ser funciones síncronas o asíncronas, y se ejecutan en el orden en que fueron registrados.

:::note
Los callbacks de startup se ejecutan **antes** de que el servidor comience a aceptar solicitudes. Los callbacks de shutdown se ejecutan **después** de que el servidor deje de aceptar nuevas conexiones. Esto garantiza una inicialización y limpieza seguras.
:::

## Flujo de una Solicitud

El siguiente diagrama muestra cómo Orionis procesa una solicitud HTTP:

<div class="http-flow">
  <div class="http-flow-node">
    <span class="http-flow-node-icon">🌐</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Cliente</span>
      <span class="http-flow-node-sub">Solicitud HTTP entrante</span>
    </div>
  </div>
  <div class="http-flow-connector"></div>
  <div class="http-flow-node">
    <span class="http-flow-node-icon">🦀</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Servidor Granian</span>
      <span class="http-flow-node-sub">Core de red en Rust (Hyper + Tokio)</span>
    </div>
  </div>
  <div class="http-flow-branch">
    <div class="http-flow-branch-split"></div>
    <div class="http-flow-branch-cols">
      <div class="http-flow-branch-col">
        <div class="http-flow-branch-connector"></div>
        <div class="http-flow-branch-node asgi">
          <span class="http-flow-branch-tag asgi">ASGI</span>
          <div class="http-flow-branch-info">
            <span class="http-flow-branch-label">Protocolo Estándar</span>
            <span class="http-flow-branch-sub">Compatibilidad con el ecosistema Python</span>
          </div>
        </div>
      </div>
      <div class="http-flow-branch-col">
        <div class="http-flow-branch-connector"></div>
        <div class="http-flow-branch-node rsgi">
          <span class="http-flow-branch-tag rsgi">RSGI</span>
          <div class="http-flow-branch-info">
            <span class="http-flow-branch-label">Protocolo de Alto Rendimiento</span>
            <span class="http-flow-branch-sub">I/O gestionado por Rust</span>
          </div>
        </div>
      </div>
    </div>
    <div class="http-flow-branch-merge"></div>
  </div>
  <div class="http-flow-node">
    <span class="http-flow-node-icon">⚙️</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Orionis Application</span>
      <span class="http-flow-node-sub">Adaptación transparente del protocolo</span>
    </div>
  </div>
  <div class="http-flow-connector"></div>
  <div class="http-flow-node">
    <span class="http-flow-node-icon">🔗</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Pipeline de Solicitud</span>
      <span class="http-flow-node-sub">Middleware, routing y controlador</span>
    </div>
  </div>
  <div class="http-flow-connector"></div>
  <div class="http-flow-node">
    <span class="http-flow-node-icon">📤</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Respuesta</span>
      <span class="http-flow-node-sub">Respuesta enviada al cliente</span>
    </div>
  </div>
</div>

1. El **cliente** envía una solicitud HTTP
2. **Granian** recibe la solicitud en su core de Rust y la enruta según el protocolo configurado (ASGI o RSGI)
3. **Orionis** adapta la solicitud de forma transparente, independientemente del protocolo
4. La solicitud pasa por el **pipeline de middleware**, **routing** y llega al **controlador** correspondiente
5. La **respuesta** se envía de vuelta al cliente a través del mismo canal

:::tip[Transparencia total]
Independientemente del protocolo elegido, tu código de aplicación (rutas, controladores, middleware) permanece exactamente igual. Orionis se encarga de la adaptación entre protocolos de forma interna.
:::

## Ventajas Clave

### Rendimiento de clase empresarial

Gracias al core de red en Rust, Orionis alcanza niveles de rendimiento que los servidores Python puros no pueden igualar. El manejo de conexiones, parsing HTTP y I/O de red se ejecutan fuera del intérprete Python, eliminando el cuello de botella del GIL.

### Flexibilidad de protocolo

No estás atado a un solo protocolo. Puedes cambiar entre ASGI y RSGI con un simple parámetro de configuración, sin modificar una sola línea de código de tu aplicación.

### Infraestructura simplificada

Un solo servidor (Granian) cubre HTTP/1.1, HTTP/2, HTTPS, WebSockets y archivos estáticos. No necesitas combinar múltiples herramientas ni configurar proxies reversos para funcionalidades básicas.

### Ciclo de vida integrado

El sistema de callbacks de ciclo de vida permite inicializar y liberar recursos de forma ordenada, garantizando que tus conexiones a bases de datos, cachés y servicios externos se gestionen correctamente.