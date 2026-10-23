"""Compare the reviewed Logs inventory with a framework checkout."""

from __future__ import annotations

import argparse
import ast
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/logging-api-inventory.json"
SOURCE_ROOTS = ("orionis/logging", "orionis/foundation/config/logging")
PUBLIC_FILES = ("config/logging.py", "orionis/support/facades/logger.py")
AUXILIARY_FILES = (
    "orionis/support/facades/logger.pyi",
    "orionis/container/facades/facade.py", "orionis/container/facades/meta.py",
    "orionis/foundation/application.py", "orionis/foundation/core_paths.py",
    "orionis/failure/base/handler.py", "orionis/support/facades/datetime.py",
)
PROTOCOLS = {"__init__", "__del__"}


def signature(node: ast.FunctionDef | ast.AsyncFunctionDef, name: str | None = None, *, drop_self: bool = False) -> str:
    args = copy.deepcopy(node.args)
    if drop_self:
        args.args = args.args[1:]
    result = ("async " if isinstance(node, ast.AsyncFunctionDef) else "") + (name or node.name) + "(" + ast.unparse(args) + ")"
    return result + (" -> " + ast.unparse(node.returns) if node.returns else "")


def extract(framework: Path) -> dict:
    entries, hashes, exports = [], {}, {}
    files = sorted({*(framework / item for item in PUBLIC_FILES), *(p for item in SOURCE_ROOTS for p in (framework / item).rglob("*.py"))})
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
                bases = [ast.unparse(b) for b in node.bases] + [ast.unparse(k) for k in node.keywords]
                add(node, node.name, "class", "class " + node.name + ("(" + ", ".join(bases) + ")" if bases else ""))
                for member in node.body:
                    if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and (not member.name.startswith("_") or member.name in PROTOCOLS):
                        add(member, node.name + "." + member.name, "constructor" if member.name == "__init__" else "method", signature(member))
                    elif isinstance(member, ast.AnnAssign) and isinstance(member.target, ast.Name) and not member.target.id.startswith("_"):
                        add(member, node.name + "." + member.target.id, "field", ast.unparse(member))
                    elif isinstance(member, ast.Assign):
                        for target in member.targets:
                            if isinstance(target, ast.Name) and not target.id.startswith("_"):
                                add(member, node.name + "." + target.id, "enum-member" if node.name == "Level" else "constant", ast.unparse(member))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
                add(node, node.name, "function", signature(node))
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id == "__all__":
                        exports[source] = ast.literal_eval(node.value)
                    elif isinstance(target, ast.Name) and target.id in {"IsValidPath", "IsValidLevel"}:
                        implementation = next(c for c in tree.body if isinstance(c, ast.ClassDef) and c.name == node.value.func.id)
                        call = next(c for c in implementation.body if isinstance(c, ast.FunctionDef) and c.name == "__call__")
                        add(node, target.id, "callable-instance", signature(call, target.id, drop_self=True))
                        for member in implementation.body:
                            if isinstance(member, ast.FunctionDef) and not member.name.startswith("_"):
                                add(member, target.id + "." + member.name, "method", signature(member, drop_self=True))
    for source in AUXILIARY_FILES:
        text = (framework / source).read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[source] = hashlib.sha256(text.encode()).hexdigest()
    return {
        "scope": "Own public Logging and logging-configuration declarations, constructors, Logger destruction protocol, facade accessor, dataclass fields, level enum members and exported validator callables. Contracts and implementations count separately. Private helpers, dataclass validation hooks/generated methods, inherited standard-library/container APIs and lazy export machinery are excluded; their relevant behavior is described in the guides. Auxiliary integrations are hashed without claiming their entire API as Logging API.",
        "sourceRoots": list(SOURCE_ROOTS), "publicFiles": list(PUBLIC_FILES),
        "auxiliaryFiles": list(AUXILIARY_FILES), "exports": exports,
        "hashes": hashes, "entries": entries,
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
            raise SystemExit(f"Unreviewed Logging declaration: {identity}. Add a verified guide mapping before regenerating.")
        entry["reference"] = references[identity]
    if args.write:
        MANIFEST.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    elif actual != reviewed:
        raise SystemExit("Logging source changed: review the guides and regenerate the inventory.")
    print(f"Logging source verified: {len(actual['entries'])} public declarations and {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
