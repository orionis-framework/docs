---
title: Depuración VSCode
tableOfContents: true
editUrl: true
lastUpdated: true
template: doc
---

# Depuración con Visual Studio Code

Orionis Framework es totalmente compatible con el depurador de **Visual Studio Code**, lo que te permite colocar **breakpoints**, inspeccionar variables, navegar por el call stack y ejecutar paso a paso cualquier parte de tu aplicación, ya sea el servidor web o comandos de consola.

## 🗂️ Requisito previo: crear el archivo de configuración

Para activar el soporte de depuración, crea el siguiente archivo en la raíz de tu proyecto (si la carpeta `.vscode/` no existe, créala también):

```
.vscode/launch.json
```

:::tip
La carpeta `.vscode/` es reconocida automáticamente por Visual Studio Code. No necesitas ninguna extensión adicional para que funcione, aunque se recomienda tener instalada la extensión **Python** (`ms-python.python`).
:::

## 📄 Configuración básica

Copia y pega la siguiente configuración dentro de `.vscode/launch.json`:

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

### Descripción de cada campo

| Campo | Descripción |
|---|---|
| `name` | Nombre que aparecerá en el selector de configuraciones de VS Code. |
| `type` | Motor de depuración. Usa `debugpy`, el depurador oficial de Python. |
| `request` | Tipo de solicitud. `launch` inicia el proceso desde cero. |
| `python` | Ruta al intérprete de Python dentro del entorno virtual. |
| `program` | Punto de entrada de la aplicación (`reactor` en Orionis). |
| `pythonArgs` | Flags pasados al intérprete. `-B` evita generar archivos `.pyc`. |
| `args` | Argumentos del programa. Aquí defines el comando a ejecutar. |
| `cwd` | Directorio de trabajo. Debe ser la raíz del proyecto. |
| `console` | Usa la terminal integrada de VS Code para mostrar la salida. |
| `justMyCode` | `true` limita la depuración únicamente al código del proyecto, ignorando librerías externas y el entorno virtual. |
| `env` | Variables de entorno que activan el entorno virtual correctamente. |

## ⚙️ Personalización según el caso de uso

El campo `args` es el que debes modificar según lo que quieras depurar:

```json
"args": ["serve"]
```

| Escenario | Valor de `args` |
|---|---|
| Servidor web | `["serve"]` |
| Comando de consola personalizado | `["nombre-del-comando"]` |
| Comando con argumentos adicionales | `["nombre-del-comando", "--opcion", "valor"]` |

**Ejemplo para depurar un comando de consola llamado `import:data`:**

```json
"args": ["import:data", "--source", "users.csv"]
```

### Múltiples configuraciones

Puedes definir varias configuraciones dentro del array `"configurations"` para cubrir distintos escenarios sin tener que editar el archivo cada vez:

```json
{
    "version": "1.0.0",
    "configurations": [
        {
            "name": "Debug Servidor Web",
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
            "name": "Debug Comando de Consola",
            "type": "debugpy",
            "request": "launch",
            "python": "${workspaceFolder}/.venv/Scripts/python.exe",
            "program": "${workspaceFolder}/reactor",
            "pythonArgs": ["-B"],
            "args": ["nombre-del-comando"],
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

Para cambiar de configuración, usa el selector desplegable en el panel **Run and Debug** (`Ctrl+Shift+D`) de VS Code.

## ▶️ Cómo iniciar la depuración

1. Abre el panel **Run and Debug** con `Ctrl+Shift+D`.
2. Selecciona la configuración deseada en el desplegable superior.
3. Coloca breakpoints haciendo clic en el margen izquierdo del editor (aparecerá un punto rojo).
4. Presiona **F5** o haz clic en el botón de play verde para iniciar.

La ejecución se detendrá automáticamente en cada breakpoint, permitiéndote inspeccionar el estado de la aplicación.

## ⚠️ Notas importantes

* La ruta de Python debe apuntar al entorno virtual del proyecto:

  ```
  .venv/Scripts/python.exe       ← Windows
  .venv/bin/python               ← macOS / Linux
  ```

* Si tu entorno virtual se llama de forma distinta a `.venv`, actualiza todas las referencias en el archivo `launch.json`.

* La opción `"justMyCode": true` limita la depuración al código de tu proyecto, ignorando el `.venv` y las librerías de Python. Si en algún momento necesitas depurar código interno de una dependencia, puedes cambiarlo temporalmente a `false`.
