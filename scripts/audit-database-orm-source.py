"""Compare a framework checkout with the documented Database/ORM inventory.

Uses AST only: it does not import the framework or connect to a database.
The source checkout is optional for normal documentation builds; run this audit
explicitly when maintaining the API reference against a framework checkout.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/database-orm-api-inventory.json"
PROTOCOLS = {
    "__init__", "__call__", "__aenter__", "__aexit__", "__iter__", "__len__",
    "__getitem__", "__setitem__", "__delitem__", "__contains__", "__bool__", "__eq__",
}


def extract(body: list[ast.stmt], source: str, parent: str = "") -> list[dict]:
    """Enumerate lexical public declarations, including public protocols."""
    result = []
    for node in body:
        if isinstance(node, ast.ClassDef) and not node.name.startswith("_"):
            result.append({"source": source, "symbol": node.name, "kind": "class", "line": node.lineno})
            result.extend(extract(node.body, source, node.name))
        elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            if not node.name.startswith("_") or node.name in PROTOCOLS:
                result.append({"source": source, "symbol": f"{parent}." * bool(parent) + node.name,
                               "kind": "method" if parent else "function", "line": node.lineno})
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            if not node.target.id.startswith("_"):
                result.append({"source": source, "symbol": f"{parent}." * bool(parent) + node.target.id,
                               "kind": "property", "line": node.lineno})
        elif isinstance(node, ast.Assign) and parent:
            for target in node.targets:
                if isinstance(target, ast.Name) and not target.id.startswith("_"):
                    result.append({"source": source, "symbol": f"{parent}.{target.id}",
                                   "kind": "constant", "line": node.lineno})
        elif isinstance(node, ast.TypeAlias) and not node.name.id.startswith("_"):
            result.append({"source": source, "symbol": f"{parent}." * bool(parent) + node.name.id,
                           "kind": "type-alias", "line": node.lineno})
        elif isinstance(node, (ast.If, ast.Try)):
            # TYPE_CHECKING aliases are retained and explicitly classified in
            # the manifest; they cannot silently disappear from the audit.
            result.extend(extract(node.body, source, parent))
    return result


def source_digest(path: Path) -> str:
    text = path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def audit(framework: Path, manifest: dict) -> dict:
    found = {}
    files = []
    for module in manifest["scope"]["sourceRoots"]:
        for file in sorted((framework / module).rglob("*.py")):
            if "docs" in file.parts:
                continue
            relative = file.relative_to(framework).as_posix()
            files.append(relative)
            for entry in extract(ast.parse(file.read_text(encoding="utf-8-sig")).body, relative):
                found[(relative, entry["symbol"], entry["kind"])] = entry
    recorded = {(e["source"], e["symbol"], e["kind"]): e for e in manifest["declarations"]}
    new = sorted(set(found) - set(recorded))
    removed = sorted(set(recorded) - set(found))
    changed = []
    for source, expected in manifest["sourceFiles"].items():
        file = framework / source
        if not file.is_file() or source_digest(file) != expected:
            changed.append(source)
    tracked = set(manifest["sourceFiles"])
    untracked_files = sorted(set(files) - tracked)
    provider_source = framework / "orionis/orm/factories/fake.pyi"
    provider_class = next(node for node in ast.parse(provider_source.read_text(encoding="utf-8-sig")).body
                          if isinstance(node, ast.ClassDef) and node.name == "_ProviderMethods")
    provider_names = {node.name for node in provider_class.body if isinstance(node, ast.FunctionDef)
                      and not node.name.startswith("_")}
    documented_names = {entry["name"] for entry in manifest["fakerProviders"] if entry["kind"] == "provider method"}
    cli_files = set()
    for module in manifest["scope"].get("cliSourceRoots", []):
        cli_files.update((framework / module).rglob("*.py"))
    for pattern in manifest["scope"].get("cliGeneratorPatterns", []):
        cli_files.update(framework.glob(pattern))
    cli_names = set()
    for file in cli_files:
        tree = ast.parse(file.read_text(encoding="utf-8-sig"))
        for node in tree.body:
            if not isinstance(node, ast.ClassDef):
                continue
            for member in node.body:
                targets = ([member.target] if isinstance(member, ast.AnnAssign)
                           else member.targets if isinstance(member, ast.Assign) else [])
                if (any(isinstance(target, ast.Name) and target.id == "signature" for target in targets)
                        and isinstance(member.value, ast.Constant) and isinstance(member.value.value, str)):
                    cli_names.add(member.value.value)
    documented_cli = {entry["symbol"] for entry in manifest["supplemental"]
                      if entry["kind"] == "CLI command"}
    return {
        "source_declarations": len(found),
        "new_declarations": new,
        "removed_declarations": removed,
        "changed_source_files": sorted(changed),
        "new_source_files": untracked_files,
        "new_faker_providers": sorted(provider_names - documented_names),
        "removed_faker_providers": sorted(documented_names - provider_names),
        "database_cli_commands": len(cli_names),
        "new_database_cli_commands": sorted(cli_names - documented_cli),
        "removed_database_cli_commands": sorted(documented_cli - cli_names),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", required=True, type=Path)
    args = parser.parse_args()
    report = audit(args.framework_root.resolve(), json.loads(MANIFEST.read_text(encoding="utf-8")))
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(any(value for key, value in report.items()
                        if key not in {"source_declarations", "database_cli_commands"}))
