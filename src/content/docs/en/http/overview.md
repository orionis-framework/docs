---
title: 'Overview'
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## HTTP in Orionis

Orionis Framework provides a modern, high-performance HTTP layer designed to serve web applications with maximum efficiency. Thanks to its flexible architecture, Orionis natively supports two communication protocols: **ASGI** and **RSGI**, allowing developers to choose between compatibility with the standard Python ecosystem or superior performance powered by Rust technology.

This is made possible by [Granian](https://github.com/emmett-framework/granian), a next-generation HTTP server built in Rust on top of [Hyper](https://github.com/hyperium/hyper) and [Tokio](https://github.com/tokio-rs/tokio), which serves as the framework's network engine.

## Why Granian?

Traditional Python servers like Gunicorn, Uvicorn, or Hypercorn rely entirely on the CPython interpreter to manage network connections. Orionis takes a different approach by using Granian, whose network core is implemented in Rust, offering significant advantages:

| Feature | Traditional servers | Granian |
|---------|---------------------|---------|
| **Network core** | Python (CPython) | Rust (Hyper + Tokio) |
| **HTTP/2** | Limited or partial support | Native |
| **HTTPS / mTLS** | External configuration | Built-in |
| **WebSockets** | Requires extensions | Built-in |
| **Static files** | External server (Nginx, etc.) | Direct serving |
| **Protocols** | ASGI or WSGI only | ASGI, RSGI, and WSGI |

:::tip[Unified server]
Granian replaces the need to combine multiple tools (Gunicorn + Uvicorn + Nginx), offering an all-in-one solution with superior performance.
:::

## Supported Protocols

### ASGI — Python Ecosystem Compatibility

**ASGI** (Asynchronous Server Gateway Interface) is the industry standard for asynchronous web applications in Python. When running Orionis in ASGI mode, the application is compatible with any server that implements this standard, providing maximum portability.

**ASGI mode advantages:**

- Compatibility with alternative servers like Uvicorn, Hypercorn, or Daphne
- Direct integration with ASGI ecosystem tools and middleware
- Widely documented standard adopted by the Python community

**When to use ASGI:**

- If you need to deploy on infrastructure that requires a specific ASGI server
- If your application depends on middleware or tools exclusive to the ASGI ecosystem
- If portability across different servers is a priority

### RSGI — Maximum Performance with Rust

**RSGI** (Rust Server Gateway Interface) is a protocol designed to fully leverage the capabilities of the Rust runtime. Unlike ASGI, where Python manages the underlying network communication, in RSGI this responsibility is entirely delegated to the Rust core, eliminating Python interpreter bottlenecks in I/O operations.

**RSGI mode advantages:**

- Network I/O runs in Rust, outside Python's GIL
- Direct responses without the overhead of ASGI's message system
- Native support for streaming, files, and binary responses
- Better utilization of system resources

**When to use RSGI:**

- If performance is your application's top priority
- If your deployment uses Granian as the server (default option in Orionis)
- If you don't need compatibility with third-party ASGI servers

:::note
For developers, switching between ASGI and RSGI is completely transparent. Orionis handles protocol adaptation internally, so your route, controller, and middleware code works exactly the same in both modes.
:::

## Protocol Comparison

| Aspect | ASGI | RSGI |
|--------|------|------|
| **Type** | Python industry standard | Rust-optimized protocol |
| **Network I/O** | Managed by Python | Managed by Rust |
| **Compatibility** | Multiple servers | Granian exclusive |
| **HTTP/2** | Depends on server | Native |
| **Performance** | High | Superior |
| **WebSockets** | Yes | Yes |
| **Ideal use case** | Maximum portability | Maximum performance |

## Running the Server

Orionis runs through Granian, specifying the desired protocol:

```bash
# RSGI mode (maximum performance — default option)
granian --interface rsgi bootstrap:app

# ASGI mode (standard compatibility)
granian --interface asgi bootstrap:app
```

### Configuration

The main server options can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `GRANIAN_HOST` | Listening address | `127.0.0.1` |
| `GRANIAN_PORT` | Listening port | `8000` |
| `GRANIAN_INTERFACE` | Protocol (`asgi`, `rsgi`) | `rsgi` |
| `GRANIAN_WORKERS` | Worker processes | `1` |
| `GRANIAN_HTTP` | HTTP version (`auto`, `1`, `2`) | `auto` |

## Application Lifecycle

Orionis automatically manages the application's **startup** and **shutdown** phases. You can register callbacks that will execute during each phase, useful for initializing database connections, caches, job queues, or releasing resources on shutdown.

### Registering callbacks

```python
from orionis.foundation.enums.lifespan import Lifespan
from orionis.foundation.enums.runtimes import Runtime

app = Application()

# Execute on application startup
app.on(Lifespan.STARTUP, init_database, init_cache)

# Execute on shutdown (HTTP mode only)
app.on(Lifespan.SHUTDOWN, close_connections, runtime=Runtime.HTTP)

# Fluent chaining
app.on(Lifespan.STARTUP, init_db).on(Lifespan.SHUTDOWN, close_db)
```

Callbacks can be synchronous or asynchronous functions, and they execute in the order they were registered.

:::note
Startup callbacks execute **before** the server begins accepting requests. Shutdown callbacks execute **after** the server stops accepting new connections. This ensures safe initialization and cleanup.
:::

## Request Flow

The following diagram shows how Orionis processes an HTTP request:

<div class="http-flow">
  <div class="http-flow-node">
    <span class="http-flow-node-icon">🌐</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Client</span>
      <span class="http-flow-node-sub">Incoming HTTP request</span>
    </div>
  </div>
  <div class="http-flow-connector"></div>
  <div class="http-flow-node">
    <span class="http-flow-node-icon">🦀</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Granian Server</span>
      <span class="http-flow-node-sub">Rust network core (Hyper + Tokio)</span>
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
            <span class="http-flow-branch-label">Standard Protocol</span>
            <span class="http-flow-branch-sub">Python ecosystem compatibility</span>
          </div>
        </div>
      </div>
      <div class="http-flow-branch-col">
        <div class="http-flow-branch-connector"></div>
        <div class="http-flow-branch-node rsgi">
          <span class="http-flow-branch-tag rsgi">RSGI</span>
          <div class="http-flow-branch-info">
            <span class="http-flow-branch-label">High-Performance Protocol</span>
            <span class="http-flow-branch-sub">I/O managed by Rust</span>
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
      <span class="http-flow-node-sub">Transparent protocol adaptation</span>
    </div>
  </div>
  <div class="http-flow-connector"></div>
  <div class="http-flow-node">
    <span class="http-flow-node-icon">🔗</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Request Pipeline</span>
      <span class="http-flow-node-sub">Middleware, routing, and controller</span>
    </div>
  </div>
  <div class="http-flow-connector"></div>
  <div class="http-flow-node">
    <span class="http-flow-node-icon">📤</span>
    <div class="http-flow-node-info">
      <span class="http-flow-node-label">Response</span>
      <span class="http-flow-node-sub">Response sent back to the client</span>
    </div>
  </div>
</div>

1. The **client** sends an HTTP request
2. **Granian** receives the request in its Rust core and routes it based on the configured protocol (ASGI or RSGI)
3. **Orionis** adapts the request transparently, regardless of the protocol
4. The request passes through the **middleware pipeline**, **routing**, and reaches the corresponding **controller**
5. The **response** is sent back to the client through the same channel

:::tip[Full transparency]
Regardless of the chosen protocol, your application code (routes, controllers, middleware) remains exactly the same. Orionis handles protocol adaptation internally.
:::

## Key Advantages

### Enterprise-Class Performance

Thanks to the Rust network core, Orionis achieves performance levels that pure Python servers cannot match. Connection handling, HTTP parsing, and network I/O run outside the Python interpreter, eliminating the GIL bottleneck.

### Protocol Flexibility

You're not locked into a single protocol. You can switch between ASGI and RSGI with a simple configuration parameter, without modifying a single line of your application code.

### Simplified Infrastructure

A single server (Granian) covers HTTP/1.1, HTTP/2, HTTPS, WebSockets, and static files. You don't need to combine multiple tools or configure reverse proxies for basic functionality.

### Integrated Lifecycle

The lifecycle callback system allows you to initialize and release resources in an orderly fashion, ensuring your database connections, caches, and external services are managed correctly.