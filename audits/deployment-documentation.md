# Auditoría de documentación de Despliegue

## Alcance y navegación

Despliegue mantiene una entrada independiente en «Aplicación y operación», separada de Logs y Exceptions. Se organiza en dos grupos:

- Preparar la publicación: preparación común, proxies/HTTPS y la página existente de salud/respuestas predeterminadas.
- Guías por plataforma: Windows Server, Linux y Docker.

Se conserva `/getting-started/deployment-and-reference`. Su contenido pasa de una referencia parcial de Application a una preparación de despliegue; la referencia completa de Application ya tiene su sección propia. Se agregan cuatro páginas por idioma: proxies, Windows Server, Linux y Docker. Las cinco guías nuevas o reescritas incluyen 47 bloques de ejemplo y cinco diagramas por idioma. La página de salud existente conserva su URL. Se actualiza su enlace desde la introducción de Getting Started.

## Fuente y decisiones comprobadas

El inventario `public/downloads/deployment-source-inventory.json` contiene 16 áreas de integración y hashes normalizados de 30 archivos de implementación, configuración y pruebas. Su alcance es el despliegue; no afirma inventariar la API pública completa de `orionis`.

La revisión cubre los puntos de entrada Application/ASGI/RSGI, bootstrap, dependencias, `serve`, entorno y clave, caché compilada, mantenimiento, migraciones, disco público, sesiones, proxies, Request, seguridad HTTP, límites de payloads, orígenes WebSocket y salud. Las guías enlazan la documentación de componentes para sus configuraciones específicas.

Decisiones operativas documentadas:

- Objeto real `bootstrap.app:app`, ASGI explícito, lifespan habilitado, un worker y recarga desactivada. RSGI se explica como alternativa del mismo objeto.
- `serve` no tiene flags `--host` o `--workers`. Su lanzamiento normal escucha en todas las interfaces en producción y elige workers según la plataforma. Los servicios llaman a Granian directamente para fijar loopback o una red privada.
- Python y dependencias se instalan desde el lockfile de la aplicación, con `uv sync --locked --no-default-groups`. El framework ya incluye Granian.
- El montaje de `storage/app/public` en `/static` se declara explícitamente; Granian atiende esos archivos antes del kernel. No se publica el disco privado.
- Solo el proxy inmediato confiable puede aportar `X-Forwarded-For` y `X-Forwarded-Proto`. Se conserva Host, URI y Origin; no se promete soporte automático de `X-Forwarded-Prefix`.
- Se conservan APP_KEY y datos persistentes. Las cachés compiladas no se distribuyen desde desarrollo ni se comparten entre releases. La documentación distingue reiniciar de recrear un contenedor.
- Workers de colas y scheduler requieren supervisión separada; aumentar workers no comparte estado Realtime, MCP o sesiones de memoria.

La información de herramientas externas se contrastó con fuentes oficiales enlazadas en cada página: uv/Granian, Microsoft, WinSW, Caddy, Ubuntu/Nginx, systemd y Docker.

## Validación ejecutada

`audits/deployment-validation.json` conserva los resultados de las pruebas aisladas y sus límites:

- Nueve tests nativos: cinco de `serve` y cuatro de proxies, mediante Reactor.
- Windows: 24 bloques PowerShell analizados, cuatro XML parseados, Caddyfile validado y argumentos aceptados por Granian. Nueve comprobaciones reales de procesos temporales: HTTPS con certificado verificado, backend, IP/esquema/URL, rechazo de encabezados falsos, estáticos, SSE incremental y handshake/echo WSS.
- Linux: 20 bloques Bash con `bash -n`; bloques operativos equivalentes ES/EN; argumentos ASGI/RSGI aceptados por Granian; `.env` leído con DotEnv real; `nginx -t` con la configuración TLS y certificados temporales. No se ejecutó systemd.
- Docker: imagen construida con el Dockerfile documentado y una aplicación skeleton-slim-api que referencia el framework local; lockfile generado para ese fixture. Doce comprobaciones de Compose, TLS con CA local verificada, forwarding, estáticos, exclusión de privados, usuario 10001, volúmenes, SQLite/migración, recreación/configuración y cierre ASGI por SIGTERM. Se retiraron los recursos Docker exclusivos de prueba.
- 22 tests del sitio correctos. Ejemplos Python/JSON/JavaScript analizados sin errores y 3.522 imports nativos contrastados con el checkout.
- `npm run build` y postbuild correctos: 422 páginas renderizadas, 3.650 enlaces internos comprobados, traducciones, fragmentos, navegación, redirecciones, sitemap y buscador válidos.
- Revisión de navegador: las cinco guías ES muestran su SVG; un solo enlace activo por página; ancho móvil de 390 px sin desbordamiento horizontal de la página. Las tablas amplias tienen desplazamiento local. Se comprobó la navegación móvil de los seis destinos y la traducción Linux en escritorio.

Para repetir los chequeos de fuente y estructura:

```shell
python -B scripts/audit-deployment-source.py --framework-root ../framework
node scripts/validate-deployment-coverage.mjs
npm run docs:test
node scripts/check-code-examples.mjs --python ../framework/.venv/Scripts/python.exe --framework-root ../framework
npm run build
```

El auditor de fuente falla si cambian los archivos revisados; `--update` solo debe usarse después de contrastar de nuevo las guías. Los ejemplos no ejecutan instalaciones de servicios durante la construcción del sitio.

## Límites de la verificación

No se instaló un servicio WinSW ni se aplicaron las ACL o reglas de firewall del manual. No se ejecutó la receta en un host Debian/Ubuntu con systemd. TLS se verificó con certificados temporales/CA local, sin validar DNS público o emisión ACME de producción. La imagen probada utiliza el checkout local del framework, no una descarga publicada de PyPI. Estos resultados validan la configuración y los flujos descritos; no afirman que ya exista un despliegue productivo del usuario.

El checkout del framework permanece sin modificaciones. Los cambios previos de Logs y Exceptions se preservan. El servidor de documentación queda disponible en `http://localhost:4321`.
