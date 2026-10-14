import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { root, filesUnder, parser, walk, slash } from './documentation-lib.mjs';

const { values } = parseArgs({ options: {
  python: { type: 'string', default: 'python' },
  'framework-root': { type: 'string' },
} });
const examples = [];
const files = (await filesUnder(path.join(root, 'src/content/docs'))).filter((file) => /\.mdx?$/.test(file));
for (const file of files.sort()) {
  const text = await fs.readFile(file, 'utf8');
  walk(parser.parse(text), (node) => {
    if (node.type !== 'code') return;
    const language = (node.lang || 'unlabelled').toLowerCase();
    examples.push({ file: slash(path.relative(root, file)), line: node.position.start.line, language, code: node.value });
  });
}

// Parse examples only. No imports, example statements, application, or services run.
const pythonParser = `import ast, json, sys, tomllib
from pathlib import Path
payload = json.load(sys.stdin)
errors = []
checked = {"python": 0, "json": 0, "toml": 0}
native_imports = 0
module_cache = {}
framework = Path(payload["frameworkRoot"]) if payload.get("frameworkRoot") else None
def module_file(name):
    target = framework.joinpath(*name.split("."))
    for candidate in (target.with_suffix(".py"), target / "__init__.py"):
        if candidate.is_file():
            return candidate
    return None
def exports(file):
    if file not in module_cache:
        tree = ast.parse(file.read_text(encoding="utf-8"))
        names = set()
        def collect(statements):
            for node in statements:
                if isinstance(node, (ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)):
                    names.add(node.name)
                elif isinstance(node, (ast.Import, ast.ImportFrom)):
                    names.update(alias.asname or alias.name.split(".")[0] for alias in node.names)
                elif isinstance(node, (ast.Assign, ast.AnnAssign, ast.AugAssign)):
                    for target in getattr(node, "targets", [getattr(node, "target", None)]):
                        if target:
                            names.update(child.id for child in ast.walk(target) if isinstance(child, ast.Name) and isinstance(child.ctx, ast.Store))
                else:
                    for attribute in ("body", "orelse", "finalbody"):
                        collect(getattr(node, attribute, []))
                    for handler in getattr(node, "handlers", []):
                        collect(handler.body)
        collect(tree.body)
        module_cache[file] = names
    return module_cache[file]
if sys.version_info < (3, 14):
    print(json.dumps({"error": "Python 3.14 or newer is required to parse Orionis examples."}))
    sys.exit(2)
for example in payload["examples"]:
    language = example["language"]
    if language not in checked:
        continue
    checked[language] += 1
    try:
        if language == "python":
            tree = ast.parse(example["code"], filename=example["file"])
            if framework:
                for node in ast.walk(tree):
                    modules = [(alias.name, None) for alias in node.names] if isinstance(node, ast.Import) else [(node.module, node.names)] if isinstance(node, ast.ImportFrom) and node.level == 0 else []
                    for module, symbols in modules:
                        if not module or not (module == "orionis" or module.startswith("orionis.")):
                            continue
                        native_imports += 1
                        file = module_file(module)
                        reason = None
                        if not file:
                            reason = "Native module does not exist: " + module
                        elif symbols:
                            names = exports(file)
                            for alias in symbols:
                                if alias.name != "*" and alias.name not in names and not module_file(module + "." + alias.name) and "__getattr__" not in names:
                                    reason = "Native export does not exist: " + module + "." + alias.name
                                    break
                        if reason:
                            errors.append({"file": example["file"], "line": example["line"] + node.lineno, "language": language, "reason": reason})
        elif language == "json":
            json.loads(example["code"])
        else:
            tomllib.loads(example["code"])
    except (SyntaxError, ValueError) as error:
        errors.append({"file": example["file"], "line": example["line"] + (getattr(error, "lineno", None) or 1), "language": language, "reason": str(error)})
print(json.dumps({"pythonVersion": sys.version.split()[0], "checked": checked, "nativeImportsChecked": native_imports, "errors": errors}))
`;
const parsed = spawnSync(values.python, ['-c', pythonParser], {
  input: JSON.stringify({ examples, frameworkRoot: values['framework-root'] ? path.resolve(root, values['framework-root']) : null }), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024,
});
if (parsed.error || parsed.status !== 0) throw new Error(parsed.error?.message || parsed.stdout || parsed.stderr);
const report = JSON.parse(parsed.stdout);
report.checked.javascript = 0;
for (const example of examples.filter((item) => ['js', 'javascript'].includes(item.language))) {
  report.checked.javascript++;
  const result = spawnSync(process.execPath, ['--check', '--input-type=module'], { input: example.code, encoding: 'utf8' });
  if (result.status !== 0) report.errors.push({ file: example.file, line: example.line + 1, language: example.language, reason: result.stderr.match(/SyntaxError: (.+)/)?.[1] || 'Invalid JavaScript syntax' });
}
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
