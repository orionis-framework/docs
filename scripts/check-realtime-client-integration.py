"""Exercise the official npm client against actual Orionis ASGI/RSGI apps.

Run with the framework's Python environment:
    python -B scripts/check-realtime-client-integration.py \
        --framework-root ../framework --client-root ../orionis-realtime-client

All generated application files and server logs belong to a temporary directory.
The framework and client checkouts are read only. Node.js must provide native
WebSocket. Install the documentation's npm dependencies for its TypeScript
compiler. The client can also be an installed node_modules package directory.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request


def code_blocks(page: Path, language: str) -> list[str]:
    fence = chr(96) * 3
    return re.findall(
        "^" + fence + language + r"\n(.*?)^" + fence,
        page.read_text(encoding="utf-8"), re.M | re.S,
    )


def class_example(page: Path, name: str) -> str:
    """Use the actual published example rather than a similar test-only Hub."""
    matches = [block for block in code_blocks(page, "python")
               if re.search(r"^class " + re.escape(name) + r"\(", block, re.M)]
    if len(matches) != 1:
        raise AssertionError(f"Expected one {name} example in {page}, got {len(matches)}")
    return matches[0]


def check_types(
    docs: Path, client_root: Path, root: Path, node: str, locales: list[str],
) -> list[dict]:
    """Compile the actual guide's consumers against the supplied package types."""
    compiler = docs / "node_modules/typescript/bin/tsc"
    if not compiler.is_file():
        raise RuntimeError("Install documentation dependencies before checking TypeScript examples")
    package = root / "node_modules/@orionis-framework/realtime-client"
    package.mkdir(parents=True)
    for name in ("package.json", "index.d.ts", "orionis-realtime.js"):
        shutil.copyfile(client_root / name, package / name)
    files = []
    for locale in locales:
        blocks = code_blocks(
            docs / f"src/content/docs/{locale}/asynchronous/realtime/javascript-client.md",
            "typescript",
        )
        if not blocks:
            raise AssertionError(f"No TypeScript consumer in the {locale} client guide")
        for index, block in enumerate(blocks):
            filename = f"client-guide-{locale}-{index}.mts"
            (root / filename).write_text(block, encoding="utf-8")
            files.append(filename)
    configuration = {
        "compilerOptions": {
            "target": "ES2022",
            "module": "NodeNext",
            "moduleResolution": "NodeNext",
            "lib": ["ES2022", "DOM", "DOM.Iterable"],
            "types": [],
            "strict": True,
            "exactOptionalPropertyTypes": True,
            "noUncheckedIndexedAccess": True,
            "noUnusedLocals": True,
            "noUnusedParameters": True,
            "skipLibCheck": False,
            "noEmit": True,
        },
        "files": files,
    }
    (root / "tsconfig.json").write_text(json.dumps(configuration), encoding="utf-8")
    reports = []
    for mode in ("NodeNext", "Bundler"):
        command = [node, str(compiler), "-p", str(root / "tsconfig.json")]
        if mode == "Bundler":
            command += ["--module", "ESNext", "--moduleResolution", "Bundler"]
        compiled = subprocess.run(command, cwd=root, capture_output=True,
                                  text=True, encoding="utf-8", timeout=30)
        if compiled.returncode:
            raise RuntimeError(compiled.stdout + compiled.stderr)
        reports.append({"resolution": mode, "examples": len(files)})
    return reports


def stop_server(process: subprocess.Popen) -> None:
    if process.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            capture_output=True, check=False,
        )
    else:
        import signal
        os.killpg(process.pid, signal.SIGTERM)
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", type=Path, required=True)
    parser.add_argument("--client-root", type=Path, required=True,
                        help="Checkout or installed @orionis-framework/realtime-client directory")
    parser.add_argument("--locales", nargs="+", choices=("es", "en"), default=["es", "en"],
                        help="Client guides to execute and type-check; default: es en")
    args = parser.parse_args()
    framework = args.framework_root.resolve()
    if not (framework / "orionis/realtime/protocol.py").is_file():
        parser.error("--framework-root must point to an Orionis framework checkout")
    node = shutil.which("node")
    if not node:
        parser.error("Node.js with native WebSocket is required")
    docs = Path(__file__).resolve().parent.parent
    client_root = args.client_root.resolve()
    try:
        package = json.loads((client_root / "package.json").read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        parser.error("--client-root must contain the npm client's package.json: " + str(error))
    if package.get("name") != "@orionis-framework/realtime-client":
        parser.error("--client-root must be @orionis-framework/realtime-client")
    # This is the standalone browser module documented for direct asset serving.
    # Copy it into the temporary app instead of writing into the package checkout.
    client = client_root / "orionis-realtime.js"
    if not client.is_file():
        parser.error("--client-root must contain the published orionis-realtime.js module")
    reports = []
    with tempfile.TemporaryDirectory(prefix="orionis-npm-client-") as folder:
        root = Path(folder)
        client_bytes = client.read_bytes()
        type_reports = check_types(docs, client_root, root, node, args.locales)

        def write(relative: str, content: str | bytes) -> None:
            target = root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            if isinstance(content, bytes):
                target.write_bytes(content)
            else:
                target.write_text(content, encoding="utf-8")

        pages = docs / "src/content/docs"
        chat = code_blocks(pages / "es/asynchronous/realtime/chat.md", "python")
        assert chat == code_blocks(pages / "en/asynchronous/realtime/chat.md", "python")
        write("app/realtime/hubs/chat_hub.py", chat[0])
        # Exercise the same public methods and signatures linked by the client
        # manual, including keyword-only arguments and bidirectional callbacks.
        hubs_page = pages / "es/asynchronous/realtime/hubs-and-methods.md"
        protocol_page = pages / "es/asynchronous/realtime/protocol-and-streaming.md"
        for module, name, page in (
            ("math_hub", "MathHub", hubs_page),
            ("search_hub", "SearchHub", hubs_page),
            ("feed_hub", "FeedHub", protocol_page),
            ("confirmation_hub", "ConfirmationHub", protocol_page),
        ):
            content = class_example(page, name)
            assert content == class_example(
                Path(str(page).replace(os.sep + "es" + os.sep,
                                       os.sep + "en" + os.sep)), name,
            )
            write("app/realtime/" + module + ".py", content)
        module_route = code_blocks(
            pages / "es/asynchronous/realtime/javascript-client.md", "python",
        )[0]
        assert module_route == code_blocks(
            pages / "en/asynchronous/realtime/javascript-client.md", "python",
        )[0]
        write("routes/web.py", module_route + "\n" + chat[2])
        write("resources/views/chat.html", code_blocks(
            pages / "es/asynchronous/realtime/chat.md", "html",
        )[0])
        write("storage/app/public/js/orionis-realtime.js", client_bytes)
        write("orionis-realtime.mjs", client_bytes)
        write("routes/websocket.py", chat[1] + """
from app.realtime.probe_hub import ProbeHub
from app.realtime.math_hub import MathHub
from app.realtime.search_hub import SearchHub
from app.realtime.feed_hub import FeedHub
from app.realtime.confirmation_hub import ConfirmationHub
Route.hub("/realtime/probe", ProbeHub)
Route.hub("/realtime/math", MathHub)
Route.hub("/realtime/search", SearchHub)
Route.hub("/realtime/feed", FeedHub)
Route.hub("/realtime/confirmation", ConfirmationHub)
""")
        write("app/realtime/probe_hub.py", """
import asyncio
from collections.abc import AsyncIterator
from orionis.realtime import Hub, remote
from orionis.realtime.errors import RPCError

active_streams = 0

class ProbeHub(Hub):
    __slots__ = ()

    @remote
    async def echo(self, value: object) -> object:
        return value

    @remote
    async def add(self, left: int, right: int = 2) -> int:
        return left + right

    @remote
    async def fail(self) -> None:
        raise RPCError("business_rejection", "Private diagnostic")

    @remote
    async def delay(self, seconds: float) -> str:
        await asyncio.sleep(seconds)
        return "finished"

    @remote
    async def items(self, count: int, delay: float = 0.001) -> AsyncIterator[int]:
        global active_streams
        active_streams += 1
        try:
            for value in range(count):
                await asyncio.sleep(delay)
                yield value
        finally:
            active_streams -= 1

    @remote
    async def active(self) -> int:
        return active_streams

    @remote
    async def ask(self, target: str) -> object:
        return await self.clients.caller.invoke(target, 6, timeout=2.0)
""")
        write("factory.py", """
from pathlib import Path
from orionis import Application

def create_application():
    return (Application(base_path=Path.cwd())
        .withRouting(web="routes/web.py", websocket="routes/websocket.py", health="/up")
        .withConfigApp(debug=False)
        .create())
""")
        for interface in ("asgi", "rsgi"):
            with socket.socket() as candidate:
                candidate.bind(("127.0.0.1", 0))
                port = candidate.getsockname()[1]
            origin = "http://127.0.0.1:" + str(port)
            log_path = root / (interface + ".log")
            environment = {
                **os.environ,
                "PYTHONPATH": os.pathsep.join([str(root), str(framework)]),
                "PYTHONDONTWRITEBYTECODE": "1",
                "PYTHONIOENCODING": "utf-8",
                "ORIONIS_REALTIME_GUIDE_LOCALES": ",".join(args.locales),
            }
            with log_path.open("wb") as log:
                process = subprocess.Popen(
                    [sys.executable, "-B", "-m", "granian", "--interface", interface,
                     "--host", "127.0.0.1", "--port", str(port), "--workers", "1",
                     "--loop", "asyncio", "--log-level", "warning",
                     "--factory", "factory:create_application"],
                    cwd=root, env=environment, stdout=log, stderr=subprocess.STDOUT,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                    start_new_session=os.name != "nt",
                )
                try:
                    deadline = time.monotonic() + 25
                    while True:
                        try:
                            with urllib.request.urlopen(origin + "/up", timeout=1) as response:
                                assert response.status == 200
                            break
                        except Exception:
                            if process.poll() is not None or time.monotonic() > deadline:
                                raise RuntimeError(log_path.read_text(encoding="utf-8"))
                            time.sleep(0.1)
                    with urllib.request.urlopen(
                        origin + "/assets/orionis-realtime.js", timeout=5,
                    ) as response:
                        assert response.status == 200
                        assert response.headers.get_content_type() == "text/javascript"
                        assert response.headers["X-Content-Type-Options"] == "nosniff"
                        assert response.read() == client_bytes
                    probe = subprocess.run(
                        [node, str(docs / "scripts/realtime-client-integration.mjs"),
                         origin, str(root / "orionis-realtime.mjs")], cwd=root, capture_output=True,
                        text=True, encoding="utf-8", timeout=75, env=environment,
                    )
                    if probe.returncode:
                        raise RuntimeError(probe.stdout + probe.stderr)
                    reports.append({
                        "interface": interface,
                        "documented_module_route": True,
                        **json.loads(probe.stdout),
                    })
                finally:
                    stop_server(process)
    print(json.dumps({"integration": "passed", "client": package["name"],
                      "typescript": type_reports, "reports": reports}))


if __name__ == "__main__":
    main()
