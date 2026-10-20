// Optional real-server probe, driven by scripts/check-realtime-client-integration.py.
// Uses a read-only snapshot of @orionis-framework/realtime-client from the
// explicitly supplied --client-root. An Orionis environment is also required.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [origin, filename] = process.argv.slice(2);
const { RealtimeClient, RemoteError, TimeoutError, AbortError, LimitError } =
    await import(pathToFileURL(filename).href);
const clients = [];
const sockets = [];
let checks = 0;
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function until(predicate) {
    const end = Date.now() + 5000;
    while (!predicate()) {
        if (Date.now() > end) throw new Error("Interop condition timed out");
        await sleep(10);
    }
}
function open(path, options = {}) {
    const client = new RealtimeClient(new URL(path, origin), {
        reconnect: { enabled: false },
        heartbeatIntervalMs: 30,
        heartbeatTimeoutMs: 1000,
        closeTimeoutMs: 150,
        ...options,
        webSocketFactory: (url, protocols) => {
            const socket = new WebSocket(url, protocols);
            sockets.push(socket);
            return socket;
        },
    });
    clients.push(client);
    return client;
}
const guideExampleIds = [
    "connect", "kwargs", "events", "callback", "stream", "cancel-stream",
    "stop-restart", "node", "errors",
];
function markedExamples(markdown) {
    const examples = new Map();
    const pattern = /<!-- realtime-example: ([a-z-]+) -->\s*```javascript\n([\s\S]*?)\n```/g;
    for (const [, id, code] of markdown.replace(/\r\n?/g, "\n").matchAll(pattern)) {
        assert.equal(examples.has(id), false, "Duplicate guide example: " + id);
        examples.set(id, code);
    }
    assert.deepEqual([...examples.keys()].sort(), [...guideExampleIds].sort());
    return examples;
}
async function runGuideExamples() {
    const reports = [];
    const NativeWebSocket = globalThis.WebSocket;
    const previousUrl = process.env.ORIONIS_REALTIME_URL;
    // Account for connections opened by the unmodified npm import in examples.
    globalThis.WebSocket = class TrackedWebSocket extends NativeWebSocket {
        constructor(...args) {
            super(...args);
            sockets.push(this);
        }
    };
    process.env.ORIONIS_REALTIME_URL = new URL("/realtime/math", origin).href;
    try {
        const locales = (process.env.ORIONIS_REALTIME_GUIDE_LOCALES || "es,en").split(",");
        assert.ok(locales.length && locales.every(locale => ["es", "en"].includes(locale)));
        for (const locale of locales) {
            const markdown = await fs.readFile(new URL(
                `../src/content/docs/${locale}/asynchronous/realtime/javascript-client.md`,
                import.meta.url,
            ), "utf8");
            for (const [id, code] of markedExamples(markdown)) {
                const logs = [];
                const errors = [];
                globalThis.__orionisRealtimeGuideHarness = {
                    location: new URL("/guide-example", origin),
                    window: { confirm: () => true },
                    console: {
                        log: (...args) => logs.push(args),
                        info: (...args) => logs.push(args),
                        warn: (...args) => logs.push(args),
                        error: (...args) => errors.push(args),
                    },
                };
                const prefix = id === "node"
                    ? "const { console } = globalThis.__orionisRealtimeGuideHarness;\n"
                    : "const { console, location, window } = globalThis.__orionisRealtimeGuideHarness;\n";
                const file = path.join(path.dirname(filename), `guide-${locale}-${id}.mjs`);
                await fs.writeFile(file, prefix + code + "\nexport { client };\n", "utf8");
                // The earlier chat UI probe has DOM doubles. Remove them for
                // the Node consumer so missing browser APIs cannot go unnoticed.
                const browserGlobals = new Map();
                if (id === "node") {
                    for (const name of ["location", "window", "document"]) {
                        browserGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
                        delete globalThis[name];
                    }
                }
                let example;
                try {
                    example = await import(pathToFileURL(file).href);
                } finally {
                    for (const [name, descriptor] of browserGlobals) {
                        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
                        else delete globalThis[name];
                    }
                }
                clients.push(example.client);
                assert.equal(example.client.state, "disposed", `${locale}/${id} must release its client`);
                assert.deepEqual(errors, [], `${locale}/${id} logged an unexpected failure`);
                // These assertions check visible results so an example's own
                // catch block cannot silently turn a failed request into a pass.
                const values = logs.flat();
                if (["connect", "stop-restart", "node"].includes(id)) {
                    assert.ok(values.includes(5), `${locale}/${id} must receive MathHub.sum = 5`);
                    if (id === "stop-restart") {
                        assert.equal(values.filter(value => value === 5).length, 2);
                        assert.ok(values.includes("idle") && values.includes(true),
                            `${locale}/${id} must stop and obtain a new connection identity`);
                    }
                } else if (id === "kwargs") {
                    assert.ok(values.some(value => value?.term === "Orionis" && value.limit === 5),
                        `${locale}/${id} must bind SearchHub's keyword-only limit`);
                } else if (id === "callback") {
                    assert.ok(values.includes(true), `${locale}/${id} must return the browser decision`);
                } else if (id === "events") {
                    assert.ok(values.includes("Ada") && values.includes("Hello Orionis"),
                        `${locale}/${id} must receive the actual ChatHub event`);
                    assert.ok(values.some(value => value?.delivered >= 1 && value.failed === 0),
                        `${locale}/${id} must receive the publish acknowledgement`);
                } else if (id === "errors") {
                    assert.ok(values.includes("method_not_found") && values.includes("TypeError"),
                        `${locale}/${id} must distinguish local and remote errors`);
                } else if (["stream", "cancel-stream"].includes(id)) {
                    assert.deepEqual(values.filter(value => typeof value === "number"), [0, 1, 2],
                        `${locale}/${id} must consume the expected FeedHub items`);
                }
                reports.push({ locale, example: id });
                checks++;
            }
        }
    } finally {
        globalThis.WebSocket = NativeWebSocket;
        delete globalThis.__orionisRealtimeGuideHarness;
        if (previousUrl === undefined) delete process.env.ORIONIS_REALTIME_URL;
        else process.env.ORIONIS_REALTIME_URL = previousUrl;
    }
    return reports;
}
let guideExamples = [];
try {
    const rpc = open("/realtime/probe");
    await rpc.connect();
    assert.equal(rpc.state, "connected"); checks++;
    assert.equal(typeof rpc.connectionId, "string"); checks++;
    assert.equal(await rpc.invoke("add", [3]), 5); checks++;
    assert.equal(await rpc.invoke("add", [], { kwargs: { left: 4, right: 6 } }), 10); checks++;
    const special = JSON.parse('{"__proto__":{"safe":true},"constructor":"data","unicode":"Orionis 🌌","nullable":null}');
    assert.deepEqual(await rpc.invoke("echo", [special]), special); checks++;
    await assert.rejects(rpc.invoke("fail"), error =>
        error instanceof RemoteError && error.code === "business_rejection" &&
        error.message === "Invocation failed"); checks++;
    await assert.rejects(rpc.invoke("add", ["bad"]), error =>
        error instanceof RemoteError && error.code === "validation_error"); checks++;
    await assert.rejects(rpc.invoke("missing"), error => error.code === "method_not_found"); checks++;
    await assert.rejects(rpc.stream("missing").next(), error =>
        error instanceof RemoteError && error.code === "method_not_found"); checks++;
    const items = [];
    for await (const item of rpc.stream("items", [4])) items.push(item);
    assert.deepEqual(items, [0, 1, 2, 3]); checks++;
    for await (const item of rpc.stream("items", [100, 0.01])) {
        assert.equal(item, 0); checks++;
        break;
    }
    await sleep(50);
    assert.equal(await rpc.invoke("active"), 0); checks++;
    const cancellation = new AbortController();
    const canceled = rpc.invoke("delay", [2], { signal: cancellation.signal });
    cancellation.abort();
    await assert.rejects(canceled, error => error instanceof AbortError); checks++;
    await assert.rejects(rpc.invoke("delay", [2], { timeoutMs: 20 }), error =>
        error instanceof TimeoutError); checks++;
    await assert.rejects(rpc.invoke("delay", [2], { serverTimeout: 0.02 }), error =>
        error instanceof RemoteError && error.code === "timeout"); checks++;
    const removeDouble = rpc.handle("double", ([value], context) => {
        assert.equal(context.connectionId, rpc.connectionId);
        assert.equal(context.signal.aborted, false);
        return value * 2;
    });
    assert.equal(await rpc.invoke("ask", ["double"]), 12); checks++;
    removeDouble();
    rpc.handle("broken", () => { throw new Error("Secret browser diagnostic"); });
    await assert.rejects(rpc.invoke("ask", ["broken"]), error =>
        error instanceof RemoteError && error.code === "client_error" &&
        error.message === "Invocation failed"); checks++;
    assert.equal(await rpc.invoke("add", [2, 3]), 5); checks++;
    const bounded = open("/realtime/probe", { maxStreamBufferItems: 2 });
    await bounded.connect();
    const unread = bounded.stream("items", [100]);
    await sleep(100);
    await assert.rejects(unread.next(), error => error instanceof LimitError); checks++;
    await sleep(50);
    assert.equal(await bounded.invoke("active"), 0); checks++;
    const a = open("/realtime/chat/lobby");
    const b = open("/realtime/chat/lobby");
    const c = open("/realtime/chat/other-room");
    const received = [[], [], []];
    [a, b, c].forEach((client, index) => client.on("message", ([item]) => received[index].push(item)));
    await Promise.all([a.connect(), b.connect(), c.connect()]);
    assert.deepEqual(await a.invoke("publish", [{ author: "Ada", text: "Wire test" }]),
        { delivered: 2, failed: 0 }); checks++;
    await until(() => received[0].length && received[1].length);
    await sleep(50);
    assert.deepEqual(received.map(messages => messages.length), [1, 1, 0]); checks++;
    assert.equal(received[1][0].text, "Wire test"); checks++;
    await assert.rejects(a.invoke("publish", [{ author: "Ada", text: "" }]), error =>
        error.code === "validation_error"); checks++;
    const previousId = a.connectionId;
    await a.stop();
    assert.equal(a.state, "idle"); checks++;
    await a.connect();
    assert.notEqual(a.connectionId, previousId); checks++;
    assert.deepEqual(await a.invoke("publish", [{ author: "Ada", text: "After restart" }]),
        { delivered: 2, failed: 0 }); checks++;
    await sleep(100);
    assert.equal(rpc.state, "connected"); checks++; // heartbeat survived other traffic.
    // Execute the actual documented module over a native WebSocket. DOM doubles
    // verify UI logic; this does not claim a real-browser rendering check.
    const chatMarkdown = await fs.readFile(new URL(
        "../src/content/docs/es/asynchronous/realtime/chat.md", import.meta.url,
    ), "utf8");
    const html = chatMarkdown.replace(/\r\n?/g, "\n").match(/```html\n([\s\S]*?)\n```/)[1];
    const inline = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
    class Element extends EventTarget {
        children = [];
        textContent = "";
        value = "";
        disabled = false;
        append(child) { child.parent = this; this.children.push(child); }
        get firstElementChild() { return this.children[0]; }
        remove() { this.parent.children.splice(this.parent.children.indexOf(this), 1); }
        focus() {}
    }
    const elements = new Map(["room", "status", "send", "text", "author", "delivery",
        "messages", "chat-form"].map(id => [id, new Element()]));
    globalThis.document = {
        querySelector: selector => elements.get(selector.slice(1)),
        createElement: () => new Element(),
    };
    globalThis.window = new EventTarget();
    globalThis.location = new URL("/chat?room=lobby", origin);
    const browserFile = path.join(path.dirname(filename), "chat-browser.mjs");
    await fs.writeFile(browserFile, inline.replace(
        '"/assets/orionis-realtime.js"', JSON.stringify(pathToFileURL(filename).href),
    ) + "\nexport { client };\n", "utf8");
    const { client: browserClient } = await import(pathToFileURL(browserFile).href);
    clients.push(browserClient);
    assert.equal(browserClient.state, "connected"); checks++;
    assert.equal(elements.get("send").disabled, false); checks++;
    elements.get("author").value = "Browser Ada";
    elements.get("text").value = "<script>inert user text</script>";
    elements.get("chat-form").dispatchEvent(new Event("submit", { cancelable: true }));
    await until(() => elements.get("delivery").textContent.includes("Entregas:"));
    assert.equal(elements.get("text").value, ""); checks++;
    assert.equal(elements.get("messages").children.at(-1).textContent,
        "Browser Ada: <script>inert user text</script>"); checks++;
    const browserIdentity = browserClient.connectionId;
    window.dispatchEvent(new Event("pagehide"));
    await until(() => browserClient.state === "idle");
    assert.equal(elements.get("send").disabled, true); checks++;
    const restored = new Event("pageshow");
    Object.defineProperty(restored, "persisted", { value: true });
    window.dispatchEvent(restored);
    await until(() => browserClient.state === "connected");
    assert.notEqual(browserClient.connectionId, browserIdentity); checks++;
    assert.equal(elements.get("send").disabled, false); checks++;
    guideExamples = await runGuideExamples();
} finally {
    await Promise.all(clients.map(client => client.dispose()));
    assert.ok(clients.every(client => client.state === "disposed"));
}
// Browser close() cannot force TCP termination. Report that separately from SDK
// cleanup; the Python harness tears down its isolated server/process afterward.
await sleep(200);
process.stdout.write(JSON.stringify({
    checks,
    native_websocket: true,
    documented_guide_examples: guideExamples,
    disposed_clients: clients.length,
    closed_transports: sockets.filter(socket => socket.readyState === WebSocket.CLOSED).length,
    transport_count: sockets.length,
}) + "\n", () => process.exit(0));
