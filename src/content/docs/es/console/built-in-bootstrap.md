---
title: "Bootstrap y recuperación del proyecto"
description: "Los siete comandos para habilitar contextos opcionales y recuperar configuración sin reemplazar archivos locales."
editUrl: true
lastUpdated: false
---

Los comandos `bootstrap:*` preparan recursos opcionales y su integración con la aplicación. Respetan los paths configurados; los destinos convencionales que aparecen abajo solo se usan cuando no existe una selección efectiva del contexto.

Para las rutas, primero inspeccionan y validan el código del entry point registrado por la aplicación (o `bootstrap/app.py`), calculan una edición segura y validan los recursos existentes. Solo después crean lo faltante y aplican el cambio. Los archivos existentes se conservan. Un contexto con varios archivos de rutas conserva esa lista; no se reduce a un archivo predeterminado.

La salida distingue `CREATED`, `UPDATED`, `EXISTS` y `SKIPPED`. Cuando hay cambios, se invalidan los archivos compilados `config`, `commands` y `routes` presentes bajo `compiledPath`. El resultado normal es `0`; errores de filesystem, tipos, configuración, sintaxis o edición segura se muestran con `1`. No tienen `--force` ni modo de sobrescritura.

<a id="command-bootstrap-ai"></a>

## bootstrap:ai

Habilita rutas de servidores MCP.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Crea el archivo de rutas AI efectivo (por defecto `routes/ai.py`) y los directorios de servidores, tools, resources y prompts MCP. Integra `ai=...` en `withRouting()`; no crea automáticamente servidores con componentes completos.

```shell
orionis bootstrap:ai
python -B reactor bootstrap:ai
```

<a id="command-bootstrap-api"></a>

## bootstrap:api

Habilita el contexto de rutas API.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Crea el archivo de rutas API efectivo (por defecto `routes/api.py`) y los directorios HTTP de controladores, middleware, schemas y reglas. Integra `api=...` en `app.withRouting()` sin sustituir los otros contextos ni el health endpoint.

```shell
orionis bootstrap:api
python -B reactor bootstrap:api
```

<a id="command-bootstrap-config"></a>

## bootstrap:config

Restaura archivos oficiales de configuración faltantes.

| Argumento u opción | Tipo y presencia | Valor efectivo al omitir | Propósito |
|---|---|---|---|
| `file` | str, opcional | `None` | Nombre de configuración sin .py; omitido recupera todas las faltantes. |

`file` es una cadena posicional opcional (`None`): usa el nombre sin `.py`, por ejemplo `queue`, o no lo pases para recuperar todos los recursos faltantes del directorio oficial `config/`. La lista de nombres válidos procede del árbol actual de `orionis-framework/skeleton`, rama `master`; no se fija una lista de choices en el parser.

Requiere acceso HTTPS a la API de GitHub y a los archivos raw. Valida el árbol completo, rutas, tamaño y hash Git de cada blob antes de escribirlo. Preserva byte por byte los archivos locales existentes; no actualiza ni mezcla configuraciones existentes. No registra cada módulo mediante cambios en `bootstrap/app.py`. Una selección desconocida muestra las opciones disponibles y falla; errores de red, metadatos o rutas inseguras también producen estado `1`.

```shell
orionis bootstrap:config queue
python -B reactor bootstrap:config queue
```

<a id="command-bootstrap-console"></a>

## bootstrap:console

Habilita rutas y directorios de consola.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Crea el archivo de rutas de consola efectivo (por defecto `routes/console.py`), `app/console/commands` y `app/console/listeners` según las rutas configuradas. Integra `console=...` en `withRouting()`; los comandos del proyecto se implementan después con clases o definiciones de Reactor.

```shell
orionis bootstrap:console
python -B reactor bootstrap:console
```

<a id="command-bootstrap-lifespan"></a>

## bootstrap:lifespan

Crea e integra callbacks del ciclo de vida.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Crea `bootstrap/lifespan.py` usando la ruta de bootstrap configurada e integra su función síncrona `register_lifespan_callbacks` en el archivo que construye la aplicación. Conserva callbacks existentes y verifica que el archivo exponga esa función antes de añadir su llamada. Si la función existente es asíncrona y todavía requiere integración, rechaza insertar una llamada sin `await`.

```shell
orionis bootstrap:lifespan
python -B reactor bootstrap:lifespan
```

<a id="command-bootstrap-web"></a>

## bootstrap:web

Habilita el contexto de rutas web.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Crea el archivo de rutas web efectivo (por defecto `routes/web.py`) y los directorios HTTP compartidos. Integra `web=...` en `withRouting()`. No instala una interfaz frontend ni genera controladores para cada ruta.

```shell
orionis bootstrap:web
python -B reactor bootstrap:web
```

<a id="command-bootstrap-websocket"></a>

## bootstrap:websocket

Habilita las rutas WebSocket.

No recibe argumentos ni opciones específicas; solo la ayuda automática.

Crea el archivo de rutas WebSocket efectivo (por defecto `routes/websocket.py`) y los directorios HTTP compartidos; integra `websocket=...`. Para generar sockets y hubs utiliza los generadores de Realtime: este comando solo prepara la integración del contexto.

```shell
orionis bootstrap:websocket
python -B reactor bootstrap:websocket
```

### Límites de la recuperación

El arranque especial reconoce únicamente una invocación explícita de uno de estos siete comandos, sin `-h` / `--help`, y omite temporalmente las cachés compiladas. Para `bootstrap:api`, `bootstrap:web`, `bootstrap:websocket`, `bootstrap:console` y `bootstrap:ai`, solo se toleran rutas faltantes del contexto que se está reparando. No convierte cualquier proyecto roto en una aplicación válida.

Si `withRouting()` se construye indirectamente, hay asignaciones ambiguas de la aplicación o no se pueden reconciliar rutas declaradas con las efectivas, el editor rechaza el cambio antes de reemplazar una configuración que no puede interpretar con seguridad. Corrige esa estructura explícitamente y vuelve a ejecutar el comando. La ayuda no activa el contexto de recuperación y por tanto no repara archivos faltantes.
