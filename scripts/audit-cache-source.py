"""Compare the documented Cache surface with an adjacent framework checkout."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/cache-api-inventory.json"
PROTOCOLS = {"__init__", "__aenter__", "__aexit__"}
SOURCE_ROOTS = ("orionis/cache", "orionis/foundation/config/cache")
SOURCE_FILES = ("config/cache.py", "orionis/support/facades/cache.py")


def destination(file: str, owner: str, name: str, kind: str) -> str:
    base = "/services/cache/"
    if file.startswith("orionis/foundation/config/cache") or file == "config/cache.py":
        return base + "configuration#config-" + ("cache" if owner in {"BootstrapCache", "Cache"} else owner.lower())
    if file.endswith("facades/cache.py"):
        return base + ("api-reference#facade-accessor" if name == "getFacadeAccessor" else "manager-and-injection#facade")
    if file.endswith("provider.py"):
        return base + "api-reference#provider"
    if file.endswith("exceptions.py"):
        return base + "api-reference#exceptions"
    if "/stores/" in file:
        driver = Path(file).stem
        if kind == "function" or kind == "class" or name == "__init__":
            return base + "api-reference#backend-" + driver
        return base + "api-reference#backend-" + {"multi_get": "multiget", "multi_set": "multiset"}.get(name, name.lower())
    if owner == "MsgspecSerializer":
        return base + "api-reference#msgspec-" + (name.lower() if kind == "method" else "serializer")
    if owner == "Serializer":
        return base + "source-artifacts#serializer-" + (name.lower() if kind == "method" else "dumps")
    if owner == "CacheLock":
        return base + "locks#lock-" + ("context" if name in {"__aenter__", "__aexit__"} else "construction")
    canonical = owner.removeprefix("I") if owner.startswith("I") else owner
    if canonical == "FileBasedCache":
        return base + "source-artifacts#artifact-" + ("version" if name == "CACHE_VERSION" else name.lower() if kind == "method" and name != "__init__" else "construction")
    if canonical == "CacheRepository":
        return base + "caching-values#repository-" + (name.lower() if kind == "method" and name != "__init__" else "construction")
    if canonical == "CacheManager":
        if kind == "class" or name == "__init__":
            return base + "manager-and-injection#manager-construction"
        if name == "store":
            return base + "manager-and-injection#manager-store"
        return base + "caching-values#repository-" + name.lower()
    raise ValueError(f"No documentation mapping for {file}:{owner}.{name}")


def extract(framework: Path) -> dict:
    files = sorted({p for directory in SOURCE_ROOTS for p in (framework / directory).rglob("*.py")} | {framework / f for f in SOURCE_FILES})
    entries, hashes = [], {}
    for file in files:
        relative = file.relative_to(framework).as_posix()
        source = file.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
        tree = ast.parse(source)

        def add(node: ast.AST, owner: str, name: str, kind: str, signature: str) -> None:
            entries.append({"source": relative, "symbol": f"{owner}.{name}" if owner and kind != "class" else name,
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
                        add(member, node.name, member.name, "method", signature)
                    elif isinstance(member, ast.AnnAssign) and isinstance(member.target, ast.Name) and not member.target.id.startswith("_"):
                        signature = member.target.id + ": " + ast.unparse(member.annotation)
                        if member.value:
                            signature += " = " + ast.unparse(member.value)
                        add(member, node.name, member.target.id, "field", signature)
                    elif isinstance(member, ast.Assign):
                        for target in member.targets:
                            if isinstance(target, ast.Name) and not target.id.startswith("_"):
                                kind = "alias" if isinstance(member.value, ast.Name) and member.value.id in {"multiGet", "multiSet"} else "constant"
                                add(member, node.name, target.id, kind, target.id + " = " + ast.unparse(member.value))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
                signature = node.name + "(" + ast.unparse(node.args) + ")"
                if node.returns:
                    signature += " -> " + ast.unparse(node.returns)
                add(node, "", node.name, "function", signature)
    return {
        "scope": "Own public declarations in Cache, cache configuration and its facade; constructors and async context protocols included. Contracts and backend overrides are separate lexical declarations. Four bulk-method aliases are included. Private implementation, export plumbing, inherited third-party APIs and generated dataclass methods are excluded.",
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
        raise SystemExit("Cache source has changed: review documentation and regenerate the inventory.")
    print(f"Cache source verified: {len(actual['entries'])} own public declarations in {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
