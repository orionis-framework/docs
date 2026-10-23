"""Check the reviewed Application/Container inventory against a framework checkout."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/application-container-api-inventory.json"
SOURCE_ROOTS = ("orionis/container", "orionis/foundation")
AUXILIARY_FILES = (
    "bootstrap/app.py", "bootstrap/lifespan.py", "reactor",
    "orionis/http/kernel.py", "orionis/console/core/reactor.py",
    "orionis/cache/file_based_cache.py", "orionis/cache/serializer.py",
    "orionis/support/structures/freezer.py",
    "orionis/console/commands/serve/serve.py",
    "orionis/console/commands/make/provider.py",
    "orionis/console/commands/make/facade.py",
)
PROTOCOLS = {"__init__", "__new__", "__call__", "__enter__", "__exit__", "__aenter__", "__aexit__", "__await__", "__rsgi__", "__rsgi_init__", "__rsgi_del__"}


def extract(framework: Path) -> dict:
    entries, configurations, hashes = [], [], {}
    files = sorted({p for relative in SOURCE_ROOTS for p in (framework / relative).rglob("*.py")})
    for path in files:
        relative = path.relative_to(framework).as_posix()
        source = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
        tree = ast.parse(source)
        target = configurations if relative.startswith("orionis/foundation/config/") and path.name not in {"startup.py", "validation.py"} else entries

        def add(node: ast.AST, symbol: str, kind: str, signature: str) -> None:
            record = {"source": relative, "symbol": symbol, "kind": kind, "line": node.lineno, "signature": signature}
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                record["decorators"] = [ast.unparse(d) for d in node.decorator_list]
            target.append(record)

        def function(node: ast.FunctionDef | ast.AsyncFunctionDef, owner: str = "") -> None:
            signature = ("async " if isinstance(node, ast.AsyncFunctionDef) else "") + node.name + "(" + ast.unparse(node.args) + ")"
            if node.returns:
                signature += " -> " + ast.unparse(node.returns)
            add(node, f"{owner}.{node.name}" if owner else node.name, "method" if owner else "function", signature)

        for node in tree.body:
            if isinstance(node, ast.ClassDef) and not node.name.startswith("_"):
                bases = [ast.unparse(b) for b in node.bases] + [ast.unparse(k) for k in node.keywords]
                add(node, node.name, "class", "class " + node.name + ("(" + ", ".join(bases) + ")" if bases else ""))
                for member in node.body:
                    if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and (not member.name.startswith("_") or member.name in PROTOCOLS):
                        function(member, node.name)
                    elif isinstance(member, ast.AnnAssign) and isinstance(member.target, ast.Name) and not member.target.id.startswith("_"):
                        add(member, node.name + "." + member.target.id, "field", ast.unparse(member))
                    elif isinstance(member, ast.Assign):
                        for name in member.targets:
                            if isinstance(name, ast.Name) and not name.id.startswith("_"):
                                add(member, node.name + "." + name.id, "constant", ast.unparse(member))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
                function(node)
            elif isinstance(node, ast.TypeAlias) and not node.name.id.startswith("_"):
                add(node, node.name.id, "type-alias", ast.unparse(node))
            elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name) and not node.target.id.startswith("_"):
                add(node, node.target.id, "constant", ast.unparse(node))
            elif isinstance(node, ast.Assign) and not (isinstance(node.value, ast.Call) and isinstance(node.value.func, ast.Name) and node.value.func.id == "TypeVar"):
                for name in node.targets:
                    if isinstance(name, ast.Name) and not name.id.startswith("_"):
                        add(node, name.id, "constant", ast.unparse(node))
    for relative in AUXILIARY_FILES:
        path = framework / relative
        if not path.exists():
            raise FileNotFoundError(path)
        source = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
    return {"scope": "Own public Foundation/Container declarations, constructors and selected runtime/context protocols, including contracts. Private implementation, typing variables and lazy export machinery, inherited APIs and generated dataclass methods are excluded. Configuration entities are inventoried separately as cross-references to their component guides, not claimed as detailed field coverage by this section.",
            "sourceRoots": list(SOURCE_ROOTS), "auxiliaryFiles": list(AUXILIARY_FILES), "hashes": hashes,
            "entries": entries, "configurationReferences": configurations}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", required=True, type=Path)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    actual = extract(args.framework_root.resolve())
    reviewed = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for collection in ("entries", "configurationReferences"):
        links = {(e["source"], e["symbol"]): e["reference"] for e in reviewed[collection]}
        for entry in actual[collection]:
            identity = (entry["source"], entry["symbol"])
            if identity not in links:
                raise SystemExit(f"Unreviewed declaration: {identity}. Add its verified documentation mapping before regenerating.")
            entry["reference"] = links[identity]
    if args.write:
        MANIFEST.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    elif actual != reviewed:
        raise SystemExit("Application/Container source changed: review the guides and regenerate the inventory.")
    print(f"Application/Container source verified: {len(actual['entries'])} detailed declarations, {len(actual['configurationReferences'])} configuration cross-references, {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
