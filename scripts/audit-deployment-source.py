"""Check reviewed deployment integration sources against the documented snapshot."""

from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public/downloads/deployment-source-inventory.json"
COMMON = "/deployment"
PROXY = "/deployment/reverse-proxies"
AREAS = {
    "application-entrypoints-and-bootstrap": (COMMON, ["bootstrap/app.py", "orionis/foundation/application.py"]),
    "python-and-server-dependencies": (COMMON, ["pyproject.toml", ".python-version"]),
    "native-serve-command": (COMMON, ["orionis/console/commands/serve/serve.py"]),
    "environment-and-key": (COMMON, ["config/app.py", "orionis/environment/core/dot_env.py", "orionis/environment/dynamic/caster.py", "orionis/console/commands/support/key_generate.py"]),
    "bootstrap-cache-invalidation": (COMMON, ["orionis/console/commands/support/optimize_clear.py"]),
    "public-disk": (COMMON, ["config/filesystems.py"]),
    "maintenance": (COMMON, ["orionis/console/commands/support/maintenance.py", "orionis/console/commands/support/down.py", "orionis/console/commands/support/up.py"]),
    "migration-cli": (COMMON, ["orionis/console/commands/migrate/base.py", "orionis/console/commands/migrate/migrate.py", "orionis/console/commands/migrate/status.py"]),
    "session-persistence": (COMMON, ["config/session.py"]),
    "trusted-proxies": (PROXY, ["orionis/http/layer/shared/proxies.py", "orionis/foundation/config/http/entitites/proxies.py", "config/http.py"]),
    "request-client-and-url": (PROXY, ["orionis/http/request.py"]),
    "http-security-and-payload-limits": (PROXY, ["orionis/http/kernel.py", "orionis/foundation/config/http/entitites/body.py", "orionis/foundation/config/http/entitites/security.py"]),
    "websocket-origins": (PROXY, ["orionis/foundation/config/http/entitites/websocket.py"]),
    "health-and-default-responses": ("/deployment/health-and-default-responses", ["orionis/http/default/responses.py", "orionis/http/routes/router.py"]),
    "native-serve-tests": (COMMON, ["tests/console/commands/serve/test_serve_command.py"]),
    "native-proxy-tests": (PROXY, ["tests/http/layer/shared/test_proxies.py"]),
}


def snapshot(framework: Path) -> dict:
    areas, hashes = [], {}
    for name, (reference, sources) in AREAS.items():
        for source in sources:
            text = (framework / source).read_text(encoding="utf-8").replace("\r\n", "\n")
            hashes[source] = hashlib.sha256(text.encode()).hexdigest()
        areas.append({"area": name, "reference": reference, "sources": sources})
    revision = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=framework, text=True).strip()
    return {"scope": "Deployment integration, not a public API inventory of the entire framework", "frameworkRevision": revision, "areas": areas, "hashes": hashes}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--framework-root", type=Path, required=True)
    parser.add_argument("--update", action="store_true", help="Replace the snapshot only after reviewing source changes.")
    args = parser.parse_args()
    current = snapshot(args.framework_root.resolve())
    if args.update:
        MANIFEST.write_text(json.dumps(current, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    else:
        recorded = json.loads(MANIFEST.read_text(encoding="utf-8"))
        if current["hashes"] != recorded["hashes"] or current["areas"] != recorded["areas"]:
            raise SystemExit("Deployment sources changed. Review the guides before updating the snapshot.")
    print(f"Deployment source audit valid: {len(current['areas'])} integration areas, {len(current['hashes'])} reviewed source files.")


if __name__ == "__main__":
    main()
