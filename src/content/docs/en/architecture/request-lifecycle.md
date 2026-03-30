---
title: Request Lifecycle
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Introduction

Understanding the request lifecycle is one of the most important aspects of
mastering any framework. When you know the path a request follows from the moment
it enters the system until it produces a response, you can precisely identify
available extension points, anticipate application behavior under different
scenarios, and debug issues more effectively.

Orionis Framework defines two distinct lifecycles depending on the type of
request the application receives:

- **CLI Lifecycle**: triggered when a command is executed from the terminal
  through the `reactor` entrypoint.
- **HTTP Lifecycle**: triggered when an HTTP request reaches the application
  server.

Both lifecycles share the startup and initial configuration stages, but diverge
in how the request is resolved and executed. The following sections describe each
stage in detail, explaining its responsibility within the framework and the
implications for the developer.

## CLI Request Lifecycle

### Flow Overview

<div class="flow-diagram">
  <div class="flow-node">
    <span class="flow-node-badge">1</span>
    <div class="flow-node-info">
      <span class="flow-node-label">bootstrap/app.py</span>
      <span class="flow-node-sub">Explicit application configuration</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">2</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Bootstrap</span>
      <span class="flow-node-sub">Loading configuration, services, and global handler</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">3</span>
    <div class="flow-node-info">
      <span class="flow-node-label">reactor — CLI entrypoint</span>
      <span class="flow-node-sub">Captures sys.argv and delegates to the console kernel</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">4</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Container — IoC</span>
      <span class="flow-node-sub">Dependency resolution and lifecycle management</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">5</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Console Kernel</span>
      <span class="flow-node-sub">Argument parsing and command dispatching</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">6</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Command Handler</span>
      <span class="flow-node-sub">Validation, injection, and context management</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">7</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Command Execution</span>
      <span class="flow-node-sub">Invocation of the handle method with business logic</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">8</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Response / Exit Code</span>
      <span class="flow-node-sub">Exit code 0 (success) or non-zero (error)</span>
    </div>
  </div>
</div>

### CLI Lifecycle Stages

#### 1. bootstrap/app.py

Everything begins in the `bootstrap/app.py` file, which serves as the explicit
configuration point for the application. Here the developer declares the
system's general behaviors: service providers to load, custom bindings in the
container, environment configuration, and any other parameters the application
needs to know before initialization.

This file does not execute business logic; its sole purpose is to build and
deliver a properly configured application instance to the bootstrap process.

#### 2. Bootstrap

The bootstrap is the most critical stage of the entire lifecycle. During this
process, the framework loads and interprets all configuration defined in the
`config` directory, applies the explicit values received from `bootstrap/app.py`,
and prepares the framework's internal subsystems for operation.

Tasks performed during bootstrap include:

- Registration and booting of all service providers (`ServiceProviders`).
- Configuration of the global exception handler.
- Preparation of the Inversion of Control (IoC) container.
- Loading of environment variables and configuration parameters.

It is essential to understand that the global exception handler is configured
**within** the bootstrap. If the bootstrap fails before completing, that handler
will not have been registered and any error produced during this stage will
propagate as an unhandled exception. For this reason, configuration errors or
dependency incompatibilities during startup must be resolved directly in the
configuration files or in the affected service providers, and should not rely
on global handling for their capture.

#### 3. Reactor — CLI Entrypoint

`reactor` is the file located at the project root that acts as the centralized
entry point for all console requests. Its responsibility is to capture the
system arguments (`sys.argv`), instantiate the previously configured application,
and delegate them to the console kernel for processing.

This file contains no business logic or routing logic; it is intentionally thin
to maintain separation of responsibilities between the entrypoint and the rest
of the system.

#### 4. Container — IoC

The Inversion of Control (IoC) container is the core of Orionis Framework's
architecture. Once the bootstrap has completed its process, the container is
fully initialized and available to resolve any dependency registered in the
application.

Its responsibilities at this point in the lifecycle include:

- **Dependency resolution**: automatically instantiates the classes required
  by the command to execute, injecting their dependencies recursively.
- **Instance lifecycle management**: determines whether a dependency should
  be resolved as a *singleton* (a single shared instance throughout the
  application's lifetime), *transient* (a new instance per resolution
  request), or *scoped* (a new instance per request lifecycle).
- **Structural decoupling**: allows commands, services, and repositories to
  declare their dependencies by type without knowing the construction details
  of each one.

Refer to the [Service Container](/en/architecture/service-container) documentation
for the complete dependency registration and resolution API.

#### 5. Console Kernel

The console kernel receives the arguments processed by `reactor` and orchestrates
the request execution. Its responsibilities are:

- Parsing and interpreting command-line arguments and options.
- Locating the command that matches the provided signature.
- Resolving the command instance through the IoC container.
- Transferring control to the command handler for execution.

#### 6. Command Handler

The command handler is the intermediate layer between the kernel and the concrete
command logic. It receives the command instance already resolved by the container
and is responsible for:

- Validating that required arguments are present and consistent.
- Injecting additional dependencies declared in the `handle` method for boilerplate commands, or in the method defined for command routes.
- Managing the command's execution context.
- Capturing and delegating to the global handler any unhandled exceptions that
  arise during execution.

#### 7. Command Execution

At this stage, the `handle` method of the corresponding command is invoked for boilerplate commands; otherwise, the class method defined in the command routes is called. This method
contains the specific business logic for the requested operation. Here the
command can:

- Read the arguments and options provided by the user.
- Interact with services, repositories, and other injected dependencies.
- Emit console output using the `BaseCommand` API (`success`, `info`,
  `warning`, `error`, `table`, `progressBar`, etc.).
- Request interactive user input (`ask`, `confirm`, `choice`, etc.).
- Explicitly terminate the process with `exitSuccess` or `exitError`.

#### 8. Response — Exit Code

Upon completion of the `handle` method execution, the framework determines the
process exit code:

- If the method finishes without unhandled exceptions, the process exits with
  code `0` (success).
- If the method throws an unhandled exception, the process exits with a
  non-zero code (error).
- If `exitSuccess(...)` is called explicitly, the process exits with
  code `0`.
- If `exitError(...)` is called explicitly, the process exits with
  code `1`.

This exit code is relevant for CI/CD integrations, automation scripts, or any
external process that evaluates the result of the command execution.

## HTTP Request Lifecycle

### Flow Overview

<div class="flow-diagram">
  <div class="flow-node">
    <span class="flow-node-badge">1</span>
    <div class="flow-node-info">
      <span class="flow-node-label">bootstrap/app.py</span>
      <span class="flow-node-sub">Explicit application configuration</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">2</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Bootstrap</span>
      <span class="flow-node-sub">Loading configuration, services, and global handler</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">3</span>
    <div class="flow-node-info">
      <span class="flow-node-label">HTTP Server — ASGI / RSGI</span>
      <span class="flow-node-sub">Network entrypoint compatible with Granian, Uvicorn, and Hypercorn</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">4</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Container — IoC</span>
      <span class="flow-node-sub">Dependency resolution for controllers and middleware</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">5</span>
    <div class="flow-node-info">
      <span class="flow-node-label">HTTP Kernel</span>
      <span class="flow-node-sub">Pipeline orchestration and global middleware</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">6</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Middleware Pipeline</span>
      <span class="flow-node-sub">Input and output processing chain</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">7</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Router</span>
      <span class="flow-node-sub">Route and HTTP method resolution for the incoming request</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">8</span>
    <div class="flow-node-info">
      <span class="flow-node-label">Controller / Handler</span>
      <span class="flow-node-sub">Execution of the request's business logic</span>
    </div>
  </div>
  <div class="flow-connector"></div>
  <div class="flow-node">
    <span class="flow-node-badge">9</span>
    <div class="flow-node-info">
      <span class="flow-node-label">HTTP Response</span>
      <span class="flow-node-sub">Serialization and delivery of the response to the client</span>
    </div>
  </div>
</div>

### HTTP Lifecycle Stages

#### 1. bootstrap/app.py and Bootstrap

The first two stages of the HTTP lifecycle are identical to those of the CLI
lifecycle. The application is configured through `bootstrap/app.py` and the
bootstrap initializes all framework subsystems, including the IoC container,
the global exception handler, and the service providers.

This symmetry ensures that regardless of the type of request the application
receives, the system state at the time of processing is always consistent and
predictable.

#### 2. HTTP Server — ASGI / RSGI Entrypoint

The HTTP server acts as the entry point for network requests. Orionis Framework
is compatible with both the **ASGI** and **RSGI** protocols, allowing integration
with high-performance servers such as Granian, Uvicorn, or Hypercorn.

The HTTP entrypoint receives the raw request from the server, constructs the
framework's internal request object, and delivers it to the HTTP kernel for
processing.

#### 3. Container — IoC

Just as in the CLI lifecycle, the IoC container is fully available during the
HTTP lifecycle and is responsible for resolving all dependencies of controllers,
middleware, and services that participate in request processing.

#### 4. HTTP Kernel

The HTTP kernel is the central orchestrator of the network request lifecycle.
It receives the request object and coordinates its passage through the middleware
pipeline before delivering it to the router.

The kernel also manages the configuration of global middleware that must be
applied to all requests, such as session management, authentication, or security
headers.

#### 5. Middleware Pipeline

The middleware pipeline is a chain of processing layers that the request passes
through before reaching the controller and, in reverse, before the response is
sent to the client. Each middleware can:

- Inspect or modify the incoming request.
- Interrupt the flow and return a response directly (for example, in case of
  failed authentication).
- Inspect or modify the outgoing response.
- Execute cross-cutting logic such as logging, rate limiting, or CORS.

Middleware is executed in the order in which it is registered.

#### 6. Router

The router is responsible for analyzing the URL and HTTP method of the incoming
request and determining which controller or handler should process it. It
evaluates the routes registered in the application and selects the first one
that matches the request pattern.

If no route matches, the router delegates to the global handler to send a
`404 Not Found` response. If the route exists but the HTTP method is not
allowed, a `405 Method Not Allowed` response is returned.

#### 7. Controller / Handler

Once the router has identified the corresponding route, the associated controller
or handler is resolved through the IoC container. This ensures that all
dependencies declared in the constructor or controller method are automatically
injected.

Here the request's business logic is executed: database queries, service calls,
data transformations, and any other operations needed to produce the response.

#### 8. HTTP Response

The controller returns a response object that the framework serializes and
delivers to the HTTP server to be sent to the client. The response includes the
status code, HTTP headers, and the message body.

Before being sent, the response travels back through the middleware pipeline in
reverse order, allowing each layer to apply final transformations to the output.

## Key Takeaways for Developers

Understanding the complete lifecycle allows you to precisely leverage the
extension points the framework offers:

- **Service providers**: the right place to register bindings, listen for system
  events, or initialize application-specific subsystems. They execute during
  bootstrap, before any request.
- **Middleware**: the appropriate layer for cross-cutting logic that should apply
  to multiple routes or all HTTP requests without modifying individual
  controllers.
- **IoC container**: the preferred mechanism for managing dependencies between
  classes; it avoids direct coupling and facilitates unit testing.
- **Command Handler / Controller**: where the business logic specific to each
  operation should reside, delegating responsibilities to specialized services
  and repositories.

## Persistent Application State

<div class="advantage-banner">
  <div class="advantage-banner-header">
    <span class="advantage-banner-icon">⚡</span>
    <div>
      <p class="advantage-banner-title">Persistent process architecture</p>
      <p class="advantage-banner-subtitle">A key architectural advantage over traditional WSGI frameworks</p>
    </div>
  </div>
  <div class="advantage-banner-body">
    <p class="advantage-banner-lead">
      Unlike traditional WSGI-based frameworks, where the application state is
      destroyed and completely rebuilt on every request,
      <strong>Orionis Framework adopts a persistent process model</strong> compatible with
      ASGI and RSGI. The IoC container, registered services, database connections,
      and any resources initialized during bootstrap remain alive throughout the
      entire process lifetime, efficiently shared across requests.
    </p>
    <div class="advantage-grid">
      <div class="advantage-card">
        <span class="advantage-card-icon">🚀</span>
        <span class="advantage-card-title">Single startup</span>
        <span class="advantage-card-desc">Bootstrap and service registration execute only once. Each request arrives at a fully ready system.</span>
      </div>
      <div class="advantage-card">
        <span class="advantage-card-icon">🔗</span>
        <span class="advantage-card-title">Reused connections</span>
        <span class="advantage-card-desc">Database connection pools and HTTP clients remain open and available between requests.</span>
      </div>
      <div class="advantage-card">
        <span class="advantage-card-icon">🧠</span>
        <span class="advantage-card-title">True singletons</span>
        <span class="advantage-card-desc">Dependencies registered as singletons retain their state and identity throughout the entire process lifetime.</span>
      </div>
      <div class="advantage-card">
        <span class="advantage-card-icon">⚡</span>
        <span class="advantage-card-title">Lower latency</span>
        <span class="advantage-card-desc">By eliminating per-request initialization overhead, response latency is significantly reduced.</span>
      </div>
    </div>
    <div class="advantage-context-grid">
      <div class="advantage-context-item">
        <span class="advantage-context-icon">🖥️</span>
        <div class="advantage-context-content">
          <span class="advantage-context-title">HTTP Context</span>
          <span class="advantage-context-desc">The server process remains active indefinitely. Each incoming request reuses the same IoC container state without reinitialization.</span>
        </div>
      </div>
      <div class="advantage-context-item">
        <span class="advantage-context-icon">📦</span>
        <div class="advantage-context-content">
          <span class="advantage-context-title">CLI Context</span>
          <span class="advantage-context-desc">The lifecycle starts and ends with the command. Compound commands invoked via <code>Reactor.call</code> share the same container and state as the original request.</span>
        </div>
      </div>
      <div class="advantage-context-item">
        <span class="advantage-context-icon">🕒</span>
        <div class="advantage-context-content">
          <span class="advantage-context-title">Scheduler Context</span>
          <span class="advantage-context-desc">When using <code>schedule:work</code>, the worker remains active between scheduled task executions, reusing connections and services without restarting the process.</span>
        </div>
      </div>
    </div>
  </div>
</div>