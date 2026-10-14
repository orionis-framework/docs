---
title: "Entorno y configuración de proceso"
description: "Para desarrollar una aplicación, guarda los valores del entorno en el .env del proyecto generado y léelos desde los archivos tipados de config/. Ejecuta Reactor desde esa raíz…"
editUrl: true
lastUpdated: false
---

Para desarrollar una aplicación, guarda los valores del entorno en el `.env` del proyecto generado y léelos desde los archivos tipados de `config/`. Ejecuta Reactor desde esa raíz para que la primera lectura seleccione el archivo correcto. [Leer y escribir configuración de entorno](/es/architecture/environment/typed-configuration) muestra el flujo completo.

Mantén un `.env.example` con las claves necesarias y ejemplos sin secretos. Cambiar `.env` requiere reiniciar procesos o recargarlo de forma deliberada; editar el archivo no reconstruye automáticamente la configuración de servicios existentes.

## Descripción general

La API del paquete es `Env` junto al helper `env()`. Ambos delegan a un singleton de proceso `DotEnv`. En el primer uso resuelve `.env` desde el directorio actual, lo crea si falta, lo carga en `os.environ` dando precedencia al archivo y conserva sus entradas para `all()`.

Los valores pueden usar prefijos explícitos como `int:`, `bool:`, `list:`, `path:` o `base64:`. Los no prefijados aún reconocen nulos, booleanos y literales Python seguros. `EnvironmentCaster` implementa serialización y parsing tipado.

## Requisitos

- Python 3.14 o posterior.
- `python-dotenv>=1.2.3,<2.0`, instalado por Orionis.
- Acceso de lectura/escritura al `.env` elegido para `set`, `unset` y `reload` persistentes.
- Nombres en mayúscula que coincidan con `[A-Z][A-Z0-9_]*`.

## Recorrido del módulo

- [Persistencia, recarga y referencia de Env](/es/architecture/environment/operations-and-reference)
- [Leer y escribir configuración de entorno](/es/architecture/environment/typed-configuration)

Continúa por: [foundation](/es/getting-started) · [encrypter](/es/security/encryption).
