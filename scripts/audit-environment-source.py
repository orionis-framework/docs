"""Verify the Environment guide inventory against the framework source."""

from __future__ import annotations

import argparse
import ast
import copy
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/environment-api-inventory.json"
SOURCE_ROOT = "orionis/environment"
AUXILIARY_FILES = (
    "bootstrap/app.py", "config/app.py", "orionis/foundation/application.py",
    "orionis/foundation/config/app/entities/app.py",
    "orionis/foundation/config/app/enums/ciphers.py",
    "orionis/cache/file_based_cache.py", "orionis/cache/serializer.py",
    "orionis/console/commands/support/optimize_clear.py",
    "orionis/console/commands/support/key_generate.py",
    "orionis/support/patterns/singleton/meta.py",
    "orionis/support/structures/freezer.py",
)


def destination(owner: str, name: str) -> str:
    base = "/architecture/environment/"
    if owner in {"Env", "IEnv"}:
        anchor = f"env-{name}" if name in {"get", "set", "unset", "all", "reload"} else "env-api"
    elif owner == "DotEnv":
        anchor = f"env-{name}" if name in {"get", "set", "unset", "all", "reload"} else "dotenv-service"
    elif owner in {"EnvironmentCaster", "IEnvironmentCaster"}:
        anchor = {"OPTIONS": "options", "supportedTypes": "supported-types", "parseTyped": "parse-typed", "get": "get", "to": "to"}.get(name, "construction")
        return base + "typed-configuration#caster-" + anchor
    elif owner == "EnvironmentValueType":
        return base + "typed-configuration#" + ("env-types" if name == owner else "env-type-" + name.lower())
    elif owner == "SecureKeyGenerator":
        anchor = "environment-key-generator"
    elif name == "env":
        anchor = "env-helper"
    elif name in {"ValidateKeyName", "ValidateTypes"}:
        anchor = "environment-validators"
    else:
        raise ValueError(f"No Environment documentation target: {owner}.{name}")
    return base + "operations-and-reference#" + anchor


def function_signature(node: ast.FunctionDef | ast.AsyncFunctionDef, name: str | None = None, *, drop_self: bool = False) -> str:
    arguments = copy.deepcopy(node.args)
    if drop_self:
        arguments.args = arguments.args[1:]
    signature = ("async " if isinstance(node, ast.AsyncFunctionDef) else "") + (name or node.name) + "(" + ast.unparse(arguments) + ")"
    if node.returns:
        signature += " -> " + ast.unparse(node.returns)
    return signature


def extract(framework: Path) -> dict:
    entries, hashes, exports = [], {}, {}
    files = sorted((framework / SOURCE_ROOT).rglob("*.py"))
    for path in files:
        relative = path.relative_to(framework).as_posix()
        source = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
        tree = ast.parse(source)

        def add(node: ast.AST, owner: str, name: str, kind: str, signature: str) -> None:
            entry = {"source": relative, "symbol": f"{owner}.{name}" if owner and kind != "class" else name,
                     "kind": kind, "line": node.lineno, "signature": signature,
                     "reference": destination(owner, name)}
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                entry["decorators"] = [ast.unparse(d) for d in node.decorator_list]
            entries.append(entry)

        for node in tree.body:
            if isinstance(node, ast.ClassDef) and not node.name.startswith("_"):
                bases = [ast.unparse(base) for base in node.bases] + [ast.unparse(keyword) for keyword in node.keywords]
                add(node, node.name, node.name, "class", "class " + node.name + ("(" + ", ".join(bases) + ")" if bases else ""))
                for member in node.body:
                    if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and (not member.name.startswith("_") or member.name == "__init__"):
                        add(member, node.name, member.name, "constructor" if member.name == "__init__" else "method", function_signature(member))
                    elif isinstance(member, ast.AnnAssign) and isinstance(member.target, ast.Name) and not member.target.id.startswith("_"):
                        add(member, node.name, member.target.id, "constant", ast.unparse(member))
                    elif isinstance(member, ast.Assign):
                        for target in member.targets:
                            if isinstance(target, ast.Name) and not target.id.startswith("_"):
                                add(member, node.name, target.id, "enum-member" if node.name == "EnvironmentValueType" else "constant", ast.unparse(member))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
                add(node, "", node.name, "function", function_signature(node))
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id == "__all__":
                        exports[relative] = ast.literal_eval(node.value)
                    elif isinstance(target, ast.Name) and target.id == "ValidateKeyName":
                        implementation = next(item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name == node.value.id)
                        add(node, "", target.id, "callable-alias", function_signature(implementation, target.id))
                    elif isinstance(target, ast.Name) and target.id == "ValidateTypes":
                        implementation = next(item for item in tree.body if isinstance(item, ast.ClassDef) and item.name == node.value.func.id)
                        call = next(item for item in implementation.body if isinstance(item, ast.FunctionDef) and item.name == "__call__")
                        add(node, "", target.id, "callable-instance", function_signature(call, target.id, drop_self=True))
    for relative in AUXILIARY_FILES:
        source = (framework / relative).read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
    return {
        "scope": "Own public Environment declarations, explicit constructors, constants, enum values, public functions and callable aliases. Contracts and implementations count separately. Private helpers, lazy package exports, inherited APIs and generated methods are excluded. Auxiliary files are hashed for reviewed bootstrap integration, without claiming their entire API as Environment API.",
        "sourceRoot": SOURCE_ROOT, "auxiliaryFiles": list(AUXILIARY_FILES),
        "hashes": hashes, "exports": exports, "entries": entries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", required=True, type=Path)
    parser.add_argument("--write", action="store_true")
    args = parser.parse_args()
    actual = extract(args.framework_root.resolve())
    if args.write:
        MANIFEST.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    elif json.loads(MANIFEST.read_text(encoding="utf-8")) != actual:
        raise SystemExit("Environment source changed: review the guide and regenerate its inventory.")
    print(f"Environment source verified: {len(actual['entries'])} public declarations and {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
