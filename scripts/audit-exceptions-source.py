"""Check the reviewed Exceptions API against a framework checkout."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/exceptions-api-inventory.json"
SOURCE_ROOT = "orionis/failure"
PUBLIC_FILES = ("app/exceptions/handler.py", "orionis/support/facades/catch.py", "orionis/foundation/core_exception_handler.py")
APPLICATION_FILES = ("orionis/foundation/application.py", "orionis/foundation/contracts/application.py")
APPLICATION_METHODS = {"withExceptionHandler", "getExceptionHandler"}
AUXILIARY_FILES = (
    "bootstrap/app.py", "orionis/support/facades/catch.pyi",
    "orionis/container/facades/facade.py", "orionis/container/facades/meta.py",
    "orionis/logging/logger.py", "orionis/console/output/console.py",
    "orionis/http/default/responses.py",
)

INTEGRATION_REFERENCES = {'orionis/background/task.py': '/architecture/exception-handling/contexts-and-transports#context-response-delivery',
 'orionis/background/tasks.py': '/architecture/exception-handling/contexts-and-transports#context-response-delivery',
 'orionis/console/core/reactor.py': '/architecture/exception-handling/contexts-and-transports#context-cli',
 'orionis/console/entities/task_event.py': '/architecture/exception-handling/contexts-and-transports#context-scheduler',
 'orionis/console/enums/events.py': '/architecture/exception-handling/contexts-and-transports#context-scheduler',
 'orionis/console/kernel.py': '/architecture/exception-handling/contexts-and-transports#context-cli',
 'orionis/console/tasks/schedule.py': '/architecture/exception-handling/contexts-and-transports#context-scheduler',
 'orionis/container/container.py': '/architecture/exception-handling/contexts-and-transports#context-startup-and-cancellation',
 'orionis/foundation/application.py': '/architecture/exception-handling/contexts-and-transports#context-startup-and-cancellation',
 'orionis/http/adapters/response/asgi.py': '/architecture/exception-handling/contexts-and-transports#context-response-delivery',
 'orionis/http/adapters/response/rsgi.py': '/architecture/exception-handling/contexts-and-transports#context-response-delivery',
 'orionis/http/adapters/response/streams.py': '/architecture/exception-handling/contexts-and-transports#context-response-delivery',
 'orionis/http/adapters/websocket/asgi.py': '/architecture/exception-handling/contexts-and-transports#context-websocket',
 'orionis/http/adapters/websocket/rsgi.py': '/architecture/exception-handling/contexts-and-transports#context-websocket',
 'orionis/http/kernel.py': '/architecture/exception-handling/contexts-and-transports#context-http',
 'orionis/http/layer/web/start_session.py': '/architecture/exception-handling/contexts-and-transports#context-http',
 'orionis/http/responses.py': '/architecture/exception-handling/contexts-and-transports#context-response-delivery',
 'orionis/http/validation.py': '/architecture/exception-handling/contexts-and-transports#context-http',
 'orionis/http/websocket.py': '/architecture/exception-handling/contexts-and-transports#context-websocket',
 'orionis/mcp/dispatcher.py': '/architecture/exception-handling/contexts-and-transports#context-mcp',
 'orionis/mcp/exceptions.py': '/architecture/exception-handling/contexts-and-transports#context-mcp',
 'orionis/mcp/responses.py': '/architecture/exception-handling/contexts-and-transports#context-mcp',
 'orionis/mcp/streams.py': '/architecture/exception-handling/contexts-and-transports#context-mcp',
 'orionis/mcp/transport/http.py': '/architecture/exception-handling/contexts-and-transports#context-mcp',
 'orionis/mcp/transport/policy.py': '/architecture/exception-handling/contexts-and-transports#context-mcp',
 'orionis/mcp/transport/stdio.py': '/architecture/exception-handling/contexts-and-transports#context-mcp',
 'orionis/queues/context.py': '/architecture/exception-handling/contexts-and-transports#context-queues',
 'orionis/queues/drivers/sync.py': '/architecture/exception-handling/contexts-and-transports#context-queues',
 'orionis/queues/job.py': '/architecture/exception-handling/contexts-and-transports#context-queues',
 'orionis/queues/manager.py': '/architecture/exception-handling/contexts-and-transports#context-queues',
 'orionis/queues/pending.py': '/architecture/exception-handling/contexts-and-transports#context-queues',
 'orionis/queues/worker.py': '/architecture/exception-handling/contexts-and-transports#context-queues',
 'orionis/realtime/connection.py': '/architecture/exception-handling/contexts-and-transports#context-realtime',
 'orionis/realtime/errors.py': '/architecture/exception-handling/contexts-and-transports#context-realtime',
 'orionis/realtime/metadata.py': '/architecture/exception-handling/contexts-and-transports#context-realtime',
 'orionis/realtime/protocol.py': '/architecture/exception-handling/contexts-and-transports#context-realtime',
 'orionis/realtime/runtime.py': '/architecture/exception-handling/contexts-and-transports#context-realtime'}


def signature(node: ast.FunctionDef | ast.AsyncFunctionDef) -> str:
    result = ("async " if isinstance(node, ast.AsyncFunctionDef) else "") + node.name + "(" + ast.unparse(node.args) + ")"
    return result + (" -> " + ast.unparse(node.returns) if node.returns else "")


def extract(framework: Path) -> dict:
    entries, hashes, exports = [], {}, {}
    files = sorted({*(framework / item for item in (*PUBLIC_FILES, *APPLICATION_FILES)), *(framework / SOURCE_ROOT).rglob("*.py")})
    for path in files:
        source = path.relative_to(framework).as_posix()
        text = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[source] = hashlib.sha256(text.encode()).hexdigest()
        tree = ast.parse(text)

        def add(node: ast.AST, symbol: str, kind: str, definition: str) -> None:
            entry = {"source": source, "symbol": symbol, "kind": kind, "line": node.lineno, "signature": definition}
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                entry["decorators"] = [ast.unparse(d) for d in node.decorator_list]
            entries.append(entry)

        for node in tree.body:
            if isinstance(node, ast.ClassDef) and not node.name.startswith("_"):
                if source not in APPLICATION_FILES:
                    bases = [ast.unparse(b) for b in node.bases] + [ast.unparse(k) for k in node.keywords]
                    add(node, node.name, "class", "class " + node.name + ("(" + ", ".join(bases) + ")" if bases else ""))
                for member in node.body:
                    if source in APPLICATION_FILES and getattr(member, "name", "") not in APPLICATION_METHODS:
                        continue
                    if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and (not member.name.startswith("_") or member.name == "__init__"):
                        add(member, node.name + "." + member.name, "constructor" if member.name == "__init__" else "method", signature(member))
                    elif isinstance(member, ast.AnnAssign) and isinstance(member.target, ast.Name) and not member.target.id.startswith("_"):
                        add(member, node.name + "." + member.target.id, "field", ast.unparse(member))
                    elif isinstance(member, ast.Assign):
                        for target in member.targets:
                            if isinstance(target, ast.Name) and not target.id.startswith("_"):
                                add(member, node.name + "." + target.id, "enum-member" if node.name == "KernelContext" else "constant", ast.unparse(member))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
                add(node, node.name, "function", signature(node))
            elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name) and not node.target.id.startswith("_"):
                add(node, node.target.id, "constant", ast.unparse(node))
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id == "__all__":
                        exports[source] = ast.literal_eval(node.value)
    for source in sorted(set(AUXILIARY_FILES) | set(INTEGRATION_REFERENCES)):
        text = (framework / source).read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[source] = hashlib.sha256(text.encode()).hexdigest()
    return {
        "scope": "Own public Failure declarations, explicit constructors, Throwable fields, kernel enum members, project ExceptionHandler, Catch facade accessor and the two Application registration/retrieval methods with their contracts. Contracts and implementations count separately. Private helpers, generated dataclass methods, inherited container/facade/standard-library API and lazy exports are excluded. Transport sources are hashed as reviewed integrations without claiming their entire public API as Exceptions API.",
        "sourceRoot": SOURCE_ROOT, "publicFiles": list(PUBLIC_FILES),
        "applicationFiles": list(APPLICATION_FILES), "applicationMethods": sorted(APPLICATION_METHODS),
        "auxiliaryFiles": sorted(set(AUXILIARY_FILES) | set(INTEGRATION_REFERENCES)), "hashes": hashes, "exports": exports,
        "integrations": [{"source": source, "reference": reference} for source, reference in sorted(INTEGRATION_REFERENCES.items())],
        "entries": entries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", required=True, type=Path)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    actual = extract(args.framework_root.resolve())
    reviewed = json.loads(MANIFEST.read_text(encoding="utf-8"))
    references = {(entry["source"], entry["symbol"]): entry["reference"] for entry in reviewed["entries"]}
    for entry in actual["entries"]:
        identity = (entry["source"], entry["symbol"])
        if identity not in references:
            raise SystemExit(f"Unreviewed Exceptions declaration: {identity}. Add a verified documentation mapping before regenerating.")
        entry["reference"] = references[identity]
    if args.write:
        MANIFEST.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    elif actual != reviewed:
        raise SystemExit("Exceptions source changed: review the guides and regenerate the inventory.")
    print(f"Exceptions source verified: {len(actual['entries'])} public declarations and {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
