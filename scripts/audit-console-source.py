"""Compare the documented Console surface with an adjacent framework checkout."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/console-api-inventory.json"
PROTOCOLS = {"__init__", "__await__"}
SOURCE_ROOTS = ("orionis/console", "orionis/foundation/config/scheduler")
SOURCE_FILES = ("config/scheduler.py", "orionis/support/facades/reactor.py", "orionis/support/facades/schedule.py")
AUXILIARY_FILES = ("config/queue.py", "orionis/cache/file_based_cache.py", "orionis/cache/serializer.py", "orionis/foundation/application.py", "bootstrap/app.py", "app/console/scheduler.py")
OMITTED_OUTPUT_CLASSES = {
    "VarDumper", "IVarDumper", "Dumper", "IDumper",
    "HTTPRequestPrinter", "IHTTPRequestPrinter",
}


def omission(owner: str, name: str) -> str | None:
    """Keep intentional editorial exclusions separate from documented API."""
    if owner == "Argument" and name in {"addToParser", "extra"}:
        return "Parser integration details omitted from the user guide at the user's request."
    if owner in OMITTED_OUTPUT_CLASSES or owner in {"Console", "IConsole"} and name == "dump":
        return "Debugging and HTTP diagnostic output omitted from the user guide at the user's request."
    return None


def destination(file: str, owner: str, name: str, kind: str) -> str:
    base = "/console/"
    construction = kind == "class" or name == "__init__"
    if file.startswith("orionis/foundation/config/scheduler") or file == "config/scheduler.py":
        return base + "scheduler-configuration#config-" + ("scheduler" if owner == "BootstrapScheduler" else owner.lower())
    if file.endswith("facades/reactor.py") or owner == "ReactorProvider":
        return base + "api-reference#reactor-provider"
    if file.endswith("facades/schedule.py"):
        return base + "scheduler-execution#schedule-facade"
    if owner == "ScheduleProvider":
        return base + "scheduler-execution#scheduler-provider"
    if file.endswith("templates/stub.py"):
        return base + "api-reference#stub-construction"
    if owner in {"KernelCLI", "IKernelCLI"}:
        return base + "api-reference#kernel-cli"
    if file.endswith("core/commands.py"):
        return base + "api-reference#core-commands"
    if not owner:
        return base + "api-reference#startup-contexts"
    if owner == "Argument":
        return base + "commands-and-arguments#argument-construction"
    if owner == "ArgumentAction":
        return base + "commands-and-arguments#argument-actions"
    if owner in {"BaseCommand", "IBaseCommand"}:
        if name in {"getArgument", "getArguments", "setArguments"}:
            return base + "commands-and-arguments#base-" + name.lower()
        return base + "creating-commands#" + ("base-construction" if name in {"__init__", "handle"} else "base-command")
    if owner in {"Reactor", "IReactor"}:
        return base + "reactor-and-injection#reactor-" + ("construction" if construction else name.lower())
    if owner in {"Loader", "ILoader"}:
        return base + "command-cache#loader-api"
    if owner in {"ICommand", "Command"}:
        if file.endswith("entities/command.py"):
            return base + "api-reference#command-entity"
        return base + "command-routing#fluent-" + ("construction" if construction else name.lower())
    if owner in {"BaseScheduler", "IBaseScheduler"}:
        return base + ("task-scheduling#scheduler-registration" if construction or name == "tasks" else "scheduler-listeners#base-scheduler-events")
    if owner in {"BaseTaskListener", "IBaseTaskListener"}:
        return base + "scheduler-listeners#listener-" + ("construction" if construction else name.lower())
    if owner in {"Schedule", "ISchedule"}:
        return base + "scheduler-execution#schedule-" + ("construction" if construction else name.lower())
    if owner in {"ScheduleStore", "IScheduleStore"}:
        return base + "scheduler-configuration#store-" + ("construction" if construction else name.lower())
    if owner in {"Task", "ITask"}:
        if file.endswith("entities/task.py"):
            return base + "scheduler-frequencies#task-entity-data"
        return base + "scheduler-frequencies#task-" + ("construction" if construction else name.lower())
    if owner in {"TaskEvent", "SchedulerEvent"}:
        label = "task" if owner == "TaskEvent" else "scheduler"
        return base + "scheduler-listeners#" + label + ("-events" if "/enums/" in file else "-event-entity")
    if owner == "ScheduleStates":
        return base + "scheduler-listeners#schedule-states"
    if owner == "ANSIColors":
        return base + "console-output#ansi-colors"
    if owner in {"Console", "IConsole"}:
        if construction:
            return base + "console-output#console"
        if name in {"ask", "confirm", "secret", "anticipate", "choice"}:
            return base + "interactive-input#console-" + name.lower()
        if name in {"progressBar", "sleep"}:
            return base + "progress#console-" + name.lower()
        return base + "console-output#console-" + name.lower()
    for classes, page, prefix in [({"Executor","IExecutor"},"console-output","executor"),({"HelpCommand","IHelpCommand"},"console-output","help-command"),({"ProgressBar","IProgressBar"},"progress","progress-bar")]:
        if owner in classes:
            suffix = "" if kind == "class" else "-construction" if name == "__init__" else "-constants" if kind in {"constant","field"} else "-" + name.lower()
            return base + page + "#" + prefix + suffix
    raise ValueError(f"No documentation mapping for {file}:{owner}.{name}")


def command_inventory(framework: Path) -> list[dict]:
    import sys
    from enum import Enum
    sys.path.insert(0, str(framework))
    from orionis.console.core.commands import CORE_COMMANDS
    from orionis.support.types.sentinel import MISSING
    def value(item):
        if item is MISSING: return {"sentinel": "MISSING"}
        if isinstance(item, Enum): return item.value
        if item is None or isinstance(item, (str,int,float,bool)): return item
        if isinstance(item, tuple): return {"tuple": [value(i) for i in item]}
        if isinstance(item, list): return [value(i) for i in item]
        if isinstance(item, dict): return {str(k):value(v) for k,v in item.items()}
        if callable(item): return {"callable": item.__module__ + "." + item.__qualname__}
        raise TypeError(f"Unsupported command metadata: {type(item)}")
    commands=[]
    fields=("name_or_flags","action","nargs","const","default","type_","choices","required","help","metavar","dest","version")
    for cls in CORE_COMMANDS:
        signature=cls.signature
        family = "generators" if signature.startswith("make:") else "bootstrap" if signature.startswith("bootstrap:") else "database" if signature.startswith(("db:","migrate")) or signature == "seed" else "workers" if signature.startswith(("queue:","schedule:","mcp:")) else "application"
        commands.append({"signature":signature,"class":cls.__module__+"."+cls.__name__,"description":cls.description,"arguments":[{f:value(getattr(arg,f)) for f in fields} for arg in cls.arguments],"reference":f"/console/built-in-{family}#command-{signature.replace(':','-')}"})
    return sorted(commands,key=lambda item:item["signature"])


def extract(framework: Path) -> dict:
    files = sorted({p for directory in SOURCE_ROOTS for p in (framework / directory).rglob("*.py")} | {framework / f for f in SOURCE_FILES})
    entries, exclusions, hashes = [], [], {}
    overloads = {}
    for file in files:
        relative = file.relative_to(framework).as_posix()
        source = file.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
        if relative.startswith("orionis/console/commands/"):
            continue  # Built-in implementation is audited through its CLI declarations.
        tree = ast.parse(source)

        def add(node: ast.AST, owner: str, name: str, kind: str, signature: str) -> None:
            symbol = f"{owner}.{name}" if owner and kind != "class" else name
            if kind == "overload":
                index = overloads.get((relative, symbol), 0) + 1
                overloads[(relative, symbol)] = index
                symbol += f"[overload {index}]"
            entry = {"source": relative, "symbol": symbol,
                     "kind": kind, "line": node.lineno, "signature": signature}
            reason = omission(owner, name)
            if reason:
                exclusions.append({**entry, "reason": reason})
            else:
                entries.append({**entry, "reference": destination(relative, owner, name, kind)})

        for node in tree.body:
            if isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name) and node.target.id == "CORE_COMMANDS":
                add(node, "", node.target.id, "constant", ast.unparse(node))
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
    for relative in AUXILIARY_FILES:
        source = (framework / relative).read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
    return {
        "scope": "Own public lexical declarations in Console outside built-in command implementation, scheduler configuration and the Reactor/Schedule facades. Constructors, public class fields and enum constants are included. Contracts and implementations count separately. Requested editorial omissions are recorded separately in exclusions and have no documentation target. Built-in commands have a separate CLI inventory of their documented Argument fields. Private helpers, export plumbing, TypeVar bindings, inherited APIs and generated dataclass methods are excluded. Auxiliary files are hashed for reviewed integration behavior without counting their unrelated APIs.",
        "sourceRoots": list(SOURCE_ROOTS), "sourceFiles": list(SOURCE_FILES), "auxiliaryFiles": list(AUXILIARY_FILES), "hashes": hashes, "entries": entries, "exclusions": exclusions,
        "commands": command_inventory(framework),
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
        raise SystemExit("Console source has changed: review documentation and regenerate the inventory.")
    print(f"Console source verified: {len(actual['entries'])} documented declarations, {len(actual['exclusions'])} intentional omissions, {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
