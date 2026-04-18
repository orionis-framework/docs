---
title: Debug VSCode
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Debugging with Visual Studio Code

Orionis Framework is fully compatible with the **Visual Studio Code** debugger, allowing you to set **breakpoints**, inspect variables, navigate the call stack, and step through any part of your application — whether it's the web server or console commands.

## 🗂️ Prerequisite: create the configuration file

To enable debugging support, create the following file at the root of your project (if the `.vscode/` folder does not exist, create it as well):

```
.vscode/launch.json
```

:::tip
The `.vscode/` folder is automatically recognized by Visual Studio Code. No additional extensions are required, although it is recommended to have the **Python** extension (`ms-python.python`) installed.
:::

## 📄 Basic configuration

Copy and paste the following configuration into `.vscode/launch.json`:

```json
{
    "version": "1.0.0",
    "configurations": [
        {
            "name": "Debug Orionis Entry Point",
            "type": "debugpy",
            "request": "launch",
            "python": "${workspaceFolder}/.venv/Scripts/python.exe",
            "program": "${workspaceFolder}/reactor",
            "pythonArgs": ["-B"],
            "args": ["serve"],
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "justMyCode": true,
            "env": {
                "PATH": "${workspaceFolder}/.venv/Scripts;${env:PATH}",
                "VIRTUAL_ENV": "${workspaceFolder}/.venv"
            }
        }
    ]
}
```

### Field descriptions

| Field | Description |
|---|---|
| `name` | The name that will appear in the VS Code configuration selector. |
| `type` | The debug engine. Uses `debugpy`, the official Python debugger. |
| `request` | Request type. `launch` starts the process from scratch. |
| `python` | Path to the Python interpreter inside the virtual environment. |
| `program` | Application entry point (`reactor` in Orionis). |
| `pythonArgs` | Flags passed to the interpreter. `-B` prevents generating `.pyc` files. |
| `args` | Program arguments. This is where you define the command to run. |
| `cwd` | Working directory. Must be the project root. |
| `console` | Uses the VS Code integrated terminal to display output. |
| `justMyCode` | `true` limits debugging to your project's code only, ignoring external libraries and the virtual environment. |
| `env` | Environment variables that correctly activate the virtual environment. |

## ⚙️ Customization by use case

The `args` field is what you should modify depending on what you want to debug:

```json
"args": ["serve"]
```

| Scenario | `args` value |
|---|---|
| Web server | `["serve"]` |
| Custom console command | `["command-name"]` |
| Command with additional arguments | `["command-name", "--option", "value"]` |

**Example to debug a console command called `import:data`:**

```json
"args": ["import:data", "--source", "users.csv"]
```

### Multiple configurations

You can define multiple configurations inside the `"configurations"` array to cover different scenarios without having to edit the file each time:

```json
{
    "version": "1.0.0",
    "configurations": [
        {
            "name": "Debug Web Server",
            "type": "debugpy",
            "request": "launch",
            "python": "${workspaceFolder}/.venv/Scripts/python.exe",
            "program": "${workspaceFolder}/reactor",
            "pythonArgs": ["-B"],
            "args": ["serve"],
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "justMyCode": true,
            "env": {
                "PATH": "${workspaceFolder}/.venv/Scripts;${env:PATH}",
                "VIRTUAL_ENV": "${workspaceFolder}/.venv"
            }
        },
        {
            "name": "Debug Console Command",
            "type": "debugpy",
            "request": "launch",
            "python": "${workspaceFolder}/.venv/Scripts/python.exe",
            "program": "${workspaceFolder}/reactor",
            "pythonArgs": ["-B"],
            "args": ["command-name"],
            "cwd": "${workspaceFolder}",
            "console": "integratedTerminal",
            "justMyCode": true,
            "env": {
                "PATH": "${workspaceFolder}/.venv/Scripts;${env:PATH}",
                "VIRTUAL_ENV": "${workspaceFolder}/.venv"
            }
        }
    ]
}
```

To switch between configurations, use the dropdown selector in the **Run and Debug** panel (`Ctrl+Shift+D`) of VS Code.

## ▶️ How to start debugging

1. Open the **Run and Debug** panel with `Ctrl+Shift+D`.
2. Select the desired configuration from the top dropdown.
3. Place breakpoints by clicking on the left margin of the editor (a red dot will appear).
4. Press **F5** or click the green play button to start.

Execution will automatically stop at each breakpoint, allowing you to inspect the state of your application.

## ⚠️ Important notes

* The Python path must point to your project's virtual environment:

  ```
  .venv/Scripts/python.exe       ← Windows
  .venv/bin/python               ← macOS / Linux
  ```

* If your virtual environment is named differently from `.venv`, update all references in the `launch.json` file.

* The `"justMyCode": true` option limits debugging to your project's code, ignoring the `.venv` and Python libraries. If you ever need to debug the internals of a dependency, you can temporarily change it to `false`.