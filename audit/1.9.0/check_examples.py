"""Check the manual's Python fences against a local checkout of Orionis 1.9.0.

Run with that checkout's Python 3.14 environment and -B. Examples can be
controller bodies or REPL fragments with top-level await. Their statements
are never executed. Only explicit Orionis imports are resolved.
"""

import argparse
from annotationlib import Format
import ast
import importlib
import inspect
from pathlib import Path
import re
import subprocess
import sys
from textwrap import dedent


REVISION = "931f5fe9622ff054fbd583f5128ec1de59015182"
DOCS = Path(__file__).resolve().parents[2] / "src/content/docs"
FENCE = re.compile(r"^ *```(?:python|py)[^\n]*\n(.*?)^ *```[ \t]*$", re.M | re.S)


def check_snippet(source, location, errors):
    imported = {}
    try:
        tree = ast.parse(dedent(source))
    except SyntaxError as exc:
        errors.append(f"{location} syntax: {exc.msg} (fragment line {exc.lineno})")
        return 0, 0

    count = calls = 0
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and (node.module or "").split(".")[0] == "orionis":
            for alias in node.names:
                count += 1
                try:
                    module = __import__(node.module, fromlist=[alias.name])
                    imported[alias.asname or alias.name] = getattr(module, alias.name)
                except Exception as exc:
                    errors.append(f"{location} from {node.module} import {alias.name}: {exc}")
        elif isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.split(".")[0] == "orionis":
                    count += 1
                    try:
                        importlib.import_module(alias.name)
                    except ImportError as exc:
                        errors.append(f"{location} import {alias.name}: {exc}")

    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        if any(isinstance(arg, ast.Starred) for arg in node.args) or any(
            kw.arg is None for kw in node.keywords
        ):
            continue
        func = node.func
        if isinstance(func, ast.Name):
            target = imported.get(func.id)
        elif isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name):
            owner = imported.get(func.value.id)
            if owner is None:
                continue
            # Avoid invoking facade resolvers, properties or application callbacks.
            raw = inspect.getattr_static(owner, func.attr, None)
            if not isinstance(raw, (classmethod, staticmethod)):
                continue
            target = getattr(owner, func.attr)
        else:
            continue
        if not callable(target):
            continue
        try:
            signature = inspect.signature(target, annotation_format=Format.STRING)
        except (TypeError, ValueError):
            continue
        calls += 1
        try:
            signature.bind(*[None] * len(node.args), **{kw.arg: None for kw in node.keywords})
        except TypeError as exc:
            errors.append(f"{location} {ast.unparse(func)}{signature}: {exc}")
    return count, calls


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("framework", type=Path)
    root = parser.parse_args().framework.resolve()
    revision = subprocess.check_output(["git", "-C", root, "rev-parse", "HEAD"], text=True).strip()
    if revision != REVISION or subprocess.run(
        ["git", "-C", root, "diff", "--quiet", "HEAD", "--", "orionis", "pyproject.toml"]
    ).returncode:
        parser.error("Use the clean v1.9.0 source tree.")
    sys.path.insert(0, str(root))
    from orionis import metadata

    if metadata.VERSION != "1.9.0" or not Path(metadata.__file__).resolve().is_relative_to(root):
        parser.error("The Python environment did not load the specified checkout.")

    errors = []
    snippets = imports = signatures = 0
    for page in sorted(DOCS.rglob("*.md")):
        text = page.read_text(encoding="utf-8")
        for match in FENCE.finditer(text):
            line = text.count("\n", 0, match.start(1)) + 1
            count, calls = check_snippet(match[1], f"{page.relative_to(DOCS)}:{line}", errors)
            snippets += 1
            imports += count
            signatures += calls
    print(f"{snippets} Python fragments, {imports} explicit imports, {signatures} call signatures")
    for error in errors:
        print(error)
    print(f"{len(errors)} findings")
    return int(bool(errors))


if __name__ == "__main__":
    sys.exit(main())
