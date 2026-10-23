"""Compare the documented Mail surface with an adjacent framework checkout."""

from __future__ import annotations

import argparse
import ast
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/mail-api-inventory.json"
PROTOCOLS = {"__init__", "__aenter__", "__aexit__"}
SOURCE_ROOTS = ("orionis/mail", "orionis/foundation/config/mail")
SOURCE_FILES = ("config/mail.py", "orionis/support/facades/mail.py")


def destination(file: str, owner: str, name: str, kind: str) -> str:
    base = "/services/mail/"
    if file.startswith("orionis/foundation/config/mail") or file == "config/mail.py":
        return base + "configuration#config-" + ("mail" if owner == "BootstrapMail" else owner.lower())
    if file.endswith("facades/mail.py"):
        return base + ("api-reference#facade-accessor" if name == "getFacadeAccessor" else "manager-and-injection#facade")
    if file.endswith("provider.py"):
        return base + "api-reference#provider"
    if file.endswith("exceptions.py"):
        return base + "api-reference#exceptions"
    if file.endswith("functions.py"):
        return base + "api-reference#helper-" + name.replace("_", "-")
    if file.endswith("types.py") or kind == "type-alias":
        return base + "api-reference#mail-types"
    if owner in {"MailComposer"}:
        return base + "api-reference#composer"
    if owner == "MailManager":
        return base + ("transports-and-extensions#custom-transports" if name == "extend" else "manager-and-injection#manager-construction")
    if owner in {"IMailManager", "PendingMail"}:
        if name == "extend":
            return base + "transports-and-extensions#custom-transports"
        return base + "sending-and-results#pending-" + ("construction" if kind == "class" or name == "__init__" else name.lower())
    if owner == "Message":
        return base + "sending-and-results#message-" + ("construction" if kind == "class" or name == "__init__" else name.lower())
    if owner in {"MailOptions", "MailResult", "PreparedMail", "MailStatus"}:
        return base + "sending-and-results#" + {"MailOptions":"delivery-options", "MailResult":"mail-result", "PreparedMail":"prepared-mail", "MailStatus":"mail-result"}[owner]
    if owner == "Mailable":
        return base + "composing-mail#mailable-" + ("construction" if kind == "class" else name.lower())
    if owner == "Address" or file.endswith("entities/address.py"):
        return base + "composing-mail#address" + ("-" + name.lower() if kind in {"method", "function"} else "")
    if owner == "Envelope":
        return base + "composing-mail#envelope" + ("-recipients" if name == "recipients" else "")
    if owner == "Content":
        return base + "content-and-views#content"
    if owner == "Attachment":
        return base + "attachments#attachment" + ("-fromstorage" if name == "fromStorage" else "")
    if owner == "SmtpSettings":
        return base + "transports-and-extensions#smtp-settings"
    if owner == "MailEncryption":
        return base + "configuration#config-smtp"
    if owner == "IMailTransport":
        return base + "transports-and-extensions#custom-transports"
    if "/transports/" in file:
        return base + "transports-and-extensions#driver-" + Path(file).stem
    raise ValueError(f"No documentation mapping for {file}:{owner}.{name}")


def extract(framework: Path) -> dict:
    files = sorted({p for directory in SOURCE_ROOTS for p in (framework / directory).rglob("*.py")} | {framework / f for f in SOURCE_FILES})
    entries, hashes = [], {}
    overloads = {}
    for file in files:
        relative = file.relative_to(framework).as_posix()
        source = file.read_text(encoding="utf-8").replace("\r\n", "\n")
        hashes[relative] = hashlib.sha256(source.encode()).hexdigest()
        tree = ast.parse(source)

        def add(node: ast.AST, owner: str, name: str, kind: str, signature: str) -> None:
            symbol = f"{owner}.{name}" if owner and kind != "class" else name
            if kind == "overload":
                index = overloads.get((relative, symbol), 0) + 1
                overloads[(relative, symbol)] = index
                symbol += f"[overload {index}]"
            entries.append({"source": relative, "symbol": symbol,
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
    return {
        "scope": "Own public declarations in Mail, mail configuration and its facade; constructors included; generated dataclass constructors are described through their fields. Contracts and backend overrides are separate lexical declarations. Overloads and public type aliases are included. Private implementation, export plumbing, inherited third-party APIs and generated dataclass methods are excluded.",
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
        raise SystemExit("Mail source has changed: review documentation and regenerate the inventory.")
    print(f"Mail source verified: {len(actual['entries'])} own public declarations in {len(actual['hashes'])} source files.")


if __name__ == "__main__":
    main()
