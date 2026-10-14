---
title: "Autenticación y autorización"
description: "Orionis resuelve la identidad actual mediante sesión de navegador o token personal y aplica permisos, roles y políticas. El contexto pertenece a la petición; los servicios…"
editUrl: true
lastUpdated: false
---

Orionis resuelve la identidad actual mediante sesión de navegador o token personal y aplica permisos, roles y políticas. El contexto pertenece a la petición; los servicios compartidos no guardan un usuario global.

Para una aplicación de navegador, empieza por el acceso mediante sesión. Para scripts o integraciones que llaman a tu API, emite un token personal desde una sesión autorizada y protege la API con middleware de token. En ambos casos, añade permisos o políticas de recursos para las acciones que necesiten más que un usuario autenticado.

1. [Identidad y login de sesión](/es/security/authentication/identity-and-session): modelo, guards, login y logout.
2. [Permisos, roles y políticas](/es/security/authentication/authorization): proteger capacidades y recursos.
3. [Tokens personales](/es/security/authentication/personal-access-tokens): emitir, limitar y revocar credenciales.
4. [Recordarme y recuperación de cuentas](/es/security/authentication/account-recovery): cookies persistentes, reset y páginas predeterminadas.

Requiere Python 3.14+, modelo ORM configurado, hashing y migraciones de autenticación para persistencia. Los ejemplos de facade y repositorios necesitan una aplicación inicializada; los ejemplos de snapshots son independientes. Revisa [sesiones](/es/http/sessions), [HTTP](/es/http) y [ORM](/es/database/orm).
