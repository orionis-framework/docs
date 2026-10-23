"""Compare the documented Storage surface with an adjacent framework checkout."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/storage-api-inventory.json"
PROTOCOLS = {"__init__", "__aenter__", "__aexit__"}
SOURCE_ROOTS = ("orionis/storage", "orionis/foundation/config/filesystems")
SOURCE_FILES = ("config/filesystems.py", "orionis/support/facades/storage.py")


def destination(file: str, owner: str, name: str, kind: str) -> str:
    base = "/storage/"
    if file.startswith("orionis/foundation/config/filesystems") or file == "config/filesystems.py":
        return base + "configuration#" + ("filesystems" if owner == "BootstrapFilesystems" else owner.lower())
    if file.endswith("facades/storage.py"):
        return base + ("api-reference#facade-accessor" if name == "getFacadeAccessor" else "manager-and-injection#facade")
    if file.endswith("provider.py"):
        return base + "api-reference#provider"
    if file.endswith("exceptions.py"):
        return base + "api-reference#exceptions"
    if file.endswith("paths.py"):
        return base + "files-and-directories#path-normalization"
    if file.endswith("drivers/functions.py"):
        return base + "api-reference#helper-" + name.replace("_", "-")
    if "/drivers/" in file:
        if kind == "class" or name == "__init__":
            driver = Path(file).stem
            return base + "disks-and-drivers#driver-" + driver
        return base + "api-reference#driver-" + name.lower()
    canonical = owner.removeprefix("I") if owner.startswith("I") and owner != "IStorageDriver" else owner
    if owner == "IStorageDriver":
        return base + ("api-reference#driver-contract" if kind == "class" else "api-reference#driver-" + name.lower())
    if canonical in {"StorageManager", "StorageStream", "UploadedFile", "File", "Directory", "Disk"} or owner == "AsyncStream":
        prefix, page = {
            "StorageManager": ("manager", "manager-and-injection"),
            "StorageStream": ("stream", "streaming-and-uploads"),
            "AsyncStream": ("stream", "streaming-and-uploads"),
            "UploadedFile": ("upload", "streaming-and-uploads"),
            "File": ("file", "files-and-directories"),
            "Directory": ("directory", "files-and-directories"),
            "Disk": ("disk", "files-and-directories"),
        }[owner if owner == "AsyncStream" else canonical]
        anchor = "construction" if kind == "class" or name == "__init__" else "context" if name in {"__aenter__", "__aexit__"} else name.lower()
        return base + page + "#" + prefix + "-" + anchor
    if owner in {"FileInfo", "Visibility"}:
        return base + "files-and-directories#" + ("file-info" if owner == "FileInfo" else "visibility")
    raise ValueError(f"No documentation mapping for {file}:{owner}.{name}")


def extract(framework: Path) -> dict:
    files = sorted({p for directory in SOURCE_ROOTS for p in (framework / directory).rglob("*.py")} | {framework / f for f in SOURCE_FILES})
    entries, hashes, aliases = [], {}, []
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
            if isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id == "_LEGACY_EXPORTS" for t in node.targets):
                for key, value in zip(node.value.keys, node.value.values, strict=True):
                    aliases.append({"source": relative, "alias": key.value, "target": value.id,
                                    "reference": destination(relative, "", value.id, "function")})
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
                                add(member, node.name, target.id, "constant", target.id + " = " + ast.unparse(member.value))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
                signature = node.name + "(" + ast.unparse(node.args) + ")"
                if node.returns:
                    signature += " -> " + ast.unparse(node.returns)
                add(node, "", node.name, "function", signature)
    return {
        "scope": "Own public declarations in Storage, filesystem configuration and the Storage facade; constructors and async context protocols included. Contracts and driver overrides remain separate lexical declarations. Private implementation and export plumbing, inherited APIs from other modules, and generated dataclass methods are not counted.",
        "sourceRoots": list(SOURCE_ROOTS), "sourceFiles": list(SOURCE_FILES), "hashes": hashes, "entries": entries,
        "compatibilityAliases": aliases,
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
        raise SystemExit("Storage source has changed: review documentation and regenerate the inventory.")
    print(f"Storage source verified: {len(actual['entries'])} own public declarations in {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
