---
title: Client Disconnection
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Client Disconnection

In any web application, a client can disconnect at any time: by closing the browser, refreshing the page, canceling a request, or simply losing network connectivity. When that happens, the server may continue processing a request that no one will ever receive — wasting CPU cycles, memory, database connections, and I/O bandwidth.

Orionis Framework solves this problem at the core level. Every HTTP connection — whether served over **ASGI** or **RSGI** — is monitored concurrently for client disconnection. When a disconnect is detected, Orionis **immediately cancels** all in-flight processing tied to that connection, freeing resources without any action required from the developer.

---

## The Problem

Most Python web frameworks do not detect client disconnection automatically. When a client closes the connection, the server keeps processing the request as if nothing happened:

- Database queries continue executing.
- External API calls remain in flight.
- CPU-intensive computations run to completion.
- Streaming responses keep producing chunks that are never delivered.
- Background I/O operations consume bandwidth for data no one will receive.

In high-concurrency applications — handling hundreds or thousands of simultaneous connections — this wasted work accumulates rapidly. The result is degraded throughput, higher latency for active clients, and in severe cases, resource exhaustion that can bring down the server entirely.

### What Other Frameworks Typically Offer

Most popular Python frameworks leave disconnect detection to the application developer:

| Approach | Limitation |
|----------|-----------|
| **Manual polling** | The handler must periodically call a method like `request.is_disconnected()` inside loops, adding complexity and rarely being implemented in practice. |
| **Middleware-based detection** | Middleware runs at the boundary of request processing, meaning the handler and all its downstream work have already been initiated before any disconnect check occurs. |
| **No built-in support** | Many frameworks expose no mechanism at all, relying on OS-level TCP timeouts that can take minutes to fire. |

These approaches share a common flaw: they are **reactive** rather than **proactive**. They detect the disconnection after work has already been done, not before or during.

---

## How Orionis Handles Disconnection

Orionis natively monitors the client connection at the protocol level throughout the entire lifecycle of each request. When a disconnect event is detected, the request processing is canceled immediately — not at the next polling interval, not after the response is built, but at the exact moment the protocol signals the disconnection.

This mechanism operates transparently at the framework core. Your route handlers, middleware, and application code require **zero modifications** to benefit from it.

### Supported Disconnect Scenarios

Orionis detects and handles all common disconnection events:

- **Browser tab closed** — The TCP connection terminates and the server receives a disconnect signal.
- **Page refresh (F5)** — The browser aborts the current request before issuing a new one.
- **Request canceled** — The user or client-side code explicitly aborts the fetch/XHR.
- **Network loss** — The client loses connectivity (Wi-Fi drop, mobile network switch, sleep mode).
- **Client timeout** — The client's HTTP library enforces a deadline and closes the socket.

In every case, Orionis cancels request processing and reclaims all resources tied to that connection.

---

## Protocol Support

Orionis natively supports two server protocols, and disconnect detection works seamlessly on both:

### ASGI Protocol

When running under ASGI, Orionis intercepts disconnect signals (`http.disconnect`) directly from the server channel. The framework detects the disconnection proactively, regardless of what the handler is doing at that moment — whether it's awaiting a database query, calling an external API, or computing a response. No manual calls to `receive()` or explicit disconnect checks are required in your application code.

### RSGI Protocol

RSGI is the native protocol of Orionis, powered by [Granian](https://github.com/emmett-framework/granian). Orionis leverages the protocol's built-in disconnect signaling to detect when a client closes the connection, canceling request processing immediately. Additionally, keep-alive connections are properly preserved after the response is sent, following the RSGI specification.

:::tip[RSGI advantage]
Because RSGI provides disconnect signaling at the protocol level — powered by Rust (Hyper + Tokio) — disconnect detection in RSGI mode is slightly more efficient than the ASGI path.
:::

---

## Streaming Responses

Client disconnection is particularly important for streaming responses (Server-Sent Events, large file downloads, chunked transfers). Without disconnect detection, the server would continue generating and transmitting chunks indefinitely even after the client is gone.

Orionis handles streaming disconnection comprehensively:

- When a disconnect is detected, any active streaming response is interrupted immediately — no further chunks are produced or transmitted.
- The connection state is verified **between each chunk**, so even during long-running streams the framework catches the disconnect before the next chunk is sent.
- This applies equally to both ASGI and RSGI protocols, with no configuration or special handling required in your streaming code.

---

## Request Body Streaming

Disconnect detection also applies when reading the request body as a stream. If the client disconnects while the server is still consuming the incoming body, Orionis detects the situation and terminates the stream appropriately — raising an error in ASGI mode or ending the stream naturally in RSGI mode.

This prevents the server from waiting indefinitely for body data that will never arrive.

---

## Zero Configuration

Unlike other frameworks where you must implement manual checks, write custom middleware, or add polling loops, Orionis requires **no configuration** to enable disconnect detection. It is always active for every HTTP request, on both ASGI and RSGI protocols.

There is nothing to enable, no middleware to register, no decorator to apply, and no conditional checks to write in your handlers. The framework handles it transparently.

| Feature | Other frameworks | Orionis |
|---------|-----------------|---------|
| **Detection mechanism** | Manual polling / middleware | Native concurrent monitoring |
| **Handler modification required** | Yes | No |
| **Streaming disconnect detection** | Rarely supported | Built-in at adapter level |
| **Body stream disconnect** | Not handled | Automatic error propagation |
| **Resource cleanup** | Developer responsibility | Automatic via task cancellation |
| **Configuration needed** | Middleware registration, decorators | None — always active |

---

## Graceful Cleanup

When request processing is canceled due to client disconnection, Orionis ensures that all cleanup logic executes normally:

- `try`/`finally` blocks and async context managers (`async with`) run their cleanup code as expected.
- Database transactions can be rolled back, file handles closed, and temporary resources released.
- The disconnection is handled entirely at the framework level — it never propagates as an unhandled exception to your application logs.

The request simply ends silently, as if the client had received the response and moved on.

---

## Performance Impact

The disconnect detection system adds negligible overhead to request processing. The monitoring mechanism remains idle until a disconnect event actually occurs, consuming virtually no CPU or memory during normal operation.

The HTTP kernel is lazily initialized on the first request and cached for all subsequent requests, so disconnect detection does not affect startup time or per-request resolution.

In return, the system **eliminates all wasted work** from disconnected clients — a net positive for any application under real-world traffic conditions.

---

## Summary

Orionis Framework treats client disconnection as a first-class concern, not an afterthought. By monitoring every connection concurrently at the protocol level, the framework ensures that server resources are never wasted on requests that no client will receive. This operates transparently across both ASGI and RSGI protocols, requires zero configuration, and handles all common disconnection scenarios — from browser closes to network failures — with immediate task cancellation and graceful resource cleanup.