---
title: "Application testing"
description: "Start by saving one case under tests/ and running it through the generated application's Reactor entry point. This boots the same providers and dependency bindings used by your…"
editUrl: true
lastUpdated: false
---

Start by saving one case under `tests/` and running it through the generated application's Reactor entry point. This boots the same providers and dependency bindings used by your application. The shortest path is [Writing and running tests](/en/testing/writing-and-running-tests); continue with [MCP integration tests](/en/testing/mcp-testing) when your project exposes tools.

Use dedicated test data and explicit cleanup when a case accesses persistence or external services. An isolated asyncio loop does not provide an isolated database or automatically undo writes.

## Overview

`orionis.test` is Orionis's asynchronous testing layer on top of Python's `unittest`. It supplies an application-aware `TestCase`, a configurable discovery and execution engine, structured test results, Rich console reporting, and an in-process MCP client that exercises the real JSON-RPC serialization and dispatcher path.

The package is designed for framework and application tests that need Orionis dependency injection without abandoning familiar `unittest` assertions, fixtures, skips, expected failures, or subtests.

## Requirements

- Python 3.14 or newer.
- A normal Orionis application layout when tests require application services.
- Test modules named by the configured file glob and methods named by the configured method glob.
- An MCP server declaration and bootable application container for MCP integration tests.

## Module learning path

- [Writing and running tests](/en/testing/writing-and-running-tests)
- [Testing MCP tools in process](/en/testing/mcp-testing)
- [Results, configuration, and reference](/en/testing/results-and-reference)

Continue with: [foundation](/en/getting-started) · [mcp](/en/protocols/mcp).
