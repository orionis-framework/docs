"""Compare the documented Queues surface with an adjacent framework checkout."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/queues-api-inventory.json"
PROTOCOLS = {"__init__", "__await__"}
SOURCE_ROOTS = ("orionis/queues", "orionis/foundation/config/queue")
SOURCE_FILES = ("config/queue.py", "orionis/support/facades/queue.py")


def destination(file: str, owner: str, name: str, kind: str) -> str:
    base = "/asynchronous/queues/"
    if file.startswith("orionis/foundation/config/queue") or file == "config/queue.py":
        config_name = "queue" if owner == "BootstrapQueue" else owner.lower()
        return base + "configuration#config-" + config_name
    if file.endswith("facades/queue.py"):
        return base + "api-reference#facade-accessor"
    if file.endswith("provider.py"):
        return base + "api-reference#provider"
    if file.endswith("exceptions.py"):
        return base + "api-reference#exceptions"
    if file.endswith("functions.py"):
        return base + "api-reference#helper-" + name.replace("_", "-")
    if kind == "type-alias":
        return base + "api-reference#queue-types"
    if file.endswith("schema.py"):
        return base + "drivers-and-configuration#schema-functions"
    construction = kind == "class" or name == "__init__"
    if owner in {"IQueueManager", "QueueManager"}:
        return base + "manager-and-injection#manager-" + ("construction" if construction else name.lower())
    if owner in {"IJob", "BaseJob"}:
        return base + "jobs-and-dispatch#job-" + ("construction" if construction or kind == "field" else name.lower())
    if owner == "PendingDispatch":
        return base + "jobs-and-dispatch#pending-" + ("construction" if construction else name.lower())
    if owner in {"IJobSerializer", "JobSerializer"}:
        return base + "jobs-and-dispatch#serializer-" + ("construction" if construction else name.lower())
    if owner == "JobEnvelope":
        return base + "jobs-and-dispatch#job-envelope"
    if owner in {"IWorker", "Worker"}:
        return base + "workers-and-failures#worker-" + ("construction" if construction else name.lower())
    if owner == "WorkerOptions":
        return base + "workers-and-failures#worker-options"
    if owner == "JobContext":
        return base + "failures-and-retries#job-context" + ("" if construction else "-" + name.lower())
    if owner in {"IFailedJobRepository", "DatabaseFailedJobRepository"}:
        return base + "failures-and-retries#failed-repository" + ("" if construction else "-" + name.lower())
    if owner == "FailedJob":
        return base + "failures-and-retries#failed-job"
    if owner == "ReservedJob":
        return base + "workers-and-failures#reserved-job"
    if owner in {"IQueueDriver", "SyncQueueDriver", "DatabaseQueueDriver", "RedisQueueDriver"}:
        return base + "api-reference#driver-" + ("construction" if construction else name.lower())
    if name == "eligible_clauses":
        return base + "api-reference#eligible-clauses"
    raise ValueError(f"No documentation mapping for {file}:{owner}.{name}")


def extract(framework: Path) -> dict:
    files = sorted({p for directory in SOURCE_ROOTS for p in (framework / directory).rglob("*.py")} | {framework / f for f in SOURCE_FILES})
    entries, hashes = [], {}
    overloads = {}
    for file in files:
        relative = file.relative_to(framework).as_posix()
        source = file.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
        tree = ast.parse(source)

        def add(node: ast.AST, owner: str, name: str, kind: str, signature: str) -> None:
            symbol = f"{owner}.{name}" if owner and kind != "class" else name
            if kind == "overload":
                index = overloads.get((relative, symbol), 0) + 1
                overloads[(relative, symbol)] = index
                symbol += f"[overload {index}]"
            entries.append({"source": relative, "symbol": symbol,
                            "kind": kind, "line": node.lineno, "signature": signature,
                            "reference": destination(relative, owner, name, kind)})

        for node in tree.body:
            if isinstance(node, ast.ClassDef) and not node.name.startswith("_"):
                add(node, node.name, node.name, "class", "class " + node.name)
                for member in node.body:
                    if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and (not member.name.startswith("_") or member.name in PROTOCOLS):
                        signature = ("async " if isinstance(member, ast.AsyncFunctionDef) else "") + member.name + "(" + ast.unparse(member.args) + ")"
                        if member.returns:
                            signature += " -> " + ast.unparse(member.returns)
                        kind = "overload" if any(isinstance(d, ast.Name) and d.id == "overload" for d in member.decorator_list) else "method"
                        add(member, node.name, member.name, kind, signature)
                    elif isinstance(member, ast.AnnAssign) and isinstance(member.target, ast.Name) and not member.target.id.startswith("_"):
                        signature = member.target.id + ": " + ast.unparse(member.annotation)
                        if member.value:
                            signature += " = " + ast.unparse(member.value)
                        add(member, node.name, member.target.id, "field", signature)
                    elif isinstance(member, ast.Assign):
                        for target in member.targets:
                            if isinstance(target, ast.Name) and not target.id.startswith("_"):
                                kind = "constant"
                                add(member, node.name, target.id, kind, target.id + " = " + ast.unparse(member.value))
            elif isinstance(node, ast.TypeAlias) and not node.name.id.startswith("_"):
                add(node, "", node.name.id, "type-alias", ast.unparse(node))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
                signature = node.name + "(" + ast.unparse(node.args) + ")"
                if node.returns:
                    signature += " -> " + ast.unparse(node.returns)
                add(node, "", node.name, "function", signature)
    return {
        "scope": "Own public declarations in Queues, queue configuration and its facade; constructors included; generated dataclass constructors are described through their fields. Contracts and backend overrides are separate lexical declarations. The await protocol and public type aliases are included; CLI syntax and templates are verified separately in the audit report. Private implementation, export plumbing, inherited third-party APIs and generated dataclass methods are excluded.",
        "sourceRoots": list(SOURCE_ROOTS), "sourceFiles": list(SOURCE_FILES), "hashes": hashes, "entries": entries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", type=Path, required=True)
    parser.add_argument("--write", action="store_true", help="Regenerate the reviewed documentation inventory.")
    args = parser.parse_args()
    actual = extract(args.framework_root.resolve())
    if args.write:
        MANIFEST.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    elif json.loads(MANIFEST.read_text(encoding="utf-8")) != actual:
        raise SystemExit("Queues source has changed: review documentation and regenerate the inventory.")
    print(f"Queues source verified: {len(actual['entries'])} own public declarations in {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
