# Orionis Framework Documentation
## Build Without Boundaries.

The async Python framework with a Rust-powered HTTP core that delivers **10x faster** responses. Elegant architecture, maximum productivity, zero compromise.

```bash
pip install orionis
```

## 🌟 What is Orionis?

Orionis is a high-performance async Python framework designed for modern web applications. Built on Granian — the fastest HTTP server in the Python ecosystem — it combines the power of Rust with the expressiveness of Python to deliver a complete toolkit for building extraordinary applications. Every module is mission-critical and production-ready.

> ⚠️ **Pre-release build** — Current version v0.755.0. Not recommended for production environments yet.

## 🚀 System Capabilities

### ⚡ Rust-Powered HTTP Core
Revolutionary HTTP engine built on Granian ASGI/RSGI. Responses **10x faster** than traditional Python frameworks.

### 🔥 Async-First Architecture
Built from scratch for async/await patterns. Handle millions of concurrent connections with **sub-millisecond** response times.

### 🧪 Reactor CLI
Smart command line with distributed task management, custom commands, task scheduling, and enterprise-level job processing.

```bash
# Initialize the reactor core
python -B reactor serve

# Fabricate a new command module
python -B reactor make:command sync_users

# Engage scheduled tasks
python -B reactor schedule:work

# Run diagnostics
python -B reactor test

# List all mission modules
python -B reactor list
```

### 🛡️ Security by Design
Enterprise-grade security with built-in authentication, middleware protection, and OWASP compliance from day one.

### 🏛️ Elegant Architecture
Service providers, middleware, dependency injection, and facades. Clean patterns that scale from startups to enterprises.

### 🧬 Native Testing Suite
Testing framework designed for async applications. Expressive syntax, parallel execution, and complete coverage.

## 📐 Code That Feels Like Home

### Clean, Declarative Setup
Configure your entire application in a single file. Routes, middleware, schedulers, exception handlers — all declared explicitly. No hidden configuration.

```python
# bootstrap/app.py
from pathlib import Path
from app.console.scheduler import Scheduler
from app.exceptions.handler import ExceptionHandler
from orionis.foundation.application import Application

app = Application(base_path=Path(__file__).resolve().parent.parent)

app.withRouting(
    console="routes/console.py",
    web="routes/web.py",
    api="routes/api.py",
    health="/up"
)

app.withScheduler(Scheduler)
app.withExceptionHandler(ExceptionHandler)
app.withProviders(
    AppServiceProvider,
    # Add additional providers below...
)

app.create()
```

### Powerful Dependency Injection
Register services with elegant contracts. Singleton, transient, or scoped lifecycles — the IoC container resolves dependencies automatically through type annotations.

```python
# app/providers/app_service_provider.py
from orionis.container.providers.service_provider import ServiceProvider
from app.contracts.email import IEmailService
from app.services.email import EmailService

class AppServiceProvider(ServiceProvider):

    def register(self):
        self.app.singleton(
            IEmailService,
            EmailService
        )

    async def boot(self):
        # Called after all providers are registered
        pass
```

## 🏗️ Designed for Real-World Scale

A layered architecture with clear separation of concerns:

| Deck | Layer | Responsibilities |
|------|-------|-----------------|
| 01 | **HTTP / CLI** | Routes, Controllers, Commands, Middleware |
| 02 | **Service Layer** | Providers, Facades, Services, Jobs |
| 03 | **Core** | IoC Container, Request Lifecycle, Exception Handler, Scheduler |
| 04 | **Infrastructure** | Granian ASGI/RSGI, Async Event Loop, Worker Management, Security |

- **Convention over Config** — Sensible defaults that just work. Override only what you need.
- **Modular by Design** — Service providers, deferred loading, and clean separation of concerns.
- **Test-First Mindset** — Native testing suite with async support, mocking, and parallel execution.

## 📈 Mission Telemetry

Powered by Granian, the fastest HTTP server in the Python ecosystem, built with Rust:

| Metric | Value | Source |
|--------|-------|--------|
| **455k+** req/s | Orionis (projected) | Granian RSGI baseline |
| **<2ms** avg latency | Internal benchmarks | Granian RSGI |
| **2.6x** faster than FastAPI | JSON serialization throughput | TechEmpower R22 |
| **6.6x** faster than Django | JSON serialization throughput | TechEmpower R22 |

> Granian RSGI scored 652k raw requests/sec (TechEmpower R22). Orionis adds framework overhead, projected ~455k req/s.

## 📚 Documentation

This documentation is built with [Starlight](https://starlight.astro.build/) and covers:

- **Installation guides** — Prerequisites and setup steps
- **Architecture** — Service container, facades, request lifecycle, service providers
- **Console** — Reactor CLI, custom commands, task scheduling
- **HTTP** — Overview, background tasks, client disconnection handling
- **Services** — Encrypter, environment, cache, logging
- **Testing** — Test engine, test cases, results
- **Helpers** — Collections, date/time, stringable, workers, and more
- **Multi-language** — Available in English and Spanish

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

## 🌍 Available Languages

- **English** (`/en/`) — Complete documentation in English
- **Español** (`/es/`) — Documentación completa en español

## 🤝 Contributing

1. Fork the repository
2. Create a branch for your contribution
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License — © 2023–2026 Raul Mauricio Uñate Castro & Orionis Framework Team.

---

> **[Launch Mission →](https://docs.orionis-framework.com) · [Source Code](https://github.com/orionis-framework/framework) · [orionis-framework.com](https://orionis-framework.com)**
