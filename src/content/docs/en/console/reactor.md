---
title: Reactor Command Line Interface
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

## Reactor Command Line Interface

Orionis Framework includes a command line interface called **Reactor CLI**, designed to streamline interaction with the framework from the terminal. This tool allows you to run built-in and custom commands to automate common development, administration, and application maintenance tasks.

In this section you will learn:

- What **Reactor CLI** is
- How to use it
- How it works internally
- How it manages asynchronous execution across operating systems

## What is Reactor CLI?

**Reactor CLI** is the official command line interface for **Orionis Framework**.

It provides a set of commands that allow you to perform common tasks during application development, such as:

- Starting the development server
- Generating components or project structures
- Running tests
- Executing scheduled tasks
- Managing framework services

Additionally, **Reactor CLI is fully extensible**, allowing developers to create custom commands tailored to the specific needs of each project.

This makes Reactor CLI a central tool for workflow automation within Orionis.

## Using Reactor CLI

Using **Reactor CLI** is straightforward. From the terminal, you can run commands using the following syntax:

```bash
python reactor [command] [arguments] [--options]
````

For example, to start the development server you can run:

```bash
python reactor serve
```

Once the server is running, you can access your application at:

```
http://localhost:8000
```

<video controls muted controlsList="novolume" width="100%" style="border-radius: 8px; margin: 1.5rem 0;">
  <source src="/assets/videos/HTTPServerOrionis.mp4" type="video/mp4" />
  Your browser does not support the video tag.
</video>

## Using the Python `-B` Flag

In some cases it is recommended to run the CLI using the Python `-B` flag:

```bash
python -B reactor serve
```

The `-B` option tells Python **not to generate bytecode files (`.pyc`)**.

This can be useful in development environments when:

* You are making frequent code changes
* You want to keep the repository clean
* You want to avoid generating `__pycache__` folders

The command behavior will be exactly the same, but without generating compiled files.

## Reactor CLI Entry Point

In every project created with **Orionis Framework** there is a file called:

```
reactor
```

This file is located at the project root and acts as the **CLI entry point**.

Its main responsibility is to:

1. Initialize the framework environment
2. Discover available commands
3. Parse arguments and options
4. Execute the requested command

When you run a command like:

```bash
python reactor serve
```

Reactor CLI internally performs the following process:

1. Loads the framework environment
2. Discovers registered commands
3. Parses the provided arguments and options
4. Resolves the requested command
5. Executes the command logic

This mechanism ensures that commands integrate consistently within the Orionis ecosystem.

## Asynchronous Execution and Event Loop Management

Reactor CLI is designed to leverage Python's **asynchronous** model based on `asyncio`.

To ensure the best possible performance on each platform, Orionis includes an internal **event loop** manager that automatically selects the most suitable implementation depending on the operating system.

This allows asynchronous operations to run using the most efficient event engine available.

## Event Loop Strategy by Operating System

| System      | Loop Used                  | Factory                     |
| ----------- | -------------------------- | --------------------------- |
| **Linux**   | `uvloop` if installed      | `uvloop.new_event_loop`     |
|             | Standard asyncio loop      | `asyncio.new_event_loop`    |
| **macOS**   | `uvloop` if installed      | `uvloop.new_event_loop`     |
|             | Standard asyncio loop      | `asyncio.new_event_loop`    |
| **Windows** | `ProactorEventLoop`        | `asyncio.ProactorEventLoop` |

## Automatic uvloop Usage

When available, Reactor CLI automatically uses **uvloop**.

`uvloop` is an alternative implementation of Python's event loop designed for high performance. It is built on top of **libuv**, the same library used by the Node.js runtime to handle asynchronous I/O operations.

Thanks to this implementation, `uvloop` can offer significant performance improvements over the standard `asyncio` loop.

## Benefits of uvloop

In various benchmarks, `uvloop` has demonstrated:

* Lower latency
* Higher throughput
* Better handling of thousands of concurrent connections

Depending on the type of application, it can be **between 2x and 4x faster** than the default `asyncio` loop.

For this reason, Orionis uses it automatically when available, without requiring any additional configuration from the developer.

If `uvloop` is not installed, Reactor CLI falls back to the standard `asyncio` loop without affecting system compatibility.

## Summary

Reactor CLI is a fundamental tool within the Orionis ecosystem that allows you to:

* Interact with the framework from the terminal
* Automate common development tasks
* Run built-in or custom commands
* Efficiently leverage Python's asynchronous model

Thanks to its automatic event loop detection system, Reactor CLI ensures consistent and optimized behavior across different platforms.