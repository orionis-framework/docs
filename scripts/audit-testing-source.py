"""Verify the reviewed testing declarations and integrations against Orionis."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/testing-api-inventory.json"
PUBLIC_ROOTS = ("orionis/test", "orionis/foundation/config/testing")
PUBLIC_FILES = (
    "config/testing.py",
    "orionis/console/commands/test/test.py",
    "orionis/console/commands/make/test.py",
    "orionis/support/facades/testing.py",
)
AUXILIARY_REFERENCES = {
    "orionis/console/commands/make/_base.py": "/testing/writing-and-running-tests",
    "orionis/console/templates/stub.py": "/testing/writing-and-running-tests",
    "orionis/console/templates/test.stub": "/testing/writing-and-running-tests",
    "orionis/support/facades/testing.pyi": "/testing/results-and-reference",
    "orionis/container/container.py": "/testing/dependency-injection",
    "orionis/container/context/scope.py": "/testing/dependency-injection",
    "orionis/container/facades/facade.py": "/testing/dependency-injection",
    "orionis/container/facades/meta.py": "/testing/dependency-injection",
    "orionis/support/facades/application.py": "/testing/dependency-injection",
    "orionis/console/core/reactor.py": "/testing/dependency-injection",
    "orionis/console/kernel.py": "/testing/writing-and-running-tests",
    "orionis/foundation/config/validation.py": "/testing/results-and-reference",
}


def reference_for(source: str) -> str:
    """Provide initial mappings; later additions require explicit review."""
    if source.endswith("/clients/mcp.py"):
        return "/testing/mcp-testing"
    if source.endswith("/cases/case.py"):
        return "/testing/cases-and-decorators"
    if source.endswith("/commands/make/test.py"):
        return "/testing/writing-and-running-tests"
    return "/testing/results-and-reference"


def signature(node: ast.FunctionDef | ast.AsyncFunctionDef) -> str:
    prefix = "async " if isinstance(node, ast.AsyncFunctionDef) else ""
    result = prefix + node.name + "(" + ast.unparse(node.args) + ")"
    return result + (" -> " + ast.unparse(node.returns) if node.returns else "")


def extract(framework: Path) -> dict:
    files = set(framework / source for source in PUBLIC_FILES)
    for source_root in PUBLIC_ROOTS:
        files.update((framework / source_root).rglob("*.py"))
    entries, hashes, exports = [], {}, {}
    for path in sorted(files):
        source = path.relative_to(framework).as_posix()
        content = path.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[source] = hashlib.sha256(content.encode()).hexdigest()
        tree = ast.parse(content)

        def add(node: ast.AST, symbol: str, kind: str, definition: str) -> None:
            entry = {
                "source": source,
                "symbol": symbol,
                "kind": kind,
                "line": node.lineno,
                "signature": definition,
                "reference": reference_for(source),
            }
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                entry["decorators"] = [ast.unparse(item) for item in node.decorator_list]
            entries.append(entry)

        for node in tree.body:
            if isinstance(node, ast.ClassDef) and not node.name.startswith("_"):
                bases = [ast.unparse(item) for item in node.bases]
                add(node, node.name, "class", "class " + node.name + ("(" + ", ".join(bases) + ")" if bases else ""))
                for member in node.body:
                    if isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and (not member.name.startswith("_") or member.name == "__init__"):
                        add(member, node.name + "." + member.name, "constructor" if member.name == "__init__" else "method", signature(member))
                    elif isinstance(member, ast.AnnAssign) and isinstance(member.target, ast.Name) and not member.target.id.startswith("_"):
                        add(member, node.name + "." + member.target.id, "field", ast.unparse(member))
                    elif isinstance(member, ast.Assign):
                        for target in member.targets:
                            if isinstance(target, ast.Name) and not target.id.startswith("_"):
                                kind = "enum-member" if node.name in {"TestStatus", "VerbosityMode"} else "constant"
                                add(member, node.name + "." + target.id, kind, ast.unparse(member))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and not node.name.startswith("_"):
                add(node, node.name, "function", signature(node))
            elif isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id == "__all__":
                        exports[source] = ast.literal_eval(node.value)

    native_test_files = sorted({
        *(path.relative_to(framework).as_posix() for path in (framework / "tests/test").rglob("test_*.py")),
        "tests/console/commands/test/test_test_command.py",
        "tests/console/commands/make/test_make_commands.py",
        "tests/console/templates/test_stub.py",
    })
    for source in sorted(set(AUXILIARY_REFERENCES) | set(native_test_files)):
        content = (framework / source).read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[source] = hashlib.sha256(content.encode()).hexdigest()

    return {
        "scope": (
            "Own public Python declarations under orionis/test and the testing configuration, "
            "project testing configuration, test/make:test commands, and Test facade accessor. "
            "Contracts and implementations count separately. Runner/result callbacks and provider "
            "registration are included as implementation declarations, not additional recommended "
            "entry points. Private helpers, lazy exports, dataclass-generated methods and inherited "
            "standard-library/container/facade API are excluded. Auxiliary and native test sources "
            "are hashed as reviewed integrations without claiming their entire API as testing API. "
            "MCP client declarations map to the existing MCP testing guide; that guide stays in MCP."
        ),
        "publicRoots": list(PUBLIC_ROOTS),
        "publicFiles": list(PUBLIC_FILES),
        "hashes": hashes,
        "exports": exports,
        "integrations": [{"source": source, "reference": ref} for source, ref in sorted(AUXILIARY_REFERENCES.items())],
        "nativeTestFiles": native_test_files,
        "entries": entries,
        "inheritedApi": {
            "scope": "Selected inherited features explained by these guides; this is not an inventory of the entire unittest or unittest.mock API.",
            "origin": "unittest.IsolatedAsyncioTestCase -> unittest.TestCase",
            "reference": "/testing/cases-and-decorators",
            "decorators": ["unittest.skip", "unittest.skipIf", "unittest.skipUnless", "unittest.expectedFailure"],
            "lifecycle": ["setUpClass", "tearDownClass", "setUp", "asyncSetUp", "asyncTearDown", "tearDown"],
            "cleanup": ["addCleanup", "doCleanups", "enterContext", "addClassCleanup", "doClassCleanups", "enterClassContext", "addAsyncCleanup", "enterAsyncContext"],
            "controlAndAssertions": ["subTest", "skipTest", "fail", "assertEqual", "assertTrue", "assertIsInstance", "assertRaises"],
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", required=True, type=Path)
    parser.add_argument("--write", action="store_true", help="Update an explicitly reviewed snapshot; never called by a normal audit.")
    args = parser.parse_args()
    actual = extract(args.framework_root.resolve())
    if MANIFEST.exists():
        reviewed = json.loads(MANIFEST.read_text(encoding="utf-8"))
        references = {(entry["source"], entry["symbol"]): entry["reference"] for entry in reviewed["entries"]}
        for entry in actual["entries"]:
            identity = entry["source"], entry["symbol"]
            if identity not in references:
                raise SystemExit(f"Unreviewed testing declaration: {identity}. Add a documentation mapping before regenerating.")
            entry["reference"] = references[identity]
    elif not args.write:
        raise SystemExit("No reviewed testing inventory exists. Review mappings and generate it explicitly with --write.")

    if args.write:
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    elif actual != reviewed:
        raise SystemExit("Testing source changed: review the guides and update the inventory explicitly with --write.")
    print(f"Testing source verified: {len(actual['entries'])} public declarations and {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
