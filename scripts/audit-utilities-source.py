"""Audit the explicitly reviewed helpers and framework metadata source snapshot.

The nine native files define the inventory. Supporting contracts, curated exports,
DI integration, service integrations and native tests are hashed separately and
never inflate the native method count. --write is an explicit snapshot refresh,
not permission to invent documentation mappings for new declarations.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/utilities-api-inventory.json"

# Reviewed symbol allowlists: changing the framework cannot silently extend these.
REVIEWED_MODULES = {
    "orionis/support/types/collection.py": {
        "class": "Collection",
        "prefix": "collection",
        "pageId": "helper-collection",
        "reference": "/advanced/data-utilities/collection",
        "methods": [
            "__hash__",
            "__init__",
            "take",
            "first",
            "last",
            "all",
            "avg",
            "max",
            "min",
            "chunk",
            "collapse",
            "contains",
            "count",
            "diff",
            "each",
            "every",
            "filter",
            "flatten",
            "forget",
            "forPage",
            "get",
            "implode",
            "isEmpty",
            "map",
            "mapInto",
            "merge",
            "pluck",
            "pop",
            "prepend",
            "pull",
            "push",
            "put",
            "random",
            "reduce",
            "reject",
            "reverse",
            "serialize",
            "shift",
            "sort",
            "sum",
            "toJson",
            "groupBy",
            "transform",
            "unique",
            "where",
            "whereIn",
            "whereNotIn",
            "zip",
            "setAppends",
            "addRelation",
            "__iter__",
            "__eq__",
            "__getitem__",
            "__setitem__",
            "__delitem__",
            "__ne__",
            "__len__",
            "__le__",
            "__lt__",
            "__ge__",
            "__gt__"
        ],
        "excludedHelpers": [
            "_getUniqueItemsWithoutKey",
            "_getUniqueItemsByKey",
            "_addUniqueItem",
            "__getValue",
            "__dataGet",
            "__value",
            "__checkIsCallable",
            "__makeComparison",
            "__getItems"
        ]
    },
    "orionis/support/types/stringable.py": {
        "class": "Stringable",
        "prefix": "stringable",
        "pageId": "helper-stringable",
        "reference": "/advanced/data-utilities/stringable",
        "methods": [
            "after",
            "afterLast",
            "append",
            "newLine",
            "before",
            "beforeLast",
            "contains",
            "endsWith",
            "exactly",
            "isEmpty",
            "isNotEmpty",
            "lower",
            "upper",
            "reverse",
            "repeat",
            "replace",
            "stripTags",
            "toBase64",
            "fromBase64",
            "md5",
            "sha1",
            "sha256",
            "length",
            "value",
            "toInteger",
            "toFloat",
            "toBoolean",
            "__getitem__",
            "__str__",
            "isAlnum",
            "isAlpha",
            "isDecimal",
            "isDigit",
            "isIdentifier",
            "isLower",
            "isNumeric",
            "isPrintable",
            "isSpace",
            "isTitle",
            "isUpper",
            "lStrip",
            "rStrip",
            "swapCase",
            "zFill",
            "ascii",
            "camel",
            "kebab",
            "snake",
            "studly",
            "pascal",
            "slug",
            "title",
            "headline",
            "apa",
            "ucfirst",
            "lcfirst",
            "isAscii",
            "isJson",
            "isUrl",
            "isUuid",
            "isUlid",
            "chopStart",
            "chopEnd",
            "deduplicate",
            "mask",
            "limit",
            "padBoth",
            "padLeft",
            "padRight",
            "trim",
            "ltrim",
            "rtrim",
            "charAt",
            "position",
            "match",
            "matchAll",
            "isMatch",
            "test",
            "numbers",
            "excerpt",
            "basename",
            "dirname",
            "between",
            "betweenFirst",
            "finish",
            "start",
            "explode",
            "split",
            "ucsplit",
            "squish",
            "words",
            "wordCount",
            "wordWrap",
            "wrap",
            "unwrap",
            "replaceArray",
            "replaceFirst",
            "replaceLast",
            "replaceStart",
            "replaceEnd",
            "replaceMatches",
            "remove",
            "plural",
            "pluralStudly",
            "pluralPascal",
            "singular",
            "parseCallback",
            "when",
            "whenContains",
            "whenContainsAll",
            "whenEmpty",
            "whenNotEmpty",
            "whenEndsWith",
            "whenDoesntEndWith",
            "whenExactly",
            "whenNotExactly",
            "whenStartsWith",
            "whenDoesntStartWith",
            "whenTest",
            "convertCase",
            "transliterate",
            "hash",
            "pipe",
            "take",
            "swap",
            "substrCount",
            "substrReplace",
            "scan",
            "prepend",
            "substr",
            "doesntContain",
            "doesntStartWith",
            "doesntEndWith",
            "startsWith",
            "jsonSerialize",
            "offsetExists",
            "offsetGet",
            "isPattern",
            "containsAll",
            "whenIs",
            "whenIsAscii",
            "whenIsUuid",
            "whenIsUlid",
            "toDate",
            "encrypt",
            "decrypt",
            "toHtmlString",
            "tap"
        ],
        "excludedHelpers": []
    },
    "orionis/support/types/dot_dict.py": {
        "class": "DotDict",
        "prefix": "dotdict",
        "pageId": "helper-dot-dict",
        "reference": "/advanced/data-utilities/dot-dict",
        "methods": [
            "__getattr__",
            "__setattr__",
            "__delattr__",
            "get",
            "export",
            "copy"
        ],
        "excludedHelpers": []
    },
    "orionis/support/types/std.py": {
        "class": "StdClass",
        "prefix": "stdclass",
        "pageId": "helper-std-class",
        "reference": "/advanced/data-utilities/std-class",
        "methods": [
            "__init_subclass__",
            "__hash__",
            "__init__",
            "__repr__",
            "__str__",
            "__eq__",
            "toDict",
            "update",
            "remove",
            "fromDict"
        ],
        "excludedHelpers": []
    },
    "orionis/support/types/sentinel.py": {
        "class": "_MISSING_TYPE",
        "prefix": "sentinel",
        "pageId": "helper-sentinel",
        "reference": "/advanced/data-utilities/sentinel",
        "methods": [
            "__repr__",
            "__bool__"
        ],
        "excludedHelpers": []
    },
    "orionis/support/system/workers.py": {
        "class": "Workers",
        "prefix": "workers",
        "pageId": "helper-workers",
        "reference": "/advanced/data-utilities/workers",
        "methods": [
            "setRamPerWorker",
            "calculate"
        ],
        "excludedHelpers": [
            "_get_cpu_count"
        ]
    },
    "orionis/support/structures/freezer.py": {
        "class": "FreezeThaw",
        "prefix": "freezethaw",
        "pageId": "helper-freeze-thaw",
        "reference": "/advanced/data-utilities/freeze-thaw",
        "methods": [
            "thaw",
            "freeze"
        ],
        "excludedHelpers": [
            "_isContainer"
        ]
    },
    "orionis/support/performance/counter.py": {
        "class": "PerformanceCounter",
        "prefix": "performancecounter",
        "pageId": "helper-performance-counter",
        "reference": "/advanced/data-utilities/performance-counter",
        "methods": [
            "__init__",
            "start",
            "astart",
            "stop",
            "astop",
            "elapsedTime",
            "aelapsedTime",
            "getMicroseconds",
            "agetMicroseconds",
            "getMilliseconds",
            "agetMilliseconds",
            "getSeconds",
            "agetSeconds",
            "getMinutes",
            "agetMinutes",
            "restart",
            "arestart",
            "__enter__",
            "__exit__",
            "__aenter__",
            "__aexit__"
        ],
        "excludedHelpers": []
    }
}
METADATA_SOURCE = "orionis/metadata/framework.py"
METADATA_CONSTANTS = (
    "AUTHOR", "AUTHOR_EMAIL", "API", "DESCRIPTION", "DOCS", "FRAMEWORK",
    "NAME", "PYTHON_REQUIRES", "SKELETON", "VERSION",
)
CONTRACTS = {
    "orionis/support/types/contracts/collection.py": "orionis/support/types/collection.py",
    "orionis/support/types/contracts/std.py": "orionis/support/types/std.py",
    "orionis/support/system/contracts/workers.py": "orionis/support/system/workers.py",
    "orionis/support/performance/contracts/counter.py": "orionis/support/performance/counter.py",
}
REVIEWED_CONTRACT_METHODS = {
    "orionis/support/types/contracts/collection.py": (
        "take first last all avg max min chunk collapse contains count diff each every filter flatten "
        "forget forPage get implode isEmpty map mapInto merge pluck pop prepend pull push put random "
        "reduce reject reverse serialize shift sort sum toJson groupBy transform unique where whereIn "
        "whereNotIn zip setAppends"
    ).split(),
    "orionis/support/types/contracts/std.py": ["toDict", "update", "remove"],
    "orionis/support/system/contracts/workers.py": ["setRamPerWorker", "calculate"],
    "orionis/support/performance/contracts/counter.py": (
        "start astart stop astop elapsedTime aelapsedTime getMicroseconds agetMicroseconds "
        "getMilliseconds agetMilliseconds getSeconds agetSeconds getMinutes agetMinutes restart arestart"
    ).split(),
}
EXPECTED_EXPORTS = {
    "orionis/support/__init__.py": [],
    "orionis/support/types/__init__.py": ["MISSING", "Collection", "DotDict", "StdClass", "Stringable"],
    "orionis/support/system/__init__.py": ["Workers"],
    "orionis/support/performance/__init__.py": ["PerformanceCounter"],
    "orionis/support/structures/__init__.py": [],
    "orionis/metadata/__init__.py": [
        "API", "AUTHOR", "AUTHOR_EMAIL", "DESCRIPTION", "DOCS", "FRAMEWORK",
        "NAME", "PYTHON_REQUIRES", "SKELETON", "VERSION",
    ],
}
CONTAINER_SOURCE = "orionis/container/container.py"
CONTAINER_METHODS = ("instance", "transient", "singleton", "make", "call")
SERVICE_INTEGRATIONS = {
    "orionis/support/facades/datetime.py": ["stringable-method-todate"],
    "orionis/support/facades/encrypter.py": ["stringable-method-encrypt", "stringable-method-decrypt"],
    "orionis/encrypter/contracts/encrypter.py": ["stringable-method-encrypt", "stringable-method-decrypt"],
    "orionis/encrypter/encrypter.py": ["stringable-method-encrypt", "stringable-method-decrypt"],
    "orionis/container/facades/facade.py": ["stringable-method-encrypt", "stringable-method-decrypt"],
    "orionis/container/facades/meta.py": ["stringable-method-encrypt", "stringable-method-decrypt"],
    "orionis/support/facades/__init__.py": ["stringable-method-encrypt", "stringable-method-todate"],
    "orionis/http/__init__.py": ["stringable-method-encrypt", "stringable-method-decrypt"],
    "orionis/http/responses.py": ["stringable-method-encrypt", "stringable-method-decrypt"],
}
NATIVE_TEST_FILES = (
    "tests/support/types/test_basics.py",
    "tests/support/types/test_case.py",
    "tests/support/types/test_collection.py",
    "tests/support/types/test_conditionals.py",
    "tests/support/types/test_dot_dict.py",
    "tests/support/types/test_encoding.py",
    "tests/support/types/test_manipulation.py",
    "tests/support/types/test_plural.py",
    "tests/support/types/test_sentinel.py",
    "tests/support/types/test_std.py",
    "tests/support/types/test_validation.py",
    "tests/support/system/test_workers.py",
    "tests/support/structures/test_freezer.py",
    "tests/support/performance/test_counter.py",
    "tests/metadata/test_framework.py",
    "tests/metadata/test_package.py",
)


def normalized_source(framework: Path, source: str) -> str:
    """Read only an explicitly named source, normalizing cross-platform newlines."""
    return (framework / source).read_text(encoding="utf-8").replace("\r\n", "\n")


def signature(node: ast.FunctionDef | ast.AsyncFunctionDef) -> str:
    """Preserve every parameter, annotation, default and return in normalized form."""
    prefix = "async " if isinstance(node, ast.AsyncFunctionDef) else ""
    result = prefix + node.name + "(" + ast.unparse(node.args) + ")"
    return result + (" -> " + ast.unparse(node.returns) if node.returns else "")


def class_signature(node: ast.ClassDef) -> str:
    bases = [ast.unparse(base) for base in node.bases]
    bases.extend(ast.unparse(keyword) for keyword in node.keywords)
    return "class " + node.name + ("(" + ", ".join(bases) + ")" if bases else "")


def is_dunder(name: str) -> bool:
    return name.startswith("__") and name.endswith("__")


def method_reference(spec: dict, name: str) -> str:
    return spec["reference"] + "#" + spec["prefix"] + "-method-" + name.strip("_").replace("_", "-").lower()


def assigned_names(node: ast.AST) -> list[str]:
    if isinstance(node, ast.AnnAssign):
        return [node.target.id] if isinstance(node.target, ast.Name) else []
    if isinstance(node, ast.Assign):
        return [target.id for target in node.targets if isinstance(target, ast.Name)]
    return []


def extract(framework: Path) -> dict:
    hashes: dict[str, str] = {}

    def read(source: str) -> tuple[str, ast.Module]:
        content = normalized_source(framework, source)
        hashes[source] = hashlib.sha256(content.encode("utf-8")).hexdigest()
        return content, ast.parse(content, filename=source)

    def entry(source: str, node: ast.AST, symbol: str, kind: str, definition: str,
              page: str, reference: str) -> dict:
        value = {
            "source": source, "symbol": symbol, "kind": kind, "line": node.lineno,
            "signature": definition, "pageId": page, "reference": reference,
        }
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            value["decorators"] = [ast.unparse(item) for item in node.decorator_list]
            value["async"] = isinstance(node, ast.AsyncFunctionDef)
        return value

    entries, excluded, internal_state = [], [], []
    per_class = {}
    for source, spec in REVIEWED_MODULES.items():
        _, tree = read(source)
        classes = [node for node in tree.body if isinstance(node, ast.ClassDef)]
        if [node.name for node in classes] != [spec["class"]]:
            raise ValueError(f"Unreviewed helper class in {source}; review the explicit class mapping.")
        cls = classes[0]
        entries.append(entry(
            source, cls, cls.name,
            "implementation-class" if cls.name.startswith("_") else "class",
            class_signature(cls), spec["pageId"], spec["reference"],
        ))
        methods = [node for node in cls.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
        public = [node for node in methods if not node.name.startswith("_") or is_dunder(node.name)]
        expected = set(spec["methods"])
        actual = {node.name for node in public}
        if actual != expected:
            raise ValueError(
                f"Unreviewed helper API in {source}: added={sorted(actual - expected)}, "
                f"removed={sorted(expected - actual)}. Review explicit mappings before --write."
            )
        for node in public:
            kind = "constructor" if node.name == "__init__" else "special-method" if is_dunder(node.name) else "method"
            entries.append(entry(source, node, cls.name + "." + node.name, kind, signature(node),
                                 spec["pageId"], method_reference(spec, node.name)))
        per_class[cls.name] = {
            "source": source, "publicMethods": sum(not node.name.startswith("_") for node in public),
            "implementedDunders": sum(is_dunder(node.name) for node in public),
            "totalOwnMethods": len(public),
        }

        helper_nodes = [node for node in methods if node not in public]
        module_functions = [node for node in tree.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))]
        if any(not node.name.startswith("_") for node in module_functions):
            raise ValueError(f"Unreviewed module-level helper function in {source}.")
        helper_nodes += module_functions
        actual_helpers = {node.name for node in helper_nodes}
        if actual_helpers != set(spec["excludedHelpers"]):
            raise ValueError(f"Private helper declarations changed in {source}; review exclusions before --write.")
        for node in helper_nodes:
            owner = cls.name + "." if node in methods else ""
            excluded.append({
                "source": source, "symbol": owner + node.name, "line": node.lineno,
                "signature": signature(node),
                "reason": "Private implementation helper; observable behavior belongs to the mapped public operations.",
            })

        for node in cls.body:
            for name in assigned_names(node):
                if name == "RESERVED" and cls.name == "StdClass":
                    entries.append(entry(source, node, "StdClass.RESERVED", "class-attribute",
                                         ast.unparse(node), spec["pageId"],
                                         spec["reference"] + "#stdclass-property-reserved"))
                elif not name.startswith("_"):
                    raise ValueError(f"Unreviewed class attribute {cls.name}.{name}; add an explicit mapping.")
                else:
                    internal_state.append({
                        "source": source, "symbol": cls.name + "." + name,
                        "signature": ast.unparse(node),
                        "reason": "Private state or Python layout metadata; not a functional public declaration.",
                    })
        for node in tree.body:
            for name in assigned_names(node):
                if name == "MISSING" and cls.name == "_MISSING_TYPE":
                    entries.append(entry(source, node, name, "exported-marker", ast.unparse(node),
                                         spec["pageId"], spec["reference"] + "#sentinel-protocol-identity"))
                elif not name.startswith("_"):
                    raise ValueError(f"Unreviewed module declaration {source}:{name}.")
                else:
                    internal_state.append({
                        "source": source, "symbol": name, "signature": ast.unparse(node),
                        "reason": "Private module constant or cache; not public helper API.",
                    })

    _, metadata_tree = read(METADATA_SOURCE)
    metadata_nodes = [(node, name) for node in metadata_tree.body for name in assigned_names(node)]
    if {name for _, name in metadata_nodes} != set(METADATA_CONSTANTS) or any(
        isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)) for node in metadata_tree.body
    ):
        raise ValueError("Unreviewed metadata declarations; review the ten explicit constant mappings.")
    for node, name in metadata_nodes:
        item = entry(METADATA_SOURCE, node, name, "metadata-constant", ast.unparse(node),
                     "metadata-overview", "/advanced/framework-metadata#metadata-constant-" + name.replace("_", "-").lower())
        literal = ast.literal_eval(node.value)
        item["value"] = list(literal) if isinstance(literal, tuple) else literal
        item["valueType"] = type(literal).__name__
        entries.append(item)

    contracts = []
    for source, implementation in CONTRACTS.items():
        _, tree = read(source)
        spec = REVIEWED_MODULES[implementation]
        classes = [node for node in tree.body if isinstance(node, ast.ClassDef)]
        if [cls.name for cls in classes] != ["I" + spec["class"]]:
            raise ValueError(f"Unreviewed contract class declarations in {source}.")
        for cls in classes:
            actual_methods = {node.name for node in cls.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
            if actual_methods != set(REVIEWED_CONTRACT_METHODS[source]):
                raise ValueError(f"Unreviewed contract methods in {source}; review explicit contract mappings before --write.")
            contracts.append(entry(source, cls, cls.name, "contract-class", class_signature(cls),
                                   spec["pageId"], spec["reference"]))
            for node in cls.body:
                if any(not name.startswith("_") for name in assigned_names(node)):
                    raise ValueError(f"Unreviewed public contract attribute in {source}.")
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if node.name not in spec["methods"]:
                        raise ValueError(f"Contract declaration has no reviewed native mapping: {cls.name}.{node.name}")
                    contracts.append(entry(source, node, cls.name + "." + node.name,
                                           "contract-method", signature(node), spec["pageId"],
                                           method_reference(spec, node.name)))

    exports = {}
    for source, expected in EXPECTED_EXPORTS.items():
        _, tree = read(source)
        declared, destinations = [], {}
        for node in tree.body:
            names = assigned_names(node)
            if "__all__" in names:
                declared = ast.literal_eval(node.value)
            elif "_EXPORTS" in names:
                destinations.update({name: list(value) for name, value in ast.literal_eval(node.value).items()})
            elif isinstance(node, ast.ImportFrom) and node.module:
                for alias in node.names:
                    destinations[alias.asname or alias.name] = [node.module, alias.name]
        if set(declared) != set(expected):
            raise ValueError(f"Unreviewed curated exports in {source}; review the export mapping.")
        exports[source] = {
            "names": declared,
            "destinations": {name: destinations[name] for name in declared},
            "purpose": "Curated package imports; structures has no FreezeThaw re-export.",
        }

    _, container_tree = read(CONTAINER_SOURCE)
    container_class = next(node for node in container_tree.body if isinstance(node, ast.ClassDef) and node.name == "Container")
    container_methods = {node.name: node for node in container_class.body if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))}
    integrations = [{
        "source": CONTAINER_SOURCE,
        "reviewedSymbols": [{"symbol": "Container." + name, "signature": signature(container_methods[name])}
                            for name in CONTAINER_METHODS],
        "references": [spec["reference"] for spec in REVIEWED_MODULES.values()],
        "purpose": (
            "Concrete auto-resolution, constructor injection, initialized instance binding and contract registration. "
            "Data values must be supplied explicitly; MISSING is an exported object, not an injectable public class."
        ),
    }]
    for source, anchors in SERVICE_INTEGRATIONS.items():
        read(source)
        integrations.append({
            "source": source,
            "references": ["/advanced/data-utilities/stringable#" + anchor for anchor in anchors],
            "purpose": "Reviewed support for Stringable date/encryption calls and runnable service/controller examples; auxiliary API is not counted as helper declarations.",
        })

    tests = []
    for source in NATIVE_TEST_FILES:
        _, tree = read(source)
        methods = sum(
            isinstance(member, (ast.FunctionDef, ast.AsyncFunctionDef)) and member.name.startswith("test")
            for cls in tree.body if isinstance(cls, ast.ClassDef) for member in cls.body
        )
        tests.append({"source": source, "declaredTestMethods": methods})
    method_entries = [item for item in entries if item["kind"] in {"method", "special-method", "constructor"}]
    counts = Counter(item["kind"] for item in entries)
    return {
        "schemaVersion": 1,
        "scope": (
            "Nine explicitly named native source files. Count only own public methods, implemented Python dunders, "
            "public classes, StdClass.RESERVED, exported MISSING and ten metadata constants. The private sentinel "
            "implementation class is tracked explicitly because its two dunders define the exported marker's behavior. "
            "Contract declarations, curated exports, Container integration, private helpers, private state, inherited "
            "stdlib behavior and native test declarations are separate and never inflate the own-method total."
        ),
        "nativeSources": list(REVIEWED_MODULES) + [METADATA_SOURCE],
        "counts": {
            "mappedNativeDeclarations": len(entries), "publicClasses": counts["class"],
            "sentinelImplementationClasses": counts["implementation-class"],
            "ownMethods": len(method_entries), "publicMethods": counts["method"],
            "implementedDunders": counts["special-method"] + counts["constructor"],
            "publicClassAttributes": counts["class-attribute"],
            "exportedMarkers": counts["exported-marker"], "metadataConstants": counts["metadata-constant"],
            "contractDeclarations": len(contracts), "privateHelpersExcluded": len(excluded),
            "nativeTestFiles": len(tests), "declaredNativeTestMethods": sum(item["declaredTestMethods"] for item in tests),
        },
        "perClass": per_class,
        "hashes": dict(sorted(hashes.items())),
        "exports": exports,
        "contracts": contracts,
        "integrations": integrations,
        "nativeTests": {
            "scope": "AST-declared methods in these exact native modules; this discovery snapshot does not claim tests were executed.",
            "files": tests,
        },
        "excludedDeclarations": excluded,
        "internalStateExcluded": internal_state,
        "inheritedApi": [
            {
                "owner": "DotDict", "origin": "builtins.dict/object",
                "reference": "/advanced/data-utilities/dot-dict#dotdict-protocol-dictionary",
                "publicMethods": ["clear", "fromkeys", "items", "keys", "pop", "popitem", "setdefault", "update", "values"],
                "protocols": ["construction", "indexing", "iteration", "length", "membership", "comparison", "union", "representation"],
                "copyAndSerializationReference": "/advanced/data-utilities/dot-dict#dotdict-protocol-copy-serialization",
            },
            {
                "owner": "Stringable", "origin": "builtins.str",
                "reference": "/advanced/data-utilities/stringable#stringable-constructor",
                "protocols": ["construction", "length", "iteration", "containment", "comparison", "hashing", "formatting", "truthiness", "concatenation", "multiplication"],
                "note": "Only __getitem__ and __str__ are declared by Orionis; inherited str methods are not extra native declarations.",
            },
            {
                "owner": "StdClass", "origin": "builtins.object",
                "reference": "/advanced/data-utilities/std-class#stdclass-protocol-attributes",
                "copyAndSerializationReference": "/advanced/data-utilities/std-class#stdclass-protocol-copy-serialization",
            },
            {
                "owner": "MISSING", "origin": "builtins.object",
                "reference": "/advanced/data-utilities/sentinel#sentinel-protocol-identity",
                "copyAndSerializationReference": "/advanced/data-utilities/sentinel#sentinel-protocol-copy-serialization",
            },
            {
                "owner": "FreezeThaw", "origin": "builtins.object; returned built-in containers",
                "reference": "/advanced/data-utilities/freeze-thaw#freezethaw-protocol-serialization",
                "note": "The helper declares no custom copy or serialization dunder.",
            },
        ],
        "entries": entries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", required=True, type=Path)
    parser.add_argument("--write", action="store_true", help="Refresh an explicitly reviewed snapshot; new declarations still require mappings in this script.")
    args = parser.parse_args()
    try:
        actual = extract(args.framework_root.resolve())
    except (ValueError, OSError, SyntaxError) as error:
        raise SystemExit(str(error)) from error
    if args.write:
        MANIFEST.parent.mkdir(parents=True, exist_ok=True)
        MANIFEST.write_text(json.dumps(actual, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    elif not MANIFEST.exists():
        raise SystemExit("No reviewed utilities inventory exists. Review the mappings and run explicitly with --write.")
    else:
        reviewed = json.loads(MANIFEST.read_text(encoding="utf-8"))
        if actual != reviewed:
            raise SystemExit("Utilities source changed: review source, signatures, mappings and guides before explicitly refreshing with --write.")
    counts = actual["counts"]
    print(
        f"Utilities source verified: {counts['mappedNativeDeclarations']} mapped declarations, "
        f"{counts['ownMethods']} own methods ({counts['publicMethods']} public + "
        f"{counts['implementedDunders']} dunders), {counts['metadataConstants']} metadata constants, "
        f"{len(actual['hashes'])} hashed files."
    )


if __name__ == "__main__":
    main()
